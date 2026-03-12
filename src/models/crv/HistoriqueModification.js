import mongoose from 'mongoose';

const historiqueModificationSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  dateModification: {
    type: Date,
    default: Date.now
  },
  typeModification: {
    type: String,
    enum: ['CREATION', 'MISE_A_JOUR', 'SUPPRESSION', 'VALIDATION', 'ANNULATION'],
    required: true
  },
  champModifie: {
    type: String,
    required: true
  },
  ancienneValeur: mongoose.Schema.Types.Mixed,
  nouvelleValeur: mongoose.Schema.Types.Mixed,
  raisonModification: String,
  adresseIP: String,
  userAgent: String
}, {
  timestamps: true
});

historiqueModificationSchema.index({ crv: 1, dateModification: -1 });
historiqueModificationSchema.index({ modifiePar: 1 });
historiqueModificationSchema.index({ typeModification: 1 });

export default mongoose.model('HistoriqueModification', historiqueModificationSchema);
