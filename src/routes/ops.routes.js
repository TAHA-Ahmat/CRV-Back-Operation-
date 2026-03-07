/**
 * OPS ROUTES — Centre de Contrôle Opérationnel
 *
 * MODULE OPS CONTROL CENTER v1.0.0
 *
 * Routes :
 * - GET /api/ops/stream     → SSE temps réel (auth via query token)
 * - GET /api/ops/dashboard   → Snapshot JSON (auth via Bearer header)
 * - GET /api/ops/stats       → Stats du service (auth via Bearer header)
 *
 * NOTE : La route /stream gère l'auth manuellement (query token)
 *        car EventSource ne supporte pas les headers custom.
 *        Les autres routes utilisent protect + authorize classiques.
 */

import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { streamEvents, getDashboard, getStats } from '../controllers/ops/ops.controller.js';

const router = Router();

// SSE Stream — Auth manuelle via query param (EventSource limitation)
router.get('/stream', streamEvents);

// Dashboard snapshot — Auth classique Bearer token
router.get('/dashboard', protect, authorize('ADMIN', 'MANAGER', 'SUPERVISEUR'), getDashboard);

// Stats du service OPS Stream
router.get('/stats', protect, authorize('ADMIN'), getStats);

export default router;
