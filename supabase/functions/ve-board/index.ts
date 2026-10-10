// ve-board: the Community Board (Sean, 2026-09-30). One board per city community, built for
// the question rescue leaders ask all day in a WhatsApp group that nobody can search: "do you
// know anybody who can take these chickens?" A post is a request or an offer; it can be
// searched, answered, marked resolved, and reported.
//
// Open to see, join to interact (Sean, 2026-09-30): anyone can list, search and read posts.
// Posting, replying, resolving and reporting need an active member (the $11 Founding
// Membership), and a poster's contact line is only returned to active members, because
// rescues share phone numbers and addresses here.
//
// POST { action: 'list', community, lane?, q?, kind?, category?, area?, status?: 'open'|'resolved'|'all', before? }
//   -> { posts, viewer }                         public; token optional
//
// Sections (Sean, 2026-10-10): every city's Board has Requests & Offers, Jobs, Classifieds, Fosters
// and Rescues beside the Daily Pulse, then Suggest a Topic. A lane is a set of kinds (LANES); in the new lanes the
// category is the post's type (Hiring or Looking for work, For sale or Free...). Each lane opens
// on a pinned "How it works" post (pinned, category 'guide'), shown as from Vegans Explore.
// POST { action: 'get', id }                    -> { post, replies, viewer }   public
// POST { action: 'create', community, kind, category, title, body, area?, contact? }  member
// POST { action: 'reply', post_id, body }       member
// POST { action: 'resolve', post_id, reopen? }  the poster, or a moderator
// POST { action: 'report', post_id? | reply_id?, reason, details? }  member
// POST { action: 'moderate', post_id? | reply_id?, op: 'hide'|'restore' }  moderator
// POST { action: 'reports', community? }        moderator -> open reports
//
// Daily Pulse topics (Sean, 2026-10-04, playbook ve-daily-pulse-discussion): the Pulse is a lane of
// the Board. A topic is a post with kind 'topic': a short intro, one question, and its source.
// community 'national' holds the national topic, shown in every city's lane. Topics start as
// drafts that only the desk sees; the city's Community Manager approves theirs, Sean the national
// one, and approving needs a first reply so no topic opens to an empty room. Members reply the way
// they reply to any post; nobody creates a topic from the Board itself.
// POST { action: 'list', lane: 'pulse', community, q?, before? }  public: live topics, city + national
// POST { action: 'topic_desk', community? }     desk -> drafts, live topics, story suggestions
// POST { action: 'topic_draft', community, lead_id? | url?, note? }   desk: queue today's briefing for the
//                                               writer (a story or link, if given, leads it)
// POST { action: 'topic_rewrite', id, note? }   desk: send a draft back to the writer
// POST { action: 'topic_save', id, title, body, question, briefing?, source_name?, source_url? }   desk (drafts)
// POST { action: 'topic_publish', id, first_reply, title?, body?, question?, source_name?, source_url? }
// POST { action: 'topic_discard', id }          desk (drafts)
//
// The writing is done by the Background writer, not here (Sean, 2026-10-04): a draft is queued
// (write_status 'queued') and the dispatcher's pulse_topic_write job, a routine on Sean's Claude
// subscription, fills in the headline, intro and question. This function never calls a paid API.
// Queuing nudges the dispatcher (lesaruss_dispatch_tick) so the writer starts within minutes
// instead of at the next 15-minute check. Saving or publishing a draft takes it off the writer.
//
// A topic is a city briefing (Sean, 2026-10-04: "as if we're leading a movement in this city"):
// an opening (body), up to five stories people are talking about, upcoming events, one action,
// and the question. The sections are ve_board_posts.briefing (cleanBriefing below). Publishing
// marks every Inbox story the briefing used, so tomorrow's briefing does not repeat it.
//
// Authorization: Bearer <ve_token>, checked here the same way ve-votes and ve-auth check it
// (verify_jwt is false on deploy). Reports email that city's Community Manager with Sean
// copied (ve_partner_cities.manager_email), or Sean alone while a city has none. Three reports
// from three different members hide a post or reply until a moderator looks at it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const COMMUNITIES = ['south-florida', 'central-florida', 'atlanta', 'dmv', 'new-york', 'philadelphia', 'los-angeles', 'london'];
// Hub slug -> ve_partner_cities slug, where the two differ.
const MANAGER_CITY: Record<string, string> = { 'central-florida': 'orlando-north-central-florida' };
const LANES: Record<string, { kinds: string[]; categories: string[] }> = {
  // Rescue and fostering have their own lanes now; the two old categories are still accepted here.
  board: { kinds: ['request', 'offer'], categories: ['transport', 'food', 'services', 'volunteers', 'other', 'rescue', 'fostering'] },
  jobs: { kinds: ['job'], categories: ['hiring', 'seeking'] },
  classifieds: { kinds: ['classified'], categories: ['for_sale', 'free', 'wanted', 'trade'] },
  fosters: { kinds: ['foster'], categories: ['foster_needed', 'foster_offered'] },
  rescues: { kinds: ['rescue'], categories: ['rescue_urgent', 'rescue_needed', 'rescue_update'] },
  // Suggest a Topic (Sean, 2026-10-10). The Pulse writer reads the city's pulse_idea suggestions; a
  // briefing that uses one carries briefing.suggestion_id, and publishing marks it covered (trigger).
  // A hot tip (Sean, 2026-10-10: "a way for people to leave news, hot tips, letting us know what's going on in
  // their cities") is read by the Pulse writer the same way as a Daily Pulse idea.
  suggest: { kinds: ['suggestion'], categories: ['hot_tip', 'pulse_idea', 'talk_idea', 'board_idea'] },
};
const KINDS = Object.values(LANES).flatMap((l) => l.kinds);
const LANE_OF: Record<string, string> = Object.fromEntries(Object.entries(LANES).flatMap(([lane, l]) => l.kinds.map((k) => [k, lane])));
const NATIONAL = 'national';
const TOPIC_SCOPES = [...COMMUNITIES, NATIONAL];
// ve_partner_cities / ve_staff_invites slug -> hub slug (the reverse of MANAGER_CITY).
const HUB_FOR_CITY: Record<string, string> = Object.fromEntries(Object.entries(MANAGER_CITY).map(([hub, city]) => [city, hub]));
const SCOPE_NAME: Record<string, string> = {
  'south-florida': 'South Florida', 'central-florida': 'Central Florida', atlanta: 'Atlanta', dmv: 'DMV', 'new-york': 'New York',
  philadelphia: 'Philadelphia', 'los-angeles': 'Los Angeles', london: 'London', national: 'National',
};
const REASONS = ['not_who_they_say', 'unsafe', 'scam', 'spam', 'harassment', 'other'];
const REASON_LABEL: Record<string, string> = {
  not_who_they_say: 'Not who they say they are', unsafe: 'Unsafe for animals or people', scam: 'Scam or money request',
  spam: 'Spam', harassment: 'Harassment', other: 'Something else',
};
const HIDE_AT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = { post: 10, reply: 60, report: 20 };
const PAGE = 30;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

