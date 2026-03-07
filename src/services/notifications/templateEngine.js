/**
 * TEMPLATE ENGINE — Remplacement de variables {{variable}} dans les messages
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Utilisé par le NotificationRouter pour générer les messages personnalisés.
 */

/**
 * Remplace les {{variables}} dans un template par les valeurs du payload.
 * @param {string} template - Template avec {{variables}}
 * @param {Object} payload - Données de l'événement
 * @returns {string} - Template avec variables remplacées
 */
export function applyTemplate(template, payload) {
  if (!template || typeof template !== 'string') return template || '';
  if (!payload || typeof payload !== 'object') return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = payload[key];
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toLocaleString('fr-FR');
    return String(value);
  });
}

/**
 * Applique le template à un objet messageTemplate { titre, message }.
 * @param {Object} messageTemplate - { titre: '...', message: '...' }
 * @param {Object} payload - Données de l'événement
 * @returns {Object} - { titre: '...', message: '...' } avec variables remplacées
 */
export function applyMessageTemplate(messageTemplate, payload) {
  if (!messageTemplate) return { titre: 'Notification', message: '' };

  return {
    titre: applyTemplate(messageTemplate.titre, payload),
    message: applyTemplate(messageTemplate.message, payload)
  };
}
