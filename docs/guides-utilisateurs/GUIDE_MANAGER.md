# GUIDE UTILISATEUR - MANAGER

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : MANAGER
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes **Manager**, responsable strategique des operations d'escale. Votre role est de :

- **Definir les objectifs** et les standards de qualite
- **Gerer les ressources** (engins, equipements)
- **Configurer les SLA** (accords de niveau de service)
- **Analyser les performances** via les rapports avances
- **Communiquer** avec les equipes via les notifications
- **Prendre les decisions strategiques**

**Vous avez le plus haut niveau d'acces operationnel.**

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Tout ce qu'un Superviseur peut faire | OUI |
| Creer et modifier des engins | OUI |
| Configurer les SLA | OUI |
| Voir les rapports SLA complets | OUI |
| Surveiller les SLA en temps reel | OUI |
| Creer des notifications systeme | OUI |
| Supprimer des engins | NON |
| Gerer les comptes utilisateurs | NON |

---

## PARTIE 1 : GESTION DES ENGINS

### 1.1 Qu'est-ce qu'un engin ?

**Definition :**
Un engin est un equipement utilise pour l'assistance en escale : tracteur, chariot bagages, GPU, passerelle, etc.

**Types d'engins disponibles :**
| Type | Description |
|------|-------------|
| TRACTEUR | Tracteur pushback |
| CHARIOT_BAGAGES | Chariot pour bagages |
| CHARIOT_FRET | Chariot pour fret |
| GPU | Ground Power Unit (alimentation electrique) |
| ASU | Air Starter Unit (climatisation) |
| STAIRS | Escaliers passagers |
| CONVOYEUR | Tapis roulant bagages |
| AUTRE | Autre equipement |

---

### 1.2 Consulter les engins

**Voir tous les engins :**

```
GET /api/engins
```

**Filtres disponibles :**
- `typeEngin` : Filtrer par type
- `statut` : Filtre par disponibilite
- `page`, `limit` : Pagination

**Voir les types disponibles :**

```
GET /api/engins/types
```

**Voir les engins disponibles maintenant :**

```
GET /api/engins/disponibles?typeEngin=TRACTEUR
```

---

### 1.3 Creer un nouvel engin

**Quand le faire ?**
Quand un nouvel equipement arrive dans le parc.

**Comment faire ?**

1. Allez dans "Engins"
2. Cliquez sur "Nouvel engin"
3. Remplissez :
   - **Numero d'engin** : Identifiant unique (ex: TR-001)
   - **Type** : Selectionnez dans la liste
4. Cliquez sur "Creer"

**Ce qui se passe en coulisses :**
```
POST /api/engins
Body: {
  "numeroEngin": "TR-001",
  "typeEngin": "TRACTEUR"
}
```

---

### 1.4 Modifier un engin

**Quand le faire ?**
Pour mettre a jour les informations ou le statut.

**Comment faire ?**

1. Ouvrez l'engin
2. Modifiez les informations
3. Enregistrez

**Ce qui se passe en coulisses :**
```
PUT /api/engins/:id
Body: {
  "numeroEngin": "TR-001-NEW",
  "typeEngin": "TRACTEUR"
}
```

---

### 1.5 Pourquoi vous ne pouvez pas supprimer

**Raison :**
La suppression d'un engin est une action irreversible qui peut impacter l'historique des CRV. Seul l'Admin peut supprimer pour eviter les erreurs.

**Alternative :**
Changez le statut de l'engin en "hors service" ou "retire".

---

## PARTIE 2 : CONFIGURATION ET SURVEILLANCE SLA

### 2.1 Qu'est-ce qu'un SLA ?

**Definition :**
SLA = Service Level Agreement (Accord de Niveau de Service)

Ce sont des objectifs de performance que vous definissez :
- Combien de temps un CRV peut rester en BROUILLON
- Combien de temps une phase peut durer
- Etc.

**Pourquoi c'est important ?**
- Garantir la qualite de service
- Identifier les retards
- Alerter avant que ca devienne critique

---

### 2.2 Consulter la configuration SLA

**Comment faire ?**

```
GET /api/sla/configuration
```

**Configuration par defaut :**
```json
{
  "CRV": {
    "dureeMaxBrouillon": 120,     // minutes
    "dureeMaxEnCours": 480        // minutes
  },
  "PHASE": {
    "depassementMaxMinutes": 15   // minutes
  }
}
```

---

### 2.3 Modifier la configuration SLA

**Quand le faire ?**
Pour adapter les seuils a vos exigences operationnelles.

**Comment faire ?**

1. Allez dans "Configuration SLA"
2. Modifiez les valeurs
3. Enregistrez

**Ce qui se passe en coulisses :**
```
PUT /api/sla/configuration
Body: {
  "CRV": {
    "dureeMaxBrouillon": 60,      // Reduire a 1 heure
    "dureeMaxEnCours": 360        // Reduire a 6 heures
  },
  "PHASE": {
    "depassementMaxMinutes": 10   // Plus strict
  }
}
```

