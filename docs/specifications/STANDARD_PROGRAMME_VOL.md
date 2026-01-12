# STANDARD PROGRAMME DE VOL

**Version** : 1.0
**Date** : 2026-01-12
**Source de reference** : `vols-data.json` (Tchad Handling Services)

---

## 1. VUE D'ENSEMBLE

Le programme de vol est un document de planification saisonnier qui definit l'ensemble des vols recurrents operes sur une escale. Il couvre une periode donnee (ex: saison Hiver ou Ete) et detaille les operations du **lundi au dimanche**.

### Objectifs
- Planifier les operations au sol (CRV)
- Anticiper les ressources (personnel, materiel)
- Assurer la tracabilite des vols programmes vs hors-programme

---

## 2. STRUCTURE DU PROGRAMME

### 2.1 Hierarchie

```
PROGRAMME_VOL_SAISONNIER
│
├── En-tete (metadata)
│
├── Statistiques globales
│
└── Planning hebdomadaire
    ├── Lundi
    │   └── Vols[]
    ├── Mardi
    │   └── Vols[]
    ├── Mercredi
    │   └── Vols[]
    ├── Jeudi
    │   └── Vols[]
    ├── Vendredi
    │   └── Vols[]
    ├── Samedi
    │   └── Vols[]
    └── Dimanche
        └── Vols[]
```

---

## 3. EN-TETE DU PROGRAMME

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `codeSaison` | String | Oui | Identifiant unique de la saison | `HIVER_2025_2026` |
| `nomProgramme` | String | Oui | Nom descriptif | `Programme Hiver N'Djamena 2025-2026` |
| `escale` | String | Oui | Code IATA de l'escale | `NDJ` |
| `dateDebut` | Date | Oui | Debut de validite | `2025-10-26` |
| `dateFin` | Date | Oui | Fin de validite | `2026-03-28` |
| `source` | String | Non | Origine des donnees | `Tchad Handling Services` |
| `statut` | Enum | Oui | Etat du programme | `BROUILLON`, `VALIDE`, `ACTIF`, `SUSPENDU`, `TERMINE` |

---

## 4. STATISTIQUES

Les statistiques sont **calculees automatiquement** a partir des vols.

### 4.1 Par semaine

| Champ | Description |
|-------|-------------|
| `totalVols` | Nombre total de vols/semaine |
| `passagers` | Vols passagers |
| `cargo` | Vols cargo/fret |
| `domestiques` | Vols interieurs |

### 4.2 Par jour

| Jour | Index | Exemple |
|------|-------|---------|
| Lundi | 1 | 10 vols |
| Mardi | 2 | 9 vols |
| Mercredi | 3 | 9 vols |
| Jeudi | 4 | 7 vols |
| Vendredi | 5 | 12 vols |
| Samedi | 6 | 5 vols |
| Dimanche | 0 | 10 vols |

---

## 5. STRUCTURE D'UN VOL

Chaque vol dans le programme contient les informations suivantes :

### 5.1 Identification

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `numeroVol` | String | Oui | Numero de vol IATA | `ET939` |
| `numeroVolRetour` | String | Non | Numero du vol retour (turnaround) | `ET938` |
| `codeCompagnie` | String | Oui | Code IATA compagnie | `ET` |
| `nomCompagnie` | String | Oui | Nom complet | `Ethiopian Airlines` |

### 5.2 Categorisation

| Champ | Type | Obligatoire | Valeurs | Description |
|-------|------|-------------|---------|-------------|
| `categorieVol` | Enum | Oui | `PASSAGER`, `CARGO`, `DOMESTIQUE` | Type de vol |
| `typeOperation` | Enum | Oui | `ARRIVEE`, `DEPART`, `TURN_AROUND` | Nature de l'operation |

**Regles de deduction du type d'operation :**

| Arrivee | Depart | Type Operation |
|---------|--------|----------------|
| Renseigne | Renseigne | `TURN_AROUND` |
| Renseigne | Vide | `ARRIVEE` |
| Vide | Renseigne | `DEPART` |

### 5.3 Avion

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `typeAvion` | String | Oui | Modele de l'avion | `B737-800` |
| `immatriculation` | String | Non | Immat. si connue | `ET-AVJ` |
| `configurationCode` | String | Non | Code config sieges | `16C138Y` |
| `configurationDetail` | Object | Non | Detail de la config | voir ci-dessous |

**Configurations connues :**

