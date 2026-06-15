import mongoose from 'mongoose';
import Phase from '../models/phases/Phase.js';
import { connectDB } from '../config/db.js';

/**
 * PHASES ARRIVEE - Processus métier validé
 *
 * Ordre chronologique :
 * 1. Briefing équipes (KI, KU, KF, manutentionnaires, chauffeurs)
 * 2. Arrivée avion (atterrissage + roulage + calage)
 * 3. Ouverture des soutes
 * 4. Déchargement (bagages/fret)
 * 5. Livraison bagages (soute → carrousel)
 * 6. Débarquement passagers
 * 7. Mise en condition cabine (facultatif - prestation hôtelière + nettoyage)
 * 8. Débriefing clôture (facultatif)
 */
const phasesArrivee = [
  {
    code: 'ARR_BRIEFING',
    libelle: 'Briefing équipes',
    typeOperation: 'ARRIVEE',
    categorie: 'BRIEFING',
    macroPhase: 'DEBUT',
    ordre: 1,
    dureeStandardMinutes: 10,
    obligatoire: true,
    referenceTemporelle: 'ETA',
    offsetMinutesDefaut: 120,
    description: 'Briefing avec les équipes KI, KU, KF, manutentionnaires et chauffeurs avant arrivée avion'
  },
  {
    code: 'ARR_ARRIVEE_AVION',
    libelle: 'Arrivée avion',
    typeOperation: 'ARRIVEE',
    categorie: 'PISTE',
    macroPhase: 'DEBUT',
    typeTemporel: 'INSTANT',
    ordre: 2,
    dureeStandardMinutes: 15,
    obligatoire: true,
    referenceTemporelle: 'ETA',
    offsetMinutesDefaut: 0,
    description: 'Arrivée de l\'avion : atterrissage, roulage vers parking et calage/sécurisation'
  },
  {
    code: 'ARR_OUVERTURE_SOUTES',
    libelle: 'Ouverture des soutes',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    typeTemporel: 'INSTANT',
    ordre: 3,
    dureeStandardMinutes: 5,
    obligatoire: true,
    referenceTemporelle: 'CALAGE',
    offsetMinutesDefaut: -3,
    description: 'Ouverture des soutes de l\'avion pour préparer le déchargement'
  },
  {
    code: 'ARR_DECHARGEMENT',
    libelle: 'Déchargement',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 4,
    dureeStandardMinutes: 25,
    obligatoire: true,
    referenceTemporelle: 'CALAGE',
    offsetMinutesDefaut: -5,
    description: 'Déchargement des bagages et fret des soutes vers les chariots'
  },
  {
    code: 'ARR_LIVRAISON_BAGAGES',
    libelle: 'Livraison bagages',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 5,
    dureeStandardMinutes: 15,
    obligatoire: true,
    description: 'Acheminement des bagages des chariots vers le carrousel en zone publique'
  },
  {
    code: 'ARR_DEBARQUEMENT_PAX',
    libelle: 'Débarquement passagers',
    typeOperation: 'ARRIVEE',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 6,
    dureeStandardMinutes: 20,
    obligatoire: true,
    description: 'Débarquement de tous les passagers de l\'avion'
  },
  {
    code: 'ARR_MISE_CONDITION_CABINE',
    libelle: 'Mise en condition cabine',
    typeOperation: 'ARRIVEE',
    categorie: 'NETTOYAGE',
    macroPhase: 'FIN',
    ordre: 7,
    dureeStandardMinutes: 30,
    obligatoire: false,
    description: 'Chargement prestation hôtelière et nettoyage cabine (facultatif selon rotation)'
  },
  {
    code: 'ARR_DEBRIEFING',
    libelle: 'Débriefing clôture',
    typeOperation: 'ARRIVEE',
    categorie: 'BRIEFING',
    macroPhase: 'FIN',
    ordre: 8,
    dureeStandardMinutes: 10,
    obligatoire: false,
    description: 'Débriefing de clôture avec les équipes (facultatif)'
  }
];

