# DOCUMENTATION FRONTEND CRV - EXHAUSTIVE

**Version**: 1.0.0
**Date**: 2026-01-08
**Backend source de verite**: OUI
**Frontend interpretation autorisee**: NON

---

## 1. VUE D'ENSEMBLE GLOBALE

### 1.1 Flux Global CRV (Backend → Frontend)

```
CREATION                    SAISIE                     TERMINAISON                VALIDATION                 ARCHIVE
    |                          |                           |                          |                          |
    v                          v                           v                          v                          v
[BROUILLON] ────────────> [EN_COURS] ────────────> [TERMINE] ────────────> [VALIDE] ────────────> [VERROUILLE]
    |                          |                           |                          |                          |
    |                          |                           |                          |                          |
    └── Vol cree               └── Phases actives          └── Completude >= 50%      └── Completude >= 80%      └── IMMUABLE
    └── Horaire cree           └── Charges ajoutees        └── Phases traitees        └── Responsable defini     └── Archivage Drive
    └── Phases init            └── Evenements              └── Retour EN_COURS OK     └── Verrouillage auto      └── PDF genere
    └── Completude 30%         └── Observations
                               └── Personnel
                               └── Materiel
```

### 1.2 Regles Fondamentales Backend

| Regle | Description | Impact Frontend |
|-------|-------------|-----------------|
| **CRV VERROUILLE = IMMUABLE** | Aucune modification possible | Desactiver TOUS les champs si `statut === 'VERROUILLE'` |
| **null ≠ 0** | `null` = non saisi, `0` = valeur explicite | Distinguer champs vides de champs a zero |
| **Type operation DEDUIT** | Jamais choisi, toujours calcule | Afficher mais ne pas permettre la modification manuelle |
| **QUALITE = Lecture seule** | Aucune ecriture autorisee | Masquer boutons d'action si `user.fonction === 'QUALITE'` |
| **Absence = Non documente** | On ne documente que ce qui s'est passe | Pas de checkboxes "Confirmer absence" |

---

## 2. CHEMINS DE DONNEES PAR BLOC CRV

### BLOC 1 : IDENTIFICATION CRV

#### a) Origine Backend
- **Modele principal**: `CRV` (src/models/CRV.js)
- **Relations**: `vol` (ref Vol), `horaire` (ref Horaire), `creePar` (ref Personne)
- **Champs persistes**: `numeroCRV`, `escale`, `statut`, `completude`, `dateCreation`
- **Champs calcules**: `completude` (service crv.service.js)

#### b) Chemin API
```
GET /api/crv/:id
```

**Reponse**:
```json
{
  "success": true,
  "data": {
    "crv": {
      "_id": "ObjectId",
      "numeroCRV": "CRV250108-0001",
      "escale": "DKR",
      "statut": "EN_COURS",
      "completude": 45,
      "dateCreation": "2026-01-08T10:00:00.000Z",
      "derniereModification": "2026-01-08T12:30:00.000Z",
      "vol": { /* Vol peuple */ },
      "horaire": { /* Horaire peuple */ },
      "creePar": { /* Personne sans password */ },
      "responsableVol": { /* Personne ou null */ },
      "personnelAffecte": [{ "nom", "prenom", "fonction", "matricule?" }],
      "materielUtilise": [{ "typeEngin", "identifiant", "heureDebut?", "heureFin?" }],
      "archivage": {
        "driveFileId": null,
        "driveWebViewLink": null,
        "archivedAt": null
      }
    },
    "phases": [/* ChronologiePhase[] */],
    "charges": [/* ChargeOperationnelle[] */],
    "evenements": [/* EvenementOperationnel[] */],
    "observations": [/* Observation[] */]
  }
}
```

#### c) Champs Disponibles Frontend

| Champ | Type | Toujours present | Modifiable | Notes |
|-------|------|------------------|------------|-------|
| `_id` | ObjectId | OUI | NON | Identifiant technique |
| `numeroCRV` | String | OUI | NON | Format: CRVyymmdd-nnnn |
| `escale` | String | OUI | NON | Code IATA 3-4 car |
| `statut` | Enum | OUI | CONDITIONNEL | Via transitions uniquement |
| `completude` | Number | OUI | NON | Calcule automatiquement 0-100 |
| `dateCreation` | Date | OUI | NON | Auto-genere |
| `vol` | Object | OUI | PARTIEL | Voir Bloc 2 |
| `horaire` | Object | OUI | OUI | Sauf si verrouille |
| `personnelAffecte` | Array | OUI | OUI | Embedded, sauf si verrouille |
| `materielUtilise` | Array | OUI | OUI | Embedded, sauf si verrouille |

---

### BLOC 2 : INFORMATIONS VOL

#### a) Origine Backend
- **Modele**: `Vol` (src/models/Vol.js)
- **Relation**: Reference par `crv.vol`
- **Champs persistes**: `numeroVol`, `compagnieAerienne`, `codeIATA`, `dateVol`, `typeOperation`, `avion`
- **Champs calcules**: `typeOperation` (deduit par service)

#### b) Chemin API
Via `GET /api/crv/:id` (vol peuple) ou directement:
```
GET /api/vols/:id
PUT /api/vols/:id (via CRV)
```

#### c) Structure Vol

