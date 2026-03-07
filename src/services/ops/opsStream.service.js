/**
 * OPS STREAM SERVICE — Centre de Contrôle Opérationnel Temps Réel
 *
 * MODULE OPS CONTROL CENTER v1.0.0
 * Subscriber passif sur l'EventBus existant.
 * Broadcast SSE vers les clients connectés.
 *
 * RÈGLES :
 * - NE JAMAIS émettre d'événement sur l'EventBus
 * - Écoute uniquement via eventBus.on()
 * - Buffer FIFO chronologique (push + shift)
 * - Isolation totale du moteur de notifications
 */

import { EVENTS } from '../notifications/eventRegistry.js';
import CRV from '../../models/crv/CRV.js';

// ─── ÉVÉNEMENTS OPS SURVEILLÉS (9) ──────────────────────────
const OPS_EVENTS = [
  EVENTS.CRV_TERMINE,
  EVENTS.CRV_PRET_VALIDATION,
  EVENTS.CRV_VALIDE,
  EVENTS.CRV_VERROUILLE,
  EVENTS.CRV_ANNULE,
  EVENTS.CRV_INCIDENT_CRITIQUE,
  EVENTS.SLA_CRV_DEPASSE,
  EVENTS.SLA_PHASE_DEPASSE,
  EVENTS.PHASE_NON_REALISEE
];

// ─── LABELS HUMAINS PAR ÉVÉNEMENT ───────────────────────────
const EVENT_LABELS = {
  [EVENTS.CRV_TERMINE]: 'CRV terminé',
  [EVENTS.CRV_PRET_VALIDATION]: 'CRV prêt pour validation',
  [EVENTS.CRV_VALIDE]: 'CRV validé',
  [EVENTS.CRV_VERROUILLE]: 'CRV verrouillé',
  [EVENTS.CRV_ANNULE]: 'CRV annulé',
  [EVENTS.CRV_INCIDENT_CRITIQUE]: 'Incident critique',
  [EVENTS.SLA_CRV_DEPASSE]: 'SLA CRV dépassé',
  [EVENTS.SLA_PHASE_DEPASSE]: 'SLA phase dépassé',
  [EVENTS.PHASE_NON_REALISEE]: 'Phase non réalisée'
};

// ─── PRIORITÉ PAR ÉVÉNEMENT ─────────────────────────────────
const EVENT_PRIORITY = {
  [EVENTS.CRV_INCIDENT_CRITIQUE]: 'CRITIQUE',
  [EVENTS.SLA_CRV_DEPASSE]: 'HAUTE',
  [EVENTS.SLA_PHASE_DEPASSE]: 'HAUTE',
  [EVENTS.PHASE_NON_REALISEE]: 'HAUTE',
  [EVENTS.CRV_ANNULE]: 'HAUTE',
  [EVENTS.CRV_TERMINE]: 'NORMALE',
  [EVENTS.CRV_PRET_VALIDATION]: 'NORMALE',
  [EVENTS.CRV_VALIDE]: 'NORMALE',
  [EVENTS.CRV_VERROUILLE]: 'BASSE'
};

// ─── BUFFER FIFO ────────────────────────────────────────────
const MAX_BUFFER_SIZE = 50;

class OpsStreamService {
  constructor() {
    this._initialized = false;
    this._clients = new Map(); // clientId → { res, connectedAt }
    this._events = [];          // Buffer FIFO chronologique
    this._heartbeatInterval = null;
    this._clientCounter = 0;
  }

  // ─── INITIALISATION ─────────────────────────────────────────
  /**
   * S'abonne aux événements métier sur l'EventBus.
   * Appelé une seule fois au démarrage depuis initNotificationEngine.
   * @param {EventEmitter} eventBus — Instance singleton NotificationEngine
   */
  init(eventBus) {
    if (this._initialized) {
      console.log('[OPS] Stream service déjà initialisé — skip');
      return;
    }

    // S'abonner aux 9 événements OPS
    for (const eventName of OPS_EVENTS) {
      eventBus.on(eventName, (payload) => {
        this._onEvent(eventName, payload);
      });
    }

    // Démarrer le heartbeat
    this._startHeartbeat();

    this._initialized = true;
    console.log(`[OPS] Stream service initialisé — ${OPS_EVENTS.length} événements surveillés`);
  }

