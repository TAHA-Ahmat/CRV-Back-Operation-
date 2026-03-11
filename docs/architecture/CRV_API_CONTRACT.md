# CRV API — CONTRAT OFFICIEL FRONTEND

> **Version** : 1.0.0
> **Date** : 2026-03-09
> **Branche** : `mission/backend-certification`
> **Certification** : 88/88 tests PASS — 0 échec
> **Base URL** : `http://localhost:4000/api`

---

## 1. INVENTAIRE DES MODÈLES

### 1.1 CRV (Compte Rendu de Vol)

| Champ | Type | Requis | Défaut | Contraintes |
|-------|------|--------|--------|-------------|
| `numeroCRV` | String | oui | auto-généré | unique, trim |
| `vol` | ObjectId → Vol | oui | — | ref obligatoire |
| `escale` | String | oui | — | 3-4 car., uppercase, IATA |
| `statut` | String | non | `BROUILLON` | enum (voir §4) |
| `completude` | Number | non | `0` | 0-100 |
| `creePar` | ObjectId → Personne | oui | — | auto (token) |
| `responsableVol` | ObjectId → Personne | non | — | — |
| `dateCreation` | Date | non | `Date.now` | — |
| `derniereModification` | Date | non | `Date.now` | auto pre-save |
| `verrouillePar` | ObjectId → Personne | non | — | — |
| `dateVerrouillage` | Date | non | — | — |
| `crvDoublon` | Boolean | non | `false` | — |
| `bulletinMouvementReference` | ObjectId → Bulletin | non | `null` | — |

**Sous-document `archivage`** :
| Champ | Type | Défaut |
|-------|------|--------|
| `driveFileId` | String | `null` |
| `driveWebViewLink` | String | `null` |
| `filename` | String | `null` |
| `archivedAt` | Date | `null` |
| `archivedBy` | ObjectId → Personne | `null` |
| `version` | Number | `1` |

**Tableau `personnelAffecte`** (embedded) :
| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `nom` | String | oui | trim |
| `prenom` | String | oui | trim |
| `fonction` | String | oui | enum (voir §4) |
| `matricule` | String | non | — |
| `telephone` | String | non | — |
| `remarques` | String | non | — |

**Tableau `materielUtilise`** (embedded) :
| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `typeEngin` | String | oui | enum (voir §4) |
| `identifiant` | String | oui | uppercase |
| `heureDebutUtilisation` | Date | non | — |
| `heureFinUtilisation` | Date | non | — |
| `operateur` | String | non | — |
| `remarques` | String | non | — |

**Sous-document `annulation`** :
| Champ | Type | Défaut |
|-------|------|--------|
| `dateAnnulation` | Date | `null` |
| `annulePar` | ObjectId → Personne | `null` |
| `raisonAnnulation` | String | `null` |
| `commentaireAnnulation` | String | `null` |
| `ancienStatut` | String | `null` |

---

### 1.2 Vol

| Champ | Type | Requis | Défaut | Contraintes |
|-------|------|--------|--------|-------------|
| `numeroVol` | String | oui | — | uppercase |
| `typeOperation` | String | non | `null` | enum (voir §4) |
| `compagnieAerienne` | String | oui | — | — |
| `codeIATA` | String | oui | — | 2 car., uppercase |
| `aeroportOrigine` | String | non | — | uppercase |
| `aeroportDestination` | String | non | — | uppercase |
| `dateVol` | Date | oui | — | — |
| `statut` | String | non | `PROGRAMME` | enum (voir §4) |
| `horsProgramme` | Boolean | non | `false` | — |
| `typeVolHorsProgramme` | String | non | `null` | enum (voir §4) |
| `raisonHorsProgramme` | String | non | `null` | — |

---

### 1.3 ChronologiePhase

