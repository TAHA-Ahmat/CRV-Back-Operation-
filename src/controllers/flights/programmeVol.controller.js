import * as programmeVolService from '../../services/flights/programmeVol.service.js';

/**
 * EXTENSION 1 - Contrôleur Programme vol saisonnier
 *
 * Contrôleur NOUVEAU et INDÉPENDANT pour gérer les requêtes HTTP des programmes de vols récurrents.
 *
 * NON-RÉGRESSION: Ce contrôleur n'utilise AUCUN contrôleur existant.
 * - crv.controller.js reste inchangé
 * - vol.controller.js (si existe) reste inchangé
 * - Aucune modification des routes existantes
 *
 * Ce contrôleur gère UNIQUEMENT les nouvelles routes /api/programmes-vol/*
 *
 * EXTENSION 1.1 (2026-01-12) - Enrichissement standard programme de vol
 * NON-RÉGRESSION: Nouveaux filtres query optionnels, nouvelles routes additives
 * - Filtres: categorieVol, provenance, destination, nightStop, codeCompagnie
 * - Nouvelles routes: /statistiques, /par-route, /resume
 */

/**
 * Créer un nouveau programme vol saisonnier
 * POST /api/programmes-vol
 */
export const creerProgramme = async (req, res) => {
  try {
    const userId = req.user._id;
    const programmeData = req.body;

    // Validation basique des données requises
    if (!programmeData.nomProgramme) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du programme est requis'
      });
    }

    if (!programmeData.compagnieAerienne) {
      return res.status(400).json({
        success: false,
        message: 'La compagnie aérienne est requise'
      });
    }

    if (!programmeData.typeOperation) {
      return res.status(400).json({
        success: false,
        message: 'Le type d\'opération est requis'
      });
    }

    if (!programmeData.recurrence) {
      return res.status(400).json({
        success: false,
        message: 'Les informations de récurrence sont requises'
      });
    }

    if (!programmeData.detailsVol || !programmeData.detailsVol.numeroVolBase) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de vol de base est requis'
      });
    }

    const programme = await programmeVolService.creerProgrammeVol(programmeData, userId);

    res.status(201).json({
      success: true,
      message: 'Programme vol saisonnier créé avec succès',
      data: programme
    });

  } catch (error) {
    console.error('Erreur dans creerProgramme:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du programme vol saisonnier'
    });
  }
};

/**
 * Récupérer tous les programmes vol avec filtres optionnels
 * GET /api/programmes-vol
 * EXTENSION 1.1: Ajout filtres categorieVol, provenance, destination, nightStop, codeCompagnie
 */
export const obtenirProgrammes = async (req, res) => {
  try {
    const filtres = {
      compagnieAerienne: req.query.compagnieAerienne,
      statut: req.query.statut,
      actif: req.query.actif,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      // EXTENSION 1.1: Nouveaux filtres optionnels
      categorieVol: req.query.categorieVol,
      provenance: req.query.provenance,
      destination: req.query.destination,
      nightStop: req.query.nightStop,
      codeCompagnie: req.query.codeCompagnie
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const programmes = await programmeVolService.obtenirProgrammesVol(filtres);

    res.status(200).json({
      success: true,
      count: programmes.length,
      data: programmes
    });

  } catch (error) {
    console.error('Erreur dans obtenirProgrammes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des programmes vol'
    });
  }
};

/**
 * Récupérer un programme vol par son ID
 * GET /api/programmes-vol/:id
 */
export const obtenirProgrammeParId = async (req, res) => {
  try {
    const programmeId = req.params.id;

    const programme = await programmeVolService.obtenirProgrammeVolParId(programmeId);

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
      message: error.message || 'Erreur lors de la récupération du programme vol'
    });
  }
};

/**
 * Mettre à jour un programme vol saisonnier
 * PATCH /api/programmes-vol/:id
 */
export const mettreAJourProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;

    const programme = await programmeVolService.mettreAJourProgrammeVol(programmeId, updateData, userId);

    res.status(200).json({
      success: true,
      message: 'Programme vol saisonnier mis à jour avec succès',
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
      message: error.message || 'Erreur lors de la mise à jour du programme vol'
    });
  }
};

/**
 * Valider un programme vol saisonnier
 * POST /api/programmes-vol/:id/valider
 */
export const validerProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const userId = req.user._id;

    const programme = await programmeVolService.validerProgrammeVol(programmeId, userId);

    res.status(200).json({
      success: true,
      message: 'Programme vol saisonnier validé avec succès',
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

    if (error.message.includes('déjà validé') || error.message.includes('incomplètes')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation du programme vol'
    });
  }
};

/**
 * Activer un programme vol saisonnier validé
 * POST /api/programmes-vol/:id/activer
 */