  // ─── GESTION DES ÉVÉNEMENTS ─────────────────────────────────
  /**
   * Callback quand un événement métier est reçu.
   * Ajoute au buffer FIFO et broadcast aux clients SSE.
   */
  _onEvent(eventName, payload) {
    const event = {
      id: `ops-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: eventName,
      label: EVENT_LABELS[eventName] || eventName,
      priority: EVENT_PRIORITY[eventName] || 'NORMALE',
      timestamp: new Date().toISOString(),
      data: {
        crvId: payload.crvId || payload.referenceId || null,
        numeroCRV: payload.numeroCRV || payload.reference || null,
        userId: payload.userId || null,
        userName: payload.userName || null,
        details: payload.details || payload.message || null
      }
    };

    // Buffer FIFO : push en fin (chronologique), shift si > max
    this._events.push(event);
    if (this._events.length > MAX_BUFFER_SIZE) {
      this._events.shift();
    }

    // Broadcast à tous les clients SSE
    this._broadcast(event);

    console.log(`[OPS] Événement reçu: ${eventName} → ${this._clients.size} client(s)`);
  }

  // ─── GESTION DES CLIENTS SSE ────────────────────────────────
  /**
   * Ajoute un client SSE (connexion HTTP keep-alive).
   * @param {Response} res — Objet Response Express
   * @returns {string} clientId
   */
  addClient(res) {
    const clientId = `client-${++this._clientCounter}-${Date.now()}`;

    this._clients.set(clientId, {
      res,
      connectedAt: new Date()
    });

    console.log(`[OPS] Client SSE connecté: ${clientId} (total: ${this._clients.size})`);
    return clientId;
  }

  /**
   * Retire un client SSE.
   * @param {string} clientId
   */
  removeClient(clientId) {
    if (this._clients.has(clientId)) {
      this._clients.delete(clientId);
      console.log(`[OPS] Client SSE déconnecté: ${clientId} (total: ${this._clients.size})`);
    }
  }

  /**
   * Retourne le buffer d'événements (pour envoi initial à un nouveau client).
   * @returns {Array}
   */
  getBuffer() {
    return [...this._events];
  }

  // ─── BROADCAST SSE ──────────────────────────────────────────
  /**
   * Envoie un événement à tous les clients SSE connectés.
   * @param {Object} event — Événement formaté
   */
  _broadcast(event) {
    const data = JSON.stringify(event);
    const deadClients = [];

    for (const [clientId, client] of this._clients) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        // Client mort — marquer pour suppression
        deadClients.push(clientId);
      }
    }

    // Nettoyer les clients morts
    for (const clientId of deadClients) {
      this.removeClient(clientId);
    }
  }

  // ─── HEARTBEAT ──────────────────────────────────────────────
  /**
   * Envoie un heartbeat toutes les 30 secondes pour maintenir les connexions SSE.
   */
  _startHeartbeat() {
    this._heartbeatInterval = setInterval(() => {
      const deadClients = [];

      for (const [clientId, client] of this._clients) {
        try {
          client.res.write(': heartbeat\n\n');
        } catch (err) {
          deadClients.push(clientId);
        }
      }

      for (const clientId of deadClients) {
        this.removeClient(clientId);
      }
    }, 30000); // 30 secondes
  }

  // ─── DASHBOARD SNAPSHOT ─────────────────────────────────────
  /**
   * Agrège les statistiques pour le dashboard OPS.
   * @returns {Object} Snapshot des opérations en cours
   */
  async getSnapshot() {
    try {
      // CRV par statut — readPreference secondaryPreferred pour éviter
      // les write conflicts avec les transactions CRV actives (Bug #2 Mission 027)
      const crvStats = await CRV.aggregate([
        {
          $group: {
            _id: '$statut',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).read('secondaryPreferred').option({ readConcern: { level: 'local' } });

      // Formater les stats CRV
      const crvByStatus = {};
      const statusList = ['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE'];
      for (const s of statusList) {
        crvByStatus[s] = 0;
      }
      for (const stat of crvStats) {
        if (statusList.includes(stat._id)) {
          crvByStatus[stat._id] = stat.count;
        }
      }

      // Total CRV
      const totalCRV = Object.values(crvByStatus).reduce((a, b) => a + b, 0);

      // CRV en cours (actifs = EN_COURS + TERMINE)
      const crvActifs = crvByStatus.EN_COURS + crvByStatus.TERMINE;

      // Alertes actives (événements CRITIQUE et HAUTE dans le buffer)
      const alertes = this._events.filter(e =>
        e.priority === 'CRITIQUE' || e.priority === 'HAUTE'
      );

      // Derniers événements (10 max)
      const recentEvents = this._events.slice(-10).reverse();

      return {
        timestamp: new Date().toISOString(),
        crvByStatus,
        totalCRV,
        crvActifs,
        alertes: alertes.length,
        alertesDetail: alertes.slice(-10).reverse(),
        recentEvents,
        clients: this._clients.size
      };
    } catch (error) {
      console.error('[OPS] Erreur snapshot:', error.message);
      return {
        timestamp: new Date().toISOString(),
        crvByStatus: {},
        totalCRV: 0,
        crvActifs: 0,
        alertes: 0,
        alertesDetail: [],
        recentEvents: this._events.slice(-10).reverse(),
        clients: this._clients.size,
        error: 'Erreur agrégation MongoDB'
      };
    }
  }

  // ─── STATS ──────────────────────────────────────────────────
  getStats() {
    return {
      initialized: this._initialized,
      connectedClients: this._clients.size,
      bufferSize: this._events.length,
      eventsMonitored: OPS_EVENTS.length
    };
  }
}

// ─── SINGLETON ────────────────────────────────────────────────
const opsStream = new OpsStreamService();

export default opsStream;
export { OPS_EVENTS, EVENT_LABELS };
