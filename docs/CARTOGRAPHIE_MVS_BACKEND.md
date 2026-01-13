# CARTOGRAPHIE METIER BACKEND CRV
## Organisation par MVS (Minimum Viable Systems)

**Document produit le 2026-01-09**
**Objectif** : Cartographie metier pour audit model -> controller -> route -> frontend
**Aucune modification de code effectuee**

---

## MVS 1 - SECURITE & IDENTITE

### A. Role metier du MVS

Ce MVS gere l'authentification, l'autorisation et la tracabilite des utilisateurs du systeme CRV. Il garantit que seules les personnes habilitees accedent aux fonctionnalites selon leur role operationnel (Agent, Chef d'equipe, Superviseur, Manager, Qualite, Admin).

**Responsabilite operationnelle** : Controle d'acces aux operations d'escale et audit des actions utilisateurs.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Authentification (login/logout) | Contenu des CRV |
| Creation de comptes utilisateurs | Affectation personnel aux vols |
| Gestion des mots de passe | Competences metier des agents |
| Controle des roles (RBAC) | Planning des equipes |
| Journalisation des acces | Notifications metier |
| Validation des comptes (EN_ATTENTE -> VALIDE) | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Personne.js`, `UserActivityLog.js` |
| **Controllers** | `auth.controller.js`, `personne.controller.js` |
| **Routes** | `auth.routes.js`, `personne.routes.js` |
| **Middlewares** | `auth.middleware.js`, `auditRequest.middleware.js`, `auditFinalize.middleware.js` |
| **Services** | - |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| POST | `/api/auth/login` | Connexion utilisateur |
| POST | `/api/auth/register` | Creation compte (statut EN_ATTENTE) |
| GET | `/api/auth/me` | Recuperer profil connecte |
| POST | `/api/auth/changer-mot-de-passe` | Modification mot de passe |
| POST | `/api/auth/deconnexion` | Deconnexion |
| GET | `/api/personnes` | Liste utilisateurs (admin) |
| GET | `/api/personnes/stats/global` | Statistiques utilisateurs |
| GET | `/api/personnes/:id` | Detail utilisateur |
| PUT | `/api/personnes/:id` | Modification utilisateur (admin) |
| DELETE | `/api/personnes/:id` | Suppression utilisateur (admin) |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Roles autorises** | AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE, ADMIN |
| **Statuts compte** | EN_ATTENTE -> VALIDE -> SUSPENDU/DESACTIVE |
| **Hash mot de passe** | bcrypt obligatoire (pre-save hook) |
| **JWT** | Token signe avec expiration configurable |
| **Unicite** | matricule et email uniques |
| **Middleware protect** | Toute route protegee exige JWT valide |
| **Middleware authorize** | Controle role minimum requis |
| **excludeQualite** | Certaines actions interdites au role QUALITE |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **Tous les MVS** | <- dependent de | Lecture (authentification/autorisation) |
| **MVS Validation** | <- depend de | Lecture (identite validateur) |
| **MVS CRV** | <- depend de | Lecture (creePar, modifiePar) |

### G. Points sensibles / risques de regression

- **Hash bcrypt** : Ne jamais modifier le pre-save hook de Personne.js
- **Middleware protect** : Toute suppression casserait l'acces a l'ensemble du systeme
- **Enum fonctions** : Modifier les roles impacte tout le RBAC
- **UserActivityLog** : Structure d'audit contractuelle pour tracabilite reglementaire

---

## MVS 2 - CRV (COEUR OPERATIONNEL)

### A. Role metier du MVS

Ce MVS constitue le coeur du systeme. Il gere le cycle de vie complet du Compte-Rendu de Vol : creation, modification, suivi de statut, et archivage. Le CRV est le document central de tracabilite de l'assistance en escale.

**Responsabilite operationnelle** : Production et suivi du document officiel de tracabilite de chaque vol assiste.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Creation/modification CRV | Execution des phases (MVS Phases) |
| Statuts CRV (BROUILLON -> VERROUILLE) | Validation qualite (MVS Validation) |
| Generation numeroCRV unique | Donnees passagers/fret (MVS Charges) |
| Personnel affecte au CRV | Referentiel phases |
| Materiel utilise (liste dans CRV) | Gestion stock engins (MVS Engins) |
| Calcul de completude | Alertes SLA (MVS SLA) |
| Annulation/Reactivation CRV | |
| Archivage Google Drive | |
| Export Excel | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `CRV.js`, `HistoriqueModification.js`, `Observation.js` |
| **Controllers** | `crv.controller.js`, `annulation.controller.js`, `crvArchivage.controller.js` |
| **Routes** | `crv.routes.js` |
| **Services** | `crv.service.js`, `annulation.service.js`, `crvArchivageService.js`, `pdfService.js`, `googleDriveService.js` |
| **Middlewares** | `auditLog.middleware.js` |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| POST | `/api/crv` | Creer un CRV |
| GET | `/api/crv` | Lister CRVs (pagine, filtre) |
| GET | `/api/crv/search` | Recherche avancee |
| GET | `/api/crv/stats` | Statistiques globales |
| GET | `/api/crv/export` | Export Excel |
| GET | `/api/crv/annules` | Liste CRV annules |
| GET | `/api/crv/statistiques/annulations` | Stats annulations |
| GET | `/api/crv/:id` | Detail CRV |
| GET | `/api/crv/:id/transitions` | Transitions possibles |
| PATCH | `/api/crv/:id` | Mise a jour CRV |
| DELETE | `/api/crv/:id` | Suppression CRV |
| POST | `/api/crv/:id/annuler` | Annuler CRV |
| POST | `/api/crv/:id/reactiver` | Reactiver CRV annule |
| GET | `/api/crv/:id/archivage/status` | Etat archivage |
| POST | `/api/crv/:id/archiver` | Archiver vers Drive |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Statuts CRV** | BROUILLON -> EN_COURS -> TERMINE -> VALIDE -> VERROUILLE / ANNULE |
| **numeroCRV** | Format unique genere automatiquement |
| **Unicite** | Un seul CRV par couple vol+escale |
| **Completude** | Calculee automatiquement (%) |
| **Annulation** | Conserve ancienStatut, raisonAnnulation obligatoire |
| **Verrouillage** | CRV VERROUILLE = lecture seule |
| **Archivage** | Conversion PDF + upload Drive |
| **Audit** | Toute modification loggee (HistoriqueModification) |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS Securite** | -> depend de | Lecture (creePar, modifiePar) |
| **MVS Vols** | -> depend de | Lecture (reference vol) |
| **MVS Phases** | <- depend de | Lecture/Ecriture (chronologie phases) |
| **MVS Charges** | <- depend de | Lecture/Ecriture (donnees operationnelles) |
| **MVS Validation** | <- depend de | Ecriture (transition vers VALIDE) |
| **MVS Engins** | <- depend de | Lecture (materiel utilise) |
| **MVS SLA** | <- depend de | Lecture (surveillance) |

### G. Points sensibles / risques de regression

- **numeroCRV** : Format et unicite contractuels
- **Statuts** : Machine a etats critique - toute modification casse le workflow
- **Index vol+escale** : Unicite metier obligatoire
- **HistoriqueModification** : Tracabilite reglementaire
- **Archivage Drive** : Integration externe critique

---

## MVS 3 - PHASES OPERATIONNELLES

### A. Role metier du MVS

Ce MVS gere l'execution chronologique des operations d'assistance au sol. Chaque phase represente une etape operationnelle (debarquement, avitaillement, nettoyage, etc.) avec ses horaires prevus et reels.

**Responsabilite operationnelle** : Suivi temps reel de l'avancement des operations d'escale et calcul des ecarts.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Referentiel des phases (catalogue) | Completude globale CRV |
| Chronologie d'execution par CRV | Validation finale |
| Horaires prevus/reels | Affectation personnel |
| Calcul durees et ecarts | Alertes SLA |
| Statuts phase (NON_COMMENCE -> TERMINE) | |
| Motifs de non-realisation | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Phase.js` (referentiel), `ChronologiePhase.js` (execution), `Horaire.js` |
| **Controllers** | `phase.controller.js` |
| **Routes** | `phase.routes.js` |
| **Services** | `phase.service.js`, `calcul.service.js` |
| **Middlewares** | `businessRules.middleware.js` (verifierCoherencePhaseTypeOperation) |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/phases` | Lister phases referentielles |
| GET | `/api/phases/:id` | Detail phase |
| POST | `/api/phases/:id/demarrer` | Demarrer une phase (heureDebutReelle) |
| POST | `/api/phases/:id/terminer` | Terminer une phase (heureFinReelle) |
| POST | `/api/phases/:id/non-realise` | Marquer phase non realisee |
| PATCH | `/api/phases/:id` | Mise a jour phase |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Types operation** | ARRIVEE, DEPART, TURN_AROUND, COMMUN |
| **Categories** | PISTE, PASSAGERS, FRET, BAGAGE, TECHNIQUE, AVITAILLEMENT, NETTOYAGE, SECURITE, BRIEFING |
| **Macro-phases** | DEBUT, REALISATION, FIN (ajout 2026-01-11) |
| **Statuts phase** | NON_COMMENCE -> EN_COURS -> TERMINE / NON_REALISE / ANNULE |
| **Motifs non-realisation** | NON_NECESSAIRE, EQUIPEMENT_INDISPONIBLE, PERSONNEL_ABSENT, CONDITIONS_METEO, AUTRE |
| **Calcul ecarts** | ecartMinutes = heureFinReelle - heureFinPrevue |
| **Phase non realisee** | Durees automatiquement nullifiees |
| **Coherence typeOperation** | Phases filtrees selon type vol (middleware) |
| **Ordre phases** | Sequencage par champ `ordre` |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | -> depend de | Lecture (reference CRV parent) |
| **MVS Vols** | -> depend de | Lecture (typeOperation du vol) |
| **MVS SLA** | <- depend de | Lecture (durees pour calcul SLA) |
| **MVS Validation** | <- depend de | Lecture (completude phases) |

### G. Points sensibles / risques de regression

- **Phase.js** : Referentiel seede - ne jamais modifier les codes existants
- **Calcul ecarts** : Logique pre-save dans ChronologiePhase.js
- **verifierCoherencePhaseTypeOperation** : Regle metier critique
- **Index crv+phase** : Unicite obligatoire

### H. Phases ARRIVEE (Referentiel 2026-01-11)

| Ordre | Code | Libelle | MacroPhase | Obligatoire |
|-------|------|---------|------------|-------------|
| 1 | ARR_BRIEFING | Briefing equipes | DEBUT | Oui |
| 2 | ARR_ARRIVEE_AVION | Arrivee avion | DEBUT | Oui |
| 3 | ARR_OUVERTURE_SOUTES | Ouverture des soutes | REALISATION | Oui |
| 4 | ARR_DECHARGEMENT | Dechargement | REALISATION | Oui |
| 5 | ARR_LIVRAISON_BAGAGES | Livraison bagages | REALISATION | Oui |
| 6 | ARR_DEBARQUEMENT_PAX | Debarquement passagers | REALISATION | Oui |
| 7 | ARR_MISE_CONDITION_CABINE | Mise en condition cabine | FIN | Non |
| 8 | ARR_DEBRIEFING | Debriefing cloture | FIN | Non |

---

## MVS 4 - CHARGES & TRAFIC

### A. Role metier du MVS

Ce MVS gere les donnees de trafic operationnel : passagers (comptages, categories, besoins speciaux), bagages et fret (dont matieres dangereuses). Ces donnees alimentent la completude du CRV.

**Responsabilite operationnelle** : Saisie et controle des donnees de charge pour facturation et conformite reglementaire.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Comptage passagers (basique et detaille) | Identite des passagers |
| Categories PMR | Embarquement/debarquement |
| Classes de voyage | Phases operationnelles |
| Besoins medicaux | Validation CRV |
| Mineurs non accompagnes | |
| Bagages (soute/cabine) | |
| Fret (poids, types, categories) | |
| Matieres dangereuses (code ONU) | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `ChargeOperationnelle.js` |
| **Controllers** | `passager.controller.js`, `fret.controller.js` |
| **Routes** | `charge.routes.js` |
| **Services** | `passager.service.js`, `fret.service.js` |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| PUT | `/api/charges/:id/categories-detaillees` | MAJ categories passagers detaillees |
| PUT | `/api/charges/:id/classes` | MAJ classes de voyage |
| PUT | `/api/charges/:id/besoins-medicaux` | MAJ besoins medicaux |
| PUT | `/api/charges/:id/mineurs` | MAJ mineurs non accompagnes |
| PUT | `/api/charges/:id/fret-detaille` | MAJ fret detaille |
| POST | `/api/charges/:id/convertir-categories-detaillees` | Migration donnees legacy |
| POST | `/api/charges/:id/marchandises-dangereuses` | Ajouter matiere dangereuse |
| DELETE | `/api/charges/:id/marchandises-dangereuses/:marchandiseId` | Retirer matiere dangereuse |
| GET | `/api/charges/statistiques/passagers` | Stats globales passagers |
| GET | `/api/charges/crv/:crvId/statistiques-passagers` | Stats passagers par CRV |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Null vs 0** | null = non saisi, 0 = valeur zero explicite |
| **Categories detaillees** | Extension 4 (bebes, enfants, PMR detailles, VIP, equipage, deportes) |
| **Classes** | premiere, affaires, economique |
| **PMR detailles** | fauteuilRoulant, marcheAssistee, nonVoyant, sourd |
| **Fret detaille** | Extension 5 (postal, express, perissables, animaux, vehicules) |
| **Matieres dangereuses** | Code ONU obligatoire, validation DGR |
| **Virtuals** | totalPassagers, totalBagages calcules automatiquement |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | -> depend de | Lecture (reference CRV parent) |
| **MVS Validation** | <- depend de | Lecture (donnees pour completude) |
| **MVS SLA** | <- depend de | Lecture (metriques operationnelles) |

### G. Points sensibles / risques de regression

- **Distinction null/0** : Semantique metier critique
- **Code ONU** : Validation reglementaire matieres dangereuses
- **Virtuals** : Calculs automatiques utilises par frontend
- **Extensions 4 et 5** : Structures imbriquees complexes

---

## MVS 5 - RESSOURCES SOL (ENGINS)

### A. Role metier du MVS

Ce MVS gere le parc d'equipements de piste : tracteurs, chariots, GPU, passerelles, etc. Il permet le suivi de disponibilite, maintenance et affectation aux operations.

**Responsabilite operationnelle** : Gestion du materiel d'assistance et tracabilite de son utilisation.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Catalogue engins | Maintenance detaillee |
| Statut disponibilite | Planning preventif |
| Affectation engin -> CRV | Couts d'exploitation |
| Types d'engins | Geolocalisation |
| Dates revision | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Engin.js`, `AffectationEnginVol.js` |
| **Controllers** | `engin.controller.js` |
| **Routes** | `engin.routes.js` |
| **Services** | - |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/engins` | Lister tous les engins |
| GET | `/api/engins/types` | Enumeration types d'engins |
| GET | `/api/engins/disponibles` | Engins disponibles uniquement |
| GET | `/api/engins/:id` | Detail engin |
| GET | `/api/engins/:id/affectations` | Affectations d'un engin |
| POST | `/api/engins` | Creer engin |
| PUT | `/api/engins/:id` | Modifier engin |
| DELETE | `/api/engins/:id` | Supprimer engin |
| GET | `/api/engins/volId/affectations` | Engins affectes a un vol |
| POST | `/api/engins/crv/:crvId/ajouter` | Ajouter engin au CRV |
| PUT | `/api/engins/crv/:crvId/mettre-a-jour-affectations` | MAJ affectations CRV |
| DELETE | `/api/engins/crv/:crvId/retirer/:enginId` | Retirer engin du CRV |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Types engins** | TRACTEUR, CHARIOT_BAGAGES, CHARIOT_FRET, GPU, ASU, STAIRS, CONVOYEUR, AUTRE |
| **Statuts** | DISPONIBLE, EN_SERVICE, MAINTENANCE, PANNE, HORS_SERVICE |
| **Unicite** | numeroEngin unique |
| **Usages** | TRACTAGE, BAGAGES, FRET, ALIMENTATION_ELECTRIQUE, CLIMATISATION, PASSERELLE, CHARGEMENT |
| **Affectation** | Un engin peut etre affecte a plusieurs CRV (horaires distincts) |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | <- depend de | Ecriture (materiel utilise dans CRV) |
| **MVS Vols** | -> depend de | Lecture (affectation par vol) |

### G. Points sensibles / risques de regression

- **numeroEngin** : Unicite obligatoire
- **Enum typeEngin/statut** : Utilises par frontend
- **Index numeroEngin, typeEngin, statut** : Performance requetes

---

## MVS 6 - VOLS & PROGRAMMES

### A. Role metier du MVS

Ce MVS gere les vols (arrivees, departs, turn-around) et les programmes de vols saisonniers. Un vol peut etre lie a un programme recurrent ou marque hors-programme.

**Responsabilite operationnelle** : Referencement des vols a assister et planification saisonniere.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Creation/modification vols | Assistance au sol (CRV) |
| Type operation (ARRIVEE/DEPART/TURN_AROUND) | Execution phases |
| Lien vol <-> programme saisonnier | Charges passagers/fret |
| Vols hors programme | Validation |
| Programmes saisonniers (recurrence) | |
| Import batch programmes | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Vol.js`, `ProgrammeVolSaisonnier.js` |
| **Controllers** | `vol.controller.js`, `programmeVol.controller.js`, `volProgramme.controller.js` |
| **Routes** | `vol.routes.js`, `programmeVol.routes.js` |
| **Services** | `vol.service.js`, `programmeVol.service.js` |

### D. Routes exposees

**Routes Vols :**

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/vols` | Lister vols |
| GET | `/api/vols/:id` | Detail vol |
| POST | `/api/vols` | Creer vol |
| PATCH | `/api/vols/:id` | Modifier vol |
| GET | `/api/vols/:id/suggerer-programmes` | Suggestions programmes |
| POST | `/api/vols/:id/lier-programme` | Lier a un programme |
| POST | `/api/vols/:id/marquer-hors-programme` | Marquer hors programme |
| POST | `/api/vols/:id/detacher-programme` | Detacher du programme |
| GET | `/api/vols/programme/:programmeVolId` | Vols d'un programme |
| GET | `/api/vols/hors-programme` | Vols hors programme |

**Routes Programmes :**

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/programmes-vol` | Lister programmes |
| GET | `/api/programmes-vol/:id` | Detail programme |
| GET | `/api/programmes-vol/applicables/:date` | Programmes pour une date |
| POST | `/api/programmes-vol` | Creer programme |
| PATCH | `/api/programmes-vol/:id` | Modifier programme |
| DELETE | `/api/programmes-vol/:id` | Supprimer programme |
| POST | `/api/programmes-vol/:id/valider` | Valider programme |
| POST | `/api/programmes-vol/:id/activer` | Activer programme |
| POST | `/api/programmes-vol/:id/suspendre` | Suspendre programme |
| POST | `/api/programmes-vol/import` | Import batch |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Types operation** | ARRIVEE, DEPART, TURN_AROUND |
| **Deduction typeOperation** | Automatique selon horaires (Extension 2) |
| **Unicite vol** | numeroVol + dateVol unique |
| **Statuts programme** | BROUILLON -> VALIDE -> ACTIF -> SUSPENDU/TERMINE |
| **Recurrence** | QUOTIDIEN, HEBDOMADAIRE, BIMENSUEL, MENSUEL |
| **Jours semaine** | Array pour recurrence hebdomadaire |
| **Methodes programme** | estActifPourDate(), appliqueAuJour() |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | <- depend de | Lecture (vol reference par CRV) |
| **MVS Phases** | <- depend de | Lecture (typeOperation pour filtrer phases) |
| **MVS Referentiels** | -> depend de | Lecture (avion, compagnie) |

### G. Points sensibles / risques de regression

- **Index numeroVol+dateVol** : Unicite metier
- **Deduction typeOperation** : Logique automatique Extension 2
- **Methodes estActifPourDate/appliqueAuJour** : Calculs recurrence
- **Liaison horsProgramme** : Champs Extension 2 dans Vol.js

---

## MVS 7 - VALIDATION & QUALITE

### A. Role metier du MVS

Ce MVS gere le processus de validation des CRV par les responsables qualite ou management. Il inclut le calcul de conformite SLA, le verrouillage definitif et le suivi des anomalies.

**Responsabilite operationnelle** : Controle qualite et conformite des CRV avant cloture.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Validation CRV | Creation/modification CRV |
| Score de completude | Execution phases |
| Conformite SLA | Saisie charges |
| Anomalies detectees | Alertes temps reel (MVS SLA) |
| Verrouillage/Deverrouillage | |
| Commentaires validation | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `ValidationCRV.js` |
| **Controllers** | `validation.controller.js` |
| **Routes** | `validation.routes.js` |
| **Services** | `validation.service.js` |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/validation/:id` | Etat validation d'un CRV |
| POST | `/api/validation/:id/valider` | Valider un CRV |
| POST | `/api/validation/:id/verrouiller` | Verrouiller definitivement |
| POST | `/api/validation/:id/deverrouiller` | Deverrouiller (admin) |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Statuts validation** | EN_ATTENTE -> VALIDE / INVALIDE / EN_ATTENTE_CORRECTION |
| **Unicite** | Une seule validation par CRV (crv unique) |
| **scoreCompletude** | Calcule automatiquement (%) |
| **conformiteSLA** | Boolean global |
| **ecartsSLA** | Liste des ecarts detectes |
| **anomaliesDetectees** | Liste des anomalies |
| **Verrouillage** | verrouille=true -> CRV en lecture seule |
| **Permissions** | SUPERVISEUR, MANAGER, QUALITE peuvent valider |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | -> depend de | Lecture/Ecriture (transition statut CRV) |
| **MVS Securite** | -> depend de | Lecture (validePar) |
| **MVS Phases** | -> depend de | Lecture (donnees chronologie) |
| **MVS Charges** | -> depend de | Lecture (donnees operationnelles) |
| **MVS SLA** | -> depend de | Lecture (calcul conformite) |

### G. Points sensibles / risques de regression

- **Index crv unique** : Un seul enregistrement validation par CRV
- **Verrouillage** : Irreversible sauf admin
- **scoreCompletude** : Formule de calcul contractuelle
- **Transition VALIDE** : Declenche passage CRV en VALIDE

---

## MVS 8 - NOTIFICATIONS & SLA

### A. Role metier du MVS

Ce MVS gere les alertes proactives (depassements SLA, retards) et les notifications in-app aux utilisateurs. Il surveille en temps reel les operations et alerte les responsables.

**Responsabilite operationnelle** : Detection precoce des derives operationnelles et communication aux equipes.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Notifications in-app | Validation CRV |
| Alertes SLA | Execution phases |
| Configuration seuils SLA | Contenu CRV |
| Rapports SLA | |
| Surveillance CRV/Phases | |
| Multi-canaux (email, SMS, push, in-app) | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Notification.js` |
| **Controllers** | `notification.controller.js`, `alerteSLA.controller.js` |
| **Routes** | `notification.routes.js`, `alerteSLA.routes.js` |
| **Services** | `notification.service.js`, `alerteSLA.service.js` |

### D. Routes exposees

**Routes Notifications :**

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/notifications` | Mes notifications |
| GET | `/api/notifications/count-non-lues` | Compter non lues |
| GET | `/api/notifications/statistiques` | Stats notifications |
| POST | `/api/notifications` | Creer notification (admin/manager) |
| PATCH | `/api/notifications/:id/lire` | Marquer comme lue |
| PATCH | `/api/notifications/:id/archiver` | Archiver |
| PATCH | `/api/notifications/lire-toutes` | Marquer toutes lues |
| DELETE | `/api/notifications/:id` | Supprimer |

**Routes SLA :**

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/sla` | Liste alertes SLA |
| GET | `/api/sla/crv/:id` | Verifier SLA d'un CRV |
| GET | `/api/sla/phase/:id` | Verifier SLA d'une phase |
| GET | `/api/sla/configuration` | Configuration SLA |
| GET | `/api/sla/rapport` | Rapport SLA |
| PUT | `/api/sla/configuration` | Configurer SLA |
| POST | `/api/sla/surveiller/crv` | Activer surveillance CRV |
| POST | `/api/sla/surveiller/phases` | Activer surveillance phases |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Types notification** | INFO, WARNING, ERROR, SUCCESS, ALERTE_SLA |
| **Priorites** | BASSE, NORMALE, HAUTE, URGENTE |
| **Sources** | SYSTEME, ADMIN, ALERTE_SLA, WORKFLOW, VALIDATION, AUTRE |
| **Canaux** | email, sms, push, inApp |
| **Expiration** | Date d'expiration automatique |
| **Seuils SLA** | Configurables par compagnie/type operation |
| **Conformite SLA** | Calcul automatique ecarts vs seuils |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS CRV** | -> depend de | Lecture (surveillance CRV) |
| **MVS Phases** | -> depend de | Lecture (surveillance phases) |
| **MVS Securite** | -> depend de | Lecture (destinataire notification) |
| **MVS Validation** | <- depend de | Ecriture (alimente conformiteSLA) |

### G. Points sensibles / risques de regression

- **Extension 7** : Structure Notification.js complexe
- **Extension 8** : Logique alerteSLA.service.js
- **Index destinataire+lu** : Performance requetes
- **Expiration** : Virtual estExpiree

---

## MVS 9 - REFERENTIELS (PERSONNES, AVIONS, ENUMS)

### A. Role metier du MVS

Ce MVS gere les donnees de reference du systeme : configuration des avions (capacites, equipements, versions), et les enumerations metier partagees.

**Responsabilite operationnelle** : Maintien des referentiels techniques et operationnels.

### B. Perimetre fonctionnel

| Ce que le MVS gere | Ce qu'il ne gere PAS |
|---|---|
| Configuration avions | Affectation avion aux vols |
| Versions configuration | Assistance au sol |
| Historique revisions | CRV |
| Capacites (passagers, fret) | |
| Equipements avion | |
| Comparaison versions | |

### C. Fichiers backend concernes

| Type | Fichiers |
|---|---|
| **Modeles** | `Avion.js` |
| **Controllers** | `avionConfiguration.controller.js` |
| **Routes** | `avion.routes.js` |
| **Services** | `avion.service.js` |
| **Utilitaires** | `seedPhases.js`, `seedAdmin.js` |

### D. Routes exposees

| Methode | Endpoint | Finalite metier |
|---|---|---|
| GET | `/api/avions` | Lister avions |
| GET | `/api/avions/:id` | Detail avion |
| GET | `/api/avions/:id/versions` | Historique versions |
| GET | `/api/avions/:id/versions/:numeroVersion` | Detail version |
| GET | `/api/avions/:id/versions/comparer` | Comparer versions |
| GET | `/api/avions/statistiques/configurations` | Stats configurations |
| GET | `/api/avions/revisions/prochaines` | Revisions a venir |
| POST | `/api/avions` | Creer avion |
| POST | `/api/avions/:id/versions` | Creer nouvelle version |
| PUT | `/api/avions/:id/configuration` | Modifier configuration |
| PATCH | `/api/avions/:id` | Modifier avion |
| DELETE | `/api/avions/:id` | Supprimer avion |

### E. Regles metier portees

| Regle | Description |
|---|---|
| **Unicite** | immatriculation unique |
| **Types avion** | Libre (string) |
| **Statuts** | ACTIF, INACTIF, MAINTENANCE |
| **Extension 3** | version, configuration detaillee, historiqueVersions |
| **Configuration** | sieges, equipements, moteurs, caracteristiques |
| **Revisions** | derniereRevision, prochaineRevision |
| **Versioning** | Historique complet des configurations |

### F. Dependances inter-MVS

| Dependance | Sens | Nature |
|---|---|---|
| **MVS Vols** | <- depend de | Lecture (reference avion dans vol) |
| **MVS CRV** | <- depend de | Lecture (info avion dans CRV) |

### G. Points sensibles / risques de regression

- **Index immatriculation** : Unicite obligatoire
- **Extension 3** : Structure configuration imbriquee
- **historiqueVersions** : Tracabilite versions
- **Comparaison versions** : Logique diff

---

# SYNTHESE GLOBALE

## Matrice des dependances inter-MVS

```
                  Securite  CRV  Phases  Charges  Engins  Vols  Valid.  Notif/SLA  Refer.
Securite             -       ->     ->      ->      ->     ->     ->       ->        ->
CRV                  <-       -     <->     <->     <-     <-     <->      <-        <-
Phases               <-      <->     -       -       -     <-     <-       <-         -
Charges              <-      <->     -       -       -      -     <-       <-         -
Engins               <-       ->     -       -       -     <-      -        -         -
Vols                 <-       ->    ->       -      ->      -      -        -        <-
Validation           <-      <->    ->      ->       -      -      -       ->         -
Notif/SLA            <-       ->    ->       -       -      -     <-        -         -
Referentiels         <-       ->     -       -       -     ->      -        -         -

Legende: -> depend de | <- est dependance de | <-> bidirectionnel | - aucune
```

## Repartition des fichiers par MVS

| MVS | Modeles | Controllers | Routes | Services |
|---|---|---|---|---|
| Securite & Identite | 2 | 2 | 2 | 0 |
| CRV (Coeur) | 3 | 3 | 1 | 5 |
| Phases Operationnelles | 3 | 1 | 1 | 2 |
| Charges & Trafic | 1 | 2 | 1 | 2 |
| Ressources Sol | 2 | 1 | 1 | 0 |
| Vols & Programmes | 2 | 3 | 2 | 2 |
| Validation & Qualite | 1 | 1 | 1 | 1 |
| Notifications & SLA | 1 | 2 | 2 | 2 |
| Referentiels | 1 | 1 | 1 | 1 |
| **TOTAL** | **16** | **16** | **12** | **15** |

---

## Modeles additionnels (non classes dans un MVS unique)

Ces modeles sont utilises transversalement ou representent des entites de liaison :

| Modele | Utilisation |
|---|---|
| `EvenementOperationnel.js` | Incidents/evenements lies aux CRV (transversal CRV/Phases) |
| `AffectationPersonneVol.js` | Liaison personnel-vol (transversal Securite/Vols) |

---

**Objectif du document** :
> "Ou vit chaque responsabilite metier du backend CRV, et pourquoi elle est a cet endroit precis ?"

Ce document repond a cette question en fournissant une cartographie complete, tracable et auditable du backend CRV, organisee par domaines metiers (MVS).
