import express from 'express';
import { body } from 'express-validator';
import {
  creerVol,
  obtenirVol,
  listerVols,
  mettreAJourVol
} from '../controllers/vol.controller.js';
// EXTENSION 2 - Import du nouveau contrôleur pour vols programmés/hors programme
import * as volProgrammeController from '../controllers/volProgramme.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'), [
  body('numeroVol').notEmpty().withMessage('Numéro de vol requis'),
  body('typeOperation').isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND']).withMessage('Type d\'opération invalide'),
  body('compagnieAerienne').notEmpty().withMessage('Compagnie aérienne requise'),
  body('codeIATA').isLength({ min: 2, max: 2 }).withMessage('Code IATA invalide'),
  body('dateVol').isISO8601().withMessage('Date de vol invalide'),
  validate
], creerVol);

router.get('/', protect, listerVols);

router.get('/:id', protect, obtenirVol);

router.patch('/:id', protect, authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'), mettreAJourVol);

// ========== EXTENSION 2 - Routes pour distinction vol programmé / hors programme ==========
// NON-RÉGRESSION: Ces routes sont NOUVELLES et n'affectent AUCUNE route existante ci-dessus

/**
 * @route   POST /api/vols/:id/lier-programme
 * @desc    Lier un vol à un programme saisonnier
 * @access  Private (SUPERVISEUR, CHEF_EQUIPE, MANAGER, ADMIN)
 * @body    { programmeVolId: string }
 */
router.post('/:id/lier-programme', protect, authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'), volProgrammeController.lierVolAuProgramme);

/**
 * @route   POST /api/vols/:id/marquer-hors-programme
 * @desc    Marquer un vol comme hors programme
 * @access  Private (SUPERVISEUR, CHEF_EQUIPE, MANAGER, ADMIN)
 * @body    { typeVolHorsProgramme: string, raison?: string }
 */
router.post('/:id/marquer-hors-programme', protect, authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'), volProgrammeController.marquerVolHorsProgramme);

/**
 * @route   POST /api/vols/:id/detacher-programme
 * @desc    Détacher un vol d'un programme saisonnier
 * @access  Private (SUPERVISEUR, CHEF_EQUIPE, MANAGER, ADMIN)
 */
router.post('/:id/detacher-programme', protect, authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'), volProgrammeController.detacherVolDuProgramme);

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
