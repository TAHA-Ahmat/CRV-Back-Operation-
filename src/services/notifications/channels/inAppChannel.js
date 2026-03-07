/**
 * IN-APP CHANNEL — Délègue à notification.service.creerNotificationInApp()
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Ce channel utilise le service EXISTANT — aucune modification.
 */

import { creerNotificationInApp } from '../notification.service.js';

// Mapping priorité événement → type notification existant
const PRIORITY_TO_TYPE = {
  CRITIQUE: 'ERROR',
  HAUTE: 'WARNING',
  NORMALE: 'INFO',
  BASSE: 'INFO'
};

// Mapping priorité événement → priorité notification existante
const PRIORITY_MAP = {
  CRITIQUE: 'URGENTE',
  HAUTE: 'HAUTE',
  NORMALE: 'NORMALE',
  BASSE: 'BASSE'
};

/**
 * Envoie une notification in-app via le service existant.
 * @param {Object} destinataire - { _id, nom, email }
 * @param {string} titre - Titre de la notification
 * @param {string} message - Corps du message
 * @param {Object} context - { eventName, eventPriority, referenceModele, referenceId, lien }
 * @returns {Object} { success, notificationId? }
 */
export async function send(destinataire, titre, message, context = {}) {
  try {
    const notification = await creerNotificationInApp({
      destinataire: destinataire._id,
      type: PRIORITY_TO_TYPE[context.eventPriority] || 'INFO',
      titre,
      message,
      lien: context.lien || null,
      priorite: PRIORITY_MAP[context.eventPriority] || 'NORMALE',
      source: 'WORKFLOW',
      referenceModele: context.referenceModele || null,
      referenceId: context.referenceId || null,
      donnees: {
        eventName: context.eventName,
        emittedAt: context._emittedAt
      }
    });

    return { success: true, notificationId: notification?._id };
  } catch (error) {
    console.error(`[InAppChannel] Erreur envoi à ${destinataire._id}:`, error.message);
    return { success: false, error: error.message };
  }
}

export const channelName = 'inApp';
