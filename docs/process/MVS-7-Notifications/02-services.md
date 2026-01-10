# MVS-7-Notifications - SERVICES

## Date d'audit : 2026-01-10

---

## notification.service.js

### Emplacement
`src/services/notifications/notification.service.js`

---

## Fonctions exportees

### envoyerEmail

| Element | Detail |
|---------|--------|
| Signature | async envoyerEmail(destinataire, sujet, contenu, options = {}) |
| Transport | nodemailer avec config SMTP |
| Parametres | destinataire (email), sujet, contenu HTML, options |
| Options | cc, bcc, replyTo, attachments |
| Retour | { success: true, messageId } ou { success: false, error } |

**Configuration SMTP** :
```javascript
{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}
```

---

### creerNotificationInApp

| Element | Detail |
|---------|--------|
| Signature | async creerNotificationInApp(destinataireId, type, titre, message, options = {}) |
| Modele | Notification.create() |
| Parametres | destinataireId, type, titre, message, options |
| Options | lien, priorite, canaux, source, expiration |
| Retour | Document Notification cree |

**Comportement** :
```javascript
const notification = await Notification.create({
  destinataire: destinataireId,
  type,
  titre,
  message,
  lien: options.lien,
  priorite: options.priorite || 'NORMALE',
  canaux: options.canaux || ['inApp'],
  source: options.source,
  expiration: options.expiration
});
```

---

### obtenirNotificationsUtilisateur

| Element | Detail |
|---------|--------|
| Signature | async obtenirNotificationsUtilisateur(utilisateurId, options = {}) |
| Filtres | destinataire, nonLuesSeulement, type |
| Tri | createdAt DESC |
| Pagination | limit (default 50), skip |
| Retour | { notifications, total, nonLues } |

**Query** :
```javascript
const query = { destinataire: utilisateurId };
if (options.nonLuesSeulement) query.lue = false;
if (options.type) query.type = options.type;
```

---

### marquerCommeLue

| Element | Detail |
|---------|--------|
| Signature | async marquerCommeLue(notificationId, utilisateurId) |
| Verification | Notification appartient a l'utilisateur |
| MAJ | lue = true, dateLecture = now |
| Retour | Notification mise a jour |

---

### marquerToutesCommeLues

| Element | Detail |
|---------|--------|
| Signature | async marquerToutesCommeLues(utilisateurId) |
| Operation | updateMany |
| Filtre | destinataire = utilisateurId, lue = false |
| MAJ | lue = true, dateLecture = now |
| Retour | { modifiedCount } |

---

### supprimerNotification

| Element | Detail |
|---------|--------|
| Signature | async supprimerNotification(notificationId, utilisateurId) |
| Verification | Notification appartient a l'utilisateur |
| Operation | deleteOne |
| Retour | { success: true } ou erreur |

---

### compterNotificationsNonLues

| Element | Detail |
|---------|--------|
| Signature | async compterNotificationsNonLues(utilisateurId) |
| Operation | countDocuments |
| Filtre | destinataire = utilisateurId, lue = false |
| Retour | Number |

---

### nettoyerNotificationsExpirees

| Element | Detail |
|---------|--------|
| Signature | async nettoyerNotificationsExpirees() |
| Operation | deleteMany |
| Filtre | expiration < now |
| Usage | Cron job ou maintenance |
| Retour | { deletedCount } |

---

## Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| SMTP_HOST | Serveur SMTP |
| SMTP_PORT | Port SMTP |
| SMTP_SECURE | TLS active (true/false) |
| SMTP_USER | Utilisateur SMTP |
| SMTP_PASS | Mot de passe SMTP |
| SMTP_FROM | Adresse expediteur |

---

## SYNTHESE

| Fonction | Role |
|----------|------|
| envoyerEmail | Envoi email via SMTP |
| creerNotificationInApp | Creer notification in-app |
| obtenirNotificationsUtilisateur | Lister notifications utilisateur |
| marquerCommeLue | Marquer une notification lue |
| marquerToutesCommeLues | Marquer toutes les notifications lues |
| supprimerNotification | Supprimer notification |
| compterNotificationsNonLues | Compter notifications non lues |
| nettoyerNotificationsExpirees | Purger notifications expirees |

