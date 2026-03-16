/**
 * Wrapper Personnel CRV — Ajoute la journalisation CRVEvent
 * aux fonctions personnel de crv.controller.js (zone rouge).
 *
 * Stratégie : intercepter res.json() pour détecter le succès,
 * puis journaliser l'événement approprié sans modifier le controller original.
 */
import {
  mettreAJourPersonnel as _mettreAJourPersonnel,
  ajouterPersonnel as _ajouterPersonnel,
  supprimerPersonnel as _supprimerPersonnel,
} from './crv.controller.js';
import { logCRVEvent } from '../../services/crv/crvEvent.service.js';
import CRV from '../../models/crv/CRV.js';

/**
 * PUT /api/crv/:id/personnel — Remplacement batch du personnel
 * Journalise PERSONNEL_UPDATED avec ancien/nouveau count
 */
export const mettreAJourPersonnel = async (req, res, next) => {
  // Capturer l'état avant pour le journal
  let ancienCount = 0;
  try {
    const crv = await CRV.findById(req.params.id).select('personnelAffecte').lean();
    ancienCount = crv?.personnelAffecte?.length || 0;
  } catch (e) {
    // Ne pas bloquer l'opération si la lecture échoue
  }

  // Intercepter res.json pour journaliser après succès
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body?.success) {
      const nouveauCount = body.data?.nbPersonnes || 0;
      logCRVEvent(req.params.id, 'PERSONNEL_UPDATED', req.user?._id, {
        ancienCount,
        nouveauCount,
        action: 'BATCH_REPLACE',
      });
    }
    return originalJson(body);
  };

  return _mettreAJourPersonnel(req, res, next);
};

/**
 * POST /api/crv/:id/personnel — Ajout unitaire d'une personne
 * Journalise PERSONNEL_ADDED avec les données de la personne
 */
export const ajouterPersonnel = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 201 && body?.success) {
      logCRVEvent(req.params.id, 'PERSONNEL_ADDED', req.user?._id, {
        personne: {
          nom: req.body.nom,
          prenom: req.body.prenom,
          fonction: req.body.fonction,
        },
        nbPersonnesTotal: body.data?.nbPersonnes || 0,
      });
    }
    return originalJson(body);
  };

  return _ajouterPersonnel(req, res, next);
};

/**
 * DELETE /api/crv/:id/personnel/:personneId — Suppression unitaire
 * Journalise PERSONNEL_REMOVED avec l'ID de la personne supprimée
 */
export const supprimerPersonnel = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body?.success) {
      logCRVEvent(req.params.id, 'PERSONNEL_REMOVED', req.user?._id, {
        personneId: req.params.personneId,
        nbPersonnesRestantes: body.data?.nbPersonnes || 0,
      });
    }
    return originalJson(body);
  };

  return _supprimerPersonnel(req, res, next);
};
