// Structured JSON logging with Sentry integration + correlation IDs
// 📦 Source: https://github.com/pinojs/pino + https://github.com/pinojs/pino-sentry
// 🔄 BEFORE: console.log() scattered throughout (unstructured, no timestamps, no search, logs lost on restart)
// 🔄 AFTER: Every log entry is JSON with timestamp, level, context, user, correlation ID — searchable in Sentry

import pino from 'pino';
import pinoSentry from 'pino-sentry';

// 🟢 DEVELOPMENT: Pretty-printed (human readable)
const devTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
});

// 🟢 PRODUCTION: JSON + Sentry (structured logs)
const prodTransport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: {
        destination: '/var/log/crv-app.log',
        sync: false // async writes for performance
      }
    },
    {
      level: 'error', // only errors → Sentry
      target: 'pino-sentry',
      options: {
        dsn: process.env.SENTRY_DSN,
        environment: 'production',
        tracesSampleRate: 0.1
      }
    }
  ]
});

// 📝 LOGGER FACTORY
export const createLogger = (name) => {
  const transport = process.env.NODE_ENV === 'production' ? prodTransport : devTransport;

  return pino(
    {
      name, // logger name (e.g., 'auth', 'database', 'api')
      level: process.env.LOG_LEVEL || 'info',
      timestamp: pino.stdTimeFunctions.isoTime, // ISO 8601 timestamps
      redact: {
        paths: [
          'password',
          'token',
          'authorization',
          'cookie',
          'req.headers.authorization',
          'res.headers["set-cookie"]'
        ],
        remove: true
      }
    },
    transport
  );
};

// 🎯 USAGE PATTERNS

// 1️⃣ REQUEST LOGGING (middleware adds correlation ID to every request)
export const loggerMiddleware = (req, res, next) => {
  const logger = createLogger('http');
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

  req.log = logger.child({ correlationId, userId: req.user?.id });
  res.setHeader('x-correlation-id', correlationId);

  req.log.info(
    { method: req.method, path: req.path, ip: req.ip },
    'Incoming request'
  );

  res.on('finish', () => {
    req.log.info(
      { status: res.statusCode, duration: Date.now() - req._startTime },
      'Request complete'
    );
  });

  next();
};

// 2️⃣ DATABASE LOGGING (track queries + slow queries)
const dbLogger = createLogger('database');
export const logDatabaseQuery = (query, duration, params) => {
  const level = duration > 1000 ? 'warn' : 'debug'; // warn if > 1s
  dbLogger[level](
    { query, duration_ms: duration, param_count: params?.length || 0 },
    'Database query'
  );
};

// 3️⃣ BUSINESS LOGIC LOGGING (CRV operations with context)
const businessLogger = createLogger('business');
export const logCRVCreated = (crv, userId, duration) => {
  businessLogger.info(
    { crv_id: crv._id, numero: crv.numero, user_id: userId, duration_ms: duration },
    'CRV created'
  );
};

export const logCRVValidationError = (crv, error, userId) => {
  businessLogger.error(
    { crv_id: crv?._id, error: error.message, user_id: userId, schema_error: error.issues },
    'CRV validation failed'
  );
};

export const logPhaseCompleted = (crvId, phaseNumber, userId) => {
  businessLogger.info(
    { crv_id: crvId, phase: phaseNumber, user_id: userId },
    'Phase completed'
  );
};

// 4️⃣ SYNC QUEUE LOGGING (offline sync operations)
const syncLogger = createLogger('sync');
export const logSyncQueuedChange = (action, data, userId) => {
  syncLogger.info(
    { action, user_id: userId, data_keys: Object.keys(data || {}) },
    'Change queued for sync'
  );
};

export const logSyncUploaded = (itemId, status) => {
  syncLogger.info({ item_id: itemId, sync_status: status }, 'Item synced to server');
};

export const logSyncError = (itemId, error) => {
  syncLogger.error(
    { item_id: itemId, error: error.message, retryable: error.statusCode >= 500 },
    'Sync failed'
  );
};

// 5️⃣ ERROR LOGGING (exceptions with context)
const errorLogger = createLogger('error');
export const logError = (error, context = {}) => {
  errorLogger.error(
    { error: error.message, stack: error.stack, ...context },
    'Unhandled error'
  );
};

// 📊 LOG STRUCTURE EXAMPLES:
//
// ✅ Successful request:
// {
//   "level": 20,
//   "time": "2026-06-14T10:30:45.123Z",
//   "pid": 12345,
//   "hostname": "crv-app",
//   "name": "http",
//   "correlationId": "abc-123-def",
//   "userId": "user-42",
//   "method": "POST",
//   "path": "/api/crvs",
//   "ip": "192.168.1.100",
//   "msg": "Incoming request"
// }
//
// ⚠️  Slow database query:
// {
//   "level": 40,
//   "time": "2026-06-14T10:30:46.234Z",
//   "name": "database",
//   "query": "SELECT * FROM crvs WHERE vol_id = ? LIMIT 100",
//   "duration_ms": 2341,
//   "param_count": 1,
//   "msg": "Database query"
// }
//
// ❌ Validation error:
// {
//   "level": 50,
//   "time": "2026-06-14T10:30:47.345Z",
//   "name": "business",
//   "crv_id": "crv-999",
//   "error": "Zod validation failed",
//   "user_id": "user-42",
//   "schema_error": [
//     { "code": "too_small", "path": ["phases"], "message": "At least 1 phase required" }
//   ],
//   "msg": "CRV validation failed"
// }

// 🔄 LOOP IA AUTOMATION:
// 1. All logs streamed to Sentry (errors only in prod)
// 2. Agent log-watcher scans for patterns:
//    - If "Database query" duration_ms > 3000 → runs EXPLAIN PLAN, suggests index
//    - If "CRV validation failed" repeated 5x in 1 min → sends alert "Validation loop detected"
//    - If "Sync failed" retryable=true → auto-retries with exponential backoff
//    - If "Unhandled error" appears → creates GitHub issue + Slack notification
// 3. Correlation ID allows tracing user journey: GET correlation-id → see all 50 logs for that session
// 4. Prometheus scraper reads Pino JSON → metric crv_errors_total increments per level/logger
// 5. Grafana dashboard shows log volume, error rate, slowest APIs, sync success %, top errors

export default createLogger;
