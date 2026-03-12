/**
 * MISSION 032 — TEST E2E COMPLET CRV
 * Script de test operationnel
 */

const BASE = 'http://localhost:4000/api';
const RESULTS = { steps: [], errors: [], warnings: [] };

function log(step, msg, data = null) {
  const entry = { step, msg, data, time: new Date().toISOString() };
  RESULTS.steps.push(entry);
  console.log(`[${step}] ${msg}`, data ? JSON.stringify(data).substring(0, 300) : '');
}

function logError(step, msg, data = null) {
  RESULTS.errors.push({ step, msg, data });
  console.error(`[ERROR][${step}] ${msg}`, data ? JSON.stringify(data).substring(0, 300) : '');
}

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json.data || json };
}

// ========================================================
// MAIN
// ========================================================
async function main() {
  console.log('========================================');
  console.log('  MISSION 032 — TEST E2E COMPLET CRV');
  console.log('  Date:', new Date().toISOString());
  console.log('========================================\n');

  // === STEP 0: LOGIN ===
  log('LOGIN', 'Connexion superviseur@crv.test');
  const loginRes = await api('POST', '/auth/login', { email: 'superviseur@crv.test', password: 'Test1234!' });
  if (loginRes.status !== 200) { logError('LOGIN', 'Echec login', loginRes); return; }
  const token = loginRes.data.token;
  const user = loginRes.data.user || loginRes.data;
  log('LOGIN', 'OK', { nom: user.nom, prenom: user.prenom, fonction: user.fonction });

  // === STEP 1: PROGRAMME DE VOL ===
  console.log('\n=== ETAPE 1: PROGRAMME DE VOL ===');

  const uniqueSuffix = Date.now().toString(36);
  const prog = await api('POST', '/programmes-vol', {
    nom: `Programme E2E Test ${uniqueSuffix}`,
    dateDebut: '2026-03-10',
    dateFin: '2026-03-16',
    saison: 'ETE_2026'
  }, token);
  log('PROG', 'Creer programme', { status: prog.status });
  const progId = prog.data?._id || prog.data?.programme?._id;

  if (!progId) {
    logError('PROG', 'Pas de progId', prog.data);
    return;
  }
  log('PROG', 'Programme cree', { id: progId });

  // Ajouter 3 vols
  const volsDef = [
    { numeroVol: 'AF123', compagnie: 'Air France', typeOperation: 'ARRIVEE', escale: 'NDJ', typeAppareil: 'A320', heureArrivee: '08:30', joursSemaine: [1,2,3,4,5] },
    { numeroVol: 'ET450', compagnie: 'Ethiopian', typeOperation: 'DEPART', escale: 'NDJ', typeAppareil: 'B737', heureDepart: '14:00', joursSemaine: [1,2,3,4,5] },
    { numeroVol: 'TK890', compagnie: 'Turkish Airlines', typeOperation: 'TURN_AROUND', escale: 'NDJ', typeAppareil: 'A321', heureArrivee: '10:00', heureDepart: '16:00', joursSemaine: [1,2,3,4,5] }
  ];

  for (const vol of volsDef) {
    const r = await api('POST', `/programmes-vol/${progId}/vols`, vol, token);
    log('PROG_VOL', `Vol ${vol.numeroVol}: ${r.status}`, { type: vol.typeOperation });
    if (r.status >= 400) logError('PROG_VOL', `Echec creation vol ${vol.numeroVol}`, r.data);
  }

  // Valider
  const valProg = await api('POST', `/programmes-vol/${progId}/valider`, null, token);
  log('PROG', 'Valider programme', { status: valProg.status });

  // Activer
  const actProg = await api('POST', `/programmes-vol/${progId}/activer`, null, token);
  log('PROG', 'Activer programme', { status: actProg.status, statut: actProg.data?.statut });

  // === STEP 2: BULLETIN DE MOUVEMENT ===
  console.log('\n=== ETAPE 2: BULLETIN DE MOUVEMENT ===');

  const bull = await api('POST', '/bulletins', {
    escale: 'NDJ',
    dateDebut: '2026-03-10',
    dateFin: '2026-03-10',
    mouvements: [
      { numeroVol: 'AF123', compagnie: 'Air France', typeOperation: 'ARRIVEE', typeAppareil: 'A320', heureArrivee: '08:30' },
      { numeroVol: 'ET450', compagnie: 'Ethiopian', typeOperation: 'DEPART', typeAppareil: 'B737', heureDepart: '14:00' },
      { numeroVol: 'TK890', compagnie: 'Turkish Airlines', typeOperation: 'TURN_AROUND', typeAppareil: 'A321', heureArrivee: '10:00', heureDepart: '16:00' }
    ]
  }, token);
  log('BULLETIN', 'Creer bulletin', { status: bull.status });
  const bullId = bull.data?._id || bull.data?.bulletin?._id;

  if (!bullId) {
    logError('BULLETIN', 'Pas de bulletinId', bull.data);
    // Try alternative: get existing bulletin
    const existing = await api('GET', '/bulletins/en-cours/NDJ', null, token);
    log('BULLETIN', 'Bulletin existant?', { status: existing.status });
    if (existing.status === 200) {
      const existBull = existing.data?.bulletin || existing.data;
      log('BULLETIN', 'Bulletin existant trouve', { id: existBull?._id, mouvements: existBull?.mouvements?.length });
    }
  } else {
    log('BULLETIN', 'Bulletin cree', { id: bullId });

    // Publier
    const pubRes = await api('POST', `/bulletins/${bullId}/publier`, null, token);
    log('BULLETIN', 'Publier bulletin', { status: pubRes.status, statut: pubRes.data?.statut });
  }

  // Get bulletin en cours pour NDJ
  const bullEnCours = await api('GET', '/bulletins/en-cours/NDJ', null, token);
  log('BULLETIN', 'Bulletin en cours NDJ', { status: bullEnCours.status });
  const bulletinActif = bullEnCours.data?.bulletin || bullEnCours.data;
  const mouvements = bulletinActif?.mouvements || [];
  log('BULLETIN', `Mouvements trouves: ${mouvements.length}`);

  for (const m of mouvements.slice(0, 5)) {
    log('BULLETIN', `  ${m.numeroVol} | ${m.typeOperation} | ${m.compagnie || m.codeCompagnie} | CRV: ${m.crvId ? 'OUI' : 'NON'}`);
  }

  // === STEP 3: CREATION CRV ===
  console.log('\n=== ETAPE 3: CREATION CRV ===');

  const crvIds = [];
  const sansCrv = mouvements.filter(m => !m.crvId);
  log('CRV', `Mouvements sans CRV: ${sansCrv.length}`);

  // On prend les 3 premiers mouvements sans CRV
  const targets = sansCrv.slice(0, 3);

  if (targets.length === 0) {
    log('CRV', 'Pas de mouvement sans CRV, creation en mode legacy');
    // Mode legacy: creer 3 CRV directement
    for (const type of ['arrivee', 'depart', 'arrivee']) {
      const r = await api('POST', '/crv', { type, escale: 'NDJ' }, token);
      log('CRV', `Creer CRV ${type}: ${r.status}`, { id: r.data?._id, statut: r.data?.statut, numeroCRV: r.data?.numeroCRV });
      if (r.data?._id) crvIds.push({ id: r.data._id, type: r.data.vol?.typeOperation || type.toUpperCase(), num: r.data.numeroCRV });
    }
  } else {
    for (const m of targets) {
      const r = await api('POST', '/crv', {
        bulletinId: bulletinActif._id,
        mouvementId: m._id
      }, token);
      log('CRV', `Creer CRV ${m.numeroVol} (${m.typeOperation}): ${r.status}`, {
        id: r.data?._id, statut: r.data?.statut, numeroCRV: r.data?.numeroCRV
      });
      if (r.data?._id) {
        crvIds.push({ id: r.data._id, type: m.typeOperation, num: r.data.numeroCRV, vol: m.numeroVol });
      } else {
        logError('CRV', `Echec creation CRV pour ${m.numeroVol}`, r.data);
      }
    }
  }

  log('CRV', `Total CRV crees: ${crvIds.length}`);

  if (crvIds.length === 0) {
    logError('CRV', 'Aucun CRV cree, arret');
    printSummary();
    return;
  }

  // === STEP 4: RECHERCHE CRV ===
  console.log('\n=== ETAPE 4: RECHERCHE CRV ===');

  for (const crv of crvIds) {
    const r = await api('GET', `/crv/${crv.id}`, null, token);
    const crvData = r.data?.crv || r.data;
    log('SEARCH', `CRV ${crv.num}: ${r.status}`, {
      statut: crvData?.statut,
      typeOperation: crvData?.vol?.typeOperation,
      compagnie: crvData?.vol?.compagnieAerienne || crvData?.vol?.compagnie,
      numeroVol: crvData?.vol?.numeroVol,
      completude: crvData?.completude
    });
  }

  // === STEP 5: DEMARRER CRV ===
  console.log('\n=== ETAPE 5: DEMARRER CRV ===');

  for (const crv of crvIds) {
    const r = await api('POST', `/crv/${crv.id}/demarrer`, null, token);
    log('DEMARRER', `${crv.num}: ${r.status}`, { statut: r.data?.statut });
    if (r.status >= 400) logError('DEMARRER', `Echec demarrage ${crv.num}`, r.data);
  }

  // === STEP 6: PERSONNEL ===
  console.log('\n=== ETAPE 6: PERSONNEL ===');

  const personnel = [
    { nom: 'HASSAN', prenom: 'Ali', fonction: 'CHEF_ESCALE', matricule: 'CE-032' },
    { nom: 'OMAR', prenom: 'Fatouma', fonction: 'AGENT_PISTE', matricule: 'AP-032' },
    { nom: 'MOUSSA', prenom: 'Idriss', fonction: 'AGENT_TRAFIC', matricule: 'AT-032' }
  ];

  const testCrv = crvIds[0]; // Test sur le premier CRV
  for (const p of personnel) {
    const r = await api('POST', `/crv/${testCrv.id}/personnel`, p, token);
    log('PERSONNEL', `${p.fonction} ${p.nom}: ${r.status}`, { id: r.data?.personnel?.[r.data.personnel.length-1]?._id });
    if (r.status >= 400) logError('PERSONNEL', `Echec ajout ${p.nom}`, r.data);
  }

  // Verify
  const crvAfterPers = await api('GET', `/crv/${testCrv.id}`, null, token);
  const crvPersData = crvAfterPers.data?.crv || crvAfterPers.data;
  log('PERSONNEL', `CRV apres personnel: ${crvPersData?.personnel?.length} personnes`);

  // === STEP 7: PHASES ===
  console.log('\n=== ETAPE 7: PHASES ===');

  // Lister phases du CRV
  const phasesRes = await api('GET', `/phases?crvId=${testCrv.id}`, null, token);
  const phases = phasesRes.data?.phases || phasesRes.data || [];
  log('PHASES', `Phases trouvees: ${phases.length}`);

  if (phases.length > 0) {
    // Demarrer premiere phase
    const phase1 = phases[0];
    log('PHASES', `Phase 1: ${phase1.phase?.type || phase1.nomPhase} - statut: ${phase1.statut}`);

    const demPhase = await api('POST', `/phases/${phase1._id}/demarrer`, null, token);
    log('PHASES', `Demarrer phase: ${demPhase.status}`, { statut: demPhase.data?.phase?.statut || demPhase.data?.statut });
    if (demPhase.status >= 400) logError('PHASES', 'Echec demarrage phase', demPhase.data);

    // Terminer premiere phase
    const termPhase = await api('POST', `/phases/${phase1._id}/terminer`, null, token);
    log('PHASES', `Terminer phase: ${termPhase.status}`, { statut: termPhase.data?.phase?.statut || termPhase.data?.statut });
    if (termPhase.status >= 400) logError('PHASES', 'Echec terminaison phase', termPhase.data);

    // Marquer phase 2 comme NON_REALISE
    if (phases.length > 1) {
      const phase2 = phases[1];
      const nrPhase = await api('POST', `/phases/${phase2._id}/non-realise`, {
        motifNonRealisation: 'EQUIPEMENT_INDISPONIBLE',
        detailMotif: 'Equipement en maintenance'
      }, token);
      log('PHASES', `Non-realise phase 2: ${nrPhase.status}`, { statut: nrPhase.data?.phase?.statut || nrPhase.data?.statut });
      if (nrPhase.status >= 400) logError('PHASES', 'Echec non-realise', nrPhase.data);
    }

    // Traiter toutes les phases restantes pour atteindre 100%
    for (let i = 2; i < phases.length; i++) {
      const p = phases[i];
      // Demarrer
      await api('POST', `/phases/${p._id}/demarrer`, null, token);
      // Terminer
      const tr = await api('POST', `/phases/${p._id}/terminer`, null, token);
      if (i < 5) log('PHASES', `Phase ${i+1}: terminer=${tr.status}`);
    }
    log('PHASES', 'Toutes les phases traitees');
  }

  // === STEP 8: CHARGES ===
  console.log('\n=== ETAPE 8: CHARGES ===');

  const charges = [
    { typeCharge: 'PASSAGERS', sensOperation: 'DEBARQUEMENT', passagersAdultes: 120, passagersEnfants: 15, passagersBebes: 3, passagersTransit: 10 },
    { typeCharge: 'BAGAGES', sensOperation: 'DEBARQUEMENT', nombreBagages: 180, poidsBagages: 2700 },
    { typeCharge: 'FRET', sensOperation: 'DEBARQUEMENT', poidsFret: 5000 }
  ];

  for (const charge of charges) {
    const r = await api('POST', `/crv/${testCrv.id}/charges`, charge, token);
    log('CHARGES', `${charge.typeCharge}: ${r.status}`, { id: r.data?.charge?._id });
    if (r.status >= 400) logError('CHARGES', `Echec charge ${charge.typeCharge}`, r.data);
  }

  // === STEP 9: EVENEMENTS ===
  console.log('\n=== ETAPE 9: EVENEMENTS ===');

  const evt = await api('POST', `/crv/${testCrv.id}/evenements`, {
    typeEvenement: 'RETARD',
    gravite: 'MODEREE',
    description: 'Retard embarquement cause meteo',
    dateHeureDebut: new Date().toISOString(),
    actionsCorrectives: 'Replanification gate'
  }, token);
  log('EVENEMENT', `Creer evenement: ${evt.status}`, { typeEvenement: 'RETARD' });
  if (evt.status >= 400) logError('EVENEMENT', 'Echec evenement', evt.data);

  // Test XSS
  const xssEvt = await api('POST', `/crv/${testCrv.id}/evenements`, {
    typeEvenement: 'INCIDENT_TECHNIQUE',
    gravite: 'MINEURE',
    description: '<script>alert("xss")</script>Test XSS',
    dateHeureDebut: new Date().toISOString(),
    actionsCorrectives: '<img onerror=alert(1) src=x>'
  }, token);
  log('EVENEMENT', `XSS test: ${xssEvt.status}`);
  if (xssEvt.status === 201 || xssEvt.status === 200) {
    const desc = xssEvt.data?.evenement?.description || xssEvt.data?.description || '';
    const hasScript = desc.includes('<script>');
    log('EVENEMENT', `XSS protection: ${hasScript ? 'ECHEC - script non echappe!' : 'OK - script echappe'}`);
  }

  // === STEP 9b: AJOUTER RESPONSABLE VOL (requis pour validation) ===
  console.log('\n=== ETAPE 9b: RESPONSABLE VOL ===');

  // Recuperer les personnel du CRV pour prendre le premier comme responsableVol
  const crvDetailForResp = await api('GET', `/crv/${testCrv.id}`, null, token);
  const crvForResp = crvDetailForResp.data?.crv || crvDetailForResp.data;
  const personnelList = crvForResp?.personnel || [];
  log('RESPONSABLE', `Personnel du CRV: ${personnelList.length}`);

  if (personnelList.length > 0) {
    const respId = personnelList[0]._id || personnelList[0];
    const patchResp = await api('PATCH', `/crv/${testCrv.id}`, { responsableVol: respId }, token);
    log('RESPONSABLE', `Set responsableVol: ${patchResp.status}`, { responsableVol: respId });
    if (patchResp.status >= 400) logError('RESPONSABLE', 'Echec set responsableVol', patchResp.data);
  } else {
    log('RESPONSABLE', 'Aucun personnel, on essaie avec le user ID');
    const patchResp = await api('PATCH', `/crv/${testCrv.id}`, { responsableVol: user._id || user.id }, token);
    log('RESPONSABLE', `Set responsableVol (user): ${patchResp.status}`);
  }

  // === STEP 10: TERMINER CRV ===
  console.log('\n=== ETAPE 10: TERMINER CRV ===');

  // Verifier completude avant
  const preTermin = await api('GET', `/crv/${testCrv.id}`, null, token);
  const preTerminCrv = preTermin.data?.crv || preTermin.data;
  log('TERMINER', `Completude avant: ${preTerminCrv?.completude}%`);

  const termCrv = await api('POST', `/crv/${testCrv.id}/terminer`, null, token);
  log('TERMINER', `Terminer CRV: ${termCrv.status}`, { statut: termCrv.data?.statut, message: termCrv.data?.message });
  if (termCrv.status >= 400) logError('TERMINER', 'Echec terminaison CRV', termCrv.data);

  // === STEP 11: VALIDATION (avec superviseur) ===
  console.log('\n=== ETAPE 11: VALIDATION ===');

  const getStatut = async (id) => {
    const r = await api('GET', `/crv/${id}`, null, token);
    const c = r.data?.crv || r.data;
    return c?.statut;
  };

  const statutApresTerminer = await getStatut(testCrv.id);
  log('VALIDATION', `Statut actuel: ${statutApresTerminer}`);

  if (statutApresTerminer === 'TERMINE') {
    // Valider
    const valCrv = await api('POST', `/validation/${testCrv.id}/valider`, { commentaires: 'Test E2E valide' }, token);
    log('VALIDATION', `Valider: ${valCrv.status}`, {
      statut: valCrv.data?.statut,
      anomalies: valCrv.data?.anomaliesDetectees,
      scoreCompletude: valCrv.data?.scoreCompletude,
      message: valCrv.data?.message
    });
    if (valCrv.status >= 400) logError('VALIDATION', 'Echec validation', valCrv.data);
    if (valCrv.data?.statut === 'EN_ATTENTE_CORRECTION') {
      log('VALIDATION', `Anomalies: ${JSON.stringify(valCrv.data?.anomaliesDetectees)}`);
    }

    const statutApresVal = await getStatut(testCrv.id);
    log('VALIDATION', `Statut apres validation: ${statutApresVal}`);

    if (statutApresVal === 'VALIDE') {
      // Verrouiller
      const verr = await api('POST', `/validation/${testCrv.id}/verrouiller`, null, token);
      log('VALIDATION', `Verrouiller: ${verr.status}`, { statut: verr.data?.statut });
      if (verr.status >= 400) logError('VALIDATION', 'Echec verrouillage', verr.data);

      const statutFinal = await getStatut(testCrv.id);
      log('VALIDATION', `Statut final: ${statutFinal}`);
    }
  } else {
    log('VALIDATION', `CRV pas en TERMINE (${statutApresTerminer}), skip validation`);
  }

  // === STEP 12: ARCHIVAGE ===
  console.log('\n=== ETAPE 12: ARCHIVAGE ===');
  const finalCrv = await api('GET', `/crv/${testCrv.id}`, null, token);
  const finalCrvData = finalCrv.data?.crv || finalCrv.data;
  log('ARCHIVE', `CRV final`, {
    statut: finalCrvData?.statut,
    completude: finalCrvData?.completude,
    archivage: finalCrvData?.archivage?.statut || 'non archive'
  });

  // Test immutabilite: essayer de modifier un CRV verrouille
  if (finalCrvData?.statut === 'VERROUILLE') {
    const modif = await api('POST', `/crv/${testCrv.id}/personnel`, {
      nom: 'TEST', prenom: 'Immutabilite', fonction: 'AGENT_PISTE'
    }, token);
    log('ARCHIVE', `Test immutabilite (modif CRV verrouille): ${modif.status}`, { expected: '403 ou 400' });
  }

  // === SUMMARY ===
  printSummary();
}

import fs from 'fs';

function printSummary() {
  console.log('\n========================================');
  console.log('  RESUME TEST E2E');
  console.log('========================================');
  console.log(`Total etapes: ${RESULTS.steps.length}`);
  console.log(`Erreurs: ${RESULTS.errors.length}`);

  if (RESULTS.errors.length > 0) {
    console.log('\n--- ERREURS ---');
    for (const e of RESULTS.errors) {
      console.log(`  [${e.step}] ${e.msg}`);
    }
  }

  console.log('\nVERDICT:', RESULTS.errors.length === 0 ? 'PASS ✅' : `${RESULTS.errors.length} ERREURS ⚠️`);

  fs.writeFileSync('tests/e2e-results.json', JSON.stringify(RESULTS, null, 2));
  console.log('\nResultats ecrits dans tests/e2e-results.json');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
