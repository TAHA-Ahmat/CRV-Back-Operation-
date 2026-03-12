/**
 * NETTOYAGE COMPLÉMENTAIRE — bulletinsmouvements + orphelins CRV restants
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  console.log('========================================');
  console.log('  NETTOYAGE COMPLÉMENTAIRE');
  console.log('  bulletinsmouvements + orphelins CRV');
  console.log('========================================\n');

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log('✅ Connecté à:', db.databaseName);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  // Collections à nettoyer
  const targets = [
    'bulletinsmouvements',
    'evenementoperationnels',
    'validationcrvs',
    'phaseexecutions',
    'historiquemodifications',
    'chronologiephases'
  ];

  // Collections protégées — vérifier intégrité
  const protectedColls = ['users', 'programmesvol', 'programmesvolsaisonniers', 'vols',
    'engins', 'avions', 'personnes', 'notifications', 'notificationrules',
    'notificationrecipients', 'useractivitylogs', 'compteurs', 'horaires',
    'affectationenginvols', 'volsprogramme'];

  // === AVANT ===
  console.log('\n=== COMPTAGE AVANT ===');
  const before = {};
  const protectedBefore = {};

  for (const coll of targets) {
    try {
      const count = await db.collection(coll).countDocuments();
      before[coll] = count;
      console.log(`  ${coll}: ${count} documents`);
    } catch (e) {
      console.log(`  ${coll}: collection inexistante`);
      before[coll] = 0;
    }
  }

  console.log('\n  Collections protégées:');
  for (const coll of protectedColls) {
    try {
      const count = await db.collection(coll).countDocuments();
      protectedBefore[coll] = count;
      if (count > 0) console.log(`    ${coll}: ${count}`);
    } catch (e) { /* ignore */ }
  }

  // === SAUVEGARDE ===
  console.log('\n=== SAUVEGARDE ===');
  for (const coll of targets) {
    if (before[coll] > 0) {
      const docs = await db.collection(coll).find({}).toArray();
      const file = path.join(backupDir, `backup_${coll}_${timestamp}.json`);
      fs.writeFileSync(file, JSON.stringify(docs, null, 2));
      console.log(`  ✅ ${coll}: ${docs.length} docs → ${path.basename(file)}`);
    }
  }

  // === SUPPRESSION ===
  console.log('\n=== SUPPRESSION ===');
  const deletions = {};
  for (const coll of targets) {
    if (before[coll] > 0) {
      const result = await db.collection(coll).deleteMany({});
      deletions[coll] = result.deletedCount;
      console.log(`  ✅ ${coll}: ${result.deletedCount} supprimés`);
    } else {
      deletions[coll] = 0;
      console.log(`  ⏭️  ${coll}: 0 (déjà vide)`);
    }
  }

  // Vérifier aussi que crvs est toujours à 0
  const crvsCheck = await db.collection('crvs').countDocuments();
  console.log(`\n  crvs (vérification): ${crvsCheck} ${crvsCheck === 0 ? '✅' : '❌'}`);

  // === VÉRIFICATION APRÈS ===
  console.log('\n=== VÉRIFICATION POST-SUPPRESSION ===');
  for (const coll of targets) {
    try {
      const count = await db.collection(coll).countDocuments();
      console.log(`  ${coll}: ${count} ${count === 0 ? '✅' : '❌'}`);
    } catch (e) {
      console.log(`  ${coll}: OK (inexistante)`);
    }
  }

  // === INTÉGRITÉ PROTÉGÉES ===
  console.log('\n=== INTÉGRITÉ COLLECTIONS PROTÉGÉES ===');
  let allOK = true;
  for (const coll of protectedColls) {
    if (protectedBefore[coll] !== undefined) {
      try {
        const count = await db.collection(coll).countDocuments();
        const ok = count === protectedBefore[coll];
        if (!ok) {
          console.log(`  ❌ ${coll}: ${protectedBefore[coll]} → ${count} MODIFIÉ!`);
          allOK = false;
        } else if (count > 0) {
          console.log(`  ✅ ${coll}: ${count} (intact)`);
        }
      } catch (e) { /* ignore */ }
    }
  }
  console.log(`\n  Intégrité: ${allOK ? '✅ TOUT INTACT' : '❌ PROBLÈME'}`);

  // === ÉTAT FINAL COMPLET ===
  console.log('\n========================================');
  console.log('  ÉTAT FINAL DE LA BASE');
  console.log('========================================');
  const allColls = await db.listCollections().toArray();
  for (const c of allColls.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    const tag = targets.includes(c.name) || c.name === 'crvs' ? ' [NETTOYÉ]' :
      (count === 0 ? '' : '');
    console.log(`  ${c.name}: ${count}${tag}`);
  }

  // === RÉSUMÉ ===
  console.log('\n========================================');
  console.log('  RÉSUMÉ NETTOYAGE COMPLET');
  console.log('========================================');
  let totalDeleted = 0;
  for (const [coll, count] of Object.entries(deletions)) {
    if (count > 0) {
      console.log(`  ${coll}: ${count} supprimés`);
      totalDeleted += count;
    }
  }
  console.log(`  + crvs: 138 (supprimés à l'étape précédente)`);
  totalDeleted += 138;
  console.log(`\n  TOTAL: ${totalDeleted} documents supprimés`);
  console.log(`  Intégrité: ${allOK ? 'OK ✅' : 'ERREUR ❌'}`);
  console.log(`  VERDICT: ${allOK ? 'BASE PRÊTE POUR NOUVEAUX TESTS ✅' : 'VÉRIFIER ❌'}`);

  // Écrire les données pour le rapport
  fs.writeFileSync(path.join(__dirname, 'cleanup-final.json'), JSON.stringify({
    before, deletions, protectedBefore, allOK, timestamp: new Date().toISOString()
  }, null, 2));

  await mongoose.disconnect();
  console.log('\n✅ Déconnecté');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
