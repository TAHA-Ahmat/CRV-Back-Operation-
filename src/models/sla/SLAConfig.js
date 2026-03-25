import mongoose from 'mongoose';

/**
 * SLAConfig — Configuration SLA par compagnie aérienne
 *
 * Niveau 1 (existant) : crv, phase — transitions statut CRV
 * Niveau 2 (extension) : checkin, bagages, boarding, ramp, messages — domaines opérationnels
 *
 * Clé de résolution : codeIATA (ex: "AF", "TK", "ET")
 * Unité : heures pour crv/phase (compatibilité), minutes pour domaines niveau 2
 * Héritage : null = utiliser le standard global
 *
 * Nomenclature verrouillée : voir SLA_NOMENCLATURE_LOCK.md
 */
const SLAConfigSchema = new mongoose.Schema({
  codeIATA: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  compagnieNom: {
    type: String,
    required: true,
    trim: true
  },
  actif: {
    type: Boolean,
    default: true
  },

  // ══════════════════════════════════════════════════════════════
  //   NIVEAU 1 — Transitions statut CRV (en HEURES, existant)
  // ══════════════════════════════════════════════════════════════

  crv: {
    brouillonToEnCours: { type: Number, default: null },
    enCoursToTermine:   { type: Number, default: null },
    termineToValide:    { type: Number, default: null },
    global:             { type: Number, default: null }
  },

  phase: {
    enAttenteToEnCours:  { type: Number, default: null },
    enCoursToTerminee:   { type: Number, default: null },
    global:              { type: Number, default: null }
  },

  // ══════════════════════════════════════════════════════════════
  //   NIVEAU 2 — Domaines opérationnels (en MINUTES)
  //   null = hérite du standard. Nomenclature fermée.
  // ══════════════════════════════════════════════════════════════

  // Enregistrement — réf. temps : STD
  checkin: {
    ouverture:  { type: Number, default: null },  // min avant STD
    fermeture:  { type: Number, default: null }   // min avant STD
  },

  // Bagages — réf. temps : calage (chocks on)
  bagages: {
    premierBagage:      { type: Number, default: null },  // min après calage
    dernierBagage:      { type: Number, default: null },  // min après calage
    bagagePrioritaire:  { type: Number, default: null }   // min après calage (sous-contexte typeBagage)
  },

  // Embarquement — réf. temps : ETD
  boarding: {
    debut:          { type: Number, default: null },  // min avant ETD
    fermetureGate:  { type: Number, default: null },  // min avant ETD
    presenceAgent:  { type: Number, default: null }   // min avant ETD
  },

  // Rampe — réf. temps : calage / calé-à-calé
  ramp: {
    turnaround:       { type: Number, default: null },  // min calé-à-calé
    turnaroundNarrow: { type: Number, default: null },  // min calé-à-calé (sous-contexte typeAvion:narrow)
    turnaroundWide:   { type: Number, default: null },  // min calé-à-calé (sous-contexte typeAvion:wide)
    gpu:              { type: Number, default: null }   // min après calage
  },

  // Messages opérationnels — faible priorité
  messages: {
    mvt:  { type: Number, default: null },  // min après événement
    ldm:  { type: Number, default: null },  // min avant STD
    apis: { type: Number, default: null }   // min avant STD
  },

  // ══════════════════════════════════════════════════════════════
  //   NIVEAU 3 — Durées phases individuelles (en MINUTES)
  //   Clé = code phase (ex: ARR_DEBARQUEMENT), Valeur = durée max en minutes
  //   null / absent = hérite de Phase.dureeStandardMinutes
  //   Permet au manager de surcharger la durée standard par compagnie
  // ══════════════════════════════════════════════════════════════

  phaseDurees: {
    type: Map,
    of: Number,
    default: new Map()
  },

  // ══════════════════════════════════════════════════════════════
  //   NIVEAU 4 — Offsets temporels phases (en MINUTES)
  //   Clé = code phase (ex: DEP_INSPECTION), Valeur = minutes avant/après référence
  //   Positif = AVANT la référence (ex: 180 = 3h avant ETD)
  //   Référence = Phase.referenceTemporelle (ETA pour arrivée, ETD pour départ)
  //   null / absent = pas de positionnement (cascade séquentielle)
  //   Permet au manager de définir le planning théorique par compagnie
  // ══════════════════════════════════════════════════════════════

  phaseOffsets: {
    type: Map,
    of: Number,
    default: new Map()
  },

  // ══════════════════════════════════════════════════════════════
  //   Métadonnées
  // ══════════════════════════════════════════════════════════════

  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Personne' },
  modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Personne' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.model('SLAConfig', SLAConfigSchema);
