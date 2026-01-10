# Couverture API Frontend CRV

## Statut : 100% des endpoints backend couverts

Date de mise à jour : 2025-01-06

---

## Résumé

| Module API | Routes Backend | Couverture Frontend | Store Pinia |
|------------|---------------|---------------------|-------------|
| authAPI | 5 | 100% | authStore |
| personnesAPI | 8 | 100% | personnesStore |
| crvAPI | 11 | 100% | crvStore |
| phasesAPI | 6 | 100% | phasesStore + crvStore |
| volsAPI | 8 | 100% | volsStore |
| programmesVolAPI | 9 | 100% | programmesStore |
| chargesAPI | 12 | 100% | chargesStore + crvStore |
| avionsAPI | 12 | 100% | avionsStore |
| notificationsAPI | 8 | 100% | notificationsStore |
| slaAPI | 7 | 100% | slaStore |
| validationAPI | 3 | 100% | crvStore |
| **TOTAL** | **78 routes** | **100%** | **10 stores** |

---

## 1. AUTH API (5 routes)

**Store : `authStore.js`**
**Service Legacy : `authService.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/auth/connexion` | POST | ✅ | `login()` |
| `/auth/inscription` | POST | ✅ | `register()` (API) |
| `/auth/me` | GET | ✅ | `fetchUser()` |
| `/auth/deconnexion` | POST | ✅ | `logout()` |
| `/auth/changer-mot-de-passe` | POST | ✅ | `changerMotDePasse()` |

---

## 2. PERSONNES API (8 routes) - ADMIN

**Store : `personnesStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/personnes` | GET | ✅ | `listPersonnes()` |
| `/personnes/:id` | GET | ✅ | `loadPersonne()` |
| `/personnes` | POST | ✅ | `createPersonne()` |
| `/personnes/:id` | PATCH | ✅ | `updatePersonne()` |
| `/personnes/:id` | DELETE | ✅ | `deletePersonne()` |
| Désactiver | PATCH | ✅ | `desactiverPersonne()` |
| Réactiver | PATCH | ✅ | `reactiverPersonne()` |
| Suspendre | PATCH | ✅ | `suspendrePersonne()` |

---

## 3. CRV API (11 routes)

**Store : `crvStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/crv` | POST | ✅ | `createCRV()` |
| `/crv` | GET | ✅ | `listCRV()` |
| `/crv/:id` | GET | ✅ | `loadCRV()` |
| `/crv/:id` | PATCH | ✅ | `updateCRV()` |
| `/crv/:id` | DELETE | ✅ | `deleteCRV()` |
| `/crv/:id/charges` | POST | ✅ | `addCharge()` |
| `/crv/:id/evenements` | POST | ✅ | `addEvenement()` |
| `/crv/:id/observations` | POST | ✅ | `addObservation()` |
| `/crv/search` | GET | ✅ | `searchCRV()` |
| `/crv/stats` | GET | ✅ | `getStats()` |
| `/crv/export` | GET | ✅ | `exportCRV()` |
| `/crv/annules` | GET | ✅ | API directe |
| `/crv/:id/archive` | POST | ✅ | `archiveCRV()` |

---

## 4. PHASES API (6 routes)

