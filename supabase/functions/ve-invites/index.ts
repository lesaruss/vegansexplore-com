import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-invites: universe invites (Sean, 2026-10-04; playbook records 499aaebc and 296409be).
// Sean invites people from HQ > People to a brand. Per person he decides whether the membership is
// on us, "in recognition of their work and contributions to the community". Each invite gets a
// personal tracked link (ve_links, /go/<code>) and can point at a dinner seat or the Community
// Manager role. Invites are made 'ready' (nothing goes out), then emailed from Sean or copied; from
// then they work once, for 30 days. The claim itself is universe_invite_claim() (migration
// 20261004_universe_invites.sql), also run by a members insert trigger when the invited email signs up.
//
// Public
//   POST { action: 'view', code }        the invitation page (/invite?c=<code>); marks it opened
//   POST { action: 'accept', code }      Bearer <ve_token>: claims it for the signed-in member
// Admin: a superadmin ve_token (Depot), or x-invites-key = lesaruss_secrets.INVITES_KEY (HQ server)
//   POST { action: 'create', brand, reason, points_to, dinner_slug?, city_slug?, by?,
//          people: [{ person_id?, name, email, comp }] }   -> { created, skipped }
//   POST { action: 'preview', id }       the email exactly as it will go out
//   POST { action: 'send', ids }         emails each one from Sean (Resend), up to 100 per call
//   POST { action: 'mark_copied', id }   Sean sent the link himself
//   POST { action: 'cancel', id }
//
// verify_jwt is off; tokens are checked here, the way ve-dinner-seats and ve-links check them.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
const FROM = 'Sean A. Russell <hello@vegansexplore.com>';
const REPLY_TO = 'contact@lesaruss.com';
const DAYS = 30;
const BRANDS: Record<string, string> = { 'vegans-explore': 'Vegans Explore' };
const CITIES: Record<string, string> = {
  'atlanta': 'Atlanta', 'central-florida': 'Central Florida', 'dmv': 'the DMV', 'london': 'London',
  'los-angeles': 'Los Angeles', 'new-york': 'New York', 'philadelphia': 'Philadelphia', 'south-florida': 'South Florida',
  'orlando-north-central-florida': 'Orlando and North Central Florida',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-invites-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clip = (v: unknown, n: number) => { const s = String(v ?? '').trim(); return s ? s.slice(0, n) : null; };
const emailOk = (e: string | null) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
// Emails go through ilike for case; escape its wildcards so an underscore matches only itself.
const likeEsc = (s: string) => s.replace(/[%_\\]/g, '\\$&');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

// Who is acting for an admin action: a superadmin member (Depot), or HQ's server with the shared key.
async function adminActor(req: Request): Promise<{ memberId: string | null; label: string } | null> {
  const key = req.headers.get('x-invites-key');
  if (key) {
    const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'INVITES_KEY').maybeSingle();
    if (data?.value && key.length === data.value.length && key === data.value) return { memberId: null, label: 'hq' };
    return null;
  }
  const sub = await verifyToken(bearer(req));
  if (!sub) return null;
  const { data } = await db.from('members').select('id, email, is_superadmin').eq('id', sub).maybeSingle();
  return data?.is_superadmin ? { memberId: data.id, label: data.email } : null;
}
// HQ passes who clicked (their email); the link is credited to their member row when there is one.
async function actorMember(actor: { memberId: string | null }, by: string | null): Promise<string | null> {
  if (actor.memberId) return actor.memberId;
  if (!by) return null;
  const { data } = await db.from('members').select('id').ilike('email', likeEsc(by)).eq('is_superadmin', true).limit(1);
  return data?.[0]?.id ?? null;
}

function randomCode(n: number) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => abc[b % abc.length]).join('');
}
const slugify = (s: string, n: number) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n);

type Invite = Record<string, any>;

