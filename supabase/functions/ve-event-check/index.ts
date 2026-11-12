// ve-event-check: the weekly check of every upcoming event against its official page, and the leads every event feeds the
// Directory (Sean, 2026-11-02: "run a scan at least once a week just to make sure the event information is still available";
// "we put one thing in, put in one event, and we can get a whole bunch of things from that"). Migration
// 20261102_event_intake_feeds.sql.
//
// POST { action: 'sweep', limit? }           cron (x-cron-secret) or ops -> { checked, results, leads }
// POST { action: 'one', id, save? }          ops or a super admin: read one event's page (save: false only reports)
// POST { action: 'checks', outcome? }        super admin: what the weekly check found, worst first
// POST { action: 'leads', kind, status? }    super admin: venues and organizers our events name that are not in the Directory
// POST { action: 'lead_add', id, category }  super admin: add a lead as a listing from what its events say (no Google)
// POST { action: 'lead_link', id, slug }     super admin: tie a lead's events to a listing already in the Directory
// POST { action: 'lead_aside', id, note? }   super admin: not a venue or organizer we list
// POST { action: 'lead_refresh' }            super admin or ops
// POST { action: 'gate', limit? }             cron or ops or a super admin: the gates on events waiting for approval (below)
// POST { action: 'holds' }                    super admin: what the gates left for a person (held, and duplicate pairs)
// POST { action: 'not_dupes', a, b }          super admin: the pair are two different events; never match them again
// POST { action: 'support_swap', id }         super admin: make this supporter the main event (the old main goes under it)
//
// Supporting organizations (Sean, 2026-11-11, migration 20261111_event_supporters.sql): two organizations listing one event no
// longer wait for Sean. The official one stays the event; the other goes under it (status 'supporting', dupe_of), shown on the
// event's page with its Directory page and its own link to register, and still on its own group's Directory page.
//
// The gates (Sean, 2026-11-11: "If they are still active, if they have a link to register, it hasn't been canceled, it's not
// duplicated, I would say we can roll with it"; migration 20261111_event_gates.sql). Every event waiting for approval that the
// crawl, a flyer or the team brought in (members' own still wait for a person) goes through, in order:
//   1. Duplicates (ve_event_gate_dupes): the same event by the same organizer is folded into the one we keep (turned down as
//      "Duplicate of <id>"); the same event by two organizations waits for Sean side by side (gate_status 'duplicate').
//   2. Its official page (checkOne): still there and still this event -> live (gate_status 'passed'); cancelled -> off;
//      a page that is gone (404 or 410 twice) -> turned down; a page that loads without this event on it -> held; a 404 once, postponed, or a page we cannot read -> waits (gate_status 'held', gate_note why),
//      asked again the next day.
// Live duplicates are folded or flagged the same way first (ve_event_live_dupes).
//
// What the check does with an event, from its official page (structured data first, else Claude reads the page):
//   cancelled on the page -> status cancelled (off the calendar), link_status cancelled
//   postponed -> link_status postponed (kept, flagged)
//   a different date or time, on a page that is this event alone -> moved to the page's date, link_status changed, logged
//   404, 410 or a parked domain twice in a row -> link_status gone (kept, flagged for the team)
//   a page that turns readers away -> unreadable (no fault counted)
// Each read fills an empty organizer and an empty place from the page. Every read is a ve_event_checks row.
// Logan's defaults (2026-11-02), Sean's to change: once every 7 days a event, a gone page asked again the next day, a date moved
// only when the page differs by more than 30 minutes and no other event of ours shares the link (a weekly series on one page).
// R (branddesk-production-wing, 2026-11-08): on the 5.x models thinking counts against max_tokens, so every call gets 16000 and a cut-off read is an error, never half an answer.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const VE_TENANT = '00000000-0000-4000-a000-000000000002';
const MODEL = 'claude-opus-5-5';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

