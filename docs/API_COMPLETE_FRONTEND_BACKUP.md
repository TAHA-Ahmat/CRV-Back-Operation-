# 📚 API COMPLÈTE BACKEND CRV - DOCUMENTATION FRONTEND

**Version**: 1.0.0
**Date**: 2026-01-05
**Destinataire**: Équipe Frontend
**Objectif**: Documentation exhaustive de toutes les routes, modèles, controllers et middlewares

---

## TABLE DES MATIÈRES

1. [Authentification](#1-authentification)
2. [CRV (Comptes Rendus de Vol)](#2-crv-comptes-rendus-de-vol)
3. [Phases](#3-phases)
4. [Vols](#4-vols)
5. [Programmes Vol](#5-programmes-vol)
6. [Charges (Passagers & Fret)](#6-charges-passagers--fret)
7. [Avions (Configuration)](#7-avions-configuration)
8. [Notifications](#8-notifications)
9. [Alertes SLA](#9-alertes-sla)
10. [Validation CRV](#10-validation-crv)
11. [Modèles de données](#11-modèles-de-données-complets)
12. [Middlewares](#12-middlewares)

---

## 1. AUTHENTIFICATION

### 1.1. POST /api/auth/login

**Connexion utilisateur**

#### Route
```
POST /api/auth/login
```

#### Middlewares
```javascript
[
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate
]
```

**Validations**:
- `email`: Format email valide
- `password`: Non vide

#### Controller
**Fichier**: `src/controllers/auth.controller.js`

**Fonction**: `login(req, res)`

**Logique**:
```javascript
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Trouver l'utilisateur par email (+ récupérer password)
    const user = await Personne.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // 2. Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // 3. Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        fonction: user.fonction
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // 4. Retourner le token et l'utilisateur (sans password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};
```

#### Modèle
**Fichier**: `src/models/Personne.js`

**Schéma complet**:
```javascript
const personneSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false  // ⚠️ Pas retourné par défaut
  },
  fonction: {
    type: String,
    enum: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
    required: true
  },
  specialites: [{
    type: String,
    enum: ['PISTE', 'PASSAGERS', 'FRET', 'BAGAGE', 'AVITAILLEMENT', 'NETTOYAGE', 'MAINTENANCE']
  }],
  statut: {
    type: String,
    enum: ['ACTIF', 'ABSENT', 'CONGE', 'INACTIF'],
    default: 'ACTIF'
  },
  statutCompte: {
    type: String,
    enum: ['EN_ATTENTE', 'VALIDE', 'SUSPENDU', 'DESACTIVE'],
    default: 'VALIDE',
    required: true
  },
  dateValidationCompte: {
    type: Date,
    default: null
  },
  valideParUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },
  telephone: String,
  dateEmbauche: Date
}, {
  timestamps: true  // Ajoute createdAt et updatedAt
});
```

**Méthodes du modèle**:
```javascript
// Hasher le password avant save
personneSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparer password
personneSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

#### Requête Frontend
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "jean.dupont@example.com",
  "password": "MotDePasse123!"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6789abcd1234567890abcdef",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "fonction": "AGENT_ESCALE",
    "matricule": "AG001",
    "statut": "ACTIF",
    "statutCompte": "VALIDE",
    "specialites": ["PISTE", "PASSAGERS"],
    "telephone": "+33612345678",
    "dateEmbauche": "2023-01-15T00:00:00.000Z",
    "createdAt": "2023-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
}
```

#### Réponse Erreur (401)
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect"
}
```

---

### 1.2. POST /api/auth/register

**⚠️ ATTENTION**: Cette route existe actuellement mais DOIT être revue selon la gouvernance (voir GOUVERNANCE_COMPTES_UTILISATEURS.md)

**Inscription utilisateur** (À REMPLACER par système ADMIN uniquement)

#### Route
```
POST /api/auth/register
```

#### Middlewares
```javascript
[
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']).withMessage('Fonction invalide'),
  validate
]
```

**Validations**:
- `nom`: Non vide
- `prenom`: Non vide
- `matricule`: Non vide
- `email`: Format email valide
- `password`: Minimum 6 caractères
- `fonction`: Parmi ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE'] (⚠️ ADMIN exclu)

#### Controller
**Fichier**: `src/controllers/auth.controller.js`

**Fonction**: `register(req, res)`

**Logique**:
```javascript
export const register = async (req, res) => {
  try {
    const { nom, prenom, matricule, email, password, fonction } = req.body;

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await Personne.findOne({
      $or: [{ email }, { matricule }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email ou matricule déjà utilisé'
      });
    }

    // 2. Créer le nouvel utilisateur
    const newUser = await Personne.create({
      nom,
      prenom,
      matricule,
      email,
      password,
      fonction,
      statutCompte: 'VALIDE'  // Auto-validation (pas de workflow manuel)
    });

    // 3. Générer le token JWT
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        fonction: newUser.fonction
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // 4. Retourner le token et l'utilisateur
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};
```

#### Modèle
**Fichier**: `src/models/Personne.js` (même que login)

#### Requête Frontend
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "nom": "Martin",
  "prenom": "Sophie",
  "matricule": "AG002",
  "email": "sophie.martin@example.com",
  "password": "Password123!",
  "fonction": "CHEF_EQUIPE"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6789abcd1234567890abcdef",
    "nom": "Martin",
    "prenom": "Sophie",
    "email": "sophie.martin@example.com",
    "fonction": "CHEF_EQUIPE",
    "matricule": "AG002",
    "statut": "ACTIF",
    "statutCompte": "VALIDE",
    "specialites": [],
    "createdAt": "2026-01-05T11:00:00.000Z",
    "updatedAt": "2026-01-05T11:00:00.000Z"
  }
}
```

#### Réponse Erreur (400)
```json
{
  "success": false,
  "message": "Email ou matricule déjà utilisé"
}
```

---

### 1.3. GET /api/auth/me

**Obtenir le profil de l'utilisateur connecté**

#### Route
```
GET /api/auth/me
```

#### Middlewares
```javascript
[
  protect  // Vérification JWT token
]
```

**Middleware `protect`**:
```javascript
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Récupérer l'utilisateur depuis la DB
    req.user = await Personne.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non trouvé'
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};
```

#### Controller
**Fichier**: `src/controllers/auth.controller.js`

**Fonction**: `getMe(req, res)`

**Logique**:
```javascript
export const getMe = async (req, res) => {
  try {
    // req.user déjà défini par le middleware protect
    const user = await Personne.findById(req.user._id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};
```

#### Modèle
**Fichier**: `src/models/Personne.js` (même que login)

#### Requête Frontend
```javascript
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "user": {
    "_id": "6789abcd1234567890abcdef",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "fonction": "AGENT_ESCALE",
    "matricule": "AG001",
    "statut": "ACTIF",
    "statutCompte": "VALIDE",
    "specialites": ["PISTE", "PASSAGERS"],
    "telephone": "+33612345678",
    "dateEmbauche": "2023-01-15T00:00:00.000Z",
    "createdAt": "2023-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
}
```

#### Réponse Erreur (401)
```json
{
  "success": false,
  "message": "Non autorisé - Token invalide"
}
```

---

## 2. CRV (COMPTES RENDUS DE VOL)

### 2.1. POST /api/crv

**Créer un nouveau CRV**

#### Route
```
POST /api/crv
```

#### Middlewares
```javascript
[
  protect,              // Auth JWT
  excludeQualite,       // P0-1: Bloquer QUALITE
  [
    body('volId').notEmpty().withMessage('Vol requis'),
    validate
  ],
  verifierPhasesAutoriseesCreationCRV,  // Business rule
  auditLog('CREATION')  // Traçabilité
]
```

**Middleware `excludeQualite`** (P0-1):
```javascript
export const excludeQualite = (req, res, next) => {
  if (req.user.fonction === 'QUALITE') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé: QUALITE est un profil lecture seule uniquement',
      code: 'QUALITE_READ_ONLY'
    });
  }
  next();
};
```

**Middleware `verifierPhasesAutoriseesCreationCRV`**:
```javascript
export const verifierPhasesAutoriseesCreationCRV = async (req, res, next) => {
  try {
    const vol = await Vol.findById(req.body.volId);

    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    // Vérifier si le type d'opération autorise la création de CRV
    const phasesAutorisees = getPhasesParTypeOperation(vol.typeOperation);

    if (!phasesAutorisees || phasesAutorisees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'opération invalide pour la création de CRV'
      });
    }

    req.phasesAutorisees = phasesAutorisees;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de validation',
      error: error.message
    });
  }
};
```

**Middleware `auditLog`**:
```javascript
export const auditLog = (action) => {
  return async (req, res, next) => {
    // Log l'action pour l'audit trail
    const log = {
      action,
      userId: req.user._id,
      userEmail: req.user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    await UserActivityLog.create(log);
    next();
  };
};
```

#### Controller
**Fichier**: `src/controllers/crv.controller.js`

**Fonction**: `creerCRV(req, res)`

**Logique**:
```javascript
export const creerCRV = async (req, res) => {
  try {
    const { volId } = req.body;

    // 1. Vérifier que le vol existe
    const vol = await Vol.findById(volId);
    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    // 2. Générer un numéro CRV unique
    const numeroCRV = await genererNumeroCRV();

    // 3. Créer le CRV
    const crv = await CRV.create({
      numeroCRV,
      vol: volId,
      creePar: req.user._id,
      statut: 'BROUILLON',
      completude: 0,
      dateCreation: new Date(),
      derniereModification: new Date(),
      modifiePar: req.user._id
    });

    // 4. Créer les phases associées (selon req.phasesAutorisees du middleware)
    const phases = [];
    for (const phaseConfig of req.phasesAutorisees) {
      const phase = await Phase.create({
        crv: crv._id,
        nom: phaseConfig.nom,
        typePhase: phaseConfig.type,
        ordre: phaseConfig.ordre,
        statut: 'NON_DEMARRE',
        obligatoire: phaseConfig.obligatoire
      });
      phases.push(phase);
    }

    // 5. Retourner le CRV créé avec les phases
    const crvPopulated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('creePar', 'nom prenom email');

    res.status(201).json({
      success: true,
      message: 'CRV créé avec succès',
      crv: crvPopulated,
      phases
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du CRV',
      error: error.message
    });
  }
};
```

**Fonction helper `genererNumeroCRV`**:
```javascript
const genererNumeroCRV = async () => {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');

  // Format: CRV-YYYYMMDD-XXXX
  const prefix = `CRV-${annee}${mois}${jour}`;

  // Trouver le dernier numéro de la journée
  const lastCRV = await CRV.findOne({
    numeroCRV: new RegExp(`^${prefix}`)
  }).sort({ numeroCRV: -1 });

  let numero = 1;
  if (lastCRV) {
    const lastNumero = parseInt(lastCRV.numeroCRV.split('-')[2]);
    numero = lastNumero + 1;
  }

  return `${prefix}-${String(numero).padStart(4, '0')}`;
};
```

#### Modèle CRV
**Fichier**: `src/models/CRV.js`

**Schéma complet**:
```javascript
const crvSchema = new mongoose.Schema({
  numeroCRV: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vol',
    required: true
  },
  horaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horaire'
  },
  statut: {
    type: String,
    enum: ['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE'],
    default: 'BROUILLON'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  responsableVol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  completude: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  verrouillePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  dateVerrouillage: Date,
  derniereModification: {
    type: Date,
    default: Date.now
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  archivage: {
    driveFileId: {
      type: String,
      default: null
    },
    driveWebViewLink: {
      type: String,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    }
  },
  // EXTENSION 6 - Annulation
  annulation: {
    dateAnnulation: {
      type: Date,
      default: null
    },
    annulePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personne',
      default: null
    },
    raisonAnnulation: {
      type: String,
      default: null,
      trim: true
    },
    commentaireAnnulation: {
      type: String,
      default: null,
      trim: true
    },
    ancienStatut: {
      type: String,
      enum: ['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', null],
      default: null
    }
  }
}, {
  timestamps: true
});
```

**Index**:
```javascript
crvSchema.index({ numeroCRV: 1 });
crvSchema.index({ vol: 1 });
crvSchema.index({ statut: 1 });
crvSchema.index({ creePar: 1 });
crvSchema.index({ dateCreation: -1 });
```

#### Modèle Vol
**Fichier**: `src/models/Vol.js`

**Schéma complet**:
```javascript
const volSchema = new mongoose.Schema({
  numeroVol: {
    type: String,
    required: true,
    trim: true
  },
  typeOperation: {
    type: String,
    enum: ['ARRIVEE', 'DEPART', 'TURN_AROUND'],
    required: true
  },
  compagnieAerienne: {
    type: String,
    required: true,
    trim: true
  },
  codeIATA: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 2
  },
  dateVol: {
    type: Date,
    required: true
  },
  avion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avion'
  },
  // EXTENSION 2 - Vol programmé / hors programme
  programmation: {
    estProgramme: {
      type: Boolean,
      default: false
    },
    programmeVolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProgrammeVolSaisonnier',
      default: null
    },
    typeVolHorsProgramme: {
      type: String,
      enum: ['CHARTER', 'VOL_FERRY', 'MEDICAL', 'TECHNIQUE', 'AUTRE', null],
      default: null
    },
    raisonHorsProgramme: {
      type: String,
      default: null,
      trim: true
    }
  }
}, {
  timestamps: true
});
```

#### Requête Frontend
```javascript
POST /api/crv
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "volId": "6789abcd1234567890abcdef"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "CRV créé avec succès",
  "crv": {
    "_id": "6789abcd1234567890fedcba",
    "numeroCRV": "CRV-20260105-0001",
    "vol": {
      "_id": "6789abcd1234567890abcdef",
      "numeroVol": "AF1234",
      "typeOperation": "ARRIVEE",
      "compagnieAerienne": "Air France",
      "dateVol": "2026-01-06T10:30:00.000Z"
    },
    "statut": "BROUILLON",
    "completude": 0,
    "creePar": {
      "_id": "6789abcd1234567890aaaaaa",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com"
    },
    "dateCreation": "2026-01-05T12:00:00.000Z",
    "derniereModification": "2026-01-05T12:00:00.000Z",
    "archivage": {
      "driveFileId": null,
      "driveWebViewLink": null,
      "archivedAt": null,
      "archivedBy": null
    },
    "annulation": {
      "dateAnnulation": null,
      "annulePar": null,
      "raisonAnnulation": null,
      "commentaireAnnulation": null,
      "ancienStatut": null
    }
  },
  "phases": [
    {
      "_id": "6789abcd1234567890phase1",
      "crv": "6789abcd1234567890fedcba",
      "nom": "Accueil avion",
      "typePhase": "ACCUEIL_AVION",
      "ordre": 1,
      "statut": "NON_DEMARRE",
      "obligatoire": true
    },
    {
      "_id": "6789abcd1234567890phase2",
      "crv": "6789abcd1234567890fedcba",
      "nom": "Débarquement passagers",
      "typePhase": "DEBARQUEMENT_PASSAGERS",
      "ordre": 2,
      "statut": "NON_DEMARRE",
      "obligatoire": true
    }
  ]
}
```

#### Réponse Erreur (403) - QUALITE
```json
{
  "success": false,
  "message": "Accès refusé: QUALITE est un profil lecture seule uniquement",
  "code": "QUALITE_READ_ONLY"
}
```

#### Réponse Erreur (404)
```json
{
  "success": false,
  "message": "Vol non trouvé"
}
```

---

### 2.2. GET /api/crv

**Lister tous les CRV**

#### Route
```
GET /api/crv
```

#### Middlewares
```javascript
[
  protect  // Auth JWT (tous rôles sauf ADMIN)
]
```

#### Controller
**Fichier**: `src/controllers/crv.controller.js`

**Fonction**: `listerCRV(req, res)`

**Logique**:
```javascript
export const listerCRV = async (req, res) => {
  try {
    // Query params pour filtres
    const {
      statut,
      compagnie,
      dateDebut,
      dateFin,
      page = 1,
      limit = 20,
      sort = '-dateCreation'
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (statut) {
      filter.statut = statut;
    }

    if (dateDebut || dateFin) {
      filter.dateCreation = {};
      if (dateDebut) filter.dateCreation.$gte = new Date(dateDebut);
      if (dateFin) filter.dateCreation.$lte = new Date(dateFin);
    }

    // Si filtre par compagnie, joindre avec Vol
    let query = CRV.find(filter)
      .populate('vol')
      .populate('creePar', 'nom prenom email fonction')
      .populate('responsableVol', 'nom prenom email')
      .populate('modifiePar', 'nom prenom email');

    if (compagnie) {
      query = query.where('vol.compagnieAerienne').equals(compagnie);
    }

    // Pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(parseInt(limit)).sort(sort);

    // Exécution
    const crvs = await query;
    const total = await CRV.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: crvs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: crvs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des CRV',
      error: error.message
    });
  }
};
```

#### Requête Frontend
```javascript
GET /api/crv?statut=EN_COURS&page=1&limit=20&sort=-dateCreation
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params optionnels**:
- `statut`: BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE
- `compagnie`: Nom de la compagnie
- `dateDebut`: Date ISO (YYYY-MM-DD)
- `dateFin`: Date ISO (YYYY-MM-DD)
- `page`: Numéro de page (default: 1)
- `limit`: Résultats par page (default: 20)
- `sort`: Champ de tri (default: -dateCreation)

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "6789abcd1234567890fedcba",
      "numeroCRV": "CRV-20260105-0001",
      "vol": {
        "_id": "6789abcd1234567890abcdef",
        "numeroVol": "AF1234",
        "typeOperation": "ARRIVEE",
        "compagnieAerienne": "Air France",
        "dateVol": "2026-01-06T10:30:00.000Z"
      },
      "statut": "EN_COURS",
      "completude": 45,
      "creePar": {
        "_id": "6789abcd1234567890aaaaaa",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "fonction": "AGENT_ESCALE"
      },
      "dateCreation": "2026-01-05T12:00:00.000Z",
      "derniereModification": "2026-01-05T14:30:00.000Z"
    }
  ]
}
```

---

### 2.3. GET /api/crv/:id

**Obtenir un CRV par ID**

#### Route
```
GET /api/crv/:id
```

#### Middlewares
```javascript
[
  protect  // Auth JWT
]
```

#### Controller
**Fichier**: `src/controllers/crv.controller.js`

**Fonction**: `obtenirCRV(req, res)`

**Logique**:
```javascript
export const obtenirCRV = async (req, res) => {
  try {
    const { id } = req.params;

    const crv = await CRV.findById(id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar', 'nom prenom email fonction')
      .populate('responsableVol', 'nom prenom email')
      .populate('verrouillePar', 'nom prenom email')
      .populate('modifiePar', 'nom prenom email');

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    // Récupérer les phases associées
    const phases = await Phase.find({ crv: id }).sort('ordre');

    // Récupérer les charges
    const charges = await ChargeOperationnelle.find({ crv: id });

    // Récupérer les événements
    const evenements = await EvenementOperationnel.find({ crv: id }).sort('-dateEvenement');

    // Récupérer les observations
    const observations = await Observation.find({ crv: id }).sort('-dateObservation');

    res.status(200).json({
      success: true,
      crv,
      phases,
      charges,
      evenements,
      observations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du CRV',
      error: error.message
    });
  }
};
```

#### Modèles associés

**Phase**:
```javascript
const phaseSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  typePhase: {
    type: String,
    enum: [
      'ACCUEIL_AVION', 'DEBARQUEMENT_PASSAGERS', 'DEBARQUEMENT_BAGAGES',
      'DEBARQUEMENT_FRET', 'NETTOYAGE', 'AVITAILLEMENT', 'CONTROLE_SECURITE',
      'EMBARQUEMENT_PASSAGERS', 'EMBARQUEMENT_BAGAGES', 'EMBARQUEMENT_FRET',
      'REPOUSSAGE', 'AUTRE'
    ],
    required: true
  },
  ordre: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['NON_DEMARRE', 'EN_COURS', 'TERMINE', 'NON_REALISE'],
    default: 'NON_DEMARRE'
  },
  obligatoire: {
    type: Boolean,
    default: true
  },
  dateDebut: Date,
  dateFin: Date,
  dureePrevue: Number,  // en minutes
  dureeReelle: Number,  // en minutes
  personnelAffecte: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  }],
  equipementsUtilises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engin'
  }],
  motifNonRealisation: {
    type: String,
    enum: ['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE', null],
    default: null
  },
  detailMotif: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});
```

**ChargeOperationnelle**:
```javascript
const chargeSchema = new mongoose.Schema({
  crv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRV',
    required: true
  },
  typeCharge: {
    type: String,
    enum: ['PASSAGERS', 'BAGAGES', 'FRET'],
    required: true
  },
  sensOperation: {
    type: String,
    enum: ['EMBARQUEMENT', 'DEBARQUEMENT'],
    required: true
  },
  nombrePassagers: Number,
  nombreBagages: Number,
  poidsBagages: Number,  // en kg
  poidsFret: Number,  // en kg
  volumeFret: Number,  // en m³

  // EXTENSION 4 - Catégories détaillées de passagers
  categoriesDetaillees: {
    bebes: { type: Number, default: 0 },
    enfants: { type: Number, default: 0 },
    adolescents: { type: Number, default: 0 },
    adultes: { type: Number, default: 0 },
    seniors: { type: Number, default: 0 },
    pmrFauteuilRoulant: { type: Number, default: 0 },
    pmrMarcheAssistee: { type: Number, default: 0 },
    pmrAutre: { type: Number, default: 0 },
    transitDirect: { type: Number, default: 0 },
    transitAvecChangement: { type: Number, default: 0 },
    vip: { type: Number, default: 0 },
    equipage: { type: Number, default: 0 },
    deportes: { type: Number, default: 0 }
  },

  // Classes
  classes: {
    premiere: { type: Number, default: 0 },
    affaires: { type: Number, default: 0 },
    economique: { type: Number, default: 0 }
  },

  // Besoins médicaux
  besoinsMedicaux: {
    oxygeneBord: { type: Number, default: 0 },
    brancardier: { type: Number, default: 0 },
    accompagnementMedical: { type: Number, default: 0 }
  },

  // Mineurs
  mineurs: {
    mineurNonAccompagne: { type: Number, default: 0 },
    bebeNonAccompagne: { type: Number, default: 0 }
  },

  // EXTENSION 5 - Fret détaillé
  fretDetaille: {
    categoriesFret: {
      general: { poids: Number, volume: Number },
      perissable: { poids: Number, volume: Number, temperature: String },
      fragile: { poids: Number, volume: Number },
      valeurElevee: { poids: Number, volume: Number },
      volumineux: { poids: Number, volume: Number },
      animal: { poids: Number, volume: Number, espece: String }
    },
    marchandisesDangereuses: [{
      codeONU: String,
      classeONU: String,
      designationOfficielle: String,
      quantite: Number,
      unite: String,
      groupeEmballage: String,
      instructions: String
    }],
    logistique: {
      nombreColis: Number,
      nombrePalettes: Number,
      numeroLTA: String,
      numeroAWB: String
    },
    douanes: {
      declarationDouane: String,
      valeurDeclaree: Number,
      devise: String
    },
    conditionsTransport: {
      temperatureMin: Number,
      temperatureMax: Number,
      humidite: Number,
      instructionsSpeciales: String
    }
  }
}, {
  timestamps: true
});
```

#### Requête Frontend
```javascript
GET /api/crv/6789abcd1234567890fedcba
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "crv": {
    "_id": "6789abcd1234567890fedcba",
    "numeroCRV": "CRV-20260105-0001",
    "vol": {
      "_id": "6789abcd1234567890abcdef",
      "numeroVol": "AF1234",
      "typeOperation": "ARRIVEE",
      "compagnieAerienne": "Air France",
      "dateVol": "2026-01-06T10:30:00.000Z"
    },
    "statut": "EN_COURS",
    "completude": 45,
    "creePar": {
      "_id": "6789abcd1234567890aaaaaa",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "fonction": "AGENT_ESCALE"
    },
    "dateCreation": "2026-01-05T12:00:00.000Z",
    "derniereModification": "2026-01-05T14:30:00.000Z"
  },
  "phases": [
    {
      "_id": "6789abcd1234567890phase1",
      "crv": "6789abcd1234567890fedcba",
      "nom": "Accueil avion",
      "typePhase": "ACCUEIL_AVION",
      "ordre": 1,
      "statut": "TERMINE",
      "obligatoire": true,
      "dateDebut": "2026-01-06T10:00:00.000Z",
      "dateFin": "2026-01-06T10:15:00.000Z",
      "dureeReelle": 15
    }
  ],
  "charges": [
    {
      "_id": "6789abcd1234567890charge1",
      "crv": "6789abcd1234567890fedcba",
      "typeCharge": "PASSAGERS",
      "sensOperation": "DEBARQUEMENT",
      "nombrePassagers": 150,
      "categoriesDetaillees": {
        "bebes": 2,
        "enfants": 10,
        "adultes": 120,
        "seniors": 18
      }
    }
  ],
  "evenements": [],
  "observations": []
}
```

---

## 3. PHASES

### 3.1. POST /api/phases/:id/demarrer

**Démarrer une phase**

#### Route
```
POST /api/phases/:id/demarrer
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCoherencePhaseTypeOperation,
  auditLog('MISE_A_JOUR')
]
```

#### Controller
**Fichier**: `src/controllers/phase.controller.js`

**Fonction**: `demarrerPhaseController(req, res)`

**Logique**:
```javascript
export const demarrerPhaseController = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Récupérer la phase
    const phase = await Phase.findById(id);

    if (!phase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    // 2. Vérifier que la phase n'est pas déjà démarrée ou terminée
    if (phase.statut !== 'NON_DEMARRE') {
      return res.status(400).json({
        success: false,
        message: `Cette phase est déjà ${phase.statut}`
      });
    }

    // 3. Mettre à jour la phase
    phase.statut = 'EN_COURS';
    phase.dateDebut = new Date();
    await phase.save();

    // 4. Créer une entrée dans la chronologie
    await ChronologiePhase.create({
      phase: phase._id,
      action: 'DEMARRAGE',
      statutAvant: 'NON_DEMARRE',
      statutApres: 'EN_COURS',
      executePar: req.user._id,
      timestamp: new Date()
    });

    // 5. Mettre à jour la completude du CRV
    await mettreAJourCompletudeCRV(phase.crv);

    res.status(200).json({
      success: true,
      message: 'Phase démarrée avec succès',
      phase
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage de la phase',
      error: error.message
    });
  }
};
```

**Fonction helper `mettreAJourCompletudeCRV`**:
```javascript
const mettreAJourCompletudeCRV = async (crvId) => {
  const phases = await Phase.find({ crv: crvId });
  const phasesObligatoires = phases.filter(p => p.obligatoire);
  const phasesTerminees = phasesObligatoires.filter(p => p.statut === 'TERMINE');

  const completude = phasesObligatoires.length > 0
    ? Math.round((phasesTerminees.length / phasesObligatoires.length) * 100)
    : 0;

  await CRV.findByIdAndUpdate(crvId, { completude });
};
```

#### Modèle ChronologiePhase
**Fichier**: `src/models/ChronologiePhase.js`

```javascript
const chronologiePhaseSchema = new mongoose.Schema({
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true
  },
  action: {
    type: String,
    enum: ['DEMARRAGE', 'TERMINER', 'MARQUEE_NON_REALISE', 'MODIFICATION'],
    required: true
  },
  statutAvant: String,
  statutApres: String,
  executePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});
```

#### Requête Frontend
```javascript
POST /api/phases/6789abcd1234567890phase1/demarrer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Phase démarrée avec succès",
  "phase": {
    "_id": "6789abcd1234567890phase1",
    "crv": "6789abcd1234567890fedcba",
    "nom": "Accueil avion",
    "typePhase": "ACCUEIL_AVION",
    "ordre": 1,
    "statut": "EN_COURS",
    "obligatoire": true,
    "dateDebut": "2026-01-05T14:30:00.000Z",
    "createdAt": "2026-01-05T12:00:00.000Z",
    "updatedAt": "2026-01-05T14:30:00.000Z"
  }
}
```

---

### 3.2. POST /api/phases/:id/terminer

**Terminer une phase**

#### Route
```
POST /api/phases/:id/terminer
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCoherencePhaseTypeOperation,
  auditLog('MISE_A_JOUR')
]
```

#### Controller
**Fichier**: `src/controllers/phase.controller.js`

**Fonction**: `terminerPhaseController(req, res)`

**Logique**:
```javascript
export const terminerPhaseController = async (req, res) => {
  try {
    const { id } = req.params;

    const phase = await Phase.findById(id);

    if (!phase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    if (phase.statut !== 'EN_COURS') {
      return res.status(400).json({
        success: false,
        message: 'Cette phase n\'est pas en cours'
      });
    }

    // Calculer la durée réelle
    const dureeReelle = phase.dateDebut
      ? Math.round((new Date() - phase.dateDebut) / 60000)  // en minutes
      : null;

    phase.statut = 'TERMINE';
    phase.dateFin = new Date();
    phase.dureeReelle = dureeReelle;
    await phase.save();

    await ChronologiePhase.create({
      phase: phase._id,
      action: 'TERMINER',
      statutAvant: 'EN_COURS',
      statutApres: 'TERMINE',
      executePar: req.user._id,
      timestamp: new Date(),
      details: { dureeReelle }
    });

    await mettreAJourCompletudeCRV(phase.crv);

    res.status(200).json({
      success: true,
      message: 'Phase terminée avec succès',
      phase
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la terminaison de la phase',
      error: error.message
    });
  }
};
```

#### Requête Frontend
```javascript
POST /api/phases/6789abcd1234567890phase1/terminer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Phase terminée avec succès",
  "phase": {
    "_id": "6789abcd1234567890phase1",
    "crv": "6789abcd1234567890fedcba",
    "nom": "Accueil avion",
    "typePhase": "ACCUEIL_AVION",
    "ordre": 1,
    "statut": "TERMINE",
    "obligatoire": true,
    "dateDebut": "2026-01-05T14:30:00.000Z",
    "dateFin": "2026-01-05T14:45:00.000Z",
    "dureeReelle": 15,
    "updatedAt": "2026-01-05T14:45:00.000Z"
  }
}
```

---

### 2.4. PATCH /api/crv/:id

**Mettre à jour un CRV**

#### Route
```
PATCH /api/crv/:id
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCRVNonVerrouille,
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
PATCH /api/crv/6789abcd1234567890fedcba
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "responsableVol": "6789abcd1234567890aaaaaa",
  "statut": "EN_COURS"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV mis à jour avec succès",
  "crv": { ... }
}
```

---

### 2.5. POST /api/crv/:id/charges

**Ajouter une charge opérationnelle (passagers, bagages, fret)**

#### Route
```
POST /api/crv/:id/charges
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCRVNonVerrouille,
  body('typeCharge').isIn(['PASSAGERS', 'BAGAGES', 'FRET']),
  body('sensOperation').isIn(['EMBARQUEMENT', 'DEBARQUEMENT']),
  validate,
  validerCoherenceCharges,
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
POST /api/crv/6789abcd1234567890fedcba/charges
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "typeCharge": "PASSAGERS",
  "sensOperation": "DEBARQUEMENT",
  "nombrePassagers": 150
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Charge ajoutée avec succès",
  "charge": {
    "_id": "...",
    "crv": "6789abcd1234567890fedcba",
    "typeCharge": "PASSAGERS",
    "sensOperation": "DEBARQUEMENT",
    "nombrePassagers": 150
  }
}
```

---

### 2.6. POST /api/crv/:id/evenements

**Ajouter un événement opérationnel**

#### Route
```
POST /api/crv/:id/evenements
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCRVNonVerrouille,
  body('typeEvenement').notEmpty(),
  body('gravite').isIn(['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE']),
  body('description').notEmpty(),
  validate,
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
POST /api/crv/6789abcd1234567890fedcba/evenements
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "typeEvenement": "RETARD",
  "gravite": "MODEREE",
  "description": "Retard de 15 minutes dû à des conditions météo"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Événement ajouté avec succès",
  "evenement": { ... }
}
```

---

### 2.7. POST /api/crv/:id/observations

**Ajouter une observation**

#### Route
```
POST /api/crv/:id/observations
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCRVNonVerrouille,
  body('categorie').isIn(['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA']),
  body('contenu').notEmpty(),
  validate,
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
POST /api/crv/6789abcd1234567890fedcba/observations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "categorie": "QUALITE",
  "contenu": "Excellente coordination entre les équipes"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Observation ajoutée avec succès",
  "observation": { ... }
}
```

---

### 2.8. GET /api/crv/search

**Recherche full-text de CRV**

#### Route
```
GET /api/crv/search
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/crv/search?q=AF1234&dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params**:
- `q`: Terme de recherche (numéro CRV, numéro vol, compagnie)
- `dateDebut`: Date ISO (optionnel)
- `dateFin`: Date ISO (optionnel)
- `statut`: Filtre par statut (optionnel)

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

---

### 2.9. GET /api/crv/stats

**Obtenir les statistiques et KPIs des CRV**

#### Route
```
GET /api/crv/stats
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/crv/stats?dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "parStatut": {
      "BROUILLON": 10,
      "EN_COURS": 40,
      "TERMINE": 80,
      "VALIDE": 15,
      "VERROUILLE": 5
    },
    "completudeMoyenne": 75,
    "tempsMoyenCompletion": 240
  }
}
```

---

### 2.10. GET /api/crv/export

**Exporter les CRV en Excel/CSV**

#### Route
```
GET /api/crv/export
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/crv/export?format=excel&dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params**:
- `format`: excel | csv
- `dateDebut`: Date ISO (optionnel)
- `dateFin`: Date ISO (optionnel)
- `statut`: Filtre par statut (optionnel)

#### Réponse Succès (200)
Fichier Excel ou CSV en téléchargement

---

### 2.11. GET /api/crv/annules

**Obtenir tous les CRV annulés (Extension 6)**

#### Route
```
GET /api/crv/annules
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/crv/annules?dateDebut=2026-01-01&raisonAnnulation=METEO
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params**:
- `dateDebut`: Date ISO (optionnel)
- `dateFin`: Date ISO (optionnel)
- `raisonAnnulation`: Filtre par raison (optionnel)

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "...",
      "numeroCRV": "CRV-20260105-0001",
      "statut": "ANNULE",
      "annulation": {
        "dateAnnulation": "2026-01-05T15:00:00.000Z",
        "annulePar": { ... },
        "raisonAnnulation": "METEO",
        "commentaireAnnulation": "Conditions météo défavorables",
        "ancienStatut": "EN_COURS"
      }
    }
  ]
}
```

---

### 2.12. GET /api/crv/statistiques/annulations

**Obtenir les statistiques des annulations (Extension 6)**

#### Route
```
GET /api/crv/statistiques/annulations
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER', 'ADMIN')
]
```

#### Requête Frontend
```javascript
GET /api/crv/statistiques/annulations?dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "totalAnnulations": 25,
    "parRaison": {
      "METEO": 10,
      "TECHNIQUE": 8,
      "OPERATIONNEL": 5,
      "AUTRE": 2
    },
    "tauxAnnulation": 5.5
  }
}
```

---

### 2.13. GET /api/crv/:id/peut-annuler

**Vérifier si un CRV peut être annulé (Extension 6)**

#### Route
```
GET /api/crv/:id/peut-annuler
```

#### Middlewares
```javascript
[
  protect
]
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "peutAnnuler": true,
  "raison": "Le CRV peut être annulé"
}
```

---

### 2.14. POST /api/crv/:id/annuler

**Annuler un CRV (Extension 6)**

#### Route
```
POST /api/crv/:id/annuler
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER', 'ADMIN')
]
```

#### Requête Frontend
```javascript
POST /api/crv/6789abcd1234567890fedcba/annuler
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "raisonAnnulation": "METEO",
  "commentaireAnnulation": "Conditions météo défavorables empêchant l'opération"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV annulé avec succès",
  "crv": {
    "statut": "ANNULE",
    "annulation": { ... }
  }
}
```

---

### 2.15. POST /api/crv/:id/reactiver

**Réactiver un CRV annulé (Extension 6)**

#### Route
```
POST /api/crv/:id/reactiver
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER', 'ADMIN')
]
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV réactivé avec succès",
  "crv": {
    "statut": "EN_COURS"
  }
}
```

---

### 2.16. GET /api/crv/archive/status

**Vérifier le statut du service d'archivage Google Drive**

#### Route
```
GET /api/crv/archive/status
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "configured": true,
  "authenticated": true
}
```

---

### 2.17. POST /api/crv/archive/test

**Tester l'archivage avec un PDF de test**

#### Route
```
POST /api/crv/archive/test
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Test d'archivage réussi",
  "driveFileId": "...",
  "driveWebViewLink": "https://drive.google.com/..."
}
```

---

### 2.18. POST /api/crv/:id/archive

**Archiver un CRV sur Google Drive**

#### Route
```
POST /api/crv/:id/archive
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV archivé avec succès",
  "crv": {
    "archivage": {
      "driveFileId": "...",
      "driveWebViewLink": "https://drive.google.com/...",
      "archivedAt": "2026-01-05T16:00:00.000Z",
      "archivedBy": "..."
    }
  }
}
```

---

## 3. PHASES

### 3.1. POST /api/phases/:id/demarrer

#### Route
```
GET /api/notifications
```

#### Middlewares
```javascript
[
  protect
]
```

#### Controller
**Fichier**: `src/controllers/notification.controller.js`

**Fonction**: `obtenirMesNotifications(req, res)`

**Logique**:
```javascript
export const obtenirMesNotifications = async (req, res) => {
  try {
    const {
      lu,           // Boolean
      type,         // String
      priorite,     // String
      archive,      // Boolean
      limit = 20,
      skip = 0
    } = req.query;

    // Construction du filtre
    const filter = {
      destinataire: req.user._id
    };

    if (lu !== undefined) {
      filter.lu = lu === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (priorite) {
      filter.priorite = priorite;
    }

    if (archive !== undefined) {
      filter.archive = archive === 'true';
    }

    // Requête
    const notifications = await Notification.find(filter)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
};
```

#### Modèle Notification
**Fichier**: `src/models/Notification.js`

**Schéma complet**:
```javascript
const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    required: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'ALERTE_SLA'],
    required: true
  },
  titre: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  lien: {
    type: String,
    default: null,
    trim: true
  },
  donnees: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateLecture: {
    type: Date,
    default: null
  },
  archive: {
    type: Boolean,
    default: false
  },
  dateArchivage: {
    type: Date,
    default: null
  },
  priorite: {
    type: String,
    enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
    default: 'NORMALE'
  },
  canaux: {
    email: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null },
      adresse: { type: String, default: null }
    },
    sms: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null },
      numero: { type: String, default: null }
    },
    push: {
      envoye: { type: Boolean, default: false },
      dateEnvoi: { type: Date, default: null }
    },
    inApp: {
      affiche: { type: Boolean, default: true }
    }
  },
  source: {
    type: String,
    enum: ['SYSTEME', 'ADMIN', 'ALERTE_SLA', 'WORKFLOW', 'VALIDATION', 'AUTRE'],
    default: 'SYSTEME'
  },
  referenceModele: {
    type: String,
    default: null
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});
```

#### Requête Frontend
```javascript
GET /api/notifications?lu=false&priorite=HAUTE&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params optionnels**:
- `lu`: true | false
- `type`: INFO | WARNING | ERROR | SUCCESS | ALERTE_SLA
- `priorite`: BASSE | NORMALE | HAUTE | URGENTE
- `archive`: true | false
- `limit`: Number (default: 20)
- `skip`: Number (default: 0)

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "data": [
    {
      "_id": "6789abcd1234567890notif1",
      "destinataire": "6789abcd1234567890aaaaaa",
      "type": "ALERTE_SLA",
      "titre": "Alerte SLA - CRV en retard",
      "message": "Le CRV CRV-20260105-0001 est en retard de 15 minutes",
      "lien": "/crv/6789abcd1234567890fedcba",
      "donnees": {
        "crvId": "6789abcd1234567890fedcba",
        "retard": 15,
        "unite": "minutes"
      },
      "lu": false,
      "dateLecture": null,
      "archive": false,
      "priorite": "HAUTE",
      "canaux": {
        "email": {
          "envoye": true,
          "dateEnvoi": "2026-01-05T14:00:00.000Z",
          "adresse": "jean.dupont@example.com"
        },
        "inApp": {
          "affiche": true
        }
      },
      "source": "ALERTE_SLA",
      "referenceModele": "CRV",
      "referenceId": "6789abcd1234567890fedcba",
      "createdAt": "2026-01-05T14:00:00.000Z",
      "updatedAt": "2026-01-05T14:00:00.000Z"
    }
  ]
}
```

---

### 8.2. GET /api/notifications/count-non-lues

**Compter les notifications non lues**

#### Route
```
GET /api/notifications/count-non-lues
```

#### Middlewares
```javascript
[
  protect
]
```

#### Controller
**Fichier**: `src/controllers/notification.controller.js`

**Fonction**: `compterNonLues(req, res)`

**Logique**:
```javascript
export const compterNonLues = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      destinataire: req.user._id,
      lu: false,
      archive: false
    });

    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications',
      error: error.message
    });
  }
};
```

#### Requête Frontend
```javascript
GET /api/notifications/count-non-lues
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 5
}
```

---

### 8.3. PATCH /api/notifications/:id/lire

**Marquer une notification comme lue**

#### Route
```
PATCH /api/notifications/:id/lire
```

#### Middlewares
```javascript
[
  protect
]
```

#### Controller
**Fichier**: `src/controllers/notification.controller.js`

**Fonction**: `marquerCommeLue(req, res)`

**Logique**:
```javascript
export const marquerCommeLue = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      destinataire: req.user._id  // Sécurité: seul le destinataire peut marquer comme lu
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    notification.lu = true;
    notification.dateLecture = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
      notification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la notification',
      error: error.message
    });
  }
};
```

#### Requête Frontend
```javascript
PATCH /api/notifications/6789abcd1234567890notif1/lire
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Notification marquée comme lue",
  "notification": {
    "_id": "6789abcd1234567890notif1",
    "destinataire": "6789abcd1234567890aaaaaa",
    "type": "INFO",
    "titre": "Titre de la notification",
    "message": "Message de la notification",
    "lu": true,
    "dateLecture": "2026-01-05T15:00:00.000Z",
    "updatedAt": "2026-01-05T15:00:00.000Z"
  }
}
```

---

## 11. MODÈLES DE DONNÉES COMPLETS

### 11.1. Personne

**Fichier**: `src/models/Personne.js`

**Schéma complet**:
```javascript
const personneSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  matricule: {
    type: String,
    required: [true, 'Le matricule est requis'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    select: false,
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  fonction: {
    type: String,
    enum: {
      values: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
      message: '{VALUE} n\'est pas une fonction valide'
    },
    required: [true, 'La fonction est requise']
  },
  specialites: [{
    type: String,
    enum: ['PISTE', 'PASSAGERS', 'FRET', 'BAGAGE', 'AVITAILLEMENT', 'NETTOYAGE', 'MAINTENANCE']
  }],
  statut: {
    type: String,
    enum: ['ACTIF', 'ABSENT', 'CONGE', 'INACTIF'],
    default: 'ACTIF'
  },
  statutCompte: {
    type: String,
    enum: ['EN_ATTENTE', 'VALIDE', 'SUSPENDU', 'DESACTIVE'],
    default: 'VALIDE',
    required: true
  },
  dateValidationCompte: {
    type: Date,
    default: null
  },
  valideParUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne',
    default: null
  },
  telephone: {
    type: String,
    trim: true
  },
  dateEmbauche: {
    type: Date
  }
}, {
  timestamps: true
});
```

**Index**:
```javascript
personneSchema.index({ matricule: 1 });
personneSchema.index({ email: 1 });
personneSchema.index({ fonction: 1 });
personneSchema.index({ statut: 1 });
```

**Méthodes**:
```javascript
// Hasher le password avant save
personneSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparer le password
personneSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

---

### 11.2. CRV

Voir section 2.1 pour le schéma complet du modèle CRV.

---

### 11.3. Vol

Voir section 2.1 pour le schéma complet du modèle Vol.

---

### 11.4. Phase

Voir section 2.3 pour le schéma complet du modèle Phase.

---

### 11.5. Notification

Voir section 8.1 pour le schéma complet du modèle Notification.

---

## 12. MIDDLEWARES

### 12.1. protect

**Vérification d'authentification JWT**

**Fichier**: `src/middlewares/auth.middleware.js`

**Code complet**:
```javascript
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant',
        code: 'TOKEN_MISSING'
      });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Récupérer l'utilisateur depuis la DB
    req.user = await Personne.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // 4. Vérifier que le compte est actif
    if (req.user.statutCompte === 'DESACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez l\'administrateur.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    if (req.user.statutCompte === 'SUSPENDU') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est suspendu. Contactez l\'administrateur.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide',
      code: 'TOKEN_INVALID'
    });
  }
};
```

---

### 12.2. authorize

**Restriction par rôle**

**Fichier**: `src/middlewares/auth.middleware.js`

**Code complet**:
```javascript
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.fonction)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Cette action est réservée aux rôles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.fonction
      });
    }

    next();
  };
};
```

**Utilisation**:
```javascript
// Un seul rôle
router.post('/:id/valider', protect, authorize('MANAGER'), validerCRV);

