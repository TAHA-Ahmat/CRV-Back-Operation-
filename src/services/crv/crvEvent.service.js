import CRVEvent from '../../models/crv/CRVEvent.js';

/**
 * Journalise un évènement dans la collection crv_events.
 * Utilisé par les wrappers controllers (charges, engins, personnel, événements, observations).
 * Non-bloquant : si l'écriture échoue, on log et on continue (pas de throw vers l'appelant).
 */
export async function logCRVEvent({ crvId, type, userId, payload = {} }) {
  if (!crvId || !type || !userId) {
    console.warn('[CRVEvent] logCRVEvent: crvId, type et userId requis — skip', { crvId, type, userId });
    return null;
  }
  try {
    const event = await CRVEvent.create({ crvId, type, userId, payload });
    return event;
  } catch (err) {
    console.error('[CRVEvent] écriture échouée:', err.message);
    return null;
  }
}

export async function listerEvenementsCRV(crvId, { limit = 100, type = null } = {}) {
  const query = { crvId };
  if (type) query.type = type;
  return CRVEvent.find(query).sort({ timestamp: -1 }).limit(limit).lean();
}

export async function statsEvenementsCRV(crvId) {
  return CRVEvent.aggregate([
    { $match: { crvId } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

export default { logCRVEvent, listerEvenementsCRV, statsEvenementsCRV };
