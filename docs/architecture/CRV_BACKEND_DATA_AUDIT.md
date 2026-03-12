# CRV_BACKEND_DATA_AUDIT — Extraction Complète des Données

Date : 2026-03-11
Auteur : Claude Code (audit backend)
CRV analysé : `69b0d282497f312717732ea1` (CRV260311-0013)

---

## 1. PIPELINE RÉEL DES DONNÉES

```
ProgrammeVolSaisonnier
     │
     ▼
BulletinMouvement.mouvements[]
│  ├── numeroVol
│  ├── codeCompagnie
│  ├── dateMouvement
│  ├── heureArriveePrevue      ─── → Horaire.heureAtterrisagePrevue
│  ├── heureDepartPrevue       ─── → Horaire.heureDepartDuParcPrevue
│  ├── provenance              ─── → Vol.aeroportOrigine
│  ├── destination             ─── → Vol.aeroportDestination
│  ├── typeAvion               ─── → ❌ PERDU (pas transféré au Vol)
│  └── typeOperation           ─── → Vol.typeOperation (auto-déduit)
│
├──────────── creerVolDepuisMouvement() ──────────────┐
│                                                       ▼
│                                                      Vol
│                                                      ├── avion: null (renseigné manuellement après)
│                                                      ├── posteStationnement: null
│                                                      └── bulletinMouvementReference
│
├──────────── Horaire.create() ───────────────────────┐
│                                                       ▼
│                                                      Horaire
│                                                      ├── heureAtterrisagePrevue ✅
│                                                      ├── heureDecollagePrevue: null
│                                                      └── 12+ champs horaires (tous null initialement)
│
└──────────── CRV.create() ───────────────────────────┐
                                                        ▼
                                                       CRV
                                                       ├── vol (ref)
                                                       ├── horaire (ref)
                                                       ├── escale
                                                       ├── statut: BROUILLON
                                                       └── completude: 0
                                                        │
                                        initialiserPhasesVol()
                                                        │
                                                        ▼
                                              ChronologiePhase[] × N
                                              { crv, phase, statut: 'NON_COMMENCE' }
                                              // AUCUN autre champ renseigné
```

---

## 2. POPULATES UTILISÉS — COMPARAISON CONTROLLER vs GÉNÉRATEUR PDF

### 2.1 Controller CRV — `obtenirCRV()` (endpoint GET /api/crv/:id)

```javascript
CRV.findById(id)
  .populate({ path: 'vol', populate: { path: 'avion' } })   // ← DEEP POPULATE
  .populate('horaire')                                         // ← HORAIRE POPULÉ
  .populate('creePar', 'nom prenom')
  .populate('responsableVol', 'nom prenom')
  .populate('verrouillePar', 'nom prenom')

ChronologiePhase.find({ crv }).populate('phase').populate('responsable')
EvenementOperationnel.find({ crv }).populate('declarePar equipementConcerne personneConcernee')
Observation.find({ crv }).populate('auteur')
```

### 2.2 CrvGenerator.fetchData() (génération PDF)

```javascript
CRV.findById(crvId)
  .populate('vol')                                             // ← SIMPLE populate (pas de deep)
  .populate('creePar', 'nom prenom')                           // ✅
  .populate('responsableVol', 'nom prenom')                    // ✅
  .populate('verrouillePar', 'nom prenom')                     // ✅
  .populate('archivage.archivedBy', 'nom prenom')              // ✅

ChronologiePhase.find({ crv }).populate('phase').populate('responsable')    // ✅
ChargeOperationnelle.find({ crv })                                          // ✅
EvenementOperationnel.find({ crv }).populate('declarePar')                  // ✅
Observation.find({ crv }).populate('auteur')                                // ✅
ValidationCRV.findOne({ crv }).populate('validePar')                        // ✅
```

### 2.3 Différences critiques