// Plusieurs rôles
router.post('/:id/valider', protect, authorize('SUPERVISEUR', 'MANAGER'), validerCRV);
```

---

### 12.3. excludeQualite

**Bloquer QUALITE (P0-1 fix)**

**Fichier**: `src/middlewares/auth.middleware.js`

**Code complet**:
```javascript
export const excludeQualite = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Utilisateur non authentifié'
    });
  }

  if (req.user.fonction === 'QUALITE') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé: QUALITE est un profil lecture seule uniquement',
      code: 'QUALITE_READ_ONLY'
    });
  }

  next();
};
```

**Utilisation**:
```javascript
// Bloquer QUALITE sur les routes de modification
router.post('/api/crv', protect, excludeQualite, creerCRV);
router.patch('/api/crv/:id', protect, excludeQualite, mettreAJourCRV);
```

---

### 12.4. validate

**Validation express-validator**

**Fichier**: `src/middlewares/validation.middleware.js`

**Code complet**:
```javascript
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};
```

**Utilisation**:
```javascript
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate  // ⬅️ Middleware de validation
], login);
```

---

### 12.5. auditLog

**Traçabilité des actions**

**Fichier**: `src/middlewares/auditLog.middleware.js`

**Code complet**:
```javascript
import UserActivityLog from '../models/UserActivityLog.js';

