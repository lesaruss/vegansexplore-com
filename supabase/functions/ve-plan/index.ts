// ve-plan: BrandDesk's plan engine (canon canon-branddesk-production-wing, build order item 4; Sean, 2026-11-01: "go with your
// recommendation, next step"; the concept in docs/proposals/depot-one-desk.md: "A 3, 6 or 12 month marketing plan rolls out dated
// tasks backwards from each due date: what to do today, the questions needed to write the article, the photographer to book by a date
// with the request already drafted... Every piece moves the same way: ask, draft, approve or comment, keep working until done, store it.")
//
// A plan (ve_plans) belongs to a brand with a launched brand kit (ve_brand_cartridges status launched: the launch gate). Its rhythm (how
// many of each kind of piece a month) lays out dated pieces (ve_plan_pieces); each kind's steps (KINDS below) roll out backwards from the
// piece's due date (ve_plan_steps), so nothing is born late: a piece whose lead time does not fit after today moves later in its month.
// A piece: ask (its questions) -> the draft (Claude in the brand's locked voice from the answers, or a person) -> waiting for the OK ->
// approved, or changes asked with a note (then a new draft) -> stored (a social piece goes onto the brand's Social plan as a slot waiting
// for approval in ve_social_slots; anything else is stored with where it lives). Notes and every move are ve_plan_notes rows.
//
// Who: a super admin (or ops) edits every brand; anyone else by their ve_social_people row for the brand (editor or viewer), the same
// people as the Social plan. Approving a piece is a super admin's (our brands' owner); editors write, tick steps, comment and ask for
// changes (Logan's default, Sean's to change).
// Ops: LESARUSS_ADMIN_TOKEN with as_member acts as that member (HQ's BrandDesk > a brand > Plan). verify_jwt is off; the token is checked here.
//
// Actions (POST {action, ...}):
//   kinds                                  the piece library and the default rhythm
//   plans {brand}                          the brand's plans with counts; kit (launched?) and social (on the Social plan?)
//   plan_preview {brand, months, starts_on, rhythm}  what plan_create would make (counts by kind and month), nothing saved
//   plan_create {brand, name?, months, starts_on, support, rhythm}
//   plan_get {id}                          the plan and its pieces, each with its next step
//   plan_save {id, name?, status?}         status active | paused | ended
//   today {brand}                          every open step due through 7 days from today in the brand's active plans, and what waits for an OK
//   piece_get {id}                         the piece, its steps, notes, the plan, and the brand's Social plan channels
//   piece_add {plan_id, kind, due_on, title?}
//   piece_save {id, title?, due_on?, channels?, answers? {key: text}, brief?, draft?, requests? {step_id: text}}
//   piece_draft {id}                       Claude writes the next draft (needs every question answered)
//   piece_send {id}                        a person's draft goes for the OK
//   piece_decide {id, decision: approve|changes, note?}
//   piece_store {id, url?, note?, social? {date, time, channels}}
//   piece_skip {id, undo?}
//   step_done {id, done}
//   note_add {id, body}
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const TZ = 'America/New_York';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v + 'T00:00:00Z'));
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);

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
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

