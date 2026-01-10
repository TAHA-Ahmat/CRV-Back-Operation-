# MVS-5-Flights - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION VOL

### Objectif
Creer un nouveau vol dans le systeme.

### Sequence

```
[Client] POST /api/vols
    |-- Body: { numeroVol, typeOperation, compagnieAerienne, codeIATA, dateVol }
    |
    v
[Middlewares] protect, excludeQualite, validate
    |
    v
[Controller] creerVol
    |
    v
[Model] Vol.create(req.body)
    |
    v
[Populate] avion
    |
    v
[Response] 201 + { data: vol }
```

### Etat cree
- Vol avec statut PROGRAMME par defaut

---

## PROCESS 2 : CREATION PROGRAMME VOL SAISONNIER

### Objectif
Creer un programme de vols recurrents.

### Sequence

```
[Client] POST /api/programmes-vol
    |-- Body: { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] creerProgramme
    |-- Validation champs requis
    |
    v
[Service] programmeVol.service::creerProgrammeVol
    |
    |-- 1. Validation dateFin > dateDebut
    |-- 2. Validation joursSemaine si HEBDOMADAIRE
    |-- 3. Creation avec statut BROUILLON, actif=false
    |
    v
[Model] ProgrammeVolSaisonnier.save()
    |
    v
[Audit] UserActivityLog.create (CREATE)
    |
    v
[Response] 201 + { data: programme }
```

### Etat cree
- Programme statut BROUILLON, actif false

---

## PROCESS 3 : VALIDATION PROGRAMME

### Objectif
Valider un programme pour permettre son activation.

### Sequence

```
[Client] POST /api/programmes-vol/:id/valider
    |
    v
[Middlewares] protect, authorize(SUPERVISEUR, MANAGER)
    |
    v
[Controller] validerProgramme
    |
    v
[Service] validerProgrammeVol(programmeId, userId)
    |
    |-- 1. Verifier non deja valide
    |-- 2. Verifier completude (nomProgramme, compagnieAerienne, periode, numeroVolBase)
    |-- 3. validation.valide = true
    |-- 4. validation.validePar = userId
    |-- 5. validation.dateValidation = now()
    |-- 6. statut = VALIDE
    |
    v
[Audit] UserActivityLog.create (VALIDATE)
    |
    v
[Response] 200 + { data: programme }
```

### Transition
BROUILLON -> VALIDE

---

## PROCESS 4 : ACTIVATION PROGRAMME

### Objectif
Activer un programme valide pour qu'il soit operationnel.

### Sequence

```
[Client] POST /api/programmes-vol/:id/activer
    |
    v
[Middlewares] protect, authorize(SUPERVISEUR, MANAGER)
    |
    v
[Controller] activerProgramme
    |
    v
[Service] activerProgrammeVol(programmeId, userId)
    |
    |-- 1. Verifier validation.valide = true
    |-- 2. Verifier non deja actif
    |-- 3. Verifier recurrence.dateFin >= maintenant
    |-- 4. actif = true
    |-- 5. statut = ACTIF
    |
    v
[Audit] UserActivityLog.create (ACTIVATE)
    |
    v
[Response] 200 + { data: programme }
```

### Transition
VALIDE -> ACTIF

---

## PROCESS 5 : LIER VOL A PROGRAMME

### Objectif
Rattacher un vol ponctuel a un programme saisonnier existant.

### Sequence

```
[Client] POST /api/vols/:id/lier-programme
    |-- Body: { programmeVolId }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] lierVolAuProgramme
    |
    v
[Service] vol.service::lierVolAuProgramme
    |
    |-- 1. Verifier vol existe
    |-- 2. Verifier programme existe et actif
    |-- 3. Verifier coherence compagnieAerienne
    |-- 4. Verifier coherence typeOperation
    |-- 5. horsProgramme = false
    |-- 6. programmeVolReference = programmeVolId
    |-- 7. Reset raisonHorsProgramme et typeVolHorsProgramme
    |
    v
[Audit] UserActivityLog.create (UPDATE)
    |
    v
[Response] 200 + { data: vol }
```

---

## PROCESS 6 : MARQUER VOL HORS PROGRAMME

### Objectif
Declarer un vol comme ponctuel (hors planning recurrent).

### Sequence

```
[Client] POST /api/vols/:id/marquer-hors-programme
    |-- Body: { typeVolHorsProgramme, raison }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] marquerVolHorsProgramme
    |
    v
[Service] marquerVolHorsProgramme(volId, type, raison, userId)
    |
    |-- 1. Verifier vol existe
    |-- 2. Valider type (CHARTER, MEDICAL, TECHNIQUE, COMMERCIAL, AUTRE)
    |-- 3. horsProgramme = true
    |-- 4. programmeVolReference = null
    |-- 5. typeVolHorsProgramme = type
    |-- 6. raisonHorsProgramme = raison
    |
    v
[Audit] UserActivityLog.create (UPDATE)
    |
    v
[Response] 200 + { data: vol }
```

---

## PROCESS 7 : SUSPENSION PROGRAMME

### Objectif
Desactiver temporairement un programme actif.

### Sequence

```
[Client] POST /api/programmes-vol/:id/suspendre
    |-- Body: { raison }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] suspendreProgramme
    |
    v
[Service] suspendreProgrammeVol(programmeId, userId, raison)
    |
    |-- 1. Verifier programme actif
    |-- 2. actif = false
    |-- 3. statut = SUSPENDU
    |-- 4. Append raison dans remarques avec timestamp
    |
    v
[Audit] UserActivityLog.create (SUSPEND)
    |
    v
[Response] 200 + { data: programme }
```

### Transition
ACTIF -> SUSPENDU

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Creation vol | POST /vols | HAUTE |
| Creation programme | POST /programmes-vol | MOYENNE |
| Validation programme | POST /:id/valider | HAUTE |
| Activation programme | POST /:id/activer | HAUTE |
| Liaison vol-programme | POST /:id/lier-programme | MOYENNE |
| Marquage hors programme | POST /:id/marquer-hors-programme | MOYENNE |
| Suspension programme | POST /:id/suspendre | HAUTE |

