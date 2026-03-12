import BulletinMouvement from '../../models/bulletin/BulletinMouvement.js';
import CRV from '../../models/crv/CRV.js';
import Vol from '../../models/flights/Vol.js';
import mongoose from 'mongoose';

/**
 * SERVICE STATISTIQUES COMPARATIVES
 *
 * Compare les donnees previsionnelles (Bulletin) avec les donnees reelles (CRV)
 * pour fournir des indicateurs de performance et de conformite.
 *
 * HIERARCHIE DE VERITE:
 * - Programme de vol: Prevision long terme (6 mois)
 * - Bulletin de mouvement: Information court terme (3-4 jours)
 * - CRV: Realite operationnelle (seule preuve)
 *
 * REGLES METIER:
 * - Un vol est considere comme opere uniquement s'il a un CRV VALIDE ou VERROUILLE
 * - Un vol annonce mais sans CRV = vol non realise
 * - Un CRV sans mouvement dans le bulletin = vol imprévu (hors bulletin)
 */

// ══════════════════════════════════════════════════════════════════════════
// STATISTIQUES PAR BULLETIN
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtient les statistiques comparatives pour un bulletin
 * @param {String} bulletinId - ID du bulletin
 * @returns {Object} Statistiques detaillees
 */
export const getStatistiquesBulletin = async (bulletinId) => {
  const bulletin = await BulletinMouvement.findById(bulletinId);
  if (!bulletin) {
    throw new Error('Bulletin non trouve');
  }

  // Recuperer tous les vols de la periode du bulletin
  const dateDebut = new Date(bulletin.dateDebut);
  dateDebut.setHours(0, 0, 0, 0);
  const dateFin = new Date(bulletin.dateFin);
  dateFin.setHours(23, 59, 59, 999);

  // Vols annonces dans le bulletin (hors annules)
  const mouvementsAnnonces = bulletin.mouvements.filter(m => m.statutMouvement !== 'ANNULE');
  const mouvementsAnnules = bulletin.mouvements.filter(m => m.statutMouvement === 'ANNULE');
  const mouvementsHorsProgramme = bulletin.mouvements.filter(m => m.origine === 'HORS_PROGRAMME');

  // Recuperer les CRV de la periode
  const crvs = await CRV.find({
    createdAt: { $gte: dateDebut, $lte: dateFin },
    escale: bulletin.escale,
    statut: { $in: ['VALIDE', 'VERROUILLE'] }
  }).populate('vol', 'numeroVol dateVol horsProgramme');

  // Construire les ensembles pour comparaison
  const volsAnnonces = new Set(mouvementsAnnonces.map(m => `${m.numeroVol}_${m.dateMouvement.toISOString().split('T')[0]}`));
  const volsOperes = new Set(crvs.map(crv => {
    const dateVol = crv.vol?.dateVol || crv.createdAt;
    return `${crv.vol?.numeroVol}_${dateVol.toISOString().split('T')[0]}`;
  }));

  // Calculer les intersections et differences
  const volsAnnoncesEtOperes = [...volsAnnonces].filter(v => volsOperes.has(v));
  const volsAnnoncesNonOperes = [...volsAnnonces].filter(v => !volsOperes.has(v));
  const volsOperesNonAnnonces = [...volsOperes].filter(v => !volsAnnonces.has(v));

  // Calculer le taux de realisation
  const tauxRealisation = mouvementsAnnonces.length > 0
    ? Math.round((volsAnnoncesEtOperes.length / mouvementsAnnonces.length) * 100)
    : 0;

  return {
    bulletin: {
      id: bulletin._id,
      numeroBulletin: bulletin.numeroBulletin,
      escale: bulletin.escale,
      periode: {
        debut: bulletin.dateDebut,
        fin: bulletin.dateFin
      },
      statut: bulletin.statut
    },

    annonces: {
      total: bulletin.mouvements.length,
      actifs: mouvementsAnnonces.length,
      annules: mouvementsAnnules.length,
      horsProgramme: mouvementsHorsProgramme.length,
      parOrigine: {
        programme: bulletin.nombreMouvementsProgramme,
        horsProgramme: bulletin.nombreMouvementsHorsProgramme,
        ajustement: bulletin.mouvements.filter(m => m.origine === 'AJUSTEMENT').length
      }
    },

    operes: {
      total: crvs.length,
      valides: crvs.filter(c => c.statut === 'VALIDE').length,
      verrouilles: crvs.filter(c => c.statut === 'VERROUILLE').length
    },

    comparaison: {
      annoncesEtOperes: volsAnnoncesEtOperes.length,
      annoncesNonOperes: volsAnnoncesNonOperes.length,
      operesNonAnnonces: volsOperesNonAnnonces.length,
      tauxRealisation: tauxRealisation,
      tauxConformite: volsOperes.size > 0
        ? Math.round((volsAnnoncesEtOperes.length / volsOperes.size) * 100)
        : 0
    },

    details: {
      volsAnnoncesNonOperes: volsAnnoncesNonOperes,
      volsOperesNonAnnonces: volsOperesNonAnnonces
    }
  };
};

