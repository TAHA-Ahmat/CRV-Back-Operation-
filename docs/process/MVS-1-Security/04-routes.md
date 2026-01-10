# MVS-1-Security - ROUTES

## Date d'audit : 2026-01-10

---

## 1. auth.routes.js

### Emplacement
`src/routes/security/auth.routes.js`

### Base path
`/api/auth`

---

### Routes exposees

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | /login | login | validate(email, password) | Connexion utilisateur |
| POST | /register | register | validate(body) | Inscription (roles limites) |
| GET | /me | getMe | protect | Profil utilisateur connecte |
| POST | /changer-mot-de-passe | changerMotDePasse | protect, validate | Changer son mot de passe |
| POST | /connexion | login | validate | Alias FR de /login |
| POST | /inscription | register | validate | Alias FR de /register |
| POST | /deconnexion | inline | - | Logout (client-side) |

---

### Detail des routes

#### POST /api/auth/login
```javascript
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate
], login);
```
- **Fonction metier** : Authentification utilisateur
- **Validation** : email format, password non vide
- **Retour** : Token JWT + donnees utilisateur

#### POST /api/auth/register
```javascript
router.post('/register', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prenom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caracteres'),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']).withMessage('Fonction invalide'),
  validate
], register);
```
- **Fonction metier** : Creation compte utilisateur
- **Roles autorises** : AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE
- **Note** : ADMIN exclus de l'inscription publique

#### GET /api/auth/me
```javascript
router.get('/me', protect, getMe);
```
- **Fonction metier** : Recuperation profil utilisateur connecte
- **Authentification** : Token JWT requis

#### POST /api/auth/changer-mot-de-passe
```javascript
router.post('/changer-mot-de-passe', protect, [
  body('ancienMotDePasse').notEmpty().withMessage('Ancien mot de passe requis'),
  body('nouveauMotDePasse').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caracteres'),
  validate
], changerMotDePasse);
```
- **Fonction metier** : Modification mot de passe
- **Authentification** : Token JWT requis

#### POST /api/auth/connexion (ALIAS)
- Alias francais pour /login
- Supporte `motDePasse` en plus de `password`

#### POST /api/auth/inscription (ALIAS)
- Alias francais pour /register
- Supporte `motDePasse` en plus de `password`

#### POST /api/auth/deconnexion
```javascript
router.post('/deconnexion', (req, res) => {
  res.status(200).json({ success: true, message: 'Deconnexion reussie' });
});
```
- **Fonction metier** : Deconnexion (cote client)
- **Note** : Le logout est gere cote client (suppression token)

---

## 2. personne.routes.js

### Emplacement
`src/routes/security/personne.routes.js`

### Base path
`/api/personnes`

### Protection globale
```javascript
router.use(protect);  // Toutes les routes necessitent authentification
```

---

### Routes exposees

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | / | getAllPersonnes | protect | Lister utilisateurs |
| GET | /stats/global | getPersonnesStats | protect | Statistiques globales |
| GET | /:id | getPersonneById | protect | Obtenir un utilisateur |
| POST | / | createPersonne | protect, authorize('ADMIN'), validate | Creer utilisateur |
| PUT | /:id | updatePersonne | protect, authorize('ADMIN'), validate | Modifier utilisateur |
| PATCH | /:id | updatePersonne | protect, authorize('ADMIN'), validate | Modifier utilisateur |
| DELETE | /:id | deletePersonne | protect, authorize('ADMIN') | Supprimer utilisateur |

---

### Detail des routes

#### GET /api/personnes
- **Fonction metier** : Liste paginee des utilisateurs
- **Query params** : page, limit, fonction, statut, search
- **Acces** : Tous les utilisateurs authentifies

#### GET /api/personnes/stats/global
- **Fonction metier** : Statistiques (total, par fonction, par statut)
- **Acces** : Tous les utilisateurs authentifies
- **Note** : Route avant /:id pour eviter collision

#### GET /api/personnes/:id
- **Fonction metier** : Obtenir un utilisateur par ID
- **Acces** : Tous les utilisateurs authentifies

#### POST /api/personnes
```javascript
router.post('/', authorize('ADMIN'), [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prenom requis'),
  body('matricule').optional().trim(),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').optional().isLength({ min: 6 }),
  body('motDePasse').optional().isLength({ min: 6 }),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN']),
  validate,
  validatePassword
], createPersonne);
```
- **Fonction metier** : Creation utilisateur par ADMIN
- **Roles autorises a creer** : Tous y compris ADMIN
- **Acces** : ADMIN uniquement

#### PUT/PATCH /api/personnes/:id
```javascript
const updateValidation = [
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('motDePasse').optional().isLength({ min: 6 }),
  body('fonction').optional().isIn([...]),
  body('statut').optional().isIn(['ACTIF', 'ABSENT', 'CONGE', 'INACTIF']),
  validate
];
router.put('/:id', authorize('ADMIN'), updateValidation, updatePersonne);
router.patch('/:id', authorize('ADMIN'), updateValidation, updatePersonne);
```
- **Fonction metier** : Modification utilisateur
- **Acces** : ADMIN uniquement

#### DELETE /api/personnes/:id
- **Fonction metier** : Suppression utilisateur
- **Acces** : ADMIN uniquement
- **Protection** : Impossible de supprimer son propre compte

---

## SYNTHESE ROUTES MVS-1-Security

### Classification des routes

#### Routes CRUD
| Route | Verbe | Description |
|-------|-------|-------------|
| /api/personnes | GET | Liste |
| /api/personnes/:id | GET | Detail |
| /api/personnes | POST | Creation |
| /api/personnes/:id | PUT/PATCH | Modification |
| /api/personnes/:id | DELETE | Suppression |

#### Routes METIER
| Route | Verbe | Description |
|-------|-------|-------------|
| /api/auth/login | POST | Authentification |
| /api/auth/register | POST | Inscription |
| /api/auth/me | GET | Profil |
| /api/auth/changer-mot-de-passe | POST | Changement password |
| /api/personnes/stats/global | GET | Statistiques |

#### Routes TRANSVERSES
| Route | Verbe | Description |
|-------|-------|-------------|
| /api/auth/connexion | POST | Alias login |
| /api/auth/inscription | POST | Alias register |
| /api/auth/deconnexion | POST | Logout |

---

## MIDDLEWARES APPLIQUES

| Middleware | Description | Routes |
|------------|-------------|--------|
| protect | Verification JWT | Toutes sauf login/register |
| authorize('ADMIN') | Verification role | CRUD /personnes |
| validate | Validation express-validator | Routes avec body |
| validatePassword | Password requis | POST /personnes |
