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
- Backend : localhost:4000 (Express.js + MongoDB)
- Frontend : localhost:3000 (Vue 3 + Vite HMR)
- Outils : preview_screenshot, preview_snapshot, preview_eval, preview_network, preview_console_logs, preview_logs

## Parcours testé

1. Login superviseur — OK
2. Page d'accueil — OK (tuiles Nouveau CRV, Mes CRV, Bulletins, Programmes, Archives)
3. Nouveau CRV — mode Vol Planifié / Bulletin de Mouvement
4. Recherche bulletins — filtres date/escale/type/statut CRV
5. Sélection vol KP038 (Arrivée, 17/03/2026) depuis programme
6. Création CRV Arrivée → CRV260317-0001, auto-démarré EN_COURS
7. Wizard steps 1-7 (Informations, Personnel, Engins, Phases, Charges, Événements, Validation)
8. CRV Turn Around existant CRV260313-0002 (ET939, En cours, 58%)
9. CRV Arrivée existant CRV260311-0019 (KP032, Terminé, 85%)
10. Page Bulletins — liste des 6 bulletins existants
11. Page Mes CRV — tableau avec 7 CRV visibles

## BUGS IDENTIFIÉS

### BUG-001 — CRITIQUE — Wizard "Continuer" saute au step 7
- **Gravité** : P1 — bloquant pour l'UX du wizard
- **Reproduction** : Sur tout CRV (nouveau ou existant), cliquer "Continuer" depuis n'importe quel step
- **Comportement observé** : Le wizard passe directement à currentStep=7 (Validation), tous les cercles deviennent verts
- **Comportement attendu** : Le wizard devrait incrémenter currentStep de 1 (1→2→3→4→5→6→7)
- **Impact** : L'utilisateur ne peut pas naviguer séquentiellement dans le wizard. Il doit manuellement trouver les sections (impossible sans accès développeur).
- **Composant** : CRVArrivee.vue (et probablement CRVDepart.vue, CRVTurnAround.vue)
- **Note** : Le chargement initial d'un CRV existant (ex: Terminé) ouvre correctement au step 1. Le bug est spécifique au bouton "Continuer".

### BUG-002 — CRITIQUE — VersionError 500 sur sauvegarde personnel (et potentiellement toutes sous-ressources)
- **Gravité** : P0 — bloquant pour la saisie
- **Reproduction** : Créer un CRV depuis le programme, puis tenter d'ajouter du personnel
- **Erreur** : `PUT /api/crv/:id/personnel → 500 Internal Server Error`
- **Message** : `"No matching document found for id ... version 0 modifiedPaths "personnelAffecte""`
- **Cause racine** : Mongoose optimistic locking (versionKey `__v`). Le CRV est créé en BROUILLON (v0), puis auto-démarré EN_COURS (v1+). Le frontend garde la version 0 en mémoire. Tout `save()` ultérieur échoue.
- **Localisation** : `crv.controller.js:2600` dans `mettreAJourPersonnel`
- **Impact** : Aucune sous-ressource ne peut être sauvegardée sur un CRV fraîchement créé
- **Fix potentiel** : Après `demarrer()`, recharger le CRV complet (loadCRV) pour synchroniser la version, OU utiliser `findOneAndUpdate` au lieu de `findById + save` dans les controllers de sous-ressources.

