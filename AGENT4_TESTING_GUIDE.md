# Agent 4: Daily Reporter — Testing Guide

## ✅ What was implemented

**Agent 4: Daily Reporter** — Automates daily CRV reports at 21:00 NDJ

**Implementation:**
- ✅ `src/agents/dailyReporter.agent.js` — Main agent logic
- ✅ `src/jobs/dailyReportScheduler.js` — Cron scheduler (triggers at 21:00 NDJ daily)
- ✅ `src/routes/agents/agentRoutes.js` — API endpoints for manual testing
- ✅ Integrated in `src/server.js` — Auto-initializes on startup
- ✅ Integrated in `src/app.js` — Routes registered

**Features:**
1. Fetches all CRVs from current day
2. Calculates statistics by status (BROUILLON, EN_COURS, TERMINE, VALIDE, VERROUILLE, ANNULE)
3. Calculates statistics by type (ARRIVEE, DEPART, TURN_AROUND, COMMUN)
4. Generates HTML report with styled formatting
5. Sends report via email to:
   - Primary: `madmit@madmit.com`
   - Secondary: `Tahaa@madmit.fr`
6. (TODO) Uploads to Google Drive
7. Logs all activity to console + logger

---

## 🧪 HOW TO TEST

### Prerequisites
```bash
# Navigate to project
cd /home/kali/CRV_git/Back

# Install dependencies (if not done)
npm install

# Start MongoDB (required)
# If running locally: mongod --dbpath /data/db

# Seed sample data (optional)
npm run seed:admin
npm run seed:phases
```

### Test 1: Manual Trigger (Immediate)

**Trigger the report for today RIGHT NOW:**

```bash
curl -X POST http://localhost:3000/api/agents/daily-report \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**For a specific date:**
```bash
curl -X POST http://localhost:3000/api/agents/daily-report \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-12"}'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Rapport quotidien déclenché avec succès",
  "timestamp": "2026-06-14T18:30:45.123Z",
  "reportDate": "2026-06-14T00:00:00.000Z",
  "stats": {
    "total": 42,
    "byStatus": {
      "BROUILLON": 5,
      "EN_COURS": 8,
      "TERMINE": 15,
      "VALIDE": 10,
      "VERROUILLE": 3,
      "ANNULE": 1
    },
    "byType": {
      "ARRIVEE": 15,
      "DEPART": 18,
      "TURN_AROUND": 8,
      "COMMUN": 1
    },
    "avgCompletude": "78.5",
    "locked": 3
  },
  "emailSent": true,
  "driveUploaded": false
}
```

### Test 2: Check Agent Status

```bash
curl http://localhost:3000/api/agents/status \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "agents": {
    "dailyReporter": {
      "status": "initialized",
      "schedule": "21:00 NDJ (12:00 UTC)",
      "description": "Rapport quotidien automatique",
      "contact": "madmit@madmit.com"
    },
    "phaseValidator": {
      "status": "planned",
      "description": "Validateur cohérence phases (TODO)"
    },
    ...
  }
}
```

### Test 3: Automatic Trigger (Schedule)

**Start the server:**
```bash
npm run dev
```

**Monitor logs:**
```bash
# Watch for scheduler output (21:00 NDJ every day)
tail -f /tmp/crv-backend.log | grep "Agent 4"
```

**Expected output at 21:00 NDJ:**
```
⏰ [Scheduler] Prochain rapport: samedi 14 juin 2026 21:00:00 (dans 234 min)
📋 [Scheduler] Déclenchement rapport quotidien...
✅ [Agent 4] Données récupérées: total=42, avgCompletude=78.5
✅ [Agent 4] Email envoyé: messageId=xxx, to=madmit@madmit.com, Tahaa@madmit.fr
✅ [Agent 4] Rapport quotidien complété
```

---

## 📧 Email Configuration

### Option A: Using Local Sendmail (Default)

No configuration needed! Uses system sendmail on localhost:25

```javascript
// src/agents/dailyReporter.agent.js
const emailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 25,
  secure: false,
});
```

### Option B: Using SMTP (Gmail, SendGrid, etc.)

Set environment variables:

```bash
# .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

REPORT_EMAIL_FROM=rapports-crv@aeroport-ndjamena.td
REPORT_EMAIL_PRIMARY=madmit@madmit.com
REPORT_EMAIL_SECONDARY=Tahaa@madmit.fr
```

---

## 🔍 Troubleshooting

### Issue: Email not sent
**Check:**
```bash
# Verify sendmail is running
ps aux | grep sendmail

# Check logs
npm run dev 2>&1 | grep "Agent 4"

# Test sendmail manually
echo "Test" | mail -s "Test Subject" madmit@madmit.com
```

### Issue: Scheduler not triggering at 21:00
**Check:**
1. Server timezone: `date`
2. NDJ timezone offset: UTC+1
3. Logs show "Prochain rapport: ..." on startup

### Issue: Email format wrong
**Verify HTML:**
```bash
# Get email content
curl -X POST http://localhost:3000/api/agents/daily-report \
  -H "Authorization: Bearer <TOKEN>" | jq
```

---

## 📊 Monitoring

### Logs Location
- Console: `npm run dev`
- File: (configure in `src/config/logger.js`)

### Metrics to Track
- ✅ Emails sent successfully
- ✅ CRVs analyzed daily
- ✅ Completude average
- ✅ Status distribution

### Sample Dashboard Query
```javascript
// Get last 7 days of reports
const reports = await Report.find({
  createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
}).sort({ createdAt: -1 });

reports.forEach(r => {
  console.log(`${r.date}: ${r.stats.total} CRVs, ${r.stats.avgCompletude}% complete`);
});
```

---

## 🚀 Deployment (Production)

### 1. Test in Staging First
```bash
# Trigger manually
curl -X POST https://staging-api.example.com/api/agents/daily-report \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-14"}'

# Check logs
tail -f /var/log/crv-backend.log | grep "Agent 4"

# Verify email received
# Check madmit@madmit.com inbox
```

### 2. Deploy to Production
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Start server (with PM2, Docker, etc.)
pm2 start src/server.js --name "crv-backend"

# Verify scheduler running
pm2 logs crv-backend | grep "Agent 4"
```

### 3. Monitor Daily
- ✅ Email arrives at 21:00 NDJ
- ✅ Report contains accurate stats
- ✅ No errors in logs

---

## 📋 Next Steps (Phase 3+)

### Agent 3: SLA Anomaly Detector
- Analyzes delays (phase > SLA)
- Identifies root causes
- Sends alerts to supervisor

### Agent 2: Horaire Suggester
- ML-based timestamp prediction
- Reduces data entry errors

### Agent 1: Phase Coherence Validator
- Real-time prerequisite validation
- Prevents out-of-order phases

---

## 📝 Notes

- **Timezone:** NDJ = UTC+1 (Africa/Ndjamena)
- **Schedule:** 21:00 NDJ = 12:00 UTC
- **Recipients:** Always 2 (primary + secondary)
- **Attachment:** HTML report included in email
- **Error Handling:** Admin notified if report fails

---

Generated: 2026-06-14
Agent 4 Status: **✅ PRODUCTION-READY (Spike v1.0)**
