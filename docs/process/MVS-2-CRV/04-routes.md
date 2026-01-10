# MVS-2-CRV - ROUTES

## Date d'audit : 2026-01-10

---

## crv.routes.js

### Emplacement
`src/routes/crv/crv.routes.js`

### Base path
`/api/crv`

---

## ROUTES CRUD

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| POST | / | creerCRV | protect, excludeQualite, validate, verifierPhasesAutoriseesCreationCRV, auditLog | Creer CRV |
| GET | / | listerCRVs | protect | Lister CRV |
| GET | /:id | obtenirCRV | protect | Obtenir CRV |
| PATCH | /:id | mettreAJourCRV | protect, excludeQualite, verifierCRVNonVerrouille, auditLog | Modifier CRV |
| PUT | /:id | mettreAJourCRV | protect, excludeQualite, verifierCRVNonVerrouille, auditLog | Modifier CRV |
| DELETE | /:id | supprimerCRV | protect, authorize('SUPERVISEUR', 'MANAGER'), auditLog | Supprimer CRV |

---

## ROUTES RECHERCHE & ANALYTICS

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| GET | /search | rechercherCRV | Recherche full-text |
| GET | /stats | obtenirStatsCRV | Statistiques et KPIs |
| GET | /export | exporterCRVExcel | Export Excel/CSV |

---

## ROUTES TRANSITIONS STATUT

| Methode | Chemin | Controller | Transition | Description |
|---------|--------|------------|------------|-------------|
| GET | /:id/transitions | obtenirTransitionsPossibles | - | Transitions possibles |
| POST | /:id/demarrer | demarrerCRV | BROUILLON -> EN_COURS | Demarrer CRV |
| POST | /:id/terminer | terminerCRV | EN_COURS -> TERMINE | Terminer CRV |

---

## ROUTES CONFIRMATIONS EXPLICITES

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| POST | /:id/confirmer-absence | confirmerAbsence | Confirmer absence evenement/observation/charge |
| DELETE | /:id/confirmer-absence | annulerConfirmationAbsence | Annuler confirmation |

---

## ROUTES CHARGES

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| POST | /:id/charges | ajouterCharge | Ajouter charge operationnelle |

Validation :
```javascript
body('typeCharge').isIn(['PASSAGERS', 'BAGAGES', 'FRET'])
body('sensOperation').isIn(['EMBARQUEMENT', 'DEBARQUEMENT'])
```

---

## ROUTES EVENEMENTS

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| POST | /:id/evenements | ajouterEvenement | Ajouter evenement operationnel |

Validation :
```javascript
body('typeEvenement').notEmpty()
body('gravite').isIn(['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE'])
body('description').notEmpty()
```

---

## ROUTES OBSERVATIONS

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| POST | /:id/observations | ajouterObservation | Ajouter observation |

Validation :
```javascript
body('categorie').isIn(['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA'])
body('contenu').notEmpty()
```

---

## ROUTES PERSONNEL AFFECTE

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| PUT | /:id/personnel | mettreAJourPersonnel | Remplacer tout le personnel |
| POST | /:id/personnel | ajouterPersonnel | Ajouter une personne |
| DELETE | /:id/personnel/:personneId | supprimerPersonnel | Retirer une personne |

---

## ROUTES ENGINS AFFECTES

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| GET | /:id/engins | obtenirEnginsAffectes | Obtenir engins |
| PUT | /:id/engins | mettreAJourEnginsAffectes | Remplacer engins |
| POST | /:id/engins | ajouterEnginAuCRV | Ajouter engin |
| DELETE | /:id/engins/:affectationId | retirerEnginDuCRV | Retirer engin |

---

## ROUTES PHASES CRV

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| PUT | /:crvId/phases/:phaseId | mettreAJourPhaseCRV | Modifier phase |

Donnees acceptees :
- statut : 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE' | 'NON_REALISE'
- heureDebutReelle, heureFinReelle : "HH:mm" ou ISO
- motifNonRealisation, detailMotif, remarques

---

## ROUTES HORAIRES

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| PUT | /:id/horaire | mettreAJourHoraire | Modifier horaires |

---

## ROUTES ARCHIVAGE

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| GET | /archive/status | getArchivageStatus | Statut service archivage |
| POST | /archive/test | testerArchivage | Test archivage |
| POST | /:id/archive | archiverCRV | Archiver CRV |

---

## ROUTES ANNULATION (Extension 6)

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| GET | /annules | obtenirCRVAnnules | Liste CRV annules |
| GET | /statistiques/annulations | obtenirStatistiquesAnnulations | Stats annulations |
| GET | /:id/peut-annuler | verifierPeutAnnuler | Verifier si annulation possible |
| POST | /:id/annuler | annulerCRV | Annuler CRV |
| POST | /:id/reactiver | reactiverCRV | Reactiver CRV |

---

## CLASSIFICATION DES ROUTES

### Routes CRUD (5)
- POST /, GET /, GET /:id, PATCH /:id, DELETE /:id

### Routes METIER (15+)
- Transitions statut
- Confirmations
- Ajout charges/evenements/observations
- Gestion personnel/engins
- Mise a jour phases/horaires
- Annulation

### Routes TRANSVERSES (6)
- Recherche
- Statistiques
- Export
- Archivage

---

## MIDDLEWARES APPLIQUES

| Middleware | Routes | Description |
|------------|--------|-------------|
| protect | Toutes | Authentification JWT |
| excludeQualite | Ecritures | Bloque role QUALITE |
| authorize('SUPERVISEUR', 'MANAGER') | DELETE /:id | Roles specifiques |
| verifierCRVNonVerrouille | Modifications | Bloque si verrouille |
| verifierPhasesAutoriseesCreationCRV | POST / | Phases initiales |
| validerCoherenceCharges | POST /:id/charges | Coherence donnees |
| auditLog | Ecritures | Tracabilite |
| validate | Avec body | Validation donnees |
