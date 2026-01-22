// ============================================
// CONFIGURATION CENTRALISÉE DES DOCUMENTS
// ============================================
// Définit les paramètres pour chaque type de document :
// - Programme de Vol
// - CRV (Compte Rendu de Vol)
// - Bulletin de Mouvement

/**
 * Types de documents supportés
 */
export const DOCUMENT_TYPES = {
  PROGRAMME_VOL: 'programmeVol',
  CRV: 'crv',
  BULLETIN_MOUVEMENT: 'bulletinMouvement',
};

/**
 * Configuration par type de document
 */
export const DOCUMENTS_CONFIG = {
  // ========================================
  // PROGRAMME DE VOL
  // ========================================
  [DOCUMENT_TYPES.PROGRAMME_VOL]: {
    // Identifiant unique
    type: DOCUMENT_TYPES.PROGRAMME_VOL,

    // Nom affichable
    label: 'Programme de Vol',

    // Configuration PDF
    pdf: {
      format: 'A4',
      orientation: 'landscape',
      mimeType: 'application/pdf',
    },

    // Structure dossier Drive
    drive: {
      dossierRacine: 'Programmes de Vol',
      // Fonction pour générer le chemin des sous-dossiers
      // Retourne un tableau de noms de dossiers
      getFolderPath: (entity) => {
        const annee = entity.dateDebut
          ? new Date(entity.dateDebut).getFullYear().toString()
          : new Date().getFullYear().toString();
        return [annee];
      },
    },

    // Convention de nommage
    naming: {
      // Pattern: Programme_Vols_{Nom}_{Version}.pdf
      getFilename: (entity) => {
        const nom = entity.nom || 'Programme';
        const version = entity.version || 1;
        const safeName = nom.replace(/[<>:"|?*\/\\]/g, '_').replace(/\s+/g, '_');
        return `Programme_Vols_${safeName}_v${version}.pdf`;
      },
    },

    // Criticité archivage
    archivage: {
      obligatoire: false,
      criticite: 'moyenne',
      retentionJours: 365 * 5, // 5 ans
    },
  },

  // ========================================
  // CRV (Compte Rendu de Vol)
  // ========================================
  [DOCUMENT_TYPES.CRV]: {
    type: DOCUMENT_TYPES.CRV,
    label: 'Compte Rendu de Vol',

    pdf: {
      format: 'A4',
      orientation: 'portrait',
      mimeType: 'application/pdf',
    },

    drive: {
      dossierRacine: 'CRV',
      getFolderPath: (entity) => {
        const date = entity.dateVol ? new Date(entity.dateVol) : new Date();
        const annee = date.getFullYear().toString();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const nomMois = [
          'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
        ][date.getMonth()];
        const compagnie = entity.compagnie?.code || entity.codeCompagnie || 'AUTRE';
        return [annee, `${mois}-${nomMois}`, compagnie];
      },
    },

    naming: {
      // Pattern: CRV_{NumVol}_{Date}.pdf
      getFilename: (entity) => {
        const numVol = entity.numeroVol || 'XXXX';
        const date = entity.dateVol
          ? new Date(entity.dateVol).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        return `CRV_${numVol}_${date}.pdf`;
      },
    },

    archivage: {
      obligatoire: true, // Obligation légale
      criticite: 'haute',
      retentionJours: 365 * 10, // 10 ans (réglementaire)
    },
  },

  // ========================================
  // BULLETIN DE MOUVEMENT
  // ========================================
  [DOCUMENT_TYPES.BULLETIN_MOUVEMENT]: {
    type: DOCUMENT_TYPES.BULLETIN_MOUVEMENT,
    label: 'Bulletin de Mouvement',

    pdf: {
      format: 'A4',
      orientation: 'landscape',
      mimeType: 'application/pdf',
    },

    drive: {
      dossierRacine: 'Bulletins Mouvement',
      getFolderPath: (entity) => {
        // Utiliser dateDebut du bulletin
        const date = entity.dateDebut ? new Date(entity.dateDebut) : new Date();
        const annee = date.getFullYear().toString();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const nomMois = [
          'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
        ][date.getMonth()];
        const escale = entity.escale || 'ESCALE';
        return [annee, `${mois}-${nomMois}`, escale];
      },
    },

    naming: {
      // Pattern: Bulletin_{Escale}_S{Semaine}_{DateDebut}_v{Version}.pdf
      getFilename: (entity) => {
        const escale = entity.escale || 'ESCALE';
        const semaine = entity.semaine || '00';
        const dateDebut = entity.dateDebut
          ? new Date(entity.dateDebut).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        const version = entity.archivage?.version || 1;
        return `Bulletin_${escale}_S${semaine}_${dateDebut}_v${version}.pdf`;
      },
    },

    archivage: {
      obligatoire: false,
      criticite: 'moyenne-haute',
      retentionJours: 365 * 5, // 5 ans
    },
  },
};

/**
 * Récupère la configuration d'un type de document
 * @param {string} documentType - Type de document (DOCUMENT_TYPES)
 * @returns {Object} Configuration du document
 */
export function getDocumentConfig(documentType) {
  const config = DOCUMENTS_CONFIG[documentType];
  if (!config) {
    throw new Error(`Type de document inconnu: ${documentType}`);
  }
  return config;
}

/**
 * Génère le nom de fichier pour une entité
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @returns {string} Nom du fichier
 */
export function generateFilename(documentType, entity) {
  const config = getDocumentConfig(documentType);
  return config.naming.getFilename(entity);
}

/**
 * Génère le chemin des dossiers Drive pour une entité
 * @param {string} documentType - Type de document
 * @param {Object} entity - Entité source
 * @returns {string[]} Tableau des noms de dossiers
 */
export function generateFolderPath(documentType, entity) {
  const config = getDocumentConfig(documentType);
  const dossierRacine = config.drive.dossierRacine;
  const sousDossiers = config.drive.getFolderPath(entity);
  return [dossierRacine, ...sousDossiers];
}

export default {
  DOCUMENT_TYPES,
  DOCUMENTS_CONFIG,
  getDocumentConfig,
  generateFilename,
  generateFolderPath,
};
