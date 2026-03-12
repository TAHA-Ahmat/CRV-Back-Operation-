import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * EXTENSION 1.2 - Programme Vol Saisonnier COMPLET
 *
 * Modèle adapté pour gérer 100% des cas du Programme Général des Vols THS.
 * Basé sur l'analyse exhaustive du document HIVER_2025_2026 (50 conditions).
 *
 * STRUCTURE DU DOCUMENT PDF:
 * | JOURS | N° VOL | Type d'avion | VERSION | PROVENANCE | Arrivée | DESTINATION | Départ | OBSERVATIONS |
 *
 * CATÉGORIES DE VOLS:
 * - INTERNATIONAL: Vols intercontinentaux (ET, AF, TK, MS, AT, AH)
 * - REGIONAL: Vols régionaux Afrique (KP, QC)
 * - DOMESTIQUE: Vols intérieurs Tchad (CH - Royal Airways)
 * - CARGO: Vols fret (ET3xxx, MS0xxx)
 *
 * CONDITIONS SPÉCIALES GÉRÉES:
 * - Numéros de vol combinés (CH110/111)
 * - Types d'avion multiples (B737F/B77F/B763F)
 * - Routes multi-escales (IST-NIM, AMJ-AEH)
 * - Destination avec vol retour (ADD(ET938))
 * - Night stop
 * - Périodes variables par jour
 * - Notes de bas de page (① ②)
 * - Horaires J+1
 * - Vols exclus du programme (à la demande)
 */

// ========== SOUS-SCHÉMAS ==========

/**
 * Schéma pour les périodes de validité par jour
 * Permet de gérer: AT293 Mardi = 08 Déc, AT293 Jeudi = 26 Oct
 */
const periodeParJourSchema = new Schema({
  jour: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    description: '0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi'
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  }
}, { _id: false });

// ========== SCHÉMA PRINCIPAL ==========

