# MVS-5-Flights - MODELS

## Date d'audit : 2026-01-10

---

## Vol.js

### Emplacement
`src/models/flights/Vol.js`

---

### Schema Principal

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| numeroVol | String | Oui | Numero de vol (uppercase, trim) |
| typeOperation | String (enum) | Non | ARRIVEE, DEPART, TURN_AROUND, null |
| compagnieAerienne | String | Oui | Nom compagnie |
| codeIATA | String | Oui | Code IATA 2 caracteres |
| aeroportOrigine | String | Non | Code aeroport origine |
| aeroportDestination | String | Non | Code aeroport destination |
| dateVol | Date | Oui | Date du vol |
| statut | String (enum) | Non | PROGRAMME, EN_COURS, TERMINE, ANNULE, RETARDE |
| avion | ObjectId (ref: Avion) | Non | Reference avion |

**REGLE METIER** : Type operation DEDUIT automatiquement (Cahier des charges S3)
- Donnees arrivee uniquement -> ARRIVEE
- Donnees depart uniquement -> DEPART
- Donnees arrivee ET depart -> TURN_AROUND (deduit, jamais impose)

---

### Extension 2 - Distinction vol programme / hors programme

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| horsProgramme | Boolean | false | Vol hors programme (ponctuel) |
| programmeVolReference | ObjectId (ref: ProgrammeVolSaisonnier) | null | Reference au programme saisonnier |
| raisonHorsProgramme | String | null | Raison du vol hors programme |
| typeVolHorsProgramme | String (enum) | null | CHARTER, MEDICAL, TECHNIQUE, COMMERCIAL, AUTRE |

---

### Index

| Champs | Type |
|--------|------|
| numeroVol, dateVol | Compose |
| compagnieAerienne | Simple |
| statut | Simple |

---

### Statut Vol (Machine a etats)

| Statut | Description | Transitions possibles |
|--------|-------------|----------------------|
| PROGRAMME | Vol planifie | EN_COURS, ANNULE, RETARDE |
| EN_COURS | Vol en execution | TERMINE, ANNULE |
| TERMINE | Vol termine | - |
| ANNULE | Vol annule | - |
| RETARDE | Vol retarde | EN_COURS, ANNULE |

---

## ProgrammeVolSaisonnier.js

### Emplacement
`src/models/flights/ProgrammeVolSaisonnier.js`

### Description
Modele NOUVEAU et INDEPENDANT pour gerer les programmes de vols recurrents (Extension 1).

---

### Schema Informations Generales

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| nomProgramme | String | Oui | Nom descriptif du programme |
| compagnieAerienne | String | Oui | Code IATA ou nom compagnie |
| typeOperation | String (enum) | Oui | ARRIVEE, DEPART, TURN_AROUND |

---

### Schema Recurrence

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| recurrence.frequence | String (enum) | Oui | QUOTIDIEN, HEBDOMADAIRE, BIMENSUEL, MENSUEL |
| recurrence.joursSemaine | Array[Number] | Non | 0=Dimanche a 6=Samedi |
| recurrence.dateDebut | Date | Oui | Date debut programme |
| recurrence.dateFin | Date | Oui | Date fin programme |

---

### Schema Details Vol

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| detailsVol.numeroVolBase | String | Oui | Numero vol base (ex: AF456) |
| detailsVol.avionType | String | null | Type avion prevu |
| detailsVol.horairePrevu.heureArrivee | String | null | HH:MM |
| detailsVol.horairePrevu.heureDepart | String | null | HH:MM |
| detailsVol.capacitePassagers | Number | null | Capacite passagers |
| detailsVol.capaciteFret | Number | null | Capacite fret (kg) |

---

### Schema Statut et Validation

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| statut | String (enum) | BROUILLON | BROUILLON, VALIDE, ACTIF, SUSPENDU, TERMINE |
| actif | Boolean | false | Programme actuellement actif |
| validation.valide | Boolean | false | Programme valide |
| validation.validePar | ObjectId (ref: User) | null | Utilisateur validateur |
| validation.dateValidation | Date | null | Date validation |
| remarques | String | null | Notes sur le programme |
| createdBy | ObjectId (ref: User) | Oui | Createur |
| updatedBy | ObjectId (ref: User) | null | Modificateur |

---

### Statut Programme (Machine a etats)

| Statut | Description | Transitions |
|--------|-------------|-------------|
| BROUILLON | En cours de creation | VALIDE |
| VALIDE | Valide par SUPERVISEUR/MANAGER | ACTIF |
| ACTIF | En exploitation | SUSPENDU, TERMINE |
| SUSPENDU | Temporairement desactive | ACTIF |
| TERMINE | Periode ecoulee | - |

---

### Index

| Champs | Type |
|--------|------|
| compagnieAerienne, actif | Compose |
| recurrence.dateDebut, recurrence.dateFin | Compose |
| statut | Simple |

---

### Methodes Instance

| Methode | Description |
|---------|-------------|
| estActifPourDate(date) | Verifie si programme actif pour une date |
| appliqueAuJour(date) | Verifie si programme s'applique au jour semaine |
| toSimpleObject() | Retourne objet simple avec infos essentielles |

---

### Methodes Statiques

| Methode | Description |
|---------|-------------|
| trouverProgrammesActifs(compagnie) | Programmes actifs d'une compagnie |
| trouverProgrammesPourDate(date) | Programmes valides pour une date |

---

## Options Schema

| Option | Valeur |
|--------|--------|
| timestamps | true |
| collection | programmesvolsaisonniers |

