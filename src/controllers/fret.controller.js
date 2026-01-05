import * as fretService from '../services/fret.service.js';

/**
 * EXTENSION 5 - Contrôleur Fret (Fret détaillé)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées au fret détaillé.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes sur ChargeOperationnelle (fret basique) restent inchangées
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 5.
 */

/**
 * Mettre à jour le fret détaillé
 * PUT /api/charges/:id/fret-detaille
 */
export const mettreAJourFretDetaille = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const fretDetaille = req.body;
    const userId = req.user._id;

    const charge = await fretService.mettreAJourFretDetaille(chargeId, fretDetaille, userId);

    res.status(200).json({
      success: true,
      message: 'Fret détaillé mis à jour avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourFretDetaille:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('pas de type FRET')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du fret détaillé'
    });
  }
};

/**
 * Ajouter une marchandise dangereuse
 * POST /api/charges/:id/marchandises-dangereuses
 */
export const ajouterMarchandiseDangereuse = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const marchandise = req.body;
    const userId = req.user._id;

    const charge = await fretService.ajouterMarchandiseDangereuse(chargeId, marchandise, userId);

    res.status(201).json({
      success: true,
      message: 'Marchandise dangereuse ajoutée avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans ajouterMarchandiseDangereuse:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('pas de type FRET') || error.message.includes('requis')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout de la marchandise dangereuse'
    });
  }
};

/**
 * Retirer une marchandise dangereuse
 * DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
 */
export const retirerMarchandiseDangereuse = async (req, res) => {
  try {
    const chargeId = req.params.id;
    const marchandiseId = req.params.marchandiseId;
    const userId = req.user._id;

    const charge = await fretService.retirerMarchandiseDangereuse(chargeId, marchandiseId, userId);

    res.status(200).json({
      success: true,
      message: 'Marchandise dangereuse retirée avec succès',
      data: charge
    });

  } catch (error) {
    console.error('Erreur dans retirerMarchandiseDangereuse:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du retrait de la marchandise dangereuse'
    });
  }
};

/**
 * Obtenir les statistiques de fret pour un CRV
 * GET /api/charges/crv/:crvId/statistiques-fret
 */
export const obtenirStatistiquesFretCRV = async (req, res) => {
  try {
    const crvId = req.params.crvId;

    const statistiques = await fretService.obtenirStatistiquesFretCRV(crvId);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesFretCRV:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques fret'
    });
  }
};

/**
 * Obtenir les charges avec marchandises dangereuses
 * GET /api/charges/marchandises-dangereuses
 */
export const obtenirChargesAvecMarchandisesDangereuses = async (req, res) => {
  try {
    const filtres = {
      crvId: req.query.crvId
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const charges = await fretService.obtenirChargesAvecMarchandisesDangereuses(filtres);

    res.status(200).json({
      success: true,
      count: charges.length,
      data: charges
    });

  } catch (error) {
    console.error('Erreur dans obtenirChargesAvecMarchandisesDangereuses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des charges avec marchandises dangereuses'
    });
  }
};

/**
 * Valider une marchandise dangereuse
 * POST /api/charges/valider-marchandise-dangereuse
 */
export const validerMarchandiseDangereuse = async (req, res) => {
  try {
    const marchandise = req.body;

    const validation = await fretService.validerMarchandiseDangereuse(marchandise);

    res.status(200).json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Erreur dans validerMarchandiseDangereuse:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation'
    });
  }
};

/**
 * Obtenir les statistiques globales de fret
 * GET /api/charges/statistiques/fret
 */
export const obtenirStatistiquesGlobalesFret = async (req, res) => {
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

    const statistiques = await fretService.obtenirStatistiquesGlobalesFret(filtres);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesGlobalesFret:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques globales fret'
    });
  }
};
