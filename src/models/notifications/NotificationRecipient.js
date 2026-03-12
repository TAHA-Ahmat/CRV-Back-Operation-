/**
 * MODÈLE NotificationRecipient — Contacts de notification par rôle
 *
 * MODULE NOTIFICATION ENGINE v1.0.0
 * Permet à l'admin de configurer les emails et numéros WhatsApp
 * qui recevront les notifications pour chaque rôle.
 *
 * Un document = 1 rôle avec ses contacts email/whatsapp.
 * 6 documents max (1 par rôle).
 */

import mongoose from 'mongoose';

const emailContactSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'adresse email est requise'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Adresse email invalide']
  },
  nom: {
    type: String,
    trim: true,
    default: ''
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const whatsappContactSchema = new mongoose.Schema({
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
    match: [/^\+?[0-9\s-]{8,20}$/, 'Numéro de téléphone invalide']
  },
  nom: {
    type: String,
    trim: true,
    default: ''
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const notificationRecipientSchema = new mongoose.Schema({
  // ─── Clé unique : 1 document par rôle ───
  role: {
    type: String,
    enum: {
      values: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
      message: 'Rôle invalide: {VALUE}'
    },
    required: [true, 'Le rôle est requis'],
    unique: true,
    index: true
  },

  // ─── Contacts email pour ce rôle ───
  emails: {
    type: [emailContactSchema],
    default: [],
    validate: {
      validator: function(arr) { return arr.length <= 20; },
      message: 'Maximum 20 contacts email par rôle'
    }
  },

  // ─── Contacts WhatsApp pour ce rôle ───
  whatsapps: {
    type: [whatsappContactSchema],
    default: [],
    validate: {
      validator: function(arr) { return arr.length <= 20; },
      message: 'Maximum 20 contacts WhatsApp par rôle'
    }
  },

  // ─── Mode de résolution des destinataires ───
  // 'users_only' : seuls les utilisateurs du système (Personne)
  // 'contacts_only' : seuls les contacts configurés ici
  // 'both' : utilisateurs + contacts (union)
  emailMode: {
    type: String,
    enum: ['users_only', 'contacts_only', 'both'],
    default: 'users_only'
  },
  whatsappMode: {
    type: String,
    enum: ['users_only', 'contacts_only', 'both'],
    default: 'contacts_only'
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
  collection: 'notificationrecipients'
});

// ─── MÉTHODE STATIQUE : Récupérer les contacts d'un rôle ───
notificationRecipientSchema.statics.getForRole = function(role) {
  return this.findOne({ role }).lean();
};

// ─── MÉTHODE STATIQUE : Récupérer tous les rôles ───
notificationRecipientSchema.statics.getAll = function() {
  return this.find({}).sort({ role: 1 }).lean();
};

// ─── MÉTHODE STATIQUE : Récupérer les emails actifs d'un rôle ───
notificationRecipientSchema.statics.getActiveEmails = async function(role) {
  const doc = await this.findOne({ role }).lean();
  if (!doc) return { mode: 'users_only', contacts: [] };
  return {
    mode: doc.emailMode,
    contacts: (doc.emails || []).filter(e => e.actif)
  };
};

// ─── MÉTHODE STATIQUE : Récupérer les whatsapps actifs d'un rôle ───
notificationRecipientSchema.statics.getActiveWhatsapps = async function(role) {
  const doc = await this.findOne({ role }).lean();
  if (!doc) return { mode: 'contacts_only', contacts: [] };
  return {
    mode: doc.whatsappMode,
    contacts: (doc.whatsapps || []).filter(w => w.actif)
  };
};

const NotificationRecipient = mongoose.model('NotificationRecipient', notificationRecipientSchema);

export default NotificationRecipient;
