import Engin from '../../models/resources/Engin.js';
import AffectationEnginVol from '../../models/resources/AffectationEnginVol.js';
import CRV from '../../models/crv/CRV.js';
import Vol from '../../models/flights/Vol.js';

// ============================
//   RÉFÉRENTIEL ENGINS (PARC MATÉRIEL)
// ============================

/**
 * Lister tous les engins du parc
 * @route GET /api/engins
 */
export const listerEngins = async (req, res, next) => {
  try {
    const { typeEngin, statut, page = 1, limit = 50 } = req.query;

    const query = {};
    if (typeEngin) query.typeEngin = typeEngin;
    if (statut) query.statut = statut;

    const skip = (page - 1) * limit;

    const engins = await Engin.find(query)
      .sort({ typeEngin: 1, numeroEngin: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Engin.countDocuments(query);

    res.status(200).json({
      success: true,
      data: engins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir un engin par ID
 * @route GET /api/engins/:id
 */
export const obtenirEngin = async (req, res, next) => {
  try {
    const engin = await Engin.findById(req.params.id);

    if (!engin) {
      return res.status(404).json({
        success: false,
        message: 'Engin non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: engin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer un nouvel engin dans le parc
 * @route POST /api/engins
 */
export const creerEngin = async (req, res, next) => {
  try {
    const { numeroEngin, typeEngin, marque, modele, remarques } = req.body;

    // Vérifier unicité
    const existant = await Engin.findOne({ numeroEngin: numeroEngin.toUpperCase() });
    if (existant) {
      return res.status(400).json({
        success: false,
        message: `Un engin avec le numéro ${numeroEngin} existe déjà`,
        code: 'ENGIN_DUPLIQUE'
      });
    }

    const engin = await Engin.create({
      numeroEngin: numeroEngin.toUpperCase(),
      typeEngin,
      marque,
      modele,
      remarques,
      statut: 'DISPONIBLE'
    });

    res.status(201).json({
      success: true,
      message: 'Engin créé avec succès',
      data: engin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un engin
 * @route PUT /api/engins/:id
 */
export const mettreAJourEngin = async (req, res, next) => {
  try {
    const engin = await Engin.findById(req.params.id);

    if (!engin) {
      return res.status(404).json({
        success: false,
        message: 'Engin non trouvé'
      });
    }

    const { typeEngin, marque, modele, statut, derniereRevision, prochaineRevision, remarques } = req.body;

    if (typeEngin) engin.typeEngin = typeEngin;
    if (marque !== undefined) engin.marque = marque;
    if (modele !== undefined) engin.modele = modele;
    if (statut) engin.statut = statut;
    if (derniereRevision) engin.derniereRevision = derniereRevision;
    if (prochaineRevision) engin.prochaineRevision = prochaineRevision;
    if (remarques !== undefined) engin.remarques = remarques;

    await engin.save();

    res.status(200).json({
      success: true,
      message: 'Engin mis à jour',
      data: engin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un engin
 * @route DELETE /api/engins/:id
 */
export const supprimerEngin = async (req, res, next) => {
  try {
    const engin = await Engin.findById(req.params.id);

    if (!engin) {
      return res.status(404).json({
        success: false,
        message: 'Engin non trouvé'
      });
    }

    // Vérifier qu'il n'est pas utilisé
    const affectations = await AffectationEnginVol.countDocuments({ engin: engin._id });
    if (affectations > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: cet engin a ${affectations} affectation(s) historique(s)`,
        code: 'ENGIN_EN_UTILISATION'
      });
    }

    await engin.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Engin supprimé'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les engins disponibles (pour sélection)
 * @route GET /api/engins/disponibles
 */
export const listerEnginsDisponibles = async (req, res, next) => {
  try {
    const { typeEngin } = req.query;

    const query = { statut: { $in: ['DISPONIBLE', 'EN_SERVICE'] } };
    if (typeEngin) query.typeEngin = typeEngin;

    const engins = await Engin.find(query)
      .sort({ typeEngin: 1, numeroEngin: 1 });

    res.status(200).json({
      success: true,
      data: engins
    });
  } catch (error) {
    next(error);
  }
};

// ============================
//   AFFECTATION ENGINS AU CRV/VOL
// ============================

/**
 * Obtenir les engins affectés à un CRV
 * @route GET /api/crv/:id/engins
 */
export const obtenirEnginsAffectes = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id).populate('vol');

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    const affectations = await AffectationEnginVol.find({ vol: crv.vol._id || crv.vol })
      .populate('engin')
      .sort({ heureDebut: 1 });

    res.status(200).json({
      success: true,
      data: {
        engins: affectations,
        nbEngins: affectations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour (remplacer) tous les engins affectés à un CRV
 * @route PUT /api/crv/:id/engins
 */
export const mettreAJourEnginsAffectes = async (req, res, next) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           🚜 MISE À JOUR ENGINS AFFECTÉS                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('📌 CRV ID:', req.params.id);
  console.log('📥 Engins reçus:', JSON.stringify(req.body.engins, null, 2));

  try {
    const { engins } = req.body;

    if (!Array.isArray(engins)) {
      return res.status(400).json({
        success: false,
        message: 'engins doit être un tableau',
        code: 'INVALID_FORMAT'
      });
    }

    const crv = await CRV.findById(req.params.id).populate('vol');

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

    const volId = crv.vol._id || crv.vol;

    // Supprimer les anciennes affectations
    await AffectationEnginVol.deleteMany({ vol: volId });
    console.log('   ✓ Anciennes affectations supprimées');

    // Créer les nouvelles affectations
    const nouvellesAffectations = [];

    for (const enginData of engins) {
      const { type, immatriculation, heureDebut, heureFin, utilise, usage, remarques } = enginData;

      // Chercher ou créer l'engin dans le référentiel
      let engin = await Engin.findOne({ numeroEngin: immatriculation?.toUpperCase() });

      if (!engin && immatriculation) {
        // Créer l'engin à la volée s'il n'existe pas
        const typeEnginMap = {
          'tracteur': 'TRACTEUR',
          'chariot_bagages': 'CHARIOT_BAGAGES',
          'chariot_fret': 'CHARIOT_FRET',
          'camion_fret': 'CHARIOT_FRET',
          'passerelle': 'STAIRS',
          'gpu': 'GPU',
          'asu': 'ASU',
          'camion_avitaillement': 'AUTRE',
          'convoyeur': 'CONVOYEUR',
          'autre': 'AUTRE'
        };

        engin = await Engin.create({
          numeroEngin: immatriculation.toUpperCase(),
          typeEngin: typeEnginMap[type?.toLowerCase()] || 'AUTRE',
          statut: 'DISPONIBLE'
        });
        console.log(`   ✓ Engin créé: ${engin.numeroEngin} (${engin.typeEngin})`);
      }

      if (engin) {
        // Mapper le type frontend vers l'usage backend
        const usageMap = {
          'tracteur': 'TRACTAGE',
          'chariot_bagages': 'BAGAGES',
          'chariot_fret': 'FRET',
          'camion_fret': 'FRET',
          'passerelle': 'PASSERELLE',
          'gpu': 'ALIMENTATION_ELECTRIQUE',
          'asu': 'CLIMATISATION',
          'camion_avitaillement': 'CHARGEMENT',
          'convoyeur': 'CHARGEMENT',
          'autre': 'CHARGEMENT'
        };

        // Construire les dates à partir des heures (format HH:mm)
        const today = new Date();
        let dateDebut = today;
        let dateFin = null;

        if (heureDebut) {
          const [hd, md] = heureDebut.split(':');
          dateDebut = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hd), parseInt(md));
        }

        if (heureFin) {
          const [hf, mf] = heureFin.split(':');
          dateFin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hf), parseInt(mf));
        }

        const affectation = await AffectationEnginVol.create({
          vol: volId,
          engin: engin._id,
          heureDebut: dateDebut,
          heureFin: dateFin,
          usage: usage || usageMap[type?.toLowerCase()] || 'CHARGEMENT',
          statut: utilise === false ? 'AFFECTE' : 'TERMINE',
          remarques
        });

        nouvellesAffectations.push(affectation);
        console.log(`   ✓ Affectation créée: ${engin.numeroEngin} (${affectation.usage})`);
      }
    }

    // Récupérer les affectations avec les engins populés
    const affectationsPopulated = await AffectationEnginVol.find({ vol: volId })
      .populate('engin')
      .sort({ heureDebut: 1 });

    console.log(`✅ ${nouvellesAffectations.length} engin(s) affecté(s)`);

    res.status(200).json({
      success: true,
      message: `${nouvellesAffectations.length} engin(s) affecté(s)`,
      data: {
        engins: affectationsPopulated,
        nbEngins: nouvellesAffectations.length
      }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour engins:', error.message);
    next(error);
  }
};

/**
 * Ajouter un engin à un CRV
 * @route POST /api/crv/:id/engins
 */
export const ajouterEnginAuCRV = async (req, res, next) => {
  try {
    const { enginId, heureDebut, heureFin, usage, remarques } = req.body;

    const crv = await CRV.findById(req.params.id).populate('vol');

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const engin = await Engin.findById(enginId);
    if (!engin) {
      return res.status(404).json({
        success: false,
        message: 'Engin non trouvé dans le référentiel'
      });
    }

    const volId = crv.vol._id || crv.vol;

    const affectation = await AffectationEnginVol.create({
      vol: volId,
      engin: enginId,
      heureDebut: heureDebut || new Date(),
      heureFin,
      usage,
      remarques
    });

    const affectationPopulated = await AffectationEnginVol.findById(affectation._id).populate('engin');

    res.status(201).json({
      success: true,
      message: 'Engin affecté au vol',
      data: affectationPopulated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retirer un engin d'un CRV
 * @route DELETE /api/crv/:id/engins/:affectationId
 */
export const retirerEnginDuCRV = async (req, res, next) => {
  try {
    const { id, affectationId } = req.params;

    const crv = await CRV.findById(id);

    if (!crv) {
      return res.status(404).json({
        success: false,
        message: 'CRV non trouvé'
      });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({
        success: false,
        message: 'CRV verrouillé'
      });
    }

    const affectation = await AffectationEnginVol.findById(affectationId);

    if (!affectation) {
      return res.status(404).json({
        success: false,
        message: 'Affectation non trouvée'
      });
    }

    await affectation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Engin retiré du vol'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les types d'engins disponibles
 * @route GET /api/engins/types
 */
export const obtenirTypesEngins = async (req, res, next) => {
  try {
    const types = [
      { value: 'TRACTEUR', label: 'Tracteur', usages: ['TRACTAGE'] },
      { value: 'CHARIOT_BAGAGES', label: 'Chariot bagages', usages: ['BAGAGES'] },
      { value: 'CHARIOT_FRET', label: 'Chariot fret', usages: ['FRET'] },
      { value: 'GPU', label: 'GPU (Ground Power Unit)', usages: ['ALIMENTATION_ELECTRIQUE'] },
      { value: 'ASU', label: 'ASU (Air Starter Unit)', usages: ['CLIMATISATION'] },
      { value: 'STAIRS', label: 'Passerelle/Escalier', usages: ['PASSERELLE'] },
      { value: 'CONVOYEUR', label: 'Convoyeur à bande', usages: ['CHARGEMENT', 'BAGAGES', 'FRET'] },
      { value: 'AUTRE', label: 'Autre', usages: ['CHARGEMENT'] }
    ];

    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
};
