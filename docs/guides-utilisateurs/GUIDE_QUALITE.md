# GUIDE UTILISATEUR - QUALITE

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : QUALITE
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes membre du **Service Qualite**. Votre role est de :

- **Controler la conformite** des operations
- **Auditer les CRV** et les processus
- **Analyser les donnees** pour identifier les ecarts
- **Produire des rapports** qualite
- **Recommander des ameliorations**

**IMPORTANT : Vous avez un acces en LECTURE SEULE.**

Vous pouvez tout voir, mais vous ne pouvez rien modifier. C'est volontaire pour garantir l'integrite des donnees operationnelles.

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Se connecter / Gerer son profil | OUI |
| Consulter les programmes de vol | OUI |
| Consulter les bulletins de mouvement | OUI |
| Consulter tous les CRV | OUI |
| Consulter les charges et details | OUI |
| Consulter les engins | OUI |
| Consulter les avions | OUI |
| Consulter les statistiques | OUI |
| Exporter en PDF et Excel | OUI |
| Consulter les notifications | OUI |
| **Creer ou modifier quoi que ce soit** | **NON** |

---

## CE QUE VOUS NE POUVEZ PAS FAIRE

**AUCUNE action de creation ou modification :**

| Action interdite | Raison |
|-----------------|--------|
| Creer un programme | Lecture seule |
| Modifier un programme | Lecture seule |
| Creer un bulletin | Lecture seule |
| Modifier un bulletin | Lecture seule |
| Creer un CRV | Lecture seule |
| Modifier un CRV | Lecture seule |
| Valider/Verrouiller un CRV | Lecture seule |
| Annuler un CRV | Lecture seule |
| Ajouter des charges | Lecture seule |
| Creer des engins | Lecture seule |
| Configurer les SLA | Lecture seule |
| Gerer les utilisateurs | Lecture seule |

**Pourquoi ces restrictions ?**
- Garantir l'integrite des donnees operationnelles
- Separer les roles : operations vs audit
- Eviter les conflits d'interets

---

## PARTIE 1 : CONNEXION ET PROFIL

### 1.1 Se connecter

**Comment faire ?**

1. Ouvrez l'application
2. Entrez votre email et mot de passe
3. Cliquez sur "Connexion"

**Ce qui se passe en coulisses :**
```
POST /api/auth/login
```

---

### 1.2 Consulter votre profil

```
GET /api/auth/me
```

---

### 1.3 Changer votre mot de passe

**C'est la seule modification que vous pouvez faire !**

```
POST /api/auth/changer-mot-de-passe
Body: {
  "ancienMotDePasse": "...",
  "nouveauMotDePasse": "..."
}
```

---

## PARTIE 2 : CONSULTATION DES PROGRAMMES

### 2.1 Voir tous les programmes

**Comment faire ?**

1. Allez dans "Programmes"
2. Consultez la liste

**Ce qui se passe en coulisses :**
```
GET /api/programmes-vol
```

---

### 2.2 Voir le programme actif

```
GET /api/programmes-vol/actif
```

---

### 2.3 Voir le detail d'un programme

```
GET /api/programmes-vol/:id
```

---

### 2.4 Voir les statistiques d'un programme

```
GET /api/programmes-vol/:id/statistiques
```

**Ce que vous pouvez analyser :**
- Nombre de vols par compagnie
- Repartition par jour de la semaine
- Categories de vols (international, regional, cargo)

---

### 2.5 Voir les vols d'un programme

```
GET /api/programmes-vol/:programmeId/vols
```

**Filtres disponibles :**
- Par jour de la semaine
- Par compagnie
- Recherche par numero de vol

---

### 2.6 Telecharger le PDF d'un programme

```
GET /api/programmes-vol/:id/telecharger-pdf
```

ou

```
GET /api/programmes-vol/:id/pdf-base64
```

---

## PARTIE 3 : CONSULTATION DES BULLETINS

### 3.1 Voir tous les bulletins

```
GET /api/bulletins
```

**Filtres disponibles :**
- Par escale
- Par statut (BROUILLON, PUBLIE, ARCHIVE)
- Par periode

---

### 3.2 Voir le bulletin en cours d'une escale

```
GET /api/bulletins/en-cours/:escale
```

Exemple : `GET /api/bulletins/en-cours/NIM`

---

### 3.3 Voir le detail d'un bulletin

```
GET /api/bulletins/:id
```

**Informations accessibles :**
- Liste des mouvements
- Origine de chaque mouvement (programme ou hors programme)
- Statuts des mouvements

---

## PARTIE 4 : CONSULTATION DES CRV

### 4.1 C'est votre outil principal !

En tant que Qualite, les CRV sont votre source principale de donnees pour :
- Audits de conformite
- Analyses de performance
- Identification des ecarts
- Rapports qualite

