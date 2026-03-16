/**
 * Wrapper Charges CRV — Ajoute la journalisation CRVEvent
 * aux fonctions charges de crv.controller.js (zone rouge).
 *
 * Stratégie identique aux wrappers personnel et engins :
 * intercepter res.json() pour détecter le succès,
 * puis journaliser l'événement approprié.
 *
 * Types : PASSAGERS, BAGAGES, FRET
 * Sens : EMBARQUEMENT, DEBARQUEMENT
 */
import {
  ajouterCharge as _ajouterCharge,
  ajouterEvenement,
  ajouterObservation,
  mettreAJourHoraire,
} from './crv.controller.js';
import { logCRVEvent } from '../../services/crv/crvEvent.service.js';

// Re-export les fonctions non wrappées (hors scope charges)
export { ajouterEvenement, ajouterObservation, mettreAJourHoraire };

/**
 * POST /api/crv/:id/charges — Ajout d'une charge opérationnelle
 * Journalise CHARGE_ADDED avec le type et le sens de la charge
 */
export const ajouterCharge = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 201 && body?.success) {
      const charge = body.data;
      logCRVEvent(req.params.id, 'CHARGE_ADDED', req.user?._id, {
        chargeId: charge?._id,
        typeCharge: charge?.typeCharge || req.body.typeCharge,
        sensOperation: charge?.sensOperation || req.body.sensOperation,
      });
    }
    return originalJson(body);
  };

  return _ajouterCharge(req, res, next);
};
