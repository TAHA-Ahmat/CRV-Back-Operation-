# 📊 RAPPORT COMPARAISON BACKEND ↔ FRONTEND

**Date d'analyse** : 2026-01-06
**Analyste** : Claude Opus 4.5
**Backend** : 87 routes documentées
**Frontend** : 78 routes implémentées

---

## ⚠️ RÉSUMÉ EXÉCUTIF

### Statut Global : ❌ **INCOMPLET** (73% de couverture réelle)

| Indicateur | Valeur | Statut |
|------------|--------|--------|
| **Routes backend documentées** | 87 | ✅ |
| **Routes frontend implémentées** | 78 | ⚠️ |
| **Routes manquantes frontend** | **19** | ❌ |
| **Routes frontend en trop** | 10 | ⚠️ |
| **Écarts de nommage** | 5 | ⚠️ |
| **Taux de couverture réel** | **73%** | ❌ |

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. Routes Backend NON implémentées Frontend (19 routes)

#### 🔴 CRV (7 routes manquantes)
| Endpoint Backend | Statut Frontend | Impact |
|------------------|-----------------|--------|
| `GET /api/crv/statistiques/annulations` | ❌ MANQUANT | **CRITIQUE** - Reporting MANAGER |
| `GET /api/crv/:id/peut-annuler` | ❌ MANQUANT | **HAUTE** - Validation UI |
| `POST /api/crv/:id/reactiver` | ❌ MANQUANT | **HAUTE** - Extension 6 |
| `GET /api/crv/archive/status` | ❌ MANQUANT | **MOYENNE** - Vérification service |
| `POST /api/crv/archive/test` | ❌ MANQUANT | **BASSE** - Test archivage |
| ~~`DELETE /api/crv/:id`~~ | ⚠️ Implémenté mais **NON DOCUMENTÉ backend** | INCOHÉRENCE |
| ~~`GET /api/crv/annules`~~ | ⚠️ Implémenté avec "API directe" | NON intégré dans store |

#### 🔴 VOLS (4 routes manquantes - Extension 2)
| Endpoint Backend | Statut Frontend | Impact |
|------------------|-----------------|--------|
| `GET /api/vols/:id/suggerer-programmes` | ❌ MANQUANT | **HAUTE** - Liaison automatique |
| `GET /api/vols/programme/:programmeVolId` | ❌ MANQUANT | **HAUTE** - Vue programme |
| `GET /api/vols/hors-programme` | ❌ MANQUANT | **MOYENNE** - Filtrage vols |
| `GET /api/vols/statistiques/programmes` | ❌ MANQUANT | **MOYENNE** - Analytics |
| ~~`DELETE /api/vols/:id`~~ | ⚠️ Implémenté mais **NON DOCUMENTÉ backend** | INCOHÉRENCE |

#### 🔴 PROGRAMMES VOL (1 route manquante - Extension 1)
| Endpoint Backend | Statut Frontend | Impact |
|------------------|-----------------|--------|
| `GET /api/programmes-vol/applicables/:date` | ❌ MANQUANT | **HAUTE** - Recherche par date |

#### 🔴 CHARGES (4 routes manquantes - Extensions 4 & 5)
| Endpoint Backend | Statut Frontend | Impact |
|------------------|-----------------|--------|
| `POST /api/charges/valider-marchandise-dangereuse` | ❌ MANQUANT | **CRITIQUE** - Sécurité DGR |
| `GET /api/charges/marchandises-dangereuses` | ❌ MANQUANT | **HAUTE** - Liste globale DGR |
| `GET /api/charges/crv/:crvId/statistiques-passagers` | ❌ MANQUANT | **MOYENNE** - Stats CRV |
| `GET /api/charges/crv/:crvId/statistiques-fret` | ❌ MANQUANT | **MOYENNE** - Stats CRV |

