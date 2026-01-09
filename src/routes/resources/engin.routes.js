import express from 'express';
import { body } from 'express-validator';
import {
  listerEngins,
  obtenirEngin,
  creerEngin,
  mettreAJourEngin,
  supprimerEngin,
  listerEnginsDisponibles,
  obtenirTypesEngins
} from '../../controllers/resources/engin.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

const router = express.Router();

// ============================
//   ROUTES NON-PARAMÉTRISÉES (AVANT /:id)
// ============================

/**
 * @route   GET /api/engins/types
 * @desc    Obtenir les types d'engins disponibles
 * @access  Private
 */
router.get('/types', protect, obtenirTypesEngins);

/**
 * @route   GET /api/engins/disponibles
 * @desc    Lister les engins disponibles pour affectation
 * @access  Private
 * @query   typeEngin (optionnel)
 */
router.get('/disponibles', protect, listerEnginsDisponibles);

/**
 * @route   GET /api/engins
 * @desc    Lister tous les engins du parc
 * @access  Private
 * @query   typeEngin, statut, page, limit
 */
router.get('/', protect, listerEngins);

/**
 * @route   POST /api/engins
 * @desc    Créer un nouvel engin dans le parc
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/', protect, authorize('MANAGER', 'ADMIN'), [
  body('numeroEngin').notEmpty().withMessage('Numéro d\'engin requis'),
  body('typeEngin').isIn(['TRACTEUR', 'CHARIOT_BAGAGES', 'CHARIOT_FRET', 'GPU', 'ASU', 'STAIRS', 'CONVOYEUR', 'AUTRE']).withMessage('Type d\'engin invalide'),
  validate
], creerEngin);

// ============================
//   ROUTES PARAMÉTRISÉES
// ============================

/**
 * @route   GET /api/engins/:id
 * @desc    Obtenir un engin par ID
 * @access  Private
 */
router.get('/:id', protect, obtenirEngin);

/**
 * @route   PUT /api/engins/:id
 * @desc    Mettre à jour un engin
 * @access  Private (MANAGER, ADMIN)
 */
router.put('/:id', protect, authorize('MANAGER', 'ADMIN'), mettreAJourEngin);

/**
 * @route   DELETE /api/engins/:id
 * @desc    Supprimer un engin du parc
 * @access  Private (ADMIN)
 */
router.delete('/:id', protect, authorize('ADMIN'), supprimerEngin);

export default router;
