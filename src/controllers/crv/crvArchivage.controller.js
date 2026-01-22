// ============================================
// CONTROLLER ARCHIVAGE CRV - UNIFIÉ
// ============================================
// Gestion de l'archivage des PDF CRV vers Google Drive
// Utilise l'architecture unifiée DocumentArchiver

import * as crvArchivageService from '../../services/documents/crv/crvArchivage.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/responseHelpers.js';

/**
 * Vérifier le statut du service d'archivage
 *
 * GET /api/crv/archive/status
 * Public (pour tests de configuration)
 */
export const getArchivageStatus = asyncHandler(async (req, res) => {
  const status = await crvArchivageService.getArchiveServiceStatus();

  return res.status(200).json({
    success: true,
    data: status,
    message: status.configured
      ? 'Service d\'archivage configuré'
      : 'Service d\'archivage non configuré',
  });
});

/**
 * Archiver un CRV vers Google Drive
 * Utilise l'architecture unifiée avec arborescence automatique
 *
 * POST /api/crv/:id/archive
 * Protégé, nécessite authentification
 */
export const archiverCRV = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;
  const userId = req.user?.id || req.user?._id;

  console.log(`[CRV-ARCHIVE-CTRL] Demande archivage CRV : ${crvId}`);
  console.log(`[CRV-ARCHIVE-CTRL] Utilisateur : ${userId}`);

  try {
    const resultat = await crvArchivageService.archiverCRV(crvId, userId);

    console.log(`[CRV-ARCHIVE-CTRL] ✅ Archivage réussi`);
    console.log(`[CRV-ARCHIVE-CTRL] File ID : ${resultat.archivage.fileId}`);
    console.log(`[CRV-ARCHIVE-CTRL] Dossier : ${resultat.archivage.folderPath}`);

    return successResponse(res, resultat, 'CRV archivé avec succès', 200);

  } catch (error) {
    console.error(`[CRV-ARCHIVE-CTRL] ❌ Erreur :`, error.message);

    if (error.message.includes('non trouvé')) {
      return errorResponse(res, error.message, 404);
    }

    if (error.message.includes('non configuré') || error.message.includes('inaccessible')) {
      return errorResponse(res, error.message, 503);
    }

    if (error.message.includes('Impossible')) {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(res, error.message || 'Erreur lors de l\'archivage', error.status || 500);
  }
});

/**
 * Vérifier si un CRV peut être archivé
 *
 * GET /api/crv/:id/archive/status
 * Protégé
 */
export const verifierArchivageCRV = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;

  const status = await crvArchivageService.canArchiveCRVById(crvId);

  return res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * Obtenir les informations d'archivage d'un CRV
 *
 * GET /api/crv/:id/archivage
 * Protégé
 */
export const obtenirInfosArchivage = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;

  try {
    const infos = await crvArchivageService.getArchivageInfo(crvId);

    return res.status(200).json({
      success: true,
      data: infos
    });

  } catch (error) {
    if (error.message.includes('non trouvé')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message, 500);
  }
});

/**
 * Télécharger le PDF d'un CRV
 *
 * GET /api/crv/:id/telecharger-pdf
 * Protégé
 */
export const telechargerPDF = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;

  try {
    await crvArchivageService.genererPdfStream(crvId, res);
  } catch (error) {
    if (!res.headersSent) {
      if (error.message.includes('non trouvé')) {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message || 'Erreur génération PDF', 500);
    }
  }
});

/**
 * Obtenir le PDF en base64 (preview)
 *
 * GET /api/crv/:id/pdf-base64
 * Protégé
 */
export const obtenirPDFBase64 = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;

  try {
    const buffer = await crvArchivageService.genererPdfBuffer(crvId);

    return res.status(200).json({
      success: true,
      data: {
        base64: buffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    });

  } catch (error) {
    if (error.message.includes('non trouvé')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message || 'Erreur génération PDF', 500);
  }
});

/**
 * Obtenir l'aperçu des données PDF (JSON)
 *
 * GET /api/crv/:id/export-pdf
 * Protégé
 */
export const obtenirDonneesPDF = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;

  try {
    const donnees = await crvArchivageService.getPreviewData(crvId);

    return res.status(200).json({
      success: true,
      data: donnees
    });

  } catch (error) {
    if (error.message.includes('non trouvé')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message || 'Erreur récupération données', 500);
  }
});

/**
 * Tester l'archivage avec un PDF de test
 *
 * POST /api/crv/archive/test
 * Protégé, nécessite authentification
 */
export const testerArchivage = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;

  console.log(`[CRV-ARCHIVE-CTRL] Test d'archivage demandé par : ${userId}`);

  // Importer le service d'archivage bas niveau pour le test
  const { archiveCRVPdf } = await import('../../services/crv/crvArchivageService.js');

  // Créer un PDF de test minimal
  const testPdfBuffer = Buffer.from(
    '%PDF-1.4\n' +
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
      '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000114 00000 n\n' +
      'trailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF'
  );

  const filename = `TEST_ARCHIVE_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;

  const result = await archiveCRVPdf({
    buffer: testPdfBuffer,
    filename,
    mimeType: 'application/pdf',
    crvId: 'TEST',
    userId: userId ? userId.toString() : null,
  });

  console.log(`[CRV-ARCHIVE-CTRL] ✅ Test d'archivage réussi`);

  return successResponse(res, {
    test: true,
    archive: {
      fileId: result.fileId,
      webViewLink: result.webViewLink,
      filename: result.filename,
      size: result.size,
    },
  }, 'Test d\'archivage réussi', 200);
});

export default {
  getArchivageStatus,
  archiverCRV,
  verifierArchivageCRV,
  obtenirInfosArchivage,
  telechargerPDF,
  obtenirPDFBase64,
  obtenirDonneesPDF,
  testerArchivage,
};
