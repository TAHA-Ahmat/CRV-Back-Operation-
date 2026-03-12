import express from 'express';
import { body } from 'express-validator';
import {
  creerVol,
  obtenirVol,
  listerVols,
  mettreAJourVol
} from '../../controllers/flights/vol.controller.js';
import { protect, excludeQualite } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

/**
 * ROUTES VOLS (Vols opérationnels du jour)
 *
 * Ces routes gèrent les vols opérationnels (vols réels du jour).
 * Pour les vols du programme saisonnier, voir programmeVol.routes.js
 */

const router = express.Router();

/**
 * @route   POST /api/vols
 * @desc    Créer un vol opérationnel
 * @access  Private (Opérationnels)
 */
router.post('/', protect, excludeQualite, [
  body('numeroVol').notEmpty().withMessage('Numéro de vol requis'),
  body('typeOperation').isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND']).withMessage('Type d\'opération invalide'),
  body('compagnieAerienne').notEmpty().withMessage('Compagnie aérienne requise'),
  body('codeIATA').isLength({ min: 2, max: 2 }).withMessage('Code IATA invalide'),
  body('dateVol').isISO8601().withMessage('Date de vol invalide'),
  validate
], creerVol);

/**
 * @route   GET /api/vols
 * @desc    Lister les vols opérationnels
 * @access  Private (Tous)
 */
router.get('/', protect, listerVols);

/**
 * @route   GET /api/vols/:id
 * @desc    Obtenir un vol par ID
 * @access  Private (Tous)
 */
router.get('/:id', protect, obtenirVol);

/**
 * @route   PATCH /api/vols/:id
 * @desc    Mettre à jour un vol
 * @access  Private (Opérationnels)
 */
router.patch('/:id', protect, excludeQualite, mettreAJourVol);

export default router;
