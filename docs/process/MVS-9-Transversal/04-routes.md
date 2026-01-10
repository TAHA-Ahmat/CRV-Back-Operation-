# MVS-9-Transversal - ROUTES

## Date d'audit : 2026-01-10

---

## Constat

Pas de fichier routes dedie identifie pour le MVS-9-Transversal.

Les routes liees aux modeles transversaux sont definies dans les routes des autres MVS.

---

## Routes probables (via autres MVS)

### Routes Affectations personnel (MVS-5-Flights)

| Methode | Chemin | Description |
|---------|--------|-------------|
| GET | /api/vols/:id/personnel | Equipe affectee au vol |
| POST | /api/vols/:id/personnel | Affecter personnel |
| PUT | /api/vols/:id/personnel/:affectationId | Modifier affectation |
| DELETE | /api/vols/:id/personnel/:affectationId | Retirer personnel |

### Routes Evenements operationnels (MVS-2-CRV)

| Methode | Chemin | Description |
|---------|--------|-------------|
| GET | /api/crv/:id/evenements | Evenements du CRV |
| POST | /api/crv/:id/evenements | Declarer evenement |
| PUT | /api/crv/:id/evenements/:evenementId | Modifier evenement |
| POST | /api/crv/:id/evenements/:evenementId/resoudre | Marquer resolu |

---

## Structure suggérée

Si des routes dediees etaient creees :

```
src/routes/transversal/
├── affectationPersonne.routes.js
├── evenementOperationnel.routes.js
└── index.js
```

---

## Etat actuel

Pas de fichier routes dedie a documenter.

