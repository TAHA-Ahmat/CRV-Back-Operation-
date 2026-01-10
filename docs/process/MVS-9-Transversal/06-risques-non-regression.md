# MVS-9-Transversal - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Calcul automatique dureeImpactMinutes

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Pre-save hook | EvenementOperationnel.js | HAUTE |

**Comportement** : Calcul automatique de la duree d'impact en minutes

**Risque** : Incoherence si modification manuelle de heureDebut/heureFin sans recalcul

**Modifications INTERDITES** :
- Suppression du hook pre-save
- Calcul manuel sans utiliser le hook

---

### 1.2 Tracabilite declarePar

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Champ declarePar | EvenementOperationnel.js | HAUTE |

**Regle** : Tout evenement doit avoir un declarant identifie

**Risque** : Evenements orphelins sans responsable

---

### 1.3 Machine a etats AffectationPersonneVol

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Enum statut | AffectationPersonneVol.js | MOYENNE |

**Transitions** :
- PREVU -> EN_COURS
- EN_COURS -> TERMINE
- PREVU -> ANNULE
- EN_COURS -> ANNULE

**Risque** : Transition invalide (ex: TERMINE -> PREVU)

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| AffectationPersonneVol | Vol | N:1 obligatoire |
| AffectationPersonneVol | User | N:1 obligatoire |
| EvenementOperationnel | Vol | N:1 obligatoire |
| EvenementOperationnel | CRV | N:1 optionnel |
| EvenementOperationnel | User (declarePar) | N:1 obligatoire |
| impactPhases.phase | Phase | N:1 |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| role | AffectationPersonneVol | Enum contrainte |
| statut | AffectationPersonneVol | Machine a etats |
| typeEvenement | EvenementOperationnel | Enum contrainte |
| gravite | EvenementOperationnel | Enum contrainte |
| dureeImpactMinutes | EvenementOperationnel | Calcule automatiquement |
| declarePar | EvenementOperationnel | Tracabilite obligatoire |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Enum role AffectationPersonneVol | Classification personnel |
| Enum statut AffectationPersonneVol | Machine a etats |
| Enum typeEvenement | Classification evenements |
| Enum gravite | Niveaux standard |
| Hook calcul dureeImpactMinutes | Coherence donnees |
| Champ declarePar required | Tracabilite |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Calcul dureeImpactMinutes automatique fonctionne
- [ ] declarePar obligatoire a la creation evenement
- [ ] Transitions statut affectation valides
- [ ] Index sur vol et personne performants
- [ ] Populate fonctionne sur toutes les references
- [ ] Gravite par defaut MINEURE
- [ ] Statut affectation par defaut PREVU

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Calcul dureeImpactMinutes correct | P0 |
| Creation evenement sans declarePar -> erreur | P0 |
| Affectation sans vol -> erreur | P0 |
| Affectation sans personne -> erreur | P0 |
| Transition TERMINE -> PREVU -> erreur | P1 |
| Populate personne avec nom/prenom | P1 |
| Impact phases calcule correctement | P2 |

---

## 7. ABSENCE CONTROLLER/ROUTES DEDIES

### Constat
Pas de controller ni routes dedies pour ce MVS.
Les modeles sont consommes par les autres MVS (CRV, Flights).

### Impact
- Couplage fort avec les autres MVS
- Pas d'API directe pour les entites transversales

### Recommandation
Si acces direct necessaire, creer des routes dedicees.

---

## 8. DONNEES TRANSVERSALES

### Caracteristique
Ces modeles sont "transversaux" car utilises par plusieurs MVS :
- AffectationPersonneVol : MVS-5-Flights + MVS-2-CRV
- EvenementOperationnel : MVS-2-CRV + MVS-3-Phases

### Point d'attention
- Modifications dans ce MVS impactent plusieurs autres MVS
- Tests d'integration necessaires lors de modifications

