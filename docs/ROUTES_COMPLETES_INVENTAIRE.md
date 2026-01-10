# 📊 INVENTAIRE COMPLET DES ROUTES API

**Total routes backend**: **87 routes**
**Routes documentées dans API_COMPLETE_FRONTEND.md**: **~25 routes**
**Routes omises**: **~62 routes**

---

## ✅ ROUTES DOCUMENTÉES (dans API_COMPLETE_FRONTEND.md)

### Authentification (3/3) ✅
- ✅ POST /api/auth/login
- ✅ POST /api/auth/register
- ✅ GET /api/auth/me

### CRV (7/17) ⚠️ INCOMPLET
- ✅ POST /api/crv
- ✅ GET /api/crv
- ✅ GET /api/crv/:id
- ✅ PATCH /api/crv/:id (mentionné)
- ✅ POST /api/crv/:id/charges
- ✅ POST /api/crv/:id/evenements
- ✅ POST /api/crv/:id/observations

### Phases (2/4) ⚠️ INCOMPLET
- ✅ POST /api/phases/:id/demarrer
- ✅ POST /api/phases/:id/terminer

### Notifications (3/8) ⚠️ INCOMPLET
- ✅ GET /api/notifications
- ✅ GET /api/notifications/count-non-lues
- ✅ PATCH /api/notifications/:id/lire

### Vols (0/10) ❌ NON DOCUMENTÉ

### Programmes Vol (0/10) ❌ NON DOCUMENTÉ

### Charges (0/14) ❌ NON DOCUMENTÉ

### Avions (0/9) ❌ NON DOCUMENTÉ

### Alertes SLA (0/7) ❌ NON DOCUMENTÉ

### Validation (0/3) ❌ NON DOCUMENTÉ

---

## ❌ ROUTES OMISES (à documenter)

### 1. CRV (10 routes omises)

#### ❌ GET /api/crv/search
**Description**: Recherche full-text de CRV
**Auth**: protect
**Controller**: crv.controller.js → rechercherCRV()

#### ❌ GET /api/crv/stats
**Description**: Obtenir les statistiques et KPIs des CRV
**Auth**: protect
**Controller**: crv.controller.js → obtenirStatsCRV()

#### ❌ GET /api/crv/export
**Description**: Exporter les CRV en Excel/CSV
**Auth**: protect
**Controller**: crv.controller.js → exporterCRVExcel()

#### ❌ GET /api/crv/annules
**Description**: Obtenir tous les CRV annulés (Extension 6)
**Auth**: protect
**Query params**: dateDebut, dateFin, raisonAnnulation
**Controller**: annulation.controller.js → obtenirCRVAnnules()

#### ❌ GET /api/crv/statistiques/annulations
**Description**: Statistiques des annulations (Extension 6)
**Auth**: protect + authorize('MANAGER', 'ADMIN')
**Controller**: annulation.controller.js → obtenirStatistiquesAnnulations()

#### ❌ GET /api/crv/archive/status
**Description**: Vérifier le statut du service d'archivage Google Drive
**Auth**: Aucune (public)
**Controller**: crvArchivage.controller.js → getArchivageStatus()

#### ❌ POST /api/crv/archive/test
**Description**: Tester l'archivage avec un PDF de test
**Auth**: protect + excludeQualite
**Controller**: crvArchivage.controller.js → testerArchivage()

#### ❌ GET /api/crv/:id/peut-annuler
**Description**: Vérifier si un CRV peut être annulé (Extension 6)
**Auth**: protect
**Controller**: annulation.controller.js → verifierPeutAnnuler()

#### ❌ POST /api/crv/:id/annuler
**Description**: Annuler un CRV (Extension 6)
**Auth**: protect + authorize('MANAGER', 'ADMIN')
**Body**: { raisonAnnulation, commentaireAnnulation }
**Controller**: annulation.controller.js → annulerCRV()

