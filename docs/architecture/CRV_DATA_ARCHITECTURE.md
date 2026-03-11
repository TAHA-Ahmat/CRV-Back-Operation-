# CRV_DATA_ARCHITECTURE — Cartographie Complète

Date : 2026-03-11

---

## 1. ARCHITECTURE DES MODELES

### CRV.js (Document principal)

```
numeroCRV        String    unique, required
vol              ObjectId  → Vol (required)
escale           String    required, uppercase, 3-4 chars
horaire          ObjectId  → Horaire
statut           Enum      BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE
completude       Number    0-100
creePar          ObjectId  → Personne (required)
responsableVol   ObjectId  → Personne
verrouillePar    ObjectId  → Personne
dateVerrouillage Date

personnelAffecte [{
  nom, prenom, fonction (enum 11 valeurs), matricule, telephone, remarques
}]

materielUtilise [{
  typeEngin (enum 15 valeurs), identifiant, heureDebutUtilisation,
  heureFinUtilisation, operateur, phaseConcernee → ChronologiePhase, remarques
}]

archivage {
  driveFileId, driveWebViewLink, filename, folderPath,
  size, archivedAt, archivedBy → Personne, version
}

annulation {
  dateAnnulation, annulePar → Personne, raisonAnnulation,
  commentaireAnnulation, ancienStatut
}

bulletinMouvementReference  ObjectId → BulletinMouvement
crvDoublon                  Boolean

Index unique composite : { vol: 1, escale: 1 }
```

### Vol.js

```
numeroVol              String    required, uppercase
typeOperation          Enum      ARRIVEE | DEPART | TURN_AROUND | null
compagnieAerienne      String    required
codeIATA               String    required, 2 chars
aeroportOrigine        String    uppercase
aeroportDestination    String    uppercase
dateVol                Date      required
statut                 Enum      PROGRAMME | EN_COURS | TERMINE | ANNULE | RETARDE
avion                  ObjectId  → Avion
posteStationnement     String
horsProgramme          Boolean
programmeVolReference  ObjectId  → ProgrammeVolSaisonnier
typeVolHorsProgramme   Enum      CHARTER | MEDICAL | TECHNIQUE | COMMERCIAL | CARGO | AUTRE
raisonHorsProgramme    String
bulletinMouvementReference  ObjectId → BulletinMouvement
```

### ChronologiePhase.js

```
crv                    ObjectId  → CRV (required)
phase                  ObjectId  → Phase (required)
heureDebutPrevue       Date
heureDebutReelle       Date
heureFinPrevue         Date
heureFinReelle         Date
dureeReelleMinutes     Number    (calculé auto)
ecartMinutes           Number    (calculé auto)
statut                 Enum      NON_COMMENCE | EN_COURS | TERMINE | NON_REALISE | ANNULE
motifNonRealisation    Enum      NON_NECESSAIRE | EQUIPEMENT_INDISPONIBLE | PERSONNEL_ABSENT | CONDITIONS_METEO | AUTRE
detailMotif            String
responsable            ObjectId  → Personne
remarques              String

horodatageDebut / horodatageFin {
  timestampSysteme     Date      (serveur UTC, immutable)
  heureDeclaree        Date      (déclarée par agent)
  source               Enum      TEMPS_REEL | DECLARATION | CORRECTION | IMPORT
  ecartSaisieMinutes   Number
  saisieTardive        Boolean   (true si écart > 60 min)
  agent                ObjectId  → Personne
  timezoneAeroport     String
}
```

### ChargeOperationnelle.js

