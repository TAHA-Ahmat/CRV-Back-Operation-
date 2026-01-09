import Avion from '../../models/referentials/Avion.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';

/**
 * EXTENSION 3 - Service Avion (Version et configuration)
 *
 * Service NOUVEAU pour gérer les versions et configurations des avions.
 *
 * NON-RÉGRESSION: Ce service est OPTIONNEL et n'affecte AUCUNE logique existante.
 * - Les opérations existantes sur les avions continuent de fonctionner sans ce service
 * - Ce service fournit des fonctions ADDITIONNELLES uniquement
 *
 * Ce service est 100% OPTIONNEL et peut être utilisé ou ignoré.
 */

/**
 * Met à jour la configuration d'un avion
 * @param {String} avionId - ID de l'avion
 * @param {Object} nouvelleConfiguration - Nouvelle configuration
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Avion mis à jour
 */
export const mettreAJourConfiguration = async (avionId, nouvelleConfiguration, userId) => {
  try {
    const avion = await Avion.findById(avionId);
    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    // Sauvegarder l'ancienne configuration
    const ancienneConfig = { ...avion.configuration };

    // Mettre à jour la configuration
    if (nouvelleConfiguration.sieges) {
      avion.configuration.sieges = {
        ...avion.configuration.sieges,
        ...nouvelleConfiguration.sieges
      };
    }

    if (nouvelleConfiguration.equipements) {
      avion.configuration.equipements = {
        ...avion.configuration.equipements,
        ...nouvelleConfiguration.equipements
      };
    }

    if (nouvelleConfiguration.moteurs) {
      avion.configuration.moteurs = {
        ...avion.configuration.moteurs,
        ...nouvelleConfiguration.moteurs
      };
    }

    if (nouvelleConfiguration.caracteristiquesTechniques) {
      avion.configuration.caracteristiquesTechniques = {
        ...avion.configuration.caracteristiquesTechniques,
        ...nouvelleConfiguration.caracteristiquesTechniques
      };
    }

    if (nouvelleConfiguration.remarques !== undefined) {
      avion.configuration.remarques = nouvelleConfiguration.remarques;
    }

    await avion.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Avion',
      targetId: avion._id,
      changes: {
        ancienneConfiguration: ancienneConfig,
        nouvelleConfiguration: avion.configuration
      },
      metadata: {
        description: `Mise à jour de la configuration de l'avion ${avion.immatriculation}`
      }
    });

    return avion;

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle version de configuration d'avion
 * @param {String} avionId - ID de l'avion
 * @param {String} numeroVersion - Numéro de la nouvelle version
 * @param {String} modifications - Description des modifications
 * @param {Object} nouvelleConfiguration - Nouvelle configuration (optionnel)
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Avion mis à jour
 */
export const creerNouvelleVersion = async (avionId, numeroVersion, modifications, nouvelleConfiguration, userId) => {
  try {
    const avion = await Avion.findById(avionId);
    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    // Vérifier que le numéro de version n'existe pas déjà
    const versionExistante = avion.historiqueVersions.find(v => v.version === numeroVersion);
    if (versionExistante) {
      throw new Error(`La version ${numeroVersion} existe déjà pour cet avion`);
    }

    // Créer snapshot de la configuration actuelle
    const configSnapshot = JSON.parse(JSON.stringify(avion.configuration));

    // Appliquer la nouvelle configuration si fournie
    if (nouvelleConfiguration) {
      if (nouvelleConfiguration.sieges) {
        avion.configuration.sieges = {
          ...avion.configuration.sieges,
          ...nouvelleConfiguration.sieges
        };
      }

      if (nouvelleConfiguration.equipements) {
        avion.configuration.equipements = {
          ...avion.configuration.equipements,
          ...nouvelleConfiguration.equipements
        };
      }

      if (nouvelleConfiguration.moteurs) {
        avion.configuration.moteurs = {
          ...avion.configuration.moteurs,
          ...nouvelleConfiguration.moteurs
        };
      }

      if (nouvelleConfiguration.caracteristiquesTechniques) {
        avion.configuration.caracteristiquesTechniques = {
          ...avion.configuration.caracteristiquesTechniques,
          ...nouvelleConfiguration.caracteristiquesTechniques
        };
      }

      if (nouvelleConfiguration.remarques !== undefined) {
        avion.configuration.remarques = nouvelleConfiguration.remarques;
      }
    }

    // Mettre à jour le numéro de version
    avion.version = numeroVersion;

    // Ajouter à l'historique
    avion.historiqueVersions.push({
      version: numeroVersion,
      dateChangement: new Date(),
      modifiePar: userId,
      modifications: modifications,
      configurationSnapshot: configSnapshot
    });

    await avion.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Avion',
      targetId: avion._id,
      changes: {
        nouvelleVersion: numeroVersion,
        modifications: modifications
      },
      metadata: {
        description: `Création de la version ${numeroVersion} pour l'avion ${avion.immatriculation}`
      }
    });

    return avion;

  } catch (error) {
    console.error('Erreur lors de la création de la nouvelle version:', error);
    throw error;
  }
};

