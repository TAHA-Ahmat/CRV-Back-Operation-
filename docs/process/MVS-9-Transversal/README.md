# MVS-9-Transversal

## Presentation factuelle

Le MVS-9-Transversal contient les modeles partages entre plusieurs MVS : affectations personnel et evenements operationnels.

---

## Perimetre exact couvert

### Fonctionnalites
- Affectation du personnel aux vols
- Suivi des roles sur chaque vol
- Declaration d'evenements operationnels
- Suivi de resolution des evenements
- Calcul d'impact sur les phases

### Entites gerees
- **AffectationPersonneVol** : Liaison personne-vol avec role
- **EvenementOperationnel** : Evenement impactant les operations

### Endpoints exposes
Pas de routes dediees - acces via MVS-2-CRV et MVS-5-Flights.

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | AffectationPersonneVol, EvenementOperationnel |
| 02-services.md | Constat absence service |
| 03-controllers.md | Constat absence controller |
| 04-routes.md | Constat absence routes |
| 05-process-metier.md | 6 process |
| 06-risques-non-regression.md | Points critiques |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance |
|-----|------------|
| MVS-1-Security | User (personne, declarePar) |
| MVS-5-Flights | Vol |
| MVS-2-CRV | CRV |
| MVS-3-Phases | Phase (impactPhases) |

### Ce MVS est utilise par

| MVS | Dependance |
|-----|------------|
| MVS-2-CRV | Evenements operationnels |
| MVS-5-Flights | Affectations personnel |

---

## Structure des fichiers

```
src/
└── models/transversal/
    ├── AffectationPersonneVol.js
    ├── EvenementOperationnel.js
    └── index.js
```

Note : Pas de services, controllers ou routes dedies.

---

## Roles d'affectation

| Role | Description |
|------|-------------|
| CHEF_AVION | Responsable operations avion |
| AGENT_TRAFIC | Agent de trafic |
| AGENT_PISTE | Agent de piste |
| AGENT_BAGAGES | Agent bagages |
| AGENT_FRET | Agent fret |
| SUPERVISEUR | Superviseur operations |
| COORDINATEUR | Coordinateur equipe |

---

## Types d'evenements

| Type | Description |
|------|-------------|
| RETARD_PASSAGERS | Retard lie aux passagers |
| RETARD_BAGAGES | Retard lie aux bagages |
| RETARD_FRET | Retard lie au fret |
| RETARD_CARBURANT | Retard carburant |
| RETARD_EQUIPAGE | Retard equipage |
| RETARD_TECHNIQUE | Retard technique |
| RETARD_METEO | Retard meteo |
| RETARD_ATC | Retard controle aerien |
| INCIDENT_SECURITE | Incident securite |
| INCIDENT_SURETE | Incident surete |
| INCIDENT_TECHNIQUE | Incident technique |
| CHANGEMENT_PORTE | Changement de porte |
| CHANGEMENT_STAND | Changement de stand |
| AUTRE | Autre evenement |

---

## Niveaux de gravite

| Gravite | Description |
|---------|-------------|
| MINEURE | Impact faible (defaut) |
| MODEREE | Impact modere |
| MAJEURE | Impact important |
| CRITIQUE | Impact critique |

---

## Particularite : Hook pre-save

Le modele EvenementOperationnel calcule automatiquement `dureeImpactMinutes` a partir de `heureDebut` et `heureFin` via un hook pre-save.

---

## Date d'audit

**2026-01-10**

