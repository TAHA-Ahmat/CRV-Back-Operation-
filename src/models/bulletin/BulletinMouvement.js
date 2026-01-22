import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MODELE BULLETIN DE MOUVEMENT
 *
 * Entite officielle d'exploitation a court terme (3-4 jours).
 * Etablie toutes les semaines, sans exception.
 *
 * HIERARCHIE METIER:
 * Programme de vol (6 mois) → Bulletin de mouvement (3-4 jours) → CRV (reel)
 *
 * ROLE:
 * - Informer toutes les parties prenantes des vols censes operer sur la periode
 * - Est previsionnelle, mais plus proche du reel que le programme
 * - Peut s'ecarter du programme (ajustements, imprevus)
 * - N'EST PAS une preuve d'operation (seul le CRV fait foi)
 *
 * REGLES METIER:
 * - Aucun snapshot du programme n'est stocke dans le bulletin
 * - L'historique est assure par l'archivage PDF dans Google Drive
 * - En cas de contradiction: CRV > Bulletin > Programme
 */

const mouvementBulletinSchema = new Schema({
  /**
   * Reference au vol (optionnel si vol prevu non encore cree)
   */
  vol: {
    type: Schema.Types.ObjectId,
    ref: 'Vol',
    default: null
  },

  /**
   * Numero de vol (toujours renseigne)
   */
  numeroVol: {
    type: String,
    required: [true, 'Le numero de vol est requis'],
    trim: true,
    uppercase: true
  },

  /**
   * Code compagnie (deduit ou saisi)
   */
  codeCompagnie: {
    type: String,
    trim: true,
    uppercase: true
  },

  /**
   * Date du mouvement
   */
  dateMouvement: {
    type: Date,
    required: [true, 'La date du mouvement est requise']
  },

  /**
   * Heures prevues (format Date pour precision)
   */
  heureArriveePrevue: {
    type: Date,
    default: null
  },
  heureDepartPrevue: {
    type: Date,
    default: null
  },

  /**
   * Aeroports
   */
  provenance: {
    type: String,
    trim: true,
    uppercase: true
  },
  destination: {
    type: String,
    trim: true,
    uppercase: true
  },

  /**
   * Type d'avion prevu
   */
  typeAvion: {
    type: String,
    trim: true,
    uppercase: true
  },

  /**
   * Type d'operation (deduit automatiquement)
   * ARRIVEE: uniquement heureArrivee
   * DEPART: uniquement heureDepart
   * TURN_AROUND: les deux
   */
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND', null],
    default: null
  },

  /**
   * Origine du mouvement
   */
  origine: {
    type: String,
    enum: ['PROGRAMME', 'HORS_PROGRAMME', 'AJUSTEMENT'],
    default: 'PROGRAMME'
  },

  /**
   * Si HORS_PROGRAMME, type et raison
   */
  typeHorsProgramme: {
    type: String,
    enum: ['CHARTER', 'MEDICAL', 'TECHNIQUE', 'COMMERCIAL', 'CARGO', 'AUTRE', null],
    default: null
  },
  raisonHorsProgramme: {
    type: String,
    trim: true,
    default: null
  },

  /**
   * Reference au programme d'origine (si PROGRAMME ou AJUSTEMENT)
   */
  programmeVolReference: {
    type: Schema.Types.ObjectId,
    ref: 'ProgrammeVol',
    default: null
  },

  /**
   * Reference au vol programme d'origine
   */
  volProgrammeReference: {
    type: Schema.Types.ObjectId,
    ref: 'VolProgramme',
    default: null
  },

  /**
   * Statut du mouvement dans le bulletin
   */
  statutMouvement: {
    type: String,
    enum: ['PREVU', 'CONFIRME', 'MODIFIE', 'ANNULE'],
    default: 'PREVU'
  },

  /**
   * Remarques specifiques au mouvement
   */
  remarques: {
    type: String,
    trim: true
  },

  /**
   * Ordre d'affichage
   */
  ordre: {
    type: Number,
    default: 0
  }
}, { _id: true });

/**
 * Schema principal du Bulletin de Mouvement
 */
