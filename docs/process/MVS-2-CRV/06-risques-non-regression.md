# MVS-2-CRV - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Index unique composite vol+escale

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Index unique | CRV.js:L220 | CRITIQUE |

```javascript
crvSchema.index({ vol: 1, escale: 1 }, { unique: true });
```

**Description** : Garantit l'unicite metier : 1 vol + 1 escale = 1 CRV

**Risque** : Suppression de l'index permettrait la creation de CRV doublons

**Modifications INTERDITES** :
- Suppression de l'index
- Modification de la composition
- Passage en non-unique

---

### 1.2 Generation numeroCRV

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| genererNumeroCRV | crv.service.js:L203-219 | CRITIQUE |

**Format** : `CRV{YY}{MM}{DD}-{NNNN}`
- YY : Annee 2 chiffres
- MM : Mois 2 chiffres
- DD : Jour 2 chiffres
- NNNN : Sequence journaliere 4 chiffres

**Risque** : Modification du format casse la tracabilite et les audits

**Modifications INTERDITES** :
- Changement de format
- Suppression de la sequence
- Modification de la logique de comptage

---

### 1.3 Calcul completude

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| calculerCompletude | crv.service.js:L27-167 | CRITIQUE |

**Ponderation** :
- Phases : 40%
- Charges : 30%
- Evenements : 20% (fixe)
- Observations : 10% (fixe)

**Risque** : Modification de la ponderation impacte tous les CRV existants et le workflow

**Modifications INTERDITES** :
- Changement des ponderations sans validation metier
- Suppression des scores fixes evenements/observations
- Modification du seuil de completion pour terminer (50%)

---

### 1.4 Machine a etats statut CRV

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| TRANSITIONS_STATUT_AUTORISEES | crv.controller.js:L367-374 | CRITIQUE |

```javascript
const TRANSITIONS_STATUT_AUTORISEES = {
  'BROUILLON': ['EN_COURS'],
  'EN_COURS': ['TERMINE', 'BROUILLON'],
  'TERMINE': ['EN_COURS'],
  'VALIDE': [],
  'VERROUILLE': [],
  'ANNULE': []
};
```

**Risque** : Modification des transitions casse le workflow metier

---

### 1.5 Suppression cascade

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| supprimerCRV | crv.controller.js | HAUTE |

**Entites supprimees** :
1. ChronologiePhase (deleteMany)
2. ChargeOperationnelle (deleteMany)
3. EvenementOperationnel (deleteMany)
4. Observation (deleteMany)
5. Horaire (findByIdAndDelete)
6. CRV (findByIdAndDelete)

**Risque** : Modification de l'ordre ou oubli d'une entite cree des orphelins

---

## 2. COUPLAGES FORTS

### 2.1 CRV -> Tous les sous-MVS

| Entite dependante | Collection | Type liaison |
|-------------------|------------|--------------|
| ChronologiePhase | phases | crv: ObjectId |
| ChargeOperationnelle | charges | crv: ObjectId |
| EvenementOperationnel | transversal | crv: ObjectId |
| Observation | crv | crv: ObjectId |
| Horaire | phases | Cree avec CRV |
| HistoriqueModification | crv | crv: ObjectId |

**Impact** : Suppression CRV necessite cascade sur toutes ces collections

---

### 2.2 CRV -> Vol

| Champ | Relation | Criticite |
|-------|----------|-----------|
| CRV.vol | N:1 obligatoire | CRITIQUE |

**Impact** : Un CRV ne peut exister sans Vol associe

---

### 2.3 CRV -> Personne

| Champ | Usage |
|-------|-------|
| creePar | Obligatoire, auteur |
| responsableVol | Optionnel, responsable operations |
| modifiePar | Optionnel, dernier modificateur |
| verrouillePar | Optionnel, validateur |
| annulation.annulePar | Optionnel, auteur annulation |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite | Protection |
|-------|--------|-------------|------------|
| numeroCRV | CRV | CRITIQUE | unique, format impose |
| statut | CRV | CRITIQUE | enum, transitions controlees |
| escale | CRV | HAUTE | unique avec vol |
| completude | CRV | HAUTE | calcule automatiquement |
| dateVerrouillage | CRV | HAUTE | immutable apres set |

