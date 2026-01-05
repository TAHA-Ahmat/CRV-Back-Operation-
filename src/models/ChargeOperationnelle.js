import mongoose from 'mongoose';

const chargeOperationnelleSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  typeCharge: {
    type: String,
    enum: ['PASSAGERS', 'BAGAGES', 'FRET'],
    required: true
  },
  sensOperation: {
    type: String,
    enum: ['EMBARQUEMENT', 'DEBARQUEMENT'],
    required: true
  },
  passagersAdultes: {
    type: Number,
    min: 0,
    default: 0
  },
  passagersEnfants: {
    type: Number,
    min: 0,
    default: 0
  },
  passagersPMR: {
    type: Number,
    min: 0,
    default: 0
  },
  passagersTransit: {
    type: Number,
    min: 0,
    default: 0
  },

  // ========== EXTENSION 4 - Catégories passagers détaillées ==========
  // NON-RÉGRESSION: Tous les champs ci-dessous sont OPTIONNELS avec valeurs par défaut
  // Les charges existantes auront automatiquement toutes ces catégories à 0
  // Les champs passagersAdultes, passagersEnfants, passagersPMR, passagersTransit restent INCHANGÉS

  categoriesPassagersDetaillees: {
    bebes: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Bébés (0-2 ans)'
    },
    enfants: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Enfants (2-12 ans)'
    },
    adolescents: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Adolescents (12-18 ans)'
    },
    adultes: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Adultes (18-65 ans)'
    },
    seniors: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Seniors (65+ ans)'
    },
    pmrFauteuilRoulant: {
      type: Number,
      min: 0,
      default: 0,
      description: 'PMR en fauteuil roulant'
    },
    pmrMarcheAssistee: {
      type: Number,
      min: 0,
      default: 0,
      description: 'PMR avec assistance à la marche'
    },
    pmrNonVoyant: {
      type: Number,
      min: 0,
      default: 0,
      description: 'PMR non-voyant'
    },
    pmrSourd: {
      type: Number,
      min: 0,
      default: 0,
      description: 'PMR sourd'
    },
    transitLocal: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers en transit (correspondance locale)'
    },
    transitInternational: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers en transit (correspondance internationale)'
    },
    vip: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers VIP'
    },
    equipage: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Membres d\'équipage'
    },
    deportes: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Personnes déportées/expulsées (sous escorte)'
    }
  },

  classePassagers: {
    premiere: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers en première classe'
    },
    affaires: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers en classe affaires'
    },
    economique: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers en classe économique'
    }
  },

  besoinsMedicaux: {
    oxygeneBord: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers nécessitant oxygène à bord'
    },
    brancardier: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers sur brancard'
    },
    accompagnementMedical: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Passagers avec accompagnement médical'
    }
  },

  mineurs: {
    mineurNonAccompagne: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Mineurs non accompagnés (UM - Unaccompanied Minor)'
    },
    bebeNonAccompagne: {
      type: Number,
      min: 0,
      default: 0,
      description: 'Bébés voyageant seuls (avec supervision)'
    }
  },

  // Informations complémentaires
  remarquesPassagers: {
    type: String,
    default: null,
    description: 'Remarques additionnelles sur les catégories de passagers'
  },

  utiliseCategoriesDetaillees: {
    type: Boolean,
    default: false,
    description: 'Indique si les catégories détaillées sont utilisées (pour compatibilité)'
  }

  // FIN EXTENSION 4 - Aucune modification des champs existants ci-dessus

  ,
  nombreBagagesSoute: {
    type: Number,
    min: 0,
    default: 0
  },
  poidsBagagesSouteKg: {
    type: Number,
    min: 0,
    default: 0
  },
  nombreBagagesCabine: {
    type: Number,
    min: 0,
    default: 0
  },
  nombreFret: {
    type: Number,
    min: 0,
    default: 0
  },
  poidsFretKg: {
    type: Number,
    min: 0,
    default: 0
  },
  typeFret: {
    type: String,
    enum: ['STANDARD', 'PERISSABLE', 'DANGEREUX', 'ANIMAUX', 'AUTRE']
  },
  remarques: String,

  // ========== EXTENSION 5 - Fret détaillé ==========
  // NON-RÉGRESSION: Tous les champs ci-dessous sont OPTIONNELS avec valeurs par défaut
  // Les champs nombreFret, poidsFretKg, typeFret restent INCHANGÉS

  fretDetaille: {
    categoriesFret: {
      postal: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Nombre de colis postaux'
      },
      courrierExpress: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Nombre de colis courrier express'
      },
      marchandiseGenerale: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Marchandise générale'
      },
      denreesPerissables: {
        nombre: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Nombre de colis de denrées périssables'
        },
        poidsKg: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Poids total en kg'
        },
        temperature: {
          type: String,
          default: null,
          description: 'Température requise (ex: "+2°C à +8°C")'
        },
        chaineduFroid: {
          type: Boolean,
          default: false,
          description: 'Nécessite chaîne du froid'
        }
      },
      animauxVivants: {
        nombre: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Nombre d\'animaux'
        },
        espece: {
          type: String,
          default: null,
          description: 'Espèce animale'
        },
        certificatVeterinaire: {
          type: Boolean,
          default: false,
          description: 'Certificat vétérinaire présent'
        }
      },
      vehicules: {
        nombre: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Nombre de véhicules'
        },
        type: {
          type: String,
          default: null,
          description: 'Type de véhicule'
        }
      },
      equipements: {
        nombre: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Nombre d\'équipements'
        },
        type: {
          type: String,
          default: null,
          description: 'Type d\'équipement'
        }
      },
      valeurDeclaree: {
        montant: {
          type: Number,
          min: 0,
          default: 0,
          description: 'Valeur déclarée en monnaie locale'
        },
        devise: {
          type: String,
          default: 'XOF',
          description: 'Code devise (ISO 4217)'
        }
      }
    },

    marchandisesDangereuses: {
      present: {
        type: Boolean,
        default: false,
        description: 'Présence de marchandises dangereuses'
      },
      details: {
        type: [{
          codeONU: {
            type: String,
            required: true,
            description: 'Code ONU (ex: UN1203)'
          },
          classeONU: {
            type: String,
            required: true,
            description: 'Classe de danger (1 à 9)'
          },
          designationOfficielle: {
            type: String,
            required: true,
            description: 'Désignation officielle de transport'
          },
          quantite: {
            type: Number,
            required: true,
            min: 0,
            description: 'Quantité'
          },
          unite: {
            type: String,
            default: 'kg',
            description: 'Unité (kg, L, unités)'
          },
          groupeEmballage: {
            type: String,
            enum: ['I', 'II', 'III', null],
            default: null,
            description: 'Groupe d\'emballage'
          },
          numeroONU: {
            type: String,
            default: null,
            description: 'Numéro d\'identification'
          }
        }],
        default: [],
        description: 'Liste des marchandises dangereuses'
      },
      declarationDGR: {
        type: Boolean,
        default: false,
        description: 'Déclaration DGR (Dangerous Goods Regulation) présente'
      },
      responsable: {
        nom: {
          type: String,
          default: null,
          description: 'Nom du responsable matières dangereuses'
        },
        telephone: {
          type: String,
          default: null,
          description: 'Téléphone du responsable'
        }
      }
    },

    logistique: {
      nombreColis: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Nombre total de colis'
      },
      volumeM3: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Volume total en m³'
      },
      nombrePalettes: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Nombre de palettes'
      },
      typePalettes: {
        type: String,
        enum: ['EUR', 'EPAL', 'STANDARD', 'AUTRE', null],
        default: null,
        description: 'Type de palettes'
      },
      nombreConteneurs: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Nombre de conteneurs'
      },
      typeConteneurs: {
        type: String,
        default: null,
        description: 'Type de conteneurs (ex: ULD, AKE, PMC)'
      },
      dimensionsSpeciales: {
        type: Boolean,
        default: false,
        description: 'Colis hors dimensions standard'
      },
      surdimensionne: {
        longueurCm: {
          type: Number,
          min: 0,
          default: null
        },
        largeurCm: {
          type: Number,
          min: 0,
          default: null
        },
        hauteurCm: {
          type: Number,
          min: 0,
          default: null
        }
      }
    },

    douanes: {
      valeurDeclaree: {
        type: Number,
        min: 0,
        default: 0,
        description: 'Valeur douanière déclarée'
      },
      devise: {
        type: String,
        default: 'XOF',
        description: 'Devise de la valeur déclarée'
      },
      paysOrigine: {
        type: String,
        default: null,
        description: 'Pays d\'origine de la marchandise (code ISO)'
      },
      paysDestination: {
        type: String,
        default: null,
        description: 'Pays de destination (code ISO)'
      },
      numeroBL: {
        type: String,
        default: null,
        description: 'Numéro de Bill of Lading (connaissement)'
      },
      numeroAWB: {
        type: String,
        default: null,
        description: 'Numéro Air Waybill (lettre de transport aérien)'
      },
      declarationDouane: {
        type: Boolean,
        default: false,
        description: 'Déclaration en douane effectuée'
      }
    },

    conditionsTransport: {
      temperatureControlee: {
        type: Boolean,
        default: false,
        description: 'Transport à température contrôlée'
      },
      temperatureMin: {
        type: Number,
        default: null,
        description: 'Température minimale en °C'
      },
      temperatureMax: {
        type: Number,
        default: null,
        description: 'Température maximale en °C'
      },
      humiditeControlee: {
        type: Boolean,
        default: false,
        description: 'Humidité contrôlée'
      },
      fragile: {
        type: Boolean,
        default: false,
        description: 'Marchandise fragile'
      },
      protegeeLumiere: {
        type: Boolean,
        default: false,
        description: 'Protégée de la lumière'
      },
      instructionsSpeciales: {
        type: String,
        default: null,
        description: 'Instructions spéciales de manutention'
      }
    },

    remarquesFret: {
      type: String,
      default: null,
      description: 'Remarques additionnelles sur le fret'
    },

    utiliseFretDetaille: {
      type: Boolean,
      default: false,
      description: 'Indique si le fret détaillé est utilisé (pour compatibilité)'
    }
  }

  // FIN EXTENSION 5 - Aucune modification des champs existants ci-dessus

}, {
  timestamps: true
});

