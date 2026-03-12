# Rapport Post-Mission — Hardening Backend Pipeline

## Mission : hardening-backend-pipeline
- **Date** : 2026-03-11
- **Branche** : mission/hardening-backend-pipeline
- **Perimetre** : backend
- **Domaine** : pipeline donnees (Vol, CRV, Phases)
- **Niveau ceremonie** : 🟥 Structurelle (zone rouge touchee)

## Problemes resolus
1. **typeAvion perdu dans le pipeline** — Vol.js n'avait pas de champ `typeAvion`, les deux fonctions de creation de Vol (`creerVolDepuisMouvement` et `creerVolsDepuisBulletin`) ne mappaient pas ce champ depuis le bulletin de mouvement
2. **Temps prevus des phases jamais calcules** — `initialiserPhasesVol()` creait des ChronologiePhase sans `heureDebutPrevue`/`heureFinPrevue`, alors que les champs existent dans le schema et sont attendus par le PDF et le frontend

## Fichiers modifies

| # | Fichier | Modification | Lignes |
|---|---------|-------------|--------|
| 1 | `src/models/flights/Vol.js` | Ajout champ `typeAvion` (String, optional, default null) | +10 |
| 2 | `src/services/crv/crv.service.js` | Ajout `typeAvion: mouvement.typeAvion \|\| null` dans `creerVolDepuisMouvement()` | +1 |
| 3 | `src/services/bulletin/bulletinMouvement.service.js` | Ajout `typeAvion: mouvement.typeAvion \|\| null` dans `creerVolsDepuisBulletin()` | +1 |
| 4 | `src/services/phases/phase.service.js` | Import Horaire, parametre `horaireId`, calcul cascade temporelle | +40 |
| 5 | `src/controllers/crv/crv.controller.js` | Passage `horaire?._id \|\| null` a `initialiserPhasesVol()` | +0 (1 ligne modifiee) |

## Fichiers zone rouge touches
- **crv.controller.js** : OUI — 1 ligne modifiee (ajout 3e argument a `initialiserPhasesVol()`)
- **Justification** : Modification minimale, passage d'un parametre existant (`horaire._id`), aucun changement de logique
- **Autres zone rouge** : NON (validation.service.js, crvArchivage.service.js, businessRules.middleware.js intacts)

## Lignes ajoutees/supprimees (mission uniquement)
- Vol.js : +10 lignes (champ typeAvion + commentaires EXTENSION 8)
- crv.service.js : +1 ligne
- bulletinMouvement.service.js : +1 ligne
- phase.service.js : +40 lignes (import + parametre + cascade + boucle modifiee)
- crv.controller.js : 0 (modification in-place)
- **Total mission** : +52 lignes / -0 lignes

## Verification syntaxique
- `node --check` sur les 5 fichiers : ✅ OK (0 erreurs)

## Detail technique — Cascade temporelle (phase.service.js)

```
Horaire (heureAtterrisagePrevue ou heureDecollagePrevue)
  │
  ├── Phase 1 (ordre=1) : debut = reference, fin = reference + dureeStandardMinutes
  ├── Phase 2 (ordre=2) : debut = fin phase 1, fin = debut + dureeStandardMinutes
  ├── Phase 3 (ordre=3) : debut = fin phase 2, fin = debut + dureeStandardMinutes
  └── ...
```

- Point de depart : `heureAtterrisagePrevue` (ARR/TURN) ou `heureDecollagePrevue` (DEP)
- Chaque phase utilise `Phase.dureeStandardMinutes` (champ required du referentiel)
- Bloc try/catch NON-BLOQUANT : si l'horaire n'existe pas ou n'a pas d'heure prevue, les phases sont creees sans temps prevus (comportement identique a avant)

## Backward compatibility
- Vol.js : `typeAvion` default null → documents existants non impactes
- phase.service.js : `horaireId = null` par defaut → appels existants sans 3e argument fonctionnent identiquement
- crv.controller.js : `horaire?._id || null` safe si horaire undefined

## Impact comportemental
- **AVANT** : `typeAvion` toujours null dans Vol → affiche "-" dans PDF et frontend. Phases creees sans temps prevus → timeline vide dans PDF.
- **APRES** : `typeAvion` propage depuis bulletin → affiche valeur reelle. Phases avec cascade temporelle → timeline renseignee si horaire disponible.
- **Aucune regression** : tous les chemins sans typeAvion ou sans horaire se comportent exactement comme avant.

## Rollback
```bash
git revert <hash-de-ce-commit>
```

## Prochaine etape
**Mission B — Hardening Display** (branche separee `mission/hardening-display`) :
1. `CrvGenerator.js` : fix populate (`.populate({ path: 'vol', populate: { path: 'avion' } }).populate('horaire')`)
2. `CRVPhases.vue` : ajout affichage `heureDebutPrevue`/`heureFinPrevue`

## NOTE
Cette branche contient egalement des modifications NON COMMITTEES pre-existantes de la branche `mission/fix-fullstack-bugs`. Seules les modifications listees ci-dessus font partie de cette mission hardening.
