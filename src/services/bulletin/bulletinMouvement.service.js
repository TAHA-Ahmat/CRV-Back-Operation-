import BulletinMouvement from '../../models/bulletin/BulletinMouvement.js';
import ProgrammeVol from '../../models/flights/ProgrammeVol.js';
import VolProgramme from '../../models/flights/VolProgramme.js';
import Vol from '../../models/flights/Vol.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';
import '../../models/security/Personne.js';

/**
 * SERVICE BULLETIN DE MOUVEMENT
 *
 * Gere les operations sur les bulletins de mouvement (3-4 jours).
 *
 * HIERARCHIE METIER:
 * Programme (6 mois) → Bulletin (3-4 jours) → CRV (reel)
 *
 * REGLES METIER:
 * - Le bulletin annonce, informe et organise l'exploitation
 * - N'est PAS une preuve (seul le CRV fait foi)
 * - Peut s'ecarter du programme (ajustements, imprevus)
 * - Pas de snapshot programme (archivage Drive = historique)
 * - En cas de contradiction: CRV > Bulletin > Programme
 */

// ══════════════════════════════════════════════════════════════════════════
// CREATION DE BULLETIN
// ══════════════════════════════════════════════════════════════════════════

/**
 * Cree un nouveau bulletin de mouvement
 * @param {Object} data - Donnees du bulletin
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin cree
 */
