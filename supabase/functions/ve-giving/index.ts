// ve-giving: 11 Days of Giving (Sean, 2026-11-15: "build the entry page"; plan locked 2026-11-13, playbook ve-holiday-guide; migration
// 20261115_eleven_days_of_giving_entries.sql). December 1 to 11, members enter free for prizes Vegan businesses give; winners are drawn at
// random in the open. POST { action, ... }. verify_jwt off; the Vegans Explore token is checked here (the same check as ve-holiday).
// Public:  status  -> { open, rules_reviewed (the rules link shows only once the attorney has read them), starts_on, ends_on, prizes (live ones, with the business), entries (count), me? { member, entered } }
// Member:  enter   -> one free entry per member per giveaway, only while entries_open (a super admin may enter while closed, to test)
// Admin:   entries -> who entered, newest first (super admins only)
// Nothing here takes money, a share, a tag or a follow: entering is free and open to every member in good standing.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken (copied from ve-holiday).
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

type Settings = { campaign: string; entries_open: boolean; rules_reviewed: boolean; starts_on: string; ends_on: string; fulfill_by: string };
async function settings(): Promise<Settings> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'giving_2026').maybeSingle();
  const v = (data?.value || {}) as Partial<Settings>;
  return { campaign: v.campaign || '11-days-of-giving-2026', entries_open: v.entries_open === true, rules_reviewed: v.rules_reviewed === true, starts_on: v.starts_on || '2026-12-01', ends_on: v.ends_on || '2026-12-11', fulfill_by: v.fulfill_by || '2027-01-10' };
}
// Entries close at the end of the last day, Eastern (midnight Eastern is 05:00 UTC in December).
const closedByDate = (s: Settings) => Date.now() >= Date.parse(s.ends_on + 'T05:00:00Z') + 864e5;

async function whoAmI(req: Request, b: Record<string, unknown>) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
  const me = tok && tok.split('.').length === 3 ? await verifyToken(tok) : null;
  if (!me) return null;
  const { data: mm } = await db.from('members').select('id, is_superadmin, standing, membership_status').eq('id', me).maybeSingle();
  return mm || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(b.action || '');
  const s = await settings();
  const open = s.entries_open && !closedByDate(s);

  if (action === 'status') {
    const [{ data: prizes }, { count }] = await Promise.all([
      db.from('ve_giving_prizes').select('id, title, value_cents, quantity, image_url, draw_on, listing:listings(slug, name, logo_url, category)')
        .eq('campaign', s.campaign).eq('status', 'live').order('draw_on', { ascending: true, nullsFirst: false }).order('created_at'),
      db.from('ve_giving_entries').select('id', { count: 'exact', head: true }).eq('campaign', s.campaign),
    ]);
    const mm = await whoAmI(req, b);
    let me = null;
    if (mm) {
      const { data: e } = await db.from('ve_giving_entries').select('entered_at').eq('campaign', s.campaign).eq('member_id', mm.id).maybeSingle();
      me = { member: !!mm.is_superadmin || mm.membership_status === 'active', entered: !!e, entered_at: e?.entered_at || null, admin: !!mm.is_superadmin };
    }
    return json({ ok: true, open, rules_reviewed: s.rules_reviewed, starts_on: s.starts_on, ends_on: s.ends_on, fulfill_by: s.fulfill_by, prizes: prizes || [], entries: count || 0, me });
  }

  const mm = await whoAmI(req, b);
  if (!mm) return json({ error: 'not_authenticated' }, 401);

  if (action === 'enter') {
    if (mm.standing && mm.standing !== 'good') return json({ error: 'account_not_in_good_standing' }, 403);
    const admin = !!mm.is_superadmin;
    if (!admin && mm.membership_status !== 'active') return json({ error: 'member_needed' }, 403);
    if (!open && !admin) return json({ error: 'entries_closed' }, 409);
    const { error } = await db.from('ve_giving_entries').upsert({ campaign: s.campaign, member_id: mm.id, source: String(b.source || 'holiday-guide').slice(0, 40) },
      { onConflict: 'campaign,member_id', ignoreDuplicates: true });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, entered: true });
  }

  if (action === 'entries') {
    if (!mm.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data } = await db.from('ve_giving_entries').select('entered_at, source, member:members(id, name)').eq('campaign', s.campaign).order('entered_at', { ascending: false }).limit(5000);
    return json({ ok: true, entries: data || [] });
  }

  return json({ error: 'unknown_action' }, 400);
});
