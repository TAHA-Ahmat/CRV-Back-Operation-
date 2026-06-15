/**
 * Agent Routes
 *
 * API endpoints pour tester les agents manuellement
 * Usage: POST /api/agents/daily-report (déclenche rapport quotidien immédiatement)
 */

import express from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { triggerDailyReportManually } from '../../jobs/dailyReportScheduler.js';
import logger from '../../config/logger.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════════════════════════
// AGENT 4: DAILY REPORT — Manual Trigger
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/agents/daily-report
 * @desc    Déclenche manuellement le rapport quotidien (testing/admin)
 * @access  Private (SUPERVISEUR, MANAGER only)
 * @query   date (optional) - ISO date string, default: today
 * @body    { date?: "2026-06-14" }
 * @return  { success: bool, timestamp: ISO, stats: {...} }
 */
router.post('/daily-report', protect, authorize('SUPERVISEUR', 'MANAGER'), async (req, res) => {
  try {
    const reportDate = req.body.date
      ? new Date(req.body.date)
      : new Date();

    logger.info(`🔫 [API] Manuel trigger Daily Report pour ${reportDate.toISOString()}`, {
      user: req.user.id,
      role: req.user.role,
    });

    const result = await triggerDailyReportManually(reportDate);

    res.json({
      success: true,
      message: 'Rapport quotidien déclenché avec succès',
      timestamp: new Date().toISOString(),
      reportDate: reportDate.toISOString(),
      stats: result.stats,
      emailSent: result.emailSent,
      driveUploaded: result.driveUploaded || false,
    });
  } catch (error) {
    logger.error(`❌ [API] Erreur Daily Report trigger`, {
      error: error.message,
      user: req.user.id,
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors du déclenchement du rapport',
      error: error.message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// AGENT 4: Status Endpoint
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/agents/status
 * @desc    Obtient le statut des agents
 * @access  Private
 * @return  { agents: { dailyReporter: { status, nextRun } } }
 */
router.get('/status', protect, (req, res) => {
  res.json({
    agents: {
      dailyReporter: {
        status: 'initialized',
        schedule: '21:00 NDJ (12:00 UTC)',
        description: 'Rapport quotidien automatique',
        contact: 'madmit@madmit.com',
      },
      phaseValidator: {
        status: 'planned',
        description: 'Validateur cohérence phases (TODO)',
      },
      slaAnomalyDetector: {
        status: 'planned',
        description: 'Détecteur anomalies SLA (TODO)',
      },
      horaireS uggestor: {
        status: 'planned',
        description: 'Suggesteur horaires (TODO)',
      },
    },
  });
});

export default router;
