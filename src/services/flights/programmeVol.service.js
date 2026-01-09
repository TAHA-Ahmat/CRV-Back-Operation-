import ProgrammeVolSaisonnier from '../../models/flights/ProgrammeVolSaisonnier.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';

/**
 * EXTENSION 1 - Service Programme vol saisonnier
 *
 * Service NOUVEAU et INDÉPENDANT pour gérer les programmes de vols récurrents.
 *
 * NON-RÉGRESSION: Ce service n'utilise AUCUN service existant et ne modifie AUCUNE logique.
 * - crv.service.js reste inchangé
 * - calcul.service.js reste inchangé
 * - vol.service.js (si existe) reste inchangé
 * - Aucun appel aux services existants
 *
 * Ce service est 100% AUTONOME et OPTIONNEL.
 */

/**
 * Crée un nouveau programme vol saisonnier
 * @param {Object} programmeData - Données du programme
 * @param {String} userId - ID de l'utilisateur créateur
 * @returns {Object} Programme créé
 */
export const creerProgrammeVol = async (programmeData, userId) => {
  try {
    // Validation des dates
    const dateDebut = new Date(programmeData.recurrence.dateDebut);
    const dateFin = new Date(programmeData.recurrence.dateFin);

    if (dateFin <= dateDebut) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }

    // Validation de la fréquence hebdomadaire
    if (programmeData.recurrence.frequence === 'HEBDOMADAIRE') {
      if (!programmeData.recurrence.joursSemaine || programmeData.recurrence.joursSemaine.length === 0) {
        throw new Error('Pour une fréquence hebdomadaire, au moins un jour de la semaine doit être spécifié');
      }
    }

    // Créer le programme
    const programme = new ProgrammeVolSaisonnier({
      ...programmeData,
      createdBy: userId,
      statut: 'BROUILLON',
      actif: false,
      validation: {
        valide: false,
        validePar: null,
        dateValidation: null
      }
    });

    await programme.save();

    // Log de l'activité (traçabilité)
    await UserActivityLog.create({
      user: userId,
      action: 'CREATE',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programme._id,
      changes: {
        nomProgramme: programme.nomProgramme,
        compagnieAerienne: programme.compagnieAerienne,
        numeroVolBase: programme.detailsVol.numeroVolBase
      },
      metadata: {
        description: `Création du programme vol saisonnier "${programme.nomProgramme}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la création du programme vol:', error);
    throw error;
  }
};

/**
 * Récupère tous les programmes vol avec filtres optionnels
 * @param {Object} filtres - Filtres optionnels (compagnie, statut, actif)
 * @returns {Array} Liste des programmes
 */
export const obtenirProgrammesVol = async (filtres = {}) => {
  try {
    const query = {};

    if (filtres.compagnieAerienne) {
      query.compagnieAerienne = filtres.compagnieAerienne.toUpperCase();
    }

    if (filtres.statut) {
      query.statut = filtres.statut;
    }

    if (filtres.actif !== undefined) {
      query.actif = filtres.actif === 'true' || filtres.actif === true;
    }

    // Filtre par période si spécifié
    if (filtres.dateDebut || filtres.dateFin) {
      query['recurrence.dateDebut'] = {};
      query['recurrence.dateFin'] = {};

      if (filtres.dateDebut) {
        query['recurrence.dateDebut'].$gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        query['recurrence.dateFin'].$lte = new Date(filtres.dateFin);
      }
    }

    const programmes = await ProgrammeVolSaisonnier.find(query)
      .populate('createdBy', 'nom prenom email')
      .populate('updatedBy', 'nom prenom email')
      .populate('validation.validePar', 'nom prenom email')
      .sort({ createdAt: -1 });

    return programmes;

  } catch (error) {
    console.error('Erreur lors de la récupération des programmes vol:', error);
    throw error;
  }
};

/**
 * Récupère un programme vol par son ID
 * @param {String} programmeId - ID du programme
 * @returns {Object} Programme trouvé
 */
export const obtenirProgrammeVolParId = async (programmeId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId)
      .populate('createdBy', 'nom prenom email')
      .populate('updatedBy', 'nom prenom email')
      .populate('validation.validePar', 'nom prenom email');

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    return programme;

  } catch (error) {
    console.error('Erreur lors de la récupération du programme vol:', error);
    throw error;
  }
};

/**
 * Met à jour un programme vol saisonnier
 * @param {String} programmeId - ID du programme
 * @param {Object} updateData - Données à mettre à jour
 * @param {String} userId - ID de l'utilisateur modificateur
 * @returns {Object} Programme mis à jour
 */
export const mettreAJourProgrammeVol = async (programmeId, updateData, userId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId);

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    // Empêcher la modification si le programme est validé et actif
    if (programme.validation.valide && programme.actif) {
      throw new Error('Impossible de modifier un programme validé et actif. Suspendez-le d\'abord.');
    }

    // Sauvegarder l'ancien état pour le log
    const ancienEtat = {
      nomProgramme: programme.nomProgramme,
      statut: programme.statut,
      actif: programme.actif
    };

    // Appliquer les modifications
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== 'validation') {
        if (key.includes('.')) {
          // Gestion des nested fields (ex: "recurrence.dateDebut")
          const keys = key.split('.');
          let obj = programme;
          for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = updateData[key];
        } else {
          programme[key] = updateData[key];
        }
      }
    });

    programme.updatedBy = userId;
    await programme.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programme._id,
      changes: {
        avant: ancienEtat,
        apres: {
          nomProgramme: programme.nomProgramme,
          statut: programme.statut,
          actif: programme.actif
        }
      },
      metadata: {
        description: `Modification du programme vol saisonnier "${programme.nomProgramme}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme vol:', error);
    throw error;
  }
};

/**
 * Valide un programme vol saisonnier
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur validateur
 * @returns {Object} Programme validé
 */
export const validerProgrammeVol = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId);

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    if (programme.validation.valide) {
      throw new Error('Le programme est déjà validé');
    }

    // Validation métier
    if (!programme.nomProgramme || !programme.compagnieAerienne) {
      throw new Error('Les informations du programme sont incomplètes');
    }

    if (!programme.recurrence.dateDebut || !programme.recurrence.dateFin) {
      throw new Error('La période de validité doit être définie');
    }

    if (!programme.detailsVol.numeroVolBase) {
      throw new Error('Le numéro de vol de base doit être défini');
    }

    // Valider le programme
    programme.validation.valide = true;
    programme.validation.validePar = userId;
    programme.validation.dateValidation = new Date();
    programme.statut = 'VALIDE';

    await programme.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'VALIDATE',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programme._id,
      changes: {
        valide: true,
        statut: 'VALIDE'
      },
      metadata: {
        description: `Validation du programme vol saisonnier "${programme.nomProgramme}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la validation du programme vol:', error);
    throw error;
  }
};

/**
 * Active un programme vol saisonnier validé
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Programme activé
 */
export const activerProgrammeVol = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId);

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    if (!programme.validation.valide) {
      throw new Error('Le programme doit être validé avant d\'être activé');
    }

    if (programme.actif) {
      throw new Error('Le programme est déjà actif');
    }

    // Vérifier que la période est valide
    const maintenant = new Date();
    if (programme.recurrence.dateFin < maintenant) {
      throw new Error('Impossible d\'activer un programme dont la période est déjà terminée');
    }

    programme.actif = true;
    programme.statut = 'ACTIF';
    programme.updatedBy = userId;

    await programme.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'ACTIVATE',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programme._id,
      changes: {
        actif: true,
        statut: 'ACTIF'
      },
      metadata: {
        description: `Activation du programme vol saisonnier "${programme.nomProgramme}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de l\'activation du programme vol:', error);
    throw error;
  }
};