chargeOperationnelleSchema.index({ crv: 1 });
chargeOperationnelleSchema.index({ typeCharge: 1 });

chargeOperationnelleSchema.virtual('totalPassagers').get(function() {
  return this.passagersAdultes + this.passagersEnfants + this.passagersPMR + this.passagersTransit;
});

// ========== EXTENSION 4 - Virtuals pour catégories détaillées ==========
// NON-RÉGRESSION: Virtual NOUVELLE, la virtual totalPassagers existante reste INCHANGÉE

/**
 * Calcule le total des passagers avec catégories détaillées
 * Utilise soit les catégories détaillées (si utiliseCategoriesDetaillees=true)
 * soit les catégories basiques existantes
 */
chargeOperationnelleSchema.virtual('totalPassagersDetailles').get(function() {
  if (this.utiliseCategoriesDetaillees && this.categoriesPassagersDetaillees) {
    const cat = this.categoriesPassagersDetaillees;
    return (cat.bebes || 0) +
           (cat.enfants || 0) +
           (cat.adolescents || 0) +
           (cat.adultes || 0) +
           (cat.seniors || 0) +
           (cat.pmrFauteuilRoulant || 0) +
           (cat.pmrMarcheAssistee || 0) +
           (cat.pmrNonVoyant || 0) +
           (cat.pmrSourd || 0) +
           (cat.transitLocal || 0) +
           (cat.transitInternational || 0) +
           (cat.vip || 0) +
           (cat.equipage || 0) +
           (cat.deportes || 0);
  }
  // Fallback sur les catégories basiques si détaillées pas utilisées
  return this.totalPassagers;
});

/**
 * Calcule le total des passagers PMR avec détails
 */
chargeOperationnelleSchema.virtual('totalPMRDetailles').get(function() {
  if (this.utiliseCategoriesDetaillees && this.categoriesPassagersDetaillees) {
    const cat = this.categoriesPassagersDetaillees;
    return (cat.pmrFauteuilRoulant || 0) +
           (cat.pmrMarcheAssistee || 0) +
           (cat.pmrNonVoyant || 0) +
           (cat.pmrSourd || 0);
  }
  return this.passagersPMR || 0;
});

/**
 * Calcule le total par classe
 */
chargeOperationnelleSchema.virtual('totalParClasse').get(function() {
  if (this.classePassagers) {
    return (this.classePassagers.premiere || 0) +
           (this.classePassagers.affaires || 0) +
           (this.classePassagers.economique || 0);
  }
  return 0;
});

// FIN EXTENSION 4 - Virtual existante totalPassagers reste INCHANGÉE

export default mongoose.model('ChargeOperationnelle', chargeOperationnelleSchema);
