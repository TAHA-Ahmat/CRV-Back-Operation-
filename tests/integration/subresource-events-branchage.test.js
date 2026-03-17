/**
 * Tests RÉELS — Branchage logCRVEvent pour sous-ressources CRV
 *
 * Vérifie que chaque WRAPPER appelle logCRVEvent avec les bons paramètres.
 * Les wrappers (et non les contrôleurs de base) sont responsables du logging.
 *
 * 5 wrappers testés :
 *   1. crvEvenementsController  → INCIDENT_REPORTED
 *   2. crvObservationsController → OBSERVATION_ADDED
 *   3. crvChargesController     → CHARGE_ADDED
 *   4. crvPersonnelController   → PERSONNEL_ADDED, PERSONNEL_REMOVED
 *   5. crvEnginsController      → ENGIN_ASSIGNED, ENGIN_REMOVED, ENGINS_UPDATED
 *
 * Stratégie : mock des modèles Mongoose + mock de crvEvent.service.js
 * pour capturer les appels à logCRVEvent sans base de données.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// ============================================================
// MOCKS — Modèles et services
// ============================================================

const mockLogCRVEvent = vi.fn().mockResolvedValue({ _id: 'event-id' });
vi.mock('../../src/services/crv/crvEvent.service.js', () => ({
  logCRVEvent: mockLogCRVEvent,
  default: { logCRVEvent: mockLogCRVEvent },
}));

const fakeCrvId = new mongoose.Types.ObjectId();
const fakeUserId = new mongoose.Types.ObjectId();
const fakeVolId = new mongoose.Types.ObjectId();

const fakeCrv = {
  _id: fakeCrvId,
  numeroCRV: 'CRV-2026-001',
  statut: 'EN_COURS',
  vol: { _id: fakeVolId },
  creePar: fakeUserId,
  modifiePar: null,
  completude: 85,
  personnelAffecte: [],
  save: vi.fn().mockResolvedValue(true),
};

// Mock CRV model
vi.mock('../../src/models/crv/CRV.js', () => {
  const findById = vi.fn();
  return {
    default: { findById, create: vi.fn(), find: vi.fn() },
    __findById: findById,
  };
});

// Mock EvenementOperationnel
const mockEvenementCreate = vi.fn();
vi.mock('../../src/models/transversal/EvenementOperationnel.js', () => ({
  default: { create: mockEvenementCreate },
}));

// Mock Observation
const mockObservationCreate = vi.fn();
vi.mock('../../src/models/crv/Observation.js', () => ({
  default: { create: mockObservationCreate },
}));

// Mock ChargeOperationnelle
const mockChargeCreate = vi.fn();
vi.mock('../../src/models/charges/ChargeOperationnelle.js', () => ({
  default: { create: mockChargeCreate },
}));

// Mock AffectationEnginVol
const mockAffectationCreate = vi.fn();
const mockAffectationFind = vi.fn();
const mockAffectationDeleteMany = vi.fn();
const mockAffectationFindById = vi.fn();
const mockAffectationCountDocuments = vi.fn();
vi.mock('../../src/models/resources/AffectationEnginVol.js', () => ({
  default: {
    create: mockAffectationCreate,
    find: mockAffectationFind,
    deleteMany: mockAffectationDeleteMany,
    findById: mockAffectationFindById,
    countDocuments: mockAffectationCountDocuments,
  },
}));

// Mock Engin
vi.mock('../../src/models/resources/Engin.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock Vol
vi.mock('../../src/models/flights/Vol.js', () => ({
  default: { findById: vi.fn(), create: vi.fn(), countDocuments: vi.fn() },
}));

// Mock Horaire
vi.mock('../../src/models/phases/Horaire.js', () => ({
  default: { create: vi.fn(), findById: vi.fn() },
}));

// Mock ChronologiePhase
vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue([]) }),
    }),
    create: vi.fn(),
  },
}));

// Mock ValidationCRV
vi.mock('../../src/models/validation/ValidationCRV.js', () => ({
  default: { findById: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn() },
}));

// Mock services
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
  EVENTS: {
    CRV_TERMINE: 'CRV_TERMINE',
    CRV_PRET_VALIDATION: 'CRV_PRET_VALIDATION',
    CRV_INCIDENT_CRITIQUE: 'CRV_INCIDENT_CRITIQUE',
    CRV_EVENEMENT_AJOUTE: 'CRV_EVENEMENT_AJOUTE',
  },
}));

vi.mock('../../src/services/validation/validation.service.js', () => ({
  validerCRV: vi.fn(),
  deverrouillerCRV: vi.fn(),
  verrouillerCRV: vi.fn(),
}));

vi.mock('../../src/services/notifications/notification.service.js', () => ({
  notifierValidationCRV: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/services/crv/annulation.service.js', () => ({
  annulerCRV: vi.fn(),
  reactiverCRV: vi.fn(),
  default: { annulerCRV: vi.fn(), reactiverCRV: vi.fn() },
}));

// ============================================================
// Helpers
// ============================================================

function mockReq(overrides = {}) {
  return {
    params: { id: fakeCrvId.toString() },
    body: {},
    user: { _id: fakeUserId, fonction: 'SUPERVISEUR' },
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
// TESTS — INCIDENT_REPORTED (crvEvenementsController wrapper)
// ============================================================

describe('INCIDENT_REPORTED — crvEvenementsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logCRVEvent(INCIDENT_REPORTED) appelé après ajout événement', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockResolvedValueOnce({ ...fakeCrv });

    const fakeEvenement = {
      _id: new mongoose.Types.ObjectId(),
      typeEvenement: 'INCIDENT_SECURITE',
      gravite: 'MAJEURE',
      description: 'Collision chariot',
      statut: 'OUVERT',
    };
    mockEvenementCreate.mockResolvedValueOnce(fakeEvenement);

    // Import depuis le WRAPPER (pas crv.controller.js)
    const { ajouterEvenement } = await import('../../src/controllers/crv/crvEvenementsController.js');

    const req = mockReq({
      body: {
        typeEvenement: 'INCIDENT_SECURITE',
        gravite: 'MAJEURE',
        description: 'Collision chariot',
      },
    });
    const res = mockRes();

    await ajouterEvenement(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),  // req.params.id est un string
      'INCIDENT_REPORTED',
      fakeUserId,
      expect.objectContaining({
        evenementId: fakeEvenement._id,
        typeEvenement: 'INCIDENT_SECURITE',
        gravite: 'MAJEURE',
        description: 'Collision chariot',
      })
    );
  });

  it('INCIDENT_REPORTED non émis si CRV non trouvé (404)', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockResolvedValueOnce(null);

    const { ajouterEvenement } = await import('../../src/controllers/crv/crvEvenementsController.js');

    const req = mockReq({ body: { typeEvenement: 'RETARD', gravite: 'MINEURE', description: 'test' } });
    const res = mockRes();

    await ajouterEvenement(req, res, mockNext);

    expect(res.statusCode).toBe(404);
    expect(mockLogCRVEvent).not.toHaveBeenCalled();
  });
});

// ============================================================
// TESTS — OBSERVATION_ADDED (crvObservationsController wrapper)
// ============================================================

describe('OBSERVATION_ADDED — crvObservationsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logCRVEvent(OBSERVATION_ADDED) appelé après ajout observation', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockResolvedValueOnce({ ...fakeCrv });

    const fakeObservation = {
      _id: new mongoose.Types.ObjectId(),
      categorie: 'SECURITE',
      contenu: 'Piste glissante après pluie',
    };
    mockObservationCreate.mockResolvedValueOnce(fakeObservation);

    const { ajouterObservation } = await import('../../src/controllers/crv/crvObservationsController.js');

    const req = mockReq({
      body: { categorie: 'SECURITE', contenu: 'Piste glissante après pluie' },
    });
    const res = mockRes();

    await ajouterObservation(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'OBSERVATION_ADDED',
      fakeUserId,
      expect.objectContaining({
        observationId: fakeObservation._id,
        categorie: 'SECURITE',
        contenu: 'Piste glissante après pluie',
      })
    );
  });
});

// ============================================================
// TESTS — CHARGE_ADDED (crvChargesController wrapper)
// ============================================================

describe('CHARGE_ADDED — crvChargesController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logCRVEvent(CHARGE_ADDED) appelé après ajout charge', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockResolvedValueOnce({ ...fakeCrv });

    const fakeCharge = {
      _id: new mongoose.Types.ObjectId(),
      typeCharge: 'PASSAGERS',
      sensOperation: 'EMBARQUEMENT',
    };
    mockChargeCreate.mockResolvedValueOnce(fakeCharge);

    const { ajouterCharge } = await import('../../src/controllers/crv/crvChargesController.js');

    const req = mockReq({
      body: { typeCharge: 'PASSAGERS', sensOperation: 'EMBARQUEMENT' },
    });
    const res = mockRes();

    await ajouterCharge(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'CHARGE_ADDED',
      fakeUserId,
      expect.objectContaining({
        chargeId: fakeCharge._id,
        typeCharge: 'PASSAGERS',
        sensOperation: 'EMBARQUEMENT',
      })
    );
  });
});

// ============================================================
// TESTS — PERSONNEL_ADDED / PERSONNEL_REMOVED (crvPersonnelController wrapper)
// ============================================================

describe('PERSONNEL_ADDED / PERSONNEL_REMOVED — crvPersonnelController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logCRVEvent(PERSONNEL_ADDED) appelé après ajout personne', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    const crvWithPersonnel = {
      ...fakeCrv,
      personnelAffecte: [],
      save: vi.fn().mockImplementation(function () {
        this.personnelAffecte.push({ nom: 'Dupont', prenom: 'Jean', fonction: 'AGENT' });
        return Promise.resolve(this);
      }),
    };
    crvWithPersonnel.personnelAffecte = [];
    CRVModel.__findById.mockResolvedValueOnce(crvWithPersonnel);

    // Import depuis le WRAPPER
    const { ajouterPersonnel } = await import('../../src/controllers/crv/crvPersonnelController.js');

    const req = mockReq({
      body: { nom: 'Dupont', prenom: 'Jean', fonction: 'AGENT' },
    });
    const res = mockRes();

    await ajouterPersonnel(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    // Le wrapper envoie { personne: {nom, prenom, fonction}, nbPersonnesTotal }
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'PERSONNEL_ADDED',
      fakeUserId,
      expect.objectContaining({
        personne: expect.objectContaining({
          nom: 'Dupont',
          prenom: 'Jean',
          fonction: 'AGENT',
        }),
      })
    );
  });

  it('logCRVEvent(PERSONNEL_REMOVED) appelé après suppression personne', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    const fakePersonneId = new mongoose.Types.ObjectId();
    const crvWithPersonnel = {
      ...fakeCrv,
      personnelAffecte: [{
        _id: fakePersonneId,
        nom: 'Martin',
        prenom: 'Paul',
        fonction: 'CHEF_EQUIPE',
        id: fakePersonneId.toString(),
      }],
      save: vi.fn().mockResolvedValue(true),
    };
    CRVModel.__findById.mockResolvedValueOnce(crvWithPersonnel);

    const { supprimerPersonnel } = await import('../../src/controllers/crv/crvPersonnelController.js');

    const req = mockReq({
      params: { id: fakeCrvId.toString(), personneId: fakePersonneId.toString() },
    });
    const res = mockRes();

    await supprimerPersonnel(req, res, mockNext);

    expect(res.statusCode).toBe(200);
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'PERSONNEL_REMOVED',
      fakeUserId,
      expect.objectContaining({
        personneId: fakePersonneId.toString(),
      })
    );
  });
});

// ============================================================
// TESTS — ENGIN_ASSIGNED / ENGIN_REMOVED / ENGINS_UPDATED (crvEnginsController wrapper)
// ============================================================

describe('ENGIN_ASSIGNED / ENGIN_REMOVED / ENGINS_UPDATED — crvEnginsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logCRVEvent(ENGIN_ASSIGNED) appelé après ajout engin', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({ ...fakeCrv }),
    });

    const fakeEnginId = new mongoose.Types.ObjectId();
    const fakeAffectation = {
      _id: new mongoose.Types.ObjectId(),
      vol: fakeVolId,
      engin: fakeEnginId,
      usage: 'TRACTAGE',
    };

    const EnginModel = await import('../../src/models/resources/Engin.js');
    EnginModel.default.findById.mockResolvedValueOnce({ _id: fakeEnginId, typeEngin: 'TRACTEUR' });

    mockAffectationCreate.mockResolvedValueOnce(fakeAffectation);
    mockAffectationFindById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({ ...fakeAffectation, engin: { _id: fakeEnginId, typeEngin: 'TRACTEUR' } }),
    });

    // Import depuis le WRAPPER (pas engin.controller.js)
    const { ajouterEnginAuCRV } = await import('../../src/controllers/crv/crvEnginsController.js');

    const req = mockReq({
      body: { enginId: fakeEnginId.toString(), usage: 'TRACTAGE' },
    });
    const res = mockRes();

    await ajouterEnginAuCRV(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    // Le wrapper envoie { enginId, usage } (pas d'affectationId)
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'ENGIN_ASSIGNED',
      fakeUserId,
      expect.objectContaining({
        enginId: fakeEnginId.toString(),
        usage: 'TRACTAGE',
      })
    );
  });

  it('logCRVEvent(ENGIN_REMOVED) appelé après retrait engin', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({ ...fakeCrv }),
    });

    const fakeAffectationId = new mongoose.Types.ObjectId();
    const fakeAffectation = {
      _id: fakeAffectationId,
      deleteOne: vi.fn().mockResolvedValue(true),
    };
    mockAffectationFindById.mockResolvedValueOnce(fakeAffectation);

    const { retirerEnginDuCRV } = await import('../../src/controllers/crv/crvEnginsController.js');

    const req = mockReq({
      params: { id: fakeCrvId.toString(), affectationId: fakeAffectationId.toString() },
    });
    const res = mockRes();

    await retirerEnginDuCRV(req, res, mockNext);

    expect(res.statusCode).toBe(200);
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'ENGIN_REMOVED',
      fakeUserId,
      expect.objectContaining({
        affectationId: fakeAffectationId.toString(),
      })
    );
  });

  it('logCRVEvent(ENGINS_UPDATED) batch — appelé après remplacement complet', async () => {
    const CRVModel = await import('../../src/models/crv/CRV.js');

    // Mock pour l'appel préliminaire du wrapper : CRV.findById().select().lean()
    // Le wrapper capture ancienCount via AffectationEnginVol.countDocuments (try-catch)
    CRVModel.__findById.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ vol: fakeVolId }),
      }),
    });
    mockAffectationCountDocuments.mockResolvedValueOnce(2);

    // Mock pour l'appel du contrôleur de base : CRV.findById().populate()
    CRVModel.__findById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({ ...fakeCrv }),
    });

    mockAffectationDeleteMany.mockResolvedValueOnce({ deletedCount: 2 });

    // Mock Engin.findOne for type lookup
    const EnginModel = await import('../../src/models/resources/Engin.js');
    EnginModel.default.findOne.mockResolvedValue(null);
    EnginModel.default.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

    mockAffectationCreate.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    mockAffectationFind.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      }),
    });

    const { mettreAJourEnginsAffectes } = await import('../../src/controllers/crv/crvEnginsController.js');

    const req = mockReq({
      body: {
        engins: [
          { type: 'tracteur', immatriculation: 'TR-001', heureDebut: '08:00', usage: 'TRACTAGE' },
        ],
      },
    });
    const res = mockRes();

    await mettreAJourEnginsAffectes(req, res, mockNext);

    expect(res.statusCode).toBe(200);
    // Le wrapper émet ENGINS_UPDATED (pas ENGIN_ASSIGNED) avec action BATCH_REPLACE
    expect(mockLogCRVEvent).toHaveBeenCalledWith(
      fakeCrvId.toString(),
      'ENGINS_UPDATED',
      fakeUserId,
      expect.objectContaining({
        action: 'BATCH_REPLACE',
      })
    );
  });
});

// ============================================================
// TEST — Fire-and-forget non-bloquant
// ============================================================

describe('Sous-ressources — fire-and-forget non-bloquant', () => {
  it('Si logCRVEvent rejette sur ajouterEvenement, le contrôleur ne crash pas', async () => {
    mockLogCRVEvent.mockRejectedValueOnce(new Error('DB down'));

    const CRVModel = await import('../../src/models/crv/CRV.js');
    CRVModel.__findById.mockResolvedValueOnce({ ...fakeCrv });

    mockEvenementCreate.mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      typeEvenement: 'RETARD',
      gravite: 'MINEURE',
      description: 'Retard 15min',
      statut: 'OUVERT',
    });

    // Import depuis le WRAPPER
    const { ajouterEvenement } = await import('../../src/controllers/crv/crvEvenementsController.js');

    const req = mockReq({
      body: { typeEvenement: 'RETARD', gravite: 'MINEURE', description: 'Retard 15min' },
    });
    const res = mockRes();

    await ajouterEvenement(req, res, mockNext);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