const secrets: Record<string, string | null> = {};
async function secret(k: string) {
  if (k in secrets) return secrets[k];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle();
  const v = (data?.value as string) ?? null;
  return (secrets[k] = v && v !== 'pending' ? v : null);
}
function b64u(s: string) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64u(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64u(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function who(req: Request): Promise<{ ops: boolean; admin: boolean; member: string | null }> {
  const cron = req.headers.get('x-cron-secret');
  if (cron && cron === await secret('CRON_SECRET')) return { ops: true, admin: false, member: null };
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return { ops: false, admin: false, member: null };
  if (t === await secret('LESARUSS_ADMIN_TOKEN')) return { ops: true, admin: false, member: null };
  const id = await verifyToken(t);
  if (!id) return { ops: false, admin: false, member: null };
  const { data } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return { ops: false, admin: !!data?.is_superadmin, member: id };
}

// ---- Reading the page ----
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const PARKED = /(domain (is )?for sale|buy this domain|hugedomains|sedo(parking)?|parked (free|domain)|website (has )?expired|account (has been )?suspended)/i;
async function fetchPage(url: string) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' } });
    const text = (await r.text()).slice(0, 1_500_000);
    return { status: r.status, url: r.url, text, err: '' };
  } catch (e) { return { status: 0, url, text: '', err: String((e as Error)?.name === 'AbortError' ? 'timed out' : (e as Error)?.message || e).slice(0, 160) }; }
  finally { clearTimeout(t); }
}

type Found = { name?: string; start?: string; end?: string; status?: string; venue?: string; address?: string; city?: string; state?: string; country?: string; organizer?: string; organizer_url?: string };
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
function flat(x: any, out: any[] = []): any[] {
  if (Array.isArray(x)) x.forEach((y) => flat(y, out));
  else if (x && typeof x === 'object') { out.push(x); if (x['@graph']) flat(x['@graph'], out); }
  return out;
}
function fromLd(o: any): Found {
  const loc = Array.isArray(o.location) ? o.location[0] : o.location || {};
  const adr = typeof loc?.address === 'string' ? { streetAddress: loc.address } : loc?.address || {};
  const org = Array.isArray(o.organizer) ? o.organizer[0] : o.organizer;
  return {
    name: str(o.name), start: str(o.startDate), end: str(o.endDate), status: str(o.eventStatus).split('/').pop(),
    venue: str(loc?.name), address: str(adr.streetAddress), city: str(adr.addressLocality), state: str(adr.addressRegion),
    country: str(typeof adr.addressCountry === 'object' ? adr.addressCountry?.name : adr.addressCountry),
    organizer: str(typeof org === 'string' ? org : org?.name), organizer_url: str(typeof org === 'object' ? org?.url : ''),
  };
}
const words = (s: string) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2));
function overlap(a: string, b: string) { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let n = 0; A.forEach((w) => { if (B.has(w)) n++; }); return n / Math.min(A.size, B.size); }

function structured(html: string, ev: any): { found: Found | null; how: string } {
  const objs: any[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { flat(JSON.parse(m[1].trim()), objs); } catch { /* a broken block */ }
  }
  const events = objs.filter((o) => [].concat(o['@type'] || []).some((t: string) => /Event$/.test(String(t))) && o.startDate);
  if (events.length) {
    const ours = Date.parse(ev.starts_at);
    events.sort((a, b) => (overlap(b.name, ev.title) - overlap(a.name, ev.title)) || (Math.abs(Date.parse(a.startDate) - ours) - Math.abs(Date.parse(b.startDate) - ours)));
    return { found: fromLd(events[0]), how: 'jsonld' };
  }
  // Partiful and other Next.js pages carry the event in __NEXT_DATA__.
  const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nd) {
    try {
      const d = JSON.parse(nd[1]);
      const e = d?.props?.pageProps?.event || d?.props?.pageProps?.initialEvent;
      if (e && (e.startDate || e.startsAt)) {
        const loc = e.locationInfo || {};
        return { found: { name: str(e.title || e.name), start: str(e.startDate || e.startsAt), end: str(e.endDate || e.endsAt),
          status: e.status === 'CANCELED' || e.isCanceled ? 'EventCancelled' : '', venue: str(loc?.value || loc?.mapsInfo?.name),
          address: str(loc?.mapsInfo?.addressLines?.join?.(', ')), organizer: str(e.hosts?.[0]?.name || e.owner?.name) }, how: 'next_data' };
      }
    } catch { /* not ours */ }
  }
  return { found: null, how: 'none' };
}

