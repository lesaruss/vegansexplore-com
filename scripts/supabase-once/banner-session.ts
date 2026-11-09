// ve-once-banner-session (playbook ve-guide-banner-audio, 2026-11-09): mints a one-hour Vegans Explore member session for the super admin
// vegan@lesaruss.com (same signing as ve-auth signJWT) so a headless browser can check a Depot page signed in. Deployed with a run key
// kept only in the session scratchpad, used, then redeployed as the 410 stub. Output goes to the scratchpad with curl -o, never printed.
const KEY = '<random 48 hex characters, scratchpad only>'
const b64u = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const url = Deno.env.get('SUPABASE_URL')!, sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const r = await fetch(`${url}/rest/v1/members?email=eq.vegan@lesaruss.com&is_superadmin=eq.true&select=*`, { headers: { apikey: sk, Authorization: `Bearer ${sk}` } })
  const m = (await r.json())[0]
  if (!m) return Response.json({ error: 'no member' }, { status: 404 })
  const now = Math.floor(Date.now() / 1000)
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const p = b64u(JSON.stringify({ sub: m.id, email: m.email, tier: m.membership_tier, brand: 'vegans-explore', iat: now, exp: now + 3600 }))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(sk.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = b64u(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`)))))
  const { password_hash: _a, tenant_id: _b, ...member } = m
  return Response.json({ token: `${h}.${p}.${sig}`, member: { ...member, communities: [], hidden_modules: [] } })
})
