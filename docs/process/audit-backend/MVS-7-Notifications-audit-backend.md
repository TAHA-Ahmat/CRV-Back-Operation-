# MVS-7-Notifications - AUDIT DE CONFORMITE BACKEND

## MVS : MVS-7-Notifications
## Date d'audit : 2026-01-10
## Source de reference : docs/process/MVS-7-Notifications/

---

## 1. MODELES (models/)

### 1.1 Notification.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/models/notifications/Notification.js | Present | ✅ |

#### Champs

| Champ Doc | Champ Code | Conformite |
|-----------|------------|------------|
| destinataire (ObjectId ref User) | destinataire (ObjectId ref Personne) | ⚠️ Ref differente |
| type (String enum) | type (String enum) | ✅ Conforme |
| titre (String, required, max 200) | titre (String, required, trim) | ⚠️ maxlength absent |
| message (String, required, max 2000) | message (String, required, trim) | ⚠️ maxlength absent |
| lien (String) | lien (String, default: null, trim) | ✅ Conforme |
| lue (Boolean, default false) | lu (Boolean, default false) | ⚠️ Nom different |
| dateLecture (Date) | dateLecture (Date, default: null) | ✅ Conforme |
| priorite (String enum) | priorite (String enum) | ✅ Conforme |
| canaux ([String] enum array) | canaux (Object avec sous-schemas) | ⚠️ Structure differente |
| source.type (String enum) | source (String enum) | ⚠️ Structure differente |
| source.id (ObjectId) | referenceModele + referenceId | ⚠️ Noms differents |
| expiration (Date) | expiration (Date, default: null) | ✅ Conforme |

#### Champs NON documentes presents dans le code

| Champ | Type | Description |
|-------|------|-------------|
| donnees | Mixed | Donnees additionnelles JSON |
| archive | Boolean | Notification archivee |
| dateArchivage | Date | Date d'archivage |
| referenceModele | String | Type de modele reference |
| referenceId | ObjectId | ID du document reference |

#### Enum type

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| INFO, WARNING, ERROR, SUCCESS, ALERTE_SLA | Identique | ✅ Conforme |

#### Enum priorite

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| BASSE, NORMALE, HAUTE, URGENTE | Identique | ✅ Conforme |

#### Enum source

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| CRV, VOL, PHASE, SYSTEME, UTILISATEUR | SYSTEME, ADMIN, ALERTE_SLA, WORKFLOW, VALIDATION, AUTRE | ⚠️ Valeurs differentes |

#### Structure canaux

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| Array ['email', 'sms', 'push', 'inApp'] | Object { email: {...}, sms: {...}, push: {...}, inApp: {...} } | ⚠️ Structure differente |

#### Index

| Documentation | Code reel | Conformite |
|---------------|-----------|------------|
| destinataire | destinataire: 1, lu: 1 | ⚠️ Index composite non documente |
| - | destinataire: 1, archive: 1 | Non documente |
| - | destinataire: 1, createdAt: -1 | Non documente |
| - | type: 1, priorite: 1 | Non documente |
| - | expiration: 1 | Non documente |

#### Methodes Instance

| Methode | Documentation | Code | Conformite |
|---------|---------------|------|------------|
| marquerCommeLue | Non documentee | Present L124-128 | Non documente |
| archiver | Non documentee | Present L131-135 | Non documente |

#### Virtual

| Virtual | Documentation | Code | Conformite |
|---------|---------------|------|------------|
| estExpiree | Non documente | Present L118-121 | Non documente |

**Resultat Notification.js** : ⚠️ DIVERGENCES LISTEES

---

## 2. SERVICES (services/)

### 2.1 notification.service.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/services/notifications/notification.service.js | Present | ✅ |

#### Fonctions Email

| Fonction Doc | Fonction Code | Conformite |
|--------------|---------------|------------|
| envoyerEmail | notifierCRVPretValidation | ⚠️ Nom different |
| - | notifierIncidentCritique | Non documente |
| - | notifierValidationCRV | Non documente |
| - | testerConfigurationEmail | Non documente |

#### Fonctions In-App (Extension 7)

| Fonction | Doc | Code | Conformite |
|----------|-----|------|------------|
| creerNotificationInApp | Present | Present L323-331 | ✅ Conforme |
| creerNotificationMultiple | Non doc | Present L339-354 | Non documente |
| obtenirNotificationsUtilisateur | Present | Present L362-401 | ✅ Conforme |
| marquerCommeLue | Present | Present L409-425 | ✅ Conforme |
| marquerToutesCommeLues | Present | Present L432-449 | ✅ Conforme |
| archiverNotification | Non doc | Present L457-473 | Non documente |
| supprimerNotification | Present | Present L481-497 | ✅ Conforme |
| compterNonLues | Present | Present L504-521 | ✅ Conforme |
| nettoyerNotificationsExpirees | Present | Present L527-539 | ✅ Conforme |
| obtenirStatistiquesNotifications | Non doc | Present L546-582 | Non documente |
| envoyerAlerteSLA | Non doc | Present L590-610 | Non documente |

**Resultat notification.service.js** : ⚠️ DIVERGENCES (fonctions non documentees)

---

### 2.2 alerteSLA.service.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/services/notifications/alerteSLA.service.js | Present | ✅ |

#### Note

