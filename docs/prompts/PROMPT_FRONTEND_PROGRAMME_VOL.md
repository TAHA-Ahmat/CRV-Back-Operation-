# PROMPT FRONTEND : Programme de Vol Saisonnier

**Date** : 2026-01-12
**Version** : 1.1
**Backend** : Pret et deploye
**Statut** : En attente d'implementation Frontend

---

## 1. CONTEXTE METIER

### 1.1 Qu'est-ce qu'un Programme de Vol ?

Le programme de vol est un document de planification saisonnier qui definit l'ensemble des vols recurrents operes sur une escale (N'Djamena). Il couvre une periode donnee (ex: saison Hiver ou Ete) et detaille les operations du **lundi au dimanche**.

### 1.2 Objectifs

- Planifier les operations au sol (CRV)
- Anticiper les ressources (personnel, materiel)
- Assurer la tracabilite des vols programmes vs hors-programme
- Fournir des statistiques operationnelles

### 1.3 Lien avec le CRV

Lors de la creation d'un CRV, l'utilisateur peut :
- **MODE 1** : Selectionner un vol du programme → CRV pre-rempli
- **MODE 2** : Creer un vol generique → CRV manuel

---

## 2. MODELE DE DONNEES

### 2.1 Structure complete d'un Programme Vol

```typescript
interface ProgrammeVolSaisonnier {
  // ===== IDENTIFICATION =====
  _id: ObjectId;
  nomProgramme: string;              // "Ethiopian Quotidien Hiver 2025"
  compagnieAerienne: string;         // "ETHIOPIAN AIRLINES"
  codeCompagnie: string | null;      // "ET" (code IATA 2-3 lettres)

  // ===== CATEGORISATION =====
  typeOperation: 'ARRIVEE' | 'DEPART' | 'TURN_AROUND';
  categorieVol: 'PASSAGER' | 'CARGO' | 'DOMESTIQUE';  // Default: 'PASSAGER'

  // ===== ROUTE =====
  route: {
    provenance: string | null;       // "ADD" (code IATA)
    destination: string | null;      // "ADD"
    escales: string[];               // ["NIM", "NSI"]
  };
  nightStop: boolean;                // Default: false

  // ===== RECURRENCE =====
  recurrence: {
    frequence: 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'BIMENSUEL' | 'MENSUEL';
    joursSemaine: number[];          // [0,1,2,3,4,5,6] où 0=Dim, 1=Lun...
    dateDebut: Date;                 // "2025-10-26"
    dateFin: Date;                   // "2026-03-28"
  };

  // ===== DETAILS VOL =====
  detailsVol: {
    numeroVolBase: string;           // "ET939"
    numeroVolRetour: string | null;  // "ET938" (pour turnaround)
    avionType: string | null;        // "B737-800"
    configurationSieges: string | null; // "16C138Y", "CARGO", "TBN"
    horairePrevu: {
      heureArrivee: string | null;   // "12:10" (format HH:MM)
      heureDepart: string | null;    // "14:05"
    };
    capacitePassagers: number | null;
    capaciteFret: number | null;     // en kg
  };

  // ===== STATUT ET VALIDATION =====
  statut: 'BROUILLON' | 'VALIDE' | 'ACTIF' | 'SUSPENDU' | 'TERMINE';
  actif: boolean;
  validation: {
    valide: boolean;
    validePar: ObjectId | null;      // Ref User
    dateValidation: Date | null;
  };

  // ===== METADATA =====
  remarques: string | null;
  createdBy: ObjectId;               // Ref User
  updatedBy: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Cycle de vie du statut

```
BROUILLON ──► VALIDE ──► ACTIF ──► SUSPENDU
                │          │
                │          └──► TERMINE
                │
                └──► (modifications possibles)
