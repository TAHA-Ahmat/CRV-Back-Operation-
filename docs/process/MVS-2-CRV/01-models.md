# MVS-2-CRV - MODELS

## Date d'audit : 2026-01-10

---

## 1. CRV.js

### Emplacement
`src/models/crv/CRV.js`

### Role dans le MVS
Modele central representant un Compte Rendu de Vol. Documente toutes les operations au sol effectuees lors de l'escale d'un avion.

### Champs definis

| Champ | Type | Requis | Contraintes | Description |
|-------|------|--------|-------------|-------------|
| `numeroCRV` | String | OUI | required, unique, trim | Identifiant unique format CRVyymmdd-NNNN |
| `vol` | ObjectId | OUI | required, ref: 'Vol' | Reference au vol concerne |
| `escale` | String | OUI | required, trim, uppercase, 3-4 car | Code IATA de l'aeroport d'escale |
| `horaire` | ObjectId | NON | ref: 'Horaire' | Reference aux horaires |
| `statut` | String | NON | enum, default: 'BROUILLON' | Etat du CRV |
| `dateCreation` | Date | NON | default: Date.now | Date de creation |
| `creePar` | ObjectId | OUI | required, ref: 'Personne' | Auteur du CRV |
| `responsableVol` | ObjectId | NON | ref: 'Personne' | Responsable des operations |
| `completude` | Number | NON | min: 0, max: 100, default: 0 | Pourcentage de completion |
| `verrouillePar` | ObjectId | NON | ref: 'Personne' | Validateur |
| `dateVerrouillage` | Date | NON | - | Date de verrouillage |
| `derniereModification` | Date | NON | default: Date.now | Derniere modification |
| `modifiePar` | ObjectId | NON | ref: 'Personne' | Dernier modificateur |

### Sous-document : archivage

| Champ | Type | Description |
|-------|------|-------------|
| `driveFileId` | String | ID fichier Google Drive |
| `driveWebViewLink` | String | Lien de visualisation |
| `archivedAt` | Date | Date d'archivage |
| `archivedBy` | ObjectId (ref: Personne) | Auteur archivage |

### Sous-document embedded : personnelAffecte[]

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `nom` | String | OUI | Nom de famille |
| `prenom` | String | OUI | Prenom |
| `fonction` | String | OUI | Role sur le vol |
| `matricule` | String | NON | Identifiant employe |
| `telephone` | String | NON | Contact |
| `remarques` | String | NON | Notes |

### Sous-document embedded : materielUtilise[]

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `typeEngin` | String | OUI | enum: TRACTEUR_PUSHBACK, PASSERELLE, TAPIS_BAGAGES, GPU, ASU, ESCALIER, TRANSBORDEUR, CAMION_AVITAILLEMENT, CAMION_VIDANGE, CAMION_EAU, NACELLE_ELEVATRICE, CHARIOT_BAGAGES, CONTENEUR_ULD, DOLLY, AUTRE |
| `identifiant` | String | OUI | uppercase |
| `heureDebutUtilisation` | Date | NON | - |
| `heureFinUtilisation` | Date | NON | - |
| `operateur` | String | NON | - |
| `phaseConcernee` | ObjectId | NON | ref: ChronologiePhase |
| `remarques` | String | NON | - |

### Sous-document : annulation (Extension 6)

| Champ | Type | Description |
|-------|------|-------------|
| `dateAnnulation` | Date | Date d'annulation |
| `annulePar` | ObjectId (ref: Personne) | Auteur annulation |
| `raisonAnnulation` | String | Motif |
| `commentaireAnnulation` | String | Details |
| `ancienStatut` | String (enum) | Statut avant annulation |

### Valeurs ENUM

#### statut
```
'BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE'
```

### Index

| Champs | Type | Description |
|--------|------|-------------|
| `numeroCRV` | unique | Unicite numero CRV |
| `vol` | standard | Recherche par vol |
| `statut` | standard | Filtrage par statut |
| `dateCreation` | descending | Tri chronologique |
| `escale` | standard | Filtrage par aeroport |
| `vol, escale` | unique composite | Unicite metier : 1 vol + 1 escale = 1 CRV |

### Hooks Mongoose

#### pre('save')
- **Action** : Met a jour `derniereModification` a chaque sauvegarde
- **Logs** : Trace la sauvegarde dans console

### Relations

| Champ | Modele reference | Cardinalite |
|-------|------------------|-------------|
| `vol` | Vol | N:1 |
| `horaire` | Horaire | 1:1 |
| `creePar` | Personne | N:1 |
| `responsableVol` | Personne | N:1 |
| `verrouillePar` | Personne | N:1 |
| `modifiePar` | Personne | N:1 |
| `archivage.archivedBy` | Personne | N:1 |
| `annulation.annulePar` | Personne | N:1 |
| `materielUtilise.phaseConcernee` | ChronologiePhase | N:1 |