**Impact :**
Les alertes seront declenchees plus tot si vous reduisez les seuils.

---

### 2.4 Voir le rapport SLA complet

**C'est votre outil d'analyse principal !**

**Comment faire ?**

```
GET /api/sla/rapport
```

**Contenu du rapport :**
- CRV en depassement
- Phases en retard
- Tendances
- Alertes actives
- Historique des violations

---

### 2.5 Surveiller les SLA en temps reel

**Surveiller tous les CRV actifs :**

```
POST /api/sla/surveiller/crv
```

**Resultat :**
Liste des CRV qui approchent ou depassent les seuils.

**Surveiller toutes les phases actives :**

```
POST /api/sla/surveiller/phases
```

**Resultat :**
Liste des phases en cours qui sont en retard.

---

### 2.6 Verifier le SLA d'un element specifique

**Pour un CRV :**
```
GET /api/sla/crv/:id
```

**Pour une phase :**
```
GET /api/sla/phase/:id
```

**Informations retournees :**
- Temps ecoule
- Seuil configure
- Statut (OK, WARNING, CRITICAL)
- Temps restant avant alerte

---

## PARTIE 3 : NOTIFICATIONS SYSTEME

### 3.1 Qu'est-ce qu'une notification ?

**Definition :**
Message envoye aux utilisateurs pour les informer d'un evenement, d'une alerte ou d'une information.

**Types de notifications :**
| Type | Usage |
|------|-------|
| INFO | Information generale |
| WARNING | Avertissement, attention requise |
| ERROR | Erreur, probleme a resoudre |
| SUCCESS | Confirmation de succes |
| ALERTE_SLA | Alerte automatique SLA |

---

### 3.2 Creer une notification

**Quand le faire ?**
Pour communiquer une information importante a tous les utilisateurs ou a un groupe.

**Comment faire ?**

1. Allez dans "Notifications"
2. Cliquez sur "Nouvelle notification"
3. Remplissez :
   - **Titre**
   - **Message**
   - **Type** (INFO, WARNING, etc.)
   - **Destinataires** (optionnel)
4. Envoyez

**Ce qui se passe en coulisses :**
```
POST /api/notifications
Body: {
  "titre": "Maintenance prevue",
  "message": "Le systeme sera indisponible demain de 6h a 7h pour maintenance.",
  "type": "WARNING",
  "priorite": "HAUTE"
}
```

---

### 3.3 Voir les statistiques de notifications

**Comment faire ?**

```
GET /api/notifications/statistiques
```

**Informations :**
- Nombre total
- Par type
- Taux de lecture
- Tendances

---

## PARTIE 4 : TABLEAU DE BORD MANAGER

### 4.1 Indicateurs cles (KPI)

**Ce que vous devez suivre :**

| KPI | Objectif | Source |
|-----|----------|--------|
| Completude moyenne | > 80% | `GET /api/crv/stats` |
| CRV verrouilles/jour | Selon volume | `GET /api/crv/stats` |
| Violations SLA | 0 | `GET /api/sla/rapport` |
| Taux d'annulation | < 5% | `GET /api/crv/statistiques/annulations` |
| Evenements CRITIQUE | 0 | `GET /api/crv/stats` |

---

### 4.2 Rapports periodiques

**Rapport journalier :**
- CRV traites
- Violations SLA
- Incidents

**Rapport hebdomadaire :**
- Tendances
- Completude par equipe
- Top problemes

**Rapport mensuel :**
- Performance globale
- Comparaison objectifs
- Plan d'amelioration

---

### 4.3 Exports pour reporting

**Export CRV :**
```
GET /api/crv/export?dateDebut=2026-01-01&dateFin=2026-01-31
```

**Export pour analyse :**
Utilisez les statistiques passagers et fret pour vos rapports :
```
GET /api/charges/statistiques/passagers
GET /api/charges/statistiques/fret
```

---

## PARTIE 5 : FONCTIONNALITES COMPLETES

En tant que Manager, vous avez acces a **toutes les fonctionnalites** sauf la gestion des utilisateurs.

### Authentification
- Connexion, profil, changement MDP

### Programmes de Vol
- Toutes les operations CRUD
- Validation, activation, suspension
- Statistiques et export PDF

### Bulletins de Mouvement
- Toutes les operations
- Publication et archivage

### CRV
- Toutes les operations
- Validation, verrouillage
- Archivage Google Drive
- Export PDF et Excel

### Charges
- Toutes les operations
- Besoins medicaux, mineurs
- Marchandises dangereuses
- Statistiques

### Phases
- Toutes les operations

### Engins
- `GET /api/engins` - Liste
- `GET /api/engins/types` - Types
- `GET /api/engins/disponibles` - Disponibles
- `POST /api/engins` - **Creer**
- `PUT /api/engins/:id` - **Modifier**
- ~~`DELETE /api/engins/:id`~~ - Non autorise

