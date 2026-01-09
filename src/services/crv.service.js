import CRV from '../models/CRV.js';
import ChronologiePhase from '../models/ChronologiePhase.js';
import ChargeOperationnelle from '../models/ChargeOperationnelle.js';
import EvenementOperationnel from '../models/EvenementOperationnel.js';
import Observation from '../models/Observation.js';

/**
 * CALCUL DE COMPLÉTUDE CRV
 *
 * PONDÉRATION OFFICIELLE (Cahier des charges métier v1.0) :
 * - Phases       : 40% (pro-rata des phases terminées/non-réalisées)
 * - Charges      : 30% (présence de charges opérationnelles - flux passagers/bagages/fret)
 * - Événements   : 20% (TOUJOURS attribués - absence = vol nominal, pas d'anomalie)
 * - Observations : 10% (TOUJOURS attribués - absence = rien de particulier à signaler)
 *
 * RÈGLES MÉTIER (§4 cahier des charges) :
 * - On documente ce qui s'est passé, jamais ce qui ne s'est pas passé
 * - L'absence de données = opération non réalisée (pour phases/charges)
 * - L'absence d'événement = vol nominal (pas d'anomalie à signaler)
 * - L'absence d'observation = rien de particulier à noter
 * - 0 est une valeur valide (ex: 0 passagers = saisi explicitement)
 * - null/undefined = non saisi
 *
 * SUPPRIMÉ : confirmationAucunEvenement, confirmationAucuneObservation, confirmationAucuneCharge
 * Ces anti-patterns métier ont été retirés du modèle CRV.
 */
export const calculerCompletude = async (crvId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][COMPLETUDE_CALC_START]', {
    crvId,
    userId: null,
    role: null,
    input: { crvId },
    decision: null,
    reason: 'Début calcul complétude',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(crvId).populate('vol horaire');
    if (!crv) {
      console.log('[CRV][SERVICE][COMPLETUDE_CALC_ERROR]', {
        crvId,
        userId: null,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV non trouvé',
        output: { completude: 0 },
        timestamp: new Date().toISOString()
      });
      return 0;
    }

    let score = 0;
    const details = {};

    // ========================================
    // PHASES : 40% (pro-rata des phases terminées)
    // ========================================
    const phases = await ChronologiePhase.find({ crv: crvId });
    const phasesTerminees = phases.filter(p => p.statut === 'TERMINE' || p.statut === 'NON_REALISE');

    if (phases.length > 0) {
      const scorePhases = (phasesTerminees.length / phases.length) * 40;
      score += scorePhases;
      details.phases = { total: phases.length, terminees: phasesTerminees.length, score: scorePhases };
    } else {
      details.phases = { total: 0, terminees: 0, score: 0 };
    }

    // ========================================
    // CHARGES : 30% (présence de charges opérationnelles)
    // Règle métier : on attend des données de flux passagers/bagages/fret
    // Règle VIDE ≠ ZÉRO : seules les charges avec données réellement saisies comptent
    // ========================================
    const charges = await ChargeOperationnelle.find({ crv: crvId });

    // Filtrer les charges avec données réellement saisies (au moins un champ non null)
    const chargesAvecDonnees = charges.filter(c => {
      // Vérifier si au moins un champ de données est renseigné
      const passagersSaisis = c.passagersAdultes !== null || c.passagersEnfants !== null ||
                              c.passagersPMR !== null || c.passagersTransit !== null;
      const bagagesSaisis = c.nombreBagagesSoute !== null || c.nombreBagagesCabine !== null;
      const fretSaisi = c.nombreFret !== null || c.poidsFretKg !== null || c.typeFret !== null;

      return passagersSaisis || bagagesSaisis || fretSaisi;
    });

    if (chargesAvecDonnees.length > 0) {
      const typesCharges = [...new Set(chargesAvecDonnees.map(c => c.typeCharge))];
      let scoreCharges = 0;
      if (typesCharges.length >= 3) {
        scoreCharges = 30;
      } else if (typesCharges.length === 2) {
        scoreCharges = 25;
      } else {
        scoreCharges = 20;
      }
      score += scoreCharges;
      details.charges = { count: chargesAvecDonnees.length, types: typesCharges, score: scoreCharges };
    } else {
      details.charges = { count: 0, score: 0 };
    }

    // ========================================
    // ÉVÉNEMENTS : 20% (TOUJOURS attribués)
    // Règle métier : absence d'événement = vol nominal (pas d'anomalie)
    // On ne pénalise jamais l'absence d'anomalies
    // ========================================
    const evenements = await EvenementOperationnel.find({ crv: crvId });

    // 20% TOUJOURS attribués - l'absence d'événement signifie vol nominal
    score += 20;
    if (evenements.length > 0) {
      details.evenements = { count: evenements.length, score: 20, statut: 'anomalies_documentees' };
    } else {
      details.evenements = { count: 0, score: 20, statut: 'vol_nominal' };
    }

    // ========================================
    // OBSERVATIONS : 10% (TOUJOURS attribués)
    // Règle métier : absence d'observation = rien de particulier à signaler
    // On ne pénalise jamais l'absence de remarques
    // ========================================
    const observations = await Observation.find({ crv: crvId });

    // 10% TOUJOURS attribués - l'absence d'observation signifie rien à signaler
    score += 10;
    if (observations.length > 0) {
      details.observations = { count: observations.length, score: 10, statut: 'remarques_documentees' };
    } else {
      details.observations = { count: 0, score: 10, statut: 'rien_a_signaler' };
    }

    const completude = Math.round(score);

    await CRV.findByIdAndUpdate(crvId, { completude });

    console.log('[CRV][SERVICE][COMPLETUDE_CALC_SUCCESS]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'COMPLETE',
      reason: 'Calcul complétude terminé',
      output: { completude, details },
      timestamp: new Date().toISOString()
    });

    return completude;
  } catch (error) {
    console.log('[CRV][SERVICE][COMPLETUDE_CALC_ERROR]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'ERROR',
      reason: error.message,
      output: { completude: 0 },
      timestamp: new Date().toISOString()
    });
    return 0;
  }
};

