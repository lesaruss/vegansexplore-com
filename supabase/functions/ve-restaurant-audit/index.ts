// ve-restaurant-audit: the restaurant audit (Sean, 2026-10-10, criteria approved the same day). Checks a restaurant's
// Google Business Profile, its website (SEO and the site itself) and its social accounts against ve_audit_criteria
// (migration 20261010_ve_restaurant_audit.sql), the way the BCPS Marcom audit checks a school site: weighted items, each
// Good, Fix, Review (double-check) or Skip (could not be checked, e.g. no website), and the score is the distance from a
// perfect score (Review and Skip count for neither side).
//
// Free check (anyone): the items marked in_free, what we found, and how many more things the full audit flags. Never the
// why or the how: that is the Restaurant Guide. Full audit: everything, with why, how, the Guide chapter and the service.
//
// POST { action: 'find', q }                       anyone -> { listings: [{slug, name, city}] }   approved Directory listings
// POST { action: 'criteria' }                      anyone -> { criteria: [{key, area, label, in_free}] }
// POST { action: 'free', listing_slug? | name, city, website?, instagram?, email? }  anyone -> { id, status, cached? }
//      one per business a week is reused; 5 a day per visitor
// POST { action: 'full', listing_slug? | name, city, website?, instagram? }  owner of the Restaurant Guide (ve_owns_guide),
//      a super admin, or the ops token -> { id, status }   10 a day per member
// POST { action: 'get', id }                       -> the audit; the full detail only for its member, a super admin or ops
// Ops (Bearer <LESARUSS_ADMIN_TOKEN>): free and full take wait: true to run in the request (tests).
//
// Sources: Google Places API (New) for the profile, PageSpeed Insights (mobile) for speed, accessibility and SEO, our own
// fetch of the home page, robots.txt, sitemap and menu page, and Apify's Instagram profile scraper (public profiles).
// Keys live in lesaruss_secrets (GOOGLE_PLACES_API_KEY, GOOGLE_PAGESPEED_API_KEY, APIFY_API_TOKEN).
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-cookbook checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const GUIDE = 'vegan-restaurant-survival-guide';
const DAY_MS = 24 * 60 * 60 * 1000;
const UA = 'Mozilla/5.0 (compatible; VegansExploreAudit/1.0; +https://vegansexplore.com/guides/vegan-restaurant-survival-guide)';
const LIMITS = { freePerVisitor: 5, fullPerMember: 10, freeReuseDays: 7 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

// ---- Who is asking ----
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
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}
type Caller = { ops: boolean; member: { id: string; email: string | null; admin: boolean } | null };
async function caller(req: Request): Promise<Caller> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ops: false, member: null };
  const opsToken = await secret('LESARUSS_ADMIN_TOKEN');
  if (opsToken && token === opsToken) return { ops: true, member: null };
  const id = await verifyToken(token);
  if (!id) return { ops: false, member: null };
  const { data: m } = await db.from('members').select('id, email, is_superadmin').eq('id', id).maybeSingle();
  return { ops: false, member: m ? { id: m.id, email: m.email, admin: !!m.is_superadmin } : null };
}
async function ownsGuide(memberId: string): Promise<boolean> {
  const { data } = await db.rpc('ve_owns_guide', { p_member: memberId, p_guide: GUIDE });
  return !!data;
}
async function ipHash(req: Request): Promise<string> {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ve-audit:' + ip));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ---- Fetching ----
// Many restaurant sites (Cloudflare, Sucuri, Wordfence) turn away anything that does not look like a browser; a guest sees
// the site fine. So a refusal is retried once as a normal browser, and only a site that refuses that too counts as blocked.
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
type Got = { ok: boolean; status: number; url: string; text: string; type: string };
async function get(url: string, ms = 12000, accept = 'text/html,application/xhtml+xml'): Promise<Got> {
  const first = await get1(url, ms, accept, UA);
  if (first.ok || ![0, 401, 403, 406, 429, 503].includes(first.status)) return first;
  const second = await get1(url, ms, accept, BROWSER_UA);
  return second.ok || second.status ? second : first;
}
async function get1(url: string, ms: number, accept: string, ua: string): Promise<Got> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': ua, Accept: accept, 'Accept-Language': 'en-US,en;q=0.9' } });
    const type = r.headers.get('content-type') || '';
    let text = '';
    if (/text|html|xml|json/i.test(type) || !type) text = (await r.text()).slice(0, 1_500_000);
    else await r.body?.cancel();
    return { ok: r.ok, status: r.status, url: r.url || url, text, type };
  } catch (e) {
    return { ok: false, status: 0, url, text: '', type: String((e as Error)?.name || 'error') };
  } finally { clearTimeout(t); }
}
const normUrl = (u: string) => {
  let s = String(u || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  try { return new URL(s).toString(); } catch { return ''; }
};
const igHandle = (v: string) => {
  const s = String(v || '').trim();
  if (!s) return '';
  const m = s.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const h = (m ? m[1] : s.replace(/^@/, '')).replace(/\/.*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(h) && !['p', 'reel', 'explore', 'stories'].includes(h.toLowerCase()) ? h.toLowerCase() : '';
};
const pathHandle = (v: string, host: RegExp) => {
  const s = String(v || '').trim();
  const m = s.match(host);
  return (m ? m[1] : s.replace(/^@/, '')).replace(/[/?#].*$/, '').toLowerCase();
};
// Website builders ship their own social links in templates (facebook.com/wix, instagram.com/squarespace); a site that never
// replaced them does not have those accounts. facebook.com/pages/<name>/<id> and profile.php links carry no handle.
const TEMPLATE_HANDLES = new Set(['wix', 'wixcom', 'squarespace', 'godaddy', 'shopify', 'wordpress', 'wordpressdotcom', 'weebly', 'webflow', 'toasttab', 'facebook', 'instagram', 'tiktok', 'meta', 'business', 'yourbusiness', 'username']);
function fbHandle(u: string) {
  const parts = String(u || '').replace(/^https?:\/\/(?:[a-z]+\.)?facebook\.com\//i, '').split(/[/?#]/).filter(Boolean);
  if (!parts.length) return '';
  if (parts[0] === 'pages') return (parts[1] || '').toLowerCase();
  if (/^(profile\.php|people|groups|events|share|sharer)/i.test(parts[0])) return '';
  return parts[0].toLowerCase();
}
const realSocial = (u: string, kind: 'ig' | 'fb' | 'tt') => {
  const h = kind === 'ig' ? igHandle(u) : kind === 'fb' ? fbHandle(u) : pathHandle(u, /tiktok\.com\/@([^/?#]+)/i);
  return h && !TEMPLATE_HANDLES.has(h.replace(/[._-]/g, '')) ? h : '';
};

// ---- Google Places (New) ----
const PLACE_FIELDS = ['id', 'displayName', 'formattedAddress', 'addressComponents', 'nationalPhoneNumber', 'websiteUri', 'businessStatus',
  'primaryType', 'primaryTypeDisplayName', 'types', 'rating', 'userRatingCount', 'regularOpeningHours.weekdayDescriptions', 'photos.name',
  'reviews.publishTime', 'editorialSummary', 'googleMapsUri'];
async function google(placeId: string, name: string, city: string, street = '') {
  const key = await secret('GOOGLE_PLACES_API_KEY');
  if (!key) return { error: 'no key' };
  try {
    if (placeId) {
      const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': PLACE_FIELDS.join(',') },
      });
      if (r.ok) return { place: await r.json() };
    }
    if (!name) return { place: null };
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': PLACE_FIELDS.map((f) => 'places.' + f).join(',') },
      body: JSON.stringify({ textQuery: `${name} ${street} ${city}`.replace(/\s+/g, ' ').trim(), maxResultCount: 3 }),
    });
    if (!r.ok) return { error: `places ${r.status}` };
    const places = ((await r.json()).places || []) as any[];
    const want = words(name);
    // Take the first result whose name shares a real word with theirs; a search for a name can return a neighbor.
    const place = places.find((p) => overlap(want, words(p.displayName?.text || '')) > 0) || null;
    return { place, others: places.length };
  } catch (e) { return { error: String((e as Error)?.message || e) }; }
}
const STOP = new Set(['the', 'and', 'cafe', 'restaurant', 'kitchen', 'vegan', 'llc', 'inc', 'co', 'bar', 'grill', 'eatery', 'food', 'foods']);
function words(s: string) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
const overlap = (a: string[], b: string[]) => a.filter((w) => b.includes(w)).length;

// ---- PageSpeed Insights (mobile) ----
async function pagespeed(url: string) {
  const key = await secret('GOOGLE_PAGESPEED_API_KEY');
  if (!key || !url) return { error: 'no key or url' };
  const q = new URLSearchParams({ url, strategy: 'mobile', key });
  for (const c of ['performance', 'accessibility', 'seo']) q.append('category', c);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: ctl.signal });
    const d = await r.json();
    if (!r.ok) return { error: d?.error?.message?.slice(0, 200) || `pagespeed ${r.status}` };
    const c = d.lighthouseResult?.categories || {};
    const a = d.lighthouseResult?.audits || {};
    return {
      performance: c.performance?.score ?? null, accessibility: c.accessibility?.score ?? null, seo: c.seo?.score ?? null,
      lcp: a['largest-contentful-paint']?.displayValue || null,
      failing: Object.values(a).filter((x: any) => x && x.score === 0 && x.scoreDisplayMode === 'binary').map((x: any) => x.title).slice(0, 12),
    };
  } catch (e) { return { error: (e as Error)?.name === 'AbortError' ? 'pagespeed timed out' : String((e as Error)?.message || e) }; }
  finally { clearTimeout(t); }
}

// ---- Instagram (Apify's public profile scraper) ----
async function instagram(handle: string) {
  const token = await secret('APIFY_API_TOKEN');
  if (!token || !handle) return { error: token ? 'no handle' : 'no key' };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 100000);
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
      method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [handle] }),
    });
    if (!r.ok) return { error: `apify ${r.status}` };
    const rows = (await r.json()) as any[];
    const p = rows.find((x) => String(x.username || '').toLowerCase() === handle) || null;
    if (p?.error && p.error !== 'not_found') return { error: `instagram ${p.error}` };
    if (!p || p.error) return { profile: null };
    const posts = (p.latestPosts || []).map((x: any) => Date.parse(x.timestamp)).filter((n: number) => n > 0).sort((a: number, b: number) => b - a);
    return {
      profile: {
        username: p.username, name: p.fullName || '', bio: p.biography || '', link: p.externalUrl || (p.externalUrls?.[0]?.url ?? ''),
        followers: p.followersCount ?? null, posts: p.postsCount ?? null, private: !!p.private, business: !!p.isBusinessAccount,
        latest: posts[0] ? new Date(posts[0]).toISOString() : null,
        last30: posts.filter((n: number) => n > Date.now() - 30 * DAY_MS).length,
        sampled: posts.length,
      },
    };
  } catch (e) { return { error: (e as Error)?.name === 'AbortError' ? 'instagram timed out' : String((e as Error)?.message || e) }; }
  finally { clearTimeout(t); }
}

