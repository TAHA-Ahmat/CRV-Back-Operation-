/**
 * DIAGNOSTIC — Personnel CRV
 * Crée un CRV, ajoute du personnel, compare API vs MongoDB
 */

const BASE = 'http://localhost:4000/api';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  // Login
  const login = await api('POST', '/auth/login', { email: 'superviseur@crv.test', password: 'Test1234!' });
  console.log('LOGIN status:', login.status);
  console.log('LOGIN response:', JSON.stringify(login.json).substring(0, 300));
  if (login.status !== 200) {
    console.log('LOGIN FAIL');
    return;
  }
  const token = login.json.data?.token || login.json.token;
  const userId = login.json.data?.user?._id || login.json.data?._id;
  if (!token) {
    console.log('No token found in response!');
    return;
  }
  console.log('LOGIN OK - userId:', userId);

  // Creer CRV
  const crv = await api('POST', '/crv', { type: 'arrivee', escale: 'NDJ' }, token);
  const crvId = crv.json.data._id;
  console.log('CRV cree:', crvId, '- statut:', crv.json.data.statut);

  // Demarrer (requis pour ajouter du personnel)
  const dem = await api('POST', '/crv/' + crvId + '/demarrer', null, token);
  console.log('Demarrer:', dem.status, '- statut:', dem.json.data?.statut);

  // === AJOUTER 2 PERSONNELS ===
  console.log('\n==============================');
  console.log('  AJOUT PERSONNEL');
  console.log('==============================');

  const p1 = await api('POST', '/crv/' + crvId + '/personnel', {
    nom: 'DIAG_TEST', prenom: 'Ahmed', fonction: 'CHEF_ESCALE', matricule: 'DIAG-001'
  }, token);
  console.log('\nPersonnel 1 - Status:', p1.status);
  console.log('Personnel 1 - Response:', JSON.stringify(p1.json).substring(0, 1000));

  const p2 = await api('POST', '/crv/' + crvId + '/personnel', {
    nom: 'DIAG_TEST2', prenom: 'Fatou', fonction: 'AGENT_PISTE', matricule: 'DIAG-002'
  }, token);
  console.log('\nPersonnel 2 - Status:', p2.status);
  console.log('Personnel 2 - Response:', JSON.stringify(p2.json).substring(0, 1000));

  // === GET CRV ===
  console.log('\n==============================');
  console.log('  GET /api/crv/:id');
  console.log('==============================');

  const getCrv = await api('GET', '/crv/' + crvId, null, token);
  const data = getCrv.json.data;

  if (data) {
    console.log('\ndata keys:', Object.keys(data));

    const c = data.crv;
    if (c) {
      console.log('\ndata.crv ALL KEYS:', Object.keys(c));
      console.log('\ndata.crv.personnel:', JSON.stringify(c.personnel)?.substring(0, 800));
      console.log('typeof:', typeof c.personnel);
      console.log('isArray:', Array.isArray(c.personnel));
      if (Array.isArray(c.personnel)) {
        console.log('length:', c.personnel.length);
        if (c.personnel.length > 0) {
          console.log('First item:', JSON.stringify(c.personnel[0]));
          console.log('First item keys:', Object.keys(c.personnel[0]));
        }
      }
    }

    // Check all top-level data fields for personnel
    console.log('\n--- Checking other locations ---');
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val)) {
        console.log(`data.${key}: Array[${val.length}]`);
      } else if (typeof val === 'object' && val !== null) {
        console.log(`data.${key}: Object with keys [${Object.keys(val).join(', ')}]`);
      } else {
        console.log(`data.${key}: ${typeof val}`);
      }
    }
  }

  // === ALSO CHECK: GET CRV list (for comparison) ===
  console.log('\n==============================');
  console.log('  GET /api/crv (list)');
  console.log('==============================');

  const listCrv = await api('GET', '/crv?escale=NDJ&limit=1&sort=-createdAt', null, token);
  if (listCrv.json.data?.crvs?.[0]) {
    const firstCrv = listCrv.json.data.crvs[0];
    console.log('First CRV from list - keys:', Object.keys(firstCrv));
    console.log('personnel in list:', JSON.stringify(firstCrv.personnel)?.substring(0, 300));
  }

  console.log('\n==============================');
  console.log('  CRV_ID FOR MONGO CHECK:');
  console.log('  ' + crvId);
  console.log('==============================');
}

main().catch(e => console.error('FATAL:', e));
