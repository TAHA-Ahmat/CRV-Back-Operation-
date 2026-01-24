# GUIDE UTILISATEUR - CHEF D'EQUIPE

> **Votre guide complet pour utiliser l'application CRV**
>
> Role : CHEF_EQUIPE
>
> Version : 1.0 | Date : 2026-01-24

---

## QUI ETES-VOUS ?

Vous etes **Chef d'Equipe**, le lien entre le terrain et la supervision. Votre role est de :

- **Superviser les agents d'escale** de votre equipe
- **Verifier la qualite** des CRV saisis par vos agents
- **Valider les CRV** avant qu'ils ne soient verrouilles
- **Intervenir en cas de probleme** sur le terrain
- **Coordonner les operations** de votre equipe

**Vous avez les memes droits qu'un Agent d'Escale, plus un role de supervision.**

---

## CE QUE VOUS POUVEZ FAIRE

### Resume de vos droits

| Fonctionnalite | Autorisation |
|----------------|--------------|
| Tout ce qu'un Agent d'Escale peut faire | OUI |
| Consulter les CRV de votre equipe | OUI |
| Valider et verrouiller les CRV | OUI |
| Deverrouiller les CRV (avec raison) | OUI |
| Consulter les statistiques | OUI |
| Creer/Modifier des engins | NON |
| Gerer les utilisateurs | NON |
| Configurer les SLA | NON |
| Voir les rapports SLA complets | NON |

---

## PARTIE 1 : VOS RESPONSABILITES SPECIFIQUES

### 1.1 Superviser les CRV de votre equipe

**Votre role de chef :**
- Verifier que les agents saisissent correctement les CRV
- S'assurer que les informations sont completes
- Valider les CRV une fois qu'ils sont termines

**Comment voir les CRV en attente ?**

1. Allez dans "CRV"
2. Filtrez par statut "TERMINE"
3. Ces CRV attendent votre validation

**Ce qui se passe en coulisses :**
```
GET /api/crv?statut=TERMINE
```

---

### 1.2 Controler la qualite des saisies

**Points a verifier avant de valider un CRV :**

| Element | Verification |
|---------|--------------|
| Horaires | Les heures sont coherentes avec le planning |
| Personnel | Tous les intervenants sont listes |
| Charges | Les chiffres correspondent au manifeste |
| Besoins medicaux | Saisis si des passagers MEDA etaient a bord |
| Mineurs (UM) | Saisis si des UM etaient a bord |
| Evenements | Tout incident est documente |
| Completude | Au moins 50% (idealement 80%+) |

---

### 1.3 Valider un CRV

**Quand valider ?**
Quand vous avez verifie que toutes les informations sont correctes.

**Comment faire ?**

1. Ouvrez le CRV en statut TERMINE
2. Verifiez toutes les sections
3. Cliquez sur "Valider"

**Ce qui se passe en coulisses :**
```
POST /api/validation/:id/valider
```

**Resultat :**
- Le CRV passe en statut VALIDE
- Votre nom est enregistre comme validateur

---

### 1.4 Rejeter un CRV pour correction

**Quand rejeter ?**
Quand des erreurs ou des oublis sont detectes.

**Comment faire ?**

1. Ouvrez le CRV en statut TERMINE
2. Notez les problemes identifies
3. Utilisez le bouton "Renvoyer pour correction" ou demandez a l'agent de corriger

**Note importante :**
Il n'existe pas d'endpoint `/rejeter`. Le processus est :
1. Demandez a l'agent de modifier le CRV (s'il est encore modifiable)
2. Ou utilisez `/deverrouiller` si le CRV est deja verrouille

---

### 1.5 Deverrouiller un CRV

**Quand le faire ?**
Quand une erreur est detectee dans un CRV deja verrouille.

**Important :** Vous devez fournir une raison valable.

**Comment faire ?**

1. Ouvrez le CRV VERROUILLE
2. Cliquez sur "Deverrouiller"
3. Saisissez la raison :
   - Exemple : "Erreur sur le nombre de passagers - correction necessaire"
4. Confirmez

**Ce qui se passe en coulisses :**
```
POST /api/validation/:id/deverrouiller
Body: {
  "raison": "Erreur sur le nombre de passagers PMR. Signale par la compagnie."
}
```

**Resultat :**
- Le CRV repasse en statut EN_COURS
- L'agent peut le modifier
- Un historique est garde de qui a deverrouille et pourquoi

---

## PARTIE 2 : FONCTIONNALITES IDENTIQUES A L'AGENT

En tant que Chef d'Equipe, vous avez acces a **toutes les fonctionnalites** de l'Agent d'Escale :

