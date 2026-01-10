# MVS-1-Security - CONTROLLERS

## Date d'audit : 2026-01-10

---

## 1. auth.controller.js

### Emplacement
`src/controllers/security/auth.controller.js`

### Role dans le MVS
Gestion de l'authentification : login, register, profil utilisateur, changement de mot de passe.

### Dependances
```javascript
import jwt from 'jsonwebtoken';
import Personne from '../../models/security/Personne.js';
import { config } from '../../config/env.js';
```

### Handlers exposes

---

#### login

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/auth/login |
| Middlewares | validate (body: email, password) |
| Authentification | Non requise |

**Donnees lues depuis la requete :**
- `req.body.email` : Email utilisateur
- `req.body.password` ou `req.body.motDePasse` : Mot de passe

**Appels de services :**
- `Personne.findOne({ email }).select('+password')` : Recherche utilisateur
- `personne.comparePassword(pwd)` : Verification password

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Token + user data |
| 400 | Email ou password manquant | "Email et mot de passe requis" |
| 401 | Utilisateur non trouve | "Identifiants invalides" |
| 401 | Password incorrect | "Identifiants invalides" |
| 403 | Compte non actif | "Compte inactif" |

**Structure reponse succes :**
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "ObjectId",
    "nom": "string",
    "prenom": "string",
    "email": "string",
    "fonction": "string",
    "matricule": "string"
  }
}
```

---

#### register

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/auth/register |
| Middlewares | validate (body validation) |
| Authentification | Non requise |

**Donnees lues depuis la requete :**
- `req.body.nom` : Nom (requis)
- `req.body.prenom` : Prenom (requis)
- `req.body.matricule` : Matricule (requis)
- `req.body.email` : Email (requis)
- `req.body.password` ou `req.body.motDePasse` : Mot de passe (requis)
- `req.body.fonction` : Role (requis)
- `req.body.specialites` : Specialites (optionnel)

**Appels de services :**
- `Personne.findOne({ $or: [{ email }, { matricule }] })` : Verification unicite
- `Personne.create({...})` : Creation utilisateur

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 201 | Succes | Token + user data |
| 400 | Email ou matricule existant | "Email ou matricule deja utilise" |

---

#### getMe

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/auth/me |
| Middlewares | protect |
| Authentification | Requise |

**Donnees lues depuis la requete :**
- `req.user._id` : ID utilisateur (injecte par middleware)

**Appels de services :**
- `Personne.findById(req.user._id)` : Recherche profil

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Donnees utilisateur |

---

#### changerMotDePasse

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/auth/changer-mot-de-passe |
| Middlewares | protect, validate |
| Authentification | Requise |

**Donnees lues depuis la requete :**
- `req.body.ancienMotDePasse` : Ancien password (requis)
- `req.body.nouveauMotDePasse` : Nouveau password (requis, min 6 car)

**Appels de services :**
- `Personne.findById(req.user._id).select('+password')` : Recherche avec password
- `personne.comparePassword(ancienMotDePasse)` : Verification
- `personne.save()` : Mise a jour

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | "Mot de passe modifie avec succes" |
| 400 | Parametres manquants | "Ancien et nouveau mot de passe requis" |
| 400 | Nouveau trop court | "Le nouveau mot de passe doit faire au moins 6 caracteres" |
| 401 | Ancien incorrect | "Ancien mot de passe incorrect" |
| 404 | Utilisateur non trouve | "Utilisateur non trouve" |

---

## 2. personne.controller.js

### Emplacement
`src/controllers/security/personne.controller.js`

### Role dans le MVS
CRUD complet sur les utilisateurs. Reserve aux administrateurs pour certaines operations.

### Dependances
```javascript
import Personne from '../../models/security/Personne.js';
```

### Handlers exposes

---

#### getAllPersonnes

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/personnes |
| Middlewares | protect |
| Authentification | Requise |

**Donnees lues depuis la requete :**
- `req.query.page` : Numero de page (default: 1)
- `req.query.limit` : Limite par page (default: 50)
- `req.query.fonction` : Filtre par fonction
- `req.query.statut` : Filtre par statut
- `req.query.search` : Recherche texte

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Liste paginee |

**Structure reponse succes :**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

---

#### getPersonneById

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/personnes/:id |
| Middlewares | protect |
| Authentification | Requise |

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Donnees utilisateur |
| 404 | Non trouve | "Utilisateur non trouve" |

---

#### createPersonne

| Propriete | Valeur |
|-----------|--------|
| Route | POST /api/personnes |
| Middlewares | protect, authorize('ADMIN'), validate, validatePassword |
| Authentification | Requise (ADMIN) |

**Donnees lues depuis la requete :**
- `req.body.nom` : Nom (requis)
- `req.body.prenom` : Prenom (requis)
- `req.body.matricule` : Matricule (optionnel, auto-genere)
- `req.body.email` : Email (requis)
- `req.body.password`/`motDePasse` : Password (requis)
- `req.body.fonction` : Role (requis)
- `req.body.specialites` : Specialites (optionnel)
- `req.body.telephone` : Telephone (optionnel)
- `req.body.dateEmbauche` : Date embauche (optionnel)

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 201 | Succes | Utilisateur cree |
| 400 | Email/matricule duplique | "Email ou matricule deja utilise" |

---

#### updatePersonne

| Propriete | Valeur |
|-----------|--------|
| Route | PUT /api/personnes/:id |
| Route | PATCH /api/personnes/:id |
| Middlewares | protect, authorize('ADMIN'), validate |
| Authentification | Requise (ADMIN) |

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Utilisateur mis a jour |
| 404 | Non trouve | "Utilisateur non trouve" |

---

#### deletePersonne

| Propriete | Valeur |
|-----------|--------|
| Route | DELETE /api/personnes/:id |
| Middlewares | protect, authorize('ADMIN') |
| Authentification | Requise (ADMIN) |

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | "Utilisateur supprime avec succes" |
| 400 | Auto-suppression | "Vous ne pouvez pas supprimer votre propre compte" |
| 404 | Non trouve | "Utilisateur non trouve" |

---

#### getPersonnesStats

| Propriete | Valeur |
|-----------|--------|
| Route | GET /api/personnes/stats/global |
| Middlewares | protect |
| Authentification | Requise |

**Codes HTTP retournes :**
| Code | Condition | Message |
|------|-----------|---------|
| 200 | Succes | Statistiques |

**Structure reponse succes :**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byFonction": {
      "AGENT_ESCALE": 50,
      "CHEF_EQUIPE": 20,
      ...
    },
    "byStatut": {
      "ACTIF": 90,
      "ABSENT": 5,
      ...
    }
  }
}
```

---

## SYNTHESE CONTROLLERS MVS-1-Security

| Controller | Fichier | Handlers | Rôle |
|------------|---------|----------|------|
| auth | auth.controller.js | 4 | Authentification |
| personne | personne.controller.js | 6 | CRUD Utilisateurs |

### Cas d'erreur communs
- Tous les handlers utilisent `next(error)` pour propager les erreurs au middleware global
- Les erreurs de validation sont gerees par le middleware `validate`
