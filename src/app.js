import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
// ✅ ALIGNÉ SUR MAGASIN : Middlewares d'audit
import auditRequestMiddleware from './middlewares/auditRequest.middleware.js';
import auditFinalizeMiddleware from './middlewares/auditFinalize.middleware.js';
// 📊 MONITORING: Sentry + Prometheus
import { initSentry, attachErrorHandler } from './config/sentry.js';
import { metricsMiddleware, getMetrics } from './metrics.js';

// Routes - MVS 1: Security
import authRoutes from './routes/security/auth.routes.js';
import personneRoutes from './routes/security/personne.routes.js';
// Routes - MVS 2: CRV
import crvRoutes from './routes/crv/crv.routes.js';
// Routes - MVS 3: Phases
import phaseRoutes from './routes/phases/phase.routes.js';
// Routes - MVS 4: Charges
import chargeRoutes from './routes/charges/charge.routes.js';
// Routes - MVS 5: Resources
import enginRoutes from './routes/resources/engin.routes.js';
// Routes - MVS 6: Flights
import volRoutes from './routes/flights/vol.routes.js';
import programmeVolRoutes from './routes/flights/programmeVol.routes.js';
// Routes - MVS 6b: Bulletin de Mouvement
import bulletinMouvementRoutes from './routes/bulletin/bulletinMouvement.routes.js';
// Routes - MVS 7: Validation
import validationRoutes from './routes/validation/validation.routes.js';
// Routes - MVS 8: Notifications
import notificationRoutes from './routes/notifications/notification.routes.js';
import alerteSLARoutes from './routes/notifications/alerteSLA.routes.js';
// Routes - MVS 10: Notification Rules (Admin)
import notificationRulesRoutes from './routes/notifications/notificationRules.routes.js';
// Routes - MVS 11: Notification Recipients (Admin)
import notificationRecipientsRoutes from './routes/notifications/notificationRecipients.routes.js';
// Routes - MVS 9: Referentials
import avionRoutes from './routes/referentials/avion.routes.js';
// Routes - MVS 12: OPS Control Center (temps réel)
import opsRoutes from './routes/ops.routes.js';
// Routes - AGENTS: IA Agents & Automation
import agentRoutes from './routes/agents/agentRoutes.js';

const app = express();

// 📊 Initialize Sentry error tracking (MUST be first middleware)
initSentry(app);

app.use(helmet());

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 📊 Prometheus metrics middleware
app.use(metricsMiddleware);

// ✅ ALIGNÉ SUR MAGASIN : Audit request middleware (début de chaque requête)
app.use(auditRequestMiddleware);

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API CRV opérationnelle',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 📊 Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(getMetrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/personnes', personneRoutes);
app.use('/api/crv', crvRoutes);
app.use('/api/vols', volRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/validation', validationRoutes);
// EXTENSION 1 - Programme vol saisonnier (NON-RÉGRESSION: endpoint nouveau /api/programmes-vol/*)
app.use('/api/programmes-vol', programmeVolRoutes);
// EXTENSION 7 - Bulletin de mouvement (NON-RÉGRESSION: endpoint nouveau /api/bulletins/*)
// HIERARCHIE: Programme (6 mois) → Bulletin (3-4 jours) → CRV (reel)
app.use('/api/bulletins', bulletinMouvementRoutes);
// EXTENSION 3 - Version et configuration avion (NON-RÉGRESSION: endpoint nouveau /api/avions/*)
app.use('/api/avions', avionRoutes);
// EXTENSION 4 - Catégories passagers détaillées (NON-RÉGRESSION: endpoint nouveau /api/charges/*)
app.use('/api/charges', chargeRoutes);
// Gestion des engins (parc matériel)
app.use('/api/engins', enginRoutes);
// EXTENSION 7 - Service notification in-app (NON-RÉGRESSION: endpoint nouveau /api/notifications/*)
app.use('/api/notifications', notificationRoutes);
// EXTENSION 8 - Service alertes SLA proactives (NON-RÉGRESSION: endpoint nouveau /api/sla/*)
app.use('/api/sla', alerteSLARoutes);
// EXTENSION 10 - Admin notification rules (NON-RÉGRESSION: endpoint nouveau /api/notification-rules/*)
app.use('/api/notification-rules', notificationRulesRoutes);
// EXTENSION 11 - Admin notification recipients (NON-RÉGRESSION: endpoint nouveau /api/notification-recipients/*)
app.use('/api/notification-recipients', notificationRecipientsRoutes);
// EXTENSION 12 - OPS Control Center temps réel (NON-RÉGRESSION: endpoint nouveau /api/ops/*)
app.use('/api/ops', opsRoutes);
// AGENTS - IA Agents & Automation (NON-RÉGRESSION: endpoint nouveau /api/agents/*)
app.use('/api/agents', agentRoutes);

// ✅ ALIGNÉ SUR MAGASIN : Audit finalize middleware (fin de chaque requête)
app.use(auditFinalizeMiddleware);

// 📊 Attach Sentry error handler (MUST be last middleware)
attachErrorHandler(app);

app.use(notFound);
app.use(errorHandler);

export default app;