### Connexion et Profil
- Se connecter (`POST /api/auth/login`)
- Consulter son profil (`GET /api/auth/me`)
- Changer son mot de passe (`POST /api/auth/changer-mot-de-passe`)

### Programmes de Vol
- Consulter les programmes (`GET /api/programmes-vol`)
- Voir le programme actif (`GET /api/programmes-vol/actif`)
- Creer un programme (`POST /api/programmes-vol`)
- Ajouter des vols (`POST /api/programmes-vol/:id/vols`)
- Valider un programme (`POST /api/programmes-vol/:id/valider`)
- Activer un programme (`POST /api/programmes-vol/:id/activer`)
- Dupliquer un programme (`POST /api/programmes-vol/:id/dupliquer`)
- Voir les statistiques (`GET /api/programmes-vol/:id/statistiques`)

### Bulletins de Mouvement
- Consulter les bulletins (`GET /api/bulletins`)
- Creer un bulletin (`POST /api/bulletins`)
- Creer depuis programme (`POST /api/bulletins/depuis-programme`)
- Ajouter des mouvements (`POST /api/bulletins/:id/mouvements`)
- Ajouter des vols hors programme (`POST /api/bulletins/:id/mouvements/hors-programme`)
- Publier un bulletin (`POST /api/bulletins/:id/publier`)

### CRV (Comptes Rendus de Vol)
- Tout ce qu'un agent peut faire (voir Guide Agent d'Escale)
- Plus : validation et verrouillage des CRV des agents

### Charges
- Saisir les charges passagers, bagages, fret
- Saisir les besoins medicaux (`PUT /api/charges/:id/besoins-medicaux`)
- Saisir les mineurs (`PUT /api/charges/:id/mineurs`)
- Saisir les marchandises dangereuses

### Phases
- Demarrer, terminer, marquer non realise

---

## PARTIE 3 : WORKFLOW DE SUPERVISION

### Workflow type d'une journee

```
1. DEBUT DE SERVICE
   |
   +-- Consulter les vols du jour (bulletin)
   +-- Verifier les CRV en cours de vos agents
   |
2. PENDANT LE SERVICE
   |
   +-- Supporter les agents en cas de question
   +-- Verifier les CRV en temps reel
   +-- Intervenir en cas de probleme
   |
3. FIN DE SERVICE
   |
   +-- Valider les CRV TERMINES
   +-- Verrouiller les CRV VALIDES
   +-- S'assurer que tout est documente
```

---

### Processus de validation

```
Agent saisit le CRV
        |
        v
Agent termine le CRV (TERMINE)
        |
        v
+------------------+
| VOTRE TRAVAIL    |
| Chef d'Equipe    |
+------------------+
        |
        v
Vous verifiez le CRV
        |
   +----+----+
   |         |
   v         v
CORRECT   INCORRECT
   |         |
   v         v
Valider   Demander
le CRV    correction
   |         |
   v         v
VALIDE    Agent corrige
   |         |
   v         +---> (retour verification)
Verrouiller
   |
   v
VERROUILLE (fin)
```

---

## PARTIE 4 : POINTS D'ATTENTION POUR LE CHEF

### 4.1 Verifier les besoins medicaux

**Pourquoi c'est important ?**
- Obligatoire reglementairement (DGAC/OACI)
- Responsabilite en cas d'incident

**Ce que vous devez verifier :**
- Si le vol avait des passagers MEDA, les champs sont-ils remplis ?
- Les nombres correspondent-ils au manifeste de vol ?

**Champs a verifier :**
```json
{
  "oxygeneBord": "Nombre de passagers avec oxygene",
  "brancardier": "Nombre de passagers sur civiere",
  "accompagnementMedical": "Nombre avec accompagnement medical"
}
```

---

### 4.2 Verifier les mineurs non accompagnes (UM)

**Pourquoi c'est important ?**
- Protection des mineurs
- Tracabilite obligatoire

**Ce que vous devez verifier :**
- Si le vol avait des UM, les champs sont-ils remplis ?
- Le nombre correspond-il au manifeste ?

**Champs a verifier :**
```json
{
  "mineurNonAccompagne": "Nombre d'UM",
  "bebeNonAccompagne": "Cas exceptionnels"
}
```

---

### 4.3 Verifier la completude

**Qu'est-ce que la completude ?**
Un pourcentage qui indique combien le CRV est complet.

**Seuils recommandes :**
| Completude | Interpretation |
|------------|----------------|
| < 50% | **Insuffisant** - Ne pas valider |
| 50-70% | Acceptable mais ameliorable |
| 70-90% | Bon |
| > 90% | Excellent |

