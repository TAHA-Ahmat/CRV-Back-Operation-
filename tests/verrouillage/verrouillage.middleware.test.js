import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mission 009 — Tests Verrouillage Middleware
 *
 * Tests unitaires pour les middlewares de verrouillage créés dans
 * verrouillage.middleware.js (companion de businessRules.middleware.js zone rouge).
 *
 * Couvre :
 * - verifierCRVNonVerrouilleViaCharge : résolution charge → CRV → statut
 * - verifierCRVNonVerrouilleViaPhase : résolution phase → CRV → statut
 * - Scénarios terrain (charge sur CRV verrouillé, phase sur CRV verrouillé, etc.)
 */

// ═══════════════════════════════════════════════════════
// MOCKS — Modèles Mongoose
// ═══════════════════════════════════════════════════════

const mockCRV = {
  findById: vi.fn()
};
const mockChargeOperationnelle = {
  findById: vi.fn()
};
const mockChronologiePhase = {
  findById: vi.fn()
};

vi.mock('../../src/models/crv/CRV.js', () => ({
  default: mockCRV
}));
vi.mock('../../src/models/charges/ChargeOperationnelle.js', () => ({
  default: mockChargeOperationnelle
}));
vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: mockChronologiePhase
}));

// Import APRÈS les mocks
const { verifierCRVNonVerrouilleViaCharge, verifierCRVNonVerrouilleViaPhase } = await import('../../src/middlewares/verrouillage.middleware.js');

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function createMockReq(params = {}) {
  return { params };
}

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status: vi.fn(function (code) { res.statusCode = code; return res; }),
    json: vi.fn(function (data) { res.body = data; return res; })
  };
  return res;
}

function createMockNext() {
  return vi.fn();
}

// ═══════════════════════════════════════════════════════
// 1. verifierCRVNonVerrouilleViaCharge
// ═══════════════════════════════════════════════════════

