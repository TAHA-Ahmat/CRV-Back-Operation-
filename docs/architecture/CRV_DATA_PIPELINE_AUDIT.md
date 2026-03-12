# CRV_DATA_PIPELINE_AUDIT — Audit Complet Pipeline Données

Date : 2026-03-11
Auteur : Claude Code (audit forensique)
CRV analysé : `69b0d282497f312717732ea1` (CRV260311-0013)

---

## 1. DONNÉES RÉELLES EN BASE

### 1.1 CRV

```
_id:               69b0d282497f312717732ea1
numeroCRV:         CRV260311-0013
vol:               69b0d281497f312717732e9b
escale:            NDJ
horaire:           69b0d282497f312717732e9e
statut:            TERMINE
completude:        85
responsableVol:    null
creePar:           69a72cc044579001349b1b01
bulletinMouvementReference: 69b0ac1c97243159a260eaba
personnelAffecte:  3 personnes
materielUtilise:   [] (VIDE)
archivage:         non archivé (tous champs null)
```

### 1.2 Vol

```
_id:              69b0d281497f312717732e9b
numeroVol:        KP064
typeOperation:    ARRIVEE
compagnieAerienne: KP
codeIATA:         KP
aeroportOrigine:  LFW-
aeroportDestination: NSI
dateVol:          2026-03-10
statut:           TERMINE
posteStationnement: null
avion:            69b0d2aa497f312717732edb   ← ObjectId ref
```

**Champs ABSENTS du Vol** : `immatriculation`, `typeAppareil`, `typeAvion`
**Le Vol a une ref `avion`** qui pointe vers la collection Avions.

### 1.3 Avion (résolu via Vol.avion)

```
_id:                69b0d2aa497f312717732edb
immatriculation:    JK786EF              ← EXISTE ICI
typeAvion:          RPJ                  ← EXISTE ICI
compagnie:          KP
capacitePassagers:  180
capaciteFret:       2000
statut:             ACTIF
```

### 1.4 Horaire

```
_id:                    69b0d282497f312717732e9e
vol:                    69b0d281497f312717732e9b
heureAtterrisagePrevue: 2026-03-11T17:50:00.000Z    ← EXISTE
heureDecollagePrevue:   null
```

### 1.5 Chronologie Phases (10 documents)

| # | Phase | typeOp | ordre | dureeStandard | heureDebutPrevue | heureDebutReelle | heureFinPrevue | heureFinReelle | dureeReelle | ecart | statut |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Briefing equipes | ARRIVEE | 1 | 10 min | **null** | 02:27:33 | **null** | 02:27:37 | 0 | **null** | TERMINE |
| 2 | Arrivee avion | ARRIVEE | 2 | 15 min | **null** | 02:27:43 | **null** | 02:27:48 | 0 | **null** | TERMINE |
| 3 | Ouverture soutes | ARRIVEE | 3 | 5 min | **null** | 02:27:54 | **null** | 02:27:58 | 0 | **null** | TERMINE |
| 4 | Dechargement bagages/fret | ARRIVEE | 4 | 25 min | **null** | 02:28:04 | **null** | 02:28:08 | 0 | **null** | TERMINE |
| 5 | Livraison bagages | ARRIVEE | 5 | 20 min | **null** | 02:28:14 | **null** | 02:28:19 | 0 | **null** | TERMINE |
| 6 | Debarquement passagers | ARRIVEE | 6 | 15 min | **null** | 02:28:24 | **null** | 02:28:28 | 0 | **null** | TERMINE |
| 7 | Mise en condition cabine | ARRIVEE | 7 | 30 min | **null** | 02:28:34 | **null** | 02:28:38 | 0 | **null** | TERMINE |
| 8 | Debriefing cloture | ARRIVEE | 8 | 10 min | **null** | 02:28:43 | **null** | 02:28:48 | 0 | **null** | TERMINE |
| 9 | Controle securite | COMMUN | 1 | 15 min | **null** | 02:28:53 | **null** | 02:28:58 | 0 | **null** | TERMINE |
| 10 | Verification surete | COMMUN | 2 | 10 min | **null** | 01:29:00 | **null** | 01:29:00 | 0 | **null** | TERMINE |

**Constats** :
- `heureDebutPrevue` : **null** sur 10/10
- `heureFinPrevue` : **null** sur 10/10
- `ecartMinutes` : **null** sur 10/10
- `dureeReelleMinutes` : **0** sur 10/10 (phases exécutées en ~4 secondes)
- Chaque Phase possède `dureeStandardMinutes` (10-30 min) dans le référentiel

