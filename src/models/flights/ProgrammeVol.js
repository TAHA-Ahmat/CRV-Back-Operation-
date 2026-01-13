import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MODÈLE PROGRAMME VOL (Conteneur)
 *
 * Représente un programme de vol saisonnier (ex: HIVER_2025_2026).
 * C'est le conteneur qui regroupe tous les vols d'une saison.
 *
 * WORKFLOW:
 * 1. Créer le programme (nom, période) → BROUILLON
 * 2. Ajouter les vols un par un (voir VolProgramme.js)
 * 3. Valider le programme → VALIDE
 * 4. Activer le programme → ACTIF
 *
 * RELATIONS:
 * - Un ProgrammeVol contient plusieurs VolProgramme
 * - Les vols sont liés via le champ programme (ObjectId)
 */

const programmeVolSchema = new Schema({

  // ══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Nom/identifiant du programme
   * Ex: "HIVER_2025_2026", "ETE_2026"
   */
  nom: {
    type: String,
    required: [true, 'Le nom du programme est requis'],
    unique: true,
    uppercase: true,
    trim: true,
    description: 'Identifiant unique du programme (ex: HIVER_2025_2026)'
  },

  /**
   * Numéro d'édition du document
   * Ex: "N°01/17-déc.-25", "N°02/15-jan.-26"
   */
  edition: {
    type: String,
    default: null,
    trim: true,
    description: 'Numéro d\'édition (ex: N°01/17-déc.-25)'
  },

  /**
   * Description optionnelle
   */
  description: {
    type: String,
    default: null,
    trim: true,
    description: 'Description du programme'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PÉRIODE DE VALIDITÉ
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Date de début du programme
   */
  dateDebut: {
    type: Date,
    required: [true, 'La date de début est requise'],
    description: 'Date de début du programme'
  },

  /**
   * Date de fin du programme
   */
  dateFin: {
    type: Date,
    required: [true, 'La date de fin est requise'],
    description: 'Date de fin du programme'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUT ET WORKFLOW
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Statut du programme
   * - BROUILLON: En cours de création, modifiable
   * - VALIDE: Vérifié, prêt à être activé
   * - ACTIF: Programme officiel en vigueur
   * - SUSPENDU: Temporairement désactivé
   * - TERMINE: Programme passé/archivé
   */
  statut: {
    type: String,
    enum: ['BROUILLON', 'VALIDE', 'ACTIF', 'SUSPENDU', 'TERMINE'],
    default: 'BROUILLON',
    description: 'Statut du programme'
  },

  /**
   * Indique si le programme est actuellement actif
   */
  actif: {
    type: Boolean,
    default: false,
    description: 'Programme actuellement actif'
  },

  /**
   * Informations de validation
   */
  validation: {
    valide: {
      type: Boolean,
      default: false
    },
    validePar: {
      type: Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    },
    dateValidation: {
      type: Date,
      default: null
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES (calculées)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Nombre total de vols dans le programme
   * Mis à jour automatiquement lors de l'ajout/suppression de vols
   */
  nombreVols: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Nombre de vols dans le programme'
  },

  /**
   * Liste des compagnies présentes dans le programme
   * Mis à jour automatiquement
   */
  compagnies: {
    type: [String],
    default: [],
    description: 'Liste des codes compagnies (ex: [ET, AF, TK])'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTADONNÉES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Remarques/notes sur le programme
   */
  remarques: {
    type: String,
    default: null,
    trim: true,
    description: 'Remarques générales sur le programme'
  },

  /**
   * Créateur du programme
   */
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },

  /**
   * Dernier modificateur
   */
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  }

}, {
  timestamps: true,
  collection: 'programmesvol'
});

// ══════════════════════════════════════════════════════════════════════════
// INDEX
// ══════════════════════════════════════════════════════════════════════════

// Index unique sur le nom
programmeVolSchema.index({ nom: 1 }, { unique: true });

// Index par statut et actif
programmeVolSchema.index({ statut: 1, actif: 1 });

// Index par période
programmeVolSchema.index({ dateDebut: 1, dateFin: 1 });

// ══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Durée du programme en jours
 */
programmeVolSchema.virtual('dureeJours').get(function() {
  if (!this.dateDebut || !this.dateFin) return 0;
  const diff = this.dateFin - this.dateDebut;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Indique si le programme est en cours (date actuelle dans la période)
 */
programmeVolSchema.virtual('enCours').get(function() {
  const now = new Date();
  return now >= this.dateDebut && now <= this.dateFin;
});

/**
 * Indique si le programme est terminé (date actuelle après la fin)
 */
programmeVolSchema.virtual('estTermine').get(function() {
  return new Date() > this.dateFin;
});

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si le programme peut être modifié
 */
programmeVolSchema.methods.peutEtreModifie = function() {
  // On peut modifier si pas actif ou si en brouillon
  return this.statut === 'BROUILLON' || !this.actif;
};

/**
 * Vérifie si le programme peut être validé
 */
programmeVolSchema.methods.peutEtreValide = function() {
  return this.statut === 'BROUILLON' && this.nombreVols > 0;
};

/**
 * Vérifie si le programme peut être activé
 */
programmeVolSchema.methods.peutEtreActive = function() {
  return this.validation.valide && !this.actif && !this.estTermine;
};

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Trouve le programme actif actuel
 */
programmeVolSchema.statics.getProgrammeActif = async function() {
  return this.findOne({ actif: true, statut: 'ACTIF' });
};

/**
 * Trouve les programmes en cours (dans la période actuelle)
 */
programmeVolSchema.statics.getProgrammesEnCours = async function() {
  const now = new Date();
  return this.find({
    dateDebut: { $lte: now },
    dateFin: { $gte: now }
  }).sort({ dateDebut: -1 });
};

// ══════════════════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ══════════════════════════════════════════════════════════════════════════

programmeVolSchema.pre('save', function(next) {
  // Validation: dateFin doit être après dateDebut
  if (this.dateFin <= this.dateDebut) {
    return next(new Error('La date de fin doit être postérieure à la date de début'));
  }

  // Auto-terminer si la date est passée
  if (this.dateFin < new Date() && this.statut === 'ACTIF') {
    this.statut = 'TERMINE';
    this.actif = false;
  }

  next();
});

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

const ProgrammeVol = mongoose.model('ProgrammeVol', programmeVolSchema);

export default ProgrammeVol;
