import { validerCRV, deverrouillerCRV, verrouillerCRV } from '../../services/validation/validation.service.js';
import ValidationCRV from '../../models/validation/ValidationCRV.js';
import CRV from '../../models/crv/CRV.js';

export const validerCRVController = async (req, res, next) => {
  try {
    const { commentaires } = req.body;

    const validation = await validerCRV(
      req.params.id,
      req.user._id,
      commentaires
    );

    const validationPopulated = await ValidationCRV.findById(validation._id)
      .populate('crv')
      .populate('validePar')
      .populate('ecartsSLA.phase');

    // Notification : pipeline moderne via eventBus dans validation.service.js
    // (ex-notifierValidationCRV supprimé par EMAIL_PIPELINE_PROOF_LEGACY_CLEANUP)

    req.crvId = req.params.id;

    res.status(200).json({
      success: true,
      data: validationPopulated
    });
  } catch (error) {
    next(error);
  }
};

export const deverrouillerCRVController = async (req, res, next) => {
  try {
    const { raison } = req.body;

    if (!raison) {
      return res.status(400).json({
        success: false,
        message: 'Raison de déverrouillage requise'
      });
    }

    await deverrouillerCRV(req.params.id, req.user._id, raison);

    req.crvId = req.params.id;

    res.status(200).json({
      success: true,
      message: 'CRV déverrouillé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirValidation = async (req, res, next) => {
  try {
    const validation = await ValidationCRV.findOne({ crv: req.params.id })
      .populate('validePar')
      .populate('ecartsSLA.phase');

    if (!validation) {
      return res.status(404).json({
        success: false,
        message: 'Validation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verrouiller un CRV validé (VALIDE → VERROUILLE)
 * À utiliser si le verrouillage automatique est désactivé
 */
export const verrouillerCRVController = async (req, res, next) => {
  try {
    await verrouillerCRV(req.params.id, req.user._id);

    const crv = await CRV.findById(req.params.id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol')
      .populate('verrouillePar');

    req.crvId = req.params.id;

    res.status(200).json({
      success: true,
      message: 'CRV verrouillé avec succès',
      data: crv
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rejeter un CRV (TERMINE → EN_COURS)
 * Renvoie le CRV à l'agent pour correction avec commentaire obligatoire
 * Ne touche PAS validation.service.js (zone rouge) — logique inline
 */
export const rejeterCRVController = async (req, res, next) => {
  try {
    const { raison } = req.body;

    if (!raison || raison.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Raison du rejet requise'
      });
    }

    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut !== 'TERMINE') {
      return res.status(400).json({
        success: false,
        message: `Impossible de rejeter un CRV au statut ${crv.statut}. Seul un CRV TERMINE peut être rejeté.`
      });
    }

    const ancienStatut = crv.statut;
    crv.statut = 'EN_COURS';
    // STAB-4: historiqueRejets (array) au lieu de dernierRejet (non déclaré dans le schéma, ignoré par Mongoose strict)
    if (!crv.historiqueRejets) crv.historiqueRejets = [];
    crv.historiqueRejets.push({
      date: new Date(),
      par: req.user._id,
      raison: raison.trim()
    });
    await crv.save();

    console.log('[CRV][VALIDATION][REJET]', {
      crvId: crv._id,
      ancienStatut,
      nouveauStatut: 'EN_COURS',
      rejetePar: req.user._id,
      raison: raison.trim()
    });

    // Supprimer validation existante si elle existe
    await ValidationCRV.deleteOne({ crv: crv._id });

    req.crvId = req.params.id;

    const crvPopulated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('creePar')
      .populate('responsableVol');

    res.status(200).json({
      success: true,
      message: 'CRV rejeté — renvoyé à l\'agent pour correction',
      data: crvPopulated
    });
  } catch (error) {
    next(error);
  }
};