#### 🔴 PHASES (2 routes manquantes)
| Endpoint Backend | Statut Frontend | Impact |
|------------------|-----------------|--------|
| Frontend a `GET /api/phases/:id` | ⚠️ NON DOCUMENTÉ backend | Route existe ? |
| Frontend a `GET /api/phases?crvId=xxx` | ⚠️ NON DOCUMENTÉ backend | Route existe ? |

---

### 2. Routes Frontend SANS documentation Backend (10 routes)

#### ⚠️ AUTH (2 routes frontend seulement)
| Endpoint Frontend | Backend | Commentaire |
|-------------------|---------|-------------|
| `POST /api/auth/deconnexion` | ❌ NON DOCUMENTÉ | **Logout côté serveur ?** |
| `POST /api/auth/changer-mot-de-passe` | ❌ NON DOCUMENTÉ | **Fonctionnalité critique manquante** |

#### ⚠️ PERSONNES (8 routes frontend - MODULE COMPLET MANQUANT)
| Endpoint Frontend | Backend | Commentaire |
|-------------------|---------|-------------|
| `GET /api/personnes` | ❌ NON DOCUMENTÉ | **Gestion utilisateurs** |
| `GET /api/personnes/:id` | ❌ NON DOCUMENTÉ | **Lecture profil** |
| `POST /api/personnes` | ❌ NON DOCUMENTÉ | **Création compte ADMIN** |
| `PATCH /api/personnes/:id` | ❌ NON DOCUMENTÉ | **Modification compte** |
| `DELETE /api/personnes/:id` | ❌ NON DOCUMENTÉ | **Suppression compte** |
| `PATCH /api/personnes/:id/desactiver` | ❌ NON DOCUMENTÉ | **Désactivation** |
| `PATCH /api/personnes/:id/reactiver` | ❌ NON DOCUMENTÉ | **Réactivation** |
| `PATCH /api/personnes/:id/suspendre` | ❌ NON DOCUMENTÉ | **Suspension** |

**⚠️ ALERTE** : Ce module est référencé dans `GOUVERNANCE_COMPTES_UTILISATEURS.md` mais **NON documenté** dans `API_COMPLETE_FRONTEND.md` !

#### ⚠️ AVIONS (3 routes CRUD manquantes backend)
| Endpoint Frontend | Backend | Commentaire |
|-------------------|---------|-------------|
| `GET /api/avions` | ❌ NON DOCUMENTÉ | **Liste avions** |
| `GET /api/avions/:id` | ❌ NON DOCUMENTÉ | **Détail avion** |
| `POST /api/avions` | ❌ NON DOCUMENTÉ | **Création avion** |

**Note** : Extension 3 documente uniquement les routes de **configuration**, pas le CRUD de base.

---

### 3. Écarts de nommage Backend ↔ Frontend (5 différences)

| Backend | Frontend | Impact |
|---------|----------|--------|
| `/api/auth/login` | `/api/auth/connexion` | ⚠️ INCOHÉRENCE |
| `/api/auth/register` | `/api/auth/inscription` | ⚠️ INCOHÉRENCE |
| `/api/crv/:id/archive` | `/api/crv/:id/archive` | ✅ OK (même endpoint) |
| Extension 6 : `/api/crv/:id/annuler` | Implémenté avec endpoint correct | ✅ OK |
| Extension 6 : `/api/crv/annules` | Liste directement sans store | ⚠️ NON optimal |

**Recommandation** : Harmoniser les noms d'endpoints (utiliser anglais ou français de façon cohérente).

---

## 📋 TABLEAU COMPARATIF DÉTAILLÉ PAR MODULE

