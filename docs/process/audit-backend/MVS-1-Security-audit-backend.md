# MVS-1-Security - AUDIT DE CONFORMITÉ BACKEND

## MVS : MVS-1-Security
## Date d'audit : 2026-01-10
## Source de référence : docs/process/MVS-1-Security/

---

## 1. MODÈLES (models/)

### 1.1 Personne.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/security/Personne.js | Présent | ✅ |

#### Champs

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| nom | String, required, trim | String, required, trim | ✅ Conforme |
| prenom | String, required, trim | String, required, trim | ✅ Conforme |
| matricule | String, required, unique, uppercase, trim | String, required, unique, trim (PAS uppercase) | ⚠️ Divergence |
| email | String, required, unique, lowercase, match regex | String, required, unique, trim, lowercase | ⚠️ Divergence (pas de regex) |
| password | String, required, minlength: 6, select: false | String, required, select: false (pas de minlength schema) | ⚠️ Divergence |
| fonction | String, required, enum | String, required, enum | ✅ Conforme |
| specialites | [String], enum | [String], enum | ⚠️ Divergence (valeurs différentes) |
| statut | String, enum, default: ACTIF | String, enum, default: ACTIF | ✅ Conforme |
| telephone | String | String | ✅ Conforme |
| dateEmbauche | Date | Date | ✅ Conforme |
| timestamps | AUTO | AUTO | ✅ Conforme |

#### Champs NON documentés présents dans le code

| Champ | Type | Description |
|-------|------|-------------|
| statutCompte | String, enum: EN_ATTENTE, VALIDE, SUSPENDU, DESACTIVE | Phase 1 workflow |
| dateValidationCompte | Date | Date validation compte |
| valideParUserId | ObjectId ref Personne | Validateur compte |

#### Enum specialites

| Documentation | Code réel |
|---------------|-----------|
| PASSAGERS, BAGAGES, FRET, AVION, COORDINATION, TRACTAGE, CATERING, NETTOYAGE | PISTE, PASSAGERS, FRET, BAGAGE, AVITAILLEMENT, NETTOYAGE, MAINTENANCE |

**Résultat** : ⚠️ Divergence - 5 valeurs différentes sur 8

#### Hook pre-save

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| bcrypt salt: 10 | bcrypt salt: 12 | ⚠️ Divergence |
| Condition isModified('password') | Condition isModified('password') | ✅ Conforme |

#### Méthode comparePassword

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| async comparePassword(candidatePassword) -> Boolean | async comparePassword(candidatePassword) -> Boolean | ✅ Conforme |
| bcrypt.compare | bcrypt.compare | ✅ Conforme |

#### Index

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| email unique | email unique (via unique:true) | ✅ Conforme |
| matricule unique | matricule unique (via unique:true) | ✅ Conforme |
| - | fonction index | ⚠️ Non documenté |

**Résultat Personne.js** : ⚠️ DIVERGENCES LISTÉES
- matricule: uppercase absent
- email: regex validation absente
- password: minlength absent du schema
- specialites: enum différent
- bcrypt salt: 12 au lieu de 10
- 3 champs non documentés (statutCompte, dateValidationCompte, valideParUserId)

---

### 1.2 UserActivityLog.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/security/UserActivityLog.js | Présent | ✅ |

#### Champs

| Champ Doc | Champ Code | Conformité |
|-----------|------------|------------|
| user (ObjectId ref Personne) | utilisateurId (ObjectId ref Personne) | ⚠️ Nom différent |
| action (String, enum) | action (String, required, trim) | ⚠️ Pas d'enum |
| targetModel (String) | - | ❌ Absent |
| targetId (ObjectId) | - | ❌ Absent |
| changes (Mixed) | - | ❌ Absent |
| metadata (Object) | meta (Mixed) | ⚠️ Nom différent |
| ipAddress (String) | client.ip (dans sous-schema) | ⚠️ Structure différente |
| userAgent (String) | client.userAgent (dans sous-schema) | ⚠️ Structure différente |

#### Champs NON documentés présents dans le code

| Champ | Type |
|-------|------|
| details | String |
| date | Date |
| type | String enum: auth, action, system, business |
| userSnapshot | Sous-schema (username, role) |
| request | Sous-schema (id, method, path, query, statusCode, latencyMs) |
| client | Sous-schema (ip, userAgent) |
| context | Sous-schema (entityType, entityId, refs) |

