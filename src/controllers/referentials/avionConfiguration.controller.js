import * as avionService from '../../services/referentials/avion.service.js';
import Avion from '../../models/referentials/Avion.js';

/**
 * EXTENSION 3 - Contrôleur Avion Configuration (Version et configuration)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux versions et configurations des avions.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations CRUD basiques sur les avions (s'il existe un contrôleur) restent inchangées
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 3.
 */

// ============================================
// ROUTES CRUD DE BASE
// ============================================

/**
 * Lister tous les avions
 * GET /api/avions
 */
export const listerAvions = async (req, res) => {
  try {
    const { compagnie, statut, typeAvion } = req.query;
    const filter = {};

    if (compagnie) filter.compagnie = compagnie;
    if (statut) filter.statut = statut;
    if (typeAvion) filter.typeAvion = typeAvion;

    const avions = await Avion.find(filter).sort({ immatriculation: 1 });

    res.status(200).json({
      success: true,
      count: avions.length,
      data: avions
    });
  } catch (error) {
    console.error('Erreur dans listerAvions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des avions'
    });
  }
};

/**
 * Obtenir un avion par ID
 * GET /api/avions/:id
 */
export const obtenirAvion = async (req, res) => {
  try {
    const avion = await Avion.findById(req.params.id);

    if (!avion) {
      return res.status(404).json({
        success: false,
        message: 'Avion non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: avion
    });
  } catch (error) {
    console.error('Erreur dans obtenirAvion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'avion'
    });
  }
};

/**
 * Créer un nouvel avion
 * POST /api/avions
 */
export const creerAvion = async (req, res) => {
  try {
    const { immatriculation, typeAvion, compagnie, capacitePassagers, capaciteFret, configuration } = req.body;

    // Vérifier si l'immatriculation existe déjà
    const existingAvion = await Avion.findOne({ immatriculation: immatriculation.toUpperCase() });
    if (existingAvion) {
      return res.status(400).json({
        success: false,
        message: 'Un avion avec cette immatriculation existe déjà'
      });
    }

    const avion = await Avion.create({
      immatriculation,
      typeAvion,
      compagnie,
      capacitePassagers: capacitePassagers || 0,
      capaciteFret: capaciteFret || 0,
      configuration: configuration || {}
    });

    console.log('[CRV][AVION][CREATION]', {
      avionId: avion._id,
      immatriculation: avion.immatriculation,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Avion créé avec succès',
      data: avion
    });
  } catch (error) {
    console.error('Erreur dans creerAvion:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un avion avec cette immatriculation existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de l\'avion'
    });
  }
};

// ============================================
// ROUTES EXTENSION 3 - VERSION ET CONFIGURATION
// ============================================

/**
 * Mettre à jour la configuration d'un avion
 * PUT /api/avions/:id/configuration
 */
export const mettreAJourConfiguration = async (req, res) => {
  try {
    const avionId = req.params.id;
    const nouvelleConfiguration = req.body;
    const userId = req.user._id;

    const avion = await avionService.mettreAJourConfiguration(avionId, nouvelleConfiguration, userId);

    res.status(200).json({
      success: true,
      message: 'Configuration de l\'avion mise à jour avec succès',
      data: avion
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourConfiguration:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la configuration'
    });
  }
};

/**
 * Créer une nouvelle version de configuration
 * POST /api/avions/:id/versions
 */
export const creerNouvelleVersion = async (req, res) => {
  try {
    const avionId = req.params.id;
    const { numeroVersion, modifications, configuration } = req.body;
    const userId = req.user._id;

    if (!numeroVersion) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de version est requis'
      });
    }

    if (!modifications) {
      return res.status(400).json({
        success: false,
        message: 'La description des modifications est requise'
      });
    }

    const avion = await avionService.creerNouvelleVersion(avionId, numeroVersion, modifications, configuration, userId);

    res.status(201).json({
      success: true,
      message: 'Nouvelle version créée avec succès',
      data: avion
    });

  } catch (error) {
    console.error('Erreur dans creerNouvelleVersion:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('existe déjà')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la nouvelle version'
    });
  }
};

