// ve-referrer (Sean, 2026-11-03: "in the registration process, the name of the person that registered you, so we can do a double check to
// make sure they get credit... if their name shows up in our system as they're typing it, it'll give them an auto option").
// Migration 20261103_referrer_claims.sql. The member token is checked here (an unpaid account's token works: this runs before they pay).
//   POST { action: 'status' }                       who the account is credited to now (first name and last initial) and any claim
//   POST { action: 'search', q }                    members to suggest while typing (first name, last initial, chapter; no emails)
//   POST { action: 'claim', referrer_id?, text? }   record who sent them: a picked member, or the words they typed
// A claim sets members.referred_by only when their link did not (members.referred_by is what pays the 111 points and the commission);
// where the link and the claim disagree the link stays and the claim is kept for review (ve_referral_claims.status 'conflict').
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const bearer = (req: Request) => (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

// First name and last initial, the way the site names members to each other.
function label(name: string | null): string {
  const w = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'a member';
  const first = w[0].charAt(0).toUpperCase() + w[0].slice(1).toLowerCase();
  return w.length > 1 ? `${first} ${w[w.length - 1].charAt(0).toUpperCase()}.` : first;
}

// Suggestions are for someone mid sign-up, not for browsing: 40 searches per 10 minutes per account, per instance.
const hits = new Map<string, number[]>();
function limited(sub: string): boolean {
  const now = Date.now(), list = (hits.get(sub) ?? []).filter((t) => now - t < 600000);
  list.push(now); hits.set(sub, list);
  return list.length > 40;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await verifyToken(bearer(req));
    if (!sub) return json({ error: 'not_authenticated' }, 401);

    if (action === 'status') {
      const { data: me } = await db.from('members').select('referred_by, membership_status').eq('id', sub).maybeSingle();
      if (!me) return json({ error: 'not_found' }, 404);
      let credited: string | null = null;
      if (me.referred_by) {
        const { data: r } = await db.from('members').select('name').eq('id', me.referred_by).maybeSingle();
        credited = label(r?.name ?? null);
      }
      const { data: c } = await db.from('ve_referral_claims').select('status, claimed_text').eq('member_id', sub).maybeSingle();
      return json({ ok: true, credited, paid: me.membership_status !== 'pending_payment', claim: c ? { status: c.status, text: c.claimed_text } : null });
    }

    if (action === 'search') {
      const q = String(body.q ?? '').trim().slice(0, 60);
      if (q.length < 2) return json({ ok: true, results: [] });
      if (limited(sub)) return json({ error: 'slow_down' }, 429);
      const { data, error } = await db.rpc('ve_referrer_search', { p_q: q });
      if (error) return json({ error: 'search_failed' }, 500);
      return json({ ok: true, results: (data ?? []).filter((r: { id: string }) => r.id !== sub) });
    }

    if (action === 'claim') {
      const referrer = isId(body.referrer_id) ? String(body.referrer_id) : null;
      const text = String(body.text ?? '').trim().slice(0, 120);
      if (!referrer && !text) return json({ error: 'empty' }, 400);
      const { data, error } = await db.rpc('ve_referrer_claim', { p_member: sub, p_referrer: referrer, p_text: text || null });
      if (error) return json({ error: 'claim_failed' }, 500);
      if (data?.error) return json({ error: data.error }, 409);
      const { data: me } = await db.from('members').select('referred_by').eq('id', sub).maybeSingle();
      let credited: string | null = null;
      if (me?.referred_by) { const { data: r } = await db.from('members').select('name').eq('id', me.referred_by).maybeSingle(); credited = label(r?.name ?? null); }
      return json({ ok: true, status: data.status, credited });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: 'server', detail: String((e as Error)?.message ?? e).slice(0, 200) }, 500);
  }
});
