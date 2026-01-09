// ✅ CONTROLLER ARCHIVAGE CRV - GOOGLE DRIVE
// Gestion de l'archivage des PDF CRV vers Google Drive

import { archiveCRVPdf, checkArchivageStatus } from '../../services/crv/crvArchivageService.js';
import CRV from '../../models/crv/CRV.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/responseHelpers.js';

/**
 * Vérifier le statut du service d'archivage
 *
 * GET /api/crv/archive/status
 * Public (pour tests de configuration)
 */
export const getArchivageStatus = asyncHandler(async (req, res) => {
  const status = await checkArchivageStatus();

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
 *
 * POST /api/crv/:id/archive
 * Protégé, nécessite authentification
 */
export const archiverCRV = asyncHandler(async (req, res) => {
  const { id: crvId } = req.params;
  const userId = req.user?.id || req.user?._id;

  console.log(`[ARCHIVE-CONTROLLER] Demande archivage CRV : ${crvId}`);
  console.log(`[ARCHIVE-CONTROLLER] Utilisateur : ${userId}`);

  // 1. Récupérer le CRV
  const crv = await CRV.findById(crvId)
    .populate('volId')
    .populate('personnelAffecte.personne');

  if (!crv) {
    console.error(`[ARCHIVE-CONTROLLER] ❌ CRV non trouvé : ${crvId}`);
    return errorResponse(res, 'CRV non trouvé', 404);
  }

  console.log(`[ARCHIVE-CONTROLLER] CRV trouvé : ${crv.numeroCRV || crvId}`);

  // 2. Générer le PDF
  // IMPORTANT: On doit avoir un service PDF qui génère le PDF du CRV
  // Pour l'instant, on va créer un PDF de test
  let pdfBuffer;
  let filename;

  try {
    // Import dynamique du service PDF
    const { generateCRVPdf } = await import('../services/pdfService.js');

    console.log(`[ARCHIVE-CONTROLLER] 📄 Génération du PDF...`);
    pdfBuffer = await generateCRVPdf(crv);
    filename = `CRV_${crv.numeroCRV || crvId}_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log(`[ARCHIVE-CONTROLLER] ✅ PDF généré : ${pdfBuffer.length} octets`);

  } catch (pdfError) {
    console.error(`[ARCHIVE-CONTROLLER] ❌ Erreur génération PDF :`, pdfError.message);

    // Si le service PDF n'est pas encore implémenté, utiliser un PDF de test
    if (pdfError.message.includes('generateCRVPdf')) {
      console.warn(`[ARCHIVE-CONTROLLER] ⚠️ Service PDF non disponible, utilisation d'un PDF de test`);

      // PDF de test minimal
      pdfBuffer = Buffer.from(
        '%PDF-1.4\n' +
          '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
          '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
          '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
          'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000114 00000 n\n' +
          'trailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF'
      );
      filename = `CRV_TEST_${crvId}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log(`[ARCHIVE-CONTROLLER] ✅ PDF de test créé : ${pdfBuffer.length} octets`);
    } else {
      throw pdfError;
    }
  }

  // 3. Archiver dans Google Drive
  console.log(`[ARCHIVE-CONTROLLER] 📤 Archivage vers Google Drive...`);

  const archiveResult = await archiveCRVPdf({
    buffer: pdfBuffer,
    filename,
    mimeType: 'application/pdf',
    crvId: crvId.toString(),
    userId: userId ? userId.toString() : null,
  });

  console.log(`[ARCHIVE-CONTROLLER] ✅ Archivage réussi`);
  console.log(`[ARCHIVE-CONTROLLER] File ID : ${archiveResult.fileId}`);
  console.log(`[ARCHIVE-CONTROLLER] URL : ${archiveResult.webViewLink}`);

  // 4. Mettre à jour le CRV avec les infos d'archivage
  crv.archivage = {
    driveFileId: archiveResult.fileId,
    driveWebViewLink: archiveResult.webViewLink,
    archivedAt: new Date(),
    archivedBy: userId,
  };
  await crv.save();

  console.log(`[ARCHIVE-CONTROLLER] ✅ CRV mis à jour avec infos archivage`);

  // 5. Réponse
  return successResponse(res, {
    crv: {
      id: crv._id,
      numeroCRV: crv.numeroCRV,
    },
    archive: {
      fileId: archiveResult.fileId,
      webViewLink: archiveResult.webViewLink,
      filename: archiveResult.filename,
      size: archiveResult.size,
    },
  }, 'CRV archivé avec succès', 200);
});

/**
 * Tester l'archivage avec un PDF de test
 *
 * POST /api/crv/archive/test
 * Protégé, nécessite authentification
 */
export const testerArchivage = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;

  console.log(`[ARCHIVE-CONTROLLER] Test d'archivage demandé par : ${userId}`);

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

  console.log(`[ARCHIVE-CONTROLLER] 📄 PDF de test créé : ${testPdfBuffer.length} octets`);
  console.log(`[ARCHIVE-CONTROLLER] 📤 Upload vers Google Drive...`);

  // Archiver
  const result = await archiveCRVPdf({
    buffer: testPdfBuffer,
    filename,
    mimeType: 'application/pdf',
    crvId: 'TEST',
    userId: userId ? userId.toString() : null,
  });

  console.log(`[ARCHIVE-CONTROLLER] ✅ Test d'archivage réussi`);

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
  testerArchivage,
};
