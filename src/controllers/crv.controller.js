import CRV from '../models/CRV.js';
import Vol from '../models/Vol.js';
import Horaire from '../models/Horaire.js';
import ChronologiePhase from '../models/ChronologiePhase.js';
import ChargeOperationnelle from '../models/ChargeOperationnelle.js';
import EvenementOperationnel from '../models/EvenementOperationnel.js';
import Observation from '../models/Observation.js';
import { genererNumeroCRV, calculerCompletude } from '../services/crv.service.js';
import { initialiserPhasesVol } from '../services/phase.service.js';

export const creerCRV = async (req, res, next) => {
  try {
    const { volId, responsableVolId } = req.body;

    const vol = await Vol.findById(volId);
    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    const numeroCRV = await genererNumeroCRV(vol);

    const horaire = await Horaire.create({
      vol: volId
    });

    const crv = await CRV.create({
      numeroCRV,
      vol: volId,
      horaire: horaire._id,
      creePar: req.user._id,
      responsableVol: responsableVolId,
      statut: 'BROUILLON'
    });

    await initialiserPhasesVol(crv._id, vol.typeOperation);

    await calculerCompletude(crv._id);

    const crvPopulated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol');

    res.status(201).json({
      success: true,
      data: crvPopulated
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirCRV = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id)
      .populate('vol')
      .populate('horaire')
      .populate('creePar')
      .populate('responsableVol')
      .populate('verrouillePar');

    if (!crv) {
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
    next(error);
  }
};

export const listerCRVs = async (req, res, next) => {
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
    next(error);
  }
};

export const mettreAJourCRV = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id);

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

    const { responsableVol, statut } = req.body;

    if (responsableVol) crv.responsableVol = responsableVol;
    if (statut) crv.statut = statut;

    crv.modifiePar = req.user._id;

    await crv.save();

    await calculerCompletude(crv._id);

    const crvUpdated = await CRV.findById(crv._id)
      .populate('vol')
      .populate('horaire')
      .populate('responsableVol');

    req.crvId = crv._id;

    res.status(200).json({
      success: true,
      data: crvUpdated
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterCharge = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id);

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

    const charge = await ChargeOperationnelle.create({
      crv: crv._id,
      ...req.body
    });

    await calculerCompletude(crv._id);

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: charge
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterEvenement = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
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

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: evenement
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterObservation = async (req, res, next) => {
  try {
    const crv = await CRV.findById(req.params.id);

    if (!crv) {
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

    req.crvId = crv._id;

    res.status(201).json({
      success: true,
      data: observation
    });
  } catch (error) {
    next(error);
  }
};

// ============================
//   RECHERCHE FULL-TEXT
// ============================

export const rechercherCRV = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paramètre de recherche requis'
      });
    }

    const searchQuery = q.trim();
    const skip = (page - 1) * limit;

    // Recherche multi-critères
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

    // Recherche sur numéro de vol (après populate)
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
    next(error);
  }
};

// ============================
//   STATS & KPIs
// ============================

export const obtenirStatsCRV = async (req, res, next) => {
  try {
    const { periode = 'jour', dateDebut, dateFin } = req.query;

    // Calcul des dates selon la période
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
          return res.status(400).json({
            success: false,
            message: 'dateDebut et dateFin requis pour période personnalisée'
          });
        }
        debut = new Date(dateDebut);
        fin = new Date(dateFin);
        break;
      default:
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

    // Statistiques générales
    const totalCRVs = await CRV.countDocuments(query);
    const crvParStatut = await CRV.aggregate([
      { $match: query },
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    // CRVs avec données populées
    const crvs = await CRV.find(query).populate('vol');

    // Calcul temps moyen de rotation (TAT)
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

    // Taux de retard
    const evenementsRetard = await EvenementOperationnel.countDocuments({
      createdAt: { $gte: debut, $lte: fin },
      typeEvenement: 'RETARD'
    });

    const tauxRetard = totalCRVs > 0 ? Math.round((evenementsRetard / totalCRVs) * 100) : 0;

    // Top compagnies
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

    // Statistiques par statut
    const statutsObj = {};
    crvParStatut.forEach(item => {
      statutsObj[item._id] = item.count;
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
    next(error);
  }
};

// ============================
//   EXPORT EXCEL
// ============================

export const exporterCRVExcel = async (req, res, next) => {
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
      .limit(1000); // Limite de sécurité

    // Filtrer par compagnie si nécessaire
    let crvsFiltres = crvs;
    if (compagnie) {
      crvsFiltres = crvs.filter(crv => crv.vol && crv.vol.compagnieAerienne === compagnie);
    }

    if (format === 'csv') {
      // Export CSV
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

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=crvs_${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send('\uFEFF' + csv); // BOM pour Excel UTF-8
    } else {
      // Export Excel (nécessite ExcelJS)
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CRVs');

      // Configuration des colonnes
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

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Ajout des données
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

      // Réponse
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=crvs_${new Date().toISOString().split('T')[0]}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    next(error);
  }
};
