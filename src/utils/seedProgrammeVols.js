/**
 * Script de seed pour Programme de Vols
 *
 * Cree un programme de vols de test avec des vols exemple.
 * Usage: npm run seed:programme-vols
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import des modeles
import ProgrammeVol from '../models/flights/ProgrammeVol.js';
import VolProgramme from '../models/flights/VolProgramme.js';
import Personne from '../models/security/Personne.js';

// ══════════════════════════════════════════════════════════════════════════
// DONNEES DE TEST
// ══════════════════════════════════════════════════════════════════════════

const programmeData = {
  nom: 'HIVER_2025_2026',
  edition: 'N°01/17-dec.-25',
  description: 'Programme de vols saison hiver 2025-2026',
  dateDebut: new Date('2025-10-26'),
  dateFin: new Date('2026-03-28'),
  statut: 'ACTIF',
  actif: true
};

// Vols de test (format reel aeronautique)
const volsData = [
  // LUNDI (jour 1)
  {
    joursSemaine: [1],
    numeroVol: 'ET939',
    typeAvion: 'B737-800',
    version: '16C135Y',
    provenance: 'ADD',
    heureArrivee: '09:15',
    destination: 'ADD',
    heureDepart: '10:25',
    observations: 'Du 26 Oct. 25 au 28 Mars 26',
    categorieVol: 'INTERNATIONAL'
  },
  {
    joursSemaine: [1, 4],
    numeroVol: 'MS885',
    typeAvion: 'B737-800',
    version: '24C120Y',
    provenance: 'CAI',
    heureArrivee: '11:30',
    destination: 'CAI',
    heureDepart: '12:45',
    observations: 'Du 27 Oct. 25 au 29 Mars 26',
    categorieVol: 'INTERNATIONAL'
  },
  {
    joursSemaine: [1, 4],
    numeroVol: 'ET3620',
    typeAvion: 'B777F',
    version: 'CARGO',
    provenance: 'ADD',
    heureArrivee: '14:00',
    destination: 'LOS',
    heureDepart: '16:00',
    observations: 'CARGO - Du 28 Oct. 25 au 30 Mars 26',
    categorieVol: 'CARGO'
  },

  // MARDI (jour 2)
  {
    joursSemaine: [2, 4, 6],
    numeroVol: 'TK044',
    typeAvion: 'A330-300',
    version: '28C261Y',
    provenance: 'IST',
    heureArrivee: '04:50',
    destination: 'IST',
    heureDepart: '06:15',
    observations: 'Du 29 Oct. 25 au 28 Mars 26 - NIGHT STOP',
    categorieVol: 'INTERNATIONAL'
  },
  {
    joursSemaine: [2, 5],
    numeroVol: 'AF904',
    typeAvion: 'A350-900',
    version: '34J291Y',
    provenance: 'CDG',
    heureArrivee: '23:45',
    destination: 'CDG',
    heureDepart: '01:30',
    departLendemain: true,
    observations: 'Du 27 Oct. 25 au 29 Mars 26',
    categorieVol: 'INTERNATIONAL'
  },

  // MERCREDI (jour 3)
  {
    joursSemaine: [3, 6],
    numeroVol: 'MS2961',
    typeAvion: 'A330F',
    version: 'CARGO',
    provenance: 'CAI',
    heureArrivee: '12:00',
    destination: 'LOS',
    heureDepart: '14:30',
    observations: 'CARGO - Horaires variables',
    categorieVol: 'CARGO'
  },
  {
    joursSemaine: [3],
    numeroVol: 'KP039',
    typeAvion: 'B737-700',
    version: '12C108Y',
    provenance: 'DLA',
    heureArrivee: '15:00',
    destination: 'DLA',
    heureDepart: '16:30',
    observations: 'Du 30 Oct. 25 au 25 Mars 26',
    categorieVol: 'REGIONAL'
  },

  // Ethiopian quotidien
  {
    joursSemaine: [0, 1, 2, 3, 4, 5, 6],
    numeroVol: 'ET939',
    typeAvion: 'B737-800',
    version: '16C135Y',
    provenance: 'ADD',
    heureArrivee: '09:15',
    destination: 'ADD',
    heureDepart: '10:25',
    observations: 'Vol quotidien',
    categorieVol: 'INTERNATIONAL'
  },

  // DIMANCHE (jour 0)
  {
    joursSemaine: [0],
    numeroVol: 'RW205',
    typeAvion: 'A330-200',
    version: '30C200Y',
    provenance: 'KGL',
    heureArrivee: '16:00',
    destination: 'KGL',
    heureDepart: '17:30',
    observations: 'Rwanda Air - Saisonnier',
    categorieVol: 'INTERNATIONAL'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════

async function seedProgrammeVols() {
  try {
    // Connexion a la base
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/crv';
    console.log('Connexion a MongoDB:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('Connecte a MongoDB');

    // Trouver un utilisateur admin pour createdBy
    let adminUser = await Personne.findOne({ role: 'SUPERVISEUR' });
    if (!adminUser) {
      adminUser = await Personne.findOne();
    }

    if (!adminUser) {
      console.log('Aucun utilisateur trouve. Creation d\'un utilisateur temporaire...');
      adminUser = await Personne.create({
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@ths-aero.com',
        password: 'admin123',
        role: 'SUPERVISEUR',
        matricule: 'ADMIN001'
      });
    }

    console.log(`Utilisateur: ${adminUser.nom} ${adminUser.prenom}`);

    // Verifier si le programme existe deja
    const existingProgramme = await ProgrammeVol.findOne({ nom: programmeData.nom });
    if (existingProgramme) {
      console.log(`Le programme "${programmeData.nom}" existe deja.`);
      console.log(`ID: ${existingProgramme._id}`);
      console.log(`Vols: ${existingProgramme.nombreVols}`);

      const response = await askQuestion('Voulez-vous le supprimer et recreer? (o/n): ');
      if (response.toLowerCase() !== 'o') {
        console.log('Operation annulee.');
        await mongoose.disconnect();
        process.exit(0);
      }

      // Supprimer les vols existants
      await VolProgramme.deleteMany({ programme: existingProgramme._id });
      await ProgrammeVol.findByIdAndDelete(existingProgramme._id);
      console.log('Programme existant supprime.');
    }

    // Creer le programme
    console.log('\nCreation du programme...');
    const programme = await ProgrammeVol.create({
      ...programmeData,
      createdBy: adminUser._id
    });
    console.log(`Programme cree: ${programme.nom} (ID: ${programme._id})`);

    // Creer les vols
    console.log('\nAjout des vols...');
    let ordre = 1;
    for (const volData of volsData) {
      const vol = await VolProgramme.create({
        ...volData,
        programme: programme._id,
        ordre: ordre++,
        createdBy: adminUser._id
      });
      console.log(`  + ${vol.numeroVol} (${vol.joursTexte})`);
    }

    // Mettre a jour les stats du programme
    const nombreVols = await VolProgramme.countDocuments({ programme: programme._id });
    const compagnies = await VolProgramme.getCompagnies(programme._id);
    await ProgrammeVol.findByIdAndUpdate(programme._id, {
      nombreVols,
      compagnies
    });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('PROGRAMME CREE AVEC SUCCES');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Nom: ${programme.nom}`);
    console.log(`ID: ${programme._id}`);
    console.log(`Vols: ${nombreVols}`);
    console.log(`Compagnies: ${compagnies.join(', ')}`);
    console.log('');
    console.log('Pour generer le PDF:');
    console.log(`  GET /api/programmes-vol/${programme._id}/telecharger-pdf`);
    console.log('');
    console.log('Pour l\'apercu JSON:');
    console.log(`  GET /api/programmes-vol/${programme._id}/export-pdf`);

    await mongoose.disconnect();
    console.log('\nDeconnecte de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Erreur:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Fonction utilitaire pour poser une question
function askQuestion(question) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Execution
seedProgrammeVols();
