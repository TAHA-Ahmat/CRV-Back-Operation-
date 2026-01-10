# MVS-10-Validation

## Presentation factuelle

Le MVS-10-Validation gere le processus de validation et verrouillage des CRV par le service Qualite.

---

## Perimetre exact couvert

### Fonctionnalites
- Validation des CRV par le service Qualite
- Calcul du score de completude
- Verification de conformite SLA
- Verrouillage definitif des CRV valides
- Deverrouillage exceptionnel (ADMIN)
- Historique complet des actions

### Entites gerees
- **ValidationCRV** : Fiche de validation d'un CRV (1:1)

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/validation/:id | Obtenir validation |
| POST | /api/validation/:id/valider | Valider CRV |
| POST | /api/validation/:id/rejeter | Rejeter CRV |
| POST | /api/validation/:id/verrouiller | Verrouiller CRV |
| POST | /api/validation/:id/deverrouiller | Deverrouiller CRV |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | ValidationCRV |
| 02-services.md | Constat absence service |
| 03-controllers.md | validation.controller |
| 04-routes.md | validation.routes |
| 05-process-metier.md | 5 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-1-Security | User (validePar, verrouillePar) |
| MVS-2-CRV | CRV (validation) |
| MVS-3-Phases | Phase (ecartsSLA) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | Statut validation |

---

## Structure des fichiers

```
src/
├── models/validation/
│   ├── ValidationCRV.js
│   └── index.js
├── services/validation/
│   └── (vide - pas de service)
├── controllers/validation/
│   ├── validation.controller.js
│   └── index.js
└── routes/validation/
    └── validation.routes.js
```

---

## Workflow de validation

```
CRV TERMINE
     |
     v
[QUALITE valide] ────────> CRV VALIDE
     |                          |
     v                          v
[QUALITE rejete]         [QUALITE verrouille]
     |                          |
     v                          v
CRV EN_COURS              CRV VERROUILLE
(corrections)                   |
                               v
                    [ADMIN deverrouille]
                               |
                               v
                          CRV VALIDE
```

---

## Statuts de validation

| Statut | Description |
|--------|-------------|
| EN_ATTENTE | Validation en cours |
| VALIDE | CRV valide par Qualite |
| REJETE | CRV rejete pour corrections |
| VERROUILLE | CRV verrouille definitivement |

---

## Score de completude

| Critere | Poids |
|---------|-------|
| Vol reference | 15% |
| Horaire depart reel | 10% |
| Horaire arrivee reel | 10% |
| Passagers renseignes | 15% |
| Bagages renseignes | 10% |
| Fret renseigne | 10% |
| Phases operationnelles | 20% |
| Engins affectes | 10% |

---

## Controle d'acces

| Operation | Roles |
|-----------|-------|
| Consultation | Tous authentifies |
| Validation | QUALITE, ADMIN |
| Rejet | QUALITE, ADMIN |
| Verrouillage | QUALITE, ADMIN |
| Deverrouillage | ADMIN uniquement |

---

## Date d'audit

**2026-01-10**

