# ⚡ Quick Reference - Backend API CRV

Guide rapide pour l'équipe Frontend

---

## 🎯 Création CRV - 2 modes

### Mode Simple (Recommandé pour prototype)
```javascript
const response = await api.post('/crv', {
  type: 'arrivee',  // ou 'depart' ou 'turnaround'
  date: '2026-01-07T08:00:00Z'
});

// Backend crée automatiquement:
// ✅ Vol (VOL0001, VOL0002, etc.)
// ✅ Horaire
// ✅ CRV avec numéro (CRV260107-0001)
// ✅ Phases initialisées
// ✅ Complétude calculée (20% de base)
```

### Mode Production (Avec Vol existant)
```javascript
const response = await api.post('/crv', {
  volId: '695a2b9703894c422fe7a028',
  responsableVolId: '695a2b6e03894c422fe7a016'  // Optionnel
});
```

---

## 📊 Complétude en temps réel

```
┌─────────────────────────────────────────┐
│  Complétude = 100%                      │
├─────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓░░  Phases          40%  (40%) │
│  ▓▓▓▓▓░░░░░  Charges         15%  (30%) │
│  ▓▓░░░░░░░░  Événements       5%  (20%) │
│  ▓░░░░░░░░░  Observations     3%  (10%) │
└─────────────────────────────────────────┘
   Total: 63% (en dessous du seuil de 80%)
```

**Formule:**
```javascript
completude = (
  scorePhases * 0.40 +
  scoreCharges * 0.30 +
  scoreEvenements * 0.20 +
  scoreObservations * 0.10
)
```

---

## 🔄 États CRV (cheat sheet)

```
BROUILLON ──[modifier]──> EN_COURS ──[valider]──> TERMINE
                                                      │
                                                      │
                                                  [valider]
                                                      │
                                                      ↓
    ┌─────────────────────────────────────────> VALIDE
    │                                                  │
    │                                            [auto-lock]
    │                                                  ↓
[annuler]                                      VERROUILLE
    │                                          (IMMUABLE)
    │
    ↓
 ANNULE
```

### Règles simples
- ✅ **BROUILLON/EN_COURS/TERMINE:** Modifiable
- ⚠️ **VALIDE:** Consultation seule
- 🔒 **VERROUILLE:** Immuable (erreur 403 si tentative modification)
- ❌ **ANNULE:** Archivé (réactivation possible)

---

## 🚨 Erreurs fréquentes

### 1. "Complétude insuffisante (0%)"
```javascript
// Cause: CRV vide, aucune donnée saisie
// Solution: Remplir au moins 80% des champs

// Check complétude:
const { data } = await api.get(`/crv/${crvId}`);
console.log(data.data.crv.completude); // Ex: 20%

// Minimum requis pour validation: 80%
```

### 2. "CRV verrouillé"
```json
{
  "success": false,
  "message": "INTERDIT : CRV validé et verrouillé",
  "code": "CRV_VERROUILLE"
}
```
**Solution:** Désactiver tous les formulaires
```javascript
const isLocked = crv.statut === 'VERROUILLE';
<Form disabled={isLocked} />
```

### 3. "Le mot de passe est requis"
```javascript
// Cause: Frontend envoie ni password ni motDePasse
// Solution: Envoyer au moins un des deux

await api.post('/personnes', {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean@test.com',
  motDePasse: 'Password123',  // ✅ OU password: '...'
  fonction: 'AGENT_ESCALE'
  // matricule: auto-généré si absent
});
```

### 4. "Vol non trouvé"
```javascript
// Cause: volId invalide ou Vol inexistant
// Solution: Utiliser mode auto-création

await api.post('/crv', {
  type: 'arrivee',  // ✅ Backend crée le Vol auto
  date: new Date().toISOString()
});
```

---

## 🔐 Authentification

