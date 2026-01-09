# INSTRUMENTATION LOGS AUDIT CRV

## FORMAT STANDARD DES LOGS

Tous les logs suivent le format :
```
[CRV][<MODULE>][<ACTION>] { crvId, userId, role, input, decision, reason, output, timestamp }
```

---

## TABLE DES LOGS AJOUTÉS

### 1. CONTROLLERS (crv.controller.js)

| Tag | Action | Description |
|-----|--------|-------------|
| `[CRV][API_ENTER][CREER_CRV]` | Entrée API | Début création CRV |
| `[CRV][TRY_ENTER][CREER_CRV]` | Try block | Entrée dans le bloc try |
| `[CRV][DECISION_CHECK][VOL_EXISTENCE]` | Vérification | Vérification existence vol |
| `[CRV][DECISION_CHECK][CRV_DUPLICATION]` | Vérification | Vérification doublon CRV |
| `[CRV][STATUS_TRANSITION][CRV_CREATED]` | Transition | CRV créé avec statut initial |
| `[CRV][API_SUCCESS][CREER_CRV]` | Succès | Création réussie |
| `[CRV][API_REJECT][CREER_CRV]` | Rejet | Création refusée |
| `[CRV][ERROR][CREER_CRV]` | Erreur | Exception lors de la création |
| `[CRV][API_ENTER][LISTER_CRV]` | Entrée API | Début liste CRV |
| `[CRV][API_SUCCESS][LISTER_CRV]` | Succès | Liste retournée |
| `[CRV][API_ENTER][OBTENIR_CRV]` | Entrée API | Début obtention CRV |
| `[CRV][API_SUCCESS][OBTENIR_CRV]` | Succès | CRV retourné |
| `[CRV][API_REJECT][OBTENIR_CRV]` | Rejet | CRV non trouvé |
| `[CRV][API_ENTER][MAJ_CRV]` | Entrée API | Début mise à jour CRV |
| `[CRV][DECISION_CHECK][CRV_VERROUILLE]` | Vérification | CRV verrouillé |
| `[CRV][API_SUCCESS][MAJ_CRV]` | Succès | Mise à jour réussie |
| `[CRV][API_ENTER][SUPPRIMER_CRV]` | Entrée API | Début suppression CRV |
| `[CRV][API_SUCCESS][SUPPRIMER_CRV]` | Succès | Suppression réussie |
| `[CRV][API_ENTER][CHANGER_STATUT]` | Entrée API | Début changement statut |
| `[CRV][STATUS_TRANSITION][STATUT_CHANGE]` | Transition | Statut modifié |
| `[CRV][API_ENTER][TERMINER_CRV]` | Entrée API | Début terminaison CRV |
| `[CRV][API_ENTER][VALIDER_CRV]` | Entrée API | Début validation CRV |
| `[CRV][API_ENTER][VERROUILLER_CRV]` | Entrée API | Début verrouillage CRV |
| `[CRV][API_ENTER][DEVERROUILLER_CRV]` | Entrée API | Début déverrouillage CRV |
| `[CRV][API_ENTER][ARCHIVER_CRV]` | Entrée API | Début archivage CRV |
| `[CRV][API_ENTER][ANNULER_CRV]` | Entrée API | Début annulation CRV |

### 2. SERVICES (crv.service.js)

| Tag | Action | Description |
|-----|--------|-------------|
| `[CRV][SERVICE][COMPLETUDE_CALC_START]` | Début | Début calcul complétude |
| `[CRV][SERVICE][COMPLETUDE_CALC_SUCCESS]` | Succès | Complétude calculée |
| `[CRV][SERVICE][COMPLETUDE_CALC_ERROR]` | Erreur | Erreur calcul complétude |
| `[CRV][SERVICE][DEDUIRE_TYPE_START]` | Début | Début déduction type opération |
| `[CRV][SERVICE][DEDUIRE_TYPE_SUCCESS]` | Succès | Type déduit |
| `[CRV][SERVICE][DEDUIRE_TYPE_ERROR]` | Erreur | Erreur déduction type |
| `[CRV][SERVICE][MAJ_TYPE_OPERATION_START]` | Début | Début MAJ type opération |
| `[CRV][SERVICE][MAJ_TYPE_OPERATION_SUCCESS]` | Succès | Type opération mis à jour |
| `[CRV][SERVICE][MAJ_TYPE_OPERATION_REJECT]` | Rejet | MAJ type refusée |
| `[CRV][SERVICE][MAJ_TYPE_OPERATION_ERROR]` | Erreur | Erreur MAJ type |

