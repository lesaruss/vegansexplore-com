// ve-reach: the Directory Reach console (Sean, 2026-11-18; plan docs/plans/2026-11-18-directory-reach-boss.md; page /admin/depot/reach).
// Every approved listing hears from us once by Mon Dec 1. One roster (ve_reach_roster(): contact history from email_sends, engagement,
// replies, suppressions, campaign membership and KJ's log), KJ's week (follow ahead, then the DM, at Instagram's safe cap), the chapter
// scout, and her Done list. Instagram DMs cannot be read by our system (no API starts or reads DMs on shared access), so ve_reach_log,
// written from her taps, is the record. Tables in migration 20261118_ve_reach.sql (RLS on, service role only).
//
// Who: a super admin, or the holder of the Instagram Social Media Manager position (ve_position_people on
// social-media-manager-instagram, any stage from invited to active; not ended). Everyone else gets 403 and no data.
// v2 (2026-11-18, the panel's plan, docs/plans/2026-11-18-directory-reach-panel.md, Sean: "let's do this"; goal Sean: "250, lock it in"):
// the goal (members vs 250 by Dec 31, KJ's new members vs 60, claims vs 100), Told and Engaged never merged, tags apart as Notified, four
// taps, ramped caps enforced here (DMs 10 a day for her first three working days, then 15, then 20 after a clean week; follows 25; follower
// welcomes their own 10), inbound people ahead of outreach, openers by kind (first DM with no link, the page follow-up, the welcome).
// v3 (2026-11-18, Sean: "go with feature first"; panel docs/plans/2026-11-18-kj-access-panel.md): KJ never starts cold DMs and never holds
// the account. Today is the day's feature: up to 20 places in one chapter, tagged in a "Now on Vegans Explore" carousel and stories from
// @vegansexplore; whoever replies, comments or reshares is answered in the brand inbox with their link. Places quiet 7 days after a feature go
// to Sean's send list (20 a day, he sends from his own phone; logged as 'dm'). Told = an email delivered or Sean's send; Notified = tagged in a
// feature; Engaged = a click, reply or claim.
//   POST { action: 'feature' }                          today's feature batch, the caption, inbound, today's numbers
//   POST { action: 'sean' }                             Sean's send list (everyone sees it; only a super admin taps Sent)
//   POST { action: 'me' }                               who is asking
//   POST { action: 'plan' }                             the goal, Told / Engaged / Notified by group and lane, the openers, the caps
//   POST { action: 'inbound_add', handle, group, kind?, note? }   a new follower or anyone who writes (matched to a listing)
//   POST { action: 'inbound_set', id, status }          welcomed (capped at 10 a day) or done
//   POST { action: 'roster', group?, status?, channel?, q?, sort?, offset?, limit? }
//   POST { action: 'item', id }                         one listing's full history
//   POST { action: 'touch', id, kind, note? }           log a tap (follow, followed_back, dm, replied, cant_reach, note, checkin, pin, unpin)
//   POST { action: 'link', id }                         their personal tracked /go/ link (made once) to /hello/<group>?l=<slug>
//   POST { action: 'inbound_link', id, chapter? }       the same for an inbound person (their listing's page, or their group's page)
//   POST { action: 'scout', chapter, kind, url?, name?, note? }   an event (pending review) or a person or place (Depot > Ideas)
//   POST { action: 'done', offset? }                    the holder's own touches, newest first
// Ops: the LESARUSS_ADMIN_TOKEN acts as an admin (reads and proofs; its touches have no member).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const POSITION = 'social-media-manager-instagram';
// Limits (panel 2026-11-18, feature first): one feature a day, up to 20 places tagged; replies uncapped; Sean's send list 20 a day.
const FEATURE_CAP = 20;
const SEAN_CAP = 20;
const QUIET_DAYS = 7;
const CITY_MIN = 8;
const STATE_NAMES: Record<string, string> = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  GB: 'the UK', FR: 'France' };
const GOAL = { members: 250, kj_members: 60, claims: 100, by: '2026-12-31' };
const DEADLINE = '2026-12-01';
const DAYS_OFF = ['2026-11-26', '2026-11-27']; // Thanksgiving Thursday and Friday
const GROUP_ORDER = ['restaurants', 'businesses', 'nonprofits', 'creators'];
const GROUP_WORDS: Record<string, string> = { restaurants: 'Restaurants and food', businesses: 'Other businesses', nonprofits: 'Nonprofits', creators: 'Creators and media' };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