### 1.6 Charges Opérationnelles

```
Résultat: 0 documents
```

**Aucune charge (passagers, bagages, fret) enregistrée pour ce CRV.**

### 1.7 Événements Opérationnels

```
Résultat: 0 documents
```

### 1.8 Observations

```
Résultat: 0 documents
```

### 1.9 Validation CRV

```
_id:                69b0dc99497f3127177336f9
statut:             EN_ATTENTE_CORRECTION
validePar:          69aa5097f26e70017ddfb070
commentaires:       "ok "
scoreCompletude:    85
conformiteSLA:      true
anomaliesDetectees: ["Responsable du vol non défini"]
verrouille:         false
dateValidation:     2026-03-11T03:08:09.024Z
```

### 1.10 Bulletin de Mouvement

```
_id: 69b0ac1c97243159a260eaba
Résultat: NOT FOUND (document absent de la collection)
```

### 1.11 Engins

```
Collection affectationenginvols: 0 documents pour ce CRV
Collection engins: 0 documents pour ce CRV
CRV.materielUtilise: [] (tableau vide)
```

---

## 2. RELATIONS ENTRE COLLECTIONS

```
CRV (69b0d282...ea1)
├── vol (69b0d281...e9b)               → Vol KP064 ARRIVEE
│   └── avion (69b0d2aa...edb)         → Avion JK786EF / RPJ
├── horaire (69b0d282...e9e)           → heureAtterrisagePrevue: 17:50 UTC
├── creePar (69a72cc0...1b01)          → Pierre MARTIN
├── responsableVol: null               → NON DEFINI
├── bulletinMouvementReference (69b0ac1c...eaba) → NOT FOUND
│
├── chronologiephases (10 docs)        → toutes TERMINE, 0 min durée
│   └── phase (ref)                    → libelle, typeOperation, dureeStandardMinutes
│   └── responsable (ref)             → Pierre MARTIN
│
├── chargesoperationnelles             → 0 docs
├── evenementsoperationnels            → 0 docs
├── observations                       → 0 docs
└── validationcrvs (1 doc)             → EN_ATTENTE_CORRECTION
```

---

## 3. DONNÉES RÉCUPÉRÉES PAR LE BACKEND

### CrvGenerator.fetchData() — Requêtes exécutées

```javascript
// 1. CRV avec populates
CRV.findById(crvId)
  .populate('vol')                           // Vol hydraté
  .populate('creePar', 'nom prenom')         // Personne
  .populate('responsableVol', 'nom prenom')  // null → reste null
  .populate('verrouillePar', 'nom prenom')   // undefined → reste undefined
  .populate('archivage.archivedBy', 'nom prenom')  // null → reste null

// 2. Phases
ChronologiePhase.find({ crv: crvId })
  .populate('phase')                         // Phase ref hydratée
  .populate('responsable', 'nom prenom')     // Personne
  .sort({ 'phase.ordre': 1 })

// 3. Charges
ChargeOperationnelle.find({ crv: crvId })    // → []

// 4. Événements
EvenementOperationnel.find({ crv: crvId })
  .populate('declarePar', 'nom prenom')      // → []
  .sort({ dateHeureDebut: 1 })

// 5. Observations
Observation.find({ crv: crvId })
  .populate('auteur', 'nom prenom')          // → []
  .sort({ dateHeure: -1 })

// 6. Validation
ValidationCRV.findOne({ crv: crvId })
  .populate('validePar', 'nom prenom')       // Personne hydratée
```

### Données assemblées (objet `data` envoyé au générateur)

```javascript
{
  entity: crv,    // CRV avec vol populé (mais vol.avion = ObjectId NON populé)
  data: {
    vol:          { numeroVol: 'KP064', typeOperation: 'ARRIVEE', avion: ObjectId('...') },
    personnel:    [3 objets {nom, prenom, fonction, matricule}],
    materiel:     [],
    phases:       [10 ChronologiePhase avec phase populée],
    charges:      [],
    evenements:   [],
    observations: [],
    validation:   { statut: 'EN_ATTENTE_CORRECTION', ... },
  }
}
```

---

## 4. COMPARAISON BASE → BACKEND → PDF

