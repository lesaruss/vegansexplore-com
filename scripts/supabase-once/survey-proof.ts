// ve-once-survey-proof: a signed-in Guide survey run and a live Explorer approval, with [TEST] accounts (ve-events-guide, 2026-11-06).
import { createClient } from 'npm:@supabase/supabase-js@2'
const KEY = '<random 48 hex characters>'
const URL_ = Deno.env.get('SUPABASE_URL')!
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(URL_, SK)
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const VE = '00000000-0000-4000-a000-000000000002'
const SEAN = '72712a4a-ea0e-4ef4-a29e-d382496ef8da'
const EV = 'proof-events-1106@example.com', EX = 'proof-explorer-1106@example.com'
const b64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
async function tok(sub: string, email: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const p = b64(JSON.stringify({ sub, email, tier: 'free', brand: 'vegans-explore', iat: now, exp: now + 900 }))
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64(String.fromCharCode(...new Uint8Array(s)))
}
async function call(fn: string, action: string, body: Record<string, unknown>) {
  const r = await fetch(URL_ + '/functions/v1/' + fn + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify(body) })
  return { status: r.status, body: await r.json().catch(() => null) }
}
const row = async (email: string) => (await db.from('members').select('id, name, email, membership_status, entry_via, founding_member, lesars_balance, survey_review, survey_submitted_at, member_class').eq('email', email).maybeSingle()).data
async function make(email: string, name: string) {
  const ex = await row(email); if (ex) return ex
  const { error } = await db.from('members').insert({ email, name, tenant_id: VE, membership_status: 'pending_payment', member_class: 'member', email_verified: true })
  if (error) throw new Error('insert ' + error.message)
  return await row(email)
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  const out: Record<string, unknown> = { step }
  try {
    if (step === 'events') {
      const m = await make(EV, '[TEST] Proof Events Host'); const t = await tok(m!.id, EV)
      out.before = await call('ve-guide-unlock', 'status', { slug: 'vegan-events-guide', token: t })
      out.get = (await call('ve-mission-survey', 'survey_get', { token: t, survey: 'vegan-events-guide' })).status
      const A: [string, unknown][] = [['e_role','host'],['e_chapter','south-florida'],['e_kind',['potluck','social']],['e_count','1-3'],['e_crowd','25-75'],['e_group','[TEST] Proof Potluck Club'],['e_audience','Neighbors who want to try Vegan food together.'],['e_vegan','all'],['e_hard',['turnout','venue']],['e_help','A checklist and help finding a venue.'],['e_next','maybe']]
      const res: unknown[] = []
      for (const [id, value] of A) { const r = await call('ve-mission-survey', 'survey_answer', { token: t, survey: 'vegan-events-guide', id, value }); res.push([id, r.status, r.body]) }
      out.bad = await call('ve-mission-survey', 'survey_answer', { token: t, survey: 'vegan-events-guide', id: 'e_count', value: 'lots' })
      out.answers = res
      out.after = await call('ve-guide-unlock', 'status', { slug: 'vegan-events-guide', token: t })
      const op = await call('ve-guide-unlock', 'open', { slug: 'vegan-events-guide', token: t }); out.open = { status: op.status, unlocked: op.body?.unlocked, via: op.body?.via, html_len: (op.body?.html || '').length }
      out.member = await row(EV)
    } else if (step === 'explorer') {
      const m = await make(EX, '[TEST] Proof Explorer'); const t = await tok(m!.id, EX)
      const A: [string, unknown][] = [['x_brings',['eat','events']],['x_journey','prevegan'],['x_chapter','south-florida'],['x_more',['food']],['x_hear',['site']],['x_worth','Proof run, please ignore.']]
      const res: unknown[] = []
      for (const [id, value] of A) { const r = await call('ve-mission-survey', 'survey_answer', { token: t, survey: 'explorer', id, value }); res.push([id, r.status, r.body]) }
      out.answers = res
      // The last required answer goes straight to the database function, so the edge function's team email ("waiting for review") is not sent.
      const { data, error } = await db.rpc('ve_survey_answer', { p_member: m!.id, p_survey: 'explorer', p_question: 'x_run', p_value: ['none'] })
      out.last = error ? { error: error.message } : data
      out.member = await row(EX)
      const st = await tok(SEAN, 'contact@lesaruss.com')
      const rl = await call('ve-mission-survey', 'review_list', { token: st })
      out.in_queue = (rl.body?.members || []).some((x: any) => x.id === m!.id)
      out.stranger_list = (await call('ve-mission-survey', 'review_list', { token: t })).status
    } else if (step === 'approve') {
      const m = await row(EX); const st = await tok(SEAN, 'contact@lesaruss.com')
      out.stranger = await call('ve-mission-survey', 'review_decide', { token: await tok(m!.id, EX), member_id: m!.id, decision: 'approve' })
      out.decide = await call('ve-mission-survey', 'review_decide', { token: st, member_id: m!.id, decision: 'approve' })
      out.again = await call('ve-mission-survey', 'review_decide', { token: st, member_id: m!.id, decision: 'approve' })
      out.member = await row(EX)
      out.ledger = (await db.from('points_ledger').select('amount, reason, ref').eq('member_id', m!.id)).data
    } else if (step === 'cleanup') {
      const ids = ((await db.from('members').select('id').in('email', [EV, EX])).data || []).map((x: any) => x.id)
      out.ids = ids
      for (const t of ['member_points', 've_abuse_signals', 've_member_devices', 've_survey_answers', 've_survey_completions', 'points_ledger', 'brand_memberships', 've_member_shared_answers', 've_door_emails']) {
        const { error, count } = await db.from(t).delete({ count: 'exact' }).in('member_id', ids)
        out[t] = error ? error.message : count
      }
      const { error, count } = await db.from('members').delete({ count: 'exact' }).in('id', ids)
      out.members = error ? error.message : count
    } else return Response.json({ error: 'unknown_step' }, { status: 400 })
    return Response.json(out)
  } catch (e) { out.error = String(e); return Response.json(out, { status: 500 }) }
})
