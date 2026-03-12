/**
 * SEED NOTIFICATION RULES — Peuplement initial des 492 règles
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Exécuté au démarrage si la collection est vide.
 * Utilise la matrice DEFAULT_RULES + EVENT_METADATA.
 */

import NotificationRule from '../../../models/notifications/NotificationRule.js';
import { EVENT_METADATA } from '../eventRegistry.js';
import { DEFAULT_RULES } from './defaultRules.js';

/**
 * Seed des règles de notification.
 * Ne fait RIEN si des règles existent déjà (sauf force=true).
 *
 * @param {boolean} force - Si true, ignore le check d'existence
 * @returns {number} Nombre de règles créées
 */
export async function seedNotificationRules(force = false) {
  try {
    // Vérifier si des règles existent déjà
    if (!force) {
      const count = await NotificationRule.countDocuments();
      if (count > 0) {
        console.log(`[Seed] ${count} règles existent déjà — seed ignoré`);
        return 0;
      }
    }

    const rules = [];

    for (const [eventName, roleConfigs] of Object.entries(DEFAULT_RULES)) {
      const metadata = EVENT_METADATA[eventName];
      if (!metadata) {
        console.warn(`[Seed] Événement inconnu ignoré: ${eventName}`);
        continue;
      }

      for (const [role, config] of Object.entries(roleConfigs)) {
        rules.push({
          event: eventName,
          role,
          enabled: config.enabled,
          channels: {
            inApp: config.inApp,
            email: config.email,
            whatsapp: config.whatsapp
          },
          eventDomain: metadata.domain,
          eventPriority: metadata.priority,
          eventDescription: metadata.description,
          messageTemplate: {
            titre: metadata.messageTemplate.titre,
            message: metadata.messageTemplate.message
          }
        });
      }
    }

    // Insertion en masse (bien plus performant que 492 insertions individuelles)
    if (rules.length > 0) {
      await NotificationRule.insertMany(rules, { ordered: false });
      console.log(`[Seed] ✅ ${rules.length} règles de notification créées`);
    }

    return rules.length;
  } catch (error) {
    // Si erreur de doublon (force=true sur collection non vide), on continue
    if (error.code === 11000) {
      console.warn('[Seed] Doublons détectés — certaines règles existaient déjà');
      return 0;
    }
    console.error('[Seed] Erreur lors du seed:', error.message);
    throw error;
  }
}
