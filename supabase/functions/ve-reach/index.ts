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
//   POST { action: 'me' }                               who is asking
//   POST { action: 'plan' }                             the goal, Told / Engaged / Notified by group and lane, the openers, the caps
//   POST { action: 'week' }                             today and the days ahead (past days hidden): inbound, DM cards, follow ahead
//   POST { action: 'inbound_add', handle, group, kind?, note? }   a new follower or anyone who writes (matched to a listing)
//   POST { action: 'inbound_set', id, status }          welcomed (capped at 10 a day) or done
//   POST { action: 'roster', group?, status?, channel?, q?, sort?, offset?, limit? }
//   POST { action: 'item', id }                         one listing's full history
//   POST { action: 'touch', id, kind, note? }           log a tap (follow, followed_back, dm, replied, cant_reach, note, checkin, pin, unpin)
//   POST { action: 'link', id }                         their personal tracked /go/ link (made once)
//   POST { action: 'scout', chapter, kind, url?, name?, note? }   an event (pending review) or a person or place (Depot > Ideas)
//   POST { action: 'done', offset? }                    the holder's own touches, newest first
// Ops: the LESARUSS_ADMIN_TOKEN acts as an admin (reads and proofs; its touches have no member).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const POSITION = 'social-media-manager-instagram';
// Caps (panel 2026-11-18): DMs ramp 10 a day for the holder's first three working days, then 15, then 20 after a clean week;
// follows 25 a day; follower welcomes their own 10. Meta publishes no numbers; these are conservative.
const DM_RAMP = [10, 15, 20];
const FOLLOW_CAP = 25;
const WELCOME_CAP = 10;
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
  if (r.emails_sent > 0 && !r.bounced || r.dm_at || r.last_touch_kind === 'tagged') return 'reached';
  if (r.cant_reach || (r.bounced && !r.dm_at)) return 'cant_reach';
  return 'not_reached';
}
const STATUS_WORDS: Record<string, string> = { claimed: 'Claimed', unsubscribed: 'Unsubscribed', replied: 'Replied', clicked: 'Clicked', reached: 'Reached', cant_reach: "Can't reach", not_reached: 'Not reached yet' };
function laneOf(r: Row): string {
  if (r.emails && r.emails.length) return 'email';
  if (r.instagram) return 'instagram';
  if (r.website) return 'find';
  return 'none';
}
const isTold = (r: Row) => (r.emails_sent > 0 && !r.bounced) || !!r.dm_at;
const isEngaged = (r: Row) => !!(r.clicked || r.replied_email || r.replied_dm || r.claimed);
const isNotified = (r: Row) => r.last_touch_kind === 'tagged';
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
    followed_back: r.followed_back, dm_at: r.dm_at, pinned: r.pinned, note: r.kj_note, has_email: !!(r.emails && r.emails.length),
  };
}

// KJ's queue order (BOSS): Sean's pins, then Instagram-only listings by group (restaurants first), then no reply to email in 5 days.
function queue(rows: Row[]) {
  const fiveDays = Date.now() - 5 * 86400000;
  const open = rows.filter((r) => igUrl(r.instagram) && !r.claimed && !r.unsubscribed && !r.dm_at && !r.cant_reach && !r.replied_email);
  const rank = (r: Row) => {
    if (r.pinned) return 0;
    const noEmail = !(r.emails && r.emails.length);
    if (noEmail) return 1 + GROUP_ORDER.indexOf(r.grp);
    if (r.emails_sent > 0 && r.last_email_at && Date.parse(r.last_email_at) < fiveDays) return 5;
    return 9;
  };
  return open.filter((r) => rank(r) < 9).sort((a, b) => rank(a) - rank(b) || (b.followed_back ? 1 : 0) - (a.followed_back ? 1 : 0)
    || (a.followed_at ? 0 : 1) - (b.followed_at ? 0 : 1) || String(a.name).localeCompare(String(b.name)));
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
    goal: await goal(me.id, me.role), caps: { dm: DM_RAMP, follow: FOLLOW_CAP, welcome: WELCOME_CAP, dm_today: await dmCap(me.id) },
    days_off: DAYS_OFF, openers: await openers() };
}

// The DM cap for this person today: 10 for their first three working days with a message, then 15 for the next five, then 20.
async function dmCap(memberId: string | null) {
  if (!memberId) return DM_RAMP[2];
  const { data } = await db.from('ve_reach_log').select('at').eq('member_id', memberId).eq('kind', 'dm').order('at', { ascending: true }).limit(1);
  if (!data?.length) return DM_RAMP[0];
  const n = workdaysBetween(etDay(data[0].at), todayET());
  return n <= 3 ? DM_RAMP[0] : n <= 8 ? DM_RAMP[1] : DM_RAMP[2];
}
async function countToday(memberId: string | null, kind: string) {
  let q = db.from('ve_reach_log').select('id', { count: 'exact', head: true }).eq('kind', kind).gte('at', todayET() + 'T05:00:00Z');
  if (memberId) q = q.eq('member_id', memberId);
  const { count } = await q;
  return count || 0;
}

