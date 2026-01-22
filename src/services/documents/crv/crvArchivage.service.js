// ============================================
// SERVICE D'ARCHIVAGE - CRV (UNIFIÉ)
// ============================================
// Service d'archivage des CRV utilisant l'architecture
// générique DocumentArchiver avec arborescence Drive

import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import { archiveDocument, checkArchiveStatus } from '../base/DocumentArchiver.js';
import { CrvGenerator } from './CrvGenerator.js';
import CRV from '../../../models/crv/CRV.js';

// Instance du générateur
const generator = new CrvGenerator();

// ============================
//   ARCHIVAGE CRV
// ============================

/**
 * Génère et archive un CRV dans Google Drive
 * Crée automatiquement l'arborescence : CRV/{Année}/{Mois}/{Compagnie}/
 *
 * @param {string} crvId - ID du CRV
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function archiverCRV(crvId, userId, options = {}) {
  console.log(`[CRV-ARCHIVE-UNIFIED] Début archivage CRV ${crvId}`);

  // 1. Récupérer le CRV avec ses relations
  const crv = await CRV.findById(crvId).populate('vol');

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

  // 3. Générer le PDF
  console.log(`[CRV-ARCHIVE-UNIFIED] Génération PDF pour: ${crv.numeroCRV}`);
  const buffer = await generator.generateBuffer(crvId);

  // 4. Préparer les métadonnées pour Drive
  const vol = crv.vol || {};
  const metadata = {
    numeroCRV: crv.numeroCRV,
    escale: crv.escale,
    statut: crv.statut,
    numeroVol: vol.numeroVol || 'N/A',
    compagnie: vol.compagnieAerienne || vol.codeIATA || 'AUTRE',
    dateVol: vol.dateVol?.toISOString() || null,
    completude: crv.completude
  };

  // 5. Créer une entité enrichie pour le nommage/dossiers
  // La config documents.config.js attend certains champs
  const entityForArchive = {
    ...crv.toObject(),
    dateVol: vol.dateVol,
    compagnie: { code: vol.codeIATA || 'AUTRE' },
    codeCompagnie: vol.codeIATA || 'AUTRE',
    numeroVol: vol.numeroVol || crv.numeroCRV
  };

  // 6. Archiver dans Drive (crée l'arborescence automatiquement)
  console.log(`[CRV-ARCHIVE-UNIFIED] Archivage vers Google Drive...`);
  const archiveResult = await archiveDocument({
    documentType: DOCUMENT_TYPES.CRV,
    buffer,
    entity: entityForArchive,
    entityId: crvId,
    userId,
    metadata
  });

  // 7. Mettre à jour le CRV avec les infos d'archivage
  console.log(`[CRV-ARCHIVE-UNIFIED] Mise à jour CRV avec infos archivage`);

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

  await crv.save();

  console.log(`[CRV-ARCHIVE-UNIFIED] ✅ Archivage terminé: ${archiveResult.filename}`);
  console.log(`[CRV-ARCHIVE-UNIFIED] Dossier: ${archiveResult.folderPath}`);

  return {
    success: true,
    crv: {
      id: crv._id,
      numeroCRV: crv.numeroCRV,
      escale: crv.escale,
      statut: crv.statut
    },
    archivage: {
      fileId: archiveResult.fileId,
      webViewLink: archiveResult.webViewLink,
      filename: archiveResult.filename,
      folderPath: archiveResult.folderPath,
      size: archiveResult.size,
      archivedAt: new Date(),
      version: crv.archivage.version
    }
  };
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

  // On peut archiver à tout moment sauf si annulé
  if (crv.statut === 'ANNULE') {
    return { canArchive: false, reason: 'Impossible d\'archiver un CRV annulé' };
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
  canArchiveCRV,
  canArchiveCRVById,
  getArchivageInfo,
  getPreviewData,
  genererPdfBuffer,
  genererPdfStream,
  getArchiveServiceStatus
};
