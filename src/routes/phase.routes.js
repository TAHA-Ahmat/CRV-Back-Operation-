import express from 'express';
import { body } from 'express-validator';
import {
  demarrerPhaseController,
  terminerPhaseController,
  marquerPhaseNonRealisee,
  mettreAJourPhase
} from '../controllers/phase.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import {
  verifierCoherencePhaseTypeOperation,
  verifierJustificationNonRealisation
} from '../middlewares/businessRules.middleware.js';

const router = express.Router();

router.post('/:id/demarrer', protect, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), demarrerPhaseController);

router.post('/:id/terminer', protect, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), terminerPhaseController);

router.post('/:id/non-realise', protect, verifierCoherencePhaseTypeOperation, [
  body('motifNonRealisation').isIn(['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE']).withMessage('Motif invalide'),
  body('detailMotif').notEmpty().withMessage('Détail de justification requis'),
  validate
], verifierJustificationNonRealisation, auditLog('MISE_A_JOUR'), marquerPhaseNonRealisee);

router.patch('/:id', protect, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), mettreAJourPhase);

export default router;
