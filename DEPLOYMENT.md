# DEPLOYMENT.md — Production Readiness Guide

**Version:** 1.0.0  
**Last Updated:** June 16, 2026  
**Status:** Phase A Stabilization (Week 1-2)  
**Target:** Phase F Launch (Week 7)

---

## 🎯 Overview

This document defines the complete deployment readiness checklist for CRV Backend production launch. It covers infrastructure requirements, security gates, testing criteria, monitoring configuration, backup strategies, and rollback procedures.

**Estimated read time:** 15 minutes  
**Applicable to:** DevOps, SRE, Backend Lead, QA

---

## 📋 Deployment Readiness Checklist

### Phase A — Stabilization (Week 1-2) — **CURRENT**

#### Code Quality Gates

- [ ] **103/103 tests passing** (vitest run)
  - Backend: 19/19 passing
  - Frontend: 84/84 passing
  - Status: ✅ DONE (all tests pass 396/396)
  - Gate: Merge blocked if any test fails

- [ ] **Test coverage ≥60%** across all services
  - Current: 26.1% (lines), 25.42% (statements), 17.32% (functions)
  - Target: 60% threshold enforced in CI
  - Action: Write integration tests for untested services (Phase A Week 1-2)
  - Gate: Merge blocked if coverage drops below 60%

- [ ] **ESLint + Prettier** auto-fix enabled
  - Status: ✅ DONE (files created 15 JUN)
  - Config: `eslint.config.js` + `.prettierrc`
  - Gate: Husky pre-commit blocks if > 0 warnings

- [ ] **TypeScript strict mode** all files
  - Compiler: tsconfig.json (lib: es2020, strict: true)
  - Gate: Compilation blocks if any type errors

- [ ] **No hardcoded credentials** in source
  - Scan: `git grep -i 'password\|api_key\|secret'`
  - Gate: Pre-commit hook blocks secrets

- [ ] **Zero deprecated dependencies**
  - Status: Check `npm audit`
  - Known issues: Punycode deprecation (Node.js built-in, safe to ignore)
  - Gate: Merge blocks if `npm audit` shows critical/high

- [ ] **Database schema indices** optimized
  - Issue: Mongoose duplicate indices warnings (numeroEngin, nom, numeroBulletin)
  - Action: Remove duplicate `.index()` definitions in schema files
  - Verify: `node --trace-warnings` shows zero warnings

#### DevOps Infrastructure

- [ ] **Docker image** builds successfully
  - Dockerfile: Create production-optimized image (multi-stage build)
  - Base image: `node:18-alpine` (smallest + secure)
  - Health check: `/health` endpoint (internal liveness probe)
  - Security: Non-root user, no build tools in final image
  - Build time: < 5 minutes
  - Image size: < 300 MB

- [ ] **Health check** endpoint operational
  - Endpoint: `GET /health`
  - Response: `{ status: 'ok', timestamp: ISO8601 }`
  - Latency: < 50ms
  - Retry: Kubernetes defaults (3 failures = 30s = pod restart)

- [ ] **Metrics** endpoint operational
  - Endpoint: `GET /metrics`
  - Format: Prometheus text format
  - Includes: CPU, memory, HTTP request latency, DB query times
  - Scrape interval: 15s (Prometheus default)

- [ ] **Environment variables** validated at startup
  - Required: `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`
  - Fail fast: App refuses to start without required vars
  - Security: No env var logging at startup

- [ ] **Rate limiting** enforced
  - Window: 900s (15 min)
  - Max requests: 100/window
  - Gate: 429 (Too Many Requests) returned for violators

- [ ] **CORS** properly configured
  - Allowed origins: Read from `CORS_ORIGIN` env var
  - Credentials: true (for JWT in Authorization header)
  - Methods: GET, POST, PUT, DELETE, PATCH
  - Headers: Content-Type, Authorization

#### Monitoring & Observability

- [ ] **Sentry** error tracking configured
  - Setup: `@sentry/node` initialized in app.js
  - DSN: From Sentry.io project
  - Release: Semantic version tag (e.g., 1.0.0-rc1)
  - Environment: staging, production (not development)
  - Gate: All unhandled exceptions captured

