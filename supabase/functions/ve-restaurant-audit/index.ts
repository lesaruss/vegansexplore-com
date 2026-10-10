// ve-restaurant-audit: the restaurant audit (Sean, 2026-10-10, criteria approved the same day). Checks a restaurant's
// Google Business Profile, its website (SEO and the site itself) and its social accounts against ve_audit_criteria
// (migration 20261010_ve_restaurant_audit.sql), the way the BCPS Marcom audit checks a school site: weighted items, each
// Good, Fix, Review (double-check) or Skip (could not be checked, e.g. no website), and the score is the distance from a
// perfect score (Review and Skip count for neither side).
//
// Free check (anyone; Sean, 2026-10-10: "let's not give them a score with the free audit, just a list of things they can
// work on right away"): of the in_free items, the ones to fix, each with what we found, and how many more the full audit
// flags. No score, no why or how. Full audit: every item with why, how, the Guide chapter and the service, and the score.
// The full audit is a paid add-on of its own (Sean, 2026-10-10: "it should be an add on... not $111 or part of the
// LESARUSS.AI membership... it could also include a secret shopper experience"). Priced the same day ("Go with $49 and
// $149"): $49 for the full audit with a re-check at 90 days, $149 with a Secret Shopper visit (our cities only), either one
// counting toward managed services within 30 days. Bought through `checkout` (Stripe), confirmed by GET ?confirm= (the
// Stripe webhook calls it too: metadata type ve_audit_purchase, confirm_fn ve-restaurant-audit); orders in ve_audit_orders.
//
// Monthly check-ups (migration 20261010_ve_audit_checkups.sql): `sweep` (cron) audits the next local businesses due, and
// every audit carries a closure flag (closed: Google shows it closed; quiet: two or more signs it may have closed).
//
// POST { action: 'find', q }                       anyone -> { listings: [{slug, name, city}] }   approved Directory listings
// POST { action: 'criteria' }                      anyone -> { criteria: [{key, area, label, in_free, chapter}] }  chapter: the Guide's fix
// POST { action: 'free', listing_slug? | name, city, website?, instagram?, email? }  anyone -> { id, status, cached? }
//      one per business a week is reused; 5 a day per visitor
// POST { action: 'full', listing_slug? | name, city, website?, instagram? }  a super admin or ops -> { id, status }  (no charge)
// POST { action: 'offer', listing_slug? | name, city }  anyone -> { full: 4900, shopper: 14900 | null, city }
// POST { action: 'checkout', tier: full|shopper, listing_slug? | name, city, website?, instagram? }  member -> { url }
// GET  ?confirm=<Stripe session>                   marks the order paid, starts the audit, emails the owner and the team
// POST { action: 'mine' }                          member -> { orders: [...], audits: [...] }
// Secret Shopper (a Community Manager for their city's orders, or a super admin):
// POST { action: 'shopper_list' } -> { visits }     POST { action: 'shopper_get', order_id } -> { place, report, missing } (the owner too, once sent)
// POST { action: 'shopper_schedule', order_id, date }   POST { action: 'shopper_save', order_id, section, data }
// POST { action: 'shopper_photo', order_id } -> { path, upload_url }   then shopper_photo_done { path, kind, caption }; shopper_photo_remove { path }
// POST { action: 'shopper_send', order_id }          checks the report is complete, emails the owner and Sean (the meal to reimburse)
// POST { action: 'get', id }                       -> the audit; the full detail only for its member, a super admin or ops
// POST { action: 'sweep', limit? }                 cron or ops -> { started: [slugs] }   the monthly check-up, a few at a time,
//      and the 90-day re-checks of paid audits
// POST { action: 'flags', city? }                  super admin -> { flags: [...] }       open closure flags, Google-closed first
// POST { action: 'flag_review', audit_id, decision: still_open|closed, note? }  super admin  (closing goes through
//      ve-outreach listing_closed; this records the decision so the flag comes down)
// Ops (Bearer <LESARUSS_ADMIN_TOKEN>, or the cron's x-cron-secret): free and full take wait: true to run in the request.
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
type Caller = { ops: boolean; member: { id: string; email: string | null; name?: string; admin: boolean; cm?: string | null } | null };
async function caller(req: Request): Promise<Caller> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); if (cs && cron === cs) return { ops: true, member: null }; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ops: false, member: null };
  const opsToken = await secret('LESARUSS_ADMIN_TOKEN');
  if (opsToken && token === opsToken) return { ops: true, member: null };
  const id = await verifyToken(token);
  if (!id) return { ops: false, member: null };
  const { data: m } = await db.from('members').select('id, email, name, is_superadmin, ve_role, home_community').eq('id', id).maybeSingle();
  return { ops: false, member: m ? { id: m.id, email: m.email, name: m.name || '', admin: !!m.is_superadmin, cm: m.ve_role === 'community_manager' ? (m.home_community || '') : null } : null };
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

