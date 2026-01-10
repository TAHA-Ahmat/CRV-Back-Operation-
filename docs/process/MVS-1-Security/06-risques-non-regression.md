# MVS-1-Security - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Hashage mot de passe

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Hook pre-save | Personne.js:L45-52 | CRITIQUE |

**Description** : Le hook Mongoose `pre('save')` hash automatiquement le mot de passe avec bcrypt (salt 10) avant chaque sauvegarde si le champ password est modifie.

**Risque** : Toute modification de ce hook peut :
- Stocker les mots de passe en clair
- Casser l'authentification existante
- Creer une faille de securite majeure

**Modifications INTERDITES** :
- Suppression du hook
- Modification de l'algorithme bcrypt
- Changement du salt rounds
- Suppression de la condition `isModified('password')`

---

### 1.2 Methode comparePassword

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| comparePassword | Personne.js:L54-56 | CRITIQUE |

**Description** : Methode d'instance pour comparer un mot de passe candidat avec le hash stocke.

**Risque** : Toute modification peut :
- Permettre l'authentification avec n'importe quel mot de passe
- Bloquer tous les utilisateurs

**Modifications INTERDITES** :
- Changement de la logique bcrypt.compare
- Modification du retour boolean

---

### 1.3 Generation JWT

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| generateToken | auth.controller.js:L6-18 | CRITIQUE |

**Description** : Genere un token JWT signe avec le secret configure.

**Risque** : Toute modification peut :
- Permettre la generation de faux tokens
- Invalider tous les tokens existants

**Elements sensibles** :
- `config.jwtSecret` : Secret de signature
- Payload : `{ id, nom, email, role }`
- Expiration : `3h`

---

### 1.4 Middleware protect

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| protect | middlewares/auth.middleware.js | CRITIQUE |

**Description** : Verifie la validite du token JWT et injecte l'utilisateur dans req.user.

**Risque** : Toute modification peut :
- Permettre l'acces sans authentification
- Injecter un mauvais utilisateur

---

## 2. COUPLAGES FORTS

### 2.1 Personne -> Tous les MVS

| MVS dependant | Champ reference | Usage |
|---------------|-----------------|-------|
| MVS-2-CRV | CRV.creePar | Auteur du CRV |
| MVS-2-CRV | CRV.responsableVol | Responsable vol |
| MVS-2-CRV | CRV.verrouillePar | Validateur |
| MVS-3-Phases | ChronologiePhase.responsable | Responsable phase |
| MVS-7-Notifications | Notification.destinataire | Destinataire |
| MVS-Security | UserActivityLog.user | Auteur action |

**Impact** : La suppression d'un utilisateur peut creer des references orphelines.

---

### 2.2 Enum fonction

| Element | Valeurs | Dependances |
|---------|---------|-------------|
| Personne.fonction | AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN | Middleware authorize(), routes excludeQualite |

**Impact** : L'ajout/suppression d'un role necessite :
1. Modification enum dans Personne.js
2. Modification middleware authorize
3. Modification validations routes auth.routes.js
4. Modification validations routes personne.routes.js
5. Verification toutes les routes utilisant authorize()

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite | Protection |
|-------|--------|-------------|------------|
| password | Personne | CRITIQUE | select: false, hashage |
| email | Personne | HAUTE | Unique, utilise pour auth |
| matricule | Personne | HAUTE | Unique, identifiant employe |
| fonction | Personne | HAUTE | Determine les droits |
| statut | Personne | MOYENNE | Peut bloquer l'acces |

---

## 4. FONCTIONS A HAUT RISQUE

### 4.1 deletePersonne

| Risque | Description |
|--------|-------------|
| Integrite referentielle | Pas de verification des dependances avant suppression |
| Donnees orphelines | Les CRV/Phases/Logs referencant l'utilisateur restent |

**Recommandation** : Ajouter une verification des references avant suppression ou utiliser soft delete.

---

### 4.2 register (public)

| Risque | Description |
|--------|-------------|
| Enumeration | Les erreurs specifiques peuvent reveler l'existence d'emails |
| Roles | ADMIN exclu mais pas d'autres restrictions |

---

## 5. MODIFICATIONS INTERDITES

### 5.1 Schema Personne

| Element | Raison |
|---------|--------|
| Index unique email | Authentification |
| Index unique matricule | Identification |
| select: false sur password | Securite |
| Hook pre-save | Hashage |
| Methode comparePassword | Authentification |

### 5.2 Config JWT

| Element | Raison |
|---------|--------|
| jwtSecret | Tous les tokens deviennent invalides |
| Expiration | Impact UX et securite |
| Payload structure | Middleware protect depend de la structure |

---

## 6. ZONES FRAGILES

### 6.1 Validation routes

**Localisation** : auth.routes.js, personne.routes.js

**Fragilite** : Les regles de validation sont dupliquees entre register et createPersonne. Une modification dans un endroit doit etre repliquee.

---

### 6.2 Alias routes

**Localisation** : auth.routes.js (connexion, inscription, deconnexion)

**Fragilite** : Ces routes alias doivent rester synchronisees avec les routes principales.

---

### 6.3 Gestion password dual

**Fragilite** : Le code supporte `password` ET `motDePasse` pour compatibilite frontend. Cette dualite doit etre maintenue.

```javascript
const pwd = password || motDePasse;
```

---

## 7. CHECKLIST NON-REGRESSION

Avant toute modification du MVS-1-Security, verifier :

- [ ] Hook pre-save password intact
- [ ] Methode comparePassword intacte
- [ ] Index unique email/matricule intacts
- [ ] select: false sur password
- [ ] Middleware protect fonctionnel
- [ ] Enum fonction synchronise partout
- [ ] Alias routes fonctionnels
- [ ] Support password + motDePasse
- [ ] Validation 6 caracteres minimum password
- [ ] Generation JWT avec bon payload

---

## 8. TESTS CRITIQUES A MAINTENIR

| Test | Description | Priorite |
|------|-------------|----------|
| Login valide | Email + password corrects | P0 |
| Login invalide | Password incorrect | P0 |
| Login compte inactif | Statut !== ACTIF | P0 |
| Register unicite email | Email deja existant | P0 |
| Register unicite matricule | Matricule existant | P0 |
| Token expire | Acces apres expiration | P0 |
| Token invalide | Token malformed/signe incorrectement | P0 |
| Authorize ADMIN | Non-ADMIN sur route ADMIN | P0 |
| Auto-suppression | DELETE son propre compte | P1 |
| Changement MDP | Ancien incorrect | P1 |
