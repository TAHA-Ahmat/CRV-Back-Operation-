import express from 'express';
import * as passagerController from '../controllers/passager.controller.js';
import * as fretController from '../controllers/fret.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

/**
 * EXTENSIONS 4 & 5 - Routes Charges (Passagers & Fret détaillés)
 *
 * Routes NOUVELLES pour gérer les catégories détaillées de passagers et le fret détaillé.
 *
 * NON-RÉGRESSION: Ces routes sont NOUVELLES.
 * - Si des routes /api/charges existaient déjà, elles ne sont PAS affectées
 * - Ces routes ajoutent des endpoints pour la gestion des détails
 *
 * Ces routes gèrent le nouveau endpoint /api/charges/* pour les extensions 4 & 5.
 */

const router = express.Router();

/**
 * 🔒 PHASE 1 AJUSTÉE - Référentiel officiel
 * Périmètre opérationnel unifié pour AGENT, CHEF, SUPERVISEUR, MANAGER
 * QUALITE: Lecture seule (statistiques uniquement)
 */

// ========== ROUTES POUR CATÉGORIES DÉTAILLÉES ==========

/**
 * @route   PUT /api/charges/:id/categories-detaillees
 * @desc    Mettre à jour les catégories détaillées de passagers
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { bebes, enfants, adolescents, adultes, seniors, pmr*, transit*, vip, equipage, deportes }
 */
router.put('/:id/categories-detaillees', protect, passagerController.mettreAJourCategoriesDetaillees);

/**
 * @route   PUT /api/charges/:id/classes
 * @desc    Mettre à jour les classes de passagers
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { premiere, affaires, economique }
 */
router.put('/:id/classes', protect, passagerController.mettreAJourClassePassagers);

/**
 * @route   PUT /api/charges/:id/besoins-medicaux
 * @desc    Mettre à jour les besoins médicaux des passagers
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { oxygeneBord, brancardier, accompagnementMedical }
 */
router.put('/:id/besoins-medicaux', protect, passagerController.mettreAJourBesoinsMedicaux);

/**
 * @route   PUT /api/charges/:id/mineurs
 * @desc    Mettre à jour les informations sur les mineurs
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { mineurNonAccompagne, bebeNonAccompagne }
 */
router.put('/:id/mineurs', protect, passagerController.mettreAJourMineurs);

// ========== ROUTES POUR CONVERSION ==========

/**
 * @route   POST /api/charges/:id/convertir-categories-detaillees
 * @desc    Convertir les catégories basiques en catégories détaillées
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { mapping?: object } (optionnel)
 */
router.post('/:id/convertir-categories-detaillees', protect, passagerController.convertirVersCategoriesDetaillees);

// ========== ROUTES POUR STATISTIQUES ==========

/**
 * @route   GET /api/charges/statistiques/passagers
 * @desc    Obtenir les statistiques globales des passagers
 * @access  Private
 * @query   dateDebut, dateFin, compagnie (optionnels)
 */
router.get('/statistiques/passagers', protect, passagerController.obtenirStatistiquesGlobalesPassagers);

/**
 * @route   GET /api/charges/crv/:crvId/statistiques-passagers
 * @desc    Obtenir les statistiques détaillées des passagers pour un CRV
 * @access  Private
 */
router.get('/crv/:crvId/statistiques-passagers', protect, passagerController.obtenirStatistiquesPassagersCRV);

// ========== EXTENSION 5 - ROUTES POUR FRET DÉTAILLÉ ==========

/**
 * @route   PUT /api/charges/:id/fret-detaille
 * @desc    Mettre à jour le fret détaillé
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { categoriesFret, marchandisesDangereuses, logistique, douanes, conditionsTransport }
 */
router.put('/:id/fret-detaille', protect, fretController.mettreAJourFretDetaille);

/**
 * @route   POST /api/charges/:id/marchandises-dangereuses
 * @desc    Ajouter une marchandise dangereuse
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 * @body    { codeONU, classeONU, designationOfficielle, quantite, unite, groupeEmballage }
 */
router.post('/:id/marchandises-dangereuses', protect, fretController.ajouterMarchandiseDangereuse);

/**
 * @route   DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId
 * @desc    Retirer une marchandise dangereuse
 * @access  Private (Tous opérationnels: AGENT, CHEF, SUPERVISEUR, MANAGER)
 */
router.delete('/:id/marchandises-dangereuses/:marchandiseId', protect, fretController.retirerMarchandiseDangereuse);

/**
 * @route   POST /api/charges/valider-marchandise-dangereuse
 * @desc    Valider une marchandise dangereuse
 * @access  Private
 * @body    Détails de la marchandise à valider
 */
router.post('/valider-marchandise-dangereuse', protect, fretController.validerMarchandiseDangereuse);

/**
 * @route   GET /api/charges/marchandises-dangereuses
 * @desc    Obtenir les charges avec marchandises dangereuses
 * @access  Private
 * @query   crvId (optionnel)
 */
router.get('/marchandises-dangereuses', protect, fretController.obtenirChargesAvecMarchandisesDangereuses);

/**
 * @route   GET /api/charges/crv/:crvId/statistiques-fret
 * @desc    Obtenir les statistiques de fret pour un CRV
 * @access  Private
 */
router.get('/crv/:crvId/statistiques-fret', protect, fretController.obtenirStatistiquesFretCRV);

/**
 * @route   GET /api/charges/statistiques/fret
 * @desc    Obtenir les statistiques globales de fret
 * @access  Private
 * @query   dateDebut, dateFin, compagnie (optionnels)
 */
router.get('/statistiques/fret', protect, fretController.obtenirStatistiquesGlobalesFret);

export default router;
