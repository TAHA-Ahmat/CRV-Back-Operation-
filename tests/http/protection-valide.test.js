// ============================================
// MISSION 019 — TESTS PROTECTION STATUT VALIDE
// ============================================
// Vérifie que les CRV au statut VALIDE sont non modifiables
// via le middleware businessRules (verifierCRVNonVerrouille)
// Bug P0 : VALIDE n'était pas protégé, seul VERROUILLE l'était

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mocks hoistés + ENV setup ─
const {
  TEST_JWT_SECRET,
  mockFindByIdPersonne,
  mockCRVFindById,
  mockCRVFind,
  mockHistoriqueCreate,
  mockUserActivityLogWrite,
  mockPersonneFindByIdLean,
} = vi.hoisted(() => {
  const secret = 'test-secret-mission-019';
  process.env.JWT_SECRET = secret;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';

  return {
    TEST_JWT_SECRET: secret,
    mockFindByIdPersonne: vi.fn(),
    mockCRVFindById: vi.fn(),
    mockCRVFind: vi.fn(),
    mockHistoriqueCreate: vi.fn(),
    mockUserActivityLogWrite: vi.fn(),
    mockPersonneFindByIdLean: vi.fn(),
  };
});

// ── Mock Personne ────────────────────────────
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

// ── Mock CRV ─────────────────────────────────
vi.mock('../../src/models/crv/CRV.js', () => ({
  default: {
    findById: vi.fn().mockImplementation(() => {
      const result = mockCRVFindById();
      return {
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        then: (resolve) => resolve(result),
      };
    }),
    find: vi.fn().mockImplementation(() => {
      const result = mockCRVFind();
      return {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        then: (resolve) => resolve(result),
      };
    }),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(0),
    findOne: vi.fn().mockResolvedValue(null),
  }
}));

// ── Mock Vol ─────────────────────────────────
vi.mock('../../src/models/flights/Vol.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(null),
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue([]),
  }
}));

// ── Mock services archivage ──────────────────
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
  isCRVImmutable: vi.fn().mockReturnValue(false),
  canArchiveCRV: vi.fn(),
  canArchiveCRVById: vi.fn(),
  getArchivageInfo: vi.fn(),
  getPreviewData: vi.fn(),
  genererPdfBuffer: vi.fn(),
  genererPdfStream: vi.fn(),
}));

// ── Mock service validation ──────────────────
vi.mock('../../src/services/validation/validation.service.js', () => ({
  validerCRV: vi.fn(),
  verrouillerCRV: vi.fn(),
  deverrouillerCRV: vi.fn(),
}));

// ── Mock ValidationCRV ───────────────────────
vi.mock('../../src/models/validation/ValidationCRV.js', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      then: (resolve) => resolve(null),
    }),
    findOne: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      then: (resolve) => resolve(null),
    }),
    create: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    findOneAndUpdate: vi.fn(),
  }
}));

// ── Mock notification ────────────────────────
vi.mock('../../src/services/notifications/notification.service.js', () => ({
  notifierValidationCRV: vi.fn(),
}));

// ── Mock HistoriqueModification ──────────────
vi.mock('../../src/models/crv/HistoriqueModification.js', () => ({
  default: { create: (...args) => mockHistoriqueCreate(...args) }
}));

// ── Mock UserActivityLog ─────────────────────
vi.mock('../../src/models/security/UserActivityLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
    write: (...args) => mockUserActivityLogWrite(...args),
  }
}));

// ── Mock ChronologiePhase ────────────────────
vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: { find: vi.fn().mockResolvedValue([]), create: vi.fn(), deleteMany: vi.fn() }
}));

// ── Mock Phase ───────────────────────────────
vi.mock('../../src/models/phases/Phase.js', () => ({
  default: { find: vi.fn().mockResolvedValue([]) }
}));

// ── Mock crv.service ─────────────────────────
vi.mock('../../src/services/crv/crv.service.js', () => ({
  calculerCompletude: vi.fn().mockResolvedValue(90),
  verifierConformiteSLA: vi.fn().mockResolvedValue({ conformite: true, ecarts: [] }),
}));

// ── Mock base/DocumentArchiver ───────────────
vi.mock('../../src/services/documents/base/DocumentArchiver.js', () => ({
  archiveDocument: vi.fn(),
  checkArchiveStatus: vi.fn(),
}));

// ── Mock CrvGenerator ────────────────────────
vi.mock('../../src/services/documents/crv/CrvGenerator.js', () => ({
  CrvGenerator: class MockCrvGenerator {
    generateBuffer() { return Promise.resolve(Buffer.from('fake-pdf')); }
    getPreviewData() { return Promise.resolve({}); }
    generateStream() { return Promise.resolve(); }
  }
}));

// ── Mock documents.config ────────────────────
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

// ── Import app & supertest ───────────────────
import request from 'supertest';
import app from '../../src/app.js';

