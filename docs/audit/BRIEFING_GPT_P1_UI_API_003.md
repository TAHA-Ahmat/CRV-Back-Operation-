# BRIEFING ARBITRAGE — P1_UI_API_003

## Résumé court
Audit du flux Charges (UI → store → API → persistance → journal). Même gap que Personnel et Engins : la route `POST /api/crv/:id/charges` ne journalisait aucun CRVEvent malgré `CHARGE_ADDED` défini dans l'enum. Fix : wrapper dans `crvChargesController.js` (qui existait déjà comme facade). 2 fichiers, 1 événement `CHARGE_ADDED` prouvé en base.

## Ce qui a réellement été audité
- **Frontend** : CRVCharges.vue, crvStore.ajouterCharge, chargesAPI
- **Backend** : POST /api/crv/:id/charges → ajouterCharge dans crv.controller.js (zone rouge)
- **Persistance** : `ChargeOperationnelle` (collection séparée, document par charge)
- **Journal** : CRVEvent model (CHARGE_ADDED/CHARGE_UPDATED définis, jamais appelés), eventRegistry (templates prêts)

## Problème retenu
Le controller `ajouterCharge` crée un document `ChargeOperationnelle` mais n'appelle jamais `logCRVEvent()`. Le journal CRV est muet sur tout ajout de charges.

## Ce qui peut être trompeur
1. **Le fichier `crvChargesController.js` existait déjà** — mais c'était une facade de re-export, pas un wrapper. Il a été transformé en wrapper fonctionnel.
2. **Les types `CHARGE_ADDED` et `CHARGE_UPDATED` existaient dans l'enum CRVEvent** — mais aucun code ne les utilisait.
3. **Les fonctions `ajouterEvenement`, `ajouterObservation`, `mettreAJourHoraire` sont aussi re-exportées** depuis ce fichier — elles ne sont PAS wrappées (hors scope charges, missions séparées P1_UI_API_004/005).
4. **Les routes charge individuelles** (PUT/DELETE dans `charge.routes.js`) ne sont PAS couvertes par cette mission — P2.

## Points à challenger
1. **Scope limité à `ajouterCharge` seulement** : les sous-routes de modification/suppression de charges ne sont pas wrappées. Acceptable car elles sont dans un fichier de routes séparé (`charge.routes.js`) et suivent un pattern différent.
2. **Pas de CHARGE_UPDATED wrappé** : seul l'ajout est couvert. La mise à jour passe par `charge.routes.js` → `charge.controller.js`, un circuit différent. Cohérent avec le scope "1 domaine fonctionnel par mission".
3. **Le payload journal contient `typeCharge` et `sensOperation`** avec fallback sur `req.body` si absent de `body.data` — robuste aux variations de réponse du controller.
4. **Surface minimale (2 fichiers)** vs 3 fichiers pour Personnel/Engins — car le fichier existait déjà et le modèle CRVEvent avait déjà les types nécessaires.

## Proposition de verdict
**MERGEABLE** — Fix minimal, 2 fichiers backend, zone rouge intacte, journal prouvé en base, pattern identique à Personnel et Engins.