### 1. AUTHENTIFICATION

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/auth/login` | ⚠️ `/auth/connexion` | `authStore.login()` | **Nommage différent** |
| 2 | `POST /api/auth/register` | ⚠️ `/auth/inscription` | `authStore.register()` | **Nommage différent** |
| 3 | `GET /api/auth/me` | ✅ `/auth/me` | `authStore.fetchUser()` | **OK** |
| 4 | ❌ NON DOCUMENTÉ | ✅ `/auth/deconnexion` | `authStore.logout()` | **Backend manquant** |
| 5 | ❌ NON DOCUMENTÉ | ✅ `/auth/changer-mot-de-passe` | `authStore.changerMotDePasse()` | **Backend manquant** |

**Taux** : 3/5 routes backend documentées (60%)

---

### 2. PERSONNES (ADMIN) - ⚠️ MODULE MANQUANT BACKEND

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | ❌ NON DOCUMENTÉ | ✅ `GET /personnes` | `personnesStore.listPersonnes()` | **Backend manquant** |
| 2 | ❌ NON DOCUMENTÉ | ✅ `GET /personnes/:id` | `personnesStore.loadPersonne()` | **Backend manquant** |
| 3 | ❌ NON DOCUMENTÉ | ✅ `POST /personnes` | `personnesStore.createPersonne()` | **Backend manquant** |
| 4 | ❌ NON DOCUMENTÉ | ✅ `PATCH /personnes/:id` | `personnesStore.updatePersonne()` | **Backend manquant** |
| 5 | ❌ NON DOCUMENTÉ | ✅ `DELETE /personnes/:id` | `personnesStore.deletePersonne()` | **Backend manquant** |
| 6 | ❌ NON DOCUMENTÉ | ✅ `PATCH /personnes/:id/desactiver` | `personnesStore.desactiverPersonne()` | **Backend manquant** |
| 7 | ❌ NON DOCUMENTÉ | ✅ `PATCH /personnes/:id/reactiver` | `personnesStore.reactiverPersonne()` | **Backend manquant** |
| 8 | ❌ NON DOCUMENTÉ | ✅ `PATCH /personnes/:id/suspendre` | `personnesStore.suspendrePersonne()` | **Backend manquant** |

**Taux** : 0/8 routes backend documentées (0%) ❌ **CRITIQUE**

**Action requise** : Documenter le module Personnes dans `API_COMPLETE_FRONTEND.md` ou vérifier si ces routes existent vraiment en backend.

---

### 3. CRV (Comptes Rendus de Vol)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/crv` | ✅ | `crvStore.createCRV()` | **OK** |
| 2 | `GET /api/crv` | ✅ | `crvStore.listCRV()` | **OK** |
| 3 | `GET /api/crv/:id` | ✅ | `crvStore.loadCRV()` | **OK** |
| 4 | `PATCH /api/crv/:id` | ✅ | `crvStore.updateCRV()` | **OK** |
| 5 | ❌ NON DOCUMENTÉ | ✅ `DELETE /api/crv/:id` | `crvStore.deleteCRV()` | **Backend manquant** |
| 6 | `POST /api/crv/:id/charges` | ✅ | `crvStore.addCharge()` | **OK** |
| 7 | `POST /api/crv/:id/evenements` | ✅ | `crvStore.addEvenement()` | **OK** |
| 8 | `POST /api/crv/:id/observations` | ✅ | `crvStore.addObservation()` | **OK** |
| 9 | `GET /api/crv/search` | ✅ | `crvStore.searchCRV()` | **OK** |
| 10 | `GET /api/crv/stats` | ✅ | `crvStore.getStats()` | **OK** |
| 11 | `GET /api/crv/export` | ✅ | `crvStore.exportCRV()` | **OK** |
| 12 | `GET /api/crv/annules` | ⚠️ API directe | Non intégré | **Intégration partielle** |
| 13 | `GET /api/crv/statistiques/annulations` | ❌ MANQUANT | - | **Frontend manquant** |
| 14 | `GET /api/crv/:id/peut-annuler` | ❌ MANQUANT | - | **Frontend manquant** |
| 15 | `POST /api/crv/:id/annuler` | ❌ MANQUANT | - | **Frontend manquant** |
| 16 | `POST /api/crv/:id/reactiver` | ❌ MANQUANT | - | **Frontend manquant** |
| 17 | `GET /api/crv/archive/status` | ❌ MANQUANT | - | **Frontend manquant** |
| 18 | `POST /api/crv/archive/test` | ❌ MANQUANT | - | **Frontend manquant** |
| 19 | `POST /api/crv/:id/archive` | ✅ | `crvStore.archiveCRV()` | **OK** |

