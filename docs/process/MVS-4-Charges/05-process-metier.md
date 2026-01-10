# MVS-4-Charges - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION CHARGE OPERATIONNELLE

### Objectif
Creer une charge liee a un CRV (passagers, bagages ou fret).

### Sequence

```
[Trigger] Controller CRV ou creation directe
    |
    v
[Model] ChargeOperationnelle.create({
    crv: crvId,
    typeCharge: 'PASSAGERS' | 'BAGAGES' | 'FRET',
    sensOperation: 'EMBARQUEMENT' | 'DEBARQUEMENT'
})
    |
    |-- Champs null par defaut (REGLE VIDE =/= ZERO)
    |
    v
[Return] Charge creee
```

### Etats crees
- 1 ChargeOperationnelle avec champs a null

---

## PROCESS 2 : MISE A JOUR CATEGORIES DETAILLEES (Extension 4)

### Objectif
Enrichir une charge PASSAGERS avec les categories detaillees.

### Sequence

```
[Client] PUT /api/charges/:id/categories-detaillees
    |-- Body: { bebes, enfants, adolescents, ... }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] mettreAJourCategoriesDetaillees
    |
    v
[Service] passager.service::mettreAJourCategoriesDetaillees
    |
    |-- 1. Verifier charge existe
    |-- 2. Merge avec categoriesPassagersDetaillees existantes
    |-- 3. utiliseCategoriesDetaillees = true
    |
    v
[Model] charge.save()
    |
    v
[Audit] UserActivityLog.create (UPDATE)
    |
    v
[Response] 200 + { data: charge }
```

### Transition
- utiliseCategoriesDetaillees: false -> true

---

## PROCESS 3 : CONVERSION CATEGORIES BASIQUES -> DETAILLEES

### Objectif
Migrer une charge des categories basiques vers les detaillees.

### Sequence

```
[Client] POST /api/charges/:id/convertir-categories-detaillees
    |-- Body: { mapping?: object }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] convertirVersCategoriesDetaillees
    |
    v
[Service] convertirVersCategoriesDetaillees(chargeId, mapping, userId)
    |
    |-- 1. Verifier charge existe
    |-- 2. Verifier utiliseCategoriesDetaillees = false
    |       Si deja true: throw Error
    |-- 3. Appliquer mapping (defaut ou personnalise)
    |       passagersAdultes -> adultes
    |       passagersEnfants -> enfants
    |       passagersPMR -> pmrFauteuilRoulant
    |       passagersTransit -> transitLocal
    |-- 4. utiliseCategoriesDetaillees = true
    |
    v
[Model] charge.save()
    |
    v
[Audit] UserActivityLog.create (CONVERT)
    |
    v
[Response] 200 + { data: charge }
```

---

## PROCESS 4 : AJOUT MARCHANDISE DANGEREUSE (Extension 5)

### Objectif
Declarer une marchandise dangereuse dans une charge FRET.

### Sequence

```
[Client] POST /api/charges/:id/marchandises-dangereuses
    |-- Body: { codeONU, classeONU, designationOfficielle, quantite, ... }
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] ajouterMarchandiseDangereuse
    |
    v
[Service] fret.service::ajouterMarchandiseDangereuse
    |
    |-- 1. Verifier charge existe
    |-- 2. Verifier typeCharge = FRET
    |       Si non: throw Error("pas de type FRET")
    |-- 3. Valider champs requis (codeONU, classeONU, designationOfficielle)
    |-- 4. fretDetaille.marchandisesDangereuses.present = true
    |-- 5. Push dans details
    |-- 6. utiliseFretDetaille = true
    |
    v
[Model] charge.save()
    |
    v
[Audit] UserActivityLog.create (ADD)
    |
    v
[Response] 201 + { data: charge }
```

---

## PROCESS 5 : VALIDATION MARCHANDISE DANGEREUSE

### Objectif
Valider la conformite d'une marchandise dangereuse avant ajout.

### Sequence

```
[Client] POST /api/charges/valider-marchandise-dangereuse
    |-- Body: { codeONU, classeONU, quantite, groupeEmballage, ... }
    |
    v
[Middlewares] protect
    |
    v
[Controller] validerMarchandiseDangereuse
    |
    v
[Service] fret.service::validerMarchandiseDangereuse
    |
    |-- 1. Valider code ONU (format UN suivi de 4 chiffres)
    |-- 2. Valider classe ONU (1 a 9)
    |-- 3. Valider quantite > 0
    |-- 4. Valider groupe emballage (I, II, III)
    |-- 5. Avertissements (designation manquante, classe 1 sans numero)
    |
    v
[Response] 200 + { valide, erreurs, avertissements }
```

---

## PROCESS 6 : RETRAIT MARCHANDISE DANGEREUSE

### Objectif
Retirer une marchandise dangereuse d'une charge FRET.

### Sequence

```
[Client] DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
    |
    v
[Middlewares] protect, excludeQualite
    |
    v
[Controller] retirerMarchandiseDangereuse
    |
    v
[Service] fret.service::retirerMarchandiseDangereuse
    |
    |-- 1. Verifier charge existe
    |-- 2. Trouver marchandise par subdoc ID
    |-- 3. remove() sur subdocument
    |-- 4. Si plus de marchandises: present = false
    |
    v
[Model] charge.save()
    |
    v
[Audit] UserActivityLog.create (REMOVE)
    |
    v
[Response] 200 + { data: charge }
```

---

## PROCESS 7 : CALCUL STATISTIQUES PAR CRV

### Objectif
Obtenir les statistiques detaillees pour un CRV donne.

### Sequence

```
[Client] GET /api/charges/crv/:crvId/statistiques-passagers
         GET /api/charges/crv/:crvId/statistiques-fret
    |
    v
[Middlewares] protect
    |
    v
[Controller] obtenirStatistiques*
    |
    v
[Service] obtenirStatistiques*CRV(crvId)
    |
    |-- 1. ChargeOperationnelle.find({ crv: crvId, typeCharge })
    |-- 2. Agregation des totaux par categorie
    |-- 3. Separation par sensOperation
    |
    v
[Response] 200 + { data: statistiques }
```

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Creation charge | POST CRV | HAUTE |
| MAJ categories detaillees | PUT | MOYENNE |
| Conversion categories | POST | MOYENNE |
| Ajout marchandise DG | POST | CRITIQUE |
| Validation DG | POST | HAUTE |
| Retrait DG | DELETE | HAUTE |
| Calcul statistiques | GET | NORMALE |