```

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `BROUILLON` | En cours de creation | Modifier, Valider, Supprimer |
| `VALIDE` | Approuve, pret a activer | Activer, Modifier, Supprimer |
| `ACTIF` | En production | Suspendre |
| `SUSPENDU` | Temporairement desactive | Reactiver, Supprimer |
| `TERMINE` | Periode ecoulee | Lecture seule |

### 2.3 Categories de vol

| Categorie | Description | Exemples |
|-----------|-------------|----------|
| `PASSAGER` | Vol commercial passagers | AF830, ET939, TK635 |
| `CARGO` | Vol cargo/fret | ET3913, MS0548 |
| `DOMESTIQUE` | Vol interieur national | CH110, CH220 |

### 2.4 Configurations sieges connues

| Code | Business | Economy | Total | Type |
|------|----------|---------|-------|------|
| `16C135Y` | 16 | 135 | 151 | Passager |
| `16C138Y` | 16 | 138 | 154 | Passager |
| `16C102Y` | 16 | 102 | 118 | Passager |
| `JY159` | 0 | 159 | 159 | Passager |
| `CARGO` | - | - | - | Cargo |
| `TBN` | - | - | - | A definir |

---

## 3. API BACKEND

### 3.1 Base URL

```
/api/programmes-vol
```

### 3.2 Authentification

Toutes les routes necessitent un token JWT valide.

```
Authorization: Bearer <token>
```

### 3.3 Permissions par role

| Role | Lire | Creer | Modifier | Valider | Activer | Suspendre | Supprimer |
|------|------|-------|----------|---------|---------|-----------|-----------|
| AGENT_ESCALE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CHEF_EQUIPE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPERVISEUR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QUALITE | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ADMIN | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. ENDPOINTS CRUD

### 4.1 Creer un programme

```http
POST /api/programmes-vol
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (minimal)** :
```json
{
  "nomProgramme": "Ethiopian Airlines Quotidien",
  "compagnieAerienne": "ETHIOPIAN AIRLINES",
  "typeOperation": "TURN_AROUND",
  "recurrence": {
    "frequence": "QUOTIDIEN",
    "joursSemaine": [0, 1, 2, 3, 4, 5, 6],
    "dateDebut": "2025-10-26",
    "dateFin": "2026-03-28"
  },
  "detailsVol": {
    "numeroVolBase": "ET939"
  }
}
```

**Body (complet)** :
```json
{
  "nomProgramme": "Ethiopian Airlines Quotidien",
  "compagnieAerienne": "ETHIOPIAN AIRLINES",
  "codeCompagnie": "ET",
  "typeOperation": "TURN_AROUND",
  "categorieVol": "PASSAGER",
  "route": {
    "provenance": "ADD",
    "destination": "ADD",
    "escales": []
  },
  "nightStop": false,
  "recurrence": {
    "frequence": "QUOTIDIEN",
    "joursSemaine": [0, 1, 2, 3, 4, 5, 6],
    "dateDebut": "2025-10-26",
    "dateFin": "2026-03-28"
  },
  "detailsVol": {
    "numeroVolBase": "ET939",
    "numeroVolRetour": "ET938",
    "avionType": "B737-800",
    "configurationSieges": "16C138Y",
    "horairePrevu": {
      "heureArrivee": "12:10",
      "heureDepart": "14:05"
    },
    "capacitePassagers": 154,
    "capaciteFret": null
  },
  "remarques": "Vol quotidien Addis-Abeba"
}
```

**Response (201)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier créé avec succès",
  "data": { /* ProgrammeVolSaisonnier */ }
}
```

---

### 4.2 Lister les programmes

```http
GET /api/programmes-vol
Authorization: Bearer <token>
```

**Query parameters (tous optionnels)** :

| Parametre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `compagnieAerienne` | string | Filtrer par compagnie | `ETHIOPIAN AIRLINES` |
| `statut` | string | Filtrer par statut | `ACTIF` |
| `actif` | boolean | Programmes actifs uniquement | `true` |
| `categorieVol` | string | Filtrer par categorie | `CARGO` |
| `provenance` | string | Filtrer par origine | `ADD` |
| `destination` | string | Filtrer par destination | `CDG` |
| `nightStop` | boolean | Vols avec night stop | `true` |
| `codeCompagnie` | string | Code IATA compagnie | `ET` |
| `dateDebut` | date | Periode commence apres | `2025-10-01` |
| `dateFin` | date | Periode finit avant | `2026-04-01` |

**Exemples** :
```http
GET /api/programmes-vol?statut=ACTIF
GET /api/programmes-vol?categorieVol=CARGO
GET /api/programmes-vol?provenance=ADD&destination=ADD
GET /api/programmes-vol?compagnieAerienne=ETHIOPIAN%20AIRLINES&actif=true
```

**Response (200)** :
```json
{
  "success": true,
  "count": 42,
  "data": [ /* ProgrammeVolSaisonnier[] */ ]
}
```

---

### 4.3 Obtenir un programme par ID

```http
GET /api/programmes-vol/:id
Authorization: Bearer <token>
```

**Response (200)** :
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "nomProgramme": "Ethiopian Airlines Quotidien",
    "compagnieAerienne": "ETHIOPIAN AIRLINES",
    "codeCompagnie": "ET",
    "typeOperation": "TURN_AROUND",
    "categorieVol": "PASSAGER",
    "route": {
      "provenance": "ADD",
      "destination": "ADD",
      "escales": []
    },
    "nightStop": false,
    "recurrence": {
      "frequence": "QUOTIDIEN",
      "joursSemaine": [0, 1, 2, 3, 4, 5, 6],
      "dateDebut": "2025-10-26T00:00:00.000Z",
      "dateFin": "2026-03-28T00:00:00.000Z"
    },
    "detailsVol": {
      "numeroVolBase": "ET939",
      "numeroVolRetour": "ET938",
      "avionType": "B737-800",
      "configurationSieges": "16C138Y",
      "horairePrevu": {
        "heureArrivee": "12:10",
        "heureDepart": "14:05"
      },
      "capacitePassagers": 154,
      "capaciteFret": null
    },
    "statut": "ACTIF",
    "actif": true,
    "validation": {
      "valide": true,
      "validePar": { "_id": "...", "nom": "Dupont", "prenom": "Jean" },
      "dateValidation": "2025-10-20T10:30:00.000Z"
    },
    "remarques": "Vol quotidien",
    "createdBy": { "_id": "...", "nom": "Martin", "prenom": "Paul" },
    "updatedBy": null,
    "createdAt": "2025-10-15T08:00:00.000Z",
    "updatedAt": "2025-10-20T10:30:00.000Z"
  }
}
```

