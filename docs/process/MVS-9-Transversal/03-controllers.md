# MVS-9-Transversal - CONTROLLERS

## Date d'audit : 2026-01-10

---

## Constat

Pas de controller dedie identifie pour le MVS-9-Transversal.

Les operations sur les modeles transversaux sont gerees par les controllers des autres MVS.

---

## Integration dans autres MVS

### AffectationPersonneVol

| MVS | Controller | Operations |
|-----|------------|------------|
| MVS-5-Flights | vol.controller.js | CRUD affectations personnel |

### EvenementOperationnel

| MVS | Controller | Operations |
|-----|------------|------------|
| MVS-2-CRV | crv.controller.js | Declaration/resolution evenements |

---

## Endpoints probables (via autres MVS)

### Affectations personnel

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/vols/:id/personnel | Equipe du vol |
| POST | /api/vols/:id/personnel | Affecter personnel |
| PUT | /api/vols/:id/personnel/:affId | Modifier affectation |
| DELETE | /api/vols/:id/personnel/:affId | Retirer personnel |

### Evenements operationnels

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/crv/:id/evenements | Evenements du CRV |
| POST | /api/crv/:id/evenements | Declarer evenement |
| PUT | /api/crv/:id/evenements/:evtId | Modifier evenement |
| POST | /api/crv/:id/evenements/:evtId/resoudre | Resoudre evenement |

---

## Etat actuel

Pas de controller dedie a documenter.
Les modeles transversaux sont consommes par les controllers des autres MVS.