const phasesDepart = [
  {
    code: 'DEP_INSPECTION',
    libelle: 'Inspection pré-vol',
    typeOperation: 'DEPART',
    categorie: 'TECHNIQUE',
    macroPhase: 'DEBUT',
    ordre: 1,
    dureeStandardMinutes: 15,
    obligatoire: true,
    description: 'Inspection technique avant vol'
  },
  {
    code: 'DEP_AVITAILLEMENT',
    libelle: 'Avitaillement carburant',
    typeOperation: 'DEPART',
    categorie: 'AVITAILLEMENT',
    macroPhase: 'REALISATION',
    ordre: 2,
    dureeStandardMinutes: 20,
    obligatoire: true,
    description: 'Ravitaillement en carburant'
  },
  {
    code: 'DEP_NETTOYAGE',
    libelle: 'Nettoyage cabine',
    typeOperation: 'DEPART',
    categorie: 'NETTOYAGE',
    macroPhase: 'REALISATION',
    ordre: 3,
    dureeStandardMinutes: 30,
    obligatoire: true,
    description: 'Nettoyage et préparation cabine'
  },
  {
    code: 'DEP_CHECKIN',
    libelle: 'Enregistrement passagers',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 4,
    dureeStandardMinutes: 75,
    obligatoire: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'checkin.ouverture',
    slaConfigKeyFin: 'checkin.fermeture',
    description: 'Ouverture et fermeture des comptoirs d\'enregistrement (SLA: réf. STD/ETD, configuré par compagnie)'
  },
  {
    code: 'DEP_CHARG_SOUTE',
    libelle: 'Chargement soute',
    typeOperation: 'DEPART',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 5,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Chargement bagages et fret'
  },
  {
    code: 'DEP_BOARDING',
    libelle: 'Embarquement & fermeture gate',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 6,
    dureeStandardMinutes: 25,
    obligatoire: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'boarding.debut',
    slaConfigKeyFin: 'boarding.fermetureGate',
    description: 'Embarquement passagers et fermeture porte d\'embarquement (SLA: réf. ETD, configuré par compagnie)'
  },
  {
    code: 'DEP_FERMETURE',
    libelle: 'Fermeture des portes',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 7,
    dureeStandardMinutes: 3,
    obligatoire: true,
    description: 'Fermeture et sécurisation des portes'
  },
  {
    code: 'DEP_REPOUSSAGE',
    libelle: 'Repoussage',
    typeOperation: 'DEPART',
    categorie: 'PISTE',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 8,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Repoussage de l\'avion'
  },
  {
    code: 'DEP_ROULAGE',
    libelle: 'Roulage vers piste',
    typeOperation: 'DEPART',
    categorie: 'PISTE',
    macroPhase: 'FIN',
    typeTemporel: 'DEBUT_FIN',
    ordre: 9,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Roulage vers la piste de décollage'
  },
];

