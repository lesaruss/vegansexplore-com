// ve-checkin: members check in at the places they visit (Sean, 2026-10-25: "If they go to a restaurant and can verify it's
// there, they can check in... every time they check in, they can get like 10 points... We can see a record of how many people
// are actually visiting, which members are visiting"). Migration 20261025_ve_checkins.sql; the rules live in ve_checkin_save
// (at the place within 150 m, once per place a day, 10 points for up to 5 places a day).
//
// POST { action: 'listing', listing_id }                 anyone: { total, last_30_days, people_30_days, last_at, mine_today }
//                                                         counts only for the public; an active member also gets people: the
//                                                         members who checked in in the last 90 days and leave show_checkins on
//                                                         (Sean, 2026-10-25), newest first, first name and initial
// POST { action: 'privacy', show_checkins? }             a signed-in member: reads, or sets, whether other members see their
//                                                         check-ins (members.show_checkins, on by default; the owner of a claimed
//                                                         place always sees them, through ve-claims owner_dashboard)
// POST { action: 'checkin', listing_id, lat, lng, accuracy }  an active member: { ok, points, distance_m } or { ok: false, why }
// POST { action: 'mine' }                                a signed-in member: their check-ins, newest first, and the points
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : null);

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;

  if (body.action === 'listing') {
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const { data } = await db.rpc('ve_listing_checkins', { p_listing: body.listing_id });
    let mine_today = false, people: string[] | undefined, more = 0;
    if (memberId) {
      const { data: me } = await db.from('members').select('membership_status').eq('id', memberId).maybeSingle();
      if (me?.membership_status === 'active') {
        const { data: rows } = await db.from('ve_checkins').select('member_id, created_at, members!inner(name, show_checkins)')
          .eq('listing_id', body.listing_id).eq('members.show_checkins', true).neq('member_id', memberId)
          .gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString()).order('created_at', { ascending: false }).limit(200);
        const seen = new Set<string>(), names: string[] = [];
        for (const r of (rows || []) as any[]) {
          if (seen.has(r.member_id)) continue; seen.add(r.member_id);
          const p = String(r.members?.name || '').trim().split(/\s+/);
          if (p[0]) names.push(p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''));
        }
        people = names.slice(0, 6); more = Math.max(0, names.length - 6);
      }
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const { count } = await db.from('ve_checkins').select('id', { count: 'exact', head: true })
        .eq('listing_id', body.listing_id).eq('member_id', memberId).eq('local_day', today);
      mine_today = (count || 0) > 0;
    }
    return json({ ok: true, ...(data || {}), mine_today, ...(people ? { people, more } : {}) });
  }

  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: m } = await db.from('members').select('id, membership_status').eq('id', memberId).maybeSingle();
  if (!m) return json({ error: 'not_found' }, 404);

  if (body.action === 'privacy') {
    if (typeof body.show_checkins === 'boolean') {
      const { error } = await db.from('members').update({ show_checkins: body.show_checkins }).eq('id', memberId);
      if (error) return json({ error: 'save_failed' }, 500);
    }
    const { data: p } = await db.from('members').select('show_checkins').eq('id', memberId).maybeSingle();
    return json({ ok: true, show_checkins: p?.show_checkins !== false });
  }

  if (body.action === 'checkin') {
    // Check-ins are a member benefit, like votes.
    if (m.membership_status !== 'active') return json({ ok: false, why: 'members_only' }, 403);
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const { data, error } = await db.rpc('ve_checkin_save', { p_member: memberId, p_listing: body.listing_id,
      p_lat: num(body.lat), p_lng: num(body.lng), p_accuracy: num(body.accuracy) });
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  if (body.action === 'mine') {
    const { data } = await db.from('ve_checkins').select('created_at, points, listings(name, slug, address_city)')
      .eq('member_id', memberId).order('created_at', { ascending: false }).limit(100);
    const rows = (data || []).map((c: any) => ({ at: c.created_at, points: c.points, name: c.listings?.name, slug: c.listings?.slug, city: c.listings?.address_city }));
    return json({ ok: true, checkins: rows, points: rows.reduce((a: number, r: any) => a + (r.points || 0), 0) });
  }

  return json({ error: 'unknown_action' }, 400);
});
