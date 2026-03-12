# CRV SYSTEM FLOW — Architecture complete du pipeline

**Version** : 1.0
**Date** : 2026-03-11
**Objectif** : Permettre a une personne externe de comprendre le fonctionnement complet du systeme CRV

---

## Vue d'ensemble

```
ProgrammeVolSaisonnier
        |
        | POST /api/bulletins/depuis-programme
        v
BulletinMouvement
        |
        | POST /api/bulletins/:id/publier  +  POST /api/bulletins/:id/creer-vols
        v
     Vol  +  Horaire
        |
        | POST /api/crv (bulletinId + mouvementId)
        v
      CRV  +  ChronologiePhase (x N)
        |
        | Operations agent : phases, charges, evenements
        v
   CRV TERMINE
        |
        | POST /api/validation/:id/valider
        v
   CRV VALIDE/VERROUILLE
        |
        | POST /api/crv/:id/archive
        v
   Archivage (PDF + Google Drive)
```

---

## Etape 1 — ProgrammeVolSaisonnier

### Donnee creee
Un programme de vol saisonnier contient la liste des vols recurrents operes par les compagnies aeriennes sur une escale.

### Schema Mongo : `programmevolsaisonniers`

| Champ | Type | Description |
|-------|------|-------------|
| nom | String | Nom du programme (ex: "ETE_2026_ALG") |
| dateDebut / dateFin | Date | Periode de validite |
| escale | String | Code IATA escale (ex: "ALG", "NDJ") |
| statut | String | BROUILLON / VALIDE / ACTIF / SUSPENDU |
| vols[] | Array | Liste des VolProgramme |

### Schema VolProgramme (sous-document)

| Champ | Type | Description |
|-------|------|-------------|
| numeroVol | String | ex: "TK635" |
| compagnie / codeCompagnie | String | Code IATA compagnie (ex: "TK") |
| **typeAvion** | **String** | **ex: "B737-800" — transmis au bulletin puis au Vol** |
| provenance | String | Code IATA aeroport origine |
| destination | String | Code IATA aeroport destination |
| heureArrivee | String | Heure locale prevue (ex: "09:05") |
| heureDepart | String | Heure locale prevue (ex: "10:20") |
| joursSemaine | Number[] | Jours d'operation (0=dim, 1=lun...) |

### Service backend
`Back/src/services/programme/programmeVol.service.js`

### Composant frontend
`Front/src/views/Programme/ProgrammeVolList.vue` — liste et gestion des programmes

### API
`GET /api/programmes-vol` — lister les programmes
`POST /api/programmes-vol/:id/vols` — ajouter un vol au programme

---

## Etape 2 — BulletinMouvement

### Donnee creee
Un bulletin de mouvement annonce les vols du jour pour une escale. Il contient les mouvements (arrivees, departs, demi-tours) prevus.

### Schema Mongo : `bulletinmouvements`

| Champ | Type | Description |
|-------|------|-------------|
| escale | String | Code IATA |
| titre | String | Titre du bulletin |
| dateDebut / dateFin | Date | Periode couverte |
| statut | String | BROUILLON / PUBLIE / ARCHIVE |
| programmeVolSource | ObjectId | Reference au programme source |
| mouvements[] | Array | Liste des mouvements |

### Schema Mouvement (sous-document)

| Champ | Type | Description |
|-------|------|-------------|
| numeroVol | String | ex: "TK635" |
| dateMouvement | Date | Date du mouvement |
| heureArriveePrevue | Date | Date/heure ISO prevue arrivee |
| heureDepartPrevue | Date | Date/heure ISO prevue depart |
| provenance / destination | String | Codes IATA |
| **typeAvion** | **String** | **Propage depuis VolProgramme** |
| codeCompagnie | String | Code IATA compagnie |
| origine | String | PROGRAMME / HORS_PROGRAMME / AJUSTEMENT |
| vol | ObjectId | Reference au Vol cree (apres publication) |

### Service backend
`Back/src/services/bulletin/bulletinMouvement.service.js`
- `creerBulletinDepuisProgramme()` — genere les mouvements du jour depuis le programme
- `creerVolsDepuisBulletin()` — cree les Vol et Horaire pour chaque mouvement

### Composant frontend
`Front/src/views/Bulletin/BulletinList.vue` — liste des bulletins
`Front/src/views/Bulletin/BulletinDetail.vue` — detail avec mouvements

