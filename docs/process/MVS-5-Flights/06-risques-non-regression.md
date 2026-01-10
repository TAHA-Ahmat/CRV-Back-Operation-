# MVS-5-Flights - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Type Operation Deduit

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| typeOperation deduit | Vol.js:L10-20 | CRITIQUE |

**Regle metier** (Cahier des charges S3) :
- Type JAMAIS choisi a l'avance, il est CONSTATE
- Donnees arrivee uniquement -> ARRIVEE
- Donnees depart uniquement -> DEPART
- Donnees arrivee ET depart -> TURN_AROUND

**Modifications INTERDITES** :
- Rendre typeOperation required
- Imposer typeOperation a la creation

---

### 1.2 Machine a etats Programme

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| statut programme | ProgrammeVolSaisonnier.js:L125-130 | HAUTE |

**Transitions valides** :
- BROUILLON -> VALIDE (via validerProgrammeVol)
- VALIDE -> ACTIF (via activerProgrammeVol)
- ACTIF -> SUSPENDU (via suspendreProgrammeVol)
- SUSPENDU -> ACTIF (reactivation possible)

**Modifications INTERDITES** :
- Sauter une etape (BROUILLON -> ACTIF directement)
- Modifier programme VALIDE + ACTIF sans suspension prealable

---

### 1.3 Coherence Vol-Programme

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| lierVolAuProgramme | vol.service.js:L25-82 | HAUTE |

**Validations obligatoires** :
- Programme actif
- Meme compagnieAerienne (case insensitive)
- Meme typeOperation

**Risque** : Liaison vol a programme incompatible

---

### 1.4 Autorisation Validation/Activation

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| authorize routes | programmeVol.routes.js:L95, L103 | CRITIQUE |

**Restriction** :
- Validation : SUPERVISEUR, MANAGER uniquement
- Activation : SUPERVISEUR, MANAGER uniquement
- Suppression : MANAGER uniquement

**Modifications INTERDITES** :
- Ouvrir validation/activation a tous les roles operationnels
- Supprimer authorize sur ces routes

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| Vol | Avion | N:1 optionnel |
| Vol | ProgrammeVolSaisonnier | N:1 optionnel |
| ProgrammeVolSaisonnier | User (createdBy) | N:1 obligatoire |
| ProgrammeVolSaisonnier | User (validePar) | N:1 optionnel |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| Vol.typeOperation | Vol | Deduit automatiquement |
| Vol.statut | Vol | Machine a etats |
| Vol.horsProgramme | Vol | Classification vol |
| Programme.statut | ProgrammeVolSaisonnier | Machine a etats stricte |
| Programme.validation.valide | ProgrammeVolSaisonnier | Prerequis activation |
| Programme.actif | ProgrammeVolSaisonnier | Etat operationnel |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Enum statut Vol | Machine a etats |
| Enum statut Programme | Cycle de vie strict |
| Enum typeVolHorsProgramme | Classification reglementaire |
| Validation coherence vol-programme | Integrite donnees |
| Autorisation validation/activation | Decision critique |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] typeOperation Vol reste optionnel (default null)
- [ ] Programme ne peut etre active sans validation prealable
- [ ] Modification programme valide+actif impossible sans suspension
- [ ] Coherence compagnie/type verifiee lors liaison
- [ ] Suppression programme actif impossible
- [ ] Validation/Activation reservees SUPERVISEUR/MANAGER
- [ ] Audit log genere pour toutes les actions

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Activation programme non valide -> erreur | P0 |
| Modification programme actif -> erreur | P0 |
| Liaison vol avec programme inactif -> erreur | P0 |
| Liaison vol avec compagnie differente -> erreur | P0 |
| Suppression programme actif -> erreur | P0 |
| Validation par AGENT -> 403 | P0 |
| Activation par QUALITE -> 403 | P0 |
| Suppression par SUPERVISEUR -> 403 | P1 |
| Programme periode terminee -> activation refusee | P1 |

---

## 7. COMPATIBILITE EXTENSIONS

### Extension 1 (Programme Vol Saisonnier)
- **Non-regression** : Modele NOUVEAU et INDEPENDANT
- **Vol.js** : INCHANGE
- **Routes existantes** : INCHANGEES
- **Service** : 100% AUTONOME

### Extension 2 (Distinction Programme/Hors Programme)
- **Non-regression** : Champs OPTIONNELS avec default
- **Vol.js existant** : Champs ajoutes avec compatibilite
- **vol.controller.js** : INCHANGE
- **Routes** : ADDITIONNELLES uniquement

