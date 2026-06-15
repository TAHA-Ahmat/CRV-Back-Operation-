# CRV API Monitoring Setup

## Overview

This document describes the monitoring stack for the CRV API:
- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards

## Quick Start

### 1. Install Dependencies

```bash
cd /home/kali/CRV_git/Back
npm install @sentry/node prom-client
```

### 2. Environment Variables

Add to your `.env` file:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=development
```

Get your Sentry DSN from: https://sentry.io/settings/organizations/your-org/projects/

### 3. Test Metrics Endpoint

```bash
# Start the server
npm start

# In another terminal, test the metrics endpoint
curl http://localhost:8000/metrics
```

You should see Prometheus-format metrics output:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 5
```

## Running with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- `.env` file with `SENTRY_DSN` set

### Start the Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

This will start:
- **CRV API**: http://localhost:8000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### Test the Stack

```bash
# Generate some traffic
for i in {1..10}; do
  curl http://localhost:8000/health
done

# View metrics in Prometheus
curl http://localhost:8000/metrics

# View Grafana dashboards
# Open http://localhost:3000 in your browser
# Username: admin
# Password: admin
```

## Metrics Available

### HTTP Metrics
- `http_requests_total`: Total HTTP requests (counter)
- `http_request_duration_ms`: HTTP request latency (histogram)
- `http_requests_in_progress`: Current in-flight requests (gauge)

### Database Metrics
- `db_queries_total`: Total database queries
- `db_query_duration_ms`: Database query latency

### Application Metrics
- `authentication_attempts_total`: Auth success/failure
- `notifications_sent_total`: Notifications by type/status
- `crv_processing_time_ms`: CRV operation processing time
- `active_users_current`: Currently active users
- `flights_by_status`: Flight count by status
- `report_generation_time_ms`: Report generation latency

### System Metrics (Auto-collected)
- `process_cpu_seconds_total`: CPU usage
- `process_resident_memory_bytes`: Memory usage
- `nodejs_eventloop_delay_seconds`: Event loop delay
- `nodejs_gc_duration_seconds`: Garbage collection time

## Integrating Metrics in Your Code

### Recording HTTP Metrics

The metrics middleware is already attached in `app.js`, so all HTTP requests are automatically tracked.

### Recording Database Queries

```javascript
import { recordDbQuery } from './metrics.js';

// After a query
const startTime = Date.now();
const result = await db.find(...);
const duration = Date.now() - startTime;
recordDbQuery('find', 'users', 'success', duration);
```

### Recording Authentication

```javascript
import { recordAuthAttempt } from './metrics.js';

// After authentication
recordAuthAttempt(authSuccess);
```

### Recording Notifications

```javascript
import { recordNotification } from './metrics.js';

// After sending notification
recordNotification('email', notificationSuccess);
```

### Recording CRV Processing

```javascript
import { recordCrvProcessing } from './metrics.js';

const startTime = Date.now();
const result = processCRV(data);
const duration = Date.now() - startTime;
recordCrvProcessing('process', true, duration);
```

## Configuring Sentry

### Error Tracking

Errors are automatically captured and sent to Sentry:

```javascript
// Automatic capture
throw new Error('Something went wrong');

// Manual capture
import * as Sentry from '@sentry/node';
Sentry.captureException(error);
```

### Performance Monitoring

Performance is automatically tracked for HTTP requests and database operations:

```javascript
// Manual transaction
const transaction = Sentry.startTransaction({
  op: 'custom_operation',
  name: 'My Operation'
});

// ... do work ...

transaction.finish();
```

### Setting Context

```javascript
import * as Sentry from '@sentry/node';

Sentry.setContext('crv', {
  flight_id: flightId,
  operation: 'validation'
});
```

## Grafana Dashboards

### Importing the Dashboard

1. Open Grafana: http://localhost:3000
2. Click **+** in the left sidebar → **Import**
3. Upload `grafana-dashboard.json`
4. Select Prometheus as the data source
5. Click **Import**

