import express from 'express';
import * as avionConfigurationController from '../../controllers/referentials/avionConfiguration.controller.js';
import { protect, authorize, excludeQualite } from '../../middlewares/auth.middleware.js';

/**
 * EXTENSION 3 - Routes Avion (Version et configuration)
 *
 * Routes NOUVELLES pour gérer les versions et configurations des avions.
 *
 * NON-RÉGRESSION: Ces routes sont NOUVELLES.
 * - Si des routes /api/avions existaient déjà, elles ne sont PAS affectées
 * - Ces routes ajoutent des endpoints pour la gestion des configurations
 *
 * Ces routes gèrent le nouveau endpoint /api/avions/* pour l'extension 3.
 */

const router = express.Router();

/**
 * 🔒 PHASE 1 AJUSTÉE - Référentiel officiel
 * Périmètre opérationnel unifié pour AGENT, CHEF, SUPERVISEUR, MANAGER
 * QUALITE: Lecture seule (historique, comparaison, statistiques)
 */

// ========== ROUTES STATIQUES (AVANT LES ROUTES DYNAMIQUES) ==========

/**
 * @route   GET /api/avions/revisions/prochaines
 * @desc    Obtenir les avions nécessitant une révision prochainement
 * @access  Private
 * @query   joursAvance (default: 30)
 */
router.get('/revisions/prochaines', protect, avionConfigurationController.obtenirAvionsRevisionProchaine);

/**
 * @route   GET /api/avions/statistiques/configurations
 * @desc    Obtenir les statistiques de configuration des avions
 * @access  Private
 * @query   compagnie (optionnel)
 */
router.get('/statistiques/configurations', protect, avionConfigurationController.obtenirStatistiquesConfigurations);

// ========== ROUTES CRUD DE BASE ==========

/**
 * @route   GET /api/avions
 * @desc    Lister tous les avions
 * @access  Private
 * @query   compagnie, statut, typeAvion (optionnels)
 */
router.get('/', protect, avionConfigurationController.listerAvions);

/**
 * @route   POST /api/avions
 * @desc    Créer un nouvel avion
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { immatriculation, typeAvion, compagnie, capacitePassagers?, capaciteFret?, configuration? }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/', protect, excludeQualite, avionConfigurationController.creerAvion);

/**
 * @route   GET /api/avions/:id
 * @desc    Obtenir un avion par ID
 * @access  Private
 */
router.get('/:id', protect, avionConfigurationController.obtenirAvion);

// ========== ROUTES POUR GESTION DE CONFIGURATION ==========

/**
 * @route   PUT /api/avions/:id/configuration
 * @desc    Mettre à jour la configuration d'un avion
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { sieges, equipements, moteurs, caracteristiquesTechniques, remarques }
 */
// 🔒 P0-1: QUALITE exclu
router.put('/:id/configuration', protect, excludeQualite, avionConfigurationController.mettreAJourConfiguration);

// ========== ROUTES POUR GESTION DES VERSIONS ==========

/**
 * @route   GET /api/avions/:id/versions/comparer
 * @desc    Comparer deux versions d'un avion
 * @access  Private
 * @query   version1, version2
 */
router.get('/:id/versions/comparer', protect, avionConfigurationController.comparerVersions);

/**
 * @route   POST /api/avions/:id/versions
 * @desc    Créer une nouvelle version de configuration
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { numeroVersion: string, modifications: string, configuration?: object }
 */
// 🔒 P0-1: QUALITE exclu
router.post('/:id/versions', protect, excludeQualite, avionConfigurationController.creerNouvelleVersion);

/**
 * @route   GET /api/avions/:id/versions
 * @desc    Obtenir l'historique des versions d'un avion
 * @access  Private
 */
router.get('/:id/versions', protect, avionConfigurationController.obtenirHistoriqueVersions);

/**
 * @route   GET /api/avions/:id/versions/:numeroVersion
 * @desc    Obtenir une version spécifique
 * @access  Private
 */
router.get('/:id/versions/:numeroVersion', protect, avionConfigurationController.obtenirVersionSpecifique);

/**
 * @route   POST /api/avions/:id/versions/:numeroVersion/restaurer
 * @desc    Restaurer une version antérieure
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 */
// 🔒 P0-1: QUALITE exclu
router.post('/:id/versions/:numeroVersion/restaurer', protect, excludeQualite, avionConfigurationController.restaurerVersion);

// ========== ROUTES POUR GESTION DE RÉVISION ==========

/**
 * @route   PUT /api/avions/:id/revision
 * @desc    Mettre à jour les informations de révision
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { date?: Date, type?: string, prochaineDatePrevue?: Date }
 */
// 🔒 P0-1: QUALITE exclu
router.put('/:id/revision', protect, excludeQualite, avionConfigurationController.mettreAJourRevision);

export default router;
