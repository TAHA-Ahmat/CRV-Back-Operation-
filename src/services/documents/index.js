// ============================================
// MODULE DOCUMENTS - INDEX
// ============================================
// Point d'entrée pour le système de gestion des documents

// ============================
//   CONFIGURATION
// ============================
export {
  DOCUMENT_TYPES,
  DOCUMENTS_CONFIG,
  getDocumentConfig,
  generateFilename,
  generateFolderPath,
} from '../../config/documents.config.js';

// ============================
//   CLASSES DE BASE
// ============================
export { DocumentGenerator } from './base/DocumentGenerator.js';
export {
  archiveDocument,
  checkArchiveStatus,
  getArchivedFileInfo,
  deleteArchivedFile,
  ensureFolderPath,
} from './base/DocumentArchiver.js';

// ============================
//   SERVICES
// ============================
export {
  sanitizeFilename,
  getFilename,
  getFilenameWithTimestamp,
  parseFilename,
  validateFilename,
} from './documentNaming.service.js';

export {
  getFolderPath,
  getFolderPathString,
  getRootFolder,
  getYearMonthPath,
  getCRVFolderPath,
  getProgrammeVolFolderPath,
  getBulletinMouvementFolderPath,
  validateFolderPath,
  getArborescenceDescription,
} from './documentFolder.service.js';

// ============================
//   SERVICE PRINCIPAL
// ============================
export {
  registerGenerator,
  getGenerator,
  hasGenerator,
  generatePdfBuffer,
  generatePdfStream,
  generatePdfBase64,
  getPreviewData,
  generateAndArchive,
  archiveExistingPdf,
  getDocumentInfo,
  listDocumentTypes,
  getArchiveServiceStatus,
} from './document.service.js';

// ============================
//   GÉNÉRATEURS SPÉCIFIQUES
// ============================

// Programme de Vol
export { ProgrammeVolGenerator } from './programmeVol/ProgrammeVolGenerator.js';
export {
  archiverProgrammeVol,
  canArchiveProgrammeVol,
  getArchivageInfo as getProgrammeArchivageInfo,
} from './programmeVol/programmeVolArchivage.service.js';

// CRV (Compte Rendu de Vol)
export { CrvGenerator } from './crv/CrvGenerator.js';
export {
  archiverCRV,
  canArchiveCRV,
  canArchiveCRVById,
  getArchivageInfo as getCrvArchivageInfo,
} from './crv/crvArchivage.service.js';

// ============================
//   DEFAULT EXPORT
// ============================
import documentService from './document.service.js';
export default documentService;
