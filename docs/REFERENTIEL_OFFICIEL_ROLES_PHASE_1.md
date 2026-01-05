# 📘 RÉFÉRENTIEL OFFICIEL - RÔLES ET PERMISSIONS PHASE 1

**Date:** 2026-01-05
**Version:** 1.0 AJUSTÉE
**Statut:** ✅ IMPLÉMENTÉ
**Type:** RÉFÉRENTIEL OFFICIEL PRODUCTION

---

## 📋 SOMMAIRE

1. [Principe Fondamental](#principe-fondamental)
2. [Modèle des Profils](#modèle-des-profils)
3. [Matrice Complète des Permissions](#matrice-complète-des-permissions)
4. [Actions Critiques - Qui Décide](#actions-critiques---qui-décide)
5. [Profil QUALITÉ - Observation et Analyse](#profil-qualité---observation-et-analyse)
6. [Rôle ADMIN - Technique Uniquement](#rôle-admin---technique-uniquement)
7. [Implémentation Technique](#implémentation-technique)
8. [Règles d'Or](#règles-dor)

---

## 🎯 PRINCIPE FONDAMENTAL

### La Décision Structurante

> **AGENT_ESCALE / CHEF_EQUIPE / SUPERVISEUR / MANAGER ont le MÊME PÉRIMÈTRE FONCTIONNEL OPÉRATIONNEL au début.**

### Pourquoi?

**La différence n'est PAS dans l'action, elle est dans la RESPONSABILITÉ et la LÉGITIMITÉ.**

C'est **volontaire**, **réaliste** et **très courant en exploitation aérienne**.

### Justification Terrain

Sur le terrain :
- ✅ Un **MANAGER** peut saisir un CRV
- ✅ Un **SUPERVISEUR** peut corriger une charge
- ✅ Un **CHEF_EQUIPE** peut piloter une phase
- ✅ Un **AGENT_ESCALE** peut tout initier

**C'est réaliste, fluide, et ça évite les blocages opérationnels.**

---

## 👥 MODÈLE DES PROFILS - PHASE 1

### 1️⃣ PROFIL OPÉRATIONNEL UNIFIÉ (4 RÔLES)

| Rôle Technique | Rôle Métier | Niveau | Statut Phase 1 |
|---|---|---|---|
| **AGENT_ESCALE** | Agent opération terrain | Opérationnel | ✅ ACTIF |
| **CHEF_EQUIPE** | Coordinateur / Chef d'équipe | Coordination | ✅ ACTIF |
| **SUPERVISEUR** | Superviseur opérations | Supervision | ✅ ACTIF |
| **MANAGER** | Chef opérations / Direction | Management | ✅ ACTIF |

#### Ce qu'ils peuvent TOUS faire

**Périmètre opérationnel unifié :**

✅ Créer un CRV
✅ Modifier un CRV non validé
✅ Saisir les phases (démarrer, terminer, marquer non-réalisée)
✅ Saisir passagers (catégories, classes, besoins médicaux, mineurs)
✅ Saisir fret (catégories, marchandises dangereuses, logistique)
✅ Gérer configuration avion (versions, révisions)
✅ Créer/modifier vols
✅ Lier vols aux programmes saisonniers
✅ Créer/modifier programmes vols saisonniers
✅ Déclarer incidents
✅ Saisir observations
✅ Consulter alertes SLA
✅ Acquitter alertes SLA
✅ Consulter leurs notifications
✅ Marquer notifications lues/archivées

**Pourquoi?**

Parce que sur le terrain, **la fluidité opérationnelle prime**. Un manager présent doit pouvoir saisir. Un agent formé doit pouvoir tout faire.

---

### 2️⃣ PROFIL QUALITÉ - OBSERVATION

| Rôle | Fonction | Statut Phase 1 |
|---|---|---|
| **QUALITE** | Observation, contrôle, analyse | ✅ ACTIF (NOUVEAU) |

#### Nature du Rôle

**QUALITÉ** est un profil transversal :
- **ZÉRO action bloquante**
- **ZÉRO modification métier**
- **Observation structurée uniquement**

#### Ce que QUALITÉ peut faire

**Lecture complète :**
✅ Consulter TOUS les CRV (brouillon, en cours, validés, annulés)
✅ Consulter l'historique complet (UserActivityLog)
✅ Consulter les incidents et événements
✅ Consulter les alertes SLA et leur configuration
✅ Consulter les programmes vols saisonniers
✅ Consulter les configurations avions et historique versions
✅ Consulter les statistiques globales (passagers, fret, SLA)
✅ Exporter rapports Excel/CSV
✅ Consulter ses propres notifications

#### Ce que QUALITÉ ne peut PAS faire

❌ Créer ou modifier un CRV
❌ Valider un CRV
❌ Annuler un CRV
❌ Modifier des phases
❌ Saisir passagers/fret
❌ Créer/modifier vols ou programmes
❌ Modifier configuration avion
❌ Créer notifications système
❌ Configurer SLA
❌ Déclencher surveillance SLA

**Rôle observateur :** QUALITÉ analyse mais ne décide pas.

---

### 3️⃣ RÔLE ADMIN - TECHNIQUE (GELÉ)

| Rôle | Fonction | Statut Phase 1 |
|---|---|---|
| **ADMIN** | Administration technique système | 🧊 GELÉ |

#### Gel du Rôle ADMIN

**ADMIN** existe techniquement mais :
- ❌ **Pas utilisé en exploitation quotidienne**
- ❌ **Pas exposé au front-end**
- ❌ **Pas assignable à l'inscription**
- ❌ **N'intervient PAS dans le process CRV métier**

**ADMIN** reste strictement technique :
- Gestion base de données
- Configuration serveur
- Maintenance système
- Dépannage technique

**ADMIN ne fait AUCUNE opération métier CRV.**

---

## 🧭 LA DIFFÉRENCE : QUI PORTE LA RESPONSABILITÉ ?

### Actions Opérationnelles = Tous Égaux

Sur les opérations terrain, **pas de différence** :
- Créer vol ➔ Tous
- Saisir charges ➔ Tous
- Démarrer phase ➔ Tous

### Actions Critiques = Hiérarchie Décisionnelle

| Action Critique | Qui Porte la Responsabilité | Pourquoi |
|---|---|---|
| **Valider CRV** | SUPERVISEUR, MANAGER | Engagement qualité |
| **Rejeter validation CRV** | MANAGER | Décision grave |
| **Annuler CRV** | MANAGER | Décision grave |
| **Réactiver CRV annulé** | MANAGER | Décision grave |
| **Déverrouiller CRV** | MANAGER | Bypass processus |
| **Valider programme vol** | SUPERVISEUR, MANAGER | Engagement planification |
| **Activer programme vol** | SUPERVISEUR, MANAGER | Mise en production |
| **Supprimer programme vol** | MANAGER | Décision structurante |
| **Configurer SLA** | MANAGER | Décision de gestion |
| **Obtenir rapport SLA** | MANAGER | Vue stratégique |
| **Surveiller SLA** | MANAGER | Déclenchement alertes |
| **Créer notification système** | MANAGER | Communication officielle |

**Les autres peuvent voir, préparer, proposer — pas décider.**

---

## 📊 MATRICE COMPLÈTE DES PERMISSIONS

### Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Accès complet (lecture + écriture) |
| 👁️ | Lecture seule |
| ⚖️ | Décision critique (responsabilité) |
| ❌ | Accès refusé |

---

### MODULE 1 - AUTHENTIFICATION (`/api/auth`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| Login | Public | Public | Public | Public | Public | Public |
| Register | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ GELÉ |
| Get Profile | ✅ | ✅ | ✅ | ✅ | ✅ | - |

**Note:** ADMIN ne peut pas s'inscrire via l'API publique (rôle gelé).

---

### MODULE 2 - GESTION CRV (`/api/crv`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| **Création & Lecture** |
| Créer CRV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lister CRVs | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Obtenir CRV | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Rechercher CRV | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| **Modification** |
| Modifier CRV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter Charge | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter Événement | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter Observation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Validation** |
| Valider CRV | ❌ | ❌ | ⚖️ | ⚖️ | ❌ | ❌ |
| Déverrouiller CRV | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| **Annulation** |
| Annuler CRV | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Réactiver CRV | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Lister Annulés | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Stats Annulations | ❌ | ❌ | ❌ | ⚖️ | 👁️ | - |
| **Statistiques & Export** |
| Obtenir Stats | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Exporter Excel | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| **Archivage Google Drive** |
| Statut Archivage | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Tester Archivage | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| Archiver CRV | ✅ | ✅ | ✅ | ✅ | ❌ | - |

---

### MODULE 3 - GESTION PHASES (`/api/phases`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| Démarrer Phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Terminer Phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marquer Non-Réalisée | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier Phase | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

**Périmètre opérationnel unifié** - Tous les opérationnels gèrent les phases.

---

### MODULE 4 - GESTION VOLS (`/api/vols`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| Créer Vol | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lister Vols | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Obtenir Vol | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Modifier Vol | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Ext. 2 - Liaison Programme** |
| Lier au Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marquer Hors-Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Détacher du Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Suggérer Programmes | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Vols du Programme | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Stats Programmes | ✅ | ✅ | ✅ | ✅ | 👁️ | - |

---

### MODULE 5 - PROGRAMMES VOL SAISONNIERS (`/api/programmes-vol`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| Créer Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lister Programmes | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Obtenir Programme | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Modifier Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Décisions Critiques** |
| Supprimer Programme | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Valider Programme | ❌ | ❌ | ⚖️ | ⚖️ | ❌ | ❌ |
| Activer Programme | ❌ | ❌ | ⚖️ | ⚖️ | ❌ | ❌ |
| Suspendre Programme | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Recherche & Import** |
| Programmes Applicables | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Importer Programmes | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

**Note:** Validation/Activation = Décision critique (SUPER, MANAGER)

---

### MODULE 6 - VERSION AVION (`/api/avions`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| Modifier Configuration | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Créer Version | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Obtenir Historique | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Obtenir Version | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Restaurer Version | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comparer Versions | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Modifier Révision | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Avions Révision Prochaine | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Stats Configurations | ✅ | ✅ | ✅ | ✅ | 👁️ | - |

---

### MODULE 7 - CHARGES DÉTAILLÉES (`/api/charges`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| **Passagers (Ext. 4)** |
| Modifier Catégories | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier Classes | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier Besoins Médicaux | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier Mineurs | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Convertir Catégories | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Stats Passagers | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| **Fret (Ext. 5)** |
| Modifier Fret Détaillé | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajouter Marchandise DGR | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Retirer Marchandise DGR | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Valider Marchandise DGR | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Charges avec DGR | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Stats Fret | ✅ | ✅ | ✅ | ✅ | 👁️ | - |

**Note:** Marchandises dangereuses = opérationnel terrain, pas décision critique.

---

### MODULE 8 - NOTIFICATIONS (`/api/notifications`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| **Gestion Personnelle** |
| Mes Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Compter Non-Lues | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Marquer Lue | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Marquer Toutes Lues | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Archiver Notification | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Supprimer Notification | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| **Gestion Système** |
| Créer Notification | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Statistiques | ✅ | ✅ | ✅ | ✅ | 👁️ | - |

**Note:** Création notification système = Décision de communication (MANAGER).

---

### MODULE 9 - ALERTES SLA (`/api/sla`)

| Action | AGENT | CHEF | SUPER | MANAGER | QUALITÉ | ADMIN |
|--------|-------|------|-------|---------|---------|-------|
| **Consultation** |
| Vérifier SLA CRV | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Vérifier SLA Phase | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| Obtenir Configuration | ✅ | ✅ | ✅ | ✅ | 👁️ | - |
| **Décisions Critiques** |
| Rapport SLA | ❌ | ❌ | ❌ | ⚖️ | 👁️ | ❌ |
| Configurer SLA | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Surveiller CRV | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |
| Surveiller Phases | ❌ | ❌ | ❌ | ⚖️ | ❌ | ❌ |

**Note:** SLA = Gestion opérationnelle stratégique (MANAGER uniquement).

---

## ⚖️ ACTIONS CRITIQUES - QUI DÉCIDE ?

### Synthèse Décisions Critiques

| Action Critique | SUPER | MANAGER | Justification |
|---|:---:|:---:|---|
| **CRV** |
| Valider CRV | ⚖️ | ⚖️ | Engagement qualité |
| Rejeter validation | ❌ | ⚖️ | Décision grave |
| Déverrouiller CRV | ❌ | ⚖️ | Bypass processus |
| Annuler CRV | ❌ | ⚖️ | Décision grave |
| Réactiver CRV | ❌ | ⚖️ | Décision grave |
| Stats Annulations | ❌ | ⚖️ | Vue stratégique |
| **Programmes Vol** |
| Valider Programme | ⚖️ | ⚖️ | Engagement planification |
| Activer Programme | ⚖️ | ⚖️ | Mise en production |
| Supprimer Programme | ❌ | ⚖️ | Décision structurante |
| **SLA** |
| Configurer SLA | ❌ | ⚖️ | Paramétrage stratégique |
| Rapport SLA | ❌ | ⚖️ | Vue stratégique |
| Surveiller SLA | ❌ | ⚖️ | Déclenchement alertes |
| **Communication** |
| Créer Notification | ❌ | ⚖️ | Communication officielle |

**Règle:** SUPERVISEUR décide sur validation/activation. MANAGER décide sur tout le reste.

---

## 📋 PROFIL QUALITÉ - OBSERVATION ET ANALYSE

### Rôle Transversal

QUALITÉ est un profil **post-opération, non bloquant**.

### Permissions QUALITÉ

#### ✅ Lecture Complète

**Accès en lecture seule à :**
- Tous les CRV (tous statuts)
- Historique complet (UserActivityLog)
- Incidents et événements
- Phases et leur statut
- Charges (passagers, fret)
- Vols et programmes
- Configurations avion et versions
- Alertes SLA et configuration
- Rapports SLA (lecture uniquement)
- Statistiques globales (passagers, fret, SLA)
- Exports Excel/CSV
- Notifications personnelles

#### ❌ Aucune Modification

**QUALITÉ ne peut PAS :**
- Créer ou modifier un CRV
- Valider, annuler, déverrouiller
- Modifier phases
- Saisir charges
- Créer vols/programmes
- Modifier configuration avion
- Configurer SLA
- Créer notifications système

### Cas d'Usage QUALITÉ

**QUALITÉ observe et analyse pour :**
- 📊 Produire rapports qualité mensuels
- 🔍 Identifier patterns d'incidents
- 📈 Analyser respect SLA
- ⚠️ Détecter anomalies récurrentes
- 📝 Auditer traçabilité
- 🎯 Proposer améliorations processus

**QUALITÉ ne décide pas, n'exécute pas, ne bloque pas.**

---

## 🔒 RÔLE ADMIN - TECHNIQUE UNIQUEMENT

### Gel du Rôle ADMIN

**ADMIN** existe mais est **GELÉ** en Phase 1 :
- ❌ Pas assignable à l'inscription
- ❌ Pas utilisé en exploitation CRV
- ❌ N'intervient pas dans le métier

### Ce que ADMIN peut faire (technique uniquement)

**Administration système :**
- Gestion base de données MongoDB
- Configuration serveur Express
- Maintenance logs
- Dépannage technique
- Gestion utilisateurs (création manuelle hors API)

### Ce que ADMIN ne fait PAS

**ADMIN n'intervient JAMAIS dans :**
- ❌ Création/modification CRV
- ❌ Validation/annulation
- ❌ Gestion phases
- ❌ Saisie charges
- ❌ Vols/programmes
- ❌ Configuration métier SLA
- ❌ Notifications métier

**ADMIN = Infrastructure, pas métier.**

---

## 💻 IMPLÉMENTATION TECHNIQUE

### Changements Appliqués

#### 1. Modèle `Personne.js`

```javascript
fonction: {
  type: String,
  enum: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN'],
  required: true
}
```

**Rôles actifs Phase 1 :** AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE
**Rôle gelé :** ADMIN

#### 2. Routes Authentification `auth.routes.js`

```javascript
body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE'])
```

**ADMIN bloqué à l'inscription.**

#### 3. Routes Opérationnelles

**Périmètre unifié appliqué sur :**
- `programmeVol.routes.js` - Création/modification ouverte, validation/activation SUPER+MANAGER
- `vol.routes.js` - Toutes opérations ouvertes
- `charge.routes.js` - Toutes opérations ouvertes
- `avion.routes.js` - Toutes opérations ouvertes
- `crv.routes.js` - Opérations ouvertes, validation/annulation restreintes
- `phase.routes.js` - Toutes opérations ouvertes

**Middleware utilisé :** `protect` uniquement (pas `authorize()`)

#### 4. Routes Décisions Critiques

**Restrictions appliquées sur :**

| Route | Restriction | Fichier |
|-------|-------------|---------|
| `POST /api/validation/:id/valider` | `authorize('SUPERVISEUR', 'MANAGER')` | validation.routes.js:15 |
| `POST /api/validation/:id/deverrouiller` | `authorize('MANAGER')` | validation.routes.js:23 |
| `POST /api/crv/:id/annuler` | `authorize('MANAGER')` | crv.routes.js |
| `POST /api/crv/:id/reactiver` | `authorize('MANAGER')` | crv.routes.js |
| `GET /api/crv/statistiques/annulations` | `authorize('MANAGER')` | crv.routes.js |
| `DELETE /api/programmes-vol/:id` | `authorize('MANAGER')` | programmeVol.routes.js:83 |
| `POST /api/programmes-vol/:id/valider` | `authorize('SUPERVISEUR', 'MANAGER')` | programmeVol.routes.js:93 |
| `POST /api/programmes-vol/:id/activer` | `authorize('SUPERVISEUR', 'MANAGER')` | programmeVol.routes.js:101 |
| `GET /api/sla/rapport` | `authorize('MANAGER')` | alerteSLA.routes.js:41 |
| `PUT /api/sla/configuration` | `authorize('MANAGER')` | alerteSLA.routes.js:56 |
| `POST /api/sla/surveiller/*` | `authorize('MANAGER')` | alerteSLA.routes.js:63,70 |
| `POST /api/notifications` | `authorize('MANAGER')` | notification.routes.js:74 |

**ADMIN retiré de tous les `authorize()`.**

---

## 🎯 RÈGLES D'OR

### 1. Périmètre Opérationnel = Unifié

> Sur les opérations terrain, **tous les rôles opérationnels sont égaux**.

✅ AGENT peut tout faire
✅ CHEF peut tout faire
✅ SUPERVISEUR peut tout faire
✅ MANAGER peut tout faire

**La différence est dans la responsabilité, pas l'action.**

---

### 2. Décisions Critiques = Hiérarchie

> Sur les décisions graves, **seuls SUPERVISEUR et MANAGER décident**.

⚖️ Validation CRV → SUPERVISEUR, MANAGER
⚖️ Annulation CRV → MANAGER uniquement
⚖️ Configuration SLA → MANAGER uniquement
⚖️ Suppression programme → MANAGER uniquement

**Les autres préparent, les décideurs assument.**

---

### 3. QUALITÉ = Observation, Pas Action

> QUALITÉ observe, analyse, rapporte — ne modifie jamais.

👁️ Lecture complète
📊 Rapports et exports
🔍 Analyse et audits
❌ Aucune modification

**QUALITÉ contrôle, ne pilote pas.**

---

### 4. ADMIN = Technique, Pas Métier

> ADMIN gère l'infrastructure, n'intervient pas dans le processus CRV.

🔧 Administration système
⚙️ Configuration technique
🛠️ Maintenance base de données
❌ Aucune opération métier

**ADMIN est gelé pour l'exploitation.**

---

### 5. Pas de Blocage Opérationnel

> En cas de doute, privilégier la fluidité sur le terrain.

Si un AGENT formé peut faire l'opération → Il la fait.
Si un MANAGER est présent → Il peut saisir directement.

**Réalisme terrain avant rigidité théorique.**

---

## ✅ CHECKLIST CONFORMITÉ

### Implémentation

- [x] Rôle QUALITE créé dans modèle Personne
- [x] ADMIN bloqué à l'inscription
- [x] Périmètre opérationnel unifié (protect uniquement)
- [x] Décisions critiques restreintes (authorize('SUPERVISEUR', 'MANAGER') ou authorize('MANAGER'))
- [x] ADMIN retiré de tous les authorize() métier
- [x] QUALITE accès lecture seule complet
- [x] Documentation complète

### Validation

- [x] 5 rôles actifs : AGENT, CHEF, SUPERVISEUR, MANAGER, QUALITE
- [x] 1 rôle gelé : ADMIN
- [x] Matrice permissions validée
- [x] Actions critiques identifiées
- [x] Référentiel officiel documenté

---

## 📚 DOCUMENTS ASSOCIÉS

- **Audit initial :** `docs/AUDIT_PROFILS_UTILISATEURS_CRV.md`
- **Décision Phase 1 (ancienne version) :** `docs/DECISION_PHASE_1_ROLES.md`
- **Justificatif global :** `docs/JUSTIFICATIF_GLOBAL_CRV_PROCESS_TECHNIQUE.md`
- **Synthèse 8 extensions :** `docs/extensions/SYNTHESE_FINALE_8_EXTENSIONS.md`

---

## 📝 CONCLUSION

### Philosophie Phase 1

**Fluidité opérationnelle + Responsabilité hiérarchique claire**

✅ Tous peuvent agir sur le terrain
⚖️ Seuls les décideurs assument les décisions graves
👁️ QUALITÉ observe sans bloquer
🔒 ADMIN reste technique

### Bénéfices

1. **Réalisme terrain** - Pas de blocage si superviseur absent
2. **Responsabilité claire** - On sait qui décide quoi
3. **Contrôle qualité** - Profil QUALITÉ observe tout
4. **Sécurité renforcée** - ADMIN hors métier
5. **Évolutivité** - Phase 2 ajustera selon usages réels

**Ce référentiel est le document officiel de production Phase 1.**

---

**Document validé par :** Direction Technique + Direction Opérationnelle
**Date application :** 2026-01-05
**Prochaine revue :** Avril 2026 (3 mois post-déploiement)
**Version :** 1.0 AJUSTÉE
**Statut :** ✅ RÉFÉRENTIEL OFFICIEL PRODUCTION
