# MVS-2-CRV - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION CRV

### Objectif metier
Creer un nouveau Compte Rendu de Vol pour documenter les operations au sol d'un vol.

### Sequence exacte

```
[Client] POST /api/crv
    |-- Header: Authorization: Bearer <token>
    |-- Body: { volId?, responsableVolId?, type?, date? }
    |
    v
[Middleware] protect
    |-- Verification JWT
    |
    v
[Middleware] excludeQualite
    |-- Verification role !== 'QUALITE'
    |-- Si QUALITE: return 403
    |
    v
[Middleware] validate
    |-- Validation body
    |
    v
[Middleware] verifierPhasesAutoriseesCreationCRV
    |-- Verification phases initiales
    |
    v
[Middleware] auditLog('CREATION')
    |-- Preparation log audit
    |
    v
[Controller] crv.controller.js::creerCRV
    |
    |-- 1. SI volId absent:
    |       |
    |       v
    |   [Model] Vol.create({...})
    |       |-- Generation numeroVol auto
    |       |-- typeOperation selon type CRV
    |       volId = vol._id
    |
    |-- 2. SI volId fourni:
    |       |
    |       v
    |   [Model] Vol.findById(volId)
    |       |-- Si non trouve: return 404
    |
    v
[Service] crv.service.js::genererNumeroCRV(vol)
    |
    |-- 3. Format: CRV{YY}{MM}{DD}-{NNNN}
    |-- Count CRV du jour + 1
    |
    v
[Model] Horaire.create({ vol: volId })
    |
    |-- 4. Creation Horaire vide lie au vol
    |
    v
[Model] CRV.create({...})
    |
    |-- 5. Creation CRV avec:
    |       - numeroCRV
    |       - vol: volId
    |       - horaire: horaire._id
    |       - creePar: req.user._id
    |       - statut: 'BROUILLON'
    |
    v
[Service] phase.service.js::initialiserPhasesVol(crvId, typeOperation)
    |
    |-- 6. Creation ChronologiePhase pour chaque phase du referentiel
    |
    v
[Service] crv.service.js::calculerCompletude(crvId)
    |
    |-- 7. Calcul completude initiale (30% = evenements + observations)
    |
    v
[Model] CRV.findById(crv._id).populate(...)
    |
    |-- 8. Reload avec populate complet
    |
    v
[Middleware] auditLog (post)
    |
    |-- 9. Log creation
    |
    v
[Response] 201 + { success: true, data: crvPopulated }
```

### Etats modifies
- Collection Vol : +1 document (si creation auto)
- Collection Horaire : +1 document
- Collection CRV : +1 document
- Collection ChronologiePhase : +N documents (phases initiales)

### Donnees creees

| Entite | Champs cles |
|--------|-------------|
| CRV | numeroCRV, vol, horaire, creePar, statut='BROUILLON' |
| Horaire | vol |
| ChronologiePhase[] | crv, phase, statut='NON_COMMENCE' |
| Vol (optionnel) | numeroVol, typeOperation |

### Conditions de succes
1. Token JWT valide
2. Role !== QUALITE
3. Si volId fourni : vol existe
4. Escale valide

### Conditions d'echec
| Condition | Code HTTP | Message |
|-----------|-----------|---------|
| Token invalide | 401 | Middleware protect |
| Role QUALITE | 403 | Middleware excludeQualite |
| Vol non trouve | 404 | "Vol non trouve" |

---

## PROCESS 2 : CYCLE DE VIE CRV

### Objectif metier
Gerer les transitions d'etat du CRV de sa creation a son verrouillage final.

### Machine a etats

```
                     ┌─────────────┐
                     │  BROUILLON  │ (creation)
                     └──────┬──────┘
                            │ POST /:id/demarrer
                            v
                     ┌─────────────┐
              ┌──────│   EN_COURS  │◄─────┐
              │      └──────┬──────┘      │
              │             │             │
              │ retour      │ POST        │ correction
              │ brouillon   │ /:id/       │
              │             │ terminer    │
              │             v             │
              │      ┌─────────────┐      │
              └─────►│   TERMINE   │──────┘
                     └──────┬──────┘
                            │ (validation externe)
                            v
                     ┌─────────────┐
                     │   VALIDE    │
                     └──────┬──────┘
                            │ (verrouillage)
                            v
                     ┌─────────────┐
                     │  VERROUILLE │ (final)
                     └─────────────┘

                     ┌─────────────┐
        Tout statut ─┤   ANNULE    │ (via POST /:id/annuler)
                     └─────────────┘
```

### Transitions autorisees

| Depuis | Vers | Route | Condition |
|--------|------|-------|-----------|
| BROUILLON | EN_COURS | POST /:id/demarrer | - |
| EN_COURS | TERMINE | POST /:id/terminer | completude >= 50% |
| EN_COURS | BROUILLON | PATCH /:id | - |
| TERMINE | EN_COURS | PATCH /:id | - |
| TERMINE | VALIDE | (validation MVS-10) | - |
| VALIDE | VERROUILLE | (validation MVS-10) | - |
| * | ANNULE | POST /:id/annuler | non verrouille |
| ANNULE | (ancien) | POST /:id/reactiver | - |

---

## PROCESS 3 : AJOUT CHARGE OPERATIONNELLE

