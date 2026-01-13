import * as volProgrammeService from '../../services/flights/volProgramme.service.js';
import * as programmeVolPdfService from '../../services/flights/programmeVolPdf.service.js';

/**
 * CONTRÔLEUR VOLS PROGRAMME
 *
 * Gère les requêtes HTTP pour les vols individuels dans un programme.
 * Chaque vol appartient à un ProgrammeVol (conteneur).
 *
 * ENDPOINTS:
 * - POST   /api/programmes-vol/:programmeId/vols        → Ajouter un vol
 * - GET    /api/programmes-vol/:programmeId/vols        → Lister les vols
 * - GET    /api/programmes-vol/:programmeId/vols/:id    → Obtenir un vol
 * - PATCH  /api/programmes-vol/:programmeId/vols/:id    → Modifier un vol
 * - DELETE /api/programmes-vol/:programmeId/vols/:id    → Supprimer un vol
 * - GET    /api/programmes-vol/:programmeId/vols/jour/:jour → Vols par jour
 * - GET    /api/programmes-vol/:programmeId/vols/recherche  → Rechercher
 * - GET    /api/programmes-vol/:programmeId/vols/compagnie/:code → Par compagnie
 * - POST   /api/programmes-vol/:programmeId/vols/import → Import bulk
 * - PATCH  /api/programmes-vol/:programmeId/vols/reorganiser → Réorganiser
 * - GET    /api/programmes-vol/:programmeId/export-pdf  → Export PDF data
 */

// ══════════════════════════════════════════════════════════════════════════
// CRUD DE BASE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Ajouter un vol au programme
 * POST /api/programmes-vol/:programmeId/vols
 */
export const ajouterVol = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programmeId } = req.params;
    const donneesVol = req.body;

    // Validation basique
    if (!donneesVol.numeroVol) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de vol est requis'
      });
    }

    if (!donneesVol.joursSemaine || donneesVol.joursSemaine.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un jour de la semaine est requis'
      });
    }

    const vol = await volProgrammeService.ajouterVol(programmeId, donneesVol, userId);

    res.status(201).json({
      success: true,
      message: `Vol ${vol.numeroVol} ajouté au programme`,
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans ajouterVol:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible') || error.message.includes('existe déjà')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout du vol'
    });
  }
};

/**
 * Obtenir les vols d'un programme
 * GET /api/programmes-vol/:programmeId/vols
 */
export const obtenirVols = async (req, res) => {
  try {
    const { programmeId } = req.params;
    const options = {
      tri: req.query.tri || 'ordre',
      ordre: req.query.ordre || 'asc'
    };

    const vols = await volProgrammeService.obtenirVolsDuProgramme(programmeId, options);

    res.status(200).json({
      success: true,
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans obtenirVols:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des vols'
    });
  }
};

/**
 * Obtenir un vol par ID
 * GET /api/programmes-vol/:programmeId/vols/:id
 */
export const obtenirVolParId = async (req, res) => {
  try {
    const { programmeId, id } = req.params;
    const vol = await volProgrammeService.obtenirVolParId(programmeId, id);

    res.status(200).json({
      success: true,
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans obtenirVolParId:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du vol'
    });
  }
};

/**
 * Modifier un vol
 * PATCH /api/programmes-vol/:programmeId/vols/:id
 */
export const modifierVol = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programmeId, id } = req.params;
    const modifications = req.body;

    const vol = await volProgrammeService.modifierVol(programmeId, id, modifications, userId);

    res.status(200).json({
      success: true,
      message: `Vol ${vol.numeroVol} mis à jour`,
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans modifierVol:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la modification du vol'
    });
  }
};

/**
 * Supprimer un vol
 * DELETE /api/programmes-vol/:programmeId/vols/:id
 */