- [ ] **Prometheus** metrics exposed
  - Metrics:
    - `http_request_duration_seconds` (histogram)
    - `http_requests_total` (counter)
    - `db_query_duration_seconds` (histogram)
    - `node_memory_usage_bytes` (gauge)
    - `node_process_cpu_seconds_total` (counter)
  - Scrape target: `http://localhost:3000/metrics`
  - Gate: Prometheus scrape succeeds 100% of time

- [ ] **Grafana** dashboards deployed
  - Dashboard: Monitor HTTP latency, error rates, DB query times
  - Alert rules: See MONITORING section below
  - Data source: Prometheus connection verified

- [ ] **Log aggregation** ready
  - Parser: JSON logs from app (Morgan + structured logging)
  - Destination: Stdout (Docker will capture to ELK/Splunk/CloudWatch)
  - Format: ISO8601 timestamp, level, service, message, context

### Phase B — Design Phase F (Week 3)

- [ ] Architecture Decision Records (ADRs) approved
  - Topic 1: CRDT sync algorithm
  - Topic 2: Offline conflict resolution UI
  - Topic 3: IndexedDB storage schema
  - Gate: Design doc signed off before coding

### Phase C — Implementation (Week 4-6)

- [ ] Backend CRDT sync service complete
- [ ] Frontend offline UI complete
- [ ] Integration tests for sync scenarios
- [ ] E2E tests (Playwright) for user workflows

### Phase D — Launch (Week 7+)

- [ ] Security audit passed
- [ ] Load testing passed (capacity planning)
- [ ] Backup & restore tested
- [ ] Rollback procedure validated
- [ ] Runbook updated with operational tasks
- [ ] On-call team trained

---

## 🔒 Security Gates

### Pre-Deployment Security Checklist

#### Secrets Management

- [ ] **No plaintext credentials** in `.git`
  - Scan: `git log -p --all -S 'password' | head`
  - Cleanup: BFG Repo-Cleaner if found
  - Tool: Vault / AWS Secrets Manager for production

- [ ] **JWT token revocation** functional
  - Mechanism: Redis blacklist (token jti + exp timestamp)
  - Cleanup: Redis TTL set to exp timestamp
  - Verification: Logout test → token rejected on next request

- [ ] **Password hashing** correct
  - Library: bcryptjs (v2.4.3)
  - Rounds: 10 (default)
  - Verification: `bcrypt.compare()` used on login

- [ ] **API endpoints** require authentication
  - Public: `/health`, `/metrics` only
  - Protected: All `/api/*` endpoints need JWT in Authorization header
  - Scan: `grep -r 'app.get\|app.post' src/routes | grep -v '/health\|/metrics'`

#### HTTPS & TLS

- [ ] **HTTPS enforced** (via reverse proxy, not in Node)
  - Proxy: Nginx / AWS ALB handles TLS
  - Node: Listens on HTTP (3000), Nginx strips/validates
  - Certificate: Let's Encrypt or AWS ACM (auto-renewed)
  - HSTS: Add header `Strict-Transport-Security: max-age=31536000`

- [ ] **TLS version** ≥ 1.2
  - Minimum: TLS 1.2
  - Preferred: TLS 1.3 (if supported by proxy)
  - Verification: `openssl s_client -connect host:443`

#### Headers & Policies

- [ ] **Security headers** set (Helmet.js)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy: default-src 'self'`
  - Status: ✅ Helmet imported in app.js

- [ ] **CORS headers** restrictive
  - Allow only frontend origin
  - Block credentials from cross-origin requests
  - Test: `curl -H "Origin: evil.com" http://localhost:3000/api/crv`

#### Input Validation

- [ ] **All endpoints** validate input
  - Library: express-validator
  - Pattern: `check('field').isLength({min: 1})`
  - Gate: 400 (Bad Request) returned for invalid input

- [ ] **SQL injection** prevented (Mongoose)
  - Pattern: Use Mongoose query builder, never string concatenation
  - Scan: `grep -r 'find(.*\$' src` (should return nothing)

- [ ] **NoSQL injection** prevented
  - Inputs: Sanitized before DB queries
  - Pattern: Mongoose validates schema types

#### Dependency Scanning

- [ ] **npm audit** clean
  - Run: `npm audit --audit-level=moderate`
  - Fix: `npm audit fix` for auto-fixable
  - Review: Manual CVEs for unfixable (document exceptions)

- [ ] **SBOM** generated
  - Tool: `npm ls --json > sbom.json`
  - Review: Outdated dependencies list

---

## 📦 Docker & Container