**Response (404)** :
```json
{
  "success": false,
  "message": "Programme vol saisonnier non trouvé"
}
```

---

### 4.4 Modifier un programme

```http
PATCH /api/programmes-vol/:id
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (partiel)** :
```json
{
  "remarques": "Mise a jour horaire",
  "detailsVol": {
    "horairePrevu": {
      "heureArrivee": "12:30",
      "heureDepart": "14:25"
    }
  }
}
```

**Response (200)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier mis à jour avec succès",
  "data": { /* ProgrammeVolSaisonnier */ }
}
```

**Response (400)** - Programme actif :
```json
{
  "success": false,
  "message": "Impossible de modifier un programme validé et actif. Suspendez-le d'abord."
}
```

---

### 4.5 Supprimer un programme

```http
DELETE /api/programmes-vol/:id
Authorization: Bearer <token>
```

**Response (200)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier supprimé avec succès"
}
```

**Response (400)** - Programme actif :
```json
{
  "success": false,
  "message": "Impossible de supprimer un programme actif. Suspendez-le d'abord."
}
```

---

## 5. ENDPOINTS D'ACTIONS

### 5.1 Valider un programme

```http
POST /api/programmes-vol/:id/valider
Authorization: Bearer <token>
```

**Prerequis** : statut = `BROUILLON`

**Response (200)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier validé avec succès",
  "data": { /* statut: 'VALIDE', validation.valide: true */ }
}
```

---

### 5.2 Activer un programme

```http
POST /api/programmes-vol/:id/activer
Authorization: Bearer <token>
```

**Prerequis** : statut = `VALIDE`, periode non ecoulee

**Response (200)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier activé avec succès",
  "data": { /* statut: 'ACTIF', actif: true */ }
}
```

---

### 5.3 Suspendre un programme

```http
POST /api/programmes-vol/:id/suspendre
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (optionnel)** :
```json
{
  "raison": "Maintenance avion"
}
```

**Prerequis** : statut = `ACTIF`

**Response (200)** :
```json
{
  "success": true,
  "message": "Programme vol saisonnier suspendu avec succès",
  "data": { /* statut: 'SUSPENDU', actif: false */ }
}
```

---

## 6. ENDPOINTS DE RECHERCHE

### 6.1 Programmes applicables pour une date

```http
GET /api/programmes-vol/applicables/:date
Authorization: Bearer <token>
```

**Params** : `date` au format `YYYY-MM-DD`

**Query parameters (optionnels)** :
- `compagnieAerienne` : Filtrer par compagnie
- `categorieVol` : PASSAGER, CARGO, DOMESTIQUE

**Exemples** :
```http
GET /api/programmes-vol/applicables/2025-11-15
GET /api/programmes-vol/applicables/2025-11-15?categorieVol=PASSAGER
GET /api/programmes-vol/applicables/2025-11-15?compagnieAerienne=AIR%20FRANCE
```