#### ❌ POST /api/crv/:id/reactiver
**Description**: Réactiver un CRV annulé (Extension 6)
**Auth**: protect + authorize('MANAGER', 'ADMIN')
**Controller**: annulation.controller.js → reactiverCRV()

---

### 2. Phases (2 routes omises)

#### ❌ POST /api/phases/:id/non-realise
**Description**: Marquer une phase comme non réalisée
**Auth**: protect + excludeQualite
**Validations**:
- motifNonRealisation: ['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE']
- detailMotif: requis
**Middlewares**: verifierCoherencePhaseTypeOperation, verifierJustificationNonRealisation, auditLog
**Controller**: phase.controller.js → marquerPhaseNonRealisee()

#### ❌ PATCH /api/phases/:id
**Description**: Mettre à jour une phase
**Auth**: protect + excludeQualite
**Middlewares**: verifierCoherencePhaseTypeOperation, auditLog
**Controller**: phase.controller.js → mettreAJourPhase()

---

### 3. Vols (10 routes omises)

#### ❌ POST /api/vols
**Description**: Créer un nouveau vol
**Auth**: protect + excludeQualite
**Validations**:
- numeroVol: requis
- typeOperation: ARRIVEE|DEPART|TURN_AROUND
- compagnieAerienne: requis
- codeIATA: 2 caractères
- dateVol: ISO8601
**Controller**: vol.controller.js → creerVol()

#### ❌ GET /api/vols
**Description**: Lister tous les vols
**Auth**: protect
**Controller**: vol.controller.js → listerVols()

#### ❌ GET /api/vols/:id
**Description**: Obtenir un vol par ID
**Auth**: protect
**Controller**: vol.controller.js → obtenirVol()

#### ❌ PATCH /api/vols/:id
**Description**: Mettre à jour un vol
**Auth**: protect + excludeQualite
**Controller**: vol.controller.js → mettreAJourVol()

#### ❌ POST /api/vols/:id/lier-programme
**Description**: Lier un vol à un programme saisonnier (Extension 2)
**Auth**: protect + excludeQualite
**Body**: { programmeVolId }
**Controller**: volProgramme.controller.js → lierVolAuProgramme()

#### ❌ POST /api/vols/:id/marquer-hors-programme
**Description**: Marquer un vol comme hors programme (Extension 2)
**Auth**: protect + excludeQualite
**Body**: { typeVolHorsProgramme, raison }
**Controller**: volProgramme.controller.js → marquerVolHorsProgramme()

#### ❌ POST /api/vols/:id/detacher-programme
**Description**: Détacher un vol d'un programme (Extension 2)
**Auth**: protect + excludeQualite
**Controller**: volProgramme.controller.js → detacherVolDuProgramme()

#### ❌ GET /api/vols/:id/suggerer-programmes
**Description**: Suggérer des programmes compatibles pour un vol (Extension 2)
**Auth**: protect
**Controller**: volProgramme.controller.js → suggererProgrammesPourVol()

#### ❌ GET /api/vols/programme/:programmeVolId
**Description**: Obtenir tous les vols d'un programme (Extension 2)
**Auth**: protect
**Controller**: volProgramme.controller.js → obtenirVolsDuProgramme()

#### ❌ GET /api/vols/hors-programme
**Description**: Obtenir tous les vols hors programme (Extension 2)
**Auth**: protect
**Query params**: typeVolHorsProgramme, compagnieAerienne, dateDebut, dateFin
**Controller**: volProgramme.controller.js → obtenirVolsHorsProgramme()

#### ❌ GET /api/vols/statistiques/programmes
**Description**: Statistiques vols programmés vs hors programme (Extension 2)
**Auth**: protect
**Query params**: compagnieAerienne, dateDebut, dateFin
**Controller**: volProgramme.controller.js → obtenirStatistiquesVolsProgrammes()

---

### 4. Programmes Vol (10 routes omises - Extension 1)

#### ❌ POST /api/programmes-vol
**Description**: Créer un nouveau programme vol saisonnier
**Auth**: protect + excludeQualite
**Body**: { nomProgramme, compagnieAerienne, typeOperation, recurrence, detailsVol, remarques }
**Controller**: programmeVol.controller.js → creerProgramme()

