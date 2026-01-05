import mongoose from 'mongoose';

const evenementOperationnelSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  typeEvenement: {
    type: String,
    enum: ['PANNE_EQUIPEMENT', 'ABSENCE_PERSONNEL', 'RETARD', 'INCIDENT_SECURITE', 'PROBLEME_TECHNIQUE', 'METEO', 'AUTRE'],
    required: true
  },
  gravite: {
    type: String,
    enum: ['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE'],
    required: true
  },
  dateHeureDebut: {
    type: Date,
    required: true
  },
  dateHeureFin: Date,
  dureeImpactMinutes: Number,
  description: {
    type: String,
    required: true
  },
  impactPhases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChronologiePhase'
  }],
  equipementConcerne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engin'
  },
  personneConcernee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  actionsCorrectives: String,
  declarePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  statut: {
    type: String,
    enum: ['OUVERT', 'EN_COURS', 'RESOLU', 'CLOTURE'],
    default: 'OUVERT'
  }
}, {
  timestamps: true
});

evenementOperationnelSchema.index({ crv: 1 });
evenementOperationnelSchema.index({ typeEvenement: 1 });
evenementOperationnelSchema.index({ gravite: 1 });
evenementOperationnelSchema.index({ statut: 1 });

evenementOperationnelSchema.pre('save', function(next) {
  if (this.dateHeureDebut && this.dateHeureFin) {
    this.dureeImpactMinutes = Math.round((this.dateHeureFin - this.dateHeureDebut) / 60000);
  }
  next();
});

export default mongoose.model('EvenementOperationnel', evenementOperationnelSchema);
