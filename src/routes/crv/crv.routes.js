import express from 'express';
import { body } from 'express-validator';
import {
  creerCRV,
  obtenirCRV,
  listerCRVs,
  mettreAJourCRV,
  supprimerCRV,
  ajouterCharge,
  ajouterEvenement,
  ajouterObservation,
  rechercherCRV,
  obtenirStatsCRV,
  exporterCRVExcel,
  mettreAJourHoraire,
  demarrerCRV,
  terminerCRV,
  obtenirTransitionsPossibles,
  confirmerAbsence,
  annulerConfirmationAbsence,
  mettreAJourPersonnel,
  ajouterPersonnel,
  supprimerPersonnel
} from '../../controllers/crv/crv.controller.js';
import {
  obtenirEnginsAffectes,
  mettreAJourEnginsAffectes,
  ajouterEnginAuCRV,
  retirerEnginDuCRV
} from '../../controllers/resources/engin.controller.js';
import { mettreAJourPhaseCRV } from '../../controllers/phases/phase.controller.js';
import {
  getArchivageStatus,
  archiverCRV,
  testerArchivage,
  verifierArchivageCRV,
  obtenirInfosArchivage,
  telechargerPDF,
  obtenirPDFBase64,
  obtenirDonneesPDF
} from '../../controllers/crv/crvArchivage.controller.js';
// EXTENSION 6 - Annulation de CRV (NON-RÉGRESSION: import nouveau, aucun impact sur l'existant)
import {
  annulerCRV,
  reactiverCRV,
  obtenirCRVAnnules,
  obtenirStatistiquesAnnulations,
  verifierPeutAnnuler
} from '../../controllers/crv/annulation.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import {
  verifierCRVNonVerrouille,
  verifierPhasesAutoriseesCreationCRV,
  validerCoherenceCharges
} from '../../middlewares/businessRules.middleware.js';

const router = express.Router();

// 🔒 P0-1: QUALITE exclu (lecture seule)
router.post('/', protect, excludeQualite, [
  body('volId').optional(),
  body('type').optional().isIn(['arrivee', 'depart', 'turnaround']).withMessage('Type invalide'),
  validate
], verifierPhasesAutoriseesCreationCRV, auditLog('CREATION'), creerCRV);

router.get('/', protect, listerCRVs);

// ============================
//   ROUTES RECHERCHE & ANALYTICS (AVANT /:id)
// ============================

// Recherche full-text
router.get('/search', protect, rechercherCRV);

// Stats et KPIs
router.get('/stats', protect, obtenirStatsCRV);

// Export Excel/CSV
router.get('/export', protect, exporterCRVExcel);

// ============================
//   EXTENSION 6 - ROUTES ANNULATION (NON-PARAMÉTRISÉES)
// ============================

/**
 * @route   GET /api/crv/annules
 * @desc    Obtenir tous les CRV annulés
 * @access  Private
 * @query   dateDebut, dateFin, raisonAnnulation (optionnels)
 */
router.get('/annules', protect, obtenirCRVAnnules);

/**
 * @route   GET /api/crv/statistiques/annulations
 * @desc    Obtenir les statistiques des annulations
 * @access  Private (tous sauf QUALITE)
 * @query   dateDebut, dateFin (optionnels)
 */
router.get('/statistiques/annulations', protect, excludeQualite, obtenirStatistiquesAnnulations);

// ============================
//   ROUTES PARAMÉTRISÉES
// ============================

router.get('/:id', protect, obtenirCRV);

/**
 * @route   DELETE /api/crv/:id
 * @desc    Supprimer un CRV (et toutes ses données associées)
 * @access  Private (tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @note    Refusé si CRV verrouillé (code: CRV_VERROUILLE)
 */
router.delete('/:id', protect, excludeQualite, auditLog('SUPPRESSION'), supprimerCRV);

// ============================
//   TRANSITIONS DE STATUT CRV
// ============================

/**
 * @route   GET /api/crv/:id/transitions
 * @desc    Obtenir les transitions de statut possibles pour un CRV
 * @access  Private
 */
router.get('/:id/transitions', protect, obtenirTransitionsPossibles);

/**
 * @route   POST /api/crv/:id/demarrer
 * @desc    Démarrer un CRV (BROUILLON → EN_COURS)
 * @access  Private (QUALITE exclu)
 */
router.post('/:id/demarrer', protect, excludeQualite, auditLog('MISE_A_JOUR'), demarrerCRV);

/**
 * @route   POST /api/crv/:id/terminer
 * @desc    Terminer un CRV (EN_COURS → TERMINE)
 * @access  Private (QUALITE exclu)
 * @note    Vérifie complétude minimale 50% et phases obligatoires
 */
