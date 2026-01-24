# GUIDE UTILISATEUR - ADMINISTRATEUR

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : ADMIN
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes **Administrateur systeme**. Votre role est de :

- **Gerer les comptes utilisateurs** (creation, modification, suppression)
- **Administrer le parc d'engins** (y compris suppression)
- **Assurer le bon fonctionnement technique** du systeme
- **Gerer les acces et la securite**

**IMPORTANT : Vous n'etes PAS un operationnel.**

Vous n'avez pas acces aux fonctionnalites de creation/modification des CRV, programmes, ou bulletins. Votre role est purement **technique et administratif**.

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Se connecter / Gerer son profil | OUI |
| **Gerer les utilisateurs** | **OUI (EXCLUSIF)** |
| **Creer des comptes** | **OUI (EXCLUSIF)** |
| **Modifier des comptes** | **OUI (EXCLUSIF)** |
| **Supprimer des comptes** | **OUI (EXCLUSIF)** |
| Consulter les programmes/bulletins/CRV | OUI |
| Creer/Modifier des programmes | NON |
| Creer/Modifier des bulletins | NON |
| Creer/Modifier des CRV | NON |
| Creer des engins | OUI |
| **Supprimer des engins** | **OUI (EXCLUSIF)** |
| Configurer les SLA | NON |

---

## CE QUE VOUS NE POUVEZ PAS FAIRE

**Fonctionnalites operationnelles :**

| Action interdite | Raison |
|-----------------|--------|
| Creer un programme de vol | Role operationnel |
| Modifier un programme | Role operationnel |
| Creer un bulletin | Role operationnel |
| Modifier un bulletin | Role operationnel |
| Creer un CRV | Role operationnel |
| Modifier un CRV | Role operationnel |
| Valider/Verrouiller un CRV | Role operationnel |
| Configurer les SLA | Role Manager |
| Creer des notifications systeme | Role Manager |

**Pourquoi ces restrictions ?**
- Separation des responsabilites
- L'Admin gere les comptes, pas les operations
- Evite les conflits d'interets

---

## PARTIE 1 : GESTION DES UTILISATEURS

### 1.1 Voir tous les utilisateurs

**Comment faire ?**

1. Allez dans "Administration" > "Utilisateurs"
2. La liste de tous les utilisateurs s'affiche

**Ce qui se passe en coulisses :**
```
GET /api/personnes
```

**Filtres disponibles :**
| Parametre | Description |
|-----------|-------------|
| `page` | Numero de page |
| `limit` | Elements par page |
| `fonction` | Filtrer par role |
| `statut` | Filtrer par statut |
| `search` | Recherche textuelle |

**Exemple :**
```
GET /api/personnes?fonction=AGENT_ESCALE&statut=ACTIF&search=dupont
```

---

### 1.2 Voir les statistiques utilisateurs

```
GET /api/personnes/stats/global
```

**Resultat :**
```json
{
  "total": 42,
  "byFonction": {
    "AGENT_ESCALE": 20,
    "CHEF_EQUIPE": 10,
    "SUPERVISEUR": 5,
    "MANAGER": 4,
    "QUALITE": 2,
    "ADMIN": 1
  },
  "byStatut": {
    "ACTIF": 35,
    "ABSENT": 3,
    "CONGE": 2,
    "INACTIF": 2
  }
}
```

---

### 1.3 Voir le detail d'un utilisateur

```
GET /api/personnes/:id
```

**Informations retournees :**
- Nom, prenom
- Matricule
- Email
- Fonction
- Specialites
- Statut (ACTIF, ABSENT, CONGE, INACTIF)
- Statut du compte (EN_ATTENTE, VALIDE, SUSPENDU, DESACTIVE)
- Telephone
- Date d'embauche
- Dates de creation et modification

---

### 1.4 Creer un nouvel utilisateur

**Quand le faire ?**
- Nouvel employe
- Nouvelle affectation

**Comment faire ?**