### Objectif metier
Documenter les flux de passagers, bagages ou fret traites lors du vol.

### Sequence exacte

```
[Client] POST /api/crv/:id/charges
    |-- Body: { typeCharge, sensOperation, ... }
    |
    v
[Middlewares] protect, excludeQualite, verifierCRVNonVerrouille
    |
    v
[Middleware] validate
    |-- typeCharge in ['PASSAGERS', 'BAGAGES', 'FRET']
    |-- sensOperation in ['EMBARQUEMENT', 'DEBARQUEMENT']
    |
    v
[Middleware] validerCoherenceCharges
    |-- Verification coherence donnees
    |
    v
[Controller] ajouterCharge
    |
    |-- 1. Verification CRV existe
    |-- 2. Verification CRV non verrouille
    |
    v
[Model] ChargeOperationnelle.create({...})
    |
    |-- 3. Creation charge avec crv: crvId
    |
    v
[Service] calculerCompletude(crvId)
    |
    |-- 4. Recalcul completude (+30% si charges presentes)
    |
    v
[Response] 201 + { data: charge }
```

### Etats modifies
- Collection ChargeOperationnelle : +1 document
- CRV.completude : recalcule

---

## PROCESS 4 : SUPPRESSION CRV

### Objectif metier
Supprimer un CRV et toutes ses donnees associees (suppression en cascade).

### Sequence exacte

```
[Client] DELETE /api/crv/:id
    |
    v
[Middlewares] protect, authorize('SUPERVISEUR', 'MANAGER'), auditLog
    |
    v
[Controller] supprimerCRV
    |
    |-- 1. Verification CRV existe
    |       Si non: return 404
    |
    |-- 2. Verification statut !== 'VERROUILLE'
    |       Si verrouille: return 403 (code: CRV_VERROUILLE)
    |
    v
[Model] ChronologiePhase.deleteMany({ crv: crvId })
    |-- 3. Suppression phases
    |
    v
[Model] ChargeOperationnelle.deleteMany({ crv: crvId })
    |-- 4. Suppression charges
    |
    v
[Model] EvenementOperationnel.deleteMany({ crv: crvId })
    |-- 5. Suppression evenements
    |
    v
[Model] Observation.deleteMany({ crv: crvId })
    |-- 6. Suppression observations
    |
    v
[Model] Horaire.findByIdAndDelete(crv.horaire)
    |-- 7. Suppression horaire
    |
    v
[Model] CRV.findByIdAndDelete(crvId)
    |-- 8. Suppression CRV
    |
    v
[Response] 200 + { message: 'CRV et donnees associees supprimes' }
```

### Etats modifies
- Collection CRV : -1 document
- Collection ChronologiePhase : -N documents
- Collection ChargeOperationnelle : -N documents
- Collection EvenementOperationnel : -N documents
- Collection Observation : -N documents
- Collection Horaire : -1 document

### Conditions d'echec
| Condition | Code HTTP | Message |
|-----------|-----------|---------|
| CRV non trouve | 404 | "CRV non trouve" |
| CRV verrouille | 403 | code: CRV_VERROUILLE |
| Role non autorise | 403 | Middleware authorize |

---

## PROCESS 5 : CALCUL COMPLETUDE

### Objectif metier
Evaluer le taux de completion du CRV selon les regles metier.

### Sequence exacte

```
[Trigger] Appel service calculerCompletude(crvId)
    |-- Declencheurs: creation CRV, ajout donnees, modification phase
    |
    v
[Service] crv.service.js::calculerCompletude
    |
    |-- 1. Charger CRV avec vol et horaire
    |
    v
[Query] ChronologiePhase.find({ crv: crvId })
    |
    |-- 2. Compter phases terminees/non-realisees
    |-- scorePhases = (terminees / total) * 40
    |
    v
[Query] ChargeOperationnelle.find({ crv: crvId })
    |
    |-- 3. Compter charges avec donnees saisies
    |-- Si 3+ types: 30 pts
    |-- Si 2 types: 25 pts
    |-- Si 1 type: 20 pts
    |-- Si 0: 0 pts
    |
    v
[Score fixe] Evenements = 20 pts (toujours)
    |
    |-- 4. Absence evenement = vol nominal
    |
    v
[Score fixe] Observations = 10 pts (toujours)
    |
    |-- 5. Absence observation = rien a signaler
    |
    v
[Calcul] completude = scorePhases + scoreCharges + 20 + 10
    |
    v
[Model] CRV.findByIdAndUpdate(crvId, { completude })
    |
    |-- 6. Mise a jour CRV
    |
    v
[Return] completude (0-100)
```

### Ponderation officielle

| Composant | Poids | Calcul |
|-----------|-------|--------|
| Phases | 40% | Pro-rata terminees |
| Charges | 30% | 20-30 selon nb types |
| Evenements | 20% | Toujours attribue |
| Observations | 10% | Toujours attribue |

---

## SYNTHESE PROCESS MVS-2-CRV

| Process | Type | Criticite |
|---------|------|-----------|
| Creation CRV | METIER | CRITIQUE |
| Cycle de vie | METIER | CRITIQUE |
| Ajout charge | METIER | HAUTE |
| Suppression CRV | CRUD | HAUTE |
| Calcul completude | SERVICE | CRITIQUE |
