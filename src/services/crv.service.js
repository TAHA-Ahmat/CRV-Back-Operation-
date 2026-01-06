import CRV from '../models/CRV.js';
import ChronologiePhase from '../models/ChronologiePhase.js';
import ChargeOperationnelle from '../models/ChargeOperationnelle.js';
import EvenementOperationnel from '../models/EvenementOperationnel.js';
import Observation from '../models/Observation.js';

export const calculerCompletude = async (crvId) => {
  try {
    const crv = await CRV.findById(crvId).populate('vol horaire');
    if (!crv) return 0;

    let score = 0;
    const maxScore = 100;

    // ========================================
    // PHASES : 40% (pro-rata des phases terminées)
    // ========================================
    const phases = await ChronologiePhase.find({ crv: crvId });
    const phasesTerminees = phases.filter(p => p.statut === 'TERMINE' || p.statut === 'NON_REALISE');
    if (phases.length > 0) {
      score += (phasesTerminees.length / phases.length) * 40;
    }

    // ========================================
    // CHARGES : 30% (présence de charges opérationnelles)
    // ========================================
    const charges = await ChargeOperationnelle.find({ crv: crvId });
    if (charges.length > 0) {
      // Bonus si plusieurs types de charges (PASSAGERS, BAGAGES, FRET)
      const typesCharges = [...new Set(charges.map(c => c.typeCharge))];
      if (typesCharges.length >= 3) {
        score += 30; // Tous les types
      } else if (typesCharges.length === 2) {
        score += 25; // 2 types
      } else {
        score += 20; // 1 type minimum
      }
    }

    // ========================================
    // HORAIRES : 10% (données de timing renseignées)
    // ========================================
    if (crv.horaire) {
      const h = crv.horaire;
      // Vérifier si au moins 2 horaires réels sont renseignés
      const horairesReels = [
        h.heureAtterrissageReelle,
        h.heureArriveeAuParcReelle,
        h.heureDepartDuParcReelle,
        h.heureDecollageReelle,
        h.heureOuvertureParkingReelle,
        h.heureFermetureParkingReelle
      ].filter(Boolean);

      if (horairesReels.length >= 2) {
        score += 10; // Horaires complets
      } else if (horairesReels.length >= 1) {
        score += 5; // Horaires partiels
      }
    }

    // ========================================
    // ÉVÉNEMENTS : 10% (présence d'événements opérationnels)
    // ========================================
    const evenements = await EvenementOperationnel.find({ crv: crvId });
    if (evenements.length > 0) {
      score += 10;
    }

    // ========================================
    // OBSERVATIONS : 10% (présence d'observations)
    // ========================================
    const observations = await Observation.find({ crv: crvId });
    if (observations.length > 0) {
      score += 10;
    }

    const completude = Math.round(score);

    await CRV.findByIdAndUpdate(crvId, { completude });

    return completude;
  } catch (error) {
    console.error('Erreur lors du calcul de complétude:', error);
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
