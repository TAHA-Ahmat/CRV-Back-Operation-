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
 */
export function initializeDailyReportScheduler(app) {
  logger.info('🚀 [Scheduler] Initialisation Daily Report Scheduler...');

  // Calcul du prochain runtime
  const nextRun = calculateNextRunTime();
  const delayMs = nextRun.getTime() - new Date().getTime();
  const delayMinutes = Math.round(delayMs / 1000 / 60);

  logger.info(`⏰ [Scheduler] Prochain rapport: ${nextRun.toLocaleString('fr-FR')} (dans ${delayMinutes} min)`);

  // Premier scheduling
  scheduleNextReport(delayMs);

  return {
    status: 'initialized',
    nextRun: nextRun.toISOString(),
    timezone: TIMEZONE_NDJ,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// CALCULATE NEXT RUN TIME
// ════════════════════════════════════════════════════════════════════════════════

function calculateNextRunTime() {
  // Pour simplifier: utilise l'heure système + offset UTC+1 (NDJ = UTC+1)
  const now = new Date();
  const ndjDate = new Date(now.toLocaleString('fr-FR', { timeZone: TIMEZONE_NDJ }));

  let nextRun = new Date(ndjDate);
  nextRun.setHours(REPORT_TIME.hour, REPORT_TIME.minute, 0, 0);

  // Si l'heure est déjà passée aujourd'hui, scheduler pour demain
  if (nextRun <= new Date()) {
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
      const result = await dailyReporter(reportDate);

      if (result.success) {
        logger.info(`✅ [Scheduler] Rapport quotidien complété:`, {
          crvCount: result.stats.total,
          email: result.emailSent,
        });
      } else {
        logger.error(`❌ [Scheduler] Rapport quotidien échoué:`, {
          error: result.error,
        });
      }
    } catch (error) {
      logger.error(`❌ [Scheduler] Exception lors du rapport:`, {
        error: error.message,
      });
    }

    // Re-scheduler pour demain
    const nextRun = calculateNextRunTime();
    const nextDelay = nextRun.getTime() - new Date().getTime();

    logger.info(`⏰ [Scheduler] Re-scheduling pour ${nextRun.toLocaleString('fr-FR')}`);
    scheduleNextReport(nextDelay);
  }, delayMs);
}

// ════════════════════════════════════════════════════════════════════════════════
// MANUAL TRIGGER (FOR TESTING)
// ════════════════════════════════════════════════════════════════════════════════

export async function triggerDailyReportManually(reportDate) {
  logger.info(`🔫 [Scheduler] Déclenchement manuel du rapport...`);

  try {
    const result = await dailyReporter(reportDate || new Date());
    return result;
  } catch (error) {
    logger.error(`❌ [Scheduler] Erreur déclenchement manuel:`, {
      error: error.message,
    });

    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════════════════════

export default {
  initializeDailyReportScheduler,
  triggerDailyReportManually,
};
