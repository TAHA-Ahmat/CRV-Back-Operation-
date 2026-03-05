// ============================================
// MISSION 005 — TESTS HTTP CRITIQUES
// ============================================
// Tests d'intégration Express (supertest)
// Vérifie : auth, routing, validation↔archivage
//
// On ne touche PAS la logique métier.
// On valide que l'API Express tient ses promesses.

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mocks hoistés + ENV setup (AVANT tout import de module) ─
const {
  TEST_JWT_SECRET,
  mockFindByIdPersonne,
  mockCheckArchiveStatus,
  mockValiderCRV,
  mockFindByIdValidation,
  mockFindByIdCRV,
  mockNotifier,
  mockHistoriqueCreate,
  mockUserActivityLogWrite,
  mockPersonneFindByIdLean,
} = vi.hoisted(() => {
  // ⚠️ CRITIQUE: En ESM, les imports sont hoistés AVANT le code top-level.
  // env.js fait process.exit(1) si JWT_SECRET manquant.
  // vi.hoisted() s'exécute AVANT les imports → on set process.env ICI.
  const secret = 'test-secret-mission-005';
  process.env.JWT_SECRET = secret;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';

  return {
    TEST_JWT_SECRET: secret,
    mockFindByIdPersonne: vi.fn(),
    mockCheckArchiveStatus: vi.fn(),
    mockValiderCRV: vi.fn(),
    mockFindByIdValidation: vi.fn(),
    mockFindByIdCRV: vi.fn(),
    mockNotifier: vi.fn(),
    mockHistoriqueCreate: vi.fn(),
    mockUserActivityLogWrite: vi.fn(),
    mockPersonneFindByIdLean: vi.fn(),
  };
});

// ── Mock Personne (auth middleware) ────────────────────
vi.mock('../../src/models/security/Personne.js', () => {
  const findByIdFn = vi.fn().mockImplementation((id, projection) => {
    // Cas d'appel avec projection (lean) dans auditFinalize
    if (projection) {
      return { lean: () => mockPersonneFindByIdLean() };
    }
    // Cas normal (auth middleware) : Personne.findById(id).select('-password')
    // Mongoose query est thenable — .select() retourne un objet thenable
    return {
      select: vi.fn().mockImplementation(() => {
        // Retourne un thenable (pseudo-promise) pour le await dans auth middleware
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
    getArchiveServiceStatus: (...args) => mockCheckArchiveStatus(...args),
    archiverCRV: vi.fn(),
    canArchiveCRVById: vi.fn(),
    getArchivageInfo: vi.fn(),
    getPreviewData: vi.fn(),
    genererPdfBuffer: vi.fn(),
    genererPdfStream: vi.fn(),
  },
  getArchiveServiceStatus: (...args) => mockCheckArchiveStatus(...args),
  archiverCRV: vi.fn(),
  isCRVImmutable: vi.fn(),
  canArchiveCRV: vi.fn(),
  canArchiveCRVById: vi.fn(),
  getArchivageInfo: vi.fn(),
  getPreviewData: vi.fn(),
  genererPdfBuffer: vi.fn(),
  genererPdfStream: vi.fn(),
  getArchiveServiceStatus: (...args) => mockCheckArchiveStatus(...args),
}));

// ── Mock service validation ───────────────────────────
vi.mock('../../src/services/validation/validation.service.js', () => ({
  validerCRV: (...args) => mockValiderCRV(...args),
  verrouillerCRV: vi.fn(),
  deverrouillerCRV: vi.fn(),
}));

// ── Mock ValidationCRV model ──────────────────────────
vi.mock('../../src/models/validation/ValidationCRV.js', () => {
  const chainable = {
    populate: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      findById: vi.fn().mockImplementation(() => {
        // Return chainable that resolves to mocked result
        const chain = {
          populate: vi.fn().mockReturnThis(),
          then: (resolve) => resolve(mockFindByIdValidation()),
        };
        // make it thenable
        return chain;
      }),
      findOne: vi.fn().mockReturnValue(chainable),
      create: vi.fn(),
      deleteOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    }
  };
});

// ── Mock CRV model (pour notification dans controller) ─
vi.mock('../../src/models/crv/CRV.js', () => {
  return {
    default: {
      findById: vi.fn().mockImplementation(() => {
        const chain = {
          populate: vi.fn().mockReturnThis(),
          then: (resolve) => resolve(mockFindByIdCRV()),
        };
        return chain;
      }),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    }
  };
});

// ── Mock notification ─────────────────────────────────
vi.mock('../../src/services/notifications/notification.service.js', () => ({
  notifierValidationCRV: (...args) => mockNotifier(...args),
}));

// ── Mock HistoriqueModification (auditLog middleware) ──
vi.mock('../../src/models/crv/HistoriqueModification.js', () => ({
  default: {
    create: (...args) => mockHistoriqueCreate(...args),
  }
}));

// ── Mock UserActivityLog (auditFinalize middleware) ────
vi.mock('../../src/models/security/UserActivityLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
    write: (...args) => mockUserActivityLogWrite(...args),
  }
}));

// ── Mock ChronologiePhase (requis par validation.service) ─
vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
  }
}));

// ── Mock crv.service (calculerCompletude, verifierConformiteSLA) ─
vi.mock('../../src/services/crv/crv.service.js', () => ({
  calculerCompletude: vi.fn().mockResolvedValue(90),
  verifierConformiteSLA: vi.fn().mockResolvedValue({ conformite: true, ecarts: [] }),
}));

