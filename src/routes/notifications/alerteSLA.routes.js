import express from 'express';
import {
  verifierSLACRV,
  verifierSLAPhase,
  surveillerCRV,
  surveillerPhases,
  obtenirRapportSLA,
  obtenirConfiguration,
  listerSLACompagnies,
  obtenirSLACompagnie,
  upsertSLACompagnie,
  supprimerSLACompagnie
} from '../../controllers/notifications/alerteSLA.controller.js';
import { exporterConformiteSLA } from '../../controllers/notifications/slaConformite.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { resolveAircraftCategory, getAircraftMapping } from '../../services/sla/aircraftCategoryMapping.js';

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

// PUT /api/sla/configuration supprimé — la config SLA passe par CRUD /api/sla/compagnies/:codeIATA

/**
 * @route   GET /api/sla/conformite/export
 * @desc    BUX-1 — Export agrégé conformité SLA par période (JSON + CSV)
 *          Query params : dateDebut, dateFin (ISO), codeIATA (optionnel), format (json|csv)
 * @access  Private (QUALITE, MANAGER, SUPERVISEUR)
 */
router.get('/conformite/export', protect, authorize('QUALITE', 'MANAGER', 'SUPERVISEUR'), exporterConformiteSLA);

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

// ========== SLA PAR COMPAGNIE ==========

/**
 * @route   GET /api/sla/compagnies
 * @desc    Lister toutes les configs SLA par compagnie
 * @access  Private (tous les opérationnels)
 */
router.get('/compagnies', protect, listerSLACompagnies);

/**
 * @route   GET /api/sla/compagnies/:codeIATA
 * @desc    Config SLA d'une compagnie
 * @access  Private
 */
router.get('/compagnies/:codeIATA', protect, obtenirSLACompagnie);

/**
 * @route   PUT /api/sla/compagnies/:codeIATA
 * @desc    Créer ou mettre à jour une config SLA compagnie
 * @access  Private (MANAGER)
 */
router.put('/compagnies/:codeIATA', protect, authorize('MANAGER'), upsertSLACompagnie);

/**
 * @route   DELETE /api/sla/compagnies/:codeIATA
 * @desc    Supprimer une config SLA compagnie
 * @access  Private (MANAGER)
 */
router.delete('/compagnies/:codeIATA', protect, authorize('MANAGER'), supprimerSLACompagnie);

// ========== RÉFÉRENTIEL AVION (lecture seule) ==========

/**
 * @route   GET /api/sla/aircraft-mapping
 * @desc    Référentiel type avion → catégorie (narrow/wide)
 * @access  Private (tous)
 */
router.get('/aircraft-mapping', protect, (req, res) => {
  res.status(200).json({ success: true, data: getAircraftMapping() });
});

/**
 * @route   GET /api/sla/aircraft-category/:typeAvion
 * @desc    Résoudre un type avion vers sa catégorie
 * @access  Private (tous)
 */
router.get('/aircraft-category/:typeAvion', protect, (req, res) => {
  const result = resolveAircraftCategory(req.params.typeAvion);
  res.status(200).json({ success: true, data: result });
});

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
