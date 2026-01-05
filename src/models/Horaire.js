import mongoose from 'mongoose';

const horaireSchema = new mongoose.Schema({
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true
  },
  heureAtterrisagePrevue: Date,
  heureAtterrissageReelle: Date,
  heureArriveeAuParcPrevue: Date,
  heureArriveeAuParcReelle: Date,
  heureDepartDuParcPrevue: Date,
  heureDepartDuParcReelle: Date,
  heureDecollagePrevue: Date,
  heureDecollageReelle: Date,
  heureOuvertureParkingPrevue: Date,
  heureOuvertureParkingReelle: Date,
  heureFermetureParkingPrevue: Date,
  heureFermetureParkingReelle: Date,
  ecartAtterissage: Number,
  ecartDecollage: Number,
  ecartParc: Number,
  remarques: String
}, {
  timestamps: true
});

horaireSchema.index({ vol: 1 });

/**
 * RÈGLE MÉTIER CRITIQUE : Calculs d'écarts horaires
 * - Utilisation du service de calcul centralisé
 * - Garantit la cohérence des écarts
 */
horaireSchema.pre('save', async function(next) {
  const { calculerEcartHoraire } = await import('../services/calcul.service.js');

  // Calcul écart atterrissage
  if (this.heureAtterrissageReelle && this.heureAtterrisagePrevue) {
    this.ecartAtterissage = calculerEcartHoraire(
      this.heureAtterrisagePrevue,
      this.heureAtterrissageReelle
    );
  }

  // Calcul écart décollage
  if (this.heureDecollageReelle && this.heureDecollagePrevue) {
    this.ecartDecollage = calculerEcartHoraire(
      this.heureDecollagePrevue,
      this.heureDecollageReelle
    );
  }

  // Calcul écart arrivée au parc
  if (this.heureArriveeAuParcReelle && this.heureArriveeAuParcPrevue) {
    this.ecartParc = calculerEcartHoraire(
      this.heureArriveeAuParcPrevue,
      this.heureArriveeAuParcReelle
    );
  }

  next();
});

export default mongoose.model('Horaire', horaireSchema);
