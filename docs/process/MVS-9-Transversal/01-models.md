# MVS-9-Transversal - MODELS

## Date d'audit : 2026-01-10

---

## AffectationPersonneVol.js

### Emplacement
`src/models/transversal/AffectationPersonneVol.js`

---

## Schema

```javascript
const affectationPersonneVolSchema = new mongoose.Schema({
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true,
    index: true
  },
  personne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: [
      'CHEF_AVION',
      'AGENT_TRAFIC',
      'AGENT_PISTE',
      'AGENT_BAGAGES',
      'AGENT_FRET',
      'SUPERVISEUR',
      'COORDINATEUR'
    ]
  },
  heureDebut: {
    type: Date,
    required: true
  },
  heureFin: {
    type: Date
  },
  statut: {
    type: String,
    enum: ['PREVU', 'EN_COURS', 'TERMINE', 'ANNULE'],
    default: 'PREVU'
  },
  remarques: String
}, { timestamps: true });
```

---

## Champs

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| vol | ObjectId (Vol) | required, index | Vol concerne |
| personne | ObjectId (User) | required, index | Personnel affecte |
| role | String | required, enum | Role sur le vol |
| heureDebut | Date | required | Debut affectation |
| heureFin | Date | optionnel | Fin affectation |
| statut | String | enum, default PREVU | Statut affectation |
| remarques | String | optionnel | Notes |

---

## Enums

### role
| Valeur | Description |
|--------|-------------|
| CHEF_AVION | Responsable operations avion |
| AGENT_TRAFIC | Agent de trafic |
| AGENT_PISTE | Agent de piste |
| AGENT_BAGAGES | Agent bagages |
| AGENT_FRET | Agent fret |
| SUPERVISEUR | Superviseur operations |
| COORDINATEUR | Coordinateur equipe |

### statut
| Valeur | Description |
|--------|-------------|
| PREVU | Affectation planifiee |
| EN_COURS | Affectation active |
| TERMINE | Affectation terminee |
| ANNULE | Affectation annulee |

---

## Index

| Champ | Type | Description |
|-------|------|-------------|
| vol | Index simple | Recherche par vol |
| personne | Index simple | Recherche par personne |
| timestamps | Auto | createdAt, updatedAt |

---

## Relations

| Relation | Modele | Type | Description |
|----------|--------|------|-------------|
| vol | Vol | N:1 | Vol concerne |
| personne | User | N:1 | Personnel affecte |

---

## Timestamps
- createdAt : Date de creation
- updatedAt : Date de modification

---

---

## EvenementOperationnel.js

### Emplacement
`src/models/transversal/EvenementOperationnel.js`

---

## Schema

```javascript
const evenementOperationnelSchema = new mongoose.Schema({
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true,
    index: true
  },
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    index: true
  },
  typeEvenement: {
    type: String,
    required: true,
    enum: [
      'RETARD_PASSAGERS',
      'RETARD_BAGAGES',
      'RETARD_FRET',
      'RETARD_CARBURANT',
      'RETARD_EQUIPAGE',
      'RETARD_TECHNIQUE',
      'RETARD_METEO',
      'RETARD_ATC',
      'INCIDENT_SECURITE',
      'INCIDENT_SURETE',
      'INCIDENT_TECHNIQUE',
      'CHANGEMENT_PORTE',
      'CHANGEMENT_STAND',
      'AUTRE'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  heureDebut: {
    type: Date,
    required: true
  },
  heureFin: {
    type: Date
  },
  dureeImpactMinutes: {
    type: Number
  },
  gravite: {
    type: String,
    enum: ['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE'],
    default: 'MINEURE'
  },
  impactPhases: [{
    phase: { type: mongoose.Schema.Types.ObjectId, ref: 'Phase' },
    impactMinutes: Number
  }],
  declarePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolu: {
    type: Boolean,
    default: false
  },
  dateResolution: Date,
  actionsCorrectives: [{
    description: String,
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateAction: Date
  }]
}, { timestamps: true });
```

---

## Champs

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| vol | ObjectId (Vol) | required, index | Vol concerne |
| crv | ObjectId (CRV) | optionnel, index | CRV associe |
| typeEvenement | String | required, enum | Type d'evenement |
| description | String | required, max 2000 | Description detaillee |
| heureDebut | Date | required | Debut evenement |
| heureFin | Date | optionnel | Fin evenement |
| dureeImpactMinutes | Number | calcule | Duree impact en minutes |
| gravite | String | enum | Niveau de gravite |
| impactPhases | [Object] | optionnel | Phases impactees |
| declarePar | ObjectId (User) | required | Utilisateur declarant |
| resolu | Boolean | default false | Evenement resolu |
| dateResolution | Date | optionnel | Date resolution |
| actionsCorrectives | [Object] | optionnel | Actions prises |

---

## Enums

### typeEvenement
| Valeur | Description |
|--------|-------------|
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

### gravite
| Valeur | Description |
|--------|-------------|
| MINEURE | Impact faible |
| MODEREE | Impact modere |
| MAJEURE | Impact important |
| CRITIQUE | Impact critique |

---

## Pre-save Hook

```javascript
evenementOperationnelSchema.pre('save', function(next) {
  if (this.heureDebut && this.heureFin) {
    this.dureeImpactMinutes = Math.round(
      (this.heureFin - this.heureDebut) / (1000 * 60)
    );
  }
  next();
});
```

Calcul automatique de dureeImpactMinutes a partir de heureDebut et heureFin.

---

## Index

| Champ | Type | Description |
|-------|------|-------------|
| vol | Index simple | Recherche par vol |
| crv | Index simple | Recherche par CRV |
| timestamps | Auto | createdAt, updatedAt |

---

## Relations

| Relation | Modele | Type | Description |
|----------|--------|------|-------------|
| vol | Vol | N:1 | Vol concerne |
| crv | CRV | N:1 | CRV associe |
| declarePar | User | N:1 | Declarant |
| impactPhases.phase | Phase | N:1 | Phase impactee |
| actionsCorrectives.responsable | User | N:1 | Responsable action |

---

## Timestamps
- createdAt : Date de creation
- updatedAt : Date de modification

