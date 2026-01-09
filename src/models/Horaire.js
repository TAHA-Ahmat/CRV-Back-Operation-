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

  // REMISE DOCUMENTS — TRANSFERT DE RESPONSABILITÉ (Cahier des charges §6)
  // Moment où le dossier de vol est remis au commandant de bord
  // Avant remise : responsabilité escale | Après remise : responsabilité équipage
  // Jalon critique pour les enquêtes et la traçabilité
  heureRemiseDocumentsPrevue: Date,
  heureRemiseDocumentsReelle: Date,

  // LIVRAISON BAGAGES — TRAÇABILITÉ SLA (Cahier des charges §4)
  // Distinct du déchargement : livraison = mise à disposition au carrousel
  heureLivraisonBagagesDebut: Date,
  heureLivraisonBagagesFin: Date,

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
  const timestamp = new Date().toISOString();
  const isNew = this.isNew;
  const modifiedPaths = this.modifiedPaths();

  console.log('[CRV][HOOK][HORAIRE_PRE_SAVE]', {
    crvId: null,
    userId: null,
    role: null,
    input: {
      horaireId: this._id,
      volId: this.vol,
      isNew,
      modifiedPaths
    },
    decision: 'SAVE',
    reason: isNew ? 'Création horaire' : 'Modification horaire',
    output: null,
    timestamp
  });

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

  // Log des écarts calculés
  if (this.ecartAtterissage !== undefined || this.ecartDecollage !== undefined || this.ecartParc !== undefined) {
    console.log('[CRV][HOOK][HORAIRE_ECARTS_CALCULES]', {
      crvId: null,
      userId: null,
      role: null,
      input: { horaireId: this._id },
      decision: 'CALCUL',
      reason: 'Écarts horaires calculés',
      output: {
        ecartAtterissage: this.ecartAtterissage,
        ecartDecollage: this.ecartDecollage,
        ecartParc: this.ecartParc
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
});

export default mongoose.model('Horaire', horaireSchema);
