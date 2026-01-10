# MVS-2-CRV

## Presentation factuelle

Le MVS-2-CRV constitue le coeur metier du systeme. Il gere les Comptes Rendus de Vol (CRV), documents centralisant toutes les informations relatives aux operations au sol effectuees lors de l'escale d'un avion.

---

## Perimetre exact couvert

### Fonctionnalites
- Creation et gestion du cycle de vie des CRV
- Documentation des operations au sol
- Calcul automatique de completude
- Gestion du personnel affecte
- Gestion du materiel utilise
- Ajout d'evenements operationnels
- Ajout d'observations
- Gestion des charges (passagers, bagages, fret)
- Archivage vers Google Drive
- Annulation et reactivation de CRV

### Entites gerees
- **CRV** : Compte Rendu de Vol (entite principale)
- **Observation** : Remarques operationnelles
- **HistoriqueModification** : Audit trail

### Endpoints exposes (principales)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/crv | Creer CRV |
| GET | /api/crv | Lister CRV |
| GET | /api/crv/:id | Obtenir CRV complet |
| PATCH | /api/crv/:id | Modifier CRV |
| DELETE | /api/crv/:id | Supprimer CRV |
| POST | /api/crv/:id/demarrer | Demarrer CRV |
| POST | /api/crv/:id/terminer | Terminer CRV |
| POST | /api/crv/:id/charges | Ajouter charge |
| POST | /api/crv/:id/evenements | Ajouter evenement |
| POST | /api/crv/:id/observations | Ajouter observation |
| PUT | /api/crv/:id/personnel | Gerer personnel |
| PUT | /api/crv/:id/engins | Gerer engins |
| PUT | /api/crv/:id/horaire | Modifier horaires |
| POST | /api/crv/:id/annuler | Annuler CRV |
| POST | /api/crv/:id/reactiver | Reactiver CRV |
| POST | /api/crv/:id/archive | Archiver CRV |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Analyse CRV, Observation, HistoriqueModification |
| 02-services.md | Services crv, annulation, archivage |
| 03-controllers.md | Handlers CRUD et metier |
| 04-routes.md | 30+ endpoints documentes |
| 05-process-metier.md | 5 process detailles |
| 06-risques-non-regression.md | Points critiques et tests |

---

## Dependances avec autres MVS

### Ce MVS utilise

| MVS | Dependance | Description |
|-----|------------|-------------|
| MVS-1-Security | Personne | creePar, modifiePar, etc. |
| MVS-3-Phases | Phase, ChronologiePhase | Phases operationnelles |
| MVS-3-Phases | Horaire | Horaires du vol |
| MVS-4-Charges | ChargeOperationnelle | Charges passagers/bagages/fret |
| MVS-5-Flights | Vol | Vol associe |
| MVS-9-Transversal | EvenementOperationnel | Evenements |

### Ce MVS est utilise par

| MVS | Dependance | Description |
|-----|------------|-------------|
| MVS-10-Validation | CRV | Validation et verrouillage |
| MVS-7-Notifications | CRV | Alertes SLA |

---

## Structure des fichiers

```
src/
├── models/
│   └── crv/
│       ├── CRV.js
│       ├── Observation.js
│       └── HistoriqueModification.js
├── services/
│   └── crv/
│       ├── crv.service.js
│       ├── annulation.service.js
│       └── crvArchivageService.js
├── controllers/
│   └── crv/
│       ├── crv.controller.js
│       ├── annulation.controller.js
│       └── crvArchivage.controller.js
└── routes/
    └── crv/
        └── crv.routes.js
```

---

## Cycle de vie CRV

| Statut | Description | Transitions possibles |
|--------|-------------|----------------------|
| BROUILLON | Creation initiale | EN_COURS |
| EN_COURS | Saisie en cours | TERMINE, BROUILLON |
| TERMINE | Saisie terminee | EN_COURS, VALIDE |
| VALIDE | Valide par superviseur | VERROUILLE |
| VERROUILLE | Fige definitivement | (aucune) |
| ANNULE | Annule | (ancien statut) |

---

## Regles metier cles

1. **Unicite** : 1 vol + 1 escale = 1 CRV
2. **Numerotation** : Format CRVyymmdd-NNNN
3. **Completude** : Phases 40%, Charges 30%, Evenements 20%, Observations 10%
4. **Terminer** : Requiert completude >= 50%
5. **Verrouillage** : CRV immutable une fois verrouille
6. **Role QUALITE** : Lecture seule

---

## Date d'audit

**2026-01-10**

---

## Notes d'audit

1. **Entite centrale** : Tous les autres MVS gravitent autour du CRV
2. **Suppression cascade** : 6 collections impactees
3. **Archivage Google Drive** : Integration externe
4. **Extension 6** : Annulation/Reactivation ajoutee
5. **Tracabilite complete** : Audit log sur toutes les operations
