# MVS-6-Resources - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Unicite numeroEngin

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification unicite | engin.controller.js:L79 | CRITIQUE |
| Index unique | Engin.js:L30 | CRITIQUE |

**Risque** : Doublon d'engin dans le parc

**Modifications INTERDITES** :
- Suppression de la verification d'unicite
- Suppression de l'index unique

---

### 1.2 Protection suppression engin

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification affectations | engin.controller.js:L160-167 | HAUTE |

**Regle** : Un engin avec historique d'affectations ne peut pas etre supprime

**Risque** : Perte d'integrite referentielle si suppression forcee

---

### 1.3 Verrouillage CRV

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification CRV.statut | engin.controller.js:L269-274 | HAUTE |

**Regle** : Affectation impossible sur CRV VERROUILLE

**Modifications INTERDITES** :
- Bypass du controle de verrouillage
- Modification des affectations sur CRV verrouille

---

### 1.4 Creation automatique engin

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Creation a la volee | engin.controller.js:L289-311 | MOYENNE |

**Comportement** : Si immatriculation non trouvee dans Engin, creation automatique

**Risque** : Proliferation d'engins non valides

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| AffectationEnginVol | Vol | N:1 obligatoire |
| AffectationEnginVol | Engin | N:1 obligatoire |
| Routes /crv/:id/engins | CRV | Couplage fort |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| Engin.numeroEngin | Engin | Unique, cle metier |
| Engin.typeEngin | Engin | Enum contrainte |
| Engin.statut | Engin | Machine a etats |
| AffectationEnginVol.usage | AffectationEnginVol | Enum contrainte |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Enum typeEngin | Classification materiel |
| Enum usage AffectationEnginVol | Tracabilite utilisation |
| Enum statut Engin | Machine a etats |
| Unicite numeroEngin | Integrite referentiel |
| Protection suppression si affectations | Integrite historique |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] numeroEngin reste unique
- [ ] Suppression engin avec affectations bloquee
- [ ] Modification affectations sur CRV verrouille bloquee
- [ ] Creation engin par MANAGER ou ADMIN uniquement
- [ ] Suppression engin par ADMIN uniquement
- [ ] Mapping type frontend -> typeEngin coherent
- [ ] Mapping type frontend -> usage coherent

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Creation engin avec numeroEngin existant -> erreur | P0 |
| Suppression engin avec affectations -> erreur | P0 |
| Affectation sur CRV verrouille -> 403 | P0 |
| Creation engin par AGENT -> 403 | P1 |
| Suppression engin par MANAGER -> 403 | P1 |
| Creation automatique engin via affectation | P1 |

---

## 7. ABSENCE DE SERVICE

### Constat
Pas de couche service dedicee (`src/services/resources/`).
Toute la logique est dans le controller.

### Risque
- Duplication de code si logique reutilisee
- Testabilite reduite
- Couplage controller-model direct

### Impact non-regression
Faible actuellement, mais a surveiller si evolution.