---

### 4.2 Voir tous les CRV

```
GET /api/crv
```

**Filtres disponibles :**
- Par statut (BROUILLON, EN_COURS, TERMINE, VALIDE, VERROUILLE, ANNULE)
- Par escale
- Par periode
- Par completude

---

### 4.3 Rechercher des CRV

```
GET /api/crv/search?q=ET939
```

**Recherche possible sur :**
- Numero de vol
- Numero de CRV
- Escale

---

### 4.4 Voir le detail d'un CRV

```
GET /api/crv/:id
```

**Informations accessibles :**
- Horaires (prevus et reels)
- Personnel affecte
- Engins utilises
- Charges (passagers, bagages, fret)
- Evenements
- Observations
- Completude
- Historique des modifications

---

### 4.5 Voir les statistiques CRV

```
GET /api/crv/stats
```

**Metriques disponibles :**
- Total par statut
- Completude moyenne
- Repartition par escale
- Evenements par gravite

---

### 4.6 Voir les CRV annules

```
GET /api/crv/annules?dateDebut=...&dateFin=...
```

**Ce que vous pouvez analyser :**
- Taux d'annulation
- Raisons d'annulation
- Tendances

---

### 4.7 Statistiques des annulations

```
GET /api/crv/statistiques/annulations
```

---

### 4.8 Exporter les CRV en Excel

```
GET /api/crv/export?dateDebut=2026-01-01&dateFin=2026-01-31
```

**Tres utile pour :**
- Analyses dans Excel
- Rapports periodiques
- Audits

---

### 4.9 Telecharger le PDF d'un CRV

```
GET /api/crv/:id/telecharger-pdf
```

ou

```
GET /api/crv/:id/pdf-base64
```

---

### 4.10 Voir les informations d'archivage

```
GET /api/crv/:id/archivage
```

**Ce que vous pouvez verifier :**
- Le CRV est-il archive ?
- Date d'archivage
- Lien vers le document dans Drive

---

## PARTIE 5 : CONSULTATION DES CHARGES

### 5.1 Voir le detail d'une charge

```
GET /api/charges/:id
```

**Informations accessibles :**
- Type (PASSAGERS, BAGAGES, FRET)
- Sens (EMBARQUEMENT, DEBARQUEMENT)
- Totaux
- Categories detaillees
- Classes (premiere, affaires, eco)
- Besoins medicaux
- Mineurs
- Marchandises dangereuses

---

### 5.2 Statistiques passagers globales

```
GET /api/charges/statistiques/passagers?dateDebut=...&dateFin=...
```

**Filtres disponibles :**
- Par periode
- Par compagnie

---

### 5.3 Statistiques passagers d'un CRV

```
GET /api/charges/crv/:crvId/statistiques-passagers
```

---

### 5.4 Statistiques fret globales

```
GET /api/charges/statistiques/fret?dateDebut=...&dateFin=...
```

---

### 5.5 Statistiques fret d'un CRV

```
GET /api/charges/crv/:crvId/statistiques-fret
```

---

### 5.6 Voir les marchandises dangereuses

```
GET /api/charges/marchandises-dangereuses
```

**Ce que vous pouvez auditer :**
- Conformite des declarations DGR
- Completude des informations
- Codes ONU corrects

---

## PARTIE 6 : CONSULTATION DES PHASES

### 6.1 Voir toutes les phases

```
GET /api/phases
```

---

### 6.2 Voir le detail d'une phase

```
GET /api/phases/:id
```

**Informations accessibles :**
- Heure de debut prevue / reelle
- Heure de fin prevue / reelle
- Statut
- Motif de non-realisation (si applicable)
- Remarques

---

## PARTIE 7 : CONSULTATION DES ENGINS

### 7.1 Voir tous les engins

```
GET /api/engins
```

---

### 7.2 Voir les types d'engins

```
GET /api/engins/types
```

---

### 7.3 Voir le detail d'un engin

```
GET /api/engins/:id
```

---

## PARTIE 8 : CONSULTATION DES AVIONS

### 8.1 Voir tous les avions

```
GET /api/avions
```

---

### 8.2 Voir le detail d'un avion

```
GET /api/avions/:id
```

---

### 8.3 Voir les configurations

```
GET /api/avions/statistiques/configurations
```

---

### 8.4 Voir les revisions prevues

```
GET /api/avions/revisions/prochaines
```

---

### 8.5 Voir l'historique des versions d'un avion

```
GET /api/avions/:id/versions
```

---

### 8.6 Comparer deux versions

```
GET /api/avions/:id/versions/comparer?version1=1&version2=2
```

---

## PARTIE 9 : NOTIFICATIONS

### 9.1 Voir vos notifications

