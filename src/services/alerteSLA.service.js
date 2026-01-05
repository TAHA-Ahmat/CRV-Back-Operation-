import CRV from '../models/CRV.js';
import Phase from '../models/Phase.js';
import { envoyerAlerteSLA, creerNotificationMultiple } from './notification.service.js';

/**
 * EXTENSION 8 - Service Alertes SLA Proactives
 *
 * Service NOUVEAU pour surveiller et alerter sur les dépassements de SLA.
 *
 * NON-RÉGRESSION: Ce service est ENTIÈREMENT NOUVEAU et OPTIONNEL.
 * - Aucun service existant n'est modifié
 * - Peut être utilisé ou ignoré sans impact sur le système
 * - Fournit des fonctions ADDITIONNELLES uniquement
 * - S'appuie sur Extension 7 (notifications) pour envoyer les alertes
 */

/**
 * SLA par défaut (en heures)
 */
const SLA_DEFAULTS = {
  CRV: {
    BROUILLON_TO_EN_COURS: 24,      // CRV doit passer en EN_COURS dans les 24h
    EN_COURS_TO_TERMINE: 48,        // CRV doit être TERMINE dans les 48h après EN_COURS
    TERMINE_TO_VALIDE: 72,          // CRV doit être VALIDE dans les 72h après TERMINE
    GLOBAL: 168                     // CRV doit être VALIDE dans les 7 jours (168h) après création
  },
  PHASE: {
    EN_ATTENTE_TO_EN_COURS: 2,     // Phase doit démarrer dans les 2h
    EN_COURS_TO_TERMINEE: 24,      // Phase doit se terminer dans les 24h
    GLOBAL: 48                      // Phase doit être TERMINEE dans les 48h après création
  }
};

/**
 * Seuils d'alerte (pourcentage du SLA écoulé)
 */
const SEUILS_ALERTE = {
  WARNING: 0.75,    // 75% du SLA écoulé
  CRITICAL: 0.90,   // 90% du SLA écoulé
  EXCEEDED: 1.0     // 100% du SLA écoulé
};

/**
 * Vérifie le SLA d'un CRV
 * @param {Object} crv - Document CRV
 * @returns {Object} État du SLA
 */
export const verifierSLACRV = async (crvId) => {
  try {
    const crv = await CRV.findById(crvId).populate('creePar');
    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    const maintenant = new Date();
    const dateCreation = new Date(crv.dateCreation);
    const heuresEcoulees = (maintenant - dateCreation) / (1000 * 60 * 60);

    // Déterminer le SLA applicable selon le statut
    let slaApplicable;
    let dateReference;
    let etapeActuelle;

    switch (crv.statut) {
      case 'BROUILLON':
        slaApplicable = SLA_DEFAULTS.CRV.BROUILLON_TO_EN_COURS;
        dateReference = dateCreation;
        etapeActuelle = 'BROUILLON → EN_COURS';
        break;

      case 'EN_COURS':
        slaApplicable = SLA_DEFAULTS.CRV.EN_COURS_TO_TERMINE;
        dateReference = crv.updatedAt; // Dernière mise à jour
        etapeActuelle = 'EN_COURS → TERMINE';
        break;

      case 'TERMINE':
        slaApplicable = SLA_DEFAULTS.CRV.TERMINE_TO_VALIDE;
        dateReference = crv.updatedAt;
        etapeActuelle = 'TERMINE → VALIDE';
        break;

      case 'VALIDE':
      case 'VERROUILLE':
      case 'ANNULE':
        // Pas de SLA pour les CRV terminés/annulés
        return {
          crvId: crv._id,
          numeroCRV: crv.numeroCRV,
          statut: crv.statut,
          enAlerte: false,
          message: `CRV ${crv.statut} - Pas de SLA actif`
        };

      default:
        return null;
    }

    const heuresDepuisReference = (maintenant - new Date(dateReference)) / (1000 * 60 * 60);
    const pourcentageEcoule = heuresDepuisReference / slaApplicable;

    // Déterminer le niveau d'alerte
    let niveau = null;
    let priorite = 'NORMALE';

    if (pourcentageEcoule >= SEUILS_ALERTE.EXCEEDED) {
      niveau = 'EXCEEDED';
      priorite = 'URGENTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.CRITICAL) {
      niveau = 'CRITICAL';
      priorite = 'HAUTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.WARNING) {
      niveau = 'WARNING';
      priorite = 'HAUTE';
    }

    return {
      crvId: crv._id,
      numeroCRV: crv.numeroCRV,
      statut: crv.statut,
      etapeActuelle,
      enAlerte: niveau !== null,
      niveau,
      priorite,
      slaApplicable,
      heuresDepuisReference,
      heuresRestantes: slaApplicable - heuresDepuisReference,
      pourcentageEcoule: Math.round(pourcentageEcoule * 100),
      dateReference,
      creePar: crv.creePar
    };

  } catch (error) {
    console.error('Erreur lors de la vérification SLA CRV:', error);
    throw error;
  }
};

