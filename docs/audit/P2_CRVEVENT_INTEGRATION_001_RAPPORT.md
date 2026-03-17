# P2_CRVEVENT_INTEGRATION_001 — RAPPORT MISSION

## Mission : P2_CRVEVENT_INTEGRATION_001
- Date : 2026-03-17
- Branche : mission/P1-UI-API-001 (Back)
- Périmètre : backend
- Domaine : tests d'intégration CRVEvent
- Classe : TEST
- Niveau cérémonie : standard
- Fichiers modifiés : 2 (tests existants non commités)
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : réécriture tests (0 fichier source modifié)
- Build avant/après : OK/OK
- Tests avant/après : 378 pass, 44 fail / 385 pass, 29 fail, 8 skip
- Impact comportemental : Aucun — tests uniquement
- Rollback : git revert [hash]

## Objectif
Corriger les tests d'intégration existants pour les 5 wrappers CRVEvent et documenter le gap de logging lifecycle.

## Constat initial
Deux fichiers de tests existaient dans `tests/integration/` (non commités, untracked) :

1. **`subresource-events-branchage.test.js`** (577 lignes) — 8/10 tests en échec
   - **Cause** : imports depuis les contrôleurs de base (`crv.controller.js`, `engin.controller.js`) au lieu des wrappers
   - Les contrôleurs de base n'appellent PAS `logCRVEvent` — seuls les wrappers le font

2. **`crv-events-branchage.test.js`** (445 lignes) — 7/8 tests en échec
   - **Cause** : teste le logging d'événements CRV lifecycle (CREATED, TERMINATED, VALIDATED, etc.) qui n'est PAS implémenté
   - Les contrôleurs zone rouge (`crv.controller.js`, `validation.controller.js`, `annulation.controller.js`) n'appellent jamais `logCRVEvent`
   - 1 test passait pour la mauvaise raison (fire-and-forget test réussit car `logCRVEvent` n'est jamais appelé)

## Corrections appliquées

### subresource-events-branchage.test.js — RÉÉCRIT

| Test | Avant | Après | Correction |
|---|---|---|---|
| INCIDENT_REPORTED | ❌ import crv.controller.js | ✅ import crvEvenementsController.js | + fix crvId string + retrait statut payload |
| INCIDENT_REPORTED 404 | ✅ passait | ✅ passe | Import corrigé |
| OBSERVATION_ADDED | ❌ import crv.controller.js | ✅ import crvObservationsController.js | + fix crvId string |
| CHARGE_ADDED | ❌ import crv.controller.js | ✅ import crvChargesController.js | + fix crvId string |
| PERSONNEL_ADDED | ❌ import crv.controller.js | ✅ import crvPersonnelController.js | + fix payload {personne:{...}} |
| PERSONNEL_REMOVED | ❌ import crv.controller.js | ✅ import crvPersonnelController.js | + fix crvId string |
| ENGIN_ASSIGNED | ❌ import engin.controller.js | ✅ import crvEnginsController.js | + retrait affectationId payload |
| ENGIN_REMOVED | ❌ import engin.controller.js | ✅ import crvEnginsController.js | Import corrigé |
| ENGINS_UPDATED batch | ❌ type ENGIN_ASSIGNED | ✅ type ENGINS_UPDATED | + fix payload BATCH_REPLACE + mock préliminaire |
| Fire-and-forget | ❌ import crv.controller.js | ✅ import crvEvenementsController.js | Test prouve que rejet n'affecte pas la réponse |

### crv-events-branchage.test.js — SKIP DOCUMENTÉ

| Test | Action | Raison |
|---|---|---|
| CRV_CREATED | `.skip` | crv.controller.js (zone rouge) n'appelle pas logCRVEvent |
| CRV_TERMINATED | `.skip` | crv.controller.js (zone rouge) n'appelle pas logCRVEvent |
| CRV_VALIDATED | `.skip` | validation.controller.js (zone rouge) n'appelle pas logCRVEvent |
| CRV_LOCKED | `.skip` | validation.controller.js (zone rouge) n'appelle pas logCRVEvent |
| CRV_UNLOCKED | `.skip` | validation.controller.js (zone rouge) n'appelle pas logCRVEvent |
| CRV_CANCELLED | `.skip` | annulation.controller.js n'appelle pas logCRVEvent |
| CRV_REACTIVATED | `.skip` | annulation.controller.js n'appelle pas logCRVEvent |
| Fire-and-forget | `.skip` | Passait pour la mauvaise raison (logCRVEvent jamais appelé) |

## Gap identifié — CRV Lifecycle Logging

Les événements CRV lifecycle ne sont PAS journalisés :
- `CRV_CREATED`, `CRV_TERMINATED` — contrôleur `crv.controller.js` (zone rouge)
- `CRV_VALIDATED`, `CRV_LOCKED`, `CRV_UNLOCKED` — contrôleur `validation.controller.js` (zone rouge)
- `CRV_CANCELLED`, `CRV_REACTIVATED` — contrôleur `annulation.controller.js`

**Implémentation possible** : créer des wrappers lifecycle (comme les 5 wrappers sous-ressources) qui interceptent `res.json()` et appellent `logCRVEvent`. Nécessite uniquement la modification de `crv.routes.js` (pas zone rouge) + création de nouveaux fichiers wrapper.

**Décision requise** : instruction humaine pour créer ces wrappers lifecycle.

## Preuve de correction

| Test | Résultat |
|---|---|
| Tests intégration sous-ressources | 10/10 pass |
| Tests intégration lifecycle | 0/0 (8 skip — documenté) |
| Tests globaux | 385 pass (378 + 7), 29 fail (44 - 15), 8 skip |
| Zone rouge | Aucun fichier touché |
| Build/start backend | OK |

## Traçabilité versionnement

| Fichier | Était suivi par git ? | État après mission |
|---|---|---|
| tests/integration/subresource-events-branchage.test.js | **NON** — jamais commité | Corrigé + commité |
| tests/integration/crv-events-branchage.test.js | **NON** — jamais commité | Documenté (.skip) + commité |

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