```
GET /api/notifications
```

---

### 9.2 Compter les non lues

```
GET /api/notifications/count-non-lues
```

---

### 9.3 Marquer comme lue

```
PATCH /api/notifications/:id/lire
```

---

### 9.4 Marquer toutes comme lues

```
PATCH /api/notifications/lire-toutes
```

---

## PARTIE 10 : AUDITS ET ANALYSES

### 10.1 Audit de conformite CRV

**Points a verifier :**

| Element | Verification | Endpoint |
|---------|--------------|----------|
| Completude | >= 80% pour les VERROUILLE | `GET /api/crv?statut=VERROUILLE` |
| Besoins medicaux | Remplis si passagers MEDA | `GET /api/charges/:id` |
| Mineurs UM | Remplis si UM a bord | `GET /api/charges/:id` |
| Marchandises DGR | Declarations completes | `GET /api/charges/marchandises-dangereuses` |
| Evenements | Documentes correctement | `GET /api/crv/:id` (section evenements) |
| Archivage | CRV verrouilles archives | `GET /api/crv/:id/archivage` |

---

### 10.2 Audit de performance

**Metriques a suivre :**

| Metrique | Source | Objectif |
|----------|--------|----------|
| Completude moyenne | `GET /api/crv/stats` | > 80% |
| CRV verrouilles/jour | Export Excel | Selon volume |
| Taux d'annulation | `GET /api/crv/statistiques/annulations` | < 5% |
| Evenements CRITIQUE | `GET /api/crv/stats` | 0 |
| Retards documentes | Analyse des observations | 100% |

---

### 10.3 Rapport qualite mensuel

**Structure recommandee :**

```
1. RESUME EXECUTIF
   - Indicateurs cles du mois
   - Comparaison avec le mois precedent

2. CONFORMITE
   - Taux de completude
   - Besoins medicaux et UM
   - Marchandises dangereuses

3. PERFORMANCE
   - Volumes traites
   - Temps de traitement
   - Taux d'annulation

4. INCIDENTS
   - Evenements par gravite
   - Analyse des causes
   - Actions correctives

5. RECOMMANDATIONS
   - Ameliorations proposees
   - Formations necessaires
```

---

### 10.4 Indicateurs reglementaires

**Conformite DGAC/OACI :**

| Exigence | Comment verifier |
|----------|------------------|
| Tracabilite passagers MEDA | `GET /api/charges/:id` - champ besoinsMedicaux |
| Tracabilite mineurs UM | `GET /api/charges/:id` - champ mineurs |
| Declaration DGR | `GET /api/charges/marchandises-dangereuses` |
| Documentation des incidents | Evenements dans les CRV |

---

## PARTIE 11 : BONNES PRATIQUES QUALITE

### 11.1 Audit regulier

1. **Quotidien** : Verifier les CRV du jour precedent
2. **Hebdomadaire** : Analyse des tendances
3. **Mensuel** : Rapport complet

### 11.2 Methodologie d'audit

1. **Echantillonnage** : Selectionner des CRV representatifs
2. **Verification** : Controler chaque section
3. **Documentation** : Noter les ecarts trouves
4. **Recommandation** : Proposer des corrections

### 11.3 Communication des resultats

1. **Rapport ecrit** : Factuel et objectif
2. **Presentation** : Aux managers concernee
3. **Suivi** : Verifier la mise en oeuvre des corrections

### 11.4 Independance

1. **Ne pas modifier** : Vous observez, vous ne corrigez pas
2. **Objectivite** : Basez-vous sur les faits
3. **Confidentialite** : Les donnees sont sensibles

---

## AIDE-MEMOIRE RAPIDE

### Audit CRV journalier

```
1. GET /api/crv?statut=VERROUILLE&dateDebut=hier
2. Pour chaque CRV :
   - Verifier completude >= 80%
   - Verifier besoins medicaux si applicable
   - Verifier mineurs UM si applicable
   - Verifier evenements documentes
3. Noter les ecarts
4. Remonter au Manager si probleme grave
```

### Export pour analyse

```
1. GET /api/crv/export?dateDebut=...&dateFin=...
2. Ouvrir dans Excel
3. Analyser les tendances
4. Produire les graphiques
5. Rediger le rapport
```

### Verifier la conformite DGR

```
1. GET /api/charges/marchandises-dangereuses
2. Pour chaque declaration :
   - Code ONU valide ?
   - Classe correcte ?
   - Quantite et unite renseignees ?
   - Groupe emballage indique ?
```

---

## CONTACTS

| Situation | Contact |
|-----------|---------|
| Question sur un CRV | Superviseur de l'escale |
| Ecart grave detecte | Manager |
| Probleme d'acces | Admin |

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : QUALITE (Lecture seule)
