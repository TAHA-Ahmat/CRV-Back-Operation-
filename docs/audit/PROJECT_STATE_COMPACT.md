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

## État global réel — 18/06/2026

- **Missions exécutées** : 40+ toutes FAIT ET BRANCHÉ / MERGEABLE
- **P0 sécurité** : couvert (auth bypass, VersionError 500, zones rouges stables)
- **P1 bugs UX** : couvert (wizard, charges, phases, binding, pré-remplissage)
- **P1 cohérence UI/API** : couvert (CRVEvent branché sur toutes les sous-ressources)
- **Gouvernance documentaire** : verrouillée
- **Google Drive** : ✅ LIVRÉ ba7c552 — archivage PDF à VALIDE, prouvé en prod
- **Audit UX terrain** : ✅ LIVRÉ 8968bbe — 6 fichiers Front, voir ci-dessous

## Derniers livraisons (session 7, 18/06/2026)

### Commit 8968bbe — Audit UX terrain (6 fichiers Front)

| Fichier | Fix |
|---|---|
| `Login.vue` | Œil show/hide MDP + spinner "Connexion en cours..." pendant isLoading |
| `AppFooter.vue` | © 2025 → © 2026 |
| `AppHeader.vue` | Bouton thème jour/nuit dans menu hamburger mobile (< 768px) |
| `CRVTurnAround.vue` | Bug critique : bouton nav masqué sur CRV VERROUILLE → "Voir la suite →" toujours visible |
| `CRVArrivee.vue` | Idem (6 étapes) |
| `CRVDepart.vue` | Idem (6 étapes) |

**Bug critique résolu** : sur un CRV VERROUILLÉ, les boutons "Continuer" étaient masqués par `v-if="!crvStore.isLocked"`. Un agent terrain ouvrant un CRV verrouillé pour consultation ne pouvait naviguer entre les 7 étapes qu'en cliquant les petits cercles. Fix : bouton toujours présent, texte conditionnel.

### Commit ba7c552 — Google Drive (session 6)
Archivage PDF automatique à la validation (TERMINE→VALIDE). Prod prouvé : fileId `1KfnNUccCaUZ9lQNJjr-kSagIXe95kE_M`.

## Chantiers restants avant livraison prod

| Priorité | Chantier | Contrainte |
|---|---|---|
| 1 (HAUTE) | RUNBOOK THS Aéro | Guide terrain en français — livraison terrain |
| 2 | Rotation credentials | MONGO_URI + JWT_SECRET + SendGrid — alerte haute |
| 3 | Test tablette physique | Jamais testé device réel |
| 4 | Nettoyage données test | CRV/vols/comptes recette → supprimer avant prod |
| DERNIER | Render keep-alive | Instruction utilisateur explicite : régler ça vraiment à la fin |

## Zones rouges (NE JAMAIS MODIFIER sans autorisation explicite)

**Backend** : `validation.service.js`, `crvArchivage.service.js`, `businessRules.middleware.js`, `crv.controller.js`
**Frontend** : `authStore.js`, `permissions.js`, `router/index.js`, `useAuth.js`

## Comptes de recette THS Aéro

| Email | Password | Rôle |
|---|---|---|
| admin@crv.ths | THS2026! | ADMIN |
| agent@crv.ths | THS2026! | AGENT_ESCALE |
| chef@crv.ths | THS2026! | CHEF_EQUIPE |
| superviseur2@crv.ths | THS2026Recette! | SUPERVISEUR |
| manager2@crv.ths | THS2026Recette! | MANAGER |

## CRV de référence

- ID : 6a32f701efcc2b379a18b758
- Numéro : CRV260617-0011
- Vol : THS-TA-0001 (TURN_AROUND)
- Statut : **VERROUILLE** (17/06/2026 20:37 UTC) — cycle complet prouvé
