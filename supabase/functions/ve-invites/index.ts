import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

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
//   POST { action: 'create', brand, reason, points_to, dinner_slug?, city_slug?, by?, points?,
//          people: [{ person_id?, name, email, comp, points? }] }   -> { created, skipped }
//     points (Sean, 2026-10-27): what a membership on us brings, 0 to 100,000, granted once when it is claimed
//     (universe_invite_claim). A person's own points win over the batch's. An email whose account never paid
//     (pending_payment) can be invited: they accept by signing in on the invitation page.
//     points_to 'ambassador' (Sean, 2026-10-27): the claim makes them an Ambassador, and accepting opens the Ambassador
//     onboarding (/ambassadors/welcome).
//   POST { action: 'list', status? }    the invitations, newest first (Depot > Invites)
//   POST { action: 'preview', id }       the email exactly as it will go out
//   POST { action: 'send', ids }         emails each one from Sean (Resend), up to 100 per call
//   POST { action: 'mark_copied', id }   Sean sent the link himself
//   POST { action: 'cancel', id }
//   POST { action: 'update', id, reason?, points?, level?, profile?, name? }
//   POST { action: 'sample', profile?, level?, points?, reason? }   a sample Ambassador email, never saved (Preview journeys)   edit an invitation that is not accepted yet (the draft)
// Ambassadors (Sean, 2026-10-28; Depot > People > Ambassadors):
//   POST { action: 'ambassadors' }       every Ambassador with their numbers (ve_ambassadors_overview) and their invitations
//   POST { action: 'ambassador', member_id }   one Ambassador: the numbers, who signed up with their link, visits by day
//   POST { action: 'ambassador_save', member_id, level_override?, add_points?, note?, profile? }   set their level and profile, give points
// An Ambassador invitation's profile (animals | community | creator | fitness, or none for the balanced version) words the email's
// "why you" paragraph (ambassadorWhy) and is copied to members.ambassador_profile at the claim.
// Founding Members (Sean, 2026-10-28; Depot > People > Founding Members): points_to 'founding' asks one hand-picked person to become a
// Founding Member at the normal $11 (comp only when Sean ticks it for that person). Accepting is "Said yes" (status 'accepted'), the
// invitation page goes on to the $11 checkout, and paying makes it 'joined' (trigger trg_ve_founding_invite_paid).
//   POST { action: 'founding' }          every Founding Member invitation, with Read copied in, and the totals
//   POST { action: 'founding_candidates', q?, pool?, limit?, offset? }   people Sean can pick from (ve_founding_candidates)
//   POST { action: 'draft_note', id, context? }   writes the email's personal opening (reason) in Sean's voice from what he knows about
//                                        them (context, saved when given) and their HQ > People record (Sean, 2026-10-28: "you draft the
//                                        message... I can let you know a little bit about that person")
//   POST { action: 'nudge', id }         one short follow-up from Sean, at most 2, 5 days apart; keeps the link open 14 more days
// Nonprofit Partners (LOCKED by Sean 2026-10-29, playbook ve-nonprofit-partners): points_to 'nonprofit' invites one person to bring their
// organization (listing_id, a Nonprofits, Rescues or Sanctuaries listing) in as a Nonprofit Partner. Accepting makes the organization the
// partner (ve_nonprofit_partner_start: its own link, 20%, the invitation's points as the organization's) and comps the lead's Founding
// Membership; the lead's own level and link stay their own. Made from Founding Members (Invite as), which also lists them, and the
// Ambassador invitations made there (pool set).
// Public, added 2026-10-28:
//   POST { action: 'decline', code, note? }    "No thanks" on the invitation page
// An invitation is for its email only: universe_invite_claim refuses any other account ('wrong_email'), so a copied link
// works for that person alone. A level (1 to 4) on an invitation sets members.level_override at the claim. Each email's
// provider id is kept (resend_email_id), so its first open (email_events) shows as Read.
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
const ORG_CATS = ['Nonprofits', 'Rescues', 'Sanctuaries'];
const KINDS = ['none', 'dinner', 'community_manager', 'ambassador', 'founding', 'nonprofit'];
const BRANDS: Record<string, string> = { 'vegans-explore': 'Vegans Explore' };
const CITIES: Record<string, string> = {
  'atlanta': 'Atlanta', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', 'washington-dc': 'Washington, D.C.', 'delaware': 'Delaware', 'maryland': 'Maryland', 'virginia': 'Virginia', 'west-virginia': 'West Virginia', 'london': 'London',
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
const pointsOf = (v: unknown) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(100000, n)) : 0; };
// Emails go through ilike for case; escape its wildcards so an underscore matches only itself.
const likeEsc = (s: string) => s.replace(/[%_\\]/g, '\\$&');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const levelOf = (v: unknown) => { const n = Math.round(Number(v)); return n >= 1 && n <= 4 ? n : null; };
const maskEmail = (e: string) => { const [u, d] = String(e || '').split('@'); return u && d ? `${u.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}` : ''; };