router.post('/:id/terminer', protect, excludeQualite, auditLog('MISE_A_JOUR'), terminerCRV);

// ============================
//   CONFIRMATIONS EXPLICITES
// ============================

/**
 * @route   POST /api/crv/:id/confirmer-absence
 * @desc    Confirmer l'absence d'événements/observations/charges
 * @access  Private (QUALITE exclu)
 * @body    { type: 'evenement' | 'observation' | 'charge' }
 * @note    Permet de distinguer "aucun" (confirmé) de "non saisi" (oubli) pour le calcul de complétude
 */
router.post('/:id/confirmer-absence', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('type').isIn(['evenement', 'observation', 'charge']).withMessage('Type invalide'),
  validate
], auditLog('MISE_A_JOUR'), confirmerAbsence);

/**
 * @route   DELETE /api/crv/:id/confirmer-absence
 * @desc    Annuler une confirmation d'absence
 * @access  Private (QUALITE exclu)
 * @body    { type: 'evenement' | 'observation' | 'charge' }
 */
router.delete('/:id/confirmer-absence', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('type').isIn(['evenement', 'observation', 'charge']).withMessage('Type invalide'),
  validate
], auditLog('MISE_A_JOUR'), annulerConfirmationAbsence);

// 🔒 P0-1: QUALITE exclu (PATCH et PUT supportés)
router.patch('/:id', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), mettreAJourCRV);
router.put('/:id', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), mettreAJourCRV);

// 🔒 P0-1: QUALITE exclu
router.post('/:id/charges', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('typeCharge').isIn(['PASSAGERS', 'BAGAGES', 'FRET']).withMessage('Type de charge invalide'),
  body('sensOperation').isIn(['EMBARQUEMENT', 'DEBARQUEMENT']).withMessage('Sens d\'opération invalide'),
  validate
], validerCoherenceCharges, auditLog('MISE_A_JOUR'), ajouterCharge);

// 🔒 P0-1: QUALITE exclu
router.post('/:id/evenements', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('typeEvenement').notEmpty().withMessage('Type d\'événement requis'),
  body('gravite').isIn(['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE']).withMessage('Gravité invalide'),
  body('description').notEmpty().withMessage('Description requise'),
  validate
], auditLog('MISE_A_JOUR'), ajouterEvenement);

// 🔒 P0-1: QUALITE exclu
router.post('/:id/observations', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('categorie').isIn(['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA']).withMessage('Catégorie invalide'),
  body('contenu').notEmpty().withMessage('Contenu requis'),
  validate
], auditLog('MISE_A_JOUR'), ajouterObservation);

// ============================
//   GESTION PERSONNEL AFFECTÉ
// ============================

/**
 * @route   PUT /api/crv/:id/personnel
 * @desc    Mettre à jour (remplacer) tout le personnel affecté au vol
 * @access  Private (QUALITE exclu)
 * @body    { personnelAffecte: [{ nom, prenom, fonction, matricule?, telephone?, remarques? }] }
 */
router.put('/:id/personnel', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('personnelAffecte').isArray().withMessage('personnelAffecte doit être un tableau'),
  body('personnelAffecte.*.nom').notEmpty().withMessage('Nom requis'),
  body('personnelAffecte.*.prenom').notEmpty().withMessage('Prénom requis'),
  body('personnelAffecte.*.fonction').notEmpty().withMessage('Fonction requise'),
  validate
], auditLog('MISE_A_JOUR'), mettreAJourPersonnel);

/**
 * @route   POST /api/crv/:id/personnel
 * @desc    Ajouter une personne au personnel affecté
 * @access  Private (QUALITE exclu)
 * @body    { nom, prenom, fonction, matricule?, telephone?, remarques? }
 */
router.post('/:id/personnel', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('fonction').notEmpty().withMessage('Fonction requise'),
  validate
], auditLog('MISE_A_JOUR'), ajouterPersonnel);

/**
 * @route   DELETE /api/crv/:id/personnel/:personneId
 * @desc    Supprimer une personne du personnel affecté
 * @access  Private (QUALITE exclu)
 */
router.delete('/:id/personnel/:personneId', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), supprimerPersonnel);

// ============================
//   GESTION ENGINS AFFECTÉS
// ============================

/**
 * @route   GET /api/crv/:id/engins
 * @desc    Obtenir les engins affectés à un CRV
 * @access  Private
 */
router.get('/:id/engins', protect, obtenirEnginsAffectes);

/**
 * @route   PUT /api/crv/:id/engins
 * @desc    Mettre à jour (remplacer) tous les engins affectés
 * @access  Private (QUALITE exclu)
 * @body    { engins: [{ type, immatriculation, heureDebut, heureFin, utilise, usage?, remarques? }] }
 */
