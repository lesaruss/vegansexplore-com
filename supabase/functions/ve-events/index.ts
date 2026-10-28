// ve-events: submitting, reading and approving events (Sean, 2026-10-26: "I would also like members to be able to submit
// events for consideration... we could just on the back end approve the events once we've taken a look at it. We just
// require there to be a link to where you can purchase tickets or find more information, the official pages... the
// ability to upload images or documents for you to pull information for events, because sometimes all they have is a
// banner on Instagram... you could automatically tell from the banner of where city to put in, what state, what continent").
//
// The public calendar reads approved rows straight from `events` (/events, the dashboard's Events tab, the city hubs).
// Everything new comes in pending: members here, the crawl through ve_event_intake (dispatcher source events_crawl), and
// the team's own flyers. Migration 20261026_ve_events_intake.sql.
//
// Member (Authorization: Bearer <ve_token>):
// POST { action: 'flyer_start', type }            -> { path, upload_url }   PUT the file there (image or PDF, 15 MB)
// POST { action: 'flyer_read', path }             -> { event, note }       Claude reads the flyer; five a day for members
// POST { action: 'link_read', url }              -> { event, note, read } (Sean, 2026-10-28: "dropping in a link... and it
//        pulling the information from there") an event page, an Eventbrite or Meetup page, or an Instagram post (its picture
//        is read like a flyer); counts with the flyer reads
// POST { action: 'submit', event, flyer_path?, role }  -> { ok, id }      waits for approval; needs the official link. role is
//        host | promoter | attending (events.submitter_role); a host or promoter is sent on to Promote your event
// POST { action: 'mine' }                         -> { events }            what they sent and where it stands
// POST { action: 'promote_get', id }              -> { event }             their own event, for Promote your event
// POST { action: 'promote_interest', id, package?, options, note? }  I'm interested in promoting it (Sean, 2026-10-28: six
//        options, three packages; no prices yet): a ve_initiative_interest row (initiative event-promotion) and an email to Sean
// Super admin:
// POST { action: 'queue', status }                -> { events, counts }    pending | approved | rejected, with signed flyer links
// POST { action: 'review', id, decision, event?, reason? }  approve or reject, saving any fixes first
// POST { action: 'update', id, event }            edit a row in any status
// POST { action: 'save', event, approve, flyer_path? }      the team's own event (from a flyer or typed in)
// POST { action: 'sources' } | { action: 'source_save', source } | { action: 'source_check', id }
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const SEAN_EMAIL = 'contact@lesaruss.com';
const SITE = 'https://vegansexplore.com';
const BUCKET = 'event-flyers';
const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = { submit: 10, read: 5, upload: 15 };
const CATEGORIES = ['festival', 'food', 'social', 'market', 'meetup', 'workshop', 'health', 'activism', 'fundraiser', 'film', 'general', 'other'];
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' };
const EDITABLE = ['title', 'description', 'starts_at', 'ends_at', 'time_set', 'timezone', 'location_name', 'address', 'city', 'state', 'country', 'continent', 'category', 'event_type', 'ticket_url', 'price_cents'];

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

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
// "Vegan" is always capitalized on our pages.
const tidy = (v: unknown, max: number) => clean(v, max).replace(/\bvegan(ism|s)?\b/g, (_m: string, x?: string) => 'Vegan' + (x || ''));
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isUrl = (v: unknown) => typeof v === 'string' && /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v.trim());
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const p = (s: string) => `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${s}</p>`;

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) { console.error('Resend failed:', e); return false; }
}

async function countSince(table: string, col: string, id: string, extra?: (q: any) => any) {
  let q = db.from(table).select('id', { count: 'exact', head: true }).eq(col, id).gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
  if (extra) q = extra(q);
  const { count } = await q;
  return count || 0;
}

