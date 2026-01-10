# SYNTHESE GLOBALE - AUDIT DE CONFORMITE BACKEND CRV

## Date d'audit : 2026-01-10
## Auditeur : Audit automatise
## Perimetre : 10 MVS (Modules de Valeur Systeme)

---

## 1. VUE D'ENSEMBLE

### Statut Global par MVS

| MVS | Nom | Statut | Ecarts |
|-----|-----|--------|--------|
| MVS-1 | Security | ⚠️ PARTIEL | Modeles avec divergences |
| MVS-2 | CRV | ✅ CONFORME | Aucun |
| MVS-3 | Phases | ✅ CONFORME | Aucun |
| MVS-4 | Charges | ✅ CONFORME | Aucun |
| MVS-5 | Flights | ✅ CONFORME | Aucun |
| MVS-6 | Resources | ✅ CONFORME | Aucun |
| MVS-7 | Notifications | ⚠️ PARTIEL | Structure differente |
| MVS-8 | Referentials | ⚠️ PARTIEL | Divergences majeures |
| MVS-9 | Transversal | ⚠️ PARTIEL | Enums differents |
| MVS-10 | Validation | ⚠️ PARTIEL | Divergences majeures |

### Statistiques

| Metrique | Valeur |
|----------|--------|
| MVS Conformes | 5 / 10 (50%) |
| MVS Partiels | 5 / 10 (50%) |
| MVS Non Conformes | 0 / 10 (0%) |

---

## 2. MVS CONFORMES (5)

### MVS-2-CRV
- Modele CRV.js : Conforme
- Services crv.service.js : Conforme
- Controllers crv.controller.js : Conforme
- Routes crv.routes.js : Conforme

### MVS-3-Phases
- Modeles (Phase.js, ChronologiePhase.js, Horaire.js) : Conformes
- Services phase.service.js : Conforme
- Controllers phase.controller.js : Conforme
- Routes phase.routes.js : Conforme

### MVS-4-Charges
- Modele ChargeOperationnelle.js : Conforme
- Extensions 4 & 5 : Implementees
- Controllers charge.controller.js : Conforme
- Routes charge.routes.js : Conforme

### MVS-5-Flights
- Modeles (Vol.js, ProgrammeVolSaisonnier.js) : Conformes
- Services vol.service.js : Conforme
- Controllers vol.controller.js : Conforme
- Routes vol.routes.js : Conforme

### MVS-6-Resources
- Modeles (Engin.js, AffectationEnginVol.js) : Conformes
- Services : Absence confirmee
- Controllers engin.controller.js : Conforme
- Routes engin.routes.js : Conforme

---

## 3. MVS AVEC DIVERGENCES (5)

### MVS-1-Security

| Composant | Ecarts identifies |
|-----------|-------------------|
| User.js | bcrypt salt 12 vs doc 10 |
| UserActivityLog.js | Structure differente |
| auth.service.js | Conforme |
| auth.controller.js | Conforme |
| auth.routes.js | Conforme |

### MVS-7-Notifications

| Composant | Ecarts identifies |
|-----------|-------------------|
| Notification.js | `lue` vs `lu`, structure `canaux` differente |
| notification.service.js | Fonctions supplementaires non documentees |
| alerteSLA.service.js | Non documente (Extension 8) |
| notification.routes.js | `/count` vs `/count-non-lues` |

### MVS-8-Referentials

| Composant | Ecarts identifies |
|-----------|-------------------|
| Avion.js | `capaciteMax` vs `capacitePassagers`+`capaciteFret` |
| Avion.js | `actif` Boolean vs `statut` enum |
| Avion.js | `version` Number vs String |
| avion.service.js | Existe mais non documente |
| avionConfiguration.controller.js | Handlers manquants et supplementaires |
| avion.routes.js | Routes et middlewares differents |

### MVS-9-Transversal

| Composant | Ecarts identifies |
|-----------|-------------------|
| AffectationPersonneVol.js | Enum `role` different (7 vs 5 valeurs) |
| AffectationPersonneVol.js | Enum `statut` different (PREVU vs AFFECTE) |
| EvenementOperationnel.js | Champ `vol` documente mais absent |
| EvenementOperationnel.js | Enum `typeEvenement` completement different |
| Middlewares | Conformes |