### 3. SERVICES (validation.service.js)

| Tag | Action | Description |
|-----|--------|-------------|
| `[CRV][SERVICE][VALIDER_CRV_START]` | Début | Début validation CRV |
| `[CRV][SERVICE][VALIDER_CRV_REJECT]` | Rejet | Validation refusée |
| `[CRV][SERVICE][VALIDER_CRV_ANOMALIES]` | Anomalies | Anomalies détectées |
| `[CRV][SERVICE][VALIDER_CRV_SUCCESS]` | Succès | Validation terminée |
| `[CRV][SERVICE][VALIDER_CRV_ERROR]` | Erreur | Erreur validation |
| `[CRV][SERVICE][STATUS_TRANSITION]` | Transition | Transition de statut |
| `[CRV][SERVICE][VERROUILLER_CRV_START]` | Début | Début verrouillage |
| `[CRV][SERVICE][VERROUILLER_CRV_REJECT]` | Rejet | Verrouillage refusé |
| `[CRV][SERVICE][VERROUILLER_CRV_SUCCESS]` | Succès | Verrouillage réussi |
| `[CRV][SERVICE][VERROUILLER_CRV_ERROR]` | Erreur | Erreur verrouillage |
| `[CRV][SERVICE][DEVERROUILLER_CRV_START]` | Début | Début déverrouillage |
| `[CRV][SERVICE][DEVERROUILLER_CRV_REJECT]` | Rejet | Déverrouillage refusé |
| `[CRV][SERVICE][DEVERROUILLER_CRV_SUCCESS]` | Succès | Déverrouillage réussi |
| `[CRV][SERVICE][DEVERROUILLER_CRV_ERROR]` | Erreur | Erreur déverrouillage |

### 4. SERVICES (phase.service.js)

| Tag | Action | Description |
|-----|--------|-------------|
| `[CRV][SERVICE][INIT_PHASES_START]` | Début | Début initialisation phases |
| `[CRV][SERVICE][INIT_PHASES_SUCCESS]` | Succès | Phases initialisées |
| `[CRV][SERVICE][INIT_PHASES_ERROR]` | Erreur | Erreur initialisation |
| `[CRV][SERVICE][VERIF_PREREQUIS_SUCCESS]` | Succès | Prérequis validés |
| `[CRV][SERVICE][VERIF_PREREQUIS_RESULT]` | Résultat | Résultat vérification prérequis |
| `[CRV][SERVICE][VERIF_PREREQUIS_ERROR]` | Erreur | Erreur vérification |
| `[CRV][SERVICE][DEMARRER_PHASE_START]` | Début | Début démarrage phase |
| `[CRV][SERVICE][DEMARRER_PHASE_REJECT]` | Rejet | Démarrage refusé |
| `[CRV][SERVICE][PHASE_STATUS_TRANSITION]` | Transition | Transition statut phase |
| `[CRV][SERVICE][DEMARRER_PHASE_ERROR]` | Erreur | Erreur démarrage |
| `[CRV][SERVICE][TERMINER_PHASE_START]` | Début | Début terminaison phase |
| `[CRV][SERVICE][TERMINER_PHASE_REJECT]` | Rejet | Terminaison refusée |
| `[CRV][SERVICE][TERMINER_PHASE_ERROR]` | Erreur | Erreur terminaison |

### 5. HOOKS MONGOOSE

| Tag | Action | Description |
|-----|--------|-------------|
| `[CRV][HOOK][PRE_SAVE]` | Hook | Avant sauvegarde CRV |
| `[CRV][HOOK][CHRONO_PHASE_PRE_SAVE]` | Hook | Avant sauvegarde ChronologiePhase |
| `[CRV][HOOK][CHRONO_PHASE_REGLE_METIER]` | Règle | Application règle métier phase |
| `[CRV][HOOK][HORAIRE_PRE_SAVE]` | Hook | Avant sauvegarde Horaire |
| `[CRV][HOOK][HORAIRE_ECARTS_CALCULES]` | Calcul | Écarts horaires calculés |

---

## EXEMPLE DE TRACE COMPLÈTE

### Scénario : Création CRV → Validation → Verrouillage