| Code | Business | Economy | Total | Type |
|------|----------|---------|-------|------|
| `16C135Y` | 16 | 135 | 151 | Passager |
| `16C138Y` | 16 | 138 | 154 | Passager |
| `16C102Y` | 16 | 102 | 118 | Passager |
| `JY159` | 0 | 159 | 159 | Passager |
| `CARGO` | - | - | - | Cargo |
| `TBN` | - | - | - | A definir |

### 5.4 Route

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `provenance` | String | Oui* | Code IATA origine | `ADD` |
| `destination` | String | Oui* | Code IATA destination | `ADD` |
| `escales` | [String] | Non | Escales intermediaires | `["NIM"]` |

*Obligatoire selon le type d'operation

**Format des routes composees :**
- `IST-NIM` = Istanbul via Niamey
- `DLA-NSI` = Douala via Yaoundé Nsimalen
- `AMJ-AEH` = Amdjarass via Abeche

### 5.5 Horaires

| Champ | Type | Format | Description | Exemple |
|-------|------|--------|-------------|---------|
| `heureArrivee` | String | `HH:MM` | Heure d'arrivee prevue | `12:10` |
| `heureDepart` | String | `HH:MM` | Heure de depart prevu | `14:05` |

**Notes :**
- Format 24h obligatoire
- `J+1` indique un depart le lendemain (ex: `00:45 (J+1)`)

### 5.6 Recurrence

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `joursSemaine` | [Number] | Jours d'operation | `[1, 3, 5]` = Lun, Mer, Ven |
| `dateDebut` | Date | Debut de validite du vol | `2025-10-27` |
| `dateFin` | Date | Fin de validite du vol | `2026-03-27` |
| `exceptions` | [Date] | Dates exclues | `["2025-12-25"]` |

**Codification des jours :**

| Jour | Code |
|------|------|
| Dimanche | 0 |
| Lundi | 1 |
| Mardi | 2 |
| Mercredi | 3 |
| Jeudi | 4 |
| Vendredi | 5 |
| Samedi | 6 |

### 5.7 Observations

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `nightStop` | Boolean | Avion reste la nuit | `true` |
| `remarques` | String | Notes libres | `Du 27 Oct.24 au 29 Mars 25` |

---

## 6. PLANNING HEBDOMADAIRE

Le programme est organise par jour de la semaine, du lundi au dimanche.

### 6.1 Structure d'un jour

```json
{
  "jour": "lundi",
  "index": 1,
  "resume": {
    "total": 10,
    "passagers": 6,
    "cargo": 2,
    "domestiques": 2
  },
  "vols": [
    { /* vol 1 */ },
    { /* vol 2 */ },
    ...
  ]
}
```

### 6.2 Ordre des vols

Les vols sont tries par **heure d'arrivee** puis **heure de depart** :
1. Vols avec arrivee en premier (tries par heure)
2. Vols depart seul ensuite (tries par heure)

---

## 7. TYPES DE VOLS

### 7.1 Vol Passager (`PASSAGER`)

Vol commercial transportant des passagers.

**Caracteristiques :**
- Configuration sieges definie (Business + Economy)
- Compagnies : Air France, Turkish Airlines, Ethiopian Airlines, EgyptAir, etc.

### 7.2 Vol Cargo (`CARGO`)

Vol de fret/marchandises.

**Caracteristiques :**
- Configuration = `CARGO`
- Compagnies : Ethiopian Cargo, EgyptAir Cargo, Solenta Aviation

### 7.3 Vol Domestique (`DOMESTIQUE`)

Vol interieur (national).

**Caracteristiques :**
- Routes entre aeroports nationaux (NDJ, AEH, FYT, AMJ, SRH, MQQ, AMC)
- Compagnies : Royal Airways
- Avions plus petits (E145, ATR42)

---

## 8. COMPAGNIES AERIENNES

### 8.1 Compagnies Passagers Internationales

| Code IATA | Nom | Pays |
|-----------|-----|------|
| AF | Air France | France |
| TK | Turkish Airlines | Turquie |
| ET | Ethiopian Airlines | Ethiopie |
| MS | EgyptAir | Egypte |
| AT | Royal Air Maroc | Maroc |
| AH | Air Algerie | Algerie |
| QC | Camair-Co | Cameroun |
| KP | KPO (ASKY) | Togo |

### 8.2 Compagnies Cargo

