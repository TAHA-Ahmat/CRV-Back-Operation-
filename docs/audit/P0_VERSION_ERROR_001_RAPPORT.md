# P0_VERSION_ERROR_001 — RAPPORT MISSION

## Mission : P0_VERSION_ERROR_001
- Date : 2026-03-17
- Branche : mission/P0-VERSION-ERROR-001 (Back)
- Périmètre : backend
- Domaine : Personnel CRV — sauvegarde concurrente
- Classe : PRODUIT (valeur observable pour l'utilisateur)
- Niveau cérémonie : structurelle (zone rouge)
- Fichiers modifiés : 2 (crv.controller.js, subresource-events-branchage.test.js)
- Fichiers zone rouge touchés : OUI — **crv.controller.js** (autorisation humaine explicite)
- Lignes ajoutées/supprimées : +41 / -70
- Build avant/après : OK/OK
- Tests avant/après : 10 pass / 10 pass (subresource-events-branchage)
- Impact comportemental : Plus aucune erreur 500 lors de sauvegardes concurrentes du personnel
- Rollback : git revert 1c0da75

---

## PROBLÈME UTILISATEUR CORRIGÉ

### L'utilisateur recevait une erreur 500 en sauvegardant le personnel d'un CRV fraîchement créé

- **Étape utilisateur** : Création d'un nouveau CRV depuis un bulletin, puis saisie du personnel (étape 3 du wizard)
- **Action utilisateur** : Cliquer sur "Continuer" après avoir saisi les noms du personnel affecté
- **Résultat attendu** : Le personnel est enregistré, passage à l'étape suivante
- **Résultat observé (avant correction)** : Erreur 500 "VersionError: No matching document found for id ... version 0 modifiedPaths 'personnelAffecte'"
- **Impact utilisateur** : Toute saisie sur un CRV fraîchement créé échouait. L'utilisateur devait recharger la page et resaisir. Le problème était intermittent (dépend du timing des requêtes concurrentes).
- **Gravité** : **P0 — bloquant en production**

### Pourquoi c'est bloquant

Un CRV fraîchement créé passe automatiquement de BROUILLON à EN_COURS (auto-démarrage). Ce changement de statut incrémente le numéro de version Mongoose (`__v`). Si une requête de sauvegarde du personnel lit le CRV entre-temps avec l'ancien `__v`, Mongoose refuse l'écriture. Le double-mount Vue (dev mode HMR) aggrave le problème en doublant les requêtes.

### Scénario de reproduction

1. Créer un CRV depuis un bulletin
2. Aller à l'étape 3 (Personnel)
3. Saisir un nom et cliquer "Continuer"
4. → Erreur 500 (intermittente, plus fréquente avec connexion lente ou double-mount)

### Test de concurrence (preuve)

**AVANT correction** : 4 requêtes PUT /personnel concurrentes → 1 OK + 3 erreurs 500
```
["200 OK", "500 Internal Server Error", "500 Internal Server Error", "500 Internal Server Error"]
```

**APRÈS correction** : 4 requêtes PUT /personnel concurrentes → 4 OK
```
["200 OK", "200 OK", "200 OK", "200 OK"]
```

4 requêtes POST /personnel concurrentes → 4 x 201 Created (ajout atomique aussi corrigé).

---

## CAUSE TECHNIQUE

### Mongoose Optimistic Concurrency sur les tableaux

Mongoose utilise le champ `__v` pour détecter les conflits d'écriture sur les champs de type Array. Le pattern `findById()` + `crv.personnelAffecte = ...` + `crv.save()` est vulnérable :

1. Requête A lit le CRV (version 0)
2. Requête B lit le CRV (version 0)
3. Requête A sauvegarde (version 0 → 1) ✓
4. Requête B tente de sauvegarder (version attendue 0, mais c'est maintenant 1) ✗ VersionError

### Solution : opérations atomiques MongoDB

Remplacer `findById` + `save()` par `findByIdAndUpdate` avec des opérateurs atomiques :
- `$set` pour le remplacement batch (`mettreAJourPersonnel`)
- `$push` pour l'ajout unitaire (`ajouterPersonnel`)
- `$pull` pour la suppression unitaire (`supprimerPersonnel`)

Ces opérateurs contournent complètement le mécanisme `__v` de Mongoose car ils opèrent directement en base sans lecture préalable.

---

## MODIFICATIONS

### 1. crv.controller.js (ZONE ROUGE)

**3 fonctions modifiées**, même pattern appliqué à chacune :

| Fonction | Avant | Après |
|---|---|---|
| `mettreAJourPersonnel` | `findById` + `crv.personnelAffecte = data` + `save()` | `findByIdAndUpdate` avec `$set: { personnelAffecte }` |
| `ajouterPersonnel` | `findById` + `crv.personnelAffecte.push()` + `save()` | `findByIdAndUpdate` avec `$push: { personnelAffecte }` |
| `supprimerPersonnel` | `findById` + `splice()` + `save()` | `findByIdAndUpdate` avec `$pull: { personnelAffecte: { _id } }` |

**Ce qui n'a PAS changé** :
- Structure des réponses JSON (même format exact)
- Codes HTTP (200, 201, 404, 400)
- Logs structurés (même format)
- Validation des inputs
- Gestion d'erreur (try/catch + next(error))

### 2. subresource-events-branchage.test.js

Adaptation des mocks : ajout de `findByIdAndUpdate` dans le mock CRV model, remplacement des mocks `findById` + `save()` par des mocks `findByIdAndUpdate` retournant le CRV post-opération.

---

## VÉRIFICATION

| Vérification | Résultat |
|---|---|
| Backend démarre sans erreur | ✓ |
| 4 PUT concurrents → 4x 200 OK | ✓ (était 1 OK + 3 erreurs 500) |
| 4 POST concurrents → 4x 201 Created | ✓ |
| Tests subresource-events (10/10) | ✓ |
| Zone rouge identifiée et justifiée | ✓ |
| Autorisation humaine documentée | ✓ |

---

## JUSTIFICATION ZONE ROUGE

**Fichier** : `crv.controller.js`
**Autorisation** : Humain a explicitement dit "vasy et justifie tout dans les md et ici meme"
**Raison** : Le bug P0 est dans ce fichier. Impossible de corriger sans le modifier.
**Surface** : 3 fonctions personnel uniquement. Aucune autre fonction touchée.
**Risque** : Faible — le pattern `findByIdAndUpdate` est plus sûr que `findById` + `save()` car il élimine la fenêtre de concurrence.
**Régression** : Les 3 fonctions retournent exactement les mêmes structures JSON qu'avant. Le wrapper `crvPersonnelController.js` (journalisation CRVEvent) fonctionne toujours car il intercepte `res.json()`, pas le modèle Mongoose.

---

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

2 fichiers, +41/-70 lignes, 1 zone rouge (autorisée). Le VersionError 500 est éliminé. 4 requêtes concurrentes passent toutes avec succès.
