// ve-once-guide-run: one-hour sessions for a signed-in browser run of the Guide doors (ve-events-guide, 2026-11-07).
import { createClient } from 'npm:@supabase/supabase-js@2'
const KEY = '<random 48 hex characters>'
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SK)
const VE = '00000000-0000-4000-a000-000000000002'
const A = 'proof-member-1107@example.com', B = 'proof-explorer-1107@example.com'
const F = 'id, name, email, initials, color, membership_tier, ve_role, ve_tier, referral_code, is_superadmin, home_community, membership_status, avatar_url, member_class, entry_via, founding_member, lesars_balance, survey_review'
const b64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
async function tok(sub: string, email: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), now = Math.floor(Date.now() / 1000)
  const p = b64(JSON.stringify({ sub, email, tier: 'free', brand: 'vegans-explore', iat: now, exp: now + 3600 }))
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64(String.fromCharCode(...new Uint8Array(s)))
}
const row = async (e: string) => (await db.from('members').select(F).eq('email', e).maybeSingle()).data
async function make(email: string, name: string, status: string) {
  const ex = await row(email); if (ex) return ex
  const { error } = await db.from('members').insert({ email, name, tenant_id: VE, membership_status: status, member_class: 'member', email_verified: true })
  if (error) throw new Error('insert ' + error.message)
  return await row(email)
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  const out: Record<string, unknown> = { step }
  try {
    if (step === 'make') {
      const a = await make(A, '[TEST] Proof Member', 'active'), b = await make(B, '[TEST] Proof Explorer', 'pending_payment')
      out.a = { member: a, token: await tok(a!.id, A) }; out.b = { member: b, token: await tok(b!.id, B) }
    } else if (step === 'state') {
      const ids = ((await db.from('members').select('id').in('email', [A, B])).data || []).map((x: any) => x.id)
      out.members = (await db.from('members').select(F).in('email', [A, B])).data
      out.completions = (await db.from('ve_survey_completions').select('member_id, survey_slug, created_at').in('member_id', ids)).data
      out.ledger = (await db.from('points_ledger').select('member_id, amount, reason, ref').in('member_id', ids)).data
      const since = new URL(req.url).searchParams.get('since') || new Date(Date.now() - 3 * 3600e3).toISOString()
      out.team_emails = (await db.from('email_sends').select('campaign_ref, subject, created_at, status').like('campaign_ref', 've-survey-review%').gte('created_at', since)).data
    } else if (step === 'cleanup') {
      const ids = ((await db.from('members').select('id').in('email', [A, B])).data || []).map((x: any) => x.id)
      out.ids = ids
      for (const t of ['member_points', 've_abuse_signals', 've_member_devices', 've_survey_answers', 've_survey_completions', 'points_ledger', 'brand_memberships', 've_member_shared_answers', 've_door_emails', 've_member_badges', 've_guide_saves', 've_guide_votes']) {
        const { error, count } = await db.from(t).delete({ count: 'exact' }).in('member_id', ids)
        out[t] = error ? error.message : count
      }
      const { error, count } = await db.from('members').delete({ count: 'exact' }).in('id', ids)
      out.members = error ? error.message : count
    } else return Response.json({ error: 'unknown_step' }, { status: 400 })
    return Response.json(out)
  } catch (e) { out.error = String(e); return Response.json(out, { status: 500 }) }
})