**Response (200)** :
```json
{
  "success": true,
  "count": 12,
  "data": [ /* Programmes actifs pour ce jour */ ]
}
```

---

### 6.2 Recherche par route

```http
GET /api/programmes-vol/par-route
Authorization: Bearer <token>
```

**Query parameters (au moins un requis)** :
- `provenance` : Code IATA origine
- `destination` : Code IATA destination
- `categorieVol` : PASSAGER, CARGO, DOMESTIQUE

**Exemples** :
```http
GET /api/programmes-vol/par-route?provenance=ADD
GET /api/programmes-vol/par-route?destination=CDG
GET /api/programmes-vol/par-route?provenance=ADD&destination=ADD
GET /api/programmes-vol/par-route?categorieVol=CARGO
```

**Response (200)** :
```json
{
  "success": true,
  "count": 5,
  "data": [ /* ProgrammeVolSaisonnier[] */ ]
}
```

---

## 7. ENDPOINTS STATISTIQUES

### 7.1 Resume global

```http
GET /api/programmes-vol/resume
Authorization: Bearer <token>
```

**Response (200)** :
```json
{
  "success": true,
  "data": {
    "totalProgrammesActifs": 42,
    "totalVolsHebdomadaires": 62,
    "parCategorie": {
      "PASSAGER": {
        "count": 30,
        "compagnies": ["ETHIOPIAN AIRLINES", "AIR FRANCE", "TURKISH AIRLINES"]
      },
      "CARGO": {
        "count": 8,
        "compagnies": ["ETHIOPIAN CARGO", "EGYPTAIR CARGO"]
      },
      "DOMESTIQUE": {
        "count": 4,
        "compagnies": ["ROYAL AIRWAYS"]
      }
    },
    "parJour": {
      "Lundi": { "total": 10, "passagers": 6, "cargo": 2, "domestiques": 2 },
      "Mardi": { "total": 9, "passagers": 6, "cargo": 1, "domestiques": 2 },
      "Mercredi": { "total": 9, "passagers": 6, "cargo": 2, "domestiques": 1 },
      "Jeudi": { "total": 7, "passagers": 5, "cargo": 1, "domestiques": 1 },
      "Vendredi": { "total": 12, "passagers": 9, "cargo": 1, "domestiques": 2 },
      "Samedi": { "total": 5, "passagers": 3, "cargo": 2, "domestiques": 0 },
      "Dimanche": { "total": 10, "passagers": 7, "cargo": 1, "domestiques": 2 }
    }
  }
}
```

---

### 7.2 Statistiques par categorie

```http
GET /api/programmes-vol/statistiques/categories
Authorization: Bearer <token>
```

