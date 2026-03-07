import http from 'http';

function apiCall(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 4000, path,
      method, headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('=== PHASE 7 — PERFORMANCE (5 CRV, ~20 événements) ===\n');

  const agentLogin = await apiCall('POST', '/api/auth/login', '', { email: 'agent@crv.test', password: 'Test1234!' });
  const agentToken = agentLogin.data.token;
  const profileResp = await apiCall('GET', '/api/auth/me', agentToken);
  const agentUserId = profileResp.data?.data?._id || profileResp.data?.data?.id;
  await delay(500);

  const supLogin = await apiCall('POST', '/api/auth/login', '', { email: 'superviseur@crv.test', password: 'Test1234!' });
  const supToken = supLogin.data.token;
  await delay(500);

  const crvIds = [];
  const latencies = [];
  const startTime = Date.now();

  // Créer 5 CRV avec délais suffisants
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    const resp = await apiCall('POST', '/api/crv', agentToken, {
      type: 'depart',
      vol: {
        numeroVol: `P7T${String(i).padStart(2, '0')}`,
        compagnieAerienne: 'AF', aeroportOrigine: 'CDG', aeroportDestination: 'ORY',
        dateVol: new Date().toISOString(), codeIATA: 'CDG', typeOperation: 'DEPART',
        typeVolHorsProgramme: 'CHARTER', raisonHorsProgramme: `Perf test ${i}`
      },
      forceDoublon: true, confirmationLevel: 2
    });
    const lat = Date.now() - t0;
    latencies.push({ op: 'create', lat });
    const id = resp.data?.data?._id;
    if (id) crvIds.push(id);
    console.log(`Créer CRV ${i+1}: ${resp.status === 201 ? '✅' : '❌'} ${resp.status} (${lat}ms)`);
    await delay(500);
  }

  // Démarrer les 5 CRV
  for (const id of crvIds) {
    const t0 = Date.now();
    await apiCall('POST', '/api/crv/' + id + '/demarrer', agentToken);
    latencies.push({ op: 'start', lat: Date.now() - t0 });
    await delay(400);
  }
  console.log(`\n5 CRV démarrés`);

  // Marquer phases + ajouter charges pour chaque CRV
  for (let i = 0; i < crvIds.length; i++) {
    const id = crvIds[i];
    // Phases
    const detail = await apiCall('GET', '/api/crv/' + id, agentToken);
    const phases = detail.data?.data?.phases || [];
    for (const phase of phases) {
      const phaseId = phase._id || phase.id;
      if (phase.statut !== 'TERMINE' && phase.statut !== 'NON_REALISE') {
        await apiCall('POST', '/api/phases/' + phaseId + '/non-realise', agentToken, {
          motifNonRealisation: 'NON_NECESSAIRE', detailMotif: 'Perf test'
        });
        await delay(100);
      }
    }
    // ResponsableVol
    await apiCall('PUT', '/api/crv/' + id, agentToken, { responsableVol: agentUserId });
    await delay(200);
    // Charges
    await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, {
      typeCharge: 'PASSAGERS', sensOperation: 'EMBARQUEMENT', passagersAdultes: 100, passagersEnfants: 5
    });
    await delay(200);
    await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, {
      typeCharge: 'BAGAGES', sensOperation: 'EMBARQUEMENT', nombreBagagesSoute: 80, poidsBagagesSouteKg: 1000, nombreBagagesCabine: 50
    });
    await delay(200);
    await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, {
      typeCharge: 'FRET', sensOperation: 'EMBARQUEMENT', nombreFret: 2, poidsFretKg: 300, typeFret: 'GENERAL'
    });
    await delay(300);
    console.log(`CRV ${i+1}/5 préparé (phases + charges)`);
  }

  // TERMINER les 5 CRV (génère CRV_TERMINE × 5 + CRV_PRET_VALIDATION × 5 = 10 événements)
  console.log('\n--- TERMINER 5 CRV ---');
  let terminateOK = 0;
  for (let i = 0; i < crvIds.length; i++) {
    const t0 = Date.now();
    const resp = await apiCall('POST', '/api/crv/' + crvIds[i] + '/terminer', agentToken);
    const lat = Date.now() - t0;
    latencies.push({ op: 'terminer', lat });
    if (resp.status === 200) terminateOK++;
    console.log(`  Terminer ${i+1}: ${resp.status === 200 ? '✅' : '❌'} ${resp.status} (${lat}ms)`);
    await delay(800); // Délai plus long pour éviter rate limiter
  }

  // VALIDER les 5 CRV (génère CRV_VALIDE × 5 + CRV_VERROUILLE × 5 = 10 événements)
  console.log('\n--- VALIDER 5 CRV ---');
  let validateOK = 0;
  for (let i = 0; i < crvIds.length; i++) {
    const t0 = Date.now();
    const resp = await apiCall('POST', '/api/validation/' + crvIds[i] + '/valider', supToken, { commentaires: 'Perf test' });
    const lat = Date.now() - t0;
    latencies.push({ op: 'valider', lat });
    if (resp.status === 200) validateOK++;
    console.log(`  Valider ${i+1}: ${resp.status === 200 ? '✅' : '❌'} ${resp.status} (${lat}ms)`);
    if (resp.status !== 200) console.log(`    ERR: ${JSON.stringify(resp.data).substring(0, 200)}`);
    await delay(800);
  }

  const totalTime = Date.now() - startTime;

  // Calculer métriques
  const allLats = latencies.map(l => l.lat);
  const avgLat = Math.round(allLats.reduce((a,b)=>a+b,0) / allLats.length);
  const maxLat = Math.max(...allLats);
  const terminateLats = latencies.filter(l => l.op === 'terminer').map(l => l.lat);
  const validateLats = latencies.filter(l => l.op === 'valider').map(l => l.lat);

  console.log('\n=== RÉSULTATS PERFORMANCE ===');
  console.log(`CRV créés: ${crvIds.length}/5`);
  console.log(`CRV terminés: ${terminateOK}/5`);
  console.log(`CRV validés: ${validateOK}/5`);
  console.log(`Événements générés: ~${(terminateOK * 2) + (validateOK * 2)} (TERMINE+PRET_VALIDATION+VALIDE+VERROUILLE)`);
  console.log(`Temps total: ${totalTime}ms`);
  console.log(`Latence moyenne: ${avgLat}ms`);
  console.log(`Latence max: ${maxLat}ms`);
  console.log(`Latence terminer avg: ${Math.round(terminateLats.reduce((a,b)=>a+b,0)/terminateLats.length)}ms`);
  console.log(`Latence valider avg: ${Math.round(validateLats.reduce((a,b)=>a+b,0)/validateLats.length)}ms`);
  console.log(`Toutes latences < 2000ms: ${maxLat < 2000 ? '✅' : '⚠️'}`);

  // Vérifier dashboard OPS après charge
  await delay(500);
  const dashboard = await apiCall('GET', '/api/ops/dashboard', supToken);
  if (dashboard.status === 200) {
    const d = dashboard.data?.data || dashboard.data;
    console.log(`\nDashboard OPS après charge:`);
    console.log(`  Total CRV: ${d.totalCRV}`);
    console.log(`  CRV par statut: ${JSON.stringify(d.crvByStatus)}`);
    console.log(`  Événements récents: ${d.recentEvents?.length || 0}`);
    console.log(`  Alertes: ${d.alertes}`);
    console.log(`  Dashboard stable: ✅`);
  }

  const verdict = terminateOK >= 4 && validateOK >= 4;
  console.log(`\nVERDICT PERF: ${verdict ? '✅ PERFORMANCE OK' : '❌ ÉCHEC PERFORMANCE'}`);
}

run().catch(e => console.error('ERROR:', e));