// ── Mock base/DocumentArchiver ─────────────────────────
vi.mock('../../src/services/documents/base/DocumentArchiver.js', () => ({
  archiveDocument: vi.fn().mockResolvedValue({
    fileId: 'test-file-id',
    webViewLink: 'https://drive.google.com/test',
    filename: 'test.pdf',
    folderPath: 'CRV/2026/03/AF',
    size: 1024,
  }),
  checkArchiveStatus: (...args) => mockCheckArchiveStatus(...args),
}));

// ── Mock CrvGenerator ──────────────────────────────────
vi.mock('../../src/services/documents/crv/CrvGenerator.js', () => ({
  CrvGenerator: class MockCrvGenerator {
    generateBuffer() { return Promise.resolve(Buffer.from('fake-pdf')); }
    getPreviewData() { return Promise.resolve({}); }
    generateStream() { return Promise.resolve(); }
  }
}));

// ── Mock documents.config (complet pour couper import cascade) ─
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

function generateValidToken(userId = FAKE_USER_ID) {
  return jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthenticatedUser(overrides = {}) {
  const user = {
    _id: FAKE_USER_ID,
    id: FAKE_USER_ID,
    nom: 'TestUser',
    prenom: 'Mission005',
    email: 'test@crv.com',
    fonction: 'CHEF',
    statut: 'ACTIF',
    ...overrides,
  };
  mockFindByIdPersonne.mockResolvedValue(user);
  return user;
}

// ════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════

describe('Mission 005 — Tests HTTP critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoriqueCreate.mockResolvedValue({});
    mockUserActivityLogWrite.mockResolvedValue({});
    mockPersonneFindByIdLean.mockResolvedValue(null);
    mockNotifier.mockResolvedValue(undefined);
  });

  // ═══════════════════════════════════════════════════
  // TEST 1 — Auth requise
  // ═══════════════════════════════════════════════════
  describe('Test 1 — Auth requise', () => {
    it('GET /api/crv/archive/status sans token → 401', async () => {
      const res = await request(app)
        .get('/api/crv/archive/status');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 2 — Auth valide
  // ═══════════════════════════════════════════════════
  describe('Test 2 — Auth valide', () => {
    it('GET /api/crv/archive/status avec token valide → 200', async () => {
      mockAuthenticatedUser();
      mockCheckArchiveStatus.mockResolvedValue({
        configured: true,
        folderAccessible: true,
      });

      const token = generateValidToken();
      const res = await request(app)
        .get('/api/crv/archive/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 3 — Route shadowing vérifié
  // ═══════════════════════════════════════════════════
  describe('Test 3 — Route shadowing vérifié', () => {
    it('GET /api/crv/archive/status ne doit PAS être capturé par /:id', async () => {
      mockAuthenticatedUser();
      mockCheckArchiveStatus.mockResolvedValue({
        configured: false,
        folderAccessible: false,
      });

      const token = generateValidToken();
      const res = await request(app)
        .get('/api/crv/archive/status')
        .set('Authorization', `Bearer ${token}`);

      // Si capturé par /:id, on aurait un 404 "CRV non trouvé"
      // ou un CastError car "archive" n'est pas un ObjectId Mongo.
      // Le test prouve que /archive/status est bien matchée en tant que
      // route statique et retourne les données du service d'archivage.
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data).toHaveProperty('configured');
      expect(mockCheckArchiveStatus).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 4 — Validation échoue si Drive échoue
  // ═══════════════════════════════════════════════════
  describe('Test 4 — Validation échoue si Drive échoue', () => {
    it('POST /api/validation/:id/valider → erreur si archiverCRV throw', async () => {
      const user = mockAuthenticatedUser();
      const CRV_ID = '507f1f77bcf86cd799439022';

      // Le service validerCRV throw (archivage échoue en interne)
      mockValiderCRV.mockRejectedValue(new Error('Google Drive inaccessible'));

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/valider`)
        .set('Authorization', `Bearer ${token}`)
        .send({ commentaires: 'Validation test' });

      // Le controller passe l'erreur à next(error) → errorHandler
      // errorHandler retourne statusCode || 500
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Google Drive inaccessible');
    });
  });

  // ═══════════════════════════════════════════════════
  // TEST 5 — Validation réussit si Drive OK
  // ═══════════════════════════════════════════════════
  describe('Test 5 — Validation réussit si Drive OK', () => {
    it('POST /api/validation/:id/valider → 200 si archivage OK', async () => {
      const user = mockAuthenticatedUser();
      const CRV_ID = '507f1f77bcf86cd799439033';
      const VALIDATION_ID = '507f1f77bcf86cd799439044';

      // validerCRV retourne une validation OK
      mockValiderCRV.mockResolvedValue({
        _id: VALIDATION_ID,
        crv: CRV_ID,
        statut: 'VALIDE',
        scoreCompletude: 90,
        conformiteSLA: true,
      });

      // ValidationCRV.findById (populate chain dans le controller)
      mockFindByIdValidation.mockReturnValue({
        _id: VALIDATION_ID,
        crv: CRV_ID,
        statut: 'VALIDE',
        validePar: user,
        scoreCompletude: 90,
        ecartsSLA: [],
      });

      // CRV.findById pour notification (optional — ne bloque pas)
      mockFindByIdCRV.mockReturnValue(null); // pas de CRV trouvé = pas de notification

      const token = generateValidToken();
      const res = await request(app)
        .post(`/api/validation/${CRV_ID}/valider`)
        .set('Authorization', `Bearer ${token}`)
        .send({ commentaires: 'OK validation complète' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.statut).toBe('VALIDE');
      expect(mockValiderCRV).toHaveBeenCalledWith(
        CRV_ID,
        FAKE_USER_ID,
        'OK validation complète'
      );
    });
  });
});
