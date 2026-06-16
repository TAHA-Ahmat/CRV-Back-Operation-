/**
 * CRDT Service - Conflict-free Replicated Data Type
 * Implements Last-Write-Wins (LWW) algorithm with vector clocks
 *
 * Key Properties:
 * - Eventual consistency across all clients
 * - Deterministic conflict resolution (no manual merge)
 * - Causal ordering via vector clocks
 * - Idempotent operation application
 */

import { v4 as uuidv4 } from 'uuid';

export class CRDTService {
  constructor() {
    this.vectorClock = new Map(); // Track per-client versions
  }

  /**
   * Create a new vector clock entry for a client
   * @param {string} clientId - Unique client identifier
   * @returns {object} Vector clock object
   */
  createVectorClock(clientId) {
    const clock = {};
    clock[clientId] = 1;
    return clock;
  }

  /**
   * Increment local version in vector clock
   * @param {object} clock - Current vector clock
   * @param {string} clientId - Client making the change
   * @returns {object} Updated vector clock
   */
  incrementClock(clock, clientId) {
    return {
      ...clock,
      [clientId]: (clock[clientId] || 0) + 1
    };
  }

  /**
   * Merge two vector clocks (take max of each component)
   * @param {object} clock1 - First vector clock
   * @param {object} clock2 - Second vector clock
   * @returns {object} Merged vector clock
   */
  mergeClock(clock1, clock2) {
    const merged = { ...clock1 };
    Object.entries(clock2).forEach(([client, version]) => {
      merged[client] = Math.max(merged[client] || 0, version);
    });
    return merged;
  }

  /**
   * Check if clock1 happened-before clock2 (strict causality)
   * @param {object} clock1 - First vector clock
   * @param {object} clock2 - Second vector clock
   * @returns {boolean} True if clock1 < clock2 everywhere
   */
  happensBefore(clock1, clock2) {
    let hasStrictBefore = false;

    for (const [client, v1] of Object.entries(clock1)) {
      const v2 = clock2[client] || 0;
      if (v1 > v2) return false; // clock1 has advanced beyond clock2
      if (v1 < v2) hasStrictBefore = true;
    }

    // Check for clients in clock2 not in clock1
    for (const [client, v2] of Object.entries(clock2)) {
      if (!(client in clock1) && v2 > 0) {
        hasStrictBefore = true;
      }
    }

    return hasStrictBefore;
  }

  /**
   * Check if two clocks are concurrent (neither happens-before)
   * @param {object} clock1 - First vector clock
   * @param {object} clock2 - Second vector clock
   * @returns {boolean} True if clocks are concurrent
   */
  concurrent(clock1, clock2) {
    return !this.happensBefore(clock1, clock2) &&
           !this.happensBefore(clock2, clock1);
  }

  /**
   * Create an operation with CRDT metadata
   * @param {object} options - Operation details
   * @returns {object} Complete operation object
   */
  createOperation({
    clientId,
    type,
    entityType,
    entityId,
    field,
    value,
    previousValue = null,
    userId = null,
    sessionId = null
  }) {
    const vectorClock = this.createVectorClock(clientId);

    return {
      id: uuidv4(),
      clientId,
      vectorClock,
      timestamp: new Date(),
      operation: {
        type, // 'create' | 'update' | 'delete'
        entityType,
        entityId,
        field,
        value,
        previousValue
      },
      metadata: {
        userId,
        sessionId,
        offline: false,
        resolved: false
      }
    };
  }

  /**
   * Last-Write-Wins conflict resolution strategy
   * Resolution order: timestamp (newer wins) → clientId (tie-breaker)
   *
   * @param {object} op1 - First operation
   * @param {object} op2 - Second operation
   * @returns {object} Winner operation
   */
  resolveLWW(op1, op2) {
    // Compare timestamps (millisecond precision)
    const t1 = op1.timestamp.getTime();
    const t2 = op2.timestamp.getTime();

    if (t1 !== t2) {
      return t1 > t2 ? op1 : op2;
    }

    // Timestamps equal: use clientId as deterministic tie-breaker
    // Lexicographic comparison ensures consistent ordering
    return op1.clientId > op2.clientId ? op1 : op2;
  }

