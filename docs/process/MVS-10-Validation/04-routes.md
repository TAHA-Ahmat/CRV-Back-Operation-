# MVS-10-Validation - ROUTES

## Date d'audit : 2026-01-10

---

## validation.routes.js

### Emplacement
`src/routes/validation/validation.routes.js`

### Base path
`/api/validation`

---

## Routes

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /:id | obtenirValidationCRV | protect | Obtenir validation |
| POST | /:id/valider | validerCRVController | protect, authorize(QUALITE, ADMIN) | Valider CRV |
| POST | /:id/rejeter | rejeterCRVController | protect, authorize(QUALITE, ADMIN) | Rejeter CRV |
| POST | /:id/verrouiller | verrouilleCRVController | protect, authorize(QUALITE, ADMIN) | Verrouiller CRV |
| POST | /:id/deverrouiller | deverrouillerCRVController | protect, authorize(ADMIN) | Deverrouiller CRV |

---

## Controle d'acces

| Operation | Roles autorises |
|-----------|-----------------|
| Lecture validation | Tous authentifies |
| Validation CRV | QUALITE, ADMIN |
| Rejet CRV | QUALITE, ADMIN |
| Verrouillage CRV | QUALITE, ADMIN |
| Deverrouillage CRV | ADMIN uniquement |

---

## Note importante

Le parametre `:id` dans les routes correspond a l'ID du **CRV**, pas a l'ID de la validation.
La validation est liee au CRV par une relation 1:1.

---

## Workflow de validation

```
CRV EN_COURS -> valider -> VALIDE -> verrouiller -> VERROUILLE
                  |
                  v
               rejeter -> EN_COURS (modifications possibles)

VERROUILLE -> deverrouiller (ADMIN only) -> VALIDE
```