const programmeVolSaisonnierSchema = new Schema({

  // ══════════════════════════════════════════════════════════════════════════
  // 1. MÉTADONNÉES DU DOCUMENT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Saison du programme (ex: "HIVER_2025_2026", "ETE_2026")
   * Permet de regrouper tous les vols d'une même saison
   */
  saison: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    description: 'Identifiant de la saison (ex: HIVER_2025_2026)'
  },

  /**
   * Numéro d'édition du document (ex: "N°01/17-déc.-25")
   */
  edition: {
    type: String,
    default: null,
    trim: true,
    description: 'Numéro d\'édition du programme (ex: N°01/17-déc.-25)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. IDENTIFICATION DE LA COMPAGNIE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Code IATA de la compagnie (2 lettres, déduit du numéro de vol)
   * Ex: ET, AF, TK, MS, AT, AH, KP, QC, CH
   */
  codeCompagnie: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 3,
    description: 'Code IATA de la compagnie (ex: ET, AF, TK)'
  },

  /**
   * Nom complet de la compagnie (optionnel, peut être dans OBSERVATIONS)
   * Ex: "Royal Airways", "AIR ALGERIE", "Ethiopian Airlines"
   */
  nomCompagnie: {
    type: String,
    default: null,
    trim: true,
    description: 'Nom complet de la compagnie (ex: Royal Airways)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. NUMÉRO DE VOL
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format d'affichage du numéro de vol (tel qu'affiché dans le PDF)
   * Ex: "CH110/111", "ET939", "MS0548"
   */
  numeroVolDisplay: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    description: 'Numéro de vol tel qu\'affiché (ex: CH110/111, ET939)'
  },

  /**
   * Numéro de vol aller (premier numéro si combiné)
   * Ex: "CH110" pour "CH110/111", "ET939" pour vol simple
   */
  numeroVolAller: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    description: 'Numéro de vol aller (ex: CH110, ET939)'
  },

  /**
   * Numéro de vol retour (second numéro si combiné, ou depuis DESTINATION)
   * Ex: "CH111" pour "CH110/111", "ET938" pour "ADD(ET938)"
   */
  numeroVolRetour: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Numéro de vol retour (ex: CH111, ET938)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. TYPE D'AVION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format d'affichage du type d'avion (tel qu'affiché dans le PDF)
   * Ex: "B737-800", "B737F/B77F/B763F", "E145"
   */
  avionTypeDisplay: {
    type: String,
    default: null,
    trim: true,
    description: 'Type d\'avion tel qu\'affiché (ex: B737F/B77F/B763F)'
  },

  /**
   * Liste des types d'avion possibles
   * Ex: ["B737F", "B77F", "B763F"] pour cargo Ethiopian
   */
  avionTypes: {
    type: [String],
    default: [],
    description: 'Liste des types d\'avion possibles'
  },

  /**
   * Indique si c'est un avion cargo (suffixe F = Freighter)
   */
  avionCargo: {
    type: Boolean,
    default: false,
    description: 'True si avion cargo (suffixe F)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CONFIGURATION SIÈGES (VERSION)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Configuration des sièges
   * Ex: "16C138Y" (16 Business + 138 Economy), "JY159" (tout éco), "TBN", "CARGO"
   */
  configurationSieges: {
    type: String,
    default: 'TBN',
    uppercase: true,
    trim: true,
    description: 'Configuration sièges (ex: 16C138Y, JY159, TBN, CARGO)'
  },

  /**
   * Capacité Business Class (déduit de la configuration)
   */
  capaciteBusiness: {
    type: Number,
    default: null,
    min: 0,
    description: 'Nombre de sièges Business'
  },

  /**
   * Capacité Economy Class (déduit de la configuration)
   */
  capaciteEconomy: {
    type: Number,
    default: null,
    min: 0,
    description: 'Nombre de sièges Economy'
  },

  /**
   * Capacité totale (calculée)
   */
  capaciteTotale: {
    type: Number,
    default: null,
    min: 0,
    description: 'Capacité totale passagers'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. PROVENANCE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format d'affichage de la provenance (tel qu'affiché dans le PDF)
   * Ex: "ADD", "IST-NIM", "AMJ-AEH", "-", "IST (DIRECT)"
   */
  provenanceDisplay: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Provenance tel qu\'affichée (ex: IST-NIM, ADD, -)'
  },

  /**
   * Code IATA de l'aéroport d'origine
   * Ex: "IST" pour "IST-NIM"
   */
  provenanceCode: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Code IATA origine (ex: IST, ADD)'
  },

  /**
   * Escales avant N'Djamena (extraites du format IST-NIM)
   * Ex: ["NIM"] pour "IST-NIM"
   */
  provenanceEscales: {
    type: [String],
    default: [],
    description: 'Escales avant N\'Djamena (ex: [NIM] pour IST-NIM)'
  },

  /**
   * Vol en provenance directe (annotation DIRECT)
   */
  provenanceDirecte: {
    type: Boolean,
    default: false,
    description: 'True si vol direct (sans escale)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. HORAIRE ARRIVÉE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Heure d'arrivée prévue (format HH:MM, 24h)
   * Ex: "12:10", "09:05", null si départ pur
   */
  heureArrivee: {
    type: String,
    default: null,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    description: 'Heure d\'arrivée (format HH:MM)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. DESTINATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Format d'affichage de la destination (tel qu'affiché dans le PDF)
   * Ex: "ADD(ET938)", "IST", "ABV-LFW", "NSI - CDG", "-"
   */
  destinationDisplay: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Destination tel qu\'affichée (ex: ADD(ET938), NSI-CDG)'
  },

  /**
   * Code IATA de l'aéroport de destination finale
   * Ex: "ADD" pour "ADD(ET938)", "CDG" pour "NSI - CDG"
   */
  destinationCode: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
    description: 'Code IATA destination finale (ex: ADD, CDG)'
  },

  /**
   * Escales après N'Djamena (extraites du format NSI-CDG)
   * Ex: ["NSI"] pour "NSI - CDG"
   */
  destinationEscales: {
    type: [String],
    default: [],
    description: 'Escales après N\'Djamena (ex: [NSI] pour NSI-CDG)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 9. HORAIRE DÉPART
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Heure de départ prévue (format HH:MM, 24h)
   * Ex: "14:05", "07:45", null si arrivée pure
   */
  heureDepart: {
    type: String,
    default: null,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    description: 'Heure de départ (format HH:MM)'
  },

  /**
   * Indique si le départ est le jour suivant (J+1)
   * Ex: true pour "00H45 (J+1)"
   */
  departJourSuivant: {
    type: Boolean,
    default: false,
    description: 'True si départ le lendemain (J+1)'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10. CATÉGORISATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Catégorie de vol
   */
  categorieVol: {
    type: String,
    enum: ['INTERNATIONAL', 'REGIONAL', 'DOMESTIQUE', 'CARGO'],
    required: true,
    description: 'Catégorie du vol'
  },

  /**
   * Type d'opération (déduit des champs provenance/destination)
   */
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'TRANSIT'],
    required: true,
    description: 'Type d\'opération'
  },

  /**
   * Indique si l'avion reste la nuit (NIGHT STOP)
   */
  nightStop: {
    type: Boolean,
    default: false,
    description: 'True si l\'avion reste la nuit'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 11. RÉCURRENCE ET PÉRIODE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Jours de la semaine où le vol opère
   * Ex: [1, 5] pour Lundi et Vendredi
   * 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
   */
  joursSemaine: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(day => day >= 0 && day <= 6);
      },
      message: 'Au moins un jour requis, valeurs entre 0 (Dim) et 6 (Sam)'
    },
    description: 'Jours de la semaine (0=Dim, 1=Lun, ...)'
  },

  /**
   * Période de validité par défaut (toute la saison si pas spécifié par jour)
   */
  periodeDefaut: {
    dateDebut: {
      type: Date,
      required: true,
      description: 'Date de début par défaut'
    },
    dateFin: {
      type: Date,
      required: true,
      description: 'Date de fin par défaut'
    }
  },

  /**
   * Périodes spécifiques par jour (si différentes de la période par défaut)
   * Ex: AT293 a des dates différentes le Mardi vs Jeudi/Dimanche
   */
  periodesParJour: {
    type: [periodeParJourSchema],
    default: [],
    description: 'Périodes spécifiques par jour si différentes'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 12. OBSERVATIONS ET NOTES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Indicateur de note (① ② ③)
   */
  noteIndex: {
    type: String,
    enum: [null, '①', '②', '③'],
    default: null,
    description: 'Indicateur de note de bas de page'
  },

  /**
   * Texte de la note associée
   */
  noteTexte: {
    type: String,
    default: null,
    trim: true,
    description: 'Texte de la note de bas de page'
  },

  /**
   * Observations/remarques générales
   * Ex: "Royal Airways", "Du 27 oct. au 28 Nov. 2025"
   */
  observations: {
    type: String,
    default: null,
    trim: true,
    description: 'Observations diverses'
  },

  /**
   * Horaires variables (comme les cargos)
   */
  horairesVariables: {
    type: Boolean,
    default: false,
    description: 'True si horaires susceptibles de changer'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 13. STATUT ET WORKFLOW
  // ══════════════════════════════════════════════════════════════════════════

  statut: {
    type: String,
    enum: ['BROUILLON', 'VALIDE', 'ACTIF', 'SUSPENDU', 'TERMINE'],
    default: 'BROUILLON',
    description: 'Statut du programme'
  },

  actif: {
    type: Boolean,
    default: false,
    description: 'Programme actuellement actif'
  },

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
  // 14. MÉTADONNÉES
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
  collection: 'programmesvolsaisonniers'
});

