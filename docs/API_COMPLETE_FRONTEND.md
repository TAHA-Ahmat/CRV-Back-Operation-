# 📚 API COMPLÈTE BACKEND CRV - DOCUMENTATION FRONTEND

**Version**: 1.0.0
**Date**: 2026-01-06
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

**Inscription utilisateur**

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
  protect,
  excludeQualite,
  body('volId').notEmpty().withMessage('Vol requis'),
  validate,
  verifierPhasesAutoriseesCreationCRV,
  auditLog('CREATION')
]
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
    "derniereModification": "2026-01-05T12:00:00.000Z"
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
    }
  ]
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
  protect
]
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
  protect
]
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
  "phases": [],
  "charges": [],
  "evenements": [],
  "observations": []
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
  "crv": { }
}
```

---

### 2.5. POST /api/crv/:id/charges

**Ajouter une charge opérationnelle**

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
  "evenement": { }
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
  "observation": { }
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
  "data": [ ]
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

**Obtenir tous les CRV annulés**

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
        "annulePar": { },
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

**Obtenir les statistiques des annulations**

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

**Vérifier si un CRV peut être annulé**

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

**Annuler un CRV**

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
  "commentaireAnnulation": "Conditions météo défavorables"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV annulé avec succès",
  "crv": {
    "statut": "ANNULE",
    "annulation": { }
  }
}
```

---

### 2.15. POST /api/crv/:id/reactiver

**Réactiver un CRV annulé**

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

### 3.3. POST /api/phases/:id/non-realise

**Marquer une phase comme non réalisée**

#### Route
```
POST /api/phases/:id/non-realise
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  verifierCoherencePhaseTypeOperation,
  body('motifNonRealisation').isIn(['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE']),
  body('detailMotif').notEmpty().withMessage('Détail de justification requis'),
  validate,
  verifierJustificationNonRealisation,
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
POST /api/phases/6789abcd1234567890phase1/non-realise
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "motifNonRealisation": "CONDITIONS_METEO",
  "detailMotif": "Conditions météorologiques défavorables empêchant l'opération"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Phase marquée comme non réalisée",
  "phase": {
    "_id": "6789abcd1234567890phase1",
    "statut": "NON_REALISE",
    "motifNonRealisation": "CONDITIONS_METEO",
    "detailMotif": "Conditions météorologiques défavorables empêchant l'opération"
  }
}
```

---

### 3.4. PATCH /api/phases/:id

**Mettre à jour une phase**