export const verifierConformiteSLA = async (crvId, compagnieAerienne) => {
  try {
    const phases = await ChronologiePhase.find({ crv: crvId })
      .populate('phase');

    const ecarts = [];

    for (const chronoPhase of phases) {
      if (chronoPhase.statut === 'TERMINE' && chronoPhase.ecartMinutes) {
        const ecartAbsolu = Math.abs(chronoPhase.ecartMinutes);

        if (ecartAbsolu > 15) {
          ecarts.push({
            phase: chronoPhase.phase._id,
            ecartMinutes: chronoPhase.ecartMinutes,
            description: `Écart de ${chronoPhase.ecartMinutes} minutes pour ${chronoPhase.phase.libelle}`
          });
        }
      }
    }

    const conformite = ecarts.length === 0;

    return {
      conformite,
      ecarts,
      nbEcarts: ecarts.length
    };
  } catch (error) {
    console.error('Erreur lors de la vérification SLA:', error);
    return { conformite: false, ecarts: [], nbEcarts: 0 };
  }
};

export const genererNumeroCRV = async (vol) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const count = await CRV.countDocuments({
    dateCreation: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    }
  });

  const sequence = (count + 1).toString().padStart(4, '0');

  return `CRV${year}${month}${day}-${sequence}`;
};

export const calculerDureesPhases = (heureDebut, heureFin) => {
  if (!heureDebut || !heureFin) {
    return null;
  }

  const debut = new Date(heureDebut);
  const fin = new Date(heureFin);

  if (fin < debut) {
    return null;
  }

  const dureeMs = fin - debut;
  const dureeMinutes = Math.round(dureeMs / 60000);

  return dureeMinutes;
};