// ══════════════════════════════════════════════════════════════════════════
// STATISTIQUES PAR PERIODE
// ══════════════════════════════════════════════════════════════════════════

/**
 * Obtient les statistiques comparatives pour une periode
 * @param {Object} params - Parametres (escale, dateDebut, dateFin)
 * @returns {Object} Statistiques detaillees
 */
export const getStatistiquesPeriode = async ({ escale, dateDebut, dateFin }) => {
  const debut = new Date(dateDebut);
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(23, 59, 59, 999);

  // Bulletins de la periode
  const bulletins = await BulletinMouvement.find({
    escale: escale.toUpperCase(),
    $or: [
      { dateDebut: { $gte: debut, $lte: fin } },
      { dateFin: { $gte: debut, $lte: fin } },
      { dateDebut: { $lte: debut }, dateFin: { $gte: fin } }
    ]
  });

  // Tous les mouvements des bulletins
  let totalMouvements = 0;
  let mouvementsActifs = 0;
  let mouvementsAnnules = 0;
  let mouvementsHorsProgramme = 0;

  const volsAnnonces = new Set();

  bulletins.forEach(bulletin => {
    bulletin.mouvements.forEach(mvt => {
      totalMouvements++;
      if (mvt.statutMouvement === 'ANNULE') {
        mouvementsAnnules++;
      } else {
        mouvementsActifs++;
        const key = `${mvt.numeroVol}_${mvt.dateMouvement.toISOString().split('T')[0]}`;
        volsAnnonces.add(key);
      }
      if (mvt.origine === 'HORS_PROGRAMME') {
        mouvementsHorsProgramme++;
      }
    });
  });

  // CRV de la periode
  const crvs = await CRV.find({
    escale: escale.toUpperCase(),
    createdAt: { $gte: debut, $lte: fin },
    statut: { $in: ['VALIDE', 'VERROUILLE'] }
  }).populate('vol', 'numeroVol dateVol');

  const volsOperes = new Set();
  crvs.forEach(crv => {
    const dateVol = crv.vol?.dateVol || crv.createdAt;
    const key = `${crv.vol?.numeroVol}_${dateVol.toISOString().split('T')[0]}`;
    volsOperes.add(key);
  });

  // Comparaisons
  const annoncesEtOperes = [...volsAnnonces].filter(v => volsOperes.has(v)).length;
  const annoncesNonOperes = [...volsAnnonces].filter(v => !volsOperes.has(v)).length;
  const operesNonAnnonces = [...volsOperes].filter(v => !volsAnnonces.has(v)).length;

  return {
    periode: {
      escale,
      dateDebut: debut,
      dateFin: fin,
      nombreBulletins: bulletins.length
    },

    annonces: {
      total: totalMouvements,
      actifs: mouvementsActifs,
      annules: mouvementsAnnules,
      horsProgramme: mouvementsHorsProgramme,
      volsUniques: volsAnnonces.size
    },

    operes: {
      total: crvs.length,
      volsUniques: volsOperes.size
    },

    comparaison: {
      annoncesEtOperes,
      annoncesNonOperes,
      operesNonAnnonces,
      tauxRealisation: mouvementsActifs > 0
        ? Math.round((annoncesEtOperes / mouvementsActifs) * 100)
        : 0,
      tauxConformite: volsOperes.size > 0
        ? Math.round((annoncesEtOperes / volsOperes.size) * 100)
        : 0
    }
  };
};

