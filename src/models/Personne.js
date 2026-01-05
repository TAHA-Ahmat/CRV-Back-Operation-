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
    enum: ['AGENT_ESCALE', 'SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'],
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
  telephone: String,
  dateEmbauche: Date
}, {
  timestamps: true
});

personneSchema.index({ matricule: 1 });
personneSchema.index({ email: 1 });
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
