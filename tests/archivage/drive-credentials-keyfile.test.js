/**
 * TEST — Mode local : credentials via fichier JSON (développement)
 *
 * Aucun appel réseau. Aucune base de données.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: vi.fn() },
    drive: vi.fn(() => ({ files: { create: vi.fn(), list: vi.fn() } })),
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(() => true), // Fichier présent — simule dev local
  };
});

vi.mock('../../../src/config/env.js', () => ({
  config: {
    googleDriveCredentialsPath: '/path/to/credentials.json',
    googleDriveFolderId: 'FOLDER_ID_TEST',
    googleClientEmail: '',
    googlePrivateKey: '',
  },
}));

vi.mock('../../../src/config/documents.config.js', () => ({
  DOCUMENT_TYPES: { CRV: 'CRV' },
  getDocumentConfig: vi.fn(),
  generateFilename: vi.fn(() => 'CRV-TEST-001.pdf'),
  generateFolderPath: vi.fn(() => 'CRV/2026/06'),
}));

vi.mock('../../../src/models/security/UserActivityLog.js', () => ({
  default: { create: vi.fn() },
}));

describe('DocumentArchiver — keyFile mode (développement local)', () => {
  it('utilise keyFile quand le fichier credentials existe', async () => {
    const { google } = await import('googleapis');
    await import('../../../src/services/documents/base/DocumentArchiver.js');

    expect(google.auth.GoogleAuth).toHaveBeenCalled();

    const callArgs = google.auth.GoogleAuth.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs.keyFile).toBeDefined();
    expect(callArgs.credentials).toBeUndefined();
  });
});