// ══════════════════════════════════════════════════════════════════════════
// STATISTIQUES VOLS HORS PROGRAMME
// ══════════════════════════════════════════════════════════════════════════

/**
 * Analyse les vols hors programme pour une periode
 * @param {Object} params - Parametres (escale, dateDebut, dateFin)
 * @returns {Object} Analyse des vols hors programme
 */
export const analyseVolsHorsProgramme = async ({ escale, dateDebut, dateFin }) => {
  const debut = new Date(dateDebut);
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(23, 59, 59, 999);

  // Vols hors programme dans les bulletins
  const bulletins = await BulletinMouvement.find({
    escale: escale.toUpperCase(),
    dateDebut: { $gte: debut },
    dateFin: { $lte: fin }
  });

  const volsHPBulletin = [];
  bulletins.forEach(bulletin => {
    bulletin.mouvements
      .filter(m => m.origine === 'HORS_PROGRAMME')
      .forEach(m => {
        volsHPBulletin.push({
          bulletinId: bulletin._id,
          numeroBulletin: bulletin.numeroBulletin,
          numeroVol: m.numeroVol,
          date: m.dateMouvement,
          type: m.typeHorsProgramme,
          raison: m.raisonHorsProgramme
        });
      });
  });

  // CRV de vols hors programme (via Vol.horsProgramme)
  const crvs = await CRV.find({
    escale: escale.toUpperCase(),
    createdAt: { $gte: debut, $lte: fin },
    statut: { $in: ['VALIDE', 'VERROUILLE'] }
  }).populate({
    path: 'vol',
    match: { horsProgramme: true },
    select: 'numeroVol dateVol typeVolHorsProgramme raisonHorsProgramme'
  });

  const volsHPCRV = crvs
    .filter(crv => crv.vol) // Filtre les vols non hors programme
    .map(crv => ({
      crvId: crv._id,
      numeroCRV: crv.numeroCRV,
      numeroVol: crv.vol.numeroVol,
      date: crv.vol.dateVol,
      type: crv.vol.typeVolHorsProgramme,
      raison: crv.vol.raisonHorsProgramme
    }));

  // Agreger par type
  const parType = {};
  [...volsHPBulletin, ...volsHPCRV].forEach(vol => {
    const type = vol.type || 'AUTRE';
    if (!parType[type]) {
      parType[type] = { annonces: 0, operes: 0 };
    }
  });

  volsHPBulletin.forEach(vol => {
    const type = vol.type || 'AUTRE';
    parType[type].annonces++;
  });

  volsHPCRV.forEach(vol => {
    const type = vol.type || 'AUTRE';
    parType[type].operes++;
  });

  return {
    periode: { escale, dateDebut: debut, dateFin: fin },

    annonces: {
      total: volsHPBulletin.length,
      details: volsHPBulletin
    },

    operes: {
      total: volsHPCRV.length,
      details: volsHPCRV
    },

    parType,

    recommandations: volsHPBulletin.length > 10
      ? ['Nombre eleve de vols hors programme - Envisager une mise a jour du programme saisonnier']
      : []
  };
};

// ══════════════════════════════════════════════════════════════════════════
// ECARTS ET ANOMALIES
// ══════════════════════════════════════════════════════════════════════════

/**
 * Detecte les ecarts entre prevision et realite
 * @param {String} bulletinId - ID du bulletin
 * @returns {Object} Liste des ecarts detectes
 */
