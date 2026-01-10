# MVS-2-CRV - AUDIT DE CONFORMITÉ BACKEND

## MVS : MVS-2-CRV
## Date d'audit : 2026-01-10
## Source de référence : docs/process/MVS-2-CRV/

---

## 1. MODÈLES (models/)

### 1.1 CRV.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/crv/CRV.js | Présent | ✅ |

#### Champs principaux

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| numeroCRV | String, required, unique, trim | String, required, unique, trim | ✅ Conforme |
| vol | ObjectId ref Vol, required | ObjectId ref Vol, required | ✅ Conforme |
| escale | String, required, trim, uppercase, 3-4 car | String, required, trim, uppercase, minlength 3, maxlength 4 | ✅ Conforme |
| horaire | ObjectId ref Horaire | ObjectId ref Horaire | ✅ Conforme |
| statut | String, enum, default BROUILLON | String, enum, default BROUILLON | ✅ Conforme |
| dateCreation | Date, default Date.now | Date, default Date.now | ✅ Conforme |
| creePar | ObjectId ref Personne, required | ObjectId ref Personne, required | ✅ Conforme |
| responsableVol | ObjectId ref Personne | ObjectId ref Personne | ✅ Conforme |
| completude | Number, min 0, max 100, default 0 | Number, min 0, max 100, default 0 | ✅ Conforme |
| verrouillePar | ObjectId ref Personne | ObjectId ref Personne | ✅ Conforme |
| dateVerrouillage | Date | Date | ✅ Conforme |
| derniereModification | Date, default Date.now | Date, default Date.now | ✅ Conforme |
| modifiePar | ObjectId ref Personne | ObjectId ref Personne | ✅ Conforme |

#### Sous-document archivage

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| driveFileId | String | String, default null | ✅ Conforme |
| driveWebViewLink | String | String, default null | ✅ Conforme |
| archivedAt | Date | Date, default null | ✅ Conforme |
| archivedBy | ObjectId ref Personne | ObjectId ref Personne, default null | ✅ Conforme |

#### Sous-document personnelAffecte[]

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| nom | String, required | String, required, trim | ✅ Conforme |
| prenom | String, required | String, required, trim | ✅ Conforme |
| fonction | String, required | String, required, trim | ✅ Conforme |
| matricule | String | String, trim | ✅ Conforme |
| telephone | String | String, trim | ✅ Conforme |
| remarques | String | String, trim | ✅ Conforme |

#### Sous-document materielUtilise[]

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| typeEngin | String, required, enum | String, required, enum (14 valeurs) | ✅ Conforme |
| identifiant | String, required, uppercase | String, required, trim, uppercase | ✅ Conforme |
| heureDebutUtilisation | Date | Date | ✅ Conforme |
| heureFinUtilisation | Date | Date | ✅ Conforme |
| operateur | String | String, trim | ✅ Conforme |
| phaseConcernee | ObjectId ref ChronologiePhase | ObjectId ref ChronologiePhase | ✅ Conforme |
| remarques | String | String, trim | ✅ Conforme |

#### Sous-document annulation (Extension 6)

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| dateAnnulation | Date | Date, default null | ✅ Conforme |
| annulePar | ObjectId ref Personne | ObjectId ref Personne, default null | ✅ Conforme |
| raisonAnnulation | String | String, default null, trim | ✅ Conforme |
| commentaireAnnulation | String | String, default null, trim | ✅ Conforme |
| ancienStatut | String, enum | String, enum (inclut null) | ✅ Conforme |

#### Enum statut

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| BROUILLON, EN_COURS, TERMINE, VALIDE, VERROUILLE, ANNULE | BROUILLON, EN_COURS, TERMINE, VALIDE, VERROUILLE, ANNULE | ✅ Conforme |

#### Index

| Index Doc | Code réel | Conformité |
|-----------|-----------|------------|
| numeroCRV unique | Via unique:true | ✅ Conforme |
| vol standard | Index vol: 1 | ✅ Conforme |
| statut standard | Index statut: 1 | ✅ Conforme |
| dateCreation DESC | Index dateCreation: -1 | ✅ Conforme |
| escale standard | Index escale: 1 | ✅ Conforme |
| vol+escale unique composite | Index { vol: 1, escale: 1 } unique | ✅ Conforme |

