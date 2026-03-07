/**
 * NOTIFICATION RECIPIENTS CONTROLLER — API Admin pour les contacts
 *
 * MODULE NOTIFICATION ENGINE v1.0.0
 * CRUD des contacts email/WhatsApp par rôle.
 * Tous les endpoints sont ADMIN-only.
 */

import * as recipientsService from '../../services/notifications/notificationRecipients.service.js';

/**
 * GET /api/notification-recipients
 * Récupère tous les recipients (6 documents, 1 par rôle).
 */
export const getAll = async (req, res) => {
  try {
    const recipients = await recipientsService.getAll();
    res.json({ success: true, count: recipients.length, data: recipients });
  } catch (error) {
    console.error('[RecipientsCtrl] getAll:', error.message);
    res.status(500).json({ success: false, message: 'Erreur récupération recipients', error: error.message });
  }
};

/**
 * GET /api/notification-recipients/:role
 * Récupère les contacts d'un rôle.
 */
export const getByRole = async (req, res) => {
  try {
    const recipient = await recipientsService.getByRole(req.params.role);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
    }
    res.json({ success: true, data: recipient });
  } catch (error) {
    console.error('[RecipientsCtrl] getByRole:', error.message);
    if (error.message.includes('invalide')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur récupération', error: error.message });
  }
};

/**
 * PUT /api/notification-recipients/:role
 * Met à jour les contacts et mode d'un rôle.
 * @body { emails?, whatsapps?, emailMode?, whatsappMode? }
 */
export const updateByRole = async (req, res) => {
  try {
    const result = await recipientsService.updateByRole(req.params.role, req.body, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] updateByRole:', error.message);
    if (error.message.includes('invalide')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur mise à jour', error: error.message });
  }
};

/**
 * POST /api/notification-recipients/:role/emails
 * Ajoute un contact email à un rôle.
 * @body { email, nom? }
 */
export const addEmail = async (req, res) => {
  try {
    const { email, nom } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }
    const result = await recipientsService.addEmail(req.params.role, { email, nom }, req.user._id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] addEmail:', error.message);
    res.status(error.message.includes('invalide') ? 400 : 500).json({
      success: false, message: error.message
    });
  }
};

/**
 * DELETE /api/notification-recipients/:role/emails/:emailId
 * Supprime un contact email.
 */
export const removeEmail = async (req, res) => {
  try {
    const result = await recipientsService.removeEmail(req.params.role, req.params.emailId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] removeEmail:', error.message);
    res.status(500).json({ success: false, message: 'Erreur suppression', error: error.message });
  }
};

/**
 * POST /api/notification-recipients/:role/whatsapps
 * Ajoute un contact WhatsApp à un rôle.
 * @body { telephone, nom? }
 */
export const addWhatsapp = async (req, res) => {
  try {
    const { telephone, nom } = req.body;
    if (!telephone) {
      return res.status(400).json({ success: false, message: 'Téléphone requis' });
    }
    const result = await recipientsService.addWhatsapp(req.params.role, { telephone, nom }, req.user._id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] addWhatsapp:', error.message);
    res.status(error.message.includes('invalide') ? 400 : 500).json({
      success: false, message: error.message
    });
  }
};

/**
 * DELETE /api/notification-recipients/:role/whatsapps/:whatsappId
 * Supprime un contact WhatsApp.
 */
export const removeWhatsapp = async (req, res) => {
  try {
    const result = await recipientsService.removeWhatsapp(req.params.role, req.params.whatsappId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] removeWhatsapp:', error.message);
    res.status(500).json({ success: false, message: 'Erreur suppression', error: error.message });
  }
};

/**
 * PATCH /api/notification-recipients/:role/emails/:emailId/toggle
 * Active/Désactive un contact email.
 * @body { actif: true/false }
 */
export const toggleEmail = async (req, res) => {
  try {
    const { actif } = req.body;
    if (actif === undefined) {
      return res.status(400).json({ success: false, message: 'Le champ actif est requis' });
    }
    const result = await recipientsService.toggleEmail(req.params.role, req.params.emailId, actif, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] toggleEmail:', error.message);
    res.status(500).json({ success: false, message: 'Erreur toggle', error: error.message });
  }
};

/**
 * PATCH /api/notification-recipients/:role/whatsapps/:whatsappId/toggle
 * Active/Désactive un contact WhatsApp.
 * @body { actif: true/false }
 */
export const toggleWhatsapp = async (req, res) => {
  try {
    const { actif } = req.body;
    if (actif === undefined) {
      return res.status(400).json({ success: false, message: 'Le champ actif est requis' });
    }
    const result = await recipientsService.toggleWhatsapp(req.params.role, req.params.whatsappId, actif, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[RecipientsCtrl] toggleWhatsapp:', error.message);
    res.status(500).json({ success: false, message: 'Erreur toggle', error: error.message });
  }
};
