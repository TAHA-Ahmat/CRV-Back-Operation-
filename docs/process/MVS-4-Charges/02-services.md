# MVS-4-Charges - SERVICES

## Date d'audit : 2026-01-10

---

## passager.service.js

### Emplacement
`src/services/charges/passager.service.js`

### Description
Service NOUVEAU pour gerer les categories detaillees de passagers (Extension 4).

---

### mettreAJourCategoriesDetaillees(chargeId, categoriesDetaillees, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour les categories detaillees de passagers |
| Parametres | chargeId (String), categoriesDetaillees (Object), userId (String) |
| Retour | Charge mise a jour |
| Validations | Verification existence charge |
| Side effects | Passe utiliseCategoriesDetaillees a true |
| Audit | UserActivityLog.create (action: UPDATE) |

---

### mettreAJourClassePassagers(chargeId, classePassagers, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour les classes de passagers |
| Parametres | chargeId, classePassagers (Object), userId |
| Retour | Charge mise a jour |
| Audit | UserActivityLog.create (action: UPDATE) |

---

### mettreAJourBesoinsMedicaux(chargeId, besoinsMedicaux, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour les besoins medicaux des passagers |
| Parametres | chargeId, besoinsMedicaux (Object), userId |
| Retour | Charge mise a jour |
| Audit | UserActivityLog.create (action: UPDATE) |

---

### mettreAJourMineurs(chargeId, mineurs, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour les informations sur les mineurs |
| Parametres | chargeId, mineurs (Object), userId |
| Retour | Charge mise a jour |
| Audit | UserActivityLog.create (action: UPDATE) |

---

### obtenirStatistiquesPassagersCRV(crvId)

| Element | Detail |
|---------|--------|
| Role | Calcule les statistiques passagers pour un CRV |
| Parametre | crvId (String) |
| Retour | Object statistiques detaillees |

**Structure retour** :
```javascript
{
  totalPassagers: Number,
  categoriesBasiques: { adultes, enfants, pmr, transit },
  categoriesDetaillees: { bebes, enfants, ... },
  classes: { premiere, affaires, economique },
  besoinsMedicaux: { oxygeneBord, brancardier, accompagnementMedical },
  mineurs: { mineurNonAccompagne, bebeNonAccompagne },
  parSens: {
    embarquement: { total, detailles },
    debarquement: { total, detailles }
  }
}
```

---

### obtenirStatistiquesGlobalesPassagers(filtres)

| Element | Detail |
|---------|--------|
| Role | Calcule les statistiques globales de toutes les charges PASSAGERS |
| Parametre | filtres (Object) - dateDebut, dateFin, compagnie |
| Retour | Object statistiques globales |

**Structure retour** :
```javascript
{
  totalCharges: Number,
  chargesAvecCategoriesDetaillees: Number,
  chargesSansCategoriesDetaillees: Number,
  totalPassagersGlobal: Number,
  repartitionPMR: { fauteuilRoulant, marcheAssistee, nonVoyant, sourd },
  repartitionClasses: { premiere, affaires, economique },
  besoinsMedicauxGlobal: { oxygeneBord, brancardier, accompagnementMedical }
}
```

---

### convertirVersCategoriesDetaillees(chargeId, mapping, userId)

| Element | Detail |
|---------|--------|
| Role | Convertit les categories basiques en detaillees |
| Parametres | chargeId, mapping (Object optionnel), userId |
| Retour | Charge convertie |
| Validation | Refuse si deja en categories detaillees |
| Audit | UserActivityLog.create (action: CONVERT) |

**Mapping par defaut** :
```javascript
{
  passagersAdultes: 'adultes',
  passagersEnfants: 'enfants',
  passagersPMR: 'pmrFauteuilRoulant',
  passagersTransit: 'transitLocal'
}
```

---

## fret.service.js

### Emplacement
`src/services/charges/fret.service.js`

### Description
Service NOUVEAU pour gerer le fret detaille (Extension 5).

---

### mettreAJourFretDetaille(chargeId, fretDetaille, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour le fret detaille |
| Parametres | chargeId, fretDetaille (Object), userId |
| Retour | Charge mise a jour |
| Validations | Charge existe, typeCharge = FRET |
| Side effects | Passe utiliseFretDetaille a true |
| Audit | UserActivityLog.create (action: UPDATE) |

**Sections gerees** :
- categoriesFret
- marchandisesDangereuses
- logistique
- douanes
- conditionsTransport
- remarquesFret

---

