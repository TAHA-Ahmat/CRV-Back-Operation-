/**
 * INIT NOTIFICATION ENGINE — Initialisation au démarrage du serveur
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Appelé une seule fois après connexion MongoDB.
 * 1. Seed des règles si collection vide
 * 2. Enregistrement des listeners sur l'EventBus
 */

import { eventBus } from './notificationEngine.js';
import { registerListeners } from './notificationRouter.service.js';
import { seedNotificationRules } from './seed/seedNotificationRules.js';
import opsStream from '../ops/opsStream.service.js';

let _initialized = false;

/**
 * Initialise le module de notification.
 * Idempotent — ne s'exécute qu'une seule fois.
 */
export async function initNotificationEngine() {
  if (_initialized) {
    console.log('[NotificationEngine] Déjà initialisé — skip');
    return;
  }

  try {
    console.log('[NotificationEngine] Initialisation...');

    // 1. Seed des règles si collection vide
    const seeded = await seedNotificationRules(false);
    if (seeded > 0) {
      console.log(`[NotificationEngine] ${seeded} règles seedées`);
    }

    // 2. Enregistrer les listeners sur l'EventBus
    const listenerCount = await registerListeners(eventBus);
    console.log(`[NotificationEngine] ${listenerCount} listeners actifs`);

    // 3. Initialiser le flux OPS (subscriber passif sur l'EventBus)
    opsStream.init(eventBus);
    console.log('[OPS] Stream service initialized');

    // 4. Marquer comme initialisé
    eventBus.markInitialized();
    _initialized = true;

    console.log('[NotificationEngine] ✅ Module notification prêt');
  } catch (error) {
    console.error('[NotificationEngine] ❌ Erreur initialisation:', error.message);
    // NE PAS planter le serveur — le module notification est optionnel
  }
}