### Dockerfile Template

```dockerfile
# Multi-stage build for Node.js CRV Backend

# Stage 1: Build dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build & test
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run test:coverage
RUN npm run build 2>/dev/null || echo "No build script"

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Security: Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Copy only necessary files
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env.example ./.env.example

# Metadata
LABEL org.opencontainers.image.title="CRV Backend"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/yourorg/crv-backend"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error('Health check failed')})"

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "src/server.js"]
```

### Docker Compose for Local Development

```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      MONGO_URI: mongodb://mongo:27017/crv
      JWT_SECRET: dev-secret-change-in-prod
      CORS_ORIGIN: http://localhost:5173
    depends_on:
      - mongo
      - redis
    volumes:
      - ./src:/app/src
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Build & Push

```bash
# Build locally
docker build -t crv-backend:latest .
docker build -t crv-backend:1.0.0 .

# Run locally
docker run -p 3000:3000 --env-file .env.staging crv-backend:latest

# Push to registry
docker tag crv-backend:1.0.0 registry.example.com/crv-backend:1.0.0
docker push registry.example.com/crv-backend:1.0.0
```

---

## 🚀 Kubernetes Deployment (Production)

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crv-backend
  namespace: production
  labels:
    app: crv-backend
    version: "1.0.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: crv-backend
  template:
    metadata:
      labels:
        app: crv-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: crv-backend
      securityContext:
        fsGroup: 1001
        runAsNonRoot: true
      containers:
      - name: api
        image: registry.example.com/crv-backend:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: crv-secrets
              key: mongo-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: crv-secrets
              key: jwt-secret
        - name: CORS_ORIGIN
          value: "https://crv.example.com"
        - name: SENTRY_DSN
          valueFrom:
            secretKeyRef:
              name: crv-secrets
              key: sentry-dsn
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: tmp
        emptyDir: {}
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - crv-backend
              topologyKey: kubernetes.io/hostname

---
apiVersion: v1
kind: Service
metadata:
  name: crv-backend
  namespace: production
spec:
  selector:
    app: crv-backend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: crv-backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: crv-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 📊 Monitoring & Alerting

### Prometheus Configuration

```yaml
# prometheus.yml (scrape config)
scrape_configs:
  - job_name: 'crv-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
```

### Alert Rules

```yaml
# alert-rules.yml
groups:
- name: crv-backend
  interval: 30s
  rules:
  
  # 🔴 CRITICAL: API down
  - alert: CRVBackendDown
    expr: up{job="crv-backend"} == 0
    for: 2m
    annotations:
      summary: "CRV Backend is down"
      runbook: "RUNBOOK.md#pod-restart"
  
  # 🔴 CRITICAL: High error rate
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    annotations:
      summary: "Error rate > 5%"
      runbook: "RUNBOOK.md#investigate-logs"
  
  # 🟡 WARNING: High latency
  - alert: HighLatency
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
    for: 5m
    annotations:
      summary: "P95 latency > 1s"
      runbook: "RUNBOOK.md#optimize-queries"
  
  # 🟡 WARNING: Memory pressure
  - alert: HighMemoryUsage
    expr: node_memory_usage_bytes / node_memory_limit_bytes > 0.85
    for: 5m
    annotations:
      summary: "Memory > 85%"
      runbook: "RUNBOOK.md#scale-up"
  
  # 🟡 WARNING: Database connection errors
  - alert: MongoConnectionErrors
    expr: increase(mongo_connection_errors_total[5m]) > 0
    annotations:
      summary: "MongoDB connection errors"
      runbook: "RUNBOOK.md#check-mongo"
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

#### Database (MongoDB)

```bash
# Daily backup (3:00 AM UTC)
0 3 * * * mongodump --uri="$MONGO_URI" --out=/backup/mongo-$(date +\%Y\%m\%d)

# Retention: 30 days
find /backup -name "mongo-*" -mtime +30 -exec rm -rf {} \;

# Weekly full to S3
aws s3 sync /backup/mongo-$(date +\%Y\%m\%d) s3://backups-prod/mongo/
```

#### Configuration & Secrets

```bash
# Backup Kubernetes secrets
kubectl get secrets -n production -o yaml > /backup/secrets-$(date +%Y%m%d).yaml

# Encrypt & store
gpg --symmetric /backup/secrets-*.yaml
aws s3 cp /backup/secrets-*.yaml.gpg s3://backups-prod/
```