/**
 * Obtient l'historique des versions d'un avion
 * @param {String} avionId - ID de l'avion
 * @returns {Array} Historique des versions
 */
export const obtenirHistoriqueVersions = async (avionId) => {
  try {
    const avion = await Avion.findById(avionId)
      .populate('historiqueVersions.modifiePar', 'nom prenom email');

    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    return avion.historiqueVersions.sort((a, b) => b.dateChangement - a.dateChangement);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
};

/**
 * Obtient une version spécifique d'un avion
 * @param {String} avionId - ID de l'avion
 * @param {String} numeroVersion - Numéro de version
 * @returns {Object} Version demandée
 */
export const obtenirVersionSpecifique = async (avionId, numeroVersion) => {
  try {
    const avion = await Avion.findById(avionId)
      .populate('historiqueVersions.modifiePar', 'nom prenom email');

    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    const version = avion.historiqueVersions.find(v => v.version === numeroVersion);
    if (!version) {
      throw new Error(`Version ${numeroVersion} non trouvée pour cet avion`);
    }

    return version;

  } catch (error) {
    console.error('Erreur lors de la récupération de la version:', error);
    throw error;
  }
};

/**
 * Restaure une version antérieure d'avion
 * @param {String} avionId - ID de l'avion
 * @param {String} numeroVersion - Numéro de version à restaurer
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Avion mis à jour
 */
export const restaurerVersion = async (avionId, numeroVersion, userId) => {
  try {
    const avion = await Avion.findById(avionId);
    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    const versionARestaurer = avion.historiqueVersions.find(v => v.version === numeroVersion);
    if (!versionARestaurer) {
      throw new Error(`Version ${numeroVersion} non trouvée pour cet avion`);
    }

    if (!versionARestaurer.configurationSnapshot) {
      throw new Error('Snapshot de configuration non disponible pour cette version');
    }

    // Sauvegarder la configuration actuelle avant restauration
    const configAvantRestauration = JSON.parse(JSON.stringify(avion.configuration));

    // Restaurer la configuration
    avion.configuration = versionARestaurer.configurationSnapshot;
    avion.version = numeroVersion + '-RESTORED';

    // Ajouter une entrée dans l'historique
    avion.historiqueVersions.push({
      version: avion.version,
      dateChangement: new Date(),
      modifiePar: userId,
      modifications: `Restauration de la version ${numeroVersion}`,
      configurationSnapshot: configAvantRestauration
    });

    await avion.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'RESTORE',
      targetModel: 'Avion',
      targetId: avion._id,
      changes: {
        versionRestauree: numeroVersion,
        nouvelleVersion: avion.version
      },
      metadata: {
        description: `Restauration de la version ${numeroVersion} pour l'avion ${avion.immatriculation}`
      }
    });

    return avion;

  } catch (error) {
    console.error('Erreur lors de la restauration de la version:', error);
    throw error;
  }
};

/**
 * Met à jour les informations de révision d'un avion
 * @param {String} avionId - ID de l'avion
 * @param {Object} revisionData - Données de révision
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Avion mis à jour
 */
