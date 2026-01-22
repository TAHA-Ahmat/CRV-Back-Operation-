import * as bulletinService from '../../services/bulletin/bulletinMouvement.service.js';

/**
 * CONTROLEUR BULLETIN DE MOUVEMENT
 *
 * Gere les requetes HTTP pour les bulletins de mouvement (3-4 jours).
 *
 * HIERARCHIE METIER:
 * Programme (6 mois) → Bulletin (3-4 jours) → CRV (reel)
 *
 * REGLES METIER:
 * - Le bulletin annonce, informe et organise l'exploitation
 * - N'est PAS une preuve (seul le CRV fait foi)
 * - Peut s'ecarter du programme (ajustements, vols hors programme)
 * - En cas de contradiction: CRV > Bulletin > Programme
 *
 * ENDPOINTS:
 * - POST   /api/bulletins                              → Creer bulletin
 * - POST   /api/bulletins/depuis-programme             → Creer depuis programme
 * - GET    /api/bulletins                              → Lister bulletins
 * - GET    /api/bulletins/en-cours/:escale             → Bulletin en cours
 * - GET    /api/bulletins/:id                          → Obtenir bulletin
 * - DELETE /api/bulletins/:id                          → Supprimer bulletin
 *
 * Mouvements:
 * - POST   /api/bulletins/:id/mouvements               → Ajouter mouvement
 * - POST   /api/bulletins/:id/mouvements/hors-programme → Ajouter vol HP
 * - PATCH  /api/bulletins/:id/mouvements/:mouvementId  → Modifier mouvement
 * - DELETE /api/bulletins/:id/mouvements/:mouvementId  → Supprimer mouvement
 * - POST   /api/bulletins/:id/mouvements/:mouvementId/annuler → Annuler mouvement
 *
 * Workflow:
 * - POST   /api/bulletins/:id/publier                  → Publier
 * - POST   /api/bulletins/:id/archiver                 → Archiver
 * - POST   /api/bulletins/:id/creer-vols               → Creer instances Vol
 */

// ══════════════════════════════════════════════════════════════════════════
// CRUD DE BASE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Creer un nouveau bulletin
 * POST /api/bulletins
 */
export const creerBulletin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { escale, dateDebut, dateFin, titre, remarques, programmeVolSource } = req.body;

    // Validation
    if (!escale) {
      return res.status(400).json({
        success: false,
        message: 'L\'escale est requise'
      });
    }

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de debut et fin sont requises'
      });
    }

    const bulletin = await bulletinService.creerBulletin({
      escale,
      dateDebut,
      dateFin,
      titre,
      remarques,
      programmeVolSource
    }, userId);

    res.status(201).json({
      success: true,
      message: `Bulletin ${bulletin.numeroBulletin} cree`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans creerBulletin:', error);

    if (error.message.includes('existe deja')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la creation du bulletin'
    });
  }
};

/**
 * Creer un bulletin pre-rempli depuis un programme
 * POST /api/bulletins/depuis-programme
 */
export const creerBulletinDepuisProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { escale, dateDebut, dateFin, programmeId, titre, remarques } = req.body;

    // Validation
    if (!escale) {
      return res.status(400).json({
        success: false,
        message: 'L\'escale est requise'
      });
    }

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de debut et fin sont requises'
      });
    }

    if (!programmeId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du programme est requis'
      });
    }

    const bulletin = await bulletinService.creerBulletinDepuisProgramme({
      escale,
      dateDebut,
      dateFin,
      programmeId,
      titre,
      remarques
    }, userId);

    res.status(201).json({
      success: true,
      message: `Bulletin ${bulletin.numeroBulletin} cree avec ${bulletin.nombreMouvements} mouvements`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans creerBulletinDepuisProgramme:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('existe deja')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la creation du bulletin depuis programme'
    });
  }
};

/**
 * Lister les bulletins avec filtres
 * GET /api/bulletins
 */
export const listerBulletins = async (req, res) => {
  try {
    const filtres = {
      escale: req.query.escale,
      statut: req.query.statut,
      annee: req.query.annee ? parseInt(req.query.annee) : undefined,
      semaine: req.query.semaine ? parseInt(req.query.semaine) : undefined,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      programmeVolSource: req.query.programmeId
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { dateDebut: -1 }
    };

    const resultat = await bulletinService.listerBulletins(filtres, options);

    res.status(200).json({
      success: true,
      ...resultat
    });

  } catch (error) {
    console.error('Erreur dans listerBulletins:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la liste des bulletins'
    });
  }
};

/**
 * Obtenir le bulletin en cours pour une escale
 * GET /api/bulletins/en-cours/:escale
 */
export const obtenirBulletinEnCours = async (req, res) => {
  try {
    const { escale } = req.params;

    const bulletin = await bulletinService.obtenirBulletinEnCours(escale);

    if (!bulletin) {
      return res.status(404).json({
        success: false,
        message: `Aucun bulletin en cours pour l'escale ${escale}`
      });
    }

    res.status(200).json({
      success: true,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans obtenirBulletinEnCours:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recuperation du bulletin en cours'
    });
  }
};

/**
 * Obtenir un bulletin par ID
 * GET /api/bulletins/:id
 */
export const obtenirBulletinParId = async (req, res) => {
  try {
    const { id } = req.params;

    const bulletin = await bulletinService.obtenirBulletinParId(id);

    res.status(200).json({
      success: true,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans obtenirBulletinParId:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recuperation du bulletin'
    });
  }
};

/**
 * Supprimer un bulletin (brouillon uniquement)
 * DELETE /api/bulletins/:id
 */
