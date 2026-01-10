# MVS-6-Resources - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION ENGIN DANS LE PARC

### Objectif
Ajouter un nouvel engin au referentiel du parc materiel.

### Sequence

```
[Client] POST /api/engins
    |-- Body: { numeroEngin, typeEngin, marque, modele, remarques }
    |
    v
[Middlewares] protect, authorize(MANAGER, ADMIN), validate
    |
    v
[Controller] creerEngin
    |
    |-- 1. Verifier unicite numeroEngin
    |       Si existe: return 400 ENGIN_DUPLIQUE
    |
    v
[Model] Engin.create({
    numeroEngin: uppercase,
    typeEngin,
    marque,
    modele,
    remarques,
    statut: 'DISPONIBLE'
})
    |
    v
[Response] 201 + { data: engin }
```

### Etat cree
- Engin avec statut DISPONIBLE

---

## PROCESS 2 : AFFECTATION ENGINS A UN CRV

### Objectif
Affecter des engins au vol lie a un CRV.

### Sequence

```
[Client] PUT /api/crv/:id/engins
    |-- Body: { engins: [ { type, immatriculation, heureDebut, heureFin, usage } ] }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] mettreAJourEnginsAffectes
    |
    |-- 1. Valider format (engins est Array)
    |-- 2. Verifier CRV existe
    |-- 3. Verifier CRV non verrouille
    |-- 4. Supprimer toutes affectations existantes
    |
    v
[Loop] Pour chaque engin
    |
    |-- 5. Chercher engin par numeroEngin
    |-- 6. Si non trouve: Creer engin automatiquement
    |       - Mapper type frontend -> typeEngin
    |-- 7. Mapper type frontend -> usage
    |-- 8. Construire dates depuis heures HH:mm
    |
    v
[Model] AffectationEnginVol.create({
    vol: volId,
    engin: enginId,
    heureDebut,
    heureFin,
    usage,
    statut
})
    |
    v
[Populate] engin
    |
    v
[Response] 200 + { data: { engins, nbEngins } }
```

### Comportement specifique
- Remplacement complet (delete all + create new)
- Creation automatique d'engins non existants

---

## PROCESS 3 : AJOUT UNITAIRE ENGIN A CRV

### Objectif
Ajouter un seul engin a un CRV existant.

### Sequence

```
[Client] POST /api/crv/:id/engins
    |-- Body: { enginId, heureDebut, heureFin, usage, remarques }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] ajouterEnginAuCRV
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV non verrouille
    |-- 3. Verifier engin existe dans referentiel
    |
    v
[Model] AffectationEnginVol.create({
    vol: volId,
    engin: enginId,
    heureDebut: heureDebut || now,
    heureFin,
    usage,
    remarques
})
    |
    v
[Response] 201 + { data: affectation }
```

---

## PROCESS 4 : RETRAIT ENGIN D'UN CRV

### Objectif
Retirer un engin d'un CRV.

### Sequence

```
[Client] DELETE /api/crv/:id/engins/:affectationId
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] retirerEnginDuCRV
    |
    |-- 1. Verifier CRV existe
    |-- 2. Verifier CRV non verrouille
    |-- 3. Verifier affectation existe
    |
    v
[Model] affectation.deleteOne()
    |
    v
[Response] 200 + { message: 'Engin retire du vol' }
```

---

## PROCESS 5 : SUPPRESSION ENGIN DU PARC

### Objectif
Supprimer un engin du referentiel.

### Sequence

```
[Client] DELETE /api/engins/:id
    |
    v
[Middlewares] protect, authorize(ADMIN)
    |
    v
[Controller] supprimerEngin
    |
    |-- 1. Verifier engin existe
    |-- 2. Compter affectations existantes
    |       Si > 0: return 400 ENGIN_EN_UTILISATION
    |
    v
[Model] engin.deleteOne()
    |
    v
[Response] 200 + { message: 'Engin supprime' }
```

### Protection
- Suppression impossible si historique d'affectations existe

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Creation engin | POST /engins | MOYENNE |
| Affectation engins CRV | PUT /crv/:id/engins | HAUTE |
| Ajout unitaire | POST /crv/:id/engins | MOYENNE |
| Retrait engin | DELETE /crv/:id/engins/:id | MOYENNE |
| Suppression engin | DELETE /engins/:id | HAUTE |

