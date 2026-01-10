# CARTOGRAPHIE STRUCTURELLE BACKEND CRV
## Arborescence reelle - Lecture factuelle

**Document produit le 2026-01-09**
**Objectif** : Description factuelle de la structure backend telle qu'elle existe
**Aucune modification de code effectuee**

---

## 1. ARBORESCENCE BACKEND COMPLETE

```
Back/
│
├── .claude/                          [TECHNIQUE - Config Claude Code]
├── .env                              [TECHNIQUE - Variables environnement]
├── .env.example                      [TECHNIQUE - Template variables]
├── .git/                             [TECHNIQUE - Versionning Git]
├── .gitignore                        [TECHNIQUE - Exclusions Git]
│
├── config/                           [TECHNIQUE - Configurations externes]
│   ├── .gitignore
│   ├── archivagebonsdecommande.json.example
│   ├── README.md
│   ├── google/
│   │   └── ths-crv-operations.json   -> Credentials Google Drive
│   └── json/
│       ├── .gitignore
│       ├── README.md
│       ├── ths-crv-operations.json   -> Config archivage Drive
│       └── ths-crv-operations.json.example
│
├── createAdmin.js                    [UTILITAIRE - Script creation admin]
├── resetAdminPassword.js             [UTILITAIRE - Script reset password]
├── test-archivage.js                 [UTILITAIRE - Test archivage Drive]
├── PREMIERE_INSTALLATION.md          [DOCUMENTATION]
├── README.md                         [DOCUMENTATION]
│
├── docs/                             [DOCUMENTATION - 15+ fichiers .md]
│
├── node_modules/                     [TECHNIQUE - Dependances npm]
├── package.json                      [TECHNIQUE - Config npm]
├── package-lock.json                 [TECHNIQUE - Lockfile npm]
│
└── src/                              [CODE SOURCE PRINCIPAL]
    ├── app.js                        -> Point d'entree Express
    ├── server.js                     -> Demarrage serveur HTTP
    │
    ├── config/                       [UTILISE]
    │   ├── db.js                     -> Connexion MongoDB
    │   └── env.js                    -> Chargement variables environnement
    │
    ├── models/                       [UTILISE - 18 fichiers]
    │   ├── Personne.js               -> MVS 1 - Schema utilisateur/personnel
    │   ├── UserActivityLog.js        -> MVS 1 - Logs audit activite
    │   ├── CRV.js                    -> MVS 2 - Schema Compte-Rendu de Vol
    │   ├── HistoriqueModification.js -> MVS 2 - Audit modifications CRV
    │   ├── Observation.js            -> MVS 2 - Remarques sur CRV
    │   ├── Phase.js                  -> MVS 3 - Referentiel phases
    │   ├── ChronologiePhase.js       -> MVS 3 - Execution phases par CRV
    │   ├── Horaire.js                -> MVS 3 - Horaires vol (prevus/reels)
    │   ├── ChargeOperationnelle.js   -> MVS 4 - Passagers/bagages/fret
    │   ├── Engin.js                  -> MVS 5 - Equipements piste
    │   ├── AffectationEnginVol.js    -> MVS 5 - Liaison engin-vol
    │   ├── Vol.js                    -> MVS 6 - Schema vol
    │   ├── ProgrammeVolSaisonnier.js -> MVS 6 - Programmes recurrents
    │   ├── ValidationCRV.js          -> MVS 7 - Validation qualite
    │   ├── Notification.js           -> MVS 8 - Notifications in-app
    │   ├── Avion.js                  -> MVS 9 - Configuration aeronefs
    │   ├── EvenementOperationnel.js  -> TRANSVERSAL - Incidents/evenements
    │   ├── AffectationPersonneVol.js -> TRANSVERSAL - Liaison personnel-vol
    │   │
    │   ├── CRV/                      [VIDE]
    │   └── User/                     [VIDE]
    │
    ├── controllers/                  [UTILISE - 17 fichiers]
    │   ├── auth.controller.js        -> MVS 1 - Authentification
    │   ├── personne.controller.js    -> MVS 1 - Gestion utilisateurs
    │   ├── crv.controller.js         -> MVS 2 - CRUD CRV (fichier principal)
    │   ├── annulation.controller.js  -> MVS 2 - Annulation/reactivation CRV
    │   ├── crvArchivage.controller.js-> MVS 2 - Archivage Google Drive
    │   ├── phase.controller.js       -> MVS 3 - Gestion phases
    │   ├── passager.controller.js    -> MVS 4 - Categories passagers
    │   ├── fret.controller.js        -> MVS 4 - Fret et matieres dangereuses
    │   ├── engin.controller.js       -> MVS 5 - Gestion engins
    │   ├── vol.controller.js         -> MVS 6 - Gestion vols
    │   ├── programmeVol.controller.js-> MVS 6 - Programmes saisonniers
    │   ├── volProgramme.controller.js-> MVS 6 - Liaison vol-programme
    │   ├── validation.controller.js  -> MVS 7 - Validation CRV
    │   ├── notification.controller.js-> MVS 8 - Notifications
    │   ├── alerteSLA.controller.js   -> MVS 8 - Alertes SLA
    │   ├── avionConfiguration.controller.js -> MVS 9 - Config avions
    │   │
    │   ├── Auth/                     [VIDE]
    │   └── CRV/                      [VIDE]
    │
    ├── routes/                       [UTILISE - 12 fichiers]
    │   ├── auth.routes.js            -> MVS 1 - Routes authentification
    │   ├── personne.routes.js        -> MVS 1 - Routes utilisateurs
    │   ├── crv.routes.js             -> MVS 2 - Routes CRV
    │   ├── phase.routes.js           -> MVS 3 - Routes phases
    │   ├── charge.routes.js          -> MVS 4 - Routes charges (passagers/fret)
    │   ├── engin.routes.js           -> MVS 5 - Routes engins
    │   ├── vol.routes.js             -> MVS 6 - Routes vols
    │   ├── programmeVol.routes.js    -> MVS 6 - Routes programmes
    │   ├── validation.routes.js      -> MVS 7 - Routes validation
    │   ├── notification.routes.js    -> MVS 8 - Routes notifications
    │   ├── alerteSLA.routes.js       -> MVS 8 - Routes SLA
    │   ├── avion.routes.js           -> MVS 9 - Routes avions
    │   │
    │   ├── Auth/                     [VIDE]
    │   └── CRV/                      [VIDE]
    │
    ├── services/                     [UTILISE - 15 fichiers]
    │   ├── crv.service.js            -> MVS 2 - Logique metier CRV
    │   ├── annulation.service.js     -> MVS 2 - Logique annulation
    │   ├── crvArchivageService.js    -> MVS 2 - Archivage Drive
    │   ├── pdfService.js             -> MVS 2 - Generation PDF
    │   ├── googleDriveService.js     -> MVS 2 - Integration Google Drive API
    │   ├── phase.service.js          -> MVS 3 - Logique phases
    │   ├── calcul.service.js         -> MVS 3 - Calculs durees/ecarts
    │   ├── passager.service.js       -> MVS 4 - Logique passagers
    │   ├── fret.service.js           -> MVS 4 - Logique fret
    │   ├── vol.service.js            -> MVS 6 - Logique vols
    │   ├── programmeVol.service.js   -> MVS 6 - Logique programmes
    │   ├── validation.service.js     -> MVS 7 - Logique validation
    │   ├── notification.service.js   -> MVS 8 - Logique notifications
    │   ├── alerteSLA.service.js      -> MVS 8 - Logique alertes SLA
    │   ├── avion.service.js          -> MVS 9 - Logique configuration avions
    │   │
    │   ├── Google/                   [VIDE]
    │   └── Pdf/                      [VIDE]
    │
    ├── middlewares/                  [UTILISE - 7 fichiers]
    │   ├── auth.middleware.js        -> SUPPORT MVS 1 - JWT/RBAC
    │   ├── auditRequest.middleware.js-> SUPPORT MVS 1 - Debut audit requete
    │   ├── auditFinalize.middleware.js-> SUPPORT MVS 1 - Fin audit requete
    │   ├── auditLog.middleware.js    -> SUPPORT MVS 2 - Logging CRV
    │   ├── businessRules.middleware.js-> SUPPORT MVS 3 - Regles metier phases
    │   ├── validation.middleware.js  -> SUPPORT GLOBAL - Validation schemas
    │   ├── error.middleware.js       -> SUPPORT GLOBAL - Gestion erreurs
    │   │
    │   └── Auth/                     [VIDE]
    │
    └── utils/                        [UTILISE - 6 fichiers]
        ├── asyncHandler.js           -> TECHNIQUE - Wrapper async Express
        ├── dateHelpers.js            -> TECHNIQUE - Utilitaires dates
        ├── responseHelpers.js        -> TECHNIQUE - Formatage reponses API
        ├── validators.js             -> TECHNIQUE - Validations custom
        ├── seedPhases.js             -> SEED - Initialisation phases
        └── seedAdmin.js              -> SEED - Initialisation compte admin
```

