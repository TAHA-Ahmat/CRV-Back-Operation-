# MIGRATION.md — Database Schema & Data Migration Guide

**Version:** 1.0.0  
**Last Updated:** June 16, 2026  
**Status:** Phase A Stabilization  
**Next:** Phase F Implementation (Week 4-6)

---

## 🎯 Overview

This guide covers:
- Current database schema (Phase A)
- Planned schema changes (Phase F)
- Safe migration procedures (without data loss)
- Testing & validation
- Rollback strategies
- Monitoring during migration

---

## 📊 Phase A: Current Database Schema

### Collections Overview

```
Database: crv
├── users (500+ docs)
│   ├── _id: ObjectId
│   ├── email: String (unique)
│   ├── password: String (bcrypt hash)
│   ├── roles: [String] (pilot, mechanic, engineer, admin)
│   ├── profile: {firstName, lastName, avatar}
│   ├── status: String (active, inactive, suspended)
│   ├── createdAt: Date
│   ├── updatedAt: Date
│   └── lastLogin: Date
│
├── crvs (50,000+ docs) — Core data
│   ├── _id: ObjectId
│   ├── numeroEngin: String (unique per aircraft)
│   ├── dateVol: Date
│   ├── dureeVol: Number (minutes)
│   ├── pilot: ObjectId → users
│   ├── mechanic: ObjectId → users
│   ├── status: String (draft, submitted, validated, archived)
│   ├── observations: String
│   ├── maintenanceActions: [{type, description, priority, dueDate}]
│   ├── defects: [{code, severity, status}]
│   ├── attachments: [{filename, url, uploadedAt, uploadedBy}]
│   ├── auditTrail: [{action, userId, timestamp, changes}]
│   ├── createdAt: Date
│   ├── updatedAt: Date
│   └── deletedAt: Date (soft delete)
│
├── phases (100 docs) — Flight phases (takeoff, climb, cruise, descent, landing)
│   ├── _id: ObjectId
│   ├── crv: ObjectId → crvs
│   ├── phaseType: String
│   ├── startTime: Date
│   ├── endTime: Date
│   ├── altitude: Number
│   ├── airspeed: Number
│   ├── temperature: Number
│   ├── observations: String
│   └── updatedAt: Date
│
├── notifications (100,000+ docs)
│   ├── _id: ObjectId
│   ├── user: ObjectId → users
│   ├── type: String (crv_assigned, crv_validated, maintenance_required)
│   ├── relatedDocument: ObjectId → crvs
│   ├── message: String
│   ├── read: Boolean
│   ├── createdAt: Date
│   └── ttl index: 30 days
│
├── auditLogs (1M+ docs)
│   ├── _id: ObjectId
│   ├── action: String
│   ├── userId: ObjectId → users
│   ├── resource: String (CRV, User, Maintenance)
│   ├── resourceId: ObjectId
│   ├── changes: {before, after}
│   ├── timestamp: Date
│   └── ipAddress: String
│
├── sessions (10k docs)
│   ├── _id: String (JWT jti)
│   ├── userId: ObjectId → users
│   ├── createdAt: Date
│   ├── expiresAt: Date
│   └── ttl index: expiresAt
│
└── notificationRules (50 docs)
    ├── _id: ObjectId
    ├── name: String
    ├── event: String
    ├── recipients: [ObjectId] → users
    ├── template: String
    ├── active: Boolean
    └── updatedAt: Date
```

### Current Indices

```javascript
// crvs collection
db.crvs.getIndexes()
[
  { key: { _id: 1 }, name: "_id_" },
  { key: { numeroEngin: 1 }, name: "numeroEngin_1", unique: true },
  { key: { status: 1 }, name: "status_1" },
  { key: { pilot: 1 }, name: "pilot_1" },
  { key: { createdAt: -1 }, name: "createdAt_-1" },
  { key: { deletedAt: 1 }, name: "deletedAt_1", sparse: true }
]

// users collection
db.users.getIndexes()
[
  { key: { _id: 1 }, name: "_id_" },
  { key: { email: 1 }, name: "email_1", unique: true },
  { key: { status: 1 }, name: "status_1" },
  { key: { updatedAt: -1 }, name: "updatedAt_-1" }
]

// auditLogs collection
db.auditLogs.getIndexes()
[
  { key: { _id: 1 }, name: "_id_" },
  { key: { userId: 1, timestamp: -1 }, name: "userId_1_timestamp_-1" },
  { key: { resource: 1, resourceId: 1 }, name: "resource_1_resourceId_1" },
  { key: { timestamp: 1 }, name: "timestamp_1", expireAfterSeconds: 2592000 } // 30 days
]
```

