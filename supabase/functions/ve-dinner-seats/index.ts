import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-dinner-seats: the city dinners (Sean, 2026-10-04, version 3 after BOSS and a PANEL).
// The seat is a gift, held by name. Each guest is on ve_dinner_invites with a personal code;
// their link (?i=<code>) holds the seat with a yes and one answer in advance. No checkout and no
// plus-ones; the $11 Founding Membership is offered at the table. People who were not invited can
// ask for a seat and Sean decides. Restaurants that want to host leave a lead from /dinners/host.
//
// Public:  status { dinner, code? }        open, closed, venue, my invite, who else said yes
//          hold { dinner, code, answer }   Bearer <ve_token>: yes; mirrors a Seat ticket onto /dashboard/leads.
//                                          Holding a seat needs a free account (record 97a1bcbe); when the
//                                          guest's membership is on us, holding the seat claims it.
//          decline { dinner, code, suggestion? }
//          request { dinner, note? }        Bearer <ve_token>: asking for a seat needs a free account
//                                          (Sean, 2026-10-04), so the name and email are the account's.
//                                          Sean approves it in Depot > Dinner guests (Invite them).
//          host_interest { name, business, email, phone?, city?, note? }
// Admin (superadmin token, Depot > Dinner guests):
//          admin_dinners, admin_get { dinner }, admin_dinner { dinner, ...fields },
//          admin_invite_save { dinner, id?, comp?, ...fields }, admin_invite_delete { id },
//          admin_cost_save { dinner, id?, label, amount_cents, status, note? }, admin_cost_delete { id }
//
// A guest's free membership (Sean, 2026-10-04) is a universe invite (universe_invites) tied to their
// guest row; Sean sets it per guest here or when he invites them from HQ > People.
//
// Auth for admin is the custom HMAC token minted by ve-auth (same check as ve-entry-checkout),
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
const clip = (v: unknown, n: number) => { const s = String(v ?? '').trim(); return s ? s.slice(0, n) : null; };
const emailOk = (e: string | null) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

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
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
async function viewer(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '');
  const auth = token ? await verifyToken(token) : null;
  if (!auth) return null;
  const { data } = await db.from('members').select('id, tenant_id').eq('id', auth.sub).maybeSingle();
  return data && data.tenant_id === VE_TENANT_ID ? data.id : null;
}
const COMP_REASON = 'In recognition of your work and your contributions to the community.';
// The guest's free membership, if Sean set one: the universe invite tied to their guest row.
async function compFor(inviteId: string) {
  const { data } = await db.from('universe_invites').select('id, comp, status').eq('dinner_invite_id', inviteId).neq('status', 'canceled').order('created_at', { ascending: false }).limit(1);
  return data?.[0] ?? null;
}
async function isSuperadmin(req: Request): Promise<boolean> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '');
  const auth = token ? await verifyToken(token) : null;
  if (!auth) return false;
  const { data } = await db.from('members').select('is_superadmin').eq('id', auth.sub).maybeSingle();
  return !!data?.is_superadmin;
}

// Today in Florida, as YYYY-MM-DD, for the RSVP close date.
const todayET = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || '';