#### Enum action

| Documentation | Code réel |
|---------------|-----------|
| CREATE, UPDATE, DELETE, VALIDATE, ACTIVATE, SUSPEND, CONVERT, IMPORT | Aucun enum (String libre) |

**Résultat** : ⚠️ Divergence majeure - enum non appliqué

#### Index

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| user | utilisateurId + createdAt | ⚠️ Composite |
| createdAt | createdAt (DESC) | ✅ Conforme |
| targetModel | - | ❌ Absent |
| - | action + createdAt | Non documenté |
| - | type + createdAt | Non documenté |
| - | context.entityType + entityId + createdAt | Non documenté |
| - | request.id | Non documenté |

#### Méthodes statiques

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| - | write() | Non documenté |
| - | logAuthSuccess() | Non documenté |
| - | logAuthFailure() | Non documenté |
| - | logLogout() | Non documenté |
| - | logAction() | Non documenté |
| - | logSystem() | Non documenté |

**Résultat UserActivityLog.js** : ⚠️ DIVERGENCES MAJEURES
- Structure schema complètement différente
- Noms de champs différents (user -> utilisateurId, metadata -> meta)
- Champs documentés absents (targetModel, targetId, changes)
- Sous-schemas non documentés (userSnapshot, request, client, context)
- Méthodes statiques non documentées

---

## 2. SERVICES (services/)

### Documentation

La documentation indique : "Le MVS-1-Security ne dispose PAS de services dédiés dans src/services/security/"

### Vérification

| Chemin | Recherche | Résultat |
|--------|-----------|----------|
| src/services/security/ | Dossier | ❌ Absent |
| auth.service.js | Grep pattern | ❌ Aucun fichier |

**Résultat** : ✅ CONFORME - Absence de service confirmée

---

## 3. CONTROLLERS (controllers/)

### 3.1 auth.controller.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/security/auth.controller.js | Présent | ✅ |

#### Handlers

| Handler | Doc | Code | Conformité |
|---------|-----|------|------------|
| login | Présent | Présent | ✅ Conforme |
| register | Présent | Présent | ✅ Conforme |
| getMe | Présent | Présent | ✅ Conforme |
| changerMotDePasse | Présent | Présent | ✅ Conforme |

#### Vérifications login

| Vérification Doc | Code réel | Conformité |
|------------------|-----------|------------|
| Email et password fournis (400) | ✅ Présent | ✅ Conforme |
| Utilisateur existe (401) | ✅ Présent | ✅ Conforme |
| Password correct (401) | ✅ Présent | ✅ Conforme |
| Compte actif (403) | ✅ Présent | ✅ Conforme |

#### generateToken

| Élément Doc | Code réel | Conformité |
|-------------|-----------|------------|
| Expiration 3h | expiresIn: '3h' | ✅ Conforme |
| Payload: id, nom, email, role | id, nom, email, role (fonction) | ✅ Conforme |

**Résultat auth.controller.js** : ✅ CONFORME

---

### 3.2 personne.controller.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/security/personne.controller.js | Présent | ✅ |

#### Handlers

| Handler | Doc | Code | Conformité |
|---------|-----|------|------------|
| getAllPersonnes | Présent | Présent | ✅ Conforme |
| getPersonneById | Présent | Présent | ✅ Conforme |
| createPersonne | Présent | Présent | ✅ Conforme |
| updatePersonne | Présent | Présent | ✅ Conforme |
| deletePersonne | Présent | Présent | ✅ Conforme |
| getPersonnesStats | Présent | Présent | ✅ Conforme |

#### Vérifications deletePersonne

| Vérification Doc | Code réel | Conformité |
|------------------|-----------|------------|
| Utilisateur existe (404) | ✅ Présent | ✅ Conforme |
| Pas auto-suppression (400) | ✅ Présent | ✅ Conforme |

**Résultat personne.controller.js** : ✅ CONFORME

---

## 4. ROUTES (routes/)

### 4.1 auth.routes.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/security/auth.routes.js | Présent | ✅ |
| Base path | /api/auth | /api/auth (présumé via montage) | ✅ |

#### Routes

