# P2_CRVEVENT_INTEGRATION_001 — RAPPORT MISSION

## Mission : P2_CRVEVENT_INTEGRATION_001
- Date : 2026-03-17
- Branche : mission/P1-UI-API-001 (Back)
- Périmètre : backend
- Domaine : tests d'intégration CRVEvent wrappers
- Classe : TEST
- Niveau cérémonie : standard
- Fichiers modifiés : 1 (test existant non commité, réécrit)
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : réécriture test (0 fichier source modifié)
- Build avant/après : OK/OK
- Tests avant/après : 378 pass, 44 fail / 386 pass, 36 fail
- Impact comportemental : Aucun — tests uniquement
- Rollback : git revert [hash]

## Objectif
Corriger le fichier de tests d'intégration pour les 5 wrappers CRVEvent sous-ressources.

## Constat initial
Le fichier `tests/integration/subresource-events-branchage.test.js` existait (non commité, untracked) avec 8/10 tests en échec.

**Cause unique** : les imports pointaient vers les contrôleurs de base (`crv.controller.js`, `engin.controller.js`) au lieu des wrappers. Les contrôleurs de base n'appellent pas `logCRVEvent` — seuls les wrappers le font via interception de `res.json()`.

## Corrections appliquées

### subresource-events-branchage.test.js — RÉÉCRIT

| Test | Avant | Après | Correction |
|---|---|---|---|
| INCIDENT_REPORTED | FAIL — import crv.controller.js | PASS | Import crvEvenementsController.js + fix crvId string + retrait statut payload |
| INCIDENT_REPORTED 404 | PASS | PASS | Import corrigé |
| OBSERVATION_ADDED | FAIL | PASS | Import crvObservationsController.js + fix crvId string |
| CHARGE_ADDED | FAIL | PASS | Import crvChargesController.js + fix crvId string |
| PERSONNEL_ADDED | FAIL | PASS | Import crvPersonnelController.js + fix payload {personne:{...}} |
| PERSONNEL_REMOVED | FAIL | PASS | Import crvPersonnelController.js + fix crvId string |
| ENGIN_ASSIGNED | FAIL | PASS | Import crvEnginsController.js + retrait affectationId payload |
| ENGIN_REMOVED | FAIL | PASS | Import crvEnginsController.js |
| ENGINS_UPDATED batch | FAIL — type ENGIN_ASSIGNED | PASS | Import crvEnginsController.js + type ENGINS_UPDATED + payload BATCH_REPLACE + mock préliminaire |
| Fire-and-forget | PASS | PASS | Import crvEvenementsController.js — prouve que rejet n'affecte pas la réponse |

## Preuve de correction

| Test | Résultat |
|---|---|
| Tests intégration sous-ressources | 10/10 pass |
| Tests globaux | 386 pass (+8), 36 fail (-8) |
| Zone rouge | Aucun fichier touché |
| Build/start backend | OK |

## Traçabilité versionnement

| Fichier | Était suivi par git ? | État après mission |
|---|---|---|
| tests/integration/subresource-events-branchage.test.js | **NON** — jamais commité | Corrigé + commité |

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
