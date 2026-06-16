/**
 * Sync Controller - Handles offline sync endpoints
 * Entry point for client synchronization requests
 */

import mergeService from '../services/crdt/merge.service.js';
import operationService from '../services/crdt/operation.service.js';
import crdtService from '../services/crdt/crdt.service.js';

export class SyncController {
  /**
   * POST /api/v1/sync
   * Main sync endpoint - clients send pending ops, receive server ops
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async syncOperations(req, res) {
    try {
      const { clientId, lastSyncVector, pendingOperations } = req.body;
      const userId = req.user?.id;
      const sessionId = req.sessionID;

      // Validate request
      if (!clientId) {
        return res.status(400).json({
          error: 'clientId required',
          code: 'MISSING_CLIENT_ID'
        });
      }

      if (!lastSyncVector || typeof lastSyncVector !== 'object') {
        return res.status(400).json({
          error: 'lastSyncVector required',
          code: 'INVALID_VECTOR_CLOCK'
        });
      }

      if (!Array.isArray(pendingOperations)) {
        return res.status(400).json({
          error: 'pendingOperations must be array',
          code: 'INVALID_OPERATIONS'
        });
      }

      // Perform merge
      const result = await mergeService.mergeSyncOperations({
        clientId,
        lastSyncVector,
        pendingOperations,
        userId,
        sessionId
      });

      // Return sync response
      res.status(200).json({
        success: true,
        data: {
          serverOperations: result.serverOperations,
          acknowledgedVersion: result.acknowledgedVersion,
          conflicts: result.conflicts,
          nextSyncToken: result.nextSyncToken,
          timestamp: result.timestamp,
          stats: {
            receivedOps: pendingOperations.length,
            serverOps: result.serverOperations.length,
            conflicts: result.conflicts.length,
            merged: result.mergedOperations.length
          }
        }
      });

    } catch (error) {
      console.error('Sync error:', error);

      res.status(500).json({
        error: error.message,
        code: 'SYNC_ERROR'
      });
    }
  }

  /**
   * GET /api/v1/sync/status
   * Get current sync status and pending operations
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getSyncStatus(req, res) {
    try {
      const { clientId } = req.query;

      if (!clientId) {
        return res.status(400).json({
          error: 'clientId required'
        });
      }

      // Get stats
      const stats = await operationService.getSyncStats();
      const clientStats = stats.byClient.find(c => c._id === clientId);

      res.status(200).json({
        success: true,
        data: {
          clientId,
          stats: {
            totalOpsFromClient: clientStats?.count || 0,
            lastSync: clientStats?.lastOp || null,
            globalOperations: stats.totalOperations,
            pendingSync: stats.pendingSync,
            conflicts: stats.conflicts
          }
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/sync/conflicts
   * List unresolved conflicts
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getConflicts(req, res) {
    try {
      const { entityId } = req.query;

      let conflicts;
      if (entityId) {
        conflicts = await operationService.getConflicts(entityId);
      } else {
        conflicts = await operationService.getConflicts(null);
      }

      const summary = await mergeService.getConflictSummary(req.user?.id);

      res.status(200).json({
        success: true,
        data: {
          conflicts: mergeService.getConflictDetails(
            conflicts.map(c => ({
              entityId: c._id,
              field: c.operation.field,
              operations: [c]
            }))
          ),
          summary
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/sync/resolve-conflict
   * Manually resolve a conflict
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async resolveConflict(req, res) {
    try {
      const { conflictId, resolution, mergedValue } = req.body;
      const userId = req.user?.id;

      if (!conflictId || !resolution) {
        return res.status(400).json({
          error: 'conflictId and resolution required'
        });
      }

      const result = await mergeService.resolveConflictManually({
        conflictId,
        resolution,
        mergedValue,
        userId
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/sync/history/:entityId
   * Get operation history for an entity
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getEntityHistory(req, res) {
    try {
      const { entityId } = req.params;
      const { entityType, since } = req.query;

      if (!entityType) {
        return res.status(400).json({
          error: 'entityType required'
        });
      }

      const sinceDate = since ? new Date(since) : null;
      const history = await operationService.getEntityHistory(
        entityId,
        entityType,
        sinceDate
      );

      res.status(200).json({
        success: true,
        data: {
          entityId,
          entityType,
          operationCount: history.length,
          operations: history
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/sync/test-merge
   * Test merge algorithm without persisting (for debugging)
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async testMerge(req, res) {
    try {
      const { localOps, remoteOps } = req.body;

      if (!Array.isArray(localOps) || !Array.isArray(remoteOps)) {
        return res.status(400).json({
          error: 'localOps and remoteOps arrays required'
        });
      }

      const result = crdtService.merge(localOps, remoteOps);

      res.status(200).json({
        success: true,
        data: {
          mergedOps: result.operations.length,
          conflicts: result.conflicts,
          details: result.metadata
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/sync/operations/:operationId
   * Get details of a specific operation
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getOperation(req, res) {
    try {
      const { operationId } = req.params;

      const operation = await operationService.getOperation(operationId);

      if (!operation) {
        return res.status(404).json({
          error: 'Operation not found'
        });
      }

      res.status(200).json({
        success: true,
        data: operation
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new SyncController();