| Route Doc | Méthode | Code réel | Conformité |
|-----------|---------|-----------|------------|
| /login | POST | ✅ Présent | ✅ Conforme |
| /register | POST | ✅ Présent | ✅ Conforme |
| /me | GET | ✅ Présent | ✅ Conforme |
| /changer-mot-de-passe | POST | ✅ Présent | ✅ Conforme |
| /connexion | POST | ✅ Présent | ✅ Conforme |
| /inscription | POST | ✅ Présent | ✅ Conforme |
| /deconnexion | POST | ✅ Présent | ✅ Conforme |

#### Middlewares

| Route | Middleware Doc | Code réel | Conformité |
|-------|----------------|-----------|------------|
| /login | validate | validate | ✅ Conforme |
| /register | validate | validate | ✅ Conforme |
| /me | protect | protect | ✅ Conforme |
| /changer-mot-de-passe | protect, validate | protect, validate | ✅ Conforme |

#### Validation register - Rôles exclus

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| ADMIN exclu | fonction isIn exclut ADMIN | ✅ Conforme |

**Résultat auth.routes.js** : ✅ CONFORME

---

### 4.2 personne.routes.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/security/personne.routes.js | Présent | ✅ |
| Base path | /api/personnes | /api/personnes (présumé) | ✅ |
| Protection globale | router.use(protect) | router.use(protect) | ✅ |

#### Routes

| Route Doc | Méthode | Code réel | Conformité |
|-----------|---------|-----------|------------|
| / | GET | ✅ Présent | ✅ Conforme |
| /stats/global | GET | ✅ Présent | ✅ Conforme |
| /:id | GET | ✅ Présent | ✅ Conforme |
| / | POST | ✅ Présent | ✅ Conforme |
| /:id | PUT | ✅ Présent | ✅ Conforme |
| /:id | PATCH | ✅ Présent | ✅ Conforme |
| /:id | DELETE | ✅ Présent | ✅ Conforme |

#### Contrôle d'accès

| Route | Middleware Doc | Code réel | Conformité |
|-------|----------------|-----------|------------|
| POST / | authorize('ADMIN') | authorize('ADMIN') | ✅ Conforme |
| PUT /:id | authorize('ADMIN') | authorize('ADMIN') | ✅ Conforme |
| PATCH /:id | authorize('ADMIN') | authorize('ADMIN') | ✅ Conforme |
| DELETE /:id | authorize('ADMIN') | authorize('ADMIN') | ✅ Conforme |

**Résultat personne.routes.js** : ✅ CONFORME

---

## 5. RISQUES DE NON-RÉGRESSION

### Points critiques documentés

| Point critique | Localisation Doc | Code réel | Statut |
|----------------|------------------|-----------|--------|
| Hook pre-save hashage | Personne.js:L45-52 | Personne.js:L76-80 | ✅ Présent (ligne différente) |
| Methode comparePassword | Personne.js:L54-56 | Personne.js:L82-84 | ✅ Présent (ligne différente) |
| Generation JWT 3h | auth.controller.js:L6-18 | auth.controller.js:L6-19 | ✅ Conforme |
| select: false password | Personne.js | Personne.js:L31 | ✅ Conforme |

### Vérification bcrypt

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| salt: 10 | salt: 12 | ⚠️ Divergence |

---

## 6. SYNTHÈSE MVS-1-Security

### Statut global : ⚠️ PARTIEL

### Liste factuelle des écarts

#### Modèle Personne.js
1. Champ `matricule` : contrainte `uppercase` documentée mais absente du code
2. Champ `email` : regex validation documentée mais absente du code
3. Champ `password` : minlength:6 documenté au niveau schema mais absent (validé en routes)
4. Enum `specialites` : valeurs différentes (doc vs code)
5. Hook bcrypt : salt 10 documenté, salt 12 dans le code
6. Champs non documentés : `statutCompte`, `dateValidationCompte`, `valideParUserId`

#### Modèle UserActivityLog.js
1. Structure schema complètement différente de la documentation
2. Champ `user` nommé `utilisateurId` dans le code
3. Champs documentés absents : `targetModel`, `targetId`, `changes`
4. Enum `action` non appliqué dans le code
5. Sous-schemas non documentés : `userSnapshot`, `request`, `client`, `context`
6. Méthodes statiques non documentées : `write`, `logAuthSuccess`, `logAuthFailure`, `logLogout`, `logAction`, `logSystem`

#### Controllers
- ✅ Conformes

#### Routes
- ✅ Conformes

#### Services
- ✅ Conformes (absence documentée et confirmée)

---

**Fin de l'audit MVS-1-Security**