// An event as the form or the Depot sent it, cleaned to what the table takes. Empty fields stay out.
function shapeEvent(e: any) {
  const out: Record<string, unknown> = {};
  if (!e || typeof e !== 'object') return out;
  const set = (k: string, v: unknown) => { if (v !== '' && v != null) out[k] = v; };
  set('title', tidy(e.title, 200));
  set('description', tidy(e.description, 2000));
  for (const k of ['starts_at', 'ends_at']) {
    const d = e[k] ? new Date(e[k]) : null;
    if (d && !isNaN(d.getTime())) out[k] = d.toISOString();
  }
  set('timezone', /^[A-Za-z_]+\/[A-Za-z_\/-]+$/.test(String(e.timezone || '')) ? e.timezone : '');
  set('location_name', clean(e.location_name, 200));
  set('address', clean(e.address, 300));
  set('city', clean(e.city, 120));
  set('state', clean(e.state, 60));
  set('country', clean(e.country, 2).toUpperCase().replace(/^UK$/, 'GB'));
  set('continent', clean(e.continent, 40));
  const cat = clean(e.category, 30).toLowerCase();
  set('category', CATEGORIES.includes(cat) ? cat : '');
  set('event_type', ['in_person', 'virtual', 'hybrid'].includes(e.event_type) ? e.event_type : '');
  set('ticket_url', isUrl(e.ticket_url) ? String(e.ticket_url).trim().slice(0, 1000) : '');
  const cents = Number(e.price_cents);
  if (Number.isFinite(cents) && cents > 0) out.price_cents = Math.round(cents);
  // A day with no announced time (the tile shows the date only).
  if (typeof e.time_set === 'boolean') out.time_set = e.time_set;
  return out;
}

// What a submission needs before it can go in: a name, a day, where (or online), and the official page.
function missing(e: Record<string, unknown>) {
  const m: string[] = [];
  if (!e.title) m.push('title');
  if (!e.starts_at) m.push('starts_at');
  if (!e.ticket_url) m.push('ticket_url');
  if (e.event_type !== 'virtual' && !e.city) m.push('city');
  if (e.event_type !== 'virtual' && !e.country) m.push('country');
  return m;
}

const FLYER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['is_event', 'title', 'description', 'starts_at', 'ends_at', 'timezone', 'location_name', 'address', 'city', 'state', 'country', 'continent', 'category', 'event_type', 'ticket_url', 'other_links', 'note'],
  properties: {
    is_event: { type: 'boolean', description: 'False when the file is not about an event.' },
    title: { type: 'string' },
    description: { type: 'string', description: 'Two or three sentences in plain words, from what the flyer says.' },
    starts_at: { type: 'string', description: 'ISO 8601 with the event\'s own UTC offset, e.g. 2026-11-07T10:00:00-05:00. Empty if the flyer gives no date.' },
    ends_at: { type: 'string', description: 'ISO 8601 with offset, or empty.' },
    timezone: { type: 'string', description: 'IANA time zone of the event\'s city, e.g. America/New_York. Empty for online-only.' },
    location_name: { type: 'string', description: 'The venue name.' },
    address: { type: 'string', description: 'Street address if printed.' },
    city: { type: 'string' },
    state: { type: 'string', description: 'Two-letter code in the US, else the region, or empty.' },
    country: { type: 'string', description: 'Two-letter ISO code (GB for the United Kingdom).' },
    continent: { type: 'string', enum: ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', ''] },
    category: { type: 'string', enum: CATEGORIES },
    event_type: { type: 'string', enum: ['in_person', 'virtual', 'hybrid'] },
    ticket_url: { type: 'string', description: 'A full https link to tickets or the official page, only if printed on the flyer. Empty otherwise.' },
    other_links: { type: 'string', description: 'Any Instagram handles, websites or QR code text printed on it, comma separated.' },
    note: { type: 'string', description: 'One sentence for the team: what you could not read or had to work out (a year not printed, a city inferred from the venue).' },
  },
};

async function anthropicKey(): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'ANTHROPIC_API_KEY').maybeSingle();
  return (data?.value as string) || null;
}

function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function readFlyer(path: string) {
  const { data: file, error } = await db.storage.from(BUCKET).download(path);
  if (error || !file) return { error: 'not_uploaded' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = file.type || (path.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
  const isPdf = type === 'application/pdf';
  // Claude takes images up to 5 MB; the pages shrink pictures before sending, so a bigger one is a stray original.
  if (!isPdf && bytes.length > 5 * 1024 * 1024) return { error: 'too_big' };
  const media = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: toBase64(bytes) } }
    : { type: 'image', source: { type: 'base64', media_type: type, data: toBase64(bytes) } };
  return askReader([media, { type: 'text', text: 'Read this event flyer and fill in the event.' }]);
}

