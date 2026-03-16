# BRIEFING ARBITRAGE — P1_UI_API_002

## Résumé court
Audit complet du flux Engins (UI → store → API → persistance → journal). Même gap que Personnel : les 3 routes engins ne journalisaient aucun CRVEvent. Fix : wrapper `crvEnginsController.js` identique au pattern Personnel. 3 fichiers, 2 événements `ENGINS_UPDATED` prouvés en base.

## Ce qui a réellement été audité
- **Frontend** : CRVEngins.vue (ajout/suppression locale), saveCurrentStepData case 3, crvStore.updateEngins, enginsAPI.updateCRVEngins
- **Backend** : PUT/POST/DELETE /api/crv/:id/engins, mettreAJourEnginsAffectes/ajouterEnginAuCRV/retirerEnginDuCRV dans engin.controller.js
- **Persistance** : `AffectationEnginVol` (collection séparée, deleteMany+create pattern)
- **Journal** : CRVEvent model (ENGIN_ASSIGNED/REMOVED définis, jamais utilisés), eventRegistry (templates prêts)

## Problème retenu
Les controllers engins font `deleteMany` + `create` sur AffectationEnginVol mais n'appellent jamais `logCRVEvent()`. Le journal CRV est muet sur toute modification d'engins.

## Ce qui peut être trompeur
1. **Les console.log avec emojis existent dans le controller** (`🚜`, `✅`) — mais ce sont des logs stdout, pas des CRVEvent en base.
2. **Un événement ENGIN_ASSIGNED préexistant** a été trouvé en base (d'une session antérieure, probablement un test direct) — ce n'est pas le résultat de cette mission.
3. **Le champ `materielUtilise` dans le modèle CRV** est une double source de vérité legacy. Le flux actuel n'utilise que `AffectationEnginVol`. À clarifier dans une mission P2.
4. **`obtenirEnginsAffectes` (GET) n'est pas wrappé** — pas nécessaire, c'est une lecture seule.

## Points à challenger
1. **Le type `ENGINS_UPDATED` vs `ENGIN_ASSIGNED`** : le batch replace ne peut pas émettre d'événements individuels sans diff élément par élément. `ENGINS_UPDATED` avec counts est le bon compromis.
2. **Le wrapper fait 2 requêtes supplémentaires** (`CRV.findById` + `countDocuments`) pour capturer l'ancien count. Impact négligeable (< 10ms).
3. **`materielUtilise` vs `AffectationEnginVol`** : lequel fait foi ? Le flux actuel utilise exclusivement AffectationEnginVol. Le champ embedded semble être un vestige.
4. **Cohérence des noms** : CRVEvent a `ENGIN_ASSIGNED`/`ENGIN_REMOVED` (singulier), eventRegistry a `ENGIN_AFFECTE_CRV`/`ENGIN_RETIRE_CRV`. Pas de conflit fonctionnel mais nomenclature hétérogène.

## Proposition de verdict
**MERGEABLE** — Fix minimal, 3 fichiers backend, zone rouge intacte, journal prouvé en base, pattern identique à Personnel.
