# RUNTIME_E2E_CRV_BROWSER_AUDIT — RAPPORT MISSION

## Mission : RUNTIME_E2E_CRV_BROWSER_AUDIT
- Date : 2026-03-17
- Branche : mission/RUNTIME-E2E-CRV-BROWSER-AUDIT (Back — docs uniquement)
- Périmètre : frontend + backend (observation seule)
- Domaine : Module CRV complet — audit runtime navigateur
- Classe : PRODUIT (valeur diagnostique pour l'utilisateur)
- Niveau cérémonie : standard
- Fichiers modifiés : 0 fichiers source (rapport + briefing uniquement)
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : 0 (code source)
- Build avant/après : N/A (audit d'observation)
- Impact comportemental : Aucun — mission d'observation et diagnostic

## Protocole d'audit

- Connexion : superviseur@crv.test (Pierre MARTIN, SUPERVISEUR)
- Serveurs : backend localhost:4000, frontend localhost:3000
- Méthode : parcours utilisateur réel depuis le navigateur, capture réseau et logs

## Parcours utilisateur testé

1. Se connecter comme superviseur → OK
2. Accéder à la page d'accueil → OK
3. Aller sur "Nouveau CRV" pour créer un compte rendu de vol
4. Chercher un vol dans le bulletin/programme → vols trouvés
5. Sélectionner le vol KP038 (Arrivée du 17/03) et créer le CRV
6. Remplir les 7 étapes du CRV (informations vol, personnel, engins, phases, charges, événements, validation)
7. Ouvrir un CRV existant (Turn Around ET939, en cours à 58%) pour compléter les données
8. Ouvrir un CRV terminé (Arrivée KP032, 85%) pour vérifier l'affichage
9. Consulter la liste "Mes CRV" et vérifier les actions disponibles

---

## PROBLÈMES IDENTIFIÉS

### PROBLÈME 1 — L'utilisateur ne peut pas avancer étape par étape dans le CRV

- **Étape utilisateur** : Remplissage du CRV / n'importe quelle étape / passage à la suivante
- **Action utilisateur** : Clique sur "Continuer"
- **Résultat attendu** : Passe à l'étape suivante (étape 1 → étape 2 → étape 3...)
- **Résultat observé** : Saute directement à l'étape 7 "Validation", en indiquant toutes les étapes comme terminées (cercles verts)
- **Impact utilisateur** : L'utilisateur ne peut pas remplir son CRV normalement. Il n'a aucun moyen de revenir aux étapes intermédiaires (personnel, engins, phases, charges, événements). Le parcours est cassé.
- **Gravité** : Élevée — bloque le remplissage du CRV
- **Cause technique probable** : La logique de navigation des étapes calcule incorrectement l'étape suivante et envoie directement à la dernière
- **Correction probable** : Rétablir une progression séquentielle (étape N → étape N+1)

---

### PROBLÈME 2 — L'utilisateur ne peut pas enregistrer le personnel sur un CRV qu'il vient de créer

- **Étape utilisateur** : CRV fraîchement créé / étape 2 Personnel / ajout d'une personne
- **Action utilisateur** : Remplit nom, prénom, rôle, puis clique "Continuer" pour sauvegarder
- **Résultat attendu** : La personne est enregistrée, l'utilisateur passe à l'étape suivante
- **Résultat observé** : Message d'erreur. La sauvegarde échoue silencieusement côté serveur (erreur 500). Le personnel n'est pas enregistré.
- **Impact utilisateur** : Impossible de renseigner le personnel sur un nouveau CRV. L'utilisateur a l'impression que l'application ne fonctionne pas. Toute donnée saisie est perdue.
- **Gravité** : Critique — bloque complètement la saisie sur les nouveaux CRV
- **Cause technique probable** : Lors de la création, le CRV passe automatiquement de "Brouillon" à "En cours", ce qui modifie sa version en base. L'application garde l'ancienne version en mémoire, et le serveur rejette toute modification ultérieure car les versions ne correspondent plus.
- **Correction probable** : Après le démarrage automatique du CRV, recharger ses données pour synchroniser la version, ou modifier la méthode de sauvegarde pour ne pas dépendre du numéro de version.

---

### PROBLÈME 3 — L'utilisateur ne voit pas les charges déjà saisies

- **Étape utilisateur** : CRV existant (Turn Around à 58%) / étape 5 Charges
- **Action utilisateur** : Consulte l'étape Charges pour voir ou compléter les données
- **Résultat attendu** : Les charges déjà enregistrées (passagers, bagages, fret) sont affichées
- **Résultat observé** : Le message "Aucune charge enregistrée pour ce vol" s'affiche. Quand l'utilisateur tente d'ajouter une charge identique, le système refuse en disant "doublon interdit" — preuve que la charge existe bien mais n'est pas affichée.
- **Impact utilisateur** : L'utilisateur ne sait pas ce qui a déjà été saisi. Il ne peut ni consulter, ni modifier, ni compléter les charges existantes. Il risque de croire que ses données ont été perdues.
- **Gravité** : Élevée — données existantes invisibles
- **Cause technique probable** : Le chargement du CRV ne récupère pas les charges depuis le serveur, ou l'application ne les interprète pas correctement à la réception.
- **Correction probable** : Vérifier que le serveur renvoie bien les charges dans la réponse du CRV, et que l'application les affiche à l'écran.

---

### PROBLÈME 4 — L'utilisateur peut voir "Supprimer" sur un CRV terminé

- **Étape utilisateur** : Liste "Mes CRV" / consultation d'un CRV au statut "Terminé"
- **Action utilisateur** : Regarde les actions disponibles pour un CRV terminé
- **Résultat attendu** : Le bouton "Supprimer" ne doit pas apparaître (la suppression est interdite une fois le CRV terminé)
- **Résultat observé** : Le bouton "Supprimer" est affiché et cliquable
- **Impact utilisateur** : L'utilisateur pourrait tenter de supprimer un CRV terminé. Si le serveur le bloque, il recevra une erreur confuse. Si le serveur ne le bloque pas, des données opérationnelles validées peuvent être détruites.
- **Gravité** : Élevée — violation d'une règle métier fondamentale
- **Cause technique probable** : L'affichage des boutons d'action ne tient pas compte du statut du CRV
- **Correction probable** : Masquer le bouton "Supprimer" quand le statut est Terminé, Validé, ou Verrouillé. Vérifier que le serveur bloque aussi la suppression.

---

### PROBLÈME 5 — L'aéroport de destination n'est pas pré-rempli à la création

- **Étape utilisateur** : Création d'un CRV depuis un vol du programme / étape 1 Informations vol
- **Action utilisateur** : Consulte les informations pré-remplies du vol
- **Résultat attendu** : Tous les champs connus sont pré-remplis, y compris l'aéroport de destination (NDJ, puisque c'est l'escale du bulletin)
- **Résultat observé** : L'aéroport de destination reste vide (affiche "ex: NDJ" en gris)
- **Impact utilisateur** : L'utilisateur doit ressaisir manuellement une information que le système connaît déjà. Risque d'oubli ou d'erreur.
- **Gravité** : Modérée — saisie manuelle inutile
- **Cause technique probable** : Le champ destination n'est pas mappé depuis les données du programme/bulletin lors de la création
- **Correction probable** : Pré-remplir le champ destination avec l'escale du bulletin/programme

---

### PROBLÈME 6 — Les informations des vols ne s'affichent pas sur les cartes de résultats

- **Étape utilisateur** : Création CRV / recherche de vol dans le bulletin
- **Action utilisateur** : Regarde les résultats de recherche pour choisir un vol
- **Résultat attendu** : Chaque carte de vol affiche la compagnie, la date/heure et l'escale
- **Résultat observé** : Les labels sont affichés (COMPAGNIE, DATE/HEURE, ESCALE) mais les valeurs sont vides. Elles n'apparaissent qu'après avoir cliqué sur une carte.
- **Impact utilisateur** : L'utilisateur ne peut pas comparer les vols avant de cliquer dessus un par un. Il navigue à l'aveugle.
- **Gravité** : Faible — gênant mais contournable
- **Cause technique probable** : Les données de vol ne sont pas affichées dans le composant carte avant sélection
- **Correction probable** : Afficher les informations de vol directement sur chaque carte de résultat

---

### PROBLÈME 7 — Tous les messages de la console sont doublés

- **Étape utilisateur** : Toute interaction avec un CRV
- **Action utilisateur** : Aucune action spécifique — se produit automatiquement
- **Résultat attendu** : Un seul message par action dans la console de développement
- **Résultat observé** : Chaque message apparaît 2 fois. 226 entrées de log pour un simple chargement de CRV.
- **Impact utilisateur** : Aucun impact direct visible. Impact pour les développeurs : difficile de déboguer, logs pollués.
- **Gravité** : Faible — développement uniquement
- **Cause technique probable** : Le mode développement Vue monte les composants deux fois (StrictMode ou rechargement à chaud)
- **Correction probable** : Réduire la verbosité des logs, ou conditionner certains logs au mode production

---

### PROBLÈME 8 — Chaque sauvegarde envoie 4 requêtes au serveur au lieu d'une

- **Étape utilisateur** : Remplissage du CRV / sauvegarde de données (personnel, charges, etc.)
- **Action utilisateur** : Clique pour sauvegarder
- **Résultat attendu** : Une seule requête est envoyée au serveur
- **Résultat observé** : 4 requêtes identiques sont envoyées simultanément
- **Impact utilisateur** : L'application paraît lente. En cas d'erreur, l'utilisateur reçoit 4 messages d'erreur au lieu d'un. Le serveur est surchargé inutilement.
- **Gravité** : Modérée — performance et confusion
- **Cause technique probable** : Combinaison du double montage Vue et d'un double déclenchement de la sauvegarde
- **Correction probable** : Identifier et supprimer les déclenchements de sauvegarde en double

---

## CE QUI FONCTIONNE BIEN

1. **Se connecter** : L'utilisateur se connecte, voit un message de confirmation, arrive sur la page d'accueil
2. **Naviguer** : Toutes les pages sont accessibles et chargent correctement
3. **Créer un CRV** : Le flux de sélection d'un vol et création du CRV fonctionne
4. **Voir la progression** : La barre de complétude et le pourcentage reflètent bien l'état du CRV
5. **Pré-remplissage** : Les informations du vol sont récupérées depuis le programme (numéro, compagnie, type avion)
6. **Validation gardée** : Le bouton "Valider le CRV" ne se déclenche pas tant que les champs obligatoires ne sont pas remplis
7. **Doublons bloqués** : Le système empêche d'ajouter deux fois la même charge
8. **Phases opérationnelles** : L'affichage des phases avec heures prévues/réelles, durée et écart est clair et utile
9. **CRV terminé** : Un CRV terminé à 85% affiche correctement "CRV prêt pour validation"

## RÉSUMÉ — ÉTAT DU PARCOURS UTILISATEUR

| Parcours | État | L'utilisateur peut... |
|---|---|---|
| Se connecter | OK | Se connecter et accéder à l'application |
| Créer un CRV | OK | Sélectionner un vol et créer le CRV |
| Remplir étape par étape | KO | **Non** — le bouton "Continuer" saute à la fin |
| Ajouter du personnel | KO | **Non** — erreur serveur sur les nouveaux CRV |
| Voir les charges existantes | KO | **Non** — elles sont invisibles |
| Voir les phases | OK | Consulter les phases et leur avancement |
| Valider le CRV | OK visuel | Le formulaire de validation est correct |
| Gérer ses CRV | PARTIEL | Peut voir la liste, mais "Supprimer" est proposé à tort sur les CRV terminés |

## PRIORISATION DES CORRECTIONS

| Priorité | Problème | Pourquoi c'est urgent |
|---|---|---|
| 1 | Sauvegarde impossible sur nouveau CRV | L'utilisateur ne peut rien faire après avoir créé un CRV |
| 2 | Navigation étapes cassée | L'utilisateur ne peut pas suivre le parcours normal |
| 3 | Charges existantes invisibles | L'utilisateur perd la visibilité sur ses propres données |
| 4 | Supprimer visible sur CRV terminé | Risque de suppression de données opérationnelles |
| 5 | Destination non pré-remplie | Saisie manuelle inutile |
| 6 | Requêtes x4 | Lenteur et messages d'erreur en cascade |
| 7 | Cartes de vol vides | Navigation à l'aveugle lors du choix du vol |
| 8 | Logs doublés | Impact développeurs uniquement |

## Statut honnête final
**FAIT ET BRANCHÉ — RAPPORT D'AUDIT (pas de code modifié)**
