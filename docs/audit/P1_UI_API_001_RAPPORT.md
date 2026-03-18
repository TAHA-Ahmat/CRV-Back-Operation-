# P1_UI_API_001 — RAPPORT MISSION

## Objectif
Auditer puis corriger l'alignement entre le flux UI Personnel du wizard CRV, les routes backend appelées, et les événements journalisés (CRVEvent).

## Diagnostic initial

### Flux réel audité
1. **CRVPersonnes.vue** : ajout/suppression/édition locale uniquement (v-model)
2. **saveCurrentStepData() case 2** : appelle `crvStore.updatePersonnel(formData.personnes)` au clic "Continuer"
3. **crvStore.updatePersonnel()** : appelle `crvAPI.updatePersonnel(id, { personnelAffecte })` → `PUT /api/crv/:id/personnel`
4. **Backend mettreAJourPersonnel** : `crv.personnelAffecte = personnelAffecte; crv.save()` (remplacement total)
5. **Journal CRVEvent** : AUCUN événement produit

### Routes existantes mais jamais appelées par l'UI
- `POST /api/crv/:id/personnel` → `ajouterPersonnel` (unitaire) — jamais appelé
- `DELETE /api/crv/:id/personnel/:personneId` → `supprimerPersonnel` (unitaire) — jamais appelé

## Mini-table de vérité

| Action UI réelle | Vue/composant | Store appelé | Route API appelée | Persistance | Événement journal | Fidèle ? | Problème ? |
|---|---|---|---|---|---|---|---|
| Ajout personne local | CRVPersonnes | aucun | aucune | Non (local) | Aucun | N/A | Non |
| Suppression personne local | CRVPersonnes | aucun | aucune | Non (local) | Aucun | N/A | Non |
| Save batch (Continuer) | 3 vues CRV | updatePersonnel | PUT /crv/:id/personnel | Oui (écrasement) | **AUCUN** | **NON** | **OUI** |
| Ajout unitaire (API) | N/A (jamais appelé) | N/A | POST /crv/:id/personnel | Oui (push) | **AUCUN** | **NON** | Oui |
| Suppression unitaire (API) | N/A (jamais appelé) | N/A | DELETE /crv/:id/personnel/:id | Oui (splice) | **AUCUN** | **NON** | Oui |

## Problème prioritaire retenu

**Les 3 routes personnel ne journalisent aucun CRVEvent**, alors que :
- Le modèle `CRVEvent` définit `PERSONNEL_ADDED` et `PERSONNEL_REMOVED`
- Le `eventRegistry` a les templates de notification prêts (`CRV_PERSONNEL_AJOUTE`, `CRV_PERSONNEL_MIS_A_JOUR`, `CRV_PERSONNEL_SUPPRIME`)
- Les transitions CRV (TERMINE, VALIDE, etc.) journalisent correctement via `logCRVEvent()`

**Impact métier** : Aucune traçabilité des modifications de personnel dans le journal d'événements CRV. Impossible de savoir qui a modifié le personnel, quand, et combien de personnes ont été ajoutées/retirées.

**Contrainte** : `crv.controller.js` est zone rouge → impossible de modifier les fonctions directement.

## Fichiers modifiés
| Fichier | Lignes modifiées | Raison |
|---|---|---|
| `src/controllers/crv/crvPersonnelController.js` | Réécrit (88 lignes) | Transformé de façade en wrapper avec journalisation CRVEvent |
| `src/routes/crv/crv.routes.js` | +4/-2 | Import personnel depuis crvPersonnelController au lieu de crv.controller |
| `src/models/crv/CRVEvent.js` | +1 | Ajout `PERSONNEL_UPDATED` à l'enum des types d'événements |

**Fichiers zone rouge touchés : NON**

## Patch appliqué

### Stratégie
Transformer `crvPersonnelController.js` (ancienne façade re-export) en wrapper qui :
1. Intercepte `res.json()` pour détecter le succès du controller original
2. Journalise l'événement CRVEvent approprié après succès
3. Ne modifie pas le comportement du controller original