const READ_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    is_event_page: { type: 'boolean' }, cancelled: { type: 'boolean' }, postponed: { type: 'boolean' },
    start: { type: 'string' }, end: { type: 'string' }, venue: { type: 'string' }, address: { type: 'string' }, city: { type: 'string' },
    organizer: { type: 'string' }, organizer_url: { type: 'string' }, note: { type: 'string' },
  },
  required: ['is_event_page', 'cancelled', 'postponed', 'start', 'end', 'venue', 'address', 'city', 'organizer', 'organizer_url', 'note'],
};
function pageText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 14000);
}
async function askClaude(ev: any, html: string): Promise<Found | null> {
  const key = await secret('ANTHROPIC_API_KEY');
  const text = pageText(html);
  if (!key || text.length < 200) return null;
  try {
    const client = new Anthropic({ apiKey: key });
    const r: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: READ_SCHEMA } },
      system: 'You check an event against its own official page for the Vegans Explore calendar. Copy only what the page says, never guess. ' +
        'start and end are ISO 8601 with the event\'s UTC offset, empty when the page gives none. cancelled or postponed only when the page says so about this event. ' +
        'is_event_page is false when the page does not describe this event at all (a home page, a list of other events, an error). organizer is who the page names as organizer or host.',
      messages: [{ role: 'user', content: `Our event: ${JSON.stringify({ title: ev.title, starts_at: ev.starts_at, timezone: ev.timezone, place: ev.location_name, city: ev.city })}\nThe page (${ev.ticket_url}):\n${text}` }],
    } as any);
    if (r.stop_reason !== 'end_turn') return null; // cut off or refused: could not read, never half a read
    const out = JSON.parse((r.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''));
    if (!out.is_event_page) return { status: 'NotFound' };
    return { start: out.start, end: out.end, status: out.cancelled ? 'EventCancelled' : out.postponed ? 'EventPostponed' : '', venue: out.venue,
      address: out.address, city: out.city, organizer: out.organizer, organizer_url: out.organizer_url };
  } catch (e) { console.error('claude', (e as Error)?.message); return null; }
}

