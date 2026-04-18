/**
 * SEED PHASES FINES SLA — Mission M1 (SLA_FULL_COVERAGE_BACK)
 *
 * Objectif : peupler la collection Phase avec les tâches fines exigées par
 * le contrat SLA compagnie (SLAConfig).
 *
 * Chaque phase fine représente UNE tâche chronométrée (temps-réel côté agent,
 * avec countdown et état SLA). Elles coexistent avec les phases historiques
 * (ARR_*, DEP_*, TA_*, COM_*) sans remplacement.
 *
 * Codes verrouillés (préfixe SLA_) pour éviter toute collision :
 *   - SLA_CHECKIN_OUVERTURE, SLA_CHECKIN_FERMETURE
 *   - SLA_BRIEFING_EQUIPE
 *   - SLA_BOARDING_DEBUT, SLA_BOARDING_FERMETURE_GATE
 *   - SLA_BAGAGES_PREMIER, SLA_BAGAGES_DERNIER
 *   - SLA_RAMP_TURNAROUND, SLA_RAMP_GPU
 *   - SLA_MSG_MVT, SLA_MSG_LDM, SLA_MSG_APIS
 *
 * Idempotent : upsert par code, ne supprime rien.
 *
 * Usage CLI :
 *   node scripts/seedPhasesFines.js
 */

import mongoose from 'mongoose';
import Phase from '../src/models/phases/Phase.js';
import { connectDB } from '../src/config/db.js';

// ══════════════════════════════════════════════════════════════
//   LISTE DES PHASES FINES SLA
//   - ordre : >= 200 pour ne pas mélanger avec l'existant (1-103)
//   - obligatoire = true (tâches exigées par le contrat SLA)
//   - actif = true
// ══════════════════════════════════════════════════════════════

export const phasesFinesSLA = [
  // ── CHECK-IN (DEPART) — réf. ETD ──
  {
    code: 'SLA_CHECKIN_OUVERTURE',
    libelle: 'Ouverture comptoir check-in',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'DEBUT',
    typeTemporel: 'INSTANT',
    ordre: 200,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'checkin.ouverture',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 180,
    description: 'Ouverture des comptoirs d\'enregistrement (min avant ETD, configuré par compagnie)'
  },
  {
    code: 'SLA_CHECKIN_FERMETURE',
    libelle: 'Fermeture comptoir check-in',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 201,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'checkin.fermeture',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 45,
    description: 'Fermeture des comptoirs d\'enregistrement (min avant ETD, configuré par compagnie)'
  },

  // ── BRIEFING ÉQUIPE (COMMUN) ──
  {
    code: 'SLA_BRIEFING_EQUIPE',
    libelle: 'Briefing équipe',
    typeOperation: 'COMMUN',
    categorie: 'BRIEFING',
    macroPhase: 'DEBUT',
    typeTemporel: 'INSTANT',
    ordre: 202,
    dureeStandardMinutes: 15,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'briefing',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 90,
    description: 'Briefing avant opération (min avant ETD, configuré par compagnie - fallback durée 15 min)'
  },

  // ── BOARDING (DEPART) — réf. ETD ──
  {
    code: 'SLA_BOARDING_DEBUT',
    libelle: 'Début embarquement',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 203,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'boarding.debut',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 40,
    description: 'Début de l\'embarquement passagers (min avant ETD, configuré par compagnie)'
  },
  {
    code: 'SLA_BOARDING_FERMETURE_GATE',
    libelle: 'Fermeture porte d\'embarquement',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 204,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'boarding.fermetureGate',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 15,
    description: 'Fermeture porte / gate (min avant ETD, configuré par compagnie)'
  },

  // ── BAGAGES (ARRIVEE) — réf. CALAGE ──
  {
    code: 'SLA_BAGAGES_PREMIER',
    libelle: 'Livraison premier bagage',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 205,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'CALAGE',
    slaConfigKeyDebut: 'bagages.premierBagage',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: -15,
    description: 'Mise à disposition du premier bagage au carrousel (min après calage, configuré par compagnie)'
  },
  {
    code: 'SLA_BAGAGES_DERNIER',
    libelle: 'Livraison dernier bagage',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 206,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'CALAGE',
    slaConfigKeyDebut: 'bagages.dernierBagage',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: -35,
    description: 'Mise à disposition du dernier bagage au carrousel (min après calage, configuré par compagnie)'
  },

  // ── RAMP (COMMUN) — réf. CALAGE ──
  {
    code: 'SLA_RAMP_TURNAROUND',
    libelle: 'Turnaround calé-à-calé',
    typeOperation: 'TURN_AROUND',
    categorie: 'PISTE',
    macroPhase: 'REALISATION',
    typeTemporel: 'DEBUT_FIN',
    ordre: 207,
    dureeStandardMinutes: 60,
    obligatoire: true,
    actif: true,
    slaMode: 'DUREE',
    referenceTemporelle: 'CALAGE',
    slaConfigKeyDebut: 'ramp.turnaround',
    slaConfigKeyFin: 'ramp.turnaround',
    offsetMinutesDefaut: 0,
    description: 'Durée totale du turnaround (calage arrivée → repoussage départ, Narrow/Wide résolu par compagnie)'
  },
  {
    code: 'SLA_RAMP_GPU',
    libelle: 'Connexion GPU',
    typeOperation: 'COMMUN',
    categorie: 'TECHNIQUE',
    macroPhase: 'REALISATION',
    typeTemporel: 'DEBUT_FIN',
    ordre: 208,
    dureeStandardMinutes: 45,
    obligatoire: false,
    actif: true,
    slaMode: 'DUREE',
    referenceTemporelle: 'CALAGE',
    slaConfigKeyDebut: 'ramp.gpu',
    slaConfigKeyFin: 'ramp.gpu',
    offsetMinutesDefaut: 0,
    description: 'Durée de connexion GPU (groupe électrique de parc)'
  },

  // ── MESSAGES OPÉRATIONNELS (DEPART / COMMUN) ──
  {
    code: 'SLA_MSG_MVT',
    libelle: 'Message MVT envoyé',
    typeOperation: 'COMMUN',
    categorie: 'SECURITE',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 209,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'CALAGE',
    slaConfigKeyDebut: 'messages.mvt',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: -15,
    description: 'Envoi du message MVT (mouvement avion) après événement (min après calage/décollage)'
  },
  {
    code: 'SLA_MSG_LDM',
    libelle: 'Message LDM envoyé',
    typeOperation: 'DEPART',
    categorie: 'SECURITE',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 210,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'messages.ldm',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 30,
    description: 'Envoi du message LDM (load message) avant ETD'
  },
  {
    code: 'SLA_MSG_APIS',
    libelle: 'Message APIS envoyé',
    typeOperation: 'DEPART',
    categorie: 'SECURITE',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 211,
    dureeStandardMinutes: 0,
    obligatoire: true,
    actif: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'messages.apis',
    slaConfigKeyFin: null,
    offsetMinutesDefaut: 60,
    description: 'Envoi du message APIS (passagers manifestes) avant ETD'
  }
];

