# GUIDES UTILISATEURS CRV

> **Documentation complete par role utilisateur**
>
> Version : 1.0 | Date : 2026-01-24

---

## PRESENTATION

Ce dossier contient les guides utilisateurs de l'application CRV (Compte Rendu de Vol).

**Chaque guide est adapte a un role specifique** et explique :
- Ce que l'utilisateur peut faire
- Ce qu'il ne peut pas faire
- Comment utiliser chaque fonctionnalite
- Les bonnes pratiques

---

## LISTE DES GUIDES

| Fichier | Role | Description |
|---------|------|-------------|
| [GUIDE_AGENT_ESCALE.md](./GUIDE_AGENT_ESCALE.md) | Agent d'Escale | Agent terrain, saisie CRV |
| [GUIDE_CHEF_EQUIPE.md](./GUIDE_CHEF_EQUIPE.md) | Chef d'Equipe | Supervision d'equipe, validation CRV |
| [GUIDE_SUPERVISEUR.md](./GUIDE_SUPERVISEUR.md) | Superviseur | Vision globale, coordination |
| [GUIDE_MANAGER.md](./GUIDE_MANAGER.md) | Manager | Decisions strategiques, SLA, engins |
| [GUIDE_QUALITE.md](./GUIDE_QUALITE.md) | Qualite | Audit et conformite (lecture seule) |
| [GUIDE_ADMIN.md](./GUIDE_ADMIN.md) | Administrateur | Gestion des utilisateurs |

---

## MATRICE DES PERMISSIONS

### Vue d'ensemble

| Fonctionnalite | AGENT | CHEF | SUPERVISEUR | MANAGER | QUALITE | ADMIN |
|----------------|:-----:|:----:|:-----------:|:-------:|:-------:|:-----:|
| **CONNEXION** |
| Se connecter | X | X | X | X | X | X |
| Modifier son profil | X | X | X | X | X | X |
| Changer son MDP | X | X | X | X | X | X |
| **PROGRAMMES** |
| Consulter | X | X | X | X | X | X |
| Creer/Modifier | X | X | X | X | - | - |
| Valider/Activer | X | X | X | X | - | - |
| **BULLETINS** |
| Consulter | X | X | X | X | X | X |
| Creer/Modifier | X | X | X | X | - | - |
| Publier | X | X | X | X | - | - |
| **CRV** |
| Consulter | X | X | X | X | X | X |
| Creer/Modifier | X | X | X | X | - | - |
| Valider/Verrouiller | X | X | X | X | - | - |
| Annuler/Reactiver | X | X | X | X | - | - |
| Archiver | X | X | X | X | - | - |
| Export PDF/Excel | X | X | X | X | X | X |
| **CHARGES** |
| Consulter | X | X | X | X | X | X |
| Modifier | X | X | X | X | - | - |
| Besoins medicaux | X | X | X | X | - | - |
| Mineurs UM | X | X | X | X | - | - |
| **ENGINS** |
| Consulter | X | X | X | X | X | X |
| Creer/Modifier | - | - | - | X | - | X |
| Supprimer | - | - | - | - | - | X |
| **SLA** |
| Consulter config | X | X | X | X | X | X |
| Modifier config | - | - | - | X | - | - |
| Rapport complet | - | - | - | X | - | - |
| Surveiller | - | - | - | X | - | - |
| **NOTIFICATIONS** |
| Recevoir/Lire | X | X | X | X | X | X |
| Creer | - | - | - | X | - | - |
| **UTILISATEURS** |
| Consulter | X | X | X | X | X | X |
| Creer/Modifier | - | - | - | - | - | X |
| Supprimer | - | - | - | - | - | X |

**Legende :** X = Autorise, - = Non autorise

---

## HIERARCHIE DES ROLES

```
                    ADMIN
                      |
                   (technique)
                      |
    +-----------------+------------------+
    |                                    |
 MANAGER                              QUALITE
    |                                 (audit)
    | (operationnel)
    |
 SUPERVISEUR
    |
 CHEF_EQUIPE
    |
 AGENT_ESCALE
```

---

## DESCRIPTION DES ROLES

### AGENT_ESCALE
- **Qui ?** Agent de terrain
- **Responsabilite principale :** Saisir les CRV en temps reel
- **Niveau d'acces :** Operations de base

### CHEF_EQUIPE
- **Qui ?** Chef d'une equipe d'agents
- **Responsabilite principale :** Superviser et valider les CRV
- **Niveau d'acces :** Operations + validation

### SUPERVISEUR
- **Qui ?** Superviseur de plusieurs equipes
- **Responsabilite principale :** Vision globale, coordination
- **Niveau d'acces :** Operations + archivage + statistiques

### MANAGER
- **Qui ?** Responsable strategique
- **Responsabilite principale :** Decisions, SLA, ressources
- **Niveau d'acces :** Operations + SLA + engins + notifications

### QUALITE
- **Qui ?** Service qualite
- **Responsabilite principale :** Audit et conformite
- **Niveau d'acces :** **Lecture seule**

### ADMIN
- **Qui ?** Administrateur systeme
- **Responsabilite principale :** Gestion des comptes
- **Niveau d'acces :** Utilisateurs + engins (pas operations)

---

## CONFORMITE REGLEMENTAIRE

Les guides documentent la conformite avec :

| Reglementation | Domaine | Guide concerne |
|----------------|---------|----------------|
| IATA DGR | Marchandises dangereuses | Agent, Chef |
| IATA DGR | Besoins medicaux (MEDA) | Agent, Chef |
| OACI Annexe 6 | Accompagnement medical | Agent, Chef |
| DGAC | Mineurs non accompagnes (UM) | Agent, Chef |
| EU 1107/2006 | Passagers handicapes (PMR) | Agent, Chef |

---

## COMMENT UTILISER CES GUIDES

1. **Identifiez votre role** dans l'application
2. **Lisez le guide correspondant** en entier
3. **Gardez-le comme reference** pour les procedures
4. **Consultez la partie "Ce que vous ne pouvez pas faire"** pour eviter les erreurs

---

## MISE A JOUR

Ces guides doivent etre mis a jour a chaque :
- Ajout de fonctionnalite
- Modification de permission
- Changement de procedure

**Derniere mise a jour :** 2026-01-24

---

## CONTACT

Pour toute question sur ces guides :
- **Questions operationnelles :** Votre Manager
- **Questions techniques :** L'Administrateur
- **Questions sur les permissions :** L'Administrateur

---

> **Version** : 1.0
>
> **Auteur** : Equipe Backend CRV
