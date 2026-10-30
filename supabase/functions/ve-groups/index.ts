// ve-groups: Group Partners, the team's side (LOCKED by Sean 2026-10-29, playbook ve-group-partners, canon canon-ve-group-partners;
// migration 20261029_group_partners.sql). Sean, 2026-10-29: "in the depot, just like we had with the ambassador and the other thing,
// there would be a ... groups one, where I could personalize the message, select people, put in their email addresses... do a crawl
// for all these community groups... pull their information and send them messages one by one." Depot > People > Group Partners
// (/admin/depot/group-partners) reads and writes through here; the invitations themselves are ve-invites (points_to 'group').
//
// Super admins (VE token) or ops (Bearer LESARUSS_ADMIN_TOKEN):
//   POST { action: 'list' }                         every Community > Groups listing (live and on hold) with its contact, its latest
//                                                    Group Partner invitation, its partner status and its events (upcoming, past)
//   POST { action: 'get', listing_id }              one group: the listing, contact, every invitation (Read copied in), partner, events
//   POST { action: 'contact_save', listing_id, email?, name? }   the group's contact (listings.details.group), typed in by the team
//   POST { action: 'find_contact', listing_id }     reads the group's own website (home, contact, about) and its Instagram bio (Apify) for
//                                                    an email they publish; saves it with where it was found; never guessed
//   POST { action: 'partner_save', listing_id, status?, notes? }  the partnership's status (invited, onboarding, active, paused, ended)
//   POST { action: 'discover', chapter }            Meetup's group search around the chapter for Vegan groups not on the Directory yet;
//                                                    each becomes a QUARANTINED Groups listing (crawl_source 'group-discover'), never live
//   POST { action: 'discovered' }                   what discover found and is waiting for Sean
//   POST { action: 'applications' } | { action: 'application_get', id } | { action: 'application_save', id, status, note? }   the Group
//                                                    Partner Guide's applications (ve_group_applications); reading or marking one sends nothing
//   POST { action: 'discover_decide', listing_id, decision: 'add'|'aside', note? }   Add to the Directory (live, its Meetup page a
//                                                    crawl source tied to it, its 2026 Meetup events saved) or Set aside (rejected, kept)
// verify_jwt is off; the token is checked here, like ve-nonprofit.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MEETUP = 'https://api.meetup.com/gql-ext';

// Where discover looks: each chapter's centers (Meetup's search takes a point and a radius in miles).
const CENTERS: Record<string, [number, number][]> = {
  'south-florida': [[25.77, -80.19], [26.12, -80.14], [26.71, -80.05]],
  'central-florida': [[28.54, -81.38], [27.95, -82.46]],
  'north-florida': [[30.33, -81.66], [30.44, -84.28], [29.65, -82.32]],
  'atlanta': [[33.75, -84.39]],
  'washington-dc': [[38.9, -77.04]],
  'maryland': [[39.29, -76.61]],
  'virginia': [[37.54, -77.44], [36.85, -76.29], [38.88, -77.1]],
  'delaware': [[39.74, -75.55]],
  'west-virginia': [[38.35, -81.63], [39.63, -79.96]],
  'new-york': [[40.71, -74.0]],
  'philadelphia': [[39.95, -75.16], [40.44, -80.0]],
  'los-angeles': [[34.05, -118.24]],
  'london': [[51.51, -0.13]],
};
const CHAPTER_STATE: Record<string, string | null> = {
  'south-florida': 'FL', 'central-florida': 'FL', 'north-florida': 'FL', 'atlanta': 'GA', 'washington-dc': 'DC', 'maryland': 'MD', 'virginia': 'VA',
  'delaware': 'DE', 'west-virginia': 'WV', 'new-york': 'NY', 'philadelphia': 'PA', 'los-angeles': 'CA', 'london': null,
};
// A Meetup group counts only when it is about Vegan or plant-based living by its own name or description.
const VEG = /\bvegan|plant[- ]?based|\bveg\*?n\b|vegetarian|\bveggie|\bveg\b|\bvegfest|cruelty[- ]free|animal rights/i;
// Our own groups, and ones that are only a passing mention, stay out.
const OURS = /vegans explore|soflo vegans|pbc-veg/i;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clip = (v: unknown, n: number) => { const s = String(v ?? '').trim(); return s ? s.slice(0, n) : null; };
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const slugify = (s: string, n: number) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n);

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
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
// A super admin (the Depot) or ops (the admin token). Returns who, or null.
async function actorOf(req: Request): Promise<{ memberId: string | null; label: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  if (admin && token.length === admin.length && token === admin) return { memberId: null, label: 'ops' };
  const sub = await verifyToken(token);
  if (!sub) return null;
  const { data } = await db.from('members').select('id, email, is_superadmin').eq('id', sub).maybeSingle();
  return data?.is_superadmin ? { memberId: data.id, label: data.email } : null;
}

