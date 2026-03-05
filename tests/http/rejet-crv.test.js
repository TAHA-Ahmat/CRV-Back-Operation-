// ============================================
// MISSION 015 — TESTS ENDPOINT REJET CRV
// ============================================
// POST /api/validation/:id/rejeter
// Transition : TERMINE → EN_COURS (avec raison obligatoire)
// Accès : SUPERVISEUR, MANAGER uniquement

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mocks hoistés + ENV setup ─
const {
  TEST_JWT_SECRET,
  mockFindByIdPersonne,
  mockFindByIdCRV,
  mockHistoriqueCreate,
  mockUserActivityLogWrite,
  mockPersonneFindByIdLean,
} = vi.hoisted(() => {
  const secret = 'test-secret-mission-015';
  process.env.JWT_SECRET = secret;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';

  return {
    TEST_JWT_SECRET: secret,
    mockFindByIdPersonne: vi.fn(),
    mockFindByIdCRV: vi.fn(),
    mockHistoriqueCreate: vi.fn(),
    mockUserActivityLogWrite: vi.fn(),
    mockPersonneFindByIdLean: vi.fn(),
  };
});

// ── Mock Personne (auth middleware) ────────────────────
vi.mock('../../src/models/security/Personne.js', () => {
  const findByIdFn = vi.fn().mockImplementation((id, projection) => {
    if (projection) {
      return { lean: () => mockPersonneFindByIdLean() };
    }
    return {
      select: vi.fn().mockImplementation(() => {
        const result = mockFindByIdPersonne();
        return {
          then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
          catch: (reject) => Promise.resolve(result).catch(reject),
        };
      }),
    };
  });
  return { default: { findById: findByIdFn } };
});

// ── Mock services archivage ────────────────────────────
vi.mock('../../src/services/documents/crv/crvArchivage.service.js', () => ({
  default: {
    getArchiveServiceStatus: vi.fn(),
    archiverCRV: vi.fn(),
    canArchiveCRVById: vi.fn(),
    getArchivageInfo: vi.fn(),
    getPreviewData: vi.fn(),
    genererPdfBuffer: vi.fn(),
    genererPdfStream: vi.fn(),
  },
  getArchiveServiceStatus: vi.fn(),
  archiverCRV: vi.fn(),
  isCRVImmutable: vi.fn(),
  canArchiveCRV: vi.fn(),
  canArchiveCRVById: vi.fn(),
  getArchivageInfo: vi.fn(),
  getPreviewData: vi.fn(),
  genererPdfBuffer: vi.fn(),
  genererPdfStream: vi.fn(),
}));

// ── Mock service validation ───────────────────────────
vi.mock('../../src/services/validation/validation.service.js', () => ({
  validerCRV: vi.fn(),
  verrouillerCRV: vi.fn(),
  deverrouillerCRV: vi.fn(),
}));

// ── Mock ValidationCRV model ──────────────────────────
vi.mock('../../src/models/validation/ValidationCRV.js', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      then: (resolve) => resolve(null),
    }),
    findOne: vi.fn().mockReturnValue({ populate: vi.fn().mockReturnThis() }),
    create: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    findOneAndUpdate: vi.fn(),
  }
}));

// ── Mock CRV model ────────────────────────────────────
vi.mock('../../src/models/crv/CRV.js', () => ({
  default: {
    findById: vi.fn().mockImplementation(() => {
      const result = mockFindByIdCRV();
      const chain = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve) => resolve(result),
      };
      return chain;
    }),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
  }
}));

// ── Mock notification ─────────────────────────────────
vi.mock('../../src/services/notifications/notification.service.js', () => ({
  notifierValidationCRV: vi.fn(),
}));

// ── Mock HistoriqueModification (auditLog middleware) ──
vi.mock('../../src/models/crv/HistoriqueModification.js', () => ({
  default: { create: (...args) => mockHistoriqueCreate(...args) }
}));

// ── Mock UserActivityLog (auditFinalize middleware) ────
vi.mock('../../src/models/security/UserActivityLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
    write: (...args) => mockUserActivityLogWrite(...args),
  }
}));

// ── Mock ChronologiePhase ────────────────────────────
vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: { find: vi.fn().mockResolvedValue([]) }
}));

// ── Mock crv.service ─────────────────────────────────
vi.mock('../../src/services/crv/crv.service.js', () => ({
  calculerCompletude: vi.fn().mockResolvedValue(90),
  verifierConformiteSLA: vi.fn().mockResolvedValue({ conformite: true, ecarts: [] }),
}));

// ── Mock base/DocumentArchiver ─────────────────────────
vi.mock('../../src/services/documents/base/DocumentArchiver.js', () => ({
  archiveDocument: vi.fn(),
  checkArchiveStatus: vi.fn(),
}));