const phasesTurnAround = [
  {
    code: 'TA_ATTERRISSAGE',
    libelle: 'Atterrissage',
    typeOperation: 'TURN_AROUND',
    categorie: 'PISTE',
    macroPhase: 'DEBUT',
    typeTemporel: 'INSTANT',
    ordre: 1,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Atterrissage de l\'avion sur la piste'
  },
  {
    code: 'TA_ROULAGE_ARR',
    libelle: 'Roulage vers parking',
    typeOperation: 'TURN_AROUND',
    categorie: 'PISTE',
    macroPhase: 'DEBUT',
    typeTemporel: 'DEBUT_FIN',
    ordre: 2,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Roulage de l\'avion vers le parking assigné'
  },
  {
    code: 'TA_CALAGE',
    libelle: 'Calage et sécurisation',
    typeOperation: 'TURN_AROUND',
    categorie: 'PISTE',
    macroPhase: 'DEBUT',
    typeTemporel: 'INSTANT',
    ordre: 3,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Mise en place des cales et sécurisation de l\'avion'
  },
  {
    code: 'TA_PASSERELLE',
    libelle: 'Installation passerelle',
    typeOperation: 'TURN_AROUND',
    categorie: 'PASSAGERS',
    macroPhase: 'DEBUT',
    typeTemporel: 'DEBUT_FIN',
    ordre: 4,
    dureeStandardMinutes: 3,
    obligatoire: true,
    description: 'Installation de la passerelle passagers'
  },
  {
    code: 'TA_DEBARQ_PAX',
    libelle: 'Débarquement passagers',
    typeOperation: 'TURN_AROUND',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 5,
    dureeStandardMinutes: 20,
    obligatoire: true,
    description: 'Débarquement de tous les passagers'
  },
  {
    code: 'TA_DECHARG_SOUTE',
    libelle: 'Déchargement soute',
    typeOperation: 'TURN_AROUND',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 6,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Déchargement des bagages et fret'
  },
  {
    code: 'TA_LIVRAISON_BAGAGES',
    libelle: 'Livraison bagages au carrousel',
    typeOperation: 'TURN_AROUND',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 7,
    dureeStandardMinutes: 15,
    obligatoire: true,
    description: 'Acheminement des bagages de la soute vers le carrousel en zone publique'
  },
  {
    code: 'TA_NETTOYAGE',
    libelle: 'Nettoyage cabine',
    typeOperation: 'TURN_AROUND',
    categorie: 'NETTOYAGE',
    macroPhase: 'REALISATION',
    ordre: 8,
    dureeStandardMinutes: 30,
    obligatoire: true,
    description: 'Nettoyage et préparation cabine'
  },
  {
    code: 'TA_AVITAILLEMENT',
    libelle: 'Avitaillement carburant',
    typeOperation: 'TURN_AROUND',
    categorie: 'AVITAILLEMENT',
    macroPhase: 'REALISATION',
    ordre: 9,
    dureeStandardMinutes: 20,
    obligatoire: false,
    description: 'Ravitaillement en carburant'
  },
  {
    code: 'TA_CHECKIN',
    libelle: 'Enregistrement passagers',
    typeOperation: 'TURN_AROUND',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 10,
    dureeStandardMinutes: 75,
    obligatoire: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'checkin.ouverture',
    slaConfigKeyFin: 'checkin.fermeture',
    description: 'Ouverture et fermeture des comptoirs d\'enregistrement (SLA: réf. STD/ETD, configuré par compagnie)'
  },
  {
    code: 'TA_CHARG_SOUTE',
    libelle: 'Chargement soute',
    typeOperation: 'TURN_AROUND',
    categorie: 'BAGAGE',
    macroPhase: 'REALISATION',
    ordre: 11,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Chargement bagages et fret'
  },
  {
    code: 'TA_BOARDING',
    libelle: 'Embarquement & fermeture gate',
    typeOperation: 'TURN_AROUND',
    categorie: 'PASSAGERS',
    macroPhase: 'REALISATION',
    ordre: 12,
    dureeStandardMinutes: 25,
    obligatoire: true,
    slaMode: 'DEADLINE',
    referenceTemporelle: 'ETD',
    slaConfigKeyDebut: 'boarding.debut',
    slaConfigKeyFin: 'boarding.fermetureGate',
    description: 'Embarquement passagers et fermeture porte d\'embarquement (SLA: réf. ETD, configuré par compagnie)'
  },
  {
    code: 'TA_FERMETURE',
    libelle: 'Fermeture des portes',
    typeOperation: 'TURN_AROUND',
    categorie: 'PASSAGERS',
    macroPhase: 'FIN',
    typeTemporel: 'INSTANT',
    ordre: 13,
    dureeStandardMinutes: 3,
    obligatoire: true,
    description: 'Fermeture et sécurisation des portes'
  },
];