1. Allez dans "Administration" > "Utilisateurs"
2. Cliquez sur "Nouvel utilisateur"
3. Remplissez les informations :
   - **Nom** (obligatoire)
   - **Prenom** (obligatoire)
   - **Email** (obligatoire, unique)
   - **Mot de passe** (obligatoire, min 6 caracteres)
   - **Fonction** (obligatoire)
   - **Matricule** (optionnel, auto-genere si vide)
   - **Specialites** (optionnel)
   - **Telephone** (optionnel)
   - **Date d'embauche** (optionnel)
4. Cliquez sur "Creer"

**Ce qui se passe en coulisses :**
```
POST /api/personnes
Body: {
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@company.com",
  "password": "motdepasse123",
  "fonction": "AGENT_ESCALE",
  "specialites": ["PISTE", "PASSAGERS"],
  "telephone": "0612345678",
  "dateEmbauche": "2026-01-15"
}
```

**Fonctions disponibles :**
| Fonction | Description |
|----------|-------------|
| AGENT_ESCALE | Agent de terrain |
| CHEF_EQUIPE | Chef d'equipe |
| SUPERVISEUR | Superviseur operations |
| MANAGER | Manager operations |
| QUALITE | Service qualite |
| ADMIN | Administrateur systeme |

**Specialites disponibles :**
| Code | Description |
|------|-------------|
| PISTE | Operations piste |
| PASSAGERS | Gestion passagers |
| FRET | Gestion fret |
| BAGAGE | Gestion bagages |
| AVITAILLEMENT | Avitaillement |
| NETTOYAGE | Nettoyage |
| MAINTENANCE | Maintenance |

**Auto-generation du matricule :**
Si vous ne fournissez pas de matricule, il est genere automatiquement :
- Format : `{PREFIX}{NUMERO}`
- PREFIX : 3 premieres lettres de la fonction (AGE, CHE, SUP, MAN, QUA, ADM)
- NUMERO : Incremental sur 4 chiffres (0001, 0002, etc.)

---

### 1.5 Modifier un utilisateur

**Quand le faire ?**
- Changement de fonction
- Mise a jour des coordonnees
- Changement de statut
- Reinitialisation du mot de passe

**Comment faire ?**

1. Ouvrez le profil de l'utilisateur
2. Modifiez les informations souhaitees
3. Cliquez sur "Enregistrer"

**Ce qui se passe en coulisses :**
```
PUT /api/personnes/:id
Body: {
  "fonction": "CHEF_EQUIPE",
  "statut": "ACTIF"
}
```

ou

```
PATCH /api/personnes/:id
Body: {
  "telephone": "0698765432"
}
```

**Champs modifiables :**
- nom
- prenom
- email (doit rester unique)
- fonction
- specialites
- statut (ACTIF, ABSENT, CONGE, INACTIF)
- telephone
- dateEmbauche
- password (pour reinitialisation)

---

### 1.6 Reinitialiser un mot de passe

**Quand le faire ?**
- L'utilisateur a oublie son mot de passe
- Suspicion de compromission

**Comment faire ?**

1. Ouvrez le profil de l'utilisateur
2. Cliquez sur "Reinitialiser le mot de passe"
3. Entrez le nouveau mot de passe (min 6 caracteres)
4. Enregistrez
5. Communiquez le nouveau mot de passe a l'utilisateur de maniere securisee

**Ce qui se passe en coulisses :**
```
PATCH /api/personnes/:id
Body: {
  "password": "nouveauMotDePasse123"
}
```

**Bonnes pratiques :**
- Generez un mot de passe aleatoire
- Forcez l'utilisateur a le changer a la premiere connexion
- Ne transmettez jamais par email non securise

---

### 1.7 Desactiver un compte

**Quand le faire ?**
- Depart de l'employe
- Suspension disciplinaire
- Compte inutilise

**Comment faire ?**

1. Ouvrez le profil de l'utilisateur
2. Changez le statut en "INACTIF" ou "DESACTIVE"
3. Enregistrez

**Ce qui se passe en coulisses :**
```
PATCH /api/personnes/:id
Body: {
  "statut": "INACTIF"
}
```

