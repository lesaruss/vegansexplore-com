// ve-once-confirm-proof: the Holiday Guide confirm page, end to end, as a [TEST] account with no membership (2026-11-13).
// run: a [TEST] member (not active), a one-hour token minted here (never returned), then ve-holiday gift_request (keep) and
// ve-claims start pay 'featured' on a featured listing, plus pay 'featured' on a listing the guide does not feature (expect 403).
// cleanup: the request, the claim and the member are removed and the listing's claim fields are put back as they were.
import { createClient } from 'npm:@supabase/supabase-js@2'
const KEY = '<random 48 hex characters>'
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, URL0 = Deno.env.get('SUPABASE_URL')!
const db = createClient(URL0, SK)
const VE = '00000000-0000-4000-a000-000000000002'
const EMAIL = 'proof-confirm-1113@example.com', SLUG = 'no-49-handbags'
const b64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
async function tok(sub: string, email: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), now = Math.floor(Date.now() / 1000)
  const p = b64(JSON.stringify({ sub, email, tier: 'free', brand: 'vegans-explore', iat: now, exp: now + 3600 }))
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64(String.fromCharCode(...new Uint8Array(s)))
}
const call = async (fn: string, t: string, body: unknown) => { const r = await fetch(`${URL0}/functions/v1/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) } }
const LF = 'id, claim_status, claim_submitted_at, claimed_by_member_id, owner_member_id, ve_contact_name, ve_contact_email, ve_contact_phone'
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  const out: Record<string, unknown> = { step }
  try {
    const { data: L } = await db.from('listings').select(LF).eq('slug', SLUG).maybeSingle()
    if (step === 'run') {
      if (L!.claim_status !== 'unclaimed' || L!.owner_member_id) throw new Error('listing not unclaimed; stop')
      await db.from('ve_test_checkout_allowlist').upsert({ email: EMAIL })
      let { data: m } = await db.from('members').select('id, membership_status').eq('email', EMAIL).maybeSingle()
      if (!m) { const r = await db.from('members').insert({ email: EMAIL, name: '[TEST] Confirm Proof', tenant_id: VE, membership_status: 'pending_payment', member_class: 'member', email_verified: true }).select('id, membership_status').single(); if (r.error) throw new Error(r.error.message); m = r.data }
      out.member = m
      const t = await tok(m!.id, EMAIL)
      out.request = await call('ve-holiday', t, { action: 'gift_request', kind: 'gift', listing_id: L!.id, change: 'keep', note: '[TEST] proof' })
      out.claim = await call('ve-claims', t, { action: 'start', listing_id: L!.id, pay: 'featured', contact_name: '[TEST] Confirm Proof', contact_role: 'Owner', contact_email: EMAIL, proposed: {} })
      const { data: other } = await db.from('listings').select('id, slug').eq('status', 'approved').eq('slug', 'love-life-cafe').maybeSingle()
      out.not_featured = other ? await call('ve-claims', t, { action: 'start', listing_id: other.id, pay: 'featured', contact_name: '[TEST] Confirm Proof', contact_email: EMAIL, proposed: {} }) : 'no control listing'
      out.claim_rows = (await db.from('ve_listing_claims').select('id, listing_id, status, proposed, contribution_cents').eq('member_id', m!.id)).data
      out.listing_after = (await db.from('listings').select(LF).eq('id', L!.id).maybeSingle()).data
    } else if (step === 'cleanup') {
      const { data: m } = await db.from('members').select('id').eq('email', EMAIL).maybeSingle()
      if (m) {
        out.requests = (await db.from('ve_holiday_gift_requests').delete({ count: 'exact' }).eq('member_id', m.id)).count
        out.claims = (await db.from('ve_listing_claims').delete({ count: 'exact' }).eq('member_id', m.id)).count
        for (const t of ['member_points', 'points_ledger', 'brand_memberships', 've_member_devices', 've_abuse_signals']) await db.from(t).delete().eq('member_id', m.id)
        out.member = (await db.from('members').delete({ count: 'exact' }).eq('id', m.id)).count
      }
      // Before the run it was unclaimed with no contact (checked 2026-11-13); put it back, and never touch an owner.
      out.restore = (await db.from('listings').update({ claim_status: 'unclaimed', claim_submitted_at: null }).eq('id', L!.id).is('owner_member_id', null)).error?.message || 'ok'
      await db.from('ve_test_checkout_allowlist').delete().eq('email', EMAIL)
      out.listing_now = (await db.from('listings').select(LF).eq('slug', SLUG).maybeSingle()).data
    } else return Response.json({ error: 'unknown_step' }, { status: 400 })
    return Response.json(out)
  } catch (e) { out.error = String(e); return Response.json(out, { status: 500 }) }
})