export const activerProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const userId = req.user._id;

    const programme = await programmeVolService.activerProgrammeVol(programmeId, userId);

    res.status(200).json({
      success: true,
      message: 'Programme vol saisonnier activé avec succès',
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
      message: error.message || 'Erreur lors de l\'activation du programme vol'
    });
  }
};

/**
 * Suspendre un programme vol saisonnier actif
 * POST /api/programmes-vol/:id/suspendre
 */
export const suspendreProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const userId = req.user._id;
    const { raison } = req.body;

    const programme = await programmeVolService.suspendreProgrammeVol(programmeId, userId, raison);

    res.status(200).json({
      success: true,
      message: 'Programme vol saisonnier suspendu avec succès',
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
      message: error.message || 'Erreur lors de la suspension du programme vol'
    });
  }
};

/**
 * Trouver les programmes applicables pour une date donnée
 * GET /api/programmes-vol/applicables/:date
 * EXTENSION 1.1: Ajout filtre optionnel categorieVol
 */
export const trouverProgrammesApplicables = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const compagnieAerienne = req.query.compagnieAerienne;
    const categorieVol = req.query.categorieVol; // EXTENSION 1.1

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Date invalide'
      });
    }

    const programmes = await programmeVolService.trouverProgrammesApplicables(date, compagnieAerienne, categorieVol);

    res.status(200).json({
      success: true,
      count: programmes.length,
      data: programmes
    });

  } catch (error) {
    console.error('Erreur dans trouverProgrammesApplicables:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recherche des programmes applicables'
    });
  }
};

/**
 * Importer plusieurs programmes depuis un fichier JSON
 * POST /api/programmes-vol/import
 */
export const importerProgrammes = async (req, res) => {
  try {
    const userId = req.user._id;
    const programmesData = req.body.programmes;

    if (!Array.isArray(programmesData)) {
      return res.status(400).json({
        success: false,
        message: 'Le corps de la requête doit contenir un tableau de programmes'
      });
    }

    if (programmesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau de programmes est vide'
      });
    }

    const resultats = await programmeVolService.importerProgrammesVol(programmesData, userId);

    res.status(200).json({
      success: true,
      message: `Import terminé: ${resultats.succes.length} succès, ${resultats.erreurs.length} erreurs`,
      data: resultats
    });

  } catch (error) {
    console.error('Erreur dans importerProgrammes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'import des programmes vol'
    });
  }
};

/**
 * Supprimer un programme vol saisonnier
 * DELETE /api/programmes-vol/:id
 */
export const supprimerProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const userId = req.user._id;

    const resultat = await programmeVolService.supprimerProgrammeVol(programmeId, userId);

    res.status(200).json({
      success: true,
      message: resultat.message
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
      message: error.message || 'Erreur lors de la suppression du programme vol'
    });
  }
};

// ========== EXTENSION 1.1 - NOUVEAUX ENDPOINTS ==========

/**
 * Obtenir les statistiques par catégorie de vol
 * GET /api/programmes-vol/statistiques/categories
 */
export const obtenirStatistiquesParCategorie = async (req, res) => {
  try {
    const statistiques = await programmeVolService.obtenirStatistiquesParCategorie();

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesParCategorie:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques par catégorie'
    });
  }
};

/**
 * Obtenir les statistiques par jour de la semaine
 * GET /api/programmes-vol/statistiques/jours
 */
export const obtenirStatistiquesParJour = async (req, res) => {
  try {
    const statistiques = await programmeVolService.obtenirStatistiquesParJour();

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesParJour:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques par jour'
    });
  }
};

/**
 * Trouver les programmes par route (provenance/destination)
 * GET /api/programmes-vol/par-route
 * @query provenance - Code IATA origine (optionnel)
 * @query destination - Code IATA destination (optionnel)
 * @query categorieVol - PASSAGER, CARGO, DOMESTIQUE (optionnel)
 */
export const trouverParRoute = async (req, res) => {
  try {
    const options = {
      provenance: req.query.provenance,
      destination: req.query.destination,
      categorieVol: req.query.categorieVol
    };

    // Nettoyer les options undefined
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });

    if (Object.keys(options).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un paramètre est requis: provenance, destination ou categorieVol'
      });
    }

    const programmes = await programmeVolService.trouverParRoute(options);

    res.status(200).json({
      success: true,
      count: programmes.length,
      data: programmes
    });

  } catch (error) {
    console.error('Erreur dans trouverParRoute:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recherche par route'
    });
  }
};

/**
 * Obtenir un résumé complet du programme de vol
 * GET /api/programmes-vol/resume
 */
export const obtenirResumeProgramme = async (req, res) => {
  try {
    const resume = await programmeVolService.obtenirResumeProgramme();

    res.status(200).json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Erreur dans obtenirResumeProgramme:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'obtention du résumé'
    });
  }
};