```
=== CRÉATION DU CRV ===

[CRV][API_ENTER][CREER_CRV] {
  crvId: null,
  userId: "6789abc123def",
  role: "AGENT_ESCALE",
  input: { body: { volId: "vol123", escale: "CDG" } },
  decision: null,
  reason: null,
  timestamp: "2026-01-08T10:00:00.000Z"
}

[CRV][DECISION_CHECK][VOL_EXISTENCE] {
  crvId: null,
  userId: "6789abc123def",
  role: "AGENT_ESCALE",
  input: { volId: "vol123" },
  decision: "FOUND",
  reason: "Vol trouvé",
  output: { numeroVol: "AF123" },
  timestamp: "2026-01-08T10:00:00.050Z"
}

[CRV][HOOK][PRE_SAVE] {
  crvId: "crv456def789",
  userId: "6789abc123def",
  role: null,
  input: { isNew: true, numeroCRV: "CRV260108-0001", statut: "BROUILLON" },
  decision: "SAVE",
  reason: "Création CRV",
  timestamp: "2026-01-08T10:00:00.100Z"
}

[CRV][SERVICE][INIT_PHASES_START] {
  crvId: "crv456def789",
  userId: null,
  role: null,
  input: { crvId: "crv456def789" },
  decision: null,
  reason: "Début initialisation phases CRV",
  timestamp: "2026-01-08T10:00:00.150Z"
}

[CRV][SERVICE][INIT_PHASES_SUCCESS] {
  crvId: "crv456def789",
  userId: null,
  role: null,
  input: { crvId: "crv456def789" },
  decision: "INIT",
  reason: "Phases initialisées avec succès",
  output: { totalPhases: 15, parType: { ARRIVEE: 5, DEPART: 5, TURN_AROUND: 3, COMMUN: 2 } },
  timestamp: "2026-01-08T10:00:00.300Z"
}

[CRV][STATUS_TRANSITION][CRV_CREATED] {
  crvId: "crv456def789",
  userId: "6789abc123def",
  role: "AGENT_ESCALE",
  input: { volId: "vol123", escale: "CDG" },
  decision: "CREATED",
  reason: "CRV créé avec phases initialisées",
  output: { numeroCRV: "CRV260108-0001", statut: "BROUILLON", completude: 30 },
  timestamp: "2026-01-08T10:00:00.350Z"
}

[CRV][API_SUCCESS][CREER_CRV] {
  crvId: "crv456def789",
  userId: "6789abc123def",
  role: "AGENT_ESCALE",
  input: { volId: "vol123" },
  decision: "SUCCESS",
  reason: "CRV créé avec succès",
  output: { numeroCRV: "CRV260108-0001" },
  timestamp: "2026-01-08T10:00:00.400Z"
}

=== TRAVAIL SUR LES PHASES ===

[CRV][SERVICE][DEMARRER_PHASE_START] {
  crvId: null,
  userId: "6789abc123def",
  role: null,
  input: { chronoPhaseId: "chrono789" },
  decision: null,
  reason: "Début démarrage phase",
  timestamp: "2026-01-08T10:15:00.000Z"
}

[CRV][SERVICE][PHASE_STATUS_TRANSITION] {
  crvId: "crv456def789",
  userId: "6789abc123def",
  role: null,
  input: { chronoPhaseId: "chrono789", phaseLibelle: "Calage avion" },
  decision: "TRANSITION",
  reason: "Phase démarrée",
  output: { statutPrecedent: "NON_COMMENCE", nouveauStatut: "EN_COURS" },
  timestamp: "2026-01-08T10:15:00.100Z"
}

[CRV][SERVICE][PHASE_STATUS_TRANSITION] {
  crvId: "crv456def789",
  userId: null,
  role: null,
  input: { chronoPhaseId: "chrono789", phaseLibelle: "Calage avion" },
  decision: "TRANSITION",
  reason: "Phase terminée",
  output: { statutPrecedent: "EN_COURS", nouveauStatut: "TERMINE", dureeMinutes: 5 },
  timestamp: "2026-01-08T10:20:00.000Z"
}

=== CALCUL COMPLÉTUDE ===

[CRV][SERVICE][COMPLETUDE_CALC_START] {
  crvId: "crv456def789",
  userId: null,
  role: null,
  input: { crvId: "crv456def789" },
  decision: null,
  reason: "Début calcul complétude",
  timestamp: "2026-01-08T11:30:00.000Z"
}

[CRV][SERVICE][COMPLETUDE_CALC_SUCCESS] {
  crvId: "crv456def789",
  userId: null,
  role: null,
  input: { crvId: "crv456def789" },
  decision: "COMPLETE",
  reason: "Calcul complétude terminé",
  output: {
    completude: 85,
    details: {
      phases: { total: 15, terminees: 12, score: 32 },
      charges: { count: 3, types: ["PASSAGERS", "BAGAGES"], score: 25 },
      evenements: { count: 0, score: 20, statut: "vol_nominal" },
      observations: { count: 1, score: 10, statut: "remarques_documentees" }
    }
  },
  timestamp: "2026-01-08T11:30:00.200Z"
}

=== VALIDATION CRV ===

[CRV][API_ENTER][VALIDER_CRV] {
  crvId: "crv456def789",
  userId: "supervisor001",
  role: "SUPERVISEUR",
  input: { crvId: "crv456def789", commentaires: "RAS" },
  decision: null,
  reason: null,
  timestamp: "2026-01-08T12:00:00.000Z"
}

[CRV][SERVICE][VALIDER_CRV_START] {
  crvId: "crv456def789",
  userId: "supervisor001",
  role: null,
  input: { crvId: "crv456def789", commentaires: "RAS", verrouillageAutomatique: true },
  decision: null,
  reason: "Début validation CRV",
  timestamp: "2026-01-08T12:00:00.050Z"
}

[CRV][SERVICE][STATUS_TRANSITION] {
  crvId: "crv456def789",
  userId: "supervisor001",
  role: null,
  input: { statutPrecedent: "TERMINE" },
  decision: "TRANSITION",
  reason: "Verrouillage automatique après validation",
  output: { nouveauStatut: "VERROUILLE" },
  timestamp: "2026-01-08T12:00:00.300Z"
}

[CRV][SERVICE][VALIDER_CRV_SUCCESS] {
  crvId: "crv456def789",
  userId: "supervisor001",
  role: null,
  input: { crvId: "crv456def789" },
  decision: "VALIDE",
  reason: "Validation réussie",
  output: {
    validationId: "valid123",
    statutValidation: "VALIDE",
    nouveauStatut: "VERROUILLE",
    completude: 85,
    conformiteSLA: true
  },
  timestamp: "2026-01-08T12:00:00.400Z"
}

[CRV][API_SUCCESS][VALIDER_CRV] {
  crvId: "crv456def789",
  userId: "supervisor001",
  role: "SUPERVISEUR",
  input: { crvId: "crv456def789" },
  decision: "SUCCESS",
  reason: "CRV validé et verrouillé",
  output: { statut: "VERROUILLE" },
  timestamp: "2026-01-08T12:00:00.450Z"
}

=== FIN DE TRACE ===
```

