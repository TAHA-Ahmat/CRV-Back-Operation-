import mongoose from 'mongoose';

const volSchema = new mongoose.Schema({
  numeroVol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND'],
    required: true
  },
  compagnieAerienne: {
    type: String,
    required: true,
    trim: true
  },
  codeIATA: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    length: 2
  },
  aeroportOrigine: {
    type: String,
    trim: true,
    uppercase: true
  },
  aeroportDestination: {
    type: String,
    trim: true,
    uppercase: true
  },
  dateVol: {
    type: Date,
    required: true
  },
  statut: {
    type: String,
    enum: ['PROGRAMME', 'EN_COURS', 'TERMINE', 'ANNULE', 'RETARDE'],
    default: 'PROGRAMME'
  },
  avion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avion'
  },

  // ========== EXTENSION 2 - Distinction vol programmé / hors programme ==========
  // NON-RÉGRESSION: Tous les champs ci-dessous sont OPTIONNELS avec valeurs par défaut
  // Les vols existants auront automatiquement horsProgramme=false et programmeVolReference=null

  horsProgramme: {
    type: Boolean,
    default: false,
    description: 'Indique si le vol est hors programme (ponctuel, non récurrent)'
  },

  programmeVolReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgrammeVolSaisonnier',
    default: null,
    description: 'Référence au programme vol saisonnier si vol programmé'
  },

  raisonHorsProgramme: {
    type: String,
    default: null,
    trim: true,
    description: 'Raison du vol hors programme (ex: charter ponctuel, évacuation médicale, vol technique)'
  },

  typeVolHorsProgramme: {
    type: String,
    enum: ['CHARTER', 'MEDICAL', 'TECHNIQUE', 'COMMERCIAL', 'AUTRE', null],
    default: null,
    description: 'Catégorie du vol hors programme'
  }

  // FIN EXTENSION 2 - Aucune modification des champs existants ci-dessus
}, {
  timestamps: true
});

volSchema.index({ numeroVol: 1, dateVol: 1 });
volSchema.index({ compagnieAerienne: 1 });
volSchema.index({ statut: 1 });

export default mongoose.model('Vol', volSchema);
