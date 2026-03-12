/**
 * NOTIFICATION ROUTER — Résout les règles et distribue les notifications
 *
 * MODULE NOTIFICATION ENGINE v1.0.0
 * Pipeline : Événement → Règles actives → Destinataires (users + contacts) → Template → Dispatch
 *
 * Caractéristiques:
 * - Cache des rôles (roleCache) avec TTL 60 secondes
 * - Intégration NotificationRecipient (contacts email/whatsapp configurés par admin)
 * - Exclut l'acteur de l'événement (pas d'auto-notification)
 * - Exécution non-bloquante (appelé depuis process.nextTick)
 */

import NotificationRule from '../../models/notifications/NotificationRule.js';
import NotificationRecipient from '../../models/notifications/NotificationRecipient.js';
import Personne from '../../models/security/Personne.js';
import { EVENT_METADATA } from './eventRegistry.js';
import { applyMessageTemplate } from './templateEngine.js';
import { dispatch } from './notificationDispatcher.js';

// ─── CACHE DES UTILISATEURS PAR RÔLE ─────────────────────────
const roleCache = {
  data: {},       // { ROLE: [{ _id, nom, email, telephone }] }
  lastFetch: 0,
  TTL: 60_000     // 60 secondes
};

/**
 * Récupère les utilisateurs actifs d'un rôle (avec cache TTL 60s).
 * @param {string} role - Nom du rôle
 * @returns {Array} Liste des personnes
 */
async function getUsersByRole(role) {
  const now = Date.now();

  // Cache expiré → rechargement global
  if (now - roleCache.lastFetch > roleCache.TTL) {
    try {
      const allUsers = await Personne.find({
        statut: 'ACTIF',
        statutCompte: 'VALIDE'
      }).select('_id nom prenom email telephone fonction').lean();

      // Grouper par rôle
      roleCache.data = {};
      for (const user of allUsers) {
        const fn = user.fonction;
        if (!roleCache.data[fn]) roleCache.data[fn] = [];
        roleCache.data[fn].push({
          _id: user._id,
          nom: `${user.prenom || ''} ${user.nom || ''}`.trim(),
          email: user.email,
          telephone: user.telephone
        });
      }
      roleCache.lastFetch = now;
    } catch (error) {
      console.error('[NotificationRouter] Erreur chargement cache rôles:', error.message);
      // Utiliser le cache existant même expiré plutôt que planter
    }
  }

  return roleCache.data[role] || [];
}

/**
 * Invalide le cache des rôles manuellement.
 */
export function invalidateRoleCache() {
  roleCache.lastFetch = 0;
  roleCache.data = {};
  recipientCache.lastFetch = 0;
  recipientCache.data = {};
}

// ─── CACHE DES CONTACTS RECIPIENTS ──────────────────────────
const recipientCache = {
  data: {},       // { ROLE: { emailMode, whatsappMode, emails: [...], whatsapps: [...] } }
  lastFetch: 0,
  TTL: 60_000     // 60 secondes
};

/**
 * Récupère les contacts recipients configurés par l'admin (avec cache TTL 60s).
 * @param {string} role - Nom du rôle
 * @returns {Object} { emailMode, whatsappMode, emails: [...], whatsapps: [...] }
 */
async function getRecipientContacts(role) {
  const now = Date.now();

  // Cache expiré → rechargement global
  if (now - recipientCache.lastFetch > recipientCache.TTL) {
    try {
      const allRecipients = await NotificationRecipient.find({}).lean();
      recipientCache.data = {};
      for (const doc of allRecipients) {
        recipientCache.data[doc.role] = {
          emailMode: doc.emailMode || 'users_only',
          whatsappMode: doc.whatsappMode || 'contacts_only',
          emails: (doc.emails || []).filter(e => e.actif),
          whatsapps: (doc.whatsapps || []).filter(w => w.actif)
        };
      }
      recipientCache.lastFetch = now;
    } catch (error) {
      console.error('[NotificationRouter] Erreur chargement cache recipients:', error.message);
    }
  }

  return recipientCache.data[role] || { emailMode: 'users_only', whatsappMode: 'contacts_only', emails: [], whatsapps: [] };
}

/**
 * PIPELINE PRINCIPAL : Traite un événement et distribue les notifications.
 *
 * @param {Object} payload - Payload enrichi de l'événement
 *   payload._eventName - Nom de l'événement
 *   payload._emittedAt - Timestamp d'émission
 *   payload.actorId - ID de l'acteur (exclu des notifications)
 *   payload.numeroCRV, payload.userName, etc. - Variables template
 */
