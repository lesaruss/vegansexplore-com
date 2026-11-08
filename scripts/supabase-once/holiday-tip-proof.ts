// ve-once-holiday-tip-proof (2026-11-08, ve-holiday-guide: Tell us about a menu): proves ve-holiday's tip paths against the live
// function, then removes every row it made. Run once with x-run-key, then redeploy as the 410 stub. The key is a placeholder here.
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
  const log = (name: string, r: any, ok: (r: any) => boolean) => out.push({ name, pass: ok(r), status: r.s, body: JSON.stringify(r.j).slice(0, 200) });
  const ids: string[] = [];
  try {
    const [to, tp, ta] = await Promise.all([token(OWNER), token(PENDING), token(ADMIN)]);
    const good = { action: 'tip', holiday: 'thanksliving', place_name: '[TEST] Tip Kitchen', city: 'Miami', state: 'FL', link: 'example.com/thanksliving-tip-proof', note: '[TEST] order by Nov 20' };
    log('signed out refused', await call(null, good), (r) => r.s === 401);
    log('unpaid account refused', await call(tp, good), (r) => r.s === 403 && r.j?.error === 'member_needed');
    log('no place refused', await call(to, { ...good, place_name: 'x' }), (r) => r.j?.error === 'place_needed');
    log('bad link refused', await call(to, { ...good, link: 'javascript:alert(1)' }), (r) => r.j?.error === 'link_needed');
    const t1 = await call(to, good); log('member tip: pending', t1, (r) => r.j?.ok && r.j.status === 'pending'); if (t1.j?.id) ids.push(t1.j.id);
    log('same link again: already', await call(to, good), (r) => r.j?.ok && r.j.already === true && r.j.id === t1.j?.id);
    log('public live hides pending', await call(null, { action: 'live', holiday: 'thanksliving' }), (r) => r.j?.ok && Array.isArray(r.j.tips) && !r.j.tips.some((x: any) => x.id === t1.j?.id));
    log('member refused the team list', await call(to, { action: 'tips' }), (r) => r.s === 403);
    log('team list has it', await call(ta, { action: 'tips' }), (r) => r.j?.ok && r.j.rows.some((x: any) => x.id === t1.j?.id && x.member));
    log('decline without note refused', await call(ta, { action: 'tip_review', id: t1.j?.id, decision: 'decline', note: '' }), (r) => r.j?.error === 'note_needed');
    log('bad listing refused', await call(ta, { action: 'tip_review', id: t1.j?.id, decision: 'approve', listing_id: '00000000-0000-0000-0000-000000000000' }), (r) => r.j?.error === 'bad_listing');
    log('approve', await call(ta, { action: 'tip_review', id: t1.j?.id, decision: 'approve' }), (r) => r.j?.ok && r.j.status === 'live');
    log('public live shows it', await call(null, { action: 'live', holiday: 'thanksliving' }), (r) => r.j?.tips?.some((x: any) => x.id === t1.j?.id && x.link === 'https://example.com/thanksliving-tip-proof'));
    log('decline with note hides it', await call(ta, { action: 'tip_review', id: t1.j?.id, decision: 'decline', note: '[TEST] not theirs' }), (r) => r.j?.ok && r.j.status === 'declined');
    const t2 = await call(ta, { ...good, link: 'example.com/thanksliving-team-proof' }); log('team tip: live at once', t2, (r) => r.j?.ok && r.j.status === 'live'); if (t2.j?.id) ids.push(t2.j.id);
  } finally {
    if (ids.length) await db.from('ve_holiday_menu_tips').delete().in('id', ids);
    await db.from('ve_holiday_menu_tips').delete().like('place_name', '[TEST]%');
  }
  const { count } = await db.from('ve_holiday_menu_tips').select('id', { count: 'exact', head: true }).like('place_name', '[TEST]%');
  return new Response(JSON.stringify({ passed: out.filter((x) => x.pass).length, of: out.length, left: count, out }, null, 1), { headers: { 'Content-Type': 'application/json' } });
});
