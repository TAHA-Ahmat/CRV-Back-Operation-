# CRV BUG FIX REPORT — Mission Correction Integrale

**Date** : 2026-03-10
**Branche** : `mission/fix-fullstack-bugs`
**Perimetre** : Backend
**Niveau ceremonie** : Structurelle (zones rouges touchees)

---

## RESUME EXECUTIF

- **16 bugs identifies** lors du test full-stack 12 phases
- **10 bugs backend corriges** dans cette mission
- **3 bugs frontend** (hors perimetre backend)
- **3 bugs reclasses** (comportement nominal ou UX)
- **47/48 tests API passent** (98%)
- **2 fichiers zone rouge modifies** : `validation.service.js`, `businessRules.middleware.js`
- **0 regression** sur les fonctionnalites existantes

---

## FICHIERS MODIFIES

| # | Fichier | Zone Rouge | Lignes | Justification |
|---|---------|:----------:|--------|---------------|
| 1 | `src/middlewares/auth.middleware.js` | Non | +15 | BUG #16 — excludeAdmin middleware |
| 2 | `src/routes/crv/crv.routes.js` | Non | +46/-46 | BUG #5, #13, #16 — XSS, personnel, admin |
| 3 | `src/controllers/phases/phase.controller.js` | Non | +60/-60 | BUG #6, #8, #9 — phases validation |
| 4 | `src/services/validation/validation.service.js` | **OUI** | +1/-1 | BUG #15 — verrouillageAutomatique=false |
| 5 | `src/middlewares/businessRules.middleware.js` | **OUI** | +74/-74 | BUG #11, #12 — charges uniques + limites |
| 6 | `src/models/bulletin/BulletinMouvement.js` | Non | +4/-2 | BUG #3 — dateReference param |
| 7 | `src/controllers/bulletin/bulletinMouvement.controller.js` | Non | +2 | BUG #3 — passer date query |
| 8 | `src/services/bulletin/bulletinMouvement.service.js` | Non | +3/-1 | BUG #3 — propager dateReference |

**Total : 8 fichiers, ~205 lignes modifiees**

---

## DETAIL PAR BUG

### BUG #3 — getBulletinEnCours sans date de reference (P2)
- **Cause** : `getBulletinEnCours()` utilisait toujours `new Date()`, pas de date historique possible
- **Fix** : Ajout parametre `dateReference` optionnel dans model, service et controller
- **Fichiers** : BulletinMouvement.js, bulletinMouvement.controller.js, bulletinMouvement.service.js
- **Endpoint** : `GET /api/bulletins/en-cours/:escale?date=2026-03-01`
- **Preuve** : Parametre accepte, fallback sur `new Date()` si absent

### BUG #5 — Personnel role vs fonction (P1)
- **Cause** : Frontend envoie `role`, backend attend `fonction`
- **Fix** : Middleware `mapRoleToFonction` mappe `role -> fonction` avant validation
- **Fichiers** : crv.routes.js (lignes 253-262)
- **Endpoint** : `POST /api/crv/:id/personnel`
- **Preuve API** : `POST personnel {role: 'AGENT_TRAFIC'}` retourne 201 (pas 400)

### BUG #6 — heureDebut > heureFin accepte (P0)
- **Cause** : Validation ne comparait que les valeurs envoyees, pas les existantes
- **Fix** : Compare `heureFinReelle` envoyee vs `heureDebutReelle` existante et vice-versa
- **Fichiers** : phase.controller.js (lignes 464-478)
- **Endpoint** : `PUT /api/crv/:crvId/phases/:phaseId`
- **Preuve API** : `PUT {heureFinReelle: '13:00'}` sur phase avec heureDebut 14:00 retourne 400 `HEURE_FIN_AVANT_DEBUT`

### BUG #8 — Retrogradation phase autorisee (P0)
- **Cause** : Pas de machine a etats pour les phases
- **Fix** : Map de transitions autorisees `TRANSITIONS_PHASE`
- **Fichiers** : phase.controller.js (lignes 491-510)
- **Endpoint** : `PUT /api/crv/:crvId/phases/:phaseId`
- **Preuve API** : `PUT {statut: 'NON_COMMENCE'}` sur phase TERMINE retourne 400 `TRANSITION_PHASE_INTERDITE`
- **Transitions** :
  - NON_COMMENCE -> EN_COURS, TERMINE, NON_REALISE
  - EN_COURS -> TERMINE, NON_REALISE
  - TERMINE -> EN_COURS (correction)
  - NON_REALISE -> NON_COMMENCE (annulation)

### BUG #9 — Statut phase invalide accepte (P0)
- **Cause** : Pas de validation enum stricte
- **Fix** : Validation contre `STATUTS_PHASE_VALIDES = ['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'NON_REALISE']`
- **Fichiers** : phase.controller.js (lignes 480-489)
- **Endpoint** : `PUT /api/crv/:crvId/phases/:phaseId`
- **Preuve API** : `PUT {statut: 'BOGUS_VALUE_123'}` retourne 400 `STATUT_PHASE_INVALIDE`

### BUG #11 — Doublons charges acceptes (P1)
- **Cause** : Pas de verification d'unicite typeCharge + sensOperation par CRV
- **Fix** : Verification async dans `validerCoherenceCharges` avec import dynamique de ChargeOperationnelle
- **Fichiers** : businessRules.middleware.js (lignes 170-186) **ZONE ROUGE**
- **Endpoint** : `POST /api/crv/:id/charges`
- **Preuve API** : 2eme `POST {typeCharge: 'PASSAGERS', sensOperation: 'DEBARQUEMENT'}` retourne 409 `CHARGE_DOUBLON`

