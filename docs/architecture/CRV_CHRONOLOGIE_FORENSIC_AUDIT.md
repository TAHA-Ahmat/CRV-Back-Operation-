# CRV_CHRONOLOGIE_FORENSIC_AUDIT

Date : 2026-03-11
Auteur : Claude Code (audit forensique)
CRV analysé : `69b0d282497f312717732ea1`

---

## 1. DONNÉES BRUTES EN BASE

**Collection** : `chronologiephases`
**Filtre** : `{ crv: '69b0d282497f312717732ea1' }`
**Résultat** : 10 documents, tous `statut: TERMINE`

### Document exemple (1er document)

```json
{
  "_id": "69b0d283497f312717732ea4",
  "crv": "69b0d282497f312717732ea1",
  "phase": "69b0abc587d686e1ce7b4279",
  "statut": "TERMINE",
  "heureDebutReelle": "2026-03-11T02:27:33.248Z",
  "heureFinReelle": "2026-03-11T02:27:37.995Z",
  "dureeReelleMinutes": 0,
  "horodatageDebut": {
    "timestampSysteme": "2026-03-11T02:27:33.248Z",
    "heureDeclaree": "2026-03-11T02:27:33.248Z",
    "source": "TEMPS_REEL"
  },
  "horodatageFin": {
    "timestampSysteme": "2026-03-11T02:27:37.995Z",
    "heureDeclaree": "2026-03-11T02:27:37.995Z",
    "source": "TEMPS_REEL"
  },
  "createdAt": "2026-03-11T02:25:07.102Z",
  "updatedAt": "2026-03-11T02:27:37.996Z"
}
```

### Synthèse des 10 documents

| # | Phase ID (last 4) | heureDebutPrevue | heureDebutReelle | heureFinReelle | dureeReelleMinutes | ecartMinutes | statut |
|---|---|---|---|---|---|---|---|
| 1 | 4279 | **ABSENT** | 02:27:33 | 02:27:37 | 0 | **ABSENT** | TERMINE |
| 2 | 427a | **ABSENT** | 02:27:43 | 02:27:48 | 0 | **ABSENT** | TERMINE |
| 3 | 427b | **ABSENT** | 02:27:54 | 02:27:58 | 0 | **ABSENT** | TERMINE |
| 4 | 427c | **ABSENT** | 02:28:04 | 02:28:08 | 0 | **ABSENT** | TERMINE |
| 5 | 427d | **ABSENT** | 02:28:14 | 02:28:19 | 0 | **ABSENT** | TERMINE |
| 6 | 427e | **ABSENT** | 02:28:24 | 02:28:28 | 0 | **ABSENT** | TERMINE |
| 7 | 427f | **ABSENT** | 02:28:34 | 02:28:38 | 0 | **ABSENT** | TERMINE |
| 8 | 4280 | **ABSENT** | 02:28:43 | 02:28:48 | 0 | **ABSENT** | TERMINE |
| 9 | 428b | **ABSENT** | 02:28:53 | 02:28:58 | 0 | **ABSENT** | TERMINE |
| 10 | 428c | **ABSENT** | 01:29:00* | *non affiché* | *non affiché* | **ABSENT** | TERMINE |

\* Phase 10 a `source: DECLARATION`, `ecartSaisieMinutes: 65`, `saisieTardive: true`

### Constat critique sur les données

**`heureDebutPrevue`** : ABSENT des 10 documents. Le champ n'existe pas.
**`heureFinPrevue`** : ABSENT des 10 documents. Le champ n'existe pas.
**`ecartMinutes`** : ABSENT des 10 documents. Le champ n'existe pas.
**`dureeReelleMinutes`** : présent = `0` sur tous les documents.

---

## 2. STRUCTURE DU MODÈLE

**Fichier** : `src/models/phases/ChronologiePhase.js`

### Champs définis dans le schéma

