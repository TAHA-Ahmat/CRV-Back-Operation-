import * as alerteSLAService from '../../services/notifications/alerteSLA.service.js';
import SLAConfig from '../../models/sla/SLAConfig.js';

/**
 * EXTENSION 8 - Contrôleur Alertes SLA (Service alertes SLA proactives)
 *
 * Contrôleur NOUVEAU pour gérer les requêtes HTTP liées aux alertes SLA.
 *
 * NON-RÉGRESSION: Ce contrôleur est NOUVEAU et n'affecte AUCUN contrôleur existant.
 * - Les opérations existantes continuent de fonctionner normalement
 * - Ce contrôleur ajoute UNIQUEMENT des handlers pour les nouvelles fonctionnalités
 *
 * Ce contrôleur gère les routes ADDITIONNELLES liées à l'extension 8.
 */

/**
 * Vérifier le SLA d'un CRV spécifique
 * GET /api/sla/crv/:id
 */
export const verifierSLACRV = async (req, res) => {
  try {
    const crvId = req.params.id;

    const etatSLA = await alerteSLAService.verifierSLACRV(crvId);

    res.status(200).json({
      success: true,
      data: etatSLA
    });

  } catch (error) {
    console.error('Erreur dans verifierSLACRV:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du SLA'
    });
  }
};

/**
 * Vérifier le SLA d'une phase spécifique
 * GET /api/sla/phase/:id
 */
export const verifierSLAPhase = async (req, res) => {
  try {
    const phaseId = req.params.id;

    const etatSLA = await alerteSLAService.verifierSLAPhase(phaseId);

    res.status(200).json({
      success: true,
      data: etatSLA
    });

  } catch (error) {
    console.error('Erreur dans verifierSLAPhase:', error);

    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du SLA'
    });
  }
};

/**
 * Surveiller tous les CRV actifs
 * POST /api/sla/surveiller/crv
 */
export const surveillerCRV = async (req, res) => {
  try {
    const resultat = await alerteSLAService.surveillerTousCRV();

    res.status(200).json({
      success: true,
      message: `Surveillance terminée. ${resultat.statistiques.alertesEnvoyees} alertes envoyées.`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans surveillerCRV:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la surveillance des CRV'
    });
  }
};

/**
 * Surveiller toutes les phases actives
 * POST /api/sla/surveiller/phases
 */
export const surveillerPhases = async (req, res) => {
  try {
    const resultat = await alerteSLAService.surveillerToutesPhases();

    res.status(200).json({
      success: true,
      message: `Surveillance terminée. ${resultat.statistiques.alertesEnvoyees} alertes envoyées.`,
      data: resultat
    });

  } catch (error) {
    console.error('Erreur dans surveillerPhases:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la surveillance des phases'
    });
  }
};

/**
 * Obtenir le rapport SLA complet
 * GET /api/sla/rapport
 */
export const obtenirRapportSLA = async (req, res) => {
  try {
    const rapport = await alerteSLAService.obtenirRapportSLA();

    res.status(200).json({
      success: true,
      data: rapport
    });

  } catch (error) {
    console.error('Erreur dans obtenirRapportSLA:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération du rapport SLA'
    });
  }
};

/**
 * Obtenir la configuration SLA actuelle
 * GET /api/sla/configuration
 */
export const obtenirConfiguration = async (req, res) => {
  try {
    const config = alerteSLAService.obtenirConfigurationSLA();

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Erreur dans obtenirConfiguration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de la configuration'
    });
  }
};

// configurerSLA (PUT /api/sla/configuration) supprimé — la config SLA passe par CRUD base /api/sla/compagnies/:codeIATA

// ============================================================================
//   SLAConfig PAR COMPAGNIE — CRUD
// ============================================================================

/**
 * Lister toutes les configs SLA par compagnie
 * GET /api/sla/compagnies
 */