export const creerBulletin = async (data, userId) => {
  try {
    // Generer le numero de bulletin si non fourni
    const numeroBulletin = data.numeroBulletin ||
      BulletinMouvement.genererNumeroBulletin(data.escale, data.dateDebut);

    // Verifier unicite
    const existe = await BulletinMouvement.findOne({ numeroBulletin });
    if (existe) {
      throw new Error(`Un bulletin avec le numero ${numeroBulletin} existe deja`);
    }

    // Calculer semaine et annee
    const semaine = BulletinMouvement.getNumeroSemaine(new Date(data.dateDebut));
    const annee = new Date(data.dateDebut).getFullYear();

    // Creer le bulletin
    const bulletin = new BulletinMouvement({
      numeroBulletin,
      escale: data.escale,
      titre: data.titre || `Bulletin S${semaine} - ${data.escale}`,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      semaine,
      annee,
      programmeVolSource: data.programmeVolSource || null,
      remarques: data.remarques || null,
      creePar: userId,
      mouvements: []
    });

    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'CREATE',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        numeroBulletin,
        escale: data.escale,
        periode: `${data.dateDebut} - ${data.dateFin}`
      },
      metadata: {
        description: `Creation du bulletin ${numeroBulletin}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la creation du bulletin:', error);
    throw error;
  }
};

/**
 * Cree un bulletin et le pre-remplit depuis un programme
 * @param {Object} data - Donnees (escale, dateDebut, dateFin, programmeId)
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin avec mouvements
 */
export const creerBulletinDepuisProgramme = async (data, userId) => {
  try {
    // Verifier que le programme existe
    const programme = await ProgrammeVol.findById(data.programmeId);
    if (!programme) {
      throw new Error('Programme non trouve');
    }

    // Creer le bulletin vide
    const bulletin = await creerBulletin({
      escale: data.escale,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      programmeVolSource: programme._id,
      titre: data.titre || `Bulletin S${BulletinMouvement.getNumeroSemaine(new Date(data.dateDebut))} - ${data.escale}`,
      remarques: data.remarques
    }, userId);

    // Recuperer les vols du programme
    const volsProgramme = await VolProgramme.getVolsParProgramme(programme._id);

    // Generer les mouvements pour chaque jour de la periode
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);
    let ordre = 0;

    for (let date = new Date(dateDebut); date <= dateFin; date.setDate(date.getDate() + 1)) {
      const jourSemaine = date.getDay(); // 0 = Dimanche
      const dateJour = new Date(date);

      // Filtrer les vols qui operent ce jour
      const volsDuJour = volsProgramme.filter(v => v.joursSemaine.includes(jourSemaine));

      for (const volProg of volsDuJour) {
        // Convertir heures HH:MM en Date complete
        let heureArriveePrevue = null;
        let heureDepartPrevue = null;

        if (volProg.heureArrivee) {
          const [h, m] = volProg.heureArrivee.split(':');
          heureArriveePrevue = new Date(dateJour);
          heureArriveePrevue.setHours(parseInt(h), parseInt(m), 0, 0);
        }

        if (volProg.heureDepart) {
          const [h, m] = volProg.heureDepart.split(':');
          heureDepartPrevue = new Date(dateJour);
          heureDepartPrevue.setHours(parseInt(h), parseInt(m), 0, 0);

          // Gestion depart lendemain
          if (volProg.departLendemain) {
            heureDepartPrevue.setDate(heureDepartPrevue.getDate() + 1);
          }
        }

        // Determiner type d'operation
        let typeOperation = null;
        if (heureArriveePrevue && heureDepartPrevue) {
          typeOperation = 'TURN_AROUND';
        } else if (heureArriveePrevue) {
          typeOperation = 'ARRIVEE';
        } else if (heureDepartPrevue) {
          typeOperation = 'DEPART';
        }

        // Creer le mouvement
        bulletin.mouvements.push({
          vol: null, // Sera cree plus tard si necessaire
          numeroVol: volProg.numeroVol,
          codeCompagnie: volProg.codeCompagnie,
          dateMouvement: dateJour,
          heureArriveePrevue,
          heureDepartPrevue,
          provenance: volProg.provenance,
          destination: volProg.destination,
          typeAvion: volProg.typeAvion,
          typeOperation,
          origine: 'PROGRAMME',
          programmeVolReference: programme._id,
          volProgrammeReference: volProg._id,
          statutMouvement: 'PREVU',
          remarques: volProg.observations,
          ordre: ordre++
        });
      }
    }

    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'GENERATE',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        programme: programme.nom,
        mouvementsGeneres: bulletin.mouvements.length
      },
      metadata: {
        description: `Generation de ${bulletin.mouvements.length} mouvements depuis "${programme.nom}"`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la creation du bulletin depuis programme:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// LECTURE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Recupere un bulletin par son ID
 * @param {String} bulletinId - ID du bulletin
 * @returns {Object} Bulletin
 */
export const obtenirBulletinParId = async (bulletinId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId)
      .populate('programmeVolSource', 'nom dateDebut dateFin statut')
      .populate('creePar', 'nom prenom email')
      .populate('modifiePar', 'nom prenom email')
      .populate('publiePar', 'nom prenom email')
      .populate('archivage.archivedBy', 'nom prenom email');

    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la recuperation du bulletin:', error);
    throw error;
  }
};

/**
 * Recupere le bulletin en cours pour une escale
 * @param {String} escale - Code IATA escale
 * @returns {Object} Bulletin en cours
 */
export const obtenirBulletinEnCours = async (escale) => {
  try {
    const bulletin = await BulletinMouvement.getBulletinEnCours(escale);
    return bulletin;
  } catch (error) {
    console.error('Erreur lors de la recuperation du bulletin en cours:', error);
    throw error;
  }
};

/**
 * Liste les bulletins avec filtres
 * @param {Object} filtres - Criteres de filtre
 * @param {Object} options - Options (pagination, tri)
 * @returns {Object} Resultats pagines
 */
export const listerBulletins = async (filtres = {}, options = {}) => {
  try {
    const query = {};

    // Filtres
    if (filtres.escale) {
      query.escale = filtres.escale.toUpperCase();
    }
    if (filtres.statut) {
      query.statut = filtres.statut;
    }
    if (filtres.annee) {
      query.annee = filtres.annee;
    }
    if (filtres.semaine) {
      query.semaine = filtres.semaine;
    }
    if (filtres.dateDebut) {
      query.dateDebut = { $gte: new Date(filtres.dateDebut) };
    }
    if (filtres.dateFin) {
      query.dateFin = { $lte: new Date(filtres.dateFin) };
    }
    if (filtres.programmeVolSource) {
      query.programmeVolSource = filtres.programmeVolSource;
    }

    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Tri
    const sort = options.sort || { dateDebut: -1 };

    // Execution
    const [bulletins, total] = await Promise.all([
      BulletinMouvement.find(query)
        .populate('programmeVolSource', 'nom')
        .populate('creePar', 'nom prenom')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BulletinMouvement.countDocuments(query)
    ]);

    return {
      bulletins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Erreur lors de la liste des bulletins:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// GESTION DES MOUVEMENTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Ajoute un mouvement au bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {Object} mouvementData - Donnees du mouvement
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin mis a jour
 */
export const ajouterMouvement = async (bulletinId, mouvementData, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    if (!bulletin.peutEtreModifie()) {
      throw new Error('Bulletin non modifiable (deja publie ou archive)');
    }

    // Ajouter le mouvement via la methode du modele
    const mouvement = bulletin.ajouterMouvement(mouvementData);

    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'ADD_MOUVEMENT',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        numeroVol: mouvementData.numeroVol,
        origine: mouvementData.origine || 'PROGRAMME'
      },
      metadata: {
        description: `Ajout du mouvement ${mouvementData.numeroVol} au bulletin ${bulletin.numeroBulletin}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de l\'ajout du mouvement:', error);
    throw error;
  }
};

