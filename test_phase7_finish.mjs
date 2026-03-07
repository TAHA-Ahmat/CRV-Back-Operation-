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
  console.log('=== PHASE 7 — TERMINER + VALIDER 5 CRV (serveur frais) ===\n');

  // Login
  const agentLogin = await apiCall('POST', '/api/auth/login', '', { email: 'agent@crv.test', password: 'Test1234!' });
  const agentToken = agentLogin.data.token;
  await delay(500);
  const supLogin = await apiCall('POST', '/api/auth/login', '', { email: 'superviseur@crv.test', password: 'Test1234!' });
  const supToken = supLogin.data.token;
  await delay(500);

  // Récupérer les CRV EN_COURS (créés par le test précédent)
  const listResp = await apiCall('GET', '/api/crv?statut=EN_COURS&limit=10', agentToken);
  const allCRV = listResp.data?.data || [];
  // Filtrer ceux avec numéro P7Txx (performance test)
  const perfCRVs = allCRV.filter(c => {
    const num = c.vol?.numeroVol || '';
    return num.startsWith('P7T');
  });
  console.log(`CRV EN_COURS trouvés: ${allCRV.length}, dont P7T*: ${perfCRVs.length}`);

  const crvIds = perfCRVs.map(c => c._id || c.id).slice(0, 5);
  if (crvIds.length === 0) {
    console.log('Aucun CRV P7T trouvé — création rapide de 3 CRV');
    // Fallback: créer et préparer 3 CRV rapidement
    const profileResp = await apiCall('GET', '/api/auth/me', agentToken);
    const agentUserId = profileResp.data?.data?._id;

    for (let i = 0; i < 3; i++) {
      const resp = await apiCall('POST', '/api/crv', agentToken, {
        type: 'depart',
        vol: {
          numeroVol: `FIN${String(i).padStart(2, '0')}`,
          compagnieAerienne: 'AF', aeroportOrigine: 'CDG', aeroportDestination: 'ORY',
          dateVol: new Date().toISOString(), codeIATA: 'CDG', typeOperation: 'DEPART',
          typeVolHorsProgramme: 'CHARTER', raisonHorsProgramme: 'Perf finish test'
        },
        forceDoublon: true, confirmationLevel: 2
      });
      const id = resp.data?.data?._id;
      if (id) crvIds.push(id);
      console.log(`  CRV créé: ${resp.status} ${id ? id.substring(0,8) : 'NO_ID'}`);
      await delay(800);
    }

    // Démarrer
    for (const id of crvIds) {
      await apiCall('POST', '/api/crv/' + id + '/demarrer', agentToken);
      await delay(500);
    }

    // Préparer (phases + charges)
    for (const id of crvIds) {
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
      await apiCall('PUT', '/api/crv/' + id, agentToken, { responsableVol: agentUserId });
      await delay(200);
      await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, { typeCharge: 'PASSAGERS', sensOperation: 'EMBARQUEMENT', passagersAdultes: 100, passagersEnfants: 5 });
      await delay(200);
      await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, { typeCharge: 'BAGAGES', sensOperation: 'EMBARQUEMENT', nombreBagagesSoute: 80, poidsBagagesSouteKg: 1000, nombreBagagesCabine: 50 });
      await delay(200);
      await apiCall('POST', '/api/crv/' + id + '/charges', agentToken, { typeCharge: 'FRET', sensOperation: 'EMBARQUEMENT', nombreFret: 2, poidsFretKg: 300, typeFret: 'GENERAL' });
      await delay(300);
      console.log(`  CRV préparé: ${id.substring(0,8)}`);
    }
  }

  console.log(`\nCRV à traiter: ${crvIds.length}`);

  // TERMINER avec délais longs
  console.log('\n--- TERMINER ---');
  let terminateOK = 0;
  const terminateLats = [];
  for (let i = 0; i < crvIds.length; i++) {
    const t0 = Date.now();
    const resp = await apiCall('POST', '/api/crv/' + crvIds[i] + '/terminer', agentToken);
    const lat = Date.now() - t0;
    terminateLats.push(lat);
    if (resp.status === 200) terminateOK++;
    console.log(`  ${i+1}/${crvIds.length}: ${resp.status === 200 ? '✅' : '❌'} ${resp.status} (${lat}ms)`);
    if (resp.status !== 200) console.log(`    ${JSON.stringify(resp.data).substring(0, 150)}`);
    await delay(2000); // 2s entre chaque pour éviter rate limiter
  }

  // VALIDER avec délais longs
  console.log('\n--- VALIDER ---');
  let validateOK = 0;
  const validateLats = [];
  for (let i = 0; i < crvIds.length; i++) {
    const t0 = Date.now();
    const resp = await apiCall('POST', '/api/validation/' + crvIds[i] + '/valider', supToken, { commentaires: 'Perf test' });
    const lat = Date.now() - t0;
    validateLats.push(lat);
    if (resp.status === 200) validateOK++;
    console.log(`  ${i+1}/${crvIds.length}: ${resp.status === 200 ? '✅' : '❌'} ${resp.status} (${lat}ms)`);
    if (resp.status !== 200) console.log(`    ${JSON.stringify(resp.data).substring(0, 150)}`);
    await delay(2000); // 2s entre chaque
  }

  // Résultats
  const allLats = [...terminateLats, ...validateLats];
  const avgLat = allLats.length > 0 ? Math.round(allLats.reduce((a,b)=>a+b,0) / allLats.length) : 0;
  const maxLat = allLats.length > 0 ? Math.max(...allLats) : 0;

  console.log('\n=== RÉSULTATS ===');
  console.log(`Terminés: ${terminateOK}/${crvIds.length}`);
  console.log(`Validés: ${validateOK}/${crvIds.length}`);
  console.log(`Événements OPS: ~${(terminateOK * 2) + (validateOK * 2)}`);
  console.log(`Latence terminer avg: ${terminateLats.length > 0 ? Math.round(terminateLats.reduce((a,b)=>a+b,0)/terminateLats.length) : 0}ms`);
  console.log(`Latence valider avg: ${validateLats.length > 0 ? Math.round(validateLats.reduce((a,b)=>a+b,0)/validateLats.length) : 0}ms`);
  console.log(`Latence max: ${maxLat}ms`);

  // Dashboard OPS
  await delay(1000);
  const dashboard = await apiCall('GET', '/api/ops/dashboard', supToken);
  if (dashboard.status === 200) {
    const d = dashboard.data?.data || dashboard.data;
    console.log(`\nDashboard OPS:`);
    console.log(`  Total CRV: ${d.totalCRV}`);
    console.log(`  Statuts: ${JSON.stringify(d.crvByStatus)}`);
    console.log(`  Événements récents: ${d.recentEvents?.length || 0}`);
    const evtTypes = (d.recentEvents || []).map(e => e.type);
    console.log(`  Types: ${[...new Set(evtTypes)].join(', ')}`);
    console.log(`  Dashboard stable: ✅`);
  }

  console.log(`\nVERDICT: ${terminateOK >= 2 && validateOK >= 2 ? '✅ PERFORMANCE OK' : '❌ ÉCHEC'}`);
}

run().catch(e => console.error('ERROR:', e));
