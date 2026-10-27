// ve-menu-reader: the menus the Background writer could not read as text (Sean, 2026-10-27: "I would like to see each restaurant
// listing have a menu... build the menu reader"). The writer (dispatcher source menu_import) reads a business's own site as text
// and saves "none" when the menu is a picture, a PDF or an ordering page that only loads in a browser. This reads those the way
// a person would: their home page and menu pages, their own ordering page (Toast, Square, Clover, ChowNow...) opened in a real
// browser (Apify's rag-web-browser, APIFY_API_TOKEN), the menu's pictures and PDFs, and any menu data the page carries (the
// schema.org Menu, an ordering app's state). All of it goes to Claude (structured output), which copies the menu word for word
// and never guesses. A Vegan place keeps its whole menu; a place with Vegan options keeps only what the menu marks Vegan.
// Saved through ve_menu_import_save (source import), which refuses a listing that already has a menu.
// Instagram (Sean, 2026-10-27: "try reading the Instagram menus"): when their site gives no menu, the reader looks at their
// Instagram (Apify's instagram-profile-scraper: the latest posts, pinned ones first, carousels included) and Claude copies a menu
// posted there as a picture or a caption. A place already read once gets this second look by itself (ig_at marks it).
//
// POST { action: 'read', listing_id | slug, save?: true }  read one in the background (save false keeps what it read in
//                                                        ve_menu_imports.reader_preview and saves nothing)
// POST { action: 'sweep', limit?: 1 }                    the next ve_menu_imports rows at 'none' the reader has not tried
//                                                        (cron ve-menu-reader, one every 10 minutes, in the background)
// POST { action: 'probe', url }                           what a page gives us (status, length, pictures, PDFs, links, menu data)
// Callers: a super admin (VE token), the LESARUSS_ADMIN_TOKEN, or the cron's x-cron-secret. verify_jwt is false.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
async function allowed(req: Request): Promise<boolean> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); return !!cs && cron === cs; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token === ops) return true;
  const id = await verifyToken(token);
  if (!id) return false;
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return !!m?.is_superadmin;
}

// ---- Reading their site ----
// Ordering pages the business runs itself count as its own menu; marketplaces (DoorDash, Uber Eats, Grubhub, Yelp) never do.
const ORDER_HOSTS = /(^|\.)(toasttab\.com|square\.site|squareup\.com|clover\.com|chownow\.com|getsauce\.com|order\.online|menufy\.com|popmenu\.com|bentobox\.com|spoton\.com|owner\.com|cash\.app|olo\.com|orderonlinemenu\.com|beyondmenu\.com|menusifu\.com|gloriafood\.com|foodbooking\.com|ordering\.app|shopify\.com|myshopify\.com)$/i;
const MARKETPLACE = /(^|\.)(doordash\.com|ubereats\.com|grubhub\.com|yelp\.com|seamless\.com|postmates\.com|google\.com|facebook\.com|instagram\.com|tripadvisor\.com|happycow\.net|vegansexplore\.com)$/i;
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const textOf = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const abs = (u: string, base: string) => { try { return new URL(decode(u.trim()), base).href.split('#')[0]; } catch { return ''; } };

