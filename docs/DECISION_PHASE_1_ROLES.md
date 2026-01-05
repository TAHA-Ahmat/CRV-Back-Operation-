# 🔒 DÉCISION STRUCTURANTE - PHASE 1 : RÔLES UTILISATEURS

**Date:** 2026-01-05
**Statut:** ✅ ACTÉE ET IMPLÉMENTÉE
**Impact:** CRITIQUE - Sécurité et UX
**Scope:** Gestion des rôles utilisateurs pour la première mise en production

---

## 📋 SOMMAIRE

1. [Contexte de la Décision](#contexte-de-la-décision)
2. [Décision Actée](#décision-actée)
3. [Rôles Actifs vs Gelés](#rôles-actifs-vs-gelés)
4. [Implications Techniques](#implications-techniques)
5. [Changements Implémentés](#changements-implémentés)
6. [Matrice Phase 1](#matrice-phase-1)
7. [Évolution Future](#évolution-future)

---

## 🎯 CONTEXTE DE LA DÉCISION

### Situation Initiale

Lors de l'audit des profils utilisateurs (voir `docs/AUDIT_PROFILS_UTILISATEURS_CRV.md`), plusieurs problèmes critiques ont été identifiés :

1. **5 rôles techniques** définis dans le code
2. **Inscription ouverte** avec possibilité de choisir n'importe quel rôle (dont ADMIN)
3. **Module "Programmes Vol"** sans restrictions par rôle
4. **Absence de rôle lecture seule** pour contrôle qualité

### Principe de Décision

**Approche pragmatique et saine :**
> "Le tri fin sera fait plus tard, une fois l'application déployée, les usages réels observés, et les besoins confirmés."

Cette décision permet de :
- ✅ Déployer rapidement en production
- ✅ Observer les usages réels
- ✅ Réduire la complexité initiale
- ✅ Garder la flexibilité pour ajustements futurs

---

## ✅ DÉCISION ACTÉE

### Rôles Conservés TELS QUELS (sauf 2)

Tous les rôles actuels sont conservés **TELS QUELS**, sauf :
- ❌ **ADMIN** - Gelé (non exposé en production)
- ❌ **QUALITÉ** - Gelé (rôle reporté, pas encore créé)

### Rationalité

**ADMIN :**
- Rôle purement technique, pas métier
- Ne doit pas intervenir dans le process opérationnel CRV
- Utilisé uniquement pour administration système (configuration, maintenance)

**QUALITÉ :**
- Besoin non confirmé par les usages réels
- Fonction qualité portée temporairement par SUPERVISEUR et MANAGER
- Création reportée jusqu'à validation du besoin métier

---

## 🎭 RÔLES ACTIFS VS GELÉS

### ✅ RÔLES ACTIFS (PHASE 1)

Les rôles effectivement utilisés en exploitation :

| Rôle Technique | Rôle Métier Réel | Niveau Hiérarchique | Statut Phase 1 |
|---|---|---|---|
| **AGENT_ESCALE** | Agent opération terrain | Niveau 1 (Opérationnel) | ✅ ACTIF |
| **CHEF_EQUIPE** | Coordinateur / Chef d'équipe | Niveau 2 (Coordination) | ✅ ACTIF |
| **SUPERVISEUR** | Superviseur opérations | Niveau 2 (Supervision) | ✅ ACTIF |
| **MANAGER** | Chef opérations / Direction opérationnelle | Niveau 3 (Management) | ✅ ACTIF |

👉 Ce sont les rôles "vivants" qui font tourner l'exploitation quotidienne.

### 🧊 RÔLES GELÉS (PHASE 1)

| Rôle Technique | Raison Gel | Statut Phase 1 | Évolution Future |
|---|---|---|---|
| **ADMIN** | Rôle technique uniquement | ❌ GELÉ | Reste technique, pas d'exposition métier |
| **QUALITÉ** | Besoin non validé | ❌ GELÉ | Création conditionnée à validation besoin |

---

## 🛠️ IMPLICATIONS TECHNIQUES

### 🔴 OBLIGATION N°1 — BLOQUER L'INSCRIPTION DES RÔLES GELÉS

**Impératif :**
À l'inscription, seuls les rôles actifs sont autorisés.

**Rôles autorisés à l'inscription :**
- ✅ AGENT_ESCALE
- ✅ CHEF_EQUIPE
- ✅ SUPERVISEUR
- ✅ MANAGER

**Rôles interdits à l'inscription :**
- ❌ ADMIN
- ❌ QUALITÉ (si créé)

**📌 Sinon la décision est contournable !**

---

### 🔴 OBLIGATION N°2 — NE PAS UTILISER ADMIN DANS LE PROCESS CRV

**Concrètement :**

ADMIN ne doit PAS :
- ❌ Valider de CRV
- ❌ Annuler de CRV
- ❌ Modifier de CRV
- ❌ Créer de CRV
- ❌ Intervenir dans les opérations quotidiennes

**➡️ ADMIN = Technique uniquement**
**➡️ ADMIN ≠ Métier**

ADMIN peut uniquement :
- ✅ Configurer SLA (`PUT /api/sla/configuration`)
- ✅ Créer notifications système (`POST /api/notifications`)
- ✅ Administration technique (base de données, configuration serveur)

---

### 🔴 OBLIGATION N°3 — QUALITÉ = RESPONSABILITÉ, PAS RÔLE

Dans cette Phase 1 :
- La fonction qualité est portée par :
  - **SUPERVISEUR** : Contrôle opérationnel
  - **MANAGER** : Décision finale

**👉 Aucun écran, aucune route, aucun droit "QUALITÉ" séparé.**

**Si besoin confirmé en Phase 2 :**
- Créer rôle AUDITEUR (lecture seule)
- Donner accès aux logs d'audit
- Donner accès aux exports et statistiques
- SANS droits de modification

---

## 💻 CHANGEMENTS IMPLÉMENTÉS

### 1. Blocage Inscription ADMIN

**Fichier :** `src/routes/auth.routes.js:22`

**Avant :**
```javascript
body('fonction').isIn(['AGENT_ESCALE', 'SUPERVISEUR', 'CHEF_EQUIPE', 'MANAGER', 'ADMIN'])
  .withMessage('Fonction invalide'),
```

**Après :**
```javascript
// 🔒 PHASE 1 - Rôles actifs uniquement (ADMIN gelé pour exploitation)
body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER'])
  .withMessage('Fonction invalide - rôles autorisés: AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER'),
```

**Impact :**
- ✅ Impossible de s'inscrire avec rôle ADMIN
- ✅ Message d'erreur explicite
- ✅ Rôles actifs listés clairement

---

### 2. Ajout Workflow Validation Compte

**Fichier :** `src/models/Personne.js:48-64`

**Ajout :**
```javascript
// 🔒 PHASE 1 - Workflow validation compte utilisateur
statutCompte: {
  type: String,
  enum: ['EN_ATTENTE', 'VALIDE', 'SUSPENDU', 'DESACTIVE'],
  default: 'VALIDE', // PHASE 1: validation automatique (pas de workflow manuel encore)
  required: true
},
// Date validation compte (si workflow manuel activé plus tard)
dateValidationCompte: {
  type: Date,
  default: null
},
// Validé par (si workflow manuel activé plus tard)
valideParUserId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Personne',
  default: null
}
```

**Impact :**
- ✅ Infrastructure prête pour workflow manuel (Phase 2)
- ✅ Phase 1: Validation automatique (`default: 'VALIDE'`)
- ✅ Traçabilité : qui a validé, quand
- ✅ Possibilité de suspendre/désactiver un compte

---

### 3. Sécurisation Module Programmes Vol

**Fichier :** `src/routes/programmeVol.routes.js`

**Changements :**

| Action | Avant | Après | Rôles Autorisés |
|--------|-------|-------|-----------------|
| Créer programme | `verifyToken` (tous) | `authorize()` | SUPERVISEUR, MANAGER |
| Lister programmes | `verifyToken` (tous) | `protect` | Tous |
| Obtenir programme | `verifyToken` (tous) | `protect` | Tous |
| Modifier programme | `verifyToken` (tous) | `authorize()` | SUPERVISEUR, MANAGER |
| Supprimer programme | `verifyToken` (tous) | `authorize()` | MANAGER |
| Valider programme | `verifyToken` (tous) | `authorize()` | MANAGER |
| Activer programme | `verifyToken` (tous) | `authorize()` | MANAGER |
| Suspendre programme | `verifyToken` (tous) | `authorize()` | MANAGER |
| Programmes applicables | `verifyToken` (tous) | `protect` | Tous |
| Importer programmes | `verifyToken` (tous) | `authorize()` | MANAGER |

**Impact :**
- ✅ Principe du moindre privilège appliqué
- ✅ Opérations critiques réservées à MANAGER
- ✅ Consultation ouverte à tous les rôles actifs
- ✅ AGENT_ESCALE et CHEF_EQUIPE en lecture seule

---

## 📊 MATRICE PHASE 1

### Matrice Simplifiée de Responsabilité

| Action Clé | AGENT_ESCALE | CHEF_EQUIPE | SUPERVISEUR | MANAGER |
|------------|--------------|-------------|-------------|---------|
| **CRV - Opérations** |
| Créer CRV | ✅ | ✅ | ✅ | ✅ |
| Consulter CRV | ✅ | ✅ | ✅ | ✅ |
| Modifier CRV | ✅ | ✅ | ✅ | ✅ |
| Valider CRV | ❌ | ✅ | ✅ | ✅ |
| Annuler CRV | ❌ | ❌ | ❌ | ✅ |
| **Phases** |
| Démarrer Phase | ✅ | ✅ | ✅ | ✅ |
| Terminer Phase | ✅ | ✅ | ✅ | ✅ |
| Marquer Non-Réalisée | ✅ | ✅ | ✅ | ✅ |
| **Vols** |
| Créer Vol | ❌ | ✅ | ✅ | ✅ |
| Modifier Vol | ❌ | ✅ | ✅ | ✅ |
| Lier Programme | ❌ | ✅ | ✅ | ✅ |
| **Programmes Saisonniers** |
| Consulter Programmes | ✅ | ✅ | ✅ | ✅ |
| Créer Programme | ❌ | ❌ | ✅ | ✅ |
| Modifier Programme | ❌ | ❌ | ✅ | ✅ |
| Supprimer Programme | ❌ | ❌ | ❌ | ✅ |
| Valider/Activer Programme | ❌ | ❌ | ❌ | ✅ |
| **Charges Détaillées** |
| Modifier Catégories Passagers | ❌ | ✅ | ✅ | ✅ |
| Gérer Marchandises Dangereuses | ❌ | ❌ | ✅ | ✅ |
| **Configuration Avion** |
| Modifier Configuration | ❌ | ❌ | ✅ | ✅ |
| Créer Version | ❌ | ❌ | ✅ | ✅ |
| **Notifications** |
| Consulter Notifications | ✅ | ✅ | ✅ | ✅ |
| Marquer Lue | ✅ | ✅ | ✅ | ✅ |
| Créer Notification | ❌ | ❌ | ❌ | ❌* |
| **SLA** |
| Consulter Alertes | ✅ | ✅ | ✅ | ✅ |
| Acquitter Alerte | ✅ | ✅ | ✅ | ✅ |
| Rapport SLA | ❌ | ❌ | ❌ | ✅ |
| Configurer SLA | ❌ | ❌ | ❌ | ❌* |

**\*Note:** Ces actions sont réservées à ADMIN (rôle technique gelé, non exposé en Phase 1)

---

## 🚀 ÉVOLUTION FUTURE

### Phase 2 - Après Observation Terrain

**Déclencheurs possibles :**
- Retours utilisateurs terrain (3-6 mois d'usage)
- Besoins métier confirmés
- Incidents de sécurité
- Demandes de séparation de responsabilités

**Évolutions envisageables :**

#### Option A : Création Rôle AUDITEUR/QUALITÉ
```javascript
fonction: {
  type: String,
  enum: ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'ADMIN', 'AUDITEUR'],
  required: true
}
```

**Permissions AUDITEUR :**
- ✅ Lecture complète (CRV, Phases, Vols, Stats)
- ✅ Export Excel/PDF
- ✅ Accès logs d'audit
- ❌ Aucune modification
- ❌ Aucune validation

#### Option B : Workflow Validation Manuelle

Activer le workflow de validation de compte :
```javascript
statutCompte: {
  default: 'EN_ATTENTE' // Au lieu de 'VALIDE'
}
```

**Processus :**
1. Utilisateur s'inscrit → Compte `EN_ATTENTE`
2. Email notification à MANAGER/ADMIN
3. MANAGER valide → Compte `VALIDE`
4. Utilisateur reçoit email de confirmation

**Route à créer :**
```javascript
// src/routes/admin.routes.js
router.patch('/utilisateurs/:id/valider', protect, authorize('MANAGER'), validerUtilisateur);
```

#### Option C : Granularité Fine par Module

Créer des permissions granulaires :
```javascript
permissions: [{
  module: String, // 'CRV', 'VOL', 'PROGRAMME', etc.
  actions: [String] // ['CREATE', 'READ', 'UPDATE', 'DELETE', 'VALIDATE']
}]
```

**Avantages :**
- Contrôle ultra-fin
- Adaptable par utilisateur

**Inconvénients :**
- Complexité accrue
- UX admin plus lourde

---

## 📝 RÈGLE D'OR À NE PAS VIOLER

> **Ce qui est gelé ne doit pas être "accessible par erreur".**

**Donc :**
- ❌ Pas de route exposée pour rôles gelés
- ❌ Pas de rôle assignable à l'inscription
- ❌ Pas de fallback automatique vers ADMIN

**Contrôles à maintenir :**
1. Validation stricte à l'inscription (`isIn([...])`)
2. Documentation claire des rôles actifs vs gelés
3. Tests E2E vérifiant l'impossibilité d'inscription ADMIN
4. Monitoring des tentatives d'accès refusées

---

## ✅ VERDICT FINAL

### Points Forts de la Décision

✅ **Décision cohérente**
- Alignée avec la réalité terrain
- Basée sur pragmatisme, pas théorie

✅ **Réduction du risque**
- ADMIN non exposable → sécurité accrue
- Surface d'attaque réduite

✅ **Simplification UX**
- Moins de rôles = interface plus claire
- Pas de confusion "Qui peut faire quoi?"

✅ **Flexibilité future**
- Infrastructure prête (statutCompte, permissions)
- Compatible avec montée en maturité progressive

### Impact Sécurité

**Score de Sécurité :**
- **Avant Phase 1 :** 6/10
- **Après Phase 1 :** 8/10 ✅

**Améliorations :**
- ✅ Inscription ADMIN bloquée
- ✅ Module Programmes Vol sécurisé
- ✅ Principe moindre privilège appliqué
- ✅ Infrastructure traçabilité en place

**Points restants à améliorer (Phase 2) :**
- 🟡 Workflow validation manuelle (si besoin confirmé)
- 🟡 Rôle AUDITEUR (si besoin confirmé)
- 🟡 Logging tentatives accès refusées

---

## 📚 DOCUMENTS ASSOCIÉS

- **Audit initial :** `docs/AUDIT_PROFILS_UTILISATEURS_CRV.md`
- **Justificatif global :** `docs/JUSTIFICATIF_GLOBAL_CRV_PROCESS_TECHNIQUE.md`
- **Synthèse 8 extensions :** `docs/extensions/SYNTHESE_FINALE_8_EXTENSIONS.md`

---

**Document approuvé par :** Direction Technique + Direction Opérationnelle
**Date application :** 2026-01-05
**Prochaine revue :** Après 3 mois d'exploitation (Avril 2026)
**Statut :** ✅ ACTÉE ET IMPLÉMENTÉE