async function dinnerOf(slug: string | null) {
  if (!slug) return null;
  const { data } = await db.from('ve_dinners').select('slug, title, event_date, page_path, city_slug, start_time').eq('slug', slug).maybeSingle();
  return data;
}
const dinnerDate = (d: { event_date: string }) => new Date(d.event_date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const dinnerPlace = (d: { title: string }) => (d.title.split(' dinner')[0] || 'our').trim();

// Where the personal link lands.
async function destinationFor(inv: Invite): Promise<string> {
  if (inv.points_to === 'dinner' && inv.dinner_invite_id) {
    const d = await dinnerOf(inv.dinner_slug);
    const { data: di } = await db.from('ve_dinner_invites').select('code').eq('id', inv.dinner_invite_id).maybeSingle();
    if (d && di) return `${d.page_path}?i=${di.code}`;
  }
  return `/invite?c=${inv.code}`;
}
const linkUrl = (inv: Invite) => inv.link_code ? `${SITE}/go/${inv.link_code}` : `${SITE}/invite?c=${inv.code}`;

async function emailFor(inv: Invite) {
  const first = firstName(inv.name);
  const brand = BRANDS[inv.brand] ?? 'Vegans Explore';
  const d = inv.points_to === 'dinner' ? await dinnerOf(inv.dinner_slug) : null;
  const city = inv.city_slug ? CITIES[inv.city_slug] ?? inv.city_slug : null;
  const until = inv.expires_at ? new Date(inv.expires_at) : new Date(Date.now() + DAYS * 86400000);
  const untilText = until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  const subject = d ? `${first}, a seat at our ${dinnerPlace(d)} table`
    : inv.points_to === 'community_manager' ? `${first}, lead ${city ?? 'your city'} with ${brand}`
    : `${first}, an invitation to ${brand}`;
  const paras: string[] = [];
  if (inv.reason) paras.push(inv.reason);
  paras.push(`I'm building ${brand}, a nonprofit community for Vegans, city by city, and I'd like you to be part of it.`);
  if (d) paras.push(`I'd like you at our dinner in ${dinnerPlace(d)} on ${dinnerDate(d)}: a small table, set by name. Your link holds your seat.`);
  if (inv.points_to === 'community_manager') paras.push(`I'd like you to lead our ${city ?? ''} community as its Community Manager. Your link has the details.`.replace('our  ', 'our '));
  if (inv.comp) paras.push(`Your Founding Membership is on us. There's nothing to pay and nothing owed. If you like what we're building, tell people about it.`);
  const cta = d ? 'See your seat' : inv.points_to === 'community_manager' ? 'See the role' : 'Accept your invitation';
  const url = linkUrl(inv);
  const fine = `This invitation is just for you. It works once, until ${untilText}.`;
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;font-size:15px;line-height:1.6">
<p>Hi ${esc(first)},</p>
${paras.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<p style="margin:28px 0"><a href="${esc(url)}" style="display:inline-block;background:#22C55E;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:6px;text-decoration:none">${esc(cta)}</a></p>
<p>Sean A. Russell<br>Founder, ${esc(brand)}</p>
<p style="font-size:12px;color:#777">${esc(fine)}</p>
</div>`;
  const text = [`Hi ${first},`, ...paras, `${cta}: ${url}`, `Sean A. Russell\nFounder, ${brand}`, fine].join('\n\n');
  return { subject, html, text, to: inv.email, from: FROM, link: url };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    // ---- The invitation page ----
    if (action === 'view' || action === 'accept') {
      const code = String(body.code ?? '');
      if (!/^[a-f0-9]{12}$/.test(code)) return json({ error: 'not_found' }, 404);
      const { data: inv } = await db.from('universe_invites').select('*').eq('code', code).maybeSingle();
      if (!inv || inv.status === 'ready') return json({ error: 'not_found' }, 404);
      const expired = inv.status === 'expired' || (inv.status !== 'joined' && inv.expires_at && new Date(inv.expires_at) < new Date());
      const d = inv.points_to === 'dinner' ? await dinnerOf(inv.dinner_slug) : null;
      const out = {
        first_name: firstName(inv.name), brand: inv.brand, brand_name: BRANDS[inv.brand] ?? inv.brand, comp: inv.comp, reason: inv.reason,
        points_to: inv.points_to, city: inv.city_slug ? CITIES[inv.city_slug] ?? null : null,
        dinner: d ? { title: d.title, date: dinnerDate(d), place: dinnerPlace(d), url: await destinationFor(inv) } : null,
        status: inv.status === 'canceled' ? 'canceled' : inv.status === 'joined' ? 'joined' : expired ? 'expired' : 'open',
        expires_at: inv.expires_at,
      };
      if (action === 'view') {
        if (inv.status === 'sent') await db.from('universe_invites').update({ status: 'opened', opened_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', inv.id).eq('status', 'sent');
        return json({ invite: out });
      }
      const me = await verifyToken(bearer(req));
      if (!me) return json({ error: 'not_authenticated', message: 'Create your account or sign in first.' }, 401);
      const { data: member } = await db.from('members').select('id, tenant_id, membership_status').eq('id', me).maybeSingle();
      if (!member || member.tenant_id !== VE_TENANT_ID) return json({ error: 'not_authenticated' }, 401);
      const { data: result, error } = await db.rpc('universe_invite_claim', { p_invite: inv.id, p_member: me });
      if (error) { console.error('accept:', error); return json({ error: 'accept_failed', message: 'That did not go through. Try again in a minute.' }, 500); }
      const messages: Record<string, string> = {
        used: 'This invitation was already accepted on another account.',
        expired: 'This invitation has expired. Reply to Sean’s email and he can send you a new one.',
        canceled: 'This invitation is no longer active.',
      };
      if (messages[result]) return json({ error: result, message: messages[result] }, 409);
      const { data: after } = await db.from('members').select('membership_status').eq('id', me).maybeSingle();
      return json({ ok: true, result, membership_status: after?.membership_status ?? member.membership_status, next: out.dinner?.url ?? (inv.points_to === 'community_manager' ? '/community-managers/onboarding' : '/dashboard') });
    }

    // ---- Admin ----
    const actor = await adminActor(req);
    if (!actor) return json({ error: 'forbidden' }, 403);

    if (action === 'create') {
      const brand = String(body.brand ?? 'vegans-explore');
      if (!BRANDS[brand]) return json({ error: 'bad_brand', message: 'That brand does not have a membership to invite to yet.' }, 400);
      const pointsTo = ['none', 'dinner', 'community_manager'].includes(body.points_to) ? body.points_to : 'none';
      const dinner = pointsTo === 'dinner' ? await dinnerOf(clip(body.dinner_slug, 80)) : null;
      if (pointsTo === 'dinner' && !dinner) return json({ error: 'bad_dinner', message: 'Pick a dinner.' }, 400);
      const city = pointsTo === 'community_manager' ? clip(body.city_slug, 40) : dinner?.city_slug ?? null;
      // Community Manager cities are the partner cities (ve_staff_invites.city_slug references them).
      if (pointsTo === 'community_manager') {
        const { data: pc } = city ? await db.from('ve_partner_cities').select('slug').eq('slug', city).maybeSingle() : { data: null };
        if (!pc) return json({ error: 'bad_city', message: 'Pick a city.' }, 400);
      }
      const reason = clip(body.reason, 600);
      const by = clip(body.by, 200);
      const linkOwner = await actorMember(actor, by);
      const batch = crypto.randomUUID();
      const people = (Array.isArray(body.people) ? body.people : []).slice(0, 300);
      if (!people.length) return json({ error: 'nobody', message: 'Pick at least one person.' }, 400);

      const created: Invite[] = [];
      const skipped: { name: string; email: string | null; why: string }[] = [];
      for (const p of people) {
        const name = clip(p?.name, 120) ?? '';
        const email = clip(p?.email, 200)?.toLowerCase() ?? null;
        const personId = isId(p?.person_id) ? p.person_id : null;
        if (!name || !emailOk(email)) { skipped.push({ name: name || '(no name)', email, why: 'No usable email' }); continue; }
        const [{ data: reg }, { data: sup }, { data: open }] = await Promise.all([
          db.from('members').select('id').ilike('email', likeEsc(email!)).is('merged_into_member_id', null).limit(1),
          db.from('people_suppression').select('email').eq('email', email!).eq('active', true).limit(1),
          db.from('universe_invites').select('id').eq('brand', brand).ilike('email', likeEsc(email!)).in('status', ['ready', 'sent', 'opened']).limit(1),
        ]);
        if (reg?.length) { skipped.push({ name, email, why: 'Already has an account' }); continue; }
        if (sup?.length) { skipped.push({ name, email, why: 'On the do-not-contact list' }); continue; }
        if (open?.length) { skipped.push({ name, email, why: 'Already has an open invite' }); continue; }
        if (personId) {
          const { data: per } = await db.from('people').select('quarantined, archived, email_unsubscribed').eq('id', personId).maybeSingle();
          if (per?.quarantined || per?.archived) { skipped.push({ name, email, why: 'Quarantined or archived' }); continue; }
          if (per?.email_unsubscribed) { skipped.push({ name, email, why: 'Unsubscribed' }); continue; }
        }
        const comp = p?.comp !== false;

        // A dinner seat is a guest on that dinner's list (Depot > Dinner guests).
        let dinnerInviteId: string | null = null;
        if (dinner) {
          const { data: existing } = await db.from('ve_dinner_invites').select('id').eq('dinner_slug', dinner.slug).ilike('email', likeEsc(email!)).maybeSingle();
          if (existing) dinnerInviteId = existing.id;
          else {
            const { data: di, error: dErr } = await db.from('ve_dinner_invites').insert({ dinner_slug: dinner.slug, name, email, list: 'a', status: 'invited' }).select('id').single();
            if (dErr) { console.error('dinner invite:', dErr); skipped.push({ name, email, why: 'Could not add to the dinner list' }); continue; }
            dinnerInviteId = di.id;
          }
        }
        // The Community Manager role keeps using the staff invite (its membership follows this choice).
        if (pointsTo === 'community_manager') {
          const { data: si } = await db.from('ve_staff_invites').select('email').eq('email', email!).maybeSingle();
          if (si) await db.from('ve_staff_invites').update({ city_slug: city, grant_founding_membership: comp }).eq('email', email!);
          else await db.from('ve_staff_invites').insert({
            email, full_name: name, ve_role: 'community_manager', staff_role: 'community_manager', city_slug: city,
            grant_founding_membership: comp, note: 'Invited from HQ > People',
          });
        }

        const { data: inv, error } = await db.from('universe_invites').insert({
          brand, person_id: personId, name, email, comp, reason, points_to: pointsTo, dinner_slug: dinner?.slug ?? null,
          dinner_invite_id: dinnerInviteId, city_slug: city, batch_id: batch, created_by: by ?? actor.label,
        }).select('*').single();
        if (error || !inv) { console.error('invite insert:', error); skipped.push({ name, email, why: 'Could not save' }); continue; }

        // The personal tracked link (Depot > Links), so the click names them.
        const base = `invite-${slugify(firstName(name), 16) || 'guest'}`;
        const initiative = dinner ? `dinner-${dinner.slug}` : pointsTo === 'community_manager' ? 'community-managers' : `invite-${brand}`;
        const dest = await destinationFor(inv);
        let link: { id: string; code: string } | null = null;
        for (let tries = 0; !link && tries < 6; tries++) {
          const { data: l, error: lErr } = await db.from('ve_links').insert({
            code: `${base}-${randomCode(tries < 3 ? 4 : 6)}`, label: `Invite · ${name}`.slice(0, 120), destination: dest,
            initiative_slug: initiative, tags: ['invite', brand, comp ? 'comp' : 'paid'], channel: 'email',
            recipient_email: email, recipient_name: name, batch_id: batch, created_by: linkOwner,
          }).select('id, code').single();
          if (l) link = l; else if (!/duplicate|unique/i.test(lErr?.message ?? '')) break;
        }
        if (link) await db.from('universe_invites').update({ link_id: link.id, link_code: link.code }).eq('id', inv.id);
        created.push({ ...inv, link_id: link?.id ?? null, link_code: link?.code ?? null });
      }
      return json({ ok: true, batch_id: batch, created: created.map((i) => ({ id: i.id, name: i.name, email: i.email, comp: i.comp, link: linkUrl(i) })), skipped });
    }

    if (action === 'preview') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      return json({ email: await emailFor(inv) });
    }

    if (action === 'mark_copied' || action === 'cancel') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      const now = new Date();
      if (action === 'cancel') {
        if (inv.status === 'joined') return json({ error: 'joined', message: 'They already joined.' }, 409);
        await db.from('universe_invites').update({ status: 'canceled', updated_at: now.toISOString() }).eq('id', inv.id);
        if (inv.link_id) await db.from('ve_links').update({ active: false }).eq('id', inv.link_id);
        return json({ ok: true });
      }
      if (inv.status === 'ready') {
        await db.from('universe_invites').update({ status: 'sent', sent_via: 'copied', sent_at: now.toISOString(), expires_at: new Date(now.getTime() + DAYS * 86400000).toISOString(), updated_at: now.toISOString() }).eq('id', inv.id);
      }
      return json({ ok: true, link: linkUrl(inv) });
    }

    if (action === 'send') {
      if (!RESEND_KEY) return json({ error: 'email_off', message: 'Email is not set up for this function.' }, 500);
      const ids = (Array.isArray(body.ids) ? body.ids : []).filter(isId).slice(0, 100);
      if (!ids.length) return json({ error: 'nobody', message: 'Pick at least one invite.' }, 400);
      const { data: rows } = await db.from('universe_invites').select('*').in('id', ids);
      const sent: string[] = [];
      const failed: { id: string; why: string }[] = [];
      for (const inv of rows ?? []) {
        if (!['ready', 'sent', 'opened'].includes(inv.status)) { failed.push({ id: inv.id, why: `Invite is ${inv.status}` }); continue; }
        const now = new Date();
        const expires = inv.expires_at ?? new Date(now.getTime() + DAYS * 86400000).toISOString();
        const mail = await emailFor({ ...inv, expires_at: expires });
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to: inv.email, reply_to: REPLY_TO, subject: mail.subject, html: mail.html, text: mail.text, tags: [{ name: 'kind', value: 'universe_invite' }] }),
        });
        if (!r.ok) { const t = await r.text(); console.error('resend:', r.status, t); failed.push({ id: inv.id, why: 'The email did not send' }); }
        else {
          await db.from('universe_invites').update({
            status: inv.status === 'ready' ? 'sent' : inv.status, sent_via: 'email', sent_at: now.toISOString(), expires_at: expires, updated_at: now.toISOString(),
          }).eq('id', inv.id);
          sent.push(inv.id);
        }
        await sleep(550); // Resend allows about 2 a second
      }
      return json({ ok: true, sent, failed });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-invites error:', e);
    return json({ error: 'internal_error' }, 500);
  }
});