#### Route
```
PATCH /api/phases/:id
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

#### Requête Frontend
```javascript
PATCH /api/phases/6789abcd1234567890phase1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "dureePrevue": 30,
  "personnelAffecte": ["6789abcd1234567890pers1", "6789abcd1234567890pers2"]
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Phase mise à jour avec succès",
  "phase": { }
}
```

---

## 4. VOLS

### 4.1. POST /api/vols

**Créer un nouveau vol**

#### Route
```
POST /api/vols
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite,
  body('numeroVol').notEmpty().withMessage('Numéro de vol requis'),
  body('typeOperation').isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND']),
  body('compagnieAerienne').notEmpty(),
  body('codeIATA').isLength({ min: 2, max: 2 }),
  body('dateVol').isISO8601(),
  validate
]
```

#### Requête Frontend
```javascript
POST /api/vols
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "numeroVol": "AF1234",
  "typeOperation": "ARRIVEE",
  "compagnieAerienne": "Air France",
  "codeIATA": "AF",
  "dateVol": "2026-01-06T10:30:00.000Z",
  "avion": "6789abcd1234567890avion1"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Vol créé avec succès",
  "vol": {
    "_id": "6789abcd1234567890vol1",
    "numeroVol": "AF1234",
    "typeOperation": "ARRIVEE",
    "compagnieAerienne": "Air France",
    "codeIATA": "AF",
    "dateVol": "2026-01-06T10:30:00.000Z",
    "programmation": {
      "estProgramme": false,
      "programmeVolId": null,
      "typeVolHorsProgramme": null,
      "raisonHorsProgramme": null
    }
  }
}
```

---

### 4.2. GET /api/vols

**Lister tous les vols**

#### Route
```
GET /api/vols
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols?compagnie=Air France&dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 50,
  "data": [ ]
}
```

---

### 4.3. GET /api/vols/:id

**Obtenir un vol par ID**

#### Route
```
GET /api/vols/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols/6789abcd1234567890vol1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "vol": { }
}
```

---

### 4.4. PATCH /api/vols/:id

**Mettre à jour un vol**

#### Route
```
PATCH /api/vols/:id
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PATCH /api/vols/6789abcd1234567890vol1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "numeroVol": "AF1235",
  "dateVol": "2026-01-06T11:00:00.000Z"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Vol mis à jour avec succès",
  "vol": { }
}
```

---

### 4.5. POST /api/vols/:id/lier-programme

**Lier un vol à un programme saisonnier**

#### Route
```
POST /api/vols/:id/lier-programme
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/vols/6789abcd1234567890vol1/lier-programme
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "programmeVolId": "6789abcd1234567890prog1"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Vol lié au programme avec succès",
  "vol": {
    "programmation": {
      "estProgramme": true,
      "programmeVolId": "6789abcd1234567890prog1"
    }
  }
}
```

---

### 4.6. POST /api/vols/:id/marquer-hors-programme

**Marquer un vol comme hors programme**

#### Route
```
POST /api/vols/:id/marquer-hors-programme
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/vols/6789abcd1234567890vol1/marquer-hors-programme
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "typeVolHorsProgramme": "CHARTER",
  "raisonHorsProgramme": "Vol charter exceptionnel pour événement spécial"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Vol marqué comme hors programme",
  "vol": {
    "programmation": {
      "estProgramme": false,
      "typeVolHorsProgramme": "CHARTER",
      "raisonHorsProgramme": "Vol charter exceptionnel pour événement spécial"
    }
  }
}
```

---

### 4.7. POST /api/vols/:id/detacher-programme

**Détacher un vol d'un programme saisonnier**

#### Route
```
POST /api/vols/:id/detacher-programme
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/vols/6789abcd1234567890vol1/detacher-programme
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Vol détaché du programme",
  "vol": {
    "programmation": {
      "estProgramme": false,
      "programmeVolId": null
    }
  }
}
```

---

### 4.8. GET /api/vols/:id/suggerer-programmes

**Suggérer des programmes compatibles pour un vol**

#### Route
```
GET /api/vols/:id/suggerer-programmes
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols/6789abcd1234567890vol1/suggerer-programmes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "suggestions": [
    {
      "_id": "6789abcd1234567890prog1",
      "nomProgramme": "Programme Hiver AF Paris-Nice",
      "compatibilite": 95
    }
  ]
}
```

---

### 4.9. GET /api/vols/programme/:programmeVolId

**Obtenir tous les vols d'un programme saisonnier**

#### Route
```
GET /api/vols/programme/:programmeVolId
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols/programme/6789abcd1234567890prog1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 25,
  "vols": [ ]
}
```

---

### 4.10. GET /api/vols/hors-programme

**Obtenir tous les vols hors programme**

#### Route
```
GET /api/vols/hors-programme
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols/hors-programme?typeVolHorsProgramme=CHARTER&dateDebut=2026-01-01
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params**:
- `typeVolHorsProgramme`: CHARTER | VOL_FERRY | MEDICAL | TECHNIQUE | AUTRE
- `compagnieAerienne`: Nom de la compagnie
- `dateDebut`: Date ISO
- `dateFin`: Date ISO

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 12,
  "vols": [ ]
}
```

---

### 4.11. GET /api/vols/statistiques/programmes

**Obtenir les statistiques vols programmés vs hors programme**

#### Route
```
GET /api/vols/statistiques/programmes
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/vols/statistiques/programmes?compagnieAerienne=Air France&dateDebut=2026-01-01
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "totalVols": 150,
    "volsProgrammes": 120,
    "volsHorsProgramme": 30,
    "tauxProgrammes": 80,
    "parTypeHorsProgramme": {
      "CHARTER": 15,
      "VOL_FERRY": 8,
      "MEDICAL": 5,
      "TECHNIQUE": 2
    }
  }
}
```

---

## 5. PROGRAMMES VOL

### 5.1. POST /api/programmes-vol

**Créer un nouveau programme vol saisonnier**

#### Route
```
POST /api/programmes-vol
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/programmes-vol
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nomProgramme": "Programme Hiver AF Paris-Nice",
  "compagnieAerienne": "Air France",
  "typeOperation": "TURN_AROUND",
  "recurrence": {
    "type": "HEBDOMADAIRE",
    "joursActifs": [1, 3, 5],
    "heureDepart": "10:00",
    "heureArrivee": "11:30"
  },
  "detailsVol": {
    "numeroVolType": "AF77XX",
    "origine": "CDG",
    "destination": "NCE"
  },
  "dateDebut": "2026-12-01",
  "dateFin": "2027-03-31"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Programme vol créé avec succès",
  "programme": {
    "_id": "6789abcd1234567890prog1",
    "nomProgramme": "Programme Hiver AF Paris-Nice",
    "statut": "BROUILLON",
    "actif": false
  }
}
```

---

### 5.2. GET /api/programmes-vol

**Récupérer tous les programmes vol**

#### Route
```
GET /api/programmes-vol
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/programmes-vol?compagnieAerienne=Air France&statut=ACTIF
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query params**:
- `compagnieAerienne`: Nom de la compagnie
- `statut`: BROUILLON | VALIDE | ACTIF | SUSPENDU
- `actif`: true | false
- `dateDebut`: Date ISO
- `dateFin`: Date ISO

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 15,
  "programmes": [ ]
}
```

---

### 5.3. GET /api/programmes-vol/:id

**Récupérer un programme vol par ID**

#### Route
```
GET /api/programmes-vol/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/programmes-vol/6789abcd1234567890prog1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "programme": { }
}
```

---

### 5.4. PATCH /api/programmes-vol/:id

**Mettre à jour un programme vol**

#### Route
```
PATCH /api/programmes-vol/:id
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PATCH /api/programmes-vol/6789abcd1234567890prog1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nomProgramme": "Programme Hiver AF Paris-Nice (Modifié)",
  "remarques": "Mise à jour des horaires"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Programme mis à jour avec succès",
  "programme": { }
}
```

---

### 5.5. DELETE /api/programmes-vol/:id

**Supprimer un programme vol**

#### Route
```
DELETE /api/programmes-vol/:id
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
DELETE /api/programmes-vol/6789abcd1234567890prog1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Programme supprimé avec succès"
}
```

---

### 5.6. POST /api/programmes-vol/:id/valider

**Valider un programme vol saisonnier**

#### Route
```
POST /api/programmes-vol/:id/valider
```

#### Middlewares
```javascript
[
  protect,
  authorize('SUPERVISEUR', 'MANAGER')
]
```

#### Requête Frontend
```javascript
POST /api/programmes-vol/6789abcd1234567890prog1/valider
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Programme validé avec succès",
  "programme": {
    "statut": "VALIDE"
  }
}
```

---

### 5.7. POST /api/programmes-vol/:id/activer

**Activer un programme vol validé**

#### Route
```
POST /api/programmes-vol/:id/activer
```

#### Middlewares
```javascript
[
  protect,
  authorize('SUPERVISEUR', 'MANAGER')
]
```

#### Requête Frontend
```javascript
POST /api/programmes-vol/6789abcd1234567890prog1/activer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Programme activé avec succès",
  "programme": {
    "statut": "ACTIF",
    "actif": true
  }
}
```

---

### 5.8. POST /api/programmes-vol/:id/suspendre

**Suspendre un programme vol actif**

#### Route
```
POST /api/programmes-vol/:id/suspendre
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/programmes-vol/6789abcd1234567890prog1/suspendre
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "raison": "Maintenance saisonnière"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Programme suspendu avec succès",
  "programme": {
    "statut": "SUSPENDU",
    "actif": false
  }
}
```

---

### 5.9. GET /api/programmes-vol/applicables/:date

**Trouver les programmes applicables pour une date**

#### Route
```
GET /api/programmes-vol/applicables/:date
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/programmes-vol/applicables/2026-01-15?compagnieAerienne=Air France
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "date": "2026-01-15",
  "programmes": [ ]
}
```

---

### 5.10. POST /api/programmes-vol/import

**Importer plusieurs programmes depuis un fichier JSON**

#### Route
```
POST /api/programmes-vol/import
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/programmes-vol/import
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "programmes": [
    { },
    { }
  ]
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Programmes importés avec succès",
  "imported": 2,
  "failed": 0
}
```

---

## 6. CHARGES (PASSAGERS & FRET)

### 6.1. PUT /api/charges/:id/categories-detaillees

**Mettre à jour les catégories détaillées de passagers**

#### Route
```
PUT /api/charges/:id/categories-detaillees
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/charges/6789abcd1234567890charge1/categories-detaillees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "bebes": 2,
  "enfants": 10,
  "adolescents": 5,
  "adultes": 100,
  "seniors": 18,
  "pmrFauteuilRoulant": 2,
  "pmrMarcheAssistee": 1,
  "transitDirect": 8,
  "vip": 3
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Catégories détaillées mises à jour",
  "charge": { }
}
```

---

### 6.2. PUT /api/charges/:id/classes

**Mettre à jour les classes de passagers**

#### Route
```
PUT /api/charges/:id/classes
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/charges/6789abcd1234567890charge1/classes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "premiere": 12,
  "affaires": 28,
  "economique": 110
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Classes mises à jour",
  "charge": { }
}
```

---

### 6.3. PUT /api/charges/:id/besoins-medicaux

**Mettre à jour les besoins médicaux**

#### Route
```
PUT /api/charges/:id/besoins-medicaux
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/charges/6789abcd1234567890charge1/besoins-medicaux
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "oxygeneBord": 1,
  "brancardier": 0,
  "accompagnementMedical": 2
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Besoins médicaux mis à jour",
  "charge": { }
}
```

---

### 6.4. PUT /api/charges/:id/mineurs

**Mettre à jour les informations sur les mineurs**

#### Route
```
PUT /api/charges/:id/mineurs
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/charges/6789abcd1234567890charge1/mineurs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mineurNonAccompagne": 3,
  "bebeNonAccompagne": 0
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Informations mineurs mises à jour",
  "charge": { }
}
```

---

### 6.5. POST /api/charges/:id/convertir-categories-detaillees

**Convertir les catégories basiques en détaillées**

#### Route
```
POST /api/charges/:id/convertir-categories-detaillees
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/charges/6789abcd1234567890charge1/convertir-categories-detaillees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mapping": {
    "adultes": 100,
    "enfants": 15
  }
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Conversion effectuée avec succès",
  "charge": { }
}
```

---

### 6.6. PUT /api/charges/:id/fret-detaille

**Mettre à jour le fret détaillé**

#### Route
```
PUT /api/charges/:id/fret-detaille
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/charges/6789abcd1234567890charge1/fret-detaille
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "categoriesFret": {
    "general": { "poids": 5000, "volume": 10 },
    "perissable": { "poids": 1000, "volume": 2, "temperature": "-18°C" }
  },
  "logistique": {
    "nombreColis": 150,
    "nombrePalettes": 5,
    "numeroLTA": "LTA123456"
  }
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Fret détaillé mis à jour",
  "charge": { }
}
```

---

### 6.7. POST /api/charges/:id/marchandises-dangereuses

**Ajouter une marchandise dangereuse**

#### Route
```
POST /api/charges/:id/marchandises-dangereuses
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/charges/6789abcd1234567890charge1/marchandises-dangereuses
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "codeONU": "UN1950",
  "classeONU": "2.1",
  "designationOfficielle": "Aérosols inflammables",
  "quantite": 100,
  "unite": "kg",
  "groupeEmballage": "II"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Marchandise dangereuse ajoutée",
  "charge": { }
}
```

---

### 6.8. DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId

**Retirer une marchandise dangereuse**

#### Route
```
DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
DELETE /api/charges/6789abcd1234567890charge1/marchandises-dangereuses/6789abc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Marchandise dangereuse retirée"
}
```

---

### 6.9. POST /api/charges/valider-marchandise-dangereuse

**Valider une marchandise dangereuse**

#### Route
```
POST /api/charges/valider-marchandise-dangereuse
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
POST /api/charges/valider-marchandise-dangereuse
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "codeONU": "UN1950",
  "classeONU": "2.1"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "valide": true,
  "details": { }
}
```

---

### 6.10. GET /api/charges/marchandises-dangereuses

**Obtenir les charges avec marchandises dangereuses**

#### Route
```
GET /api/charges/marchandises-dangereuses
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/charges/marchandises-dangereuses?crvId=6789abcd1234567890fedcba
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 5,
  "charges": [ ]
}
```

---

### 6.11. GET /api/charges/crv/:crvId/statistiques-passagers

**Obtenir les statistiques passagers pour un CRV**

#### Route
```
GET /api/charges/crv/:crvId/statistiques-passagers
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/charges/crv/6789abcd1234567890fedcba/statistiques-passagers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "totalPassagers": 150,
    "parCategorie": { },
    "parClasse": { }
  }
}
```

---

### 6.12. GET /api/charges/crv/:crvId/statistiques-fret

**Obtenir les statistiques fret pour un CRV**

#### Route
```
GET /api/charges/crv/:crvId/statistiques-fret
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/charges/crv/6789abcd1234567890fedcba/statistiques-fret
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "poidsTotal": 8000,
    "volumeTotal": 15,
    "parCategorie": { }
  }
}
```

---

### 6.13. GET /api/charges/statistiques/passagers

**Obtenir les statistiques globales des passagers**

#### Route
```
GET /api/charges/statistiques/passagers
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/charges/statistiques/passagers?dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "totalPassagers": 15000,
    "moyenneParVol": 150,
    "parCategorie": { }
  }
}
```

---

### 6.14. GET /api/charges/statistiques/fret

**Obtenir les statistiques globales du fret**

#### Route
```
GET /api/charges/statistiques/fret
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/charges/statistiques/fret?dateDebut=2026-01-01&dateFin=2026-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "poidsTotal": 500000,
    "volumeTotal": 1000,
    "parCategorie": { }
  }
}
```

---

## 7. AVIONS (CONFIGURATION)

### 7.1. PUT /api/avions/:id/configuration

**Mettre à jour la configuration d'un avion**

#### Route
```
PUT /api/avions/:id/configuration
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/avions/6789abcd1234567890avion1/configuration
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sieges": {
    "premiere": 12,
    "affaires": 28,
    "economique": 150
  },
  "equipements": {
    "wifi": true,
    "divertissement": true
  }
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Configuration mise à jour",
  "avion": { }
}
```

---

### 7.2. POST /api/avions/:id/versions

**Créer une nouvelle version de configuration**

#### Route
```
POST /api/avions/:id/versions
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/avions/6789abcd1234567890avion1/versions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "numeroVersion": "2.0",
  "modifications": "Ajout de sièges classe affaires",
  "configuration": { }
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Nouvelle version créée",
  "version": { }
}
```

---

### 7.3. GET /api/avions/:id/versions

**Obtenir l'historique des versions**

#### Route
```
GET /api/avions/:id/versions
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/avions/6789abcd1234567890avion1/versions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 5,
  "versions": [ ]
}
```

---

### 7.4. GET /api/avions/:id/versions/:numeroVersion

**Obtenir une version spécifique**

#### Route
```
GET /api/avions/:id/versions/:numeroVersion
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/avions/6789abcd1234567890avion1/versions/2.0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "version": { }
}
```

---

### 7.5. POST /api/avions/:id/versions/:numeroVersion/restaurer

**Restaurer une version antérieure**

#### Route
```
POST /api/avions/:id/versions/:numeroVersion/restaurer
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
POST /api/avions/6789abcd1234567890avion1/versions/1.5/restaurer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Version restaurée avec succès",
  "avion": { }
}
```

---

### 7.6. GET /api/avions/:id/versions/comparer

**Comparer deux versions**

#### Route
```
GET /api/avions/:id/versions/comparer
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/avions/6789abcd1234567890avion1/versions/comparer?version1=1.0&version2=2.0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "comparaison": {
    "differences": [ ]
  }
}
```

---

### 7.7. PUT /api/avions/:id/revision

**Mettre à jour les informations de révision**

#### Route
```
PUT /api/avions/:id/revision
```

#### Middlewares
```javascript
[
  protect,
  excludeQualite
]
```

#### Requête Frontend
```javascript
PUT /api/avions/6789abcd1234567890avion1/revision
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "date": "2026-01-05",
  "type": "MAJEURE",
  "prochaineDatePrevue": "2026-07-05"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Révision mise à jour",
  "avion": { }
}
```

---

### 7.8. GET /api/avions/revisions/prochaines

**Obtenir les avions nécessitant une révision prochainement**

#### Route
```
GET /api/avions/revisions/prochaines
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/avions/revisions/prochaines?joursAvance=30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "count": 3,
  "avions": [ ]
}
```

---

### 7.9. GET /api/avions/statistiques/configurations

**Obtenir les statistiques de configuration des avions**

#### Route
```
GET /api/avions/statistiques/configurations
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/avions/statistiques/configurations?compagnie=Air France
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "totalAvions": 50,
    "parConfiguration": { }
  }
}
```

---

## 8. NOTIFICATIONS

### 8.1. GET /api/notifications

**Obtenir les notifications de l'utilisateur connecté**

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
      "lu": false,
      "priorite": "HAUTE",
      "createdAt": "2026-01-05T14:00:00.000Z"
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
    "lu": true,
    "dateLecture": "2026-01-05T15:00:00.000Z"
  }
}
```