// May it have closed? Google saying so is a flag on its own; otherwise it takes two or more quieter signs.
function closure(_items: Item[], g: any, w: any, igr: any): { level: 'closed' | 'quiet' | null; signals: string[] } {
  const p = g?.place;
  if (p && (p.businessStatus === 'CLOSED_PERMANENTLY' || p.businessStatus === 'CLOSED_TEMPORARILY'))
    return { level: 'closed', signals: [p.businessStatus === 'CLOSED_PERMANENTLY' ? 'Google shows it as permanently closed' : 'Google shows it as temporarily closed'] };
  const sig: string[] = [];
  const blocked = [401, 403, 406, 429, 503].includes(w?.status);
  if (w && !w.opened && !blocked && w.error !== 'no website') sig.push('Its website does not open');
  const prof = igr?.profile;
  if (igr?.handle && !igr?.error && !prof) sig.push(`Its Instagram (@${igr.handle}) no longer exists`);
  else if (prof && !prof.private && (!prof.latest || Date.parse(prof.latest) < Date.now() - 180 * DAY_MS))
    sig.push(prof.latest ? `No Instagram post since ${monthYear(prof.latest)}` : 'No Instagram posts');
  if (w?.opened && w.years?.length && Math.max(...w.years) <= new Date().getFullYear() - 3) sig.push(`Its website footer says ${Math.max(...w.years)}`);
  if (p && !p.regularOpeningHours?.weekdayDescriptions?.length) sig.push('Google has no hours for it');
  const newest = (p?.reviews || []).map((r: any) => Date.parse(r.publishTime)).filter((n: number) => n > 0).sort((a: number, b: number) => b - a)[0];
  if (p && newest && newest < Date.now() - 365 * DAY_MS) sig.push(`No Google review since ${monthYear(new Date(newest).toISOString())}`);
  if (!g?.error && !p) sig.push('Google has no profile for it');
  return { level: sig.length >= 2 ? 'quiet' : null, signals: sig };
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
    const cl = closure(items, g, w, igr);
    await db.from('ve_audits').update({ status: 'done', items, score: all.score, max_score: all.max, areas: all.areas, facts,
      closure_level: cl.level, closure_signals: cl.signals.length ? cl.signals : null, finished_at: new Date().toISOString() }).eq('id', id);
  } catch (e) {
    console.error('audit failed', id, e);
    await db.from('ve_audits').update({ status: 'failed', error: String((e as Error)?.message || e).slice(0, 500), finished_at: new Date().toISOString() }).eq('id', id);
  }
}

