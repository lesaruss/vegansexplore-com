// ve-once-next-chapters-proof (2026-11-09, ve-chapter-rankings: Depot > Next chapter suggestions): proves ve-votes' next_admin_*
// actions and the Inbox row against the live function, then removes every row it made. Run once with x-run-key, then redeploy as the 410 stub. The key is a placeholder here.
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
  const r = await fetch(`${URL_}/functions/v1/ve-votes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body) });
  return { s: r.status, j: await r.json().catch(() => null) };
}
const SLUG = 'test-proof-town';
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== RUN_KEY) return new Response('no', { status: 403 });
  const out: any[] = [];
  const log = (name: string, r: any, ok: (r: any) => boolean) => out.push({ name, pass: ok(r), status: r.s, body: JSON.stringify(r.j).slice(0, 220) });
  const ids: string[] = [];
  try {
    const [to, ta] = await Promise.all([token(OWNER), token(ADMIN)]);
    const ins = async (place: string, why: string) => { const { data } = await db.from('ve_next_chapter_suggestions').insert({ member_id: OWNER, place, why }).select('id').single(); ids.push(data!.id); return data!.id as string; };
    const s1 = await ins('[TEST] Proof Town', '[TEST] Lots of Vegans here, proof row');
    const s2 = await ins('[TEST] Aside Town', '[TEST] proof row');
    const { data: inbox } = await db.rpc('ve_inbox_items');
    log('Inbox row for a new suggestion', { s: 200, j: (inbox || []).filter((x: any) => x.source === 'next_chapter').map((x: any) => ({ id: x.source_id, link: x.link })) },
      (r) => r.j.some((x: any) => x.id === s1 && x.link === '/admin/depot/next-chapters#s/' + s1));
    log('signed out refused', await call(null, { action: 'next_admin_list' }), (r) => r.s === 401);
    log('member refused list', await call(to, { action: 'next_admin_list' }), (r) => r.s === 403);
    log('member refused decide', await call(to, { action: 'next_admin_decide', id: s1, decision: 'add' }), (r) => r.s === 403);
    log('admin list has it with who', await call(ta, { action: 'next_admin_list' }), (r) => r.j?.ok && r.j.suggestions.some((x: any) => x.id === s1 && x.member && x.member.name) && r.j.places.length >= 12);
    log('set aside without note refused', await call(ta, { action: 'next_admin_decide', id: s2, decision: 'set_aside', note: '' }), (r) => r.j?.error === 'note_needed');
    log('set aside with note', await call(ta, { action: 'next_admin_decide', id: s2, decision: 'set_aside', note: '[TEST] too small for now' }), (r) => r.j?.ok);
    log('bad decision refused', await call(ta, { action: 'next_admin_decide', id: s1, decision: 'zap' }), (r) => r.j?.error === 'bad_decision');
    log('add to the board', await call(ta, { action: 'next_admin_decide', id: s1, decision: 'add', name: '[TEST] Proof Town', sub: 'Proof State' }), (r) => r.j?.ok && r.j.slug === SLUG);
    log('added twice refused', await call(ta, { action: 'next_admin_decide', id: s1, decision: 'add' }), (r) => r.s === 409 && r.j?.error === 'already_added');
    const { data: st } = await db.from('ve_next_chapter_suggestions').select('id, status, added_slug, note').in('id', ids);
    log('rows now added and set_aside', { s: 200, j: st }, (r) => r.j.some((x: any) => x.id === s1 && x.status === 'added' && x.added_slug === SLUG) && r.j.some((x: any) => x.id === s2 && x.status === 'set_aside' && x.note));
    log('public board shows it', await call(null, { action: 'next_list' }), (r) => r.j?.places?.some((x: any) => x.slug === SLUG));
    const { data: inbox2 } = await db.rpc('ve_inbox_items');
    log('decided ones leave the Inbox', { s: 200, j: (inbox2 || []).filter((x: any) => x.source === 'next_chapter').map((x: any) => x.source_id) }, (r) => !r.j.includes(s1) && !r.j.includes(s2));
    const s3 = await ins('[TEST] proof town', '[TEST] same place again');
    log('same place: already on board', await call(ta, { action: 'next_admin_decide', id: s3, decision: 'add', name: '[TEST] Proof Town' }), (r) => r.s === 409 && r.j?.error === 'already_on_board' && r.j.slug === SLUG);
    log('link to existing', await call(ta, { action: 'next_admin_decide', id: s3, decision: 'add', name: '[TEST] Proof Town', link_existing: true }), (r) => r.j?.ok && r.j.slug === SLUG);
    log('reopen', await call(ta, { action: 'next_admin_decide', id: s2, decision: 'reopen' }), (r) => r.j?.ok);
    log('hide place', await call(ta, { action: 'next_admin_place_save', slug: SLUG, status: 'hidden' }), (r) => r.j?.ok);
    log('hidden leaves public board', await call(null, { action: 'next_list' }), (r) => r.j?.places && !r.j.places.some((x: any) => x.slug === SLUG));
    log('bad hub refused', await call(ta, { action: 'next_admin_place_save', slug: SLUG, status: 'opened', opened_hub: 'mars' }), (r) => r.j?.error === 'bad_hub');
    log('mark opened as a chapter', await call(ta, { action: 'next_admin_place_save', slug: SLUG, status: 'opened', opened_hub: 'london' }), (r) => r.j?.ok);
    const { data: pl } = await db.from('ve_next_chapters').select('status, opened_hub').eq('slug', SLUG).maybeSingle();
    log('place row opened, london', { s: 200, j: pl }, (r) => r.j?.status === 'opened' && r.j.opened_hub === 'london');
    log('member refused place save', await call(to, { action: 'next_admin_place_save', slug: SLUG, status: 'open' }), (r) => r.s === 403);
    log('unknown place 404', await call(ta, { action: 'next_admin_place_save', slug: 'nowhere-xyz', status: 'open' }), (r) => r.s === 404);
  } finally {
    if (ids.length) await db.from('ve_next_chapter_suggestions').delete().in('id', ids);
    await db.from('ve_next_chapter_suggestions').delete().like('place', '[TEST]%');
    await db.from('ve_next_chapters').delete().eq('slug', SLUG);
  }
  const { count } = await db.from('ve_next_chapter_suggestions').select('id', { count: 'exact', head: true });
  const { count: pc } = await db.from('ve_next_chapters').select('slug', { count: 'exact', head: true });
  return new Response(JSON.stringify({ passed: out.filter((x) => x.pass).length, of: out.length, suggestions_left: count, places_left: pc, out }, null, 1), { headers: { 'Content-Type': 'application/json' } });
});