/**
 * Suspend un programme vol saisonnier actif
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @param {String} raison - Raison de la suspension (optionnel)
 * @returns {Object} Programme suspendu
 */
export const suspendreProgrammeVol = async (programmeId, userId, raison = null) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId);

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    if (!programme.actif) {
      throw new Error('Le programme n\'est pas actif');
    }

    programme.actif = false;
    programme.statut = 'SUSPENDU';
    programme.updatedBy = userId;

    if (raison) {
      programme.remarques = (programme.remarques ? programme.remarques + '\n' : '') +
                            `[SUSPENSION ${new Date().toISOString()}] ${raison}`;
    }

    await programme.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'SUSPEND',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programme._id,
      changes: {
        actif: false,
        statut: 'SUSPENDU',
        raison: raison
      },
      metadata: {
        description: `Suspension du programme vol saisonnier "${programme.nomProgramme}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la suspension du programme vol:', error);
    throw error;
  }
};

/**
 * Trouve les programmes actifs pour une date et compagnie données
 * @param {Date} date - Date à vérifier
 * @param {String} compagnieAerienne - Code compagnie
 * @returns {Array} Programmes applicables
 */
export const trouverProgrammesApplicables = async (date, compagnieAerienne = null) => {
  try {
    const query = {
      actif: true,
      statut: 'ACTIF',
      'recurrence.dateDebut': { $lte: date },
      'recurrence.dateFin': { $gte: date }
    };

    if (compagnieAerienne) {
      query.compagnieAerienne = compagnieAerienne.toUpperCase();
    }

    const programmes = await ProgrammeVolSaisonnier.find(query);

    // Filtrer par jour de la semaine
    const jour = new Date(date).getDay();
    const programmesApplicables = programmes.filter(prog => {
      if (prog.recurrence.frequence === 'QUOTIDIEN') return true;
      if (prog.recurrence.frequence === 'HEBDOMADAIRE') {
        return prog.recurrence.joursSemaine.includes(jour);
      }
      return false;
    });

    return programmesApplicables;

  } catch (error) {
    console.error('Erreur lors de la recherche des programmes applicables:', error);
    throw error;
  }
};

/**
 * Importe plusieurs programmes depuis un tableau de données
 * @param {Array} programmesData - Tableau de données de programmes
 * @param {String} userId - ID de l'utilisateur importateur
 * @returns {Object} Résultat de l'import
 */
export const importerProgrammesVol = async (programmesData, userId) => {
  try {
    const resultats = {
      succes: [],
      erreurs: []
    };

    for (const programmeData of programmesData) {
      try {
        const programme = await creerProgrammeVol(programmeData, userId);
        resultats.succes.push({
          nomProgramme: programme.nomProgramme,
          id: programme._id
        });
      } catch (error) {
        resultats.erreurs.push({
          nomProgramme: programmeData.nomProgramme || 'Inconnu',
          erreur: error.message
        });
      }
    }

    // Log de l'activité d'import
    await UserActivityLog.create({
      user: userId,
      action: 'IMPORT',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: null,
      changes: {
        total: programmesData.length,
        succes: resultats.succes.length,
        erreurs: resultats.erreurs.length
      },
      metadata: {
        description: `Import de ${programmesData.length} programmes vol saisonniers`
      }
    });

    return resultats;

  } catch (error) {
    console.error('Erreur lors de l\'import des programmes vol:', error);
    throw error;
  }
};

/**
 * Supprime un programme vol saisonnier (soft delete possible)
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat de la suppression
 */
export const supprimerProgrammeVol = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVolSaisonnier.findById(programmeId);

    if (!programme) {
      throw new Error('Programme vol saisonnier non trouvé');
    }

    // Empêcher la suppression si le programme est actif
    if (programme.actif) {
      throw new Error('Impossible de supprimer un programme actif. Suspendez-le d\'abord.');
    }

    const nomProgramme = programme.nomProgramme;

    // Suppression définitive
    await ProgrammeVolSaisonnier.findByIdAndDelete(programmeId);

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'DELETE',
      targetModel: 'ProgrammeVolSaisonnier',
      targetId: programmeId,
      changes: {
        nomProgramme: nomProgramme
      },
      metadata: {
        description: `Suppression du programme vol saisonnier "${nomProgramme}"`
      }
    });

    return { message: 'Programme vol saisonnier supprimé avec succès' };

  } catch (error) {
    console.error('Erreur lors de la suppression du programme vol:', error);
    throw error;
  }
};