async function week(rows: Row[], me: { id: string }) {
  const today = todayET();
  const cap = await dmCap(me.id);
  const [dmDone, followDone] = await Promise.all([countToday(me.id, 'dm'), countToday(me.id, 'follow')]);
  const q = queue(rows);
  const plannedDays = workdaysFrom(today, 12);
  const dmPlan: Record<string, Row[]> = {};
  let i = 0;
  for (const d of plannedDays) {
    const room = d === today ? Math.max(0, cap - dmDone) : cap;
    dmPlan[d] = q.slice(i, i + room); i += room;
  }
  // Follow ahead: the accounts messaged two working days from now, not followed yet, within today's follows.
  const followFor = plannedDays[2] || null;
  const follow = followFor ? (dmPlan[followFor] || []).filter((r) => !r.followed_at).slice(0, Math.max(0, FOLLOW_CAP - followDone)).map(card) : [];
  const { data: inbound } = await db.from('ve_reach_inbound').select('id, handle, grp, kind, status, note, listing_id, created_at').neq('status', 'done')
    .order('created_at', { ascending: true }).limit(50);
  const lids = (inbound || []).map((x: any) => x.listing_id).filter(Boolean);
  const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name, logo_url').in('id', lids) : { data: [] };
  const lBy = new Map((ls || []).map((l: any) => [l.id, l]));
  const welcomedToday = await (async () => {
    let wq = db.from('ve_reach_inbound').select('id', { count: 'exact', head: true }).gte('welcomed_at', today + 'T05:00:00Z');
    if (me.id) wq = wq.eq('welcomed_by', me.id);
    return (await wq).count || 0;
  })();
  const ahead = plannedDays.filter((d) => d > today).slice(0, 4).map((d) => ({ date: d, dm: (dmPlan[d] || []).length }));
  return { today, is_workday: plannedDays[0] === today, dm: (dmPlan[today] || []).map(card), follow, follow_for: followFor, ahead,
    inbound: (inbound || []).map((x: any) => ({ ...x, listing: x.listing_id ? lBy.get(x.listing_id) || null : null, instagram: igUrl(x.handle) })),
    caps: { dm: cap, dm_done: dmDone, follow: FOLLOW_CAP, follow_done: followDone, welcome: WELCOME_CAP, welcome_done: welcomedToday },
    queue_left: q.length, openers: await openers(), days_off: DAYS_OFF };
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

async function personalLink(id: string, me: { id: string }) {
  const { data: l } = await db.from('listings').select('id, slug, name').eq('id', id).eq('status', 'approved').maybeSingle();
  if (!l) return null;
  const { data: have } = await db.from('ve_links').select('code').eq('initiative_slug', 'directory-reach-2026').eq('label', `Reach: ${l.slug}`.slice(0, 120)).maybeSingle();
  if (have) return `https://vegansexplore.com/go/${have.code}`;
  const base = 'r-' + l.slug.replace(/[^a-z0-9-]/g, '').slice(0, 40).replace(/-+$/, '');
  for (let k = 0; k < 5; k++) {
    const code = k === 0 ? base : `${base.slice(0, 42)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await db.from('ve_links').insert({ code, label: `Reach: ${l.slug}`.slice(0, 120), destination: `/claim?listing=${encodeURIComponent(l.slug)}`,
      initiative_slug: 'directory-reach-2026', tags: ['directory-reach', 'instagram-dm', l.slug.slice(0, 60)], channel: 'dm', recipient_name: String(l.name).slice(0, 120),
      active: true, created_by: me.id });
    if (!error) return `https://vegansexplore.com/go/${code}`;
  }
  return null;
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
      const grp = String(body.group || ''), kind = ['follower', 'message', 'comment'].includes(String(body.kind)) ? String(body.kind) : 'follower';
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
      if (st === 'welcomed') {
        let wq = db.from('ve_reach_inbound').select('id', { count: 'exact', head: true }).gte('welcomed_at', todayET() + 'T05:00:00Z');
        if (me.id) wq = wq.eq('welcomed_by', me.id);
        if (((await wq).count || 0) >= WELCOME_CAP) return json({ error: 'cap', message: `That is today's ${WELCOME_CAP} welcomes. The rest wait for tomorrow.` }, 429);
      }
      const patch: Record<string, unknown> = { status: st, updated_at: new Date().toISOString() };
      if (st === 'welcomed') { patch.welcomed_by = me.id; patch.welcomed_at = new Date().toISOString(); }
      const { error } = await db.from('ve_reach_inbound').update(patch).eq('id', body.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }
    if (action === 'week') return json({ ok: true, me, ...(await week(await roster(), me)) });
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
      if (!isId(body.id) || !['follow', 'dm', 'replied', 'cant_reach', 'note', 'page_sent', 'pin', 'unpin'].includes(kind)) return json({ error: 'bad_request' }, 400);
      if ((kind === 'pin' || kind === 'unpin') && me.role !== 'admin') return json({ error: 'forbidden' }, 403);
      if (kind === 'dm' || kind === 'follow') {
        const cap = kind === 'dm' ? await dmCap(me.id) : FOLLOW_CAP;
        if ((await countToday(me.id, kind)) >= cap) return json({ error: 'cap', message: `That is today's ${cap} ${kind === 'dm' ? 'new messages' : 'follows'}. The limit protects the account; the rest wait for tomorrow.` }, 429);
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
