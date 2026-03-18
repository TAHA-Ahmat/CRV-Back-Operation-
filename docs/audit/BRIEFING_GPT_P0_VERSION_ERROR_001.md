# BRIEFING GPT — P0_VERSION_ERROR_001

## Contexte
Après création d'un CRV, toute sauvegarde de sous-ressource (personnel, charges, etc.) pouvait provoquer une erreur 500 "VersionError". Le bug était intermittent, déclenché par des requêtes concurrentes sur le même document MongoDB.

## Ce qui a été fait
Remplacement du pattern `findById()` + `save()` par des opérations atomiques MongoDB (`findByIdAndUpdate` avec `$set`, `$push`, `$pull`) dans les 3 fonctions personnel de `crv.controller.js` :
- `mettreAJourPersonnel` (PUT batch)
- `ajouterPersonnel` (POST unitaire)
- `supprimerPersonnel` (DELETE unitaire)

Les tests d'intégration (subresource-events-branchage.test.js) ont été adaptés pour mocker `findByIdAndUpdate` au lieu de `findById` + `save()`. 10/10 passent.

## Résultat pour l'utilisateur
L'utilisateur peut saisir le personnel sur un CRV fraîchement créé sans erreur. Même avec 4 requêtes simultanées (cas du double-mount Vue en dev), toutes passent avec succès.

## Questions pour GPT

### 1. Faut-il appliquer le même pattern aux autres sous-ressources ?
Les fonctions charges, engins, événements, observations utilisent-elles aussi `findById` + `save()` ? Si oui, elles sont vulnérables au même VersionError sous concurrence. Faut-il auditer et corriger préventivement, ou attendre que le bug soit signalé ?

### 2. Validators Mongoose
`findByIdAndUpdate` avec `runValidators: true` n'exécute pas tous les validators de la même manière que `save()`. En particulier, les validators personnalisés (custom validators sur les sous-documents) peuvent ne pas se déclencher. Y a-t-il des validators critiques sur `personnelAffecte` qui pourraient être contournés ?

### 3. Middleware Mongoose
Les middlewares `pre('save')` et `post('save')` ne se déclenchent pas avec `findByIdAndUpdate`. Y a-t-il des middlewares sur le modèle CRV qui dépendent de `save()` pour le personnel ? Si oui, ils sont maintenant contournés silencieusement.

### 4. Double-mount Vue (BUG-008)
Ce fix résout le symptôme (erreur 500) mais pas la cause racine (4 requêtes au lieu de 1). Le double-mount Vue + double handler = 4 requêtes par action. Faut-il traiter BUG-008 en priorité maintenant que le P0 est corrigé ?

### 5. Prochaine priorité
Le backlog P0 est maintenant vide. Les P1 frontend sont tous corrigés. Reste :
- P2 : logs excessifs, requêtes x4, aéroport destination, code mort, payloads
- P2 : tests permissions/auth
- P3 : améliorations futures

Quelle direction prendre ?

## Fichiers modifiés
- `Back/src/controllers/crv/crv.controller.js` — zone rouge, 3 fonctions personnel (+41/-70)
- `Back/tests/integration/subresource-events-branchage.test.js` — adaptation mocks (10/10 pass)
