# P1_UI_API_003 — RAPPORT MISSION

## Objectif
Auditer puis corriger l'alignement entre le flux UI Charges du wizard CRV, les routes backend appelées, et les événements journalisés (CRVEvent).

## Diagnostic initial

### Flux réel audité
1. **CRVCharges.vue** : ajout/suppression/édition via composant dédié (formulaire type/sens/valeur)
2. **Store** : `crvStore.ajouterCharge()` → `chargesAPI.ajouterCharge(crvId, data)` → `POST /api/crv/:id/charges`
3. **Backend ajouterCharge** : crée un document `ChargeOperationnelle` en base
4. **Journal CRVEvent** : `CHARGE_ADDED` existait dans l'enum mais **jamais appelé**

### Architecture charges
- Charges : collection séparée `ChargeOperationnelle` (ni embedded ni junction table)
- Types : PASSAGERS, BAGAGES, FRET
- Sens : EMBARQUEMENT, DEBARQUEMENT
- Le `crvChargesController.js` existait déjà comme facade (re-export) — il importait depuis `crv.controller.js` (zone rouge) et re-exportait les fonctions telles quelles
- Sous-routes charge individuelles (PUT/DELETE) dans `charge.routes.js` — hors scope (P2)

### Routes traitées dans ce fichier
- `ajouterCharge` (POST /api/crv/:id/charges) — **wrappé**
- `ajouterEvenement`, `ajouterObservation`, `mettreAJourHoraire` — **re-exportés sans wrapper** (hors scope charges)

## Mini-table de vérité

| Action UI réelle | Vue/composant | Store appelé | Route API | Persistance | Événement journal | Fidèle ? | Problème ? |
|---|---|---|---|---|---|---|---|
| Ajout charge | CRVCharges | ajouterCharge | POST /crv/:id/charges | Oui (ChargeOperationnelle) | **AUCUN** | **NON** | **OUI** |
| Modif charge | CRVCharges | modifierCharge | PUT /charges/:id | Oui | AUCUN | NON | P2 |
| Suppression charge | CRVCharges | supprimerCharge | DELETE /charges/:id | Oui | AUCUN | NON | P2 |

## Problème prioritaire retenu

**La route `POST /api/crv/:id/charges` ne journalise aucun CRVEvent**, malgré `CHARGE_ADDED` défini dans l'enum CRVEvent.

**Impact métier** : Aucune traçabilité de l'ajout de charges dans le journal CRV.

## Fichiers modifiés
| Fichier | Lignes modifiées | Raison |
|---|---|---|
| `src/controllers/crv/crvChargesController.js` | Réécrit (43 lignes) | Wrapper avec journalisation CHARGE_ADDED |
| `src/routes/crv/crv.routes.js` | +6/-4 | Import charges depuis crvChargesController au lieu de crv.controller |

**Fichiers zone rouge touchés : NON**

## Patch appliqué

### Stratégie
Pattern identique à P1_UI_API_001 (Personnel) et P1_UI_API_002 (Engins) : wrapper controller qui intercepte `res.json()` et journalise après succès.

### Particularité charges
Plus simple que Personnel/Engins : pas besoin de capturer un ancienCount (ajout unitaire, pas batch replace).

### Détail par route
| Route | Type événement | Payload journalisé |
|---|---|---|
| POST /charges | `CHARGE_ADDED` | `{ chargeId, typeCharge, sensOperation }` |

## Preuve de correction réelle

### Test API live
```
=== POST /api/crv/:id/charges (PASSAGERS / EMBARQUEMENT) ===
Status: 201, success: true
chargeId: retourné dans body.data

=== QUERY crv_events { type: 'CHARGE_ADDED' } ===
Événement trouvé avec payload:
  typeCharge: 'PASSAGERS'
  sensOperation: 'EMBARQUEMENT'
  chargeId: ObjectId correspondant

=== JOURNAL: OK ===
```

### Chaîne complète prouvée
```
UI (CRVCharges) → store.ajouterCharge()
→ POST /api/crv/:id/charges
→ crvChargesController.ajouterCharge (wrapper)
  → intercepte res.json()
  → _ajouterCharge (controller original, zone rouge)
  → ChargeOperationnelle.create (persistance ✓)
  → res.json intercepté → logCRVEvent('CHARGE_ADDED') (journal ✓)
→ CRVEvent créé en base MongoDB ✓
```

## Validation minimale exécutée
| Test | Résultat |
|---|---|
| Import modules (crvChargesController, crv.routes) | PASS |
| Backend restart | PASS (zéro erreur) |
| POST charges (PASSAGERS/EMBARQUEMENT) | 201 OK |
| CRVEvent CHARGE_ADDED en base | 1 événement créé ✓ |
| Persistance ChargeOperationnelle | OK |
| Zone rouge | AUCUN fichier touché |
| Surface : 2 fichiers | Dans limites MADMIT |

## Hors scope
- Routes modification/suppression de charges individuelles (PUT/DELETE dans charge.routes.js) — P2
- Logging des sous-types de charges (horaires, événements, observations re-exportés sans wrapper)
- Endpoint GET /api/crv/:id/events
- Branchement notifications eventRegistry

## Risques restants
1. Les routes PUT/DELETE charge individuelles (dans `charge.routes.js`) ne journalisent toujours pas — mission P2 séparée.
2. `ajouterEvenement`, `ajouterObservation`, `mettreAJourHoraire` sont re-exportés sans wrapper — missions P1_UI_API_004 et P1_UI_API_005.
3. Le controller original (`crv.controller.js`) n'a pas été modifié (zone rouge respectée).

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

Branche : `mission/P1-UI-API-001` (Back, même branche car même domaine cohérence UI/API)
Rollback : `git revert <hash>`
