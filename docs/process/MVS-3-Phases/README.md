# MVS-3-Phases

## Presentation factuelle

Le MVS-3-Phases gere les phases operationnelles des operations au sol. Il definit le referentiel des phases standard et trace leur execution pour chaque CRV.

---

## Perimetre exact couvert

### Fonctionnalites
- Referentiel des phases operationnelles
- Initialisation phases pour chaque CRV
- Suivi execution (demarrer, terminer, non realise)
- Gestion des prerequis entre phases
- Calcul automatique des durees et ecarts
- Gestion des horaires du vol

### Entites gerees
- **Phase** : Referentiel phases standard
- **ChronologiePhase** : Instance phase/CRV
- **Horaire** : Horaires du vol

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/phases | Lister phases (query: crvId) |
| GET | /api/phases/:id | Obtenir phase |
| POST | /api/phases/:id/demarrer | Demarrer phase |
| POST | /api/phases/:id/terminer | Terminer phase |
| POST | /api/phases/:id/non-realise | Marquer non realisee |
| PATCH | /api/phases/:id | Modifier phase |
| PUT | /api/crv/:crvId/phases/:phaseId | Modifier via CRV |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Phase, ChronologiePhase, Horaire |
| 02-services.md | phase.service.js |
| 03-controllers.md | phase.controller.js |
| 04-routes.md | phase.routes.js |
| 05-process-metier.md | 4 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-1-Security | Personne (responsable) |
| MVS-5-Flights | Vol (horaire) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | ChronologiePhase, Horaire |

---

## Structure des fichiers

```
src/
├── models/phases/
│   ├── Phase.js
│   ├── ChronologiePhase.js
│   └── Horaire.js
├── services/phases/
│   └── phase.service.js
├── controllers/phases/
│   └── phase.controller.js
└── routes/phases/
    └── phase.routes.js
```

---

## Machine a etats ChronologiePhase

| Statut | Description | Transitions |
|--------|-------------|-------------|
| NON_COMMENCE | Initial | EN_COURS |
| EN_COURS | En execution | TERMINE |
| TERMINE | Execute | - |
| NON_REALISE | Non effectue | - |
| ANNULE | Annule | - |

---

## Date d'audit

**2026-01-10**