**Store : `phasesStore.js`** + intégré dans `crvStore.js`

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/phases/:id/demarrer` | POST | ✅ | `demarrerPhase()` |
| `/phases/:id/terminer` | POST | ✅ | `terminerPhase()` |
| `/phases/:id/non-realise` | POST | ✅ | `marquerNonRealise()` |
| `/phases/:id` | PATCH | ✅ | `updatePhase()` |
| `/phases/:id` | GET | ✅ | `loadPhase()` |
| `/phases?crvId=xxx` | GET | ✅ | `loadPhasesByCRV()` |

---

## 5. VOLS API (8 routes)

**Store : `volsStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/vols` | POST | ✅ | `createVol()` |
| `/vols` | GET | ✅ | `listVols()` |
| `/vols/:id` | GET | ✅ | `loadVol()` |
| `/vols/:id` | PATCH | ✅ | `updateVol()` |
| `/vols/:id` | DELETE | ✅ | `deleteVol()` |
| `/vols/:id/lier-programme` | POST | ✅ | `lierProgramme()` |
| `/vols/:id/marquer-hors-programme` | POST | ✅ | `marquerHorsProgramme()` |
| `/vols/:id/detacher-programme` | POST | ✅ | `detacherProgramme()` |

---

## 6. PROGRAMMES VOL API (9 routes)

**Store : `programmesStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/programmes-vol` | POST | ✅ | `createProgramme()` |
| `/programmes-vol` | GET | ✅ | `listProgrammes()` |
| `/programmes-vol/:id` | GET | ✅ | `loadProgramme()` |
| `/programmes-vol/:id` | PATCH | ✅ | `updateProgramme()` |
| `/programmes-vol/:id` | DELETE | ✅ | `deleteProgramme()` |
| `/programmes-vol/:id/valider` | POST | ✅ | `validerProgramme()` |
| `/programmes-vol/:id/activer` | POST | ✅ | `activerProgramme()` |
| `/programmes-vol/:id/suspendre` | POST | ✅ | `suspendreProgramme()` |
| `/programmes-vol/import` | POST | ✅ | `importerProgramme()` |

---

## 7. CHARGES API (12 routes)

**Store : `chargesStore.js`** + intégré dans `crvStore.js`

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/charges/:id` | GET | ✅ | `loadCharge()` |
| `/charges/:id` | PATCH | ✅ | `updateCharge()` |
| `/charges/:id/categories-detaillees` | PUT | ✅ | `updateCategoriesDetaillees()` |
| `/charges/:id/classes` | PUT | ✅ | `updateClasses()` |
| `/charges/:id/besoins-medicaux` | PUT | ✅ | `updateBesoinsMedicaux()` |
| `/charges/:id/mineurs` | PUT | ✅ | `updateMineurs()` |
| `/charges/:id/convertir-categories-detaillees` | POST | ✅ | `convertirCategoriesDetaillees()` |
| `/charges/:id/fret-detaille` | PUT | ✅ | `updateFretDetaille()` |
| `/charges/:id/marchandises-dangereuses` | POST | ✅ | `addMarchandiseDangereuse()` |
| `/charges/:id/marchandises-dangereuses/:mdId` | DELETE | ✅ | `deleteMarchandiseDangereuse()` |
| `/charges/statistiques/passagers` | GET | ✅ | `loadStatistiquesPassagers()` |
| `/charges/statistiques/fret` | GET | ✅ | `loadStatistiquesFret()` |

---

## 8. AVIONS API (12 routes)

**Store : `avionsStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/avions` | GET | ✅ | `listAvions()` |
| `/avions/:id` | GET | ✅ | `loadAvion()` |
| `/avions` | POST | ✅ | `createAvion()` |
| `/avions/:id/configuration` | PUT | ✅ | `updateConfiguration()` |
| `/avions/:id/versions` | POST | ✅ | `createVersion()` |
| `/avions/:id/versions` | GET | ✅ | `loadVersions()` |
| `/avions/:id/versions/:numero` | GET | ✅ | `loadVersion()` |
| `/avions/:id/versions/:numero/restaurer` | POST | ✅ | `restaurerVersion()` |
| `/avions/:id/versions/comparer` | GET | ✅ | `comparerVersions()` |
| `/avions/:id/revision` | PUT | ✅ | `planifierRevision()` |
| `/avions/revisions/prochaines` | GET | ✅ | `loadRevisionsProchaines()` |
| `/avions/statistiques/configurations` | GET | ✅ | `loadStatistiques()` |

---

## 9. NOTIFICATIONS API (8 routes)

**Store : `notificationsStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/notifications` | GET | ✅ | `loadNotifications()` |
| `/notifications/count-non-lues` | GET | ✅ | `loadCountNonLues()` |
| `/notifications/lire-toutes` | PATCH | ✅ | `marquerToutesLues()` |
| `/notifications/statistiques` | GET | ✅ | `loadStatistiques()` |
| `/notifications` | POST | ✅ | `createNotification()` |
| `/notifications/:id/lire` | PATCH | ✅ | `marquerLue()` |
| `/notifications/:id/archiver` | PATCH | ✅ | `archiverNotification()` |
| `/notifications/:id` | DELETE | ✅ | `deleteNotification()` |

---

## 10. SLA API (7 routes)

