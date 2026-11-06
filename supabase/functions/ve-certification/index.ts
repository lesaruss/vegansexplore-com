// ve-certification: vegans-explore-initiative-business-certification, B4 (2026-11-06, Logan). The Pre-Vegan dish status registry.
// Migration 20261106_pre_vegan_dish_registry.sql. verify_jwt off.
// Public (no token): status {code} for the QR status page, registry for the public list. Both are read live, never cached,
// so a suspension shows at once, and neither ever returns a reason, an applied or pending dish, the people or the team note.
// Team (a signed-in super admin's token, or LESARUSS_ADMIN_TOKEN with as_member; never a Guide account):
//   list, get {id}, listing_find {q}, cert_save {id?, listing_id, term_start, term_end, menu_items_total, also_serves,
//   verifier_name, desk_reviewer_name, team_note}, dish_add {cert_id, name, menu_section}, dish_edit {id, name, menu_section, sort},
//   dish_status {id, to, reason}. Every status change goes through ve_preveg_dish_set_status, which keeps the history.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_TOKEN = Deno.env.get('LESARUSS_ADMIN_TOKEN') || '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SERVES = ['meat', 'fish', 'dairy', 'eggs'];
const STATUSES = ['applied', 'pending', 'active', 'suspended', 'expired', 'revoked', 'withdrawn'];

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
const orNull = (v: unknown, n: number) => { const s = clean(v, n); return s ? s : null; };

