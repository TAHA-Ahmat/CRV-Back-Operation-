import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const personneSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  fonction: {
    type: String,
    enum: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
    required: true
  },
  specialites: [{
    type: String,
    enum: ['PISTE', 'PASSAGERS', 'FRET', 'BAGAGE', 'AVITAILLEMENT', 'NETTOYAGE', 'MAINTENANCE']
  }],
  statut: {
    type: String,
    enum: ['ACTIF', 'ABSENT', 'CONGE', 'INACTIF'],
    default: 'ACTIF'
  },
  // 🔒 PHASE 1 - Workflow validation compte utilisateur
  statutCompte: {
    type: String,
    enum: ['EN_ATTENTE', 'VALIDE', 'SUSPENDU', 'DESACTIVE'],
    default: 'VALIDE', // PHASE 1: validation automatique (pas de workflow manuel encore)
    required: true
  },
  // Date validation compte (si workflow manuel activé plus tard)
  dateValidationCompte: {
    type: Date,
    default: null
  },
  // Validé par (si workflow manuel activé plus tard)
  valideParUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },
  telephone: String,
  dateEmbauche: Date
}, {
  timestamps: true
});

// Index unique sur matricule et email déjà créés via unique: true
// personneSchema.index({ matricule: 1 }); // REMOVED - duplicate
// personneSchema.index({ email: 1 }); // REMOVED - duplicate
personneSchema.index({ fonction: 1 });

personneSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

personneSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Personne', personneSchema);
