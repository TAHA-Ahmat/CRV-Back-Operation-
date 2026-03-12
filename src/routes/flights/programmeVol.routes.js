import express from 'express';
import * as programmeVolController from '../../controllers/flights/programmeVol.controller.js';
import * as volProgrammeController from '../../controllers/flights/volProgramme.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';

/**
 * ROUTES PROGRAMME VOL - NOUVEAU SYSTÈME
 *
 * Architecture à deux modèles:
 * - ProgrammeVol: Le conteneur (ex: HIVER_2025_2026)
 * - VolProgramme: Les vols individuels dans le programme
 *
 * WORKFLOW:
 * 1. Créer un programme (nom, dateDebut, dateFin)
 * 2. Ajouter des vols un par un
 * 3. Valider le programme
 * 4. Activer le programme
 */

const router = express.Router();

/**
 * Rôles opérationnels autorisés
 */
const ROLES_OPERATIONNELS = ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER'];

// ══════════════════════════════════════════════════════════════════════════
// ROUTES PROGRAMME (CONTENEUR)
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/programmes-vol
 * @desc    Créer un nouveau programme
 * @access  Private (Opérationnels)
 * @body    { nom, dateDebut, dateFin, edition?, description? }
 */
router.post('/', protect, excludeQualite, programmeVolController.creerProgramme);

/**
 * @route   GET /api/programmes-vol
 * @desc    Lister tous les programmes
 * @access  Private (Tous)
 * @query   statut, actif, nom
 */
router.get('/', protect, programmeVolController.obtenirProgrammes);

/**
 * @route   GET /api/programmes-vol/actif
 * @desc    Obtenir le programme actif actuel
 * @access  Private (Tous)
 */
router.get('/actif', protect, programmeVolController.obtenirProgrammeActif);

/**
 * @route   GET /api/programmes-vol/:id
 * @desc    Obtenir un programme par ID
 * @access  Private (Tous)
 */
router.get('/:id', protect, programmeVolController.obtenirProgrammeParId);

/**
 * @route   PATCH /api/programmes-vol/:id
 * @desc    Modifier un programme
 * @access  Private (Opérationnels)
 */
router.patch('/:id', protect, excludeQualite, programmeVolController.mettreAJourProgramme);

/**
 * @route   DELETE /api/programmes-vol/:id
 * @desc    Supprimer un programme et tous ses vols
 * @access  Private (Opérationnels)
 */
router.delete('/:id', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.supprimerProgramme);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES WORKFLOW PROGRAMME
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/programmes-vol/:id/valider
 * @desc    Valider un programme (BROUILLON → VALIDE)
 * @access  Private (Opérationnels)
 */