| Champ | Type | Requis | Défaut | Contraintes |
|-------|------|--------|--------|-------------|
| `crv` | ObjectId → CRV | oui | — | — |
| `phase` | ObjectId → Phase | oui | — | — |
| `statut` | String | non | `NON_COMMENCE` | enum (voir §4) |
| `heureDebutReelle` | Date | non | — | — |
| `heureFinReelle` | Date | non | — | — |
| `dureeReelleMinutes` | Number | non | — | calculé auto |
| `motifNonRealisation` | String | non | — | enum (voir §4) |
| `detailMotif` | String | non | — | — |
| `remarques` | String | non | — | — |

---

### 1.4 Engin (Référentiel)

| Champ | Type | Requis | Unique | Défaut | Contraintes |
|-------|------|--------|--------|--------|-------------|
| `numeroEngin` | String | oui | oui | — | uppercase |
| `typeEngin` | String | oui | — | — | enum (voir §4) |
| `statut` | String | non | — | `DISPONIBLE` | enum (voir §4) |
| `marque` | String | non | — | — | — |
| `modele` | String | non | — | — | — |

---

### 1.5 ValidationCRV

| Champ | Type | Requis | Défaut | Contraintes |
|-------|------|--------|--------|-------------|
| `crv` | ObjectId → CRV | oui (unique) | — | — |
| `validePar` | ObjectId → Personne | oui | — | — |
| `statut` | String | oui | — | enum (voir §4) |
| `scoreCompletude` | Number | non | — | 0-100 |
| `conformiteSLA` | Boolean | non | `false` | — |
| `anomaliesDetectees` | [String] | non | — | — |
| `verrouille` | Boolean | non | `false` | — |
| `dateVerrouillage` | Date | non | — | — |

---

## 2. INVENTAIRE DES ROUTES

### 2.1 Authentification — `/api/auth`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/auth/login` | public | Connexion → token JWT |
| POST | `/auth/register` | public | Inscription |
| GET | `/auth/me` | tous | Profil utilisateur courant |
| POST | `/auth/changer-mot-de-passe` | tous | Changement de mot de passe |

---

### 2.2 CRV — `/api/crv`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/crv` | AGENT, CHEF, SUP, MGR | Créer CRV (avec vol) |
| GET | `/crv` | tous | Lister CRVs (pagination) |
| GET | `/crv/search?q=` | tous | Rechercher CRV |
| GET | `/crv/:id` | tous | Obtenir un CRV |
| PATCH | `/crv/:id` | tous sauf QUALITE | Mise à jour partielle |
| DELETE | `/crv/:id` | tous sauf QUALITE | Supprimer (< TERMINE) |
| GET | `/crv/:id/transitions` | tous | Transitions possibles |
| POST | `/crv/:id/demarrer` | AGENT, CHEF, SUP, MGR | BROUILLON → EN_COURS |
| POST | `/crv/:id/terminer` | AGENT, CHEF, SUP, MGR | EN_COURS → TERMINE |
| POST | `/crv/:id/annuler` | SUP, MGR | → ANNULE |
| POST | `/crv/:id/reactiver` | tous sauf QUALITE | ANNULE → ancien statut |

---

### 2.3 Personnel — `/api/crv/:id/personnel`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/crv/:id/personnel` | tous sauf QUALITE | Ajouter un membre |
| PUT | `/crv/:id/personnel` | tous sauf QUALITE | Remplacer tout le personnel |
| DELETE | `/crv/:id/personnel/:pid` | tous sauf QUALITE | Supprimer un membre |

---

### 2.4 Engins — `/api/crv/:id/engins`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| GET | `/crv/:id/engins` | tous | Obtenir engins affectés |
| PUT | `/crv/:id/engins` | tous sauf QUALITE | Remplacer tous les engins |
| POST | `/crv/:id/engins` | tous sauf QUALITE | Ajouter un engin |
| DELETE | `/crv/:id/engins/:affId` | tous sauf QUALITE | Retirer un engin |

