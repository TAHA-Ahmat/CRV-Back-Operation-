# MVS-3-Phases - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Hook pre-save ChronologiePhase

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| pre('save') | ChronologiePhase.js:L48-112 | CRITIQUE |

**Actions** :
- Calcul dureeReelleMinutes
- Calcul ecartMinutes
- Reset durees si NON_REALISE

**Modifications INTERDITES** :
- Suppression des calculs automatiques
- Modification logique reset NON_REALISE

---

### 1.2 Verification prerequis

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| verifierPrerequisPhase | phase.service.js:L87-152 | HAUTE |

**Risque** : Bypass permet de demarrer phases dans le desordre

---

### 1.3 Hook pre-save Horaire

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| pre('save') | Horaire.js:L49-115 | HAUTE |

**Actions** : Calcul ecarts (atterrissage, decollage, parc)

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| ChronologiePhase | CRV | N:1 obligatoire |
| ChronologiePhase | Phase | N:1 obligatoire |
| ChronologiePhase | Personne (responsable) | N:1 optionnel |
| Horaire | Vol | N:1 obligatoire |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| Phase.code | Phase | unique |
| Phase.prerequis | Phase | enchainement |
| ChronologiePhase.statut | ChronologiePhase | machine a etats |
| ChronologiePhase.dureeReelleMinutes | ChronologiePhase | calcule auto |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Enum statut ChronologiePhase | Machine a etats |
| Hook calcul duree | Coherence donnees |
| Enum motifNonRealisation | Tracabilite |
| Calcul ecarts Horaire | SLA |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Hook pre-save ChronologiePhase intact
- [ ] Hook pre-save Horaire intact
- [ ] Verification prerequis fonctionnelle
- [ ] Reset durees si NON_REALISE
- [ ] Recalcul completude apres modification phase
- [ ] Exclusion QUALITE sur ecritures

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Demarrer phase sans prerequis | P0 |
| Demarrer phase avec prerequis non satisfaits | P0 |
| Terminer phase non en cours | P0 |
| Calcul duree automatique | P0 |
| Reset durees si NON_REALISE | P0 |
| Calcul ecarts horaires | P1 |
