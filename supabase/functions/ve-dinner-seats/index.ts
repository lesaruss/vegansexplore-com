import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-dinner-seats: seats for the city dinners (Sean, 2026-10-04). The $11 Founding Membership is
// the RSVP, so a seat is saved only for an active member; anyone else goes through
// ve-entry-checkout first and the dinner page saves the seat when they come back.
//
// POST { action: 'status', dinner }  token optional: is it open, is it full, do I have a seat
// POST { action: 'take', dinner }    token required: save my seat (or the waitlist if full)
//
// Seats open and the room size live in ve_dinners (seats_open, capacity), so opening seats
// once the venue confirms is a data change, not a deploy. A seat is a ve_initiative_interest
// 'ticket' row (initiative 'dinner-<slug>': confirmed = a seat, new = the waitlist), taken
// atomically by ve_take_dinner_seat() and managed on /dashboard/leads.
//
// Auth: the custom HMAC token minted by ve-auth, verified the same way as ve-entry-checkout,
// so verify_jwt is off at the platform level.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000) || !payload.sub) return null;
    return { sub: payload.sub };
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.dinner ?? '');
    if (!/^[a-z0-9-]{3,80}$/.test(slug)) return json({ error: 'bad_dinner' }, 400);
    const { data: dinner } = await db.from('ve_dinners').select('slug, city_slug, title, capacity, seats_open').eq('slug', slug).maybeSingle();
    if (!dinner) return json({ error: 'dinner_not_found' }, 404);
    const initiative = 'dinner-' + slug;

    const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '');
    const auth = token ? await verifyToken(token) : null;

    const { count } = await db.from('ve_initiative_interest').select('id', { count: 'exact', head: true })
      .eq('initiative_slug', initiative).eq('action_type', 'ticket').eq('status', 'confirmed');
    const taken = count ?? 0;
    const full = dinner.capacity != null && taken >= dinner.capacity;

    if (body.action === 'status') {
      let mine: string | null = null;
      if (auth) {
        const { data } = await db.from('ve_initiative_interest').select('status')
          .eq('initiative_slug', initiative).eq('action_type', 'ticket').eq('member_id', auth.sub).maybeSingle();
        mine = data ? (data.status === 'confirmed' ? 'confirmed' : 'waitlist') : null;
      }
      return json({ open: dinner.seats_open, full, mine });
    }

    if (body.action === 'take') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      if (!dinner.seats_open) return json({ error: 'seats_closed', message: 'Seats open when invitations go out.' }, 409);
      const { data: member } = await db.from('members').select('id, email, name, membership_status').eq('id', auth.sub).maybeSingle();
      if (!member) return json({ error: 'member_not_found' }, 404);
      if (member.membership_status !== 'active') return json({ need_membership: true });
      const { data, error } = await db.rpc('ve_take_dinner_seat', { p_slug: slug, p_member: member.id, p_email: member.email, p_name: member.name });
      if (error) { console.error('take seat:', error); return json({ error: 'seat_failed' }, 500); }
      const row = Array.isArray(data) ? data[0] : data;
      return json({ seat: row?.seat_status ?? 'confirmed' });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-dinner-seats error:', e);
    return json({ error: 'internal_error' }, 500);
  }
});
