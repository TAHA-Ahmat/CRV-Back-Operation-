import CRV from '../models/crv/CRV.js';
import Vol from '../models/flights/Vol.js';
import ChronologiePhase from '../models/phases/ChronologiePhase.js';
import Phase from '../models/phases/Phase.js';

/**
 * RÈGLE MÉTIER CRITIQUE : Vérifier que le CRV n'est pas figé
 * Un CRV validé (VALIDE), verrouillé (VERROUILLE), terminé (TERMINE) ou annulé (ANNULE) est non modifiable.
 * Seuls EN_COURS et BROUILLON restent éditables.
 */
// MISSION 022 — Ajout ANNULE aux statuts non modifiables + protection archivage
// BUG-04 FIX — Ajouter TERMINE aux statuts non modifiables (empêcher PATCH sur CRV finalisé)
const STATUTS_NON_MODIFIABLES = ['TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE'];

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

    // MISSION 022 — Immutabilité archivage : un CRV archivé est IMMUABLE
    if (crv.archivage?.archivedAt) {
      return res.status(403).json({
        success: false,
        message: 'INTERDIT : CRV archivé — document immuable, aucune modification possible',
        code: 'CRV_IMMUTABLE_ARCHIVE'
      });
    }

    if (STATUTS_NON_MODIFIABLES.includes(crv.statut)) {
      return res.status(403).json({
        success: false,
        message: `INTERDIT : CRV au statut ${crv.statut} - aucune modification possible`,
        code: 'CRV_NON_MODIFIABLE'
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
 * RÈGLE MÉTIER : Phase non réalisée DOIT avoir justification
 * - motifNonRealisation : OBLIGATOIRE (enum validé en amont)
 * - detailMotif : OBLIGATOIRE uniquement si motif = 'AUTRE'
 *   (les autres motifs sont auto-explicatifs)
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

  // detailMotif obligatoire UNIQUEMENT si motif = AUTRE
  if (motifNonRealisation === 'AUTRE' && (!detailMotif || detailMotif.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: 'INTERDIT : Le motif "AUTRE" nécessite un détail de justification',
      code: 'DETAIL_MOTIF_REQUIS_POUR_AUTRE',
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
export const validerCoherenceCharges = async (req, res, next) => {
  const { typeCharge, sensOperation } = req.body;
  const crvId = req.params.id;

  if (!typeCharge || !sensOperation) {
    return res.status(400).json({
      success: false,
      message: 'Type de charge et sens d\'opération requis',
      code: 'CHAMPS_REQUIS_MANQUANTS'
    });
  }

  // FIX BUG #11 — Unicite typeCharge + sensOperation par CRV
  try {
    const { default: ChargeOperationnelle } = await import('../models/charges/ChargeOperationnelle.js');
    const doublonExistant = await ChargeOperationnelle.findOne({
      crv: crvId, typeCharge, sensOperation
    });
    if (doublonExistant) {
      return res.status(409).json({
        success: false,
        message: `Doublon interdit: une charge ${typeCharge} ${sensOperation} existe deja pour ce CRV`,
        code: 'CHARGE_DOUBLON',
        details: { typeCharge, sensOperation, chargeExistanteId: doublonExistant._id }
      });
    }
  } catch (err) {
    console.error('[MIDDLEWARE][CHARGES] Erreur verification doublon:', err.message);
  }

  if (typeCharge === 'PASSAGERS') {
    const {
      passagersAdultes,
      passagersEnfants,
      passagersPMR,
      passagersTransit,
      passagersBebes
    } = req.body;

    const total = (passagersAdultes || 0) +
                  (passagersEnfants || 0) +
                  (passagersPMR || 0) +
                  (passagersTransit || 0) +
                  (passagersBebes || 0);

    if (total === 0 && passagersAdultes === undefined && passagersBebes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'INTERDIT : Pour les passagers, vous devez saisir explicitement les valeurs (même si zéro)',
        code: 'VALEURS_EXPLICITES_REQUISES',
        details: 'Distinguez "0 passagers" (saisi) de "non renseigné" (absent)'
      });
    }

    // FIX BUG #12 — Limites raisonnables passagers
    const MAX_PASSAGERS = 1000;
    const valeurs = { passagersAdultes, passagersEnfants, passagersPMR, passagersTransit, passagersBebes };
    for (const [champ, val] of Object.entries(valeurs)) {
      if (val !== undefined && val > MAX_PASSAGERS) {
        return res.status(400).json({
          success: false,
          message: `Valeur ${champ} (${val}) depasse le maximum autorise (${MAX_PASSAGERS})`,
          code: 'VALEUR_CHARGE_EXCESSIVE',
          details: { champ, valeur: val, maximum: MAX_PASSAGERS }
        });
      }
    }
  }

  if (typeCharge === 'BAGAGES') {
    const { nombreBagagesSoute, poidsBagagesSouteKg } = req.body;

    // FIX BUG #12 — Limites raisonnables bagages
    if (nombreBagagesSoute !== undefined && nombreBagagesSoute > 50000) {
      return res.status(400).json({
        success: false,
        message: `Nombre bagages (${nombreBagagesSoute}) depasse le maximum autorise (50000)`,
        code: 'VALEUR_CHARGE_EXCESSIVE'
      });
    }

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

    // FIX BUG #12 — Limites raisonnables fret
    if (poidsFretKg !== undefined && poidsFretKg > 200000) {
      return res.status(400).json({
        success: false,
        message: `Poids fret (${poidsFretKg}kg) depasse le maximum autorise (200000kg)`,
        code: 'VALEUR_CHARGE_EXCESSIVE'
      });
    }

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
