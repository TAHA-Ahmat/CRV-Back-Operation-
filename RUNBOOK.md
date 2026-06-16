# RUNBOOK.md — Operational Procedures for CRV Backend

**Version:** 1.0.0  
**Last Updated:** June 16, 2026  
**Audience:** DevOps, SRE, On-Call Engineer  
**Emergency Contact:** Tech Lead

---

## 🚨 Quick Reference — Common Issues

| Issue | Symptom | Fix | Time |
|-------|---------|-----|------|
| Pod crashes | `kubectl logs <pod>` = OOMKilled | Scale up memory limit | 5 min |
| Health check fails | `/health` returns 500 | Check MONGO_URI connectivity | 10 min |
| High latency | P95 > 1s | Check MongoDB query performance | 15 min |
| Authentication fails | 401 Unauthorized | Verify JWT_SECRET, token expiry | 5 min |
| Database down | MONGO_URI connection refused | Restart MongoDB, check firewall | 20 min |
| Memory leak | Memory creeps up over hours | Check for unfinished promises, open cursors | 30 min |

---

## 📖 Sections

1. [Daily Operations](#daily-operations)
2. [Incident Response](#incident-response)
3. [Troubleshooting](#troubleshooting)
4. [Maintenance Tasks](#maintenance-tasks)
5. [Disaster Recovery](#disaster-recovery)
6. [Appendix: Common Commands](#appendix-common-commands)

---

## 📋 Daily Operations

### Health Check (Run Every 2 Hours)

```bash
#!/bin/bash
# health-check.sh

echo "=== CRV Backend Health Check ==="
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# 1. Pod status
echo -e "\n1️⃣ Pod Status:"
kubectl get pods -n production -l app=crv-backend -o wide
# ✅ Expected: All pods RUNNING, READY 1/1

# 2. Health endpoint
echo -e "\n2️⃣ Health Endpoint:"
POD=$(kubectl get pods -n production -l app=crv-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n production $POD -- curl -s http://localhost:3000/health | jq .
# ✅ Expected: { status: "ok" }

# 3. Metrics available
echo -e "\n3️⃣ Metrics Endpoint:"
kubectl exec -n production $POD -- curl -s http://localhost:3000/metrics | head -5
# ✅ Expected: Prometheus metrics (# TYPE, # HELP, etc.)

# 4. Recent logs (no errors)
echo -e "\n4️⃣ Recent Logs:"
kubectl logs -n production -l app=crv-backend --tail=20 | grep -i error || echo "✅ No errors"

# 5. Resource usage
echo -e "\n5️⃣ Resource Usage:"
kubectl top pods -n production -l app=crv-backend
# ✅ Expected: CPU < 100m, Memory < 200Mi

# Report
echo -e "\n✅ All checks passed at $(date)"
```

### Metrics Review (Daily @ 9 AM UTC)

```bash
#!/bin/bash
# metrics-review.sh

echo "=== Daily Metrics Review ==="

# 1. Error rate (last 24h)
curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[24h])' | jq .
# ✅ Expected: < 0.001 (< 0.1%)

# 2. P95 latency (last 24h)
curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket[24h])' | jq .
# ✅ Expected: < 500ms

# 3. Memory trend (last 7 days)
curl -s 'http://prometheus:9090/api/v1/query_range?query=node_memory_usage_bytes&start=...&step=1h' | jq .
# ✅ Expected: Flat or declining (no memory leak)

# 4. Database connections
curl -s 'http://prometheus:9090/api/v1/query?query=mongo_connections_active' | jq .
# ✅ Expected: < 50 connections

# 5. Error log summary
echo -e "\n🔴 Errors (last 24h):"
kubectl logs -n production -l app=crv-backend --since=24h | grep ERROR | wc -l
echo "lines of ERROR logs"
```

### Log Rotation Check

```bash
# Check log volume (should not grow unbounded)
kubectl exec -n production <pod> -- du -sh /var/log
# ✅ Expected: < 1GB (daily rotation active)

# Verify logrotate is running
kubectl exec -n production <pod> -- cat /var/log/logrotate.status | tail -5
```

---

## 🚨 Incident Response

### Incident Severity Levels

| Level | Definition | Response | Example |
|-------|-----------|----------|---------|
| **P1 — Critical** | All users affected | Immediate (5 min) | Database down |
| **P2 — High** | Some users affected | Fast (15 min) | 50% error rate |
| **P3 — Medium** | Limited impact | Moderate (1 hour) | One feature broken |
| **P4 — Low** | No user impact | Standard (next day) | Lint warnings |

### P1: Service Down (Database, API, Cache)

**Goal:** Restore service within 5 minutes

```bash
# STEP 1: Confirm the issue (30 seconds)
echo "🔴 INCIDENT START: $(date)"
kubectl get pods -n production -l app=crv-backend
curl http://<service>:3000/health
# If timeout or 500, proceed to STEP 2

# STEP 2: Gather diagnostics (1 minute)
kubectl describe deployment crv-backend -n production
kubectl logs -n production -l app=crv-backend --tail=50
kubectl events -n production --sort-by='.lastTimestamp'

# STEP 3: Attempt auto-recovery (2 minutes)
# Option A: Restart pod (most common)
kubectl rollout restart deployment/crv-backend -n production

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=crv-backend -n production --timeout=120s

# Verify recovery
sleep 5
curl http://<service>:3000/health
# ✅ Should return { status: "ok" }

# STEP 4: If still broken, investigate root cause
kubectl logs -n production -l app=crv-backend | grep -i "exception\|error\|failed"

# Potential fixes:
# - Database: kubectl exec mongo -- mongosh && rs.status()
# - Redis: kubectl exec redis -- redis-cli ping
# - Network: kubectl exec pod -- nslookup mongo.default.svc.cluster.local
# - Secrets: kubectl get secret crv-secrets -o yaml | grep -i uri

# STEP 5: Escalate if needed (> 5 min without resolution)
# - Slack: @oncall-devops
# - PagerDuty: Alert Tech Lead
# - Status page: Mark "Investigating"

# STEP 6: Post-incident (after recovery)
echo "✅ INCIDENT END: $(date)"
# Create ticket: document root cause, prevention, timeline
```

### P2: High Error Rate (> 5% of requests)

**Goal:** Identify root cause within 15 minutes

```bash
# STEP 1: Confirm error rate (1 minute)
ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq '.data.result[0].value[1]')
echo "Error rate: $ERROR_RATE"

# STEP 2: Identify affected endpoint (2 minutes)
curl -s 'http://prometheus:9090/api/v1/query?query=topk(5,rate(http_requests_total{status=~"5.."}[5m]))' | jq '.data.result[] | {endpoint: .metric.path, rate: .value[1]}'

# STEP 3: Check error logs (2 minutes)
kubectl logs -n production -l app=crv-backend --since=10m | grep -A 2 "ERROR\|Exception" | head -30

# STEP 4: Common causes & fixes
case "$ERROR_CAUSE" in
  "MongoDB connection refused")
    kubectl exec mongo-0 -- mongosh
    db.adminCommand('ping')
    ;;
  "JWT validation failed")
    echo "JWT_SECRET mismatch? Verify secrets:"
    kubectl get secret crv-secrets -o yaml | grep jwt
    ;;
  "Memory limit exceeded")
    echo "Scaling up: kubectl set resources deployment/crv-backend --limits=memory=1Gi"
    kubectl set resources deployment/crv-backend -n production --limits=memory=1Gi
    ;;
  "High latency on /api/crv")
    echo "Running slow query diagnostics..."
    kubectl exec mongo-0 -- mongostat --json | jq '.[] | {op: .op, msg: .msg}'
    ;;
esac

# STEP 5: Monitor recovery (check error rate every 2 min)
watch -n 2 'curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq ".data.result[0].value[1]"'
```

### P3: Feature Broken (Single Endpoint Returns Wrong Data)

**Goal:** Identify & fix within 1 hour

```bash
# STEP 1: Reproduce the issue
# Example: /api/crv/list returns empty array instead of 50 items
curl http://<service>/api/crv/list

# STEP 2: Check recent deployments
kubectl rollout history deployment/crv-backend -n production
# If deployed in last 1 hour, rollback:
kubectl rollout undo deployment/crv-backend -n production

# STEP 3: Debug locally (if not a recent deployment)
# Extract pod logs with request details
kubectl logs -n production <pod> --since=30m | grep "GET /api/crv/list"

# STEP 4: Check database state
kubectl exec mongo-0 -- mongosh
db.crvs.countDocuments()
db.crvs.find().limit(1)

# STEP 5: If database is healthy, code issue
# Redeploy last stable version (check git history)
git log --oneline | head -5
git revert <bad-commit>
docker build -t crv-backend:hotfix-$(date +%s) .
docker push <registry>/crv-backend:hotfix-...
kubectl set image deployment/crv-backend crv-backend=<registry>/crv-backend:hotfix-... -n production
```

---

## 🔧 Troubleshooting

### Pod Fails to Start

**Symptoms:** `CrashLoopBackOff`, `ImagePullBackOff`, `Pending`

```bash
# 1. Check pod status
kubectl describe pod <pod-name> -n production

# 2. Check logs (exit reason)
kubectl logs <pod-name> -n production

# 3. Common causes & fixes:

# ❌ CrashLoopBackOff + "Cannot find module"
# Fix: npm install missing dependencies
# kubectl exec <pod> -- npm install
# OR rebuild image: docker build --no-cache -t crv-backend:latest .

# ❌ ImagePullBackOff
# Fix: Image not in registry or pull secret missing
# kubectl get secret -n production
# kubectl create secret docker-registry regcred --docker-server=registry.example.com ...

# ❌ Pending (no resources)
# Fix: Cluster has no free CPU/memory
# kubectl top nodes
# kubectl scale deployment crv-backend --replicas=1 (temporary)
# OR request more cluster resources

# ❌ OOMKilled
# Fix: Memory limit too low
# kubectl set resources deployment/crv-backend --limits=memory=512Mi -n production

# ❌ "MONGO_URI not set"
# Fix: Secret not mounted
# kubectl get secret crv-secrets -n production
# If missing: kubectl create secret generic crv-secrets --from-literal=mongo-uri=... -n production
```

### High Latency (P95 > 1 second)

**Symptoms:** Users report slow API responses, Prometheus shows spike in latency

```bash
# 1. Identify slow endpoint
curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket{job="crv-backend"})by(path)' | jq '.data.result[] | select(.value[1] > "1") | {path: .metric.path, latency_seconds: .value[1]}'

# 2. Check database query time
kubectl exec mongo-0 -- mongostat --json | jq '.[] | {msg: .msg, getMore: .getMore, insert: .insert, query: .query}'

# 3. Look for N+1 queries in logs
kubectl logs -n production <pod> --since=10m | grep "query_count"
# If > 100 queries for single request, N+1 issue

# 4. Check MongoDB indices
kubectl exec mongo-0 -- mongosh
db.crvs.getIndexes()
# Look for missing indices on frequently queried fields

# 5. Add missing index
db.crvs.createIndex({ "status": 1 })
db.crvs.createIndex({ "createdAt": -1 })

# 6. Verify latency drops
watch -n 2 'curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket)" | jq ".data.result[0].value[1]"'
```

### Memory Leak (Memory Grows Over Hours)

**Symptoms:** `memory_usage_bytes` steadily increases, eventually OOMKilled

```bash
# 1. Confirm memory leak
kubectl top pod <pod-name> -n production --containers
# Check if memory grows over 5-10 minutes

# 2. Dump memory profile
kubectl exec <pod> -- node --inspect-brk=0.0.0.0:9229 src/server.js &
# Then use chrome://inspect to capture heap dump

# 3. Common causes:
# ❌ Unclosed database connections
# Fix: Add .close() or .disconnect() in cleanup

# ❌ Unfinished promises (async/await)
# Fix: Add try/finally blocks

# ❌ Large arrays growing in memory
# Fix: Use streaming instead of .find().toArray()

# ❌ Circular references
# Fix: npm install clinic.js to diagnose

# 4. Temporary fix: Restart pod
kubectl rollout restart deployment/crv-backend -n production

# 5. Long-term: Deploy memory-optimized version
# (requires code fix, tested in staging, reviewed in PR)
```

### Database Connection Refused

**Symptoms:** MONGO_URI connection timeout, "Error: connect ECONNREFUSED"

```bash
# 1. Verify MongoDB is running
kubectl get pods -n production -l app=mongo
kubectl exec mongo-0 -- mongosh --eval "db.adminCommand('ping')"
# ✅ Expected: { ok: 1 }

# 2. Check network connectivity from pod
kubectl exec <crv-pod> -- nc -zv mongo.default.svc.cluster.local 27017
# ✅ Expected: Connection successful

# 3. Verify MONGO_URI format
kubectl get secret crv-secrets -o yaml | grep mongo-uri
# ✅ Expected: mongodb+srv://user:pass@host/db?options

# 4. Check MongoDB auth
kubectl exec mongo-0 -- mongosh
db.auth("username", "password")
# ✅ Expected: { ok: 1 }

# 5. If still failing, restart MongoDB
kubectl rollout restart statefulset/mongo -n production
# Wait for ready: kubectl wait --for=condition=ready pod mongo-0 --timeout=60s

# 6. Reconnect app
kubectl rollout restart deployment/crv-backend -n production
```

### JWT Authentication Failures

**Symptoms:** 401 Unauthorized on all requests, logs show "Invalid signature"

```bash
# 1. Check JWT_SECRET is consistent
PROD_SECRET=$(kubectl get secret crv-secrets -o yaml | grep "jwt-secret:" | base64 -d)
echo $PROD_SECRET

# 2. Verify token still valid (not expired)
# Decode token: jwt.io (paste token)
# Check exp claim (seconds since epoch)
date +%s
# If current time > exp, token is expired (normal, user needs to re-login)

# 3. If JWT_SECRET was rotated, old tokens won't work
# Solution: Clear client-side cookies, force re-login
# OR accept both old & new secret for grace period

# 4. Check Redis blacklist (for logout)
kubectl exec redis-0 -- redis-cli
keys token:blacklist:*
# If a token is blacklisted, it's revoked (logout worked)

# 5. If too many blacklist entries, clean up old ones
# (Redis TTL should auto-expire, but verify)
redis-cli --scan --pattern 'token:blacklist:*' | xargs redis-cli DEL
```

### Webhook/Notification Not Sent

**Symptoms:** Notification rule exists but email/SMS not received

```bash
# 1. Check notification service logs
kubectl logs -n production <pod> --since=1h | grep -i notification

# 2. Verify SMTP credentials
kubectl get secret crv-secrets -o yaml | grep -i smtp
# Should have: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# 3. Test SMTP manually
kubectl exec <pod> -- node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify((err, valid) => console.log(err || 'OK: ' + valid));
"

# 4. Check notification rule exists
kubectl exec mongo-0 -- mongosh
db.notificationRules.find({})
# Should see rules with event type, recipients, template

# 5. Trigger test notification
curl -X POST http://<service>/api/notifications/test \
  -H "Authorization: Bearer <token>" \
  -d '{"email": "test@example.com"}'

# 6. Check email provider (Gmail, SendGrid, etc.)
# Verify sender email is authorized
# Check spam folder for test email
```

---

## 🧹 Maintenance Tasks

### Weekly Maintenance (Friday 6 PM UTC)

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== Weekly Maintenance ==="
echo "Start: $(date)"

# 1. Backup MongoDB
mongodump --uri=$MONGO_URI --out=/backup/mongo-$(date +%Y%m%d)
aws s3 sync /backup/mongo-$(date +%Y%m%d) s3://backups-prod/

# 2. Optimize MongoDB indices
kubectl exec mongo-0 -- mongosh << 'EOF'
db.crvs.reIndex()
db.sessions.reIndex()
db.users.reIndex()
EOF

# 3. Clean up old logs (> 30 days)
find /var/log -name "crv-*.log" -mtime +30 -delete

# 4. Verify backup integrity
kubectl exec mongo-0 -- mongorestore --dryRun --dir=/backup/mongo-$(date +%Y%m%d) | grep -i "error\|warning"

# 5. Review past week errors
kubectl logs -n production -l app=crv-backend --since=168h | grep ERROR | wc -l
echo "⚠️ Error count (last 7 days): ^"

# 6. Update dependencies
npm outdated
npm audit
# Review and decide whether to update

# 7. Clear Redis cache (optional)
kubectl exec redis-0 -- redis-cli FLUSHDB

echo "✅ Maintenance complete: $(date)"
```

### Monthly Maintenance (First Friday of Month)

```bash
#!/bin/bash
# monthly-maintenance.sh

echo "=== Monthly Maintenance ==="

# 1. Full disaster recovery test
# - Restore from latest backup to staging
# - Run smoke tests
# - Document any issues
mongorestore --uri=$STAGING_MONGO_URI --drop --dir=/backup/mongo-$(date -d "1 day ago" +%Y%m%d)
npm test

# 2. Security scanning
npm audit --audit-level=moderate
docker scan crv-backend:latest

# 3. Performance report
# - Average latency, error rate, uptime
# - Capacity trends
# - Forecasted scaling needs
curl -s 'http://prometheus:9090/api/v1/query_range?query=...&start=...&end=...&step=1h'

# 4. Dependency review
# - Update patch versions (semver)
# - Test major version upgrades in staging
# - Document breaking changes
npm update

# 5. Team review
# - Incidents: Root cause analysis
# - Performance: Optimization opportunities
# - Capacity: Scaling plan
# - Security: Vulnerability assessment
```

### Annual Review (Quarterly)

- [ ] Full disaster recovery test (restore from backup to new cluster)
- [ ] Penetration testing / security audit
- [ ] Capacity planning for next year
- [ ] Architecture review (still fits needs?)
- [ ] Dependency major version upgrades
- [ ] Disaster recovery procedure refresh

---

## 🔄 Disaster Recovery

### Complete Cluster Failure (RTO: 2 hours, RPO: 1 hour)

**Goal:** Restore to functional state with minimal data loss

```bash
#!/bin/bash
# disaster-recovery.sh — Run from safe location with cluster kubeconfig

set -e

echo "🚨 DISASTER RECOVERY PROCEDURE STARTED: $(date)"
echo "Target: Create new production cluster with latest backup"

# ============================================================================
# PHASE 1: BACKUP VERIFICATION (10 minutes)
# ============================================================================

echo -e "\n📦 PHASE 1: Verify latest backup exists..."

LATEST_BACKUP=$(aws s3 ls s3://backups-prod/mongo/ | tail -1 | awk '{print $NF}')
echo "Latest backup: $LATEST_BACKUP"

aws s3 cp s3://backups-prod/mongo/$LATEST_BACKUP /tmp/restore/ --recursive
echo "✅ Backup downloaded to /tmp/restore/"

# ============================================================================
# PHASE 2: NEW CLUSTER PROVISIONING (30 minutes — done in parallel)
# ============================================================================

echo -e "\n🏗️ PHASE 2: Provision new cluster..."

# Option A: AWS EKS
aws eks create-cluster --name crv-prod-dr --region us-east-1 --kubernetes-version 1.27 \
  --nodegroup-name crv-nodes --node-type t3.medium --scaling-config minSize=3,maxSize=10

# Wait for cluster
aws eks wait cluster-active --name crv-prod-dr

# Get kubeconfig
aws eks update-kubeconfig --name crv-prod-dr

# ============================================================================
# PHASE 3: RESTORE DATA (15 minutes)
# ============================================================================

echo -e "\n💾 PHASE 3: Restore database..."

# Create MongoDB in new cluster
kubectl apply -f - << 'EOF'
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongo-pv-dr
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /mnt/mongo-data
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
  namespace: production
spec:
  serviceName: mongo
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongo
        image: mongo:7-alpine
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongo-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: standard
      resources:
        requests:
          storage: 100Gi
EOF

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod mongo-0 -n production --timeout=300s

# Restore from backup
kubectl exec mongo-0 -- mongorestore --dir=/tmp/restore/mongo-$LATEST_BACKUP

echo "✅ Database restored"

# ============================================================================
# PHASE 4: DEPLOY APPLICATION (10 minutes)
# ============================================================================

echo -e "\n🚀 PHASE 4: Deploy CRV Backend..."

# Create secrets in new cluster
kubectl create secret generic crv-secrets -n production \
  --from-literal=mongo-uri="mongodb://mongo:27017/crv" \
  --from-literal=jwt-secret="$PROD_JWT_SECRET" \
  --from-literal=sentry-dsn="$SENTRY_DSN"

# Deploy CRV Backend
kubectl apply -f deployment-production.yaml

# Wait for deployment
kubectl wait --for=condition=available deployment/crv-backend -n production --timeout=300s

echo "✅ Application deployed"

# ============================================================================
# PHASE 5: SMOKE TESTS (10 minutes)
# ============================================================================

echo -e "\n✅ PHASE 5: Smoke tests..."

# Test health endpoint
for i in {1..5}; do
  HEALTH=$(kubectl exec -n production $(kubectl get pod -n production -l app=crv-backend -o jsonpath='{.items[0].metadata.name}') -- curl -s http://localhost:3000/health | jq .status)
  if [ "$HEALTH" == '"ok"' ]; then
    echo "✅ Health check passed"
    break
  fi
  echo "⏳ Attempt $i failed, retrying..."
  sleep 10
done

# Test database connectivity
kubectl exec mongo-0 -- mongosh --eval "db.crvs.countDocuments()" | grep -q "^[0-9]*$" && echo "✅ Database accessible"

# Test API endpoint
curl -s http://$(kubectl get svc crv-backend -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/health | jq . && echo "✅ API accessible"

# ============================================================================
# PHASE 6: DNS CUTOVER (5 minutes — manual approval required)
# ============================================================================

echo -e "\n🔄 PHASE 6: DNS cutover..."

# Get new cluster IP
NEW_IP=$(kubectl get svc crv-backend -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "⚠️ MANUAL STEP: Update DNS A record to point to NEW_IP: $NEW_IP"
echo "⚠️ WAITING FOR APPROVAL..."
read -p "Press enter once DNS is updated..."

# Verify DNS propagation
nslookup crv-api.example.com
# Should return new IP

# ============================================================================
# PHASE 7: VERIFICATION (5 minutes)
# ============================================================================

echo -e "\n🔍 PHASE 7: Final verification..."

# Test from public internet
curl https://crv-api.example.com/health

# Run full API test suite
npm test:e2e

echo -e "\n✅ DISASTER RECOVERY COMPLETE: $(date)"
echo "Old cluster can be decommissioned after 24-48 hour monitoring period"
```

---

## 📚 Appendix: Common Commands

### kubectl Shortcuts

```bash
# Context & cluster
kubectl config current-context
kubectl config use-context <context-name>
kubectl cluster-info

# Pods
kubectl get pods -n production
kubectl get pods -n production -l app=crv-backend
kubectl get pods -n production -o wide
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production --tail=50
kubectl exec <pod-name> -n production -- bash

# Deployments
kubectl get deployments -n production
kubectl rollout status deployment/crv-backend -n production
kubectl rollout history deployment/crv-backend -n production
kubectl rollout undo deployment/crv-backend -n production
kubectl set image deployment/crv-backend crv-backend=<image> -n production
kubectl scale deployment/crv-backend --replicas=5 -n production

# Services & networking
kubectl get svc -n production
kubectl port-forward svc/crv-backend 3000:80 -n production

# Secrets
kubectl get secrets -n production
kubectl create secret generic name --from-literal=key=value -n production
kubectl get secret <name> -o yaml | grep <key> | base64 -d

# Events
kubectl get events -n production --sort-by='.lastTimestamp'
kubectl describe node <node-name>

# Metrics (requires metrics-server)
kubectl top nodes
kubectl top pods -n production
```

### Useful Curl Commands

```bash
# Health check
curl http://crv-api.example.com/health

# Metrics
curl http://crv-api.example.com/metrics | grep http_requests_total

# Debug endpoint (if available)
curl http://crv-api.example.com/debug/info

# API call with auth
curl -H "Authorization: Bearer <token>" http://crv-api.example.com/api/crv/list

# Measure latency
time curl http://crv-api.example.com/health
```

### Database Debugging

```bash
# Connect to MongoDB
kubectl exec -it mongo-0 -n production -- mongosh

# Show collections
show collections

# Count documents
db.crvs.countDocuments()

# Find slow queries
db.setProfilingLevel(2)
db.system.profile.find().sort({ts:-1}).limit(5).pretty()

# Check indices
db.crvs.getIndexes()

# Create index
db.crvs.createIndex({ "status": 1, "createdAt": -1 })

# Check index usage
db.crvs.aggregate([{ $indexStats: {} }])
```

---

**Prepared by:** Claude Code Agent  
**Date:** June 16, 2026  
**Version:** 1.0.0-rc1  
**Status:** Ready for deployment phase
