import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mission 011 — Tests Seed Phases Idempotent
 *
 * Vérifie que seedPhases() est idempotent en mode upsert
 * et destructif en mode force-reset.
 */

// ═══════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════

const mockPhase = {
  deleteMany: vi.fn(),
  insertMany: vi.fn(),
  findOneAndUpdate: vi.fn(),
  countDocuments: vi.fn()
};

vi.mock('../../src/models/phases/Phase.js', () => ({
  default: mockPhase
}));

vi.mock('../../src/config/db.js', () => ({
  connectDB: vi.fn().mockResolvedValue(true)
}));

const { seedPhases, toutesPhases } = await import('../../src/utils/seedPhases.js');

// ═══════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════

describe('Mission 011 — Seed Phases Idempotent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPhase.countDocuments.mockResolvedValue(34);
  });

  describe('toutesPhases — structure des données', () => {
    it('contient exactement 34 phases', () => {
      expect(toutesPhases).toHaveLength(34);
    });

    it('contient 8 phases ARRIVEE', () => {
      const arrivee = toutesPhases.filter(p => p.typeOperation === 'ARRIVEE');
      expect(arrivee).toHaveLength(8);
    });

    it('contient 9 phases DEPART', () => {
      const depart = toutesPhases.filter(p => p.typeOperation === 'DEPART');
      expect(depart).toHaveLength(9);
    });

    it('contient 13 phases TURN_AROUND', () => {
      const ta = toutesPhases.filter(p => p.typeOperation === 'TURN_AROUND');
      expect(ta).toHaveLength(13);
    });

    it('contient 4 phases COMMUN', () => {
      const commun = toutesPhases.filter(p => p.typeOperation === 'COMMUN');
      expect(commun).toHaveLength(4);
    });

    it('chaque phase a les champs requis', () => {
      for (const phase of toutesPhases) {
        expect(phase).toHaveProperty('code');
        expect(phase).toHaveProperty('libelle');
        expect(phase).toHaveProperty('typeOperation');
        expect(phase).toHaveProperty('categorie');
        expect(phase).toHaveProperty('macroPhase');
        expect(phase).toHaveProperty('ordre');
        expect(phase).toHaveProperty('dureeStandardMinutes');
        expect(typeof phase.obligatoire).toBe('boolean');
      }
    });

    it('tous les codes sont uniques', () => {
      const codes = toutesPhases.map(p => p.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes).toHaveLength(uniqueCodes.length);
    });

    it('les typeOperation sont valides', () => {
      const typesValides = ['ARRIVEE', 'DEPART', 'TURN_AROUND', 'COMMUN'];
      for (const phase of toutesPhases) {
        expect(typesValides).toContain(phase.typeOperation);
      }
    });
  });

  describe('seedPhases() — mode upsert (défaut)', () => {
    it('ne supprime PAS les phases existantes', async () => {
      mockPhase.findOneAndUpdate.mockResolvedValue({
        lastErrorObject: { updatedExisting: true }
      });

      await seedPhases(false);

      expect(mockPhase.deleteMany).not.toHaveBeenCalled();
      expect(mockPhase.insertMany).not.toHaveBeenCalled();
    });

    it('appelle findOneAndUpdate pour chaque phase', async () => {
      mockPhase.findOneAndUpdate.mockResolvedValue({
        lastErrorObject: { updatedExisting: true }
      });

      await seedPhases(false);

      expect(mockPhase.findOneAndUpdate).toHaveBeenCalledTimes(34);
    });

    it('utilise code + typeOperation comme clé de lookup', async () => {
      mockPhase.findOneAndUpdate.mockResolvedValue({
        lastErrorObject: { updatedExisting: true }
      });

      await seedPhases(false);

      const firstCall = mockPhase.findOneAndUpdate.mock.calls[0];
      expect(firstCall[0]).toEqual({
        code: 'ARR_BRIEFING',
        typeOperation: 'ARRIVEE'
      });
      expect(firstCall[2]).toMatchObject({
        upsert: true,
        new: true
      });
    });

    it('compte correctement les phases créées vs mises à jour', async () => {
      // Simuler : 30 existantes (update) + 4 nouvelles (create)
      let callCount = 0;
      mockPhase.findOneAndUpdate.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          lastErrorObject: { updatedExisting: callCount <= 30 }
        });
      });

      const result = await seedPhases(false);

      expect(result.created).toBe(4);
      expect(result.updated).toBe(30);
      expect(result.total).toBe(34);
    });

    it('est idempotent — deux exécutions successives ne cassent rien', async () => {
      // 1ère exécution : tout est nouveau
      mockPhase.findOneAndUpdate.mockResolvedValue({
        lastErrorObject: { updatedExisting: false }
      });
      const result1 = await seedPhases(false);
      expect(result1.created).toBe(34);
      expect(result1.updated).toBe(0);

      vi.clearAllMocks();
      mockPhase.countDocuments.mockResolvedValue(34);

      // 2ème exécution : tout existe déjà
      mockPhase.findOneAndUpdate.mockResolvedValue({
        lastErrorObject: { updatedExisting: true }
      });
      const result2 = await seedPhases(false);
      expect(result2.created).toBe(0);
      expect(result2.updated).toBe(34);

      // Aucune suppression dans les deux cas
      expect(mockPhase.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('seedPhases() — mode force-reset', () => {
    it('supprime toutes les phases avant insertion', async () => {
      mockPhase.insertMany.mockResolvedValue(toutesPhases);

      await seedPhases(true);

      expect(mockPhase.deleteMany).toHaveBeenCalledWith({});
      expect(mockPhase.insertMany).toHaveBeenCalledWith(toutesPhases);
    });

    it('ne fait PAS de findOneAndUpdate', async () => {
      mockPhase.insertMany.mockResolvedValue(toutesPhases);

      await seedPhases(true);

      expect(mockPhase.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('retourne le compteur correct', async () => {
      mockPhase.insertMany.mockResolvedValue(toutesPhases);

      const result = await seedPhases(true);

      expect(result.created).toBe(34);
      expect(result.updated).toBe(0);
      expect(result.total).toBe(34);
    });
  });

  describe('seedPhases() — gestion d\'erreurs', () => {
    it('propage l\'erreur en cas d\'échec', async () => {
      mockPhase.findOneAndUpdate.mockRejectedValue(new Error('Connection refused'));

      await expect(seedPhases(false)).rejects.toThrow('Connection refused');
    });
  });
});