// ---- One event ----
async function checkOne(ev: any, save: boolean) {
  const url = String(ev.ticket_url || '');
  const now = new Date().toISOString();
  const res: any = { id: ev.id, title: ev.title, url };
  let outcome = 'ok', note = '', how = 'none', found: Found | null = null, http = 0;
  const changes: Record<string, unknown> = {};
  const patch: Record<string, unknown> = { link_checked_at: now };

  if (!/^https?:\/\//i.test(url) || /vegansexplore\.com|instagram\.com|facebook\.com/i.test(url)) {
    outcome = 'skipped'; note = /instagram|facebook/i.test(url) ? 'An Instagram or Facebook post: we do not read those each week.' : 'Our own page.';
  } else {
    const pg = await fetchPage(url);
    http = pg.status;
    if (pg.status === 404 || pg.status === 410 || (pg.status === 200 && PARKED.test(pg.text.slice(0, 20000)))) {
      const fails = (ev.link_fails || 0) + 1;
      patch.link_fails = fails;
      outcome = fails >= 2 ? 'gone' : 'ok';
      note = fails >= 2 ? `Its official page is gone (${pg.status || 'parked'}) on two checks.` : `Its official page answered ${pg.status || 'parked'}; we look again tomorrow.`;
    } else if (!pg.status || pg.status >= 400) {
      outcome = 'unreadable'; note = pg.err || `The page turned us away (${pg.status}).`;
    } else {
      patch.link_fails = 0;
      const s = structured(pg.text, ev);
      found = s.found; how = s.how;
      if (!found) { found = await askClaude(ev, pg.text); how = found ? 'claude' : 'none'; }
      if (!found) { outcome = 'unreadable'; note = 'We could not read the event off its page.'; }
      else if (found.status === 'NotFound') { outcome = 'gone'; note = 'The link no longer shows this event.'; found = null; }
      else {
        const st = (found.status || '').toLowerCase();
        if (/cancel/.test(st)) { outcome = 'cancelled'; note = 'Its official page says it is cancelled.'; }
        else if (/postpone/.test(st)) { outcome = 'postponed'; note = 'Its official page says it is postponed.'; }
        // A changed date or time, moved only when this page is this event alone.
        const ps = Date.parse(found.start || ''), ours = Date.parse(ev.starts_at);
        if (outcome === 'ok' && ps && Math.abs(ps - ours) > 30 * 60000 && ps > Date.now() - 86400000) {
          const { count } = await db.from('events').select('id', { count: 'exact', head: true }).eq('ticket_url', url).in('status', ['approved', 'pending']).neq('id', ev.id);
          if (!count) {
            changes.starts_at = { was: ev.starts_at, now: new Date(ps).toISOString() };
            patch.starts_at = new Date(ps).toISOString();
            const pe = Date.parse(found.end || '');
            if (pe && pe > ps) { changes.ends_at = { was: ev.ends_at, now: new Date(pe).toISOString() }; patch.ends_at = new Date(pe).toISOString(); }
            else if (ev.ends_at) { const len = Date.parse(ev.ends_at) - ours; if (len > 0) patch.ends_at = new Date(ps + len).toISOString(); }
            if (ev.time_set === false && /T\d\d:\d\d/.test(found.start || '')) patch.time_set = true;
            outcome = 'changed'; note = 'Its official page has a different date or time; moved to match.';
          } else note = 'Its page shows another date; it is a series on one page, so we left it.';
        }
        // Fill what we were missing, never over what we have.
        if (!ev.organizer_name && found.organizer && found.organizer.length < 160) { patch.organizer_name = found.organizer; changes.organizer_name = found.organizer; }
        if (!ev.organizer_url && /^https?:\/\//.test(found.organizer_url || '')) patch.organizer_url = found.organizer_url;
        if (!ev.location_name && found.venue && ev.event_type !== 'virtual') { patch.location_name = found.venue; changes.location_name = found.venue; }
        if (!ev.address && found.address) patch.address = found.address;
        if (!ev.city && found.city) { patch.city = found.city; changes.city = found.city; }
        if (ev.location_name && found.venue && overlap(ev.location_name, found.venue) < 0.34 && outcome === 'ok')
          note = (note ? note + ' ' : '') + `The page names the place as ${found.venue}; ours says ${ev.location_name}.`;
      }
    }
  }
  patch.link_status = outcome === 'ok' && Object.keys(changes).length ? 'ok' : outcome;
  patch.link_note = note || null;
  if (outcome === 'cancelled') { patch.status = 'cancelled'; patch.rejection_reason = `Cancelled on its official page (weekly check, ${now.slice(0, 10)})`; }
  Object.assign(res, { outcome, http, read_by: how, note, changes, found });
  if (save) {
    await db.from('events').update(patch).eq('id', ev.id);
    await db.from('ve_event_checks').insert({ event_id: ev.id, url, http, outcome, read_by: how, found, changes: Object.keys(changes).length ? changes : null, note: note || null });
  }
  return res;
}

const EV_COLS = 'id, title, starts_at, ends_at, timezone, time_set, ticket_url, location_name, address, city, state, event_type, organizer_name, organizer_url, link_fails, link_status, link_checked_at';
async function due(limit: number) {
  const soon = new Date(Date.now() - 86400000).toISOString();
  const week = new Date(Date.now() - 7 * 86400000).toISOString();
  const day = new Date(Date.now() - 20 * 3600000).toISOString();
  const { data } = await db.from('events').select(EV_COLS).eq('tenant_id', VE_TENANT).eq('status', 'approved').eq('listing_kind', 'event')
    .gte('starts_at', soon).or(`link_checked_at.is.null,link_checked_at.lt.${week},and(link_fails.gt.0,link_checked_at.lt.${day})`)
    .order('link_checked_at', { ascending: true, nullsFirst: true }).order('starts_at', { ascending: true }).limit(limit);
  return data || [];
}

// ---- The gates on events waiting for approval ----
const GATE_COLS = EV_COLS + ', status, source, organizer_name, gate_status, gated_at, created_at, host_listing_id';
async function gateDue(limit: number) {
  const day = new Date(Date.now() - 20 * 3600000).toISOString();
  const { data } = await db.from('events').select(GATE_COLS).eq('tenant_id', VE_TENANT).eq('status', 'pending').eq('listing_kind', 'event')
    .neq('source', 'member').gte('starts_at', new Date(Date.now() - 86400000).toISOString())
    .or(`gate_status.is.null,and(gate_status.eq.held,gated_at.lt.${day})`)
    .order('gated_at', { ascending: true, nullsFirst: true }).order('starts_at', { ascending: true }).limit(limit);
  return data || [];
}
// An event turned down or cancelled lets its supporters go back through the gates on their own.
async function releaseSupporters(id: string) {
  const { data: sups } = await db.from('events').select('id').eq('dupe_of', id).eq('status', 'supporting');
  for (const x of sups || []) await db.rpc('ve_event_support_release', { p_sup: x.id });
}
async function gateOne(ev: any) {
  const now = new Date().toISOString();
  const set = (patch: Record<string, unknown>) => db.from('events').update({ ...patch, gated_at: now }).eq('id', ev.id).eq('status', 'pending');
  const { data: d, error } = await db.rpc('ve_event_gate_dupes', { p_id: ev.id });
  if (error) return { id: ev.id, title: ev.title, outcome: 'error', note: error.message };
  if (d?.action === 'skip') return { id: ev.id, title: ev.title, outcome: 'skipped' };
  if (d?.action === 'fold') {
    await set({ status: 'rejected', rejection_reason: `Duplicate of ${d.into}`, dupe_of: d.into, reviewed_at: now, gate_status: 'passed',
      gate_note: `The same event by the same organizer is already here (${d.why}); folded into it.` });
    return { id: ev.id, title: ev.title, outcome: 'duplicate_folded', into: d.into };
  }
  // Another organization lists it: the official one is the event, the other a supporter under it.
  if (d?.action === 'support' && d.keep !== ev.id) {
    await db.rpc('ve_event_attach_supporter', { p_main: d.keep, p_sup: ev.id });
    return { id: ev.id, title: ev.title, outcome: 'supporting', under: d.keep };
  }
  const r: any = await checkOne(ev, true);
  const supportOther = d?.action === 'support' ? d.with : null; // this one is the official one: the other goes under it once it is live
  const day = now.slice(0, 10);
  if (r.outcome === 'ok' && (r.http === 404 || r.http === 410)) {
    await set({ gate_status: 'held', gate_note: `Its page answered ${r.http}; we look again tomorrow.` });
    return { id: ev.id, title: ev.title, outcome: 'held', note: r.note };
  }
  if (r.outcome === 'ok' || r.outcome === 'changed') {
    await set({ status: 'approved', reviewed_at: now, rejection_reason: null, gate_status: 'passed',
      gate_note: `Passed the gates ${day}: its official page shows it` + (r.outcome === 'changed' ? ', and we moved the date to match.' : '.') });
    if (supportOther) await db.rpc('ve_event_attach_supporter', { p_main: ev.id, p_sup: supportOther });
    return { id: ev.id, title: ev.title, outcome: 'approved', note: r.note, supported_by: supportOther || undefined };
  }
  if (r.outcome === 'cancelled') {
    await releaseSupporters(ev.id);
    await db.from('events').update({ gate_status: 'passed', gated_at: now, gate_note: 'Its official page says it is cancelled.' }).eq('id', ev.id);
    return { id: ev.id, title: ev.title, outcome: 'cancelled' };
  }
  // A page that loads but reads as not this event is often one built in the browser (the neoncrm event portals): held for a
  // person, never turned down on that read alone. Only a page that is really gone (404 or 410 on two checks) is turned down.
  if (r.outcome === 'gone' && r.http === 200) {
    await set({ gate_status: 'held', gate_note: 'Its page loads, but we could not find this event on it (it may only show in a browser). Check it by hand.' });
    return { id: ev.id, title: ev.title, outcome: 'held', note: r.note };
  }
  if (r.outcome === 'gone') {
    await releaseSupporters(ev.id);
    await set({ status: 'rejected', reviewed_at: now, rejection_reason: `Its official page no longer shows this event (checked ${day})`, gate_status: 'passed', gate_note: r.note });
    return { id: ev.id, title: ev.title, outcome: 'turned_down', note: r.note };
  }
  await set({ gate_status: 'held', gate_note: r.note || 'We could not confirm it on its page.' });
  return { id: ev.id, title: ev.title, outcome: 'held', note: r.note };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const w = await who(req);
  if (!w.ops && !w.admin) return json({ error: 'unauthorized' }, 401);

  if (action === 'sweep' || action === 'one') {
    if (action === 'one') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: ev } = await db.from('events').select(EV_COLS).eq('id', body.id).maybeSingle();
      if (!ev) return json({ error: 'not_found' }, 404);
      return json(await checkOne(ev, body.save !== false));
    }
    const list = await due(Math.min(Math.max(Number(body.limit) || 12, 1), 40));
    const results = [];
    for (let i = 0; i < list.length; i += 4) results.push(...(await Promise.all(list.slice(i, i + 4).map((e) => checkOne(e, true).catch((x) => ({ id: e.id, error: String(x) }))))));
    const { data: leads } = await db.rpc('ve_event_leads_refresh');
    return json({ checked: results.length, results: results.map((r: any) => ({ id: r.id, title: r.title, outcome: r.outcome, note: r.note, read_by: r.read_by, error: r.error })), leads });
  }
  if (action === 'lead_refresh') { const { data, error } = await db.rpc('ve_event_leads_refresh'); return json(error ? { error: error.message } : data); }

  if (action === 'gate') {
    const { data: live } = await db.rpc('ve_event_live_dupes');
    const list = await gateDue(Math.min(Math.max(Number(body.limit) || 10, 1), 30));
    const results: any[] = [];
    for (let i = 0; i < list.length; i += 4) results.push(...(await Promise.all(list.slice(i, i + 4).map((e) => gateOne(e).catch((x) => ({ id: e.id, title: e.title, outcome: 'error', note: String(x) }))))));
    const { count: left } = await db.from('events').select('id', { count: 'exact', head: true }).eq('tenant_id', VE_TENANT).eq('status', 'pending').eq('listing_kind', 'event').neq('source', 'member').is('gate_status', null);
    return json({ gated: results.length, results, live, left });
  }

  if (!w.admin && !w.ops) return json({ error: 'forbidden' }, 403);

  if (action === 'holds') {
    // Waiting events the gates left for a person, and every supporting organization under an upcoming event.
    const cols = 'id, title, starts_at, timezone, city, state, country, location_name, ticket_url, organizer_name, status, source, gate_status, gate_note, gated_at, dupe_of, host_listing_id, rsvp_count';
    const soon = new Date(Date.now() - 86400000).toISOString();
    const { data: held } = await db.from('events').select(cols).eq('tenant_id', VE_TENANT).eq('status', 'pending').eq('gate_status', 'held').gte('starts_at', soon).order('starts_at', { ascending: true }).limit(400);
    const { data: sups } = await db.from('events').select(cols).eq('tenant_id', VE_TENANT).eq('status', 'supporting').gte('starts_at', soon).order('starts_at', { ascending: true }).limit(400);
    const mains = [...new Set((sups || []).map((e: any) => e.dupe_of).filter(Boolean))];
    const { data: ms } = mains.length ? await db.from('events').select(cols).in('id', mains) : { data: [] };
    const byId: Record<string, any> = {}; (ms || []).forEach((e: any) => { byId[e.id] = e; });
    const pairs = (sups || []).filter((e: any) => byId[e.dupe_of]).map((e: any) => ({ main: byId[e.dupe_of], sup: e }));
    return json({ held: held || [], pairs, counts: { held: (held || []).length, supporting: pairs.length } });
  }
  if (action === 'support_swap') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.rpc('ve_event_support_swap', { p_sup: body.id });
    return json(error ? { error: error.message } : data);
  }
  if (action === 'not_dupes') {
    if (!isId(body.a) || !isId(body.b) || body.a === body.b) return json({ error: 'bad_id' }, 400);
    const { data: two } = await db.from('events').select('id, status, not_dupes').in('id', [body.a, body.b]);
    if ((two || []).length !== 2) return json({ error: 'not_found' }, 404);
    // A supporter goes back to being its own event, through the gates.
    const sup = (two || []).find((e: any) => e.status === 'supporting');
    if (sup) { const { data, error } = await db.rpc('ve_event_support_release', { p_sup: sup.id }); return json(error ? { error: error.message } : data); }
    for (const e of two || []) {
      const other = e.id === body.a ? body.b : body.a;
      // The waiting one goes back through the gates (its page is read next run); the live one just loses the flag.
      await db.from('events').update({ not_dupes: [...new Set([...(e.not_dupes || []), other])], dupe_of: null, gate_status: null, gate_note: null }).eq('id', e.id);
    }
    return json({ ok: true });
  }
  if (action === 'checks') {
    const outcome = ['changed', 'postponed', 'cancelled', 'gone', 'unreadable'].includes(body.outcome) ? [body.outcome] : ['changed', 'postponed', 'cancelled', 'gone', 'unreadable'];
    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const { data: rows } = await db.from('ve_event_checks').select('id, event_id, checked_at, url, http, outcome, read_by, changes, note').in('outcome', outcome).gte('checked_at', since).order('checked_at', { ascending: false }).limit(300);
    const ids = [...new Set((rows || []).map((r: any) => r.event_id))];
    const { data: evs } = ids.length ? await db.from('events').select('id, title, starts_at, timezone, city, status, link_status').in('id', ids) : { data: [] };
    const byId: Record<string, any> = {}; (evs || []).forEach((e: any) => { byId[e.id] = e; });
    const seen = new Set<string>();
    const latest = (rows || []).filter((r: any) => !seen.has(r.event_id) && seen.add(r.event_id)).map((r: any) => ({ ...r, event: byId[r.event_id] || null }));
    const { count: checked } = await db.from('events').select('id', { count: 'exact', head: true }).eq('tenant_id', VE_TENANT).eq('status', 'approved').gte('starts_at', new Date().toISOString()).not('link_checked_at', 'is', null);
    const { count: upcoming } = await db.from('events').select('id', { count: 'exact', head: true }).eq('tenant_id', VE_TENANT).eq('status', 'approved').eq('listing_kind', 'event').gte('starts_at', new Date().toISOString());
    return json({ checks: latest, checked, upcoming });
  }
  if (action === 'leads') {
    const kind = body.kind === 'organizer' ? 'organizer' : 'venue';
    const status = ['new', 'listed', 'linked', 'set_aside'].includes(body.status) ? body.status : 'new';
    const { data } = await db.from('ve_event_leads').select('id, kind, name, city, state, country, address, hub, url, event_ids, event_count, first_at, last_at, status, listing_id, note, decided_at')
      .eq('kind', kind).eq('status', status).order('event_count', { ascending: false }).order('last_at', { ascending: false }).limit(400);
    const counts: Record<string, number> = {};
    for (const k of ['venue', 'organizer']) for (const s of ['new', 'listed', 'linked', 'set_aside']) {
      const { count } = await db.from('ve_event_leads').select('id', { count: 'exact', head: true }).eq('kind', k).eq('status', s);
      counts[`${k}:${s}`] = count || 0;
    }
    // A few event titles for each, so the team can see what it is.
    const evIds = [...new Set((data || []).flatMap((l: any) => (l.event_ids || []).slice(-3)))];
    const { data: evs } = evIds.length ? await db.from('events').select('id, title, starts_at').in('id', evIds.slice(0, 1000)) : { data: [] };
    const byId: Record<string, any> = {}; (evs || []).forEach((e: any) => { byId[e.id] = e; });
    const lids = (data || []).map((l: any) => l.listing_id).filter(Boolean);
    const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name').in('id', lids) : { data: [] };
    const byL: Record<string, any> = {}; (ls || []).forEach((l: any) => { byL[l.id] = l; });
    return json({ leads: (data || []).map((l: any) => ({ ...l, events: (l.event_ids || []).slice(-3).map((i: string) => byId[i]).filter(Boolean), listing: l.listing_id ? byL[l.listing_id] || null : null, event_ids: undefined })), counts });
  }
  if (!w.admin) return json({ error: 'forbidden' }, 403);
  if (action === 'lead_add') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.rpc('ve_event_lead_add', { p_lead: body.id, p_category: String(body.category || ''), p_member: w.member });
    return json(error ? { ok: false, why: error.message } : data);
  }
  if (action === 'lead_link') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const slug = String(body.slug || '').trim().replace(/^.*\/directory\//, '').replace(/[?#].*$/, '');
    const { data: l } = await db.from('listings').select('id').eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!l) return json({ ok: false, why: 'no_listing' });
    const { data, error } = await db.rpc('ve_event_lead_link', { p_lead: body.id, p_listing: l.id, p_member: w.member });
    return json(error ? { ok: false, why: error.message } : data);
  }
  if (action === 'lead_aside') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    await db.from('ve_event_leads').update({ status: 'set_aside', note: String(body.note || '').slice(0, 500) || null, decided_by: w.member, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', body.id).eq('status', 'new');
    return json({ ok: true });
  }
  return json({ error: 'unknown_action' }, 400);
});
