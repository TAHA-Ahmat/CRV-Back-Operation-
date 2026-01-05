// ✅ COPIÉ DEPUIS MAGASIN : Centralisation des logs d'activité utilisateur
import mongoose from 'mongoose';

// --- Sous-schémas (sans _id) -----------------------------------------------

const UserSnapshotSchema = new mongoose.Schema(
  {
    username: { type: String, default: null },
    role: { type: String, default: null },
  },
  { _id: false }
);

const RequestSchema = new mongoose.Schema(
  {
    // id de corrélation pour relier toute la vie d'une requête
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    method: { type: String, default: null },
    path: { type: String, default: null },
    query: { type: Object, default: {} },
    statusCode: { type: Number, default: null },
    latencyMs: { type: Number, default: null },
  },
  { _id: false }
);

const ClientSchema = new mongoose.Schema(
  {
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { _id: false }
);

// ✅ ADAPTÉ POUR CRV : Contexte générique pour CRV / Mission / Vol / Equipage...
const ContextSchema = new mongoose.Schema(
  {
    entityType: { type: String, default: null }, // "CRV" | "Mission" | "Vol" | "Equipage" | "Aeronef" | ...
    entityId: { type: mongoose.Schema.Types.Mixed, default: null },
    // Raccourcis facultatifs pour filtres rapides côté UI
    refs: {
      crvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CRV', default: null },
      missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', default: null },
      volId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vol', default: null },
      aeronefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aeronef', default: null },
    },
  },
  { _id: false }
);

// --- Schéma principal -------------------------------------------------------

const userActivityLogSchema = new mongoose.Schema(
  {
    // ✅ ADAPTÉ POUR CRV : Référence vers Personne au lieu de User
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      required: false, // Validation personnalisée ci-dessous
      validate: {
        validator: function(value) {
          // Debug temporaire
          console.log(`🔍 VALIDATION DEBUG: type="${this.type}", utilisateurId="${value}"`);
          // Validation post-modification : permet null pour type 'system'
          return this.type === 'system' || value != null;
        },
        message: 'utilisateurId requis pour les types non-system'
      }
    },
    action: {
      type: String,
      required: true, // ex: "login_success", "crv_create", "mission_validate"
      trim: true,
    },
    details: {
      type: String, // résumé lisible humain : "CRV créé pour mission X"
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // ✅ Nouveaux champs (optionnels) pour couverture complète
    type: {
      type: String,
      enum: ['auth', 'action', 'system', 'business'],
      default: 'action',
    },
    userSnapshot: { type: UserSnapshotSchema, default: () => ({}) },
    request: { type: RequestSchema, default: () => ({}) },
    client: { type: ClientSchema, default: () => ({}) },
    context: { type: ContextSchema, default: () => ({}) },

    // Zone libre pour diffs / payload filtré / erreurs non sensibles
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // createdAt sert d'horodatage unique
    versionKey: false,
  }
);

// --- Indexes utiles (requêtes rapides) -------------------------------------

userActivityLogSchema.index({ createdAt: -1 });
userActivityLogSchema.index({ utilisateurId: 1, createdAt: -1 });
userActivityLogSchema.index({ action: 1, createdAt: -1 });
userActivityLogSchema.index({ type: 1, createdAt: -1 });
userActivityLogSchema.index({ 'context.entityType': 1, 'context.entityId': 1, createdAt: -1 });
// corrélation d'une requête (optionnel mais pratique)
userActivityLogSchema.index({ 'request.id': 1 });

// --- Méthodes statiques (helpers centralisés) -------------------------------

/**
 * Écriture centralisée d'un log.
 * ⚠️ Ne jamais y mettre de mots de passe, tokens, cookies, ou données sensibles.
 */
userActivityLogSchema.statics.write = async function (entry) {
  // Petite barrière : éviter l'injection de secrets connus
  if (entry?.meta) {
    const asString = JSON.stringify(entry.meta);
    if (/(password|mot_de_passe|token|cookie|authorization|secret)/i.test(asString)) {
      throw new Error('Données sensibles détectées dans meta: log refusé.');
    }
  }
  return this.create(entry);
};

/**
 * Aides sémantiques (facultatives) pour normaliser les actions.
 * Elles restent légères et n'imposent pas de dépendances.
 */
userActivityLogSchema.statics.logAuthSuccess = function (user, reqInfo = {}) {
  return this.write({
    type: 'auth',
    action: 'login_success',
    utilisateurId: user?._id || null,
    userSnapshot: { username: user?.nom || null, role: user?.fonction || null },
    request: reqInfo.request || {},
    client: reqInfo.client || {},
    details: 'Authentification réussie',
  });
};

userActivityLogSchema.statics.logAuthFailure = function (username, reqInfo = {}, reason = '') {
  return this.write({
    type: 'auth',
    action: 'login_failure',
    utilisateurId: null, // inconnu / non authentifié
    userSnapshot: { username: username || null, role: null },
    request: reqInfo.request || {},
    client: reqInfo.client || {},
    details: reason || "Échec d'authentification",
    meta: { reason },
  });
};

userActivityLogSchema.statics.logLogout = function (user, reqInfo = {}) {
  return this.write({
    type: 'auth',
    action: 'logout',
    utilisateurId: user?._id || null,
    userSnapshot: { username: user?.nom || null, role: user?.fonction || null },
    request: reqInfo.request || {},
    client: reqInfo.client || {},
    details: 'Déconnexion',
  });
};

userActivityLogSchema.statics.logAction = function (user, action, context = {}, meta = {}, reqInfo = {}) {
  return this.write({
    type: 'action',
    action,
    utilisateurId: user?._id || null,
    userSnapshot: { username: user?.nom || null, role: user?.fonction || null },
    request: reqInfo.request || {},
    client: reqInfo.client || {},
    context,
    meta,
    details: meta?.summary || '',
  });
};

userActivityLogSchema.statics.logSystem = function (action, meta = {}) {
  return this.write({
    type: 'system',
    action,
    utilisateurId: null,
    userSnapshot: {},
    context: {},
    meta,
    details: meta?.summary || '',
  });
};

// --- Modèle -----------------------------------------------------------------

const UserActivityLog = mongoose.model('UserActivityLog', userActivityLogSchema);
export default UserActivityLog;
