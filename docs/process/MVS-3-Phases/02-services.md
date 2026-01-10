# MVS-3-Phases - SERVICES

## Date d'audit : 2026-01-10

---

## phase.service.js

### Emplacement
`src/services/phases/phase.service.js`

---

### initialiserPhasesVol(crvId, typeOperationIndice)

**Signature** : `async (crvId, typeOperationIndice) -> Array<ChronologiePhase>`

**Logique** :
1. Charger TOUTES les phases actives (sans filtrage par type)
2. Creer une ChronologiePhase pour chaque phase
3. Statut initial : NON_COMMENCE

**Regle metier** : Le type d'operation n'est PAS filtre a la creation. Il sera deduit des phases utilisees.

**Modeles** : Phase, ChronologiePhase

**Ecritures** : N ChronologiePhase creees

---

### verifierPrerequisPhase(chronoPhaseId)

**Signature** : `async (chronoPhaseId) -> { valide: Boolean, prerequisManquants: Array }`

**Logique** :
1. Charger la phase avec ses prerequis
2. Pour chaque prerequis, verifier qu'il est TERMINE ou NON_REALISE
3. Retourner liste des prerequis manquants

---

### demarrerPhase(chronoPhaseId, userId)

**Signature** : `async (chronoPhaseId, userId) -> ChronologiePhase`

**Logique** :
1. Verifier prerequis satisfaits
2. Si non satisfaits : erreur
3. Mettre statut = EN_COURS
4. Enregistrer heureDebutReelle = now()
5. Assigner responsable = userId

**Transitions** : NON_COMMENCE -> EN_COURS

---

### terminerPhase(chronoPhaseId)

**Signature** : `async (chronoPhaseId) -> ChronologiePhase`

**Logique** :
1. Verifier statut = EN_COURS
2. Mettre statut = TERMINE
3. Enregistrer heureFinReelle = now()
4. Hook calcule dureeReelleMinutes

**Transitions** : EN_COURS -> TERMINE

---

## SYNTHESE

| Fonction | Role | Criticite |
|----------|------|-----------|
| initialiserPhasesVol | Creation phases CRV | CRITIQUE |
| verifierPrerequisPhase | Validation enchainement | HAUTE |
| demarrerPhase | Transition NON_COMMENCE->EN_COURS | HAUTE |
| terminerPhase | Transition EN_COURS->TERMINE | HAUTE |