// ══════════════════════════════════════════════════════════════════════════
// INDEX
// ══════════════════════════════════════════════════════════════════════════

// Index par saison
programmeVolSaisonnierSchema.index({ saison: 1 });

// Index par compagnie
programmeVolSaisonnierSchema.index({ codeCompagnie: 1 });

// Index par numéro de vol
programmeVolSaisonnierSchema.index({ numeroVolAller: 1 });
programmeVolSaisonnierSchema.index({ numeroVolDisplay: 1 });

// Index par catégorie et statut
programmeVolSaisonnierSchema.index({ categorieVol: 1, statut: 1, actif: 1 });

// Index par jours de la semaine
programmeVolSaisonnierSchema.index({ joursSemaine: 1 });

// Index par période
programmeVolSaisonnierSchema.index({ 'periodeDefaut.dateDebut': 1, 'periodeDefaut.dateFin': 1 });

// Index par type d'opération
programmeVolSaisonnierSchema.index({ typeOperation: 1 });

// Index composite pour génération PDF
programmeVolSaisonnierSchema.index({ saison: 1, joursSemaine: 1, heureArrivee: 1 });

// ══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retourne le libellé des jours de la semaine
 */
programmeVolSaisonnierSchema.virtual('joursLibelle').get(function() {
  const joursNom = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return this.joursSemaine.map(j => joursNom[j]).join(', ');
});

/**
 * Indique si c'est un vol quotidien
 */
