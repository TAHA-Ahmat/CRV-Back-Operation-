# MVS-9-Transversal - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : AFFECTATION PERSONNEL A UN VOL

### Objectif
Affecter un membre du personnel a un vol avec un role specifique.

### Sequence

```
[Client] POST /api/vols/:id/personnel
    |-- Body: { personneId, role, heureDebut, heureFin, remarques }
    |
    v
[Middlewares] protect, authorize(SUPERVISEUR, MANAGER, ADMIN)
    |
    v
[Controller] vol.controller ou affectation.controller
    |
    |-- 1. Verifier vol existe
    |-- 2. Verifier personne existe
    |-- 3. Verifier disponibilite personne (optionnel)
    |
    v
[Model] AffectationPersonneVol.create({
    vol: volId,
    personne: personneId,
    role,
    heureDebut,
    heureFin,
    statut: 'PREVU'
})
    |
    v
[Response] 201 + { data: affectation }
```

---

## PROCESS 2 : CHANGEMENT STATUT AFFECTATION

### Objectif
Mettre a jour le statut d'une affectation (PREVU -> EN_COURS -> TERMINE).

### Sequence

```
[Client] PUT /api/vols/:id/personnel/:affectationId
    |-- Body: { statut, heureFin }
    |
    v
[Middlewares] protect
    |
    v
[Controller] Gestion affectation
    |
    |-- 1. Verifier affectation existe
    |-- 2. Valider transition statut
    |
    v
[Model] affectation.update({
    statut,
    heureFin: heureFin || now (si TERMINE)
})
    |
    v
[Response] 200 + { data: affectation }
```

### Transitions autorisees

```
PREVU -> EN_COURS -> TERMINE
PREVU -> ANNULE
EN_COURS -> ANNULE
```

---

## PROCESS 3 : DECLARATION EVENEMENT OPERATIONNEL

### Objectif
Declarer un evenement impactant les operations (retard, incident, etc.).

### Sequence

```
[Client] POST /api/crv/:id/evenements
    |-- Body: { typeEvenement, description, heureDebut, gravite, impactPhases }
    |
    v
[Middlewares] protect
    |
    v
[Controller] crv.controller ou evenement.controller
    |
    |-- 1. Verifier CRV existe
    |-- 2. Recuperer vol associe
    |
    v
[Model] EvenementOperationnel.create({
    vol: crv.vol,
    crv: crvId,
    typeEvenement,
    description,
    heureDebut,
    gravite,
    impactPhases,
    declarePar: req.user._id,
    resolu: false
})
    |
    v
[Response] 201 + { data: evenement }
```

---

## PROCESS 4 : RESOLUTION EVENEMENT

### Objectif
Marquer un evenement comme resolu avec actions correctives.

### Sequence

```
[Client] POST /api/crv/:id/evenements/:evenementId/resoudre
    |-- Body: { actionsCorrectives, heureFin }
    |
    v
[Middlewares] protect
    |
    v
[Controller] Gestion evenement
    |
    |-- 1. Verifier evenement existe
    |-- 2. Verifier evenement non deja resolu
    |
    v
[Model] evenement.update({
    resolu: true,
    dateResolution: now,
    heureFin: heureFin || now,
    actionsCorrectives
})
    |
    v
[Pre-save Hook] Calcul dureeImpactMinutes
    |
    v
[Response] 200 + { data: evenement }
```

---

## PROCESS 5 : CALCUL IMPACT EVENEMENTS SUR PHASES

### Objectif
Calculer l'impact cumule des evenements sur les phases operationnelles.

### Sequence

```
[Interne] Appel depuis MVS-3-Phases ou MVS-2-CRV
    |
    v
[Query] EvenementOperationnel.find({ crv: crvId })
    |
    v
[Aggregation]
    |-- 1. Grouper par phase impactee
    |-- 2. Sommer impactMinutes par phase
    |-- 3. Calculer impact total vol
    |
    v
[Retour] {
    impactTotal: Number,
    impactParPhase: [{ phase, minutes }]
}
```

---

## PROCESS 6 : CONSULTATION EQUIPE VOL

### Objectif
Obtenir l'equipe complete affectee a un vol.

### Sequence

```
[Client] GET /api/vols/:id/personnel
    |
    v
[Middlewares] protect
    |
    v
[Query] AffectationPersonneVol.find({ vol: volId })
    |-- Populate: personne (nom, prenom, email)
    |-- Tri: heureDebut ASC
    |
    v
[Response] 200 + {
    data: {
      equipe: [...],
      nbPersonnes: Number
    }
}
```

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Affectation personnel | POST /vols/:id/personnel | MOYENNE |
| Changement statut affectation | PUT /vols/:id/personnel/:id | BASSE |
| Declaration evenement | POST /crv/:id/evenements | HAUTE |
| Resolution evenement | POST /crv/:id/evenements/:id/resoudre | MOYENNE |
| Calcul impact | Interne | MOYENNE |
| Consultation equipe | GET /vols/:id/personnel | BASSE |

