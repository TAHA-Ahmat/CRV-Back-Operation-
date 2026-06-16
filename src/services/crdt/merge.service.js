/**
 * Merge Service - Handles conflict resolution and state merging
 * Implements LWW strategy and provides conflict reporting
 */

import crdtService from './crdt.service.js';
import operationService from './operation.service.js';

export class MergeService {
  /**
   * Merge client operations with server state
   * Main entry point for sync requests
   *
   * @param {object} options - Sync request parameters
   * @returns {object} Merge result with resolved state
   */
  async mergeSyncOperations({
    clientId,
    lastSyncVector,
    pendingOperations,
    userId,
    sessionId
  }) {
    // Step 1: Validate inputs
    if (!clientId || !lastSyncVector || !pendingOperations) {
      throw new Error('Missing required sync parameters');
    }

    // Step 2: Store client operations
    const enrichedOps = pendingOperations.map(op => ({
      ...op,
      clientId,
      metadata: {
        ...op.metadata,
        userId,
        sessionId
      }
    }));

    const storedOps = await operationService.storeBatch(enrichedOps);

    // Step 3: Get new operations from other clients
    const serverOps = await operationService.getNewOperations(
      lastSyncVector,
      clientId
    );

    // Step 4: Merge local and remote operations
    const mergeResult = crdtService.merge(storedOps, serverOps);

    // Step 5: Build conflict report
    const conflicts = mergeResult.conflicts.map(conflict => ({
      entityId: conflict.entityId,
      field: conflict.field,
      clientId: conflict.operations[0].clientId,
      localOp: conflict.operations.find(o => o.clientId === clientId),
      remoteOps: conflict.operations.filter(o => o.clientId !== clientId),
      resolution: 'lww',
      winner: conflict.winner
    }));

    // Step 6: Calculate new acknowledged vector clock
    const newClock = this.calculateAcknowledgedClock(
      lastSyncVector,
      [...storedOps, ...serverOps]
    );

    return {
      success: true,
      serverOperations: serverOps,
      acknowledgedVersion: newClock,
      conflicts: conflicts.length > 0 ? conflicts : [],
      mergedOperations: mergeResult.operations,
      metadata: mergeResult.metadata,
      timestamp: new Date(),
      nextSyncToken: this.generateSyncToken(clientId, newClock)
    };
  }

  /**
   * Calculate the new acknowledged vector clock after sync
   * @param {object} previousClock - Previous clock state
   * @param {array} allOperations - All ops processed
   * @returns {object} Updated clock
   */
  calculateAcknowledgedClock(previousClock, allOperations) {
    let clock = { ...previousClock };

    allOperations.forEach(op => {
      if (op.vectorClock) {
        clock = crdtService.mergeClock(clock, op.vectorClock);
      }
    });

    return clock;
  }

  /**
   * Generate a sync token for client to use in next sync
   * @param {string} clientId - Client ID
   * @param {object} clock - Current vector clock
   * @returns {string} Sync token (base64 encoded)
   */
  generateSyncToken(clientId, clock) {
    const token = {
      clientId,
      clock,
      generated: new Date().toISOString()
    };

    return Buffer.from(JSON.stringify(token)).toString('base64');
  }

  /**
   * Parse sync token from client
   * @param {string} token - Base64 sync token
   * @returns {object} Decoded token
   */
  parseSyncToken(token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid sync token');
    }
  }

  /**
   * Detect and return detailed conflict information
   * @param {array} conflicts - Conflict objects from merge
   * @returns {array} Detailed conflict reports
   */
  getConflictDetails(conflicts) {
    return conflicts.map(conflict => {
      const local = conflict.localOp;
      const remote = conflict.remoteOps[0]; // Take first remote

      return {
        entityId: conflict.entityId,
        field: conflict.field,
        local: {
          clientId: local.clientId,
          value: local.operation.value,
          timestamp: local.timestamp,
          userId: local.metadata.userId
        },
        remote: remote ? {
          clientId: remote.clientId,
          value: remote.operation.value,
          timestamp: remote.timestamp,
          userId: remote.metadata.userId
        } : null,
        winner: conflict.winner.clientId,
        reason: this.getResolutionReason(local, remote),
        recommendation: this.getResolutionRecommendation(local, remote)
      };
    });
  }

  /**
   * Explain why LWW resolved a conflict
   * @param {object} local - Local operation
   * @param {object} remote - Remote operation
   * @returns {string} Human-readable reason
   */
  getResolutionReason(local, remote) {
    if (!remote) {
      return 'No remote conflict';
    }

    const localTime = new Date(local.timestamp).getTime();
    const remoteTime = new Date(remote.timestamp).getTime();

    if (localTime !== remoteTime) {
      return localTime > remoteTime
        ? 'Your change was more recent'
        : 'Server change was more recent';
    }

    const localWins = local.clientId > remote.clientId;
    return localWins
      ? 'Tiebreaker: your client ID is larger'
      : 'Tiebreaker: server client ID is larger';
  }

  /**
   * Get recommendation for conflict resolution
   * @param {object} local - Local operation
   * @param {object} remote - Remote operation
   * @returns {string} Recommendation
   */
  getResolutionRecommendation(local, remote) {
    if (!remote) {
      return 'No action needed';
    }

    // If local is offline, recommend reviewing remote
    if (local.metadata.offline) {
      return 'You were offline. Server change was applied.';
    }

    // If times are very close, might be simultaneous
    const timeDiff = Math.abs(
      new Date(local.timestamp).getTime() -
      new Date(remote.timestamp).getTime()
    );

    if (timeDiff < 1000) {
      return 'Nearly simultaneous changes detected. Consider manual review.';
    }

    return 'Conflict resolved automatically by timestamp.';
  }

  /**
   * Handle user-initiated conflict resolution
   * User chooses to accept/reject/merge
   *
   * @param {object} options - Resolution choice
   * @returns {object} Resolution result
   */
  async resolveConflictManually({
    conflictId,
    resolution, // 'accept' | 'reject' | 'merge'
    mergedValue = null,
    userId
  }) {
    const conflict = await operationService.getOperation(conflictId);

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const result = {
      conflictId,
      resolution,
      resolvedBy: userId,
      resolvedAt: new Date(),
      finalValue: null
    };

    switch (resolution) {
      case 'accept':
        // Keep remote (winner from LWW)
        result.finalValue = conflict.operation.value;
        break;

      case 'reject':
        // Keep local (loser from LWW)
        result.finalValue = conflict.metadata.previousValue;
        break;

      case 'merge':
        if (!mergedValue) {
          throw new Error('Merged value required for merge resolution');
        }
        result.finalValue = mergedValue;
        break;

      default:
        throw new Error(`Unknown resolution type: ${resolution}`);
    }

    return result;
  }

  /**
   * Get conflict summary for dashboard
   * @param {string} clientId - Client to get summary for
   * @returns {object} Conflict statistics
   */
  async getConflictSummary(clientId) {
    const conflicts = await operationService.getConflicts(null);

    const byClient = {};
    const byType = {};

    conflicts.forEach(conflict => {
      // Count by client
      if (!byClient[conflict.clientId]) {
        byClient[conflict.clientId] = 0;
      }
      byClient[conflict.clientId]++;

      // Count by type
      const type = conflict.operation.type;
      if (!byType[type]) {
        byType[type] = 0;
      }
      byType[type]++;
    });

    return {
      totalConflicts: conflicts.length,
      conflictsByClient: byClient,
      conflictsByType: byType,
      unresolvedCount: conflicts.filter(c => !c.metadata.resolved).length,
      timestamp: new Date()
    };
  }
}

export default new MergeService();
