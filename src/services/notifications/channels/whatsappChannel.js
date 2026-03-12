/**
 * WHATSAPP CHANNEL — STUB (architecture prête, implémentation future)
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Log uniquement. Aucune intégration externe.
 */

/**
 * Envoie une notification WhatsApp (STUB).
 * @param {Object} destinataire - { _id, nom, telephone }
 * @param {string} titre - Titre du message
 * @param {string} message - Corps du message
 * @param {Object} context - Contexte de l'événement
 * @returns {Object} { success: false, reason: 'not_implemented', stub: true }
 */
export async function send(destinataire, titre, message, context = {}) {
  const phone = destinataire.telephone || 'N/A';
  console.log(`[WhatsAppChannel][STUB] → ${phone} (${destinataire.nom || 'inconnu'}): ${titre}`);

  return {
    success: false,
    reason: 'not_implemented',
    stub: true,
    to: phone
  };
}

export const channelName = 'whatsapp';