| Champ | Type | Présent en base ? |
|---|---|---|
| `heureDebutPrevue` | Date | **NON** — jamais renseigné |
| `heureDebutReelle` | Date | OUI |
| `heureFinPrevue` | Date | **NON** — jamais renseigné |
| `heureFinReelle` | Date | OUI |
| `dureeReelleMinutes` | Number | OUI (mais = 0) |
| `ecartMinutes` | Number | **NON** — jamais calculé |
| `statut` | String | OUI |
| `horodatageDebut` | Sub-document | OUI |
| `horodatageFin` | Sub-document | OUI |

### Analyse du hook `pre('save')` (lignes 103-169)

```javascript
// Calcul durée réelle
if (this.heureDebutReelle && this.heureFinReelle) {
  this.dureeReelleMinutes = calculerDureeMinutes(
    this.heureDebutReelle, this.heureFinReelle
  );
}

// Calcul écart
if (this.heureDebutPrevue && this.heureFinPrevue && this.dureeReelleMinutes !== null) {
  const dureePrevue = calculerDureeMinutes(this.heureDebutPrevue, this.heureFinPrevue);
  if (dureePrevue !== null) {
    this.ecartMinutes = this.dureeReelleMinutes - dureePrevue;
  }
}
```

**Le calcul d'`ecartMinutes` requiert `heureDebutPrevue` ET `heureFinPrevue`.**
Comme ces champs ne sont jamais renseignés → `ecartMinutes` n'est jamais calculé.

---

## 3. DONNÉES ENVOYÉES AU GÉNÉRATEUR PDF

**Fichier** : `CrvGenerator.js`, méthode `fetchData()` (ligne 141)

```javascript
ChronologiePhase.find({ crv: crvId })
  .populate('phase')
  .populate('responsable', 'nom prenom')
  .sort({ 'phase.ordre': 1 })
```

**Ce qui arrive au générateur** (document Mongoose hydraté) :

```
{
  phase: { libelle: '...', typeOperation: '...', ordre: N },    // populé
  heureDebutPrevue: undefined,      // ABSENT en base
  heureDebutReelle: Date,           // OK
  heureFinReelle: Date,             // OK
  dureeReelleMinutes: 0,            // PRÉSENT mais = 0
  ecartMinutes: undefined,          // ABSENT en base
  statut: 'TERMINE'                 // OK
}
```

Le `fetchData()` ne transforme pas les données. Il passe les documents Mongoose bruts.

---

## 4. MAPPING PDF — _page3_timeline()

**Fichier** : `CrvGenerator.js`, lignes 460-468

