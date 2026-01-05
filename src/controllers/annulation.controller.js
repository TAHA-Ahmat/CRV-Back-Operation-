import * as annulationService from '../services/annulation.service.js';

/**
 * EXTENSION 6 - Contrôleur Annulation (Statut CRV ANNULE)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées à l'annulation de CRV.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes sur CRV restent inchangées
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 6.
 */

/**
 * Annuler un CRV
 * POST /api/crv/:id/annuler
 */
export const annulerCRV = async (req, res) => {
  try {
    const crvId = req.params.id;
    const detailsAnnulation = req.body;
    const userId = req.user._id;

    const crv = await annulationService.annulerCRV(crvId, detailsAnnulation, userId);

    res.status(200).json({
      success: true,
      message: 'CRV annulé avec succès',
      data: crv
    });

  } catch (error) {
    console.error('Erreur dans annulerCRV:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('déjà annulé') || error.message.includes('verrouillé')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'annulation du CRV'
    });
  }
};

/**
 * Réactiver un CRV annulé
 * POST /api/crv/:id/reactiver
 */
export const reactiverCRV = async (req, res) => {
  try {
    const crvId = req.params.id;
    const userId = req.user._id;

    const crv = await annulationService.reactiverCRV(crvId, userId);

    res.status(200).json({
      success: true,
      message: 'CRV réactivé avec succès',
      data: crv
    });

  } catch (error) {
    console.error('Erreur dans reactiverCRV:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('pas annulé')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la réactivation du CRV'
    });
  }
};

/**
 * Obtenir tous les CRV annulés
 * GET /api/crv/annules
 */
export const obtenirCRVAnnules = async (req, res) => {
  try {
    const filtres = {
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      raisonAnnulation: req.query.raisonAnnulation
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const crvs = await annulationService.obtenirCRVAnnules(filtres);

    res.status(200).json({
      success: true,
      count: crvs.length,
      data: crvs
    });

  } catch (error) {
    console.error('Erreur dans obtenirCRVAnnules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des CRV annulés'
    });
  }
};

/**
 * Obtenir les statistiques des annulations
 * GET /api/crv/statistiques/annulations
 */
export const obtenirStatistiquesAnnulations = async (req, res) => {
  try {
    const filtres = {
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const statistiques = await annulationService.obtenirStatistiquesAnnulations(filtres);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesAnnulations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques d\'annulations'
    });
  }
};

/**
 * Vérifier si un CRV peut être annulé
 * GET /api/crv/:id/peut-annuler
 */
export const verifierPeutAnnuler = async (req, res) => {
  try {
    const crvId = req.params.id;

    const resultat = await annulationService.verifierPeutAnnuler(crvId);

    res.status(200).json({
      success: true,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans verifierPeutAnnuler:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification'
    });
  }
};
