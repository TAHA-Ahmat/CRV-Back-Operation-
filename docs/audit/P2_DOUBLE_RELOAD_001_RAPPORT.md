# P2_DOUBLE_RELOAD_001 — RAPPORT MISSION

## Mission : P2_DOUBLE_RELOAD_001
- Date : 2026-03-17
- Branche : mission/P2-DOUBLE-RELOAD-001 (Front)
- Périmètre : frontend
- Domaine : UX CRV Arrivée
- Classe : PRODUIT
- Niveau cérémonie : standard
- Fichiers modifiés : 1 (CRVArrivee.vue)
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : +6 / -19
- Build avant/après : OK/OK
- Impact comportemental : Suppression du double rechargement CRV après ajout charge, événement, ou action phase
- Rollback : git revert [hash]

## Diagnostic

Après chaque action sous-ressource dans un CRV de type Arrivée, `loadCRV()` était appelé **2 fois** :

1. **1er appel** : dans l'action du store Pinia (`addCharge` L920, `addEvenement` L1082, `demarrerPhase` L726, etc.)
2. **2ème appel** : dans le handler parent de `CRVArrivee.vue` (`handleChargeAdded` L634, `handleEvenementAdded` L646, `handlePhaseUpdate` L622)

Le store rechargeait déjà le CRV après chaque mutation API. Le parent re-déclenchait un rechargement inutile en écoutant les événements remontés par les composants enfants.

## Correction

Retrait des appels `loadCRV()` redondants dans les 3 handlers parent :

| Handler | Ligne | Action store | Store reload ? | Parent reload (avant) | Parent reload (après) |
|---|---|---|---|---|---|
| `handlePhaseUpdate` | 617 | demarrerPhase/terminerPhase/etc. | OUI (L726/757/810/872) | OUI → DOUBLE | NON |
| `handleChargeAdded` | 630 | addCharge | OUI (L920) | OUI → DOUBLE | NON |
| `handleEvenementAdded` | 642 | addEvenement | OUI (L1082) | OUI → DOUBLE | NON |

Les handlers restent déclarés (log console conservé) mais ne rechargent plus.

## Vérification périmètre

| Vue CRV | Double reload ? | Action requise |
|---|---|---|
| CRVArrivee.vue | OUI → corrigé | 3 handlers modifiés |
| CRVDepart.vue | NON | Pas de handlers charge/event/phase |
| CRVTurnAround.vue | NON | Pas de handlers charge/event/phase |

## Preuve

- Build frontend : OK avant et après
- Preview : app chargée, connexion superviseur, navigation CRV, 1 seul appel API au chargement
- Zone rouge : aucun fichier touché
- Diff : 1 fichier, +6/-19 lignes

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
