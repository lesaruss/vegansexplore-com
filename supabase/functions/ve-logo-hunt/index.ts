// ve-logo-hunt: find a listing's logo the way Sean does (Sean, 2026-11-07: "if they have a logo, it's either on their website,
// it's on Google, or I use Facebook... Instagram... In a pinch"). Playbook ve-community-directory.
//
// For each listing: 1. read its website (the logo in the header, pictures named or labelled logo, app icon, share picture) and
// the Instagram and Facebook it links to; 2. Google Images for "<name> <city> logo"; 3. its Facebook page's profile picture;
// 4. its Instagram profile picture. Every candidate is copied into our storage (media/logo-hunt/<run>/), then Claude picks the
// business's own clean logo and says which other pictures show the same logo. Found in two kinds of place (website and Facebook,
// say) and sure of it = 'auto'; one place = 'review'; nothing = 'none'. Rows in ve_logo_hunts. Nothing is put on a listing here.
//
// POST { action: 'start', listing_ids: [...], run_id? }   ops   -> { run_id }   works in the background, 10 listings a batch
// POST { action: 'status', run_id }                        ops   -> { counts, rows }
// POST { action: 'export', run_id }                        ops   -> { url }   the run as media/logo-hunt/<run>/report.json
// Ops is the LESARUSS_ADMIN_TOKEN, sent as x-ops-token (verify_jwt is on, so Authorization carries the anon key). Sources: Apify (hooli/google-images-scraper, apify/facebook-pages-scraper,
// apify/instagram-profile-scraper) on APIFY_API_TOKEN; Claude on ANTHROPIC_API_KEY. No Google API calls (no Places spend).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
async function fetchWithin(url: string, ms: number, accept = 'text/html,*/*') {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': BROWSER_UA, Accept: accept } }); }
  finally { clearTimeout(t); }
}
function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1], u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (i: number) => b[i] | (b[i + 1] << 8), le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { w: u32(16), h: u32(20) };
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { w: le16(6), h: le16(8) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: u16(i + 7), h: u16(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (b.length > 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const f = String.fromCharCode(...b.slice(12, 16));
    if (f === 'VP8 ') return { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    if (f === 'VP8L') { const x = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (f === 'VP8X') return { w: le24(24) + 1, h: le24(27) + 1 };
  }
  return null;
}
const typeOf = (b: Uint8Array) => b[0] === 0x89 ? 'image/png' : b[0] === 0xff ? 'image/jpeg' : b[0] === 0x47 ? 'image/gif' : 'image/webp';
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
async function readImage(url: string): Promise<{ bytes: Uint8Array; type: string; w: number; h: number } | null> {
  try {
    let buf: Uint8Array;
    const d = url.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
    if (d) { const bin = atob(d[2]); buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); }
    else { const r = await fetchWithin(url, 10000, 'image/*'); if (!r.ok) return null; buf = new Uint8Array(await r.arrayBuffer()); }
    if (buf.length > 4.5 * 1024 * 1024 || buf.length < 200) return null;
    const size = imageSize(buf); if (!size) return null;
    return { bytes: buf, type: typeOf(buf), ...size };
  } catch { return null; }
}

// ---- Words and names ----
const STOP = new Set(['the', 'and', 'cafe', 'restaurant', 'kitchen', 'vegan', 'llc', 'inc', 'co', 'bar', 'grill', 'eatery', 'food', 'foods', 'plant', 'based', 'company', 'rescue', 'sanctuary', 'animal', 'animals']);
const words = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const baseName = (n: string) => String(n || '').split(/\s+[-|@–]\s+|\s*\(/)[0].trim();

// ---- Socials from a website (the same rules as ve-discover) ----
const TEMPLATE_HANDLES = new Set(['wix', 'wixcom', 'squarespace', 'godaddy', 'shopify', 'wordpress', 'wordpressdotcom', 'weebly', 'webflow', 'toasttab', 'facebook', 'instagram', 'tiktok', 'meta', 'business', 'yourbusiness', 'username',
  // Facebook's and Instagram's own pages (Sean, 2026-11-08: 16 listings held facebook.com/docs from a site's footer, 5 facebook.com/login).
  'docs', 'login', 'help', 'policies', 'privacy', 'legal', 'terms', 'accounts', 'developer', 'developers', 'direct', 'facebookcom', 'wwwfacebookcom', 'instagramcom', 'wwwinstagramcom', '2008', 'rsrcphp', 'static', 'embed', 'plugins', 'sharer']);
function socialOf(u: string, kind: 'ig' | 'fb') {
  let h = '';
  if (kind === 'ig') { const m = u.match(/(?<![a-z0-9-])instagram\.com\/([A-Za-z0-9._]+)/i); h = m && !['p', 'reel', 'reels', 'explore', 'stories'].includes(m[1].toLowerCase()) ? m[1].toLowerCase() : ''; }
  else {
    const parts = u.replace(/^https?:\/\/(?:[a-z]+\.)?facebook\.com\//i, '').split(/[/?#]/).filter(Boolean);
    h = !parts.length || /^(profile\.php|people|groups|events|share|sharer|dialog|plugins|tr|watch|photo|photos)/i.test(parts[0]) ? '' : parts[0] === 'pages' ? (parts[1] && parts[2] ? `pages/${parts[1]}/${parts[2]}` : '') : parts[0].toLowerCase();
  }
  return h && !TEMPLATE_HANDLES.has(h.replace(/[._-]/g, '')) ? h : '';
}
const handleOf = (v: string) => { const m = String(v || '').trim().match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]{2,30})\/?$/); return m ? m[1].toLowerCase() : ''; };

type Cand = { url: string; source: 'website' | 'google' | 'facebook' | 'instagram'; label: string };

// The website, read better than the old sweep: any <img> that says logo, the pictures in the header and nav, pictures whose alt
// text is the business's name, logo background images, then the app icon and share picture.
// A site that turns automated visitors away (403, 429, a challenge page) or draws itself with scripts is opened in a real browser
// (Apify's rag-web-browser, as ve-menu-reader does) and the rendered page is read the same way.
async function browserHtml(url: string): Promise<{ html: string; url: string } | null> {
  const token = await secret('APIFY_API_TOKEN'); if (!token) return null;
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items?token=${token}&timeout=70`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(85000),
      body: JSON.stringify({ query: url, maxResults: 1, outputFormats: ['html'], scrapingTool: 'browser-playwright', requestTimeoutSecs: 60, dynamicContentWaitSecs: 8, removeCookieWarnings: true, htmlTransformer: 'none' }),
    });
    if (!r.ok) return null;
    const d = ((await r.json()) as any[])[0] || {};
    const html = String(d.html || '');
    return html.length > 500 ? { html: html.slice(0, 800000), url: d?.metadata?.url || url } : null;
  } catch { return null; }
}
const thin = (html: string) => html.length < 4000 || /cf-browser-verification|challenge-platform|Just a moment\.\.\.|enable JavaScript and cookies/i.test(html) || (html.match(/<img\b/gi) || []).length === 0;

async function readSite(website: string, name: string) {
  const out = { ok: false, error: '', instagram: '', facebook: '', cands: [] as Cand[], svg: 0, html_len: 0, browser: false };
  const start = /^https?:/i.test(website) ? website : 'https://' + website;
  let html = '', base = start;
  try {
    const r = await fetchWithin(start, 12000);
    if (r.ok) { html = (await r.text()).slice(0, 800000); base = r.url || start; } else out.error = `answered ${r.status}`;
  } catch { out.error = 'did not open'; }
  if (!html || thin(html)) {
    const b = await browserHtml(base);
    if (b && b.html.length > html.length) { html = b.html; base = b.url; out.browser = true; out.error = ''; }
  }
  if (!html) return out;
  out.ok = true; out.html_len = html.length;
  const abs = (u: string) => { try { return new URL(u.replace(/&amp;/g, '&').trim(), base).href; } catch { return ''; } };
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, '&').trim());
  for (const h of hrefs) { if (!out.instagram && /instagram\.com\//i.test(h)) { const v = socialOf(h, 'ig'); if (v) out.instagram = v; } if (!out.facebook && /facebook\.com\//i.test(h)) { const v = socialOf(h, 'fb'); if (v) out.facebook = 'https://www.facebook.com/' + v; } }
  const attr = (tag: string, n: string) => (tag.match(new RegExp(`\\b${n}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1] || '';
  const srcOf = (tag: string) => {
    const ss = attr(tag, 'srcset') || attr(tag, 'data-srcset');
    const best = ss ? (ss.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop() || '') : '';
    return attr(tag, 'src') && !/^data:image\/(svg|gif;base64,R0lGODlhAQABA)/i.test(attr(tag, 'src')) ? attr(tag, 'src') : (attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || best || attr(tag, 'src'));
  };
  const nameWords = words(baseName(name));
  const add = (u: string, label: string) => { if (!u) return; if (/\.svg(\?|#|$)/i.test(u) || /^data:image\/svg/i.test(u)) { out.svg++; return; } const a = /^data:/i.test(u) ? u : abs(u); if (a) out.cands.push({ url: a, source: 'website', label }); };
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ tag: m[0], at: m.index || 0 }));
  for (const i of imgs) if (/logo/i.test(i.tag)) add(srcOf(i.tag), 'Their website: a picture marked logo');
  const blocks = [...html.matchAll(/<(header|nav)\b[\s\S]*?<\/\1>/gi)].slice(0, 3);
  for (const b of blocks) for (const m of [...b[0].matchAll(/<img\b[^>]*>/gi)].slice(0, 4)) add(srcOf(m[0]), 'Their website: a picture in the header');
  for (const i of imgs) { const alt = attr(i.tag, 'alt') + ' ' + attr(i.tag, 'title'); if (nameWords.length && words(alt).some((w) => nameWords.includes(w))) add(srcOf(i.tag), 'Their website: a picture named for the business'); }
  for (const i of imgs.slice(0, 3)) add(srcOf(i.tag), 'Their website: one of the first pictures on the page');
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+logo[^"')]*)["']?\s*\)/gi)) add(m[1], 'Their website: a logo background picture');
  for (const m of html.matchAll(/<svg\b[^>]*>/gi)) if (/logo/i.test(m[0])) out.svg++;
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) { const rel = attr(m[0], 'rel').toLowerCase(), href = attr(m[0], 'href'); if (href && /apple-touch-icon/.test(rel)) add(href, 'Their website: app icon'); }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (/(property|name)=["']og:image["']/i.test(m[0])) add(attr(m[0], 'content'), 'Their website: share picture');
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) { const rel = attr(m[0], 'rel').toLowerCase(), href = attr(m[0], 'href'); if (href && /(^|\s)icon(\s|$)/.test(rel)) add(href, 'Their website: page icon'); }
  const seen = new Set<string>(); out.cands = out.cands.filter((c) => !seen.has(c.url) && seen.add(c.url)).slice(0, 7);
  return out;
}

// ---- Apify ----
async function apify(actor: string, input: unknown, timeoutS = 240): Promise<any[]> {
  const token = await secret('APIFY_API_TOKEN'); if (!token) return [];
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), (timeoutS + 20) * 1000);
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutS}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: ctl.signal,
    });
    if (!r.ok) { console.log('apify', actor, r.status, (await r.text()).slice(0, 300)); return []; }
    return await r.json();
  } catch (e) { console.log('apify', actor, String(e)); return []; } finally { clearTimeout(t); }
}
const pickField = (o: any, re: RegExp): string => { for (const k of Object.keys(o || {})) if (re.test(k) && typeof o[k] === 'string' && /^https?:/.test(o[k])) return o[k]; return ''; };