// ── Mock CrvGenerator ──────────────────────────────────
vi.mock('../../src/services/documents/crv/CrvGenerator.js', () => ({
  CrvGenerator: class MockCrvGenerator {
    generateBuffer() { return Promise.resolve(Buffer.from('fake-pdf')); }
    getPreviewData() { return Promise.resolve({}); }
    generateStream() { return Promise.resolve(); }
  }
}));

// ── Mock documents.config ──────────────────────────────
vi.mock('../../src/config/documents.config.js', () => ({
  DOCUMENT_TYPES: { CRV: 'CRV', PROGRAMME_VOL: 'PROGRAMME_VOL' },
  DOCUMENTS_CONFIG: {},
  getDocumentConfig: vi.fn().mockReturnValue({
    naming: { getFilename: () => 'mock.pdf' },
    drive: { dossierRacine: 'TEST', getFolderPath: () => [] },
  }),
  generateFilename: vi.fn().mockReturnValue('mock.pdf'),
  generateFolderPath: vi.fn().mockReturnValue(['TEST']),
  default: {
    DOCUMENT_TYPES: { CRV: 'CRV', PROGRAMME_VOL: 'PROGRAMME_VOL' },
    DOCUMENTS_CONFIG: {},
    getDocumentConfig: vi.fn(),
    generateFilename: vi.fn(),
    generateFolderPath: vi.fn(),
  },
}));

// ── Import app & supertest APRÈS mocks ─────────────────
import request from 'supertest';
import app from '../../src/app.js';

// ── Helpers ────────────────────────────────────────────
const FAKE_USER_ID = '507f1f77bcf86cd799439011';
const CRV_ID = '507f1f77bcf86cd799439022';

function generateValidToken(userId = FAKE_USER_ID) {
  return jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthenticatedUser(overrides = {}) {
  const user = {
    _id: FAKE_USER_ID,
    id: FAKE_USER_ID,
    nom: 'TestUser',
    prenom: 'Mission015',
    email: 'test@crv.com',
    fonction: 'SUPERVISEUR',
    statut: 'ACTIF',
    statutCompte: 'VALIDE',
    ...overrides,
  };
  mockFindByIdPersonne.mockResolvedValue(user);
  return user;
}

function mockCRV(overrides = {}) {
  return {
    _id: CRV_ID,
    statut: 'TERMINE',
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════

describe('Mission 015 — Endpoint rejet CRV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoriqueCreate.mockResolvedValue({});
    mockUserActivityLogWrite.mockResolvedValue({});
    mockPersonneFindByIdLean.mockResolvedValue({ nom: 'Test', prenom: 'User', email: 'test@crv.com' });
  });

  // ═══════════════════════════════════════════════════
  // TEST 1 — Rejet réussi (TERMINE → EN_COURS)
  // ═══════════════════════════════════════════════════
  describe('Test 1 — Rejet CRV réussi', () => {
    it('POST /api/validation/:id/rejeter → 200 si CRV TERMINE + raison', async () => {
      mockAuthenticatedUser({ fonction: 'SUPERVISEUR' });
      const crv = mockCRV({ statut: 'TERMINE' });
      mockFindByIdCRV.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'Phases incomplètes, revoir chargement' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('rejeté');
      expect(crv.save).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 2 — Rejet sans raison → 400
  // ═══════════════════════════════════════════════════
  describe('Test 2 — Rejet sans raison', () => {
    it('POST /api/validation/:id/rejeter → 400 si raison manquante', async () => {
      mockAuthenticatedUser({ fonction: 'SUPERVISEUR' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Raison');
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 3 — Rejet d'un CRV pas TERMINE → 400
  // ═══════════════════════════════════════════════════
  describe('Test 3 — Rejet sur mauvais statut', () => {
    it('POST /api/validation/:id/rejeter → 400 si CRV EN_COURS', async () => {
      mockAuthenticatedUser({ fonction: 'SUPERVISEUR' });
      const crv = mockCRV({ statut: 'EN_COURS' });
      mockFindByIdCRV.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'Test rejet invalide' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('EN_COURS');
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 4 — Rejet CRV non trouvé → 404
  // ═══════════════════════════════════════════════════
  describe('Test 4 — CRV non trouvé', () => {
    it('POST /api/validation/:id/rejeter → 404 si CRV inexistant', async () => {
      mockAuthenticatedUser({ fonction: 'SUPERVISEUR' });
      mockFindByIdCRV.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 5 — AGENT ne peut pas rejeter → 403
  // ═══════════════════════════════════════════════════
  describe('Test 5 — AGENT interdit de rejeter', () => {
    it('POST /api/validation/:id/rejeter → 403 si AGENT_ESCALE', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'Tentative agent' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 6 — MANAGER peut rejeter → 200
  // ═══════════════════════════════════════════════════
  describe('Test 6 — MANAGER autorisé à rejeter', () => {
    it('POST /api/validation/:id/rejeter → 200 si MANAGER', async () => {
      mockAuthenticatedUser({ fonction: 'MANAGER' });
      const crv = mockCRV({ statut: 'TERMINE' });
      mockFindByIdCRV.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'Non conforme SLA' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
