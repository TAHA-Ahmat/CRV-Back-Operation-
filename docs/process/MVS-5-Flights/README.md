# MVS-5-Flights

## Presentation factuelle

Le MVS-5-Flights gere les vols et les programmes de vols saisonniers. Il inclut l'extension 1 (programmes vols recurrents) et l'extension 2 (distinction vols programmes/hors programme).

---

## Perimetre exact couvert

### Fonctionnalites
- CRUD Vols
- Gestion programmes vols saisonniers (recurrence)
- Cycle de vie programme (BROUILLON -> VALIDE -> ACTIF -> SUSPENDU)
- Liaison vols aux programmes
- Classification vols hors programme
- Statistiques vols programmes vs hors programme

### Entites gerees
- **Vol** : Vol individuel
- **ProgrammeVolSaisonnier** : Programme recurrent

### Endpoints exposes

#### Vols
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/vols | Creer vol |
| GET | /api/vols | Lister vols |
| GET | /api/vols/:id | Obtenir vol |
| PATCH | /api/vols/:id | Modifier vol |
| POST | /api/vols/:id/lier-programme | Lier au programme |
| POST | /api/vols/:id/marquer-hors-programme | Marquer hors programme |
| POST | /api/vols/:id/detacher-programme | Detacher du programme |
| GET | /api/vols/:id/suggerer-programmes | Suggerer programmes |
| GET | /api/vols/programme/:id | Vols d'un programme |
| GET | /api/vols/hors-programme | Vols hors programme |
| GET | /api/vols/statistiques/programmes | Stats programmes |

#### Programmes Vol
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/programmes-vol | Creer programme |
| GET | /api/programmes-vol | Lister programmes |
| GET | /api/programmes-vol/:id | Obtenir programme |
| PATCH | /api/programmes-vol/:id | Modifier programme |
| DELETE | /api/programmes-vol/:id | Supprimer programme |
| POST | /api/programmes-vol/:id/valider | Valider programme |
| POST | /api/programmes-vol/:id/activer | Activer programme |
| POST | /api/programmes-vol/:id/suspendre | Suspendre programme |
| GET | /api/programmes-vol/applicables/:date | Programmes pour date |
| POST | /api/programmes-vol/import | Import batch |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Vol, ProgrammeVolSaisonnier |
| 02-services.md | vol.service, programmeVol.service |
| 03-controllers.md | vol.controller, volProgramme.controller, programmeVol.controller |
| 04-routes.md | vol.routes, programmeVol.routes |
| 05-process-metier.md | 7 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-8-Referentials | Avion (reference optionnelle) |
| MVS-1-Security | UserActivityLog (audit), User (createdBy, validePar) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | Vol (reference) |
| MVS-3-Phases | Horaire lie au Vol |

---

## Structure des fichiers

```
src/
├── models/flights/
│   ├── Vol.js
│   ├── ProgrammeVolSaisonnier.js
│   └── index.js
├── services/flights/
│   ├── vol.service.js
│   └── programmeVol.service.js
├── controllers/flights/
│   ├── vol.controller.js
│   ├── volProgramme.controller.js
│   ├── programmeVol.controller.js
│   └── index.js
└── routes/flights/
    ├── vol.routes.js
    └── programmeVol.routes.js
```

---

## Machine a etats Programme Vol Saisonnier

| Statut | Description | Transitions |
|--------|-------------|-------------|
| BROUILLON | En creation | VALIDE |
| VALIDE | Valide | ACTIF |
| ACTIF | Operationnel | SUSPENDU, TERMINE |
| SUSPENDU | Temporairement inactif | ACTIF |
| TERMINE | Periode ecoulee | - |

---

## Types Vol Hors Programme

| Type | Description |
|------|-------------|
| CHARTER | Vol charter ponctuel |
| MEDICAL | Evacuation medicale |
| TECHNIQUE | Vol technique (test, maintenance) |
| COMMERCIAL | Vol commercial ponctuel |
| AUTRE | Autre type |

---

## Date d'audit

**2026-01-10**

