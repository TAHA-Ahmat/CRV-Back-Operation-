import ChargeOperationnelle from '../models/ChargeOperationnelle.js';
import UserActivityLog from '../models/UserActivityLog.js';

/**
 * EXTENSION 5 - Service Fret (Fret détaillé)
 *
 * Service NOUVEAU pour gérer le fret détaillé.
 *
 * NON-RÉGRESSION: Ce service est OPTIONNEL et n'affecte AUCUNE logique existante.
 * - Les opérations existantes sur ChargeOperationnelle (fret basique) continuent de fonctionner
 * - Ce service fournit des fonctions ADDITIONNELLES uniquement
 *
 * Ce service est 100% OPTIONNEL et peut être utilisé ou ignoré.
 */

/**
 * Met à jour le fret détaillé d'une charge
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} fretDetaille - Détails du fret
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const mettreAJourFretDetaille = async (chargeId, fretDetaille, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Vérifier que c'est bien une charge de type FRET
    if (charge.typeCharge !== 'FRET') {
      throw new Error('Cette charge n\'est pas de type FRET');
    }

    // Sauvegarder l'ancienne configuration
    const ancienFret = charge.fretDetaille ? { ...charge.fretDetaille } : null;

    // Mettre à jour le fret détaillé
    if (fretDetaille.categoriesFret) {
      charge.fretDetaille.categoriesFret = {
        ...charge.fretDetaille.categoriesFret,
        ...fretDetaille.categoriesFret
      };
    }

    if (fretDetaille.marchandisesDangereuses) {
      charge.fretDetaille.marchandisesDangereuses = {
        ...charge.fretDetaille.marchandisesDangereuses,
        ...fretDetaille.marchandisesDangereuses
      };
    }

    if (fretDetaille.logistique) {
      charge.fretDetaille.logistique = {
        ...charge.fretDetaille.logistique,
        ...fretDetaille.logistique
      };
    }

    if (fretDetaille.douanes) {
      charge.fretDetaille.douanes = {
        ...charge.fretDetaille.douanes,
        ...fretDetaille.douanes
      };
    }

    if (fretDetaille.conditionsTransport) {
      charge.fretDetaille.conditionsTransport = {
        ...charge.fretDetaille.conditionsTransport,
        ...fretDetaille.conditionsTransport
      };
    }

    if (fretDetaille.remarquesFret !== undefined) {
      charge.fretDetaille.remarquesFret = fretDetaille.remarquesFret;
    }

    charge.fretDetaille.utiliseFretDetaille = true;

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'UPDATE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        ancienFretDetaille: ancienFret,
        nouveauFretDetaille: charge.fretDetaille
      },
      metadata: {
        description: `Mise à jour du fret détaillé pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de la mise à jour du fret détaillé:', error);
    throw error;
  }
};

/**
 * Ajoute une marchandise dangereuse
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {Object} marchandise - Détails de la marchandise dangereuse
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const ajouterMarchandiseDangereuse = async (chargeId, marchandise, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    if (charge.typeCharge !== 'FRET') {
      throw new Error('Cette charge n\'est pas de type FRET');
    }

    // Validation des champs requis
    if (!marchandise.codeONU || !marchandise.classeONU || !marchandise.designationOfficielle) {
      throw new Error('Les champs codeONU, classeONU et designationOfficielle sont requis');
    }

    // Marquer comme présence de marchandises dangereuses
    charge.fretDetaille.marchandisesDangereuses.present = true;

    // Ajouter la marchandise
    charge.fretDetaille.marchandisesDangereuses.details.push(marchandise);
    charge.fretDetaille.utiliseFretDetaille = true;

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'ADD',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        marchandiseDangereuse: marchandise
      },
      metadata: {
        description: `Ajout d'une marchandise dangereuse (${marchandise.codeONU}) pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la marchandise dangereuse:', error);
    throw error;
  }
};

/**
 * Retire une marchandise dangereuse
 * @param {String} chargeId - ID de la charge opérationnelle
 * @param {String} marchandiseId - ID de la marchandise dans le tableau
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Charge mise à jour
 */
