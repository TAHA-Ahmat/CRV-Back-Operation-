import mongoose from 'mongoose';

const avionSchema = new mongoose.Schema({
  immatriculation: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  typeAvion: {
    type: String,
    required: true,
    trim: true
  },
  compagnie: {
    type: String,
    required: true,
    trim: true
  },
  capacitePassagers: {
    type: Number,
    required: true,
    min: 0
  },
  capaciteFret: {
    type: Number,
    required: true,
    min: 0
  },
  statut: {
    type: String,
    enum: ['ACTIF', 'MAINTENANCE', 'HORS_SERVICE'],
    default: 'ACTIF'
  },

  // ========== EXTENSION 3 - Version et configuration avion ==========
  // NON-RÉGRESSION: Tous les champs ci-dessous sont OPTIONNELS avec valeurs par défaut
  // Les avions existants auront automatiquement version=null et configuration={}

  version: {
    type: String,
    default: null,
    trim: true,
    description: 'Version de la configuration de l\'avion (ex: "1.0", "2.3")'
  },

  configuration: {
    sieges: {
      classeAffaires: {
        nombre: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Nombre de sièges en classe affaires'
        },
        disposition: {
          type: String,
          default: null,
          description: 'Disposition des sièges (ex: "2-2-2", "1-2-1")'
        }
      },
      classeEconomique: {
        nombre: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Nombre de sièges en classe économique'
        },
        disposition: {
          type: String,
          default: null,
          description: 'Disposition des sièges (ex: "3-3-3", "3-4-3")'
        }
      },
      classePremiere: {
        nombre: {
          type: Number,
          default: 0,
          min: 0,
          description: 'Nombre de sièges en première classe'
        },
        disposition: {
          type: String,
          default: null,
          description: 'Disposition des sièges (ex: "1-1-1", "1-2-1")'
        }
      }
    },

    equipements: {
      wifi: {
        type: Boolean,
        default: false,
        description: 'Disponibilité du WiFi à bord'
      },
      divertissement: {
        type: Boolean,
        default: false,
        description: 'Système de divertissement à bord'
      },
      priseElectrique: {
        type: Boolean,
        default: false,
        description: 'Prises électriques disponibles'
      },
      equipementsSpeciaux: {
        type: [String],
        default: [],
        description: 'Liste des équipements spéciaux (ex: "Fauteuil roulant", "Défibrillateur")'
      }
    },

    moteurs: {
      type: {
        type: String,
        default: null,
        description: 'Type de moteur (ex: "CFM56-7B", "Trent 1000")'
      },
      nombre: {
        type: Number,
        default: null,
        min: 1,
        description: 'Nombre de moteurs'
      }
    },

    caracteristiquesTechniques: {
      poidsMaxDecollage: {
        type: Number,
        default: null,
        min: 0,
        description: 'Poids maximum au décollage (en kg)'
      },
      autonomie: {
        type: Number,
        default: null,
        min: 0,
        description: 'Autonomie maximale (en km)'
      },
      vitesseCroisiere: {
        type: Number,
        default: null,
        min: 0,
        description: 'Vitesse de croisière (en km/h)'
      },
      altitudeMax: {
        type: Number,
        default: null,
        min: 0,
        description: 'Altitude maximale (en mètres)'
      }
    },

    remarques: {
      type: String,
      default: null,
      trim: true,
      description: 'Remarques additionnelles sur la configuration'
    }
  },

  historiqueVersions: {
    type: [{
      version: {
        type: String,
        required: true,
        description: 'Numéro de version'
      },
      dateChangement: {
        type: Date,
        required: true,
        default: Date.now,
        description: 'Date du changement de version'
      },
      modifiePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        description: 'Utilisateur ayant effectué le changement'
      },
      modifications: {
        type: String,
        required: true,
        description: 'Description des modifications apportées'
      },
      configurationSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        description: 'Snapshot de la configuration à ce moment'
      }
    }],
    default: [],
    description: 'Historique des versions et modifications de configuration'
  },

  derniereRevision: {
    date: {
      type: Date,
      default: null,
      description: 'Date de la dernière révision technique'
    },
    type: {
      type: String,
      enum: ['MINEURE', 'MAJEURE', 'COMPLETE', null],
      default: null,
      description: 'Type de révision'
    },
    prochaineDatePrevue: {
      type: Date,
      default: null,
      description: 'Date prévue de la prochaine révision'
    }
  }

  // FIN EXTENSION 3 - Aucune modification des champs existants ci-dessus
}, {
  timestamps: true
});

// Index unique sur immatriculation déjà créé via unique: true
// avionSchema.index({ immatriculation: 1 }); // REMOVED - duplicate
avionSchema.index({ compagnie: 1 });

export default mongoose.model('Avion', avionSchema);