### Regles metier portees

1. **Unicite vol+escale** : Un seul CRV par vol et par escale (index unique composite)
2. **Numerotation automatique** : Format CRVyymmdd-NNNN
3. **Tracabilite** : Champs creePar, modifiePar, verrouillePar obligatoires
4. **Cycle de vie** : BROUILLON -> EN_COURS -> TERMINE -> VALIDE -> VERROUILLE

### Invariants metier

1. Un CRV DOIT etre lie a un Vol existant
2. Un CRV DOIT avoir un creePar valide
3. Le statut DOIT suivre les transitions autorisees
4. Un CRV VERROUILLE ne peut plus etre modifie (sauf deverrouillage)

### Elements INTOUCHABLES

- Index unique composite `vol + escale`
- Hook pre-save pour derniereModification
- Format numeroCRV
- Enum statut

### Risques de regression

| Element | Risque | Impact |
|---------|--------|--------|
| Modification index composite | CRITIQUE | Doublons CRV possibles |
| Modification enum statut | MAJEUR | Workflow casse |
| Suppression references Personne | MAJEUR | Perte tracabilite |

---

## 2. Observation.js

### Emplacement
`src/models/crv/Observation.js`

### Role dans le MVS
Represente une observation ou remarque liee a un CRV. Permet de documenter des constats operationnels.

### Champs definis

| Champ | Type | Requis | Contraintes | Description |
|-------|------|--------|-------------|-------------|
| `crv` | ObjectId | OUI | required, ref: 'CRV' | CRV parent |
| `auteur` | ObjectId | OUI | required, ref: 'Personne' | Auteur observation |
| `categorie` | String | OUI | required, enum | Type d'observation |
| `contenu` | String | OUI | required | Texte de l'observation |
| `dateHeure` | Date | NON | default: Date.now | Date/heure |
| `phaseConcernee` | ObjectId | NON | ref: 'ChronologiePhase' | Phase liee |
| `pieceJointe` | String | NON | - | Chemin fichier joint |
| `visibilite` | String | NON | enum, default: 'INTERNE' | Niveau visibilite |

### Valeurs ENUM

#### categorie
```
'GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA'
```

#### visibilite
```
'INTERNE', 'COMPAGNIE', 'PUBLIQUE'
```

### Index

| Champs | Type |
|--------|------|
| `crv` | standard |
| `auteur` | standard |
| `categorie` | standard |
| `dateHeure` | descending |

### Relations

| Champ | Modele | Cardinalite |
|-------|--------|-------------|
| `crv` | CRV | N:1 |
| `auteur` | Personne | N:1 |
| `phaseConcernee` | ChronologiePhase | N:1 |

---

## 3. HistoriqueModification.js

### Emplacement
`src/models/crv/HistoriqueModification.js`

### Role dans le MVS
Trace l'historique de toutes les modifications apportees a un CRV pour audit.

### Champs definis

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `crv` | ObjectId | OUI | required, ref: 'CRV' |
| `modifiePar` | ObjectId | OUI | required, ref: 'Personne' |
| `dateModification` | Date | NON | default: Date.now |
| `typeModification` | String | OUI | required, enum |
| `champModifie` | String | OUI | required |
| `ancienneValeur` | Mixed | NON | - |
| `nouvelleValeur` | Mixed | NON | - |
| `raisonModification` | String | NON | - |
| `adresseIP` | String | NON | - |
| `userAgent` | String | NON | - |

### Valeurs ENUM

#### typeModification
```
'CREATION', 'MISE_A_JOUR', 'SUPPRESSION', 'VALIDATION', 'ANNULATION'
```

### Index

| Champs | Type |
|--------|------|
| `crv, dateModification` | compound descending |
| `modifiePar` | standard |
| `typeModification` | standard |

---

## SYNTHESE MODELS MVS-2-CRV

| Modele | Fichier | Role | Criticite |
|--------|---------|------|-----------|
| CRV | CRV.js | Entite principale CRV | CRITIQUE |
| Observation | Observation.js | Remarques operationnelles | HAUTE |
| HistoriqueModification | HistoriqueModification.js | Audit trail | HAUTE |

### Dependances inter-modeles

- CRV -> Vol (via vol)
- CRV -> Horaire (via horaire)
- CRV -> Personne (multiple refs)
- Observation -> CRV (via crv)
- Observation -> Personne (via auteur)
- HistoriqueModification -> CRV (via crv)
- HistoriqueModification -> Personne (via modifiePar)
