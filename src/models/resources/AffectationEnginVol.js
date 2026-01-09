import mongoose from 'mongoose';

const affectationEnginVolSchema = new mongoose.Schema({
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true
  },
  engin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engin',
    required: true
  },
  heureDebut: {
    type: Date,
    required: true
  },
  heureFin: Date,
  usage: {
    type: String,
    enum: ['TRACTAGE', 'BAGAGES', 'FRET', 'ALIMENTATION_ELECTRIQUE', 'CLIMATISATION', 'PASSERELLE', 'CHARGEMENT'],
    required: true
  },
  statut: {
    type: String,
    enum: ['AFFECTE', 'EN_COURS', 'TERMINE', 'PANNE'],
    default: 'AFFECTE'
  },
  remarques: String
}, {
  timestamps: true
});

affectationEnginVolSchema.index({ vol: 1 });
affectationEnginVolSchema.index({ engin: 1 });
affectationEnginVolSchema.index({ heureDebut: 1 });

export default mongoose.model('AffectationEnginVol', affectationEnginVolSchema);
