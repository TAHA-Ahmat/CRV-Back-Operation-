import express from 'express';
import { body } from 'express-validator';
import {
  creerCRV,
  obtenirCRV,
  listerCRVs,
  mettreAJourCRV,
  supprimerCRV,
  rechercherCRV,
  obtenirStatsCRV,
  exporterCRVExcel,
  demarrerCRV,
  terminerCRV,
  obtenirTransitionsPossibles,
  confirmerAbsence,
  annulerConfirmationAbsence,
  obtenirVolsSansCRV
} from '../../controllers/crv/crv.controller.js';
import {
  ajouterCharge,
  mettreAJourHoraire,
} from '../../controllers/crv/crvChargesController.js';
import { ajouterEvenement } from '../../controllers/crv/crvEvenementsController.js';
import { ajouterObservation } from '../../controllers/crv/crvObservationsController.js';
import { listerEvenementsCRV, statsEvenementsCRV } from '../../controllers/crv/crvEvent.controller.js';
import {
  mettreAJourPersonnel,
  ajouterPersonnel,
  supprimerPersonnel,
} from '../../controllers/crv/crvPersonnelController.js';
import { obtenirEnginsAffectes } from '../../controllers/resources/engin.controller.js';
import {
  mettreAJourEnginsAffectes,
  ajouterEnginAuCRV,
  retirerEnginDuCRV,
} from '../../controllers/crv/crvEnginsController.js';
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
import { protect, authorize, excludeQualite, excludeAdmin } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import {
  verifierCRVNonVerrouille,
  verifierPhasesAutoriseesCreationCRV,
  validerCoherenceCharges
} from '../../middlewares/businessRules.middleware.js';
import { verifierCRVNonVerrouilleViaPhase } from '../../middlewares/verrouillage.middleware.js';

const router = express.Router();

// ============================================================
// MISSION 022 — AUTORISATIONS HIÉRARCHIQUES
// Rôles opérationnels : AGENT_ESCALE, CHEF_EQUIPE
// Rôles supervision : SUPERVISEUR, MANAGER
// Rôle qualité : QUALITE (lecture seule)
// Rôle admin : ADMIN (pas d'accès opérationnel CRV)
// ============================================================
const ROLES_OPERATIONNELS = ['AGENT_ESCALE', 'CHEF_EQUIPE'];
const ROLES_SUPERVISION = ['SUPERVISEUR', 'MANAGER'];
const ROLES_TOUS_SAUF_QUALITE = [...ROLES_OPERATIONNELS, ...ROLES_SUPERVISION];

// 🔒 Création CRV — Rôles opérationnels uniquement
router.post('/', protect, authorize(...ROLES_TOUS_SAUF_QUALITE), [
  // PATH 1: Bulletin
  body('bulletinId').optional().isMongoId().withMessage('bulletinId invalide'),
  body('mouvementId').optional().isMongoId().withMessage('mouvementId invalide'),
  // PATH 2: Hors programme
  body('vol').optional().isObject().withMessage('vol doit être un objet'),
  body('vol.numeroVol').optional().notEmpty().withMessage('vol.numeroVol requis'),
  body('vol.compagnieAerienne').optional().notEmpty().withMessage('vol.compagnieAerienne requis'),
  body('vol.codeIATA').optional().notEmpty().withMessage('vol.codeIATA requis'),
  body('vol.dateVol').optional().isISO8601().withMessage('vol.dateVol doit être une date valide'),
  body('vol.typeOperation').optional().isIn(['ARRIVEE', 'DEPART', 'TURN_AROUND']).withMessage('vol.typeOperation invalide'),
  body('vol.typeVolHorsProgramme').optional().isIn(['CHARTER', 'MEDICAL', 'TECHNIQUE', 'COMMERCIAL', 'CARGO', 'AUTRE']).withMessage('vol.typeVolHorsProgramme invalide'),
  // PATH 3: Legacy
  body('volId').optional().isMongoId().withMessage('volId invalide'),
  body('type').optional().isIn(['arrivee', 'depart', 'turnaround']).withMessage('Type invalide'),
  // Commun
  body('escale').optional().isLength({ min: 3, max: 4 }).withMessage('escale doit faire 3-4 caractères'),
  body('forceDoublon').optional().isBoolean().withMessage('forceDoublon doit être un booléen'),
  body('confirmationLevel').optional().isInt({ min: 2, max: 2 }).withMessage('confirmationLevel doit être égal à 2 pour forcer un doublon'),
  validate
], verifierPhasesAutoriseesCreationCRV, auditLog('CREATION'), creerCRV);

