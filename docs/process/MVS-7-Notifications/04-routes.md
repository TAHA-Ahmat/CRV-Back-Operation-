# MVS-7-Notifications - ROUTES

## Date d'audit : 2026-01-10

---

## notification.routes.js

### Emplacement
`src/routes/notifications/notification.routes.js`

### Base path
`/api/notifications`

---

## Routes

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | / | obtenirMesNotifications | protect | Mes notifications |
| GET | /count | compterNonLues | protect | Compter non lues |
| POST | / | creerNotification | protect, authorize(ADMIN, MANAGER) | Creer notification |
| PATCH | /:id/lire | marquerCommeLue | protect | Marquer lue |
| PATCH | /lire-toutes | marquerToutesCommeLues | protect | Marquer toutes lues |
| DELETE | /:id | supprimerNotification | protect | Supprimer |

---

## Controle d'acces

| Operation | Roles autorises |
|-----------|-----------------|
| Lecture (GET) | Tous authentifies (propres notifications) |
| Creation | ADMIN, MANAGER |
| Modification (lue) | Proprietaire uniquement |
| Suppression | Proprietaire uniquement |

---

## Query Parameters (GET /)

| Parametre | Type | Description |
|-----------|------|-------------|
| nonLuesSeulement | Boolean | Filtrer non lues |
| type | String | Filtrer par type |
| limit | Number | Limite par page (default 50) |
| page | Number | Numero de page |

---

## Note sur l'ordre des routes

Les routes specifiques (`/count`, `/lire-toutes`) sont declarees AVANT les routes parametrisees (`/:id`) pour eviter les conflits de matching.

