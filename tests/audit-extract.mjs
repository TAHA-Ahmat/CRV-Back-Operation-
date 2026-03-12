/**
 * AUDIT PIPELINE CRV — EXTRACTION DONNÉES MONGODB
 * CRV: 69b0d282497f312717732ea1
 * LECTURE SEULE — aucune modification
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CRV_ID = '69b0d282497f312717732ea1';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const oid = new mongoose.Types.ObjectId(CRV_ID);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  AUDIT PIPELINE CRV — EXTRACTION MONGODB                  ║');
  console.log('║  CRV: ' + CRV_ID + '              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ====== 1. CRV ======
  console.log('═══════════════════════════════════════');
  console.log('  1. DOCUMENT CRV');
  console.log('═══════════════════════════════════════');
  const crv = await db.collection('crvs').findOne({ _id: oid });
  if (!crv) { console.log('  ❌ CRV NON TROUVÉ'); await mongoose.disconnect(); return; }
  console.log(JSON.stringify(crv, null, 2));

  // ====== 2. CHRONOLOGIE PHASES ======
  console.log('\n═══════════════════════════════════════');
  console.log('  2. CHRONOLOGIE PHASES');
  console.log('═══════════════════════════════════════');
  const phases = await db.collection('chronologiephases').find({ crv: oid }).toArray();
  console.log(`  Total: ${phases.length} documents`);
  for (const p of phases) {
    console.log(JSON.stringify(p, null, 2));
  }

  // ====== 3. CHARGES OPERATIONNELLES ======
  console.log('\n═══════════════════════════════════════');
  console.log('  3. CHARGES OPERATIONNELLES');
  console.log('═══════════════════════════════════════');
  // Essayer plusieurs noms de collection
  for (const collName of ['chargeoperationnelles', 'chargesoperationnelles', 'charges']) {
    const charges = await db.collection(collName).find({ crv: oid }).toArray();
    if (charges.length > 0) {
      console.log(`  Collection: ${collName} — ${charges.length} documents`);
      for (const c of charges) console.log(JSON.stringify(c, null, 2));
      break;
    }
    // Essayer aussi avec crvId
    const charges2 = await db.collection(collName).find({ crvId: oid }).toArray();
    if (charges2.length > 0) {
      console.log(`  Collection: ${collName} (crvId) — ${charges2.length} documents`);
      for (const c of charges2) console.log(JSON.stringify(c, null, 2));
      break;
    }
  }
  // Fallback: chercher dans toutes les collections
  const allColls = await db.listCollections().toArray();
  const chargeColls = allColls.filter(c => c.name.toLowerCase().includes('charge'));
  if (chargeColls.length > 0) {
    console.log('  Collections charge trouvées:', chargeColls.map(c => c.name).join(', '));
    for (const cc of chargeColls) {
      const docs = await db.collection(cc.name).find({ $or: [{ crv: oid }, { crvId: oid }] }).toArray();
      if (docs.length > 0) {
        console.log(`  → ${cc.name}: ${docs.length} documents`);
        for (const d of docs) console.log(JSON.stringify(d, null, 2));
      }
    }
  }

  // ====== 4. EVENEMENTS OPERATIONNELS ======
  console.log('\n═══════════════════════════════════════');
  console.log('  4. EVENEMENTS OPERATIONNELS');
  console.log('═══════════════════════════════════════');
  for (const collName of ['evenementoperationnels', 'evenementsoperationnels', 'evenements']) {
    const evts = await db.collection(collName).find({ $or: [{ crv: oid }, { crvId: oid }] }).toArray();
    if (evts.length > 0) {
      console.log(`  Collection: ${collName} — ${evts.length} documents`);
      for (const e of evts) console.log(JSON.stringify(e, null, 2));
    }
  }
  // Check absence confirmée dans le CRV
  if (crv.absenceEvenement || crv.confirmationAbsenceEvenement) {
    console.log('  Info CRV: absenceEvenement=', crv.absenceEvenement, 'confirmationAbsenceEvenement=', crv.confirmationAbsenceEvenement);
  }

  // ====== 5. OBSERVATIONS ======
  console.log('\n═══════════════════════════════════════');
  console.log('  5. OBSERVATIONS');
  console.log('═══════════════════════════════════════');
  const observations = await db.collection('observations').find({ $or: [{ crv: oid }, { crvId: oid }] }).toArray();
  console.log(`  Total: ${observations.length} documents`);
  for (const o of observations) console.log(JSON.stringify(o, null, 2));

  // ====== 6. VALIDATION CRV ======
  console.log('\n═══════════════════════════════════════');
  console.log('  6. VALIDATION CRV');
  console.log('═══════════════════════════════════════');
  const validations = await db.collection('validationcrvs').find({ $or: [{ crv: oid }, { crvId: oid }] }).toArray();
  console.log(`  Total: ${validations.length} documents`);
  for (const v of validations) console.log(JSON.stringify(v, null, 2));

  // ====== 7. ENGINS UTILISES ======
  console.log('\n═══════════════════════════════════════');
  console.log('  7. ENGINS UTILISES');
  console.log('═══════════════════════════════════════');
  for (const collName of ['enginsutilises', 'enginutilises', 'engins_utilises']) {
    try {
      const engins = await db.collection(collName).find({ $or: [{ crv: oid }, { crvId: oid }] }).toArray();
      if (engins.length > 0) {
        console.log(`  Collection: ${collName} — ${engins.length} documents`);
        for (const e of engins) console.log(JSON.stringify(e, null, 2));
      }
    } catch(e) {}
  }
  // Vérifier aussi le champ engins dans le CRV lui-même
  if (crv.engins) {
    console.log('  Champ crv.engins:', JSON.stringify(crv.engins));
  }

  // ====== 8. VOL ASSOCIÉ ======
  console.log('\n═══════════════════════════════════════');
  console.log('  8. VOL ASSOCIÉ');
  console.log('═══════════════════════════════════════');
  if (crv.vol) {
    const vol = await db.collection('vols').findOne({ _id: crv.vol });
    if (vol) {
      console.log(JSON.stringify(vol, null, 2));
    } else {
      console.log('  Vol référencé mais non trouvé:', crv.vol);
    }
  }

  // ====== 9. HORAIRE ASSOCIÉ ======
  console.log('\n═══════════════════════════════════════');
  console.log('  9. HORAIRE ASSOCIÉ');
  console.log('═══════════════════════════════════════');
  if (crv.horaire) {
    const horaire = await db.collection('horaires').findOne({ _id: crv.horaire });
    if (horaire) {
      console.log(JSON.stringify(horaire, null, 2));
    } else {
      console.log('  Horaire référencé mais non trouvé:', crv.horaire);
    }
  }

  // ====== 10. PHASES DE RÉFÉRENCE (pour résolution) ======
  console.log('\n═══════════════════════════════════════');
  console.log('  10. PHASES DE RÉFÉRENCE (utilisées par ce CRV)');
  console.log('═══════════════════════════════════════');
  const phaseRefIds = [...new Set(phases.map(p => p.phase).filter(Boolean))];
  for (const refId of phaseRefIds) {
    const phaseRef = await db.collection('phases').findOne({ _id: refId });
    if (phaseRef) {
      console.log(JSON.stringify(phaseRef, null, 2));
    }
  }

  // ====== 11. UTILISATEURS RÉFÉRENCÉS ======
  console.log('\n═══════════════════════════════════════');
  console.log('  11. UTILISATEURS RÉFÉRENCÉS');
  console.log('═══════════════════════════════════════');
  const userIds = new Set();
  if (crv.creePar) userIds.add(crv.creePar.toString());
  if (crv.responsableVol) userIds.add(crv.responsableVol.toString());
  for (const v of validations) {
    if (v.validePar) userIds.add(v.validePar.toString());
    if (v.verrouillePar) userIds.add(v.verrouillePar.toString());
  }
  for (const uid of userIds) {
    try {
      const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(uid) });
      if (user) {
        console.log(`  ${uid}: ${user.nom} ${user.prenom} — ${user.fonction || user.role}`);
      }
    } catch(e) {}
  }

  // ====== 12. PERSONNEL CRV ======
  console.log('\n═══════════════════════════════════════');
  console.log('  12. PERSONNEL CRV (champ embarqué)');
  console.log('═══════════════════════════════════════');
  if (crv.personnel && crv.personnel.length > 0) {
    for (const p of crv.personnel) console.log(JSON.stringify(p));
  } else {
    console.log('  Aucun personnel dans crv.personnel');
  }

  // ====== 13. LISTE TOUTES COLLECTIONS ======
  console.log('\n═══════════════════════════════════════');
  console.log('  13. TOUTES LES COLLECTIONS DE LA BASE');
  console.log('═══════════════════════════════════════');
  const collections = await db.listCollections().toArray();
  for (const c of collections.sort((a,b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.log('\n✅ EXTRACTION TERMINÉE');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
