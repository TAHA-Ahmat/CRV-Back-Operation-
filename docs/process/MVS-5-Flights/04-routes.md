# MVS-5-Flights - ROUTES

## Date d'audit : 2026-01-10

---

## vol.routes.js

### Emplacement
`src/routes/flights/vol.routes.js`

### Base path
`/api/vols`

---

### Routes CRUD Vol (existantes)

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | / | creerVol | protect, excludeQualite, validate | Creer vol |
| GET | / | listerVols | protect | Lister vols |
| GET | /:id | obtenirVol | protect | Obtenir vol |
| PATCH | /:id | mettreAJourVol | protect, excludeQualite | Modifier vol |

---

### Validation POST /

```javascript
body('numeroVol').notEmpty()
body('typeOperation').isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND'])
body('compagnieAerienne').notEmpty()
body('codeIATA').isLength({ min: 2, max: 2 })
body('dateVol').isISO8601()
```

---

### Routes Extension 2 - Vol Programme/Hors Programme

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | /:id/lier-programme | lierVolAuProgramme | protect, excludeQualite | Lier vol a programme |
| POST | /:id/marquer-hors-programme | marquerVolHorsProgramme | protect, excludeQualite | Marquer hors programme |
| POST | /:id/detacher-programme | detacherVolDuProgramme | protect, excludeQualite | Detacher du programme |
| GET | /:id/suggerer-programmes | suggererProgrammesPourVol | protect | Suggerer programmes |
| GET | /programme/:programmeVolId | obtenirVolsDuProgramme | protect | Vols d'un programme |
| GET | /hors-programme | obtenirVolsHorsProgramme | protect | Vols hors programme |
| GET | /statistiques/programmes | obtenirStatistiquesVolsProgrammes | protect | Stats programmes |

---

## programmeVol.routes.js

### Emplacement
`src/routes/flights/programmeVol.routes.js`

### Base path
`/api/programmes-vol`

---

### Routes CRUD Programme

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | / | creerProgramme | protect, excludeQualite | Creer programme |
| GET | / | obtenirProgrammes | protect | Lister programmes |
| GET | /:id | obtenirProgrammeParId | protect | Obtenir programme |
| PATCH | /:id | mettreAJourProgramme | protect, excludeQualite | Modifier programme |
| DELETE | /:id | supprimerProgramme | protect, authorize(MANAGER) | Supprimer programme |

---

### Routes Actions Specifiques

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | /:id/valider | validerProgramme | protect, authorize(SUPERVISEUR, MANAGER) | Valider programme |
| POST | /:id/activer | activerProgramme | protect, authorize(SUPERVISEUR, MANAGER) | Activer programme |
| POST | /:id/suspendre | suspendreProgramme | protect, excludeQualite | Suspendre programme |

---

### Routes Recherche et Import

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /applicables/:date | trouverProgrammesApplicables | protect | Programmes pour date |
| POST | /import | importerProgrammes | protect, excludeQualite | Import batch |

---

## Controle d'acces (Phase 1 RBAC)

| Operation | Roles autorises |
|-----------|-----------------|
| Lecture | Tous (operationnels + QUALITE) |
| Creation/Modification/Suspension | AGENT, CHEF, SUPERVISEUR, MANAGER |
| Validation/Activation | SUPERVISEUR, MANAGER |
| Suppression | MANAGER uniquement |

**Middleware excludeQualite** : QUALITE exclu des ecritures

---

## NON-REGRESSION

- Routes CRUD Vol existantes INCHANGEES
- Extension 2 ajoute routes ADDITIONNELLES sur /api/vols
- Extension 1 ajoute nouveau endpoint /api/programmes-vol

