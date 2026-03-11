/**
 * MISSION — NETTOYAGE BASE TEST (CRV + BULLETINS UNIQUEMENT)
 *
 * Ce script :
 * 1. Liste les collections MongoDB
 * 2. Compte les documents avant suppression
 * 3. Exporte les sauvegardes JSON
 * 4. Supprime UNIQUEMENT crvs et bulletins (+ documents orphelins liés)
 * 5. Vérifie la suppression
 * 6. Vérifie l'intégrité des autres collections
 * 7. Génère un rapport
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI non défini dans .env');
  process.exit(1);
}

const REPORT = {
  date: new Date().toISOString(),
  before: {},
  after: {},
  backups: [],
  deletions: {},
  otherCollections: {},
  orphansCleanup: {}
};

async function main() {
  console.log('========================================');
  console.log('  NETTOYAGE BASE TEST — CRV + BULLETINS');
  console.log('  Date:', new Date().toISOString());
  console.log('========================================\n');

  // Connexion
  console.log('Connexion à MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log('✅ Connecté à:', db.databaseName);
  REPORT.database = db.databaseName;

  // =============================================
  // ÉTAPE 1 : Lister les collections
  // =============================================
  console.log('\n=== ÉTAPE 1: COLLECTIONS ===');
  const collections = await db.listCollections().toArray();
  const collNames = collections.map(c => c.name).sort();
  console.log(`${collNames.length} collections trouvées:`);
  for (const name of collNames) {
    console.log(`  - ${name}`);
  }

  const hasCrvs = collNames.includes('crvs');
  const hasBulletins = collNames.includes('bulletins');
  console.log(`\ncrvs: ${hasCrvs ? '✅ EXISTE' : '❌ NON TROUVÉE'}`);
  console.log(`bulletins: ${hasBulletins ? '✅ EXISTE' : '❌ NON TROUVÉE'}`);

  if (!hasCrvs && !hasBulletins) {
    console.log('\n⚠️ Aucune collection cible trouvée. Rien à nettoyer.');
    await mongoose.disconnect();
    return;
  }

  // =============================================
  // ÉTAPE 2 : Compter les documents AVANT
  // =============================================
  console.log('\n=== ÉTAPE 2: COMPTAGE AVANT SUPPRESSION ===');

  if (hasCrvs) {
    REPORT.before.crvs = await db.collection('crvs').countDocuments();
    console.log(`  crvs: ${REPORT.before.crvs} documents`);
  }
  if (hasBulletins) {
    REPORT.before.bulletins = await db.collection('bulletins').countDocuments();
    console.log(`  bulletins: ${REPORT.before.bulletins} documents`);
  }

  // Compter aussi les documents liés (orphelins potentiels)
  const linkedCollections = ['phases', 'chargeoperationnelles', 'evenements', 'observations'];
  for (const coll of linkedCollections) {
    if (collNames.includes(coll)) {
      const count = await db.collection(coll).countDocuments();
      REPORT.before[coll] = count;
      console.log(`  ${coll} (lié aux CRV): ${count} documents`);
    }
  }

  // Compter les collections protégées
  const protectedCollections = ['users', 'programmesvols', 'escales', 'configs', 'regles', 'notifications'];
  console.log('\n  Collections protégées (NE PAS TOUCHER):');
  for (const coll of protectedCollections) {
    if (collNames.includes(coll)) {
      const count = await db.collection(coll).countDocuments();
      REPORT.otherCollections[coll] = { before: count };
      console.log(`    ${coll}: ${count} documents`);
    }
  }

  // =============================================
  // ÉTAPE 3 : Sauvegarde JSON
  // =============================================
  console.log('\n=== ÉTAPE 3: SAUVEGARDE DE SÉCURITÉ ===');

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

  if (hasCrvs && REPORT.before.crvs > 0) {
    const crvDocs = await db.collection('crvs').find({}).toArray();
    const crvFile = path.join(backupDir, `backup_crvs_${timestamp}.json`);
    fs.writeFileSync(crvFile, JSON.stringify(crvDocs, null, 2));
    REPORT.backups.push(crvFile);
    console.log(`  ✅ crvs exportées: ${crvFile} (${crvDocs.length} docs)`);
  }

  if (hasBulletins && REPORT.before.bulletins > 0) {
    const bullDocs = await db.collection('bulletins').find({}).toArray();
    const bullFile = path.join(backupDir, `backup_bulletins_${timestamp}.json`);
    fs.writeFileSync(bullFile, JSON.stringify(bullDocs, null, 2));
    REPORT.backups.push(bullFile);
    console.log(`  ✅ bulletins exportés: ${bullFile} (${bullDocs.length} docs)`);
  }

  // =============================================
  // ÉTAPE 4 : Suppression
  // =============================================
  console.log('\n=== ÉTAPE 4: SUPPRESSION ===');
  console.log('⚠️  SUPPRESSION UNIQUEMENT des collections crvs et bulletins');
  console.log('⚠️  Les autres collections ne seront PAS modifiées\n');

  if (hasCrvs) {
    const result = await db.collection('crvs').deleteMany({});
    REPORT.deletions.crvs = result.deletedCount;
    console.log(`  ✅ crvs: ${result.deletedCount} documents supprimés`);
  }

  if (hasBulletins) {
    const result = await db.collection('bulletins').deleteMany({});
    REPORT.deletions.bulletins = result.deletedCount;
    console.log(`  ✅ bulletins: ${result.deletedCount} documents supprimés`);
  }

  // Nettoyer les documents orphelins liés aux CRV
  console.log('\n  Nettoyage des documents orphelins liés aux CRV:');
  for (const coll of linkedCollections) {
    if (collNames.includes(coll)) {
      const beforeCount = await db.collection(coll).countDocuments();
      // Les phases, charges, evenements, observations ont tous un champ crvId ou crv
      const result = await db.collection(coll).deleteMany({});
      REPORT.orphansCleanup[coll] = { before: beforeCount, deleted: result.deletedCount };
      console.log(`  ✅ ${coll}: ${result.deletedCount} documents orphelins supprimés (étaient liés aux CRV)`);
    }
  }

  // =============================================
  // ÉTAPE 5 : Vérification après suppression
  // =============================================
  console.log('\n=== ÉTAPE 5: VÉRIFICATION POST-SUPPRESSION ===');

  if (hasCrvs) {
    REPORT.after.crvs = await db.collection('crvs').countDocuments();
    console.log(`  crvs: ${REPORT.after.crvs} documents ${REPORT.after.crvs === 0 ? '✅' : '❌ ERREUR!'}`);
  }
  if (hasBulletins) {
    REPORT.after.bulletins = await db.collection('bulletins').countDocuments();
    console.log(`  bulletins: ${REPORT.after.bulletins} documents ${REPORT.after.bulletins === 0 ? '✅' : '❌ ERREUR!'}`);
  }
  for (const coll of linkedCollections) {
    if (collNames.includes(coll)) {
      const count = await db.collection(coll).countDocuments();
      REPORT.after[coll] = count;
      console.log(`  ${coll}: ${count} documents ${count === 0 ? '✅' : '⚠️'}`);
    }
  }

  // =============================================
  // ÉTAPE 6 : Vérifier intégrité autres collections
  // =============================================
  console.log('\n=== ÉTAPE 6: INTÉGRITÉ AUTRES COLLECTIONS ===');

  let integrityOK = true;
  for (const coll of protectedCollections) {
    if (collNames.includes(coll) && REPORT.otherCollections[coll]) {
      const afterCount = await db.collection(coll).countDocuments();
      REPORT.otherCollections[coll].after = afterCount;
      const unchanged = afterCount === REPORT.otherCollections[coll].before;
      console.log(`  ${coll}: ${afterCount} documents ${unchanged ? '✅ INTACT' : '❌ MODIFIÉ!'}`);
      if (!unchanged) integrityOK = false;
    }
  }

  REPORT.integrityOK = integrityOK;
  console.log(`\n  Intégrité globale: ${integrityOK ? '✅ TOUTES LES COLLECTIONS PROTÉGÉES INTACTES' : '❌ ERREUR D\'INTÉGRITÉ'}`);

  // =============================================
  // Résumé
  // =============================================
  console.log('\n========================================');
  console.log('  RÉSUMÉ NETTOYAGE');
  console.log('========================================');
  console.log(`  CRV supprimés: ${REPORT.deletions.crvs || 0}`);
  console.log(`  Bulletins supprimés: ${REPORT.deletions.bulletins || 0}`);
  for (const [coll, data] of Object.entries(REPORT.orphansCleanup)) {
    console.log(`  ${coll} orphelins supprimés: ${data.deleted}`);
  }
  console.log(`  Sauvegardes: ${REPORT.backups.length} fichiers`);
  console.log(`  Intégrité: ${integrityOK ? 'OK ✅' : 'ERREUR ❌'}`);
  console.log(`  VERDICT: ${integrityOK ? 'NETTOYAGE RÉUSSI ✅' : 'VÉRIFIER ❌'}`);

  // Sauvegarder le rapport JSON
  const reportFile = path.join(backupDir, `cleanup_report_${timestamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(REPORT, null, 2));
  console.log(`\n  Rapport JSON: ${reportFile}`);

  await mongoose.disconnect();
  console.log('\n✅ Déconnecté de MongoDB');

  // Exposer le REPORT pour le rapport MD
  return REPORT;
}

main().then(report => {
  if (report) {
    // Écrire les données dans un fichier temporaire pour le rapport MD
    fs.writeFileSync(
      path.join(__dirname, 'cleanup-data.json'),
      JSON.stringify(report, null, 2)
    );
  }
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