### API
`POST /api/bulletins/depuis-programme` — creer bulletin depuis programme
`POST /api/bulletins/:id/publier` — publier le bulletin
`POST /api/bulletins/:id/creer-vols` — generer les vols

---

## Etape 3 — Vol + Horaire

### Donnee creee
Un Vol represente un vol operationnel (pas un vol programme). L'Horaire contient tous les jalons temporels prevus et reels.

### Schema Mongo : `vols`

| Champ | Type | Description |
|-------|------|-------------|
| numeroVol | String | ex: "TK635" |
| typeOperation | String | ARRIVEE / DEPART / TURN_AROUND (auto-detecte) |
| compagnieAerienne | String | |
| codeIATA | String | Code 2 lettres |
| aeroportOrigine / aeroportDestination | String | |
| dateVol | Date | |
| statut | String | PROGRAMME / EN_COURS / TERMINE / ANNULE / RETARDE |
| avion | ObjectId | Reference Avion (immatriculation, type) |
| **typeAvion** | **String** | **NOUVEAU — propage depuis BulletinMouvement** |
| posteStationnement | String | Position parking |
| horsProgramme | Boolean | Vol hors programme |
| bulletinMouvementReference | ObjectId | Reference bulletin source |

### Schema Mongo : `horaires`

| Champ | Type | Description |
|-------|------|-------------|
| vol | ObjectId | Reference Vol |
| **heureAtterrisagePrevue** | **Date** | **Point de depart pour cascade phases (ARR/TURN)** |
| heureAtterrissageReelle | Date | |
| **heureDecollagePrevue** | **Date** | **Point de depart pour cascade phases (DEP)** |
| heureDecollageReelle | Date | |
| heureArriveeAuParcPrevue/Reelle | Date | |
| ecartAtterissage / ecartDecollage | Number | Calcules automatiquement (hook pre-save) |

### Service backend
`Back/src/services/crv/crv.service.js` — `creerVolDepuisMouvement()`
`Back/src/services/bulletin/bulletinMouvement.service.js` — `creerVolsDepuisBulletin()`

### Flux de donnees

```
Mouvement.typeAvion ──────→ Vol.typeAvion           (NOUVEAU)
Mouvement.heureArriveePrevue → Horaire.heureAtterrisagePrevue
Mouvement.heureDepartPrevue  → Horaire.heureDecollagePrevue
```

---

## Etape 4 — CRV (Compte Rendu de Vol)

### Donnee creee
Le CRV est le document central de l'escale. Il trace toutes les operations effectuees pour un vol.

### Schema Mongo : `crvs`

| Champ | Type | Description |
|-------|------|-------------|
| numeroCRV | String | Auto-genere (ex: CRV260311-0014) |
| vol | ObjectId | Reference Vol |
| horaire | ObjectId | Reference Horaire |
| escale | String | Code IATA |
| statut | String | BROUILLON → EN_COURS → TERMINE → VALIDE → VERROUILLE |
| creePar | ObjectId | Personne qui a cree le CRV |
| responsableVol | ObjectId | Chef d'escale responsable |
| completude | Number | 0-100 (calcule automatiquement) |
| bulletinMouvementReference | ObjectId | |
| personnelAffecte[] | Array | Equipe mobilisee |
| materielUtilise[] | Array | Engins utilises |

### Machine a etats CRV

```
BROUILLON → EN_COURS → TERMINE → VALIDE → VERROUILLE
                                          ↑
                                    deverrouiller (si non archive)
                    ANNULE ← (depuis VALIDE ou VERROUILLE)
```

### 4 chemins de creation

| Path | Declencheur | Body requis |
|------|-------------|-------------|
| PATH 1 | Bulletin + mouvement | `bulletinId` + `mouvementId` |
| PATH 2 | Hors programme | `vol: { numeroVol, compagnieAerienne, ... }` |
| PATH 3 | Vol existant | `volId` |
| PATH 4 | Legacy | `type` (arrivee/depart/turnaround) |

### Service backend
`Back/src/controllers/crv/crv.controller.js` — `creerCRV()` (zone rouge)

### Composant frontend
`Front/src/views/CRV/CRVNouveau.vue` — formulaire de creation
`Front/src/views/CRV/CRVDetail.vue` — vue detail
`Front/src/components/crv/CRVHeader.vue` — en-tete (affiche typeAvion)