// ---- Finding a group's email: only one they publish (their own site, their Instagram bio) ----
const SKIP_HOST = /(^|\.)(vegansexplore\.com|facebook\.com|instagram\.com|meetup\.com|partiful\.com|eventbrite\.com|yelp\.com|google\.com|tiktok\.com)$/i;
const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(example|domain|email|mysite|yoursite|yourdomain|website|test|sentry|wixpress|sentry-next|godaddy|squarespace|shopify)\.|^(no-?reply|donotreply|privacy|legal|abuse|webmaster|careers|jobs|hr)@/i;
const GOOD_LOCAL = ['hello', 'info', 'contact', 'team', 'events', 'hi', 'admin', 'organizer', 'club'];
function cfDecode(hex: string): string {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}
function emailsIn(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) { try { found.add(decodeURIComponent(m[1]).toLowerCase()); } catch { /* bad escape */ } }
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) found.add(cfDecode(m[1]).toLowerCase());
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#64;|&commat;|\s?\[at\]\s?|\s?\(at\)\s?/gi, '@');
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase());
  return [...found].map((e) => e.replace(/^[.]+|[.]+$/g, '')).filter((e) => isEmail(e) && !BAD_EMAIL.test(e));
}
function best(emails: string[], host: string | null): string | null {
  const root = host ? host.replace(/^www\./, '').split('.').slice(-2).join('.') : '';
  const score = (e: string) => {
    const [local, dom] = e.split('@');
    let s = 0;
    if (root && dom.endsWith(root)) s += 10;
    else if (/^(gmail|yahoo|outlook|hotmail|icloud|aol|proton)\./.test(dom)) s += 4;
    const i = GOOD_LOCAL.indexOf(local);
    if (i >= 0) s += 6 - i * 0.3;
    return s;
  };
  return emails.sort((a, b) => score(b) - score(a))[0] || null;
}
async function fetchText(url: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', Accept: 'text/html' } });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return '';
    return (await r.text()).slice(0, 600_000);
  } catch { return ''; } finally { clearTimeout(t); }
}
async function siteEmail(website: string): Promise<{ email: string | null; source: string | null; note: string }> {
  let base: URL;
  try { base = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website); } catch { return { email: null, source: null, note: 'Their website link does not work' }; }
  if (SKIP_HOST.test(base.hostname)) return { email: null, source: null, note: 'No website of their own' };
  const pages = [...new Set([base.origin + (base.pathname.length > 1 ? base.pathname : '/'), base.origin + '/contact', base.origin + '/contact-us', base.origin + '/about'])];
  let opened = 0;
  for (const p of pages) {
    const html = await fetchText(p);
    if (!html) continue;
    opened++;
    const e = best(emailsIn(html), base.hostname);
    if (e) return { email: e, source: p, note: '' };
  }
  return { email: null, source: null, note: opened ? 'No email on their website' : 'Their website did not open' };
}
async function instagramEmail(handle: string): Promise<{ email: string | null; source: string | null; note: string }> {
  const token = await secret('APIFY_API_TOKEN');
  if (!token) return { email: null, source: null, note: 'Instagram reader not set up' };
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [handle] }),
    });
    if (!r.ok) return { email: null, source: null, note: 'Instagram did not answer' };
    const p = ((await r.json()) as any[])[0];
    if (!p || p.error) return { email: null, source: null, note: 'Instagram account not found' };
    // Only what the account shows: its public contact email, else one written in its bio.
    const shown = [p.publicEmail, p.businessEmail].map((x: unknown) => String(x || '').toLowerCase().trim()).filter(isEmail);
    const e = shown[0] || best(emailsIn(String(p.biography || '')), null);
    return e ? { email: e, source: `https://www.instagram.com/${handle}/`, note: '' } : { email: null, source: null, note: 'No email on their Instagram' };
  } catch { return { email: null, source: null, note: 'Instagram did not answer' }; }
}
const handleOf = (v: string | null) => {
  const s = String(v || '').trim().replace(/^@/, '');
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(s);
  const h = m ? m[1] : s;
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : null;
};