### Headers requis sur TOUS les appels
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Token expiré (401)
```javascript
// Intercepteur global recommandé:
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expiré
      localStorage.removeItem('auth_token');
      router.push('/login?expired=true');
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 Format réponse standard

### Success
```json
{
  "success": true,
  "data": { /* vos données */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Description erreur",
  "code": "CODE_ERREUR",
  "errors": [
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

### Toujours vérifier success
```javascript
const { data } = await api.post('/crv', payload);

if (data.success) {
  const crv = data.data;  // ✅
} else {
  console.error(data.message);  // ✅
}
```

---

## 🎨 Normalisation données

### MongoDB _id vs Frontend id
```javascript
// Backend retourne TOUJOURS les deux:
{
  "_id": "695a2b6e03894c422fe7a016",
  "id": "695a2b6e03894c422fe7a016",  // ← Ajouté automatiquement
  "nom": "Dupont",
  // ...
}

// Frontend peut utiliser .id directement
user.id  // ✅ String
```

### Dates ISO 8601
```javascript
// Backend envoie:
"dateCreation": "2026-01-06T12:09:23.136Z"

// Frontend parse:
new Date(dateString)  // Conversion auto
```

---

## 🔢 Valeurs 0 vs Non renseigné

### ⚠️ IMPORTANT: Distinction explicite

```javascript
// ✅ BON (explicite)
{
  passagersAdultes: 0,        // = Zéro passagers
  passagersEnfants: undefined  // = Non renseigné
}

// ❌ MAUVAIS (implicite)
{
  passagersAdultes: null,  // Ambigu!
  passagersEnfants: null   // Ambigu!
}
```

**Règle:** Pour les charges, toujours envoyer une valeur explicite (même 0)

---

## ⚡ Endpoints essentiels

### Authentification
```
POST /api/auth/connexion       - Login (email + motDePasse)
POST /api/auth/deconnexion     - Logout
GET  /api/auth/me              - Profil utilisateur
```

### Utilisateurs
```
GET    /api/personnes          - Liste (avec id ajouté auto)
POST   /api/personnes          - Créer (matricule auto si absent)
GET    /api/personnes/:id      - Détail
PATCH  /api/personnes/:id      - Modifier
DELETE /api/personnes/:id      - Supprimer
```

### CRV
```
POST   /api/crv                - Créer (type + date OU volId)
GET    /api/crv                - Liste
GET    /api/crv/:id            - Détail complet
PATCH  /api/crv/:id            - Modifier
POST   /api/crv/:id/phases     - Mettre à jour phase
POST   /api/crv/:id/charges    - Ajouter charge
POST   /api/crv/:id/evenements - Ajouter événement
```

### Annulation (Extension 6)
```
POST /api/crv/:id/annuler      - Annuler CRV
POST /api/crv/:id/reactiver    - Réactiver CRV annulé
GET  /api/crv/:id/peut-annuler - Vérifier si annulation possible
```

---

## 🎯 Checklist intégration

### Avant déploiement

- [ ] Gérer token expiré (401 → redirect login)
- [ ] Vérifier `success: true` avant utiliser data
- [ ] Afficher complétude en temps réel (0-100%)
- [ ] Désactiver formulaire si `statut === 'VERROUILLE'`
- [ ] Gérer tous codes HTTP (400, 401, 403, 404, 500)
- [ ] Utiliser `id` au lieu de `_id` (backend fournit les deux)
- [ ] Envoyer valeurs explicites pour charges (0 vs undefined)
- [ ] Tester création CRV avec type='arrivee'/'depart'/'turnaround'
- [ ] Afficher messages erreur utilisateur friendly
- [ ] Logger erreurs techniques en console

---

## 📞 En cas de problème

1. **Lire le message d'erreur** (`error.response.data.message`)
2. **Vérifier le code erreur** (`error.response.data.code`)
3. **Consulter doc complète** (`CONTRAT_INTERFACE_BACKEND_FRONTEND.md`)
4. **Tester avec curl/Postman** (isoler problème backend vs frontend)

### Exemple debug
```javascript
catch (error) {
  console.log('Status:', error.response?.status);
  console.log('Message:', error.response?.data?.message);
  console.log('Code:', error.response?.data?.code);
  console.log('Errors:', error.response?.data?.errors);
}
```

---

**🚀 Prêt à intégrer!**