/**
 * Seed idempotent des phases fines SLA.
 * - Upsert par `code` (Phase.code est unique)
 * - Ne supprime rien
 * - Ne touche pas aux phases existantes
 *
 * @returns {{ created: number, updated: number, total: number }}
 */
export const seedPhasesFinesSLA = async () => {
  try {
    await connectDB();

    let created = 0;
    let updated = 0;

    console.log(`[SEED FINES] Upsert de ${phasesFinesSLA.length} phases fines SLA...`);

    for (const phase of phasesFinesSLA) {
      const result = await Phase.findOneAndUpdate(
        { code: phase.code },
        { $set: phase },
        { upsert: true, new: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        updated++;
      } else {
        created++;
      }
    }

    const totalFines = await Phase.countDocuments({ code: /^SLA_/ });
    const totalGlobal = await Phase.countDocuments();

    console.log(`[SEED FINES] ✅ ${created} créées, ${updated} mises à jour`);
    console.log(`[SEED FINES] Phases SLA_* en base : ${totalFines}`);
    console.log(`[SEED FINES] Total phases en base : ${totalGlobal}`);

    return { created, updated, total: totalFines };
  } catch (error) {
    console.error('[SEED FINES] Erreur:', error.message);
    throw error;
  }
};

// Point d'entrée CLI (robuste Windows/Linux + import dynamique)
const isCli = (() => {
  try {
    if (!process.argv[1]) return false;
    const argvNorm = process.argv[1].replace(/\\/g, '/');
    return import.meta.url === `file://${argvNorm}` || import.meta.url === `file:///${argvNorm}`;
  } catch {
    return false;
  }
})();

if (isCli) {
  seedPhasesFinesSLA()
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(() => {
      mongoose.connection.close();
      process.exit(1);
    });
}
