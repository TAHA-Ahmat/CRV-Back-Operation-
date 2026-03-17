# MISSION INDEX — Chantier CRV Operations

| Mission | Domaine | Statut honnête | Merge | Rapport | Briefing | Commentaire |
|---|---|---|---|---|---|---|
| P0_ROUTE_AUTH_001 | Backend / Sécurité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P0_ROUTE_AUTH_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P0_ROUTE_AUTH_001.md) | 27 routes CRV manquaient excludeAdmin. Corrigé. 1 fichier, 113 tests PASS. |
| P0_ROUTE_AUTH_002 | Backend / Sécurité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P0_ROUTE_AUTH_002_RAPPORT.md) | [Briefing](BRIEFING_GPT_P0_ROUTE_AUTH_002.md) | 20 routes phases/charges manquaient excludeAdmin. Corrigé. 2 fichiers, 113 tests PASS. |
| P1_UX_001 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_UX_001_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_UX_001.md) | Champs vol non pré-remplis sur CRV Départ/TurnAround. Noms de champs désalignés avec CRVHeader. 2 fichiers. |
| P1_UX_002 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_UX_002_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_UX_002.md) | Champs vol non persistés sur Départ/TurnAround (pas de case 1). Poste jamais envoyé/rechargé (3 vues). 3 fichiers. |
| P1_UX_003 | Backend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UX_003_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UX_003.md) | fonctionAutre (personnel AUTRE) absent du schema Mongoose → perdu au save. 1 fichier, 4 lignes. |
| P1_UX_004 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_UX_004_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_UX_004.md) | isValidated non initialisé → step 7 bloquant sur CRV VALIDE/VERROUILLE. 3 fichiers, 15 lignes. |
| P1_UI_API_001 | Backend / Traçabilité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UI_API_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UI_API_001.md) | Flux Personnel sans journalisation CRVEvent. Wrapper ajouté, 3 fichiers, 2 événements prouvés en base. |
| P1_UI_API_002 | Backend / Traçabilité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UI_API_002_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UI_API_002.md) | Flux Engins sans journalisation CRVEvent. Wrapper ajouté, 3 fichiers, 2 événements prouvés en base. |
| P1_UI_API_003 | Backend / Traçabilité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UI_API_003_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UI_API_003.md) | Flux Charges sans journalisation CRVEvent. Wrapper ajouté, 2 fichiers, 1 événement prouvé en base. |
| P1_UI_API_004 | Backend / Traçabilité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UI_API_004_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UI_API_004.md) | Flux Événements sans journalisation CRVEvent. Wrapper dédié créé, 3 fichiers, 1 événement prouvé en base. |
| P1_UI_API_005 | Backend / Traçabilité | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P1_UI_API_005_RAPPORT.md) | [Briefing](BRIEFING_GPT_P1_UI_API_005.md) | Flux Observations sans journalisation CRVEvent. Wrapper dédié créé, 3 fichiers, 1 événement prouvé en base. Pas d'UI observations (feature manquante). |
| CLAUDE_MD_REALIGNMENT | Documentation / Gouvernance | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](CLAUDE_MD_REALIGNMENT_RAPPORT.md) | [Briefing](BRIEFING_GPT_CLAUDE_MD_REALIGNMENT.md) | CLAUDE.md réaligné : doctrine stable séparée de l'état vivant (MISSION_INDEX). Backlog obsolète retiré. Skill référencé. |
| DOC_GOV_HARDENING | Documentation / Gouvernance | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](DOCUMENTATION_GOVERNANCE_HARDENING_RAPPORT.md) | [Briefing](BRIEFING_GPT_DOCUMENTATION_GOVERNANCE_HARDENING.md) | Vocabulaire statut migré dans CLAUDE.md. Règle MAJ du skill ajoutée. Règle contradiction CLAUDE/SKILL explicitée. |
| DOC_FINAL_LOCK | Documentation / Gouvernance | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](DOCUMENTATION_FINAL_LOCK_RAPPORT.md) | [Briefing](BRIEFING_GPT_DOCUMENTATION_FINAL_LOCK.md) | Chemins SKILL corrigés. Protocole reprise cross-conversation. PROJECT_STATE_COMPACT créé. |
| GOVERNANCE_HARDENING_PRE_P2 | Documentation / Gouvernance | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](GOVERNANCE_HARDENING_PRE_P2_RAPPORT.md) | [Briefing](BRIEFING_GPT_GOVERNANCE_HARDENING_PRE_P2.md) | 7 règles ajoutées : anti-sac, qualification 4 classes, découpage ET, suppression code mort 5 critères, priorisation formalisée, preuve pré-patch, sortie mission. |
| P2_ENDPOINT_001 | Backend / Journal CRVEvent | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P2_ENDPOINT_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P2_ENDPOINT_001.md) | 2 routes GET branchées (events + stats). Controller/service existants, 1 fichier modifié, +20 lignes, 13 events récupérés en test live. |
| P2_DEAD_SERVICE_001 | Backend / Code mort | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P2_DEAD_SERVICE_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P2_DEAD_SERVICE_001.md) | crvTransaction.service.js supprimé (5/5 critères). crv-transaction.test.js supprimé (orphelin, 9 tests cassés). -558 lignes. |
| P2_CRVEVENT_INTEGRATION_001 | Backend / Tests CRVEvent | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P2_CRVEVENT_INTEGRATION_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P2_CRVEVENT_INTEGRATION_001.md) | 10/10 tests wrappers sous-ressources corrigés (imports vers wrappers, assertions alignées). 1 fichier test, 0 fichier source. |
| P2_DOUBLE_RELOAD_001 | Frontend / UX CRV Arrivée | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P2_DOUBLE_RELOAD_001_RAPPORT.md) | — | 3 handlers parent supprimaient le double loadCRV() redondant. 1 fichier, -19 lignes. |
| RUNTIME_E2E_CRV_BROWSER_AUDIT | Frontend+Backend / Audit | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](RUNTIME_E2E_CRV_BROWSER_AUDIT_RAPPORT.md) | [Briefing](BRIEFING_GPT_RUNTIME_E2E_CRV_BROWSER_AUDIT.md) | Audit runtime navigateur complet. 8 bugs identifiés : wizard step 7 (P1), VersionError 500 (P0), charges invisibles (P1), Supprimer sur Terminé (P1), 4 P2/P3. 0 fichier source modifié. |
| P1_WIZARD_STEP_001 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_WIZARD_STEP_001_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_WIZARD_STEP_001.md) | Wizard "Continuer" sautait des étapes (exécution concurrente nextStep). Verrou isNavigating ajouté. 3 fichiers, +21/-3 lignes. |

