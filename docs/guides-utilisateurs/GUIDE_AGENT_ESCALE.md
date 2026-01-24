# GUIDE UTILISATEUR - AGENT D'ESCALE

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : AGENT_ESCALE
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes **Agent d'Escale**, le coeur operationnel de l'assistance en escale. Votre role principal est de :

- Saisir les Comptes Rendus de Vol (CRV) en temps reel
- Documenter tout ce qui se passe pendant l'escale d'un avion
- Enregistrer les charges (passagers, bagages, fret)
- Signaler les evenements et incidents
- Assurer la tracabilite des operations

**Vous etes sur le terrain.** C'est vous qui voyez ce qui se passe reellement et qui le documentez.

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Se connecter / Gerer son profil | OUI |
| Consulter les programmes de vol | OUI |
| Creer et modifier des programmes | OUI |
| Consulter les bulletins de mouvement | OUI |
| Creer et modifier des bulletins | OUI |
| Creer et modifier des CRV | OUI |
| Valider et verrouiller des CRV | OUI |
| Annuler et reactiver des CRV | OUI |
| Exporter des CRV en PDF/Excel | OUI |
| Consulter les engins | OUI |
| Creer/Modifier des engins | NON |
| Gerer les utilisateurs | NON |
| Configurer les SLA | NON |

---

## PARTIE 1 : CONNEXION ET PROFIL

### 1.1 Se connecter a l'application

**Qu'est-ce que c'est ?**
La connexion vous permet d'acceder a l'application de maniere securisee. Chaque action que vous faites est enregistree sous votre nom.

**Comment faire ?**

1. Ouvrez l'application
2. Entrez votre **email professionnel**
3. Entrez votre **mot de passe**
4. Cliquez sur "Connexion"

**Ce qui se passe en coulisses :**
```
POST /api/auth/login
Body: { "email": "votre.email@company.com", "password": "votre_mot_de_passe" }
```

**Resultat attendu :**
- Vous recevez un "jeton" (token) qui prouve votre identite
- Ce jeton est valable pendant **3 heures**
- Apres 3 heures, vous devrez vous reconnecter

**En cas d'erreur :**
| Message | Signification | Solution |
|---------|---------------|----------|
| "Identifiants invalides" | Email ou mot de passe incorrect | Verifiez votre saisie |
| "Compte inactif" | Votre compte est desactive | Contactez votre manager |

---

### 1.2 Consulter votre profil

**Qu'est-ce que c'est ?**
Votre profil contient toutes vos informations : nom, prenom, matricule, specialites, etc.

**Comment faire ?**

1. Cliquez sur votre nom en haut a droite
2. Selectionnez "Mon profil"

**Ce qui se passe en coulisses :**
```
GET /api/auth/me
```

**Informations affichees :**
- Nom et prenom
- Matricule (ex: AGE0001)
- Email
- Fonction (AGENT_ESCALE)
- Specialites (PISTE, PASSAGERS, FRET, etc.)
- Statut (ACTIF, ABSENT, CONGE)
- Date d'embauche

---

### 1.3 Changer votre mot de passe

**Qu'est-ce que c'est ?**
Pour des raisons de securite, vous pouvez (et devriez) changer regulierement votre mot de passe.

**Comment faire ?**

