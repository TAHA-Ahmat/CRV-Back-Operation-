/**
 * MISSION 003 — Sécurisation Archivage
 * Tests : Chaîne Validation → Archivage → Immutabilité
 *
 * Couverture :
 * 1. canArchiveCRV — logique pure (5 tests)
 * 2. isCRVImmutable — helper immutabilité (4 tests)
 * 3. Idempotence archivage P0#7 (3 tests)
 * 4. Archivage échoue → validation échoue (3 tests)
 * 5. Archivage réussi → validation réussit (4 tests)
 * 6. Déverrouillage bloqué si CRV archivé (2 tests)
 *
 * Total : 21 tests
 *
 * Approche : Mock complet de Mongoose + Drive.
 * Aucun appel réseau. Aucune base de données.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS — vi.hoisted() garantit l'initialisation AVANT le hoisting vi.mock
// ============================================================================

const {
  mockCRVFindById,
  mockCRVFindByIdAndUpdate,
  mockValidationFindOne,
  mockValidationDeleteOne,
  mockValidationCreate,
  mockValidationFindByIdAndUpdate,
  mockValidationFindOneAndUpdate,
  mockChronologieFind,
  mockCalculerCompletude,
  mockVerifierConformiteSLA,
  mockArchiveDocument,
  mockCheckArchiveStatus,
  mockGenerateBuffer,
  mockGetPreviewData,
  mockGenerateStream,
} = vi.hoisted(() => ({
  mockCRVFindById: vi.fn(),
  mockCRVFindByIdAndUpdate: vi.fn(),
  mockValidationFindOne: vi.fn(),
  mockValidationDeleteOne: vi.fn(),
  mockValidationCreate: vi.fn(),
  mockValidationFindByIdAndUpdate: vi.fn(),
  mockValidationFindOneAndUpdate: vi.fn(),
  mockChronologieFind: vi.fn(),
  mockCalculerCompletude: vi.fn(),
  mockVerifierConformiteSLA: vi.fn(),
  mockArchiveDocument: vi.fn(),
  mockCheckArchiveStatus: vi.fn(),
  mockGenerateBuffer: vi.fn(),
  mockGetPreviewData: vi.fn(),
  mockGenerateStream: vi.fn(),
}));

// --- Mongoose Models ---

vi.mock('../../src/models/crv/CRV.js', () => ({
  default: {
    findById: mockCRVFindById,
    findByIdAndUpdate: mockCRVFindByIdAndUpdate,
  }
}));

vi.mock('../../src/models/validation/ValidationCRV.js', () => ({
  default: {
    findOne: mockValidationFindOne,
    deleteOne: mockValidationDeleteOne,
    create: mockValidationCreate,
    findByIdAndUpdate: mockValidationFindByIdAndUpdate,
    findOneAndUpdate: mockValidationFindOneAndUpdate,
  }
}));

vi.mock('../../src/models/phases/ChronologiePhase.js', () => ({
  default: {
    find: mockChronologieFind,
  }
}));

// --- Services CRV ---

vi.mock('../../src/services/crv/crv.service.js', () => ({
  calculerCompletude: mockCalculerCompletude,
  verifierConformiteSLA: mockVerifierConformiteSLA,
}));

// --- Archivage dependencies ---

vi.mock('../../src/services/documents/base/DocumentArchiver.js', () => ({
  archiveDocument: mockArchiveDocument,
  checkArchiveStatus: mockCheckArchiveStatus,
}));

vi.mock('../../src/services/documents/crv/CrvGenerator.js', () => ({
  CrvGenerator: class MockCrvGenerator {
    generateBuffer(...args) { return mockGenerateBuffer(...args); }
    getPreviewData(...args) { return mockGetPreviewData(...args); }
    generateStream(...args) { return mockGenerateStream(...args); }
  }
}));

vi.mock('../../src/config/documents.config.js', () => ({
  DOCUMENT_TYPES: { CRV: 'crv' }
}));

// ============================================================================
// IMPORTS — Les mocks sont déjà en place grâce au hoisting
// ============================================================================

import {
  canArchiveCRV,
  isCRVImmutable,
  archiverCRV
} from '../../src/services/documents/crv/crvArchivage.service.js';

import {
  validerCRV,
  deverrouillerCRV
} from '../../src/services/validation/validation.service.js';

// ============================================================================
// HELPERS — Factories de données mock
// ============================================================================

function createMockCRVDoc(overrides = {}) {
  return {
    _id: 'crv-test-001',
    numeroCRV: 'CRV20260303-0001',
    statut: 'TERMINE',
    escale: 'CDG',
    completude: 85,
    responsableVol: 'user-resp-001',
    vol: {
      _id: 'vol-001',
      numeroVol: 'AF123',
      compagnieAerienne: 'Air France',
      codeIATA: 'AF',
      dateVol: new Date('2026-03-03'),
    },
    archivage: {
      driveFileId: null,
      driveWebViewLink: null,
      filename: null,
      folderPath: null,
      size: null,
      archivedAt: null,
      archivedBy: null,
      version: 1,
    },
    toObject: function () { return { ...this }; },
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function createArchivedCRVDoc(overrides = {}) {
  return createMockCRVDoc({
    statut: 'VERROUILLE',
    archivage: {
      driveFileId: 'drive-file-abc123',
      driveWebViewLink: 'https://drive.google.com/file/abc123',
      filename: 'CRV20260303-0001_AF123.pdf',
      folderPath: 'CRV/2026/03/AF',
      size: 245000,
      archivedAt: new Date('2026-03-03T14:30:00Z'),
      archivedBy: 'user-archive-001',
      version: 1,
    },
    ...overrides,
  });
}

const ARCHIVE_SUCCESS_RESULT = {
  fileId: 'drive-new-file-xyz',
  webViewLink: 'https://drive.google.com/file/xyz',
  filename: 'CRV20260303-0001_AF123.pdf',
  folderPath: 'CRV/2026/03/AF',
  size: 245000,
};

// ============================================================================
// RESET — Defaults raisonnables avant chaque test
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();

  mockCalculerCompletude.mockResolvedValue(90);
  mockVerifierConformiteSLA.mockResolvedValue({ conformite: true, ecarts: [] });
  mockChronologieFind.mockResolvedValue([
    { statut: 'TERMINE' },
    { statut: 'TERMINE' },
  ]);
  mockValidationFindOne.mockResolvedValue(null);
  mockValidationCreate.mockImplementation(async (data) => ({
    _id: 'val-new-001',
    ...data,
  }));
  mockValidationFindByIdAndUpdate.mockResolvedValue(true);
  mockValidationFindOneAndUpdate.mockResolvedValue(true);
  mockValidationDeleteOne.mockResolvedValue(true);
  mockCRVFindByIdAndUpdate.mockResolvedValue(true);
});

// ============================================================================
// 1. canArchiveCRV — Logique pure
// ============================================================================

describe('1. canArchiveCRV — logique pure', () => {
  it('autorise archivage pour statut TERMINE', () => {
    const result = canArchiveCRV({ statut: 'TERMINE' });
    expect(result.canArchive).toBe(true);
  });

  it('autorise archivage pour statut VALIDE', () => {
    const result = canArchiveCRV({ statut: 'VALIDE' });
    expect(result.canArchive).toBe(true);
  });

  it('autorise archivage pour statut VERROUILLE', () => {
    const result = canArchiveCRV({ statut: 'VERROUILLE' });
    expect(result.canArchive).toBe(true);
  });

  it('refuse archivage pour statut ANNULE', () => {
    const result = canArchiveCRV({ statut: 'ANNULE' });
    expect(result.canArchive).toBe(false);
    expect(result.reason).toContain('annulé');
  });

  it('refuse archivage si CRV null', () => {
    const result = canArchiveCRV(null);
    expect(result.canArchive).toBe(false);
  });
});

// ============================================================================
// 2. isCRVImmutable — Helper immutabilité
// ============================================================================

describe('2. isCRVImmutable — helper immutabilité', () => {
  it('retourne true si archivage.archivedAt est défini', () => {
    const crv = createArchivedCRVDoc();
    expect(isCRVImmutable(crv)).toBe(true);
  });

  it('retourne false si archivage est null', () => {
    const crv = createMockCRVDoc({ archivage: null });
    expect(isCRVImmutable(crv)).toBe(false);
  });

  it('retourne false si archivage.archivedAt est null', () => {
    const crv = createMockCRVDoc(); // archivedAt: null par défaut
    expect(isCRVImmutable(crv)).toBe(false);
  });

  it('retourne false si CRV est null', () => {
    expect(isCRVImmutable(null)).toBe(false);
  });
});

// ============================================================================
// 3. Idempotence archivage (P0#7)
// ============================================================================

describe('3. Idempotence archivage (P0#7)', () => {
  it('retourne résultat idempotent si driveFileId présent et force=false', async () => {
    const archivedCrv = createArchivedCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(archivedCrv),
    });

    const result = await archiverCRV('crv-test-001', 'user-001');

    expect(result.success).toBe(true);
    expect(result.idempotent).toBe(true);
    expect(result.archivage.fileId).toBe('drive-file-abc123');
    // Aucun upload n'a eu lieu
    expect(mockArchiveDocument).not.toHaveBeenCalled();
    expect(mockGenerateBuffer).not.toHaveBeenCalled();
  });

  it('procède à l\'upload si force=true même avec driveFileId', async () => {
    const archivedCrv = createArchivedCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(archivedCrv),
    });
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockResolvedValue(ARCHIVE_SUCCESS_RESULT);

    const result = await archiverCRV('crv-test-001', 'user-001', { force: true });

    expect(result.success).toBe(true);
    expect(result.idempotent).toBeUndefined();
    expect(mockGenerateBuffer).toHaveBeenCalled();
    expect(mockArchiveDocument).toHaveBeenCalled();
  });

  it('procède à l\'upload si driveFileId est null', async () => {
    const freshCrv = createMockCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(freshCrv),
    });
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockResolvedValue(ARCHIVE_SUCCESS_RESULT);

    const result = await archiverCRV('crv-test-001', 'user-001');

    expect(result.success).toBe(true);
    expect(mockGenerateBuffer).toHaveBeenCalled();
    expect(mockArchiveDocument).toHaveBeenCalled();
    expect(freshCrv.save).toHaveBeenCalled();
  });
});

// ============================================================================
// 4. Archivage échoue → validation échoue (FAIL-OPEN FIX)
// ============================================================================

describe('4. Archivage échoue → validation échoue', () => {
  beforeEach(() => {
    // Setup CRV TERMINE valide (pas d'anomalies)
    const crv = createMockCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(crv),
    });
  });

  it('validerCRV continue en mode dégradé si archiverCRV throw (panne Drive)', async () => {
    // Mission 006 : Drive ne bloque plus la validation
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockRejectedValue(new Error('Google Drive inaccessible'));

    // La validation NE throw PAS — elle continue en mode dégradé
    const result = await validerCRV('crv-test-001', 'user-001', 'Validation test', true);
    expect(result).toBeDefined();

    // Le CRV DOIT transiter à VERROUILLE malgré l'échec Drive
    const verrouilleCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.statut === 'VERROUILLE'
    );
    expect(verrouilleCalls).toHaveLength(1);

    // L'archivage doit être marqué EN_ATTENTE
    const archivageCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.['archivage.statut'] === 'EN_ATTENTE'
    );
    expect(archivageCalls).toHaveLength(1);
  });

  it('CRV transite à VALIDE même quand archivage échoue (verrouillage manuel)', async () => {
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockRejectedValue(new Error('Upload partiel'));

    // verrouillageAutomatique = false → transition vers VALIDE
    const result = await validerCRV('crv-test-001', 'user-001', 'Test', false);
    expect(result).toBeDefined();

    // Transition vers VALIDE (pas VERROUILLE car verrouillageAutomatique=false)
    const valideCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.statut === 'VALIDE'
    );
    expect(valideCalls).toHaveLength(1);
  });

  it('archivage marqué EN_ATTENTE quand Drive timeout', async () => {
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockRejectedValue(new Error('Drive timeout'));

    await validerCRV('crv-test-001', 'user-001', 'Test', false);

    // L'archivage est marqué EN_ATTENTE avec le message d'erreur
    const archivageCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.['archivage.statut'] === 'EN_ATTENTE'
    );
    expect(archivageCalls).toHaveLength(1);
    expect(archivageCalls[0][1]['archivage.erreur']).toBe('Drive timeout');
  });
});

// ============================================================================
// 5. Archivage réussi → validation réussit
// ============================================================================

describe('5. Archivage réussi → validation réussit', () => {
  beforeEach(() => {
    // archiverCRV va réussir (via les mocks internes)
    mockGenerateBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockArchiveDocument.mockResolvedValue(ARCHIVE_SUCCESS_RESULT);
  });

  it('validerCRV appelle archiveDocument quand pas d\'anomalies', async () => {
    const crv = createMockCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(crv),
    });

    await validerCRV('crv-test-001', 'user-001', 'OK', true);

    // archiveDocument doit avoir été appelé (via archiverCRV)
    expect(mockArchiveDocument).toHaveBeenCalled();
  });

  it('CRV passe à VERROUILLE si archivage OK + verrouillageAutomatique', async () => {
    const crv = createMockCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(crv),
    });

    const result = await validerCRV('crv-test-001', 'user-001', 'OK', true);

    expect(result.statut).toBe('VALIDE');
    const verrouilleCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.statut === 'VERROUILLE'
    );
    expect(verrouilleCalls).toHaveLength(1);
  });

  it('CRV passe à VALIDE si archivage OK + verrouillage manuel', async () => {
    const crv = createMockCRVDoc();
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(crv),
    });

    const result = await validerCRV('crv-test-001', 'user-001', 'OK', false);

    expect(result.statut).toBe('VALIDE');
    const valideCalls = mockCRVFindByIdAndUpdate.mock.calls.filter(
      call => call[1]?.statut === 'VALIDE'
    );
    expect(valideCalls).toHaveLength(1);
  });

  it('ne tente PAS archivage si anomalies détectées', async () => {
    const crv = createMockCRVDoc({
      responsableVol: null, // Anomalie : pas de responsable
    });
    mockCRVFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(crv),
    });

    const result = await validerCRV('crv-test-001', 'user-001', 'Test', true);

    // archiveDocument ne doit PAS être appelé car anomalies
    expect(mockArchiveDocument).not.toHaveBeenCalled();
    expect(result.statut).toBe('EN_ATTENTE_CORRECTION');
  });
});

// ============================================================================
// 6. Déverrouillage et immutabilité
// ============================================================================

describe('6. Déverrouillage et immutabilité', () => {
  it('deverrouillerCRV REFUSE si CRV a archivage.archivedAt', async () => {
    const archivedCrv = createArchivedCRVDoc();
    mockCRVFindById.mockResolvedValue(archivedCrv);

    await expect(
      deverrouillerCRV('crv-test-001', 'user-001', 'Correction nécessaire')
    ).rejects.toThrow(/immuable|archivé|immutable/i);

    // Le statut ne doit PAS changer
    expect(mockCRVFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('deverrouillerCRV AUTORISE si CRV sans archivage', async () => {
    const unlockedCrv = createMockCRVDoc({
      statut: 'VERROUILLE',
      archivage: {
        driveFileId: null,
        archivedAt: null,
        version: 1,
      },
    });
    mockCRVFindById.mockResolvedValue(unlockedCrv);

    const result = await deverrouillerCRV('crv-test-001', 'user-001', 'Correction urgente');

    expect(result).toBe(true);
    expect(mockCRVFindByIdAndUpdate).toHaveBeenCalledWith(
      'crv-test-001',
      expect.objectContaining({ statut: 'EN_COURS' })
    );
  });
});
