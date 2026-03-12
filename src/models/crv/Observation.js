import mongoose from 'mongoose';

const observationSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  categorie: {
    type: String,
    enum: ['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA'],
    required: true
  },
  contenu: {
    type: String,
    required: true
  },
  dateHeure: {
    type: Date,
    default: Date.now
  },
  phaseConcernee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChronologiePhase'
  },
  pieceJointe: String,
  visibilite: {
    type: String,
    enum: ['INTERNE', 'COMPAGNIE', 'PUBLIQUE'],
    default: 'INTERNE'
  }
}, {
  timestamps: true
});

observationSchema.index({ crv: 1 });
observationSchema.index({ auteur: 1 });
observationSchema.index({ categorie: 1 });
observationSchema.index({ dateHeure: -1 });

export default mongoose.model('Observation', observationSchema);