async function rpc(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

async function newCode(): Promise<string> { return await rpc('ve_preveg_new_code') as string; }

async function certView(id: string) {
  const { data: c } = await db.from('ve_preveg_certs').select('*').eq('id', id).maybeSingle();
  if (!c) return null;
  const [{ data: l }, { data: dishes }, { data: events }] = await Promise.all([
    db.from('listings').select('id, slug, name, logo_url, address_street, address_city, address_state, category, vegan_status').eq('id', c.listing_id).maybeSingle(),
    db.from('ve_preveg_dishes').select('*').eq('cert_id', id).order('sort').order('created_at'),
    db.from('ve_preveg_dish_events').select('*').eq('cert_id', id).order('created_at', { ascending: true }).limit(1000),
  ]);
  return { cert: c, listing: l, dishes: dishes || [], events: events || [] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(b.action || '');

  try {
    // ---- Public ----
    if (action === 'status') {
      const code = clean(b.code, 16).toUpperCase();
      if (!/^[A-Z0-9]{4,16}$/.test(code)) return json({ state: 'not_found' });
      return json(await rpc('ve_preveg_cert_public', { p_code: code }));
    }
    if (action === 'registry') return json({ ok: true, rows: await rpc('ve_preveg_registry_public') });

    // ---- Team ----
    const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    let who: string | null = null;
    if (ADMIN_TOKEN && tok === ADMIN_TOKEN && UUID.test(String(b.as_member || ''))) who = String(b.as_member);
    else who = tok ? await verifyToken(tok) : null;
    if (!who) return json({ error: 'not_authenticated' }, 401);
    const { data: me } = await db.from('members').select('id, name, is_superadmin, standing, member_class').eq('id', who).maybeSingle();
    if (!me?.is_superadmin || (me.standing && me.standing !== 'good')) return json({ error: 'no_access' }, 403);
    const viewOnly = me.member_class === 'agent';
    const READS = ['list', 'get', 'listing_find'];
    if (!READS.includes(action) && viewOnly) return json({ error: 'view_only' }, 403);

    if (action === 'list') {
      await rpc('ve_preveg_expire_sweep');
      const { data: certs } = await db.from('ve_preveg_certs').select('id, listing_id, code, term_start, term_end, menu_items_total, also_serves, updated_at, created_at').order('updated_at', { ascending: false }).limit(500);
      const ids = (certs || []).map((c) => c.id), lids = [...new Set((certs || []).map((c) => c.listing_id))];
      const [{ data: dishes }, { data: ls }] = await Promise.all([
        ids.length ? db.from('ve_preveg_dishes').select('cert_id, status').in('cert_id', ids) : Promise.resolve({ data: [] as any[] }),
        lids.length ? db.from('listings').select('id, slug, name, logo_url, address_city, address_state').in('id', lids) : Promise.resolve({ data: [] as any[] }),
      ]);
      const lm = Object.fromEntries((ls || []).map((l) => [l.id, l]));
      const counts: Record<string, Record<string, number>> = {};
      for (const d of dishes || []) { const c = (counts[d.cert_id] ||= {}); c[d.status] = (c[d.status] || 0) + 1; }
      return json({ ok: true, view_only: viewOnly, certs: (certs || []).map((c) => ({ ...c, listing: lm[c.listing_id] || null, counts: counts[c.id] || {} })) });
    }

    if (action === 'get') {
      if (!UUID.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
      await rpc('ve_preveg_expire_sweep');
      const v = await certView(b.id);
      if (!v) return json({ error: 'not_found' }, 404);
      return json({ ok: true, view_only: viewOnly, me: { id: me.id, name: me.name }, ...v, public: await rpc('ve_preveg_cert_public', { p_code: v.cert.code }) });
    }

    if (action === 'listing_find') {
      const q = clean(b.q, 80);
      if (q.length < 2) return json({ ok: true, rows: [] });
      const like = `%${q.replace(/[%_,()]/g, ' ')}%`;
      const { data } = await db.from('listings').select('id, slug, name, logo_url, address_city, address_state, category, vegan_status').eq('status', 'approved').ilike('name', like).order('name').limit(15);
      return json({ ok: true, rows: data || [] });
    }

    if (action === 'cert_save') {
      const row: Record<string, unknown> = {
        term_start: b.term_start ? (DAY.test(String(b.term_start)) ? b.term_start : 'bad') : null,
        term_end: b.term_end ? (DAY.test(String(b.term_end)) ? b.term_end : 'bad') : null,
        menu_items_total: b.menu_items_total === '' || b.menu_items_total == null ? null : Math.floor(Number(b.menu_items_total)),
        also_serves: Array.isArray(b.also_serves) ? [...new Set(b.also_serves.map(String))].filter((x) => SERVES.includes(x)) : [],
        verifier_name: orNull(b.verifier_name, 120), desk_reviewer_name: orNull(b.desk_reviewer_name, 120),
        team_note: orNull(b.team_note, 4000), updated_at: new Date().toISOString(),
      };
      if (row.term_start === 'bad' || row.term_end === 'bad') return json({ error: 'bad_date' }, 400);
      if (row.menu_items_total != null && !(Number(row.menu_items_total) >= 1 && Number(row.menu_items_total) <= 2000)) return json({ error: 'bad_menu_count' }, 400);
      if (row.term_start && row.term_end && String(row.term_end) <= String(row.term_start)) return json({ error: 'bad_term' }, 400);
      if (row.verifier_name && row.desk_reviewer_name && String(row.verifier_name).toLowerCase() === String(row.desk_reviewer_name).toLowerCase()) return json({ error: 'same_person' }, 400);
      if (b.id) {
        if (!UUID.test(String(b.id))) return json({ error: 'bad_id' }, 400);
        const { error } = await db.from('ve_preveg_certs').update(row).eq('id', b.id);
        if (error) return json({ error: 'save_failed', detail: error.message }, 400);
        return json({ ok: true, id: b.id });
      }
      if (!UUID.test(String(b.listing_id || ''))) return json({ error: 'listing_needed' }, 400);
      const { data: l } = await db.from('listings').select('id').eq('id', b.listing_id).eq('status', 'approved').maybeSingle();
      if (!l) return json({ error: 'listing_not_found' }, 404);
      const { data, error } = await db.from('ve_preveg_certs').insert({ ...row, listing_id: b.listing_id, code: await newCode(), created_by: me.id }).select('id, code').single();
      if (error) return json({ error: 'save_failed', detail: error.message }, 400);
      return json({ ok: true, id: data.id, code: data.code });
    }

    if (action === 'dish_add') {
      if (!UUID.test(String(b.cert_id || ''))) return json({ error: 'bad_id' }, 400);
      const name = clean(b.name, 120);
      if (name.length < 2) return json({ error: 'name_needed' }, 400);
      const { count } = await db.from('ve_preveg_dishes').select('id', { count: 'exact', head: true }).eq('cert_id', b.cert_id);
      const { data, error } = await db.from('ve_preveg_dishes').insert({ cert_id: b.cert_id, name, menu_section: orNull(b.menu_section, 80), sort: count || 0 }).select('id').single();
      if (error) return json({ error: 'save_failed', detail: error.message }, 400);
      return json({ ok: true, id: data.id });
    }

    if (action === 'dish_edit') {
      if (!UUID.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
      const { data: d } = await db.from('ve_preveg_dishes').select('id, status').eq('id', b.id).maybeSingle();
      if (!d) return json({ error: 'not_found' }, 404);
      const patch: Record<string, unknown> = {};
      if (b.name !== undefined) {
        // A certified dish keeps the name it was certified under: a changed dish is a new review (G6).
        if (!['applied', 'pending'].includes(d.status)) return json({ error: 'certified_name_fixed' }, 409);
        const name = clean(b.name, 120); if (name.length < 2) return json({ error: 'name_needed' }, 400); patch.name = name;
      }
      if (b.menu_section !== undefined) patch.menu_section = orNull(b.menu_section, 80);
      if (b.sort !== undefined) patch.sort = Math.max(0, Math.min(999, Math.floor(Number(b.sort) || 0)));
      const { error } = await db.from('ve_preveg_dishes').update(patch).eq('id', b.id);
      if (error) return json({ error: 'save_failed', detail: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'dish_status') {
      if (!UUID.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
      const to = String(b.to || '');
      if (!STATUSES.includes(to)) return json({ error: 'bad_status' }, 400);
      const r: any = await rpc('ve_preveg_dish_set_status', { p_dish: b.id, p_to: to, p_reason: clean(b.reason, 2000), p_actor: me.id });
      return json(r, r?.ok ? 200 : 400);
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: 'server_error', detail: String((e as Error).message || e) }, 500);
  }
});
