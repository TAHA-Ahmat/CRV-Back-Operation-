/**
 * NOTIFICATION RECIPIENTS ROUTES — API Admin pour les contacts
 *
 * MODULE NOTIFICATION ENGINE v1.0.0
 * Toutes les routes sont protégées ADMIN uniquement.
 *
 * Endpoint: /api/notification-recipients/*
 */

import express from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import {
  getAll,
  getByRole,
  updateByRole,
  addEmail,
  removeEmail,
  addWhatsapp,
  removeWhatsapp,
  toggleEmail,
  toggleWhatsapp
} from '../../controllers/notifications/notificationRecipients.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// Toutes les routes: ADMIN uniquement
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/notification-recipients
 * @desc    Récupère tous les recipients (6 documents)
 * @access  ADMIN
 */
router.get('/', protect, authorize('ADMIN'), getAll);

/**
 * @route   GET /api/notification-recipients/:role
 * @desc    Récupère les contacts d'un rôle
 * @access  ADMIN
 */
router.get('/:role', protect, authorize('ADMIN'), getByRole);

/**
 * @route   PUT /api/notification-recipients/:role
 * @desc    Met à jour les contacts et mode d'un rôle
 * @access  ADMIN
 * @body    { emails?, whatsapps?, emailMode?, whatsappMode? }
 */
router.put('/:role', protect, authorize('ADMIN'), updateByRole);

/**
 * @route   POST /api/notification-recipients/:role/emails
 * @desc    Ajoute un contact email
 * @access  ADMIN
 * @body    { email, nom? }
 */
router.post('/:role/emails', protect, authorize('ADMIN'), addEmail);

/**
 * @route   DELETE /api/notification-recipients/:role/emails/:emailId
 * @desc    Supprime un contact email
 * @access  ADMIN
 */
router.delete('/:role/emails/:emailId', protect, authorize('ADMIN'), removeEmail);

/**
 * @route   PATCH /api/notification-recipients/:role/emails/:emailId/toggle
 * @desc    Active/Désactive un contact email
 * @access  ADMIN
 * @body    { actif: true/false }
 */
router.patch('/:role/emails/:emailId/toggle', protect, authorize('ADMIN'), toggleEmail);

/**
 * @route   POST /api/notification-recipients/:role/whatsapps
 * @desc    Ajoute un contact WhatsApp
 * @access  ADMIN
 * @body    { telephone, nom? }
 */
router.post('/:role/whatsapps', protect, authorize('ADMIN'), addWhatsapp);

/**
 * @route   DELETE /api/notification-recipients/:role/whatsapps/:whatsappId
 * @desc    Supprime un contact WhatsApp
 * @access  ADMIN
 */
router.delete('/:role/whatsapps/:whatsappId', protect, authorize('ADMIN'), removeWhatsapp);

/**
 * @route   PATCH /api/notification-recipients/:role/whatsapps/:whatsappId/toggle
 * @desc    Active/Désactive un contact WhatsApp
 * @access  ADMIN
 * @body    { actif: true/false }
 */
router.patch('/:role/whatsapps/:whatsappId/toggle', protect, authorize('ADMIN'), toggleWhatsapp);

export default router;
