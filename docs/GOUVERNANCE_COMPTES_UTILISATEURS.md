# 🔐 GOUVERNANCE COMPTES UTILISATEURS — CRV BACKEND

**Version**: 1.0.0
**Date**: 2026-01-05
**Statut**: RÉFÉRENTIEL OFFICIEL
**Classification**: Architecture Backend — Sécurité & Gouvernance

---

## 📋 TABLE DES MATIÈRES

1. [Principe fondamental](#principe-fondamental)
2. [Bootstrap initial (base vide)](#1️⃣-bootstrap-initial-base-vide)
3. [Verrouillage définitif de l'inscription](#2️⃣-verrouillage-définitif-de-linscription)
4. [Création de comptes par ADMIN](#3️⃣-création-de-comptes-par-admin)
5. [Modification de comptes existants](#4️⃣-modification-de-comptes-existants)
6. [Désactivation et suppression](#5️⃣-désactivation-et-suppression)
7. [Cas limites et situations exceptionnelles](#6️⃣-cas-limites-et-situations-exceptionnelles)
8. [Matrice de permissions](#7️⃣-matrice-de-permissions)
9. [Garanties sécurité et audit](#8️⃣-garanties-sécurité-et-audit)
10. [Références techniques](#références-techniques)

---

## PRINCIPE FONDAMENTAL

### Règle absolue de gouvernance

```
┌─────────────────────────────────────────────────────────────┐
│  UNE SEULE INSCRIPTION DANS TOUTE LA VIE DU SYSTÈME         │
│                                                               │
│  ✅ Premier ADMIN : inscription unique via bootstrap         │
│  ❌ Après : AUCUNE inscription publique autorisée           │
│  👤 Tous les autres comptes : créés par ADMIN uniquement    │
└─────────────────────────────────────────────────────────────┘
```

### Philosophie de gouvernance

**Modèle fermé et contrôlé** :
- Le système démarre vide (aucun compte)
- Un processus de bootstrap crée le premier ADMIN
- Le bootstrap se verrouille automatiquement après exécution
- L'ADMIN devient le seul créateur de comptes
- Aucune auto-inscription jamais possible

**Garantie d'intégrité** :
- Traçabilité totale de tous les comptes
- Aucun compte orphelin
- Aucune élévation de privilège sauvage
- Audit complet du qui-crée-qui

---

## 1️⃣ BOOTSTRAP INITIAL (BASE VIDE)

### État initial du système

**Base de données** : MongoDB vide
- Collection `personnes` : n'existe pas ou est vide
- Aucun compte ADMIN
- Aucun compte utilisateur
- Système non opérationnel

**Objectif du bootstrap** :
Créer le premier compte ADMIN de manière sécurisée, traçable et non répétable.

---

### Comparaison des approches

#### Option A : Script MongoDB direct

**Description** :
```javascript
// script_premier_admin.js
use CRV;
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('MotDePasseSecurise2026!', 10);

db.personnes.insertOne({
  nom: "Admin",
  prenom: "Système",
  email: "admin@crv-system.local",
  fonction: "ADMIN",
  motDePasse: hash,
  actif: true,
  dateCreation: new Date(),
  creeParBootstrap: true
});

print("✅ Premier ADMIN créé avec succès");
```

**Exécution** :
```bash
mongosh --file script_premier_admin.js
```

**Avantages** :
- ✅ Simple et direct
- ✅ Pas de code applicatif
- ✅ Exécution manuelle = contrôle humain
- ✅ Traçable (flag `creeParBootstrap: true`)
- ✅ Pas de backdoor dans le code applicatif

**Inconvénients** :
- ❌ Nécessite accès MongoDB direct
- ❌ Pas de validation métier automatique
- ❌ Risque d'erreur manuelle (typo email, hash faible)
- ❌ Pas de vérification "déjà exécuté"

**Risques** :
- Script rejoué = duplication potentielle
- Hash faible si erreur humaine
- Email invalide non détecté

---

#### Option B : Variable d'environnement + endpoint unique

**Description** :
```
# .env
BOOTSTRAP_ADMIN_EMAIL=admin@crv-system.local
BOOTSTRAP_ADMIN_PASSWORD=MotDePasseSecurise2026!
BOOTSTRAP_ENABLED=true
```

Route backend :
```
POST /api/auth/bootstrap-admin
Headers: X-Bootstrap-Secret: [SECRET_FROM_ENV]
```

Le backend :
1. Vérifie `BOOTSTRAP_ENABLED === 'true'`
2. Vérifie le secret header
3. Vérifie qu'aucun ADMIN n'existe
4. Crée le premier ADMIN
5. Met `BOOTSTRAP_ENABLED = false` automatiquement (ou flag DB)

**Avantages** :
- ✅ Validation métier automatique
- ✅ Vérification "déjà exécuté" intégrée
- ✅ Hash bcrypt garanti conforme
- ✅ Pas d'accès MongoDB requis
- ✅ Peut être documenté/scripté

**Inconvénients** :
- ❌ Backdoor temporaire dans le code
- ❌ Variable d'env sensible (.env exposé)
- ❌ Endpoint doit être retiré en prod ou sécurisé
- ❌ Complexité accrue

**Risques** :
- Si `BOOTSTRAP_ENABLED` reste `true` en prod = faille
- Secret faible = compromission
- Endpoint oublié = surface d'attaque

---

#### Option C : Route conditionnelle auto-activée

**Description** :
```
POST /api/auth/inscription-premier-admin
```

Le backend :
1. Compte les documents dans `personnes` avec `fonction: 'ADMIN'`
2. Si `count === 0` → autorise création
3. Si `count > 0` → refuse avec `403 Forbidden`

Pas de variable d'environnement.
Pas de secret.
Juste une vérification en base.

**Avantages** :
- ✅ Simple et élégant
- ✅ Auto-désactivation garantie (dès qu'un ADMIN existe)
- ✅ Pas de variable d'env sensible
- ✅ Pas de script externe
- ✅ Validation métier intégrée

**Inconvénients** :
- ❌ Endpoint permanent dans le code (même si désactivé)
- ❌ Première requête = course condition possible (si 2 appels simultanés)
- ❌ Exposition publique de l'endpoint

**Risques** :
- Race condition théorique (résolu par index unique sur email)
- Endpoint visible dans la documentation API
- Doit être bien documenté comme "usage unique"

---

#### Option D : Script de déploiement intégré (seed script)

**Description** :
Script npm exécuté une fois lors du déploiement initial :
```bash
npm run seed:first-admin
```

Le script :
1. Se connecte à MongoDB
2. Vérifie qu'aucun ADMIN n'existe
3. Demande interactivement email + mot de passe (ou lit depuis .env sécurisé)
4. Crée le premier ADMIN
5. Log l'action dans une collection `bootstrap_logs`

**Avantages** :
- ✅ Processus contrôlé et documenté
- ✅ Validation métier (dans le script)
- ✅ Pas d'endpoint public
- ✅ Peut demander confirmation interactive
- ✅ Traçabilité dans `bootstrap_logs`

**Inconvénients** :
- ❌ Nécessite accès serveur backend
- ❌ Dépend de npm/node
- ❌ Complexité du script

**Risques** :
- Script oublié après déploiement
- Pas de protection contre rejeu (doit vérifier)

---

### ✅ DÉCISION : Option C (Route conditionnelle) + Sécurisation

**Choix retenu** : **Option C — Route conditionnelle auto-activée**

**Justification** :

1. **Simplicité opérationnelle** :
   - Aucun accès MongoDB direct requis
   - Aucun script externe à maintenir
   - Aucune variable d'environnement sensible

2. **Sécurité** :
   - Auto-désactivation garantie (impossible de créer un 2e ADMIN par cette route)
   - Validation métier intégrée (email unique, mot de passe fort)
   - Pas de backdoor permanent (route devient 403 après usage)

3. **Auditabilité** :
   - Route clairement identifiée : `POST /api/auth/bootstrap-admin`
   - Log automatique de création
   - Flag `creeParBootstrap: true` dans le document

4. **Robustesse** :
   - Race condition impossible grâce à index unique sur `email`
   - Vérification atomique en base de données
   - Pas de dépendance externe

**Pourquoi les autres options sont rejetées** :

- **Option A (Script Mongo)** : Trop manuel, risque d'erreur humaine, nécessite accès DB
- **Option B (Variable d'env)** : Backdoor temporaire, risque si `BOOTSTRAP_ENABLED` oublié à `true`
- **Option D (Seed script)** : Complexité inutile, nécessite accès serveur backend

---

### Implémentation technique de l'Option C

#### Endpoint : `POST /api/auth/bootstrap-admin`

**URL** : `/api/auth/bootstrap-admin`
**Méthode** : `POST`
**Auth requise** : ❌ Non (route publique MAIS auto-désactivante)

**Body** :
```json
{
  "nom": "Admin",
  "prenom": "Système",
  "email": "admin@crv-system.local",
  "motDePasse": "MotDePasseSecurise2026!"
}
```

**Logique backend** :

```
1. Vérifier que l'email est unique (index MongoDB)
2. Compter les ADMIN existants : db.personnes.countDocuments({ fonction: 'ADMIN' })
3. SI count > 0 :
   → Retourner 403 Forbidden avec message :
     "Bootstrap déjà effectué. Le premier ADMIN existe déjà."
4. SI count === 0 :
   → Valider le mot de passe (longueur, complexité)
   → Hasher le mot de passe avec bcrypt (salt rounds = 10)
   → Créer le document personne :
     {
       nom,
       prenom,
       email,
       fonction: "ADMIN",
       motDePasse: hash,
       actif: true,
       dateCreation: new Date(),
       creeParBootstrap: true,
       creeParAdmin: null
     }
   → Insérer dans la collection personnes
   → Logger l'action dans bootstrap_logs
   → Retourner 201 Created avec token JWT
```

**Réponses** :

**Succès (201)** :
```json
{
  "success": true,
  "message": "Premier ADMIN créé avec succès. Bootstrap terminé.",
  "token": "eyJhbGciOiJIUzI1...",
  "utilisateur": {
    "id": "...",
    "email": "admin@crv-system.local",
    "fonction": "ADMIN",
    "creeParBootstrap": true
  }
}
```

**Échec - Bootstrap déjà effectué (403)** :
```json
{
  "success": false,
  "message": "Bootstrap déjà effectué. Le premier ADMIN existe déjà.",
  "code": "BOOTSTRAP_ALREADY_DONE"
}
```

**Échec - Email déjà utilisé (400)** :
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

**Échec - Mot de passe faible (400)** :
```json
{
  "success": false,
  "message": "Le mot de passe ne respecte pas les critères de sécurité",
  "code": "WEAK_PASSWORD"
}
```

---

#### Traçabilité du bootstrap

**Collection `bootstrap_logs`** :
```json
{
  "_id": ObjectId("..."),
  "action": "PREMIER_ADMIN_CREE",
  "adminEmail": "admin@crv-system.local",
  "adminId": ObjectId("..."),
  "dateExecution": ISODate("2026-01-05T16:00:00Z"),
  "ipSource": "192.168.1.100",
  "userAgent": "PostmanRuntime/7.32.0",
  "methode": "ROUTE_CONDITIONNELLE",
  "version": "1.0.0"
}
```

**Collection `personnes`** (premier ADMIN) :
```json
{
  "_id": ObjectId("..."),
  "nom": "Admin",
  "prenom": "Système",
  "email": "admin@crv-system.local",
  "fonction": "ADMIN",
  "motDePasse": "$2a$10$...",
  "actif": true,
  "dateCreation": ISODate("2026-01-05T16:00:00Z"),
  "creeParBootstrap": true,
  "creeParAdmin": null
}
```

**Flag distinctif** :
- `creeParBootstrap: true` → Créé par bootstrap initial
- `creeParAdmin: null` → Aucun admin créateur (c'est le premier)

Tous les autres comptes auront :
- `creeParBootstrap: false`
- `creeParAdmin: ObjectId("...")` → ID de l'ADMIN créateur

---

### Sécurisation de la route bootstrap

#### Protection contre les abus

1. **Rate limiting strict** :
   - Maximum 3 tentatives par IP par heure
   - Blocage IP après 5 échecs (temporaire 24h)

2. **Logging agressif** :
   - Toute tentative (réussie ou échouée) loggée
   - IP source + User-Agent + timestamp
   - Alerte email si tentative après bootstrap réussi

3. **Index unique MongoDB** :
   - Index unique sur `email` → empêche duplication
   - Garantie atomicité même en race condition

4. **Documentation claire** :
   - Route marquée comme "BOOTSTRAP UNIQUEMENT"
   - Documentation explicite sur usage unique
   - Procédure de vérification post-bootstrap

---

### Procédure de bootstrap (déploiement initial)

**Étape 1 : Déploiement du backend**
```bash
# Déployer le code sur le serveur
git pull origin master
npm install
npm run build
```

**Étape 2 : Démarrage du backend**
```bash
npm run dev
# ou
npm start
```

**Étape 3 : Vérification pré-bootstrap**
```bash
# Vérifier qu'aucun ADMIN n'existe
mongosh CRV --eval "db.personnes.countDocuments({ fonction: 'ADMIN' })"
# Résultat attendu : 0
```

**Étape 4 : Exécution du bootstrap**
```bash
# Via curl
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Admin",
    "prenom": "Système",
    "email": "admin@crv-system.local",
    "motDePasse": "MotDePasseSecurise2026!"
  }'
```

Ou via Postman :
- URL : `POST http://localhost:5000/api/auth/bootstrap-admin`
- Body : JSON avec nom, prenom, email, motDePasse

**Étape 5 : Vérification post-bootstrap**
```bash
# Vérifier qu'un ADMIN existe
mongosh CRV --eval "db.personnes.countDocuments({ fonction: 'ADMIN' })"
# Résultat attendu : 1

# Vérifier le log de bootstrap
mongosh CRV --eval "db.bootstrap_logs.find().pretty()"
```

**Étape 6 : Test de verrouillage**
```bash
# Tenter de créer un 2e ADMIN via bootstrap
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Hacker",
    "prenom": "Test",
    "email": "hacker@test.com",
    "motDePasse": "Test1234!"
  }'

# Résultat attendu : 403 Forbidden "Bootstrap déjà effectué"
```

**Étape 7 : Connexion avec le compte ADMIN**
```bash
curl -X POST http://localhost:5000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crv-system.local",
    "motDePasse": "MotDePasseSecurise2026!"
  }'

# Résultat attendu : 200 OK avec token JWT
```

**✅ Bootstrap terminé et système verrouillé**

---

## 2️⃣ VERROUILLAGE DÉFINITIF DE L'INSCRIPTION

### État après bootstrap

**Système opérationnel** :
- ✅ Un compte ADMIN existe
- ✅ Route bootstrap auto-désactivée (retourne 403)
- ✅ Aucune autre route d'inscription publique

**Routes d'inscription publique** :
```
❌ POST /api/auth/inscription → N'EXISTE PAS
❌ POST /api/auth/register → N'EXISTE PAS
❌ POST /api/auth/signup → N'EXISTE PAS
```

**Principe absolu** :
```
┌─────────────────────────────────────────────────────────┐
│  AUCUNE ROUTE PUBLIQUE DE CRÉATION DE COMPTE           │
│                                                          │
│  ✅ Route bootstrap : auto-désactivée après 1er ADMIN  │
│  ❌ Route inscription : n'existe pas                   │
│  👤 Création de comptes : ADMIN uniquement            │
└─────────────────────────────────────────────────────────┘
```

---

### Mécanisme de verrouillage

#### Vérification de la route bootstrap

**Logique** :
```
FUNCTION bootstrap_admin(req, res):
  1. compterAdmins = db.personnes.countDocuments({ fonction: 'ADMIN' })
  2. IF compterAdmins > 0:
       RETURN 403 {
         "success": false,
         "message": "Bootstrap déjà effectué",
         "code": "BOOTSTRAP_ALREADY_DONE"
       }
  3. ELSE:
       // Créer le premier ADMIN
       ...
```

**Garantie** :
- Vérification à **chaque appel**
- Pas de variable d'état en mémoire (vérifie toujours la DB)
- Atomicité garantie par MongoDB

---

#### Absence de routes publiques

**Routes existantes (après bootstrap)** :

| Route | Méthode | Auth requise | Description |
|-------|---------|--------------|-------------|
| `/api/auth/connexion` | POST | ❌ Non | Connexion (tous rôles) |
| `/api/auth/bootstrap-admin` | POST | ❌ Non | Bootstrap (auto-désactivé) |
| `/api/auth/deconnexion` | POST | ✅ Oui | Déconnexion |
| `/api/auth/changer-mot-de-passe` | POST | ✅ Oui | Changer son propre MDP |
| `/api/personnes` (POST) | POST | ✅ Oui (ADMIN) | Créer un compte (ADMIN uniquement) |

**Routes qui N'EXISTENT PAS** :
- ❌ `/api/auth/inscription`
- ❌ `/api/auth/register`
- ❌ `/api/auth/signup`
- ❌ `/api/auth/create-account`

**Vérification** :
```bash
# Tenter de s'inscrire (doit échouer)
curl -X POST http://localhost:5000/api/auth/inscription
# Résultat attendu : 404 Not Found

curl -X POST http://localhost:5000/api/auth/register
# Résultat attendu : 404 Not Found
```

---

### Audit du verrouillage

**Checklist de vérification** :

- [ ] Bootstrap exécuté et réussi (1 ADMIN existe)
- [ ] Route bootstrap retourne 403 si appelée à nouveau
- [ ] Aucune route `/inscription` n'existe
- [ ] Aucune route `/register` n'existe
- [ ] Aucune route `/signup` n'existe
- [ ] Création de compte uniquement via route protégée ADMIN

**Commandes de vérification** :
```bash
# 1. Compter les ADMIN
mongosh CRV --eval "db.personnes.countDocuments({ fonction: 'ADMIN' })"
# Attendu : >= 1

# 2. Vérifier les logs de bootstrap
mongosh CRV --eval "db.bootstrap_logs.countDocuments({})"
# Attendu : 1

# 3. Tester la route bootstrap (doit être verrouillée)
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"Test","email":"test@test.com","motDePasse":"Test1234!"}'
# Attendu : 403 Forbidden

# 4. Tester l'absence de route inscription
curl -X POST http://localhost:5000/api/auth/inscription
# Attendu : 404 Not Found
```

---

## 3️⃣ CRÉATION DE COMPTES PAR ADMIN

### Principe de gouvernance

**Acteur unique** : ADMIN (et uniquement ADMIN)

**Processus** :
```
ADMIN connecté → Crée un compte → Choisit le rôle → Compte créé et actif
```

**Traçabilité** :
Chaque compte créé contient :
- `creeParAdmin: ObjectId(...)` → ID de l'ADMIN créateur
- `dateCreation: ISODate(...)` → Horodatage précis
- `fonction: "ROLE"` → Rôle assigné par l'ADMIN

---

### Route de création de compte

#### Endpoint : `POST /api/personnes`

**URL** : `/api/personnes`
**Méthode** : `POST`
**Auth requise** : ✅ Oui (JWT token + fonction ADMIN)
**Middleware** : `protect + authorize('ADMIN')`

**Headers** :
```
Authorization: Bearer eyJhbGciOiJIUzI1...
Content-Type: application/json
```

**Body** :
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@company.com",
  "fonction": "AGENT_ESCALE",
  "motDePasse": "MotDePasseInitial2026!"
}
```

**Validation** :

1. **Champs obligatoires** :
   - `nom` (string, 2-50 caractères)
   - `prenom` (string, 2-50 caractères)
   - `email` (string, format email valide, unique)
   - `fonction` (enum: AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN)
   - `motDePasse` (string, min 8 caractères, complexité requise)

2. **Règles métier** :
   - Email unique (index MongoDB)
   - Mot de passe fort (1 maj + 1 min + 1 chiffre + 1 spécial)
   - Fonction valide (parmi les 6 rôles autorisés)

3. **Traçabilité automatique** :
   - `creeParAdmin: req.user._id` (ID de l'ADMIN connecté)
   - `dateCreation: new Date()`
   - `actif: true` (compte actif par défaut)
   - `doitChangerMotDePasse: true` (forcer changement au 1er login)

**Logique backend** :

```
1. Vérifier authentification (protect middleware)
2. Vérifier autorisation ADMIN (authorize('ADMIN') middleware)
3. Valider les champs du body
4. Vérifier que l'email est unique
5. Hasher le mot de passe (bcrypt, salt rounds = 10)
6. Créer le document personne :
   {
     nom,
     prenom,
     email,
     fonction,
     motDePasse: hash,
     actif: true,
     dateCreation: new Date(),
     creeParBootstrap: false,
     creeParAdmin: req.user._id,
     doitChangerMotDePasse: true
   }
7. Insérer dans la collection personnes
8. Logger l'action dans audit_logs
9. Retourner 201 Created avec les données du compte (sans le mot de passe)
```

**Réponses** :

**Succès (201)** :
```json
{
  "success": true,
  "message": "Compte utilisateur créé avec succès",
  "utilisateur": {
    "id": "...",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@company.com",
    "fonction": "AGENT_ESCALE",
    "actif": true,
    "dateCreation": "2026-01-05T16:30:00Z",
    "creeParAdmin": "..."
  }
}
```

**Échec - Non autorisé (403)** :
```json
{
  "success": false,
  "message": "Accès refusé : seul ADMIN peut créer des comptes",
  "code": "ADMIN_ONLY"
}
```

**Échec - Email déjà utilisé (400)** :
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

**Échec - Rôle invalide (400)** :
```json
{
  "success": false,
  "message": "Fonction invalide. Valeurs autorisées : AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN",
  "code": "INVALID_ROLE"
}
```

---

### Traçabilité de la création

**Collection `personnes`** (exemple de compte créé) :
```json
{
  "_id": ObjectId("67..."),
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@company.com",
  "fonction": "AGENT_ESCALE",
  "motDePasse": "$2a$10$...",
  "actif": true,
  "dateCreation": ISODate("2026-01-05T16:30:00Z"),
  "creeParBootstrap": false,
  "creeParAdmin": ObjectId("66..."),  // ID du premier ADMIN
  "doitChangerMotDePasse": true
}
```

**Collection `audit_logs`** :
```json
{
  "_id": ObjectId("..."),
  "action": "CREATION_COMPTE",
  "adminId": ObjectId("66..."),
  "adminEmail": "admin@crv-system.local",
  "compteCreeName": "Jean Dupont",
  "compteCreeFonction": "AGENT_ESCALE",
  "compteCreeId": ObjectId("67..."),
  "dateAction": ISODate("2026-01-05T16:30:00Z"),
  "ipSource": "192.168.1.105"
}
```

**Requête d'audit** :
```javascript
// Trouver tous les comptes créés par un ADMIN spécifique
db.personnes.find({ creeParAdmin: ObjectId("66...") })

// Trouver tous les comptes créés dans les dernières 24h
db.personnes.find({
  dateCreation: { $gte: new Date(Date.now() - 24*60*60*1000) }
})

// Compter les comptes par rôle
db.personnes.aggregate([
  { $group: { _id: "$fonction", count: { $sum: 1 } } }
])
```

---

### Workflow de création (point de vue ADMIN)

**Étape 1 : ADMIN se connecte**
```bash
curl -X POST http://localhost:5000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crv-system.local",
    "motDePasse": "MotDePasseSecurise2026!"
  }'

# Réponse : { "token": "eyJhbGc..." }
```

**Étape 2 : ADMIN crée un compte utilisateur**
```bash
curl -X POST http://localhost:5000/api/personnes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "nom": "Martin",
    "prenom": "Sophie",
    "email": "sophie.martin@company.com",
    "fonction": "CHEF_EQUIPE",
    "motDePasse": "MotDePasseInitial2026!"
  }'

# Réponse : 201 Created
```

**Étape 3 : Utilisateur reçoit ses identifiants** (communication sécurisée)
```
Email : sophie.martin@company.com
Mot de passe temporaire : MotDePasseInitial2026!

IMPORTANT :
- Vous devrez changer ce mot de passe à la première connexion
- Ne partagez jamais vos identifiants
```

**Étape 4 : Utilisateur se connecte la première fois**
```bash
curl -X POST http://localhost:5000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sophie.martin@company.com",
    "motDePasse": "MotDePasseInitial2026!"
  }'

# Réponse : 200 OK avec flag "doitChangerMotDePasse": true
```

**Étape 5 : Utilisateur change son mot de passe**
```bash
curl -X POST http://localhost:5000/api/auth/changer-mot-de-passe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "ancienMotDePasse": "MotDePasseInitial2026!",
    "nouveauMotDePasse": "MonNouveauMDP2026!"
  }'

# Réponse : 200 OK, doitChangerMotDePasse = false
```

---

### Règles de création de comptes ADMIN

**Question** : Un ADMIN peut-il créer un autre compte ADMIN ?

**Réponse** : **OUI**, mais avec traçabilité stricte.

**Justification** :
- Évolutivité : un seul ADMIN peut être insuffisant (départ, maladie, charge)
- Résilience : éviter le point de défaillance unique
- Séparation des responsabilités : ADMIN technique vs ADMIN métier

**Garde-fous** :

1. **Logging renforcé** :
   - Toute création d'un compte ADMIN est loggée avec priorité HAUTE
   - Alerte email automatique aux autres ADMIN
   - Audit trail complet (qui, quand, IP source)

2. **Traçabilité hiérarchique** :
   - Chaque ADMIN a un `creeParAdmin` (sauf le premier bootstrap)
   - Arbre de création reconstitutable :
     ```
     ADMIN #1 (bootstrap)
       └─ ADMIN #2 (créé par #1)
            └─ ADMIN #3 (créé par #2)
     ```

3. **Limitation recommandée** :
   - Maximum 3-5 ADMIN dans un système de taille moyenne
   - Au-delà → risque de dilution des responsabilités

4. **Révocation en cascade (optionnel)** :
   - Si un ADMIN est désactivé, possibilité de désactiver tous les comptes qu'il a créés
   - **NON implémenté par défaut** (trop risqué)
   - Nécessite validation manuelle ADMIN par ADMIN

**Exemple de création d'un 2e ADMIN** :
```bash
curl -X POST http://localhost:5000/api/personnes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_ADMIN_1]" \
  -d '{
    "nom": "Responsable",
    "prenom": "IT",
    "email": "it.admin@company.com",
    "fonction": "ADMIN",
    "motDePasse": "AdminSecure2026!"
  }'

# Log généré :
# {
#   "action": "CREATION_ADMIN",
#   "adminCreateur": "admin@crv-system.local",
#   "nouvelAdmin": "it.admin@company.com",
#   "dateAction": "2026-01-05T17:00:00Z",
#   "alerte": "PRIORITE_HAUTE"
# }
```

---

## 4️⃣ MODIFICATION DE COMPTES EXISTANTS

### Principes de modification

**Acteur autorisé** : ADMIN uniquement

**Champs modifiables par ADMIN** :
- ✅ `nom`
- ✅ `prenom`
- ✅ `email` (si unique)
- ✅ `fonction` (changement de rôle)
- ✅ `actif` (activation/désactivation)
- ❌ `motDePasse` (uniquement par l'utilisateur lui-même OU workaround P0-2)

**Champs modifiables par l'utilisateur lui-même** :
- ✅ `motDePasse` (via `/api/auth/changer-mot-de-passe`)
- ❌ `fonction` (seul ADMIN peut changer le rôle)
- ❌ `actif` (seul ADMIN peut désactiver)

---

### Route de modification

#### Endpoint : `PATCH /api/personnes/:id`

**URL** : `/api/personnes/:id`
**Méthode** : `PATCH`
**Auth requise** : ✅ Oui (JWT token + fonction ADMIN)
**Middleware** : `protect + authorize('ADMIN')`

**Headers** :
```
Authorization: Bearer eyJhbGciOiJIUzI1...
Content-Type: application/json
```

**Body** (champs optionnels) :
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prenom",
  "email": "nouveau.email@company.com",
  "fonction": "SUPERVISEUR",
  "actif": false
}
```

**Logique backend** :

```
1. Vérifier authentification (protect)
2. Vérifier autorisation ADMIN (authorize('ADMIN'))
3. Récupérer le compte à modifier (par ID)
4. Valider les champs modifiés
5. Si email modifié → vérifier unicité
6. Si fonction modifiée → valider le rôle
7. Mettre à jour le document :
   {
     ...nouveauxChamps,
     modifiePar: req.user._id,
     dateModification: new Date()
   }
8. Logger l'action dans audit_logs
9. Retourner 200 OK avec les données mises à jour
```

**Réponses** :

**Succès (200)** :
```json
{
  "success": true,
  "message": "Compte utilisateur modifié avec succès",
  "utilisateur": {
    "id": "...",
    "nom": "Nouveau Nom",
    "prenom": "Nouveau Prenom",
    "email": "nouveau.email@company.com",
    "fonction": "SUPERVISEUR",
    "actif": false,
    "modifiePar": "...",
    "dateModification": "2026-01-05T17:30:00Z"
  }
}
```

**Échec - Non autorisé (403)** :
```json
{
  "success": false,
  "message": "Accès refusé : seul ADMIN peut modifier des comptes",
  "code": "ADMIN_ONLY"
}
```

---

### Cas particulier : Changement de rôle

**Scénario** : Promouvoir un AGENT_ESCALE en CHEF_EQUIPE

**Requête** :
```bash
curl -X PATCH http://localhost:5000/api/personnes/[ID_USER] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_ADMIN]" \
  -d '{
    "fonction": "CHEF_EQUIPE"
  }'
```

**Traçabilité** :

Collection `audit_logs` :
```json
{
  "_id": ObjectId("..."),
  "action": "CHANGEMENT_ROLE",
  "adminId": ObjectId("..."),
  "utilisateurModifie": ObjectId("..."),
  "ancienRole": "AGENT_ESCALE",
  "nouveauRole": "CHEF_EQUIPE",
  "dateAction": ISODate("2026-01-05T17:30:00Z"),
  "raison": "Promotion suite à formation"
}
```

**Impact métier** :
- Permissions changent immédiatement
- Token JWT actuel reste valide jusqu'à expiration (ou déconnexion forcée)
- Prochaine connexion → nouveau token avec nouveau rôle

---

### Cas particulier : Réinitialisation du mot de passe

**Scénario** : Utilisateur a oublié son mot de passe

**Processus** : Voir P0-2 (WORKAROUND_MDP_OUBLIE.md)

**ADMIN ne peut PAS** :
- ❌ Changer directement le mot de passe via `/api/personnes/:id`
- ❌ Voir le mot de passe hashé

**ADMIN PEUT** :
- ✅ Suivre la procédure P0-2 (MongoDB manuel)
- ✅ Générer un mot de passe temporaire
- ✅ Forcer `doitChangerMotDePasse: true`

**Justification** :
- Séparation des responsabilités
- ADMIN ne doit jamais connaître les mots de passe utilisateurs
- Procédure P0-2 = traçabilité + validation hiérarchique

---

## 5️⃣ DÉSACTIVATION ET SUPPRESSION

### Désactivation de compte (soft delete)

**Principe** : Désactiver un compte sans le supprimer

**Acteur autorisé** : ADMIN uniquement

**Route** : `PATCH /api/personnes/:id`

**Body** :
```json
{
  "actif": false,
  "raisonDesactivation": "Départ de l'employé"
}
```

**Effet** :
- Utilisateur ne peut plus se connecter
- Données historiques préservées (CRV créés, phases démarrées, etc.)
- Compte réactivable si besoin

**Logique backend** :

```
1. Vérifier autorisation ADMIN
2. Récupérer le compte
3. Mettre à jour :
   {
     actif: false,
     dateDesactivation: new Date(),
     desactivePar: req.user._id,
     raisonDesactivation: "..."
   }
4. Logger l'action
5. Déconnecter l'utilisateur (invalider tokens actifs)
```

**Traçabilité** :

Collection `personnes` :
```json
{
  "_id": ObjectId("..."),
  "nom": "Dupont",
  "email": "jean.dupont@company.com",
  "fonction": "AGENT_ESCALE",
  "actif": false,
  "dateDesactivation": ISODate("2026-01-05T18:00:00Z"),
  "desactivePar": ObjectId("..."),
  "raisonDesactivation": "Départ de l'employé"
}
```

Collection `audit_logs` :
```json
{
  "action": "DESACTIVATION_COMPTE",
  "adminId": ObjectId("..."),
  "utilisateurDesactive": ObjectId("..."),
  "raison": "Départ de l'employé",
  "dateAction": ISODate("2026-01-05T18:00:00Z")
}
```

---

### Suppression de compte (hard delete)

**Principe** : Supprimer définitivement un compte

**⚠️ DANGER** : Opération irréversible

**Acteur autorisé** : ADMIN uniquement

**Route** : `DELETE /api/personnes/:id`

**Contraintes** :

1. **Vérification de dépendances** :
   - ❌ Impossible si l'utilisateur a créé des CRV
   - ❌ Impossible si l'utilisateur a créé des charges
   - ❌ Impossible si l'utilisateur a démarré des phases
   - ✅ Possible uniquement si compte jamais utilisé

2. **Alternative recommandée** :
   - 👉 Désactivation (soft delete) plutôt que suppression

3. **Cas d'usage légitimes** :
   - Compte créé par erreur (doublon, typo email)
   - Compte de test

**Logique backend** :

```
1. Vérifier autorisation ADMIN
2. Récupérer le compte
3. Vérifier les dépendances :
   - CRV créés ?
   - Phases modifiées ?
   - Charges ajoutées ?
4. SI dépendances existent :
     RETURN 400 Bad Request {
       "message": "Impossible de supprimer : compte utilisé. Utilisez la désactivation.",
       "code": "ACCOUNT_IN_USE"
     }
5. SINON :
     - Logger l'action AVANT suppression
     - Supprimer le document de la collection personnes
     - RETURN 200 OK
```

**Traçabilité** :

Collection `audit_logs` (avant suppression) :
```json
{
  "action": "SUPPRESSION_COMPTE",
  "adminId": ObjectId("..."),
  "utilisateurSupprime": {
    "id": ObjectId("..."),
    "nom": "Dupont",
    "email": "jean.dupont@company.com",
    "fonction": "AGENT_ESCALE",
    "dateCreation": "2026-01-05T16:30:00Z"
  },
  "raison": "Compte créé par erreur (doublon)",
  "dateAction": ISODate("2026-01-05T18:30:00Z")
}
```

**Réponse en cas de dépendances** :
```json
{
  "success": false,
  "message": "Impossible de supprimer ce compte : il a créé 15 CRV",
  "code": "ACCOUNT_IN_USE",
  "details": {
    "crvCrees": 15,
    "chargesAjoutees": 42,
    "phasesDemarrees": 8
  },
  "recommendation": "Utilisez la désactivation (actif: false) plutôt que la suppression"
}
```

---

### Réactivation de compte

**Principe** : Réactiver un compte désactivé

**Acteur autorisé** : ADMIN uniquement

**Route** : `PATCH /api/personnes/:id`

**Body** :
```json
{
  "actif": true,
  "raisonReactivation": "Retour de congé"
}
```

**Logique backend** :

```
1. Vérifier autorisation ADMIN
2. Récupérer le compte (même si actif: false)
3. Vérifier que le compte était désactivé
4. Mettre à jour :
   {
     actif: true,
     dateReactivation: new Date(),
     reactivePar: req.user._id,
     raisonReactivation: "..."
   }
5. Logger l'action
6. Retourner 200 OK
```

**Traçabilité** :

Collection `audit_logs` :
```json
{
  "action": "REACTIVATION_COMPTE",
  "adminId": ObjectId("..."),
  "utilisateurReactive": ObjectId("..."),
  "raison": "Retour de congé",
  "dateAction": ISODate("2026-01-10T09:00:00Z")
}
```

---

## 6️⃣ CAS LIMITES ET SITUATIONS EXCEPTIONNELLES

### Cas 1 : Tous les ADMIN sont désactivés/supprimés

**Scénario** :
- ADMIN #1 (bootstrap) désactivé
- ADMIN #2 (créé par #1) désactivé
- Aucun ADMIN actif dans le système

**Problème** :
- ❌ Impossible de créer de nouveaux comptes
- ❌ Impossible de modifier des comptes existants
- ❌ Impossible de réactiver un ADMIN (car pas d'ADMIN actif)

**Solution de récupération** :

#### Option 1 : Script MongoDB d'urgence

```javascript
// script_reactivation_admin_urgence.js
use CRV;

// Trouver le premier ADMIN créé par bootstrap
const premierAdmin = db.personnes.findOne({
  fonction: 'ADMIN',
  creeParBootstrap: true
});

if (!premierAdmin) {
  print("❌ ERREUR : Aucun ADMIN bootstrap trouvé");
  quit(1);
}

// Réactiver le premier ADMIN
db.personnes.updateOne(
  { _id: premierAdmin._id },
  {
    $set: {
      actif: true,
      dateReactivation: new Date(),
      reactivePar: "SCRIPT_URGENCE",
      raisonReactivation: "Récupération système - Tous ADMIN désactivés"
    }
  }
);

// Logger l'action
db.audit_logs.insertOne({
  action: "REACTIVATION_ADMIN_URGENCE",
  adminReactive: premierAdmin._id,
  methode: "SCRIPT_MONGO",
  dateAction: new Date(),
  gravite: "CRITIQUE"
});

print("✅ ADMIN bootstrap réactivé avec succès");
print("Email:", premierAdmin.email);
```

**Exécution** :
```bash
mongosh --file script_reactivation_admin_urgence.js
```

---

#### Option 2 : Variable d'environnement d'urgence

**Mécanisme** :
```
# .env
EMERGENCY_ADMIN_REACTIVATION=true
EMERGENCY_ADMIN_EMAIL=admin@crv-system.local
EMERGENCY_ADMIN_SECRET=SecretUrgence2026!
```

**Route d'urgence** :
```
POST /api/auth/emergency-reactivate-admin
Headers: X-Emergency-Secret: [EMERGENCY_ADMIN_SECRET]
Body: { "email": "[EMERGENCY_ADMIN_EMAIL]" }
```

**Logique** :
```
1. Vérifier EMERGENCY_ADMIN_REACTIVATION === 'true'
2. Vérifier le secret header
3. Trouver l'ADMIN par email
4. Réactiver l'ADMIN
5. Logger l'action avec gravité CRITIQUE
6. Retourner 200 OK
```

**⚠️ Attention** :
- Route à implémenter UNIQUEMENT si risque avéré
- Variable d'env à désactiver après usage
- Logging agressif

---

#### Recommandation : Option 1 (Script MongoDB)

**Justification** :
- ✅ Pas de backdoor dans le code applicatif
- ✅ Contrôle humain total
- ✅ Traçabilité complète
- ✅ Pas de risque de variable d'env oubliée

**Procédure recommandée** :
1. Accès MongoDB direct (mongosh ou Compass)
2. Exécution du script de réactivation
3. Vérification de la réactivation
4. Connexion avec le compte ADMIN réactivé
5. Création/réactivation d'autres ADMIN si nécessaire

---

### Cas 2 : Compte ADMIN bootstrap supprimé par erreur

**Scénario** :
- ADMIN #1 (bootstrap, `creeParBootstrap: true`) supprimé
- D'autres ADMIN existent (créés par #1)

**Impact** :
- ✅ Système opérationnel (autres ADMIN actifs)
- ⚠️ Traçabilité cassée (perte de la racine de l'arbre)
- ⚠️ Audit incomplet

**Solution** :
- Accepter la perte (si d'autres ADMIN existent)
- Documenter l'incident dans `audit_logs`
- Désigner un nouvel ADMIN de référence

**Prévention** :
- ❌ Bloquer la suppression du premier ADMIN bootstrap
- ✅ Validation double pour suppression d'ADMIN
- ✅ Backup régulier de la collection `personnes`

**Implémentation de la prévention** :

```
FUNCTION supprimerPersonne(id):
  1. Récupérer le compte
  2. SI compte.fonction === 'ADMIN' ET compte.creeParBootstrap === true :
       RETURN 403 {
         "message": "Impossible de supprimer le premier ADMIN bootstrap",
         "code": "BOOTSTRAP_ADMIN_UNDELETABLE"
       }
  3. SINON :
       // Procédure normale de suppression
```

---

### Cas 3 : Race condition sur bootstrap

**Scénario** :
- 2 requêtes `POST /api/auth/bootstrap-admin` simultanées
- Aucun ADMIN n'existe encore
- Les 2 requêtes passent la vérification `count === 0`

**Problème théorique** :
- Création de 2 ADMIN bootstrap ?

**Protection** :

#### 1. Index unique sur email (MongoDB)
```javascript
db.personnes.createIndex({ email: 1 }, { unique: true })
```

**Effet** :
- La 2e requête échoue avec erreur `E11000 duplicate key error`
- Même si les 2 requêtes passent la vérification `count === 0`, une seule insertion réussit

#### 2. Transaction MongoDB (si disponible)
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  const count = await Personne.countDocuments({ fonction: 'ADMIN' }).session(session);
  if (count > 0) {
    throw new Error('Bootstrap déjà effectué');
  }

  await Personne.create([nouveauAdmin], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Effet** :
- Isolation transactionnelle
- Une seule transaction commit réussit

#### 3. Lock applicatif (en mémoire)
```javascript
let bootstrapInProgress = false;

export const bootstrapAdmin = async (req, res) => {
  if (bootstrapInProgress) {
    return res.status(409).json({
      success: false,
      message: 'Bootstrap déjà en cours',
      code: 'BOOTSTRAP_IN_PROGRESS'
    });
  }

  bootstrapInProgress = true;

  try {
    // Logique de bootstrap
    ...
  } finally {
    bootstrapInProgress = false;
  }
};
```

**Effet** :
- Sérialisation des requêtes
- Une seule requête traitée à la fois

**Recommandation** : Combiner les 3 protections

---

### Cas 4 : Oubli du mot de passe du dernier ADMIN actif

**Scénario** :
- Un seul ADMIN actif
- Cet ADMIN oublie son mot de passe
- Aucun autre ADMIN pour appliquer P0-2

**Solution** :

#### Procédure P0-2 adaptée (sans validation hiérarchique)

**Étapes** :
1. Accès MongoDB direct
2. Réinitialisation du mot de passe (script MongoDB)
3. Forcer `doitChangerMotDePasse: true`
4. Traçabilité maximale dans `mdp_reinitialisations`

**Script MongoDB** :
```javascript
// Générer hash bcrypt (depuis Node.js)
const bcrypt = require('bcryptjs');
const motDePasseTemporaire = 'TempADMIN20260105X9K2';
const hash = bcrypt.hashSync(motDePasseTemporaire, 10);
console.log(hash);

// Dans mongosh
use CRV;

db.personnes.updateOne(
  { email: "admin@crv-system.local", fonction: "ADMIN" },
  {
    $set: {
      motDePasse: "[HASH_BCRYPT]",
      doitChangerMotDePasse: true,
      dernierChangementMDP: new Date(),
      modifiePar: "SCRIPT_URGENCE_ADMIN_OUBLIE",
      raisonModification: "Récupération MDP ADMIN - Aucun autre ADMIN disponible"
    }
  }
);

db.mdp_reinitialisations.insertOne({
  ticketSupport: "URGENCE-ADMIN-2026-001",
  utilisateurEmail: "admin@crv-system.local",
  fonction: "ADMIN",
  demandeLe: new Date(),
  validePar: "DIRECTION",
  preuveIdentite: "Validation CTO + DG",
  resetEffectuePar: "DBA",
  resetEffectueLe: new Date(),
  canalCommunication: "Remise en main propre",
  statut: "EN_ATTENTE",
  remarques: "Cas exceptionnel : dernier ADMIN actif, MDP oublié",
  gravite: "CRITIQUE"
});
```

**Validation requise** :
- ✅ CTO + Direction générale
- ✅ Preuve d'identité renforcée
- ✅ Traçabilité maximale

---

### Cas 5 : Base de données corrompue (perte de la collection personnes)

**Scénario catastrophique** :
- Collection `personnes` supprimée/corrompue
- Tous les comptes perdus
- Système inopérable

**Solution de récupération** :

#### 1. Restauration depuis backup
```bash
# Restaurer la collection personnes depuis backup
mongorestore --db CRV --collection personnes /path/to/backup/personnes.bson
```

#### 2. Si aucun backup : Réinitialisation complète

**Conséquence** :
- ❌ Perte de tous les comptes
- ❌ Traçabilité cassée
- ✅ Système redémarre vide

**Procédure** :
1. Re-exécuter le bootstrap (route redevient active car `count === 0`)
2. Recréer tous les comptes manuellement via ADMIN
3. Documenter l'incident

**Prévention absolue** :
- ✅ Backup quotidien automatique
- ✅ Réplication MongoDB (replica set)
- ✅ Point de restauration (PITR)

---

## 7️⃣ MATRICE DE PERMISSIONS

### Tableau récapitulatif des opérations

| Opération | ADMIN | MANAGER | SUPERVISEUR | CHEF | AGENT | QUALITE |
|-----------|-------|---------|-------------|------|-------|---------|
| **Gestion des comptes** |
| Créer un compte | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier un compte (autre) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier son propre compte | ⚠️¹ | ⚠️¹ | ⚠️¹ | ⚠️¹ | ⚠️¹ | ⚠️¹ |
| Changer son mot de passe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Désactiver un compte | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer un compte | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Réactiver un compte | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Changer le rôle d'un utilisateur | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lire la liste des comptes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Authentification** |
| Se connecter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Se déconnecter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bootstrap (1er ADMIN) | ✅² | ❌ | ❌ | ❌ | ❌ | ❌ |

**Légendes** :
- ¹ Uniquement mot de passe (pas nom, email, fonction)
- ² Une seule fois, auto-désactivation après

---

### Matrice détaillée par route

| Route | Méthode | ADMIN | Autres rôles | Public |
|-------|---------|-------|--------------|--------|
| `/api/auth/connexion` | POST | ✅ | ✅ | ✅ |
| `/api/auth/deconnexion` | POST | ✅ | ✅ | ❌ |
| `/api/auth/bootstrap-admin` | POST | ✅³ | ❌ | ✅³ |
| `/api/auth/changer-mot-de-passe` | POST | ✅ | ✅ | ❌ |
| `/api/personnes` (création) | POST | ✅ | ❌ | ❌ |
| `/api/personnes` (liste) | GET | ✅ | ❌ | ❌ |
| `/api/personnes/:id` (lecture) | GET | ✅ | ❌⁴ | ❌ |
| `/api/personnes/:id` (modification) | PATCH | ✅ | ❌ | ❌ |
| `/api/personnes/:id` (suppression) | DELETE | ✅ | ❌ | ❌ |

**Légendes** :
- ³ Auto-désactivation après premier ADMIN créé
- ⁴ Utilisateur peut lire son propre profil uniquement

---

### Routes qui N'EXISTENT PAS (par design)

| Route (inexistante) | Raison |
|---------------------|--------|
| `/api/auth/inscription` | Inscription publique interdite |
| `/api/auth/register` | Inscription publique interdite |
| `/api/auth/signup` | Inscription publique interdite |
| `/api/auth/create-account` | Inscription publique interdite |
| `/api/admin/promote-user` | Changement de rôle via PATCH /personnes/:id |
| `/api/auth/forgot-password` | Workaround P0-2 (manuel) |
| `/api/auth/reset-password` | Workaround P0-2 (manuel) |

---

## 8️⃣ GARANTIES SÉCURITÉ ET AUDIT

### Garantie 1 : Aucune création sauvage de compte

**Mécanisme** :
- ✅ Aucune route publique d'inscription (sauf bootstrap auto-désactivant)
- ✅ Toute création de compte nécessite authentification ADMIN
- ✅ Middleware `authorize('ADMIN')` sur `/api/personnes` (POST)

**Vérification** :
```bash
# Tenter de créer un compte sans authentification
curl -X POST http://localhost:5000/api/personnes \
  -H "Content-Type: application/json" \
  -d '{"nom":"Hacker","email":"hack@test.com","fonction":"ADMIN","motDePasse":"Test123!"}'

# Résultat attendu : 401 Unauthorized
```

**Audit** :
- Log de toute tentative d'accès non autorisé
- Alerte si > 5 tentatives/heure depuis une même IP

---

### Garantie 2 : Gouvernance totale par ADMIN

**Mécanisme** :
- ✅ Seul ADMIN peut créer, modifier, désactiver, supprimer des comptes
- ✅ Aucun utilisateur ne peut s'auto-promouvoir
- ✅ Aucun utilisateur ne peut modifier son propre rôle

**Vérification** :
```bash
# AGENT tente de modifier sa fonction
curl -X PATCH http://localhost:5000/api/personnes/[ID_AGENT] \
  -H "Authorization: Bearer [TOKEN_AGENT]" \
  -H "Content-Type: application/json" \
  -d '{"fonction":"MANAGER"}'

# Résultat attendu : 403 Forbidden
```

**Audit** :
- Log de toutes les modifications de compte (qui, quand, quoi)
- Traçabilité du créateur (`creeParAdmin`) pour chaque compte

---

### Garantie 3 : Auditabilité complète

**Mécanisme** :
- ✅ Collection `audit_logs` pour toutes les actions sensibles
- ✅ Flag `creeParBootstrap` / `creeParAdmin` dans chaque compte
- ✅ Horodatage précis de toutes les opérations
- ✅ IP source loggée

**Collections d'audit** :

1. **`bootstrap_logs`** :
   - Création du premier ADMIN
   - Date, IP, méthode

2. **`audit_logs`** :
   - Création de compte
   - Modification de compte
   - Changement de rôle
   - Désactivation/réactivation
   - Suppression
   - Réinitialisation MDP

3. **`mdp_reinitialisations`** :
   - Toutes les réinitialisations de mot de passe (P0-2)
   - Validation hiérarchique
   - Traçabilité complète

**Requêtes d'audit** :
```javascript
// Tous les comptes créés dans les 30 derniers jours
db.audit_logs.find({
  action: "CREATION_COMPTE",
  dateAction: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
})

// Tous les changements de rôle
db.audit_logs.find({ action: "CHANGEMENT_ROLE" })

// Toutes les actions d'un ADMIN spécifique
db.audit_logs.find({ adminId: ObjectId("...") })
```

---

### Garantie 4 : Compatibilité exploitation aérienne

**Exigences sectorielles** :
- ✅ Traçabilité totale (qui a fait quoi, quand)
- ✅ Gouvernance stricte (pas d'auto-enregistrement)
- ✅ Séparation des responsabilités (ADMIN ≠ opérationnel)
- ✅ Résilience (récupération en cas de perte ADMIN)
- ✅ Conformité RGPD (conservation limitée, droit à l'oubli)

**Alignement** :
| Exigence | Mécanisme CRV |
|----------|---------------|
| Traçabilité | audit_logs + flags creeParAdmin |
| Gouvernance | ADMIN seul créateur de comptes |
| Séparation | ADMIN ne fait pas d'opérations CRV |
| Résilience | Script de réactivation ADMIN, backup |
| RGPD | Soft delete (désactivation), export données |

---

### Garantie 5 : Robustesse long terme

**Évolutivité** :
- ✅ Plusieurs ADMIN possibles (pas de SPOF)
- ✅ Arbre de création reconstitutable
- ✅ Pas de limite technique sur nombre de comptes

**Maintenabilité** :
- ✅ Logique backend centralisée (pas de dispersion)
- ✅ Routes clairement identifiées
- ✅ Documentation complète

**Sécurité** :
- ✅ Aucun backdoor permanent
- ✅ Bootstrap auto-désactivant
- ✅ Protection race conditions (index unique + transactions)

**Réversibilité** :
- ✅ Soft delete (désactivation) plutôt que hard delete
- ✅ Réactivation possible
- ✅ Backup régulier

---

## RÉFÉRENCES TECHNIQUES

### Endpoints backend

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/api/auth/bootstrap-admin` | POST | Public (auto-désactivant) | Créer 1er ADMIN |
| `/api/auth/connexion` | POST | Public | Connexion |
| `/api/auth/deconnexion` | POST | Authentifié | Déconnexion |
| `/api/auth/changer-mot-de-passe` | POST | Authentifié | Changer son MDP |
| `/api/personnes` | POST | ADMIN | Créer un compte |
| `/api/personnes` | GET | ADMIN | Lister les comptes |
| `/api/personnes/:id` | GET | ADMIN (ou self) | Lire un compte |
| `/api/personnes/:id` | PATCH | ADMIN | Modifier un compte |
| `/api/personnes/:id` | DELETE | ADMIN | Supprimer un compte |

---

### Modèle de données (collection personnes)

```javascript
{
  _id: ObjectId,
  nom: String,                    // Requis
  prenom: String,                 // Requis
  email: String,                  // Requis, unique
  fonction: String,               // Enum: AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN
  motDePasse: String,             // Hash bcrypt
  actif: Boolean,                 // true/false
  dateCreation: Date,             // Horodatage création
  creeParBootstrap: Boolean,      // true si 1er ADMIN, false sinon
  creeParAdmin: ObjectId,         // ID de l'ADMIN créateur (null pour bootstrap)
  doitChangerMotDePasse: Boolean, // true au premier login
  dateDesactivation: Date,        // Si désactivé
  desactivePar: ObjectId,         // ADMIN qui a désactivé
  raisonDesactivation: String,    // Motif
  dateModification: Date,         // Dernière modification
  modifiePar: ObjectId,           // ADMIN qui a modifié
  dernierChangementMDP: Date,     // Horodatage dernier changement MDP
  derniereConnexion: Date         // Horodatage dernière connexion
}
```

**Index** :
```javascript
db.personnes.createIndex({ email: 1 }, { unique: true })
db.personnes.createIndex({ fonction: 1 })
db.personnes.createIndex({ actif: 1 })
db.personnes.createIndex({ creeParAdmin: 1 })
```

---

### Middlewares

**protect** : Vérification authentification JWT
```javascript
export const protect = async (req, res, next) => {
  // Vérifier token JWT
  // Décoder et valider
  // Attacher req.user
  // next()
}
```

**authorize(...roles)** : Vérification rôle
```javascript
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.fonction)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
};
```

**excludeQualite** : Bloquer QUALITE (P0-1)
```javascript
export const excludeQualite = (req, res, next) => {
  if (req.user.fonction === 'QUALITE') {
    return res.status(403).json({ message: 'QUALITE lecture seule' });
  }
  next();
};
```

---

### Scripts de maintenance

**1. Vérifier l'état du bootstrap**
```javascript
// verifier_bootstrap.js
use CRV;
const count = db.personnes.countDocuments({ fonction: 'ADMIN', creeParBootstrap: true });
print(count === 1 ? "✅ Bootstrap OK" : "❌ Bootstrap anormal");
```

**2. Lister tous les ADMIN**
```javascript
// lister_admins.js
use CRV;
db.personnes.find({ fonction: 'ADMIN' }, { nom: 1, prenom: 1, email: 1, actif: 1, creeParBootstrap: 1 }).pretty();
```

**3. Audit des comptes créés par un ADMIN**
```javascript
// audit_comptes_par_admin.js
const adminId = ObjectId("...");
const comptes = db.personnes.find({ creeParAdmin: adminId });
print(`Comptes créés par cet ADMIN : ${comptes.count()}`);
comptes.forEach(c => print(`- ${c.nom} ${c.prenom} (${c.fonction})`));
```

---

## CONCLUSION

### Récapitulatif de la gouvernance

```
┌────────────────────────────────────────────────────────────┐
│  GOUVERNANCE COMPTES UTILISATEURS — PROCESSUS COMPLET      │
└────────────────────────────────────────────────────────────┘

1️⃣ ÉTAT INITIAL
   Base vide → Aucun compte

2️⃣ BOOTSTRAP
   POST /api/auth/bootstrap-admin (public, auto-désactivant)
   → Création du 1er ADMIN
   → Flag creeParBootstrap: true

3️⃣ VERROUILLAGE
   Bootstrap auto-désactivé (count > 0)
   → Aucune inscription publique possible

4️⃣ GOUVERNANCE
   ADMIN crée tous les comptes via POST /api/personnes
   → Traçabilité : creeParAdmin = ObjectId(ADMIN)
   → Rôles assignés par ADMIN
   → Aucun auto-enregistrement

5️⃣ CYCLE DE VIE
   ADMIN modifie/désactive/réactive/supprime
   → Audit complet dans audit_logs
   → Soft delete préféré (actif: false)

6️⃣ CAS LIMITES
   Perte ADMIN → Script MongoDB de récupération
   MDP oublié → Workaround P0-2
   Corruption DB → Backup + restauration

7️⃣ GARANTIES
   ✅ Zéro création sauvage
   ✅ Gouvernance totale ADMIN
   ✅ Auditabilité complète
   ✅ Conformité aéronautique
   ✅ Robustesse long terme
```

---

### Validation finale

**Checklist de conformité** :

- [x] Une seule inscription possible (bootstrap)
- [x] Bootstrap auto-désactivant après 1er ADMIN
- [x] Aucune route publique d'inscription permanente
- [x] Tous les comptes créés par ADMIN uniquement
- [x] Traçabilité complète (creeParAdmin, audit_logs)
- [x] Soft delete (désactivation) plutôt que suppression
- [x] Protection race conditions (index unique)
- [x] Scripts de récupération documentés
- [x] Conformité RGPD (conservation limitée)
- [x] Documentation complète et auditable

**Statut** : ✅ VALIDÉ

---

**Document contrôlé** — Version 1.0.0 — 2026-01-05
**Classification** : RÉFÉRENTIEL OFFICIEL
**Validité** : Production
**Révision** : Annuelle ou après incident sécurité
