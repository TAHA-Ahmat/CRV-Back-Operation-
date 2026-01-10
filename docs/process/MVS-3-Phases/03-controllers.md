# MVS-3-Phases - CONTROLLERS

## Date d'audit : 2026-01-10

---

## phase.controller.js

### Emplacement
`src/controllers/phases/phase.controller.js`

---

### obtenirPhase
- **Route** : GET /api/phases/:id
- **Logique** : Retourne ChronologiePhase avec populate phase et responsable

### listerPhases
- **Route** : GET /api/phases?crvId=xxx
- **Logique** : Liste toutes les phases d'un CRV, triees par ordre

### demarrerPhaseController
- **Route** : POST /api/phases/:id/demarrer
- **Middlewares** : protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog
- **Logique** :
  1. Verifier phase existe
  2. Verifier CRV non verrouille
  3. Appeler service demarrerPhase

### terminerPhaseController
- **Route** : POST /api/phases/:id/terminer
- **Middlewares** : protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog
- **Logique** :
  1. Verifier phase existe
  2. Verifier CRV non verrouille
  3. Appeler service terminerPhase
  4. Recalculer completude CRV

### marquerPhaseNonRealisee
- **Route** : POST /api/phases/:id/non-realise
- **Middlewares** : protect, excludeQualite, validate, verifierJustificationNonRealisation, auditLog
- **Body** : { motifNonRealisation, detailMotif }
- **Logique** : Passe phase en NON_REALISE avec justification

### mettreAJourPhase
- **Route** : PATCH /api/phases/:id
- **Middlewares** : protect, excludeQualite, verifierCoherencePhaseTypeOperation, auditLog
- **Body** : { heureDebutPrevue, heureFinPrevue, heureDebutReelle, heureFinReelle, remarques }

### mettreAJourPhaseCRV
- **Route** : PUT /api/crv/:crvId/phases/:phaseId
- **Middlewares** : protect, excludeQualite, auditLog
- **Logique** : Mise a jour phase depuis contexte CRV (avec recalcul completude)

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| obtenirPhase | GET /:id | Lecture phase |
| listerPhases | GET / | Liste phases CRV |
| demarrerPhaseController | POST /:id/demarrer | Demarrer phase |
| terminerPhaseController | POST /:id/terminer | Terminer phase |
| marquerPhaseNonRealisee | POST /:id/non-realise | Phase non realisee |
| mettreAJourPhase | PATCH /:id | Modifier phase |
| mettreAJourPhaseCRV | PUT /crv/:crvId/phases/:phaseId | Modifier via CRV |