### 4.1 Informations Vol (Page 1)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| numeroVol | ✅ KP064 | ✅ via populate('vol') | ✅ `vol.numeroVol` | ✅ |
| compagnieAerienne | ✅ KP | ✅ | ✅ | ✅ |
| codeIATA | ✅ KP | ✅ | ✅ | ✅ |
| typeOperation | ✅ ARRIVEE | ✅ | ✅ | ✅ |
| dateVol | ✅ 2026-03-10 | ✅ | ✅ | ✅ |
| aeroportOrigine | ✅ LFW- | ✅ | ✅ | ✅ |
| aeroportDestination | ✅ NSI | ✅ | ✅ | ✅ |
| posteStationnement | ✅ null | ✅ | ✅ | `-` |
| **immatriculation** | ✅ JK786EF (dans Avion) | ❌ `vol.avion` est un ObjectId brut | ❌ `vol.immatriculation` = undefined | `-` |
| **typeAvion** | ✅ RPJ (dans Avion) | ❌ pas de deep populate | ❌ `vol.typeAppareil` et `vol.typeAvion` = undefined | `-` |
| **heureAtterrisagePrevue** | ✅ 17:50 (dans Horaire) | ❌ pas de populate sur horaire | ❌ non utilisé dans PDF | NON AFFICHÉ |

### 4.2 Chronologie (Page 3)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| phase.libelle | ✅ via populate | ✅ | ✅ `p.phase.libelle` | ✅ |
| heureDebutPrevue | ❌ null (jamais injecté) | ✅ (null) | ✅ `fmtTime(p.heureDebutPrevue)` | `-` |
| heureDebutReelle | ✅ | ✅ | ✅ `fmtTime(p.heureDebutReelle)` | ✅ 02:27 |
| heureFinReelle | ✅ | ✅ | ✅ `fmtTime(p.heureFinReelle)` | ✅ 02:27 |
| dureeReelleMinutes | ✅ (= 0) | ✅ | ✅ `p.dureeReelleMinutes` | `0'` |
| ecartMinutes | ❌ null (jamais calculé) | ✅ (null) | ✅ `ecartText(p.ecartMinutes)` | `-` |
| statut | ✅ TERMINE | ✅ | ✅ `STATUT_PHASE[p.statut]` | ✅ |
| **phase.dureeStandardMinutes** | ✅ 5-30 min (dans Phase ref) | ✅ via populate | ❌ non utilisé dans PDF | NON AFFICHÉ |
| **phase.typeOperation** | ✅ | ✅ via populate | ✅ (page 1 KPI only) | partiel |

### 4.3 Charges (Page 2)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| Passagers | ❌ 0 docs | ✅ (vide) | ✅ fallback | "Aucune donnee passagers" |
| Bagages | ❌ 0 docs | ✅ (vide) | ✅ fallback | "Aucune donnee bagages" |
| Fret | ❌ 0 docs | ✅ (vide) | ✅ fallback | "Aucune donnee fret" |

### 4.4 Événements (Page 4)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| Événements | ❌ 0 docs | ✅ (vide) | ✅ fallback | "Vol nominal" (bandeau vert) |

### 4.5 Observations (Page 5)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| Observations | ❌ 0 docs | ✅ (vide) | ✅ fallback | "Rien de particulier" |

### 4.6 Validation (Page 6)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| validePar | ✅ | ✅ via populate | ✅ | ✅ nom |
| dateValidation | ✅ | ✅ | ✅ | ✅ |
| scoreCompletude | ✅ 85 | ✅ | ✅ | ✅ |
| conformiteSLA | ✅ true | ✅ | ✅ | CONFORME |
| anomaliesDetectees | ✅ [1] | ✅ | ✅ | ✅ |
| commentaires | ✅ "ok " | ✅ | ✅ | ✅ |

### 4.7 Personnel (Page 3)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| personnelAffecte | ✅ 3 personnes | ✅ `crv.personnelAffecte` | ✅ | ✅ |

### 4.8 Matériel / Engins (Page 3)

| Donnée | En base | Récupérée | Utilisée dans PDF | Affichée |
|---|---|---|---|---|
| materielUtilise | ✅ [] (vide) | ✅ `crv.materielUtilise` | ✅ fallback | "Aucun materiel" |
| Engins (collection) | ❌ 0 docs | ❌ non requêté | ❌ | - |

---

## 5. IDENTIFICATION DES PERTES DE DONNÉES

### PERTE #1 — heureDebutPrevue / heureFinPrevue (CRITIQUE)

```
Localisation : phase.service.js ligne 63-67
Type : donnée JAMAIS CRÉÉE
```

Le service `initialiserPhasesCRV()` crée les ChronologiePhase avec seulement :
```javascript
ChronologiePhase.create({
  crv: crvId,
  phase: phase._id,
  statut: 'NON_COMMENCE'
  // heureDebutPrevue: ABSENT
  // heureFinPrevue: ABSENT
})
```

