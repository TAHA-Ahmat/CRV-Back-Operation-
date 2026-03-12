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