**Types frontend valides pour PUT** (clés lowercase) :
`tracteur`, `chariot_bagages`, `chariot_fret`, `camion_fret`, `passerelle`, `gpu`, `asu`, `camion_avitaillement`, `convoyeur`, `autre`

---

### 2.5 Phases — `/api/phases`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| GET | `/phases?crvId=` | tous | Lister phases d'un CRV |
| GET | `/phases/:id` | tous | Obtenir une phase |
| POST | `/phases/:id/demarrer` | tous sauf QUALITE | NON_COMMENCE → EN_COURS |
| POST | `/phases/:id/terminer` | tous sauf QUALITE | EN_COURS → TERMINE |
| POST | `/phases/:id/non-realise` | tous sauf QUALITE | → NON_REALISE (avec motif) |
| PATCH | `/phases/:id` | tous sauf QUALITE | Mise à jour phase |

---

### 2.6 Charges — `/api/crv/:id/charges`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/crv/:id/charges` | tous sauf QUALITE | Ajouter une charge |

**Body requis** :
```json
{
  "typeCharge": "PASSAGERS|BAGAGES|FRET",
  "sensOperation": "EMBARQUEMENT|DEBARQUEMENT",
  "nombre": 120,
  "poids": 1500
}
```

---

### 2.7 Événements — `/api/crv/:id/evenements`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/crv/:id/evenements` | tous sauf QUALITE | Ajouter un événement |

**Body requis** :
```json
{
  "type": "PANNE_EQUIPEMENT|ABSENCE_PERSONNEL|RETARD|INCIDENT_SECURITE|INCIDENT_TECHNIQUE|PROBLEME_TECHNIQUE|METEO|AUTRE",
  "gravite": "MINEURE|MODEREE|MAJEURE|CRITIQUE",
  "description": "..."
}
```

---

### 2.8 Observations — `/api/crv/:id/observations`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| POST | `/crv/:id/observations` | tous sauf QUALITE | Ajouter une observation |

**Body requis** :
```json
{
  "categorie": "GENERALE|TECHNIQUE|OPERATIONNELLE|SECURITE|QUALITE|SLA",
  "contenu": "..."
}
```

---

### 2.9 Validation — `/api/validation`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| GET | `/validation/:id` | tous | Obtenir validation d'un CRV |
| POST | `/validation/:id/valider` | SUP, MGR | TERMINE → VALIDE/VERROUILLE |
| POST | `/validation/:id/verrouiller` | SUP, MGR | VALIDE → VERROUILLE |
| POST | `/validation/:id/deverrouiller` | SUP, MGR | VERROUILLE → VALIDE (si non archivé) |
| POST | `/validation/:id/rejeter` | SUP, MGR | Rejeter avec motif |

---

### 2.10 Engins (Référentiel) — `/api/engins`

| Method | Path | Rôles | Description |
|--------|------|-------|-------------|
| GET | `/engins` | tous | Lister le parc matériel |
| GET | `/engins/types` | tous | Types d'engins disponibles |
| GET | `/engins/disponibles` | tous | Engins disponibles |
| POST | `/engins` | MGR, ADMIN | Créer un engin |
| PUT | `/engins/:id` | MGR, ADMIN | Modifier un engin |
| DELETE | `/engins/:id` | ADMIN | Supprimer un engin |

---

## 3. WORKFLOW CRV — MACHINE À ÉTATS

```
BROUILLON ──demarrer──→ EN_COURS ──terminer──→ TERMINE
                                                  │
                                            valider│
                                                  ▼
                                               VALIDE
                                                  │
                                        verrouiller│
                                                  ▼
                                            VERROUILLE
                                                  │
                              deverrouiller│       │ (si non archivé)
                                          ▼       │
                                        VALIDE ◄──┘

Depuis VALIDE ou VERROUILLE:
  ──annuler──→ ANNULE ──reactiver──→ (ancien statut)

RÈGLE IMMUABLE: Un CRV archivé (driveFileId != null) ne peut JAMAIS être déverrouillé.
```

