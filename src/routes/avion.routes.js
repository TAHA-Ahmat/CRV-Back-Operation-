import express from 'express';
import * as avionConfigurationController from '../controllers/avionConfiguration.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

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
 * IMPORTANT: Toutes les routes nécessitent l'authentification JWT
 * Le middleware protect ajoute req.user avec les informations de l'utilisateur connecté
 */

// ========== ROUTES POUR GESTION DE CONFIGURATION ==========

/**
 * @route   PUT /api/avions/:id/configuration
 * @desc    Mettre à jour la configuration d'un avion
 * @access  Private (SUPERVISEUR, MANAGER, ADMIN)
 * @body    { sieges, equipements, moteurs, caracteristiquesTechniques, remarques }
 */
router.put('/:id/configuration', protect, authorize('SUPERVISEUR', 'MANAGER', 'ADMIN'), avionConfigurationController.mettreAJourConfiguration);

// ========== ROUTES POUR GESTION DES VERSIONS ==========

/**
 * @route   POST /api/avions/:id/versions
 * @desc    Créer une nouvelle version de configuration
 * @access  Private (SUPERVISEUR, MANAGER, ADMIN)
 * @body    { numeroVersion: string, modifications: string, configuration?: object }
 */
router.post('/:id/versions', protect, authorize('SUPERVISEUR', 'MANAGER', 'ADMIN'), avionConfigurationController.creerNouvelleVersion);

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
 * @access  Private (SUPERVISEUR, MANAGER, ADMIN)
 */
router.post('/:id/versions/:numeroVersion/restaurer', protect, authorize('SUPERVISEUR', 'MANAGER', 'ADMIN'), avionConfigurationController.restaurerVersion);

/**
 * @route   GET /api/avions/:id/versions/comparer
 * @desc    Comparer deux versions d'un avion
 * @access  Private
 * @query   version1, version2
 */
router.get('/:id/versions/comparer', protect, avionConfigurationController.comparerVersions);

// ========== ROUTES POUR GESTION DE RÉVISION ==========

/**
 * @route   PUT /api/avions/:id/revision
 * @desc    Mettre à jour les informations de révision
 * @access  Private (SUPERVISEUR, MANAGER, ADMIN)
 * @body    { date?: Date, type?: string, prochaineDatePrevue?: Date }
 */
router.put('/:id/revision', protect, authorize('SUPERVISEUR', 'MANAGER', 'ADMIN'), avionConfigurationController.mettreAJourRevision);

/**
 * @route   GET /api/avions/revisions/prochaines
 * @desc    Obtenir les avions nécessitant une révision prochainement
 * @access  Private
 * @query   joursAvance (default: 30)
 */
router.get('/revisions/prochaines', protect, avionConfigurationController.obtenirAvionsRevisionProchaine);

// ========== ROUTES POUR STATISTIQUES ==========

/**
 * @route   GET /api/avions/statistiques/configurations
 * @desc    Obtenir les statistiques de configuration des avions
 * @access  Private
 * @query   compagnie (optionnel)
 */
router.get('/statistiques/configurations', protect, avionConfigurationController.obtenirStatistiquesConfigurations);

export default router;