| Populate | Controller | Générateur PDF | Écart |
|---|---|---|---|
| `vol` | `.populate({ path: 'vol', populate: { path: 'avion' } })` | `.populate('vol')` | **AVION NON POPULÉ dans PDF** |
| `horaire` | `.populate('horaire')` | **ABSENT** | **HORAIRE NON RÉCUPÉRÉ dans PDF** |
| `equipementConcerne` | `.populate('equipementConcerne')` | **ABSENT** | Mineur |
| `personneConcernee` | `.populate('personneConcernee')` | **ABSENT** | Mineur |
| `archivage.archivedBy` | **ABSENT** | `.populate('archivage.archivedBy')` | OK (PDF seul) |

---

## 3. DONNÉES RÉCUPÉRÉES vs DISPONIBLES

### 3.1 Vol + Avion

| Donnée | Collection | Champ | Récupéré par Controller | Récupéré par PDF |
|---|---|---|---|---|
| Numéro vol | Vol | `numeroVol` | ✅ | ✅ |
| Compagnie | Vol | `compagnieAerienne` | ✅ | ✅ |
| Code IATA | Vol | `codeIATA` | ✅ | ✅ |
| Type opération | Vol | `typeOperation` | ✅ | ✅ |
| Date vol | Vol | `dateVol` | ✅ | ✅ |
| Origine | Vol | `aeroportOrigine` | ✅ | ✅ |
| Destination | Vol | `aeroportDestination` | ✅ | ✅ |
| Poste | Vol | `posteStationnement` | ✅ | ✅ |
| **Immatriculation** | **Avion** | `immatriculation` | ✅ (deep populate) | ❌ **NON RÉCUPÉRÉ** |
| **Type avion** | **Avion** | `typeAvion` | ✅ (deep populate) | ❌ **NON RÉCUPÉRÉ** |
| Capacité pax | Avion | `capacitePassagers` | ✅ | ❌ |
| Capacité fret | Avion | `capaciteFret` | ✅ | ❌ |

### 3.2 Horaire

| Donnée | Collection | Champ | Récupéré par Controller | Récupéré par PDF |
|---|---|---|---|---|
| **Heure atterrissage prévue** | **Horaire** | `heureAtterrisagePrevue` | ✅ | ❌ **NON RÉCUPÉRÉ** |
| Heure atterrissage réelle | Horaire | `heureAtterrissageReelle` | ✅ | ❌ |
| **Heure décollage prévue** | **Horaire** | `heureDecollagePrevue` | ✅ | ❌ **NON RÉCUPÉRÉ** |
| Heure décollage réelle | Horaire | `heureDecollageReelle` | ✅ | ❌ |
| Arrivée parc prévue | Horaire | `heureArriveeAuParcPrevue` | ✅ | ❌ |
| Arrivée parc réelle | Horaire | `heureArriveeAuParcReelle` | ✅ | ❌ |
| Départ parc prévu | Horaire | `heureDepartDuParcPrevue` | ✅ | ❌ |
| Départ parc réel | Horaire | `heureDepartDuParcReelle` | ✅ | ❌ |
| Écart atterrissage | Horaire | `ecartAtterissage` | ✅ | ❌ |
| Écart décollage | Horaire | `ecartDecollage` | ✅ | ❌ |

### 3.3 Phases — Chronologie