## Backlog restant

### P0 — sécurité / prod
- [x] ~~Route shadowing~~ → Audité P0_ROUTE_AUTH_001 : aucun shadowing détecté
- [x] ~~Auth bypass ADMIN sur routes CRV~~ → Corrigé P0_ROUTE_AUTH_001
- [x] ~~Auth bypass ADMIN sur routes phases/charges~~ → Corrigé P0_ROUTE_AUTH_002
- [ ] Vérification ordre des routes + middlewares réels sur autres domaines
- [ ] **VersionError 500 sur sauvegarde sous-ressources après création CRV** (BUG-002 audit E2E) — Mongoose __v conflict après auto-démarrage BROUILLON→EN_COURS. Bloque toute saisie sur CRV fraîchement créé. Zone rouge (crv.controller.js).

### P1 — bugs UX réels
- [x] ~~Champs vol non pré-remplis sur CRV existant~~ → Corrigé P1_UX_001
- [x] ~~Champs vol non persistés sur CRV existant~~ → Corrigé P1_UX_002
- [x] ~~Écarts UI / données réellement chargées~~ → Audité P1_UX_003, fonctionAutre corrigé
- [x] ~~Parcours wizard bloquant ou incohérent~~ → Corrigé P1_UX_004, isValidated init depuis statut CRV
- [x] ~~Wizard "Continuer" saute au step 7~~ → Corrigé P1_WIZARD_STEP_001, verrou isNavigating dans 3 vues CRV
- [ ] **Charges existantes non affichées** (BUG-003 audit E2E) — store charges=[] alors que base a des données. GET /crv/:id ne renvoie pas les charges ou frontend ne les parse pas.
- [ ] **Bouton Supprimer visible sur CRV ≥ TERMINÉ** (BUG-004 audit E2E) — Violation règle "Suppression interdite ≥ TERMINE". Vérifier si backend bloque aussi.

### P1 — cohérence UI/API
- [x] ~~Flux batch personnel vs événements unitaires~~ → Audité P1_UI_API_001, journal CRVEvent branché
- [x] ~~Flux engins vs événements~~ → Audité P1_UI_API_002, journal CRVEvent branché
- [x] ~~Flux charges vs journal CRVEvent~~ → Audité P1_UI_API_003, journal CRVEvent branché
- [x] ~~Flux événements/incidents vs journal CRVEvent~~ → Audité P1_UI_API_004, journal CRVEvent branché
- [x] ~~Flux observations vs journal CRVEvent~~ → Audité P1_UI_API_005, journal CRVEvent branché (pas d'UI — feature manquante documentée)

### P2 — dette technique
- [ ] Logs excessifs front/backend (confirmé : 226+ entrées console pour 1 chargement CRV, logs x2 StrictMode)
- [ ] **Requêtes réseau x4 sur sauvegarde** (BUG-008 audit E2E) — double mount Vue × double handler = 4 requêtes par action
- [ ] **Aéroport destination non pré-rempli à la création** (BUG-005 audit E2E)
- [x] ~~crvTransaction.service.js possiblement non utilisé~~ → Supprimé P2_DEAD_SERVICE_001 (5/5 critères + test orphelin)
- [ ] Code mort / stratégie abandonnée
- [ ] Nettoyage payloads incohérents
- [x] ~~Double rechargement CRV après chaque action~~ → Corrigé P2_DOUBLE_RELOAD_001, 3 handlers CRVArrivee.vue
- [x] ~~Exposer endpoint GET /api/crv/:id/events~~ → Corrigé P2_ENDPOINT_001, 2 routes branchées

### P2 — tests
- [x] ~~Tests d'intégration CRVEvent wrappers sous-ressources~~ → Corrigé P2_CRVEVENT_INTEGRATION_001 (10/10 pass)
- [ ] Tests permissions / verrouillage / auth sur routes sensibles

### P3 — améliorations futures
- [ ] **Données vol vides sur cartes bulletin avant sélection** (BUG-006 audit E2E)
- [ ] Migration frontend wizard
- [ ] Nettoyage abstractions cosmétiques
- [ ] Harmonisation documentaire
- [ ] Brancher notifications eventRegistry sur CRVEvent
