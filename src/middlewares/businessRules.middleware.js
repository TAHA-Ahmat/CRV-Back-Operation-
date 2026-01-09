import CRV from '../models/crv/CRV.js';
import Vol from '../models/flights/Vol.js';
import ChronologiePhase from '../models/phases/ChronologiePhase.js';
import Phase from '../models/phases/Phase.js';

/**
 * RÈGLE MÉTIER CRITIQUE : Vérifier que le CRV n'est pas verrouillé
 * Un CRV validé (statut VERROUILLE) est totalement immuable
 */
export const verifierCRVNonVerrouille = async (req, res, next) => {
  try {
    const crvId = req.params.id || req.body.crvId || req.crvId;

    if (!crvId) {
      return next();
    }

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
        message: 'INTERDIT : CRV validé et verrouillé - aucune modification possible',
        code: 'CRV_VERROUILLE'
      });
    }

    req.crv = crv;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RÈGLE MÉTIER CRITIQUE : Cohérence Phase <-> Type Opération Vol
 * - CRV Arrivée : phases ARRIVEE ou COMMUN uniquement
 * - CRV Départ : phases DEPART ou COMMUN uniquement
 * - CRV Turn Around : toutes phases autorisées
 */
export const verifierCoherencePhaseTypeOperation = async (req, res, next) => {
  try {
    const chronoPhaseId = req.params.id;

    if (!chronoPhaseId) {
      return next();
    }

    const chronoPhase = await ChronologiePhase.findById(chronoPhaseId)
      .populate('phase')
      .populate('crv');

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    const crv = chronoPhase.crv;
    const vol = await Vol.findById(crv.vol);

    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    const phaseTypeOperation = chronoPhase.phase.typeOperation;
    const volTypeOperation = vol.typeOperation;

    if (volTypeOperation === 'TURN_AROUND') {
      return next();
    }

    if (phaseTypeOperation === 'COMMUN') {
      return next();
    }

    if (phaseTypeOperation !== volTypeOperation) {
      return res.status(400).json({
        success: false,
        message: `INTERDIT : Cette phase est de type ${phaseTypeOperation} et ne peut être utilisée sur un vol de type ${volTypeOperation}`,
        code: 'INCOHERENCE_TYPE_OPERATION',
        details: {
          phaseType: phaseTypeOperation,
          volType: volTypeOperation,
          phaseLibelle: chronoPhase.phase.libelle
        }
      });
    }

    req.chronoPhase = chronoPhase;
    req.vol = vol;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RÈGLE MÉTIER CRITIQUE : Phase non réalisée DOIT avoir justification
 * motifNonRealisation ET detailMotif sont OBLIGATOIRES
 */
export const verifierJustificationNonRealisation = (req, res, next) => {
  const { motifNonRealisation, detailMotif } = req.body;

  if (!motifNonRealisation) {
    return res.status(400).json({
      success: false,
      message: 'INTERDIT : Une phase non réalisée doit avoir un motif obligatoire',
      code: 'MOTIF_NON_REALISATION_REQUIS',
      champsManquants: ['motifNonRealisation']
    });
  }

  if (!detailMotif || detailMotif.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'INTERDIT : Une phase non réalisée doit avoir un détail de justification',
      code: 'DETAIL_MOTIF_REQUIS',
      champsManquants: ['detailMotif']
    });
  }

  next();
};

/**
 * RÈGLE MÉTIER CRITIQUE : Distinction 0 vs champ absent
 * Pour les charges opérationnelles, 0 signifie "zéro enregistré"
 * undefined/null signifie "non saisi"
 */
export const validerCoherenceCharges = (req, res, next) => {
  const { typeCharge, sensOperation } = req.body;

  if (!typeCharge || !sensOperation) {
    return res.status(400).json({
      success: false,
      message: 'Type de charge et sens d\'opération requis',
      code: 'CHAMPS_REQUIS_MANQUANTS'
    });
  }

  if (typeCharge === 'PASSAGERS') {
    const {
      passagersAdultes,
      passagersEnfants,
      passagersPMR,
      passagersTransit
    } = req.body;

    const total = (passagersAdultes || 0) +
                  (passagersEnfants || 0) +
                  (passagersPMR || 0) +
                  (passagersTransit || 0);

    if (total === 0 && passagersAdultes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'INTERDIT : Pour les passagers, vous devez saisir explicitement les valeurs (même si zéro)',
        code: 'VALEURS_EXPLICITES_REQUISES',
        details: 'Distinguez "0 passagers" (saisi) de "non renseigné" (absent)'
      });
    }
  }

  if (typeCharge === 'BAGAGES') {
    const { nombreBagagesSoute, poidsBagagesSouteKg } = req.body;

    if (nombreBagagesSoute !== undefined && nombreBagagesSoute > 0 && !poidsBagagesSouteKg) {
      return res.status(400).json({
        success: false,
        message: 'INTERDIT : Si bagages en soute, le poids doit être renseigné',
        code: 'POIDS_REQUIS_AVEC_BAGAGES'
      });
    }
  }

  if (typeCharge === 'FRET') {
    const { nombreFret, poidsFretKg, typeFret } = req.body;

    if (nombreFret !== undefined && nombreFret > 0) {
      if (!poidsFretKg) {
        return res.status(400).json({
          success: false,
          message: 'INTERDIT : Si fret présent, le poids doit être renseigné',
          code: 'POIDS_FRET_REQUIS'
        });
      }

      if (!typeFret) {
        return res.status(400).json({
          success: false,
          message: 'INTERDIT : Si fret présent, le type doit être précisé',
          code: 'TYPE_FRET_REQUIS'
        });
      }
    }
  }

  next();
};

/**
 * RÈGLE MÉTIER : Vérifier qu'une phase peut être initialisée pour ce type de vol
 */
export const verifierPhasesAutoriseesCreationCRV = async (req, res, next) => {
  try {
    const { volId } = req.body;

    // Si volId n'est pas fourni, le controller créera un vol automatiquement
    if (!volId) {
      return next();
    }

    const vol = await Vol.findById(volId);

    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    req.vol = vol;
    next();
  } catch (error) {
    next(error);
  }
};
