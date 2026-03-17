# BRIEFING GPT — RUNTIME_E2E_CRV_BROWSER_AUDIT

## Contexte
Claude Code a exécuté un audit runtime end-to-end complet du module CRV depuis le navigateur, en se connectant comme superviseur et en testant la création de CRV, la navigation du wizard, les sous-ressources, et les CRV existants.

## Ce qui a été fait
- Connexion superviseur@crv.test, navigation vers toutes les pages
- Création d'un CRV Arrivée (KP038) depuis le programme Semaine 42
- Test du wizard 7 étapes sur CRV nouveau et existant
- Test des sous-ressources : Personnel (500 VersionError), Engins (formulaire OK), Phases (affichage OK), Charges (409 Conflict car données invisibles), Événements (formulaire OK)
- Test de la validation (step 7) — garde frontend correcte
- Test d'un CRV Terminé (KP032, 85%) — chargement OK au step 1

## 8 bugs identifiés — 3 critiques

### BUG-001 (P1) — Wizard "Continuer" saute au step 7
Le bouton "Continuer" met currentStep=7 au lieu d'incrémenter. L'utilisateur ne peut pas naviguer séquentiellement.

### BUG-002 (P0) — VersionError 500 sur personnel
Mongoose `__v` conflict après auto-démarrage BROUILLON→EN_COURS. Le frontend garde version 0, le backend a incrémenté. Toute sauvegarde de sous-ressource échoue sur un CRV fraîchement créé.

### BUG-003 (P1) — Charges existantes non affichées
Le store a `charges: []` alors que des charges existent en base (prouvé par 409 doublon). L'utilisateur ne voit pas ses données.

### BUG-004 (P1) — Supprimer visible sur CRV ≥ Terminé
Violation de la règle métier "Suppression interdite ≥ TERMINE".

### BUG-005 (P2) — Aéroport destination non pré-rempli
### BUG-006 (P3) — Données vol vides sur cartes bulletin
### BUG-007 (P3) — Logs console en double (StrictMode/HMR)
### BUG-008 (P2) — Requêtes réseau x4 (double mount × double handler)

## Points d'attention pour GPT

1. **BUG-002 est dans zone rouge** (crv.controller.js). La correction nécessite soit un changement dans le controller (zone rouge), soit un rechargement côté frontend après `demarrer()`. Quelle approche recommandes-tu ?

2. **BUG-001 semble structurel** dans le wizard Vue. Le bouton "Continuer" appelle probablement une méthode qui calcule le "prochain step" de manière incorrecte (saute les steps vides ?). Est-ce un design intentionnel (skip des steps optionnels) qui dysfonctionne, ou un bug de logique pure ?

3. **BUG-003** pourrait être un problème de populate Mongoose (les charges sont des sous-documents ou des références ?) ou un problème de parsing frontend. Faut-il investiguer côté backend (GET /crv/:id response) ou côté frontend (store parsing) en priorité ?

4. **BUG-004** : Le bouton Supprimer est affiché côté frontend. Le backend bloque-t-il effectivement la suppression ≥ TERMINE ? Si oui, c'est un fix frontend simple (conditionner l'affichage). Si non, c'est un fix backend critique.

## Statut
Audit d'observation — aucun code modifié. 8 bugs documentés, priorisés, prêts pour missions de correction.
