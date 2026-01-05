import Phase from '../models/Phase.js';
import ChronologiePhase from '../models/ChronologiePhase.js';

export const initialiserPhasesVol = async (crvId, typeOperation) => {
  try {
    const phasesRef = await Phase.find({
      $or: [
        { typeOperation },
        { typeOperation: 'COMMUN' }
      ],
      actif: true
    }).sort({ ordre: 1 });

    const chronologies = [];

    for (const phase of phasesRef) {
      const chrono = await ChronologiePhase.create({
        crv: crvId,
        phase: phase._id,
        statut: 'NON_COMMENCE'
      });
      chronologies.push(chrono);
    }

    return chronologies;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des phases:', error);
    throw error;
  }
};

export const verifierPrerequisPhase = async (chronoPhaseId) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(chronoPhaseId)
      .populate('phase');

    if (!chronoPhase || !chronoPhase.phase.prerequis || chronoPhase.phase.prerequis.length === 0) {
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

    return {
      valide: prerequisManquants.length === 0,
      prerequisManquants
    };
  } catch (error) {
    console.error('Erreur lors de la vérification des prérequis:', error);
    return { valide: false, prerequisManquants: [] };
  }
};

export const demarrerPhase = async (chronoPhaseId, userId) => {
  try {
    const verif = await verifierPrerequisPhase(chronoPhaseId);

    if (!verif.valide) {
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

    return chronoPhase;
  } catch (error) {
    console.error('Erreur lors du démarrage de la phase:', error);
    throw error;
  }
};

export const terminerPhase = async (chronoPhaseId) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(chronoPhaseId);

    if (!chronoPhase) {
      throw new Error('Phase non trouvée');
    }

    if (chronoPhase.statut !== 'EN_COURS') {
      throw new Error('La phase n\'est pas en cours');
    }

    chronoPhase.heureFinReelle = new Date();
    chronoPhase.statut = 'TERMINE';

    await chronoPhase.save();

    return chronoPhase;
  } catch (error) {
    console.error('Erreur lors de la fin de la phase:', error);
    throw error;
  }
};
