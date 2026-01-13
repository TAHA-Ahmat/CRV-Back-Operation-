import VolProgramme from '../../models/flights/VolProgramme.js';
import ProgrammeVol from '../../models/flights/ProgrammeVol.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';
import '../../models/security/Personne.js';

/**
 * SERVICE VOL PROGRAMME (Vols d'un programme)
 *
 * Gère les opérations CRUD sur les vols d'un programme.
 * Chaque vol est lié à un programme parent (ProgrammeVol).
 *
 * USAGE:
 * 1. Ouvrir un programme existant
 * 2. ajouterVol() → Ajouter un vol au programme
 * 3. modifierVol() → Modifier un vol existant
 * 4. supprimerVol() → Supprimer un vol
 */

// ══════════════════════════════════════════════════════════════════════════
// CRUD DE BASE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Ajoute un vol à un programme
 * @param {String} programmeId - ID du programme parent
 * @param {Object} data - Données du vol
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol créé
 */
export const ajouterVol = async (programmeId, data, userId) => {
  try {
    // Vérifier que le programme existe
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Programme toujours modifiable (même actif)

    // Validation des jours de la semaine
    if (!data.joursSemaine || data.joursSemaine.length === 0) {
      throw new Error('Au moins un jour de la semaine est requis');
    }

    // Validation du numéro de vol
    if (!data.numeroVol) {
      throw new Error('Le numéro de vol est requis');
    }

    // Déterminer l'ordre (dernier + 1)
    const dernierVol = await VolProgramme.findOne({ programme: programmeId })
      .sort({ ordre: -1 });
    const ordre = dernierVol ? dernierVol.ordre + 1 : 1;

    // Créer le vol
    const vol = new VolProgramme({
      programme: programmeId,
      joursSemaine: data.joursSemaine,
      numeroVol: data.numeroVol,
      codeCompagnie: data.codeCompagnie || null, // Auto-déduit dans pre-save
      typeAvion: data.typeAvion || null,
      version: data.version || 'TBN',
      provenance: data.provenance || null,
      heureArrivee: data.heureArrivee || null,
      destination: data.destination || null,
      heureDepart: data.heureDepart || null,
      departLendemain: data.departLendemain || false,
      observations: data.observations || null,
      categorieVol: data.categorieVol || 'INTERNATIONAL',
      typeOperation: data.typeOperation || 'TURN_AROUND',
      periodeSpecifique: data.periodeSpecifique || { dateDebut: null, dateFin: null },
      ordre: ordre,
      createdBy: userId
    });

    await vol.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'CREATE',
      targetModel: 'VolProgramme',
      targetId: vol._id,
      changes: {
        programme: programme.nom,
        numeroVol: vol.numeroVol,
        jours: vol.joursTexte
      },
      metadata: {
        description: `Ajout du vol ${vol.numeroVol} au programme "${programme.nom}"`
      }
    });

    return vol;

  } catch (error) {
    console.error('Erreur lors de l\'ajout du vol:', error);
    throw error;
  }
};

/**
 * Récupère tous les vols d'un programme
 * @param {String} programmeId - ID du programme
 * @returns {Array} Liste des vols
 */
export const obtenirVolsDuProgramme = async (programmeId) => {
  try {
    // Vérifier que le programme existe
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    return vols;

  } catch (error) {
    console.error('Erreur lors de la récupération des vols:', error);
    throw error;
  }
};

/**
 * Récupère un vol par son ID (en vérifiant qu'il appartient au programme)
 * @param {String} programmeId - ID du programme
 * @param {String} volId - ID du vol
 * @returns {Object} Vol trouvé
 */
export const obtenirVolParId = async (programmeId, volId) => {
  try {
    // Vérifier que le programme existe
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    const vol = await VolProgramme.findById(volId)
      .populate('programme', 'nom dateDebut dateFin statut')
      .populate('createdBy', 'nom prenom email')
      .populate('updatedBy', 'nom prenom email');

    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Vérifier que le vol appartient au programme
    if (vol.programme._id.toString() !== programmeId) {
      throw new Error('Ce vol n\'appartient pas au programme spécifié');
    }

    return vol;

  } catch (error) {
    console.error('Erreur lors de la récupération du vol:', error);
    throw error;
  }
};

/**
 * Met à jour un vol
 * @param {String} programmeId - ID du programme
 * @param {String} volId - ID du vol
 * @param {Object} data - Données à mettre à jour
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol mis à jour
 */
