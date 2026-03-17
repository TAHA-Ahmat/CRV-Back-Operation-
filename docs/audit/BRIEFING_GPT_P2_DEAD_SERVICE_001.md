# BRIEFING ARBITRAGE — P2_DEAD_SERVICE_001

## Résumé court
Suppression de `crvTransaction.service.js` (service mort) et `crv-transaction.test.js` (test orphelin). 5/5 critères de suppression remplis. 0 fichier modifié, 2 fichiers supprimés, -558 lignes, zéro régression.

## Ce qui a réellement été fait
- Audit complet selon les 5 critères de suppression (CLAUDE.md) : tous passent
- Suppression de `crvTransaction.service.js` (112 lignes — 3 fonctions jamais importées)
- Suppression de `crv-transaction.test.js` (446 lignes — teste des fonctions qui n'existent plus dans aucun fichier source, 9/9 tests en échec permanent)

## Ce qui peut être trompeur
1. **Le test `crv-transaction.test.js` ne testait PAS `crvTransaction.service.js`** — malgré son nom. Il importait depuis `crv.service.js` des fonctions (`creerCRVTransactionnel`, `preparerVolDepuisMouvement`) qui ont été supprimées de ce fichier à une date antérieure. Le test était orphelin indépendamment du service.
2. **Les transitions CRV ne sont PAS impactées** — `crv.controller.js` (zone rouge) gère déjà les transactions MongoDB inline. Le service supprimé était un chemin alternatif jamais emprunté.
3. **Les 378 tests passants restent à 378** — seuls 9 tests cassés (orphelins) disparaissent.

## Points à challenger
1. **Le test orphelin testait-il quelque chose d'utile ?** Non — les fonctions testées (`creerCRVTransactionnel`, `preparerVolDepuisMouvement`) n'existent plus dans le code. Aucun fichier ne les exporte.
2. **Y avait-il un plan d'intégration future pour ce service ?** Les audits documentaires (6 documents) le qualifient unanimement de mort/redondant. L'intégrer nécessiterait de modifier la zone rouge — interdit sans instruction humaine.
3. **WORKFLOW_MACHINE.md L68 le référence encore** — c'est un document d'architecture descriptif, pas prescriptif. Nettoyage cosmétique possible en P3.

## Traçabilité versionnement
- 2 fichiers supprimés et audit docs commités sur branche `mission/P1-UI-API-001` (repo Back)

## Proposition de verdict
**MERGEABLE** — 5/5 critères de suppression remplis, zéro régression, zéro fichier modifié, fausse piste architecturale éliminée.