**Comment ameliorer la completude ?**
- S'assurer que toutes les sections sont remplies
- Confirmer les absences quand il n'y a rien a signaler

---

### 4.4 Gerer les conflits ou problemes

**Cas : Un agent refuse de corriger une erreur**
1. Discutez avec l'agent pour comprendre
2. Si necessaire, faites la correction vous-meme
3. Documentez dans les observations

**Cas : Incertitude sur une information**
1. Verifiez avec les sources (manifeste, compagnie)
2. En cas de doute, ajoutez une observation
3. Ne validez pas si vous n'etes pas sur

**Cas : CRV verrouille avec erreur**
1. Utilisez le deverrouillage (`POST /api/validation/:id/deverrouiller`)
2. Documentez la raison
3. Faites corriger puis re-validez

---

## PARTIE 5 : STATISTIQUES ET SUIVI

### 5.1 Consulter les statistiques CRV

**Comment faire ?**

1. Allez dans "CRV"
2. Cliquez sur "Statistiques"

**Ce qui se passe en coulisses :**
```
GET /api/crv/stats
```

**Informations disponibles :**
- Nombre de CRV par statut
- Completude moyenne
- CRV par escale
- Evenements par gravite

---

### 5.2 Exporter pour analyse

**Export Excel :**
```
GET /api/crv/export?dateDebut=...&dateFin=...
```

Vous pouvez ensuite analyser dans Excel :
- Performance de votre equipe
- Types d'evenements frequents
- Completude moyenne

---

## PARTIE 6 : CE QUE VOUS NE POUVEZ PAS FAIRE

| Fonctionnalite | Pourquoi | Qui peut le faire |
|----------------|----------|-------------------|
| Creer des engins | Gestion du parc materiel | Manager, Admin |
| Supprimer des engins | Action sensible | Admin |
| Gerer les utilisateurs | Comptes utilisateurs | Admin |
| Configurer les SLA | Parametrage systeme | Manager |
| Rapport SLA complet | Vision strategique | Manager |
| Creer notifications systeme | Communication globale | Manager |

---

## PARTIE 7 : BONNES PRATIQUES CHEF D'EQUIPE

### 7.1 Avant le service

1. **Consultez le bulletin du jour** - Sachez quels vols vont arriver
2. **Verifiez les CRV en attente** - Y a-t-il des TERMINES a valider ?
3. **Briefez votre equipe** - Points d'attention du jour

### 7.2 Pendant le service

1. **Restez disponible** - Les agents doivent pouvoir vous joindre
2. **Verifiez regulierement** - Ne laissez pas les CRV s'accumuler
3. **Intervenez rapidement** - En cas de probleme ou incident

### 7.3 En fin de service

1. **Validez tous les CRV TERMINES** - Ne laissez pas en attente
2. **Verrouillez les CRV VALIDES** - Finalisez la journee
3. **Passez le relai** - Informez l'equipe suivante des points en cours

### 7.4 Qualite des validations

1. **Ne validez pas a l'aveugle** - Lisez vraiment le CRV
2. **Posez des questions** - Si quelque chose n'est pas clair
3. **Documentez les anomalies** - Dans les observations
4. **Formez vos agents** - Corrigez les erreurs recurrentes

---

## AIDE-MEMOIRE RAPIDE

### Valider un CRV

```
1. Ouvrir le CRV en TERMINE
2. Verifier :
   - Horaires corrects
   - Personnel complet
   - Charges coherentes
   - Besoins medicaux (si applicable)
   - Mineurs UM (si applicable)
   - Evenements documentes
   - Completude >= 50%
3. Si OK : Valider (POST /api/validation/:id/valider)
4. Si NON : Demander correction a l'agent
5. Apres validation : Verrouiller (POST /api/validation/:id/verrouiller)
```

### Deverrouiller un CRV

```
1. Ouvrir le CRV VERROUILLE
2. Cliquer "Deverrouiller"
3. Saisir la raison (obligatoire)
4. Le CRV passe en EN_COURS
5. Faire corriger par l'agent
6. Re-valider puis re-verrouiller
```

---

## CONTACTS ET ESCALADE

| Niveau | Contact | Pour quoi |
|--------|---------|-----------|
| 1 | Superviseur | Problemes operationnels complexes |
| 2 | Manager | Decisions strategiques, exceptions |
| 3 | Admin | Problemes techniques, comptes |

---

> **Document genere le** : 2026-01-24
>
> **Version** : 1.0
>
> **Role** : CHEF_EQUIPE