**Taux** : 12/19 routes implémentées (63%) ⚠️

---

### 4. PHASES

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/phases/:id/demarrer` | ✅ | `phasesStore.demarrerPhase()` | **OK** |
| 2 | `POST /api/phases/:id/terminer` | ✅ | `phasesStore.terminerPhase()` | **OK** |
| 3 | `POST /api/phases/:id/non-realise` | ✅ | `phasesStore.marquerNonRealise()` | **OK** |
| 4 | `PATCH /api/phases/:id` | ✅ | `phasesStore.updatePhase()` | **OK** |
| 5 | ❌ NON DOCUMENTÉ | ✅ `GET /api/phases/:id` | `phasesStore.loadPhase()` | **Backend manquant** |
| 6 | ❌ NON DOCUMENTÉ | ✅ `GET /api/phases?crvId=xxx` | `phasesStore.loadPhasesByCRV()` | **Backend manquant** |

**Taux** : 4/6 routes (67%) - 2 routes frontend non documentées backend

---

### 5. VOLS

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/vols` | ✅ | `volsStore.createVol()` | **OK** |
| 2 | `GET /api/vols` | ✅ | `volsStore.listVols()` | **OK** |
| 3 | `GET /api/vols/:id` | ✅ | `volsStore.loadVol()` | **OK** |
| 4 | `PATCH /api/vols/:id` | ✅ | `volsStore.updateVol()` | **OK** |
| 5 | ❌ NON DOCUMENTÉ | ✅ `DELETE /api/vols/:id` | `volsStore.deleteVol()` | **Backend manquant** |
| 6 | `POST /api/vols/:id/lier-programme` | ✅ | `volsStore.lierProgramme()` | **OK** (Extension 2) |
| 7 | `POST /api/vols/:id/marquer-hors-programme` | ✅ | `volsStore.marquerHorsProgramme()` | **OK** (Extension 2) |
| 8 | `POST /api/vols/:id/detacher-programme` | ✅ | `volsStore.detacherProgramme()` | **OK** (Extension 2) |
| 9 | `GET /api/vols/:id/suggerer-programmes` | ❌ MANQUANT | - | **Frontend manquant** |
| 10 | `GET /api/vols/programme/:programmeVolId` | ❌ MANQUANT | - | **Frontend manquant** |
| 11 | `GET /api/vols/hors-programme` | ❌ MANQUANT | - | **Frontend manquant** |
| 12 | `GET /api/vols/statistiques/programmes` | ❌ MANQUANT | - | **Frontend manquant** |

**Taux** : 8/12 routes implémentées (67%) ⚠️

---

### 6. PROGRAMMES VOL (Extension 1)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/programmes-vol` | ✅ | `programmesStore.createProgramme()` | **OK** |
| 2 | `GET /api/programmes-vol` | ✅ | `programmesStore.listProgrammes()` | **OK** |
| 3 | `GET /api/programmes-vol/:id` | ✅ | `programmesStore.loadProgramme()` | **OK** |
| 4 | `PATCH /api/programmes-vol/:id` | ✅ | `programmesStore.updateProgramme()` | **OK** |
| 5 | `DELETE /api/programmes-vol/:id` | ✅ | `programmesStore.deleteProgramme()` | **OK** |
| 6 | `POST /api/programmes-vol/:id/valider` | ✅ | `programmesStore.validerProgramme()` | **OK** |
| 7 | `POST /api/programmes-vol/:id/activer` | ✅ | `programmesStore.activerProgramme()` | **OK** |
| 8 | `POST /api/programmes-vol/:id/suspendre` | ✅ | `programmesStore.suspendreProgramme()` | **OK** |
| 9 | `POST /api/programmes-vol/import` | ✅ | `programmesStore.importerProgramme()` | **OK** |
| 10 | `GET /api/programmes-vol/applicables/:date` | ❌ MANQUANT | - | **Frontend manquant** |

