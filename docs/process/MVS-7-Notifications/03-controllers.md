# MVS-7-Notifications - CONTROLLERS

## Date d'audit : 2026-01-10

---

## notification.controller.js

### Emplacement
`src/controllers/notifications/notification.controller.js`

---

## Handlers

### obtenirMesNotifications

| Element | Detail |
|---------|--------|
| Route | GET /api/notifications |
| Middlewares | protect |
| Query | nonLuesSeulement, type, limit, page |
| Service | notificationService.obtenirNotificationsUtilisateur |
| Reponse 200 | { success: true, data: { notifications, total, nonLues }, pagination } |

**Logique** :
```javascript
const options = {
  nonLuesSeulement: req.query.nonLuesSeulement === 'true',
  type: req.query.type,
  limit: parseInt(req.query.limit) || 50,
  skip: ((parseInt(req.query.page) || 1) - 1) * limit
};
const result = await notificationService.obtenirNotificationsUtilisateur(
  req.user._id,
  options
);
```

---

### creerNotification

| Element | Detail |
|---------|--------|
| Route | POST /api/notifications |
| Middlewares | protect, authorize(ADMIN, MANAGER) |
| Body | { destinataireId, type, titre, message, options } |
| Service | notificationService.creerNotificationInApp |
| Reponse 201 | { success: true, data: notification } |
| Reponse 400 | Validation error |

---

### marquerCommeLue

| Element | Detail |
|---------|--------|
| Route | PATCH /api/notifications/:id/lire |
| Middlewares | protect |
| Params | id (notification) |
| Service | notificationService.marquerCommeLue |
| Verification | Notification appartient a req.user |
| Reponse 200 | { success: true, data: notification } |
| Reponse 404 | Notification non trouvee |
| Reponse 403 | Acces non autorise |

---

### marquerToutesCommeLues

| Element | Detail |
|---------|--------|
| Route | PATCH /api/notifications/lire-toutes |
| Middlewares | protect |
| Service | notificationService.marquerToutesCommeLues |
| Reponse 200 | { success: true, message, data: { modifiedCount } } |

---

### supprimerNotification

| Element | Detail |
|---------|--------|
| Route | DELETE /api/notifications/:id |
| Middlewares | protect |
| Params | id (notification) |
| Service | notificationService.supprimerNotification |
| Verification | Notification appartient a req.user |
| Reponse 200 | { success: true, message } |
| Reponse 404 | Notification non trouvee |
| Reponse 403 | Acces non autorise |

---

### compterNonLues

| Element | Detail |
|---------|--------|
| Route | GET /api/notifications/count |
| Middlewares | protect |
| Service | notificationService.compterNotificationsNonLues |
| Reponse 200 | { success: true, data: { count } } |

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| obtenirMesNotifications | GET / | Lister mes notifications |
| creerNotification | POST / | Creer notification (admin) |
| marquerCommeLue | PATCH /:id/lire | Marquer comme lue |
| marquerToutesCommeLues | PATCH /lire-toutes | Marquer toutes lues |
| supprimerNotification | DELETE /:id | Supprimer notification |
| compterNonLues | GET /count | Compter non lues |