```javascript
const phaseRows = phases.map(p => [
  { text: p.phase?.libelle || '-' },         // Phase     ← p.phase.libelle        ✅ OK
  { text: fmtTime(p.heureDebutPrevue) },     // Prevu     ← p.heureDebutPrevue     ❌ UNDEFINED → '-'
  { text: fmtTime(p.heureDebutReelle) },     // Debut     ← p.heureDebutReelle     ✅ OK
  { text: fmtTime(p.heureFinReelle) },       // Fin       ← p.heureFinReelle       ✅ OK
  { text: p.dureeReelleMinutes != null        // Duree     ← p.dureeReelleMinutes   ⚠️ = 0 → "0'"
    ? `${p.dureeReelleMinutes}'` : '-' },
  { text: ecartText(p.ecartMinutes) },       // Ecart     ← p.ecartMinutes         ❌ UNDEFINED → '-'
  { text: STATUT_PHASE[p.statut] || p.statut }, // Statut ← p.statut              ✅ OK
]);
```

### Noms de champs — Correspondance

| Colonne PDF | Propriété utilisée | Propriété en base | Match ? |
|---|---|---|---|
| Phase | `p.phase.libelle` | `phase` (populate) | ✅ OK |
| Prevu | `p.heureDebutPrevue` | `heureDebutPrevue` | ✅ NOM CORRECT — mais données absentes |
| Debut | `p.heureDebutReelle` | `heureDebutReelle` | ✅ OK |
| Fin | `p.heureFinReelle` | `heureFinReelle` | ✅ OK |
| Duree | `p.dureeReelleMinutes` | `dureeReelleMinutes` | ✅ NOM CORRECT — mais valeur = 0 |
| Ecart | `p.ecartMinutes` | `ecartMinutes` | ✅ NOM CORRECT — mais données absentes |
| Statut | `p.statut` | `statut` | ✅ OK |

**CONCLUSION PHASE 4** : Le mapping PDF est CORRECT. Les noms de propriétés correspondent exactement au modèle. Le problème n'est pas un mismatch de noms.

---

## 5. ANALYSE DES CALCULS

### Durée (`dureeReelleMinutes`)

**Calculée par** : hook `pre('save')` dans `ChronologiePhase.js` (ligne 129-134)
**Fonction** : `calculerDureeMinutes()` dans `services/charges/calcul.service.js` (ligne 18-45)

```javascript
const dureeMs = fin - debut;
const dureeMinutes = Math.round(dureeMs / 60000);
return dureeMinutes;
```

**Preuve du problème** :
- Phase 1 : début = `02:27:33.248`, fin = `02:27:37.995`
- Différence = 4747 ms = 4.747 secondes
- `Math.round(4747 / 60000)` = `Math.round(0.079)` = **0**

Les phases ont été exécutées en séquence rapide (test automatisé ou clics rapides), chaque phase durant ~4-5 secondes. `Math.round` arrondit à 0 pour toute durée < 30 secondes.

**La durée est correctement calculée par le code, mais les données de test sont artificielles** (phases terminées en quelques secondes au lieu de minutes).

### Écart (`ecartMinutes`)

**Calculé par** : hook `pre('save')` (ligne 137-146)
**Condition** : `if (this.heureDebutPrevue && this.heureFinPrevue && this.dureeReelleMinutes !== null)`

**Résultat** : `heureDebutPrevue` est toujours `undefined` → condition `false` → `ecartMinutes` n'est jamais calculé → champ absent en base.

**ROOT CAUSE** : Les heures prévues ne sont jamais injectées dans les documents ChronologiePhase.

---

## 6. ANALYSE TIMEZONE

### `fmtTime()` dans CrvGenerator.js (ligne 75)

```javascript
const fmtTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
```

- Utilise `toLocaleTimeString('fr-FR')` **sans spécifier de timezone**
- Sur le serveur, cela utilise la timezone système (probablement UTC ou Africa/Ndjamena UTC+1)
- Les données en base sont en UTC (`2026-03-11T02:27:33.248Z`)
- Le `horodatageSchema` stocke `timezoneAeroport: 'UTC'`

**Risque** : si le serveur est en UTC+1, les heures affichées dans le PDF seront décalées de +1h par rapport aux heures réelles UTC stockées. Ce n'est pas la cause du bug actuel mais constitue un risque latent.

---

## 7. ROOT CAUSE — SYNTHÈSE

### 3 problèmes distincts identifiés

#### ROOT CAUSE #1 — `heureDebutPrevue` jamais renseigné (CRITIQUE)

**Impact** : Colonne "Prévu" = `-` dans le PDF
**Cause** : Le processus de création des ChronologiePhase ne peuple pas `heureDebutPrevue` ni `heureFinPrevue`.
**Preuve** : 10/10 documents en base n'ont pas ce champ.
**Question ouverte** : D'où devrait venir l'heure prévue ? Possibilités :
1. Du programme de vol saisonnier (heures programmées)
2. De la définition de la Phase (durée standard)
3. Saisie manuelle par l'agent
4. Calculée à partir de l'heure d'arrivée prévue + offset phase

#### ROOT CAUSE #2 — `ecartMinutes` jamais calculé (conséquence de #1)

**Impact** : Colonne "Écart" = `-` dans le PDF
**Cause** : Le calcul dans le hook `pre('save')` requiert `heureDebutPrevue` ET `heureFinPrevue`. Comme ces champs sont absents → condition `false` → écart jamais calculé.
**Preuve** : 10/10 documents en base n'ont pas ce champ.

#### ROOT CAUSE #3 — `dureeReelleMinutes` = 0 (données de test)

**Impact** : Colonne "Durée" = `0'` dans le PDF
**Cause** : Les phases ont été terminées en ~4-5 secondes (clics rapides / test automatisé). `Math.round(4747ms / 60000)` = 0.
**Preuve** : Toutes les phases montrent début→fin en 4-5 secondes.
**Ce n'est PAS un bug de code** mais un artefact de données de test non réalistes.