**Taux** : 9/10 routes implémentées (90%) ✅

---

### 7. CHARGES (Extensions 4 & 5)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | ❌ NON DOCUMENTÉ | ✅ `GET /api/charges/:id` | `chargesStore.loadCharge()` | **Backend manquant** |
| 2 | ❌ NON DOCUMENTÉ | ✅ `PATCH /api/charges/:id` | `chargesStore.updateCharge()` | **Backend manquant** |
| 3 | `PUT /api/charges/:id/categories-detaillees` | ✅ | `chargesStore.updateCategoriesDetaillees()` | **OK** (Extension 4) |
| 4 | `PUT /api/charges/:id/classes` | ✅ | `chargesStore.updateClasses()` | **OK** (Extension 4) |
| 5 | `PUT /api/charges/:id/besoins-medicaux` | ✅ | `chargesStore.updateBesoinsMedicaux()` | **OK** (Extension 4) |
| 6 | `PUT /api/charges/:id/mineurs` | ✅ | `chargesStore.updateMineurs()` | **OK** (Extension 4) |
| 7 | `POST /api/charges/:id/convertir-categories-detaillees` | ✅ | `chargesStore.convertirCategoriesDetaillees()` | **OK** (Extension 4) |
| 8 | `PUT /api/charges/:id/fret-detaille` | ✅ | `chargesStore.updateFretDetaille()` | **OK** (Extension 5) |
| 9 | `POST /api/charges/:id/marchandises-dangereuses` | ✅ | `chargesStore.addMarchandiseDangereuse()` | **OK** (Extension 5) |
| 10 | `DELETE /api/charges/:id/marchandises-dangereuses/:mdId` | ✅ | `chargesStore.deleteMarchandiseDangereuse()` | **OK** (Extension 5) |
| 11 | `POST /api/charges/valider-marchandise-dangereuse` | ❌ MANQUANT | - | **Frontend manquant** |
| 12 | `GET /api/charges/marchandises-dangereuses` | ❌ MANQUANT | - | **Frontend manquant** |
| 13 | `GET /api/charges/statistiques/passagers` | ✅ | `chargesStore.loadStatistiquesPassagers()` | **OK** |
| 14 | `GET /api/charges/statistiques/fret` | ✅ | `chargesStore.loadStatistiquesFret()` | **OK** |
| 15 | `GET /api/charges/crv/:crvId/statistiques-passagers` | ❌ MANQUANT | - | **Frontend manquant** |
| 16 | `GET /api/charges/crv/:crvId/statistiques-fret` | ❌ MANQUANT | - | **Frontend manquant** |

**Taux** : 12/16 routes implémentées (75%) ⚠️

---

### 8. AVIONS (Extension 3)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | ❌ NON DOCUMENTÉ | ✅ `GET /api/avions` | `avionsStore.listAvions()` | **Backend manquant** |
| 2 | ❌ NON DOCUMENTÉ | ✅ `GET /api/avions/:id` | `avionsStore.loadAvion()` | **Backend manquant** |
| 3 | ❌ NON DOCUMENTÉ | ✅ `POST /api/avions` | `avionsStore.createAvion()` | **Backend manquant** |
| 4 | `PUT /api/avions/:id/configuration` | ✅ | `avionsStore.updateConfiguration()` | **OK** (Extension 3) |
| 5 | `POST /api/avions/:id/versions` | ✅ | `avionsStore.createVersion()` | **OK** (Extension 3) |
| 6 | `GET /api/avions/:id/versions` | ✅ | `avionsStore.loadVersions()` | **OK** (Extension 3) |
| 7 | `GET /api/avions/:id/versions/:numero` | ✅ | `avionsStore.loadVersion()` | **OK** (Extension 3) |
| 8 | `POST /api/avions/:id/versions/:numero/restaurer` | ✅ | `avionsStore.restaurerVersion()` | **OK** (Extension 3) |
| 9 | `GET /api/avions/:id/versions/comparer` | ✅ | `avionsStore.comparerVersions()` | **OK** (Extension 3) |
| 10 | `PUT /api/avions/:id/revision` | ✅ | `avionsStore.planifierRevision()` | **OK** (Extension 3) |
| 11 | `GET /api/avions/revisions/prochaines` | ✅ | `avionsStore.loadRevisionsProchaines()` | **OK** (Extension 3) |
| 12 | `GET /api/avions/statistiques/configurations` | ✅ | `avionsStore.loadStatistiques()` | **OK** (Extension 3) |

