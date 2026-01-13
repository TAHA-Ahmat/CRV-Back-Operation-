/**
 * Script d'import des données de vols depuis vols-data.json
 *
 * Usage: node scripts/importVolsData.js
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Config - Utiliser la config existante de l'app
import { connectDB } from '../src/config/db.js';

// Import des modèles
import ProgrammeVol from '../src/models/flights/ProgrammeVol.js';
import VolProgramme from '../src/models/flights/VolProgramme.js';
import '../src/models/security/Personne.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

const PROGRAMMES_CONFIG = {
  'hiver_2024_2025': {
    nom: 'HIVER_2024_2025',
    dateDebut: '2024-10-27',
    dateFin: '2025-03-29',
    edition: 'N°01/Import',
    description: 'Programme Hiver 2024-2025 - Import automatique'
  },
  'hiver_2025_2026': {
    nom: 'HIVER_2025_2026',
    dateDebut: '2025-10-26',
    dateFin: '2026-03-28',
    edition: 'N°01/Import',
    description: 'Programme Hiver 2025-2026 - Import automatique'
  }
};

const JOURS_MAP = {
  'dimanche': 0,
  'lundi': 1,
  'mardi': 2,
  'mercredi': 3,
  'jeudi': 4,
  'vendredi': 5,
  'samedi': 6
};

const CATEGORIE_MAP = {
  'passager': 'INTERNATIONAL',
  'cargo': 'CARGO',
  'domestique': 'DOMESTIQUE'
};

// ══════════════════════════════════════════════════════════════════════════
// FONCTIONS DE TRANSFORMATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Convertit le format d'heure "12H10" en "12:10"
 */
function convertirHeure(heure) {
  if (!heure || heure === '' || heure === '-') return null;

  // Gérer le cas "(J+1)"
  let heureClean = heure.replace(/\s*\(J\+1\)\s*/gi, '').trim();

  // Remplacer H par :
  heureClean = heureClean.replace(/H/gi, ':');

  // Valider le format
  if (!/^\d{2}:\d{2}$/.test(heureClean)) {
    console.warn(`  ⚠ Format heure invalide: "${heure}" -> "${heureClean}"`);
    return null;
  }

  return heureClean;
}

/**
 * Vérifie si le départ est J+1
 */
function estDepartLendemain(depart) {
  if (!depart) return false;
  return depart.toUpperCase().includes('J+1');
}

/**
 * Regroupe les vols par numéro et fusionne les jours
 */
function regrouperVols(volsParJour) {
  const volsMap = new Map();

  for (const [jour, data] of Object.entries(volsParJour)) {
    const jourNum = JOURS_MAP[jour.toLowerCase()];

    if (jourNum === undefined) {
      console.warn(`  ⚠ Jour inconnu: ${jour}`);
      continue;
    }

    for (const vol of data.vols) {
      const key = vol.numero;

      if (volsMap.has(key)) {
        // Ajouter le jour au vol existant
        const existing = volsMap.get(key);
        if (!existing.joursSemaine.includes(jourNum)) {
          existing.joursSemaine.push(jourNum);
        }
      } else {
        // Créer un nouveau vol
        volsMap.set(key, {
          numeroVol: vol.numero,
          joursSemaine: [jourNum],
          typeAvion: vol.type_avion || null,
          version: vol.version || 'TBN',
          provenance: vol.provenance || null,
          heureArrivee: convertirHeure(vol.arrivee),
          destination: vol.destination || null,
          heureDepart: convertirHeure(vol.depart),
          departLendemain: estDepartLendemain(vol.depart),
          observations: vol.observation || null,
          categorieVol: CATEGORIE_MAP[vol.type] || 'INTERNATIONAL'
        });
      }
    }
  }

  // Trier les jours dans chaque vol
  for (const vol of volsMap.values()) {
    vol.joursSemaine.sort((a, b) => a - b);
  }

  return Array.from(volsMap.values());
}

// ══════════════════════════════════════════════════════════════════════════
// FONCTIONS D'IMPORT
// ══════════════════════════════════════════════════════════════════════════

/**
 * Crée un programme s'il n'existe pas
 */
async function creerProgramme(config, userId) {
  // Vérifier si existe déjà
  let programme = await ProgrammeVol.findOne({ nom: config.nom });

  if (programme) {
    console.log(`  ℹ Programme "${config.nom}" existe déjà (ID: ${programme._id})`);
    return programme;
  }

  // Créer le programme
  programme = new ProgrammeVol({
    nom: config.nom,
    dateDebut: new Date(config.dateDebut),
    dateFin: new Date(config.dateFin),
    edition: config.edition,
    description: config.description,
    statut: 'BROUILLON',
    actif: false,
    nombreVols: 0,
    compagnies: [],
    createdBy: userId
  });

  await programme.save();
  console.log(`  ✓ Programme "${config.nom}" créé (ID: ${programme._id})`);

  return programme;
}

