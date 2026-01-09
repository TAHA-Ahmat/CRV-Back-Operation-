import CRV from '../../models/crv/CRV.js';
import ValidationCRV from '../../models/validation/ValidationCRV.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import { calculerCompletude, verifierConformiteSLA } from '../crv/crv.service.js';

/**
 * FLUX DE VALIDATION CRV
 *
 * Statut CRV requis : TERMINE
 *
 * Transitions possibles :
 * - Si anomalies : reste TERMINE + validation EN_ATTENTE_CORRECTION
 * - Si OK : passe à VALIDE + validation VALIDE
 *
 * Ensuite le verrouillage peut être fait via verrouillerCRV()
 *
 * Conditions de validation :
 * - Complétude >= 80%
 * - Responsable vol défini
 * - Toutes phases traitées (TERMINE ou NON_REALISE)
 */
export const validerCRV = async (crvId, userId, commentaires, verrouillageAutomatique = true) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][VALIDER_CRV_START]', {
    crvId,
    userId,
    role: null,
    input: { crvId, commentaires, verrouillageAutomatique },
    decision: null,
    reason: 'Début validation CRV',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(crvId).populate('vol');

    if (!crv) {
      console.log('[CRV][SERVICE][VALIDER_CRV_ERROR]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      throw new Error('CRV non trouvé');
    }

    // Vérifier que le CRV est dans un état permettant la validation
    if (crv.statut === 'VERROUILLE') {
      console.log('[CRV][SERVICE][VALIDER_CRV_REJECT]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV déjà verrouillé',
        output: { statutActuel: crv.statut },
        timestamp: new Date().toISOString()
      });
      throw new Error('Le CRV est déjà verrouillé');
    }

    if (crv.statut !== 'TERMINE' && crv.statut !== 'VALIDE') {
      console.log('[CRV][SERVICE][VALIDER_CRV_REJECT]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: `Statut ${crv.statut} non autorisé (TERMINE ou VALIDE requis)`,
        output: { statutActuel: crv.statut },
        timestamp: new Date().toISOString()
      });
      throw new Error(`Le CRV doit être en statut TERMINE pour être validé (statut actuel: ${crv.statut})`);
    }

    const completude = await calculerCompletude(crvId);
    const anomalies = [];

    // Vérification complétude minimale
    if (completude < 80) {
      anomalies.push(`Complétude insuffisante: ${completude}% (minimum 80% requis)`);
    }

    // Vérification responsable vol
    if (!crv.responsableVol) {
      anomalies.push('Responsable du vol non défini');
    }

    // Vérification phases traitées
    const phases = await ChronologiePhase.find({ crv: crvId });
    const phasesNonTraitees = phases.filter(p => p.statut === 'NON_COMMENCE');

    if (phasesNonTraitees.length > 0) {
      anomalies.push(`${phasesNonTraitees.length} phase(s) non traitée(s)`);
    }

    // Vérification SLA
    const slaCheck = await verifierConformiteSLA(crvId, crv.vol?.compagnieAerienne);

    let statutValidation = 'VALIDE';
    let statutCRV = 'VALIDE';

    if (anomalies.length > 0) {
      statutValidation = 'EN_ATTENTE_CORRECTION';
      statutCRV = crv.statut; // Ne pas changer le statut si anomalies

      console.log('[CRV][SERVICE][VALIDER_CRV_ANOMALIES]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'ANOMALIES_DETECTEES',
        reason: `${anomalies.length} anomalie(s) détectée(s)`,
        output: { anomalies, statutValidation },
        timestamp: new Date().toISOString()
      });
    }

    // Supprimer l'ancienne validation s'il y en a une
    const oldValidation = await ValidationCRV.findOne({ crv: crvId });
    if (oldValidation) {
      await ValidationCRV.deleteOne({ crv: crvId });
    }

    // Créer la nouvelle validation
    const validation = await ValidationCRV.create({
      crv: crvId,
      validePar: userId,
      statut: statutValidation,
      commentaires,
      scoreCompletude: completude,
      conformiteSLA: slaCheck.conformite,
      ecartsSLA: slaCheck.ecarts,
      anomaliesDetectees: anomalies,
      verrouille: false,
      dateVerrouillage: null
    });

    // Mettre à jour le statut du CRV
    let nouveauStatut = crv.statut;
    if (statutValidation === 'VALIDE') {
      // Si verrouillage automatique est activé, passer directement à VERROUILLE
      if (verrouillageAutomatique) {
        nouveauStatut = 'VERROUILLE';
        await CRV.findByIdAndUpdate(crvId, {
          statut: 'VERROUILLE',
          verrouillePar: userId,
          dateVerrouillage: new Date()
        });

        await ValidationCRV.findByIdAndUpdate(validation._id, {
          verrouille: true,
          dateVerrouillage: new Date()
        });

        console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
          crvId,
          userId,
          role: null,
          input: { statutPrecedent: crv.statut },
          decision: 'TRANSITION',
          reason: 'Verrouillage automatique après validation',
          output: { nouveauStatut: 'VERROUILLE' },
          timestamp: new Date().toISOString()
        });
      } else {
        // Sinon passer à VALIDE (verrouillage manuel requis)
        nouveauStatut = 'VALIDE';
        await CRV.findByIdAndUpdate(crvId, {
          statut: 'VALIDE'
        });

        console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
          crvId,
          userId,
          role: null,
          input: { statutPrecedent: crv.statut },
          decision: 'TRANSITION',
          reason: 'Validation OK - verrouillage manuel requis',
          output: { nouveauStatut: 'VALIDE' },
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('[CRV][SERVICE][VALIDER_CRV_SUCCESS]', {
      crvId,
      userId,
      role: null,
      input: { crvId, commentaires, verrouillageAutomatique },
      decision: statutValidation === 'VALIDE' ? 'VALIDE' : 'EN_ATTENTE_CORRECTION',
      reason: anomalies.length > 0 ? `${anomalies.length} anomalie(s)` : 'Validation réussie',
      output: {
        validationId: validation._id,
        statutValidation,
        nouveauStatut,
        completude,
        conformiteSLA: slaCheck.conformite
      },
      timestamp: new Date().toISOString()
    });

    return validation;
  } catch (error) {
    console.log('[CRV][SERVICE][VALIDER_CRV_ERROR]', {
      crvId,
      userId,
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

/**
 * Verrouiller un CRV validé (VALIDE → VERROUILLE)
 * À utiliser si verrouillageAutomatique = false dans validerCRV
 */
export const verrouillerCRV = async (crvId, userId) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][VERROUILLER_CRV_START]', {
    crvId,
    userId,
    role: null,
    input: { crvId },
    decision: null,
    reason: 'Début verrouillage CRV',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(crvId);

    if (!crv) {
      console.log('[CRV][SERVICE][VERROUILLER_CRV_ERROR]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      throw new Error('CRV non trouvé');
    }

    if (crv.statut !== 'VALIDE') {
      console.log('[CRV][SERVICE][VERROUILLER_CRV_REJECT]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: `Statut ${crv.statut} non autorisé (VALIDE requis)`,
        output: { statutActuel: crv.statut },
        timestamp: new Date().toISOString()
      });
      throw new Error(`Le CRV doit être en statut VALIDE pour être verrouillé (statut actuel: ${crv.statut})`);
    }

    await CRV.findByIdAndUpdate(crvId, {
      statut: 'VERROUILLE',
      verrouillePar: userId,
      dateVerrouillage: new Date()
    });

    await ValidationCRV.findOneAndUpdate(
      { crv: crvId },
      {
        verrouille: true,
        dateVerrouillage: new Date()
      }
    );

    console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
      crvId,
      userId,
      role: null,
      input: { statutPrecedent: 'VALIDE' },
      decision: 'TRANSITION',
      reason: 'Verrouillage manuel',
      output: { nouveauStatut: 'VERROUILLE' },
      timestamp: new Date().toISOString()
    });

    console.log('[CRV][SERVICE][VERROUILLER_CRV_SUCCESS]', {
      crvId,
      userId,
      role: null,
      input: { crvId },
      decision: 'VERROUILLE',
      reason: 'CRV verrouillé avec succès',
      output: { success: true },
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.log('[CRV][SERVICE][VERROUILLER_CRV_ERROR]', {
      crvId,
      userId,
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

export const deverrouillerCRV = async (crvId, userId, raison) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][DEVERROUILLER_CRV_START]', {
    crvId,
    userId,
    role: null,
    input: { crvId, raison },
    decision: null,
    reason: 'Début déverrouillage CRV',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(crvId);

    if (!crv) {
      console.log('[CRV][SERVICE][DEVERROUILLER_CRV_ERROR]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      throw new Error('CRV non trouvé');
    }

    if (crv.statut !== 'VERROUILLE') {
      console.log('[CRV][SERVICE][DEVERROUILLER_CRV_REJECT]', {
        crvId,
        userId,
        role: null,
        input: { crvId },
        decision: 'REJECT',
        reason: `CRV non verrouillé (statut: ${crv.statut})`,
        output: { statutActuel: crv.statut },
        timestamp: new Date().toISOString()
      });
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

    console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
      crvId,
      userId,
      role: null,
      input: { statutPrecedent: 'VERROUILLE', raison },
      decision: 'TRANSITION',
      reason: 'Déverrouillage manuel',
      output: { nouveauStatut: 'EN_COURS' },
      timestamp: new Date().toISOString()
    });

    console.log('[CRV][SERVICE][DEVERROUILLER_CRV_SUCCESS]', {
      crvId,
      userId,
      role: null,
      input: { crvId, raison },
      decision: 'DEVERROUILLE',
      reason: 'CRV déverrouillé avec succès',
      output: { success: true },
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.log('[CRV][SERVICE][DEVERROUILLER_CRV_ERROR]', {
      crvId,
      userId,
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