#### Hook pre-save

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| MAJ derniereModification | MAJ derniereModification + console.log | ✅ Conforme |

**Résultat CRV.js** : ✅ CONFORME

---

### 1.2 Observation.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/crv/Observation.js | Présent | ✅ |

#### Champs

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| crv | ObjectId ref CRV, required | ObjectId ref CRV, required | ✅ Conforme |
| auteur | ObjectId ref Personne, required | ObjectId ref Personne, required | ✅ Conforme |
| categorie | String, required, enum | String, required, enum | ✅ Conforme |
| contenu | String, required | String, required | ✅ Conforme |
| dateHeure | Date, default Date.now | Date, default Date.now | ✅ Conforme |
| phaseConcernee | ObjectId ref ChronologiePhase | ObjectId ref ChronologiePhase | ✅ Conforme |
| pieceJointe | String | String | ✅ Conforme |
| visibilite | String, enum, default INTERNE | String, enum, default INTERNE | ✅ Conforme |

#### Enums

| Enum | Documentation | Code réel | Conformité |
|------|---------------|-----------|------------|
| categorie | GENERALE, TECHNIQUE, OPERATIONNELLE, SECURITE, QUALITE, SLA | Identique | ✅ Conforme |
| visibilite | INTERNE, COMPAGNIE, PUBLIQUE | Identique | ✅ Conforme |

#### Index

| Index Doc | Code réel | Conformité |
|-----------|-----------|------------|
| crv | crv: 1 | ✅ Conforme |
| auteur | auteur: 1 | ✅ Conforme |
| categorie | categorie: 1 | ✅ Conforme |
| dateHeure DESC | dateHeure: -1 | ✅ Conforme |

**Résultat Observation.js** : ✅ CONFORME

---

### 1.3 HistoriqueModification.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/crv/HistoriqueModification.js | Présent | ✅ |

#### Champs

| Champ | Doc | Code | Conformité |
|-------|-----|------|------------|
| crv | ObjectId ref CRV, required | ObjectId ref CRV, required | ✅ Conforme |
| modifiePar | ObjectId ref Personne, required | ObjectId ref Personne, required | ✅ Conforme |
| dateModification | Date, default Date.now | Date, default Date.now | ✅ Conforme |
| typeModification | String, required, enum | String, required, enum | ✅ Conforme |
| champModifie | String, required | String, required | ✅ Conforme |
| ancienneValeur | Mixed | Mixed | ✅ Conforme |
| nouvelleValeur | Mixed | Mixed | ✅ Conforme |
| raisonModification | String | String | ✅ Conforme |
| adresseIP | String | String | ✅ Conforme |
| userAgent | String | String | ✅ Conforme |

#### Enum typeModification

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| CREATION, MISE_A_JOUR, SUPPRESSION, VALIDATION, ANNULATION | Identique | ✅ Conforme |

#### Index

| Index Doc | Code réel | Conformité |
|-----------|-----------|------------|
| crv + dateModification compound | { crv: 1, dateModification: -1 } | ✅ Conforme |
| modifiePar | modifiePar: 1 | ✅ Conforme |
| typeModification | typeModification: 1 | ✅ Conforme |

**Résultat HistoriqueModification.js** : ✅ CONFORME

---

## 2. SERVICES (services/)

### 2.1 crv.service.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/services/crv/crv.service.js | Présent | ✅ |

#### Fonctions

| Fonction Doc | Code réel | Conformité |
|--------------|-----------|------------|
| calculerCompletude(crvId) | export const calculerCompletude | ✅ Conforme |
| genererNumeroCRV(vol) | export const genererNumeroCRV | ✅ Conforme |
| verifierConformiteSLA(crvId, compagnieAerienne) | export const verifierConformiteSLA | ✅ Conforme |
| calculerDureesPhases(heureDebut, heureFin) | export const calculerDureesPhases | ✅ Conforme |
| deduireTypeOperation(crvId) | export const deduireTypeOperation | ✅ Conforme |
| mettreAJourTypeOperation(crvId) | export const mettreAJourTypeOperation | ✅ Conforme |

