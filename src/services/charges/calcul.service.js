/**
 * SERVICE CRITIQUE : Calculs de durées uniques et fiables
 *
 * RÈGLES MÉTIER :
 * - Tous les calculs de durées doivent passer par ce service
 * - Les durées sont TOUJOURS en minutes (entier)
 * - Un calcul null signifie "non calculable" (dates manquantes)
 * - 0 signifie "durée nulle calculée" (différent de non calculé)
 * - Les calculs sont IMMUABLES une fois validés
 */

/**
 * Calcule la durée entre deux dates en minutes
 * @param {Date|String} dateDebut - Date de début
 * @param {Date|String} dateFin - Date de fin
 * @returns {Number|null} Durée en minutes ou null si impossible
 */
export const calculerDureeMinutes = (dateDebut, dateFin) => {
  // Validation des paramètres
  if (!dateDebut || !dateFin) {
    return null;
  }

  // Conversion en objets Date
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  // Validation des dates
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    console.error('❌ Dates invalides pour calcul de durée', { dateDebut, dateFin });
    return null;
  }

  // Vérification de cohérence temporelle
  if (fin < debut) {
    console.warn('⚠️ Date fin antérieure à date début', { dateDebut, dateFin });
    return null;
  }

  // Calcul de la durée en millisecondes puis conversion en minutes
  const dureeMs = fin - debut;
  const dureeMinutes = Math.round(dureeMs / 60000);

  return dureeMinutes;
};

/**
 * Calcule l'écart entre durée réelle et prévue en minutes
 * @param {Date|String} debutPrevu - Heure de début prévue
 * @param {Date|String} finPrevue - Heure de fin prévue
 * @param {Date|String} debutReel - Heure de début réelle
 * @param {Date|String} finReelle - Heure de fin réelle
 * @returns {Object} { dureeReelle, dureePrevue, ecart }
 */
export const calculerEcartDuree = (debutPrevu, finPrevue, debutReel, finReelle) => {
  const dureeReelle = calculerDureeMinutes(debutReel, finReelle);
  const dureePrevue = calculerDureeMinutes(debutPrevu, finPrevue);

  if (dureeReelle === null || dureePrevue === null) {
    return {
      dureeReelle,
      dureePrevue,
      ecart: null
    };
  }

  const ecart = dureeReelle - dureePrevue;

  return {
    dureeReelle,
    dureePrevue,
    ecart
  };
};

/**
 * Calcule l'écart entre heure prévue et réelle en minutes
 * @param {Date|String} heurePrevue - Heure prévue
 * @param {Date|String} heureReelle - Heure réelle
 * @returns {Number|null} Écart en minutes (positif = retard, négatif = avance)
 */
export const calculerEcartHoraire = (heurePrevue, heureReelle) => {
  if (!heurePrevue || !heureReelle) {
    return null;
  }

  const prevue = new Date(heurePrevue);
  const reelle = new Date(heureReelle);

  if (isNaN(prevue.getTime()) || isNaN(reelle.getTime())) {
    return null;
  }

  const ecartMs = reelle - prevue;
  const ecartMinutes = Math.round(ecartMs / 60000);

  return ecartMinutes;
};

/**
 * Valide qu'une durée réelle est cohérente avec les heures saisies
 * RÈGLE : La durée calculée doit correspondre aux timestamps
 * @param {Object} phase - Objet ChronologiePhase
 * @returns {Boolean} true si cohérent
 */
export const validerCoherenceDuree = (phase) => {
  if (!phase.heureDebutReelle || !phase.heureFinReelle) {
    return true; // Pas de validation si données incomplètes
  }

  const dureeCalculee = calculerDureeMinutes(
    phase.heureDebutReelle,
    phase.heureFinReelle
  );

  if (phase.dureeReelleMinutes && dureeCalculee !== null) {
    // Tolérance de 1 minute pour arrondi
    const difference = Math.abs(phase.dureeReelleMinutes - dureeCalculee);

    if (difference > 1) {
      console.error('❌ INCOHÉRENCE CRITIQUE : Durée stockée ≠ durée calculée', {
        phaseId: phase._id,
        dureeStockee: phase.dureeReelleMinutes,
        dureeCalculee,
        difference
      });
      return false;
    }
  }

  return true;
};

/**
 * Calcule les statistiques de durées pour un ensemble de phases
 * @param {Array} phases - Tableau de ChronologiePhase
 * @returns {Object} Statistiques
 */
export const calculerStatistiquesDurees = (phases) => {
  const phasesTerminees = phases.filter(p =>
    p.statut === 'TERMINE' &&
    p.dureeReelleMinutes !== null &&
    p.dureeReelleMinutes !== undefined
  );

  if (phasesTerminees.length === 0) {
    return {
      nombrePhases: 0,
      dureeTotal: 0,
      dureeMoyenne: 0,
      dureeMin: 0,
      dureeMax: 0
    };
  }

  const durees = phasesTerminees.map(p => p.dureeReelleMinutes);
  const dureeTotal = durees.reduce((acc, d) => acc + d, 0);
  const dureeMoyenne = Math.round(dureeTotal / durees.length);
  const dureeMin = Math.min(...durees);
  const dureeMax = Math.max(...durees);

  return {
    nombrePhases: phasesTerminees.length,
    dureeTotal,
    dureeMoyenne,
    dureeMin,
    dureeMax
  };
};

/**
 * Formate une durée en minutes en format lisible
 * @param {Number} minutes - Durée en minutes
 * @returns {String} Format "Xh Ymin"
 */
export const formaterDuree = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return 'Non calculé';
  }

  if (minutes === 0) {
    return '0 min';
  }

  const heures = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (heures === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${heures}h`;
  }

  return `${heures}h ${mins}min`;
};

/**
 * Vérifie qu'une durée n'est pas une activité non réalisée déguisée
 * RÈGLE : 0 minutes calculé ≠ phase non réalisée
 * @param {Object} phase - ChronologiePhase
 * @returns {Object} { valide, message }
 */
export const verifierDureeNonNulle = (phase) => {
  if (phase.statut === 'NON_REALISE') {
    // OK, phase marquée correctement comme non réalisée
    return { valide: true };
  }

  if (phase.statut === 'TERMINE' && phase.dureeReelleMinutes === 0) {
    // SUSPECT : Phase terminée avec 0 minutes
    return {
      valide: false,
      message: 'Une phase terminée avec durée 0 devrait probablement être marquée "NON_REALISE"'
    };
  }

  return { valide: true };
};

export default {
  calculerDureeMinutes,
  calculerEcartDuree,
  calculerEcartHoraire,
  validerCoherenceDuree,
  calculerStatistiquesDurees,
  formaterDuree,
  verifierDureeNonNulle
};
