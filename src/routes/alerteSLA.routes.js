import express from 'express';
import {
  verifierSLACRV,
  verifierSLAPhase,
  surveillerCRV,
  surveillerPhases,
  obtenirRapportSLA,
  obtenirConfiguration,
  configurerSLA
} from '../controllers/alerteSLA.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

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
 * IMPORTANT: Toutes les routes nécessitent l'authentification JWT
 * Le middleware protect ajoute req.user avec les informations de l'utilisateur connecté
 */

// ========== ROUTES NON-PARAMÉTRISÉES (avant /:id) ==========

/**
 * @route   GET /api/sla/rapport
 * @desc    Obtenir le rapport SLA complet (CRV + Phases)
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/rapport', protect, authorize('MANAGER', 'ADMIN'), obtenirRapportSLA);

/**
 * @route   GET /api/sla/configuration
 * @desc    Obtenir la configuration SLA actuelle
 * @access  Private
 */
router.get('/configuration', protect, obtenirConfiguration);

/**
 * @route   PUT /api/sla/configuration
 * @desc    Configurer les SLA personnalisés
 * @access  Private (ADMIN)
 * @body    { CRV: {...}, PHASE: {...} }
 */
router.put('/configuration', protect, authorize('ADMIN'), configurerSLA);

/**
 * @route   POST /api/sla/surveiller/crv
 * @desc    Surveiller tous les CRV actifs et envoyer des alertes
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/surveiller/crv', protect, authorize('MANAGER', 'ADMIN'), surveillerCRV);

/**
 * @route   POST /api/sla/surveiller/phases
 * @desc    Surveiller toutes les phases actives et envoyer des alertes
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/surveiller/phases', protect, authorize('MANAGER', 'ADMIN'), surveillerPhases);

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