// Read: the first time the email was opened, from the provider's events (email_events), saved on the invitation.
async function refreshOpens(rows: Invite[]) {
  const want = rows.filter((i) => i.resend_email_id && !i.email_opened_at);
  if (!want.length) return;
  const { data } = await db.from('email_events').select('resend_email_id, event_at').eq('event_type', 'email.opened')
    .in('resend_email_id', want.map((i) => i.resend_email_id)).order('event_at', { ascending: true });
  const first = new Map<string, string>();
  for (const e of data ?? []) if (!first.has(e.resend_email_id)) first.set(e.resend_email_id, e.event_at);
  for (const i of want) {
    const at = first.get(i.resend_email_id);
    if (at) { i.email_opened_at = at; await db.from('universe_invites').update({ email_opened_at: at }).eq('id', i.id); }
  }
}

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

// Ambassador profiles (Sean, 2026-10-28): the "why you" paragraph speaks to the kind of person they are. The terms never change.
const PROFILES = ['animals', 'community', 'creator', 'fitness'];
const profileOf = (v: unknown) => (typeof v === 'string' && PROFILES.includes(v) ? v : null);
function ambassadorWhy(inv: Invite, b: (t: string) => string) {
  const earns = (inv.level ?? 1) >= 2 ? 'From day one your link also earns' : 'As you level up, your link also earns';
  const tail = 'Your link sets up your Ambassador account and walks you through it.';
  switch (inv.profile) {
    case 'animals': return `I'd like you to be one of our ${b('first Ambassadors')}: one of the people who bring others in, so more people find and support the rescues, sanctuaries and organizations working for the animals. ${tail}`;
    case 'community': return `I'd like you to be one of our ${b('first Ambassadors')}: one of the people who ${b('grow the community in their city')}, help local Vegan businesses get found and back the nonprofits behind the mission. ${earns} a share of every Passport it brings in, an income that can help fund the things you love. ${tail}`;
    case 'creator': return `I'd like you to be one of our ${b('first Ambassadors')}. Your audience already trusts you: share Vegans Explore your way, with the people who follow your work. ${earns} a share of every Passport it brings in. ${tail}`;
    case 'fitness': return `I'd like you to be one of our ${b('first Ambassadors')}: one of the people who bring the fitness and wellness crowd in, and help Vegan coaches, trainers, gyms and athletes get found. ${tail}`;
    default: return `I'd like you to be one of our ${b('first Ambassadors')}: one of the people who bring others in. ${tail}`;
  }
}

async function orgOf(id: string | null) {
  if (!id) return null;
  const { data } = await db.from('listings').select('id, name, slug, category, logo_url').eq('id', id).maybeSingle();
  return data;
}