### BUG #12 — Valeurs charges absurdes acceptees (P1)
- **Cause** : Aucune limite haute sur les valeurs numeriques
- **Fix** : Limites max ajoutees :
  - Passagers : 1000 par champ
  - Bagages : 50000 pieces
  - Fret : 200000 kg
- **Fichiers** : businessRules.middleware.js (lignes 212-258) **ZONE ROUGE**
- **Endpoint** : `POST /api/crv/:id/charges`
- **Preuve API** : `POST {passagersAdultes: 999999}` retourne 400 `VALEUR_CHARGE_EXCESSIVE`

### BUG #13 — XSS injection stockee (P0)
- **Cause** : Pas de sanitization des champs texte libres
- **Fix** : `.trim().escape()` sur description, actionsCorrectives, responsableSuivi, contenu
- **Fichiers** : crv.routes.js (validators evenements + observations)
- **Endpoint** : `POST /api/crv/:id/evenements`, `POST /api/crv/:id/observations`
- **Preuve API** : `<script>alert("xss")</script>` stocke comme `&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;`

### BUG #15 — Verrouillage automatique irreversible (P0)
- **Cause** : `verrouillageAutomatique` par defaut a `true`, chaine VALIDE->VERROUILLE->ARCHIVE
- **Fix** : Default change a `false`
- **Fichiers** : validation.service.js **ZONE ROUGE**
- **Endpoint** : `POST /api/validation/:id/valider`
- **Preuve API** : Validation ne retourne plus VERROUILLE automatiquement

### BUG #16 — ADMIN acces CRV (P1)
- **Cause** : Pas de restriction ADMIN sur les routes CRV
- **Fix** : Middleware `excludeAdmin` bloque acces operationnel (doctrine MADMIT)
- **Fichiers** : auth.middleware.js, crv.routes.js
- **Endpoints** : `GET /api/crv`, `GET /api/crv/:id`, `GET /api/crv/search`, `GET /api/crv/stats`, `GET /api/crv/export`, `GET /api/crv/vols-sans-crv`
- **Preuve API** : Admin GET /crv retourne 403 `ADMIN_NO_CRV_ACCESS`

---

## BUGS NON TRAITES (justification)

### BUG #1, #2, #4 — Bugs Frontend
- **#1** : Mapping compagnie incorrect dans formulaire
- **#2** : Type CRV non affiche correctement
- **#4** : Erreur affichage données vol
- **Raison** : Perimetre frontend, branche separee requise

### BUG #7 — NON_REALISEE vs NON_REALISE
- **Reclasse** : Le backend utilise systematiquement `NON_REALISE` (sans E final)
- **Cause reelle** : Le frontend envoie `NON_REALISEE` — correction frontend

### BUG #10 — Heures ignorees sans statut
- **Reclasse** : Les heures sont bien persistees dans le `updates` object
- **Comportement nominal** : Le backend accepte des heures sans changement de statut

### BUG #14 — EN_ATTENTE_CORRECTION
- **Reclasse** : Comportement voulu par la validation — un CRV avec anomalies non resolues passe en EN_ATTENTE_CORRECTION, pas en VALIDE
- **Amelioration UX** : Pourrait etre plus explicite cote frontend

---

## RESULTATS TESTS

```
Tests executes : 48
Passes : 47 (98%)
Echoues : 1
```

**Seul echec** : E2E Terminer — le CRV legacy (mode `type`) ne genere pas de phases automatiquement, donc completude insuffisante. Ce n'est PAS un bug des corrections.

### Tests par bug
| Bug | Tests | Resultat |
|-----|-------|----------|
| #5 Personnel mapping | 3 | 3/3 PASS |
| #6 Coherence heures | 4 | 4/4 PASS |
| #8 Transitions phases | 5 | 5/5 PASS |
| #9 Statut invalide | 2 | 2/2 PASS |
| #11 Doublons charges | 3 | 3/3 PASS |
| #12 Limites charges | 3 | 3/3 PASS |
| #13 XSS protection | 4 | 4/4 PASS |
| #15 Verrouillage auto | 2 | 2/2 PASS |
| #16 Admin acces | 4 | 4/4 PASS |
| Immutabilite | 2 | 2/2 PASS |
| Auth 401 | 2 | 2/2 PASS |
| E2E workflow | 9 | 8/9 PASS |

---

## ZONES ROUGES TOUCHEES

### 1. `validation.service.js`
- **Modification** : 1 ligne (defaut `verrouillageAutomatique`)
- **Impact** : Comportement validation — le CRV reste VALIDE au lieu de VERROUILLE+ARCHIVE
- **Rollback** : `git checkout mission/backend-certification -- src/services/validation/validation.service.js`

### 2. `businessRules.middleware.js`
- **Modification** : ~40 lignes (verification doublons + limites)
- **Impact** : Nouvelles validations sur charges — les appels existants valides ne sont PAS affectes
- **Rollback** : `git checkout mission/backend-certification -- src/middlewares/businessRules.middleware.js`

---

## ROLLBACK

```bash
# Rollback complet
git checkout mission/backend-certification

# Rollback par fichier
git checkout mission/backend-certification -- src/middlewares/businessRules.middleware.js
git checkout mission/backend-certification -- src/services/validation/validation.service.js
```

---

## RECOMMANDATIONS POST-MERGE

1. **Frontend** : Corriger bugs #1, #2, #4 sur branche separee
2. **Frontend** : Mapper `NON_REALISEE -> NON_REALISE` pour bug #7
3. **Phases** : Verifier que le mode legacy genere des phases (ou documenter cette limitation)
4. **Tests** : Integrer `tests/fix-validation-tests.mjs` dans CI pipeline
5. **Monitoring** : Surveiller les 409 CHARGE_DOUBLON et 400 VALEUR_CHARGE_EXCESSIVE en production
