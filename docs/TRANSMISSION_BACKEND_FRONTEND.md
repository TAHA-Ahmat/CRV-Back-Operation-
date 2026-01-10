# 🔗 TRANSMISSION BACKEND → FRONTEND

**Version**: 1.0.0
**Date**: 2026-01-05
**Type**: CONTRAT D'INTERFACE
**Classification**: Documentation technique obligatoire

---

## 📋 TABLE DES MATIÈRES

1. [Philosophie générale](#1️⃣-philosophie-générale-à-respecter-par-le-frontend)
2. [Parcours authentification](#2️⃣-parcours-authentification-frontend-autorisé)
3. [Gestion des rôles et permissions](#3️⃣-gestion-des-rôles-et-permissions)
4. [Routes API disponibles](#4️⃣-routes-api-disponibles)
5. [Messages d'erreur](#5️⃣-messages-derreur-à-afficher)
6. [États UI interdits](#6️⃣-états-ui-interdits-ce-qui-ne-doit-jamais-apparaître)
7. [Workflow création de compte](#7️⃣-workflow-création-de-compte-admin-uniquement)
8. [Workflow modification de compte](#8️⃣-workflow-modification-de-compte)
9. [Gestion du token JWT](#9️⃣-gestion-du-token-jwt)
10. [Cas limites et erreurs](#🔟-cas-limites-et-erreurs-à-gérer)

---

## ⚠️ RÈGLE ABSOLUE POUR LE FRONTEND

```
┌─────────────────────────────────────────────────────────────┐
│  LE BACKEND EST LA SOURCE DE VÉRITÉ UNIQUE                  │
│                                                               │
│  ❌ Le frontend ne DÉCIDE RIEN                              │
│  ❌ Le frontend ne CONTOURNE RIEN                           │
│  ❌ Le frontend ne PROPOSE RIEN de non-autorisé            │
│                                                               │
│  ✅ Le frontend AFFICHE ce que le backend autorise         │
│  ✅ Le frontend CACHE ce que le backend refuse             │
│  ✅ Le frontend APPELLE les endpoints existants uniquement │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ PHILOSOPHIE GÉNÉRALE À RESPECTER PAR LE FRONTEND

### Principe fondamental : Système fermé

**Le système CRV est un système FERMÉ** :
- ❌ Aucune inscription publique
- ❌ Aucune création de compte par l'utilisateur
- ❌ Aucun choix de rôle par l'utilisateur
- ✅ Tous les comptes sont créés par ADMIN
- ✅ Tous les rôles sont assignés par ADMIN

**Conséquence pour le frontend** :
```
┌─────────────────────────────────────────────────────────┐
│  NE JAMAIS afficher :                                   │
│  ❌ Bouton "S'inscrire"                                │
│  ❌ Formulaire d'inscription                           │
│  ❌ Lien "Créer un compte"                             │
│  ❌ Choix de rôle à la création                        │
│  ❌ "Mot de passe oublié ?" (sauf mention spéciale)   │
└─────────────────────────────────────────────────────────┘
```

---

### Le backend décide, le frontend affiche

**Règle de conception** :

1. **Le frontend demande** : "Puis-je faire X ?"
2. **Le backend répond** :
   - ✅ `200 OK` → Le frontend affiche le résultat
   - ❌ `403 Forbidden` → Le frontend cache l'action ou affiche un message d'erreur
   - ❌ `401 Unauthorized` → Le frontend redirige vers login

**Exemples concrets** :

| Question frontend | Réponse backend | Action frontend |
|-------------------|-----------------|-----------------|
| "Puis-je créer un CRV ?" | 403 (si QUALITE) | Cacher le bouton "Créer CRV" |
| "Puis-je créer un compte ?" | 403 (si pas ADMIN) | Cacher la section "Gestion utilisateurs" |
| "Puis-je lire les CRV ?" | 200 (tous rôles) | Afficher la liste des CRV |

**❌ Mauvaise pratique (côté frontend)** :
```javascript
// ❌ NE PAS FAIRE : Décision frontend
if (user.role === 'QUALITE') {
  showCreateButton = false;
}
```

**✅ Bonne pratique (côté frontend)** :
```javascript
// ✅ FAIRE : Tentative backend, réaction frontend
try {
  await api.post('/api/crv', data);
  // Afficher succès
} catch (error) {
  if (error.status === 403) {
    // Afficher message d'erreur ou cacher le bouton après échec
  }
}
```

**OU mieux** (si le backend expose un endpoint de permissions) :
```javascript
// ✅ MEILLEUR : Demander au backend les permissions
const permissions = await api.get('/api/auth/mes-permissions');
if (permissions.peutCreerCRV) {
  showCreateButton = true;
}
```

> **Note** : L'endpoint `/api/auth/mes-permissions` n'existe PAS actuellement dans le backend.
> Si le frontend a besoin de cette fonctionnalité, il doit la demander explicitement au backend.
> Actuellement, le frontend doit tenter l'action et gérer l'erreur 403.

---

### Afficher uniquement ce qui est autorisé

**Principe** : Si une action retourne `403 Forbidden`, elle ne doit JAMAIS être visible/accessible dans l'UI.

**Méthode** :

1. **Au chargement de la page** :
   - Récupérer le profil utilisateur : `GET /api/auth/profil` (à implémenter ou utiliser le token JWT décodé)
   - Déduire les permissions selon le rôle

2. **Masquage conditionnel** :
   ```javascript
   // Exemple : Bouton "Créer un compte"
   if (user.fonction === 'ADMIN') {
     // Afficher le bouton
   } else {
     // NE PAS afficher le bouton
   }
   ```

3. **Validation backend TOUJOURS** :
   - Même si le frontend cache un bouton, TOUJOURS appeler le backend
   - Le backend rejette si non autorisé
   - Protection contre manipulation client-side

---

### Le backend ne change pas, le frontend s'adapte

**Règle** : Si le backend refuse une action, le frontend ne doit PAS :
- ❌ Demander au backend de changer
- ❌ Contourner la restriction
- ❌ Afficher l'action quand même

**Le frontend DOIT** :
- ✅ Cacher l'action non autorisée
- ✅ Afficher un message clair si tentative
- ✅ Rediriger vers une page autorisée

---

## 2️⃣ PARCOURS AUTHENTIFICATION (FRONTEND AUTORISÉ)

### Ce qui EXISTE dans le backend

#### A. Connexion (login)

**Endpoint** : `POST /api/auth/connexion`

**UI à créer** : Page de connexion classique

**Formulaire** :
- Champ : Email (obligatoire)
- Champ : Mot de passe (obligatoire)
- Bouton : "Se connecter"

**Requête** :
```http
POST /api/auth/connexion
Content-Type: application/json

{
  "email": "utilisateur@example.com",
  "motDePasse": "MotDePasse123!"
}
```

**Réponses possibles** :

**Succès (200 OK)** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "utilisateur": {
    "id": "...",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "fonction": "AGENT_ESCALE"
  }
}
```

**Action frontend** :
1. Stocker le token JWT (localStorage ou sessionStorage)
2. Stocker les infos utilisateur
3. Rediriger vers le dashboard

**Si `doitChangerMotDePasse: true`** (inclus dans la réponse) :
- Rediriger IMMÉDIATEMENT vers la page de changement de mot de passe
- Bloquer l'accès au reste de l'application tant que le MDP n'est pas changé

**Échec - Identifiants invalides (401 Unauthorized)** :
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect"
}
```

**Action frontend** :
- Afficher message d'erreur : "Email ou mot de passe incorrect"
- Ne PAS préciser lequel est incorrect (sécurité)

**Échec - Compte désactivé (403 Forbidden)** :
```json
{
  "success": false,
  "message": "Votre compte a été désactivé. Contactez l'administrateur.",
  "code": "ACCOUNT_DISABLED"
}
```

**Action frontend** :
- Afficher message d'erreur complet
- Afficher contact support : "Contactez support-crv@example.com"

---

#### B. Déconnexion (logout)

**Endpoint** : `POST /api/auth/deconnexion`

**UI à créer** : Bouton "Se déconnecter" (dans header/menu)

**Requête** :
```http
POST /api/auth/deconnexion
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Réponse** :
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Action frontend** :
1. Supprimer le token JWT du storage
2. Supprimer les infos utilisateur
3. Rediriger vers la page de connexion

---

#### C. Changement de mot de passe

**Endpoint** : `POST /api/auth/changer-mot-de-passe`

**UI à créer** : Page/modal "Changer mon mot de passe"

**Formulaire** :
- Champ : Ancien mot de passe (obligatoire, type password)
- Champ : Nouveau mot de passe (obligatoire, type password)
- Champ : Confirmer nouveau mot de passe (obligatoire, type password, validation frontend)
- Bouton : "Changer le mot de passe"

**Validation frontend (avant envoi)** :
- Nouveau MDP ≠ Ancien MDP
- Nouveau MDP = Confirmation
- Nouveau MDP respecte les critères (afficher les règles) :
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial (!@#$%^&*)

**Requête** :
```http
POST /api/auth/changer-mot-de-passe
Authorization: Bearer eyJhbGciOiJIUzI1...
Content-Type: application/json

{
  "ancienMotDePasse": "AncienMDP123!",
  "nouveauMotDePasse": "NouveauMDP456!"
}
```

**Réponses** :

**Succès (200 OK)** :
```json
{
  "success": true,
  "message": "Mot de passe changé avec succès"
}
```

**Action frontend** :
- Afficher message de succès
- Si `doitChangerMotDePasse` était `true` → débloquer l'accès à l'application
- Rediriger vers le dashboard

**Échec - Ancien MDP incorrect (400 Bad Request)** :
```json
{
  "success": false,
  "message": "L'ancien mot de passe est incorrect"
}
```

**Action frontend** :
- Afficher erreur sur le champ "Ancien mot de passe"

**Échec - Nouveau MDP faible (400 Bad Request)** :
```json
{
  "success": false,
  "message": "Le nouveau mot de passe ne respecte pas les critères de sécurité",
  "details": ["Doit contenir au moins une majuscule", "Doit contenir au moins un chiffre"]
}
```

**Action frontend** :
- Afficher les erreurs sous le champ "Nouveau mot de passe"

---

#### D. Gestion du token JWT

**Format du token** : JWT (JSON Web Token)

**Contenu du token (après décodage)** :
```json
{
  "id": "67...",
  "email": "jean.dupont@example.com",
  "fonction": "AGENT_ESCALE",
  "iat": 1704470400,
  "exp": 1704556800
}
```

**Stockage** :
- **Option 1** : `localStorage.setItem('token', token)` (persiste après fermeture navigateur)
- **Option 2** : `sessionStorage.setItem('token', token)` (perdu après fermeture navigateur)

**Recommandation** : `localStorage` pour meilleure UX (pas besoin de se reconnecter constamment)

**Utilisation** :
```javascript
// Dans chaque requête API
const token = localStorage.getItem('token');
fetch('/api/crv', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Expiration** :
- Le token JWT a une durée de vie (exp)
- Quand expiré → backend retourne `401 Unauthorized`
- Frontend DOIT détecter cette erreur et rediriger vers login

**Gestion de l'expiration** :
```javascript
// Intercepteur global (Axios exemple)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### Ce qui N'EXISTE PAS dans le backend

#### ❌ Inscription publique

**Ce qui N'EXISTE PAS** :
- ❌ Endpoint `POST /api/auth/inscription`
- ❌ Endpoint `POST /api/auth/register`
- ❌ Endpoint `POST /api/auth/signup`

**Conséquence frontend** :
- ❌ Aucune page d'inscription
- ❌ Aucun bouton "S'inscrire"
- ❌ Aucun lien "Créer un compte"
- ❌ Aucun formulaire de choix de rôle

**Message à afficher** (si quelqu'un cherche l'inscription) :
> "Les comptes utilisateurs sont créés uniquement par les administrateurs.
> Contactez votre responsable pour obtenir un accès."

---

#### ❌ Mot de passe oublié automatique

**Ce qui N'EXISTE PAS** :
- ❌ Endpoint `POST /api/auth/mot-de-passe-oublie`
- ❌ Endpoint `POST /api/auth/forgot-password`
- ❌ Endpoint `POST /api/auth/reset-password`
- ❌ Système d'envoi d'email automatique

**Ce qui EXISTE** :
- ✅ Procédure manuelle (workaround P0-2)
- ✅ Document `WORKAROUND_MDP_OUBLIE.md`

**UI à créer** :

Sur la page de connexion, afficher un texte (PAS un bouton cliquable) :

```
┌────────────────────────────────────────────────┐
│  Mot de passe oublié ?                        │
│                                                │
│  Contactez le support à :                     │
│  support-crv@example.com                      │
│  ou appelez le : +XXX XXX XXX XXX             │
│                                                │
│  Un administrateur vous aidera à              │
│  réinitialiser votre mot de passe.            │
└────────────────────────────────────────────────┘
```

**❌ NE PAS créer** :
- Un formulaire "Entrez votre email pour réinitialiser"
- Un lien "Réinitialiser mon mot de passe"
- Un workflow frontend de reset

**Justification** :
Le système utilise une procédure manuelle sécurisée avec validation hiérarchique (voir P0-2).
Le frontend ne doit PAS simuler un workflow automatique qui n'existe pas.

---

#### ❌ Bootstrap ADMIN (utilisateur lambda)

**Ce qui EXISTE** :
- ✅ Endpoint `POST /api/auth/bootstrap-admin`

**MAIS** :
- ⚠️ Cet endpoint est AUTO-DÉSACTIVANT
- ⚠️ Il retourne `403 Forbidden` dès qu'un ADMIN existe
- ⚠️ Il est destiné au déploiement initial UNIQUEMENT

**Conséquence frontend** :
- ❌ Aucune page "Créer le premier administrateur"
- ❌ Aucun lien public vers cet endpoint
- ❌ Aucun formulaire accessible aux utilisateurs

**Exception** (deployment/admin tool uniquement) :
Si vous créez un outil d'administration de déploiement (séparé de l'app principale), vous pouvez exposer cet endpoint UNIQUEMENT pour le premier déploiement.

**Sécurisation UI** :
- Page accessible uniquement en mode développement (process.env.NODE_ENV === 'development')
- OU outil séparé (CLI, script admin)
- Jamais dans l'application utilisateur finale

---

## 3️⃣ GESTION DES RÔLES ET PERMISSIONS

### Les 6 rôles existants

**Rôles définis dans le backend** :

| Rôle | Code | Permissions métier CRV | Permissions admin |
|------|------|------------------------|-------------------|
| Agent d'escale | `AGENT_ESCALE` | ✅ Créer/modifier CRV | ❌ |
| Chef d'équipe | `CHEF_EQUIPE` | ✅ Créer/modifier CRV | ❌ |
| Superviseur | `SUPERVISEUR` | ✅ Créer/modifier CRV + Valider programmes vol + Supprimer CRV (décisions critiques) | ❌ |
| Manager | `MANAGER` | ✅ Créer/modifier CRV + Valider/supprimer programmes vol + Statistiques avancées | ❌ |
| Qualité | `QUALITE` | ✅ Lecture seule (tout voir, rien modifier) | ❌ |
| Administrateur | `ADMIN` | ❌ Aucune opération CRV | ✅ Créer/modifier/supprimer comptes |

**Principe de séparation** :
- ADMIN ne fait PAS d'opérations CRV (pas de création de vol, pas de phases, etc.)
- ADMIN s'occupe UNIQUEMENT de la gestion des comptes utilisateurs
- Les autres rôles font des opérations CRV mais ne gèrent PAS les comptes

---

### Permissions par fonctionnalité

#### A. Gestion des comptes utilisateurs

| Action | ADMIN | Autres rôles |
|--------|-------|--------------|
| Créer un compte | ✅ | ❌ |
| Lire la liste des comptes | ✅ | ❌ |
| Lire un compte (autre que soi) | ✅ | ❌ |
| Modifier un compte (autre) | ✅ | ❌ |
| Changer le rôle d'un utilisateur | ✅ | ❌ |
| Désactiver un compte | ✅ | ❌ |
| Supprimer un compte | ✅ | ❌ |
| Réactiver un compte | ✅ | ❌ |

**Actions autorisées pour TOUS** :
- ✅ Lire son propre profil
- ✅ Changer son propre mot de passe
- ❌ Modifier son propre rôle

---

#### B. Opérations CRV (métier)

| Action | AGENT | CHEF | SUPERVISEUR | MANAGER | QUALITE | ADMIN |
|--------|-------|------|-------------|---------|---------|-------|
| **CRV** |
| Créer CRV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier CRV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lire CRV | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Supprimer CRV | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Ajouter charge | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter événement | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter observation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archiver CRV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Phases** |
| Démarrer phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Terminer phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marquer phase non réalisée | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Vols** |
| Créer vol | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier vol | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lier au programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marquer hors programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Programmes vol** |
| Créer programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Valider programme | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Activer programme | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Suspendre programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Supprimer programme | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Charges détaillées** |
| Modifier catégories passagers | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier classes | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier besoins médicaux | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter marchandise dangereuse | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Avions** |
| Modifier configuration | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Créer version | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Restaurer version | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Statistiques** |
| Lire statistiques | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

**Résumé simplifié** :
- **QUALITE** : Lecture seule sur TOUT le métier CRV, AUCUNE modification
- **ADMIN** : AUCUNE opération métier CRV, UNIQUEMENT gestion des comptes
- **AGENT, CHEF, SUPERVISEUR, MANAGER** : Opérations CRV selon responsabilités

---

### Adaptation de l'UI selon le rôle

**Principe** : L'UI doit s'adapter dynamiquement au rôle de l'utilisateur connecté.

**Méthode** :

1. **Récupérer le rôle** :
```javascript
// Au login
const user = response.data.utilisateur;
localStorage.setItem('user', JSON.stringify(user));

// Dans l'app
const user = JSON.parse(localStorage.getItem('user'));
const role = user.fonction; // "AGENT_ESCALE", "QUALITE", "ADMIN", etc.
```

2. **Masquage conditionnel des menus** :

```javascript
// Exemple React
function Navigation({ user }) {
  return (
    <nav>
      {/* Tout le monde voit les CRV */}
      <Link to="/crv">Comptes Rendus de Vol</Link>

      {/* Seulement les rôles opérationnels (pas QUALITE, pas ADMIN) */}
      {!['QUALITE', 'ADMIN'].includes(user.fonction) && (
        <Link to="/crv/nouveau">Créer un CRV</Link>
      )}

      {/* Seulement ADMIN */}
      {user.fonction === 'ADMIN' && (
        <Link to="/admin/utilisateurs">Gestion Utilisateurs</Link>
      )}

      {/* Seulement SUPERVISEUR et MANAGER */}
      {['SUPERVISEUR', 'MANAGER'].includes(user.fonction) && (
        <Link to="/programmes-vol/validation">Valider Programmes</Link>
      )}
    </nav>
  );
}
```

3. **Masquage conditionnel des boutons** :

```javascript
// Exemple sur une page CRV
function CRVDetail({ crv, user }) {
  return (
    <div>
      <h1>{crv.numeroVol}</h1>

      {/* Bouton modifier : pas pour QUALITE ni ADMIN */}
      {!['QUALITE', 'ADMIN'].includes(user.fonction) && (
        <button onClick={modifierCRV}>Modifier</button>
      )}

      {/* Bouton supprimer : seulement SUPERVISEUR et MANAGER */}
      {['SUPERVISEUR', 'MANAGER'].includes(user.fonction) && (
        <button onClick={supprimerCRV}>Supprimer</button>
      )}
    </div>
  );
}
```

4. **Protection des routes** :

```javascript
// Exemple React Router
function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.fonction)) {
    return <Navigate to="/non-autorise" />;
  }

  return children;
}

// Utilisation
<Route
  path="/admin/utilisateurs"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <GestionUtilisateurs />
    </ProtectedRoute>
  }
/>
```

---

### Messages selon le rôle

**QUALITE tente de créer un CRV** :
```
❌ Action non autorisée
Votre profil QUALITE est en lecture seule.
Vous ne pouvez pas créer ou modifier de données.
```

**AGENT tente d'accéder à la gestion utilisateurs** :
```
❌ Accès refusé
Cette section est réservée aux administrateurs.
```

**ADMIN tente de créer un CRV** :
```
❌ Opération non disponible
Les comptes ADMIN ne peuvent pas effectuer d'opérations CRV.
Utilisez un compte opérationnel (AGENT, CHEF, SUPERVISEUR, MANAGER).
```

---

## 4️⃣ ROUTES API DISPONIBLES

### Routes d'authentification

| Endpoint | Méthode | Auth requise | Rôles autorisés | Description |
|----------|---------|--------------|-----------------|-------------|
| `/api/auth/connexion` | POST | ❌ Non | Public | Se connecter |
| `/api/auth/deconnexion` | POST | ✅ Oui | Tous | Se déconnecter |
| `/api/auth/changer-mot-de-passe` | POST | ✅ Oui | Tous | Changer son MDP |
| `/api/auth/bootstrap-admin` | POST | ❌ Non | Public (auto-désactivant) | Créer 1er ADMIN |

---

### Routes de gestion des comptes (ADMIN uniquement)

| Endpoint | Méthode | Auth requise | Rôles autorisés | Description |
|----------|---------|--------------|-----------------|-------------|
| `/api/personnes` | POST | ✅ Oui | ADMIN | Créer un compte |
| `/api/personnes` | GET | ✅ Oui | ADMIN | Lister les comptes |
| `/api/personnes/:id` | GET | ✅ Oui | ADMIN (ou self) | Lire un compte |
| `/api/personnes/:id` | PATCH | ✅ Oui | ADMIN | Modifier un compte |
| `/api/personnes/:id` | DELETE | ✅ Oui | ADMIN | Supprimer un compte |

**Réponses d'erreur si non-ADMIN tente d'appeler** :
```json
{
  "success": false,
  "message": "Accès refusé : seul ADMIN peut gérer les comptes",
  "code": "ADMIN_ONLY"
}
```

---

### Routes CRV (métier)

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/crv` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Créer CRV |
| `/api/crv` | GET | ✅ | Tous (sauf ADMIN) | Lister CRV |
| `/api/crv/:id` | GET | ✅ | Tous (sauf ADMIN) | Lire CRV |
| `/api/crv/:id` | PATCH | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier CRV |
| `/api/crv/:id/charges` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Ajouter charge |
| `/api/crv/:id/evenements` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Ajouter événement |
| `/api/crv/:id/observations` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Ajouter observation |
| `/api/crv/:id/archive` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Archiver CRV |

**Réponse d'erreur si QUALITE tente de modifier** :
```json
{
  "success": false,
  "message": "Accès refusé: QUALITE est un profil lecture seule uniquement",
  "code": "QUALITE_READ_ONLY"
}
```

---

### Routes Phases

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/phases/:id/demarrer` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Démarrer phase |
| `/api/phases/:id/terminer` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Terminer phase |
| `/api/phases/:id/non-realise` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Marquer non réalisée |
| `/api/phases/:id` | PATCH | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier phase |

---

### Routes Vols

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/vols` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Créer vol |
| `/api/vols` | GET | ✅ | Tous (sauf ADMIN) | Lister vols |
| `/api/vols/:id` | GET | ✅ | Tous (sauf ADMIN) | Lire vol |
| `/api/vols/:id` | PATCH | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier vol |
| `/api/vols/:id/lier-programme` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Lier au programme |
| `/api/vols/:id/marquer-hors-programme` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Marquer hors programme |

---

### Routes Programmes vol

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/programmes-vol` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Créer programme |
| `/api/programmes-vol` | GET | ✅ | Tous (sauf ADMIN) | Lister programmes |
| `/api/programmes-vol/:id` | GET | ✅ | Tous (sauf ADMIN) | Lire programme |
| `/api/programmes-vol/:id` | PATCH | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier programme |
| `/api/programmes-vol/:id/valider` | POST | ✅ | SUPERVISEUR, MANAGER | Valider programme |
| `/api/programmes-vol/:id/activer` | POST | ✅ | SUPERVISEUR, MANAGER | Activer programme |
| `/api/programmes-vol/:id/suspendre` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Suspendre programme |
| `/api/programmes-vol/:id` | DELETE | ✅ | MANAGER | Supprimer programme |

**Réponse d'erreur si AGENT tente de valider** :
```json
{
  "success": false,
  "message": "Accès refusé : action réservée aux SUPERVISEUR et MANAGER",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

---

### Routes Charges détaillées

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/charges/:id/categories-detaillees` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier catégories passagers |
| `/api/charges/:id/classes` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier classes |
| `/api/charges/:id/besoins-medicaux` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier besoins médicaux |
| `/api/charges/:id/fret-detaille` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier fret détaillé |
| `/api/charges/:id/marchandises-dangereuses` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Ajouter DGR |
| `/api/charges/:id/marchandises-dangereuses/:dgr_id` | DELETE | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Retirer DGR |
| `/api/charges/statistiques/passagers` | GET | ✅ | Tous (sauf ADMIN) | Statistiques passagers |
| `/api/charges/statistiques/fret` | GET | ✅ | Tous (sauf ADMIN) | Statistiques fret |

---

### Routes Avions (configuration)

| Endpoint | Méthode | Auth | Rôles autorisés | Description |
|----------|---------|------|-----------------|-------------|
| `/api/avions/:id/configuration` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier configuration |
| `/api/avions/:id/versions` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Créer version |
| `/api/avions/:id/versions` | GET | ✅ | Tous (sauf ADMIN) | Historique versions |
| `/api/avions/:id/versions/:numero` | GET | ✅ | Tous (sauf ADMIN) | Lire version |
| `/api/avions/:id/versions/:numero/restaurer` | POST | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Restaurer version |
| `/api/avions/:id/revision` | PUT | ✅ | AGENT, CHEF, SUPERVISEUR, MANAGER | Modifier révision |
| `/api/avions/statistiques/configurations` | GET | ✅ | Tous (sauf ADMIN) | Statistiques |

---

## 5️⃣ MESSAGES D'ERREUR À AFFICHER

### Erreurs d'authentification

| Code HTTP | Code métier | Message backend | Message à afficher frontend |
|-----------|-------------|-----------------|------------------------------|
| 401 | `INVALID_CREDENTIALS` | "Email ou mot de passe incorrect" | "Identifiants incorrects. Vérifiez votre email et mot de passe." |
| 403 | `ACCOUNT_DISABLED` | "Votre compte a été désactivé" | "Votre compte a été désactivé. Contactez l'administrateur à support-crv@example.com" |
| 401 | `TOKEN_EXPIRED` | "Token expiré" | "Votre session a expiré. Veuillez vous reconnecter." (+ redirection auto vers login) |
| 401 | `TOKEN_INVALID` | "Token invalide" | "Session invalide. Veuillez vous reconnecter." (+ redirection auto vers login) |

---

### Erreurs de permissions

| Code HTTP | Code métier | Contexte | Message à afficher frontend |
|-----------|-------------|----------|------------------------------|
| 403 | `QUALITE_READ_ONLY` | QUALITE tente de modifier | "Votre profil QUALITE est en lecture seule. Vous ne pouvez pas créer ou modifier de données." |
| 403 | `ADMIN_ONLY` | Non-ADMIN tente de gérer comptes | "Accès refusé. Cette action est réservée aux administrateurs." |
| 403 | `INSUFFICIENT_PERMISSIONS` | Rôle insuffisant (ex: AGENT tente de valider) | "Vous n'avez pas les permissions nécessaires pour cette action. Contactez votre superviseur." |
| 403 | `BOOTSTRAP_ALREADY_DONE` | Tentative de 2e bootstrap | "Le système est déjà initialisé. Impossible de créer un nouveau compte administrateur via cette méthode." |

---

### Erreurs de validation

| Code HTTP | Champ concerné | Message à afficher frontend |
|-----------|----------------|------------------------------|
| 400 | `email` | "Cet email est déjà utilisé." |
| 400 | `email` | "Format d'email invalide." |
| 400 | `motDePasse` | "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." |
| 400 | `fonction` | "Rôle invalide. Valeurs autorisées : AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN." |
| 400 | `ancienMotDePasse` | "L'ancien mot de passe est incorrect." |
| 400 | Général | "Données invalides. Vérifiez les champs du formulaire." |

---

### Erreurs métier

| Code HTTP | Code métier | Contexte | Message à afficher frontend |
|-----------|-------------|----------|------------------------------|
| 400 | `ACCOUNT_IN_USE` | Tentative de suppression d'un compte utilisé | "Impossible de supprimer ce compte : il a créé X CRV. Utilisez la désactivation à la place." |
| 400 | `CRV_LOCKED` | Tentative de modification d'un CRV verrouillé | "Ce CRV est verrouillé. Modification impossible." |
| 404 | - | Ressource non trouvée | "Élément introuvable." |
| 409 | - | Conflit (ex: doublon) | "Un élément similaire existe déjà." |
| 500 | - | Erreur serveur | "Une erreur est survenue. Veuillez réessayer plus tard." |

---

### Format des réponses d'erreur backend

**Structure standard** :
```json
{
  "success": false,
  "message": "Message d'erreur lisible",
  "code": "CODE_ERREUR_TECHNIQUE",
  "details": { ... }  // Optionnel
}
```

**Exemple** :
```json
{
  "success": false,
  "message": "Le mot de passe ne respecte pas les critères de sécurité",
  "code": "WEAK_PASSWORD",
  "details": {
    "errors": [
      "Doit contenir au moins une majuscule",
      "Doit contenir au moins un caractère spécial"
    ]
  }
}
```

**Gestion frontend** :
```javascript
try {
  const response = await api.post('/api/auth/changer-mot-de-passe', data);
  // Succès
} catch (error) {
  const errorData = error.response?.data;

  // Message principal
  alert(errorData.message);

  // Détails si disponibles
  if (errorData.details?.errors) {
    errorData.details.errors.forEach(err => {
      console.error(err);
      // Afficher sous le champ concerné
    });
  }
}
```

---

## 6️⃣ ÉTATS UI INTERDITS (CE QUI NE DOIT JAMAIS APPARAÎTRE)

### ❌ Éléments à NE JAMAIS afficher

#### Sur la page de connexion

```
❌ Bouton "S'inscrire"
❌ Lien "Créer un compte"
❌ Formulaire d'inscription (même caché/modal)
❌ Lien cliquable "Mot de passe oublié ?" menant à un formulaire
```

**✅ Ce qui DOIT apparaître** :
```
✅ Formulaire de connexion (email + mot de passe)
✅ Bouton "Se connecter"
✅ Texte informatif : "Mot de passe oublié ? Contactez support-crv@example.com"
```

---

#### Dans le menu/navigation (selon rôle)

**Si QUALITE** :
```
❌ Bouton "Créer un CRV"
❌ Bouton "Modifier"
❌ Bouton "Supprimer"
❌ Formulaires d'édition
❌ Tout bouton d'action qui modifie des données
```

**✅ Ce qui DOIT apparaître pour QUALITE** :
```
✅ Lire les CRV
✅ Voir les statistiques
✅ Exporter les données
✅ Consulter les rapports
```

---

**Si ADMIN** :
```
❌ Menu "Comptes Rendus de Vol"
❌ Menu "Vols"
❌ Menu "Programmes vol"
❌ Menu "Charges"
❌ Toute section métier CRV
```

**✅ Ce qui DOIT apparaître pour ADMIN** :
```
✅ Menu "Gestion Utilisateurs"
✅ Profil personnel
✅ Paramètres système (si applicable)
```

---

**Si AGENT/CHEF** :
```
❌ Bouton "Valider le programme" (réservé SUPERVISEUR/MANAGER)
❌ Bouton "Supprimer le programme" (réservé MANAGER)
❌ Menu "Gestion Utilisateurs" (réservé ADMIN)
```

---

#### Dans les formulaires

**Formulaire de création de compte (si visible pour ADMIN)** :
```
❌ Champ "Choisissez votre rôle" accessible à l'utilisateur final
   (seul ADMIN choisit le rôle)
❌ Option "S'inscrire sans validation"
❌ Bouton "Créer mon compte" (pour un utilisateur lambda)
```

**✅ Ce qui DOIT apparaître (pour ADMIN uniquement)** :
```
✅ Formulaire complet contrôlé par ADMIN
✅ Sélecteur de rôle (dropdown avec les 6 rôles)
✅ Champs : nom, prenom, email, mot de passe initial, fonction
✅ Bouton "Créer le compte utilisateur"
```

---

#### Dans le dashboard/page d'accueil

**Dashboard de QUALITE** :
```
❌ Tuiles/cartes "Créer un CRV"
❌ Raccourcis d'édition
❌ Boutons d'action (sauf export/consultation)
```

**✅ Ce qui DOIT apparaître pour QUALITE** :
```
✅ Statistiques en lecture seule
✅ Derniers CRV (mode consultation)
✅ Graphiques/rapports
✅ Boutons "Voir", "Consulter", "Télécharger"
```

---

**Dashboard de ADMIN** :
```
❌ Tuiles métier CRV (vols, charges, etc.)
```

**✅ Ce qui DOIT apparaître pour ADMIN** :
```
✅ Nombre d'utilisateurs actifs
✅ Derniers comptes créés
✅ Raccourcis vers "Créer un utilisateur", "Gérer les comptes"
```

---

### ❌ Routes/Pages à NE JAMAIS créer

| Route (à ne pas créer) | Raison |
|------------------------|--------|
| `/inscription` | Aucune inscription publique |
| `/register` | Aucune inscription publique |
| `/signup` | Aucune inscription publique |
| `/forgot-password` (avec formulaire) | Pas de reset automatique (P0-2 manuel) |
| `/reset-password` (avec formulaire) | Pas de reset automatique |
| `/admin/crv` | ADMIN ne fait pas d'opérations CRV |
| `/qualite/creer-crv` | QUALITE lecture seule |

---

### ❌ Actions impossibles (à désactiver/cacher)

**QUALITE ne peut PAS** :
- Afficher un bouton "Enregistrer", "Modifier", "Supprimer", "Ajouter"
- Afficher des champs de formulaire éditables (tout doit être en lecture seule ou `disabled`)
- Afficher des modals de création/édition

**ADMIN ne peut PAS** :
- Voir les pages métier CRV
- Accéder aux vols, programmes, charges, etc.
- Créer un CRV (même en tentant d'accéder à l'URL directement → redirection 403)

**AGENT/CHEF ne peuvent PAS** :
- Valider un programme vol (bouton invisible)
- Supprimer un programme vol (bouton invisible)
- Accéder à la gestion des utilisateurs (menu caché)

---

## 7️⃣ WORKFLOW CRÉATION DE COMPTE (ADMIN UNIQUEMENT)

### Page : Gestion des utilisateurs (ADMIN)

**URL** : `/admin/utilisateurs` (ou `/admin/comptes`)

**Accessible uniquement par** : `fonction === 'ADMIN'`

**Composants UI** :

#### A. Liste des utilisateurs

**Tableau des comptes** :

| Nom | Prénom | Email | Fonction | Statut | Actions |
|-----|--------|-------|----------|--------|---------|
| Dupont | Jean | jean.dupont@... | AGENT_ESCALE | ✅ Actif | [Modifier] [Désactiver] |
| Martin | Sophie | sophie.martin@... | CHEF_EQUIPE | ✅ Actif | [Modifier] [Désactiver] |
| Bernard | Luc | luc.bernard@... | QUALITE | ❌ Désactivé | [Réactiver] [Supprimer] |

**Filtres** :
- Fonction (dropdown : Tous, AGENT_ESCALE, CHEF_EQUIPE, etc.)
- Statut (dropdown : Tous, Actif, Désactivé)
- Recherche par nom/email (input text)

**Bouton principal** :
- "+ Créer un utilisateur" (en haut à droite)

---

#### B. Formulaire de création d'utilisateur

**Modal ou page dédiée** : `/admin/utilisateurs/nouveau`

**Champs du formulaire** :

1. **Nom** (obligatoire)
   - Type : text
   - Validation : 2-50 caractères

2. **Prénom** (obligatoire)
   - Type : text
   - Validation : 2-50 caractères

3. **Email** (obligatoire)
   - Type : email
   - Validation : format email valide, unicité (vérification backend)

4. **Fonction** (obligatoire)
   - Type : select/dropdown
   - Options :
     - Agent d'escale (AGENT_ESCALE)
     - Chef d'équipe (CHEF_EQUIPE)
     - Superviseur (SUPERVISEUR)
     - Manager (MANAGER)
     - Qualité (QUALITE)
     - Administrateur (ADMIN)

5. **Mot de passe initial** (obligatoire)
   - Type : password
   - Validation : min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 spécial
   - Indicateur de force du mot de passe (optionnel mais recommandé)
   - Info bulle : "L'utilisateur devra changer ce mot de passe à la première connexion"

**Boutons** :
- "Créer le compte" (primaire)
- "Annuler" (secondaire, ferme le modal/retour liste)

---

**Requête backend** :
```javascript
POST /api/personnes
Headers: {
  Authorization: Bearer [TOKEN_ADMIN]
}
Body: {
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
  fonction: "AGENT_ESCALE",
  motDePasse: "MotDePasseInitial2026!"
}
```

**Gestion du succès** :
```javascript
// Réponse 201 Created
{
  "success": true,
  "message": "Compte utilisateur créé avec succès",
  "utilisateur": { ... }
}

// Actions frontend :
1. Afficher toast/notification : "Compte créé avec succès"
2. Fermer le modal/formulaire
3. Rafraîchir la liste des utilisateurs
4. Afficher modal d'information :
   "Compte créé pour jean.dupont@example.com
    Mot de passe temporaire : MotDePasseInitial2026!

    ⚠️ Communiquez ces identifiants à l'utilisateur par un canal sécurisé.
    L'utilisateur devra changer son mot de passe à la première connexion."
```

**Gestion des erreurs** :
```javascript
// 400 - Email déjà utilisé
if (error.code === 'EMAIL_ALREADY_EXISTS') {
  // Afficher erreur sous le champ email
  setEmailError("Cet email est déjà utilisé");
}

// 400 - Mot de passe faible
if (error.code === 'WEAK_PASSWORD') {
  // Afficher erreur sous le champ mot de passe
  setPasswordError(error.message);
}

// 403 - Non autorisé
if (error.code === 'ADMIN_ONLY') {
  // Rediriger vers page d'accueil avec message
  redirect('/dashboard', { error: "Accès refusé" });
}
```

---

#### C. Communication des identifiants (hors système)

**Important** : Le frontend NE DOIT PAS envoyer automatiquement les identifiants par email.

**Workflow recommandé** :

1. **Après création du compte** :
   - Afficher un modal avec les identifiants en clair
   - Permettre à l'ADMIN de copier les identifiants
   - Avertir : "Ces identifiants ne seront plus affichés. Copiez-les maintenant."

2. **ADMIN communique manuellement** :
   - Email sécurisé
   - Remise en main propre
   - Téléphone
   - SMS sur numéro pro

3. **Le système NE DOIT PAS** :
   - Envoyer automatiquement un email avec le mot de passe en clair
   - Stocker les identifiants en clair après affichage
   - Permettre de récupérer le mot de passe initial après création

**Exemple de modal post-création** :

```
┌──────────────────────────────────────────────────┐
│  ✅ Compte créé avec succès                      │
│                                                   │
│  Email : jean.dupont@example.com                 │
│  Mot de passe temporaire : MotDePasseInitial2026!│
│  [Copier les identifiants]                       │
│                                                   │
│  ⚠️ IMPORTANT :                                  │
│  - Ces identifiants ne seront plus affichés     │
│  - Communiquez-les à l'utilisateur par un       │
│    canal sécurisé (email, tél, main propre)     │
│  - L'utilisateur devra changer son mot de       │
│    passe à la première connexion                 │
│                                                   │
│  [J'ai communiqué les identifiants]             │
└──────────────────────────────────────────────────┘
```

---

## 8️⃣ WORKFLOW MODIFICATION DE COMPTE

### Page : Modifier un utilisateur (ADMIN)

**URL** : `/admin/utilisateurs/:id/modifier`

**Accessible uniquement par** : `fonction === 'ADMIN'`

---

### Formulaire de modification

**Champs modifiables** :

1. **Nom**
   - Pré-rempli avec valeur actuelle
   - Modifiable

2. **Prénom**
   - Pré-rempli avec valeur actuelle
   - Modifiable

3. **Email**
   - Pré-rempli avec valeur actuelle
   - Modifiable
   - Validation : unicité (sauf si inchangé)

4. **Fonction**
   - Pré-sélectionnée avec valeur actuelle
   - Modifiable
   - Dropdown avec les 6 rôles

5. **Statut**
   - Pré-sélectionné : Actif / Désactivé
   - Modifiable

**Champs NON modifiables (affichés en lecture seule)** :
- Date de création
- Créé par (nom de l'ADMIN créateur)
- Dernière connexion
- Dernière modification

**Champ ABSENT** :
- ❌ Mot de passe (ne peut pas être modifié par ADMIN)

---

**Requête backend** :
```javascript
PATCH /api/personnes/:id
Headers: {
  Authorization: Bearer [TOKEN_ADMIN]
}
Body: {
  nom: "Nouveau Nom",
  prenom: "Nouveau Prenom",
  email: "nouveau.email@example.com",
  fonction: "SUPERVISEUR",
  actif: true
}
```

**Réponse succès (200 OK)** :
```json
{
  "success": true,
  "message": "Compte utilisateur modifié avec succès",
  "utilisateur": { ... }
}
```

**Actions frontend** :
1. Afficher toast : "Compte modifié avec succès"
2. Rafraîchir la liste des utilisateurs
3. Fermer le formulaire / retourner à la liste

---

### Cas particulier : Changement de rôle

**Si l'ADMIN change la fonction d'un utilisateur** :

**Modal de confirmation** :
```
┌──────────────────────────────────────────────────┐
│  ⚠️ Confirmer le changement de rôle              │
│                                                   │
│  Utilisateur : Jean Dupont                       │
│  Rôle actuel : AGENT_ESCALE                      │
│  Nouveau rôle : CHEF_EQUIPE                      │
│                                                   │
│  ⚠️ Ce changement prendra effet immédiatement.  │
│  Les permissions de l'utilisateur seront         │
│  mises à jour.                                    │
│                                                   │
│  [Annuler]  [Confirmer le changement]           │
└──────────────────────────────────────────────────┘
```

**Impact** :
- Permissions changent immédiatement côté backend
- Token JWT actuel reste valide (contient ancien rôle)
- Utilisateur doit se reconnecter pour obtenir nouveau token avec nouveau rôle
- OU backend peut invalider le token (déconnexion forcée)

**Recommandation UX** :
- Après changement de rôle par ADMIN, afficher message :
  "Rôle modifié. L'utilisateur devra se reconnecter pour que les nouvelles permissions prennent effet."

---

### Désactivation de compte

**Bouton "Désactiver"** (dans la liste ou le formulaire de modification)

**Modal de confirmation** :
```
┌──────────────────────────────────────────────────┐
│  ⚠️ Désactiver le compte utilisateur ?           │
│                                                   │
│  Utilisateur : Jean Dupont (jean.dupont@...)    │
│  Fonction : AGENT_ESCALE                         │
│                                                   │
│  Conséquences :                                   │
│  ❌ L'utilisateur ne pourra plus se connecter   │
│  ✅ Les données historiques seront préservées   │
│  ✅ Le compte pourra être réactivé              │
│                                                   │
│  Raison (optionnel) :                            │
│  [___________________________________________]   │
│                                                   │
│  [Annuler]  [Désactiver le compte]              │
└──────────────────────────────────────────────────┘
```

**Requête backend** :
```javascript
PATCH /api/personnes/:id
Body: {
  actif: false,
  raisonDesactivation: "Départ de l'employé"
}
```

**Actions frontend** :
1. Fermer le modal
2. Afficher toast : "Compte désactivé"
3. Rafraîchir la liste (compte apparaît avec badge "Désactivé")

---

### Réactivation de compte

**Bouton "Réactiver"** (visible uniquement si `actif: false`)

**Modal de confirmation** :
```
┌──────────────────────────────────────────────────┐
│  ✅ Réactiver le compte utilisateur ?            │
│                                                   │
│  Utilisateur : Jean Dupont (jean.dupont@...)    │
│  Désactivé le : 2025-12-20                       │
│  Raison : Départ de l'employé                    │
│                                                   │
│  Raison de réactivation (optionnel) :           │
│  [___________________________________________]   │
│                                                   │
│  [Annuler]  [Réactiver le compte]               │
└──────────────────────────────────────────────────┘
```

**Requête backend** :
```javascript
PATCH /api/personnes/:id
Body: {
  actif: true,
  raisonReactivation: "Retour de congé"
}
```

---

### Suppression de compte

**Bouton "Supprimer"** (visible uniquement si compte désactivé ET jamais utilisé)

**⚠️ Action irréversible → double confirmation**

**Modal 1 - Avertissement** :
```
┌──────────────────────────────────────────────────┐
│  ⚠️ ATTENTION : Suppression définitive           │
│                                                   │
│  Vous êtes sur le point de SUPPRIMER             │
│  définitivement le compte de :                    │
│  Jean Dupont (jean.dupont@...)                   │
│                                                   │
│  ❌ Cette action est IRRÉVERSIBLE                │
│  ❌ Le compte sera définitivement supprimé       │
│                                                   │
│  ℹ️ Si ce compte a été utilisé (CRV créés,      │
│  phases démarrées, etc.), la suppression sera    │
│  REFUSÉE par le système.                         │
│                                                   │
│  💡 Recommandation : utilisez plutôt la         │
│  désactivation pour préserver l'historique.      │
│                                                   │
│  [Annuler]  [Continuer vers suppression]        │
└──────────────────────────────────────────────────┘
```

**Modal 2 - Confirmation finale** :
```
┌──────────────────────────────────────────────────┐
│  🗑️ Confirmation de suppression                 │
│                                                   │
│  Tapez le mot "SUPPRIMER" pour confirmer :      │
│  [___________________________________________]   │
│                                                   │
│  [Annuler]  [Supprimer définitivement]          │
└──────────────────────────────────────────────────┘
```

**Requête backend** :
```javascript
DELETE /api/personnes/:id
```

**Réponses possibles** :

**Succès (200 OK)** :
```json
{
  "success": true,
  "message": "Compte supprimé avec succès"
}
```

**Échec - Compte utilisé (400 Bad Request)** :
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

**Gestion frontend de l'erreur** :
```
┌──────────────────────────────────────────────────┐
│  ❌ Suppression impossible                       │
│                                                   │
│  Ce compte ne peut pas être supprimé car il a    │
│  été utilisé :                                    │
│  - 15 CRV créés                                  │
│  - 42 charges ajoutées                           │
│  - 8 phases démarrées                            │
│                                                   │
│  💡 Utilisez la désactivation à la place pour   │
│  préserver l'historique des données.             │
│                                                   │
│  [Fermer]  [Désactiver le compte à la place]    │
└──────────────────────────────────────────────────┘
```

---

## 9️⃣ GESTION DU TOKEN JWT

### Stockage du token

**Après connexion réussie** :
```javascript
// Réponse backend
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "utilisateur": {
    "id": "...",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "fonction": "AGENT_ESCALE"
  }
}

// Stockage frontend
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.utilisateur));
```

**Alternative sessionStorage** (si session temporaire souhaitée) :
```javascript
sessionStorage.setItem('token', response.data.token);
sessionStorage.setItem('user', JSON.stringify(response.data.utilisateur));
```

---

### Utilisation du token dans les requêtes

**Méthode manuelle** :
```javascript
const token = localStorage.getItem('token');

fetch('/api/crv', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Avec Axios (intercepteur global)** :
```javascript
// Configuration globale
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Utilisation (token ajouté automatiquement)
axios.get('/api/crv');
```

---

### Expiration du token

**Le token JWT contient** :
```json
{
  "id": "...",
  "email": "...",
  "fonction": "...",
  "iat": 1704470400,  // Issued At (timestamp création)
  "exp": 1704556800   // Expiration (timestamp)
}
```

**Durée de validité** : Définie par le backend (exemple : 24h, 7 jours, etc.)

**Détection de l'expiration côté frontend** :

**Option 1 : Décodage et vérification** :
```javascript
import jwt_decode from 'jwt-decode';

function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

// Vérification au chargement de l'app
const token = localStorage.getItem('token');
if (isTokenExpired(token)) {
  // Token expiré → rediriger vers login
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

**Option 2 : Détection via erreur backend** :
```javascript
// Intercepteur Axios pour détecter 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### Rafraîchissement du token

**Le backend actuel NE PROPOSE PAS de refresh token.**

**Conséquence** :
- Quand le token expire → l'utilisateur DOIT se reconnecter
- Pas de rafraîchissement automatique

**UX recommandée** :
```
┌──────────────────────────────────────────────────┐
│  ⏱️ Session expirée                              │
│                                                   │
│  Votre session a expiré pour des raisons de     │
│  sécurité. Veuillez vous reconnecter.            │
│                                                   │
│  [Se reconnecter]                                │
└──────────────────────────────────────────────────┘
```

**Si le backend implémente un refresh token dans le futur** :
- Le frontend pourra appeler `POST /api/auth/refresh-token` avant expiration
- Obtenir un nouveau token sans redemander les identifiants

---

### Déconnexion

**Action utilisateur** : Clic sur "Se déconnecter"

**Requête backend** :
```javascript
POST /api/auth/deconnexion
Headers: {
  Authorization: Bearer [TOKEN]
}
```

**Actions frontend (même si la requête échoue)** :
```javascript
async function logout() {
  try {
    // Tenter d'informer le backend
    await axios.post('/api/auth/deconnexion');
  } catch (error) {
    // Ignorer les erreurs (ex: token déjà invalide)
  } finally {
    // TOUJOURS nettoyer le stockage local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Rediriger vers login
    window.location.href = '/login';
  }
}
```

---

### Protection des routes

**Composant ProtectedRoute (React exemple)** :
```javascript
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Pas de token → rediriger vers login
  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Token expiré → rediriger vers login
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  // Rôle non autorisé → rediriger vers page d'erreur
  if (allowedRoles && !allowedRoles.includes(user.fonction)) {
    return <Navigate to="/non-autorise" />;
  }

  // Autorisé → afficher la page
  return children;
}

// Utilisation
<Route
  path="/admin/utilisateurs"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <GestionUtilisateurs />
    </ProtectedRoute>
  }
/>

<Route
  path="/crv/nouveau"
  element={
    <ProtectedRoute allowedRoles={['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER']}>
      <CreerCRV />
    </ProtectedRoute>
  }
/>
```

---

## 🔟 CAS LIMITES ET ERREURS À GÉRER

### Cas 1 : Utilisateur se connecte avec `doitChangerMotDePasse: true`

**Scénario** :
- Compte créé par ADMIN avec mot de passe initial
- OU Réinitialisation de mot de passe (P0-2)

**Réponse backend à la connexion** :
```json
{
  "success": true,
  "token": "...",
  "utilisateur": {
    "id": "...",
    "nom": "Dupont",
    "prenom": "Jean",
    "doitChangerMotDePasse": true  // ⚠️ Flag important
  }
}
```

**Actions frontend OBLIGATOIRES** :
1. Stocker le token et l'utilisateur
2. **Rediriger IMMÉDIATEMENT** vers `/changer-mot-de-passe`
3. **Bloquer l'accès** au reste de l'application
4. Afficher message :
   ```
   Pour des raisons de sécurité, vous devez changer
   votre mot de passe avant de continuer.
   ```

**Gestion dans l'app** :
```javascript
// Après connexion
if (response.data.utilisateur.doitChangerMotDePasse) {
  // Redirection forcée
  navigate('/changer-mot-de-passe', {
    state: { forced: true }
  });
  // Empêcher navigation ailleurs
  return;
}

// Navigation normale
navigate('/dashboard');
```

**Sur la page `/changer-mot-de-passe`** :
- Désactiver le bouton "Retour" ou "Annuler"
- Afficher message : "Vous devez changer votre mot de passe pour accéder à l'application"
- Seul bouton disponible : "Changer mon mot de passe"

**Après changement de MDP réussi** :
- Mettre à jour `doitChangerMotDePasse: false` (ou récupérer nouveau token)
- Débloquer l'accès à l'application
- Rediriger vers dashboard

---

### Cas 2 : Token invalide ou corrompu

**Scénario** :
- Token manipulé côté client
- Token issu d'un autre environnement
- Token malformé

**Réponse backend** :
```
401 Unauthorized
{
  "success": false,
  "message": "Token invalide",
  "code": "TOKEN_INVALID"
}
```

**Actions frontend** :
```javascript
// Intercepteur global
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Nettoyer le stockage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Afficher message
      toast.error("Votre session est invalide. Veuillez vous reconnecter.");

      // Rediriger vers login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### Cas 3 : QUALITE tente d'accéder à une action interdite

**Scénario** :
- QUALITE tente de créer un CRV (via manipulation URL ou API)

**Réponse backend** :
```
403 Forbidden
{
  "success": false,
  "message": "Accès refusé: QUALITE est un profil lecture seule uniquement",
  "code": "QUALITE_READ_ONLY"
}
```

**Actions frontend** :

**Prévention (recommandé)** :
- Cacher les boutons/actions pour QUALITE
- Désactiver les formulaires (champs en `readonly` ou `disabled`)
- Rediriger si accès direct à une URL interdite

**Gestion de l'erreur (si tentative quand même)** :
```javascript
try {
  await api.post('/api/crv', data);
} catch (error) {
  if (error.response?.data?.code === 'QUALITE_READ_ONLY') {
    toast.error(
      "Votre profil QUALITE est en lecture seule. " +
      "Vous ne pouvez pas créer ou modifier de données."
    );
    // Rediriger vers page de consultation
    navigate('/crv');
  }
}
```

---

### Cas 4 : ADMIN tente d'accéder aux pages métier CRV

**Scénario** :
- ADMIN tente d'accéder à `/crv`, `/vols`, etc.

**Réponse backend** :
```
403 Forbidden (ou 404, selon implémentation)
```

**Actions frontend** :

**Prévention** :
- Menu CRV complètement caché pour ADMIN
- Routes `/crv`, `/vols`, etc. protégées

**Route protection** :
```javascript
<Route
  path="/crv"
  element={
    <ProtectedRoute
      allowedRoles={['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']}
    >
      <ListeCRV />
    </ProtectedRoute>
  }
/>
```

**Si ADMIN accède directement à l'URL** :
- Redirection automatique vers `/admin/utilisateurs`
- Message : "Les comptes ADMIN n'ont pas accès aux opérations CRV. Vous avez été redirigé vers la gestion des utilisateurs."

---

### Cas 5 : Réseau inaccessible / Backend down

**Scénario** :
- Backend ne répond pas
- Timeout
- Erreur 500, 502, 503

**Gestion frontend** :

**Affichage d'une erreur générique** :
```
┌──────────────────────────────────────────────────┐
│  ❌ Erreur de connexion                          │
│                                                   │
│  Impossible de se connecter au serveur.         │
│  Vérifiez votre connexion internet et           │
│  réessayez.                                      │
│                                                   │
│  [Réessayer]                                     │
└──────────────────────────────────────────────────┘
```

**Pour les actions critiques (login, création compte)** :
```javascript
try {
  await api.post('/api/auth/connexion', credentials);
} catch (error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    // Timeout ou réseau
    setError("Impossible de se connecter au serveur. Vérifiez votre connexion.");
  } else if (error.response?.status >= 500) {
    // Erreur serveur
    setError("Le serveur rencontre un problème. Veuillez réessayer plus tard.");
  } else {
    // Autre erreur
    setError(error.response?.data?.message || "Une erreur est survenue");
  }
}
```

**Indicateur de chargement** :
- Afficher un spinner/loader pendant les requêtes
- Désactiver les boutons pendant le chargement
- Timeout raisonnable (ex: 30 secondes max)

---

### Cas 6 : Compte désactivé pendant la session

**Scénario** :
- Utilisateur connecté
- ADMIN désactive le compte
- Utilisateur tente une action

**Réponse backend** :
```
403 Forbidden
{
  "success": false,
  "message": "Votre compte a été désactivé. Contactez l'administrateur.",
  "code": "ACCOUNT_DISABLED"
}
```

**Actions frontend** :
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data?.code === 'ACCOUNT_DISABLED') {
      // Déconnecter immédiatement
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Afficher modal bloquant
      showModal({
        title: "Compte désactivé",
        message: "Votre compte a été désactivé par un administrateur. Contactez support-crv@example.com pour plus d'informations.",
        blocking: true
      });

      // Rediriger vers login
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
    }
    return Promise.reject(error);
  }
);
```

---

### Cas 7 : Rôle changé pendant la session

**Scénario** :
- Utilisateur connecté avec rôle AGENT_ESCALE
- ADMIN change le rôle en CHEF_EQUIPE
- Token JWT actuel contient toujours "AGENT_ESCALE"

**Problème** :
- Frontend pense que l'utilisateur est AGENT (selon token)
- Backend valide avec nouveau rôle CHEF

**Solutions** :

**Option 1 : Invalidation du token (backend)** :
- ADMIN change le rôle → Backend invalide tous les tokens de cet utilisateur
- Utilisateur est déconnecté automatiquement au prochain appel API
- Doit se reconnecter → Nouveau token avec nouveau rôle

**Option 2 : Notification utilisateur (frontend)** :
- Afficher message après modification par ADMIN :
  "Le rôle de cet utilisateur a été modifié. Il devra se reconnecter pour que les changements prennent effet."
- Utilisateur se déconnecte manuellement et se reconnecte

**Recommandation** : Option 1 (invalidation automatique)

---

## 📚 RÉCAPITULATIF FINAL

### ✅ CE QUI EXISTE ET DOIT ÊTRE IMPLÉMENTÉ FRONTEND

**Authentification** :
- ✅ Page de connexion (email + mot de passe)
- ✅ Déconnexion
- ✅ Changement de mot de passe (utilisateur connecté)
- ✅ Gestion du token JWT (stockage, expiration, utilisation)

**Gestion des comptes (ADMIN uniquement)** :
- ✅ Liste des utilisateurs
- ✅ Créer un utilisateur (formulaire complet avec choix de rôle)
- ✅ Modifier un utilisateur (nom, email, fonction, statut)
- ✅ Désactiver un utilisateur
- ✅ Réactiver un utilisateur
- ✅ Supprimer un utilisateur (avec contraintes)

**Adaptation UI selon rôle** :
- ✅ Masquage conditionnel des menus
- ✅ Masquage conditionnel des boutons d'action
- ✅ Protection des routes
- ✅ Messages d'erreur selon contexte

**Opérations métier CRV** :
- ✅ Toutes les opérations CRV existantes (selon rôle)
- ✅ Lecture seule pour QUALITE
- ✅ Aucune opération CRV pour ADMIN

---

### ❌ CE QUI N'EXISTE PAS ET NE DOIT PAS ÊTRE IMPLÉMENTÉ

**Inscription** :
- ❌ Page d'inscription publique
- ❌ Formulaire de création de compte utilisateur (sauf ADMIN)
- ❌ Choix de rôle par l'utilisateur
- ❌ Bouton "S'inscrire"

**Réinitialisation de mot de passe** :
- ❌ Formulaire "Mot de passe oublié"
- ❌ Envoi automatique d'email de reset
- ❌ Token de réinitialisation
- ✅ Afficher uniquement contact support

**Autres** :
- ❌ Refresh token automatique (reconnexion manuelle requise)
- ❌ Bootstrap ADMIN dans l'app utilisateur (outil séparé si besoin)
- ❌ Modification du mot de passe d'un autre utilisateur par ADMIN

---

### 🔑 RÈGLES D'OR POUR LE FRONTEND

1. **Toujours vérifier le rôle** avant d'afficher une action
2. **Toujours valider côté backend** même si frontend masque une action
3. **Gérer les erreurs 401 et 403** avec redirections appropriées
4. **Nettoyer le stockage** à la déconnexion
5. **Bloquer l'accès** si `doitChangerMotDePasse: true`
6. **Ne jamais afficher** d'options inexistantes (inscription, reset auto)
7. **Adapter l'UI** selon le rôle (menus, boutons, pages)
8. **Afficher des messages clairs** en cas d'erreur de permission

---

**Document contrôlé** — Version 1.0.0 — 2026-01-05
**Type** : CONTRAT D'INTERFACE BACKEND ↔ FRONTEND
**Validité** : Production
**Révision** : À chaque modification backend majeure
