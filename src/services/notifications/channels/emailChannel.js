/**
 * EMAIL CHANNEL — Envoie des emails via nodemailer existant
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Utilise la configuration SMTP existante. Timeout 5s maximum.
 */

import nodemailer from 'nodemailer';

// ─── TRANSPORTER SINGLETON (créé une seule fois) ─────────────
let _transporter = null;
let _transporterChecked = false;

function getTransporter() {
  if (_transporterChecked) return _transporter;
  _transporterChecked = true;

  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Timeout 5 secondes maximum
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });
  }

  return _transporter;
}

/**
 * Template email HTML générique.
 */
function buildEmailHtml(titre, message, context = {}) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const lien = context.lien ? `${frontendUrl}${context.lien}` : null;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4472C4; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
        <h2 style="margin: 0;">${titre}</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0;">
        <p style="line-height: 1.6;">${message}</p>
        ${lien ? `<p style="margin-top: 20px;"><a href="${lien}" style="background-color: #4472C4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir dans CRV</a></p>` : ''}
      </div>
      <div style="padding: 10px; text-align: center; color: #999; font-size: 12px;">
        <p>Notification automatique — Système CRV</p>
      </div>
    </div>
  `;
}

/**
 * Envoie un email de notification.
 * @param {Object} destinataire - { _id, nom, email }
 * @param {string} titre - Sujet de l'email
 * @param {string} message - Corps du message
 * @param {Object} context - { eventName, eventPriority, lien }
 * @returns {Object} { success, messageId?, mode? }
 */
export async function send(destinataire, titre, message, context = {}) {
  try {
    // Vérifier que le destinataire a un email
    if (!destinataire.email) {
      return { success: false, reason: 'no_email' };
    }

    const transporter = getTransporter();

    // Mode test si SMTP non configuré
    if (!transporter) {
      console.log(`[EmailChannel][TEST] → ${destinataire.email}: ${titre}`);
      return { success: true, mode: 'test', to: destinataire.email };
    }

    // Envoi réel
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@ths.com',
      to: destinataire.email,
      subject: `[CRV] ${titre}`,
      html: buildEmailHtml(titre, message, context)
    });

    return { success: true, mode: 'production', messageId: result.messageId, to: destinataire.email };
  } catch (error) {
    console.error(`[EmailChannel] Erreur envoi à ${destinataire.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

export const channelName = 'email';

/**
 * Réinitialise le transporter (utile pour les tests).
 */
export function resetTransporter() {
  _transporter = null;
  _transporterChecked = false;
}