#### ❌ GET /api/programmes-vol
**Description**: Récupérer tous les programmes vol
**Auth**: protect
**Query params**: compagnieAerienne, statut, actif, dateDebut, dateFin
**Controller**: programmeVol.controller.js → obtenirProgrammes()

#### ❌ GET /api/programmes-vol/:id
**Description**: Récupérer un programme par ID
**Auth**: protect
**Controller**: programmeVol.controller.js → obtenirProgrammeParId()

#### ❌ PATCH /api/programmes-vol/:id
**Description**: Mettre à jour un programme
**Auth**: protect + excludeQualite
**Controller**: programmeVol.controller.js → mettreAJourProgramme()

#### ❌ DELETE /api/programmes-vol/:id
**Description**: Supprimer un programme (DÉCISION CRITIQUE: MANAGER uniquement)
**Auth**: protect + authorize('MANAGER')
**Controller**: programmeVol.controller.js → supprimerProgramme()

#### ❌ POST /api/programmes-vol/:id/valider
**Description**: Valider un programme (DÉCISION CRITIQUE: SUPERVISEUR, MANAGER)
**Auth**: protect + authorize('SUPERVISEUR', 'MANAGER')
**Controller**: programmeVol.controller.js → validerProgramme()

#### ❌ POST /api/programmes-vol/:id/activer
**Description**: Activer un programme validé (DÉCISION CRITIQUE: SUPERVISEUR, MANAGER)
**Auth**: protect + authorize('SUPERVISEUR', 'MANAGER')
**Controller**: programmeVol.controller.js → activerProgramme()

#### ❌ POST /api/programmes-vol/:id/suspendre
**Description**: Suspendre un programme actif
**Auth**: protect + excludeQualite
**Body**: { raison } (optionnel)
**Controller**: programmeVol.controller.js → suspendreProgramme()

#### ❌ GET /api/programmes-vol/applicables/:date
**Description**: Trouver les programmes applicables pour une date
**Auth**: protect
**Params**: date (ISO YYYY-MM-DD)
**Query params**: compagnieAerienne (optionnel)
**Controller**: programmeVol.controller.js → trouverProgrammesApplicables()

#### ❌ POST /api/programmes-vol/import
**Description**: Importer plusieurs programmes depuis JSON
**Auth**: protect + excludeQualite
**Body**: { programmes: [...] }
**Controller**: programmeVol.controller.js → importerProgrammes()

---

### 5. Charges (14 routes omises - Extensions 4 & 5)

#### ❌ PUT /api/charges/:id/categories-detaillees
**Description**: Mettre à jour les catégories détaillées de passagers (Extension 4)
**Auth**: protect + excludeQualite
**Body**: { bebes, enfants, adolescents, adultes, seniors, pmr*, transit*, vip, equipage, deportes }
**Controller**: passager.controller.js → mettreAJourCategoriesDetaillees()

#### ❌ PUT /api/charges/:id/classes
**Description**: Mettre à jour les classes de passagers
**Auth**: protect + excludeQualite
**Body**: { premiere, affaires, economique }
**Controller**: passager.controller.js → mettreAJourClassePassagers()

#### ❌ PUT /api/charges/:id/besoins-medicaux
**Description**: Mettre à jour les besoins médicaux
**Auth**: protect + excludeQualite
**Body**: { oxygeneBord, brancardier, accompagnementMedical }
**Controller**: passager.controller.js → mettreAJourBesoinsMedicaux()

#### ❌ PUT /api/charges/:id/mineurs
**Description**: Mettre à jour les informations mineurs
**Auth**: protect + excludeQualite
**Body**: { mineurNonAccompagne, bebeNonAccompagne }
**Controller**: passager.controller.js → mettreAJourMineurs()

