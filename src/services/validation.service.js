import CRV from '../models/CRV.js';
import ValidationCRV from '../models/ValidationCRV.js';
import ChronologiePhase from '../models/ChronologiePhase.js';
import { calculerCompletude, verifierConformiteSLA } from './crv.service.js';

export const validerCRV = async (crvId, userId, commentaires) => {
  try {
    const crv = await CRV.findById(crvId).populate('vol');

    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    if (crv.statut === 'VERROUILLE') {
      throw new Error('Le CRV est déjà verrouillé');
    }

    const completude = await calculerCompletude(crvId);

    const anomalies = [];

    if (completude < 80) {
      anomalies.push('Complétude insuffisante (minimum 80% requis)');
    }

    if (!crv.responsableVol) {
      anomalies.push('Responsable du vol non défini');
    }

    const phases = await ChronologiePhase.find({ crv: crvId });
    const phasesNonTraitees = phases.filter(p => p.statut === 'NON_COMMENCE');

    if (phasesNonTraitees.length > 0) {
      anomalies.push(`${phasesNonTraitees.length} phase(s) non traitée(s)`);
    }

    const slaCheck = await verifierConformiteSLA(crvId, crv.vol.compagnieAerienne);

    let statut = 'VALIDE';
    if (anomalies.length > 0) {
      statut = 'EN_ATTENTE_CORRECTION';
    }

    const validation = await ValidationCRV.create({
      crv: crvId,
      validePar: userId,
      statut,
      commentaires,
      scoreCompletude: completude,
      conformiteSLA: slaCheck.conformite,
      ecartsSLA: slaCheck.ecarts,
      anomaliesDetectees: anomalies,
      verrouille: statut === 'VALIDE',
      dateVerrouillage: statut === 'VALIDE' ? new Date() : null
    });

    if (statut === 'VALIDE') {
      await CRV.findByIdAndUpdate(crvId, {
        statut: 'VERROUILLE',
        verrouillePar: userId,
        dateVerrouillage: new Date()
      });
    }

    return validation;
  } catch (error) {
    console.error('Erreur lors de la validation du CRV:', error);
    throw error;
  }
};

export const deverrouillerCRV = async (crvId, userId, raison) => {
  try {
    const crv = await CRV.findById(crvId);

    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    if (crv.statut !== 'VERROUILLE') {
      throw new Error('Le CRV n\'est pas verrouillé');
    }

    await CRV.findByIdAndUpdate(crvId, {
      statut: 'EN_COURS',
      verrouillePar: null,
      dateVerrouillage: null
    });

    await ValidationCRV.findOneAndUpdate(
      { crv: crvId },
      {
        statut: 'INVALIDE',
        verrouille: false,
        commentaires: `Déverrouillé par ${userId} - Raison: ${raison}`
      }
    );

    return true;
  } catch (error) {
    console.error('Erreur lors du déverrouillage du CRV:', error);
    throw error;
  }
};
