# MVS-4-Charges - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Regle VIDE =/= ZERO

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Champs null vs 0 | ChargeOperationnelle.js:L20-44 | CRITIQUE |

**Regle metier** :
- `null` = donnee non saisie (champ vide)
- `0` = valeur explicite (zero passager saisi intentionnellement)

**Impact** : Calcul de completude CRV

**Modifications INTERDITES** :
- Suppression des valeurs default: null
- Remplacement de null par 0 automatiquement
- Modification de la logique des virtuals totalPassagers/totalBagages

---

### 1.2 Virtual totalPassagers

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| totalPassagers.get | ChargeOperationnelle.js:L583-596 | CRITIQUE |

**Logique** :
- Retourne null si TOUS les champs sont null
- Retourne le total si AU MOINS UN champ est renseigne (null traite comme 0 pour le calcul)

**Modifications INTERDITES** :
- Modification de la condition de retour null
- Changement de la logique de fallback null || 0

---

### 1.3 Marchandises Dangereuses

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Validation DGR | fret.service.js:L361-404 | CRITIQUE |
| Schema details | ChargeOperationnelle.js:L352-399 | HAUTE |

**Validations obligatoires** :
- Code ONU format UN + 4 chiffres
- Classe ONU 1 a 9
- Quantite > 0
- Groupe emballage I, II, III

**Risque** : Non-conformite reglementaire aeronautique IATA DGR

---

### 1.4 Flag utiliseCategoriesDetaillees

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| utiliseCategoriesDetaillees | ChargeOperationnelle.js:L202-206 | HAUTE |

**Role** : Determine quelle virtual utiliser (totalPassagers vs totalPassagersDetailles)

**Modifications INTERDITES** :
- Changement de la valeur par defaut (false)
- Suppression du flag de compatibilite

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| ChargeOperationnelle | CRV | N:1 obligatoire |
| ChargeOperationnelle.fretDetaille.marchandisesDangereuses | Subdocument | Imbrication |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| typeCharge | ChargeOperationnelle | Enum PASSAGERS/BAGAGES/FRET |
| sensOperation | ChargeOperationnelle | Enum EMBARQUEMENT/DEBARQUEMENT |
| passagers* | ChargeOperationnelle | Regle VIDE =/= ZERO |
| marchandisesDangereuses.codeONU | Subdocument | Format ONU valide |
| marchandisesDangereuses.classeONU | Subdocument | Classe 1 a 9 |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Enum typeCharge | Structure fondamentale |
| Enum sensOperation | Logique embarquement/debarquement |
| Default null pour passagers* | Regle VIDE =/= ZERO |
| Virtual totalPassagers | Calcul completude CRV |
| Schema marchandisesDangereuses.details | Conformite IATA DGR |
| Flag utiliseCategoriesDetaillees | Compatibilite ascendante |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Champs passagers* ont default: null (pas 0)
- [ ] Virtual totalPassagers retourne null si tous champs null
- [ ] Flag utiliseCategoriesDetaillees = false par defaut
- [ ] Validation code ONU format UN + 4 chiffres
- [ ] Validation classe ONU 1-9
- [ ] fretDetaille.marchandisesDangereuses.present mis a jour
- [ ] Audit log genere pour toutes les operations

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Charge avec tous champs null -> totalPassagers = null | P0 |
| Charge avec au moins un champ 0 -> totalPassagers = calcul | P0 |
| Ajout DG avec code ONU invalide -> rejet | P0 |
| Ajout DG avec classe ONU invalide -> rejet | P0 |
| Conversion deja en categories detaillees -> erreur | P1 |
| Retrait derniere DG -> present = false | P1 |
| typeCharge != FRET + fret-detaille -> erreur | P1 |

---

## 7. COMPATIBILITE EXTENSIONS

### Extension 4 (Categories Passagers Detaillees)
- **Non-regression** : Tous les champs OPTIONNELS avec default 0
- **Charges existantes** : Automatiquement toutes categories a 0
- **Champs originaux** : passagersAdultes, passagersEnfants, passagersPMR, passagersTransit INCHANGES

### Extension 5 (Fret Detaille)
- **Non-regression** : Tous les champs OPTIONNELS
- **Champs originaux** : nombreFret, poidsFretKg, typeFret INCHANGES
- **fretDetaille** : Subdocument entierement additionnel