---

## 8. TRACE COMPLÈTE DU FLUX

```
MongoDB (chronologiephases)
│
│  heureDebutPrevue: ABSENT
│  heureFinPrevue: ABSENT
│  heureDebutReelle: Date  ✅
│  heureFinReelle: Date  ✅
│  dureeReelleMinutes: 0   (Math.round arrondi)
│  ecartMinutes: ABSENT    (jamais calculé car pas de prévues)
│
├─── pre('save') hook ─────────────────────────────────
│    │
│    │  if (heureDebutReelle && heureFinReelle)         → TRUE
│    │    dureeReelleMinutes = calculerDureeMinutes()   → 0 (4s arrondi)
│    │
│    │  if (heureDebutPrevue && heureFinPrevue && ...)  → FALSE (pas de prévues)
│    │    ecartMinutes = ...                            → JAMAIS EXECUTÉ
│    │
│
├─── CrvGenerator.fetchData() ─────────────────────────
│    │
│    │  ChronologiePhase.find({ crv }).populate('phase')
│    │  → 10 documents Mongoose avec champs tels quels
│    │
│
├─── CrvGenerator._page3_timeline() ───────────────────
│    │
│    │  fmtTime(p.heureDebutPrevue)   → fmtTime(undefined) → '-'
│    │  fmtTime(p.heureDebutReelle)   → fmtTime(Date)      → '02:27'  ✅
│    │  fmtTime(p.heureFinReelle)     → fmtTime(Date)      → '02:27'  ✅
│    │  p.dureeReelleMinutes          → 0 !== null          → "0'"
│    │  ecartText(p.ecartMinutes)     → ecartText(undefined)→ '-'
│    │
│
└─── PDF RENDU ─────────────────────────────────────────
     │
     │  Phase  | Prevu | Debut | Fin   | Duree | Ecart | Statut
     │  -------|-------|-------|-------|-------|-------|--------
     │  [nom]  |   -   | 02:27 | 02:27 |  0'   |   -   | Termine
```

---

## 9. MATRICE DE VÉRITÉ

| Question | Réponse | Preuve |
|---|---|---|
| Le mapping PDF utilise les bons noms ? | **OUI** | `heureDebutPrevue`, `dureeReelleMinutes`, `ecartMinutes` — noms identiques modèle ↔ PDF |
| Les données existent en base ? | **PARTIELLEMENT** | `heureDebutReelle` ✅, `heureFinReelle` ✅, `heureDebutPrevue` ❌, `heureFinPrevue` ❌, `ecartMinutes` ❌ |
| Le problème est dans le code PDF ? | **NON** | Le générateur lit correctement ce qui est en base |
| Le problème est dans le hook pre('save') ? | **NON** | Le hook calcule correctement — mais les inputs prévus manquent |
| Le problème est à l'insertion des données ? | **OUI** | Les heures prévues ne sont jamais peuplées lors de la création des phases |
| La durée = 0 est un bug ? | **NON** | C'est le résultat correct de `Math.round(4.7sec / 60)` = 0 min |

---

## 10. RECOMMANDATIONS (sans modification)

### P0 — Injection des heures prévues

Le système doit peupler `heureDebutPrevue` et `heureFinPrevue` lors de la création des ChronologiePhase. Sources possibles :
- Programme de vol saisonnier (heures ETD/ETA)
- Référentiel Phase (durée standard par type de phase)
- Calcul : `heureArrivéePrévue + offset_phase_minutes`

Sans ces données, les colonnes "Prévu" et "Écart" resteront vides pour tout CRV.

### P1 — Durée sub-minute

Pour des opérations réelles (phases de 5-45 minutes), `Math.round(ms / 60000)` fonctionnera correctement. Le `0'` actuel est un artefact de test. Aucune correction nécessaire si les données réelles sont normales.

### P2 — Timezone

`fmtTime()` devrait explicitement spécifier `{ timeZone: 'UTC' }` ou `{ timeZone: 'Africa/Ndjamena' }` pour garantir un affichage cohérent quel que soit le serveur.
