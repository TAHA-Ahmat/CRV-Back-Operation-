import ProgrammeVol from '../../models/flights/ProgrammeVol.js';
import VolProgramme from '../../models/flights/VolProgramme.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';
import '../../models/security/Personne.js';

/**
 * SERVICE PROGRAMME VOL (Conteneur)
 *
 * Gère les opérations CRUD sur les programmes de vol.
 * Un programme est un conteneur qui regroupe plusieurs vols (voir volProgramme.service.js).
 *
 * WORKFLOW:
 * 1. creerProgramme() → Créer un programme vide (BROUILLON)
 * 2. [Ajouter des vols via volProgramme.service.js]
 * 3. validerProgramme() → Passer en VALIDE
 * 4. activerProgramme() → Passer en ACTIF
 * 5. suspendreProgramme() → Passer en SUSPENDU (si besoin)
 */

// ══════════════════════════════════════════════════════════════════════════
// CRUD DE BASE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Crée un nouveau programme de vol (conteneur vide)
 * @param {Object} data - { nom, dateDebut, dateFin, edition?, description? }
 * @param {String} userId - ID de l'utilisateur créateur
 * @returns {Object} Programme créé
 */
export const creerProgramme = async (data, userId) => {
  try {
    // Validation des dates
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);

    if (dateFin <= dateDebut) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }

    // Vérifier que le nom n'existe pas déjà
    const existant = await ProgrammeVol.findOne({ nom: data.nom.toUpperCase() });
    if (existant) {
      throw new Error(`Un programme avec le nom "${data.nom}" existe déjà`);
    }

    // Créer le programme
    const programme = new ProgrammeVol({
      nom: data.nom,
      edition: data.edition || null,
      description: data.description || null,
      dateDebut: dateDebut,
      dateFin: dateFin,
      statut: 'BROUILLON',
      actif: false,
      nombreVols: 0,
      compagnies: [],
      createdBy: userId
    });

    await programme.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'CREATE',
      targetModel: 'ProgrammeVol',
      targetId: programme._id,
      changes: {
        nom: programme.nom,
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin
      },
      metadata: {
        description: `Création du programme "${programme.nom}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la création du programme:', error);
    throw error;
  }
};

/**
 * Récupère tous les programmes avec filtres optionnels
 * @param {Object} filtres - { statut?, actif?, nom? }
 * @returns {Array} Liste des programmes
 */
export const obtenirProgrammes = async (filtres = {}) => {
  try {
    const query = {};

    if (filtres.statut) {
      query.statut = filtres.statut.toUpperCase();
    }

    if (filtres.actif !== undefined) {
      query.actif = filtres.actif === 'true' || filtres.actif === true;
    }

    if (filtres.nom) {
      query.nom = { $regex: filtres.nom, $options: 'i' };
    }

    const programmes = await ProgrammeVol.find(query)
      .populate('createdBy', 'nom prenom email')
      .populate('updatedBy', 'nom prenom email')
      .populate('validation.validePar', 'nom prenom email')
      .sort({ createdAt: -1 });

    return programmes;

  } catch (error) {
    console.error('Erreur lors de la récupération des programmes:', error);
    throw error;
  }
};

/**
 * Récupère un programme par son ID
 * @param {String} programmeId - ID du programme
 * @returns {Object} Programme trouvé
 */
export const obtenirProgrammeParId = async (programmeId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId)
      .populate('createdBy', 'nom prenom email')
      .populate('updatedBy', 'nom prenom email')
      .populate('validation.validePar', 'nom prenom email');

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    return programme;

  } catch (error) {
    console.error('Erreur lors de la récupération du programme:', error);
    throw error;
  }
};

/**
 * Met à jour un programme
 * @param {String} programmeId - ID du programme
 * @param {Object} data - Données à mettre à jour
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Programme mis à jour
 */
export const mettreAJourProgramme = async (programmeId, data, userId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Programme toujours modifiable (même actif)

    // Sauvegarder l'ancien état
    const ancienEtat = {
      nom: programme.nom,
      dateDebut: programme.dateDebut,
      dateFin: programme.dateFin,
      edition: programme.edition
    };

    // Champs modifiables
    const champsModifiables = ['nom', 'edition', 'description', 'dateDebut', 'dateFin', 'remarques'];

    champsModifiables.forEach(champ => {
      if (data[champ] !== undefined) {
        if (champ === 'dateDebut' || champ === 'dateFin') {
          programme[champ] = new Date(data[champ]);
        } else {
          programme[champ] = data[champ];
        }
      }
    });

    // Validation des dates si modifiées
    if (programme.dateFin <= programme.dateDebut) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }

    programme.updatedBy = userId;
    await programme.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ProgrammeVol',
      targetId: programme._id,
      changes: { avant: ancienEtat, apres: data },
      metadata: {
        description: `Modification du programme "${programme.nom}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme:', error);
    throw error;
  }
};