/**
 * DÉDUCTION DU TYPE D'OPÉRATION (Cahier des charges §3)
 *
 * Règle métier fondamentale :
 * - Le type d'opération n'est JAMAIS choisi à l'avance
 * - Il est DÉDUIT automatiquement à partir des données réellement saisies
 *
 * Logique de déduction :
 * - Phases ARRIVEE utilisées (TERMINE) + Phases DEPART utilisées → TURN_AROUND
 * - Phases ARRIVEE utilisées uniquement → ARRIVEE
 * - Phases DEPART utilisées uniquement → DEPART
 * - Aucune phase utilisée → null (indéterminé)
 *
 * Données complémentaires prises en compte :
 * - Horaires arrivée (atterrissage, arrivée parc, ouverture porte)
 * - Horaires départ (fermeture porte, départ parc, décollage)
 * - Charges avec sensOperation DEBARQUEMENT ou EMBARQUEMENT
 *
 * @param {string} crvId - ID du CRV
 * @returns {Object} { typeOperation, details, confidence }
 */
export const deduireTypeOperation = async (crvId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][DEDUIRE_TYPE_START]', {
    crvId,
    userId: null,
    role: null,
    input: { crvId },
    decision: null,
    reason: 'Début déduction type opération',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(crvId).populate('vol horaire');
    if (!crv) {
      console.log('[CRV][SERVICE][DEDUIRE_TYPE_ERROR]', {
        crvId,
        userId: null,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV non trouvé',
        output: { typeOperation: null },
        timestamp: new Date().toISOString()
      });
      return { typeOperation: null, details: {}, confidence: 0 };
    }

    // Récupérer les phases avec leur référentiel
    const chronoPhases = await ChronologiePhase.find({ crv: crvId }).populate('phase');

    // Récupérer les charges
    const charges = await ChargeOperationnelle.find({ crv: crvId });

    // Analyser les phases utilisées (TERMINE ou NON_REALISE avec données)
    const phasesUtilisees = chronoPhases.filter(cp =>
      cp.statut === 'TERMINE' ||
      (cp.statut === 'NON_REALISE' && cp.motifNonRealisation)
    );

    // Classifier par type d'opération
    const phasesArrivee = phasesUtilisees.filter(cp => cp.phase?.typeOperation === 'ARRIVEE');
    const phasesDepart = phasesUtilisees.filter(cp => cp.phase?.typeOperation === 'DEPART');
    const phasesTurnAround = phasesUtilisees.filter(cp => cp.phase?.typeOperation === 'TURN_AROUND');

    // Analyser les horaires
    const horaire = crv.horaire;
    const hasHorairesArrivee = horaire && (
      horaire.heureAtterrissageReelle ||
      horaire.heureArriveeAuParcReelle ||
      horaire.heureOuvertureParkingReelle
    );
    const hasHorairesDepart = horaire && (
      horaire.heureFermetureParkingReelle ||
      horaire.heureDepartDuParcReelle ||
      horaire.heureDecollageReelle
    );

    // Analyser les charges
    const chargesDebarquement = charges.filter(c => c.sensOperation === 'DEBARQUEMENT');
    const chargesEmbarquement = charges.filter(c => c.sensOperation === 'EMBARQUEMENT');

    // Calcul des indicateurs
    const indicateursArrivee = (phasesArrivee.length > 0 ? 1 : 0) +
                               (hasHorairesArrivee ? 1 : 0) +
                               (chargesDebarquement.length > 0 ? 1 : 0);
    const indicateursDepart = (phasesDepart.length > 0 ? 1 : 0) +
                              (hasHorairesDepart ? 1 : 0) +
                              (chargesEmbarquement.length > 0 ? 1 : 0);

    // Déduction du type
    let typeOperation = null;
    let confidence = 0;

    if (indicateursArrivee > 0 && indicateursDepart > 0) {
      // Données des deux côtés = TURN_AROUND
      typeOperation = 'TURN_AROUND';
      confidence = Math.round(((indicateursArrivee + indicateursDepart) / 6) * 100);
    } else if (indicateursArrivee > 0 && indicateursDepart === 0) {
      // Uniquement arrivée
      typeOperation = 'ARRIVEE';
      confidence = Math.round((indicateursArrivee / 3) * 100);
    } else if (indicateursDepart > 0 && indicateursArrivee === 0) {
      // Uniquement départ
      typeOperation = 'DEPART';
      confidence = Math.round((indicateursDepart / 3) * 100);
    } else {
      // Aucune donnée suffisante
      typeOperation = null;
      confidence = 0;
    }

    // Prise en compte des phases TURN_AROUND explicites
    if (phasesTurnAround.length > 0 && typeOperation !== 'TURN_AROUND') {
      typeOperation = 'TURN_AROUND';
    }

    const details = {
      phasesArrivee: phasesArrivee.length,
      phasesDepart: phasesDepart.length,
      phasesTurnAround: phasesTurnAround.length,
      hasHorairesArrivee,
      hasHorairesDepart,
      chargesDebarquement: chargesDebarquement.length,
      chargesEmbarquement: chargesEmbarquement.length,
      indicateursArrivee,
      indicateursDepart
    };

    console.log('[CRV][SERVICE][DEDUIRE_TYPE_SUCCESS]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: typeOperation ? 'DEDUIT' : 'INDETERMINE',
      reason: typeOperation ? `Type déduit: ${typeOperation}` : 'Données insuffisantes',
      output: { typeOperation, confidence, details },
      timestamp: new Date().toISOString()
    });

    return { typeOperation, details, confidence };
  } catch (error) {
    console.log('[CRV][SERVICE][DEDUIRE_TYPE_ERROR]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'ERROR',
      reason: error.message,
      output: { typeOperation: null },
      timestamp: new Date().toISOString()
    });
    return { typeOperation: null, details: {}, confidence: 0 };
  }
};

