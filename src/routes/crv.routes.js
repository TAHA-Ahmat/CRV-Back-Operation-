import express from 'express';
import { body } from 'express-validator';
import {
  creerCRV,
  obtenirCRV,
  listerCRVs,
  mettreAJourCRV,
  ajouterCharge,
  ajouterEvenement,
  ajouterObservation,
  rechercherCRV,
  obtenirStatsCRV,
  exporterCRVExcel,
  mettreAJourHoraire
} from '../controllers/crv.controller.js';
import {
  getArchivageStatus,
  archiverCRV,
  testerArchivage
} from '../controllers/crvArchivage.controller.js';
// EXTENSION 6 - Annulation de CRV (NON-RÉGRESSION: import nouveau, aucun impact sur l'existant)
import {
  annulerCRV,
  reactiverCRV,
  obtenirCRVAnnules,
  obtenirStatistiquesAnnulations,
  verifierPeutAnnuler
} from '../controllers/annulation.controller.js';
import { protect, authorize, excludeQualite } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import {
  verifierCRVNonVerrouille,
  verifierPhasesAutoriseesCreationCRV,
  validerCoherenceCharges
} from '../middlewares/businessRules.middleware.js';

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
 * @access  Private (MANAGER, ADMIN)
 * @query   dateDebut, dateFin (optionnels)
 */
router.get('/statistiques/annulations', protect, authorize('MANAGER', 'ADMIN'), obtenirStatistiquesAnnulations);

// ============================
//   ROUTES PARAMÉTRISÉES
// ============================

router.get('/:id', protect, obtenirCRV);

// 🔒 P0-1: QUALITE exclu
router.patch('/:id', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('MISE_A_JOUR'), mettreAJourCRV);

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
 * @access  Private (MANAGER, ADMIN)
 * @body    { raisonAnnulation, commentaireAnnulation }
 */
router.post('/:id/annuler', protect, authorize('MANAGER', 'ADMIN'), annulerCRV);

/**
 * @route   POST /api/crv/:id/reactiver
 * @desc    Réactiver un CRV annulé
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/:id/reactiver', protect, authorize('MANAGER', 'ADMIN'), reactiverCRV);

export default router;
