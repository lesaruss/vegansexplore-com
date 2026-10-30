// ve-outlet-stories: a news outlet's latest stories under About on its listing, each opening the outlet's own site (Sean,
// 2026-10-30: "have their RSS feed underneath the About Us... see all the news articles that they have on their site... when they
// click on it, it goes to their website"). Migration 20261030_ve_outlet_stories.sql.
//
// The feed is listings.rss_url; empty, it is found once from the outlet's home page (<link rel="alternate"> for RSS or Atom, else
// /feed/, /rss, /feed, /rss.xml) and saved; an empty string means the team turned it off. The latest 100 stories are kept in
// ve_outlet_feeds and read again when older than 3 hours; a feed that fails keeps serving what we have. Nothing is copied but the
// headline, date, picture link and a short summary; every story links to the outlet.
//
// Which stories (Sean, 2026-10-30, "go" on Logan's default): a Vegan outlet shows every story; a general outlet
// (listings.details.news_filter = 'vegan') shows only stories that mention Vegan, plant-based, animals and the like (VEGAN_RE),
// and the page shows no section when none match.
//
// POST { action: 'stories', listing_id | slug, offset?, limit? }   anyone: { outlet, stories, total, filtered }
// POST { action: 'admin_feed', listing_id, rss_url }               a super admin: sets the feed and reads it; '' turns it off
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const KEEP = 100, FRESH_MS = 3 * 3600e3, MAX_BYTES = 8e6;
const UA = 'Mozilla/5.0 (compatible; VegansExplore/1.0; +https://vegansexplore.com)';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

// A story counts for a general outlet when its headline or summary says one of these (English and Spanish, for Diario Las Américas).
const VEGAN_RE = /\b(vegan\w*|plant[- ]based|plant[- ]powered|vegetarian\w*|meatless|meat[- ]free|dairy[- ]free|cruelty[- ]free|animal|animals|animal rights|animal welfare|sanctuar(y|ies)|pet adoptions?|shelter (pets?|dogs?|cats?)|farm animals?|factory farm\w*|wildlife|peta|tofu|veganos?|veganas?|vegetarian[oa]s?|a base de plantas|animales|refugio)\b/i;

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

// ---- reading a feed (RSS 2.0 or Atom) ----
const txt = (v: any): string => v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v);
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
function plain(html: string, max: number): string {
  const s = html.replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m))
    .replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : s;
}
const httpUrl = (u: string) => /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : '';
const arr = (v: any): any[] => v == null ? [] : ([] as any[]).concat(v);

function pictureOf(it: any, html: string): string {
  for (const k of ['media:content', 'media:thumbnail']) {
    for (const m of arr(it[k])) {
      const u = httpUrl(String(m?.['@_url'] || ''));
      if (u && (k === 'media:thumbnail' || !m['@_medium'] || m['@_medium'] === 'image' || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u))) return u;
    }
  }
  for (const g of arr(it['media:group'])) { const p = pictureOf(g, ''); if (p) return p; }
  for (const e of arr(it.enclosure)) if (/^image\//.test(String(e?.['@_type'] || ''))) { const u = httpUrl(String(e['@_url'] || '')); if (u) return u; }
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? httpUrl(m[1].replace(/&amp;/g, '&')) : '';
}

async function getText(url: string, accept: string): Promise<{ ok: boolean; status: number; text: string; type: string; url: string }> {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  const len = +(r.headers.get('content-length') || 0); if (len > MAX_BYTES) throw new Error('too large');
  const text = await r.text();
  return { ok: r.ok, status: r.status, text: text.slice(0, MAX_BYTES), type: r.headers.get('content-type') || '', url: r.url || url };
}

function parseFeed(xml: string) {
  const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', processEntities: true, htmlEntities: true }).parse(xml);
  const ch = doc?.rss?.channel || doc?.['rdf:RDF']?.channel;
  if (ch) {
    const items = arr(ch.item).concat(arr(doc?.['rdf:RDF']?.item));
    return items.map((it) => {
      const html = txt(it['content:encoded']) || txt(it.description);
      const date = Date.parse(txt(it.pubDate) || txt(it['dc:date']));
      const link = httpUrl(txt(it.link).trim()) || httpUrl(txt(it.guid).trim());
      return { title: plain(txt(it.title), 300), link, date: isNaN(date) ? null : new Date(date).toISOString(),
        image: pictureOf(it, html), summary: plain(txt(it.description) || html, 400) };
    });
  }
  const feed = doc?.feed;
  if (feed) {
    return arr(feed.entry).map((it) => {
      const links = arr(it.link);
      const alt = links.find((l) => !l?.['@_rel'] || l['@_rel'] === 'alternate') || links[0] || {};
      const html = txt(it.content) || txt(it.summary);
      const date = Date.parse(txt(it.published) || txt(it.updated));
      return { title: plain(txt(it.title), 300), link: httpUrl(String(alt['@_href'] || '').trim()), date: isNaN(date) ? null : new Date(date).toISOString(),
        image: pictureOf(it, html), summary: plain(txt(it.summary) || html, 400) };
    });
  }
  throw new Error('That is not an RSS or Atom feed');
}