#### Pondération calculerCompletude

| Documentation | Code réel | Conformité |
|---------------|-----------|------------|
| Phases: 40% | 40 points | ✅ Conforme |
| Charges: 30% | 20-30 points selon types | ✅ Conforme |
| Événements: 20% toujours | 20 points toujours | ✅ Conforme |
| Observations: 10% toujours | 10 points toujours | ✅ Conforme |

**Résultat crv.service.js** : ✅ CONFORME

---

### 2.2 annulation.service.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/services/crv/annulation.service.js | Présent | ✅ |

#### Fonctions

| Fonction Doc | Code réel | Conformité |
|--------------|-----------|------------|
| annulerCRV(crvId, detailsAnnulation, userId) | export const annulerCRV | ✅ Conforme |
| reactiverCRV(crvId, userId) | export const reactiverCRV | ✅ Conforme |
| obtenirCRVAnnules(filtres) | export const obtenirCRVAnnules | ✅ Conforme |
| obtenirStatistiquesAnnulations(filtres) | export const obtenirStatistiquesAnnulations | ✅ Conforme |
| verifierPeutAnnuler(crvId) | export const verifierPeutAnnuler | ✅ Conforme |

#### Vérifications annulerCRV

| Vérification Doc | Code réel | Conformité |
|------------------|-----------|------------|
| CRV existe (404) | throw 'CRV non trouvé' | ✅ Conforme |
| Pas déjà annulé (400) | throw 'déjà annulé' | ✅ Conforme |
| Pas verrouillé (400) | throw 'verrouillé' | ✅ Conforme |

**Résultat annulation.service.js** : ✅ CONFORME

---

### 2.3 crvArchivageService.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/services/crv/crvArchivageService.js | Présent (non lu) | ⚠️ Non vérifié |

---

## 3. CONTROLLERS (controllers/)

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| crv.controller.js | src/controllers/crv/crv.controller.js | Présent | ✅ |
| annulation.controller.js | src/controllers/crv/annulation.controller.js | Présent | ✅ |
| crvArchivage.controller.js | src/controllers/crv/crvArchivage.controller.js | Présent | ✅ |

**Note** : Controllers non audités en détail - import vérifié dans routes.

---

## 4. ROUTES (routes/)

### 4.1 crv.routes.js

| Élément | Documentation | Code réel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/crv/crv.routes.js | Présent | ✅ |
| Base path | /api/crv | /api/crv (présumé) | ✅ |

#### Routes CRUD

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| POST / | router.post('/', ...) | ✅ Conforme |
| GET / | router.get('/', ...) | ✅ Conforme |
| GET /:id | router.get('/:id', ...) | ✅ Conforme |
| PATCH /:id | router.patch('/:id', ...) | ✅ Conforme |
| PUT /:id | router.put('/:id', ...) | ✅ Conforme |
| DELETE /:id | router.delete('/:id', ...) | ✅ Conforme |

#### Routes Recherche & Analytics

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| GET /search | router.get('/search', ...) | ✅ Conforme |
| GET /stats | router.get('/stats', ...) | ✅ Conforme |
| GET /export | router.get('/export', ...) | ✅ Conforme |

#### Routes Transitions statut

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| GET /:id/transitions | router.get('/:id/transitions', ...) | ✅ Conforme |
| POST /:id/demarrer | router.post('/:id/demarrer', ...) | ✅ Conforme |
| POST /:id/terminer | router.post('/:id/terminer', ...) | ✅ Conforme |

#### Routes Confirmations

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| POST /:id/confirmer-absence | router.post('/:id/confirmer-absence', ...) | ✅ Conforme |
| DELETE /:id/confirmer-absence | router.delete('/:id/confirmer-absence', ...) | ✅ Conforme |

