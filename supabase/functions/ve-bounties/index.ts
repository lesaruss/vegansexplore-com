// ve-bounties: Bounties (Sean, 2026-10-04; lifecycle in playbook ve-bounties-lifecycle). Content
// jobs paid in points. A Passport holder claims one of a bounty's spots (up to 2 per event); claims
// lock 48 hours before the event and work is due 7 days after it. Claiming unlocks the rundown, the
// event details and a claimers-only Q&A thread for that event. The member uploads files (private
// ve-bounty-uploads bucket, signed upload links) or pastes links and submits; Sean or that city's
// Community Manager reviews in Depot > Bounties: approve at full or reduced points (ve_bounty_pay),
// up to 2 rounds of changes (72 hours each), or decline, with an optional coaching note.
// Releasing a spot before claims close is free, after is half a strike; nothing in by the deadline
// is a no-show (a strike). ve_bounty_standing turns strikes into a cooldown.
//
// Members
// POST { action: 'list', community }               signed in; spots left, clocks, the viewer's claim and standing
// POST { action: 'get', id }                       signed in; once claimed: rundown, event details, Q&A
// Bounties are for members (Sean, 2026-10-04): signed out, list and get return not_authenticated.
// POST { action: 'claim', bounty_id }              Passport holder
// POST { action: 'release', bounty_id }            before submitting
// POST { action: 'upload_url', bounty_id, name, size, type }  -> { url, path }
// POST { action: 'file_added', bounty_id, path, name, size, type }
// POST { action: 'file_remove', bounty_id, path }
// POST { action: 'submit', bounty_id, note?, links?, license: true }
// POST { action: 'thread', bounty_id }             the event's Q&A (claimers and reviewers)
// POST { action: 'ask', bounty_id, body }          claimers until the event starts; reviewers any time
// Reviewers (Sean: every city; a Community Manager: their own)
// POST { action: 'review_list', status?, community? }
// POST { action: 'review', id, decision: 'approve'|'changes'|'reject'|'violation', note?, points?, coaching? }
// POST { action: 'strike_clear', id, note? }
// POST { action: 'event_update', bounty_id, details?, cancel?, starts_at?, ends_at? }
// Campaigns (Sean, 2026-10-04, worked through with V): the bounties page shows campaign cards and a
// card opens the campaign with its story and jobs. Any leadership member proposes; the city's
// Community Manager (or a superadmin) decides. A job with parts is one bundle: every part is
// required to earn the points. A place campaign's host must be an active member, provides the meal,
// and gets a featured listing filled with the approved photos.
// POST { action: 'campaign_admin_list' }            leadership: campaigns, jobs, proposals
// POST { action: 'campaign_propose', community, kind, title, story?, cover_url?, starts_at?, ends_at?,
//        due_at?, place_name?, address?, event_id?, campaign_id?, host_listing_id?, host_email?,
//        creator_cap?, publish? }                   leadership; jobs come from the kind's template
// POST { action: 'campaign_decide', id, decision: 'approve'|'decline', note? }   city CM or superadmin
// POST { action: 'campaign_update', id, ...fields, host_extras?, details? }      city CM or superadmin
// POST { action: 'job_update', id, title?, points?, slots?, brief?, deliverable?, parts? }
// POST { action: 'listing_search', q }               leadership: pick a host listing
// Cron (x-cron-secret, hourly): reminders, no-shows, auto-submit, lapsed change requests, ends
// featured runs that bounties started
// POST { action: 'cron' }
//
// Authorization: Bearer <ve_token>, verified the way ve-board and ve-auth verify it (verify_jwt is
// false on deploy). Every table is RLS-on with no policies; only this function reads or writes.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const BUCKET = 've-bounty-uploads';
const COMMUNITIES = ['south-florida', 'central-florida', 'atlanta', 'dmv', 'new-york', 'philadelphia', 'los-angeles', 'london'];
// A test city only superadmins see, for trying a campaign end to end. Never listed for members, and a
// sandbox host is never featured.
const SANDBOX = 'sandbox';
const cityOk = (v: { admin: boolean } | null, c: string) => COMMUNITIES.includes(c) || (c === SANDBOX && !!v?.admin);
const HUB_FOR_CITY: Record<string, string> = { 'orlando-north-central-florida': 'central-florida' };
const TZ: Record<string, string> = { london: 'Europe/London', 'los-angeles': 'America/Los_Angeles' };
const MAX_FILES = 120;
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const HOUR = 3600 * 1000, DAY = 24 * HOUR;
const MAX_REVISIONS = 2;
const REVIEW_SLA_DAYS = 5;
const ACTIVE = ['claimed', 'submitted', 'changes', 'approved', 'rejected']; // holds a spot and the Q&A
// Who can propose a campaign (Sean: "any leadership member can propose").
const LEADERSHIP_ROLES = ['community_manager', 'creative_producer', 'executive_assistant'];
const FEATURE_DAYS = 90;
const MEDIA_BUCKET = 'vegan-media';
// Starting jobs for each kind of campaign. A Community Manager edits them before going live.
type Job = { kind: string; title: string; points: number; slots: number | null; brief: string; deliverable: string; parts?: string[] };
const EVENT_JOBS: Job[] = [
  { kind: 'recap_video', title: 'Recap video', points: 500, slots: 3, deliverable: 'One 45-second recap video (vertical 9:16, MP4)',
    brief: 'Capture the day in one 45-second recap video in the style of Vegans Explore content: fast cuts, the food up close, the vendors and the crowd, the energy of the day, and a clear sense of place. Vertical 9:16, good light and clean sound, no copyrighted music. Show people only with their OK.' },
  { kind: 'vlog', title: 'Event vlog', points: 500, slots: 5, deliverable: 'One vlog of your experience, 2 to 5 minutes (MP4 or a link)',
    brief: 'Take us with you: arriving, walking the event, what you tried, who you met, and your honest take. 2 to 5 minutes, you on camera or narrating. Steady shots and clear audio. Show people only with their OK.' },
  { kind: 'interviews', title: 'Man-on-the-street interviews', points: 500, slots: 5, deliverable: '10 short interview segments with attendees (video)',
    brief: 'Ten short interviews with people at the event: who they are, what brought them, what they loved, and what being Vegan here means to them. One person per clip, 15 to 60 seconds each, faces and voices clear. Ask each person on camera if Vegans Explore may share it.' },
  { kind: 'writeup', title: 'Event write-up', points: 250, slots: 3, deliverable: 'A 500 to 10,000 word write-up (paste it in, or upload a document)',
    brief: 'Tell the story of the day: what took place, which vendors were there and what they served, and quotes from attendees (with their names and their OK to be quoted). 500 to 10,000 words. Facts only: no invented names, prices or quotes.' },
  { kind: 'clips', title: 'Recap clips', points: 250, slots: 10, deliverable: '50 to 100 raw video clips for our recap video',
    brief: 'Shoot 50 to 100 short raw clips (3 to 15 seconds each) we can cut into our own recap: food, vendors, crowd, signs, the space, moments. Upload the original files, vertical or horizontal, no filters or music. Show people only with their OK.' },
];
const PLACE_JOBS: Job[] = [
  { kind: 'feature', title: 'Host night content', points: 500, slots: 10, deliverable: 'Every part below, uploaded as original photos and video',
    brief: 'Come to the host night, enjoy the meal the restaurant chooses for you, and capture it. This is one job with several parts: you earn the points when every part is done. Upload the original files (no filters), and post about it tagging the restaurant and Vegans Explore. Show people only with their OK.',
    parts: ['You eating the meal on camera: at least 3 shots of you tasting and reacting', 'Close-ups of every dish you are served: plated, cut into, the first bite', 'The space: the room, the counter, the sign out front', 'A 15 to 30 second talk to camera: what you ate and why people should come', 'A post on your own social account tagging the restaurant and Vegans Explore (paste the link)'] },
  { kind: 'recap_video', title: 'Host recap video', points: 500, slots: 1, deliverable: 'One 45-second recap video (vertical 9:16, MP4)',
    brief: 'The recap video of the night that the restaurant posts with us as a collaboration: the food up close, the room full, the energy, and the restaurant\'s name and sign in the first 3 seconds. Vertical 9:16, good light, clean sound, no copyrighted music. Show people only with their OK.' },
];
const ONGOING_JOBS: Job[] = [
  { kind: 'other', title: 'Campaign submission', points: 250, slots: 10, deliverable: 'What the campaign story asks for',
    brief: 'Read the campaign story above for exactly what we need. Upload original files or paste links, and submit before the window closes. Show people only with their OK.' },
];
const TEMPLATES: Record<string, Job[]> = { event: EVENT_JOBS, place: PLACE_JOBS, ongoing: ONGOING_JOBS };
// Host extras from the Services menu that need creators become jobs on the campaign. A sampling
// table and a Passport Challenge stop are kept on the campaign but need no creator.
const EXTRA_JOBS: Record<string, Job> = {
  photo_shoot: { kind: 'photos', title: 'Photo shoot', points: 400, slots: 1, deliverable: 'About 10 edited photos of the food and the space (JPG)',
    brief: 'The host booked a photo shoot. Shoot the food and the space in good light and deliver about 10 edited photos the restaurant keeps and we add to its listing. Show people only with their OK.' },
  reel: { kind: 'reel', title: 'Short reel', points: 500, slots: 1, deliverable: 'One short vertical video, 15 to 45 seconds (MP4)',
    brief: 'The host booked a reel. One short vertical video for the restaurant\'s socials and listing: the best dish, the room, the people. Good light and clean sound, no copyrighted music. Show people only with their OK.' },
  social_post: { kind: 'social_post', title: 'Social feature post', points: 200, slots: 1, deliverable: 'One feature post: 3 to 10 photos and a caption',
    brief: 'The host booked a social feature post. Deliver 3 to 10 photos and a caption that tells people what to order and why to go. Facts only: no invented prices or claims.' },
};
const HOST_EXTRAS = ['photo_shoot', 'reel', 'social_post', 'event_table', 'challenge_month'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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
const isUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);
const nowIso = () => new Date().toISOString();