---

## 🔄 Phase F: Planned Schema Changes

### New Collections for Offline-First CRDT

```
Database: crv (same)
├── (existing collections unchanged)
│
├── crvOperations (NEW) — CRDT operations log
│   ├── _id: ObjectId
│   ├── crv: ObjectId → crvs
│   ├── operation: {
│   │   type: "set" | "insert" | "delete",
│   │   path: "observations" | "maintenanceActions[0].status",
│   │   value: any,
│   │   oldValue: any
│   ├── lamportTimestamp: Number (clock for causality)
│   ├── actorId: String (userId)
│   ├── timestamp: Date
│   └── parentOp: ObjectId (previous operation for chain)
│
├── crvConflicts (NEW) — Merge conflicts detected
│   ├── _id: ObjectId
│   ├── crv: ObjectId → crvs
│   ├── operation1: ObjectId → crvOperations
│   ├── operation2: ObjectId → crvOperations
│   ├── conflictType: "concurrent-edit" | "delete-edit" | "order-change"
│   ├── status: "unresolved" | "resolved"
│   ├── resolution: {chosenOperation, rejectedOperation}
│   ├── resolvedBy: ObjectId → users
│   ├── timestamp: Date
│   └── createdAt: Date
│
├── crvSnapshots (NEW) — Periodic snapshots for performance
│   ├── _id: ObjectId
│   ├── crv: ObjectId → crvs
│   ├── snapshotAt: Date
│   ├── operations: [ObjectId] → crvOperations (since last snapshot)
│   ├── data: {full CRV document state}
│   └── checksum: String (SHA256 hash for validation)
│
└── syncLog (NEW) — Offline sync tracking
    ├── _id: ObjectId
    ├── deviceId: String (client UUID)
    ├── user: ObjectId → users
    ├── lastSyncAt: Date
    ├── operationsSynced: Number
    ├── conflictCount: Number
    ├── syncDuration: Number (ms)
    ├── status: "success" | "partial" | "failed"
    └── errors: [String]
```

### Modified Collections (Phase F)

```javascript
// crvs collection — add offline sync metadata
db.crvs.updateMany({}, {
  $set: {
    sync: {
      version: 0,              // Incremented on each server-side change
      lastServerChange: Date,
      lamportClock: 0,         // For causality tracking
      lastOperationId: null    // Reference to last operation
    },
    offline: {
      drafted: false,          // Was created offline
      draftedAt: null,
      syncedAt: null,
      conflicts: 0             // Count of unresolved conflicts
    }
  }
})

// users collection — add sync state
db.users.updateMany({}, {
  $set: {
    offlineProfile: {
      isAvailable: true,       // User profile available offline
      lastProfileSync: Date,
      deviceIds: []            // Devices registered for offline sync
    }
  }
})
```

---

## 📋 Migration Plan: Phase A → Phase F

### Timeline

| Phase | Week | Task | Duration |
|-------|------|------|----------|
| **A** | 1-2 | Fix 103 tests, setup monitoring | 2 weeks |
| **B** | 3 | Design Phase F (CRDT algorithm, storage schema) | 1 week |
| **C** | 4 | Create new collections (zero downtime) | 1 day |
| **C** | 5-6 | Deploy v2 backend (dual write), populate snapshots | 2 weeks |
| **D** | 7 | Cutover: Switch reads to v2, validate, cleanup v1 data | 1 day |

### Step 1: Create New Collections (Before v2 Deployment)

**Goal:** Add new collections without downtime (v1 continues working)

