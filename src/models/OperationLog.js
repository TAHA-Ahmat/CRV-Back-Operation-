import { Schema, model } from 'mongoose';

const vectorClockSchema = new Schema(
  {},
  {
    strict: false, // Allow dynamic fields for vector clock
    _id: false
  }
);

const operationLogSchema = new Schema(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
      description: 'Unique device/client identifier'
    },

    vectorClock: {
      type: Map,
      of: Number,
      required: true,
      description: 'Causal ordering tracking per client'
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      description: 'Wall clock time for LWW tiebreaker'
    },

    operation: {
      type: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true,
        description: 'Operation type'
      },

      entityType: {
        type: String,
        enum: ['CRV', 'Phase', 'Vol', 'Aerodrome'],
        required: true,
        description: 'Entity type being modified'
      },

      entityId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
        description: 'ID of modified entity'
      },

      field: {
        type: String,
        description: 'Field name if field-level update',
        sparse: true
      },

      value: {
        type: Schema.Types.Mixed,
        description: 'New value'
      },

      previousValue: {
        type: Schema.Types.Mixed,
        description: 'Previous value for audit/rollback'
      }
    },

    metadata: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        sparse: true,
        description: 'User who triggered operation'
      },

      sessionId: {
        type: String,
        sparse: true,
        description: 'Client session identifier'
      },

      offline: {
        type: Boolean,
        default: false,
        description: 'Was operation generated offline?'
      },

      resolved: {
        type: Boolean,
        default: false,
        description: 'Was conflict resolved?'
      },

      conflictWith: {
        type: Schema.Types.ObjectId,
        ref: 'OperationLog',
        sparse: true,
        description: 'Reference to conflicting operation if any'
      }
    }
  },
  {
    timestamps: true,
    collection: 'operation_logs',
    indexes: [
      { clientId: 1, timestamp: 1 },
      { 'operation.entityId': 1, timestamp: 1 },
      { timestamp: 1 },
      { offline: 1, resolved: 1 } // For queue scanning
    ]
  }
);

// Ensure immutability - no updates after creation
operationLogSchema.pre('findByIdAndUpdate', function (next) {
  const error = new Error('OperationLog documents are immutable');
  error.statusCode = 400;
  next(error);
});

operationLogSchema.pre('updateOne', function (next) {
  const error = new Error('OperationLog documents are immutable');
  error.statusCode = 400;
  next(error);
});

operationLogSchema.pre('updateMany', function (next) {
  const error = new Error('OperationLog documents are immutable');
  error.statusCode = 400;
  next(error);
});

// Index for sync queries
operationLogSchema.index({
  clientId: 1,
  'metadata.resolved': 1,
  timestamp: 1
});

// TTL index - keep operation logs for 30 days then archive
operationLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 } // 30 days
);

export const OperationLog = model('OperationLog', operationLogSchema);
export default OperationLog;
