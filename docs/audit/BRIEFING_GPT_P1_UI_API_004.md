# BRIEFING ARBITRAGE — P1_UI_API_004

## Résumé court
Audit du flux Événements/Incidents (UI → store → API → persistance → journal). Même gap que les 3 missions précédentes : la route `POST /api/crv/:id/evenements` ne journalisait aucun CRVEvent malgré `INCIDENT_REPORTED` défini dans l'enum. Fix : nouveau wrapper `crvEvenementsController.js`, séparé de `crvChargesController.js`. 3 fichiers, 1 événement `INCIDENT_REPORTED` prouvé en base.

## Ce qui a réellement été audité
- **Frontend** : CRVEvenements.vue (step 6 du wizard), crvStore.addEvenement, crvAPI
- **Backend** : POST /api/crv/:id/evenements → ajouterEvenement dans crv.controller.js (zone rouge)
- **Persistance** : `EvenementOperationnel` (collection séparée, document par événement)
- **Journal** : CRVEvent model (INCIDENT_REPORTED défini, jamais appelé), eventRegistry (CRV_EVENEMENT_AJOUTE template prêt)

## Problème retenu
Le controller `ajouterEvenement` crée un document `EvenementOperationnel` mais n'appelle jamais `logCRVEvent()`. Le journal CRV est muet sur toute déclaration d'événement/incident.

## Ce qui peut être trompeur
1. **Le controller original émet `CRV_INCIDENT_CRITIQUE` pour gravité CRITIQUE** — mais c'est une notification (via notificationEngine), pas un CRVEvent en base. Le journal d'audit restait muet.
2. **`ajouterEvenement` était re-exporté depuis `crvChargesController.js`** — un choix de commodité des missions précédentes. Désormais séparé dans son propre wrapper.
3. **Le type s'appelle `INCIDENT_REPORTED`** mais couvre tous les types d'événements (PANNE_EQUIPEMENT, RETARD, METEO, etc.) — c'est le nom dans l'enum existant, pas un choix de cette mission.
4. **Observations ne sont PAS dans ce flux** — CRVEvenements.vue gère uniquement les événements, les observations sont un flux séparé.

## Points à challenger
1. **`INCIDENT_REPORTED` vs un hypothétique `EVENEMENT_ADDED`** : l'enum existant n'a que `INCIDENT_REPORTED` — ajouter un nouveau type serait du scope creep. Le payload contient `typeEvenement` pour distinguer les sous-types.
2. **Pas de wrapper pour édition/suppression d'événements** : le composant CRVEvenements.vue n'expose que l'ajout. Pas d'UI de modification/suppression.
3. **La description est tronquée à 200 chars dans le payload journal** : choix de sécurité pour éviter des payloads démesurés dans la collection crv_events.
4. **Séparation `crvEvenementsController.js` vs garder dans `crvChargesController.js`** : meilleure séparation des responsabilités, chaque domaine a son wrapper.

## Proposition de verdict
**MERGEABLE** — Fix minimal, 3 fichiers backend (1 nouveau + 2 modifiés), zone rouge intacte, journal prouvé en base, pattern identique aux missions précédentes.
