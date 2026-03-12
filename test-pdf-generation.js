/**
 * Script de test pour la generation PDF du programme de vols
 * Usage: node test-pdf-generation.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '.env') });

// Import des modeles et services
import ProgrammeVol from './src/models/flights/ProgrammeVol.js';
import VolProgramme from './src/models/flights/VolProgramme.js';
import { genererPDFBuffer, obtenirApercu } from './src/services/flights/programmeVolPdf.service.js';

async function testPdfGeneration() {
  console.log('════════════════════════════════════════════════════════');
  console.log('TEST DE GENERATION PDF - PROGRAMME DE VOLS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/crv';
    console.log('1. Connexion a MongoDB...');

    await mongoose.connect(mongoUri);
    console.log('   Connecte!\n');

    console.log('2. Recherche d\'un programme existant...');
    let programme = await ProgrammeVol.findOne().sort({ createdAt: -1 });

    if (!programme) {
      console.log('   Aucun programme trouve.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`   Programme trouve: ${programme.nom}`);
    console.log(`   ID: ${programme._id}`);
    console.log(`   Vols: ${programme.nombreVols}\n`);

    console.log('3. Test de l\'apercu (donnees JSON)...');
    const apercu = await obtenirApercu(programme._id.toString());
    console.log(`   Programme: ${apercu.programme.nom}`);
    console.log(`   Edition: ${apercu.programme.edition}`);
    console.log('   Vols par jour:');
    for (const [jour, vols] of Object.entries(apercu.volsParJour)) {
      if (vols.length > 0) {
        console.log(`     ${jour}: ${vols.length} vol(s)`);
      }
    }
    console.log('');

    console.log('4. Generation du PDF...');
    const startTime = Date.now();
    const pdfBuffer = await genererPDFBuffer(programme._id.toString());
    const endTime = Date.now();

    console.log(`   Genere en ${endTime - startTime}ms`);
    console.log(`   Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    const outputDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `TEST_${programme.nom}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('5. PDF sauvegarde!');
    console.log(`   Chemin: ${outputPath}\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log('TEST REUSSI!');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    console.log('Endpoints disponibles:');
    console.log(`  GET /api/programmes-vol/${programme._id}/export-pdf`);
    console.log(`  GET /api/programmes-vol/${programme._id}/telecharger-pdf`);
    console.log(`  GET /api/programmes-vol/${programme._id}/pdf-base64`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\nERREUR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testPdfGeneration();
