# MVS-1-Security

## Presentation factuelle

Le MVS-1-Security gere l'authentification, l'autorisation et la gestion des utilisateurs du systeme CRV Operations. Il constitue le socle de securite sur lequel reposent tous les autres MVS.

---

## Perimetre exact couvert

### Fonctionnalites
- Authentification par email/password avec JWT
- Gestion du cycle de vie des comptes utilisateurs (CRUD)
- Gestion des roles et permissions (RBAC)
- Changement de mot de passe
- Tracabilite des actions (UserActivityLog)

### Entites gerees
- **Personne** : Utilisateurs du systeme
- **UserActivityLog** : Logs d'audit

### Endpoints exposes
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/login | Connexion |
| POST | /api/auth/register | Inscription |
| GET | /api/auth/me | Profil utilisateur |
| POST | /api/auth/changer-mot-de-passe | Changement MDP |
| GET | /api/personnes | Liste utilisateurs |
| GET | /api/personnes/:id | Detail utilisateur |
| POST | /api/personnes | Creation utilisateur (ADMIN) |
| PUT | /api/personnes/:id | Modification utilisateur (ADMIN) |
| DELETE | /api/personnes/:id | Suppression utilisateur (ADMIN) |
| GET | /api/personnes/stats/global | Statistiques |

---

## Documents generes

| Document | Description |
|----------|-------------|
| 01-models.md | Analyse exhaustive des modeles Personne et UserActivityLog |
| 02-services.md | Fonctions metier (dans controllers, pas de services dedies) |
| 03-controllers.md | Handlers HTTP et leurs specifications |
| 04-routes.md | Endpoints exposes avec middlewares |
| 05-process-metier.md | Chaines metier completes |
| 06-risques-non-regression.md | Points critiques et elements intouchables |

---

## Dependances avec autres MVS

### Ce MVS est utilise par

| MVS | Dependance | Description |
|-----|------------|-------------|
| MVS-2-CRV | Personne | creePar, responsableVol, verrouillePar |
| MVS-3-Phases | Personne | responsable phase |
| MVS-7-Notifications | Personne | destinataire notification |
| Tous | UserActivityLog | Tracabilite des actions |
| Tous | Middlewares | protect, authorize, excludeQualite |

### Ce MVS utilise

| MVS | Dependance | Description |
|-----|------------|-------------|
| Aucun | - | MVS autonome (socle) |

---

## Structure des fichiers

```
src/
├── models/
│   └── security/
│       ├── Personne.js
│       └── UserActivityLog.js
├── controllers/
│   └── security/
│       ├── auth.controller.js
│       └── personne.controller.js
├── routes/
│   └── security/
│       ├── auth.routes.js
│       └── personne.routes.js
└── middlewares/
    └── auth.middleware.js (protect, authorize, excludeQualite)
```

---

## Roles definis

| Role | Code | Droits |
|------|------|--------|
| Agent d'escale | AGENT_ESCALE | Operations de base |
| Chef d'equipe | CHEF_EQUIPE | Supervision equipe |
| Superviseur | SUPERVISEUR | Validation CRV |
| Manager | MANAGER | Gestion complete |
| Qualite | QUALITE | Lecture seule |
| Administrateur | ADMIN | Administration systeme |

---

## Statuts utilisateur

| Statut | Description |
|--------|-------------|
| ACTIF | Compte operationnel |
| ABSENT | Temporairement absent |
| CONGE | En conge |
| INACTIF | Compte desactive |

---

## Date d'audit

**2026-01-10**

---

## Notes d'audit

1. **Pas de service dedie** : La logique metier est directement dans les controllers
2. **Pas de soft delete** : Suppression definitive des utilisateurs
3. **Pas de verification dependances** : Suppression possible meme si reference ailleurs
4. **Logout client-side** : Pas de revocation de token cote serveur
5. **Expiration token fixe** : 3h, non configurable dynamiquement
