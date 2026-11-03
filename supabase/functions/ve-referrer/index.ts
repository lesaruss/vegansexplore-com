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


// Abuse watch (Logan 2026-11-03): a suspended or banned member may read but not write. A DB error means not blocked.
async function standingBlocked(db: any, memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const { data } = await db.from('members').select('standing').eq('id', memberId).maybeSingle();
  return !!data?.standing && data.standing !== 'good';
}
const NOT_IN_GOOD_STANDING = { error: 'account_not_in_good_standing', message: 'Your account is on hold. Write to contact@lesaruss.com and we will help.' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await verifyToken(bearer(req));
    if (!sub) return json({ error: 'not_authenticated' }, 401);
    const READ_ACTIONS = new Set(['status', 'search']);
    if (!READ_ACTIONS.has(action) && await standingBlocked(db, sub)) return json(NOT_IN_GOOD_STANDING, 403);

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

    // Depot > Referral claims (super admin): conflict and unresolved claims, reviewed by a person.
    if (['admin_list', 'admin_get', 'admin_find', 'admin_decide'].includes(action)) {
      const { data: adm } = await db.from('members').select('id, is_superadmin').eq('id', sub).maybeSingle();
      if (!adm?.is_superadmin) return json({ error: 'no_access' }, 403);
      const who = async (id: string | null) => {
        if (!id) return null;
        const { data: m } = await db.from('members').select('id, name, email, membership_status, member_class, home_community, created_at, entry_via, founding_member').eq('id', id).maybeSingle();
        return m ? { id: m.id, name: m.name, email: m.email, status: m.membership_status, class: m.member_class, chapter: m.home_community, joined: m.created_at, via: m.entry_via, founding: !!m.founding_member } : null;
      };
      if (action === 'admin_list') {
        const { data: cs, error } = await db.from('ve_referral_claims').select('id, member_id, claimed_text, claimed_member_id, link_member_id, status, created_at, reviewed_at, decision').order('created_at', { ascending: false }).limit(1000);
        if (error) return json({ error: 'load_failed' }, 500);
        const ids = Array.from(new Set((cs ?? []).flatMap((c: any) => [c.member_id, c.claimed_member_id, c.link_member_id]).filter(Boolean)));
        const names: Record<string, string> = {};
        if (ids.length) { const { data: ms } = await db.from('members').select('id, name').in('id', ids); for (const m of ms ?? []) names[m.id] = m.name; }
        return json({ ok: true, rows: (cs ?? []).map((c: any) => ({ ...c, friend: names[c.member_id] ?? null, claimed_name: names[c.claimed_member_id] ?? null, link_name: names[c.link_member_id] ?? null })) });
      }
      if (action === 'admin_find') {
        const q = String(body.q ?? '').trim().replace(/[%,()]/g, ' ').slice(0, 60);
        if (q.length < 2) return json({ ok: true, results: [] });
        const { data } = await db.from('members').select('id, name, email, home_community').eq('membership_status', 'active').in('member_class', ['member', 'internal']).or(`name.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
        return json({ ok: true, results: data ?? [] });
      }
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: c } = await db.from('ve_referral_claims').select('*').eq('id', body.id).maybeSingle();
      if (!c) return json({ error: 'not_found' }, 404);
      if (action === 'admin_get') {
        return json({ ok: true, claim: c, friend: await who(c.member_id), link_sponsor: await who(c.link_member_id), claimed: await who(c.claimed_member_id), decided: await who(c.decided_member_id), reviewer: await who(c.reviewed_by) });
      }
      if (c.member_id === sub) return json({ error: 'not_your_own' }, 400);
      const { data: r, error } = await db.rpc('ve_referral_claim_decide', { p_claim: c.id, p_admin: sub, p_decision: String(body.decision ?? ''), p_member: isId(body.member_id) ? body.member_id : null, p_note: String(body.note ?? '').slice(0, 2000) });
      if (error) return json({ error: 'decide_failed' }, 500);
      if (r?.error) return json({ error: r.error }, 409);
      return json(r);
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: 'server', detail: String((e as Error)?.message ?? e).slice(0, 200) }, 500);
  }
});
