/**
 * Wrapper Observations CRV — Ajoute la journalisation CRVEvent
 * à la fonction ajouterObservation de crv.controller.js (zone rouge).
 *
 * Stratégie identique aux wrappers personnel, engins, charges et événements :
 * intercepter res.json() pour détecter le succès,
 * puis journaliser l'événement approprié.
 *
 * Type CRVEvent : OBSERVATION_ADDED (défini dans l'enum, jamais appelé avant ce wrapper)
 */
import {
  ajouterObservation as _ajouterObservation,
} from './crv.controller.js';
import { logCRVEvent } from '../../services/crv/crvEvent.service.js';

/**
 * POST /api/crv/:id/observations — Ajout d'une observation opérationnelle
 * Journalise OBSERVATION_ADDED avec la catégorie, visibilité et contenu (tronqué)
 */
export const ajouterObservation = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 201 && body?.success) {
      const observation = body.data;
      logCRVEvent(req.params.id, 'OBSERVATION_ADDED', req.user?._id, {
        observationId: observation?._id,
        categorie: observation?.categorie || req.body.categorie,
        visibilite: observation?.visibilite || req.body.visibilite || 'INTERNE',
        contenu: (observation?.contenu || req.body.contenu || '').substring(0, 200),
      });
    }
    return originalJson(body);
  };

  return _ajouterObservation(req, res, next);
};
