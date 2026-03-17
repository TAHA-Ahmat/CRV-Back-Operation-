# DOCUMENTATION_GOVERNANCE_HARDENING — RAPPORT MISSION

## Objectif
Durcir le système documentaire CLAUDE.md + SKILL.md + MISSION_INDEX.md pour éliminer les angles morts de gouvernance et réduire le risque de drift.

## Diagnostic initial
Après le réalignement (CLAUDE_MD_REALIGNMENT), le système est globalement cohérent mais contient deux angles morts structurels :
1. Le vocabulaire de statut est défini uniquement dans le SKILL — CLAUDE.md ne le porte pas, alors que le SKILL dit "appliquer celui de CLAUDE.md"
2. Aucune règle ne dit quand ni comment mettre à jour le SKILL lui-même

## Mini-table de vérité

| Sujet | Doc autoritaire | Rôle clair ? | Redondance ? | Drift latent ? | Action |
|---|---|---|---|---|---|
| Doctrine stable | CLAUDE.md | ✅ | Non | Non | Aucune |
| État vivant | MISSION_INDEX | ✅ | Non | Non | Aucune |
| Mémoire inter-session | SKILL.md | ✅ | Non | Non | Aucune |
| Hiérarchie documentaire | SKILL.md | ✅ | Non | Non | Aucune |
| **Vocabulaire de statut** | **SKILL.md seul** | **❌** | Non | **OUI** | Migré vers CLAUDE.md |
| Format mission A→K | SKILL.md | ✅ | Non | Non | Aucune |
| Règle de drift | SKILL.md | ✅ | Non | Non | Aucune |
| Règle MAJ CLAUDE.md | SKILL.md | ✅ | Non | Non | Aucune |
| **Règle MAJ SKILL** | **AUCUN** | **❌** | — | **OUI** | Ajoutée dans SKILL |
| Règle MAJ MISSION_INDEX | SKILL.md | ✅ | Non | Non | Aucune |
| Anti-scope-creep | SKILL → CLAUDE | ⚠️ légère | Non | Non | Acceptable |

## Problème prioritaire retenu
Deux angles morts liés : vocabulaire de statut orphelin + absence de règle de MAJ du skill.

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `CLAUDE.md` | Ajout section "Vocabulaire de statut — OBLIGATOIRE" (11 lignes) |
| `.claude/skills/pilotage-critique/SKILL.md` | (1) Section vocabulaire simplifiée → renvoi vers CLAUDE.md (2) Ajout section "Règle MAJ du SKILL" avec conditions + règle de priorité en cas de contradiction |

**Fichiers zone rouge touchés : NON**

## Patch appliqué

### 1. CLAUDE.md — Vocabulaire de statut
Ajouté entre "Contraintes par mission" et "Règle git absolue" :
- 7 statuts autorisés avec définition courte
- Formulations interdites sans preuve
- C'est de la doctrine (convention stable), pas du comportement agent

### 2. SKILL.md — Vocabulaire simplifié
La section de 20 lignes qui listait les statuts + les formulations interdites a été remplacée par 2 lignes : "défini dans CLAUDE.md, appliquer strictement".
→ Suppression de la redondance.

### 3. SKILL.md — Règle de MAJ du skill
Ajoutée dans la section "RÈGLE DE MISE À JOUR DES DOCUMENTS", après les rapports missionnels :
- Quand mettre à jour : changement de pilotage, hiérarchie doc, règle mémoire, drift détecté
- Ce que le skill ne doit pas contenir : état projet, doublons CLAUDE.md
- Règle de priorité en cas de contradiction : CLAUDE.md fait foi pour la doctrine, SKILL fait foi pour le comportement agent

## G. Preuve de correction

### Avant
| Problème | État |
|---|---|
| Vocabulaire de statut | SKILL.md dit "appliquer celui de CLAUDE.md" → CLAUDE.md ne le définit pas |
| Règle MAJ du skill | Aucune — un agent ne sait pas quand/comment modifier le skill |
| Contradiction skill/CLAUDE.md | Aucune règle de priorité — qui fait foi ? |

### Après
| Problème | État |
|---|---|
| Vocabulaire de statut | Défini dans CLAUDE.md (doctrine), SKILL renvoie vers CLAUDE.md |
| Règle MAJ du skill | Définie dans SKILL (conditions + interdictions + règle de contradiction) |
| Contradiction skill/CLAUDE.md | Règle explicite : CLAUDE.md → doctrine, SKILL → comportement agent |

### Complémentarité des 3 documents (après)
```
CLAUDE.md (doctrine)
├── Zones rouges
├── MADMIT (contraintes mission)
├── Vocabulaire de statut ← NOUVEAU
├── Protocoles avant/après
├── Machine à états spec
├── Niveaux de cérémonie
└── Renvoi vers MISSION_INDEX + SKILL

SKILL.md (comportement agent)
├── Procédure de démarrage (lire avant agir)
├── Hiérarchie documentaire (3 niveaux)
├── Mémoire continue (anti-duplication)
├── Règle de drift
├── Règles de MAJ (CLAUDE.md / MISSION_INDEX / rapports / SKILL) ← SKILL MAJ AJOUTÉ
├── Vocabulaire → renvoi CLAUDE.md ← SIMPLIFIÉ
├── Format mission A→K
├── Challenge / anti-scope-creep
└── Ordre de priorité

MISSION_INDEX.md (état vivant)
├── Tableau des missions exécutées
└── Backlog restant (P0/P1/P2/P3)
```

## H. Validation minimale exécutée

| Test | Résultat |
|---|---|
| CLAUDE.md contient vocabulaire de statut | PASS |
| SKILL.md ne duplique plus le vocabulaire | PASS |
| SKILL.md a une règle de MAJ | PASS |
| Règle de contradiction CLAUDE/SKILL explicite | PASS |
| Pas de contradiction entre les 3 docs | PASS |
| Un agent lisant CLAUDE.md seul a les statuts | PASS |
| Un agent lisant le SKILL sait quand le mettre à jour | PASS |

## Hors scope
- Vérification du drift de `.claude/MADMIT_DOCTRINE.md`
- Mise à jour des audits architecture (BACKEND_CERTIFICATION, FRONTEND_AUDIT, E2E)
- Ajout du format A→K dans CLAUDE.md (reste dans SKILL car c'est du comportement agent)

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
