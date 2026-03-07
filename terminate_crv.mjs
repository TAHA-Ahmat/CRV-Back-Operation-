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
        catch(e) { resolve({ status: res.statusCode, data: b.substring(0,500) }) }
      })
    })
    req.on('error', e => resolve({ status: 0, error: e.message }))
    if (body) req.write(data)
    req.end()
  })
}

async function main() {
  const crvId = '69abb1aabb12ac9c5238c18f'

  // Login as agent
  const login = await apiCall('POST', '/api/auth/login', { email: 'agent@crv.test', password: 'Test1234!' })
  const token = login.data.token
  console.log('Login agent:', token ? 'OK' : 'FAIL')

  // Check current status
  const check = await apiCall('GET', '/api/crv/' + crvId, null, token)
  const crv = check.data.data?.crv || check.data.data
  console.log('Current statut:', crv.statut)
  console.log('Completude:', crv.completude)

  // Terminate CRV
  console.log('\n--- Terminer le CRV ---')
  const term = await apiCall('POST', '/api/crv/' + crvId + '/terminer', {}, token)
  console.log('Terminer:', term.status, term.data.success ? 'OK' : term.data.message)
  if (term.data.data?.crv) {
    console.log('Nouveau statut:', term.data.data.crv.statut)
  }

  // Verify final status
  const final = await apiCall('GET', '/api/crv/' + crvId, null, token)
  const finalCrv = final.data.data?.crv || final.data.data
  console.log('\nStatut final:', finalCrv.statut)
}
main()