**Les données nécessaires existent pourtant** :
- `Phase.dureeStandardMinutes` : 5, 10, 15, 20, 25, 30 min (dans le référentiel)
- `Horaire.heureAtterrisagePrevue` : 17:50 UTC (dans la collection horaires)

**Calcul possible mais non implémenté** :
```
heureDebutPrevue[phase1] = heureAtterrisagePrevue
heureFinPrevue[phase1]   = heureDebutPrevue + dureeStandardMinutes
heureDebutPrevue[phase2] = heureFinPrevue[phase1]
... etc
```

### PERTE #2 — ecartMinutes (CONSÉQUENCE DE #1)

```
Localisation : ChronologiePhase.js hook pre('save') ligne 137
Type : donnée JAMAIS CALCULÉE (condition non remplie)
```

Le hook calcule `ecartMinutes` uniquement si `heureDebutPrevue && heureFinPrevue` existent. Comme #1, la condition est toujours `false`.

### PERTE #3 — dureeReelleMinutes = 0 (DONNÉES DE TEST)

```
Localisation : ChronologiePhase.js hook pre('save') ligne 129
Type : calcul CORRECT mais données artificielles
```

`Math.round(4747ms / 60000)` = 0. Les phases ont été terminées en ~4 secondes.
**Ce n'est pas un bug de pipeline** — en conditions réelles la durée sera correcte.

### PERTE #4 — Immatriculation et Type avion (RUPTURE DE POPULATE)

```
Localisation : CrvGenerator.js fetchData() ligne 133
Type : donnée EXISTANTE mais NON RÉCUPÉRÉE
```

La chaîne de données :
```
Avion.immatriculation = "JK786EF"    ← EXISTE EN BASE
Avion.typeAvion = "RPJ"              ← EXISTE EN BASE
Vol.avion = ObjectId(...)            ← REF NON POPULÉE
CRV → populate('vol')               ← POPULE Vol mais PAS Vol.avion
PDF: vol.immatriculation             ← undefined
PDF: vol.typeAppareil || vol.typeAvion ← undefined
```

**Il manque un deep populate** : `.populate({ path: 'vol', populate: { path: 'avion' } })`

### PERTE #5 — Heure prévue d'atterrissage (NON UTILISÉE)

```
Localisation : CrvGenerator.js fetchData()
Type : donnée EXISTANTE mais JAMAIS RÉCUPÉRÉE
```

```
Horaire.heureAtterrisagePrevue = 17:50 UTC    ← EXISTE EN BASE
CRV.horaire = ObjectId(...)                    ← REF NON POPULÉE
PDF: non requêté, non affiché
```

Le CRV a une ref `horaire` mais le générateur PDF ne le charge pas.

### PERTE #6 — dureeStandardMinutes (NON UTILISÉE DANS PDF)

```
Localisation : CrvGenerator.js _page3_timeline() ligne 460
Type : donnée RÉCUPÉRÉE mais NON AFFICHÉE
```

```
Phase.dureeStandardMinutes = 10, 15, 25...    ← EXISTE EN BASE
populate('phase') charge le document           ← RÉCUPÉRÉ
PDF: p.phase.dureeStandardMinutes              ← JAMAIS UTILISÉ DANS LE RENDU
```

Le référentiel Phase contient la durée standard de chaque phase, mais la colonne "Durée" du PDF montre uniquement `dureeReelleMinutes`.

### PERTE #7 — Charges, Événements, Observations (JAMAIS CRÉÉS)

```
Type : données JAMAIS CRÉÉES pour ce CRV
```

Ce CRV de test n'a aucune charge, aucun événement, aucune observation.
Le pipeline les récupère correctement (tableau vide) et affiche les fallbacks.
**Pas un bug de pipeline** — données non saisies.

### PERTE #8 — Bulletin de mouvement (INTROUVABLE)

```
Localisation : collection bulletinmouvements
Type : donnée RÉFÉRENCÉE mais ABSENTE
```

`CRV.bulletinMouvementReference = 69b0ac1c97243159a260eaba` mais le document n'existe pas en base (supprimé ou collection différente). Le bulletin n'est pas utilisé dans le PDF donc pas d'impact direct.

---

## 6. TRACE COMPLÈTE DU PIPELINE

