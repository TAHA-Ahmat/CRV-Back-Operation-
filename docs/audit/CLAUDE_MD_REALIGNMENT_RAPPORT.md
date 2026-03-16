# CLAUDE_MD_REALIGNMENT — RAPPORT MISSION

## Objectif
Réaligner CLAUDE.md avec la nouvelle architecture de gouvernance documentaire : séparer doctrine stable vs état vivant du projet.

## Diagnostic initial
CLAUDE.md contenait une section "ÉTAT DU PROJET" datée du 2026-03-03 avec :
- "6 bugs P0 backend" (partiellement corrigés par P0_ROUTE_AUTH_001/002)
- "12 bugs critiques frontend" (certains corrigés par P1_UX_001-004)
- Une priorité Pareto avec "MISSION 001/002" qui n'existent plus sous ces noms
- Des chiffres de maturité figés (80-82%)

Ce contenu crée un DRIFT actif : toute nouvelle session croit que le projet est dans l'état du 03/03 alors que 11 missions ont été exécutées depuis.

## Mini-table de vérité

| Élément | Avant | Problème | Après |
|---|---|---|---|
| Identité projet | Maturité "~80-82%" figée | Chiffre obsolète et trompeur | Renvoi vers MISSION_INDEX |
| Protocole après modif (L86) | "Mettre à jour MISSION_LOG.md" | Fichier inexistant | "Mettre à jour docs/audit/MISSION_INDEX.md" |
| Bugs connus (L115-118) | Liste figée 03/03 | Partiellement corrigés, chiffres faux | Supprimé — renvoi MISSION_INDEX |
| Priorité Pareto (L120-129) | 9 items avec "MISSION 001/002" | Noms obsolètes, ordre dépassé | Supprimé — renvoi MISSION_INDEX |
| Machine à états tests (L131-145) | "11 tests requis" + spec | Spec valide, planning obsolète | Spec conservée comme référence, planning retiré |
| Fichiers de référence (L147-151) | 4 fichiers | Manque MISSION_INDEX et skill | 6 fichiers incluant skill et MISSION_INDEX |
| Gouvernance documentaire | Absente | Pas de séparation claire CLAUDE.md/skill/MISSION_INDEX | Section explicite ajoutée |

## Problème prioritaire retenu
DRIFT entre doctrine stable (CLAUDE.md) et état réel (MISSION_INDEX.md). Résolu en séparant les responsabilités.

## Fichiers modifiés
| Fichier | Modification |
|---|---|
| `CLAUDE.md` | Retrait section état projet obsolète, renvoi vers MISSION_INDEX, ajout section gouvernance documentaire, correction MISSION_LOG→MISSION_INDEX |

**Fichiers zone rouge touchés : NON**

## Patch appliqué
1. Maturité datée → renvoi vers MISSION_INDEX.md
2. MISSION_LOG.md (inexistant) → `docs/audit/MISSION_INDEX.md`
3. Section "ÉTAT DU PROJET" (40 lignes de backlog obsolète) → 9 lignes de renvoi clair
4. Machine à états : conservée comme spécification, retirée comme planning
5. Section "GOUVERNANCE DOCUMENTAIRE" ajoutée : rôles CLAUDE.md / Skill / MISSION_INDEX
6. Fichiers de référence : ajout Skill et MISSION_INDEX

## Preuve de correction

### Séparation des responsabilités (après)
| Document | Responsabilité | Contenu type |
|---|---|---|
| `CLAUDE.md` | Doctrine stable | Zones rouges, MADMIT, protocoles, machine à états spec |
| `MISSION_INDEX.md` | État vivant | Missions faites, backlog, priorités courantes |
| `SKILL.md` | Comportement agent | Lecture-avant-action, anti-duplication, vocabulaire, format |

### Cohérence vérifiée
- CLAUDE.md renvoie vers MISSION_INDEX.md pour l'état vivant ✓
- CLAUDE.md mentionne le skill comme complément ✓
- Skill mentionne CLAUDE.md comme source de doctrine ✓
- Aucune contradiction frontale entre les 3 documents ✓
- Aucune information obsolète dans CLAUDE.md ✓

## Validation minimale exécutée
| Test | Résultat |
|---|---|
| CLAUDE.md ne contient plus de backlog daté | PASS |
| CLAUDE.md renvoie vers MISSION_INDEX.md | PASS |
| CLAUDE.md mentionne le skill | PASS |
| Machine à états spec conservée | PASS |
| Doctrine (zones rouges, MADMIT, protocoles) intacte | PASS |
| Pas de contradiction avec skill | PASS |
| Pas de contradiction avec MISSION_INDEX | PASS |

## Hors scope
- Mise à jour du contenu de MISSION_INDEX.md (déjà à jour)
- Mise à jour de .claude/MADMIT_DOCTRINE.md (potentiel drift, mais hors scope)
- Mise à jour des audits architecture (Back/Front/E2E)

## Risques restants
1. `.claude/MADMIT_DOCTRINE.md` pourrait contenir des éléments en drift avec le CLAUDE.md réaligné — à vérifier dans une future mission.
2. Les audits architecture (`CRV_BACKEND_CERTIFICATION.md`, `CRV_FRONTEND_AUDIT.md`, `CRV_END_TO_END_AUDIT.md`) datent aussi et pourraient contenir des informations obsolètes.

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
