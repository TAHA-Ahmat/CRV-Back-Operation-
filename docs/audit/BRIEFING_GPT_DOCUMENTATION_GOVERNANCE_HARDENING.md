# BRIEFING ARBITRAGE — DOCUMENTATION_GOVERNANCE_HARDENING

## Résumé court
Deux angles morts dans la gouvernance documentaire : (1) le vocabulaire de statut était défini dans le SKILL mais CLAUDE.md ne le portait pas, alors que le SKILL dit "appliquer celui de CLAUDE.md" — référence circulaire vide. (2) Aucune règle ne disait quand/comment mettre à jour le SKILL lui-même. Fix : vocabulaire migré dans CLAUDE.md (doctrine), SKILL simplifié + règle MAJ ajoutée + règle de priorité en cas de contradiction.

## Ce qui a réellement été fait
- CLAUDE.md : ajout section "Vocabulaire de statut — OBLIGATOIRE" (7 statuts + formulations interdites)
- SKILL.md : section vocabulaire réduite à 2 lignes (renvoi CLAUDE.md)
- SKILL.md : ajout section "Règle MAJ du SKILL" (quand, quoi, contradiction)

## Ce qui peut être trompeur
1. **Le format A→K n'est PAS dans CLAUDE.md** — c'est voulu. C'est du comportement agent (comment structurer une réponse), pas de la doctrine projet. Il reste dans le skill.
2. **L'anti-scope-creep est dans les deux** — le skill dit "appliquer CLAUDE.md". C'est un renvoi, pas une duplication. Acceptable.
3. **La règle de contradiction est asymétrique** — CLAUDE.md fait foi pour la doctrine, SKILL fait foi pour le comportement. C'est la bonne logique.

## Points à challenger
1. **Faut-il que CLAUDE.md référence explicitement le format A→K ?** Non — c'est du comportement agent lié au skill. CLAUDE.md a déjà son propre format rapport (plus court, orienté git).
2. **`.claude/MADMIT_DOCTRINE.md` est-il en drift ?** Non vérifié. C'est un risque documenté mais hors scope.
3. **La règle de MAJ du skill est-elle suffisante ?** Elle couvre les cas (changement pilotage, hiérarchie, drift) et les interdictions (pas d'état projet, pas de doublons). Semble suffisant.

## Proposition de verdict
**MERGEABLE** — 2 fichiers modifiés, zéro redondance nouvelle, deux angles morts comblés, système documentaire plus robuste.