```json
{
  "_id": "ObjectId",
  "numeroVol": "AF789",
  "compagnieAerienne": "Air France",
  "codeIATA": "AF",
  "aeroportOrigine": "CDG",
  "aeroportDestination": "DKR",
  "dateVol": "2026-01-08T00:00:00.000Z",
  "typeOperation": "ARRIVEE|DEPART|TURN_AROUND|null",
  "statut": "PROGRAMME|EN_COURS|TERMINE|ANNULE|RETARDE",
  "avion": {
    "_id": "ObjectId",
    "immatriculation": "F-GKXA",
    "typeAvion": "A320",
    "compagnie": "Air France",
    "capacitePassagers": 180,
    "capaciteFret": 2000
  },
  "horsProgramme": false,
  "programmeVolReference": null,
  "raisonHorsProgramme": null,
  "typeVolHorsProgramme": null
}
```

#### d) ENUMS Vol

| Champ | Valeurs | Notes |
|-------|---------|-------|
| `typeOperation` | `ARRIVEE`, `DEPART`, `TURN_AROUND`, `null` | **DEDUIT** - ne jamais imposer |
| `statut` | `PROGRAMME`, `EN_COURS`, `TERMINE`, `ANNULE`, `RETARDE` | Statut du vol |
| `typeVolHorsProgramme` | `CHARTER`, `MEDICAL`, `TECHNIQUE`, `COMMERCIAL`, `AUTRE`, `null` | Si hors programme |

---

### BLOC 3 : HORAIRES

#### a) Origine Backend
- **Modele**: `Horaire` (src/models/Horaire.js)
- **Relation**: Reference par `crv.horaire`
- **Champs persistes**: Tous les horaires prevus/reels
- **Champs calcules**: `ecartAtterissage`, `ecartDecollage`, `ecartParc` (hook pre-save)

#### b) Chemin API
```
PUT /api/crv/:id/horaire
```

**Body attendu**:
```json
{
  "heureAtterrisagePrevue": "2026-01-08T14:00:00.000Z",
  "heureAtterrissageReelle": "2026-01-08T14:15:00.000Z",
  "heureArriveeAuParcPrevue": "2026-01-08T14:20:00.000Z",
  "heureArriveeAuParcReelle": "2026-01-08T14:25:00.000Z",
  "heureDepartDuParcPrevue": "2026-01-08T15:30:00.000Z",
  "heureDepartDuParcReelle": null,
  "heureDecollagePrevue": "2026-01-08T15:45:00.000Z",
  "heureDecollageReelle": null,
  "heureOuvertureParkingPrevue": "2026-01-08T14:22:00.000Z",
  "heureOuvertureParkingReelle": "2026-01-08T14:27:00.000Z",
  "heureFermetureParkingPrevue": "2026-01-08T15:25:00.000Z",
  "heureFermetureParkingReelle": null,
  "heureRemiseDocumentsPrevue": "2026-01-08T15:20:00.000Z",
  "heureRemiseDocumentsReelle": null,
  "heureLivraisonBagagesDebut": null,
  "heureLivraisonBagagesFin": null,
  "remarques": "..."
}
```

**Alias Frontend supportes**:
| Alias Frontend | Champ Backend |
|----------------|---------------|
| `touchdownTime` | `heureAtterrissageReelle` |
| `onBlockTime` | `heureArriveeAuParcReelle` |
| `offBlockTime` | `heureDepartDuParcReelle` |
| `takeoffTime` | `heureDecollageReelle` |
| `firstDoorOpenTime` | `heureOuvertureParkingReelle` |
| `lastDoorCloseTime` | `heureFermetureParkingReelle` |

#### c) Champs Horaires

| Champ | Type | Nullable | Auto-calcule | Notes |
|-------|------|----------|--------------|-------|
| `heureAtterrisagePrevue` | Date | OUI | NON | Arrivee planifiee |
| `heureAtterrissageReelle` | Date | OUI | NON | Touchdown reel |
| `heureArriveeAuParcPrevue` | Date | OUI | NON | On-block prevu |
| `heureArriveeAuParcReelle` | Date | OUI | NON | On-block reel |
| `heureDepartDuParcPrevue` | Date | OUI | NON | Off-block prevu |
| `heureDepartDuParcReelle` | Date | OUI | NON | Off-block reel |
| `heureDecollagePrevue` | Date | OUI | NON | Depart planifie |
| `heureDecollageReelle` | Date | OUI | NON | Takeoff reel |
| `heureRemiseDocumentsPrevue` | Date | OUI | NON | Remise documents prevue |
| `heureRemiseDocumentsReelle` | Date | OUI | NON | Remise documents reelle |
| `heureLivraisonBagagesDebut` | Date | OUI | NON | Debut livraison bagages |
| `heureLivraisonBagagesFin` | Date | OUI | NON | Fin livraison bagages |
| `ecartAtterissage` | Number | OUI | **OUI** | Calcule en minutes |
| `ecartDecollage` | Number | OUI | **OUI** | Calcule en minutes |
| `ecartParc` | Number | OUI | **OUI** | Calcule en minutes |

---

### BLOC 4 : PHASES / CHRONOLOGIE

#### a) Origine Backend
- **Modele referentiel**: `Phase` (src/models/Phase.js)
- **Modele instance**: `ChronologiePhase` (src/models/ChronologiePhase.js)
- **Relation**: `chronoPhase.crv` → CRV, `chronoPhase.phase` → Phase
- **Champs calcules**: `dureeReelleMinutes`, `ecartMinutes` (hook pre-save)

#### b) Chemin API
```
GET /api/crv/:id           → phases[] dans reponse
PUT /api/crv/:crvId/phases/:phaseId
POST /api/phases/:id/demarrer
POST /api/phases/:id/terminer
POST /api/phases/:id/non-realise
```

#### c) Structure Phase

