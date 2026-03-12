# AUDIT FULLSTACK POST-HARDENING — CRV PIPELINE

**Date :** 2026-03-11
**Branche :** mission/hardening-backend-pipeline
**Mission :** Vérification complète du pipeline après hardening backend
**Statut :** AUDIT UNIQUEMENT — Aucune modification de code

---

## CONTEXTE

Le hardening backend a modifié 5 fichiers :
- `Vol.js` — ajout champ `typeAvion`
- `crv.service.js` — mapping `typeAvion` dans `creerVolDepuisMouvement()`
- `bulletinMouvement.service.js` — mapping `typeAvion` dans `creerVolsDepuisBulletin()`
- `phase.service.js` — import Horaire, paramètre `horaireId`, calcul cascade temporelle
- `crv.controller.js` — passage `horaire?._id` à `initialiserPhasesVol()`

---

## TABLEAU SYNTHÈSE — TRAÇABILITÉ DES 7 CHAMPS

| # | Champ | Backend Model | Backend Service | API populate | Store | Frontend | PDF | Statut |
|---|-------|--------------|-----------------|-------------|-------|----------|-----|--------|
| 1 | `typeAvion` | ✅ Vol.js L68 | ✅ crv.service L672, bulletin L813 | ✅ populate('vol') | ✅ Passif | ⚠️ CRVHeader L88 (OK) mais CRVDepart L366 cherche `vol.avion?.typeAvion` | ✅ CrvGenerator L344 | ⚠️ PATH BUG FRONTEND |
| 2 | `heureDebutPrevue` | ✅ ChronologiePhase L63 | ✅ phase.service L97 | ✅ ChronologiePhase.find() | ✅ Passif | ❌ Non affiché | ✅ CrvGenerator L462 | ⚠️ FRONTEND CACHÉ |
| 3 | `heureFinPrevue` | ✅ ChronologiePhase L65 | ✅ phase.service L98-99 | ✅ ChronologiePhase.find() | ✅ Passif | ❌ Non affiché | ❌ Non affiché | ⚠️ INVISIBLE |
| 4 | `dureeStandardMinutes` | ✅ Phase.js L35 | ✅ phase.service L98 (calcul) | ✅ populate('phase') | ✅ Passif | ⚠️ Utilisé comme `dureePrevue` | ❌ Non affiché | ⚠️ CONFUSION NOM |
| 5 | `ecartMinutes` | ✅ ChronologiePhase L68 | ✅ pre-save hook L137-145 | ✅ Direct | ✅ Passif | ⚠️ Recalculé au lieu d'être utilisé | ✅ CrvGenerator L302, L466 | ⚠️ REDONDANCE |
| 6 | `heureAtterrisagePrevue` | ✅ Horaire.js L9 | ✅ crv.controller L115 | ✅ populate('horaire') | ✅ Passif | ❌ Non affiché | ❌ Non chargé | 🔴 GAP PDF |
| 7 | `heureDecollagePrevue` | ✅ Horaire.js L15 | ✅ crv.controller L118 | ✅ populate('horaire') | ✅ Passif | ❌ Non affiché | ❌ Non chargé | 🔴 GAP PDF |

---

## PHASE 1 — VÉRIFICATION BACKEND

### 1.1 Vol.js — typeAvion
- **Ligne 68-74** : Champ `typeAvion` ajouté, type String, optional, default null
- **Propagation confirmée** :
  - `VolProgramme.typeAvion` → `BulletinMouvement.mouvements[].typeAvion` (bulletinMouvement.service L174)
  - `BulletinMouvement.mouvements[].typeAvion` → `Vol.typeAvion` (bulletinMouvement.service L813)
  - `mouvement.typeAvion` → `Vol.typeAvion` (crv.service L672)
- **Verdict** : ✅ COMPLET

### 1.2 ChronologiePhase.js — heureDebutPrevue / heureFinPrevue
- **Ligne 63** : `heureDebutPrevue` (Date, optional)
- **Ligne 65** : `heureFinPrevue` (Date, optional)
- **Pre-save hook L137-145** : calcule `ecartMinutes` si `heureDebutPrevue` && `heureFinPrevue` && `dureeReelleMinutes` existent
- **Verdict** : ✅ Modèle correct

### 1.3 phase.service.js — Calcul cascade
- **Ligne 3** : Import Horaire ✅
- **Ligne 18** : Paramètre `horaireId` (default null) ✅
- **Ligne 71** : `Horaire.findById(horaireId)` ✅
- **Lignes 73-77** : Référence temporelle selon typeOperation :
  - ARRIVEE → `horaire.heureAtterrisagePrevue`
  - DEPART → `horaire.heureDecollagePrevue`