async function fetchPage(url: string) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(15000) });
      const type = r.headers.get('content-type') || '';
      if (!r.ok) { if (i === 0 && [403, 429, 503].includes(r.status)) continue; return { url, final: r.url || url, status: r.status, type, html: '' }; }
      if (!/html|text/i.test(type)) return { url, final: r.url || url, status: r.status, type, html: '' };
      return { url, final: r.url || url, status: r.status, type, html: (await r.text()).slice(0, 2_000_000) };
    } catch (e) { if (i === 1) return { url, final: url, status: 0, type: '', html: '', error: String((e as Error).message || e).slice(0, 120) }; }
  }
  return { url, final: url, status: 0, type: '', html: '' };
}
// A page that builds itself in the browser (ordering apps, script-only sites), opened in a real browser.
async function rendered(url: string, wait = 8): Promise<{ url: string; text: string; error?: string }> {
  const token = await secret('APIFY_API_TOKEN');
  if (!token) return { url, text: '', error: 'no Apify key' };
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items?token=${token}&timeout=55`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(65000),
      body: JSON.stringify({ query: url, maxResults: 1, outputFormats: ['markdown'], scrapingTool: 'browser-playwright', requestTimeoutSecs: 45, dynamicContentWaitSecs: wait, removeCookieWarnings: true }),
    });
    if (!r.ok) return { url, text: '', error: `browser answered ${r.status}` };
    const d = ((await r.json()) as any[])[0] || {};
    return { url: d?.metadata?.url || url, text: String(d.markdown || d.text || '').slice(0, 40000) };
  } catch (e) { return { url, text: '', error: String((e as Error).message || e).slice(0, 120) }; }
}

// Menu data a page carries: schema.org Menu (ld+json) and an app's state (__NEXT_DATA__, window.__X__ = {...}). Any object with
// a name and a price becomes one line.
function menuData(html: string): string[] {
  const blobs: string[] = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)) blobs.push(m[1]);
  for (const m of html.matchAll(/<script[^>]*>\s*(?:window\.)?[\w$.]+\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/gi)) blobs.push(m[1]);
  const lines: string[] = [], seen = new Set<string>();
  const price = (o: any): string => {
    for (const k of ['price', 'displayPrice', 'formattedPrice', 'basePrice', 'price_display', 'priceString']) {
      const v = o?.[k];
      if (typeof v === 'number' || (typeof v === 'string' && /\d/.test(v))) return String(v);
      if (v && typeof v === 'object' && (v.amount != null || v.formatted)) return String(v.formatted || v.amount);
    }
    if (o?.offers) { const of = Array.isArray(o.offers) ? o.offers[0] : o.offers; if (of?.price != null) return String(of.price); }
    if (o?.price_money?.amount != null) return '$' + (o.price_money.amount / 100).toFixed(2);
    return '';
  };
  const walk = (o: any, section: string, depth: number) => {
    if (!o || typeof o !== 'object' || depth > 14 || lines.length > 500) return;
    if (Array.isArray(o)) { o.forEach((x) => walk(x, section, depth + 1)); return; }
    const name = typeof o.name === 'string' ? o.name : typeof o.title === 'string' ? o.title : '';
    const p = name ? price(o) : '';
    if (name && p) {
      const line = [section, name, p, typeof o.description === 'string' ? o.description.slice(0, 200) : ''].filter(Boolean).join(' | ');
      if (!seen.has(line)) { seen.add(line); lines.push(line); }
    }
    const sec = name && !p && (o.items || o.menuItems || o.hasMenuItem || o.hasMenuSection || o.products) ? name : section;
    for (const k in o) if (o[k] && typeof o[k] === 'object') walk(o[k], sec, depth + 1);
  };
  for (const b of blobs) { try { walk(JSON.parse(b), '', 0); } catch { /* not JSON */ } }
  return lines.slice(0, 500);
}
// Square Online (editmysite) keeps its products behind a public store API; the page names the user and site.
async function squareProducts(html: string): Promise<string[]> {
  const u = (html.match(/"user_?[iI]d"\s*:\s*"?(\d{4,})/) || [])[1], s = (html.match(/"site_?[iI]d"\s*:\s*"?(\d{6,})/) || [])[1];
  if (!u || !s) return [];
  try {
    const r = await fetch(`https://cdn5.editmysite.com/app/store/api/v28/editor/users/${u}/sites/${s}/products?per_page=200&include=categories`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return [];
    const d: any = await r.json();
    return ((d?.data || []) as any[]).map((p) => {
      const cat = p?.categories?.data?.[0]?.name || '';
      const pr = p?.price?.low_formatted || p?.price?.regular_low_formatted || (p?.price?.low != null ? '$' + p.price.low : '');
      return [cat, p?.name, pr, String(p?.short_description || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 200)].filter(Boolean).join(' | ');
    }).filter(Boolean).slice(0, 300);
  } catch { return []; }
}
function linksOf(html: string, base: string) {
  const out: { url: string; text: string }[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = abs(m[1], base); if (!/^https?:/i.test(url)) continue;
    out.push({ url, text: textOf(m[2]).slice(0, 60) });
  }
  return out;
}
function picturesOf(html: string, base: string, menuPage: boolean) {
  const found: { url: string; score: number }[] = [];
  const add = (u: string, ctx: string) => {
    const url = abs(u, base); if (!/^https?:/i.test(url) || /\.svg(\?|$)|logo|favicon|icon|sprite|avatar|pixel|badge|payment|apple-touch/i.test(url)) return;
    let score = (/menu/i.test(url) || /menu/i.test(ctx) ? 4 : 0) + (menuPage ? 1 : 0);
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || /wixstatic|squarespace-cdn|cloudfront|googleusercontent|shopify|images/i.test(url)) score += 1;
    if (score >= 2) found.push({ url, score });
  };
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const srcset = (tag.match(/(?:data-)?srcset=["']([^"']+)["']/i) || [])[1];
    const best = srcset ? srcset.split(',').map((x) => x.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || '0') - parseInt(a[1] || '0'))[0]?.[0] : '';
    const src = best || (tag.match(/(?:data-src|data-lazy-src|data-image|src)=["']([^"']+)["']/i) || [])[1];
    if (src) add(src, (tag.match(/alt=["']([^"']*)["']/i) || [])[1] || tag);
  }
  for (const m of html.matchAll(/href=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi)) add(m[1], 'link');
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+\.(?:jpe?g|png|webp)[^'")]*)['"]?\s*\)/gi)) add(m[1], 'background');
  const seen = new Set<string>();
  return found.sort((a, b) => b.score - a.score).filter((x) => { const k = x.url.split('?')[0]; if (seen.has(k)) return false; seen.add(k); return true; }).map((x) => x.url);
}
const pdfsOf = (html: string, base: string) => [...new Set([...html.matchAll(/href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi)].map((m) => abs(m[1], base)).filter((u) => /^https?:/.test(u)))];
// Image hosts that resize on the fly: ask for the original (Wix's resized copies come back as AVIF, which the model cannot read).
const original = (u: string) => u.replace(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)\/v1\/.*$/i, '$1')
  .replace(/^(https:\/\/images\.squarespace-cdn\.com\/[^?]+)(\?.*)?$/i, '$1?format=1500w');