/**
 * Ajoute un vol hors programme au bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {Object} volData - Donnees du vol hors programme
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin mis a jour
 */
export const ajouterVolHorsProgramme = async (bulletinId, volData, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    if (!bulletin.peutEtreModifie()) {
      throw new Error('Bulletin non modifiable');
    }

    // Forcer les champs hors programme
    const mouvement = {
      ...volData,
      origine: 'HORS_PROGRAMME',
      typeHorsProgramme: volData.typeHorsProgramme || 'AUTRE',
      raisonHorsProgramme: volData.raisonHorsProgramme || 'Vol hors programme',
      programmeVolReference: null,
      volProgrammeReference: null,
      statutMouvement: 'PREVU'
    };

    bulletin.ajouterMouvement(mouvement);
    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'ADD_VOL_HORS_PROGRAMME',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        numeroVol: volData.numeroVol,
        typeHorsProgramme: mouvement.typeHorsProgramme,
        raison: mouvement.raisonHorsProgramme
      },
      metadata: {
        description: `Ajout vol HORS PROGRAMME ${volData.numeroVol} - ${mouvement.typeHorsProgramme}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de l\'ajout du vol hors programme:', error);
    throw error;
  }
};

/**
 * Modifie un mouvement du bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {String} mouvementId - ID du mouvement
 * @param {Object} mouvementData - Nouvelles donnees
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin mis a jour
 */
export const modifierMouvement = async (bulletinId, mouvementId, mouvementData, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    if (!bulletin.peutEtreModifie()) {
      throw new Error('Bulletin non modifiable');
    }

    // Trouver le mouvement
    const mouvement = bulletin.mouvements.id(mouvementId);
    if (!mouvement) {
      throw new Error('Mouvement non trouve');
    }

    // Sauvegarder ancien etat
    const ancienEtat = { ...mouvement.toObject() };

    // Mettre a jour
    const champsModifiables = [
      'numeroVol', 'codeCompagnie', 'dateMouvement',
      'heureArriveePrevue', 'heureDepartPrevue',
      'provenance', 'destination', 'typeAvion',
      'statutMouvement', 'remarques', 'ordre'
    ];

    champsModifiables.forEach(champ => {
      if (mouvementData[champ] !== undefined) {
        mouvement[champ] = mouvementData[champ];
      }
    });

    // Re-deduire le type d'operation si heures changees
    if (mouvementData.heureArriveePrevue !== undefined || mouvementData.heureDepartPrevue !== undefined) {
      if (mouvement.heureArriveePrevue && mouvement.heureDepartPrevue) {
        mouvement.typeOperation = 'TURN_AROUND';
      } else if (mouvement.heureArriveePrevue) {
        mouvement.typeOperation = 'ARRIVEE';
      } else if (mouvement.heureDepartPrevue) {
        mouvement.typeOperation = 'DEPART';
      }
    }

    // Marquer comme ajustement si provient du programme
    if (mouvement.origine === 'PROGRAMME') {
      mouvement.origine = 'AJUSTEMENT';
    }

    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE_MOUVEMENT',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        mouvementId,
        avant: ancienEtat,
        apres: mouvementData
      },
      metadata: {
        description: `Modification mouvement ${mouvement.numeroVol}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la modification du mouvement:', error);
    throw error;
  }
};