---

### 8.4. PATCH /api/notifications/lire-toutes

**Marquer toutes les notifications comme lues**

#### Route
```
PATCH /api/notifications/lire-toutes
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
PATCH /api/notifications/lire-toutes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Toutes les notifications marquées comme lues",
  "count": 15
}
```

---

### 8.5. PATCH /api/notifications/:id/archiver

**Archiver une notification**

#### Route
```
PATCH /api/notifications/:id/archiver
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
PATCH /api/notifications/6789abcd1234567890notif1/archiver
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Notification archivée",
  "notification": {
    "archive": true,
    "dateArchivage": "2026-01-05T16:00:00.000Z"
  }
}
```

---

### 8.6. DELETE /api/notifications/:id

**Supprimer une notification**

#### Route
```
DELETE /api/notifications/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
DELETE /api/notifications/6789abcd1234567890notif1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Notification supprimée"
}
```

---

### 8.7. GET /api/notifications/statistiques

**Obtenir les statistiques des notifications**

#### Route
```
GET /api/notifications/statistiques
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/notifications/statistiques
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "nonLues": 5,
    "parType": {
      "INFO": 20,
      "WARNING": 15,
      "ALERTE_SLA": 10
    }
  }
}
```

---

### 8.8. POST /api/notifications

**Créer une notification système**