/**
 * Vérifie le SLA d'une phase
 * @param {String} phaseId - ID de la phase
 * @returns {Object} État du SLA
 */
export const verifierSLAPhase = async (phaseId) => {
  try {
    const phase = await Phase.findById(phaseId);
    if (!phase) {
      throw new Error('Phase non trouvée');
    }

    const maintenant = new Date();
    const dateCreation = new Date(phase.dateCreation);

    let slaApplicable;
    let dateReference;
    let etapeActuelle;

    switch (phase.statut) {
      case 'EN_ATTENTE':
        slaApplicable = SLA_DEFAULTS.PHASE.EN_ATTENTE_TO_EN_COURS;
        dateReference = dateCreation;
        etapeActuelle = 'EN_ATTENTE → EN_COURS';
        break;

      case 'EN_COURS':
        slaApplicable = SLA_DEFAULTS.PHASE.EN_COURS_TO_TERMINEE;
        dateReference = phase.heureDebut || phase.updatedAt;
        etapeActuelle = 'EN_COURS → TERMINEE';
        break;

      case 'TERMINEE':
      case 'ANNULEE':
        return {
          phaseId: phase._id,
          typePhase: phase.typePhase,
          statut: phase.statut,
          enAlerte: false,
          message: `Phase ${phase.statut} - Pas de SLA actif`
        };

      default:
        return null;
    }

    const heuresDepuisReference = (maintenant - new Date(dateReference)) / (1000 * 60 * 60);
    const pourcentageEcoule = heuresDepuisReference / slaApplicable;

    let niveau = null;
    let priorite = 'NORMALE';

    if (pourcentageEcoule >= SEUILS_ALERTE.EXCEEDED) {
      niveau = 'EXCEEDED';
      priorite = 'URGENTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.CRITICAL) {
      niveau = 'CRITICAL';
      priorite = 'HAUTE';
    } else if (pourcentageEcoule >= SEUILS_ALERTE.WARNING) {
      niveau = 'WARNING';
      priorite = 'HAUTE';
    }

    return {
      phaseId: phase._id,
      typePhase: phase.typePhase,
      statut: phase.statut,
      etapeActuelle,
      enAlerte: niveau !== null,
      niveau,
      priorite,
      slaApplicable,
      heuresDepuisReference,
      heuresRestantes: slaApplicable - heuresDepuisReference,
      pourcentageEcoule: Math.round(pourcentageEcoule * 100),
      dateReference
    };

  } catch (error) {
    console.error('Erreur lors de la vérification SLA Phase:', error);
    throw error;
  }
};

/**
 * Surveille tous les CRV actifs et envoie des alertes
 * @returns {Object} Résultat de la surveillance
 */
export const surveillerTousCRV = async () => {
  try {
    // Récupérer tous les CRV actifs (non VALIDE, non VERROUILLE, non ANNULE)
    const crvsActifs = await CRV.find({
      statut: { $in: ['BROUILLON', 'EN_COURS', 'TERMINE'] }
    }).populate('creePar');

    const alertes = [];
    const statistiques = {
      total: crvsActifs.length,
      enAlerte: 0,
      parNiveau: {
        WARNING: 0,
        CRITICAL: 0,
        EXCEEDED: 0
      },
      alertesEnvoyees: 0
    };

    for (const crv of crvsActifs) {
      const etatSLA = await verifierSLACRV(crv._id);

      if (etatSLA && etatSLA.enAlerte) {
        statistiques.enAlerte++;
        statistiques.parNiveau[etatSLA.niveau]++;

        // Envoyer alerte au créateur du CRV
        if (crv.creePar) {
          try {
            await envoyerAlerteSLA(crv.creePar._id, {
              titre: `Alerte SLA - CRV ${crv.numeroCRV}`,
              message: `Le CRV ${crv.numeroCRV} approche du dépassement de SLA (${etatSLA.pourcentageEcoule}% écoulé). Étape: ${etatSLA.etapeActuelle}. Temps restant: ${Math.round(etatSLA.heuresRestantes)}h.`,
              lien: `/crv/${crv._id}`,
              priorite: etatSLA.priorite,
              referenceModele: 'CRV',
              referenceId: crv._id,
              niveau: etatSLA.niveau,
              etapeActuelle: etatSLA.etapeActuelle,
              pourcentageEcoule: etatSLA.pourcentageEcoule,
              heuresRestantes: etatSLA.heuresRestantes
            });

            statistiques.alertesEnvoyees++;
          } catch (error) {
            console.error(`Erreur envoi alerte SLA pour CRV ${crv.numeroCRV}:`, error);
          }
        }

        alertes.push(etatSLA);
      }
    }

    return {
      success: true,
      statistiques,
      alertes
    };

  } catch (error) {
    console.error('Erreur lors de la surveillance des CRV:', error);
    throw error;
  }
};

