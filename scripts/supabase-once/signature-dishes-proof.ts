// ve-once-dishes-proof: playbook ve-signature-dishes item G. Proves ve-signature-dishes live with [TEST] dishes on Love Life Cafe,
// the Logan test account as its owner for the run only, then removes every row and file, gives back the 50 points and puts the
// listing back unclaimed. Redeployed as the 410 stub afterwards.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const KEY = '<random 48 hex characters>';
const URL0 = Deno.env.get('SUPABASE_URL')!, SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL0, SK);
const FN = URL0 + '/functions/v1/ve-signature-dishes';
const LISTING = '630dbf6f-e9ea-4218-b560-ee9448276df9';
const OWNER = '459ced0a-4756-47d7-bdd3-a78865c3a141', VOTER = '76ca3d48-8d3a-45fb-9127-e0c4f5224527', STRANGER = '4acd1c33-1c41-4879-87aa-a759f86a8af6';
const b64 = (u: Uint8Array | string) => btoa(typeof u === 'string' ? u : String.fromCharCode(...u)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
async function tok(sub: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 900 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(h + '.' + p)));
  return h + '.' + p + '.' + b64(sig);
}
async function call(t: string | null, body: any) {
  const r = await fetch(FN, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { Authorization: 'Bearer ' + t } : {}), body: JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
}
async function upload(t: string, src: string, type: string) {
  const img = new Uint8Array(await (await fetch(src)).arrayBuffer());
  const u = await call(t, { action: 'photo_url', listing_id: LISTING, content_type: type, bytes: img.length });
  const put = await fetch(u.body.signed_url, { method: 'PUT', headers: { 'Content-Type': type, 'x-upsert': 'true' }, body: img });
  const done = await call(t, { action: 'photo_done', listing_id: LISTING, path: u.body.path });
  return { path: u.body.path, put: put.status, done };
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 });
  const R: Record<string, unknown> = {};
  const before = (await db.from('listings').select('owner_member_id, claimed_by_member_id, claim_status').eq('id', LISTING).single()).data;
  const bal0 = (await db.from('members').select('lesars_balance').eq('id', OWNER).single()).data!.lesars_balance;
  const pts0 = (await db.from('member_points').select('available_points, total_points').eq('member_id', OWNER).maybeSingle()).data;
  R.before = { listing: before, balance: bal0, member_points: pts0 };
  const paths: string[] = [];
  try {
    await db.from('listings').update({ owner_member_id: OWNER }).eq('id', LISTING);
    const o = await tok(OWNER), v = await tok(VOTER), s = await tok(STRANGER);
    const big = await upload(o, 'https://vegansexplore.com/business/sample/img/m-bbq.webp', 'image/webp'); paths.push(big.path);
    R.photo_ok = { put: big.put, done: big.done };
    const small = await upload(o, 'https://vegansexplore.com/business/sample/img/logo-reverse.png', 'image/png'); paths.push(small.path);
    R.photo_small_refused = small.done;
    const photo = big.done.body.url;
    const save = (d: any) => call(o, { action: 'save', listing_id: LISTING, dish: d });
    R.featured_without_photo = await save({ name: '[TEST] No photo', line: 'x', featured: true });
    R.photo_from_elsewhere = await save({ name: '[TEST] Elsewhere', line: 'x', featured: true, photo_url: 'https://example.com/a.jpg' });
    const ids: string[] = [];
    for (const n of [1, 2, 3]) { const r = await save({ name: '[TEST] Dish ' + n, line: 'Test line ' + n, price_display: '$' + (10 + n), tags: 'Test, Spicy', featured: true, photo_url: photo }); ids.push(r.body.dish?.id); R['save_' + n] = r.status; }
    R.fourth_featured_refused = await save({ name: '[TEST] Dish 4', line: 'Test line 4', featured: true, photo_url: photo });
    const d4 = await save({ name: '[TEST] Dish 4', line: 'Test line 4', featured: false, photo_url: photo }); ids.push(d4.body.dish?.id); R.fourth_saved = d4.status;
    R.slot5_before_4 = await call(o, { action: 'slot_buy', listing_id: LISTING, slot: 5 });
    R.slot4 = await call(o, { action: 'slot_buy', listing_id: LISTING, slot: 4 });
    R.slot4_again = await call(o, { action: 'slot_buy', listing_id: LISTING, slot: 4 });
    R.balance_after_slot = (await db.from('members').select('lesars_balance').eq('id', OWNER).single()).data!.lesars_balance;
    R.ledger = (await db.from('points_ledger').select('delta, reason, ref_id').eq('member_id', OWNER).eq('reason', 'dish_slot')).data;
    R.fourth_featured_now = (await save({ id: ids[3], name: '[TEST] Dish 4', line: 'Test line 4', featured: true, photo_url: photo })).status;
    const pub1 = await call(null, { action: 'list', listing_id: LISTING });
    R.public_list = { cap: pub1.body.cap, names: pub1.body.dishes.map((x: any) => x.name) };
    R.order = (await call(o, { action: 'order', listing_id: LISTING, ids: [ids[3], ids[2], ids[1], ids[0]] })).status;
    R.public_after_order = (await call(null, { action: 'list', listing_id: LISTING })).body.dishes.map((x: any) => x.name);
    R.vote = (await call(v, { action: 'vote', dish_id: ids[0] })).body;
    R.vote_again = (await call(v, { action: 'vote', dish_id: ids[0] })).body;
    R.order_unchanged_by_votes = (await call(v, { action: 'list', listing_id: LISTING })).body.dishes.map((x: any) => x.name + ':' + x.votes + (x.voted ? '*' : ''));
    R.owner_vote = await call(o, { action: 'vote', dish_id: ids[1] });
    R.unpaid_vote = await call(s, { action: 'vote', dish_id: ids[1] });
    R.signed_out_vote = await call(null, { action: 'vote', dish_id: ids[1] });
    R.vote_taken_back = (await call(v, { action: 'vote', dish_id: ids[0], on: false })).body;
    R.stranger_owner_get = await call(s, { action: 'owner_get', listing_id: LISTING });
    R.stranger_save = await call(v, { action: 'save', listing_id: LISTING, dish: { name: '[TEST] Intruder' } });
    const og = await call(o, { action: 'owner_get', listing_id: LISTING });
    R.owner_get = { cap: og.body.cap, slots: og.body.slots?.length, dishes: og.body.dishes?.map((x: any) => x.name + (x.shown ? ' (shown)' : '')) };
    R.remove = (await call(o, { action: 'remove', listing_id: LISTING, id: ids[0] })).status;
  } catch (e) { R.error = String(e); }
  finally {
    // Clean up: dishes (votes go with them), slots, the ledger row and the 50 points, the files, the listing's owner.
    await db.from('ve_signature_dishes').delete().eq('listing_id', LISTING);
    await db.from('ve_dish_slots').delete().eq('listing_id', LISTING);
    const led = (await db.from('points_ledger').select('id, delta').eq('member_id', OWNER).eq('reason', 'dish_slot')).data || [];
    const back = led.reduce((a: number, r: any) => a - r.delta, 0);
    if (led.length) await db.from('points_ledger').delete().in('id', led.map((r: any) => r.id));
    if (back) { await db.from('members').update({ lesars_balance: bal0 }).eq('id', OWNER); if (pts0) await db.from('member_points').update({ available_points: pts0.available_points, total_points: pts0.total_points }).eq('member_id', OWNER); }
    const listed = await db.storage.from('vegan-media').list('media/dishes/love-life-cafe');
    const all = (listed.data || []).map((f: any) => 'media/dishes/love-life-cafe/' + f.name);
    if (all.length) await db.storage.from('vegan-media').remove(all);
    await db.from('listings').update({ owner_member_id: before!.owner_member_id, claimed_by_member_id: before!.claimed_by_member_id, claim_status: before!.claim_status }).eq('id', LISTING);
    R.cleanup = { points_given_back: back, files_removed: all.length };
  }
  return Response.json(R);
});
