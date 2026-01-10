# MVS-6-Resources - AUDIT DE CONFORMITE BACKEND

## MVS : MVS-6-Resources
## Date d'audit : 2026-01-10
## Source de reference : docs/process/MVS-6-Resources/

---

## 1. MODELES (models/)

### 1.1 Engin.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/resources/Engin.js | Present | ✅ |

#### Schema

| Champ | Doc | Code | Conformite |
|-------|-----|------|------------|
| numeroEngin | String, required, unique, uppercase, trim | String, required, unique, trim, uppercase | ✅ Conforme |
| typeEngin | String enum, required | String enum, required | ✅ Conforme |
| marque | String | String | ✅ Conforme |
| modele | String | String | ✅ Conforme |
| statut | String enum, default DISPONIBLE | String enum, default: DISPONIBLE | ✅ Conforme |
| derniereRevision | Date | Date | ✅ Conforme |
| prochaineRevision | Date | Date | ✅ Conforme |
| remarques | String | String | ✅ Conforme |

#### Enum typeEngin

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| TRACTEUR, CHARIOT_BAGAGES, CHARIOT_FRET, GPU, ASU, STAIRS, CONVOYEUR, AUTRE | Identique | ✅ Conforme |

#### Enum statut

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| DISPONIBLE, EN_SERVICE, MAINTENANCE, PANNE, HORS_SERVICE | Identique | ✅ Conforme |

#### Index

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| numeroEngin (unique) | index({ numeroEngin: 1 }) + unique:true | ✅ Conforme |
| typeEngin | index({ typeEngin: 1 }) | ✅ Conforme |
| statut | index({ statut: 1 }) | ✅ Conforme |

**Resultat Engin.js** : ✅ CONFORME

---

### 1.2 AffectationEnginVol.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/resources/AffectationEnginVol.js | Present | ✅ |

#### Schema

| Champ | Doc | Code | Conformite |
|-------|-----|------|------------|
| vol | ObjectId ref Vol, required | ObjectId ref Vol, required | ✅ Conforme |
| engin | ObjectId ref Engin, required | ObjectId ref Engin, required | ✅ Conforme |
| heureDebut | Date, required | Date, required | ✅ Conforme |
| heureFin | Date | Date | ✅ Conforme |
| usage | String enum, required | String enum, required | ✅ Conforme |
| statut | String enum, default AFFECTE | String enum, default: AFFECTE | ✅ Conforme |
| remarques | String | String | ✅ Conforme |

#### Enum usage

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| TRACTAGE, BAGAGES, FRET, ALIMENTATION_ELECTRIQUE, CLIMATISATION, PASSERELLE, CHARGEMENT | Identique | ✅ Conforme |

#### Enum statut

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| AFFECTE, EN_COURS, TERMINE, PANNE | Identique | ✅ Conforme |

#### Index

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| vol | index({ vol: 1 }) | ✅ Conforme |
| engin | index({ engin: 1 }) | ✅ Conforme |
| heureDebut | index({ heureDebut: 1 }) | ✅ Conforme |

**Resultat AffectationEnginVol.js** : ✅ CONFORME

---

## 2. SERVICES (services/)

### Documentation

La documentation indique : "Aucun service dedie dans src/services/resources/"

### Verification

| Chemin | Recherche | Resultat |
|--------|-----------|----------|
| src/services/resources/ | Glob pattern | ❌ Aucun fichier trouve |

**Resultat** : ✅ CONFORME - Absence de service confirmee (logique dans controller)

---

## 3. CONTROLLERS (controllers/)

### 3.1 engin.controller.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/resources/engin.controller.js | Present | ✅ |

#### Handlers Referentiel Engins

| Handler | Doc | Code | Conformite |
|---------|-----|------|------------|
| listerEngins | Present | Present L14-44 | ✅ Conforme |
| obtenirEngin | Present | Present L50-68 | ✅ Conforme |
| creerEngin | Present | Present L74-105 | ✅ Conforme |
| mettreAJourEngin | Present | Present L111-142 | ✅ Conforme |
| supprimerEngin | Present | Present L148-178 | ✅ Conforme |
| listerEnginsDisponibles | Present | Present L184-201 | ✅ Conforme |
| obtenirTypesEngins | Present | Present L483-503 | ✅ Conforme |

#### Handlers Affectation CRV