// ---- Claude picks ----
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['pick', 'same_logo_in', 'confidence', 'background', 'why'],
  properties: {
    pick: { type: 'integer', description: 'The number of the best picture of this business\'s own clean logo, or -1 when none is.' },
    same_logo_in: { type: 'array', items: { type: 'integer' }, description: 'The other picture numbers that show the same logo (any size or crop), so we know where else it appears.' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'How sure that the pick is this business\'s own logo.' },
    background: { type: 'string', description: 'Fill for the square: "match" when the logo sits on a solid color of its own, "white" for a dark logo on white or see-through, "black" for a light logo on see-through, or #rrggbb.' },
    why: { type: 'string', description: 'One short plain sentence for the team.' },
  },
};
function b64(b: Uint8Array) { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); }
async function judge(name: string, kind: string, city: string, pics: { label: string; type: string; bytes: Uint8Array }[]) {
  const key = await secret('ANTHROPIC_API_KEY'); if (!key) return { error: 'no Anthropic key' };
  const client = new Anthropic({ apiKey: key });
  const content: any[] = [];
  pics.forEach((p, i) => { content.push({ type: 'text', text: `Picture ${i}: ${p.label}` }); content.push({ type: 'image', source: { type: 'base64', media_type: p.type, data: b64(p.bytes) } }); });
  content.push({ type: 'text', text: `The business: ${name}${kind ? ', ' + kind : ''}${city ? ', ' + city : ''}. Which picture is its own clean logo, and where else does that same logo appear?` });
  try {
    const res: any = await client.messages.create({
      model: 'claude-opus-5-5', max_tokens: 6000,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: `You find logos for the Vegans Explore Directory. Each listing shows a small square logo on its card.
The pictures come from the business's website, a Google Images search, its Facebook page picture and its Instagram picture.
- Pick the business's own logo: its mark or its name as designed, ideally on a plain or see-through background. A logo on a
  solid colored square or circle is fine.
- Google Images results can be other businesses with similar names, stock art or unrelated pictures. Only trust a Google result
  when the name in it is this business's name, or it matches the logo from their website, Facebook or Instagram.
- Never pick a photo of food, a storefront, a room, people, a menu or flyer, a logo inside a busy photo, a website builder's or
  platform's icon (Wix, Squarespace, Shopify, WordPress, Toast, Google, Yelp), a map, or another business's logo.
- A Facebook or Instagram picture counts only when it is the logo itself, not a photo.
- A Facebook page found by searching the name may belong to another business with the same or a similar name (another city,
  another kind of business). Trust it only when its name and place fit this business, or its picture matches the logo from
  their website, Google or Instagram.
- When several pictures show the same logo, pick the largest, sharpest, least cropped one, and list the others in same_logo_in.
- Never pick one that is faint, blurry or unreadable at small size.
- confidence high only when you can read the business's name in the logo or the same logo appears in two different places.
- When none fits, pick -1 and say why.`,
      messages: [{ role: 'user', content }],
    } as any);
    if (res.stop_reason !== 'end_turn') return { error: 'stopped: ' + res.stop_reason };
    const text = (res.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const u = res.usage || {};
    const usd = ((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0)) * 4e-6 + (u.cache_read_input_tokens || 0) * 0.2e-6 + (u.output_tokens || 0) * 20e-6;  // Opus 5.5 list prices
    return { usd, result: JSON.parse(text) as { pick: number; same_logo_in: number[]; confidence: string; background: string; why: string } };
  } catch (e) { return { error: e instanceof Anthropic.APIError ? `anthropic ${e.status}` : String((e as Error).message || e) }; }
}

// ---- One batch ----
// Saves one squared JPEG as a listing's logo (the way ve-discover's logo_set does): media/listings/<slug>/logo-*, details,
// a ve_listing_edits row, the suggestion marked used, the hunt row marked applied. Only for a pick the hunter confirmed
// (verdict auto) unless a person checked it (reviewed).
async function applyLogo(runId: string, lid: string, bytes: Uint8Array, reviewed: boolean, by: string): Promise<{ ok: true; logo_url: string } | { error: string }> {
  const { data: h } = await db.from('ve_logo_hunts').select('pick, verdict, candidates, sources_agree, confidence, applied_at').eq('run_id', runId).eq('listing_id', lid).maybeSingle();
  if (!h || h.pick < 0) return { error: 'no pick for this listing in this run' };
  if (h.applied_at) return { error: 'already applied' };
  if (h.verdict !== 'auto' && !reviewed) return { error: 'not confirmed' };
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return { error: 'not a JPEG' };
  const size = imageSize(bytes); if (!size || Math.min(size.w, size.h) < 200) return { error: 'too small' };
  const { data: l } = await db.from('listings').select('id, slug, logo_url, details').eq('id', lid).maybeSingle();
  if (!l) return { error: 'listing not found' };
  const at = new Date().toISOString();
  const path = `media/listings/${l.slug}/logo-${at.slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (up.error) return { error: up.error.message };
  const url = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`;
  const pickRow = (h.candidates || [])[h.pick] || {};
  const details = { ...(l.details || {}) } as Record<string, any>;
  details.logo_source = 'logo-hunt';
  details.logo_checked = { by, at, w: size.w, h: size.h, from: String(pickRow.url || '').slice(0, 400), source: pickRow.source || null, run: runId, agree: h.sources_agree || [], confidence: h.confidence, reviewed };
  if (details.logo_unverified) { details.logo_replaced = { url: details.logo_unverified, at }; delete details.logo_unverified; delete details.logo_unverified_at; delete details.logo_unverified_why; }
  delete details.logo_letter_ok;
  const { error } = await db.from('listings').update({ logo_url: url, details, updated_at: at }).eq('id', l.id);
  if (error) return { error: error.message };
  await db.from('ve_listing_edits').insert({ listing_id: l.id, field: 'logo', old_value: l.logo_url || null, new_value: url, meta: { by: 'logo_hunt', run: runId, where: 've-logo-hunt' } });
  await db.from('ve_logo_suggestions').update({ status: 'used', decided_at: at }).eq('listing_id', l.id);
  await db.from('ve_logo_hunts').update({ applied_at: at, applied_url: url }).eq('run_id', runId).eq('listing_id', lid);
  return { ok: true, logo_url: url };
}

let FB_SEARCH = false;
// Claims up to 5 listings still queued in the run and starts them as their own call (action batch).
async function nextGroup(req: Request, token: string, runId: string, fbSearch: boolean) {
  const { data: q } = await db.from('ve_logo_hunts').select('listing_id').eq('run_id', runId).eq('status', 'queued').limit(5);
  const ids = (q || []).map((r: any) => r.listing_id); if (!ids.length) return;
  const { data: got } = await db.from('ve_logo_hunts').update({ status: 'claimed' }).eq('run_id', runId).eq('status', 'queued').in('listing_id', ids).select('listing_id');
  const mine = (got || []).map((r: any) => r.listing_id); if (!mine.length) return nextGroup(req, token, runId, fbSearch);
  await fetch(`${SUPABASE_URL}/functions/v1/ve-logo-hunt`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('authorization') || '', 'x-ops-token': token },
    body: JSON.stringify({ action: 'batch', run_id: runId, listing_ids: mine, fb_search: fbSearch }) }).catch(() => null);
}
async function runBatch(runId: string, ids: string[]) {
  const { data: ls } = await db.from('listings').select('id, slug, name, category, address_city, address_state, website, instagram, ig_handle, facebook').in('id', ids);
  const L = (ls || []) as any[];
  await db.from('ve_logo_hunts').update({ status: 'working' }).eq('run_id', runId).in('listing_id', ids);
  // 1. websites
  const sites = await Promise.all(L.map((l) => l.website ? readSite(l.website, l.name) : Promise.resolve(null)));
  const ig: Record<string, string> = {}, fb: Record<string, string> = {};
  L.forEach((l, i) => {
    const s = sites[i];
    const h = handleOf(l.ig_handle || l.instagram || '') || s?.instagram || ''; if (h) ig[l.id] = h;
    const f = (l.facebook && /facebook\.com\//i.test(l.facebook) ? l.facebook : '') || s?.facebook || ''; if (f) fb[l.id] = f;
  });
  // 2. No Facebook link? Search Facebook for a page by the business's name and city (one search a listing: the actor's result
  // limit is for the whole run). Up to two pages whose name shares a word with ours go to the page reader with the rest.
  const fbFound: Record<string, string[]> = {};
  const noFb = FB_SEARCH ? L.filter((l) => !fb[l.id]) : [];  // off by default (Sean, 2026-11-07): it rarely found the right page and was ~40% of the Apify cost
  let fbSearchN = 0, next0 = 0;
  const searchOne = async () => {
    while (next0 < noFb.length) {
      const l = noFb[next0++];
      const res = await apify('apify~facebook-search-scraper', { categories: [`${baseName(l.name)} ${l.address_city || ''}`.trim()], searchType: 'pages', resultsLimit: 5 }, 120);
      fbSearchN += res.length;
      const ours = words(baseName(l.name));
      fbFound[l.id] = (res as any[]).map((r) => ({ url: String(r.url || ''), score: words(r.name || '').filter((w) => ours.includes(w)).length }))
        .filter((r) => /facebook\.com\//i.test(r.url) && r.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map((r) => r.url);
    }
  };
  await Promise.all([searchOne(), searchOne(), searchOne(), searchOne(), searchOne()]);
  const fbUrls = [...new Set([...Object.values(fb), ...Object.values(fbFound).flat()])];
  // 3-5. Google Images, Facebook pages, Instagram, side by side
  const q = (l: any) => `${baseName(l.name)} ${l.address_city || ''} logo`.replace(/\s+/g, ' ').trim();
  const [gi, fbr, igr] = await Promise.all([
    apify('hooli~google-images-scraper', { queries: L.map(q), maxResultsPerQuery: 6 }),
    fbUrls.length ? apify('apify~facebook-pages-scraper', { startUrls: fbUrls.map((url) => ({ url })) }) : Promise.resolve([]),
    Object.keys(ig).length ? apify('apify~instagram-profile-scraper', { usernames: [...new Set(Object.values(ig))] }) : Promise.resolve([]),
  ]);
  const igPic: Record<string, string> = {};
  for (const p of igr as any[]) { const u = String(p.username || '').toLowerCase(); const pic = p.profilePicUrlHD || p.profilePicUrl; if (u && pic && !p.error) igPic[u] = pic; }
  const fbPic: Record<string, string> = {};
  const fbKey = (u: string) => String(u || '').toLowerCase().replace(/^https?:\/\/(www\.|m\.)?facebook\.com\//, '').replace(/[/?#].*$/, '');
  const fbInfo: Record<string, string> = {};
  for (const p of fbr as any[]) {
    const pic = p.profilePictureUrl || pickField(p, /profilePic/i); const keys = [p.facebookUrl, p.pageUrl, p.url, p.inputUrl].filter(Boolean).map(fbKey);
    const info = [p.title || p.pageName || p.name, typeof p.address === 'string' ? p.address : '', Array.isArray(p.categories) ? p.categories.slice(0, 2).join(', ') : ''].filter(Boolean).join('; ').slice(0, 200);
    for (const k of keys) { if (pic) fbPic[k] = pic; if (info) fbInfo[k] = info; }
  }
  const giBy: Record<string, string[]> = {};
  for (const r of gi as any[]) { const qq = String(r.query || r.searchQuery || r.searchTerm || '').toLowerCase(); const u = r.imageUrl || r.originalUrl || r.url || pickField(r, /image/i); if (qq && u) (giBy[qq] ||= []).push(u); }
  const cost = (gi.length * 0.0029) + (fbr.length * 0.0082) + (igr.length * 0.0026) + (fbSearchN * 0.005) + (noFb.length * 0.001);
  // 5. per listing: download, store, judge
  const per = cost / Math.max(1, L.length);
  let next = 0;
  const work = async () => {
    while (next < L.length) {
      const i = next++, l = L[i], s = sites[i];
      try {
        const cands: Cand[] = [...(s?.cands || [])];
        (giBy[q(l).toLowerCase()] || []).slice(0, 6).forEach((u, k) => cands.push({ url: u, source: 'google', label: `Google Images result ${k + 1} for "${q(l)}"` }));
        if (fb[l.id] && fbPic[fbKey(fb[l.id])]) cands.push({ url: fbPic[fbKey(fb[l.id])], source: 'facebook', label: 'Their Facebook page picture' });
        for (const u of fbFound[l.id] || []) if (fbPic[fbKey(u)]) cands.push({ url: fbPic[fbKey(u)], source: 'facebook', label: `The picture of a Facebook page found by searching the name (${fbInfo[fbKey(u)] || u}). It may be another business with a similar name: check the name and place.` });
        if (ig[l.id] && igPic[ig[l.id]]) cands.push({ url: igPic[ig[l.id]], source: 'instagram', label: 'Their Instagram picture' });
        const kept: (Cand & { stored: string; w: number; h: number; type: string; bytes: Uint8Array })[] = [];
        const imgs = await Promise.all(cands.map((c) => readImage(c.url)));
        for (let k = 0; k < cands.length && kept.length < 14; k++) {
          const im = imgs[k]; if (!im || Math.min(im.w, im.h) < 100) continue;
          const path = `media/logo-hunt/${runId}/${l.slug}/${kept.length}.${EXT[im.type]}`;
          const up = await db.storage.from('vegan-media').upload(path, im.bytes, { contentType: im.type, upsert: true });
          if (up.error) continue;
          kept.push({ ...cands[k], stored: `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`, w: im.w, h: im.h, type: im.type, bytes: im.bytes });
        }
        const candRows = kept.map((c, n) => ({ n, source: c.source, label: c.label, url: c.url.startsWith('data:') ? 'data:' : c.url, stored: c.stored, w: c.w, h: c.h }));
        const site = s ? { ok: s.ok, error: s.error, svg: s.svg, html_len: s.html_len, browser: s.browser } : null;
        const socials = { instagram: ig[l.id] || null, facebook: fb[l.id] || null, fb_searched: fbFound[l.id] || null, ig_found_on_site: !!s?.instagram, fb_found_on_site: !!s?.facebook };
        if (!kept.length) {
          await db.from('ve_logo_hunts').update({ status: 'done', site, socials, candidates: candRows, pick: -1, verdict: 'none', why: 'No usable picture found anywhere.', cost_usd: per, done_at: new Date().toISOString() }).eq('run_id', runId).eq('listing_id', l.id);
          continue;
        }
        // Claude sees each picture at most 512 px (Supabase's image resizer on the stored copy): logos read fine, about a quarter of the cost.
        const small = await Promise.all(kept.map(async (c) => {
          try {
            const r = await fetch(c.stored.replace('/object/public/', '/render/image/public/') + '?width=512&height=512&resize=contain&format=origin', { signal: AbortSignal.timeout(15000) });
            if (r.ok) { const b = new Uint8Array(await r.arrayBuffer()); if (imageSize(b)) return { bytes: b, type: typeOf(b) }; }
          } catch { /* the original then */ }
          return { bytes: c.bytes, type: c.type };
        }));
        const j = await judge(l.name, l.category || '', [l.address_city, l.address_state].filter(Boolean).join(', '), kept.map((c, n) => ({ label: c.label, type: small[n].type, bytes: small[n].bytes })));
        if ('error' in j) { await db.from('ve_logo_hunts').update({ status: 'failed', site, socials, candidates: candRows, error: j.error, cost_usd: per }).eq('run_id', runId).eq('listing_id', l.id); continue; }
        const r = j.result!; const claudeUsd = (j as any).usd || 0;
        const ok = r.pick >= 0 && r.pick < kept.length;
        const same = (r.same_logo_in || []).filter((n) => n >= 0 && n < kept.length && n !== r.pick);
        const agree = ok ? [...new Set([kept[r.pick].source, ...same.map((n) => kept[n].source)])] : [];
        const verdict = !ok ? 'none' : agree.length >= 2 && r.confidence === 'high' ? 'auto' : 'review';
        await db.from('ve_logo_hunts').update({ status: 'done', site, socials, candidates: candRows, pick: ok ? r.pick : -1, same_logo_in: same, sources_agree: agree, confidence: r.confidence, background: r.background, verdict, why: r.why, cost_usd: per, claude_usd: claudeUsd, done_at: new Date().toISOString() }).eq('run_id', runId).eq('listing_id', l.id);
      } catch (e) { await db.from('ve_logo_hunts').update({ status: 'failed', error: String((e as Error).message || e) }).eq('run_id', runId).eq('listing_id', l.id); }
    }
  };
  await Promise.all([work(), work(), work(), work()]);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'post only' }, 405);
  // verify_jwt is on: the gateway takes the project's anon key in Authorization, and the ops token rides in x-ops-token.
  const token = req.headers.get('x-ops-token') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (!ops || token !== ops) return json({ error: 'not allowed' }, 401);
  const body = await req.json().catch(() => ({}));
  if (body.action === 'start') {
    const ids = (Array.isArray(body.listing_ids) ? body.listing_ids : []).filter((x: unknown) => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x as string)).slice(0, 300);
    if (!ids.length) return json({ error: 'no listings' }, 400);
    const runId = typeof body.run_id === 'string' && /^[a-z0-9-]{4,40}$/.test(body.run_id) ? body.run_id : 'h' + Date.now().toString(36);
    await db.from('ve_logo_hunts').upsert(ids.map((id: string) => ({ run_id: runId, listing_id: id, status: 'queued' })), { onConflict: 'run_id,listing_id', ignoreDuplicates: true });
    // Three chains of groups of 5: each group is its own call (its own background time limit), and when it finishes it claims
    // the next 5 still queued in the run, so at most three groups run at once (Apify's limit on runs at the same time).
    await Promise.all([0, 1, 2].map(() => nextGroup(req, token, runId, body.fb_search === true)));
    return json({ ok: true, run_id: runId, listings: ids.length });
  }
  if (body.action === 'batch') {
    // one batch in the foreground (up to 10), for a run already started
    const ids = (Array.isArray(body.listing_ids) ? body.listing_ids : []).slice(0, 10);
    FB_SEARCH = body.fb_search === true;
    const runId = String(body.run_id || '');
    // @ts-ignore EdgeRuntime is the Supabase runtime's
    EdgeRuntime.waitUntil((async () => { try { await runBatch(runId, ids); } finally { await nextGroup(req, token, runId, FB_SEARCH); } })());
    return json({ ok: true, started: ids.length });
  }
  if (body.action === 'status') {
    const { data } = await db.from('ve_logo_hunts').select('listing_id, status, verdict, confidence, sources_agree, why, error').eq('run_id', String(body.run_id || ''));
    const counts: Record<string, number> = {}; for (const r of data || []) { const k = r.status === 'done' ? 'done:' + r.verdict : r.status; counts[k] = (counts[k] || 0) + 1; }
    return json({ counts, rows: data });
  }
  if (body.action === 'export') {
    // The run as one public JSON file next to its pictures (media/logo-hunt/<run>/report.json), for the review page.
    const runId = String(body.run_id || '');
    if (!/^[a-z0-9-]{4,40}$/.test(runId)) return json({ error: 'bad run' }, 400);
    const { data } = await db.from('ve_logo_hunts').select('listing_id, status, verdict, confidence, sources_agree, background, pick, same_logo_in, why, error, site, socials, candidates, cost_usd').eq('run_id', runId);
    const ids = (data || []).map((r: any) => r.listing_id);
    const { data: ls } = ids.length ? await db.from('listings').select('id, slug, name, category, address_city, address_state, website, logo_url').in('id', ids) : { data: [] };
    const byId = new Map((ls || []).map((l: any) => [l.id, l]));
    const rows = (data || []).map((r: any) => ({ ...r, listing: byId.get(r.listing_id) || null }));
    const path = `media/logo-hunt/${runId}/report.json`;
    const up = await db.storage.from('vegan-media').upload(path, new TextEncoder().encode(JSON.stringify({ run_id: runId, at: new Date().toISOString(), rows })), { contentType: 'application/json', upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    return json({ ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`, rows: rows.length });
  }
  if (body.action === 'stage') {
    // Short-lived upload links (media/listings/_new/<uuid>.jpg) for squared logos, used by apply's staged_path.
    const n = Math.min(Math.max(1, Number(body.n) || 1), 20), out = [], ext = body.ext === 'zip' ? 'zip' : 'jpg';
    for (let i = 0; i < n; i++) {
      const path = `media/listings/_new/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);
      out.push({ path, url: data.signedUrl });
    }
    return json({ ok: true, uploads: out });
  }
  if (body.action === 'apply') {
    // One squared logo, as jpeg_b64 or staged_path (a stage upload). For many at once, apply_zip.
    const runId = String(body.run_id || ''), lid = String(body.listing_id || '');
    if (!/^[a-z0-9-]{4,40}$/.test(runId) || !/^[0-9a-f-]{36}$/i.test(lid)) return json({ error: 'bad request' }, 400);
    let bytes: Uint8Array; const staged = String(body.staged_path || '');
    if (staged) {
      if (!/^media\/listings\/_new\/[0-9a-f-]{36}\.jpg$/.test(staged)) return json({ error: 'not our upload' }, 400);
      const { data: file, error: dErr } = await db.storage.from('vegan-media').download(staged);
      if (dErr || !file) return json({ error: 'upload not found' }, 404);
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      try { bytes = Uint8Array.from(atob(String(body.jpeg_b64 || '')), (c) => c.charCodeAt(0)); } catch { return json({ error: 'bad picture' }, 400); }
    }
    const r = await applyLogo(runId, lid, bytes, body.reviewed === true, String(body.by || 'Logan (logo hunt)'));
    if (staged) await db.storage.from('vegan-media').remove([staged]);
    return 'error' in r ? json(r, 400) : json(r);
  }
  if (body.action === 'apply_zip') {
    // A zip (staged with stage ext zip) of <listing_id>.jpg files, each squared by the caller: every one is applied.
    const runId = String(body.run_id || ''), staged = String(body.staged_path || '');
    if (!/^[a-z0-9-]{4,40}$/.test(runId) || !/^media\/listings\/_new\/[0-9a-f-]{36}\.zip$/.test(staged)) return json({ error: 'bad request' }, 400);
    const { data: file, error: dErr } = await db.storage.from('vegan-media').download(staged);
    if (dErr || !file) return json({ error: 'upload not found' }, 404);
    const JSZip = (await import('npm:jszip@3.10.1')).default;
    const zip = await JSZip.loadAsync(new Uint8Array(await file.arrayBuffer()));
    const out: Record<string, unknown> = {};
    for (const name of Object.keys(zip.files)) {
      const m = name.match(/^([0-9a-f-]{36})\.jpg$/i); if (!m) continue;
      const bytes = await zip.files[name].async('uint8array');
      const r = await applyLogo(runId, m[1], bytes, body.reviewed === true, String(body.by || 'Logan (logo hunt)'));
      out[m[1]] = 'error' in r ? r.error : 'ok';
    }
    await db.storage.from('vegan-media').remove([staged]);
    const ok = Object.values(out).filter((v) => v === 'ok').length;
    return json({ ok: true, applied: ok, total: Object.keys(out).length, results: out });
  }
  return json({ error: 'unknown action' }, 400);
});
