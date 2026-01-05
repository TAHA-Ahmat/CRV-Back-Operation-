# 🧪 Scénarios de tests manuels — Correctifs P0

**Version**: 1.0.0
**Date**: 2026-01-05
**Objectif**: Valider les correctifs de sécurité P0-1 et P0-2
**Périmètre**: Phase 1 Ajustée + Correctifs de sécurité

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [P0-1: Test exclusion QUALITE](#p0-1-test-exclusion-qualite)
3. [P0-2: Test workaround MDP oublié](#p0-2-test-workaround-mdp-oublié)
4. [Tests de non-régression](#tests-de-non-régression)
5. [Matrice de validation](#matrice-de-validation)

---

## 🔧 PRÉREQUIS

### Environnement

- ✅ Serveur backend démarré (`npm run dev`)
- ✅ Base MongoDB connectée et accessible
- ✅ Postman ou outil équivalent (curl, Insomnia)
- ✅ Accès MongoDB Compass ou mongosh

### Comptes de test requis

Créer 6 comptes de test (un par rôle):

| Email | Fonction | MDP | Statut |
|-------|----------|-----|--------|
| agent.test@crv.com | AGENT_ESCALE | Test1234! | Actif |
| chef.test@crv.com | CHEF_EQUIPE | Test1234! | Actif |
| superviseur.test@crv.com | SUPERVISEUR | Test1234! | Actif |
| manager.test@crv.com | MANAGER | Test1234! | Actif |
| qualite.test@crv.com | QUALITE | Test1234! | Actif |
| admin.test@crv.com | ADMIN | Test1234! | Actif |

**Script MongoDB pour créer les comptes de test**: Voir Annexe A

---

## 🔒 P0-1: TEST EXCLUSION QUALITE

**Objectif**: Vérifier que QUALITE ne peut PAS modifier de données (lecture seule stricte)

### Scénario 1.1: QUALITE ne peut pas créer un CRV

**Étapes**:

1. **Se connecter en tant que QUALITE**
   ```http
   POST http://localhost:5000/api/auth/connexion
   Content-Type: application/json

   {
     "email": "qualite.test@crv.com",
     "motDePasse": "Test1234!"
   }
   ```

   **Résultat attendu**: ✅ Connexion réussie, token JWT reçu

2. **Copier le token** (exemple: `eyJhbGciOiJIUzI1...`)

3. **Tenter de créer un CRV**
   ```http
   POST http://localhost:5000/api/crv
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOiJIUzI1...

   {
     "numeroVol": "AF1234",
     "typeOperation": "ARRIVEE",
     "compagnieAerienne": "Air France",
     "codeIATA": "AF",
     "dateVol": "2026-01-10T14:30:00Z"
   }
   ```

   **✅ Résultat attendu**:
   ```json
   {
     "success": false,
     "message": "Accès refusé: QUALITE est un profil lecture seule uniquement",
     "code": "QUALITE_READ_ONLY"
   }
   ```

   **Code HTTP**: `403 Forbidden`

4. **❌ Échec du test si**: Création autorisée ou code ≠ 403

---

### Scénario 1.2: QUALITE ne peut pas modifier un CRV existant

**Prérequis**: Créer un CRV avec un compte AGENT (voir script Annexe B)

**Étapes**:

1. **Se connecter en tant que QUALITE** (réutiliser token du scénario 1.1)

2. **Tenter de modifier un CRV**
   ```http
   PATCH http://localhost:5000/api/crv/[ID_CRV]
   Content-Type: application/json
   Authorization: Bearer [TOKEN_QUALITE]

   {
     "observations": "Test modification par QUALITE"
   }
   ```

   **✅ Résultat attendu**:
   ```json
   {
     "success": false,
     "message": "Accès refusé: QUALITE est un profil lecture seule uniquement",
     "code": "QUALITE_READ_ONLY"
   }
   ```

   **Code HTTP**: `403 Forbidden`

---

### Scénario 1.3: QUALITE peut lire les CRV

**Étapes**:

1. **Se connecter en tant que QUALITE**

2. **Lire la liste des CRV**
   ```http
   GET http://localhost:5000/api/crv
   Authorization: Bearer [TOKEN_QUALITE]
   ```

   **✅ Résultat attendu**:
   - Code HTTP: `200 OK`
   - Liste des CRV retournée
   - Aucune erreur

3. **Lire un CRV spécifique**
   ```http
   GET http://localhost:5000/api/crv/[ID_CRV]
   Authorization: Bearer [TOKEN_QUALITE]
   ```

   **✅ Résultat attendu**:
   - Code HTTP: `200 OK`
   - Détails du CRV retournés

---

### Scénario 1.4: QUALITE ne peut pas ajouter de charge

**Étapes**:

1. **Se connecter en tant que QUALITE**

2. **Tenter d'ajouter une charge à un CRV**
   ```http
   POST http://localhost:5000/api/crv/[ID_CRV]/charges
   Content-Type: application/json
   Authorization: Bearer [TOKEN_QUALITE]

   {
     "typeCharge": "PASSAGERS",
     "nombrePassagers": 150
   }
   ```

   **✅ Résultat attendu**: `403 Forbidden` avec message `QUALITE_READ_ONLY`

---

### Scénario 1.5: QUALITE ne peut pas modifier les catégories détaillées

**Étapes**:

1. **Se connecter en tant que QUALITE**

2. **Tenter de modifier les catégories détaillées**
   ```http
   PUT http://localhost:5000/api/charges/[ID_CHARGE]/categories-detaillees
   Content-Type: application/json
   Authorization: Bearer [TOKEN_QUALITE]

   {
     "bebes": 2,
     "enfants": 10,
     "adultes": 100
   }
   ```

   **✅ Résultat attendu**: `403 Forbidden` avec message `QUALITE_READ_ONLY`

---

### Scénario 1.6: QUALITE ne peut pas démarrer une phase

**Étapes**:

1. **Se connecter en tant que QUALITE**

2. **Tenter de démarrer une phase**
   ```http
   POST http://localhost:5000/api/phases/[ID_PHASE]/demarrer
   Authorization: Bearer [TOKEN_QUALITE]
   ```

   **✅ Résultat attendu**: `403 Forbidden` avec message `QUALITE_READ_ONLY`

---

### Scénario 1.7: QUALITE peut accéder aux statistiques (lecture seule)

**Étapes**:

1. **Se connecter en tant que QUALITE**

2. **Accéder aux statistiques passagers**
   ```http
   GET http://localhost:5000/api/charges/statistiques/passagers
   Authorization: Bearer [TOKEN_QUALITE]
   ```

   **✅ Résultat attendu**: `200 OK` avec données statistiques

3. **Accéder aux statistiques de fret**
   ```http
   GET http://localhost:5000/api/charges/statistiques/fret
   Authorization: Bearer [TOKEN_QUALITE]
   ```

   **✅ Résultat attendu**: `200 OK` avec données statistiques

---

## 🔐 P0-2: TEST WORKAROUND MDP OUBLIÉ

**Objectif**: Vérifier que la procédure manuelle de réinitialisation fonctionne

### Scénario 2.1: Réinitialisation complète (procédure nominale)

**Étapes**:

1. **Créer un ticket support fictif**: `TICKET-TEST-2026-001`

2. **Identifier l'utilisateur** (test avec `agent.test@crv.com`)
   ```javascript
   // Dans mongosh
   use CRV
   db.personnes.findOne({ email: "agent.test@crv.com" })
   ```

   **✅ Résultat attendu**: Document utilisateur trouvé

3. **Générer un mot de passe temporaire**: `TempAT20260105K9X2`

4. **Hasher le mot de passe** (Node.js ou script bcrypt)
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('TempAT20260105K9X2', 10);
   console.log(hash);
   // Exemple: $2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDE
   ```

5. **Mettre à jour MongoDB**
   ```javascript
   db.personnes.updateOne(
     { email: "agent.test@crv.com" },
     {
       $set: {
         motDePasse: "[HASH_BCRYPT]",
         doitChangerMotDePasse: true,
         dernierChangementMDP: new Date(),
         modifiePar: "ADMIN_TEST",
         raisonModification: "Test workaround P0-2 - TICKET-TEST-2026-001"
       }
     }
   )
   ```

   **✅ Résultat attendu**: `{ acknowledged: true, modifiedCount: 1 }`

6. **Créer le document de traçabilité**
   ```javascript
   db.mdp_reinitialisations.insertOne({
     ticketSupport: "TICKET-TEST-2026-001",
     utilisateurEmail: "agent.test@crv.com",
     utilisateurNom: "Agent Test",
     fonction: "AGENT_ESCALE",
     demandeLe: new Date(),
     validePar: "CHEF_TEST",
     valideLe: new Date(),
     preuveIdentite: "Badge professionnel",
     resetEffectuePar: "ADMIN_TEST",
     resetEffectueLe: new Date(),
     canalCommunication: "Test manuel",
     statut: "EN_ATTENTE",
     remarques: "Test de la procédure P0-2"
   })
   ```

   **✅ Résultat attendu**: Document créé avec succès

7. **Tester la connexion avec le mot de passe temporaire**
   ```http
   POST http://localhost:5000/api/auth/connexion
   Content-Type: application/json

   {
     "email": "agent.test@crv.com",
     "motDePasse": "TempAT20260105K9X2"
   }
   ```

   **✅ Résultat attendu**:
   - Code HTTP: `200 OK`
   - Token JWT reçu
   - Message indiquant le changement de MDP obligatoire

8. **Changer le mot de passe**
   ```http
   POST http://localhost:5000/api/auth/changer-mot-de-passe
   Content-Type: application/json
   Authorization: Bearer [TOKEN]

   {
     "ancienMotDePasse": "TempAT20260105K9X2",
     "nouveauMotDePasse": "NewTest1234!"
   }
   ```

   **✅ Résultat attendu**: `200 OK`, mot de passe changé

9. **Vérifier dans MongoDB**
   ```javascript
   db.personnes.findOne(
     { email: "agent.test@crv.com" },
     { doitChangerMotDePasse: 1, dernierChangementMDP: 1 }
   )
   ```

   **✅ Résultat attendu**: `doitChangerMotDePasse: false`

10. **Mettre à jour le document de traçabilité**
    ```javascript
    db.mdp_reinitialisations.updateOne(
      { ticketSupport: "TICKET-TEST-2026-001" },
      {
        $set: {
          utilisateurConnecteLe: new Date(),
          mdpChangeLe: new Date(),
          statut: "TERMINE",
          remarques: "Test réussi. Utilisateur a changé son MDP."
        }
      }
    )
    ```

---

### Scénario 2.2: Blocage si compte inactif

**Étapes**:

1. **Créer un compte de test inactif**
   ```javascript
   db.personnes.insertOne({
     nom: "Inactif",
     prenom: "Test",
     email: "inactif.test@crv.com",
     fonction: "AGENT_ESCALE",
     motDePasse: "$2a$10$...",
     actif: false,
     dateCreation: new Date()
   })
   ```

2. **Tenter de réinitialiser le MDP** (suivre procédure)

3. **Vérifier le blocage**
   ```javascript
   const utilisateur = db.personnes.findOne({ email: "inactif.test@crv.com" });
   if (!utilisateur.actif) {
     print("✅ Blocage attendu: compte inactif");
   }
   ```

   **✅ Résultat attendu**: La procédure doit s'arrêter et bloquer la réinitialisation

---

## ✅ TESTS DE NON-RÉGRESSION

**Objectif**: S'assurer que les correctifs P0 n'ont PAS cassé les fonctionnalités existantes

### Scénario 3.1: AGENT peut créer et modifier un CRV

**Étapes**:

1. **Se connecter en tant que AGENT**
   ```http
   POST http://localhost:5000/api/auth/connexion
   Content-Type: application/json

   {
     "email": "agent.test@crv.com",
     "motDePasse": "Test1234!"
   }
   ```

2. **Créer un CRV**
   ```http
   POST http://localhost:5000/api/crv
   Content-Type: application/json
   Authorization: Bearer [TOKEN_AGENT]

   {
     "numeroVol": "AF5678",
     "typeOperation": "DEPART",
     "compagnieAerienne": "Air France",
     "codeIATA": "AF",
     "dateVol": "2026-01-12T10:00:00Z"
   }
   ```

   **✅ Résultat attendu**: `201 Created`, CRV créé avec succès

3. **Modifier le CRV créé**
   ```http
   PATCH http://localhost:5000/api/crv/[ID_CRV]
   Content-Type: application/json
   Authorization: Bearer [TOKEN_AGENT]

   {
     "observations": "Test modification par AGENT"
   }
   ```

   **✅ Résultat attendu**: `200 OK`, CRV modifié

---

### Scénario 3.2: CHEF peut créer et modifier un CRV

**Étapes**: Identiques au 3.1 avec `chef.test@crv.com`

**✅ Résultat attendu**: Création et modification réussies

---

### Scénario 3.3: SUPERVISEUR peut valider un programme vol

**Étapes**:

1. **Se connecter en tant que SUPERVISEUR**

2. **Créer un programme vol** (avec AGENT ou CHEF d'abord)

3. **Valider le programme**
   ```http
   POST http://localhost:5000/api/programmes-vol/[ID_PROGRAMME]/valider
   Authorization: Bearer [TOKEN_SUPERVISEUR]
   ```

   **✅ Résultat attendu**: `200 OK`, programme validé

---

### Scénario 3.4: MANAGER peut supprimer un programme vol

**Étapes**:

1. **Se connecter en tant que MANAGER**

2. **Supprimer un programme vol**
   ```http
   DELETE http://localhost:5000/api/programmes-vol/[ID_PROGRAMME]
   Authorization: Bearer [TOKEN_MANAGER]
   ```

   **✅ Résultat attendu**: `200 OK`, programme supprimé

---

### Scénario 3.5: Tous les rôles opérationnels peuvent lire

**Étapes**:

1. **Tester la lecture avec chaque rôle** (AGENT, CHEF, SUPERVISEUR, MANAGER, QUALITE)
   ```http
   GET http://localhost:5000/api/crv
   Authorization: Bearer [TOKEN]
   ```

   **✅ Résultat attendu**: `200 OK` pour TOUS les rôles

---

## 📊 MATRICE DE VALIDATION

### P0-1: Middleware excludeQualite

| Scénario | Route testée | Méthode | QUALITE | Autre rôle | Statut |
|----------|--------------|---------|---------|------------|--------|
| 1.1 | `/api/crv` | POST | ❌ 403 | ✅ 201 | ⬜ À tester |
| 1.2 | `/api/crv/:id` | PATCH | ❌ 403 | ✅ 200 | ⬜ À tester |
| 1.3 | `/api/crv` | GET | ✅ 200 | ✅ 200 | ⬜ À tester |
| 1.4 | `/api/crv/:id/charges` | POST | ❌ 403 | ✅ 201 | ⬜ À tester |
| 1.5 | `/api/charges/:id/categories-detaillees` | PUT | ❌ 403 | ✅ 200 | ⬜ À tester |
| 1.6 | `/api/phases/:id/demarrer` | POST | ❌ 403 | ✅ 200 | ⬜ À tester |
| 1.7 | `/api/charges/statistiques/passagers` | GET | ✅ 200 | ✅ 200 | ⬜ À tester |

**Critère de succès**: TOUS les scénarios cochés ✅

---

### P0-2: Workaround MDP oublié

| Étape | Description | Statut |
|-------|-------------|--------|
| 2.1.1 | Identifier utilisateur dans MongoDB | ⬜ À tester |
| 2.1.2 | Générer MDP temporaire | ⬜ À tester |
| 2.1.3 | Hasher MDP avec bcrypt | ⬜ À tester |
| 2.1.4 | Mettre à jour MongoDB | ⬜ À tester |
| 2.1.5 | Créer document traçabilité | ⬜ À tester |
| 2.1.6 | Connexion avec MDP temporaire | ⬜ À tester |
| 2.1.7 | Changement MDP forcé | ⬜ À tester |
| 2.1.8 | Vérification `doitChangerMotDePasse: false` | ⬜ À tester |
| 2.2 | Blocage si compte inactif | ⬜ À tester |

**Critère de succès**: TOUTES les étapes cochées ✅

---

### Non-régression

| Scénario | Rôle | Action | Résultat attendu | Statut |
|----------|------|--------|------------------|--------|
| 3.1 | AGENT | Créer CRV | ✅ 201 | ⬜ À tester |
| 3.1 | AGENT | Modifier CRV | ✅ 200 | ⬜ À tester |
| 3.2 | CHEF | Créer CRV | ✅ 201 | ⬜ À tester |
| 3.2 | CHEF | Modifier CRV | ✅ 200 | ⬜ À tester |
| 3.3 | SUPERVISEUR | Valider programme vol | ✅ 200 | ⬜ À tester |
| 3.4 | MANAGER | Supprimer programme vol | ✅ 200 | ⬜ À tester |
| 3.5 | TOUS | Lire CRV (GET) | ✅ 200 | ⬜ À tester |

**Critère de succès**: TOUS les scénarios cochés ✅

---

## 📝 RAPPORT DE TEST

À compléter après exécution des tests:

```markdown
# RAPPORT DE TEST - Correctifs P0
Date: [DATE]
Testeur: [NOM]

## Résumé
- Total scénarios: 18
- Réussis: __/18
- Échoués: __/18
- Bloquants: __/18

## P0-1: Exclusion QUALITE
- Scénarios réussis: __/7
- Problèmes identifiés:
  - [ ] ...

## P0-2: Workaround MDP oublié
- Scénarios réussis: __/9
- Problèmes identifiés:
  - [ ] ...

## Non-régression
- Scénarios réussis: __/7
- Problèmes identifiés:
  - [ ] ...

## Décision
- [ ] ✅ Validé pour déploiement
- [ ] ❌ Correctifs requis avant déploiement
```

---

## 📚 ANNEXES

### Annexe A: Script création comptes de test

```javascript
// À exécuter dans mongosh
use CRV;

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hashTestPassword = bcrypt.hashSync('Test1234!', salt);

const comptesTest = [
  {
    nom: "Test",
    prenom: "Agent",
    email: "agent.test@crv.com",
    fonction: "AGENT_ESCALE",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  },
  {
    nom: "Test",
    prenom: "Chef",
    email: "chef.test@crv.com",
    fonction: "CHEF_EQUIPE",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  },
  {
    nom: "Test",
    prenom: "Superviseur",
    email: "superviseur.test@crv.com",
    fonction: "SUPERVISEUR",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  },
  {
    nom: "Test",
    prenom: "Manager",
    email: "manager.test@crv.com",
    fonction: "MANAGER",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  },
  {
    nom: "Test",
    prenom: "Qualite",
    email: "qualite.test@crv.com",
    fonction: "QUALITE",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  },
  {
    nom: "Test",
    prenom: "Admin",
    email: "admin.test@crv.com",
    fonction: "ADMIN",
    motDePasse: hashTestPassword,
    actif: true,
    dateCreation: new Date()
  }
];

db.personnes.insertMany(comptesTest);
print("✅ 6 comptes de test créés avec succès");
```

### Annexe B: Script création CRV de test

```javascript
// À exécuter après connexion AGENT
// Via Postman ou curl
POST http://localhost:5000/api/crv
Content-Type: application/json
Authorization: Bearer [TOKEN_AGENT]

{
  "numeroVol": "TEST001",
  "typeOperation": "ARRIVEE",
  "compagnieAerienne": "Test Airlines",
  "codeIATA": "TA",
  "dateVol": "2026-01-15T08:00:00Z",
  "aeroport": "CDG",
  "terminal": "2E",
  "numeroParking": "G12"
}
```

---

**Document de test** — Version 1.0.0 — 2026-01-05
**Validité**: Tests P0-1 et P0-2
**Révision**: Après chaque modification de sécurité