const phasesCommunes = [
  {
    code: 'COM_CONTROLE_SECU',
    libelle: 'Contrôle sécurité',
    typeOperation: 'COMMUN',
    categorie: 'SECURITE',
    macroPhase: 'REALISATION',
    ordre: 100,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Contrôles de sécurité réglementaires'
  },
  {
    code: 'COM_CATERING',
    libelle: 'Catering (approvisionnement repas)',
    typeOperation: 'COMMUN',
    categorie: 'TECHNIQUE',
    macroPhase: 'REALISATION',
    ordre: 101,
    dureeStandardMinutes: 20,
    obligatoire: false,
    description: 'Approvisionnement en repas et boissons pour le vol'
  },
  {
    code: 'COM_MAINTENANCE_LEGERE',
    libelle: 'Maintenance légère',
    typeOperation: 'COMMUN',
    categorie: 'TECHNIQUE',
    macroPhase: 'REALISATION',
    ordre: 102,
    dureeStandardMinutes: 30,
    obligatoire: false,
    description: 'Interventions techniques légères (vérifications, petites réparations)'
  },
  {
    code: 'COM_REMISE_DOCUMENTS',
    libelle: 'Remise documents de vol',
    typeOperation: 'COMMUN',
    categorie: 'TECHNIQUE',
    macroPhase: 'FIN',
    ordre: 103,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Remise du dossier de vol au commandant de bord (loadsheet, manifest, documents)'
  }
];

// Toutes les phases regroupées (exporté pour les tests)
export const toutesPhases = [...phasesArrivee, ...phasesDepart, ...phasesTurnAround, ...phasesCommunes];

/**
 * Seed des phases opérationnelles en base de données.
 *
 * Mode par défaut : UPSERT (idempotent, sans perte de données)
 *   → Ajoute les phases manquantes, met à jour les existantes
 *   → Ne supprime rien
 *
 * Mode force-reset : DESTRUCTIF (supprime tout puis recrée)
 *   → CLI : node seedPhases.js --force-reset
 *
 * @param {boolean} forceReset - Si true, supprime toutes les phases avant insertion
 * @returns {{ created: number, updated: number, total: number }}
 */
export const seedPhases = async (forceReset = false) => {
  try {
    await connectDB();

    let created = 0;
    let updated = 0;

    if (forceReset) {
      console.log('[SEED] Mode FORCE RESET — suppression de toutes les phases');
      await Phase.deleteMany({});
      await Phase.insertMany(toutesPhases);
      created = toutesPhases.length;
      console.log(`[SEED] ${created} phases insérées (reset complet)`);
    } else {
      console.log('[SEED] Mode UPSERT — ajout/mise à jour sans suppression');

      for (const phase of toutesPhases) {
        const result = await Phase.findOneAndUpdate(
          { code: phase.code, typeOperation: phase.typeOperation },
          { $set: phase },
          { upsert: true, new: true, rawResult: true }
        );

        if (result.lastErrorObject?.updatedExisting) {
          updated++;
        } else {
          created++;
        }
      }

      console.log(`[SEED] ${created} phases créées, ${updated} phases mises à jour`);
    }

    const total = await Phase.countDocuments();
    console.log(`[SEED] Total en base : ${total} phases`);
    console.log(`   - Arrivée: ${phasesArrivee.length}`);
    console.log(`   - Départ: ${phasesDepart.length}`);
    console.log(`   - Turn-Around: ${phasesTurnAround.length}`);
    console.log(`   - Communes: ${phasesCommunes.length}`);

    return { created, updated, total };
  } catch (error) {
    console.error('[SEED] Erreur lors de l\'initialisation des phases:', error);
    throw error;
  }
};

// Point d'entrée CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const forceReset = process.argv.includes('--force-reset');

  if (forceReset) {
    console.log('⚠️  Mode --force-reset activé : toutes les phases seront supprimées et recréées');
  }

  seedPhases(forceReset)
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(() => {
      mongoose.connection.close();
      process.exit(1);
    });
}
