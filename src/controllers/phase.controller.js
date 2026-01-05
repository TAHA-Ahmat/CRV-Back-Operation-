import ChronologiePhase from '../models/ChronologiePhase.js';
import CRV from '../models/CRV.js';
import { demarrerPhase, terminerPhase } from '../services/phase.service.js';
import { calculerCompletude } from '../services/crv.service.js';

export const demarrerPhaseController = async (req, res, next) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const phaseUpdated = await demarrerPhase(req.params.id, req.user._id);

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    next(error);
  }
};

export const terminerPhaseController = async (req, res, next) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const phaseUpdated = await terminerPhase(req.params.id);

    await calculerCompletude(chronoPhase.crv);

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    next(error);
  }
};

export const marquerPhaseNonRealisee = async (req, res, next) => {
  try {
    const { motifNonRealisation, detailMotif } = req.body;

    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    chronoPhase.statut = 'NON_REALISE';
    chronoPhase.motifNonRealisation = motifNonRealisation;
    chronoPhase.detailMotif = detailMotif;

    await chronoPhase.save();

    await calculerCompletude(chronoPhase.crv);

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: chronoPhase
    });
  } catch (error) {
    next(error);
  }
};

export const mettreAJourPhase = async (req, res, next) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const {
      heureDebutPrevue,
      heureFinPrevue,
      heureDebutReelle,
      heureFinReelle,
      remarques
    } = req.body;

    if (heureDebutPrevue) chronoPhase.heureDebutPrevue = heureDebutPrevue;
    if (heureFinPrevue) chronoPhase.heureFinPrevue = heureFinPrevue;
    if (heureDebutReelle) chronoPhase.heureDebutReelle = heureDebutReelle;
    if (heureFinReelle) chronoPhase.heureFinReelle = heureFinReelle;
    if (remarques !== undefined) chronoPhase.remarques = remarques;

    await chronoPhase.save();

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: chronoPhase
    });
  } catch (error) {
    next(error);
  }
};