```
crv                    ObjectId  → CRV (required)
typeCharge             Enum      PASSAGERS | BAGAGES | FRET (required)
sensOperation          Enum      EMBARQUEMENT | DEBARQUEMENT (required)

-- Passagers (null ≠ 0) --
passagersAdultes       Number    null = non saisi, 0 = zéro explicite
passagersEnfants       Number
passagersPMR           Number
passagersTransit       Number
passagersBebes         Number

categoriesPassagersDetaillees {
  bebes, enfants, adolescents, adultes, seniors,
  pmrFauteuilRoulant, pmrMarcheAssistee, pmrNonVoyant, pmrSourd,
  transitLocal, transitInternational, vip, equipage, deportes,
  utiliseCategoriesDetaillees, remarquesPassagers
}

classePassagers { premiere, affaires, economique }
besoinsMedicaux { oxygeneBord, brancardier, accompagnementMedical }
mineurs { mineurNonAccompagne, bebeNonAccompagne }

-- Bagages --
nombreBagagesSoute     Number
poidsBagagesSouteKg    Number
nombreBagagesCabine    Number

-- Fret --
nombreFret             Number
poidsFretKg            Number
typeFret               Enum      GENERAL | STANDARD | PERISSABLE | DANGEREUX | ANIMAUX | AUTRE

fretDetaille {
  categoriesFret { postal, courrierExpress, marchandiseGenerale,
    denreesPerissables { nombre, poidsKg, temperature, chaineduFroid },
    animauxVivants { nombre, espece, certificatVeterinaire },
    vehicules { nombre, type }, equipements { nombre, type },
    valeurDeclaree { montant, devise }
  }
  marchandisesDangereuses {
    present, details [{ codeONU, classeONU, designationOfficielle, quantite, unite, groupeEmballage }],
    declarationDGR, responsable { nom, telephone }
  }
  logistique { nombreColis, volumeM3, nombrePalettes, typePalettes, nombreConteneurs, typeConteneurs,
    dimensionsSpeciales, surdimensionne { longueur, largeur, hauteur } }
  douanes { valeurDeclaree, devise, paysOrigine, paysDestination, numeroBL, numeroAWB, declarationDouane }
  conditionsTransport { temperatureControlee, temperatureMin, temperatureMax, humiditeControlee,
    fragile, protegeeLumiere, instructionsSpeciales }
}

Virtuals : totalPassagers, totalBagages, fretSaisi, totalPassagersDetailles, totalPMRDetailles, totalParClasse
```

### EvenementOperationnel.js

```
crv                    ObjectId  → CRV (required)
typeEvenement          Enum      PANNE_EQUIPEMENT | ABSENCE_PERSONNEL | RETARD | INCIDENT_SECURITE |
                                 INCIDENT_TECHNIQUE | PROBLEME_TECHNIQUE | METEO | AUTRE
gravite                Enum      MINEURE | MODEREE | MAJEURE | CRITIQUE
dateHeureDebut         Date      required
dateHeureFin           Date
dureeImpactMinutes     Number    (calculé auto)
description            String    required
impactPhases           [ObjectId → ChronologiePhase]
equipementConcerne     ObjectId  → Engin
personneConcernee      ObjectId  → Personne
actionsCorrectives     String
declarePar             ObjectId  → Personne (required)
statut                 Enum      OUVERT | EN_COURS | RESOLU | CLOTURE
```

### Observation.js

```
crv                    ObjectId  → CRV (required)
auteur                 ObjectId  → Personne (required)
categorie              Enum      GENERALE | TECHNIQUE | OPERATIONNELLE | SECURITE | QUALITE | SLA
contenu                String    required
dateHeure              Date      default: now
phaseConcernee         ObjectId  → ChronologiePhase
pieceJointe            String
visibilite             Enum      INTERNE | COMPAGNIE | PUBLIQUE
```

### ValidationCRV.js

```
crv                    ObjectId  → CRV (required, unique)
validePar              ObjectId  → Personne (required)
dateValidation         Date      default: now
statut                 Enum      VALIDE | INVALIDE | EN_ATTENTE_CORRECTION
commentaires           String
scoreCompletude        Number    0-100
conformiteSLA          Boolean
ecartsSLA              [{ phase → Phase, ecartMinutes, description }]
anomaliesDetectees     [String]
verrouille             Boolean
dateVerrouillage       Date
```

### Phase.js (Référentiel)

```
code                   String    unique, required, uppercase
libelle                String    required
typeOperation          Enum      ARRIVEE | DEPART | TURN_AROUND | COMMUN
categorie              Enum      PISTE | PASSAGERS | FRET | BAGAGE | TECHNIQUE | AVITAILLEMENT | NETTOYAGE | SECURITE | BRIEFING
macroPhase             Enum      DEBUT | REALISATION | FIN
ordre                  Number    required
dureeStandardMinutes   Number    required
obligatoire            Boolean   default: true
description            String
prerequis              [ObjectId → Phase]
actif                  Boolean   default: true
```

---