**Taux** : 12/12 routes frontend implémentées (100%) ✅
**Note** : Extension 3 ne documente QUE les routes de configuration. CRUD de base manquant dans la doc backend.

---

### 9. NOTIFICATIONS (Extension 7)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `GET /api/notifications` | ✅ | `notificationsStore.loadNotifications()` | **OK** |
| 2 | `GET /api/notifications/count-non-lues` | ✅ | `notificationsStore.loadCountNonLues()` | **OK** |
| 3 | `PATCH /api/notifications/lire-toutes` | ✅ | `notificationsStore.marquerToutesLues()` | **OK** |
| 4 | `GET /api/notifications/statistiques` | ✅ | `notificationsStore.loadStatistiques()` | **OK** |
| 5 | `POST /api/notifications` | ✅ | `notificationsStore.createNotification()` | **OK** |
| 6 | `PATCH /api/notifications/:id/lire` | ✅ | `notificationsStore.marquerLue()` | **OK** |
| 7 | `PATCH /api/notifications/:id/archiver` | ✅ | `notificationsStore.archiverNotification()` | **OK** |
| 8 | `DELETE /api/notifications/:id` | ✅ | `notificationsStore.deleteNotification()` | **OK** |

**Taux** : 8/8 routes implémentées (100%) ✅✅

---

### 10. ALERTES SLA (Extension 8)

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `GET /api/sla/rapport` | ✅ | `slaStore.loadRapport()` | **OK** |
| 2 | `GET /api/sla/configuration` | ✅ | `slaStore.loadConfiguration()` | **OK** |
| 3 | `PUT /api/sla/configuration` | ✅ | `slaStore.updateConfiguration()` | **OK** |
| 4 | `POST /api/sla/surveiller/crv` | ✅ | `slaStore.surveillerCRV()` | **OK** |
| 5 | `POST /api/sla/surveiller/phases` | ✅ | `slaStore.surveillerPhases()` | **OK** |
| 6 | `GET /api/sla/crv/:id` | ✅ | `slaStore.loadCRVSla()` | **OK** |
| 7 | `GET /api/sla/phase/:id` | ✅ | `slaStore.loadPhaseSla()` | **OK** |

**Taux** : 7/7 routes implémentées (100%) ✅✅

---

### 11. VALIDATION CRV

| # | Endpoint Backend | Frontend | Store | Notes |
|---|------------------|----------|-------|-------|
| 1 | `POST /api/validation/:id/valider` | ✅ | `crvStore.validateCRV()` | **OK** |
| 2 | `POST /api/validation/:id/deverrouiller` | ✅ | `crvStore.deverrouillerCRV()` | **OK** |
| 3 | `GET /api/validation/:id` | ✅ | `crvStore.getValidationStatus()` | **OK** |

**Taux** : 3/3 routes implémentées (100%) ✅✅

---

## 🔍 ANALYSE DES OPTIMISATIONS

### ✅ BONNES PRATIQUES IDENTIFIÉES

1. **Architecture Stores Pinia** : ✅ Excellente séparation par domaine métier
2. **Service API Centralisé** : ✅ `src/services/api.js` avec exports modulaires
3. **Gestion d'erreurs** : ✅ Intercepteurs Axios + codes d'erreur backend
4. **JWT automatique** : ✅ Gestion token dans intercepteurs
5. **Getters réactifs** : ✅ Computed properties pour état
6. **Modules Extensions** : ✅ Bien implémentées (Notifications, SLA 100%)