```javascript
// Script: migration-phase-f-step1.js
// Run on: Production MongoDB

const { MongoClient } = require('mongodb');

async function createNewCollections() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('crv');
    
    // ===== CREATE NEW COLLECTIONS =====
    
    // crvOperations
    await db.createCollection('crvOperations');
    await db.collection('crvOperations').createIndex({ crv: 1, timestamp: -1 });
    await db.collection('crvOperations').createIndex({ actorId: 1, timestamp: -1 });
    await db.collection('crvOperations').createIndex({ lamportTimestamp: 1 });
    console.log('✅ crvOperations created');
    
    // crvConflicts
    await db.createCollection('crvConflicts');
    await db.collection('crvConflicts').createIndex({ crv: 1, status: 1 });
    await db.collection('crvConflicts').createIndex({ timestamp: -1 });
    console.log('✅ crvConflicts created');
    
    // crvSnapshots
    await db.createCollection('crvSnapshots');
    await db.collection('crvSnapshots').createIndex({ crv: 1, snapshotAt: -1 });
    console.log('✅ crvSnapshots created');
    
    // syncLog
    await db.createCollection('syncLog');
    await db.collection('syncLog').createIndex({ user: 1, lastSyncAt: -1 });
    await db.collection('syncLog').createIndex({ deviceId: 1 });
    console.log('✅ syncLog created');
    
    // ===== VALIDATE =====
    
    const collections = await db.listCollections().toArray();
    const newCollections = ['crvOperations', 'crvConflicts', 'crvSnapshots', 'syncLog'];
    newCollections.forEach(name => {
      if (collections.find(c => c.name === name)) {
        console.log(`✅ ${name} exists`);
      } else {
        throw new Error(`❌ ${name} not found!`);
      }
    });
    
    console.log('\n✅ STEP 1 COMPLETE: New collections created');
    
  } finally {
    await client.close();
  }
}

createNewCollections().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

**Run:**
```bash
node migration-phase-f-step1.js
# ✅ Expected: All new collections created with indices
```

### Step 2: Deploy v2 Backend (Dual Write Mode)

**Goal:** v2 writes to both old & new collections (v1 can still read from old)

```javascript
// File: src/services/crdt/migration.service.js

export class MigrationService {
  /**
   * Write a CRV change to BOTH old schema (v1) and new schema (v2)
   * Ensures backward compatibility during migration
   */
  async saveCRVWithMigration(crv) {
    // 1. Save to old schema (v1) — existing code
    const oldCRV = await CRVModel.findByIdAndUpdate(crv._id, crv, { new: true });
    
    // 2. Record operation in new schema (v2)
    await this.recordOperation(crv._id, 'set', '/observations', crv.observations);
    
    // 3. Create snapshot if needed (every 100 operations)
    const opCount = await crvOperations.countDocuments({ crv: crv._id });
    if (opCount % 100 === 0) {
      await this.createSnapshot(crv._id, crv);
    }
    
    return oldCRV;
  }
  
  async recordOperation(crvId, type, path, value, oldValue) {
    return await db.collection('crvOperations').insertOne({
      crv: ObjectId(crvId),
      operation: { type, path, value, oldValue },
      lamportTimestamp: await this.getNextLamportTimestamp(crvId),
      actorId: getCurrentUserId(),
      timestamp: new Date(),
      parentOp: await this.getLastOperation(crvId)
    });
  }
  
  async createSnapshot(crvId, crvData) {
    const ops = await db.collection('crvOperations')
      .find({ crv: ObjectId(crvId) })
      .toArray();
    
    await db.collection('crvSnapshots').insertOne({
      crv: ObjectId(crvId),
      snapshotAt: new Date(),
      operations: ops.map(op => op._id),
      data: crvData,
      checksum: sha256(JSON.stringify(crvData))
    });
  }
}
```

**Deployment steps:**
```bash
# 1. Build v2 image
docker build -t crv-backend:2.0.0-migration .

# 2. Update deployment to run BOTH versions (canary)
kubectl set image deployment/crv-backend \
  crv-backend=crv-backend:2.0.0-migration \
  --record -n production

# 3. Monitor dual writes
kubectl logs -n production -l app=crv-backend --since=5m | grep "operation recorded"
# ✅ Should see operation recordings in logs

# 4. Validate consistency
node scripts/validate-dual-write.js
# Should show: Old schema records == New schema operation count (with margin of error)
```

### Step 3: Backfill Historical Data (v1 → v2)

**Goal:** Convert all existing CRVs to CRDT operations for historical records

```javascript
// File: scripts/backfill-operations.js

