import ChargeOperationnelle from '../../models/charges/ChargeOperationnelle.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';

/**
 * EXTENSION 4 - Service Passagers (Catégories détaillées)
 *
 * Service NOUVEAU pour gérer les catégories détaillées de passagers.
 *
 * NON-RÉGRESSION: Ce service est OPTIONNEL et n'affecte AUCUNE logique existante.
 * - Les opérations existantes sur ChargeOperationnelle continuent de fonctionner
 * - Ce service fournit des fonctions ADDITIONNELLES uniquement
 *
 * Ce service est 100% OPTIONNEL et peut être utilisé ou ignoré.
 */

/**
 * Met à jour les catégories détaillées de passagers d'une charge
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} categoriesDetaillees - Catégories détaillées
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const mettreAJourCategoriesDetaillees = async (chargeId, categoriesDetaillees, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Sauvegarder l'ancienne configuration
    const ancienneCat = { ...charge.categoriesPassagersDetaillees };

    // Mettre à jour les catégories détaillées
    if (categoriesDetaillees) {
      charge.categoriesPassagersDetaillees = {
        ...charge.categoriesPassagersDetaillees,
        ...categoriesDetaillees
      };
      charge.utiliseCategoriesDetaillees = true;
    }

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        ancienneCategoriesDetaillees: ancienneCat,
        nouvelleCategoriesDetaillees: charge.categoriesPassagersDetaillees
      },
      metadata: {
        description: `Mise à jour des catégories détaillées de passagers pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la mise à jour des catégories détaillées:', error);
    throw error;
  }
};

/**
 * Met à jour les classes de passagers d'une charge
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} classePassagers - Répartition par classe
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const mettreAJourClassePassagers = async (chargeId, classePassagers, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Mettre à jour les classes
    if (classePassagers) {
      charge.classePassagers = {
        ...charge.classePassagers,
        ...classePassagers
      };
    }

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        classePassagers: charge.classePassagers
      },
      metadata: {
        description: `Mise à jour des classes de passagers pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la mise à jour des classes de passagers:', error);
    throw error;
  }
};

/**
 * Met à jour les besoins médicaux des passagers d'une charge
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} besoinsMedicaux - Besoins médicaux
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const mettreAJourBesoinsMedicaux = async (chargeId, besoinsMedicaux, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Mettre à jour les besoins médicaux
    if (besoinsMedicaux) {
      charge.besoinsMedicaux = {
        ...charge.besoinsMedicaux,
        ...besoinsMedicaux
      };
    }

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        besoinsMedicaux: charge.besoinsMedicaux
      },
      metadata: {
        description: `Mise à jour des besoins médicaux pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la mise à jour des besoins médicaux:', error);
    throw error;
  }
};

/**
 * Met à jour les informations sur les mineurs d'une charge
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} mineurs - Informations mineurs
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const mettreAJourMineurs = async (chargeId, mineurs, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Mettre à jour les mineurs
    if (mineurs) {
      charge.mineurs = {
        ...charge.mineurs,
        ...mineurs
      };
    }

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        mineurs: charge.mineurs
      },
      metadata: {
        description: `Mise à jour des informations sur les mineurs pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la mise à jour des mineurs:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques détaillées des passagers pour un CRV
 * @param {String} crvId - ID du CRV
 * @returns {Object} Statistiques détaillées
 */