| Handler | Doc | Code | Conformite |
|---------|-----|------|------------|
| obtenirEnginsAffectes | Present | Present L211-236 | ✅ Conforme |
| mettreAJourEnginsAffectes | Present | Present L242-378 | ✅ Conforme |
| ajouterEnginAuCRV | Present | Present L384-433 | ✅ Conforme |
| retirerEnginDuCRV | Present | Present L439-477 | ✅ Conforme |

#### Logique metier dans controller

| Fonction | Doc | Code | Conformite |
|----------|-----|------|------------|
| Verification unicite | creerEngin:L79 | L79-86 | ✅ Conforme |
| Verification utilisation | supprimerEngin:L160 | L160-167 | ✅ Conforme |
| Listing disponibles | L188 | L188-189 | ✅ Conforme |
| Creation automatique engin | L289-311 | L289-311 | ✅ Conforme |
| Mapping type-usage | L316-327 | L316-327 | ✅ Conforme |

**Resultat engin.controller.js** : ✅ CONFORME

---

## 4. ROUTES (routes/)

### 4.1 engin.routes.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/resources/engin.routes.js | Present | ✅ |
| Base path | /api/engins | Present (via montage) | ✅ |

#### Routes Referentiel Engins

| Route Doc | Methode | Code reel | Conformite |
|-----------|---------|-----------|------------|
| /types | GET | router.get L26 | ✅ Conforme |
| /disponibles | GET | router.get L34 | ✅ Conforme |
| / | GET | router.get L42 | ✅ Conforme |
| / | POST | router.post L49-53 | ✅ Conforme |
| /:id | GET | router.get L64 | ✅ Conforme |
| /:id | PUT | router.put L71 | ✅ Conforme |
| /:id | DELETE | router.delete L78 | ✅ Conforme |

#### Middlewares et Controle d'acces

| Route | Middleware Doc | Code reel | Conformite |
|-------|----------------|-----------|------------|
| GET routes | protect | protect | ✅ Conforme |
| POST / | protect, authorize(MANAGER, ADMIN), validate | Identique | ✅ Conforme |
| PUT /:id | protect, authorize(MANAGER, ADMIN) | Identique | ✅ Conforme |
| DELETE /:id | protect, authorize(ADMIN) | Identique | ✅ Conforme |

#### Validation POST /

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| numeroEngin notEmpty | body('numeroEngin').notEmpty() | ✅ Conforme |
| typeEngin isIn enum | body('typeEngin').isIn([...]) | ✅ Conforme |

#### Ordre des routes

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| Routes non-parametrisees avant /:id | /types et /disponibles avant /:id | ✅ Conforme |

**Resultat engin.routes.js** : ✅ CONFORME

---

## 5. ROUTES AFFECTATION (dans crv.routes.js)

### Note

Les routes d'affectation engins-CRV sont documentees comme etant dans crv.routes.js.

| Route Doc | Methode | Description | Conformite |
|-----------|---------|-------------|------------|
| /api/crv/:id/engins | GET | Engins d'un CRV | ✅ Conforme |
| /api/crv/:id/engins | PUT | MAJ engins CRV | ✅ Conforme |
| /api/crv/:id/engins | POST | Ajouter engin | ✅ Conforme |
| /api/crv/:id/engins/:affectationId | DELETE | Retirer engin | ✅ Conforme |

---

## 6. SYNTHESE MVS-6-Resources

### Statut global : ✅ CONFORME

### Resume

| Composant | Statut |
|-----------|--------|
| Engin.js | ✅ Conforme |
| AffectationEnginVol.js | ✅ Conforme |
| Services | ✅ Conforme (absence documentee) |
| engin.controller.js | ✅ Conforme |
| engin.routes.js | ✅ Conforme |

### Ecarts constates

Aucun ecart entre la documentation et le code.

### Points de conformite critiques verifies

1. Unicite numeroEngin : Implementee (unique + verification L79)
2. Verification avant suppression : Implementee (L160)
3. Creation automatique engin : Implementee (L289-311)
4. Mapping type/usage frontend-backend : Implemente (L293-327)
5. RBAC : MANAGER/ADMIN pour CRUD engins, ADMIN seul pour DELETE
6. Verrouillage CRV : Verifie avant affectation (L269, L397, L452)

---

**Fin de l'audit MVS-6-Resources**
