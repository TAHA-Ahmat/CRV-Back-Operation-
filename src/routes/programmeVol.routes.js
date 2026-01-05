import express from 'express';
import * as programmeVolController from '../controllers/programmeVol.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

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
 * IMPORTANT: Toutes les routes nécessitent l'authentification JWT
 * Le middleware verifyToken ajoute req.user avec les informations de l'utilisateur connecté
 */

// ========== ROUTES CRUD DE BASE ==========

/**
 * @route   POST /api/programmes-vol
 * @desc    Créer un nouveau programme vol saisonnier
 * @access  Private (Utilisateur authentifié)
 * @body    { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol, remarques }
 */
router.post('/', verifyToken, programmeVolController.creerProgramme);

/**
 * @route   GET /api/programmes-vol
 * @desc    Récupérer tous les programmes vol avec filtres optionnels
 * @access  Private (Utilisateur authentifié)
 * @query   compagnieAerienne, statut, actif, dateDebut, dateFin
 */
router.get('/', verifyToken, programmeVolController.obtenirProgrammes);

/**
 * @route   GET /api/programmes-vol/:id
 * @desc    Récupérer un programme vol par son ID
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 */
router.get('/:id', verifyToken, programmeVolController.obtenirProgrammeParId);

/**
 * @route   PATCH /api/programmes-vol/:id
 * @desc    Mettre à jour un programme vol saisonnier
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 * @body    Champs à mettre à jour
 */
router.patch('/:id', verifyToken, programmeVolController.mettreAJourProgramme);

/**
 * @route   DELETE /api/programmes-vol/:id
 * @desc    Supprimer un programme vol saisonnier
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 */
router.delete('/:id', verifyToken, programmeVolController.supprimerProgramme);

// ========== ROUTES D'ACTIONS SPÉCIFIQUES ==========

/**
 * @route   POST /api/programmes-vol/:id/valider
 * @desc    Valider un programme vol saisonnier
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 */
router.post('/:id/valider', verifyToken, programmeVolController.validerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/activer
 * @desc    Activer un programme vol saisonnier validé
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 */
router.post('/:id/activer', verifyToken, programmeVolController.activerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/suspendre
 * @desc    Suspendre un programme vol saisonnier actif
 * @access  Private (Utilisateur authentifié)
 * @params  id - ID du programme
 * @body    { raison } (optionnel)
 */
router.post('/:id/suspendre', verifyToken, programmeVolController.suspendreProgramme);

// ========== ROUTES DE RECHERCHE ET IMPORT ==========

/**
 * @route   GET /api/programmes-vol/applicables/:date
 * @desc    Trouver les programmes applicables pour une date donnée
 * @access  Private (Utilisateur authentifié)
 * @params  date - Date au format ISO (YYYY-MM-DD)
 * @query   compagnieAerienne (optionnel)
 */
router.get('/applicables/:date', verifyToken, programmeVolController.trouverProgrammesApplicables);

/**
 * @route   POST /api/programmes-vol/import
 * @desc    Importer plusieurs programmes depuis un fichier JSON
 * @access  Private (Utilisateur authentifié)
 * @body    { programmes: [...] }
 */
router.post('/import', verifyToken, programmeVolController.importerProgrammes);

export default router;
