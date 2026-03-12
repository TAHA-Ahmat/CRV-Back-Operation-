import Vol from '../../models/flights/Vol.js';
import ProgrammeVolSaisonnier from '../../models/flights/ProgrammeVolSaisonnier.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';

/**
 * EXTENSION 2 - Service Vol (Distinction programmé / hors programme)
 *
 * Service NOUVEAU pour gérer les opérations liées aux vols programmés et hors programme.
 *
 * NON-RÉGRESSION: Ce service est OPTIONNEL et n'affecte AUCUNE logique existante.
 * - Les routes /api/vols existantes continuent de fonctionner sans ce service
 * - Les contrôleurs existants ne sont PAS modifiés
 * - Ce service fournit des fonctions ADDITIONNELLES uniquement
 *
 * Ce service est 100% OPTIONNEL et peut être utilisé ou ignoré.
 */

/**
 * Lie un vol à un programme vol saisonnier
 * @param {String} volId - ID du vol
 * @param {String} programmeVolId - ID du programme vol saisonnier
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol mis à jour
 */
export const lierVolAuProgramme = async (volId, programmeVolId, userId) => {
  try {
    // Vérifier que le vol existe
    const vol = await Vol.findById(volId);
    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Vérifier que le programme existe et est actif
    const programme = await ProgrammeVolSaisonnier.findById(programmeVolId);
    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    if (!programme.actif) {
      throw new Error('Le programme vol saisonnier doit être actif pour lier un vol');
    }

    // Vérifier la cohérence compagnie aérienne
    if (vol.compagnieAerienne.toUpperCase() !== programme.compagnieAerienne.toUpperCase()) {
      throw new Error('La compagnie aérienne du vol ne correspond pas au programme');
    }

    // Vérifier la cohérence type opération
    if (vol.typeOperation !== programme.typeOperation) {
      throw new Error('Le type d\'opération du vol ne correspond pas au programme');
    }

    // Marquer le vol comme programmé (pas hors programme)
    vol.horsProgramme = false;
    vol.programmeVolReference = programmeVolId;
    vol.raisonHorsProgramme = null;
    vol.typeVolHorsProgramme = null;

    await vol.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Vol',
      targetId: vol._id,
      changes: {
        horsProgramme: false,
        programmeVolReference: programmeVolId
      },
      metadata: {
        description: `Vol ${vol.numeroVol} lié au programme "${programme.nomProgramme}"`
      }
    });

    return vol;

  } catch (error) {
    console.error('Erreur lors de la liaison du vol au programme:', error);
    throw error;
  }
};

/**
 * Marque un vol comme hors programme
 * @param {String} volId - ID du vol
 * @param {String} typeVolHorsProgramme - Type de vol hors programme
 * @param {String} raison - Raison du vol hors programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol mis à jour
 */
export const marquerVolHorsProgramme = async (volId, typeVolHorsProgramme, raison, userId) => {
  try {
    // Vérifier que le vol existe
    const vol = await Vol.findById(volId);
    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Validation du type
    const typesValides = ['CHARTER', 'MEDICAL', 'TECHNIQUE', 'COMMERCIAL', 'AUTRE'];
    if (!typesValides.includes(typeVolHorsProgramme)) {
      throw new Error(`Type de vol hors programme invalide. Valeurs acceptées: ${typesValides.join(', ')}`);
    }

    // Marquer le vol comme hors programme
    vol.horsProgramme = true;
    vol.programmeVolReference = null; // Détacher du programme s'il était lié
    vol.typeVolHorsProgramme = typeVolHorsProgramme;
    vol.raisonHorsProgramme = raison || null;

    await vol.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Vol',
      targetId: vol._id,
      changes: {
        horsProgramme: true,
        typeVolHorsProgramme: typeVolHorsProgramme,
        raisonHorsProgramme: raison
      },
      metadata: {
        description: `Vol ${vol.numeroVol} marqué comme hors programme (${typeVolHorsProgramme})`
      }
    });

    return vol;

  } catch (error) {
    console.error('Erreur lors du marquage du vol hors programme:', error);
    throw error;
  }
};

/**
 * Détache un vol d'un programme saisonnier
 * @param {String} volId - ID du vol
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol mis à jour
 */
export const detacherVolDuProgramme = async (volId, userId) => {
  try {
    const vol = await Vol.findById(volId);
    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    if (!vol.programmeVolReference) {
      throw new Error('Le vol n\'est pas lié à un programme');
    }

    const ancienProgrammeId = vol.programmeVolReference;

    // Détacher le vol
    vol.programmeVolReference = null;
    vol.horsProgramme = false; // Remettre à false par défaut

    await vol.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'Vol',
      targetId: vol._id,
      changes: {
        programmeVolReference: null,
        ancienProgramme: ancienProgrammeId
      },
      metadata: {
        description: `Vol ${vol.numeroVol} détaché du programme saisonnier`
      }
    });

    return vol;

  } catch (error) {
    console.error('Erreur lors du détachement du vol du programme:', error);
    throw error;
  }
};

/**
 * Récupère tous les vols liés à un programme saisonnier
 * @param {String} programmeVolId - ID du programme vol saisonnier
 * @returns {Array} Liste des vols liés
 */
