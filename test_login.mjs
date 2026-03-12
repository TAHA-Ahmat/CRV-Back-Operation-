/**
 * MISSION 027 — Phase 1 : Login test pour les 6 profils
 * Script temporaire (à supprimer après test)
 */
import http from 'http'
import fs from 'fs'

const accounts = [
  { email: 'agent@crv.test', label: 'AGENT_ESCALE' },
  { email: 'chef@crv.test', label: 'CHEF_EQUIPE' },
  { email: 'superviseur@crv.test', label: 'SUPERVISEUR' },
  { email: 'manager@crv.test', label: 'MANAGER' },
  { email: 'jb@crv.test', label: 'QUALITE' },
  { email: 'admin@crv.test', label: 'ADMIN' }
]

function login(account) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: account.email, password: 'Test1234!' })
    const req = http.request({
      hostname: 'localhost', port: 4000,
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => {
        try {
          const r = JSON.parse(body)
          if (r.success) {
            resolve({ ...account, ok: true, role: r.data.user.fonction, token: r.data.token })
          } else {
            resolve({ ...account, ok: false, msg: r.message })
          }
        } catch (e) {
          resolve({ ...account, ok: false, msg: 'JSON parse error: ' + body.substring(0, 100) })
        }
      })
    })
    req.on('error', e => resolve({ ...account, ok: false, msg: e.message }))
    req.write(data)
    req.end()
  })
}

async function main() {
  const results = await Promise.all(accounts.map(login))
  const tokens = {}

  console.log('=== PHASE 1 — LOGIN TEST ===\n')
  for (const r of results) {
    if (r.ok) {
      const label = r.label.padEnd(15)
      const email = r.email.padEnd(25)
      console.log(`  OK  ${label} | ${email} | role=${r.role}`)
      tokens[r.label] = r.token
    } else {
      const label = r.label.padEnd(15)
      const email = r.email.padEnd(25)
      console.log(`  FAIL ${label} | ${email} | ERREUR: ${r.msg}`)
    }
  }

  const ok = results.filter(r => r.ok).length
  console.log(`\nResultat: ${ok}/${results.length} connexions reussies`)

  // Save tokens for subsequent phases
  fs.writeFileSync('/tmp/crv_tokens.json', JSON.stringify(tokens, null, 2))
  console.log('Tokens sauvegardes dans /tmp/crv_tokens.json')
}

main()
