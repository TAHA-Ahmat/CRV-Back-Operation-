import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * EXTENSION 1 - Programme vol saisonnier
 *
 * Modèle NOUVEAU et INDÉPENDANT pour gérer les programmes de vols récurrents.
 *
 * NON-RÉGRESSION: Ce modèle n'impacte AUCUN modèle existant.
 * - Vol.js reste inchangé
 * - CRV.js reste inchangé
 * - Phase.js reste inchangé
 * - Aucune modification de la logique existante
 *
 * Ce modèle est 100% OPTIONNEL et sert uniquement à la planification des vols futurs.
 */

const programmeVolSaisonnierSchema = new Schema({
  // ========== INFORMATIONS GÉNÉRALES ==========
  nomProgramme: {
    type: String,
    required: true,
    trim: true,
    description: 'Nom descriptif du programme (ex: "Air France Paris-Dakar Hiver 2024")'
  },

  compagnieAerienne: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    description: 'Code IATA ou nom de la compagnie aérienne'
  },

  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND'],
    required: true,
    description: 'Type d\'opération du vol'
  },

  // ========== RÉCURRENCE ==========
  recurrence: {
    frequence: {
      type: String,
      enum: ['QUOTIDIEN', 'HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL'],
      required: true,
      description: 'Fréquence de répétition du vol'
    },

    joursSemaine: {
      type: [Number],
      default: [],
      validate: {
        validator: function(arr) {
          return arr.every(day => day >= 0 && day <= 6);
        },
        message: 'Les jours doivent être entre 0 (Dimanche) et 6 (Samedi)'
      },
      description: '0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi'
    },

    dateDebut: {
      type: Date,
      required: true,
      description: 'Date de début du programme'
    },

    dateFin: {
      type: Date,
      required: true,
      description: 'Date de fin du programme'
    }
  },

  // ========== DÉTAILS DU VOL ==========
  detailsVol: {
    numeroVolBase: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      description: 'Numéro de vol de base (ex: "AF456")'
    },

    avionType: {
      type: String,
      default: null,
      trim: true,
      description: 'Type d\'avion prévu (ex: "Boeing 737-800")'
    },

    horairePrevu: {
      heureArrivee: {
        type: String,
        default: null,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
        description: 'Heure d\'arrivée prévue au format HH:MM'
      },
      heureDepart: {
        type: String,
        default: null,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
        description: 'Heure de départ prévue au format HH:MM'
      }
    },

    capacitePassagers: {
      type: Number,
      default: null,
      min: 0,
      description: 'Capacité passagers prévue'
    },

    capaciteFret: {
      type: Number,
      default: null,
      min: 0,
      description: 'Capacité fret prévue (en kg)'
    }
  },

  // ========== STATUT ET VALIDATION ==========
  statut: {
    type: String,
    enum: ['BROUILLON', 'VALIDE', 'ACTIF', 'SUSPENDU', 'TERMINE'],
    default: 'BROUILLON',
    description: 'Statut du programme saisonnier'
  },

  actif: {
    type: Boolean,
    default: false,
    description: 'Indique si le programme est actuellement actif'
  },

  validation: {
    valide: {
      type: Boolean,
      default: false,
      description: 'Indique si le programme a été validé'
    },
    validePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'Utilisateur ayant validé le programme'
    },
    dateValidation: {
      type: Date,
      default: null,
      description: 'Date de validation du programme'
    }
  },

  // ========== MÉTADONNÉES ==========
  remarques: {
    type: String,
    default: null,
    trim: true,
    description: 'Remarques ou notes sur le programme'
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'Utilisateur ayant créé le programme'
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    description: 'Utilisateur ayant modifié le programme pour la dernière fois'
  }

}, {
  timestamps: true,
  collection: 'programmesvolsaisonniers'
});

// ========== INDEX ==========
// Index pour rechercher les programmes actifs d'une compagnie
programmeVolSaisonnierSchema.index({ compagnieAerienne: 1, actif: 1 });

// Index pour rechercher par période
programmeVolSaisonnierSchema.index({ 'recurrence.dateDebut': 1, 'recurrence.dateFin': 1 });

// Index pour rechercher par statut
programmeVolSaisonnierSchema.index({ statut: 1 });

// ========== MÉTHODES D'INSTANCE ==========

/**
 * Vérifie si le programme est actif pour une date donnée
 */
programmeVolSaisonnierSchema.methods.estActifPourDate = function(date) {
  if (!this.actif) return false;
  if (this.statut !== 'ACTIF') return false;

  const dateCheck = new Date(date);
  return dateCheck >= this.recurrence.dateDebut && dateCheck <= this.recurrence.dateFin;
};

/**
 * Vérifie si le programme s'applique à un jour de la semaine donné
 */
programmeVolSaisonnierSchema.methods.appliqueAuJour = function(date) {
  const jour = new Date(date).getDay();

  if (this.recurrence.frequence === 'QUOTIDIEN') return true;
  if (this.recurrence.frequence === 'HEBDOMADAIRE') {
    return this.recurrence.joursSemaine.includes(jour);
  }

  return false;
};

/**
 * Retourne un objet simple avec les informations essentielles
 */
programmeVolSaisonnierSchema.methods.toSimpleObject = function() {
  return {
    id: this._id,
    nomProgramme: this.nomProgramme,
    compagnieAerienne: this.compagnieAerienne,
    numeroVolBase: this.detailsVol.numeroVolBase,
    typeOperation: this.typeOperation,
    statut: this.statut,
    actif: this.actif,
    periode: {
      debut: this.recurrence.dateDebut,
      fin: this.recurrence.dateFin
    }
  };
};

// ========== MÉTHODES STATIQUES ==========

/**
 * Trouve tous les programmes actifs pour une compagnie
 */
programmeVolSaisonnierSchema.statics.trouverProgrammesActifs = function(compagnieAerienne) {
  return this.find({
    compagnieAerienne: compagnieAerienne.toUpperCase(),
    actif: true,
    statut: 'ACTIF'
  });
};

/**
 * Trouve les programmes valides pour une date donnée
 */
programmeVolSaisonnierSchema.statics.trouverProgrammesPourDate = function(date) {
  return this.find({
    actif: true,
    statut: 'ACTIF',
    'recurrence.dateDebut': { $lte: date },
    'recurrence.dateFin': { $gte: date }
  });
};

const ProgrammeVolSaisonnier = mongoose.model('ProgrammeVolSaisonnier', programmeVolSaisonnierSchema);

export default ProgrammeVolSaisonnier;
