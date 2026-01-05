import mongoose from 'mongoose';

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
  remarques: String
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
  // Import dynamique pour éviter les dépendances circulaires
  const { calculerDureeMinutes, calculerEcartHoraire } = await import('../services/calcul.service.js');

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

  // RÈGLE MÉTIER : Phase non réalisée ne doit pas avoir de durée
  if (this.statut === 'NON_REALISE') {
    this.heureDebutReelle = null;
    this.heureFinReelle = null;
    this.dureeReelleMinutes = null;
    this.ecartMinutes = null;
  }

  next();
});

export default mongoose.model('ChronologiePhase', chronologiePhaseSchema);
