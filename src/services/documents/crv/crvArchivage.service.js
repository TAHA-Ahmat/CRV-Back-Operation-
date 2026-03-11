// ============================================
// SERVICE D'ARCHIVAGE - CRV (UNIFIÉ)
// ============================================
// Service d'archivage des CRV utilisant l'architecture
// générique DocumentArchiver avec arborescence Drive

import mongoose from 'mongoose';
import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import { archiveDocument, checkArchiveStatus } from '../base/DocumentArchiver.js';
import { CrvGenerator } from './CrvGenerator.js';
import CRV from '../../../models/crv/CRV.js';
import { eventBus } from '../../notifications/notificationEngine.js';
import { EVENTS } from '../../notifications/eventRegistry.js';

// Instance du générateur
const generator = new CrvGenerator();

// ============================
//   ARCHIVAGE CRV
// ============================

/**
 * Génère et archive un CRV dans Google Drive
 * Crée automatiquement l'arborescence : CRV/{Année}/{Mois}/{Compagnie}/
 *
 * IDEMPOTENCE (P0#7) :
 * Si le CRV est déjà archivé (archivage.driveFileId présent), la fonction
 * retourne directement le résultat existant SANS régénérer le PDF ni
 * re-uploader vers Drive. Pour forcer un ré-archivage, passer options.force = true.
 *
 * @param {string} crvId - ID du CRV
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @param {boolean} [options.force=false] - Forcer le ré-archivage même si déjà archivé
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function archiverCRV(crvId, userId, options = {}) {
  console.log(`[CRV-ARCHIVE-UNIFIED] Début archivage CRV ${crvId}`);

  // ============================================================
  // MISSION 022 — TRANSACTION MONGODB
  // Lecture CRV + vérifications + mise à jour archivage atomiques.
  // Le PDF + Drive upload sont hors transaction (opérations externes).
  // Si le save DB échoue après Drive upload → fichier orphelin sur Drive
  // (acceptable, nettoyable manuellement, pas de corruption DB).
  // ============================================================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Récupérer le CRV (dans la transaction — verrouillage lecture)
    const crv = await CRV.findById(crvId).populate('vol').session(session);

    if (!crv) {
      const error = new Error('CRV non trouvé');
      error.status = 404;
      throw error;
    }

    // 2. Vérifier que le CRV peut être archivé
    const canArchive = canArchiveCRV(crv);
    if (!canArchive.canArchive) {
      const error = new Error(canArchive.reason);
      error.status = 400;
      throw error;
    }

    // 2b. IDEMPOTENCE (P0#7) : si déjà archivé et pas de force, retourner l'existant
    if (crv.archivage?.driveFileId && !options.force) {
      await session.commitTransaction();
      session.endSession();
      console.log(`[CRV-ARCHIVE-UNIFIED] CRV ${crv.numeroCRV} déjà archivé (idempotent)`);
      return {
        success: true, idempotent: true,
        crv: { id: crv._id, numeroCRV: crv.numeroCRV, escale: crv.escale, statut: crv.statut },
        archivage: {
          fileId: crv.archivage.driveFileId, webViewLink: crv.archivage.driveWebViewLink,
          filename: crv.archivage.filename, folderPath: crv.archivage.folderPath,
          size: crv.archivage.size, archivedAt: crv.archivage.archivedAt,
          version: crv.archivage.version
        }
      };
    }

    // 3. Générer le PDF (hors DB)
    console.log(`[CRV-ARCHIVE-UNIFIED] Génération PDF pour: ${crv.numeroCRV}`);
    const buffer = await generator.generateBuffer(crvId);

    // 4. Préparer les métadonnées pour Drive
    const vol = crv.vol || {};
    const metadata = {
      numeroCRV: crv.numeroCRV, escale: crv.escale, statut: crv.statut,
      numeroVol: vol.numeroVol || 'N/A',
      compagnie: vol.compagnieAerienne || vol.codeIATA || 'AUTRE',
      dateVol: vol.dateVol?.toISOString() || null, completude: crv.completude
    };

    const entityForArchive = {
      ...crv.toObject(), dateVol: vol.dateVol,
      compagnie: { code: vol.codeIATA || 'AUTRE' },
      codeCompagnie: vol.codeIATA || 'AUTRE',
      numeroVol: vol.numeroVol || crv.numeroCRV
    };

    // 5. Upload Drive (opération externe)
    console.log(`[CRV-ARCHIVE-UNIFIED] Archivage vers Google Drive...`);
    const archiveResult = await archiveDocument({
      documentType: DOCUMENT_TYPES.CRV, buffer,
      entity: entityForArchive, entityId: crvId, userId, metadata
    });

    // 6. Mise à jour CRV avec infos archivage (dans la transaction)
    crv.archivage = {
      driveFileId: archiveResult.fileId,
      driveWebViewLink: archiveResult.webViewLink,
      filename: archiveResult.filename,
      folderPath: archiveResult.folderPath,
      size: archiveResult.size,
      archivedAt: new Date(),
      archivedBy: userId,
      version: (crv.archivage?.version || 0) + 1
    };

    await crv.save({ session });

    // COMMIT — archivage info persisté atomiquement
    await session.commitTransaction();

    console.log(`[CRV-ARCHIVE-UNIFIED] ✅ Archivage terminé: ${archiveResult.filename}`);

    return {
      success: true,
      crv: { id: crv._id, numeroCRV: crv.numeroCRV, escale: crv.escale, statut: crv.statut },
      archivage: {
        fileId: archiveResult.fileId, webViewLink: archiveResult.webViewLink,
        filename: archiveResult.filename, folderPath: archiveResult.folderPath,
        size: archiveResult.size, archivedAt: new Date(), version: crv.archivage.version
      }
    };
  } catch (error) {
    await session.abortTransaction();

    // ── NOTIFICATION ENGINE ──────────────────────────────────────
    eventBus.emitAsync(EVENTS.CRV_ARCHIVAGE_ECHOUE, {
      crvId, userId, erreur: error.message
    });
    // ─────────────────────────────────────────────────────────────

    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Vérifie si un CRV est immuable (archivé avec succès dans Drive)
 * Un CRV immuable ne peut plus être déverrouillé ni modifié.
 *
 * @param {Object} crv - Document CRV
 * @returns {boolean} true si le CRV a été archivé (archivedAt défini)
 */