export const modifierVol = async (programmeId, volId, data, userId) => {
  try {
    const vol = await VolProgramme.findById(volId).populate('programme');

    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Vérifier que le vol appartient au programme
    if (vol.programme._id.toString() !== programmeId) {
      throw new Error('Ce vol n\'appartient pas au programme spécifié');
    }

    // Programme toujours modifiable (même actif)

    // Sauvegarder l'ancien état
    const ancienEtat = {
      numeroVol: vol.numeroVol,
      joursSemaine: vol.joursSemaine,
      heureArrivee: vol.heureArrivee,
      heureDepart: vol.heureDepart
    };

    // Champs modifiables
    const champsModifiables = [
      'joursSemaine', 'numeroVol', 'codeCompagnie', 'typeAvion', 'version',
      'provenance', 'heureArrivee', 'destination', 'heureDepart', 'departLendemain',
      'observations', 'categorieVol', 'typeOperation', 'periodeSpecifique', 'ordre'
    ];

    champsModifiables.forEach(champ => {
      if (data[champ] !== undefined) {
        vol[champ] = data[champ];
      }
    });

    vol.updatedBy = userId;
    await vol.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'VolProgramme',
      targetId: vol._id,
      changes: { avant: ancienEtat, apres: data },
      metadata: {
        description: `Modification du vol ${vol.numeroVol}`
      }
    });

    return vol;

  } catch (error) {
    console.error('Erreur lors de la modification du vol:', error);
    throw error;
  }
};

/**
 * Supprime un vol
 * @param {String} programmeId - ID du programme
 * @param {String} volId - ID du vol
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat
 */
