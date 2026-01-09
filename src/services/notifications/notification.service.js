import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';
// EXTENSION 7 - Service notification in-app (NON-RÉGRESSION: import NOUVEAU)
import Notification from '../../models/notifications/Notification.js';

/**
 * Configuration du transporteur email
 * Utilise les variables d'environnement pour SMTP
 */
const createTransporter = () => {
  // Configuration SMTP depuis .env
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true pour port 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Configuration de test avec Ethereal (si pas de SMTP configuré)
  // Ethereal est un service gratuit pour tester les emails
  console.warn('⚠️  Aucune configuration SMTP trouvée. Utilisation du mode test (emails non envoyés).');
  return null;
};

/**
 * Envoyer notification de CRV prêt pour validation
 * @param {Object} crv - Document CRV
 * @param {Object} superviseur - Document Personne (superviseur)
 */
export const notifierCRVPretValidation = async (crv, superviseur) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`📧 [MODE TEST] Notification CRV ${crv.numeroCRV} pour ${superviseur.email}`);
      return {
        success: true,
        mode: 'test',
        message: 'Email non envoyé (mode test - pas de configuration SMTP)'
      };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ths.com',
      to: superviseur.email,
      subject: `CRV ${crv.numeroCRV} prêt pour validation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4472C4;">CRV Prêt pour Validation</h2>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Numéro CRV :</strong> ${crv.numeroCRV}</p>
            <p><strong>Vol :</strong> ${crv.vol.numeroVol}</p>
            <p><strong>Compagnie :</strong> ${crv.vol.compagnieAerienne}</p>
            <p><strong>Date vol :</strong> ${new Date(crv.vol.dateVol).toLocaleDateString('fr-FR')}</p>
            <p><strong>Complétude :</strong> ${crv.completude}%</p>
          </div>

          <p>Ce CRV est maintenant complété et prêt pour validation.</p>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/crv/${crv._id}"
               style="background-color: #4472C4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Voir le CRV
            </a>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #666;">
            Cet email a été envoyé automatiquement par le système THS CRV Operations.<br>
            Merci de ne pas répondre à cet email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email envoyé : ${info.messageId}`);

    return {
      success: true,
      mode: 'production',
      messageId: info.messageId,
      to: superviseur.email
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Envoyer notification d'incident critique
 * @param {Object} evenement - Document EvenementOperationnel
 * @param {Object} crv - Document CRV
 * @param {Array} managers - Liste des managers à notifier
 */
export const notifierIncidentCritique = async (evenement, crv, managers) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`📧 [MODE TEST] Notification incident critique sur CRV ${crv.numeroCRV}`);
      return {
        success: true,
        mode: 'test',
        message: 'Email non envoyé (mode test)'
      };
    }

    const destinataires = managers.map(m => m.email).join(', ');

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ths.com',
      to: destinataires,
      subject: `🚨 Incident CRITIQUE - CRV ${crv.numeroCRV}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d32f2f; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">🚨 INCIDENT CRITIQUE</h2>
          </div>

          <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
            <p><strong>CRV :</strong> ${crv.numeroCRV}</p>
            <p><strong>Vol :</strong> ${crv.vol.numeroVol} - ${crv.vol.compagnieAerienne}</p>

            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p><strong>Type d'événement :</strong> ${evenement.typeEvenement}</p>
              <p><strong>Gravité :</strong> ${evenement.gravite}</p>
              <p><strong>Description :</strong></p>
              <p>${evenement.description}</p>
            </div>

            <p><strong>Date/Heure :</strong> ${new Date(evenement.dateHeureDebut).toLocaleString('fr-FR')}</p>

            ${evenement.actionsCorrectives ? `
              <p><strong>Actions correctives :</strong></p>
              <p>${evenement.actionsCorrectives}</p>
            ` : ''}

            <p style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/crv/${crv._id}"
                 style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir le CRV
              </a>
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #666;">
            Notification automatique - Incident critique détecté<br>
            Système THS CRV Operations
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email incident critique envoyé : ${info.messageId}`);

    return {
      success: true,
      mode: 'production',
      messageId: info.messageId,
      destinataires
    };
  } catch (error) {
    console.error('❌ Erreur envoi email incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Envoyer notification de validation CRV
 * @param {Object} crv - Document CRV validé
 * @param {Object} validateur - Personne qui a validé
 * @param {Object} createur - Personne qui a créé le CRV
 */
export const notifierValidationCRV = async (crv, validateur, createur) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`📧 [MODE TEST] Notification validation CRV ${crv.numeroCRV} pour ${createur.email}`);
      return {
        success: true,
        mode: 'test',
        message: 'Email non envoyé (mode test)'
      };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ths.com',
      to: createur.email,
      subject: `✅ CRV ${crv.numeroCRV} validé`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4caf50; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">✅ CRV Validé</h2>
          </div>

          <div style="border: 2px solid #4caf50; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
            <p>Bonjour ${createur.prenom},</p>

            <p>Le CRV <strong>${crv.numeroCRV}</strong> a été validé avec succès.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vol :</strong> ${crv.vol.numeroVol} - ${crv.vol.compagnieAerienne}</p>
              <p><strong>Validé par :</strong> ${validateur.prenom} ${validateur.nom}</p>
              <p><strong>Date validation :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>

            <p>Le CRV est maintenant verrouillé et prêt pour l'archivage.</p>

            <p style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/crv/${crv._id}"
                 style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir le CRV
              </a>
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #666;">
            Notification automatique - Validation CRV<br>
            Système THS CRV Operations
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email validation envoyé : ${info.messageId}`);

    return {
      success: true,
      mode: 'production',
      messageId: info.messageId,
      to: createur.email
    };
  } catch (error) {
    console.error('❌ Erreur envoi email validation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Tester la configuration email
 */
export const testerConfigurationEmail = async () => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return {
        success: false,
        mode: 'test',
        message: 'Aucune configuration SMTP trouvée. Ajoutez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans .env'
      };
    }

    // Vérifier la connexion
    await transporter.verify();

    return {
      success: true,
      mode: 'production',
      message: 'Configuration SMTP valide',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER
      }
    };
  } catch (error) {
    return {
      success: false,
      mode: 'production',
      message: 'Erreur de configuration SMTP',
      error: error.message
    };
  }
};

// ============================================================
// EXTENSION 7 - NOTIFICATIONS IN-APP
// ============================================================

/**
 * EXTENSION 7 - Fonctions NOUVELLES pour notifications in-app
 *
 * NON-RÉGRESSION: Ces fonctions sont ENTIÈREMENT NOUVELLES et OPTIONNELLES.
 * - Les fonctions email existantes (ci-dessus) ne sont PAS modifiées
 * - Ces fonctions ajoutent la gestion de notifications in-app
 * - Peuvent être utilisées en complément ou indépendamment des emails
 */

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

    return notification;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'alerte SLA:', error);
    throw error;
  }
};
