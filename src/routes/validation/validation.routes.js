import express from 'express';
import {
  validerCRVController,
  deverrouillerCRVController,
  obtenirValidation,
  verrouillerCRVController
} from '../../controllers/validation/validation.controller.js';
import { protect, excludeQualite } from '../../middlewares/auth.middleware.js';
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
 * @access  Private (tous sauf QUALITE)
 * @note    Par défaut, le verrouillage est automatique
 */
router.post('/:id/valider',
  protect,
  excludeQualite,
  auditLog('VALIDATION'),
  validerCRVController
);

/**
 * @route   POST /api/validation/:id/verrouiller
 * @desc    Verrouiller un CRV validé (VALIDE → VERROUILLE)
 * @access  Private (tous sauf QUALITE)
 * @note    Utilisé si le verrouillage automatique est désactivé
 */
router.post('/:id/verrouiller',
  protect,
  excludeQualite,
  auditLog('VALIDATION'),
  verrouillerCRVController
);

/**
 * @route   POST /api/validation/:id/deverrouiller
 * @desc    Déverrouiller un CRV (VERROUILLE → EN_COURS)
 * @access  Private (tous sauf QUALITE)
 * @body    { raison: string } - Raison obligatoire
 */
router.post('/:id/deverrouiller',
  protect,
  excludeQualite,
  auditLog('MISE_A_JOUR'),
  deverrouillerCRVController
);

export default router;