// ---- Reading a link (an event page, or an Instagram post whose picture is the flyer) ----
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
async function readPage(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `The page answered ${r.status}` };
    const html = (await r.text()).slice(0, 800000);
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    // Event pages (Eventbrite, Meetup, most ticket sites) carry the event as structured data: the surest source.
    const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).join('\n').slice(0, 6000);
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 7000);
    return {
      url: r.url || url, title: meta(/<title[^>]*>([^<]*)/i),
      description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i),
      image: meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i), structured: ld, text,
    };
  } catch { return { url, error: 'The page did not open' }; }
}
// An Instagram post or reel through Apify's Instagram scraper (the page itself needs a sign-in): its caption, place and picture.
async function readInstagramPost(url: string) {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'APIFY_API_TOKEN').maybeSingle();
  const token = data?.value as string;
  if (!token || token === 'pending') return { error: 'no Instagram reader' };
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directUrls: [url], resultsType: 'posts', resultsLimit: 1 }), signal: AbortSignal.timeout(100000),
    });
    if (!r.ok) return { error: `Instagram answered ${r.status}` };
    const x = ((await r.json()) as any[])[0];
    if (!x || x.error) return { error: 'Instagram did not answer' };
    return { caption: String(x.caption || '').slice(0, 3000), place: x.locationName || '', posted: x.timestamp || '', by: x.ownerUsername || '', image: x.displayUrl || '' };
  } catch (e) { return { error: String((e as Error).message || e).slice(0, 160) }; }
}
async function imagePart(url: string) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    const type = (r.headers.get('content-type') || '').split(';')[0];
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) return null;
    return { type: 'image', source: { type: 'base64', media_type: type, data: toBase64(bytes) } };
  } catch { return null; }
}
async function readLink(url: string) {
  const read: string[] = [], parts: any[] = [];
  const ig = /instagram\.com\/(p|reel|reels|tv)\//i.test(url);
  if (ig) {
    const x: any = await readInstagramPost(url);
    if (x.error) read.push('Instagram: ' + x.error);
    else {
      read.push('The Instagram post');
      const pic = x.image ? await imagePart(x.image) : null;
      if (pic) parts.push({ type: 'text', text: 'The post\'s picture (often the flyer):' }, pic);
      parts.push({ type: 'text', text: 'The post\'s caption and details: ' + JSON.stringify({ by: x.by, place: x.place, posted: x.posted, caption: x.caption }) });
    }
  } else {
    const pg: any = await readPage(url);
    if (pg.error) read.push(pg.url + ': ' + pg.error);
    else {
      read.push(pg.url);
      const pic = pg.image ? await imagePart(pg.image) : null;
      if (pic) parts.push({ type: 'text', text: 'The page\'s share picture (sometimes the flyer):' }, pic);
      parts.push({ type: 'text', text: 'The page we read: ' + JSON.stringify({ url: pg.url, title: pg.title, description: pg.description, structured_data: pg.structured, text: pg.text }) });
    }
  }
  if (!parts.length) return { error: 'unreadable', read };
  parts.push({ type: 'text', text: `The member's link: ${url}. If this is the event's own page or its ticket page (not an Instagram post), it is the ticket_url. Fill in the event from what the page shows.` });
  const r: any = await askReader(parts);
  return { ...r, read };
}

async function askReader(content: any[]) {
  const apiKey = await anthropicKey();
  if (!apiKey) return { error: 'reader_unavailable' };
  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);
  try {
    const response: any = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: FLYER_SCHEMA } },
      system: `You read event flyers, banners and event pages (often an Instagram post, an Eventbrite or Meetup page, or the organizer's site) for the Vegans Explore events calendar, so nobody has to type them in. Today is ${today}.
- Copy only what the flyer shows. Never invent a venue, a price, a link or a time. A field the flyer does not give stays empty.
- Work out what follows plainly from what is printed: the city, state, country and continent from a venue or address you recognize, the time zone from the city, and the year when only a month and day are printed (the next time that date comes, from today). Say in note what you worked out.
- starts_at and ends_at carry the event's own UTC offset for that date. A start time with no end time leaves ends_at empty. A date with no time: use 12:00 local and say so in note.
- ticket_url is a full link printed on the flyer (or in its QR code text, if legible). An Instagram handle or a bare domain goes in other_links, not ticket_url.
- Write "Vegan" with a capital V. No em dashes.`,
      messages: [{ role: 'user', content }],
    } as any);
    if (response.stop_reason === 'refusal') return { error: 'unreadable' };
    const text = (response.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    return { result: JSON.parse(text) };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { error: 'busy' };
    if (e instanceof Anthropic.APIError) { console.error('anthropic', e.status, e.message); return { error: 'reader_unavailable' }; }
    if (e instanceof SyntaxError) { console.error('bad json from model'); return { error: 'reader_unavailable' }; }
    throw e;
  }
}

