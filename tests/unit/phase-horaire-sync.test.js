/**
 * Tests syncPhaseDeadlineToHoraire — Mission SLA_FULL_COVERAGE_BACK / M2
 *
 * Verifie que les phases fines SLA synchronisent correctement l'Horaire et
 * la ChargeOperationnelle bagages :
 * - CHECKIN_OUVERTURE / FERMETURE → Horaire.ouvertureComptoirAt / fermetureComptoirAt
 * - BOARDING_DEBUT / FERMETURE_GATE → Horaire.debutBoardingAt / fermetureGateAt
 * - BAGAGES_PREMIER / DERNIER → Horaire.heureLivraisonBagagesDebut / Fin + ChargeOp bagages
 *
 * Cas :
 * T1 — SLA_CHECKIN_OUVERTURE debut → Horaire.ouvertureComptoirAt
 * T2 — SLA_BAGAGES_PREMIER debut → Horaire + ChargeOp bagages
 * T3 — Phase inconnue → aucun appel Horaire/Charge
 * T4 — Valeur null → aucun update (tolerance)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────
let mockHoraireUpdate;
let mockCRVFindById;
let mockChargeUpdateMany;

vi.mock('../../src/models/phases/Horaire.js', () => ({
  default: {
    findByIdAndUpdate: (...args) => mockHoraireUpdate(...args)
  }
}));

vi.mock('../../src/models/crv/CRV.js', () => ({
  default: {
    findById: (...args) => mockCRVFindById(...args)
  }
}));

vi.mock('../../src/models/charges/ChargeOperationnelle.js', () => ({
  default: {
    updateMany: (...args) => mockChargeUpdateMany(...args)
  }
}));

// Imports differes (apres mocks)
const { syncPhaseDeadlineToHoraire } = await import('../../src/services/phases/phase.service.js');

beforeEach(() => {
  mockHoraireUpdate = vi.fn().mockResolvedValue({ _id: 'horaire1' });
  mockChargeUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 1 });
  mockCRVFindById = vi.fn().mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ horaire: 'horaire1' }) })
  });
});

describe('syncPhaseDeadlineToHoraire — phases fines SLA', () => {
  it('T1 — SLA_CHECKIN_OUVERTURE debut écrit sur Horaire.ouvertureComptoirAt', async () => {
    const debutDate = new Date('2026-04-17T10:00:00Z');
    const chronoPhase = {
      crv: 'crv1',
      heureDebutReelle: debutDate,
      phase: { code: 'SLA_CHECKIN_OUVERTURE', slaMode: 'DEADLINE' }
    };

    await syncPhaseDeadlineToHoraire(chronoPhase, 'debut');

    expect(mockHoraireUpdate).toHaveBeenCalledTimes(1);
    expect(mockHoraireUpdate).toHaveBeenCalledWith(
      'horaire1',
      { ouvertureComptoirAt: debutDate },
      { new: true }
    );
    // Check-in n'écrit pas sur Charge
    expect(mockChargeUpdateMany).not.toHaveBeenCalled();
  });

  it('T2 — SLA_BAGAGES_PREMIER debut écrit sur Horaire ET ChargeOperationnelle BAGAGES', async () => {
    const debutDate = new Date('2026-04-17T10:45:00Z');
    const chronoPhase = {
      crv: 'crv1',
      heureDebutReelle: debutDate,
      phase: { code: 'SLA_BAGAGES_PREMIER', slaMode: 'DEADLINE' }
    };

    await syncPhaseDeadlineToHoraire(chronoPhase, 'debut');

    expect(mockHoraireUpdate).toHaveBeenCalledWith(
      'horaire1',
      { heureLivraisonBagagesDebut: debutDate },
      { new: true }
    );
    expect(mockChargeUpdateMany).toHaveBeenCalledWith(
      { crv: 'crv1', typeCharge: 'BAGAGES' },
      { premierBagageAt: debutDate }
    );
  });

  it('T3 — Phase inconnue → aucune synchronisation', async () => {
    const chronoPhase = {
      crv: 'crv1',
      heureDebutReelle: new Date(),
      phase: { code: 'UNKNOWN_PHASE' }
    };

    await syncPhaseDeadlineToHoraire(chronoPhase, 'debut');

    expect(mockHoraireUpdate).not.toHaveBeenCalled();
    expect(mockChargeUpdateMany).not.toHaveBeenCalled();
  });

  it('T4 — Valeur null (heure reelle absente) → aucun update (tolerance)', async () => {
    const chronoPhase = {
      crv: 'crv1',
      heureDebutReelle: null,
      phase: { code: 'SLA_BOARDING_DEBUT' }
    };

    await syncPhaseDeadlineToHoraire(chronoPhase, 'debut');

    expect(mockHoraireUpdate).not.toHaveBeenCalled();
    expect(mockChargeUpdateMany).not.toHaveBeenCalled();
  });

  it('T5 — DEP_BOARDING fin ecrit fermetureGateAt (retrocompat historique)', async () => {
    const finDate = new Date('2026-04-17T11:00:00Z');
    const chronoPhase = {
      crv: 'crv1',
      heureFinReelle: finDate,
      phase: { code: 'DEP_BOARDING', slaMode: 'DEADLINE' }
    };

    await syncPhaseDeadlineToHoraire(chronoPhase, 'fin');

    expect(mockHoraireUpdate).toHaveBeenCalledWith(
      'horaire1',
      { fermetureGateAt: finDate },
      { new: true }
    );
  });
});
