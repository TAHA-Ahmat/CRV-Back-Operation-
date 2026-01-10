# MVS-7-Notifications - MODELS

## Date d'audit : 2026-01-10

---

## Notification.js

### Emplacement
`src/models/notifications/Notification.js`

### Extension
**Extension 7** : Notifications In-App

---

## Schema

```javascript
const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'ALERTE_SLA'],
    default: 'INFO'
  },
  titre: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  lien: {
    type: String
  },
  lue: {
    type: Boolean,
    default: false
  },
  dateLecture: {
    type: Date
  },
  priorite: {
    type: String,
    enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
    default: 'NORMALE'
  },
  canaux: [{
    type: String,
    enum: ['email', 'sms', 'push', 'inApp']
  }],
  source: {
    type: {
      type: String,
      enum: ['CRV', 'VOL', 'PHASE', 'SYSTEME', 'UTILISATEUR']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  expiration: {
    type: Date
  }
}, { timestamps: true });
```

---

## Champs

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| destinataire | ObjectId (User) | required, index | Utilisateur cible |
| type | String | enum | Type de notification |
| titre | String | required, max 200 | Titre court |
| message | String | required, max 2000 | Corps du message |
| lien | String | optionnel | URL de redirection |
| lue | Boolean | default false | Statut lecture |
| dateLecture | Date | optionnel | Date de lecture |
| priorite | String | enum | Niveau de priorite |
| canaux | [String] | enum array | Canaux de diffusion |
| source.type | String | enum | Origine notification |
| source.id | ObjectId | optionnel | ID de l'entite source |
| expiration | Date | optionnel | Date d'expiration |

---

## Enums

### type
| Valeur | Description |
|--------|-------------|
| INFO | Information generale |
| WARNING | Avertissement |
| ERROR | Erreur |
| SUCCESS | Succes/Confirmation |
| ALERTE_SLA | Alerte SLA specifique |

### priorite
| Valeur | Description |
|--------|-------------|
| BASSE | Priorite basse |
| NORMALE | Priorite normale |
| HAUTE | Priorite haute |
| URGENTE | Priorite urgente |

### canaux
| Valeur | Description |
|--------|-------------|
| email | Notification par email |
| sms | Notification par SMS |
| push | Notification push |
| inApp | Notification in-app |

### source.type
| Valeur | Description |
|--------|-------------|
| CRV | Provient d'un CRV |
| VOL | Provient d'un vol |
| PHASE | Provient d'une phase |
| SYSTEME | Notification systeme |
| UTILISATEUR | Action utilisateur |

---

## Index

| Champ | Type | Description |
|-------|------|-------------|
| destinataire | Index simple | Recherche par utilisateur |
| timestamps | Auto | createdAt, updatedAt |

---

## Relations

| Relation | Modele | Type | Description |
|----------|--------|------|-------------|
| destinataire | User | N:1 | Utilisateur destinataire |
| source.id | Variable | N:1 | Entite source optionnelle |

---

## Timestamps
- createdAt : Date de creation
- updatedAt : Date de modification

