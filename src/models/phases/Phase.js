import mongoose from 'mongoose';

const phaseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  libelle: {
    type: String,
    required: true,
    trim: true
  },
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'COMMUN'],
    required: true
  },
  categorie: {
    type: String,
    enum: ['PISTE', 'PASSAGERS', 'FRET', 'BAGAGE', 'TECHNIQUE', 'AVITAILLEMENT', 'NETTOYAGE', 'SECURITE', 'BRIEFING'],
    required: true
  },
  macroPhase: {
    type: String,
    enum: ['DEBUT', 'REALISATION', 'FIN'],
    required: true
  },
  // EXTENSION 11 — Typologie temporelle
  // INSTANT = un seul horodatage (calage, ouverture soutes, repoussage...)
  // DEBUT_FIN = deux horodatages début + fin (briefing, déchargement, embarquement...)
  typeTemporel: {
    type: String,
    enum: ['INSTANT', 'DEBUT_FIN'],
    default: 'DEBUT_FIN'
  },
  ordre: {
    type: Number,
    required: true
  },
  dureeStandardMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  obligatoire: {
    type: Boolean,
    default: true
  },
  // EXTENSION — Mode SLA
  // DUREE = SLA basé sur la durée de la phase (ex: nettoyage max 30 min)
  // DEADLINE = SLA basé sur un horaire calculé depuis ETD/ETA (ex: boarding 40 min avant ETD)
  slaMode: {
    type: String,
    enum: ['DUREE', 'DEADLINE'],
    default: 'DUREE'
  },
  // Événement de référence pour les phases DEADLINE
  // ETA = heure d'atterrissage prévue, ETD = heure de décollage prévue, CALAGE = chocks on
  referenceTemporelle: {
    type: String,
    enum: ['ETA', 'ETD', 'CALAGE', null],
    default: null
  },
  // Clés SLA dans SLAConfig pour les phases DEADLINE (ex: 'boarding.debut', 'checkin.ouverture')
  slaConfigKeyDebut: {
    type: String,
    default: null
  },
  slaConfigKeyFin: {
    type: String,
    default: null
  },
  description: String,
  prerequis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase'
  }],
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

phaseSchema.index({ typeOperation: 1, ordre: 1 });
phaseSchema.index({ categorie: 1 });

export default mongoose.model('Phase', phaseSchema);