/**
 * Supprime un programme et tous ses vols
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Résultat
 */
export const supprimerProgramme = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Programme supprimable même si actif

    const nomProgramme = programme.nom;
    const nombreVols = programme.nombreVols;

    // Supprimer tous les vols du programme
    await VolProgramme.deleteMany({ programme: programmeId });

    // Supprimer le programme
    await ProgrammeVol.findByIdAndDelete(programmeId);

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'DELETE',
      targetModel: 'ProgrammeVol',
      targetId: programmeId,
      changes: {
        nom: nomProgramme,
        volsSupprimes: nombreVols
      },
      metadata: {
        description: `Suppression du programme "${nomProgramme}" et ses ${nombreVols} vols`
      }
    });

    return {
      message: `Programme "${nomProgramme}" supprimé avec succès`,
      volsSupprimes: nombreVols
    };

  } catch (error) {
    console.error('Erreur lors de la suppression du programme:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// WORKFLOW: VALIDATION / ACTIVATION / SUSPENSION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Valide un programme
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur validateur
 * @returns {Object} Programme validé
 */
export const validerProgramme = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    if (programme.validation.valide) {
      throw new Error('Le programme est déjà validé');
    }

    if (programme.statut !== 'BROUILLON') {
      throw new Error('Seul un programme en BROUILLON peut être validé');
    }

    if (programme.nombreVols === 0) {
      throw new Error('Le programme doit contenir au moins un vol pour être validé');
    }

    // Valider
    programme.validation.valide = true;
    programme.validation.validePar = userId;
    programme.validation.dateValidation = new Date();
    programme.statut = 'VALIDE';
    programme.updatedBy = userId;

    await programme.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'VALIDATE',
      targetModel: 'ProgrammeVol',
      targetId: programme._id,
      changes: { statut: 'VALIDE', nombreVols: programme.nombreVols },
      metadata: {
        description: `Validation du programme "${programme.nom}" (${programme.nombreVols} vols)`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la validation du programme:', error);
    throw error;
  }
};

/**
 * Active un programme validé
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Programme activé
 */
export const activerProgramme = async (programmeId, userId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    if (!programme.validation.valide) {
      throw new Error('Le programme doit être validé avant d\'être activé');
    }

    if (programme.actif) {
      throw new Error('Le programme est déjà actif');
    }

    if (programme.dateFin < new Date()) {
      throw new Error('Impossible d\'activer un programme dont la période est terminée');
    }

    // Désactiver les autres programmes actifs (un seul actif à la fois)
    await ProgrammeVol.updateMany(
      { actif: true, _id: { $ne: programmeId } },
      { actif: false, statut: 'SUSPENDU' }
    );

    // Activer
    programme.actif = true;
    programme.statut = 'ACTIF';
    programme.updatedBy = userId;

    await programme.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'ACTIVATE',
      targetModel: 'ProgrammeVol',
      targetId: programme._id,
      changes: { actif: true, statut: 'ACTIF' },
      metadata: {
        description: `Activation du programme "${programme.nom}"`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de l\'activation du programme:', error);
    throw error;
  }
};

/**
 * Suspend un programme actif
 * @param {String} programmeId - ID du programme
 * @param {String} userId - ID de l'utilisateur
 * @param {String} raison - Raison de la suspension (optionnel)
 * @returns {Object} Programme suspendu
 */
