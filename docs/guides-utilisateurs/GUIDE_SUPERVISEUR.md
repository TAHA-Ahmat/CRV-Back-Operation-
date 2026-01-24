# GUIDE UTILISATEUR - SUPERVISEUR

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : SUPERVISEUR
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes **Superviseur**, responsable de la supervision globale des operations d'escale. Votre role est de :

- **Superviser plusieurs equipes** et leurs chefs
- **Garantir la qualite** des operations sur l'ensemble de l'escale
- **Coordonner les situations complexes** (retards majeurs, incidents)
- **Analyser les performances** via les statistiques
- **Assurer la liaison** avec les compagnies et partenaires

**Vous avez une vision globale et intervenez sur les cas complexes.**

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Tout ce qu'un Chef d'Equipe peut faire | OUI |
| Superviser toutes les equipes | OUI |
| Valider et verrouiller tous les CRV | OUI |
| Consulter toutes les statistiques | OUI |
| Gerer les annulations de CRV | OUI |
| Archiver les CRV dans Google Drive | OUI |
| Creer/Modifier des engins | NON |
| Gerer les utilisateurs | NON |
| Configurer les SLA | NON |
| Rapport SLA complet | NON |

---

## PARTIE 1 : VOTRE VISION GLOBALE

### 1.1 Tableau de bord du Superviseur

**Ce que vous devez surveiller chaque jour :**

| Indicateur | Action |
|------------|--------|
| CRV en BROUILLON depuis longtemps | Relancer l'equipe concernee |
| CRV en TERMINE en attente | S'assurer que les chefs valident |
| CRV avec evenements MAJEUR/CRITIQUE | Suivre personnellement |
| Completude moyenne < 70% | Identifier les causes |
| CRV annules | Verifier les raisons |

---

### 1.2 Consulter tous les CRV

**Difference avec le Chef d'Equipe :**
Vous voyez **tous** les CRV, pas seulement ceux de votre equipe.

**Comment faire ?**

1. Allez dans "CRV"
2. Utilisez les filtres avances :
   - Par statut
   - Par escale
   - Par periode
   - Par completude

**Ce qui se passe en coulisses :**
```
GET /api/crv?statut=EN_COURS&completude_lt=50
```

---

### 1.3 Rechercher un CRV specifique

**Cas d'usage :**
Une compagnie vous demande des informations sur un vol specifique.

**Comment faire ?**

1. Allez dans "CRV"
2. Utilisez la recherche
3. Tapez le numero de vol, la date, ou le numero CRV

**Ce qui se passe en coulisses :**
```
GET /api/crv/search?q=ET939
```

---

## PARTIE 2 : GESTION DES SITUATIONS COMPLEXES

### 2.1 Gerer les CRV problematiques

**Cas : CRV bloque en BROUILLON**

Causes possibles :
- Agent absent ou deborde
- Probleme technique
- Oubli

**Action :**
1. Identifier le CRV concerne
2. Contacter le chef d'equipe responsable
3. Si necessaire, reprendre la saisie vous-meme

---

**Cas : CRV avec completude faible**

Causes possibles :
- Agent peu forme
- Informations manquantes
- Urgence sur le terrain

**Action :**
1. Identifier les sections manquantes
2. Contacter l'equipe pour completer
3. Si impossible, documenter dans les observations

---

**Cas : Evenement CRITIQUE**

**Votre responsabilite :**
Les evenements de gravite CRITIQUE necessitent votre attention personnelle.

**Action :**
1. Lire le detail de l'evenement
2. Verifier que tout est correctement documente
3. Informer le Manager si necessaire
4. Suivre jusqu'a resolution

---

### 2.2 Gerer les annulations

**Voir les CRV annules :**

```
GET /api/crv/annules
```

**Filtres disponibles :**
- Par periode (`dateDebut`, `dateFin`)
- Par raison d'annulation

**Verifier les statistiques d'annulation :**

```
GET /api/crv/statistiques/annulations
```

**Ce que vous devez surveiller :**
- Taux d'annulation anormal
- Raisons recurrentes
- Patterns (certains jours, certaines compagnies)

---

### 2.3 Reactiver un CRV annule par erreur

**Quand le faire ?**
- Le vol a finalement opere
- L'annulation etait une erreur