- **Lignes 96-101** : Cascade correcte :
  ```
  phase1.debut = reference
  phase1.fin = reference + dureeStandardMinutes
  phase2.debut = phase1.fin
  phase2.fin = phase2.debut + dureeStandardMinutes
  ```
- **Verdict** : ✅ COMPLET

### 1.4 crv.controller.js — Appel initialiserPhasesVol
- **Ligne 315** : `await initialiserPhasesVol(crv._id, vol.typeOperation, horaire?._id || null)`
- **Verdict** : ✅ horaireId transmis correctement

---

## PHASE 2 — VÉRIFICATION API

### 2.1 GET /crv/:id (crv.controller.js L417-506)

| Populate | Ligne | Présent | Accès champs |
|----------|-------|---------|-------------|
| `populate({ path: 'vol', populate: { path: 'avion' } })` | 433 | ✅ | vol.typeAvion, vol.avion.typeAvion, vol.avion.immatriculation |
| `populate('horaire')` | 434 | ✅ | horaire.heureAtterrisagePrevue, horaire.heureDecollagePrevue |
| `ChronologiePhase.find().populate('phase')` | 456-459 | ✅ | phases[].heureDebutPrevue, phases[].heureFinPrevue, phases[].phase.dureeStandardMinutes |

**Verdict** : ✅ API renvoie tous les 7 champs correctement

### 2.2 Route
- `GET /:id` — crv.routes.js L150, middleware: `protect, excludeAdmin`
- **Verdict** : ✅ Existante

---

## PHASE 3 — DONNÉES RÉELLES MONGODB

### CRV testé : `CRV260311-0013` (ID: 69b0d282497f312717732ea1)

Ce CRV a été créé **AVANT** le hardening. Résultats :

| Champ | Valeur en base | Commentaire |
|-------|---------------|-------------|
| `vol.typeAvion` | **undefined** | ❌ Non propagé (CRV pré-hardening) |
| `vol.avion.typeAvion` | `RPJ` | ✅ Accessible via populate avion |
| `vol.avion.immatriculation` | `JK786EF` | ✅ Accessible via populate avion |
| `horaire.heureAtterrisagePrevue` | `2026-03-11T17:50:00.000Z` | ✅ Présent |
| `horaire.heureDecollagePrevue` | `null` | ✅ Normal (vol ARRIVEE) |
| `phases[].heureDebutPrevue` | **null** (×10) | ❌ Non calculé (CRV pré-hardening) |
| `phases[].heureFinPrevue` | **null** (×10) | ❌ Non calculé (CRV pré-hardening) |
| `phases[].ecartMinutes` | **null** (×10) | ❌ Jamais calculé (pas de prévues) |
| `phases[].dureeReelleMinutes` | `0` (×10) | ⚠️ Phases de 4 secondes → arrondi à 0 |
| `phase.dureeStandardMinutes` | 5-30 min | ✅ Présent dans le référentiel |

### Conclusion Phase 3

**Les CRV existants n'ont PAS les données hardening.**
Le hardening ne s'applique qu'aux CRV créés APRÈS le déploiement.

Pour les CRV existants :
- `typeAvion` → fallback via `vol.avion.typeAvion` (deep populate) ✅
- `heureDebutPrevue` / `heureFinPrevue` → resteront `null` ⚠️
- `ecartMinutes` → restera `null` ⚠️

**Aucun script de migration n'existe pour les CRV historiques.**

---

## PHASE 4 — VÉRIFICATION FRONTEND

### 4.1 CRVHeader.vue — typeAvion
- **Ligne 88-97** : Champ `v-model="localData.typeAvion"`, label "Type avion"
- **Source** : `props.crv.vol?.typeAvion` ou édition manuelle
- **Verdict** : ✅ Affiché et éditable

### 4.2 CRVPhases.vue — Heures prévues
| Champ | Affiché | Détail |
|-------|---------|--------|
| `heureDebutPrevue` | ❌ NON | Affiche uniquement `heureDebutReelle` (L254, L333) |
| `heureFinPrevue` | ❌ NON | Affiche uniquement `heureFinReelle` (L342) |
| `dureeStandardMinutes` | ⚠️ INDIRECT | Utilisé sous le nom `dureePrevue` (L358) |
| `ecartMinutes` | ⚠️ RECALCULÉ | Recalcule au lieu d'utiliser `phase.ecartMinutes` (L363-364) |

**Problème critique** : Le composant CRVPhases n'a aucune colonne "Prévu" — l'opérateur ne peut pas comparer prévu vs réel.

### 4.3 CRVDepart.vue — Bug path typeAvion
- **Ligne 366** : Accède à `vol.avion?.typeAvion` au lieu de `vol.typeAvion`
- **Impact** : Fonctionnel grâce au deep populate, mais incohérent avec le hardening

