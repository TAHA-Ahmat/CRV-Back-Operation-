// ============================================
// SERVICE D'ARCHIVAGE - BULLETIN DE MOUVEMENT
// ============================================
// Service specifique pour l'archivage des bulletins de mouvement
// Utilise l'architecture generique DocumentArchiver

import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import { archiveDocument, checkArchiveStatus } from '../base/DocumentArchiver.js';
import BulletinMouvement from '../../../models/bulletin/BulletinMouvement.js';
import { BulletinMouvementGenerator } from './BulletinMouvementGenerator.js';

// Instance du generateur
const generator = new BulletinMouvementGenerator();

// ============================
//   ARCHIVAGE BULLETIN
// ============================

/**
 * Genere et archive un bulletin de mouvement dans Google Drive
 *
 * @param {string} bulletinId - ID du bulletin
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplementaires
 * @returns {Promise<Object>} Resultat de l'archivage
 */
export async function archiverBulletin(bulletinId, userId, options = {}) {
  console.log(`[BULLETIN-ARCHIVE] Debut archivage bulletin ${bulletinId}`);

  // 1. Recuperer le bulletin
  const bulletin = await BulletinMouvement.findById(bulletinId);
  if (!bulletin) {
    const error = new Error('Bulletin non trouve');
    error.status = 404;
    throw error;
  }

  // 2. Verifier que le bulletin peut etre archive
  if (bulletin.statut !== 'PUBLIE' && bulletin.statut !== 'ARCHIVE') {
    const error = new Error('Seuls les bulletins publies peuvent etre archives');
    error.status = 400;
    throw error;
  }

  // 3. Generer le PDF
  console.log(`[BULLETIN-ARCHIVE] Generation PDF pour: ${bulletin.numeroBulletin}`);
  const buffer = await generator.generateBuffer(bulletinId);

  // 4. Archiver dans Drive
  console.log(`[BULLETIN-ARCHIVE] Archivage vers Google Drive...`);
  const archiveResult = await archiveDocument({
    documentType: DOCUMENT_TYPES.BULLETIN_MOUVEMENT,
    buffer,
    entity: bulletin,
    entityId: bulletinId,
    userId,
    metadata: {
      numeroBulletin: bulletin.numeroBulletin,
      escale: bulletin.escale,
      semaine: bulletin.semaine,
      annee: bulletin.annee,
      dateDebut: bulletin.dateDebut?.toISOString(),
      dateFin: bulletin.dateFin?.toISOString(),
      nombreMouvements: bulletin.nombreMouvements,
      nombreMouvementsProgramme: bulletin.nombreMouvementsProgramme,
      nombreMouvementsHorsProgramme: bulletin.nombreMouvementsHorsProgramme,
      compagnies: bulletin.compagnies?.join(','),
      statut: bulletin.statut,
    },
  });

  // 5. Mettre a jour le bulletin avec les infos d'archivage
  console.log(`[BULLETIN-ARCHIVE] Mise a jour bulletin avec infos archivage`);
  await bulletin.updateArchivage(archiveResult, userId);

  console.log(`[BULLETIN-ARCHIVE] Archivage termine: ${archiveResult.filename}`);

  return {
    success: true,
    bulletin: {
      id: bulletin._id,
      numeroBulletin: bulletin.numeroBulletin,
      escale: bulletin.escale,
      statut: bulletin.statut,
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
 * Verifie si un bulletin peut etre archive
 * @param {string} bulletinId - ID du bulletin
 * @returns {Promise<{canArchive: boolean, reason?: string}>}
 */
export async function canArchiveBulletin(bulletinId) {
  const bulletin = await BulletinMouvement.findById(bulletinId);

  if (!bulletin) {
    return { canArchive: false, reason: 'Bulletin non trouve' };
  }

  if (bulletin.statut === 'BROUILLON') {
    return { canArchive: false, reason: 'Le bulletin doit etre publie avant archivage' };
  }

  if (bulletin.nombreMouvements === 0) {
    return { canArchive: false, reason: 'Le bulletin ne contient aucun mouvement' };
  }

  // Verifier le statut de l'archivage Drive
  const driveStatus = await checkArchiveStatus();
  if (!driveStatus.configured || !driveStatus.folderAccessible) {
    return {
      canArchive: false,
      reason: 'Google Drive non configure ou inaccessible',
      driveStatus,
    };
  }

  return {
    canArchive: true,
    bulletin: {
      id: bulletin._id,
      numeroBulletin: bulletin.numeroBulletin,
      escale: bulletin.escale,
      statut: bulletin.statut,
      nombreMouvements: bulletin.nombreMouvements,
      isAlreadyArchived: bulletin.isArchived,
      currentArchivage: bulletin.archivage,
    },
  };
}

/**
 * Recupere les informations d'archivage d'un bulletin
 * @param {string} bulletinId - ID du bulletin
 * @returns {Promise<Object>}
 */
export async function getArchivageInfo(bulletinId) {
  const bulletin = await BulletinMouvement.findById(bulletinId)
    .populate('archivage.archivedBy', 'nom prenom email');

  if (!bulletin) {
    const error = new Error('Bulletin non trouve');
    error.status = 404;
    throw error;
  }

  return {
    bulletinId: bulletin._id,
    numeroBulletin: bulletin.numeroBulletin,
    escale: bulletin.escale,
    isArchived: bulletin.isArchived,
    archivage: bulletin.archivage || null,
  };
}

/**
 * Recupere l'apercu des donnees PDF
 * @param {string} bulletinId - ID du bulletin
 * @returns {Promise<Object>}
 */
export async function getPreviewData(bulletinId) {
  return generator.getPreviewData(bulletinId);
}

/**
 * Genere le PDF en buffer (sans archiver)
 * @param {string} bulletinId - ID du bulletin
 * @returns {Promise<Buffer>}
 */
export async function genererPdfBuffer(bulletinId) {
  return generator.generateBuffer(bulletinId);
}

/**
 * Genere le PDF en stream (pour telechargement)
 * @param {string} bulletinId - ID du bulletin
 * @param {Object} res - Response Express
 * @param {Object} options - Options
 */
export async function genererPdfStream(bulletinId, res, options = {}) {
  return generator.generateStream(bulletinId, res, options);
}

export default {
  archiverBulletin,
  canArchiveBulletin,
  getArchivageInfo,
  getPreviewData,
  genererPdfBuffer,
  genererPdfStream,
};
