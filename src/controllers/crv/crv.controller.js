import CRV from '../../models/crv/CRV.js';
import Vol from '../../models/flights/Vol.js';
import Horaire from '../../models/phases/Horaire.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import ChargeOperationnelle from '../../models/charges/ChargeOperationnelle.js';
import EvenementOperationnel from '../../models/transversal/EvenementOperationnel.js';
import Observation from '../../models/crv/Observation.js';
import { genererNumeroCRV, calculerCompletude, detecterDoublonCRV, creerVolDepuisMouvement } from '../../services/crv/crv.service.js';
import { initialiserPhasesVol } from '../../services/phases/phase.service.js';

// ============================================================================
//   INSTRUMENTATION AUDIT - LOGS STRUCTURÉS
// ============================================================================

export const creerCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][CREER_CRV]', {
    crvId: null,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const {
      // PATH 1: Depuis bulletin
      mouvementId,
      bulletinId,
      // PATH 2: Hors programme / hors bulletin
      vol: volData,
      // PATH 3: Vol existant (backward compat)
      volId: volIdParam,
      // PATH LEGACY: auto-création
      type,
      date,
      // Commun
      responsableVolId,
      escale,
      forceDoublon,
      confirmationLevel
    } = req.body;

    let volId = volIdParam;
    const escaleCode = (escale || 'TLS').toUpperCase();
    let vol;
    let horaire;
    let bulletinReference = null;

    // ========================================================================
    // PATH 1: CRV depuis bulletin de mouvement
    // ========================================================================
    if (bulletinId && mouvementId) {
      console.log('[CRV][DECISION_CHECK][PATH_BULLETIN]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { bulletinId, mouvementId },
        decision: true, reason: 'Création CRV depuis bulletin de mouvement',
        output: null, timestamp: new Date().toISOString()
      });

      const BulletinMouvement = (await import('../../models/bulletin/BulletinMouvement.js')).default;
      const bulletin = await BulletinMouvement.findById(bulletinId);

      if (!bulletin) {
        return res.status(404).json({
          success: false,
          message: 'Bulletin de mouvement non trouvé'
        });
      }

      const mouvement = bulletin.mouvements.id(mouvementId);
      if (!mouvement) {
        return res.status(404).json({
          success: false,
          message: 'Mouvement non trouvé dans le bulletin'
        });
      }

      // Détection doublon
      const crvExistant = await detecterDoublonCRV(
        mouvement.numeroVol,
        mouvement.dateMouvement,
        bulletin.escale
      );

      if (crvExistant && (!forceDoublon || confirmationLevel !== 2)) {
        return res.status(409).json({
          success: false,
          message: 'Un CRV existe déjà pour ce vol sur cette escale. Pour forcer: forceDoublon=true ET confirmationLevel=2',
          code: 'CRV_DOUBLON',
          crvExistantId: crvExistant._id,
          numeroCRV: crvExistant.numeroCRV
        });
      }

      // Créer Vol depuis mouvement (service dédié)
      vol = await creerVolDepuisMouvement(mouvement, bulletin);
      volId = vol._id;

      // Lier mouvement.vol au Vol créé (mise à jour du sous-document)
      mouvement.vol = vol._id;
      await bulletin.save();

      // Créer Horaire avec heures prévues du bulletin
      horaire = await Horaire.create({
        vol: vol._id,
        heureAtterrisagePrevue: mouvement.heureArriveePrevue || null,
        heureDecollagePrevue: mouvement.heureDepartPrevue || null
      });

      bulletinReference = bulletin._id;

      console.log('[CRV][PATH_BULLETIN_SUCCESS]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { bulletinId, mouvementId },
        decision: true, reason: 'Vol et Horaire créés depuis bulletin',
        output: { volId: vol._id, horaireId: horaire._id },
        timestamp: new Date().toISOString()
      });

    // ========================================================================
    // PATH 2: CRV hors programme / hors bulletin
    // ========================================================================
    } else if (volData && !volId) {
      console.log('[CRV][DECISION_CHECK][PATH_HORS_PROGRAMME]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { volData },
        decision: true, reason: 'Création CRV hors programme',
        output: null, timestamp: new Date().toISOString()
      });

      // Validation champs obligatoires
      const champsRequis = ['numeroVol', 'compagnieAerienne', 'codeIATA', 'dateVol', 'typeOperation', 'typeVolHorsProgramme', 'raisonHorsProgramme'];
      const champsManquants = champsRequis.filter(champ => !volData[champ]);

      if (champsManquants.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Champs obligatoires manquants pour vol hors programme',
          champsManquants
        });
      }

      // Validation aéroports conditionnelle
      if (['ARRIVEE', 'TURN_AROUND'].includes(volData.typeOperation) && !volData.aeroportOrigine) {
        return res.status(400).json({
          success: false,
          message: 'aeroportOrigine requis pour ARRIVEE ou TURN_AROUND'
        });
      }
      if (['DEPART', 'TURN_AROUND'].includes(volData.typeOperation) && !volData.aeroportDestination) {
        return res.status(400).json({
          success: false,
          message: 'aeroportDestination requis pour DEPART ou TURN_AROUND'
        });
      }

      // Détection doublon
      const crvExistant = await detecterDoublonCRV(
        volData.numeroVol,
        new Date(volData.dateVol),
        escaleCode
      );

      if (crvExistant && (!forceDoublon || confirmationLevel !== 2)) {
        return res.status(409).json({
          success: false,
          message: 'Un CRV existe déjà pour ce vol sur cette escale. Pour forcer: forceDoublon=true ET confirmationLevel=2',
          code: 'CRV_DOUBLON',
          crvExistantId: crvExistant._id,
          numeroCRV: crvExistant.numeroCRV
        });
      }

      // Créer Vol hors programme
      vol = await Vol.create({
        numeroVol: volData.numeroVol.toUpperCase(),
        compagnieAerienne: volData.compagnieAerienne,
        codeIATA: volData.codeIATA.toUpperCase(),
        dateVol: new Date(volData.dateVol),
        typeOperation: volData.typeOperation,
        aeroportOrigine: volData.aeroportOrigine?.toUpperCase() || null,
        aeroportDestination: volData.aeroportDestination?.toUpperCase() || null,
        horsProgramme: true, // FORCÉ à true
        typeVolHorsProgramme: volData.typeVolHorsProgramme,
        raisonHorsProgramme: volData.raisonHorsProgramme,
        avion: volData.avion || null,
        statut: 'PROGRAMME'
      });
      volId = vol._id;

      horaire = await Horaire.create({ vol: vol._id });

      console.log('[CRV][PATH_HORS_PROGRAMME_SUCCESS]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { volData },
        decision: true, reason: 'Vol hors programme créé',
        output: { volId: vol._id, horaireId: horaire._id },
        timestamp: new Date().toISOString()
      });

    // ========================================================================
    // PATH 3: Vol existant (backward compat)
    // ========================================================================
    } else if (volId) {
      console.log('[CRV][DECISION_CHECK][PATH_VOL_EXISTANT]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { volId },
        decision: true, reason: 'Création CRV avec Vol existant (backward compat)',
        output: null, timestamp: new Date().toISOString()
      });

      vol = await Vol.findById(volId);
      if (!vol) {
        return res.status(404).json({
          success: false,
          message: 'Vol non trouvé'
        });
      }

      // Détection doublon
      const crvExistant = await detecterDoublonCRV(vol.numeroVol, vol.dateVol, escaleCode);
      if (crvExistant && (!forceDoublon || confirmationLevel !== 2)) {
        return res.status(409).json({
          success: false,
          message: 'Un CRV existe déjà pour ce vol sur cette escale. Pour forcer: forceDoublon=true ET confirmationLevel=2',
          code: 'CRV_DOUBLON',
          crvExistantId: crvExistant._id,
          numeroCRV: crvExistant.numeroCRV
        });
      }

      horaire = await Horaire.create({ vol: vol._id });
      bulletinReference = vol.bulletinMouvementReference || null;

    // ========================================================================
    // PATH LEGACY: auto-création Vol (comportement original préservé)
    // ========================================================================
    } else {
      console.warn('[CRV][LEGACY_PATH_CONFIRMED_BY_USER]', {
        crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { type },
        decision: true, reason: 'Création exceptionnelle confirmée par utilisateur via UI (legacy path)',
        output: null, timestamp: new Date().toISOString()
      });

      let typeOperation = 'DEPART';
      if (type === 'arrivee') typeOperation = 'ARRIVEE';
      else if (type === 'depart') typeOperation = 'DEPART';
      else if (type === 'turnaround') typeOperation = 'TURN_AROUND';

      const count = await Vol.countDocuments();
      vol = await Vol.create({
        numeroVol: `VOL${String(count + 1).padStart(4, '0')}`,
        typeOperation,
        compagnieAerienne: 'Air France',
        codeIATA: 'AF',
        dateVol: date || new Date(),
        statut: 'PROGRAMME'
      });
      volId = vol._id;

      horaire = await Horaire.create({ vol: vol._id });
    }

    // ========================================================================
    // CRÉATION CRV (commun à tous les paths)
    // ========================================================================

    const numeroCRV = await genererNumeroCRV(vol);

    const crv = await CRV.create({
      numeroCRV,
      vol: volId,
      escale: escaleCode,
      horaire: horaire._id,
      creePar: req.user._id,
      responsableVol: responsableVolId || null,
      statut: 'BROUILLON',
      bulletinMouvementReference: bulletinReference,
      crvDoublon: !!forceDoublon
    });

    console.log('[CRV][CRV_CREATED]', {
      crvId: crv._id, userId: req.user?._id || null, role: req.user?.fonction || null,
      input: req.body, decision: true, reason: 'CRV créé avec succès',
      output: { numeroCRV: crv.numeroCRV, statut: crv.statut, doublon: crv.crvDoublon, bulletinRef: !!bulletinReference },
      timestamp: new Date().toISOString()
    });

    await initialiserPhasesVol(crv._id, vol.typeOperation);
    await calculerCompletude(crv._id);

    const crvPopulated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol')
      .populate('bulletinMouvementReference');

    console.log('[CRV][API_SUCCESS][CREER_CRV]', {
      crvId: crv._id, userId: req.user?._id || null, role: req.user?.fonction || null,
      input: req.body, decision: true, reason: 'Création réussie',
      output: {
        numeroCRV: crvPopulated.numeroCRV, statut: crvPopulated.statut, completude: crvPopulated.completude,
        path: bulletinId ? 'bulletin' : (volData ? 'hors-programme' : (volIdParam ? 'vol-existant' : 'legacy'))
      },
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: crvPopulated
    });
  } catch (error) {
    console.error('[CRV][ERROR][CREER_CRV]', {
      crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
      input: req.body, decision: false, reason: error.message,
      output: { stack: error.stack }, timestamp: new Date().toISOString()
    });
    next(error);
  }
};