programmeVolSaisonnierSchema.virtual('estQuotidien').get(function() {
  return this.joursSemaine.length === 7;
});

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si le vol opère un jour donné
 */
programmeVolSaisonnierSchema.methods.opereLeJour = function(date) {
  const jour = new Date(date).getDay();
  return this.joursSemaine.includes(jour);
};

/**
 * Retourne la période de validité pour un jour donné
 */
programmeVolSaisonnierSchema.methods.getPeriodePourJour = function(jour) {
  const periodeSpecifique = this.periodesParJour.find(p => p.jour === jour);
  if (periodeSpecifique) {
    return { dateDebut: periodeSpecifique.dateDebut, dateFin: periodeSpecifique.dateFin };
  }
  return { dateDebut: this.periodeDefaut.dateDebut, dateFin: this.periodeDefaut.dateFin };
};

/**
 * Vérifie si le vol est actif pour une date donnée
 */
programmeVolSaisonnierSchema.methods.estActifPourDate = function(date) {
  if (!this.actif || this.statut !== 'ACTIF') return false;

  const dateCheck = new Date(date);
  const jour = dateCheck.getDay();

  // Vérifier si le vol opère ce jour
  if (!this.joursSemaine.includes(jour)) return false;

  // Obtenir la période pour ce jour
  const periode = this.getPeriodePourJour(jour);

  return dateCheck >= periode.dateDebut && dateCheck <= periode.dateFin;
};

/**
 * Génère la ligne pour le PDF
 */
programmeVolSaisonnierSchema.methods.toLignePDF = function() {
  return {
    numeroVol: this.numeroVolDisplay,
    typeAvion: this.avionTypeDisplay || '-',
    version: this.configurationSieges || 'TBN',
    provenance: this.provenanceDisplay || '-',
    arrivee: this.heureArrivee ? this.heureArrivee.replace(':', 'H') : '-',
    destination: this.destinationDisplay || '-',
    depart: this.heureDepart ? (this.heureDepart.replace(':', 'H') + (this.departJourSuivant ? ' (J+1)' : '')) : '-',
    observations: this._buildObservations()
  };
};

/**
 * Construit le champ observations pour le PDF
 */
programmeVolSaisonnierSchema.methods._buildObservations = function() {
  const parts = [];

  // Note index
  if (this.noteIndex) {
    parts.push(this.noteIndex);
  }

  // Nom compagnie si domestique
  if (this.nomCompagnie && this.categorieVol === 'DOMESTIQUE') {
    parts.push(this.nomCompagnie);
  }

  // Période si pas toute la saison
  if (this.observations && this.observations.includes('Du ')) {
    parts.push(this.observations);
  }

  // Night stop
  if (this.nightStop) {
    parts.push('NIGHT STOP');
  }

  return parts.join('; ') || this.observations || '';
};

// ══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Trouve tous les vols pour une saison, groupés par jour
 */
programmeVolSaisonnierSchema.statics.getVolsParJour = async function(saison) {
  const joursNom = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

  const programmes = await this.find({ saison, actif: true, statut: 'ACTIF' })
    .sort({ heureArrivee: 1, heureDepart: 1 });

  const result = {};
  joursNom.forEach((nom, index) => {
    result[nom] = programmes.filter(p => p.joursSemaine.includes(index));
  });

  return result;
};

/**
 * Trouve les vols applicables pour une date donnée
 */
programmeVolSaisonnierSchema.statics.getVolsPourDate = async function(date, options = {}) {
  const dateCheck = new Date(date);
  const jour = dateCheck.getDay();

  const query = {
    actif: true,
    statut: 'ACTIF',
    joursSemaine: jour,
    'periodeDefaut.dateDebut': { $lte: dateCheck },
    'periodeDefaut.dateFin': { $gte: dateCheck }
  };

  if (options.categorieVol) {
    query.categorieVol = options.categorieVol.toUpperCase();
  }

  if (options.codeCompagnie) {
    query.codeCompagnie = options.codeCompagnie.toUpperCase();
  }

  return this.find(query).sort({ heureArrivee: 1, heureDepart: 1 });
};

/**
 * Obtient les statistiques pour une saison
 */