/**
 * MET À JOUR LE TYPE D'OPÉRATION DU VOL
 *
 * À appeler lors de la clôture/validation du CRV pour figer le type déduit
 *
 * @param {string} crvId - ID du CRV
 * @returns {Object} { success, typeOperation, message }
 */
export const mettreAJourTypeOperation = async (crvId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][MAJ_TYPE_OPERATION_START]', {
    crvId,
    userId: null,
    role: null,
    input: { crvId },
    decision: null,
    reason: 'Début mise à jour type opération',
    output: null,
    timestamp
  });

  try {
    const { typeOperation, confidence } = await deduireTypeOperation(crvId);

    if (!typeOperation) {
      console.log('[CRV][SERVICE][MAJ_TYPE_OPERATION_REJECT]', {
        crvId,
        userId: null,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'Type indéterminé - données insuffisantes',
        output: { typeOperation: null },
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        typeOperation: null,
        message: 'Type d\'opération indéterminé - données insuffisantes'
      };
    }

    const crv = await CRV.findById(crvId).populate('vol');
    if (!crv || !crv.vol) {
      console.log('[CRV][SERVICE][MAJ_TYPE_OPERATION_ERROR]', {
        crvId,
        userId: null,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV ou Vol non trouvé',
        output: { typeOperation: null },
        timestamp: new Date().toISOString()
      });
      return { success: false, typeOperation: null, message: 'CRV ou Vol non trouvé' };
    }

    // Mise à jour du Vol avec le type déduit
    const Vol = (await import('../models/Vol.js')).default;
    await Vol.findByIdAndUpdate(crv.vol._id, { typeOperation });

    console.log('[CRV][SERVICE][MAJ_TYPE_OPERATION_SUCCESS]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'UPDATE',
      reason: `Type opération mis à jour: ${typeOperation}`,
      output: { typeOperation, confidence, volId: crv.vol._id },
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      typeOperation,
      confidence,
      message: `Type d'opération déduit et enregistré: ${typeOperation}`
    };
  } catch (error) {
    console.log('[CRV][SERVICE][MAJ_TYPE_OPERATION_ERROR]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'ERROR',
      reason: error.message,
      output: null,
      timestamp: new Date().toISOString()
    });
    return { success: false, typeOperation: null, message: error.message };
  }
};