## 2. RELATIONS ENTRE COLLECTIONS

```
CRV (1)
 ├── vol (1)                    → Vol._id
 ├── creePar (1)                → Personne._id
 ├── responsableVol (1)         → Personne._id
 ├── verrouillePar (1)          → Personne._id
 ├── archivage.archivedBy (1)   → Personne._id
 ├── personnelAffecte (N)       embedded array
 ├── materielUtilise (N)        embedded array
 │    └── phaseConcernee        → ChronologiePhase._id
 ├── bulletinMouvementReference → BulletinMouvement._id
 │
 ├── ChronologiePhase (N)       via crv: CRV._id
 │    ├── phase                 → Phase._id (référentiel)
 │    ├── responsable           → Personne._id
 │    └── horodatage.agent      → Personne._id
 │
 ├── ChargeOperationnelle (N)   via crv: CRV._id
 │
 ├── EvenementOperationnel (N)  via crv: CRV._id
 │    ├── impactPhases          → [ChronologiePhase._id]
 │    ├── equipementConcerne    → Engin._id
 │    ├── personneConcernee     → Personne._id
 │    └── declarePar            → Personne._id
 │
 ├── Observation (N)            via crv: CRV._id
 │    ├── auteur                → Personne._id
 │    └── phaseConcernee        → ChronologiePhase._id
 │
 └── ValidationCRV (1)          via crv: CRV._id (unique)
      └── validePar             → Personne._id
```

---

## 3. FLUX DES DONNEES

```
ProgrammeVol (saison 6 mois)
  │  service: programmeVol.service.js
  │  controller: programmeVol.controller.js
  ↓
BulletinMouvement (période 3-4 jours)
  │  service: bulletinMouvement.service.js
  │  controller: bulletinMouvement.controller.js
  ↓
Mouvement (sous-document du bulletin)
  │  ajouterMouvement() → bulletin.mouvements.push()
  ↓
Vol (instance vol opérationnel)
  │  service: crv.service.js → creerVolDepuisMouvement()
  ↓
CRV (document principal)
  │  service: crv.service.js
  │  controller: crv.controller.js
  ├──→ ChronologiePhase     controller: phase.controller.js
  ├──→ ChargeOperationnelle  controller: charge.controller.js
  ├──→ EvenementOperationnel controller: evenement.controller.js
  ├──→ Observation           controller: observation.controller.js
  ↓
Validation (TERMINE → VALIDE)
  │  service: validation.service.js
  │  controller: validation.controller.js
  ↓
Archivage (PDF + Google Drive)
  │  service: crvArchivage.service.js
  │  generator: CrvGenerator.js
  └──→ archivage.archivedAt = IMMUTABLE
```

---

## 4. DONNEES UTILISEES DANS LE PDF (CrvGenerator.js)

### Populate effectué

```javascript
CRV.findById(crvId)
  .populate('vol')
  .populate('creePar', 'nom prenom')
  .populate('responsableVol', 'nom prenom')
  .populate('verrouillePar', 'nom prenom')
  .populate('archivage.archivedBy', 'nom prenom')
```

### Sections générées

| Section PDF | Source | Champs utilisés |
|-------------|--------|-----------------|
| En-tête | Config THS | organisation, departement, adresse, telephone, email, sita |
| Titre | CRV | numeroCRV |
| Infos vol | CRV + Vol | numeroCRV, escale, vol.numeroVol, vol.compagnieAerienne, vol.codeIATA, vol.typeOperation, vol.dateVol, vol.aeroportOrigine, vol.aeroportDestination |
| Statut | CRV | statut, completude, dateCreation |
| Personnel | CRV.personnelAffecte | nom, prenom, fonction, matricule, remarques |
| Matériel | CRV.materielUtilise | typeEngin, identifiant, heureDebutUtilisation, heureFinUtilisation, operateur |
| Signature | CRV | responsableVol.prenom, responsableVol.nom |
| Pied de page | Config + CRV | organisation, telephone, numeroCRV, page/pages |

---

## 5. DONNEES NON EXPLOITEES DANS LE PDF