type Viewer = { id: string; name: string | null; email: string | null; active: boolean; moderator: boolean; admin: boolean; cm: boolean; home: string | null } | null;

async function loadViewer(req: Request): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members')
    .select('id, name, email, membership_status, is_superadmin, staff_role, ve_role, home_community').eq('id', id).maybeSingle();
  if (!m) return null;
  const cm = m.staff_role === 'community_manager' || m.ve_role === 'community_manager';
  const moderator = !!m.is_superadmin || cm;
  return { id: m.id, name: m.name, email: m.email, active: m.membership_status === 'active', moderator, admin: !!m.is_superadmin, cm, home: m.home_community || null };
}

// What a reader can see about the person behind a post: enough to decide whether to trust
// them, never their email. "helped" counts their offers and replies on the Board.
async function posterCards(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return {} as Record<string, unknown>;
  const [{ data: people }, { data: offers }, { data: replies }] = await Promise.all([
    db.from('members').select('id, name, initials, color, avatar_url, profile_image_url, profile_headline, home_community, created_at, founding_member, entry_paid_at, staff_role, ve_role').in('id', unique),
    db.from('ve_board_posts').select('member_id').in('member_id', unique).eq('kind', 'offer').neq('status', 'hidden'),
    db.from('ve_board_replies').select('member_id').in('member_id', unique).eq('status', 'visible'),
  ]);
  const helped: Record<string, number> = {};
  for (const r of [...(offers || []), ...(replies || [])]) helped[r.member_id] = (helped[r.member_id] || 0) + 1;
  const out: Record<string, unknown> = {};
  for (const p of people || []) {
    out[p.id] = {
      name: p.name || 'Member', initials: p.initials || (p.name || 'M').slice(0, 1).toUpperCase(), color: p.color || '#1a1a1a',
      avatar: p.profile_image_url || p.avatar_url || null, headline: p.profile_headline || null, community: p.home_community || null,
      // founding_member is not yet set by the webhook (Launch Playbook group C), so a recorded
      // $11 entry payment counts too.
      member_since: p.created_at, founding: !!p.founding_member || !!p.entry_paid_at,
      community_manager: p.staff_role === 'community_manager' || p.ve_role === 'community_manager', helped: helped[p.id] || 0,
    };
  }
  return out;
}