async function emailFor(inv: Invite) {
  const first = firstName(inv.name);
  const org = inv.points_to === 'nonprofit' ? await orgOf(inv.listing_id) : null;
  const orgName = org?.name ?? 'your organization';
  const brand = BRANDS[inv.brand] ?? 'Vegans Explore';
  const d = inv.points_to === 'dinner' ? await dinnerOf(inv.dinner_slug) : null;
  const city = inv.city_slug ? CITIES[inv.city_slug] ?? inv.city_slug : null;
  const until = inv.expires_at ? new Date(inv.expires_at) : new Date(Date.now() + DAYS * 86400000);
  const untilText = until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  const subject = d ? `${first}, a seat at our ${dinnerPlace(d)} table`
    : inv.points_to === 'community_manager' ? `${first}, lead ${city ?? 'your city'} with ${brand}`
    : inv.points_to === 'ambassador' ? `${first}, be a ${brand} Ambassador`
    : inv.points_to === 'founding' ? `${first}, be one of our first Founding Members`
    : inv.points_to === 'nonprofit' ? `${first}, bring ${orgName} in as a ${brand} Nonprofit Partner`
    : `${first}, an invitation to ${brand}`;
  // Each paragraph is HTML built from escaped text, with what matters in bold (Sean, 2026-10-28: "Each paragraph should have a space.
  // Bold things that you feel should be bolded"). Spacing is inline on every paragraph, so it holds in every email app and in the
  // Depot's preview, whose page resets margins.
  const b = (t: string) => `<strong>${esc(t)}</strong>`;
  const paras: string[] = [];
  if (inv.reason) for (const p of String(inv.reason).split(/\n\s*\n/)) if (p.trim()) paras.push(esc(p.trim()).replace(/\n/g, '<br>'));
  // A Founding Member invitation says what Vegans Explore is in its own paragraph, after the personal opening.
  if (inv.points_to !== 'founding' && inv.points_to !== 'nonprofit') paras.push(`I'm building ${esc(brand)}, a community for Vegans, city by city, and I'd like you to be part of it.`);
  if (d) paras.push(`I'd like you at ${b(`our dinner in ${dinnerPlace(d)} on ${dinnerDate(d)}`)}: a small table, set by name. Your link holds your seat.`);
  if (inv.points_to === 'community_manager') paras.push(`I'd like you to lead our ${esc(city ?? '')} community as its ${b('Community Manager')}. Your link has the details.`.replace('our  ', 'our '));
  if (inv.points_to === 'ambassador') paras.push(ambassadorWhy(inv, b));
  if (inv.points_to === 'founding') {
    paras.push(`I'm building ${esc(brand)}, a community for Vegans, city by city, and I'm hand-picking the ${b('first Founding Members')}: the people who shape what this becomes before everyone else arrives.${inv.reason ? '' : ' You were one of the first people I thought of.'}`);
    if (!inv.comp) paras.push(`It's ${b('$11, one time')}, with ${b('1,100 points')} to start: vote for the places you love, get the Daily Pulse in your city, check in, and unlock the Guides. Your $11 keeps the community running.`);
  }
  // A Nonprofit Partner invitation (Sean, 2026-10-29): the organization is the partner and earns; the person leads the account and
  // their membership is on us. Referral earnings paid to the organization, never a donation, never tax-deductible.
  if (inv.points_to === 'nonprofit') {
    paras.push(`I'm building ${esc(brand)}, a community for Vegans, city by city, and I'd like ${b(orgName)} to be one of our ${b('first Nonprofit Partners')}.`);
    paras.push(`${esc(orgName)} gets ${b('its own link')} to share with your people. Every time someone joins ${esc(brand)} through it, ${esc(orgName)} earns ${b('20% of the $11 Passport')}, and of Guides bought through it, paid to ${esc(orgName)}. We give you ready-made posts, a button and banner for your website and an email blurb${inv.points > 0 ? `, plus ${b(`${Number(inv.points).toLocaleString('en-US')} points`)} for ${esc(orgName)} to use on our services` : ''}.`);
    paras.push(`You would lead the account, and ${b('your own Founding Membership is on us')}. There's nothing to pay and nothing owed.`);
  }
  if (inv.comp && inv.points_to !== 'nonprofit') paras.push(`${b('Your Founding Membership is on us')}${inv.points > 0 ? `, with ${b(`${Number(inv.points).toLocaleString('en-US')} points`)} to start` : ''}${inv.level > 1 ? `, ${inv.points > 0 ? 'at' : 'starting at'} ${b(`Level ${inv.level}`)}` : ''}. There's nothing to pay and nothing owed. If you like what we're building, tell people about it.`);
  const cta = d ? 'See your seat' : inv.points_to === 'community_manager' ? 'See the role' : inv.points_to === 'ambassador' ? 'Accept and get started' : inv.points_to === 'founding' ? 'Become a Founding Member' : inv.points_to === 'nonprofit' ? 'See the partnership' : 'Accept your invitation';
  const url = linkUrl(inv);
  const fine = `This invitation is just for you, at ${inv.email}. It works once, until ${untilText}.`;
  const P = 'margin:0 0 18px;font-size:15px;line-height:1.65;color:#1a1a1a';
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;margin:0 auto;padding:8px 0;color:#1a1a1a;font-size:15px;line-height:1.65">
<p style="${P};margin:0 0 22px">Hi ${esc(first)},</p>
${paras.map((x) => `<p style="${P}">${x}</p>`).join('\n')}
<p style="margin:30px 0"><a href="${esc(url)}" style="display:inline-block;background:#22C55E;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:6px;text-decoration:none">${esc(cta)}</a></p>
<p style="${P}">Sean A. Russell<br>Founder, ${esc(brand)}</p>
<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#777">${esc(fine)}</p>
</div>`;
  const plain = (x: string) => x.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const text = [`Hi ${first},`, ...paras.map(plain), `${cta}: ${url}`, `Sean A. Russell\nFounder, ${brand}`, fine].join('\n\n');
  return { subject, html, text, to: inv.email, from: FROM, link: url };
}

// A follow-up (Sean, 2026-10-28: "watch if they click it, if they don't..."): short, personal, and worded for where they stopped.
async function nudgeFor(inv: Invite) {
  const first = firstName(inv.name);
  const url = linkUrl(inv);
  const org = inv.points_to === 'nonprofit' ? await orgOf(inv.listing_id) : null;
  const about = inv.points_to === 'nonprofit' ? `${org?.name ?? 'your organization'} being one of our first Nonprofit Partners`
    : inv.points_to === 'ambassador' ? 'being one of our first Ambassadors' : 'being one of our first Founding Members';
  const said = inv.status === 'accepted'
    ? `You said yes to being one of our first Founding Members, thank you. The last step is the $11, and your spot is still held for you.`
    : inv.status === 'opened' || inv.email_opened_at
      ? `I wanted to follow up on my note about ${about}. No pressure at all: your spot is held a little longer if you'd like it.`
      : `I sent you a note last week about ${about}, and I didn't want it to get lost in your inbox.`;
  const subject = inv.points_to === 'nonprofit' ? `Re: ${first}, bring ${org?.name ?? 'your organization'} in as a Vegans Explore Nonprofit Partner`
    : inv.points_to === 'ambassador' ? `Re: ${first}, be a Vegans Explore Ambassador` : `Re: ${first}, be one of our first Founding Members`;
  const until = new Date(Math.max(Date.parse(inv.expires_at ?? '') || 0, Date.now() + 14 * 86400000));
  const untilText = until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  const cta = inv.status === 'accepted' ? 'Finish joining' : 'See your invitation';
  const P = 'margin:0 0 18px;font-size:15px;line-height:1.65;color:#1a1a1a';
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;margin:0 auto;padding:8px 0;color:#1a1a1a;font-size:15px;line-height:1.65">
<p style="${P};margin:0 0 22px">Hi ${esc(first)},</p>
<p style="${P}">${esc(said)}</p>
<p style="${P}">If now isn't the right time, just reply and tell me. I'd rather hear it than guess.</p>
<p style="margin:30px 0"><a href="${esc(url)}" style="display:inline-block;background:#22C55E;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:6px;text-decoration:none">${esc(cta)}</a></p>
<p style="${P}">Sean A. Russell<br>Founder, Vegans Explore</p>
<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#777">This invitation is just for you, at ${esc(inv.email)}. It's open until ${esc(untilText)}.</p>
</div>`;
  const text = [`Hi ${first},`, said, `If now isn't the right time, just reply and tell me. I'd rather hear it than guess.`, `${cta}: ${url}`, `Sean A. Russell\nFounder, Vegans Explore`, `This invitation is just for you, at ${inv.email}. It's open until ${untilText}.`].join('\n\n');
  return { subject, html, text, to: inv.email, from: FROM, expires_at: until.toISOString() };
}
const NUDGE_MAX = 2, NUDGE_GAP_DAYS = 5;