### BUG-003 — MAJEUR — Charges existantes non affichées
- **Gravité** : P1 — données invisibles
- **Reproduction** : Ouvrir CRV260313-0002 (Turn Around, 58%), aller au step 5 (Charges)
- **Comportement observé** : "Aucune charge enregistrée pour ce vol" — le store a `charges: []`
- **Réalité** : Une charge PASSAGERS/EMBARQUEMENT existe en base (prouvé par le 409 Conflict lors de la tentative d'ajout doublon)
- **Impact** : L'utilisateur ne voit pas les charges existantes et ne peut pas les modifier
- **Cause probable** : Le GET /api/crv/:id ne renvoie pas les charges dans la réponse, OU le frontend ne les parse pas depuis la réponse

### BUG-004 — MAJEUR — Bouton "Supprimer" visible sur CRV ≥ TERMINÉ
- **Gravité** : P1 — violation règle métier
- **Reproduction** : Page "Mes CRV", CRV260311-0019 (Terminé) affiche un bouton "Supprimer"
- **Règle** : "Suppression interdite ≥ TERMINE" (CLAUDE.md, machine à états)
- **Impact** : Si le backend l'autorise aussi, c'est un bug de sécurité métier. Si le backend bloque, c'est un bug UX (bouton trompeur).
- **Vérification requise** : Tester si le DELETE est effectivement bloqué côté backend

### BUG-005 — MINEUR — Aéroport destination non pré-rempli à la création
- **Gravité** : P2 — UX
- **Reproduction** : Créer un CRV depuis le programme (vol KP038, escale NDJ)
- **Comportement** : Aéroport destination reste vide (placeholder "ex: NDJ") alors que l'escale du bulletin est NDJ
- **Note** : Sur les CRV existants (KP032), le champ est rempli (NDJ) — le problème est à la création

### BUG-006 — MINEUR — Données vol vides sur les cartes avant sélection
- **Gravité** : P3 — cosmétique
- **Reproduction** : Page Nouveau CRV, résultats de recherche bulletin
- **Comportement** : Les cartes affichent les labels COMPAGNIE, DATE/HEURE, ESCALE mais les valeurs sont vides. Elles n'apparaissent qu'après clic sur une carte.
- **Attendu** : Les données devraient être visibles directement sur chaque carte

### BUG-007 — INFO — Logs console en double (x2)
- **Gravité** : P3 — dev only
- **Cause** : Vue StrictMode ou HMR en dev double-mount les composants
- **Impact** : 226+ entrées de log pour un simple chargement de CRV. Verbosité excessive en développement.

### BUG-008 — INFO — Requêtes réseau en double (x4)
- **Gravité** : P2 — performance
- **Reproduction** : Le PUT /personnel est envoyé 4 fois (2x Vue strict mode × 2x double handler ?)
- **Impact** : Charge serveur inutile, 4 erreurs 500 au lieu d'une

## CONSTATS POSITIFS

1. **Login** : Fonctionne correctement, toast "Connexion réussie !", redirection accueil
2. **Navigation** : Toutes les pages accessibles (Accueil, Mes CRV, Nouveau CRV, Bulletins, Programmes, Archives, À valider, OPS)
3. **Création CRV** : Le flux Vol Planifié / Programme fonctionne — le CRV est créé et auto-démarré
4. **Pré-remplissage vol** : Les champs vol sont pré-remplis depuis le programme (fix P1_UX_001 confirmé fonctionnel)
5. **Stepper visuel** : Le stepper 7 étapes est bien affiché et les couleurs (vert/bleu/gris) sont correctes
6. **Complétude** : La barre de progression et le pourcentage sont cohérents (30% pour nouveau, 58% pour existant, 85% pour Terminé)
7. **Validation frontend** : Le bouton "Valider le CRV" est gardé — pas de soumission sans certification et fonction
8. **Détection doublons charges** : Le backend bloque correctement les doublons (409 Conflict avec message clair)
9. **Formulaires sous-ressources** : Personnel, Engins, Charges, Événements ont des formulaires complets avec les bons champs
10. **Phases opérationnelles** : Affichage correct avec heures prévues/réelles, durée, écart, tolérance
11. **Machine à états** : BROUILLON → EN_COURS fonctionne automatiquement à la création
12. **CRV Terminé** : S'ouvre correctement au step 1 avec message "CRV prêt pour validation"

## RÉSUMÉ DE SANTÉ

| Domaine | Statut | Commentaire |
|---|---|---|
| Login/Auth | OK | Fonctionne, session 3h |
| Navigation | OK | Toutes pages accessibles |
| Création CRV | PARTIEL | Création OK mais sous-ressources bloquées (VersionError) |
| Wizard CRV | KO | Bouton Continuer saute au step 7 systématiquement |
| Personnel | KO | 500 VersionError sur nouveau CRV |
| Engins | NON TESTÉ À FOND | Formulaire visible, pas de test sauvegarde |
| Phases | PARTIEL | Affichage OK, bouton "Saisir les heures" sans effet visible |
| Charges | KO | Charges existantes invisibles dans le store |
| Événements | OK VISUEL | Formulaire complet, pas de test sauvegarde |
| Validation | OK VISUEL | Garde frontend correcte |
| Règles métier | PARTIEL | Bouton Supprimer visible sur CRV Terminé (violation) |
| Performance | DÉGRADÉE | Requêtes x4, logs x2, 226+ entrées console |

## PRIORISATION DES CORRECTIONS

1. **P0** — BUG-002 : VersionError personnel (bloquant saisie)
2. **P1** — BUG-001 : Wizard Continuer saute au step 7 (bloquant navigation)
3. **P1** — BUG-003 : Charges non affichées (données invisibles)
4. **P1** — BUG-004 : Supprimer visible sur CRV ≥ Terminé (violation règle)
5. **P2** — BUG-005 : Aéroport destination non pré-rempli
6. **P2** — BUG-008 : Requêtes réseau x4
7. **P3** — BUG-006 : Données vides sur cartes bulletin
8. **P3** — BUG-007 : Logs console x2

## Statut honnête final
**FAIT ET BRANCHÉ — RAPPORT D'AUDIT (pas de code modifié)**
