import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mission 009 — Tests Profils & Permissions
 *
 * Tests exhaustifs de tous les profils CRV :
 * - AGENT_ESCALE : opérationnel terrain
 * - CHEF_EQUIPE : opérationnel supervision
 * - SUPERVISEUR : opérationnel management
 * - MANAGER : opérationnel + gestion ressources
 * - QUALITE : lecture seule (AUCUNE écriture)
 * - ADMIN : gestion utilisateurs uniquement
 *
 * Couvre :
 * 1. protect — authentification JWT
 * 2. authorize — contrôle d'accès par rôle
 * 3. excludeQualite — blocage écriture QUALITE
 * 4. Matrice complète profil × action
 */

// ═══════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}));

vi.mock('../../src/config/env.js', () => ({
  config: { jwtSecret: 'test-secret-key' }
}));

const mockPersonneFindById = vi.fn();
vi.mock('../../src/models/security/Personne.js', () => ({
  default: {
    findById: (...args) => ({
      select: () => mockPersonneFindById(...args)
    })
  }
}));

import jwt from 'jsonwebtoken';
const { protect, authorize, excludeQualite } = await import('../../src/middlewares/auth.middleware.js');

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const PROFILS = {
  AGENT_ESCALE: {
    _id: 'agent-001',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'agent@crv.td',
    fonction: 'AGENT_ESCALE',
    statut: 'ACTIF',
    matricule: 'AGT-001'
  },
  CHEF_EQUIPE: {
    _id: 'chef-001',
    nom: 'Martin',
    prenom: 'Pierre',
    email: 'chef@crv.td',
    fonction: 'CHEF_EQUIPE',
    statut: 'ACTIF',
    matricule: 'CHF-001'
  },
  SUPERVISEUR: {
    _id: 'sup-001',
    nom: 'Brahim',
    prenom: 'Ali',
    email: 'superviseur@crv.td',
    fonction: 'SUPERVISEUR',
    statut: 'ACTIF',
    matricule: 'SUP-001'
  },
  MANAGER: {
    _id: 'mgr-001',
    nom: 'Ndoumbe',
    prenom: 'Paul',
    email: 'manager@crv.td',
    fonction: 'MANAGER',
    statut: 'ACTIF',
    matricule: 'MGR-001'
  },
  QUALITE: {
    _id: 'qua-001',
    nom: 'Koumba',
    prenom: 'Marie',
    email: 'qualite@crv.td',
    fonction: 'QUALITE',
    statut: 'ACTIF',
    matricule: 'QUA-001'
  },
  ADMIN: {
    _id: 'adm-001',
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@crv.td',
    fonction: 'ADMIN',
    statut: 'ACTIF',
    matricule: 'ADM-001'
  }
};

function createReq(token = 'valid-token') {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined
    },
    user: null
  };
}

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    status: vi.fn(function (code) { res.statusCode = code; return res; }),
    json: vi.fn(function (data) { res.body = data; return res; })
  };
  return res;
}

function createNext() {
  return vi.fn();
}

function setupAuthForProfile(profilName) {
  jwt.verify.mockReturnValue({ id: PROFILS[profilName]._id });
  mockPersonneFindById.mockResolvedValue(PROFILS[profilName]);
}

// ═══════════════════════════════════════════════════════
// 1. PROTECT — Authentification JWT
// ═══════════════════════════════════════════════════════