### ajouterMarchandiseDangereuse(chargeId, marchandise, userId)

| Element | Detail |
|---------|--------|
| Role | Ajoute une marchandise dangereuse a une charge FRET |
| Parametres | chargeId, marchandise (Object), userId |
| Retour | Charge mise a jour |
| Validations | codeONU, classeONU, designationOfficielle requis |
| Side effects | present = true, push dans details |
| Audit | UserActivityLog.create (action: ADD) |

---

### retirerMarchandiseDangereuse(chargeId, marchandiseId, userId)

| Element | Detail |
|---------|--------|
| Role | Retire une marchandise dangereuse |
| Parametres | chargeId, marchandiseId (subdoc ID), userId |
| Retour | Charge mise a jour |
| Side effects | present = false si plus de marchandises |
| Audit | UserActivityLog.create (action: REMOVE) |

---

### obtenirStatistiquesFretCRV(crvId)

| Element | Detail |
|---------|--------|
| Role | Calcule les statistiques fret pour un CRV |
| Parametre | crvId |
| Retour | Object statistiques |

**Structure retour** :
```javascript
{
  totalCharges: Number,
  poidsTotal: Number,
  volumeTotal: Number,
  nombreColisTotal: Number,
  categoriesFret: { postal, courrierExpress, ... },
  marchandisesDangereuses: { chargesAvecDG, totalMarchandisesDG, parClasse },
  logistique: { nombrePalettes, nombreConteneurs, colisHorsDimensions },
  conditionsSpeciales: { temperatureControlee, chaineduFroid, fragile },
  parSens: { embarquement, debarquement }
}
```

---

### obtenirChargesAvecMarchandisesDangereuses(filtres)

| Element | Detail |
|---------|--------|
| Role | Liste les charges FRET avec marchandises dangereuses |
| Parametre | filtres.crvId (optionnel) |
| Retour | Array de charges |
| Populate | crv (numeroCRV, dateCreation) |

---

### validerMarchandiseDangereuse(marchandise)

| Element | Detail |
|---------|--------|
| Role | Valide la conformite d'une marchandise dangereuse |
| Parametre | marchandise (Object) |
| Retour | { valide, erreurs, avertissements } |

**Validations** :
- Code ONU format UN suivi de 4 chiffres
- Classe ONU entre 1 et 9
- Quantite > 0
- Groupe emballage I, II ou III

---

### obtenirStatistiquesGlobalesFret(filtres)

| Element | Detail |
|---------|--------|
| Role | Calcule les statistiques globales de toutes les charges FRET |
| Parametre | filtres (dateDebut, dateFin, compagnie) |
| Retour | Object statistiques globales |

---

## calcul.service.js

### Emplacement
`src/services/charges/calcul.service.js`

### Description
Service CRITIQUE pour les calculs de durees uniques et fiables.

---

### calculerDureeMinutes(dateDebut, dateFin)

| Element | Detail |
|---------|--------|
| Role | Calcule la duree entre deux dates en minutes |
| Retour | Number (minutes) ou null |
| Validation | Dates valides, fin >= debut |

---

### calculerEcartDuree(debutPrevu, finPrevue, debutReel, finReelle)

| Element | Detail |
|---------|--------|
| Role | Calcule l'ecart entre duree reelle et prevue |
| Retour | { dureeReelle, dureePrevue, ecart } |

---

### calculerEcartHoraire(heurePrevue, heureReelle)

| Element | Detail |
|---------|--------|
| Role | Calcule l'ecart entre heure prevue et reelle |
| Retour | Number (positif = retard, negatif = avance) |

---

### validerCoherenceDuree(phase)

| Element | Detail |
|---------|--------|
| Role | Valide coherence duree stockee vs calculee |
| Tolerance | 1 minute pour arrondi |
| Retour | Boolean |

---

### calculerStatistiquesDurees(phases)

| Element | Detail |
|---------|--------|
| Role | Calcule statistiques sur un ensemble de phases |
| Retour | { nombrePhases, dureeTotal, dureeMoyenne, dureeMin, dureeMax } |

---

### formaterDuree(minutes)

| Element | Detail |
|---------|--------|
| Role | Formate une duree en "Xh Ymin" |
| Cas null | "Non calcule" |
| Cas 0 | "0 min" |

---

### verifierDureeNonNulle(phase)

| Element | Detail |
|---------|--------|
| Role | Detecte les phases TERMINE avec duree 0 (suspect) |
| Retour | { valide, message } |

