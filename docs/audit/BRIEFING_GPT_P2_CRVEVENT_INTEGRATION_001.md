# BRIEFING ARBITRAGE — P2_CRVEVENT_INTEGRATION_001

## Résumé court
Correction du fichier de tests d'intégration des 5 wrappers CRVEvent sous-ressources : 10/10 tests passent après correction des imports (pointaient vers les contrôleurs de base au lieu des wrappers).

## Ce qui a réellement été fait
- `subresource-events-branchage.test.js` réécrit : imports corrigés vers les 5 wrappers (crvEvenementsController, crvObservationsController, crvChargesController, crvPersonnelController, crvEnginsController), assertions alignées sur les payloads réels
- Zéro fichier source modifié — uniquement le fichier de test

## Ce qui peut être trompeur
1. **Les 10 tests existaient déjà** — ils n'ont pas été écrits from scratch. La réécriture porte sur les imports, les assertions de payload, et un mock supplémentaire pour le batch engins.
2. **Le fichier `crv-events-branchage.test.js` n'est PAS inclus dans cette mission** — il reste untracked sur disque dans son état d'origine (8 tests en échec car les contrôleurs lifecycle n'appellent pas logCRVEvent).

## Points à challenger
1. **Les assertions sont-elles fidèles au code réel ?** Oui — chaque assertion a été alignée sur le code source du wrapper correspondant (payload exact, type d'événement, format du crvId en string).
2. **Pourquoi ENGINS_UPDATED et pas ENGIN_ASSIGNED pour le batch ?** Parce que le wrapper `mettreAJourEnginsAffectes` émet `ENGINS_UPDATED` avec `action: 'BATCH_REPLACE'`, pas `ENGIN_ASSIGNED`. Le test original avait le mauvais type d'événement.

## Proposition de verdict
**MERGEABLE** — 10/10 tests wrappers passent, zéro régression, zéro fichier source modifié, périmètre strictement limité aux 5 wrappers sous-ressources.
