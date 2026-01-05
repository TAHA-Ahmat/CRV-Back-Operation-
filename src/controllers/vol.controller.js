import Vol from '../models/Vol.js';
import Avion from '../models/Avion.js';

export const creerVol = async (req, res, next) => {
  try {
    const vol = await Vol.create(req.body);

    const volPopulated = await Vol.findById(vol._id).populate('avion');

    res.status(201).json({
      success: true,
      data: volPopulated
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirVol = async (req, res, next) => {
  try {
    const vol = await Vol.findById(req.params.id).populate('avion');

    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: vol
    });
  } catch (error) {
    next(error);
  }
};

export const listerVols = async (req, res, next) => {
  try {
    const {
      dateDebut,
      dateFin,
      compagnie,
      statut,
      typeOperation,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (dateDebut || dateFin) {
      query.dateVol = {};
      if (dateDebut) query.dateVol.$gte = new Date(dateDebut);
      if (dateFin) query.dateVol.$lte = new Date(dateFin);
    }

    if (compagnie) {
      query.compagnieAerienne = compagnie;
    }

    if (statut) {
      query.statut = statut;
    }

    if (typeOperation) {
      query.typeOperation = typeOperation;
    }

    const skip = (page - 1) * limit;

    const vols = await Vol.find(query)
      .populate('avion')
      .sort({ dateVol: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vol.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vols,
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

export const mettreAJourVol = async (req, res, next) => {
  try {
    const vol = await Vol.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('avion');

    if (!vol) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: vol
    });
  } catch (error) {
    next(error);
  }
};