**Response (200)** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "PASSAGER",
      "count": 30,
      "compagnies": ["ETHIOPIAN AIRLINES", "AIR FRANCE", "TURKISH AIRLINES", "..."]
    },
    {
      "_id": "CARGO",
      "count": 8,
      "compagnies": ["ETHIOPIAN CARGO", "EGYPTAIR CARGO"]
    },
    {
      "_id": "DOMESTIQUE",
      "count": 4,
      "compagnies": ["ROYAL AIRWAYS"]
    }
  ]
}
```

---

### 7.3 Statistiques par jour

```http
GET /api/programmes-vol/statistiques/jours
Authorization: Bearer <token>
```

**Response (200)** :
```json
{
  "success": true,
  "data": {
    "Dimanche": { "total": 10, "passagers": 7, "cargo": 1, "domestiques": 2 },
    "Lundi": { "total": 10, "passagers": 6, "cargo": 2, "domestiques": 2 },
    "Mardi": { "total": 9, "passagers": 6, "cargo": 1, "domestiques": 2 },
    "Mercredi": { "total": 9, "passagers": 6, "cargo": 2, "domestiques": 1 },
    "Jeudi": { "total": 7, "passagers": 5, "cargo": 1, "domestiques": 1 },
    "Vendredi": { "total": 12, "passagers": 9, "cargo": 1, "domestiques": 2 },
    "Samedi": { "total": 5, "passagers": 3, "cargo": 2, "domestiques": 0 }
  }
}
```

---

## 8. ENDPOINT D'IMPORT

### 8.1 Import en masse

```http
POST /api/programmes-vol/import
Content-Type: application/json
Authorization: Bearer <token>
```

**Body** :
```json
{
  "programmes": [
    {
      "nomProgramme": "Air France Lundi/Vendredi",
      "compagnieAerienne": "AIR FRANCE",
      "codeCompagnie": "AF",
      "typeOperation": "TURN_AROUND",
      "categorieVol": "PASSAGER",
      "route": { "provenance": "CDG", "destination": "CDG" },
      "recurrence": {
        "frequence": "HEBDOMADAIRE",
        "joursSemaine": [1, 5],
        "dateDebut": "2025-10-27",
        "dateFin": "2026-03-28"
      },
      "detailsVol": {
        "numeroVolBase": "AF908",
        "avionType": "B777",
        "horairePrevu": { "heureArrivee": "18:20", "heureDepart": "19:50" }
      }
    },
    { /* autre programme */ }
  ]
}
```

**Response (200)** :
```json
{
  "success": true,
  "message": "Import terminé: 10 succès, 2 erreurs",
  "data": {
    "succes": [
      { "nomProgramme": "Air France Lundi/Vendredi", "id": "..." },
      { "nomProgramme": "Turkish Airlines Direct", "id": "..." }
    ],
    "erreurs": [
      { "nomProgramme": "Programme invalide", "erreur": "Le numéro de vol de base est requis" }
    ]
  }
}
```

---

## 9. CODES D'ERREUR

| Code HTTP | Message | Cause |
|-----------|---------|-------|
| 400 | Le nom du programme est requis | Champ obligatoire manquant |
| 400 | Date invalide | Format de date incorrect |
| 400 | Impossible de modifier un programme validé et actif | Workflow non respecte |
| 400 | Le programme n'est pas actif | Tentative de suspendre un programme non actif |
| 400 | Le programme doit être validé avant d'être activé | Workflow non respecte |
| 403 | Accès refusé: QUALITE est un profil lecture seule | Role non autorise |
| 404 | Programme vol saisonnier non trouvé | ID inexistant |
| 500 | Erreur lors de... | Erreur serveur |

---

## 10. SUGGESTIONS UI/UX

### 10.1 Pages suggerees

| Page | Description | Routes API utilisees |
|------|-------------|----------------------|
| Liste programmes | Tableau avec filtres | GET /, GET /resume |
| Detail programme | Vue complete + actions | GET /:id, POST /:id/valider, etc. |
| Creation programme | Formulaire multi-etapes | POST / |
| Import programmes | Upload JSON | POST /import |
| Dashboard stats | Graphiques | GET /statistiques/* |
| Planning hebdo | Vue calendrier Lun→Dim | GET /applicables/:date |

### 10.2 Composants suggerees

```
ProgrammeVolList
├── ProgrammeVolFilters (categorieVol, compagnie, statut, route)
├── ProgrammeVolTable
│   └── ProgrammeVolRow
│       ├── StatusBadge (BROUILLON, VALIDE, ACTIF, SUSPENDU)
│       ├── CategorieBadge (PASSAGER, CARGO, DOMESTIQUE)
│       └── ActionButtons (Valider, Activer, Suspendre, Supprimer)
└── ProgrammeVolPagination

ProgrammeVolForm
├── StepInfoGenerales (nom, compagnie, type, categorie)
├── StepRecurrence (frequence, jours, periode)
├── StepDetailsVol (numero, avion, horaires, capacite)
├── StepRoute (provenance, destination, escales)
└── StepResume (apercu avant validation)

ProgrammeVolStats
├── StatCard (total actifs, total hebdo)
├── PieChart (par categorie)
└── BarChart (par jour)

PlanningHebdo
├── DayColumn (Lundi)
│   └── VolCard (ET939, 12:10-14:05, PASSAGER)
├── DayColumn (Mardi)
│   └── ...
└── ...
```

### 10.3 Couleurs suggerees par categorie

| Categorie | Couleur | Hex |
|-----------|---------|-----|
| PASSAGER | Bleu | `#3B82F6` |
| CARGO | Orange | `#F97316` |
| DOMESTIQUE | Vert | `#22C55E` |

### 10.4 Couleurs suggerees par statut

| Statut | Couleur | Hex |
|--------|---------|-----|
| BROUILLON | Gris | `#6B7280` |
| VALIDE | Bleu | `#3B82F6` |
| ACTIF | Vert | `#22C55E` |
| SUSPENDU | Orange | `#F97316` |
| TERMINE | Rouge | `#EF4444` |

---

## 11. EXEMPLE DE WORKFLOW COMPLET

### 11.1 Creation d'un nouveau programme

