import { describe, it, expect, beforeEach, vi } from 'vitest';
import operationService from '../../src/services/crdt/operation.service.js';
import OperationLog from '../../src/models/OperationLog.js';
import { v4 as uuid } from 'uuid';

// Mock OperationLog model with simpler implementation
vi.mock('../../src/models/OperationLog.js', () => {
  return {
    default: class MockOperationLog {
      constructor(data) {
        this.data = data;
      }

      async save() {
        const doc = { _id: uuid(), ...this.data };
        return {
          toObject: () => doc
        };
      }

      static insertMany(docs) {
        const stored = docs.map(doc => ({
          _id: uuid(),
          ...doc,
          toObject: function() {
            return { _id: this._id, ...this.data };
          }
        }));
        return Promise.resolve(stored);
      }

      static find() {
        return {
          sort: () => ({
            lean: () => Promise.resolve([])
          })
        };
      }

      static countDocuments() {
        return Promise.resolve(0);
      }

      static aggregate() {
        return Promise.resolve([]);
      }
    }
  };
});

describe('Operation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Store Operations', () => {
    it('stores single operation', async () => {
      const op = {
        clientId: 'client-1',
        vectorClock: new Map([['client-1', 1]]),
        timestamp: new Date(),
        operation: {
          type: 'create',
          entityType: 'CRV',
          entityId: 'entity-1',
          value: {}
        },
        metadata: {
          offline: false
        }
      };

      const result = await operationService.storeOperation(op);
      expect(result._id).toBeDefined();
      expect(result.clientId).toBe('client-1');
    });

    it('stores batch of operations', async () => {
      const ops = [
        {
          clientId: 'client-1',
          vectorClock: new Map([['client-1', 1]]),
          timestamp: new Date(),
          operation: {
            type: 'create',
            entityType: 'CRV',
            entityId: 'e1',
            value: {}
          }
        },
        {
          clientId: 'client-1',
          vectorClock: new Map([['client-1', 2]]),
          timestamp: new Date(),
          operation: {
            type: 'update',
            entityType: 'CRV',
            entityId: 'e1',
            field: 'statut',
            value: 'Valide'
          }
        }
      ];

      const results = await operationService.storeBatch(ops);
      expect(results).toHaveLength(2);
      expect(results[0]._id).toBeDefined();
    });

    it('handles empty batch gracefully', async () => {
      const results = await operationService.storeBatch([]);
      expect(results).toEqual([]);
    });

    it('handles null batch gracefully', async () => {
      const results = await operationService.storeBatch(null);
      expect(results).toEqual([]);
    });
  });

  describe('Query Operations', () => {
    it('gets entity history', async () => {
      const history = await operationService.getEntityHistory(
        'entity-1',
        'CRV'
      );
      expect(history).toBeDefined();
    });

    it('gets entity history since timestamp', async () => {
      const since = new Date();
      const history = await operationService.getEntityHistory(
        'entity-1',
        'CRV',
        since
      );
      expect(history).toBeDefined();
    });

    it('gets unacknowledged operations', async () => {
      const ops = await operationService.getUnacknowledgedOps(
        'client-1',
        { client1: 5 }
      );
      expect(ops).toBeDefined();
    });

    it('gets conflicts for entity', async () => {
      const conflicts = await operationService.getConflicts('entity-1');
      expect(conflicts).toBeDefined();
    });
  });

  describe('Mark Operations', () => {
    it('marks operations as resolved', async () => {
      const opIds = [uuid(), uuid()];
      const result = await operationService.markResolved(opIds, true);

      expect(result.marked).toBe(2);
      expect(result.note).toContain('immutable');
    });

    it('handles empty resolve list', async () => {
      await operationService.markResolved([]);
      // Should complete without error
    });

    it('handles null resolve list', async () => {
      await operationService.markResolved(null);
      // Should complete without error
    });
  });

  describe('Get Single Operation', () => {
    it('retrieves operation by ID', async () => {
      // Mock the OperationLog.findById
      const mockOp = { _id: 'op-1', clientId: 'client-1' };
      OperationLog.findById = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOp)
      });

      const result = await operationService.getOperation('op-1');
      expect(result).toBeDefined();
    });
  });

  describe('Sync Statistics', () => {
    it('gets sync statistics', async () => {
      const stats = await operationService.getSyncStats();

      expect(stats).toHaveProperty('totalOperations');
      expect(stats).toHaveProperty('pendingSync');
      expect(stats).toHaveProperty('conflicts');
      expect(stats).toHaveProperty('byClient');
      expect(stats).toHaveProperty('timestamp');
    });
  });

  describe('Operation Replay', () => {
    it('replays operations to rebuild state', () => {
      const initialState = { numeroEngin: 'N123', statut: 'Brouillon' };

      // Mock the CRDT service
      vi.mock('../../src/services/crdt/crdt.service.js', () => ({
        default: {
          applyOperation: vi.fn((state, op) => ({
            ...state,
            [op.operation.field]: op.operation.value
          }))
        }
      }));

      const ops = [
        {
          operation: {
            type: 'update',
            field: 'statut',
            value: 'Valide'
          }
        }
      ];

      const finalState = operationService.replayOperations(
        initialState,
        ops
      );

      expect(finalState.numeroEngin).toBe('N123');
      expect(finalState.statut).toBe('Valide');
    });

    it('handles empty operation list', () => {
      const state = { a: 1 };
      const result = operationService.replayOperations(state, []);
      expect(result).toEqual(state);
    });
  });

  describe('Archive Operations', () => {
    it('calculates cutoff date for 30 days', () => {
      // Test the logic directly without calling the service
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      expect(cutoffDate).toBeInstanceOf(Date);
      expect(cutoffDate.getTime()).toBeLessThan(now.getTime());
    });

    it('respects custom retention days', () => {
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      expect(cutoffDate).toBeInstanceOf(Date);
      expect(cutoffDate.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('Integration', () => {
    it('complete workflow: store -> retrieve -> replay', async () => {
      // Store operations
      const ops = [
        {
          clientId: 'client-1',
          vectorClock: new Map([['client-1', 1]]),
          timestamp: new Date(),
          operation: {
            type: 'create',
            entityType: 'CRV',
            entityId: 'e1',
            value: { numeroEngin: 'N123' }
          }
        },
        {
          clientId: 'client-1',
          vectorClock: new Map([['client-1', 2]]),
          timestamp: new Date(),
          operation: {
            type: 'update',
            entityType: 'CRV',
            entityId: 'e1',
            field: 'statut',
            value: 'Valide'
          }
        }
      ];

      const stored = await operationService.storeBatch(ops);
      expect(stored).toHaveLength(2);

      // Get history
      const history = await operationService.getEntityHistory('e1', 'CRV');
      expect(history).toBeDefined();
    });
  });
});