| Donnée | Collection | Champ | En base | Récupéré | Utilisé PDF |
|---|---|---|---|---|---|
| Libellé phase | Phase (ref) | `libelle` | ✅ | ✅ populate | ✅ |
| Type opération phase | Phase (ref) | `typeOperation` | ✅ | ✅ populate | ✅ (KPI page 1) |
| Ordre | Phase (ref) | `ordre` | ✅ | ✅ populate | ✅ (sort) |
| **Durée standard** | **Phase (ref)** | `dureeStandardMinutes` | ✅ (5-30 min) | ✅ populate | ❌ **NON AFFICHÉ** |
| Heure début prévue | ChronologiePhase | `heureDebutPrevue` | ❌ null | ✅ (null) | ✅ → `-` |
| Heure fin prévue | ChronologiePhase | `heureFinPrevue` | ❌ null | ✅ (null) | non utilisé |
| Heure début réelle | ChronologiePhase | `heureDebutReelle` | ✅ | ✅ | ✅ |
| Heure fin réelle | ChronologiePhase | `heureFinReelle` | ✅ | ✅ | ✅ |
| Durée réelle | ChronologiePhase | `dureeReelleMinutes` | ✅ (= 0) | ✅ | ✅ → `0'` |
| Écart | ChronologiePhase | `ecartMinutes` | ❌ null | ✅ (null) | ✅ → `-` |
| Statut | ChronologiePhase | `statut` | ✅ TERMINE | ✅ | ✅ |
| Responsable | Personne (ref) | `nom, prenom` | ✅ | ✅ populate | ❌ non affiché dans tableau |
| Double horodatage | ChronologiePhase | `horodatageDebut/Fin` | ✅ | ✅ | ❌ non utilisé |

### 3.4 Charges, Événements, Observations

| Collection | Docs en base | Récupéré | Affiché PDF |
|---|---|---|---|
| ChargeOperationnelle | 0 | ✅ (vide) | "Aucune donnee" |
| EvenementOperationnel | 0 | ✅ (vide) | "Vol nominal" |
| Observation | 0 | ✅ (vide) | "Rien a signaler" |
| ValidationCRV | 1 | ✅ | ✅ page 6 |

---

## 4. DONNÉES DISPONIBLES MAIS PERDUES

### 4.1 Pertes à la CRÉATION (phase.service.js)

**Fichier** : `src/services/phases/phase.service.js` lignes 63-67

```javascript
const chrono = await ChronologiePhase.create({
  crv: crvId,
  phase: phase._id,
  statut: 'NON_COMMENCE'
  // heureDebutPrevue: NON RENSEIGNÉ
  // heureFinPrevue: NON RENSEIGNÉ
});
```

**Données disponibles mais non utilisées** :

| Source | Champ disponible | Destination possible | Statut |
|---|---|---|---|
| Phase (ref) | `dureeStandardMinutes` | `ChronologiePhase.heureFinPrevue` (calculable) | ❌ NON UTILISÉ |
| Horaire | `heureAtterrisagePrevue` = 17:50 | `ChronologiePhase.heureDebutPrevue` (pour phase 1) | ❌ NON UTILISÉ |
| Phase (ref) | `offsetMinutes` | Calcul heure prévue | ❌ null en base (non configuré) |

**Calcul possible** :
```
Phase 1 (Briefing equipes):
  heureDebutPrevue = Horaire.heureAtterrisagePrevue = 17:50
  heureFinPrevue = 17:50 + dureeStandardMinutes(10) = 18:00

Phase 2 (Arrivee avion):
  heureDebutPrevue = Phase1.heureFinPrevue = 18:00
  heureFinPrevue = 18:00 + dureeStandardMinutes(15) = 18:15

... etc
```

### 4.2 Pertes à la RÉCUPÉRATION (CrvGenerator.fetchData)

**Fichier** : `src/services/documents/crv/CrvGenerator.js` lignes 131-147

| Donnée perdue | Source | Populate manquant | Impact PDF |
|---|---|---|---|
| `Avion.immatriculation` | Vol → Avion | deep populate `{ path: 'vol', populate: { path: 'avion' } }` | Section AERONEF = `-` |
| `Avion.typeAvion` | Vol → Avion | idem | Section AERONEF = `-` |
| `Horaire.*` (toutes les heures) | CRV → Horaire | `.populate('horaire')` | Heures prévues absentes |

**Le controller `obtenirCRV()` fait ces populates correctement** — seul le générateur PDF les omet.

### 4.3 Pertes au RENDU PDF

| Donnée récupérée | Utilisée dans PDF | Raison |
|---|---|---|
| `Phase.dureeStandardMinutes` | ❌ | Colonne non prévue dans le tableau chronologie |
| `Phase.offsetMinutes` | ❌ | null en base + non utilisé |
| `ChronologiePhase.responsable` | ❌ | Absent du tableau phases (présent dans populate mais pas rendu) |
| `ChronologiePhase.horodatageDebut/Fin` | ❌ | Double horodatage non affiché |
| `ChronologiePhase.remarques` | ❌ | Non affiché |