### API
`POST /api/crv` — creer CRV
`GET /api/crv/:id` — obtenir CRV complet (avec populate vol, horaire, phases)

---

## Etape 5 — ChronologiePhase

### Donnee creee
Chaque CRV a N chronologies de phase, une par phase operationnelle (debarquement, nettoyage, chargement...).

### Schema Mongo : `chronologiephases`

| Champ | Type | Description |
|-------|------|-------------|
| crv | ObjectId | Reference CRV |
| phase | ObjectId | Reference Phase (referentiel) |
| statut | String | NON_COMMENCE / EN_COURS / TERMINE / NON_REALISE |
| heureDebutReelle | Date | |
| heureFinReelle | Date | |
| **heureDebutPrevue** | **Date** | **NOUVEAU — calcule par cascade depuis Horaire** |
| **heureFinPrevue** | **Date** | **NOUVEAU — debut + dureeStandardMinutes** |
| dureeReelleMinutes | Number | Calculee automatiquement |

### Schema Mongo : `phases` (referentiel)

| Champ | Type | Description |
|-------|------|-------------|
| code | String | ex: "ARR_DEBARQUEMENT" |
| libelle | String | ex: "Debarquement passagers" |
| typeOperation | String | ARRIVEE / DEPART / TURN_AROUND / COMMUN |
| categorie | String | PASSAGER / BAGAGE / AVION / etc. |
| ordre | Number | Ordre d'execution |
| **dureeStandardMinutes** | **Number** | **Utilise pour le calcul cascade** |

### Calcul cascade temporelle (NOUVEAU)

```
Reference = Horaire.heureAtterrisagePrevue (ARR/TURN)
          ou Horaire.heureDecollagePrevue (DEP)

Phase 1: debut = reference           | fin = reference + dureeStd
Phase 2: debut = fin(phase 1)        | fin = debut + dureeStd
Phase 3: debut = fin(phase 2)        | fin = debut + dureeStd
...
Phase N: debut = fin(phase N-1)      | fin = debut + dureeStd
```

Filtre par typeOperation :
- ARRIVEE : phases ARRIVEE + COMMUN
- DEPART : phases DEPART + COMMUN
- TURN_AROUND : toutes les phases

### Service backend
`Back/src/services/phases/phase.service.js` — `initialiserPhasesVol(crvId, typeOperation, horaireId)`

### Composant frontend
`Front/src/components/crv/CRVPhases.vue` — affichage et gestion des phases

### API
`POST /api/phases/:id/demarrer` — demarrer une phase
`POST /api/phases/:id/terminer` — terminer une phase
`POST /api/phases/:id/non-realise` — marquer non realisee

---

## Etape 6 — Charges operationnelles (Services)

### Donnee creee
Les charges representent les flux de passagers, bagages et fret traites pendant le vol.

### Schema Mongo : `chargeoperationnelles`

| Champ | Type | Description |
|-------|------|-------------|
| crv | ObjectId | Reference CRV |
| typeCharge | String | PASSAGERS / BAGAGES / FRET |
| sensOperation | String | EMBARQUEMENT / DEBARQUEMENT |
| passagersAdultes / enfants / PMR / transit | Number | |
| nombreBagagesSoute / Cabine | Number | |
| poidsBagagesSouteKg | Number | Obligatoire si bagages soute > 0 |
| nombreFret / poidsFretKg / typeFret | * | |

### Service backend
`Back/src/controllers/crv/crv.controller.js` — `ajouterCharge()`

### Composant frontend
`Front/src/components/crv/CRVCharges.vue`

### API
`POST /api/crv/:id/charges` — ajouter une charge

---

## Etape 7 — Validation

### Donnee creee
Un enregistrement ValidationCRV qui evalue la conformite du CRV.

### Schema Mongo : `validationcrv`

| Champ | Type | Description |
|-------|------|-------------|
| crv | ObjectId | Reference CRV |
| validePar | ObjectId | Superviseur/Manager qui valide |
| statut | String | EN_ATTENTE_CORRECTION / VALIDE |
| scoreCompletude | Number | Score au moment de la validation |
| conformiteSLA | Boolean | Respect des durees standard |
| ecartsSLA[] | Array | Liste des ecarts par phase |
| anomaliesDetectees[] | Array | Liste des anomalies |

