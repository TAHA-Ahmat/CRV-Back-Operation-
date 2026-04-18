// EXTENSION 7 - Service notification in-app
// LEGACY EMAIL SUPPRIMÉ: nodemailer, createTransporter, notifierCRVPretValidation,
// notifierIncidentCritique, notifierValidationCRV, testerConfigurationEmail
// → Tout le canal email passe désormais par channels/emailChannel.js via le pipeline EventBus
import Notification from '../../models/notifications/Notification.js';

// ============================================================
// NOTIFICATIONS IN-APP (seul rôle restant de ce fichier)
// ============================================================

/**
 * Crée une notification in-app
 * @param {Object} notificationData - Données de la notification
 * @returns {Object} Notification créée
 */
export const creerNotificationInApp = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification in-app:', error);
    throw error;
  }
};

/**
 * Crée une notification pour plusieurs destinataires
 * @param {Array} destinataireIds - Liste des IDs des destinataires
 * @param {Object} notificationData - Données de la notification (sans destinataire)
 * @returns {Array} Notifications créées
 */
export const creerNotificationMultiple = async (destinataireIds, notificationData) => {
  try {
    const notifications = await Promise.all(
      destinataireIds.map(destinataireId =>
        Notification.create({
          ...notificationData,
          destinataire: destinataireId
        })
      )
    );
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la création des notifications multiples:', error);
    throw error;
  }
};

/**
 * Obtient les notifications d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @param {Object} filtres - Filtres optionnels
 * @returns {Array} Notifications
 */
export const obtenirNotificationsUtilisateur = async (userId, filtres = {}) => {
  try {
    const query = {
      destinataire: userId,
      archive: filtres.archive !== undefined ? filtres.archive : false
    };

    if (filtres.lu !== undefined) {
      query.lu = filtres.lu;
    }

    if (filtres.type) {
      query.type = filtres.type;
    }

    if (filtres.priorite) {
      query.priorite = filtres.priorite;
    }

    if (filtres.excluExpires) {
      query.$or = [
        { expiration: null },
        { expiration: { $gt: new Date() } }
      ];
    }

    const limit = filtres.limit || 50;
    const skip = filtres.skip || 0;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

/**
 * Marque une notification comme lue
 * @param {String} notificationId - ID de la notification
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Notification mise à jour
 */
export const marquerCommeLue = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      destinataire: userId
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return await notification.marquerCommeLue();
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

/**
 * Marque toutes les notifications comme lues
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat de la mise à jour
 */
export const marquerToutesCommeLues = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { destinataire: userId, lu: false },
      {
        $set: {
          lu: true,
          dateLecture: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
  }
};

/**
 * Archive une notification
 * @param {String} notificationId - ID de la notification
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Notification archivée
 */
export const archiverNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      destinataire: userId
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return await notification.archiver();
  } catch (error) {
    console.error('Erreur lors de l\'archivage de la notification:', error);
    throw error;
  }
};

/**
 * Supprime une notification
 * @param {String} notificationId - ID de la notification
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat de la suppression
 */
export const supprimerNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      destinataire: userId
    });

    if (result.deletedCount === 0) {
      throw new Error('Notification non trouvée');
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

/**
 * Compte les notifications non lues d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Number} Nombre de notifications non lues
 */
export const compterNonLues = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      destinataire: userId,
      lu: false,
      archive: false,
      $or: [
        { expiration: null },
        { expiration: { $gt: new Date() } }
      ]
    });

    return count;
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    throw error;
  }
};

/**
 * Nettoie les notifications expirées
 * @returns {Object} Résultat du nettoyage
 */
export const nettoyerNotificationsExpirees = async () => {
  try {
    const result = await Notification.deleteMany({
      expiration: { $lt: new Date() }
    });

    console.log(`${result.deletedCount} notifications expirées supprimées`);
    return result;
  } catch (error) {
    console.error('Erreur lors du nettoyage des notifications expirées:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques des notifications
 * @param {String} userId - ID de l'utilisateur (optionnel)
 * @returns {Object} Statistiques
 */
export const obtenirStatistiquesNotifications = async (userId = null) => {
  try {
    const query = userId ? { destinataire: userId } : {};

    const total = await Notification.countDocuments(query);
    const nonLues = await Notification.countDocuments({ ...query, lu: false });
    const archivees = await Notification.countDocuments({ ...query, archive: true });

    const parType = await Notification.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const parPriorite = await Notification.aggregate([
      { $match: query },
      { $group: { _id: '$priorite', count: { $sum: 1 } } }
    ]);

    return {
      total,
      nonLues,
      lues: total - nonLues,
      archivees,
      parType: parType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      parPriorite: parPriorite.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};

/**
 * Envoie une notification d'alerte SLA (Extension 8)
 * @param {String} destinataireId - ID du destinataire
 * @param {Object} alerteData - Données de l'alerte SLA
 * @returns {Object} Notification créée
 */
export const envoyerAlerteSLA = async (destinataireId, alerteData) => {
  try {
    // 1. Notification in-app (existant)
    const notification = await creerNotificationInApp({
      destinataire: destinataireId,
      type: 'ALERTE_SLA',
      titre: alerteData.titre || 'Alerte SLA',
      message: alerteData.message,
      lien: alerteData.lien || null,
      donnees: alerteData,
      priorite: alerteData.priorite || 'HAUTE',
      source: 'ALERTE_SLA',
      referenceModele: alerteData.referenceModele || null,
      referenceId: alerteData.referenceId || null
    });

    // 2. Email proactif pour alertes CRITICAL et EXCEEDED (Palier 3)
    const niveau = alerteData.niveau || alerteData.priorite || '';
    const shouldEmail = ['CRITICAL', 'EXCEEDED', 'CRITIQUE', 'URGENTE'].includes(niveau.toUpperCase?.() || '');

    if (shouldEmail) {
      try {
        const Personne = (await import('../../models/security/Personne.js')).default;
        const destinataire = await Personne.findById(destinataireId).select('email nom prenom').lean();

        if (destinataire?.email) {
          const { send } = await import('./channels/emailChannel.js');
          await send(
            destinataire.email,
            alerteData.titre || 'Alerte SLA CRV',
            alerteData.message,
            { priority: 'high' }
          );
          console.log(`[SLA][EMAIL] Alerte ${niveau} envoyée à ${destinataire.email}`);
        }
      } catch (emailErr) {
        // Non-bloquant : l'email est un bonus, la notification in-app reste
        console.warn('[SLA][EMAIL] Envoi email échoué (non-bloquant):', emailErr.message);
      }
    }

    return notification;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'alerte SLA:', error);
    throw error;
  }
};