type Viewer = { id: string; name: string | null; email: string | null; admin: boolean; cm: boolean; leader: boolean; home: string | null; passport: boolean } | null;
async function loadViewer(req: Request): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members').select('id, name, email, is_superadmin, staff_role, ve_role, home_community, membership_status').eq('id', id).maybeSingle();
  if (!m) return null;
  const cm = m.staff_role === 'community_manager' || m.ve_role === 'community_manager';
  return { id: m.id, name: m.name, email: m.email, admin: !!m.is_superadmin, cm, leader: !!m.is_superadmin || cm || LEADERSHIP_ROLES.includes(m.staff_role), home: m.home_community || null, passport: m.membership_status === 'active' || !!m.is_superadmin };
}
// Cities this person reviews: Sean all of them, a Community Manager their own.
async function reviewCities(v: Viewer): Promise<string[]> {
  if (!v) return [];
  if (v.admin) return [...COMMUNITIES, SANDBOX];
  if (!v.cm) return [];
  const { data: inv } = v.email ? await db.from('ve_staff_invites').select('city_slug').ilike('email', v.email).maybeSingle() : { data: null };
  const raw = inv?.city_slug || v.home || '';
  const hub = HUB_FOR_CITY[raw] || raw;
  return COMMUNITIES.includes(hub) ? [hub] : [];
}

const BOUNTY_COLS = 'id, community_slug, event_id, event_title, kind, title, brief, deliverable, example_url, points, max_awards, due_at, status, sort, slots, event_starts_at, event_ends_at, claims_close_at, campaign_id, parts';
const CAMPAIGN_COLS = 'id, slug, community_slug, kind, title, story, cover_url, campaign_id, event_id, place_name, address, starts_at, ends_at, claims_close_at, due_at, host_listing_id, host_member_id, host_extras, creator_cap, status, proposed_by, decided_by, decided_at, decision_note, featured_applied_at, created_at';
// The date a campaign card sorts by: claims closing while they are open, then the work deadline.
// A campaign with neither sorts after every dated one.
function campaignDeadline(c: any) {
  const close = ms(c.claims_close_at);
  if (!isNaN(close) && close > Date.now()) return close;
  const due = ms(c.due_at);
  return isNaN(due) ? Number.MAX_SAFE_INTEGER : due;
}
async function hostListings(ids: string[]) {
  const out: Record<string, any> = {};
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return out;
  const { data } = await db.from('listings').select('id, name, slug, address_city, is_featured, featured_until, gallery_urls, owner_member_id, claimed_by_member_id').in('id', list);
  for (const l of data || []) out[l.id] = l;
  return out;
}
// Public view of a campaign for its card and its page.
function shapeCampaign(c: any, jobs: any[], host: any) {
  const open = jobs.filter((b) => b.claims_open && b.spots_left !== 0);
  return {
    id: c.id, slug: c.slug, kind: c.kind, title: c.title, story: c.story, cover_url: c.cover_url, community: c.community_slug,
    place_name: c.place_name, starts_at: c.starts_at, ends_at: c.ends_at, claims_close_at: c.claims_close_at, due_at: c.due_at, status: c.status,
    host: host ? { name: host.name, slug: host.slug } : null, meal: c.kind === 'place',
    jobs: jobs.length, jobs_open: open.length, max_points: jobs.reduce((n, b) => Math.max(n, b.points || 0), 0),
    mine: jobs.filter((b) => b.mine && b.mine.status !== 'released').length, deadline: campaignDeadline(c),
  };
}
// Clocks a campaign's jobs run on, from its kind and dates.
function campaignClocks(c: any) {
  if (c.kind === 'ongoing') {
    const due = ms(c.due_at);
    if (isNaN(due) || due <= Date.now()) return { error: 'Set when the window closes, in the future.' };
    return { event_starts_at: null, event_ends_at: null, claims_close_at: new Date(Math.max(Date.now() + HOUR, due - 3 * DAY)).toISOString(), due_at: new Date(due).toISOString() };
  }
  const start = ms(c.starts_at);
  if (isNaN(start)) return { error: 'Set the date and time it starts.' };
  const end = ms(c.ends_at) || start + (c.kind === 'place' ? 4 : 6) * HOUR;
  if (end < start) return { error: 'It has to end after it starts.' };
  return { event_starts_at: new Date(start).toISOString(), event_ends_at: new Date(end).toISOString(), claims_close_at: new Date(start - 2 * DAY).toISOString(), due_at: new Date(end + 7 * DAY).toISOString() };
}
async function canDecide(v: Viewer, community: string) { return !!v && (v.admin || (await reviewCities(v)).includes(community)); }
// A place campaign's host night pays off on the listing: the approved photos go into its gallery
// (copied to the public media bucket) and the listing is featured for 90 days, unless it is
// already featured some other way.
async function applyHost(c: any, submission: any) {
  if (!c || c.kind !== 'place' || !c.host_listing_id || c.community_slug === SANDBOX) return;
  const { data: l } = await db.from('listings').select('id, is_featured, featured_until, gallery_urls, ve_first_featured_at').eq('id', c.host_listing_id).maybeSingle();
  if (!l) return;
  const patch: Record<string, unknown> = {};
  const featuredElsewhere = l.is_featured && !l.featured_until;
  if (!featuredElsewhere) {
    const until = Math.max(ms(l.featured_until) || 0, Date.now() + FEATURE_DAYS * DAY);
    Object.assign(patch, { is_featured: true, featured_until: new Date(until).toISOString() });
    if (!l.ve_first_featured_at) patch.ve_first_featured_at = nowIso();
  }
  const gallery: string[] = Array.isArray(l.gallery_urls) ? l.gallery_urls.slice() : [];
  const images = (submission.files || []).filter((f: any) => /^image\//.test(f.type || '') || /\.(jpe?g|png|webp)$/i.test(f.name || '')).filter((f: any) => (f.size || 0) <= 25 * 1024 * 1024).slice(0, 12);
  for (const f of images) {
    const key = `listings/${l.id}/${submission.id.slice(0, 8)}-${String(f.path).split('/').pop()}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
      method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketId: BUCKET, sourceKey: f.path, destinationBucket: MEDIA_BUCKET, destinationKey: key }),
    });
    if (!r.ok) { console.error('copy to listing failed', await r.text()); continue; }
    const url = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${key}`;
    if (!gallery.includes(url)) gallery.push(url);
  }
  if (gallery.length !== (l.gallery_urls || []).length) patch.gallery_urls = gallery.slice(-60);
  if (Object.keys(patch).length) await db.from('listings').update(patch).eq('id', l.id);
  if (!c.featured_applied_at) await db.from('ve_bounty_campaigns').update({ featured_applied_at: nowIso() }).eq('id', c.id);
}
const eventKey = (b: any) => (b.event_id ? String(b.event_id) : 't:' + (b.event_title || b.id));
async function withEvents(rows: any[]) {
  const ids = [...new Set(rows.map((b) => b.event_id).filter(Boolean))];
  const { data: evs } = ids.length ? await db.from('events').select('id, title, starts_at, ends_at, location_name, address, city, state, ticket_url').in('id', ids) : { data: [] };
  const byId: Record<string, any> = {}; for (const e of evs || []) byId[e.id] = e;
  return rows.map((b) => {
    const e = b.event_id ? byId[b.event_id] || null : null;
    // The bounty's own clock wins: a CM can move it when the event moves.
    const event = e ? { id: e.id, title: e.title, starts_at: b.event_starts_at || e.starts_at, ends_at: b.event_ends_at || e.ends_at, location_name: e.location_name, city: e.city, ticket_url: e.ticket_url } : null;
    return { ...b, event, _address: e ? [e.location_name, e.address, e.city, e.state].filter(Boolean).join(', ') : '' };
  });
}
// Jobs on a campaign with no event row (a host night, an ongoing campaign) take the place and
// address from the campaign.
async function withCampaigns(rows: any[]) {
  const ids = [...new Set(rows.map((b) => b.campaign_id).filter(Boolean))];
  const { data: cs } = ids.length ? await db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).in('id', ids) : { data: [] };
  const byId: Record<string, any> = {}; for (const c of cs || []) byId[c.id] = c;
  const hosts = await hostListings((cs || []).map((c) => c.host_listing_id));
  return rows.map((b) => {
    const c = b.campaign_id ? byId[b.campaign_id] : null;
    if (!c) return { ...b, campaign: null };
    const host = c.host_listing_id ? hosts[c.host_listing_id] : null;
    const address = b._address || [c.place_name, c.address].filter(Boolean).join(', ');
    return { ...b, _address: address, campaign: { id: c.id, slug: c.slug, kind: c.kind, title: c.title, place_name: c.place_name, host: host ? { name: host.name, slug: host.slug } : null, meal: c.kind === 'place' } };
  });
}
const claimsOpen = (b: any) => b.status === 'open' && (!b.claims_close_at || Date.now() < ms(b.claims_close_at));
const eventStarted = (b: any) => !!b.event_starts_at && Date.now() >= ms(b.event_starts_at);
// Can this claim still upload and submit? Until the deadline; a change request runs its own 72 hours.
function workOpen(b: any, s: any) {
  if (!s || b.status === 'canceled') return false;
  const due = ms(b.due_at);
  if (s.status === 'changes') return Date.now() < Math.max(isNaN(due) ? 0 : due, ms(s.changes_due_at) || 0);
  if (s.status === 'claimed' || s.status === 'submitted') return isNaN(due) || Date.now() < due;
  return false;
}
const shapeMine = (s: any) => s ? { id: s.id, status: s.status, parts_done: s.parts_done || [], note: s.note, links: s.links, files: (s.files || []).map((f: any) => ({ path: f.path, name: f.name, size: f.size, type: f.type })), review_note: s.review_note, coaching_note: s.coaching_note, points_awarded: s.points_awarded, submitted_at: s.submitted_at, claimed_at: s.claimed_at, revisions: s.revisions, changes_due_at: s.changes_due_at, auto_submitted: s.auto_submitted } : null;
async function takenCounts(ids: string[]) {
  const out: Record<string, number> = {};
  if (!ids.length) return out;
  const { data } = await db.from('ve_bounty_submissions').select('bounty_id').in('bounty_id', ids).neq('status', 'released');
  for (const r of data || []) out[r.bounty_id] = (out[r.bounty_id] || 0) + 1;
  return out;
}
async function standing(memberId: string) {
  const { data } = await db.rpc('ve_bounty_standing', { p_member: memberId });
  return data || { ok: true };
}
// May this person read and post in an event's Q&A?
async function threadAccess(v: Viewer, b: any): Promise<'staff' | 'claimer' | null> {
  if (!v) return null;
  if ((await reviewCities(v)).includes(b.community_slug)) return 'staff';
  const { data: peers } = await db.from('ve_bounties').select('id, event_id, event_title').eq('community_slug', b.community_slug);
  const ids = (peers || []).filter((p) => eventKey(p) === eventKey(b)).map((p) => p.id);
  if (!ids.length) return null;
  const { data: mine } = await db.from('ve_bounty_submissions').select('id').eq('member_id', v.id).in('bounty_id', ids).in('status', ACTIVE).limit(1);
  return mine && mine.length ? 'claimer' : null;
}
async function loadThread(b: any) {
  const { data: msgs } = await db.from('ve_bounty_messages').select('id, member_id, body, staff, created_at').eq('community_slug', b.community_slug).eq('event_key', eventKey(b)).order('created_at').limit(300);
  const ids = [...new Set((msgs || []).map((m) => m.member_id))];
  const { data: people } = ids.length ? await db.from('members').select('id, name').in('id', ids) : { data: [] };
  const who: Record<string, string> = {};
  for (const p of people || []) { const parts = String(p.name || 'Member').trim().split(/\s+/); who[p.id] = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : ''); }
  return (msgs || []).map((m) => ({ id: m.id, name: who[m.member_id] || 'Member', staff: m.staff, body: m.body, at: m.created_at }));
}

