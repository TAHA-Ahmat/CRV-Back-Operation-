import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MODÈLE VOL PROGRAMME (Vols d'un programme)
 *
 * Représente un vol récurrent dans un programme de vol saisonnier.
 * Chaque vol est lié à un ProgrammeVol parent.
 *
 * STRUCTURE DU PDF:
 * | JOURS | N° VOL | Type d'avion | VERSION | PROVENANCE | Arrivée | DESTINATION | Départ | OBSERVATIONS |
 *
 * EXEMPLES:
 * - ET939: Lun-Mer-Ven, B737-800, 16C138Y, ADD, 12:10, ADD, 14:05
 * - AF946: Quotidien, A350, 34C280Y, CDG, 09:05, CDG, 10:35
 * - CH110/111: Lun-Mar-Mer-Jeu-Ven, E145, TBN, AMJ-AEH, -, AEH-AMJ, -
 */

const volProgrammeSchema = new Schema({

  // ══════════════════════════════════════════════════════════════════════════
  // RÉFÉRENCE AU PROGRAMME PARENT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Programme parent auquel ce vol appartient
   */
  programme: {
    type: Schema.Types.ObjectId,
    ref: 'ProgrammeVol',
    required: [true, 'Le programme parent est requis'],
    description: 'Référence au programme de vol parent'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // JOURS DE LA SEMAINE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Jours de la semaine où le vol opère
   * 0 = Dimanche, 1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi, 6 = Samedi
   */
  joursSemaine: {
    type: [Number],
    required: [true, 'Au moins un jour de la semaine est requis'],
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(day => day >= 0 && day <= 6);
      },
      message: 'Les jours doivent être entre 0 (Dimanche) et 6 (Samedi)'
    },
    description: 'Jours d\'opération (0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // N° VOL
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Numéro de vol (tel qu'affiché)
   * Ex: "ET939", "CH110/111", "AF946"
   */
  numeroVol: {
    type: String,
    required: [true, 'Le numéro de vol est requis'],
    uppercase: true,
    trim: true,
    description: 'Numéro de vol (ex: ET939, CH110/111)'
  },

  /**
   * Code compagnie (2-3 lettres, déduit du numéro de vol)
   * Ex: "ET", "AF", "CH"
   */
  codeCompagnie: {
    type: String,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 3,
    description: 'Code IATA compagnie (ex: ET, AF, CH)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TYPE D'AVION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Type d'avion
   * Ex: "B737-800", "A350", "E145", "B737F/B77F/B763F"
   */
  typeAvion: {
    type: String,
    default: null,
    trim: true,
    description: 'Type d\'avion (ex: B737-800, A350)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VERSION (Configuration sièges)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Configuration des sièges
   * Ex: "16C138Y" (16 Business + 138 Economy), "JY159", "TBN", "CARGO"
   */
  version: {
    type: String,
    default: 'TBN',
    uppercase: true,
    trim: true,
    description: 'Configuration sièges (ex: 16C138Y, JY159, TBN, CARGO)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROVENANCE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Provenance (aéroport d'origine ou route)
   * Ex: "ADD", "CDG", "IST-NIM", "AMJ-AEH", "-"
   */
  provenance: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Provenance (ex: ADD, IST-NIM, -)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEURE ARRIVÉE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Heure d'arrivée prévue (format HH:MM)
   * Ex: "12:10", "09:05", null si départ uniquement
   */
  heureArrivee: {
    type: String,
    default: null,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format invalide, utilisez HH:MM'],
    description: 'Heure d\'arrivée (format HH:MM)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESTINATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Destination (aéroport de destination ou route)
   * Ex: "ADD", "CDG", "NSI-CDG", "ADD(ET938)", "-"
   */
  destination: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Destination (ex: ADD, NSI-CDG, -)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEURE DÉPART
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Heure de départ prévue (format HH:MM)
   * Ex: "14:05", "10:35", null si arrivée uniquement
   */
  heureDepart: {
    type: String,
    default: null,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format invalide, utilisez HH:MM'],
    description: 'Heure de départ (format HH:MM)'
  },

  /**
   * Indique si le départ est le jour suivant (J+1)
   */
  departLendemain: {
    type: Boolean,
    default: false,
    description: 'True si le départ est le lendemain (J+1)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OBSERVATIONS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Observations/remarques
   * Ex: "Royal Airways", "Du 27 oct. au 28 Nov. 2025", "① NIGHT STOP"
   */
  observations: {
    type: String,
    default: null,
    trim: true,
    description: 'Observations (ex: Royal Airways, NIGHT STOP)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHAMPS ADDITIONNELS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Catégorie de vol (pour filtrage/statistiques)
   */
  categorieVol: {
    type: String,
    enum: ['INTERNATIONAL', 'REGIONAL', 'DOMESTIQUE', 'CARGO'],
    default: 'INTERNATIONAL',
    description: 'Catégorie du vol'
  },

  /**
   * Type d'opération
   */
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'TRANSIT'],
    default: 'TURN_AROUND',
    description: 'Type d\'opération'
  },

  /**
   * Période spécifique (si différente du programme parent)
   * Utilisé pour les vols avec dates particulières
   */
  periodeSpecifique: {
    dateDebut: {
      type: Date,
      default: null
    },
    dateFin: {
      type: Date,
      default: null
    }
  },

  /**
   * Ordre d'affichage dans la liste
   */
  ordre: {
    type: Number,
    default: 0,
    description: 'Ordre d\'affichage'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTADONNÉES
  // ══════════════════════════════════════════════════════════════════════════

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  }

}, {
  timestamps: true,
  collection: 'volsprogramme'
});

// ══════════════════════════════════════════════════════════════════════════
// INDEX
// ══════════════════════════════════════════════════════════════════════════

// Index par programme (pour récupérer tous les vols d'un programme)
volProgrammeSchema.index({ programme: 1 });

// Index par programme et ordre (pour affichage ordonné)
volProgrammeSchema.index({ programme: 1, ordre: 1 });

// Index par numéro de vol
volProgrammeSchema.index({ numeroVol: 1 });

// Index par code compagnie
volProgrammeSchema.index({ codeCompagnie: 1 });

// Index par jours de la semaine
volProgrammeSchema.index({ joursSemaine: 1 });

// Index composé pour recherche
volProgrammeSchema.index({ programme: 1, joursSemaine: 1, heureArrivee: 1 });

// ══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retourne les jours en format texte
 */
volProgrammeSchema.virtual('joursTexte').get(function() {
  const joursNom = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Si tous les jours
  if (this.joursSemaine.length === 7) {
    return 'Quotidien';
  }

  return this.joursSemaine.sort((a, b) => a - b).map(j => joursNom[j]).join('-');
});

/**
 * Indique si c'est un vol quotidien
 */
volProgrammeSchema.virtual('estQuotidien').get(function() {
  return this.joursSemaine.length === 7;
});

/**
 * Format d'affichage de l'heure d'arrivée (HHhMM)
 */
volProgrammeSchema.virtual('arriveeFormatee').get(function() {
  if (!this.heureArrivee) return '-';
  return this.heureArrivee.replace(':', 'H');
});

/**
 * Format d'affichage de l'heure de départ (HHhMM)
 */
volProgrammeSchema.virtual('departFormate').get(function() {
  if (!this.heureDepart) return '-';
  const suffix = this.departLendemain ? ' (J+1)' : '';
  return this.heureDepart.replace(':', 'H') + suffix;
});

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si le vol opère un jour donné (0-6)
 */
volProgrammeSchema.methods.opereLeJour = function(jour) {
  return this.joursSemaine.includes(jour);
};

/**
 * Génère la ligne pour le PDF
 */
volProgrammeSchema.methods.toLignePDF = function() {
  return {
    jours: this.joursTexte,
    numeroVol: this.numeroVol,
    typeAvion: this.typeAvion || '-',
    version: this.version || 'TBN',
    provenance: this.provenance || '-',
    arrivee: this.arriveeFormatee,
    destination: this.destination || '-',
    depart: this.departFormate,
    observations: this.observations || ''
  };
};

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Trouve tous les vols d'un programme
 */
volProgrammeSchema.statics.getVolsParProgramme = async function(programmeId) {
  return this.find({ programme: programmeId })
    .sort({ ordre: 1, heureArrivee: 1, heureDepart: 1 });
};

/**
 * Trouve les vols d'un programme pour un jour donné
 */
volProgrammeSchema.statics.getVolsParJour = async function(programmeId, jour) {
  return this.find({
    programme: programmeId,
    joursSemaine: jour
  }).sort({ heureArrivee: 1, heureDepart: 1 });
};

/**
 * Compte les vols par catégorie pour un programme
 */
volProgrammeSchema.statics.getStatistiquesParCategorie = async function(programmeId) {
  return this.aggregate([
    { $match: { programme: new mongoose.Types.ObjectId(programmeId) } },
    {
      $group: {
        _id: '$categorieVol',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Liste les compagnies d'un programme
 */
volProgrammeSchema.statics.getCompagnies = async function(programmeId) {
  const result = await this.distinct('codeCompagnie', { programme: programmeId });
  return result.filter(c => c); // Filtrer les null
};

/**
 * Parse le code compagnie depuis un numéro de vol
 */
volProgrammeSchema.statics.parseCodeCompagnie = function(numeroVol) {
  if (!numeroVol) return null;
  const match = numeroVol.match(/^([A-Z]{2,3})/);
  return match ? match[1] : null;
};

// ══════════════════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ══════════════════════════════════════════════════════════════════════════

volProgrammeSchema.pre('save', async function(next) {
  // Auto-déduire le code compagnie si non fourni
  if (!this.codeCompagnie && this.numeroVol) {
    this.codeCompagnie = this.constructor.parseCodeCompagnie(this.numeroVol);
  }

  // Auto-déduire le type d'opération
  if (!this.typeOperation || this.typeOperation === 'TURN_AROUND') {
    if (this.heureArrivee && this.heureDepart) {
      this.typeOperation = 'TURN_AROUND';
    } else if (this.heureArrivee && !this.heureDepart) {
      this.typeOperation = 'ARRIVEE';
    } else if (!this.heureArrivee && this.heureDepart) {
      this.typeOperation = 'DEPART';
    }
  }

  // Détection cargo
  if (this.typeAvion && this.typeAvion.includes('F')) {
    this.categorieVol = 'CARGO';
  }

  next();
});

// ══════════════════════════════════════════════════════════════════════════
// POST-SAVE HOOKS (Mise à jour du programme parent)
// ══════════════════════════════════════════════════════════════════════════

volProgrammeSchema.post('save', async function(doc) {
  try {
    const ProgrammeVol = mongoose.model('ProgrammeVol');

    // Compter les vols du programme
    const nombreVols = await mongoose.model('VolProgramme').countDocuments({
      programme: doc.programme
    });

    // Liste des compagnies
    const compagnies = await mongoose.model('VolProgramme').getCompagnies(doc.programme);

    // Mettre à jour le programme parent
    await ProgrammeVol.findByIdAndUpdate(doc.programme, {
      nombreVols: nombreVols,
      compagnies: compagnies
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme parent:', error);
  }
});

volProgrammeSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    const ProgrammeVol = mongoose.model('ProgrammeVol');

    const nombreVols = await mongoose.model('VolProgramme').countDocuments({
      programme: doc.programme
    });

    const compagnies = await mongoose.model('VolProgramme').getCompagnies(doc.programme);

    await ProgrammeVol.findByIdAndUpdate(doc.programme, {
      nombreVols: nombreVols,
      compagnies: compagnies
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme parent après suppression:', error);
  }
});

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

const VolProgramme = mongoose.model('VolProgramme', volProgrammeSchema);

export default VolProgramme;