export const supprimerVol = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programmeId, id } = req.params;

    const resultat = await volProgrammeService.supprimerVol(programmeId, id, userId);

    res.status(200).json({
      success: true,
      message: resultat.message
    });

  } catch (error) {
    console.error('Erreur dans supprimerVol:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du vol'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// FILTRES ET RECHERCHE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtenir les vols d'un jour spécifique
 * GET /api/programmes-vol/:programmeId/vols/jour/:jour
 */
export const obtenirVolsParJour = async (req, res) => {
  try {
    const { programmeId, jour } = req.params;
    const jourNum = parseInt(jour);

    if (isNaN(jourNum) || jourNum < 0 || jourNum > 6) {
      return res.status(400).json({
        success: false,
        message: 'Le jour doit être un nombre entre 0 (dimanche) et 6 (samedi)'
      });
    }

    const vols = await volProgrammeService.obtenirVolsParJour(programmeId, jourNum);

    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    res.status(200).json({
      success: true,
      jour: joursNoms[jourNum],
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans obtenirVolsParJour:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des vols par jour'
    });
  }
};

/**
 * Rechercher des vols par numéro
 * GET /api/programmes-vol/:programmeId/vols/recherche
 */
export const rechercherVols = async (req, res) => {
  try {
    const { programmeId } = req.params;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    const vols = await volProgrammeService.rechercherParNumero(programmeId, q);

    res.status(200).json({
      success: true,
      recherche: q,
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans rechercherVols:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recherche'
    });
  }
};

/**
 * Obtenir les vols d'une compagnie
 * GET /api/programmes-vol/:programmeId/vols/compagnie/:code
 */
export const obtenirVolsParCompagnie = async (req, res) => {
  try {
    const { programmeId, code } = req.params;

    const vols = await volProgrammeService.obtenirVolsParCompagnie(programmeId, code.toUpperCase());

    res.status(200).json({
      success: true,
      compagnie: code.toUpperCase(),
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans obtenirVolsParCompagnie:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des vols par compagnie'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// OPÉRATIONS BULK
// ══════════════════════════════════════════════════════════════════════════

/**
 * Importer plusieurs vols
 * POST /api/programmes-vol/:programmeId/vols/import
 */
export const importerVols = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programmeId } = req.params;
    const { vols } = req.body;

    if (!vols || !Array.isArray(vols) || vols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un tableau de vols est requis'
      });
    }

    const resultat = await volProgrammeService.importerVols(programmeId, vols, userId);

    res.status(201).json({
      success: true,
      message: `${resultat.volsCrees} vol(s) importé(s) avec succès`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans importerVols:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'import des vols'
    });
  }
};

/**
 * Réorganiser l'ordre des vols
 * PATCH /api/programmes-vol/:programmeId/vols/reorganiser
 */
export const reorganiserVols = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programmeId } = req.params;
    const { ordres } = req.body;

    if (!ordres || !Array.isArray(ordres)) {
      return res.status(400).json({
        success: false,
        message: 'Un tableau d\'ordres est requis: [{volId, ordre}]'
      });
    }

    const resultat = await volProgrammeService.reorganiserVols(programmeId, ordres, userId);

    res.status(200).json({
      success: true,
      message: `${resultat.modifies} vol(s) réorganisé(s)`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans reorganiserVols:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la réorganisation'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtenir les données formatées pour export PDF (apercu)
 * GET /api/programmes-vol/:programmeId/export-pdf
 */
export const obtenirDonneesPDF = async (req, res) => {
  try {
    const { programmeId } = req.params;

    const donnees = await programmeVolPdfService.obtenirApercu(programmeId);

    res.status(200).json({
      success: true,
      data: donnees
    });

  } catch (error) {
    console.error('Erreur dans obtenirDonneesPDF:', error);

    if (error.message.includes('non trouv')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la generation des donnees PDF'
    });
  }
};

/**
 * Telecharger le PDF du programme de vols
 * GET /api/programmes-vol/:programmeId/telecharger-pdf
 */
export const telechargerPDF = async (req, res) => {
  try {
    const { programmeId } = req.params;

    // Configuration optionnelle depuis query params
    const config = {};
    if (req.query.responsable) config.responsable = req.query.responsable;

    await programmeVolPdfService.genererPDFStream(programmeId, res, config);

  } catch (error) {
    console.error('Erreur dans telechargerPDF:', error);

    // Si headers pas encore envoyes
    if (!res.headersSent) {
      if (error.message.includes('non trouv')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la generation du PDF'
      });
    }
  }
};

/**
 * Generer et obtenir le PDF en base64 (pour preview)
 * GET /api/programmes-vol/:programmeId/pdf-base64
 */
export const obtenirPDFBase64 = async (req, res) => {
  try {
    const { programmeId } = req.params;

    const config = {};
    if (req.query.responsable) config.responsable = req.query.responsable;

    const buffer = await programmeVolPdfService.genererPDFBuffer(programmeId, config);

    res.status(200).json({
      success: true,
      data: {
        base64: buffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    });

  } catch (error) {
    console.error('Erreur dans obtenirPDFBase64:', error);

    if (error.message.includes('non trouv')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la generation du PDF'
    });
  }
};
