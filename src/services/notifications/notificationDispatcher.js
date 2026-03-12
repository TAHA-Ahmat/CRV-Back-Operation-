/**
 * NOTIFICATION DISPATCHER — Distribue aux canaux activés
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Reçoit une notification résolue (destinataire + canaux actifs) et dispatch.
 * Exécution parallèle des canaux. Isolation des erreurs par canal.
 */

import * as inAppChannel from './channels/inAppChannel.js';
import * as emailChannel from './channels/emailChannel.js';
import * as whatsappChannel from './channels/whatsappChannel.js';

// ─── REGISTRE DES CANAUX ─────────────────────────────────────
const CHANNELS = {
  inApp: inAppChannel,
  email: emailChannel,
  whatsapp: whatsappChannel
};

/**
 * Dispatche une notification vers les canaux activés.
 * Exécution PARALLÈLE — chaque canal est isolé.
 *
 * @param {Object} destinataire - { _id, nom, email, telephone }
 * @param {string} titre - Titre du message (template appliqué)
 * @param {string} message - Corps du message (template appliqué)
 * @param {Object} activeChannels - { inApp: true, email: false, whatsapp: false }
 * @param {Object} context - Contexte de l'événement
 * @returns {Object} { results: { inApp: {...}, email: {...}, whatsapp: {...} }, summary }
 */
export async function dispatch(destinataire, titre, message, activeChannels, context = {}) {
  const results = {};
  const promises = [];

  for (const [channelName, isActive] of Object.entries(activeChannels)) {
    if (!isActive) {
      results[channelName] = { skipped: true, reason: 'disabled' };
      continue;
    }

    const channel = CHANNELS[channelName];
    if (!channel) {
      results[channelName] = { skipped: true, reason: 'unknown_channel' };
      continue;
    }

    // Lancer chaque canal en parallèle (avec isolation d'erreur)
    const promise = channel.send(destinataire, titre, message, context)
      .then(result => {
        results[channelName] = result;
      })
      .catch(error => {
        // ISOLATION : erreur d'un canal ne bloque JAMAIS les autres
        console.error(`[Dispatcher] Erreur canal ${channelName}:`, error.message);
        results[channelName] = { success: false, error: error.message, isolated: true };
      });

    promises.push(promise);
  }

  // Attendre tous les canaux en parallèle
  await Promise.allSettled(promises);

  // Résumé
  const sent = Object.entries(results).filter(([, r]) => r.success).length;
  const failed = Object.entries(results).filter(([, r]) => r.success === false && !r.skipped).length;
  const skipped = Object.entries(results).filter(([, r]) => r.skipped).length;

  return {
    results,
    summary: { sent, failed, skipped, total: Object.keys(results).length }
  };
}

/**
 * Retourne la liste des canaux disponibles.
 */
export function getAvailableChannels() {
  return Object.keys(CHANNELS);
}
