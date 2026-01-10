# MVS-6-Resources

## Presentation factuelle

Le MVS-6-Resources gere le parc materiel au sol (engins) et leurs affectations aux vols via les CRV.

---

## Perimetre exact couvert

### Fonctionnalites
- Referentiel engins du parc materiel
- CRUD engins
- Affectation engins aux vols (via CRV)
- Gestion statuts operationnels engins
- Suivi revisions/maintenance

### Entites gerees
- **Engin** : Materiel au sol (tracteur, chariot, GPU, etc.)
- **AffectationEnginVol** : Liaison engin-vol

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/engins/types | Types d'engins disponibles |
| GET | /api/engins/disponibles | Engins disponibles |
| GET | /api/engins | Lister engins |
| POST | /api/engins | Creer engin |
| GET | /api/engins/:id | Obtenir engin |
| PUT | /api/engins/:id | Modifier engin |
| DELETE | /api/engins/:id | Supprimer engin |
| GET | /api/crv/:id/engins | Engins d'un CRV |
| PUT | /api/crv/:id/engins | MAJ engins CRV |
| POST | /api/crv/:id/engins | Ajouter engin |
| DELETE | /api/crv/:id/engins/:id | Retirer engin |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Engin, AffectationEnginVol |
| 02-services.md | Constat absence service |
| 03-controllers.md | engin.controller |
| 04-routes.md | engin.routes + routes CRV |
| 05-process-metier.md | 5 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | CRV (pour routes affectation) |
| MVS-5-Flights | Vol (reference) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | Engins affectes au CRV |

---

## Structure des fichiers

```
src/
├── models/resources/
│   ├── Engin.js
│   ├── AffectationEnginVol.js
│   └── index.js
├── services/resources/
│   └── (vide - pas de service)
├── controllers/resources/
│   ├── engin.controller.js
│   └── index.js
└── routes/resources/
    └── engin.routes.js
```

---

## Types d'engins

| Type | Description | Usage |
|------|-------------|-------|
| TRACTEUR | Tracteur avion | TRACTAGE |
| CHARIOT_BAGAGES | Chariot bagages | BAGAGES |
| CHARIOT_FRET | Chariot fret | FRET |
| GPU | Ground Power Unit | ALIMENTATION_ELECTRIQUE |
| ASU | Air Starter Unit | CLIMATISATION |
| STAIRS | Passerelle/Escalier | PASSERELLE |
| CONVOYEUR | Convoyeur a bande | CHARGEMENT |
| AUTRE | Autre materiel | CHARGEMENT |

---

## Statuts Engin

| Statut | Description |
|--------|-------------|
| DISPONIBLE | Pret a l'emploi |
| EN_SERVICE | Actuellement utilise |
| MAINTENANCE | En maintenance |
| PANNE | Hors service temporaire |
| HORS_SERVICE | Retire du parc |

---

## Date d'audit

**2026-01-10**