---

## UTILISATION DES LOGS

### Filtrage par module
```bash
grep "\[CRV\]\[API" server.log          # Actions API uniquement
grep "\[CRV\]\[SERVICE" server.log      # Services uniquement
grep "\[CRV\]\[HOOK" server.log         # Hooks Mongoose uniquement
```

### Filtrage par action
```bash
grep "STATUS_TRANSITION" server.log     # Transitions de statut
grep "COMPLETUDE_CALC" server.log       # Calculs de complétude
grep "REJECT\|ERROR" server.log         # Erreurs et rejets
```

### Filtrage par CRV
```bash
grep "crv456def789" server.log          # Tous les logs d'un CRV
```

### Filtrage par utilisateur
```bash
grep "supervisor001" server.log         # Actions d'un utilisateur
```

---

## FICHIERS INSTRUMENTÉS

| Fichier | Type | Logs ajoutés |
|---------|------|--------------|
| `src/controllers/crv.controller.js` | Controller | ~50 logs |
| `src/services/crv.service.js` | Service | ~15 logs |
| `src/services/validation.service.js` | Service | ~20 logs |
| `src/services/phase.service.js` | Service | ~12 logs |
| `src/models/CRV.js` | Hook | 1 log |
| `src/models/ChronologiePhase.js` | Hook | 2 logs |
| `src/models/Horaire.js` | Hook | 2 logs |

**Total : ~100 points de log structurés**

---

*Document généré automatiquement lors de l'instrumentation du backend CRV*
*Date : 2026-01-08*
