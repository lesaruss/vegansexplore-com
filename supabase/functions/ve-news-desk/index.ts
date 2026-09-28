// ve-news-desk: the Vegans Explore News Desk (Sean, 2026-09-27: "pull in vegan sources and look
// at local news outlets for each of the cities we're in ... flagged with its pull ... mark them for
// written content and then for that to be written out as a Pulse article").
//
// Sources live in ve_news_feeds, one row each:
//   scope 'vegan'  a Vegan outlet (VegNews, Plant Based News, ...). A story is flagged only when it
//                  names one of our hub cities ("a Philadelphia eatery", "this event in New York").
//   scope 'local'  a city outlet (Eater NY, Miami Curated, ...). Flagged only when it mentions
//                  Vegan food or living (vegan, plant-based, meatless, dairy-free, ...).
//   scope 'search' a Google News search for one hub (search_query, with intitle: so the headline is
//                  about Vegan food). The same search, run month by month, is how the desk looks back to June.
// Flagged stories land in ve_news_leads with the reason they were flagged.
//
// The Depot Inbox (Sean, 2026-09-28, content engine plan): ve_news_leads is the one queue for every
// story idea. origin says where it came from: 'feed' (the sources above), 'link' (Sean pasted a
// link), 'member' (a member sent it from a hub) or 'city_news' (a City News story that was waiting).
// Member and City News stories arrive through the ve_community_news_to_inbox trigger and keep a
// community_news_id, so Deny and Share close that row too. Approve marks a story 'write'; the
// Background writer (lesaruss_dispatch_sources.news_desk_write, a Claude routine on Sean's
// subscription) writes it as a Pulse draft. Drafts come back to the Ready lane: Publish, or Send back
// with a note (the writer then revises the same draft). Nothing a routine writes goes live without
// Sean's Publish tap.
//
// Cron (x-cron-secret):  POST ?cron=ingest   pull every active feed
//                        POST ?cron=backfill { feed_id, month }   one month of one Google News search
// Superadmin (Authorization: Bearer <ve_token>), POST { action, ... }:
//   inbox_list { city? }         the Inbox: decide, being written, ready, done, plus counts
//   link_add { url, city_slug?, note? }   paste any link: the page is read for its title, summary and picture
//   lead_note { id, note }       Sean's line for the writer (also what a page that could not be read needs)
//   lead_update { id, status?, notes?, city_slug? }   lead_write { id, note? }  (Approve)
//   lead_deny { id }             lead_share { id, city_slug? }  share to a city hub as a link, no write-up
//   ready_publish { id }         publish the lead's draft (needs a Library cover)
//   ready_send_back { id, note } back to the writer with what to change
//   leads_list { status?, city?, scope?, q?, headline_only? }
//   feeds_list (with sent, approved, denied, untouched per source)
//   feed_save { id?, feed_name, scope, city_slug?, feed_url?, search_query?, locale?, is_active? }
//   feed_active { id, is_active }   feed_delete { id }   feed_pull { id }   backfill { feed_id, month: 'YYYY-MM' }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Nothing older than this is flagged (Sean: "go back to June").
const LOOK_BACK_FROM = '2026-06-01';

