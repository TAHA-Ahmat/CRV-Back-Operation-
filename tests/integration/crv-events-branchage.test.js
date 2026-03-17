/**
 * Tests — Branchage logCRVEvent dans les contrôleurs CRV lifecycle
 *
 * ÉTAT ACTUEL (P2_CRVEVENT_INTEGRATION_001) :
 * Les contrôleurs CRV lifecycle (crv.controller.js, validation.controller.js,
 * annulation.controller.js) N'APPELLENT PAS logCRVEvent.
 * Ces fichiers sont en ZONE ROUGE — modification interdite sans instruction humaine.
 *
 * Les événements lifecycle (CRV_CREATED, CRV_TERMINATED, CRV_VALIDATED,
 * CRV_LOCKED, CRV_UNLOCKED, CRV_CANCELLED, CRV_REACTIVATED) ne sont donc
 * PAS encore journalisés. Seuls les événements sous-ressources (5 wrappers)
 * le sont — voir subresource-events-branchage.test.js.
 *
 * Ces tests sont marqués .skip jusqu'à l'implémentation du logging lifecycle.
 * Structure conservée pour réactivation future.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// ============================================================
// MOCKS — Modèles et services
// ============================================================

// Mock logCRVEvent AVANT tout import de contrôleur
const mockLogCRVEvent = vi.fn().mockResolvedValue({ _id: 'event-id' });
vi.mock('../../src/services/crv/crvEvent.service.js', () => ({
  logCRVEvent: mockLogCRVEvent,
  default: { logCRVEvent: mockLogCRVEvent },
}));

// Mock CRV model
const fakeCrvId = new mongoose.Types.ObjectId();
const fakeCrv = {
  _id: fakeCrvId,
  numeroCRV: 'CRV-2026-001',
  statut: 'BROUILLON',
  vol: new mongoose.Types.ObjectId(),
  creePar: new mongoose.Types.ObjectId(),
  modifiePar: null,
  completude: 85,
  crvDoublon: false,
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../../src/models/crv/CRV.js', () => {
  const findById = vi.fn();
  const create = vi.fn();
  return {
    default: { findById, create, find: vi.fn() },
    __findById: findById,
    __create: create,
  };
});

vi.mock('../../src/models/flights/Vol.js', () => ({
  default: { findById: vi.fn(), create: vi.fn(), countDocuments: vi.fn() },
}));

vi.mock('../../src/models/phases/Horaire.js', () => ({
  default: { create: vi.fn(), findById: vi.fn() },
}));

vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: { find: vi.fn().mockReturnValue({ populate: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue([]) }) }), create: vi.fn() },
}));

vi.mock('../../src/models/charges/ChargeOperationnelle.js', () => ({
  default: {},
}));

vi.mock('../../src/models/transversal/EvenementOperationnel.js', () => ({
  default: {},
}));

vi.mock('../../src/models/crv/Observation.js', () => ({
  default: {},
}));

vi.mock('../../src/models/validation/ValidationCRV.js', () => ({
  default: { findById: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn() },
}));

vi.mock('../../src/services/crv/crv.service.js', () => ({
  genererNumeroCRV: vi.fn().mockResolvedValue('CRV-2026-001'),
  calculerCompletude: vi.fn().mockResolvedValue(85),
  updateCompletude: vi.fn().mockResolvedValue(true),
  detecterDoublonCRV: vi.fn().mockResolvedValue(null),
  creerVolDepuisMouvement: vi.fn(),
}));

vi.mock('../../src/services/phases/phase.service.js', () => ({
  initialiserPhasesVol: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/services/notifications/notificationEngine.js', () => ({
  eventBus: { emitAsync: vi.fn() },
}));

vi.mock('../../src/services/notifications/eventRegistry.js', () => ({
  EVENTS: { CRV_TERMINE: 'CRV_TERMINE', CRV_PRET_VALIDATION: 'CRV_PRET_VALIDATION' },
}));

vi.mock('../../src/services/validation/validation.service.js', () => ({
  validerCRV: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() }),
  deverrouillerCRV: vi.fn().mockResolvedValue(true),
  verrouillerCRV: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/services/notifications/notification.service.js', () => ({
  notifierValidationCRV: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/services/crv/annulation.service.js', () => ({
  annulerCRV: vi.fn().mockResolvedValue({ _id: fakeCrvId, statut: 'ANNULE' }),
  reactiverCRV: vi.fn().mockResolvedValue({ _id: fakeCrvId, statut: 'EN_COURS' }),
  default: {
    annulerCRV: vi.fn().mockResolvedValue({ _id: fakeCrvId, statut: 'ANNULE' }),
    reactiverCRV: vi.fn().mockResolvedValue({ _id: fakeCrvId, statut: 'EN_COURS' }),
  },
}));

// ============================================================
// Helpers — mock req/res/next
// ============================================================

function mockReq(overrides = {}) {
  return {
    params: { id: fakeCrvId.toString() },
    body: {},
    user: { _id: new mongoose.Types.ObjectId(), fonction: 'SUPERVISEUR' },
    ...overrides,
  };
}

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status: vi.fn(function (code) { res.statusCode = code; return res; }),
    json: vi.fn(function (data) { res.body = data; return res; }),
  };
  return res;
}

const mockNext = vi.fn();

// ============================================================
// TESTS — Contrôleurs CRV (crv.controller.js)
// ============================================================

describe('crv.controller.js — logCRVEvent branchage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('CRV_CREATED — logCRVEvent appelé après création CRV [NON IMPLÉMENTÉ — zone rouge]', async () => {
    // Setup : simuler le path legacy (le plus simple pour tester)
    const CRVModel = (await import('../../src/models/crv/CRV.js'));
    const VolModel = (await import('../../src/models/flights/Vol.js'));
    const HoraireModel = (await import('../../src/models/phases/Horaire.js'));

    const fakeVol = {
      _id: new mongoose.Types.ObjectId(),
      typeOperation: 'DEPART',
      numeroVol: 'AF001',
    };

    VolModel.default.countDocuments.mockResolvedValueOnce(0);
    VolModel.default.create.mockResolvedValueOnce(fakeVol);
    HoraireModel.default.create.mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId(), vol: fakeVol._id });

    const createdCrv = { ...fakeCrv, vol: fakeVol._id };
    CRVModel.__create.mockResolvedValueOnce(createdCrv);
    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(createdCrv),
            }),
          }),
        }),
      }),
    });

    const { creerCRV } = await import('../../src/controllers/crv/crv.controller.js');

    const req = mockReq({ body: { type: 'depart' } });
    const res = mockRes();

    await creerCRV(req, res, mockNext);

    // Vérifier que logCRVEvent a été appelé avec CRV_CREATED
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      createdCrv._id,
      'CRV_CREATED',
      req.user._id,
      expect.objectContaining({
        numeroCRV: 'CRV-2026-001',
        statut: 'BROUILLON',
        path: 'legacy',
      })
    );
  });

  it.skip('CRV_TERMINATED — logCRVEvent appelé après terminaison CRV [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const CRVModel = (await import('../../src/models/crv/CRV.js'));

    // Mock mongoose session
    const mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn().mockResolvedValue(true),
      abortTransaction: vi.fn().mockResolvedValue(true),
      endSession: vi.fn(),
    };
    vi.spyOn(mongoose, 'startSession').mockResolvedValueOnce(mockSession);

    const crvTerminable = {
      ...fakeCrv,
      statut: 'EN_COURS',
      save: vi.fn().mockResolvedValue(true),
    };

    // findById with session chain
    CRVModel.__findById.mockReturnValueOnce({
      session: vi.fn().mockResolvedValue(crvTerminable),
    });

    // ChronologiePhase.find for phases check
    const ChronoModel = (await import('../../src/models/phases/ChronologiePhase.js'));
    ChronoModel.default.find.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([]),
      }),
    });

    // Vol.findById for sync
    const VolModel = (await import('../../src/models/flights/Vol.js'));
    VolModel.default.findById.mockReturnValueOnce({
      session: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        statut: 'EN_COURS',
        save: vi.fn().mockResolvedValue(true),
      }),
    });

    // CRV.findById for populate after commit
    const crvUpdated = { ...crvTerminable, statut: 'TERMINE', completude: 85 };
    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(crvUpdated),
          }),
        }),
      }),
    });

    const { terminerCRV } = await import('../../src/controllers/crv/crv.controller.js');

    const req = mockReq();
    const res = mockRes();

    await terminerCRV(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      crvTerminable._id,
      'CRV_TERMINATED',
      req.user._id,
      expect.objectContaining({
        fromStatus: 'EN_COURS',
        toStatus: 'TERMINE',
      })
    );
  });
});

// ============================================================
// TESTS — Contrôleur validation (validation.controller.js)
// ============================================================

describe('validation.controller.js — logCRVEvent branchage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('CRV_VALIDATED — logCRVEvent appelé après validation [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const ValidationModel = (await import('../../src/models/validation/ValidationCRV.js'));
    const CRVModel = (await import('../../src/models/crv/CRV.js'));

    ValidationModel.default.findById.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({ _id: 'val-1', crv: fakeCrvId }),
        }),
      }),
    });

    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: fakeCrvId, creePar: { email: 'test@crv.test' },
        }),
      }),
    });

    const { validerCRVController } = await import('../../src/controllers/validation/validation.controller.js');

    const req = mockReq({ body: { commentaires: 'RAS' } });
    const res = mockRes();

    await validerCRVController(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CRV_VALIDATED',
      req.user._id,
      expect.objectContaining({
        fromStatus: 'TERMINE',
        toStatus: 'VALIDE',
        commentaires: 'RAS',
      })
    );
  });

  it.skip('CRV_LOCKED — logCRVEvent appelé après verrouillage [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const CRVModel = (await import('../../src/models/crv/CRV.js'));

    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue({ _id: fakeCrvId, statut: 'VERROUILLE' }),
            }),
          }),
        }),
      }),
    });

    const { verrouillerCRVController } = await import('../../src/controllers/validation/validation.controller.js');

    const req = mockReq();
    const res = mockRes();

    await verrouillerCRVController(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CRV_LOCKED',
      req.user._id,
      expect.objectContaining({
        fromStatus: 'VALIDE',
        toStatus: 'VERROUILLE',
      })
    );
  });

  it.skip('CRV_UNLOCKED — logCRVEvent appelé après déverrouillage [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const { deverrouillerCRVController } = await import('../../src/controllers/validation/validation.controller.js');

    const req = mockReq({ body: { raison: 'Correction nécessaire' } });
    const res = mockRes();

    await deverrouillerCRVController(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CRV_UNLOCKED',
      req.user._id,
      expect.objectContaining({
        fromStatus: 'VERROUILLE',
        toStatus: 'VALIDE',
        raison: 'Correction nécessaire',
      })
    );
  });
});

// ============================================================
// TESTS — Contrôleur annulation (annulation.controller.js)
// ============================================================

describe('annulation.controller.js — logCRVEvent branchage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('CRV_CANCELLED — logCRVEvent appelé après annulation [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const { annulerCRV } = await import('../../src/controllers/crv/annulation.controller.js');

    const req = mockReq({
      body: { raisonAnnulation: 'Vol annulé par compagnie' },
    });
    const res = mockRes();

    await annulerCRV(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CRV_CANCELLED',
      req.user._id,
      expect.objectContaining({
        toStatus: 'ANNULE',
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it.skip('CRV_REACTIVATED — logCRVEvent appelé après réactivation [NON IMPLÉMENTÉ — zone rouge]', async () => {
    const { reactiverCRV } = await import('../../src/controllers/crv/annulation.controller.js');

    const req = mockReq();
    const res = mockRes();

    await reactiverCRV(req, res, mockNext);

    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CRV_REACTIVATED',
      req.user._id,
      expect.objectContaining({
        fromStatus: 'ANNULE',
      })
    );
    expect(res.statusCode).toBe(200);
  });
});

// ============================================================
// TEST — Non-régression : logCRVEvent fire-and-forget
// ============================================================

describe('logCRVEvent — non-bloquant (fire and forget)', () => {
  it.skip('Si logCRVEvent rejette, le contrôleur ne crash pas [NON IMPLÉMENTÉ — zone rouge]', async () => {
    mockLogCRVEvent.mockRejectedValueOnce(new Error('DB down'));

    const { annulerCRV } = await import('../../src/controllers/crv/annulation.controller.js');

    const req = mockReq({
      body: { raisonAnnulation: 'Test rejet' },
    });
    const res = mockRes();

    // Ne doit PAS throw
    await annulerCRV(req, res, mockNext);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
