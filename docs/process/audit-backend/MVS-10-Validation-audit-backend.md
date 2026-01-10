# MVS-10-Validation - AUDIT DE CONFORMITE BACKEND

## MVS : MVS-10-Validation
## Date d'audit : 2026-01-10
## Source de reference : docs/process/MVS-10-Validation/

---

## 1. MODELES (models/)

### 1.1 ValidationCRV.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/validation/ValidationCRV.js | Present | ✅ |

#### Champs Principaux

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| crv (ObjectId ref CRV, required, unique) | crv (ObjectId ref CRV, required, unique) | ✅ Conforme |
| validePar (ObjectId ref User, required) | validePar (ObjectId ref Personne, required) | ⚠️ Ref differente |
| dateValidation (Date, default now) | dateValidation (Date, default now) | ✅ Conforme |
| statut (String enum, default EN_ATTENTE) | statut (String enum, required) | ⚠️ Required au lieu de default |
| commentaires (String, maxlength 2000) | commentaires (String) | ⚠️ maxlength absent |
| scoreCompletude (Number, 0-100, default 0) | scoreCompletude (Number, 0-100) | ⚠️ default absent |
| conformiteSLA (Boolean, default true) | conformiteSLA (Boolean, default false) | ⚠️ default different |
| ecartsSLA ([Object]) | ecartsSLA ([Object]) | ⚠️ Structure differente |
| verrouille (Boolean, default false) | verrouille (Boolean, default false) | ✅ Conforme |
| dateVerrouillage (Date) | dateVerrouillage (Date) | ✅ Conforme |
| verrouillePar (ObjectId ref User) | - | ❌ Absent |
| historique ([Object]) | - | ❌ Absent |

#### Champs NON documentes presents dans le code

| Champ | Type | Description |
|-------|------|-------------|
| anomaliesDetectees | [String] | Liste des anomalies detectees |

#### Enum statut

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| EN_ATTENTE, VALIDE, REJETE, VERROUILLE | VALIDE, INVALIDE, EN_ATTENTE_CORRECTION | ⚠️ Valeurs differentes |

#### Sous-schema ecartsSLA

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| phase (ObjectId ref Phase) | phase (ObjectId ref Phase) | ✅ Conforme |
| ecartMinutes (Number) | ecartMinutes (Number) | ✅ Conforme |
| typeEcart (String enum) | description (String) | ⚠️ Champ different |

#### Sous-schema historique

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| action (String enum) | - | ❌ Absent |
| date (Date) | - | ❌ Absent |
| utilisateur (ObjectId) | - | ❌ Absent |
| commentaire (String) | - | ❌ Absent |

#### Index

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| crv (unique) | crv unique via schema | ✅ Conforme |
| - | validePar: 1 | Non documente |
| - | statut: 1 | Non documente |

**Resultat ValidationCRV.js** : ⚠️ DIVERGENCES MAJEURES

---

## 2. SERVICES (services/)

### Documentation

La documentation indique : "Pas de couche service dediee identifiee pour le MVS-10-Validation"

### Verification

| Chemin | Recherche | Resultat |
|--------|-----------|----------|
| src/services/validation/validation.service.js | Fichier | ✅ PRESENT |

**Resultat** : ⚠️ DIVERGENCE - Service existe mais non documente

### Fonctions dans validation.service.js (NON documentees)

| Fonction | Description |
|----------|-------------|
| validerCRV | Valide un CRV avec calcul completude et SLA |
| verrouillerCRV | Verrouille un CRV valide |
| deverrouillerCRV | Deverrouille un CRV |

### Logique metier dans le service

| Element | Description |
|---------|-------------|
| Precondition validation | CRV en statut TERMINE ou VALIDE |
| Calcul completude | Via import depuis crv.service.js |
| Verification SLA | Via import depuis crv.service.js |
| Seuil completude | 80% minimum |
| Anomalies detectees | Completude < 80%, responsable absent, phases non traitees |
| Verrouillage automatique | Parametre configurable (default true) |

---

## 3. CONTROLLERS (controllers/)

### 3.1 validation.controller.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/validation/validation.controller.js | Present | ✅ |

#### Handlers

| Handler Doc | Handler Code | Conformite |
|-------------|--------------|------------|
| obtenirValidationCRV | obtenirValidation | ⚠️ Nom different |
| validerCRVController | validerCRVController | ✅ Conforme |
| rejeterCRVController | - | ❌ Absent |
| verrouilleCRVController | verrouillerCRVController | ⚠️ Nom different |
| deverrouillerCRVController | deverrouillerCRVController | ✅ Conforme |

