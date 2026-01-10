# MVS-5-Flights - CONTROLLERS

## Date d'audit : 2026-01-10

---

## vol.controller.js

### Emplacement
`src/controllers/flights/vol.controller.js`

---

### creerVol

| Element | Detail |
|---------|--------|
| Route | POST /api/vols |
| Middlewares | protect, excludeQualite, validate |
| Body | { numeroVol, typeOperation, compagnieAerienne, codeIATA, dateVol, ... } |
| Reponse 201 | { success: true, data: vol } |

---

### obtenirVol

| Element | Detail |
|---------|--------|
| Route | GET /api/vols/:id |
| Middlewares | protect |
| Populate | avion |
| Reponse 200 | { success: true, data: vol } |
| Reponse 404 | Vol non trouve |

---

### listerVols

| Element | Detail |
|---------|--------|
| Route | GET /api/vols |
| Middlewares | protect |
| Query | dateDebut, dateFin, compagnie, statut, typeOperation, page, limit |
| Pagination | Oui (default page=1, limit=20) |
| Reponse 200 | { success: true, data: vols, pagination } |

---

### mettreAJourVol

| Element | Detail |
|---------|--------|
| Route | PATCH /api/vols/:id |
| Middlewares | protect, excludeQualite |
| Populate | avion |
| Reponse 200 | { success: true, data: vol } |
| Reponse 404 | Vol non trouve |

---

## volProgramme.controller.js

### Emplacement
`src/controllers/flights/volProgramme.controller.js`

### Description
Controleur NOUVEAU pour la distinction vols programmes / hors programme (Extension 2).

---

### lierVolAuProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/vols/:id/lier-programme |
| Middlewares | protect, excludeQualite |
| Body | { programmeVolId } |
| Reponse 200 | { success: true, message, data: vol } |
| Reponse 400 | Programme non actif ou coherence |
| Reponse 404 | Vol ou programme non trouve |

---

### marquerVolHorsProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/vols/:id/marquer-hors-programme |
| Middlewares | protect, excludeQualite |
| Body | { typeVolHorsProgramme, raison? } |
| Reponse 200 | { success: true, message, data: vol } |
| Reponse 400 | Type invalide |
| Reponse 404 | Vol non trouve |

---

### detacherVolDuProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/vols/:id/detacher-programme |
| Middlewares | protect, excludeQualite |
| Reponse 200 | { success: true, message, data: vol } |
| Reponse 400 | Vol pas lie |
| Reponse 404 | Vol non trouve |

---

### obtenirVolsDuProgramme

| Element | Detail |
|---------|--------|
| Route | GET /api/vols/programme/:programmeVolId |
| Middlewares | protect |
| Reponse 200 | { success: true, count, data: vols } |
| Reponse 404 | Programme non trouve |

---

### obtenirVolsHorsProgramme

| Element | Detail |
|---------|--------|
| Route | GET /api/vols/hors-programme |
| Middlewares | protect |
| Query | typeVolHorsProgramme, compagnieAerienne, dateDebut, dateFin |
| Reponse 200 | { success: true, count, data: vols } |

---

### obtenirStatistiquesVolsProgrammes

| Element | Detail |
|---------|--------|
| Route | GET /api/vols/statistiques/programmes |
| Middlewares | protect |
| Query | compagnieAerienne, dateDebut, dateFin |
| Reponse 200 | { success: true, data: statistiques } |

---

### suggererProgrammesPourVol

| Element | Detail |
|---------|--------|
| Route | GET /api/vols/:id/suggerer-programmes |
| Middlewares | protect |
| Reponse 200 | { success: true, count, data: suggestions } |
| Reponse 404 | Vol non trouve |

---

## programmeVol.controller.js

### Emplacement
`src/controllers/flights/programmeVol.controller.js`

### Description
Controleur NOUVEAU et INDEPENDANT pour les programmes de vols recurrents (Extension 1).

---

### creerProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/programmes-vol |
| Middlewares | protect, excludeQualite |
| Body | { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol, remarques } |
| Validations | nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol.numeroVolBase requis |
| Reponse 201 | { success: true, message, data: programme } |
| Reponse 400 | Champs requis manquants |

---

### obtenirProgrammes

| Element | Detail |
|---------|--------|
| Route | GET /api/programmes-vol |
| Middlewares | protect |
| Query | compagnieAerienne, statut, actif, dateDebut, dateFin |
| Reponse 200 | { success: true, count, data: programmes } |

---

### obtenirProgrammeParId

| Element | Detail |
|---------|--------|
| Route | GET /api/programmes-vol/:id |
| Middlewares | protect |
| Reponse 200 | { success: true, data: programme } |
| Reponse 404 | Programme non trouve |

---

### mettreAJourProgramme

| Element | Detail |
|---------|--------|
| Route | PATCH /api/programmes-vol/:id |
| Middlewares | protect, excludeQualite |
| Reponse 200 | { success: true, message, data: programme } |
| Reponse 400 | Programme valide et actif |
| Reponse 404 | Programme non trouve |

---

### validerProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/programmes-vol/:id/valider |
| Middlewares | protect, authorize(SUPERVISEUR, MANAGER) |
| Reponse 200 | { success: true, message, data: programme } |
| Reponse 400 | Deja valide ou incomplet |
| Reponse 404 | Programme non trouve |

---

### activerProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/programmes-vol/:id/activer |
| Middlewares | protect, authorize(SUPERVISEUR, MANAGER) |
| Reponse 200 | { success: true, message, data: programme } |
| Reponse 400 | Non valide, deja actif, ou periode terminee |
| Reponse 404 | Programme non trouve |

---

### suspendreProgramme

| Element | Detail |
|---------|--------|
| Route | POST /api/programmes-vol/:id/suspendre |
| Middlewares | protect, excludeQualite |
| Body | { raison } (optionnel) |
| Reponse 200 | { success: true, message, data: programme } |
| Reponse 400 | Programme pas actif |
| Reponse 404 | Programme non trouve |

---

### trouverProgrammesApplicables

| Element | Detail |
|---------|--------|
| Route | GET /api/programmes-vol/applicables/:date |
| Middlewares | protect |
| Query | compagnieAerienne (optionnel) |
| Reponse 200 | { success: true, count, data: programmes } |
| Reponse 400 | Date invalide |

---

### importerProgrammes

| Element | Detail |
|---------|--------|
| Route | POST /api/programmes-vol/import |
| Middlewares | protect, excludeQualite |
| Body | { programmes: [...] } |
| Reponse 200 | { success: true, message, data: resultats } |
| Reponse 400 | Tableau vide ou invalide |

---

### supprimerProgramme

| Element | Detail |
|---------|--------|
| Route | DELETE /api/programmes-vol/:id |
| Middlewares | protect, authorize(MANAGER) |
| Reponse 200 | { success: true, message } |
| Reponse 400 | Programme actif |
| Reponse 404 | Programme non trouve |