function when(iso: string | null | undefined, community: string) {
  return iso ? new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ[community] || 'America/New_York', timeZoneName: 'short' }) : '';
}
const P = (s: string) => `<p style="font-family:sans-serif;font-size:15px;line-height:1.6;margin:0 0 14px">${s}</p>`;
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY || !to) return;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [to], subject, html }),
    });
    if (!r.ok) console.error('Resend', await r.text());
  } catch (e) { console.error('Resend failed', e); }
}
async function memberContact(id: string) {
  const { data: m } = await db.from('members').select('email, name').eq('id', id).maybeSingle();
  return { email: m?.email || '', first: String(m?.name || '').split(' ')[0] || 'there' };
}
const bountyLink = (b: any) => `${SITE}/bounties?community=${b.community_slug}&id=${b.id}`;
// Send a notice once per claim; false if it already went out.
async function once(submissionId: string, kind: string) {
  const { error } = await db.from('ve_bounty_notices').insert({ submission_id: submissionId, kind });
  return !error;
}

async function cron() {
  const now = Date.now();
  // A host's 90-day featured run ends; listings featured some other way never carry featured_until.
  await db.from('listings').update({ is_featured: false, featured_until: null }).lt('featured_until', nowIso());
  const { data: subs } = await db.from('ve_bounty_submissions').select('*').in('status', ['claimed', 'changes']).limit(1000);
  if (!subs || !subs.length) return { checked: 0 };
  const { data: bs } = await db.from('ve_bounties').select(BOUNTY_COLS).in('id', [...new Set(subs.map((s) => s.bounty_id))]);
  const byId: Record<string, any> = {}; for (const b of bs || []) byId[b.id] = b;
  const out = { checked: subs.length, reminders: 0, no_shows: 0, auto_submitted: 0, lapsed: 0 };
  for (const s of subs) {
    const b = byId[s.bounty_id]; if (!b || b.status === 'canceled') continue;
    const due = ms(b.due_at), start = ms(b.event_starts_at), end = ms(b.event_ends_at) || start + 6 * HOUR;
    const link = bountyLink(b);
    if (s.status === 'changes') {
      // 72 hours passed with no resubmission: back to the reviewer, who decides with what is in hand.
      if (s.changes_due_at && now >= ms(s.changes_due_at)) {
        await db.from('ve_bounty_submissions').update({ status: 'submitted', updated_at: nowIso() }).eq('id', s.id).eq('status', 'changes');
        out.lapsed++;
      }
      continue;
    }
    const c = await memberContact(s.member_id);
    const hasWork = (s.files || []).length > 0 || (s.links || []).length > 0 || String(s.note || '').trim().length >= 200;
    if (!isNaN(due) && now >= due) {
      if (hasWork) {
        await db.from('ve_bounty_submissions').update({ status: 'submitted', submitted_at: nowIso(), auto_submitted: true, updated_at: nowIso() }).eq('id', s.id).eq('status', 'claimed');
        out.auto_submitted++;
        if (await once(s.id, 'auto_submitted')) await sendEmail(c.email, `We sent in your work: ${b.title}`,
          P(`Hi ${esc(c.first)},`) + P(`The deadline for <b>${esc(b.title)}</b> passed with your files uploaded but not submitted, so we sent them in for you. It is in review now.`) + P(`<a href="${link}">See your bounty</a>`));
      } else {
        await db.from('ve_bounty_submissions').update({ status: 'no_show', updated_at: nowIso() }).eq('id', s.id).eq('status', 'claimed');
        await db.from('ve_bounty_strikes').insert({ member_id: s.member_id, submission_id: s.id, bounty_id: b.id, reason: 'no_show', weight: 1 });
        out.no_shows++;
        const st = await standing(s.member_id);
        const conseq = st.paused ? 'Your access to bounties is paused until a Community Manager restores it.' : st.until ? `You can claim bounties again after ${new Date(st.until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: TZ[b.community_slug] || 'America/New_York' })}.` : '';
        if (await once(s.id, 'no_show')) await sendEmail(c.email, `Missed deadline: ${b.title}`,
          P(`Hi ${esc(c.first)},`) + P(`The deadline for <b>${esc(b.title)}</b> passed and nothing was submitted, so the spot counts as a no-show. ${conseq}`) + P(`If something happened, reply to this email and tell us. Your Community Manager can clear it.`));
      }
      continue;
    }
    // Reminders: send the latest one that applies, and mark the earlier ones done.
    const steps: [string, boolean, string, string][] = [
      ['week_before', !isNaN(start) && now >= start - 7 * DAY && now < start - DAY && ms(s.claimed_at) < start - 7 * DAY,
        `One week out: ${b.title}`, `<b>${esc(b.event_title || b.title)}</b> is one week away (${esc(when(b.event_starts_at, b.community_slug))}). Read your rundown again, check the Q&amp;A, and charge your batteries.`],
      ['day_before', !isNaN(start) && now >= start - DAY && now < start,
        `Tomorrow: ${b.title}`, `<b>${esc(b.event_title || b.title)}</b> is tomorrow (${esc(when(b.event_starts_at, b.community_slug))}). Remember the yes on camera from anyone you feature. Questions close when the event starts.`],
      ['upload_open', !isNaN(start) && now >= end + 12 * HOUR && now < due - 2 * DAY,
        `Your upload window is open: ${b.title}`, `Thanks for showing up. Upload your work for <b>${esc(b.title)}</b> any time before ${esc(when(b.due_at, b.community_slug))}.`],
      ['deadline_48h', !isNaN(due) && now >= due - 2 * DAY && now < due && !hasWork,
        `48 hours left: ${b.title}`, `Your work for <b>${esc(b.title)}</b> is due ${esc(when(b.due_at, b.community_slug))}. If you can't deliver, you can still release your spot, but a missed deadline pauses your bounties.`],
    ];
    let pick = -1; steps.forEach((x, i) => { if (x[1]) pick = i; });
    if (pick < 0) continue;
    for (let i = 0; i < pick; i++) await once(s.id, steps[i][0]);
    if (await once(s.id, steps[pick][0])) {
      await sendEmail(c.email, steps[pick][2], P(`Hi ${esc(c.first)},`) + P(steps[pick][3]) + P(`<a href="${link}">Open your bounty</a>`));
      out.reminders++;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  if (body.action === 'cron') {
    const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
    if (!sec?.value || req.headers.get('x-cron-secret') !== sec.value) return json({ error: 'forbidden' }, 403);
    return json(await cron());
  }

  const viewer = await loadViewer(req);
  const viewerInfo = async () => viewer ? { signed_in: true, passport: viewer.passport, standing: await standing(viewer.id) } : { signed_in: false };

  switch (body.action) {
    case 'list': {
      if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to see bounties.' }, 401);
      const community = clean(body.community, 40);
      if (!cityOk(viewer, community)) return json({ error: 'bad_community' }, 400);
      const { data } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('community_slug', community).in('status', ['open', 'closed']).order('sort');
      let mine: Record<string, any> = {};
      if (viewer && (data || []).length) {
        const { data: subs } = await db.from('ve_bounty_submissions').select('bounty_id, status, points_awarded').eq('member_id', viewer.id).in('bounty_id', (data || []).map((b) => b.id));
        for (const s of subs || []) mine[s.bounty_id] = s;
      }
      // Past the deadline, a bounty only stays on the list for the people who claimed it.
      const rows = (data || []).filter((b) => (b.status === 'open' && (!b.due_at || Date.now() < ms(b.due_at))) || (mine[b.id] && mine[b.id].status !== 'released'));
      const bounties = await withCampaigns(await withEvents(rows));
      const taken = await takenCounts(bounties.map((b) => b.id));
      const shaped = bounties.map(({ _address, ...b }) => ({ ...b, taken: taken[b.id] || 0, spots_left: b.slots == null ? null : Math.max(0, b.slots - (taken[b.id] || 0)), claims_open: claimsOpen(b), mine: mine[b.id] || null }));
      // Campaign cards, soonest deadline first (Sean, 2026-10-04).
      const cids = [...new Set(shaped.map((b) => b.campaign_id).filter(Boolean))];
      const { data: cs } = cids.length ? await db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).in('id', cids) : { data: [] };
      const hosts = await hostListings((cs || []).map((c) => c.host_listing_id));
      const campaigns = (cs || []).map((c) => shapeCampaign(c, shaped.filter((b) => b.campaign_id === c.id), c.host_listing_id ? hosts[c.host_listing_id] : null))
        .sort((a, b) => a.deadline - b.deadline || a.title.localeCompare(b.title));
      return json({ campaigns, bounties: shaped, viewer: await viewerInfo() });
    }

    case 'get': {
      if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to see bounties.' }, 401);
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: raw } = await db.from('ve_bounties').select(BOUNTY_COLS + ', event_details').eq('id', body.id).maybeSingle();
      if (!raw || raw.status === 'draft' || !cityOk(viewer, raw.community_slug)) return json({ error: 'not_found' }, 404);
      const [b] = await withCampaigns(await withEvents([raw]));
      const taken = (await takenCounts([b.id]))[b.id] || 0;
      let mine: any = null, s: any = null;
      if (viewer) {
        const { data } = await db.from('ve_bounty_submissions').select('*').eq('bounty_id', b.id).eq('member_id', viewer.id).maybeSingle();
        s = data; mine = shapeMine(s);
      }
      const holds = !!s && ACTIVE.includes(s.status);
      const access = holds ? 'claimer' : await threadAccess(viewer, b);
      let rundown = null, thread = null, details = null;
      if (holds || access === 'staff') {
        const { data: r } = await db.from('ve_bounty_rundowns').select('title, intro, sections, links').eq('kind', b.kind).maybeSingle();
        rundown = r || null;
        details = { address: b._address, notes: b.event_details || null };
        thread = { messages: await loadThread(b), open: access === 'staff' || !eventStarted(b) };
      }
      const { _address, event_details, ...pub } = b;
      return json({
        bounty: { ...pub, taken, spots_left: b.slots == null ? null : Math.max(0, b.slots - taken), claims_open: claimsOpen(b), work_open: workOpen(b, s) },
        mine, rundown, details, thread, viewer: await viewerInfo(),
      });
    }

    case 'claim': {
      if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to claim a bounty.' }, 401);
      if (!isId(body.bounty_id)) return json({ error: 'bad_id' }, 400);
      if (!viewer.passport) return json({ error: 'passport', message: 'Bounties are for Passport holders. Get your Passport to claim a spot.' }, 403);
      // A host night seats a set number of creators across all its jobs.
      const { data: cb } = await db.from('ve_bounties').select('campaign_id, community_slug').eq('id', body.bounty_id).maybeSingle();
      if (cb && !cityOk(viewer, cb.community_slug)) return json({ error: 'not_found' }, 404);
      if (cb?.campaign_id) {
        const { data: camp } = await db.from('ve_bounty_campaigns').select('creator_cap').eq('id', cb.campaign_id).maybeSingle();
        if (camp?.creator_cap) {
          const { data: sib } = await db.from('ve_bounties').select('id').eq('campaign_id', cb.campaign_id);
          const { data: held } = await db.from('ve_bounty_submissions').select('member_id').in('bounty_id', (sib || []).map((x) => x.id)).neq('status', 'released');
          const people = new Set((held || []).map((h) => h.member_id));
          if (!people.has(viewer.id) && people.size >= camp.creator_cap) return json({ error: 'full', message: `This one seats ${camp.creator_cap} creators and every seat is taken.` }, 409);
        }
      }
      const { data: r, error } = await db.rpc('ve_bounty_claim', { p_bounty: body.bounty_id, p_member: viewer.id });
      if (error) return json({ error: 'claim_failed', message: error.message }, 500);
      if (r?.error) {
        const st = r.standing || {};
        const msg: Record<string, string> = {
          claims_closed: 'Claims for this bounty are closed.',
          already_claimed: 'You already hold a spot on this one.',
          full: 'Every spot is taken. Spots reopen if someone releases theirs before claims close.',
          event_limit: 'You can hold up to 2 bounties per event, so more people get a turn.',
          not_eligible: st.paused ? 'Your bounties are paused after missed deadlines. Reply to your strike email or ask your Community Manager.' : `You can claim bounties again after ${st.until ? new Date(st.until).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'your cooldown'}.`,
          not_found: 'This bounty is not available.',
        };
        return json({ error: r.error, message: msg[r.error] || 'That did not go through.' }, 409);
      }
      const { data: b } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.bounty_id).maybeSingle();
      if (b && r?.submission_id && await once(r.submission_id, 'claimed')) {
        const c = await memberContact(viewer.id);
        await sendEmail(c.email, `Your spot is held: ${b.title}`,
          P(`Hi ${esc(c.first)},`) +
          P(`You claimed <b>${esc(b.title)}</b> (${b.points.toLocaleString()} points). Your rundown, the event details and the Q&amp;A are on the bounty page: what we need, how to shoot it, and how to get people's yes on camera.`) +
          P(`<b>Event:</b> ${esc(when(b.event_starts_at, b.community_slug))}<br><b>Due:</b> ${esc(when(b.due_at, b.community_slug))}`) +
          P(`Can't make it? Release your spot before ${esc(when(b.claims_close_at, b.community_slug))} so someone else can take it.`) +
          P(`<a href="${bountyLink(b)}">Open your rundown</a>`));
      }
      return json({ ok: true });
    }

    case 'release':
    case 'upload_url':
    case 'file_added':
    case 'file_remove':
    case 'submit': {
      if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in first.' }, 401);
      if (!isId(body.bounty_id)) return json({ error: 'bad_id' }, 400);
      const { data: b } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.bounty_id).maybeSingle();
      if (!b || b.status === 'draft') return json({ error: 'not_found' }, 404);
      const { data: s } = await db.from('ve_bounty_submissions').select('*').eq('bounty_id', b.id).eq('member_id', viewer.id).maybeSingle();
      if (!s || !['claimed', 'submitted', 'changes'].includes(s.status)) return json({ error: 'not_claimed', message: 'Claim a spot first.' }, 409);
      const prefix = `${b.id}/${viewer.id}/`;
      const files: any[] = Array.isArray(s.files) ? s.files : [];

      if (body.action === 'release') {
        if (s.status !== 'claimed') return json({ error: 'submitted', message: 'Your work is already in, so the spot stays yours.' }, 409);
        const late = !claimsOpen(b) && b.status !== 'canceled';
        if (files.length) await db.storage.from(BUCKET).remove(files.map((f) => f.path));
        await db.from('ve_bounty_submissions').update({ status: 'released', released_at: nowIso(), files: [], links: [], note: null, updated_at: nowIso() }).eq('id', s.id);
        if (late) await db.from('ve_bounty_strikes').insert({ member_id: viewer.id, submission_id: s.id, bounty_id: b.id, reason: 'late_release', weight: 0.5 });
        return json({ ok: true, late });
      }
      if (!workOpen(b, s)) return json({ error: 'closed', message: 'The deadline for this bounty has passed.' }, 409);

      if (body.action === 'upload_url') {
        const size = Number(body.size) || 0;
        if (files.length >= MAX_FILES) return json({ error: 'too_many', message: `Up to ${MAX_FILES} files per bounty.` }, 400);
        if (size <= 0 || size > MAX_BYTES) return json({ error: 'too_big', message: 'Each file can be up to 2 GB. Share bigger files as a link.' }, 400);
        const name = clean(body.name, 160).replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-') || 'file';
        const path = prefix + crypto.randomUUID().slice(0, 8) + '-' + name;
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) return json({ error: 'upload_failed', message: error?.message }, 500);
        return json({ url: data.signedUrl, path });
      }
      if (body.action === 'file_added') {
        const path = clean(body.path, 400);
        if (!path.startsWith(prefix)) return json({ error: 'bad_path' }, 400);
        if (!files.some((f) => f.path === path)) {
          files.push({ path, name: clean(body.name, 160), size: Number(body.size) || 0, type: clean(body.type, 100), at: nowIso() });
          await db.from('ve_bounty_submissions').update({ files, updated_at: nowIso() }).eq('id', s.id);
        }
        return json({ ok: true, files: files.length });
      }
      if (body.action === 'file_remove') {
        const path = clean(body.path, 400);
        if (!path.startsWith(prefix)) return json({ error: 'bad_path' }, 400);
        await db.storage.from(BUCKET).remove([path]);
        const left = files.filter((f) => f.path !== path);
        await db.from('ve_bounty_submissions').update({ files: left, updated_at: nowIso() }).eq('id', s.id);
        return json({ ok: true, files: left.length });
      }
      // submit
      if (body.license !== true) return json({ error: 'license', message: 'Tick the box to confirm this is your own work and Vegans Explore may use it.' }, 400);
      const note = clean(body.note, 10000);
      const links = (Array.isArray(body.links) ? body.links : []).map((l: unknown) => clean(l, 1000)).filter(isUrl).slice(0, 50);
      if (!files.length && !links.length && note.length < 200) return json({ error: 'empty', message: 'Add your files, a link, or your write-up before you submit.' }, 400);
      // A bundle pays only when every part is done (Sean, 2026-10-04).
      const parts: string[] = b.parts || [];
      const done = (Array.isArray(body.parts_done) ? body.parts_done : []).map((n: unknown) => Math.floor(Number(n))).filter((n: number) => n >= 0 && n < parts.length);
      if (parts.length && new Set(done).size < parts.length) return json({ error: 'parts', message: 'This job needs every part done. Tick each one when it is in your upload.' }, 400);
      await db.from('ve_bounty_submissions').update({ note: note || null, links, parts_done: [...new Set(done)], status: 'submitted', submitted_at: nowIso(), license_at: nowIso(), updated_at: nowIso() }).eq('id', s.id);
      return json({ ok: true, status: 'submitted' });
    }

    case 'thread':
    case 'ask': {
      if (!viewer) return json({ error: 'not_authenticated' }, 401);
      if (!isId(body.bounty_id)) return json({ error: 'bad_id' }, 400);
      const { data: b } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.bounty_id).maybeSingle();
      if (!b) return json({ error: 'not_found' }, 404);
      const access = await threadAccess(viewer, b);
      if (!access) return json({ error: 'forbidden', message: 'The Q&A is for people who claimed a spot.' }, 403);
      if (body.action === 'ask') {
        const text = clean(body.body, 2000);
        if (!text) return json({ error: 'empty', message: 'Write your question first.' }, 400);
        if (access !== 'staff' && eventStarted(b)) return json({ error: 'closed', message: 'Questions closed when the event started.' }, 409);
        await db.from('ve_bounty_messages').insert({ community_slug: b.community_slug, event_key: eventKey(b), member_id: viewer.id, body: text, staff: access === 'staff' });
      }
      return json({ messages: await loadThread(b), open: access === 'staff' || !eventStarted(b), staff: access === 'staff' });
    }

    case 'review_list': {
      const cities = await reviewCities(viewer);
      if (!cities.length) return json({ error: 'forbidden' }, 403);
      const { data: braw } = await db.from('ve_bounties').select(BOUNTY_COLS + ', event_details').in('community_slug', cities).neq('status', 'draft').order('sort');
      const bounties = await withEvents(braw || []);
      const ids = bounties.map((b) => b.id);
      const none = ['00000000-0000-0000-0000-000000000000'];
      const { data: all } = await db.from('ve_bounty_submissions').select('id, bounty_id, member_id, status, submitted_at, claimed_at, coaching_note, reviewed_at, points_awarded').in('bounty_id', ids.length ? ids : none);
      const counts: Record<string, number> = {};
      for (const r of all || []) counts[r.status] = (counts[r.status] || 0) + 1;
      const status = clean(body.status, 20);
      const want = ['submitted', 'changes', 'approved', 'rejected', 'claimed', 'no_show'].includes(status) ? status : 'submitted';
      const { data: subs } = await db.from('ve_bounty_submissions').select('*').in('bounty_id', ids.length ? ids : none).eq('status', want).order('submitted_at', { ascending: true, nullsFirst: false }).limit(200);
      const memberIds = [...new Set((all || []).map((s) => s.member_id))];
      const { data: people } = memberIds.length ? await db.from('members').select('id, name, email').in('id', memberIds) : { data: [] };
      const who: Record<string, any> = {}; for (const p of people || []) who[p.id] = p;
      const { data: strikes } = memberIds.length ? await db.from('ve_bounty_strikes').select('id, member_id, reason, weight, created_at, cleared_at').in('member_id', memberIds).order('created_at', { ascending: false }) : { data: [] };
      const byBounty: Record<string, any> = {}; for (const b of bounties) byBounty[b.id] = b;
      const history = (memberId: string, except: string) => ({
        coaching: (all || []).filter((x) => x.member_id === memberId && x.id !== except && x.coaching_note).map((x) => ({ bounty: byBounty[x.bounty_id]?.title || '', note: x.coaching_note, at: x.reviewed_at })),
        strikes: (strikes || []).filter((x) => x.member_id === memberId),
      });
      const out = [];
      for (const s of subs || []) {
        const files = [];
        for (const f of (s.files || [])) {
          const { data } = await db.storage.from(BUCKET).createSignedUrl(f.path, 3600);
          files.push({ name: f.name, size: f.size, type: f.type, url: data?.signedUrl || null });
        }
        const waited = s.submitted_at ? Math.floor((Date.now() - ms(s.submitted_at)) / DAY) : 0;
        const b = byBounty[s.bounty_id] || null;
        out.push({ ...shapeMine(s), files, overdue: s.status === 'submitted' && waited >= REVIEW_SLA_DAYS, waited_days: waited, bounty: b ? { id: b.id, title: b.title, points: b.points, kind: b.kind, parts: b.parts || [] } : null, member: who[s.member_id] ? { name: who[s.member_id].name, email: who[s.member_id].email } : null, history: history(s.member_id, s.id) });
      }
      // Events: spots, who holds them, the Q&A, and the controls to edit, move or cancel.
      const events: Record<string, any> = {};
      for (const b of bounties) {
        const k = eventKey(b);
        const e = events[k] || (events[k] = { key: k, bounty_id: b.id, community: b.community_slug, title: b.event?.title || b.event_title || b.title, starts_at: b.event_starts_at, ends_at: b.event_ends_at, claims_close_at: b.claims_close_at, due_at: b.due_at, status: b.status, details: b.event_details || '', address: b._address, bounties: [], unanswered: 0, messages: 0 });
        const holders = (all || []).filter((x) => x.bounty_id === b.id && x.status !== 'released').map((x) => ({ id: x.id, name: who[x.member_id]?.name || 'Member', status: x.status }));
        e.bounties.push({ id: b.id, title: b.title, kind: b.kind, points: b.points, slots: b.slots, holders });
      }
      for (const e of Object.values(events)) {
        const { data: msgs } = await db.from('ve_bounty_messages').select('staff').eq('community_slug', e.community).eq('event_key', e.key).order('created_at');
        e.messages = (msgs || []).length;
        let n = 0; for (const m of msgs || []) n = m.staff ? 0 : n + 1;
        e.unanswered = n;
      }
      const openStrikes = (strikes || []).filter((x) => !x.cleared_at).map((x) => ({ ...x, member: who[x.member_id]?.name || 'Member' }));
      return json({ submissions: out, events: Object.values(events), counts, strikes: openStrikes, sla_days: REVIEW_SLA_DAYS });
    }

    case 'review': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: s } = await db.from('ve_bounty_submissions').select('id, bounty_id, member_id, status, revisions, parts_done, files').eq('id', body.id).maybeSingle();
      if (!s) return json({ error: 'not_found' }, 404);
      const { data: b } = await db.from('ve_bounties').select('id, community_slug, title, points, parts, campaign_id').eq('id', s.bounty_id).maybeSingle();
      if (!b || !(await reviewCities(viewer)).includes(b.community_slug)) return json({ error: 'forbidden' }, 403);
      if (!['submitted', 'changes'].includes(s.status)) return json({ error: 'not_reviewable', message: 'This one is not waiting on a review.' }, 409);
      const note = clean(body.note, 2000) || null;
      const coaching = clean(body.coaching, 2000) || null;
      const decision = body.decision;
      const c = await memberContact(s.member_id);
      const link = bountyLink(b);
      const coachHtml = coaching ? P(`<b>For next time:</b> ${esc(coaching)}`) : '';
      if (decision === 'approve') {
        if ((b.parts || []).length && new Set(s.parts_done || []).size < b.parts.length) return json({ error: 'parts', message: 'Every part of this job has to be done before it pays. Ask for changes instead.' }, 409);
        const points = body.points == null || body.points === '' ? b.points : Math.round(Number(body.points));
        if (!(points >= 1 && points <= b.points)) return json({ error: 'bad_points', message: `Points must be between 1 and ${b.points}.` }, 400);
        if (points < b.points && !note) return json({ error: 'note', message: 'Say why it is paying fewer points.' }, 400);
        const { data: paid, error } = await db.rpc('ve_bounty_pay', { p_submission: s.id, p_reviewer: viewer!.id, p_points: points });
        if (error) return json({ error: 'pay_failed', message: error.message }, 500);
        if (paid?.error) return json({ error: paid.error, message: paid.error === 'cap_reached' ? 'This bounty has paid out all its spots.' : 'Could not pay it.' }, 409);
        await db.from('ve_bounty_submissions').update({ review_note: note, coaching_note: coaching, changes_due_at: null }).eq('id', s.id);
        if (paid?.awarded && b.campaign_id) {
          const { data: camp } = await db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).eq('id', b.campaign_id).maybeSingle();
          try { await applyHost(camp, s); } catch (e) { console.error('applyHost', e); }
        }
        if (paid?.awarded) await sendEmail(c.email, `You earned ${points.toLocaleString()} points: ${b.title}`,
          P(`Hi ${esc(c.first)},`) + P(`Your work for <b>${esc(b.title)}</b> is approved, and <b>${points.toLocaleString()} points</b> are in your account${points < b.points ? ` (of ${b.points.toLocaleString()})` : ''}. Thank you for showing up for your city.`) + (note ? P(esc(note)) : '') + coachHtml + P(`<a href="${link}">See your bounties</a>`));
        return json({ ok: true, ...paid });
      }
      if (decision === 'changes') {
        if (!note) return json({ error: 'note', message: 'Say what needs to change.' }, 400);
        if ((s.revisions || 0) >= MAX_REVISIONS) return json({ error: 'max_revisions', message: 'Both rounds of changes are used. Approve it (full or fewer points) or decline.' }, 409);
        const changesDue = new Date(Date.now() + 72 * HOUR).toISOString();
        await db.from('ve_bounty_submissions').update({ status: 'changes', revisions: (s.revisions || 0) + 1, changes_due_at: changesDue, review_note: note, coaching_note: coaching, reviewed_by: viewer!.id, reviewed_at: nowIso(), updated_at: nowIso() }).eq('id', s.id);
        await sendEmail(c.email, `A note on your bounty: ${b.title}`,
          P(`Hi ${esc(c.first)},`) + P(`Thanks for your work on <b>${esc(b.title)}</b>. Before we can approve it, we need a few changes:`) + P(esc(note)) + coachHtml +
          P(`You have until ${esc(when(changesDue, b.community_slug))} to send the update.`) + P(`<a href="${link}">Open the bounty</a>`));
        return json({ ok: true, changes_due_at: changesDue });
      }
      if (decision === 'reject' || decision === 'violation') {
        if (decision === 'violation' && !note) return json({ error: 'note', message: 'Say what was wrong (recycled footage, someone else\'s work).' }, 400);
        await db.from('ve_bounty_submissions').update({ status: 'rejected', review_note: note, coaching_note: coaching, changes_due_at: null, reviewed_by: viewer!.id, reviewed_at: nowIso(), updated_at: nowIso() }).eq('id', s.id);
        if (decision === 'violation') {
          await db.from('ve_bounty_strikes').insert({ member_id: s.member_id, submission_id: s.id, bounty_id: b.id, reason: 'violation', weight: 3 });
        }
        await sendEmail(c.email, `About your bounty: ${b.title}`,
          P(`Hi ${esc(c.first)},`) + P(`Thank you for your work on <b>${esc(b.title)}</b>. We are not able to approve this one.`) + (note ? P(esc(note)) : '') + coachHtml +
          (decision === 'violation' ? P('Bounties are for your own work, made at the event. Your access to bounties is paused. If you think this is a mistake, reply to this email.') : '') + P(`<a href="${link}">Open the bounty</a>`));
        return json({ ok: true });
      }
      return json({ error: 'bad_decision' }, 400);
    }

    case 'strike_clear': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const cities = await reviewCities(viewer);
      if (!cities.length) return json({ error: 'forbidden' }, 403);
      const { data: st } = await db.from('ve_bounty_strikes').select('id, bounty_id, cleared_at').eq('id', body.id).maybeSingle();
      if (!st) return json({ error: 'not_found' }, 404);
      const { data: b } = st.bounty_id ? await db.from('ve_bounties').select('community_slug').eq('id', st.bounty_id).maybeSingle() : { data: null };
      if (!viewer!.admin && !(b && cities.includes(b.community_slug))) return json({ error: 'forbidden' }, 403);
      await db.from('ve_bounty_strikes').update({ cleared_at: nowIso(), cleared_by: viewer!.id, cleared_note: clean(body.note, 1000) || null }).eq('id', st.id);
      return json({ ok: true });
    }

    case 'event_update': {
      if (!isId(body.bounty_id)) return json({ error: 'bad_id' }, 400);
      const { data: b0 } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.bounty_id).maybeSingle();
      if (!b0 || !(await reviewCities(viewer)).includes(b0.community_slug)) return json({ error: 'forbidden' }, 403);
      const { data: peers } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('community_slug', b0.community_slug).neq('status', 'draft');
      const group = (peers || []).filter((p) => eventKey(p) === eventKey(b0));
      const ids = group.map((p) => p.id);
      const patch: Record<string, unknown> = { updated_at: nowIso() };
      if (typeof body.details === 'string') patch.event_details = clean(body.details, 6000) || null;
      let notice: 'canceled' | 'moved' | null = null;
      if (body.cancel === true) { patch.status = 'canceled'; notice = 'canceled'; }
      else if (body.starts_at) {
        const start = ms(body.starts_at), end = body.ends_at ? ms(body.ends_at) : start + 6 * HOUR;
        if (isNaN(start) || isNaN(end) || end < start) return json({ error: 'bad_time', message: 'Check the new start and end times.' }, 400);
        Object.assign(patch, { event_starts_at: new Date(start).toISOString(), event_ends_at: new Date(end).toISOString(), claims_close_at: new Date(start - 2 * DAY).toISOString(), due_at: new Date(end + 7 * DAY).toISOString() });
        notice = 'moved';
      }
      await db.from('ve_bounties').update(patch).in('id', ids);
      if (notice) {
        const { data: holders } = await db.from('ve_bounty_submissions').select('id, member_id, bounty_id, status, files').in('bounty_id', ids).in('status', notice === 'canceled' ? ['claimed', 'submitted', 'changes'] : ['claimed']);
        for (const h of holders || []) {
          const hb = group.find((g) => g.id === h.bounty_id)!;
          const c = await memberContact(h.member_id);
          if (notice === 'canceled') {
            if (h.status === 'claimed') {
              if ((h.files || []).length) await db.storage.from(BUCKET).remove(h.files.map((f: any) => f.path));
              await db.from('ve_bounty_submissions').update({ status: 'released', released_at: nowIso(), files: [], updated_at: nowIso() }).eq('id', h.id);
            }
            await sendEmail(c.email, `Canceled: ${hb.event_title || hb.title}`, P(`Hi ${esc(c.first)},`) + P(`<b>${esc(hb.event_title || hb.title)}</b> is canceled, so your bounty <b>${esc(hb.title)}</b> is closed. Nothing counts against you. Thank you for stepping up; we will see you at the next one.`));
          } else {
            await sendEmail(c.email, `New date: ${hb.event_title || hb.title}`, P(`Hi ${esc(c.first)},`) +
              P(`<b>${esc(hb.event_title || hb.title)}</b> has moved to ${esc(when(patch.event_starts_at as string, hb.community_slug))}. Your work is now due ${esc(when(patch.due_at as string, hb.community_slug))}.`) +
              P(`Can you still make it? If not, release your spot before ${esc(when(patch.claims_close_at as string, hb.community_slug))} and nothing counts against you.`) + P(`<a href="${bountyLink(hb)}">Open your bounty</a>`));
            await db.from('ve_bounty_notices').delete().eq('submission_id', h.id).in('kind', ['week_before', 'day_before', 'upload_open', 'deadline_48h']);
          }
        }
      }
      return json({ ok: true, updated: ids.length });
    }

    // ---- Campaigns: leadership proposes, the city's Community Manager decides -----------------
    case 'campaign_admin_list': {
      if (!viewer?.leader) return json({ error: 'forbidden' }, 403);
      const cities = await reviewCities(viewer);
      let q = db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).order('created_at', { ascending: false }).limit(200);
      if (!viewer.admin) q = cities.length ? q.or(`community_slug.in.(${cities.join(',')}),proposed_by.eq.${viewer.id}`) : q.eq('proposed_by', viewer.id);
      const { data: cs } = await q;
      const ids = (cs || []).map((c) => c.id);
      const { data: jobs } = ids.length ? await db.from('ve_bounties').select(BOUNTY_COLS + ', event_details').in('campaign_id', ids).order('sort') : { data: [] };
      const taken = await takenCounts((jobs || []).map((b) => b.id));
      const hosts = await hostListings((cs || []).map((c) => c.host_listing_id));
      const people = [...new Set((cs || []).flatMap((c) => [c.proposed_by, c.host_member_id]).filter(Boolean))];
      const { data: ms2 } = people.length ? await db.from('members').select('id, name, email, membership_status').in('id', people) : { data: [] };
      const who: Record<string, any> = {}; for (const m of ms2 || []) who[m.id] = m;
      const { data: wve } = await db.from('campaigns').select('id, initiative_slug, capsule_content').not('initiative_slug', 'is', null);
      const out = [];
      for (const c of cs || []) {
        const h = c.host_listing_id ? hosts[c.host_listing_id] : null, hm = c.host_member_id ? who[c.host_member_id] : null;
        out.push({
          ...c, can_decide: await canDecide(viewer, c.community_slug),
          proposer: c.proposed_by && who[c.proposed_by] ? who[c.proposed_by].name : null,
          host: h ? { id: h.id, name: h.name, slug: h.slug, city: h.address_city, featured: h.is_featured, featured_until: h.featured_until, photos: (h.gallery_urls || []).length } : null,
          host_member: hm ? { name: hm.name, email: hm.email, active: hm.membership_status === 'active' } : null,
          jobs: (jobs || []).filter((b) => b.campaign_id === c.id).map((b) => ({ id: b.id, kind: b.kind, title: b.title, points: b.points, slots: b.slots, brief: b.brief, deliverable: b.deliverable, parts: b.parts || [], status: b.status, taken: taken[b.id] || 0 })),
          details: ((jobs || []).find((b) => b.campaign_id === c.id) || {}).event_details || '',
        });
      }
      return json({
        campaigns: out, cities, admin: viewer.admin, extras: HOST_EXTRAS,
        families: (wve || []).map((x) => ({ id: x.id, title: x.capsule_content?.title || x.initiative_slug })),
      });
    }

    case 'listing_search': {
      if (!viewer?.leader) return json({ error: 'forbidden' }, 403);
      const qy = clean(body.q, 80).replace(/[%,()]/g, ' ').trim();
      if (qy.length < 2) return json({ listings: [] });
      const { data } = await db.from('listings').select('id, name, slug, address_city, address_state, owner_member_id, claimed_by_member_id').ilike('name', `%${qy}%`).eq('status', 'approved').limit(12);
      const mids = [...new Set((data || []).flatMap((l) => [l.owner_member_id, l.claimed_by_member_id]).filter(Boolean))];
      const { data: mm } = mids.length ? await db.from('members').select('id, name, email, membership_status').in('id', mids) : { data: [] };
      const who: Record<string, any> = {}; for (const m of mm || []) who[m.id] = m;
      return json({ listings: (data || []).map((l) => {
        const m = who[l.claimed_by_member_id] || who[l.owner_member_id] || null;
        return { id: l.id, name: l.name, slug: l.slug, city: [l.address_city, l.address_state].filter(Boolean).join(', '), member: m ? { name: m.name, email: m.email, active: m.membership_status === 'active' } : null };
      }) });
    }

    case 'campaign_propose':
    case 'campaign_update': {
      if (!viewer?.leader) return json({ error: 'forbidden', message: 'Leadership members can propose campaigns.' }, 403);
      let c: any = null;
      if (body.action === 'campaign_update') {
        if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
        const { data } = await db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).eq('id', body.id).maybeSingle();
        if (!data) return json({ error: 'not_found' }, 404);
        const decider = await canDecide(viewer, data.community_slug);
        if (!decider && !(data.proposed_by === viewer.id && data.status === 'proposed')) return json({ error: 'forbidden', message: 'Only the city\'s Community Manager can change this now.' }, 403);
        c = data;
      }
      const community = c ? c.community_slug : clean(body.community, 40);
      if (!cityOk(viewer, community)) return json({ error: 'bad_community', message: 'Pick a city.' }, 400);
      const kind = c ? c.kind : clean(body.kind, 20);
      if (!TEMPLATES[kind]) return json({ error: 'bad_kind', message: 'Pick event, place or ongoing.' }, 400);
      const patch: Record<string, any> = { updated_at: nowIso() };
      const str = (k: string, n: number) => { if (typeof body[k] === 'string') patch[k] = clean(body[k], n) || null; };
      if (!c || typeof body.title === 'string') { const t = clean(body.title, 140); if (t.length < 3) return json({ error: 'title', message: 'Give it a name.' }, 400); patch.title = t; }
      str('story', 4000); str('place_name', 200); str('address', 300);
      if (typeof body.cover_url === 'string') { const u = clean(body.cover_url, 1000); if (u && !isUrl(u)) return json({ error: 'cover', message: 'The cover image needs to be a full web address.' }, 400); patch.cover_url = u || null; }
      for (const k of ['starts_at', 'ends_at', 'due_at']) if (k in body) { const t = body[k] ? ms(body[k]) : NaN; patch[k] = isNaN(t) ? null : new Date(t).toISOString(); }
      if ('creator_cap' in body) { const n = Math.floor(Number(body.creator_cap)); patch.creator_cap = n > 0 ? Math.min(n, 500) : null; }
      if ('campaign_id' in body) patch.campaign_id = isId(body.campaign_id) ? body.campaign_id : null;
      if ('event_id' in body) patch.event_id = isId(body.event_id) ? body.event_id : null;
      if ('host_listing_id' in body) patch.host_listing_id = isId(body.host_listing_id) ? body.host_listing_id : null;
      // The host is the listing's claimed owner unless an email names someone else.
      if (typeof body.host_email === 'string' && clean(body.host_email, 200)) {
        const { data: hm } = await db.from('members').select('id').ilike('email', clean(body.host_email, 200)).limit(1).maybeSingle();
        if (!hm) return json({ error: 'host_email', message: 'No member with that email yet. The host joins first (the one-time $11 membership).' }, 400);
        patch.host_member_id = hm.id;
      } else if (patch.host_listing_id && !(c && c.host_member_id)) {
        const { data: l } = await db.from('listings').select('owner_member_id, claimed_by_member_id').eq('id', patch.host_listing_id).maybeSingle();
        patch.host_member_id = l?.claimed_by_member_id || l?.owner_member_id || null;
      }
      if (Array.isArray(body.host_extras)) patch.host_extras = [...new Set(body.host_extras.filter((x: unknown) => HOST_EXTRAS.includes(String(x))))];
      if (kind === 'place' && !c && !patch.creator_cap) patch.creator_cap = 10;
      let row: any;
      if (!c) {
        const baseSlug = (clean(body.title, 140).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'campaign');
        let slug = baseSlug + '-' + crypto.randomUUID().slice(0, 4);
        const { data, error } = await db.from('ve_bounty_campaigns').insert({ ...patch, slug, community_slug: community, kind, status: 'proposed', proposed_by: viewer.id }).select(CAMPAIGN_COLS).single();
        if (error || !data) return json({ error: 'save_failed', message: error?.message || 'Could not save it.' }, 500);
        row = data;
        // Starting jobs from the template, as drafts until the campaign goes live.
        const jobs = TEMPLATES[kind].map((j, i) => ({ community_slug: community, campaign_id: row.id, event_id: row.event_id, event_title: row.title, kind: j.kind, title: `${row.title}: ${j.title}`, brief: j.brief, deliverable: j.deliverable, parts: j.parts || [], points: j.points, slots: kind === 'place' && j.kind === 'feature' ? (row.creator_cap || j.slots) : j.slots, status: 'draft', sort: 100 + i, created_by: viewer.id }));
        const { error: je } = await db.from('ve_bounties').insert(jobs);
        if (je) return json({ error: 'save_failed', message: je.message }, 500);
      } else {
        const { data, error } = await db.from('ve_bounty_campaigns').update(patch).eq('id', c.id).select(CAMPAIGN_COLS).single();
        if (error || !data) return json({ error: 'save_failed', message: error?.message || 'Could not save it.' }, 500);
        row = data;
        const jobPatch: Record<string, unknown> = { updated_at: nowIso() };
        if (patch.title && patch.title !== c.title) jobPatch.event_title = patch.title;
        if (typeof body.details === 'string') jobPatch.event_details = clean(body.details, 6000) || null;
        if ('event_id' in patch) jobPatch.event_id = patch.event_id;
        if (Object.keys(jobPatch).length > 1) await db.from('ve_bounties').update(jobPatch).eq('campaign_id', c.id);
        // A live campaign whose dates changed moves its jobs' clocks too (claimers keep their spots).
        if (row.status === 'open' && ['starts_at', 'ends_at', 'due_at'].some((k) => k in patch)) {
          const clk: any = campaignClocks(row);
          if (clk.error) return json({ error: 'dates', message: clk.error }, 400);
          await db.from('ve_bounties').update(clk).eq('campaign_id', c.id).neq('status', 'canceled');
          await db.from('ve_bounty_campaigns').update({ claims_close_at: clk.claims_close_at, due_at: clk.due_at }).eq('id', c.id);
        }
      }
      // Host extras that need creators become jobs (once each).
      if (row.kind === 'place' && (row.host_extras || []).length) {
        const { data: have } = await db.from('ve_bounties').select('kind').eq('campaign_id', row.id);
        const kinds = new Set((have || []).map((x) => x.kind));
        const add = (row.host_extras as string[]).map((x) => EXTRA_JOBS[x]).filter((j) => j && !kinds.has(j.kind)).map((j, i) => {
          const clk: any = row.status === 'open' ? campaignClocks(row) : {};
          return { community_slug: row.community_slug, campaign_id: row.id, event_id: row.event_id, event_title: row.title, kind: j.kind, title: `${row.title}: ${j.title}`, brief: j.brief, deliverable: j.deliverable, parts: [], points: j.points, slots: j.slots, status: row.status === 'open' ? 'open' : 'draft', sort: 150 + i, created_by: viewer.id, ...(clk.error ? {} : clk) };
        });
        if (add.length) await db.from('ve_bounties').insert(add);
      }
      // A Community Manager proposing for their own city can put it live in the same step.
      if (body.publish === true && body.action === 'campaign_propose' && await canDecide(viewer, community)) body.__decide = row.id;
      else return json({ ok: true, id: row.id, slug: row.slug, status: row.status });
    }
    // falls through to campaign_decide when publishing straight away
    case 'campaign_decide': {
      const id = body.__decide || body.id;
      if (!isId(id)) return json({ error: 'bad_id' }, 400);
      const { data: c } = await db.from('ve_bounty_campaigns').select(CAMPAIGN_COLS).eq('id', id).maybeSingle();
      if (!c) return json({ error: 'not_found' }, 404);
      if (!(await canDecide(viewer, c.community_slug))) return json({ error: 'forbidden', message: 'The city\'s Community Manager decides this one.' }, 403);
      const note = clean(body.note, 1000) || null;
      const decision = body.__decide ? 'approve' : body.decision;
      if (decision === 'decline') {
        if (c.status !== 'proposed') return json({ error: 'not_proposed', message: 'Only a proposal can be declined.' }, 409);
        await db.from('ve_bounty_campaigns').update({ status: 'declined', decided_by: viewer!.id, decided_at: nowIso(), decision_note: note, updated_at: nowIso() }).eq('id', c.id);
        return json({ ok: true, status: 'declined' });
      }
      if (decision === 'close') {
        await db.from('ve_bounty_campaigns').update({ status: 'closed', updated_at: nowIso() }).eq('id', c.id);
        await db.from('ve_bounties').update({ status: 'closed', updated_at: nowIso() }).eq('campaign_id', c.id).eq('status', 'open');
        return json({ ok: true, status: 'closed' });
      }
      if (decision !== 'approve') return json({ error: 'bad_decision' }, 400);
      if (!['proposed', 'closed'].includes(c.status)) return json({ error: 'not_proposed', message: 'This campaign is already ' + c.status + '.' }, 409);
      if (!c.story || c.story.length < 40) return json({ error: 'story', message: 'Write the campaign story first: what it is, why we are there, what creators get.' }, 400);
      if (c.kind === 'place') {
        if (!c.host_listing_id) return json({ error: 'host', message: 'Pick the host restaurant\'s listing first.' }, 400);
        const { data: hm } = c.host_member_id ? await db.from('members').select('membership_status').eq('id', c.host_member_id).maybeSingle() : { data: null };
        if (!hm || hm.membership_status !== 'active') return json({ error: 'host_member', message: 'The host has to be an active member (the one-time $11 membership) before this goes live.' }, 409);
      }
      const clk: any = campaignClocks(c);
      if (clk.error) return json({ error: 'dates', message: clk.error }, 400);
      await db.from('ve_bounty_campaigns').update({ status: 'open', claims_close_at: clk.claims_close_at, due_at: clk.due_at, decided_by: viewer!.id, decided_at: nowIso(), decision_note: note, updated_at: nowIso() }).eq('id', c.id);
      await db.from('ve_bounties').update({ ...clk, status: 'open', event_title: c.title, event_id: c.event_id, updated_at: nowIso() }).eq('campaign_id', c.id).in('status', ['draft', 'closed']);
      return json({ ok: true, status: 'open' });
    }

    case 'job_update': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: j } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.id).maybeSingle();
      if (!j) return json({ error: 'not_found' }, 404);
      const { data: c } = j.campaign_id ? await db.from('ve_bounty_campaigns').select('proposed_by, status').eq('id', j.campaign_id).maybeSingle() : { data: null };
      if (!(await canDecide(viewer, j.community_slug)) && !(c && c.proposed_by === viewer?.id && c.status === 'proposed')) return json({ error: 'forbidden' }, 403);
      const patch: Record<string, unknown> = { updated_at: nowIso() };
      if (typeof body.title === 'string' && clean(body.title, 160).length >= 3) patch.title = clean(body.title, 160);
      if (typeof body.brief === 'string') patch.brief = clean(body.brief, 4000);
      if (typeof body.deliverable === 'string') patch.deliverable = clean(body.deliverable, 400);
      if (body.points != null) { const n = Math.round(Number(body.points)); if (!(n >= 1 && n <= 10000)) return json({ error: 'points', message: 'Points are between 1 and 10,000.' }, 400); patch.points = n; }
      if ('slots' in body) { const n = Math.floor(Number(body.slots)); patch.slots = n > 0 ? Math.min(n, 500) : null; }
      if (Array.isArray(body.parts)) patch.parts = body.parts.map((x: unknown) => clean(x, 300)).filter(Boolean).slice(0, 12);
      if (body.remove === true) {
        const { data: held } = await db.from('ve_bounty_submissions').select('id').eq('bounty_id', j.id).neq('status', 'released').limit(1);
        if (held && held.length) return json({ error: 'held', message: 'Someone holds a spot on this job, so it stays.' }, 409);
        patch.status = 'canceled';
      }
      await db.from('ve_bounties').update(patch).eq('id', j.id);
      return json({ ok: true });
    }
  }
  return json({ error: 'unknown_action' }, 400);
});
