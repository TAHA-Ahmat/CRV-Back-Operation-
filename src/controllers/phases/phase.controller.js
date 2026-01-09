import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import CRV from '../../models/crv/CRV.js';
import Phase from '../../models/phases/Phase.js';
import { demarrerPhase, terminerPhase } from '../../services/phases/phase.service.js';
import { calculerCompletude } from '../../services/crv/crv.service.js';

/**
 * Obtenir une phase individuelle (ChronologiePhase)
 * @route GET /api/phases/:id
 */
export const obtenirPhase = async (req, res, next) => {
  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id)
      .populate('phase')
      .populate('responsable', 'nom prenom matricule');

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: chronoPhase
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lister les phases d'un CRV
 * @route GET /api/phases?crvId=xxx
 */
export const listerPhases = async (req, res, next) => {
  try {
    const { crvId } = req.query;

    if (!crvId) {
      return res.status(400).json({
        success: false,
        message: 'crvId requis en paramètre de requête'
      });
    }

    // Vérifier que le CRV existe
    const crv = await CRV.findById(crvId);
    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const phases = await ChronologiePhase.find({ crv: crvId })
      .populate('phase')
      .populate('responsable', 'nom prenom matricule')
      .sort({ 'phase.ordre': 1 });

    res.status(200).json({
      success: true,
      count: phases.length,
      data: phases
    });
  } catch (error) {
    next(error);
  }
};

export const demarrerPhaseController = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ▶️ DÉMARRER PHASE - CONTROLLER                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📌 ChronoPhase ID: ${req.params.id}`);
  console.log(`👤 User ID: ${req.user._id}`);

  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      console.log('❌ Phase non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    console.log(`✓ Phase trouvée, CRV: ${chronoPhase.crv}`);
    console.log(`   Statut actuel phase: ${chronoPhase.statut}`);

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      console.log('❌ CRV verrouillé - opération refusée');
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    console.log(`✓ CRV non verrouillé (statut: ${crv.statut})`);
    console.log('→ Appel service demarrerPhase...');

    const phaseUpdated = await demarrerPhase(req.params.id, req.user._id);

    console.log('✓ Phase démarrée avec succès');
    console.log(`   Nouveau statut: ${phaseUpdated.statut}`);

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    console.error('❌ Erreur demarrerPhaseController:', error.message);
    next(error);
  }
};

export const terminerPhaseController = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ⏹️ TERMINER PHASE - CONTROLLER                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📌 ChronoPhase ID: ${req.params.id}`);
  console.log(`👤 User ID: ${req.user._id}`);

  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      console.log('❌ Phase non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    console.log(`✓ Phase trouvée, CRV: ${chronoPhase.crv}`);
    console.log(`   Statut actuel phase: ${chronoPhase.statut}`);

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      console.log('❌ CRV verrouillé - opération refusée');
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    console.log(`✓ CRV non verrouillé (statut: ${crv.statut})`);
    console.log('→ Appel service terminerPhase...');

    const phaseUpdated = await terminerPhase(req.params.id);

    console.log('✓ Phase terminée');
    console.log(`   Nouveau statut: ${phaseUpdated.statut}`);
    console.log('→ Recalcul complétude CRV...');

    await calculerCompletude(chronoPhase.crv);

    console.log('✓ Complétude recalculée');

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    console.error('❌ Erreur terminerPhaseController:', error.message);
    next(error);
  }
};

