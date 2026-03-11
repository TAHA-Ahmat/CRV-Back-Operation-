import mongoose from 'mongoose';
import CRV from '../../models/crv/CRV.js';
import ValidationCRV from '../../models/validation/ValidationCRV.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import { calculerCompletude, verifierConformiteSLA } from '../crv/crv.service.js';
import { archiverCRV, isCRVImmutable } from '../documents/crv/crvArchivage.service.js';
import { eventBus } from '../notifications/notificationEngine.js';
import { EVENTS } from '../notifications/eventRegistry.js';

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
// FIX BUG #15: verrouillageAutomatique = false par defaut
// La doctrine machine a etats impose TERMINE → VALIDE → VERROUILLE en etapes separees
// L'archivage ne se fait plus automatiquement lors de la validation
export const validerCRV = async (crvId, userId, commentaires, verrouillageAutomatique = false) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][SERVICE][VALIDER_CRV_START]', {
    crvId, userId, input: { crvId, commentaires, verrouillageAutomatique },
    reason: 'Début validation CRV', timestamp
  });

  // ============================================================
  // MISSION 022 — TRANSACTION MONGODB
  // Toutes les opérations DB de validation sont atomiques.
  // Si une étape échoue → rollback complet.
  // L'archivage Drive reste non-bloquant (mode dégradé si échec).
  // ============================================================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const crv = await CRV.findById(crvId).populate('vol').session(session);

    if (!crv) {
      // FIX BUG-4 CERTIFICATION: status 404 au lieu de 500
      const err = new Error('CRV non trouvé');
      err.status = 404;
      throw err;
    }

    if (crv.statut === 'VERROUILLE') {
      // FIX BUG-4 CERTIFICATION: status 409 au lieu de 500
      const err = new Error('Le CRV est déjà verrouillé');
      err.status = 409;
      throw err;
    }

    if (crv.statut !== 'TERMINE' && crv.statut !== 'VALIDE') {
      // FIX BUG-4 CERTIFICATION: status 409 au lieu de 500
      const err = new Error(`Le CRV doit être en statut TERMINE pour être validé (statut actuel: ${crv.statut})`);
      err.status = 409;
      throw err;
    }

    const completude = await calculerCompletude(crvId);
    const anomalies = [];

    if (completude < 80) {
      anomalies.push(`Complétude insuffisante: ${completude}% (minimum 80% requis)`);
    }

    if (!crv.responsableVol) {
      anomalies.push('Responsable du vol non défini');
    }

    const phases = await ChronologiePhase.find({ crv: crvId }).session(session);
    const phasesNonTraitees = phases.filter(p => p.statut === 'NON_COMMENCE');

    if (phasesNonTraitees.length > 0) {
      anomalies.push(`${phasesNonTraitees.length} phase(s) non traitée(s)`);
    }

    const slaCheck = await verifierConformiteSLA(crvId, crv.vol?.compagnieAerienne);

    let statutValidation = 'VALIDE';
    let statutCRV = 'VALIDE';

    if (anomalies.length > 0) {
      statutValidation = 'EN_ATTENTE_CORRECTION';
      statutCRV = crv.statut;

      console.log('[CRV][SERVICE][VALIDER_CRV_ANOMALIES]', {
        crvId, anomalies, statutValidation, timestamp: new Date().toISOString()
      });
    }

    // Supprimer l'ancienne validation (dans la transaction)
    await ValidationCRV.deleteMany({ crv: crvId }, { session });

    // Créer la nouvelle validation (dans la transaction)
    const [validation] = await ValidationCRV.create([{
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
    }], { session });

    // Mettre à jour le statut du CRV (dans la transaction)
    let nouveauStatut = crv.statut;
    if (statutValidation === 'VALIDE') {
      if (verrouillageAutomatique) {
        nouveauStatut = 'VERROUILLE';
        await CRV.findByIdAndUpdate(crvId, {
          statut: 'VERROUILLE',
          verrouillePar: userId,
          dateVerrouillage: new Date()
        }, { session });

        await ValidationCRV.findByIdAndUpdate(validation._id, {
          verrouille: true,
          dateVerrouillage: new Date()
        }, { session });

        console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
          crvId, from: crv.statut, to: 'VERROUILLE',
          reason: 'Verrouillage automatique après validation',
          timestamp: new Date().toISOString()
        });
      } else {
        nouveauStatut = 'VALIDE';
        await CRV.findByIdAndUpdate(crvId, {
          statut: 'VALIDE'
        }, { session });

        console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
          crvId, from: crv.statut, to: 'VALIDE',
          reason: 'Validation OK - verrouillage manuel requis',
          timestamp: new Date().toISOString()
        });
      }
    }

    // COMMIT — toutes les opérations DB sont validées atomiquement
    await session.commitTransaction();

    // ============================================================
    // ARCHIVAGE DRIVE — APRÈS le commit (non-bloquant)
    // Si Drive échoue, la validation est déjà sauvegardée.
    // Révision Mission 006 : Drive ne doit pas bloquer l'exploitation.
    // ============================================================
    if (statutValidation === 'VALIDE') {
      try {
        await archiverCRV(crvId, userId);
        console.log('[CRV][SERVICE][ARCHIVAGE_OK]', { crvId, timestamp: new Date().toISOString() });
      } catch (archiveError) {
        console.error('[CRV][SERVICE][ARCHIVAGE_ECHEC_NON_BLOQUANT]', {
          crvId, error: archiveError.message, timestamp: new Date().toISOString()
        });
        await CRV.findByIdAndUpdate(crvId, {
          'archivage.statut': 'EN_ATTENTE',
          'archivage.erreur': archiveError.message,
          'archivage.derniereErreurAt': new Date()
        });
      }
    }

    console.log('[CRV][SERVICE][VALIDER_CRV_SUCCESS]', {
      crvId, statutValidation, nouveauStatut, completude,
      timestamp: new Date().toISOString()
    });

    // ── NOTIFICATION ENGINE ──────────────────────────────────────
    if (statutValidation === 'VALIDE') {
      eventBus.emitAsync(EVENTS.CRV_VALIDE, {
        crvId, userId, numeroCRV: crv.numeroCRV,
        nouveauStatut, completude, verrouillageAutomatique
      });
    } else if (statutValidation === 'EN_ATTENTE_CORRECTION') {
      eventBus.emitAsync(EVENTS.CRV_REJETE, {
        crvId, userId, numeroCRV: crv.numeroCRV,
        completude, commentaires
      });
    }
    // ─────────────────────────────────────────────────────────────

    return validation;
  } catch (error) {
    // ROLLBACK — aucune modification DB n'est persistée
    await session.abortTransaction();
    console.log('[CRV][SERVICE][VALIDER_CRV_ERROR]', {
      crvId, error: error.message, timestamp: new Date().toISOString()
    });
    throw error;
  } finally {
    session.endSession();
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
      // FIX BUG-4 CERTIFICATION: status 404 au lieu de 500
      const err404 = new Error('CRV non trouvé');
      err404.status = 404;
      throw err404;
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
      // FIX BUG-4 CERTIFICATION: status 409 au lieu de 500
      const err409 = new Error(`Le CRV doit être en statut VALIDE pour être verrouillé (statut actuel: ${crv.statut})`);
      err409.status = 409;
      throw err409;
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

    // ── NOTIFICATION ENGINE ──────────────────────────────────────
    eventBus.emitAsync(EVENTS.CRV_VERROUILLE, {
      crvId, userId, numeroCRV: crv.numeroCRV
    });
    // ─────────────────────────────────────────────────────────────

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
      // FIX BUG-4 CERTIFICATION: status 404 au lieu de 500
      const err404d = new Error('CRV non trouvé');
      err404d.status = 404;
      throw err404d;
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
      // FIX BUG-4 CERTIFICATION: status 409 au lieu de 500
      const err409d = new Error('Le CRV n\'est pas verrouillé');
      err409d.status = 409;
      throw err409d;
    }

    // ============================================================
    // IMMUTABILITÉ — Un CRV archivé ne peut plus être déverrouillé.
    // Mission 003 : protection contre la rupture de la chaîne
    // Validation → Archivage → Immutabilité.
    // ============================================================
    if (isCRVImmutable(crv)) {
      console.log('[CRV][SERVICE][DEVERROUILLER_CRV_IMMUTABLE]', {
        crvId,
        userId,
        role: null,
        input: { crvId, raison },
        decision: 'REJECT',
        reason: 'CRV archivé et immuable — déverrouillage interdit',
        output: {
          archivedAt: crv.archivage?.archivedAt,
          driveFileId: crv.archivage?.driveFileId
        },
        timestamp: new Date().toISOString()
      });
      const err = new Error('Ce CRV est archivé et immuable. Le déverrouillage est interdit.');
      err.status = 403;
      throw err;
    }

    // MISSION 022 — Correction : déverrouillage ramène à VALIDE (pas EN_COURS)
    // Doctrine machine à états : VERROUILLE → VALIDE (si non archivé)
    await CRV.findByIdAndUpdate(crvId, {
      statut: 'VALIDE',
      verrouillePar: null,
      dateVerrouillage: null
    });

    await ValidationCRV.findOneAndUpdate(
      { crv: crvId },
      {
        statut: 'VALIDE',
        verrouille: false,
        commentaires: `Déverrouillé par ${userId} - Raison: ${raison}`
      }
    );

    console.log('[CRV][SERVICE][STATUS_TRANSITION]', {
      crvId, userId, from: 'VERROUILLE', to: 'VALIDE',
      reason: 'Déverrouillage manuel — retour à VALIDE',
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

    // ── NOTIFICATION ENGINE ──────────────────────────────────────
    eventBus.emitAsync(EVENTS.CRV_DEVERROUILLE, {
      crvId, userId, numeroCRV: crv.numeroCRV, raison
    });
    // ─────────────────────────────────────────────────────────────

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
