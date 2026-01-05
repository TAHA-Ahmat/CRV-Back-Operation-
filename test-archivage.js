// ✅ SCRIPT DE TEST - ARCHIVAGE CRV GOOGLE DRIVE
// Teste la configuration et l'upload réel vers Google Drive

import { archiveCRVPdf, checkArchivageStatus } from './src/services/crvArchivageService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║     🧪  TEST ARCHIVAGE CRV - GOOGLE DRIVE  🧪             ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testArchivage() {
  try {
    // ============================
    //   ÉTAPE 1 : VÉRIFICATION CONFIGURATION
    // ============================

    console.log('📋 ÉTAPE 1 : Vérification de la configuration...\n');

    const status = await checkArchivageStatus();

    console.log('Configuration :');
    console.log(`  ├─ Chemin credentials : ${status.credentialsPath}`);
    console.log(`  ├─ Credentials existent : ${status.credentialsExists ? '✅' : '❌'}`);
    console.log(`  ├─ Service configuré : ${status.configured ? '✅' : '❌'}`);
    console.log(`  ├─ Folder ID : ${status.folderId}`);

    if (status.configured) {
      console.log(`  ├─ Dossier accessible : ${status.folderAccessible ? '✅' : '❌'}`);
      if (status.folderAccessible) {
        console.log(`  └─ Nom du dossier : ${status.folderName}`);
      } else {
        console.log(`  └─ Erreur accès dossier : ${status.folderError}`);
      }
    } else {
      console.log(`  └─ Erreur : ${status.error}`);
    }

    if (!status.configured) {
      console.log('\n❌ ÉCHEC : Service non configuré\n');
      console.log('Actions requises :');
      console.log('  1. Placer le fichier credentials dans : config/json/ths-crv-operations.json');
      console.log('  2. Configurer GOOGLE_DRIVE_FOLDER_ID dans .env');
      console.log('  3. Relancer ce test\n');
      process.exit(1);
    }

    if (!status.folderAccessible) {
      console.log('\n❌ ÉCHEC : Dossier Drive non accessible\n');
      console.log('Actions requises :');
      console.log('  1. Vérifier que le dossier existe dans Google Drive');
      console.log('  2. Partager le dossier avec le Service Account (Éditeur)');
      console.log('  3. Vérifier que GOOGLE_DRIVE_FOLDER_ID est correct dans .env');
      console.log('  4. Relancer ce test\n');
      process.exit(1);
    }

    console.log('\n✅ Configuration OK\n');

    // ============================
    //   ÉTAPE 2 : CRÉATION PDF DE TEST
    // ============================

    console.log('📄 ÉTAPE 2 : Création d\'un PDF de test...\n');

    // PDF minimal valide
    const testPdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
        '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
        '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
        'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000114 00000 n\n' +
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF'
    );

    const filename = `TEST_CRV_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;

    console.log(`  ├─ Taille PDF : ${testPdfBuffer.length} octets`);
    console.log(`  └─ Nom fichier : ${filename}\n`);

    // ============================
    //   ÉTAPE 3 : UPLOAD VERS GOOGLE DRIVE
    // ============================

    console.log('📤 ÉTAPE 3 : Upload vers Google Drive...\n');

    const result = await archiveCRVPdf({
      buffer: testPdfBuffer,
      filename,
      mimeType: 'application/pdf',
      crvId: 'TEST_SCRIPT',
      userId: null,
    });

    console.log('Résultat de l\'upload :');
    console.log(`  ├─ File ID : ${result.fileId}`);
    console.log(`  ├─ Nom fichier : ${result.filename}`);
    console.log(`  ├─ Taille : ${result.size} octets`);
    console.log(`  └─ URL : ${result.webViewLink}\n`);

    // ============================
    //   RÉSULTAT FINAL
    // ============================

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║               ✅  TEST RÉUSSI  ✅                          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🎉 L\'archivage Google Drive est opérationnel !\n');
    console.log('Prochaines étapes :');
    console.log('  1. Vérifier le fichier dans Google Drive :');
    console.log(`     ${result.webViewLink}`);
    console.log('  2. Tester avec un CRV réel via l\'API :');
    console.log('     POST /api/crv/:id/archive\n');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST :\n');
    console.error(`Message : ${error.message}`);
    console.error(`Code : ${error.code || error.status || 'N/A'}`);

    if (error.stack) {
      console.error(`\nStack trace :\n${error.stack}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║               ❌  TEST ÉCHOUÉ  ❌                          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📚 Consultez la documentation :');
    console.log('  - ARCHIVAGE.md');
    console.log('  - config/json/README.md\n');

    process.exit(1);
  }
}

// Lancer le test
testArchivage();