export const supprimerBulletin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const resultat = await bulletinService.supprimerBulletin(id, userId);

    res.status(200).json({
      success: true,
      message: resultat.message
    });

  } catch (error) {
    console.error('Erreur dans supprimerBulletin:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Seuls les')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du bulletin'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// GESTION DES MOUVEMENTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Ajouter un mouvement au bulletin
 * POST /api/bulletins/:id/mouvements
 */
export const ajouterMouvement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const mouvementData = req.body;

    // Validation
    if (!mouvementData.numeroVol) {
      return res.status(400).json({
        success: false,
        message: 'Le numero de vol est requis'
      });
    }

    if (!mouvementData.dateMouvement) {
      return res.status(400).json({
        success: false,
        message: 'La date du mouvement est requise'
      });
    }

    const bulletin = await bulletinService.ajouterMouvement(id, mouvementData, userId);

    res.status(201).json({
      success: true,
      message: `Mouvement ${mouvementData.numeroVol} ajoute`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans ajouterMouvement:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('non modifiable') || error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout du mouvement'
    });
  }
};

/**
 * Ajouter un vol hors programme au bulletin
 * POST /api/bulletins/:id/mouvements/hors-programme
 */
export const ajouterVolHorsProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const volData = req.body;

    // Validation
    if (!volData.numeroVol) {
      return res.status(400).json({
        success: false,
        message: 'Le numero de vol est requis'
      });
    }

    if (!volData.dateMouvement) {
      return res.status(400).json({
        success: false,
        message: 'La date du mouvement est requise'
      });
    }

    if (!volData.typeHorsProgramme) {
      return res.status(400).json({
        success: false,
        message: 'Le type de vol hors programme est requis (CHARTER, MEDICAL, TECHNIQUE, COMMERCIAL, CARGO, AUTRE)'
      });
    }

    const bulletin = await bulletinService.ajouterVolHorsProgramme(id, volData, userId);

    res.status(201).json({
      success: true,
      message: `Vol hors programme ${volData.numeroVol} (${volData.typeHorsProgramme}) ajoute`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans ajouterVolHorsProgramme:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('non modifiable')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout du vol hors programme'
    });
  }
};

/**
 * Modifier un mouvement du bulletin
 * PATCH /api/bulletins/:id/mouvements/:mouvementId
 */
export const modifierMouvement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, mouvementId } = req.params;
    const mouvementData = req.body;

    const bulletin = await bulletinService.modifierMouvement(id, mouvementId, mouvementData, userId);

    res.status(200).json({
      success: true,
      message: 'Mouvement modifie',
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans modifierMouvement:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('non modifiable')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la modification du mouvement'
    });
  }
};

/**
 * Supprimer un mouvement du bulletin
 * DELETE /api/bulletins/:id/mouvements/:mouvementId
 */
export const supprimerMouvement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, mouvementId } = req.params;

    const bulletin = await bulletinService.supprimerMouvement(id, mouvementId, userId);

    res.status(200).json({
      success: true,
      message: 'Mouvement supprime',
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans supprimerMouvement:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('non modifiable')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du mouvement'
    });
  }
};

/**
 * Annuler un mouvement (sans le supprimer)
 * POST /api/bulletins/:id/mouvements/:mouvementId/annuler
 */
export const annulerMouvement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, mouvementId } = req.params;
    const { raison } = req.body;

    if (!raison) {
      return res.status(400).json({
        success: false,
        message: 'La raison de l\'annulation est requise'
      });
    }

    const bulletin = await bulletinService.annulerMouvement(id, mouvementId, raison, userId);

    res.status(200).json({
      success: true,
      message: 'Mouvement annule',
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans annulerMouvement:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'annulation du mouvement'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// WORKFLOW
// ══════════════════════════════════════════════════════════════════════════

/**
 * Publier un bulletin
 * POST /api/bulletins/:id/publier
 */
export const publierBulletin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const bulletin = await bulletinService.publierBulletin(id, userId);

    res.status(200).json({
      success: true,
      message: `Bulletin ${bulletin.numeroBulletin} publie`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans publierBulletin:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('conditions') || error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la publication du bulletin'
    });
  }
};

/**
 * Archiver un bulletin
 * POST /api/bulletins/:id/archiver
 */
export const archiverBulletin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const bulletin = await bulletinService.archiverBulletin(id, userId);

    res.status(200).json({
      success: true,
      message: `Bulletin ${bulletin.numeroBulletin} archive`,
      data: bulletin
    });

  } catch (error) {
    console.error('Erreur dans archiverBulletin:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('non publie') || error.message.includes('Impossible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'archivage du bulletin'
    });
  }
};

/**
 * Creer les instances Vol depuis les mouvements du bulletin
 * POST /api/bulletins/:id/creer-vols
 */
export const creerVolsDepuisBulletin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const resultat = await bulletinService.creerVolsDepuisBulletin(id, userId);

    res.status(200).json({
      success: true,
      message: `${resultat.crees.length} vol(s) cree(s), ${resultat.existants.length} existant(s)`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans creerVolsDepuisBulletin:', error);

    if (error.message.includes('non trouve')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la creation des vols'
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

export default {
  creerBulletin,
  creerBulletinDepuisProgramme,
  listerBulletins,
  obtenirBulletinEnCours,
  obtenirBulletinParId,
  supprimerBulletin,
  ajouterMouvement,
  ajouterVolHorsProgramme,
  modifierMouvement,
  supprimerMouvement,
  annulerMouvement,
  publierBulletin,
  archiverBulletin,
  creerVolsDepuisBulletin
};