**Comment faire ?**

1. Trouvez le CRV annule
2. Cliquez sur "Reactiver"
3. Le CRV reprend son ancien statut

**Ce qui se passe en coulisses :**
```
POST /api/crv/:id/reactiver
```

---

## PARTIE 3 : ARCHIVAGE ET EXPORTS

### 3.1 Archiver un CRV dans Google Drive

**Qu'est-ce que c'est ?**
L'archivage sauvegarde le PDF du CRV dans Google Drive pour conservation legale.

**Quand archiver ?**
Une fois le CRV **VERROUILLE** (finalise).

**Comment faire ?**

1. Ouvrez le CRV VERROUILLE
2. Verifiez qu'il peut etre archive
3. Cliquez sur "Archiver"

**Ce qui se passe en coulisses :**

Verification :
```
GET /api/crv/:id/archive/status
```

Archivage :
```
POST /api/crv/:id/archive
```

**Resultat :**
- Un PDF est genere
- Il est uploade sur Google Drive
- Un lien permanent est enregistre

---

### 3.2 Verifier le statut d'archivage

**Comment faire ?**

1. Dans la liste des CRV
2. La colonne "Archivage" indique :
   - Archive (vert) : avec lien vers Drive
   - En attente (orange) : peut etre archive
   - Non applicable : CRV pas encore verrouille

**Ce qui se passe en coulisses :**
```
GET /api/crv/:id/archivage
```

**Reponse :**
```json
{
  "isArchived": true,
  "archivage": {
    "driveFileId": "1abc...xyz",
    "driveWebViewLink": "https://drive.google.com/file/...",
    "filename": "CRV_NIM_20260120_001.pdf",
    "archivedAt": "2026-01-20T16:00:00.000Z"
  }
}
```

---

### 3.3 Verifier le service d'archivage

**Comment faire ?**

**Ce qui se passe en coulisses :**
```
GET /api/crv/archive/status
```

**Resultat :**
Indique si le service Google Drive est operationnel.

---

### 3.4 Export Excel avance

**Votre usage specifique :**
Extraire des donnees pour analyse ou reporting.

**Filtres avances :**

```
GET /api/crv/export?dateDebut=2026-01-01&dateFin=2026-01-31&statut=VERROUILLE&escale=NIM
```

**Utilisations :**
- Rapport mensuel
- Analyse des incidents
- Statistiques par compagnie
- Audit qualite

---

## PARTIE 4 : STATISTIQUES ET ANALYSE

### 4.1 Statistiques globales CRV

**Comment acceder ?**

```
GET /api/crv/stats
```

**Informations disponibles :**
- Total CRV par statut
- Completude moyenne
- Repartition par escale
- Evenements par gravite
- Tendances

---

### 4.2 Statistiques des programmes

**Pour chaque programme :**

```
GET /api/programmes-vol/:id/statistiques
```

**Informations :**
- Nombre de vols
- Repartition par compagnie
- Repartition par jour
- Categories de vols

---

### 4.3 Statistiques passagers

**Globales :**
```
GET /api/charges/statistiques/passagers?dateDebut=...&dateFin=...
```

**Par CRV :**
```
GET /api/charges/crv/:crvId/statistiques-passagers
```

---

### 4.4 Statistiques fret

**Globales :**
```
GET /api/charges/statistiques/fret?dateDebut=...&dateFin=...
```

**Par CRV :**
```
GET /api/charges/crv/:crvId/statistiques-fret
```

---

## PARTIE 5 : COORDINATION INTER-EQUIPES

### 5.1 Communication avec les Chefs d'Equipe

**Votre role :**
- Transmettre les consignes du Manager
- Remonter les problemes terrain
- Coordonner entre equipes

**Points de coordination :**
- Debut de service : Brief des priorites
- Pendant : Suivi des situations
- Fin : Debrief et passation

---

### 5.2 Liaison avec les compagnies

**Cas frequents :**
- Demande d'information sur un vol
- Reclamation passager
- Incident a documenter

**Comment repondre ?**
1. Recherchez le CRV concerne
2. Exportez le PDF si necessaire
3. Fournissez les informations factuelles

---

## PARTIE 6 : FONCTIONNALITES COMPLETES