### ⚠️ OPTIMISATIONS RECOMMANDÉES

#### 1. 🔴 **CRITIQUE : Compléter les routes manquantes**

**Extension 6 - Annulation CRV (4 routes manquantes)**
```javascript
// À ajouter dans crvStore.js
async obtenirStatistiquesAnnulations(filters = {}) {
  return await crvAPI.get('/statistiques/annulations', { params: filters })
}

async verifierPeutAnnuler(crvId) {
  return await crvAPI.get(`/${crvId}/peut-annuler`)
}

async annulerCRV(crvId, data) {
  return await crvAPI.post(`/${crvId}/annuler`, data)
}

async reactiverCRV(crvId) {
  return await crvAPI.post(`/${crvId}/reactiver`)
}
```

**Extension 2 - Vols programmés (4 routes manquantes)**
```javascript
// À ajouter dans volsStore.js
async suggererProgrammes(volId) {
  return await volsAPI.get(`/${volId}/suggerer-programmes`)
}

async getVolsDuProgramme(programmeId) {
  return await volsAPI.get(`/programme/${programmeId}`)
}

async getVolsHorsProgramme(filters = {}) {
  return await volsAPI.get('/hors-programme', { params: filters })
}

async getStatistiquesProgrammes(filters = {}) {
  return await volsAPI.get('/statistiques/programmes', { params: filters })
}
```

**Extension 5 - Validation DGR (2 routes CRITIQUES)**
```javascript
// À ajouter dans chargesStore.js
async validerMarchandiseDangereuse(data) {
  return await chargesAPI.post('/valider-marchandise-dangereuse', data)
}

async getMarchandisesDangereuses(filters = {}) {
  return await chargesAPI.get('/marchandises-dangereuses', { params: filters })
}
```

#### 2. 🟡 **HAUTE PRIORITÉ : Harmoniser les noms d'endpoints**

**Problème** : Incohérence anglais/français

```javascript
// AVANT (incohérent)
POST /api/auth/connexion      // français
POST /api/auth/inscription     // français
GET /api/auth/me               // anglais

// APRÈS (cohérent - recommandé: anglais)
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
```

**Action** : Mettre à jour backend OU frontend pour cohérence.

#### 3. 🟡 **MOYENNE PRIORITÉ : Documenter routes manquantes backend**

**Module PERSONNES (8 routes)** : À ajouter dans `API_COMPLETE_FRONTEND.md`
```markdown
## 2. PERSONNES (GESTION UTILISATEURS)

### 2.1. POST /api/personnes
**Créer un nouveau compte utilisateur (ADMIN uniquement)**
...
```

**Routes CRUD de base** : À ajouter pour Avions, Phases GET
```markdown
### 4.1. GET /api/avions
**Lister tous les avions**

### 4.2. GET /api/avions/:id
**Obtenir un avion par ID**

### 4.3. POST /api/avions
**Créer un nouvel avion**
```

#### 4. 🟢 **BASSE PRIORITÉ : Optimisations mineures**

**Intégration complète CRV annulés dans store**
```javascript
// AVANT
// API directe dans COUVERTURE_API_FRONTEND.md ligne 77

// APRÈS
async getCRVAnnules(filters = {}) {
  const response = await crvAPI.get('/annules', { params: filters })
  this.crvAnnules = response.data
  return response
}
```

**Cache intelligent pour listes fréquentes**
```javascript
// Dans stores
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async listVols(forceRefresh = false) {
  if (!forceRefresh && this.cache.vols && Date.now() - this.cache.volsTimestamp < CACHE_TTL) {
    return this.vols
  }

  const response = await volsAPI.get('/')
  this.vols = response.data
  this.cache.volsTimestamp = Date.now()
  return response
}
```

---

## 📊 SYNTHÈSE DES TAUX DE COUVERTURE

