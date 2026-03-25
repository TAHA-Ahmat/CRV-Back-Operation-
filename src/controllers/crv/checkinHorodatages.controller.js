import Horaire from '../../models/phases/Horaire.js';
import CRV from '../../models/crv/CRV.js';

/**
 * Mettre à jour les horodatages terrain check-in d'un CRV
 * PUT /api/crv/:id/horodatages-checkin
 *
 * Body: { ouvertureComptoirAt: ISO string|null, fermetureComptoirAt: ISO string|null }
 */
export const mettreAJourHorodatagesCheckin = async (req, res) => {
  try {
    const crv = await CRV.findById(req.params.id).populate('horaire vol');

    if (!crv) {
      return res.status(404).json({ success: false, message: 'CRV non trouvé' });
    }

    // Check-in n'a pas de sens sur une arrivée
    if (crv.vol?.typeOperation === 'ARRIVEE') {
      return res.status(400).json({ success: false, message: 'Opérations check-in non applicables à un CRV Arrivée' });
    }

    if (crv.statut === 'VERROUILLE') {
      return res.status(403).json({ success: false, message: 'CRV verrouillé, modification impossible' });
    }

    if (!crv.horaire) {
      return res.status(404).json({ success: false, message: 'Horaire non trouvé pour ce CRV' });
    }

    const { ouvertureComptoirAt, fermetureComptoirAt } = req.body;

    const parseDate = (val, nom) => {
      if (val === null || val === undefined || val === '') return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        throw new Error(`${nom}: date invalide`);
      }
      return d;
    };

    let ouverture, fermeture;
    try {
      ouverture = parseDate(ouvertureComptoirAt, 'ouvertureComptoirAt');
      fermeture = parseDate(fermetureComptoirAt, 'fermetureComptoirAt');
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Cohérence : fermeture ne doit pas être avant ouverture
    if (ouverture && fermeture && fermeture < ouverture) {
      return res.status(400).json({
        success: false,
        message: 'fermetureComptoirAt ne peut pas être antérieur à ouvertureComptoirAt'
      });
    }

    const horaire = await Horaire.findById(crv.horaire._id);
    horaire.ouvertureComptoirAt = ouverture;
    horaire.fermetureComptoirAt = fermeture;
    await horaire.save();

    console.log('[CRV][HORODATAGES_CHECKIN]', {
      crvId: crv._id,
      ouvertureComptoirAt: ouverture,
      fermetureComptoirAt: fermeture,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Horodatages check-in mis à jour',
      data: {
        ouvertureComptoirAt: horaire.ouvertureComptoirAt,
        fermetureComptoirAt: horaire.fermetureComptoirAt
      }
    });
  } catch (error) {
    console.error('[CRV][ERROR][HORODATAGES_CHECKIN]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
