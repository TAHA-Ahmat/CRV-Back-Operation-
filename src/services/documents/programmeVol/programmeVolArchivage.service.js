// ============================================
// SERVICE D'ARCHIVAGE - PROGRAMME DE VOL
// ============================================
// Service spécifique pour l'archivage des programmes de vols
// Utilise l'architecture générique DocumentArchiver

import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import { archiveDocument, checkArchiveStatus } from '../base/DocumentArchiver.js';
import { ProgrammeVolGenerator } from './ProgrammeVolGenerator.js';
import ProgrammeVol from '../../../models/flights/ProgrammeVol.js';

// Instance du générateur
const generator = new ProgrammeVolGenerator();

// ============================
//   ARCHIVAGE PROGRAMME
// ============================

/**
 * Génère et archive un programme de vol dans Google Drive
 *
 * @param {string} programmeId - ID du programme
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function archiverProgrammeVol(programmeId, userId, options = {}) {
  console.log(`[PROG-VOL-ARCHIVE] Début archivage programme ${programmeId}`);

  // 1. Récupérer le programme
  const programme = await ProgrammeVol.findById(programmeId);
  if (!programme) {
    const error = new Error('Programme non trouvé');
    error.status = 404;
    throw error;
  }

  // 2. Générer le PDF
  console.log(`[PROG-VOL-ARCHIVE] Génération PDF pour: ${programme.nom}`);
  const buffer = await generator.generateBuffer(programmeId);

  // 3. Archiver dans Drive
  console.log(`[PROG-VOL-ARCHIVE] Archivage vers Google Drive...`);
  const archiveResult = await archiveDocument({
    documentType: DOCUMENT_TYPES.PROGRAMME_VOL,
    buffer,
    entity: programme,
    entityId: programmeId,
    userId,
    metadata: {
      programmeNom: programme.nom,
      programmeStatut: programme.statut,
      dateDebut: programme.dateDebut?.toISOString(),
      dateFin: programme.dateFin?.toISOString(),
      nombreVols: programme.nombreVols,
      compagnies: programme.compagnies?.join(','),
    },
  });

  // 4. Mettre à jour le programme avec les infos d'archivage
  console.log(`[PROG-VOL-ARCHIVE] Mise à jour programme avec infos archivage`);
  await programme.updateArchivage(archiveResult, userId);

  console.log(`[PROG-VOL-ARCHIVE] ✅ Archivage terminé: ${archiveResult.filename}`);

  return {
    success: true,
    programme: {
      id: programme._id,
      nom: programme.nom,
      statut: programme.statut,
    },
    archivage: {
      fileId: archiveResult.fileId,
      webViewLink: archiveResult.webViewLink,
      filename: archiveResult.filename,
      folderPath: archiveResult.folderPath,
      size: archiveResult.size,
      archivedAt: new Date(),
    },
  };
}

/**
 * Vérifie si un programme peut être archivé
 * @param {string} programmeId - ID du programme
 * @returns {Promise<{canArchive: boolean, reason?: string}>}
 */
export async function canArchiveProgrammeVol(programmeId) {
  const programme = await ProgrammeVol.findById(programmeId);

  if (!programme) {
    return { canArchive: false, reason: 'Programme non trouvé' };
  }

  if (programme.nombreVols === 0) {
    return { canArchive: false, reason: 'Le programme ne contient aucun vol' };
  }

  // Vérifier le statut de l'archivage Drive
  const driveStatus = await checkArchiveStatus();
  if (!driveStatus.configured || !driveStatus.folderAccessible) {
    return {
      canArchive: false,
      reason: 'Google Drive non configuré ou inaccessible',
      driveStatus,
    };
  }

  return {
    canArchive: true,
    programme: {
      id: programme._id,
      nom: programme.nom,
      statut: programme.statut,
      nombreVols: programme.nombreVols,
      isAlreadyArchived: programme.isArchived,
      currentArchivage: programme.archivage,
    },
  };
}

/**
 * Récupère les informations d'archivage d'un programme
 * @param {string} programmeId - ID du programme
 * @returns {Promise<Object>}
 */
export async function getArchivageInfo(programmeId) {
  const programme = await ProgrammeVol.findById(programmeId)
    .populate('archivage.archivedBy', 'nom prenom email');

  if (!programme) {
    const error = new Error('Programme non trouvé');
    error.status = 404;
    throw error;
  }

  return {
    programmeId: programme._id,
    nom: programme.nom,
    isArchived: programme.isArchived,
    archivage: programme.archivage || null,
  };
}

/**
 * Récupère l'aperçu des données PDF
 * @param {string} programmeId - ID du programme
 * @returns {Promise<Object>}
 */
export async function getPreviewData(programmeId) {
  return generator.getPreviewData(programmeId);
}

/**
 * Génère le PDF en buffer (sans archiver)
 * @param {string} programmeId - ID du programme
 * @returns {Promise<Buffer>}
 */
export async function genererPdfBuffer(programmeId) {
  return generator.generateBuffer(programmeId);
}

/**
 * Génère le PDF en stream (pour téléchargement)
 * @param {string} programmeId - ID du programme
 * @param {Object} res - Response Express
 * @param {Object} options - Options
 */
export async function genererPdfStream(programmeId, res, options = {}) {
  return generator.generateStream(programmeId, res, options);
}

export default {
  archiverProgrammeVol,
  canArchiveProgrammeVol,
  getArchivageInfo,
  getPreviewData,
  genererPdfBuffer,
  genererPdfStream,
};
