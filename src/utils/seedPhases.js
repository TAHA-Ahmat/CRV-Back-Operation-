import Phase from '../models/Phase.js';
import { connectDB } from '../config/db.js';

const phasesArrivee = [
  {
    code: 'ARR_ATTERRISSAGE',
    libelle: 'Atterrissage',
    typeOperation: 'ARRIVEE',
    categorie: 'PISTE',
    ordre: 1,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Atterrissage de l\'avion sur la piste'
  },
  {
    code: 'ARR_ROULAGE',
    libelle: 'Roulage vers parking',
    typeOperation: 'ARRIVEE',
    categorie: 'PISTE',
    ordre: 2,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Roulage de l\'avion vers le parking assigné'
  },
  {
    code: 'ARR_CALAGE',
    libelle: 'Calage et sécurisation',
    typeOperation: 'ARRIVEE',
    categorie: 'PISTE',
    ordre: 3,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Mise en place des cales et sécurisation de l\'avion'
  },
  {
    code: 'ARR_PASSERELLE',
    libelle: 'Installation passerelle',
    typeOperation: 'ARRIVEE',
    categorie: 'PASSAGERS',
    ordre: 4,
    dureeStandardMinutes: 3,
    obligatoire: true,
    description: 'Installation de la passerelle passagers'
  },
  {
    code: 'ARR_DEBARQ_PAX',
    libelle: 'Débarquement passagers',
    typeOperation: 'ARRIVEE',
    categorie: 'PASSAGERS',
    ordre: 5,
    dureeStandardMinutes: 20,
    obligatoire: true,
    description: 'Débarquement de tous les passagers'
  },
  {
    code: 'ARR_DECHARG_SOUTE',
    libelle: 'Déchargement soute',
    typeOperation: 'ARRIVEE',
    categorie: 'BAGAGE',
    ordre: 6,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Déchargement des bagages et fret'
  }
];

const phasesDepart = [
  {
    code: 'DEP_INSPECTION',
    libelle: 'Inspection pré-vol',
    typeOperation: 'DEPART',
    categorie: 'TECHNIQUE',
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
    ordre: 3,
    dureeStandardMinutes: 30,
    obligatoire: true,
    description: 'Nettoyage et préparation cabine'
  },
  {
    code: 'DEP_CHARG_SOUTE',
    libelle: 'Chargement soute',
    typeOperation: 'DEPART',
    categorie: 'BAGAGE',
    ordre: 4,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Chargement bagages et fret'
  },
  {
    code: 'DEP_EMBARQ_PAX',
    libelle: 'Embarquement passagers',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    ordre: 5,
    dureeStandardMinutes: 25,
    obligatoire: true,
    description: 'Embarquement de tous les passagers'
  },
  {
    code: 'DEP_FERMETURE',
    libelle: 'Fermeture des portes',
    typeOperation: 'DEPART',
    categorie: 'PASSAGERS',
    ordre: 6,
    dureeStandardMinutes: 3,
    obligatoire: true,
    description: 'Fermeture et sécurisation des portes'
  },
  {
    code: 'DEP_REPOUSSAGE',
    libelle: 'Repoussage',
    typeOperation: 'DEPART',
    categorie: 'PISTE',
    ordre: 7,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Repoussage de l\'avion'
  },
  {
    code: 'DEP_ROULAGE',
    libelle: 'Roulage vers piste',
    typeOperation: 'DEPART',
    categorie: 'PISTE',
    ordre: 8,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Roulage vers la piste de décollage'
  },
  {
    code: 'DEP_DECOLLAGE',
    libelle: 'Décollage',
    typeOperation: 'DEPART',
    categorie: 'PISTE',
    ordre: 9,
    dureeStandardMinutes: 5,
    obligatoire: true,
    description: 'Décollage de l\'avion'
  }
];

const phasesCommunes = [
  {
    code: 'COM_CONTROLE_SECU',
    libelle: 'Contrôle sécurité',
    typeOperation: 'COMMUN',
    categorie: 'SECURITE',
    ordre: 100,
    dureeStandardMinutes: 10,
    obligatoire: true,
    description: 'Contrôles de sécurité réglementaires'
  }
];

export const seedPhases = async () => {
  try {
    await connectDB();

    await Phase.deleteMany({});
    console.log('🗑️  Phases existantes supprimées');

    const toutesPhases = [...phasesArrivee, ...phasesDepart, ...phasesCommunes];

    await Phase.insertMany(toutesPhases);

    console.log(`✅ ${toutesPhases.length} phases créées avec succès`);
    console.log(`   - Arrivée: ${phasesArrivee.length}`);
    console.log(`   - Départ: ${phasesDepart.length}`);
    console.log(`   - Communes: ${phasesCommunes.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des phases:', error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedPhases();
}
