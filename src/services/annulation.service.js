import CRV from '../models/CRV.js';
import UserActivityLog from '../models/UserActivityLog.js';

/**
 * EXTENSION 6 - Service Annulation (Statut CRV ANNULE)
 *
 * Service NOUVEAU pour gérer l'annulation de CRV.
 *
 * NON-RÉGRESSION: Ce service est OPTIONNEL et n'affecte AUCUNE logique existante.
 * - Les opérations existantes sur CRV continuent de fonctionner normalement
 * - Ce service fournit des fonctions ADDITIONNELLES uniquement
 * - Le statut ANNULE est ajouté à l'enum (compatible avec les statuts existants)
 *
 * Ce service est 100% OPTIONNEL et peut être utilisé ou ignoré.
 */

/**
 * Annule un CRV
 * @param {String} crvId - ID du CRV à annuler
 * @param {Object} detailsAnnulation - { raisonAnnulation, commentaireAnnulation }
 * @param {String} userId - ID de l'utilisateur qui annule
 * @returns {Object} CRV annulé
 */
export const annulerCRV = async (crvId, detailsAnnulation, userId) => {
  try {
    const crv = await CRV.findById(crvId);
    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    // Vérifier que le CRV n'est pas déjà annulé
    if (crv.statut === 'ANNULE') {
      throw new Error('Ce CRV est déjà annulé');
    }

    // Vérifier que le CRV n'est pas verrouillé (règle métier)
    if (crv.statut === 'VERROUILLE') {
      throw new Error('Impossible d\'annuler un CRV verrouillé. Déverrouillez-le d\'abord.');
    }

    // Sauvegarder l'ancien statut
    const ancienStatut = crv.statut;

    // Mettre à jour le statut et les informations d'annulation
    crv.statut = 'ANNULE';
    crv.annulation = {
      dateAnnulation: new Date(),
      annulePar: userId,
      raisonAnnulation: detailsAnnulation.raisonAnnulation || null,
      commentaireAnnulation: detailsAnnulation.commentaireAnnulation || null,
      ancienStatut: ancienStatut
    };

    await crv.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'CANCEL',
      targetModel: 'CRV',
      targetId: crv._id,
      changes: {
        ancienStatut: ancienStatut,
        nouveauStatut: 'ANNULE',
        raisonAnnulation: detailsAnnulation.raisonAnnulation
      },
      metadata: {
        description: `Annulation du CRV ${crv.numeroCRV}`
      }
    });

    return crv;

  } catch (error) {
    console.error('Erreur lors de l\'annulation du CRV:', error);
    throw error;
  }
};

/**
 * Réactive un CRV annulé (restaure l'ancien statut)
 * @param {String} crvId - ID du CRV à réactiver
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} CRV réactivé
 */
export const reactiverCRV = async (crvId, userId) => {
  try {
    const crv = await CRV.findById(crvId);
    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    // Vérifier que le CRV est bien annulé
    if (crv.statut !== 'ANNULE') {
      throw new Error('Ce CRV n\'est pas annulé');
    }

    // Restaurer l'ancien statut
    const ancienStatutAnnule = crv.annulation?.ancienStatut || 'BROUILLON';
    const ancienneAnnulation = { ...crv.annulation };

    crv.statut = ancienStatutAnnule;
    crv.annulation = {
      dateAnnulation: null,
      annulePar: null,
      raisonAnnulation: null,
      commentaireAnnulation: null,
      ancienStatut: null
    };

    await crv.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'REACTIVATE',
      targetModel: 'CRV',
      targetId: crv._id,
      changes: {
        ancienStatut: 'ANNULE',
        nouveauStatut: ancienStatutAnnule,
        ancienneAnnulation: ancienneAnnulation
      },
      metadata: {
        description: `Réactivation du CRV ${crv.numeroCRV}`
      }
    });

    return crv;

  } catch (error) {
    console.error('Erreur lors de la réactivation du CRV:', error);
    throw error;
  }
};

/**
 * Obtient tous les CRV annulés
 * @param {Object} filtres - Filtres optionnels
 * @returns {Array} CRV annulés
 */
export const obtenirCRVAnnules = async (filtres = {}) => {
  try {
    const query = { statut: 'ANNULE' };

    // Filtre par date d'annulation
    if (filtres.dateDebut || filtres.dateFin) {
      query['annulation.dateAnnulation'] = {};
      if (filtres.dateDebut) {
        query['annulation.dateAnnulation'].$gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        query['annulation.dateAnnulation'].$lte = new Date(filtres.dateFin);
      }
    }

    // Filtre par raison
    if (filtres.raisonAnnulation) {
      query['annulation.raisonAnnulation'] = { $regex: filtres.raisonAnnulation, $options: 'i' };
    }

    const crvs = await CRV.find(query)
      .populate('vol', 'numeroVol dateVol')
      .populate('annulation.annulePar', 'nom prenom')
      .sort({ 'annulation.dateAnnulation': -1 });

    return crvs;

  } catch (error) {
    console.error('Erreur lors de la récupération des CRV annulés:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques des annulations
 * @param {Object} filtres - Filtres optionnels
 * @returns {Object} Statistiques
 */
export const obtenirStatistiquesAnnulations = async (filtres = {}) => {
  try {
    const query = { statut: 'ANNULE' };

    // Filtre par période
    if (filtres.dateDebut || filtres.dateFin) {
      query['annulation.dateAnnulation'] = {};
      if (filtres.dateDebut) {
        query['annulation.dateAnnulation'].$gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        query['annulation.dateAnnulation'].$lte = new Date(filtres.dateFin);
      }
    }

    const crvs = await CRV.find(query);

    const stats = {
      totalAnnulations: crvs.length,
      parRaison: {},
      parAncienStatut: {
        BROUILLON: 0,
        EN_COURS: 0,
        TERMINE: 0,
        VALIDE: 0,
        VERROUILLE: 0
      },
      parMois: {}
    };

    crvs.forEach(crv => {
      // Par raison
      const raison = crv.annulation?.raisonAnnulation || 'Non spécifié';
      stats.parRaison[raison] = (stats.parRaison[raison] || 0) + 1;

      // Par ancien statut
      const ancienStatut = crv.annulation?.ancienStatut;
      if (ancienStatut && stats.parAncienStatut.hasOwnProperty(ancienStatut)) {
        stats.parAncienStatut[ancienStatut]++;
      }

      // Par mois
      if (crv.annulation?.dateAnnulation) {
        const mois = crv.annulation.dateAnnulation.toISOString().substring(0, 7); // YYYY-MM
        stats.parMois[mois] = (stats.parMois[mois] || 0) + 1;
      }
    });

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques d\'annulations:', error);
    throw error;
  }
};

/**
 * Vérifie si un CRV peut être annulé
 * @param {String} crvId - ID du CRV
 * @returns {Object} { peutAnnuler: Boolean, raison: String }
 */
export const verifierPeutAnnuler = async (crvId) => {
  try {
    const crv = await CRV.findById(crvId);
    if (!crv) {
      return { peutAnnuler: false, raison: 'CRV non trouvé' };
    }

    if (crv.statut === 'ANNULE') {
      return { peutAnnuler: false, raison: 'Le CRV est déjà annulé' };
    }

    if (crv.statut === 'VERROUILLE') {
      return { peutAnnuler: false, raison: 'Le CRV est verrouillé. Déverrouillez-le d\'abord.' };
    }

    return { peutAnnuler: true, raison: null };

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    throw error;
  }
};