```
PROGRAMME DE VOL
      │
      ▼
VOL (KP064)                          AVION (JK786EF / RPJ)
├── numeroVol ✅                      ├── immatriculation ✅
├── typeOperation ✅                  └── typeAvion ✅
├── compagnie ✅                            │
├── dateVol ✅                              │ Vol.avion = ObjectId (ref)
├── avion = ObjectId ─────────────────────┘
│
      │                              HORAIRE
      │                              ├── heureAtterrisagePrevue = 17:50 ✅
      ▼                              └── CRV.horaire = ObjectId (ref)
                                            │
CRV (CRV260311-0013)                       │ NON POPULÉ
├── vol = ObjectId ──── populate('vol') ── Vol hydraté (SANS avion populé)
├── horaire = ObjectId ─────────────────── NON POPULÉ ──── PERDU
├── personnelAffecte [3] ✅
├── materielUtilise [] ✅
│
├── ChronologiePhase (10)
│   ├── phase = ObjectId ── populate('phase') ── Phase hydratée ✅
│   │   └── dureeStandardMinutes ── RÉCUPÉRÉ mais NON AFFICHÉ dans PDF
│   ├── heureDebutPrevue = null ──── JAMAIS INJECTÉ à la création ── '-'
│   ├── heureFinPrevue = null ──── JAMAIS INJECTÉ ── CAUSE: ecart non calculé
│   ├── heureDebutReelle ✅
│   ├── heureFinReelle ✅
│   ├── dureeReelleMinutes = 0 ──── CORRECT (4 sec arrondi à 0)
│   ├── ecartMinutes = null ──── JAMAIS CALCULÉ (pas de prévues)
│   └── statut = TERMINE ✅
│
├── ChargeOperationnelle (0) ── non saisies
├── EvenementOperationnel (0) ── non saisis
├── Observation (0) ── non saisies
└── ValidationCRV (1) ✅
      │
      ▼
CrvGenerator.fetchData()
├── CRV.populate('vol') ────── Vol OK mais vol.avion = ObjectId brut
│   └── vol.immatriculation = undefined ── PERDU
│   └── vol.typeAvion = undefined ── PERDU
├── ChronologiePhase.find().populate('phase').populate('responsable')
│   └── phase.dureeStandardMinutes = récupéré ── NON UTILISÉ
├── ChargeOperationnelle.find() → []
├── EvenementOperationnel.find() → []
├── Observation.find() → []
└── ValidationCRV.findOne() → 1 doc ✅
      │
      ▼
PDF RENDU
├── Page 1 : Vol ✅, Aéronef ❌ (-/-), Performance ✅
├── Page 2 : Trafic → "Aucune donnee" (pas de charges)
├── Page 3 : Chronologie → Prévu='-', Durée='0', Écart='-'
├── Page 4 : Événements → "Vol nominal"
├── Page 5 : Observations → "Rien a signaler"
└── Page 6 : Validation ✅
```

---

## 7. SYNTHÈSE DES RUPTURES

| # | Donnée perdue | Existe en base ? | Où se situe la rupture | Type de rupture |
|---|---|---|---|---|
| 1 | heureDebutPrevue | NON | `phase.service.js:63` — création sans heures prévues | Jamais créée |
| 2 | heureFinPrevue | NON | `phase.service.js:63` — création sans heures prévues | Jamais créée |
| 3 | ecartMinutes | NON | `ChronologiePhase.js:137` — condition non remplie (pas de prévues) | Jamais calculée |
| 4 | immatriculation | OUI (Avion) | `CrvGenerator.js:133` — `.populate('vol')` sans deep populate avion | Non récupérée |
| 5 | typeAvion | OUI (Avion) | `CrvGenerator.js:133` — `.populate('vol')` sans deep populate avion | Non récupérée |
| 6 | heureAtterrisagePrevue | OUI (Horaire) | `CrvGenerator.js:131-137` — horaire non populé | Non récupérée |
| 7 | dureeStandardMinutes | OUI (Phase) | `CrvGenerator.js:460` — récupéré via populate mais non rendu | Non affichée |
| 8 | dureeReelleMinutes = 0 | OUI | `calcul.service.js:42` — Math.round(4s) = 0 | Données test |

### Classification

**Ruptures structurelles (code)** : #1, #2, #3, #4, #5, #6, #7
**Ruptures de données (test)** : #8

### Priorité de correction

| Priorité | Rupture | Impact PDF |
|---|---|---|
| P0 | #1 #2 #3 — Heures prévues et écarts | Colonnes Prévu et Écart toujours vides |
| P0 | #4 #5 — Immatriculation / Type avion | Section Aéronef toujours vide |
| P1 | #6 — Heure atterrissage prévue | Info utile pour contexte vol absente |
| P2 | #7 — Durée standard | Référence utile pour comparaison avec durée réelle |