programmeVolSaisonnierSchema.statics.getStatistiquesSaison = async function(saison) {
  const joursNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const programmes = await this.find({ saison, actif: true, statut: 'ACTIF' });

  const stats = {
    totalVols: programmes.length,
    parCategorie: {
      INTERNATIONAL: 0,
      REGIONAL: 0,
      DOMESTIQUE: 0,
      CARGO: 0
    },
    parJour: {},
    compagnies: new Set()
  };

  joursNom.forEach((nom, index) => {
    stats.parJour[nom] = {
      total: 0,
      international: 0,
      regional: 0,
      domestique: 0,
      cargo: 0
    };
  });

  programmes.forEach(prog => {
    // Par catégorie
    stats.parCategorie[prog.categorieVol]++;

    // Compagnies
    stats.compagnies.add(prog.codeCompagnie);

    // Par jour
    prog.joursSemaine.forEach(jour => {
      const nomJour = joursNom[jour];
      stats.parJour[nomJour].total++;
      stats.parJour[nomJour][prog.categorieVol.toLowerCase()]++;
    });
  });

  stats.compagnies = Array.from(stats.compagnies);

  return stats;
};

/**
 * Parse un numéro de vol pour extraire le code compagnie
 */
programmeVolSaisonnierSchema.statics.parseCodeCompagnie = function(numeroVol) {
  if (!numeroVol) return null;
  const match = numeroVol.match(/^([A-Z]{2})/);
  return match ? match[1] : null;
};

/**
 * Parse une configuration sièges pour extraire les capacités
 */
programmeVolSaisonnierSchema.statics.parseConfigurationSieges = function(config) {
  if (!config || config === 'TBN' || config === 'CARGO') {
    return { business: null, economy: null, total: null };
  }

  // Format 16C138Y = 16 Business + 138 Economy
  const matchBC = config.match(/^(\d+)C(\d+)Y$/);
  if (matchBC) {
    const business = parseInt(matchBC[1]);
    const economy = parseInt(matchBC[2]);
    return { business, economy, total: business + economy };
  }

  // Format JY159 = 159 Economy (tout éco)
  const matchJY = config.match(/^JY(\d+)$/);
  if (matchJY) {
    const economy = parseInt(matchJY[1]);
    return { business: 0, economy, total: economy };
  }

  return { business: null, economy: null, total: null };
};

/**
 * Parse une route pour extraire le code et les escales
 * Ex: "IST-NIM" -> { code: "IST", escales: ["NIM"] }
 * Ex: "IST (DIRECT)" -> { code: "IST", escales: [], direct: true }
 */
programmeVolSaisonnierSchema.statics.parseRoute = function(route) {
  if (!route || route === '-') {
    return { code: null, escales: [], direct: false };
  }

  // Nettoyer
  route = route.trim().toUpperCase();

  // Vérifier (DIRECT)
  const direct = route.includes('(DIRECT)');
  route = route.replace('(DIRECT)', '').trim();

  // Extraire vol retour entre parenthèses
  let volRetour = null;
  const matchRetour = route.match(/\(([A-Z]{2}\d+)\)/);
  if (matchRetour) {
    volRetour = matchRetour[1];
    route = route.replace(matchRetour[0], '').trim();
  }

  // Séparer par tiret
  const parts = route.split(/[-–]/).map(p => p.trim()).filter(p => p);

  if (parts.length === 0) {
    return { code: null, escales: [], direct, volRetour };
  }

  if (parts.length === 1) {
    return { code: parts[0], escales: [], direct, volRetour };
  }

  // Premier = code, reste = escales
  return {
    code: parts[0],
    escales: parts.slice(1),
    direct,
    volRetour
  };
};

// ══════════════════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ══════════════════════════════════════════════════════════════════════════

programmeVolSaisonnierSchema.pre('save', function(next) {
  // Auto-déduire le code compagnie si non fourni
  if (!this.codeCompagnie && this.numeroVolAller) {
    this.codeCompagnie = this.constructor.parseCodeCompagnie(this.numeroVolAller);
  }

  // Parser la configuration sièges
  if (this.configurationSieges) {
    const config = this.constructor.parseConfigurationSieges(this.configurationSieges);
    this.capaciteBusiness = config.business;
    this.capaciteEconomy = config.economy;
    this.capaciteTotale = config.total;
  }

  // Détecter avion cargo
  if (this.avionTypeDisplay) {
    this.avionCargo = this.avionTypeDisplay.includes('F');
  }

  next();
});

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

const ProgrammeVolSaisonnier = mongoose.model('ProgrammeVolSaisonnier', programmeVolSaisonnierSchema);

export default ProgrammeVolSaisonnier;
