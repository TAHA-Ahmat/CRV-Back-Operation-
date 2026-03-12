import * as passagerService from '../../services/charges/passager.service.js';

/**
 * EXTENSION 4 - Contrôleur Passagers (Catégories détaillées)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux catégories détaillées de passagers.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes sur ChargeOperationnelle restent inchangées
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 4.
 */

/**
 * Mettre à jour les catégories détaillées de passagers
 * PUT /api/charges/:id/categories-detaillees
 */
export const mettreAJourCategoriesDetaillees = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const categoriesDetaillees = req.body;
    const userId = req.user._id;

    const charge = await passagerService.mettreAJourCategoriesDetaillees(chargeId, categoriesDetaillees, userId);

    res.status(200).json({
      success: true,
      message: 'Catégories détaillées de passagers mises à jour avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourCategoriesDetaillees:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des catégories détaillées'
    });
  }
};

/**
 * Mettre à jour les classes de passagers
 * PUT /api/charges/:id/classes
 */
export const mettreAJourClassePassagers = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const classePassagers = req.body;
    const userId = req.user._id;

    const charge = await passagerService.mettreAJourClassePassagers(chargeId, classePassagers, userId);

    res.status(200).json({
      success: true,
      message: 'Classes de passagers mises à jour avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourClassePassagers:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des classes'
    });
  }
};

/**
 * Mettre à jour les besoins médicaux
 * PUT /api/charges/:id/besoins-medicaux
 */
export const mettreAJourBesoinsMedicaux = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const besoinsMedicaux = req.body;
    const userId = req.user._id;

    const charge = await passagerService.mettreAJourBesoinsMedicaux(chargeId, besoinsMedicaux, userId);

    res.status(200).json({
      success: true,
      message: 'Besoins médicaux mis à jour avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourBesoinsMedicaux:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des besoins médicaux'
    });
  }
};

/**
 * Mettre à jour les informations sur les mineurs
 * PUT /api/charges/:id/mineurs
 */
export const mettreAJourMineurs = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const mineurs = req.body;
    const userId = req.user._id;

    const charge = await passagerService.mettreAJourMineurs(chargeId, mineurs, userId);

    res.status(200).json({
      success: true,
      message: 'Informations sur les mineurs mises à jour avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourMineurs:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des mineurs'
    });
  }
};

/**
 * Obtenir les statistiques détaillées des passagers pour un CRV
 * GET /api/crv/:crvId/statistiques-passagers
 */
export const obtenirStatistiquesPassagersCRV = async (req, res) => {
  try {
    const crvId = req.params.crvId;

    const statistiques = await passagerService.obtenirStatistiquesPassagersCRV(crvId);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesPassagersCRV:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques passagers'
    });
  }
};

/**
 * Obtenir les statistiques globales des passagers
 * GET /api/charges/statistiques/passagers
 */
export const obtenirStatistiquesGlobalesPassagers = async (req, res) => {
  try {
    const filtres = {
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      compagnie: req.query.compagnie
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const statistiques = await passagerService.obtenirStatistiquesGlobalesPassagers(filtres);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesGlobalesPassagers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques globales'
    });
  }
};

/**
 * Convertir les catégories basiques en catégories détaillées
 * POST /api/charges/:id/convertir-categories-detaillees
 */
export const convertirVersCategoriesDetaillees = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const mapping = req.body.mapping;
    const userId = req.user._id;

    const charge = await passagerService.convertirVersCategoriesDetaillees(chargeId, mapping, userId);

    res.status(200).json({
      success: true,
      message: 'Conversion vers catégories détaillées effectuée avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans convertirVersCategoriesDetaillees:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('déjà')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la conversion'
    });
  }
};