// ---- Auth (the token ve-auth signs) ----
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
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
// Ops (Logan's admin token, as in ve-positions): acts as an admin with no member id, for checks and proofs from SQL.
async function isOps(req: Request) {
  const t = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!t || t.split('.').length === 3) return false;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  return !!data?.value && t.length === String(data.value).length && t === data.value;
}
async function viewer(req: Request) {
  if (await isOps(req)) return { id: null as unknown as string, name: 'Logan (ops)', role: 'admin' as const };
  const sub = await verifyToken((req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!sub) return null;
  const { data: m } = await db.from('members').select('id, name, is_superadmin').eq('id', sub).maybeSingle();
  if (!m) return null;
  if (m.is_superadmin) return { id: m.id, name: m.name, role: 'admin' as const };
  const { data: pos } = await db.from('ve_positions').select('id').eq('slug', POSITION).maybeSingle();
  if (!pos) return null;
  const { data: rows } = await db.from('ve_position_people').select('stage').eq('position_id', pos.id).eq('member_id', m.id)
    .order('created_at', { ascending: false }).limit(1);
  const stage = rows?.[0]?.stage;
  if (!stage || ['applied', 'shortlisted', 'ended'].includes(stage)) return null;
  return { id: m.id, name: m.name, role: 'holder' as const };
}

// ---- Dates (Eastern) ----
const todayET = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addDays = (s: string, n: number) => new Date(new Date(s + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);
const dow = (s: string) => new Date(s + 'T00:00:00Z').getUTCDay(); // 0 Sunday
const etDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
function workdaysFrom(start: string, n: number) {
  const out: string[] = []; let d = start;
  while (out.length < n) { if (dow(d) >= 1 && dow(d) <= 5 && !DAYS_OFF.includes(d)) out.push(d); d = addDays(d, 1); }
  return out;
}
function workdaysBetween(a: string, b: string) { let n = 0, d = a; while (d <= b) { if (dow(d) >= 1 && dow(d) <= 5 && !DAYS_OFF.includes(d)) n++; d = addDays(d, 1); } return n; }

// ---- The roster ----
type Row = Record<string, any>;
async function roster(): Promise<Row[]> {
  // The API returns at most 1,000 rows a call: page through all of them.
  const out: Row[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await db.rpc('ve_reach_roster').order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data || []) as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}
function statusOf(r: Row): string {
  if (r.claimed) return 'claimed';
  if (r.unsubscribed) return 'unsubscribed';
  if (r.replied_email || r.replied_dm) return 'replied';
  if (r.clicked) return 'clicked';
  if (r.emails_sent > 0 && !r.bounced || r.dm_at) return 'reached';
  if (r.tagged_at) return 'featured';
  if (r.cant_reach || (r.bounced && !r.dm_at)) return 'cant_reach';
  return 'not_reached';
}
const STATUS_WORDS: Record<string, string> = { featured: 'Featured', claimed: 'Claimed', unsubscribed: 'Unsubscribed', replied: 'Replied', clicked: 'Clicked', reached: 'Reached', cant_reach: "Can't reach", not_reached: 'Not reached yet' };
function laneOf(r: Row): string {
  if (r.emails && r.emails.length) return 'email';
  if (r.instagram) return 'instagram';
  if (r.website) return 'find';
  return 'none';
}
const isTold = (r: Row) => (r.emails_sent > 0 && !r.bounced) || !!r.dm_at;
const isEngaged = (r: Row) => !!(r.clicked || r.replied_email || r.replied_dm || r.claimed);
const isNotified = (r: Row) => !!r.tagged_at;
function igUrl(h: string | null) {
  if (!h) return null;
  const s = String(h).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const u = s.replace(/^@/, '').replace(/\/+$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(u) ? `https://www.instagram.com/${u}/` : null;
}
function card(r: Row) {
  return {
    id: r.id, slug: r.slug, name: r.name, logo: r.logo_url, group: r.grp, group_words: GROUP_WORDS[r.grp], category: r.category,
    city: [r.city, r.state].filter(Boolean).join(', '), instagram: igUrl(r.instagram), website: r.website, status: statusOf(r),
    status_words: STATUS_WORDS[statusOf(r)], lane: laneOf(r), emails_sent: r.emails_sent, last_touch_at: r.last_touch_at,
    last_touch_kind: r.last_touch_kind, touches: r.touches, opened: r.opened, clicked: r.clicked, bounced: r.bounced,
    unsubscribed: r.unsubscribed, claimed: r.claimed, replied: r.replied_email || r.replied_dm, followed_at: r.followed_at, told: isTold(r), engaged: isEngaged(r),
    followed_back: r.followed_back, dm_at: r.dm_at, pinned: r.pinned, chapter: r.chapter, tagged_at: r.tagged_at, page_sent_at: r.page_sent_at, note: r.kj_note, has_email: !!(r.emails && r.emails.length),
  };
}

// KJ's queue order (BOSS): Sean's pins, then Instagram-only listings by group (restaurants first), then no reply to email in 5 days.
function queue(rows: Row[]) {
  const fiveDays = Date.now() - 5 * 86400000;
  const open = rows.filter((r) => igUrl(r.instagram) && !r.claimed && !r.unsubscribed && !r.tagged_at && !r.dm_at && !r.cant_reach && !r.replied_email && !r.replied_dm);
  const rank = (r: Row) => {
    if (r.pinned) return 0;
    const noEmail = !(r.emails && r.emails.length);
    if (noEmail) return 1 + GROUP_ORDER.indexOf(r.grp);
    if (r.emails_sent > 0 && r.last_email_at && Date.parse(r.last_email_at) < fiveDays) return 5;
    return 9;
  };
  return open.filter((r) => rank(r) < 9).sort((a, b) => rank(a) - rank(b) || (b.followed_back ? 1 : 0) - (a.followed_back ? 1 : 0)
    || String(a.name).localeCompare(String(b.name)));
}

async function openers() {
  const { data } = await db.from('ve_reach_messages').select('grp, lane, kind, version, body, status').neq('status', 'retired').order('version', { ascending: false });
  const out: Record<string, any> = {};
  for (const m of data || []) { const k = `${m.grp}:${m.kind}`; if (!out[k]) out[k] = m; }
  return out;
}

async function goal(meId: string | null, role: string) {
  const [{ count: members }, { count: claims }] = await Promise.all([
    db.from('members').select('id', { count: 'exact', head: true }).or('is_superadmin.is.null,is_superadmin.eq.false'),
    db.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'approved').not('owner_member_id', 'is', null),
  ]);
  // KJ's own number: new members credited to the personal links made in this console (directory-reach-2026).
  const { data: links } = await db.from('ve_links').select('id').eq('initiative_slug', 'directory-reach-2026');
  const ids = (links || []).map((l: any) => l.id);
  let kj = 0;
  if (ids.length) {
    const { data: clicks } = await db.from('ve_link_clicks').select('member_id').in('link_id', ids).eq('is_bot', false).not('member_id', 'is', null);
    kj = new Set((clicks || []).map((c: any) => c.member_id)).size;
  }
  const today = todayET();
  const daysToGoal = Math.max(1, Math.round((Date.parse(GOAL.by) - Date.parse(today)) / 86400000));
  const weeksLeft = Math.max(1, Math.ceil(daysToGoal / 7));
  const perWeek = Math.max(0, Math.ceil((GOAL.members - (members || 0)) / weeksLeft));
  const sunday = addDays(today, (7 - dow(today)) % 7);
  return { members: members || 0, members_goal: GOAL.members, kj_members: kj, kj_goal: GOAL.kj_members, claims: claims || 0, claims_goal: GOAL.claims,
    by: GOAL.by, checkpoint: { by: sunday, members: Math.min(GOAL.members, (members || 0) + perWeek), per_week: perWeek } };
}

async function plan(rows: Row[], me: { id: string; role: string }) {
  const groups: Record<string, any> = {};
  for (const g of GROUP_ORDER) groups[g] = { words: GROUP_WORDS[g], total: 0, told: 0, engaged: 0, notified: 0, claimed: 0, email: 0, instagram: 0, find: 0, none: 0 };
  const lanes: Record<string, any> = { email: { total: 0, told: 0, engaged: 0 }, instagram: { total: 0, told: 0, engaged: 0 }, find: { total: 0, told: 0, engaged: 0 }, none: { total: 0, told: 0, engaged: 0 } };
  let told = 0, engaged = 0, notified = 0;
  for (const r of rows) {
    const l = laneOf(r), g = groups[r.grp];
    g.total++; g[l]++; lanes[l].total++;
    if (isTold(r)) { g.told++; lanes[l].told++; told++; }
    if (isEngaged(r)) { g.engaged++; lanes[l].engaged++; engaged++; }
    if (isNotified(r)) { g.notified++; notified++; }
    if (r.claimed) g.claimed++;
  }
  const today = todayET();
  return { total: rows.length, told, engaged, notified, groups, lanes, today, deadline: DEADLINE, days_left: workdaysBetween(today, DEADLINE),
    goal: await goal(me.id, me.role), caps: { feature: FEATURE_CAP, sean: SEAN_CAP, quiet_days: QUIET_DAYS },
    days_off: DAYS_OFF, openers: await openers() };
}

async function countToday(kind: string) {
  const { count } = await db.from('ve_reach_log').select('id', { count: 'exact', head: true }).eq('kind', kind).gte('at', todayET() + 'T05:00:00Z');
  return count || 0;
}

// Today's feature: the places tagged today, then the rest of today's batch in queue order, kept to one chapter when possible.
async function feature(rows: Row[]) {
  const today = todayET();
  const since = today + 'T05:00:00Z';
  const { data: logs } = await db.from('ve_reach_log').select('listing_id').eq('kind', 'tagged').gte('at', since);
  const doneIds = new Set((logs || []).map((l: any) => l.listing_id));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const featured = [...doneIds].map((id) => byId.get(id)).filter(Boolean) as Row[];
  const q = queue(rows);
  const room = Math.max(0, FEATURE_CAP - featured.length);
  // A public caption must be true (coordinator, 2026-11-18): the batch is one CITY first, the city with the most waiting
  // Instagram-only places; only when that city has fewer than CITY_MIN does it fill from the same chapter, and then the caption names
  // the real state or states ("across Pennsylvania"), never a city some places are not in. One mention per Instagram account.
  const handleOf = (r: Row) => { const u = igUrl(r.instagram); return u ? String(u.replace(/\/+$/, '').split('/').pop()).toLowerCase() : ''; };
  const cityKey = (r: Row) => r.city ? `${String(r.city).split(',')[0].trim().toLowerCase()}|${String(r.state || '').toLowerCase()}` : '';
  const realChapter = (r: Row) => r.chapter && r.chapter !== 'all' ? r.chapter : null;
  let pick: Row | undefined = featured[0];
  if (!pick) {
    const counts = new Map<string, number>();
    for (const r of q) if (!(r.emails && r.emails.length) && cityKey(r)) counts.set(cityKey(r), (counts.get(cityKey(r)) || 0) + 1);
    let best = '', n = 0;
    for (const r of q) { const k = cityKey(r); if (k && (counts.get(k) || 0) > n) { best = k; n = counts.get(k) || 0; } }
    pick = q.find((r) => cityKey(r) === best);
  }
  const used = new Set(featured.map(handleOf));
  const take = (list: Row[], max: number) => { const out: Row[] = []; for (const r of list) { if (out.length >= max) break; const h = handleOf(r); if (!h || used.has(h)) continue; used.add(h); out.push(r); } return out; };
  let batch: Row[] = [];
  let mode: 'city' | 'area' = 'city';
  if (pick) {
    batch = take(q.filter((r) => cityKey(r) === cityKey(pick!)), room);
    if (featured.length + batch.length < CITY_MIN && realChapter(pick)) {
      mode = 'area';
      batch = batch.concat(take(q.filter((r) => realChapter(r) === realChapter(pick!) && cityKey(r) !== cityKey(pick!)), room - batch.length));
    }
  }
  const chapter = pick ? realChapter(pick) : null;
  const members = featured.concat(batch);
  const cityName = pick ? String(pick.city).split(',')[0].trim() : '';
  const states = [...new Set(members.map((r) => STATE_NAMES[String(r.state || '').toUpperCase()] || String(r.state || '')).filter(Boolean))];
  const areaName = states.length <= 1 ? (states[0] || cityName) : states.slice(0, -1).join(', ') + ' and ' + states[states.length - 1];
  const where = mode === 'city' ? { headline: cityName, phrase: `in ${cityName}` } : { headline: areaName, phrase: `across ${areaName}` };
  const all = members;
  const groupCount: Record<string, number> = {};
  for (const r of all) groupCount[r.grp] = (groupCount[r.grp] || 0) + 1;
  const group = Object.entries(groupCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'restaurants';
  const handles = [...new Set(all.map(handleOf).filter(Boolean))].map((h) => '@' + h);
  const { data: inbound } = await db.from('ve_reach_inbound').select('id, handle, grp, kind, status, note, listing_id, created_at').neq('status', 'done')
    .order('created_at', { ascending: true }).limit(50);
  const lids = (inbound || []).map((x: any) => x.listing_id).filter(Boolean);
  const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name, logo_url').in('id', lids) : { data: [] };
  const lBy = new Map((ls || []).map((l: any) => [l.id, l]));
  return { today, is_workday: workdaysFrom(today, 1)[0] === today, chapter, mode, where, group, group_words: GROUP_WORDS[group], handles,
    featured: featured.map(card), batch: batch.map(card), cap: FEATURE_CAP, queue_left: q.length,
    inbound: (inbound || []).map((x: any) => ({ ...x, listing: x.listing_id ? lBy.get(x.listing_id) || null : null, instagram: igUrl(x.handle) })),
    openers: await openers(), days_off: DAYS_OFF, template: { canva: 'DAHaJ8TQI0I', url: 'https://www.canva.com/design/DAHaJ8TQI0I/edit', canon: 'canon-ve-city-carousel' } };
}

// Sean's send list: featured 7 or more days ago, no reply, no page sent, not claimed, Instagram only (no email), not sent yet; 20 a day.
async function seanList(rows: Row[]) {
  const cutoff = Date.now() - QUIET_DAYS * 86400000;
  const sentToday = await countToday('dm');
  const due = rows.filter((r) => r.tagged_at && Date.parse(r.tagged_at) <= cutoff && !r.dm_at && !r.replied_dm && !r.replied_email && !r.page_sent_at
    && !r.claimed && !r.unsubscribed && !r.cant_reach && !(r.emails && r.emails.length) && igUrl(r.instagram))
    .sort((a, b) => String(a.tagged_at).localeCompare(String(b.tagged_at)));
  return { cap: SEAN_CAP, sent_today: sentToday, waiting: due.length, rows: due.slice(0, Math.max(0, SEAN_CAP - sentToday)).map(card), openers: await openers() };
}

async function item(id: string) {
  const rows = (await roster()).filter((r) => r.id === id);
  if (!rows.length) return null;
  const r = rows[0];
  const ems: string[] = r.emails || [];
  const [sends, reps, logs, camps, claims] = await Promise.all([
    ems.length ? db.from('email_sends').select('id, subject, campaign_ref, status, sent_at, created_at, delivered_at, bounced_at, to_email').in('to_email', ems).order('created_at', { ascending: false }).limit(50) : { data: [] },
    ems.length ? db.from('email_replies').select('from_name, subject, snippet, received_at, is_auto_reply').in('from_email', ems).order('received_at', { ascending: false }).limit(20) : { data: [] },
    db.from('ve_reach_log').select('kind, note, at, member_id').eq('listing_id', id).order('at', { ascending: false }).limit(100),
    db.from('ve_outreach_campaign_members').select('campaign_slug, send_status, step, last_sent_at, stop_reason').eq('listing_id', id).is('removed_at', null),
    db.from('ve_listing_claims').select('status, created_at, contact_name').eq('listing_id', id).order('created_at', { ascending: false }),
  ]);
  const sendIds = (sends.data || []).map((s: any) => s.id);
  const { data: eng } = sendIds.length ? await db.from('email_send_engagement').select('send_id, opens_human, clicked_at, scanner_click_only, unsub_link_at').in('send_id', sendIds) : { data: [] };
  const engBy = new Map((eng || []).map((e: any) => [e.send_id, e]));
  const memberIds = [...new Set((logs.data || []).map((l: any) => l.member_id).filter(Boolean))];
  const { data: names } = memberIds.length ? await db.from('members').select('id, name').in('id', memberIds) : { data: [] };
  const nameBy = new Map((names || []).map((n: any) => [n.id, n.name]));
  return {
    listing: { ...card(r), emails_count: ems.length },
    emails: (sends.data || []).map((s: any) => { const e: any = engBy.get(s.id) || {}; return { subject: s.subject, campaign: s.campaign_ref, at: s.sent_at || s.created_at,
      delivered: !!s.delivered_at, bounced: !!s.bounced_at, opened: (e.opens_human || 0) > 0, clicked: !!e.clicked_at && !e.scanner_click_only, unsub: !!e.unsub_link_at }; }),
    replies: (reps.data || []).filter((x: any) => !x.is_auto_reply).map((x: any) => ({ from: x.from_name, subject: x.subject, snippet: x.snippet, at: x.received_at })),
    log: (logs.data || []).map((l: any) => ({ kind: l.kind, note: l.note, at: l.at, by: nameBy.get(l.member_id) || null })),
    campaigns: camps.data || [], claims: (claims.data || []).map((c: any) => ({ status: c.status, at: c.created_at })),
  };
}

// Every personal link goes to the group's pre-welcome page Sean locked (2026-11-18): /hello/<group>?l=<listing slug>, and for an Explorer
// /hello/explorers (?c=<chapter> when known). Group pages: restaurants, businesses, nonprofits, creators, explorers.
const PAGE_OF: Record<string, string> = { restaurants: 'restaurants', businesses: 'businesses', nonprofits: 'nonprofits', creators: 'creators', explorer: 'explorers' };
function groupOfCategory(c: string | null) {
  if (['Rescues', 'Nonprofits', 'Sanctuaries', 'Activists', 'Groups'].includes(c || '')) return 'nonprofits';
  if (['Podcasts', 'YouTube', 'Radio and TV', 'News Outlets', 'Documentaries & Films', 'Books', 'Athletes', 'Founders'].includes(c || '')) return 'creators';
  if (['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Catering', 'Markets'].includes(c || '')) return 'restaurants';
  return 'businesses';
}
async function makeLink(label: string, base: string, destination: string, tags: string[], name: string, me: { id: string }) {
  const { data: have } = await db.from('ve_links').select('code').eq('initiative_slug', 'directory-reach-2026').eq('label', label.slice(0, 120)).maybeSingle();
  if (have) return `https://vegansexplore.com/go/${have.code}`;
  for (let k = 0; k < 5; k++) {
    const code = k === 0 ? base : `${base.slice(0, 42)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await db.from('ve_links').insert({ code, label: label.slice(0, 120), destination, initiative_slug: 'directory-reach-2026',
      tags: ['directory-reach', 'instagram-dm', ...tags].map((t) => t.slice(0, 60)), channel: 'dm', recipient_name: String(name).slice(0, 120), active: true, created_by: me.id });
    if (!error) return `https://vegansexplore.com/go/${code}`;
  }
  return null;
}
async function personalLink(id: string, me: { id: string }) {
  const { data: l } = await db.from('listings').select('id, slug, name, category').eq('id', id).eq('status', 'approved').maybeSingle();
  if (!l) return null;
  const grp = groupOfCategory(l.category);
  const base = 'r-' + l.slug.replace(/[^a-z0-9-]/g, '').slice(0, 40).replace(/-+$/, '');
  return await makeLink(`Reach: ${l.slug}`, base, `/hello/${PAGE_OF[grp]}?l=${encodeURIComponent(l.slug)}`, [grp, l.slug], l.name, me);
}
// An inbound person: their listing's page when matched; otherwise their group's page (an Explorer gets /hello/explorers, with ?c= when known).
async function inboundLink(id: string, me: { id: string }, chapter: string) {
  const { data: x } = await db.from('ve_reach_inbound').select('id, handle, grp, listing_id').eq('id', id).maybeSingle();
  if (!x) return null;
  if (x.listing_id) return await personalLink(x.listing_id, me);
  const c = /^[a-z0-9-]{2,40}$/.test(chapter) ? chapter : '';
  const dest = x.grp === 'explorer' ? `/hello/explorers${c ? `?c=${c}` : ''}` : `/hello/${PAGE_OF[x.grp]}`;
  const base = 'r-in-' + String(x.handle).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 36);
  return await makeLink(`Reach inbound: @${x.handle}`, base, dest, [x.grp, 'inbound'], '@' + x.handle, me);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const me = await viewer(req);
  if (!me) return json({ error: 'forbidden', message: 'This console is for the Vegans Explore team.' }, 403);
  const action = String(body.action || '');
  try {
    if (action === 'me') return json({ ok: true, me });
    if (action === 'plan') return json({ ok: true, me, ...(await plan(await roster(), me)) });
    if (action === 'inbound_add') {
      const handle = clean(body.handle, 120).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, '');
      const grp = String(body.group || ''), kind = ['follower', 'message', 'comment', 'feature_reply'].includes(String(body.kind)) ? String(body.kind) : 'feature_reply';
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle) || !['explorer', ...GROUP_ORDER].includes(grp)) return json({ error: 'bad_request', message: 'Add their Instagram handle and a group.' }, 400);
      const { data: match } = await db.from('listings').select('id').eq('status', 'approved')
        .or(`instagram.ilike.${handle},instagram.ilike.@${handle},instagram.ilike.%instagram.com/${handle},instagram.ilike.%instagram.com/${handle}/`).limit(1);
      const { data, error } = await db.from('ve_reach_inbound').insert({ handle, grp, kind, note: clean(body.note, 500) || null, added_by: me.id, listing_id: match?.[0]?.id ?? null }).select('id, listing_id').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true, id: data.id, matched: !!data.listing_id });
    }
    if (action === 'inbound_set') {
      const st = String(body.status || '');
      if (!isId(body.id) || !['welcomed', 'done'].includes(st)) return json({ error: 'bad_request' }, 400);
      const patch: Record<string, unknown> = { status: st, updated_at: new Date().toISOString() };
      if (st === 'welcomed') { patch.welcomed_by = me.id; patch.welcomed_at = new Date().toISOString(); }
      const { error } = await db.from('ve_reach_inbound').update(patch).eq('id', body.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }
    if (action === 'feature' || action === 'week') return json({ ok: true, me, ...(await feature(await roster())) });
    if (action === 'sean') return json({ ok: true, me, ...(await seanList(await roster())) });
    if (action === 'roster') {
      let rows = (await roster()).map(card);
      const g = String(body.group || ''), s = String(body.status || ''), c = String(body.channel || ''), q = clean(body.q, 80).toLowerCase();
      const counts: Record<string, number> = {};
      if (GROUP_ORDER.includes(g)) rows = rows.filter((r) => r.group === g);
      if (c === 'email') rows = rows.filter((r) => r.has_email); else if (c === 'instagram') rows = rows.filter((r) => !!r.instagram);
      else if (c === 'find') rows = rows.filter((r) => r.lane === 'find'); else if (c === 'none') rows = rows.filter((r) => r.lane === 'none');
      if (q) rows = rows.filter((r) => `${r.name} ${r.city} ${r.category}`.toLowerCase().includes(q));
      for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
      if (s && STATUS_WORDS[s]) rows = rows.filter((r) => r.status === s);
      const sort = String(body.sort || 'name');
      rows.sort(sort === 'recent' ? (a, b) => String(b.last_touch_at || '').localeCompare(String(a.last_touch_at || ''))
        : sort === 'touches' ? (a, b) => b.touches - a.touches || a.name.localeCompare(b.name)
        : sort === 'city' ? (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
        : (a, b) => String(a.name).localeCompare(String(b.name)));
      const offset = Math.max(0, Number(body.offset) || 0), limit = Math.min(100, Math.max(1, Number(body.limit) || 25));
      return json({ ok: true, total: rows.length, counts, rows: rows.slice(offset, offset + limit) });
    }
    if (action === 'item') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const r = await item(body.id);
      return r ? json({ ok: true, ...r }) : json({ error: 'not_found' }, 404);
    }
    if (action === 'touch') {
      const kind = String(body.kind || '');
      if (!isId(body.id) || !['tagged', 'replied', 'cant_reach', 'note', 'page_sent', 'dm', 'pin', 'unpin'].includes(kind)) return json({ error: 'bad_request' }, 400);
      // Sean's sends ('dm') and pins are his alone; KJ never starts a DM.
      if (['pin', 'unpin', 'dm'].includes(kind) && me.role !== 'admin') return json({ error: 'forbidden', message: 'That one is Sean\'s.' }, 403);
      if (kind === 'tagged' || kind === 'dm') {
        const cap = kind === 'tagged' ? FEATURE_CAP : SEAN_CAP;
        if ((await countToday(kind)) >= cap) return json({ error: 'cap', message: kind === 'tagged' ? `Today's feature already has ${cap} places. The rest go in tomorrow's.` : `That is today's ${cap} sends.` }, 429);
      }
      const { error } = await db.from('ve_reach_log').insert({ listing_id: body.id, member_id: me.id, kind, note: clean(body.note, 1000) || null });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }
    if (action === 'link') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const url = await personalLink(body.id, me);
      return url ? json({ ok: true, url }) : json({ error: 'not_found' }, 404);
    }
    if (action === 'inbound_link') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const url = await inboundLink(body.id, me, String(body.chapter || ''));
      return url ? json({ ok: true, url }) : json({ error: 'not_found' }, 404);
    }
    if (action === 'scout') {
      const chapter = clean(body.chapter, 60), kind = String(body.kind || ''), url = clean(body.url, 500), name = clean(body.name, 160), note = clean(body.note, 1500);
      if (kind === 'event') {
        if (!/^https?:\/\//i.test(url)) return json({ error: 'bad_request', message: 'Paste the event link.' }, 400);
        const { data: ideas, error } = await db.from('ve_ideas').insert({ brand_slug: 'vegans-explore', source: 'depot', status: 'new',
          body: `Chapter scout (${chapter || 'no chapter'}), an event to add: ${name || url}. ${note}`.trim(), links: [url] }).select('id').single();
        if (error) return json({ error: 'save_failed', message: error.message }, 500);
        return json({ ok: true, where: 'Depot > Ideas', id: ideas?.id });
      }
      if (kind === 'spotlight') {
        if (!name && !url) return json({ error: 'bad_request', message: 'Add a name or a link.' }, 400);
        const { data: ideas, error } = await db.from('ve_ideas').insert({ brand_slug: 'vegans-explore', source: 'depot', status: 'new',
          body: `Chapter scout (${chapter || 'no chapter'}), someone to spotlight: ${name || url}. ${note}`.trim(), links: url ? [url] : [] }).select('id').single();
        if (error) return json({ error: 'save_failed', message: error.message }, 500);
        return json({ ok: true, where: 'Depot > Ideas', id: ideas?.id });
      }
      return json({ error: 'bad_request' }, 400);
    }
    if (action === 'done') {
      const offset = Math.max(0, Number(body.offset) || 0);
      let dq = db.from('ve_reach_log').select('id, listing_id, kind, note, at');
      if (me.id) dq = dq.eq('member_id', me.id);
      const { data } = await dq.order('at', { ascending: false }).range(offset, offset + 49);
      const ids = [...new Set((data || []).map((d: any) => d.listing_id))];
      const { data: ls } = ids.length ? await db.from('listings').select('id, slug, name, logo_url').in('id', ids) : { data: [] };
      const by = new Map((ls || []).map((l: any) => [l.id, l]));
      return json({ ok: true, rows: (data || []).map((d: any) => ({ ...d, listing: by.get(d.listing_id) || null })) });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-reach', action, String(e));
    return json({ error: 'server', message: 'Something went wrong. Try again in a moment.' }, 500);
  }
});