// The audit as its reader sees it. Free: the free items only, what we found, the score on those, and how many more Fix
// items the full audit holds. Full: every item with its why, how, Guide chapter and service.
async function present(a: any, full: boolean) {
  const crit = await criteriaMap();
  // target: what the audit ran on (all public), so the page can offer the full audit of the same business.
  const t = a.inputs || {};
  const base = { id: a.id, tier: a.tier, status: a.status, created_at: a.created_at, finished_at: a.finished_at, business: t.name || null,
    target: { listing_slug: t.slug || null, name: t.name || null, city: t.city || null, website: t.website || null, instagram: t.instagram || null },
    error: a.status === 'failed' ? 'The audit could not finish. Try again in a few minutes.' : undefined };
  if (a.status !== 'done') return base;
  const items = (a.items || []) as Item[];
  if (!full) {
    // A list to work on, no score: the free checks that need fixing, each with what we found, most important first.
    const freeKeys = (k: string) => !!crit.get(k)?.in_free;
    const todo = items.filter((it) => freeKeys(it.key) && it.state === 'fix')
      .sort((x, y) => (crit.get(y.key)?.weight || 0) - (crit.get(x.key)?.weight || 0));
    return {
      ...base, tier: 'free', full: false,
      todo: todo.map((it) => ({ key: it.key, label: crit.get(it.key).label, area: crit.get(it.key).area, found: it.found })),
      more_fix: items.filter((it) => !freeKeys(it.key) && it.state === 'fix').length,
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


// ---- The full audit for sale (Sean, 2026-10-10: "Go with $49 and $149"; migration 20261010_ve_audit_orders.sql) ----
// full $49: the full audit and a re-check 90 days later. shopper $149: the same plus a Secret Shopper visit arranged by the
// city's Community Manager (meal covered up to $40). Either one counts toward managed services within 30 days.
const PRICES: Record<string, number> = { full: 4900, shopper: 14900 };
const TIER_NAME: Record<string, string> = { full: 'Full restaurant audit', shopper: 'Full restaurant audit with Secret Shopper' };
const SITE = 'https://vegansexplore.com';
const GUIDE_URL = `${SITE}/guides/vegan-restaurant-survival-guide`;
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-restaurant-audit`;
const SEAN_EMAIL = 'contact@lesaruss.com';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
async function mail(to: string[], subject: string, html: string, replyTo?: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key || !to.length) return false;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }) }).catch(() => null);
  return !!r?.ok;
}
const para = (t: string) => `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;margin:0 0 14px">${t}</p>`;
async function isTestAccount(email: string | null) {
  if (!email) return false;
  const { data } = await db.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function stripeKey(test: boolean) {
  if (!test) return Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const k = await secret('STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST');
  if (!String(k || '').startsWith('sk_test_')) throw new Error('test key missing');
  return k!;
}
// Which of our cities a business is in (ve_outreach_cities), and who looks after it there: the Community Manager, else Sean.
async function cityOf(listingId: string | null, inputs: any) {
  let city = String(inputs?.city || ''), state = '';
  if (listingId) {
    const { data: l } = await db.from('listings').select('address_city, address_state').eq('id', listingId).maybeSingle();
    if (l) { city = l.address_city || city; state = l.address_state || ''; }
  }
  const { data: cities } = await db.from('ve_outreach_cities').select('community_slug, name, cities, states').neq('community_slug', 'brands');
  const c = (cities || []).find((x: any) => (x.cities || []).includes(city) && (!state || !x.states || x.states.includes(state)));
  if (!c) return null;
  const { data: cms } = await db.from('members').select('email, name').eq('ve_role', 'community_manager').eq('home_community', c.community_slug).limit(3);
  const cm = (cms || []).filter((m: any) => m.email);
  return { slug: c.community_slug, name: c.name, to: cm.length ? cm.map((m: any) => m.email) : [SEAN_EMAIL], cm: cm.length > 0 };
}
// After payment: the order is paid, the full audit starts, the buyer is told, and the team gets the order (and, for the
// Secret Shopper, the visit to arrange). Safe to call twice: only a pending order moves.
async function orderPaid(orderId: string, session: string) {
  const now = Date.now();
  const { data: o } = await db.from('ve_audit_orders').update({ status: 'paid', paid_at: new Date(now).toISOString(), stripe_session: session,
    recheck_at: new Date(now + 90 * DAY_MS).toISOString(), credit_until: new Date(now + 30 * DAY_MS).toISOString() })
    .eq('id', orderId).eq('status', 'pending').select('*').maybeSingle();
  if (!o) return (await db.from('ve_audit_orders').select('*').eq('id', orderId).maybeSingle()).data;
  const { data: m } = await db.from('members').select('email, name').eq('id', o.member_id).maybeSingle();
  const { data: a } = await db.from('ve_audits').insert({ tier: 'full', source: 'request', listing_id: o.listing_id, inputs: o.inputs, member_id: o.member_id,
    email: m?.email || null, order_id: o.id }).select('id').single();
  const where = await cityOf(o.listing_id, o.inputs);
  await db.from('ve_audit_orders').update({ audit_id: a?.id || null, community_slug: where?.slug || null, ...(o.tier === 'shopper' ? { shopper_status: 'to_arrange', shopper_assigned_to: (where?.to || [SEAN_EMAIL]).join(', ') } : {}) }).eq('id', o.id);
  if (a?.id) (EdgeRuntime as any).waitUntil(runAudit(a.id));
  const biz = o.inputs?.name || 'your restaurant', link = `${GUIDE_URL}#/audit/r/${a?.id || ''}`, first = String(m?.name || '').split(' ')[0] || 'there';
  if (m?.email) await mail([m.email], `Your full audit of ${biz} is running`,
    para(`Hi ${esc(first)},`) +
    para(`Thank you. Your full audit of <strong>${esc(biz)}</strong> is running now and takes about a minute. Open it in the Restaurant Guide: <a href="${link}">${link}</a>`) +
    para('Every check comes with why it matters and how to fix it. We run it again in 90 days so you can see what changed.') +
    (o.tier === 'shopper' ? para(`Your Secret Shopper visit: ${where?.cm ? 'your city\'s Community Manager' : 'our team'} will arrange it in the next few weeks and you will get the report with photos. You will not know the day.`) : '') +
    para('If you sign up for our managed services within 30 days, what you paid today counts toward it. Just reply to this email.'), SEAN_EMAIL);
  await mail(where?.to || [SEAN_EMAIL], `${o.test ? '[TEST] ' : ''}Audit order: ${TIER_NAME[o.tier]} for ${biz}`,
    para(`<strong>${esc(m?.name || 'A member')}</strong> (${esc(m?.email || '')}) bought the ${esc(TIER_NAME[o.tier])} ($${(o.amount_cents / 100).toFixed(0)}) for <strong>${esc(biz)}</strong>${o.inputs?.city ? ', ' + esc(o.inputs.city) : ''}.`) +
    para(`The audit: <a href="${link}">${link}</a>`) +
    (o.tier === 'shopper' ? para(`<strong>Secret Shopper visit to arrange.</strong> Within the next few weeks: order, eat and report on the welcome, the wait, the menu, Vegan labeling, cleanliness and how well the staff know the menu, with photos. The meal is covered up to $40. Do not tell the restaurant the day.`) : '') +
    para('The price counts toward managed services if they sign up within 30 days.'), m?.email || undefined);
  return { ...o, audit_id: a?.id || null };
}

// ---- The Secret Shopper report (Sean, 2026-10-10: "Build the Secret Shopper report form next"; migration
// 20261010_ve_audit_shopper.sql). The $149 order's visit is the city's Community Manager's (or a super admin's): they set the
// day, visit, and fill in the report one section at a time. Sending it emails the owner, who reads it in the Guide.
const SHOP_BUCKET = 'audit-shopper';
const SHOP_SECTIONS: Record<string, string[]> = {
  visit: ['date', 'time', 'party', 'mode', 'ordered', 'spent'],
  welcome: ['greeted', 'rating', 'notes'],
  wait: ['order_min', 'food_min', 'rating', 'notes'],
  menu: ['labeled', 'rating', 'notes'],
  food: ['rating', 'notes'],
  clean: ['rating', 'notes'],
  staff: ['question', 'answer', 'rating', 'notes'],
  summary: ['went_well', 'to_fix', 'overall', 'return'],
};
const PHOTO_KINDS = ['food', 'room', 'menu', 'restroom', 'outside', 'receipt', 'other'];
const SHOP_STATUS_NAME: Record<string, string> = { to_arrange: 'To arrange', scheduled: 'Visit set', visited: 'Report started', reported: 'Report sent' };
function canShop(who: Caller, o: any) { return who.ops || !!who.member?.admin || (!!who.member?.cm && who.member.cm === o.community_slug); }
async function signedPhotos(r: any) {
  const ph = (r?.photos || []) as any[];
  if (!ph.length) return [];
  const { data } = await db.storage.from(SHOP_BUCKET).createSignedUrls(ph.map((p) => p.path), 3600);
  return ph.map((p, i) => ({ ...p, url: data?.[i]?.signedUrl || null }));
}
async function shopperOrder(id: string) {
  const { data: o } = await db.from('ve_audit_orders').select('*').eq('id', id).eq('tier', 'shopper').eq('status', 'paid').maybeSingle();
  return o;
}
// What the shopper needs to find the place: its listing and what Google said in the audit.
async function shopperPlace(o: any) {
  const [{ data: l }, { data: a }] = await Promise.all([
    o.listing_id ? db.from('listings').select('name, slug, address_street, address_city, address_state, phone, website').eq('id', o.listing_id).maybeSingle() : Promise.resolve({ data: null }),
    o.audit_id ? db.from('ve_audits').select('facts').eq('id', o.audit_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const g = (a as any)?.facts?.google || {};
  return { name: (l as any)?.name || o.inputs?.name || 'The restaurant', slug: (l as any)?.slug || null,
    address: g.address || [(l as any)?.address_street, (l as any)?.address_city, (l as any)?.address_state].filter(Boolean).join(', ') || o.inputs?.city || '',
    phone: g.phone || (l as any)?.phone || null, website: g.website || (l as any)?.website || null, maps: g.maps || null, hours: g.hours || null };
}
function shopperMissing(r: any) {
  const miss: string[] = [];
  const need = (sec: string, k: string, label: string) => { const v = r?.[sec]?.[k]; if (v == null || v === '') miss.push(label); };
  need('visit', 'date', 'the day you went'); need('visit', 'ordered', 'what you ordered'); need('visit', 'spent', 'what you spent');
  for (const [sec, label] of [['welcome', 'the welcome'], ['wait', 'the wait'], ['menu', 'the menu'], ['food', 'the food'], ['clean', 'cleanliness'], ['staff', 'the staff']]) need(sec, 'rating', 'a rating for ' + label);
  need('staff', 'question', 'the Vegan question you asked'); need('summary', 'went_well', 'what went well'); need('summary', 'to_fix', 'what to fix'); need('summary', 'overall', 'an overall rating');
  if (((r?.photos || []) as any[]).filter((p) => p.kind !== 'receipt').length < 2) miss.push('at least two photos');
  return miss;
}

async function confirmCheckout(sessionId: string): Promise<Response> {
  const go = (u: string) => new Response(null, { status: 302, headers: { Location: u } });
  for (const test of [false, true]) {
    let res: Response;
    try { res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(test)}` } }); }
    catch { continue; }
    if (!res.ok) continue;
    const s = await res.json();
    if (s.metadata?.type !== 've_audit_purchase' || !isId(s.metadata?.order_id)) return go(GUIDE_URL);
    if (s.payment_status !== 'paid') return go(`${GUIDE_URL}?audit=unpaid#/audit`);
    const o = await orderPaid(s.metadata.order_id, s.id);
    return go(`${GUIDE_URL}?audit=paid#/audit/r/${o?.audit_id || ''}`);
  }
  return go(GUIDE_URL);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirmCheckout(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return new Response(null, { status: 302, headers: { Location: GUIDE_URL } }); }
  }
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
    return json({ criteria: [...crit.values()].map((c: any) => ({ key: c.key, area: c.area, label: c.label, in_free: c.in_free, chapter: c.chapter })) });
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
      // Anyone else buys it (checkout); this free path is the team's, for a business they are talking to.
      if (!who.member.admin) return json({ error: 'buy_it', message: 'The full audit is $49, or $149 with a Secret Shopper visit.' }, 403);
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
    if (!full && who.member) full = a.tier === 'full' && a.member_id === who.member.id;
    // Anyone else sees the free view. The scan reads only public pages, so a free check can reuse a member's full audit
    // of the same business this week (nothing is scanned or paid for twice), and the visitor still sees only the free part.
    return json(await present(a, full));
  }


  // ---- Buying the full audit ----
  // What a business can buy: the full audit anywhere, the Secret Shopper only in one of our cities.
  if (action === 'offer') {
    const r = await inputsFrom(body);
    if (r.error) return json({ full: PRICES.full, shopper: null });
    const where = await cityOf(r.listing_id || null, r.inputs);
    return json({ full: PRICES.full, shopper: where ? PRICES.shopper : null, city: where?.name || null });
  }
  if (action === 'checkout') {
    if (!who.member) return json({ error: 'sign_in', message: 'Sign in to buy the full audit.' }, 401);
    const tier = String(body.tier || '');
    if (!PRICES[tier]) return json({ error: 'tier' }, 400);
    const r = await inputsFrom(body);
    if (r.error) return json({ error: r.error }, 400);
    if (tier === 'shopper' && !(await cityOf(r.listing_id || null, r.inputs))) return json({ error: 'shopper_not_here', message: 'The Secret Shopper is in our cities only for now. The full audit works anywhere.' }, 400);
    const test = await isTestAccount(who.member.email);
    const { data: o, error } = await db.from('ve_audit_orders').insert({ member_id: who.member.id, listing_id: r.listing_id, inputs: r.inputs, tier, amount_cents: PRICES[tier], test })
      .select('id').single();
    if (error) return json({ error: 'save_failed' }, 500);
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': ((test ? '[TEST] ' : '') + TIER_NAME[tier] + ' - ' + r.inputs.name).slice(0, 120),
      'line_items[0][price_data][unit_amount]': String(PRICES[tier]),
      'line_items[0][quantity]': '1',
      success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: `${GUIDE_URL}?audit=cancelled#/audit`,
      'metadata[type]': 've_audit_purchase', 'metadata[confirm_fn]': 've-restaurant-audit',
      'metadata[order_id]': o.id, 'metadata[member_id]': who.member.id, 'metadata[tier]': tier,
    });
    if (who.member.email) { params.set('customer_email', who.member.email); params.set('payment_intent_data[receipt_email]', who.member.email); }
    if (test) params.set('metadata[test]', 'true');
    const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const sj = await sres.json();
    if (!sres.ok) { console.error('stripe', sj); await db.from('ve_audit_orders').update({ status: 'cancelled' }).eq('id', o.id); return json({ error: 'stripe', message: 'Checkout did not open. Try again in a minute.' }, 400); }
    await db.from('ve_audit_orders').update({ stripe_session: sj.id }).eq('id', o.id);
    return json({ url: sj.url, test_mode: test });
  }

  // ---- The Secret Shopper report ----
  if (action === 'shopper_list') {
    if (!who.ops && !who.member?.admin && !who.member?.cm) return json({ error: 'not_yours', message: 'Secret Shopper visits are for Community Managers.' }, 403);
    let q = db.from('ve_audit_orders').select('id, inputs, community_slug, shopper_status, shopper_report, paid_at, listing_id, test').eq('tier', 'shopper').eq('status', 'paid').order('paid_at', { ascending: true }).limit(200);
    if (!who.ops && !who.member?.admin) q = q.eq('community_slug', who.member!.cm!);
    const { data } = await q;
    const order = ['to_arrange', 'scheduled', 'visited', 'reported'];
    return json({ visits: (data || []).map((o: any) => ({ id: o.id, business: o.inputs?.name || null, city: o.inputs?.city || null, community: o.community_slug, test: o.test,
      status: o.shopper_status || 'to_arrange', status_name: SHOP_STATUS_NAME[o.shopper_status || 'to_arrange'], paid_at: o.paid_at, scheduled_for: o.shopper_report?.scheduled_for || null, sent_at: o.shopper_report?.sent_at || null }))
      .sort((a: any, b: any) => order.indexOf(a.status) - order.indexOf(b.status)) });
  }
  if (action === 'shopper_get') {
    if (!isId(body.order_id)) return json({ error: 'id' }, 400);
    const o = await shopperOrder(body.order_id);
    if (!o) return json({ error: 'not_found' }, 404);
    const owner = !!who.member && who.member.id === o.member_id;
    if (!canShop(who, o) && !(owner && o.shopper_status === 'reported')) return json({ error: 'not_yours' }, 403);
    const r = o.shopper_report || {};
    return json({ id: o.id, status: o.shopper_status || 'to_arrange', status_name: SHOP_STATUS_NAME[o.shopper_status || 'to_arrange'], paid_at: o.paid_at, test: o.test,
      place: await shopperPlace(o), report: { ...r, photos: await signedPhotos(r) }, missing: shopperMissing(r), can_edit: canShop(who, o) && o.shopper_status !== 'reported' });
  }
  if (['shopper_schedule', 'shopper_save', 'shopper_photo', 'shopper_photo_done', 'shopper_photo_remove', 'shopper_send'].includes(action)) {
    if (!isId(body.order_id)) return json({ error: 'id' }, 400);
    const o = await shopperOrder(body.order_id);
    if (!o) return json({ error: 'not_found' }, 404);
    if (!canShop(who, o)) return json({ error: 'not_yours' }, 403);
    if (o.shopper_status === 'reported') return json({ error: 'sent', message: 'This report was sent already.' }, 400);
    const r: any = o.shopper_report || {};
    const put = async (next: any, status?: string) => {
      const { error } = await db.from('ve_audit_orders').update({ shopper_report: next, ...(status ? { shopper_status: status } : {}) }).eq('id', o.id);
      return error ? json({ error: 'save_failed', message: error.message }, 500) : null;
    };
    if (action === 'shopper_schedule') {
      const d = clean(body.date, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return json({ error: 'date', message: 'Pick a day.' }, 400);
      const bad = await put({ ...r, scheduled_for: d, scheduled_by: who.member?.id || null }, (o.shopper_status || 'to_arrange') === 'to_arrange' ? 'scheduled' : undefined);
      return bad || json({ ok: true, scheduled_for: d });
    }
    if (action === 'shopper_save') {
      const sec = String(body.section || '');
      if (!SHOP_SECTIONS[sec]) return json({ error: 'section' }, 400);
      const data: Record<string, unknown> = {};
      for (const k of SHOP_SECTIONS[sec]) {
        const v = (body.data || {})[k];
        if (k === 'rating' || k === 'overall') { const n = Math.round(+v); data[k] = n >= 1 && n <= 5 ? n : null; }
        else if (['party', 'order_min', 'food_min'].includes(k)) { const n = Math.round(+v); data[k] = Number.isFinite(n) && v !== '' && v != null && n >= 0 && n < 1000 ? n : null; }
        else if (k === 'spent') { const n = Math.round(+String(v ?? '').replace(/[$,]/g, '') * 100) / 100; data[k] = Number.isFinite(n) && v !== '' && v != null && n >= 0 && n < 10000 ? n : null; }
        else data[k] = clean(v, k === 'notes' || k === 'went_well' || k === 'to_fix' || k === 'answer' || k === 'ordered' ? 2000 : 200) || null;
      }
      const next = { ...r, [sec]: data, updated_at: new Date().toISOString(), shopper_id: r.shopper_id || who.member?.id || null, shopper_name: r.shopper_name || who.member?.name || null };
      const bad = await put(next, ['to_arrange', 'scheduled'].includes(o.shopper_status || 'to_arrange') && sec === 'visit' && data.date ? 'visited' : undefined);
      return bad || json({ ok: true, missing: shopperMissing(next) });
    }
    if (action === 'shopper_photo') {
      if (((r.photos || []) as any[]).length >= 12) return json({ error: 'full', message: 'Twelve photos is the most. Take one off to add another.' }, 400);
      const path = `${o.id}/${crypto.randomUUID()}.jpg`;
      const { data: up, error } = await db.storage.from(SHOP_BUCKET).createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_failed', message: error?.message }, 500);
      return json({ path, upload_url: up.signedUrl });
    }
    if (action === 'shopper_photo_done') {
      const path = clean(body.path, 200);
      if (!path.startsWith(o.id + '/') || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(path)) return json({ error: 'path' }, 400);
      const kind = PHOTO_KINDS.includes(body.kind) ? body.kind : 'other';
      const photos = ((r.photos || []) as any[]).filter((p) => p.path !== path).concat([{ path, kind, caption: clean(body.caption, 200) || null, at: new Date().toISOString() }]).slice(0, 12);
      const bad = await put({ ...r, photos });
      return bad || json({ ok: true, photos: await signedPhotos({ photos }) });
    }
    if (action === 'shopper_photo_remove') {
      const path = clean(body.path, 200);
      const photos = ((r.photos || []) as any[]).filter((p) => p.path !== path);
      if (photos.length === (r.photos || []).length) return json({ error: 'not_found' }, 404);
      await db.storage.from(SHOP_BUCKET).remove([path]);
      const bad = await put({ ...r, photos });
      return bad || json({ ok: true, photos: await signedPhotos({ photos }) });
    }
    // shopper_send
    const miss = shopperMissing(r);
    if (miss.length) return json({ error: 'missing', missing: miss, message: 'Before sending, add ' + miss.join(', ') + '.' }, 400);
    const now = new Date().toISOString();
    const bad = await put({ ...r, sent_at: now, sent_by: who.member?.id || null }, 'reported');
    if (bad) return bad;
    const place = await shopperPlace(o), link = `${GUIDE_URL}#/audit/shopper/${o.id}`;
    const { data: owner } = await db.from('members').select('email, name').eq('id', o.member_id).maybeSingle();
    if (owner?.email) await mail([owner.email], `${o.test ? '[TEST] ' : ''}Your Secret Shopper report for ${place.name}`,
      para(`Hi ${esc(String(owner.name || '').split(' ')[0] || 'there')},`) +
      para(`Our Secret Shopper visited <strong>${esc(place.name)}</strong> and the report is ready: the welcome, the wait, the menu and how your Vegan dishes are labeled, the food, cleanliness and how well your staff know the menu, with photos.`) +
      para(`Read it here: <a href="${link}">${link}</a>`) +
      para('Want help with what it found? Reply to this email. What you paid counts toward our managed services if you sign up within 30 days of your order.'), SEAN_EMAIL);
    await mail([SEAN_EMAIL], `${o.test ? '[TEST] ' : ''}Secret Shopper report sent: ${place.name}`,
      para(`${esc(who.member?.name || 'The team')} sent the Secret Shopper report for <strong>${esc(place.name)}</strong>.`) +
      para(`Meal spent: <strong>$${Number(r.visit?.spent || 0).toFixed(2)}</strong> (covered up to $40)${((r.photos || []) as any[]).some((p) => p.kind === 'receipt') ? ', receipt photo attached in the report' : ', no receipt photo'}. Reimburse ${esc(who.member?.name || 'the shopper')} (${esc(who.member?.email || '')}).`) +
      para(`The report: <a href="${SITE}/dashboard/secret-shopper#visit/${o.id}">${SITE}/dashboard/secret-shopper#visit/${o.id}</a>`));
    return json({ ok: true, sent_at: now });
  }

  // The signed-in member's audits: what they bought (with the re-check and the Secret Shopper) and their free checks.
  if (action === 'mine') {
    if (!who.member) return json({ orders: [], audits: [] });
    const [{ data: orders }, { data: audits }] = await Promise.all([
      db.from('ve_audit_orders').select('id, tier, status, inputs, audit_id, paid_at, recheck_at, recheck_audit_id, credit_until, shopper_status, created_at')
        .eq('member_id', who.member.id).eq('status', 'paid').order('paid_at', { ascending: false }).limit(20),
      db.from('ve_audits').select('id, tier, status, inputs, created_at').eq('member_id', who.member.id).order('created_at', { ascending: false }).limit(20),
    ]);
    return json({
      orders: (orders || []).map((o: any) => ({ ...o, business: o.inputs?.name || null, inputs: undefined })),
      audits: (audits || []).map((a: any) => ({ id: a.id, tier: a.tier, status: a.status, business: a.inputs?.name || null, created_at: a.created_at })),
    });
  }

  // ---- Monthly check-ups ----
  if (action === 'sweep') {
    if (!who.ops) return json({ error: 'ops_only' }, 403);
    const { data: due } = await db.rpc('ve_audit_sweep_due', { p_limit: Math.max(1, Math.min(+body.limit || 3, 10)) });
    const ids: string[] = [], started: string[] = [];
    for (const d of (due || []) as any[]) {
      const r = await inputsFrom({ listing_slug: d.slug });
      if (r.error) continue;
      const { data: a } = await db.from('ve_audits').insert({ tier: 'full', source: 'checkup', listing_id: r.listing_id, inputs: { ...r.inputs, community: d.community_slug } }).select('id').single();
      if (a) { ids.push(a.id); started.push(d.slug); }
    }
    // The 90-day re-check of a paid audit, a few at a time, with an email to the owner.
    const { data: rechecks } = await db.from('ve_audit_orders').select('id, member_id, listing_id, inputs').eq('status', 'paid').is('recheck_audit_id', null)
      .lte('recheck_at', new Date().toISOString()).limit(3);
    for (const o of (rechecks || []) as any[]) {
      const { data: m } = await db.from('members').select('email, name').eq('id', o.member_id).maybeSingle();
      const { data: a } = await db.from('ve_audits').insert({ tier: 'full', source: 'recheck', listing_id: o.listing_id, inputs: o.inputs, member_id: o.member_id,
        email: m?.email || null, order_id: o.id }).select('id').single();
      if (!a) continue;
      await db.from('ve_audit_orders').update({ recheck_audit_id: a.id }).eq('id', o.id);
      ids.push(a.id); started.push('recheck:' + (o.inputs?.name || o.id));
      const link = `${GUIDE_URL}#/audit/r/${a.id}`;
      if (m?.email) await mail([m.email], `Your 90-day re-check of ${o.inputs?.name || 'your restaurant'}`,
        para(`Hi ${esc(String(m.name || '').split(' ')[0] || 'there')},`) +
        para(`It has been 90 days since your full audit, so we ran it again. See what changed: <a href="${link}">${link}</a>`) +
        para('Questions, or want us to take care of the rest? Just reply.'), SEAN_EMAIL);
    }
    const all = Promise.all(ids.map((id) => runAudit(id)));
    if (body.wait) await all; else (EdgeRuntime as any).waitUntil(all);
    return json({ started });
  }

  if (action === 'flags' || action === 'flag_review') {
    if (!who.ops && !who.member?.admin) return json({ error: 'admins_only' }, 403);
    if (action === 'flag_review') {
      if (!isId(body.audit_id) || !['still_open', 'closed'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
      const { data: a } = await db.from('ve_audits').select('id, listing_id').eq('id', body.audit_id).maybeSingle();
      if (!a?.listing_id) return json({ error: 'not_found' }, 404);
      const { error } = await db.from('ve_audit_flag_reviews').upsert({ audit_id: a.id, listing_id: a.listing_id, decision: body.decision,
        note: clean(body.note, 1000) || null, by_member: who.member?.id || null }, { onConflict: 'audit_id' });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    const { data: flags } = await db.rpc('ve_audit_open_flags');
    const rows = (flags || []) as any[];
    if (!rows.length) return json({ ok: true, flags: [], last_checkup: null });
    const [{ data: ls }, { data: cities }, { data: audits }] = await Promise.all([
      db.from('listings').select('id, name, slug, logo_url, category, address_city, address_state, website, instagram, ig_handle').in('id', rows.map((r) => r.listing_id)),
      db.from('ve_outreach_cities').select('community_slug, name, cities, states').neq('community_slug', 'brands'),
      db.from('ve_audits').select('id, facts').in('id', rows.map((r) => r.audit_id)),
    ]);
    const cityOf = (l: any) => (cities || []).find((c: any) => (!c.cities || c.cities.includes(l.address_city)) && (!c.states || c.states.includes(l.address_state)));
    const out = rows.map((r) => {
      const l = (ls || []).find((x: any) => x.id === r.listing_id) || {};
      const c = cityOf(l);
      const f = (audits || []).find((x: any) => x.id === r.audit_id)?.facts || {};
      return { audit_id: r.audit_id, listing_id: r.listing_id, level: r.closure_level, signals: r.closure_signals || [], audited_at: r.audited_at,
        city: c?.community_slug || null, city_name: c?.name || null,
        listing: { name: l.name, slug: l.slug, logo_url: l.logo_url, category: l.category, address_city: l.address_city },
        maps: f.google?.maps || null, website: f.website?.url || l.website || null, instagram: f.instagram?.username || l.ig_handle || null };
    }).filter((r) => !body.city || r.city === body.city)
      .sort((a, b) => (a.level === b.level ? b.signals.length - a.signals.length : a.level === 'closed' ? -1 : 1));
    return json({ ok: true, flags: out });
  }

  return json({ error: 'unknown_action' }, 400);
});
