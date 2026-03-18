# CRV Operations — État Compact du Projet

> Ce document est un point d'entrée rapide. Pour les règles complètes, lire `CLAUDE.md`. Pour le détail des missions, lire `MISSION_INDEX.md`.

## Le projet

**CRV** (Compte Rendu de Vol) — système opérationnel d'escale aérienne.
- **Backend** : Express.js + MongoDB (Mongoose) — repo `Back/`
- **Frontend** : Vue 3 + Pinia + Tailwind — repo `Front/`
- **Doctrine** : MADMIT (missions bornées, ≤5 fichiers, branches dédiées, zones rouges)

## Les 3 documents maîtres

| Document | Rôle | Chemin |
|---|---|---|
| `CLAUDE.md` | Doctrine stable (zones rouges, MADMIT, vocabulaire, protocoles) | `Operation/CLAUDE.md` |
| `SKILL.md` | Comportement agent (lecture avant action, mémoire, gouvernance) | `.claude/skills/pilotage-critique/SKILL.md` |
| `MISSION_INDEX.md` | État vivant (missions faites, backlog, priorités) | `Back/docs/audit/MISSION_INDEX.md` |

## État global réel

- **15 missions exécutées** — toutes FAIT ET BRANCHÉ, toutes MERGEABLE
- **P0 sécurité** : couvert (auth bypass corrigé sur routes CRV + phases/charges)
- **P1 bugs UX** : couvert (champs vol, wizard navigation, personnel)
- **P1 cohérence UI/API** : couvert (journal CRVEvent branché sur Personnel, Engins, Charges, Événements, Observations)
- **Gouvernance documentaire** : verrouillée (CLAUDE.md réaligné, skill créé, chemins corrigés)

## Chantiers restants (priorité décroissante)

### P2 — dette technique
- Exposer `GET /api/crv/:id/events` (journal CRVEvent consultable)
- `crvTransaction.service.js` potentiellement mort
- Logs excessifs front/backend
- Double rechargement CRV après chaque action
- Code mort / payloads incohérents

### P2 — tests
- Tests d'intégration sur périmètres critiques
- Tests permissions / verrouillage / auth

### P3 — améliorations
- Composant UI observations (backend prêt, pas d'UI)
- Brancher notifications eventRegistry sur CRVEvent
- Nettoyage abstractions cosmétiques

## Prochaine mission recommandée

**P2_ENDPOINT_001** — Exposer `GET /api/crv/:id/events`

## Branches actives (non mergées)

- `mission/P1-UI-API-001` (Back) — 8 commits : P1_UI_API_001→005 + CLAUDE_MD_REALIGNMENT + DOC_GOV_HARDENING + DOC_FINAL_LOCK
- `mission/P1-UX-004` (Front) — 1 commit : P1_UX_004
- Missions P0/P1_UX_001-003 — sur branches antérieures (voir git log)

## Zones rouges (NE JAMAIS MODIFIER)

**Backend** : `validation.service.js`, `crvArchivage.service.js`, `businessRules.middleware.js`, `crv.controller.js`
**Frontend** : `authStore.js`, `permissions.js`, `router/index.js`, `useAuth.js`
