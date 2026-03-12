/**
 * NOTIFICATION RULES SERVICE — CRUD pour l'administration des règles
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Fonctions appelées par le controller admin.
 * Toutes les opérations sont réservées au rôle ADMIN.
 */

import NotificationRule from '../../models/notifications/NotificationRule.js';
import { EVENT_METADATA, EVENT_DOMAINS, EVENT_PRIORITIES, getAllEventNames, TOTAL_EVENTS } from './eventRegistry.js';

// ─── RÔLES DU SYSTÈME ────────────────────────────────────────
const ROLES = ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'];

/**
 * Récupère la matrice complète des règles.
 * @param {Object} filters - { domain?, priority?, role?, enabled? }
 * @returns {Array} Règles triées par domaine/événement/rôle
 */
export async function getMatrix(filters = {}) {
  const query = {};

  if (filters.domain) query.eventDomain = filters.domain;
  if (filters.priority) query.eventPriority = filters.priority;
  if (filters.role) query.role = filters.role;
  if (filters.enabled !== undefined) query.enabled = filters.enabled === 'true' || filters.enabled === true;

  const rules = await NotificationRule.find(query)
    .sort({ eventDomain: 1, event: 1, role: 1 })
    .lean();

  return rules;
}

/**
 * Récupère les règles d'un événement spécifique.
 * @param {string} eventName - Nom de l'événement
 * @returns {Array} 6 règles (1 par rôle)
 */
export async function getRulesForEvent(eventName) {
  return NotificationRule.find({ event: eventName })
    .sort({ role: 1 })
    .lean();
}

/**
 * Met à jour une règle existante.
 * @param {string} ruleId - ObjectId de la règle
 * @param {Object} updates - { enabled?, channels?: { inApp?, email?, whatsapp? }, messageTemplate? }
 * @param {string} adminId - ID de l'admin effectuant la modification
 * @returns {Object} Règle mise à jour
 */
export async function updateRule(ruleId, updates, adminId) {
  const allowedUpdates = {};

  // Seuls certains champs sont modifiables
  if (updates.enabled !== undefined) allowedUpdates.enabled = updates.enabled;
  if (updates.channels) {
    allowedUpdates['channels.inApp'] = updates.channels.inApp;
    allowedUpdates['channels.email'] = updates.channels.email;
    allowedUpdates['channels.whatsapp'] = updates.channels.whatsapp;
  }
  if (updates.messageTemplate) {
    if (updates.messageTemplate.titre) allowedUpdates['messageTemplate.titre'] = updates.messageTemplate.titre;
    if (updates.messageTemplate.message) allowedUpdates['messageTemplate.message'] = updates.messageTemplate.message;
  }

  // Audit
  allowedUpdates.modifiePar = adminId;
  allowedUpdates.dateModification = new Date();

  const rule = await NotificationRule.findByIdAndUpdate(
    ruleId,
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).lean();

  if (!rule) throw new Error('Règle non trouvée');

  return rule;
}

/**
 * Met à jour en masse les règles d'un événement (6 règles d'un coup).
 * @param {string} eventName - Nom de l'événement
 * @param {Array} rulesUpdates - [{ role, enabled, channels }]
 * @param {string} adminId - ID de l'admin
 * @returns {Object} { updated, errors }
 */
export async function bulkUpdateEvent(eventName, rulesUpdates, adminId) {
  const results = { updated: 0, errors: [] };

  for (const update of rulesUpdates) {
    try {
      const updateFields = {
        modifiePar: adminId,
        dateModification: new Date()
      };

      if (update.enabled !== undefined) updateFields.enabled = update.enabled;
      if (update.channels) {
        if (update.channels.inApp !== undefined) updateFields['channels.inApp'] = update.channels.inApp;
        if (update.channels.email !== undefined) updateFields['channels.email'] = update.channels.email;
        if (update.channels.whatsapp !== undefined) updateFields['channels.whatsapp'] = update.channels.whatsapp;
      }

      await NotificationRule.findOneAndUpdate(
        { event: eventName, role: update.role },
        { $set: updateFields },
        { runValidators: true }
      );

      results.updated++;
    } catch (error) {
      results.errors.push({ role: update.role, error: error.message });
    }
  }

  return results;
}

/**
 * Active/Désactive en masse par domaine.
 * @param {string} domain - Domaine (ex: 'CRV', 'SLA')
 * @param {boolean} enabled - true/false
 * @param {string} adminId - ID de l'admin
 * @returns {Object} { modifiedCount }
 */
export async function toggleDomain(domain, enabled, adminId) {
  const result = await NotificationRule.updateMany(
    { eventDomain: domain },
    {
      $set: {
        enabled,
        modifiePar: adminId,
        dateModification: new Date()
      }
    }
  );

  return { modifiedCount: result.modifiedCount };
}

/**
 * Réinitialise toutes les règles aux valeurs par défaut.
 * Supprime tout et relance le seed.
 * @param {string} adminId - ID de l'admin
 * @returns {Object} { deleted, seeded }
 */
export async function resetToDefaults(adminId) {
  const { seedNotificationRules } = await import('./seed/seedNotificationRules.js');

  const deleted = await NotificationRule.deleteMany({});
  const seeded = await seedNotificationRules(true); // force = true

  return {
    deleted: deleted.deletedCount,
    seeded,
    resetBy: adminId,
    resetAt: new Date()
  };
}

/**
 * Statistiques du module notification.
 * @returns {Object} Stats complètes
 */
export async function getStats() {
  return NotificationRule.getStats();
}

/**
 * Retourne les métadonnées de configuration pour le frontend.
 * (Domaines, priorités, rôles, total événements)
 */
export function getMetadata() {
  return {
    domains: Object.values(EVENT_DOMAINS),
    priorities: Object.values(EVENT_PRIORITIES),
    roles: ROLES,
    totalEvents: TOTAL_EVENTS,
    totalRules: TOTAL_EVENTS * ROLES.length
  };
}