---

## 2. DOSSIERS VIDES OU PARTIELLEMENT UTILISES

### Dossiers VIDES identifies (9 dossiers)

| Dossier | Statut | Contenu |
|---------|--------|---------|
| `src/models/CRV/` | VIDE | Aucun fichier |
| `src/models/User/` | VIDE | Aucun fichier |
| `src/controllers/Auth/` | VIDE | Aucun fichier |
| `src/controllers/CRV/` | VIDE | Aucun fichier |
| `src/routes/Auth/` | VIDE | Aucun fichier |
| `src/routes/CRV/` | VIDE | Aucun fichier |
| `src/middlewares/Auth/` | VIDE | Aucun fichier |
| `src/services/Google/` | VIDE | Aucun fichier |
| `src/services/Pdf/` | VIDE | Aucun fichier |

**Constat** : Ces sous-dossiers semblent etre des vestiges d'une structure initialement prevue mais non utilisee. Tous les fichiers actifs sont a la racine de leurs dossiers parents respectifs.

### Dossiers UTILISES

| Dossier | Statut | Nombre fichiers |
|---------|--------|-----------------|
| `src/models/` | UTILISE | 18 fichiers |
| `src/controllers/` | UTILISE | 17 fichiers |
| `src/routes/` | UTILISE | 12 fichiers |
| `src/services/` | UTILISE | 15 fichiers |
| `src/middlewares/` | UTILISE | 7 fichiers |
| `src/utils/` | UTILISE | 6 fichiers |
| `src/config/` | UTILISE | 2 fichiers |