**Referentiel Phase**:
```json
{
  "_id": "ObjectId",
  "code": "ARR_TOUCHDOWN",
  "libelle": "Atterrissage",
  "typeOperation": "ARRIVEE|DEPART|TURN_AROUND|COMMUN",
  "categorie": "PISTE|PASSAGERS|FRET|BAGAGE|TECHNIQUE|AVITAILLEMENT|NETTOYAGE|SECURITE",
  "ordre": 1,
  "dureeStandardMinutes": 5,
  "obligatoire": true,
  "prerequis": ["ObjectId"],
  "actif": true
}
```

**Instance ChronologiePhase**:
```json
{
  "_id": "ObjectId",
  "crv": "ObjectId",
  "phase": { /* Phase peuplee */ },
  "heureDebutPrevue": null,
  "heureDebutReelle": "2026-01-08T14:15:00.000Z",
  "heureFinPrevue": null,
  "heureFinReelle": "2026-01-08T14:20:00.000Z",
  "dureeReelleMinutes": 5,
  "ecartMinutes": 0,
  "statut": "NON_COMMENCE|EN_COURS|TERMINE|NON_REALISE|ANNULE",
  "motifNonRealisation": null,
  "detailMotif": null,
  "responsable": null,
  "remarques": null
}
```

#### d) ENUMS Phases

| Champ | Valeurs |
|-------|---------|
| `statut` | `NON_COMMENCE`, `EN_COURS`, `TERMINE`, `NON_REALISE`, `ANNULE` |
| `typeOperation` | `ARRIVEE`, `DEPART`, `TURN_AROUND`, `COMMUN` |
| `categorie` | `PISTE`, `PASSAGERS`, `FRET`, `BAGAGE`, `TECHNIQUE`, `AVITAILLEMENT`, `NETTOYAGE`, `SECURITE` |
| `motifNonRealisation` | `NON_NECESSAIRE`, `EQUIPEMENT_INDISPONIBLE`, `PERSONNEL_ABSENT`, `CONDITIONS_METEO`, `AUTRE` |

#### e) Regles Metier Phases

| Regle | Condition | Erreur HTTP |
|-------|-----------|-------------|
| Phase non realisee DOIT avoir motif | `statut === 'NON_REALISE' && !motifNonRealisation` | 400 |
| Phase non realisee DOIT avoir detail | `statut === 'NON_REALISE' && !detailMotif` | 400 |
| Phase terminee efface les heures | `statut === 'NON_REALISE'` → heures = null | Automatique |
| Prerequisites requis | Phase B ne demarre pas si Phase A non terminee | 400 |

---

### BLOC 5 : CHARGES OPERATIONNELLES

#### a) Origine Backend
- **Modele**: `ChargeOperationnelle` (src/models/ChargeOperationnelle.js)
- **Relation**: `charge.crv` → CRV
- **Champs calcules** (virtuals): `totalPassagers`, `totalBagages`, `fretSaisi`, `totalPassagersDetailles`, `totalPMRDetailles`

#### b) Chemin API
```
POST /api/crv/:id/charges
```

**Body attendu**:
```json
{
  "typeCharge": "PASSAGERS|BAGAGES|FRET",
  "sensOperation": "EMBARQUEMENT|DEBARQUEMENT",
  "passagersAdultes": 120,
  "passagersEnfants": 15,
  "passagersPMR": 3,
  "passagersTransit": 8,
  "nombreBagagesSoute": 200,
  "poidsBagagesSouteKg": 3500,
  "nombreBagagesCabine": 145,
  "nombreFret": 12,
  "poidsFretKg": 850,
  "typeFret": "GENERAL|STANDARD|PERISSABLE|DANGEREUX|ANIMAUX|AUTRE",
  "remarques": "..."
}
```

#### c) REGLE CRITIQUE : null ≠ 0

**Le frontend DOIT distinguer**:
- `passagersAdultes: null` → Champ non saisi (vide)
- `passagersAdultes: 0` → Zero passagers (valeur explicite)

**Validation backend**:
```
Si typeCharge === 'PASSAGERS' ET total === 0 ET passagersAdultes === undefined
→ 400 VALEURS_EXPLICITES_REQUISES
```

#### d) ENUMS Charges

| Champ | Valeurs |
|-------|---------|
| `typeCharge` | `PASSAGERS`, `BAGAGES`, `FRET` |
| `sensOperation` | `EMBARQUEMENT`, `DEBARQUEMENT` |
| `typeFret` | `GENERAL`, `STANDARD`, `PERISSABLE`, `DANGEREUX`, `ANIMAUX`, `AUTRE` |

#### e) Categories Detaillees (Extension 4)

Disponibles dans `categoriesPassagersDetaillees`:
- `bebes`, `enfants`, `adolescents`, `adultes`, `seniors`
- `pmrFauteuilRoulant`, `pmrMarcheAssistee`, `pmrNonVoyant`, `pmrSourd`
- `transitLocal`, `transitInternational`, `vip`, `equipage`, `deportes`

Classes disponibles dans `classePassagers`:
- `premiere`, `affaires`, `economique`

Besoins medicaux dans `besoinsMedicaux`:
- `oxygeneBord`, `brancardier`, `accompagnementMedical`

---

### BLOC 6 : EVENEMENTS OPERATIONNELS

#### a) Origine Backend
- **Modele**: `EvenementOperationnel` (src/models/EvenementOperationnel.js)
- **Relation**: `evenement.crv` → CRV
- **Champs calcules**: `dureeImpactMinutes` (hook pre-save)

#### b) Chemin API
```
POST /api/crv/:id/evenements
```