router.put('/:id/engins', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('engins').isArray().withMessage('engins doit être un tableau'),
  validate
], auditLog('MISE_A_JOUR'), mettreAJourEnginsAffectes);

/**
 * @route   POST /api/crv/:id/engins
 * @desc    Ajouter un engin au CRV
 * @access  Private (QUALITE exclu)
 * @body    { enginId, heureDebut, heureFin?, usage, remarques? }
 */
router.post('/:id/engins', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('enginId').notEmpty().withMessage('ID engin requis'),
  body('usage').isIn(['TRACTAGE', 'BAGAGES', 'FRET', 'ALIMENTATION_ELECTRIQUE', 'CLIMATISATION', 'PASSERELLE', 'CHARGEMENT']).withMessage('Usage invalide'),
  validate
], auditLog('MISE_A_JOUR'), ajouterEnginAuCRV);

/**
 * @route   DELETE /api/crv/:id/engins/:affectationId
 * @desc    Retirer un engin du CRV
 * @access  Private (QUALITE exclu)
 */
router.delete('/:id/engins/:affectationId', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), retirerEnginDuCRV);

// ============================
//   GESTION PHASES CRV
// ============================

/**
 * @route   PUT /api/crv/:crvId/phases/:phaseId
 * @desc    Mettre à jour une phase du CRV (statut, heures, motif)
 * @access  Private (QUALITE exclu)
 * @body    { statut?, heureDebutReelle?, heureFinReelle?, motifNonRealisation?, detailMotif?, remarques? }
 * @note    Heures acceptées aux formats: "HH:mm", "HH:mm:ss", ou ISO string
 */
router.put('/:crvId/phases/:phaseId', protect, excludeQualite, auditLog('MISE_A_JOUR'), mettreAJourPhaseCRV);

// ============================
//   MISE À JOUR HORAIRES
// ============================

/**
 * @route   PUT /api/crv/:id/horaire
 * @desc    Mettre à jour les horaires d'un CRV
 * @access  Private (QUALITE exclu)
 * @body    Champs horaires (voir documentation)
 */
router.put('/:id/horaire', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), mettreAJourHoraire);

// ============================
//   ROUTES ARCHIVAGE GOOGLE DRIVE
// ============================

// Vérifier le statut du service d'archivage
router.get('/archive/status', getArchivageStatus);

// Tester l'archivage avec un PDF de test
// 🔒 P0-1: QUALITE exclu
router.post('/archive/test', protect, excludeQualite, testerArchivage);

// Archiver un CRV spécifique
// 🔒 P0-1: QUALITE exclu
router.post('/:id/archive', protect, excludeQualite, archiverCRV);

// Vérifier si un CRV peut être archivé
router.get('/:id/archive/status', protect, verifierArchivageCRV);

// Obtenir les informations d'archivage d'un CRV
router.get('/:id/archivage', protect, obtenirInfosArchivage);

// ============================
//   ROUTES PDF CRV
// ============================

/**
 * @route   GET /api/crv/:id/export-pdf
 * @desc    Obtenir les données formatées pour export PDF (aperçu JSON)
 * @access  Private
 */
router.get('/:id/export-pdf', protect, obtenirDonneesPDF);

/**
 * @route   GET /api/crv/:id/telecharger-pdf
 * @desc    Télécharger le PDF du CRV
 * @access  Private
 */
router.get('/:id/telecharger-pdf', protect, telechargerPDF);

/**
 * @route   GET /api/crv/:id/pdf-base64
 * @desc    Obtenir le PDF en base64 (preview frontend)
 * @access  Private
 */
router.get('/:id/pdf-base64', protect, obtenirPDFBase64);

// ============================
//   EXTENSION 6 - ROUTES ANNULATION (PARAMÉTRISÉES)
// ============================

/**
 * @route   GET /api/crv/:id/peut-annuler
 * @desc    Vérifier si un CRV peut être annulé
 * @access  Private
 */
router.get('/:id/peut-annuler', protect, verifierPeutAnnuler);

/**
 * @route   POST /api/crv/:id/annuler
 * @desc    Annuler un CRV
 * @access  Private (tous sauf QUALITE)
 * @body    { raisonAnnulation, commentaireAnnulation }
 */
router.post('/:id/annuler', protect, excludeQualite, auditLog('MISE_A_JOUR'), annulerCRV);

/**
 * @route   POST /api/crv/:id/reactiver
 * @desc    Réactiver un CRV annulé
 * @access  Private (tous sauf QUALITE)
 */
router.post('/:id/reactiver', protect, excludeQualite, auditLog('MISE_A_JOUR'), reactiverCRV);

export default router;
