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
// Flagged stories land in ve_news_leads with the reason they were flagged. Marking one "write it
// up" drafts an original Pulse article with Claude (it reads the source with web fetch), saved as
// a draft in ve_pulse_content for Sean to finish in Depot > Pulse and publish.
//
// Cron (x-cron-secret):  POST ?cron=ingest   pull every active feed; retry drafts that failed
//                        POST ?cron=backfill { feed_id, month }   one month of one Google News search
// Superadmin (Authorization: Bearer <ve_token>), POST { action, ... }:
//   leads_list { status?, city?, scope?, q?, headline_only? }   lead_update { id, status?, notes? }
//   lead_write { id }            mark and start drafting (runs in the background; poll leads_list)
//   feeds_list                   feed_save { id?, feed_name, scope, city_slug?, feed_url?, search_query?, locale?, is_active? }
//   feed_delete { id }           feed_pull { id }             backfill { feed_id, month: 'YYYY-MM' }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

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
const LEAD_STATUSES = ['new', 'write', 'drafting', 'drafted', 'dismissed', 'published'];

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

// ---------- drafting ----------
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paragraphs = (t: string) => t.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  .map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('\n');
const plain = (v: unknown, n: number) => String(v || '').replace(/[<>]/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, n);
const slugify = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'piece';

const WRITER = `You write for the Pulse, the news section of Vegans Explore, a membership platform and directory for Vegans in city hubs (South Florida, Central Florida, New York, Philadelphia, Los Angeles, Atlanta, the DMV and London).
Write an original short article for our readers based on the source story you are given. Rules:
- Read the source first with web fetch. If the link will not open (Google News links often redirect), use web search to find the original story, then fetch it.
- Use only facts you read in the source or confirm with a search. Never invent names, dates, prices, addresses or quotes. If something is unclear, leave it out and list it in "notes".
- Write it fresh in your own words, in a warm, direct voice for Vegans living in or visiting that city. Do not copy sentences from the source. Short quotes are fine only if attributed.
- Lead with why it matters to a Vegan in that city: where, when, what to order or do. Close by pointing readers to find Vegan spots nearby in the Vegans Explore Directory.
- Credit the source in the last paragraph in plain words, for example: "First reported by VegNews." Include the source link in that paragraph.
- Always capitalize Vegan and Vegans. Never use em dashes or en dashes. No emoji, no hashtags, no markdown, no headings. Plain paragraphs separated by a blank line.
- Length: 250 to 450 words.
When you are done, reply with only a JSON object, no other text:
{"title": "headline, under 90 characters", "summary": "one or two sentences for the card, under 220 characters", "category": one of ${JSON.stringify(CATEGORIES)}, "body": "the article, paragraphs separated by \\n\\n", "notes": "what to double check before publishing, or empty"}`;