### Détail par route
| Route | Type événement | Payload journalisé |
|---|---|---|
| PUT /personnel (batch) | `PERSONNEL_UPDATED` | `{ ancienCount, nouveauCount, action: 'BATCH_REPLACE' }` |
| POST /personnel (unitaire) | `PERSONNEL_ADDED` | `{ personne: { nom, prenom, fonction }, nbPersonnesTotal }` |
| DELETE /personnel/:id (unitaire) | `PERSONNEL_REMOVED` | `{ personneId, nbPersonnesRestantes }` |

### Pattern technique
```javascript
// Intercepter res.json pour journaliser après succès
const originalJson = res.json.bind(res);
res.json = function (body) {
  if (res.statusCode === 200 && body?.success) {
    logCRVEvent(crvId, 'PERSONNEL_UPDATED', userId, payload);
  }
  return originalJson(body);
};
return _mettreAJourPersonnel(req, res, next);
```

## Preuve de correction réelle

### Test API live
```
=== BEFORE ===
CRV CRV260313-0002 (69b38a411c142b9136738cf5) — Personnel: 2 personnes
CRVEvent PERSONNEL: 0 événements en base

=== PUT /api/crv/:id/personnel (ajout TEST_JOURNAL) ===
Status: 200, nbPersonnes: 3

=== PUT /api/crv/:id/personnel (restore original) ===
Status: 200, nbPersonnes: 2

=== QUERY crv_events { type: /PERSONNEL/ } ===
Count: 2
Event 1: PERSONNEL_UPDATED | ancienCount:2 → nouveauCount:3 | 16:00:30
Event 2: PERSONNEL_UPDATED | ancienCount:3 → nouveauCount:2 | 16:00:32

=== JOURNAL: OK ===
```

### Chaîne complète prouvée
```
UI (CRVPersonnes) → v-model → formData.personnes
→ saveCurrentStepData case 2 → crvStore.updatePersonnel()
→ PUT /api/crv/:id/personnel
→ crvPersonnelController.mettreAJourPersonnel (wrapper)
  → CRV.findById (capturer ancienCount)
  → _mettreAJourPersonnel (controller original, zone rouge intacte)
  → crv.personnelAffecte = [...], crv.save() (persistance ✓)
  → res.json intercepté → logCRVEvent('PERSONNEL_UPDATED') (journal ✓)
→ CRVEvent créé en base MongoDB ✓
```

## Validation minimale exécutée
| Test | Résultat |
|---|---|
| Import modules (CRVEvent, crvPersonnelController, crv.routes) | PASS |
| Backend restart | PASS (zéro erreur) |
| PUT personnel batch (ajout + restore) | 200 OK × 2 |
| CRVEvent PERSONNEL_UPDATED en base | 2 événements créés ✓ |
| Persistance personnelAffecte | OK (2→3→2) |
| Zone rouge | AUCUN fichier touché |
| Surface : 3 fichiers | Dans limites MADMIT |

## Hors scope
- Utilisation des routes unitaires (POST/DELETE) par le frontend — le wizard utilise le batch PUT exclusivement
- Ajout d'un endpoint GET /api/crv/:id/events pour exposer le journal
- Notification via eventRegistry (branchement notifications → mission séparée)
- Refonte du wizard personnel pour utiliser les routes unitaires
- Tests d'intégration automatisés

## Risques restants
1. Les routes unitaires (POST/DELETE) sont wrappées mais jamais appelées par le frontend actuel. Le journal sera correct si elles sont utilisées à l'avenir.
2. Le pattern `res.json` override est standard Express mais pourrait être fragile si un middleware en aval fait de même. Risque faible.
3. Le `logCRVEvent()` est fire-and-forget — une erreur de journalisation ne bloque pas l'opération. C'est voulu.

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

Branche : `mission/P1-UI-API-001` (Back)
Rollback : `git revert <hash>`
