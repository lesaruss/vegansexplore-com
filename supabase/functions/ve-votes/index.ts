// ve-votes: directory votes (Sean, 2026-09-27). Any signed-in member votes for a listing once
// every 24 hours, counted from their last vote for it; the vote sticks and the count is real.
// Before this, the + Vote buttons on /directory and the city hubs only changed the number on
// screen.
//
// POST { action: 'vote', listing_id }   Authorization: Bearer <ve_token>
//   -> { ok, vote_count, next_vote_at }
//   |  409 { error: 'already_voted', next_vote_at }   within 24 hours of their last vote for it
//   |  402 payment_required (not a member yet)
// POST { action: 'today' }              Authorization: Bearer <ve_token>
//   -> { listing_ids, next: { listing_id: next_vote_at } }  votes still inside their 24 hours
//
// next_vote_at is an ISO time; the browser shows it in the visitor's own time zone. A vote is
// a row in listing_daily_votes; its unique (member, listing, vote_date) index stays as a
// backstop (two votes 24 hours apart never share a date). The trg_listing_vote_count trigger
// keeps listings.vote_count, which every directory shows and sorts by. verify_jwt is false:
// the VE app token is checked here the same way ve-auth and ve-media-library check it.
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
const todayEastern = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const DAY_MS = 24 * 60 * 60 * 1000;
const nextAt = (createdAt: string) => new Date(new Date(createdAt).getTime() + DAY_MS).toISOString();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);

  if (body.action === 'today') {
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const { data, error } = await db.from('listing_daily_votes').select('listing_id, created_at').eq('member_id', memberId).gt('created_at', since);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const next: Record<string, string> = {};
    for (const r of data || []) { const n = nextAt(r.created_at); if (!next[r.listing_id] || n > next[r.listing_id]) next[r.listing_id] = n; }
    return json({ listing_ids: Object.keys(next), next });
  }

  if (body.action === 'vote') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    // Members only: the same gate as ve-auth's requireActiveMembership (Guest Passport included).
    const { data: member } = await db.from('members').select('membership_status').eq('id', memberId).maybeSingle();
    if (!member || member.membership_status !== 'active') {
      return json({ error: 'payment_required', message: 'Become a Founding Member for $11, one time, to vote for the places you love every day.' }, 402);
    }
    const { data: listing } = await db.from('listings').select('id').eq('id', id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    // Once every 24 hours, from their last vote for this listing.
    const { data: last } = await db.from('listing_daily_votes').select('created_at').eq('member_id', memberId).eq('listing_id', id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (last && Date.now() - new Date(last.created_at).getTime() < DAY_MS) return json({ error: 'already_voted', next_vote_at: nextAt(last.created_at) }, 409);
    const { data: row, error } = await db.from('listing_daily_votes').insert({ member_id: memberId, listing_id: id, vote_date: todayEastern() }).select('created_at').single();
    if (error) {
      // The date backstop, or two taps landing at once: report the vote that is already there.
      if (error.code === '23505') {
        const { data: again } = await db.from('listing_daily_votes').select('created_at').eq('member_id', memberId).eq('listing_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        return json({ error: 'already_voted', next_vote_at: again ? nextAt(again.created_at) : null }, 409);
      }
      return json({ error: 'vote_failed', message: error.message }, 500);
    }
    const { data: counted } = await db.from('listings').select('vote_count').eq('id', id).maybeSingle();
    return json({ ok: true, vote_count: counted?.vote_count ?? null, next_vote_at: nextAt(row.created_at) });
  }

  return json({ error: 'unknown_action' }, 400);
});
