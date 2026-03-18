# GOVERNANCE_HARDENING_PRE_P2 — RAPPORT MISSION

## Mission : GOVERNANCE_HARDENING_PRE_P2
- Date : 2026-03-17
- Branche : mission/P1-UI-API-001 (Back) — artefacts d'audit commités
- Périmètre : documentation / gouvernance
- Domaine : gouvernance documentaire
- Classe : HYGIÈNE
- Niveau cérémonie : standard
- Fichiers modifiés (hors repo, sur disque) : CLAUDE.md (3 sections ajoutées), SKILL.md (3 sections modifiées)
- Fichiers commités (repo Back) : rapport, briefing GPT, MISSION_INDEX
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : +65 / -15
- Build avant/après : N/A (aucun code métier)
- Tests avant/après : N/A
- Impact comportemental : Les missions-sac sont maintenant explicitement interdites. Chaque mission doit être qualifiée. La suppression de code mort est encadrée par 5 critères. La priorisation est formalisée en 3 classes.
- Rollback : restaurer versions précédentes de CLAUDE.md et SKILL.md

## Objectif
Durcir les garde-fous documentaires avant le passage aux missions élargies P2. Empêcher les dérives : missions fourre-tout, suppressions hâtives, mélange de classes.

## Diagnostic initial
Les règles existantes ne couvraient pas :
1. L'interdiction explicite des missions-sac
2. La règle de découpage par "ET"
3. La qualification obligatoire PRODUIT/HYGIÈNE/TEST/COSMÉTIQUE
4. L'encadrement de la suppression de code mort
5. La formalisation de la priorisation en 3 classes
6. La preuve pré-patch obligatoire
7. Le critère de sortie de mission (1 ligne/changement)

## Mini-table de vérité

| Règle | Avant | Après | Fichier |
|---|---|---|---|
| Taille missions élargie | ≤5 fichiers strict uniquement | ≤8 fichiers si mono-domaine justifiable | CLAUDE.md |
| Anti missions-sac | Implicite | Explicitement interdit | CLAUDE.md |
| Règle du ET | Absente | Formalise le découpage | CLAUDE.md |
| Qualification PRODUIT/HYGIÈNE/TEST/COSMÉTIQUE | Absente | Obligatoire dans chaque mission + rapport | CLAUDE.md |
| Suppression code mort | Non encadrée | 5 critères obligatoires | CLAUDE.md |
| Priorisation 3 classes | Vague (SKILL L267-290) | Formalisée avec règle d'arbitrage | SKILL.md |
| Preuve pré-patch | Absente | Étape F obligatoire avant patch | SKILL.md |
| Sortie de mission | Absente | 1 ligne/changement, sinon trop grosse | SKILL.md |

## Fichiers modifiés

### CLAUDE.md — 3 modifications
1. **Section "Contraintes par mission"** — restructurée : taille/périmètre/anti-sac/découpage
2. **Section "Qualification des missions"** — nouvelle : 4 classes + priorité
3. **Section "Suppression de code"** — nouvelle : 5 critères obligatoires
4. **FORMAT RAPPORT** — ajout champ "Classe"

### SKILL.md — 3 modifications
1. **Section "ORDRE DE PRIORITÉ"** — remplacée par 3 classes formalisées + règle d'arbitrage
2. **Section "FORMAT DE SORTIE — MISSION"** — ajout preuve pré-patch (étape F) + règle de sortie
3. **Section "ANTI-SCOPE-CREEP"** — ajout interdiction missions-sac + règle du ET

## Preuve de correction

### Non-duplication
- La qualification (4 classes) est définie dans CLAUDE.md uniquement
- SKILL.md référence CLAUDE.md pour la définition, et ajoute la logique d'arbitrage agent
- Aucune règle dupliquée entre les deux fichiers

### Cohérence
- CLAUDE.md dit "PRODUIT > HYGIÈNE > TEST > COSMÉTIQUE"
- SKILL.md détaille comment l'agent applique cet ordre
- Pas de contradiction

### Complétude
- Les 7 règles demandées sont couvertes
- Chaque règle est dans le bon fichier selon la séparation doctrine/comportement

## Traçabilité versionnement

| Fichier | Versionné ? | Localisation |
|---|---|---|
| CLAUDE.md | NON — hors repo | `Operation/CLAUDE.md` (disque) |
| SKILL.md | NON — hors repo | `~/.claude/skills/pilotage-critique/SKILL.md` (disque) |
| Rapport mission | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |
| Briefing GPT | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |
| MISSION_INDEX.md | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**

Les livrables primaires (CLAUDE.md, SKILL.md) sont hors repo par conception — ils ne font partie d'aucun dépôt git. Les artefacts d'audit (rapport, briefing, MISSION_INDEX) sont commités sur branche `mission/P1-UI-API-001`.