export const retirerMarchandiseDangereuse = async (chargeId, marchandiseId, userId) => {
  try {
    const charge = await ChargeOperationnelle.findById(chargeId);
    if (!charge) {
      throw new Error('Charge opérationnelle non trouvée');
    }

    // Retirer la marchandise
    const marchandiseRetiree = charge.fretDetaille.marchandisesDangereuses.details.id(marchandiseId);
    if (marchandiseRetiree) {
      marchandiseRetiree.remove();
    }

    // Si plus de marchandises dangereuses, mettre present à false
    if (charge.fretDetaille.marchandisesDangereuses.details.length === 0) {
      charge.fretDetaille.marchandisesDangereuses.present = false;
    }

    await charge.save();

    // Log de l'activité
    await UserActivityLog.create({
      user: userId,
      action: 'REMOVE',
      targetModel: 'ChargeOperationnelle',
      targetId: charge._id,
      changes: {
        marchandiseRetiree: marchandiseId
      },
      metadata: {
        description: `Retrait d'une marchandise dangereuse pour la charge ${charge._id}`
      }
    });

    return charge;

  } catch (error) {
    console.error('Erreur lors du retrait de la marchandise dangereuse:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques de fret pour un CRV
 * @param {String} crvId - ID du CRV
 * @returns {Object} Statistiques de fret
 */
export const obtenirStatistiquesFretCRV = async (crvId) => {
  try {
    const charges = await ChargeOperationnelle.find({ crv: crvId, typeCharge: 'FRET' });

    const stats = {
      totalCharges: charges.length,
      poidsTotal: 0,
      volumeTotal: 0,
      nombreColisTotal: 0,
      categoriesFret: {
        postal: 0,
        courrierExpress: 0,
        marchandiseGenerale: 0,
        denreesPerissables: 0,
        animauxVivants: 0,
        vehicules: 0,
        equipements: 0
      },
      marchandisesDangereuses: {
        chargesAvecDG: 0,
        totalMarchandisesDG: 0,
        parClasse: {}
      },
      logistique: {
        nombrePalettes: 0,
        nombreConteneurs: 0,
        colisHorsDimensions: 0
      },
      conditionsSpeciales: {
        temperatureControlee: 0,
        chaineduFroid: 0,
        fragile: 0
      },
      parSens: {
        embarquement: {
          nombre: 0,
          poidsKg: 0
        },
        debarquement: {
          nombre: 0,
          poidsKg: 0
        }
      }
    };

    charges.forEach(charge => {
      // Stats basiques
      stats.poidsTotal += charge.poidsFretKg || 0;

      // Par sens
      if (charge.sensOperation === 'EMBARQUEMENT') {
        stats.parSens.embarquement.nombre += charge.nombreFret || 0;
        stats.parSens.embarquement.poidsKg += charge.poidsFretKg || 0;
      } else if (charge.sensOperation === 'DEBARQUEMENT') {
        stats.parSens.debarquement.nombre += charge.nombreFret || 0;
        stats.parSens.debarquement.poidsKg += charge.poidsFretKg || 0;
      }

      // Fret détaillé
      if (charge.fretDetaille && charge.fretDetaille.utiliseFretDetaille) {
        const fd = charge.fretDetaille;

        // Catégories
        if (fd.categoriesFret) {
          stats.categoriesFret.postal += fd.categoriesFret.postal || 0;
          stats.categoriesFret.courrierExpress += fd.categoriesFret.courrierExpress || 0;
          stats.categoriesFret.marchandiseGenerale += fd.categoriesFret.marchandiseGenerale || 0;
          stats.categoriesFret.denreesPerissables += fd.categoriesFret.denreesPerissables?.nombre || 0;
          stats.categoriesFret.animauxVivants += fd.categoriesFret.animauxVivants?.nombre || 0;
          stats.categoriesFret.vehicules += fd.categoriesFret.vehicules?.nombre || 0;
          stats.categoriesFret.equipements += fd.categoriesFret.equipements?.nombre || 0;
        }

        // Marchandises dangereuses
        if (fd.marchandisesDangereuses?.present) {
          stats.marchandisesDangereuses.chargesAvecDG++;
          const nbDG = fd.marchandisesDangereuses.details?.length || 0;
          stats.marchandisesDangereuses.totalMarchandisesDG += nbDG;

          // Par classe
          fd.marchandisesDangereuses.details?.forEach(dg => {
            const classe = dg.classeONU;
            stats.marchandisesDangereuses.parClasse[classe] =
              (stats.marchandisesDangereuses.parClasse[classe] || 0) + 1;
          });
        }

        // Logistique
        if (fd.logistique) {
          stats.volumeTotal += fd.logistique.volumeM3 || 0;
          stats.nombreColisTotal += fd.logistique.nombreColis || 0;
          stats.logistique.nombrePalettes += fd.logistique.nombrePalettes || 0;
          stats.logistique.nombreConteneurs += fd.logistique.nombreConteneurs || 0;
          if (fd.logistique.dimensionsSpeciales) stats.logistique.colisHorsDimensions++;
        }

        // Conditions spéciales
        if (fd.conditionsTransport) {
          if (fd.conditionsTransport.temperatureControlee) stats.conditionsSpeciales.temperatureControlee++;
          if (fd.conditionsTransport.fragile) stats.conditionsSpeciales.fragile++;
        }
        if (fd.categoriesFret?.denreesPerissables?.chaineduFroid) {
          stats.conditionsSpeciales.chaineduFroid++;
        }
      }
    });

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques fret:', error);
    throw error;
  }
};

/**
 * Obtient les charges de fret avec marchandises dangereuses
 * @param {Object} filtres - Filtres optionnels
 * @returns {Array} Charges avec marchandises dangereuses
 */
export const obtenirChargesAvecMarchandisesDangereuses = async (filtres = {}) => {
  try {
    const query = {
      typeCharge: 'FRET',
      'fretDetaille.marchandisesDangereuses.present': true
    };

    if (filtres.crvId) {
      query.crv = filtres.crvId;
    }

    const charges = await ChargeOperationnelle.find(query)
      .populate('crv', 'numeroCRV dateCreation')
      .sort({ createdAt: -1 });

    return charges;

  } catch (error) {
    console.error('Erreur lors de la récupération des charges avec marchandises dangereuses:', error);
    throw error;
  }
};

/**
 * Valide la conformité d'une marchandise dangereuse
 * @param {Object} marchandise - Marchandise à valider
 * @returns {Object} Résultat de la validation
 */
export const validerMarchandiseDangereuse = async (marchandise) => {
  try {
    const erreurs = [];
    const avertissements = [];

    // Validation du code ONU
    if (!marchandise.codeONU || !marchandise.codeONU.match(/^UN\d{4}$/)) {
      erreurs.push('Code ONU invalide (format attendu: UN suivi de 4 chiffres)');
    }

    // Validation de la classe
    if (!marchandise.classeONU || !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(marchandise.classeONU)) {
      erreurs.push('Classe ONU invalide (doit être entre 1 et 9)');
    }

    // Validation de la quantité
    if (!marchandise.quantite || marchandise.quantite <= 0) {
      erreurs.push('Quantité invalide');
    }

    // Validation du groupe d'emballage
    if (marchandise.groupeEmballage && !['I', 'II', 'III'].includes(marchandise.groupeEmballage)) {
      erreurs.push('Groupe d\'emballage invalide (I, II ou III)');
    }

    // Avertissements
    if (!marchandise.designationOfficielle) {
      avertissements.push('Désignation officielle manquante');
    }

    if (marchandise.classeONU === '1' && !marchandise.numeroONU) {
      avertissements.push('Classe 1 (explosifs) : numéro ONU recommandé');
    }

    return {
      valide: erreurs.length === 0,
      erreurs: erreurs,
      avertissements: avertissements
    };

  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques globales de fret
 * @param {Object} filtres - Filtres optionnels
 * @returns {Object} Statistiques globales
 */
export const obtenirStatistiquesGlobalesFret = async (filtres = {}) => {
  try {
    const query = { typeCharge: 'FRET' };

    // Filtres optionnels (nécessiterait jointure avec CRV pour date/compagnie)

    const charges = await ChargeOperationnelle.find(query);

    const stats = {
      totalCharges: charges.length,
      chargesAvecFretDetaille: 0,
      chargesSansFretDetaille: 0,
      poidsTotal: 0,
      volumeTotal: 0,
      nombreMarchandisesDangereuses: 0,
      repartitionTypeFret: {
        STANDARD: 0,
        PERISSABLE: 0,
        DANGEREUX: 0,
        ANIMAUX: 0,
        AUTRE: 0
      }
    };

    charges.forEach(charge => {
      stats.poidsTotal += charge.poidsFretKg || 0;

      // Type fret basique
      if (charge.typeFret) {
        stats.repartitionTypeFret[charge.typeFret]++;
      }

      // Fret détaillé
      if (charge.fretDetaille?.utiliseFretDetaille) {
        stats.chargesAvecFretDetaille++;

        if (charge.fretDetaille.logistique?.volumeM3) {
          stats.volumeTotal += charge.fretDetaille.logistique.volumeM3;
        }

        if (charge.fretDetaille.marchandisesDangereuses?.present) {
          stats.nombreMarchandisesDangereuses +=
            charge.fretDetaille.marchandisesDangereuses.details?.length || 0;
        }
      } else {
        stats.chargesSansFretDetaille++;
      }
    });

    return stats;

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques globales fret:', error);
    throw error;
  }
};
