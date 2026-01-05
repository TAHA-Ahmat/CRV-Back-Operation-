import * as notificationService from '../services/notification.service.js';

/**
 * EXTENSION 7 - Contrôleur Notification (Service notification in-app)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux notifications in-app.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes continuent de fonctionner normalement
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 7.
 */

/**
 * Obtenir les notifications de l'utilisateur connecté
 * GET /api/notifications
 */
export const obtenirMesNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const filtres = {
      lu: req.query.lu ? req.query.lu === 'true' : undefined,
      type: req.query.type,
      priorite: req.query.priorite,
      archive: req.query.archive === 'true',
      excluExpires: req.query.excluExpires !== 'false',
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      skip: req.query.skip ? parseInt(req.query.skip) : 0
    };

    // Nettoyer les filtres undefined
    Object.keys(filtres).forEach(key => {
      if (filtres[key] === undefined) {
        delete filtres[key];
      }
    });

    const notifications = await notificationService.obtenirNotificationsUtilisateur(userId, filtres);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('Erreur dans obtenirMesNotifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des notifications'
    });
  }
};

/**
 * Compter les notifications non lues
 * GET /api/notifications/count-non-lues
 */
export const compterNonLues = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await notificationService.compterNonLues(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Erreur dans compterNonLues:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du comptage'
    });
  }
};

/**
 * Marquer une notification comme lue
 * PATCH /api/notifications/:id/lire
 */
export const marquerCommeLue = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await notificationService.marquerCommeLue(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    });

  } catch (error) {
    console.error('Erreur dans marquerCommeLue:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du marquage'
    });
  }
};

/**
 * Marquer toutes les notifications comme lues
 * PATCH /api/notifications/lire-toutes
 */
export const marquerToutesCommeLues = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await notificationService.marquerToutesCommeLues(userId);

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marquées comme lues`,
      data: result
    });

  } catch (error) {
    console.error('Erreur dans marquerToutesCommeLues:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du marquage'
    });
  }
};

/**
 * Archiver une notification
 * PATCH /api/notifications/:id/archiver
 */
export const archiverNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await notificationService.archiverNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification archivée',
      data: notification
    });

  } catch (error) {
    console.error('Erreur dans archiverNotification:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'archivage'
    });
  }
};

/**
 * Supprimer une notification
 * DELETE /api/notifications/:id
 */
export const supprimerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    await notificationService.supprimerNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error) {
    console.error('Erreur dans supprimerNotification:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression'
    });
  }
};

/**
 * Obtenir les statistiques des notifications
 * GET /api/notifications/statistiques
 */
export const obtenirStatistiques = async (req, res) => {
  try {
    const userId = req.user._id;

    const statistiques = await notificationService.obtenirStatistiquesNotifications(userId);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiques:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques'
    });
  }
};

/**
 * Créer une notification (ADMIN uniquement)
 * POST /api/notifications
 */
export const creerNotification = async (req, res) => {
  try {
    const notificationData = req.body;

    const notification = await notificationService.creerNotificationInApp(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification créée',
      data: notification
    });

  } catch (error) {
    console.error('Erreur dans creerNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création'
    });
  }
};
