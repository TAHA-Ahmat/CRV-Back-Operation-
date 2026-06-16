// ============================================
// MISSION 017 — TESTS ENDPOINTS CRV
// ============================================
// Tests d'intégration Express (supertest)
// Couvre : CRUD, transitions d'état, auth, permissions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mocks hoistés + ENV setup ─
const {
  TEST_JWT_SECRET,
  mockFindByIdPersonne,
  mockCRVFindById,
  mockCRVFind,
  mockCRVCreate,
  mockCRVFindByIdAndDelete,
  mockCRVCountDocuments,
  mockHistoriqueCreate,
  mockUserActivityLogWrite,
  mockPersonneFindByIdLean,
  mockVolFindById,
  mockBulletinFindById,
  mockMongooseStartSession,
} = vi.hoisted(() => {
  const secret = 'test-secret-mission-017';
  process.env.JWT_SECRET = secret;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';

  // Create mock session that will be used by all tests
  const mockMongooseStartSession = vi.fn(async () => ({
    startTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    withTransaction: vi.fn(async (callback) => {
      try {
        return await callback({
          startTransaction: vi.fn(),
          commitTransaction: vi.fn(),
          abortTransaction: vi.fn(),
          endSession: vi.fn(),
        });
      } catch (error) {
        throw error;
      }
    }),
  }));

  return {
    TEST_JWT_SECRET: secret,
    mockFindByIdPersonne: vi.fn(),
    mockCRVFindById: vi.fn(),
    mockCRVFind: vi.fn(),
    mockCRVCreate: vi.fn(),
    mockCRVFindByIdAndDelete: vi.fn(),
    mockCRVCountDocuments: vi.fn(),
    mockHistoriqueCreate: vi.fn(),
    mockUserActivityLogWrite: vi.fn(),
    mockPersonneFindByIdLean: vi.fn(),
    mockVolFindById: vi.fn(),
    mockBulletinFindById: vi.fn(),
    mockMongooseStartSession,
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
        session: vi.fn().mockReturnThis(), // CRITICAL: support .session() for transaction tests
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
    create: vi.fn().mockImplementation((...args) => mockCRVCreate(...args)),
    findByIdAndDelete: vi.fn().mockImplementation(() => mockCRVFindByIdAndDelete()),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn().mockImplementation(() => mockCRVCountDocuments()),
    findOne: vi.fn().mockResolvedValue(null),
  }
}));

// ── Mock Vol ─────────────────────────────────
vi.mock('../../src/models/flights/Vol.js', () => ({
  default: {
    findById: vi.fn().mockImplementation(() => {
      const result = mockVolFindById();
      return {
        populate: vi.fn().mockReturnThis(),
        session: vi.fn().mockReturnThis(), // CRITICAL: support .session() for transactions
        then: (resolve) => resolve(result),
      };
    }),
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue([]),
  }
}));

// ── Mock BulletinMouvement ───────────────────
vi.mock('../../src/models/bulletin/BulletinMouvement.js', () => ({
  default: {
    findById: vi.fn().mockImplementation(() => {
      const result = mockBulletinFindById();
      return {
        populate: vi.fn().mockReturnThis(),
        then: (resolve) => resolve(result),
      };
    }),
    findOne: vi.fn().mockResolvedValue(null),
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
  default: {
    find: vi.fn().mockImplementation(() => {
      return {
        populate: vi.fn().mockReturnThis(),
        session: vi.fn().mockReturnThis(), // CRITICAL: support .session() for transactions
        then: (resolve) => resolve([]),
      };
    }),
    create: vi.fn(),
    deleteMany: vi.fn(),
  }
}));

// ── Mock Phase ───────────────────────────────
vi.mock('../../src/models/phases/Phase.js', () => ({
  default: {
    find: vi.fn().mockImplementation(() => {
      return {
        populate: vi.fn().mockReturnThis(),
        session: vi.fn().mockReturnThis(), // CRITICAL: support .session() for transactions
        then: (resolve) => resolve([]),
      };
    }),
    create: vi.fn(),
    insertMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn(),
  }
}));

// ── Mock Charge ──────────────────────────────
vi.mock('../../src/models/charges/Charge.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    deleteMany: vi.fn(),
  }
}));

