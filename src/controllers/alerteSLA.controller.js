import * as alerteSLAService from '../services/alerteSLA.service.js';

/**
 * EXTENSION 8 - Contrôleur Alertes SLA (Service alertes SLA proactives)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux alertes SLA.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes continuent de fonctionner normalement
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 8.
 */

/**
 * Vérifier le SLA d'un CRV spécifique
 * GET /api/sla/crv/:id
 */
export const verifierSLACRV = async (req, res) => {
  try {
    const crvId = req.params.id;

    const etatSLA = await alerteSLAService.verifierSLACRV(crvId);

    res.status(200).json({
      success: true,
      data: etatSLA
    });

  } catch (error) {
    console.error('Erreur dans verifierSLACRV:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du SLA'
    });
  }
};

/**
 * Vérifier le SLA d'une phase spécifique
 * GET /api/sla/phase/:id
 */
export const verifierSLAPhase = async (req, res) => {
  try {
    const phaseId = req.params.id;

    const etatSLA = await alerteSLAService.verifierSLAPhase(phaseId);

    res.status(200).json({
      success: true,
      data: etatSLA
    });

  } catch (error) {
    console.error('Erreur dans verifierSLAPhase:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du SLA'
    });
  }
};

/**
 * Surveiller tous les CRV actifs
 * POST /api/sla/surveiller/crv
 */
export const surveillerCRV = async (req, res) => {
  try {
    const resultat = await alerteSLAService.surveillerTousCRV();

    res.status(200).json({
      success: true,
      message: `Surveillance terminée. ${resultat.statistiques.alertesEnvoyees} alertes envoyées.`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans surveillerCRV:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la surveillance des CRV'
    });
  }
};

/**
 * Surveiller toutes les phases actives
 * POST /api/sla/surveiller/phases
 */
export const surveillerPhases = async (req, res) => {
  try {
    const resultat = await alerteSLAService.surveillerToutesPhases();

    res.status(200).json({
      success: true,
      message: `Surveillance terminée. ${resultat.statistiques.alertesEnvoyees} alertes envoyées.`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans surveillerPhases:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la surveillance des phases'
    });
  }
};

/**
 * Obtenir le rapport SLA complet
 * GET /api/sla/rapport
 */
export const obtenirRapportSLA = async (req, res) => {
  try {
    const rapport = await alerteSLAService.obtenirRapportSLA();

    res.status(200).json({
      success: true,
      data: rapport
    });

  } catch (error) {
    console.error('Erreur dans obtenirRapportSLA:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération du rapport SLA'
    });
  }
};

/**
 * Obtenir la configuration SLA actuelle
 * GET /api/sla/configuration
 */
export const obtenirConfiguration = async (req, res) => {
  try {
    const config = alerteSLAService.obtenirConfigurationSLA();

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Erreur dans obtenirConfiguration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de la configuration'
    });
  }
};

/**
 * Configurer les SLA personnalisés (ADMIN uniquement)
 * PUT /api/sla/configuration
 */
export const configurerSLA = async (req, res) => {
  try {
    const slaConfig = req.body;

    alerteSLAService.configurerSLA(slaConfig);

    res.status(200).json({
      success: true,
      message: 'Configuration SLA mise à jour',
      data: alerteSLAService.obtenirConfigurationSLA()
    });

  } catch (error) {
    console.error('Erreur dans configurerSLA:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la configuration des SLA'
    });
  }
};
