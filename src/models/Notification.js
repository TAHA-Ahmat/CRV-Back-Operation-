import mongoose from 'mongoose';

/**
 * EXTENSION 7 - Modèle Notification (Service notification)
 *
 * Modèle NOUVEAU pour gérer les notifications système.
 *
 * NON-RÉGRESSION: Ce modèle est ENTIÈREMENT NOUVEAU.
 * - Aucun modèle existant n'est modifié
 * - Ce modèle est OPTIONNEL et peut être utilisé ou ignoré
 * - Aucune dépendance obligatoire avec d'autres modèles
 */

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'ALERTE_SLA'],
    required: true
  },
  titre: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  lien: {
    type: String,
    default: null,
    trim: true,
    description: 'URL ou chemin vers la ressource concernée (ex: /crv/123)'
  },
  donnees: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    description: 'Données additionnelles (JSON)'
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateLecture: {
    type: Date,
    default: null
  },
  archive: {
    type: Boolean,
    default: false
  },
  dateArchivage: {
    type: Date,
    default: null
  },
  priorite: {
    type: String,
    enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
    default: 'NORMALE'
  },
  canaux: {
    email: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null },
      adresse: { type: String, default: null }
    },
    sms: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null },
      numero: { type: String, default: null }
    },
    push: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null }
    },
    inApp: {
      affiche: { type: Boolean, default: true }
    }
  },
  source: {
    type: String,
    enum: ['SYSTEME', 'ADMIN', 'ALERTE_SLA', 'WORKFLOW', 'VALIDATION', 'AUTRE'],
    default: 'SYSTEME'
  },
  referenceModele: {
    type: String,
    default: null,
    description: 'Type de modèle référencé (CRV, Vol, Phase, etc.)'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    description: 'ID du document référencé'
  },
  expiration: {
    type: Date,
    default: null,
    description: 'Date d\'expiration de la notification'
  }
}, {
  timestamps: true
});

// Index pour requêtes fréquentes
notificationSchema.index({ destinataire: 1, lu: 1 });
notificationSchema.index({ destinataire: 1, archive: 1 });
notificationSchema.index({ destinataire: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priorite: 1 });
notificationSchema.index({ expiration: 1 });

// Virtual pour savoir si la notification est expirée
notificationSchema.virtual('estExpiree').get(function() {
  if (!this.expiration) return false;
  return new Date() > this.expiration;
});

// Méthode pour marquer comme lue
notificationSchema.methods.marquerCommeLue = function() {
  this.lu = true;
  this.dateLecture = new Date();
  return this.save();
};

// Méthode pour archiver
notificationSchema.methods.archiver = function() {
  this.archive = true;
  this.dateArchivage = new Date();
  return this.save();
};

export default mongoose.model('Notification', notificationSchema);
