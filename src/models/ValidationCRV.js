import mongoose from 'mongoose';

const validationCRVSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true,
    unique: true
  },
  validePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  dateValidation: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['VALIDE', 'INVALIDE', 'EN_ATTENTE_CORRECTION'],
    required: true
  },
  commentaires: String,
  scoreCompletude: {
    type: Number,
    min: 0,
    max: 100
  },
  conformiteSLA: {
    type: Boolean,
    default: false
  },
  ecartsSLA: [{
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phase'
    },
    ecartMinutes: Number,
    description: String
  }],
  anomaliesDetectees: [{
    type: String
  }],
  verrouille: {
    type: Boolean,
    default: false
  },
  dateVerrouillage: Date
}, {
  timestamps: true
});

validationCRVSchema.index({ crv: 1 });
validationCRVSchema.index({ validePar: 1 });
validationCRVSchema.index({ statut: 1 });

export default mongoose.model('ValidationCRV', validationCRVSchema);
