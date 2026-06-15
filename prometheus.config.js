// Prometheus metrics collection + time-series export
// 📦 Source: https://github.com/prometheus-client-js/prometheus-client-nodejs
// 🔄 BEFORE: Zero visibility into app performance (response times, error rates, custom metrics)
// 🔄 AFTER: Real-time metrics exported to Prometheus every 10s (memory, CPU, requests, latency, errors)

import prometheus from 'prom-client';

// 🟢 STANDARD METRICS: CPU, memory, event loop, GC
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

// 📊 CUSTOM METRICS

// Counter: Total requests by method + status (incremented per request)
export const httpRequestCounter = new prometheus.Counter({
  name: 'crv_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status', 'endpoint'],
  registers: [register]
});

// Histogram: Request latency in milliseconds (bucketed 10ms, 50ms, 100ms, 500ms, 1000ms, 5000ms)
export const httpLatencyHistogram = new prometheus.Histogram({
  name: 'crv_http_request_duration_ms',
  help: 'HTTP request latency (ms)',
  labelNames: ['method', 'endpoint'],
  buckets: [10, 50, 100, 500, 1000, 5000],
  registers: [register]
});

// Counter: Database operations (create, read, update, delete) by type + success/failure
export const dbOpCounter = new prometheus.Counter({
  name: 'crv_db_operations_total',
  help: 'Total database operations',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

// Gauge: Active database connections (current pool size)
export const dbConnectionGauge = new prometheus.Gauge({
  name: 'crv_db_connections_active',
  help: 'Active database connections',
  registers: [register]
});

// Counter: Cache hits/misses (for offline sync validation)
export const cacheHitCounter = new prometheus.Counter({
  name: 'crv_cache_hits_total',
  help: 'Cache hits',
  labelNames: ['type'],
  registers: [register]
});

export const cacheMissCounter = new prometheus.Counter({
  name: 'crv_cache_misses_total',
  help: 'Cache misses',
  labelNames: ['type'],
  registers: [register]
});

// Gauge: Pending sync queue depth (offline changes awaiting upload)
export const syncQueueGauge = new prometheus.Gauge({
  name: 'crv_sync_queue_depth',
  help: 'Pending changes in sync queue',
  registers: [register]
});

// Counter: Validation errors (Zod schema failures)
export const validationErrorCounter = new prometheus.Counter({
  name: 'crv_validation_errors_total',
  help: 'Total validation errors',
  labelNames: ['schema', 'field'],
  registers: [register]
});

// 🔌 MIDDLEWARE: Attach to Express for automatic request tracking
export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Record latency histogram
    httpLatencyHistogram
      .labels(req.method, req.route?.path || req.path)
      .observe(duration);

    // Record request counter
    httpRequestCounter
      .labels(req.method, res.statusCode, req.route?.path || req.path)
      .inc();
  });

  next();
};

// 📤 EXPORT ENDPOINT: /metrics (Prometheus scrapes this every 10s)
export const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};

// 🎯 SUCCESS METRICS (how to validate it's working):
// 1. GET http://localhost:3000/metrics → see lines like:
//    crv_http_requests_total{method="GET",status="200",endpoint="/"} 42
//    crv_http_request_duration_ms_bucket{method="POST",endpoint="/api/crvs",le="100"} 5
// 2. Navigate 10 requests → GET /metrics → counters increment
// 3. Database hits → dbOpCounter increments
// 4. Offline sync queue grows → syncQueueGauge increases
// 5. Prometheus scraper configured → creates time-series: go to http://prometheus:9090/graph
//    Query: rate(crv_http_requests_total[1m]) → shows request rate over time

// 📋 SETUP IN EXPRESS APP:
// import { metricsMiddleware, metricsEndpoint } from './prometheus.config.js';
// app.use(metricsMiddleware);
// app.get('/metrics', metricsEndpoint);

// 🔄 LOOP IA AUTOMATION:
// 1. Prometheus scraper runs every 10s (kubectl scrape interval)
// 2. Agent monitor watches for anomalies:
//    - If crv_http_request_duration_ms_bucket > 5000ms for 2 min → Slack alert "Latency spike"
//    - If crv_db_connections_active > 10 → alert "Connection pool exhausted"
//    - If crv_sync_queue_depth > 100 → alert "Offline sync backlog"
// 3. Agent auto-remediation triggers:
//    - Latency spike → kill slow queries (DB query timeout tightened)
//    - Connection exhaustion → restart app (zero-downtime)
//    - Sync backlog → trigger background sync worker immediately
// 4. Metrics feed dashboards (Grafana) for manual inspection
