# MVS-8-Referentials - MODELS

## Date d'audit : 2026-01-10

---

## Avion.js

### Emplacement
`src/models/referentials/Avion.js`

### Extension
**Extension 3** : Versioning et Configuration Avion

---

## Schema

```javascript
const avionSchema = new mongoose.Schema({
  immatriculation: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  typeAvion: {
    type: String,
    required: true,
    trim: true
  },
  compagnie: {
    type: String,
    required: true,
    trim: true
  },
  capaciteMax: {
    type: Number,
    required: true,
    min: 1
  },
  actif: {
    type: Boolean,
    default: true
  },
  // Extension 3 - Configuration et versioning
  version: {
    type: Number,
    default: 1
  },
  configuration: {
    sieges: {
      business: { type: Number, default: 0 },
      economique: { type: Number, default: 0 },
      premiumEconomy: { type: Number, default: 0 }
    },
    equipements: [{
      type: String,
      enum: ['WIFI', 'IFE', 'USB', 'PRISE_ELECTRIQUE', 'CUISINE', 'BAR']
    }],
    moteurs: {
      type: { type: String },
      nombre: { type: Number }
    },
    caracteristiquesTechniques: {
      envergure: Number,
      longueur: Number,
      hauteur: Number,
      masseMaxDecollage: Number,
      autonomieKm: Number
    }
  },
  historiqueVersions: [{
    version: Number,
    configuration: Object,
    dateModification: Date,
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentaire: String
  }],
  derniereRevision: {
    date: Date,
    type: { type: String, enum: ['A', 'B', 'C', 'D'] },
    prochaine: Date
  },
  remarques: String
}, { timestamps: true });
```

---

## Champs

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| immatriculation | String | required, unique, uppercase | Immatriculation avion |
| typeAvion | String | required | Type/modele avion |
| compagnie | String | required | Compagnie aerienne |
| capaciteMax | Number | required, min 1 | Capacite passagers |
| actif | Boolean | default true | Avion en service |
| version | Number | default 1 | Version configuration |
| configuration | Object | optionnel | Configuration detaillee |
| historiqueVersions | [Object] | array | Historique des versions |
| derniereRevision | Object | optionnel | Infos revision |
| remarques | String | optionnel | Notes libres |

---

## Sous-schema : configuration

| Champ | Type | Description |
|-------|------|-------------|
| sieges.business | Number | Sieges classe affaires |
| sieges.economique | Number | Sieges economiques |
| sieges.premiumEconomy | Number | Sieges premium eco |
| equipements | [String] | Equipements a bord |
| moteurs.type | String | Type moteur |
| moteurs.nombre | Number | Nombre moteurs |
| caracteristiquesTechniques | Object | Dimensions, masse, autonomie |

---

## Sous-schema : historiqueVersions

| Champ | Type | Description |
|-------|------|-------------|
| version | Number | Numero version |
| configuration | Object | Configuration a cette version |
| dateModification | Date | Date du changement |
| modifiePar | ObjectId (User) | Utilisateur modificateur |
| commentaire | String | Raison du changement |

---

## Enums

### equipements
| Valeur | Description |
|--------|-------------|
| WIFI | Wifi a bord |
| IFE | In-Flight Entertainment |
| USB | Ports USB |
| PRISE_ELECTRIQUE | Prises electriques |
| CUISINE | Cuisine equipee |
| BAR | Bar a bord |

### derniereRevision.type
| Valeur | Description |
|--------|-------------|
| A | Check A (legere) |
| B | Check B |
| C | Check C (lourde) |
| D | Check D (majeure) |

---

## Index

| Champ | Type | Description |
|-------|------|-------------|
| immatriculation | Unique | Identifiant unique |
| timestamps | Auto | createdAt, updatedAt |

---

## Relations

| Relation | Modele | Type | Description |
|----------|--------|------|-------------|
| historiqueVersions.modifiePar | User | N:1 | Auteur modification |

---

## Timestamps
- createdAt : Date de creation
- updatedAt : Date de modification

