/**
 * UTILITAIRE HORODATAGE — Double Horodatage CRV
 *
 * RÈGLES MÉTIER :
 * - Tout horodatage contient TOUJOURS un timestampSysteme (serveur UTC)
 * - heureDeclaree = ce que l'agent a saisi (peut être différent du timestamp serveur)
 * - source = TEMPS_REEL si écart < 5 min, DECLARATION sinon
 * - saisie tardive si écart > 60 min
 * - Toutes les heures sont stockées en UTC
 */

/**
 * Sources possibles d'un horodatage
 */
export const SOURCES_HORODATAGE = {
  TEMPS_REEL: 'TEMPS_REEL',       // Bouton demarrer/terminer cliqué en temps réel
  DECLARATION: 'DECLARATION',     // Agent saisit une heure manuellement (a posteriori)
  CORRECTION: 'CORRECTION',       // Superviseur corrige une heure
  IMPORT: 'IMPORT'                // Donnée importée d'un système tiers
};

/**
 * Seuils de détection (en minutes)
 */
export const SEUILS = {
  TEMPS_REEL_MAX: 5,       // Écart max pour considérer comme temps réel
  SAISIE_TARDIVE: 60       // Au-delà = saisie tardive flaggée
};

/**
 * Calcule l'écart en minutes entre deux dates
 * @param {Date} dateDeclaree - Heure déclarée par l'agent
 * @param {Date} dateSysteme - Timestamp serveur
 * @returns {number|null} Écart en minutes (valeur absolue)
 */
export const calculerEcartSaisie = (dateDeclaree, dateSysteme) => {
  if (!dateDeclaree || !dateSysteme) return null;

  const declaree = new Date(dateDeclaree);
  const systeme = new Date(dateSysteme);

  if (isNaN(declaree.getTime()) || isNaN(systeme.getTime())) return null;

  const ecartMs = Math.abs(declaree - systeme);
  return Math.round(ecartMs / 60000);
};

/**
 * Détecte automatiquement la source d'un horodatage
 * @param {number|null} ecartMinutes - Écart calculé entre déclaré et système
 * @param {string|null} sourceExplicite - Source explicitement fournie (optionnel)
 * @returns {string} Source détectée
 */
export const detecterSource = (ecartMinutes, sourceExplicite = null) => {
  // Si une source est explicitement fournie, la respecter
  if (sourceExplicite && Object.values(SOURCES_HORODATAGE).includes(sourceExplicite)) {
    return sourceExplicite;
  }

  // Détection automatique basée sur l'écart
  if (ecartMinutes === null || ecartMinutes === undefined) {
    return SOURCES_HORODATAGE.TEMPS_REEL;
  }

  if (ecartMinutes <= SEUILS.TEMPS_REEL_MAX) {
    return SOURCES_HORODATAGE.TEMPS_REEL;
  }

  return SOURCES_HORODATAGE.DECLARATION;
};

/**
 * Détermine si c'est une saisie tardive
 * @param {number|null} ecartMinutes - Écart en minutes
 * @returns {boolean}
 */
export const estSaisieTardive = (ecartMinutes) => {
  if (ecartMinutes === null || ecartMinutes === undefined) return false;
  return ecartMinutes > SEUILS.SAISIE_TARDIVE;
};

/**
 * Crée un objet horodatage complet pour une action en TEMPS RÉEL
 * (bouton demarrer/terminer cliqué)
 *
 * @param {string|null} userId - ID de l'agent
 * @param {string} timezoneAeroport - Timezone de l'aéroport (ex: 'Africa/Ndjamena')
 * @returns {Object} Sous-document horodatage
 */
export const creerHorodatageTempsReel = (userId = null, timezoneAeroport = 'UTC') => {
  const now = new Date();
  return {
    timestampSysteme: now,
    heureDeclaree: now,         // En temps réel, déclaré = système
    source: SOURCES_HORODATAGE.TEMPS_REEL,
    ecartSaisieMinutes: 0,
    saisieTardive: false,
    agent: userId,
    timezoneAeroport
  };
};

/**
 * Crée un objet horodatage complet pour une DÉCLARATION
 * (agent saisit manuellement une heure)
 *
 * @param {Date} heureDeclaree - Heure saisie par l'agent
 * @param {string|null} userId - ID de l'agent
 * @param {string} timezoneAeroport - Timezone de l'aéroport
 * @param {string|null} sourceExplicite - Source explicitement fournie
 * @returns {Object} Sous-document horodatage
 */
export const creerHorodatageDeclaration = (heureDeclaree, userId = null, timezoneAeroport = 'UTC', sourceExplicite = null) => {
  const now = new Date();
  const declaree = heureDeclaree ? new Date(heureDeclaree) : now;

  const ecart = calculerEcartSaisie(declaree, now);
  const source = detecterSource(ecart, sourceExplicite);
  const tardive = estSaisieTardive(ecart);

  return {
    timestampSysteme: now,
    heureDeclaree: declaree,
    source,
    ecartSaisieMinutes: ecart || 0,
    saisieTardive: tardive,
    agent: userId,
    timezoneAeroport
  };
};

export default {
  SOURCES_HORODATAGE,
  SEUILS,
  calculerEcartSaisie,
  detecterSource,
  estSaisieTardive,
  creerHorodatageTempsReel,
  creerHorodatageDeclaration
};