/**
 * Importe les vols dans un programme
 */
async function importerVols(programmeId, vols, userId) {
  let succes = 0;
  let erreurs = 0;
  let ordre = 1;

  // Récupérer le dernier ordre existant
  const dernierVol = await VolProgramme.findOne({ programme: programmeId })
    .sort({ ordre: -1 });
  if (dernierVol) {
    ordre = dernierVol.ordre + 1;
  }

  for (const volData of vols) {
    try {
      // Vérifier si le vol existe déjà
      const existant = await VolProgramme.findOne({
        programme: programmeId,
        numeroVol: volData.numeroVol
      });

      if (existant) {
        console.log(`    ℹ Vol ${volData.numeroVol} existe déjà, ignoré`);
        continue;
      }

      const vol = new VolProgramme({
        programme: programmeId,
        joursSemaine: volData.joursSemaine,
        numeroVol: volData.numeroVol,
        typeAvion: volData.typeAvion,
        version: volData.version,
        provenance: volData.provenance,
        heureArrivee: volData.heureArrivee,
        destination: volData.destination,
        heureDepart: volData.heureDepart,
        departLendemain: volData.departLendemain,
        observations: volData.observations,
        categorieVol: volData.categorieVol,
        ordre: ordre++,
        createdBy: userId
      });

      await vol.save();
      succes++;

    } catch (err) {
      console.error(`    ✗ Erreur vol ${volData.numeroVol}: ${err.message}`);
      erreurs++;
    }
  }

  return { succes, erreurs };
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  IMPORT DES DONNÉES DE VOLS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Connexion MongoDB
    console.log('📡 Connexion à MongoDB...');
    await connectDB();
    console.log('✓ Connecté à MongoDB\n');

    // Lire le fichier JSON
    console.log('📂 Lecture du fichier vols-data.json...');
    const jsonPath = path.join(__dirname, '..', 'vols-data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✓ Fichier lu\n');

    // Créer un userId système pour l'import
    // On utilise un ObjectId fixe pour l'import automatique
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000001');

    // Vérifier si un utilisateur existe, sinon on prend le premier admin
    const Personne = mongoose.model('Personne');
    let user = await Personne.findOne({ role: { $in: ['ADMIN', 'MANAGER', 'SUPERVISEUR'] } });
    const userId = user ? user._id : systemUserId;
    console.log(`👤 Utilisateur pour import: ${user ? user.email : 'Système'}\n`);

    // Traiter chaque programme
    const programmes = ['hiver_2024_2025', 'hiver_2025_2026'];

    for (const progKey of programmes) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📋 PROGRAMME: ${progKey.toUpperCase()}`);
      console.log('─'.repeat(60));

      const config = PROGRAMMES_CONFIG[progKey];
      const volsParJour = jsonData.vols_par_jour[progKey];

      if (!volsParJour) {
        console.log(`  ⚠ Données non trouvées pour ${progKey}`);
        continue;
      }

      // Créer le programme
      console.log('\n📌 Création du programme...');
      const programme = await creerProgramme(config, userId);

      // Regrouper les vols
      console.log('\n🔄 Regroupement des vols...');
      const vols = regrouperVols(volsParJour);
      console.log(`  ✓ ${vols.length} vols uniques identifiés`);

      // Afficher un aperçu
      console.log('\n📝 Aperçu des vols:');
      for (const vol of vols.slice(0, 5)) {
        const jours = vol.joursSemaine.map(j => ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][j]).join('-');
        console.log(`    ${vol.numeroVol.padEnd(12)} | ${jours.padEnd(20)} | ${vol.heureArrivee || '-'} → ${vol.heureDepart || '-'}`);
      }
      if (vols.length > 5) {
        console.log(`    ... et ${vols.length - 5} autres vols`);
      }

      // Importer les vols
      console.log('\n📥 Import des vols...');
      const resultat = await importerVols(programme._id, vols, userId);
      console.log(`  ✓ ${resultat.succes} vols importés`);
      if (resultat.erreurs > 0) {
        console.log(`  ✗ ${resultat.erreurs} erreurs`);
      }

      // Recharger le programme pour voir les stats mises à jour
      const progMaj = await ProgrammeVol.findById(programme._id);
      console.log(`\n📊 Statistiques finales:`);
      console.log(`  - Nombre de vols: ${progMaj.nombreVols}`);
      console.log(`  - Compagnies: ${progMaj.compagnies.join(', ')}`);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('✅ IMPORT TERMINÉ AVEC SUCCÈS');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);

  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Déconnecté de MongoDB');
  }
}

// Exécuter
main();