export const supprimerVol = async (programmeId, volId, userId) => {
  try {
    const vol = await VolProgramme.findById(volId).populate('programme');

    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    // Vérifier que le vol appartient au programme
    if (vol.programme._id.toString() !== programmeId) {
      throw new Error('Ce vol n\'appartient pas au programme spécifié');
    }

    // Programme toujours modifiable (même actif)

    const numeroVol = vol.numeroVol;
    const programmeNom = vol.programme.nom;
    const progId = vol.programme._id;

    // Supprimer le vol
    await VolProgramme.findByIdAndDelete(volId);

    // Mettre à jour les stats du programme
    const nombreVols = await VolProgramme.countDocuments({ programme: progId });
    const compagnies = await VolProgramme.getCompagnies(progId);
    await ProgrammeVol.findByIdAndUpdate(progId, {
      nombreVols: nombreVols,
      compagnies: compagnies
    });

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'DELETE',
      targetModel: 'VolProgramme',
      targetId: volId,
      changes: {
        numeroVol: numeroVol,
        programme: programmeNom
      },
      metadata: {
        description: `Suppression du vol ${numeroVol} du programme "${programmeNom}"`
      }
    });

    return {
      message: `Vol ${numeroVol} supprimé avec succès`
    };

  } catch (error) {
    console.error('Erreur lors de la suppression du vol:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// RECHERCHE ET FILTRAGE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Récupère les vols d'un programme pour un jour donné
 * @param {String} programmeId - ID du programme
 * @param {Number} jour - Jour de la semaine (0-6)
 * @returns {Array} Vols du jour
 */
export const obtenirVolsParJour = async (programmeId, jour) => {
  try {
    return await VolProgramme.getVolsParJour(programmeId, jour);
  } catch (error) {
    console.error('Erreur lors de la récupération des vols par jour:', error);
    throw error;
  }
};

/**
 * Recherche des vols par numéro
 * @param {String} programmeId - ID du programme
 * @param {String} numeroVol - Numéro de vol (partiel)
 * @returns {Array} Vols correspondants
 */
export const rechercherParNumero = async (programmeId, numeroVol) => {
  try {
    return await VolProgramme.find({
      programme: programmeId,
      numeroVol: { $regex: numeroVol.toUpperCase(), $options: 'i' }
    }).sort({ ordre: 1 });
  } catch (error) {
    console.error('Erreur lors de la recherche par numéro:', error);
    throw error;
  }
};

/**
 * Recherche des vols par compagnie
 * @param {String} programmeId - ID du programme
 * @param {String} codeCompagnie - Code compagnie
 * @returns {Array} Vols de la compagnie
 */
export const obtenirVolsParCompagnie = async (programmeId, codeCompagnie) => {
  try {
    return await VolProgramme.find({
      programme: programmeId,
      codeCompagnie: codeCompagnie.toUpperCase()
    }).sort({ ordre: 1 });
  } catch (error) {
    console.error('Erreur lors de la récupération des vols par compagnie:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// RÉORGANISATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Change l'ordre d'un vol
 * @param {String} volId - ID du vol
 * @param {Number} nouvelOrdre - Nouvelle position
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Vol mis à jour
 */
export const changerOrdre = async (volId, nouvelOrdre, userId) => {
  try {
    const vol = await VolProgramme.findById(volId);

    if (!vol) {
      throw new Error('Vol non trouvé');
    }

    const ancienOrdre = vol.ordre;
    vol.ordre = nouvelOrdre;
    vol.updatedBy = userId;

    await vol.save();

    // Réorganiser les autres vols si nécessaire
    if (ancienOrdre < nouvelOrdre) {
      // Vol déplacé vers le bas
      await VolProgramme.updateMany(
        {
          programme: vol.programme,
          ordre: { $gt: ancienOrdre, $lte: nouvelOrdre },
          _id: { $ne: volId }
        },
        { $inc: { ordre: -1 } }
      );
    } else if (ancienOrdre > nouvelOrdre) {
      // Vol déplacé vers le haut
      await VolProgramme.updateMany(
        {
          programme: vol.programme,
          ordre: { $gte: nouvelOrdre, $lt: ancienOrdre },
          _id: { $ne: volId }
        },
        { $inc: { ordre: 1 } }
      );
    }

    return vol;

  } catch (error) {
    console.error('Erreur lors du changement d\'ordre:', error);
    throw error;
  }
};

/**
 * Réorganise les vols d'un programme
 * @param {String} programmeId - ID du programme
 * @param {Array} ordres - Liste des { volId, ordre }
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat
 */
export const reorganiserVols = async (programmeId, ordres, userId) => {
  try {
    // Vérifier que le programme existe
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Programme toujours modifiable (même actif)

    let modifies = 0;

    for (const item of ordres) {
      const vol = await VolProgramme.findById(item.volId);
      if (vol && vol.programme.toString() === programmeId) {
        vol.ordre = item.ordre;
        vol.updatedBy = userId;
        await vol.save();
        modifies++;
      }
    }

    return { modifies, message: `${modifies} vol(s) réorganisé(s)` };

  } catch (error) {
    console.error('Erreur lors de la réorganisation des vols:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// IMPORT EN MASSE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Importe plusieurs vols dans un programme
 * @param {String} programmeId - ID du programme
 * @param {Array} volsData - Tableau de données de vols
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat de l'import
 */
export const importerVols = async (programmeId, volsData, userId) => {
  try {
    // Vérifier que le programme existe et est modifiable
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Programme toujours modifiable (même actif)

    const resultats = {
      succes: [],
      erreurs: []
    };

    // Déterminer l'ordre de départ
    const dernierVol = await VolProgramme.findOne({ programme: programmeId })
      .sort({ ordre: -1 });
    let ordre = dernierVol ? dernierVol.ordre + 1 : 1;

    for (const data of volsData) {
      try {
        const vol = new VolProgramme({
          programme: programmeId,
          joursSemaine: data.joursSemaine,
          numeroVol: data.numeroVol,
          codeCompagnie: data.codeCompagnie || null,
          typeAvion: data.typeAvion || null,
          version: data.version || 'TBN',
          provenance: data.provenance || null,
          heureArrivee: data.heureArrivee || null,
          destination: data.destination || null,
          heureDepart: data.heureDepart || null,
          departLendemain: data.departLendemain || false,
          observations: data.observations || null,
          categorieVol: data.categorieVol || 'INTERNATIONAL',
          ordre: ordre++,
          createdBy: userId
        });

        await vol.save();
        resultats.succes.push({ numeroVol: vol.numeroVol, id: vol._id });

      } catch (err) {
        resultats.erreurs.push({
          numeroVol: data.numeroVol || 'Inconnu',
          erreur: err.message
        });
      }
    }

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'IMPORT',
      targetModel: 'VolProgramme',
      targetId: programmeId,
      changes: {
        total: volsData.length,
        succes: resultats.succes.length,
        erreurs: resultats.erreurs.length
      },
      metadata: {
        description: `Import de ${volsData.length} vols dans "${programme.nom}"`
      }
    });

    return {
      volsCrees: resultats.succes.length,
      volsErreurs: resultats.erreurs.length,
      succes: resultats.succes,
      erreurs: resultats.erreurs
    };

  } catch (error) {
    console.error('Erreur lors de l\'import des vols:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION PDF
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtient les données formatées pour générer le PDF
 * @param {String} programmeId - ID du programme
 * @returns {Object} Données pour PDF
 */
export const obtenirDonneesPDF = async (programmeId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    // Grouper par jour
    const joursNom = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const parJour = {};

    joursNom.forEach((nom, index) => {
      parJour[nom] = vols
        .filter(v => v.joursSemaine.includes(index))
        .map(v => v.toLignePDF());
    });

    return {
      programme: {
        nom: programme.nom,
        edition: programme.edition,
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin
      },
      parJour,
      totalVols: programme.nombreVols,
      compagnies: programme.compagnies
    };

  } catch (error) {
    console.error('Erreur lors de la génération des données PDF:', error);
    throw error;
  }
};
