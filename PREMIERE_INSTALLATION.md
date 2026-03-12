# 🚀 Guide de Première Installation - CRV Backend

## Étape 1: Configuration MongoDB Atlas

### ⚠️ Problème actuel
```
Error: Could not connect to any servers in your MongoDB Atlas cluster.
Raison: Votre IP n'est pas dans la whitelist
```

### ✅ Solution

1. **Accédez à MongoDB Atlas**
   - Ouvrez https://cloud.mongodb.com/
   - Connectez-vous avec vos identifiants

2. **Allez dans Network Access**
   - Cliquez sur "Network Access" dans le menu de gauche (section "Security")

3. **Ajoutez votre IP**

   **Option A - Recommandée pour développement:**
   - Cliquez sur "Add IP Address"
   - Cliquez sur "Add Current IP Address" (détecte automatiquement votre IP)
   - Cliquez sur "Confirm"

   **Option B - Pour tests uniquement (moins sécurisé):**
   - Cliquez sur "Add IP Address"
   - Cliquez sur "Allow Access from Anywhere"
   - Cela ajoute `0.0.0.0/0` (⚠️ Ne pas utiliser en production!)
   - Cliquez sur "Confirm"

4. **Attendez 1-2 minutes**
   - La modification prend quelques instants pour se propager

---

## Étape 2: Initialiser les Phases

Les phases sont les étapes opérationnelles (atterrissage, embarquement, décollage, etc.)

```bash
npm run seed:phases
```

**Résultat attendu:**
```
✅ 16 phases créées avec succès
   - Arrivée: 6
   - Départ: 9
   - Communes: 1
```

---

## Étape 3: Créer le Premier Compte ADMIN

```bash
npm run seed:admin
```

**Résultat attendu:**
```
✅ Compte ADMIN créé avec succès!

📋 Informations de connexion:
   ┌─────────────────────────────────────
   │ Email:    admin@crv.com
   │ Password: Admin123!
   └─────────────────────────────────────

⚠️  IMPORTANT: Changez le mot de passe après la première connexion!
```

---

## Étape 4: Démarrer le Serveur

```bash
npm run dev
```

**Résultat attendu:**
```
🚀 Serveur démarré sur le port 5000
✅ Connecté à MongoDB
```

---

## Étape 5: Première Connexion

### Via Postman / Insomnia / cURL

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@crv.com",
  "password": "Admin123!"
}
```

**Réponse:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "nom": "Admin",
    "prenom": "Système",
    "email": "admin@crv.com",
    "fonction": "ADMIN",
    "matricule": "ADM001"
  }
}
```

### Via cURL (depuis le terminal)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@crv.com\",\"password\":\"Admin123!\"}"
```

---

## Étape 6: Changer le Mot de Passe (RECOMMANDÉ)

**Endpoint:** `PUT http://localhost:5000/api/personnes/:id`

**Headers:**
```
Authorization: Bearer <votre_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "password": "VotreNouveauMotDePasse2025!"
}
```

---

## 📋 Résumé des Commandes

```bash
# 1. Installer les dépendances (si pas déjà fait)
npm install

# 2. Configurer MongoDB Atlas (voir Étape 1)
# (via interface web)

# 3. Initialiser les phases
npm run seed:phases

# 4. Créer le compte admin
npm run seed:admin

# 5. Démarrer le serveur
npm run dev
```

---

## 🔑 Informations de Connexion par Défaut

| Champ     | Valeur          |
|-----------|----------------|
| Email     | admin@crv.com  |
| Password  | Admin123!      |
| Fonction  | ADMIN          |
| Matricule | ADM001         |

⚠️ **À changer immédiatement après la première connexion!**

---

## 🆘 Problèmes Fréquents

### ❌ "Could not connect to MongoDB"
- **Cause:** IP non whitelistée dans MongoDB Atlas
- **Solution:** Suivre Étape 1

### ❌ "Email ou matricule déjà utilisé"
- **Cause:** Un compte existe déjà
- **Solution:** Le compte admin existe déjà, utilisez-le pour vous connecter

### ❌ "Un compte ADMIN existe déjà"
- **Cause:** `seed:admin` a déjà été exécuté
- **Solution:** Normal! Connectez-vous avec les identifiants existants

### ❌ "Identifiants invalides"
- **Cause:** Email ou mot de passe incorrect
- **Solution:** Vérifiez l'orthographe (email: admin@crv.com, password: Admin123!)

### ❌ "Compte inactif"
- **Cause:** Le statut du compte n'est pas ACTIF
- **Solution:** Vérifier le champ `statut` dans la base de données

---

## 🎯 Prochaines Étapes

Après la première connexion, vous pouvez:

1. **Créer d'autres utilisateurs** via `POST /api/personnes`
2. **Créer des avions** via `POST /api/avions`
3. **Créer des vols** via `POST /api/vols`
4. **Créer des CRV** via `POST /api/crv`

📚 Consultez la documentation complète dans `docs/API_COMPLETE_FRONTEND.md`
