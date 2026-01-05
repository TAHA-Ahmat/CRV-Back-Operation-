import * as volService from '../services/vol.service.js';

/**
 * EXTENSION 2 - Contrôleur Vol Programme (Distinction programmé / hors programme)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux vols programmés et hors programme.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - vol.controller.js reste inchangé (creerVol, obtenirVol, listerVols, mettreAJourVol)
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 2.
 */

/**
 * Lier un vol à un programme saisonnier
 * POST /api/vols/:id/lier-programme
 */
export const lierVolAuProgramme = async (req, res) => {
  try {
    const volId = req.params.id;
    const { programmeVolId } = req.body;
    const userId = req.user._id;

    if (!programmeVolId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du programme vol saisonnier est requis'
      });
    }

    const vol = await volService.lierVolAuProgramme(volId, programmeVolId, userId);

    res.status(200).json({
      success: true,
      message: 'Vol lié au programme saisonnier avec succès',
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans lierVolAuProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('actif') || error.message.includes('correspond pas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la liaison du vol au programme'
    });
  }
};

/**
 * Marquer un vol comme hors programme
 * POST /api/vols/:id/marquer-hors-programme
 */
export const marquerVolHorsProgramme = async (req, res) => {
  try {
    const volId = req.params.id;
    const { typeVolHorsProgramme, raison } = req.body;
    const userId = req.user._id;

    if (!typeVolHorsProgramme) {
      return res.status(400).json({
        success: false,
        message: 'Le type de vol hors programme est requis'
      });
    }

    const vol = await volService.marquerVolHorsProgramme(volId, typeVolHorsProgramme, raison, userId);

    res.status(200).json({
      success: true,
      message: 'Vol marqué comme hors programme avec succès',
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans marquerVolHorsProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('invalide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du marquage du vol hors programme'
    });
  }
};

/**
 * Détacher un vol d'un programme saisonnier
 * POST /api/vols/:id/detacher-programme
 */
export const detacherVolDuProgramme = async (req, res) => {
  try {
    const volId = req.params.id;
    const userId = req.user._id;

    const vol = await volService.detacherVolDuProgramme(volId, userId);

    res.status(200).json({
      success: true,
      message: 'Vol détaché du programme saisonnier avec succès',
      data: vol
    });

  } catch (error) {
    console.error('Erreur dans detacherVolDuProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('pas lié')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du détachement du vol du programme'
    });
  }
};

/**
 * Obtenir tous les vols d'un programme saisonnier
 * GET /api/vols/programme/:programmeVolId
 */
export const obtenirVolsDuProgramme = async (req, res) => {
  try {
    const programmeVolId = req.params.programmeVolId;

    const vols = await volService.obtenirVolsDuProgramme(programmeVolId);

    res.status(200).json({
      success: true,
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans obtenirVolsDuProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des vols du programme'
    });
  }
};

/**
 * Obtenir tous les vols hors programme avec filtres
 * GET /api/vols/hors-programme
 */
export const obtenirVolsHorsProgramme = async (req, res) => {
  try {
    const filtres = {
      typeVolHorsProgramme: req.query.typeVolHorsProgramme,
      compagnieAerienne: req.query.compagnieAerienne,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const vols = await volService.obtenirVolsHorsProgramme(filtres);

    res.status(200).json({
      success: true,
      count: vols.length,
      data: vols
    });

  } catch (error) {
    console.error('Erreur dans obtenirVolsHorsProgramme:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des vols hors programme'
    });
  }
};

/**
 * Obtenir les statistiques vols programmés vs hors programme
 * GET /api/vols/statistiques/programmes
 */
export const obtenirStatistiquesVolsProgrammes = async (req, res) => {
  try {
    const filtres = {
      compagnieAerienne: req.query.compagnieAerienne,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const statistiques = await volService.obtenirStatistiquesVolsProgrammes(filtres);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesVolsProgrammes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques'
    });
  }
};

/**
 * Suggérer des programmes compatibles pour un vol
 * GET /api/vols/:id/suggerer-programmes
 */
export const suggererProgrammesPourVol = async (req, res) => {
  try {
    const volId = req.params.id;

    const suggestions = await volService.suggererProgrammesPourVol(volId);

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });

  } catch (error) {
    console.error('Erreur dans suggererProgrammesPourVol:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suggestion de programmes'
    });
  }
};
