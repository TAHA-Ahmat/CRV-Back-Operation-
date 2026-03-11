# CRV_ARCHIVE_FLOW — Audit Archivage Complet

Date : 2026-03-11
Auteur : Claude Code (audit automatisé)

---

## 1. FLUX COMPLET : VALIDATION → ARCHIVAGE

```
Frontend                    Backend                         MongoDB              Google Drive
   │                           │                               │                      │
   │  POST /validation/:id/    │                               │                      │
   │       valider             │                               │                      │
   ├──────────────────────────→│                               │                      │
   │                           │  session.startTransaction()   │                      │
   │                           ├──────────────────────────────→│                      │
   │                           │  1. Find CRV (TERMINE?)       │                      │
   │                           │  2. calculerCompletude()      │                      │
   │                           │  3. Check responsableVol      │                      │
   │                           │  4. Check phases non traitées │                      │
   │                           │  5. verifierConformiteSLA()   │                      │
   │                           │  6. Delete old ValidationCRV  │                      │
   │                           │  7. Create new ValidationCRV  │                      │
   │                           │  8. Update CRV.statut=VALIDE  │                      │
   │                           │  session.commitTransaction()  │                      │
   │                           ├──────────────────────────────→│                      │
   │                           │←─────────────────────────────→│                      │
   │                           │                               │                      │
   │                           │  ═══ POST-COMMIT (non-bloquant) ═══                  │
   │                           │                               │                      │
   │                           │  9. archiverCRV(crvId, userId)│                      │
   │                           │     ┌─ session2.startTx()     │                      │
   │                           │     ├─ Find CRV + populate    │                      │
   │                           │     ├─ canArchiveCRV()        │                      │
   │                           │     ├─ Idempotence check      │                      │
   │                           │     │  (driveFileId existe?)   │                      │
   │                           │     ├─ generateBuffer(PDF)    │                      │
   │                           │     ├──────────────────────────────────────────────→│
   │                           │     │  archiveDocument()      │                      │
   │                           │     │  - ensureFolderPath()   │                      │
   │                           │     │  - files.create()       │                      │
   │                           │     │  - permissions.create() │                      │
   │                           │     │←─────────────────────────────────────────────→│
   │                           │     ├─ crv.archivage = {...}  │                      │
   │                           │     ├─ crv.save({ session2 }) │                      │
   │                           │     └─ session2.commitTx()    │                      │
   │                           │                               │                      │
   │                           │  10. Si Drive échoue :        │                      │
   │                           │      archivage.statut =       │                      │
   │                           │        'EN_ATTENTE'           │                      │
   │                           │      archivage.erreur = msg   │                      │
   │                           │                               │                      │
   │←──────────────────────────│  Réponse : validation OK      │                      │
   │  (même si Drive a échoué) │  (statut HTTP ne dépend PAS   │                      │
   │                           │   du résultat Drive)          │                      │
```

---

## 2. OÙ EST QUOI — TRAÇABILITÉ FICHIERS

| Étape | Fichier | Ligne | Fonction |
|-------|---------|-------|----------|
| Déclenchement validation | `validation.service.js` | 29 | `validerCRV()` |
| Vérifications métier | `validation.service.js` | 70-88 | completude, phases, SLA |
| Transaction DB validation | `validation.service.js` | 43-155 | session MongoDB |
| Appel archivage | `validation.service.js` | 162-176 | `archiverCRV()` post-commit |
| Fallback EN_ATTENTE | `validation.service.js` | 170-174 | update `archivage.statut` |
| Génération PDF | `crvArchivage.service.js` | 87 | `generator.generateBuffer()` |
| Upload Drive | `crvArchivage.service.js` | 107-110 | `archiveDocument()` |
| Idempotence | `crvArchivage.service.js` | 69-83 | check `driveFileId` |
| Persistance archivage | `crvArchivage.service.js` | 113-124 | `crv.save({ session })` |
| Immutabilité middleware | `businessRules.middleware.js` | 32-38 | check `archivedAt` |
| Immutabilité unlock | `validation.service.js` | 379 | `isCRVImmutable()` |
| Retry Drive (par appel) | `DocumentArchiver.js` | 70-84 | `withRetry()` 3 tentatives |
| Archivage manuel | `crvArchivage.controller.js` | 36 | `POST /crv/:id/archive` |