**Difference entre les statuts :**
| Statut | Signification | Connexion possible |
|--------|---------------|-------------------|
| ACTIF | Compte normal | Oui |
| ABSENT | Temporairement absent | Oui |
| CONGE | En conge | Oui |
| INACTIF | Desactive | Non |

---

### 1.8 Supprimer un compte

**ATTENTION : Action irreversible !**

**Quand le faire ?**
- Compte cree par erreur
- Demande RGPD de suppression

**Regles importantes :**
- **Vous ne pouvez pas supprimer votre propre compte**
- L'action est definitive
- Les references dans les CRV seront conservees (historique)

**Comment faire ?**

1. Ouvrez le profil de l'utilisateur
2. Cliquez sur "Supprimer"
3. Confirmez (double confirmation recommandee)

**Ce qui se passe en coulisses :**
```
DELETE /api/personnes/:id
```

**Erreur possible :**
```json
{
  "success": false,
  "message": "Vous ne pouvez pas supprimer votre propre compte"
}
```

**Alternative recommandee :**
Plutot que de supprimer, desactivez le compte. Cela preserve l'historique tout en empechant la connexion.

---

## PARTIE 2 : GESTION DES ENGINS

### 2.1 Voir tous les engins

```
GET /api/engins
```

---

### 2.2 Creer un engin

```
POST /api/engins
Body: {
  "numeroEngin": "TR-001",
  "typeEngin": "TRACTEUR"
}
```

---

### 2.3 Modifier un engin

```
PUT /api/engins/:id
Body: {
  "numeroEngin": "TR-001-NEW"
}
```

---

### 2.4 Supprimer un engin (EXCLUSIF ADMIN)

**ATTENTION : Action irreversible !**

**Quand le faire ?**
- Engin mis au rebut
- Erreur de saisie

**Ce qui se passe en coulisses :**
```
DELETE /api/engins/:id
```

**Impact :**
- L'engin ne sera plus disponible
- Les references historiques dans les CRV sont conservees

---

## PARTIE 3 : CONSULTATION (LECTURE SEULE)

En tant qu'Admin, vous pouvez **consulter** toutes les donnees operationnelles :

### Programmes de Vol
```
GET /api/programmes-vol
GET /api/programmes-vol/:id
GET /api/programmes-vol/:id/statistiques
```

### Bulletins de Mouvement
```
GET /api/bulletins
GET /api/bulletins/:id
```

### CRV
```
GET /api/crv
GET /api/crv/:id
GET /api/crv/stats
```

### Charges
```
GET /api/charges/:id
```

### Phases
```
GET /api/phases
GET /api/phases/:id
```

### Avions
```
GET /api/avions
GET /api/avions/:id
```

### Notifications
```
GET /api/notifications
```

---

## PARTIE 4 : SECURITE ET GOUVERNANCE

### 4.1 Bonnes pratiques de securite

**Gestion des mots de passe :**
- Minimum 6 caracteres (recommande : 8+)
- Melange lettres, chiffres, symboles
- Changement regulier (tous les 90 jours)
- Ne jamais reutiliser un ancien mot de passe

**Gestion des comptes :**
- Desactivez immediatement les comptes des departs
- Auditez regulierement les comptes actifs
- Verifiez les fonctions assignees (principe du moindre privilege)

**Logs et tracabilite :**
- Toutes les actions sont loguees
- Le createur et modificateur sont enregistres
- En cas de suspicion, analysez les logs

---

### 4.2 Principe du moindre privilege

**Assignez le role minimum necessaire :**

| Besoin | Role a assigner |
|--------|-----------------|
| Saisie CRV seulement | AGENT_ESCALE |
| Supervision d'equipe | CHEF_EQUIPE |
| Vision globale operations | SUPERVISEUR |
| Decisions strategiques | MANAGER |
| Audit et conformite | QUALITE |
| Administration systeme | ADMIN |

---

### 4.3 Gestion des incidents de securite

**Si compte compromis :**
1. Desactivez immediatement le compte
2. Reinitalisez le mot de passe
3. Analysez les actions recentes
4. Informez le Manager
5. Documentez l'incident

