# BRIEFING ARBITRAGE — CLAUDE_MD_REALIGNMENT

## Résumé court
CLAUDE.md contenait une section "ÉTAT DU PROJET" datée du 2026-03-03 avec des chiffres de bugs et un backlog obsolètes (11 missions exécutées depuis). Réaligné en séparant doctrine stable (CLAUDE.md) vs état vivant (MISSION_INDEX.md) vs comportement agent (Skill). 1 fichier modifié.

## Ce qui a réellement été fait
- Retiré : section bugs connus (chiffres faux), priorité Pareto (noms obsolètes), maturité figée
- Conservé : machine à états comme spécification de référence (pas comme planning)
- Ajouté : renvoi explicite vers MISSION_INDEX.md, section gouvernance documentaire, références au skill
- Corrigé : MISSION_LOG.md → MISSION_INDEX.md dans le protocole

## Ce qui peut être trompeur
1. **La machine à états est toujours dans CLAUDE.md** — c'est voulu. C'est une spécification figée (doctrine), pas un planning. Le "11 tests requis" a été retiré.
2. **CLAUDE.md ne mentionne plus les bugs connus** — c'est voulu. Les bugs vivent dans MISSION_INDEX.md. CLAUDE.md n'est pas un journal de bord.
3. **La maturité n'est plus chiffrée** — les anciens chiffres (80-82%) n'étaient plus fiables. Renvoi vers MISSION_INDEX.md.

## Points à challenger
1. **Faut-il garder la machine à états dans CLAUDE.md ET dans MISSION_INDEX.md ?** Actuellement elle n'est que dans CLAUDE.md. MISSION_INDEX ne la duplique pas. Pas de doublon.
2. **`.claude/MADMIT_DOCTRINE.md` est-il en drift ?** Non vérifié dans cette mission. Risque documenté.
3. **Les audits architecture sont-ils obsolètes ?** Possiblement. Hors scope mais signalé.

## Proposition de verdict
**MERGEABLE** — Réalignement minimal, 1 fichier modifié, aucune doctrine supprimée, séparation des responsabilités documentaires établie.
