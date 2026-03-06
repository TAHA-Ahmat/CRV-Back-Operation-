import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mission 013 — Tests Registration Securite
 *
 * Verifie :
 * 1. register() → statutCompte EN_ATTENTE, role force AGENT_ESCALE, pas de token
 * 2. login() → refuse statutCompte non-VALIDE
 * 3. protect() → bloque statutCompte non-VALIDE
 * 4. validerCompte() → accessible uniquement par ADMIN, met a jour correctement
 */

// ═══════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('fake-jwt-token'),
    verify: vi.fn()
  }
}));

vi.mock('../../src/config/env.js', () => ({
  config: { jwtSecret: 'test-secret-key' }
}));

const mockPersonneCreate = vi.fn();
const mockPersonneFindOne = vi.fn();
const mockPersonneFindById = vi.fn();

// Helper : crée un objet "query-like" qui supporte à la fois :
// - await Personne.findXxx() (thenable direct)
// - Personne.findXxx().select() (chainage Mongoose)
function createQueryMock(resultPromise) {
  return {
    select: () => resultPromise,
    then: (resolve, reject) => resultPromise.then(resolve, reject),
    catch: (reject) => resultPromise.catch(reject)
  };
}

vi.mock('../../src/models/security/Personne.js', () => ({
  default: {
    create: (...args) => mockPersonneCreate(...args),
    findOne: (...args) => createQueryMock(mockPersonneFindOne(...args)),
    findById: (...args) => createQueryMock(mockPersonneFindById(...args))
  }
}));

import jwt from 'jsonwebtoken';
const { login, register, validerCompte } = await import('../../src/controllers/security/auth.controller.js');
const { protect, authorize } = await import('../../src/middlewares/auth.middleware.js');

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function createReq(body = {}, headers = {}) {
  return {
    body,
    headers: {
      authorization: headers.authorization || undefined,
      ...headers
    },
    user: headers._user || undefined
  };
}

function createRes() {
  const res = {
    status: vi.fn(),
    body: null
  };
  res.status.mockImplementation((code) => {
    return {
      json: (data) => {
        res.body = data;
        res.statusCode = code;
      }
    };
  });
  return res;
}

function createNext() {
  return vi.fn();
}

// ═══════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════

