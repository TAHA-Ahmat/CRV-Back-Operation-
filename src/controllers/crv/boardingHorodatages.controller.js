import Horaire from '../../models/phases/Horaire.js';
import CRV from '../../models/crv/CRV.js';

/**
 * Mettre à jour les horodatages terrain boarding d'un CRV
 * PUT /api/crv/:id/horodatages-boarding
 *
 * Body: { debutBoardingAt: ISO string|null, fermetureGateAt: ISO string|null }
 */
export const mettreAJourHorodatagesBoarding = async (req, res) => {
  try {
    const crv = await CRV.findById(req.params.id).populate('horaire vol');

    if (!crv) {
      return res.status(404).json({ success: false, message: 'CRV non trouvé' });
    }

    // Boarding n'a pas de sens sur une arrivée
    if (crv.vol?.typeOperation === 'ARRIVEE') {
      return res.status(400).json({ success: false, message: 'Opérations boarding non applicables à un CRV Arrivée' });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({ success: false, message: 'CRV verrouillé, modification impossible' });
    }

    if (!crv.horaire) {
      return res.status(404).json({ success: false, message: 'Horaire non trouvé pour ce CRV' });
    }

    const { debutBoardingAt, fermetureGateAt } = req.body;

    // Validation : dates valides ou null
    const parseDate = (val, nom) => {
      if (val === null || val === undefined || val === '') return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        throw new Error(`${nom}: date invalide`);
      }
      return d;
    };

    let debut, fermeture;
    try {
      debut = parseDate(debutBoardingAt, 'debutBoardingAt');
      fermeture = parseDate(fermetureGateAt, 'fermetureGateAt');
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Cohérence : fermeture gate ne doit pas être avant début boarding
    if (debut && fermeture && fermeture < debut) {
      return res.status(400).json({
        success: false,
        message: 'fermetureGateAt ne peut pas être antérieur à debutBoardingAt'
      });
    }

    const horaire = await Horaire.findById(crv.horaire._id);
    horaire.debutBoardingAt = debut;
    horaire.fermetureGateAt = fermeture;
    await horaire.save();

    console.log('[CRV][HORODATAGES_BOARDING]', {
      crvId: crv._id,
      debutBoardingAt: debut,
      fermetureGateAt: fermeture,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Horodatages boarding mis à jour',
      data: {
        debutBoardingAt: horaire.debutBoardingAt,
        fermetureGateAt: horaire.fermetureGateAt
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][HORODATAGES_BOARDING]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