// ---- days (YYYY-MM-DD, Eastern) ----
const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const dms = (d: string) => Date.parse(d + 'T00:00:00Z');
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => day(dms(d) + n * 864e5);
function addMonths(d: string, n: number): string {
  const [y, m, dd] = d.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return day(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(dd, last)));
}
const dow = (d: string) => new Date(dms(d)).getUTCDay();
const short = (d: string) => new Date(dms(d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const long = (d: string) => new Date(dms(d)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
function tzOffsetMs(utcMs: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs;
}
function easternIso(d: string, hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const guess = dms(d) + (h * 60 + m) * 6e4;
  let t = guess - tzOffsetMs(guess, TZ);
  t = guess - tzOffsetMs(t, TZ);
  return new Date(t).toISOString();
}

// ---- the piece library (Logan's defaults, Sean's to change) ----
// A step's off is days from the piece's due date (negative is before). Keys answers, draft, ok and store move with the piece's status;
// the rest are ticked by hand. who: owner (their answer or their OK) or team.
type Step = { key: string; label: string; off: number; who?: 'team' | 'owner'; request?: string };
type Kind = { label: string; social?: string; channels: string[]; per_month: number; asks: { key: string; q: string }[]; steps: Step[]; draft: string };
const ABOUT = { key: 'about', q: 'What is this about, in a sentence or two?' };
const ACTION = { key: 'action', q: 'What should someone do after seeing it? (a link, if there is one)' };
const KINDS: Record<string, Kind> = {
  post: {
    label: 'Social post', social: 'post', channels: ['instagram', 'facebook'], per_month: 8,
    asks: [ABOUT, ACTION, { key: 'picture', q: 'Which picture or video goes with it? (a link, or describe it)' }],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -7, who: 'owner' }, { key: 'draft', label: 'Write the caption', off: -5 },
      { key: 'ok', label: 'Approve the caption', off: -3, who: 'owner' }, { key: 'store', label: 'Put it on the Social plan', off: -2 }],
    draft: 'Write the caption for one social post, under 600 characters. If hashtags fit, put up to five at the end on their own line.',
  },
  reel: {
    label: 'Reel', social: 'reel', channels: ['instagram', 'tiktok', 'facebook', 'youtube'], per_month: 4,
    asks: [ABOUT, { key: 'who', q: 'Who is in it, and where is it filmed?' }, ACTION],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -14, who: 'owner' }, { key: 'draft', label: 'Write the script', off: -12 },
      { key: 'ok', label: 'Approve the script', off: -10, who: 'owner' }, { key: 'film', label: 'Film it', off: -6 }, { key: 'edit', label: 'Edit it', off: -3 },
      { key: 'cut', label: 'Approve the cut', off: -2, who: 'owner' }, { key: 'store', label: 'Put it on the Social plan', off: -1 }],
    draft: 'Write the reel script: a hook line of under 10 words, then three to five short beats, each with what is on screen and what is said, then a line "Caption:" and the caption, under 400 characters.',
  },
  article: {
    label: 'Article', channels: [], per_month: 1,
    asks: [{ key: 'topic', q: 'What is the article about, in a sentence?' }, { key: 'points', q: 'What three things should a reader take away?' },
      { key: 'sources', q: 'Who or what are we quoting? (names and links)' }, { key: 'photos', q: 'Which pictures go with it?' }],
    steps: [{ key: 'ask', label: 'Send the questions', off: -21 }, { key: 'answers', label: 'Answer the questions', off: -14, who: 'owner' },
      { key: 'draft', label: 'Write the article', off: -9 }, { key: 'ok', label: 'Approve the article', off: -5, who: 'owner' },
      { key: 'photos', label: 'Pictures ready', off: -4 }, { key: 'store', label: 'Publish it', off: 0 }, { key: 'share', label: 'Share it on social', off: 1 }],
    draft: 'Write the article: a title on the first line, then 500 to 800 words in short paragraphs, using only what the answers say.',
  },
  newsletter: {
    label: 'Email', channels: [], per_month: 2,
    asks: [{ key: 'lead', q: 'What is the main story this time?' }, { key: 'more', q: 'Anything else to include? (events, links, offers)' }, ACTION],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -7, who: 'owner' }, { key: 'draft', label: 'Write the email', off: -5 },
      { key: 'ok', label: 'Approve the email', off: -3, who: 'owner' }, { key: 'store', label: 'Schedule it', off: -1 }],
    draft: 'Write the email: "Subject:" and a subject line, "Preview:" and a preview line, then the body in short sections with one clear thing to do at the end.',
  },
  shoot: {
    label: 'Photo shoot', channels: [], per_month: 0.5,
    asks: [{ key: 'shots', q: 'What do we need pictures of?' }, { key: 'where', q: 'Where is it, and who is in it?' },
      { key: 'use', q: 'Where will the pictures go? (website, social, menu, press)' }],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -28, who: 'owner' }, { key: 'draft', label: 'Write the shot list', off: -24 },
      { key: 'book', label: 'Book the photographer', off: -21,
        request: 'Hi,\n\nWe are booking a photo shoot for {brand} on or near {due}. It is about {hours} hours on location, and we have a shot list ready to send. Are you free that week, and what is your rate for it?\n\nThank you,\n{brand} team' },
      { key: 'ok', label: 'Approve the shot list', off: -18, who: 'owner' }, { key: 'confirm', label: 'Confirm the day with the photographer', off: -14 },
      { key: 'shoot', label: 'Shoot day', off: -7 }, { key: 'selects', label: 'Pick the best pictures', off: -3, who: 'owner' },
      { key: 'store', label: 'Pictures into the Library', off: 0 }],
    draft: 'Write the shot list: each shot on its own line, saying what is in it, how it is framed, and where it will be used.',
  },
  episode: {
    label: 'Podcast episode', channels: [], per_month: 0,
    asks: [{ key: 'guest', q: 'Who is the guest, and how do we reach them?' }, { key: 'topic', q: 'What is the conversation about?' },
      { key: 'qs', q: 'Three questions we must ask' }],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -42, who: 'owner' },
      { key: 'book', label: 'Invite the guest', off: -35,
        request: 'Hi,\n\nWe would love to have you on the {brand} podcast. We are recording in the next few weeks for an episode that comes out around {due}. It is a relaxed conversation of about 45 minutes, recorded online. Would you be up for it?\n\nThank you,\n{brand} team' },
      { key: 'record', label: 'Record it', off: -21 }, { key: 'edit', label: 'Edit it', off: -10 }, { key: 'draft', label: 'Write the show notes', off: -7 },
      { key: 'ok', label: 'Approve the show notes', off: -5, who: 'owner' }, { key: 'store', label: 'Schedule it', off: -1 }, { key: 'share', label: 'Share it on social', off: 1 }],
    draft: 'Write the show notes: a title on the first line, a two sentence summary, then three to five things the conversation covers.',
  },
  event: {
    label: 'Event', channels: [], per_month: 0,
    asks: [{ key: 'what', q: 'What is the event?' }, { key: 'where', q: 'Where and when is it, and who is it for?' },
      { key: 'partners', q: 'Who is working with us on it?' }],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -49, who: 'owner' }, { key: 'draft', label: 'Write the event plan', off: -42 },
      { key: 'venue', label: 'Venue and partners confirmed', off: -35 }, { key: 'ok', label: 'Approve the event plan', off: -30, who: 'owner' },
      { key: 'announce', label: 'Announce it', off: -21 }, { key: 'push', label: 'Social push', off: -14 }, { key: 'remind', label: 'Reminder out', off: -2 },
      { key: 'day', label: 'Event day', off: 0 }, { key: 'store', label: 'Recap and pictures stored', off: 3 }],
    draft: 'Write the event plan: what, when, where, who it is for, the run of the day, then a line "Announcement:" and the announcement post.',
  },
  website: {
    label: 'Website update', channels: [], per_month: 0,
    asks: [{ key: 'what', q: 'What changes on the website?' }, { key: 'why', q: 'Why now, and what should a visitor do?' }],
    steps: [{ key: 'answers', label: 'Answer the questions', off: -10, who: 'owner' }, { key: 'draft', label: 'Write the new copy', off: -6 },
      { key: 'ok', label: 'Approve the copy', off: -3, who: 'owner' }, { key: 'store', label: 'Live on the site', off: 0 }],
    draft: 'Write the new website copy, section by section, each with a heading.',
  },
};
const lead = (k: Kind) => -Math.min(0, ...k.steps.map((s) => s.off));
const NETS = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'threads', 'pinterest', 'bluesky', 'gmb'];
const STATUSES = ['ask', 'draft', 'review', 'changes', 'approved', 'stored', 'skipped'];