/**
 * OBTENIR VOLS DU JOUR SANS CRV
 *
 * Retourne les vols d'une date donnée qui ont un bulletin mais pas encore de CRV.
 * Inclut les vols planifiés ET hors programme.
 *
 * @route GET /api/crv/vols-sans-crv?date=YYYY-MM-DD
 */
export const obtenirVolsSansCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][VOLS_SANS_CRV]', {
    crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
    input: { query: req.query }, decision: null, reason: null, output: null, timestamp
  });

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Paramètre date requis (format: YYYY-MM-DD)'
      });
    }

    const dateDebut = new Date(date);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(date);
    dateFin.setHours(23, 59, 59, 999);

    // Vols du jour avec bulletin
    const vols = await Vol.find({
      dateVol: { $gte: dateDebut, $lte: dateFin },
      bulletinMouvementReference: { $ne: null }
    }).populate('bulletinMouvementReference');

    // Filtrer ceux sans CRV
    const volsSansCRV = [];
    for (const v of vols) {
      const crvExistant = await CRV.findOne({ vol: v._id });
      if (!crvExistant) {
        volsSansCRV.push(v);
      }
    }

    console.log('[CRV][API_SUCCESS][VOLS_SANS_CRV]', {
      crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
      input: { date }, decision: true, reason: 'Vols sans CRV récupérés',
      output: { count: volsSansCRV.length, date }, timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: volsSansCRV,
      count: volsSansCRV.length,
      date
    });
  } catch (error) {
    console.error('[CRV][ERROR][VOLS_SANS_CRV]', {
      crvId: null, userId: req.user?._id || null, role: req.user?.fonction || null,
      input: req.query, decision: false, reason: error.message,
      output: { stack: error.stack }, timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const obtenirCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][OBTENIR_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol')
      .populate('verrouillePar');

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const phases = await ChronologiePhase.find({ crv: crv._id })
      .populate('phase')
      .populate('responsable')
      .sort({ 'phase.ordre': 1 });

    const charges = await ChargeOperationnelle.find({ crv: crv._id });

    const evenements = await EvenementOperationnel.find({ crv: crv._id })
      .populate('declarePar')
      .populate('equipementConcerne')
      .populate('personneConcernee')
      .sort({ dateHeureDebut: -1 });

    const observations = await Observation.find({ crv: crv._id })
      .populate('auteur')
      .populate('phaseConcernee')
      .sort({ dateHeure: -1 });

    console.log('[CRV][API_SUCCESS][OBTENIR_CRV]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: req.params.id },
      decision: true,
      reason: 'CRV récupéré',
      output: { statut: crv.statut, completude: crv.completude, nbPhases: phases.length, nbCharges: charges.length },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: {
        crv,
        phases,
        charges,
        evenements,
        observations
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][OBTENIR_CRV]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: req.params.id },
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const listerCRVs = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][LISTER_CRVS]', {
    crvId: null,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { query: req.query },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const {
      statut,
      dateDebut,
      dateFin,
      compagnie,
      numeroVol,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (statut) {
      query.statut = statut;
    }

    if (dateDebut || dateFin) {
      query.dateCreation = {};
      if (dateDebut) query.dateCreation.$gte = new Date(dateDebut);
      if (dateFin) query.dateCreation.$lte = new Date(dateFin);
    }

    const skip = (page - 1) * limit;

    let crvs = await CRV.find(query)
      .populate('vol')
      .populate('creePar')
      .populate('responsableVol')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (compagnie) {
      crvs = crvs.filter(crv => crv.vol && crv.vol.compagnieAerienne === compagnie);
    }

    if (numeroVol) {
      crvs = crvs.filter(crv => crv.vol && crv.vol.numeroVol.includes(numeroVol));
    }

    const total = await CRV.countDocuments(query);

    console.log('[CRV][API_SUCCESS][LISTER_CRVS]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.query,
      decision: true,
      reason: 'Liste récupérée',
      output: { count: crvs.length, total, page: parseInt(page) },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: crvs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][LISTER_CRVS]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.query,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

/**
 * TRANSITIONS DE STATUT AUTORISÉES :
 * BROUILLON → EN_COURS (démarrage du CRV)
 * EN_COURS → TERMINE (finalisation par l'agent)
 * EN_COURS → BROUILLON (retour en brouillon si besoin)
 * TERMINE → EN_COURS (correction avant validation)
 * TERMINE → VALIDE (via validation uniquement)
 * VALIDE → VERROUILLE (via validation uniquement)
 * VERROUILLE → EN_COURS (déverrouillage par MANAGER uniquement)
 */
const TRANSITIONS_STATUT_AUTORISEES = {
  'BROUILLON': ['EN_COURS'],
  'EN_COURS': ['TERMINE', 'BROUILLON'],
  'TERMINE': ['EN_COURS'], // VALIDE et VERROUILLE via routes dédiées
  'VALIDE': [], // Passage à VERROUILLE via validation uniquement
  'VERROUILLE': [], // Déverrouillage via route dédiée
  'ANNULE': [] // Réactivation via route dédiée
};

export const mettreAJourCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][METTRE_A_JOUR_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][METTRE_A_JOUR_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début mise à jour',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id).populate('vol');

    console.log('[CRV][DECISION_CHECK][CRV_EXISTS]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: req.params.id },
      decision: !!crv,
      reason: crv ? 'CRV trouvé' : 'CRV non trouvé',
      output: crv ? { statut: crv.statut } : null,
      timestamp: new Date().toISOString()
    });

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    // Vérification verrouillage
    console.log('[CRV][DECISION_CHECK][CRV_VERROUILLE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { statutActuel: crv.statut },
      decision: crv.statut !== 'VERROUILLE',
      reason: crv.statut === 'VERROUILLE' ? 'CRV verrouillé - modification interdite' : 'CRV modifiable',
      output: { statut: crv.statut },
      timestamp: new Date().toISOString()
    });

    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV verrouillé',
        output: { code: 'CRV_VERROUILLE' },
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé, modification impossible'
      });
    }

    const {
      responsableVol,
      statut,
      confirmationAucunEvenement,
      confirmationAucuneObservation,
      confirmationAucuneCharge,
      vol: volData
    } = req.body;

    // ========== MISE À JOUR DU VOL ==========
    if (volData && crv.vol) {
      console.log('[CRV][VOL_UPDATE_START]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: volData,
        decision: null,
        reason: 'Début mise à jour Vol',
        output: null,
        timestamp: new Date().toISOString()
      });

      const vol = await Vol.findById(crv.vol._id || crv.vol);

      if (vol) {
        if (volData.numeroVol) {
          vol.numeroVol = volData.numeroVol.toUpperCase();
        }
        if (volData.compagnieAerienne) {
          vol.compagnieAerienne = volData.compagnieAerienne;
        }
        if (volData.codeIATA) {
          vol.codeIATA = volData.codeIATA.toUpperCase();
        }
        if (volData.aeroportOrigine) {
          vol.aeroportOrigine = volData.aeroportOrigine.toUpperCase();
        }
        if (volData.aeroportDestination) {
          vol.aeroportDestination = volData.aeroportDestination.toUpperCase();
        }
        if (volData.dateVol) {
          vol.dateVol = new Date(volData.dateVol);
        }

        // Gestion de l'avion (immatriculation + type)
        if (volData.immatriculation || volData.typeAvion) {
          const Avion = (await import('../../models/referentials/Avion.js')).default;
          let avion = null;

          if (volData.immatriculation) {
            avion = await Avion.findOne({ immatriculation: volData.immatriculation.toUpperCase() });

            if (!avion) {
              avion = await Avion.create({
                immatriculation: volData.immatriculation.toUpperCase(),
                typeAvion: volData.typeAvion || 'INCONNU',
                compagnie: volData.compagnieAerienne || vol.compagnieAerienne || 'INCONNU',
                capacitePassagers: 180,
                capaciteFret: 2000
              });
              console.log('[CRV][AVION_CREATED]', {
                crvId: crv._id,
                userId: req.user?._id || null,
                role: req.user?.fonction || null,
                input: volData,
                decision: true,
                reason: 'Avion créé',
                output: { immatriculation: avion.immatriculation },
                timestamp: new Date().toISOString()
              });
            } else if (volData.typeAvion) {
              avion.typeAvion = volData.typeAvion;
              await avion.save();
            }

            vol.avion = avion._id;
          }
        }

        await vol.save();

        console.log('[CRV][VOL_UPDATED]', {
          crvId: crv._id,
          userId: req.user?._id || null,
          role: req.user?.fonction || null,
          input: volData,
          decision: true,
          reason: 'Vol mis à jour',
          output: { volId: vol._id, numeroVol: vol.numeroVol },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Mise à jour du responsable
    if (responsableVol) crv.responsableVol = responsableVol;

    // Validation et mise à jour du statut
    if (statut && statut !== crv.statut) {
      const oldStatus = crv.statut;
      const transitionsAutorisees = TRANSITIONS_STATUT_AUTORISEES[crv.statut] || [];
      const allowed = transitionsAutorisees.includes(statut);

      console.log('[CRV][STATUS_TRANSITION]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { from: oldStatus, to: statut },
        decision: allowed,
        reason: allowed ? 'Transition autorisée' : `Transition ${oldStatus} → ${statut} non autorisée`,
        output: { transitionsAutorisees },
        timestamp: new Date().toISOString()
      });

      if (!allowed) {
        console.warn('[CRV][API_REJECT][TRANSITION_INVALIDE]', {
          crvId: crv._id,
          userId: req.user?._id || null,
          role: req.user?.fonction || null,
          input: { from: oldStatus, to: statut },
          decision: false,
          reason: 'Transition non autorisée',
          output: { code: 'TRANSITION_STATUT_INVALIDE', transitionsAutorisees },
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({
          success: false,
          message: `Transition de statut non autorisée: ${crv.statut} → ${statut}`,
          code: 'TRANSITION_STATUT_INVALIDE',
          transitionsAutorisees: transitionsAutorisees
        });
      }

      crv.statut = statut;
    }

    // Mise à jour des confirmations explicites
    if (confirmationAucunEvenement !== undefined) {
      crv.confirmationAucunEvenement = confirmationAucunEvenement;
    }
    if (confirmationAucuneObservation !== undefined) {
      crv.confirmationAucuneObservation = confirmationAucuneObservation;
    }
    if (confirmationAucuneCharge !== undefined) {
      crv.confirmationAucuneCharge = confirmationAucuneCharge;
    }

    crv.modifiePar = req.user._id;

    await crv.save();

    await calculerCompletude(crv._id);

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('responsableVol');

    console.log('[CRV][API_SUCCESS][METTRE_A_JOUR_CRV]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: true,
      reason: 'Mise à jour réussie',
      output: { statut: crvUpdated.statut, completude: crvUpdated.completude },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      data: crvUpdated
    });
  } catch (error) {
    console.error('[CRV][ERROR][METTRE_A_JOUR_CRV]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const ajouterCharge = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][AJOUTER_CHARGE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][AJOUTER_CHARGE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début ajout charge',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    console.log('[CRV][DECISION_CHECK][CRV_VERROUILLE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { statut: crv.statut },
      decision: crv.statut !== 'VERROUILLE',
      reason: crv.statut === 'VERROUILLE' ? 'CRV verrouillé' : 'CRV modifiable',
      output: null,
      timestamp: new Date().toISOString()
    });

    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV verrouillé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const charge = await ChargeOperationnelle.create({
      crv: crv._id,
      ...req.body
    });

    await calculerCompletude(crv._id);

    console.log('[CRV][API_SUCCESS][AJOUTER_CHARGE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: true,
      reason: 'Charge ajoutée',
      output: { chargeId: charge._id, typeCharge: charge.typeCharge, sensOperation: charge.sensOperation },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: charge
    });
  } catch (error) {
    console.error('[CRV][ERROR][AJOUTER_CHARGE]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const ajouterEvenement = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][AJOUTER_EVENEMENT]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][AJOUTER_EVENEMENT]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début ajout événement',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const evenement = await EvenementOperationnel.create({
      crv: crv._id,
      declarePar: req.user._id,
      ...req.body
    });

    await calculerCompletude(crv._id);

    console.log('[CRV][API_SUCCESS][AJOUTER_EVENEMENT]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: true,
      reason: 'Événement ajouté',
      output: { evenementId: evenement._id, typeEvenement: evenement.typeEvenement, gravite: evenement.gravite },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: evenement
    });
  } catch (error) {
    console.error('[CRV][ERROR][AJOUTER_EVENEMENT]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const ajouterObservation = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][AJOUTER_OBSERVATION]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][AJOUTER_OBSERVATION]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début ajout observation',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const observation = await Observation.create({
      crv: crv._id,
      auteur: req.user._id,
      ...req.body
    });

    await calculerCompletude(crv._id);

    console.log('[CRV][API_SUCCESS][AJOUTER_OBSERVATION]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: true,
      reason: 'Observation ajoutée',
      output: { observationId: observation._id, categorie: observation.categorie },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: observation
    });
  } catch (error) {
    console.error('[CRV][ERROR][AJOUTER_OBSERVATION]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   RECHERCHE FULL-TEXT
// ============================

export const rechercherCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][RECHERCHER_CRV]', {
    crvId: null,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { query: req.query },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      console.warn('[CRV][API_REJECT][PARAM_MANQUANT]', {
        crvId: null,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.query,
        decision: false,
        reason: 'Paramètre de recherche requis',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'Paramètre de recherche requis'
      });
    }

    const searchQuery = q.trim();
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { numeroCRV: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    let crvs = await CRV.find(query)
      .populate('vol')
      .populate('creePar')
      .populate('responsableVol')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (crvs.length === 0 || searchQuery.length >= 2) {
      const allCRVs = await CRV.find({})
        .populate('vol')
        .populate('creePar')
        .populate('responsableVol')
        .sort({ dateCreation: -1 });

      crvs = allCRVs.filter(crv => {
        if (!crv.vol) return false;
        const numeroVol = crv.vol.numeroVol.toLowerCase();
        const compagnie = crv.vol.compagnieAerienne.toLowerCase();
        const search = searchQuery.toLowerCase();
        return numeroVol.includes(search) || compagnie.includes(search);
      }).slice(skip, skip + parseInt(limit));
    }

    const total = crvs.length;

    console.log('[CRV][API_SUCCESS][RECHERCHER_CRV]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { q: searchQuery },
      decision: true,
      reason: 'Recherche effectuée',
      output: { resultats: total },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      query: searchQuery,
      data: crvs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][RECHERCHER_CRV]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.query,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   STATS & KPIs
// ============================

export const obtenirStatsCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][OBTENIR_STATS]', {
    crvId: null,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { query: req.query },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { periode = 'jour', dateDebut, dateFin } = req.query;

    let debut, fin;
    const maintenant = new Date();

    switch (periode) {
      case 'jour':
        debut = new Date(maintenant.setHours(0, 0, 0, 0));
        fin = new Date(maintenant.setHours(23, 59, 59, 999));
        break;
      case 'semaine':
        const jourSemaine = maintenant.getDay();
        const diffDebut = jourSemaine === 0 ? 6 : jourSemaine - 1;
        debut = new Date(maintenant);
        debut.setDate(maintenant.getDate() - diffDebut);
        debut.setHours(0, 0, 0, 0);
        fin = new Date();
        break;
      case 'mois':
        debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'annee':
        debut = new Date(maintenant.getFullYear(), 0, 1);
        fin = new Date(maintenant.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'personnalise':
        if (!dateDebut || !dateFin) {
          console.warn('[CRV][API_REJECT][DATES_MANQUANTES]', {
            crvId: null,
            userId: req.user?._id || null,
            role: req.user?.fonction || null,
            input: req.query,
            decision: false,
            reason: 'dateDebut et dateFin requis pour période personnalisée',
            output: null,
            timestamp: new Date().toISOString()
          });
          return res.status(400).json({
            success: false,
            message: 'dateDebut et dateFin requis pour période personnalisée'
          });
        }
        debut = new Date(dateDebut);
        fin = new Date(dateFin);
        break;
      default:
        console.warn('[CRV][API_REJECT][PERIODE_INVALIDE]', {
          crvId: null,
          userId: req.user?._id || null,
          role: req.user?.fonction || null,
          input: { periode },
          decision: false,
          reason: 'Période invalide',
          output: null,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({
          success: false,
          message: 'Période invalide (jour, semaine, mois, annee, personnalise)'
        });
    }

    const query = {
      dateCreation: {
        $gte: debut,
        $lte: fin
      }
    };

    const totalCRVs = await CRV.countDocuments(query);
    const crvParStatut = await CRV.aggregate([
      { $match: query },
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    const crvs = await CRV.find(query).populate('vol');

    const crvAvecHoraires = await CRV.find(query)
      .populate('horaire')
      .populate('vol');

    let tempsRotationTotal = 0;
    let nbCRVAvecTAT = 0;

    crvAvecHoraires.forEach(crv => {
      if (crv.horaire && crv.horaire.heureArriveeReelle && crv.horaire.heureDepartReelle) {
        const tat = (new Date(crv.horaire.heureDepartReelle) - new Date(crv.horaire.heureArriveeReelle)) / (1000 * 60);
        tempsRotationTotal += tat;
        nbCRVAvecTAT++;
      }
    });

    const tempsRotationMoyen = nbCRVAvecTAT > 0 ? Math.round(tempsRotationTotal / nbCRVAvecTAT) : 0;

    const evenementsRetard = await EvenementOperationnel.countDocuments({
      createdAt: { $gte: debut, $lte: fin },
      typeEvenement: 'RETARD'
    });

    const tauxRetard = totalCRVs > 0 ? Math.round((evenementsRetard / totalCRVs) * 100) : 0;

    const compagniesMap = {};
    crvs.forEach(crv => {
      if (crv.vol && crv.vol.compagnieAerienne) {
        const compagnie = crv.vol.compagnieAerienne;
        compagniesMap[compagnie] = (compagniesMap[compagnie] || 0) + 1;
      }
    });

    const topCompagnies = Object.entries(compagniesMap)
      .map(([compagnie, count]) => ({ compagnie, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const statutsObj = {};
    crvParStatut.forEach(item => {
      statutsObj[item._id] = item.count;
    });

    console.log('[CRV][API_SUCCESS][OBTENIR_STATS]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { periode },
      decision: true,
      reason: 'Stats calculées',
      output: { totalCRVs, periode },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      periode: {
        type: periode,
        debut: debut.toISOString(),
        fin: fin.toISOString()
      },
      stats: {
        totalCRVs,
        crvBrouillon: statutsObj.BROUILLON || 0,
        crvEnCours: statutsObj.EN_COURS || 0,
        crvTermine: statutsObj.TERMINE || 0,
        crvValide: statutsObj.VALIDE || 0,
        crvVerrouille: statutsObj.VERROUILLE || 0,
        tempsRotationMoyen,
        tauxRetard,
        topCompagnies
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][OBTENIR_STATS]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.query,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   EXPORT EXCEL
// ============================

export const exporterCRVExcel = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][EXPORTER_EXCEL]', {
    crvId: null,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { query: req.query },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { dateDebut, dateFin, statut, compagnie, format = 'xlsx' } = req.query;

    const query = {};

    if (statut) {
      query.statut = statut;
    }

    if (dateDebut || dateFin) {
      query.dateCreation = {};
      if (dateDebut) query.dateCreation.$gte = new Date(dateDebut);
      if (dateFin) query.dateCreation.$lte = new Date(dateFin);
    }

    const crvs = await CRV.find(query)
      .populate('vol')
      .populate('creePar')
      .populate('responsableVol')
      .populate('horaire')
      .sort({ dateCreation: -1 })
      .limit(1000);

    let crvsFiltres = crvs;
    if (compagnie) {
      crvsFiltres = crvs.filter(crv => crv.vol && crv.vol.compagnieAerienne === compagnie);
    }

    console.log('[CRV][EXPORT_START]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { format, count: crvsFiltres.length },
      decision: true,
      reason: 'Export démarré',
      output: null,
      timestamp: new Date().toISOString()
    });

    if (format === 'csv') {
      let csv = 'Numéro CRV,Vol,Compagnie,Date Vol,Statut,Complétude %,Créé Par,Date Création\n';

      crvsFiltres.forEach(crv => {
        const ligne = [
          crv.numeroCRV,
          crv.vol ? crv.vol.numeroVol : '',
          crv.vol ? crv.vol.compagnieAerienne : '',
          crv.vol ? new Date(crv.vol.dateVol).toLocaleDateString() : '',
          crv.statut,
          crv.completude,
          crv.creePar ? `${crv.creePar.prenom} ${crv.creePar.nom}` : '',
          new Date(crv.dateCreation).toLocaleDateString()
        ].join(',');
        csv += ligne + '\n';
      });

      console.log('[CRV][EXPORT_SUCCESS]', {
        crvId: null,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { format: 'csv' },
        decision: true,
        reason: 'Export CSV réussi',
        output: { lignes: crvsFiltres.length },
        timestamp: new Date().toISOString()
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=crvs_${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send('\uFEFF' + csv);
    } else {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CRVs');

      worksheet.columns = [
        { header: 'Numéro CRV', key: 'numeroCRV', width: 20 },
        { header: 'Vol', key: 'numeroVol', width: 15 },
        { header: 'Compagnie', key: 'compagnie', width: 25 },
        { header: 'Date Vol', key: 'dateVol', width: 15 },
        { header: 'Type Opération', key: 'typeOperation', width: 15 },
        { header: 'Statut CRV', key: 'statut', width: 15 },
        { header: 'Complétude %', key: 'completude', width: 12 },
        { header: 'Créé Par', key: 'creePar', width: 25 },
        { header: 'Date Création', key: 'dateCreation', width: 15 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      crvsFiltres.forEach(crv => {
        worksheet.addRow({
          numeroCRV: crv.numeroCRV,
          numeroVol: crv.vol ? crv.vol.numeroVol : '',
          compagnie: crv.vol ? crv.vol.compagnieAerienne : '',
          dateVol: crv.vol ? new Date(crv.vol.dateVol).toLocaleDateString('fr-FR') : '',
          typeOperation: crv.vol ? crv.vol.typeOperation : '',
          statut: crv.statut,
          completude: crv.completude,
          creePar: crv.creePar ? `${crv.creePar.prenom} ${crv.creePar.nom}` : '',
          dateCreation: new Date(crv.dateCreation).toLocaleDateString('fr-FR')
        });
      });

      console.log('[CRV][EXPORT_SUCCESS]', {
        crvId: null,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { format: 'xlsx' },
        decision: true,
        reason: 'Export Excel réussi',
        output: { lignes: crvsFiltres.length },
        timestamp: new Date().toISOString()
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=crvs_${new Date().toISOString().split('T')[0]}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('[CRV][ERROR][EXPORTER_EXCEL]', {
      crvId: null,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.query,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   MISE À JOUR HORAIRES
// ============================

export const mettreAJourHoraire = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][METTRE_A_JOUR_HORAIRE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][METTRE_A_JOUR_HORAIRE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début mise à jour horaire',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id).populate('horaire');

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    console.log('[CRV][DECISION_CHECK][CRV_VERROUILLE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { statut: crv.statut },
      decision: crv.statut !== 'VERROUILLE',
      reason: crv.statut === 'VERROUILLE' ? 'CRV verrouillé' : 'CRV modifiable',
      output: null,
      timestamp: new Date().toISOString()
    });

    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV verrouillé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé, modification impossible'
      });
    }

    if (!crv.horaire) {
      console.warn('[CRV][API_REJECT][HORAIRE_NOT_FOUND]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'Horaire non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'Horaire non trouvé pour ce CRV'
      });
    }

    const {
      heureAtterrisagePrevue,
      heureArriveeAuParcPrevue,
      heureDepartDuParcPrevue,
      heureDecollagePrevue,
      heureOuvertureParkingPrevue,
      heureFermetureParkingPrevue,
      heureAtterrissageReelle,
      heureArriveeAuParcReelle,
      heureDepartDuParcReelle,
      heureDecollageReelle,
      heureOuvertureParkingReelle,
      heureFermetureParkingReelle,
      touchdownTime,
      onBlockTime,
      offBlockTime,
      takeoffTime,
      firstDoorOpenTime,
      lastDoorCloseTime,
      remarques
    } = req.body;

    const updateData = {};

    if (heureAtterrisagePrevue) updateData.heureAtterrisagePrevue = new Date(heureAtterrisagePrevue);
    if (heureArriveeAuParcPrevue) updateData.heureArriveeAuParcPrevue = new Date(heureArriveeAuParcPrevue);
    if (heureDepartDuParcPrevue) updateData.heureDepartDuParcPrevue = new Date(heureDepartDuParcPrevue);
    if (heureDecollagePrevue) updateData.heureDecollagePrevue = new Date(heureDecollagePrevue);
    if (heureOuvertureParkingPrevue) updateData.heureOuvertureParkingPrevue = new Date(heureOuvertureParkingPrevue);
    if (heureFermetureParkingPrevue) updateData.heureFermetureParkingPrevue = new Date(heureFermetureParkingPrevue);

    if (heureAtterrissageReelle || touchdownTime) {
      updateData.heureAtterrissageReelle = new Date(heureAtterrissageReelle || touchdownTime);
    }
    if (heureArriveeAuParcReelle || onBlockTime) {
      updateData.heureArriveeAuParcReelle = new Date(heureArriveeAuParcReelle || onBlockTime);
    }
    if (heureDepartDuParcReelle || offBlockTime) {
      updateData.heureDepartDuParcReelle = new Date(heureDepartDuParcReelle || offBlockTime);
    }
    if (heureDecollageReelle || takeoffTime) {
      updateData.heureDecollageReelle = new Date(heureDecollageReelle || takeoffTime);
    }
    if (heureOuvertureParkingReelle || firstDoorOpenTime) {
      updateData.heureOuvertureParkingReelle = new Date(heureOuvertureParkingReelle || firstDoorOpenTime);
    }
    if (heureFermetureParkingReelle || lastDoorCloseTime) {
      updateData.heureFermetureParkingReelle = new Date(heureFermetureParkingReelle || lastDoorCloseTime);
    }

    if (remarques !== undefined) updateData.remarques = remarques;

    const horaire = await Horaire.findById(crv.horaire._id);
    Object.assign(horaire, updateData);
    await horaire.save();

    await calculerCompletude(crv._id);

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('responsableVol');

    console.log('[CRV][API_SUCCESS][METTRE_A_JOUR_HORAIRE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: Object.keys(updateData),
      decision: true,
      reason: 'Horaire mis à jour',
      output: { champsModifies: Object.keys(updateData).length },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      data: {
        crv: crvUpdated,
        horaire: horaire
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][METTRE_A_JOUR_HORAIRE]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   CONFIRMATIONS EXPLICITES
// ============================

export const confirmerAbsence = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][CONFIRMER_ABSENCE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][CONFIRMER_ABSENCE]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: req.body,
    decision: null,
    reason: 'Début confirmation absence',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV verrouillé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé, modification impossible'
      });
    }

    const { type } = req.body;

    console.log('[CRV][DECISION_CHECK][TYPE_ABSENCE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { type },
      decision: ['evenement', 'observation', 'charge'].includes(type),
      reason: ['evenement', 'observation', 'charge'].includes(type) ? 'Type valide' : 'Type invalide',
      output: null,
      timestamp: new Date().toISOString()
    });

    if (!type || !['evenement', 'observation', 'charge'].includes(type)) {
      console.warn('[CRV][API_REJECT][TYPE_INVALIDE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { type },
        decision: false,
        reason: 'Type invalide',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'Type invalide. Valeurs acceptées: evenement, observation, charge'
      });
    }

    switch (type) {
      case 'evenement':
        crv.confirmationAucunEvenement = true;
        break;
      case 'observation':
        crv.confirmationAucuneObservation = true;
        break;
      case 'charge':
        crv.confirmationAucuneCharge = true;
        break;
    }

    crv.modifiePar = req.user._id;
    await crv.save();

    await calculerCompletude(crv._id);

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire');

    console.log('[CRV][API_SUCCESS][CONFIRMER_ABSENCE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { type },
      decision: true,
      reason: `Confirmation ${type} enregistrée`,
      output: { completude: crvUpdated.completude },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      message: `Confirmation "aucun(e) ${type}" enregistrée`,
      data: crvUpdated
    });
  } catch (error) {
    console.error('[CRV][ERROR][CONFIRMER_ABSENCE]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const annulerConfirmationAbsence = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][ANNULER_CONFIRMATION]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV verrouillé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé, modification impossible'
      });
    }

    const { type } = req.body;

    if (!type || !['evenement', 'observation', 'charge'].includes(type)) {
      console.warn('[CRV][API_REJECT][TYPE_INVALIDE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { type },
        decision: false,
        reason: 'Type invalide',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'Type invalide. Valeurs acceptées: evenement, observation, charge'
      });
    }

    switch (type) {
      case 'evenement':
        crv.confirmationAucunEvenement = false;
        break;
      case 'observation':
        crv.confirmationAucuneObservation = false;
        break;
      case 'charge':
        crv.confirmationAucuneCharge = false;
        break;
    }

    crv.modifiePar = req.user._id;
    await crv.save();

    await calculerCompletude(crv._id);

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire');

    console.log('[CRV][API_SUCCESS][ANNULER_CONFIRMATION]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { type },
      decision: true,
      reason: `Confirmation ${type} annulée`,
      output: { completude: crvUpdated.completude },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      message: `Confirmation "aucun(e) ${type}" annulée`,
      data: crvUpdated
    });
  } catch (error) {
    console.error('[CRV][ERROR][ANNULER_CONFIRMATION]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   TRANSITIONS DE STATUT CRV
// ============================

export const demarrerCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][DEMARRER_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][DEMARRER_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: null,
    decision: null,
    reason: 'Début démarrage CRV',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    console.log('[CRV][DECISION_CHECK][CRV_EXISTS]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: req.params.id },
      decision: !!crv,
      reason: crv ? `CRV trouvé - statut: ${crv.statut}` : 'CRV non trouvé',
      output: crv ? { statut: crv.statut } : null,
      timestamp: new Date().toISOString()
    });

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    console.log('[CRV][DECISION_CHECK][STATUT_BROUILLON]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { statutActuel: crv.statut, statutAttendu: 'BROUILLON' },
      decision: crv.statut === 'BROUILLON',
      reason: crv.statut === 'BROUILLON' ? 'Statut BROUILLON OK' : `Statut ${crv.statut} invalide`,
      output: null,
      timestamp: new Date().toISOString()
    });

    if (crv.statut !== 'BROUILLON') {
      console.warn('[CRV][API_REJECT][STATUT_INVALIDE_DEMARRAGE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { statutActuel: crv.statut },
        decision: false,
        reason: `Statut ${crv.statut} invalide pour démarrage`,
        output: { code: 'STATUT_INVALIDE_DEMARRAGE' },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: `Impossible de démarrer un CRV en statut ${crv.statut}. Le CRV doit être en statut BROUILLON.`,
        code: 'STATUT_INVALIDE_DEMARRAGE'
      });
    }

    console.log('[CRV][STATUS_TRANSITION]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: true,
      reason: 'Transition BROUILLON → EN_COURS autorisée',
      output: { from: 'BROUILLON', to: 'EN_COURS' },
      timestamp: new Date().toISOString()
    });

    crv.statut = 'EN_COURS';
    crv.modifiePar = req.user._id;
    await crv.save();

    // EXTENSION 8 - Sync Vol.statut → EN_COURS
    const volDemarrer = await Vol.findById(crv.vol);
    if (volDemarrer) {
      volDemarrer.statut = 'EN_COURS';
      await volDemarrer.save();
      console.log('[CRV][VOL_STATUS_SYNC]', {
        crvId: crv._id, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { crvStatut: 'EN_COURS' }, decision: 'SYNC',
        reason: 'Vol status synchronized with CRV',
        output: { volId: volDemarrer._id, volStatut: 'EN_COURS' },
        timestamp: new Date().toISOString()
      });
    }

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol');

    console.log('[CRV][API_SUCCESS][DEMARRER_CRV]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: true,
      reason: 'CRV démarré avec succès',
      output: { statut: crvUpdated.statut },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      message: 'CRV démarré avec succès',
      data: crvUpdated
    });
  } catch (error) {
    console.error('[CRV][ERROR][DEMARRER_CRV]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const terminerCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][TERMINER_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  console.log('[CRV][TRY_ENTER][TERMINER_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: null,
    decision: null,
    reason: 'Début terminaison CRV',
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    console.log('[CRV][DECISION_CHECK][CRV_EXISTS]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: req.params.id },
      decision: !!crv,
      reason: crv ? `CRV trouvé - statut: ${crv.statut}` : 'CRV non trouvé',
      output: crv ? { statut: crv.statut } : null,
      timestamp: new Date().toISOString()
    });

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    console.log('[CRV][DECISION_CHECK][STATUT_EN_COURS]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { statutActuel: crv.statut, statutAttendu: 'EN_COURS' },
      decision: crv.statut === 'EN_COURS',
      reason: crv.statut === 'EN_COURS' ? 'Statut EN_COURS OK' : `Statut ${crv.statut} invalide`,
      output: null,
      timestamp: new Date().toISOString()
    });

    if (crv.statut !== 'EN_COURS') {
      console.warn('[CRV][API_REJECT][STATUT_INVALIDE_TERMINAISON]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { statutActuel: crv.statut },
        decision: false,
        reason: `Statut ${crv.statut} invalide pour terminaison`,
        output: { code: 'STATUT_INVALIDE_TERMINAISON' },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: `Impossible de terminer un CRV en statut ${crv.statut}. Le CRV doit être en statut EN_COURS.`,
        code: 'STATUT_INVALIDE_TERMINAISON'
      });
    }

    // Recalculer la complétude avant vérification
    const completude = await calculerCompletude(crv._id);

    // Vérifier les conditions de terminaison
    const COMPLETUDE_MINIMALE_TERMINAISON = 50;
    const anomalies = [];

    console.log('[CRV][DECISION_CHECK][COMPLETUDE >= 50%]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { completude, seuil: COMPLETUDE_MINIMALE_TERMINAISON },
      decision: completude >= COMPLETUDE_MINIMALE_TERMINAISON,
      reason: completude >= COMPLETUDE_MINIMALE_TERMINAISON ? 'Complétude suffisante' : 'Complétude insuffisante',
      output: { completude },
      timestamp: new Date().toISOString()
    });

    if (completude < COMPLETUDE_MINIMALE_TERMINAISON) {
      anomalies.push(`Complétude insuffisante: ${completude}% (minimum ${COMPLETUDE_MINIMALE_TERMINAISON}% requis)`);
    }

    // Vérifier que les phases critiques sont traitées
    const phases = await ChronologiePhase.find({ crv: crv._id }).populate('phase');
    const phasesNonTraitees = phases.filter(p =>
      p.statut === 'NON_COMMENCE' && p.phase && p.phase.obligatoire
    );

    console.log('[CRV][DECISION_CHECK][PHASES_OBLIGATOIRES]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { totalPhases: phases.length, phasesNonTraitees: phasesNonTraitees.length },
      decision: phasesNonTraitees.length === 0,
      reason: phasesNonTraitees.length === 0 ? 'Toutes phases obligatoires traitées' : `${phasesNonTraitees.length} phases non traitées`,
      output: { phasesManquantes: phasesNonTraitees.map(p => p.phase?.libelle) },
      timestamp: new Date().toISOString()
    });

    if (phasesNonTraitees.length > 0) {
      const phasesNoms = phasesNonTraitees.map(p => p.phase.libelle).join(', ');
      anomalies.push(`Phases obligatoires non traitées: ${phasesNoms}`);
    }

    if (anomalies.length > 0) {
      console.warn('[CRV][API_REJECT][CONDITIONS_TERMINAISON_NON_SATISFAITES]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { completude },
        decision: false,
        reason: 'Conditions de terminaison non satisfaites',
        output: { anomalies, code: 'CONDITIONS_TERMINAISON_NON_SATISFAITES' },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'Impossible de terminer le CRV',
        code: 'CONDITIONS_TERMINAISON_NON_SATISFAITES',
        anomalies: anomalies,
        completude: completude
      });
    }

    console.log('[CRV][STATUS_TRANSITION]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: true,
      reason: 'Transition EN_COURS → TERMINE autorisée',
      output: { from: 'EN_COURS', to: 'TERMINE' },
      timestamp: new Date().toISOString()
    });

    crv.statut = 'TERMINE';
    crv.modifiePar = req.user._id;
    await crv.save();

    // EXTENSION 8 - Sync Vol.statut → TERMINE
    const volTerminer = await Vol.findById(crv.vol);
    if (volTerminer) {
      volTerminer.statut = 'TERMINE';
      await volTerminer.save();
      console.log('[CRV][VOL_STATUS_SYNC]', {
        crvId: crv._id, userId: req.user?._id || null, role: req.user?.fonction || null,
        input: { crvStatut: 'TERMINE' }, decision: 'SYNC',
        reason: 'Vol status synchronized with CRV',
        output: { volId: volTerminer._id, volStatut: 'TERMINE' },
        timestamp: new Date().toISOString()
      });
    }

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol');

    console.log('[CRV][API_SUCCESS][TERMINER_CRV]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: true,
      reason: 'CRV terminé avec succès',
      output: { statut: crvUpdated.statut, completude },
      timestamp: new Date().toISOString()
    });

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      message: 'CRV terminé avec succès',
      data: crvUpdated,
      completude: completude
    });
  } catch (error) {
    console.error('[CRV][ERROR][TERMINER_CRV]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const obtenirTransitionsPossibles = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][OBTENIR_TRANSITIONS]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const transitions = {
      'BROUILLON': [
        { statut: 'EN_COURS', action: 'demarrer', route: 'POST /api/crv/:id/demarrer' }
      ],
      'EN_COURS': [
        { statut: 'TERMINE', action: 'terminer', route: 'POST /api/crv/:id/terminer' },
        { statut: 'BROUILLON', action: 'retourBrouillon', route: 'PATCH /api/crv/:id' }
      ],
      'TERMINE': [
        { statut: 'EN_COURS', action: 'reprendre', route: 'PATCH /api/crv/:id' },
        { statut: 'VALIDE', action: 'valider', route: 'POST /api/validation/:id/valider' }
      ],
      'VALIDE': [
        { statut: 'VERROUILLE', action: 'verrouiller', route: 'POST /api/validation/:id/valider' }
      ],
      'VERROUILLE': [
        { statut: 'EN_COURS', action: 'deverrouiller', route: 'POST /api/validation/:id/deverrouiller' }
      ],
      'ANNULE': [
        { statut: 'BROUILLON', action: 'reactiver', route: 'POST /api/crv/:id/reactiver' }
      ]
    };

    console.log('[CRV][API_SUCCESS][OBTENIR_TRANSITIONS]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: true,
      reason: 'Transitions récupérées',
      output: { statutActuel: crv.statut, nbTransitions: (transitions[crv.statut] || []).length },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: {
        statutActuel: crv.statut,
        transitionsPossibles: transitions[crv.statut] || [],
        completude: crv.completude
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][OBTENIR_TRANSITIONS]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: null,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   GESTION PERSONNEL AFFECTÉ
// ============================

export const mettreAJourPersonnel = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][METTRE_A_JOUR_PERSONNEL]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { personnelAffecte } = req.body;

    if (!Array.isArray(personnelAffecte)) {
      console.warn('[CRV][API_REJECT][INVALID_PERSONNEL_FORMAT]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { personnelAffecte },
        decision: false,
        reason: 'personnelAffecte doit être un tableau',
        output: { code: 'INVALID_PERSONNEL_FORMAT' },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'personnelAffecte doit être un tableau',
        code: 'INVALID_PERSONNEL_FORMAT'
      });
    }

    for (let i = 0; i < personnelAffecte.length; i++) {
      const personne = personnelAffecte[i];
      if (!personne.nom || !personne.prenom || !personne.fonction) {
        console.warn('[CRV][API_REJECT][INVALID_PERSONNEL_DATA]', {
          crvId: req.params.id,
          userId: req.user?._id || null,
          role: req.user?.fonction || null,
          input: { index: i, personne },
          decision: false,
          reason: `Personne à l'index ${i}: nom, prenom et fonction requis`,
          output: { code: 'INVALID_PERSONNEL_DATA' },
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({
          success: false,
          message: `Personne à l'index ${i}: nom, prenom et fonction sont requis`,
          code: 'INVALID_PERSONNEL_DATA'
        });
      }
    }

    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    console.log('[CRV][PERSONNEL_UPDATE]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { ancienCount: crv.personnelAffecte.length, nouveauCount: personnelAffecte.length },
      decision: true,
      reason: 'Mise à jour personnel (écrasement)',
      output: null,
      timestamp: new Date().toISOString()
    });

    crv.personnelAffecte = personnelAffecte;
    crv.modifiePar = req.user._id;
    await crv.save();

    console.log('[CRV][API_SUCCESS][METTRE_A_JOUR_PERSONNEL]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { count: personnelAffecte.length },
      decision: true,
      reason: 'Personnel mis à jour',
      output: { nbPersonnes: crv.personnelAffecte.length },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Personnel affecté mis à jour (${personnelAffecte.length} personne(s))`,
      data: {
        personnelAffecte: crv.personnelAffecte,
        nbPersonnes: crv.personnelAffecte.length
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][METTRE_A_JOUR_PERSONNEL]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const ajouterPersonnel = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][AJOUTER_PERSONNEL]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { body: req.body, params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { nom, prenom, fonction, matricule, telephone, remarques } = req.body;

    if (!nom || !prenom || !fonction) {
      console.warn('[CRV][API_REJECT][INVALID_PERSONNEL_DATA]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'nom, prenom et fonction requis',
        output: { code: 'INVALID_PERSONNEL_DATA' },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: 'nom, prenom et fonction sont requis',
        code: 'INVALID_PERSONNEL_DATA'
      });
    }

    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: req.body,
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const nouvellePersonne = { nom, prenom, fonction, matricule, telephone, remarques };
    crv.personnelAffecte.push(nouvellePersonne);
    crv.modifiePar = req.user._id;
    await crv.save();

    console.log('[CRV][API_SUCCESS][AJOUTER_PERSONNEL]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: nouvellePersonne,
      decision: true,
      reason: 'Personne ajoutée',
      output: { nbPersonnes: crv.personnelAffecte.length },
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Personne ajoutée au personnel affecté',
      data: {
        personne: crv.personnelAffecte[crv.personnelAffecte.length - 1],
        personnelAffecte: crv.personnelAffecte,
        nbPersonnes: crv.personnelAffecte.length
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][AJOUTER_PERSONNEL]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.body,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const supprimerPersonnel = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][SUPPRIMER_PERSONNEL]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const { id, personneId } = req.params;

    const crv = await CRV.findById(id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id, personneId },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const indexPersonne = crv.personnelAffecte.findIndex(
      p => p._id.toString() === personneId
    );

    if (indexPersonne === -1) {
      console.warn('[CRV][API_REJECT][PERSONNE_NOT_FOUND]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { personneId },
        decision: false,
        reason: 'Personne non trouvée',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'Personne non trouvée dans le personnel affecté'
      });
    }

    crv.personnelAffecte.splice(indexPersonne, 1);
    crv.modifiePar = req.user._id;
    await crv.save();

    console.log('[CRV][API_SUCCESS][SUPPRIMER_PERSONNEL]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { personneId },
      decision: true,
      reason: 'Personne supprimée',
      output: { nbPersonnesRestantes: crv.personnelAffecte.length },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Personne supprimée du personnel affecté',
      data: {
        personnelAffecte: crv.personnelAffecte,
        nbPersonnes: crv.personnelAffecte.length
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][SUPPRIMER_PERSONNEL]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.params,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// ============================
//   SUPPRESSION CRV
// ============================

export const supprimerCRV = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('[CRV][API_ENTER][SUPPRIMER_CRV]', {
    crvId: req.params.id,
    userId: req.user?._id || null,
    role: req.user?.fonction || null,
    input: { params: req.params },
    decision: null,
    reason: null,
    output: null,
    timestamp
  });

  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
      console.warn('[CRV][API_REJECT][CRV_NOT_FOUND]', {
        crvId: req.params.id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { id: req.params.id },
        decision: false,
        reason: 'CRV non trouvé',
        output: null,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    // Vérifier si le CRV est verrouillé
    if (crv.statut === 'VERROUILLE') {
      console.warn('[CRV][API_REJECT][CRV_VERROUILLE]', {
        crvId: crv._id,
        userId: req.user?._id || null,
        role: req.user?.fonction || null,
        input: { statut: crv.statut },
        decision: false,
        reason: 'CRV verrouillé - suppression impossible',
        output: { code: 'CRV_VERROUILLE' },
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer un CRV verrouillé',
        code: 'CRV_VERROUILLE'
      });
    }

    // Supprimer les données associées
    await ChronologiePhase.deleteMany({ crv: crv._id });
    await ChargeOperationnelle.deleteMany({ crv: crv._id });
    await EvenementOperationnel.deleteMany({ crv: crv._id });
    await Observation.deleteMany({ crv: crv._id });

    // Supprimer l'horaire si existe
    if (crv.horaire) {
      await Horaire.findByIdAndDelete(crv.horaire);
    }

    // Supprimer le CRV
    await CRV.findByIdAndDelete(crv._id);

    console.log('[CRV][API_SUCCESS][SUPPRIMER_CRV]', {
      crvId: crv._id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: { id: crv._id },
      decision: true,
      reason: 'CRV supprimé avec toutes ses données associées',
      output: { numeroCRV: crv.numeroCRV },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `CRV ${crv.numeroCRV} supprimé avec succès`
    });
  } catch (error) {
    console.error('[CRV][ERROR][SUPPRIMER_CRV]', {
      crvId: req.params.id,
      userId: req.user?._id || null,
      role: req.user?.fonction || null,
      input: req.params,
      decision: false,
      reason: error.message,
      output: { stack: error.stack },
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};
