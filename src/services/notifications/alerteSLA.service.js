import CRV from '../../models/crv/CRV.js';
import Phase from '../../models/phases/Phase.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import SLAConfig from '../../models/sla/SLAConfig.js';
import { envoyerAlerteSLA, creerNotificationMultiple } from '../notifications/notification.service.js';
import { eventBus } from './notificationEngine.js';
import { EVENTS } from './eventRegistry.js';

/**
 * EXTENSION 8 - Service Alertes SLA Proactives
 *
 * Service NOUVEAU pour surveiller et alerter sur les dépassements de SLA.
 *
 * NON-RÉGRESSION: Ce service est ENTIÈREMENT NOUVEAU et OPTIONNEL.
 * - Aucun service existant n'est modifié
 * - Peut être utilisé ou ignoré sans impact sur le système
 * - Fournit des fonctions ADDITIONNELLES uniquement
 * - S'appuie sur Extension 7 (notifications) pour envoyer les alertes
 */

/**
 * SLA par défaut (en heures)
 */
const SLA_DEFAULTS = {
  CRV: {
    BROUILLON_TO_EN_COURS: 24,      // CRV doit passer en EN_COURS dans les 24h
    EN_COURS_TO_TERMINE: 48,        // CRV doit être TERMINE dans les 48h après EN_COURS
    TERMINE_TO_VALIDE: 72,          // CRV doit être VALIDE dans les 72h après TERMINE
    GLOBAL: 168                     // CRV doit être VALIDE dans les 7 jours (168h) après création
  },
  PHASE: {
    EN_ATTENTE_TO_EN_COURS: 2,     // Phase doit démarrer dans les 2h
    EN_COURS_TO_TERMINEE: 24,      // Phase doit se terminer dans les 24h
    GLOBAL: 48                      // Phase doit être TERMINEE dans les 48h après création
  }
};

/**
 * Seuils d'alerte (pourcentage du SLA écoulé)
 */
const SEUILS_ALERTE = {
  WARNING: 0.75,    // 75% du SLA écoulé
  CRITICAL: 0.90,   // 90% du SLA écoulé
  EXCEEDED: 1.0     // 100% du SLA écoulé
};

/**
 * Résout les SLA applicables pour un CRV en fonction de sa compagnie.
 * Priorité : SLAConfig base (par codeIATA) → SLA_DEFAULTS (fallback)
 *
 * @param {string|null} codeIATA - Code IATA de la compagnie (ex: "AF")
 * @returns {Object} { BROUILLON_TO_EN_COURS, EN_COURS_TO_TERMINE, TERMINE_TO_VALIDE, GLOBAL }
 */
const resoudreSLACRV = async (codeIATA) => {
  const defaults = SLA_DEFAULTS.CRV;
  if (!codeIATA) return defaults;

  try {
    const config = await SLAConfig.findOne({ codeIATA: codeIATA.toUpperCase(), actif: true }).lean();
    if (!config) return defaults;

    return {
      BROUILLON_TO_EN_COURS: config.crv?.brouillonToEnCours ?? defaults.BROUILLON_TO_EN_COURS,
      EN_COURS_TO_TERMINE:   config.crv?.enCoursToTermine   ?? defaults.EN_COURS_TO_TERMINE,
      TERMINE_TO_VALIDE:     config.crv?.termineToValide     ?? defaults.TERMINE_TO_VALIDE,
      GLOBAL:                config.crv?.global              ?? defaults.GLOBAL
    };
  } catch (err) {
    console.warn('[SLA] Erreur résolution config compagnie, fallback defaults:', err.message);
    return defaults;
  }
};

/**
 * Résout les SLA Phase en fonction de la compagnie.
 */
const resoudreSLAPhase = async (codeIATA) => {
  const defaults = SLA_DEFAULTS.PHASE;
  if (!codeIATA) return defaults;

  try {
    const config = await SLAConfig.findOne({ codeIATA: codeIATA.toUpperCase(), actif: true }).lean();
    if (!config) return defaults;

    return {
      EN_ATTENTE_TO_EN_COURS: config.phase?.enAttenteToEnCours ?? defaults.EN_ATTENTE_TO_EN_COURS,
      EN_COURS_TO_TERMINEE:   config.phase?.enCoursToTerminee   ?? defaults.EN_COURS_TO_TERMINEE,
      GLOBAL:                 config.phase?.global              ?? defaults.GLOBAL
    };
  } catch (err) {
    console.warn('[SLA] Erreur résolution config phase compagnie, fallback defaults:', err.message);
    return defaults;
  }
};