// ── Mock crv.service ─────────────────────────
vi.mock('../../src/services/crv/crv.service.js', () => ({
  calculerCompletude: vi.fn().mockResolvedValue(90),
  verifierConformiteSLA: vi.fn().mockResolvedValue({ conformite: true, ecarts: [] }),
}));

// ── Mock Phase service ───────────────────────
vi.mock('../../src/services/phases/phase.service.js', () => ({
  creerPhasesDefaut: vi.fn().mockResolvedValue([]),
  default: { creerPhasesDefaut: vi.fn().mockResolvedValue([]) },
}));

// ── Mock charge service ──────────────────────
vi.mock('../../src/services/charges/charge.service.js', () => ({
  creerChargeDefaut: vi.fn().mockResolvedValue(null),
  default: { creerChargeDefaut: vi.fn().mockResolvedValue(null) },
}));

// ── Mock detecter doublons ───────────────────
vi.mock('../../src/services/crv/doublonDetection.service.js', () => ({
  detecterDoublonCRV: vi.fn().mockResolvedValue(null),
  default: { detecterDoublonCRV: vi.fn().mockResolvedValue(null) },
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

// ── Mock Avion ───────────────────────────────
vi.mock('../../src/models/referentials/Avion.js', () => ({
  default: { findById: vi.fn().mockResolvedValue(null), findOne: vi.fn().mockResolvedValue(null) }
}));

// ── Mock Engin ───────────────────────────────
vi.mock('../../src/models/resources/Engin.js', () => ({
  default: { find: vi.fn().mockResolvedValue([]) }
}));

// ── Mock ProgrammeVol ────────────────────────
vi.mock('../../src/models/flights/ProgrammeVol.js', () => ({
  default: { findById: vi.fn().mockResolvedValue(null), findOne: vi.fn().mockResolvedValue(null) }
}));

// ── Mock SLA Config ──────────────────────────
vi.mock('../../src/models/sla/SLAConfig.js', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) }
}));

// ── Import app & supertest ───────────────────
// Note: mongoose.startSession is mocked in vitest.setup.js
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
    prenom: 'Mission017',
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
    statut: 'BROUILLON',
    creePar: FAKE_USER_ID,
    typeOperation: 'ARRIVEE',
    completude: 0,
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════