/**
 * Supprime un mouvement du bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {String} mouvementId - ID du mouvement
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin mis a jour
 */
export const supprimerMouvement = async (bulletinId, mouvementId, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    if (!bulletin.peutEtreModifie()) {
      throw new Error('Bulletin non modifiable');
    }

    const mouvement = bulletin.mouvements.id(mouvementId);
    if (!mouvement) {
      throw new Error('Mouvement non trouve');
    }

    const numeroVol = mouvement.numeroVol;

    bulletin.supprimerMouvement(mouvementId);
    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'DELETE_MOUVEMENT',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: { mouvementId, numeroVol },
      metadata: {
        description: `Suppression mouvement ${numeroVol}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la suppression du mouvement:', error);
    throw error;
  }
};

/**
 * Annule un mouvement (sans le supprimer)
 * @param {String} bulletinId - ID du bulletin
 * @param {String} mouvementId - ID du mouvement
 * @param {String} raison - Raison de l'annulation
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin mis a jour
 */
export const annulerMouvement = async (bulletinId, mouvementId, raison, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    // Autoriser l'annulation meme sur bulletin publie
    const mouvement = bulletin.mouvements.id(mouvementId);
    if (!mouvement) {
      throw new Error('Mouvement non trouve');
    }

    mouvement.statutMouvement = 'ANNULE';
    mouvement.remarques = (mouvement.remarques || '') + ` | ANNULE: ${raison}`;

    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'CANCEL_MOUVEMENT',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: { mouvementId, raison },
      metadata: {
        description: `Annulation mouvement ${mouvement.numeroVol}: ${raison}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de l\'annulation du mouvement:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// WORKFLOW (PUBLICATION / ARCHIVAGE)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Publie un bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin publie
 */
export const publierBulletin = async (bulletinId, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    bulletin.publier(userId);
    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'PUBLISH',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        statut: 'PUBLIE',
        datePublication: bulletin.datePublication
      },
      metadata: {
        description: `Publication du bulletin ${bulletin.numeroBulletin}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de la publication du bulletin:', error);
    throw error;
  }
};

/**
 * Archive un bulletin
 * @param {String} bulletinId - ID du bulletin
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Bulletin archive
 */
export const archiverBulletin = async (bulletinId, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    bulletin.archiver();
    bulletin.modifiePar = userId;
    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'ARCHIVE',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: { statut: 'ARCHIVE' },
      metadata: {
        description: `Archivage du bulletin ${bulletin.numeroBulletin}`
      }
    });

    return bulletin;

  } catch (error) {
    console.error('Erreur lors de l\'archivage du bulletin:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// CREATION DE VOLS DEPUIS BULLETIN
// ══════════════════════════════════════════════════════════════════════════

/**
 * Cree les instances Vol depuis les mouvements du bulletin
 * Utile pour lier les CRV aux vols reels
 * @param {String} bulletinId - ID du bulletin
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Resultat de la creation
 */
export const creerVolsDepuisBulletin = async (bulletinId, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    const resultats = {
      crees: [],
      existants: [],
      erreurs: []
    };

    for (const mouvement of bulletin.mouvements) {
      // Ignorer les mouvements annules
      if (mouvement.statutMouvement === 'ANNULE') {
        continue;
      }

      // Ignorer si vol deja cree
      if (mouvement.vol) {
        resultats.existants.push({
          numeroVol: mouvement.numeroVol,
          volId: mouvement.vol
        });
        continue;
      }

      try {
        // Verifier si le vol existe deja pour cette date
        const volExistant = await Vol.findOne({
          numeroVol: mouvement.numeroVol,
          dateVol: mouvement.dateMouvement
        });

        if (volExistant) {
          // Lier le mouvement au vol existant
          mouvement.vol = volExistant._id;
          resultats.existants.push({
            numeroVol: mouvement.numeroVol,
            volId: volExistant._id
          });
        } else {
          // Creer le vol
          const vol = new Vol({
            numeroVol: mouvement.numeroVol,
            compagnieAerienne: mouvement.codeCompagnie || 'INCONNU',
            codeIATA: mouvement.codeCompagnie?.substring(0, 2) || 'XX',
            aeroportOrigine: mouvement.provenance,
            aeroportDestination: mouvement.destination,
            dateVol: mouvement.dateMouvement,
            typeOperation: mouvement.typeOperation,
            statut: 'PROGRAMME',
            horsProgramme: mouvement.origine === 'HORS_PROGRAMME',
            programmeVolReference: mouvement.programmeVolReference,
            raisonHorsProgramme: mouvement.raisonHorsProgramme,
            typeVolHorsProgramme: mouvement.typeHorsProgramme
          });

          await vol.save();

          // Lier le mouvement au vol
          mouvement.vol = vol._id;

          resultats.crees.push({
            numeroVol: mouvement.numeroVol,
            volId: vol._id
          });
        }

      } catch (err) {
        resultats.erreurs.push({
          numeroVol: mouvement.numeroVol,
          erreur: err.message
        });
      }
    }

    await bulletin.save();

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'CREATE_VOLS_FROM_BULLETIN',
      targetModel: 'BulletinMouvement',
      targetId: bulletin._id,
      changes: {
        crees: resultats.crees.length,
        existants: resultats.existants.length,
        erreurs: resultats.erreurs.length
      },
      metadata: {
        description: `Creation de ${resultats.crees.length} vols depuis bulletin ${bulletin.numeroBulletin}`
      }
    });

    return {
      bulletin: bulletin._id,
      ...resultats
    };

  } catch (error) {
    console.error('Erreur lors de la creation des vols depuis bulletin:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// SUPPRESSION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Supprime un bulletin (uniquement si brouillon)
 * @param {String} bulletinId - ID du bulletin
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Resultat
 */
export const supprimerBulletin = async (bulletinId, userId) => {
  try {
    const bulletin = await BulletinMouvement.findById(bulletinId);
    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    if (bulletin.statut !== 'BROUILLON') {
      throw new Error('Seuls les bulletins en brouillon peuvent etre supprimes');
    }

    const numeroBulletin = bulletin.numeroBulletin;

    await BulletinMouvement.findByIdAndDelete(bulletinId);

    // Log
    await UserActivityLog.create({
      user: userId,
      action: 'DELETE',
      targetModel: 'BulletinMouvement',
      targetId: bulletinId,
      changes: { numeroBulletin },
      metadata: {
        description: `Suppression du bulletin ${numeroBulletin}`
      }
    });

    return { message: `Bulletin ${numeroBulletin} supprime` };

  } catch (error) {
    console.error('Erreur lors de la suppression du bulletin:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

export default {
  creerBulletin,
  creerBulletinDepuisProgramme,
  obtenirBulletinParId,
  obtenirBulletinEnCours,
  listerBulletins,
  ajouterMouvement,
  ajouterVolHorsProgramme,
  modifierMouvement,
  supprimerMouvement,
  annulerMouvement,
  publierBulletin,
  archiverBulletin,
  creerVolsDepuisBulletin,
  supprimerBulletin
};