// ---- Meetup ----
async function meetup(query: string, variables: Record<string, unknown> = {}) {
  const r = await fetch(MEETUP, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ query, variables }) });
  const d = await r.json().catch(() => ({}));
  if (d?.errors?.length) throw new Error(String(d.errors[0]?.message || 'meetup_error').slice(0, 200));
  return d?.data;
}
const SEARCH = `query($q:String!, $lat:Float!, $lon:Float!){ groupSearch(filter:{query:$q, lat:$lat, lon:$lon, radius:40}, first: 40){ edges{ node{
  id name urlname city state country link description timezone stats{ memberCounts{ all } }
  upcoming: events(status: ACTIVE, first: 1){ totalCount } past: events(filter:{status: PAST, afterDateTime:"2025-01-01T00:00:00Z"}, first: 1){ totalCount } } } } }`;
const meetupUrlname = (v: unknown) => { const m = /meetup\.com\/([A-Za-z0-9_-]+)/i.exec(String(v || '')); return m ? m[1].toLowerCase() : null; };
const plainText = (s: string) => s.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\\/g, '').replace(/\s+/g, ' ').trim();
// A short About from their own Meetup description: whole sentences up to about 240 characters.
function aboutOf(desc: string): string {
  const t = plainText(desc);
  if (t.length <= 240) return t;
  const parts = t.match(/[^.!?]+[.!?]+/g) || [t];
  let out = '';
  for (const p of parts) { if ((out + p).length > 240) break; out += p; }
  return (out || t.slice(0, 237) + '...').trim();
}