### Regles de validation
- Le CRV doit etre au statut TERMINE
- Le superviseur/manager evalue la completude et les SLA
- Si anomalies detectees → EN_ATTENTE_CORRECTION
- Si tout OK → CRV passe a VALIDE puis VERROUILLE

### Service backend
`Back/src/services/validation/validation.service.js` (zone rouge)

### API
`POST /api/validation/:id/valider` — valider (SUPERVISEUR, MANAGER)
`POST /api/validation/:id/verrouiller` — verrouiller (SUPERVISEUR, MANAGER)

---

## Etape 8 — Archivage

### Donnee creee
Le CRV valide est archive : un PDF est genere et envoye sur Google Drive.

### Champs dans CRV.archivage

| Champ | Type | Description |
|-------|------|-------------|
| driveFileId | String | ID fichier Google Drive |
| driveWebViewLink | String | Lien web vers le fichier |
| filename | String | Nom du fichier PDF |
| folderPath | String | Chemin dossier Drive |
| size | Number | Taille en octets |
| archivedAt | Date | Date d'archivage |
| archivedBy | ObjectId | Personne qui archive |

### Pre-requis
- CRV statut VALIDE ou VERROUILLE
- Google Drive configure (credentials)

### Service backend
`Back/src/services/documents/crv/crvArchivage.service.js` (zone rouge)

### API
`POST /api/crv/:id/archive` — archiver le CRV

---

## Etape 9 — PDF

### Donnee creee
Un PDF multi-pages contenant toutes les informations du CRV.

### Structure du PDF (6 pages)

| Page | Contenu |
|------|---------|
| 1 | En-tete : numero CRV, vol, compagnie, **typeAvion**, date, escale |
| 2 | Horaires prevus/reels, ecarts |
| 3 | Timeline phases avec **heureDebutPrevue/heureFinPrevue** |
| 4 | Charges (passagers, bagages, fret) |
| 5 | Evenements et observations |
| 6 | Personnel, signatures, metadata |

### Service backend
`Back/src/services/documents/crv/CrvGenerator.js`
- `fetchData()` — charge le CRV avec populate
- `buildPages()` — construit le PDF avec PDFKit

### API
`GET /api/crv/:id/pdf-base64` — PDF en base64 (pour preview frontend)
`GET /api/crv/:id/telecharger-pdf` — telechargement direct

---

## Calcul de completude

La completude du CRV est calculee automatiquement :

| Composant | Poids | Condition |
|-----------|-------|-----------|
| Phases | 30% | Pro-rata des phases terminees/non realisees |
| Charges | 30% | Presence de charges avec donnees |
| Evenements | 20% | Toujours attribues (absence = vol nominal) |
| Observations | 10% | Toujours attribuees (absence = RAS) |
| **Total** | **90% max sans charges** | |

### Service
`Back/src/services/crv/crv.service.js` — `calculerCompletude()` / `updateCompletude()`

---

## Roles et permissions

| Role | Acces CRV | Validation | Archivage | Admin |
|------|-----------|------------|-----------|-------|
| AGENT_ESCALE | CRUD + operations | Non | Oui | Non |
| CHEF_EQUIPE | CRUD + operations | Non | Oui | Non |
| SUPERVISEUR | CRUD + operations | Oui | Oui | Non |
| MANAGER | CRUD + operations | Oui | Oui | Non |
| QUALITE | Lecture seule | Non | Non | Non |
| ADMIN | Aucun acces CRV | Non | Non | Oui (gestion personnel) |

---

## Resume des collections MongoDB

| Collection | Clee par | Referencee par |
|------------|----------|----------------|
| programmevolsaisonniers | Utilisateur | BulletinMouvement |
| bulletinmouvements | Programme ou manuel | Vol, CRV |
| vols | Bulletin ou CRV | CRV, Horaire |
| horaires | Vol | CRV, ChronologiePhase (calcul) |
| crvs | Agent escale | ChronologiePhase, ChargeOp, Validation |
| chronologiephases | CRV (auto) | — |
| phases | Seed (referentiel) | ChronologiePhase |
| chargeoperationnelles | Agent escale | — |
| validationcrvs | Superviseur | — |
| personnes | Admin | CRV (creePar, responsableVol) |