**Body attendu**:
```json
{
  "typeEvenement": "PANNE_EQUIPEMENT|ABSENCE_PERSONNEL|RETARD|INCIDENT_SECURITE|PROBLEME_TECHNIQUE|METEO|AUTRE",
  "gravite": "MINEURE|MODEREE|MAJEURE|CRITIQUE",
  "dateHeureDebut": "2026-01-08T15:00:00.000Z",
  "dateHeureFin": "2026-01-08T15:30:00.000Z",
  "description": "Description obligatoire",
  "impactPhases": ["ObjectId"],
  "equipementConcerne": "ObjectId",
  "personneConcernee": "ObjectId",
  "actionsCorrectives": "..."
}
```

#### c) ENUMS Evenements

| Champ | Valeurs |
|-------|---------|
| `typeEvenement` | `PANNE_EQUIPEMENT`, `ABSENCE_PERSONNEL`, `RETARD`, `INCIDENT_SECURITE`, `PROBLEME_TECHNIQUE`, `METEO`, `AUTRE` |
| `gravite` | `MINEURE`, `MODEREE`, `MAJEURE`, `CRITIQUE` |
| `statut` | `OUVERT`, `EN_COURS`, `RESOLU`, `CLOTURE` |

#### d) Regle Metier Evenements

**ABSENCE D'EVENEMENT = VOL NOMINAL**
- Le backend attribue TOUJOURS 20% de completude pour les evenements
- Pas d'evenements = rien a signaler (vol normal)
- Le frontend NE DOIT PAS afficher "Aucun evenement" comme un probleme

---

### BLOC 7 : OBSERVATIONS

#### a) Origine Backend
- **Modele**: `Observation` (src/models/Observation.js)
- **Relation**: `observation.crv` → CRV, `observation.auteur` → Personne

#### b) Chemin API
```
POST /api/crv/:id/observations
```

**Body attendu**:
```json
{
  "categorie": "GENERALE|TECHNIQUE|OPERATIONNELLE|SECURITE|QUALITE|SLA",
  "contenu": "Contenu obligatoire",
  "phaseConcernee": "ObjectId (optionnel)",
  "pieceJointe": "URL (optionnel)",
  "visibilite": "INTERNE|COMPAGNIE|PUBLIQUE"
}
```

#### c) ENUMS Observations

| Champ | Valeurs |
|-------|---------|
| `categorie` | `GENERALE`, `TECHNIQUE`, `OPERATIONNELLE`, `SECURITE`, `QUALITE`, `SLA` |
| `visibilite` | `INTERNE`, `COMPAGNIE`, `PUBLIQUE` |

---

### BLOC 8 : PERSONNEL AFFECTE

#### a) Origine Backend
- **Embedded dans**: `CRV.personnelAffecte[]`
- **Pas de modele separe** - tableau embarque

#### b) Chemin API
```
PUT /api/crv/:id/personnel     → Remplacer tout
POST /api/crv/:id/personnel    → Ajouter une personne
DELETE /api/crv/:id/personnel/:personneId  → Supprimer
```

**Body PUT**:
```json
{
  "personnelAffecte": [
    {
      "nom": "Diallo",
      "prenom": "Amadou",
      "fonction": "Chef d'escale",
      "matricule": "AG001",
      "telephone": "+221...",
      "remarques": "..."
    }
  ]
}
```

#### c) Champs Personnel

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | String | OUI |
| `prenom` | String | OUI |
| `fonction` | String | OUI |
| `matricule` | String | NON |
| `telephone` | String | NON |
| `remarques` | String | NON |

---

### BLOC 9 : MATERIEL UTILISE

#### a) Origine Backend
- **Embedded dans**: `CRV.materielUtilise[]`
- **Pas de modele separe** - tableau embarque

#### b) Chemin API
```
PUT /api/crv/:id/engins       → Remplacer tout
POST /api/crv/:id/engins      → Ajouter
DELETE /api/crv/:id/engins/:affectationId  → Supprimer
```

**Body POST**:
```json
{
  "enginId": "ObjectId",
  "heureDebut": "2026-01-08T14:30:00.000Z",
  "heureFin": "2026-01-08T15:00:00.000Z",
  "usage": "TRACTAGE|BAGAGES|FRET|ALIMENTATION_ELECTRIQUE|CLIMATISATION|PASSERELLE|CHARGEMENT",
  "remarques": "..."
}
```

#### c) ENUMS Materiel

| Champ | Valeurs |
|-------|---------|
| `typeEngin` (CRV) | `TRACTEUR_PUSHBACK`, `PASSERELLE`, `TAPIS_BAGAGES`, `GPU`, `ASU`, `ESCALIER`, `TRANSBORDEUR`, `CAMION_AVITAILLEMENT`, `CAMION_VIDANGE`, `CAMION_EAU`, `NACELLE_ELEVATRICE`, `CHARIOT_BAGAGES`, `CONTENEUR_ULD`, `DOLLY`, `AUTRE` |
| `typeEngin` (Engin) | `TRACTEUR`, `CHARIOT_BAGAGES`, `CHARIOT_FRET`, `GPU`, `ASU`, `STAIRS`, `CONVOYEUR`, `AUTRE` |
| `usage` | `TRACTAGE`, `BAGAGES`, `FRET`, `ALIMENTATION_ELECTRIQUE`, `CLIMATISATION`, `PASSERELLE`, `CHARGEMENT` |
| `statut` (Engin) | `DISPONIBLE`, `EN_SERVICE`, `MAINTENANCE`, `PANNE`, `HORS_SERVICE` |

---

### BLOC 10 : VALIDATION / VERROUILLAGE / ARCHIVAGE

