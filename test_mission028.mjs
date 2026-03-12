import http from 'http';

function apiCall(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 4000, path,
      method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    };
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
  console.log('=== MISSION 028 — TEST WORKFLOW COMPLET ===\n');

  // 1. Login as agent
  const login = await apiCall('POST', '/api/auth/login', '', { email: 'agent@crv.test', password: 'Test1234!' });
  const agentToken = login.data.token;
  console.log('1. LOGIN AGENT:', login.status === 200 ? '✅ OK' : '❌ FAIL');
  await delay(300);

  // Récupérer l'ID utilisateur
  const profileResp = await apiCall('GET', '/api/auth/me', agentToken);
  const agentUserId = profileResp.data?.data?._id || profileResp.data?.data?.id;
  console.log('1b. PROFIL AGENT:', profileResp.status === 200 ? '✅' : '❌', 'userId:', agentUserId);
  await delay(300);

  // 2. Créer un CRV
  const createResp = await apiCall('POST', '/api/crv', agentToken, {
    type: 'depart',
    vol: {
      numeroVol: 'TEST028',
      compagnieAerienne: 'AF',
      aeroportOrigine: 'CDG',
      aeroportDestination: 'ORY',
      dateVol: new Date().toISOString(),
      codeIATA: 'CDG',
      typeOperation: 'DEPART',
      typeVolHorsProgramme: 'CHARTER',
      raisonHorsProgramme: 'Test Mission 028'
    },
    forceDoublon: true,
    confirmationLevel: 2
  });
  const crvId = createResp.data?.data?._id || createResp.data?.data?.id;
  console.log('2. CREATE CRV:', createResp.status === 201 ? '✅' : '⚠️', createResp.status, crvId ? crvId : 'NO_ID');
  if (!crvId) { console.log('   ERREUR:', JSON.stringify(createResp.data).substring(0, 300)); return; }
  await delay(300);

  // 3. Démarrer le CRV
  const startResp = await apiCall('POST', '/api/crv/' + crvId + '/demarrer', agentToken);
  console.log('3. DEMARRER:', startResp.status === 200 ? '✅ OK' : '❌ FAIL ' + startResp.status);
  await delay(300);

  // 4. Récupérer le CRV
  const crvDetail = await apiCall('GET', '/api/crv/' + crvId, agentToken);
  const existingPhases = crvDetail.data?.data?.phases || [];
  console.log('4a. PHASES:', existingPhases.length, 'trouvées');
  await delay(300);

  // Marquer toutes les phases comme NON_REALISE
  for (const phase of existingPhases) {
    const phaseId = phase._id || phase.id;
    if (phase.statut !== 'TERMINE' && phase.statut !== 'NON_REALISE' && phase.statut !== 'NON_REALISEE') {
      const markResp = await apiCall('POST', '/api/phases/' + phaseId + '/non-realise', agentToken, {
        motifNonRealisation: 'NON_NECESSAIRE', detailMotif: 'Phase marquée pour test workflow Mission 028'
      });
      const phaseName = (phase.phase?.libelle || phase.nomPhase || phaseId).toString().substring(0, 30);
      console.log('4b. PHASE', phaseName + ':', markResp.status === 200 ? '✅' : '⚠️ ' + markResp.status);
      await delay(200);
    }
  }
  await delay(500);

  // Ajouter responsable vol
  if (agentUserId) {
    const rvResp = await apiCall('PUT', '/api/crv/' + crvId, agentToken, { responsableVol: agentUserId });
    console.log('4c. RESPONSABLE VOL:', rvResp.status === 200 ? '✅' : '⚠️ ' + rvResp.status);
    await delay(300);
  }

  // Ajouter 3 types de charges
  const chargeTypes = [
    { typeCharge: 'PASSAGERS', sensOperation: 'EMBARQUEMENT', passagersAdultes: 120, passagersEnfants: 5 },
    { typeCharge: 'BAGAGES', sensOperation: 'EMBARQUEMENT', nombreBagagesSoute: 95, poidsBagagesSouteKg: 1200, nombreBagagesCabine: 60 },
    { typeCharge: 'FRET', sensOperation: 'EMBARQUEMENT', nombreFret: 3, poidsFretKg: 450, typeFret: 'GENERAL' }
  ];
  for (const charge of chargeTypes) {
    const chargeResp = await apiCall('POST', '/api/crv/' + crvId + '/charges', agentToken, charge);
    console.log('4d. CHARGE', charge.typeCharge + ':', chargeResp.status === 201 ? '✅' : '⚠️ ' + chargeResp.status);
    await delay(300);
  }

  // Re-check completude
  const checkResp = await apiCall('GET', '/api/crv/' + crvId, agentToken);
  const updatedCrv = checkResp.data?.data?.crv || checkResp.data?.data;
  console.log('4e. COMPLETUDE:', (updatedCrv?.completude || 0) + '%', 'responsableVol:', updatedCrv?.responsableVol ? '✅' : '❌');
  await delay(500);

  // 5. TERMINER le CRV — Bug #2
  console.log('\n--- TEST BUG #2 : TERMINER CRV ---');
  const terminateResp = await apiCall('POST', '/api/crv/' + crvId + '/terminer', agentToken);
  console.log('5. TERMINER:', terminateResp.status === 200 ? '✅ OK — Bug #2 RÉSOLU' : '❌ FAIL ' + terminateResp.status);
  if (terminateResp.status !== 200) {
    console.log('   ERREUR:', JSON.stringify(terminateResp.data).substring(0, 300));
    return;
  }
  await delay(500);

  // 6. Login superviseur
  const supLogin = await apiCall('POST', '/api/auth/login', '', { email: 'superviseur@crv.test', password: 'Test1234!' });
  const supToken = supLogin.data.token;
  console.log('6. LOGIN SUPERVISEUR:', supLogin.status === 200 ? '✅ OK' : '❌ FAIL');
  await delay(500);

  // 7. VALIDER le CRV — Bug #2 + #5
  console.log('\n--- TEST BUG #2 + #5 : VALIDER CRV ---');
  const validateResp = await apiCall('POST', '/api/validation/' + crvId + '/valider', supToken, { commentaires: 'Test Mission 028' });
  console.log('7. VALIDER:', validateResp.status === 200 ? '✅ OK' : '❌ FAIL ' + validateResp.status);
  if (validateResp.status !== 200) {
    console.log('   ERREUR:', JSON.stringify(validateResp.data).substring(0, 300));
    return;
  }
  // Afficher le détail de la validation
  const valData = validateResp.data?.data;
  console.log('   Statut validation:', valData?.statut || valData?.statutValidation);
  console.log('   CRV statut après validation:', valData?.nouveauStatut || 'non retourné');
  console.log('   Anomalies:', JSON.stringify(valData?.anomaliesDetectees || valData?.anomalies || []));
  await delay(500);

  // Vérifier statut CRV après validation
  const afterValResp = await apiCall('GET', '/api/crv/' + crvId, supToken);
  const afterValCrv = afterValResp.data?.data?.crv || afterValResp.data?.data;
  console.log('7b. STATUT APRÈS VALIDER:', afterValCrv?.statut);
  await delay(300);

  // 8. VERROUILLER le CRV — Bug #7
  console.log('\n--- TEST BUG #7 : VERROUILLER CRV ---');
  const lockResp = await apiCall('POST', '/api/validation/' + crvId + '/verrouiller', supToken);
  console.log('8. VERROUILLER:', lockResp.status === 200 ? '✅ OK' : '❌ FAIL ' + lockResp.status);
  if (lockResp.status !== 200) {
    console.log('   ERREUR:', JSON.stringify(lockResp.data).substring(0, 300));
  }
  await delay(300);

  // 9. Statut final
  const finalResp = await apiCall('GET', '/api/crv/' + crvId, agentToken);
  const finalCrv = finalResp.data?.data?.crv || finalResp.data?.data;
  const finalStatus = finalCrv?.statut;
  console.log('9. STATUT FINAL:', finalStatus === 'VERROUILLE' ? '✅ VERROUILLE' : '❌ ' + finalStatus);
  await delay(300);

  // 10. OPS Dashboard
  console.log('\n--- TEST BUG #2 : OPS DASHBOARD ---');
  const opsResp = await apiCall('GET', '/api/ops/dashboard', supToken);
  console.log('10. OPS DASHBOARD:', opsResp.status === 200 ? '✅ OK' : '❌ FAIL ' + opsResp.status);
  if (opsResp.status === 200) {
    const opsData = opsResp.data?.data || opsResp.data;
    console.log('    CRV par statut:', JSON.stringify(opsData.crvByStatus || {}));
    console.log('    Total CRV:', opsData.totalCRV);
  }

  console.log('\n=== RÉSULTAT MISSION 028 ===');
  console.log('Bug #2 (Write Conflict):', terminateResp.status === 200 && validateResp.status === 200 ? '✅ RÉSOLU' : '❌ PERSISTE');
  console.log('Bug #5 (Valider API):', validateResp.status === 200 ? '✅ FONCTIONNE' : '❌ ÉCHEC');
  console.log('Bug #7 (Verrouiller API):', lockResp.status === 200 ? '✅ FONCTIONNE' : '❌ ÉCHEC');
  console.log('Workflow complet:', finalStatus === 'VERROUILLE' ? '✅ BROUILLON → EN_COURS → TERMINE → VALIDE → VERROUILLE' : '❌ INCOMPLET');
}

run().catch(e => console.error('ERROR:', e));
