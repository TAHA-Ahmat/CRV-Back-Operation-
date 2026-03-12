// ============================================
// SERVICE DE NOMMAGE DES DOCUMENTS
// ============================================
// Gère les conventions de nommage pour tous les documents

import { DOCUMENT_TYPES, getDocumentConfig, generateFilename } from '../../config/documents.config.js';

/**
 * Caractères interdits dans les noms de fichiers
 */
const FORBIDDEN_CHARS = /[<>:"|?*\/\\]/g;

/**
 * Sanitize un nom de fichier
 * @param {string} filename - Nom à nettoyer
 * @returns {string} Nom nettoyé
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Nom de fichier invalide');
  }
  return filename
    .replace(FORBIDDEN_CHARS, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Génère un nom de fichier pour un document
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @returns {string} Nom de fichier
 */
export function getFilename(documentType, entity) {
  return generateFilename(documentType, entity);
}

/**
 * Génère un nom de fichier avec horodatage (pour versions)
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @returns {string} Nom de fichier avec timestamp
 */
export function getFilenameWithTimestamp(documentType, entity) {
  const config = getDocumentConfig(documentType);
  const baseFilename = config.naming.getFilename(entity);
  const ext = baseFilename.split('.').pop();
  const name = baseFilename.replace(`.${ext}`, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${name}_${timestamp}.${ext}`;
}

/**
 * Parse un nom de fichier pour extraire les métadonnées
 * @param {string} filename - Nom de fichier
 * @returns {Object} Métadonnées extraites
 */
export function parseFilename(filename) {
  const result = {
    original: filename,
    documentType: null,
    parsed: {},
  };

  // Programme de Vol: Programme_Vols_{Nom}_v{Version}.pdf
  const programmeMatch = filename.match(/^Programme_Vols_(.+)_v(\d+)\.pdf$/);
  if (programmeMatch) {
    result.documentType = DOCUMENT_TYPES.PROGRAMME_VOL;
    result.parsed = {
      nom: programmeMatch[1].replace(/_/g, ' '),
      version: parseInt(programmeMatch[2], 10),
    };
    return result;
  }

  // CRV: CRV_{NumVol}_{Date}.pdf
  const crvMatch = filename.match(/^CRV_(.+)_(\d{4}-\d{2}-\d{2})\.pdf$/);
  if (crvMatch) {
    result.documentType = DOCUMENT_TYPES.CRV;
    result.parsed = {
      numeroVol: crvMatch[1],
      dateVol: crvMatch[2],
    };
    return result;
  }

  // Bulletin de Mouvement: Bulletin_Mouvement_{Date}.pdf
  const bulletinMatch = filename.match(/^Bulletin_Mouvement_(\d{4}-\d{2}-\d{2})\.pdf$/);
  if (bulletinMatch) {
    result.documentType = DOCUMENT_TYPES.BULLETIN_MOUVEMENT;
    result.parsed = {
      date: bulletinMatch[1],
    };
    return result;
  }

  return result;
}

/**
 * Valide un nom de fichier selon le type de document
 * @param {string} documentType - Type de document
 * @param {string} filename - Nom à valider
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFilename(documentType, filename) {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Nom de fichier vide ou invalide' };
  }

  if (filename.length > 255) {
    return { valid: false, error: 'Nom de fichier trop long (max 255 caractères)' };
  }

  if (FORBIDDEN_CHARS.test(filename)) {
    return { valid: false, error: 'Caractères interdits dans le nom de fichier' };
  }

  if (!filename.endsWith('.pdf')) {
    return { valid: false, error: 'Extension .pdf requise' };
  }

  const parsed = parseFilename(filename);
  if (parsed.documentType && parsed.documentType !== documentType) {
    return {
      valid: false,
      error: `Format de nom incorrect pour ${documentType}`,
    };
  }

  return { valid: true };
}

export default {
  sanitizeFilename,
  getFilename,
  getFilenameWithTimestamp,
  parseFilename,
  validateFilename,
};
