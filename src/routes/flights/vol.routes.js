import express from 'express';
import { body } from 'express-validator';
import {
  creerVol,
  obtenirVol,
  listerVols,
  mettreAJourVol
} from '../../controllers/flights/vol.controller.js';
// EXTENSION 2 - Import du nouveau contrôleur pour vols programmés/hors programme
import * as volProgrammeController from '../../controllers/flights/volProgramme.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

const router = express.Router();

// 🔒 PHASE 1 AJUSTÉE - Périmètre opérationnel unifié (AGENT, CHEF, SUPERVISEUR, MANAGER)
// 🔒 P0-1: QUALITE exclu
router.post('/', protect, excludeQualite, [
  body('numeroVol').notEmpty().withMessage('Numéro de vol requis'),
  body('typeOperation').isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND']).withMessage('Type d\'opération invalide'),
  body('compagnieAerienne').notEmpty().withMessage('Compagnie aérienne requise'),
  body('codeIATA').isLength({ min: 2, max: 2 }).withMessage('Code IATA invalide'),
  body('dateVol').isISO8601().withMessage('Date de vol invalide'),
  validate
], creerVol);

router.get('/', protect, listerVols);

router.get('/:id', protect, obtenirVol);

// 🔒 P0-1: QUALITE exclu
router.patch('/:id', protect, excludeQualite, mettreAJourVol);

// ========== EXTENSION 2 - Routes pour distinction vol programmé / hors programme ==========
// NON-RÉGRESSION: Ces routes sont NOUVELLES et n'affectent AUCUNE route existante ci-dessus

/**
 * @route   POST /api/vols/:id/lier-programme
 * @desc    Lier un vol à un programme saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { programmeVolId: string }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/:id/lier-programme', protect, excludeQualite, volProgrammeController.lierVolAuProgramme);

/**
 * @route   POST /api/vols/:id/marquer-hors-programme
 * @desc    Marquer un vol comme hors programme
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { typeVolHorsProgramme: string, raison?: string }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/:id/marquer-hors-programme', protect, excludeQualite, volProgrammeController.marquerVolHorsProgramme);

/**
 * @route   POST /api/vols/:id/detacher-programme
 * @desc    Détacher un vol d'un programme saisonnier
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 */
// 🔒 P0-1: QUALITE exclu
router.post('/:id/detacher-programme', protect, excludeQualite, volProgrammeController.detacherVolDuProgramme);

/**
 * @route   GET /api/vols/:id/suggerer-programmes
 * @desc    Suggérer des programmes compatibles pour un vol
 * @access  Private
 */
router.get('/:id/suggerer-programmes', protect, volProgrammeController.suggererProgrammesPourVol);

/**
 * @route   GET /api/vols/programme/:programmeVolId
 * @desc    Obtenir tous les vols d'un programme saisonnier
 * @access  Private
 */
router.get('/programme/:programmeVolId', protect, volProgrammeController.obtenirVolsDuProgramme);

/**
 * @route   GET /api/vols/hors-programme
 * @desc    Obtenir tous les vols hors programme avec filtres
 * @access  Private
 * @query   typeVolHorsProgramme, compagnieAerienne, dateDebut, dateFin
 */
router.get('/hors-programme', protect, volProgrammeController.obtenirVolsHorsProgramme);

/**
 * @route   GET /api/vols/statistiques/programmes
 * @desc    Obtenir les statistiques vols programmés vs hors programme
 * @access  Private
 * @query   compagnieAerienne, dateDebut, dateFin
 */
router.get('/statistiques/programmes', protect, volProgrammeController.obtenirStatistiquesVolsProgrammes);

// FIN EXTENSION 2 - Les 4 routes existantes ci-dessus restent inchangées

export default router;
