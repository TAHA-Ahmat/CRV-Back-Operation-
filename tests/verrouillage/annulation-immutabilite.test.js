import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mission 009 — Tests Immutabilité Annulation
 *
 * Vérifie que la fonction annulerCRV et verifierPeutAnnuler
 * rejettent correctement les CRV archivés (immutables).
 */

// ═══════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════

const mockCRVInstances = {};

const mockCRV = {
  findById: vi.fn()
};

vi.mock('../../src/models/crv/CRV.js', () => ({
  default: mockCRV
}));

vi.mock('../../src/models/security/UserActivityLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({})
  }
}));

// On mocke isCRVImmutable pour contrôler le comportement
vi.mock('../../src/services/documents/crv/crvArchivage.service.js', () => ({
  isCRVImmutable: vi.fn()
}));

const { isCRVImmutable } = await import('../../src/services/documents/crv/crvArchivage.service.js');
const { annulerCRV, verifierPeutAnnuler } = await import('../../src/services/crv/annulation.service.js');

// ═══════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════

describe('Mission 009 — Immutabilité Annulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('annulerCRV — protection archivage', () => {
    it('refuse d\'annuler un CRV archivé (immutable)', async () => {
      const crvMock = {
        _id: 'crv-archive',
        statut: 'VALIDE',
        archivage: { archivedAt: new Date('2026-01-15') },
        save: vi.fn()
      };
      mockCRV.findById.mockResolvedValue(crvMock);
      isCRVImmutable.mockReturnValue(true);

      await expect(
        annulerCRV('crv-archive', { raisonAnnulation: 'test' }, 'user-1')
      ).rejects.toThrow('INTERDIT : CRV archivé et immutable');

      expect(crvMock.save).not.toHaveBeenCalled();
    });

    it('refuse d\'annuler un CRV verrouillé', async () => {
      const crvMock = {
        _id: 'crv-locked',
        statut: 'VERROUILLE',
        save: vi.fn()
      };
      mockCRV.findById.mockResolvedValue(crvMock);

      await expect(
        annulerCRV('crv-locked', { raisonAnnulation: 'test' }, 'user-1')
      ).rejects.toThrow('verrouillé');
    });

    it('refuse d\'annuler un CRV déjà annulé', async () => {
      const crvMock = {
        _id: 'crv-deja-annule',
        statut: 'ANNULE',
        save: vi.fn()
      };
      mockCRV.findById.mockResolvedValue(crvMock);

      await expect(
        annulerCRV('crv-deja-annule', { raisonAnnulation: 'test' }, 'user-1')
      ).rejects.toThrow('déjà annulé');
    });

    it('permet d\'annuler un CRV EN_COURS non archivé', async () => {
      const crvMock = {
        _id: 'crv-ok',
        statut: 'EN_COURS',
        numeroCRV: 'CRV-2026-001',
        save: vi.fn().mockResolvedValue(true)
      };
      mockCRV.findById.mockResolvedValue(crvMock);
      isCRVImmutable.mockReturnValue(false);

      const result = await annulerCRV('crv-ok', { raisonAnnulation: 'Vol annulé' }, 'user-1');

      expect(result.statut).toBe('ANNULE');
      expect(crvMock.save).toHaveBeenCalledTimes(1);
    });

    it('permet d\'annuler un CRV TERMINE non archivé', async () => {
      const crvMock = {
        _id: 'crv-termine',
        statut: 'TERMINE',
        numeroCRV: 'CRV-2026-002',
        save: vi.fn().mockResolvedValue(true)
      };
      mockCRV.findById.mockResolvedValue(crvMock);
      isCRVImmutable.mockReturnValue(false);

      const result = await annulerCRV('crv-termine', { raisonAnnulation: 'Erreur de saisie' }, 'user-2');

      expect(result.statut).toBe('ANNULE');
      expect(result.annulation.ancienStatut).toBe('TERMINE');
    });
  });

  describe('verifierPeutAnnuler — protection archivage', () => {
    it('retourne peutAnnuler=false pour CRV archivé', async () => {
      const crvMock = {
        _id: 'crv-archive',
        statut: 'VALIDE',
        archivage: { archivedAt: new Date() }
      };
      mockCRV.findById.mockResolvedValue(crvMock);
      isCRVImmutable.mockReturnValue(true);

      const result = await verifierPeutAnnuler('crv-archive');

      expect(result.peutAnnuler).toBe(false);
      expect(result.raison).toContain('immutable');
    });

    it('retourne peutAnnuler=false pour CRV verrouillé', async () => {
      const crvMock = {
        _id: 'crv-locked',
        statut: 'VERROUILLE'
      };
      mockCRV.findById.mockResolvedValue(crvMock);

      const result = await verifierPeutAnnuler('crv-locked');

      expect(result.peutAnnuler).toBe(false);
      expect(result.raison).toContain('verrouillé');
    });

    it('retourne peutAnnuler=true pour CRV EN_COURS', async () => {
      const crvMock = {
        _id: 'crv-ok',
        statut: 'EN_COURS'
      };
      mockCRV.findById.mockResolvedValue(crvMock);
      isCRVImmutable.mockReturnValue(false);

      const result = await verifierPeutAnnuler('crv-ok');

      expect(result.peutAnnuler).toBe(true);
      expect(result.raison).toBeNull();
    });

    it('retourne peutAnnuler=false pour CRV non trouvé', async () => {
      mockCRV.findById.mockResolvedValue(null);

      const result = await verifierPeutAnnuler('crv-inexistant');

      expect(result.peutAnnuler).toBe(false);
    });
  });
});