#### Route
```
POST /api/notifications
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
POST /api/notifications
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "destinataire": "6789abcd1234567890user1",
  "type": "INFO",
  "titre": "Mise à jour système",
  "message": "Le système sera en maintenance ce soir",
  "priorite": "NORMALE"
}
```

#### Réponse Succès (201)
```json
{
  "success": true,
  "message": "Notification créée",
  "notification": { }
}
```

---

## 9. ALERTES SLA

### 9.1. GET /api/sla/rapport

**Obtenir le rapport SLA complet**

#### Route
```
GET /api/sla/rapport
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
GET /api/sla/rapport
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "rapport": {
    "crv": {
      "total": 150,
      "enRetard": 5,
      "conformes": 145
    },
    "phases": {
      "total": 600,
      "enRetard": 12,
      "conformes": 588
    }
  }
}
```

---

### 9.2. GET /api/sla/configuration

**Obtenir la configuration SLA actuelle**

#### Route
```
GET /api/sla/configuration
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/sla/configuration
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "configuration": {
    "CRV": {
      "delaiMaxCompletion": 240
    },
    "PHASE": {
      "delaiMaxParType": { }
    }
  }
}
```

---

### 9.3. PUT /api/sla/configuration

**Configurer les SLA personnalisés**

#### Route
```
PUT /api/sla/configuration
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
PUT /api/sla/configuration
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "CRV": {
    "delaiMaxCompletion": 300
  },
  "PHASE": {
    "ACCUEIL_AVION": 15,
    "DEBARQUEMENT_PASSAGERS": 30
  }
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Configuration SLA mise à jour",
  "configuration": { }
}
```