#### a) Origine Backend
- **Modele**: `ValidationCRV` (src/models/ValidationCRV.js)
- **Relation**: 1:1 avec CRV (`validation.crv` → CRV)

#### b) Chemin API
```
GET /api/validation/:id              → Obtenir validation
POST /api/validation/:id/valider     → Valider (TERMINE → VALIDE/VERROUILLE)
POST /api/validation/:id/verrouiller → Verrouiller (VALIDE → VERROUILLE)
POST /api/validation/:id/deverrouiller → Deverrouiller (VERROUILLE → EN_COURS)
```

**Body deverrouiller**:
```json
{
  "raison": "Raison obligatoire du deverrouillage"
}
```

#### c) Structure ValidationCRV

```json
{
  "_id": "ObjectId",
  "crv": "ObjectId",
  "validePar": { /* Personne */ },
  "dateValidation": "2026-01-08T16:00:00.000Z",
  "statut": "VALIDE|INVALIDE|EN_ATTENTE_CORRECTION",
  "commentaires": "...",
  "scoreCompletude": 85,
  "conformiteSLA": true,
  "ecartsSLA": [
    {
      "phase": "ObjectId",
      "ecartMinutes": 10,
      "description": "..."
    }
  ],
  "anomaliesDetectees": ["..."],
  "verrouille": true,
  "dateVerrouillage": "2026-01-08T16:00:00.000Z"
}
```

#### d) Conditions de Validation

| Condition | Valeur | Consequence |
|-----------|--------|-------------|
| Completude | >= 80% | OBLIGATOIRE pour valider |
| Responsable vol | Defini | OBLIGATOIRE pour valider |
| Phases traitees | Toutes | WARNING si phases NON_COMMENCE |
| Conformite SLA | Check | INFO - pas bloquant |

---

## 3. MODELES BACKEND (FRONT-READY)

### 3.1 CRV

| Champ | Type | Exposable | Nullable | Notes |
|-------|------|-----------|----------|-------|
| `_id` | ObjectId | OUI | NON | ID technique |
| `numeroCRV` | String | OUI | NON | Unique, auto-genere |
| `vol` | Ref/Object | OUI | NON | Peuple sur GET |
| `escale` | String | OUI | NON | Code IATA |
| `horaire` | Ref/Object | OUI | NON | Peuple sur GET |
| `statut` | Enum | OUI | NON | Voir transitions |
| `completude` | Number | OUI | NON | 0-100, calcule |
| `dateCreation` | Date | OUI | NON | Auto |
| `creePar` | Ref/Object | OUI | NON | Peuple |
| `responsableVol` | Ref/Object | OUI | OUI | Peut etre null |
| `personnelAffecte` | Array | OUI | NON | [] par defaut |
| `materielUtilise` | Array | OUI | NON | [] par defaut |
| `verrouillePar` | Ref/Object | OUI | OUI | Si verrouille |
| `dateVerrouillage` | Date | OUI | OUI | Si verrouille |
| `modifiePar` | Ref/Object | OUI | OUI | Derniere modif |
| `derniereModification` | Date | OUI | NON | Auto |
| `archivage` | Object | OUI | NON | Sous-objet |
| `annulation` | Object | OUI | NON | Si annule |

**Champs JAMAIS exposes**:
- Aucun pour CRV (tout est exposable)

### 3.2 Vol

| Champ | Type | Exposable | Nullable |
|-------|------|-----------|----------|
| `_id` | ObjectId | OUI | NON |
| `numeroVol` | String | OUI | NON |
| `typeOperation` | Enum | OUI | OUI |
| `compagnieAerienne` | String | OUI | NON |
| `codeIATA` | String | OUI | NON |
| `aeroportOrigine` | String | OUI | OUI |
| `aeroportDestination` | String | OUI | OUI |
| `dateVol` | Date | OUI | NON |
| `statut` | Enum | OUI | NON |
| `avion` | Ref/Object | OUI | OUI |
| `horsProgramme` | Boolean | OUI | NON |
| `programmeVolReference` | Ref | OUI | OUI |
| `raisonHorsProgramme` | String | OUI | OUI |
| `typeVolHorsProgramme` | Enum | OUI | OUI |

### 3.3 Personne (User)

| Champ | Type | Exposable | Notes |
|-------|------|-----------|-------|
| `_id` | ObjectId | OUI | |
| `nom` | String | OUI | |
| `prenom` | String | OUI | |
| `matricule` | String | OUI | |
| `email` | String | OUI | |
| `fonction` | Enum | OUI | Role |
| `specialites` | Array | OUI | |
| `statut` | Enum | OUI | |
| `statutCompte` | Enum | OUI | |
| `telephone` | String | OUI | |
| `password` | String | **NON** | **JAMAIS EXPOSE** (`select: false`) |

### 3.4 ENUMS GLOBAUX

**Statut CRV**:
```
BROUILLON → EN_COURS → TERMINE → VALIDE → VERROUILLE
                ↓                                ↓
            BROUILLON                       EN_COURS (deverrouillage)
                                              ↓
                                           ANNULE
```

**Fonctions (Roles)**:
```
AGENT_ESCALE    → Operations de base
CHEF_EQUIPE     → Supervision equipe
SUPERVISEUR     → Supervision operations
MANAGER         → Gestion globale
QUALITE         → LECTURE SEULE
ADMIN           → Administration (gele en Phase 1)
```

**Statut Compte**:
```
EN_ATTENTE → VALIDE → SUSPENDU → DESACTIVE
```

---

## 4. REGLES METIER IMPOSEES PAR LE BACKEND

