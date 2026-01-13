import Phase from '../../models/phases/Phase.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';

/**
 * INITIALISATION DES PHASES CRV (Cahier des charges §3)
 *
 * Règle métier : Les phases sont filtrées selon le type d'opération du vol.
 * - ARRIVEE : phases ARRIVEE + COMMUN
 * - DEPART : phases DEPART + COMMUN
 * - TURN_AROUND : phases ARRIVEE + DEPART + TURN_AROUND + COMMUN
 *
 * @param {string} crvId - ID du CRV
 * @param {string} typeOperation - Type d'opération du vol (ARRIVEE, DEPART, TURN_AROUND)
 */
export const initialiserPhasesVol = async (crvId, typeOperation = null) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][INIT_PHASES_START]', {
    crvId,
    userId: null,
    role: null,
    input: { crvId, typeOperation },
    decision: null,
    reason: 'Début initialisation phases CRV',
    output: null,
    timestamp
  });

  try {
    // Construire le filtre selon le type d'opération
    let typeFilter;
    if (typeOperation === 'TURN_AROUND') {
      // TURN_AROUND = toutes les phases
      typeFilter = ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'COMMUN'];
    } else if (typeOperation === 'ARRIVEE') {
      // ARRIVEE = phases ARRIVEE + COMMUN uniquement
      typeFilter = ['ARRIVEE', 'COMMUN'];
    } else if (typeOperation === 'DEPART') {
      // DEPART = phases DEPART + COMMUN uniquement
      typeFilter = ['DEPART', 'COMMUN'];
    } else {
      // Par défaut, charger toutes les phases
      typeFilter = ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'COMMUN'];
    }

    const phasesRef = await Phase.find({
      actif: true,
      typeOperation: { $in: typeFilter }
    }).sort({ ordre: 1 });

    // Comptage par type pour information
    const parType = {
      ARRIVEE: phasesRef.filter(p => p.typeOperation === 'ARRIVEE').length,
      DEPART: phasesRef.filter(p => p.typeOperation === 'DEPART').length,
      TURN_AROUND: phasesRef.filter(p => p.typeOperation === 'TURN_AROUND').length,
      COMMUN: phasesRef.filter(p => p.typeOperation === 'COMMUN').length
    };

    const chronologies = [];

    for (const phase of phasesRef) {
      const chrono = await ChronologiePhase.create({
        crv: crvId,
        phase: phase._id,
        statut: 'NON_COMMENCE'
      });
      chronologies.push(chrono);
    }

    console.log('[CRV][SERVICE][INIT_PHASES_SUCCESS]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'INIT',
      reason: 'Phases initialisées avec succès',
      output: {
        totalPhases: chronologies.length,
        parType
      },
      timestamp: new Date().toISOString()
    });

    return chronologies;
  } catch (error) {
    console.log('[CRV][SERVICE][INIT_PHASES_ERROR]', {
      crvId,
      userId: null,
      role: null,
      input: { crvId },
      decision: 'ERROR',
      reason: error.message,
      output: null,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const verifierPrerequisPhase = async (chronoPhaseId) => {
  const timestamp = new Date().toISOString();

  try {
    const chronoPhase = await ChronologiePhase.findById(chronoPhaseId)
      .populate('phase');

    if (!chronoPhase || !chronoPhase.phase.prerequis || chronoPhase.phase.prerequis.length === 0) {
      console.log('[CRV][SERVICE][VERIF_PREREQUIS_SUCCESS]', {
        crvId: chronoPhase?.crv || null,
        userId: null,
        role: null,
        input: { chronoPhaseId },
        decision: 'VALIDE',
        reason: 'Aucun prérequis défini',
        output: { valide: true, prerequisManquants: [] },
        timestamp
      });
      return { valide: true, prerequisManquants: [] };
    }

    const prerequisManquants = [];

    for (const prerequisId of chronoPhase.phase.prerequis) {
      const chronoPrerequis = await ChronologiePhase.findOne({
        crv: chronoPhase.crv,
        phase: prerequisId
      });

      if (!chronoPrerequis || (chronoPrerequis.statut !== 'TERMINE' && chronoPrerequis.statut !== 'NON_REALISE')) {
        const phaseRef = await Phase.findById(prerequisId);
        prerequisManquants.push(phaseRef.libelle);
      }
    }

    const resultat = {
      valide: prerequisManquants.length === 0,
      prerequisManquants
    };

    console.log('[CRV][SERVICE][VERIF_PREREQUIS_RESULT]', {
      crvId: chronoPhase.crv,
      userId: null,
      role: null,
      input: { chronoPhaseId, phaseLibelle: chronoPhase.phase.libelle },
      decision: resultat.valide ? 'VALIDE' : 'INVALIDE',
      reason: resultat.valide ? 'Tous prérequis satisfaits' : `${prerequisManquants.length} prérequis manquant(s)`,
      output: resultat,
      timestamp: new Date().toISOString()
    });

    return resultat;
  } catch (error) {
    console.log('[CRV][SERVICE][VERIF_PREREQUIS_ERROR]', {
      crvId: null,
      userId: null,
      role: null,
      input: { chronoPhaseId },
      decision: 'ERROR',
      reason: error.message,
      output: { valide: false, prerequisManquants: [] },
      timestamp: new Date().toISOString()
    });
    return { valide: false, prerequisManquants: [] };
  }
};

export const demarrerPhase = async (chronoPhaseId, userId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][DEMARRER_PHASE_START]', {
    crvId: null,
    userId,
    role: null,
    input: { chronoPhaseId },
    decision: null,
    reason: 'Début démarrage phase',
    output: null,
    timestamp
  });

  try {
    const verif = await verifierPrerequisPhase(chronoPhaseId);

    if (!verif.valide) {
      console.log('[CRV][SERVICE][DEMARRER_PHASE_REJECT]', {
        crvId: null,
        userId,
        role: null,
        input: { chronoPhaseId },
        decision: 'REJECT',
        reason: `Prérequis non satisfaits: ${verif.prerequisManquants.join(', ')}`,
        output: { prerequisManquants: verif.prerequisManquants },
        timestamp: new Date().toISOString()
      });
      throw new Error(`Prérequis non satisfaits: ${verif.prerequisManquants.join(', ')}`);
    }

    const chronoPhase = await ChronologiePhase.findByIdAndUpdate(
      chronoPhaseId,
      {
        heureDebutReelle: new Date(),
        statut: 'EN_COURS',
        responsable: userId
      },
      { new: true }
    ).populate('phase');

    console.log('[CRV][SERVICE][PHASE_STATUS_TRANSITION]', {
      crvId: chronoPhase.crv,
      userId,
      role: null,
      input: { chronoPhaseId, phaseLibelle: chronoPhase.phase?.libelle },
      decision: 'TRANSITION',
      reason: 'Phase démarrée',
      output: {
        statutPrecedent: 'NON_COMMENCE',
        nouveauStatut: 'EN_COURS',
        heureDebutReelle: chronoPhase.heureDebutReelle
      },
      timestamp: new Date().toISOString()
    });

    return chronoPhase;
  } catch (error) {
    console.log('[CRV][SERVICE][DEMARRER_PHASE_ERROR]', {
      crvId: null,
      userId,
      role: null,
      input: { chronoPhaseId },
      decision: 'ERROR',
      reason: error.message,
      output: null,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const terminerPhase = async (chronoPhaseId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][TERMINER_PHASE_START]', {
    crvId: null,
    userId: null,
    role: null,
    input: { chronoPhaseId },
    decision: null,
    reason: 'Début terminaison phase',
    output: null,
    timestamp
  });

  try {
    const chronoPhase = await ChronologiePhase.findById(chronoPhaseId)
      .populate('phase');

    if (!chronoPhase) {
      console.log('[CRV][SERVICE][TERMINER_PHASE_ERROR]', {
        crvId: null,
        userId: null,
        role: null,
        input: { chronoPhaseId },
        decision: 'REJECT',
        reason: 'Phase non trouvée',
        output: null,
        timestamp: new Date().toISOString()
      });
      throw new Error('Phase non trouvée');
    }

    if (chronoPhase.statut !== 'EN_COURS') {
      console.log('[CRV][SERVICE][TERMINER_PHASE_REJECT]', {
        crvId: chronoPhase.crv,
        userId: null,
        role: null,
        input: { chronoPhaseId },
        decision: 'REJECT',
        reason: `Phase pas en cours (statut: ${chronoPhase.statut})`,
        output: { statutActuel: chronoPhase.statut },
        timestamp: new Date().toISOString()
      });
      throw new Error('La phase n\'est pas en cours');
    }

    const statutPrecedent = chronoPhase.statut;
    chronoPhase.heureFinReelle = new Date();
    chronoPhase.statut = 'TERMINE';

    await chronoPhase.save();

    // Calcul durée
    let dureeMinutes = null;
    if (chronoPhase.heureDebutReelle) {
      const dureeMs = chronoPhase.heureFinReelle - chronoPhase.heureDebutReelle;
      dureeMinutes = Math.round(dureeMs / 60000);
    }

    console.log('[CRV][SERVICE][PHASE_STATUS_TRANSITION]', {
      crvId: chronoPhase.crv,
      userId: null,
      role: null,
      input: { chronoPhaseId, phaseLibelle: chronoPhase.phase?.libelle },
      decision: 'TRANSITION',
      reason: 'Phase terminée',
      output: {
        statutPrecedent,
        nouveauStatut: 'TERMINE',
        heureFinReelle: chronoPhase.heureFinReelle,
        dureeMinutes
      },
      timestamp: new Date().toISOString()
    });

    return chronoPhase;
  } catch (error) {
    console.log('[CRV][SERVICE][TERMINER_PHASE_ERROR]', {
      crvId: null,
      userId: null,
      role: null,
      input: { chronoPhaseId },
      decision: 'ERROR',
      reason: error.message,
      output: null,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};