// FIX BUG #16: excludeAdmin — Doctrine MADMIT: ADMIN = pas d'acces operationnel CRV
router.get('/', protect, excludeAdmin, listerCRVs);

// ============================
//   ROUTES RECHERCHE & ANALYTICS (AVANT /:id)
// ============================

// Recherche full-text
router.get('/search', protect, excludeAdmin, rechercherCRV);

// Stats et KPIs
router.get('/stats', protect, excludeAdmin, obtenirStatsCRV);

// Export Excel/CSV
router.get('/export', protect, excludeAdmin, exporterCRVExcel);

// EXTENSION 8 - Vols du jour sans CRV (avant /:id)
router.get('/vols-sans-crv', protect, excludeAdmin, obtenirVolsSansCRV);

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
//   ROUTES ARCHIVAGE STATIQUES (AVANT /:id pour éviter le shadowing)
// ============================

// Vérifier le statut du service d'archivage
router.get('/archive/status', protect, getArchivageStatus);

// Tester l'archivage avec un PDF de test
router.post('/archive/test', protect, excludeQualite, testerArchivage);

// ============================
//   ROUTES PARAMÉTRISÉES
// ============================

router.get('/:id', protect, excludeAdmin, obtenirCRV);

/**
 * @route   DELETE /api/crv/:id
 * @desc    Supprimer un CRV (et toutes ses données associées)
 * @access  Private (tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @note    Refusé si CRV verrouillé (code: CRV_VERROUILLE)
 */
// 🔒 Mission 009: Verrouillage — empêcher suppression CRV verrouillé
router.delete('/:id', protect, excludeQualite, verifierCRVNonVerrouille, auditLog('SUPPRESSION'), supprimerCRV);

// ============================
//   TRANSITIONS DE STATUT CRV
// ============================

/**
 * @route   GET /api/crv/:id/transitions
 * @desc    Obtenir les transitions de statut possibles pour un CRV
 * @access  Private
 */
router.get('/:id/transitions', protect, obtenirTransitionsPossibles);

// ============================
//   JOURNAL CRVEvent (P2_ENDPOINT_001)
// ============================

/**
 * @route   GET /api/crv/:id/events
 * @desc    Récupérer le journal d'événements d'un CRV
 * @access  Private (ADMIN exclu)
 * @query   type (filtrer par type), limit (défaut 100), skip (pagination)
 */
router.get('/:id/events', protect, excludeAdmin, listerEvenementsCRV);

/**
 * @route   GET /api/crv/:id/events/stats
 * @desc    Statistiques des événements d'un CRV par type
 * @access  Private (ADMIN exclu)
 */
router.get('/:id/events/stats', protect, excludeAdmin, statsEvenementsCRV);

/**
 * @route   POST /api/crv/:id/demarrer
 * @desc    Démarrer un CRV (BROUILLON → EN_COURS)
 * @access  Private (Rôles opérationnels + supervision)
 */
router.post('/:id/demarrer', protect, authorize(...ROLES_TOUS_SAUF_QUALITE), auditLog('MISE_A_JOUR'), demarrerCRV);

/**
 * @route   POST /api/crv/:id/terminer
 * @desc    Terminer un CRV (EN_COURS → TERMINE)
 * @access  Private (Rôles opérationnels + supervision)
 * @note    Vérifie complétude minimale 50% et phases obligatoires
 */
