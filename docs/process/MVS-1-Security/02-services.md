# MVS-1-Security - SERVICES

## Date d'audit : 2026-01-10

---

## CONSTAT

Le MVS-1-Security ne dispose PAS de services dedies dans `src/services/security/`.

Les logiques metier sont directement implementees dans les controllers :
- `auth.controller.js` : Logique d'authentification
- `personne.controller.js` : Logique CRUD utilisateurs

### Fonctions metier identifiees dans les controllers

---

## 1. Fonctions d'authentification (auth.controller.js)

### generateToken(personne)
- **Signature** : `(personne) -> String`
- **Parametres** :
  - `personne` : Document Mongoose Personne
- **Logique** :
  1. Creation payload JWT avec : id, nom, email, role (fonction)
  2. Signature avec jwtSecret depuis config
  3. Expiration : 3h
- **Retour** : Token JWT signe
- **Modeles utilises** : Aucun (utilise donnees passees)
- **Ecritures en base** : Aucune
- **Effets de bord** : Aucun

### login(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres req.body** :
  - `email` : String (requis)
  - `password` ou `motDePasse` : String (requis)
- **Logique** :
  1. Validation presence email et password
  2. Recherche Personne par email avec password (select: +password)
  3. Verification existence utilisateur
  4. Comparaison password via personne.comparePassword()
  5. Verification statut === 'ACTIF'
  6. Generation token
  7. Retour token + user data
- **Verifications** :
  - Email et password fournis (400)
  - Utilisateur existe (401)
  - Password correct (401)
  - Compte actif (403)
- **Codes HTTP** :
  - 200 : Succes
  - 400 : Donnees manquantes
  - 401 : Identifiants invalides
  - 403 : Compte inactif
- **Modeles utilises** : Personne
- **Ecritures en base** : Aucune

### register(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres req.body** :
  - `nom` : String (requis)
  - `prenom` : String (requis)
  - `matricule` : String (requis)
  - `email` : String (requis)
  - `password` ou `motDePasse` : String (requis)
  - `fonction` : String (requis)
  - `specialites` : [String] (optionnel)
- **Logique** :
  1. Verification unicite email/matricule
  2. Creation Personne
  3. Generation token
  4. Retour token + user data
- **Verifications** :
  - Email/matricule non existant (400)
- **Codes HTTP** :
  - 201 : Creation reussie
  - 400 : Email ou matricule duplique
- **Modeles utilises** : Personne
- **Ecritures en base** : Creation Personne

### getMe(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres** : req.user._id (injecte par middleware protect)
- **Logique** :
  1. Recherche Personne par ID utilisateur connecte
  2. Retour donnees utilisateur
- **Codes HTTP** :
  - 200 : Succes
- **Modeles utilises** : Personne
- **Ecritures en base** : Aucune

### changerMotDePasse(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres req.body** :
  - `ancienMotDePasse` : String (requis)
  - `nouveauMotDePasse` : String (requis, min 6 car)
- **Logique** :
  1. Validation parametres
  2. Recherche Personne avec password
  3. Verification ancien mot de passe
  4. Mise a jour password
  5. Log console changement
- **Verifications** :
  - Parametres fournis (400)
  - Nouveau password >= 6 car (400)
  - Utilisateur existe (404)
  - Ancien password correct (401)
- **Codes HTTP** :
  - 200 : Succes
  - 400 : Parametres invalides
  - 401 : Ancien mot de passe incorrect
  - 404 : Utilisateur non trouve
- **Modeles utilises** : Personne
- **Ecritures en base** : Update Personne.password

---

## 2. Fonctions CRUD utilisateurs (personne.controller.js)

### getAllPersonnes(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres req.query** :
  - `page` : Number (default: 1)
  - `limit` : Number (default: 50)
  - `fonction` : String (optionnel)
  - `statut` : String (optionnel)
  - `search` : String (optionnel)
- **Logique** :
  1. Construction query avec filtres
  2. Pagination (skip/limit)
  3. Recherche multi-champs si search
  4. Retour liste + pagination
- **Modeles utilises** : Personne
- **Ecritures en base** : Aucune

### getPersonneById(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres** : req.params.id
- **Logique** :
  1. Recherche par ID
  2. Verification existence
  3. Retour donnees
- **Codes HTTP** :
  - 200 : Succes
  - 404 : Non trouve
- **Modeles utilises** : Personne
- **Ecritures en base** : Aucune

### createPersonne(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres req.body** :
  - `nom`, `prenom`, `email`, `fonction` : requis
  - `matricule` : optionnel (auto-genere si absent)
  - `password`/`motDePasse` : requis
  - `specialites`, `telephone`, `dateEmbauche` : optionnels
- **Logique** :
  1. Generation matricule si absent
  2. Verification unicite matricule
  3. Verification unicite email/matricule
  4. Creation Personne
  5. Retour donnees sans password
- **Codes HTTP** :
  - 201 : Creation reussie
  - 400 : Email ou matricule duplique
- **Modeles utilises** : Personne
- **Ecritures en base** : Creation Personne

### updatePersonne(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres** :
  - req.params.id
  - req.body : champs a modifier
- **Logique** :
  1. Recherche Personne
  2. Mise a jour champs fournis
  3. Sauvegarde
  4. Retour donnees sans password
- **Codes HTTP** :
  - 200 : Succes
  - 404 : Non trouve
- **Modeles utilises** : Personne
- **Ecritures en base** : Update Personne

### deletePersonne(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Parametres** : req.params.id
- **Logique** :
  1. Recherche Personne
  2. Verification pas auto-suppression
  3. Suppression
- **Verifications** :
  - Utilisateur existe (404)
  - Pas son propre compte (400)
- **Codes HTTP** :
  - 200 : Succes
  - 400 : Auto-suppression refusee
  - 404 : Non trouve
- **Modeles utilises** : Personne
- **Ecritures en base** : Delete Personne

### getPersonnesStats(req, res, next)
- **Signature** : `async (req, res, next) -> Response`
- **Logique** :
  1. Count total
  2. Aggregation par fonction
  3. Aggregation par statut
  4. Retour statistiques
- **Modeles utilises** : Personne
- **Ecritures en base** : Aucune

---

## ZONES A RISQUE

1. **Absence de service dedie** : La logique metier est dans les controllers, ce qui rend le code moins testable et reutilisable.

2. **Gestion password dans controller** : Le hashage est gere par le hook du modele, mais la logique de changement est dans le controller.

3. **Pas de gestion de sessions** : Le logout est gere cote client uniquement.

---

## CAS NON COUVERTS

1. Pas de fonctionnalite "mot de passe oublie"
2. Pas de verification email
3. Pas de blocage apres N tentatives echouees
4. Pas de refresh token
5. Pas de revocation de token