async function getDinner(slug: string) {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const { data } = await db.from('ve_dinners').select('*').eq('slug', slug).maybeSingle();
  return data;
}
async function getInvite(slug: string, code: string) {
  if (!/^[a-z0-9]{6,40}$/i.test(code)) return null;
  const { data } = await db.from('ve_dinner_invites').select('*').eq('dinner_slug', slug).eq('code', code).maybeSingle();
  return data;
}
// The seat also shows on /dashboard/leads as a ticket for this dinner (by email).
async function mirrorLead(slug: string, inv: { name: string; email: string | null }, status: 'confirmed' | 'declined', memberId: string | null = null) {
  if (!inv.email) return;
  const initiative = 'dinner-' + slug, email = inv.email.toLowerCase();
  const { data } = await db.from('ve_initiative_interest').select('id').eq('initiative_slug', initiative).eq('action_type', 'ticket').ilike('email', email).maybeSingle();
  if (data) { await db.from('ve_initiative_interest').update(memberId ? { status, member_id: memberId } : { status }).eq('id', data.id); return; }
  if (status === 'declined') return;
  await db.from('ve_initiative_interest').insert({ initiative_slug: initiative, action_type: 'ticket', status, email, member_id: memberId, name: inv.name.slice(0, 120), source: 'form', tier_label: 'Seat', tags: ['dinner', 'dinner-seat'] });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    // ---- Restaurants that want to host (no dinner needed) ----
    if (action === 'host_interest') {
      if (body.website) return json({ ok: true }); // honeypot
      const name = clip(body.name, 120), business = clip(body.business, 120), email = clip(body.email, 200)?.toLowerCase() ?? null;
      if (!name || !business || !emailOk(email)) return json({ error: 'missing_fields', message: 'Add your name, your business and an email.' }, 400);
      const note = [business && 'Business: ' + business, clip(body.city, 80) && 'City: ' + clip(body.city, 80), clip(body.phone, 40) && 'Phone: ' + clip(body.phone, 40), clip(body.note, 800)].filter(Boolean).join('\n');
      const { error } = await db.from('ve_initiative_interest').insert({ initiative_slug: 'dinner-host', action_type: 'sponsor_tier', tier_label: 'Host', status: 'new', name, email, note, source: 'form', tags: ['dinner', 'dinner-host'] });
      if (error) { console.error('host_interest:', error); return json({ error: 'save_failed' }, 500); }
      return json({ ok: true });
    }

    // ---- Admin (Depot > Dinner guests) ----
    if (action.startsWith('admin_')) {
      if (!(await isSuperadmin(req))) return json({ error: 'forbidden' }, 403);
      if (action === 'admin_dinners') {
        const { data } = await db.from('ve_dinners').select('*').order('event_date', { ascending: true });
        const { data: inv } = await db.from('ve_dinner_invites').select('dinner_slug, status');
        const counts: Record<string, Record<string, number>> = {};
        (inv ?? []).forEach((r) => { const c = counts[r.dinner_slug] ??= {}; c[r.status] = (c[r.status] ?? 0) + 1; });
        return json({ dinners: (data ?? []).map((d) => ({ ...d, counts: counts[d.slug] ?? {} })) });
      }
      const slug = String(body.dinner ?? '');
      if (action === 'admin_cost_delete') {
        const { error } = await db.from('ve_dinner_costs').delete().eq('id', String(body.id ?? ''));
        return error ? json({ error: 'delete_failed' }, 500) : json({ ok: true });
      }
      if (action === 'admin_invite_delete') {
        const { error } = await db.from('ve_dinner_invites').delete().eq('id', String(body.id ?? ''));
        return error ? json({ error: 'delete_failed' }, 500) : json({ ok: true });
      }
      const dinner = await getDinner(slug);
      if (!dinner) return json({ error: 'dinner_not_found' }, 404);
      if (action === 'admin_get') {
        const { data } = await db.from('ve_dinner_invites').select('*').eq('dinner_slug', slug).order('list').order('rank', { nullsFirst: false }).order('created_at');
        const ids = (data ?? []).map((r) => r.id);
        const { data: ui } = ids.length ? await db.from('universe_invites').select('dinner_invite_id, comp, status, link_code').in('dinner_invite_id', ids).neq('status', 'canceled') : { data: [] };
        const byInvite: Record<string, any> = {};
        (ui ?? []).forEach((u) => { byInvite[u.dinner_invite_id] = u; });
        const { data: costs } = await db.from('ve_dinner_costs').select('*').eq('dinner_slug', slug).order('created_at');
        return json({
          dinner, costs: costs ?? [],
          invites: (data ?? []).map((r) => ({ ...r, comp: !!byInvite[r.id]?.comp, comp_status: byInvite[r.id]?.status ?? null, link_code: byInvite[r.id]?.link_code ?? null })),
        });
      }
      if (action === 'admin_dinner') {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const k of ['venue_name', 'venue_address', 'start_time']) if (k in body) patch[k] = clip(body[k], 200);
        if ('capacity' in body) patch.capacity = body.capacity === '' || body.capacity == null ? null : Math.max(1, Math.round(Number(body.capacity)) || 1);
        if ('seats_open' in body) patch.seats_open = !!body.seats_open;
        if ('rsvp_closes' in body) patch.rsvp_closes = /^\d{4}-\d{2}-\d{2}$/.test(String(body.rsvp_closes)) ? body.rsvp_closes : null;
        if ('budget_cap_cents' in body) patch.budget_cap_cents = Math.max(0, Math.min(10000000, Math.round(Number(body.budget_cap_cents)) || 0));
        const { data, error } = await db.from('ve_dinners').update(patch).eq('slug', slug).select('*').maybeSingle();
        return error ? json({ error: 'save_failed' }, 500) : json({ dinner: data });
      }
      if (action === 'admin_invite_save') {
        const name = clip(body.name, 120);
        if (!name) return json({ error: 'missing_fields', message: 'A name is required.' }, 400);
        const email = clip(body.email, 200)?.toLowerCase() ?? null;
        if (email && !emailOk(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
        const row: Record<string, unknown> = {
          dinner_slug: slug, name, email, phone: clip(body.phone, 40), note: clip(body.note, 1000),
          list: body.list === 'backup' ? 'backup' : 'a',
          rank: body.rank === '' || body.rank == null ? null : Math.round(Number(body.rank)) || null,
          show_name: body.show_name !== false, updated_at: new Date().toISOString(),
        };
        if (['invited', 'yes', 'declined', 'requested', 'not_invited'].includes(body.status)) row.status = body.status;
        const q = body.id ? db.from('ve_dinner_invites').update(row).eq('id', String(body.id)).eq('dinner_slug', slug) : db.from('ve_dinner_invites').insert(row);
        const { data, error } = await q.select('*').maybeSingle();
        if (error) { console.error('invite_save:', error); return json({ error: 'save_failed' }, 500); }
        // The free membership for this guest (on by default for new guests).
        let note: string | null = null;
        if (data && 'comp' in body) {
          const want = body.comp !== false;
          const cur = await compFor(data.id);
          if (cur && cur.status !== 'joined') await db.from('universe_invites').update({ comp: want, name: data.name, updated_at: new Date().toISOString() }).eq('id', cur.id);
          else if (!cur && want) {
            if (!data.email) note = 'Add their email to give them a free membership.';
            else {
              const { error: uErr } = await db.from('universe_invites').insert({
                brand: 'vegans-explore', name: data.name, email: data.email, comp: true, reason: COMP_REASON, points_to: 'dinner',
                dinner_slug: slug, dinner_invite_id: data.id, city_slug: dinner.city_slug, created_by: 'depot',
              });
              if (uErr) note = /duplicate|unique/i.test(uErr.message) ? 'They already have an open invite from HQ > People; their membership follows that one.' : 'The free membership did not save.';
            }
          }
        }
        const c = data ? await compFor(data.id) : null;
        return json({ invite: data ? { ...data, comp: !!c?.comp, comp_status: c?.status ?? null } : data, note });
      }
      if (action === 'admin_cost_save') {
        const label = clip(body.label, 120);
        const amount = Math.round(Number(body.amount_cents));
        if (!label || !Number.isFinite(amount) || amount < 0) return json({ error: 'missing_fields', message: 'Add a name and an amount.' }, 400);
        const row = { dinner_slug: slug, label, amount_cents: Math.min(amount, 10000000), status: body.status === 'paid' ? 'paid' : 'planned', note: clip(body.note, 500), updated_at: new Date().toISOString() };
        const q = body.id ? db.from('ve_dinner_costs').update(row).eq('id', String(body.id)).eq('dinner_slug', slug) : db.from('ve_dinner_costs').insert(row);
        const { data, error } = await q.select('*').maybeSingle();
        return error ? json({ error: 'save_failed' }, 500) : json({ cost: data });
      }
      return json({ error: 'unknown_action' }, 400);
    }

    // ---- Guests ----
    const slug = String(body.dinner ?? '');
    const dinner = await getDinner(slug);
    if (!dinner) return json({ error: 'dinner_not_found' }, 404);
    const closed = !!dinner.rsvp_closes && todayET() > dinner.rsvp_closes;
    const code = String(body.code ?? '');

    if (action === 'status') {
      const inv = code ? await getInvite(slug, code) : null;
      const comp = inv && inv.status !== 'not_invited' ? await compFor(inv.id) : null;
      let guests: string[] | undefined;
      if (inv && inv.status === 'yes') {
        const { data } = await db.from('ve_dinner_invites').select('name').eq('dinner_slug', slug).eq('status', 'yes').eq('show_name', true).order('responded_at');
        guests = (data ?? []).map((r) => r.name);
      }
      return json({
        open: !!dinner.seats_open, closed, rsvp_closes: dinner.rsvp_closes,
        venue_name: dinner.venue_name, start_time: dinner.start_time, venue_address: inv && inv.status === 'yes' ? dinner.venue_address : null,
        invite: inv && inv.status !== 'not_invited' ? { first_name: firstName(inv.name), status: inv.status, answer: inv.answer, comp: !!comp?.comp, comp_claimed: comp?.status === 'joined' } : null,
        guests,
      });
    }

    if (action === 'hold') {
      const inv = await getInvite(slug, code);
      if (!inv || !['invited', 'yes', 'declined'].includes(inv.status)) return json({ error: 'not_invited', message: 'This link is not a seat at this table. If you think it should be, tell us below.' }, 403);
      if (!dinner.seats_open) return json({ error: 'not_open', message: 'Seats open when invitations go out.' }, 409);
      const me = await viewer(req);
      if (!me) return json({ error: 'not_authenticated', message: 'Create your free account to hold your seat.' }, 401);
      if (closed && inv.status !== 'yes') return json({ error: 'closed', message: 'RSVPs for this dinner have closed. Tell us below and you’ll be first for the next one.' }, 409);
      if (dinner.capacity && inv.status !== 'yes') {
        const { count } = await db.from('ve_dinner_invites').select('id', { count: 'exact', head: true }).eq('dinner_slug', slug).eq('status', 'yes');
        if ((count ?? 0) >= dinner.capacity) return json({ error: 'full', message: 'The table is full. You’re first on the list if a seat opens, and for the next dinner.' }, 409);
      }
      const answer = clip(body.answer, 1000);
      const { error } = await db.from('ve_dinner_invites').update({ status: 'yes', answer: answer ?? inv.answer, member_id: me, responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', inv.id);
      if (error) { console.error('hold:', error); return json({ error: 'save_failed' }, 500); }
      await mirrorLead(slug, inv, 'confirmed', me);
      // The membership on us, claimed with the seat. A claim problem never undoes the seat.
      let membership: string | null = null;
      const comp = await compFor(inv.id);
      if (comp) {
        const { data: r, error: cErr } = await db.rpc('universe_invite_claim', { p_invite: comp.id, p_member: me });
        if (cErr) console.error('hold claim:', cErr);
        else if (r === 'joined' || r === 'already') {
          const { data: m } = await db.from('members').select('membership_status').eq('id', me).maybeSingle();
          membership = m?.membership_status ?? null;
        }
      }
      return json({ ok: true, status: 'yes', membership_status: membership });
    }

    if (action === 'decline') {
      const inv = await getInvite(slug, code);
      if (!inv || inv.status === 'not_invited' || inv.status === 'requested') return json({ error: 'not_invited' }, 403);
      const { error } = await db.from('ve_dinner_invites').update({ status: 'declined', suggestion: clip(body.suggestion, 500), responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', inv.id);
      if (error) return json({ error: 'save_failed' }, 500);
      await mirrorLead(slug, inv, 'declined');
      return json({ ok: true, status: 'declined' });
    }

    if (action === 'request') {
      if (body.website) return json({ ok: true }); // honeypot
      const me = await viewer(req);
      if (!me) return json({ error: 'not_authenticated', message: 'Create your free account to ask for a seat.' }, 401);
      const { data: m } = await db.from('members').select('name, email').eq('id', me).maybeSingle();
      const name = clip(m?.name, 120), email = clip(m?.email, 200)?.toLowerCase() ?? null;
      if (!name || !emailOk(email)) return json({ error: 'missing_fields', message: 'Add your name to your account, then ask again.' }, 400);
      const { data: dup } = await db.from('ve_dinner_invites').select('id').eq('dinner_slug', slug).ilike('email', email!).maybeSingle();
      if (dup) return json({ ok: true, already: true });
      const { error } = await db.from('ve_dinner_invites').insert({ dinner_slug: slug, name, email, member_id: me, note: clip(body.note, 1000), status: 'requested', list: 'backup' });
      if (error) { console.error('request:', error); return json({ error: 'save_failed' }, 500); }
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-dinner-seats error:', e);
    return json({ error: 'internal_error' }, 500);
  }
});