### 4.4 CRVArrivee.vue / CRVTurnAround.vue
- `heureAtterrisagePrevue` : ❌ Non affiché nulle part
- `heureDecollagePrevue` : ❌ Non affiché nulle part

---

## PHASE 5 — VÉRIFICATION STORE

### crvStore.js — loadCRV() (L356-399)

```javascript
const result = this._extractData(response)
this.currentCRV = result.crv || result    // vol, horaire inclus
this.phases = result.phases || []          // chronologiePhases incluses
```

| Donnée | Stockée | Transformée | Perdue |
|--------|---------|-------------|--------|
| `currentCRV.vol` | ✅ | Non | Non |
| `currentCRV.vol.typeAvion` | ✅ | Non | Non |
| `currentCRV.horaire` | ✅ | Non | Non |
| `phases[]` | ✅ | Non | Non |
| `phases[].heureDebutPrevue` | ✅ | Non | Non |
| `phases[].heureFinPrevue` | ✅ | Non | Non |
| `phases[].ecartMinutes` | ✅ | Non | Non |

**Verdict** : ✅ Le store est passif — aucune perte de données. Tous les champs traversent intacts.

---

## PHASE 6 — VÉRIFICATION PDF (CrvGenerator.js)

### 6.1 fetchData() — Populates

| Populate | Présent | Ligne | Champs accessibles |
|----------|---------|-------|--------------------|
| `.populate('vol')` | ✅ | L133 | vol.typeAvion ✅ |
| Deep populate `vol→avion` | ❌ NON | — | vol.avion.typeAvion inaccessible |
| `populate('horaire')` | ❌ NON | — | horaire.* inaccessible |
| `ChronologiePhase.find().populate('phase')` | ✅ | L142 | phases[].phase.dureeStandardMinutes ✅ |

### 6.2 Affichage champs

| Champ | Utilisé dans PDF | Ligne | Statut |
|-------|-----------------|-------|--------|
| `vol.typeAvion` | ✅ | L344 (`vol.typeAppareil \|\| vol.typeAvion \|\| '-'`) | ✅ OK (fallback) |
| `heureDebutPrevue` | ✅ | L462 (`fmtTime(p.heureDebutPrevue)`) | ✅ OK |
| `heureFinPrevue` | ❌ | — | ❌ Non affiché |
| `dureeStandardMinutes` | ❌ | — | ❌ Non affiché |
| `ecartMinutes` | ✅ | L302, L356, L466 | ✅ OK (KPI + tableau) |
| `heureAtterrisagePrevue` | ❌ | — | 🔴 Non chargé |
| `heureDecollagePrevue` | ❌ | — | 🔴 Non chargé |

### 6.3 Gaps PDF critiques

1. **Horaire non chargé** — `fetchData()` ne fait pas `Horaire.findOne({ vol })` ni `populate('horaire')`
2. **Deep populate manquant** — Pour les CRV pré-hardening sans `vol.typeAvion`, le fallback `vol.avion.typeAvion` échoue car avion n'est pas populaté
3. **heureFinPrevue non affichée** — Colonne "Fin prévue" absente du tableau chronologie

---

## PHASE 7 — DÉTECTION RÉGRESSION

| Fonctionnalité | Risque | Analyse |
|----------------|--------|---------|
| Création CRV | ✅ Aucun | `initialiserPhasesVol` backward-compatible (horaireId optional, try/catch) |
| Édition phases | ✅ Aucun | Aucune modification du flux d'édition |
| Validation CRV | ✅ Aucun | validation.service.js non modifié par hardening |
| Verrouillage CRV | ✅ Aucun | businessRules.middleware.js non modifié par hardening |
| Génération PDF | ✅ Aucun | CrvGenerator.js non modifié par hardening |
| Chargement frontend | ✅ Aucun | Store passif, pas de transformation |

**Verdict : AUCUNE RÉGRESSION détectée.**

Le hardening est backward-compatible :
- `typeAvion` default `null` → affiche `-` si absent
- `horaireId` default `null` → phases créées sans prévues si horaire absent
- try/catch dans cascade → erreur silencieuse, phases créées quand même

---

## PHASE 8 — RECOMMANDATIONS

### Priorité 0 — Corrections critiques

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| P0-1 | Ajouter `populate('horaire')` dans `fetchData()` | CrvGenerator.js | Débloque horaires prévus dans PDF |
| P0-2 | Ajouter deep populate `vol→avion` dans `fetchData()` | CrvGenerator.js | Fallback typeAvion pour CRV pré-hardening |
| P0-3 | Afficher `heureDebutPrevue` / `heureFinPrevue` dans CRVPhases.vue | CRVPhases.vue | Comparaison prévu vs réel |

