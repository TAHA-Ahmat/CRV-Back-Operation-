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
import { nettoyerNotificationsExpirees } from './notification.service.js';
import { surveillerTousCRV } from './alerteSLA.service.js';
import opsStream from '../ops/opsStream.service.js';

let _initialized = false;
let _cleanupInterval = null;
let _slaInterval = null;

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

    // 4. Cron nettoyage des notifications expirées (toutes les 6h)
    if (!_cleanupInterval) {
      _cleanupInterval = setInterval(async () => {
        try {
          await nettoyerNotificationsExpirees();
        } catch (err) {
          console.error('[NotificationEngine] Erreur cron nettoyage:', err.message);
        }
      }, 6 * 60 * 60 * 1000); // 6h
      _cleanupInterval.unref(); // ne pas empêcher l'arrêt du process
      console.log('[NotificationEngine] Cron nettoyage actif (toutes les 6h)');
    }

    // 5. Cron surveillance SLA (toutes les 5 min — réduit depuis 30min pour alertes proactives)
    if (!_slaInterval) {
      _slaInterval = setInterval(async () => {
        try {
          const result = await surveillerTousCRV();
          if (result.statistiques.enAlerte > 0) {
            console.log(`[SLA Cron] ${result.statistiques.enAlerte} CRV en alerte (${result.statistiques.alertesEnvoyees} alertes envoyées)`);
          }
        } catch (err) {
          console.error('[SLA Cron] Erreur surveillance:', err.message);
        }
      }, 5 * 60 * 1000); // 5min (Palier 3 — alertes proactives)
      _slaInterval.unref();
      console.log('[SLA] Cron surveillance actif (toutes les 5min)');
    }

    // 6. Log diagnostic démarrage
    try {
      const NotificationRule = (await import('../../models/notifications/NotificationRule.js')).default;
      const emailRuleCount = await NotificationRule.countDocuments({ enabled: true, 'channels.email': true });
      const whatsappRuleCount = await NotificationRule.countDocuments({ enabled: true, 'channels.whatsapp': true });
      const emailProvider = process.env.SENDGRID_API_KEY ? 'SendGrid' : (process.env.SMTP_HOST ? 'SMTP' : 'test (aucun)');
      console.log(`[NotificationEngine] Email: ${emailProvider} | ${emailRuleCount} rules email | ${whatsappRuleCount} rules WA (stub) | Cron: nettoyage+SLA`);
    } catch { /* non-bloquant */ }

    // 7. Marquer comme initialisé
    eventBus.markInitialized();
    _initialized = true;

    console.log('[NotificationEngine] ✅ Module notification prêt');
  } catch (error) {
    console.error('[NotificationEngine] ❌ Erreur initialisation:', error.message);
    // NE PAS planter le serveur — le module notification est optionnel
  }
}