#### Fonctions internes documentees

| Fonction | Doc | Code | Conformite |
|----------|-----|------|------------|
| calculerScoreCompletude | Dans controller | Dans crv.service.js | ⚠️ Emplacement different |
| verifierConformiteSLA | Dans controller | Dans crv.service.js | ⚠️ Emplacement different |

#### Implementation controller

| Aspect | Documentation | Code reel | Conformite |
|--------|---------------|-----------|------------|
| Logique metier | Dans controller | Deleguee au service | ⚠️ Architecture differente |
| Notification email | Non documentee | Present (notifierValidationCRV) | Non documente |

**Resultat validation.controller.js** : ⚠️ DIVERGENCES

---

## 4. ROUTES (routes/)

### 4.1 validation.routes.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/validation/validation.routes.js | Present | ✅ |
| Base path | /api/validation | Present | ✅ |

#### Routes

| Route Doc | Route Code | Conformite |
|-----------|------------|------------|
| GET /:id | router.get L18 | ✅ Conforme |
| POST /:id/valider | router.post L26-31 | ✅ Conforme |
| POST /:id/rejeter | - | ❌ Absent |
| POST /:id/verrouiller | router.post L39-44 | ✅ Conforme |
| POST /:id/deverrouiller | router.post L52-57 | ✅ Conforme |

#### Middlewares et Controle d'acces

| Route | Doc | Code | Conformite |
|-------|-----|------|------------|
| GET /:id | protect | protect | ✅ Conforme |
| POST valider | authorize(QUALITE, ADMIN) | excludeQualite | ⚠️ Approche differente |
| POST verrouiller | authorize(QUALITE, ADMIN) | excludeQualite | ⚠️ Approche differente |
| POST deverrouiller | authorize(ADMIN) | excludeQualite | ⚠️ ADMIN only absent |

#### Middleware auditLog

| Route | Documentation | Code reel | Conformite |
|-------|---------------|-----------|------------|
| POST valider | Non documente | auditLog('VALIDATION') | Non documente |
| POST verrouiller | Non documente | auditLog('VALIDATION') | Non documente |
| POST deverrouiller | Non documente | auditLog('MISE_A_JOUR') | Non documente |

**Resultat validation.routes.js** : ⚠️ DIVERGENCES

---

## 5. SYNTHESE MVS-10-Validation

### Statut global : ⚠️ PARTIEL - DIVERGENCES MAJEURES

### Resume

| Composant | Statut |
|-----------|--------|
| ValidationCRV.js | ⚠️ Schema different |
| validation.service.js | ⚠️ Existe mais non documente |
| validation.controller.js | ⚠️ Handlers manquants/differents |
| validation.routes.js | ⚠️ Routes manquantes, middlewares differents |

### Liste des ecarts majeurs

#### Modele ValidationCRV.js
1. `validePar` reference Personne au lieu de User
2. Enum `statut` completement different (EN_ATTENTE/REJETE/VERROUILLE vs INVALIDE/EN_ATTENTE_CORRECTION)
3. `conformiteSLA` default false dans code vs true dans doc
4. Champ `verrouillePar` documente mais ABSENT du code
5. Sous-schema `historique` documente mais ABSENT du code
6. Champ `anomaliesDetectees` present dans code mais non documente
7. Sous-schema `ecartsSLA` : `typeEcart` documente mais code utilise `description`

#### Services
1. Documentation indique absence de service
2. Code contient `validation.service.js` avec 3 fonctions majeures
3. Logique metier dans service, pas dans controller comme documente
4. Fonctions `calculerScoreCompletude` et `verifierConformiteSLA` dans crv.service.js

#### Controllers
1. Handler `rejeterCRVController` documente mais ABSENT du code
2. Noms differents : `obtenirValidationCRV` vs `obtenirValidation`
3. Noms differents : `verrouilleCRVController` vs `verrouillerCRVController`
4. Architecture differente : logique deleguee au service

#### Routes
1. Route `POST /:id/rejeter` documentee mais ABSENTE
2. Middlewares RBAC differents : doc utilise `authorize(QUALITE, ADMIN)`, code utilise `excludeQualite`
3. Route deverrouiller : doc = ADMIN only, code = excludeQualite (tous sauf QUALITE)
4. Middleware `auditLog` present mais non documente

---

**Fin de l'audit MVS-10-Validation**