---

## 3. DOSSIERS HORS LOGIQUE METIER

### Dossiers TECHNIQUES (ne portent pas de MVS)

| Dossier | Role | Supporte MVS |
|---------|------|--------------|
| `src/config/` | Connexion DB, variables env | TOUS |
| `src/utils/` | Utilitaires transversaux | TOUS |
| `config/` (racine) | Credentials Google Drive | MVS 2 (archivage) |
| `node_modules/` | Dependances npm | TOUS |
| `.git/` | Versionning | - |
| `.claude/` | Config Claude Code | - |
| `docs/` | Documentation | - |

### Fichiers TECHNIQUES racine

| Fichier | Role |
|---------|------|
| `app.js` | Point d'entree Express, enregistrement routes |
| `server.js` | Demarrage serveur HTTP |
| `package.json` | Config npm, scripts |
| `.env` | Variables environnement |
| `createAdmin.js` | Script utilitaire |
| `resetAdminPassword.js` | Script utilitaire |
| `test-archivage.js` | Script test |

### Middlewares (SUPPORT - pas de MVS propre)

| Middleware | Supporte MVS |
|------------|--------------|
| `auth.middleware.js` | MVS 1 (Securite) |
| `auditRequest.middleware.js` | MVS 1 (Securite) |
| `auditFinalize.middleware.js` | MVS 1 (Securite) |
| `auditLog.middleware.js` | MVS 2 (CRV) |
| `businessRules.middleware.js` | MVS 3 (Phases) |
| `validation.middleware.js` | GLOBAL |
| `error.middleware.js` | GLOBAL |

---

## 4. SYNTHESE FINALE

### A. Tableau de correspondance Dossier -> MVS

| Dossier | MVS couverts | Commentaire |
|---------|--------------|-------------|
| `src/models/` | MVS 1-9 | 18 schemas Mongoose, tous MVS representes |
| `src/controllers/` | MVS 1-9 | 17 controllers, tous MVS representes |
| `src/routes/` | MVS 1-9 | 12 routers, tous MVS representes |
| `src/services/` | MVS 2-9 | 15 services, MVS 1 (Securite) absent |
| `src/middlewares/` | SUPPORT | 7 middlewares, supportent MVS 1-3 + global |
| `src/utils/` | TECHNIQUE | 6 utilitaires, aucun MVS propre |
| `src/config/` | TECHNIQUE | 2 fichiers config, aucun MVS propre |
| `config/` (racine) | TECHNIQUE | Credentials Google Drive, supporte MVS 2 |

### B. Liste des dossiers sans logique metier

1. `src/config/` - Configuration technique
2. `src/utils/` - Utilitaires transversaux
3. `config/` (racine) - Credentials externes
4. `node_modules/` - Dependances npm
5. `docs/` - Documentation
6. `.git/` - Versionning
7. `.claude/` - Config outil

### C. Liste des sous-dossiers VIDES

1. `src/models/CRV/`
2. `src/models/User/`
3. `src/controllers/Auth/`
4. `src/controllers/CRV/`
5. `src/routes/Auth/`
6. `src/routes/CRV/`
7. `src/middlewares/Auth/`
8. `src/services/Google/`
9. `src/services/Pdf/`

### D. Statistiques

| Element | Quantite |
|---------|----------|
| Fichiers .js dans src/ | 75 |
| Modeles Mongoose | 18 |
| Controllers | 17 |
| Routes | 12 |
| Services | 15 |
| Middlewares | 7 |
| Utilitaires | 6 |
| Sous-dossiers vides | 9 |

---

## CONFIRMATION

**Aucune modification de code n'a ete effectuee.**
**Cette structure reflete strictement l'existant.**

---

## QUESTION DE VALIDATION

Cette structure correspond-elle exactement a l'existant ?
