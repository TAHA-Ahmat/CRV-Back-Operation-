# BRIEFING ARBITRAGE — P1_UI_API_001

## Résumé court
Audit complet du flux Personnel (UI → store → API → persistance → journal). Constat : les 3 routes personnel backend ne journalisent aucun CRVEvent, malgré le modèle et le registry prêts. Fix : wrapper dans `crvPersonnelController.js` qui intercepte les réponses et journalise `PERSONNEL_UPDATED/ADDED/REMOVED`. 3 fichiers, zone rouge intacte, 2 événements prouvés en base.

## Ce qui a réellement été audité
- **Frontend** : CRVPersonnes.vue (ajout/suppression locale), saveCurrentStepData case 2, crvStore.updatePersonnel, crvAPI.updatePersonnel
- **Backend** : PUT/POST/DELETE /api/crv/:id/personnel, mettreAJourPersonnel/ajouterPersonnel/supprimerPersonnel dans crv.controller.js
- **Journal** : CRVEvent model (enum PERSONNEL_ADDED/REMOVED défini mais jamais utilisé), logCRVEvent service, eventRegistry (templates notification prêts)
- **Flux réel** : seul PUT batch est appelé par l'UI. POST/DELETE unitaires existent mais sont morts.

## Problème retenu
Les controllers personnel font `crv.save()` mais n'appellent jamais `logCRVEvent()`. Le journal CRV est muet sur toute modification de personnel. Cela signifie qu'il n'y a aucune traçabilité opérationnelle des changements de personnel au-delà de l'audit HTTP middleware.

## Ce qui peut être trompeur
1. **Les console.log `[CRV][PERSONNEL_UPDATE]` existent dans le controller** — mais ce sont des logs stdout, pas des CRVEvent en base. Ils ne sont pas requêtables, pas structurés, pas exploitables.
2. **Le `auditLog('MISE_A_JOUR')` middleware existe sur les routes** — mais c'est un audit HTTP générique (qui a appelé quelle route), pas un événement métier (qui a ajouté/retiré combien de personnes).
3. **POST et DELETE personnel existent côté API ET côté frontend** — `crvAPI.addPersonne()` et `crvAPI.removePersonne()` sont définis dans `api.js` mais jamais appelés par le store. Le wizard utilise exclusivement le batch PUT.
4. **Le wrapper `res.json` override** est un pattern standard Express (utilisé par Morgan, Helmet, etc.) mais pourrait surprendre.

## Points à challenger
1. **Faut-il aussi brancher les notifications (eventRegistry)** au moment de la journalisation ? Actuellement le fix journalise dans CRVEvent mais ne déclenche pas de notification. C'est volontaire — la mission est limitée au journal.
2. **Le type `PERSONNEL_UPDATED` est nouveau** — il a été ajouté à l'enum CRVEvent. Est-ce le bon nom ? Alternative : réutiliser `PERSONNEL_ADDED`/`PERSONNEL_REMOVED` avec un diff, mais le batch replace ne permet pas un diff fiable sans comparaison élément par élément.
3. **Le wrapper fait un `CRV.findById` supplémentaire** pour capturer l'ancien count avant le controller. C'est une requête en plus par appel PUT personnel. Impact négligeable (subdocument embedded, pas de populate).
4. **Faut-il exposer le journal via un endpoint GET /api/crv/:id/events ?** Le controller `crvEvent.controller.js` existe déjà mais n'est branché à aucune route. Mission séparée.

## Proposition de verdict
**MERGEABLE** — Fix minimal, 3 fichiers backend, zone rouge intacte, journal prouvé en base, pattern technique standard, zéro régression API.
