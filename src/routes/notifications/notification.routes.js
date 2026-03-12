import express from 'express';
import {
  obtenirMesNotifications,
  compterNonLues,
  marquerCommeLue,
  marquerToutesCommeLues,
  archiverNotification,
  supprimerNotification,
  obtenirStatistiques,
  creerNotification
} from '../../controllers/notifications/notification.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';

/**
 * EXTENSION 7 - Routes Notifications (Service notification in-app)
 *
 * Routes NOUVELLES pour gérer les notifications in-app.
 *
 * NON-RÉGRESSION: Ces routes sont NOUVELLES.
 * - Aucune route existante n'est modifiée
 * - Ces routes ajoutent des endpoints pour la gestion des notifications
 *
 * Ces routes gèrent le nouveau endpoint /api/notifications/* pour l'extension 7.
 */

const router = express.Router();

/**
 * 🔒 PHASE 1 AJUSTÉE - Référentiel officiel
 *
 * Notifications:
 * - Lecture/Gestion personnelle: Tous (opérationnels + QUALITE)
 * - Création notification système: MANAGER (décision de communication)
 * - ADMIN gelé: Ne crée plus de notifications métier
 */

// ========== ROUTES NON-PARAMÉTRISÉES (avant /:id) ==========

/**
 * @route   GET /api/notifications/count-non-lues
 * @desc    Compter les notifications non lues de l'utilisateur connecté
 * @access  Private
 */
router.get('/count-non-lues', protect, compterNonLues);

/**
 * @route   PATCH /api/notifications/lire-toutes
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.patch('/lire-toutes', protect, marquerToutesCommeLues);

/**
 * @route   GET /api/notifications/statistiques
 * @desc    Obtenir les statistiques des notifications
 * @access  Private
 */
router.get('/statistiques', protect, obtenirStatistiques);

/**
 * @route   GET /api/notifications
 * @desc    Obtenir les notifications de l'utilisateur connecté
 * @access  Private
 * @query   lu (Boolean), type (String), priorite (String), archive (Boolean), limit (Number), skip (Number)
 */
router.get('/', protect, obtenirMesNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Créer une notification système
 * @access  Private (DÉCISION CRITIQUE: MANAGER uniquement)
 * @body    Données de la notification
 */
router.post('/', protect, authorize('MANAGER'), creerNotification);

// ========== ROUTES PARAMÉTRISÉES (après /:id) ==========

/**
 * @route   PATCH /api/notifications/:id/lire
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.patch('/:id/lire', protect, marquerCommeLue);

/**
 * @route   PATCH /api/notifications/:id/archiver
 * @desc    Archiver une notification
 * @access  Private
 */
router.patch('/:id/archiver', protect, archiverNotification);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private
 */
router.delete('/:id', protect, supprimerNotification);

export default router;
