import express from 'express';
import {
  verifierSLACRV,
  verifierSLAPhase,
  surveillerCRV,
  surveillerPhases,
  obtenirRapportSLA,
  obtenirConfiguration,
  configurerSLA
} from '../../controllers/notifications/alerteSLA.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';

/**
 * EXTENSION 8 - Routes Alertes SLA (Service alertes SLA proactives)
 *
 * Routes NOUVELLES pour gérer les alertes SLA.
 *
 * NON-RÉGRESSION: Ces routes sont NOUVELLES.
 * - Aucune route existante n'est modifiée
 * - Ces routes ajoutent des endpoints pour la surveillance SLA
 *
 * Ces routes gèrent le nouveau endpoint /api/sla/* pour l'extension 8.
 */

const router = express.Router();

/**
 * 🔒 PHASE 1 AJUSTÉE - Référentiel officiel
 *
 * SLA = Décisions de gestion opérationnelle (MANAGER)
 * QUALITE: Lecture des rapports SLA, configuration, vérifications
 */

// ========== ROUTES NON-PARAMÉTRISÉES (avant /:id) ==========

/**
 * @route   GET /api/sla/rapport
 * @desc    Obtenir le rapport SLA complet (CRV + Phases)
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 */
router.get('/rapport', protect, authorize('MANAGER'), obtenirRapportSLA);

/**
 * @route   GET /api/sla/configuration
 * @desc    Obtenir la configuration SLA actuelle
 * @access  Private (Tous: opérationnels + QUALITE)
 */
router.get('/configuration', protect, obtenirConfiguration);

/**
 * @route   PUT /api/sla/configuration
 * @desc    Configurer les SLA personnalisés
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 * @body    { CRV: {...}, PHASE: {...} }
 */
router.put('/configuration', protect, authorize('MANAGER'), configurerSLA);

/**
 * @route   POST /api/sla/surveiller/crv
 * @desc    Surveiller tous les CRV actifs et envoyer des alertes
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 */
router.post('/surveiller/crv', protect, authorize('MANAGER'), surveillerCRV);

/**
 * @route   POST /api/sla/surveiller/phases
 * @desc    Surveiller toutes les phases actives et envoyer des alertes
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 */
router.post('/surveiller/phases', protect, authorize('MANAGER'), surveillerPhases);

// ========== ROUTES PARAMÉTRISÉES (après /:id) ==========

/**
 * @route   GET /api/sla/crv/:id
 * @desc    Vérifier le SLA d'un CRV spécifique
 * @access  Private
 */
router.get('/crv/:id', protect, verifierSLACRV);

/**
 * @route   GET /api/sla/phase/:id
 * @desc    Vérifier le SLA d'une phase spécifique
 * @access  Private
 */
router.get('/phase/:id', protect, verifierSLAPhase);

export default router;
