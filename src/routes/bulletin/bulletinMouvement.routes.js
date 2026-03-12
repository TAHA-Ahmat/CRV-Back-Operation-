import express from 'express';
import * as bulletinController from '../../controllers/bulletin/bulletinMouvement.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';

/**
 * ROUTES BULLETIN DE MOUVEMENT
 *
 * Entite officielle d'exploitation a court terme (3-4 jours).
 *
 * HIERARCHIE METIER:
 * Programme (6 mois) → Bulletin (3-4 jours) → CRV (reel)
 *
 * REGLES METIER:
 * - Le bulletin annonce, informe et organise l'exploitation
 * - N'est PAS une preuve d'operation (seul le CRV fait foi)
 * - Peut s'ecarter du programme (ajustements, vols hors programme)
 * - En cas de contradiction: CRV > Bulletin > Programme
 * - Tous les profils operationnels peuvent creer un bulletin
 */

const router = express.Router();

/**
 * Roles operationnels autorises
 */
const ROLES_OPERATIONNELS = ['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER'];

// ══════════════════════════════════════════════════════════════════════════
// ROUTES CRUD BULLETIN
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/bulletins
 * @desc    Creer un nouveau bulletin vide
 * @access  Private (Operationnels)
 * @body    { escale, dateDebut, dateFin, titre?, remarques?, programmeVolSource? }
 */
router.post('/', protect, excludeQualite, bulletinController.creerBulletin);

/**
 * @route   POST /api/bulletins/depuis-programme
 * @desc    Creer un bulletin pre-rempli depuis un programme
 * @access  Private (Operationnels)
 * @body    { escale, dateDebut, dateFin, programmeId, titre?, remarques? }
 */
router.post('/depuis-programme', protect, excludeQualite, bulletinController.creerBulletinDepuisProgramme);

/**
 * @route   GET /api/bulletins
 * @desc    Lister les bulletins avec filtres et pagination
 * @access  Private (Tous)
 * @query   escale, statut, annee, semaine, dateDebut, dateFin, programmeId, page, limit, sort
 */
router.get('/', protect, bulletinController.listerBulletins);

/**
 * @route   GET /api/bulletins/en-cours/:escale
 * @desc    Obtenir le bulletin en cours pour une escale
 * @access  Private (Tous)
 */
router.get('/en-cours/:escale', protect, bulletinController.obtenirBulletinEnCours);

/**
 * @route   GET /api/bulletins/escales-actives
 * @desc    Escales ayant un bulletin PUBLIE couvrant la date donnee
 * @access  Private (Tous)
 * @query   date (YYYY-MM-DD, requis)
 */
router.get('/escales-actives', protect, bulletinController.getEscalesActives);

/**
 * @route   GET /api/bulletins/:id
 * @desc    Obtenir un bulletin par ID
 * @access  Private (Tous)
 */
router.get('/:id', protect, bulletinController.obtenirBulletinParId);

/**
 * @route   DELETE /api/bulletins/:id
 * @desc    Supprimer un bulletin (brouillon uniquement)
 * @access  Private (Operationnels)
 */
router.delete('/:id', protect, authorize(...ROLES_OPERATIONNELS), bulletinController.supprimerBulletin);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES GESTION DES MOUVEMENTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/bulletins/:id/mouvements
 * @desc    Ajouter un mouvement au bulletin
 * @access  Private (Operationnels)
 * @body    {
 *   numeroVol, dateMouvement, heureArriveePrevue?, heureDepartPrevue?,
 *   provenance?, destination?, typeAvion?, codeCompagnie?, remarques?,
 *   origine? (PROGRAMME|HORS_PROGRAMME|AJUSTEMENT)
 * }
 */
router.post('/:id/mouvements', protect, excludeQualite, bulletinController.ajouterMouvement);

/**
 * @route   POST /api/bulletins/:id/mouvements/hors-programme
 * @desc    Ajouter un vol hors programme au bulletin
 * @access  Private (Operationnels)
 * @body    {
 *   numeroVol, dateMouvement, heureArriveePrevue?, heureDepartPrevue?,
 *   provenance?, destination?, typeAvion?, codeCompagnie?,
 *   typeHorsProgramme (CHARTER|MEDICAL|TECHNIQUE|COMMERCIAL|CARGO|AUTRE),
 *   raisonHorsProgramme?, remarques?
 * }
 */
router.post('/:id/mouvements/hors-programme', protect, excludeQualite, bulletinController.ajouterVolHorsProgramme);

/**
 * @route   PATCH /api/bulletins/:id/mouvements/:mouvementId
 * @desc    Modifier un mouvement du bulletin
 * @access  Private (Operationnels)
 * @body    Champs a modifier
 */
router.patch('/:id/mouvements/:mouvementId', protect, excludeQualite, bulletinController.modifierMouvement);

/**
 * @route   DELETE /api/bulletins/:id/mouvements/:mouvementId
 * @desc    Supprimer un mouvement du bulletin (brouillon uniquement)
 * @access  Private (Operationnels)
 */
router.delete('/:id/mouvements/:mouvementId', protect, excludeQualite, bulletinController.supprimerMouvement);

/**
 * @route   POST /api/bulletins/:id/mouvements/:mouvementId/annuler
 * @desc    Annuler un mouvement (sans le supprimer, garde la trace)
 * @access  Private (Operationnels)
 * @body    { raison }
 */
router.post('/:id/mouvements/:mouvementId/annuler', protect, excludeQualite, bulletinController.annulerMouvement);

// ══════════════════════════════════════════════════════════════════════════
// ROUTES WORKFLOW
// ══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/bulletins/:id/publier
 * @desc    Publier un bulletin (BROUILLON → PUBLIE)
 * @access  Private (Operationnels)
 */
router.post('/:id/publier', protect, excludeQualite, bulletinController.publierBulletin);

/**
 * @route   POST /api/bulletins/:id/archiver
 * @desc    Archiver un bulletin (PUBLIE → ARCHIVE)
 * @access  Private (Operationnels)
 */
router.post('/:id/archiver', protect, excludeQualite, bulletinController.archiverBulletin);

/**
 * @route   POST /api/bulletins/:id/creer-vols
 * @desc    Creer les instances Vol depuis les mouvements du bulletin
 * @access  Private (Operationnels)
 * @note    Utile pour lier les CRV aux vols reels
 */
router.post('/:id/creer-vols', protect, excludeQualite, bulletinController.creerVolsDepuisBulletin);

export default router;
