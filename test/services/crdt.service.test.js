import { describe, it, expect, beforeEach } from 'vitest';
import { CRDTService } from '../../src/services/crdt/crdt.service.js';
import { v4 as uuid } from 'uuid';

describe('CRDT Service', () => {
  let crdt;

  beforeEach(() => {
    crdt = new CRDTService();
  });

  describe('Vector Clock Operations', () => {
    it('creates new vector clock', () => {
      const clock = crdt.createVectorClock('client-1');
      expect(clock).toEqual({ 'client-1': 1 });
    });

    it('increments local version', () => {
      const clock = { 'client-1': 5 };
      const updated = crdt.incrementClock(clock, 'client-1');
      expect(updated['client-1']).toBe(6);
    });

    it('adds new client to clock', () => {
      const clock = { 'client-1': 5 };
      const updated = crdt.incrementClock(clock, 'client-2');
      expect(updated['client-2']).toBe(1);
      expect(updated['client-1']).toBe(5);
    });

    it('merges vector clocks correctly', () => {
      const clock1 = { 'client-1': 5, 'client-2': 3 };
      const clock2 = { 'client-1': 2, 'client-3': 7 };
      const merged = crdt.mergeClock(clock1, clock2);

      expect(merged['client-1']).toBe(5); // max(5, 2)
      expect(merged['client-2']).toBe(3);
      expect(merged['client-3']).toBe(7);
    });

    it('detects happens-before relation', () => {
      const clock1 = { 'client-1': 3 };
      const clock2 = { 'client-1': 5 };
      expect(crdt.happensBefore(clock1, clock2)).toBe(true);
    });

    it('rejects happens-before if vectors diverge', () => {
      const clock1 = { 'client-1': 5, 'client-2': 1 };
      const clock2 = { 'client-1': 3, 'client-2': 2 };
      expect(crdt.happensBefore(clock1, clock2)).toBe(false);
    });

    it('detects concurrent vectors', () => {
      const clock1 = { 'client-1': 5 };
      const clock2 = { 'client-2': 3 };
      expect(crdt.concurrent(clock1, clock2)).toBe(true);
    });

    it('rejects concurrent if one happens-before', () => {
      const clock1 = { 'client-1': 3 };
      const clock2 = { 'client-1': 5 };
      expect(crdt.concurrent(clock1, clock2)).toBe(false);
    });
  });

  describe('Operation Creation', () => {
    it('creates valid operation with metadata', () => {
      const op = crdt.createOperation({
        clientId: 'client-1',
        type: 'create',
        entityType: 'CRV',
        entityId: '123',
        field: null,
        value: { numeroEngin: 'N123' },
        userId: 'user-1',
        sessionId: 'sess-1'
      });

      expect(op.id).toBeTruthy();
      expect(op.clientId).toBe('client-1');
      expect(op.vectorClock).toEqual({ 'client-1': 1 });
      expect(op.timestamp).toBeInstanceOf(Date);
      expect(op.operation.type).toBe('create');
      expect(op.metadata.userId).toBe('user-1');
      expect(op.metadata.offline).toBe(false);
    });

    it('creates operation with previous value', () => {
      const op = crdt.createOperation({
        clientId: 'client-1',
        type: 'update',
        entityType: 'CRV',
        entityId: '123',
        field: 'statut',
        value: 'Valide',
        previousValue: 'Brouillon'
      });

      expect(op.operation.previousValue).toBe('Brouillon');
      expect(op.operation.value).toBe('Valide');
    });
  });

  describe('Conflict Detection (LWW)', () => {
    it('resolves conflict by timestamp (newer wins)', () => {
      const now = new Date();
      const op1 = {
        id: uuid(),
        clientId: 'client-1',
        timestamp: new Date(now.getTime() - 1000), // older
        vectorClock: { 'client-1': 1 },
        operation: { value: 'old' }
      };

      const op2 = {
        id: uuid(),
        clientId: 'client-2',
        timestamp: now, // newer
        vectorClock: { 'client-2': 1 },
        operation: { value: 'new' }
      };

      const winner = crdt.resolveLWW(op1, op2);
      expect(winner.operation.value).toBe('new');
    });

    it('uses clientId as tiebreaker when timestamps equal', () => {
      const timestamp = new Date();
      const op1 = {
        id: uuid(),
        clientId: 'aaa',
        timestamp,
        vectorClock: { aaa: 1 },
        operation: { value: 'value-a' }
      };

      const op2 = {
        id: uuid(),
        clientId: 'zzz',
        timestamp,
        vectorClock: { zzz: 1 },
        operation: { value: 'value-z' }
      };

      const winner = crdt.resolveLWW(op1, op2);
      expect(winner.clientId).toBe('zzz'); // Lexicographically larger
    });

    it('detects concurrent operations as conflicts', () => {
      const baseTime = new Date();
      const op1 = {
        id: uuid(),
        clientId: 'client-1',
        timestamp: baseTime,
        vectorClock: { 'client-1': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Valide'
        }
      };

      const op2 = {
        id: uuid(),
        clientId: 'client-2',
        timestamp: baseTime,
        vectorClock: { 'client-2': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Rejete'
        }
      };

      const isConflict = crdt.isConflict(op1, op2);
      expect(isConflict).toBe(true);
    });

    it('ignores operations on different entities', () => {
      const baseTime = new Date();
      const op1 = {
        id: uuid(),
        clientId: 'client-1',
        timestamp: baseTime,
        vectorClock: { 'client-1': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'A'
        }
      };

      const op2 = {
        id: uuid(),
        clientId: 'client-2',
        timestamp: baseTime,
        vectorClock: { 'client-2': 1 },
        operation: {
          entityId: '456', // Different entity
          field: 'statut',
          value: 'B'
        }
      };

      expect(crdt.isConflict(op1, op2)).toBe(false);
    });

    it('ignores duplicate operations', () => {
      const baseTime = new Date();
      const opId = uuid();
      const op1 = {
        id: opId,
        clientId: 'client-1',
        timestamp: baseTime,
        vectorClock: { 'client-1': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Valide'
        }
      };

      const op2 = { ...op1 }; // Same operation

      expect(crdt.isConflict(op1, op2)).toBe(false);
    });
  });

  describe('Operation Merge', () => {
    it('merges operations without conflicts', () => {
      const baseTime = new Date();
      const op1 = crdt.createOperation({
        clientId: 'client-1',
        type: 'update',
        entityType: 'CRV',
        entityId: '123',
        field: 'statut',
        value: 'Valide'
      });

      const op2 = crdt.createOperation({
        clientId: 'client-2',
        type: 'update',
        entityType: 'CRV',
        entityId: '456', // Different entity
        field: 'statut',
        value: 'Rejete'
      });

      const result = crdt.merge([op1], [op2]);
      expect(result.operations.length).toBe(2);
      expect(result.conflicts.length).toBe(0);
    });

    it('detects conflicts in merge', () => {
      const timestamp = new Date();
      const op1 = {
        id: uuid(),
        clientId: 'client-1',
        timestamp,
        vectorClock: { 'client-1': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Valide',
          type: 'update'
        }
      };

      const op2 = {
        id: uuid(),
        clientId: 'client-2',
        timestamp,
        vectorClock: { 'client-2': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Rejete',
          type: 'update'
        }
      };

      const result = crdt.merge([op1], [op2]);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].entityId).toBe('123');
    });

    it('deduplicates operations by ID', () => {
      const opId = uuid();
      const timestamp = new Date();

      const op1 = {
        id: opId,
        clientId: 'client-1',
        timestamp,
        vectorClock: { 'client-1': 1 },
        operation: {
          entityId: '123',
          field: 'statut',
          value: 'Value1',
          type: 'update'
        }
      };

      const op2 = {
        ...op1,
        timestamp: new Date(timestamp.getTime() + 100) // Slightly newer
      };

      const result = crdt.merge([op1], [op2]);
      expect(result.operations.length).toBe(1);
      expect(result.conflicts.length).toBe(0);
    });

    it('resolves multiple conflicts on same entity', () => {
      const timestamp = new Date();
      const entityId = '123';

      const ops = [
        {
          id: uuid(),
          clientId: 'client-1',
          timestamp,
          vectorClock: { 'client-1': 1 },
          operation: {
            entityId,
            field: 'statut',
            value: 'Valide',
            type: 'update'
          }
        },
        {
          id: uuid(),
          clientId: 'client-2',
          timestamp,
          vectorClock: { 'client-2': 1 },
          operation: {
            entityId,
            field: 'statut',
            value: 'Rejete',
            type: 'update'
          }
        },
        {
          id: uuid(),
          clientId: 'client-3',
          timestamp: new Date(timestamp.getTime() + 1000),
          vectorClock: { 'client-3': 1 },
          operation: {
            entityId,
            field: 'statut',
            value: 'Approuve',
            type: 'update'
          }
        }
      ];

      const result = crdt.merge([ops[0]], [ops[1], ops[2]]);
      expect(result.conflicts.length).toBeGreaterThan(0);
      // Winner should be ops[2] (newest timestamp)
      expect(result.conflicts[0].winner.operation.value).toBe('Approuve');
    });
  });

  describe('Operation Application', () => {
    it('applies create operation', () => {
      const entity = {};
      const op = {
        operation: {
          type: 'create',
          value: { numeroEngin: 'N123', statut: 'Brouillon' }
        }
      };

      const result = crdt.applyOperation(entity, op);
      expect(result.numeroEngin).toBe('N123');
      expect(result.statut).toBe('Brouillon');
    });

    it('applies update operation (full)', () => {
      const entity = { numeroEngin: 'N123', statut: 'Brouillon' };
      const op = {
        operation: {
          type: 'update',
          value: { statut: 'Valide' }
        }
      };

      const result = crdt.applyOperation(entity, op);
      expect(result.statut).toBe('Valide');
      expect(result.numeroEngin).toBe('N123'); // Unchanged
    });

    it('applies update operation (field-level)', () => {
      const entity = { numeroEngin: 'N123', statut: 'Brouillon' };
      const op = {
        operation: {
          type: 'update',
          field: 'statut',
          value: 'Valide'
        }
      };

      const result = crdt.applyOperation(entity, op);
      expect(result.statut).toBe('Valide');
      expect(result.numeroEngin).toBe('N123');
    });

    it('applies delete operation', () => {
      const entity = { numeroEngin: 'N123' };
      const op = {
        operation: {
          type: 'delete'
        }
      };

      const result = crdt.applyOperation(entity, op);
      expect(result).toBeNull();
    });

    it('maintains immutability', () => {
      const entity = { numeroEngin: 'N123' };
      const op = {
        operation: {
          type: 'update',
          field: 'statut',
          value: 'Valide'
        }
      };

      const result = crdt.applyOperation(entity, op);
      expect(entity.statut).toBeUndefined(); // Original unchanged
      expect(result.statut).toBe('Valide');
    });
  });

  describe('Remote Integration', () => {
    it('integrates remote operations into local state', () => {
      const remoteOps = [
        {
          clientId: 'remote-1',
          vectorClock: { 'remote-1': 1 }
        },
        {
          clientId: 'remote-1',
          vectorClock: { 'remote-1': 2 }
        }
      ];

      const localClock = { 'local': 3 };
      const result = crdt.integrateRemote(remoteOps, localClock);

      expect(result.operations.length).toBe(2);
      expect(result.vectorClock['local']).toBe(3);
      expect(result.vectorClock['remote-1']).toBe(2);
    });

    it('identifies unacknowledged operations', () => {
      const localClock = { 'client-1': 5, 'client-2': 3 };
      const serverClock = { 'client-1': 3, 'client-2': 3 };

      const unacked = crdt.getUnacknowledgedOps(localClock, serverClock);
      expect(unacked['client-1']).toBe(2); // 5 - 3
      expect(unacked['client-2']).toBeUndefined(); // Fully acknowledged
    });
  });

  describe('Edge Cases', () => {
    it('handles empty merge', () => {
      const result = crdt.merge([], []);
      expect(result.operations).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('handles very large vector clocks', () => {
      const clock1 = {};
      const clock2 = {};

      for (let i = 0; i < 1000; i++) {
        clock1[`client-${i}`] = i;
        clock2[`client-${i}`] = i + 1;
      }

      const merged = crdt.mergeClock(clock1, clock2);
      expect(Object.keys(merged).length).toBe(1000);
      expect(merged['client-500']).toBe(501);
    });

    it('handles malformed operations gracefully', () => {
      const op = crdt.createOperation({
        clientId: 'client-1',
        type: 'update',
        entityType: 'CRV',
        entityId: '123',
        field: null,
        value: null // Null value
      });

      expect(op.operation.value).toBeNull();
    });
  });
});
