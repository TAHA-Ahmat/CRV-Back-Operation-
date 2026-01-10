# MVS-7-Notifications - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION NOTIFICATION IN-APP

### Objectif
Creer une notification pour un utilisateur.

### Sequence

```
[Client/Systeme] POST /api/notifications
    |-- Body: { destinataireId, type, titre, message, options }
    |
    v
[Middlewares] protect, authorize(ADMIN, MANAGER)
    |
    v
[Controller] creerNotification
    |
    v
[Service] notificationService.creerNotificationInApp
    |
    |-- 1. Valider parametres
    |-- 2. Definir priorite (default NORMALE)
    |-- 3. Definir canaux (default [inApp])
    |
    v
[Model] Notification.create({
    destinataire,
    type,
    titre,
    message,
    lue: false,
    priorite,
    canaux,
    source,
    expiration
})
    |
    v
[Response] 201 + { data: notification }
```

---

## PROCESS 2 : ENVOI EMAIL

### Objectif
Envoyer un email a un destinataire.

### Sequence

```
[Systeme] Appel notificationService.envoyerEmail
    |-- Parametres: destinataire, sujet, contenu, options
    |
    v
[Service] envoyerEmail
    |
    |-- 1. Creer transport nodemailer
    |-- 2. Configurer options email
    |       - from: SMTP_FROM
    |       - to: destinataire
    |       - subject: sujet
    |       - html: contenu
    |       - cc, bcc, replyTo, attachments
    |
    v
[Nodemailer] transporter.sendMail(mailOptions)
    |
    v
[Retour] { success: true, messageId }
         ou { success: false, error }
```

---

## PROCESS 3 : LECTURE NOTIFICATIONS UTILISATEUR

### Objectif
Recuperer les notifications d'un utilisateur.

### Sequence

```
[Client] GET /api/notifications?nonLuesSeulement=true&type=INFO
    |
    v
[Middlewares] protect
    |
    v
[Controller] obtenirMesNotifications
    |
    v
[Service] obtenirNotificationsUtilisateur
    |
    |-- 1. Construire query { destinataire: userId }
    |-- 2. Appliquer filtres optionnels
    |       - nonLuesSeulement -> lue: false
    |       - type -> type
    |-- 3. Compter total et non lues
    |-- 4. Appliquer pagination (limit, skip)
    |-- 5. Trier par createdAt DESC
    |
    v
[Response] 200 + {
    data: { notifications, total, nonLues },
    pagination
}
```

---

## PROCESS 4 : MARQUER NOTIFICATION LUE

### Objectif
Marquer une notification comme lue.

### Sequence

```
[Client] PATCH /api/notifications/:id/lire
    |
    v
[Middlewares] protect
    |
    v
[Controller] marquerCommeLue
    |
    |-- 1. Verifier notification existe
    |-- 2. Verifier proprietaire (destinataire === req.user)
    |
    v
[Service] notificationService.marquerCommeLue
    |
    v
[Model] notification.update({
    lue: true,
    dateLecture: new Date()
})
    |
    v
[Response] 200 + { data: notification }
```

---

## PROCESS 5 : MARQUER TOUTES NOTIFICATIONS LUES

### Objectif
Marquer toutes les notifications d'un utilisateur comme lues.

### Sequence

```
[Client] PATCH /api/notifications/lire-toutes
    |
    v
[Middlewares] protect
    |
    v
[Controller] marquerToutesCommeLues
    |
    v
[Service] notificationService.marquerToutesCommeLues
    |
    v
[Model] Notification.updateMany(
    { destinataire: userId, lue: false },
    { lue: true, dateLecture: new Date() }
)
    |
    v
[Response] 200 + { data: { modifiedCount } }
```

---

## PROCESS 6 : SUPPRESSION NOTIFICATION

### Objectif
Supprimer une notification.

### Sequence

```
[Client] DELETE /api/notifications/:id
    |
    v
[Middlewares] protect
    |
    v
[Controller] supprimerNotification
    |
    |-- 1. Verifier notification existe
    |-- 2. Verifier proprietaire
    |
    v
[Service] notificationService.supprimerNotification
    |
    v
[Model] notification.deleteOne()
    |
    v
[Response] 200 + { message: 'Notification supprimee' }
```

---

## PROCESS 7 : NETTOYAGE NOTIFICATIONS EXPIREES

### Objectif
Purger automatiquement les notifications expirees.

### Sequence

```
[Cron/Systeme] Declenchement periodique
    |
    v
[Service] nettoyerNotificationsExpirees
    |
    v
[Model] Notification.deleteMany({
    expiration: { $lt: new Date() }
})
    |
    v
[Retour] { deletedCount }
```

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Creation notification | POST /notifications | MOYENNE |
| Envoi email | Appel service | MOYENNE |
| Lecture notifications | GET /notifications | BASSE |
| Marquer lue | PATCH /:id/lire | BASSE |
| Marquer toutes lues | PATCH /lire-toutes | BASSE |
| Suppression | DELETE /:id | BASSE |
| Nettoyage expirees | Cron | BASSE |

