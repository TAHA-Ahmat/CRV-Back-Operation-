import mongoose from 'mongoose';

const CRVEventSchema = new mongoose.Schema(
  {
    crvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CRV',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'CRV_CREATED',
        'PHASE_STARTED',
        'PHASE_COMPLETED',
        'PHASE_ABORTED',
        'PERSONNEL_ADDED',
        'PERSONNEL_REMOVED',
        'PERSONNEL_UPDATED',
        'ENGIN_ASSIGNED',
        'ENGIN_REMOVED',
        'INCIDENT_REPORTED',
        'CRV_TERMINATED',
        'CRV_VALIDATED',
        'CRV_LOCKED',
        'CRV_UNLOCKED',
        'CRV_CANCELLED',
        'CRV_REACTIVATED',
        'CHARGE_ADDED',
        'CHARGE_UPDATED',
        'OBSERVATION_ADDED',
      ],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    collection: 'crv_events',
  }
);

// Index composé pour requêtes fréquentes
CRVEventSchema.index({ crvId: 1, timestamp: -1 });
CRVEventSchema.index({ crvId: 1, type: 1 });

export default mongoose.model('CRVEvent', CRVEventSchema);