1. Allez dans "Mon profil"
2. Cliquez sur "Changer le mot de passe"
3. Entrez votre **ancien mot de passe** (pour prouver que c'est bien vous)
4. Entrez votre **nouveau mot de passe** (minimum 6 caracteres)
5. Confirmez le nouveau mot de passe
6. Cliquez sur "Enregistrer"

**Ce qui se passe en coulisses :**
```
POST /api/auth/changer-mot-de-passe
Body: {
  "ancienMotDePasse": "votre_ancien_mdp",
  "nouveauMotDePasse": "votre_nouveau_mdp"
}
```

**Conseils securite :**
- Utilisez au moins 6 caracteres
- Melangez lettres, chiffres et symboles
- Ne partagez jamais votre mot de passe

---

## PARTIE 2 : PROGRAMMES DE VOL

### 2.1 Qu'est-ce qu'un Programme de Vol ?

**Definition simple :**
Un Programme de Vol est comme un **calendrier des vols prevus sur 6 mois**. Il contient tous les vols reguliers qui vont operer pendant une saison (hiver ou ete).

**Exemple concret :**
- Programme "HIVER_2025_2026"
- Du 17 decembre 2025 au 28 mars 2026
- Contient 45 vols reguliers (ET939, AF946, TK123, etc.)

**Hierarchie a comprendre :**
```
Programme de Vol (6 mois)
    |
    +-- Bulletin de Mouvement (3-4 jours)
            |
            +-- CRV (ce que vous remplissez en temps reel)
```

---

### 2.2 Consulter les programmes

**Comment faire ?**

1. Allez dans le menu "Programmes"
2. Vous voyez la liste de tous les programmes

**Ce qui se passe en coulisses :**
```
GET /api/programmes-vol
```

**Informations affichees pour chaque programme :**
- Nom (ex: HIVER_2025_2026)
- Dates de debut et fin
- Statut (BROUILLON, VALIDE, ACTIF, etc.)
- Nombre de vols
- Compagnies concernees

**Filtres disponibles :**
- Par statut
- Par nom
- Actif uniquement

---

### 2.3 Voir le programme actif

**Qu'est-ce que c'est ?**
Le programme "actif" est celui qui est en cours d'utilisation. **Il ne peut y avoir qu'un seul programme actif a la fois.**

**Comment faire ?**

1. Allez dans "Programmes"
2. Le programme actif est mis en evidence (generalement en vert)

**Ce qui se passe en coulisses :**
```
GET /api/programmes-vol/actif
```

---

### 2.4 Consulter les statistiques d'un programme

**Qu'est-ce que c'est ?**
Les statistiques vous montrent un resume du programme : combien de vols, quelles compagnies, quels jours sont les plus charges, etc.

**Comment faire ?**

1. Ouvrez un programme
2. Cliquez sur "Statistiques"

**Ce qui se passe en coulisses :**
```
GET /api/programmes-vol/:id/statistiques
```

**Informations affichees :**
- Nombre total de vols
- Repartition par compagnie (ET: 20, AF: 15, TK: 10)
- Repartition par jour de la semaine
- Repartition par categorie (International, Regional, Cargo)

---

### 2.5 Creer un nouveau programme

**Quand le faire ?**
Au debut de chaque nouvelle saison (hiver ou ete), un nouveau programme doit etre cree.

**Comment faire ?**

1. Allez dans "Programmes"
2. Cliquez sur "Nouveau programme"
3. Remplissez les informations :
   - **Nom** : Ex: "ETE_2026" (sera automatiquement en majuscules)
   - **Date de debut** : Premier jour du programme
   - **Date de fin** : Dernier jour du programme
   - **Edition** : Ex: "N01/01-avr.-26" (optionnel)
   - **Description** : Notes sur ce programme (optionnel)
4. Cliquez sur "Creer"

**Ce qui se passe en coulisses :**
```
POST /api/programmes-vol
Body: {
  "nom": "ETE_2026",
  "dateDebut": "2026-04-01",
  "dateFin": "2026-10-31",
  "edition": "N01/01-avr.-26",
  "description": "Programme ete 2026"
}
```

**Resultat :**
- Le programme est cree avec le statut **BROUILLON**
- Il n'est pas encore actif
- Vous pouvez maintenant y ajouter des vols

---

### 2.6 Ajouter des vols a un programme

**Qu'est-ce que c'est ?**
Un vol dans le programme represente un vol **regulier** qui opere certains jours de la semaine.

**Exemple concret :**
Le vol ET939 opere tous les lundis, mercredis et vendredis :
- Arrive d'Addis-Abeba a 12h10
- Repart vers Addis-Abeba a 14h05

**Comment faire ?**

1. Ouvrez le programme
2. Cliquez sur "Ajouter un vol"
3. Remplissez les informations :
   - **Numero de vol** : Ex: "ET939"
   - **Jours de la semaine** : Cochez les jours (Lun, Mer, Ven)
   - **Type d'avion** : Ex: "B737-800"
   - **Version** : Ex: "16C138Y" (configuration sieges)
   - **Provenance** : Ex: "ADD" (Addis-Abeba)
   - **Heure d'arrivee** : Ex: "12:10"
   - **Destination** : Ex: "ADD"
   - **Heure de depart** : Ex: "14:05"
4. Cliquez sur "Ajouter"

**Ce qui se passe en coulisses :**
```
POST /api/programmes-vol/:programmeId/vols
Body: {
  "numeroVol": "ET939",
  "joursSemaine": [1, 3, 5],
  "typeAvion": "B737-800",
  "version": "16C138Y",
  "provenance": "ADD",
  "heureArrivee": "12:10",
  "destination": "ADD",
  "heureDepart": "14:05",
  "categorieVol": "INTERNATIONAL"
}
```

**Jours de la semaine (codes) :**
| Code | Jour |
|------|------|
| 0 | Dimanche |
| 1 | Lundi |
| 2 | Mardi |
| 3 | Mercredi |
| 4 | Jeudi |
| 5 | Vendredi |
| 6 | Samedi |

---

### 2.7 Valider un programme

**Qu'est-ce que c'est ?**
La validation confirme que le programme est complet et pret a etre utilise.

**Conditions requises :**
- Le programme doit etre en BROUILLON
- Il doit contenir **au moins 1 vol**

**Comment faire ?**

1. Ouvrez le programme
2. Verifiez que tous les vols sont corrects
3. Cliquez sur "Valider"

**Ce qui se passe en coulisses :**
```
POST /api/programmes-vol/:id/valider
```

**Resultat :**
- Le statut passe de BROUILLON a **VALIDE**
- Votre nom et la date sont enregistres comme validateur

---

### 2.8 Activer un programme

**Qu'est-ce que c'est ?**
L'activation met le programme "en service". C'est ce programme qui sera utilise pour creer les bulletins et les CRV.

**Important :**
- **Un seul programme peut etre actif a la fois**
- L'ancien programme actif sera automatiquement desactive

**Comment faire ?**

1. Ouvrez un programme VALIDE
2. Cliquez sur "Activer"
3. Confirmez l'action

**Ce qui se passe en coulisses :**
```
POST /api/programmes-vol/:id/activer
```

---

### 2.9 Dupliquer un programme

**Quand le faire ?**
Quand vous voulez creer un nouveau programme base sur un existant (ex: le programme ete est souvent similaire d'une annee a l'autre).

**Comment faire ?**

1. Ouvrez le programme a dupliquer
2. Cliquez sur "Dupliquer"
3. Donnez un nouveau nom et de nouvelles dates
4. Cliquez sur "Dupliquer"

**Ce qui se passe en coulisses :**
```
POST /api/programmes-vol/:id/dupliquer
Body: {
  "nom": "ETE_2027",
  "dateDebut": "2027-04-01",
  "dateFin": "2027-10-31"
}
```

**Resultat :**
- Un nouveau programme est cree en BROUILLON
- Tous les vols sont copies avec les memes horaires
- Vous pouvez ensuite modifier les vols individuellement

---

## PARTIE 3 : BULLETINS DE MOUVEMENT

### 3.1 Qu'est-ce qu'un Bulletin de Mouvement ?

**Definition simple :**
Un Bulletin de Mouvement est comme un **planning des vols pour les 3-4 prochains jours**. C'est un document previsionnel qui annonce quels vols vont operer.

**Difference avec le Programme :**
- Le **Programme** = ce qui est prevu sur 6 mois (theorie)
- Le **Bulletin** = ce qui va vraiment se passer cette semaine (pratique)

**Exemple concret :**
- Bulletin "BM-NIM-20260115"
- Du 15 au 18 janvier 2026
- Escale : Niamey (NIM)
- 12 mouvements prevus

---

### 3.2 Consulter les bulletins

**Comment faire ?**

1. Allez dans le menu "Bulletins"
2. Filtrez par escale si necessaire

**Ce qui se passe en coulisses :**
```
GET /api/bulletins
```

**Filtres disponibles :**
- Par escale (NIM, etc.)
- Par statut (BROUILLON, PUBLIE, ARCHIVE)
- Par periode

---

### 3.3 Creer un bulletin depuis le programme

**C'est la methode recommandee !**

**Comment faire ?**

1. Allez dans "Bulletins"
2. Cliquez sur "Nouveau bulletin depuis programme"
3. Selectionnez :
   - **Escale** : Votre escale (ex: NIM)
   - **Date de debut** : Premier jour du bulletin
   - **Date de fin** : Dernier jour (3-4 jours apres)
4. Cliquez sur "Creer"

**Ce qui se passe en coulisses :**
```
POST /api/bulletins/depuis-programme
Body: {
  "escale": "NIM",
  "dateDebut": "2026-01-15",
  "dateFin": "2026-01-18",
  "programmeId": "..."
}
```

**Resultat :**
- Le bulletin est cree avec tous les vols prevus pour cette periode
- Les vols sont automatiquement importes du programme actif
- Vous pouvez ensuite ajouter des vols hors programme

---

### 3.4 Ajouter un vol hors programme

**Qu'est-ce que c'est ?**
Un vol qui n'est pas dans le programme regulier : charter, evacuation medicale, vol technique, etc.

**Comment faire ?**

1. Ouvrez le bulletin
2. Cliquez sur "Ajouter vol hors programme"
3. Remplissez les informations :
   - **Numero de vol**
   - **Date du mouvement**
   - **Heures prevues**
   - **Type** : CHARTER, MEDICAL, TECHNIQUE, etc.
   - **Raison** : Pourquoi ce vol exceptionnel
4. Cliquez sur "Ajouter"

**Ce qui se passe en coulisses :**
```
POST /api/bulletins/:id/mouvements/hors-programme
Body: {
  "numeroVol": "ET9999",
  "dateMouvement": "2026-01-16",
  "heureArriveePrevue": "...",
  "typeHorsProgramme": "MEDICAL",
  "raisonHorsProgramme": "Evacuation sanitaire urgente"
}
```

**Types de vols hors programme :**
| Type | Description |
|------|-------------|
| CHARTER | Vol affrete pour un groupe |
| MEDICAL | Evacuation sanitaire |
| TECHNIQUE | Positionnement avion, maintenance |
| COMMERCIAL | Vol commercial ponctuel |
| CARGO | Vol cargo exceptionnel |
| AUTRE | Autre type |

---

### 3.5 Publier un bulletin

**Qu'est-ce que c'est ?**
La publication rend le bulletin "officiel". Il devient la reference pour les operations des prochains jours.

**Conditions requises :**
- Le bulletin doit etre en BROUILLON
- Il doit contenir **au moins 1 mouvement**

**Comment faire ?**

1. Ouvrez le bulletin
2. Verifiez tous les mouvements
3. Cliquez sur "Publier"

**Ce qui se passe en coulisses :**
```
POST /api/bulletins/:id/publier
```

---

## PARTIE 4 : COMPTE RENDU DE VOL (CRV)

### 4.1 Qu'est-ce qu'un CRV ?

**Definition simple :**
Le CRV est le **document officiel qui prouve qu'un vol a reellement opere**. C'est LE document de reference legal.

**C'est votre travail principal !**

**Ce que contient un CRV :**
- Horaires reels (arrivee, depart)
- Personnel qui a travaille sur le vol
- Engins utilises
- Charges (passagers, bagages, fret)
- Evenements / incidents
- Observations

**Regle d'or :**
```
1 avion + 1 escale + 1 date = 1 CRV unique
```

---

### 4.2 Le cycle de vie d'un CRV

**Les etapes d'un CRV :**

```
1. BROUILLON    --> Vous venez de creer le CRV
       |
       v
2. EN_COURS     --> Vous etes en train de le remplir
       |
       v
3. TERMINE      --> Vous avez fini la saisie
       |
       v
4. VALIDE       --> Un chef a valide
       |
       v
5. VERROUILLE   --> Fige, ne peut plus etre modifie
```

**Note :** Un CRV peut etre **ANNULE** a tout moment (si le vol n'a pas opere par exemple).

---

### 4.3 Creer un CRV

**Quand le faire ?**
Des qu'un vol arrive a votre escale, vous devez creer son CRV.

**Comment faire ?**

1. Allez dans "CRV"
2. Cliquez sur "Nouveau CRV"
3. Selectionnez le vol concerne (ou creez manuellement)
4. Cliquez sur "Creer"

**Ce qui se passe en coulisses :**
```
POST /api/crv
Body: {
  "volId": "...",
  "type": "turnaround"
}
```

**Types de CRV :**
| Type | Description |
|------|-------------|
| arrivee | Vol qui arrive seulement |
| depart | Vol qui part seulement |
| turnaround | Vol qui arrive ET repart (le plus courant) |

---

### 4.4 Demarrer un CRV

**Qu'est-ce que c'est ?**
Demarrer le CRV signifie que vous commencez la saisie. Le statut passe de BROUILLON a EN_COURS.

**Comment faire ?**

1. Ouvrez le CRV en BROUILLON
2. Cliquez sur "Demarrer"

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/demarrer
```

---

### 4.5 Saisir les horaires

**Qu'est-ce que c'est ?**
Les horaires reels : quand l'avion est vraiment arrive, quand il est vraiment parti.

**Comment faire ?**

1. Dans le CRV ouvert
2. Allez a la section "Horaires"
3. Saisissez les heures reelles :
   - Heure d'arrivee reelle
   - Heure de depart reelle
   - Autres heures specifiques
4. Enregistrez

**Ce qui se passe en coulisses :**
```
PUT /api/crv/:id/horaire
Body: {
  "heureArriveeReelle": "12:15",
  "heureDepartReelle": "14:10"
}
```

---

### 4.6 Saisir le personnel affecte

**Qu'est-ce que c'est ?**
La liste des personnes qui ont travaille sur ce vol.

**Comment faire ?**

1. Dans le CRV
2. Allez a la section "Personnel"
3. Cliquez sur "Ajouter une personne"
4. Remplissez :
   - **Nom**
   - **Prenom**
   - **Fonction** (Chef escale, Agent trafic, etc.)
   - Matricule (optionnel)
   - Telephone (optionnel)
5. Cliquez sur "Ajouter"
6. Repetez pour chaque personne

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/personnel
Body: {
  "nom": "Dupont",
  "prenom": "Jean",
  "fonction": "AGENT_TRAFIC",
  "matricule": "AGE0042"
}
```

**Fonctions disponibles :**
| Code | Description |
|------|-------------|
| CHEF_ESCALE | Chef d'escale |
| AGENT_TRAFIC | Agent trafic |
| AGENT_PISTE | Agent piste |
| AGENT_PASSAGE | Agent passage |
| MANUTENTIONNAIRE | Manutentionnaire |
| CHAUFFEUR | Chauffeur |
| AGENT_SECURITE | Agent securite |
| TECHNICIEN | Technicien |
| SUPERVISEUR | Superviseur |
| COORDINATEUR | Coordinateur |
| AUTRE | Autre fonction |

---

### 4.7 Saisir les charges - PASSAGERS

**Qu'est-ce que c'est ?**
Le nombre de passagers embarques ou debarques.

**Comment faire ?**

1. Dans le CRV
2. Allez a la section "Charges"
3. Cliquez sur "Ajouter une charge"
4. Selectionnez :
   - **Type** : PASSAGERS
   - **Sens** : EMBARQUEMENT ou DEBARQUEMENT
5. Saisissez les nombres :
   - Total passagers
   - Detail par categorie (adultes, enfants, bebes, etc.)
   - Detail par classe (affaires, economique)
6. Enregistrez

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/charges
Body: {
  "typeCharge": "PASSAGERS",
  "sensOperation": "DEBARQUEMENT"
}
```

Puis detail des categories :
```
PUT /api/charges/:id/categories-detaillees
Body: {
  "adultes": 120,
  "enfants": 15,
  "bebes": 3,
  "seniors": 10,
  "pmr": 2,
  "transit": 5,
  "vip": 1,
  "equipage": 8
}
```

---

### 4.8 Saisir les besoins medicaux (IMPORTANT)

**Qu'est-ce que c'est ?**
Les passagers ayant des besoins medicaux speciaux. **C'est obligatoire pour la conformite reglementaire (DGAC/OACI).**

**Quand le faire ?**
Si des passagers ont besoin de :
- Oxygene a bord
- Brancard (civiere)
- Accompagnement medical

**Comment faire ?**

1. Dans une charge PASSAGERS
2. Cliquez sur "Details medicaux"
3. Saisissez :
   - **Oxygene a bord** : Nombre de passagers
   - **Brancardier** : Nombre de passagers sur civiere
   - **Accompagnement medical** : Nombre avec personnel medical
4. Enregistrez

**Ce qui se passe en coulisses :**
```
PUT /api/charges/:id/besoins-medicaux
Body: {
  "oxygeneBord": 1,
  "brancardier": 0,
  "accompagnementMedical": 2
}
```

---

### 4.9 Saisir les mineurs non accompagnes (IMPORTANT)

**Qu'est-ce que c'est ?**
Les enfants qui voyagent seuls. **C'est obligatoire pour la conformite reglementaire (DGAC).**

**Terminologie :**
- **UM** (Unaccompanied Minor) = Mineur non accompagne

**Comment faire ?**

1. Dans une charge PASSAGERS
2. Cliquez sur "Details mineurs"
3. Saisissez :
   - **Mineurs non accompagnes (UM)** : Nombre
   - **Bebes non accompagnes** : Nombre (cas exceptionnel)
4. Enregistrez

**Ce qui se passe en coulisses :**
```
PUT /api/charges/:id/mineurs
Body: {
  "mineurNonAccompagne": 3,
  "bebeNonAccompagne": 0
}
```

---

### 4.10 Saisir les charges - BAGAGES

**Comment faire ?**

1. Dans le CRV > Charges
2. Cliquez sur "Ajouter une charge"
3. Selectionnez :
   - **Type** : BAGAGES
   - **Sens** : EMBARQUEMENT ou DEBARQUEMENT
4. Saisissez :
   - Nombre de bagages
   - Poids total
5. Enregistrez

---

### 4.11 Saisir les charges - FRET

**Comment faire ?**

1. Dans le CRV > Charges
2. Cliquez sur "Ajouter une charge"
3. Selectionnez :
   - **Type** : FRET
   - **Sens** : EMBARQUEMENT ou DEBARQUEMENT
4. Saisissez le detail du fret

**Ce qui se passe en coulisses :**
```
PUT /api/charges/:id/fret-detaille
Body: {
  "categoriesFret": {
    "general": 500,
    "perissable": 100,
    "valeur": 50
  },
  "logistique": {
    "nombreULD": 5,
    "poidsTotal": 650
  }
}
```

---

### 4.12 Saisir les marchandises dangereuses (DGR)

**Qu'est-ce que c'est ?**
Les marchandises classees dangereuses selon la reglementation IATA DGR.

**ATTENTION :** C'est tres reglemente. Ne pas prendre a la legere.

**Comment faire ?**

1. Dans une charge FRET
2. Cliquez sur "Ajouter DGR"
3. Remplissez :
   - **Code ONU** : Ex: UN1234
   - **Classe ONU** : Ex: 3 (liquides inflammables)
   - **Designation officielle** : Nom officiel
   - **Quantite** et **Unite**
   - **Groupe d'emballage** : I, II ou III
4. Enregistrez

**Ce qui se passe en coulisses :**
```
POST /api/charges/:id/marchandises-dangereuses
Body: {
  "codeONU": "UN1234",
  "classeONU": "3",
  "designationOfficielle": "Liquide inflammable",
  "quantite": 50,
  "unite": "kg",
  "groupeEmballage": "II"
}
```

---

### 4.13 Saisir les evenements

**Qu'est-ce que c'est ?**
Tout incident ou evenement notable survenu pendant l'escale.

**Exemples :**
- Retard du a la meteo
- Passager indiscipline
- Probleme technique
- Incident de securite

**Comment faire ?**

1. Dans le CRV
2. Allez a la section "Evenements"
3. Cliquez sur "Ajouter un evenement"
4. Remplissez :
   - **Type d'evenement** : Categorie
   - **Gravite** : MINEURE, MODEREE, MAJEURE, CRITIQUE
   - **Description** : Ce qui s'est passe
5. Enregistrez

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/evenements
Body: {
  "typeEvenement": "RETARD",
  "gravite": "MODEREE",
  "description": "Retard de 45 minutes du au mauvais temps a l'origine"
}
```

**Niveaux de gravite :**
| Niveau | Signification |
|--------|---------------|
| MINEURE | Impact faible, pas de retard significatif |
| MODEREE | Impact modere, retard possible |
| MAJEURE | Impact significatif sur les operations |
| CRITIQUE | Incident de securite, necessite enquete |

---

### 4.14 Saisir les observations

**Qu'est-ce que c'est ?**
Des notes, remarques, points d'attention qui ne sont pas des "evenements" mais meritent d'etre documentes.

**Comment faire ?**

1. Dans le CRV
2. Allez a la section "Observations"
3. Cliquez sur "Ajouter une observation"
4. Selectionnez la **categorie** :
   - GENERALE
   - TECHNIQUE
   - OPERATIONNELLE
   - SECURITE
   - QUALITE
   - SLA
5. Ecrivez le **contenu**
6. Enregistrez

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/observations
Body: {
  "categorie": "OPERATIONNELLE",
  "contenu": "L'equipage a signale un probleme mineur avec le train d'atterrissage. Maintenance informee."
}
```

---

### 4.15 Confirmer l'absence de donnees

**Qu'est-ce que c'est ?**
Permet de dire explicitement "il n'y a pas eu d'evenement" (plutot que simplement ne rien saisir). C'est important pour le calcul de completude.

**Pourquoi c'est important ?**
- "Pas d'evenement saisi" = Peut-etre un oubli
- "Absence d'evenement confirmee" = Vous avez verifie, il n'y en a pas

**Comment faire ?**

1. Dans le CRV
2. Si une section est vide
3. Cliquez sur "Confirmer absence"
4. Selectionnez le type : evenement, observation, ou charge

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/confirmer-absence
Body: {
  "type": "evenement"
}
```

---

### 4.16 Terminer un CRV

**Qu'est-ce que c'est ?**
Vous avez fini la saisie. Le CRV passe en statut TERMINE.

**Conditions requises :**
- Le CRV doit etre EN_COURS
- La **completude doit etre d'au moins 50%**
- Les phases obligatoires doivent etre terminees

**Comment faire ?**

1. Verifiez que tout est saisi
2. Cliquez sur "Terminer"

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/terminer
```

**Si ca echoue :**
- Verifiez la completude (affichee en pourcentage)
- Completez les champs manquants
- Confirmez les absences si necessaire

---

### 4.17 Valider un CRV

**Qu'est-ce que c'est ?**
La validation confirme que les informations saisies sont correctes.

**Comment faire ?**

1. Ouvrez un CRV TERMINE
2. Cliquez sur "Valider"

**Ce qui se passe en coulisses :**
```
POST /api/validation/:id/valider
```

---

### 4.18 Verrouiller un CRV

**Qu'est-ce que c'est ?**
Le verrouillage fige definitivement le CRV. Plus aucune modification n'est possible.

**Quand le faire ?**
Apres validation, quand vous etes sur que tout est correct.

**Comment faire ?**

1. Ouvrez un CRV VALIDE
2. Cliquez sur "Verrouiller"

**Ce qui se passe en coulisses :**
```
POST /api/validation/:id/verrouiller
```

---

### 4.19 Deverrouiller un CRV (avec raison)

**Qu'est-ce que c'est ?**
Si une erreur est detectee apres verrouillage, on peut deverrouiller pour corriger.

**Important :** Vous devez fournir une **raison**.

**Comment faire ?**

1. Ouvrez le CRV VERROUILLE
2. Cliquez sur "Deverrouiller"
3. Saisissez la raison (obligatoire)
4. Confirmez

**Ce qui se passe en coulisses :**
```
POST /api/validation/:id/deverrouiller
Body: {
  "raison": "Erreur sur le nombre de passagers PMR. Correction necessaire."
}
```

**Resultat :**
Le CRV repasse en statut **EN_COURS** pour modification.

---

### 4.20 Annuler un CRV

**Quand le faire ?**
Si un vol est annule et n'a finalement pas opere.

**Comment faire ?**

1. Verifiez d'abord si l'annulation est possible
2. Ouvrez le CRV
3. Cliquez sur "Annuler"
4. Saisissez :
   - **Raison de l'annulation** (obligatoire)
   - **Commentaire** (optionnel)
5. Confirmez

**Ce qui se passe en coulisses :**
```
GET /api/crv/:id/peut-annuler  (verification)

POST /api/crv/:id/annuler
Body: {
  "raisonAnnulation": "Vol annule par la compagnie",
  "commentaireAnnulation": "Meteo defavorable a l'origine"
}
```

---

### 4.21 Reactiver un CRV annule

**Quand le faire ?**
Si un CRV a ete annule par erreur ou si le vol a finalement opere.

**Comment faire ?**

1. Ouvrez le CRV ANNULE
2. Cliquez sur "Reactiver"
3. Confirmez

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/reactiver
```

---

### 4.22 Exporter un CRV en PDF

**Comment faire ?**

1. Ouvrez le CRV
2. Cliquez sur "Exporter PDF"
3. Le PDF s'affiche ou se telecharge

**Ce qui se passe en coulisses :**
```
GET /api/crv/:id/pdf-base64    (pour apercu)
GET /api/crv/:id/telecharger-pdf   (pour telechargement)
```

---

### 4.23 Exporter plusieurs CRV en Excel

**Comment faire ?**

1. Allez dans la liste des CRV
2. Cliquez sur "Exporter Excel"
3. Selectionnez les filtres :
   - Periode (date debut, date fin)
   - Statut
   - Escale
4. Cliquez sur "Exporter"
5. Le fichier .xlsx se telecharge

**Ce qui se passe en coulisses :**
```
GET /api/crv/export?dateDebut=2026-01-01&dateFin=2026-01-31&statut=VALIDE
```

---

## PARTIE 5 : GESTION DES PHASES

### 5.1 Qu'est-ce qu'une phase ?

**Definition simple :**
Une phase est une etape de l'escale. Par exemple : accueil passagers, embarquement, chargement bagages, etc.

**Comment gerer les phases ?**

1. Dans le CRV
2. Allez a la section "Phases"
3. Pour chaque phase, vous pouvez :
   - La demarrer (noter l'heure de debut)
   - La terminer (noter l'heure de fin)
   - La marquer comme "non realisee" (avec motif)

**Ce qui se passe en coulisses :**
```
POST /api/phases/:id/demarrer
POST /api/phases/:id/terminer
POST /api/phases/:id/non-realise
Body: {
  "motifNonRealisation": "EQUIPEMENT_INDISPONIBLE",
  "detailMotif": "Passerelle en panne"
}
```

**Motifs de non-realisation :**
| Motif | Description |
|-------|-------------|
| NON_NECESSAIRE | Cette phase n'etait pas requise |
| EQUIPEMENT_INDISPONIBLE | Materiel en panne ou absent |
| PERSONNEL_ABSENT | Pas assez de personnel |
| CONDITIONS_METEO | Mauvais temps |
| AUTRE | Autre raison (detail obligatoire) |

---

## PARTIE 6 : CE QUE VOUS NE POUVEZ PAS FAIRE

En tant qu'Agent d'Escale, vous n'avez **PAS** acces a :

| Fonctionnalite | Pourquoi |
|----------------|----------|
| Creer des engins | Reserve aux Managers et Admins |
| Supprimer des engins | Reserve aux Admins |
| Gerer les utilisateurs | Reserve aux Admins |
| Configurer les SLA | Reserve aux Managers |
| Voir les rapports SLA | Reserve aux Managers |
| Creer des notifications systeme | Reserve aux Managers |

Si vous avez besoin d'une de ces fonctionnalites, contactez votre Manager ou Admin.

---

## PARTIE 7 : BONNES PRATIQUES

### 7.1 Saisie des CRV

1. **Creez le CRV des l'arrivee de l'avion**
2. **Saisissez en temps reel** - N'attendez pas la fin de l'escale
3. **Soyez precis sur les horaires** - Ce sont des documents legaux
4. **N'oubliez pas les besoins medicaux et les UM** - C'est obligatoire
5. **Confirmez les absences** - Si pas d'evenement, dites-le explicitement

### 7.2 Gestion des evenements

1. **Signalez tout incident** - Meme mineur
2. **Choisissez le bon niveau de gravite**
3. **Soyez factuel dans la description** - Qui, quoi, quand, ou

### 7.3 Securite

1. **Ne partagez jamais votre mot de passe**
2. **Deconnectez-vous quand vous quittez le poste**
3. **Signalez toute activite suspecte**

---

## AIDE-MEMOIRE RAPIDE

### Creer un CRV complet

```
1. Creer le CRV (POST /api/crv)
2. Demarrer (POST /api/crv/:id/demarrer)
3. Saisir horaires (PUT /api/crv/:id/horaire)
4. Ajouter personnel (POST /api/crv/:id/personnel)
5. Ajouter charges (POST /api/crv/:id/charges)
   - Details passagers (PUT /api/charges/:id/categories-detaillees)
   - Besoins medicaux (PUT /api/charges/:id/besoins-medicaux)
   - Mineurs (PUT /api/charges/:id/mineurs)
6. Ajouter evenements (POST /api/crv/:id/evenements)
7. Ajouter observations (POST /api/crv/:id/observations)
8. Confirmer absences si necessaire (POST /api/crv/:id/confirmer-absence)
9. Terminer (POST /api/crv/:id/terminer)
10. Valider (POST /api/validation/:id/valider)
11. Verrouiller (POST /api/validation/:id/verrouiller)
```

---

## CONTACTS ET SUPPORT

Si vous avez des questions ou des problemes :

1. **Premier niveau** : Votre Chef d'Equipe
2. **Deuxieme niveau** : Le Superviseur
3. **Probleme technique** : L'Administrateur systeme

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : AGENT_ESCALE
