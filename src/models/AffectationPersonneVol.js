import mongoose from 'mongoose';

const affectationPersonneVolSchema = new mongoose.Schema({
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true
  },
  personne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  role: {
    type: String,
    enum: ['RESPONSABLE_VOL', 'AGENT_PISTE', 'AGENT_PASSAGERS', 'AGENT_FRET', 'AGENT_BAGAGE'],
    required: true
  },
  heureDebut: {
    type: Date,
    required: true
  },
  heureFin: Date,
  statut: {
    type: String,
    enum: ['AFFECTE', 'EN_COURS', 'TERMINE', 'ABSENT'],
    default: 'AFFECTE'
  },
  remarques: String
}, {
  timestamps: true
});

affectationPersonneVolSchema.index({ vol: 1 });
affectationPersonneVolSchema.index({ personne: 1 });
affectationPersonneVolSchema.index({ heureDebut: 1 });

export default mongoose.model('AffectationPersonneVol', affectationPersonneVolSchema);