### Dashboard Panels

- **HTTP Request Rate**: 5-minute request rate
- **HTTP Request Duration**: 95th percentile latency
- **Active Requests**: Current in-flight requests
- **Status Codes**: Requests by HTTP status
- **Database Metrics**: Query rate and latency
- **Authentication**: Success/failure rate
- **Notifications**: Sent notifications by type
- **CRV Processing**: Operation latency
- **Active Users**: Current user count
- **Flights**: Flight count by status
- **Report Generation**: Report latency
- **CPU & Memory**: Process resource usage
- **Error Rate**: 5-minute error rate (5xx)

## Prometheus Queries

Useful PromQL queries for ad-hoc analysis:

```promql
# Request rate over 5 minutes
rate(http_requests_total[5m])

# Error rate (5xx)
rate(http_requests_total{status_code=~"5.."}[5m])

# 95th percentile latency
histogram_quantile(0.95, http_request_duration_ms)

# Database query duration average
avg(db_query_duration_ms)

# Active requests in progress
http_requests_in_progress

# Authentication success rate
sum(rate(authentication_attempts_total{status="success"}[5m]))
```

## Alerting Rules

### Example Alert Rules (prometheus.yml)

```yaml
groups:
  - name: crv_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowRequests
        expr: histogram_quantile(0.95, http_request_duration_ms) > 5000
        for: 5m
        annotations:
          summary: "95th percentile latency > 5 seconds"
          
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1000
        for: 5m
        annotations:
          summary: "Memory usage > 1GB"
```

## Troubleshooting

### Metrics not showing in Prometheus

1. Check that the `/metrics` endpoint returns data:
   ```bash
   curl http://localhost:8000/metrics
   ```

2. Check Prometheus scrape targets:
   - Go to http://localhost:9090/targets
   - Ensure the `crv-api` target is UP

3. Check Prometheus logs:
   ```bash
   docker logs crv-prometheus
   ```

### Grafana not connecting to Prometheus

1. Verify Prometheus is running:
   ```bash
   docker ps | grep prometheus
   ```

2. Check Grafana datasource settings:
   - Go to http://localhost:3000 → Data Sources
   - Ensure URL is `http://prometheus:9090`

3. Check Grafana logs:
   ```bash
   docker logs crv-grafana
   ```

### Sentry not receiving events

1. Verify `SENTRY_DSN` is set in `.env`:
   ```bash
   echo $SENTRY_DSN
   ```

2. Check Sentry credentials:
   - Go to https://sentry.io → Settings → Projects
   - Copy the correct DSN

3. Check application logs for Sentry initialization errors

## Performance Tuning

### Prometheus Storage

Default retention is 15 days. To adjust:

```bash
docker-compose -f docker-compose.monitoring.yml down
# Edit docker-compose.monitoring.yml:
# command: '--storage.tsdb.retention.time=30d'
docker-compose -f docker-compose.monitoring.yml up -d
```

### Scrape Interval

For higher-precision metrics, reduce the scrape interval in `prometheus.yml`:

```yaml
global:
  scrape_interval: 5s  # Was 15s
```

Then restart:
```bash
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

### Histogram Buckets

To adjust histogram buckets (e.g., for faster requests), edit `src/metrics.js`:

```javascript
export const httpRequestDuration = new promClient.Histogram({
  buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],  // Adjusted
});
```

## Next Steps

1. **Setup Alerting**: Configure AlertManager to send alerts to Slack/email
2. **SLA Monitoring**: Add metrics for flight operations SLAs
3. **Custom Dashboards**: Create team-specific Grafana dashboards
4. **Error Grouping**: Configure Sentry error grouping rules
5. **Performance Baselines**: Establish performance baselines for alerts

## References

- Sentry Docs: https://docs.sentry.io/product/
- Prometheus Docs: https://prometheus.io/docs/
- Grafana Docs: https://grafana.com/docs/grafana/
- prom-client: https://github.com/siimon/prom-client
