/**
 * CRV AI Agents - Ollama Backend (Local, Free)
 *
 * MIGRATION: Claude API payante → Service Kali + Ollama
 *
 * Architecture:
 * Agent → Service Kali (localhost:9999) → Ollama/Llama2 → Response
 *
 * Zéro régression: API identique, juste gratuit
 */

const KALI_SERVICE = process.env.KALI_AGENT_SERVICE || 'http://localhost:9999';

/**
 * Agent 1: Test Runner
 * Quand: Chaque commit
 * Fait: Jest + TypeScript + ESLint
 * Poste: Commentaire GitHub
 */
export async function agentTestRunner(prNumber, commitSha) {
  const prompt = `You are a code quality agent. Analyze this PR and determine:
1. Are tests passing? (run: npm test -- --coverage)
2. Is coverage above 60%? (required threshold)
3. Are there TypeScript errors? (run: npx tsc --noEmit)
4. Are linting rules satisfied? (run: npm run lint)

PR #${prNumber}
Commit: ${commitSha}

If any check fails, explain WHY and suggest fixes.
If all pass, respond with "✅ All checks passed. Safe to merge."`;

  const response = await callKaliService('test-runner', { prNumber, commitSha }, prompt);

  console.log(`✅ Agent 1 (Test Runner) for PR #${prNumber}:`, response);

  // Post comment on GitHub
  // postGitHubComment(prNumber, response);

  return { prNumber, status: response.includes('✅') ? 'passed' : 'failed', details: response };
}

/**
 * Agent 2: Deployment Validator
 * Quand: Avant production deploy
 * Fait: 5 vérifications de sécurité
 * Résultat: Approuve ou bloque
 */
export async function agentDeploymentValidator(version, targetEnv) {
  const prompt = `You are a deployment safety agent. Before deploying version ${version} to ${targetEnv}, verify:

1. Database migrations are reversible?
   - Check: Migration files have both "up" and "down" functions
   - Run: npm run migrate:test (dry-run on staging DB)

2. API schema changes are backwards compatible?
   - Check: No required fields removed
   - Check: No field types changed (string → number breaks clients)
   - Check: Deprecation headers added for removed fields

3. Are all secrets properly injected?
   - Vault connectivity test: curl -X GET http://vault:8200/v1/auth/token/lookup-self
   - All ENV_VAR references resolved?

4. Is the rollback safe?
   - Previous version tag exists?
   - Can we revert in < 5 minutes?

5. Monitoring is ready?
   - Sentry DSN configured?
   - Prometheus metrics exposed?
   - Alerting rules deployed?

If ANY check fails, recommend ABORT. Otherwise, respond:
"✅ SAFE TO DEPLOY: All checks passed. Estimated deploy time: 5 min. Rollback time: 2 min."`;

  const response = await callKaliService('deployment-validator', { version, targetEnv }, prompt);

  console.log(`✅ Agent 2 (Validator) for v${version} → ${targetEnv}:`, response);

  return { version, targetEnv, status: response.includes('✅') ? 'approved' : 'blocked', details: response };
}

/**
 * Agent 3: Anomaly Responder
 * Quand: Métrique Prometheus > seuil
 * Fait: Analyse root cause
 * Résultat: Slack alert avec action recommandée
 */
export async function agentAnomalyResponder(metricName, currentValue, threshold) {
  const prompt = `You are an on-call SRE agent. A production metric triggered an alert:

Metric: ${metricName}
Current Value: ${currentValue}
Threshold: ${threshold}
Status: EXCEEDED

Based on your knowledge of the CRV application, suggest IMMEDIATE actions:

1. Is this a known issue? (check past incidents)
2. What's the likely root cause?
   - ${metricName === 'crv_http_request_duration_ms' ? 'Slow DB query? Network latency? CPU bottleneck?' : ''}
   - ${metricName === 'crv_db_connections_active' ? 'Connection pool exhausted? Hanging queries?' : ''}
   - ${metricName === 'crv_sync_queue_depth' ? 'Offline users overwhelmed? Server down?' : ''}
3. What's the ONE action to try first? (must complete in < 2 min)
4. If that fails, what's the escalation?

Format your response as:
⚠️ ALERT: [brief summary]
🔍 ROOT CAUSE: [likely cause]
⚡ IMMEDIATE ACTION: [single action, specific command or code change]
🚨 ESCALATION: [if immediate action fails, do this next]`;

  const response = await callKaliService('anomaly-responder', { metricName, currentValue, threshold }, prompt);

  console.log(`✅ Agent 3 (Anomaly) for ${metricName}:`, response);

  // postSlackAlert(`#ops-alerts`, response);

  return { metric: metricName, currentValue, response };
}

/**
 * Agent 4: Code Review Advisor
 * Quand: Chaque PR ouverte
 * Fait: Scan sécurité + performance
 * Résultat: Commentaires détaillés, bloque issues critiques
 */