/**
 * Obtenir l'historique des versions d'un avion
 * GET /api/avions/:id/versions
 */
export const obtenirHistoriqueVersions = async (req, res) => {
  try {
    const avionId = req.params.id;

    const historique = await avionService.obtenirHistoriqueVersions(avionId);

    res.status(200).json({
      success: true,
      count: historique.length,
      data: historique
    });

  } catch (error) {
    console.error('Erreur dans obtenirHistoriqueVersions:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'historique'
    });
  }
};

/**
 * Obtenir une version spécifique
 * GET /api/avions/:id/versions/:numeroVersion
 */
export const obtenirVersionSpecifique = async (req, res) => {
  try {
    const avionId = req.params.id;
    const numeroVersion = req.params.numeroVersion;

    const version = await avionService.obtenirVersionSpecifique(avionId, numeroVersion);

    res.status(200).json({
      success: true,
      data: version
    });

  } catch (error) {
    console.error('Erreur dans obtenirVersionSpecifique:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de la version'
    });
  }
};

/**
 * Restaurer une version antérieure
 * POST /api/avions/:id/versions/:numeroVersion/restaurer
 */
export const restaurerVersion = async (req, res) => {
  try {
    const avionId = req.params.id;
    const numeroVersion = req.params.numeroVersion;
    const userId = req.user._id;

    const avion = await avionService.restaurerVersion(avionId, numeroVersion, userId);

    res.status(200).json({
      success: true,
      message: `Version ${numeroVersion} restaurée avec succès`,
      data: avion
    });

  } catch (error) {
    console.error('Erreur dans restaurerVersion:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Snapshot')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la restauration de la version'
    });
  }
};

/**
 * Mettre à jour les informations de révision
 * PUT /api/avions/:id/revision
 */
export const mettreAJourRevision = async (req, res) => {
  try {
    const avionId = req.params.id;
    const revisionData = req.body;
    const userId = req.user._id;

    const avion = await avionService.mettreAJourRevision(avionId, revisionData, userId);

    res.status(200).json({
      success: true,
      message: 'Informations de révision mises à jour avec succès',
      data: avion
    });

  } catch (error) {
    console.error('Erreur dans mettreAJourRevision:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('invalide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la révision'
    });
  }
};

/**
 * Obtenir les avions nécessitant une révision prochainement
 * GET /api/avions/revisions/prochaines
 */
export const obtenirAvionsRevisionProchaine = async (req, res) => {
  try {
    const joursAvance = parseInt(req.query.joursAvance) || 30;

    const avions = await avionService.obtenirAvionsRevisionProchaine(joursAvance);

    res.status(200).json({
      success: true,
      count: avions.length,
      joursAvance: joursAvance,
      data: avions
    });

  } catch (error) {
    console.error('Erreur dans obtenirAvionsRevisionProchaine:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des avions nécessitant révision'
    });
  }
};

/**
 * Comparer deux versions d'un avion
 * GET /api/avions/:id/versions/comparer
 */
export const comparerVersions = async (req, res) => {
  try {
    const avionId = req.params.id;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      return res.status(400).json({
        success: false,
        message: 'Les deux numéros de version sont requis (version1 et version2)'
      });
    }

    const comparaison = await avionService.comparerVersions(avionId, version1, version2);

    res.status(200).json({
      success: true,
      data: comparaison
    });

  } catch (error) {
    console.error('Erreur dans comparerVersions:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la comparaison des versions'
    });
  }
};

/**
 * Obtenir les statistiques de configuration des avions
 * GET /api/avions/statistiques/configurations
 */
export const obtenirStatistiquesConfigurations = async (req, res) => {
  try {
    const compagnie = req.query.compagnie;

    const statistiques = await avionService.obtenirStatistiquesConfigurations(compagnie);

    res.status(200).json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('Erreur dans obtenirStatistiquesConfigurations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul des statistiques'
    });
  }
};
