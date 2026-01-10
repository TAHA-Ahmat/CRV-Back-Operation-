# MVS-6-Resources - CONTROLLERS

## Date d'audit : 2026-01-10

---

## engin.controller.js

### Emplacement
`src/controllers/resources/engin.controller.js`

---

## Referentiel Engins (Parc Materiel)

### listerEngins

| Element | Detail |
|---------|--------|
| Route | GET /api/engins |
| Middlewares | protect |
| Query | typeEngin, statut, page, limit |
| Pagination | Oui (default limit=50) |
| Tri | typeEngin ASC, numeroEngin ASC |
| Reponse 200 | { success: true, data: engins, pagination } |

---

### obtenirEngin

| Element | Detail |
|---------|--------|
| Route | GET /api/engins/:id |
| Middlewares | protect |
| Reponse 200 | { success: true, data: engin } |
| Reponse 404 | Engin non trouve |

---

### creerEngin

| Element | Detail |
|---------|--------|
| Route | POST /api/engins |
| Middlewares | protect, authorize(MANAGER, ADMIN), validate |
| Body | { numeroEngin, typeEngin, marque, modele, remarques } |
| Validation | Unicite numeroEngin |
| Etat initial | statut = DISPONIBLE |
| Reponse 201 | { success: true, message, data: engin } |
| Reponse 400 | Code ENGIN_DUPLIQUE si existe |

---

### mettreAJourEngin

| Element | Detail |
|---------|--------|
| Route | PUT /api/engins/:id |
| Middlewares | protect, authorize(MANAGER, ADMIN) |
| Body | { typeEngin, marque, modele, statut, derniereRevision, prochaineRevision, remarques } |
| Reponse 200 | { success: true, message, data: engin } |
| Reponse 404 | Engin non trouve |

---

### supprimerEngin

| Element | Detail |
|---------|--------|
| Route | DELETE /api/engins/:id |
| Middlewares | protect, authorize(ADMIN) |
| Validation | Aucune affectation existante |
| Reponse 200 | { success: true, message } |
| Reponse 400 | Code ENGIN_EN_UTILISATION si affectations existent |
| Reponse 404 | Engin non trouve |

---

### listerEnginsDisponibles

| Element | Detail |
|---------|--------|
| Route | GET /api/engins/disponibles |
| Middlewares | protect |
| Query | typeEngin (optionnel) |
| Filtre | statut IN (DISPONIBLE, EN_SERVICE) |
| Reponse 200 | { success: true, data: engins } |

---

### obtenirTypesEngins

| Element | Detail |
|---------|--------|
| Route | GET /api/engins/types |
| Middlewares | protect |
| Reponse 200 | { success: true, data: types } |

**Types retournes** :
```javascript
[
  { value: 'TRACTEUR', label: 'Tracteur', usages: ['TRACTAGE'] },
  { value: 'CHARIOT_BAGAGES', label: 'Chariot bagages', usages: ['BAGAGES'] },
  { value: 'CHARIOT_FRET', label: 'Chariot fret', usages: ['FRET'] },
  { value: 'GPU', label: 'GPU (Ground Power Unit)', usages: ['ALIMENTATION_ELECTRIQUE'] },
  { value: 'ASU', label: 'ASU (Air Starter Unit)', usages: ['CLIMATISATION'] },
  { value: 'STAIRS', label: 'Passerelle/Escalier', usages: ['PASSERELLE'] },
  { value: 'CONVOYEUR', label: 'Convoyeur a bande', usages: ['CHARGEMENT', 'BAGAGES', 'FRET'] },
  { value: 'AUTRE', label: 'Autre', usages: ['CHARGEMENT'] }
]
```

---

## Affectation Engins au CRV/Vol

### obtenirEnginsAffectes

| Element | Detail |
|---------|--------|
| Route | GET /api/crv/:id/engins |
| Middlewares | protect |
| Populate | engin |
| Reponse 200 | { success: true, data: { engins, nbEngins } } |
| Reponse 404 | CRV non trouve |

---

### mettreAJourEnginsAffectes

| Element | Detail |
|---------|--------|
| Route | PUT /api/crv/:id/engins |
| Middlewares | protect, excludeQualite |
| Body | { engins: [...] } |
| Logique | Supprime toutes anciennes + Cree nouvelles |
| Creation auto | Cree engin s'il n'existe pas |
| Validation | CRV non verrouille |
| Reponse 200 | { success: true, message, data: { engins, nbEngins } } |
| Reponse 400 | Format invalide |
| Reponse 403 | CRV verrouille |
| Reponse 404 | CRV non trouve |

---

### ajouterEnginAuCRV

| Element | Detail |
|---------|--------|
| Route | POST /api/crv/:id/engins |
| Middlewares | protect, excludeQualite |
| Body | { enginId, heureDebut, heureFin, usage, remarques } |
| Validation | CRV non verrouille, engin existe |
| Reponse 201 | { success: true, message, data: affectation } |
| Reponse 403 | CRV verrouille |
| Reponse 404 | CRV ou engin non trouve |

---

### retirerEnginDuCRV

| Element | Detail |
|---------|--------|
| Route | DELETE /api/crv/:id/engins/:affectationId |
| Middlewares | protect, excludeQualite |
| Validation | CRV non verrouille |
| Reponse 200 | { success: true, message } |
| Reponse 403 | CRV verrouille |
| Reponse 404 | CRV ou affectation non trouve |

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| listerEngins | GET /engins | Lister parc |
| obtenirEngin | GET /engins/:id | Obtenir engin |
| creerEngin | POST /engins | Creer engin |
| mettreAJourEngin | PUT /engins/:id | Modifier engin |
| supprimerEngin | DELETE /engins/:id | Supprimer engin |
| listerEnginsDisponibles | GET /engins/disponibles | Engins disponibles |
| obtenirTypesEngins | GET /engins/types | Types engins |
| obtenirEnginsAffectes | GET /crv/:id/engins | Engins d'un CRV |
| mettreAJourEnginsAffectes | PUT /crv/:id/engins | MAJ engins CRV |
| ajouterEnginAuCRV | POST /crv/:id/engins | Ajouter engin |
| retirerEnginDuCRV | DELETE /crv/:id/engins/:id | Retirer engin |