### Transitions validées par tests

| De | Vers | Action | Route | Status OK | Status refus |
|----|------|--------|-------|-----------|-------------|
| BROUILLON | EN_COURS | demarrer | POST `/crv/:id/demarrer` | 200 | — |
| BROUILLON | VALIDER | ❌ interdit | POST `/validation/:id/valider` | — | 409 |
| BROUILLON | VERROUILLER | ❌ interdit | POST `/validation/:id/verrouiller` | — | 409 |
| BROUILLON | TERMINER | ❌ interdit | POST `/crv/:id/terminer` | — | 400 |
| EN_COURS | TERMINE | terminer | POST `/crv/:id/terminer` | 200 | — |
| EN_COURS | VALIDER | ❌ interdit | POST `/validation/:id/valider` | — | 409 |
| EN_COURS | VERROUILLER | ❌ interdit | POST `/validation/:id/verrouiller` | — | 409 |
| TERMINE | VALIDE/VERROUILLE | valider | POST `/validation/:id/valider` | 200 | — |
| VALIDE | VERROUILLE | verrouiller | POST `/validation/:id/verrouiller` | 200 | — |
| VERROUILLE | VALIDE | deverrouiller | POST `/validation/:id/deverrouiller` | 200 | 403 (archivé) |
| VERROUILLE | VERROUILLE | ❌ doublon | POST `/validation/:id/verrouiller` | — | 409 |

---

## 4. ENUMS OFFICIELS

### CRV

| Champ | Valeurs |
|-------|---------|
| `statut` | `BROUILLON`, `EN_COURS`, `TERMINE`, `VALIDE`, `VERROUILLE`, `ANNULE` |
| `personnelAffecte.fonction` | `CHEF_ESCALE`, `AGENT_TRAFIC`, `AGENT_PISTE`, `AGENT_PASSAGE`, `MANUTENTIONNAIRE`, `CHAUFFEUR`, `AGENT_SECURITE`, `TECHNICIEN`, `SUPERVISEUR`, `COORDINATEUR`, `AUTRE` |
| `materielUtilise.typeEngin` | `TRACTEUR_PUSHBACK`, `PASSERELLE`, `TAPIS_BAGAGES`, `GPU`, `ASU`, `ESCALIER`, `TRANSBORDEUR`, `CAMION_AVITAILLEMENT`, `CAMION_VIDANGE`, `CAMION_EAU`, `ELEVATEUR`, `CHARIOT_BAGAGES`, `CONTENEUR_ULD`, `DOLLY`, `AUTRE` |

### Vol

| Champ | Valeurs |
|-------|---------|
| `typeOperation` | `ARRIVEE`, `DEPART`, `TURN_AROUND` |
| `statut` | `PROGRAMME`, `EN_COURS`, `TERMINE`, `ANNULE`, `RETARDE` |
| `typeVolHorsProgramme` | `CHARTER`, `MEDICAL`, `TECHNIQUE`, `COMMERCIAL`, `CARGO`, `AUTRE` |

### Phase

| Champ | Valeurs |
|-------|---------|
| `statut` | `NON_COMMENCE`, `EN_COURS`, `TERMINE`, `NON_REALISE`, `ANNULE` |
| `motifNonRealisation` | `NON_NECESSAIRE`, `EQUIPEMENT_INDISPONIBLE`, `PERSONNEL_ABSENT`, `CONDITIONS_METEO`, `AUTRE` |

### Engin (Référentiel)

| Champ | Valeurs |
|-------|---------|
| `typeEngin` | `TRACTEUR`, `CHARIOT_BAGAGES`, `CHARIOT_FRET`, `GPU`, `ASU`, `STAIRS`, `CONVOYEUR`, `AUTRE` |
| `statut` | `DISPONIBLE`, `EN_SERVICE`, `MAINTENANCE`, `PANNE`, `HORS_SERVICE` |

