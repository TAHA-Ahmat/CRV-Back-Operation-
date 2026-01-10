# MVS-3-Phases - ROUTES

## Date d'audit : 2026-01-10

---

## phase.routes.js

### Emplacement
`src/routes/phases/phase.routes.js`

### Base path
`/api/phases`

---

## Routes exposees

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | / | listerPhases | protect | Liste phases (query: crvId) |
| GET | /:id | obtenirPhase | protect | Obtenir phase |
| POST | /:id/demarrer | demarrerPhaseController | protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog | Demarrer phase |
| POST | /:id/terminer | terminerPhaseController | protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog | Terminer phase |
| POST | /:id/non-realise | marquerPhaseNonRealisee | protect, excludeQualite, validate, verifierJustificationNonRealisation, auditLog | Marquer non realisee |
| PATCH | /:id | mettreAJourPhase | protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog | Modifier phase |

---

## Validation POST /:id/non-realise

```javascript
body('motifNonRealisation').isIn([
  'NON_NECESSAIRE',
  'EQUIPEMENT_INDISPONIBLE',
  'PERSONNEL_ABSENT',
  'CONDITIONS_METEO',
  'AUTRE'
])
body('detailMotif').notEmpty()
```

---

## Route CRV (definie dans crv.routes.js)

| Methode | Chemin | Controller | Description |
|---------|--------|------------|-------------|
| PUT | /api/crv/:crvId/phases/:phaseId | mettreAJourPhaseCRV | Modifier phase via CRV |

---

## Middlewares business

| Middleware | Description |
|------------|-------------|
| verifierCoherencePhaseTypeOperation | Verifie coherence phase/type operation |
| verifierJustificationNonRealisation | Verifie justification fournie |
