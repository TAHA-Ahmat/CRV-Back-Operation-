# MVS-3-Phases - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : INITIALISATION PHASES CRV

### Objectif
Creer toutes les phases pour un nouveau CRV.

### Sequence

```
[Trigger] crv.controller::creerCRV
    |
    v
[Service] phase.service::initialiserPhasesVol(crvId)
    |
    v
[Model] Phase.find({ actif: true })
    |-- Recupere TOUTES les phases actives
    |
    v
[Loop] Pour chaque phase
    |
    v
[Model] ChronologiePhase.create({
    crv: crvId,
    phase: phase._id,
    statut: 'NON_COMMENCE'
})
    |
    v
[Return] Array<ChronologiePhase>
```

### Etats crees
- N ChronologiePhase (1 par phase active)

---

## PROCESS 2 : DEMARRER PHASE

### Objectif
Passer une phase de NON_COMMENCE a EN_COURS.

### Sequence

```
[Client] POST /api/phases/:id/demarrer
    |
    v
[Middlewares] protect, excludeQualite, verifierCoherencePhaseTypeOperation
    |
    v
[Controller] demarrerPhaseController
    |
    |-- 1. Verifier phase existe
    |-- 2. Verifier CRV non verrouille
    |
    v
[Service] demarrerPhase(chronoPhaseId, userId)
    |
    |-- 3. verifierPrerequisPhase()
    |       Si echec: throw Error("Prerequis non satisfaits")
    |
    v
[Model] ChronologiePhase.findByIdAndUpdate({
    heureDebutReelle: new Date(),
    statut: 'EN_COURS',
    responsable: userId
})
    |
    v
[Response] 200 + { data: phaseUpdated }
```

### Transition
NON_COMMENCE -> EN_COURS

---

## PROCESS 3 : TERMINER PHASE

### Objectif
Passer une phase de EN_COURS a TERMINE.

### Sequence

```
[Client] POST /api/phases/:id/terminer
    |
    v
[Middlewares] protect, excludeQualite, verifierCoherencePhaseTypeOperation
    |
    v
[Controller] terminerPhaseController
    |
    |-- 1. Verifier phase existe
    |-- 2. Verifier CRV non verrouille
    |
    v
[Service] terminerPhase(chronoPhaseId)
    |
    |-- 3. Verifier statut = EN_COURS
    |       Si non: throw Error
    |-- 4. Mettre statut = TERMINE
    |-- 5. heureFinReelle = now()
    |
    v
[Hook] ChronologiePhase.pre('save')
    |-- Calcul dureeReelleMinutes
    |-- Calcul ecartMinutes
    |
    v
[Service] crv.service::calculerCompletude(crvId)
    |
    v
[Response] 200 + { data: phaseUpdated }
```

### Transition
EN_COURS -> TERMINE

---

## PROCESS 4 : MARQUER PHASE NON REALISEE

### Objectif
Indiquer qu'une phase n'a pas ete effectuee avec justification.

### Sequence

```
[Client] POST /api/phases/:id/non-realise
    |-- Body: { motifNonRealisation, detailMotif }
    |
    v
[Middlewares] protect, excludeQualite, validate, verifierJustificationNonRealisation
    |
    v
[Controller] marquerPhaseNonRealisee
    |
    |-- 1. Verifier phase existe
    |-- 2. Verifier CRV non verrouille
    |-- 3. Mettre statut = NON_REALISE
    |-- 4. Enregistrer motif et detail
    |
    v
[Hook] ChronologiePhase.pre('save')
    |-- Reset heureDebutReelle = null
    |-- Reset heureFinReelle = null
    |-- Reset dureeReelleMinutes = null
    |
    v
[Service] calculerCompletude(crvId)
    |
    v
[Response] 200 + { data: phaseUpdated }
```

### Transition
* -> NON_REALISE

---

## SYNTHESE

| Process | Transition | Criticite |
|---------|------------|-----------|
| Initialisation | (creation) | CRITIQUE |
| Demarrer | NON_COMMENCE -> EN_COURS | HAUTE |
| Terminer | EN_COURS -> TERMINE | HAUTE |
| Non realise | * -> NON_REALISE | MOYENNE |
