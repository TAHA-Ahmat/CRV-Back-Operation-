# MVS-7-Notifications

## Presentation factuelle

Le MVS-7-Notifications gere les notifications in-app et l'envoi d'emails aux utilisateurs (Extension 7).

---

## Perimetre exact couvert

### Fonctionnalites
- Notifications in-app (creation, lecture, suppression)
- Envoi d'emails via SMTP
- Marquage notifications comme lues
- Comptage notifications non lues
- Nettoyage notifications expirees

### Entites gerees
- **Notification** : Message in-app pour un utilisateur

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/notifications | Mes notifications |
| GET | /api/notifications/count | Compter non lues |
| POST | /api/notifications | Creer notification |
| PATCH | /api/notifications/:id/lire | Marquer lue |
| PATCH | /api/notifications/lire-toutes | Marquer toutes lues |
| DELETE | /api/notifications/:id | Supprimer |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Notification |
| 02-services.md | notification.service (email + in-app) |
| 03-controllers.md | notification.controller |
| 04-routes.md | notification.routes |
| 05-process-metier.md | 7 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-1-Security | User (destinataire) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| Tous | Notifications sur evenements |

---

## Structure des fichiers

```
src/
├── models/notifications/
│   ├── Notification.js
│   └── index.js
├── services/notifications/
│   ├── notification.service.js
│   └── index.js
├── controllers/notifications/
│   ├── notification.controller.js
│   └── index.js
└── routes/notifications/
    └── notification.routes.js
```

---

## Types de notification

| Type | Description |
|------|-------------|
| INFO | Information generale |
| WARNING | Avertissement |
| ERROR | Erreur |
| SUCCESS | Succes/Confirmation |
| ALERTE_SLA | Alerte SLA specifique |

---

## Priorites

| Priorite | Description |
|----------|-------------|
| BASSE | Priorite basse |
| NORMALE | Priorite normale (defaut) |
| HAUTE | Priorite haute |
| URGENTE | Priorite urgente |

---

## Canaux

| Canal | Description |
|-------|-------------|
| email | Notification par email |
| sms | Notification par SMS |
| push | Notification push |
| inApp | Notification in-app (defaut) |

---

## Extension 7

Ce MVS implemente l'Extension 7 (Notifications In-App) qui permet aux utilisateurs de recevoir des notifications directement dans l'interface.

---

## Date d'audit

**2026-01-10**

