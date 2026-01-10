# MVS-5-Flights - SERVICES

## Date d'audit : 2026-01-10

---

## vol.service.js

### Emplacement
`src/services/flights/vol.service.js`

### Description
Service NOUVEAU pour gerer les operations liees aux vols programmes et hors programme (Extension 2).

---

### lierVolAuProgramme(volId, programmeVolId, userId)

| Element | Detail |
|---------|--------|
| Role | Lie un vol a un programme vol saisonnier |
| Parametres | volId (String), programmeVolId (String), userId (String) |
| Retour | Vol mis a jour |
| Validations | Vol existe, programme existe et actif, coherence compagnie, coherence type operation |
| Side effects | horsProgramme=false, programmeVolReference=id, reset raisonHorsProgramme |
| Audit | UserActivityLog.create (UPDATE) |

---

### marquerVolHorsProgramme(volId, typeVolHorsProgramme, raison, userId)

| Element | Detail |
|---------|--------|
| Role | Marque un vol comme hors programme |
| Parametres | volId, typeVolHorsProgramme (enum), raison (String), userId |
| Retour | Vol mis a jour |
| Types valides | CHARTER, MEDICAL, TECHNIQUE, COMMERCIAL, AUTRE |
| Side effects | horsProgramme=true, programmeVolReference=null |
| Audit | UserActivityLog.create (UPDATE) |

---

### detacherVolDuProgramme(volId, userId)

| Element | Detail |
|---------|--------|
| Role | Detache un vol d'un programme saisonnier |
| Parametres | volId, userId |
| Retour | Vol mis a jour |
| Validation | Vol lie a un programme |
| Side effects | programmeVolReference=null, horsProgramme=false |
| Audit | UserActivityLog.create (UPDATE) |

---

### obtenirVolsDuProgramme(programmeVolId)

| Element | Detail |
|---------|--------|
| Role | Recupere tous les vols lies a un programme |
| Parametre | programmeVolId |
| Retour | Array de vols |
| Populate | avion |
| Tri | dateVol ASC |

---

### obtenirVolsHorsProgramme(filtres)

| Element | Detail |
|---------|--------|
| Role | Recupere tous les vols hors programme avec filtres |
| Filtres | typeVolHorsProgramme, compagnieAerienne, dateDebut, dateFin |
| Retour | Array de vols |
| Tri | dateVol DESC |

---

### obtenirStatistiquesVolsProgrammes(filtres)

| Element | Detail |
|---------|--------|
| Role | Statistiques vols programmes vs hors programme |
| Filtres | compagnieAerienne, dateDebut, dateFin |
| Retour | Object statistiques |

**Structure retour** :
```javascript
{
  total: Number,
  volsProgrammes: { count, pourcentage },
  volsHorsProgramme: { count, pourcentage, parType: {} },
  volsNonClassifies: { count, pourcentage }
}
```

---

### suggererProgrammesPourVol(volId)

| Element | Detail |
|---------|--------|
| Role | Suggere des programmes compatibles pour un vol |
| Parametre | volId |
| Retour | Array de programmes compatibles |
| Criteres | compagnie, typeOperation, periode, jour semaine |
| Filtre | Vol non deja lie a un programme |

---

## programmeVol.service.js

### Emplacement
`src/services/flights/programmeVol.service.js`

### Description
Service NOUVEAU et INDEPENDANT pour gerer les programmes de vols recurrents (Extension 1).

---

### creerProgrammeVol(programmeData, userId)

| Element | Detail |
|---------|--------|
| Role | Cree un nouveau programme vol saisonnier |
| Parametres | programmeData (Object), userId |
| Retour | Programme cree |
| Validations | dateFin > dateDebut, joursSemaine si HEBDOMADAIRE |
| Etat initial | statut=BROUILLON, actif=false, validation.valide=false |
| Audit | UserActivityLog.create (CREATE) |

---

### obtenirProgrammesVol(filtres)

| Element | Detail |
|---------|--------|
| Role | Recupere programmes avec filtres optionnels |
| Filtres | compagnieAerienne, statut, actif, dateDebut, dateFin |
| Retour | Array de programmes |
| Populate | createdBy, updatedBy, validation.validePar |
| Tri | createdAt DESC |

---

### obtenirProgrammeVolParId(programmeId)

| Element | Detail |
|---------|--------|
| Role | Recupere programme par ID |
| Retour | Programme trouve |
| Populate | createdBy, updatedBy, validation.validePar |

---

### mettreAJourProgrammeVol(programmeId, updateData, userId)

| Element | Detail |
|---------|--------|
| Role | Met a jour un programme |
| Validation | Impossible si valide ET actif |
| Champs proteges | createdBy, validation |
| Side effects | updatedBy = userId |
| Audit | UserActivityLog.create (UPDATE) |

---

### validerProgrammeVol(programmeId, userId)

| Element | Detail |
|---------|--------|
| Role | Valide un programme |
| Prerequis | Programme non deja valide |
| Validations metier | nomProgramme, compagnieAerienne, periode, numeroVolBase |
| Side effects | validation.valide=true, statut=VALIDE |
| Audit | UserActivityLog.create (VALIDATE) |

---

### activerProgrammeVol(programmeId, userId)

| Element | Detail |
|---------|--------|
| Role | Active un programme valide |
| Prerequis | Programme valide, non deja actif, periode non terminee |
| Side effects | actif=true, statut=ACTIF |
| Audit | UserActivityLog.create (ACTIVATE) |

---

### suspendreProgrammeVol(programmeId, userId, raison)

| Element | Detail |
|---------|--------|
| Role | Suspend un programme actif |
| Prerequis | Programme actif |
| Side effects | actif=false, statut=SUSPENDU, remarques MAJ |
| Audit | UserActivityLog.create (SUSPEND) |

---

### trouverProgrammesApplicables(date, compagnieAerienne)

| Element | Detail |
|---------|--------|
| Role | Trouve programmes actifs pour date et compagnie |
| Filtrage | Periode valide + jour semaine |
| Retour | Array programmes applicables |

---

### importerProgrammesVol(programmesData, userId)

| Element | Detail |
|---------|--------|
| Role | Import batch de programmes |
| Retour | { succes: [], erreurs: [] } |
| Audit | UserActivityLog.create (IMPORT) |

---

### supprimerProgrammeVol(programmeId, userId)

| Element | Detail |
|---------|--------|
| Role | Supprime un programme |
| Prerequis | Programme non actif |
| Type | Suppression definitive |
| Audit | UserActivityLog.create (DELETE) |

