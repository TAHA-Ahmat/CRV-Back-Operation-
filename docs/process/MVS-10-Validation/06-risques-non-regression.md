# MVS-10-Validation - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Unicite validation par CRV

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Index unique crv | ValidationCRV.js | CRITIQUE |

**Regle** : Un CRV ne peut avoir qu'une seule fiche de validation

**Risque** : Validations multiples incoherentes

**Modifications INTERDITES** :
- Suppression de l'index unique
- Creation de validations multiples

---

### 1.2 Workflow de validation

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification statut | validation.controller.js | CRITIQUE |

**Workflow** :
1. CRV EN_COURS/TERMINE -> peut etre valide
2. CRV VALIDE -> peut etre verrouille ou rejete
3. CRV VERROUILLE -> ne peut plus etre modifie

**Modifications INTERDITES** :
- Validation d'un CRV deja VERROUILLE
- Bypass des verifications de statut

---

### 1.3 Deverrouillage ADMIN uniquement

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| authorize(ADMIN) | validation.routes.js | CRITIQUE |

**Regle** : Seul un ADMIN peut deverrouiller un CRV

**Risque** : Deverrouillage non autorise = perte d'integrite

**Modifications INTERDITES** :
- Ajout d'autres roles au deverrouillage
- Suppression de l'autorisation

---

### 1.4 Historique actions

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Array historique | ValidationCRV.js | HAUTE |

**Regle** : Chaque action doit etre tracee dans l'historique

**Risque** : Perte de tracabilite des validations

---

### 1.5 Motif obligatoire pour deverrouillage

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification motif | validation.controller.js | HAUTE |

**Regle** : Le deverrouillage exige un motif justificatif

**Risque** : Deverrouillages non justifies

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| ValidationCRV | CRV | 1:1 obligatoire unique |
| ValidationCRV | User (validePar) | N:1 obligatoire |
| ValidationCRV | User (verrouillePar) | N:1 optionnel |
| ecartsSLA.phase | Phase | N:1 |
| historique.utilisateur | User | N:1 |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| crv | ValidationCRV | Unique, reference CRV |
| statut | ValidationCRV | Machine a etats |
| verrouille | ValidationCRV | Bloque toutes modifications |
| scoreCompletude | ValidationCRV | Calcule, 0-100 |
| conformiteSLA | ValidationCRV | Indicateur qualite |
| historique | ValidationCRV | Tracabilite complete |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Unicite crv | Une validation par CRV |
| Workflow validation | Integrite processus |
| Deverrouillage ADMIN only | Securite |
| Historique actions | Tracabilite |
| Motif deverrouillage | Justification obligatoire |
| Enum statut | Machine a etats |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Une seule validation par CRV (index unique)
- [ ] Validation impossible sur CRV VERROUILLE
- [ ] Verrouillage impossible sur CRV non VALIDE
- [ ] Deverrouillage par ADMIN uniquement
- [ ] Motif obligatoire pour deverrouillage
- [ ] Historique complete pour chaque action
- [ ] scoreCompletude calcule correctement (0-100)
- [ ] conformiteSLA et ecartsSLA calcules
- [ ] Statut CRV synchronise avec statut validation

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Validation CRV VERROUILLE -> 400 | P0 |
| Verrouillage CRV non VALIDE -> 400 | P0 |
| Deverrouillage par QUALITE -> 403 | P0 |
| Deverrouillage sans motif -> 400 | P0 |
| Doublon validation meme CRV -> erreur | P0 |
| Historique contient action VALIDATION | P1 |
| Historique contient action VERROUILLAGE | P1 |
| scoreCompletude entre 0 et 100 | P1 |
| Rejet sans commentaires -> 400 | P1 |
| Synchronisation statut CRV | P2 |

---

## 7. SYNCHRONISATION CRV

### Constat
Le statut du CRV est mis a jour lors des operations de validation.

### Mapping

| Action validation | Statut CRV resultant |
|-------------------|---------------------|
| VALIDATION | VALIDE |
| REJET | EN_COURS |
| VERROUILLAGE | VERROUILLE |
| DEVERROUILLAGE | VALIDE |

### Risque
Desynchronisation entre ValidationCRV.statut et CRV.statut

### Mitigation
Operations atomiques avec update des deux entites

---

## 8. ABSENCE DE SERVICE

### Constat
Pas de couche service dedicee.
Logique metier (calculs) dans le controller.

### Impact
- Calculs non reutilisables
- Testabilite reduite

### Recommandation
Extraire calculerScoreCompletude et verifierConformiteSLA dans un service.