---

## 3. RESPONSABILITÉS FRONT / BACK

### Backend (fait tout)

| Action | Déclenché par | Endpoint |
|--------|--------------|----------|
| Validation CRV | Backend auto | `POST /validation/:id/valider` |
| Génération PDF | Backend auto | dans `archiverCRV()` |
| Upload Google Drive | Backend auto | dans `archiveDocument()` |
| Mise à jour archivage DB | Backend auto | `crv.save()` |
| Archivage manuel | User via API | `POST /crv/:id/archive` |

### Frontend (consultation uniquement)

| Action | Ce que fait le front | Endpoint |
|--------|---------------------|----------|
| Valider CRV | Envoie la requête | `POST /validation/:id/valider` |
| Voir PDF | Récupère base64 | `GET /crv/:id/pdf-base64` |
| Télécharger PDF | Récupère blob | `GET /crv/:id/telecharger-pdf` |
| Voir statut archive | Lecture seule | `GET /crv/:id/archivage` |

Le frontend **NE déclenche PAS** l'archivage Drive.
Le frontend **NE génère PAS** de PDF.
Le frontend **NE fait PAS** d'upload Drive.

---

## 4. IMMUTABILITÉ — ANALYSE

### Où est vérifiée `archivage.archivedAt` ?

| Point de contrôle | Fichier | Mécanisme |
|-------------------|---------|-----------|
| Middleware modification CRV | `businessRules.middleware.js:32` | `crv.archivage?.archivedAt` → 403 `CRV_IMMUTABLE_ARCHIVE` |
| Déverrouillage | `validation.service.js:379` | `isCRVImmutable(crv)` → 403 |
| Statuts non modifiables | `businessRules.middleware.js:12` | `VALIDE, VERROUILLE, ANNULE` → 403 |

### Ce qui est bloqué quand `archivedAt` est défini :

- Update de toute donnée CRV (phases, charges, événements, observations)
- Déverrouillage (`VERROUILLE → VALIDE`)
- Tout PATCH sur le CRV

### Ce qui n'est PAS bloqué (par design) :

- Lecture / consultation
- Téléchargement PDF
- Re-archivage forcé (`POST /crv/:id/archive` avec `force: true`)

---

## 5. PROTECTION DOUBLE ARCHIVAGE

### Mécanisme d'idempotence

```
crvArchivage.service.js:69-83

if (crv.archivage?.driveFileId && !options.force) {
  // Retourne l'existant SANS re-upload
  return { success: true, idempotent: true, archivage: {...} }
}
```

**Verdict : PROTÉGÉ.** Un appel multiple à `archiverCRV()` ne créera pas de doublons sur Drive sauf si `force: true` est explicitement passé.

### Scénario de double appel

1. Validation réussie → `archiverCRV()` appelé automatiquement → PDF uploadé → `driveFileId` sauvé
2. User appelle `POST /crv/:id/archive` manuellement → idempotence détecte `driveFileId` → retourne l'existant
3. User appelle `POST /crv/:id/archive` avec `force: true` → nouveau PDF uploadé → version incrémentée

---

## 6. RISQUES IDENTIFIÉS

### RISQUE CRITIQUE : Pas de retry automatique pour archivages échoués

**Constat :** Quand Google Drive échoue lors de la validation, le CRV passe en `archivage.statut = 'EN_ATTENTE'` avec le message d'erreur. **Mais il n'existe aucun** :

- Cron job
- Worker en arrière-plan
- Queue de messages
- Scheduler

pour relancer automatiquement ces archivages.

**Impact :** Un CRV validé peut rester indéfiniment sans archivage Drive si :
- Google Drive était temporairement indisponible
- Les credentials avaient expiré
- Un quota était atteint

