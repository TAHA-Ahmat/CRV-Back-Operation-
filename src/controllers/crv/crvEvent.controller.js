import {
  listerEvenementsCRV as listerEvenementsService,
  statsEvenementsCRV as statsEvenementsService,
} from '../../services/crv/crvEvent.service.js';

/**
 * GET /api/crv/:id/events
 * Liste les événements CRVEvent journalisés pour un CRV.
 * Query params : limit (default 100), type (optionnel).
 */
export async function listerEvenementsCRV(req, res) {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const type = req.query.type || null;
    const events = await listerEvenementsService(id, { limit, type });
    return res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[crvEvent.controller] listerEvenementsCRV:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/crv/:id/events/stats
 * Agrégat des événements CRV par type.
 */
export async function statsEvenementsCRV(req, res) {
  try {
    const { id } = req.params;
    const stats = await statsEvenementsService(id);
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('[crvEvent.controller] statsEvenementsCRV:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export default { listerEvenementsCRV, statsEvenementsCRV };