| Code | Nom |
|------|-----|
| ET Cargo | Ethiopian Cargo |
| MS Cargo | EgyptAir Cargo |
| SVG | Solenta Aviation |

### 8.3 Compagnies Domestiques

| Code | Nom |
|------|-----|
| CH | Royal Airways |

---

## 9. AEROPORTS (Codes IATA)

### 9.1 Aeroports Tchadiens

| Code | Ville | Type |
|------|-------|------|
| NDJ | N'Djamena | Principal |
| AEH | Abeche | Domestique |
| FYT | Faya-Largeau | Domestique |
| AMJ | Amdjarass | Domestique |
| SRH | Sarh | Domestique |
| MQQ | Moundou | Domestique |
| AMC | Am Timan | Domestique |

### 9.2 Hubs Internationaux

| Code | Ville | Pays |
|------|-------|------|
| CDG | Paris Charles de Gaulle | France |
| IST | Istanbul | Turquie |
| ADD | Addis Abeba | Ethiopie |
| CAI | Le Caire | Egypte |
| CMN | Casablanca | Maroc |
| ALG | Alger | Algerie |
| LFW | Lome | Togo |
| DLA | Douala | Cameroun |
| NSI | Yaounde Nsimalen | Cameroun |
| ABV | Abuja | Nigeria |
| NIM | Niamey | Niger |
| LBV | Libreville | Gabon |
| SHJ/SARJAH | Sharjah | EAU |
| BRU | Bruxelles | Belgique |
| NBO | Nairobi | Kenya |

---

## 10. TYPES D'AVIONS

### 10.1 Long-courriers

| Type | Constructeur | Capacite typ. |
|------|--------------|---------------|
| B777 | Boeing | 300-400 pax |
| A330-200 | Airbus | 250 pax |
| A330F | Airbus | Cargo |
| B767-300 | Boeing | Cargo |

### 10.2 Moyen-courriers

| Type | Constructeur | Capacite typ. |
|------|--------------|---------------|
| B737-800 | Boeing | 150-180 pax |
| B737-700 | Boeing | 120-140 pax |
| B737F | Boeing | Cargo |
| B737 | Boeing | Variable |

### 10.3 Regional

| Type | Constructeur | Capacite typ. |
|------|--------------|---------------|
| E90 | Embraer | 90-100 pax |
| E145 | Embraer | 45-50 pax |
| ATR72 | ATR | 70 pax |
| ATR42 | ATR | 42-50 pax |

---

## 11. CAS PARTICULIERS

### 11.1 NIGHT STOP

Vol dont l'avion reste stationne la nuit sur l'escale.

**Identification :**
- Arrivee renseignee, depart vide
- Observation contient `NIGHT STOP`

**Impact operationnel :**
- Pas de CRV depart le meme jour
- CRV depart le lendemain matin

### 11.2 Vols avec escales intermediaires

**Format provenance :** `IST-NIM` = Istanbul avec escale Niamey

**Impact :**
- Le vol fait une escale technique avant d'arriver
- Peut affecter l'heure d'arrivee

### 11.3 Vols avec numero retour

**Format destination :** `ADD (ET938)` = destination Addis avec vol retour ET938

**Impact :**
- Operation TURN_AROUND
- Deux numeros de vol pour un meme avion

### 11.4 Horaires J+1

**Format :** `00:45 (J+1)`

**Signification :** Depart apres minuit, donc techniquement le jour suivant.

---

## 12. EXEMPLE COMPLET

### Vol Ethiopian Airlines quotidien

```json
{
  "numeroVol": "ET939",
  "numeroVolRetour": "ET938",
  "codeCompagnie": "ET",
  "nomCompagnie": "Ethiopian Airlines",
  "categorieVol": "PASSAGER",
  "typeOperation": "TURN_AROUND",
  "avion": {
    "typeAvion": "B737-800",
    "configurationCode": "16C138Y",
    "configurationDetail": {
      "business": 16,
      "economy": 138,
      "total": 154
    }
  },
  "route": {
    "provenance": "ADD",
    "destination": "ADD",
    "escales": []
  },
  "horaires": {
    "heureArrivee": "12:10",
    "heureDepart": "14:05"
  },
  "recurrence": {
    "joursSemaine": [0, 1, 2, 3, 4, 5, 6],
    "dateDebut": "2025-10-26",
    "dateFin": "2026-03-28",
    "exceptions": []
  },
  "observations": {
    "nightStop": false,
    "remarques": "Du 26 Oct.25 au 28 Mars 26"
  }
}
```