async function fetchFile(url: string, kind: 'image' | 'pdf') {
  url = kind === 'image' ? original(url) : url;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: kind === 'pdf' ? 'application/pdf,*/*' : 'image/*,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    let type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (kind === 'pdf') { if (!(type === 'application/pdf' || (bytes[0] === 0x25 && bytes[1] === 0x50)) || bytes.length > 25_000_000) return null; type = 'application/pdf'; }
    else {
      if (type === 'image/jpg') type = 'image/jpeg';
      if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
      if (bytes.length < 25_000 || bytes.length > 4_800_000) return null; // icons, or too big for the model
    }
    return { url, type, data: encodeBase64(bytes), size: bytes.length };
  } catch { return null; }
}

type Source = { kind: 'text' | 'image' | 'pdf'; url: string; text?: string; type?: string; data?: string };
async function gather(website: string, deadline: number, menuUrl = '') {
  const read: string[] = [], sources: Source[] = [];
  const home = await fetchPage(website);
  if (!home.html) { read.push(`${website}: ${home.status ? 'answered ' + home.status : home.error || 'did not open'}`); }
  const base = home.final || website;
  const own = hostOf(base);
  // The pages to read: the home page, then menu and ordering links (from the page, or from it opened in a browser), best first.
  const score = (url: string, text: string) => {
    const h = hostOf(url), t = (text + ' ' + url).toLowerCase();
    if (!/^https?:/i.test(url) || MARKETPLACE.test(h) || /\.(pdf|jpe?g|png|webp|gif)(\?|$)/i.test(url)) return 0;
    if (!(h === own || h.endsWith('.' + own) || ORDER_HOSTS.test(h))) return 0;
    return (/menu/.test(t) ? 5 : 0) + (/order/.test(t) ? 3 : 0) + (ORDER_HOSTS.test(h) && h !== own ? 4 : 0) + (/food|eat|drink|brunch|lunch|dinner|bakery|treats|flavors|catering|shop/.test(t) ? 1 : 0);
  };
  const cand = new Map<string, number>(), done = new Set<string>();
  const offer = (url: string, text: string, bonus = 0) => {
    const u = url.split('#')[0], sc = score(u, text);
    if (sc > 0 && !done.has(u)) cand.set(u, Math.max(cand.get(u) || 0, sc + bonus));
  };
  // A menu link the team gave (Directory review) is read first, wherever it is, unless it is a marketplace.
  if (/^https?:\/\//i.test(menuUrl) && !MARKETPLACE.test(hostOf(menuUrl)) && menuUrl !== base) cand.set(menuUrl.split('#')[0], 100);
  // Square Online keeps its menu at /s/order.
  const squareOrder = (u: string) => { const h = hostOf(u); if (/\.square\.site$/.test(h)) offer(new URL(u).origin + '/s/order', 'order menu', 3); };
  const pics: string[] = [], pdfs: string[] = [];
  let renders = 0, url: string | undefined = base;
  while (url && done.size < 5 && Date.now() < deadline - 120000) {
    done.add(url); cand.delete(url);
    const p = url === base ? home : await fetchPage(url);
    const at = p.final || url, h = hostOf(at), menuPage = url !== base || /menu/i.test(url);
    if (p.html || url === base || ORDER_HOSTS.test(h)) {
      let text = p.html ? textOf(p.html) : '';
      const data = p.html ? menuData(p.html) : [];
      if (p.html && /editmysite|square\.site|squareup/i.test(p.html + h)) data.push(...(await squareProducts(p.html)));
      if (p.html) { for (const l of linksOf(p.html, at)) offer(l.url, l.text); pics.push(...picturesOf(p.html, at, menuPage)); pdfs.push(...pdfsOf(p.html, at)); }
      squareOrder(at);
      // Script-only pages and ordering apps: open them in a real browser (three a listing). Its links and pictures count too.
      // The home page is opened in a browser only when it links to no menu or order page (that saves a load for them).
      const homeHasLinks = url === base && p.html && [...cand.values()].some((v) => v >= 3);
      if (!homeHasLinks && (text.length < 800 || ORDER_HOSTS.test(h) || (!p.html && p.status !== 404)) && renders < 3 && Date.now() < deadline - 150000 && (p.html || url !== base || ORDER_HOSTS.test(own) || p.status === 403)) {
        renders++;
        // Ordering apps fill their menu in late, so they get a longer wait.
        const rr = await rendered(at, ORDER_HOSTS.test(h) ? 20 : 8);
        if (rr.text.length > text.length) { text = rr.text; read.push(`${rr.url} (opened in a browser)`); }
        else read.push(`${at}: ${rr.error ? 'the browser could not open it (' + rr.error + ')' : 'nothing came back (it may block automated browsers)'}`);
        for (const m of rr.text.matchAll(/!\[([^\]]*)\]\((https?:[^)\s]+)/g)) if (!/logo|icon|favicon|\.svg/i.test(m[2]) && (menuPage || /menu/i.test(m[1] + m[2]))) pics.unshift(m[2]);
        for (const m of rr.text.matchAll(/(?<!!)\[([^\]]{0,60})\]\((https?:[^)\s]+)/g)) { offer(m[2], m[1]); if (/\.pdf(\?|$)/i.test(m[2])) pdfs.push(m[2]); }
      } else if (p.html) read.push(at);
      if (text.length > 80 || data.length) sources.push({ kind: 'text', url: at, text: (data.length ? 'Menu data on the page:\n' + data.join('\n') + '\n\nThe page:\n' : '') + text.slice(0, data.length ? 15000 : 25000) });
    }
    if (sources.reduce((n, s) => n + (s.text?.length || 0), 0) > 80000) break;
    url = [...cand.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }
  // The model takes up to 32 MB a request; files go in base64 (a third larger), so 18 MB of files at most.
  let budget = 18_000_000;
  // The menu's own files: PDFs first (a menu PDF says menu, or sits on a menu page), then its pictures.
  for (const u of [...new Set(pdfs)].sort((a, b) => (/menu/i.test(b) ? 1 : 0) - (/menu/i.test(a) ? 1 : 0)).slice(0, 2)) {
    const f = await fetchFile(u, 'pdf');
    if (f && f.size < 10_000_000 && budget - f.size > 0) { budget -= f.size; sources.push({ kind: 'pdf', url: u, type: f.type, data: f.data }); read.push(`${u} (PDF)`); }
  }
  let n = 0;
  for (const u of [...new Set(pics)].slice(0, 14)) {
    if (n >= 8) break;
    const f = await fetchFile(u, 'image');
    if (f && budget - f.size > 0) { budget -= f.size; sources.push({ kind: 'image', url: u, type: f.type, data: f.data }); n++; }
  }
  if (n) read.push(`${n} picture${n === 1 ? '' : 's'} from their pages`);
  return { read, sources, base };
}

