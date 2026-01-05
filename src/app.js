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

import authRoutes from './routes/auth.routes.js';
import crvRoutes from './routes/crv.routes.js';
import volRoutes from './routes/vol.routes.js';
import phaseRoutes from './routes/phase.routes.js';
import validationRoutes from './routes/validation.routes.js';
// EXTENSION 1 - Programme vol saisonnier (NON-RÉGRESSION: route nouvelle, aucun impact sur l'existant)
import programmeVolRoutes from './routes/programmeVol.routes.js';
// EXTENSION 3 - Version et configuration avion (NON-RÉGRESSION: route nouvelle, aucun impact sur l'existant)
import avionRoutes from './routes/avion.routes.js';
// EXTENSION 4 - Catégories passagers détaillées (NON-RÉGRESSION: route nouvelle, aucun impact sur l'existant)
import chargeRoutes from './routes/charge.routes.js';
// EXTENSION 7 - Service notification in-app (NON-RÉGRESSION: route nouvelle, aucun impact sur l'existant)
import notificationRoutes from './routes/notification.routes.js';
// EXTENSION 8 - Service alertes SLA proactives (NON-RÉGRESSION: route nouvelle, aucun impact sur l'existant)
import alerteSLARoutes from './routes/alerteSLA.routes.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/auth', authRoutes);
app.use('/api/crv', crvRoutes);
app.use('/api/vols', volRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/validation', validationRoutes);
// EXTENSION 1 - Programme vol saisonnier (NON-RÉGRESSION: endpoint nouveau /api/programmes-vol/*)
app.use('/api/programmes-vol', programmeVolRoutes);
// EXTENSION 3 - Version et configuration avion (NON-RÉGRESSION: endpoint nouveau /api/avions/*)
app.use('/api/avions', avionRoutes);
// EXTENSION 4 - Catégories passagers détaillées (NON-RÉGRESSION: endpoint nouveau /api/charges/*)
app.use('/api/charges', chargeRoutes);
// EXTENSION 7 - Service notification in-app (NON-RÉGRESSION: endpoint nouveau /api/notifications/*)
app.use('/api/notifications', notificationRoutes);
// EXTENSION 8 - Service alertes SLA proactives (NON-RÉGRESSION: endpoint nouveau /api/sla/*)
app.use('/api/sla', alerteSLARoutes);

// ✅ ALIGNÉ SUR MAGASIN : Audit finalize middleware (fin de chaque requête)
app.use(auditFinalizeMiddleware);

app.use(notFound);
app.use(errorHandler);

export default app;