```
1. POST /api/programmes-vol
   → statut: BROUILLON

2. (optional) PATCH /api/programmes-vol/:id
   → Modifications

3. POST /api/programmes-vol/:id/valider
   → statut: VALIDE

4. POST /api/programmes-vol/:id/activer
   → statut: ACTIF, actif: true

5. (si besoin) POST /api/programmes-vol/:id/suspendre
   → statut: SUSPENDU, actif: false
```

### 11.2 Utilisation dans CRV

```
1. GET /api/programmes-vol/applicables/2025-11-15
   → Liste des vols du jour

2. User selectionne ET939

3. POST /api/crv
   {
     "vol": "<vol_id_from_programme>",
     "escale": "NDJ",
     ...
   }
   → CRV pre-rempli avec infos du programme
```

---

## 12. DONNEES DE REFERENCE

### 12.1 Compagnies aeriennes

| Code IATA | Nom | Type |
|-----------|-----|------|
| AF | Air France | Passager |
| TK | Turkish Airlines | Passager |
| ET | Ethiopian Airlines | Passager |
| MS | EgyptAir | Passager |
| AT | Royal Air Maroc | Passager |
| AH | Air Algerie | Passager |
| QC | Camair-Co | Passager |
| KP | KPO (ASKY) | Passager |
| ET Cargo | Ethiopian Cargo | Cargo |
| MS Cargo | EgyptAir Cargo | Cargo |
| CH | Royal Airways | Domestique |

### 12.2 Aeroports (codes IATA)

**Tchadiens** :
| Code | Ville |
|------|-------|
| NDJ | N'Djamena |
| AEH | Abeche |
| FYT | Faya-Largeau |
| AMJ | Amdjarass |
| SRH | Sarh |
| MQQ | Moundou |

**Internationaux** :
| Code | Ville |
|------|-------|
| CDG | Paris |
| IST | Istanbul |
| ADD | Addis Abeba |
| CAI | Le Caire |
| CMN | Casablanca |
| DLA | Douala |
| LFW | Lome |

### 12.3 Types d'avions

| Type | Categorie |
|------|-----------|
| B777 | Long-courrier |
| A330-200 | Long-courrier |
| B737-800 | Moyen-courrier |
| B737-700 | Moyen-courrier |
| E90 | Regional |
| ATR72 | Regional |
| ATR42 | Regional |

---

## 13. VALIDATION FRONTEND

### 13.1 Champs obligatoires

- `nomProgramme` : non vide
- `compagnieAerienne` : non vide
- `typeOperation` : ARRIVEE | DEPART | TURN_AROUND
- `recurrence.frequence` : QUOTIDIEN | HEBDOMADAIRE | BIMENSUEL | MENSUEL
- `recurrence.dateDebut` : date valide
- `recurrence.dateFin` : date valide, > dateDebut
- `recurrence.joursSemaine` : requis si frequence = HEBDOMADAIRE
- `detailsVol.numeroVolBase` : non vide

### 13.2 Formats

- `horairePrevu.heureArrivee` : `HH:MM` (24h)
- `horairePrevu.heureDepart` : `HH:MM` (24h)
- `codeCompagnie` : 2-3 caracteres majuscules
- `route.provenance` / `destination` : 3 caracteres majuscules (IATA)

---

## 14. CHECKLIST IMPLEMENTATION FRONTEND

- [ ] Service API (axios/fetch)
  - [ ] CRUD programmes
  - [ ] Actions (valider, activer, suspendre)
  - [ ] Recherche (applicables, par-route)
  - [ ] Statistiques
  - [ ] Import

- [ ] Store/State management
  - [ ] Liste programmes
  - [ ] Programme selectionne
  - [ ] Filtres actifs
  - [ ] Statistiques

- [ ] Composants
  - [ ] ProgrammeVolList
  - [ ] ProgrammeVolForm
  - [ ] ProgrammeVolDetail
  - [ ] ProgrammeVolStats
  - [ ] PlanningHebdo

- [ ] Pages/Routes
  - [ ] /programmes-vol (liste)
  - [ ] /programmes-vol/nouveau (creation)
  - [ ] /programmes-vol/:id (detail)
  - [ ] /programmes-vol/import (import)
  - [ ] /programmes-vol/statistiques (dashboard)

- [ ] Integration CRV
  - [ ] Selection vol depuis programme
  - [ ] Pre-remplissage CRV

---

**Backend pret. En attente d'implementation Frontend.**