describe('Mission 013 — Registration Securite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────
  // register() — Workflow EN_ATTENTE
  // ─────────────────────────────────────────────────────
  describe('register() — workflow EN_ATTENTE', () => {
    const validRegistration = {
      nom: 'Test',
      prenom: 'User',
      matricule: 'TST-001',
      email: 'test@crv.td',
      password: 'password123'
    };

    it('cree un compte avec statutCompte EN_ATTENTE', async () => {
      mockPersonneFindOne.mockResolvedValue(null);
      mockPersonneCreate.mockResolvedValue({
        _id: 'new-user-id',
        ...validRegistration,
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE'
      });

      const req = createReq(validRegistration);
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.user.statutCompte).toBe('EN_ATTENTE');
    });

    it('force le role AGENT_ESCALE (ignore le role fourni)', async () => {
      mockPersonneFindOne.mockResolvedValue(null);
      mockPersonneCreate.mockResolvedValue({
        _id: 'new-user-id',
        ...validRegistration,
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE'
      });

      const req = createReq({
        ...validRegistration,
        fonction: 'ADMIN' // Tentative d'escalation
      });
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      // Verifie que Personne.create est appele avec fonction: 'AGENT_ESCALE'
      expect(mockPersonneCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fonction: 'AGENT_ESCALE'
        })
      );
    });

    it('ne retourne PAS de token JWT', async () => {
      mockPersonneFindOne.mockResolvedValue(null);
      mockPersonneCreate.mockResolvedValue({
        _id: 'new-user-id',
        ...validRegistration,
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE'
      });

      const req = createReq(validRegistration);
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      expect(res.body.token).toBeUndefined();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('retourne un message indiquant l\'attente de validation', async () => {
      mockPersonneFindOne.mockResolvedValue(null);
      mockPersonneCreate.mockResolvedValue({
        _id: 'new-user-id',
        ...validRegistration,
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE'
      });

      const req = createReq(validRegistration);
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      expect(res.body.message).toContain('attente');
      expect(res.body.message).toContain('administrateur');
    });

    it('refuse si email/matricule deja utilise (400)', async () => {
      mockPersonneFindOne.mockResolvedValue({ _id: 'existing-user' });

      const req = createReq(validRegistration);
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('Impossible de créer le compte');
    });

    it('force statutCompte EN_ATTENTE meme si VALIDE est fourni', async () => {
      mockPersonneFindOne.mockResolvedValue(null);
      mockPersonneCreate.mockResolvedValue({
        _id: 'new-user-id',
        ...validRegistration,
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE'
      });

      const req = createReq({
        ...validRegistration,
        statutCompte: 'VALIDE' // Tentative de bypass
      });
      const res = createRes();
      const next = createNext();

      await register(req, res, next);

      expect(mockPersonneCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statutCompte: 'EN_ATTENTE'
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // login() — Verification statutCompte
  // ─────────────────────────────────────────────────────
  describe('login() — verification statutCompte', () => {
    const loginData = { email: 'test@crv.td', password: 'password123' };

    it('refuse login si statutCompte EN_ATTENTE (403)', async () => {
      mockPersonneFindOne.mockResolvedValue({
        _id: 'user-pending',
        email: 'test@crv.td',
        statut: 'ACTIF',
        statutCompte: 'EN_ATTENTE',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const req = createReq(loginData);
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('COMPTE_NON_VALIDE');
      expect(res.body.message).toContain('attente');
    });

    it('refuse login si statutCompte SUSPENDU (403)', async () => {
      mockPersonneFindOne.mockResolvedValue({
        _id: 'user-suspended',
        email: 'test@crv.td',
        statut: 'ACTIF',
        statutCompte: 'SUSPENDU',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const req = createReq(loginData);
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('COMPTE_NON_VALIDE');
    });

    it('refuse login si statutCompte DESACTIVE (403)', async () => {
      mockPersonneFindOne.mockResolvedValue({
        _id: 'user-deactivated',
        email: 'test@crv.td',
        statut: 'ACTIF',
        statutCompte: 'DESACTIVE',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const req = createReq(loginData);
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('accepte login si statutCompte VALIDE (200)', async () => {
      mockPersonneFindOne.mockResolvedValue({
        _id: 'user-valid',
        nom: 'Test',
        prenom: 'User',
        email: 'test@crv.td',
        fonction: 'AGENT_ESCALE',
        matricule: 'TST-001',
        statut: 'ACTIF',
        statutCompte: 'VALIDE',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const req = createReq(loginData);
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body.token).toBeDefined();
    });

    it('verifie statut AVANT statutCompte (INACTIF = 403 sans code COMPTE_NON_VALIDE)', async () => {
      mockPersonneFindOne.mockResolvedValue({
        _id: 'user-inactive',
        email: 'test@crv.td',
        statut: 'INACTIF',
        statutCompte: 'VALIDE',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const req = createReq(loginData);
      const res = createRes();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBeUndefined(); // Pas COMPTE_NON_VALIDE
      expect(res.body.message).toContain('inactif');
    });
  });

  // ─────────────────────────────────────────────────────
  // protect() — Verification statutCompte middleware
  // ─────────────────────────────────────────────────────
  describe('protect() — verification statutCompte middleware', () => {
    it('bloque statutCompte EN_ATTENTE (403)', async () => {
      const req = createReq({}, { authorization: 'Bearer valid-token' });
      const res = createRes();
      const next = createNext();

      jwt.verify.mockReturnValue({ id: 'user-pending' });
      mockPersonneFindById.mockResolvedValue({
        _id: 'user-pending',
        statut: 'ACTIF',
        statutCompte: 'EN_ATTENTE',
        fonction: 'AGENT_ESCALE'
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('COMPTE_NON_VALIDE');
      expect(next).not.toHaveBeenCalled();
    });

    it('bloque statutCompte SUSPENDU (403)', async () => {
      const req = createReq({}, { authorization: 'Bearer valid-token' });
      const res = createRes();
      const next = createNext();

      jwt.verify.mockReturnValue({ id: 'user-suspended' });
      mockPersonneFindById.mockResolvedValue({
        _id: 'user-suspended',
        statut: 'ACTIF',
        statutCompte: 'SUSPENDU',
        fonction: 'AGENT_ESCALE'
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('COMPTE_NON_VALIDE');
      expect(next).not.toHaveBeenCalled();
    });

    it('laisse passer statutCompte VALIDE', async () => {
      const req = createReq({}, { authorization: 'Bearer valid-token' });
      const res = createRes();
      const next = createNext();

      jwt.verify.mockReturnValue({ id: 'user-valid' });
      mockPersonneFindById.mockResolvedValue({
        _id: 'user-valid',
        statut: 'ACTIF',
        statutCompte: 'VALIDE',
        fonction: 'AGENT_ESCALE'
      });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────
  // validerCompte() — Endpoint ADMIN
  // ─────────────────────────────────────────────────────
  describe('validerCompte() — endpoint ADMIN', () => {
    it('valide un compte EN_ATTENTE avec succes', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      mockPersonneFindById.mockResolvedValue({
        _id: 'user-to-validate',
        nom: 'Test',
        prenom: 'User',
        email: 'test@crv.td',
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE',
        save: mockSave
      });

      const req = createReq(
        { personnelId: 'user-to-validate' },
        { _user: { _id: 'admin-001', fonction: 'ADMIN', statutCompte: 'VALIDE' } }
      );
      req.user = req.headers._user;
      const res = createRes();
      const next = createNext();

      await validerCompte(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body.user.statutCompte).toBe('VALIDE');
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('refuse si personnelId manquant (400)', async () => {
      const req = createReq({}, { _user: { _id: 'admin-001' } });
      req.user = req.headers._user;
      const res = createRes();
      const next = createNext();

      await validerCompte(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('personnelId');
    });

    it('refuse si personnel inexistant (404)', async () => {
      mockPersonneFindById.mockResolvedValue(null);

      const req = createReq(
        { personnelId: 'inexistant-id' },
        { _user: { _id: 'admin-001' } }
      );
      req.user = req.headers._user;
      const res = createRes();
      const next = createNext();

      await validerCompte(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('refuse si compte deja VALIDE (400)', async () => {
      mockPersonneFindById.mockResolvedValue({
        _id: 'user-already-valid',
        statutCompte: 'VALIDE'
      });

      const req = createReq(
        { personnelId: 'user-already-valid' },
        { _user: { _id: 'admin-001' } }
      );
      req.user = req.headers._user;
      const res = createRes();
      const next = createNext();

      await validerCompte(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('déjà validé');
    });

    it('met a jour dateValidationCompte et valideParUserId', async () => {
      const mockPersonne = {
        _id: 'user-to-validate',
        nom: 'Test',
        prenom: 'User',
        email: 'test@crv.td',
        fonction: 'AGENT_ESCALE',
        statutCompte: 'EN_ATTENTE',
        dateValidationCompte: null,
        valideParUserId: null,
        save: vi.fn().mockResolvedValue(true)
      };
      mockPersonneFindById.mockResolvedValue(mockPersonne);

      const req = createReq(
        { personnelId: 'user-to-validate' },
        { _user: { _id: 'admin-001' } }
      );
      req.user = req.headers._user;
      const res = createRes();
      const next = createNext();

      await validerCompte(req, res, next);

      expect(mockPersonne.statutCompte).toBe('VALIDE');
      expect(mockPersonne.dateValidationCompte).toBeInstanceOf(Date);
      expect(mockPersonne.valideParUserId).toBe('admin-001');
    });

    it('authorize("ADMIN") bloque les non-ADMIN', () => {
      const req = { user: { fonction: 'AGENT_ESCALE' } };
      const res = createRes();
      const next = createNext();

      authorize('ADMIN')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('authorize("ADMIN") laisse passer ADMIN', () => {
      const req = { user: { fonction: 'ADMIN' } };
      const res = createRes();
      const next = createNext();

      authorize('ADMIN')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────
  // Flux complet — Scenario de bout en bout
  // ─────────────────────────────────────────────────────
  describe('Flux complet — scenario bout en bout', () => {
    it('register → login refuse → admin valide → login OK', async () => {
      // 1. Register — crée compte EN_ATTENTE
      mockPersonneFindOne.mockResolvedValue(null);
      const createdUser = {
        _id: 'new-user',
        nom: 'Nouveau',
        prenom: 'Agent',
        email: 'nouveau@crv.td',
        fonction: 'AGENT_ESCALE',
        matricule: 'NEW-001',
        statutCompte: 'EN_ATTENTE'
      };
      mockPersonneCreate.mockResolvedValue(createdUser);

      const reqRegister = createReq({
        nom: 'Nouveau', prenom: 'Agent', matricule: 'NEW-001',
        email: 'nouveau@crv.td', password: 'password123'
      });
      const resRegister = createRes();
      await register(reqRegister, resRegister, createNext());

      expect(resRegister.statusCode).toBe(201);
      expect(resRegister.body.token).toBeUndefined();

      // 2. Login — refuse car EN_ATTENTE
      vi.clearAllMocks();
      mockPersonneFindOne.mockResolvedValue({
        ...createdUser,
        statut: 'ACTIF',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const reqLogin1 = createReq({ email: 'nouveau@crv.td', password: 'password123' });
      const resLogin1 = createRes();
      await login(reqLogin1, resLogin1, createNext());

      expect(resLogin1.statusCode).toBe(403);
      expect(resLogin1.body.code).toBe('COMPTE_NON_VALIDE');

      // 3. Admin valide le compte
      vi.clearAllMocks();
      const validatedUser = { ...createdUser, statutCompte: 'EN_ATTENTE', save: vi.fn().mockResolvedValue(true) };
      mockPersonneFindById.mockResolvedValue(validatedUser);

      const reqValidate = createReq({ personnelId: 'new-user' });
      reqValidate.user = { _id: 'admin-001', fonction: 'ADMIN' };
      const resValidate = createRes();
      await validerCompte(reqValidate, resValidate, createNext());

      expect(resValidate.statusCode).toBe(200);
      expect(validatedUser.statutCompte).toBe('VALIDE');

      // 4. Login — maintenant accepté
      vi.clearAllMocks();
      mockPersonneFindOne.mockResolvedValue({
        ...createdUser,
        statut: 'ACTIF',
        statutCompte: 'VALIDE',
        comparePassword: vi.fn().mockResolvedValue(true)
      });

      const reqLogin2 = createReq({ email: 'nouveau@crv.td', password: 'password123' });
      const resLogin2 = createRes();
      await login(reqLogin2, resLogin2, createNext());

      expect(resLogin2.statusCode).toBe(200);
      expect(resLogin2.body.token).toBeDefined();
    });
  });
});