**Mitigation actuelle :** L'endpoint `POST /crv/:id/archive` permet un archivage manuel, mais il faut que quelqu'un le sache et le fasse.

**Recommandation :** Implémenter un cron léger qui :
```
1. Cherche les CRV avec archivage.statut = 'EN_ATTENTE'
2. Pour chacun, appelle archiverCRV(crvId, userId, { force: true })
3. Log le résultat
4. Fréquence : toutes les 15 minutes
```

### RISQUE MODÉRÉ : Fichier orphelin sur Drive si DB échoue après upload

**Constat :** `crvArchivage.service.js:43-46` documente ce cas :
> Si le save DB échoue après Drive upload → fichier orphelin sur Drive
> (acceptable, nettoyable manuellement, pas de corruption DB)

**Impact :** Un fichier PDF existe sur Drive mais le CRV en base n'a pas le `driveFileId`. L'idempotence ne le détectera pas → le prochain archivage créera un 2e fichier.

**Recommandation :** Acceptable en l'état. Un script de nettoyage Drive ponctuel suffit.

### RISQUE FAIBLE : Retry par appel Drive (3 tentatives)

**Constat :** `DocumentArchiver.js:70-84` implémente un `withRetry()` avec backoff exponentiel (3 tentatives, 1s → 2s → 4s). C'est un retry **synchrone par appel**, pas un retry **différé**.

**Impact :** Les erreurs transitoires Drive (timeout, rate limit) sont gérées. Les erreurs persistantes (credentials, permissions) ne le sont pas.

**Verdict :** Suffisant pour les pannes courtes, insuffisant pour les pannes longues.

---

## 7. MATRICE DE VÉRITÉ

| Question | Réponse | Preuve |
|----------|---------|--------|
| L'archivage est-il déclenché par le backend ? | OUI | `validation.service.js:164` |
| L'archivage dépend-il du frontend ? | NON | Le front ne fait que consulter |
| Le frontend peut-il déclencher un archivage ? | NON (pas câblé) | Aucun appel à `POST /crv/:id/archive` dans le front |
| L'archivage bloque-t-il la validation ? | NON | Post-commit, non-bloquant |
| L'idempotence protège du double archivage ? | OUI | `driveFileId` check |
| L'immutabilité bloque les modifications ? | OUI | `archivedAt` check en middleware + service |
| L'immutabilité bloque le déverrouillage ? | OUI | `isCRVImmutable()` |
| Un retry automatique existe ? | NON | Aucun cron/worker/queue |
| Un retry par appel existe ? | OUI | `withRetry()` 3 tentatives |
| L'archivage manuel est possible ? | OUI | `POST /crv/:id/archive` |

---

## 8. RECOMMANDATIONS PRIORITAIRES

### P0 — Retry automatique (MANQUANT)
Créer un service cron simple qui relance les archivages `EN_ATTENTE` toutes les 15 minutes. Sans cela, des CRV validés peuvent rester non archivés indéfiniment.

### P1 — Monitoring archivage
Ajouter un endpoint `GET /api/crv/archive/pending` qui liste les CRV avec `archivage.statut = 'EN_ATTENTE'` pour le tableau de bord OPS.

### P2 — Alertes
Émettre une notification `CRV_ARCHIVAGE_EN_ATTENTE` quand un archivage échoue, visible par les SUPERVISEUR/MANAGER dans le centre de notifications.

---

## 9. CONCLUSION

L'architecture d'archivage est **solide** :
- Séparation claire front/back
- Transaction MongoDB atomique pour la validation
- Archivage non-bloquant post-commit
- Idempotence protège du double archivage
- Immutabilité protège les CRV archivés
- Retry synchrone (3 tentatives) pour erreurs Drive transitoires

**Point faible unique et critique : l'absence de retry différé.** Un CRV dont l'archivage échoue reste en `EN_ATTENTE` sans mécanisme automatique de relance. C'est le seul trou dans le système.
