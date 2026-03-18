/**
 * Wrapper Engins CRV — Ajoute la journalisation CRVEvent
 * aux fonctions engins de engin.controller.js.
 *
 * Stratégie identique au wrapper personnel : intercepter res.json()
 * pour détecter le succès, puis journaliser l'événement approprié.
 */
import {
  mettreAJourEnginsAffectes as _mettreAJourEnginsAffectes,
  ajouterEnginAuCRV as _ajouterEnginAuCRV,
  retirerEnginDuCRV as _retirerEnginDuCRV,
} from '../resources/engin.controller.js';
import { logCRVEvent } from '../../services/crv/crvEvent.service.js';
import AffectationEnginVol from '../../models/resources/AffectationEnginVol.js';
import CRV from '../../models/crv/CRV.js';

/**
 * PUT /api/crv/:id/engins — Remplacement batch des engins affectés
 * Journalise ENGINS_UPDATED avec ancien/nouveau count
 */
export const mettreAJourEnginsAffectes = async (req, res, next) => {
  // Capturer l'état avant pour le journal
  let ancienCount = 0;
  try {
    const crv = await CRV.findById(req.params.id).select('vol').lean();
    if (crv?.vol) {
      ancienCount = await AffectationEnginVol.countDocuments({ vol: crv.vol });
    }
  } catch (e) {
    // Ne pas bloquer l'opération si la lecture échoue
  }

  // Intercepter res.json pour journaliser après succès
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body?.success) {
      const nouveauCount = body.data?.nbEngins || 0;
      logCRVEvent(req.params.id, 'ENGINS_UPDATED', req.user?._id, {
        ancienCount,
        nouveauCount,
        action: 'BATCH_REPLACE',
      });
    }
    return originalJson(body);
  };

  return _mettreAJourEnginsAffectes(req, res, next);
};

/**
 * POST /api/crv/:id/engins — Ajout unitaire d'un engin
 * Journalise ENGIN_ASSIGNED avec les données de l'engin
 */
export const ajouterEnginAuCRV = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 201 && body?.success) {
      logCRVEvent(req.params.id, 'ENGIN_ASSIGNED', req.user?._id, {
        enginId: req.body.enginId,
        usage: req.body.usage,
      });
    }
    return originalJson(body);
  };

  return _ajouterEnginAuCRV(req, res, next);
};

/**
 * DELETE /api/crv/:id/engins/:affectationId — Suppression unitaire
 * Journalise ENGIN_REMOVED avec l'ID de l'affectation supprimée
 */
export const retirerEnginDuCRV = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body?.success) {
      logCRVEvent(req.params.id, 'ENGIN_REMOVED', req.user?._id, {
        affectationId: req.params.affectationId,
      });
    }
    return originalJson(body);
  };

  return _retirerEnginDuCRV(req, res, next);
};