router.post('/:id/terminer', protect, authorize(...ROLES_TOUS_SAUF_QUALITE), auditLog('MISE_A_JOUR'), terminerCRV);

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

// 🔒 P0-1: QUALITE exclu | FIX BUG #13: .trim().escape() anti-XSS
router.post('/:id/evenements', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('typeEvenement').notEmpty().trim().withMessage('Type d\'événement requis'),
  body('gravite').isIn(['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE']).withMessage('Gravité invalide'),
  body('description').notEmpty().trim().escape().withMessage('Description requise'),
  body('actionsCorrectives').optional().trim().escape(),
  body('responsableSuivi').optional().trim().escape(),
  validate
], auditLog('MISE_A_JOUR'), ajouterEvenement);

// 🔒 P0-1: QUALITE exclu | FIX BUG #13: .trim().escape() anti-XSS
router.post('/:id/observations', protect, excludeQualite, verifierCRVNonVerrouille, [
  body('categorie').isIn(['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA']).withMessage('Catégorie invalide'),
  body('contenu').notEmpty().trim().escape().withMessage('Contenu requis'),
  validate
], auditLog('MISE_A_JOUR'), ajouterObservation);

// ============================
//   GESTION PERSONNEL AFFECTÉ
// ============================

/**
 * @route   PUT /api/crv/:id/personnel
 * @desc    Mettre à jour (remplacer) tout le personnel affecté au vol
 * @access  Private (QUALITE exclu)
 * @body    { personnelAffecte: [{ nom, prenom, fonction|role, matricule?, telephone?, remarques? }] }
 */
// FIX BUG #5: Middleware mapping role → fonction pour compatibilite frontend
const mapRoleToFonction = (req, res, next) => {
  if (req.body.personnelAffecte && Array.isArray(req.body.personnelAffecte)) {
    req.body.personnelAffecte = req.body.personnelAffecte.map(p => {
      if (p.role && !p.fonction) { p.fonction = p.role; }
      return p;
    });
  }
  if (req.body.role && !req.body.fonction) { req.body.fonction = req.body.role; }
  next();
};
router.put('/:id/personnel', protect, excludeQualite, verifierCRVNonVerrouille, mapRoleToFonction, [
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
 * @body    { nom, prenom, fonction|role, matricule?, telephone?, remarques? }
 */
router.post('/:id/personnel', protect, excludeQualite, verifierCRVNonVerrouille, mapRoleToFonction, [
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
// 🔒 Mission 009: Verrouillage — empêcher modification phase sur CRV verrouillé
// 🔒 Mission 022: Autorisations hiérarchiques — rôles opérationnels + supervision
router.put('/:crvId/phases/:phaseId', protect, authorize(...ROLES_TOUS_SAUF_QUALITE), verifierCRVNonVerrouilleViaPhase, auditLog('MISE_A_JOUR'), mettreAJourPhaseCRV);

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
//   ROUTES ARCHIVAGE GOOGLE DRIVE (PARAMÉTRISÉES)
// ============================

// Archiver un CRV spécifique
// 🔒 Mission 022: Autorisations hiérarchiques
router.post('/:id/archive', protect, authorize(...ROLES_TOUS_SAUF_QUALITE), archiverCRV);

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
 * @access  Private (SUPERVISEUR, MANAGER uniquement)
 * @body    { raisonAnnulation, commentaireAnnulation }
 */
router.post('/:id/annuler', protect, authorize(...ROLES_SUPERVISION), auditLog('MISE_A_JOUR'), annulerCRV);

/**
 * @route   POST /api/crv/:id/reactiver
 * @desc    Réactiver un CRV annulé
 * @access  Private (tous sauf QUALITE)
 */
router.post('/:id/reactiver', protect, excludeQualite, auditLog('MISE_A_JOUR'), reactiverCRV);

export default router;
