// ============================================
// SERVICE PRINCIPAL - GESTION DES DOCUMENTS
// ============================================
// Point d'entrée unifié pour la génération et l'archivage
// de tous les types de documents

import { DOCUMENT_TYPES, getDocumentConfig } from '../../config/documents.config.js';
import { archiveDocument, checkArchiveStatus, getArchivedFileInfo, deleteArchivedFile } from './base/DocumentArchiver.js';
import { getFilename, getFilenameWithTimestamp, sanitizeFilename } from './documentNaming.service.js';
import { getFolderPath, getFolderPathString, getArborescenceDescription } from './documentFolder.service.js';

/**
 * Registre des générateurs de documents
 * Chaque type de document doit enregistrer son générateur ici
 */
const generators = new Map();

/**
 * Enregistre un générateur pour un type de document
 * @param {string} documentType - Type de document
 * @param {DocumentGenerator} generator - Instance du générateur
 */
export function registerGenerator(documentType, generator) {
  if (!DOCUMENT_TYPES[documentType] && !Object.values(DOCUMENT_TYPES).includes(documentType)) {
    throw new Error(`Type de document inconnu: ${documentType}`);
  }
  generators.set(documentType, generator);
  console.log(`[DOC-SERVICE] Générateur enregistré pour: ${documentType}`);
}

/**
 * Récupère un générateur enregistré
 * @param {string} documentType - Type de document
 * @returns {DocumentGenerator|null}
 */
export function getGenerator(documentType) {
  return generators.get(documentType) || null;
}

/**
 * Vérifie si un générateur est disponible
 * @param {string} documentType - Type de document
 * @returns {boolean}
 */
export function hasGenerator(documentType) {
  return generators.has(documentType);
}

// ============================
//   GÉNÉRATION PDF
// ============================

/**
 * Génère un PDF en Buffer
 * @param {string} documentType - Type de document
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<{buffer: Buffer, entity: Object, filename: string}>}
 */
export async function generatePdfBuffer(documentType, entityId) {
  const generator = getGenerator(documentType);
  if (!generator) {
    throw new Error(`Aucun générateur disponible pour: ${documentType}`);
  }

  const buffer = await generator.generateBuffer(entityId);
  const { entity } = await generator.fetchData(entityId);
  const filename = generator.getFilename(entity);

  return { buffer, entity, filename };
}

/**
 * Génère un PDF en stream (pour téléchargement)
 * @param {string} documentType - Type de document
 * @param {string} entityId - ID de l'entité
 * @param {Object} res - Response Express
 * @param {Object} options - Options
 */
export async function generatePdfStream(documentType, entityId, res, options = {}) {
  const generator = getGenerator(documentType);
  if (!generator) {
    throw new Error(`Aucun générateur disponible pour: ${documentType}`);
  }

  await generator.generateStream(entityId, res, options);
}

/**
 * Génère un PDF en base64 (pour preview)
 * @param {string} documentType - Type de document
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<{base64: string, filename: string}>}
 */
export async function generatePdfBase64(documentType, entityId) {
  const generator = getGenerator(documentType);
  if (!generator) {
    throw new Error(`Aucun générateur disponible pour: ${documentType}`);
  }

  const base64 = await generator.generateBase64(entityId);
  const { entity } = await generator.fetchData(entityId);
  const filename = generator.getFilename(entity);

  return { base64, filename };
}

/**
 * Récupère les données d'aperçu
 * @param {string} documentType - Type de document
 * @param {string} entityId - ID de l'entité
 * @returns {Promise<Object>}
 */
export async function getPreviewData(documentType, entityId) {
  const generator = getGenerator(documentType);
  if (!generator) {
    throw new Error(`Aucun générateur disponible pour: ${documentType}`);
  }

  return generator.getPreviewData(entityId);
}

// ============================
//   ARCHIVAGE DRIVE
// ============================

/**
 * Génère et archive un document dans Drive
 * @param {string} documentType - Type de document
 * @param {string} entityId - ID de l'entité
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function generateAndArchive(documentType, entityId, userId, options = {}) {
  // 1. Générer le PDF
  const { buffer, entity, filename } = await generatePdfBuffer(documentType, entityId);

  // 2. Archiver dans Drive
  const result = await archiveDocument({
    documentType,
    buffer,
    entity,
    entityId,
    userId,
    customFilename: options.customFilename || filename,
    metadata: options.metadata || {},
  });

  return {
    ...result,
    generatedFilename: filename,
    entityId,
  };
}

/**
 * Archive un PDF déjà généré
 * @param {string} documentType - Type de document
 * @param {Buffer} buffer - Buffer du PDF
 * @param {Object} entity - Entité source
 * @param {string} entityId - ID de l'entité
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>}
 */
export async function archiveExistingPdf(documentType, buffer, entity, entityId, userId, options = {}) {
  const filename = options.customFilename || getFilename(documentType, entity);

  return archiveDocument({
    documentType,
    buffer,
    entity,
    entityId,
    userId,
    customFilename: filename,
    metadata: options.metadata || {},
  });
}

// ============================
//   UTILITAIRES
// ============================

/**
 * Récupère les infos de configuration pour un type
 * @param {string} documentType - Type de document
 * @returns {Object}
 */
export function getDocumentInfo(documentType) {
  const config = getDocumentConfig(documentType);
  const arborescence = getArborescenceDescription(documentType);
  const hasGen = hasGenerator(documentType);

  return {
    type: documentType,
    label: config.label,
    pdf: config.pdf,
    archivage: config.archivage,
    arborescence,
    generatorAvailable: hasGen,
  };
}

/**
 * Liste tous les types de documents disponibles
 * @returns {Object[]}
 */
export function listDocumentTypes() {
  return Object.values(DOCUMENT_TYPES).map(type => ({
    type,
    ...getDocumentInfo(type),
  }));
}

/**
 * Vérifie l'état du service d'archivage
 * @returns {Promise<Object>}
 */
export async function getArchiveServiceStatus() {
  const status = await checkArchiveStatus();

  return {
    ...status,
    registeredGenerators: Array.from(generators.keys()),
    documentTypes: Object.values(DOCUMENT_TYPES),
  };
}

// ============================
//   EXPORTS
// ============================

export {
  // Types
  DOCUMENT_TYPES,

  // Config
  getDocumentConfig,

  // Nommage
  getFilename,
  getFilenameWithTimestamp,
  sanitizeFilename,

  // Dossiers
  getFolderPath,
  getFolderPathString,

  // Archivage direct
  checkArchiveStatus,
  getArchivedFileInfo,
  deleteArchivedFile,
};

export default {
  // Générateurs
  registerGenerator,
  getGenerator,
  hasGenerator,

  // Génération PDF
  generatePdfBuffer,
  generatePdfStream,
  generatePdfBase64,
  getPreviewData,

  // Archivage
  generateAndArchive,
  archiveExistingPdf,

  // Utilitaires
  getDocumentInfo,
  listDocumentTypes,
  getArchiveServiceStatus,

  // Types
  DOCUMENT_TYPES,
};
