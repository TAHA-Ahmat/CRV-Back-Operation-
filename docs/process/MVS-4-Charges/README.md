# MVS-4-Charges

## Presentation factuelle

Le MVS-4-Charges gere les charges operationnelles des vols : passagers, bagages et fret. Il inclut les extensions 4 (categories passagers detaillees) et 5 (fret detaille avec marchandises dangereuses).

---

## Perimetre exact couvert

### Fonctionnalites
- Gestion charges passagers (basiques et detaillees)
- Gestion charges bagages
- Gestion charges fret (basique et detaille)
- Marchandises dangereuses (DG) conformes IATA DGR
- Statistiques par CRV et globales
- Conversion categories basiques vers detaillees

### Entites gerees
- **ChargeOperationnelle** : Charge liee a un CRV

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| PUT | /api/charges/:id/categories-detaillees | Modifier categories passagers |
| PUT | /api/charges/:id/classes | Modifier classes passagers |
| PUT | /api/charges/:id/besoins-medicaux | Modifier besoins medicaux |
| PUT | /api/charges/:id/mineurs | Modifier mineurs |
| POST | /api/charges/:id/convertir-categories-detaillees | Convertir vers detaille |
| PUT | /api/charges/:id/fret-detaille | Modifier fret detaille |
| POST | /api/charges/:id/marchandises-dangereuses | Ajouter marchandise DG |
| DELETE | /api/charges/:id/marchandises-dangereuses/:id | Retirer marchandise DG |
| POST | /api/charges/valider-marchandise-dangereuse | Valider DG |
| GET | /api/charges/marchandises-dangereuses | Lister charges avec DG |
| GET | /api/charges/statistiques/passagers | Stats globales passagers |
| GET | /api/charges/statistiques/fret | Stats globales fret |
| GET | /api/charges/crv/:crvId/statistiques-passagers | Stats passagers par CRV |
| GET | /api/charges/crv/:crvId/statistiques-fret | Stats fret par CRV |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | ChargeOperationnelle (complet) |
| 02-services.md | passager.service, fret.service, calcul.service |
| 03-controllers.md | passager.controller, fret.controller |
| 04-routes.md | charge.routes.js |
| 05-process-metier.md | 7 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | CRV (reference) |
| MVS-1-Security | UserActivityLog (audit) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | Calcul completude (30%) |

---

## Structure des fichiers

```
src/
├── models/charges/
│   └── ChargeOperationnelle.js
├── services/charges/
│   ├── passager.service.js
│   ├── fret.service.js
│   └── calcul.service.js
├── controllers/charges/
│   ├── passager.controller.js
│   ├── fret.controller.js
│   └── index.js
└── routes/charges/
    └── charge.routes.js
```

---

## Regles Metier Critiques

### VIDE =/= ZERO (Cahier des charges S4)

| Valeur | Signification |
|--------|---------------|
| null | Donnee non saisie (champ vide) |
| 0 | Valeur explicite (zero saisi intentionnellement) |

Cette distinction est CRITIQUE pour le calcul de completude.

### Extensions

| Extension | Description |
|-----------|-------------|
| Extension 4 | Categories passagers detaillees (age, PMR, classes, besoins medicaux) |
| Extension 5 | Fret detaille (categories, DG, logistique, douanes, conditions) |

---

## Date d'audit

**2026-01-10**