### Affectation Engin

| Champ | Valeurs |
|-------|---------|
| `usage` | `TRACTAGE`, `BAGAGES`, `FRET`, `ALIMENTATION_ELECTRIQUE`, `CLIMATISATION`, `PASSERELLE`, `CHARGEMENT` |
| `statut` | `AFFECTE`, `EN_COURS`, `TERMINE`, `PANNE` |

### Validation

| Champ | Valeurs |
|-------|---------|
| `statut` | `VALIDE`, `INVALIDE`, `EN_ATTENTE_CORRECTION` |

### Validation routes (body validators)

| Champ | Valeurs |
|-------|---------|
| `typeCharge` | `PASSAGERS`, `BAGAGES`, `FRET` |
| `sensOperation` | `EMBARQUEMENT`, `DEBARQUEMENT` |
| `gravite` | `MINEURE`, `MODEREE`, `MAJEURE`, `CRITIQUE` |
| `categorie` (observation) | `GENERALE`, `TECHNIQUE`, `OPERATIONNELLE`, `SECURITE`, `QUALITE`, `SLA` |
| `type` (événement) | `PANNE_EQUIPEMENT`, `ABSENCE_PERSONNEL`, `RETARD`, `INCIDENT_SECURITE`, `INCIDENT_TECHNIQUE`, `PROBLEME_TECHNIQUE`, `METEO`, `AUTRE` |

---

## 5. MAPPING TYPE ENGIN (FRONTEND → BACKEND)

Le frontend envoie des types en **minuscule** (clés du map).
Le backend crée l'engin dans le référentiel avec le type Engin.typeEngin correspondant.

| Frontend (lowercase) | Backend Engin.typeEngin | Backend Usage |
|---------------------|------------------------|---------------|
| `tracteur` | `TRACTEUR` | `TRACTAGE` |
| `chariot_bagages` | `CHARIOT_BAGAGES` | `BAGAGES` |
| `chariot_fret` | `CHARIOT_FRET` | `FRET` |
| `camion_fret` | `CHARIOT_FRET` | `FRET` |
| `passerelle` | `STAIRS` | `PASSERELLE` |
| `gpu` | `GPU` | `ALIMENTATION_ELECTRIQUE` |
| `asu` | `ASU` | `CLIMATISATION` |
| `camion_avitaillement` | `AUTRE` | `CHARGEMENT` |
| `convoyeur` | `CONVOYEUR` | `CHARGEMENT` |
| `autre` | `AUTRE` | `CHARGEMENT` |

> **⚠️ IMPORTANT** : Tout type non listé ci-dessus sera rejeté avec HTTP 400 (`INVALID_TYPE_ENGIN`).

---

## 6. CODES HTTP OFFICIELS

| Code | Signification | Cas d'usage |
|------|--------------|-------------|
| 200 | Succès | GET, PATCH, PUT, transitions valides |
| 201 | Créé | POST création réussie |
| 400 | Requête invalide | Validation échouée, données manquantes, type invalide |
| 401 | Non authentifié | Token absent ou invalide |
| 403 | Interdit | Rôle insuffisant, CRV verrouillé, immutabilité archivage |
| 404 | Non trouvé | CRV/ressource inexistant(e) |
| 409 | Conflit | Transition d'état interdite, doublon, déjà verrouillé |

---

## 7. RÔLES UTILISATEUR

| Rôle | Peut créer CRV | Peut modifier | Peut valider | Peut verrouiller | ADMIN |
|------|----------------|---------------|-------------|-----------------|-------|
| `AGENT_ESCALE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `CHEF_EQUIPE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `SUPERVISEUR` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `MANAGER` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `QUALITE` | ❌ | ❌ (lecture seule) | ❌ | ❌ | ❌ |
| `ADMIN` | ❌ | ❌ (aucun accès CRV) | ❌ | ❌ | ✅ |
