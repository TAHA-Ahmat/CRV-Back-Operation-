# MVS-4-Charges - MODELS

## Date d'audit : 2026-01-10

---

## ChargeOperationnelle.js

### Emplacement
`src/models/charges/ChargeOperationnelle.js`

---

### Schema Principal

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| crv | ObjectId (ref: CRV) | Oui | Reference au CRV |
| typeCharge | String (enum) | Oui | PASSAGERS, BAGAGES, FRET |
| sensOperation | String (enum) | Oui | EMBARQUEMENT, DEBARQUEMENT |

---

### Champs Passagers (Basiques)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| passagersAdultes | Number | null | Adultes (null = non saisi) |
| passagersEnfants | Number | null | Enfants |
| passagersPMR | Number | null | PMR |
| passagersTransit | Number | null | Transit |

**REGLE METIER CRITIQUE** : VIDE =/= ZERO
- `null` = donnee non saisie (champ vide)
- `0` = valeur explicite (zero passager saisi intentionnellement)

---

### Extension 4 - Categories Passagers Detaillees

#### categoriesPassagersDetaillees (Subdocument)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| bebes | Number | 0 | Bebes (0-2 ans) |
| enfants | Number | 0 | Enfants (2-12 ans) |
| adolescents | Number | 0 | Adolescents (12-18 ans) |
| adultes | Number | 0 | Adultes (18-65 ans) |
| seniors | Number | 0 | Seniors (65+ ans) |
| pmrFauteuilRoulant | Number | 0 | PMR en fauteuil roulant |
| pmrMarcheAssistee | Number | 0 | PMR assistance marche |
| pmrNonVoyant | Number | 0 | PMR non-voyant |
| pmrSourd | Number | 0 | PMR sourd |
| transitLocal | Number | 0 | Transit correspondance locale |
| transitInternational | Number | 0 | Transit correspondance internationale |
| vip | Number | 0 | Passagers VIP |
| equipage | Number | 0 | Membres d'equipage |
| deportes | Number | 0 | Personnes deportees/expulsees |

#### classePassagers (Subdocument)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| premiere | Number | 0 | Passagers premiere classe |
| affaires | Number | 0 | Passagers classe affaires |
| economique | Number | 0 | Passagers classe economique |

#### besoinsMedicaux (Subdocument)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| oxygeneBord | Number | 0 | Passagers necessitant oxygene |
| brancardier | Number | 0 | Passagers sur brancard |
| accompagnementMedical | Number | 0 | Avec accompagnement medical |

#### mineurs (Subdocument)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| mineurNonAccompagne | Number | 0 | UM - Unaccompanied Minor |
| bebeNonAccompagne | Number | 0 | Bebes voyageant seuls |

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| remarquesPassagers | String | null | Remarques additionnelles |
| utiliseCategoriesDetaillees | Boolean | false | Flag compatibilite |

---

### Champs Bagages

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| nombreBagagesSoute | Number | null | Bagages soute |
| poidsBagagesSouteKg | Number | null | Poids bagages soute |
| nombreBagagesCabine | Number | null | Bagages cabine |

---

### Champs Fret (Basiques)

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| nombreFret | Number | null | Nombre colis fret |
| poidsFretKg | Number | null | Poids fret en kg |
| typeFret | String (enum) | - | GENERAL, STANDARD, PERISSABLE, DANGEREUX, ANIMAUX, AUTRE |
| remarques | String | - | Remarques fret |

---

### Extension 5 - Fret Detaille

#### fretDetaille.categoriesFret (Subdocument)

| Champ | Type | Description |
|-------|------|-------------|
| postal | Number | Colis postaux |
| courrierExpress | Number | Colis courrier express |
| marchandiseGenerale | Number | Marchandise generale |
| denreesPerissables | Object | {nombre, poidsKg, temperature, chaineduFroid} |
| animauxVivants | Object | {nombre, espece, certificatVeterinaire} |
| vehicules | Object | {nombre, type} |
| equipements | Object | {nombre, type} |
| valeurDeclaree | Object | {montant, devise} |

#### fretDetaille.marchandisesDangereuses (Subdocument)

| Champ | Type | Description |
|-------|------|-------------|
| present | Boolean | Presence marchandises dangereuses |
| details | Array | Liste des marchandises DG |
| declarationDGR | Boolean | Declaration DGR presente |
| responsable | Object | {nom, telephone} |

**Schema details marchandises dangereuses** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| codeONU | String | Oui | Code ONU (ex: UN1203) |
| classeONU | String | Oui | Classe de danger (1 a 9) |
| designationOfficielle | String | Oui | Designation officielle transport |
| quantite | Number | Oui | Quantite |
| unite | String | Non | kg, L, unites |
| groupeEmballage | String (enum) | Non | I, II, III |
| numeroONU | String | Non | Numero d'identification |

#### fretDetaille.logistique (Subdocument)

| Champ | Type | Description |
|-------|------|-------------|
| nombreColis | Number | Nombre total colis |
| volumeM3 | Number | Volume total en m3 |
| nombrePalettes | Number | Nombre palettes |
| typePalettes | String (enum) | EUR, EPAL, STANDARD, AUTRE |
| nombreConteneurs | Number | Nombre conteneurs |
| typeConteneurs | String | ULD, AKE, PMC |
| dimensionsSpeciales | Boolean | Colis hors dimensions |
| surdimensionne | Object | {longueurCm, largeurCm, hauteurCm} |

#### fretDetaille.douanes (Subdocument)

| Champ | Type | Description |
|-------|------|-------------|
| valeurDeclaree | Number | Valeur douaniere |
| devise | String | Code devise ISO 4217 |
| paysOrigine | String | Pays origine (ISO) |
| paysDestination | String | Pays destination (ISO) |
| numeroBL | String | Bill of Lading |
| numeroAWB | String | Air Waybill |
| declarationDouane | Boolean | Declaration effectuee |

#### fretDetaille.conditionsTransport (Subdocument)

| Champ | Type | Description |
|-------|------|-------------|
| temperatureControlee | Boolean | Transport a temperature controlee |
| temperatureMin | Number | Temperature min en Celsius |
| temperatureMax | Number | Temperature max en Celsius |
| humiditeControlee | Boolean | Humidite controlee |
| fragile | Boolean | Marchandise fragile |
| protegeeLumiere | Boolean | Protegee de la lumiere |
| instructionsSpeciales | String | Instructions speciales |

| Champ | Type | Description |
|-------|------|-------------|
| remarquesFret | String | Remarques additionnelles fret |
| utiliseFretDetaille | Boolean | Flag compatibilite |

---

## Virtual Fields

### totalPassagers
- **Logique** : Somme passagersAdultes + enfants + PMR + transit
- **Retourne null** si TOUS les champs sont null
- **Retourne le total** si AU MOINS UN champ est renseigne

### totalBagages
- **Logique** : nombreBagagesSoute + nombreBagagesCabine

### fretSaisi
- **Logique** : Boolean indiquant si au moins un champ fret est renseigne

### totalPassagersDetailles
- **Logique** : Somme de toutes les categories detaillees si utiliseCategoriesDetaillees=true
- **Fallback** : totalPassagers si categories detaillees non utilisees

### totalPMRDetailles
- **Logique** : Somme des 4 sous-categories PMR

### totalParClasse
- **Logique** : premiere + affaires + economique

---

## Index

| Champs | Type |
|--------|------|
| crv | 1 (ASC) |
| typeCharge | 1 (ASC) |

---

## Options Schema

| Option | Valeur |
|--------|--------|
| timestamps | true |

