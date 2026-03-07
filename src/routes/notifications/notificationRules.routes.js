/**
 * NOTIFICATION RULES ROUTES — API Admin pour la matrice de notification
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Toutes les routes sont protégées ADMIN uniquement.
 *
 * AUCUNE MODIFICATION DES ROUTES EXISTANTES.
 * Nouvel endpoint: /api/notification-rules/*
 */

import express from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import {
  getMatrix,
  getMetadata,
  getStats,
  getRulesForEvent,
  updateRule,
  bulkUpdateEvent,
  toggleDomain,
  resetToDefaults
} from '../../controllers/notifications/notificationRules.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// Toutes les routes: ADMIN uniquement
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/notification-rules/metadata
 * @desc    Retourne domaines, priorités, rôles (config frontend)
 * @access  ADMIN
 */
router.get('/metadata', protect, authorize('ADMIN'), getMetadata);

/**
 * @route   GET /api/notification-rules/stats
 * @desc    Statistiques du module notification
 * @access  ADMIN
 */
router.get('/stats', protect, authorize('ADMIN'), getStats);

/**
 * @route   GET /api/notification-rules/event/:eventName
 * @desc    Récupère les 6 règles d'un événement (1 par rôle)
 * @access  ADMIN
 */
router.get('/event/:eventName', protect, authorize('ADMIN'), getRulesForEvent);

/**
 * @route   PUT /api/notification-rules/event/:eventName/bulk
 * @desc    Mise à jour en masse des règles d'un événement
 * @access  ADMIN
 * @body    { rules: [{ role, enabled, channels }] }
 */
router.put('/event/:eventName/bulk', protect, authorize('ADMIN'), bulkUpdateEvent);

/**
 * @route   PUT /api/notification-rules/domain/:domain/toggle
 * @desc    Active/Désactive toutes les règles d'un domaine
 * @access  ADMIN
 * @body    { enabled: true/false }
 */
router.put('/domain/:domain/toggle', protect, authorize('ADMIN'), toggleDomain);

/**
 * @route   POST /api/notification-rules/reset
 * @desc    Réinitialise toutes les règles aux valeurs par défaut
 * @access  ADMIN
 */
router.post('/reset', protect, authorize('ADMIN'), resetToDefaults);

/**
 * @route   GET /api/notification-rules
 * @desc    Matrice complète (avec filtres optionnels)
 * @access  ADMIN
 * @query   domain, priority, role, enabled
 */
router.get('/', protect, authorize('ADMIN'), getMatrix);

/**
 * @route   PUT /api/notification-rules/:id
 * @desc    Met à jour une règle individuelle
 * @access  ADMIN
 * @body    { enabled?, channels?, messageTemplate? }
 */
router.put('/:id', protect, authorize('ADMIN'), updateRule);

export default router;