export function isCRVImmutable(crv) {
  return !!(crv?.archivage?.archivedAt);
}

/**
 * Vérifie si un CRV peut être archivé
 * @param {Object} crv - Document CRV (ou ID)
 * @returns {{canArchive: boolean, reason?: string}}
 */
export function canArchiveCRV(crv) {
  if (!crv) {
    return { canArchive: false, reason: 'CRV non trouvé' };
  }

  // Archivage autorisé uniquement après validation
  const STATUTS_AUTORISES = ['VALIDE', 'VERROUILLE'];

  if (crv.statut === 'ANNULE') {
    return { canArchive: false, reason: 'Archivage impossible : CRV annulé' };
  }

  if (!STATUTS_AUTORISES.includes(crv.statut)) {
    return { canArchive: false, reason: `Archivage impossible : le CRV doit être validé avant archivage (statut actuel: ${crv.statut})` };
  }

  return { canArchive: true };
}

/**
 * Vérifie si un CRV peut être archivé (version async avec ID)
 * @param {string} crvId - ID du CRV
 * @returns {Promise<Object>}
 */
export async function canArchiveCRVById(crvId) {
  const crv = await CRV.findById(crvId).populate('vol');

  if (!crv) {
    return { canArchive: false, reason: 'CRV non trouvé' };
  }

  const result = canArchiveCRV(crv);

  // Vérifier aussi le statut Drive
  const driveStatus = await checkArchiveStatus();
  if (!driveStatus.configured || !driveStatus.folderAccessible) {
    return {
      canArchive: false,
      reason: 'Google Drive non configuré ou inaccessible',
      driveStatus
    };
  }

  return {
    ...result,
    crv: {
      id: crv._id,
      numeroCRV: crv.numeroCRV,
      escale: crv.escale,
      statut: crv.statut,
      completude: crv.completude,
      isAlreadyArchived: !!(crv.archivage && crv.archivage.driveFileId),
      currentArchivage: crv.archivage
    }
  };
}

/**
 * Récupère les informations d'archivage d'un CRV
 * @param {string} crvId - ID du CRV
 * @returns {Promise<Object>}
 */
export async function getArchivageInfo(crvId) {
  const crv = await CRV.findById(crvId)
    .populate('archivage.archivedBy', 'nom prenom email');

  if (!crv) {
    const error = new Error('CRV non trouvé');
    error.status = 404;
    throw error;
  }

  return {
    crvId: crv._id,
    numeroCRV: crv.numeroCRV,
    escale: crv.escale,
    isArchived: !!(crv.archivage && crv.archivage.driveFileId),
    archivage: crv.archivage || null
  };
}

/**
 * Récupère l'aperçu des données PDF
 * @param {string} crvId - ID du CRV
 * @returns {Promise<Object>}
 */
export async function getPreviewData(crvId) {
  return generator.getPreviewData(crvId);
}

/**
 * Génère le PDF en buffer (sans archiver)
 * @param {string} crvId - ID du CRV
 * @returns {Promise<Buffer>}
 */
export async function genererPdfBuffer(crvId) {
  return generator.generateBuffer(crvId);
}

/**
 * Génère le PDF en stream (pour téléchargement)
 * @param {string} crvId - ID du CRV
 * @param {Object} res - Response Express
 * @param {Object} options - Options
 */
export async function genererPdfStream(crvId, res, options = {}) {
  return generator.generateStream(crvId, res, options);
}

/**
 * Vérifie le statut du service d'archivage
 * @returns {Promise<Object>}
 */
export async function getArchiveServiceStatus() {
  return checkArchiveStatus();
}

export default {
  archiverCRV,
  isCRVImmutable,
  canArchiveCRV,
  canArchiveCRVById,
  getArchivageInfo,
  getPreviewData,
  genererPdfBuffer,
  genererPdfStream,
  getArchiveServiceStatus
};
