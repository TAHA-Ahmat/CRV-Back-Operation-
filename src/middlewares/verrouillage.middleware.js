import CRV from '../models/crv/CRV.js';
import ChronologiePhase from '../models/phases/ChronologiePhase.js';
import ChargeOperationnelle from '../models/charges/ChargeOperationnelle.js';

/**
 * MIDDLEWARE VERROUILLAGE — Protection CRV immutable
 *
 * Variantes du middleware verifierCRVNonVerrouille pour les routes
 * où req.params.id n'est PAS l'ID du CRV mais d'une sous-ressource.
 *
 * businessRules.middleware.js (zone rouge) ne peut pas être modifié.
 * Ces middlewares complémentaires couvrent les cas manquants.
 */

/**
 * Vérifie que le CRV lié à une CHARGE n'est pas verrouillé
 * Pour les routes /api/charges/:id/*
 * Résolution : charge.crv → CRV.statut
 */
export const verifierCRVNonVerrouilleViaCharge = async (req, res, next) => {
  try {
    const chargeId = req.params.id;
    if (!chargeId) return next();

    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      return res.status(404).json({
        success: false,
        message: 'Charge opérationnelle non trouvée'
      });
    }

    const crv = await CRV.findById(charge.crv);
    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV associé à la charge non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'INTERDIT : CRV validé et verrouillé - aucune modification de charge possible',
        code: 'CRV_VERROUILLE'
      });
    }

    req.crv = crv;
    req.charge = charge;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie que le CRV lié à une PHASE n'est pas verrouillé
 * Pour les routes /api/phases/:id (PATCH) et /api/crv/:crvId/phases/:phaseId
 * Résolution : chronoPhase.crv → CRV.statut
 */
export const verifierCRVNonVerrouilleViaPhase = async (req, res, next) => {
  try {
    // Cas 1 : /api/crv/:crvId/phases/:phaseId → on a le crvId directement
    const crvId = req.params.crvId;
    if (crvId) {
      const crv = await CRV.findById(crvId);
      if (!crv) {
        return res.status(404).json({
          success: false,
          message: 'CRV non trouvé'
        });
      }
      if (crv.statut === 'VERROUILLE') {
        return res.status(403).json({
          success: false,
          message: 'INTERDIT : CRV validé et verrouillé - aucune modification de phase possible',
          code: 'CRV_VERROUILLE'
        });
      }
      req.crv = crv;
      return next();
    }

    // Cas 2 : /api/phases/:id → on doit résoudre via la chronoPhase
    const phaseId = req.params.id;
    if (!phaseId) return next();

    const chronoPhase = await ChronologiePhase.findById(phaseId);
    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = await CRV.findById(chronoPhase.crv);
    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV associé à la phase non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'INTERDIT : CRV validé et verrouillé - aucune modification de phase possible',
        code: 'CRV_VERROUILLE'
      });
    }

    req.crv = crv;
    next();
  } catch (error) {
    next(error);
  }
};