**Si suspicion d'acces non autorise :**
1. Verifiez les logs
2. Identifiez les actions suspectes
3. Prenez les mesures correctives
4. Documentez

---

## PARTIE 5 : PROCEDURES ADMINISTRATIVES

### 5.1 Onboarding d'un nouvel utilisateur

```
1. RECEPTION DE LA DEMANDE
   - Nom, prenom, fonction souhaitee
   - Email professionnel
   - Date de debut
   |
   v
2. VERIFICATION
   - L'employe est-il bien dans l'entreprise ?
   - La fonction demandee est-elle appropriee ?
   |
   v
3. CREATION DU COMPTE
   - POST /api/personnes
   - Generer mot de passe temporaire
   |
   v
4. COMMUNICATION
   - Envoyer les identifiants de maniere securisee
   - Informer de changer le mot de passe
   |
   v
5. VERIFICATION
   - L'utilisateur peut-il se connecter ?
   - A-t-il les bons acces ?
```

---

### 5.2 Offboarding d'un utilisateur

```
1. NOTIFICATION
   - RH ou Manager informe du depart
   |
   v
2. PLANIFICATION
   - Date de fin d'acces
   - Transfert des responsabilites
   |
   v
3. DESACTIVATION
   - PATCH /api/personnes/:id { "statut": "INACTIF" }
   - Le jour du depart
   |
   v
4. VERIFICATION
   - Le compte est-il bien inactif ?
   - L'utilisateur ne peut-il plus se connecter ?
   |
   v
5. ARCHIVAGE (optionnel)
   - Conserver le compte desactive
   - Ou supprimer apres delai (selon politique)
```

---

### 5.3 Changement de fonction

```
1. DEMANDE
   - Validation du Manager
   |
   v
2. VERIFICATION
   - La nouvelle fonction est-elle appropriee ?
   - Formation necessaire ?
   |
   v
3. MODIFICATION
   - PATCH /api/personnes/:id { "fonction": "NOUVELLE_FONCTION" }
   |
   v
4. COMMUNICATION
   - Informer l'utilisateur
   - Expliquer les nouveaux droits
   |
   v
5. SUIVI
   - Verifier que l'acces fonctionne
```

---

## PARTIE 6 : DEPANNAGE

### 6.1 L'utilisateur ne peut pas se connecter

**Verifications :**
1. Le compte existe-t-il ? (`GET /api/personnes?search=...`)
2. Le statut est-il ACTIF ? (pas INACTIF)
3. L'email est-il correct ?
4. Le mot de passe est-il correct ?

**Solutions :**
- Reinitialiser le mot de passe
- Reactiver le compte si INACTIF

---

### 6.2 L'utilisateur n'a pas les bons droits

**Verifications :**
1. Quelle est sa fonction ? (`GET /api/personnes/:id`)
2. La fonction correspond-elle a ses besoins ?

**Solutions :**
- Modifier la fonction si necessaire
- Expliquer les droits de chaque fonction

---

### 6.3 Erreur "Email deja utilise"

**Cause :**
Un compte existe deja avec cet email.

**Solutions :**
1. Rechercher le compte existant
2. Si erreur de saisie, corriger l'email
3. Si compte oublie, reactiver ou utiliser un autre email

---

## AIDE-MEMOIRE RAPIDE

### Creer un utilisateur

```
POST /api/personnes
Body: {
  "nom": "...",
  "prenom": "...",
  "email": "...",
  "password": "...",
  "fonction": "AGENT_ESCALE|CHEF_EQUIPE|SUPERVISEUR|MANAGER|QUALITE|ADMIN"
}
```

### Desactiver un utilisateur

```
PATCH /api/personnes/:id
Body: { "statut": "INACTIF" }
```

### Reinitialiser un mot de passe

```
PATCH /api/personnes/:id
Body: { "password": "nouveauMDP" }
```

### Supprimer un engin

```
DELETE /api/engins/:id
```

---

## CONTACTS

| Situation | Contact |
|-----------|---------|
| Question operationnelle | Manager |
| Probleme technique systeme | Equipe IT |
| Question RH | Service RH |

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : ADMIN