export const obtenirStatistiquesPassagersCRV = async (crvId) => {
  try {
    const charges = await ChargeOperationnelle.find({ crv: crvId, typeCharge: 'PASSAGERS' });

    const stats = {
      totalPassagers: 0,
      categoriesBasiques: {
        adultes: 0,
        enfants: 0,
        pmr: 0,
        transit: 0
      },
      categoriesDetaillees: {
        bebes: 0,
        enfants: 0,
        adolescents: 0,
        adultes: 0,
        seniors: 0,
        pmrFauteuilRoulant: 0,
        pmrMarcheAssistee: 0,
        pmrNonVoyant: 0,
        pmrSourd: 0,
        transitLocal: 0,
        transitInternational: 0,
        vip: 0,
        equipage: 0,
        deportes: 0
      },
      classes: {
        premiere: 0,
        affaires: 0,
        economique: 0
      },
      besoinsMedicaux: {
        oxygeneBord: 0,
        brancardier: 0,
        accompagnementMedical: 0
      },
      mineurs: {
        mineurNonAccompagne: 0,
        bebeNonAccompagne: 0
      },
      parSens: {
        embarquement: {
          total: 0,
          detailles: {}
        },
        debarquement: {
          total: 0,
          detailles: {}
        }
      }
    };

    charges.forEach(charge => {
      // Catégories basiques
      stats.categoriesBasiques.adultes += charge.passagersAdultes || 0;
      stats.categoriesBasiques.enfants += charge.passagersEnfants || 0;
      stats.categoriesBasiques.pmr += charge.passagersPMR || 0;
      stats.categoriesBasiques.transit += charge.passagersTransit || 0;

      // Catégories détaillées
      if (charge.utiliseCategoriesDetaillees && charge.categoriesPassagersDetaillees) {
        const cat = charge.categoriesPassagersDetaillees;
        Object.keys(stats.categoriesDetaillees).forEach(key => {
          stats.categoriesDetaillees[key] += cat[key] || 0;
        });
      }

      // Classes
      if (charge.classePassagers) {
        stats.classes.premiere += charge.classePassagers.premiere || 0;
        stats.classes.affaires += charge.classePassagers.affaires || 0;
        stats.classes.economique += charge.classePassagers.economique || 0;
      }

      // Besoins médicaux
      if (charge.besoinsMedicaux) {
        stats.besoinsMedicaux.oxygeneBord += charge.besoinsMedicaux.oxygeneBord || 0;
        stats.besoinsMedicaux.brancardier += charge.besoinsMedicaux.brancardier || 0;
        stats.besoinsMedicaux.accompagnementMedical += charge.besoinsMedicaux.accompagnementMedical || 0;
      }

      // Mineurs
      if (charge.mineurs) {
        stats.mineurs.mineurNonAccompagne += charge.mineurs.mineurNonAccompagne || 0;
        stats.mineurs.bebeNonAccompagne += charge.mineurs.bebeNonAccompagne || 0;
      }

      // Par sens
      const total = charge.utiliseCategoriesDetaillees ?
                    (charge.totalPassagersDetailles || 0) :
                    (charge.totalPassagers || 0);

      if (charge.sensOperation === 'EMBARQUEMENT') {
        stats.parSens.embarquement.total += total;
      } else if (charge.sensOperation === 'DEBARQUEMENT') {
        stats.parSens.debarquement.total += total;
      }
    });

    // Total général
    stats.totalPassagers = stats.parSens.embarquement.total + stats.parSens.debarquement.total;

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques passagers:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques globales des passagers avec catégories détaillées
 * @param {Object} filtres - Filtres optionnels (dateDebut, dateFin, compagnie)
 * @returns {Object} Statistiques globales
 */
export const obtenirStatistiquesGlobalesPassagers = async (filtres = {}) => {
  try {
    const query = { typeCharge: 'PASSAGERS' };

    // Construire la query si des filtres sont fournis
    // Note: Nécessiterait de joindre avec CRV et Vol pour filtrer par date/compagnie
    // Pour simplifier, on retourne les stats de toutes les charges PASSAGERS

    const charges = await ChargeOperationnelle.find(query);

    const stats = {
      totalCharges: charges.length,
      chargesAvecCategoriesDetaillees: 0,
      chargesSansCategoriesDetaillees: 0,
      totalPassagersGlobal: 0,
      repartitionPMR: {
        fauteuilRoulant: 0,
        marcheAssistee: 0,
        nonVoyant: 0,
        sourd: 0
      },
      repartitionClasses: {
        premiere: 0,
        affaires: 0,
        economique: 0
      },
      besoinsMedicauxGlobal: {
        oxygeneBord: 0,
        brancardier: 0,
        accompagnementMedical: 0
      }
    };

    charges.forEach(charge => {
      if (charge.utiliseCategoriesDetaillees) {
        stats.chargesAvecCategoriesDetaillees++;
      } else {
        stats.chargesSansCategoriesDetaillees++;
      }

      const total = charge.utiliseCategoriesDetaillees ?
                    (charge.totalPassagersDetailles || 0) :
                    (charge.totalPassagers || 0);
      stats.totalPassagersGlobal += total;

      // PMR
      if (charge.categoriesPassagersDetaillees) {
        stats.repartitionPMR.fauteuilRoulant += charge.categoriesPassagersDetaillees.pmrFauteuilRoulant || 0;
        stats.repartitionPMR.marcheAssistee += charge.categoriesPassagersDetaillees.pmrMarcheAssistee || 0;
        stats.repartitionPMR.nonVoyant += charge.categoriesPassagersDetaillees.pmrNonVoyant || 0;
        stats.repartitionPMR.sourd += charge.categoriesPassagersDetaillees.pmrSourd || 0;
      }

      // Classes
      if (charge.classePassagers) {
        stats.repartitionClasses.premiere += charge.classePassagers.premiere || 0;
        stats.repartitionClasses.affaires += charge.classePassagers.affaires || 0;
        stats.repartitionClasses.economique += charge.classePassagers.economique || 0;
      }

      // Besoins médicaux
      if (charge.besoinsMedicaux) {
        stats.besoinsMedicauxGlobal.oxygeneBord += charge.besoinsMedicaux.oxygeneBord || 0;
        stats.besoinsMedicauxGlobal.brancardier += charge.besoinsMedicaux.brancardier || 0;
        stats.besoinsMedicauxGlobal.accompagnementMedical += charge.besoinsMedicaux.accompagnementMedical || 0;
      }
    });

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques globales:', error);
    throw error;
  }
};

/**
 * Convertit les catégories basiques en catégories détaillées
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} mapping - Mapping personnalisé (optionnel)
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const convertirVersCategoriesDetaillees = async (chargeId, mapping, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    if (charge.utiliseCategoriesDetaillees) {
      throw new Error('Cette charge utilise déjà les catégories détaillées');
    }

    // Mapping par défaut
    const defaultMapping = {
      passagersAdultes: 'adultes',
      passagersEnfants: 'enfants',
      passagersPMR: 'pmrFauteuilRoulant', // Par défaut, on considère fauteuil roulant
      passagersTransit: 'transitLocal'
    };

    const actualMapping = mapping || defaultMapping;

    // Convertir
    Object.keys(actualMapping).forEach(oldKey => {
      const newKey = actualMapping[oldKey];
      const value = charge[oldKey] || 0;
      if (value > 0) {
        charge.categoriesPassagersDetaillees[newKey] = value;
      }
    });

    charge.utiliseCategoriesDetaillees = true;

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'CONVERT',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        from: 'categories_basiques',
        to: 'categories_detaillees',
        mapping: actualMapping
      },
      metadata: {
        description: `Conversion vers catégories détaillées pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    throw error;
  }
};
