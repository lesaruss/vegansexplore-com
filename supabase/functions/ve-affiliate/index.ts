// ve-affiliate (Sean, 2026-10-28: "I want the levels to be part of the affiliate structure... a page that explains how points and
// levels work that is in their dashboard... for people who aren't motivated by money... route their commissions to a nonprofit of
// their choosing... we would help facilitate that on the back end. So they get the credit for the donation.")
// Migration 20261028_affiliate_levels.sql: the ladder (ve_affiliate_levels), the commissions (ve_affiliate_commissions, written by
// ve_affiliate_earn from ve-stripe-webhook's Passport and ve_guide_purchase_paid), where they go (members.affiliate_route).
//   POST { action: 'me' }                                  the member's level, the ladder, their link, earnings and where they go
//   POST { action: 'route', route: 'self'|'nonprofit', listing_id? }   keep them, or give them to a nonprofit, rescue or sanctuary
//   POST { action: 'orgs', q }                             Directory organizations to give to
// Super admins (Depot > People > Ambassadors > Commissions):
//   POST { action: 'admin_list', status? }                 every commission with who earned it and where it goes
//   POST { action: 'admin_settle', id, status: 'paid'|'given'|'reversed', note? }
//   POST { action: 'admin_launch', live: boolean }         show the program to members (ve_site_settings affiliate_program.live)
// A Nonprofit Partner's commissions (Sean, 2026-10-29) are rows here too, with partner_id and route 'partner': paid to the organization.
// verify_jwt is off; the member token is checked here, like ve-invites.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const ORG_CATS = ['Nonprofits', 'Rescues', 'Sanctuaries'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clip = (v: unknown, n: number) => { const s = String(v ?? '').trim(); return s ? s.slice(0, n) : null; };
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await verifyToken(bearer(req));
    if (!sub) return json({ error: 'not_authenticated' }, 401);
    const { data: me } = await db.from('members').select('id, membership_status, is_superadmin').eq('id', sub).maybeSingle();
    if (!me) return json({ error: 'not_authenticated' }, 401);
    const admin = !!me.is_superadmin;

    if (action === 'me') {
      const { data, error } = await db.rpc('ve_affiliate_me', { p_member: me.id });
      if (error || !data) { console.error('me:', error); return json({ error: 'load_failed' }, 500); }
      const live = !!data.program?.live;
      return json({ ok: true, live, can_see: live || admin, member: me.membership_status === 'active', ...data,
        link: data.referral_code ? `${SITE}/r/${data.referral_code}` : null });
    }

    if (action === 'route') {
      if (me.membership_status !== 'active') return json({ error: 'members_only' }, 403);
      if (body.route === 'self') {
        await db.from('members').update({ affiliate_route: 'self', updated_at: new Date().toISOString() }).eq('id', me.id);
        return json({ ok: true, route: 'self' });
      }
      if (body.route !== 'nonprofit' || !isId(body.listing_id)) return json({ error: 'bad_route', message: 'Pick an organization.' }, 400);
      const { data: org } = await db.from('listings').select('id, name, slug, category, status').eq('id', body.listing_id).maybeSingle();
      if (!org || org.status !== 'approved' || !ORG_CATS.includes(org.category)) return json({ error: 'not_an_org', message: 'Pick a nonprofit, rescue or sanctuary from the Directory.' }, 400);
      await db.from('members').update({ affiliate_route: 'nonprofit', affiliate_listing_id: org.id, updated_at: new Date().toISOString() }).eq('id', me.id);
      // Earnings still on hold or ready follow the new choice; what was paid or given stays as it was.
      await db.from('ve_affiliate_commissions').update({ route: 'nonprofit', route_listing_id: org.id }).eq('affiliate_id', me.id).in('status', ['pending', 'ready']);
      return json({ ok: true, route: 'nonprofit', listing: { id: org.id, name: org.name, slug: org.slug, category: org.category } });
    }

    if (action === 'orgs') {
      const q = clip(body.q, 60);
      let r = db.from('listings').select('id, name, slug, category, city, state, logo_url').eq('status', 'approved').in('category', ORG_CATS)
        .order('voter_count', { ascending: false, nullsFirst: false }).order('name').limit(20);
      if (q) r = r.ilike('name', `%${q.replace(/[%_\\]/g, '\\$&')}%`);
      const { data } = await r;
      return json({ ok: true, orgs: data ?? [] });
    }

    if (!admin) return json({ error: 'forbidden' }, 403);

    if (action === 'admin_list') {
      let r = db.from('ve_affiliate_commissions').select('*').order('created_at', { ascending: false }).limit(500);
      if (['pending', 'ready', 'paid', 'given', 'reversed'].includes(body.status)) r = r.eq('status', body.status);
      const { data: rows } = await r;
      const ids = [...new Set((rows ?? []).flatMap((c: any) => [c.affiliate_id, c.buyer_id]).filter(Boolean))];
      const orgIds = [...new Set((rows ?? []).map((c: any) => c.route_listing_id).filter(Boolean))];
      const [{ data: people }, { data: orgs }, { data: setting }] = await Promise.all([
        ids.length ? db.from('members').select('id, name, email').in('id', ids) : Promise.resolve({ data: [] }),
        orgIds.length ? db.from('listings').select('id, name, slug').in('id', orgIds) : Promise.resolve({ data: [] }),
        db.from('ve_site_settings').select('value').eq('key', 'affiliate_program').maybeSingle(),
      ]);
      const P = new Map((people ?? []).map((p: any) => [p.id, p])), O = new Map((orgs ?? []).map((o: any) => [o.id, o]));
      return json({ ok: true, program: setting?.value ?? null, commissions: (rows ?? []).map((c: any) => ({
        ...c, affiliate: P.get(c.affiliate_id) ?? null, buyer: P.get(c.buyer_id) ?? null, org: c.route_listing_id ? O.get(c.route_listing_id) ?? null : null,
      })) });
    }

    if (action === 'admin_settle') {
      if (!isId(body.id) || !['paid', 'given', 'reversed'].includes(body.status)) return json({ error: 'bad_request' }, 400);
      const { data: c } = await db.from('ve_affiliate_commissions').select('id, status, route').eq('id', body.id).maybeSingle();
      if (!c) return json({ error: 'not_found' }, 404);
      if (['paid', 'given', 'reversed'].includes(c.status)) return json({ error: 'settled', message: 'This one is already settled.' }, 409);
      if (body.status === 'given' && c.route !== 'nonprofit') return json({ error: 'bad_request', message: 'This one is theirs to keep.' }, 400);
      if (body.status === 'paid' && c.route === 'nonprofit') return json({ error: 'bad_request', message: 'This one goes to their organization.' }, 400);
      await db.from('ve_affiliate_commissions').update({ status: body.status, settled_at: new Date().toISOString(), note: clip(body.note, 300) }).eq('id', c.id);
      return json({ ok: true });
    }

    if (action === 'admin_launch') {
      const { data: s } = await db.from('ve_site_settings').select('value').eq('key', 'affiliate_program').maybeSingle();
      const value = { ...(s?.value ?? {}), live: !!body.live };
      await db.from('ve_site_settings').update({ value, updated_at: new Date().toISOString(), updated_by: me.id }).eq('key', 'affiliate_program');
      return json({ ok: true, program: value });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-affiliate:', e);
    return json({ error: 'server_error' }, 500);
  }
});
