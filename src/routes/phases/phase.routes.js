import express from 'express';
import { body } from 'express-validator';
import {
  obtenirPhase,
  listerPhases,
  demarrerPhaseController,
  terminerPhaseController,
  marquerPhaseNonRealisee,
  mettreAJourPhase
} from '../../controllers/phases/phase.controller.js';
import { protect, excludeQualite } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import {
  verifierCoherencePhaseTypeOperation,
  verifierJustificationNonRealisation
} from '../../middlewares/businessRules.middleware.js';
import { verifierCRVNonVerrouilleViaPhase } from '../../middlewares/verrouillage.middleware.js';

const router = express.Router();

// ============================================
// ROUTES DE LECTURE
// ============================================

// Lister les phases d'un CRV
router.get('/', protect, listerPhases);

// Obtenir une phase individuelle
router.get('/:id', protect, obtenirPhase);

// ============================================
// ROUTES D'ACTION
// ============================================

// 🔒 P0-1: QUALITE exclu | 🔒 Mission 009: Verrouillage
router.post('/:id/demarrer', protect, excludeQualite, verifierCRVNonVerrouilleViaPhase, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), demarrerPhaseController);

// 🔒 P0-1: QUALITE exclu | 🔒 Mission 009: Verrouillage
router.post('/:id/terminer', protect, excludeQualite, verifierCRVNonVerrouilleViaPhase, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), terminerPhaseController);

// 🔒 P0-1: QUALITE exclu | 🔒 Mission 009: Verrouillage
router.post('/:id/non-realise', protect, excludeQualite, verifierCRVNonVerrouilleViaPhase, verifierCoherencePhaseTypeOperation, [
  body('motifNonRealisation').isIn(['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE']).withMessage('Motif invalide'),
  body('detailMotif').notEmpty().withMessage('Détail de justification requis'),
  validate
], verifierJustificationNonRealisation, auditLog('MISE_A_JOUR'), marquerPhaseNonRealisee);

// 🔒 P0-1: QUALITE exclu | 🔒 Mission 009: Verrouillage
router.patch('/:id', protect, excludeQualite, verifierCRVNonVerrouilleViaPhase, verifierCoherencePhaseTypeOperation, auditLog('MISE_A_JOUR'), mettreAJourPhase);

export default router;
