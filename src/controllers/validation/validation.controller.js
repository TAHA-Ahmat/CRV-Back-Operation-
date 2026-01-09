import { validerCRV, deverrouillerCRV, verrouillerCRV } from '../../services/validation/validation.service.js';
import ValidationCRV from '../../models/validation/ValidationCRV.js';
import CRV from '../../models/crv/CRV.js';
import { notifierValidationCRV } from '../../services/notifications/notification.service.js';

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

    // Envoyer notification au créateur du CRV
    try {
      const crv = await CRV.findById(req.params.id)
        .populate('vol')
        .populate('creePar');

      if (crv && crv.creePar && crv.creePar.email) {
        await notifierValidationCRV(crv, req.user, crv.creePar);
      }
    } catch (notifError) {
      // Ne pas bloquer la validation si l'email échoue
      console.error('Erreur notification email:', notifError);
    }

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