export async function handleEvent(payload) {
  const { _eventName: eventName, actorId } = payload;

  try {
    // 1. Récupérer les métadonnées de l'événement
    const metadata = EVENT_METADATA[eventName];
    if (!metadata) {
      console.warn(`[NotificationRouter] Pas de metadata pour: ${eventName}`);
      return;
    }

    // 2. Récupérer les règles actives pour cet événement
    const rules = await NotificationRule.findActiveRulesForEvent(eventName);
    if (!rules || rules.length === 0) {
      return; // Aucune règle active → rien à faire
    }

    // 3. Pour chaque règle (1 règle = 1 rôle), trouver les destinataires et dispatcher
    const dispatchPromises = rules.map(async (rule) => {
      try {
        // 3a. Récupérer les utilisateurs du rôle
        const users = await getUsersByRole(rule.role);

        // 3a-bis. Récupérer les contacts recipients configurés par l'admin
        const recipientConfig = await getRecipientContacts(rule.role);

        // 3b. Appliquer le template du message
        const messageTemplate = rule.messageTemplate || metadata.messageTemplate;
        const { titre, message } = applyMessageTemplate(messageTemplate, payload);

        // 3c. Canaux actifs pour cette règle
        const activeChannels = {
          inApp: rule.channels?.inApp || false,
          email: rule.channels?.email || false,
          whatsapp: rule.channels?.whatsapp || false
        };

        // 3d. Contexte enrichi
        const context = {
          eventName,
          eventPriority: metadata.priority,
          referenceModele: payload.referenceModele || null,
          referenceId: payload.referenceId || null,
          lien: payload.lien || null,
          _emittedAt: payload._emittedAt
        };

        // 3e. Dispatcher pour les UTILISATEURS du système (inApp + email si mode le permet)
        const shouldSendEmailToUsers = recipientConfig.emailMode !== 'contacts_only';
        const shouldSendWhatsappToUsers = recipientConfig.whatsappMode !== 'contacts_only';

        for (const user of users) {
          // Exclure l'acteur de l'événement
          if (actorId && user._id.toString() === actorId.toString()) {
            continue;
          }

          // Canaux adaptés pour utilisateurs système
          const userChannels = {
            inApp: activeChannels.inApp,
            email: activeChannels.email && shouldSendEmailToUsers,
            whatsapp: activeChannels.whatsapp && shouldSendWhatsappToUsers
          };

          // Dispatch non-bloquant
          dispatch(user, titre, message, userChannels, context).catch(err => {
            console.error(`[NotificationRouter] Erreur dispatch user ${user._id}:`, err.message);
          });
        }

        // 3f. Dispatcher pour les CONTACTS EXTERNES configurés par l'admin
        const shouldSendEmailToContacts = recipientConfig.emailMode !== 'users_only';
        const shouldSendWhatsappToContacts = recipientConfig.whatsappMode !== 'users_only';

        // Contacts email externes
        if (activeChannels.email && shouldSendEmailToContacts && recipientConfig.emails.length > 0) {
          for (const contact of recipientConfig.emails) {
            const contactUser = {
              _id: `ext_email_${contact._id}`,
              nom: contact.nom || contact.email,
              email: contact.email,
              telephone: null
            };
            const emailOnlyChannels = { inApp: false, email: true, whatsapp: false };
            dispatch(contactUser, titre, message, emailOnlyChannels, context).catch(err => {
              console.error(`[NotificationRouter] Erreur dispatch contact email ${contact.email}:`, err.message);
            });
          }
        }

        // Contacts WhatsApp externes
        if (activeChannels.whatsapp && shouldSendWhatsappToContacts && recipientConfig.whatsapps.length > 0) {
          for (const contact of recipientConfig.whatsapps) {
            const contactUser = {
              _id: `ext_wa_${contact._id}`,
              nom: contact.nom || contact.telephone,
              email: null,
              telephone: contact.telephone
            };
            const waOnlyChannels = { inApp: false, email: false, whatsapp: true };
            dispatch(contactUser, titre, message, waOnlyChannels, context).catch(err => {
              console.error(`[NotificationRouter] Erreur dispatch contact WA ${contact.telephone}:`, err.message);
            });
          }
        }
      } catch (ruleError) {
        console.error(`[NotificationRouter] Erreur traitement règle ${rule.role}/${eventName}:`, ruleError.message);
      }
    });

    await Promise.allSettled(dispatchPromises);

  } catch (error) {
    console.error(`[NotificationRouter] Erreur handleEvent(${eventName}):`, error.message);
    // NE JAMAIS propager — le métier ne doit pas être impacté
  }
}

/**
 * Enregistre les listeners sur l'EventBus pour TOUS les événements ayant des règles.
 * Appelé une seule fois au démarrage.
 *
 * @param {EventEmitter} eventBus - L'instance NotificationEngine
 */
export async function registerListeners(eventBus) {
  try {
    // Récupérer tous les événements uniques ayant au moins une règle active
    const activeRules = await NotificationRule.find({ enabled: true }).distinct('event');

    if (!activeRules || activeRules.length === 0) {
      console.log('[NotificationRouter] Aucune règle active — aucun listener enregistré');
      return 0;
    }

    let count = 0;
    for (const eventName of activeRules) {
      eventBus.on(eventName, (payload) => {
        // Traitement async non-bloquant
        handleEvent(payload).catch(err => {
          console.error(`[NotificationRouter] Erreur listener ${eventName}:`, err.message);
        });
      });
      count++;
    }

    console.log(`[NotificationRouter] ${count} listeners enregistrés sur ${activeRules.length} événements`);
    return count;
  } catch (error) {
    console.error('[NotificationRouter] Erreur registerListeners:', error.message);
    return 0;
  }
}