En tant que Superviseur, vous avez acces a **toutes les fonctionnalites operationnelles** :

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil
- `POST /api/auth/changer-mot-de-passe` - Changer MDP

### Programmes de Vol
- `GET /api/programmes-vol` - Liste
- `GET /api/programmes-vol/actif` - Programme actif
- `GET /api/programmes-vol/:id` - Detail
- `POST /api/programmes-vol` - Creer
- `PATCH /api/programmes-vol/:id` - Modifier
- `DELETE /api/programmes-vol/:id` - Supprimer
- `POST /api/programmes-vol/:id/valider` - Valider
- `POST /api/programmes-vol/:id/activer` - Activer
- `POST /api/programmes-vol/:id/suspendre` - Suspendre
- `POST /api/programmes-vol/:id/dupliquer` - Dupliquer
- `GET /api/programmes-vol/:id/statistiques` - Stats
- Gestion des vols dans le programme

### Bulletins de Mouvement
- Toutes les operations CRUD
- Creation depuis programme
- Publication et archivage

### CRV
- Toutes les operations CRUD
- Demarrer, terminer, valider, verrouiller
- Annuler et reactiver
- Archivage Google Drive
- Export PDF et Excel

### Charges
- Toutes les operations
- Besoins medicaux
- Mineurs
- Marchandises dangereuses

### Phases
- Demarrer, terminer, non-realise

### Engins (lecture seule)
- `GET /api/engins` - Liste
- `GET /api/engins/types` - Types
- `GET /api/engins/disponibles` - Disponibles
- `GET /api/engins/:id` - Detail

### Statistiques
- Toutes les statistiques operationnelles

---

## PARTIE 7 : CE QUE VOUS NE POUVEZ PAS FAIRE

| Fonctionnalite | Qui peut le faire |
|----------------|-------------------|
| Creer/Modifier des engins | Manager, Admin |
| Supprimer des engins | Admin |
| Gerer les utilisateurs | Admin |
| Configurer les SLA | Manager |
| Rapport SLA complet | Manager |
| Creer notifications systeme | Manager |

---

## PARTIE 8 : BONNES PRATIQUES SUPERVISEUR

### 8.1 Vision globale

1. **Commencez par les indicateurs** - Tableau de bord
2. **Identifiez les anomalies** - CRV bloques, completude faible
3. **Priorisez** - Urgences d'abord

### 8.2 Gestion des incidents

1. **Reagissez vite** - Les evenements CRITIQUE necessitent attention immediate
2. **Documentez tout** - Observations, actions prises
3. **Escaladez si necessaire** - Vers le Manager
4. **Suivez jusqu'au bout** - Ne laissez pas en suspens

### 8.3 Qualite des operations

1. **Surveillez la completude** - Objectif > 80%
2. **Verifiez les conformites** - Besoins medicaux, UM
3. **Analysez les tendances** - Problemes recurrents
4. **Formez et conseillez** - Les chefs et agents

### 8.4 Archivage

1. **Archivez regulierement** - Ne laissez pas s'accumuler
2. **Verifiez le service** - Google Drive operationnel
3. **Conservez les liens** - Pour reference future

---

## AIDE-MEMOIRE RAPIDE

### Check quotidien

```
1. Verifier CRV en BROUILLON (anciens)
2. Verifier CRV en TERMINE (a valider)
3. Verifier CRV avec evenements MAJEUR/CRITIQUE
4. Verifier completude moyenne
5. Archiver les CRV VERROUILLE non archives
```

### Gerer un incident

```
1. Identifier le CRV concerne
2. Lire l'evenement en detail
3. Contacter l'equipe sur place
4. Documenter les actions
5. Informer le Manager si necessaire
6. Suivre jusqu'a resolution
```

### Archiver un CRV

```
1. Verifier statut VERROUILLE
2. GET /api/crv/:id/archive/status (verifier si archivable)
3. POST /api/crv/:id/archive (archiver)
4. Verifier le lien Drive genere
```

---

## ESCALADE

| Situation | Escalader vers |
|-----------|----------------|
| Incident de securite | Manager + autorites |
| Probleme technique majeur | Admin |
| Decision strategique | Manager |
| Conflit avec compagnie | Manager |
| Question reglementaire | Manager + Qualite |

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : SUPERVISEUR