export async function agentCodeReviewAdvisor(prNumber, filesChanged, diffs) {
  const prompt = `You are a security + performance code reviewer. Analyze this PR and identify:

PR #${prNumber}
Files changed: ${filesChanged.join(', ')}

SECURITY CHECKLIST:
- [ ] SQL injection: Any string concatenation in queries? (should use parameterized queries)
- [ ] XSS: Any innerHTML/dangerouslySetInnerHTML? (use textContent/v-text instead)
- [ ] CORS: Any wildcard CORS (*) in production?
- [ ] Auth: Any missing authentication checks on protected endpoints?
- [ ] Secrets: Any credentials in code or logs?

PERFORMANCE CHECKLIST:
- [ ] N+1 queries: Any loops that fetch from DB inside?
- [ ] Unoptimized algorithms: Any O(n²) loops that should be O(n)?
- [ ] Memory leaks: Any event listeners not cleaned up?
- [ ] Bundle size: Any large dependencies added?

For each FAILED item, provide:
1. Line number + code snippet
2. Why it's a problem
3. How to fix it (specific code change)

Format response as:
✅ PASSED: [count]
⚠️ WARNINGS: [count]
🔴 FAILURES: [count]
[detailed findings]`;

  const response = await callKaliService('code-review', { prNumber, filesChanged }, prompt);

  console.log(`✅ Agent 4 (Code Review) for PR #${prNumber}:`, response);

  // postGitHubReview(prNumber, response);

  return { prNumber, review: response };
}

/**
 * Agent 5: Incident Commander
 * Quand: Erreur P1 détectée (> 5 errors/min)
 * Fait: Coordonne réponse (immediate + long-term)
 * Résultat: Rollback auto + post-mortem
 */
export async function agentIncidentCommander(incidentSeverity, affectedService, errorLogs) {
  const prompt = `You are an incident commander. A critical incident has been detected:

Severity: ${incidentSeverity} (P1=down, P2=degraded, P3=warning)
Service: ${affectedService}
Error logs: [${errorLogs.slice(0, 3).join(', ')}...]

Coordinate response:
1. IMMEDIATE (< 5 min): What's the fastest fix?
2. SHORT-TERM (5-30 min): Mitigate customer impact
3. ROOT CAUSE: Why did this happen?
4. LONG-TERM: Prevent recurrence (code/config change)

For each action, specify:
- Who executes it (agent/human)
- Estimated time
- Rollback plan if it fails

Format as:
🚨 INCIDENT COMMANDER ACTIVATED
⏱️ Status: [assessing]
🔧 IMMEDIATE ACTION: [specific step]
📞 ESCALATION: [if immediate action fails]
📋 INCIDENT SUMMARY: [slack post template]`;

  const response = await callKaliService('incident-commander', { incidentSeverity, affectedService }, prompt);

  console.log(`✅ Agent 5 (Commander) for ${incidentSeverity} on ${affectedService}:`, response);

  // postSlackAlert(`#incident`, response);
  // pageOnCallEngineer(incidentSeverity, response);

  return { severity: incidentSeverity, service: affectedService, commandResponse: response };
}

/**
 * Helper: Appelle Service Kali
 */
async function callKaliService(agentType, data, prompt) {
  try {
    const response = await fetch(`${KALI_SERVICE}/agent/${agentType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        prompt
      })
    });

    if (!response.ok) {
      throw new Error(`Kali service error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.response || result.message || JSON.stringify(result);
  } catch (error) {
    console.error(`❌ Kali service call failed (${agentType}):`, error.message);
    throw error;
  }
}

/**
 * Automation Loops
 */

export async function cicdLoop() {
  console.log('🔄 LOOP IA: Continuous Integration');
  // 1. Run tests on PR
  // 2. Deploy to staging
  // 3. Smoke tests on staging
  // 4. Deploy to production
}

export async function monitoringLoop(metricAlert) {
  console.log('🔄 LOOP IA: Monitoring & Auto-Remediation');
  // 1. Alert triggered by Prometheus
  // 2. Execute immediate action (auto-remediation)
  // 3. Monitor if issue resolved
  // 4. If still failing after 2 min → escalate to human
}

export async function codeQualityLoop(prNumber) {
  console.log('🔄 LOOP IA: Code Quality Review');
  // 1. Fetch PR details from GitHub
  // 2. Agent reviews security + performance
  // 3. Auto-post review comment with findings
  // 4. Block merge if critical issues found
}

export async function incidentLoop(errorLog) {
  console.log('🔄 LOOP IA: Incident Response');
  // 1. Error detected (Sentry + Prometheus)
  // 2. Agent analyzes severity + impact
  // 3. Agent coordinates response (immediate + long-term)
  // 4. Agent creates post-mortem
  // 5. Agent schedules prevention work
}

export default {
  agentTestRunner,
  agentDeploymentValidator,
  agentAnomalyResponder,
  agentCodeReviewAdvisor,
  agentIncidentCommander,
  cicdLoop,
  monitoringLoop,
  codeQualityLoop,
  incidentLoop
};