### 4.1 Regles Bloquantes (400/403/409)

| Regle | Code HTTP | Code Erreur | Message |
|-------|-----------|-------------|---------|
| CRV verrouille | 403 | `CRV_VERROUILLE` | CRV valide et verrouille - aucune modification possible |
| Transition invalide | 400 | `TRANSITION_STATUT_INVALIDE` | Transition de statut non autorisee |
| Motif non realisation requis | 400 | `MOTIF_NON_REALISATION_REQUIS` | Phase non realisee doit avoir motif |
| Detail motif requis | 400 | `DETAIL_MOTIF_REQUIS` | Phase non realisee doit avoir detail |
| Valeurs explicites requises | 400 | `VALEURS_EXPLICITES_REQUISES` | Saisir explicitement les valeurs |
| Poids requis avec bagages | 400 | `POIDS_REQUIS_AVEC_BAGAGES` | Si bagages, poids obligatoire |
| Poids fret requis | 400 | `POIDS_FRET_REQUIS` | Si fret, poids obligatoire |
| Type fret requis | 400 | `TYPE_FRET_REQUIS` | Si fret, type obligatoire |
| QUALITE lecture seule | 403 | `QUALITE_READ_ONLY` | QUALITE est lecture seule |
| Completude insuffisante terminaison | 400 | `CONDITIONS_TERMINAISON_NON_SATISFAITES` | Completude < 50% |
| Completude insuffisante validation | - | anomalies[] | Completude < 80% |
| Token expire | 401 | `TOKEN_EXPIRED` | Token expire |
| Token invalide | 401 | `TOKEN_INVALID` | Token invalide |

### 4.2 Regles Silencieuses (Auto-calcul)

| Regle | Declencheur | Action |
|-------|-------------|--------|
| Completude recalculee | Toute modification | Service `calculerCompletude()` |
| Ecarts horaires calcules | Horaire save | Hook pre-save Horaire |
| Duree phase calculee | Phase save | Hook pre-save ChronologiePhase |
| Type operation deduit | Validation CRV | Service `deduireTypeOperation()` |
| Numero CRV genere | Creation CRV | Format `CRVyymmdd-nnnn` |
| Phase non realisee efface heures | statut = NON_REALISE | Hook pre-save efface dates |

### 4.3 Regles Non-Contournables

| Regle | Raison | Impact Frontend |
|-------|--------|-----------------|
| VERROUILLE = IMMUABLE | Integrite donnees | Tout desactiver |
| null ≠ 0 | Semantique metier | Distinguer vide/zero |
| Type operation DEDUIT | Cahier des charges §3 | Affichage seul |
| QUALITE lecture seule | RBAC | Masquer actions ecriture |
| Completude >= 50% pour terminer | Qualite donnees | Afficher alerte |
| Completude >= 80% pour valider | Qualite donnees | Afficher alerte |

### 4.4 Regles Dependantes du Statut CRV

| Statut | Lecture | Ecriture | Transitions |
|--------|---------|----------|-------------|
| `BROUILLON` | OUI | OUI | → EN_COURS |
| `EN_COURS` | OUI | OUI | → TERMINE, → BROUILLON |
| `TERMINE` | OUI | OUI | → EN_COURS (via route validation) |
| `VALIDE` | OUI | NON | → VERROUILLE (via validation) |
| `VERROUILLE` | OUI | **NON** | → EN_COURS (deverrouillage) |
| `ANNULE` | OUI | NON | → BROUILLON (reactivation) |

---

## 5. CONDITIONS D'AFFICHAGE POUR LE FRONT

### 5.1 Par Statut CRV

| Element | BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE |
|---------|-----------|----------|---------|--------|------------|--------|
| Formulaire edition | Actif | Actif | Actif | Inactif | Inactif | Inactif |
| Bouton Demarrer | Visible | Masque | Masque | Masque | Masque | Masque |
| Bouton Terminer | Masque | Visible | Masque | Masque | Masque | Masque |
| Bouton Valider | Masque | Masque | Visible | Masque | Masque | Masque |
| Bouton Deverrouiller | Masque | Masque | Masque | Masque | Visible | Masque |
| Bouton Annuler | Visible | Visible | Visible | Masque | Masque | Masque |
| Bouton Reactiver | Masque | Masque | Masque | Masque | Masque | Visible |
| Ajout charge | Actif | Actif | Actif | Inactif | Inactif | Inactif |
| Ajout evenement | Actif | Actif | Actif | Inactif | Inactif | Inactif |
| Ajout observation | Actif | Actif | Actif | Inactif | Inactif | Inactif |
| Edition phases | Actif | Actif | Actif | Inactif | Inactif | Inactif |
| Badge statut | Gris | Bleu | Orange | Vert | Rouge | Noir |

### 5.2 Par Role Utilisateur

| Element | AGENT | CHEF | SUPERVISEUR | MANAGER | QUALITE | ADMIN |
|---------|-------|------|-------------|---------|---------|-------|
| Creer CRV | OUI | OUI | OUI | OUI | **NON** | OUI |
| Modifier CRV | OUI | OUI | OUI | OUI | **NON** | OUI |
| Valider CRV | NON | OUI | OUI | OUI | **NON** | OUI |
| Deverrouiller | NON | NON | OUI | OUI | **NON** | OUI |
| Voir rapports | OUI | OUI | OUI | OUI | OUI | OUI |
| Export | OUI | OUI | OUI | OUI | OUI | OUI |
| Archiver | NON | NON | OUI | OUI | **NON** | OUI |

### 5.3 Donnees Conditionnelles