/**
 * Vérifie le SLA d'un CRV
 * @param {Object} crv - Document CRV
 * @returns {Object} État du SLA
 */
export const verifierSLACRV = async (crvId) => {
  try {
    const crv = await CRV.findById(crvId).populate('creePar').populate('vol');
    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    const maintenant = new Date();
    const dateCreation = new Date(crv.dateCreation);
    const heuresEcoulees = (maintenant - dateCreation) / (1000 * 60 * 60);

    // Résolution dynamique par compagnie
    const codeIATA = crv.vol?.codeIATA || null;
    const slaCRV = await resoudreSLACRV(codeIATA);

    // Déterminer le SLA applicable selon le statut
    // Résolution date de transition réelle (aligné sur useSLA.js front)
    // Priorité : datesTransitions > dateCreation (JAMAIS updatedAt)
    const dt = crv.datesTransitions || {};
    let slaApplicable;
    let dateReference;
    let etapeActuelle;

    switch (crv.statut) {
      case 'BROUILLON':
        slaApplicable = slaCRV.BROUILLON_TO_EN_COURS;
        dateReference = dateCreation;
        etapeActuelle = 'BROUILLON → EN_COURS';
        break;

      case 'EN_COURS':
        slaApplicable = slaCRV.EN_COURS_TO_TERMINE;
        dateReference = dt.enCoursAt ? new Date(dt.enCoursAt) : dateCreation;
        etapeActuelle = 'EN_COURS → TERMINE';
        break;

      case 'TERMINE':
        slaApplicable = slaCRV.TERMINE_TO_VALIDE;
        dateReference = dt.termineAt ? new Date(dt.termineAt) : (dt.enCoursAt ? new Date(dt.enCoursAt) : dateCreation);
        etapeActuelle = 'TERMINE → VALIDE';
        break;

      case 'VALIDE':
      case 'VERROUILLE':
      case 'ANNULE':
        // Pas de SLA pour les CRV terminés/annulés
        return {
          crvId: crv._id,
          numeroCRV: crv.numeroCRV,
          statut: crv.statut,
          enAlerte: false,
          message: `CRV ${crv.statut} - Pas de SLA actif`
        };

      default:
        return null;
    }

    const heuresDepuisReference = (maintenant - new Date(dateReference)) / (1000 * 60 * 60);
    const pourcentageEcoule = heuresDepuisReference / slaApplicable;

    // Déterminer le niveau d'alerte
    let niveau = null;
    let priorite = 'NORMALE';

    if (pourcentageEcoule >= SEUILS_ALERTE.EXCEEDED) {
      niveau = 'EXCEEDED';
      priorite = 'URGENTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.CRITICAL) {
      niveau = 'CRITICAL';
      priorite = 'HAUTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.WARNING) {
      niveau = 'WARNING';
      priorite = 'HAUTE';
    }

    return {
      crvId: crv._id,
      numeroCRV: crv.numeroCRV,
      statut: crv.statut,
      etapeActuelle,
      enAlerte: niveau !== null,
      niveau,
      priorite,
      slaApplicable,
      slaSource: codeIATA && (slaCRV !== SLA_DEFAULTS.CRV) ? `compagnie:${codeIATA}` : 'defaut',
      compagnie: codeIATA || null,
      heuresDepuisReference,
      heuresRestantes: slaApplicable - heuresDepuisReference,
      pourcentageEcoule: Math.round(pourcentageEcoule * 100),
      dateReference,
      creePar: crv.creePar
    };

  } catch (error) {
    console.error('Erreur lors de la vérification SLA CRV:', error);
    throw error;
  }
};

/**
 * Vérifie le SLA d'une phase
 * @param {String} phaseId - ID de la phase
 * @returns {Object} État du SLA
 */