Ce service n'est pas documente dans MVS-7. Il fait partie de l'Extension 8 (Alertes SLA proactives).

#### Fonctions presentes

| Fonction | Description |
|----------|-------------|
| verifierSLACRV | Verifie le SLA d'un CRV |
| verifierSLAPhase | Verifie le SLA d'une phase |
| surveillerTousCRV | Surveille tous les CRV actifs |
| surveillerToutesPhases | Surveille toutes les phases actives |
| obtenirRapportSLA | Rapport complet SLA |
| configurerSLA | Configuration SLA personnalisee |
| obtenirConfigurationSLA | Obtenir configuration SLA |

**Resultat alerteSLA.service.js** : ⚠️ Non documente (Extension 8)

---

## 3. CONTROLLERS (controllers/)

### 3.1 notification.controller.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/notifications/notification.controller.js | Present | ✅ |

#### Handlers

| Handler | Doc | Code | Conformite |
|---------|-----|------|------------|
| obtenirMesNotifications | Present | Present L19-54 | ✅ Conforme |
| compterNonLues | Present | Present L60-78 | ✅ Conforme |
| marquerCommeLue | Present | Present L84-112 | ✅ Conforme |
| marquerToutesCommeLues | Present | Present L118-137 | ✅ Conforme |
| archiverNotification | Non doc | Present L143-171 | Non documente |
| supprimerNotification | Present | Present L177-204 | ✅ Conforme |
| obtenirStatistiques | Non doc | Present L210-228 | Non documente |
| creerNotification | Present | Present L234-253 | ✅ Conforme |

**Resultat notification.controller.js** : ⚠️ DIVERGENCES (handlers supplementaires)

---

### 3.2 alerteSLA.controller.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/controllers/notifications/alerteSLA.controller.js | Present | ✅ |

#### Note

Controller non documente - Extension 8.

**Resultat alerteSLA.controller.js** : ⚠️ Non documente (Extension 8)

---

## 4. ROUTES (routes/)

### 4.1 notification.routes.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/notifications/notification.routes.js | Present | ✅ |
| Base path | /api/notifications | Present | ✅ |

#### Routes

| Route Doc | Route Code | Conformite |
|-----------|------------|------------|
| GET / | router.get L66 | ✅ Conforme |
| GET /count | GET /count-non-lues L44 | ⚠️ Chemin different |
| POST / | router.post L74 | ⚠️ Middleware different |
| PATCH /:id/lire | router.patch L83 | ✅ Conforme |
| PATCH /lire-toutes | router.patch L51 | ✅ Conforme |
| DELETE /:id | router.delete L97 | ✅ Conforme |

#### Routes supplementaires non documentees

| Route | Methode | Conformite |
|-------|---------|------------|
| /statistiques | GET | Non documente |
| /:id/archiver | PATCH | Non documente |

#### Middlewares

| Route | Doc | Code | Conformite |
|-------|-----|------|------------|
| POST / | authorize(ADMIN, MANAGER) | authorize('MANAGER') | ⚠️ ADMIN absent |

**Resultat notification.routes.js** : ⚠️ DIVERGENCES

---

### 4.2 alerteSLA.routes.js

| Element | Documentation | Code reel | Statut |
|---------|---------------|-----------|--------|
| Fichier | src/routes/notifications/alerteSLA.routes.js | Present | ✅ |
| Base path | /api/sla | Present | - |

#### Note

Routes non documentees - Extension 8.

**Resultat alerteSLA.routes.js** : ⚠️ Non documente (Extension 8)

---

## 5. SYNTHESE MVS-7-Notifications

### Statut global : ⚠️ PARTIEL

### Resume

| Composant | Statut |
|-----------|--------|
| Notification.js | ⚠️ Divergences structure |
| notification.service.js | ⚠️ Fonctions supplementaires |
| alerteSLA.service.js | ⚠️ Non documente |
| notification.controller.js | ⚠️ Handlers supplementaires |
| alerteSLA.controller.js | ⚠️ Non documente |
| notification.routes.js | ⚠️ Divergences routes |
| alerteSLA.routes.js | ⚠️ Non documente |

### Liste des ecarts

#### Modele Notification.js
1. Champ `lue` documente mais code utilise `lu`
2. Champ `canaux` : array dans doc, object dans code
3. Structure `source.type/source.id` differente de `source` + `referenceModele/referenceId`
4. Enum `source` : valeurs differentes
5. Champs non documentes : `donnees`, `archive`, `dateArchivage`
6. Methodes instance non documentees : `marquerCommeLue`, `archiver`
7. Virtual `estExpiree` non documente
8. Index supplementaires non documentes

#### Services
1. Fonction `envoyerEmail` documentee remplacee par fonctions specifiques
2. Fonctions Extension 7 supplementaires non documentees
3. Service `alerteSLA.service.js` entierement non documente

#### Controllers
1. Handler `archiverNotification` non documente
2. Handler `obtenirStatistiques` non documente
3. Controller `alerteSLA.controller.js` non documente

#### Routes
1. Route `/count` documentee mais code utilise `/count-non-lues`
2. Route `/statistiques` non documentee
3. Route `/:id/archiver` non documentee
4. Middleware POST / : ADMIN absent (doc: ADMIN, MANAGER / code: MANAGER uniquement)
5. Routes SLA non documentees

---

**Fin de l'audit MVS-7-Notifications**