### SLA (EXCLUSIF MANAGER)
- `GET /api/sla/configuration` - Voir config
- `PUT /api/sla/configuration` - **Modifier config**
- `GET /api/sla/rapport` - **Rapport complet**
- `POST /api/sla/surveiller/crv` - **Surveiller CRV**
- `POST /api/sla/surveiller/phases` - **Surveiller phases**
- `GET /api/sla/crv/:id` - Verifier SLA d'un CRV
- `GET /api/sla/phase/:id` - Verifier SLA d'une phase

### Notifications (EXCLUSIF MANAGER)
- `GET /api/notifications` - Voir
- `POST /api/notifications` - **Creer**
- `GET /api/notifications/statistiques` - Stats

### Avions
- Toutes les operations de configuration

---

## PARTIE 6 : CE QUE VOUS NE POUVEZ PAS FAIRE

| Fonctionnalite | Qui peut le faire |
|----------------|-------------------|
| Supprimer des engins | Admin |
| Creer des comptes utilisateurs | Admin |
| Modifier des comptes utilisateurs | Admin |
| Supprimer des comptes utilisateurs | Admin |
| Reinitialiser des mots de passe | Admin |

**Pourquoi ?**
La gestion des utilisateurs est separee de la gestion operationnelle pour des raisons de securite et de gouvernance.

---

## PARTIE 7 : DECISIONS STRATEGIQUES

### 7.1 Definir les objectifs SLA

**Questions a se poser :**
- Quel delai max pour un CRV en BROUILLON ?
- Quel delai max pour terminer un CRV ?
- Quel tolerance pour les retards de phase ?

**Recommandations :**
| Parametre | Valeur recommandee | Valeur stricte |
|-----------|-------------------|----------------|
| CRV BROUILLON max | 120 min | 60 min |
| CRV EN_COURS max | 480 min | 360 min |
| Depassement phase | 15 min | 10 min |

---

### 7.2 Gerer les incidents majeurs

**Process recommande :**

```
1. DETECTION
   - Alerte SLA ou rapport d'equipe
   |
   v
2. EVALUATION
   - Gravite ? Impact ?
   |
   v
3. ACTION IMMEDIATE
   - Mobiliser les ressources
   - Contenir le probleme
   |
   v
4. DOCUMENTATION
   - CRV complete
   - Evenements documentes
   |
   v
5. ANALYSE
   - Causes racines
   - Actions correctives
   |
   v
6. SUIVI
   - Mise en place des corrections
   - Verification efficacite
```

---

### 7.3 Optimiser les ressources

**Analyse des engins :**
- Quels types sont les plus utilises ?
- Y a-t-il des goulots d'etranglement ?
- Faut-il acquerir de nouveaux equipements ?

**Analyse des equipes :**
- Completude par equipe
- Violations SLA par equipe
- Besoins en formation

---

## PARTIE 8 : BONNES PRATIQUES MANAGER

### 8.1 Quotidien

1. **Consulter le rapport SLA** - Premier reflexe du matin
2. **Verifier les alertes** - Traiter les urgences
3. **Surveiller la completude** - Objectif > 80%

### 8.2 Hebdomadaire

1. **Analyser les tendances** - Amelioration ou degradation ?
2. **Revoir les incidents** - Lecons apprises
3. **Communiquer** - Brief aux superviseurs

### 8.3 Mensuel

1. **Rapport de performance** - Objectifs vs realise
2. **Revoir les SLA** - Ajuster si necessaire
3. **Planifier** - Actions d'amelioration

### 8.4 Communication

1. **Notifications claires** - Titre explicite, message concis
2. **Prioriser** - Ne pas tout mettre en CRITIQUE
3. **Suivre** - Verifier que le message est lu

---

## AIDE-MEMOIRE RAPIDE

### Configuration SLA

```
1. GET /api/sla/configuration (voir actuel)
2. Analyser les violations (GET /api/sla/rapport)
3. Ajuster si necessaire (PUT /api/sla/configuration)
4. Surveiller l'impact (POST /api/sla/surveiller/crv)
```

### Creer un engin

```
1. Verifier qu'il n'existe pas (GET /api/engins)
2. Creer (POST /api/engins)
3. Verifier la creation (GET /api/engins/:id)
```

### Envoyer une notification

```
1. Determiner le type (INFO, WARNING, etc.)
2. Rediger titre et message clairs
3. POST /api/notifications
4. Verifier les stats (GET /api/notifications/statistiques)
```

---

## ESCALADE

| Situation | Action |
|-----------|--------|
| Incident de securite majeur | Autorites + Direction |
| Probleme technique systeme | Admin |
| Question RH / comptes | Admin |
| Decision budgetaire | Direction |

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : MANAGER
