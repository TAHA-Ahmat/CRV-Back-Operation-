/**
 * MODÈLE NotificationRule — Règles de distribution des notifications
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Chaque règle = 1 événement × 1 rôle × canaux activés/désactivés.
 * 82 événements × 6 rôles = 492 règles.
 *
 * AUCUNE MODIFICATION DU MODÈLE Notification.js EXISTANT.
 */

import mongoose from 'mongoose';

const notificationRuleSchema = new mongoose.Schema({
  // ─── Clé composite unique (event + role) ───
  event: {
    type: String,
    required: [true, 'Le nom de l\'événement est requis'],
    trim: true,
    index: true
  },
  role: {
    type: String,
    enum: {
      values: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
      message: 'Rôle invalide: {VALUE}'
    },
    required: [true, 'Le rôle est requis'],
    index: true
  },

  // ─── Activation globale de cette règle ───
  enabled: {
    type: Boolean,
    default: true
  },

  // ─── Canaux de distribution ───
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  },

  // ─── Metadata de l'événement ───
  eventDomain: {
    type: String,
    enum: ['CRV', 'VALIDATION', 'ANNULATION', 'ARCHIVAGE', 'PHASES',
           'BULLETIN', 'PROGRAMME', 'CHARGES', 'SLA', 'AUTH', 'ENGINS', 'AVIONS'],
    required: true,
    index: true
  },
  eventPriority: {
    type: String,
    enum: ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'],
    required: true,
    index: true
  },
  eventDescription: {
    type: String,
    required: true,
    trim: true
  },

  // ─── Template de message ───
  messageTemplate: {
    titre: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },

  // ─── Audit ───
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },
  dateModification: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'notificationrules'
});

// ─── INDEX COMPOSITE UNIQUE ───────────────────────────────────
notificationRuleSchema.index({ event: 1, role: 1 }, { unique: true });

// ─── INDEX POUR REQUÊTES FRÉQUENTES ──────────────────────────
notificationRuleSchema.index({ event: 1, enabled: 1 });
notificationRuleSchema.index({ eventDomain: 1, eventPriority: 1 });

// ─── MÉTHODE STATIQUE : Trouver les règles actives pour un événement ───
notificationRuleSchema.statics.findActiveRulesForEvent = function(eventName) {
  return this.find({ event: eventName, enabled: true }).lean();
};

// ─── MÉTHODE STATIQUE : Matrice complète groupée par domaine ───
notificationRuleSchema.statics.getMatrix = function() {
  return this.find({}).sort({ eventDomain: 1, event: 1, role: 1 }).lean();
};

// ─── MÉTHODE STATIQUE : Stats ───
notificationRuleSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const enabled = await this.countDocuments({ enabled: true });
  const withEmail = await this.countDocuments({ enabled: true, 'channels.email': true });
  const withWhatsapp = await this.countDocuments({ enabled: true, 'channels.whatsapp': true });
  const withInApp = await this.countDocuments({ enabled: true, 'channels.inApp': true });

  const byDomain = await this.aggregate([
    { $group: { _id: '$eventDomain', total: { $sum: 1 }, active: { $sum: { $cond: ['$enabled', 1, 0] } } } },
    { $sort: { _id: 1 } }
  ]);

  const byPriority = await this.aggregate([
    { $group: { _id: '$eventPriority', total: { $sum: 1 }, active: { $sum: { $cond: ['$enabled', 1, 0] } } } },
    { $sort: { _id: 1 } }
  ]);

  return { total, enabled, channels: { inApp: withInApp, email: withEmail, whatsapp: withWhatsapp }, byDomain, byPriority };
};

const NotificationRule = mongoose.model('NotificationRule', notificationRuleSchema);

export default NotificationRule;
