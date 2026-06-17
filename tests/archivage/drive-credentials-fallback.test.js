/**
 * TEST — Fallback credentials Google Drive via variables d'environnement
 *
 * Vérifie que DocumentArchiver s'authentifie avec GOOGLE_CLIENT_EMAIL
 * + GOOGLE_PRIVATE_KEY quand le fichier JSON est absent (déploiement Render).
 *
 * Aucun appel réseau. Aucune base de données.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ============================================================================
// ENV VARS — simule Render (pas de fichier JSON, credentials via env)
// ============================================================================
vi.stubEnv('GOOGLE_DRIVE_CREDENTIALS_PATH', '/tmp/not-existing-render-credentials.json');
vi.stubEnv('GOOGLE_DRIVE_FOLDER_ID', 'RENDER_FOLDER_ID_TEST');
vi.stubEnv('GOOGLE_CLIENT_EMAIL', 'svc-account@project.iam.gserviceaccount.com');
vi.stubEnv('GOOGLE_PRIVATE_KEY', '-----BEGIN RSA PRIVATE KEY-----\\nDATA\\n-----END RSA PRIVATE KEY-----');

// ============================================================================
// MOCKS
// ============================================================================

const mockGoogleAuth = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: mockGoogleAuth },
    drive: vi.fn(() => ({ files: { create: vi.fn(), list: vi.fn() } })),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(() => false), // Fichier absent — simule Render
  };
});

vi.mock('../../../src/models/security/UserActivityLog.js', () => ({
  default: { create: vi.fn() },
}));

// ============================================================================
// CAPTURE DES APPELS — avant que clearAllMocks les efface
// ============================================================================

let capturedAuthCall = null;

beforeAll(async () => {
  await import('../../../src/services/documents/base/DocumentArchiver.js');
  // Capturer immédiatement — clearAllMocks() dans le setup efface les calls après
  capturedAuthCall = mockGoogleAuth.mock.calls[0]?.[0] ?? null;
});

// ============================================================================
// TESTS
// ============================================================================

describe('DocumentArchiver — fallback credentials env vars (mode Render)', () => {
  it('GoogleAuth est appelé quand fichier absent et env vars définies', () => {
    expect(capturedAuthCall).not.toBeNull();
  });

  it('utilise credentials objet (pas keyFile) quand fichier absent', () => {
    expect(capturedAuthCall).toBeDefined();
    expect(capturedAuthCall.credentials).toBeDefined();
    expect(capturedAuthCall.keyFile).toBeUndefined();
  });

  it('client_email correspond à GOOGLE_CLIENT_EMAIL', () => {
    expect(capturedAuthCall.credentials.client_email).toBe('svc-account@project.iam.gserviceaccount.com');
  });

  it('scope Drive est configuré', () => {
    expect(capturedAuthCall.scopes).toContain('https://www.googleapis.com/auth/drive');
  });
});