**Store : `slaStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/sla/rapport` | GET | ✅ | `loadRapport()` |
| `/sla/configuration` | GET | ✅ | `loadConfiguration()` |
| `/sla/configuration` | PUT | ✅ | `updateConfiguration()` |
| `/sla/surveiller/crv` | POST | ✅ | `surveillerCRV()` |
| `/sla/surveiller/phases` | POST | ✅ | `surveillerPhases()` |
| `/sla/crv/:id` | GET | ✅ | `loadCRVSla()` |
| `/sla/phase/:id` | GET | ✅ | `loadPhaseSla()` |

---

## 11. VALIDATION API (3 routes)

**Intégré dans : `crvStore.js`**

| Endpoint | Méthode | Frontend | Store Action |
|----------|---------|----------|--------------|
| `/validation/:id/valider` | POST | ✅ | `validateCRV()` |
| `/validation/:id/deverrouiller` | POST | ✅ | `deverrouillerCRV()` |
| `/validation/:id` | GET | ✅ | `getValidationStatus()` |

---

## Architecture des Stores

```
src/stores/
├── index.js              # Export centralisé
├── authStore.js          # Authentification (5 routes)
├── crvStore.js           # CRV + Phases + Validation (18 routes)
├── phasesStore.js        # Phases dédiées (6 routes)
├── chargesStore.js       # Charges opérationnelles (12 routes)
├── volsStore.js          # Gestion vols (8 routes)
├── programmesStore.js    # Programmes vol (9 routes)
├── avionsStore.js        # Configuration avions (12 routes)
├── notificationsStore.js # Notifications (8 routes)
├── slaStore.js           # Alertes SLA (7 routes)
└── personnesStore.js     # Gestion utilisateurs (8 routes)
```

---

## Service API Centralisé

**Fichier : `src/services/api.js`**

```javascript
// Exports disponibles
export { authAPI }           // 5 routes
export { personnesAPI }      // 8 routes
export { crvAPI }            // 11 routes
export { phasesAPI }         // 6 routes
export { volsAPI }           // 8 routes
export { programmesVolAPI }  // 9 routes
export { chargesAPI }        // 12 routes
export { avionsAPI }         // 12 routes
export { notificationsAPI }  // 8 routes
export { slaAPI }            // 7 routes
export { validationAPI }     // 3 routes
export default api           // Instance Axios configurée
```

---

## Gestion des Rôles

| Rôle | Description | Permissions clés |
|------|-------------|------------------|
| AGENT_ESCALE | Opérateur terrain | Saisie CRV, phases |
| CHEF_EQUIPE | Superviseur local | Validation équipe |
| SUPERVISEUR | Supervision globale | Validation CRV |
| MANAGER | Direction opérationnelle | Tous accès + déverrouillage |
| QUALITE | Contrôle qualité | Lecture seule |
| ADMIN | Administration système | Gestion utilisateurs |

---

## Middleware Backend

Les stores gèrent automatiquement les erreurs backend :

- `QUALITE_READ_ONLY` : Rôle QUALITE en lecture seule
- `ACCOUNT_DISABLED` : Compte désactivé → redirection login
- `CRV_VERROUILLE` : CRV verrouillé → action bloquée
- `COMPLETUDE_INSUFFISANTE` : Validation refusée < 80%
- `ACCOUNT_IN_USE` : Suppression compte impossible

---

## Utilisation dans les composants Vue

```javascript
// Import depuis l'index
import { useCrvStore, useAuthStore, useNotificationsStore } from '@/stores'

// Dans setup()
const crvStore = useCrvStore()
const authStore = useAuthStore()

// Utilisation
await crvStore.loadCRV(id)
await crvStore.demarrerPhase(phaseId)

// Getters réactifs
const isLocked = computed(() => crvStore.isLocked)
const userRole = computed(() => authStore.getUserRole)
```

---

## Notes de maintenance

1. **Source de vérité** : `src/services/api.js` définit tous les endpoints
2. **Stores Pinia** : Chaque domaine métier a son store dédié
3. **Gestion d'erreurs** : Intercepteurs axios + erreurs store
4. **Token JWT** : Géré automatiquement par les intercepteurs
5. **Compatibilité** : `authService.js` maintenu pour code legacy

---

*Document généré automatiquement - CRV Frontend v2.0*
