/**
 * CRV BACKEND CERTIFICATION — API TESTS v2
 * Simulation complète du workflow CRV via API
 */

const BASE = 'http://localhost:4000/api';
const RESULTS = [];
let TOKEN = '';
let USER_ID = '';
let CRV_ID = '';
let VOL_ID = '';
let PHASE_IDS = [];
let CHARGE_ID = '';
let EVENEMENT_ID = '';
let PERSONNEL_ID = '';

// ─── HELPERS ───────────────────────────────────────────────────
async function api(method, path, body = null, description = '', expectedStatus = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
    }
  };
  if (body) opts.body = JSON.stringify(body);

  const start = Date.now();
  let res, data, status;
  try {
    res = await fetch(`${BASE}${path}`, opts);
    status = res.status;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
  } catch (err) {
    status = 0;
    data = { error: err.message };
  }
  const duration = Date.now() - start;

  const result = {
    description,
    method,
    path,
    request: body,
    status,
    expectedStatus,
    success: expectedStatus ? status === expectedStatus : (status >= 200 && status < 300),
    response: typeof data === 'object' ? data : { raw: data },
    duration
  };
  RESULTS.push(result);

  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} [${status}] ${method} ${path} — ${description} (${duration}ms)`);
  if (!result.success && expectedStatus) {
    console.log(`   Expected: ${expectedStatus}, Got: ${status}`);
    if (data?.message) console.log(`   Message: ${data.message}`);
  }
  return { status, data, success: result.success };
}

// ─── SECTION 0: AUTHENTIFICATION ──────────────────────────────
async function testAuth() {
  console.log('\n═══ SECTION 0: AUTHENTIFICATION ═══');

  const r1 = await api('POST', '/auth/login',
    { email: 'superviseur@crv.test', password: 'Test1234!' },
    'Login SUPERVISEUR - cas nominal', 200);
  if (r1.data?.token) {
    TOKEN = r1.data.token;
    USER_ID = r1.data.user?.id;
  }

  await api('POST', '/auth/login',
    { email: 'superviseur@crv.test', password: 'wrong' },
    'Login mot de passe invalide', 401);

  await api('POST', '/auth/login',
    { email: 'nobody@crv.test', password: 'Test1234!' },
    'Login email inexistant', 401);

  const savedToken = TOKEN;
  TOKEN = '';
  await api('GET', '/crv/', null, 'Accès sans token', 401);
  TOKEN = 'invalid.token.here';
  await api('GET', '/crv/', null, 'Token invalide', 401);
  TOKEN = savedToken;
}

// ─── SECTION 1: INFORMATIONS VOL + CRÉATION CRV ──────────────
async function testSection1() {
  console.log('\n═══ SECTION 1: INFORMATIONS VOL + CRÉATION CRV ═══');

  // 1.1: Créer CRV hors-programme ARRIVEE (tous champs requis)
  const today = new Date().toISOString().split('T')[0];
  const UID = Date.now().toString().slice(-5); // unique suffix per run
  const VOL_ARR = `TS${UID}A`;
  const VOL_DEP = `TS${UID}D`;
  const VOL_TA  = `TS${UID}T`;
  console.log(`   UID: ${UID} → vols: ${VOL_ARR}, ${VOL_DEP}, ${VOL_TA}`);

  const r1 = await api('POST', '/crv/', {
    vol: {
      numeroVol: VOL_ARR,
      compagnieAerienne: 'TEST AIRLINES',
      codeIATA: 'TS',
      dateVol: today,
      typeOperation: 'ARRIVEE',
      typeVolHorsProgramme: 'COMMERCIAL',
      raisonHorsProgramme: 'Vol test certification',
      aeroportOrigine: 'CDG'
    },
    escale: 'DKR'
  }, `Créer CRV hors-programme ARRIVEE (${VOL_ARR})`, 201);

  if (r1.data?.data?._id) {
    CRV_ID = r1.data.data._id;
    VOL_ID = typeof r1.data.data.vol === 'object' ? r1.data.data.vol._id : r1.data.data.vol;
    console.log(`   CRV_ID: ${CRV_ID}`);
    console.log(`   VOL_ID: ${VOL_ID}`);
    console.log(`   Statut: ${r1.data.data.statut}`);
    console.log(`   NumeroCRV: ${r1.data.data.numeroCRV}`);
  }

  // 1.2: Obtenir le CRV créé avec toutes les données
  if (CRV_ID) {
    const r2 = await api('GET', `/crv/${CRV_ID}`, null, 'Obtenir CRV par ID', 200);
    if (r2.data?.data) {
      const d = r2.data.data;
      const crv = d.crv || d;
      console.log(`   Statut: ${crv.statut}, Complétude: ${crv.completude}%`);
      if (d.phases) {
        PHASE_IDS = d.phases.map(p => p._id);
        console.log(`   Phases initialisées: ${PHASE_IDS.length}`);
        d.phases.forEach(p => {
          const name = p.phase?.libelle || p.phase?.code || '?';
          console.log(`     ${name}: ${p.statut} (ordre:${p.phase?.ordre}, obligatoire:${p.phase?.obligatoire})`);
        });
      }
    }
  }

  // 1.3: Lister CRVs
  await api('GET', '/crv/', null, 'Lister CRVs', 200);

  // 1.4: Rechercher
  await api('GET', `/crv/search?q=${VOL_ARR}`, null, `Rechercher CRV ${VOL_ARR}`, 200);

  // 1.5: Définir responsableVol
  if (CRV_ID && USER_ID) {
    await api('PATCH', `/crv/${CRV_ID}`, { responsableVol: USER_ID },
      'Définir responsableVol', 200);
  }

  // 1.6: Transitions possibles
  if (CRV_ID) {
    const r6 = await api('GET', `/crv/${CRV_ID}/transitions`, null,
      'Transitions possibles (BROUILLON)', 200);
    if (r6.data?.data) {
      console.log(`   Statut: ${r6.data.data.statutActuel}`);
      console.log(`   Transitions: ${JSON.stringify(r6.data.data.transitionsPossibles)}`);
    }
  }

  // 1.7: Créer CRV DEPART
  const r7 = await api('POST', '/crv/', {
    vol: {
      numeroVol: VOL_DEP, compagnieAerienne: 'TEST AIRLINES', codeIATA: 'TS',
      dateVol: today, typeOperation: 'DEPART',
      typeVolHorsProgramme: 'COMMERCIAL', raisonHorsProgramme: 'Test DEPART',
      aeroportDestination: 'CDG'
    },
    escale: 'DKR'
  }, `Créer CRV DEPART (${VOL_DEP})`, 201);
  let CRV_DEPART_ID = r7.data?.data?._id;

  // 1.8: Créer CRV TURN_AROUND
  const r8 = await api('POST', '/crv/', {
    vol: {
      numeroVol: VOL_TA, compagnieAerienne: 'TEST AIRLINES', codeIATA: 'TS',
      dateVol: today, typeOperation: 'TURN_AROUND',
      typeVolHorsProgramme: 'COMMERCIAL', raisonHorsProgramme: 'Test TURN_AROUND',
      aeroportOrigine: 'CDG', aeroportDestination: 'ABJ'
    },
    escale: 'DKR'
  }, `Créer CRV TURN_AROUND (${VOL_TA})`, 201);
  let CRV_TA_ID = r8.data?.data?._id;
  if (CRV_TA_ID) {
    const rta = await api('GET', `/crv/${CRV_TA_ID}`, null, 'Vérifier phases TURN_AROUND', 200);
    if (rta.data?.data?.phases) {
      console.log(`   Phases TURN_AROUND: ${rta.data.data.phases.length}`);
    }
  }

  // 1.9: Doublon
  const r9 = await api('POST', '/crv/', {
    vol: {
      numeroVol: VOL_ARR, compagnieAerienne: 'TEST AIRLINES', codeIATA: 'TS',
      dateVol: today, typeOperation: 'ARRIVEE',
      typeVolHorsProgramme: 'COMMERCIAL', raisonHorsProgramme: 'Doublon test',
      aeroportOrigine: 'CDG'
    },
    escale: 'DKR'
  }, 'Créer CRV doublon (même vol+escale)', null);
  console.log(`   Doublon: status=${r9.status}, doublon=${r9.data?.data?.crvDoublon}`);

  // 1.10: Supprimer CRV supplémentaires
  if (CRV_DEPART_ID) await api('DELETE', `/crv/${CRV_DEPART_ID}`, null, 'Suppr CRV DEPART', 200);
  if (CRV_TA_ID) await api('DELETE', `/crv/${CRV_TA_ID}`, null, 'Suppr CRV TURN_AROUND', 200);
  // Supprimer doublon si créé
  if (r9.data?.data?._id && r9.data.data._id !== CRV_ID) {
    await api('DELETE', `/crv/${r9.data.data._id}`, null, 'Suppr doublon', 200);
  }

  // 1.11: Création CRV sans vol (bug potentiel)
  const rNoVol = await api('POST', '/crv/', { escale: 'DKR' },
    'Créer CRV sans vol (doit échouer)', 400);
  console.log(`   Sans vol: status=${rNoVol.status} (${rNoVol.status === 400 ? 'REJETÉ ✅' : 'ACCEPTÉ ❌ BUG'})`);

  // 1.12: QUALITE interdit
  const rq = await api('POST', '/auth/login', { email: 'jb@crv.test', password: 'Test1234!' },
    'Login QUALITE', 200);
  if (rq.data?.token) {
    const savedT = TOKEN;
    TOKEN = rq.data.token;
    await api('POST', '/crv/', {
      vol: { numeroVol: `QA${UID}`, compagnieAerienne: 'Q', codeIATA: 'QA', dateVol: today,
        typeOperation: 'ARRIVEE', typeVolHorsProgramme: 'AUTRE', raisonHorsProgramme: 'test', aeroportOrigine: 'CDG' },
      escale: 'DKR'
    }, 'QUALITE tente créer CRV (403 attendu)', 403);
    TOKEN = savedT;
  }
}

// ─── SECTION 2: PERSONNEL ─────────────────────────────────────
async function testSection2() {
  console.log('\n═══ SECTION 2: PERSONNEL ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP — pas de CRV'); return; }

  // 2.1: Ajouter personnel valide
  const r1 = await api('POST', `/crv/${CRV_ID}/personnel`, {
    nom: 'DUPONT', prenom: 'Jean', fonction: 'CHEF_ESCALE', matricule: 'CE-001'
  }, 'Ajouter CHEF_ESCALE', 201);
  if (r1.data?.data?.personne?._id) PERSONNEL_ID = r1.data.data.personne._id;

  // 2.2: Toutes les fonctions valides (11)
  const fonctionsValides = [
    'AGENT_TRAFIC', 'AGENT_PISTE', 'AGENT_PASSAGE', 'MANUTENTIONNAIRE',
    'CHAUFFEUR', 'AGENT_SECURITE', 'TECHNICIEN', 'SUPERVISEUR', 'COORDINATEUR', 'AUTRE'
  ];
  for (const fn of fonctionsValides) {
    await api('POST', `/crv/${CRV_ID}/personnel`,
      { nom: `TEST_${fn}`, prenom: 'A', fonction: fn },
      `Fonction valide: ${fn}`, 201);
  }

  // 2.3: Fonctions INVALIDES (fantômes frontend)
  for (const fn of ['CHEF_EQUIPE', 'MECANICIEN', 'AGENT_HANDLING']) {
    const r = await api('POST', `/crv/${CRV_ID}/personnel`,
      { nom: `BAD_${fn}`, prenom: 'X', fonction: fn },
      `Fonction INVALIDE: ${fn}`, null);
    console.log(`   ${fn}: status=${r.status} (${r.status >= 400 ? 'REJETÉ ✅' : 'ACCEPTÉ ❌ BUG'})`);
  }

  // 2.4: Sans champs requis
  await api('POST', `/crv/${CRV_ID}/personnel`, { nom: 'SEUL' },
    'Personnel sans prenom/fonction (400 attendu)', 400);

  // 2.5: Supprimer
  if (PERSONNEL_ID) {
    await api('DELETE', `/crv/${CRV_ID}/personnel/${PERSONNEL_ID}`,
      null, 'Supprimer un personnel', 200);
  }

  // 2.6: PUT remplacer tout
  await api('PUT', `/crv/${CRV_ID}/personnel`, {
    personnelAffecte: [
      { nom: 'MARTIN', prenom: 'Paul', fonction: 'CHEF_ESCALE', matricule: 'CE-002' },
      { nom: 'DURAND', prenom: 'Marie', fonction: 'AGENT_TRAFIC' }
    ]
  }, 'Remplacer tout le personnel (PUT)', 200);
}

// ─── SECTION 3: ENGINS ───────────────────────────────────────
async function testSection3() {
  console.log('\n═══ SECTION 3: ENGINS ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  // 3.1: GET engins
  await api('GET', `/crv/${CRV_ID}/engins`, null, 'Obtenir engins (vide)', 200);

  // 3.2: PUT engins valides (types frontend lowercase = clés du typeEnginMap)
  const r2 = await api('PUT', `/crv/${CRV_ID}/engins`, {
    engins: [
      { type: 'tracteur', immatriculation: 'TPB-001', utilise: true, usage: 'TRACTAGE' },
      { type: 'gpu', immatriculation: 'GPU-001', utilise: true, usage: 'ALIMENTATION_ELECTRIQUE' }
    ]
  }, 'PUT engins valides', 200);

  // 3.3: Type invalide → doit retourner 400 (FIX BUG-2)
  const r3 = await api('PUT', `/crv/${CRV_ID}/engins`, {
    engins: [{ type: 'INEXISTANT', immatriculation: 'BAD-001', utilise: true }]
  }, 'Engin type invalide (400 attendu — FIX BUG-2)', 400);
  console.log(`   Type invalide: status=${r3.status} (${r3.status === 400 ? 'REJETÉ ✅' : 'ACCEPTÉ ❌ BUG'})`);
}

// ─── SECTION 4: PHASES ───────────────────────────────────────
async function testSection4() {
  console.log('\n═══ SECTION 4: PHASES OPÉRATIONNELLES ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  // 4.1: Démarrer CRV
  const rd = await api('POST', `/crv/${CRV_ID}/demarrer`, null,
    'Démarrer CRV (BROUILLON → EN_COURS)', 200);
  console.log(`   Statut: ${rd.data?.data?.statut}`);

  // 4.2: Lister phases
  const rp = await api('GET', `/phases/?crvId=${CRV_ID}`, null,
    'Lister phases du CRV', 200);
  if (rp.data?.data) {
    PHASE_IDS = rp.data.data.map(p => ({ id: p._id, code: p.phase?.code, statut: p.statut, obligatoire: p.phase?.obligatoire }));
    console.log(`   Nb phases: ${PHASE_IDS.length}`);
    PHASE_IDS.forEach((p, i) => console.log(`     [${i}] ${p.code} — ${p.statut} (obligatoire:${p.obligatoire})`));
  }

  // 4.3: Démarrer + terminer la première phase
  if (PHASE_IDS.length > 0) {
    const pid = PHASE_IDS[0].id;
    await api('POST', `/phases/${pid}/demarrer`, null, `Démarrer phase ${PHASE_IDS[0].code}`, 200);
    await api('POST', `/phases/${pid}/terminer`, null, `Terminer phase ${PHASE_IDS[0].code}`, 200);
  }

  // 4.4: Phases suivantes — démarrer/terminer en séquence
  for (let i = 1; i < PHASE_IDS.length; i++) {
    const p = PHASE_IDS[i];
    const sr = await api('POST', `/phases/${p.id}/demarrer`, null, `Démarrer ${p.code}`, null);
    if (sr.status === 200) {
      await api('POST', `/phases/${p.id}/terminer`, null, `Terminer ${p.code}`, 200);
    } else {
      // Prérequis bloquent ou autre erreur
      console.log(`   ${p.code}: impossible (${sr.data?.message})`);
      // Tenter marquer non-réalisé
      const nr = await api('POST', `/phases/${p.id}/non-realise`,
        { motifNonRealisation: 'NON_NECESSAIRE' },
        `NON_REALISE ${p.code}`, null);
      if (nr.status !== 200) {
        console.log(`   ${p.code}: ne peut pas non plus être NON_REALISE (${nr.data?.message})`);
      }
    }
  }

  // 4.5: Test via route CRV (bypass middleware)
  // Créer une nouvelle phase pour tester
  const rpFinal = await api('GET', `/phases/?crvId=${CRV_ID}`, null, 'Re-lister phases', 200);
  if (rpFinal.data?.data) {
    const nonCommence = rpFinal.data.data.find(p => p.statut === 'NON_COMMENCE');
    if (nonCommence) {
      const rBypass = await api('PUT', `/crv/${CRV_ID}/phases/${nonCommence._id}`, {
        statut: 'TERMINE',
        heureDebutReelle: new Date(Date.now() - 3600000).toISOString(),
        heureFinReelle: new Date().toISOString()
      }, 'BYPASS route CRV: NON_COMMENCE→TERMINE directement', null);
      console.log(`   ⚠️ Bypass: status=${rBypass.status} (${rBypass.status === 200 ? 'ACCEPTÉ ❌ PAS DE MACHINE À ÉTATS' : 'REJETÉ ✅'})`);
    }

    // Vérifier toutes les phases sont traitées
    const stats = { NON_COMMENCE: 0, EN_COURS: 0, TERMINE: 0, NON_REALISE: 0, ANNULE: 0 };
    rpFinal.data.data.forEach(p => stats[p.statut] = (stats[p.statut] || 0) + 1);
    console.log(`   Bilan phases: ${JSON.stringify(stats)}`);
  }

  // 4.6: Test NON_REALISE motif AUTRE sans detailMotif (via route phases)
  // On doit utiliser une phase en NON_COMMENCE... on va en créer une via un nouveau CRV temp
}

// ─── SECTION 5: CHARGES ──────────────────────────────────────
async function testSection5() {
  console.log('\n═══ SECTION 5: CHARGES ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  // 5.1: PASSAGERS
  const r1 = await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'PASSAGERS', sensOperation: 'DEBARQUEMENT',
    passagersAdultes: 120, passagersEnfants: 15, passagersPMR: 3, passagersTransit: 8, passagersBebes: 2
  }, 'Charge PASSAGERS complète', 201);
  if (r1.data?.data?._id) CHARGE_ID = r1.data.data._id;

  // 5.2: BAGAGES
  await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'BAGAGES', sensOperation: 'DEBARQUEMENT',
    nombreBagagesSoute: 180, poidsBagagesSouteKg: 2700, nombreBagagesCabine: 45
  }, 'Charge BAGAGES', 201);

  // 5.3: FRET
  await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'FRET', sensOperation: 'DEBARQUEMENT',
    nombreFret: 12, poidsFretKg: 1500, typeFret: 'GENERAL'
  }, 'Charge FRET', 201);

  // 5.4: PASSAGERS à 0 (null ≠ 0)
  const r4 = await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'PASSAGERS', sensOperation: 'EMBARQUEMENT',
    passagersAdultes: 0, passagersEnfants: 0
  }, 'PASSAGERS à 0 (null≠0)', null);
  console.log(`   Passagers à 0: status=${r4.status}`);

  // 5.5: BAGAGES sans poids
  const r5 = await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'BAGAGES', sensOperation: 'EMBARQUEMENT', nombreBagagesSoute: 50
  }, 'BAGAGES nombre sans poids (middleware)', null);
  console.log(`   Sans poids: status=${r5.status} (${r5.status === 400 ? 'BLOQUÉ ✅' : 'PASSÉ - vérifier'})`);

  // 5.6: typeCharge invalide
  const r6 = await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'INVALIDE', sensOperation: 'DEBARQUEMENT'
  }, 'typeCharge invalide', null);
  console.log(`   Type invalide: status=${r6.status}`);

  // 5.7: typeFret invalide
  const r7 = await api('POST', `/crv/${CRV_ID}/charges`, {
    typeCharge: 'FRET', sensOperation: 'EMBARQUEMENT', typeFret: 'INVALIDE'
  }, 'typeFret invalide', null);
  console.log(`   typeFret invalide: status=${r7.status}`);
}

// ─── SECTION 6: ÉVÉNEMENTS ───────────────────────────────────
async function testSection6() {
  console.log('\n═══ SECTION 6: ÉVÉNEMENTS ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  // 6.1: Types valides (8 dans le backend)
  const typesValides = ['PANNE_EQUIPEMENT', 'ABSENCE_PERSONNEL', 'RETARD', 'INCIDENT_SECURITE',
    'INCIDENT_TECHNIQUE', 'PROBLEME_TECHNIQUE', 'METEO', 'AUTRE'];
  for (const te of typesValides) {
    const r = await api('POST', `/crv/${CRV_ID}/evenements`, {
      typeEvenement: te, gravite: 'MINEURE',
      description: `Test ${te}`, dateHeureDebut: new Date().toISOString()
    }, `Événement ${te}`, 201);
    if (te === 'RETARD' && r.data?.data?._id) EVENEMENT_ID = r.data.data._id;
  }

  // 6.2: Types FANTÔMES frontend (11 types inexistants en backend)
  const typesFantomes = [
    'RETARD_DEPART', 'RETARD_ARRIVEE', 'RETARD_EMBARQUEMENT', 'RETARD_DEBARQUEMENT',
    'SURCHARGE', 'SOUS_EFFECTIF', 'DEFAUT_MATERIEL', 'NON_CONFORMITE',
    'PLAINTE_PASSAGER', 'DEFAILLANCE_SYSTEME', 'COMMUNICATION'
  ];
  let fantomesAcceptes = 0;
  for (const te of typesFantomes) {
    const r = await api('POST', `/crv/${CRV_ID}/evenements`, {
      typeEvenement: te, gravite: 'MINEURE',
      description: `Fantôme ${te}`, dateHeureDebut: new Date().toISOString()
    }, `Type FANTÔME ${te}`, null);
    if (r.status < 400) { fantomesAcceptes++; console.log(`   ❌ ${te} ACCEPTÉ = BUG`); }
    else { console.log(`   ✅ ${te} REJETÉ`); }
  }
  console.log(`   RÉSULTAT: ${fantomesAcceptes}/11 fantômes acceptés`);

  // 6.3: Sans champs requis
  await api('POST', `/crv/${CRV_ID}/evenements`, { typeEvenement: 'RETARD' },
    'Événement sans gravité/description', 400);

  // 6.4: Gravité invalide
  const r4 = await api('POST', `/crv/${CRV_ID}/evenements`, {
    typeEvenement: 'RETARD', gravite: 'CATASTROPHIQUE',
    description: 'Test', dateHeureDebut: new Date().toISOString()
  }, 'Gravité invalide', null);
  console.log(`   Gravité invalide: status=${r4.status}`);

  // 6.5: Toutes les gravités valides
  for (const g of ['MINEURE', 'MODEREE', 'MAJEURE', 'CRITIQUE']) {
    await api('POST', `/crv/${CRV_ID}/evenements`, {
      typeEvenement: 'AUTRE', gravite: g,
      description: `Test gravité ${g}`, dateHeureDebut: new Date().toISOString()
    }, `Gravité ${g}`, 201);
  }
}

// ─── SECTION 7: OBSERVATIONS ──────────────────────────────────
async function testSection7() {
  console.log('\n═══ SECTION 7: OBSERVATIONS ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  const categories = ['GENERALE', 'TECHNIQUE', 'OPERATIONNELLE', 'SECURITE', 'QUALITE', 'SLA'];
  for (const cat of categories) {
    await api('POST', `/crv/${CRV_ID}/observations`,
      { categorie: cat, contenu: `Observation ${cat} - test certification` },
      `Observation ${cat}`, 201);
  }
}

// ─── SECTION 8: COMPLÉTUDE + VALIDATION ──────────────────────
async function testSection8() {
  console.log('\n═══ SECTION 8: COMPLÉTUDE + VALIDATION ═══');
  if (!CRV_ID) { console.log('⚠️ SKIP'); return; }

  // 8.1: Vérifier complétude
  const r1 = await api('GET', `/crv/${CRV_ID}`, null, 'Obtenir CRV (complétude)', 200);
  const crv = r1.data?.data?.crv || r1.data?.data;
  console.log(`   Complétude: ${crv?.completude}%`);
  console.log(`   Statut: ${crv?.statut}`);

  // 8.2: Terminer
  const r2 = await api('POST', `/crv/${CRV_ID}/terminer`, null,
    'Terminer CRV (EN_COURS → TERMINE)', null);
  console.log(`   Terminer: status=${r2.status}, message=${r2.data?.message}`);

  if (r2.status === 200) {
    // 8.3: Valider
    const r3 = await api('POST', `/validation/${CRV_ID}/valider`,
      { commentaires: 'Validation certification' },
      'Valider CRV (TERMINE → VALIDE/VERROUILLE)', null);
    console.log(`   Valider: status=${r3.status}`);
    if (r3.data?.data) {
      console.log(`   Statut validation: ${r3.data.data.statut}`);
      console.log(`   Score: ${r3.data.data.scoreCompletude}`);
      if (r3.data.data.anomaliesDetectees?.length) {
        console.log(`   Anomalies: ${JSON.stringify(r3.data.data.anomaliesDetectees)}`);
      }
    }

    // 8.4: Vérifier statut
    const r4 = await api('GET', `/crv/${CRV_ID}`, null, 'Statut post-validation', 200);
    const crvPost = r4.data?.data?.crv || r4.data?.data;
    console.log(`   Statut final: ${crvPost?.statut}`);

    // 8.5: Modifier CRV verrouillé (doit échouer)
    if (crvPost?.statut === 'VERROUILLE' || crvPost?.statut === 'VALIDE') {
      const r5 = await api('POST', `/crv/${CRV_ID}/personnel`,
        { nom: 'FAIL', prenom: 'ShouldFail', fonction: 'AUTRE' },
        'Modifier CRV VERROUILLÉ (doit échouer)', null);
      console.log(`   Modif verrouillé: ${r5.status} (${r5.status >= 400 ? 'BLOQUÉ ✅' : 'PASSÉ ❌ BUG'})`);
    }

    // 8.6: Déverrouiller CRV archivé (DOIT ÉCHOUER — archivage immédiat = immuable)
    if (crvPost?.statut === 'VERROUILLE') {
      const rUnlock = await api('POST', `/validation/${CRV_ID}/deverrouiller`,
        { raison: 'Test certification déverrouillage' },
        'Déverrouiller CRV archivé (403 attendu - immuable)', 403);
      console.log(`   Déverrouillage archivé: ${rUnlock.status} (${rUnlock.status === 403 ? 'BLOQUÉ ✅ immuable' : rUnlock.status === 200 ? 'OUVERT' : 'ERREUR'})`);

      // 8.7: Re-verrouiller (déjà verrouillé → 409 attendu — FIX BUG-4)
      const rLock = await api('POST', `/validation/${CRV_ID}/verrouiller`, null,
        'Re-verrouiller CRV déjà verrouillé (409 attendu — FIX BUG-4)', 409);
      console.log(`   Re-verrouiller: ${rLock.status} (${rLock.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);
    }

    // 8.8: Supprimer CRV >= TERMINE
    const r8 = await api('DELETE', `/crv/${CRV_ID}`, null,
      'Supprimer CRV VERROUILLE (doit échouer)', null);
    console.log(`   Suppression: ${r8.status} (${r8.status >= 400 ? 'BLOQUÉ ✅' : 'PASSÉ ❌ BUG'})`);
  } else {
    console.log(`   ⚠️ CRV non terminé — raison: ${r2.data?.message}`);
    // Essayer de comprendre pourquoi
    const rpCheck = await api('GET', `/phases/?crvId=${CRV_ID}`, null, 'Check phases', 200);
    if (rpCheck.data?.data) {
      const stats = {};
      rpCheck.data.data.forEach(p => stats[p.statut] = (stats[p.statut] || 0) + 1);
      console.log(`   Phases: ${JSON.stringify(stats)}`);
    }
  }
}

