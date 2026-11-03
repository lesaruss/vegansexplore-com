// ve-playbooks: Depot > Playbooks (Sean, 2026-11-03). The index of active playbooks: goal, where it stands, the one next action, who owns it.
// POST { action, ... } with a signed-in super admin's token (verify_jwt off, checked here).
// Actions: list, get {slug}, save {slug, status?, stage?, next_action?, owner?, due_on?, goal?, title?, priority?}, add {slug, title, goal, brand_slug?}.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

const STATUSES = ['building', 'waiting_on_sean', 'watching', 'parked', 'done'];
const SLUG = /^[a-z0-9][a-z0-9-]{1,80}$/;
const COLS = 'slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority, updated_at';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const me = tok ? await verifyToken(tok) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: jm } = await db.from('members').select('is_superadmin, standing').eq('id', me).maybeSingle();
  if (!jm?.is_superadmin || (jm.standing && jm.standing !== 'good')) return json({ error: 'no_access' }, 403);
  const action = String(b.action || '');

  if (action === 'list') {
    const { data: rows, error } = await db.from('ve_playbook_index').select(COLS).order('priority', { ascending: true }).limit(500);
    if (error) return json({ error: 'load_failed' }, 500);
    // Playbooks that have records but no row here yet (Vegans Explore only), newest first.
    const have = new Set((rows || []).map((r: any) => r.slug));
    const { data: recs } = await db.from('playbook_records').select('slug, created_at').eq('brand_slug', 'vegans-explore').order('created_at', { ascending: false }).limit(2000);
    const seen: Record<string, { slug: string; last: string; n: number }> = {};
    for (const r of recs || []) { if (have.has(r.slug)) continue; const s = (seen[r.slug] ||= { slug: r.slug, last: r.created_at, n: 0 }); s.n++; }
    return json({ ok: true, rows: rows || [], unindexed: Object.values(seen).sort((a, c) => (a.last < c.last ? 1 : -1)) });
  }

  if (action === 'get') {
    const slug = String(b.slug || '');
    if (!SLUG.test(slug)) return json({ error: 'bad_slug' }, 400);
    const { data: row } = await db.from('ve_playbook_index').select(COLS).eq('slug', slug).maybeSingle();
    const { data: recs } = await db.from('playbook_records').select('id, brand_slug, kind, author, body, created_at').eq('slug', slug).order('created_at', { ascending: false }).limit(60);
    if (!row && !(recs || []).length) return json({ error: 'not_found' }, 404);
    return json({ ok: true, row: row || null, records: recs || [] });
  }

  if (action === 'save') {
    const slug = String(b.slug || '');
    if (!SLUG.test(slug)) return json({ error: 'bad_slug' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: me };
    if (b.status !== undefined) { if (!STATUSES.includes(String(b.status))) return json({ error: 'bad_status' }, 400); patch.status = b.status; }
    if (b.owner !== undefined) { if (!['Logan', 'Sean'].includes(String(b.owner))) return json({ error: 'bad_owner' }, 400); patch.owner = b.owner; }
    for (const [k, n] of [['title', 160], ['goal', 600], ['stage', 900], ['next_action', 600]] as const) if (b[k] !== undefined) patch[k] = clean(b[k], n);
    if (b.due_on !== undefined) { if (b.due_on === null || b.due_on === '') patch.due_on = null; else if (/^\d{4}-\d\d-\d\d$/.test(String(b.due_on))) patch.due_on = b.due_on; else return json({ error: 'bad_date' }, 400); }
    if (b.priority !== undefined) { const p = Number(b.priority); if (!Number.isInteger(p) || p < 1 || p > 999) return json({ error: 'bad_priority' }, 400); patch.priority = p; }
    const { data, error } = await db.from('ve_playbook_index').update(patch).eq('slug', slug).select(COLS).maybeSingle();
    if (error) return json({ error: 'save_failed' }, 500);
    return data ? json({ ok: true, row: data }) : json({ error: 'not_found' }, 404);
  }

  if (action === 'add') {
    const slug = String(b.slug || '');
    if (!SLUG.test(slug)) return json({ error: 'bad_slug' }, 400);
    const title = clean(b.title, 160), goal = clean(b.goal, 600);
    if (title.length < 3 || goal.length < 5) return json({ error: 'title_and_goal_needed' }, 400);
    const { data: exists } = await db.from('playbook_records').select('id').eq('slug', slug).limit(1);
    if (!(exists || []).length) return json({ error: 'no_such_playbook' }, 400);
    const { data, error } = await db.from('ve_playbook_index').insert({ slug, title, goal, brand_slug: clean(b.brand_slug || 'vegans-explore', 60), priority: 50, updated_by: me }).select(COLS).maybeSingle();
    if (error) return json({ error: error.code === '23505' ? 'already_there' : 'save_failed' }, error.code === '23505' ? 409 : 500);
    return json({ ok: true, row: data });
  }

  return json({ error: 'unknown_action' }, 400);
});