#### ❌ POST /api/charges/:id/convertir-categories-detaillees
**Description**: Convertir catégories basiques en détaillées
**Auth**: protect + excludeQualite
**Body**: { mapping } (optionnel)
**Controller**: passager.controller.js → convertirVersCategoriesDetaillees()

#### ❌ GET /api/charges/statistiques/passagers
**Description**: Statistiques globales des passagers
**Auth**: protect
**Query params**: dateDebut, dateFin, compagnie (optionnels)
**Controller**: passager.controller.js → obtenirStatistiquesGlobalesPassagers()

#### ❌ GET /api/charges/crv/:crvId/statistiques-passagers
**Description**: Statistiques passagers pour un CRV
**Auth**: protect
**Controller**: passager.controller.js → obtenirStatistiquesPassagersCRV()

#### ❌ PUT /api/charges/:id/fret-detaille
**Description**: Mettre à jour le fret détaillé (Extension 5)
**Auth**: protect + excludeQualite
**Body**: { categoriesFret, marchandisesDangereuses, logistique, douanes, conditionsTransport }
**Controller**: fret.controller.js → mettreAJourFretDetaille()

#### ❌ POST /api/charges/:id/marchandises-dangereuses
**Description**: Ajouter une marchandise dangereuse (DGR)
**Auth**: protect + excludeQualite
**Body**: { codeONU, classeONU, designationOfficielle, quantite, unite, groupeEmballage }
**Controller**: fret.controller.js → ajouterMarchandiseDangereuse()

#### ❌ DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
**Description**: Retirer une marchandise dangereuse
**Auth**: protect + excludeQualite
**Controller**: fret.controller.js → retirerMarchandiseDangereuse()

#### ❌ POST /api/charges/valider-marchandise-dangereuse
**Description**: Valider une marchandise dangereuse
**Auth**: protect
**Body**: Détails de la marchandise à valider
**Controller**: fret.controller.js → validerMarchandiseDangereuse()

#### ❌ GET /api/charges/marchandises-dangereuses
**Description**: Obtenir charges avec marchandises dangereuses
**Auth**: protect
**Query params**: crvId (optionnel)
**Controller**: fret.controller.js → obtenirChargesAvecMarchandisesDangereuses()

#### ❌ GET /api/charges/crv/:crvId/statistiques-fret
**Description**: Statistiques fret pour un CRV
**Auth**: protect
**Controller**: fret.controller.js → obtenirStatistiquesFretCRV()

#### ❌ GET /api/charges/statistiques/fret
**Description**: Statistiques globales de fret
**Auth**: protect
**Query params**: dateDebut, dateFin, compagnie (optionnels)
**Controller**: fret.controller.js → obtenirStatistiquesGlobalesFret()

---

### 6. Avions (9 routes omises - Extension 3)

#### ❌ PUT /api/avions/:id/configuration
**Description**: Mettre à jour la configuration d'un avion
**Auth**: protect + excludeQualite
**Body**: { sieges, equipements, moteurs, caracteristiquesTechniques, remarques }
**Controller**: avionConfiguration.controller.js → mettreAJourConfiguration()

#### ❌ POST /api/avions/:id/versions
**Description**: Créer une nouvelle version de configuration
**Auth**: protect + excludeQualite
**Body**: { numeroVersion, modifications, configuration }
**Controller**: avionConfiguration.controller.js → creerNouvelleVersion()

#### ❌ GET /api/avions/:id/versions
**Description**: Obtenir l'historique des versions
**Auth**: protect
**Controller**: avionConfiguration.controller.js → obtenirHistoriqueVersions()

#### ❌ GET /api/avions/:id/versions/:numeroVersion
**Description**: Obtenir une version spécifique
**Auth**: protect
**Controller**: avionConfiguration.controller.js → obtenirVersionSpecifique()

#### ❌ POST /api/avions/:id/versions/:numeroVersion/restaurer
**Description**: Restaurer une version antérieure
**Auth**: protect + excludeQualite
**Controller**: avionConfiguration.controller.js → restaurerVersion()

