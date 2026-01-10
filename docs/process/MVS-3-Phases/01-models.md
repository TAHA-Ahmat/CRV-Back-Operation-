# MVS-3-Phases - MODELS

## Date d'audit : 2026-01-10

---

## 1. Phase.js

### Emplacement
`src/models/phases/Phase.js`

### Role
Referentiel des phases operationnelles standard. Definit les etapes type d'une operation au sol.

### Champs

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `code` | String | OUI | unique, uppercase |
| `libelle` | String | OUI | - |
| `typeOperation` | String | OUI | enum: ARRIVEE, DEPART, TURN_AROUND, COMMUN |
| `categorie` | String | OUI | enum: PISTE, PASSAGERS, FRET, BAGAGE, TECHNIQUE, AVITAILLEMENT, NETTOYAGE, SECURITE |
| `ordre` | Number | OUI | min: 0 |
| `dureeStandardMinutes` | Number | OUI | min: 0 |
| `obligatoire` | Boolean | NON | default: true |
| `description` | String | NON | - |
| `prerequis` | [ObjectId] | NON | ref: Phase |
| `actif` | Boolean | NON | default: true |

### Index
- `typeOperation, ordre`
- `categorie`

### Relations
- `prerequis` -> Phase (auto-reference)

---

## 2. ChronologiePhase.js

### Emplacement
`src/models/phases/ChronologiePhase.js`

### Role
Instance d'une phase pour un CRV specifique. Trace l'execution reelle d'une phase.

### Champs

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `crv` | ObjectId | OUI | ref: CRV |
| `phase` | ObjectId | OUI | ref: Phase |
| `heureDebutPrevue` | Date | NON | - |
| `heureDebutReelle` | Date | NON | - |
| `heureFinPrevue` | Date | NON | - |
| `heureFinReelle` | Date | NON | - |
| `dureeReelleMinutes` | Number | NON | calcule auto |
| `ecartMinutes` | Number | NON | calcule auto |
| `statut` | String | NON | enum: NON_COMMENCE, EN_COURS, TERMINE, NON_REALISE, ANNULE |
| `motifNonRealisation` | String | NON | enum |
| `detailMotif` | String | NON | - |
| `responsable` | ObjectId | NON | ref: Personne |
| `remarques` | String | NON | - |

### Hook pre-save
1. Calcul `dureeReelleMinutes` si heures debut/fin renseignees
2. Calcul `ecartMinutes` par rapport au prevu
3. Reset durees si statut = NON_REALISE

### Index
- `crv, phase`
- `statut`

---

## 3. Horaire.js

### Emplacement
`src/models/phases/Horaire.js`

### Role
Centralise tous les horaires cles d'un vol (atterrissage, decollage, parc, etc.).

### Champs

| Champ | Type | Requis |
|-------|------|--------|
| `vol` | ObjectId | OUI (ref: Vol) |
| `heureAtterrisagePrevue` | Date | NON |
| `heureAtterrissageReelle` | Date | NON |
| `heureArriveeAuParcPrevue` | Date | NON |
| `heureArriveeAuParcReelle` | Date | NON |
| `heureDepartDuParcPrevue` | Date | NON |
| `heureDepartDuParcReelle` | Date | NON |
| `heureDecollagePrevue` | Date | NON |
| `heureDecollageReelle` | Date | NON |
| `heureOuvertureParkingPrevue` | Date | NON |
| `heureOuvertureParkingReelle` | Date | NON |
| `heureFermetureParkingPrevue` | Date | NON |
| `heureFermetureParkingReelle` | Date | NON |
| `heureRemiseDocumentsPrevue` | Date | NON |
| `heureRemiseDocumentsReelle` | Date | NON |
| `heureLivraisonBagagesDebut` | Date | NON |
| `heureLivraisonBagagesFin` | Date | NON |
| `ecartAtterissage` | Number | NON |
| `ecartDecollage` | Number | NON |
| `ecartParc` | Number | NON |
| `remarques` | String | NON |

### Hook pre-save
Calcul automatique des ecarts (atterrissage, decollage, parc)

---

## SYNTHESE

| Modele | Role | Criticite |
|--------|------|-----------|
| Phase | Referentiel phases | HAUTE |
| ChronologiePhase | Instance phase/CRV | CRITIQUE |
| Horaire | Horaires vol | HAUTE |
