# ANALYSE STRATEGIQUE DU SYSTEME CRV
## Compte Rendu de Vol — Plateforme de Gestion des Operations d'Escale

**Date** : 2026-03-11
**Destinataires** : Direction des Operations, Direction Generale
**Classification** : Document interne — Analyse strategique
**Redige par** : Equipe technique CRV (analyse automatisee)

---

## TABLE DES MATIERES

1. [Vision generale du systeme](#1-vision-generale-du-systeme)
2. [Architecture fonctionnelle](#2-architecture-fonctionnelle)
3. [Services fonctionnels detailles](#3-services-fonctionnels-detailles)
4. [Profils utilisateurs et matrice de permissions](#4-profils-utilisateurs-et-matrice-de-permissions)
5. [Role de l'administrateur systeme](#5-role-de-ladministrateur-systeme)
6. [Comparaison avec le fonctionnement actuel](#6-comparaison-avec-le-fonctionnement-actuel)
7. [Modules operationnels — En production](#7-modules-operationnels--en-production)
8. [Modules partiellement implementes](#8-modules-partiellement-implementes)
9. [Vision future et feuille de route](#9-vision-future-et-feuille-de-route)
10. [Indicateurs de maturite](#10-indicateurs-de-maturite)

---

## 1. VISION GENERALE DU SYSTEME

### 1.1 Qu'est-ce que le systeme CRV ?

Le systeme CRV (Compte Rendu de Vol) est une plateforme numerique de gestion des operations d'escale aeroportuaire. Il couvre l'ensemble du cycle de vie operationnel d'un vol, depuis la planification saisonniere jusqu'a l'archivage legal du compte rendu final.

Le CRV remplace les processus papier et les fichiers Excel traditionnellement utilises dans les operations d'escale par un systeme centralise, trace, securise et conforme aux exigences reglementaires.

### 1.2 Perimetre fonctionnel

Le systeme adresse **6 domaines fonctionnels majeurs** :

| Domaine | Description | Horizon temporel |
|---------|-------------|-----------------|
| **Planification saisonniere** | Programmes de vols sur 6 mois | Long terme (semestre) |
| **Planification operationnelle** | Bulletins de mouvement sur 3-4 jours | Court terme (hebdomadaire) |
| **Execution operationnelle** | Compte rendu de vol en temps reel | Temps reel (jour J) |
| **Controle qualite** | Validation, conformite SLA, completude | Post-operation |
| **Archivage legal** | Conservation immutable sur Google Drive | Perenne (10 ans) |
| **Administration** | Gestion des utilisateurs, parametrage | Continu |

### 1.3 Chaine de valeur operationnelle

Le systeme implementee une chaine de valeur lineaire et tracee :

```
PLANIFICATION                    EXECUTION                    CLOTURE
    |                               |                            |
Programme de Vol (6 mois)    Compte Rendu de Vol        Validation + Archivage
    |                               |                            |
Bulletin de Mouvement        Phases operationnelles      PDF legal immutable
    (3-4 jours)              Charges (PAX, bagages, fret)  Conservation 10 ans
    |                        Evenements et incidents          |
Vols programmes              Personnel et materiel       Google Drive structure
    + hors programme         Horaires reels vs prevus    par annee/mois/compagnie
```

### 1.4 Volumetrie cible

| Indicateur | Volume estime |
|------------|---------------|
| Vols par programme saisonnier | 20 a 50 lignes recurrentes |
| Mouvements par bulletin (3-4 jours) | 15 a 60 mouvements |
| CRV par jour | 5 a 20 (selon taille de l'escale) |
| Phases par CRV | 5 a 30 (selon type d'operation) |
| Charges par CRV | 2 a 6 enregistrements (passagers + bagages + fret x sens) |
| Utilisateurs simultanes | 5 a 15 agents |
| Documents archives par mois | 100 a 500 PDF |

### 1.5 Donnees gerees

Le systeme gere **23 collections de donnees** organisees en 10 domaines :

| Domaine | Collections | Donnees principales |
|---------|-------------|---------------------|
| CRV (coeur) | 3 | CRV, Observations, Historique des modifications |
| Bulletin | 1 | Bulletin de mouvement avec mouvements embarques |
| Vols | 4 | Vol operationnel, Programme de vol, Vol programme, Programme saisonnier |
| Charges | 1 | Passagers, bagages, fret (basic + detaille + marchandises dangereuses) |
| Phases | 3 | Referentiel phases, Horaire, Chronologie des phases |
| Securite | 2 | Utilisateurs (Personne), Journal d'activite |
| Validation | 1 | Validation CRV avec ecarts SLA |
| Ressources | 3 | Engins, Affectation engin-vol, Avion (referentiel) |
| Transversal | 2 | Affectation personnel-vol, Evenements operationnels |
| Notifications | 3 | Notifications in-app, Regles de notification, Destinataires |

---

## 2. ARCHITECTURE FONCTIONNELLE

### 2.1 Couches applicatives

Le systeme est structure en **4 couches distinctes** :

**Couche Presentation (Frontend)**
- Application web Vue.js 3 accessible depuis navigateur
- Interface responsive adaptee aux tablettes terrain
- Theming clair/sombre
- 28+ pages organisees par role fonctionnel

**Couche Metier (Backend)**
- Serveur Express.js gerant 200+ endpoints API REST
- 48+ services metier implementant les regles operationnelles
- 8 middlewares de securite et validation
- Moteur de notifications multi-canal

**Couche Donnees**
- Base MongoDB avec 23 collections
- Indexation optimisee pour les requetes operationnelles
- Contraintes d'unicite et de coherence

**Couche Integration**
- Google Drive API pour l'archivage legal
- SMTP pour les notifications email
- WhatsApp Business (prevu) pour les alertes terrain
- Server-Sent Events pour le tableau de bord temps reel

### 2.2 Modele de securite

Le systeme repose sur un modele de securite a **5 niveaux** :

1. **Authentification** : JWT (JSON Web Token) avec expiration 3h
2. **Autorisation par role** : 6 roles fonctionnels avec matrice de permissions
3. **Protection des donnees** : Verrouillage progressif des CRV (machine a etats)
4. **Immutabilite** : CRV archive = document legal inalterable
5. **Tracabilite** : Triple couche d'audit (historique modifications + journal activites + horodatage double)

### 2.3 Machine a etats CRV

Le cycle de vie d'un CRV suit une machine a etats stricte :

```
BROUILLON ──→ EN_COURS ──→ TERMINE ──→ VALIDE ──→ VERROUILLE
                                          ↑           |
                                          └───────────┘
                                        (deverrouillage
                                        si non archive)

Depuis tout etat (sauf VERROUILLE archive) :
  ──→ ANNULE ──→ (ancien etat via reactivation)
```

| Transition | Condition | Qui peut agir |
|------------|-----------|---------------|
| BROUILLON → EN_COURS | Clic "Demarrer" | Operationnels |
| EN_COURS → TERMINE | Completude >= 50% | Operationnels |
| TERMINE → VALIDE | Completude >= 80%, responsable vol defini, toutes phases traitees | Superviseur, Manager |
| VALIDE → VERROUILLE | Validation manuelle ou automatique | Superviseur, Manager |
| VERROUILLE → VALIDE | Non archive + justification | Superviseur, Manager |
| Tout → ANNULE | Non archive | Superviseur, Manager |
| ANNULE → ancien etat | Reactivation | Tous sauf Qualite |

### 2.4 Calcul de completude

La completude d'un CRV est calculee selon 4 axes ponderes :

| Axe | Poids | Critere |
|-----|-------|---------|
| Phases operationnelles | 30% | Toutes les phases traitees (terminees ou justifiees non realisees) |
| Charges (passagers, bagages, fret) | 30% | Donnees renseignees ou absence confirmee |
| Evenements operationnels | 20% | Au moins un evenement ou absence confirmee |
| Observations | 10% | Au moins une observation ou absence confirmee |

**Seuils decisionnels** :
- < 50% : CRV ne peut pas etre termine
- >= 50% : CRV peut etre termine (statut TERMINE)
- >= 80% : CRV peut etre valide (statut VALIDE)
- 100% : CRV completement renseigne

---

## 3. SERVICES FONCTIONNELS DETAILLES

### 3.1 Module Programme de Vols

**Objectif** : Planifier les rotations de vols sur un horizon de 6 mois (saison IATA).

**Fonctionnalites** :
- Creation de programmes saisonniers avec nom, edition, dates de validite
- Saisie des vols recurrents avec jours de semaine, horaires, types avion
- Classification des vols : INTERNATIONAL, REGIONAL, DOMESTIQUE, CARGO
- Detection automatique du type d'operation : ARRIVEE, DEPART, TURN_AROUND, TRANSIT
- Gestion des compagnies aeriennes (extraction automatique du code depuis le numero de vol)
- Statistiques par categorie, par jour de semaine
- Duplication de programmes (pour nouvelle saison)
- Workflow de validation : BROUILLON → VALIDE → ACTIF (un seul programme actif a la fois)
- Suspension et reactivation de programmes
- Export PDF du programme complet
- Archivage sur Google Drive (conservation 5 ans)

**Donnees par vol programme** :
- Numero de vol (aller/retour)
- Code compagnie et nom
- Type avion et version (configuration sieges)
- Provenance et destination (avec escales intermediaires)
- Heures d'arrivee et de depart
- Jours de la semaine de recurrence
- Categorie (INTERNATIONAL/REGIONAL/DOMESTIQUE/CARGO)
- Type d'operation (ARRIVEE/DEPART/TURN_AROUND/TRANSIT)
- Indicateur night stop
- Periode specifique (si different de la periode globale du programme)
- Observations et notes
- Capacite passagers (Business, Economy, Premiere)

**Statistiques generees** :
- Nombre de vols par categorie
- Repartition par jour de semaine
- Nombre de compagnies operantes
- Volume prevu de passagers/cargo

---

### 3.2 Module Bulletin de Mouvement

**Objectif** : Produire le planning operationnel sur 3 a 4 jours pour l'escale.

**Fonctionnalites** :
- Creation manuelle ou automatique depuis un programme de vols actif
- Ajout de mouvements programmes (depuis le programme)
- Ajout de vols hors programme : CHARTER, MEDICAL, TECHNIQUE, COMMERCIAL, CARGO, AUTRE
- Modification des horaires et donnees de mouvement
- Annulation de mouvements (possible meme apres publication)
- Publication du bulletin (diffusion aux equipes)
- Archivage (conservation 5 ans sur Google Drive)
- Suppression (uniquement en statut BROUILLON)
- Creation automatique des vols operationnels depuis les mouvements publies
- Detection des escales actives par date

**Donnees par mouvement** :
- Numero de vol et code compagnie
- Date du mouvement
- Heures d'arrivee et de depart prevues
- Provenance et destination
- Type avion
- Type d'operation (detecte automatiquement : les 2 heures = TURN_AROUND, sinon ARRIVEE ou DEPART)
- Origine : PROGRAMME, HORS_PROGRAMME, AJUSTEMENT
- Statut mouvement : PREVU, CONFIRME, MODIFIE, ANNULE
- Raison hors programme (si applicable)
- Remarques

**Workflow** :
```
Creation (BROUILLON) → Publication (PUBLIE) → Archivage (ARCHIVE)
```

**Liens avec le CRV** :
- Chaque mouvement publie peut generer un vol operationnel
- Le CRV est cree en reference a un mouvement specifique du bulletin
- Le systeme enrichit dynamiquement la reponse avec l'ID du CRV associe

---

### 3.3 Module Compte Rendu de Vol (CRV) — Module Central

**Objectif** : Documenter en temps reel chaque operation de vol pour constituer un dossier legal complet.

#### 3.3.1 Creation du CRV

**4 chemins de creation disponibles** :

| Chemin | Source | Description |
|--------|--------|-------------|
| PATH 1 | Bulletin + Mouvement | Le plus courant : CRV lie a un mouvement publie du bulletin |
| PATH 2 | Vol hors programme | Pour les vols non planifies (charter, medical, etc.) |
| PATH 3 | Vol existant | Rattachement a un vol deja cree dans le systeme |
| PATH 4 | Creation legacy | Saisie manuelle complete (retrocompatibilite) |

**Numerotation automatique** : Format `CRV[AAMMJJ]-[XXXX]` (ex: CRV260311-0014)
- Compteur atomique par jour
- Unicite garantie meme en acces concurrent

**Detection de doublons** :
- Cle d'unicite : numero de vol + date + escale
- En cas de doublon, l'utilisateur doit confirmer (double confirmation requise)

#### 3.3.2 Donnees d'en-tete du CRV

| Champ | Description |
|-------|-------------|
| Numero CRV | Auto-genere, unique |
| Vol | Numero, compagnie, code IATA |
| Escale | Code aeroport (3-4 caracteres) |
| Date du vol | Date de l'operation |
| Type d'operation | ARRIVEE, DEPART, TURN_AROUND |
| Type avion | Propage depuis le bulletin de mouvement |
| Avion | Reference vers le referentiel avion (immatriculation) |
| Poste de stationnement | Code de parking |
| Statut | Machine a etats (BROUILLON → ... → VERROUILLE) |
| Completude | Pourcentage 0-100% |
| Responsable du vol | Personnel affecte comme responsable |
| Cree par | Utilisateur ayant cree le CRV |
| Reference bulletin | Lien vers le bulletin source |
| Indicateur doublon | Si le CRV a ete cree malgre un doublon detecte |

#### 3.3.3 Phases operationnelles

Le coeur du CRV : chaque operation de vol est decomposee en phases chronologiques.

**Referentiel de phases** :
- 20+ phases standard definies dans un referentiel
- Chaque phase a un code, un libelle, un type d'operation, une categorie, un ordre, une duree standard en minutes
- Phases filtrees automatiquement selon le type d'operation :
  - ARRIVEE : phases ARRIVEE + COMMUN
  - DEPART : phases DEPART + COMMUN
  - TURN_AROUND : toutes les phases (ARRIVEE + DEPART + TURN_AROUND + COMMUN)

**Categories de phases** :
- PISTE : operations au sol (tractage, positionnement)
- PASSAGERS : embarquement, debarquement, transit
- FRET : chargement, dechargement cargo
- BAGAGE : traitement des bagages
- TECHNIQUE : inspections, maintenance
- AVITAILLEMENT : carburant
- NETTOYAGE : nettoyage cabine
- SECURITE : inspections de securite
- BRIEFING : briefings equipage

**Macro-phases** :
- DEBUT : phases d'initialisation
- REALISATION : phases d'execution
- FIN : phases de cloture

**Cascade temporelle** (fonctionnalite ajoutee) :
- Les heures de debut/fin prevues sont calculees automatiquement en cascade
- Point de depart : heure d'atterrissage prevue (ARRIVEE/TURN_AROUND) ou heure de decollage prevue (DEPART)
- Chaque phase commence quand la precedente se termine
- Duree basee sur le referentiel (dureeStandardMinutes)

**Cycle de vie d'une phase** :
```
NON_COMMENCE → EN_COURS → TERMINE
                         → NON_REALISE (avec justification obligatoire)
                         → ANNULE
```

**Prerequis entre phases** :
- Certaines phases ont des prerequis (une phase ne peut demarrer que si ses prerequis sont termines ou non realises)

**Horodatage double** :
- Chaque demarrage/arret de phase enregistre 2 timestamps :
  - `timestampSysteme` : horloge serveur (inalterable)
  - `heureDeclaree` : heure saisie par l'agent (peut differer si saisie tardive)
- Source auto-detectee : TEMPS_REEL (ecart < 5min), DECLARATION (ecart > 5min), CORRECTION, IMPORT
- Indicateur de saisie tardive si ecart > 60 minutes
- Agent responsable enregistre

**Ecarts calcules** :
- Duree reelle vs duree standard
- Heure prevue vs heure reelle (en minutes, positif = retard, negatif = avance)

#### 3.3.4 Charges operationnelles

Documentation des flux de passagers, bagages et fret.

**3 types de charges** : PASSAGERS, BAGAGES, FRET
**2 sens** : EMBARQUEMENT, DEBARQUEMENT

**Passagers — Donnees de base** :
- Nombre d'adultes
- Nombre d'enfants
- Nombre de PMR (Personnes a Mobilite Reduite)
- Nombre de passagers en transit
- Nombre de bebes

**Passagers — Categories detaillees (Extension 4)** :
- Bebes, enfants, adolescents, adultes, seniors
- PMR detailles : fauteuil roulant, marche assistee, non-voyant, sourd
- Transit local et international
- VIP
- Equipage
- Deportes
- Classes : premiere, affaires, economique
- Besoins medicaux : oxygene, brancardier, accompagnement medical
- Mineurs non accompagnes

**Bagages** :
- Nombre de bagages en soute
- Poids des bagages en soute (kg)
- Nombre de bagages cabine
- Regle metier : si bagages en soute > 0, le poids DOIT etre renseigne

**Fret — Donnees de base** :
- Nombre de colis
- Poids total (kg)
- Type de fret : GENERAL, STANDARD, PERISSABLE, DANGEREUX, ANIMAUX, AUTRE

**Fret — Donnees detaillees (Extension 5)** :
- Categories : postal, courrier express, marchandise generale
- Denrees perissables (avec temperature et chaine du froid)
- Animaux vivants (avec espece et certificat veterinaire)
- Vehicules et equipements
- Valeur declaree (montant + devise)
- Marchandises dangereuses (voir ci-dessous)
- Logistique : colis, volume m3, palettes (type EUR/EPAL/STANDARD/AUTRE), conteneurs, surdimensionne
- Douanes : valeur declaree, pays origine/destination, numero BL/AWB, declaration douaniere
- Conditions de transport : temperature controlee, humidite, fragile, protege lumiere, instructions speciales

**Marchandises dangereuses (DGR)** :
- Code ONU (format UN + 4 chiffres)
- Classe ONU (1-9)
- Designation officielle
- Quantite et unite
- Groupe d'emballage (I, II, III)
- Declaration DGR (oui/non)
- Responsable (nom, telephone)
- Validation automatique des codes

**Limites de coherence** :
- Passagers : max 1000 par categorie
- Bagages : max 50000
- Fret : max 200000 kg
- Pas de doublon type+sens par CRV

#### 3.3.5 Evenements operationnels

Documentation des incidents et anomalies pendant l'operation.

**Types d'evenements** :
- PANNE_EQUIPEMENT
- ABSENCE_PERSONNEL
- RETARD
- INCIDENT_SECURITE
- INCIDENT_TECHNIQUE
- PROBLEME_TECHNIQUE
- METEO
- AUTRE

**Niveaux de gravite** : MINEURE, MODEREE, MAJEURE, CRITIQUE

**Donnees enregistrees** :
- Type et gravite
- Date/heure debut et fin
- Duree d'impact (calculee automatiquement)
- Description detaillee
- Phases impactees (references croisees)
- Equipement concerne (si applicable)
- Personnel concerne (si applicable)
- Actions correctives prises
- Declarant
- Statut : OUVERT → EN_COURS → RESOLU → CLOTURE

#### 3.3.6 Observations

Notes et commentaires textuels sur l'operation.

**Categories** :
- GENERALE
- TECHNIQUE
- OPERATIONNELLE
- SECURITE
- QUALITE
- SLA

**Donnees** :
- Contenu textuel
- Auteur
- Date/heure
- Phase concernee (optionnel)
- Piece jointe (chemin fichier)
- Visibilite : INTERNE, COMPAGNIE, PUBLIQUE

#### 3.3.7 Personnel affecte

Documentation des equipes impliquees dans l'operation.

**Fonctions gerable** :
- CHEF_ESCALE
- AGENT_TRAFIC
- AGENT_PISTE
- AGENT_PASSAGE
- MANUTENTIONNAIRE
- CHAUFFEUR
- AGENT_SECURITE
- TECHNICIEN
- SUPERVISEUR
- COORDINATEUR
- AUTRE

**Donnees par personnel** :
- Nom et prenom
- Fonction
- Matricule
- Telephone
- Remarques

#### 3.3.8 Materiel utilise

Suivi des engins et equipements mobilises.

**Types d'engins** :
- TRACTEUR_PUSHBACK
- PASSERELLE
- TAPIS_BAGAGES
- GPU (Ground Power Unit)
- ASU (Air Starter Unit)
- ESCALIER
- TRANSBORDEUR
- CAMION_AVITAILLEMENT
- CAMION_VIDANGE
- CAMION_EAU
- ELEVATEUR
- CHARIOT_BAGAGES
- CONTENEUR_ULD
- DOLLY
- AUTRE

**Donnees par equipement** :
- Type d'engin
- Identifiant (code unique)
- Heure de debut et fin d'utilisation
- Operateur
- Phase concernee
- Remarques

#### 3.3.9 Horaires

Suivi des heures prevues vs reelles pour les moments cles du vol.

**14 jalons temporels** (prevu + reel pour chacun) :
- Atterrissage
- Arrivee au parc (parking)
- Depart du parc
- Decollage
- Ouverture parking
- Fermeture parking
- Remise des documents
- Livraison bagages (debut et fin)

**Ecarts calcules automatiquement** :
- Ecart atterrissage (prevu vs reel, en minutes)
- Ecart decollage
- Ecart parc

---

### 3.4 Module Validation

**Objectif** : Assurer le controle qualite des CRV avant archivage definitif.

**Fonctionnalites** :
- Validation d'un CRV (TERMINE → VALIDE) avec controles automatiques :
  - Completude >= 80%
  - Responsable du vol defini
  - Toutes les phases traitees (terminees ou justifiees)
- Rejet (TERMINE → EN_COURS) avec commentaire obligatoire
- Verrouillage (VALIDE → VERROUILLE)
- Deverrouillage (VERROUILLE → VALIDE) si non archive, avec justification
- Score de completude calcule
- Conformite SLA (comparaison phases prevues vs reelles, seuil 15 minutes)
- Liste des ecarts SLA avec description
- Anomalies detectees (ex: responsable non defini)

**Enregistrement de validation** :
- Validateur (personne)
- Date de validation
- Statut : VALIDE, INVALIDE, EN_ATTENTE_CORRECTION
- Commentaires
- Score de completude
- Conformite SLA (oui/non)
- Ecarts SLA detailles (par phase)
- Anomalies detectees

---

### 3.5 Module Archivage

**Objectif** : Conserver les CRV valides sous forme de documents legaux immutables.

**Fonctionnalites** :
- Generation automatique de PDF a partir des donnees du CRV
- Upload sur Google Drive dans une arborescence structuree :
  ```
  CRV/
  └── 2026/
      └── 03/
          └── CH/
              └── CRV260311-0014_TURN_AROUND.pdf
  ```
- Idempotence : si deja archive, retourne l'existant sans re-upload
- Immutabilite : une fois archive, le CRV ne peut plus etre modifie ni deverrouille
- Metadonnees enregistrees : fileId Drive, lien web, nom fichier, chemin dossier, taille, date, archiveur, version
- Verification de l'etat du service (connectivite Drive, dossier accessible)
- Conservation : **10 ans** (obligation legale)

**Conditions d'archivage** :
- Statut CRV : VALIDE ou VERROUILLE
- Non ANNULE
- Non deja archive

**Types de documents archivables** :

| Type | Format | Conservation | Structure Drive |
|------|--------|-------------|-----------------|
| CRV | A4 portrait | 10 ans | annee/mois/compagnie |
| Bulletin de mouvement | A4 paysage | 5 ans | annee/mois/escale |
| Programme de vols | A4 paysage | 5 ans | annee |

---

### 3.6 Module Notifications

**Objectif** : Alerter les bonnes personnes au bon moment.

#### 3.6.1 Canaux de notification

| Canal | Statut | Description |
|-------|--------|-------------|
| In-App | Operationnel | Notifications dans l'interface, avec compteur non lues |
| Email (SMTP) | Operationnel | Emails transactionnels pour evenements critiques |
| WhatsApp | Prevu | Alertes terrain via WhatsApp Business |

#### 3.6.2 Evenements declencheurs

Le systeme surveille **82 types d'evenements** repartis en 12 domaines :

| Domaine | Exemples d'evenements |
|---------|----------------------|
| CRV | CRV cree, demarrage, terminaison, validation, rejet, verrouillage |
| Validation | Validation reussie, rejet, deverrouillage |
| Annulation | CRV annule, CRV reactive |
| Archivage | Archivage reussi, echec d'archivage |
| Phases | Phase demarree, terminee, non realisee, en retard |
| Bulletin | Bulletin publie, mouvement annule |
| Programme | Programme active, suspendu, supprime |
| Charges | Charge ajoutee, modifiee |
| SLA | Alerte depassement SLA (seuil 15 min) |
| Auth | Connexion, echec connexion, deconnexion |
| Engins | Engin affecte, libere, en panne |
| Avions | Configuration modifiee, nouvelle version |

#### 3.6.3 Matrice de notification

Chaque evenement peut etre configure par role et par canal :
- 82 evenements x 6 roles = **492 regles configurables**
- Chaque regle definit : actif/inactif, canal in-app, canal email, canal WhatsApp
- Administration via interface dediee (ADMIN uniquement)

#### 3.6.4 Notifications in-app

**Donnees** :
- Destinataire
- Type : INFO, WARNING, ERROR, SUCCESS, ALERTE_SLA
- Titre et message
- Lien de redirection
- Lu/non lu avec date de lecture
- Archive/non archive
- Priorite : BASSE, NORMALE, HAUTE, URGENTE
- Source : SYSTEME, ADMIN, ALERTE_SLA, WORKFLOW, VALIDATION
- Date d'expiration (nettoyage automatique)

**Fonctionnalites utilisateur** :
- Liste des notifications avec filtres (type, priorite, lu/non lu)
- Compteur de non lues (icone dans le header)
- Marquer comme lu (individuel ou toutes)
- Archiver
- Supprimer
- Statistiques personnelles

#### 3.6.5 Configuration des destinataires

Par role, on peut definir :
- Liste d'emails externes (contacts en dehors du systeme)
- Liste de numeros WhatsApp
- Mode : utilisateurs uniquement, contacts uniquement, ou les deux

---

### 3.7 Module SLA (Service Level Agreement)

**Objectif** : Surveiller la conformite operationnelle aux engagements de service.

**Fonctionnalites** :
- Verification SLA par CRV (comparaison phases reelles vs prevues)
- Verification SLA par phase individuelle
- Seuil de deviation : 15 minutes
- Rapport SLA (Manager uniquement)
- Configuration des seuils (Manager uniquement)
- Surveillance proactive des CRV et phases en cours
- Alertes automatiques en cas de depassement

**Ecarts detectes** :
- Phase en retard par rapport a la prevision
- Duree reelle excedant significativement la duree standard

---

### 3.8 Module Statistiques et Reporting

**Objectif** : Fournir des indicateurs de performance operationnelle.

**Statistiques par bulletin** :
- Nombre de mouvements annonces vs operes
- Taux de realisation (%)
- Taux de conformite (%)

**Statistiques par periode** :
- Nombre de bulletins
- Mouvements actifs annonces vs operes
- Comparaison croisee

**Analyse des vols hors programme** :
- Repartition par type (CHARTER, MEDICAL, TECHNIQUE, etc.)
- Taux annonces vs operes

**Detection des ecarts** :
- Vols annonces mais non operes
- Vols operes mais non annonces (imprevus)
- Deviations horaires significatives (seuil 15 minutes)

**Statistiques CRV** :
- Par compagnie
- Par type d'operation
- Par statut
- Par periode
- Export Excel

**Statistiques passagers et fret** :
- Totaux par CRV, par periode
- Repartition par categorie
- Tendances

---

### 3.9 Module Referentiel Avions

**Objectif** : Maintenir une base de donnees des types d'avions avec suivi de configuration.

**Donnees avion** :
- Immatriculation (unique)
- Type avion
- Compagnie
- Capacite passagers et fret
- Statut : ACTIF, MAINTENANCE, HORS_SERVICE

**Configuration detaillee (Extension 3)** :
- Version de configuration
- Sieges : classe affaires (nombre + disposition), economique, premiere
- Equipements : wifi, divertissement, prise electrique, equipements speciaux
- Moteurs : type, nombre
- Caracteristiques techniques : poids max decollage, autonomie, vitesse croisiere, altitude max
- Derniere revision : date, type (MINEURE/MAJEURE/COMPLETE), prochaine date prevue

**Gestion de versions** :
- Historique des versions de configuration
- Comparaison entre versions
- Restauration de version precedente
- Chaque version : date de changement, modificateur, description des modifications, snapshot complet

**Maintenance** :
- Suivi des revisions
- Alertes prochaines revisions

---

### 3.10 Module Gestion des Engins

**Objectif** : Gerer le parc d'equipements sol et leur affectation aux vols.

**Types d'engins** :
- TRACTEUR
- CHARIOT_BAGAGES
- CHARIOT_FRET
- GPU (Ground Power Unit)
- ASU (Air Starter Unit)
- STAIRS (escalier)
- CONVOYEUR
- AUTRE

**Donnees** :
- Numero d'engin (unique)
- Type, marque, modele
- Statut : DISPONIBLE, EN_SERVICE, MAINTENANCE, PANNE, HORS_SERVICE
- Derniere et prochaine revision

**Affectation aux vols** :
- Engin + Vol + Heures debut/fin
- Usage : TRACTAGE, BAGAGES, FRET, ALIMENTATION_ELECTRIQUE, CLIMATISATION, PASSERELLE, CHARGEMENT
- Statut affectation : AFFECTE, EN_COURS, TERMINE, PANNE

---

### 3.11 Module Centre de Controle Operations (OPS)

**Objectif** : Fournir une vue temps reel de l'etat des operations d'escale.

**Fonctionnalites** :
- Flux d'evenements en temps reel (Server-Sent Events)
- Tableau de bord operationnel (Manager, Superviseur)
- Statistiques agregees (Admin)

**Acces** : ADMIN, MANAGER, SUPERVISEUR uniquement

---

### 3.12 Module Journal d'Activite

**Objectif** : Tracabilite complete de toutes les actions utilisateur.

**Donnees enregistrees** :
- Utilisateur (avec snapshot nom/role au moment de l'action)
- Action effectuee
- Details
- Date
- Type : auth, action, system, business
- Requete HTTP : ID, methode, path, query, code retour, latence
- Client : IP, user-agent
- Contexte : type entite, ID entite, references croisees (CRV, Vol, etc.)
- Metadonnees additionnelles

**Fonctions de recherche** :
- Par utilisateur
- Par action
- Par type
- Par entite
- Par requete
- Tri chronologique inverse

---

## 4. PROFILS UTILISATEURS ET MATRICE DE PERMISSIONS

### 4.1 Les 6 profils du systeme

#### AGENT D'ESCALE (AGENT_ESCALE)

**Role operationnel** : Acteur terrain principal. L'agent d'escale est la personne qui assiste physiquement au vol et renseigne le CRV en temps reel.

**Responsabilites** :
- Creer et renseigner les CRV en temps reel
- Demarrer et terminer les phases operationnelles
- Saisir les charges (passagers, bagages, fret)
- Declarer les evenements et incidents
- Ajouter des observations
- Gerer le personnel et le materiel affecte
- Publier les bulletins de mouvement
- Creer et gerer les programmes de vols

**Limitations** :
- Ne peut pas valider, verrouiller ou annuler un CRV
- Ne peut pas gerer les utilisateurs
- Ne peut pas acceder aux parametres systeme

---

#### CHEF D'EQUIPE (CHEF_EQUIPE)

**Role operationnel** : Coordonnateur d'equipe terrain. Memes droits que l'agent d'escale.

**Responsabilites identiques a l'agent d'escale** :
- Toutes les operations CRV (creation, saisie, phases)
- Gestion bulletins et programmes
- Pas de privileges supplementaires de validation

**Distinction** :
- Principalement organisationnelle (coordination d'equipe)
- Memes permissions techniques que AGENT_ESCALE

---

#### SUPERVISEUR

**Role operationnel** : Premier niveau de controle. Le superviseur valide la qualite des CRV et peut agir sur les etats avances.

**Responsabilites** :
- Toutes les operations d'un agent d'escale
- **Valider** les CRV (TERMINE → VALIDE)
- **Verrouiller** les CRV (VALIDE → VERROUILLE)
- **Deverrouiller** les CRV (VERROUILLE → VALIDE, si non archive)
- **Rejeter** les CRV (TERMINE → EN_COURS, avec commentaire)
- **Annuler** les CRV (avec justification)
- Supprimer les CRV (avant archivage)
- Acceder au tableau de bord OPS
- Consulter les statistiques

---

#### MANAGER

**Role operationnel** : Direction des operations. Niveau le plus eleve d'autorite operationnelle.

**Responsabilites** :
- Toutes les permissions du superviseur
- Supprimer les programmes de vols
- Gerer les engins (creation, modification)
- Configurer les seuils SLA
- Acceder aux rapports SLA
- Surveiller les CRV et phases en temps reel
- Creer des notifications manuelles
- Acceder au centre de controle OPS

---

#### QUALITE (QUALITE)

**Role operationnel** : Observateur et auditeur. Le role qualite a un acces en lecture seule a toutes les donnees operationnelles.

**Responsabilites** :
- **Consulter** tous les CRV, bulletins, programmes, statistiques
- Consulter les archives
- **Aucune action d'ecriture** : ne peut pas creer, modifier, valider, annuler ou supprimer

**Restrictions specifiques** :
- Exclu de la creation de CRV
- Exclu de la publication de bulletins
- Exclu de la gestion des programmes
- Exclu de la modification des charges, phases, evenements
- Exclu des statistiques d'annulation (considerees operationnelles)

---

#### ADMINISTRATEUR (ADMIN)

**Role systeme** : Gestion de l'infrastructure et des utilisateurs. Aucun acces operationnel.

**Responsabilites** :
- Gestion des comptes utilisateurs (creation, validation, desactivation)
- Configuration des regles de notification (matrice 82 evenements x 6 roles)
- Configuration des destinataires de notification (emails, WhatsApp)
- Consultation des journaux d'activite
- Gestion des parametres systeme
- Acces au tableau de bord admin
- Gestion des engins (creation, suppression)
- Acces au centre de controle OPS (statistiques)

**Restrictions critiques (doctrine MADMIT)** :
- **AUCUN acces aux CRV** (ne peut pas lire, creer, modifier)
- **AUCUN acces aux bulletins operationnels**
- **AUCUN acces aux programmes de vols** via le module operationnel
- Le role ADMIN est strictement separe des operations

---

### 4.2 Matrice de permissions detaillee

| Permission | AGENT | CHEF | SUPER | MGR | QUALITE | ADMIN |
|------------|:-----:|:----:|:-----:|:---:|:-------:|:-----:|
| **CRV** |
| Creer CRV | O | O | O | O | - | - |
| Lire CRV | O | O | O | O | O (RO) | - |
| Modifier CRV | O | O | O | O | - | - |
| Supprimer CRV | - | - | O | O | - | - |
| Demarrer CRV | O | O | O | O | - | - |
| Terminer CRV | O | O | O | O | - | - |
| Valider CRV | - | - | O | O | - | - |
| Rejeter CRV | - | - | O | O | - | - |
| Verrouiller CRV | - | - | O | O | - | - |
| Deverrouiller CRV | - | - | O | O | - | - |
| Annuler CRV | - | - | O | O | - | - |
| Reactiver CRV | O | O | O | O | - | - |
| Archiver CRV | O | O | O | O | - | - |
| Exporter PDF | O | O | O | O | O | - |
| **CHARGES** |
| Ajouter charges | O | O | O | O | - | - |
| Modifier categories | O | O | O | O | - | - |
| Ajouter DGR | O | O | O | O | - | - |
| **PHASES** |
| Demarrer phase | O | O | O | O | - | - |
| Terminer phase | O | O | O | O | - | - |
| Non realise | O | O | O | O | - | - |
| **BULLETIN** |
| Creer bulletin | O | O | O | O | - | - |
| Lire bulletin | O | O | O | O | O | - |
| Publier bulletin | O | O | O | O | - | - |
| Archiver bulletin | O | O | O | O | - | - |
| **PROGRAMME** |
| Creer programme | O | O | O | O | - | - |
| Lire programme | O | O | O | O | O | - |
| Modifier programme | O | O | O | O | - | - |
| Valider programme | O | O | O | O | - | - |
| Activer programme | O | O | O | O | - | - |
| Supprimer programme | - | - | - | O | - | - |
| **AVIONS** |
| Lire avions | O | O | O | O | O | - |
| Modifier config | - | - | O | O | - | - |
| Creer version | - | - | O | O | - | - |
| **ENGINS** |
| Lire engins | O | O | O | O | O | O |
| Creer/modifier | - | - | - | O | - | O |
| Supprimer | - | - | - | - | - | O |
| **ADMIN** |
| Gerer utilisateurs | - | - | - | - | - | O |
| Configurer notif | - | - | - | - | - | O |
| Voir logs | - | - | - | - | - | O |
| Parametres systeme | - | - | - | - | - | O |
| **STATISTIQUES** |
| Consulter stats | O | O | O | O | O | - |
| Stats annulation | O | O | O | O | - | - |
| Rapport SLA | - | - | - | O | - | - |
| **OPS** |
| Centre controle | - | - | O | O | - | O |

---

### 4.3 Gestion des comptes

**Cycle de vie d'un compte** :
1. Inscription (statut EN_ATTENTE)
2. Validation par ADMIN (statut VALIDE)
3. Premiere connexion avec changement de mot de passe obligatoire
4. Utilisation normale
5. Suspension eventuelle (SUSPENDU)
6. Desactivation (DESACTIVE)

**Donnees utilisateur** :
- Nom, prenom, matricule (unique)
- Email (unique)
- Mot de passe (hash bcrypt)
- Fonction/role
- Specialites : PISTE, PASSAGERS, FRET, BAGAGE, AVITAILLEMENT, NETTOYAGE, MAINTENANCE
- Statut personnel : ACTIF, ABSENT, CONGE, INACTIF
- Statut compte : EN_ATTENTE, VALIDE, SUSPENDU, DESACTIVE
- Date de validation, valideur
- Telephone, date d'embauche

---

## 5. ROLE DE L'ADMINISTRATEUR SYSTEME

### 5.1 Perimetre strict

L'administrateur est volontairement **exclu de toute activite operationnelle**. Cette separation est une decision architecturale deliberee (doctrine MADMIT) visant a :
- Eviter les conflits d'interet entre gestion systeme et operations
- Garantir que les donnees operationnelles ne sont manipulees que par le personnel habilite
- Maintenir la tracabilite operationnelle (pas d'intervention admin dans les CRV)

### 5.2 Fonctions d'administration

#### Gestion des utilisateurs
- Creer de nouveaux comptes (avec attribution de role)
- Valider les comptes en attente (statut EN_ATTENTE → VALIDE)
- Modifier les informations utilisateur (nom, email, role, specialites)
- Desactiver/reactiver des comptes
- Supprimer des comptes
- Consulter les statistiques par role et par statut

#### Gestion des notifications
- Configurer la matrice de notification (82 evenements x 6 roles x 3 canaux)
- Activer/desactiver des regles par evenement ou par domaine entier
- Configurer les destinataires par role :
  - Ajouter/supprimer des emails externes
  - Ajouter/supprimer des numeros WhatsApp
  - Definir le mode : utilisateurs systeme seuls, contacts externes seuls, ou les deux
- Reinitialiser les regles par defaut

#### Gestion du referentiel engins
- Creer de nouveaux engins
- Modifier les engins existants
- Supprimer des engins (seul role autorise)

#### Consultation et audit
- Consulter les journaux d'activite de tous les utilisateurs
- Acceder au centre de controle OPS (statistiques agregees)
- Tester la configuration email (envoi de test)
- Verifier le statut du service d'archivage (connectivite Google Drive)

### 5.3 Ce que l'administrateur NE PEUT PAS faire

- Acceder a aucun CRV (ni lecture, ni ecriture)
- Acceder aux bulletins de mouvement
- Acceder aux programmes de vols (via le module operationnel)
- Valider, verrouiller ou annuler un CRV
- Modifier des charges, phases ou evenements
- Archiver des documents operationnels
- Consulter les statistiques operationnelles (sauf via OPS)

---

## 6. COMPARAISON AVEC LE FONCTIONNEMENT ACTUEL

### 6.1 Processus papier vs CRV numerique

| Aspect | Fonctionnement actuel (papier/Excel) | Systeme CRV |
|--------|--------------------------------------|-------------|
| **Support** | Formulaires papier, fichiers Excel | Application web centralisee |
| **Saisie** | Fin de journee, de memoire | Temps reel, sur le terrain |
| **Tracabilite** | Aucune (qui a modifie quoi ?) | Triple couche d'audit avec horodatage |
| **Horodatage** | Manuel, approximatif | Double (systeme + declare), source detectee |
| **Archivage** | Classeurs physiques, risque de perte | Google Drive structure, 10 ans, immutable |
| **Recherche** | Parcours manuel des classeurs | Recherche instantanee multi-criteres |
| **Statistiques** | Compilation manuelle, fin de mois | Temps reel, automatisees |
| **SLA** | Controle aleatoire, post-mortem | Surveillance automatique, alertes en temps reel |
| **Doublons** | Detection impossible | Detection automatique (vol + date + escale) |
| **Communication** | Telephone, radio | Notifications automatiques multi-canal |
| **Conformite** | Verification manuelle | Regles metier automatisees, validation structuree |
| **PDF legal** | Redigé manuellement | Genere automatiquement, conforme |
| **Acces** | Document physique local | Acces web depuis tout poste connecte |
| **Securite** | Acces libre au classeur | Roles, permissions, authentification |
| **Planification** | Tableaux Excel, emails | Programmes → Bulletins → CRV (chaine tracee) |

### 6.2 Gains operationnels attendus

| Gain | Impact |
|------|--------|
| **Temps de saisie** | Reduction estimee 60-70% (saisie temps reel vs reconstruction de memoire) |
| **Erreurs de saisie** | Reduction par validation automatique et auto-completion |
| **Temps de recherche** | De plusieurs minutes (classeur) a quelques secondes (recherche) |
| **Temps de reporting** | De plusieurs heures (Excel) a instantane (statistiques auto) |
| **Conformite SLA** | De controle aleatoire a surveillance exhaustive 100% |
| **Risk de perte** | De eleve (papier) a quasi-nul (backup numerique) |
| **Tracabilite** | De inexistante a complete (qui, quoi, quand, depuis ou) |
| **Communication** | De manuelle a automatisee (notifications) |

### 6.3 Changements organisationnels requis

| Changement | Description |
|------------|-------------|
| **Equipement terrain** | Tablettes ou smartphones avec navigateur pour les agents |
| **Connectivite** | Reseau WiFi/4G couvrant la zone d'escale |
| **Formation** | Formation initiale des equipes (interface, workflows) |
| **Discipline** | Saisie en temps reel (pas en fin de journee) |
| **Responsabilisation** | Chaque action est tracee et attribuee |
| **Validation** | Nouveau workflow avec superviseur (controle qualite) |
| **Administration** | Un administrateur dedie pour la gestion des comptes |

---

## 7. MODULES OPERATIONNELS — EN PRODUCTION

### 7.1 Modules 100% fonctionnels

| Module | Statut | Description |
|--------|--------|-------------|
| **Authentification** | Operationnel | Login JWT, changement mot de passe obligatoire, validation compte admin |
| **Gestion utilisateurs** | Operationnel | CRUD complet, attribution roles, cycle de vie comptes |
| **Programme de vols** | Operationnel | CRUD + workflow validation/activation, duplication, PDF, archivage |
| **Bulletin de mouvement** | Operationnel | CRUD + mouvements + publication + creation vols, archivage |
| **CRV — Creation** | Operationnel | 4 chemins, detection doublons, numerotation auto |
| **CRV — Phases** | Operationnel | Initialisation auto, demarrer/terminer, cascade temporelle, prerequis |
| **CRV — Charges basiques** | Operationnel | Passagers, bagages, fret (donnees simples) |
| **CRV — Evenements** | Operationnel | Declaration incidents avec gravite et phases impactees |
| **CRV — Observations** | Operationnel | Notes avec categories et visibilite |
| **CRV — Personnel** | Operationnel | Affectation avec fonctions et horaires |
| **CRV — Materiel** | Operationnel | Affectation engins avec type et phase concernee |
| **CRV — Horaires** | Operationnel | 14 jalons, ecarts automatiques, horodatage double |
| **CRV — Machine a etats** | Operationnel | BROUILLON → ... → VERROUILLE, annulation/reactivation |
| **CRV — Completude** | Operationnel | Calcul 4 axes ponderes, seuils 50%/80% |
| **Validation** | Operationnel | Valider/rejeter/verrouiller/deverrouiller, controles auto |
| **Archivage Google Drive** | Operationnel | PDF auto, upload Drive, immutabilite, idempotence |
| **PDF** | Operationnel | Generation CRV, bulletin, programme (buffer, stream, base64) |
| **Notifications in-app** | Operationnel | Creation, lecture, archivage, compteur, expiration |
| **Notifications email** | Operationnel | SMTP transactionnel (validation, incidents critiques) |
| **Journal d'activite** | Operationnel | Audit triple couche, filtrage secrets |
| **Referentiel avions** | Operationnel | CRUD, configuration, versions, revisions |
| **Referentiel engins** | Operationnel | CRUD, disponibilite, affectation |
| **Statistiques** | Operationnel | Bulletin vs CRV, ecarts, taux realisation |
| **Recherche CRV** | Operationnel | Multi-criteres, export Excel |
| **Confirmation absence** | Operationnel | Confirmer absence evenements/observations/charges |

### 7.2 API — Couverture

| Domaine | Endpoints | Taux couverture |
|---------|-----------|-----------------|
| Authentification | 8 | 100% |
| CRV (coeur) | 40+ | 95% |
| Phases | 6 | 100% |
| Charges | 16 | 100% |
| Vols | 4 | 100% |
| Programmes | 20+ | 100% |
| Bulletins | 14 | 100% |
| Validation | 5 | 100% |
| Notifications | 8 | 100% |
| Notification rules | 8 | 100% |
| Notification recipients | 9 | 100% |
| Avions | 12 | 100% |
| Engins | 7 | 100% |
| SLA | 7 | 100% |
| OPS | 3 | 80% |
| Personnes | 7 | 100% |
| **Total** | **200+** | **~97%** |

---

## 8. MODULES PARTIELLEMENT IMPLEMENTES

### 8.1 En cours de developpement

| Module | Avancement | Manque |
|--------|------------|-------|
| **Charges detaillees passagers (Extension 4)** | 90% | Tests frontend complets |
| **Fret detaille (Extension 5)** | 90% | Tests frontend complets |
| **Annulation CRV (Extension 6)** | 95% | Tests de bout en bout |
| **Notifications in-app (Extension 7)** | 85% | Seeding des regles par defaut, tests e2e |
| **Notifications WhatsApp** | 10% | Integration WhatsApp Business API |
| **Centre OPS temps reel** | 60% | Frontend tableau de bord complet, vues specialisees |
| **Export Excel CRV** | 80% | Validation format et contenu |

### 8.2 Bugs connus non corriges

#### Backend (6 bugs P0)
1. Route shadowing (routes en conflit)
2. Imports manquants dans certains services
3. References null non gerees dans certains cas
4. Race conditions sur operations concurrentes
5. Bypass verrouillage dans certains chemins
6. Endpoints auth non securises

#### Frontend (12 bugs critiques)
1. Export store non fonctionnel dans certains composants
2. Logique de validation incorrecte dans certains formulaires
3. userData non mis a jour apres changement de role
4. Sensibilite a la casse dans les comparaisons de statut
5. Et 8 autres bugs identifies dans l'audit

#### Securite (6 failles identifiees)
1. Endpoints auth partiellement non proteges
2. JWT avec secret par defaut
3. CORS wildcard en developpement
4. Registration ouverte (tout le monde peut creer un compte)
5. Et 2 autres failles documentees

### 8.3 Points d'attention technique

| Point | Statut | Impact |
|-------|--------|--------|
| Tests automatises backend | A mettre en place (Vitest) | Risque regression |
| Tests automatises frontend | Absents | Risque regression |
| CI/CD | Absent | Deploiement manuel |
| Monitoring production | Absent | Pas de detection proactive |
| Backup base de donnees | A verifier | Risque perte de donnees |
| Rate limiting | Configure (200 req/min) | Operationnel |
| HTTPS | A configurer (production) | Securite |

---

## 9. VISION FUTURE ET FEUILLE DE ROUTE

### 9.1 Court terme (3-6 mois)

| Priorite | Action | Impact |
|----------|--------|--------|
| 1 | Installer tests automatises backend (11 tests machine a etats) | Fiabilite |
| 2 | Corriger bugs P0 backend (6 bugs) | Stabilite |
| 3 | Ajouter tests permissions et verrouillage | Securite |
| 4 | Corriger bugs frontend (12 bugs) | Experience utilisateur |
| 5 | Monitoring archivage Drive | Fiabilite archivage |
| 6 | Synchronisation Front/Back (coherence donnees) | Coherence |
| 7 | Nettoyage code mort (~3,432 lignes) | Maintenabilite |
| 8 | Pipeline CI/CD | Automatisation deploiement |

### 9.2 Moyen terme (6-12 mois)

| Action | Description |
|--------|-------------|
| **Integration WhatsApp** | Alertes terrain en temps reel via WhatsApp Business |
| **Centre OPS complet** | Tableau de bord temps reel avec cartes, timeline, KPIs |
| **Application mobile** | App mobile dediee pour les agents terrain (mode offline) |
| **Mode offline** | Saisie CRV sans connexion, synchronisation au retour |
| **Reporting avance** | Tableaux de bord BI, export automatise, rapports periodiques |
| **Multi-escale** | Gestion de plusieurs escales depuis une instance unique |
| **API compagnie** | Echange de donnees automatise avec les systemes compagnies |

### 9.3 Long terme (12-24 mois)

| Action | Description |
|--------|-------------|
| **Intelligence artificielle** | Detection automatique d'anomalies, prediction retards |
| **ACARS/AODB** | Integration avec les systemes de messagerie bord et base ops aeroport |
| **Gestion des rotations** | Planification optimisee des equipes et equipements |
| **Facturation automatique** | Generation automatique des factures services au sol |
| **Portail compagnie** | Acces compagnie aerienne a ses CRV en temps reel |
| **Certification reglementaire** | Conformite OACI, IATA, autorite aviation civile |

### 9.4 Extensions deja concues dans le systeme

Le systeme a ete concu avec des extensions preparees dans les schemas :

| Extension | Numero | Description | Statut |
|-----------|--------|-------------|--------|
| Vol hors programme | 2 | Gestion des vols non planifies | Operationnel |
| Configuration avion | 3 | Versions, sieges, equipements, moteurs | Operationnel |
| Categories passagers detaillees | 4 | 14 categories, classes, besoins medicaux, mineurs | Operationnel (backend) |
| Fret detaille | 5 | Categories, DGR, logistique, douanes, conditions transport | Operationnel (backend) |
| Annulation CRV | 6 | Workflow annulation/reactivation | Operationnel |
| Notifications in-app | 7 | Centre de notifications utilisateur | Operationnel |
| Propagation typeAvion | 8 | Pipeline Bulletin → Vol → CRV | Operationnel |
| Cascade temporelle | 9 | Temps prevus des phases par cascade | Operationnel |

---

## 10. INDICATEURS DE MATURITE

### 10.1 Maturite par composant

| Composant | Maturite | Commentaire |
|-----------|----------|-------------|
| Backend — Modeles | 95% | 23 collections, schemas riches et bien indexes |
| Backend — Services | 85% | 48+ services, logique metier complete |
| Backend — API | 97% | 200+ endpoints, couverture quasi-complete |
| Backend — Securite | 70% | Auth JWT ok, 6 failles a corriger |
| Backend — Tests | 5% | Quasiment aucun test automatise |
| Frontend — Pages | 85% | 28+ pages, navigation complete |
| Frontend — Composants | 80% | Formulaires riches, validation client |
| Frontend — UX | 75% | Fonctionnel mais perfectible |
| Frontend — Tests | 0% | Aucun test automatise |
| Integration Drive | 90% | Archivage fonctionnel, idempotent |
| Integration Email | 80% | SMTP operationnel |
| Documentation | 60% | Documentation technique en cours |
| CI/CD | 0% | Aucun pipeline automatise |
| Monitoring | 0% | Pas de monitoring production |

### 10.2 Maturite globale estimee

| Aspect | Score |
|--------|-------|
| **Backend** | ~73% |
| **Frontend** | ~85% |
| **Global** | ~80-82% |

### 10.3 Points forts du systeme

1. **Architecture solide** : Separation claire des couches, modeles riches
2. **Machine a etats robuste** : Protection contre les transitions illegales
3. **Immutabilite** : Garantie legale sur les documents archives
4. **Tracabilite** : Triple couche d'audit sans angle mort
5. **Extensibilite** : 9 extensions deja concues et implementees
6. **Separation des roles** : ADMIN ≠ operationnel, QUALITE = lecture seule
7. **Richesse fonctionnelle** : Charges detaillees, DGR, versions avion, SLA
8. **Conformite metier** : Regles aeronautiques integrees (codes ONU, IATA, etc.)
9. **Archivage legal** : Google Drive structure, idempotent, 10 ans
10. **Notifications multi-canal** : In-app, email, WhatsApp (prevu)

### 10.4 Risques principaux

1. **Absence de tests automatises** : Risque majeur de regression a chaque modification
2. **6 failles securite connues** : A corriger avant mise en production
3. **Pas de CI/CD** : Deploiement manuel, risque d'erreur humaine
4. **Pas de monitoring** : Pas de detection proactive des pannes
5. **Dependance Google Drive** : Single point of failure pour l'archivage
6. **Mode offline absent** : Les agents terrain dependent de la connectivite

---

## ANNEXE A — GLOSSAIRE

| Terme | Definition |
|-------|------------|
| **CRV** | Compte Rendu de Vol — document legal retraçant les operations d'escale |
| **Escale** | Aeroport d'operation (code OACI ou local) |
| **TURN_AROUND** | Vol aller-retour : l'avion arrive et repart du meme aeroport |
| **SLA** | Service Level Agreement — engagements de performance |
| **DGR** | Dangerous Goods Regulations — reglementation marchandises dangereuses |
| **PMR** | Personne a Mobilite Reduite |
| **GPU** | Ground Power Unit — alimentation electrique au sol |
| **ASU** | Air Starter Unit — demarreur pneumatique |
| **ULD** | Unit Load Device — conteneur cargo standardise |
| **IATA** | Association Internationale du Transport Aerien |
| **OACI** | Organisation de l'Aviation Civile Internationale |
| **JWT** | JSON Web Token — jeton d'authentification |
| **MADMIT** | Doctrine de gouvernance du projet CRV |

---

## ANNEXE B — ARCHITECTURE DES DONNEES

### Relations principales

```
ProgrammeVol (6 mois)
  └─ VolProgramme (lignes recurrentes)
       └─ BulletinMouvement (3-4 jours)
            └─ Mouvements (instances journalieres)
                 └─ Vol (vol operationnel jour J)
                      └─ CRV (compte rendu)
                           ├─ ChronologiePhase (phases)
                           │    └─ Phase (referentiel)
                           ├─ ChargeOperationnelle (charges)
                           ├─ EvenementOperationnel (incidents)
                           ├─ Observation (notes)
                           ├─ Horaire (jalons temporels)
                           ├─ ValidationCRV (validation)
                           └─ HistoriqueModification (audit)

Personne (utilisateur)
  ├─ CRV (creePar, responsableVol, verrouillePar)
  ├─ Notification (destinataire)
  ├─ UserActivityLog (utilisateurId)
  └─ AffectationPersonneVol (personne)

Avion (referentiel)
  └─ Vol (avion)

Engin (referentiel)
  └─ AffectationEnginVol (engin)
```

---

## ANNEXE C — CHIFFRES CLES DU SYSTEME

| Indicateur | Valeur |
|------------|--------|
| Collections MongoDB | 23 |
| Services backend | 48+ |
| Endpoints API | 200+ |
| Pages frontend | 28+ |
| Composants Vue | 40+ |
| Stores Pinia | 16 |
| Roles utilisateur | 6 |
| Permissions uniques | 50+ |
| Evenements notifiables | 82 |
| Regles de notification configurables | 492 |
| Types de documents archivables | 3 |
| Phases referentiel | 20+ |
| Types d'engins | 15 |
| Types d'evenements | 8 |
| Niveaux de gravite | 4 |
| Extensions implementees | 9 |
| Jalons horaires par vol | 14 |

---

*Document genere automatiquement a partir de l'analyse exhaustive du code source du systeme CRV.*
*Derniere mise a jour : 2026-03-11*
