/**
 * Operation Service - Manages operation log and persistence
 * Handles storing, retrieving, and querying operations
 */

import OperationLog from '../../models/OperationLog.js';
import crdtService from './crdt.service.js';

export class OperationService {
  /**
   * Store a single operation to the log
   * @param {object} operation - Operation object
   * @returns {object} Stored operation with MongoDB ID
   */
  async storeOperation(operation) {
    const doc = new OperationLog(operation);
    const stored = await doc.save();
    return stored.toObject();
  }

  /**
   * Store multiple operations in batch
   * Optimized for bulk insert with no individual validation
   *
   * @param {array} operations - Array of operation objects
   * @returns {array} Stored operations
   */
  async storeBatch(operations) {
    if (!operations || operations.length === 0) {
      return [];
    }

    const docs = await OperationLog.insertMany(operations, {
      ordered: false // Continue on error
    });

    return docs.map(doc => doc.toObject());
  }

  /**
   * Get operations newer than a given vector clock
   * Used for sync - returns only remote ops client hasn't seen
   *
   * @param {object} clientClock - Client's current vector clock
   * @param {string} clientId - Client ID requesting sync
   * @returns {array} Operations client hasn't acknowledged
   */
  async getNewOperations(clientClock, clientId) {
    // Find ops from other clients that client hasn't seen yet
    const query = {
      clientId: { $ne: clientId }
    };

    // For each client in the database, check if local clock is behind
    const allOps = await OperationLog.find(query)
      .sort({ timestamp: 1 })
      .lean();

    // Filter: only include ops that local client hasn't seen
    return allOps.filter(op => {
      const remoteVersion = op.vectorClock.get(op.clientId) || 0;
      const localVersion = clientClock[op.clientId] || 0;
      return remoteVersion > localVersion;
    });
  }

  /**
   * Get operations for a specific entity since a timestamp
   * Used for rebuilding entity state or audit trail
   *
   * @param {string} entityId - Entity to fetch history for
   * @param {string} entityType - Type of entity
   * @param {Date} since - Only ops after this timestamp
   * @returns {array} Operations affecting entity
   */
  async getEntityHistory(entityId, entityType, since = null) {
    const query = {
      'operation.entityId': entityId,
      'operation.entityType': entityType
    };

    if (since) {
      query.timestamp = { $gt: since };
    }

    return OperationLog.find(query)
      .sort({ timestamp: 1 })
      .lean();
  }

  /**
   * Get unacknowledged operations from a client
   * Used to determine what still needs to sync
   *
   * @param {string} clientId - Client ID
   * @param {object} serverAcknowledgedClock - What server has acked
   * @returns {array} Operations not yet acknowledged
   */
  async getUnacknowledgedOps(clientId, serverAcknowledgedClock) {
    const ackedVersion = serverAcknowledgedClock[clientId] || 0;

    return OperationLog.find({
      clientId,
      'metadata.offline': true // Only unsynced ops
    })
      .sort({ timestamp: 1 })
      .lean();
  }

  /**
   * Mark operations as resolved/acknowledged
   * @param {array} operationIds - IDs to mark
   * @param {boolean} resolved - Resolved status
   */
  async markResolved(operationIds, resolved = true) {
    if (!operationIds || operationIds.length === 0) {
      return;
    }

    // Note: Can't use updateMany due to immutability constraints
    // Instead, return metadata for client-side tracking
    return {
      marked: operationIds.length,
      note: 'Operations tracked but not mutated (immutable log)'
    };
  }

  /**
   * Get operation by ID
   * @param {string} operationId - Operation ID
   * @returns {object} Operation details
   */
  async getOperation(operationId) {
    return OperationLog.findById(operationId).lean();
  }

  /**
   * Find conflicts for a specific entity
   * @param {string} entityId - Entity ID
   * @returns {array} Operations marked as conflicted
   */
  async getConflicts(entityId) {
    return OperationLog.find({
      'operation.entityId': entityId,
      'metadata.resolved': false,
      'metadata.conflictWith': { $exists: true }
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Cleanup old operations (archive to separate collection)
   * @param {number} daysToKeep - Keep operations from last N days
   */
  async archiveOldOperations(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldOps = await OperationLog.find({
      createdAt: { $lt: cutoffDate }
    }).lean();

    if (oldOps.length > 0) {
      // Could move to archive collection here
      // For now, MongoDB TTL index will auto-delete
    }

    return {
      archivedCount: oldOps.length,
      cutoffDate
    };
  }

  /**
   * Get sync stats for monitoring
   * @returns {object} Sync statistics
   */
  async getSyncStats() {
    const total = await OperationLog.countDocuments();

    const pending = await OperationLog.countDocuments({
      'metadata.offline': true
    });

    const conflicts = await OperationLog.countDocuments({
      'metadata.conflictWith': { $exists: true }
    });

    const byClient = await OperationLog.aggregate([
      {
        $group: {
          _id: '$clientId',
          count: { $sum: 1 },
          lastOp: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      totalOperations: total,
      pendingSync: pending,
      conflicts,
      byClient,
      timestamp: new Date()
    };
  }

  /**
   * Replay operations on an entity to rebuild state
   * @param {object} initialState - Starting entity state
   * @param {array} operations - Operations to apply
   * @returns {object} Final entity state
   */
  replayOperations(initialState, operations) {
    let state = { ...initialState };

    operations.forEach(op => {
      state = crdtService.applyOperation(state, op);
    });

    return state;
  }
}

export default new OperationService();