### MVS-10-Validation

| Composant | Ecarts identifies |
|-----------|-------------------|
| ValidationCRV.js | Enum `statut` completement different |
| ValidationCRV.js | `historique` documente mais absent |
| ValidationCRV.js | `verrouillePar` documente mais absent |
| validation.service.js | Existe mais non documente |
| validation.controller.js | `rejeterCRVController` absent |
| validation.routes.js | Route `/rejeter` absente |

---

## 4. SYNTHESE DES ECARTS PAR CATEGORIE

### 4.1 Ecarts de Schema (Modeles)

| Type d'ecart | Occurrences |
|--------------|-------------|
| Enums differents | 8 |
| Champs documentes absents | 5 |
| Champs non documentes presents | 7 |
| Types differents | 4 |
| References differentes (User vs Personne) | 3 |
| Noms de champs differents | 6 |

### 4.2 Ecarts de Services

| Type d'ecart | Occurrences |
|--------------|-------------|
| Services non documentes existants | 3 |
| Fonctions supplementaires non documentees | 12 |

### 4.3 Ecarts de Controllers

| Type d'ecart | Occurrences |
|--------------|-------------|
| Handlers documentes absents | 5 |
| Handlers non documentes presents | 8 |
| Noms differents | 3 |

### 4.4 Ecarts de Routes

| Type d'ecart | Occurrences |
|--------------|-------------|
| Routes documentees absentes | 5 |
| Routes non documentees presentes | 8 |
| Middlewares RBAC differents | 6 |

---

## 5. ANALYSE DES DIVERGENCES RBAC

### Approche documentee vs Approche implementee

| Documentation | Code reel |
|---------------|-----------|
| authorize(MANAGER, ADMIN) | excludeQualite |
| authorize(QUALITE, ADMIN) | excludeQualite |
| authorize(ADMIN) | excludeQualite |

### Impact
- La documentation decrit une approche basee sur les roles autorises
- Le code implemente une approche basee sur l'exclusion du role QUALITE
- Semantiquement equivalent mais approche differente

---

## 6. REFERENCE vers Personne vs User

### Constat
Plusieurs modeles font reference a `Personne` alors que la documentation indique `User` :

| Modele | Champ | Doc | Code |
|--------|-------|-----|------|
| Notification.js | destinataire | User | Personne |
| ValidationCRV.js | validePar | User | Personne |
| AffectationPersonneVol.js | personne | User | Personne |

### Note
Cette divergence systematique suggere une decision architecturale non refletee dans la documentation.

---

## 7. FICHIERS D'AUDIT GENERES

| Fichier | Chemin |
|---------|--------|
| MVS-1 | docs/process/audit-backend/MVS-1-Security-audit-backend.md |
| MVS-2 | docs/process/audit-backend/MVS-2-CRV-audit-backend.md |
| MVS-3 | docs/process/audit-backend/MVS-3-Phases-audit-backend.md |
| MVS-4 | docs/process/audit-backend/MVS-4-Charges-audit-backend.md |
| MVS-5 | docs/process/audit-backend/MVS-5-Flights-audit-backend.md |
| MVS-6 | docs/process/audit-backend/MVS-6-Resources-audit-backend.md |
| MVS-7 | docs/process/audit-backend/MVS-7-Notifications-audit-backend.md |
| MVS-8 | docs/process/audit-backend/MVS-8-Referentials-audit-backend.md |
| MVS-9 | docs/process/audit-backend/MVS-9-Transversal-audit-backend.md |
| MVS-10 | docs/process/audit-backend/MVS-10-Validation-audit-backend.md |

---

## 8. CONCLUSION

L'audit de conformite backend a identifie :

- **5 MVS conformes** : CRV, Phases, Charges, Flights, Resources
- **5 MVS avec divergences** : Security, Notifications, Referentials, Transversal, Validation

Les divergences principales concernent :
1. Les enums et valeurs autorisees (schemas differents)
2. Les services non documentes mais presents
3. L'approche RBAC (authorize vs excludeQualite)
4. Les references User vs Personne

Aucun MVS n'est en statut "NON CONFORME" car tous les composants principaux sont presents et fonctionnels. Les divergences identifiees relevent principalement d'evolutions du code non reportees dans la documentation.

---

**Fin de la synthese d'audit backend**