export const verifierSLAPhase = async (phaseId) => {
  try {
    const phase = await Phase.findById(phaseId).populate({
      path: 'crv',
      populate: { path: 'vol', select: 'codeIATA compagnieAerienne' }
    });
    if (!phase) {
      throw new Error('Phase non trouvée');
    }

    const maintenant = new Date();
    const dateCreation = new Date(phase.dateCreation);

    // Résolution dynamique par compagnie
    const codeIATA = phase.crv?.vol?.codeIATA || null;
    const slaPhase = await resoudreSLAPhase(codeIATA);

    let slaApplicable;
    let dateReference;
    let etapeActuelle;

    switch (phase.statut) {
      case 'EN_ATTENTE':
        slaApplicable = slaPhase.EN_ATTENTE_TO_EN_COURS;
        dateReference = dateCreation;
        etapeActuelle = 'EN_ATTENTE → EN_COURS';
        break;

      case 'EN_COURS':
        slaApplicable = slaPhase.EN_COURS_TO_TERMINEE;
        dateReference = phase.heureDebut || phase.updatedAt;
        etapeActuelle = 'EN_COURS → TERMINEE';
        break;

      case 'TERMINEE':
      case 'ANNULEE':
        return {
          phaseId: phase._id,
          typePhase: phase.typePhase,
          statut: phase.statut,
          enAlerte: false,
          message: `Phase ${phase.statut} - Pas de SLA actif`
        };

      default:
        return null;
    }

    const heuresDepuisReference = (maintenant - new Date(dateReference)) / (1000 * 60 * 60);
    const pourcentageEcoule = heuresDepuisReference / slaApplicable;

    let niveau = null;
    let priorite = 'NORMALE';

    if (pourcentageEcoule >= SEUILS_ALERTE.EXCEEDED) {
      niveau = 'EXCEEDED';
      priorite = 'URGENTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.CRITICAL) {
      niveau = 'CRITICAL';
      priorite = 'HAUTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.WARNING) {
      niveau = 'WARNING';
      priorite = 'HAUTE';
    }

    return {
      phaseId: phase._id,
      typePhase: phase.typePhase,
      statut: phase.statut,
      etapeActuelle,
      enAlerte: niveau !== null,
      niveau,
      priorite,
      slaApplicable,
      heuresDepuisReference,
      heuresRestantes: slaApplicable - heuresDepuisReference,
      pourcentageEcoule: Math.round(pourcentageEcoule * 100),
      dateReference
    };

  } catch (error) {
    console.error('Erreur lors de la vérification SLA Phase:', error);
    throw error;
  }
};

// ─── ANTI-SPAM SLA ─────────────────────────────────────────
// Mémoire d'alertes déjà envoyées. Clé = crvId:niveau:étape.
// - Même clé dans les 6h → bloqué (déjà alerté)
// - Aggravation (WARNING→CRITICAL→EXCEEDED) → nouvelle clé → alerte
// - Changement d'étape (ex: EN_COURS→TERMINE) → nouvelle clé → alerte
// - Après 6h même situation inchangée → relance permise (rappel)
const _slaAlertCache = new Map();
const SLA_ALERT_COOLDOWN = 6 * 60 * 60 * 1000; // 6 heures

function shouldSendSLAAlert(crvId, niveau, etape) {
  const key = `${crvId}:${niveau}:${etape}`;
  const now = Date.now();
  const lastSent = _slaAlertCache.get(key);
  if (lastSent && (now - lastSent) < SLA_ALERT_COOLDOWN) {
    return false; // déjà alerté pour ce CRV à ce niveau/étape dans les 6h
  }
  _slaAlertCache.set(key, now);
  // Nettoyage paresseux
  if (_slaAlertCache.size > 1000) {
    for (const [k, ts] of _slaAlertCache) {
      if (now - ts > SLA_ALERT_COOLDOWN) _slaAlertCache.delete(k);
    }
  }
  return true;
}

/**
 * Surveille tous les CRV actifs et envoie des alertes
 * Anti-spam : même CRV + même niveau + même étape → 1 alerte max par 6h
 * @returns {Object} Résultat de la surveillance
 */