| Donnee | Condition d'affichage | Condition de masquage |
|--------|----------------------|----------------------|
| `responsableVol` | `responsableVol !== null` | `responsableVol === null` |
| `archivage.driveWebViewLink` | `archivage.driveFileId !== null` | Pas d'archivage |
| `annulation` | `statut === 'ANNULE'` | Autres statuts |
| `ecartsSLA` | `ecartsSLA.length > 0` | Pas d'ecarts |
| `anomaliesDetectees` | `anomaliesDetectees.length > 0` | Pas d'anomalies |
| Categories detaillees | `utiliseCategoriesDetaillees === true` | Utiliser champs simples |
| Fret detaille | `fretDetaille.utiliseFretDetaille === true` | Utiliser champs simples |

---

## 6. APIs EXPOSEES (LISTE FERMEE)

### 6.1 Authentification

| Endpoint | Methode | Usage | Donnees retournees | Erreurs |
|----------|---------|-------|-------------------|---------|
| `/api/auth/login` | POST | Connexion | `{ token, user }` | 400, 401 |
| `/api/auth/register` | POST | Inscription | `{ token, user }` | 400, 409 |
| `/api/auth/me` | GET | Profil courant | `{ user }` | 401 |
| `/api/auth/connexion` | POST | Alias login | `{ token, user }` | 400, 401 |
| `/api/auth/inscription` | POST | Alias register | `{ token, user }` | 400, 409 |
| `/api/auth/deconnexion` | POST | Deconnexion | `{ success, message }` | - |

### 6.2 CRV

| Endpoint | Methode | Usage | Donnees retournees | Erreurs |
|----------|---------|-------|-------------------|---------|
| `/api/crv` | POST | Creer CRV | `{ crv }` | 400, 403 |
| `/api/crv` | GET | Lister CRVs | `{ data[], pagination }` | - |
| `/api/crv/search` | GET | Recherche | `{ data[], pagination }` | 400 |
| `/api/crv/stats` | GET | Statistiques | `{ periode, stats }` | 400 |
| `/api/crv/export` | GET | Export Excel/CSV | Fichier | - |
| `/api/crv/annules` | GET | CRVs annules | `{ data[] }` | - |
| `/api/crv/statistiques/annulations` | GET | Stats annulations | `{ stats }` | - |
| `/api/crv/:id` | GET | Detail CRV | `{ crv, phases, charges, evenements, observations }` | 404 |
| `/api/crv/:id` | PUT/PATCH | Modifier CRV | `{ crv }` | 400, 403, 404 |
| `/api/crv/:id/transitions` | GET | Transitions possibles | `{ statutActuel, transitionsPossibles }` | 404 |
| `/api/crv/:id/demarrer` | POST | BROUILLON → EN_COURS | `{ crv }` | 400, 403, 404 |
| `/api/crv/:id/terminer` | POST | EN_COURS → TERMINE | `{ crv, completude }` | 400, 403, 404 |
| `/api/crv/:id/charges` | POST | Ajouter charge | `{ charge }` | 400, 403, 404 |
| `/api/crv/:id/evenements` | POST | Ajouter evenement | `{ evenement }` | 400, 403, 404 |
| `/api/crv/:id/observations` | POST | Ajouter observation | `{ observation }` | 400, 403, 404 |
| `/api/crv/:id/horaire` | PUT | Modifier horaires | `{ crv, horaire }` | 400, 403, 404 |
| `/api/crv/:id/personnel` | PUT | Remplacer personnel | `{ personnelAffecte }` | 400, 403, 404 |
| `/api/crv/:id/personnel` | POST | Ajouter personne | `{ personne, personnelAffecte }` | 400, 403, 404 |
| `/api/crv/:id/personnel/:personneId` | DELETE | Supprimer personne | `{ personnelAffecte }` | 403, 404 |
| `/api/crv/:id/engins` | GET | Liste engins | `{ engins }` | 404 |
| `/api/crv/:id/engins` | PUT | Remplacer engins | `{ engins }` | 400, 403, 404 |
| `/api/crv/:id/engins` | POST | Ajouter engin | `{ engin }` | 400, 403, 404 |
| `/api/crv/:id/engins/:affectationId` | DELETE | Retirer engin | `{ engins }` | 403, 404 |
| `/api/crv/:crvId/phases/:phaseId` | PUT | Modifier phase | `{ phase }` | 400, 403, 404 |
| `/api/crv/:id/peut-annuler` | GET | Verifier si annulable | `{ peutAnnuler, raison? }` | 404 |
| `/api/crv/:id/annuler` | POST | Annuler CRV | `{ crv }` | 400, 403, 404 |
| `/api/crv/:id/reactiver` | POST | Reactiver CRV annule | `{ crv }` | 400, 403, 404 |
| `/api/crv/:id/archive` | POST | Archiver sur Drive | `{ archivage }` | 400, 403, 404 |
| `/api/crv/archive/status` | GET | Statut archivage | `{ configured, ready }` | - |

### 6.3 Validation

| Endpoint | Methode | Usage | Donnees retournees | Erreurs |
|----------|---------|-------|-------------------|---------|
| `/api/validation/:id` | GET | Obtenir validation | `{ validation }` | 404 |
| `/api/validation/:id/valider` | POST | Valider CRV | `{ validation }` | 400, 403, 404 |
| `/api/validation/:id/verrouiller` | POST | Verrouiller | `{ crv }` | 400, 403, 404 |
| `/api/validation/:id/deverrouiller` | POST | Deverrouiller | `{ success, message }` | 400, 403, 404 |

### 6.4 Phases