describe('verifierCRVNonVerrouilleViaCharge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passe au next si pas de chargeId', async () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = createMockNext();

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retourne 404 si charge non trouvée', async () => {
    const req = createMockReq({ id: 'charge-inexistante' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue(null);

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toContain('Charge opérationnelle non trouvée');
    expect(next).not.toHaveBeenCalled();
  });

  it('retourne 404 si CRV associé non trouvé', async () => {
    const req = createMockReq({ id: 'charge-123' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({ _id: 'charge-123', crv: 'crv-inexistant' });
    mockCRV.findById.mockResolvedValue(null);

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toContain('CRV associé à la charge non trouvé');
    expect(next).not.toHaveBeenCalled();
  });

  it('retourne 403 si CRV est VERROUILLE', async () => {
    const req = createMockReq({ id: 'charge-123' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({ _id: 'charge-123', crv: 'crv-verrouille' });
    mockCRV.findById.mockResolvedValue({ _id: 'crv-verrouille', statut: 'VERROUILLE' });

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('CRV_VERROUILLE');
    expect(next).not.toHaveBeenCalled();
  });

  it('passe au next si CRV est EN_COURS', async () => {
    const req = createMockReq({ id: 'charge-123' });
    const res = createMockRes();
    const next = createMockNext();

    const mockCharge = { _id: 'charge-123', crv: 'crv-encours' };
    const mockCrvDoc = { _id: 'crv-encours', statut: 'EN_COURS' };

    mockChargeOperationnelle.findById.mockResolvedValue(mockCharge);
    mockCRV.findById.mockResolvedValue(mockCrvDoc);

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.crv).toBe(mockCrvDoc);
    expect(req.charge).toBe(mockCharge);
  });

  it('passe au next si CRV est TERMINE', async () => {
    const req = createMockReq({ id: 'charge-456' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({ _id: 'charge-456', crv: 'crv-termine' });
    mockCRV.findById.mockResolvedValue({ _id: 'crv-termine', statut: 'TERMINE' });

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passe au next si CRV est VALIDE', async () => {
    const req = createMockReq({ id: 'charge-789' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({ _id: 'charge-789', crv: 'crv-valide' });
    mockCRV.findById.mockResolvedValue({ _id: 'crv-valide', statut: 'VALIDE' });

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('propage les erreurs via next(error)', async () => {
    const req = createMockReq({ id: 'charge-err' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockRejectedValue(new Error('DB Error'));

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ═══════════════════════════════════════════════════════
// 2. verifierCRVNonVerrouilleViaPhase
// ═══════════════════════════════════════════════════════

describe('verifierCRVNonVerrouilleViaPhase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Cas 1 : Route avec crvId dans les params ---

  it('Cas crvId — retourne 404 si CRV non trouvé', async () => {
    const req = createMockReq({ crvId: 'crv-inexistant' });
    const res = createMockRes();
    const next = createMockNext();

    mockCRV.findById.mockResolvedValue(null);

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toContain('CRV non trouvé');
  });

  it('Cas crvId — retourne 403 si CRV VERROUILLE', async () => {
    const req = createMockReq({ crvId: 'crv-verrouille' });
    const res = createMockRes();
    const next = createMockNext();

    mockCRV.findById.mockResolvedValue({ _id: 'crv-verrouille', statut: 'VERROUILLE' });

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('CRV_VERROUILLE');
  });

  it('Cas crvId — passe au next si CRV EN_COURS', async () => {
    const req = createMockReq({ crvId: 'crv-encours' });
    const res = createMockRes();
    const next = createMockNext();

    const mockCrvDoc = { _id: 'crv-encours', statut: 'EN_COURS' };
    mockCRV.findById.mockResolvedValue(mockCrvDoc);

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.crv).toBe(mockCrvDoc);
  });

  // --- Cas 2 : Route avec :id (chronoPhase ID) ---

  it('Cas phaseId — passe au next si pas de phaseId ni crvId', async () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = createMockNext();

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('Cas phaseId — retourne 404 si phase non trouvée', async () => {
    const req = createMockReq({ id: 'phase-inexistante' });
    const res = createMockRes();
    const next = createMockNext();

    mockChronologiePhase.findById.mockResolvedValue(null);

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toContain('Phase non trouvée');
  });

  it('Cas phaseId — retourne 404 si CRV associé non trouvé', async () => {
    const req = createMockReq({ id: 'phase-orpheline' });
    const res = createMockRes();
    const next = createMockNext();

    mockChronologiePhase.findById.mockResolvedValue({ _id: 'phase-orpheline', crv: 'crv-inexistant' });
    mockCRV.findById.mockResolvedValue(null);

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toContain('CRV associé à la phase non trouvé');
  });

  it('Cas phaseId — retourne 403 si CRV VERROUILLE', async () => {
    const req = createMockReq({ id: 'phase-verrouille' });
    const res = createMockRes();
    const next = createMockNext();

    mockChronologiePhase.findById.mockResolvedValue({ _id: 'phase-verrouille', crv: 'crv-locked' });
    mockCRV.findById.mockResolvedValue({ _id: 'crv-locked', statut: 'VERROUILLE' });

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('CRV_VERROUILLE');
  });

  it('Cas phaseId — passe au next si CRV TERMINE', async () => {
    const req = createMockReq({ id: 'phase-ok' });
    const res = createMockRes();
    const next = createMockNext();

    const mockCrvDoc = { _id: 'crv-termine', statut: 'TERMINE' };
    mockChronologiePhase.findById.mockResolvedValue({ _id: 'phase-ok', crv: 'crv-termine' });
    mockCRV.findById.mockResolvedValue(mockCrvDoc);

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.crv).toBe(mockCrvDoc);
  });

  it('propage les erreurs via next(error)', async () => {
    const req = createMockReq({ id: 'phase-err' });
    const res = createMockRes();
    const next = createMockNext();

    mockChronologiePhase.findById.mockRejectedValue(new Error('DB Error'));

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ═══════════════════════════════════════════════════════
// 3. Scénarios terrain réels
// ═══════════════════════════════════════════════════════

describe('Scénarios terrain verrouillage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SCENARIO 1 : Agent modifie fret sur CRV VERROUILLE → BLOQUÉ', async () => {
    // L'agent essaie de modifier le fret d'un CRV déjà validé et verrouillé
    const req = createMockReq({ id: 'charge-fret-001' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({
      _id: 'charge-fret-001',
      crv: 'crv-valide-verrouille',
      typeCharge: 'FRET'
    });
    mockCRV.findById.mockResolvedValue({
      _id: 'crv-valide-verrouille',
      statut: 'VERROUILLE',
      archivage: { archivedAt: new Date() }
    });

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('CRV_VERROUILLE');
    expect(next).not.toHaveBeenCalled();
  });

  it('SCENARIO 2 : Agent met à jour phase sur CRV EN_COURS → OK', async () => {
    const req = createMockReq({ crvId: 'crv-actif', phaseId: 'phase-calage' });
    const res = createMockRes();
    const next = createMockNext();

    mockCRV.findById.mockResolvedValue({
      _id: 'crv-actif',
      statut: 'EN_COURS'
    });

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('SCENARIO 3 : Superviseur modifie phase sur CRV VERROUILLE → BLOQUÉ', async () => {
    const req = createMockReq({ crvId: 'crv-locked', phaseId: 'phase-debarq' });
    const res = createMockRes();
    const next = createMockNext();

    mockCRV.findById.mockResolvedValue({
      _id: 'crv-locked',
      statut: 'VERROUILLE'
    });

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.code).toBe('CRV_VERROUILLE');
    expect(next).not.toHaveBeenCalled();
  });

  it('SCENARIO 4 : Agent démarre phase sur CRV VALIDE → OK (pas encore verrouillé)', async () => {
    const req = createMockReq({ id: 'phase-embarq' });
    const res = createMockRes();
    const next = createMockNext();

    mockChronologiePhase.findById.mockResolvedValue({ _id: 'phase-embarq', crv: 'crv-valide' });
    mockCRV.findById.mockResolvedValue({
      _id: 'crv-valide',
      statut: 'VALIDE'
    });

    await verifierCRVNonVerrouilleViaPhase(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('SCENARIO 5 : Agent ajoute passagers sur CRV BROUILLON → OK', async () => {
    const req = createMockReq({ id: 'charge-pax-001' });
    const res = createMockRes();
    const next = createMockNext();

    mockChargeOperationnelle.findById.mockResolvedValue({
      _id: 'charge-pax-001',
      crv: 'crv-brouillon',
      typeCharge: 'PASSAGERS'
    });
    mockCRV.findById.mockResolvedValue({
      _id: 'crv-brouillon',
      statut: 'BROUILLON'
    });

    await verifierCRVNonVerrouilleViaCharge(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