async function draftLead(id: string, memberId: string | null): Promise<void> {
  const { data: lead } = await db.from('ve_news_leads').select('*').eq('id', id).maybeSingle();
  if (!lead || !['write', 'drafting'].includes(lead.status)) return;
  await db.from('ve_news_leads').update({ status: 'drafting', draft_error: null }).eq('id', id);
  try {
    const apiKey = await secret('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('no_anthropic_key');
    const client = new Anthropic({ apiKey });
    const ask = `Source story to write up for the ${hubName(lead.city_slug)} hub:
Headline: ${lead.title}
Outlet: ${lead.source_name || 'unknown'}
Link: ${lead.url}
Published: ${lead.published_at ? String(lead.published_at).slice(0, 10) : 'unknown'}
${lead.summary ? 'Feed summary: ' + lead.summary + '\n' : ''}Why we flagged it: ${lead.reason}`;
    const messages: any[] = [{ role: 'user', content: ask }];
    let final: any = null;
    for (let turn = 0; turn < 6; turn++) {
      const res: any = await client.beta.messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        system: WRITER,
        tools: [
          { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 4 },
          { type: 'web_search_20260209', name: 'web_search', max_uses: 4 },
        ],
        messages,
      } as any);
      if (res.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: res.content }); continue; }
      final = res; break;
    }
    if (!final) throw new Error('draft_did_not_finish');
    if (final.stop_reason === 'refusal') throw new Error('model_declined');
    const text = (final.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no_json_in_reply');
    const out = JSON.parse(m[0]);
    const title = plain(out.title, 160), summary = plain(out.summary, 400);
    const body = String(out.body || '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, 20000);
    if (!title || !summary || body.length < 200) throw new Error('draft_too_thin');
    const category = CATEGORIES.includes(out.category) ? out.category : 'Community';

    const base = slugify(title);
    const { data: taken } = await db.from('ve_pulse_content').select('slug').like('slug', base + '%');
    const used = new Set((taken || []).map((r: any) => r.slug));
    let slug = base; for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    const now = new Date().toISOString();
    const { data: piece, error } = await db.from('ve_pulse_content').insert({
      content_type: 'article', status: 'draft', origin: 'depot', brand_slug: 'vegans-explore', slug,
      source_url: `https://vegansexplore.com/pulse/${slug}`, title, summary, category, body: paragraphs(body),
      city_slug: lead.city_slug, author: 'Vegans Explore', created_at: now, updated_at: now, created_by: memberId,
    }).select('id, slug').single();
    if (error) throw new Error('save_failed: ' + error.message);
    const notes = plain(out.notes, 1500);
    await db.from('ve_news_leads').update({ status: 'drafted', pulse_id: piece.id, drafted_at: now, draft_error: null, notes: notes || lead.notes }).eq('id', id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('ve-news-desk draft failed', id, msg);
    await db.from('ve_news_leads').update({ status: 'write', draft_error: msg.slice(0, 300) }).eq('id', id);
  }
}

const LEAD_COLS = 'id, feed_id, source_name, title, url, summary, image_url, published_at, city_slug, reason, matched_terms, headline_match, status, pulse_id, draft_error, notes, marked_at, drafted_at, created_at, ve_pulse_content(slug, status), ve_news_feeds(scope, feed_name)';
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
    // Drafts stuck or failed: put back in line and try one more.
    await db.from('ve_news_leads').update({ status: 'write' }).eq('status', 'drafting').lt('marked_at', new Date(Date.now() - 20 * 60000).toISOString());
    const { data: retry } = await db.from('ve_news_leads').select('id').eq('status', 'write').lt('marked_at', new Date(Date.now() - 10 * 60000).toISOString()).order('marked_at').limit(2);
    for (const r of retry || []) EdgeRuntime.waitUntil(draftLead(r.id, null));
    return json({ ok: true, results, retried: (retry || []).length });
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
    const { data, error } = await db.from('ve_news_leads').update(patch).eq('id', body.id).select(LEAD_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, lead: data });
  }

  if (body.action === 'lead_write') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.from('ve_news_leads').update({ status: 'write', marked_at: new Date().toISOString(), draft_error: null })
      .eq('id', body.id).in('status', ['new', 'write', 'dismissed']).select(LEAD_COLS).single();
    if (error || !data) return json({ error: 'not_available' }, 409);
    EdgeRuntime.waitUntil(draftLead(body.id, memberId));
    return json({ ok: true, lead: { ...data, status: 'drafting' } });
  }

  if (body.action === 'feeds_list') {
    const { data, error } = await db.from('ve_news_feeds').select(FEED_COLS).order('scope').order('city_slug', { nullsFirst: true }).order('feed_name');
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const { data: leads } = await db.from('ve_news_leads').select('feed_id');
    const per: Record<string, number> = {};
    for (const l of leads || []) if (l.feed_id) per[l.feed_id] = (per[l.feed_id] || 0) + 1;
    return json({ feeds: (data || []).map((f: any) => ({ ...f, leads: per[f.id] || 0 })), hubs: HUBS.map(({ slug, name }) => ({ slug, name })), look_back_from: LOOK_BACK_FROM });
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