| Endpoint | Methode | Usage | Donnees retournees | Erreurs |
|----------|---------|-------|-------------------|---------|
| `/api/phases/:id/demarrer` | POST | Demarrer phase | `{ phase }` | 400, 403, 404 |
| `/api/phases/:id/terminer` | POST | Terminer phase | `{ phase }` | 400, 403, 404 |
| `/api/phases/:id/non-realise` | POST | Marquer non realisee | `{ phase }` | 400, 403, 404 |
| `/api/phases/:id` | PATCH | Modifier phase | `{ phase }` | 400, 403, 404 |

### 6.5 Vols

| Endpoint | Methode | Usage | Donnees retournees | Erreurs |
|----------|---------|-------|-------------------|---------|
| `/api/vols` | POST | Creer vol | `{ vol }` | 400, 403 |
| `/api/vols` | GET | Lister vols | `{ data[] }` | - |
| `/api/vols/:id` | GET | Detail vol | `{ vol }` | 404 |
| `/api/vols/:id` | PATCH | Modifier vol | `{ vol }` | 400, 403, 404 |
| `/api/vols/hors-programme` | GET | Vols hors programme | `{ data[] }` | - |
| `/api/vols/statistiques/programmes` | GET | Stats programmes | `{ stats }` | - |

---

## 7. DONNEES JAMAIS EXPOSEES (SECURITE)

### 7.1 Champs Internes

| Modele | Champ | Raison |
|--------|-------|--------|
| Personne | `password` | Securite authentification |
| * | `__v` | Version Mongoose interne |
| HistoriqueModification | `*` | Audit interne uniquement |
| UserActivityLog | `*` | Logs techniques |

### 7.2 IDs Techniques Non-Exploitables

Ces IDs sont exposes mais ne doivent pas etre manipules cote frontend:
- `phase.prerequis[]` - IDs de phases prerequises (gestion backend)
- `historiqueVersions[].modifiePar` - Historique version avion

### 7.3 Champs de Calcul Interne

| Champ | Modele | Notes |
|-------|--------|-------|
| `ecartAtterissage` | Horaire | Calcule automatiquement, lecture seule |
| `ecartDecollage` | Horaire | Calcule automatiquement, lecture seule |
| `ecartParc` | Horaire | Calcule automatiquement, lecture seule |
| `dureeReelleMinutes` | ChronologiePhase | Calcule automatiquement |
| `ecartMinutes` | ChronologiePhase | Calcule automatiquement |
| `completude` | CRV | Calcule par service |
| `scoreCompletude` | ValidationCRV | Calcule par service |
| `dureeImpactMinutes` | EvenementOperationnel | Calcule automatiquement |

---

## 8. MATRICE FRONTEND / BACKEND

| Bloc | API Principale | Donnees Recues | Conditions | Modifiable | Risque |
|------|----------------|----------------|------------|------------|--------|
| Identification | `GET /api/crv/:id` | CRV complet | Toujours | Non (auto) | Faible |
| Vol | `PUT /api/crv/:id` (vol embedded) | Vol peuple | Vol lie | Partiel | Moyen |
| Horaires | `PUT /api/crv/:id/horaire` | Horaire complet | CRV non verrouille | OUI | Moyen |
| Phases | `PUT /api/crv/:crvId/phases/:phaseId` | ChronologiePhase[] | CRV non verrouille | OUI | Eleve |
| Charges | `POST /api/crv/:id/charges` | ChargeOperationnelle[] | CRV non verrouille | OUI (ajout) | Eleve |
| Evenements | `POST /api/crv/:id/evenements` | EvenementOperationnel[] | CRV non verrouille | OUI (ajout) | Moyen |
| Observations | `POST /api/crv/:id/observations` | Observation[] | CRV non verrouille | OUI (ajout) | Faible |
| Personnel | `PUT/POST/DELETE /api/crv/:id/personnel` | personnelAffecte[] | CRV non verrouille | OUI | Moyen |
| Materiel | `PUT/POST/DELETE /api/crv/:id/engins` | materielUtilise[] | CRV non verrouille | OUI | Moyen |
| Validation | `POST /api/validation/:id/valider` | ValidationCRV | CRV TERMINE | Via validation | Critique |

---

## 9. VERDICT FINAL FRONTEND

### Reponse:

**OUI, backend totalement explicite**

Le frontend peut implementer le CRV sans aucune interpretation metier sous reserve de respecter strictement:

1. **Desactiver toute edition si `statut === 'VERROUILLE'`**
2. **Masquer boutons ecriture si `user.fonction === 'QUALITE'`**
3. **Distinguer `null` de `0` pour les charges**
4. **Ne JAMAIS permettre la modification manuelle de `typeOperation`**
5. **Suivre la machine d'etat des transitions CRV**
6. **Afficher les erreurs backend telles quelles** (codes explicites)
7. **Recalcul completude = responsabilite backend** (ne pas calculer cote front)

### Checklist Implementation Frontend

- [ ] Gestion JWT avec refresh sur `TOKEN_EXPIRED`
- [ ] Interception erreur 403 `CRV_VERROUILLE`
- [ ] Interception erreur 403 `QUALITE_READ_ONLY`
- [ ] Formulaire charges avec null/0 distinct
- [ ] Machine d'etat statut CRV
- [ ] Affichage conditionnel par role
- [ ] Alias horaires (touchdownTime → heureAtterrissageReelle)
- [ ] Gestion pagination sur listes
- [ ] Export Excel/CSV
- [ ] Archivage Google Drive

---

**Document genere automatiquement - Backend CRV v1.0.0**
