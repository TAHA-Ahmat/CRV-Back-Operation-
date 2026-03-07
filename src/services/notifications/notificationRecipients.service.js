/**
 * NOTIFICATION RECIPIENTS SERVICE — CRUD pour la gestion des contacts
 *
 * MODULE NOTIFICATION ENGINE v1.0.0
 * Fonctions appelées par le controller admin.
 * Gère les contacts email/WhatsApp par rôle.
 */

import NotificationRecipient from '../../models/notifications/NotificationRecipient.js';

// ─── RÔLES DU SYSTÈME ────────────────────────────────────────
const ROLES = ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'];

/**
 * Récupère tous les recipients (6 documents, 1 par rôle).
 * Initialise les documents manquants.
 * @returns {Array} 6 documents recipients
 */
export async function getAll() {
  // S'assurer que tous les rôles ont un document
  await ensureAllRolesExist();
  return NotificationRecipient.getAll();
}

/**
 * Récupère les contacts d'un rôle.
 * @param {string} role - Nom du rôle
 * @returns {Object} Document recipient
 */
export async function getByRole(role) {
  if (!ROLES.includes(role)) {
    throw new Error(`Rôle invalide: ${role}`);
  }
  await ensureRoleExists(role);
  return NotificationRecipient.getForRole(role);
}

/**
 * Met à jour les contacts et le mode d'un rôle.
 * @param {string} role - Nom du rôle
 * @param {Object} updates - { emails?, whatsapps?, emailMode?, whatsappMode? }
 * @param {string} adminId - ID de l'admin
 * @returns {Object} Document mis à jour
 */
export async function updateByRole(role, updates, adminId) {
  if (!ROLES.includes(role)) {
    throw new Error(`Rôle invalide: ${role}`);
  }

  const allowedUpdates = {
    modifiePar: adminId,
    dateModification: new Date()
  };

  if (updates.emails !== undefined) allowedUpdates.emails = updates.emails;
  if (updates.whatsapps !== undefined) allowedUpdates.whatsapps = updates.whatsapps;
  if (updates.emailMode !== undefined) allowedUpdates.emailMode = updates.emailMode;
  if (updates.whatsappMode !== undefined) allowedUpdates.whatsappMode = updates.whatsappMode;

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role },
    { $set: allowedUpdates },
    { new: true, runValidators: true, upsert: true }
  ).lean();

  return doc;
}

/**
 * Ajoute un contact email à un rôle.
 * @param {string} role - Nom du rôle
 * @param {Object} contact - { email, nom? }
 * @param {string} adminId - ID de l'admin
 * @returns {Object} Document mis à jour
 */
export async function addEmail(role, contact, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);
  if (!contact.email) throw new Error('Email requis');

  await ensureRoleExists(role);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role },
    {
      $push: { emails: { email: contact.email, nom: contact.nom || '', actif: true } },
      $set: { modifiePar: adminId, dateModification: new Date() }
    },
    { new: true, runValidators: true }
  ).lean();

  return doc;
}

/**
 * Supprime un contact email d'un rôle.
 * @param {string} role - Nom du rôle
 * @param {string} emailId - _id du sous-document email
 * @param {string} adminId - ID de l'admin
 * @returns {Object} Document mis à jour
 */
export async function removeEmail(role, emailId, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role },
    {
      $pull: { emails: { _id: emailId } },
      $set: { modifiePar: adminId, dateModification: new Date() }
    },
    { new: true }
  ).lean();

  return doc;
}

/**
 * Ajoute un contact WhatsApp à un rôle.
 * @param {string} role - Nom du rôle
 * @param {Object} contact - { telephone, nom? }
 * @param {string} adminId - ID de l'admin
 * @returns {Object} Document mis à jour
 */
export async function addWhatsapp(role, contact, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);
  if (!contact.telephone) throw new Error('Téléphone requis');

  await ensureRoleExists(role);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role },
    {
      $push: { whatsapps: { telephone: contact.telephone, nom: contact.nom || '', actif: true } },
      $set: { modifiePar: adminId, dateModification: new Date() }
    },
    { new: true, runValidators: true }
  ).lean();

  return doc;
}

/**
 * Supprime un contact WhatsApp d'un rôle.
 * @param {string} role - Nom du rôle
 * @param {string} whatsappId - _id du sous-document whatsapp
 * @param {string} adminId - ID de l'admin
 * @returns {Object} Document mis à jour
 */
export async function removeWhatsapp(role, whatsappId, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role },
    {
      $pull: { whatsapps: { _id: whatsappId } },
      $set: { modifiePar: adminId, dateModification: new Date() }
    },
    { new: true }
  ).lean();

  return doc;
}

/**
 * Active/Désactive un contact email.
 */
export async function toggleEmail(role, emailId, actif, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role, 'emails._id': emailId },
    {
      $set: {
        'emails.$.actif': actif,
        modifiePar: adminId,
        dateModification: new Date()
      }
    },
    { new: true }
  ).lean();

  return doc;
}

/**
 * Active/Désactive un contact WhatsApp.
 */
export async function toggleWhatsapp(role, whatsappId, actif, adminId) {
  if (!ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);

  const doc = await NotificationRecipient.findOneAndUpdate(
    { role, 'whatsapps._id': whatsappId },
    {
      $set: {
        'whatsapps.$.actif': actif,
        modifiePar: adminId,
        dateModification: new Date()
      }
    },
    { new: true }
  ).lean();

  return doc;
}

// ─── HELPERS INTERNES ────────────────────────────────────────

async function ensureRoleExists(role) {
  const exists = await NotificationRecipient.findOne({ role }).lean();
  if (!exists) {
    await NotificationRecipient.create({ role, emails: [], whatsapps: [] });
  }
}

async function ensureAllRolesExist() {
  const existing = await NotificationRecipient.find({}).distinct('role');
  const missing = ROLES.filter(r => !existing.includes(r));
  if (missing.length > 0) {
    await NotificationRecipient.insertMany(
      missing.map(role => ({ role, emails: [], whatsapps: [] })),
      { ordered: false }
    ).catch(() => {}); // Ignorer les doublons
  }
}