| Collection | Champs disponibles | Absent du PDF | Impact |
|------------|-------------------|---------------|--------|
| **ChronologiePhase** | phase.libelle, statut, heureDebutReelle, heureFinReelle, dureeReelleMinutes, ecartMinutes, horodatageDebut, horodatageFin, motifNonRealisation | **TOUT** | Pas de chronologie opérations |
| **ChargeOperationnelle** | typeCharge, sensOperation, passagersAdultes/Enfants/PMR/Transit/Bebes, nombreBagagesSoute, poidsBagagesSouteKg, nombreFret, poidsFretKg, typeFret, fretDetaille | **TOUT** | Pas de statistiques trafic |
| **EvenementOperationnel** | typeEvenement, gravite, description, dateHeureDebut/Fin, dureeImpactMinutes, actionsCorrectives, statut | **TOUT** | Pas d'incidents |
| **Observation** | categorie, contenu, auteur, dateHeure, visibilite | **TOUT** | Pas de commentaires |
| **ValidationCRV** | validePar, dateValidation, statut, scoreCompletude, conformiteSLA, ecartsSLA, anomaliesDetectees | **TOUT** | Pas de résultat validation |
| **CRV.annulation** | dateAnnulation, annulePar, raisonAnnulation, commentaireAnnulation, ancienStatut | **TOUT** | Pas d'info annulation |
| **CRV.materielUtilise** | phaseConcernee, remarques | Partiels | Phase liée et remarques manquants |
| **CRV.personnelAffecte** | telephone | Partiel | Téléphone non affiché |

---

## 6. MAPPING COMPLET DB → PDF

### Actuellement utilisé

```
vol.numeroVol              → Section "Informations vol"
vol.compagnieAerienne      → Section "Informations vol"
vol.codeIATA               → Section "Informations vol"
vol.typeOperation           → Section "Informations vol"
vol.dateVol                → Section "Informations vol"
vol.aeroportOrigine        → Section "Informations vol"
vol.aeroportDestination    → Section "Informations vol"
crv.numeroCRV              → En-tête + Titre + Pied de page
crv.escale                 → En-tête + Section "Informations vol"
crv.statut                 → Section "Statut"
crv.completude             → Section "Statut"
crv.dateCreation           → Section "Statut"
crv.personnelAffecte       → Section "Personnel" (tableau)
crv.materielUtilise        → Section "Matériel" (tableau)
crv.responsableVol         → Section "Signature"
```

### Mapping cible (ce qui DEVRAIT être dans le PDF)

```
ChronologiePhase           → Section "Chronologie des opérations"
  phase.libelle            → Nom de la phase
  statut                   → Statut (TERMINE, NON_REALISE...)
  heureDebutReelle         → Heure début
  heureFinReelle           → Heure fin
  dureeReelleMinutes       → Durée
  ecartMinutes             → Écart vs prévu
  motifNonRealisation      → Motif si non réalisée

ChargeOperationnelle       → Section "Statistiques trafic"
  PASSAGERS EMBARQUEMENT   → Passagers embarqués (adultes, enfants, PMR, transit, bébés)
  PASSAGERS DEBARQUEMENT   → Passagers débarqués
  BAGAGES                  → Bagages (nombre, poids)
  FRET                     → Fret (nombre, poids, type)

EvenementOperationnel      → Section "Événements / Incidents"
  typeEvenement            → Type
  gravite                  → Gravité
  description              → Description
  dateHeureDebut/Fin       → Période
  actionsCorrectives       → Actions prises

Observation                → Section "Observations"
  categorie                → Catégorie
  contenu                  → Texte
  auteur                   → Auteur
  dateHeure                → Date/heure

ValidationCRV              → Section "Validation"
  validePar                → Validé par
  dateValidation           → Date
  scoreCompletude          → Score
  conformiteSLA            → Conforme SLA
  anomaliesDetectees       → Anomalies
```

---

## 7. CONCLUSION

Le PDF CRV actuel est un **squelette à 30%** du document opérationnel attendu. Il contient les métadonnées du vol et les ressources (personnel + matériel) mais il manque toute la substance :

- **Chronologie** : ce qui s'est réellement passé pendant l'escale
- **Charges** : combien de passagers, bagages, fret
- **Événements** : les incidents et anomalies
- **Observations** : les remarques terrain
- **Validation** : le résultat de la validation

Toutes ces données **existent en base** et sont **correctement structurées**. Il suffit d'enrichir le `CrvGenerator.js` pour les intégrer au PDF.
