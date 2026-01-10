# MVS-8-Referentials - AUDIT DE CONFORMITE BACKEND

## MVS : MVS-8-Referentials
## Date d'audit : 2026-01-10
## Source de reference : docs/process/MVS-8-Referentials/

---

## 1. MODELES (models/)

### 1.1 Avion.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/referentials/Avion.js | Present | ✅ |

#### Champs Principaux

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| immatriculation (String, required, unique, uppercase) | immatriculation (String, required, unique, uppercase, trim) | ✅ Conforme |
| typeAvion (String, required) | typeAvion (String, required, trim) | ✅ Conforme |
| compagnie (String, required) | compagnie (String, required, trim) | ✅ Conforme |
| capaciteMax (Number, required, min 1) | capacitePassagers + capaciteFret | ⚠️ Structure differente |
| actif (Boolean, default true) | statut (String enum) | ⚠️ Type different |
| version (Number, default 1) | version (String, default null) | ⚠️ Type different |
| remarques (String) | configuration.remarques (String) | ⚠️ Emplacement different |

#### Champs NON documentes presents dans le code

| Champ | Type | Description |
|-------|------|-------------|
| capacitePassagers | Number | Capacite passagers |
| capaciteFret | Number | Capacite fret |
| statut | String enum | ACTIF, MAINTENANCE, HORS_SERVICE |

#### Champ actif vs statut

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| actif (Boolean) | statut enum: ACTIF, MAINTENANCE, HORS_SERVICE | ⚠️ Approche differente |

#### Schema configuration.sieges

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| business (Number) | classeAffaires.nombre (Number) + disposition (String) | ⚠️ Structure differente |
| economique (Number) | classeEconomique.nombre (Number) + disposition (String) | ⚠️ Structure differente |
| premiumEconomy (Number) | classePremiere.nombre (Number) + disposition (String) | ⚠️ Nom different |

#### Schema configuration.equipements

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| Array [String] enum | Object { wifi, divertissement, priseElectrique, equipementsSpeciaux } | ⚠️ Structure differente |

#### Enum equipements

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| WIFI, IFE, USB, PRISE_ELECTRIQUE, CUISINE, BAR | wifi, divertissement, priseElectrique (Boolean) + equipementsSpeciaux ([String]) | ⚠️ Structure differente |

#### Schema historiqueVersions

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| version (Number) | version (String) | ⚠️ Type different |
| configuration (Object) | configurationSnapshot (Mixed) | ⚠️ Nom different |
| dateModification (Date) | dateChangement (Date) | ⚠️ Nom different |
| modifiePar (ObjectId User) | modifiePar (ObjectId User) | ✅ Conforme |
| commentaire (String) | modifications (String) | ⚠️ Nom different |

#### Schema derniereRevision

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| date (Date) | date (Date) | ✅ Conforme |
| type enum (A, B, C, D) | type enum (MINEURE, MAJEURE, COMPLETE) | ⚠️ Valeurs differentes |
| prochaine (Date) | prochaineDatePrevue (Date) | ⚠️ Nom different |

#### Index

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| immatriculation (unique) | immatriculation unique via unique:true | ✅ Conforme |
| - | compagnie: 1 | Non documente |

**Resultat Avion.js** : ⚠️ DIVERGENCES MAJEURES

---

## 2. SERVICES (services/)

### Documentation

La documentation indique : "Pas de couche service dediee identifiee"

### Verification

| Chemin | Recherche | Resultat |
|--------|-----------|----------|
| src/services/referentials/avion.service.js | Fichier | ✅ PRESENT |

**Resultat** : ⚠️ DIVERGENCE - Service existe mais non documente

### Fonctions dans avion.service.js (NON documentees)

| Fonction | Description |
|----------|-------------|
| mettreAJourConfiguration | MAJ configuration avion |
| creerNouvelleVersion | Creation nouvelle version |
| obtenirHistoriqueVersions | Obtenir historique |
| obtenirVersionSpecifique | Obtenir version specifique |
| restaurerVersion | Restaurer version anterieure |
| mettreAJourRevision | MAJ infos revision |
| obtenirAvionsRevisionProchaine | Avions necessitant revision |
| comparerVersions | Comparer deux versions |
| obtenirStatistiquesConfigurations | Statistiques configurations |

---

## 3. CONTROLLERS (controllers/)

### 3.1 avionConfiguration.controller.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/referentials/avionConfiguration.controller.js | Present | ✅ |

#### Handlers Documentes

| Handler Doc | Handler Code | Conformite |
|-------------|--------------|------------|
| listerAvions | Present L24-47 | ✅ Conforme |
| obtenirAvion | Present L53-75 | ✅ Conforme |
| creerAvion | Present L81-130 | ✅ Conforme |
| mettreAJourAvion | ❌ ABSENT | ❌ Non implemente |
| supprimerAvion | ❌ ABSENT | ❌ Non implemente |
| mettreAJourConfiguration | Present L140-169 | ✅ Conforme |
| obtenirHistoriqueVersions | Present L231-258 | ✅ Conforme |
| restaurerVersion | Present L297-333 | ✅ Conforme |
| rechercherAvionParImmatriculation | ❌ ABSENT | ❌ Non implemente |
| listerAvionsActifs | ❌ ABSENT | ❌ Non implemente |

