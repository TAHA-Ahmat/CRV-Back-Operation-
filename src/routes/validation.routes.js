import express from 'express';
import {
  validerCRVController,
  deverrouillerCRVController,
  obtenirValidation
} from '../controllers/validation.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';

const router = express.Router();

router.post('/:id/valider',
  protect,
  authorize('SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'),
  auditLog('VALIDATION'),
  validerCRVController
);

router.post('/:id/deverrouiller',
  protect,
  authorize('MANAGER', 'ADMIN'),
  auditLog('MISE_A_JOUR'),
  deverrouillerCRVController
);

router.get('/:id', protect, obtenirValidation);

export default router;
