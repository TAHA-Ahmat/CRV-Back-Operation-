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
  // PIVOT D'UNICITÉ : 1 avion + 1 escale + 1 date = 1 CRV
  // L'escale est le lieu où se déroulent les opérations au sol
  // Distinct de l'origine (provenance) et de la destination
  escale: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 4
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
  // SUPPRIMÉ : confirmationAucunEvenement, confirmationAucuneObservation, confirmationAucuneCharge
  // Règle métier : on documente ce qui s'est passé, jamais ce qui ne s'est pas passé
  // L'absence de données = opération non réalisée (cahier des charges §4)
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    },
    version: {
      type: Number,
      default: 1
    }
  },
  // Personnel affecté au vol (embedded pour saisie ad-hoc)
  personnelAffecte: [{
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
    fonction: {
      type: String,
      required: true,
      enum: [
        'CHEF_ESCALE',
        'AGENT_TRAFIC',
        'AGENT_PISTE',
        'AGENT_PASSAGE',
        'MANUTENTIONNAIRE',
        'CHAUFFEUR',
        'AGENT_SECURITE',
        'TECHNICIEN',
        'SUPERVISEUR',
        'COORDINATEUR',
        'AUTRE'
      ]
    },
    matricule: {
      type: String,
      trim: true
    },
    telephone: {
      type: String,
      trim: true
    },
    remarques: {
      type: String,
      trim: true
    }
  }],

  // MATÉRIEL UTILISÉ — TRAÇABILITÉ EN FONCTIONNEMENT NORMAL (Cahier des charges §7)
  // Règle métier : les équipements doivent être tracés même sans incident
  // Permet : maintenance préventive, facturation, statistiques d'utilisation
  materielUtilise: [{
    // Type d'équipement (catégorie)
    typeEngin: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'TRACTEUR_PUSHBACK',
        'PASSERELLE',
        'TAPIS_BAGAGES',
        'GPU',                    // Ground Power Unit
        'ASU',                    // Air Start Unit
        'ESCALIER',
        'TRANSBORDEUR',
        'CAMION_AVITAILLEMENT',
        'CAMION_VIDANGE',
        'CAMION_EAU',
        'ELEVATEUR',
        'CHARIOT_BAGAGES',
        'CONTENEUR_ULD',
        'DOLLY',
        'AUTRE'
      ]
    },
    // Identifiant unique de l'engin (numéro, immatriculation)
    identifiant: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    // Période d'utilisation
    heureDebutUtilisation: {
      type: Date
    },
    heureFinUtilisation: {
      type: Date
    },
    // Opérateur responsable de l'engin
    operateur: {
      type: String,
      trim: true
    },
    // Phase CRV concernée (optionnel)
    phaseConcernee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChronologiePhase'
    },
    // Remarques (état, anomalie constatée, etc.)
    remarques: {
      type: String,
      trim: true
    }
  }],

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
  },

  // ========== EXTENSION 7 - Lien avec Bulletin de Mouvement ==========
  // NON-REGRESSION: Champ OPTIONNEL avec valeur par defaut null

  /**
   * Reference au bulletin de mouvement
   * Permet de tracer quel bulletin annonçait le vol documente par ce CRV
   * HIERARCHIE: Programme → Bulletin → CRV
   * Le CRV est la seule preuve qu'un vol a reellement opere
   */
  bulletinMouvementReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulletinMouvement',
    default: null,
    description: 'Reference au bulletin de mouvement (tracabilite previsionnel → reel)'
  }

  // FIN EXTENSION 7
}, {
  timestamps: true
});

// Index unique sur numeroCRV déjà créé via unique: true
// crvSchema.index({ numeroCRV: 1 }); // REMOVED - duplicate
crvSchema.index({ vol: 1 });
crvSchema.index({ statut: 1 });
crvSchema.index({ dateCreation: -1 });
crvSchema.index({ escale: 1 });

// INDEX COMPOSITE D'UNICITÉ MÉTIER
// Garantit : 1 avion + 1 escale + 1 date = 1 CRV
// Note : la date opérationnelle est portée par le Vol référencé
// L'unicité complète est assurée par vol (qui contient avion + dateVol) + escale
crvSchema.index({ vol: 1, escale: 1 }, { unique: true });

crvSchema.pre('save', function(next) {
  const timestamp = new Date().toISOString();
  const isNew = this.isNew;
  const modifiedPaths = this.modifiedPaths();

  console.log('[CRV][HOOK][PRE_SAVE]', {
    crvId: this._id,
    userId: this.modifiePar || this.creePar || null,
    role: null,
    input: {
      isNew,
      modifiedPaths,
      numeroCRV: this.numeroCRV,
      statut: this.statut
    },
    decision: 'SAVE',
    reason: isNew ? 'Création CRV' : 'Modification CRV',
    output: null,
    timestamp
  });

  this.derniereModification = new Date();
  next();
});

export default mongoose.model('CRV', crvSchema);