export const marquerPhaseNonRealisee = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           🚫 MARQUER PHASE NON RÉALISÉE - CONTROLLER       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📌 ChronoPhase ID: ${req.params.id}`);
  console.log(`👤 User ID: ${req.user._id}`);

  try {
    const { motifNonRealisation, detailMotif } = req.body;

    console.log(`📝 Motif: ${motifNonRealisation}`);
    console.log(`📝 Détail: ${detailMotif || '(aucun)'}`);

    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      console.log('❌ Phase non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    console.log(`✓ Phase trouvée, CRV: ${chronoPhase.crv}`);
    console.log(`   Statut actuel: ${chronoPhase.statut}`);

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      console.log('❌ CRV verrouillé - opération refusée');
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    console.log(`✓ CRV non verrouillé (statut: ${crv.statut})`);
    console.log('→ Mise à jour phase...');

    chronoPhase.statut = 'NON_REALISE';
    chronoPhase.motifNonRealisation = motifNonRealisation;
    chronoPhase.detailMotif = detailMotif;

    await chronoPhase.save();

    console.log('✓ Phase marquée NON_REALISE');
    console.log('→ Recalcul complétude CRV...');

    await calculerCompletude(chronoPhase.crv);

    console.log('✓ Complétude recalculée');

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: chronoPhase
    });
  } catch (error) {
    console.error('❌ Erreur marquerPhaseNonRealisee:', error.message);
    next(error);
  }
};

/**
 * Convertir une heure HH:mm en Date (aujourd'hui ou date de référence)
 * @param {string} heureStr - Heure au format "HH:mm" ou "HH:mm:ss"
 * @param {Date} dateRef - Date de référence (optionnel, défaut: aujourd'hui)
 * @returns {Date|null}
 */
const convertirHeureEnDate = (heureStr, dateRef = new Date()) => {
  if (!heureStr) return null;

  // Si c'est déjà une date ISO, la retourner directement
  if (heureStr instanceof Date) return heureStr;
  if (typeof heureStr === 'string' && heureStr.includes('T')) {
    return new Date(heureStr);
  }

  // Format HH:mm ou HH:mm:ss
  const parts = heureStr.split(':');
  if (parts.length >= 2) {
    const heures = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondes = parts[2] ? parseInt(parts[2], 10) : 0;

    const date = new Date(dateRef);
    date.setHours(heures, minutes, secondes, 0);
    return date;
  }

  return null;
};

export const mettreAJourPhase = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ✏️ MISE À JOUR PHASE - CONTROLLER                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📌 ChronoPhase ID: ${req.params.id}`);
  console.log(`👤 User ID: ${req.user._id}`);

  try {
    const chronoPhase = await ChronologiePhase.findById(req.params.id);

    if (!chronoPhase) {
      console.log('❌ Phase non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    console.log(`✓ Phase trouvée, CRV: ${chronoPhase.crv}`);

    const crv = await CRV.findById(chronoPhase.crv);

    if (crv.statut === 'VERROUILLE') {
      console.log('❌ CRV verrouillé - opération refusée');
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    console.log(`✓ CRV non verrouillé (statut: ${crv.statut})`);

    const {
      heureDebutPrevue,
      heureFinPrevue,
      heureDebutReelle,
      heureFinReelle,
      remarques
    } = req.body;

    console.log('\n── CHAMPS À METTRE À JOUR ──');
    if (heureDebutPrevue) {
      chronoPhase.heureDebutPrevue = convertirHeureEnDate(heureDebutPrevue);
      console.log(`   heureDebutPrevue: ${heureDebutPrevue} → ${chronoPhase.heureDebutPrevue}`);
    }
    if (heureFinPrevue) {
      chronoPhase.heureFinPrevue = convertirHeureEnDate(heureFinPrevue);
      console.log(`   heureFinPrevue: ${heureFinPrevue} → ${chronoPhase.heureFinPrevue}`);
    }
    if (heureDebutReelle) {
      chronoPhase.heureDebutReelle = convertirHeureEnDate(heureDebutReelle);
      console.log(`   heureDebutReelle: ${heureDebutReelle} → ${chronoPhase.heureDebutReelle}`);
    }
    if (heureFinReelle) {
      chronoPhase.heureFinReelle = convertirHeureEnDate(heureFinReelle);
      console.log(`   heureFinReelle: ${heureFinReelle} → ${chronoPhase.heureFinReelle}`);
    }
    if (remarques !== undefined) {
      chronoPhase.remarques = remarques;
      console.log(`   remarques: ${remarques || '(vide)'}`);
    }

    await chronoPhase.save();

    // Recharger avec populate pour retourner les données complètes
    const phaseUpdated = await ChronologiePhase.findById(chronoPhase._id).populate('phase');

    console.log('✓ Phase mise à jour avec succès');
    if (phaseUpdated.dureeReelleMinutes) {
      console.log(`   Durée calculée: ${phaseUpdated.dureeReelleMinutes} minutes`);
    }

    req.crvId = chronoPhase.crv;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    console.error('❌ Erreur mettreAJourPhase:', error.message);
    next(error);
  }
};

/**
 * Mettre à jour une phase depuis le contexte CRV
 * @route PUT /api/crv/:crvId/phases/:phaseId
 */
export const mettreAJourPhaseCRV = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ✏️ MISE À JOUR PHASE (via CRV)                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📌 CRV ID: ${req.params.crvId}`);
  console.log(`📌 Phase ID: ${req.params.phaseId}`);
  console.log(`👤 User ID: ${req.user._id}`);
  console.log(`📥 Body:`, JSON.stringify(req.body, null, 2));

  try {
    // Vérifier le CRV
    const crv = await CRV.findById(req.params.crvId);

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé, modification impossible'
      });
    }

    // Trouver la phase
    const chronoPhase = await ChronologiePhase.findById(req.params.phaseId).populate('phase');

    if (!chronoPhase) {
      return res.status(404).json({
        success: false,
        message: 'Phase non trouvée'
      });
    }

    // Vérifier que la phase appartient bien à ce CRV
    if (chronoPhase.crv.toString() !== req.params.crvId) {
      return res.status(400).json({
        success: false,
        message: 'Cette phase n\'appartient pas à ce CRV'
      });
    }

    console.log(`✓ Phase: ${chronoPhase.phase?.libelle || 'N/A'}`);
    console.log(`   Statut actuel: ${chronoPhase.statut}`);

    const {
      statut,
      heureDebutReelle,
      heureFinReelle,
      motifNonRealisation,
      detailMotif,
      remarques
    } = req.body;

    // Mise à jour du statut
    if (statut && ['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'NON_REALISE'].includes(statut)) {
      chronoPhase.statut = statut;
      console.log(`   → Nouveau statut: ${statut}`);
    }

    // Mise à jour des heures (accepte HH:mm ou ISO)
    if (heureDebutReelle !== undefined) {
      chronoPhase.heureDebutReelle = heureDebutReelle ? convertirHeureEnDate(heureDebutReelle) : null;
      console.log(`   → heureDebutReelle: ${heureDebutReelle}`);
    }

    if (heureFinReelle !== undefined) {
      chronoPhase.heureFinReelle = heureFinReelle ? convertirHeureEnDate(heureFinReelle) : null;
      console.log(`   → heureFinReelle: ${heureFinReelle}`);
    }

    // Motif de non-réalisation
    if (motifNonRealisation) {
      if (['NON_NECESSAIRE', 'EQUIPEMENT_INDISPONIBLE', 'PERSONNEL_ABSENT', 'CONDITIONS_METEO', 'AUTRE'].includes(motifNonRealisation)) {
        chronoPhase.motifNonRealisation = motifNonRealisation;
        console.log(`   → motifNonRealisation: ${motifNonRealisation}`);
      }
    }

    if (detailMotif !== undefined) {
      chronoPhase.detailMotif = detailMotif;
    }

    if (remarques !== undefined) {
      chronoPhase.remarques = remarques;
    }

    // Sauvegarder (le hook pre-save calcule dureeReelleMinutes et ecartMinutes)
    await chronoPhase.save();

    // Recalculer la complétude du CRV
    const { calculerCompletude } = await import('../services/crv/crv.service.js');
    await calculerCompletude(crv._id);

    // Recharger avec populate
    const phaseUpdated = await ChronologiePhase.findById(chronoPhase._id).populate('phase');

    console.log('✅ Phase mise à jour avec succès');
    console.log(`   Statut final: ${phaseUpdated.statut}`);
    if (phaseUpdated.dureeReelleMinutes) {
      console.log(`   Durée: ${phaseUpdated.dureeReelleMinutes} minutes`);
    }

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      data: phaseUpdated
    });
  } catch (error) {
    console.error('❌ Erreur mettreAJourPhaseCRV:', error.message);
    next(error);
  }
};