### Priorité 1 — Améliorations

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| P1-1 | Afficher `heureFinPrevue` dans le PDF (colonne supplémentaire) | CrvGenerator.js | Chronologie complète |
| P1-2 | Utiliser `ecartMinutes` du backend au lieu de recalculer | CRVPhases.vue | Cohérence backend/frontend |
| P1-3 | Afficher `heureAtterrisagePrevue` / `heureDecollagePrevue` dans CRVArrivee/CRVDepart | Views CRV | Visibilité horaires programmés |
| P1-4 | Corriger path `vol.avion?.typeAvion` → `vol.typeAvion` dans CRVDepart.vue L366 | CRVDepart.vue | Cohérence |

### Priorité 2 — Migration données

| # | Action | Impact |
|---|--------|--------|
| P2-1 | Script migration pour injecter `typeAvion` dans les Vol existants depuis Avion ref | Rétro-compatibilité |
| P2-2 | Script migration pour recalculer `heureDebutPrevue`/`heureFinPrevue` des CRV existants | Historique complet |

### Hors scope (non recommandé maintenant)

- Stocker `dureeStandardMinutes` dans ChronologiePhase (dénormalisation inutile — accessible via populate)
- Ajouter un champ `dureePreveMinutes` calculé dans ChronologiePhase (la différence heureFinPrevue - heureDebutPrevue suffit)

---

## SCHÉMA PIPELINE VÉRIFIÉ

```
VolProgramme
    │ typeAvion ✅
    ▼
BulletinMouvement
    │ mouvements[].typeAvion ✅
    │ heureArriveePrevue ✅
    │ heureDepartPrevue ✅
    ▼
┌────────────────────────────────────────┐
│ Vol                                     │
│   typeAvion ✅ (nouveau)                │
│   avion → Avion.typeAvion ✅ (existant) │
└────────────┬───────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
 Horaire           CRV
 ├ atterrP ✅      ├ vol (ref) ✅
 └ decolP ✅       ├ horaire (ref) ✅
                    └ chronologiePhases ▼
                                        │
                    ChronologiePhase     │
                    ├ heureDebutPrevue ✅ (cascade)
                    ├ heureFinPrevue ✅   (cascade)
                    ├ heureDebutReelle ✅ (saisie)
                    ├ heureFinReelle ✅   (saisie)
                    ├ dureeReelleMinutes ✅ (hook)
                    ├ ecartMinutes ✅      (hook)
                    └ phase → Phase.dureeStandardMinutes ✅
                                        │
              ┌─────────────────────────┤
              ▼                         ▼
         API GET /crv/:id          CrvGenerator
         ├ vol ✅ (deep pop)       ├ vol ✅ (simple pop)
         ├ horaire ✅              ├ horaire ❌ MANQUANT
         ├ phases ✅               ├ phases ✅
         │                         └ vol.avion ❌ MANQUANT
         ▼
    crvStore (passif) ✅
         │
    ┌────┴──────────────────┐
    ▼                       ▼
 CRVHeader              CRVPhases
 ├ typeAvion ✅          ├ heureDebutReelle ✅
 │                       ├ heureFinReelle ✅
 │                       ├ heureDebutPrevue ❌ CACHÉ
 │                       ├ heureFinPrevue ❌ CACHÉ
 │                       └ ecartMinutes ⚠️ RECALCULÉ
 │
 CRVArrivee/CRVDepart
 ├ heureAtterrisagePrevue ❌ ABSENT
 └ heureDecollagePrevue ❌ ABSENT
```

---

## CONCLUSION

**Le hardening backend est CORRECT et COMPLET.**

Les 5 fichiers modifiés propagent correctement `typeAvion` et calculent la cascade temporelle pour les heures prévues. Aucune régression détectée.

**Gaps restants — tous côté DISPLAY (frontend + PDF) :**

| Gap | Localisation | Type |
|-----|-------------|------|
| Horaire non chargé dans PDF | CrvGenerator.js fetchData() | P0 |
| Deep populate manquant dans PDF | CrvGenerator.js fetchData() | P0 |
| Heures prévues cachées en frontend | CRVPhases.vue | P0 |
| heureFinPrevue absente du PDF | CrvGenerator.js page chronologie | P1 |
| ecartMinutes recalculé au frontend | CRVPhases.vue | P1 |
| Horaires vol non affichés | CRVArrivee/CRVDepart.vue | P1 |
| CRV historiques sans données prévues | MongoDB | P2 (migration) |

**Prochaine mission recommandée : Mission B — Display Hardening**
- Scope : CrvGenerator.js (P0-1, P0-2, P1-1) + CRVPhases.vue (P0-3, P1-2)
- Niveau cérémonie : 🟨 Standard (pas de zone rouge)
