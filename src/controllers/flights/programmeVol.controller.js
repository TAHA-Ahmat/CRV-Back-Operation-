import * as programmeVolService from '../../services/flights/programmeVol.service.js';

/**
 * CONTRÔLEUR PROGRAMME VOL (Conteneur)
 *
 * Gère les requêtes HTTP pour les programmes de vol.
 * Un programme est un conteneur qui regroupe plusieurs vols.
 *
 * ENDPOINTS:
 * - POST   /api/programmes-vol           → Créer un programme
 * - GET    /api/programmes-vol           → Lister les programmes
 * - GET    /api/programmes-vol/actif     → Obtenir le programme actif
 * - GET    /api/programmes-vol/:id       → Obtenir un programme
 * - PATCH  /api/programmes-vol/:id       → Modifier un programme
 * - DELETE /api/programmes-vol/:id       → Supprimer un programme
 * - POST   /api/programmes-vol/:id/valider   → Valider
 * - POST   /api/programmes-vol/:id/activer   → Activer
 * - POST   /api/programmes-vol/:id/suspendre → Suspendre
 * - POST   /api/programmes-vol/:id/dupliquer → Dupliquer
 * - GET    /api/programmes-vol/:id/statistiques → Statistiques
 * - GET    /api/programmes-vol/:id/resume      → Résumé avec vols
 */

// ══════════════════════════════════════════════════════════════════════════
// CRUD DE BASE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Créer un nouveau programme
 * POST /api/programmes-vol
 */
export const creerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { nom, dateDebut, dateFin, edition, description } = req.body;

    // Validation
    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du programme est requis'
      });
    }

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de début et fin sont requises'
      });
    }

    const programme = await programmeVolService.creerProgramme(
      { nom, dateDebut, dateFin, edition, description },
      userId
    );

    res.status(201).json({
      success: true,
      message: `Programme "${programme.nom}" créé avec succès`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans creerProgramme:', error);

    if (error.message.includes('existe déjà')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du programme'
    });
  }
};

/**
 * Lister les programmes
 * GET /api/programmes-vol
 */
export const obtenirProgrammes = async (req, res) => {
  try {
    const filtres = {
      statut: req.query.statut,
      actif: req.query.actif,
      nom: req.query.nom
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) delete filtres[key];
    });

    const programmes = await programmeVolService.obtenirProgrammes(filtres);

    res.status(200).json({
      success: true,
      count: programmes.length,
      data: programmes
    });

  } catch (error) {
    console.error('Erreur dans obtenirProgrammes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des programmes'
    });
  }
};

/**
 * Obtenir un programme par ID
 * GET /api/programmes-vol/:id
 */
export const obtenirProgrammeParId = async (req, res) => {
  try {
    const programme = await programmeVolService.obtenirProgrammeParId(req.params.id);

    res.status(200).json({
      success: true,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans obtenirProgrammeParId:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du programme'
    });
  }
};

/**
 * Modifier un programme
 * PATCH /api/programmes-vol/:id
 */
export const mettreAJourProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const programme = await programmeVolService.mettreAJourProgramme(
      req.params.id,
      req.body,
      userId
    );

    res.status(200).json({
      success: true,
      message: `Programme "${programme.nom}" mis à jour`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Impossible de modifier')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du programme'
    });
  }
};

/**
 * Supprimer un programme
 * DELETE /api/programmes-vol/:id
 */
export const supprimerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const resultat = await programmeVolService.supprimerProgramme(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: resultat.message,
      volsSupprimes: resultat.volsSupprimes
    });

  } catch (error) {
    console.error('Erreur dans supprimerProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('actif')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du programme'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// WORKFLOW
// ══════════════════════════════════════════════════════════════════════════

/**
 * Valider un programme
 * POST /api/programmes-vol/:id/valider
 */
export const validerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const programme = await programmeVolService.validerProgramme(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: `Programme "${programme.nom}" validé avec succès (${programme.nombreVols} vols)`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans validerProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('déjà validé') || error.message.includes('au moins un vol')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation du programme'
    });
  }
};

/**
 * Activer un programme
 * POST /api/programmes-vol/:id/activer
 */
export const activerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const programme = await programmeVolService.activerProgramme(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: `Programme "${programme.nom}" activé avec succès`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans activerProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('validé') || error.message.includes('déjà actif') || error.message.includes('terminée')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'activation du programme'
    });
  }
};

/**
 * Suspendre un programme
 * POST /api/programmes-vol/:id/suspendre
 */
export const suspendreProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { raison } = req.body;

    const programme = await programmeVolService.suspendreProgramme(
      req.params.id,
      userId,
      raison
    );

    res.status(200).json({
      success: true,
      message: `Programme "${programme.nom}" suspendu`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans suspendreProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('pas actif')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suspension du programme'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtenir le programme actif
 * GET /api/programmes-vol/actif
 */
export const obtenirProgrammeActif = async (req, res) => {
  try {
    const programme = await programmeVolService.obtenirProgrammeActif();

    if (!programme) {
      return res.status(200).json({
        success: true,
        message: 'Aucun programme actif',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans obtenirProgrammeActif:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du programme actif'
    });
  }
};

/**
 * Obtenir les statistiques d'un programme
 * GET /api/programmes-vol/:id/statistiques
 */
export const obtenirStatistiques = async (req, res) => {
  try {
    const stats = await programmeVolService.obtenirStatistiques(req.params.id);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiques:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques'
    });
  }
};

/**
 * Obtenir le résumé d'un programme (avec vols)
 * GET /api/programmes-vol/:id/resume
 */
export const obtenirResume = async (req, res) => {
  try {
    const resume = await programmeVolService.obtenirResume(req.params.id);

    res.status(200).json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Erreur dans obtenirResume:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'obtention du résumé'
    });
  }
};

/**
 * Dupliquer un programme
 * POST /api/programmes-vol/:id/dupliquer
 */
export const dupliquerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { nom, dateDebut, dateFin, edition } = req.body;

    if (!nom || !dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, dateDebut et dateFin sont requis pour la duplication'
      });
    }

    const programme = await programmeVolService.dupliquerProgramme(
      req.params.id,
      { nom, dateDebut, dateFin, edition },
      userId
    );

    res.status(201).json({
      success: true,
      message: `Programme "${programme.nom}" créé par duplication (${programme.nombreVols} vols copiés)`,
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans dupliquerProgramme:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('existe déjà')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la duplication du programme'
    });
  }
};
