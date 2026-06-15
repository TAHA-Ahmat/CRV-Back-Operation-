// HashiCorp Vault secrets management + auto-rotation
// 📦 Source: https://github.com/hashicorp/vault-client-js
// 🔄 BEFORE: Secrets in .env files (static, unencrypted, risk of accidental commits, manual rotation)
// 🔄 AFTER: All secrets centralized in Vault with auto-rotation, audit logging, revocation, permission control

import VaultClient from '@hashicorp/vault-client';
import crypto from 'crypto';

// 🟢 VAULT CLIENT
const vault = new VaultClient({
  endpoint: process.env.VAULT_ADDR || 'http://vault:8200',
  token: process.env.VAULT_TOKEN, // fetched from Kubernetes ServiceAccount in prod
  apiVersion: 'v1'
});

// 📂 SECRET PATHS (organized by environment + resource type)
const SECRET_PATHS = {
  db: 'secret/data/crv/database',
  redis: 'secret/data/crv/redis',
  jwt: 'secret/data/crv/jwt',
  sentry: 'secret/data/crv/sentry',
  mail: 'secret/data/crv/mail',
  external_apis: 'secret/data/crv/external-apis'
};

// 🔐 CACHE WITH TTL (reduces Vault calls)
const secretCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

// 🎯 GET SECRET (with caching)
async function getSecret(category, key) {
  const cacheKey = `${category}:${key}`;
  const cached = secretCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const path = SECRET_PATHS[category];
    const response = await vault.secrets.kv2Read(path);
    const value = response.data.data[key];

    secretCache.set(cacheKey, { value, timestamp: Date.now() });
    return value;
  } catch (error) {
    console.error(`Failed to fetch secret ${cacheKey}:`, error.message);
    throw new Error(`Secret retrieval failed: ${cacheKey}`);
  }
}

// 📝 USAGE: Load configuration on startup

export async function loadSecrets() {
  return {
    // Database credentials (rotated daily by Vault policy)
    database: {
      host: await getSecret('db', 'host'),
      port: parseInt(await getSecret('db', 'port')),
      username: await getSecret('db', 'username'),
      password: await getSecret('db', 'password'),
      database: 'crv_production'
    },

    // Redis (rotated weekly)
    redis: {
      host: await getSecret('redis', 'host'),
      port: parseInt(await getSecret('redis', 'port')),
      password: await getSecret('redis', 'password'),
      db: 0
    },

    // JWT signing key (rotated monthly, immutable after deployment)
    jwt: {
      secret: await getSecret('jwt', 'signing_key'),
      algorithm: 'HS256',
      expiresIn: '24h'
    },

    // Sentry DSN (rotated on security incident)
    sentry: {
      dsn: await getSecret('sentry', 'dsn')
    },

    // Mail server credentials (rotated quarterly)
    mail: {
      host: await getSecret('mail', 'smtp_host'),
      port: parseInt(await getSecret('mail', 'smtp_port')),
      username: await getSecret('mail', 'username'),
      password: await getSecret('mail', 'password'),
      from: 'crv-app@example.com'
    },

    // External API keys (rotated on breach/expiration)
    externalApis: {
      guce_api_key: await getSecret('external_apis', 'guce_api_key'),
      rtc_api_key: await getSecret('external_apis', 'rtc_api_key')
    }
  };
}

// 🔄 DYNAMIC DATABASE CREDENTIALS (PostgreSQL role-based)
// Vault generates temporary credentials with short TTL (1h)
export async function getDynamicDatabaseCreds() {
  try {
    const response = await vault.database.generateCredentials('crv-app-role');
    return {
      username: response.data.username,
      password: response.data.password,
      ttl: response.lease_duration // seconds until revocation
    };
  } catch (error) {
    console.error('Failed to generate dynamic DB credentials:', error.message);
    throw error;
  }
}

// 🔑 ENCRYPTION KEYS (Vault Transit engine)
// Encrypts sensitive data in the database without storing keys there
export async function encryptData(plaintext, category = 'default') {
  try {
    const response = await vault.transit.encryptData(`crv-${category}`, {
      plaintext: Buffer.from(plaintext).toString('base64')
    });
    return response.data.ciphertext; // store this in DB instead of plaintext
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw error;
  }
}

export async function decryptData(ciphertext, category = 'default') {
  try {
    const response = await vault.transit.decryptData(`crv-${category}`, { ciphertext });
    return Buffer.from(response.data.plaintext, 'base64').toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw error;
  }
}

// 📋 AUDIT TRAIL (Vault logs all reads/writes)
// Example audit log entry (Vault UI shows this):
// {
//   "time": "2026-06-14T10:30:45Z",
//   "type": "request",
//   "auth": {
//     "client_token": "hvs.abc123...",
//     "entity_id": "crv-app-sa",
//     "policies": ["crv-app"]
//   },
//   "request": {
//     "operation": "READ",
//     "path": "secret/data/crv/database",
//     "remote_address": "10.0.0.2"
//   },
//   "response": {
//     "auth": null,
//     "data": "***REDACTED***"
//   }
// }

// 🔄 ROTATION SCHEDULE (managed by Vault policies)
// Database: rotate every 24h (new PostgreSQL user created, old one revoked)
// Redis: rotate every 7 days
// JWT secret: rotate monthly with rolling window (new + old accepted 24h)
// API keys: rotate on breach or quarterly
// Dynamic DB creds: auto-revoked after 1h of inactivity

// 🎯 SUCCESS METRICS (how to validate):
// 1. Load secrets at startup: node -e "loadSecrets().then(c => console.log(c.database.host))" → prints host
// 2. Encrypt/decrypt roundtrip: encryptData('hello') → ciphertext → decryptData(ciphertext) → 'hello'
// 3. Check Vault audit log: vault audit list → shows HTTP audit sink
// 4. Verify no .env in commits: git log -p | grep -i password → should return nothing
// 5. Test rotation: vault write -f secret/rotate/database → check if DB creds change
// 6. Verify TTL: getDynamicDatabaseCreds() → check lease_duration < 3600 (1h)

// 🔐 KUBERNETES INTEGRATION (when deployed)
// ServiceAccount token (/var/run/secrets/kubernetes.io/serviceaccount/token) authenticates to Vault
// Vault role "crv-app-sa" has policies: read(secret/data/crv/*), write(transit/encrypt/crv-*)
// Pod startup: Vault agent fetches token → stores in /vault/secrets/database.json → app reads

// 🔄 LOOP IA AUTOMATION:
// 1. Agent secret-rotator runs daily:
//    - Generates new database password via PostgreSQL secret engine
//    - Updates all running replicas (rolling restart)
//    - Verifies new password works before revoking old one
//    - Logs rotation timestamp to audit trail
// 2. Agent breach-detector monitors Vault audit logs:
//    - If secret accessed from unfamiliar IP → triggers revocation
//    - If password-reset fails 3x → escalates to Slack
//    - If TTL approaching expiration → auto-refreshes
// 3. Agent compliance-checker weekly:
//    - Verifies all secrets have rotation policy
//    - Checks for unused credentials (not accessed in 30 days)
//    - Reports to security team via email
// 4. Secrets never appear in logs (redacted via Pino config)
// 5. Encryption keys rotated independently (Transit engine versioning)

export default {
  loadSecrets,
  getDynamicDatabaseCreds,
  encryptData,
  decryptData,
  getSecret
};