// ─── SECTION 9: TESTS MACHINE À ÉTATS + VIOLATIONS ──────────
// Créer un CRV dédié et tester les transitions interdites
async function testSection9() {
  console.log('\n═══ SECTION 9: MACHINE À ÉTATS — TRANSITIONS INTERDITES ═══');

  // 9.0: Login SUPERVISEUR (re-auth)
  const loginR = await api('POST', '/auth/login', {
    email: 'superviseur@crv.test', password: 'Test1234!'
  }, 'Re-login SUPERVISEUR', 200);
  if (loginR.data?.token) TOKEN = loginR.data.token;
  if (loginR.data?.user?._id) USER_ID = loginR.data.user._id;

  const UID2 = Date.now().toString().slice(-5);
  const today2 = new Date().toISOString().split('T')[0];

  // 9.1: Créer CRV dédié pour tests machine à états
  const rCreate = await api('POST', '/crv/', {
    vol: {
      numeroVol: `SM${UID2}A`,
      compagnieAerienne: 'TEST SM',
      codeIATA: 'SM',
      dateVol: today2,
      typeOperation: 'ARRIVEE',
      typeVolHorsProgramme: 'COMMERCIAL',
      raisonHorsProgramme: 'Vol test state machine',
      aeroportOrigine: 'CDG'
    },
    escale: 'DKR'
  }, 'Créer CRV dédié machine à états', 201);

  if (!rCreate.data?.data?._id) {
    console.log('⚠️ SKIP section 9 — création CRV échouée');
    return;
  }

  const SM_CRV = rCreate.data.data._id;
  console.log(`   SM_CRV: ${SM_CRV}`);

  // Définir responsableVol (setup, non-assertion)
  await api('PATCH', `/crv/${SM_CRV}`, { responsableVol: 'SM Tester' }, 'Définir responsableVol SM');

  // ─── 9.2: BROUILLON → VALIDER (interdit: doit être TERMINE) ───
  const rVal = await api('POST', `/validation/${SM_CRV}/valider`, {
    commentaires: 'Test validation depuis BROUILLON'
  }, 'Valider CRV depuis BROUILLON (409 attendu)', 409);
  console.log(`   BROUILLON→VALIDER: ${rVal.status} (${rVal.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.3: BROUILLON → VERROUILLER (interdit: doit être VALIDE) ───
  const rLock = await api('POST', `/validation/${SM_CRV}/verrouiller`, null,
    'Verrouiller CRV depuis BROUILLON (409 attendu)', 409);
  console.log(`   BROUILLON→VERROUILLER: ${rLock.status} (${rLock.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.4: BROUILLON → TERMINER (interdit: doit être EN_COURS) ───
  const rTerm = await api('POST', `/crv/${SM_CRV}/terminer`, null,
    'Terminer CRV depuis BROUILLON (400 attendu)', 400);
  console.log(`   BROUILLON→TERMINER: ${rTerm.status} (${rTerm.status === 400 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.5: BROUILLON → DÉVERROUILLER (interdit: pas verrouillé) ───
  const rUnl = await api('POST', `/validation/${SM_CRV}/deverrouiller`, {
    raison: 'Test depuis BROUILLON'
  }, 'Déverrouiller CRV depuis BROUILLON (409 attendu)', 409);
  console.log(`   BROUILLON→DÉVERROUILLER: ${rUnl.status} (${rUnl.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.6: DÉMARRER (BROUILLON → EN_COURS) — transition valide ───
  const rDem = await api('POST', `/crv/${SM_CRV}/demarrer`, null,
    'Démarrer CRV (BROUILLON → EN_COURS)', 200);
  console.log(`   BROUILLON→EN_COURS: ${rDem.status} (${rDem.status === 200 ? '✅' : '❌'})`);

  // ─── 9.7: EN_COURS → VALIDER (interdit: doit être TERMINE) ───
  const rVal2 = await api('POST', `/validation/${SM_CRV}/valider`, {
    commentaires: 'Test depuis EN_COURS'
  }, 'Valider CRV depuis EN_COURS (409 attendu)', 409);
  console.log(`   EN_COURS→VALIDER: ${rVal2.status} (${rVal2.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.8: EN_COURS → VERROUILLER (interdit: doit être VALIDE) ───
  const rLock2 = await api('POST', `/validation/${SM_CRV}/verrouiller`, null,
    'Verrouiller CRV depuis EN_COURS (409 attendu)', 409);
  console.log(`   EN_COURS→VERROUILLER: ${rLock2.status} (${rLock2.status === 409 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.9: EN_COURS → DÉMARRER (interdit: déjà démarré) ───
  const rDem2 = await api('POST', `/crv/${SM_CRV}/demarrer`, null,
    'Re-démarrer CRV déjà EN_COURS (400 attendu)', 400);
  console.log(`   EN_COURS→EN_COURS: ${rDem2.status} (${rDem2.status === 400 ? 'REJETÉ ✅' : 'ERREUR ❌'})`);

  // ─── 9.10: Suppression CRV BROUILLON (autorisée — cleanup) ───
  // Ce CRV est EN_COURS, pas BROUILLON, donc suppression devrait être bloquée ≥ TERMINE
  // mais la règle est ≥ TERMINE. EN_COURS est avant TERMINE donc possiblement OK.
  // On vérifie simplement, pas d'assertion.
  const rDel = await api('DELETE', `/crv/${SM_CRV}`, null, 'Supprimer CRV EN_COURS');
  console.log(`   Supprimer EN_COURS: status=${rDel.status}`);
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   CRV BACKEND CERTIFICATION — API TESTS v2          ║');
  console.log('║   Date: ' + new Date().toISOString().slice(0, 19) + '                ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  await testAuth();
  await testSection1();
  await testSection2();
  await testSection3();
  await testSection4();
  await testSection5();
  await testSection6();
  await testSection7();
  await testSection8();
  await testSection9();

  // ─── RAPPORT ──────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  RÉSULTATS FINAUX');
  console.log('═══════════════════════════════════════════════════════');

  const total = RESULTS.length;
  const withExpected = RESULTS.filter(r => r.expectedStatus);
  const passed = withExpected.filter(r => r.success).length;
  const failed = withExpected.filter(r => !r.success).length;
  const exploratory = RESULTS.filter(r => !r.expectedStatus);

  console.log(`Total tests: ${total}`);
  console.log(`Tests avec assertion: ${withExpected.length} (✅ ${passed} / ❌ ${failed})`);
  console.log(`Tests exploratoires: ${exploratory.length}`);

  if (failed > 0) {
    console.log('\n── ÉCHECS ──');
    withExpected.filter(r => !r.success).forEach(f => {
      console.log(`  ❌ [${f.status}] ${f.method} ${f.path} — ${f.description} (attendu ${f.expectedStatus})`);
    });
  }

  // Détail exploratoires intéressants
  console.log('\n── RÉSULTATS EXPLORATOIRES NOTABLES ──');
  exploratory.forEach(r => {
    if (r.status >= 400 || r.description.includes('BUG') || r.description.includes('BYPASS') || r.description.includes('FANTÔME')) {
      console.log(`  [${r.status}] ${r.method} ${r.path} — ${r.description}`);
    }
  });

  // Export JSON
  const fs = await import('fs');
  fs.writeFileSync('tests/certification-results.json',
    JSON.stringify({ date: new Date().toISOString(), summary: { total, passed, failed }, results: RESULTS }, null, 2));
  console.log('\n📄 Résultats: tests/certification-results.json');
}

main().catch(console.error);
