# BRIEFING GPT — RUNTIME_E2E_CRV_BROWSER_AUDIT

## Contexte
Audit complet du module CRV depuis le navigateur, en tant que superviseur. Le but : vérifier si un utilisateur réel peut créer un CRV, le remplir étape par étape, et le valider.

## Résultat en une phrase
L'utilisateur peut créer un CRV et voir les informations de base, mais il ne peut pas le remplir normalement : la navigation entre les étapes est cassée, la sauvegarde échoue sur les nouveaux CRV, et certaines données existantes sont invisibles.

## Les 4 problèmes qui bloquent le parcours utilisateur

### 1. L'utilisateur crée un CRV, puis ne peut rien y enregistrer
Après création depuis le programme, toute tentative de sauvegarder du personnel (et probablement engins, charges, etc.) échoue avec une erreur serveur. L'utilisateur voit un message d'erreur et ses données ne sont pas sauvées.

**Question pour GPT** : La correction la plus propre est-elle de recharger le CRV côté frontend après le démarrage automatique, ou de modifier la méthode de sauvegarde côté backend pour ne pas dépendre du numéro de version ? Le controller concerné est en zone rouge (crv.controller.js).

### 2. Le bouton "Continuer" envoie directement à la dernière étape
Au lieu de passer de l'étape 1 à l'étape 2, le bouton "Continuer" envoie directement à l'étape 7 (Validation). L'utilisateur ne peut pas suivre le parcours normal.

**Question pour GPT** : Est-ce un design intentionnel qui dysfonctionne (par exemple, un système qui saute les étapes "vides") ou un bug de logique pure dans la navigation ?

### 3. Les charges déjà enregistrées n'apparaissent pas
L'utilisateur ouvre un CRV existant, va à l'étape Charges, et voit "Aucune charge enregistrée" alors que des charges existent bien en base. Il ne peut ni les voir, ni les modifier.

**Question pour GPT** : Faut-il investiguer d'abord ce que le serveur renvoie (les charges sont-elles dans la réponse ?) ou ce que l'application en fait (les parse-t-elle correctement) ?

### 4. Le bouton "Supprimer" est proposé sur des CRV qui ne doivent pas être supprimés
Un CRV au statut Terminé affiche un bouton "Supprimer" dans la liste. La règle métier interdit la suppression à ce stade.

**Question pour GPT** : Le serveur bloque-t-il aussi la suppression, ou est-ce un trou dans les deux couches ? Si le serveur bloque déjà, c'est un simple masquage côté interface. Sinon, c'est une faille métier.

## Ce qui fonctionne
Connexion, navigation, création CRV, pré-remplissage des informations vol, affichage des phases, barre de complétude, garde de validation.

## Statut
Audit d'observation — aucun code modifié. 8 problèmes documentés, priorisés, prêts pour des missions de correction.