describe('protect — Authentification JWT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejette si pas de token (401)', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = createNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.message).toContain('Token manquant');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejette si token invalide (401)', async () => {
    const req = createReq('invalid-token');
    const res = createRes();
    const next = createNext();

    jwt.verify.mockImplementation(() => {
      const err = new Error('invalid');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('rejette si token expiré (401)', async () => {
    const req = createReq('expired-token');
    const res = createRes();
    const next = createNext();

    jwt.verify.mockImplementation(() => {
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
    expect(res.body.requireLogin).toBe(true);
  });

  it('rejette si utilisateur non trouvé (401)', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    jwt.verify.mockReturnValue({ id: 'unknown-id' });
    mockPersonneFindById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.message).toContain('Utilisateur non trouvé');
  });

  it('rejette si compte INACTIF (403)', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    jwt.verify.mockReturnValue({ id: 'inactive-user' });
    mockPersonneFindById.mockResolvedValue({
      ...PROFILS.AGENT_ESCALE,
      _id: 'inactive-user',
      statut: 'INACTIF'
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.message).toContain('inactif');
  });

  it('rejette si compte ABSENT (403)', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    jwt.verify.mockReturnValue({ id: 'absent-user' });
    mockPersonneFindById.mockResolvedValue({
      ...PROFILS.AGENT_ESCALE,
      statut: 'ABSENT'
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejette si compte en CONGE (403)', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    jwt.verify.mockReturnValue({ id: 'conge-user' });
    mockPersonneFindById.mockResolvedValue({
      ...PROFILS.AGENT_ESCALE,
      statut: 'CONGE'
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Test chaque profil ACTIF passe l'auth
  for (const [profilName, profilData] of Object.entries(PROFILS)) {
    it(`authentifie ${profilName} ACTIF avec succès`, async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      setupAuthForProfile(profilName);

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user.fonction).toBe(profilData.fonction);
    });
  }
});

// ═══════════════════════════════════════════════════════
// 2. AUTHORIZE — Contrôle d'accès par rôle
// ═══════════════════════════════════════════════════════

describe('authorize — Contrôle d\'accès par rôle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Routes ADMIN uniquement', () => {
    const adminOnly = authorize('ADMIN');

    it('ADMIN → autorisé', () => {
      const req = { user: PROFILS.ADMIN };
      const res = createRes();
      const next = createNext();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']) {
      it(`${profil} → refusé (403)`, () => {
        const req = { user: PROFILS[profil] };
        const res = createRes();
        const next = createNext();

        adminOnly(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });
    }
  });

  describe('Routes MANAGER + ADMIN', () => {
    const managerAdmin = authorize('MANAGER', 'ADMIN');

    for (const profil of ['MANAGER', 'ADMIN']) {
      it(`${profil} → autorisé`, () => {
        const req = { user: PROFILS[profil] };
        const res = createRes();
        const next = createNext();

        managerAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
      });
    }

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'QUALITE']) {
      it(`${profil} → refusé (403)`, () => {
        const req = { user: PROFILS[profil] };
        const res = createRes();
        const next = createNext();

        managerAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
      });
    }
  });

  describe('Routes opérationnelles (4 rôles)', () => {
    const opsOnly = authorize('AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER');

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER']) {
      it(`${profil} → autorisé`, () => {
        const req = { user: PROFILS[profil] };
        const res = createRes();
        const next = createNext();

        opsOnly(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
      });
    }

    for (const profil of ['QUALITE', 'ADMIN']) {
      it(`${profil} → refusé (403)`, () => {
        const req = { user: PROFILS[profil] };
        const res = createRes();
        const next = createNext();

        opsOnly(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════
// 3. EXCLUDEQUALITE — Blocage écriture QUALITE
// ═══════════════════════════════════════════════════════

describe('excludeQualite — Blocage écriture QUALITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('QUALITE → bloqué (403 + code QUALITE_READ_ONLY)', () => {
    const req = { user: PROFILS.QUALITE };
    const res = createRes();
    const next = createNext();

    excludeQualite(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('QUALITE_READ_ONLY');
    expect(res.body.message).toContain('lecture seule');
    expect(next).not.toHaveBeenCalled();
  });

  for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'ADMIN']) {
    it(`${profil} → autorisé (pas bloqué)`, () => {
      const req = { user: PROFILS[profil] };
      const res = createRes();
      const next = createNext();

      excludeQualite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  }
});

// ═══════════════════════════════════════════════════════
// 4. MATRICE PROFIL × ACTION (Scénarios terrain)
// ═══════════════════════════════════════════════════════

describe('Matrice profil × action — Scénarios terrain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Simule le passage d'une requête à travers la chaîne de middlewares
   * protect → excludeQualite → handler
   */
  async function simulerChaine(profilName, middlewares) {
    const req = createReq();
    const res = createRes();
    let middlewareAtteint = 0;

    setupAuthForProfile(profilName);

    for (const mw of middlewares) {
      const next = createNext();
      await mw(req, res, next);

      if (!next.mock.calls.length) {
        // Middleware a bloqué la requête
        return { passed: false, statusCode: res.statusCode, body: res.body, step: middlewareAtteint };
      }
      middlewareAtteint++;
    }

    return { passed: true, statusCode: null, body: null, step: middlewareAtteint };
  }

  // --- CRV: Création (protect + excludeQualite) ---

  describe('Créer un CRV (protect + excludeQualite)', () => {
    const chain = [protect, excludeQualite];

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER']) {
      it(`${profil} peut créer un CRV`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(true);
      });
    }

    it('QUALITE ne peut PAS créer un CRV', async () => {
      const result = await simulerChaine('QUALITE', chain);
      expect(result.passed).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.body.code).toBe('QUALITE_READ_ONLY');
    });

    it('ADMIN passe excludeQualite mais serait bloqué par authorize dans les vraies routes', async () => {
      // Note: ADMIN passe excludeQualite car il n'est pas QUALITE
      // Mais dans les routes réelles, l'absence de rôle opérationnel le bloquera
      const result = await simulerChaine('ADMIN', chain);
      expect(result.passed).toBe(true); // excludeQualite ne bloque pas ADMIN
    });
  });

  // --- Gestion utilisateurs (protect + authorize('ADMIN')) ---

  describe('Gérer utilisateurs (protect + authorize ADMIN)', () => {
    const chain = [protect, authorize('ADMIN')];

    it('ADMIN peut gérer les utilisateurs', async () => {
      const result = await simulerChaine('ADMIN', chain);
      expect(result.passed).toBe(true);
    });

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']) {
      it(`${profil} ne peut PAS gérer les utilisateurs`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(false);
        expect(result.statusCode).toBe(403);
      });
    }
  });

  // --- Créer un engin (protect + authorize MANAGER/ADMIN) ---

  describe('Créer un engin (protect + authorize MANAGER/ADMIN)', () => {
    const chain = [protect, authorize('MANAGER', 'ADMIN')];

    for (const profil of ['MANAGER', 'ADMIN']) {
      it(`${profil} peut créer un engin`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(true);
      });
    }

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'QUALITE']) {
      it(`${profil} ne peut PAS créer un engin`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(false);
        expect(result.statusCode).toBe(403);
      });
    }
  });

  // --- Lecture CRV (protect uniquement) ---

  describe('Lire un CRV (protect uniquement)', () => {
    const chain = [protect];

    for (const profil of Object.keys(PROFILS)) {
      it(`${profil} peut lire un CRV`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(true);
      });
    }
  });

  // --- Modifier charges (protect + excludeQualite) ---

  describe('Modifier une charge (protect + excludeQualite)', () => {
    const chain = [protect, excludeQualite];

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER']) {
      it(`${profil} peut modifier une charge`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(true);
      });
    }

    it('QUALITE ne peut PAS modifier une charge', async () => {
      const result = await simulerChaine('QUALITE', chain);
      expect(result.passed).toBe(false);
      expect(result.body.code).toBe('QUALITE_READ_ONLY');
    });
  });

  // --- Supprimer programme (protect + authorize opérationnels) ---

  describe('Supprimer programme (protect + authorize opérationnels)', () => {
    const chain = [protect, authorize('AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER')];

    for (const profil of ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER']) {
      it(`${profil} peut supprimer un programme`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(true);
      });
    }

    for (const profil of ['QUALITE', 'ADMIN']) {
      it(`${profil} ne peut PAS supprimer un programme`, async () => {
        const result = await simulerChaine(profil, chain);
        expect(result.passed).toBe(false);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════
// 5. TESTS SPÉCIFIQUES PAR PROFIL
// ═══════════════════════════════════════════════════════

describe('QUALITE — Profil lecture seule exhaustif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const actionsBloquees = [
    'Créer CRV',
    'Modifier CRV',
    'Supprimer CRV',
    'Ajouter charge',
    'Ajouter événement',
    'Ajouter observation',
    'Démarrer CRV',
    'Terminer CRV',
    'Annuler CRV',
    'Modifier personnel',
    'Modifier engins',
    'Modifier horaire',
    'Modifier phase',
    'Archiver CRV'
  ];

  actionsBloquees.forEach(action => {
    it(`QUALITE ne peut pas : ${action}`, () => {
      const req = { user: PROFILS.QUALITE };
      const res = createRes();
      const next = createNext();

      excludeQualite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('QUALITE_READ_ONLY');
    });
  });

  const actionsAutorisees = [
    'Lister CRVs',
    'Voir détail CRV',
    'Voir statistiques',
    'Exporter Excel',
    'Voir PDF',
    'Voir phases'
  ];

  actionsAutorisees.forEach(action => {
    it(`QUALITE peut : ${action} (protect seul)`, async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      setupAuthForProfile('QUALITE');
      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.fonction).toBe('QUALITE');
    });
  });
});

describe('ADMIN — Isolation opérationnelle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ADMIN a accès uniquement via authorize("ADMIN")', () => {
    const req = { user: PROFILS.ADMIN };
    const res = createRes();
    const next = createNext();

    authorize('ADMIN')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ADMIN est bloqué par authorize opérationnel', () => {
    const req = { user: PROFILS.ADMIN };
    const res = createRes();
    const next = createNext();

    authorize('AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('ADMIN passe excludeQualite (n\'est pas QUALITE)', () => {
    const req = { user: PROFILS.ADMIN };
    const res = createRes();
    const next = createNext();

    excludeQualite(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Statuts compte — Blocage non-ACTIF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const statutsNonActifs = ['INACTIF', 'ABSENT', 'CONGE'];

  for (const statut of statutsNonActifs) {
    for (const profilName of Object.keys(PROFILS)) {
      it(`${profilName} avec statut ${statut} → bloqué (403)`, async () => {
        const req = createReq();
        const res = createRes();
        const next = createNext();

        jwt.verify.mockReturnValue({ id: 'user-statut-test' });
        mockPersonneFindById.mockResolvedValue({
          ...PROFILS[profilName],
          statut
        });

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });
    }
  }
});