### Vol domestique Royal Airways

```json
{
  "numeroVol": "CH110/111",
  "numeroVolRetour": null,
  "codeCompagnie": "CH",
  "nomCompagnie": "Royal Airways",
  "categorieVol": "DOMESTIQUE",
  "typeOperation": "TURN_AROUND",
  "avion": {
    "typeAvion": "E145",
    "configurationCode": "TBN"
  },
  "route": {
    "provenance": "AEH",
    "destination": "AEH",
    "escales": []
  },
  "horaires": {
    "heureArrivee": "10:00",
    "heureDepart": "07:00"
  },
  "recurrence": {
    "joursSemaine": [1, 3],
    "dateDebut": "2025-10-27",
    "dateFin": "2026-03-28",
    "exceptions": []
  },
  "observations": {
    "nightStop": false,
    "remarques": "Royal Airways"
  }
}
```

### Vol NIGHT STOP

```json
{
  "numeroVol": "KP064",
  "numeroVolRetour": "KP065",
  "codeCompagnie": "KP",
  "nomCompagnie": "KPO",
  "categorieVol": "PASSAGER",
  "typeOperation": "ARRIVEE",
  "avion": {
    "typeAvion": "B737-800",
    "configurationCode": "16C135Y"
  },
  "route": {
    "provenance": "LFW",
    "destination": null,
    "escales": ["NSI"]
  },
  "horaires": {
    "heureArrivee": "18:50",
    "heureDepart": null
  },
  "recurrence": {
    "joursSemaine": [1, 5],
    "dateDebut": "2025-10-27",
    "dateFin": "2026-03-28",
    "exceptions": []
  },
  "observations": {
    "nightStop": true,
    "remarques": "NIGHT STOP - Depart KP065 le lendemain 07H30"
  }
}
```

---

## 13. LIEN AVEC LE CRV

### 13.1 Creation de CRV a partir du programme

Lorsqu'un vol du programme est execute :

1. **Selection du vol** dans le programme
2. **Creation du CRV** avec pre-remplissage :
   - Numero de vol
   - Compagnie
   - Type d'operation
   - Horaires prevus
   - Type d'avion
3. **Initialisation des phases** selon le type d'operation

### 13.2 Correspondance des champs

| Champ Programme | Champ CRV/Vol |
|-----------------|---------------|
| `numeroVol` | `Vol.numeroVol` |
| `nomCompagnie` | `Vol.compagnieAerienne` |
| `typeOperation` | `Vol.typeOperation` |
| `heureArrivee` | `Horaire.heureAtterrissagePrevue` |
| `heureDepart` | `Horaire.heureDecollagePrevu` |
| `typeAvion` | `Vol.avion.type` |

---

## 14. EVOLUTION DU MODELE

### Champs a ajouter au modele `ProgrammeVolSaisonnier`

| Champ | Type | Priorite |
|-------|------|----------|
| `categorieVol` | Enum | Haute |
| `route.provenance` | String | Haute |
| `route.destination` | String | Haute |
| `route.escales` | [String] | Moyenne |
| `configurationSieges` | String | Moyenne |
| `numeroVolRetour` | String | Moyenne |
| `nightStop` | Boolean | Basse |

---

## 15. ANNEXES

### A. Saison Hiver 2025-2026 - Resume

| Jour | Total | Passagers | Cargo | Domestiques |
|------|-------|-----------|-------|-------------|
| Lundi | 10 | 6 | 2 | 2 |
| Mardi | 9 | 6 | 1 | 2 |
| Mercredi | 9 | 6 | 2 | 1 |
| Jeudi | 7 | 5 | 1 | 1 |
| Vendredi | 12 | 9 | 1 | 2 |
| Samedi | 5 | 3 | 2 | 0 |
| Dimanche | 10 | 7 | 1 | 2 |
| **TOTAL** | **62** | **42** | **10** | **10** |

### B. Evolution vs Hiver 2024-2025

| Metrique | 2024-2025 | 2025-2026 | Evolution |
|----------|-----------|-----------|-----------|
| Total vols | 45 | 62 | +37.8% |
| Passagers | 37 | 42 | +13.5% |
| Cargo | 8 | 10 | +25% |
| Domestiques | 0 | 10 | +100% (nouveau) |

---

*Document genere le 2026-01-12*