// ---- Their Instagram: the latest posts, pinned first ----
const igHandle = (v: string) => { const m = String(v || '').trim().match(/^@?([\w.]{2,30})$|instagram\.com\/([\w.]{2,30})/i); const h = m ? (m[1] || m[2]) : ''; return /^(p|reel|reels|stories|explore|tv)$/i.test(h) ? '' : h.toLowerCase(); };
async function instagramSources(handle: string, budget: number) {
  const read: string[] = [], sources: Source[] = [];
  const token = await secret('APIFY_API_TOKEN');
  if (!token) return { read: ['Instagram: no Apify key'], sources };
  let p: any;
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [handle] }), signal: AbortSignal.timeout(100000) });
    if (!r.ok) return { read: [`Instagram @${handle}: the reader answered ${r.status}`], sources };
    p = ((await r.json()) as any[])[0];
  } catch (e) { return { read: [`Instagram @${handle}: ${String((e as Error).message || e).slice(0, 100)}`], sources }; }
  if (!p || p.error) return { read: [`Instagram @${handle}: ${p?.error === 'not_found' ? 'not found' : 'no answer'}`], sources };
  // A post that says menu or shows prices first, then pinned posts, then the rest by date.
  const posts = ((p.latestPosts || []) as any[]).filter((x) => x && x.type !== 'Video');
  const rank = (x: any) => (/menu|price|\$\s?\d/i.test(x.caption || '') ? 4 : 0) + (x.isPinned ? 2 : 0);
  posts.sort((a, b) => rank(b) - rank(a) || String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
  const captions = posts.slice(0, 12).map((x) => `${x.url || ''} (${String(x.timestamp || '').slice(0, 10)}${x.isPinned ? ', pinned' : ''}): ${String(x.caption || '').slice(0, 1500)}`);
  if (p.biography || captions.length) sources.push({ kind: 'text', url: `https://www.instagram.com/${handle}/`, text: `Their Instagram bio: ${String(p.biography || '').slice(0, 600)}\n\nTheir latest posts (link, date: caption):\n` + captions.join('\n\n') });
  let n = 0;
  for (const x of posts.slice(0, 8)) {
    const imgs = [...new Set([...(x.images || []), x.displayUrl].filter(Boolean))].slice(0, x.isPinned || rank(x) >= 4 ? 4 : 1);
    for (const u of imgs) {
      if (n >= 10) break;
      const f = await fetchFile(u, 'image');
      if (f && budget - f.size > 0) { budget -= f.size; sources.push({ kind: 'image', url: x.url || u, type: f.type, data: f.data }); n++; }
    }
  }
  read.push(`Instagram @${handle}: ${posts.length} posts, ${n} picture${n === 1 ? '' : 's'}`);
  return { read, sources };
}

