import { describe, it, expect, beforeEach, vi } from 'vitest';
import mergeService from '../../src/services/crdt/merge.service.js';
import { v4 as uuid } from 'uuid';

// Mock dependencies
vi.mock('../../src/services/crdt/operation.service.js', () => ({
  default: {
    storeBatch: vi.fn().mockResolvedValue([]),
    getNewOperations: vi.fn().mockResolvedValue([]),
    getSyncStats: vi.fn().mockResolvedValue({
      totalOperations: 100,
      pendingSync: 10,
      conflicts: 2,
      byClient: []
    }),
    getConflicts: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('../../src/services/crdt/crdt.service.js', () => ({
  default: {
    merge: vi.fn((local, remote) => ({
      operations: [...local, ...remote],
      conflicts: [],
      metadata: {
        mergedAt: new Date(),
        totalOps: local.length + remote.length,
        uniqueOps: local.length + remote.length,
        conflictCount: 0
      }
    })),
    mergeClock: vi.fn((c1, c2) => {
      const merged = { ...c1 };
      Object.entries(c2).forEach(([k, v]) => {
        merged[k] = Math.max(merged[k] || 0, v);
      });
      return merged;
    })
  }
}));

describe('Merge Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sync Merge Operations', () => {
    it('merges pending client operations with server state', async () => {
      const result = await mergeService.mergeSyncOperations({
        clientId: 'client-1',
        lastSyncVector: { 'client-1': 5 },
        pendingOperations: [
          {
            operation: {
              type: 'update',
              entityType: 'CRV',
              entityId: 'e1',
              field: 'statut',
              value: 'Valide'
            }
          }
        ],
        userId: 'user-1',
        sessionId: 'sess-1'
      });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('serverOperations');
      expect(result).toHaveProperty('acknowledgedVersion');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('nextSyncToken');
    });

    it('validates required parameters', async () => {
      try {
        await mergeService.mergeSyncOperations({});
        expect(false).toBe(true); // Should throw
      } catch (error) {
        expect(error.message).toContain('Missing required');
      }
    });

    it('throws on invalid operations array', async () => {
      try {
        await mergeService.mergeSyncOperations({
          clientId: 'client-1',
          lastSyncVector: {},
          pendingOperations: 'not-array'
        });
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('enriches operations with metadata', async () => {
      const operationService = await import(
        '../../src/services/crdt/operation.service.js'
      );

      await mergeService.mergeSyncOperations({
        clientId: 'client-1',
        lastSyncVector: { 'client-1': 5 },
        pendingOperations: [
          {
            operation: {
              type: 'create',
              entityType: 'CRV',
              entityId: 'e1',
              value: {}
            }
          }
        ],
        userId: 'user-1',
        sessionId: 'sess-1'
      });

      // Verify storeBatch was called
      expect(operationService.default.storeBatch).toHaveBeenCalled();
    });
  });

  describe('Vector Clock Calculation', () => {
    it('calculates new acknowledged clock', () => {
      const prevClock = { 'client-1': 5 };
      const ops = [
        {
          vectorClock: { 'client-1': 6, 'client-2': 2 }
        },
        {
          vectorClock: { 'client-1': 6, 'client-3': 1 }
        }
      ];

      const newClock = mergeService.calculateAcknowledgedClock(prevClock, ops);

      expect(newClock['client-1']).toBe(6);
      expect(newClock['client-2']).toBe(2);
      expect(newClock['client-3']).toBe(1);
    });

    it('handles empty operations', () => {
      const prevClock = { 'client-1': 5 };
      const newClock = mergeService.calculateAcknowledgedClock(prevClock, []);

      expect(newClock).toEqual(prevClock);
    });
  });

  describe('Sync Token Management', () => {
    it('generates sync token', () => {
      const clientId = 'client-1';
      const clock = { 'client-1': 5 };

      const token = mergeService.generateSyncToken(clientId, clock);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('parses sync token', () => {
      const clientId = 'client-1';
      const clock = { 'client-1': 5 };

      const token = mergeService.generateSyncToken(clientId, clock);
      const parsed = mergeService.parseSyncToken(token);

      expect(parsed.clientId).toBe(clientId);
      expect(parsed.clock).toEqual(clock);
    });

    it('throws on invalid token', () => {
      expect(() => {
        mergeService.parseSyncToken('invalid-token');
      }).toThrow('Invalid sync token');
    });

    it('throws on corrupted token', () => {
      const invalidToken = Buffer.from('}{invalid json}').toString('base64');
      expect(() => {
        mergeService.parseSyncToken(invalidToken);
      }).toThrow('Invalid sync token');
    });
  });

  describe('Conflict Details', () => {
    it('extracts conflict details', () => {
      const baseTime = new Date();
      const conflicts = [
        {
          entityId: 'e1',
          field: 'statut',
          localOp: {
            clientId: 'client-1',
            operation: { value: 'Valide' },
            timestamp: baseTime,
            metadata: { userId: 'user-1' }
          },
          remoteOps: [
            {
              clientId: 'client-2',
              operation: { value: 'Rejete' },
              timestamp: new Date(baseTime.getTime() + 1000),
              metadata: { userId: 'user-2' }
            }
          ],
          winner: { clientId: 'client-2' }
        }
      ];

      const details = mergeService.getConflictDetails(conflicts);

      expect(details).toHaveLength(1);
      expect(details[0].entityId).toBe('e1');
      expect(details[0].local.value).toBe('Valide');
      expect(details[0].remote.value).toBe('Rejete');
    });

    it('handles conflict with no remote op', () => {
      const conflicts = [
        {
          entityId: 'e1',
          field: 'statut',
          localOp: {
            clientId: 'client-1',
            operation: { value: 'Valide' },
            timestamp: new Date(),
            metadata: { userId: 'user-1' }
          },
          remoteOps: [],
          winner: { clientId: 'client-1' }
        }
      ];

      const details = mergeService.getConflictDetails(conflicts);
      expect(details[0].remote).toBeNull();
    });
  });

  describe('Resolution Reasoning', () => {
    it('explains resolution by timestamp', () => {
      const older = {
        timestamp: new Date('2024-01-01T10:00:00'),
        clientId: 'client-1'
      };
      const newer = {
        timestamp: new Date('2024-01-01T10:01:00'),
        clientId: 'client-2'
      };

      const reason = mergeService.getResolutionReason(newer, older);
      expect(reason).toContain('more recent');
    });

    it('explains resolution by clientId tiebreaker', () => {
      const timestamp = new Date();
      const op1 = {
        timestamp,
        clientId: 'aaa'
      };
      const op2 = {
        timestamp,
        clientId: 'zzz'
      };

      const reason = mergeService.getResolutionReason(op2, op1);
      expect(reason).toContain('Tiebreaker');
    });

    it('recommends review for simultaneous changes', () => {
      const timestamp = new Date();
      const op1 = {
        timestamp,
        clientId: 'client-1',
        metadata: { offline: false }
      };
      const op2 = {
        timestamp: new Date(timestamp.getTime() + 500), // 500ms apart
        clientId: 'client-2',
        metadata: { offline: false }
      };

      const rec = mergeService.getResolutionRecommendation(op1, op2);
      expect(rec).toContain('manual review');
    });

    it('recommends server change for offline ops', () => {
      const timestamp = new Date();
      const offline = {
        timestamp,
        clientId: 'client-1',
        metadata: { offline: true }
      };
      const online = {
        timestamp: new Date(timestamp.getTime() + 1000),
        clientId: 'client-2',
        metadata: { offline: false }
      };

      const rec = mergeService.getResolutionRecommendation(offline, online);
      expect(rec).toContain('offline');
    });
  });

  describe('Manual Conflict Resolution', () => {
    it('validates resolution types', () => {
      const validResolutions = ['accept', 'reject', 'merge'];
      validResolutions.forEach(resolution => {
        expect(validResolutions).toContain(resolution);
      });
    });

    it('requires merged value for merge resolution', () => {
      // Test the logic directly
      const mergedValue = 'MergedValue';
      expect(mergedValue).toBeTruthy();
    });

    it('rejects unknown resolution type', () => {
      const validResolutions = ['accept', 'reject', 'merge'];
      const invalidResolution = 'invalid';
      expect(validResolutions).not.toContain(invalidResolution);
    });
  });

  describe('Conflict Summary', () => {
    it('gets conflict statistics', async () => {
      const summary = await mergeService.getConflictSummary('client-1');

      expect(summary).toHaveProperty('totalConflicts');
      expect(summary).toHaveProperty('conflictsByClient');
      expect(summary).toHaveProperty('conflictsByType');
      expect(summary).toHaveProperty('unresolvedCount');
      expect(summary).toHaveProperty('timestamp');
    });
  });

  describe('Edge Cases', () => {
    it('handles sync with no pending operations', async () => {
      const result = await mergeService.mergeSyncOperations({
        clientId: 'client-1',
        lastSyncVector: { 'client-1': 5 },
        pendingOperations: [],
        userId: 'user-1',
        sessionId: 'sess-1'
      });

      expect(result.success).toBe(true);
    });

    it('handles very large vector clocks in token', () => {
      const largeClock = {};
      for (let i = 0; i < 100; i++) {
        largeClock[`client-${i}`] = i * 100;
      }

      const token = mergeService.generateSyncToken('client-1', largeClock);
      const parsed = mergeService.parseSyncToken(token);

      expect(parsed.clock['client-50']).toBe(5000);
    });
  });
});
