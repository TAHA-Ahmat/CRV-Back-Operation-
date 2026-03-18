# BRIEFING ARBITRAGE — GOVERNANCE_HARDENING_PRE_P2

## Résumé court
Durcissement documentaire pré-P2 : 7 règles ajoutées dans CLAUDE.md et SKILL.md pour encadrer le passage aux missions élargies. Interdiction missions-sac, qualification obligatoire, suppression code mort encadrée, priorisation formalisée.

## Ce qui a réellement été fait
- **CLAUDE.md** : 3 nouvelles sections doctrine (anti-sac + découpage, qualification 4 classes, suppression code mort 5 critères) + champ Classe dans format rapport
- **SKILL.md** : priorisation 3 classes formalisée (remplace l'ancienne section vague), preuve pré-patch obligatoire (étape F), règle de sortie (1 ligne/changement), anti-scope-creep renforcé

## Ce qui peut être trompeur
1. **Les seuils élargis (8 fichiers / 300 lignes) sont des maximums, pas des cibles** — la baseline reste 5/150. L'élargi est autorisé uniquement si mono-domaine et justifiable.
2. **La règle du ET est simple mais pas absolue** — l'exception "causalité inséparable" existe. Elle doit être prouvée dans le rapport, pas déclarée.
3. **Les 5 critères de suppression code mort peuvent ralentir** — c'est voulu. Mieux vaut garder un fichier mort documenté que supprimer un fichier vivant par erreur.

## Points à challenger
1. **Le seuil de 8 fichiers est-il trop laxiste ?** Il correspond à un domaine complet (ex: brancher CRVEvent sur 5 wrappers = 5 nouveaux + 2 modifiés + 1 route = 8). Est-ce trop ?
2. **La priorisation PRODUIT > HYGIÈNE est-elle toujours juste ?** Cas limite : une dette technique dangereuse (service non branché qui masque un bug) vs une feature mineure. L'arbitrage humain reste le garde-fou.
3. **La règle de sortie "1 ligne/changement" est-elle trop stricte ?** Elle sert de signal, pas de veto. Si le rapport dépasse mais reste clair, c'est MERGEABLE AVEC RÉSERVES, pas NON MERGEABLE.

## Traçabilité versionnement
- **CLAUDE.md** et **SKILL.md** : modifiés sur disque, hors repo git (par conception — ces fichiers ne font partie d'aucun dépôt)
- **Rapport, briefing, MISSION_INDEX** : commités sur branche `mission/P1-UI-API-001` (repo Back)

## Proposition de verdict
**MERGEABLE** — 7 règles ajoutées, zéro duplication, zéro contradiction, zéro code métier touché. Le cadre est prêt pour les missions P2.
