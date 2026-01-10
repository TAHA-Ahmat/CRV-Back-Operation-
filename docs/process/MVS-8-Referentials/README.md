# MVS-8-Referentials

## Presentation factuelle

Le MVS-8-Referentials gere le referentiel des avions avec configuration versionee (Extension 3).

---

## Perimetre exact couvert

### Fonctionnalites
- Referentiel avions de la flotte
- CRUD avions
- Configuration detaillee (sieges, equipements, moteurs)
- Versioning des configurations (Extension 3)
- Historique des modifications
- Restauration de versions anterieures

### Entites gerees
- **Avion** : Aeronef avec configuration versionee

### Endpoints exposes

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/avions | Lister avions |
| GET | /api/avions/actifs | Avions actifs |
| GET | /api/avions/recherche/:immat | Recherche par immat |
| POST | /api/avions | Creer avion |
| GET | /api/avions/:id | Obtenir avion |
| PUT | /api/avions/:id | Modifier avion |
| DELETE | /api/avions/:id | Supprimer avion |
| PUT | /api/avions/:id/configuration | MAJ configuration |
| GET | /api/avions/:id/versions | Historique versions |
| POST | /api/avions/:id/versions/:v/restaurer | Restaurer version |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Avion avec Extension 3 |
| 02-services.md | Constat absence service |
| 03-controllers.md | avionConfiguration.controller |
| 04-routes.md | avion.routes |
| 05-process-metier.md | 6 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-1-Security | User (modifiePar dans historique) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-5-Flights | Vol.avion |
| MVS-2-CRV | CRV.avion (reference) |

---

## Structure des fichiers

```
src/
├── models/referentials/
│   ├── Avion.js
│   └── index.js
├── services/referentials/
│   └── (vide - pas de service)
├── controllers/referentials/
│   ├── avionConfiguration.controller.js
│   └── index.js
└── routes/referentials/
    └── avion.routes.js
```

---

## Extension 3 : Versioning et Configuration

### Principe
Chaque modification de configuration cree une nouvelle version.
L'historique complet est conserve pour tracabilite et rollback.

### Champs ajoutes
- version (Number)
- configuration (Object)
- historiqueVersions (Array)

### Comportement
1. MAJ configuration -> sauvegarde version actuelle dans historique
2. Increment version
3. Application nouvelle configuration
4. Restauration possible d'une version anterieure (cree nouvelle version)

---

## Types de revision

| Type | Description |
|------|-------------|
| A | Check A (legere, environ 500h) |
| B | Check B (intermediaire) |
| C | Check C (lourde, environ 15-18 mois) |
| D | Check D (majeure, environ 6 ans) |

---

## Equipements disponibles

| Equipement | Description |
|------------|-------------|
| WIFI | Wifi a bord |
| IFE | In-Flight Entertainment |
| USB | Ports USB sieges |
| PRISE_ELECTRIQUE | Prises electriques |
| CUISINE | Cuisine equipee |
| BAR | Bar a bord |

---

## Date d'audit

**2026-01-10**