---

### 9.4. POST /api/sla/surveiller/crv

**Surveiller tous les CRV actifs**

#### Route
```
POST /api/sla/surveiller/crv
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
POST /api/sla/surveiller/crv
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Surveillance CRV effectuée",
  "alertesEnvoyees": 3
}
```

---

### 9.5. POST /api/sla/surveiller/phases

**Surveiller toutes les phases actives**

#### Route
```
POST /api/sla/surveiller/phases
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER')
]
```

#### Requête Frontend
```javascript
POST /api/sla/surveiller/phases
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Surveillance phases effectuée",
  "alertesEnvoyees": 5
}
```

---

### 9.6. GET /api/sla/crv/:id

**Vérifier le SLA d'un CRV spécifique**

#### Route
```
GET /api/sla/crv/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/sla/crv/6789abcd1234567890fedcba
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "sla": {
    "conforme": false,
    "retard": 15,
    "delaiMax": 240
  }
}
```

---

### 9.7. GET /api/sla/phase/:id

**Vérifier le SLA d'une phase spécifique**

#### Route
```
GET /api/sla/phase/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/sla/phase/6789abcd1234567890phase1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "sla": {
    "conforme": true,
    "dureeReelle": 12,
    "delaiMax": 15
  }
}
```

---

## 10. VALIDATION CRV

