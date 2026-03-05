import mongoose from 'mongoose';

/**
 * Sous-schema Horodatage — Double Horodatage CRV
 *
 * Chaque action (début/fin de phase) est tracée avec :
 * - timestampSysteme : horodatage serveur UTC (fiable, non modifiable)
 * - heureDeclaree : heure saisie par l'agent (peut différer du serveur)
 * - source : TEMPS_REEL | DECLARATION | CORRECTION | IMPORT
 * - ecartSaisieMinutes : écart entre déclaré et système
 * - saisieTardive : flag si écart > 60 min
 * - agent : qui a effectué l'action
 * - timezoneAeroport : fuseau horaire de l'aéroport
 */
const horodatageSchema = new mongoose.Schema({
  timestampSysteme: {
    type: Date,
    required: true,
    immutable: true  // Le timestamp serveur ne peut JAMAIS être modifié
  },
  heureDeclaree: {
    type: Date,
    required: true
  },
  source: {
    type: String,
    enum: ['TEMPS_REEL', 'DECLARATION', 'CORRECTION', 'IMPORT'],
    required: true,
    default: 'TEMPS_REEL'
  },
  ecartSaisieMinutes: {
    type: Number,
    default: 0
  },
  saisieTardive: {
    type: Boolean,
    default: false
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  timezoneAeroport: {
    type: String,
    default: 'UTC'
  }
}, { _id: false });

const chronologiePhaseSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true
  },
  heureDebutPrevue: Date,
  heureDebutReelle: Date,
  heureFinPrevue: Date,
  heureFinReelle: Date,
  dureeReelleMinutes: Number,
  ecartMinutes: Number,
  statut: {
    type: String,
    enum: ['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'NON_REALISE', 'ANNULE'],
    default: 'NON_COMMENCE'
  },
  motifNonRealisation: {
    type: String,
    enum: ['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE']
  },
  detailMotif: String,
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  remarques: String,

  // ═══════════════════════════════════════════════════════
  // DOUBLE HORODATAGE — Mission 008
  // ═══════════════════════════════════════════════════════
  horodatageDebut: horodatageSchema,
  horodatageFin: horodatageSchema
}, {
  timestamps: true
});

chronologiePhaseSchema.index({ crv: 1, phase: 1 });
chronologiePhaseSchema.index({ statut: 1 });

/**
 * RÈGLE MÉTIER CRITIQUE : Calculs automatiques avant sauvegarde
 * - Utilisation du service de calcul centralisé
 * - Garantit la cohérence des durées
 * - Validation de la logique métier
 */
chronologiePhaseSchema.pre('save', async function(next) {
  const timestamp = new Date().toISOString();
  const isNew = this.isNew;
  const modifiedPaths = this.modifiedPaths();
  const statutAvant = this.isModified('statut') ? this._previousStatut : this.statut;

  console.log('[CRV][HOOK][CHRONO_PHASE_PRE_SAVE]', {
    crvId: this.crv,
    userId: this.responsable || null,
    role: null,
    input: {
      chronoPhaseId: this._id,
      isNew,
      modifiedPaths,
      statut: this.statut
    },
    decision: 'SAVE',
    reason: isNew ? 'Création chronologie phase' : 'Modification chronologie phase',
    output: null,
    timestamp
  });

  // Import dynamique pour éviter les dépendances circulaires
  const { calculerDureeMinutes, calculerEcartHoraire } = await import('../../services/charges/calcul.service.js');

  // Calcul de la durée réelle
  if (this.heureDebutReelle && this.heureFinReelle) {
    this.dureeReelleMinutes = calculerDureeMinutes(
      this.heureDebutReelle,
      this.heureFinReelle
    );
  }

  // Calcul de l'écart par rapport à la durée prévue
  if (this.heureDebutPrevue && this.heureFinPrevue && this.dureeReelleMinutes !== null) {
    const dureePrevue = calculerDureeMinutes(
      this.heureDebutPrevue,
      this.heureFinPrevue
    );

    if (dureePrevue !== null) {
      this.ecartMinutes = this.dureeReelleMinutes - dureePrevue;
    }
  }

  // RÈGLE MÉTIER : Phase non réalisée ne doit pas avoir de durée ni d'horodatage
  if (this.statut === 'NON_REALISE') {
    console.log('[CRV][HOOK][CHRONO_PHASE_REGLE_METIER]', {
      crvId: this.crv,
      userId: null,
      role: null,
      input: { chronoPhaseId: this._id, statut: 'NON_REALISE' },
      decision: 'RESET_DUREES',
      reason: 'Phase non réalisée - réinitialisation des durées et horodatages',
      output: { heureDebutReelle: null, heureFinReelle: null, dureeReelleMinutes: null },
      timestamp: new Date().toISOString()
    });
    this.heureDebutReelle = null;
    this.heureFinReelle = null;
    this.dureeReelleMinutes = null;
    this.ecartMinutes = null;
    this.horodatageDebut = undefined;
    this.horodatageFin = undefined;
  }

  next();
});

export default mongoose.model('ChronologiePhase', chronologiePhaseSchema);
