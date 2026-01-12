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
 *
 * EXTENSION 1.1 (2026-01-12) - Enrichissement standard programme de vol
 * NON-RÉGRESSION: Tous les nouveaux champs sont OPTIONNELS avec valeurs par défaut.
 * - Ajout categorieVol (PASSAGER, CARGO, DOMESTIQUE)
 * - Ajout codeCompagnie (code IATA 2 lettres)
 * - Ajout route (provenance, destination, escales)
 * - Ajout numeroVolRetour, configurationSieges, nightStop
 * - Documents existants continuent de fonctionner sans modification
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

  // ========== EXTENSION 1.1 - CATÉGORISATION ==========
  // NON-RÉGRESSION: Tous ces champs sont OPTIONNELS avec valeurs par défaut

  categorieVol: {
    type: String,
    enum: ['PASSAGER', 'CARGO', 'DOMESTIQUE'],
    default: 'PASSAGER',
    description: 'Catégorie du vol (passager commercial, cargo/fret, domestique/intérieur)'
  },

  codeCompagnie: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    maxlength: 3,
    description: 'Code IATA de la compagnie (2-3 lettres, ex: ET, AF, TK)'
  },

  // ========== EXTENSION 1.1 - ROUTE ==========
  route: {
    provenance: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      description: 'Code IATA aéroport d\'origine (ex: ADD, CDG, IST)'
    },
    destination: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      description: 'Code IATA aéroport de destination (ex: ADD, CDG, IST)'
    },
    escales: {
      type: [String],
      default: [],
      description: 'Codes IATA des escales intermédiaires (ex: ["NIM", "NSI"])'
    }
  },

  nightStop: {
    type: Boolean,
    default: false,
    description: 'Indique si l\'avion reste stationné la nuit sur l\'escale'
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

    // EXTENSION 1.1 - Numéro vol retour pour turnaround
    numeroVolRetour: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      description: 'Numéro du vol retour pour turnaround (ex: "ET938" pour "ET939")'
    },

    avionType: {
      type: String,
      default: null,
      trim: true,
      description: 'Type d\'avion prévu (ex: "Boeing 737-800", "B737-800")'
    },

    // EXTENSION 1.1 - Configuration sièges
    configurationSieges: {
      type: String,
      default: null,
      trim: true,
      description: 'Code configuration sièges (ex: "16C138Y", "CARGO", "TBN")'
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

// ========== EXTENSION 1.1 - NOUVEAUX INDEX ==========
// Index pour filtrer par catégorie de vol
programmeVolSaisonnierSchema.index({ categorieVol: 1 });

// Index pour rechercher par route (provenance/destination)
programmeVolSaisonnierSchema.index({ 'route.provenance': 1 });
programmeVolSaisonnierSchema.index({ 'route.destination': 1 });

// Index pour rechercher par numéro de vol
programmeVolSaisonnierSchema.index({ 'detailsVol.numeroVolBase': 1 });

// Index composé pour recherche avancée
programmeVolSaisonnierSchema.index({ categorieVol: 1, actif: 1, statut: 1 });

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
 * EXTENSION 1.1: Enrichi avec les nouveaux champs (rétrocompatible)
 */
programmeVolSaisonnierSchema.methods.toSimpleObject = function() {
  return {
    id: this._id,
    nomProgramme: this.nomProgramme,
    compagnieAerienne: this.compagnieAerienne,
    codeCompagnie: this.codeCompagnie || null,
    numeroVolBase: this.detailsVol.numeroVolBase,
    numeroVolRetour: this.detailsVol.numeroVolRetour || null,
    typeOperation: this.typeOperation,
    categorieVol: this.categorieVol || 'PASSAGER',
    statut: this.statut,
    actif: this.actif,
    periode: {
      debut: this.recurrence.dateDebut,
      fin: this.recurrence.dateFin
    },
    route: {
      provenance: this.route?.provenance || null,
      destination: this.route?.destination || null,
      escales: this.route?.escales || []
    },
    horaires: {
      arrivee: this.detailsVol.horairePrevu?.heureArrivee || null,
      depart: this.detailsVol.horairePrevu?.heureDepart || null
    },
    nightStop: this.nightStop || false
  };
};

// ========== MÉTHODES STATIQUES ==========

/**
 * Trouve tous les programmes actifs pour une compagnie
 * EXTENSION 1.1: Ajout filtre optionnel categorieVol (rétrocompatible)
 * @param {String} compagnieAerienne - Nom ou code de la compagnie
 * @param {String} categorieVol - Optionnel: PASSAGER, CARGO, DOMESTIQUE
 */
programmeVolSaisonnierSchema.statics.trouverProgrammesActifs = function(compagnieAerienne, categorieVol = null) {
  const query = {
    compagnieAerienne: compagnieAerienne.toUpperCase(),
    actif: true,
    statut: 'ACTIF'
  };

  // EXTENSION 1.1: Filtre optionnel par catégorie
  if (categorieVol) {
    query.categorieVol = categorieVol.toUpperCase();
  }

  return this.find(query);
};

/**
 * Trouve les programmes valides pour une date donnée
 * EXTENSION 1.1: Ajout filtre optionnel categorieVol (rétrocompatible)
 * @param {Date} date - Date à vérifier
 * @param {String} categorieVol - Optionnel: PASSAGER, CARGO, DOMESTIQUE
 */
programmeVolSaisonnierSchema.statics.trouverProgrammesPourDate = function(date, categorieVol = null) {
  const query = {
    actif: true,
    statut: 'ACTIF',
    'recurrence.dateDebut': { $lte: date },
    'recurrence.dateFin': { $gte: date }
  };

  // EXTENSION 1.1: Filtre optionnel par catégorie
  if (categorieVol) {
    query.categorieVol = categorieVol.toUpperCase();
  }

  return this.find(query);
};

// ========== EXTENSION 1.1 - NOUVELLES MÉTHODES STATIQUES ==========

/**
 * Trouve les programmes par route (provenance et/ou destination)
 * @param {Object} options - { provenance, destination, categorieVol }
 */
programmeVolSaisonnierSchema.statics.trouverParRoute = function(options = {}) {
  const query = {
    actif: true,
    statut: 'ACTIF'
  };

  if (options.provenance) {
    query['route.provenance'] = options.provenance.toUpperCase();
  }

  if (options.destination) {
    query['route.destination'] = options.destination.toUpperCase();
  }

  if (options.categorieVol) {
    query.categorieVol = options.categorieVol.toUpperCase();
  }

  return this.find(query);
};

/**
 * Calcule les statistiques par catégorie de vol
 */
programmeVolSaisonnierSchema.statics.obtenirStatistiquesParCategorie = async function() {
  return this.aggregate([
    { $match: { actif: true, statut: 'ACTIF' } },
    {
      $group: {
        _id: '$categorieVol',
        count: { $sum: 1 },
        compagnies: { $addToSet: '$compagnieAerienne' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Calcule les statistiques par jour de la semaine
 */
programmeVolSaisonnierSchema.statics.obtenirStatistiquesParJour = async function() {
  const joursNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const programmes = await this.find({ actif: true, statut: 'ACTIF' });

  const stats = {};
  joursNom.forEach((jour, index) => {
    stats[jour] = { total: 0, passagers: 0, cargo: 0, domestiques: 0 };
  });

  programmes.forEach(prog => {
    const jours = prog.recurrence.frequence === 'QUOTIDIEN'
      ? [0, 1, 2, 3, 4, 5, 6]
      : prog.recurrence.joursSemaine;

    jours.forEach(jour => {
      const nomJour = joursNom[jour];
      stats[nomJour].total++;

      const cat = (prog.categorieVol || 'PASSAGER').toUpperCase();
      if (cat === 'PASSAGER') stats[nomJour].passagers++;
      else if (cat === 'CARGO') stats[nomJour].cargo++;
      else if (cat === 'DOMESTIQUE') stats[nomJour].domestiques++;
    });
  });

  return stats;
};

const ProgrammeVolSaisonnier = mongoose.model('ProgrammeVolSaisonnier', programmeVolSaisonnierSchema);

export default ProgrammeVolSaisonnier;