// Their 2026 events from Meetup, saved through ve_event_intake as the group's (past ones as history, upcoming ones live).
async function importMeetupEvents(listingId: string, urlname: string, sourceId: string | null) {
  const q = (status: string, after?: string, before?: string) => `query($u:String!){ groupByUrlname(urlname:$u){ timezone events(filter:{status: ${status}${after ? `, afterDateTime:"${after}"` : ''}${before ? `, beforeDateTime:"${before}"` : ''}}, first: 100){ edges{ node{
    id title dateTime endTime eventUrl eventType description venues{ name address city state country } } } } } }`;
  const year = new Date().getUTCFullYear();
  const windows = [[`${year}-01-01T00:00:00Z`, `${year}-05-01T00:00:00Z`], [`${year}-05-01T00:00:00Z`, `${year}-09-01T00:00:00Z`], [`${year}-09-01T00:00:00Z`, `${year + 1}-01-01T00:00:00Z`]];
  const nodes: { n: any; past: boolean; tz: string }[] = [];
  for (const [a, b] of windows) {
    const d = await meetup(q('PAST', a, b), { u: urlname }).catch(() => null);
    const g = d?.groupByUrlname;
    for (const e of g?.events?.edges ?? []) nodes.push({ n: e.node, past: true, tz: g.timezone || 'America/New_York' });
  }
  const up = await meetup(q('ACTIVE'), { u: urlname }).catch(() => null);
  const horizon = Date.now() + 180 * 86400000;
  for (const e of up?.groupByUrlname?.events?.edges ?? []) if (Date.parse(e.node.dateTime) <= horizon) nodes.push({ n: e.node, past: false, tz: up.groupByUrlname.timezone || 'America/New_York' });
  const { data: pa } = await db.from('lesaruss_dispatch_settings').select('value').eq('key', 'pulse_auto').maybeSingle();
  let author: string | null = null;
  try { author = (typeof pa?.value === 'string' ? JSON.parse(pa.value) : pa?.value)?.member_id ?? null; } catch { /* none */ }
  let added = 0;
  for (const { n, past, tz } of nodes) {
    const v = (n.venues || [])[0] || {};
    const online = n.eventType === 'ONLINE';
    const cc = String(v.country || '').toUpperCase();
    const ev: Record<string, unknown> = {
      title: String(n.title || '').replace(/\s+/g, ' ').trim().slice(0, 200), starts_at: n.dateTime, ends_at: n.endTime, timezone: tz,
      description: plainText(String(n.description || '')).slice(0, 2000), event_type: online ? 'virtual' : 'in_person',
      category: 'meetup', ticket_url: n.eventUrl, past, host_listing_id: listingId,
    };
    if (!online) Object.assign(ev, { location_name: v.name || null, address: v.address || null, city: v.city || null, state: v.state ? String(v.state).toUpperCase() : null,
      country: cc || null, continent: cc === 'GB' || cc === 'UK' ? 'Europe' : 'North America' });
    const { data } = await db.rpc('ve_event_intake', { p_event: ev, p_source: 'admin', p_source_id: sourceId, p_author: author, p_approve: true });
    if (data?.ok) added++;
  }
  return { read: nodes.length, added };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const actor = await actorOf(req);
  if (!actor) return json({ error: 'forbidden' }, 403);

  try {
    if (action === 'list') {
      const { data: groups, error } = await db.from('listings').select('id, slug, name, status, logo_url, website, instagram, ig_handle, facebook, address_city, address_state, communities, details')
        .eq('category', 'Groups').in('status', ['approved', 'pending']).order('name').limit(2000);
      if (error) return json({ error: 'load_failed', message: error.message }, 500);
      const ids = (groups || []).map((g) => g.id);
      const [{ data: invs }, { data: parts }, { data: evs }] = ids.length ? await Promise.all([
        db.from('universe_invites').select('id, listing_id, name, email, status, sent_at, opened_at, email_opened_at, accepted_at, joined_at, declined_at, expires_at, created_at')
          .eq('points_to', 'group').in('listing_id', ids).order('created_at', { ascending: false }),
        db.from('ve_group_partners').select('listing_id, status, lead_member_id, updated_at').in('listing_id', ids),
        db.from('events').select('host_listing_id, starts_at, ends_at').eq('status', 'approved').in('host_listing_id', ids).limit(20000),
      ]) : [{ data: [] }, { data: [] }, { data: [] }];
      const latest = new Map<string, any>();
      for (const i of invs || []) if (!latest.has(i.listing_id)) latest.set(i.listing_id, i);
      const P = new Map((parts || []).map((p: any) => [p.listing_id, p]));
      const now = Date.now();
      const counts = new Map<string, { up: number; past: number }>();
      for (const e of evs || []) {
        const c = counts.get(e.host_listing_id) || { up: 0, past: 0 };
        const end = Date.parse(e.ends_at || '') || (Date.parse(e.starts_at) + 4 * 3600000);
        if (end >= now) c.up++; else c.past++;
        counts.set(e.host_listing_id, c);
      }
      return json({ ok: true, groups: (groups || []).map((g: any) => {
        const inv = latest.get(g.id) || null;
        const gd = g.details?.group || {};
        return {
          id: g.id, slug: g.slug, name: g.name, status: g.status, logo_url: g.logo_url, website: g.website, instagram: g.ig_handle || g.instagram,
          city: g.address_city, state: g.address_state, chapters: g.communities || [], meetup: gd.meetup || null, events_url: gd.events_url || null,
          contact_email: gd.contact_email || null, contact_name: gd.contact_name || null, contact_source: gd.contact_source || null,
          invite: inv ? { ...inv, status: ['sent', 'opened'].includes(inv.status) && inv.expires_at && Date.parse(inv.expires_at) < now ? 'expired' : inv.status } : null,
          partner: P.get(g.id) || null, events: counts.get(g.id) || { up: 0, past: 0 },
        };
      }) });
    }

    if (action === 'get') {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      const { data: g } = await db.from('listings').select('id, slug, name, status, category, logo_url, website, instagram, ig_handle, facebook, description, address_city, address_state, communities, details')
        .eq('id', body.listing_id).maybeSingle();
      if (!g || g.category !== 'Groups') return json({ error: 'not_found' }, 404);
      const [{ data: invs }, { data: partner }, { data: evs }] = await Promise.all([
        db.from('universe_invites').select('id, name, email, person_id, comp, points, reason, context, status, sent_via, sent_at, opened_at, email_opened_at, resend_email_id, accepted_at, joined_at, declined_at, decline_note, claimed_member_id, expires_at, nudged_at, nudge_count, created_at, link_code, code')
          .eq('points_to', 'group').eq('listing_id', g.id).order('created_at', { ascending: false }),
        db.from('ve_group_partners').select('*').eq('listing_id', g.id).maybeSingle(),
        db.from('events').select('id, title, starts_at, ends_at').eq('status', 'approved').eq('host_listing_id', g.id).order('starts_at', { ascending: false }).limit(2000),
      ]);
      // Read: the first time the email was opened (email_events), saved on the invitation, as ve-invites does.
      const want = (invs || []).filter((i: any) => i.resend_email_id && !i.email_opened_at);
      if (want.length) {
        const { data: ee } = await db.from('email_events').select('resend_email_id, event_at').eq('event_type', 'email.opened').in('resend_email_id', want.map((i: any) => i.resend_email_id)).order('event_at');
        const first = new Map<string, string>();
        for (const e of ee || []) if (!first.has(e.resend_email_id)) first.set(e.resend_email_id, e.event_at);
        for (const i of want as any[]) { const at = first.get(i.resend_email_id); if (at) { i.email_opened_at = at; await db.from('universe_invites').update({ email_opened_at: at }).eq('id', i.id); } }
      }
      const now = Date.now();
      const up = (evs || []).filter((e: any) => (Date.parse(e.ends_at || '') || Date.parse(e.starts_at) + 4 * 3600000) >= now);
      let lead = null;
      if (partner?.lead_member_id) { const { data: m } = await db.from('members').select('id, name, email').eq('id', partner.lead_member_id).maybeSingle(); lead = m; }
      const gd = g.details?.group || {};
      return json({ ok: true, group: { id: g.id, slug: g.slug, name: g.name, status: g.status, logo_url: g.logo_url, website: g.website, instagram: g.ig_handle || g.instagram,
        facebook: g.facebook, description: g.description, city: g.address_city, state: g.address_state, chapters: g.communities || [], meetup: gd.meetup || null,
        events_url: gd.events_url || null, contact_email: gd.contact_email || null, contact_name: gd.contact_name || null, contact_source: gd.contact_source || null,
        contact_note: gd.contact_note || null },
        invites: (invs || []).map((i: any) => ({ ...i, status: ['sent', 'opened'].includes(i.status) && i.expires_at && Date.parse(i.expires_at) < now ? 'expired' : i.status,
          link: i.link_code ? `https://vegansexplore.com/go/${i.link_code}` : `https://vegansexplore.com/invite?c=${i.code}`,
          can_nudge: ['sent', 'opened', 'accepted'].includes(i.status) && i.sent_via === 'email' && (i.nudge_count ?? 0) < 2
            && now - Date.parse(i.nudged_at ?? i.sent_at ?? new Date().toISOString()) >= 5 * 86400000 })),
        partner: partner ? { ...partner, lead } : null,
        events: { upcoming: up.length, past: (evs || []).length - up.length, next: up.slice(-3).reverse(), recent: (evs || []).filter((e: any) => !up.includes(e)).slice(0, 3) } });
    }

    if (action === 'contact_save' || action === 'find_contact') {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      const { data: g } = await db.from('listings').select('id, name, category, website, instagram, ig_handle, details').eq('id', body.listing_id).maybeSingle();
      if (!g || g.category !== 'Groups') return json({ error: 'not_found' }, 404);
      const details = g.details || {};
      const group = { ...(details.group || {}) };
      if (action === 'contact_save') {
        const email = clip(body.email, 200)?.toLowerCase() ?? null;
        if (email && !isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
        if ('email' in body) { group.contact_email = email; group.contact_source = email ? (clip(body.source, 300) || 'Typed in by the team') : null; }
        if ('name' in body) group.contact_name = clip(body.name, 120);
        group.contact_at = new Date().toISOString();
        await db.from('listings').update({ details: { ...details, group }, updated_at: new Date().toISOString() }).eq('id', g.id);
        return json({ ok: true, contact_email: group.contact_email ?? null, contact_name: group.contact_name ?? null, contact_source: group.contact_source ?? null });
      }
      // find_contact: their own website first, then their Instagram bio. Only an email they publish.
      const tried: string[] = [];
      let found: { email: string | null; source: string | null; note: string } = { email: null, source: null, note: '' };
      const sites = [g.website, group.website].filter((w: unknown) => typeof w === 'string' && w.trim()) as string[];
      for (const w of [...new Set(sites)]) { found = await siteEmail(w); tried.push(found.email ? `Website: found` : `Website: ${found.note}`); if (found.email) break; }
      const handle = handleOf(g.ig_handle || g.instagram);
      if (!found.email && handle) { found = await instagramEmail(handle); tried.push(found.email ? 'Instagram: found' : `Instagram: ${found.note}`); }
      if (!sites.length && !handle) tried.push('No website or Instagram to read');
      group.contact_checked_at = new Date().toISOString();
      group.contact_note = found.email ? null : tried.join('. ');
      if (found.email && !group.contact_email) { group.contact_email = found.email; group.contact_source = found.source; }
      await db.from('listings').update({ details: { ...details, group }, updated_at: new Date().toISOString() }).eq('id', g.id);
      return json({ ok: true, email: found.email, source: found.source, saved: !!found.email && group.contact_email === found.email, tried });
    }

    if (action === 'partner_save') {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      const { data: g } = await db.from('listings').select('id, category').eq('id', body.listing_id).maybeSingle();
      if (!g || g.category !== 'Groups') return json({ error: 'not_found' }, 404);
      const row: Record<string, unknown> = { listing_id: g.id, updated_at: new Date().toISOString() };
      if (['invited', 'onboarding', 'active', 'paused', 'ended'].includes(body.status)) row.status = body.status;
      if ('notes' in body) row.notes = clip(body.notes, 2000);
      const { error } = await db.from('ve_group_partners').upsert(row, { onConflict: 'listing_id' });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }

    if (action === 'discover') {
      const chapter = String(body.chapter || '');
      const centers = CENTERS[chapter];
      if (!centers) return json({ error: 'chapter', message: 'Pick a chapter.' }, 400);
      // What we already hold: any listing with this Meetup group, live, waiting or set aside, so nothing comes back twice.
      const { data: have } = await db.from('listings').select('website, details').or('category.eq.Groups,crawl_source.eq.group-discover').limit(5000);
      const known = new Set<string>();
      for (const l of have || []) for (const u of [meetupUrlname(l.website), meetupUrlname(l.details?.group?.meetup), meetupUrlname(l.details?.group?.events_url)]) if (u) known.add(u);
      const seen = new Map<string, any>();
      const errors: string[] = [];
      for (const [lat, lon] of centers) for (const q of ['vegan', 'plant based']) {
        try {
          const d = await meetup(SEARCH, { q, lat, lon });
          for (const e of d?.groupSearch?.edges ?? []) { const n = e.node; if (n?.urlname && !seen.has(n.urlname.toLowerCase())) seen.set(n.urlname.toLowerCase(), n); }
        } catch (e) { errors.push(String((e as Error).message)); }
      }
      const kept: any[] = [], skipped: { name: string; why: string }[] = [];
      for (const [u, n] of seen) {
        const text = `${n.name} ${n.description || ''}`;
        if (!VEG.test(n.name) && !VEG.test(String(n.description || '').slice(0, 1500))) { continue; }
        if (OURS.test(text) || OURS.test(u)) { skipped.push({ name: n.name, why: 'One of ours' }); continue; }
        if (known.has(u)) { skipped.push({ name: n.name, why: 'Already on the Directory or set aside' }); continue; }
        const active = (n.upcoming?.totalCount || 0) + (n.past?.totalCount || 0);
        if (!active) { skipped.push({ name: n.name, why: 'No events since 2025' }); continue; }
        kept.push(n);
      }
      const added: any[] = [];
      for (const n of kept) {
        let slug = slugify(n.name, 70) || `group-${n.id}`;
        const { data: clash } = await db.from('listings').select('id').eq('slug', slug).maybeSingle();
        if (clash) slug = `${slug}-${String(n.urlname).toLowerCase().slice(0, 20)}`.slice(0, 90);
        const cc = String(n.country || '').toUpperCase();
        const st = cc === 'US' ? String(n.state || '').toUpperCase() || CHAPTER_STATE[chapter] : null;
        const link = n.link || `https://www.meetup.com/${n.urlname}`;
        const { data: row, error } = await db.from('listings').insert({
          name: String(n.name).slice(0, 160), slug, category: 'Groups', specialty: '', description: aboutOf(String(n.description || '')), status: 'quarantined',
          website: link, location: [n.city, st || (cc === 'GB' ? 'UK' : null)].filter(Boolean).join(', '), address_city: n.city || null, address_state: st,
          address_country: cc || null, business_status: 'OPERATIONAL', vegan_status: null, initials: String(n.name).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'GR',
          communities: [chapter], crawl_source: 'group-discover',
          details: { group: { meetup: link, events_url: link.replace(/\/?$/, '/') + 'events/', vegan_only: /\bvegan/i.test(n.name),
            discovered: { at: new Date().toISOString(), chapter, members: n.stats?.memberCounts?.all ?? null, upcoming: n.upcoming?.totalCount ?? 0,
              past_since_2025: n.past?.totalCount ?? 0, timezone: n.timezone || null } },
            admin_notes: [{ at: new Date().toISOString(), by: 'Logan', kind: 'note', text: `Found by the group search on Meetup (${chapter}). Its About is its own Meetup description, trimmed. Waiting for Sean: Add to the Directory or Set aside.` }] },
        }).select('id, slug, name').single();
        if (error) { errors.push(`${n.name}: ${error.message}`.slice(0, 200)); continue; }
        added.push({ ...row, city: n.city, members: n.stats?.memberCounts?.all ?? null, upcoming: n.upcoming?.totalCount ?? 0, past: n.past?.totalCount ?? 0, link });
      }
      return json({ ok: true, chapter, looked_at: seen.size, added, skipped, errors });
    }

    if (action === 'discovered') {
      const { data } = await db.from('listings').select('id, slug, name, website, description, address_city, address_state, communities, details, created_at')
        .eq('crawl_source', 'group-discover').eq('status', 'quarantined').order('created_at', { ascending: false }).limit(500);
      return json({ ok: true, groups: (data || []).map((l: any) => ({ id: l.id, slug: l.slug, name: l.name, link: l.website, about: l.description, city: l.address_city,
        state: l.address_state, chapter: (l.communities || [])[0] || null, found: l.details?.group?.discovered || null, at: l.created_at })) });
    }

    if (action === 'discover_decide') {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      const { data: l } = await db.from('listings').select('id, name, slug, status, category, website, communities, details').eq('id', body.listing_id).maybeSingle();
      if (!l || l.category !== 'Groups' || l.status !== 'quarantined') return json({ error: 'not_found', message: 'That group is not waiting any more.' }, 404);
      const now = new Date().toISOString();
      const notes = Array.isArray(l.details?.admin_notes) ? l.details.admin_notes : [];
      const by = actor.label === 'ops' ? 'Logan' : 'Sean';
      if (body.decision === 'aside') {
        const note = clip(body.note, 300) || 'Not a Vegan social group';
        await db.from('listings').update({ status: 'rejected', updated_at: now,
          details: { ...l.details, removed_at: now, removed_by: by, removed_note: note, admin_notes: [...notes, { at: now, by, kind: 'note', text: `Set aside from the group search: ${note}` }] } }).eq('id', l.id);
        return json({ ok: true, decision: 'aside' });
      }
      if (body.decision !== 'add') return json({ error: 'bad_decision' }, 400);
      await db.from('listings').update({ status: 'approved', updated_at: now,
        details: { ...l.details, admin_notes: [...notes, { at: now, by, kind: 'note', text: 'Added to the Directory from the group search.' }] } }).eq('id', l.id);
      // Its Meetup events page becomes a crawl source tied to it, and its 2026 events come in now.
      const url = l.details?.group?.events_url || l.website;
      let sourceId: string | null = null;
      const { data: had } = await db.from('ve_event_sources').select('id').eq('url', url).maybeSingle();
      if (had) { sourceId = had.id; await db.from('ve_event_sources').update({ listing_id: l.id, active: true }).eq('id', had.id); }
      else {
        const { data: s } = await db.from('ve_event_sources').insert({ name: `${l.name} (group)`.slice(0, 120), kind: 'list', url, city_slug: (l.communities || [])[0] || null,
          notes: `This is ${l.name}'s own page. Save every upcoming event they host (a meetup, dinner, potluck, party or outing), each with its own event page as the link where it has one. They are tied to the group automatically.`,
          active: true, check_status: 'queued', every_days: 3, listing_id: l.id }).select('id').single();
        sourceId = s?.id ?? null;
      }
      const u = meetupUrlname(l.details?.group?.meetup || l.website);
      const events = u ? await importMeetupEvents(l.id, u, sourceId).catch((e) => ({ error: String(e) })) : { read: 0, added: 0 };
      return json({ ok: true, decision: 'add', slug: l.slug, events });
    }

    // ---- Applications from the Group Partner Guide's Apply tab (ve-group 'apply'). Reading one never invites anyone.
    if (action === 'applications') {
      const { data, error } = await db.from('ve_group_applications').select('id, created_at, group_name, chapter, city, organizer_name, organizer_email, status, answers, listing_id')
        .order('created_at', { ascending: false }).limit(500);
      if (error) return json({ error: 'load_failed', message: error.message }, 500);
      return json({ ok: true, applications: (data || []).map((r: any) => ({ id: r.id, at: r.created_at, group: r.group_name, chapter: r.chapter, city: r.city,
        name: r.organizer_name, email: r.organizer_email, status: r.status, turnout: r.answers?.turnout || null, size: r.answers?.size || null, listing_id: r.listing_id })) });
    }
    if (action === 'application_get') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: r } = await db.from('ve_group_applications').select('*').eq('id', body.id).maybeSingle();
      if (!r) return json({ error: 'not_found' }, 404);
      let listing = null;
      if (r.listing_id) { const { data: l } = await db.from('listings').select('id, slug, name').eq('id', r.listing_id).maybeSingle(); listing = l; }
      else {
        // A Groups listing with the same name, to open beside it.
        const { data: ls } = await db.from('listings').select('id, slug, name').eq('category', 'Groups').ilike('name', r.group_name).limit(1);
        listing = ls?.[0] || null;
      }
      return json({ ok: true, application: r, listing });
    }
    if (action === 'application_save') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const status = String(body.status || '');
      if (!['new', 'reviewing', 'accepted', 'declined'].includes(status)) return json({ error: 'bad_status' }, 400);
      const { error } = await db.from('ve_group_applications').update({ status, decision_note: clip(body.note, 1000), reviewed_at: new Date().toISOString(),
        reviewed_by: actor.label === 'ops' ? 'Logan' : 'Sean' }).eq('id', body.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-groups:', e);
    return json({ error: 'internal_error', message: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