// A topic is posted by the Daily Pulse, not by the person who approved it; their name shows on
// the first reply instead.
const PULSE_POSTER = { name: 'Daily Pulse', initials: 'DP', color: '#cfe8d0', avatar: null, pulse: true };
// A pinned "How it works" post speaks for Vegans Explore, not for the account that holds it.
const TEAM_POSTER = { name: 'Vegans Explore', initials: 'VE', color: '#cfe8d0', avatar: null, team: true };

function shapePost(p: any, cards: Record<string, unknown>, viewer: Viewer) {
  const topic = p.kind === 'topic';
  return {
    id: p.id, community: p.community_slug, kind: p.kind, category: p.category, title: p.title, body: p.body, area: p.area,
    status: p.status, resolved_at: p.resolved_at, reply_count: p.reply_count, created_at: topic ? (p.published_at || p.created_at) : p.created_at,
    contact: viewer?.active ? p.contact : null, has_contact: !!p.contact,
    pinned: !!p.pinned, mine: !topic && !p.pinned && !!viewer && viewer.id === p.member_id,
    poster: topic ? PULSE_POSTER : p.pinned ? TEAM_POSTER : (cards[p.member_id] || null),
    ...(topic ? { question: p.question, source_name: p.source_name, source_url: p.source_url, published_at: p.published_at, briefing: p.briefing || null } : {}),
  };
}

// ---- Daily Pulse desk ---------------------------------------------------------------------
// Which topic scopes this person may draft and approve: Sean every city and National, a
// Community Manager their own city (their invite's city first, then their home community).
async function deskScopes(viewer: Viewer): Promise<string[]> {
  if (!viewer) return [];
  if (viewer.admin) return TOPIC_SCOPES;
  if (!viewer.cm) return [];
  const { data: invite } = viewer.email
    ? await db.from('ve_staff_invites').select('city_slug').ilike('email', viewer.email).maybeSingle()
    : { data: null };
  const raw = invite?.city_slug || viewer.home || '';
  const hub = HUB_FOR_CITY[raw] || raw;
  return COMMUNITIES.includes(hub) ? [hub] : [];
}

const tidy = (s: unknown, max: number) => String(s ?? '').replace(/\u0000/g, '').replace(/\s*\u2014\s*/g, ', ').replace(/\u2013/g, '-')
  .replace(/\bvegan(ism|s)?\b/g, (_m: string, x?: string) => 'Vegan' + (x || '')).trim().slice(0, max);
const isUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u);
const hostName = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

// The briefing sections, as the desk or the writer sent them, reduced to what the page shows. An
// item without a working link is dropped; an action may link inside the site ("/board?...").
const sitePath = (u: string) => /^\/(?!\/)[^\s]*$/.test(u);
function cleanBriefing(b: any) {
  if (!b || typeof b !== 'object') return null;
  const str = (v: unknown, max: number) => tidy(typeof v === 'string' ? v : '', max);
  const stories = (Array.isArray(b.stories) ? b.stories : []).map((x: any) => ({
    title: str(x?.title, 140), take: str(x?.take, 300), source: str(x?.source, 120),
    url: clean(x?.url, 1000), lead_id: isId(x?.lead_id) ? x.lead_id : null,
  })).filter((x: any) => x.title && isUrl(x.url)).slice(0, 5);
  const events = (Array.isArray(b.events) ? b.events : []).map((x: any) => {
    const url = clean(x?.url, 1000);
    return { title: str(x?.title, 140), when: str(x?.when, 60), where: str(x?.where, 120), url: isUrl(url) ? url : null };
  }).filter((x: any) => x.title).slice(0, 3);
  let action: any = null;
  if (b.action && typeof b.action === 'object') {
    const url = clean(b.action.url, 1000);
    action = { title: str(b.action.title, 80), text: str(b.action.text, 300), label: str(b.action.label, 40) || 'Take action', url };
    if (!action.title || !(isUrl(url) || sitePath(url))) action = null;
  }
  const suggestion_id = isId(b.suggestion_id) ? b.suggestion_id : null;
  return stories.length || events.length || action ? { stories, events, action, ...(suggestion_id ? { suggestion_id } : {}) } : null;
}

// Read a pasted link for its title and outlet, so the queued draft names the story before the
// writer gets to it.
async function readLink(url: string) {
  const out = { title: '', site: '', description: '' };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VegansExploreBot/1.0; +https://vegansexplore.com)' } });
    clearTimeout(t);
    if (!res.ok) return out;
    const html = (await res.text()).slice(0, 400000);
    const meta = (name: string) => (html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + name + '["\'][^>]*content=["\']([^"\']*)', 'i')) || [])[1] || '';
    const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#39;|&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
    out.title = decode(meta('og:title') || (html.match(/<title[^>]*>([^<]*)/i) || [])[1] || '').trim();
    out.site = decode(meta('og:site_name')).trim();
    out.description = decode(meta('og:description') || meta('description')).trim();
  } catch { /* the writer reads the page itself; this only names the draft */ }
  return out;
}

