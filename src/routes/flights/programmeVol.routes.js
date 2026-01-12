import express from 'express';
import * as programmeVolController from '../../controllers/flights/programmeVol.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';

/**
 * Rôles opérationnels autorisés pour toutes les actions sur les programmes de vol.
 * QUALITE = lecture seule, ADMIN = pas d'accès métier
 */
const ROLES_OPERATIONNELS = ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER'];

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
 *
 * EXTENSION 1.1 (2026-01-12) - Enrichissement standard programme de vol
 * NON-RÉGRESSION: Nouvelles routes ADDITIVES, routes existantes inchangées
 * - Nouveaux filtres: categorieVol, provenance, destination, nightStop, codeCompagnie
 * - Nouvelles routes: /statistiques/*, /par-route, /resume
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
 * Permissions programmes vol (alignées Frontend c1a724a):
 * - Toutes les actions: Tous les opérationnels (AGENT, CHEF, SUPERVISEUR, MANAGER)
 * - Lecture: Tous (y compris QUALITE)
 * - QUALITE: Lecture seule uniquement
 * - ADMIN: Pas d'accès métier
 */

// ========== ROUTES CRUD DE BASE ==========

/**
 * @route   POST /api/programmes-vol
 * @desc    Créer un nouveau programme vol saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol, remarques }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/', protect, excludeQualite, programmeVolController.creerProgramme);

/**
 * @route   GET /api/programmes-vol
 * @desc    Récupérer tous les programmes vol avec filtres optionnels
 * @access  Private (Tous: opérationnels + QUALITE)
 * @query   compagnieAerienne, statut, actif, dateDebut, dateFin
 * @query   EXTENSION 1.1: categorieVol, provenance, destination, nightStop, codeCompagnie
 */
router.get('/', protect, programmeVolController.obtenirProgrammes);

// ========== EXTENSION 1.1 - ROUTES STATISTIQUES ET RECHERCHE ==========
// IMPORTANT: Ces routes DOIVENT être AVANT /:id pour éviter les conflits

/**
 * @route   GET /api/programmes-vol/resume
 * @desc    Obtenir un résumé complet du programme de vol
 * @access  Private (Tous: opérationnels + QUALITE)
 */
router.get('/resume', protect, programmeVolController.obtenirResumeProgramme);

/**
 * @route   GET /api/programmes-vol/par-route
 * @desc    Trouver les programmes par route (provenance/destination)
 * @access  Private (Tous: opérationnels + QUALITE)
 * @query   provenance - Code IATA origine (optionnel)
 * @query   destination - Code IATA destination (optionnel)
 * @query   categorieVol - PASSAGER, CARGO, DOMESTIQUE (optionnel)
 */
router.get('/par-route', protect, programmeVolController.trouverParRoute);

/**
 * @route   GET /api/programmes-vol/statistiques/categories
 * @desc    Obtenir les statistiques par catégorie de vol
 * @access  Private (Tous: opérationnels + QUALITE)
 */
router.get('/statistiques/categories', protect, programmeVolController.obtenirStatistiquesParCategorie);

/**
 * @route   GET /api/programmes-vol/statistiques/jours
 * @desc    Obtenir les statistiques par jour de la semaine
 * @access  Private (Tous: opérationnels + QUALITE)
 */
router.get('/statistiques/jours', protect, programmeVolController.obtenirStatistiquesParJour);

// ========== FIN EXTENSION 1.1 ==========

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
// 🔒 P0-1: QUALITE exclu
router.patch('/:id', protect, excludeQualite, programmeVolController.mettreAJourProgramme);

/**
 * @route   DELETE /api/programmes-vol/:id
 * @desc    Supprimer un programme vol saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 */
router.delete('/:id', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.supprimerProgramme);

// ========== ROUTES D'ACTIONS SPÉCIFIQUES ==========

/**
 * @route   POST /api/programmes-vol/:id/valider
 * @desc    Valider un programme vol saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 */
router.post('/:id/valider', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.validerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/activer
 * @desc    Activer un programme vol saisonnier validé
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 */
router.post('/:id/activer', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.activerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/suspendre
 * @desc    Suspendre un programme vol saisonnier actif
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @params  id - ID du programme
 * @body    { raison } (optionnel)
 */
router.post('/:id/suspendre', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.suspendreProgramme);

// ========== ROUTES DE RECHERCHE ET IMPORT ==========

/**
 * @route   GET /api/programmes-vol/applicables/:date
 * @desc    Trouver les programmes applicables pour une date donnée
 * @access  Private (Tous: opérationnels + QUALITE)
 * @params  date - Date au format ISO (YYYY-MM-DD)
 * @query   compagnieAerienne (optionnel)
 * @query   EXTENSION 1.1: categorieVol - PASSAGER, CARGO, DOMESTIQUE (optionnel)
 */
router.get('/applicables/:date', protect, programmeVolController.trouverProgrammesApplicables);

/**
 * @route   POST /api/programmes-vol/import
 * @desc    Importer plusieurs programmes depuis un fichier JSON
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { programmes: [...] }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/import', protect, excludeQualite, programmeVolController.importerProgrammes);

export default router;
