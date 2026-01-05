import express from 'express';
import {
  validerCRVController,
  deverrouillerCRVController,
  obtenirValidation
} from '../controllers/validation.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';

const router = express.Router();

// 🔒 PHASE 1 AJUSTÉE - Décisions critiques (SUPERVISEUR, MANAGER uniquement)
router.post('/:id/valider',
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('VALIDATION'),
  validerCRVController
);

// 🔒 DÉCISION CRITIQUE: Déverrouillage réservé à MANAGER
router.post('/:id/deverrouiller',
  protect,
  authorize('MANAGER'),
  auditLog('MISE_A_JOUR'),
  deverrouillerCRVController
);

router.get('/:id', protect, obtenirValidation);

export default router;