// ---- Claude copies the menu ----
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['found', 'own_business', 'source', 'note', 'items'],
  properties: {
    found: { type: 'boolean', description: 'True only when the sources show this business\'s own menu with its items.' },
    own_business: { type: 'boolean', description: 'False when the site is plainly another business, a parked domain or a template.' },
    source: { type: 'string', description: 'The URL (from the sources) where the menu was read: the page, the PDF or the picture.' },
    note: { type: 'string', description: 'One short sentence for the team: where the menu came from, or why there is none. No dashes.' },
    items: {
      type: 'array', description: 'Every item in the order the menu shows it, at most 300.',
      items: {
        type: 'object', additionalProperties: false, required: ['category', 'name', 'description', 'price_display', 'is_gluten_free', 'marked_vegan'],
        properties: {
          category: { type: 'string', description: 'The section as they name it (Bowls, Smoothies...). "Menu" if there are no sections.' },
          name: { type: 'string' },
          description: { type: 'string', description: 'As written, or empty.' },
          price_display: { type: 'string', description: 'Exactly as written ($14, $12 / $16, MP), or empty when no price is shown.' },
          is_gluten_free: { type: 'boolean', description: 'Only when the menu says gluten free.' },
          marked_vegan: { type: 'boolean', description: 'The menu marks this item (or its whole section) Vegan or plant-based.' },
        },
      },
    },
  },
};
const SYSTEM = `You copy restaurant menus for the Vegans Explore Directory, word for word, from what the business itself publishes.
You get the text of their pages (some opened in a browser), menu data found on the pages, and pictures and PDFs from their site.
- Copy only what the sources show. Never invent, guess, translate or improve an item, a description or a price. If a price is not shown, leave it empty.
- A menu photo or PDF: read every item and its price as printed, keeping each price with its own item. If a picture is not a menu (food photos, the storefront), ignore it.
- An ordering page is their menu: copy its items, sections and prices.
- Leave out add-ons, modifiers, sauces on the side, gift cards, merchandise and catering trays unless that is all they sell. Keep juices, smoothies, coffee and teas; leave out a drinks list that is only sodas and water.
- found is false when there is no menu with items in the sources: an empty page, a site that is down, a different business, or pictures you cannot read. Say why in the note.
- From Instagram: copy a menu only when a picture or a caption shows one (a menu board, a printed menu, a list of items). A photo of one dish is not a menu. When posts show different menus, take the newest, and put the post's link as the source.
- Spell Vegan with a capital V. No em dashes or en dashes in anything you write.`;