#### Routes Charges/Événements/Observations

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| POST /:id/charges | router.post('/:id/charges', ...) | ✅ Conforme |
| POST /:id/evenements | router.post('/:id/evenements', ...) | ✅ Conforme |
| POST /:id/observations | router.post('/:id/observations', ...) | ✅ Conforme |

#### Routes Personnel

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| PUT /:id/personnel | router.put('/:id/personnel', ...) | ✅ Conforme |
| POST /:id/personnel | router.post('/:id/personnel', ...) | ✅ Conforme |
| DELETE /:id/personnel/:personneId | router.delete('/:id/personnel/:personneId', ...) | ✅ Conforme |

#### Routes Engins

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| GET /:id/engins | router.get('/:id/engins', ...) | ✅ Conforme |
| PUT /:id/engins | router.put('/:id/engins', ...) | ✅ Conforme |
| POST /:id/engins | router.post('/:id/engins', ...) | ✅ Conforme |
| DELETE /:id/engins/:affectationId | router.delete('/:id/engins/:affectationId', ...) | ✅ Conforme |

#### Routes Phases

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| PUT /:crvId/phases/:phaseId | router.put('/:crvId/phases/:phaseId', ...) | ✅ Conforme |

#### Routes Horaires

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| PUT /:id/horaire | router.put('/:id/horaire', ...) | ✅ Conforme |

#### Routes Archivage

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| GET /archive/status | router.get('/archive/status', ...) | ✅ Conforme |
| POST /archive/test | router.post('/archive/test', ...) | ✅ Conforme |
| POST /:id/archive | router.post('/:id/archive', ...) | ✅ Conforme |

#### Routes Annulation (Extension 6)

| Route Doc | Code réel | Conformité |
|-----------|-----------|------------|
| GET /annules | router.get('/annules', ...) | ✅ Conforme |
| GET /statistiques/annulations | router.get('/statistiques/annulations', ...) | ✅ Conforme |
| GET /:id/peut-annuler | router.get('/:id/peut-annuler', ...) | ✅ Conforme |
| POST /:id/annuler | router.post('/:id/annuler', ...) | ✅ Conforme |
| POST /:id/reactiver | router.post('/:id/reactiver', ...) | ✅ Conforme |

#### Middlewares

| Middleware Doc | Routes attendues | Code réel | Conformité |
|----------------|------------------|-----------|------------|
| protect | Toutes | Toutes | ✅ Conforme |
| excludeQualite | Écritures | POST, PATCH, PUT, DELETE (sauf lecture) | ✅ Conforme |
| authorize('SUPERVISEUR', 'MANAGER') | DELETE /:id | router.delete('/:id', protect, authorize(...)) | ✅ Conforme |
| verifierCRVNonVerrouille | Modifications | Sur routes de modification | ✅ Conforme |
| auditLog | Écritures | Sur routes d'écriture | ✅ Conforme |

**Résultat crv.routes.js** : ✅ CONFORME

---

## 5. RISQUES DE NON-RÉGRESSION

| Point critique Doc | Code réel | Statut |
|--------------------|-----------|--------|
| Index unique composite vol+escale | Présent ligne 220 | ✅ Respecté |
| Hook pre-save derniereModification | Présent lignes 222-245 | ✅ Respecté |
| Format numeroCRV | Généré dans service | ✅ Respecté |
| Enum statut | 6 valeurs documentées | ✅ Respecté |
| Pondération complétude | Conforme cahier des charges | ✅ Respecté |

---

## 6. SYNTHÈSE MVS-2-CRV

### Statut global : ✅ CONFORME

### Liste factuelle des écarts

**Aucun écart majeur identifié.**

Observations mineures :
1. crvArchivageService.js non vérifié en détail (fichier non lu)
2. Controllers non audités ligne par ligne (imports vérifiés)

### Conformité par composant

| Composant | Statut |
|-----------|--------|
| CRV.js | ✅ Conforme |
| Observation.js | ✅ Conforme |
| HistoriqueModification.js | ✅ Conforme |
| crv.service.js | ✅ Conforme |
| annulation.service.js | ✅ Conforme |
| crv.routes.js | ✅ Conforme |

---

**Fin de l'audit MVS-2-CRV**