  /**
   * Detect if two operations conflict
   * Conflict = same entity, overlapping logical time, different values
   *
   * @param {object} localOp - Local operation
   * @param {object} remoteOp - Remote operation
   * @returns {boolean} True if conflict detected
   */
  isConflict(localOp, remoteOp) {
    // Only same entity operations can conflict
    if (localOp.operation.entityId !== remoteOp.operation.entityId) {
      return false;
    }

    // Different operations on same field
    if (localOp.operation.field !== remoteOp.operation.field) {
      return false;
    }

    // Same operation (idempotent) - no conflict
    if (localOp.id === remoteOp.id) {
      return false;
    }

    // Concurrent operations (neither causally ordered) = conflict
    return this.concurrent(localOp.vectorClock, remoteOp.vectorClock);
  }

  /**
   * Merge two sets of operations into a consistent state
   * - Removes duplicates
   * - Detects conflicts
   * - Returns winner operation for each conflict
   *
   * @param {array} localOps - Local pending operations
   * @param {array} remoteOps - Remote operations from server
   * @returns {object} Merge result with conflicts
   */
  merge(localOps, remoteOps) {
    const allOps = [...localOps, ...remoteOps];
    const conflicts = [];
    const accepted = new Map(); // entityId -> final operation

    // Group operations by entity
    const byEntity = new Map();
    allOps.forEach(op => {
      const entityId = op.operation.entityId;
      if (!byEntity.has(entityId)) {
        byEntity.set(entityId, []);
      }
      byEntity.get(entityId).push(op);
    });

    // Process each entity's operations
    for (const [entityId, ops] of byEntity.entries()) {
      // Deduplicate by operation ID
      const unique = new Map();
      ops.forEach(op => {
        if (!unique.has(op.id) ||
            op.timestamp > unique.get(op.id).timestamp) {
          unique.set(op.id, op);
        }
      });

      const uniqueOps = Array.from(unique.values());

      if (uniqueOps.length === 1) {
        // No conflict
        accepted.set(entityId, uniqueOps[0]);
      } else {
        // Potential conflicts - find winner
        let winner = uniqueOps[0];
        const conflicting = [winner];

        for (let i = 1; i < uniqueOps.length; i++) {
          if (this.isConflict(winner, uniqueOps[i])) {
            conflicting.push(uniqueOps[i]);
            winner = this.resolveLWW(winner, uniqueOps[i]);
          }
        }

        accepted.set(entityId, winner);

        // Record conflict if multiple operations competed
        if (conflicting.length > 1) {
          conflicts.push({
            entityId,
            field: winner.operation.field,
            operations: conflicting,
            resolution: 'lww',
            winner
          });
        }
      }
    }

    return {
      operations: Array.from(accepted.values()),
      conflicts,
      metadata: {
        mergedAt: new Date(),
        totalOps: allOps.length,
        uniqueOps: accepted.size,
        conflictCount: conflicts.length
      }
    };
  }

  /**
   * Apply an operation to an entity state (immutable)
   * @param {object} entity - Current entity state
   * @param {object} operation - Operation to apply
   * @returns {object} Updated entity
   */
  applyOperation(entity, operation) {
    const { type, field, value } = operation.operation;

    switch (type) {
      case 'create':
        return { ...entity, ...value };

      case 'update':
        if (!field) {
          // Full update
          return { ...entity, ...value };
        }
        // Field update
        return { ...entity, [field]: value };

      case 'delete':
        return null;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Build complete operation log from remote ops
   * Updates local vector clock based on remote clock
   *
   * @param {array} remoteOps - Operations from server
   * @param {object} localClock - Current local clock
   * @returns {object} Updated clock and integrated ops
   */
  integrateRemote(remoteOps, localClock) {
    let clock = { ...localClock };

    remoteOps.forEach(op => {
      // Merge remote clock into local
      clock = this.mergeClock(clock, op.vectorClock);
    });

    return {
      operations: remoteOps,
      vectorClock: clock,
      timestamp: new Date()
    };
  }

  /**
   * Get pending operations that haven't been acknowledged
   * @param {object} localVectorClock - Local clock
   * @param {object} serverAcknowledgedClock - Server's acknowledged clock
   * @returns {array} Unacknowledged operations
   */
  getUnacknowledgedOps(localVectorClock, serverAcknowledgedClock) {
    // Operations in local clock but not acknowledged by server
    const pending = {};

    for (const [clientId, version] of Object.entries(localVectorClock)) {
      const acked = serverAcknowledgedClock[clientId] || 0;
      if (version > acked) {
        pending[clientId] = version - acked;
      }
    }

    return pending;
  }
}

export default new CRDTService();