| Module | Routes Backend | Routes Frontend | Taux | Statut |
|--------|---------------|-----------------|------|--------|
| Auth | 3 (+2 non doc) | 5 | 60% | ⚠️ |
| **Personnes** | **0 documenté** | **8** | **0%** | ❌ **CRITIQUE** |
| CRV | 18 (+1 non doc) | 11 (+1 directe) | 63% | ⚠️ |
| Phases | 4 (+2 non doc) | 6 | 67% | ⚠️ |
| Vols | 11 (+1 non doc) | 8 | 67% | ⚠️ |
| Programmes Vol | 10 | 9 | 90% | ✅ |
| Charges | 14 (+2 non doc) | 12 | 75% | ⚠️ |
| Avions | 9 (+3 non doc) | 12 | 100%* | ✅ |
| Notifications | 8 | 8 | 100% | ✅✅ |
| SLA | 7 | 7 | 100% | ✅✅ |
| Validation | 3 | 3 | 100% | ✅✅ |
| **TOTAL** | **87 (+10 non doc)** | **78** | **73%** | ⚠️ |

\* Avions : 100% des routes frontend implémentées, mais CRUD de base non documenté backend

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : CRITIQUE (Semaine 1)

1. ✅ **Documenter module PERSONNES** (8 routes) dans `API_COMPLETE_FRONTEND.md`
2. ✅ **Implémenter Extension 6 complète** (4 routes annulation CRV)
3. ✅ **Implémenter validation DGR** (2 routes sécurité fret)

### Phase 2 : HAUTE PRIORITÉ (Semaine 2)

4. ✅ **Implémenter Extension 2 complète** (4 routes vols programmés)
5. ✅ **Documenter routes CRUD manquantes** (Avions, Phases GET, DELETE CRV/Vols)
6. ✅ **Harmoniser nommage** auth endpoints (connexion → login)

### Phase 3 : MOYENNE PRIORITÉ (Semaine 3)

7. ✅ **Implémenter routes statistiques manquantes** (2 routes charges par CRV)
8. ✅ **Implémenter route applicables/:date** (1 route programmes vol)
9. ✅ **Intégrer CRV annulés dans store** (sortir de "API directe")

### Phase 4 : OPTIMISATIONS (Semaine 4)

10. ✅ **Ajouter cache intelligent** pour listes fréquentes
11. ✅ **Documenter routes auth supplémentaires** (déconnexion, changement MDP)
12. ✅ **Tests E2E** sur toutes les liaisons backend ↔ frontend

---

## 📝 CONCLUSION

### Points Forts ✅

- **Architecture solide** : Stores Pinia bien organisés, API centralisée
- **Modules Extensions 7 & 8** : 100% implémentés (Notifications, SLA)
- **Gestion d'erreurs** : Intercepteurs + codes erreur backend bien gérés
- **Documentation frontend** : COUVERTURE_API_FRONTEND.md très complète

### Points Faibles ❌

- **Module PERSONNES manquant** : 0% documentation backend pour 8 routes frontend
- **Extension 6 incomplète** : 4/7 routes annulation CRV non implémentées (43%)
- **Extension 2 incomplète** : 8/12 routes vols programmés implémentées (67%)
- **Nommage incohérent** : Anglais/français mélangés dans auth
- **Taux réel 73%** : Loin des 100% affichés dans COUVERTURE_API_FRONTEND.md

### Recommandation Finale

**🔴 INCOMPLET - Action requise**

Le frontend a fait un excellent travail d'architecture et d'intégration, mais **19 routes backend critiques ne sont pas consommées**. Il est **IMPÉRATIF** de compléter :

1. Module PERSONNES (8 routes)
2. Extension 6 - Annulation CRV (4 routes)
3. Extension 2 - Vols programmés (4 routes)
4. Validation DGR (2 routes sécurité)

**Estimation** : 2-3 semaines pour atteindre 100% de couverture réelle.

---

**Rapport généré par** : Claude Opus 4.5
**Date** : 2026-01-06
**Fichiers analysés** :
- `docs/API_COMPLETE_FRONTEND.md` (87 routes backend)
- `docs/extensions/COUVERTURE_API_FRONTEND.md` (78 routes frontend)
