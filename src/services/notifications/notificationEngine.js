/**
 * NOTIFICATION ENGINE — EventBus central (Singleton)
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * EventEmitter Node.js natif — AUCUNE dépendance externe.
 *
 * Caractéristiques:
 * - Émission async non-bloquante (process.nextTick)
 * - Isolation des erreurs (notification ≠ métier)
 * - Statistiques d'émission
 * - Aucun impact sur les temps de réponse HTTP
 */

import { EventEmitter } from 'events';
import { isValidEvent } from './eventRegistry.js';

class NotificationEngine extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // 82 événements + marge
    this.stats = {
      emitted: 0,
      processed: 0,
      failed: 0,
      lastEvent: null,
      lastTimestamp: null
    };
    this._initialized = false;
  }

  /**
   * Émet un événement de manière NON-BLOQUANTE.
   * process.nextTick garantit que la réponse HTTP est envoyée AVANT le traitement.
   *
   * @param {string} eventName - Nom de l'événement (ex: 'CRV_TERMINE')
   * @param {Object} payload - Données de l'événement
   */
  emitAsync(eventName, payload = {}) {
    // Validation basique
    if (!eventName || typeof eventName !== 'string') {
      console.warn('[NotificationEngine] Événement invalide ignoré:', eventName);
      return;
    }

    if (!isValidEvent(eventName)) {
      console.warn(`[NotificationEngine] Événement inconnu ignoré: ${eventName}`);
      return;
    }

    // Stats
    this.stats.emitted++;
    this.stats.lastEvent = eventName;
    this.stats.lastTimestamp = new Date();

    // Enrichir le payload
    const enrichedPayload = {
      ...payload,
      _eventName: eventName,
      _emittedAt: new Date()
    };

    // Émission non-bloquante
    process.nextTick(() => {
      try {
        this.emit(eventName, enrichedPayload);
        this.stats.processed++;
      } catch (error) {
        this.stats.failed++;
        console.error(`[NotificationEngine] Erreur traitement ${eventName}:`, error.message);
        // NE JAMAIS propager l'erreur au code métier
      }
    });
  }

  /**
   * Retourne les statistiques d'émission.
   * @returns {Object} Stats { emitted, processed, failed, lastEvent, lastTimestamp }
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Remet les stats à zéro.
   */
  resetStats() {
    this.stats = { emitted: 0, processed: 0, failed: 0, lastEvent: null, lastTimestamp: null };
  }

  /**
   * Indique si l'engine a été initialisé (listeners enregistrés).
   */
  get isInitialized() {
    return this._initialized;
  }

  /**
   * Marque l'engine comme initialisé.
   */
  markInitialized() {
    this._initialized = true;
    console.log('[NotificationEngine] ✅ Engine initialisé avec', this.listenerCount('*') || 'des', 'listeners');
  }
}

// ─── SINGLETON ────────────────────────────────────────────────
const eventBus = new NotificationEngine();

export { eventBus };
export default eventBus;
