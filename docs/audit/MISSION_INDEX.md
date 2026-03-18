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
| P1_CHARGES_DISPLAY_001 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_CHARGES_DISPLAY_001_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_CHARGES_DISPLAY_001.md) | Charges invisibles sur Départ/TurnAround : v-model formData.charges remplacé par :charges="crvStore.charges". 2 fichiers, +10/-2 lignes. |
| P1_DELETE_GUARD_001 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_DELETE_GUARD_001_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_DELETE_GUARD_001.md) | Bouton Supprimer visible sur CRV ≥ TERMINÉ. canSupprimerCRV bloque maintenant TERMINE+VALIDE+VERROUILLE. 1 fichier, +3/-2 lignes. |
| P0_VERSION_ERROR_001 | Backend / Personnel | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](P0_VERSION_ERROR_001_RAPPORT.md) | [Briefing](BRIEFING_GPT_P0_VERSION_ERROR_001.md) | VersionError 500 sur sauvegarde personnel concurrente. findById+save() → findByIdAndUpdate atomique ($set/$push/$pull). Zone rouge autorisée. 2 fichiers, +41/-70 lignes. |
| P1_PHASE_NONREALISE_001 | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_PHASE_NONREALISE_001_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_PHASE_NONREALISE_001.md) | Phases "Non réalisée" bloquées pour tous motifs sauf AUTRE. detailMotif exigé à tort par le store. Aligné sur businessRules.middleware.js. 1 fichier, +5/-5 lignes. |
| P2_REMOVE_CRV_HOME | Frontend / Navigation | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P2_REMOVE_CRV_HOME_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P2_REMOVE_CRV_HOME.md) | Page intermédiaire /crv supprimée. Redirect vers /crv/nouveau. Boutons Retour → /crv/liste. 5 fichiers, +5/-17 lignes. |
| P1_BINDING_DEPART_TURNAROUND | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_BINDING_DEPART_TURNAROUND_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_BINDING_DEPART_TURNAROUND.md) | 5 bugs DANGEREUX Départ/TurnAround : case 1 vol manquant, CRVCharges/Evenements v-model cassé. posteStationnement corrigé. 2 fichiers, +76/-6 lignes. |
| P1_PREFILL_DEPART_TURNAROUND | Frontend / UX | FAIT ET BRANCHÉ | MERGEABLE | [Rapport](../../Front/docs/audit/P1_PREFILL_DEPART_TURNAROUND_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_PREFILL_DEPART_TURNAROUND.md) | formData.header désaligné avec CRVHeader sur Départ/TurnAround. 5-6 champs bulletin invisibles malgré données en base. Réaligné + fix poste Arrivée. 3 fichiers, +42/-27 lignes. |
| COVERAGE_FULL_FLOW_TO_VALIDATION_PDF | Frontend+Backend / Audit | FAIT ET BRANCHÉ | N/A (audit) | [Rapport](../../Front/docs/audit/P1_FULL_FLOW_TO_VALIDATION_PDF_RAPPORT.md) | [Briefing](../../Front/docs/audit/BRIEFING_GPT_P1_FULL_FLOW_TO_VALIDATION_PDF.md) | Audit flux complet 7 étapes + PDF sur 3 types CRV. 1 DANGEREUX (engins perdus D1), 2 REPORTABLES (terminologie validation, complétude engins). 0 fichiers modifiés. |

## Backlog restant

### P0 — sécurité / prod
- [x] ~~Route shadowing~~ → Audité P0_ROUTE_AUTH_001 : aucun shadowing détecté
- [x] ~~Auth bypass ADMIN sur routes CRV~~ → Corrigé P0_ROUTE_AUTH_001
- [x] ~~Auth bypass ADMIN sur routes phases/charges~~ → Corrigé P0_ROUTE_AUTH_002
- [ ] Vérification ordre des routes + middlewares réels sur autres domaines
- [x] ~~VersionError 500 sur sauvegarde sous-ressources après création CRV~~ → Corrigé P0_VERSION_ERROR_001 (findById+save → findByIdAndUpdate atomique, 3 fonctions personnel)

### P1 — bugs UX réels
- [x] ~~Champs vol non pré-remplis sur CRV existant~~ → Corrigé P1_UX_001
- [x] ~~Champs vol non persistés sur CRV existant~~ → Corrigé P1_UX_002
- [x] ~~Écarts UI / données réellement chargées~~ → Audité P1_UX_003, fonctionAutre corrigé
- [x] ~~Parcours wizard bloquant ou incohérent~~ → Corrigé P1_UX_004, isValidated init depuis statut CRV
- [x] ~~Wizard "Continuer" saute au step 7~~ → Corrigé P1_WIZARD_STEP_001, verrou isNavigating dans 3 vues CRV
- [x] ~~Charges existantes non affichées~~ → Corrigé P1_CHARGES_DISPLAY_001, binding CRVCharges corrigé dans Départ/TurnAround
- [x] ~~Bouton Supprimer visible sur CRV ≥ TERMINÉ~~ → Corrigé P1_DELETE_GUARD_001, canSupprimerCRV bloque TERMINE+VALIDE+VERROUILLE. Backend à vérifier séparément.
- [x] ~~Phases "Non réalisée" bloquées pour motifs standards~~ → Corrigé P1_PHASE_NONREALISE_001, detailMotif aligné sur businessRules.middleware.js

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
- [x] ~~Page intermédiaire /crv (CRVHome) obsolète~~ → Corrigé P2_REMOVE_CRV_HOME, redirect /crv → /crv/nouveau, boutons Retour → /crv/liste
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