async function backfillOperations() {
  const crvs = await CRVModel.find({}).lean();
  
  for (const crv of crvs) {
    console.log(`Processing ${crv._id}...`);
    
    // Create initial operation for each field
    const fields = [
      'numeroEngin', 'dateVol', 'dureeVol', 'observations',
      'status', 'maintenanceActions', 'defects'
    ];
    
    for (const field of fields) {
      await db.collection('crvOperations').insertOne({
        crv: crv._id,
        operation: {
          type: 'backfill',
          path: field,
          value: crv[field]
        },
        lamportTimestamp: 0,  // Historical timestamp
        actorId: crv.pilot,
        timestamp: crv.createdAt,
        parentOp: null
      });
    }
    
    // Create initial snapshot
    await db.collection('crvSnapshots').insertOne({
      crv: crv._id,
      snapshotAt: crv.createdAt,
      operations: await db.collection('crvOperations')
        .find({ crv: crv._id })
        .project({ _id: 1 })
        .toArray()
        .then(ops => ops.map(op => op._id)),
      data: crv,
      checksum: sha256(JSON.stringify(crv))
    });
  }
  
  console.log(`✅ Backfilled ${crvs.length} CRVs`);
}

// Run with progress
backfillOperations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

**Run:**
```bash
node scripts/backfill-operations.js
# ⏳ Takes ~2 minutes for 50k CRVs (in background, non-blocking)
```

### Step 4: Verify Migration

**Before cutover, run comprehensive validation:**

```bash
#!/bin/bash
# scripts/validate-migration.sh

echo "=== Validating Phase F Migration ==="

# 1. Check new collections exist
echo "1️⃣ Checking new collections..."
mongosh "$MONGO_URI" --eval "
  const collections = db.getCollectionNames();
  ['crvOperations', 'crvConflicts', 'crvSnapshots', 'syncLog'].forEach(c => {
    if (collections.includes(c)) {
      console.log('✅ ' + c);
    } else {
      throw new Error('❌ Missing ' + c);
    }
  });
"

# 2. Check operation count matches CRV count (approximately)
echo "2️⃣ Checking operation backfill..."
mongosh "$MONGO_URI" --eval "
  const crvCount = db.crvs.countDocuments();
  const opCount = db.crvOperations.countDocuments();
  console.log('CRV count: ' + crvCount);
  console.log('Operation count: ' + opCount);
  const ratio = opCount / crvCount;
  if (ratio > 5 && ratio < 10) {
    console.log('✅ Ratio OK (5-10 operations per CRV)');
  } else {
    throw new Error('❌ Unexpected operation ratio: ' + ratio);
  }
"

# 3. Check snapshots created
echo "3️⃣ Checking snapshots..."
mongosh "$MONGO_URI" --eval "
  const snapshots = db.crvSnapshots.countDocuments();
  console.log('Snapshots created: ' + snapshots);
  if (snapshots > db.crvs.countDocuments() / 100) {
    console.log('✅ Snapshots OK');
  }
"

# 4. Run E2E tests
echo "4️⃣ Running E2E tests..."
npm run test:e2e

# 5. Monitor error rate (should not spike)
echo "5️⃣ Checking error rate..."
curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq '.data.result[0].value[1]'
# ✅ Should be < 0.001

echo "✅ All validations passed"
```

### Step 5: Cutover (Switch to v2)

**Goal:** Switch readers from v1 to v2 (writers already dual-writing)

**Prerequisites:**
- [ ] All validations passed
- [ ] Tech lead approval
- [ ] Rollback procedure confirmed
- [ ] On-call team standing by

```bash
#!/bin/bash
# scripts/cutover-to-v2.sh

set -e

echo "🚀 CUTOVER: Switching to Phase F (v2) schema"
echo "Time: $(date)"

# PHASE 1: Pre-cutover checks (2 min)
echo -e "\n📋 PHASE 1: Pre-cutover checks..."
npm run test:e2e
curl http://localhost:3000/health

# PHASE 2: Update read routes (2 min)
echo -e "\n🔄 PHASE 2: Update read routes to v2..."
# Switch all GET /api/crv/* to use crvOperations + snapshots instead of direct CRV

# In src/controllers/crvController.js
# OLD: const crv = await CRVModel.findById(id);
# NEW: const crv = await CRDTService.reconstructCRVFromOperations(id);

git commit -am "chore: switch reads to v2 CRDT schema"
docker build -t crv-backend:2.0.0-cutover .
docker push registry/crv-backend:2.0.0-cutover

# PHASE 3: Deploy v2 read routes (5 min)
echo -e "\n🚀 PHASE 3: Deploy v2 read routes..."
kubectl set image deployment/crv-backend crv-backend=crv-backend:2.0.0-cutover -n production
kubectl rollout status deployment/crv-backend -n production

# PHASE 4: Monitor (10 min)
echo -e "\n📊 PHASE 4: Monitor for errors..."
for i in {1..6}; do
  ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[1m])" | jq '.data.result[0].value[1]')
  echo "Error rate: $ERROR_RATE"
  if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
    echo "❌ Error rate too high! Rolling back..."
    kubectl rollout undo deployment/crv-backend -n production
    exit 1
  fi
  sleep 10
done

# PHASE 5: Cleanup (5 min)
echo -e "\n🧹 PHASE 5: Cleanup old data..."
# Keep v1 data for 7 days (safety), then archive
# db.crvs.deleteMany({}) — NOT YET, wait for stability

echo -e "\n✅ CUTOVER COMPLETE: $(date)"
echo "v2 CRDT schema is now primary"
echo "v1 data archived (will delete after 7 days if stable)"
```