// Start the Background writer now rather than at the next 15-minute check. The tick does nothing
// when a run is already going, and it never blocks the desk: a failure here only means the
// writer starts at the next check.
async function nudgeWriter() {
  try { await db.rpc('lesaruss_dispatch_tick'); } catch (e) { console.error('dispatch tick', e); }
}

async function countSince(table: string, column: string, memberId: string) {
  const { count } = await db.from(table).select('id', { count: 'exact', head: true })
    .eq(column, memberId).gt('created_at', new Date(Date.now() - DAY_MS).toISOString());
  return count || 0;
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) { console.error('Resend failed:', e); return false; }
}

async function reportRecipients(community: string): Promise<string[]> {
  const { data } = await db.from('ve_partner_cities').select('manager_email').eq('slug', MANAGER_CITY[community] || community).maybeSingle();
  return data?.manager_email ? [data.manager_email, SEAN_EMAIL] : [SEAN_EMAIL];
}

const needMember = (viewer: Viewer) => {
  if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to join the conversation.' }, 401);
  if (!viewer.active) return json({ error: 'payment_required', message: 'Become a Founding Member to post, reply and help your community on the Board.' }, 402);
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const viewer = await loadViewer(req);
  const viewerOut = viewer ? { signed_in: true, member: viewer.active, moderator: viewer.moderator } : { signed_in: false, member: false, moderator: false };

  switch (body.action) {
    case 'list': {
      const community = clean(body.community, 40);
      if (!COMMUNITIES.includes(community)) return json({ error: 'bad_community' }, 400);
      if (body.lane === 'pulse') {
        let t = db.from('ve_board_posts')
          .select('id, community_slug, member_id, kind, category, title, body, area, contact, status, resolved_at, reply_count, created_at, question, source_name, source_url, published_at, briefing')
          .eq('kind', 'topic').in('community_slug', [community, NATIONAL]).in('status', ['open', 'resolved'])
          .order('published_at', { ascending: false }).limit(PAGE);
        const before = clean(body.before, 40);
        if (before && !isNaN(Date.parse(before))) t = t.lt('published_at', before);
        const text = clean(body.q, 120);
        if (text) t = t.textSearch('search', text, { type: 'websearch', config: 'english' });
        const { data, error } = await t;
        if (error) return json({ error: 'list_failed', message: error.message }, 500);
        return json({ posts: (data || []).map((p) => shapePost(p, {}, viewer)), more: (data || []).length === PAGE, viewer: viewerOut });
      }
      const lane = LANES[body.lane] || LANES.board;
      let q = db.from('ve_board_posts')
        .select('id, community_slug, member_id, kind, category, title, body, area, contact, status, resolved_at, reply_count, created_at, pinned')
        .eq('community_slug', community).in('kind', lane.kinds)
        .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(PAGE);
      const status = clean(body.status, 10) || 'open';
      if (status === 'open' || status === 'resolved') q = q.eq('status', status);
      else q = q.in('status', ['open', 'resolved']);
      if (lane.kinds.includes(body.kind)) q = q.eq('kind', body.kind);
      if (lane.categories.includes(body.category)) q = q.eq('category', body.category);
      // Areas (Sean, 2026-10-10): a post is for one area of the city (VE_HUBS[].page.boardAreas) or the whole
      // city (no area). Filtering by an area shows that area's posts and the whole-city ones, pinned included.
      const area = clean(body.area, 120).replace(/["\\]/g, '');
      if (area) q = q.or(`area.is.null,area.eq."${area}"`);
      const before = clean(body.before, 40);
      // The pinned post leads the first page only.
      if (before && !isNaN(Date.parse(before))) q = q.lt('created_at', before).eq('pinned', false);
      const text = clean(body.q, 120);
      if (text) q = q.textSearch('search', text, { type: 'websearch', config: 'english' });
      const { data, error } = await q;
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      const cards = await posterCards((data || []).map((p) => p.member_id));
      return json({ posts: (data || []).map((p) => shapePost(p, cards, viewer)), more: (data || []).length === PAGE, viewer: viewerOut });
    }

    case 'get': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('*').eq('id', body.id).maybeSingle();
      if (!p || (p.status === 'hidden' && !viewer?.moderator && viewer?.id !== p.member_id)) return json({ error: 'not_found' }, 404);
      if (p.status === 'draft' && !(await deskScopes(viewer)).includes(p.community_slug)) return json({ error: 'not_found' }, 404);
      const { data: replies } = await db.from('ve_board_replies').select('id, member_id, body, status, created_at')
        .eq('post_id', p.id).order('created_at', { ascending: true }).limit(200);
      const visible = (replies || []).filter((r) => r.status === 'visible' || viewer?.moderator);
      const cards = await posterCards([p.member_id, ...visible.map((r) => r.member_id)]);
      return json({
        post: { ...shapePost(p, cards, viewer), hidden_reason: viewer?.moderator ? p.hidden_reason : undefined },
        replies: visible.map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, hidden: r.status === 'hidden', mine: viewer?.id === r.member_id, poster: cards[r.member_id] || null })),
        viewer: viewerOut,
      });
    }

    case 'create': {
      const gate = needMember(viewer); if (gate) return gate;
      const community = clean(body.community, 40);
      if (!COMMUNITIES.includes(community)) return json({ error: 'bad_community' }, 400);
      if (!KINDS.includes(body.kind)) return json({ error: 'bad_kind', message: 'Choose what kind of post this is.' }, 400);
      if (!LANES[LANE_OF[body.kind]].categories.includes(body.category)) return json({ error: 'bad_category', message: 'Choose a type for your post.' }, 400);
      const title = clean(body.title, 140), text = clean(body.body, 4000);
      if (title.length < 3) return json({ error: 'bad_title', message: 'Give your post a short title.' }, 400);
      if (!text) return json({ error: 'bad_body', message: 'Tell people what you need or what you can offer.' }, 400);
      if (await countSince('ve_board_posts', 'member_id', viewer!.id) >= LIMITS.post) return json({ error: 'rate_limited', message: 'You have posted a lot today. Try again tomorrow.' }, 429);
      const { data, error } = await db.from('ve_board_posts').insert({
        community_slug: community, member_id: viewer!.id, kind: body.kind, category: body.category, title, body: text,
        area: clean(body.area, 120) || null, contact: clean(body.contact, 200) || null,
      }).select('id').single();
      if (error) return json({ error: 'create_failed', message: error.message }, 500);
      return json({ ok: true, id: data.id });
    }

    case 'reply': {
      const gate = needMember(viewer); if (gate) return gate;
      if (!isId(body.post_id)) return json({ error: 'bad_id' }, 400);
      const text = clean(body.body, 2000);
      if (!text) return json({ error: 'bad_body', message: 'Write a reply first.' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, status').eq('id', body.post_id).maybeSingle();
      if (!p || p.status === 'hidden' || p.status === 'draft') return json({ error: 'not_found' }, 404);
      if (await countSince('ve_board_replies', 'member_id', viewer!.id) >= LIMITS.reply) return json({ error: 'rate_limited', message: 'You have replied a lot today. Try again tomorrow.' }, 429);
      const { data, error } = await db.from('ve_board_replies').insert({ post_id: p.id, member_id: viewer!.id, body: text }).select('id').single();
      if (error) return json({ error: 'reply_failed', message: error.message }, 500);
      const { count } = await db.from('ve_board_replies').select('id', { count: 'exact', head: true }).eq('post_id', p.id).eq('status', 'visible');
      await db.from('ve_board_posts').update({ reply_count: count || 0, updated_at: new Date().toISOString() }).eq('id', p.id);
      return json({ ok: true, id: data.id });
    }

    case 'resolve': {
      if (!viewer) return json({ error: 'not_authenticated' }, 401);
      if (!isId(body.post_id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, member_id, status, kind, pinned').eq('id', body.post_id).maybeSingle();
      if (!p || p.status === 'hidden' || p.status === 'draft' || p.kind === 'topic' || p.pinned) return json({ error: 'not_found' }, 404);
      if (p.member_id !== viewer.id && !viewer.moderator) return json({ error: 'forbidden', message: 'Only the person who posted can mark it resolved.' }, 403);
      const reopen = body.reopen === true;
      const { error } = await db.from('ve_board_posts').update({
        status: reopen ? 'open' : 'resolved', resolved_at: reopen ? null : new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', p.id);
      if (error) return json({ error: 'resolve_failed', message: error.message }, 500);
      return json({ ok: true, status: reopen ? 'open' : 'resolved' });
    }

    case 'report': {
      const gate = needMember(viewer); if (gate) return gate;
      if (!REASONS.includes(body.reason)) return json({ error: 'bad_reason', message: 'Choose a reason.' }, 400);
      const details = clean(body.details, 1000) || null;
      let post: any = null, reply: any = null;
      if (isId(body.reply_id)) {
        const { data } = await db.from('ve_board_replies').select('id, post_id, member_id, body, report_count').eq('id', body.reply_id).maybeSingle();
        reply = data; if (!reply) return json({ error: 'not_found' }, 404);
        const { data: parent } = await db.from('ve_board_posts').select('id, community_slug, title').eq('id', reply.post_id).maybeSingle();
        post = parent;
      } else if (isId(body.post_id)) {
        const { data } = await db.from('ve_board_posts').select('id, community_slug, member_id, kind, title, body, report_count, pinned').eq('id', body.post_id).maybeSingle();
        post = data;
      }
      if (!post) return json({ error: 'not_found' }, 404);
      // A topic is the Daily Pulse's post: a report on it is about the topic, not the person who approved it.
      const reported = reply ? reply.member_id : (post.kind === 'topic' || post.pinned ? null : post.member_id);
      if (reported && reported === viewer!.id) return json({ error: 'own_post', message: 'You cannot report your own post.' }, 400);
      if (await countSince('ve_board_reports', 'reporter_member_id', viewer!.id) >= LIMITS.report) return json({ error: 'rate_limited', message: 'You have sent a lot of reports today. The team is on it.' }, 429);
      const { error } = await db.from('ve_board_reports').insert({
        community_slug: post.community_slug, reporter_member_id: viewer!.id, post_id: post.id, reply_id: reply?.id ?? null,
        reported_member_id: reported, reason: body.reason, details,
      });
      if (error) {
        if (error.code === '23505') return json({ ok: true, already: true, message: 'You already reported this. Thank you.' });
        return json({ error: 'report_failed', message: error.message }, 500);
      }
      // Count distinct reporters and hide at the threshold until a moderator reviews it.
      const target = reply ? 've_board_replies' : 've_board_posts';
      const { count } = await db.from('ve_board_reports').select('id', { count: 'exact', head: true })
        .eq(reply ? 'reply_id' : 'post_id', reply ? reply.id : post.id).eq('status', 'open');
      const reports = count || 0;
      const hide = reports >= HIDE_AT;
      await db.from(target).update(reply
        ? { report_count: reports, ...(hide ? { status: 'hidden' } : {}) }
        : { report_count: reports, ...(hide ? { status: 'hidden', hidden_reason: `Hidden after ${reports} reports, awaiting review` } : {}) }).eq('id', reply ? reply.id : post.id);
      const hub = post.community_slug;
      const link = `${SITE}/board?community=${hub}&post=${post.id}`;
      await sendEmail(await reportRecipients(hub), `[Community Board] Report: ${REASON_LABEL[body.reason]}${hide ? ' (now hidden)' : ''}`,
        `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">A member reported ${reply ? 'a reply on' : 'a post on'} the ${esc(hub)} Community Board.</p>
<p style="font-family:sans-serif;font-size:14px;line-height:1.6"><b>Reason:</b> ${esc(REASON_LABEL[body.reason])}<br><b>Post:</b> ${esc(post.title || '')}<br>
${reply ? `<b>Reply:</b> ${esc(String(reply.body).slice(0, 400))}<br>` : ''}${details ? `<b>Details:</b> ${esc(details)}<br>` : ''}
<b>Reported by:</b> ${esc(viewer!.name || 'Member')} (${esc(viewer!.email || '')})<br><b>Open reports on it:</b> ${reports}${hide ? ' (hidden until reviewed)' : ''}</p>
<p style="font-family:sans-serif;font-size:14px"><a href="${link}">Open it on the Board</a></p>`);
      return json({ ok: true, hidden: hide, message: 'Thank you. Your Community Manager will take a look.' });
    }

    case 'moderate': {
      if (!viewer?.moderator) return json({ error: 'forbidden' }, 403);
      const op = body.op === 'restore' ? 'restore' : body.op === 'hide' ? 'hide' : null;
      if (!op) return json({ error: 'bad_op' }, 400);
      const now = new Date().toISOString();
      if (isId(body.reply_id)) {
        await db.from('ve_board_replies').update({ status: op === 'hide' ? 'hidden' : 'visible', ...(op === 'restore' ? { report_count: 0 } : {}) }).eq('id', body.reply_id);
        await db.from('ve_board_reports').update({ status: op === 'hide' ? 'actioned' : 'dismissed', reviewed_by: viewer.id, reviewed_at: now }).eq('reply_id', body.reply_id).eq('status', 'open');
        const { data: r } = await db.from('ve_board_replies').select('post_id').eq('id', body.reply_id).maybeSingle();
        if (r) {
          const { count } = await db.from('ve_board_replies').select('id', { count: 'exact', head: true }).eq('post_id', r.post_id).eq('status', 'visible');
          await db.from('ve_board_posts').update({ reply_count: count || 0 }).eq('id', r.post_id);
        }
      } else if (isId(body.post_id)) {
        await db.from('ve_board_posts').update(op === 'hide'
          ? { status: 'hidden', hidden_reason: clean(body.note, 200) || 'Hidden by a moderator', updated_at: now }
          : { status: 'open', hidden_reason: null, report_count: 0, updated_at: now }).eq('id', body.post_id);
        await db.from('ve_board_reports').update({ status: op === 'hide' ? 'actioned' : 'dismissed', reviewed_by: viewer.id, reviewed_at: now }).eq('post_id', body.post_id).is('reply_id', null).eq('status', 'open');
      } else return json({ error: 'bad_id' }, 400);
      return json({ ok: true });
    }

    case 'topic_desk': {
      const scopes = await deskScopes(viewer);
      if (!scopes.length) return json({ error: 'forbidden', message: 'The Pulse desk is for Community Managers.' }, 403);
      const scope = scopes.includes(clean(body.community, 40)) ? clean(body.community, 40) : scopes[0];
      const cols = 'id, community_slug, member_id, kind, category, title, body, area, contact, status, resolved_at, reply_count, created_at, question, source_name, source_url, published_at, lead_id, write_status, write_note, write_error, briefing';
      const since = new Date(Date.now() - 21 * DAY_MS).toISOString();
      // National has no feed of its own: it draws on the Vegan outlets, whatever city they name. A
      // city sees every story tagged to it, including ones members and Community Managers sent in.
      const national = scope === NATIONAL;
      let leads = db.from('ve_news_leads').select('id, title, summary, url, source_name, city_slug, published_at' + (national ? ', ve_news_feeds!inner(scope)' : ''))
        .eq('brand_slug', 'vegans-explore').is('topic_post_id', null).neq('status', 'dismissed')
        .or(`published_at.gte.${since},and(published_at.is.null,created_at.gte.${since})`)
        .order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(15);
      leads = national ? leads.eq('ve_news_feeds.scope', 'vegan') : leads.eq('city_slug', scope);
      const [{ data: drafts }, { data: live }, { data: stories }] = await Promise.all([
        db.from('ve_board_posts').select(cols).eq('kind', 'topic').eq('community_slug', scope).eq('status', 'draft').order('created_at', { ascending: false }).limit(20),
        db.from('ve_board_posts').select(cols).eq('kind', 'topic').eq('community_slug', scope).in('status', ['open', 'resolved', 'hidden']).order('published_at', { ascending: false }).limit(10),
        leads,
      ]);
      const latest = (live || [])[0];
      return json({
        scope, scope_name: SCOPE_NAME[scope], scopes: scopes.map((s) => ({ slug: s, name: SCOPE_NAME[s] })),
        posted_today: !!latest && Date.now() - new Date(latest.published_at).getTime() < DAY_MS,
        drafts: (drafts || []).map((p) => ({ ...shapePost(p, {}, viewer), lead_id: p.lead_id, write_status: p.write_status, write_note: p.write_note, write_error: p.write_error })),
        live: (live || []).map((p) => shapePost(p, {}, viewer)),
        stories: (stories || []).map((l: any) => ({ id: l.id, title: l.title, summary: l.summary, url: l.url, source_name: l.source_name || hostName(l.url), city: l.city_slug, published_at: l.published_at })),
      });
    }

    case 'topic_draft': {
      const scopes = await deskScopes(viewer);
      const scope = clean(body.community, 40);
      if (!scopes.includes(scope)) return json({ error: 'forbidden', message: 'You can draft topics for your own city.' }, 403);
      const note = clean(body.note, 500);
      let story = { title: '', summary: '', source: '', url: '' }, leadId: string | null = null;
      if (isId(body.lead_id)) {
        const { data: l } = await db.from('ve_news_leads').select('id, title, summary, url, source_name, topic_post_id').eq('id', body.lead_id).maybeSingle();
        if (!l) return json({ error: 'not_found' }, 404);
        if (l.topic_post_id) return json({ error: 'already_topic', message: 'That story is already a topic.' }, 409);
        const { data: taken } = await db.from('ve_board_posts').select('id').eq('lead_id', l.id).eq('status', 'draft').limit(1);
        if (taken && taken.length) return json({ error: 'already_draft', message: 'That story already has a draft below.' }, 409);
        story = { title: l.title || '', summary: l.summary || '', source: l.source_name || hostName(l.url), url: l.url };
        leadId = l.id;
      } else if (clean(body.url, 1000)) {
        const url = clean(body.url, 1000);
        if (!isUrl(url)) return json({ error: 'bad_url', message: 'Paste the full link to the story, starting with https://' }, 400);
        const page = await readLink(url);
        story = { title: page.title, summary: page.description, source: page.site || hostName(url), url };
      }
      // No story given: the writer builds today's briefing from the Inbox, events and ways to act.
      const named = tidy(story.title, 140);
      const { data, error } = await db.from('ve_board_posts').insert({
        community_slug: scope, member_id: viewer!.id, kind: 'topic', category: 'pulse', status: 'draft',
        title: named.length >= 3 ? named : (scope === NATIONAL ? 'Daily Pulse' : SCOPE_NAME[scope] + ' Pulse'),
        body: tidy(story.summary, 4000) || 'The Background writer is building today\'s briefing.', question: '',
        source_name: story.url ? tidy(story.source || hostName(story.url), 120) : null, source_url: story.url || null, lead_id: leadId,
        write_status: 'queued', write_note: note || null, write_marked_at: new Date().toISOString(),
      }).select('id').single();
      if (error) return json({ error: 'draft_failed', message: error.message }, 500);
      await nudgeWriter();
      return json({ ok: true, id: data.id, queued: true });
    }

    case 'topic_rewrite': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, community_slug, kind, status').eq('id', body.id).maybeSingle();
      if (!p || p.kind !== 'topic' || p.status !== 'draft') return json({ error: 'not_found', message: 'That draft is gone or already live.' }, 404);
      if (!(await deskScopes(viewer)).includes(p.community_slug)) return json({ error: 'forbidden' }, 403);
      await db.from('ve_board_posts').update({ write_status: 'queued', write_note: clean(body.note, 500) || null, write_error: null, write_marked_at: new Date().toISOString() }).eq('id', p.id);
      await nudgeWriter();
      return json({ ok: true, queued: true });
    }

    case 'topic_save':
    case 'topic_publish':
    case 'topic_discard': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, community_slug, kind, status, title, body, question, source_name, source_url, lead_id, briefing').eq('id', body.id).maybeSingle();
      if (!p || p.kind !== 'topic' || p.status !== 'draft') return json({ error: 'not_found', message: 'That draft is gone or already live.' }, 404);
      if (!(await deskScopes(viewer)).includes(p.community_slug)) return json({ error: 'forbidden' }, 403);
      if (body.action === 'topic_discard') {
        await db.from('ve_board_posts').delete().eq('id', p.id);
        return json({ ok: true });
      }
      const next = {
        title: body.title !== undefined ? tidy(body.title, 140) : p.title,
        body: body.body !== undefined ? tidy(body.body, 4000) : p.body,
        question: body.question !== undefined ? tidy(body.question, 300) : p.question,
        source_name: body.source_name !== undefined ? (tidy(body.source_name, 120) || null) : p.source_name,
        source_url: body.source_url !== undefined ? (clean(body.source_url, 1000) || null) : p.source_url,
        briefing: body.briefing !== undefined ? cleanBriefing(body.briefing) : p.briefing,
      };
      // The first story is the briefing's lead source.
      const lead = next.briefing?.stories?.[0];
      if (lead) { next.source_name = lead.source || hostName(lead.url); next.source_url = lead.url; }
      if (next.title.length < 3) return json({ error: 'bad_title', message: 'Give the briefing a headline.' }, 400);
      if (!next.body) return json({ error: 'bad_body', message: 'Write the opening.' }, 400);
      if (next.source_url && !isUrl(next.source_url)) return json({ error: 'bad_source', message: 'The source link does not look right.' }, 400);
      const now = new Date().toISOString();
      if (body.action === 'topic_save') {
        await db.from('ve_board_posts').update({ ...next, write_status: null, updated_at: now }).eq('id', p.id);
        return json({ ok: true });
      }
      if (!next.question) return json({ error: 'bad_question', message: 'End the briefing with one real question.' }, 400);
      if (!next.source_url && !next.briefing) return json({ error: 'bad_source', message: 'A briefing needs at least one story, event or action, or a source.' }, 400);
      const first = clean(body.first_reply, 2000);
      if (!first) return json({ error: 'first_reply', message: 'Write the first reply, so nobody walks into an empty room.' }, 400);
      const { error } = await db.from('ve_board_posts').update({ ...next, status: 'open', published_at: now, updated_at: now, reply_count: 1, write_status: null }).eq('id', p.id).eq('status', 'draft');
      if (error) return json({ error: 'publish_failed', message: error.message }, 500);
      await db.from('ve_board_replies').insert({ post_id: p.id, member_id: viewer!.id, body: first });
      const used = [...new Set([p.lead_id, ...((next.briefing?.stories || []).map((x: any) => x.lead_id))].filter(Boolean))];
      if (used.length) await db.from('ve_news_leads').update({ topic_post_id: p.id }).in('id', used).is('topic_post_id', null);
      return json({ ok: true, id: p.id });
    }

    case 'reports': {
      if (!viewer?.moderator) return json({ error: 'forbidden' }, 403);
      let q = db.from('ve_board_reports').select('id, community_slug, post_id, reply_id, reason, details, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(100);
      const community = clean(body.community, 40);
      if (COMMUNITIES.includes(community)) q = q.eq('community_slug', community);
      const { data, error } = await q;
      if (error) return json({ error: 'reports_failed', message: error.message }, 500);
      return json({ reports: (data || []).map((r) => ({ ...r, reason_label: REASON_LABEL[r.reason] })) });
    }
  }
  return json({ error: 'unknown_action' }, 400);
});
