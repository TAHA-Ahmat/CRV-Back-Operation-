import express from 'express';
import * as programmeVolController from '../controllers/programmeVol.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

/**
 * EXTENSION 1 - Routes Programme vol saisonnier
 *
 * Routes NOUVELLES et INDÉPENDANTES pour gérer les programmes de vols récurrents.
 *
 * NON-RÉGRESSION: Ces routes sont NOUVELLES et n'affectent AUCUNE route existante.
 * - /api/crv/* reste inchangé
 * - /api/vol/* (si existe) reste inchangé
 * - /api/phase/* reste inchangé
 * - Toutes les routes existantes continuent de fonctionner exactement comme avant
 *
 * Ces routes gèrent UNIQUEMENT le nouveau endpoint /api/programmes-vol/*
 */

const router = express.Router();

/**
 * 🔒 PHASE 1 AJUSTÉE - Référentiel officiel
 *
 * PRINCIPE FONDAMENTAL:
 * AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER ont le MÊME périmètre opérationnel.
 * La différence est dans la RESPONSABILITÉ et la LÉGITIMITÉ, pas dans l'action.
 *
 * Rôles actifs:
 * - AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER: Périmètre opérationnel unifié
 * - QUALITE: Lecture seule complète (observation, analyse, rapports)
 *
 * Rôle gelé:
 * - ADMIN: Technique uniquement (configuration système, pas métier)
 *
 * Permissions programmes vol:
 * - Création/Modification/Suspension: Tous les opérationnels (AGENT, CHEF, SUPERVISEUR, MANAGER)
 * - Validation/Activation: Décision critique → SUPERVISEUR, MANAGER uniquement
 * - Suppression: Décision critique → MANAGER uniquement
 * - Lecture: Tous (y compris QUALITE)
 */

// ========== ROUTES CRUD DE BASE ==========

/**
 * @route   POST /api/programmes-vol
 * @desc    Créer un nouveau programme vol saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol, remarques }
 */
router.post('/', protect, programmeVolController.creerProgramme);

/**
 * @route   GET /api/programmes-vol
 * @desc    Récupérer tous les programmes vol avec filtres optionnels
 * @access  Private (Tous: opérationnels + QUALITE)
 * @query   compagnieAerienne, statut, actif, dateDebut, dateFin
 */
router.get('/', protect, programmeVolController.obtenirProgrammes);

/**
 * @route   GET /api/programmes-vol/:id
 * @desc    Récupérer un programme vol par son ID
 * @access  Private (Tous: opérationnels + QUALITE)
 * @params  id - ID du programme
 */
router.get('/:id', protect, programmeVolController.obtenirProgrammeParId);

/**
 * @route   PATCH /api/programmes-vol/:id
 * @desc    Mettre à jour un programme vol saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 * @body    Champs à mettre à jour
 */
router.patch('/:id', protect, programmeVolController.mettreAJourProgramme);

/**
 * @route   DELETE /api/programmes-vol/:id
 * @desc    Supprimer un programme vol saisonnier
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 * @params  id - ID du programme
 */
router.delete('/:id', protect, authorize('MANAGER'), programmeVolController.supprimerProgramme);

// ========== ROUTES D'ACTIONS SPÉCIFIQUES ==========

/**
 * @route   POST /api/programmes-vol/:id/valider
 * @desc    Valider un programme vol saisonnier
 * @access  Private (DÉCISION CRITIQUE: SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 */
router.post('/:id/valider', protect, authorize('SUPERVISEUR', 'MANAGER'), programmeVolController.validerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/activer
 * @desc    Activer un programme vol saisonnier validé
 * @access  Private (DÉCISION CRITIQUE: SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 */
router.post('/:id/activer', protect, authorize('SUPERVISEUR', 'MANAGER'), programmeVolController.activerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/suspendre
 * @desc    Suspendre un programme vol saisonnier actif
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 * @body    { raison } (optionnel)
 */
router.post('/:id/suspendre', protect, programmeVolController.suspendreProgramme);

// ========== ROUTES DE RECHERCHE ET IMPORT ==========

/**
 * @route   GET /api/programmes-vol/applicables/:date
 * @desc    Trouver les programmes applicables pour une date donnée
 * @access  Private (Tous: opérationnels + QUALITE)
 * @params  date - Date au format ISO (YYYY-MM-DD)
 * @query   compagnieAerienne (optionnel)
 */
router.get('/applicables/:date', protect, programmeVolController.trouverProgrammesApplicables);

/**
 * @route   POST /api/programmes-vol/import
 * @desc    Importer plusieurs programmes depuis un fichier JSON
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { programmes: [...] }
 */
router.post('/import', protect, programmeVolController.importerProgrammes);

export default router;