router.post('/:id/valider', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.validerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/activer
 * @desc    Activer un programme validé (VALIDE → ACTIF)
 * @access  Private (Opérationnels)
 */
router.post('/:id/activer', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.activerProgramme);

/**
 * @route   POST /api/programmes-vol/:id/suspendre
 * @desc    Suspendre un programme actif (ACTIF → SUSPENDU)
 * @access  Private (Opérationnels)
 * @body    { raison? }
 */
router.post('/:id/suspendre', protect, authorize(...ROLES_OPERATIONNELS), programmeVolController.suspendreProgramme);

/**
 * @route   POST /api/programmes-vol/:id/dupliquer
 * @desc    Dupliquer un programme avec tous ses vols
 * @access  Private (Opérationnels)
 * @body    { nom, dateDebut, dateFin, edition? }
 */
router.post('/:id/dupliquer', protect, excludeQualite, programmeVolController.dupliquerProgramme);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES STATISTIQUES ET RÉSUMÉ PROGRAMME
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/programmes-vol/:id/statistiques
 * @desc    Obtenir les statistiques d'un programme
 * @access  Private (Tous)
 */
router.get('/:id/statistiques', protect, programmeVolController.obtenirStatistiques);

/**
 * @route   GET /api/programmes-vol/:id/resume
 * @desc    Obtenir le résumé complet d'un programme (avec vols)
 * @access  Private (Tous)
 */
router.get('/:id/resume', protect, programmeVolController.obtenirResume);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES VOLS DANS LE PROGRAMME
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/programmes-vol/:programmeId/vols
 * @desc    Ajouter un vol au programme
 * @access  Private (Opérationnels)
 * @body    {
 *   numeroVol: "ET939",
 *   joursSemaine: [1, 3, 5],
 *   typeAvion: "B737-800",
 *   version: "16C138Y",
 *   provenance: "ADD",
 *   heureArrivee: "12:10",
 *   destination: "ADD",
 *   heureDepart: "14:05",
 *   departLendemain: false,
 *   observations: "..."
 * }
 */
router.post('/:programmeId/vols', protect, excludeQualite, volProgrammeController.ajouterVol);

/**
 * @route   GET /api/programmes-vol/:programmeId/vols
 * @desc    Lister les vols d'un programme
 * @access  Private (Tous)
 * @query   tri (ordre, heureArrivee, heureDepart, numeroVol), ordre (asc, desc)
 */
router.get('/:programmeId/vols', protect, volProgrammeController.obtenirVols);

/**
 * @route   GET /api/programmes-vol/:programmeId/vols/jour/:jour
 * @desc    Obtenir les vols d'un jour spécifique (0=Dim, 6=Sam)
 * @access  Private (Tous)
 */
router.get('/:programmeId/vols/jour/:jour', protect, volProgrammeController.obtenirVolsParJour);

/**
 * @route   GET /api/programmes-vol/:programmeId/vols/recherche
 * @desc    Rechercher des vols par numéro
 * @access  Private (Tous)
 * @query   q (terme de recherche, min 2 caractères)
 */
router.get('/:programmeId/vols/recherche', protect, volProgrammeController.rechercherVols);

/**
 * @route   GET /api/programmes-vol/:programmeId/vols/compagnie/:code
 * @desc    Obtenir les vols d'une compagnie
 * @access  Private (Tous)
 */
router.get('/:programmeId/vols/compagnie/:code', protect, volProgrammeController.obtenirVolsParCompagnie);

/**
 * @route   POST /api/programmes-vol/:programmeId/vols/import
 * @desc    Importer plusieurs vols en une fois
 * @access  Private (Opérationnels)
 * @body    { vols: [...] }
 */
router.post('/:programmeId/vols/import', protect, excludeQualite, volProgrammeController.importerVols);

/**
 * @route   PATCH /api/programmes-vol/:programmeId/vols/reorganiser
 * @desc    Réorganiser l'ordre des vols
 * @access  Private (Opérationnels)
 * @body    { ordres: [{ volId, ordre }] }
 */
router.patch('/:programmeId/vols/reorganiser', protect, excludeQualite, volProgrammeController.reorganiserVols);

/**
 * @route   GET /api/programmes-vol/:programmeId/vols/:id
 * @desc    Obtenir un vol par ID
 * @access  Private (Tous)
 */
router.get('/:programmeId/vols/:id', protect, volProgrammeController.obtenirVolParId);

/**
 * @route   PATCH /api/programmes-vol/:programmeId/vols/:id
 * @desc    Modifier un vol
 * @access  Private (Opérationnels)
 */
router.patch('/:programmeId/vols/:id', protect, excludeQualite, volProgrammeController.modifierVol);

/**
 * @route   DELETE /api/programmes-vol/:programmeId/vols/:id
 * @desc    Supprimer un vol
 * @access  Private (Opérationnels)
 */
router.delete('/:programmeId/vols/:id', protect, authorize(...ROLES_OPERATIONNELS), volProgrammeController.supprimerVol);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES EXPORT PDF
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/programmes-vol/:programmeId/export-pdf
 * @desc    Obtenir les donnees formatees pour export PDF (apercu JSON)
 * @access  Private (Tous)
 */
router.get('/:programmeId/export-pdf', protect, volProgrammeController.obtenirDonneesPDF);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES ARCHIVAGE GOOGLE DRIVE
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/programmes-vol/:programmeId/archiver
 * @desc    Archiver le PDF du programme dans Google Drive
 * @access  Private (Opérationnels)
 * @returns { success, message, data: { programme, archivage } }
 */
router.post('/:programmeId/archiver', protect, excludeQualite, volProgrammeController.archiverProgramme);

/**
 * @route   GET /api/programmes-vol/:programmeId/archivage/status
 * @desc    Vérifier si le programme peut être archivé
 * @access  Private (Tous)
 * @returns { canArchive, reason?, programme? }
 */
router.get('/:programmeId/archivage/status', protect, volProgrammeController.verifierArchivage);

/**
 * @route   GET /api/programmes-vol/:programmeId/archivage
 * @desc    Obtenir les informations d'archivage d'un programme
 * @access  Private (Tous)
 * @returns { programmeId, nom, isArchived, archivage }
 */
router.get('/:programmeId/archivage', protect, volProgrammeController.obtenirInfosArchivage);

/**
 * @route   GET /api/programmes-vol/:programmeId/telecharger-pdf
 * @desc    Telecharger le PDF du programme de vols
 * @access  Private (Tous)
 * @query   responsable (optionnel - nom du responsable)
 * @returns PDF file download
 */
router.get('/:programmeId/telecharger-pdf', protect, volProgrammeController.telechargerPDF);

/**
 * @route   GET /api/programmes-vol/:programmeId/pdf-base64
 * @desc    Obtenir le PDF en base64 (pour preview dans le frontend)
 * @access  Private (Tous)
 * @query   responsable (optionnel - nom du responsable)
 * @returns { base64: string, mimeType: string }
 */
router.get('/:programmeId/pdf-base64', protect, volProgrammeController.obtenirPDFBase64);

export default router;