/**
 * Surveille toutes les phases actives et envoie des alertes
 * @returns {Object} Résultat de la surveillance
 */
export const surveillerToutesPhases = async () => {
  try {
    const phasesActives = await Phase.find({
      statut: { $in: ['EN_ATTENTE', 'EN_COURS'] }
    }).populate('crv');

    const alertes = [];
    const statistiques = {
      total: phasesActives.length,
      enAlerte: 0,
      parNiveau: {
        WARNING: 0,
        CRITICAL: 0,
        EXCEEDED: 0
      },
      alertesEnvoyees: 0
    };

    for (const phase of phasesActives) {
      const etatSLA = await verifierSLAPhase(phase._id);

      if (etatSLA && etatSLA.enAlerte) {
        statistiques.enAlerte++;
        statistiques.parNiveau[etatSLA.niveau]++;

        // Envoyer alerte aux responsables
        // (Adapter selon les besoins: créateur du CRV, superviseurs, etc.)
        if (phase.crv && phase.crv.creePar) {
          try {
            await envoyerAlerteSLA(phase.crv.creePar, {
              titre: `Alerte SLA - Phase ${phase.typePhase}`,
              message: `La phase ${phase.typePhase} du CRV ${phase.crv.numeroCRV} approche du dépassement de SLA (${etatSLA.pourcentageEcoule}% écoulé). Temps restant: ${Math.round(etatSLA.heuresRestantes)}h.`,
              lien: `/crv/${phase.crv._id}/phases`,
              priorite: etatSLA.priorite,
              referenceModele: 'Phase',
              referenceId: phase._id,
              niveau: etatSLA.niveau,
              etapeActuelle: etatSLA.etapeActuelle,
              pourcentageEcoule: etatSLA.pourcentageEcoule,
              heuresRestantes: etatSLA.heuresRestantes
            });

            statistiques.alertesEnvoyees++;
          } catch (error) {
            console.error(`Erreur envoi alerte SLA pour Phase ${phase._id}:`, error);
          }
        }

        alertes.push(etatSLA);
      }
    }

    return {
      success: true,
      statistiques,
      alertes
    };

  } catch (error) {
    console.error('Erreur lors de la surveillance des phases:', error);
    throw error;
  }
};

/**
 * Obtient un rapport complet des SLA
 * @returns {Object} Rapport SLA
 */
export const obtenirRapportSLA = async () => {
  try {
    const [resultCRV, resultPhases] = await Promise.all([
      surveillerTousCRV(),
      surveillerToutesPhases()
    ]);

    return {
      success: true,
      dateRapport: new Date(),
      crv: resultCRV.statistiques,
      phases: resultPhases.statistiques,
      total: {
        elements: resultCRV.statistiques.total + resultPhases.statistiques.total,
        enAlerte: resultCRV.statistiques.enAlerte + resultPhases.statistiques.enAlerte,
        alertesEnvoyees: resultCRV.statistiques.alertesEnvoyees + resultPhases.statistiques.alertesEnvoyees
      }
    };

  } catch (error) {
    console.error('Erreur lors de la génération du rapport SLA:', error);
    throw error;
  }
};

/**
 * Configure les SLA personnalisés (optionnel)
 * Cette fonction permet de surcharger les SLA par défaut
 * @param {Object} slaConfig - Configuration SLA personnalisée
 */
export const configurerSLA = (slaConfig) => {
  if (slaConfig.CRV) {
    Object.assign(SLA_DEFAULTS.CRV, slaConfig.CRV);
  }
  if (slaConfig.PHASE) {
    Object.assign(SLA_DEFAULTS.PHASE, slaConfig.PHASE);
  }
  console.log('SLA configurés:', SLA_DEFAULTS);
};

/**
 * Obtient la configuration SLA actuelle
 * @returns {Object} Configuration SLA
 */
export const obtenirConfigurationSLA = () => {
  return {
    defaults: SLA_DEFAULTS,
    seuils: SEUILS_ALERTE
  };
};