export const surveillerTousCRV = async () => {
  try {
    // Récupérer tous les CRV actifs (non VALIDE, non VERROUILLE, non ANNULE)
    const crvsActifs = await CRV.find({
      statut: { $in: ['BROUILLON', 'EN_COURS', 'TERMINE'] }
    }).populate('creePar');

    const alertes = [];
    const statistiques = {
      total: crvsActifs.length,
      enAlerte: 0,
      parNiveau: {
        WARNING: 0,
        CRITICAL: 0,
        EXCEEDED: 0
      },
      alertesEnvoyees: 0,
      alertesSupprimees: 0
    };

    for (const crv of crvsActifs) {
      const etatSLA = await verifierSLACRV(crv._id);

      if (etatSLA && etatSLA.enAlerte) {
        statistiques.enAlerte++;
        statistiques.parNiveau[etatSLA.niveau]++;

        // Anti-spam : vérifier si déjà alerté pour ce CRV à ce niveau/étape
        if (!shouldSendSLAAlert(crv._id.toString(), etatSLA.niveau, etatSLA.etapeActuelle)) {
          statistiques.alertesSupprimees++;
          alertes.push(etatSLA);
          continue; // déjà alerté, on skip l'envoi
        }

        // Envoyer alerte au créateur du CRV
        if (crv.creePar) {
          try {
            await envoyerAlerteSLA(crv.creePar._id, {
              titre: `Alerte SLA - CRV ${crv.numeroCRV}`,
              message: `Le CRV ${crv.numeroCRV} approche du dépassement de SLA (${etatSLA.pourcentageEcoule}% écoulé). Étape: ${etatSLA.etapeActuelle}. Temps restant: ${Math.round(etatSLA.heuresRestantes)}h.`,
              lien: `/crv/${crv._id}`,
              priorite: etatSLA.priorite,
              referenceModele: 'CRV',
              referenceId: crv._id,
              niveau: etatSLA.niveau,
              etapeActuelle: etatSLA.etapeActuelle,
              pourcentageEcoule: etatSLA.pourcentageEcoule,
              heuresRestantes: etatSLA.heuresRestantes
            });

            statistiques.alertesEnvoyees++;

            // ── NOTIFICATION ENGINE — Event selon le niveau réel ──
            const slaEvent = etatSLA.niveau === 'CRITIQUE' ? EVENTS.SLA_CRV_CRITIQUE : EVENTS.SLA_CRV_DEPASSE;
            eventBus.emitAsync(slaEvent, {
              crvId: crv._id, numeroCRV: crv.numeroCRV,
              niveau: etatSLA.niveau, priorite: etatSLA.priorite,
              heuresRestantes: etatSLA.heuresRestantes,
              pourcentageEcoule: etatSLA.pourcentageEcoule
            });
            // ─────────────────────────────────────────────────
          } catch (error) {
            console.error(`Erreur envoi alerte SLA pour CRV ${crv.numeroCRV}:`, error);
          }
        }

        alertes.push(etatSLA);
      }
    }

    if (statistiques.alertesSupprimees > 0) {
      console.log(`[SLA Cron] ${statistiques.alertesSupprimees} alertes supprimées (déjà envoyées <6h)`);
    }

    return {
      success: true,
      statistiques,
      alertes
    };

  } catch (error) {
    console.error('Erreur lors de la surveillance des CRV:', error);
    throw error;
  }
};

/**
 * Surveille toutes les phases actives et envoie des alertes
 * @returns {Object} Résultat de la surveillance
 */
