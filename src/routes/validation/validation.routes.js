import express from 'express';
import {
  validerCRVController,
  deverrouillerCRVController,
  obtenirValidation,
  verrouillerCRVController,
  rejeterCRVController
} from '../../controllers/validation/validation.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/validation/:id
 * @desc    Obtenir la validation d'un CRV
 * @access  Private
 */
router.get('/:id', protect, obtenirValidation);

/**
 * @route   POST /api/validation/:id/valider
 * @desc    Valider un CRV (TERMINE → VALIDE/VERROUILLE)
 * @access  Private (SUPERVISEUR, MANAGER uniquement)
 * @note    Par défaut, le verrouillage est automatique
 */
router.post('/:id/valider',
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('VALIDATION'),
  validerCRVController
);

/**
 * @route   POST /api/validation/:id/verrouiller
 * @desc    Verrouiller un CRV validé (VALIDE → VERROUILLE)
 * @access  Private (SUPERVISEUR, MANAGER uniquement)
 * @note    Utilisé si le verrouillage automatique est désactivé
 */
router.post('/:id/verrouiller',
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('VALIDATION'),
  verrouillerCRVController
);

/**
 * @route   POST /api/validation/:id/deverrouiller
 * @desc    Déverrouiller un CRV (VERROUILLE → EN_COURS)
 * @access  Private (SUPERVISEUR, MANAGER uniquement)
 * @body    { raison: string } - Raison obligatoire
 */
router.post('/:id/deverrouiller',
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('MISE_A_JOUR'),
  deverrouillerCRVController
);

/**
 * @route   POST /api/validation/:id/rejeter
 * @desc    Rejeter un CRV (TERMINE → EN_COURS) avec raison obligatoire
 * @access  Private (SUPERVISEUR, MANAGER uniquement)
 * @body    { raison: string } - Raison du rejet obligatoire
 */
router.post('/:id/rejeter',
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('VALIDATION'),
  rejeterCRVController
);

export default router;