export const obtenirVolsDuProgramme = async (programmeVolId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeVolId);
    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    const vols = await Vol.find({
      programmeVolReference: programmeVolId
    })
      .populate('avion')
      .sort({ dateVol: 1 });

    return vols;

  } catch (error) {
    console.error('Erreur lors de la récupération des vols du programme:', error);
    throw error;
  }
};

/**
 * Récupère tous les vols hors programme avec filtres optionnels
 * @param {Object} filtres - Filtres optionnels (typeVolHorsProgramme, compagnieAerienne, dateDebut, dateFin)
 * @returns {Array} Liste des vols hors programme
 */
export const obtenirVolsHorsProgramme = async (filtres = {}) => {
  try {
    const query = {
      horsProgramme: true
    };

    if (filtres.typeVolHorsProgramme) {
      query.typeVolHorsProgramme = filtres.typeVolHorsProgramme;
    }

    if (filtres.compagnieAerienne) {
      query.compagnieAerienne = filtres.compagnieAerienne.toUpperCase();
    }

    // Filtre par période si spécifié
    if (filtres.dateDebut || filtres.dateFin) {
      query.dateVol = {};
      if (filtres.dateDebut) {
        query.dateVol.$gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        query.dateVol.$lte = new Date(filtres.dateFin);
      }
    }

    const vols = await Vol.find(query)
      .populate('avion')
      .sort({ dateVol: -1 });

    return vols;

  } catch (error) {
    console.error('Erreur lors de la récupération des vols hors programme:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques des vols programmés vs hors programme
 * @param {Object} filtres - Filtres optionnels (compagnieAerienne, dateDebut, dateFin)
 * @returns {Object} Statistiques
 */
export const obtenirStatistiquesVolsProgrammes = async (filtres = {}) => {
  try {
    const query = {};

    if (filtres.compagnieAerienne) {
      query.compagnieAerienne = filtres.compagnieAerienne.toUpperCase();
    }

    if (filtres.dateDebut || filtres.dateFin) {
      query.dateVol = {};
      if (filtres.dateDebut) {
        query.dateVol.$gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        query.dateVol.$lte = new Date(filtres.dateFin);
      }
    }

    // Compter les vols programmés
    const volsProgrammes = await Vol.countDocuments({
      ...query,
      horsProgramme: false,
      programmeVolReference: { $ne: null }
    });

    // Compter les vols hors programme
    const volsHorsProgramme = await Vol.countDocuments({
      ...query,
      horsProgramme: true
    });

    // Compter les vols non classifiés (ni programmés, ni hors programme)
    const volsNonClassifies = await Vol.countDocuments({
      ...query,
      horsProgramme: false,
      programmeVolReference: null
    });

    // Statistiques par type de vol hors programme
    const statsParType = await Vol.aggregate([
      { $match: { ...query, horsProgramme: true } },
      {
        $group: {
          _id: '$typeVolHorsProgramme',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = volsProgrammes + volsHorsProgramme + volsNonClassifies;

    return {
      total: total,
      volsProgrammes: {
        count: volsProgrammes,
        pourcentage: total > 0 ? ((volsProgrammes / total) * 100).toFixed(2) : 0
      },
      volsHorsProgramme: {
        count: volsHorsProgramme,
        pourcentage: total > 0 ? ((volsHorsProgramme / total) * 100).toFixed(2) : 0,
        parType: statsParType.reduce((acc, item) => {
          acc[item._id || 'NON_SPECIFIE'] = item.count;
          return acc;
        }, {})
      },
      volsNonClassifies: {
        count: volsNonClassifies,
        pourcentage: total > 0 ? ((volsNonClassifies / total) * 100).toFixed(2) : 0
      }
    };

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};

/**
 * Suggère un programme saisonnier pour un vol donné
 * @param {String} volId - ID du vol
 * @returns {Array} Liste des programmes compatibles
 */
export const suggererProgrammesPourVol = async (volId) => {
  try {
    const vol = await Vol.findById(volId);
    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Si le vol est déjà lié à un programme, ne pas suggérer
    if (vol.programmeVolReference) {
      return [];
    }

    // Chercher les programmes compatibles
    const programmesCompatibles = await ProgrammeVolSaisonnier.find({
      actif: true,
      statut: 'ACTIF',
      compagnieAerienne: vol.compagnieAerienne.toUpperCase(),
      typeOperation: vol.typeOperation,
      'recurrence.dateDebut': { $lte: vol.dateVol },
      'recurrence.dateFin': { $gte: vol.dateVol }
    });

    // Filtrer par jour de la semaine
    const jour = new Date(vol.dateVol).getDay();
    const suggestions = programmesCompatibles.filter(prog => {
      if (prog.recurrence.frequence === 'QUOTIDIEN') return true;
      if (prog.recurrence.frequence === 'HEBDOMADAIRE') {
        return prog.recurrence.joursSemaine.includes(jour);
      }
      return false;
    });

    return suggestions;

  } catch (error) {
    console.error('Erreur lors de la suggestion de programmes:', error);
    throw error;
  }
};
