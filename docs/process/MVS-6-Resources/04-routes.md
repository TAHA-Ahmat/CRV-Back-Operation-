# MVS-6-Resources - ROUTES

## Date d'audit : 2026-01-10

---

## engin.routes.js

### Emplacement
`src/routes/resources/engin.routes.js`

### Base path
`/api/engins`

---

## Routes Referentiel Engins

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /types | obtenirTypesEngins | protect | Types d'engins disponibles |
| GET | /disponibles | listerEnginsDisponibles | protect | Engins disponibles |
| GET | / | listerEngins | protect | Lister tous les engins |
| POST | / | creerEngin | protect, authorize(MANAGER, ADMIN), validate | Creer engin |
| GET | /:id | obtenirEngin | protect | Obtenir engin |
| PUT | /:id | mettreAJourEngin | protect, authorize(MANAGER, ADMIN) | Modifier engin |
| DELETE | /:id | supprimerEngin | protect, authorize(ADMIN) | Supprimer engin |

---

## Validation POST /

```javascript
body('numeroEngin').notEmpty()
body('typeEngin').isIn([
  'TRACTEUR', 'CHARIOT_BAGAGES', 'CHARIOT_FRET',
  'GPU', 'ASU', 'STAIRS', 'CONVOYEUR', 'AUTRE'
])
```

---

## Routes Affectation (definies dans crv.routes.js)

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| GET | /api/crv/:id/engins | obtenirEnginsAffectes | Engins d'un CRV |
| PUT | /api/crv/:id/engins | mettreAJourEnginsAffectes | MAJ engins CRV |
| POST | /api/crv/:id/engins | ajouterEnginAuCRV | Ajouter engin |
| DELETE | /api/crv/:id/engins/:affectationId | retirerEnginDuCRV | Retirer engin |

---

## Controle d'acces

| Operation | Roles autorises |
|-----------|-----------------|
| Lecture (GET) | Tous authentifies |
| Creation engin | MANAGER, ADMIN |
| Modification engin | MANAGER, ADMIN |
| Suppression engin | ADMIN uniquement |
| Affectation CRV | Tous sauf QUALITE (excludeQualite) |

---

## Note sur l'ordre des routes

Les routes non-parametrisees (`/types`, `/disponibles`) sont declarees AVANT les routes parametrisees (`/:id`) pour eviter les conflits de matching.