export const mettreAJourRevision = async (avionId, revisionData, userId) => {
  try {
    const avion = await Avion.findById(avionId);
    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    // Mettre à jour les informations de révision
    if (revisionData.date) {
      avion.derniereRevision.date = new Date(revisionData.date);
    }

    if (revisionData.type) {
      const typesValides = ['MINEURE', 'MAJEURE', 'COMPLETE'];
      if (!typesValides.includes(revisionData.type)) {
        throw new Error(`Type de révision invalide. Valeurs acceptées: ${typesValides.join(', ')}`);
      }
      avion.derniereRevision.type = revisionData.type;
    }

    if (revisionData.prochaineDatePrevue) {
      avion.derniereRevision.prochaineDatePrevue = new Date(revisionData.prochaineDatePrevue);
    }

    await avion.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Avion',
      targetId: avion._id,
      changes: {
        derniereRevision: avion.derniereRevision
      },
      metadata: {
        description: `Mise à jour des informations de révision pour l'avion ${avion.immatriculation}`
      }
    });

    return avion;

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la révision:', error);
    throw error;
  }
};

/**
 * Obtient les avions nécessitant une révision prochainement
 * @param {Number} joursAvance - Nombre de jours d'avance pour l'alerte (default: 30)
 * @returns {Array} Liste des avions nécessitant une révision
 */
export const obtenirAvionsRevisionProchaine = async (joursAvance = 30) => {
  try {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + joursAvance);

    const avions = await Avion.find({
      'derniereRevision.prochaineDatePrevue': {
        $lte: dateLimite,
        $gte: new Date()
      }
    }).sort({ 'derniereRevision.prochaineDatePrevue': 1 });

    return avions;

  } catch (error) {
    console.error('Erreur lors de la récupération des avions nécessitant révision:', error);
    throw error;
  }
};

/**
 * Compare deux versions d'un avion
 * @param {String} avionId - ID de l'avion
 * @param {String} version1 - Première version
 * @param {String} version2 - Deuxième version
 * @returns {Object} Comparaison des deux versions
 */
export const comparerVersions = async (avionId, version1, version2) => {
  try {
    const avion = await Avion.findById(avionId);
    if (!avion) {
      throw new Error('Avion non trouvé');
    }

    const v1 = avion.historiqueVersions.find(v => v.version === version1);
    const v2 = avion.historiqueVersions.find(v => v.version === version2);

    if (!v1) {
      throw new Error(`Version ${version1} non trouvée`);
    }

    if (!v2) {
      throw new Error(`Version ${version2} non trouvée`);
    }

    return {
      version1: {
        numero: v1.version,
        date: v1.dateChangement,
        modifications: v1.modifications,
        configuration: v1.configurationSnapshot
      },
      version2: {
        numero: v2.version,
        date: v2.dateChangement,
        modifications: v2.modifications,
        configuration: v2.configurationSnapshot
      },
      differences: {
        dateEcart: Math.abs(v2.dateChangement - v1.dateChangement) / (1000 * 60 * 60 * 24), // jours
        // Ici on pourrait ajouter une comparaison détaillée des configurations
      }
    };

  } catch (error) {
    console.error('Erreur lors de la comparaison des versions:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques de configuration des avions
 * @param {String} compagnie - Filtrer par compagnie (optionnel)
 * @returns {Object} Statistiques
 */
export const obtenirStatistiquesConfigurations = async (compagnie = null) => {
  try {
    const query = {};
    if (compagnie) {
      query.compagnie = compagnie;
    }

    const avions = await Avion.find(query);

    const stats = {
      total: avions.length,
      avecConfiguration: 0,
      sansConfiguration: 0,
      avecVersion: 0,
      sansVersion: 0,
      equipements: {
        wifi: 0,
        divertissement: 0,
        priseElectrique: 0
      },
      revisions: {
        planifiees: 0,
        enRetard: 0
      }
    };

    const maintenant = new Date();

    avions.forEach(avion => {
      // Configuration
      if (avion.version) {
        stats.avecVersion++;
      } else {
        stats.sansVersion++;
      }

      if (avion.configuration && Object.keys(avion.configuration).length > 0) {
        stats.avecConfiguration++;
      } else {
        stats.sansConfiguration++;
      }

      // Équipements
      if (avion.configuration?.equipements?.wifi) stats.equipements.wifi++;
      if (avion.configuration?.equipements?.divertissement) stats.equipements.divertissement++;
      if (avion.configuration?.equipements?.priseElectrique) stats.equipements.priseElectrique++;

      // Révisions
      if (avion.derniereRevision?.prochaineDatePrevue) {
        if (avion.derniereRevision.prochaineDatePrevue >= maintenant) {
          stats.revisions.planifiees++;
        } else {
          stats.revisions.enRetard++;
        }
      }
    });

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};