// The hubs (mirrors /public/ve-hubs.js) and the names a story uses for each. Matching is
// case-sensitive on whole words, so "London" matches and "london broil" does not.
const HUBS: { slug: string; name: string; terms: string[] }[] = [
  { slug: 'south-florida', name: 'South Florida', terms: ['South Florida', 'Miami', 'Miami Beach', 'Wynwood', 'Little Havana', 'Coral Gables', 'Coconut Grove', 'Brickell', 'Doral', 'Aventura', 'Hialeah', 'Fort Lauderdale', 'Ft. Lauderdale', 'Broward', 'Pompano Beach', 'Boca Raton', 'Delray Beach', 'West Palm Beach', 'Palm Beach', 'Boynton Beach', 'Key West', 'Florida Keys'] },
  { slug: 'central-florida', name: 'Central Florida', terms: ['Central Florida', 'Orlando', 'Winter Park', 'Kissimmee', 'Lakeland', 'Altamonte Springs', 'Ocala', 'The Villages', 'Winter Haven'] },
  { slug: 'atlanta', name: 'Atlanta', terms: ['Atlanta', 'Decatur, GA', 'Decatur, Georgia', 'Buckhead', 'Marietta'] },
  { slug: 'dmv', name: 'DMV', terms: ['Washington, D.C.', 'Washington, DC', 'Washington DC', 'D.C.', 'the DMV', 'Arlington, VA', 'Arlington, Virginia', 'Alexandria, VA', 'Silver Spring', 'Bethesda', 'Takoma Park'] },
  { slug: 'new-york', name: 'New York', terms: ['New York City', 'NYC', 'Manhattan', 'Brooklyn', 'Queens', 'the Bronx', 'Staten Island', 'Harlem', 'Williamsburg', 'New York(?! Times| Post| Magazine| Daily News)'] },
  { slug: 'philadelphia', name: 'Philadelphia', terms: ['Philadelphia', 'Philly'] },
  { slug: 'los-angeles', name: 'Los Angeles', terms: ['Los Angeles', 'West Hollywood', 'Silver Lake', 'Echo Park', 'Santa Monica', 'Venice Beach', 'Pasadena', 'Burbank', 'Long Beach', 'Culver City', 'Koreatown'] },
  { slug: 'london', name: 'London', terms: ['London'] },
];
const HUB_SLUGS = HUBS.map((h) => h.slug);
const HUB_RES = HUBS.map((h) => ({ ...h, re: h.terms.map((t) => new RegExp('(?<![A-Za-z])' + t.replace(/[.,]/g, (c) => '\\' + c) + '(?![A-Za-z])')) }));
const hubName = (slug: string | null) => HUBS.find((h) => h.slug === slug)?.name || 'National';
const VEGAN_RE = /\b(vegan(?:s|ism)?|plant[- ]based|meat[- ]?free|meatless|dairy[- ]free|animal[- ]free|vegetarian)\b/gi;
const CATEGORIES = ['Community', 'Community Spotlight', 'Business Spotlight', 'Food & Dining', 'Recipes', 'Health & Nutrition', 'Animal Rights', 'Policy & Advocacy', 'Culture & Media', 'Sustainability & Environment'];
const LEAD_STATUSES = ['new', 'write', 'drafting', 'drafted', 'dismissed', 'published', 'shared'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---------- auth (same key derivation as ve-auth's signJWT) ----------
function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
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
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

// ---------- feed parsing (RSS 2.0 and Atom; same approach as ve-news-rss-ingest) ----------
function decodeOnce(s: string): string {
  let out = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  out = out.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return out.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}
const decode = (s: string) => decodeOnce(decodeOnce(s)).trim();
function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? decode(m[1]) : null;
}
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function image(block: string): string | null {
  const pats = [/<media:thumbnail[^>]*url=["']([^"']+)["']/i, /<media:content[^>]*url=["']([^"']+)["'][^>]*medium=["']image["']/i,
    /<media:content[^>]*medium=["']image["'][^>]*url=["']([^"']+)["']/i, /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["']/i,
    /<enclosure[^>]*type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']/i];
  for (const p of pats) { const m = block.match(p); if (m) return decode(m[1]); }
  const raw = block.match(/<(?:description|content:encoded|content|summary)[^>]*>([\s\S]*?)<\/(?:description|content:encoded|content|summary)>/i);
  const img = raw && decodeOnce(raw[1]).match(/<img[^>]*src=["']([^"']+)["']/i);
  return img ? img[1] : null;
}
interface Item { title: string; link: string; date: string | null; summary: string | null; image: string | null; source: string | null }
function parseFeed(xml: string): Item[] {
  const items: Item[] = [];
  for (const block of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []) {
    const title = tag(block, 'title'); const link = tag(block, 'link');
    if (!title || !link) continue;
    const d = tag(block, 'description') || tag(block, 'content:encoded');
    items.push({ title, link, date: tag(block, 'pubDate') || tag(block, 'dc:date'), summary: d ? stripHtml(d).slice(0, 500) : null, image: image(block), source: tag(block, 'source') });
  }
  if (items.length) return items;
  for (const block of xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []) {
    const title = tag(block, 'title');
    const lm = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || block.match(/<link[^>]*href=["']([^"']+)["']/i);
    if (!title || !lm) continue;
    const d = tag(block, 'summary') || tag(block, 'content');
    items.push({ title, link: decode(lm[1]), date: tag(block, 'published') || tag(block, 'updated'), summary: d ? stripHtml(d).slice(0, 500) : null, image: image(block), source: null });
  }
  return items;
}

// ---------- flagging ----------
const titleKey = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 200);
function veganHits(text: string): string[] {
  return [...new Set((text.match(VEGAN_RE) || []).map((w) => w.toLowerCase()))];
}
function cityHits(text: string): { slug: string; term: string }[] {
  const out: { slug: string; term: string }[] = [];
  for (const h of HUB_RES) {
    const i = h.re.findIndex((r) => r.test(text));
    if (i >= 0) out.push({ slug: h.slug, term: h.terms[i].replace(/\(\?!.*\)$/, '') });
  }
  return out;
}
interface Flag { city_slug: string | null; reason: string; matched_terms: string[]; headline_match: boolean }
function judge(feed: any, it: Item): Flag | null {
  const text = it.title + ' ' + (it.summary || '');
  if (feed.scope === 'vegan') {
    const inTitle = cityHits(it.title), all = cityHits(text);
    const hit = inTitle[0] || all[0];
    if (!hit) return null;
    return { city_slug: hit.slug, reason: `${feed.feed_name} story that names ${hit.term} (${hubName(hit.slug)})`, matched_terms: all.map((c) => c.term), headline_match: inTitle.length > 0 };
  }
  const v = veganHits(text);
  if (feed.scope === 'local') {
    if (!v.length) return null;
    return { city_slug: feed.city_slug, reason: `${feed.feed_name} story that mentions "${v[0]}"`, matched_terms: v, headline_match: veganHits(it.title).length > 0 };
  }
  // Google News: the headline itself has to be about Vegan food or living (the search asks for
  // that too, with intitle:). If the headline names another of our hubs instead, it goes there.
  const tv = veganHits(it.title);
  if (!tv.length) return null;
  const tc = cityHits(it.title);
  const city = tc.some((c) => c.slug === feed.city_slug) || !tc.length ? feed.city_slug : tc[0].slug;
  const named = tc.find((c) => c.slug === city);
  return { city_slug: city, reason: `Google News: "${tv[0]}" in the headline` + (named ? `, names ${named.term}` : `, found searching ${hubName(feed.city_slug)}`), matched_terms: [...tv, ...tc.map((c) => c.term)], headline_match: !!named };
}

function feedUrl(feed: any, month?: string): string {
  if (feed.scope !== 'search') return feed.feed_url;
  let q = feed.search_query;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    q += ` after:${month}-01 before:${next}-01`;
  } else q += ' when:7d';
  const gb = feed.locale === 'GB';
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${gb ? 'en-GB' : 'en-US'}&gl=${gb ? 'GB' : 'US'}&ceid=${gb ? 'GB' : 'US'}:en`;
}

async function pullFeed(feed: any, month?: string): Promise<{ found: number; flagged: number; added: number; status: string }> {
  let found = 0, flagged = 0, added = 0, status = 'ok';
  try {
    const res = await fetch(feedUrl(feed, month), { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VegansExploreBot/1.0; +https://vegansexplore.com)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const items = parseFeed(await res.text());
    found = items.length;
    const rows: any[] = [];
    for (const it of items) {
      let title = it.title;
      // Google News titles end in " - Outlet"; the outlet is in <source>.
      if (feed.scope === 'search' && it.source && title.endsWith(' - ' + it.source)) title = title.slice(0, -(it.source.length + 3));
      const when = it.date ? new Date(it.date) : null;
      const at = when && !isNaN(when.getTime()) ? when.toISOString() : null;
      if (at && at < LOOK_BACK_FROM) continue;
      const f = judge(feed, { ...it, title });
      if (!f) continue;
      flagged++;
      rows.push({
        feed_id: feed.id, source_name: feed.scope === 'search' ? (it.source || 'Google News') : feed.feed_name,
        title: title.slice(0, 300), title_key: titleKey(title), url: it.link, published_at: at,
        summary: feed.scope === 'search' ? null : it.summary, image_url: it.image, ...f,
      });
    }
    if (rows.length) {
      const [u, k] = await Promise.all([
        db.from('ve_news_leads').select('url').in('url', rows.map((r) => r.url)),
        db.from('ve_news_leads').select('title_key').in('title_key', rows.map((r) => r.title_key)),
      ]);
      const seenU = new Set((u.data || []).map((r: any) => r.url)), seenK = new Set((k.data || []).map((r: any) => r.title_key));
      for (const r of rows) {
        if (seenU.has(r.url) || seenK.has(r.title_key)) continue;
        seenU.add(r.url); seenK.add(r.title_key);
        const { error } = await db.from('ve_news_leads').insert(r);
        if (!error) added++;
      }
    }
  } catch (e) {
    status = e instanceof Error ? e.message : String(e);
  }
  if (!month) await db.from('ve_news_feeds').update({ last_fetched_at: new Date().toISOString(), last_status: status, last_count: added }).eq('id', feed.id);
  return { found, flagged, added, status };
}

// ---------- text ----------
const plain = (v: unknown, n: number) => String(v || '').replace(/[<>]/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, n);
const COVER_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/library/`;

// ---------- reading a pasted link ----------
function meta(html: string, keys: string[]): string | null {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m && m[1].trim()) return decode(m[1]);
  }
  return null;
}
// Pages that answer with a login wall or a robot check instead of the story.
const WALL_RE = /(log ?in|sign ?in|sign up|create an account|join facebook|are you a robot|captcha|access denied|just a moment|attention required)/i;
async function readPage(link: string): Promise<{ readable: boolean; title: string | null; summary: string | null; image: string | null; site: string | null; published: string | null; why: string | null }> {
  const out = { readable: false, title: null as string | null, summary: null as string | null, image: null as string | null, site: null as string | null, published: null as string | null, why: null as string | null };
  try {
    const res = await fetch(link, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) { out.why = `the page answered ${res.status}`; return out; }
    if (!/html/i.test(res.headers.get('content-type') || '')) { out.why = 'the link is not a web page'; return out; }
    const html = (await res.text()).slice(0, 600000);
    const docTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
    out.title = meta(html, ['og:title', 'twitter:title']) || (docTitle ? decode(docTitle) : null);
    out.summary = meta(html, ['og:description', 'twitter:description', 'description']);
    const img = meta(html, ['og:image', 'og:image:url', 'twitter:image']);
    out.image = img && /^https:\/\//i.test(img) ? img : null;
    out.site = meta(html, ['og:site_name']);
    const pub = meta(html, ['article:published_time', 'og:published_time', 'datePublished', 'pubdate']);
    const d = pub ? new Date(pub) : null;
    out.published = d && !isNaN(d.getTime()) ? d.toISOString() : null;
    if (out.title) out.title = stripHtml(out.title).slice(0, 300);
    if (out.summary) out.summary = stripHtml(out.summary).slice(0, 500);
    const host = new URL(res.url || link).hostname.replace(/^www\./, '');
    if (!out.title || out.title.length < 6) out.why = 'the page has no headline we can read';
    else if (/(^|\.)(facebook|instagram|fb)\.com$/i.test(host) && (!out.summary || WALL_RE.test(out.title))) out.why = 'Facebook shows this post only to people who are logged in';
    else if (WALL_RE.test(out.title) && !out.summary) out.why = 'the page shows a login or robot check instead of the story';
    out.readable = !out.why;
  } catch (e) {
    out.why = e instanceof Error && /timed? ?out|abort/i.test(e.message) ? 'the page took too long to answer' : 'the page would not open';
  }
  return out;
}

const LEAD_COLS = 'id, feed_id, origin, community_news_id, submitted_by_name, sean_note, needs_line, decided_at, source_name, title, url, summary, image_url, published_at, city_slug, reason, matched_terms, headline_match, status, pulse_id, draft_error, notes, marked_at, drafted_at, created_at, ve_pulse_content(id, slug, status, title, summary, category, thumbnail_url, city_slug), ve_news_feeds(scope, feed_name)';
const FEED_COLS = 'id, city_slug, feed_name, feed_url, scope, search_query, locale, is_active, last_fetched_at, last_status, last_count, notes, created_at';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const url = new URL(req.url);

  if (url.searchParams.get('cron') === 'ingest') {
    const cron = req.headers.get('x-cron-secret');
    if (!cron || cron !== (await secret('CRON_SECRET'))) return json({ error: 'unauthorized' }, 401);
    const { data: feeds } = await db.from('ve_news_feeds').select(FEED_COLS).eq('is_active', true);
    const results: unknown[] = [];
    for (const f of feeds || []) results.push({ feed: f.feed_name, ...(await pullFeed(f)) });
    // Writing is the Background writer's job (lesaruss_dispatch_tick), not this function's.
    return json({ ok: true, results });
  }

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  // One month of one Google News search, for looking back from the server side (same as the
  // page's "Look back to June" button, which uses the superadmin action below).
  if (url.searchParams.get('cron') === 'backfill') {
    const cron = req.headers.get('x-cron-secret');
    if (!cron || cron !== (await secret('CRON_SECRET'))) return json({ error: 'unauthorized' }, 401);
    body.action = 'backfill';
    const { data: feed } = await db.from('ve_news_feeds').select(FEED_COLS).eq('id', String(body.feed_id || '')).eq('scope', 'search').maybeSingle();
    const month = String(body.month || '');
    if (!feed || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < LOOK_BACK_FROM.slice(0, 7)) return json({ error: 'bad_request' }, 400);
    return json({ ok: true, feed: feed.feed_name, month, ...(await pullFeed(feed, month)) });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member?.is_superadmin) return json({ error: 'no_access' }, 403);
  const isId = (v: unknown) => /^[0-9a-f-]{36}$/.test(String(v || ''));

  if (body.action === 'leads_list') {
    let q = db.from('ve_news_leads').select(LEAD_COLS);
    if (body.status === 'writing') q = q.in('status', ['write', 'drafting']);
    else if (LEAD_STATUSES.includes(body.status)) q = q.eq('status', body.status);
    if (HUB_SLUGS.includes(body.city)) q = q.eq('city_slug', body.city);
    if (body.headline_only) q = q.eq('headline_match', true);
    if (body.q) q = q.ilike('title', `%${String(body.q).replace(/[%_,()]/g, ' ').slice(0, 80)}%`);
    const { data, error } = await q.order('published_at', { ascending: false, nullsFirst: false }).limit(600);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    let leads = data || [];
    if (['vegan', 'local', 'search'].includes(body.scope)) leads = leads.filter((l: any) => l.ve_news_feeds?.scope === body.scope);
    const { data: all } = await db.from('ve_news_leads').select('status');
    const counts: Record<string, number> = {};
    for (const r of all || []) counts[r.status] = (counts[r.status] || 0) + 1;
    return json({ leads, counts, hubs: HUBS.map(({ slug, name }) => ({ slug, name })) });
  }

  if (body.action === 'lead_update') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!['new', 'dismissed'].includes(body.status)) return json({ error: 'bad_status' }, 400);
      patch.status = body.status;
    }
    if (body.notes !== undefined) patch.notes = plain(body.notes, 1500) || null;
    if (body.city_slug !== undefined) {
      if (body.city_slug && !HUB_SLUGS.includes(body.city_slug)) return json({ error: 'bad_city' }, 400);
      patch.city_slug = body.city_slug || null;
    }
    if (body.status === 'new') patch.decided_at = null;
    const { data, error } = await db.from('ve_news_leads').update(patch).eq('id', body.id).select(LEAD_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, lead: data });
  }

  // Approve: the story goes to the Background writer, which picks up every 'write' lead.
  if (body.action === 'lead_write') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: 'write', marked_at: now, decided_at: now, draft_error: null };
    if (body.note !== undefined) { patch.sean_note = plain(body.note, 1500) || null; if (patch.sean_note) patch.needs_line = false; }
    // A page we could not read needs Sean's one line before the writer can do anything with it.
    const { data: cur } = await db.from('ve_news_leads').select('needs_line, sean_note').eq('id', body.id).maybeSingle();
    if (cur?.needs_line && !cur.sean_note && !patch.sean_note) return json({ error: 'needs_line' }, 409);
    const { data, error } = await db.from('ve_news_leads').update(patch)
      .eq('id', body.id).in('status', ['new', 'write', 'dismissed']).select(LEAD_COLS).single();
    if (error || !data) return json({ error: 'not_available' }, 409);
    if (data.community_news_id) await db.from('ve_community_news').update({ status: 'rejected', reviewed_by: 'the-depot', reviewed_at: now, rejection_reason: 'Approved in the Depot Inbox to be written up as a Pulse piece' }).eq('id', data.community_news_id).eq('status', 'pending');
    return json({ ok: true, lead: data });
  }

  if (body.action === 'inbox_list') {
    const city = HUB_SLUGS.includes(body.city) ? body.city : null;
    const pick = (statuses: string[], order: string, limit: number) => {
      let q = db.from('ve_news_leads').select(LEAD_COLS).in('status', statuses);
      if (city) q = q.eq('city_slug', city);
      return q.order(order, { ascending: false, nullsFirst: false }).limit(limit);
    };
    const [dec, wri, rdy, done, stats] = await Promise.all([
      pick(['new'], 'published_at', 600), pick(['write', 'drafting'], 'marked_at', 200), pick(['drafted'], 'drafted_at', 200),
      pick(['published', 'shared', 'dismissed'], 'decided_at', 60),
      db.rpc('ve_news_inbox_stats'),
    ]);
    const err = dec.error || wri.error || rdy.error || done.error || stats.error;
    if (err) return json({ error: 'list_failed', message: err.message }, 500);
    // Sean's own links and member stories first, then the newest feed stories.
    const rank: Record<string, number> = { link: 0, member: 1, city_news: 2, feed: 3 };
    const decide = (dec.data || []).sort((a: any, b: any) => (rank[a.origin] - rank[b.origin]) || String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)));
    const counts = stats.data?.counts || {};
    return json({ decide, writing: wri.data || [], ready: rdy.data || [], done: done.data || [], counts, hubs: HUBS.map(({ slug, name }) => ({ slug, name })) });
  }

  if (body.action === 'link_add') {
    let u: URL;
    try { u = new URL(String(body.url || '').trim()); } catch { return json({ error: 'bad_url' }, 400); }
    if (!/^https?:$/.test(u.protocol) || /^(localhost|.*\.local|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname) || !u.hostname.includes('.')) return json({ error: 'bad_url' }, 400);
    u.hash = '';
    const link = u.href;
    const { data: dups } = await db.from('ve_news_leads').select(LEAD_COLS).eq('url', link).limit(1);
    if (dups && dups.length) return json({ ok: true, already: true, lead: dups[0] });
    const city = body.city_slug && HUB_SLUGS.includes(body.city_slug) ? body.city_slug : null;
    const note = plain(body.note, 1500) || null;
    const page = await readPage(link);
    const host = u.hostname.replace(/^www\./, '');
    const title = page.readable ? page.title! : (page.title && page.title.length >= 6 && !WALL_RE.test(page.title) ? page.title : `Link from ${host}`);
    const guess = city || cityHits(title + ' ' + (page.summary || ''))[0]?.slug || null;
    const row = {
      origin: 'link', source_name: page.site || host, title: title.slice(0, 300), title_key: titleKey(title + ' ' + link).slice(0, 200), url: link,
      summary: page.readable ? page.summary : null, image_url: page.readable ? page.image : null, published_at: page.published || new Date().toISOString(),
      city_slug: guess, status: 'new', sean_note: note, needs_line: !page.readable && !note,
      reason: page.readable ? 'You pasted this link' : `You pasted this link. We could not read the page (${page.why}), so the writer needs one line from you about the story`,
      matched_terms: [], headline_match: false,
    };
    const { data, error } = await db.from('ve_news_leads').insert(row).select(LEAD_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, lead: data, readable: page.readable, why: page.why });
  }

  if (body.action === 'lead_note') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const note = plain(body.note, 1500) || null;
    const patch: Record<string, unknown> = { sean_note: note };
    if (note) patch.needs_line = false;
    const { data, error } = await db.from('ve_news_leads').update(patch).eq('id', body.id).select(LEAD_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, lead: data });
  }

  if (body.action === 'lead_deny') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const now = new Date().toISOString();
    const { data, error } = await db.from('ve_news_leads').update({ status: 'dismissed', decided_at: now }).eq('id', body.id).in('status', ['new', 'write']).select(LEAD_COLS).single();
    if (error || !data) return json({ error: 'not_available' }, 409);
    if (data.community_news_id) await db.from('ve_community_news').update({ status: 'rejected', reviewed_by: 'the-depot', reviewed_at: now, rejection_reason: 'Denied in the Depot Inbox' }).eq('id', data.community_news_id).eq('status', 'pending');
    return json({ ok: true, lead: data });
  }

  // Share to a city hub as a link, without writing it up: the story shows in that hub's Local News
  // (public/hub-news.js reads approved ve_community_news rows).
  if (body.action === 'lead_share') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: lead } = await db.from('ve_news_leads').select(LEAD_COLS).eq('id', body.id).maybeSingle();
    if (!lead || !['new', 'dismissed'].includes(lead.status)) return json({ error: 'not_available' }, 409);
    const city = body.city_slug && HUB_SLUGS.includes(body.city_slug) ? body.city_slug : lead.city_slug;
    if (!city) return json({ error: 'city_required' }, 400);
    if (!/^https?:\/\//i.test(lead.url || '')) return json({ error: 'no_link' }, 400);
    const now = new Date().toISOString();
    let cnId = lead.community_news_id;
    if (cnId) {
      const { error } = await db.from('ve_community_news').update({ status: 'approved', city_slug: city, reviewed_by: 'the-depot', reviewed_at: now, published_at: now }).eq('id', cnId);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
    } else {
      const { data: cn, error } = await db.from('ve_community_news').insert({
        city_slug: city, headline: plain(lead.title, 200), summary: lead.summary ? plain(lead.summary, 500) : null, url: lead.url, image_url: /^https:\/\//i.test(lead.image_url || '') ? lead.image_url : null,
        source_type: 'manual', source_name: lead.source_name, status: 'approved', reviewed_by: 'the-depot', reviewed_at: now, published_at: now,
      }).select('id').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      cnId = cn.id;
    }
    const { data, error } = await db.from('ve_news_leads').update({ status: 'shared', city_slug: city, decided_at: now, community_news_id: cnId }).eq('id', body.id).select(LEAD_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, lead: data });
  }

  // Ready lane: publish the draft the writer made. Same rules as Depot > Pulse (ve-media-library):
  // a cover from our own Library, published_at stamped, and the piece's city tag so it shows on that hub.
  if (body.action === 'ready_publish') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: lead } = await db.from('ve_news_leads').select('id, status, pulse_id').eq('id', body.id).maybeSingle();
    if (!lead?.pulse_id || lead.status !== 'drafted') return json({ error: 'not_available' }, 409);
    const { data: piece } = await db.from('ve_pulse_content').select('id, status, thumbnail_url, city_slug, published_at, slug').eq('id', lead.pulse_id).eq('origin', 'depot').maybeSingle();
    if (!piece) return json({ error: 'not_found' }, 404);
    if (!piece.thumbnail_url || !String(piece.thumbnail_url).startsWith(COVER_PREFIX)) return json({ error: 'needs_cover' }, 409);
    const now = new Date().toISOString();
    const { error } = await db.from('ve_pulse_content').update({ status: 'published', published_at: piece.published_at || now, updated_at: now }).eq('id', piece.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (piece.city_slug && HUB_SLUGS.includes(piece.city_slug)) await db.from('ve_pulse_city_tags').upsert({ pulse_id: piece.id, city_slug: piece.city_slug }, { onConflict: 'pulse_id,city_slug', ignoreDuplicates: true });
    const { data, error: e2 } = await db.from('ve_news_leads').update({ status: 'published', decided_at: now }).eq('id', body.id).select(LEAD_COLS).single();
    if (e2) return json({ error: 'save_failed', message: e2.message }, 500);
    return json({ ok: true, lead: data, slug: piece.slug });
  }

  // Send back: the writer revises the same draft, following Sean's note.
  if (body.action === 'ready_send_back') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const note = plain(body.note, 1500);
    if (!note) return json({ error: 'note_required' }, 400);
    const { data, error } = await db.from('ve_news_leads').update({ status: 'write', sean_note: note, marked_at: new Date().toISOString(), draft_error: null })
      .eq('id', body.id).eq('status', 'drafted').select(LEAD_COLS).single();
    if (error || !data) return json({ error: 'not_available' }, 409);
    return json({ ok: true, lead: data });
  }

  if (body.action === 'feeds_list') {
    const { data, error } = await db.from('ve_news_feeds').select(FEED_COLS).order('scope').order('city_slug', { nullsFirst: true }).order('feed_name');
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    // Sent, approved (any yes), denied and untouched per source, counted in SQL (ve_news_inbox_stats).
    const { data: stats } = await db.rpc('ve_news_inbox_stats');
    const blank = { sent: 0, approved: 0, denied: 0, untouched: 0 };
    const per: Record<string, typeof blank> = {};
    for (const t of stats?.by_source || []) per[t.key] = { sent: t.sent, approved: t.approved, denied: t.denied, untouched: t.untouched };
    const other = { link: per.link || blank, member: per.member || blank, city_news: per.city_news || blank };
    return json({ feeds: (data || []).map((f: any) => ({ ...f, ...(per[f.id] || blank), leads: (per[f.id] || blank).sent })), other, hubs: HUBS.map(({ slug, name }) => ({ slug, name })), look_back_from: LOOK_BACK_FROM });
  }

  if (body.action === 'feed_save') {
    const scope = String(body.scope || '');
    if (!['vegan', 'local', 'search'].includes(scope)) return json({ error: 'bad_scope' }, 400);
    const city = body.city_slug ? String(body.city_slug) : null;
    if (scope !== 'vegan' && !HUB_SLUGS.includes(city || '')) return json({ error: 'city_required' }, 400);
    const name = plain(body.feed_name, 80);
    if (!name) return json({ error: 'name_required' }, 400);
    const row: Record<string, unknown> = { feed_name: name, scope, city_slug: scope === 'vegan' ? null : city, locale: body.locale === 'GB' ? 'GB' : 'US' };
    if (scope === 'search') {
      const q = String(body.search_query || '').trim().slice(0, 300);
      if (!q) return json({ error: 'query_required' }, 400);
      row.search_query = q; row.feed_url = 'google-news';
    } else {
      let u: URL;
      try { u = new URL(String(body.feed_url || '')); } catch { return json({ error: 'bad_url' }, 400); }
      if (u.protocol !== 'https:' || /^(localhost|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname)) return json({ error: 'bad_url' }, 400);
      row.feed_url = u.href; row.search_query = null;
    }
    if (body.is_active !== undefined) row.is_active = !!body.is_active;
    const q = isId(body.id) ? db.from('ve_news_feeds').update(row).eq('id', body.id) : db.from('ve_news_feeds').insert(row);
    const { data, error } = await q.select(FEED_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, feed: data });
  }

  if (body.action === 'feed_active') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.from('ve_news_feeds').update({ is_active: !!body.is_active }).eq('id', body.id).select(FEED_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, feed: data });
  }

  if (body.action === 'feed_delete') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { error } = await db.from('ve_news_feeds').delete().eq('id', body.id);
    if (error) return json({ error: 'delete_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  if (body.action === 'feed_pull' || body.action === 'backfill') {
    if (!isId(body.id || body.feed_id)) return json({ error: 'bad_id' }, 400);
    const { data: feed } = await db.from('ve_news_feeds').select(FEED_COLS).eq('id', body.id || body.feed_id).maybeSingle();
    if (!feed) return json({ error: 'not_found' }, 404);
    let month: string | undefined;
    if (body.action === 'backfill') {
      month = String(body.month || '');
      if (feed.scope !== 'search') return json({ error: 'search_feeds_only' }, 400);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < LOOK_BACK_FROM.slice(0, 7)) return json({ error: 'bad_month' }, 400);
    }
    return json({ ok: true, feed: feed.feed_name, month: month || null, ...(await pullFeed(feed, month)) });
  }

  return json({ error: 'unknown_action' }, 400);
});