// The personal opening, written from what Sean told us about the person and what HQ > People already holds. Sean's notes come first;
// nothing is invented. The email adds "Hi <first>," before it and the Founding Member paragraphs after it.
const MODEL = 'claude-opus-5-5';
const OPENING_SYSTEM = `You write the personal opening of an invitation email from Sean A. Russell, founder of Vegans Explore, a community for Vegans, city by city. Sean is hand-picking one person; the sources say what to (invitation): to be one of the first Founding Members, one of the first Ambassadors, or to bring their organization in as one of the first Nonprofit Partners. For a Nonprofit Partner, the opening may speak to the organization's work as well as the person, from the sources only.

Write in Sean's voice, first person, speaking to them as "you": warm, plain and specific, the way a friend writes, never salesy.
- 2 to 4 short sentences, under 550 characters. It opens the email right after "Hi <first name>,", so no greeting and no sign-off.
- Say how Sean knows them and why they would make a strong member of this community, using only what the sources say. Sean's own notes come first and win over anything else; the HQ summary is background an assistant wrote from Sean's emails, useful for how they know each other.
- Never invent a fact, a date, a place, a feeling or a compliment the sources do not state. Do not add superlatives ("favorite", "so many", "never once") or claims about their impact that the sources do not make. Saying something plainly and true beats saying it beautifully. Never describe Sean's feelings, memories or favorites ("my best memories", "I loved") unless his notes say them; the only opinion you add is the last sentence's reason they belong. If the sources are thin, write one or two simple, true sentences.
- Do not describe Vegans Explore or mention the price, points, earnings, links, the Founding Membership, the partnership's terms, "city by city" or "the first members": the email says all of that next. End on the person, why they belong, not on the invitation.
- Never repeat anything private, sensitive or negative from the summary (money, health, conflicts, personal trouble).
- No dashes of any kind, no exclamation marks, no emojis. Write Vegan with a capital V.`;
const OPENING_SCHEMA = { type: 'object', additionalProperties: false, required: ['opening', 'note'], properties: {
  opening: { type: 'string', description: 'The opening, 2 to 4 sentences.' },
  note: { type: 'string', description: 'One short line for Sean: what you used, and anything you left out or were unsure of.' },
} };
async function draftOpening(inv: Invite): Promise<{ opening?: string; note?: string; error?: string }> {
  const { data: k } = await db.from('lesaruss_secrets').select('value').eq('key', 'ANTHROPIC_API_KEY').maybeSingle();
  const key = k?.value && k.value !== 'pending' ? String(k.value) : null;
  let person: any = null;
  if (inv.person_id) ({ data: person } = await db.from('people').select('first_name, last_name, organization, title, city, region, relationship_summary, last_interaction_at, email_message_count, source').eq('id', inv.person_id).maybeSingle());
  if (!person) ({ data: person } = await db.from('people').select('first_name, last_name, organization, title, city, region, relationship_summary, last_interaction_at, email_message_count, source').ilike('email', likeEsc(inv.email)).is('merged_into', null).limit(1).maybeSingle());
  const org = inv.points_to === 'nonprofit' ? await orgOf(inv.listing_id) : null;
  const sources = {
    name: inv.name,
    invitation: inv.points_to === 'nonprofit' ? 'Nonprofit Partner' : inv.points_to === 'ambassador' ? 'Ambassador' : 'Founding Member',
    organization: org ? { name: org.name, kind: org.category } : undefined,
    seans_notes: String(inv.context || '').trim() || null,
    hq: person ? { organization: person.organization, title: person.title, city: person.city || person.region, summary: person.relationship_summary,
      emails_with_sean: person.email_message_count, last_contact: person.last_interaction_at ? String(person.last_interaction_at).slice(0, 10) : null } : null,
  };
  if (!sources.seans_notes && !sources.hq?.summary) return { error: 'nothing_to_go_on' };
  try {
    const client = new Anthropic(key ? { apiKey: key } : {});
    const msg: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 800, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: OPENING_SCHEMA } },
      system: OPENING_SYSTEM,
      messages: [{ role: 'user', content: 'The sources, as JSON:\n' + JSON.stringify(sources) }],
    } as any);
    if (msg.stop_reason === 'refusal') return { error: 'refused' };
    const out = JSON.parse((msg.content || []).find((c: any) => c.type === 'text')?.text || '{}');
    const opening = String(out.opening || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/!/g, '.').replace(/\bvegan\b/g, 'Vegan').replace(/[ \t]+/g, ' ').trim().slice(0, 900);
    return opening ? { opening, note: String(out.note || '').slice(0, 300) } : { error: 'empty' };
  } catch (e) {
    console.error('draft_note:', e);
    return { error: 'writer_failed' };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    // ---- The invitation page ----
    if (action === 'decline') {
      const code = String(body.code ?? '');
      if (!/^[a-f0-9]{12}$/.test(code)) return json({ error: 'not_found' }, 404);
      const { data: inv } = await db.from('universe_invites').select('id, status, link_id').eq('code', code).maybeSingle();
      if (!inv || !['sent', 'opened', 'accepted'].includes(inv.status)) return json({ error: 'not_open', message: 'This invitation is no longer open.' }, 409);
      const now = new Date().toISOString();
      await db.from('universe_invites').update({ status: 'declined', declined_at: now, decline_note: clip(body.note, 500), updated_at: now }).eq('id', inv.id);
      if (inv.link_id) await db.from('ve_links').update({ active: false }).eq('id', inv.link_id);
      return json({ ok: true });
    }

    if (action === 'view' || action === 'accept') {
      const code = String(body.code ?? '');
      if (!/^[a-f0-9]{12}$/.test(code)) return json({ error: 'not_found' }, 404);
      const { data: inv } = await db.from('universe_invites').select('*').eq('code', code).maybeSingle();
      if (!inv || inv.status === 'ready') return json({ error: 'not_found' }, 404);
      const expired = inv.status === 'expired' || (!['joined', 'accepted'].includes(inv.status) && inv.expires_at && new Date(inv.expires_at) < new Date());
      const d = inv.points_to === 'dinner' ? await dinnerOf(inv.dinner_slug) : null;
      const out = {
        first_name: firstName(inv.name), brand: inv.brand, brand_name: BRANDS[inv.brand] ?? inv.brand, comp: inv.comp, points: inv.comp ? inv.points : 0, reason: inv.reason,
        points_to: inv.points_to, city: inv.city_slug ? CITIES[inv.city_slug] ?? null : null,
        dinner: d ? { title: d.title, date: dinnerDate(d), place: dinnerPlace(d), url: await destinationFor(inv) } : null,
        status: inv.status === 'canceled' ? 'canceled' : inv.status === 'joined' ? 'joined' : inv.status === 'declined' ? 'declined' : inv.status === 'accepted' ? 'accepted' : expired ? 'expired' : 'open',
        expires_at: inv.expires_at, level: inv.level ?? null, profile: inv.profile ?? null, email_hint: maskEmail(inv.email),
        org: inv.points_to === 'nonprofit' ? await orgOf(inv.listing_id) : null,
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
        declined: 'This invitation was turned down. Reply to Sean’s email if you changed your mind.',
        wrong_email: `This invitation is for ${maskEmail(inv.email)}. Sign in or create your account with that email to accept it.`,
      };
      if (messages[result]) return json({ error: result, message: messages[result] }, 409);
      const { data: after } = await db.from('members').select('membership_status').eq('id', me).maybeSingle();
      return json({ ok: true, result, pay: result === 'accepted', membership_status: after?.membership_status ?? member.membership_status, next: out.dinner?.url ?? (inv.points_to === 'community_manager' ? '/community-managers/onboarding' : inv.points_to === 'ambassador' ? '/ambassadors/welcome' : inv.points_to === 'nonprofit' ? '/nonprofits/welcome' : '/dashboard') });
    }

    // ---- Admin ----
    const actor = await adminActor(req);
    if (!actor) return json({ error: 'forbidden' }, 403);

    if (action === 'create') {
      const brand = String(body.brand ?? 'vegans-explore');
      if (!BRANDS[brand]) return json({ error: 'bad_brand', message: 'That brand does not have a membership to invite to yet.' }, 400);
      const pointsTo = KINDS.includes(body.points_to) ? body.points_to : 'none';
      const dinner = pointsTo === 'dinner' ? await dinnerOf(clip(body.dinner_slug, 80)) : null;
      if (pointsTo === 'dinner' && !dinner) return json({ error: 'bad_dinner', message: 'Pick a dinner.' }, 400);
      const city = pointsTo === 'community_manager' ? clip(body.city_slug, 40) : dinner?.city_slug ?? null;
      // Community Manager cities are the partner cities (ve_staff_invites.city_slug references them).
      if (pointsTo === 'community_manager') {
        const { data: pc } = city ? await db.from('ve_partner_cities').select('slug').eq('slug', city).maybeSingle() : { data: null };
        if (!pc) return json({ error: 'bad_city', message: 'Pick a city.' }, 400);
      }
      const reason = clip(body.reason, 2000);
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
          db.from('members').select('id, membership_status, ve_role').ilike('email', likeEsc(email!)).is('merged_into_member_id', null).limit(1),
          db.from('people_suppression').select('email').eq('email', email!).eq('active', true).limit(1),
          db.from('universe_invites').select('id').eq('brand', brand).ilike('email', likeEsc(email!)).in('status', ['ready', 'sent', 'opened']).limit(1),
        ]);
        // An account that never paid is not a member (registration is the Passport); it can still be invited.
        // A member can still be asked to be an Ambassador (Sean, 2026-10-28: Depot > Ambassadors); never one who already is.
        if (reg?.length && reg[0].ve_role === 'ambassador') { skipped.push({ name, email, why: 'Already an Ambassador' }); continue; }
        if (reg?.length && reg[0].membership_status !== 'pending_payment' && pointsTo !== 'ambassador' && pointsTo !== 'nonprofit') { skipped.push({ name, email, why: 'Already a member' }); continue; }
        if (sup?.length) { skipped.push({ name, email, why: 'On the do-not-contact list' }); continue; }
        if (open?.length) { skipped.push({ name, email, why: 'Already has an open invite' }); continue; }
        if (personId) {
          const { data: per } = await db.from('people').select('quarantined, archived, email_unsubscribed').eq('id', personId).maybeSingle();
          if (per?.quarantined || per?.archived) { skipped.push({ name, email, why: 'Quarantined or archived' }); continue; }
          if (per?.email_unsubscribed) { skipped.push({ name, email, why: 'Unsubscribed' }); continue; }
        }
        // A Nonprofit Partner invitation names the organization: a nonprofit, rescue or sanctuary in the Directory, not a partner yet.
        let listingId: string | null = null;
        if (pointsTo === 'nonprofit') {
          const lid = isId(p?.listing_id) ? p.listing_id : isId(body.listing_id) ? body.listing_id : null;
          const org = lid ? await orgOf(lid) : null;
          if (!org || !ORG_CATS.includes(org.category)) { skipped.push({ name, email, why: 'Pick their organization (a nonprofit, rescue or sanctuary)' }); continue; }
          const { data: np } = await db.from('ve_nonprofit_partners').select('id, status').eq('listing_id', org.id).maybeSingle();
          if (np && np.status === 'active') { skipped.push({ name, email, why: `${org.name} is already a Nonprofit Partner` }); continue; }
          listingId = org.id;
        }
        // A Founding Member invitation is the $11 unless Sean makes this one person's on us (Sean, 2026-10-28). A Nonprofit Partner's
        // lead is always on us (Sean, 2026-10-29), and its points are the organization's.
        const comp = pointsTo === 'nonprofit' ? true : pointsTo === 'founding' ? p?.comp === true : p?.comp !== false;
        const points = comp ? pointsOf(p?.points ?? body.points) : 0;
        const level = levelOf(p?.level ?? body.level);
        const profile = pointsTo === 'ambassador' ? profileOf(p?.profile ?? body.profile) : null;

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
          brand, person_id: personId, name, email, comp, points, reason, points_to: pointsTo, dinner_slug: dinner?.slug ?? null,
          dinner_invite_id: dinnerInviteId, city_slug: city, batch_id: batch, created_by: by ?? actor.label, level, profile, pool: clip(p?.pool, 40),
          context: clip(p?.context, 2000), listing_id: listingId,
        }).select('*').single();
        if (error || !inv) { console.error('invite insert:', error); skipped.push({ name, email, why: 'Could not save' }); continue; }

        // The personal tracked link (Depot > Links), so the click names them.
        const base = `invite-${slugify(firstName(name), 16) || 'guest'}`;
        const initiative = dinner ? `dinner-${dinner.slug}` : pointsTo === 'community_manager' ? 'community-managers' : pointsTo === 'ambassador' ? 'ambassadors' : pointsTo === 'founding' ? 'founding-members' : pointsTo === 'nonprofit' ? 'nonprofit-partners' : `invite-${brand}`;
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
      return json({ ok: true, batch_id: batch, created: created.map((i) => ({ id: i.id, name: i.name, email: i.email, comp: i.comp, points: i.points, level: i.level, profile: i.profile, link: linkUrl(i) })), skipped });
    }

    if (action === 'list') {
      let q = db.from('universe_invites').select('id, name, email, comp, points, level, profile, reason, points_to, status, sent_via, sent_at, opened_at, email_opened_at, resend_email_id, joined_at, declined_at, decline_note, claimed_member_id, expires_at, created_at, created_by, link_code, code')
        .eq('brand', 'vegans-explore').order('created_at', { ascending: false }).limit(300);
      if (['ready', 'sent', 'opened', 'accepted', 'joined', 'declined', 'expired', 'canceled'].includes(body.status)) q = q.eq('status', body.status);
      if (KINDS.includes(body.points_to)) q = q.eq('points_to', body.points_to);
      const { data, error } = await q;
      if (error) { console.error('list:', error); return json({ error: 'list_failed' }, 500); }
      await refreshOpens(data ?? []);
      const now = Date.now();
      return json({ ok: true, invites: (data ?? []).map((i) => ({
        ...i, status: ['sent', 'opened'].includes(i.status) && i.expires_at && Date.parse(i.expires_at) < now ? 'expired' : i.status, link: linkUrl(i),
      })) });
    }

    if (action === 'update') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('id, status, comp').eq('id', body.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      if (!['ready', 'sent', 'opened', 'accepted'].includes(inv.status)) return json({ error: 'closed', message: 'This invitation can no longer be changed.' }, 409);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if ('reason' in body) patch.reason = clip(body.reason, 2000);
      if ('context' in body) patch.context = clip(body.context, 2000);
      if ('points' in body && inv.comp) patch.points = pointsOf(body.points);
      if ('level' in body) patch.level = levelOf(body.level);
      if ('profile' in body) patch.profile = profileOf(body.profile);
      if ('name' in body && clip(body.name, 120)) patch.name = clip(body.name, 120);
      const { error } = await db.from('universe_invites').update(patch).eq('id', inv.id);
      if (error) { console.error('update:', error); return json({ error: 'update_failed', message: 'That did not save.' }, 500); }
      return json({ ok: true });
    }

    if (action === 'founding') {
      // Every invitation made here: Founding Members, Nonprofit Partners, and the Ambassadors picked here (pool is set only here).
      const { data, error } = await db.from('universe_invites').select('id, name, email, person_id, comp, points, level, profile, reason, context, pool, points_to, listing_id, status, sent_via, sent_at, opened_at, email_opened_at, resend_email_id, accepted_at, joined_at, declined_at, decline_note, claimed_member_id, expires_at, nudged_at, nudge_count, created_at, link_code, code')
        .eq('brand', 'vegans-explore').or('points_to.eq.founding,points_to.eq.nonprofit,and(points_to.eq.ambassador,pool.not.is.null)').order('created_at', { ascending: false }).limit(500);
      if (error) { console.error('founding:', error); return json({ error: 'list_failed' }, 500); }
      await refreshOpens(data ?? []);
      const orgIds = [...new Set((data ?? []).map((i: any) => i.listing_id).filter(Boolean))];
      const { data: orgs } = orgIds.length ? await db.from('listings').select('id, name, slug').in('id', orgIds) : { data: [] };
      const O = new Map((orgs ?? []).map((o: any) => [o.id, o]));
      for (const i of (data ?? []) as any[]) i.org = O.get(i.listing_id) ?? null;
      const now = Date.now();
      const invites = (data ?? []).map((i) => ({
        ...i, status: ['sent', 'opened'].includes(i.status) && i.expires_at && Date.parse(i.expires_at) < now ? 'expired' : i.status, link: linkUrl(i),
        can_nudge: ['sent', 'opened', 'accepted'].includes(i.status) && i.sent_via === 'email' && (i.nudge_count ?? 0) < NUDGE_MAX
          && now - Date.parse(i.nudged_at ?? i.sent_at ?? new Date().toISOString()) >= NUDGE_GAP_DAYS * 86400000,
      }));
      const totals: Record<string, number> = { invited: 0, read: 0, clicked: 0, said_yes: 0, joined: 0, declined: 0 };
      for (const i of invites) {
        if (i.status === 'ready' || i.status === 'canceled') continue;
        totals.invited++;
        if (i.email_opened_at || i.opened_at || i.accepted_at || i.joined_at) totals.read++;
        if (i.opened_at || i.accepted_at || i.joined_at) totals.clicked++;
        if (i.accepted_at || i.joined_at) totals.said_yes++;
        if (i.status === 'joined') totals.joined++;
        if (i.status === 'declined') totals.declined++;
      }
      return json({ ok: true, invites, totals });
    }

    if (action === 'founding_candidates') {
      const { data, error } = await db.rpc('ve_founding_candidates', { p_q: clip(body.q, 120), p_pool: clip(body.pool, 20), p_limit: Math.min(200, Math.max(1, Number(body.limit) || 50)), p_offset: Math.max(0, Number(body.offset) || 0) });
      if (error) { console.error('candidates:', error); return json({ error: 'list_failed' }, 500); }
      return json({ ok: true, ...(data ?? {}) });
    }

    if (action === 'draft_note') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      if (!['ready', 'sent', 'opened'].includes(inv.status)) return json({ error: 'closed', message: 'This invitation can no longer be changed.' }, 409);
      if ('context' in body) inv.context = clip(body.context, 2000);
      const d = await draftOpening(inv);
      if (d.error) {
        if ('context' in body) await db.from('universe_invites').update({ context: inv.context, updated_at: new Date().toISOString() }).eq('id', inv.id);
        const why: Record<string, string> = { nothing_to_go_on: 'Tell me a little about them first: how you know them, or why they would be a strong member.' };
        return json({ error: d.error, message: why[d.error] || 'The opening did not get written. Try again in a minute.' }, d.error === 'nothing_to_go_on' ? 400 : 502);
      }
      await db.from('universe_invites').update({ reason: d.opening, context: inv.context ?? null, updated_at: new Date().toISOString() }).eq('id', inv.id);
      return json({ ok: true, reason: d.opening, note: d.note });
    }

    if (action === 'nudge') {
      if (!RESEND_KEY) return json({ error: 'email_off', message: 'Email is not set up for this function.' }, 500);
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).maybeSingle();
      if (!inv || !['founding', 'nonprofit', 'ambassador'].includes(inv.points_to)) return json({ error: 'not_found' }, 404);
      if (!['sent', 'opened', 'accepted'].includes(inv.status)) return json({ error: 'closed', message: 'This invitation is not waiting on them.' }, 409);
      if ((inv.nudge_count ?? 0) >= NUDGE_MAX) return json({ error: 'enough', message: `They have had ${NUDGE_MAX} follow-ups already.` }, 409);
      const last = Date.parse(inv.nudged_at ?? inv.sent_at ?? '') || 0;
      if (Date.now() - last < NUDGE_GAP_DAYS * 86400000) return json({ error: 'too_soon', message: `A follow-up can go ${NUDGE_GAP_DAYS} days after the last email.` }, 409);
      const mail = await nudgeFor(inv);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: inv.email, reply_to: REPLY_TO, subject: mail.subject, html: mail.html, text: mail.text, tags: [{ name: 'kind', value: 'universe_invite_nudge' }] }),
      });
      if (!r.ok) { console.error('nudge resend:', r.status, await r.text()); return json({ error: 'send_failed', message: 'The email did not send.' }, 500); }
      const now = new Date().toISOString();
      await db.from('universe_invites').update({ nudged_at: now, nudge_count: (inv.nudge_count ?? 0) + 1, expires_at: mail.expires_at, updated_at: now }).eq('id', inv.id);
      return json({ ok: true, nudge_count: (inv.nudge_count ?? 0) + 1 });
    }

    if (action === 'nudge_preview') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      return json({ ok: true, email: await nudgeFor(inv) });
    }

    if (action === 'ambassadors') {
      const [{ data: list, error }, { data: invites }] = await Promise.all([
        db.rpc('ve_ambassadors_overview'),
        db.from('universe_invites').select('id, name, email, comp, points, level, profile, reason, status, sent_via, sent_at, opened_at, email_opened_at, resend_email_id, joined_at, declined_at, decline_note, claimed_member_id, expires_at, created_at, link_code, code')
          .eq('points_to', 'ambassador').order('created_at', { ascending: false }).limit(300),
      ]);
      if (error) { console.error('ambassadors:', error); return json({ error: 'list_failed' }, 500); }
      await refreshOpens(invites ?? []);
      const now = Date.now();
      return json({ ok: true, ambassadors: list ?? [], invites: (invites ?? []).map((i) => ({
        ...i, status: ['sent', 'opened'].includes(i.status) && i.expires_at && Date.parse(i.expires_at) < now ? 'expired' : i.status, link: linkUrl(i),
      })) });
    }

    if (action === 'ambassador') {
      if (!isId(body.member_id)) return json({ error: 'bad_id' }, 400);
      const { data: list } = await db.rpc('ve_ambassadors_overview');
      const a = (list ?? []).find((x: any) => x.id === body.member_id);
      if (!a) return json({ error: 'not_found' }, 404);
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [{ data: referred }, { data: visits }, { data: ledger }] = await Promise.all([
        db.from('members').select('id, name, email, membership_status, created_at, entry_paid_at, home_community').eq('referred_by', a.id).order('created_at', { ascending: false }).limit(300),
        a.referral_code ? db.from('ve_referral_visits').select('day, visitor').eq('code', a.referral_code).gte('day', since) : Promise.resolve({ data: [] }),
        db.from('points_ledger').select('delta, reason, ref_id, created_at').eq('member_id', a.id).order('created_at', { ascending: false }).limit(25),
      ]);
      const byDay: Record<string, number> = {};
      for (const v of (visits ?? []) as any[]) byDay[v.day] = (byDay[v.day] || 0) + 1;
      return json({ ok: true, ambassador: a, referred: referred ?? [], visits_by_day: byDay, ledger: ledger ?? [], link: a.referral_code ? `${SITE}/r/${a.referral_code}` : null });
    }

    if (action === 'ambassador_save') {
      if (!isId(body.member_id)) return json({ error: 'bad_id' }, 400);
      const { data: m } = await db.from('members').select('id, ve_role').eq('id', body.member_id).maybeSingle();
      if (!m || m.ve_role !== 'ambassador') return json({ error: 'not_found' }, 404);
      const out: Record<string, unknown> = { ok: true };
      if ('profile' in body) {
        await db.from('members').update({ ambassador_profile: profileOf(body.profile), updated_at: new Date().toISOString() }).eq('id', m.id);
        out.profile = profileOf(body.profile);
      }
      if ('level_override' in body) {
        const lv = body.level_override == null || body.level_override === '' ? null : levelOf(body.level_override);
        await db.from('members').update({ level_override: lv && lv > 1 ? lv : null, updated_at: new Date().toISOString() }).eq('id', m.id);
        out.level_override = lv && lv > 1 ? lv : null;
      }
      const add = Math.round(Number(body.add_points) || 0);
      if (add) {
        if (add < 0 || add > 100000) return json({ error: 'bad_points', message: 'Give between 1 and 100,000 points.' }, 400);
        const { data: g, error } = await db.rpc('ve_points_grant', { p_member: m.id, p_amount: add, p_reason: 'admin_adjust', p_ref: `ambassador:${crypto.randomUUID()}${clip(body.note, 80) ? ':' + clip(body.note, 80) : ''}` });
        if (error || g?.error) { console.error('grant:', error ?? g); return json({ error: 'grant_failed', message: 'The points did not go through.' }, 500); }
        out.balance = g?.balance;
      }
      const { data: lv } = await db.rpc('ve_member_level', { p_member: m.id });
      out.level = lv;
      return json(out);
    }

    // A sample Ambassador email for Depot > Preview journeys > Ambassador: built by emailFor from an invitation that is never saved.
    if (action === 'sample') {
      const inv: Invite = { name: 'Jordan Lee', email: 'jordan@example.com', brand: 'vegans-explore', points_to: 'ambassador', comp: true,
        points: pointsOf(body.points ?? 1100), level: levelOf(body.level ?? 2) ?? 2, profile: profileOf(body.profile), code: 'sample', link_code: null,
        reason: clip(body.reason, 2000) ?? 'Jordan, you have been showing up for this community since day one. You are exactly who I had in mind when I built this.',
        expires_at: new Date(Date.now() + DAYS * 86400000).toISOString() };
      return json({ ok: true, email: await emailFor(inv) });
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
          const sentMail = await r.json().catch(() => ({}));
          await db.from('universe_invites').update({
            status: inv.status === 'ready' ? 'sent' : inv.status, sent_via: 'email', sent_at: now.toISOString(), expires_at: expires, updated_at: now.toISOString(),
            resend_email_id: sentMail?.id ?? null, email_opened_at: null,
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