### 4.4 Pertes dans le pipeline Bulletin → Vol

| Champ Bulletin | Transféré vers | Statut |
|---|---|---|
| `mouvement.typeAvion` | ❌ AUCUN | **PERDU** — Vol n'a pas de champ typeAvion, il a une ref `avion` (ObjectId) |
| `mouvement.heureArriveePrevue` | Horaire.heureAtterrisagePrevue | ✅ |
| `mouvement.heureDepartPrevue` | Horaire.heureDepartDuParcPrevue | ✅ |
| `mouvement.remarques` | ❌ AUCUN | **PERDU** |
| `mouvement.statutMouvement` | ❌ AUCUN | **PERDU** (CRV a son propre statut) |
| `mouvement.volProgrammeReference` | ❌ AUCUN | **PERDU** |

---

## 5. FILTRES ET DTO

### .select() / .projection()

**Résultat : AUCUN .select() trouvé dans tout le backend.**

Ni dans le controller CRV, ni dans le service CRV, ni dans le générateur PDF.
Les données sont récupérées sans filtrage de champs.

### DTO / Mapping

**Résultat : AUCUN DTO trouvé.**

Les documents MongoDB sont renvoyés bruts aux clients API.
Le seul mapping est dans les fonctions de formatage du PDF (`fmtTime`, `fmtDate`, `ecartText`).

---

## 6. CONCLUSION

### Le backend récupère-t-il toutes les données ?

**NON.** Deux niveaux de perte identifiés :

#### Niveau 1 — Données jamais créées

| Donnée | Raison | Impact |
|---|---|---|
| `ChronologiePhase.heureDebutPrevue` | `initialiserPhasesVol()` ne les calcule pas | Colonne "Prévu" vide |
| `ChronologiePhase.heureFinPrevue` | idem | écartMinutes jamais calculé |
| `ChronologiePhase.ecartMinutes` | Dépend de heureFinPrevue (hook pre-save) | Colonne "Écart" vide |

**Les données source existent** : `Horaire.heureAtterrisagePrevue` + `Phase.dureeStandardMinutes`
**Le calcul est possible** mais non implémenté dans `initialiserPhasesVol()`.

#### Niveau 2 — Données existantes non récupérées par le PDF

| Donnée | Existe dans | Populé par controller | Populé par PDF |
|---|---|---|---|
| `Avion.immatriculation` | Collection Avions | ✅ deep populate | ❌ |
| `Avion.typeAvion` | Collection Avions | ✅ deep populate | ❌ |
| `Horaire.*` (17 champs) | Collection Horaires | ✅ `.populate('horaire')` | ❌ |
| `Phase.dureeStandardMinutes` | Collection Phases | ✅ via populate | ✅ récupéré mais ❌ non rendu |

#### Niveau 3 — Données perdues dans le pipeline Bulletin → Vol

| Donnée | Perdue où | Alternative |
|---|---|---|
| `mouvement.typeAvion` | `creerVolDepuisMouvement()` | Vol.avion (ref manuellement renseignée après) |

### Résumé des actions correctives nécessaires

| Priorité | Action | Fichier |
|---|---|---|
| **P0** | Calculer heureDebutPrevue/heureFinPrevue à partir de Horaire + dureeStandardMinutes | `phase.service.js` → `initialiserPhasesVol()` |
| **P0** | Ajouter deep populate vol→avion dans CrvGenerator.fetchData() | `CrvGenerator.js` |
| **P0** | Ajouter populate horaire dans CrvGenerator.fetchData() | `CrvGenerator.js` |
| **P1** | Afficher dureeStandardMinutes dans le tableau chronologie | `CrvGenerator.js` |
| **P2** | Afficher heures prévues vol (atterrissage/décollage) dans la synthèse | `CrvGenerator.js` |
