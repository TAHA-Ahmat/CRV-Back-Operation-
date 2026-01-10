# MVS-8-Referentials - CONTROLLERS

## Date d'audit : 2026-01-10

---

## avionConfiguration.controller.js

### Emplacement
`src/controllers/referentials/avionConfiguration.controller.js`

---

## Handlers Referentiel Avions

### listerAvions

| Element | Detail |
|---------|--------|
| Route | GET /api/avions |
| Middlewares | protect |
| Query | compagnie, typeAvion, actif, page, limit |
| Pagination | Oui (default limit=50) |
| Tri | compagnie ASC, immatriculation ASC |
| Reponse 200 | { success: true, data: avions, pagination } |

---

### obtenirAvion

| Element | Detail |
|---------|--------|
| Route | GET /api/avions/:id |
| Middlewares | protect |
| Reponse 200 | { success: true, data: avion } |
| Reponse 404 | Avion non trouve |

---

### creerAvion

| Element | Detail |
|---------|--------|
| Route | POST /api/avions |
| Middlewares | protect, authorize(MANAGER, ADMIN) |
| Body | { immatriculation, typeAvion, compagnie, capaciteMax, configuration, remarques } |
| Validation | Unicite immatriculation |
| Etat initial | actif = true, version = 1 |
| Reponse 201 | { success: true, message, data: avion } |
| Reponse 400 | AVION_DUPLIQUE si immatriculation existe |

---

### mettreAJourAvion

| Element | Detail |
|---------|--------|
| Route | PUT /api/avions/:id |
| Middlewares | protect, authorize(MANAGER, ADMIN) |
| Body | { typeAvion, compagnie, capaciteMax, actif, remarques } |
| Reponse 200 | { success: true, message, data: avion } |
| Reponse 404 | Avion non trouve |

---

### supprimerAvion

| Element | Detail |
|---------|--------|
| Route | DELETE /api/avions/:id |
| Middlewares | protect, authorize(ADMIN) |
| Validation | Pas de vols associes |
| Reponse 200 | { success: true, message } |
| Reponse 400 | AVION_EN_UTILISATION si vols existent |
| Reponse 404 | Avion non trouve |

---

## Handlers Configuration (Extension 3)

### mettreAJourConfiguration

| Element | Detail |
|---------|--------|
| Route | PUT /api/avions/:id/configuration |
| Middlewares | protect, authorize(MANAGER, ADMIN) |
| Body | { configuration, commentaire } |
| Logique | Sauvegarde version precedente dans historiqueVersions |
| Increment | version += 1 |
| Reponse 200 | { success: true, message, data: avion } |
| Reponse 404 | Avion non trouve |

**Logique de versioning** :
```javascript
// Sauvegarder version actuelle dans historique
avion.historiqueVersions.push({
  version: avion.version,
  configuration: avion.configuration,
  dateModification: new Date(),
  modifiePar: req.user._id,
  commentaire: req.body.commentaire || 'Mise a jour configuration'
});

// Incrementer version
avion.version += 1;

// Appliquer nouvelle configuration
avion.configuration = req.body.configuration;
```

---

### obtenirHistoriqueVersions

| Element | Detail |
|---------|--------|
| Route | GET /api/avions/:id/versions |
| Middlewares | protect |
| Populate | historiqueVersions.modifiePar (nom, prenom) |
| Reponse 200 | { success: true, data: { version, historiqueVersions } } |
| Reponse 404 | Avion non trouve |

---

### restaurerVersion

| Element | Detail |
|---------|--------|
| Route | POST /api/avions/:id/versions/:versionNum/restaurer |
| Middlewares | protect, authorize(ADMIN) |
| Logique | Restaure configuration d'une version anterieure |
| Reponse 200 | { success: true, message, data: avion } |
| Reponse 400 | Version non trouvee |
| Reponse 404 | Avion non trouve |

---

## Handlers Recherche

### rechercherAvionParImmatriculation

| Element | Detail |
|---------|--------|
| Route | GET /api/avions/recherche/:immatriculation |
| Middlewares | protect |
| Recherche | Case-insensitive, uppercase |
| Reponse 200 | { success: true, data: avion } |
| Reponse 404 | Avion non trouve |

---

### listerAvionsActifs

| Element | Detail |
|---------|--------|
| Route | GET /api/avions/actifs |
| Middlewares | protect |
| Filtre | actif = true |
| Tri | compagnie ASC, immatriculation ASC |
| Reponse 200 | { success: true, data: avions } |

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| listerAvions | GET /avions | Lister referentiel |
| obtenirAvion | GET /avions/:id | Obtenir avion |
| creerAvion | POST /avions | Creer avion |
| mettreAJourAvion | PUT /avions/:id | Modifier avion |
| supprimerAvion | DELETE /avions/:id | Supprimer avion |
| mettreAJourConfiguration | PUT /avions/:id/configuration | MAJ configuration |
| obtenirHistoriqueVersions | GET /avions/:id/versions | Historique versions |
| restaurerVersion | POST /avions/:id/versions/:v/restaurer | Restaurer version |
| rechercherAvionParImmatriculation | GET /avions/recherche/:immat | Recherche par immat |
| listerAvionsActifs | GET /avions/actifs | Avions actifs |