export const surveillerToutesPhases = async () => {
  try {
    const phasesActives = await Phase.find({
      statut: { $in: ['EN_ATTENTE', 'EN_COURS'] }
    }).populate('crv');

    const alertes = [];
    const statistiques = {
      total: phasesActives.length,
      enAlerte: 0,
      parNiveau: {
        WARNING: 0,
        CRITICAL: 0,
        EXCEEDED: 0
      },
      alertesEnvoyees: 0
    };

    for (const phase of phasesActives) {
      const etatSLA = await verifierSLAPhase(phase._id);

      if (etatSLA && etatSLA.enAlerte) {
        statistiques.enAlerte++;
        statistiques.parNiveau[etatSLA.niveau]++;

        // Envoyer alerte aux responsables
        // (Adapter selon les besoins: créateur du CRV, superviseurs, etc.)
        if (phase.crv && phase.crv.creePar) {
          try {
            await envoyerAlerteSLA(phase.crv.creePar, {
              titre: `Alerte SLA - Phase ${phase.typePhase}`,
              message: `La phase ${phase.typePhase} du CRV ${phase.crv.numeroCRV} approche du dépassement de SLA (${etatSLA.pourcentageEcoule}% écoulé). Temps restant: ${Math.round(etatSLA.heuresRestantes)}h.`,
              lien: `/crv/${phase.crv._id}/phases`,
              priorite: etatSLA.priorite,
              referenceModele: 'Phase',
              referenceId: phase._id,
              niveau: etatSLA.niveau,
              etapeActuelle: etatSLA.etapeActuelle,
              pourcentageEcoule: etatSLA.pourcentageEcoule,
              heuresRestantes: etatSLA.heuresRestantes
            });

            statistiques.alertesEnvoyees++;

            // ── NOTIFICATION ENGINE — Event selon le niveau réel ──
            const slaPhaseEvent = etatSLA.niveau === 'CRITIQUE' ? EVENTS.SLA_PHASE_CRITIQUE : EVENTS.SLA_PHASE_DEPASSE;
            eventBus.emitAsync(slaPhaseEvent, {
              phaseId: phase._id, typePhase: phase.typePhase,
              crvId: phase.crv?._id, numeroCRV: phase.crv?.numeroCRV,
              niveau: etatSLA.niveau, priorite: etatSLA.priorite,
              heuresRestantes: etatSLA.heuresRestantes,
              pourcentageEcoule: etatSLA.pourcentageEcoule
            });
            // ─────────────────────────────────────────────────
          } catch (error) {
            console.error(`Erreur envoi alerte SLA pour Phase ${phase._id}:`, error);
          }
        }

        alertes.push(etatSLA);
      }
    }

    return {
      success: true,
      statistiques,
      alertes
    };

  } catch (error) {
    console.error('Erreur lors de la surveillance des phases:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
//   M5 — SURVEILLANCE DES TÂCHES FINES SLA (phases fines SLA_*)
// ═══════════════════════════════════════════════════════════════

/**
 * Anti-spam tâches fines — clé `crvId:phaseCode:niveau`, cooldown 6h
 * (identique au CRV/Phase mais namespace distinct pour isolation)
 */
const _slaTacheAlertCache = new Map();
const SLA_TACHE_ALERT_COOLDOWN = 6 * 60 * 60 * 1000; // 6h

function shouldSendTacheAlert(crvId, phaseCode, niveau) {
  const key = `${crvId}:${phaseCode}:${niveau}`;
  const now = Date.now();
  const lastSent = _slaTacheAlertCache.get(key);
  if (lastSent && (now - lastSent) < SLA_TACHE_ALERT_COOLDOWN) return false;
  _slaTacheAlertCache.set(key, now);
  if (_slaTacheAlertCache.size > 2000) {
    for (const [k, ts] of _slaTacheAlertCache) {
      if (now - ts > SLA_TACHE_ALERT_COOLDOWN) _slaTacheAlertCache.delete(k);
    }
  }
  return true;
}

// ─── BUX-2 — ESCALADE SLA (3 alertes successives non acquittées) ─────────────
// Tracker par clé `crvId:phaseCode` :
//   { count, lastLevel, niveauxVus:Set, firstTs, lastTs }
// Règle :
//   - Chaque alerte envoyée (non supprimée par anti-spam) incrémente count
//   - Si count >= 3 ET que les 3 niveaux successifs (WARNING→CRITIQUE→DEPASSE)
//     ont été vus ET que la fenêtre firstTs→lastTs est dans les 30 min ET
//     que la phase n'a pas bougé → émettre SLA_TACHE_ESCALADE
//   - Reset du tracker dès que la phase progresse (heureDebutReelle/heureFinReelle posés)
//   - Anti-spam escalade : cooldown 6h sur la même clé crvId:phaseCode
const _slaEscaladeTracker = new Map();  // key → { count, niveauxVus:Set, firstTs, lastTs }
const _slaEscaladeSent = new Map();     // key → timestamp dernière escalade émise
const ESCALADE_WINDOW_MS = 30 * 60 * 1000;  // 30 min
const ESCALADE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h anti-spam

/**
 * Enregistre une alerte tâche pour le tracking d'escalade.
 * Retourne true si une escalade doit être émise maintenant.
 *
 * @param {string} crvId
 * @param {string} phaseCode
 * @param {string} niveau - WARNING | CRITIQUE | DEPASSE
 * @returns {boolean} true si escalade à émettre
 */
function trackerEscaladeAlerte(crvId, phaseCode, niveau) {
  const key = `${crvId}:${phaseCode}`;
  const now = Date.now();

  // Anti-spam escalade : si déjà escaladé <6h → bloqué
  const lastSent = _slaEscaladeSent.get(key);
  if (lastSent && (now - lastSent) < ESCALADE_COOLDOWN_MS) return false;

  let entry = _slaEscaladeTracker.get(key);
  if (!entry) {
    entry = { count: 0, niveauxVus: new Set(), firstTs: now, lastTs: now };
    _slaEscaladeTracker.set(key, entry);
  }

  // Si la fenêtre 30 min est dépassée → on reset le compteur (repart à zéro)
  if (now - entry.firstTs > ESCALADE_WINDOW_MS) {
    entry.count = 0;
    entry.niveauxVus = new Set();
    entry.firstTs = now;
  }

  entry.count++;
  entry.niveauxVus.add(niveau);
  entry.lastTs = now;

  // Condition d'escalade : 3 alertes successives ET 3 niveaux distincts vus
  // (WARNING + CRITIQUE + DEPASSE) dans la fenêtre 30 min
  const aLesTroisNiveaux =
    entry.niveauxVus.has('WARNING') &&
    entry.niveauxVus.has('CRITIQUE') &&
    entry.niveauxVus.has('DEPASSE');

  if (entry.count >= 3 && aLesTroisNiveaux) {
    _slaEscaladeSent.set(key, now);
    // Reset le tracker après escalade pour éviter les ré-émissions dans la fenêtre
    _slaEscaladeTracker.delete(key);
    return true;
  }
  return false;
}

/**
 * Reset du tracker d'escalade quand la phase progresse
 * (heureDebutReelle ou heureFinReelle renseignées → l'agent a bougé).
 *
 * @param {string} crvId
 * @param {string} phaseCode
 */
function resetEscaladeTracker(crvId, phaseCode) {
  const key = `${crvId}:${phaseCode}`;
  _slaEscaladeTracker.delete(key);
  // On ne reset pas _slaEscaladeSent : si l'escalade a déjà été émise, on garde
  // le cooldown pour éviter les doublons sur le même problème.
}

/**
 * Expose une vue du tracker (tests / diagnostic).
 */
export function _getEscaladeTrackerSnapshot() {
  return {
    tracker: Array.from(_slaEscaladeTracker.entries()).map(([k, v]) => ({
      key: k,
      count: v.count,
      niveauxVus: Array.from(v.niveauxVus),
      firstTs: v.firstTs,
      lastTs: v.lastTs
    })),
    sent: Array.from(_slaEscaladeSent.entries()).map(([k, ts]) => ({ key: k, lastSent: ts }))
  };
}

/**
 * Calcule le niveau SLA pour une tâche fine à partir de heureDebutPrevue / heureFinPrevue.
 *
 * Logique :
 * - Phase DEADLINE (INSTANT) : on compare maintenant à heureDebutPrevue
 *   - Si maintenant >= prevue → DEPASSE (100%)
 *   - Si dans les 10% de la deadline → CRITIQUE (90%)
 *   - Si dans les 25% → WARNING (75%)
 *   Le calcul d'écoulement est basé sur la fenêtre [createdAt → heureDebutPrevue]
 * - Phase DUREE (DEBUT_FIN) : on compare la durée écoulée à la durée prévue
 *
 * Renvoie null si pas d'alerte (< 75% ou données manquantes).
 */
function calculerNiveauTacheFine(chronoPhase) {
  const now = new Date();

  // Si la tâche est déjà terminée ou non réalisée, pas d'alerte active
  if (['TERMINE', 'NON_REALISE', 'ANNULE'].includes(chronoPhase.statut)) return null;

  const phase = chronoPhase.phase;
  if (!phase) return null;

  // --- Phase INSTANT (deadline pure) : se base sur heureDebutPrevue ---
  if (phase.typeTemporel === 'INSTANT' || phase.slaMode === 'DEADLINE') {
    const prevue = chronoPhase.heureDebutPrevue;
    if (!prevue) return null;

    const prevueDate = new Date(prevue);
    const reference = chronoPhase.createdAt ? new Date(chronoPhase.createdAt) : null;
    if (!reference) return null;

    const fenetreMs = prevueDate - reference;
    if (fenetreMs <= 0) {
      // createdAt >= prevue → deadline déjà dans le passé dès création → DEPASSE
      return now >= prevueDate ? { niveau: 'DEPASSE', pourcentage: 100 } : null;
    }

    const ecoulesMs = now - reference;
    const pct = ecoulesMs / fenetreMs;

    if (pct >= SEUILS_ALERTE.EXCEEDED) return { niveau: 'DEPASSE', pourcentage: Math.round(pct * 100) };
    if (pct >= SEUILS_ALERTE.CRITICAL) return { niveau: 'CRITIQUE', pourcentage: Math.round(pct * 100) };
    if (pct >= SEUILS_ALERTE.WARNING)  return { niveau: 'WARNING',  pourcentage: Math.round(pct * 100) };
    return null;
  }

  // --- Phase DUREE (DEBUT_FIN) : se base sur durée écoulée vs dureeStandardMinutes ---
  if (phase.slaMode === 'DUREE' && chronoPhase.statut === 'EN_COURS' && chronoPhase.heureDebutReelle) {
    const dureePrevueMin = phase.dureeStandardMinutes;
    if (!dureePrevueMin || dureePrevueMin <= 0) return null;

    const ecoulesMin = (now - new Date(chronoPhase.heureDebutReelle)) / 60000;
    const pct = ecoulesMin / dureePrevueMin;

    if (pct >= SEUILS_ALERTE.EXCEEDED) return { niveau: 'DEPASSE', pourcentage: Math.round(pct * 100) };
    if (pct >= SEUILS_ALERTE.CRITICAL) return { niveau: 'CRITIQUE', pourcentage: Math.round(pct * 100) };
    if (pct >= SEUILS_ALERTE.WARNING)  return { niveau: 'WARNING',  pourcentage: Math.round(pct * 100) };
    return null;
  }

  return null;
}

/**
 * Domaine SLA (checkin/bagages/boarding/ramp/messages/briefing) déduit du code phase
 */
function extraireDomaineSLA(phaseCode) {
  if (!phaseCode) return null;
  if (phaseCode.startsWith('SLA_CHECKIN_')) return 'checkin';
  if (phaseCode.startsWith('SLA_BRIEFING_')) return 'briefing';
  if (phaseCode.startsWith('SLA_BOARDING_')) return 'boarding';
  if (phaseCode.startsWith('SLA_BAGAGES_')) return 'bagages';
  if (phaseCode.startsWith('SLA_RAMP_')) return 'ramp';
  if (phaseCode.startsWith('SLA_MSG_')) return 'messages';
  return null;
}

/**
 * Surveille toutes les tâches fines SLA (phases SLA_*) sur les CRV actifs
 * et émet les events SLA_TACHE_WARNING / CRITIQUE / DEPASSE avec dédup 6h.
 *
 * @returns {Object} Statistiques + alertes détectées
 */
export const surveillerTachesFines = async () => {
  try {
    // 1. Récupérer toutes les phases fines SLA_*
    const phasesFines = await Phase.find({ code: { $regex: '^SLA_' }, actif: true }).lean();
    const phasesFinesIds = phasesFines.map(p => p._id);
    if (phasesFinesIds.length === 0) {
      return { success: true, statistiques: { total: 0, enAlerte: 0 }, alertes: [] };
    }

    // 2. Récupérer les CRV actifs
    const crvsActifs = await CRV.find({
      statut: { $in: ['BROUILLON', 'EN_COURS', 'TERMINE'] }
    }).select('_id numeroCRV creePar').lean();
    const crvIds = crvsActifs.map(c => c._id);
    if (crvIds.length === 0) {
      return { success: true, statistiques: { total: 0, enAlerte: 0 }, alertes: [] };
    }

    // 3. Récupérer les ChronologiePhase pour ces CRV + phases fines
    const chronoPhases = await ChronologiePhase.find({
      crv: { $in: crvIds },
      phase: { $in: phasesFinesIds },
      statut: { $in: ['NON_COMMENCE', 'EN_COURS'] }
    }).populate('phase').lean();

    const crvMap = new Map(crvsActifs.map(c => [c._id.toString(), c]));
    const alertes = [];
    const stats = {
      total: chronoPhases.length,
      enAlerte: 0,
      parNiveau: { WARNING: 0, CRITIQUE: 0, DEPASSE: 0 },
      alertesEnvoyees: 0,
      alertesSupprimees: 0,
      escaladesEmises: 0
    };

    for (const cp of chronoPhases) {
      const phaseCode = cp.phase?.code;
      const crvIdStr = cp.crv.toString();

      // BUX-2 — Reset tracker si la phase a progressé
      // (heureDebutReelle ou heureFinReelle renseignées → agent a acquitté)
      if (cp.heureDebutReelle || cp.heureFinReelle) {
        if (phaseCode) resetEscaladeTracker(crvIdStr, phaseCode);
      }

      const alerte = calculerNiveauTacheFine(cp);
      if (!alerte) continue;

      stats.enAlerte++;
      stats.parNiveau[alerte.niveau] = (stats.parNiveau[alerte.niveau] || 0) + 1;

      const crv = crvMap.get(crvIdStr);
      if (!crv) continue;

      const domaineSLA = extraireDomaineSLA(phaseCode);

      // Anti-spam
      if (!shouldSendTacheAlert(crvIdStr, phaseCode, alerte.niveau)) {
        stats.alertesSupprimees++;
        alertes.push({ crvId: cp.crv, phaseCode, niveau: alerte.niveau, pourcentage: alerte.pourcentage, suppressed: true });
        continue;
      }

      // Event selon niveau
      const eventName =
        alerte.niveau === 'DEPASSE' ? EVENTS.SLA_TACHE_DEPASSE :
        alerte.niveau === 'CRITIQUE' ? EVENTS.SLA_TACHE_CRITIQUE :
        EVENTS.SLA_TACHE_WARNING;

      const priority = alerte.niveau === 'WARNING' ? 'HAUTE' : 'CRITIQUE';

      try {
        eventBus.emitAsync(eventName, {
          crvId: cp.crv,
          numeroCRV: crv.numeroCRV,
          phaseId: cp.phase._id,
          phaseCode,
          phaseLibelle: cp.phase.libelle,
          domaineSLA,
          niveau: alerte.niveau,
          priorite: priority,
          pourcentageEcoule: alerte.pourcentage
        });
        stats.alertesEnvoyees++;
      } catch (err) {
        console.error('[SLA_TACHE] erreur emit event:', err.message);
      }

      // BUX-2 — Tracker escalade (après envoi alerte individuelle)
      const doitEscalader = trackerEscaladeAlerte(crvIdStr, phaseCode, alerte.niveau);
      if (doitEscalader) {
        try {
          eventBus.emitAsync(EVENTS.SLA_TACHE_ESCALADE, {
            crvId: cp.crv,
            numeroCRV: crv.numeroCRV,
            phaseId: cp.phase._id,
            phaseCode,
            phaseLibelle: cp.phase.libelle,
            domaineSLA,
            niveau: 'ESCALADE',
            priorite: 'CRITIQUE',
            raison: '3 alertes successives non acquittées en 30 min'
          });
          stats.escaladesEmises++;
          console.log(`[SLA_ESCALADE] Escalade émise pour CRV ${crv.numeroCRV} / ${phaseCode}`);
        } catch (err) {
          console.error('[SLA_ESCALADE] erreur emit event:', err.message);
        }
      }

      alertes.push({
        crvId: cp.crv,
        numeroCRV: crv.numeroCRV,
        phaseCode,
        phaseLibelle: cp.phase.libelle,
        domaineSLA,
        niveau: alerte.niveau,
        pourcentage: alerte.pourcentage,
        escalade: doitEscalader
      });
    }

    if (stats.alertesSupprimees > 0) {
      console.log(`[SLA_TACHE Cron] ${stats.alertesSupprimees} alertes tâches supprimées (déjà envoyées <6h)`);
    }
    if (stats.escaladesEmises > 0) {
      console.log(`[SLA_ESCALADE Cron] ${stats.escaladesEmises} escalade(s) émise(s)`);
    }

    return { success: true, statistiques: stats, alertes };
  } catch (error) {
    console.error('Erreur lors de la surveillance des tâches fines SLA:', error);
    throw error;
  }
};

/**
 * Obtient un rapport complet des SLA
 * @returns {Object} Rapport SLA
 */
export const obtenirRapportSLA = async () => {
  try {
    const [resultCRV, resultPhases, resultTaches] = await Promise.all([
      surveillerTousCRV(),
      surveillerToutesPhases(),
      surveillerTachesFines()
    ]);

    return {
      success: true,
      dateRapport: new Date(),
      crv: resultCRV.statistiques,
      phases: resultPhases.statistiques,
      taches: resultTaches.statistiques,
      total: {
        elements: resultCRV.statistiques.total + resultPhases.statistiques.total + (resultTaches.statistiques.total || 0),
        enAlerte: resultCRV.statistiques.enAlerte + resultPhases.statistiques.enAlerte + (resultTaches.statistiques.enAlerte || 0),
        alertesEnvoyees: resultCRV.statistiques.alertesEnvoyees + resultPhases.statistiques.alertesEnvoyees + (resultTaches.statistiques.alertesEnvoyees || 0)
      }
    };

  } catch (error) {
    console.error('Erreur lors de la génération du rapport SLA:', error);
    throw error;
  }
};

// configurerSLA() en RAM supprimé — la configuration SLA passe uniquement par SLAConfig en base (CRUD /api/sla/compagnies)
// Les SLA_DEFAULTS ci-dessus servent de fallback immuable quand aucune config base n'existe.

/**
 * Obtient la configuration SLA actuelle
 * @returns {Object} Configuration SLA
 */
export const obtenirConfigurationSLA = () => {
  return {
    defaults: SLA_DEFAULTS,
    seuils: SEUILS_ALERTE
  };
};
