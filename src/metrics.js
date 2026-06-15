import promClient from 'prom-client';

// Setup default metrics (cpu, memory, event loop, etc.)
promClient.collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 30, 100, 300, 500, 1000, 3000, 5000, 10000],
});

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestsInProgress = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route'],
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['operation', 'table', 'status'],
  buckets: [5, 10, 50, 100, 500, 1000, 5000],
});

export const dbQueriesTotal = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
});

export const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status'], // success, failure
});

export const notificationsSent = new promClient.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'status'], // type: email, sms, push; status: success, failure
});

export const crvProcessingTime = new promClient.Histogram({
  name: 'crv_processing_time_ms',
  help: 'Time to process CRV operations in ms',
  labelNames: ['operation', 'status'],
  buckets: [100, 500, 1000, 5000, 10000, 30000],
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users_current',
  help: 'Number of currently active users',
});

export const flightStatus = new promClient.Gauge({
  name: 'flights_by_status',
  help: 'Number of flights by status',
  labelNames: ['status'], // planned, in_progress, completed, cancelled
});

export const reportGenerationTime = new promClient.Histogram({
  name: 'report_generation_time_ms',
  help: 'Time to generate reports in ms',
  labelNames: ['report_type', 'status'],
  buckets: [1000, 5000, 10000, 30000, 60000],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const route = `${req.method} ${req.baseUrl}${req.path}`;

  httpRequestsInProgress.inc({ method: req.method, route });

  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration.labels(req.method, route, statusCode).observe(duration);
    httpRequestsTotal.labels(req.method, route, statusCode).inc();
    httpRequestsInProgress.dec({ method: req.method, route });

    res.send = originalSend;
    return res.send(data);
  };

  next();
};

// Helper to record DB query metrics
export const recordDbQuery = (operation, table, status, duration) => {
  dbQueryDuration.labels(operation, table, status).observe(duration);
  dbQueriesTotal.labels(operation, table, status).inc();
};

// Helper to record authentication attempts
export const recordAuthAttempt = (success) => {
  authenticationAttempts.labels(success ? 'success' : 'failure').inc();
};

// Helper to record notifications
export const recordNotification = (type, success) => {
  notificationsSent.labels(type, success ? 'success' : 'failure').inc();
};

// Helper to record CRV processing time
export const recordCrvProcessing = (operation, success, duration) => {
  crvProcessingTime.labels(operation, success ? 'success' : 'failure').observe(duration);
};

// Helper to record report generation
export const recordReportGeneration = (reportType, success, duration) => {
  reportGenerationTime.labels(reportType, success ? 'success' : 'failure').observe(duration);
};

// Export metrics for /metrics endpoint
export const getMetrics = () => promClient.register.metrics();