#### Handlers NON Documentes (presents dans code)

| Handler | Localisation | Description |
|---------|--------------|-------------|
| creerNouvelleVersion | L175-225 | Creer nouvelle version |
| obtenirVersionSpecifique | L264-291 | Obtenir version specifique |
| mettreAJourRevision | L339-375 | MAJ infos revision |
| obtenirAvionsRevisionProchaine | L381-401 | Avions revision prochaine |
| comparerVersions | L407-441 | Comparer versions |
| obtenirStatistiquesConfigurations | L447-465 | Statistiques configurations |

**Resultat avionConfiguration.controller.js** : ⚠️ DIVERGENCES

---

## 4. ROUTES (routes/)

### 4.1 avion.routes.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/referentials/avion.routes.js | Present | ✅ |
| Base path | /api/avions | Present | ✅ |

#### Routes Documentees vs Code

| Route Doc | Route Code | Conformite |
|-----------|------------|------------|
| GET /actifs | ❌ ABSENT | ❌ Non implemente |
| GET /recherche/:immatriculation | ❌ ABSENT | ❌ Non implemente |
| GET / | Present L51 | ✅ Conforme |
| POST / | Present L60 | ⚠️ Middleware different |
| GET /:id | Present L67 | ✅ Conforme |
| PUT /:id | ❌ ABSENT | ❌ Non implemente |
| DELETE /:id | ❌ ABSENT | ❌ Non implemente |
| PUT /:id/configuration | Present L78 | ⚠️ Middleware different |
| GET /:id/versions | Present L104 | ✅ Conforme |
| POST /:id/versions/:v/restaurer | Present L119 | ⚠️ Middleware different |

#### Routes Code NON documentees

| Route | Methode | Description |
|-------|---------|-------------|
| /revisions/prochaines | GET | Avions revision prochaine |
| /statistiques/configurations | GET | Statistiques |
| /:id/versions/comparer | GET | Comparer versions |
| /:id/versions | POST | Creer nouvelle version |
| /:id/versions/:numeroVersion | GET | Obtenir version specifique |
| /:id/revision | PUT | MAJ revision |

#### Middlewares RBAC

| Route | Doc | Code | Conformite |
|-------|-----|------|------------|
| POST / | authorize(MANAGER, ADMIN) | excludeQualite | ⚠️ Approche differente |
| PUT /:id/configuration | authorize(MANAGER, ADMIN) | excludeQualite | ⚠️ Approche differente |
| POST restaurer | authorize(ADMIN) | excludeQualite | ⚠️ Approche differente |

**Resultat avion.routes.js** : ⚠️ DIVERGENCES MAJEURES

---

## 5. SYNTHESE MVS-8-Referentials

### Statut global : ⚠️ PARTIEL - DIVERGENCES MAJEURES

### Resume

| Composant | Statut |
|-----------|--------|
| Avion.js | ⚠️ Schema tres different |
| avion.service.js | ⚠️ Existe mais non documente |
| avionConfiguration.controller.js | ⚠️ Handlers manquants/supplementaires |
| avion.routes.js | ⚠️ Routes manquantes/supplementaires |

### Liste des ecarts majeurs

#### Modele Avion.js
1. `capaciteMax` documente mais code utilise `capacitePassagers` + `capaciteFret`
2. `actif` (Boolean) documente mais code utilise `statut` (enum)
3. `version` type Number documente mais String dans code
4. Structure `configuration.sieges` differente (champs et noms)
5. Structure `configuration.equipements` differente (array vs object)
6. Enum `derniereRevision.type` completement different (A/B/C/D vs MINEURE/MAJEURE/COMPLETE)
7. Noms de champs `historiqueVersions` differents

#### Services
1. Documentation indique absence de service
2. Code contient `avion.service.js` avec 9 fonctions

#### Controllers
1. Handlers documentes absents : `mettreAJourAvion`, `supprimerAvion`, `rechercherAvionParImmatriculation`, `listerAvionsActifs`
2. Handlers non documentes presents : `creerNouvelleVersion`, `obtenirVersionSpecifique`, `mettreAJourRevision`, `obtenirAvionsRevisionProchaine`, `comparerVersions`, `obtenirStatistiquesConfigurations`

#### Routes
1. Routes documentees absentes : `/actifs`, `/recherche/:immatriculation`, `PUT /:id`, `DELETE /:id`
2. Routes non documentees : `/revisions/prochaines`, `/statistiques/configurations`, `/:id/versions/comparer`, etc.
3. Approche RBAC differente : documentation utilise `authorize(MANAGER, ADMIN)`, code utilise `excludeQualite`

---

**Fin de l'audit MVS-8-Referentials**