// ---- Reading the website ----
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const textOf = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const ORDER_RE = /(doordash|ubereats|grubhub|toasttab|order\.online|chownow|clover\.com|square\.site|squareup\.com\/(?:store|gift)|opentable|resy\.com|exploretock|tock\.com|sevenrooms|yelp\.com\/reservations|postmates|seamless|slicelife|menufy|bentobox|popmenu|owner\.com|gloriafood|olo\.com)/i;
const ORDER_TEXT_RE = /\b(order (online|now|pickup|delivery|ahead)|reserv(e|ation)s?|book (a )?table|book now)\b/i;
const DAY_RE = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\b[^.]{0,40}?\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i;

async function website(url: string) {
  if (!url) return { error: 'no website' };
  const home = await get(url);
  if (!home.ok || !home.text) return { opened: false, status: home.status, url: home.url, error: home.status ? `status ${home.status}` : home.type };
  const html = home.text;
  const base = new URL(home.url);
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim());
  const meta = (name: string) => decode(html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))?.[1]
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'))?.[1] || '').trim();
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1])).filter(Boolean);
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join(' ');
  const ldTypes = [...ld.matchAll(/"@type"\s*:\s*(\[[^\]]*\]|"[^"]*")/g)].map((m) => m[1].replace(/[\[\]"]/g, '')).join(',');
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !/(width|height)=["']?1["'\s>]/i.test(t));
  const withAlt = imgs.filter((t) => /\balt=["'][^"']{2,}["']/i.test(t)).length;
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: decode(m[1]).trim(), text: textOf(m[2]).slice(0, 80) }));
  const abs = (h: string) => { try { return new URL(h, base).toString(); } catch { return ''; } };
  const social = (re: RegExp, kind: 'ig' | 'fb' | 'tt') => hrefs.map((a) => a.href).find((h) => re.test(h) && realSocial(h, kind)) || '';
  const text = textOf(html);
  const years = [...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => +m[1]).filter((y) => y > 1995 && y < 2100);

  // Menu: a link to a menu, else prices on the home page.
  const menuLink = hrefs.find((a) => /menu/i.test(a.href) || /^\s*(our |full |view (the |our )?)?menus?\s*$/i.test(a.text));
  let menu: { kind: string; url: string } = { kind: 'none', url: '' };
  if (menuLink) {
    const mu = abs(menuLink.href);
    if (/\.pdf(\?|$)/i.test(mu)) menu = { kind: 'pdf', url: mu };
    else if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(mu)) menu = { kind: 'image', url: mu };
    else if (ORDER_RE.test(mu)) menu = { kind: 'ordering', url: mu };
    else if (mu) {
      const mp = await get(mu, 10000);
      const mt = textOf(mp.text || '');
      const prices = (mt.match(/\$\s?\d{1,3}(\.\d{2})?/g) || []).length;
      menu = { kind: !mp.ok ? 'broken' : prices >= 5 || mt.split(' ').length > 250 ? 'text' : /\.pdf/i.test(mp.text) ? 'pdf' : 'thin', url: mu };
    }
  } else if ((text.match(/\$\s?\d{1,3}(\.\d{2})?/g) || []).length >= 5) menu = { kind: 'text', url: home.url };
  else if (/href=["']#(our-?|full-?)?menus?["']/i.test(html)) menu = { kind: 'section', url: home.url };

  // Main links: the first few same-site links, each opened once.
  const internal = [...new Set(hrefs.map((a) => abs(a.href)).filter((h) => { try { const u = new URL(h); return u.hostname === base.hostname && /^https?:$/.test(u.protocol) && u.pathname !== base.pathname && !/\.(pdf|jpe?g|png|webp|gif|zip)$/i.test(u.pathname); } catch { return false; } }))].slice(0, 8);
  const linkResults = await Promise.all(internal.map(async (h) => ({ url: h, status: (await get(h, 8000)).status })));
  const broken = linkResults.filter((l) => l.status === 404 || l.status === 410);

  const [robots, sitemap] = await Promise.all([get(new URL('/robots.txt', base).toString(), 6000, 'text/plain'), get(new URL('/sitemap.xml', base).toString(), 6000, 'application/xml,text/xml')]);
  let blockedAll = false;
  if (robots.ok) {
    let star = false;
    for (const line of robots.text.split(/\r?\n/)) {
      const l = line.replace(/#.*/, '').trim();
      if (/^user-agent:\s*\*/i.test(l)) star = true; else if (/^user-agent:/i.test(l)) star = false;
      else if (star && /^disallow:\s*\/\s*$/i.test(l)) blockedAll = true;
    }
  }
  return {
    opened: true, status: home.status, url: home.url, https: base.protocol === 'https:',
    title, description: meta('description'), robotsMeta: meta('robots'), viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    h1s, ldTypes, imgCount: imgs.length, imgAlt: withAlt,
    digits: html.replace(/\D/g, ''), text: text.slice(0, 200_000), ld: decode(ld).slice(0, 50_000),
    instagram: social(/instagram\.com\//i, 'ig'), facebook: social(/facebook\.com\/(?!sharer|share|dialog|plugins|tr\b)/i, 'fb'), tiktok: social(/tiktok\.com\/@/i, 'tt'),
    order: hrefs.filter((a) => ORDER_RE.test(a.href) || ORDER_TEXT_RE.test(a.text)).map((a) => abs(a.href)).slice(0, 5),
    hours: DAY_RE.test(text), years, menu, linksChecked: linkResults.length, broken,
    blockedAll, sitemap: (sitemap.ok && /<(urlset|sitemapindex)/i.test(sitemap.text)) || /^sitemap:/im.test(robots.text || ''),
  };
}

// ---- Scoring ----
type State = 'good' | 'fix' | 'review' | 'skip';
type Item = { key: string; state: State; found: string };
const pct = (n: number | null | undefined) => (n == null ? '' : String(Math.round(n * 100)));
const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
const timesIn = (s: string) => new Set([...String(s || '').toLowerCase().replace(/ | /g, ' ').matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/g)]
  .map((m) => `${+m[1]}${m[2] && m[2] !== '00' ? ':' + m[2] : ''}${m[3][0]}`));

function evaluate(inp: any, g: any, w: any, ps: any, ig: any): Item[] {
  const out: Item[] = [];
  const add = (key: string, state: State, found: string) => out.push({ key, state, found });
  const p = g?.place;
  // Google's address first: it is what diners see, and our Directory's city can be out of date.
  const city = String(p?.addressComponents?.find((c: any) => (c.types || []).includes('locality'))?.longText || inp.city || '').trim();
  const site = w?.opened ? w : null;
  const prof = ig?.profile && !ig.profile.private ? ig.profile : null;

  // Google Local
  if (g?.error) add('g_found', 'review', 'We could not reach Google just now, so this was not checked.');
  else if (!p) add('g_found', 'fix', `We searched Google for "${inp.name}${city ? ' ' + city : ''}" and did not find your profile.`);
  else if (inp.street && /^\d+/.test(inp.street) && !String(p.formattedAddress || '').startsWith(inp.street.match(/^\d+/)![0] + ' '))
    // A chain or a move: Google's closest match is not the address we have. Say so instead of quietly checking another branch.
    add('g_found', 'review', `Google's closest match is ${p.displayName?.text || inp.name} at ${p.formattedAddress}, but our Directory has you at ${inp.street}${inp.city ? ', ' + inp.city : ''}. Check which is right; the Google results below are for that match.`);
  else add('g_found', 'good', `Found: ${p.displayName?.text || inp.name}, ${p.formattedAddress || ''}`.replace(/, $/, ''));
  const gp = (key: string, fn: () => [State, string]) => (p ? add(key, ...fn()) : add(key, 'skip', 'Needs your Google profile first.'));
  gp('g_open', () => p.businessStatus === 'OPERATIONAL' || !p.businessStatus ? ['good', 'Google shows you as open.']
    : ['fix', p.businessStatus === 'CLOSED_PERMANENTLY' ? 'Google shows you as permanently closed.' : 'Google shows you as temporarily closed.']);
  gp('g_nap', () => {
    if (!site) return ['skip', 'Needs your website to compare.'];
    const phone = String(p.nationalPhoneNumber || '').replace(/\D/g, '').slice(-10);
    const street = String(p.formattedAddress || '').split(',')[0].trim();
    const num = street.match(/^\d+/)?.[0] || '';
    const word = street.replace(/^\d+\s*/, '').split(/\s+/).find((x) => x.length > 2 && !/^(n|s|e|w|ne|nw|se|sw|north|south|east|west)$/i.test(x)) || '';
    const phoneOk = !phone || site.digits.includes(phone);
    // Google reads the restaurant markup too, so an address there counts for the match (w_contact asks for it on screen).
    const hay = `${site.text} ${site.ld}`.toLowerCase().replace(/\bsouthwest\b/g, 'sw').replace(/\bnorthwest\b/g, 'nw').replace(/\bsoutheast\b/g, 'se').replace(/\bnortheast\b/g, 'ne').replace(/\bstreet\b/g, 'st').replace(/\bavenue\b/g, 'ave');
    const addrOk = !num || (hay.includes(num) && (!word || hay.includes(word.toLowerCase())));
    if (phoneOk && addrOk) return ['good', 'Your website shows the same phone and street address as Google.'];
    const miss = [!phoneOk ? `the phone Google has (${p.nationalPhoneNumber})` : '', !addrOk ? `the address Google has (${street})` : ''].filter(Boolean).join(' or ');
    return ['fix', `Your home page does not show ${miss}.`];
  });
  gp('g_hours', () => p.regularOpeningHours?.weekdayDescriptions?.length ? ['good', 'Your hours are on Google.'] : ['fix', 'Google has no hours for you.']);
  gp('g_category', () => ['vegan_restaurant', 'vegetarian_restaurant'].includes(p.primaryType) ? ['good', `Google lists you as ${p.primaryTypeDisplayName?.text || 'a Vegan restaurant'}.`]
    : ['fix', `Google lists you as ${p.primaryTypeDisplayName?.text || p.primaryType || 'no category'}, not a Vegan restaurant.`]);
  gp('g_photos', () => {
    const n = (p.photos || []).length;
    return n >= 10 ? ['good', 'Your profile has plenty of photos.'] : ['fix', n ? `Google shows only ${n} photo${n === 1 ? '' : 's'} for you.` : 'Your profile has no photos.'];
  });
  gp('g_rating', () => p.rating == null ? ['fix', 'You do not have a Google rating yet.'] : p.rating >= 4.3 ? ['good', `Your rating is ${p.rating}.`] : ['fix', `Your rating is ${p.rating}.`]);
  gp('g_reviews', () => (p.userRatingCount || 0) >= 50 ? ['good', `You have ${p.userRatingCount} reviews.`] : ['fix', `You have ${p.userRatingCount || 0} review${p.userRatingCount === 1 ? '' : 's'}.`]);
  gp('g_recent_review', () => {
    const newest = (p.reviews || []).map((r: any) => Date.parse(r.publishTime)).filter((n: number) => n > 0).sort((a: number, b: number) => b - a)[0];
    if (!newest) return ['review', 'Google did not show us any of your reviews.'];
    return newest > Date.now() - 90 * DAY_MS ? ['good', `Your newest review we saw is from ${monthYear(new Date(newest).toISOString())}.`]
      : ['review', `The newest of the reviews Google shows first is from ${monthYear(new Date(newest).toISOString())}.`];
  });
  gp('g_website', () => p.websiteUri ? ['good', 'Your profile links to your website.'] : ['fix', 'Your Google profile has no website link.']);
  gp('g_vegan', () => (p.types || []).includes('vegan_restaurant') || /vegan/i.test(`${p.displayName?.text} ${p.editorialSummary?.text || ''}`)
    ? ['good', 'Google has you as Vegan.'] : ['fix', 'Nothing on your Google profile says Vegan.']);

  // Website
  if (!inp.website && !w?.url) add('w_found', 'fix', 'We could not find a website for you, on Google or in our Directory.');
  else if (!site && [401, 403, 406, 429, 503].includes(w?.status) && ps?.performance != null) add('w_found', 'review', `Your website (${inp.website || w?.url}) opens in a browser, but it turned our check away (${w.status}). Make sure its security settings do not block Google too.`);
  else if (!site) add('w_found', 'fix', `Your website (${inp.website || w?.url}) did not open for us${w?.status ? ` (it answered ${w.status})` : ''}.`);
  else add('w_found', 'good', `Your website opened: ${site.url}`);
  const ws = (key: string, fn: () => [State, string]) => (site ? add(key, ...fn()) : add(key, 'skip', 'Needs a working website first.'));
  // Google's own test loads the site like a browser, so its results stand even when the site turned our check away.
  const pss = (key: string, fn: () => [State, string]) => (site || ps?.performance != null ? add(key, ...fn()) : add(key, 'skip', 'Needs a working website first.'));
  ws('w_https', () => site.https ? ['good', 'Your site uses https.'] : ['fix', 'Your site opens without https.']);
  ws('w_mobile', () => site.viewport ? ['good', 'Your site is set up for phones.'] : ['fix', 'Your home page is missing the setting that makes it fit a phone screen.']);
  pss('w_speed', () => ps?.performance == null ? ['review', 'Google\'s speed test could not finish on your site.']
    : ps.performance >= 0.5 ? ['good', `Google rates your phone speed ${pct(ps.performance)} out of 100.`] : ['fix', `Google rates your phone speed ${pct(ps.performance)} out of 100${ps.lcp ? `; the main content takes ${ps.lcp} to appear` : ''}.`]);
  pss('w_a11y', () => ps?.accessibility == null ? ['review', 'Google\'s accessibility check could not finish on your site.']
    : ps.accessibility >= 0.9 ? ['good', `Google rates your accessibility ${pct(ps.accessibility)} out of 100.`] : ['fix', `Google rates your accessibility ${pct(ps.accessibility)} out of 100.`]);
  ws('w_contact', () => {
    const phone = String(p?.nationalPhoneNumber || inp.phone || '').replace(/\D/g, '').slice(-10);
    const hasPhone = phone ? site.digits.includes(phone) : /tel:|\(\d{3}\)\s*\d{3}[-.\s]\d{4}|\d{3}[-.]\d{3}[-.]\d{4}/.test(site.text);
    const hasAddr = /\d{2,6}\s+[A-Za-z0-9 .]+\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|way|hwy|highway|ln|lane|pl|place|ct|court|pkwy|parkway|ter|terrace|trl|plaza|sq|square)\b/i.test(site.text);
    if (hasPhone && hasAddr) return ['good', 'Your phone and address are on your home page.'];
    return ['fix', `Your home page is missing your ${[!hasPhone && 'phone number', !hasAddr && 'address'].filter(Boolean).join(' and ')}.`];
  });
  ws('w_hours', () => site.hours ? ['good', 'Your hours are on your home page.'] : ['fix', 'We did not find your hours on your home page.']);
  ws('w_order', () => site.order.length ? ['good', 'Your site has an order or booking link.'] : ['fix', 'We did not find an order online or reservation link on your home page.']);
  ws('w_links', () => !site.linksChecked ? ['skip', 'Your home page has no links to other pages on your site.']
    : site.broken.length ? ['fix', `${site.broken.length} of the links we opened lead to "page not found": ${site.broken.map((b: any) => new URL(b.url).pathname).join(', ')}`]
    : ['good', 'The links we opened all work.']);
  ws('w_fresh', () => {
    if (!site.years.length) return ['review', 'We did not find a copyright year on your site.'];
    const y = Math.max(...site.years), now = new Date().getFullYear();
    return y >= now - 1 ? ['good', `Your footer says ${y}.`] : ['fix', `Your footer still says ${y}.`];
  });

  // SEO
  const nameWords = words(inp.name || p?.displayName?.text || '');
  ws('s_title', () => !site.title ? ['fix', 'Your home page has no page title.']
    : overlap(nameWords, words(site.title)) > 0 || !nameWords.length ? ['good', `Your page title: "${site.title.slice(0, 90)}"`] : ['fix', `Your page title does not have your name: "${site.title.slice(0, 90)}"`]);
  ws('s_title_local', () => {
    const top = `${site.title} ${site.h1s.join(' ')} ${site.description}`.toLowerCase();
    const vegan = /vegan|plant[- ]based/.test(top);
    const local = city ? top.includes(city.toLowerCase()) : true;
    if (vegan && local) return ['good', 'Your title and headline say Vegan and your city.'];
    return ['fix', `Your page title and main headline do not say ${[!vegan && 'Vegan', !local && city].filter(Boolean).join(' or ')}.`];
  });
  ws('s_meta', () => !site.description ? ['fix', 'Your home page has no search description.']
    : site.description.length < 50 ? ['fix', `Your search description is very short: "${site.description}"`] : ['good', `Your search description: "${site.description.slice(0, 160)}"`]);
  ws('s_h1', () => site.h1s.length === 1 ? ['good', `Your main heading: "${site.h1s[0].slice(0, 80)}"`]
    : site.h1s.length === 0 ? ['fix', 'Your home page has no main heading (Heading 1).'] : ['review', `Your home page has ${site.h1s.length} main headings; one is best.`]);
  ws('s_schema', () => /restaurant|foodestablishment|cafeorcoffeeshop|bakery|localbusiness/i.test(site.ldTypes) ? ['good', 'Your site gives Google your restaurant details.'] : ['fix', 'Your site does not give Google your restaurant details (Restaurant markup).']);
  ws('s_indexable', () => /noindex/i.test(site.robotsMeta) ? ['fix', 'Your home page tells search engines not to list it.']
    : site.blockedAll ? ['fix', 'Your robots.txt blocks search engines from your whole site.'] : ['good', 'Search engines are allowed to list your site.']);
  ws('s_sitemap', () => site.sitemap ? ['good', 'Your site has a sitemap.'] : ['fix', 'We did not find a sitemap on your site.']);
  ws('s_alt', () => !site.imgCount ? ['skip', 'Your home page has no photos to check.']
    : site.imgAlt / site.imgCount >= 0.8 ? ['good', 'Your photos are described.'] : ['fix', `${site.imgCount - site.imgAlt} of the ${site.imgCount} photos on your home page have no description.`]);
  ws('s_menu_text', () => {
    const m = site.menu;
    if (m.kind === 'text') return ['good', 'Your menu is a page Google can read.'];
    if (m.kind === 'pdf') return ['fix', 'Your menu is a PDF.'];
    if (m.kind === 'image') return ['fix', 'Your menu is a picture.'];
    if (m.kind === 'ordering') return ['review', 'Your menu link goes to an ordering site, not a menu page of your own.'];
    if (m.kind === 'broken') return ['fix', 'Your menu link does not open.'];
    if (m.kind === 'section') return ['review', 'Your menu is a section of your home page, but we could not read dishes and prices there; it may be pictures.'];
    if (m.kind === 'thin') return ['review', 'Your menu page has little text on it; it may be pictures or an embedded file.'];
    return ['fix', 'We did not find a menu on your website.'];
  });
  pss('s_psi_seo', () => ps?.seo == null ? ['review', 'Google\'s SEO check could not finish on your site.']
    : ps.seo >= 0.9 ? ['good', `Google's SEO check gives you ${pct(ps.seo)} out of 100.`] : ['fix', `Google's SEO check gives you ${pct(ps.seo)} out of 100.`]);

  // Social
  const handle = inp.instagram || igHandle(site?.instagram || '');
  if (ig?.error && handle) add('x_ig_found', 'review', `We could not open @${handle} just now, so this was not checked.`);
  else if (prof) add('x_ig_found', 'good', `Found @${prof.username}${prof.followers != null ? `, ${prof.followers.toLocaleString('en-US')} followers` : ''}.`);
  else if (ig?.profile?.private) add('x_ig_found', 'fix', `@${handle} is a private account, so new guests cannot see your food.`);
  else if (handle) add('x_ig_found', 'fix', `We could not find the Instagram @${handle}; it may have been renamed or deleted.`);
  else add('x_ig_found', 'fix', 'We did not find an Instagram for you on your website or in our Directory.');
  const xs = (key: string, fn: () => [State, string]) => (prof ? add(key, ...fn()) : add(key, 'skip', 'Needs a public Instagram first.'));
  if (!site) add('x_ig_linked', 'skip', 'Needs a working website first.');
  else if (!handle) add('x_ig_linked', 'fix', 'Your website does not link to an Instagram.');
  else if (!prof && !ig?.error && !ig?.profile?.private && site.instagram && igHandle(site.instagram) === handle) add('x_ig_linked', 'fix', `Your website links to @${handle}, which does not exist on Instagram.`);
  else add('x_ig_linked', site.instagram && igHandle(site.instagram) === handle ? 'good' : 'fix',
    site.instagram && igHandle(site.instagram) === handle ? 'Your website links to your Instagram.' : site.instagram ? `Your website links to a different Instagram (@${igHandle(site.instagram)}).` : 'Your website does not link to your Instagram.');
  xs('x_ig_recent', () => !prof.latest ? ['fix', 'Your account has no posts we could see.']
    : Date.parse(prof.latest) > Date.now() - 14 * DAY_MS ? ['good', `Your last post was on ${new Date(prof.latest).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' })}.`]
    : ['fix', `Your last post was in ${monthYear(prof.latest)}.`]);
  xs('x_ig_freq', () => prof.last30 >= 4 ? ['good', `You posted ${prof.last30} times in the last 30 days.`] : ['fix', `You posted ${prof.last30} time${prof.last30 === 1 ? '' : 's'} in the last 30 days.`]);
  xs('x_ig_bio', () => {
    const bio = `${prof.bio} ${prof.name}`.toLowerCase();
    const hasCity = !city || bio.includes(city.toLowerCase()) || /\b(fl|florida|miami|broward|palm beach|sofl|south florida)\b/.test(bio);
    const hasLink = !!prof.link;
    if (hasCity && hasLink) return ['good', 'Your bio has where you are and a link.'];
    return ['fix', `Your bio is missing ${[!hasCity && 'your city', !hasLink && 'a link'].filter(Boolean).join(' and ')}.`];
  });
  const fb = inp.facebook || site?.facebook || '';
  add('x_fb', fb ? 'good' : 'fix', fb ? 'We found your Facebook page.' : 'We did not find a Facebook page linked from your website or your Directory listing.');
  const tt = inp.tiktok || site?.tiktok || '';
  add('x_tiktok', tt ? 'good' : 'fix', tt ? 'We found your TikTok.' : 'We did not find a TikTok linked from your website or your Directory listing.');
  const hs = [handle, tt && realSocial(tt, 'tt'), fb && realSocial(fb, 'fb')].filter(Boolean) as string[];
  const norm = (h: string) => h.replace(/[._-]/g, '');
  add('x_handles', hs.length < 2 ? 'skip' : new Set(hs.map(norm)).size === 1 ? 'good' : 'review',
    hs.length < 2 ? 'Needs two or more accounts to compare.' : new Set(hs.map(norm)).size === 1 ? 'Your handles match.' : `Your handles differ: ${hs.map((h) => '@' + h).join(', ')}.`);
  if (!p?.regularOpeningHours?.weekdayDescriptions?.length || !site?.hours) add('x_hours_agree', 'skip', 'Needs hours on both Google and your website.');
  else {
    const gt = timesIn(p.regularOpeningHours.weekdayDescriptions.join(' '));
    const st = timesIn(site.text);
    const share = gt.size ? [...gt].filter((t) => st.has(t)).length / gt.size : 1;
    add('x_hours_agree', share >= 0.6 ? 'good' : 'review', share >= 0.6 ? 'Your website hours match Google\'s.' : 'Your website hours may not match Google\'s. Check both.');
  }
  return out;
}

function score(items: Item[], crit: Map<string, any>, only?: (k: string) => boolean) {
  const areas: Record<string, { score: number; max: number }> = {};
  let s = 0, m = 0;
  for (const it of items) {
    const c = crit.get(it.key);
    if (!c || (only && !only(it.key))) continue;
    const a = (areas[c.area] ||= { score: 0, max: 0 });
    if (it.state === 'good') { s += c.weight; m += c.weight; a.score += c.weight; a.max += c.weight; }
    else if (it.state === 'fix') { m += c.weight; a.max += c.weight; }
  }
  return { score: s, max: m, areas };
}

async function criteriaMap() {
  const { data } = await db.from('ve_audit_criteria').select('*').eq('active', true).order('sort');
  return new Map((data || []).map((c: any) => [c.key, c]));
}

async function runAudit(id: string) {
  const { data: a } = await db.from('ve_audits').select('*').eq('id', id).single();
  const inp = a.inputs || {};
  try {
    const g = await google(inp.place_id || '', inp.name || '', inp.city || '', inp.street || '');
    const siteUrl = normUrl(inp.website || g.place?.websiteUri || '');
    const [w, ps, igr] = await Promise.all([
      website(siteUrl),
      siteUrl ? pagespeed(siteUrl) : Promise.resolve({ error: 'no website' }),
      (async () => {
        let h = inp.instagram || '';
        if (!h && siteUrl) {
          // The handle may only be on their site: read the home page first (cheap) so Instagram can run.
          const home = await get(siteUrl, 10000);
          h = [...home.text.matchAll(/instagram\.com\/[A-Za-z0-9._]+/gi)].map((m) => realSocial(m[0], 'ig')).find(Boolean) || '';
        }
        return h ? { handle: h, ...(await instagram(h)) } : { handle: '', error: 'no handle' };
      })(),
    ]);
    const inp2 = { ...inp, website: siteUrl, instagram: inp.instagram || (igr as any).handle || '' };
    const items = evaluate(inp2, g, w, ps, igr);
    const crit = await criteriaMap();
    const all = score(items, crit);
    const facts = {
      google: g.place ? { id: g.place.id, name: g.place.displayName?.text, address: g.place.formattedAddress, phone: g.place.nationalPhoneNumber,
        status: g.place.businessStatus, category: g.place.primaryTypeDisplayName?.text, rating: g.place.rating, reviews: g.place.userRatingCount,
        photos: (g.place.photos || []).length, maps: g.place.googleMapsUri, website: g.place.websiteUri, hours: g.place.regularOpeningHours?.weekdayDescriptions || null } : { error: (g as any).error || null },
      website: (w as any).opened ? { url: (w as any).url, title: (w as any).title, description: (w as any).description, menu: (w as any).menu, order: (w as any).order,
        instagram: (w as any).instagram, facebook: (w as any).facebook, tiktok: (w as any).tiktok } : { url: siteUrl || null, error: (w as any).error || null },
      pagespeed: ps,
      instagram: (igr as any).profile || { handle: (igr as any).handle || null, error: (igr as any).error || null },
    };
    await db.from('ve_audits').update({ status: 'done', items, score: all.score, max_score: all.max, areas: all.areas, facts, finished_at: new Date().toISOString() }).eq('id', id);
  } catch (e) {
    console.error('audit failed', id, e);
    await db.from('ve_audits').update({ status: 'failed', error: String((e as Error)?.message || e).slice(0, 500), finished_at: new Date().toISOString() }).eq('id', id);
  }
}

// The audit as its reader sees it. Free: the free items only, what we found, the score on those, and how many more Fix
// items the full audit holds. Full: every item with its why, how, Guide chapter and service.
async function present(a: any, full: boolean) {
  const crit = await criteriaMap();
  const base = { id: a.id, tier: a.tier, status: a.status, created_at: a.created_at, finished_at: a.finished_at, business: a.inputs?.name || null, error: a.status === 'failed' ? 'The audit could not finish. Try again in a few minutes.' : undefined };
  if (a.status !== 'done') return base;
  const items = (a.items || []) as Item[];
  if (!full) {
    const freeKeys = (k: string) => !!crit.get(k)?.in_free;
    const s = score(items, crit, freeKeys);
    const lockedFix = items.filter((it) => !freeKeys(it.key) && it.state === 'fix').length;
    return {
      ...base, full: false, score: s.score, max_score: s.max, areas: s.areas,
      items: items.filter((it) => freeKeys(it.key)).map((it) => ({ ...it, label: crit.get(it.key).label, area: crit.get(it.key).area })),
      locked: items.filter((it) => !freeKeys(it.key)).map((it) => ({ label: crit.get(it.key)?.label, area: crit.get(it.key)?.area })),
      more_fix: lockedFix,
    };
  }
  return {
    ...base, full: true, score: a.score, max_score: a.max_score, areas: a.areas, facts: { ...a.facts, website: a.facts?.website },
    items: items.map((it) => { const c = crit.get(it.key) || {}; return { ...it, label: c.label, area: c.area, weight: c.weight, why: c.why, how: c.how, chapter: c.chapter, service: c.service }; }),
  };
}

// What the audit is run on: a Directory listing, or what they typed.
async function inputsFrom(body: any): Promise<{ inputs?: any; listing_id?: string | null; error?: string }> {
  const slug = clean(body.listing_slug, 120);
  if (slug) {
    const { data: l } = await db.from('listings').select('id, name, slug, website, instagram, ig_handle, facebook, tiktok, phone, address_street, address_city, location, google_place_id')
      .eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!l) return { error: 'listing_not_found' };
    return {
      listing_id: l.id,
      inputs: { name: l.name, slug: l.slug, street: l.address_street || '', city: l.address_city || String(l.location || '').split(',')[0].trim(), website: normUrl(l.website || ''),
        instagram: igHandle(l.ig_handle || l.instagram || ''), facebook: l.facebook || '', tiktok: l.tiktok || '', phone: l.phone || '', place_id: l.google_place_id || '' },
    };
  }
  const name = clean(body.name, 120);
  if (name.length < 2) return { error: 'name_required' };
  return { listing_id: null, inputs: { name, city: clean(body.city, 80), website: normUrl(clean(body.website, 300)), instagram: igHandle(clean(body.instagram, 120)) } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const who = await caller(req);
  const run = (id: string) => (body.wait && who.ops ? runAudit(id) : (EdgeRuntime as any).waitUntil(runAudit(id)));

  if (action === 'find') {
    const q = clean(body.q, 80).replace(/[%_,()]/g, ' ').trim();
    if (q.length < 2) return json({ listings: [] });
    const { data } = await db.from('listings').select('slug, name, address_city, location').eq('status', 'approved').ilike('name', `%${q}%`).order('name').limit(8);
    return json({ listings: (data || []).map((l: any) => ({ slug: l.slug, name: l.name, city: l.address_city || String(l.location || '').split(',')[0].trim() })) });
  }
  if (action === 'criteria') {
    const crit = await criteriaMap();
    return json({ criteria: [...crit.values()].map((c: any) => ({ key: c.key, area: c.area, label: c.label, in_free: c.in_free })) });
  }

  if (action === 'free') {
    const r = await inputsFrom(body);
    if (r.error) return json({ error: r.error }, 400);
    const ip = await ipHash(req);
    // The same business checked this week: show that one (nothing is spent twice).
    const since = new Date(Date.now() - LIMITS.freeReuseDays * DAY_MS).toISOString();
    let q = db.from('ve_audits').select('id, status').in('status', ['running', 'done']).gte('created_at', since).order('created_at', { ascending: false }).limit(1);
    q = r.listing_id ? q.eq('listing_id', r.listing_id) : q.is('listing_id', null).eq('inputs->>name', r.inputs.name).eq('inputs->>website', r.inputs.website || '');
    const { data: prior } = await q;
    if (prior?.[0] && !body.fresh) return json({ id: prior[0].id, status: prior[0].status, cached: true });
    if (!who.ops) {
      const { count } = await db.from('ve_audits').select('id', { count: 'exact', head: true }).eq('ip_hash', ip).gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
      if ((count || 0) >= LIMITS.freePerVisitor) return json({ error: 'limit', message: 'That is all the free checks for today. Try again tomorrow.' }, 429);
    }
    const email = clean(body.email, 200).toLowerCase();
    const { data: a, error } = await db.from('ve_audits').insert({ tier: 'free', listing_id: r.listing_id, inputs: r.inputs, ip_hash: ip,
      email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null, member_id: who.member?.id || null }).select('id').single();
    if (error) return json({ error: 'save_failed' }, 500);
    await run(a.id);
    return json({ id: a.id, status: body.wait && who.ops ? 'done' : 'running' });
  }

  if (action === 'full') {
    if (!who.ops) {
      if (!who.member) return json({ error: 'sign_in' }, 401);
      if (!who.member.admin && !(await ownsGuide(who.member.id))) return json({ error: 'guide_required' }, 403);
      const { count } = await db.from('ve_audits').select('id', { count: 'exact', head: true }).eq('member_id', who.member.id).eq('tier', 'full').gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
      if ((count || 0) >= LIMITS.fullPerMember) return json({ error: 'limit', message: 'That is all the audits for today. Try again tomorrow.' }, 429);
    }
    const r = await inputsFrom(body);
    if (r.error) return json({ error: r.error }, 400);
    const { data: a, error } = await db.from('ve_audits').insert({ tier: 'full', listing_id: r.listing_id, inputs: r.inputs, member_id: who.member?.id || null,
      email: who.member?.email || null, ip_hash: await ipHash(req) }).select('id').single();
    if (error) return json({ error: 'save_failed' }, 500);
    await run(a.id);
    return json({ id: a.id, status: body.wait && who.ops ? 'done' : 'running' });
  }

  if (action === 'get') {
    if (!isId(body.id)) return json({ error: 'id' }, 400);
    const { data: a } = await db.from('ve_audits').select('*').eq('id', body.id).maybeSingle();
    if (!a) return json({ error: 'not_found' }, 404);
    // The full detail is the Guide: its member, a super admin or ops. A Guide owner may also open any free check in full.
    let full = who.ops || !!who.member?.admin;
    if (!full && who.member) full = a.tier === 'full' ? a.member_id === who.member.id : await ownsGuide(who.member.id);
    // Anyone else sees the free view. The scan reads only public pages, so a free check can reuse a member's full audit
    // of the same business this week (nothing is scanned or paid for twice), and the visitor still sees only the free part.
    return json(await present(a, full));
  }

  return json({ error: 'unknown_action' }, 400);
});
