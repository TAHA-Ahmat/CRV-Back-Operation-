# MVS-10-Validation - MODELS

## Date d'audit : 2026-01-10

---

## ValidationCRV.js

### Emplacement
`src/models/validation/ValidationCRV.js`

---

## Schema

```javascript
const validationCRVSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true,
    unique: true
  },
  validePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateValidation: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'VALIDE', 'REJETE', 'VERROUILLE'],
    default: 'EN_ATTENTE'
  },
  commentaires: {
    type: String,
    maxlength: 2000
  },
  scoreCompletude: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  conformiteSLA: {
    type: Boolean,
    default: true
  },
  ecartsSLA: [{
    phase: { type: mongoose.Schema.Types.ObjectId, ref: 'Phase' },
    ecartMinutes: Number,
    typeEcart: { type: String, enum: ['DEPASSEMENT', 'SOUS_UTILISATION'] }
  }],
  verrouille: {
    type: Boolean,
    default: false
  },
  dateVerrouillage: Date,
  verrouillePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  historique: [{
    action: { type: String, enum: ['CREATION', 'VALIDATION', 'REJET', 'VERROUILLAGE', 'DEVERROUILLAGE'] },
    date: { type: Date, default: Date.now },
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentaire: String
  }]
}, { timestamps: true });
```

---

## Champs

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| crv | ObjectId (CRV) | required, unique | CRV valide |
| validePar | ObjectId (User) | required | Validateur |
| dateValidation | Date | default now | Date de validation |
| statut | String | enum | Statut validation |
| commentaires | String | max 2000 | Commentaires validateur |
| scoreCompletude | Number | 0-100 | Score de completude |
| conformiteSLA | Boolean | default true | Conformite SLA |
| ecartsSLA | [Object] | optionnel | Ecarts SLA par phase |
| verrouille | Boolean | default false | CRV verrouille |
| dateVerrouillage | Date | optionnel | Date verrouillage |
| verrouillePar | ObjectId (User) | optionnel | Utilisateur verrouilleur |
| historique | [Object] | array | Historique actions |

---

## Sous-schema : ecartsSLA

| Champ | Type | Description |
|-------|------|-------------|
| phase | ObjectId (Phase) | Phase concernee |
| ecartMinutes | Number | Ecart en minutes |
| typeEcart | String | Type d'ecart (DEPASSEMENT ou SOUS_UTILISATION) |

---

## Sous-schema : historique

| Champ | Type | Description |
|-------|------|-------------|
| action | String | Type d'action |
| date | Date | Date de l'action |
| utilisateur | ObjectId (User) | Auteur de l'action |
| commentaire | String | Commentaire optionnel |

---

## Enums

### statut
| Valeur | Description |
|--------|-------------|
| EN_ATTENTE | En attente de validation |
| VALIDE | CRV valide |
| REJETE | CRV rejete |
| VERROUILLE | CRV verrouille definitivement |

### ecartsSLA.typeEcart
| Valeur | Description |
|--------|-------------|
| DEPASSEMENT | SLA depasse |
| SOUS_UTILISATION | Temps inferieur au minimum |

### historique.action
| Valeur | Description |
|--------|-------------|
| CREATION | Creation validation |
| VALIDATION | CRV valide |
| REJET | CRV rejete |
| VERROUILLAGE | CRV verrouille |
| DEVERROUILLAGE | CRV deverrouille |

---

## Index

| Champ | Type | Description |
|-------|------|-------------|
| crv | Unique | Un seul enregistrement par CRV |
| timestamps | Auto | createdAt, updatedAt |

---

## Relations

| Relation | Modele | Type | Description |
|----------|--------|------|-------------|
| crv | CRV | 1:1 | CRV valide |
| validePar | User | N:1 | Validateur |
| verrouillePar | User | N:1 | Utilisateur verrouilleur |
| ecartsSLA.phase | Phase | N:1 | Phase avec ecart |
| historique.utilisateur | User | N:1 | Auteur action |

---

## Timestamps
- createdAt : Date de creation
- updatedAt : Date de modification

