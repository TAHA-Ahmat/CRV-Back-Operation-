# RAPPORT MISSION — DISPLAY HARDENING CRV

**Date :** 2026-03-11
**Branche :** mission/hardening-backend-pipeline
**Niveau cérémonie :** Standard
**Périmètre :** Frontend (Vue) + PDF (CrvGenerator)
**Domaine :** Display / Affichage

---

## FICHIERS MODIFIÉS

| # | Fichier | Lignes modifiées | Nature |
|---|---------|-----------------|--------|
| 1 | `src/services/documents/crv/CrvGenerator.js` | fetchData, page1, page3 | Deep populate vol→avion, populate horaire, section HORAIRES PREVUS, colonnes Fin prévue |
| 2 | `Front/src/components/crv/CRVPhases.vue` | template TERMINE, script, styles | Affichage prévu vs réel, ecartMinutes backend |
| 3 | `Front/src/views/CRV/CRVDepart.vue` | template, script, styles | Corriger path typeAvion, ajouter horaires prévus |
| 4 | `Front/src/views/CRV/CRVArrivee.vue` | template, script, styles | Corriger path typeAvion, ajouter horaires prévus |

**Fichiers zone rouge touchés :** NON

---

## DÉTAIL DES MODIFICATIONS

### 1. CrvGenerator.js — PDF

**fetchData() :**
- `.populate('vol')` → `.populate({ path: 'vol', populate: { path: 'avion' } })`
- Ajout `.populate('horaire')`
- `data.horaire` ajouté au return

**Page 1 — AERONEF :**
- Type avion : `vol.typeAvion || vol.avion?.typeAvion || '-'` (fallback deep populate)
- Immatriculation : `vol.avion?.immatriculation || vol.immatriculation || '-'`

**Page 1 — HORAIRES PREVUS (nouvelle section) :**
- Atterrissage prévu : `fmtTime(horaire.heureAtterrisagePrevue)`
- Décollage prévu : `fmtTime(horaire.heureDecollagePrevue)`

**Page 3 — CHRONOLOGIE (tableau élargi) :**
- Avant : 7 colonnes (Phase, Prévu, Début, Fin, Durée, Écart, Statut)
- Après : 8 colonnes (Phase, Déb. prévu, Déb. réel, Fin prévue, Fin réelle, Durée, Écart, Statut)
- Widths : `['20%', '10%', '10%', '10%', '10%', '9%', '12%', '19%']`

### 2. CRVPhases.vue — Frontend

**Template TERMINE (vue par défaut) :**
- Ajout section "Horaires prévus" (v-if heureDebutPrevue || heureFinPrevue)
  - Début prévu + Fin prévue en lecture seule, style bleu
- Labels renommés : "Début réel", "Fin réelle"
- Écart SLA : utilise directement `phase.ecartMinutes` du backend (plus de recalcul)

**Script :**
- Ajout fonction `formatDateTime()` pour afficher heures prévues

**Styles :**
- `.phase-prevu-row` : fond bleu clair, bordure gauche bleue
- `.prevu-label` / `.prevu-input` : couleurs bleu distinctives

### 3. CRVDepart.vue

- Path typeAvion corrigé : `vol.typeAvion || vol.avion?.typeAvion` (avant : `vol.avion?.typeAvion` seulement)
- Immatriculation : `vol.avion?.immatriculation || vol.immatriculation`
- Section "Horaires prévus" ajoutée sous CRVHeader (étape 1)
- Fonction `formatHoraire()` ajoutée
- Styles `.horaires-prevus` ajoutés

### 4. CRVArrivee.vue

- Mêmes corrections que CRVDepart.vue (path typeAvion, immatriculation)
- Section "Horaires prévus" ajoutée sous CRVHeader (étape 1)
- Fonction `formatHoraire()` ajoutée
- Styles `.horaires-prevus` ajoutés

---

## VÉRIFICATIONS

| Test | Résultat |
|------|----------|
| `node --check CrvGenerator.js` | ✅ OK |
| Populate vol→avion dans PDF | ✅ Deep populate |
| Populate horaire dans PDF | ✅ Ajouté |
| heureDebutPrevue affiché PDF | ✅ Colonne "Déb. prévu" |
| heureFinPrevue affiché PDF | ✅ Colonne "Fin prévue" (NOUVEAU) |
| horaire.heureAtterrisagePrevue PDF | ✅ Section HORAIRES PREVUS |
| horaire.heureDecollagePrevue PDF | ✅ Section HORAIRES PREVUS |
| typeAvion path corrigé frontend | ✅ CRVDepart + CRVArrivee |
| Heures prévues affichées frontend | ✅ CRVPhases TERMINE view |
| ecartMinutes backend utilisé | ✅ Plus de recalcul frontend |
| Horaires prévus frontend | ✅ CRVArrivee + CRVDepart |

---

## TABLEAU TRAÇABILITÉ POST-HARDENING

| Champ | Backend | API | Store | Frontend | PDF | Statut |
|-------|---------|-----|-------|----------|-----|--------|
| `typeAvion` | ✅ | ✅ | ✅ | ✅ Header + Views | ✅ AERONEF | ✅ COMPLET |
| `heureDebutPrevue` | ✅ | ✅ | ✅ | ✅ CRVPhases | ✅ Chronologie | ✅ COMPLET |
| `heureFinPrevue` | ✅ | ✅ | ✅ | ✅ CRVPhases | ✅ Chronologie | ✅ COMPLET |
| `dureeStandardMinutes` | ✅ | ✅ | ✅ | ✅ (via populate) | ✅ (via populate) | ✅ COMPLET |
| `ecartMinutes` | ✅ | ✅ | ✅ | ✅ Backend direct | ✅ KPI + tableau | ✅ COMPLET |
| `heureAtterrisagePrevue` | ✅ | ✅ | ✅ | ✅ CRVArrivee | ✅ HORAIRES | ✅ COMPLET |
| `heureDecollagePrevue` | ✅ | ✅ | ✅ | ✅ CRVDepart | ✅ HORAIRES | ✅ COMPLET |

**Tous les 7 champs sont maintenant tracés de bout en bout : Backend → API → Store → Frontend → PDF.**

---

## ROLLBACK

```bash
git revert <hash>
```

Ou restaurer les fichiers individuellement depuis le commit précédent.
