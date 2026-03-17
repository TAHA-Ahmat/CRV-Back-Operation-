# P2_ENDPOINT_001 — RAPPORT MISSION

## Mission : P2_ENDPOINT_001
- Date : 2026-03-17
- Branche : mission/P1-UI-API-001 (Back)
- Périmètre : backend
- Domaine : consultation journal CRVEvent
- Classe : PRODUIT
- Niveau cérémonie : standard
- Fichiers modifiés : crv.routes.js (+1 import, +2 routes, +20 lignes)
- Fichiers zone rouge touchés : NON
- Lignes ajoutées/supprimées : +20 / -0
- Build avant/après : OK/OK
- Tests avant/après : 378 pass / 378 pass (53 fail inchangés — pré-existants)
- Impact comportemental : Le journal CRVEvent est maintenant consultable via 2 endpoints REST
- Rollback : git revert <hash>

## Objectif
Exposer les 2 endpoints de consultation du journal CRVEvent. Controller et service existaient déjà mais n'étaient pas branchés dans les routes.

## Mini-table de vérité

| Composant | Existait avant | Branché dans routes avant | Branché après |
|---|---|---|---|
| `getCRVEvents()` service | OUI | N/A | N/A |
| `getCRVEventStats()` service | OUI | N/A | N/A |
| `listerEvenementsCRV()` controller | OUI | NON | OUI |
| `statsEvenementsCRV()` controller | OUI | NON | OUI |
| `GET /api/crv/:id/events` | NON | — | OUI |
| `GET /api/crv/:id/events/stats` | NON | — | OUI |

## Patch appliqué

1 fichier modifié : `src/routes/crv/crv.routes.js`
- +1 ligne import : `listerEvenementsCRV`, `statsEvenementsCRV` depuis `crvEvent.controller.js`
- +2 routes GET protégées par `protect` + `excludeAdmin` (doctrine ADMIN)
- Placement : après transitions, avant confirmations d'absence (pas de risque de shadowing)

## Preuve de correction réelle

```
Login: 200 OK
CRV ID: 69b38a411c142b9136738cf5

GET /api/crv/:id/events → 200, success: true, count: 13
First event: OBSERVATION_ADDED - 2026-03-16T20:49:37.377Z

GET /api/crv/:id/events/stats → 200, success: true
Stats: 7 types d'événements, 13 événements total
  OBSERVATION_ADDED: 2, INCIDENT_REPORTED: 2, CHARGE_ADDED: 2,
  ENGINS_UPDATED: 2, PERSONNEL_UPDATED: 2, PHASE_COMPLETED: 2, ENGIN_ASSIGNED: 1

GET /api/crv/:id/events?type=PERSONNEL_UPDATED&limit=2 → 200, count: 2

VERDICT: PASS
```

## Validation minimale

| Test | Résultat |
|---|---|
| Build/start backend | PASS |
| Tests automatisés (378 pass) | PASS (identique avant/après) |
| GET /api/crv/:id/events | 200 OK, 13 events |
| GET /api/crv/:id/events/stats | 200 OK, 7 types agrégés |
| GET avec filtre type | 200 OK, filtrage correct |
| Zone rouge | AUCUN fichier touché |
| Surface : 1 fichier, +20 lignes | Dans limites MADMIT |
| Shadowing vérifié | Aucun conflit de route |

## Hors scope
- UI de consultation du journal (frontend)
- Pagination avancée / curseur
- Export CSV/Excel des événements
- Filtrage par date / userId

## Traçabilité versionnement

| Fichier | Versionné ? | Localisation |
|---|---|---|
| crv.routes.js | OUI | `Back/src/routes/crv/` — branche `mission/P1-UI-API-001` |
| Rapport mission | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |
| Briefing GPT | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |
| MISSION_INDEX.md | OUI | `Back/docs/audit/` — branche `mission/P1-UI-API-001` |

## Statut honnête final
**FAIT ET BRANCHÉ — MERGEABLE**
