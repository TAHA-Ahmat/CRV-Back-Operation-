import mongoose from 'mongoose';

const crvSchema = new mongoose.Schema({
  numeroCRV: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true
  },
  horaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horaire'
  },
  statut: {
    type: String,
    enum: ['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE'],
    default: 'BROUILLON'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  responsableVol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  completude: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  verrouillePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  dateVerrouillage: Date,
  derniereModification: {
    type: Date,
    default: Date.now
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  archivage: {
    driveFileId: {
      type: String,
      default: null
    },
    driveWebViewLink: {
      type: String,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    }
  },
  // EXTENSION 6 - Annulation de CRV (NON-RÉGRESSION: champs OPTIONNELS)
  annulation: {
    dateAnnulation: {
      type: Date,
      default: null
    },
    annulePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    },
    raisonAnnulation: {
      type: String,
      default: null,
      trim: true
    },
    commentaireAnnulation: {
      type: String,
      default: null,
      trim: true
    },
    ancienStatut: {
      type: String,
      enum: ['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', null],
      default: null
    }
  }
}, {
  timestamps: true
});

crvSchema.index({ numeroCRV: 1 });
crvSchema.index({ vol: 1 });
crvSchema.index({ statut: 1 });
crvSchema.index({ dateCreation: -1 });

crvSchema.pre('save', function(next) {
  this.derniereModification = new Date();
  next();
});

export default mongoose.model('CRV', crvSchema);
