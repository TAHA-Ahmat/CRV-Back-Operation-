# P1_UI_API_004 — RAPPORT MISSION

## Objectif
Auditer puis corriger l'alignement entre le flux UI Événements/Incidents du wizard CRV, les routes backend appelées, et les événements journalisés (CRVEvent).

## Diagnostic initial

### Flux réel audité
1. **CRVEvenements.vue** : formulaire d'ajout d'événement (typeEvenement, gravite, description, actionsCorrectives, responsableSuivi)
2. **crvStore.addEvenement()** : validation enums + `POST /api/crv/:id/evenements`
3. **Backend ajouterEvenement** : crée un document `EvenementOperationnel` (collection séparée)
4. **Journal CRVEvent** : `INCIDENT_REPORTED` existait dans l'enum mais **jamais appelé**

### Architecture événements
- Événements : collection séparée `EvenementOperationnel` (ni embedded ni junction table)
- Types : PANNE_EQUIPEMENT, ABSENCE_PERSONNEL, RETARD, INCIDENT_SECURITE, INCIDENT_TECHNIQUE, PROBLEME_TECHNIQUE, METEO, AUTRE
- Gravités : MINEURE, MODEREE, MAJEURE, CRITIQUE
- Le composant CRVEvenements.vue gère uniquement les événements, PAS les observations (step séparé)
- `ajouterEvenement` était re-exporté depuis `crvChargesController.js` sans wrapper

### Actions UI réelles dans CRVEvenements.vue
- **Ajout d'événement** : seule action (pas d'édition, pas de suppression dans le composant)
- Pas de `saveCurrentStepData case 6` : le composant sauvegarde directement via le store

## Mini-table de vérité

| Action UI réelle | Vue / composant | Store appelé | Route API | Persistance | Événement journal | Fidèle ? | Problème ? | Décision |
|---|---|---|---|---|---|---|---|---|
| Ajout événement | CRVEvenements | addEvenement | POST /crv/:id/evenements | EvenementOperationnel (collection séparée) | **AUCUN** | **NON** | **OUI** | Wrapper |

## Problème prioritaire retenu

**La route `POST /api/crv/:id/evenements` ne journalise aucun CRVEvent**, malgré `INCIDENT_REPORTED` défini dans l'enum CRVEvent et `CRV_EVENEMENT_AJOUTE` dans eventRegistry.

**Impact métier** : Aucune traçabilité des déclarations d'événements/incidents dans le journal CRV.

## Fichiers modifiés
| Fichier | Lignes modifiées | Raison |
|---|---|---|
| `src/controllers/crv/crvEvenementsController.js` | Nouveau (35 lignes) | Wrapper avec journalisation INCIDENT_REPORTED |
| `src/controllers/crv/crvChargesController.js` | 2 lignes | Retrait re-export ajouterEvenement (migré vers crvEvenementsController) |
| `src/routes/crv/crv.routes.js` | 2 lignes | Import ajouterEvenement depuis crvEvenementsController |

**Fichiers zone rouge touchés : NON**

## Patch appliqué

### Stratégie
Pattern identique aux missions précédentes (Personnel, Engins, Charges) : wrapper controller qui intercepte `res.json()` et journalise après succès.

### Particularité événements
Plus simple que Personnel/Engins : pas de batch, pas d'ancienCount. Ajout unitaire uniquement. Le payload inclut `typeEvenement`, `gravite` et `description` (tronquée à 200 chars).

### Séparation des responsabilités
`ajouterEvenement` a été sorti de `crvChargesController.js` (où il était re-exporté par commodité) vers un wrapper dédié `crvEvenementsController.js`. Chaque domaine a désormais son propre wrapper.

### Détail
| Route | Type événement | Payload journalisé |
|---|---|---|
| POST /evenements | `INCIDENT_REPORTED` | `{ evenementId, typeEvenement, gravite, description }` |

## Preuve de correction réelle

### Test API live
```
=== BEFORE ===
INCIDENT_REPORTED events: 1 (préexistant)

=== POST /api/crv/:id/evenements (INCIDENT_SECURITE / MODEREE) ===
Status: 201, success: true
evenementId: 69b83adddc34dc0925a21e64

=== AFTER ===
INCIDENT_REPORTED events: 2

Latest event payload: {
  "evenementId": "69b83adddc34dc0925a21e64",
  "typeEvenement": "INCIDENT_SECURITE",
  "gravite": "MODEREE",
  "description": "Test audit P1_UI_API_004 - incident securite modere"
}

=== JOURNAL: OK ===
```

### Chaîne complète prouvée
```
UI (CRVEvenements) → handleAddEvenement()
→ crvStore.addEvenement(data)
→ POST /api/crv/:id/evenements
→ crvEvenementsController.ajouterEvenement (wrapper)
  → intercepte res.json()
  → _ajouterEvenement (controller original, zone rouge)
  → EvenementOperationnel.create (persistance ✓)
  → res.json intercepté → logCRVEvent('INCIDENT_REPORTED') (journal ✓)
→ CRVEvent créé en base MongoDB ✓
```

## Validation minimale exécutée
| Test | Résultat |
|---|---|
| Import modules (crvEvenementsController, crvChargesController, crv.routes) | PASS |
| Backend restart | PASS (zéro erreur) |
| POST evenements (INCIDENT_SECURITE/MODEREE) | 201 OK |
| CRVEvent INCIDENT_REPORTED en base | 1 événement créé ✓ |
| Persistance EvenementOperationnel | OK |
| Zone rouge | AUCUN fichier touché |
| Surface : 3 fichiers (1 nouveau + 2 modifiés) | Dans limites MADMIT |

## Hors scope
- Observations (step séparé, mission P1_UI_API_005)
- Routes modification/suppression d'événements (si elles existent)
- Branchement notifications eventRegistry sur CRVEvent
- Endpoint GET /api/crv/:id/events

## Risques restants
1. `ajouterObservation` reste re-exporté sans wrapper depuis `crvChargesController.js` — mission P1_UI_API_005.
2. `mettreAJourHoraire` reste re-exporté sans wrapper — à évaluer.
3. Le type `INCIDENT_REPORTED` est utilisé pour tous les événements (pas seulement les incidents au sens strict) — acceptable car le modèle `EvenementOperationnel` couvre incidents et événements opérationnels indistinctement.
4. Le controller original (`crv.controller.js`) émet déjà `CRV_INCIDENT_CRITIQUE` via notificationEngine pour gravité CRITIQUE — c'est un mécanisme de notification distinct du journal CRVEvent, pas de conflit.

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

Branche : `mission/P1-UI-API-001` (Back, même branche car même domaine cohérence UI/API)
Rollback : `git revert <hash>`