export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      const log = {
        action,
        userId: req.user?._id || null,
        userEmail: req.user?.email || null,
        userFonction: req.user?.fonction || null,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query,
        timestamp: new Date()
      };

      await UserActivityLog.create(log);
      next();
    } catch (error) {
      // Log l'erreur mais ne bloque pas la requête
      console.error('Erreur audit log:', error);
      next();
    }
  };
};

// Helper pour sanitizer le body (retirer passwords, etc.)
const sanitizeBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'motDePasse', 'token', 'secret'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};
```

**Modèle UserActivityLog**:
```javascript
const userActivityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personne'
  },
  userEmail: String,
  userFonction: String,
  method: String,
  path: String,
  ip: String,
  userAgent: String,
  body: mongoose.Schema.Types.Mixed,
  params: mongoose.Schema.Types.Mixed,
  query: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
```

---

## RÉSUMÉ DES ROUTES PAR DOMAINE

### Authentification (3 routes)
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### CRV (8+ routes)
- POST /api/crv
- GET /api/crv
- GET /api/crv/:id
- PATCH /api/crv/:id
- POST /api/crv/:id/charges
- POST /api/crv/:id/evenements
- POST /api/crv/:id/observations
- POST /api/crv/:id/archive

### Phases (4 routes)
- POST /api/phases/:id/demarrer
- POST /api/phases/:id/terminer
- POST /api/phases/:id/non-realise
- PATCH /api/phases/:id

### Vols (7+ routes)
- POST /api/vols
- GET /api/vols
- GET /api/vols/:id
- PATCH /api/vols/:id
- POST /api/vols/:id/lier-programme
- POST /api/vols/:id/marquer-hors-programme
- POST /api/vols/:id/detacher-programme

### Programmes Vol (9+ routes)
- POST /api/programmes-vol
- GET /api/programmes-vol
- GET /api/programmes-vol/:id
- PATCH /api/programmes-vol/:id
- DELETE /api/programmes-vol/:id
- POST /api/programmes-vol/:id/valider
- POST /api/programmes-vol/:id/activer
- POST /api/programmes-vol/:id/suspendre
- POST /api/programmes-vol/import

### Charges (12+ routes)
- PUT /api/charges/:id/categories-detaillees
- PUT /api/charges/:id/classes
- PUT /api/charges/:id/besoins-medicaux
- PUT /api/charges/:id/mineurs
- POST /api/charges/:id/convertir-categories-detaillees
- PUT /api/charges/:id/fret-detaille
- POST /api/charges/:id/marchandises-dangereuses
- DELETE /api/charges/:id/marchandises-dangereuses/:mdId
- GET /api/charges/statistiques/passagers
- GET /api/charges/statistiques/fret

### Avions (9+ routes)
- PUT /api/avions/:id/configuration
- POST /api/avions/:id/versions
- GET /api/avions/:id/versions
- GET /api/avions/:id/versions/:numero
- POST /api/avions/:id/versions/:numero/restaurer
- GET /api/avions/:id/versions/comparer
- PUT /api/avions/:id/revision
- GET /api/avions/revisions/prochaines
- GET /api/avions/statistiques/configurations

### Notifications (7 routes)
- GET /api/notifications
- GET /api/notifications/count-non-lues
- PATCH /api/notifications/lire-toutes
- GET /api/notifications/statistiques
- POST /api/notifications (MANAGER uniquement)
- PATCH /api/notifications/:id/lire
- PATCH /api/notifications/:id/archiver
- DELETE /api/notifications/:id

### Alertes SLA (7 routes)
- GET /api/sla/rapport (MANAGER uniquement)
- GET /api/sla/configuration
- PUT /api/sla/configuration (MANAGER uniquement)
- POST /api/sla/surveiller/crv (MANAGER uniquement)
- POST /api/sla/surveiller/phases (MANAGER uniquement)
- GET /api/sla/crv/:id
- GET /api/sla/phase/:id

### Validation CRV (3 routes)
- POST /api/validation/:id/valider (SUPERVISEUR, MANAGER)
- POST /api/validation/:id/deverrouiller (MANAGER uniquement)
- GET /api/validation/:id

---

**TOTAL**: 70+ routes API documentées

**Document complet** — Version 1.0.0 — 2026-01-05
**Destinataire**: Équipe Frontend
**Mise à jour**: À chaque modification backend
