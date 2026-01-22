// ============================================
// SERVICE DE GESTION DES DOSSIERS DOCUMENTS
// ============================================
// Gère l'arborescence des dossiers Drive pour les documents

import { DOCUMENT_TYPES, getDocumentConfig, generateFolderPath } from '../../config/documents.config.js';

/**
 * Noms des mois en français
 */
const MOIS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

/**
 * Génère le chemin complet des dossiers pour une entité
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @returns {string[]} Tableau des noms de dossiers
 */
export function getFolderPath(documentType, entity) {
  return generateFolderPath(documentType, entity);
}

/**
 * Génère le chemin sous forme de chaîne
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @param {string} separator - Séparateur (défaut: '/')
 * @returns {string}
 */
export function getFolderPathString(documentType, entity, separator = '/') {
  return getFolderPath(documentType, entity).join(separator);
}

/**
 * Retourne le dossier racine pour un type de document
 * @param {string} documentType - Type de document
 * @returns {string}
 */
export function getRootFolder(documentType) {
  const config = getDocumentConfig(documentType);
  return config.drive.dossierRacine;
}

/**
 * Génère une arborescence par année/mois
 * @param {Date} date - Date de référence
 * @returns {{annee: string, mois: string, moisNom: string}}
 */
export function getYearMonthPath(date) {
  const d = date instanceof Date ? date : new Date(date);
  const annee = d.getFullYear().toString();
  const moisNum = d.getMonth();
  const mois = String(moisNum + 1).padStart(2, '0');
  const moisNom = MOIS_FR[moisNum];

  return {
    annee,
    mois,
    moisNom,
    formatted: `${mois}-${moisNom}`,
  };
}

/**
 * Génère le chemin pour un CRV
 * @param {Object} crv - Entité CRV
 * @returns {string[]}
 */
export function getCRVFolderPath(crv) {
  const date = crv.dateVol ? new Date(crv.dateVol) : new Date();
  const { annee, formatted } = getYearMonthPath(date);
  const compagnie = crv.compagnie?.code || crv.codeCompagnie || 'AUTRE';

  return ['CRV', annee, formatted, compagnie];
}

/**
 * Génère le chemin pour un Programme de Vol
 * @param {Object} programme - Entité Programme
 * @returns {string[]}
 */
export function getProgrammeVolFolderPath(programme) {
  const date = programme.dateDebut ? new Date(programme.dateDebut) : new Date();
  const annee = date.getFullYear().toString();

  return ['Programmes de Vol', annee];
}

/**
 * Génère le chemin pour un Bulletin de Mouvement
 * @param {Object} bulletin - Entité Bulletin
 * @returns {string[]}
 */
export function getBulletinMouvementFolderPath(bulletin) {
  const date = bulletin.date ? new Date(bulletin.date) : new Date();
  const { annee, formatted } = getYearMonthPath(date);

  return ['Bulletins Mouvement', annee, formatted];
}

/**
 * Valide un chemin de dossier
 * @param {string[]} path - Chemin à valider
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFolderPath(path) {
  if (!Array.isArray(path)) {
    return { valid: false, error: 'Le chemin doit être un tableau' };
  }

  if (path.length === 0) {
    return { valid: false, error: 'Le chemin ne peut pas être vide' };
  }

  for (const segment of path) {
    if (!segment || typeof segment !== 'string') {
      return { valid: false, error: 'Segment de chemin invalide' };
    }
    if (segment.includes('/') || segment.includes('\\')) {
      return { valid: false, error: 'Les segments ne peuvent pas contenir de séparateurs' };
    }
  }

  return { valid: true };
}

/**
 * Retourne la structure d'arborescence complète pour un type
 * @param {string} documentType - Type de document
 * @returns {Object} Description de l'arborescence
 */
export function getArborescenceDescription(documentType) {
  const config = getDocumentConfig(documentType);

  const descriptions = {
    [DOCUMENT_TYPES.PROGRAMME_VOL]: {
      type: documentType,
      racine: config.drive.dossierRacine,
      structure: '/{Année}/',
      exemple: '/Programmes de Vol/2024/',
      niveaux: ['Année'],
    },
    [DOCUMENT_TYPES.CRV]: {
      type: documentType,
      racine: config.drive.dossierRacine,
      structure: '/{Année}/{Mois}/{Compagnie}/',
      exemple: '/CRV/2024/01-Janvier/TU/',
      niveaux: ['Année', 'Mois', 'Compagnie'],
    },
    [DOCUMENT_TYPES.BULLETIN_MOUVEMENT]: {
      type: documentType,
      racine: config.drive.dossierRacine,
      structure: '/{Année}/{Mois}/',
      exemple: '/Bulletins Mouvement/2024/01-Janvier/',
      niveaux: ['Année', 'Mois'],
    },
  };

  return descriptions[documentType] || null;
}

export default {
  getFolderPath,
  getFolderPathString,
  getRootFolder,
  getYearMonthPath,
  getCRVFolderPath,
  getProgrammeVolFolderPath,
  getBulletinMouvementFolderPath,
  validateFolderPath,
  getArborescenceDescription,
};