### 10.1. POST /api/validation/:id/valider

**Valider un CRV**

#### Route
```
POST /api/validation/:id/valider
```

#### Middlewares
```javascript
[
  protect,
  authorize('SUPERVISEUR', 'MANAGER'),
  auditLog('VALIDATION')
]
```

#### Requête Frontend
```javascript
POST /api/validation/6789abcd1234567890fedcba/valider
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "commentaire": "CRV complet et conforme"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV validé avec succès",
  "crv": {
    "statut": "VALIDE"
  }
}
```

---

### 10.2. POST /api/validation/:id/deverrouiller

**Déverrouiller un CRV**

#### Route
```
POST /api/validation/:id/deverrouiller
```

#### Middlewares
```javascript
[
  protect,
  authorize('MANAGER'),
  auditLog('MISE_A_JOUR')
]
```

#### Requête Frontend
```javascript
POST /api/validation/6789abcd1234567890fedcba/deverrouiller
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "raison": "Correction nécessaire suite à erreur de saisie"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "CRV déverrouillé avec succès",
  "crv": {
    "statut": "EN_COURS"
  }
}
```

---

### 10.3. GET /api/validation/:id

**Obtenir les informations de validation d'un CRV**

#### Route
```
GET /api/validation/:id
```

#### Middlewares
```javascript
[
  protect
]
```

