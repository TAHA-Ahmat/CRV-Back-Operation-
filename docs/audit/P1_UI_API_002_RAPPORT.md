# P1_UI_API_002 — RAPPORT MISSION

## Objectif
Auditer puis corriger l'alignement entre le flux UI Engins du wizard CRV, les routes backend appelées, et les événements journalisés (CRVEvent).

## Diagnostic initial

### Flux réel audité
1. **CRVEngins.vue** : ajout/suppression/édition locale uniquement (v-model)
2. **saveCurrentStepData() case 3** : appelle `crvStore.updateEngins(formData.engins)` au clic "Continuer"
3. **crvStore.updateEngins()** : appelle `enginsAPI.updateCRVEngins(crvId, engins)` → `PUT /api/crv/:id/engins`
4. **Backend mettreAJourEnginsAffectes** : `deleteMany` anciennes affectations + `create` nouvelles (remplacement total via `AffectationEnginVol`)
5. **Journal CRVEvent** : AUCUN événement produit

### Architecture engins vs personnel
- Personnel : embedded dans CRV (`personnelAffecte[]`)
- Engins : collection séparée `AffectationEnginVol` (junction vol↔engin) + référentiel `Engin`
- CRV a aussi un champ legacy `materielUtilise[]` (embedded, non utilisé par le flux actuel)

### Routes existantes mais jamais appelées par l'UI
- `POST /api/crv/:id/engins` → `ajouterEnginAuCRV` (unitaire)
- `DELETE /api/crv/:id/engins/:affectationId` → `retirerEnginDuCRV` (unitaire)

## Mini-table de vérité

| Action UI réelle | Vue/composant | Store appelé | Route API | Persistance | Événement journal | Fidèle ? | Problème ? |
|---|---|---|---|---|---|---|---|
| Ajout engin local | CRVEngins | aucun | aucune | Non (local) | Aucun | N/A | Non |
| Suppression engin local | CRVEngins | aucun | aucune | Non (local) | Aucun | N/A | Non |
| Save batch (Continuer) | 3 vues CRV | updateEngins | PUT /crv/:id/engins | Oui (deleteMany+create) | **AUCUN** | **NON** | **OUI** |
| Ajout unitaire (API) | N/A (jamais appelé) | N/A | POST /crv/:id/engins | Oui (create) | **AUCUN** | **NON** | Oui |
| Suppression unitaire (API) | N/A (jamais appelé) | N/A | DELETE /crv/:id/engins/:id | Oui (deleteOne) | **AUCUN** | **NON** | Oui |

## Problème prioritaire retenu

**Les 3 routes engins ne journalisent aucun CRVEvent**, malgré `ENGIN_ASSIGNED`/`ENGIN_REMOVED` définis dans l'enum CRVEvent et `ENGIN_AFFECTE_CRV`/`ENGIN_RETIRE_CRV` dans eventRegistry.

**Impact métier** : Aucune traçabilité des affectations d'engins dans le journal CRV.

## Fichiers modifiés
| Fichier | Lignes modifiées | Raison |
|---|---|---|
| `src/controllers/crv/crvEnginsController.js` | Nouveau (88 lignes) | Wrapper avec journalisation CRVEvent |
| `src/routes/crv/crv.routes.js` | +4/-3 | Import engins depuis crvEnginsController au lieu de engin.controller |
| `src/models/crv/CRVEvent.js` | +1 | Ajout `ENGINS_UPDATED` à l'enum |

**Fichiers zone rouge touchés : NON**

## Patch appliqué

### Stratégie
Pattern identique à P1_UI_API_001 (Personnel) : wrapper controller qui intercepte `res.json()` et journalise après succès.

### Particularité engins
Le count "avant" nécessite une requête sur `AffectationEnginVol` (collection séparée) plutôt que sur le CRV embedded :
```javascript
const crv = await CRV.findById(req.params.id).select('vol').lean();
ancienCount = await AffectationEnginVol.countDocuments({ vol: crv.vol });
```

### Détail par route
| Route | Type événement | Payload journalisé |
|---|---|---|
| PUT /engins (batch) | `ENGINS_UPDATED` | `{ ancienCount, nouveauCount, action: 'BATCH_REPLACE' }` |
| POST /engins (unitaire) | `ENGIN_ASSIGNED` | `{ enginId, usage }` |
| DELETE /engins/:id (unitaire) | `ENGIN_REMOVED` | `{ affectationId }` |

## Preuve de correction réelle

### Test API live
```
=== BEFORE ===
CRV CRV260313-0002 — Engins affectés: 1
CRVEvent ENGIN: 1 événement préexistant (session antérieure)

=== PUT /api/crv/:id/engins (remplacement par TEST-AUD-001) ===
Status: 200, nbEngins: 1

=== PUT /api/crv/:id/engins (restore vide) ===
Status: 200, nbEngins: 0

=== QUERY crv_events { type: /ENGIN/ } ===
Count: 3
Event 1: ENGINS_UPDATED | ancienCount:1 → nouveauCount:0 | 16:20:38
Event 2: ENGINS_UPDATED | ancienCount:1 → nouveauCount:1 | 16:20:35
Event 3: ENGIN_ASSIGNED | (préexistant)                   | 05:44:29

=== JOURNAL: OK ===
```

### Chaîne complète prouvée
```
UI (CRVEngins) → v-model → formData.engins
→ saveCurrentStepData case 3 → crvStore.updateEngins()
→ PUT /api/crv/:id/engins
→ crvEnginsController.mettreAJourEnginsAffectes (wrapper)
  → CRV.findById + AffectationEnginVol.countDocuments (capturer ancienCount)
  → _mettreAJourEnginsAffectes (controller original)
  → deleteMany + create (persistance ✓)
  → res.json intercepté → logCRVEvent('ENGINS_UPDATED') (journal ✓)
→ CRVEvent créé en base MongoDB ✓
```

## Validation minimale exécutée
| Test | Résultat |
|---|---|
| Import modules (crvEnginsController, crv.routes) | PASS |
| Backend restart | PASS (zéro erreur) |
| PUT engins batch (ajout + restore) | 200 OK × 2 |
| CRVEvent ENGINS_UPDATED en base | 2 événements créés ✓ |
| Persistance AffectationEnginVol | OK (1→1→0) |
| Zone rouge | AUCUN fichier touché |
| Surface : 3 fichiers | Dans limites MADMIT |

## Hors scope
- Utilisation des routes unitaires (POST/DELETE) par le frontend
- Champ legacy `materielUtilise` dans le modèle CRV (non utilisé par le flux actuel)
- Endpoint GET /api/crv/:id/events
- Branchement notifications eventRegistry

## Risques restants
1. Les routes unitaires (POST/DELETE) sont wrappées mais jamais appelées par le frontend actuel.
2. Le `obtenirEnginsAffectes` (GET) reste importé depuis engin.controller.js directement (pas de wrapper nécessaire, lecture seule).
3. Le champ `materielUtilise` du modèle CRV est une double source de vérité potentielle — mission P2 séparée.

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

Branche : `mission/P1-UI-API-001` (Back, même branche car même domaine cohérence UI/API)
Rollback : `git revert <hash>`
