/**
 * NOTIFICATION RULES CONTROLLER — API Admin pour la gestion des règles
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * 7 endpoints ADMIN-only.
 *
 * AUCUNE MODIFICATION DES CONTROLLERS EXISTANTS.
 */

import * as rulesService from '../../services/notifications/notificationRules.service.js';

/**
 * GET /api/notification-rules
 * Récupère la matrice complète (avec filtres optionnels).
 * @query domain, priority, role, enabled
 */
export const getMatrix = async (req, res) => {
  try {
    const rules = await rulesService.getMatrix(req.query);
    res.json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    console.error('[NotificationRulesCtrl] getMatrix:', error.message);
    res.status(500).json({ success: false, message: 'Erreur récupération matrice', error: error.message });
  }
};

/**
 * GET /api/notification-rules/metadata
 * Retourne les métadonnées (domaines, priorités, rôles).
 */
export const getMetadata = async (req, res) => {
  try {
    const metadata = rulesService.getMetadata();
    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('[NotificationRulesCtrl] getMetadata:', error.message);
    res.status(500).json({ success: false, message: 'Erreur métadonnées', error: error.message });
  }
};

/**
 * GET /api/notification-rules/stats
 * Retourne les statistiques du module.
 */
export const getStats = async (req, res) => {
  try {
    const stats = await rulesService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[NotificationRulesCtrl] getStats:', error.message);
    res.status(500).json({ success: false, message: 'Erreur statistiques', error: error.message });
  }
};

/**
 * GET /api/notification-rules/event/:eventName
 * Récupère les 6 règles d'un événement.
 */
export const getRulesForEvent = async (req, res) => {
  try {
    const rules = await rulesService.getRulesForEvent(req.params.eventName);
    if (!rules || rules.length === 0) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }
    res.json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    console.error('[NotificationRulesCtrl] getRulesForEvent:', error.message);
    res.status(500).json({ success: false, message: 'Erreur récupération règles', error: error.message });
  }
};

/**
 * PUT /api/notification-rules/:id
 * Met à jour une règle individuelle.
 * @body { enabled?, channels?: { inApp?, email?, whatsapp? }, messageTemplate? }
 */
export const updateRule = async (req, res) => {
  try {
    const rule = await rulesService.updateRule(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: rule });
  } catch (error) {
    console.error('[NotificationRulesCtrl] updateRule:', error.message);
    if (error.message === 'Règle non trouvée') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur mise à jour', error: error.message });
  }
};

/**
 * PUT /api/notification-rules/event/:eventName/bulk
 * Mise à jour en masse des 6 règles d'un événement.
 * @body { rules: [{ role, enabled, channels }] }
 */
export const bulkUpdateEvent = async (req, res) => {
  try {
    const { rules } = req.body;
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ success: false, message: 'Le champ rules (array) est requis' });
    }
    const result = await rulesService.bulkUpdateEvent(req.params.eventName, rules, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[NotificationRulesCtrl] bulkUpdateEvent:', error.message);
    res.status(500).json({ success: false, message: 'Erreur mise à jour en masse', error: error.message });
  }
};

/**
 * PUT /api/notification-rules/domain/:domain/toggle
 * Active/Désactive tout un domaine.
 * @body { enabled: true/false }
 */
export const toggleDomain = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (enabled === undefined) {
      return res.status(400).json({ success: false, message: 'Le champ enabled est requis' });
    }
    const result = await rulesService.toggleDomain(req.params.domain, enabled, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[NotificationRulesCtrl] toggleDomain:', error.message);
    res.status(500).json({ success: false, message: 'Erreur toggle domaine', error: error.message });
  }
};

/**
 * POST /api/notification-rules/reset
 * Réinitialise toutes les règles aux valeurs par défaut.
 */
export const resetToDefaults = async (req, res) => {
  try {
    const result = await rulesService.resetToDefaults(req.user._id);
    res.json({ success: true, message: 'Règles réinitialisées', data: result });
  } catch (error) {
    console.error('[NotificationRulesCtrl] resetToDefaults:', error.message);
    res.status(500).json({ success: false, message: 'Erreur réinitialisation', error: error.message });
  }
};