async function readMenu(l: any, menuUrl = '', onlyInstagram = false) {
  // The background run has about 400 s: the site first, then (when it gives no menu) their Instagram.
  const ig = igHandle(l.instagram || '');
  let first: any = null;
  if (!onlyInstagram && (l.website || menuUrl)) {
    const g = await gather(l.website || menuUrl, Date.now() + (ig ? 190000 : 330000), menuUrl);
    first = g.sources.length ? await ask(l, g.sources, g.read, g.base) : { ok: false, why: 'nothing_read', read: g.read, note: 'Nothing on their site could be read' };
    if ((first.ok && first.found) || !ig) return first;
  }
  if (!ig) return first || { ok: false, why: 'no_source', read: [], note: 'No website or Instagram to read' };
  const g2 = await instagramSources(ig, 16_000_000);
  const read = [...(first?.read || []), ...g2.read];
  if (!g2.sources.length) return { ...(first || { ok: false, why: 'nothing_read' }), read, ig: true };
  const r2: any = await ask(l, g2.sources, read, `https://www.instagram.com/${ig}/`, true);
  if (r2.ok && r2.found) return { ...r2, ig: true };
  // Neither had a menu: say what each found.
  return { ...r2, ig: true, note: [first?.note, r2.note ? 'Instagram: ' + r2.note : ''].filter(Boolean).join(' ').slice(0, 280) };
}
async function ask(l: any, sources: Source[], readList: string[], base: string, fromInstagram = false) {
  const g = { sources, read: readList, base };
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { ok: false, why: 'no_model_key', read: g.read };
  const content: any[] = [{ type: 'text', text: `The business: ${l.name}${l.address_city ? ', ' + l.address_city : ''} (${l.category}). ${fromInstagram ? 'These are from their Instagram.' : 'Their website: ' + l.website + '.'}` }];
  for (const s of g.sources) {
    if (s.kind === 'text') content.push({ type: 'text', text: `Source ${s.url}:\n${s.text}` });
    else {
      content.push({ type: 'text', text: `Source ${s.url} (${s.kind === 'pdf' ? 'PDF' : 'picture'}):` });
      content.push(s.kind === 'pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: s.data } } : { type: 'image', source: { type: 'base64', media_type: s.type, data: s.data } });
    }
  }
  content.push({ type: 'text', text: `Copy ${l.name}'s menu.` });
  let out: any;
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM, messages: [{ role: 'user', content }],
    } as any);
    if (res.stop_reason === 'refusal') return { ok: false, why: 'refused', read: g.read };
    out = JSON.parse((res.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''));
  } catch (e) {
    return { ok: false, why: e instanceof Anthropic.RateLimitError ? 'busy' : String((e as Error).message || e).slice(0, 200), read: g.read };
  }
  const all = (out.items || []).filter((it: any) => String(it.name || '').trim()).slice(0, 300);
  // A Vegan place keeps its whole menu; any other keeps only what its menu marks Vegan (every saved item shows as Vegan).
  const fully = l.vegan_status === 'fully_vegan';
  const items = (fully ? all : all.filter((it: any) => it.marked_vegan)).map((it: any) => ({
    category: it.category || 'Menu', name: it.name, description: it.description || '', price_display: it.price_display || '', is_gluten_free: !!it.is_gluten_free,
  }));
  let note = String(out.note || '').replace(/[–—]/g, ',').slice(0, 280);
  if (out.found && all.length && !items.length) note = 'Their menu marks nothing Vegan, so nothing was copied';
  const sourceUrl = /^https?:\/\//.test(out.source || '') ? out.source : g.base;
  return { ok: true, found: !!out.found && out.own_business !== false && items.length > 0, items, all: all.length, note, source: sourceUrl, read: g.read };
}

