import mongoose from 'mongoose';

const enginSchema = new mongoose.Schema({
  numeroEngin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  typeEngin: {
    type: String,
    enum: ['TRACTEUR', 'CHARIOT_BAGAGES', 'CHARIOT_FRET', 'GPU', 'ASU', 'STAIRS', 'CONVOYEUR', 'AUTRE'],
    required: true
  },
  marque: String,
  modele: String,
  statut: {
    type: String,
    enum: ['DISPONIBLE', 'EN_SERVICE', 'MAINTENANCE', 'PANNE', 'HORS_SERVICE'],
    default: 'DISPONIBLE'
  },
  derniereRevision: Date,
  prochaineRevision: Date,
  remarques: String
}, {
  timestamps: true
});

enginSchema.index({ numeroEngin: 1 });
enginSchema.index({ typeEngin: 1 });
enginSchema.index({ statut: 1 });

export default mongoose.model('Engin', enginSchema);
