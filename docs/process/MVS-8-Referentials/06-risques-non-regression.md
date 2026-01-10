# MVS-8-Referentials - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Unicite immatriculation

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification unicite | avionConfiguration.controller.js | CRITIQUE |
| Index unique | Avion.js | CRITIQUE |

**Risque** : Doublon d'avions dans le referentiel

**Modifications INTERDITES** :
- Suppression de la verification d'unicite
- Suppression de l'index unique

---

### 1.2 Versioning configuration (Extension 3)

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Sauvegarde historique | avionConfiguration.controller.js | HAUTE |
| Increment version | avionConfiguration.controller.js | HAUTE |

**Regle** : Chaque modification de configuration DOIT creer une nouvelle version

**Risque** : Perte de tracabilite des modifications

**Modifications INTERDITES** :
- Modification directe de configuration sans versioning
- Suppression de l'historique

---

### 1.3 Protection suppression avion

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Verification vols | avionConfiguration.controller.js | HAUTE |

**Regle** : Un avion avec historique de vols ne peut pas etre supprime

**Risque** : Perte d'integrite referentielle

---

### 1.4 Restauration version (ADMIN uniquement)

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Authorize ADMIN | avion.routes.js | HAUTE |

**Regle** : Seul ADMIN peut restaurer une version anterieure

**Risque** : Modifications non controlees de la configuration

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| Avion | Vol | 1:N (reference) |
| historiqueVersions.modifiePar | User | N:1 obligatoire |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| immatriculation | Avion | Unique, cle metier |
| version | Avion | Tracabilite |
| configuration | Avion | Extension 3 |
| historiqueVersions | Avion | Audit trail |
| derniereRevision.type | Avion | Enum contrainte |
| configuration.equipements | Avion | Enum array contrainte |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Unicite immatriculation | Integrite referentiel |
| Mecanisme versioning | Tracabilite Extension 3 |
| Historique versions | Audit trail |
| Enum equipements | Classification materiel |
| Enum derniereRevision.type | Types revision standard |
| Protection suppression si vols | Integrite historique |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Immatriculation reste unique (uppercase)
- [ ] Modification configuration incremente version
- [ ] Historique versions conserve
- [ ] Restauration version cree nouvelle version
- [ ] Suppression avion avec vols bloquee
- [ ] Restauration par ADMIN uniquement
- [ ] Creation/modification par MANAGER ou ADMIN uniquement
- [ ] Suppression par ADMIN uniquement

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Creation avion avec immatriculation existante -> erreur | P0 |
| MAJ configuration incremente version | P0 |
| Suppression avion avec vols -> erreur | P0 |
| Restauration version par MANAGER -> 403 | P1 |
| Creation avion par AGENT -> 403 | P1 |
| Recherche immatriculation case-insensitive | P1 |
| Historique versions contient modifiePar | P2 |

---

## 7. EXTENSION 3 : VERSIONING ET CONFIGURATION

### Constat
L'Extension 3 ajoute le versioning de configuration avec historique complet.

### Impact
- Chaque modification de configuration est tracee
- Rollback possible sans perte de donnees
- Audit trail complet des modifications

### Points d'attention
- L'historique croit indefiniment (pas de purge)
- Chaque version stocke une copie complete de la configuration
- Impact potentiel sur la taille des documents

---

## 8. ABSENCE DE SERVICE

### Constat
Pas de couche service dedicee (`src/services/referentials/`).
Toute la logique est dans le controller.

### Risque
- Duplication de code si logique reutilisee
- Testabilite reduite
- Couplage controller-model direct

### Impact non-regression
Faible actuellement, mais a surveiller si evolution.