describe('Mission 017 — Tests endpoints CRV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoriqueCreate.mockResolvedValue({});
    mockUserActivityLogWrite.mockResolvedValue({});
    mockPersonneFindByIdLean.mockResolvedValue({ nom: 'Test', prenom: 'User', email: 'test@crv.com' });
  });

  // ═══════════════════════════════════════════════════
  // SECTION A — AUTHENTIFICATION
  // ═══════════════════════════════════════════════════
  describe('A — Authentification', () => {
    it('GET /api/crv → 401 sans token', async () => {
      const res = await request(app).get('/api/crv');
      expect(res.status).toBe(401);
    });

    it('GET /api/crv → 401 avec token invalide', async () => {
      const res = await request(app)
        .get('/api/crv')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('GET /api/crv → 401 avec token expiré', async () => {
      const expiredToken = jwt.sign({ id: FAKE_USER_ID }, TEST_JWT_SECRET, { expiresIn: '0s' });
      // Attendre que le token expire
      await new Promise(r => setTimeout(r, 10));
      const res = await request(app)
        .get('/api/crv')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });

    it('GET /api/crv → 403 si compte non VALIDE', async () => {
      mockFindByIdPersonne.mockResolvedValue({
        _id: FAKE_USER_ID,
        fonction: 'CHEF',
        statut: 'ACTIF',
        statutCompte: 'EN_ATTENTE',
      });
      const token = generateValidToken();
      const res = await request(app)
        .get('/api/crv')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION B — LECTURE CRV
  // ═══════════════════════════════════════════════════
  describe('B — Lecture CRV', () => {
    it('GET /api/crv → 200 liste paginée', async () => {
      mockAuthenticatedUser();
      mockCRVFind.mockReturnValue([fakeCRV()]);
      mockCRVCountDocuments.mockResolvedValue(1);

      const token = generateValidToken();
      const res = await request(app)
        .get('/api/crv')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/crv/:id → 404 CRV inexistant', async () => {
      mockAuthenticatedUser();
      mockCRVFindById.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .get(`/api/crv/${CRV_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('QUALITE peut lire les CRV', async () => {
      mockAuthenticatedUser({ fonction: 'QUALITE' });
      mockCRVFind.mockReturnValue([]);
      mockCRVCountDocuments.mockResolvedValue(0);

      const token = generateValidToken();
      const res = await request(app)
        .get('/api/crv')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION C — PERMISSIONS QUALITE (écriture bloquée)
  // ═══════════════════════════════════════════════════
  describe('C — QUALITE bloqué en écriture', () => {
    it('POST /api/crv/:id/demarrer → 403 pour QUALITE', async () => {
      mockAuthenticatedUser({ fonction: 'QUALITE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/demarrer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('QUALITE_READ_ONLY');
    });

    it('POST /api/crv/:id/terminer → 403 pour QUALITE', async () => {
      mockAuthenticatedUser({ fonction: 'QUALITE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/terminer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('DELETE /api/crv/:id → 403 pour QUALITE', async () => {
      mockAuthenticatedUser({ fonction: 'QUALITE' });

      const token = generateValidToken();
      const res = await request(app)
        .delete(`/api/crv/${CRV_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION D — TRANSITIONS D'ÉTAT
  // ═══════════════════════════════════════════════════
  describe('D — Transitions d\'état', () => {
    it('POST /api/crv/:id/demarrer → 200 si BROUILLON', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });
      const crv = fakeCRV({ statut: 'BROUILLON' });
      mockCRVFindById.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/demarrer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/crv/:id/demarrer → 404 CRV inexistant', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });
      mockCRVFindById.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/demarrer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('POST /api/crv/:id/demarrer → 400 si pas BROUILLON', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });
      const crv = fakeCRV({ statut: 'EN_COURS' });
      mockCRVFindById.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/demarrer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('POST /api/crv/:id/terminer → 404 CRV inexistant', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });
      mockCRVFindById.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/terminer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('POST /api/crv/:id/terminer → 400 si pas EN_COURS', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });
      const crv = fakeCRV({ statut: 'BROUILLON' });
      mockCRVFindById.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/terminer`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('POST /api/crv/:id/annuler → 404 CRV inexistant', async () => {
      mockAuthenticatedUser({ fonction: 'SUPERVISEUR' });
      mockCRVFindById.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/crv/${CRV_ID}/annuler`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION E — SUPPRESSION
  // ═══════════════════════════════════════════════════
  describe('E — Suppression CRV', () => {
    it('DELETE /api/crv/:id → 404 CRV inexistant', async () => {
      mockAuthenticatedUser();
      mockCRVFindById.mockReturnValue(null);

      const token = generateValidToken();
      const res = await request(app)
        .delete(`/api/crv/${CRV_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('DELETE /api/crv/:id → 400 si CRV TERMINE', async () => {
      mockAuthenticatedUser();
      const crv = fakeCRV({ statut: 'TERMINE' });
      mockCRVFindById.mockReturnValue(crv);

      const token = generateValidToken();
      const res = await request(app)
        .delete(`/api/crv/${CRV_ID}`)
        .set('Authorization', `Bearer ${token}`);

      // Suppression interdite >= TERMINE
      expect([400, 403]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION F — VALIDATION ROUTES AUTH
  // ═══════════════════════════════════════════════════
  describe('F — Routes validation protégées', () => {
    it('POST /api/validation/:id/valider → 403 pour AGENT_ESCALE', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/valider`)
        .set('Authorization', `Bearer ${token}`)
        .send({ commentaires: 'test' });

      expect(res.status).toBe(403);
    });

    it('POST /api/validation/:id/verrouiller → 403 pour CHEF', async () => {
      mockAuthenticatedUser({ fonction: 'CHEF' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/verrouiller`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('POST /api/validation/:id/deverrouiller → 403 pour AGENT_ESCALE', async () => {
      mockAuthenticatedUser({ fonction: 'AGENT_ESCALE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/deverrouiller`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'test' });

      expect(res.status).toBe(403);
    });

    it('POST /api/validation/:id/rejeter → 403 pour CHEF_EQUIPE', async () => {
      mockAuthenticatedUser({ fonction: 'CHEF_EQUIPE' });

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/rejeter`)
        .set('Authorization', `Bearer ${token}`)
        .send({ raison: 'test' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════
  // SECTION G — HEALTH CHECK
  // ═══════════════════════════════════════════════════
  describe('G — Health check', () => {
    it('GET /health → 200 sans auth', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('opérationnelle');
    });
  });
});
