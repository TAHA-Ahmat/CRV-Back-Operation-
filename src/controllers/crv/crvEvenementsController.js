/**
 * Wrapper Événements CRV — Ajoute la journalisation CRVEvent
 * à la fonction ajouterEvenement de crv.controller.js (zone rouge).
 *
 * Stratégie identique aux wrappers personnel, engins et charges :
 * intercepter res.json() pour détecter le succès,
 * puis journaliser l'événement approprié.
 *
 * Type CRVEvent : INCIDENT_REPORTED (défini dans l'enum, jamais appelé avant ce wrapper)
 */
import {
  ajouterEvenement as _ajouterEvenement,
} from './crv.controller.js';
import { logCRVEvent } from '../../services/crv/crvEvent.service.js';

/**
 * POST /api/crv/:id/evenements — Ajout d'un événement opérationnel
 * Journalise INCIDENT_REPORTED avec le type, la gravité et la description
 */
export const ajouterEvenement = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 201 && body?.success) {
      const evenement = body.data;
      logCRVEvent(req.params.id, 'INCIDENT_REPORTED', req.user?._id, {
        evenementId: evenement?._id,
        typeEvenement: evenement?.typeEvenement || req.body.typeEvenement,
        gravite: evenement?.gravite || req.body.gravite,
        description: (evenement?.description || req.body.description || '').substring(0, 200),
      });
    }
    return originalJson(body);
  };

  return _ajouterEvenement(req, res, next);
};