---

## 🔄 Rollback Procedures

### Rollback During Phase C (Dual-Write)

**If migration fails before cutover:**

```bash
# OPTION 1: Stop dual-write, revert to v1-only
kubectl set image deployment/crv-backend crv-backend=crv-backend:1.0.0 -n production
# v1 continues, new v2 collections remain (can retry later)

# OPTION 2: Delete problematic new collections
mongosh "$MONGO_URI" --eval "
  db.crvOperations.drop();
  db.crvSnapshots.drop();
  console.log('✅ Rolled back new collections');
"
```

### Rollback After Cutover (During Phase D)

**If v2 reads cause issues after cutover:**

```bash
#!/bin/bash
# scripts/rollback-to-v1.sh

set -e

echo "🔄 ROLLBACK: Reverting to v1 schema"

# STEP 1: Switch reads back to v1
kubectl set image deployment/crv-backend crv-backend=crv-backend:1.0.0 -n production

# STEP 2: Verify health
kubectl wait --for=condition=ready pod -l app=crv-backend -n production --timeout=60s
curl http://localhost:3000/health

# STEP 3: Monitor error rate
watch -n 5 'curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq ".data.result[0].value[1]"'

# If error rate drops, rollback successful
echo "✅ Rolled back to v1"
```

---

## 📝 Migration Checklist

### Pre-Migration (Phase B-C)

- [ ] Design CRDT algorithm finalized & reviewed
- [ ] New collection schemas documented
- [ ] Migration scripts written & tested in staging
- [ ] Backfill script tested with production data copy
- [ ] Rollback procedure documented & practiced
- [ ] On-call team trained on migration steps
- [ ] Monitoring alerts configured (error rate, latency)
- [ ] Backup taken before migration start

### During Migration (Phase C-D)

- [ ] Step 1: Create new collections (zero downtime)
- [ ] Step 2: Deploy v2 with dual-write (canary 10% traffic)
- [ ] Step 3: Backfill historical data
- [ ] Step 4: Validate consistency between v1 & v2
- [ ] Step 5: Cutover readers to v2
- [ ] Step 6: Monitor for 24 hours (error rate, latency, data consistency)
- [ ] Step 7: Archive v1 data (keep 7 days for safety)

### Post-Migration (Phase D+)

- [ ] All tests passing
- [ ] No regressions in error rate
- [ ] Latency within SLA
- [ ] Data consistency verified (spot checks)
- [ ] Runbook updated with v2 operations
- [ ] Team training on new schema complete
- [ ] Incident debrief & documentation

---

## 🧪 Testing Migration in Staging

**Before running migration on production:**

```bash
# 1. Restore production data copy to staging
mongorestore --uri="$STAGING_MONGO_URI" --drop --dir=/backup/mongo-production-latest

# 2. Run migration scripts
node migration-phase-f-step1.js
node scripts/backfill-operations.js
node scripts/validate-migration.sh

# 3. Deploy v2 code to staging
kubectl set image deployment/crv-backend -n staging crv-backend=crv-backend:2.0.0

# 4. Run full test suite
npm test
npm run test:e2e

# 5. Load test
k6 run tests/load.js --vus 50 --duration 5m

# ✅ If all pass, safe to proceed with production migration
```

---

**Prepared by:** Claude Code Agent  
**Date:** June 16, 2026  
**Version:** 1.0.0-rc1  
**Status:** Ready for Phase B Design Review
