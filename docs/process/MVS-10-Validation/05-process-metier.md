# MVS-10-Validation - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : VALIDATION CRV

### Objectif
Valider un CRV complete par le service Qualite.

### Sequence

```
[Client] POST /api/validation/:crvId/valider
    |-- Body: { commentaires }
    |
    v
[Middlewares] protect, authorize(QUALITE, ADMIN)
    |
    v
[Controller] validerCRVController
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV non deja valide/verrouille
    |-- 3. Calculer scoreCompletude
    |-- 4. Verifier conformite SLA (phases)
    |-- 5. Calculer ecarts SLA
    |
    v
[Model] ValidationCRV.findOneAndUpdate ou create({
    crv: crvId,
    validePar: req.user._id,
    dateValidation: now,
    statut: 'VALIDE',
    scoreCompletude,
    conformiteSLA,
    ecartsSLA,
    commentaires,
    historique: [..., { action: 'VALIDATION', utilisateur, date }]
})
    |
    v
[CRV] crv.statut = 'VALIDE'
    |
    v
[Response] 200 + { data: validation }
```

### Calcul scoreCompletude

| Critere | Poids |
|---------|-------|
| Vol reference | 15% |
| Horaire depart reel | 10% |
| Horaire arrivee reel | 10% |
| Passagers renseignes | 15% |
| Bagages renseignes | 10% |
| Fret renseigne | 10% |
| Phases operationnelles | 20% |
| Engins affectes | 10% |
| **Total** | **100%** |

---

## PROCESS 2 : REJET CRV

### Objectif
Rejeter un CRV incomplet ou incorrect pour correction.

### Sequence

```
[Client] POST /api/validation/:crvId/rejeter
    |-- Body: { commentaires } (obligatoire)
    |
    v
[Middlewares] protect, authorize(QUALITE, ADMIN)
    |
    v
[Controller] rejeterCRVController
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV non verrouille
    |-- 3. Verifier commentaires present
    |
    v
[Model] ValidationCRV.findOneAndUpdate ou create({
    crv: crvId,
    validePar: req.user._id,
    statut: 'REJETE',
    commentaires,
    historique: [..., { action: 'REJET', utilisateur, commentaire }]
})
    |
    v
[CRV] crv.statut = 'EN_COURS' (retour pour correction)
    |
    v
[Response] 200 + { message: 'CRV rejete', data: validation }
```

### Note
Le rejet permet au CRV de retourner en edition pour corrections.

---

## PROCESS 3 : VERROUILLAGE CRV

### Objectif
Verrouiller definitivement un CRV valide.

### Sequence

```
[Client] POST /api/validation/:crvId/verrouiller
    |
    v
[Middlewares] protect, authorize(QUALITE, ADMIN)
    |
    v
[Controller] verrouilleCRVController
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV est VALIDE
    |       Si non VALIDE: return 400
    |
    v
[Model] validation.update({
    verrouille: true,
    dateVerrouillage: now,
    verrouillePar: req.user._id,
    statut: 'VERROUILLE',
    historique: [..., { action: 'VERROUILLAGE', utilisateur }]
})
    |
    v
[CRV] crv.statut = 'VERROUILLE'
    |
    v
[Response] 200 + { message: 'CRV verrouille', data: validation }
```

### Protection
- Aucune modification possible sur CRV verrouille
- Seul ADMIN peut deverrouiller

---

## PROCESS 4 : DEVERROUILLAGE CRV

### Objectif
Deverrouiller un CRV en cas de besoin exceptionnel.

### Sequence

```
[Client] POST /api/validation/:crvId/deverrouiller
    |-- Body: { motif } (obligatoire)
    |
    v
[Middlewares] protect, authorize(ADMIN)
    |
    v
[Controller] deverrouillerCRVController
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV est verrouille
    |-- 3. Verifier motif present
    |
    v
[Model] validation.update({
    verrouille: false,
    statut: 'VALIDE',
    historique: [..., { action: 'DEVERROUILLAGE', utilisateur, commentaire: motif }]
})
    |
    v
[CRV] crv.statut = 'VALIDE'
    |
    v
[Response] 200 + { message: 'CRV deverrouille', data: validation }
```

### Restriction
- Operation ADMIN uniquement
- Motif obligatoire pour tracabilite

---

## PROCESS 5 : CONSULTATION VALIDATION

### Objectif
Consulter l'etat de validation d'un CRV.

### Sequence

```
[Client] GET /api/validation/:crvId
    |
    v
[Middlewares] protect
    |
    v
[Controller] obtenirValidationCRV
    |
    v
[Query] ValidationCRV.findOne({ crv: crvId })
    |-- Populate: crv, validePar, verrouillePar
    |-- Populate: ecartsSLA.phase, historique.utilisateur
    |
    v
[Response] 200 + { data: validation }
         ou 404 si pas de validation
```

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Validation CRV | POST /validation/:id/valider | HAUTE |
| Rejet CRV | POST /validation/:id/rejeter | HAUTE |
| Verrouillage CRV | POST /validation/:id/verrouiller | CRITIQUE |
| Deverrouillage CRV | POST /validation/:id/deverrouiller | CRITIQUE |
| Consultation | GET /validation/:id | BASSE |

---

## Machine a etats CRV

```
         ┌──────────────────────────────────┐
         │                                  │
         v                                  │
   [BROUILLON] ──> [EN_COURS] ──> [TERMINE] │
                        │             │     │
                        │             v     │
                        │ <── [VALIDE] ────>│
                        │        │          │
                        │        v          │
                        │   [VERROUILLE]    │
                        │        │          │
                        │        │ (ADMIN)  │
                        │        v          │
                        └─── [VALIDE] <─────┘
```