#### ❌ GET /api/avions/:id/versions/comparer
**Description**: Comparer deux versions
**Auth**: protect
**Query params**: version1, version2
**Controller**: avionConfiguration.controller.js → comparerVersions()

#### ❌ PUT /api/avions/:id/revision
**Description**: Mettre à jour les informations de révision
**Auth**: protect + excludeQualite
**Body**: { date, type, prochaineDatePrevue }
**Controller**: avionConfiguration.controller.js → mettreAJourRevision()

#### ❌ GET /api/avions/revisions/prochaines
**Description**: Obtenir avions nécessitant révision prochainement
**Auth**: protect
**Query params**: joursAvance (default: 30)
**Controller**: avionConfiguration.controller.js → obtenirAvionsRevisionProchaine()

#### ❌ GET /api/avions/statistiques/configurations
**Description**: Statistiques de configuration des avions
**Auth**: protect
**Query params**: compagnie (optionnel)
**Controller**: avionConfiguration.controller.js → obtenirStatistiquesConfigurations()

---

### 7. Notifications (5 routes omises - Extension 7)

#### ❌ PATCH /api/notifications/lire-toutes
**Description**: Marquer toutes les notifications comme lues
**Auth**: protect
**Controller**: notification.controller.js → marquerToutesCommeLues()

#### ❌ GET /api/notifications/statistiques
**Description**: Obtenir statistiques des notifications
**Auth**: protect
**Controller**: notification.controller.js → obtenirStatistiques()

#### ❌ POST /api/notifications
**Description**: Créer une notification système (DÉCISION CRITIQUE: MANAGER uniquement)
**Auth**: protect + authorize('MANAGER')
**Body**: Données de la notification
**Controller**: notification.controller.js → creerNotification()

#### ❌ PATCH /api/notifications/:id/archiver
**Description**: Archiver une notification
**Auth**: protect
**Controller**: notification.controller.js → archiverNotification()

#### ❌ DELETE /api/notifications/:id
**Description**: Supprimer une notification
**Auth**: protect
**Controller**: notification.controller.js → supprimerNotification()

---

### 8. Alertes SLA (7 routes omises - Extension 8)

#### ❌ GET /api/sla/rapport
**Description**: Obtenir le rapport SLA complet (DÉCISION CRITIQUE: MANAGER)
**Auth**: protect + authorize('MANAGER')
**Controller**: alerteSLA.controller.js → obtenirRapportSLA()

#### ❌ GET /api/sla/configuration
**Description**: Obtenir la configuration SLA actuelle
**Auth**: protect
**Controller**: alerteSLA.controller.js → obtenirConfiguration()

#### ❌ PUT /api/sla/configuration
**Description**: Configurer les SLA personnalisés (DÉCISION CRITIQUE: MANAGER)
**Auth**: protect + authorize('MANAGER')
**Body**: { CRV: {...}, PHASE: {...} }
**Controller**: alerteSLA.controller.js → configurerSLA()

#### ❌ POST /api/sla/surveiller/crv
**Description**: Surveiller tous CRV actifs (DÉCISION CRITIQUE: MANAGER)
**Auth**: protect + authorize('MANAGER')
**Controller**: alerteSLA.controller.js → surveillerCRV()

#### ❌ POST /api/sla/surveiller/phases
**Description**: Surveiller toutes phases actives (DÉCISION CRITIQUE: MANAGER)
**Auth**: protect + authorize('MANAGER')
**Controller**: alerteSLA.controller.js → surveillerPhases()

#### ❌ GET /api/sla/crv/:id
**Description**: Vérifier le SLA d'un CRV spécifique
**Auth**: protect
**Controller**: alerteSLA.controller.js → verifierSLACRV()

#### ❌ GET /api/sla/phase/:id
**Description**: Vérifier le SLA d'une phase spécifique
**Auth**: protect
**Controller**: alerteSLA.controller.js → verifierSLAPhase()

---

### 9. Validation CRV (3 routes omises)