function cleanRhythm(r: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(KINDS)) {
    const v = Number(r?.[k] ?? 0);
    out[k] = isFinite(v) ? Math.max(0, Math.min(30, Math.round(v * 4) / 4)) : 0;
  }
  return out;
}
// The pieces a plan lays out: n a month spread through each month on weekdays; a piece whose steps would start before today (or the
// plan's start) moves later in its month, and is left out if it no longer fits there.
function lay(starts: string, months: number, rhythm: Record<string, number>, today: string) {
  const floor = starts > today ? starts : today;
  const out: { kind: string; due: string }[] = [];
  for (const [kind, n] of Object.entries(rhythm)) {
    if (!n || !KINDS[kind]) continue;
    const need = lead(KINDS[kind]);
    let prev = '';
    for (let m = 0; m < months; m++) {
      const ms = addMonths(starts, m), me = addDays(addMonths(starts, m + 1), -1);
      const len = (dms(me) - dms(ms)) / 864e5 + 1;
      const count = Math.floor((m + 1) * n + 1e-9) - Math.floor(m * n + 1e-9);
      for (let k = 0; k < count; k++) {
        let due = addDays(ms, Math.floor(((k + 0.5) * len) / count));
        const earliest = addDays(floor, need);
        if (due < earliest) due = earliest;
        // never two of a kind on one day: a piece pushed later keeps its spacing after the one before
        if (prev && due <= prev) due = addDays(prev, Math.max(1, Math.floor(len / count / 2)));
        if (dow(due) === 6) due = addDays(due, 2); else if (dow(due) === 0) due = addDays(due, 1);
        if (due > me) continue;
        out.push({ kind, due });
        prev = due;
      }
    }
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.kind < b.kind ? -1 : 1));
}
function fill(t: string, v: Record<string, string>) { return t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? ''); }
function stepsFor(kind: string, piece: string, plan: string, due: string, brandName: string) {
  return KINDS[kind].steps.map((s, i) => ({
    id: crypto.randomUUID(), piece_id: piece, plan_id: plan, key: s.key, label: s.label, who: s.who || 'team', off_days: s.off,
    do_by: addDays(due, s.off), position: i, request: s.request ? fill(s.request, { brand: brandName, due: long(due), hours: '3' }) : null,
  }));
}