---

## 4. FONCTIONS A HAUT RISQUE

### 4.1 supprimerCRV

| Risque | Description |
|--------|-------------|
| Perte donnees | Suppression irreversible de toutes les donnees |
| Orphelins | Oubli d'une collection dans la cascade |

**Recommandation** : Ajouter soft delete ou archivage avant suppression definitive

---

### 4.2 mettreAJourCRV avec changement statut

| Risque | Description |
|--------|-------------|
| Transition invalide | Passage a un statut non autorise |
| Verrouillage premature | Terminer sans completude suffisante |

---

### 4.3 annulerCRV

| Risque | Description |
|--------|-------------|
| Perte ancienStatut | Impossible de revenir a l'etat precedent |
| Annulation CRV verrouille | Bypass du verrouillage |

---

## 5. MODIFICATIONS INTERDITES

### 5.1 Schema CRV

| Element | Raison |
|---------|--------|
| Index unique vol+escale | Integrite metier |
| Enum statut | Machine a etats |
| Format numeroCRV | Tracabilite audit |
| Champs creePar, modifiePar | Tracabilite |

### 5.2 Services

| Element | Raison |
|---------|--------|
| Ponderation completude | Regles metier validees |
| Format generation numero | Coherence historique |
| Transitions statut | Workflow metier |

---

## 6. ZONES FRAGILES

### 6.1 Seuil terminer CRV

**Localisation** : crv.controller.js::terminerCRV

**Fragilite** : Le seuil de 50% de completude pour terminer un CRV est code en dur

---

### 6.2 Creation Vol automatique

**Localisation** : crv.controller.js::creerCRV

**Fragilite** : Si volId absent, un Vol est cree automatiquement avec des valeurs par defaut

---

### 6.3 Calcul scores charges

**Localisation** : crv.service.js::calculerCompletude

**Fragilite** : La logique de detection "charge avec donnees" est complexe et fragile

```javascript
const chargesAvecDonnees = charges.filter(c => {
  const passagersSaisis = c.passagersAdultes !== null || ...
  const bagagesSaisis = c.nombreBagagesSoute !== null || ...
  const fretSaisi = c.nombreFret !== null || ...
  return passagersSaisis || bagagesSaisis || fretSaisi;
});
```

---

## 7. CHECKLIST NON-REGRESSION

Avant toute modification du MVS-2-CRV, verifier :

- [ ] Index unique vol+escale intact
- [ ] Format numeroCRV respecte
- [ ] Ponderation completude inchangee (40/30/20/10)
- [ ] Seuil terminer a 50%
- [ ] Transitions statut respectees
- [ ] Suppression cascade complete
- [ ] Hook pre-save derniereModification
- [ ] Exclusion role QUALITE sur ecritures
- [ ] Verification CRV non verrouille avant modification
- [ ] Audit log sur toutes les ecritures

---

## 8. TESTS CRITIQUES A MAINTENIR

| Test | Description | Priorite |
|------|-------------|----------|
| Creation CRV | Vol auto si absent | P0 |
| Creation CRV | Generation numeroCRV unique | P0 |
| Unicite vol+escale | Doublon refuse | P0 |
| Transition BROUILLON->EN_COURS | Demarrer | P0 |
| Transition EN_COURS->TERMINE | Terminer avec completude | P0 |
| Terminer sans completude | Refus si < 50% | P0 |
| Modification CRV verrouille | Refus 403 | P0 |
| Suppression CRV | Cascade complete | P0 |
| Suppression CRV verrouille | Refus 403 | P0 |
| Calcul completude | Tous scenarios | P0 |
| Annulation CRV | Sauvegarde ancien statut | P1 |
| Reactivation CRV | Restauration statut | P1 |
| Role QUALITE | Lecture seule | P0 |
