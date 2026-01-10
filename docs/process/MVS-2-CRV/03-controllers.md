# MVS-2-CRV - CONTROLLERS

## Date d'audit : 2026-01-10

---

## 1. crv.controller.js

### Emplacement
`src/controllers/crv/crv.controller.js`

### Role dans le MVS
Controller principal gerant toutes les operations CRUD et metier sur les CRV.

### Dependances
```javascript
import CRV from '../../models/crv/CRV.js';
import Vol from '../../models/flights/Vol.js';
import Horaire from '../../models/phases/Horaire.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import ChargeOperationnelle from '../../models/charges/ChargeOperationnelle.js';
import EvenementOperationnel from '../../models/transversal/EvenementOperationnel.js';
import Observation from '../../models/crv/Observation.js';
import { genererNumeroCRV, calculerCompletude } from '../../services/crv/crv.service.js';
import { initialiserPhasesVol } from '../../services/phases/phase.service.js';
```

---

### Handlers exposes

#### creerCRV

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv |
| Middlewares | protect, excludeQualite, validate, verifierPhasesAutoriseesCreationCRV, auditLog('CREATION') |
| Authentification | Requise (sauf QUALITE) |

**Donnees req.body** :
- `volId` : ObjectId (optionnel - creation auto si absent)
- `responsableVolId` : ObjectId (optionnel)
- `type` : 'arrivee' | 'depart' | 'turnaround'
- `date` : Date (optionnel)

**Logique** :
1. Si volId absent : creation Vol automatique
2. Generation numeroCRV
3. Creation Horaire
4. Creation CRV
5. Initialisation phases via service
6. Calcul completude

**Codes HTTP** :
| Code | Condition |
|------|-----------|
| 201 | Succes |
| 404 | Vol non trouve (si volId fourni) |

---

#### obtenirCRV

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/crv/:id |
| Middlewares | protect |

**Logique** :
1. Charger CRV avec populate complet
2. Charger phases, charges, evenements, observations associes

**Codes HTTP** :
| Code | Condition |
|------|-----------|
| 200 | Succes |
| 404 | CRV non trouve |

**Structure reponse** :
```javascript
{
  success: true,
  data: {
    crv: {...},
    phases: [...],
    charges: [...],
    evenements: [...],
    observations: [...]
  }
}
```

---

#### listerCRVs

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/crv |
| Middlewares | protect |

**Query params** :
- `statut` : Filtre par statut
- `dateDebut`, `dateFin` : Plage de dates
- `compagnie` : Compagnie aerienne
- `numeroVol` : Recherche partielle
- `page`, `limit` : Pagination

---

#### mettreAJourCRV

| Propriete | Valeur |
|-----------|--------|
| Route | PATCH /api/crv/:id, PUT /api/crv/:id |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR') |

**Transitions statut autorisees** :
```javascript
{
  'BROUILLON': ['EN_COURS'],
  'EN_COURS': ['TERMINE', 'BROUILLON'],
  'TERMINE': ['EN_COURS'],
  'VALIDE': [],
  'VERROUILLE': [],
  'ANNULE': []
}
```

---

#### supprimerCRV

| Propriete | Valeur |
|-----------|--------|
| Route | DELETE /api/crv/:id |
| Middlewares | protect, authorize('SUPERVISEUR', 'MANAGER'), auditLog('SUPPRESSION') |

**Logique** :
1. Verifier CRV existe
2. Verifier CRV non verrouille
3. Supprimer toutes les donnees associees (phases, charges, evenements, observations, horaire)
4. Supprimer le CRV

**Codes HTTP** :
| Code | Condition |
|------|-----------|
| 200 | Succes |
| 403 | CRV verrouille (code: CRV_VERROUILLE) |
| 404 | CRV non trouve |

---

#### ajouterCharge

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/charges |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, validate, validerCoherenceCharges, auditLog |

**Donnees req.body** :
- `typeCharge` : 'PASSAGERS' | 'BAGAGES' | 'FRET'
- `sensOperation` : 'EMBARQUEMENT' | 'DEBARQUEMENT'
- Autres champs selon type

---

#### ajouterEvenement

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/evenements |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, validate, auditLog |

**Donnees req.body** :
- `typeEvenement` : String (requis)
- `gravite` : 'MINEURE' | 'MODEREE' | 'MAJEURE' | 'CRITIQUE'
- `description` : String (requis)

---

#### ajouterObservation

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/observations |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, validate, auditLog |

**Donnees req.body** :
- `categorie` : 'GENERALE' | 'TECHNIQUE' | 'OPERATIONNELLE' | 'SECURITE' | 'QUALITE' | 'SLA'
- `contenu` : String (requis)

---

#### demarrerCRV

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/demarrer |
| Middlewares | protect, excludeQualite, auditLog |

**Transition** : BROUILLON -> EN_COURS

---

#### terminerCRV

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/terminer |
| Middlewares | protect, excludeQualite, auditLog |

**Transition** : EN_COURS -> TERMINE

**Verifications** :
- Completude >= 50%
- Phases obligatoires terminees

---

#### confirmerAbsence

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/crv/:id/confirmer-absence |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, validate, auditLog |

**Donnees req.body** :
- `type` : 'evenement' | 'observation' | 'charge'

---

#### mettreAJourPersonnel

| Propriete | Valeur |
|-----------|--------|
| Route | PUT /api/crv/:id/personnel |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, validate, auditLog |

**Donnees req.body** :
- `personnelAffecte` : Array<{ nom, prenom, fonction, ... }>

---

#### mettreAJourHoraire

| Propriete | Valeur |
|-----------|--------|
| Route | PUT /api/crv/:id/horaire |
| Middlewares | protect, excludeQualite, verifierCRVNonVerrouille, auditLog |

---

## 2. annulation.controller.js

### Emplacement
`src/controllers/crv/annulation.controller.js`

### Handlers exposes

#### annulerCRV
- Route : POST /api/crv/:id/annuler
- Transition : * -> ANNULE

#### reactiverCRV
- Route : POST /api/crv/:id/reactiver
- Transition : ANNULE -> ancienStatut

#### obtenirCRVAnnules
- Route : GET /api/crv/annules

#### obtenirStatistiquesAnnulations
- Route : GET /api/crv/statistiques/annulations

#### verifierPeutAnnuler
- Route : GET /api/crv/:id/peut-annuler

---

## 3. crvArchivage.controller.js

### Emplacement
`src/controllers/crv/crvArchivage.controller.js`

### Handlers exposes

#### getArchivageStatus
- Route : GET /api/crv/archive/status

#### archiverCRV
- Route : POST /api/crv/:id/archive

#### testerArchivage
- Route : POST /api/crv/archive/test

---

## SYNTHESE CONTROLLERS MVS-2-CRV

| Controller | Fichier | Handlers | Role |
|------------|---------|----------|------|
| crv | crv.controller.js | 15+ | CRUD et operations CRV |
| annulation | annulation.controller.js | 5 | Cycle annulation |
| crvArchivage | crvArchivage.controller.js | 3 | Archivage PDF |

### Middlewares communs

| Middleware | Description |
|------------|-------------|
| protect | Authentification JWT |
| excludeQualite | Exclut role QUALITE |
| verifierCRVNonVerrouille | Bloque si CRV verrouille |
| auditLog | Tracabilite |
| validate | Validation express-validator |