export const listerSLACompagnies = async (req, res) => {
  try {
    const configs = await SLAConfig.find()
      .sort({ codeIATA: 1 })
      .populate('creePar', 'prenom nom')
      .populate('modifiePar', 'prenom nom');

    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error('Erreur listerSLACompagnies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir la config SLA d'une compagnie
 * GET /api/sla/compagnies/:codeIATA
 */
export const obtenirSLACompagnie = async (req, res) => {
  try {
    const config = await SLAConfig.findOne({ codeIATA: req.params.codeIATA.toUpperCase() });
    if (!config) {
      return res.status(404).json({ success: false, message: `Aucune config SLA pour ${req.params.codeIATA}` });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Erreur obtenirSLACompagnie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Nomenclature fermée niveau 2 (SLA_NOMENCLATURE_LOCK.md) ──
const DOMAINES_AUTORISES = ['crv', 'phase', 'checkin', 'bagages', 'boarding', 'ramp', 'messages', 'phaseDurees', 'phaseOffsets'];
const INDICATEURS_AUTORISES = {
  crv:      ['brouillonToEnCours', 'enCoursToTermine', 'termineToValide', 'global'],
  phase:    ['enAttenteToEnCours', 'enCoursToTerminee', 'global'],
  checkin:  ['ouverture', 'fermeture'],
  bagages:  ['premierBagage', 'dernierBagage', 'bagagePrioritaire'],
  boarding: ['debut', 'fermetureGate', 'presenceAgent'],
  ramp:     ['turnaround', 'turnaroundNarrow', 'turnaroundWide', 'gpu'],
  messages: ['mvt', 'ldm', 'apis']
};
// crv/phase = heures (1-8760), niveau 2 = minutes (1-525600)
const LIMITES = {
  crv: { min: 1, max: 8760, unite: 'heures' },
  phase: { min: 1, max: 8760, unite: 'heures' },
  checkin: { min: 1, max: 1440, unite: 'minutes' },
  bagages: { min: 1, max: 1440, unite: 'minutes' },
  boarding: { min: 1, max: 1440, unite: 'minutes' },
  ramp: { min: 1, max: 1440, unite: 'minutes' },
  messages: { min: 1, max: 1440, unite: 'minutes' }
};

/**
 * Valider un domaine SLA selon la nomenclature fermée
 */
function validerDomaineSLA(obj, domaine) {
  if (!obj || typeof obj !== 'object') return null;
  const erreurs = [];
  const indicateursAutorisés = INDICATEURS_AUTORISES[domaine];
  const limites = LIMITES[domaine];

  if (!indicateursAutorisés) {
    return [`Domaine "${domaine}" non autorisé. Domaines valides : ${DOMAINES_AUTORISES.join(', ')}`];
  }

  for (const [key, val] of Object.entries(obj)) {
    // Rejeter les indicateurs hors nomenclature
    if (!indicateursAutorisés.includes(key)) {
      erreurs.push(`${domaine}.${key}: indicateur non autorisé. Valides : ${indicateursAutorisés.join(', ')}`);
      continue;
    }
    // null/undefined = hérite → OK
    if (val === null || val === undefined) continue;
    // Doit être un nombre valide dans les limites
    if (typeof val !== 'number' || !Number.isFinite(val) || val < limites.min || val > limites.max) {
      erreurs.push(`${domaine}.${key}: doit être null (hérite) ou un nombre entre ${limites.min} et ${limites.max} ${limites.unite}`);
    }
  }

  return erreurs.length > 0 ? erreurs : null;
}

/**
 * Créer ou mettre à jour une config SLA compagnie
 * PUT /api/sla/compagnies/:codeIATA
 *
 * Supporte niveau 1 (crv, phase) et niveau 2 (checkin, bagages, boarding, ramp, messages)
 */
export const upsertSLACompagnie = async (req, res) => {
  try {
    const codeIATA = req.params.codeIATA.toUpperCase();
    const { compagnieNom, crv, phase, checkin, bagages, boarding, ramp, messages, phaseDurees, actif, notes } = req.body;

    if (!compagnieNom) {
      return res.status(400).json({ success: false, message: 'compagnieNom requis' });
    }

    if (codeIATA.length < 2 || codeIATA.length > 3) {
      return res.status(400).json({ success: false, message: 'codeIATA doit faire 2 ou 3 caractères' });
    }

    // Validation stricte par nomenclature fermée
    const tousErreurs = [];
    const domainesTouches = { crv, phase, checkin, bagages, boarding, ramp, messages, phaseDurees };

    // Validation spécifique phaseDurees : clés = codes phases, valeurs = nombres positifs
    if (phaseDurees && typeof phaseDurees === 'object') {
      for (const [code, duree] of Object.entries(phaseDurees)) {
        if (typeof duree !== 'number' || duree < 0) {
          tousErreurs.push(`phaseDurees.${code}: valeur invalide (${duree}), doit être un nombre positif en minutes`);
        }
      }
    }

    for (const [domaine, obj] of Object.entries(domainesTouches)) {
      if (obj === undefined || obj === null) continue;
      const err = validerDomaineSLA(obj, domaine);
      if (err) tousErreurs.push(...err);
    }

    // Rejeter les domaines non autorisés dans le body
    const domainesBody = Object.keys(req.body).filter(k =>
      !['compagnieNom', 'actif', 'notes', 'codeIATA', ...DOMAINES_AUTORISES].includes(k)
    );
    if (domainesBody.length > 0) {
      tousErreurs.push(`Domaines non autorisés : ${domainesBody.join(', ')}`);
    }

    if (tousErreurs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Valeurs SLA invalides',
        erreurs: tousErreurs
      });
    }

    // Construction de l'update
    const updateData = {
      codeIATA,
      compagnieNom,
      modifiePar: req.user._id,
      $setOnInsert: { creePar: req.user._id }
    };

    // Ajouter chaque domaine fourni
    for (const domaine of DOMAINES_AUTORISES) {
      if (domainesTouches[domaine] !== undefined && domainesTouches[domaine] !== null) {
        updateData[domaine] = domainesTouches[domaine];
      }
    }

    if (actif !== undefined) updateData.actif = actif;
    if (notes !== undefined) updateData.notes = notes;

    const config = await SLAConfig.findOneAndUpdate(
      { codeIATA },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    const action = config.createdAt.getTime() === config.updatedAt.getTime() ? 'créée' : 'mise à jour';
    res.status(200).json({
      success: true,
      message: `Config SLA ${codeIATA} ${action}`,
      data: config
    });
  } catch (error) {
    console.error('Erreur upsertSLACompagnie:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Config déjà existante' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Supprimer une config SLA compagnie
 * DELETE /api/sla/compagnies/:codeIATA
 */
export const supprimerSLACompagnie = async (req, res) => {
  try {
    const result = await SLAConfig.findOneAndDelete({ codeIATA: req.params.codeIATA.toUpperCase() });
    if (!result) {
      return res.status(404).json({ success: false, message: `Aucune config SLA pour ${req.params.codeIATA}` });
    }
    res.status(200).json({ success: true, message: `Config SLA ${req.params.codeIATA} supprimée` });
  } catch (error) {
    console.error('Erreur supprimerSLACompagnie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
