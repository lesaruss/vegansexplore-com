// ve-badges: Depot > Business badges (Sean, 2026-11-06, canon-ve-business-badges; migration 20261106_business_badge_intake.sql).
// The owner's own intake answers set their badge; 100% Vegan shows only after our team checks it. This is the team's queue.
// POST { action, ... } with the signed-in super admin's token. verify_jwt off, the token is checked here.
// Actions: list {status?}, get {member_id}, decide {member_id, decision: approve | follow_up | note, note}.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['checking', 'follow_up', 'shown'];

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

// Who the business is: the member, the business name and link they gave, their chapter, and any listing they own.
async function people(ids: string[]) {
  if (!ids.length) return {} as Record<string, any>;
  const [ms, sh, ls] = await Promise.all([
    db.from('members').select('id, name, email, initials, color, avatar_url, home_community').in('id', ids),
    db.from('ve_member_shared_answers').select('member_id, key, value').in('member_id', ids).in('key', ['org_name', 'org_link', 'chapter']),
    db.from('listings').select('id, slug, name, category, owner_member_id').in('owner_member_id', ids).eq('status', 'approved').limit(200),
  ]);
  const out: Record<string, any> = {};
  for (const m of ms.data || []) out[m.id] = { ...m, business: {}, listings: [] };
  for (const s of sh.data || []) if (out[s.member_id]) out[s.member_id].business[s.key] = s.value;
  for (const l of ls.data || []) if (out[l.owner_member_id]) out[l.owner_member_id].listings.push({ slug: l.slug, name: l.name, category: l.category });
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
  const me = tok ? await verifyToken(tok) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: mm } = await db.from('members').select('is_superadmin, standing').eq('id', me).maybeSingle();
  if (!mm?.is_superadmin || (mm.standing && mm.standing !== 'good')) return json({ error: 'no_access' }, 403);
  const action = String(b.action || '');

  if (action === 'list') {
    const { data: rows, error } = await db.from('ve_business_badges').select('member_id, claimed, shown, status, answers, approved_at, team_note, claimed_at, updated_at').order('claimed_at', { ascending: true }).limit(1000);
    if (error) return json({ error: 'load_failed' }, 500);
    const who = await people((rows || []).map((r) => r.member_id));
    const counts: Record<string, number> = { checking: 0, follow_up: 0, shown: 0, all: (rows || []).length };
    for (const r of rows || []) counts[r.status] = (counts[r.status] || 0) + 1;
    const st = STATUSES.includes(String(b.status)) ? String(b.status) : null;
    return json({ ok: true, counts, rows: (rows || []).filter((r) => !st || r.status === st).map((r) => ({ ...r, member: who[r.member_id] || null })) });
  }

  if (action === 'get') {
    const id = String(b.member_id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: row } = await db.from('ve_business_badges').select('*').eq('member_id', id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    const [who, ev, qs] = await Promise.all([
      people([id]),
      db.from('ve_business_badge_events').select('kind, claimed, shown, status, note, by_member, at').eq('member_id', id).order('at', { ascending: false }).limit(50),
      db.from('ve_shared_questions').select('key, prompt, options').in('key', ['biz_all_plant', 'biz_word', 'biz_beyond', 'biz_help']),
    ]);
    const byIds = [...new Set((ev.data || []).map((e) => e.by_member).filter(Boolean))] as string[];
    const { data: by } = byIds.length ? await db.from('members').select('id, name').in('id', byIds) : { data: [] as any[] };
    const nm = Object.fromEntries((by || []).map((m) => [m.id, m.name]));
    const order = ['biz_all_plant', 'biz_word', 'biz_beyond', 'biz_help'];
    const answers = (qs.data || []).sort((x, y) => order.indexOf(x.key) - order.indexOf(y.key)).filter((q) => row.answers?.[q.key] != null)
      .map((q) => ({ q: q.prompt, a: (q.options || []).find((o: any) => o.v === row.answers[q.key])?.label ?? row.answers[q.key] }));
    return json({ ok: true, badge: row, member: who[id] || null, answers, history: (ev.data || []).map((e) => ({ ...e, by_name: e.by_member ? nm[e.by_member] || null : null })) });
  }

  if (action === 'decide') {
    const id = String(b.member_id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.rpc('ve_business_badge_decide', { p_member: id, p_admin: me, p_decision: String(b.decision || ''), p_note: clean(b.note, 1000) });
    if (error) return json({ error: 'decide_failed' }, 500);
    if (data?.error) return json(data, data.error === 'not_found' ? 404 : data.error === 'forbidden' ? 403 : 400);
    return json(data);
  }

  return json({ error: 'unknown_action' }, 400);
});
