import http from 'http'

function apiCall(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : ''
    const opts = {
      hostname: 'localhost', port: 4000,
      path, method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    }
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(data)
    const req = http.request(opts, (res) => {
      let b = ''
      res.on('data', c => b += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }) }
        catch(e) { resolve({ status: res.statusCode, data: b.substring(0, 500) }) }
      })
    })
    req.on('error', e => resolve({ status: 0, error: e.message }))
    if (body) req.write(data)
    req.end()
  })
}

async function main() {
  // Login as agent
  const login = await apiCall('POST', '/api/auth/login', { email: 'agent@crv.test', password: 'Test1234!' })
  const token = login.data.token

  // Get CRV list by status
  for (const statut of ['TERMINE', 'EN_COURS', 'BROUILLON']) {
    const r = await apiCall('GET', '/api/crv?statut=' + statut + '&limit=3', null, token)
    const crvs = r.data.data?.crvs || r.data.data || []
    console.log(`\n=== ${statut} (${crvs.length} found) ===`)
    for (const c of crvs.slice(0, 3)) {
      console.log(`  ${c._id} | ${c.vol?.numeroVol || 'N/A'} | completude=${c.completude}%`)
    }
  }

  // Try to terminate our CRV one more time with a small delay
  console.log('\n=== Retry terminer CRV ===')
  await new Promise(r => setTimeout(r, 1000))
  const term = await apiCall('POST', '/api/crv/69abb1aabb12ac9c5238c18f/terminer', {}, token)
  console.log('Status:', term.status)
  console.log('Message:', term.data.message || JSON.stringify(term.data).substring(0, 300))
}
main()