#### Requête Frontend
```javascript
GET /api/validation/6789abcd1234567890fedcba
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "validation": {
    "statut": "VALIDE",
    "validePar": { },
    "dateValidation": "2026-01-05T16:00:00.000Z"
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

---

## 12. MIDDLEWARES

### 12.1. protect

**Vérification d'authentification JWT**

**Fichier**: `src/middlewares/auth.middleware.js`

### 12.2. authorize

**Restriction par rôle**

**Fichier**: `src/middlewares/auth.middleware.js`

**Utilisation**:
```javascript
// Un seul rôle
router.post('/:id/valider', protect, authorize('MANAGER'), validerCRV);

// Plusieurs rôles
router.post('/:id/valider', protect, authorize('SUPERVISEUR', 'MANAGER'), validerCRV);
```

### 12.3. excludeQualite

**Bloquer QUALITE (P0-1 fix)**

**Fichier**: `src/middlewares/auth.middleware.js`

### 12.4. validate

**Validation express-validator**

**Fichier**: `src/middlewares/validation.middleware.js`

### 12.5. auditLog

**Traçabilité des actions**

**Fichier**: `src/middlewares/auditLog.middleware.js`

---

## RÉSUMÉ DES ROUTES PAR DOMAINE

### Authentification (3 routes)
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### CRV (18 routes)
- POST /api/crv
- GET /api/crv
- GET /api/crv/:id
- PATCH /api/crv/:id
- POST /api/crv/:id/charges
- POST /api/crv/:id/evenements
- POST /api/crv/:id/observations
- GET /api/crv/search
- GET /api/crv/stats
- GET /api/crv/export
- GET /api/crv/annules
- GET /api/crv/statistiques/annulations
- GET /api/crv/:id/peut-annuler
- POST /api/crv/:id/annuler
- POST /api/crv/:id/reactiver
- GET /api/crv/archive/status
- POST /api/crv/archive/test
- POST /api/crv/:id/archive

### Phases (4 routes)
- POST /api/phases/:id/demarrer
- POST /api/phases/:id/terminer
- POST /api/phases/:id/non-realise
- PATCH /api/phases/:id

### Vols (11 routes)
- POST /api/vols
- GET /api/vols
- GET /api/vols/:id
- PATCH /api/vols/:id
- POST /api/vols/:id/lier-programme
- POST /api/vols/:id/marquer-hors-programme
- POST /api/vols/:id/detacher-programme
- GET /api/vols/:id/suggerer-programmes
- GET /api/vols/programme/:programmeVolId
- GET /api/vols/hors-programme
- GET /api/vols/statistiques/programmes

### Programmes Vol (10 routes)
- POST /api/programmes-vol
- GET /api/programmes-vol
- GET /api/programmes-vol/:id
- PATCH /api/programmes-vol/:id
- DELETE /api/programmes-vol/:id
- POST /api/programmes-vol/:id/valider
- POST /api/programmes-vol/:id/activer
- POST /api/programmes-vol/:id/suspendre
- GET /api/programmes-vol/applicables/:date
- POST /api/programmes-vol/import

### Charges (14 routes)
- PUT /api/charges/:id/categories-detaillees
- PUT /api/charges/:id/classes
- PUT /api/charges/:id/besoins-medicaux
- PUT /api/charges/:id/mineurs
- POST /api/charges/:id/convertir-categories-detaillees
- PUT /api/charges/:id/fret-detaille
- POST /api/charges/:id/marchandises-dangereuses
- DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
- POST /api/charges/valider-marchandise-dangereuse
- GET /api/charges/marchandises-dangereuses
- GET /api/charges/crv/:crvId/statistiques-passagers
- GET /api/charges/crv/:crvId/statistiques-fret
- GET /api/charges/statistiques/passagers
- GET /api/charges/statistiques/fret

### Avions (9 routes)
- PUT /api/avions/:id/configuration
- POST /api/avions/:id/versions
- GET /api/avions/:id/versions
- GET /api/avions/:id/versions/:numeroVersion
- POST /api/avions/:id/versions/:numeroVersion/restaurer
- GET /api/avions/:id/versions/comparer
- PUT /api/avions/:id/revision
- GET /api/avions/revisions/prochaines
- GET /api/avions/statistiques/configurations

### Notifications (8 routes)
- GET /api/notifications
- GET /api/notifications/count-non-lues
- PATCH /api/notifications/:id/lire
- PATCH /api/notifications/lire-toutes
- PATCH /api/notifications/:id/archiver
- DELETE /api/notifications/:id
- GET /api/notifications/statistiques
- POST /api/notifications

### Alertes SLA (7 routes)
- GET /api/sla/rapport
- GET /api/sla/configuration
- PUT /api/sla/configuration
- POST /api/sla/surveiller/crv
- POST /api/sla/surveiller/phases
- GET /api/sla/crv/:id
- GET /api/sla/phase/:id

### Validation CRV (3 routes)
- POST /api/validation/:id/valider
- POST /api/validation/:id/deverrouiller
- GET /api/validation/:id

---

**TOTAL**: 87 routes API documentées

**Document complet** — Version 1.0.0 — 2026-01-06
**Destinataire**: Équipe Frontend
**Mise à jour**: À chaque modification backend
