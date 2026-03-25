import mongoose from 'mongoose';
import Phase from '../../models/phases/Phase.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import Horaire from '../../models/phases/Horaire.js';
import SLAConfig from '../../models/sla/SLAConfig.js';
import { creerHorodatageTempsReel } from '../../utils/horodatage.js';

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
 * @param {string} horaireId - ID de l'horaire associé (pour calcul temps prévus, optionnel)
 */
export const initialiserPhasesVol = async (crvId, typeOperation = null, horaireId = null) => {
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

    // ========== EXTENSION 9 - Calcul temps prévus par cascade ==========
    // NON-REGRESSION: horaireId = null par défaut, try/catch non-bloquant
    // Si horaire disponible, on calcule heureDebutPrevue/heureFinPrevue pour chaque phase
    // Cascade : fin phase N = début phase N+1 (pour phases DUREE)
    // EXTENSION PALIER 2 : phases DEADLINE = calcul depuis ETD/ETA + config SLA
    let tempsReference = null;
    let horaire = null;
    let slaConfig = null;
    if (horaireId) {
      try {
        horaire = await Horaire.findById(horaireId);
        if (horaire) {
          if (typeOperation === 'ARRIVEE' || typeOperation === 'TURN_AROUND') {
            tempsReference = horaire.heureAtterrisagePrevue;
          } else if (typeOperation === 'DEPART') {
            tempsReference = horaire.heureDecollagePrevue;
          }
        }
      } catch (err) {
        console.warn('[CRV][SERVICE][INIT_PHASES_TEMPS_PREVUS_WARN]', {
          crvId, reason: 'Calcul temps prévus échoué (non-bloquant)',
          error: err.message, timestamp: new Date().toISOString()
        });
      }
    }
    // FIN EXTENSION 9

    for (const phase of phasesRef) {
      const createData = {
        crv: crvId,
        phase: phase._id,
        statut: 'NON_COMMENCE'
      };

      // EXTENSION PALIER 2 : Phases DEADLINE (boarding, check-in)
      // heureDebutPrevue/heureFinPrevue calculées depuis ETD + config SLA compagnie
      if (phase.slaMode === 'DEADLINE' && horaire) {
        try {
          const etd = horaire.heureDecollagePrevue;
          const eta = horaire.heureAtterrisagePrevue;
          const ref = phase.referenceTemporelle === 'ETA' ? eta : etd;

          if (ref) {
            // Charger la config SLA compagnie si pas encore fait (lazy, une seule fois)
            if (!slaConfig && horaire.vol) {
              try {
                const vol = await mongoose.model('Vol').findById(horaire.vol).select('codeIATA').lean();
                if (vol?.codeIATA) {
                  slaConfig = await SLAConfig.findOne({ codeIATA: vol.codeIATA, actif: true }).lean();
                }
              } catch (_) { /* non-bloquant */ }
              if (!slaConfig) slaConfig = {}; // éviter de recharger
            }

            // Résoudre les minutes depuis la config SLA (ex: 'checkin.ouverture' → 120 min)
            const resolveMinutes = (key, fallback) => {
              if (!key) return fallback;
              const parts = key.split('.');
              let val = slaConfig;
              for (const p of parts) { val = val?.[p]; }
              return val ?? fallback;
            };

            // Defaults SLA (identiques à useSLA.js côté front)
            const DEFAULTS = {
              'checkin.ouverture': 120, 'checkin.fermeture': 45,
              'boarding.debut': 40, 'boarding.fermetureGate': 15
            };

            const minutesDebut = resolveMinutes(phase.slaConfigKeyDebut, DEFAULTS[phase.slaConfigKeyDebut] || 0);
            const minutesFin = resolveMinutes(phase.slaConfigKeyFin, DEFAULTS[phase.slaConfigKeyFin] || 0);

            // DEADLINE = minutes AVANT la référence (ETD/ETA)
            createData.heureDebutPrevue = new Date(ref.getTime() - minutesDebut * 60000);
            createData.heureFinPrevue = new Date(ref.getTime() - minutesFin * 60000);
          }
        } catch (err) {
          console.warn('[CRV][SERVICE][INIT_PHASES_DEADLINE_WARN]', {
            crvId, phaseCode: phase.code,
            reason: 'Calcul deadline échoué (non-bloquant)',
            error: err.message
          });
        }
      } else if (tempsReference) {
        // Phases DUREE classiques : cascade séquentielle
        createData.heureDebutPrevue = tempsReference;
        const fin = new Date(tempsReference.getTime() + (phase.dureeStandardMinutes || 0) * 60000);
        createData.heureFinPrevue = fin;
        tempsReference = fin; // Cascade : fin phase N = début phase N+1
      }

      const chrono = await ChronologiePhase.create(createData);
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

    const now = new Date();
    const horodatageDebut = creerHorodatageTempsReel(userId);

    const chronoPhase = await ChronologiePhase.findByIdAndUpdate(
      chronoPhaseId,
      {
        heureDebutReelle: now,
        statut: 'EN_COURS',
        responsable: userId,
        horodatageDebut
      },
      { new: true }
    ).populate('phase');

    // Synchronisation Horaire pour phases DEADLINE (boarding/check-in)
    await syncPhaseDeadlineToHoraire(chronoPhase, 'debut');

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
    const now = new Date();
    chronoPhase.heureFinReelle = now;
    chronoPhase.statut = 'TERMINE';

    // Double horodatage — fin de phase en temps réel
    const horodatageFin = creerHorodatageTempsReel(chronoPhase.responsable);
    chronoPhase.horodatageFin = horodatageFin;

    await chronoPhase.save();

    // Synchronisation Horaire pour phases DEADLINE (boarding/check-in)
    await syncPhaseDeadlineToHoraire(chronoPhase, 'fin');

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

/**
 * Synchronise les heures réelles d'une phase DEADLINE avec l'Horaire du CRV.
 * Ex: quand DEP_BOARDING démarre → Horaire.debutBoardingAt = heureDebutReelle
 *     quand DEP_BOARDING termine → Horaire.fermetureGateAt = heureFinReelle
 *
 * Mapping phase code → champ Horaire :
 *   DEP_CHECKIN / TA_CHECKIN : debut → ouvertureComptoirAt, fin → fermetureComptoirAt
 *   DEP_BOARDING / TA_BOARDING : debut → debutBoardingAt, fin → fermetureGateAt
 *
 * Non-bloquant : échec silencieux (log warning, pas d'exception)
 */
const PHASE_HORAIRE_MAP = {
  DEP_CHECKIN:  { debut: 'ouvertureComptoirAt', fin: 'fermetureComptoirAt' },
  TA_CHECKIN:   { debut: 'ouvertureComptoirAt', fin: 'fermetureComptoirAt' },
  DEP_BOARDING: { debut: 'debutBoardingAt',     fin: 'fermetureGateAt' },
  TA_BOARDING:  { debut: 'debutBoardingAt',     fin: 'fermetureGateAt' }
};

async function syncPhaseDeadlineToHoraire(chronoPhase, moment) {
  try {
    if (!chronoPhase?.phase?.slaMode || chronoPhase.phase.slaMode !== 'DEADLINE') return;

    const phaseCode = chronoPhase.phase.code;
    const mapping = PHASE_HORAIRE_MAP[phaseCode];
    if (!mapping) return;

    const fieldName = mapping[moment];
    if (!fieldName) return;

    const value = moment === 'debut' ? chronoPhase.heureDebutReelle : chronoPhase.heureFinReelle;
    if (!value) return;

    // Trouver l'horaire du CRV
    const CRV = mongoose.model('CRV');
    const crv = await CRV.findById(chronoPhase.crv).select('horaire').lean();
    if (!crv?.horaire) return;

    await Horaire.findByIdAndUpdate(crv.horaire, { [fieldName]: value });

    console.log('[CRV][SERVICE][SYNC_PHASE_HORAIRE]', {
      crvId: chronoPhase.crv, phaseCode, moment, fieldName,
      value: value.toISOString()
    });
  } catch (err) {
    console.warn('[CRV][SERVICE][SYNC_PHASE_HORAIRE_WARN]', {
      crvId: chronoPhase?.crv, phaseCode: chronoPhase?.phase?.code,
      error: err.message
    });
  }
}