const bulletinMouvementSchema = new Schema({

  // ══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Numero unique du bulletin
   * Format: BM-ESCALE-YYYYMMDD (ex: BM-NIM-20260115)
   */
  numeroBulletin: {
    type: String,
    required: [true, 'Le numero de bulletin est requis'],
    unique: true,
    trim: true,
    uppercase: true
  },

  /**
   * Code IATA de l'escale concernee
   */
  escale: {
    type: String,
    required: [true, 'L\'escale est requise'],
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 4
  },

  /**
   * Titre/libelle du bulletin
   */
  titre: {
    type: String,
    trim: true,
    default: null
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PERIODE COUVERTE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Date de debut de la periode couverte
   */
  dateDebut: {
    type: Date,
    required: [true, 'La date de debut est requise']
  },

  /**
   * Date de fin de la periode couverte
   */
  dateFin: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },

  /**
   * Numero de semaine ISO (pour reference)
   */
  semaine: {
    type: Number,
    min: 1,
    max: 53
  },

  /**
   * Annee de reference
   */
  annee: {
    type: Number,
    required: true
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MOUVEMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Liste des mouvements prevus dans le bulletin
   */
  mouvements: [mouvementBulletinSchema],

  // ══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES (calculees)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Nombre total de mouvements
   */
  nombreMouvements: {
    type: Number,
    default: 0,
    min: 0
  },

  /**
   * Nombre de mouvements du programme
   */
  nombreMouvementsProgramme: {
    type: Number,
    default: 0,
    min: 0
  },

  /**
   * Nombre de mouvements hors programme
   */
  nombreMouvementsHorsProgramme: {
    type: Number,
    default: 0,
    min: 0
  },

  /**
   * Liste des compagnies
   */
  compagnies: {
    type: [String],
    default: []
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUT ET WORKFLOW
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Statut du bulletin
   * - BROUILLON: En preparation, modifiable
   * - PUBLIE: Officiel, diffuse aux parties prenantes
   * - ARCHIVE: Periode passee, historise
   */
  statut: {
    type: String,
    enum: ['BROUILLON', 'PUBLIE', 'ARCHIVE'],
    default: 'BROUILLON'
  },

  /**
   * Date de publication
   */
  datePublication: {
    type: Date,
    default: null
  },

  /**
   * Personne ayant publie
   */
  publiePar: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },

  // ══════════════════════════════════════════════════════════════════════════
  // REFERENCES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Reference au programme vol saisonnier (source principale)
   */
  programmeVolSource: {
    type: Schema.Types.ObjectId,
    ref: 'ProgrammeVol',
    default: null
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARCHIVAGE GOOGLE DRIVE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Informations d'archivage du PDF dans Google Drive
   * L'archivage est la seule source d'historique (pas de snapshot programme)
   */
  archivage: {
    driveFileId: {
      type: String,
      default: null
    },
    driveWebViewLink: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    folderPath: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    },
    version: {
      type: Number,
      default: 1
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // METADONNEES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Remarques generales sur le bulletin
   */
  remarques: {
    type: String,
    trim: true
  },

  /**
   * Createur du bulletin
   */
  creePar: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },

  /**
   * Dernier modificateur
   */
  modifiePar: {
    type: Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },

  /**
   * Date de derniere modification
   */
  derniereModification: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  collection: 'bulletinsmouvements'
});

// ══════════════════════════════════════════════════════════════════════════
// INDEX
// ══════════════════════════════════════════════════════════════════════════

// Index unique sur le numero de bulletin
bulletinMouvementSchema.index({ numeroBulletin: 1 }, { unique: true });

// Index par escale et periode
bulletinMouvementSchema.index({ escale: 1, dateDebut: 1, dateFin: 1 });

// Index par statut
bulletinMouvementSchema.index({ statut: 1 });

// Index par semaine/annee
bulletinMouvementSchema.index({ annee: 1, semaine: 1 });

// Index par programme source
bulletinMouvementSchema.index({ programmeVolSource: 1 });

// ══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Duree de la periode en jours
 */
bulletinMouvementSchema.virtual('dureeJours').get(function() {
  if (!this.dateDebut || !this.dateFin) return 0;
  const diff = this.dateFin - this.dateDebut;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 car inclusif
});

/**
 * Indique si le bulletin couvre la date actuelle
 */
bulletinMouvementSchema.virtual('estEnCours').get(function() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const debut = new Date(this.dateDebut);
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(this.dateFin);
  fin.setHours(23, 59, 59, 999);
  return now >= debut && now <= fin;
});

/**
 * Indique si la periode est passee
 */
bulletinMouvementSchema.virtual('estPasse').get(function() {
  return new Date() > this.dateFin;
});

/**
 * Indique si le bulletin est archive dans Drive
 */
bulletinMouvementSchema.virtual('isArchived').get(function() {
  return !!(this.archivage && this.archivage.driveFileId);
});

/**
 * Libelle de la periode (ex: "15-18 Jan 2026")
 */
bulletinMouvementSchema.virtual('periodeLisible').get(function() {
  if (!this.dateDebut || !this.dateFin) return '';
  const optionsDebut = { day: 'numeric' };
  const optionsFin = { day: 'numeric', month: 'short', year: 'numeric' };
  const debut = this.dateDebut.toLocaleDateString('fr-FR', optionsDebut);
  const fin = this.dateFin.toLocaleDateString('fr-FR', optionsFin);
  return `${debut}-${fin}`;
});

// ══════════════════════════════════════════════════════════════════════════
// METHODES D'INSTANCE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Verifie si le bulletin peut etre modifie
 */
bulletinMouvementSchema.methods.peutEtreModifie = function() {
  return this.statut === 'BROUILLON';
};

/**
 * Verifie si le bulletin peut etre publie
 */
bulletinMouvementSchema.methods.peutEtrePublie = function() {
  return this.statut === 'BROUILLON' && this.mouvements.length > 0;
};

/**
 * Verifie si le bulletin peut etre archive
 */
bulletinMouvementSchema.methods.peutEtreArchive = function() {
  return this.statut === 'PUBLIE';
};

/**
 * Ajoute un mouvement au bulletin
 * @param {Object} mouvement - Donnees du mouvement
 * @returns {Object} Le mouvement ajoute
 */
bulletinMouvementSchema.methods.ajouterMouvement = function(mouvement) {
  if (!this.peutEtreModifie()) {
    throw new Error('Impossible d\'ajouter un mouvement: bulletin non modifiable');
  }

  // Deduire le type d'operation
  if (mouvement.heureArriveePrevue && mouvement.heureDepartPrevue) {
    mouvement.typeOperation = 'TURN_AROUND';
  } else if (mouvement.heureArriveePrevue) {
    mouvement.typeOperation = 'ARRIVEE';
  } else if (mouvement.heureDepartPrevue) {
    mouvement.typeOperation = 'DEPART';
  }

  // Deduire le code compagnie si non fourni
  if (!mouvement.codeCompagnie && mouvement.numeroVol) {
    const match = mouvement.numeroVol.match(/^([A-Z]{2,3})/);
    if (match) {
      mouvement.codeCompagnie = match[1];
    }
  }

  // Ordre par defaut
  mouvement.ordre = this.mouvements.length;

  this.mouvements.push(mouvement);
  return this.mouvements[this.mouvements.length - 1];
};

/**
 * Supprime un mouvement du bulletin
 * @param {ObjectId} mouvementId - ID du mouvement
 */
bulletinMouvementSchema.methods.supprimerMouvement = function(mouvementId) {
  if (!this.peutEtreModifie()) {
    throw new Error('Impossible de supprimer un mouvement: bulletin non modifiable');
  }

  const index = this.mouvements.findIndex(m => m._id.equals(mouvementId));
  if (index === -1) {
    throw new Error('Mouvement non trouve');
  }

  this.mouvements.splice(index, 1);
};

/**
 * Publie le bulletin
 * @param {ObjectId} userId - ID de l'utilisateur
 */
bulletinMouvementSchema.methods.publier = function(userId) {
  if (!this.peutEtrePublie()) {
    throw new Error('Impossible de publier: conditions non remplies');
  }

  this.statut = 'PUBLIE';
  this.datePublication = new Date();
  this.publiePar = userId;
};

/**
 * Archive le bulletin
 */
bulletinMouvementSchema.methods.archiver = function() {
  if (!this.peutEtreArchive()) {
    throw new Error('Impossible d\'archiver: bulletin non publie');
  }

  this.statut = 'ARCHIVE';
};

/**
 * Met a jour les informations d'archivage Drive
 * @param {Object} archiveResult - Resultat de l'archivage
 * @param {ObjectId} userId - ID de l'utilisateur
 */
bulletinMouvementSchema.methods.updateArchivage = async function(archiveResult, userId) {
  const currentVersion = this.archivage?.version || 0;

  this.archivage = {
    driveFileId: archiveResult.fileId,
    driveWebViewLink: archiveResult.webViewLink,
    filename: archiveResult.filename,
    folderPath: archiveResult.folderPath,
    size: archiveResult.size,
    archivedAt: new Date(),
    archivedBy: userId,
    version: currentVersion + 1
  };

  return this.save();
};

/**
 * Retourne les mouvements pour un jour donne
 * @param {Date} date - Date recherchee
 * @returns {Array} Mouvements du jour
 */
bulletinMouvementSchema.methods.getMouvementsParJour = function(date) {
  const jour = new Date(date);
  jour.setHours(0, 0, 0, 0);
  const lendemain = new Date(jour);
  lendemain.setDate(lendemain.getDate() + 1);

  return this.mouvements.filter(m => {
    const dateMvt = new Date(m.dateMouvement);
    return dateMvt >= jour && dateMvt < lendemain;
  }).sort((a, b) => {
    // Trier par heure d'arrivee puis depart
    const heureA = a.heureArriveePrevue || a.heureDepartPrevue;
    const heureB = b.heureArriveePrevue || b.heureDepartPrevue;
    return heureA - heureB;
  });
};

// ══════════════════════════════════════════════════════════════════════════
// METHODES STATIQUES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Genere un numero de bulletin unique
 * @param {String} escale - Code IATA escale
 * @param {Date} dateDebut - Date de debut
 * @returns {String} Numero de bulletin
 */
bulletinMouvementSchema.statics.genererNumeroBulletin = function(escale, dateDebut) {
  const date = new Date(dateDebut);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `BM-${escale.toUpperCase()}-${yyyy}${mm}${dd}`;
};

/**
 * Trouve le bulletin en cours pour une escale
 * @param {String} escale - Code IATA escale
 * @returns {Document} Bulletin en cours
 */
bulletinMouvementSchema.statics.getBulletinEnCours = async function(escale) {
  const now = new Date();
  return this.findOne({
    escale: escale.toUpperCase(),
    dateDebut: { $lte: now },
    dateFin: { $gte: now },
    statut: { $in: ['BROUILLON', 'PUBLIE'] }
  }).sort({ dateDebut: -1 });
};

/**
 * Trouve les bulletins d'une semaine donnee
 * @param {Number} annee - Annee
 * @param {Number} semaine - Numero de semaine
 * @returns {Array} Bulletins
 */
bulletinMouvementSchema.statics.getBulletinsParSemaine = async function(annee, semaine) {
  return this.find({ annee, semaine }).sort({ escale: 1 });
};

/**
 * Calcule le numero de semaine ISO
 * @param {Date} date - Date
 * @returns {Number} Numero de semaine
 */
bulletinMouvementSchema.statics.getNumeroSemaine = function(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// ══════════════════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ══════════════════════════════════════════════════════════════════════════

bulletinMouvementSchema.pre('save', function(next) {
  // Validation: dateFin doit etre >= dateDebut
  if (this.dateFin < this.dateDebut) {
    return next(new Error('La date de fin doit etre egale ou posterieure a la date de debut'));
  }

  // Calculer semaine et annee si non definis
  if (!this.semaine) {
    this.semaine = this.constructor.getNumeroSemaine(this.dateDebut);
  }
  if (!this.annee) {
    this.annee = this.dateDebut.getFullYear();
  }

  // Mettre a jour les statistiques
  this.nombreMouvements = this.mouvements.length;
  this.nombreMouvementsProgramme = this.mouvements.filter(m => m.origine === 'PROGRAMME').length;
  this.nombreMouvementsHorsProgramme = this.mouvements.filter(m => m.origine === 'HORS_PROGRAMME').length;

  // Extraire les compagnies uniques
  const compagniesSet = new Set();
  this.mouvements.forEach(m => {
    if (m.codeCompagnie) {
      compagniesSet.add(m.codeCompagnie);
    }
  });
  this.compagnies = Array.from(compagniesSet).sort();

  // Auto-archiver si periode passee et publie
  if (this.estPasse && this.statut === 'PUBLIE') {
    this.statut = 'ARCHIVE';
  }

  // Mettre a jour la date de modification
  this.derniereModification = new Date();

  // Log structure
  console.log('[BULLETIN][HOOK][PRE_SAVE]', {
    bulletinId: this._id,
    numeroBulletin: this.numeroBulletin,
    escale: this.escale,
    statut: this.statut,
    nombreMouvements: this.nombreMouvements,
    timestamp: new Date().toISOString()
  });

  next();
});

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

const BulletinMouvement = mongoose.model('BulletinMouvement', bulletinMouvementSchema);

export default BulletinMouvement;