#### ❌ POST /api/validation/:id/valider
**Description**: Valider un CRV (DÉCISION CRITIQUE: SUPERVISEUR, MANAGER)
**Auth**: protect + authorize('SUPERVISEUR', 'MANAGER')
**Middlewares**: auditLog('VALIDATION')
**Controller**: validation.controller.js → validerCRVController()

#### ❌ POST /api/validation/:id/deverrouiller
**Description**: Déverrouiller un CRV (DÉCISION CRITIQUE: MANAGER uniquement)
**Auth**: protect + authorize('MANAGER')
**Middlewares**: auditLog('MISE_A_JOUR')
**Controller**: validation.controller.js → deverrouillerCRVController()

#### ❌ GET /api/validation/:id
**Description**: Obtenir la validation d'un CRV
**Auth**: protect
**Controller**: validation.controller.js → obtenirValidation()

---

## 📊 STATISTIQUES

### Par domaine

| Domaine | Total routes | Documentées | Omises | % Complétude |
|---------|-------------|-------------|---------|--------------|
| Auth | 3 | 3 | 0 | 100% ✅ |
| CRV | 17 | 7 | 10 | 41% ⚠️ |
| Phases | 4 | 2 | 2 | 50% ⚠️ |
| Vols | 10 | 0 | 10 | 0% ❌ |
| Programmes Vol | 10 | 0 | 10 | 0% ❌ |
| Charges | 14 | 0 | 14 | 0% ❌ |
| Avions | 9 | 0 | 9 | 0% ❌ |
| Notifications | 8 | 3 | 5 | 38% ⚠️ |
| Alertes SLA | 7 | 0 | 7 | 0% ❌ |
| Validation | 3 | 0 | 3 | 0% ❌ |
| **TOTAL** | **87** | **15** | **72** | **17%** ❌ |

### Par extension

| Extension | Routes | Documentées | Omises |
|-----------|--------|-------------|--------|
| Extension 1 (Programmes Vol) | 10 | 0 | 10 |
| Extension 2 (Vol programmé/hors programme) | 7 | 0 | 7 |
| Extension 3 (Avions config) | 9 | 0 | 9 |
| Extension 4 (Passagers détaillés) | 7 | 0 | 7 |
| Extension 5 (Fret détaillé DGR) | 7 | 0 | 7 |
| Extension 6 (Annulation CRV) | 5 | 0 | 5 |
| Extension 7 (Notifications) | 8 | 3 | 5 |
| Extension 8 (Alertes SLA) | 7 | 0 | 7 |

---

## ⚡ ACTIONS REQUISES

### Priorité HAUTE
1. ❌ Documenter **TOUTES** les routes Vols (10 routes) - Extension 2 critique
2. ❌ Documenter **TOUTES** les routes Programmes Vol (10 routes) - Extension 1 critique
3. ❌ Documenter **TOUTES** les routes Charges (14 routes) - Extensions 4 & 5 critiques

### Priorité MOYENNE
4. ❌ Documenter routes CRV manquantes (10 routes)
5. ❌ Documenter routes Avions (9 routes) - Extension 3
6. ❌ Documenter routes Alertes SLA (7 routes) - Extension 8

### Priorité BASSE
7. ❌ Compléter routes Notifications (5 routes)
8. ❌ Compléter routes Phases (2 routes)
9. ❌ Documenter routes Validation (3 routes)

---

## 📝 RECOMMANDATION

**Créer un document complémentaire** : `API_COMPLETE_FRONTEND_PARTIE_2.md`

Qui documentera **les 72 routes manquantes** avec le même niveau de détail que la Partie 1 :
- Route endpoint
- Middlewares (code complet)
- Controller (logique complète)
- Modèle(s) (schéma complet)
- Requête frontend (exemple)
- Réponses succès/erreur

**OU** mettre à jour `API_COMPLETE_FRONTEND.md` en ajoutant toutes les sections manquantes.

---

**Document d'inventaire** — Version 1.0.0 — 2026-01-05
**Objectif**: Identifier les routes omises pour documentation complète