export const suspendreProgramme = async (programmeId, userId, raison = null) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
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

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'SUSPEND',
      targetModel: 'ProgrammeVol',
      targetId: programme._id,
      changes: { actif: false, statut: 'SUSPENDU', raison },
      metadata: {
        description: `Suspension du programme "${programme.nom}"${raison ? ': ' + raison : ''}`
      }
    });

    return programme;

  } catch (error) {
    console.error('Erreur lors de la suspension du programme:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// STATISTIQUES ET UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtient le programme actif actuel
 * @returns {Object|null} Programme actif ou null
 */
export const obtenirProgrammeActif = async () => {
  try {
    return await ProgrammeVol.getProgrammeActif();
  } catch (error) {
    console.error('Erreur lors de la récupération du programme actif:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques d'un programme
 * @param {String} programmeId - ID du programme
 * @returns {Object} Statistiques
 */
export const obtenirStatistiques = async (programmeId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);

    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    // Statistiques par catégorie
    const parCategorie = await VolProgramme.getStatistiquesParCategorie(programmeId);

    // Statistiques par jour
    const joursNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const parJour = {};

    for (let i = 0; i < 7; i++) {
      const vols = await VolProgramme.getVolsParJour(programmeId, i);
      parJour[joursNom[i]] = {
        total: vols.length,
        vols: vols.map(v => v.numeroVol)
      };
    }

    return {
      programme: {
        nom: programme.nom,
        statut: programme.statut,
        periode: {
          debut: programme.dateDebut,
          fin: programme.dateFin,
          dureeJours: programme.dureeJours
        }
      },
      totalVols: programme.nombreVols,
      compagnies: programme.compagnies,
      parCategorie: parCategorie.reduce((acc, cat) => {
        acc[cat._id] = cat.count;
        return acc;
      }, {}),
      parJour
    };

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};

/**
 * Obtient un résumé pour affichage
 * @param {String} programmeId - ID du programme
 * @returns {Object} Résumé
 */
export const obtenirResume = async (programmeId) => {
  try {
    const programme = await obtenirProgrammeParId(programmeId);
    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    return {
      programme: {
        id: programme._id,
        nom: programme.nom,
        edition: programme.edition,
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin,
        statut: programme.statut,
        actif: programme.actif,
        nombreVols: programme.nombreVols,
        compagnies: programme.compagnies
      },
      vols: vols.map(v => ({
        id: v._id,
        jours: v.joursTexte,
        numeroVol: v.numeroVol,
        typeAvion: v.typeAvion,
        version: v.version,
        provenance: v.provenance,
        heureArrivee: v.heureArrivee,
        destination: v.destination,
        heureDepart: v.heureDepart,
        observations: v.observations
      }))
    };

  } catch (error) {
    console.error('Erreur lors de l\'obtention du résumé:', error);
    throw error;
  }
};

/**
 * Duplique un programme (pour créer une nouvelle saison basée sur l'ancienne)
 * @param {String} programmeId - ID du programme source
 * @param {Object} data - { nom, dateDebut, dateFin }
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Nouveau programme
 */
export const dupliquerProgramme = async (programmeId, data, userId) => {
  try {
    const source = await ProgrammeVol.findById(programmeId);

    if (!source) {
      throw new Error('Programme source non trouvé');
    }

    // Créer le nouveau programme
    const nouveauProgramme = await creerProgramme({
      nom: data.nom,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      edition: data.edition || 'N°01',
      description: `Dupliqué depuis ${source.nom}`
    }, userId);

    // Copier tous les vols
    const volsSource = await VolProgramme.find({ programme: programmeId });

    for (const vol of volsSource) {
      const nouveauVol = new VolProgramme({
        programme: nouveauProgramme._id,
        joursSemaine: vol.joursSemaine,
        numeroVol: vol.numeroVol,
        codeCompagnie: vol.codeCompagnie,
        typeAvion: vol.typeAvion,
        version: vol.version,
        provenance: vol.provenance,
        heureArrivee: vol.heureArrivee,
        destination: vol.destination,
        heureDepart: vol.heureDepart,
        departLendemain: vol.departLendemain,
        observations: vol.observations,
        categorieVol: vol.categorieVol,
        typeOperation: vol.typeOperation,
        ordre: vol.ordre,
        createdBy: userId
      });
      await nouveauVol.save();
    }

    // Recharger pour avoir les stats à jour
    const programmeComplet = await obtenirProgrammeParId(nouveauProgramme._id);

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'DUPLICATE',
      targetModel: 'ProgrammeVol',
      targetId: programmeComplet._id,
      changes: {
        source: source.nom,
        nouveau: programmeComplet.nom,
        volsCopies: volsSource.length
      },
      metadata: {
        description: `Duplication du programme "${source.nom}" → "${programmeComplet.nom}"`
      }
    });

    return programmeComplet;

  } catch (error) {
    console.error('Erreur lors de la duplication du programme:', error);
    throw error;
  }
};
