# MVS-1-Security - MODELS

## Date d'audit : 2026-01-10

---

## 1. Personne.js

### Emplacement
`src/models/security/Personne.js`

### Role dans le MVS
Modele principal representant un utilisateur du systeme CRV. Gere l'authentification, les roles et les informations personnelles du personnel.

### Champs definis

| Champ | Type | Requis | Contraintes | Description |
|-------|------|--------|-------------|-------------|
| `nom` | String | OUI | required, trim | Nom de famille |
| `prenom` | String | OUI | required, trim | Prenom |
| `matricule` | String | OUI | required, unique, uppercase, trim | Identifiant unique employe |
| `email` | String | OUI | required, unique, lowercase, match regex email | Adresse email |
| `password` | String | OUI | required, minlength: 6, select: false | Mot de passe hashe |
| `fonction` | String | OUI | required, enum | Role dans le systeme |
| `specialites` | [String] | NON | enum | Competences specifiques |
| `statut` | String | NON | enum, default: 'ACTIF' | Etat du compte |
| `telephone` | String | NON | - | Numero de telephone |
| `dateEmbauche` | Date | NON | - | Date d'embauche |
| `createdAt` | Date | AUTO | timestamps | Date de creation |
| `updatedAt` | Date | AUTO | timestamps | Date de modification |

### Valeurs ENUM

#### fonction
```
'AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'
```

#### specialites
```
'PASSAGERS', 'BAGAGES', 'FRET', 'AVION', 'COORDINATION', 'TRACTAGE', 'CATERING', 'NETTOYAGE'
```

#### statut
```
'ACTIF', 'ABSENT', 'CONGE', 'INACTIF'
```

### Hooks Mongoose

#### pre('save')
- **Declencheur** : Avant chaque sauvegarde
- **Condition** : Si le champ `password` est modifie
- **Action** : Hash du mot de passe avec bcrypt (salt: 10)
- **Code critique** : NE PAS MODIFIER - Securite authentification

### Methodes d'instance

#### comparePassword(candidatePassword)
- **Signature** : `async comparePassword(candidatePassword) -> Boolean`
- **Logique** : Compare le mot de passe fourni avec le hash stocke via bcrypt.compare
- **Retour** : `true` si correspondance, `false` sinon
- **Usage** : Authentification login

### Index

| Champs | Type | Description |
|--------|------|-------------|
| `email` | unique | Unicite email |
| `matricule` | unique | Unicite matricule |

### Relations
- Aucune reference directe (ObjectId ref)
- Utilise comme reference PAR d'autres modeles (CRV.creePar, CRV.responsableVol, etc.)

### Regles metier portees

1. **Unicite email/matricule** : Garantie par index unique
2. **Hashage password** : Automatique via hook pre-save
3. **Password non expose** : select: false sur le champ password
4. **Statut par defaut** : ACTIF a la creation

### Invariants metier

1. Un utilisateur DOIT avoir un email valide (regex)
2. Un utilisateur DOIT avoir un matricule unique
3. Le password DOIT faire minimum 6 caracteres
4. La fonction DOIT etre une valeur de l'enum

### Elements INTOUCHABLES

- Hook pre('save') pour hashage password
- Methode comparePassword
- Index unique sur email et matricule
- Validation enum sur fonction

### Risques de regression

| Element | Risque | Impact |
|---------|--------|--------|
| Modification hook password | CRITIQUE | Authentification cassee |
| Suppression select:false sur password | CRITIQUE | Fuite de donnees |
| Modification enum fonction | MAJEUR | RBAC casse |
| Modification regex email | MINEUR | Validation laxiste |

---

## 2. UserActivityLog.js

### Emplacement
`src/models/security/UserActivityLog.js`

### Role dans le MVS
Modele de tracabilite pour l'audit des actions utilisateurs. Enregistre toutes les operations effectuees sur les entites du systeme.

### Champs definis

| Champ | Type | Requis | Contraintes | Description |
|-------|------|--------|-------------|-------------|
| `user` | ObjectId | OUI | ref: 'Personne' | Utilisateur ayant effectue l'action |
| `action` | String | OUI | enum | Type d'action effectuee |
| `targetModel` | String | OUI | - | Nom du modele cible |
| `targetId` | ObjectId | NON | - | ID de l'entite ciblee |
| `changes` | Mixed | NON | - | Details des modifications |
| `metadata` | Object | NON | - | Metadonnees supplementaires |
| `ipAddress` | String | NON | - | Adresse IP source |
| `userAgent` | String | NON | - | User-Agent du client |
| `createdAt` | Date | AUTO | timestamps | Date de l'action |

### Valeurs ENUM

#### action
```
'CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'ACTIVATE', 'SUSPEND', 'CONVERT', 'IMPORT'
```

### Hooks Mongoose
Aucun hook defini.

### Index

| Champs | Type | Description |
|--------|------|-------------|
| `user` | standard | Recherche par utilisateur |
| `createdAt` | standard | Recherche par date |
| `targetModel` | standard | Recherche par modele |

### Relations

| Champ | Modele reference | Description |
|-------|------------------|-------------|
| `user` | Personne | Auteur de l'action |

### Regles metier portees

1. **Tracabilite complete** : Toute action significative DOIT etre loguee
2. **Immutabilite** : Les logs ne doivent JAMAIS etre modifies apres creation
3. **Conservation** : Les logs doivent etre conserves pour audit

### Invariants metier

1. Chaque log DOIT avoir un user valide
2. Chaque log DOIT avoir une action valide
3. Chaque log DOIT avoir un targetModel

### Elements INTOUCHABLES

- Schema (structure du log d'audit)
- Relation avec Personne

### Risques de regression

| Element | Risque | Impact |
|---------|--------|--------|
| Modification schema | MAJEUR | Perte tracabilite |
| Suppression reference user | CRITIQUE | Audit impossible |

---

## SYNTHESE MODELS MVS-1-Security

| Modele | Fichier | Role | Criticite |
|--------|---------|------|-----------|
| Personne | Personne.js | Utilisateurs et authentification | CRITIQUE |
| UserActivityLog | UserActivityLog.js | Audit et tracabilite | HAUTE |

### Dependances inter-modeles
- UserActivityLog -> Personne (via user)

### Points d'attention
1. Le modele Personne est CENTRAL - utilise par tous les autres MVS
2. UserActivityLog est TRANSVERSAL - utilise pour audit de tous les MVS
