/**
 * Daily Report Scheduler
 *
 * Déclenche Agent 4 (Daily Reporter) chaque jour à 21:00 NDJ
 *
 * Implementation: Node.js setTimeout (simple) au lieu de node-cron
 * Raison: Moins de dépendances, fonctionne out-of-the-box
 *
 * TODO: Remplacer par node-cron si plus de jobs cron requis
 */

import { dailyReporter } from '../agents/dailyReporter.agent.js';
import logger from '../config/logger.js';

// ════════════════════════════════════════════════════════════════════════════════
// SCHEDULER CONFIG
// ════════════════════════════════════════════════════════════════════════════════

const TIMEZONE_NDJ = 'Africa/Ndjamena';
const REPORT_TIME = { hour: 21, minute: 0 }; // 21:00 NDJ = 12:00 UTC

let reportScheduler = null;

// ════════════════════════════════════════════════════════════════════════════════
// INITIALIZE SCHEDULER
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Initialise le scheduler et déclenche le rapport quotidien
 * @param {Express} app - Express app (optionnel, pour context)
 * @returns {Object} Status du scheduler
 */
export function initializeDailyReportScheduler(app) {
  try {
    logger.info(`🚀 [Scheduler] Initialisation Daily Report Scheduler...`);

    const nextRun = calculateNextRunTime();
    const now = new Date();
    const delayMs = nextRun.getTime() - now.getTime();
    const delayMinutes = Math.round(delayMs / 60000);

    logger.info(`⏰ [Scheduler] Prochain rapport: ${nextRun.toLocaleString('fr-FR', { timeZone: TIMEZONE_NDJ })} (dans ${delayMinutes} min)`);

    // Premier scheduling
    scheduleNextReport(delayMs);

    return {
      status: 'initialized',
      nextRun: nextRun.toISOString(),
      timezone: TIMEZONE_NDJ,
    };
  } catch (error) {
    logger.error('[Scheduler] Erreur initialisation:', error.message);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// CALCULATE NEXT RUN TIME
// ════════════════════════════════════════════════════════════════════════════════

function calculateNextRunTime() {
  // UTC+1 offset (NDJ timezone)
  const UTC_OFFSET_MINUTES = 60;
  
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ndjMs = utcMs + UTC_OFFSET_MINUTES * 60000;
  const ndjDate = new Date(ndjMs);

  let nextRun = new Date(ndjMs);
  nextRun.setHours(REPORT_TIME.hour, REPORT_TIME.minute, 0, 0);

  // Si l'heure est déjà passée aujourd'hui, scheduler pour demain
  if (nextRun.getTime() <= ndjMs) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

// ════════════════════════════════════════════════════════════════════════════════
// SCHEDULE NEXT REPORT
// ════════════════════════════════════════════════════════════════════════════════

function scheduleNextReport(delayMs) {
  // Annuler le timeout précédent s'il existe
  if (reportScheduler) {
    clearTimeout(reportScheduler);
  }

  reportScheduler = setTimeout(async () => {
    const reportDate = new Date();

    logger.info(`📋 [Scheduler] Déclenchement rapport quotidien...`);

    try {
      // Exécuter Agent 4
      await dailyReporter();
      logger.info(`✅ [Scheduler] Rapport généré avec succès`);
    } catch (error) {
      logger.error(`❌ [Scheduler] Erreur génération rapport:`, error.message);
    }

    // Reschedule pour le prochain jour
    const nextDelay = 24 * 60 * 60 * 1000; // 24h
    scheduleNextReport(nextDelay);
  }, delayMs);
}

/**
 * Arrête le scheduler
 */
export function stopDailyReportScheduler() {
  if (reportScheduler) {
    clearTimeout(reportScheduler);
    reportScheduler = null;
    logger.info(`⏹️  [Scheduler] Daily Report Scheduler arrêté`);
  }
}

/**
 * Déclenche manuellement un rapport (pour tests/admin)
 * @param {Date} reportDate - Date du rapport
 * @returns {Object} Résultat du rapport
 */
export async function triggerDailyReportManually(reportDate = new Date()) {
  try {
    logger.info(`📋 [Manual Trigger] Déclenchement rapport manuel...`);
    const result = await dailyReporter();
    logger.info(`✅ [Manual Trigger] Rapport généré avec succès`);
    return result;
  } catch (error) {
    logger.error(`❌ [Manual Trigger] Erreur:`, error.message);
    throw error;
  }
}