// ── Helpers ──────────────────────────────────
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
    prenom: 'Mission019',
    email: 'test@crv.com',
    fonction: 'CHEF',
    statut: 'ACTIF',
    statutCompte: 'VALIDE',
    ...overrides,
  };
  mockFindByIdPersonne.mockResolvedValue(user);
  return user;
}

function fakeCRV(overrides = {}) {
  return {
    _id: CRV_ID,
    statut: 'EN_COURS',
    creePar: FAKE_USER_ID,
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════

describe('Mission 019 — Protection statut VALIDE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoriqueCreate.mockResolvedValue({});
    mockUserActivityLogWrite.mockResolvedValue({});
    mockPersonneFindByIdLean.mockResolvedValue({ nom: 'Test', prenom: 'User', email: 'test@crv.com' });
  });

  // ═══════════════════════════════════════════════════
  // TEST 1 — PATCH CRV VALIDE → 403
  // ═══════════════════════════════════════════════════
  it('PATCH /api/crv/:id → 403 si CRV VALIDE', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VALIDE' }));

    const token = generateValidToken();
    const res = await request(app)
      .patch(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ escale: 'TEST' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('CRV_NON_MODIFIABLE');
  });

  // ═══════════════════════════════════════════════════
  // TEST 2 — PATCH CRV VERROUILLE → 403 (régression)
  // ═══════════════════════════════════════════════════
  it('PATCH /api/crv/:id → 403 si CRV VERROUILLE (non-régression)', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VERROUILLE' }));

    const token = generateValidToken();
    const res = await request(app)
      .patch(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ escale: 'TEST' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CRV_NON_MODIFIABLE');
  });

  // ═══════════════════════════════════════════════════
  // TEST 3 — PATCH CRV EN_COURS → autorisé
  // ═══════════════════════════════════════════════════
  it('PATCH /api/crv/:id → passe le middleware si CRV EN_COURS', async () => {
    mockAuthenticatedUser();
    const crv = fakeCRV({ statut: 'EN_COURS' });
    mockCRVFindById.mockReturnValue(crv);

    const token = generateValidToken();
    const res = await request(app)
      .patch(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ escale: 'TEST' });

    // Le middleware laisse passer, le controller peut retourner 200 ou autre
    // L'important : ce n'est PAS un 403
    expect(res.status).not.toBe(403);
  });

  // ═══════════════════════════════════════════════════
  // TEST 4 — PATCH CRV TERMINE → refusé (BUG-04 FIX)
  // ═══════════════════════════════════════════════════
  it('PATCH /api/crv/:id → 403 si CRV TERMINE', async () => {
    mockAuthenticatedUser();
    const crv = fakeCRV({ statut: 'TERMINE' });
    mockCRVFindById.mockReturnValue(crv);

    const token = generateValidToken();
    const res = await request(app)
      .patch(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ escale: 'TEST' });

    expect(res.status).toBe(403);
  });

  // ═══════════════════════════════════════════════════
  // TEST 5 — Ajout charge sur CRV VALIDE → 403
  // ═══════════════════════════════════════════════════
  it('POST /api/crv/:id/charges → 403 si CRV VALIDE', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VALIDE' }));

    const token = generateValidToken();
    const res = await request(app)
      .post(`/api/crv/${CRV_ID}/charges`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        typeCharge: 'PASSAGERS',
        sensOperation: 'EMBARQUEMENT',
        passagersAdultes: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CRV_NON_MODIFIABLE');
  });

  // ═══════════════════════════════════════════════════
  // TEST 6 — Ajout événement sur CRV VALIDE → 403
  // ═══════════════════════════════════════════════════
  it('POST /api/crv/:id/evenements → 403 si CRV VALIDE', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VALIDE' }));

    const token = generateValidToken();
    const res = await request(app)
      .post(`/api/crv/${CRV_ID}/evenements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        typeEvenement: 'RETARD',
        gravite: 'MINEURE',
        description: 'Test événement',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CRV_NON_MODIFIABLE');
  });

  // ═══════════════════════════════════════════════════
  // TEST 7 — Suppression CRV VALIDE → 403
  // ═══════════════════════════════════════════════════
  it('DELETE /api/crv/:id → 403 si CRV VALIDE', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VALIDE' }));

    const token = generateValidToken();
    const res = await request(app)
      .delete(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CRV_NON_MODIFIABLE');
  });

  // ═══════════════════════════════════════════════════
  // TEST 8 — Message contient le statut
  // ═══════════════════════════════════════════════════
  it('Le message de refus contient le statut VALIDE', async () => {
    mockAuthenticatedUser();
    mockCRVFindById.mockReturnValue(fakeCRV({ statut: 'VALIDE' }));

    const token = generateValidToken();
    const res = await request(app)
      .patch(`/api/crv/${CRV_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ escale: 'TEST' });

    expect(res.body.message).toContain('VALIDE');
  });
});
