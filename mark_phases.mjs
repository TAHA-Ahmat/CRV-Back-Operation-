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
        catch(e) { resolve({ status: res.statusCode, data: b.substring(0,200) }) }
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
  const token = login.data.token || login.data.data?.token
  console.log('Login:', login.status, token ? 'OK' : 'FAIL')

  // Get phases
  const phases = await apiCall('GET', '/api/phases?crvId=69abb1aabb12ac9c5238c18f', null, token)
  const phaseList = phases.data.data?.phases || phases.data.data || []
  console.log('Phases found:', phaseList.length)

  // Mark all NON_COMMENCE as NON_REALISE
  for (const p of phaseList) {
    if (p.statut === 'NON_COMMENCE') {
      const r = await apiCall('POST', '/api/phases/' + p._id + '/non-realise', {
        motifNonRealisation: 'NON_NECESSAIRE',
        detailMotif: 'Test Mission 027'
      }, token)
      console.log('  Phase', p._id.slice(-4), ':', r.status, r.data.success ? 'OK' : r.data.message)
    } else {
      console.log('  Phase', p._id.slice(-4), ': already', p.statut)
    }
  }

  // Verify
  const check = await apiCall('GET', '/api/phases?crvId=69abb1aabb12ac9c5238c18f', null, token)
  const final = (check.data.data?.phases || check.data.data || [])
  const done = final.filter(p => p.statut !== 'NON_COMMENCE').length
  console.log('\nResult:', done + '/' + final.length, 'phases traitees')
}
main()