async function runOne(listingId: string, save: boolean, onlyInstagram = false) {
  const { data: l } = await db.from('listings').select('id, slug, name, website, instagram, category, vegan_status, address_city, status, menu_crawl_url').eq('id', listingId).maybeSingle();
  if (!l || l.status !== 'approved') return { ok: false, why: 'not_found' };
  const { data: qi } = await db.from('ve_menu_imports').select('menu_url').eq('listing_id', l.id).maybeSingle();
  const menuUrl = qi?.menu_url || l.menu_crawl_url || '';
  if (!/^https?:\/\//i.test(l.website || '') && !/^https?:\/\//i.test(menuUrl) && !igHandle(l.instagram || '')) return { ok: false, why: 'no_website' };
  const { count } = await db.from('ve_menu_items').select('id', { count: 'exact', head: true }).eq('listing_id', l.id);
  if (count) return { ok: false, why: 'has_menu' };
  const r: any = await readMenu(l, menuUrl, onlyInstagram);
  const result: any = { slug: l.slug, name: l.name, ...r };
  if (!save) { await db.from('ve_menu_imports').update({ reader_preview: result }).eq('listing_id', l.id); return result; }
  await db.from('ve_menu_imports').upsert({ listing_id: l.id, status: 'none' }, { onConflict: 'listing_id', ignoreDuplicates: true });
  if (r.ok && r.found) {
    const { data: s, error } = await db.rpc('ve_menu_import_save', { p_listing: l.id, p_items: r.items, p_menu_url: r.source, p_note: ('Read by the menu reader' + (r.ig ? ' from Instagram. ' : '. ') + (r.note || '')).slice(0, 300) });
    result.saved = error ? { ok: false, why: error.message } : s;
  }
  await db.from('ve_menu_imports').update({
    reader_at: new Date().toISOString(), reader_note: (r.ok && r.found ? `Copied ${r.items.length} items` : r.note || r.why || 'No menu found').slice(0, 300),
    reader_read: r.read || [], ...(r.ig ? { ig_at: new Date().toISOString() } : {}),
  }).eq('listing_id', l.id);
  delete result.items; result.items = r.items?.length || 0;
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await allowed(req))) return json({ error: 'not_allowed' }, 403);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  if (body.action === 'get') { // diagnostics: the first part of any URL, as the reader sees it
    try { const r = await fetch(String(body.url || ''), { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(15000) }); return json({ status: r.status, type: r.headers.get('content-type'), body: (await r.text()).slice(0, 3000) }); }
    catch (e) { return json({ error: String((e as Error).message || e) }); }
  }
  if (body.action === 'probe') {
    const p = await fetchPage(String(body.url || ''));
    const base = p.final || body.url;
    return json({ ok: true, status: p.status, final: p.final, type: p.type, length: p.html.length, text: textOf(p.html).slice(0, 1500),
      data: menuData(p.html).slice(0, 30), square: /editmysite|square/i.test(p.html) ? (await squareProducts(p.html)).slice(0, 10) : [],
      ids: [...p.html.matchAll(/"(\w*(?:site|user|owner|store|location)_?[iI]d)"\s*:\s*"?([\w-]{4,})/g)].slice(0, 25).map((m) => m[1] + '=' + m[2]),
      pictures: picturesOf(p.html, base, true).slice(0, 12), pdfs: pdfsOf(p.html, base), links: linksOf(p.html, base).filter((l) => /menu|order/i.test(l.text + l.url)).slice(0, 15),
      rendered: body.render ? await rendered(base) : undefined });
  }
  if (body.action === 'read') {
    let id = String(body.listing_id || '');
    if (!id && body.slug) { const { data } = await db.from('listings').select('id').eq('slug', String(body.slug)).eq('status', 'approved').maybeSingle(); id = data?.id || ''; }
    if (!id) return json({ error: 'not_found' }, 404);
    // A read takes longer than a request may wait (150 s), so it runs in the background; the result lands on its
    // ve_menu_imports row (reader_note and reader_read, or reader_preview for save: false).
    (EdgeRuntime as any).waitUntil(runOne(id, body.save !== false, body.instagram === true).catch(async (e) => {
      await db.from('ve_menu_imports').update({ reader_note: 'Failed: ' + String((e as Error).message || e).slice(0, 200) }).eq('listing_id', id);
    }));
    return json({ ok: true, started: id });
  }
  if (body.action === 'sweep') {
    const limit = Math.min(Math.max(+body.limit || 1, 1), 2);
    // Most voted first.
    const { data: rows } = await db.from('ve_menu_imports').select('listing_id, listings!inner(status, vote_count)').eq('status', 'none').is('reader_at', null).eq('listings.status', 'approved').limit(500);
    let ids = ((rows || []) as any[]).sort((x, y) => (y.listings?.vote_count || 0) - (x.listings?.vote_count || 0)).slice(0, limit).map((r) => r.listing_id);
    // Nothing new: a place the reader tried before the Instagram pass gets its Instagram look (ig_at null, has an Instagram).
    let igOnly = false;
    if (!ids.length) {
      const { data: again } = await db.from('ve_menu_imports').select('listing_id, reader_note, listings!inner(status, vote_count, instagram)').eq('status', 'none').not('reader_at', 'is', null).is('ig_at', null)
        .eq('listings.status', 'approved').neq('listings.instagram', '').not('listings.instagram', 'is', null).limit(500);
      ids = ((again || []) as any[]).filter((r) => r.reader_note !== 'Reading').sort((x, y) => (y.listings?.vote_count || 0) - (x.listings?.vote_count || 0)).slice(0, limit).map((r) => r.listing_id);
      igOnly = ids.length > 0;
    }
    // Mark them first so a second run does not take the same ones.
    if (ids.length) await db.from('ve_menu_imports').update({ reader_at: new Date().toISOString(), reader_note: 'Reading', ...(igOnly ? { ig_at: new Date().toISOString() } : {}) }).in('listing_id', ids);
    const work = (async () => { for (const id of ids) { try { await runOne(id, true, igOnly); } catch (e) { await db.from('ve_menu_imports').update({ reader_note: 'Failed: ' + String((e as Error).message || e).slice(0, 200) }).eq('listing_id', id); } } })();
    (EdgeRuntime as any).waitUntil(work);
    return json({ ok: true, started: ids.length });
  }
  return json({ error: 'unknown_action' }, 400);
});