async function readFeed(url: string) {
  const r = await getText(url, 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*');
  if (!r.ok) throw new Error('The feed answered ' + r.status);
  const stories = parseFeed(r.text).filter((s) => s.title && s.link).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const seen = new Set<string>();
  return stories.filter((s) => !seen.has(s.link) && seen.add(s.link)).slice(0, KEEP);
}

// The outlet's own feed: <link rel="alternate"> on its home page, else the usual addresses. Only a feed that parses counts.
async function findFeed(site: string): Promise<string> {
  let home: URL;
  try { home = new URL(site); home.search = ''; home.hash = ''; } catch { return ''; }
  const tries: string[] = [];
  try {
    const r = await getText(home.toString(), 'text/html,*/*');
    if (r.ok) {
      const base = new URL(r.url);
      for (const tag of r.text.match(/<link\b[^>]*>/gi) || []) {
        if (!/rel=["']?alternate/i.test(tag) || !/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
        if (/comments/i.test(tag)) continue;
        const h = tag.match(/href=["']([^"']+)["']/i);
        if (h) { try { tries.push(new URL(h[1].replace(/&amp;/g, '&'), base).toString()); } catch { /* bad href */ } }
      }
      home = new URL(base.origin + '/');
    }
  } catch { /* fall through to the usual addresses */ }
  for (const p of ['/feed/', '/rss', '/feed', '/rss.xml', '/index.rss', '/feed.xml', '/index.xml']) tries.push(new URL(p, home).toString());
  for (const u of [...new Set(tries)].slice(0, 8)) {
    try { if ((await readFeed(u)).length) return u; } catch { /* next */ }
  }
  return '';
}

async function feedFor(l: any, force = false) {
  const { data: f } = await db.from('ve_outlet_feeds').select('*').eq('listing_id', l.id).maybeSingle();
  if (!force && f && f.fetched_at && Date.now() - Date.parse(f.fetched_at) < FRESH_MS) return f;
  if (!force && f?.error_at && Date.now() - Date.parse(f.error_at) < FRESH_MS) return f;
  let url = l.rss_url == null ? '' : String(l.rss_url);
  if (l.rss_url === '') return f || null;                       // the team turned it off
  if (!url && l.website) {
    url = await findFeed(String(l.website));
    if (url) { await db.from('listings').update({ rss_url: url }).eq('id', l.id); l.rss_url = url; }
  }
  if (!url) {
    const row = { listing_id: l.id, feed_url: '', error: 'No feed found on their site', error_at: new Date().toISOString() };
    await db.from('ve_outlet_feeds').upsert(row, { onConflict: 'listing_id' });
    return { ...(f || {}), ...row, stories: f?.stories || [] };
  }
  try {
    const stories = await readFeed(url);
    const row = { listing_id: l.id, feed_url: url, stories, fetched_at: new Date().toISOString(), error: null, error_at: null };
    await db.from('ve_outlet_feeds').upsert(row, { onConflict: 'listing_id' });
    return row;
  } catch (e) {
    const row = { listing_id: l.id, feed_url: url, error: String((e as Error).message || e).slice(0, 300), error_at: new Date().toISOString() };
    await db.from('ve_outlet_feeds').upsert(row, { onConflict: 'listing_id' });
    return { ...(f || {}), ...row, stories: f?.stories || [] };
  }
}

async function listingOf(body: any) {
  let q = db.from('listings').select('id, slug, name, category, website, rss_url, status, details');
  if (isId(body.listing_id)) q = q.eq('id', body.listing_id);
  else if (typeof body.slug === 'string' && body.slug) q = q.eq('slug', body.slug).eq('status', 'approved');
  else return null;
  const { data } = await q.limit(1).maybeSingle();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  if (action === 'stories') {
    const l = await listingOf(body);
    if (!l || l.status !== 'approved' || l.category !== 'News Outlets') return json({ error: 'not_found' }, 404);
    const f = await feedFor(l);
    const filtered = l.details?.news_filter === 'vegan';
    let all: any[] = Array.isArray(f?.stories) ? f.stories : [];
    if (filtered) all = all.filter((s) => VEGAN_RE.test(s.title + ' ' + (s.summary || '')));
    const offset = Math.max(0, +body.offset || 0), limit = Math.min(50, Math.max(1, +body.limit || 10));
    return json({ outlet: { name: l.name, website: l.website || '', feed: f?.feed_url || '', fetched_at: f?.fetched_at || null },
      stories: all.slice(offset, offset + limit), total: all.length, filtered });
  }

  if (action === 'admin_feed') {
    const sub = await verifyToken((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    if (!sub) return json({ error: 'sign_in' }, 401);
    const { data: m } = await db.from('members').select('is_superadmin').eq('id', sub).maybeSingle();
    if (!m?.is_superadmin) return json({ error: 'no_access' }, 403);
    const l = await listingOf(body);
    if (!l) return json({ error: 'not_found' }, 404);
    const rss = String(body.rss_url ?? '').trim();
    if (rss && !httpUrl(rss)) return json({ error: 'bad_url' }, 400);
    await db.from('listings').update({ rss_url: rss }).eq('id', l.id);
    l.rss_url = rss;
    if (!rss) { await db.from('ve_outlet_feeds').delete().eq('listing_id', l.id); return json({ ok: true, off: true }); }
    const f = await feedFor(l, true);
    return json({ ok: !f?.error, error: f?.error || null, count: (f?.stories || []).length });
  }

  return json({ error: 'unknown_action' }, 400);
});
