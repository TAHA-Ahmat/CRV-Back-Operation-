# MVS-6-Resources - MODELS

## Date d'audit : 2026-01-10

---

## Engin.js

### Emplacement
`src/models/resources/Engin.js`

### Description
Referentiel des engins du parc materiel au sol.

---

### Schema

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| numeroEngin | String | Oui | Numero unique (uppercase, trim) |
| typeEngin | String (enum) | Oui | Type d'engin |
| marque | String | Non | Marque de l'engin |
| modele | String | Non | Modele de l'engin |
| statut | String (enum) | Non | Statut operationnel |
| derniereRevision | Date | Non | Date derniere revision |
| prochaineRevision | Date | Non | Date prochaine revision |
| remarques | String | Non | Remarques |

---

### Enum typeEngin

| Valeur | Description |
|--------|-------------|
| TRACTEUR | Tracteur pour remorquage |
| CHARIOT_BAGAGES | Chariot a bagages |
| CHARIOT_FRET | Chariot a fret |
| GPU | Ground Power Unit |
| ASU | Air Starter Unit |
| STAIRS | Passerelle/Escalier |
| CONVOYEUR | Convoyeur a bande |
| AUTRE | Autre type |

---

### Enum statut

| Valeur | Description |
|--------|-------------|
| DISPONIBLE | Pret a l'emploi |
| EN_SERVICE | Actuellement utilise |
| MAINTENANCE | En maintenance planifiee |
| PANNE | Hors service temporaire |
| HORS_SERVICE | Hors service definitif |

---

### Index

| Champs | Type |
|--------|------|
| numeroEngin | Simple unique |
| typeEngin | Simple |
| statut | Simple |

---

## AffectationEnginVol.js

### Emplacement
`src/models/resources/AffectationEnginVol.js`

### Description
Affectation d'un engin a un vol (relation N:N entre Engin et Vol).

---

### Schema

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| vol | ObjectId (ref: Vol) | Oui | Reference au vol |
| engin | ObjectId (ref: Engin) | Oui | Reference a l'engin |
| heureDebut | Date | Oui | Heure debut utilisation |
| heureFin | Date | Non | Heure fin utilisation |
| usage | String (enum) | Oui | Type d'utilisation |
| statut | String (enum) | Non | Statut affectation |
| remarques | String | Non | Remarques |

---

### Enum usage

| Valeur | Description |
|--------|-------------|
| TRACTAGE | Tractage avion |
| BAGAGES | Chargement/dechargement bagages |
| FRET | Chargement/dechargement fret |
| ALIMENTATION_ELECTRIQUE | Alimentation electrique (GPU) |
| CLIMATISATION | Climatisation (ASU) |
| PASSERELLE | Acces passagers |
| CHARGEMENT | Chargement general |

---

### Enum statut affectation

| Valeur | Description |
|--------|-------------|
| AFFECTE | Engin affecte mais pas encore utilise |
| EN_COURS | Utilisation en cours |
| TERMINE | Utilisation terminee |
| PANNE | Engin en panne pendant l'affectation |

---

### Index

| Champs | Type |
|--------|------|
| vol | Simple |
| engin | Simple |
| heureDebut | Simple |

---

## Options Schema

| Option | Valeur |
|--------|--------|
| timestamps | true |