// ---- who ----
type Who = { ops: boolean; admin: boolean; id: string | null; name: string };
async function roleFor(who: Who, brand: string): Promise<'editor' | 'viewer' | null> {
  if (who.ops || who.admin) return 'editor';
  if (!who.id) return null;
  const { data } = await db.from('ve_social_people').select('role').eq('brand_slug', brand).eq('member_id', who.id).maybeSingle();
  return (data?.role as any) || null;
}
async function brandInfo(brand: string) {
  const [{ data: kit }, { data: soc }] = await Promise.all([
    db.from('ve_brand_cartridges').select('name, status, data').eq('brand_slug', brand).maybeSingle(),
    db.from('ve_social_brands').select('slug, name, channels, active').eq('slug', brand).maybeSingle(),
  ]);
  return { kit, soc, name: (kit?.data as any)?.business?.name || kit?.name || soc?.name || brand };
}
async function all<T>(q: (from: number, to: number) => any): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < 20; i++) {
    const { data, error } = await q(i * 1000, i * 1000 + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}
async function note(piece: string, who: Who, kind: string, body: string, draft_v?: number) {
  await db.from('ve_plan_notes').insert({ piece_id: piece, member_id: who.id, author: who.name, kind, body: body.slice(0, 4000), draft_v: draft_v ?? null });
}
async function tick(piece: string, key: string, who: Who, done = true) {
  await db.from('ve_plan_steps').update(done ? { done_at: new Date().toISOString(), done_by_name: who.name } : { done_at: null, done_by_name: null })
    .eq('piece_id', piece).eq('key', key);
}
async function loadPiece(id: unknown, who: Who, need: 'viewer' | 'editor'): Promise<{ p?: any; role?: string; err?: any }> {
  if (!isId(id)) return { err: { error: 'bad_id' } };
  const { data: p } = await db.from('ve_plan_pieces').select('*').eq('id', id).maybeSingle();
  if (!p) return { err: { error: 'not_found' } };
  const role = await roleFor(who, p.brand_slug);
  if (!role || (need === 'editor' && role !== 'editor')) return { err: { error: 'forbidden' } };
  return { p, role };
}
const answered = (asks: any[]) => asks.every((a) => clean(a?.a, 4000));
const touch = (o: Record<string, unknown>) => ({ ...o, updated_at: new Date().toISOString() });

async function act(b: any, who: Who): Promise<any> {
  const a = String(b.action || '');
  const today = todayET();

  if (a === 'kinds') {
    return { kinds: Object.entries(KINDS).map(([k, v]) => ({ key: k, label: v.label, social: !!v.social, channels: v.channels, per_month: v.per_month, lead_days: lead(v),
      asks: v.asks, steps: v.steps.map((s) => ({ key: s.key, label: s.label, off: s.off, who: s.who || 'team' })) })), today };
  }

  if (a === 'plans' || a === 'plan_preview' || a === 'plan_create' || a === 'today') {
    const brand = clean(b.brand, 60).toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(brand)) return { error: 'bad_brand' };
    const role = await roleFor(who, brand);
    if (!role) return { error: 'forbidden' };
    const info = await brandInfo(brand);
    const kitState = info.kit ? info.kit.status : 'none';

    if (a === 'plans') {
      const { data: plans } = await db.from('ve_plans').select('*').eq('brand_slug', brand).order('created_at', { ascending: false });
      const ids = (plans || []).map((p: any) => p.id);
      const pieces = ids.length ? await all<any>((f, t) => db.from('ve_plan_pieces').select('plan_id, status').in('plan_id', ids).range(f, t)) : [];
      const late = ids.length ? await all<any>((f, t) => db.from('ve_plan_steps').select('plan_id').in('plan_id', ids).is('done_at', null).lt('do_by', today).range(f, t)) : [];
      const out = (plans || []).map((p: any) => {
        const mine = pieces.filter((x) => x.plan_id === p.id);
        const by: Record<string, number> = {};
        for (const x of mine) by[x.status] = (by[x.status] || 0) + 1;
        return { ...p, pieces: mine.length, by_status: by, late_steps: late.filter((x) => x.plan_id === p.id).length };
      });
      return { plans: out, role, kit: kitState, brand_name: info.name, social: info.soc ? { channels: info.soc.channels || [], active: info.soc.active } : null, today };
    }

    if (a === 'today') {
      const { data: plans } = await db.from('ve_plans').select('id, name').eq('brand_slug', brand).eq('status', 'active');
      const ids = (plans || []).map((p: any) => p.id);
      if (!ids.length) return { steps: [], waiting: [], role, today };
      const until = addDays(today, 7);
      const steps = await all<any>((f, t) => db.from('ve_plan_steps').select('id, piece_id, plan_id, key, label, who, do_by, request')
        .in('plan_id', ids).is('done_at', null).lte('do_by', until).order('do_by').order('position').range(f, t));
      const pids = [...new Set(steps.map((s) => s.piece_id))];
      const pieces = pids.length ? await all<any>((f, t) => db.from('ve_plan_pieces').select('id, kind, title, due_on, status').in('id', pids).range(f, t)) : [];
      const pm = new Map(pieces.map((p) => [p.id, p]));
      const open = steps.filter((s) => { const p: any = pm.get(s.piece_id); return p && p.status !== 'skipped' && p.status !== 'stored'; })
        .map((s) => ({ ...s, piece: pm.get(s.piece_id) }));
      const { data: waiting } = await db.from('ve_plan_pieces').select('id, plan_id, kind, title, due_on, status, draft_v').in('plan_id', ids).eq('status', 'review').order('due_on').limit(100);
      return { steps: open, waiting: waiting || [], role, today, plans: plans || [] };
    }

    // preview and create
    const months = Number(b.months);
    if (![3, 6, 12].includes(months)) return { error: 'bad_months' };
    const starts = isDay(b.starts_on) ? b.starts_on : today;
    if (starts < addDays(today, -1) || starts > addDays(today, 366)) return { error: 'bad_start' };
    const rhythm = cleanRhythm(b.rhythm);
    const laid = lay(starts, months, rhythm, today);
    if (laid.length > 600) return { error: 'too_many', message: 'That is more than 600 pieces. Lower the rhythm.' };
    const ends = addDays(addMonths(starts, months), -1);
    if (a === 'plan_preview') {
      const byKind: Record<string, number> = {}, byMonth: Record<string, number> = {};
      for (const x of laid) { byKind[x.kind] = (byKind[x.kind] || 0) + 1; const mk = x.due.slice(0, 7); byMonth[mk] = (byMonth[mk] || 0) + 1; }
      return { starts_on: starts, ends_on: ends, total: laid.length, by_kind: byKind, by_month: byMonth, first: laid.slice(0, 8), kit: kitState };
    }
    if (role !== 'editor') return { error: 'forbidden' };
    // The launch gate: a plan only for a launched brand kit (canon: brand kit first, then launch opens the modules).
    if (kitState !== 'launched') return { error: 'kit_not_launched', message: 'Launch the brand kit first. Every part locked, then Launch.' };
    if (!laid.length) return { error: 'empty', message: 'Pick at least one kind of piece.' };
    const support = ['self', 'supported', 'managed'].includes(b.support) ? b.support : 'managed';
    const name = clean(b.name, 120) || `${info.name}: ${months} months from ${short(starts)}`;
    const { data: plan, error } = await db.from('ve_plans').insert({ brand_slug: brand, name, months, starts_on: starts, ends_on: ends, support, rhythm,
      created_by: who.id, created_by_name: who.name }).select('*').single();
    if (error || !plan) return { error: 'save_failed', message: error?.message };
    const pieces: any[] = [], steps: any[] = [];
    const soc = new Set<string>(info.soc?.channels || []);
    for (const x of laid) {
      const K = KINDS[x.kind], id = crypto.randomUUID();
      pieces.push({ id, plan_id: plan.id, brand_slug: brand, kind: x.kind, title: `${K.label} · ${short(x.due)}`, due_on: x.due,
        channels: K.social ? K.channels.filter((c) => !soc.size || soc.has(c)) : [], asks: K.asks.map((q) => ({ key: q.key, q: q.q, a: '' })) });
      steps.push(...stepsFor(x.kind, id, plan.id, x.due, info.name));
    }
    for (let i = 0; i < pieces.length; i += 500) {
      const { error: e1 } = await db.from('ve_plan_pieces').insert(pieces.slice(i, i + 500));
      if (e1) { await db.from('ve_plans').delete().eq('id', plan.id); return { error: 'save_failed', message: e1.message }; }
    }
    for (let i = 0; i < steps.length; i += 500) {
      const { error: e2 } = await db.from('ve_plan_steps').insert(steps.slice(i, i + 500));
      if (e2) { await db.from('ve_plans').delete().eq('id', plan.id); return { error: 'save_failed', message: e2.message }; }
    }
    return { ok: true, plan, pieces: pieces.length, steps: steps.length };
  }

  if (a === 'plan_get' || a === 'plan_save' || a === 'piece_add') {
    const pid = a === 'piece_add' ? b.plan_id : b.id;
    if (!isId(pid)) return { error: 'bad_id' };
    const { data: plan } = await db.from('ve_plans').select('*').eq('id', pid).maybeSingle();
    if (!plan) return { error: 'not_found' };
    const role = await roleFor(who, plan.brand_slug);
    if (!role) return { error: 'forbidden' };
    if (a === 'plan_get') {
      const pieces = await all<any>((f, t) => db.from('ve_plan_pieces').select('id, kind, title, due_on, status, channels, draft_v, stored')
        .eq('plan_id', plan.id).order('due_on').order('kind').range(f, t));
      const steps = await all<any>((f, t) => db.from('ve_plan_steps').select('piece_id, label, do_by, who')
        .eq('plan_id', plan.id).is('done_at', null).order('do_by').order('position').range(f, t));
      const next = new Map<string, any>();
      const late = new Map<string, number>();
      for (const s of steps) {
        if (!next.has(s.piece_id)) next.set(s.piece_id, { label: s.label, do_by: s.do_by, who: s.who });
        if (s.do_by < today) late.set(s.piece_id, (late.get(s.piece_id) || 0) + 1);
      }
      const info = await brandInfo(plan.brand_slug);
      return { plan, role, today, brand_name: info.name, pieces: pieces.map((p) => ({ ...p,
        next: p.status === 'stored' || p.status === 'skipped' ? null : next.get(p.id) || null, late: p.status === 'stored' || p.status === 'skipped' ? 0 : late.get(p.id) || 0 })) };
    }
    if (role !== 'editor') return { error: 'forbidden' };
    if (a === 'plan_save') {
      const patch: Record<string, unknown> = {};
      if (b.name !== undefined) { const n = clean(b.name, 120); if (!n) return { error: 'name_needed' }; patch.name = n; }
      if (b.status !== undefined) { if (!['active', 'paused', 'ended'].includes(b.status)) return { error: 'bad_status' }; patch.status = b.status; }
      const { data, error } = await db.from('ve_plans').update(touch(patch)).eq('id', plan.id).select('*').single();
      return error ? { error: 'save_failed', message: error.message } : { ok: true, plan: data };
    }
    // piece_add
    const K = KINDS[String(b.kind)];
    if (!K) return { error: 'bad_kind' };
    if (!isDay(b.due_on) || b.due_on < today) return { error: 'bad_due' };
    const info = await brandInfo(plan.brand_slug);
    const soc = new Set<string>(info.soc?.channels || []);
    const id = crypto.randomUUID();
    const { error } = await db.from('ve_plan_pieces').insert({ id, plan_id: plan.id, brand_slug: plan.brand_slug, kind: b.kind,
      title: clean(b.title, 160) || `${K.label} · ${short(b.due_on)}`, due_on: b.due_on, channels: K.social ? K.channels.filter((c) => !soc.size || soc.has(c)) : [],
      asks: K.asks.map((q) => ({ key: q.key, q: q.q, a: '' })) });
    if (error) return { error: 'save_failed', message: error.message };
    await db.from('ve_plan_steps').insert(stepsFor(b.kind, id, plan.id, b.due_on, info.name));
    await note(id, who, 'event', `${who.name} added this piece.`);
    return { ok: true, id };
  }

  if (a === 'step_done') {
    if (!isId(b.id)) return { error: 'bad_id' };
    const { data: s } = await db.from('ve_plan_steps').select('id, piece_id, label').eq('id', b.id).maybeSingle();
    if (!s) return { error: 'not_found' };
    const { err } = await loadPiece(s.piece_id, who, 'editor');
    if (err) return err;
    const done = b.done !== false;
    await db.from('ve_plan_steps').update(done ? { done_at: new Date().toISOString(), done_by_name: who.name } : { done_at: null, done_by_name: null }).eq('id', s.id);
    await note(s.piece_id, who, 'event', `${who.name} ${done ? 'ticked' : 'unticked'} ${s.label}.`);
    return { ok: true };
  }

  // ---- one piece ----
  const need = a === 'piece_get' ? 'viewer' : 'editor';
  if (!['piece_get', 'piece_save', 'piece_draft', 'piece_send', 'piece_decide', 'piece_store', 'piece_skip', 'note_add'].includes(a)) return { error: 'unknown_action' };
  const { p, role, err } = await loadPiece(b.id, who, need as any);
  if (err) return err;
  const K = KINDS[p.kind];

  if (a === 'piece_get') {
    const [{ data: steps }, { data: notes }, { data: plan }] = await Promise.all([
      db.from('ve_plan_steps').select('*').eq('piece_id', p.id).order('position'),
      db.from('ve_plan_notes').select('id, author, kind, body, draft_v, created_at').eq('piece_id', p.id).order('created_at'),
      db.from('ve_plans').select('id, name, brand_slug, status, support').eq('id', p.plan_id).maybeSingle(),
    ]);
    const info = await brandInfo(p.brand_slug);
    let slot = null;
    if (p.stored?.social_slot_id) {
      const { data } = await db.from('ve_social_slots').select('id, status, slot_at, channels').eq('id', p.stored.social_slot_id).maybeSingle();
      slot = data;
    }
    return { piece: p, kind: { key: p.kind, label: K?.label || p.kind, social: !!K?.social, channels: K?.channels || [] }, steps: steps || [], notes: notes || [],
      plan, role, admin: who.admin || who.ops, today, brand_name: info.name, social: info.soc ? { channels: info.soc.channels || [] } : null, slot };
  }
  if (p.status === 'stored' && a !== 'note_add') return { error: 'stored', message: 'It is stored. Leave a note instead.' };

  if (a === 'note_add') {
    const body = clean(b.body, 4000);
    if (!body) return { error: 'empty' };
    await note(p.id, who, 'comment', body, p.draft_v || undefined);
    return { ok: true };
  }

  if (a === 'piece_skip') {
    const undo = b.undo === true;
    if (undo && p.status !== 'skipped') return { error: 'not_skipped' };
    const status = undo ? (p.draft ? 'draft' : answered(p.asks || []) ? 'draft' : 'ask') : 'skipped';
    await db.from('ve_plan_pieces').update(touch({ status })).eq('id', p.id);
    await note(p.id, who, 'event', undo ? `${who.name} brought it back.` : `${who.name} skipped it.`);
    return { ok: true, status };
  }

  if (p.status === 'skipped') return { error: 'skipped', message: 'Bring it back first.' };

  if (a === 'piece_save') {
    const patch: Record<string, unknown> = {};
    const said: string[] = [];
    if (b.title !== undefined) { const t = clean(b.title, 160); if (!t) return { error: 'title_needed' }; if (t !== p.title) { patch.title = t; said.push('the title'); } }
    if (b.channels !== undefined) {
      const ch = (Array.isArray(b.channels) ? b.channels : []).map(String).filter((c: string) => NETS.includes(c));
      patch.channels = [...new Set(ch)]; said.push('the channels');
    }
    if (b.brief !== undefined) { patch.brief = clean(b.brief, 4000) || null; said.push('the brief'); }
    let asks = p.asks || [];
    if (b.answers && typeof b.answers === 'object') {
      asks = asks.map((q: any) => (b.answers[q.key] !== undefined ? { ...q, a: clean(b.answers[q.key], 4000) } : q));
      patch.asks = asks; said.push('the answers');
    }
    if (b.draft !== undefined) {
      const d = clean(b.draft, 20000);
      if (d !== (p.draft || '')) { patch.draft = d || null; patch.draft_v = (p.draft_v || 0) + 1; patch.draft_by = who.name; patch.draft_at = new Date().toISOString(); said.push('the draft'); }
    }
    if (b.due_on !== undefined && b.due_on !== p.due_on) {
      if (!isDay(b.due_on) || b.due_on < today) return { error: 'bad_due' };
      patch.due_on = b.due_on; said.push(`the date to ${short(b.due_on)}`);
    }
    // the status follows the answers: all answered moves a piece on from ask
    if (p.status === 'ask' && answered(asks)) patch.status = 'draft';
    if (Object.keys(patch).length) {
      const { error } = await db.from('ve_plan_pieces').update(touch(patch)).eq('id', p.id);
      if (error) return { error: 'save_failed', message: error.message };
    }
    if (patch.due_on) {
      const { data: steps } = await db.from('ve_plan_steps').select('id, off_days').eq('piece_id', p.id).is('done_at', null);
      for (const s of steps || []) await db.from('ve_plan_steps').update({ do_by: addDays(String(patch.due_on), s.off_days) }).eq('id', s.id);
    }
    if (b.requests && typeof b.requests === 'object') {
      for (const [sid, text] of Object.entries(b.requests)) if (isId(sid)) await db.from('ve_plan_steps').update({ request: clean(text, 4000) || null }).eq('id', sid).eq('piece_id', p.id);
    }
    if (patch.asks && answered(asks)) await tick(p.id, 'answers', who);
    if (said.length) await note(p.id, who, 'event', `${who.name} changed ${said.join(', ')}.`);
    return { ok: true, status: patch.status || p.status };
  }

  if (a === 'piece_send') {
    if (!clean(p.draft, 20000)) return { error: 'no_draft' };
    if (p.status === 'review') return { ok: true, status: 'review' };
    if (p.status === 'approved') return { error: 'approved' };
    await db.from('ve_plan_pieces').update(touch({ status: 'review' })).eq('id', p.id);
    await tick(p.id, 'draft', who);
    await note(p.id, who, 'event', `${who.name} sent draft ${p.draft_v || 1} for the OK.`, p.draft_v || 1);
    return { ok: true, status: 'review' };
  }

  if (a === 'piece_decide') {
    if (p.status !== 'review') return { error: 'not_waiting', message: 'Nothing is waiting for an OK.' };
    if (b.decision === 'approve') {
      if (!(who.admin || who.ops)) return { error: 'forbidden', message: 'The owner approves. Leave a note or ask for changes.' };
      await db.from('ve_plan_pieces').update(touch({ status: 'approved', approved_by: who.id, approved_by_name: who.name, approved_at: new Date().toISOString() })).eq('id', p.id);
      await tick(p.id, 'ok', who);
      await note(p.id, who, 'event', `${who.name} approved draft ${p.draft_v}.`, p.draft_v);
      return { ok: true, status: 'approved' };
    }
    if (b.decision === 'changes') {
      const n = clean(b.note, 4000);
      if (!n) return { error: 'note_needed', message: 'Say what to change.' };
      await db.from('ve_plan_pieces').update(touch({ status: 'changes' })).eq('id', p.id);
      await note(p.id, who, 'changes', n, p.draft_v);
      return { ok: true, status: 'changes' };
    }
    return { error: 'bad_decision' };
  }

  if (a === 'piece_store') {
    if (p.status !== 'approved') return { error: 'not_approved', message: 'It needs the OK first.' };
    const stored: Record<string, unknown> = { at: new Date().toISOString(), by: who.name };
    const url = clean(b.url, 1000);
    if (url && !/^https?:\/\//i.test(url)) return { error: 'bad_url' };
    if (url) stored.url = url;
    if (clean(b.note, 600)) stored.note = clean(b.note, 600);
    if (b.social) {
      if (!K?.social) return { error: 'not_social' };
      const info = await brandInfo(p.brand_slug);
      if (!info.soc) return { error: 'no_social_plan', message: 'This brand is not on the Social plan yet.' };
      const d = isDay(b.social.date) ? b.social.date : p.due_on;
      const hm = /^\d{2}:\d{2}$/.test(String(b.social.time || '')) ? b.social.time : '12:30';
      if (d < today) return { error: 'bad_date' };
      const have = new Set<string>(info.soc.channels || []);
      const ch = (Array.isArray(b.social.channels) && b.social.channels.length ? b.social.channels : p.channels).map(String).filter((c: string) => have.has(c));
      if (!ch.length) return { error: 'no_channels' };
      const text = String(p.draft || '');
      const cap = /\nCaption:\s*([\s\S]+)$/i.exec(text);
      const caption = (cap ? cap[1] : text).trim().slice(0, 2200);
      const links = [...new Set((caption.match(/https?:\/\/[^\s<>"')\]]+/g) || []).map((u) => u.replace(/[.,;:!?]+$/, '')))];
      const { data: slot, error } = await db.from('ve_social_slots').insert({ brand_slug: p.brand_slug, slot_at: easternIso(d, hm), channels: ch, kind: K.social,
        title: p.title, caption, links, assets: [], status: 'proposed', batch: `plan:${p.plan_id}`, proposed_by: 'BrandDesk plan' }).select('id, slot_at').single();
      if (error || !slot) return { error: 'save_failed', message: error?.message };
      stored.social_slot_id = slot.id;
    }
    if (!stored.url && !stored.social_slot_id && !stored.note) return { error: 'where_needed', message: 'Say where it lives: a link, a note, or the Social plan.' };
    await db.from('ve_plan_pieces').update(touch({ status: 'stored', stored, stored_at: stored.at })).eq('id', p.id);
    await tick(p.id, 'store', who);
    await note(p.id, who, 'event', stored.social_slot_id ? `${who.name} put it on the Social plan, waiting for approval there.` : `${who.name} stored it.`);
    return { ok: true, status: 'stored', stored };
  }

  if (a === 'piece_draft') {
    if (!K) return { error: 'bad_kind' };
    if (!answered(p.asks || [])) return { error: 'answers_needed', message: 'Answer every question first.' };
    if (p.status === 'approved') return { error: 'approved' };
    const { data: kit } = await db.from('ve_brand_cartridges').select('data').eq('brand_slug', p.brand_slug).maybeSingle();
    const k: any = kit?.data || {};
    const { data: notes } = await db.from('ve_plan_notes').select('kind, body, draft_v').eq('piece_id', p.id).eq('kind', 'changes').order('created_at', { ascending: false }).limit(3);
    const apiKey = await secret('ANTHROPIC_API_KEY');
    if (!apiKey) return { error: 'no_model_key' };
    const voice = k.voice ? JSON.stringify(k.voice).slice(0, 3000) : 'not set';
    const story = k.story ? JSON.stringify(k.story).slice(0, 2000) : 'not set';
    const prompt = `Brand: ${k.business?.name || p.brand_slug}.\nTheir voice (locked in their brand kit): ${voice}\nTheir story: ${story}\n\n` +
      `The piece: ${K.label}, "${p.title}", going out ${long(p.due_on)}.${p.channels?.length ? ' Channels: ' + p.channels.join(', ') + '.' : ''}\n` +
      (p.brief ? `The brief: ${p.brief}\n` : '') +
      `Their answers:\n${(p.asks || []).map((q: any) => `- ${q.q}\n  ${q.a}`).join('\n')}\n` +
      (p.draft && notes?.length ? `\nThe last draft:\n${p.draft}\n\nWhat they asked to change (newest first):\n${notes.map((n: any) => '- ' + n.body).join('\n')}\n` : '') +
      `\nTask: ${K.draft}`;
    try {
      const client = new Anthropic({ apiKey });
      const res: any = await client.beta.messages.create({
        model: MODEL, max_tokens: 4000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: {
          type: 'object', additionalProperties: false, required: ['title', 'draft', 'notes'],
          properties: { title: { type: 'string', description: 'A short working title for the piece, under 80 characters' },
            draft: { type: 'string', description: 'The piece itself, ready for the owner to read' },
            notes: { type: 'string', description: 'One or two sentences for the team: anything the answers left open, or an empty string' } } } } },
        system: 'You write marketing pieces for brands run on LESARUSS BrandDesk, in the brand\'s own locked voice. Rules: write only what the answers, the brief and the brand kit give you; never invent a fact, a person, a number, a date, a quote or a claim. ' +
          '"Vegan" always has a capital V. No em dashes or en dashes. Short sentences. Plain words. Follow the voice\'s never list and words to avoid.',
        messages: [{ role: 'user', content: prompt }],
      } as any);
      if (res.stop_reason === 'refusal') return { error: 'refused' };
      const out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
      const fix = (s: string) => String(s || '').replace(/\s*[—–]\s*/g, ', ').replace(/\bvegan\b/g, 'Vegan').trim();
      const draft = fix(out.draft).slice(0, 20000);
      const v = (p.draft_v || 0) + 1;
      const patch: Record<string, unknown> = { draft, draft_v: v, draft_by: 'Logan (AI)', draft_at: new Date().toISOString(), status: 'review' };
      if (/ · [A-Z][a-z]{2} \d{1,2}$/.test(p.title) && clean(out.title, 80)) patch.title = `${K.label}: ${fix(out.title).slice(0, 80)}`;
      await db.from('ve_plan_pieces').update(touch(patch)).eq('id', p.id);
      await tick(p.id, 'draft', who);
      await note(p.id, who, 'event', `Logan wrote draft ${v} (asked by ${who.name}).${clean(out.notes, 600) ? ' ' + fix(out.notes) : ''}`, v);
      return { ok: true, status: 'review', draft, draft_v: v, notes: fix(out.notes) };
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return { error: 'busy' };
      return { error: String((e as Error).message || e).slice(0, 200) };
    }
  }
  return { error: 'unknown_action' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    const who: Who = { ops, admin: false, id: null, name: 'Logan' };
    const asMember = ops && isId(body.as_member) ? body.as_member : null;
    const sub = asMember || (!ops && token ? await verifyToken(token) : null);
    if (!ops && !sub) return json({ error: 'not_authenticated' }, 401);
    if (sub) {
      const { data: me } = await db.from('members').select('is_superadmin, name').eq('id', sub).maybeSingle();
      if (!me) return json({ error: 'not_authenticated' }, 401);
      const parts = String(me.name || '').trim().split(/\s+/).filter(Boolean);
      who.ops = false; who.admin = !!me.is_superadmin; who.id = sub;
      who.name = parts.length ? parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1][0] + '.' : '') : 'A team member';
    }
    const out = await act(body, who);
    const code = out?.error === 'forbidden' ? 403 : out?.error === 'not_found' ? 404 : out?.error && /^bad_|_needed$|^empty$|^too_many$/.test(out.error) ? 400 : 200;
    return json(out, code);
  } catch (e) {
    console.error('ve-plan:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