async function signedFlyer(path: string | null) {
  if (!path) return null;
  const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated', message: 'Sign in to send an event.' }, 401);
  const { data: member } = await db.from('members').select('id, name, email, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'member_not_found' }, 404);
  const admin = !!member.is_superadmin;
  const needAdmin = () => (admin ? null : json({ error: 'no_access' }, 403));
  // A member reads and submits only their own flyers; the team any.
  const ownsFlyer = (path: unknown) => typeof path === 'string' && /^[a-z0-9\/._-]+$/i.test(path) && !path.includes('..') && (admin || path.startsWith(`m/${memberId}/`));

  switch (action) {
    case 'flyer_start': {
      const ext = TYPES[String(body.type || '')];
      if (!ext) return json({ error: 'type', message: 'Send a picture (JPG, PNG, WebP) or a PDF.' }, 400);
      if (!admin && await countSince('ve_event_flyer_reads', 'member_id', memberId) >= LIMITS.upload) return json({ error: 'rate_limited', message: 'That is a lot of flyers for one day. Send the rest tomorrow.' }, 429);
      const path = `${admin ? 'team' : 'm/' + memberId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { data: up, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_failed', message: error?.message }, 500);
      return json({ path, upload_url: up.signedUrl });
    }

    case 'flyer_read': {
      if (!ownsFlyer(body.path)) return json({ error: 'not_found' }, 404);
      if (!admin && await countSince('ve_event_flyer_reads', 'member_id', memberId) >= LIMITS.read) return json({ error: 'rate_limited', message: 'You have read five flyers today. Fill this one in by hand, or come back tomorrow.' }, 429);
      const r: any = await readFlyer(body.path);
      await db.from('ve_event_flyer_reads').insert({ member_id: memberId, flyer_path: body.path, result: r.result || { error: r.error } });
      if (r.error) {
        const msg: Record<string, string> = {
          not_uploaded: 'The file did not arrive. Try again.', too_big: 'That picture is too big to read. Try a smaller one.',
          busy: 'The reader is busy. Try again in a minute.', unreadable: 'We could not read that one. Fill it in by hand.',
          reader_unavailable: 'The reader is not available right now. Fill it in by hand.',
        };
        return json({ error: r.error, message: msg[r.error] || 'We could not read that one.' }, r.error === 'busy' ? 429 : 400);
      }
      const x = r.result || {};
      if (!x.is_event) return json({ event: null, note: 'That does not look like an event flyer.' });
      const ev = shapeEvent(x);
      return json({ event: ev, links: clean(x.other_links, 500), note: clean(x.note, 400) });
    }

    case 'link_read': {
      let url = clean(body.url, 1000);
      if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      if (!isUrl(url)) return json({ error: 'bad_url', message: 'Paste the full link (starting with https://).' }, 400);
      if (!admin && await countSince('ve_event_flyer_reads', 'member_id', memberId) >= LIMITS.read) return json({ error: 'rate_limited', message: 'You have read five today. Fill this one in by hand, or come back tomorrow.' }, 429);
      const r: any = await readLink(url);
      await db.from('ve_event_flyer_reads').insert({ member_id: memberId, flyer_path: 'link:' + url.slice(0, 500), result: r.result || { error: r.error, read: r.read } });
      if (r.error) {
        const msg: Record<string, string> = { busy: 'The reader is busy. Try again in a minute.', unreadable: 'We could not open that link. Try another, drop in the flyer, or type it in.', reader_unavailable: 'The reader is not available right now. Type it in instead.' };
        return json({ error: r.error, message: msg[r.error] || 'We could not read that one.', read: r.read }, r.error === 'busy' ? 429 : 400);
      }
      const x = r.result || {};
      if (!x.is_event) return json({ event: null, note: 'That link does not look like an event.', read: r.read });
      const ev = shapeEvent(x);
      // The official page they pasted is the link we list, unless it is an Instagram post.
      if (!ev.ticket_url && !/instagram\.com/i.test(url)) ev.ticket_url = url;
      return json({ event: ev, links: clean(x.other_links, 500), note: clean(x.note, 400), read: r.read });
    }

    case 'submit': {
      if (!admin && await countSince('events', 'author_id', memberId, (q) => q.eq('source', 'member')) >= LIMITS.submit) return json({ error: 'rate_limited', message: 'That is a lot of events for one day. Send the rest tomorrow.' }, 429);
      const ev = shapeEvent(body.event);
      const miss = missing(ev);
      if (miss.length) return json({ error: 'missing', missing: miss, message: miss.includes('ticket_url') ? 'Add the official link: where to get tickets or read more.' : 'Fill in the event\'s name, day and city.' }, 400);
      if (body.flyer_path && ownsFlyer(body.flyer_path)) ev.flyer_path = body.flyer_path;
      const role = ['host', 'promoter', 'attending'].includes(body.role) ? body.role : '';
      if (!role) return json({ error: 'missing', missing: ['role'], message: 'Tell us how you are connected to the event.' }, 400);
      const { data, error } = await db.rpc('ve_event_intake', { p_event: ev, p_source: 'member', p_source_id: null, p_author: memberId, p_approve: false });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      if (!data?.ok) {
        const why: Record<string, string> = { already_listed: 'That event is already on the calendar.', already_over: 'That event is over.', no_official_link: 'Add the official link.', no_date: 'Add the day it starts.' };
        return json({ error: data?.why || 'save_failed', message: why[data?.why] || 'That did not save. Try again.' }, 400);
      }
      await db.from('events').update({ submitter_role: role }).eq('id', data.id);
      const roleWords: Record<string, string> = { host: 'the host or organizer', promoter: 'promoting it', attending: 'going' };
      await sendEmail([SEAN_EMAIL], `[Events] New event to approve: ${ev.title}`,
        p(`${esc(member.name || 'A member')} (${esc(roleWords[role])}) sent an event for the calendar: <b>${esc(String(ev.title))}</b>, ${esc(new Date(String(ev.starts_at)).toUTCString())}, ${esc([ev.city, ev.state, ev.country].filter(Boolean).join(', '))}.`) +
        p(`Official link: <a href="${esc(String(ev.ticket_url))}">${esc(String(ev.ticket_url))}</a>`) +
        p(`<a href="${SITE}/admin/depot/events">Review it in Depot &gt; Events</a>`));
      return json({ ok: true, id: data.id, role });
    }

    case 'mine': {
      const { data } = await db.from('events').select('id, title, starts_at, timezone, time_set, city, state, country, status, rejection_reason, ticket_url, submitter_role, created_at')
        .eq('author_id', memberId).eq('source', 'member').order('created_at', { ascending: false }).limit(50);
      return json({ events: data || [] });
    }

    // Promote your event (Sean, 2026-10-28): only the member who sent it, as its host or promoter (or the team).
    case 'promote_get':
    case 'promote_interest': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: ev } = await db.from('events').select('id, title, starts_at, timezone, time_set, city, state, country, location_name, status, submitter_role, author_id, ticket_url').eq('id', body.id).maybeSingle();
      if (!ev || (!admin && (ev.author_id !== memberId || !['host', 'promoter'].includes(ev.submitter_role || '')))) return json({ error: 'not_found' }, 404);
      if (action === 'promote_get') { const { author_id: _a, ...out } = ev; return json({ event: out }); }
      const OPTIONS: Record<string, string> = { feature: 'Feature it', ads: 'Run ads', meetup: 'Meetup feature', social: 'Social push', coverage: 'Coverage and a recap video', coproduce: 'Co-produce it with us' };
      const PACKAGES: Record<string, string> = { spotlight: 'Spotlight', boost: 'Boost', front_row: 'Front Row' };
      const opts = (Array.isArray(body.options) ? body.options : []).filter((k: string) => k in OPTIONS);
      const pkg = body.package in PACKAGES ? body.package : '';
      if (!opts.length && !pkg) return json({ error: 'missing', message: 'Pick a package or at least one option.' }, 400);
      const note = clean(body.note, 1000);
      const what = [pkg ? 'the ' + PACKAGES[pkg] + ' package' : '', ...opts.map((k: string) => OPTIONS[k])].filter(Boolean).join(', ');
      const { error } = await db.from('ve_initiative_interest').insert({
        initiative_slug: 'event-promotion', member_id: memberId, action_type: 'sponsor_tier', tier_label: pkg ? PACKAGES[pkg] : 'Options', status: 'new',
        email: member.email, name: String(member.name || '').slice(0, 120), source: 'form',
        note: (ev.title + ': ' + what + (note ? '. ' + note : '')).slice(0, 2000), tags: ['event-promotion', 'event:' + ev.id, ...(pkg ? [pkg] : []), ...opts],
      });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      const when = new Date(String(ev.starts_at)).toUTCString();
      await sendEmail([SEAN_EMAIL], `[Events] Promotion interest: ${ev.title}`,
        p(`${esc(member.name || 'A member')} (${esc(member.email || '')}), the event's ${ev.submitter_role === 'host' ? 'host' : 'promoter'}, wants to talk about promoting <b>${esc(String(ev.title))}</b> (${esc(when)}, ${esc([ev.city, ev.state].filter(Boolean).join(', '))}).`) +
        p(`Interested in: <b>${esc(what)}</b>`) + (note ? p(`Their note: ${esc(note)}`) : '') +
        p(`The event is ${ev.status === 'approved' ? 'live' : 'waiting for approval'}: <a href="${SITE}/admin/depot/events">Depot &gt; Events</a> · <a href="${SITE}/dashboard/leads">Leads</a>`));
      return json({ ok: true });
    }

    case 'queue': {
      const gate = needAdmin(); if (gate) return gate;
      const status = ['pending', 'approved', 'rejected'].includes(body.status) ? body.status : 'pending';
      let q = db.from('events').select('id, title, description, starts_at, ends_at, time_set, timezone, location_name, address, city, state, country, continent, category, event_type, ticket_url, price_cents, status, source, source_url, flyer_path, rejection_reason, created_at, reviewed_at, author_id, source_id, submitter_role')
        .eq('status', status);
      // Waiting: soonest first, so nothing passes before it is seen. Approved: the upcoming ones. Turned down: newest.
      if (status === 'pending') q = q.order('starts_at', { ascending: true });
      else if (status === 'approved') q = q.gte('starts_at', new Date(Date.now() - DAY_MS).toISOString()).order('starts_at', { ascending: true });
      else q = q.order('reviewed_at', { ascending: false, nullsFirst: false });
      const { data, error } = await q.limit(300);
      if (error) return json({ error: 'load_failed', message: error.message }, 500);
      const rows = data || [];
      const ids = [...new Set(rows.map((r) => r.author_id).filter(Boolean))];
      const names: Record<string, any> = {};
      if (ids.length) { const { data: ms } = await db.from('members').select('id, name, email').in('id', ids); for (const m of ms || []) names[m.id] = m; }
      const sids = [...new Set(rows.map((r) => r.source_id).filter(Boolean))];
      const srcs: Record<string, string> = {};
      if (sids.length) { const { data: ss } = await db.from('ve_event_sources').select('id, name').in('id', sids); for (const s of ss || []) srcs[s.id] = s.name; }
      const events = await Promise.all(rows.map(async (r) => ({
        ...r, flyer_url: await signedFlyer(r.flyer_path),
        by: r.source === 'member' ? { name: names[r.author_id]?.name || 'A member', email: names[r.author_id]?.email || null } : null,
        source_name: r.source_id ? srcs[r.source_id] || null : null,
      })));
      const counts: Record<string, number> = {};
      for (const s of ['pending', 'approved', 'rejected']) {
        let c = db.from('events').select('id', { count: 'exact', head: true }).eq('status', s);
        if (s === 'approved') c = c.gte('starts_at', new Date(Date.now() - DAY_MS).toISOString());
        const { count } = await c; counts[s] = count || 0;
      }
      return json({ events, counts });
    }

    case 'update':
    case 'review': {
      const gate = needAdmin(); if (gate) return gate;
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: row } = await db.from('events').select('id, title, status, author_id, source, ticket_url, starts_at').eq('id', body.id).maybeSingle();
      if (!row) return json({ error: 'not_found' }, 404);
      const fixes = shapeEvent(body.event || {});
      const patch: Record<string, unknown> = {};
      for (const k of EDITABLE) if (k in fixes) patch[k] = fixes[k];
      if (action === 'review') {
        const decision = body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'rejected' : '';
        if (!decision) return json({ error: 'bad_decision' }, 400);
        if (decision === 'approved' && !(patch.ticket_url || row.ticket_url)) return json({ error: 'missing', message: 'Add the official link before it goes live.' }, 400);
        Object.assign(patch, { status: decision, reviewed_by: memberId, reviewed_at: new Date().toISOString(), rejection_reason: decision === 'rejected' ? clean(body.reason, 500) || null : null });
      }
      if (!Object.keys(patch).length) return json({ ok: true });
      const { error } = await db.from('events').update(patch).eq('id', row.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      // A member hears back once their event is live.
      if (action === 'review' && patch.status === 'approved' && row.source === 'member' && row.status !== 'approved') {
        const { data: m } = await db.from('members').select('email, name').eq('id', row.author_id).maybeSingle();
        if (m?.email) await sendEmail([m.email], `Your event is on the calendar: ${patch.title || row.title}`,
          p(`Hi ${esc(String(m.name || '').split(' ')[0] || 'there')},`) +
          p(`Thanks for sending <b>${esc(String(patch.title || row.title))}</b>. It is live on the Vegans Explore events calendar now.`) +
          p(`<a href="${SITE}/events">See the events</a>`));
      }
      return json({ ok: true });
    }

    case 'save': {
      const gate = needAdmin(); if (gate) return gate;
      const ev = shapeEvent(body.event);
      const miss = missing(ev);
      if (miss.length) return json({ error: 'missing', missing: miss, message: 'Fill in the name, the day, the city and the official link.' }, 400);
      if (body.flyer_path && ownsFlyer(body.flyer_path)) ev.flyer_path = body.flyer_path;
      const { data, error } = await db.rpc('ve_event_intake', { p_event: ev, p_source: body.flyer_path ? 'flyer' : 'admin', p_source_id: null, p_author: memberId, p_approve: !!body.approve });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      if (!data?.ok) return json({ error: data?.why || 'save_failed', message: data?.why === 'already_listed' ? 'That event is already on the calendar.' : data?.why === 'already_over' ? 'That event is over.' : 'That did not save.' }, 400);
      return json({ ok: true, id: data.id });
    }

    case 'sources': {
      const gate = needAdmin(); if (gate) return gate;
      const { data } = await db.from('ve_event_sources').select('*').order('created_at', { ascending: true });
      return json({ sources: data || [] });
    }

    case 'source_save': {
      const gate = needAdmin(); if (gate) return gate;
      const s = body.source || {};
      const kind = ['list', 'website', 'instagram', 'calendar', 'search'].includes(s.kind) ? s.kind : 'website';
      const row: Record<string, unknown> = {
        name: clean(s.name, 120), kind, url: isUrl(s.url) ? String(s.url).trim() : null, query: clean(s.query, 300) || null,
        city_slug: clean(s.city_slug, 60) || null, notes: clean(s.notes, 1000) || null, active: s.active !== false,
        every_days: Math.min(60, Math.max(1, Math.round(Number(s.every_days) || 7))),
      };
      if (!row.name) return json({ error: 'missing', message: 'Give the source a name.' }, 400);
      if (kind === 'search' ? !row.query : !row.url) return json({ error: 'missing', message: kind === 'search' ? 'Add what to search for.' : 'Add the link.' }, 400);
      if (isId(s.id)) {
        const { error } = await db.from('ve_event_sources').update(row).eq('id', s.id);
        if (error) return json({ error: 'save_failed', message: error.message }, 500);
        return json({ ok: true, id: s.id });
      }
      // A new source is read on the Background writer's next pass.
      const { data, error } = await db.from('ve_event_sources').insert({ ...row, added_by: memberId, check_status: 'queued' }).select('id').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true, id: data.id });
    }

    case 'source_check': {
      const gate = needAdmin(); if (gate) return gate;
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      await db.from('ve_event_sources').update({ check_status: 'queued', marked_at: null }).eq('id', body.id);
      return json({ ok: true });
    }

    default:
      return json({ error: 'unknown_action' }, 400);
  }
});