export const detecterEcarts = async (bulletinId) => {
  const bulletin = await BulletinMouvement.findById(bulletinId);
  if (!bulletin) {
    throw new Error('Bulletin non trouve');
  }

  const dateDebut = new Date(bulletin.dateDebut);
  dateDebut.setHours(0, 0, 0, 0);
  const dateFin = new Date(bulletin.dateFin);
  dateFin.setHours(23, 59, 59, 999);

  // CRV de la periode avec horaires
  const crvs = await CRV.find({
    escale: bulletin.escale,
    createdAt: { $gte: dateDebut, $lte: dateFin }
  }).populate('vol', 'numeroVol dateVol')
    .populate('horaire');

  const ecarts = {
    volsNonOperes: [],
    volsImprevis: [],
    ecartsHoraires: []
  };

  // Construire map des mouvements
  const mouvementsMap = new Map();
  bulletin.mouvements.forEach(mvt => {
    if (mvt.statutMouvement !== 'ANNULE') {
      const key = `${mvt.numeroVol}_${mvt.dateMouvement.toISOString().split('T')[0]}`;
      mouvementsMap.set(key, mvt);
    }
  });

  // Construire map des CRV
  const crvsMap = new Map();
  crvs.forEach(crv => {
    const dateVol = crv.vol?.dateVol || crv.createdAt;
    const key = `${crv.vol?.numeroVol}_${dateVol.toISOString().split('T')[0]}`;
    crvsMap.set(key, crv);
  });

  // Vols annonces non operes
  mouvementsMap.forEach((mvt, key) => {
    if (!crvsMap.has(key)) {
      ecarts.volsNonOperes.push({
        numeroVol: mvt.numeroVol,
        date: mvt.dateMouvement,
        heureArriveePrevue: mvt.heureArriveePrevue,
        heureDepartPrevue: mvt.heureDepartPrevue,
        origine: mvt.origine
      });
    }
  });

  // Vols operes non annonces
  crvsMap.forEach((crv, key) => {
    if (!mouvementsMap.has(key)) {
      ecarts.volsImprevis.push({
        crvId: crv._id,
        numeroCRV: crv.numeroCRV,
        numeroVol: crv.vol?.numeroVol,
        date: crv.vol?.dateVol || crv.createdAt,
        statut: crv.statut
      });
    }
  });

  // Ecarts horaires (pour les vols annonces ET operes)
  mouvementsMap.forEach((mvt, key) => {
    const crv = crvsMap.get(key);
    if (crv && crv.horaire) {
      const horaire = crv.horaire;

      // Ecart arrivee
      if (mvt.heureArriveePrevue && horaire.heureAtterrissageReelle) {
        const prevue = new Date(mvt.heureArriveePrevue);
        const reelle = new Date(horaire.heureAtterrissageReelle);
        const ecartMinutes = Math.round((reelle - prevue) / 60000);

        if (Math.abs(ecartMinutes) > 15) { // Seuil de 15 minutes
          ecarts.ecartsHoraires.push({
            numeroVol: mvt.numeroVol,
            date: mvt.dateMouvement,
            type: 'ARRIVEE',
            prevue: mvt.heureArriveePrevue,
            reelle: horaire.heureAtterrissageReelle,
            ecartMinutes
          });
        }
      }

      // Ecart depart
      if (mvt.heureDepartPrevue && horaire.heureDecollageReelle) {
        const prevue = new Date(mvt.heureDepartPrevue);
        const reelle = new Date(horaire.heureDecollageReelle);
        const ecartMinutes = Math.round((reelle - prevue) / 60000);

        if (Math.abs(ecartMinutes) > 15) {
          ecarts.ecartsHoraires.push({
            numeroVol: mvt.numeroVol,
            date: mvt.dateMouvement,
            type: 'DEPART',
            prevue: mvt.heureDepartPrevue,
            reelle: horaire.heureDecollageReelle,
            ecartMinutes
          });
        }
      }
    }
  });

  return {
    bulletinId: bulletin._id,
    numeroBulletin: bulletin.numeroBulletin,
    periode: {
      debut: bulletin.dateDebut,
      fin: bulletin.dateFin
    },
    ecarts,
    resume: {
      volsNonOperes: ecarts.volsNonOperes.length,
      volsImprevis: ecarts.volsImprevis.length,
      ecartsHoraires: ecarts.ecartsHoraires.length
    }
  };
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════

export default {
  getStatistiquesBulletin,
  getStatistiquesPeriode,
  analyseVolsHorsProgramme,
  detecterEcarts
};