### Restore Procedure

#### MongoDB Restore

```bash
# 1. List available backups
aws s3 ls s3://backups-prod/mongo/

# 2. Download backup
aws s3 sync s3://backups-prod/mongo/mongo-20260610 /tmp/restore/

# 3. Restore (requires empty database)
mongorestore --uri="$MONGO_URI" --dir=/tmp/restore

# 4. Verify
mongo "$MONGO_URI" --eval "db.stats()"
```

#### Full Cluster Restore

See RUNBOOK.md → Disaster Recovery section

---

## ✅ Pre-Launch Verification

### Build Verification

```bash
# Build succeeds
docker build -t crv-backend:test .
# ✅ Expected: Build completes in < 5 min, no errors

# Tests pass in container
docker run crv-backend:test npm test
# ✅ Expected: 396/396 tests passing

# Health check passes
docker run -p 3000:3000 crv-backend:test &
sleep 5
curl http://localhost:3000/health
# ✅ Expected: { status: 'ok', timestamp: '...' }

# Metrics endpoint works
curl http://localhost:3000/metrics | head -20
# ✅ Expected: Prometheus metrics in text format
```

### Capacity Planning

| Metric | Baseline | Safe Limit | Alert Threshold |
|--------|----------|------------|-----------------|
| CPU per pod | 50m | 400m | 70% |
| Memory per pod | 100Mi | 400Mi | 80% |
| DB connections | 20 | 100 | 90 |
| Request latency (p95) | 150ms | 500ms | 1s |
| Error rate | < 0.1% | < 1% | 5% |
| Disk (logs) | 1GB/day | 50GB | 80% full |

### Load Testing

```bash
# Tool: Apache Benchmark
ab -n 1000 -c 10 http://localhost:3000/health

# Tool: k6 (more realistic)
k6 run --vus 10 --duration 5m tests/load.js
```

---

## 🔄 Rollback Procedure

### Automatic Rollback (Kubernetes)

```bash
# If deployment fails, K8s automatically rolls back
kubectl rollout undo deployment/crv-backend -n production

# Manual rollback (if needed)
kubectl rollout history deployment/crv-backend -n production
kubectl rollout undo deployment/crv-backend -n production --to-revision=2
```

### Manual Database Rollback

```bash
# If schema migrations fail:
1. Identify last known good backup: mongo-20260615
2. Restore to staging: mongorestore --uri="$STAGING_MONGO_URI" --dir=/backup/mongo-20260615
3. Run smoke tests
4. If OK, restore to production (requires approval)
mongorestore --uri="$PROD_MONGO_URI" --drop --dir=/backup/mongo-20260615
```

---

## 📋 Deployment Checklist (Day Of)

**Time estimate:** 30 minutes  
**Approvals needed:** Tech Lead, DevOps, Product Owner

- [ ] All tests passing (npm test)
- [ ] Coverage ≥ 60% (npm run test:coverage)
- [ ] No lint errors (npm run lint)
- [ ] Docker build succeeds (docker build -t crv-backend:X.Y.Z .)
- [ ] Health check responds (curl /health)
- [ ] Metrics endpoint works (curl /metrics)
- [ ] All env vars documented in .env.example
- [ ] Secrets stored in Vault / Secrets Manager
- [ ] Runbook updated and reviewed
- [ ] Backups tested (restore procedure validated)
- [ ] Alert rules deployed and tested
- [ ] On-call team notified
- [ ] Rollback plan confirmed
- [ ] Stakeholders notified of deployment window

---

## 🆘 Support & Escalation

**Issues during deployment?**

1. **Pod fails to start:** Check logs → `kubectl logs <pod-name> -n production`
2. **Health check fails:** Debug `/health` endpoint → RUNBOOK.md
3. **Database connection error:** Verify MONGO_URI → Check MongoDB status
4. **Metrics not scraping:** Verify `/metrics` endpoint → Check Prometheus config
5. **Need to rollback:** Run `kubectl rollout undo deployment/crv-backend`

**Escalation:**
- Tech Lead: If decision needed
- DevOps: If infrastructure issue
- DBA: If database issue
- Product Owner: If we need to wait/delay

---

**Prepared by:** Claude Code Agent  
**Date:** June 16, 2026  
**Version:** 1.0.0-rc1  
**Status:** Ready for Phase A → Phase F Preparation
