# MVS-8-Referentials - ROUTES

## Date d'audit : 2026-01-10

---

## avion.routes.js

### Emplacement
`src/routes/referentials/avion.routes.js`

### Base path
`/api/avions`

---

## Routes Referentiel

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /actifs | listerAvionsActifs | protect | Avions actifs |
| GET | /recherche/:immatriculation | rechercherAvionParImmatriculation | protect | Recherche par immat |
| GET | / | listerAvions | protect | Lister avions |
| POST | / | creerAvion | protect, authorize(MANAGER, ADMIN) | Creer avion |
| GET | /:id | obtenirAvion | protect | Obtenir avion |
| PUT | /:id | mettreAJourAvion | protect, authorize(MANAGER, ADMIN) | Modifier avion |
| DELETE | /:id | supprimerAvion | protect, authorize(ADMIN) | Supprimer avion |

---

## Routes Configuration (Extension 3)

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| PUT | /:id/configuration | mettreAJourConfiguration | protect, authorize(MANAGER, ADMIN) | MAJ configuration |
| GET | /:id/versions | obtenirHistoriqueVersions | protect | Historique versions |
| POST | /:id/versions/:versionNum/restaurer | restaurerVersion | protect, authorize(ADMIN) | Restaurer version |

---

## Controle d'acces

| Operation | Roles autorises |
|-----------|-----------------|
| Lecture (GET) | Tous authentifies |
| Creation | MANAGER, ADMIN |
| Modification | MANAGER, ADMIN |
| Modification configuration | MANAGER, ADMIN |
| Suppression | ADMIN uniquement |
| Restauration version | ADMIN uniquement |

---

## Query Parameters (GET /)

| Parametre | Type | Description |
|-----------|------|-------------|
| compagnie | String | Filtrer par compagnie |
| typeAvion | String | Filtrer par type |
| actif | Boolean | Filtrer par statut actif |
| page | Number | Numero de page |
| limit | Number | Limite par page (default 50) |

---

## Note sur l'ordre des routes

Les routes non-parametrisees (`/actifs`, `/recherche/:immat`) sont declarees AVANT les routes parametrisees (`/:id`) pour eviter les conflits de matching.

