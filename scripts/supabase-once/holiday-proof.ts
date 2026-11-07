// ve-once-holiday-proof (2026-11-07, ve-holiday-guide step 1): proves ve-holiday's signed-in paths against the live function
// with a [TEST] listing, then removes every row it made. Run once with ?step=run and x-run-key, then redeploy as the 410 stub.
// The run key lives only in the session scratchpad; this file in the repo has it as a placeholder.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const RUN_KEY = '__RUN_KEY__';
const URL_ = Deno.env.get('SUPABASE_URL')!, SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL_, SK);
const OWNER = '81145c43-1bb5-41ca-84f1-a15448792f04';   // internal, active, not a super admin
const PENDING = '95fd3358-5463-496e-85db-4c5741989e50'; // internal, pending_payment
const ADMIN = '72712a4a-ea0e-4ef4-a29e-d382496ef8da';   // super admin
const b64 = (s: string | Uint8Array) => { const bin = typeof s === 'string' ? s : String.fromCharCode(...s); return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
async function token(sub: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify({ sub, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 600 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${b64(sig)}`;
}
async function call(tok: string | null, body: any) {
  const r = await fetch(`${URL_}/functions/v1/ve-holiday`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body) });
  return { s: r.status, j: await r.json().catch(() => null) };
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== RUN_KEY) return new Response('no', { status: 403 });
  const out: any[] = [];
  const log = (name: string, r: any, expect: (r: any) => boolean) => out.push({ name, pass: expect(r), status: r.s, body: JSON.stringify(r.j).slice(0, 220) });
  const { data: L, error: le } = await db.from('listings').insert({ name: '[TEST] Holiday Kitchen', slug: 'test-holiday-kitchen-proof', category: 'Restaurants', specialty: '', description: '[TEST] holiday menu proof', location: 'Miami, FL', address_city: 'Miami', address_state: 'FL', status: 'approved', vegan_status: 'vegan_options' }).select('id').single();
  if (le) return new Response(JSON.stringify({ error: 'listing', le }), { status: 500 });
  const lid = L.id;
  try {
    const [to, tp, ta] = await Promise.all([token(OWNER), token(PENDING), token(ADMIN)]);
    const good = { action: 'save', holiday: 'thanksliving', listing_id: lid, summary: '[TEST] Dinner for four, order by Nov 22.', items: [{ name: 'Roast', desc: 'With gravy', price: '$40' }, { name: '', desc: 'dropped' }], order_by: '2026-11-22', order_url: 'example.com/order', pickup: 'Nov 25, 11 to 6', price_range: '$85', holiday_hours: 'Closed' };
    log('pending: mine says not a member', await call(tp, { action: 'mine' }), (r) => r.j?.ok && r.j.member === false);
    log('pending: save refused', await call(tp, good), (r) => r.s === 403 && r.j?.error === 'member_needed');
    log('owner before owning: refused', await call(to, good), (r) => r.s === 403 && r.j?.error === 'not_your_listing');
    await db.from('listings').update({ owner_member_id: OWNER }).eq('id', lid);
    log('owner: mine lists it', await call(to, { action: 'mine' }), (r) => r.j?.ok && r.j.listings.some((l: any) => l.id === lid));
    log('short summary refused', await call(to, { ...good, summary: 'hi' }), (r) => r.j?.error === 'summary_needed');
    log('no dishes refused', await call(to, { ...good, items: [{ name: '' }] }), (r) => r.j?.error === 'items_needed');
    log('bad date refused', await call(to, { ...good, order_by: '11/22' }), (r) => r.j?.error === 'bad_order_by');
    log('bad link refused', await call(to, { ...good, order_url: 'javascript:alert(1)' }), (r) => r.j?.error === 'bad_order_url');
    log('bad holiday refused', await call(to, { ...good, holiday: 'easter' }), (r) => r.j?.error === 'bad_holiday');
    const s1 = await call(to, good); log('save: pending', s1, (r) => r.j?.ok && r.j.status === 'pending' && r.j.was === null);
    const id = s1.j?.id;
    const { data: row } = await db.from('ve_holiday_menus').select('items, order_url').eq('id', id).maybeSingle();
    out.push({ name: 'empty dish dropped, link cleaned', pass: row?.items?.length === 1 && row?.order_url === 'https://example.com/order', body: JSON.stringify(row) });
    log('save again: still one row', await call(to, good), (r) => r.j?.ok && r.j.id === id && r.j.was === 'pending');
    log('owner: queue refused', await call(to, { action: 'queue' }), (r) => r.s === 403 && r.j?.error === 'no_access');
    log('admin: queue has it', await call(ta, { action: 'queue' }), (r) => r.j?.ok && r.j.rows.some((x: any) => x.id === id));
    log('admin: get', await call(ta, { action: 'get', id }), (r) => r.j?.ok && r.j.claim === 'owner' && r.j.listing?.id === lid);
    log('decline without note refused', await call(ta, { action: 'review', id, decision: 'decline', note: '' }), (r) => r.j?.error === 'note_needed');
    log('decline with note', await call(ta, { action: 'review', id, decision: 'decline', note: '[TEST] add a price' }), (r) => r.j?.ok && r.j.status === 'declined' && r.j.email === 'no_email' || r.j?.email === 'no_email');
    const mine = await call(to, { action: 'mine' });
    out.push({ name: 'owner sees the change asked', pass: mine.j?.menus?.[0]?.status === 'declined' && mine.j.menus[0].decline_note === '[TEST] add a price', body: '' });
    log('resend after change: pending', await call(to, good), (r) => r.j?.ok && r.j.was === 'declined');
    log('approve', await call(ta, { action: 'review', id, decision: 'approve', note: '' }), (r) => r.j?.ok && r.j.status === 'live');
    log('public live shows it, plant-based', await call(null, { action: 'live', holiday: 'thanksliving' }), (r) => r.j?.ok && r.j.menus.some((m: any) => m.id === id && m.listing.vegan_status === 'vegan_options'));
    log('edit a live menu goes back to pending', await call(to, good), (r) => r.j?.ok && r.j.was === 'live');
    log('withdraw', await call(to, { action: 'withdraw', id }), (r) => r.j?.ok && r.j.status === 'withdrawn');
    log('approve a withdrawn one refused', await call(ta, { action: 'review', id, decision: 'approve' }), (r) => r.j?.error === 'withdrawn');
    log('pending account withdraw refused', await call(tp, { action: 'withdraw', id }), (r) => r.s === 403);
  } finally {
    const cleanup: any = {};
    cleanup.menus = (await db.from('ve_holiday_menus').delete().eq('listing_id', lid)).error?.message || 'ok';
    for (const t of ['ve_outreach_contacts', 've_listing_edits', 've_menu_imports', 've_listing_essentials', 've_backlog_checks', 've_listing_health', 've_restaurant_essentials']) {
      const r = await db.from(t).delete().eq('listing_id', lid); cleanup[t] = r.error ? r.error.code : 'ok';
    }
    const d = await db.from('listings').delete().eq('id', lid);
    cleanup.listing = d.error ? d.error.message : 'deleted';
    if (d.error) await db.from('listings').update({ status: 'rejected', owner_member_id: null }).eq('id', lid);
    out.push({ name: 'cleanup', pass: true, body: JSON.stringify(cleanup) });
  }
  return new Response(JSON.stringify(out, null, 1), { headers: { 'Content-Type': 'application/json' } });
});
