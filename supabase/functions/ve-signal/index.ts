// ve-signal: Signal, our Information Systems Division (playbook signal; Sean, 2026-11-06: "a list of all of the issues that our
// site is experiencing through Search Console, through whatever... then I just want it to be fixed"). Version 1 foundation,
// read-only: it reads Search Console and scans every page in a site's sitemap the way Google first sees it (the HTML the server
// sends), then groups what it finds by cause into signal_issues. No fixes yet. A site is a signal_sites row, so another brand
// or client is a row, not code. verify_jwt is off; the caller is checked here: the cron secret, the ops token, or a super admin.
//   POST { action: 'gsc_check', site }              what Search Console shows the reader (properties, 28 days of search, sitemaps)
//   POST { action: 'scan_start', site }             read the sitemap, queue every page, open a run
//   POST { action: 'scan_batch', site, limit? }     read the next pages (default 60); closes the run and groups issues when done
//   POST { action: 'aggregate', site }              group page problems into signal_issues again
//   POST { action: 'issues', site }                 the issue list and the latest run
//   POST { action: 'gsc_urls', site, days? }        every address Google showed for us (default 480 days), with clicks and impressions
//   POST { action: 'old_check', site, limit? }      follow the next signal_gsc_urls addresses to where they land (default 80)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const UA = 'Mozilla/5.0 (compatible; LESARUSS-Signal/1.0; +https://vegansexplore.com/policies)';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}
function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '=';
  const bin = atob(str); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.'); if (!h || !p || !s) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

// ---- Google. Search Console uses its own reader, made for it on 2026-08-29 under contact@lesaruss.com (Google Cloud project
// lesaruss-493806, gsc-admin service account, lesaruss_secrets GSC_SERVICE_ACCOUNT_JSON), never the GA4 project. ----
const b64u = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
async function googleToken(scope: string, keyName = 'GSC_SERVICE_ACCOUNT_JSON'): Promise<string> {
  const raw = await secret(keyName); if (!raw) throw new Error('no_reader');
  const sa = JSON.parse(raw); const now = Math.floor(Date.now() / 1000);
  const input = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const pem = sa.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const jwt = input + '.' + btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const t = await r.json(); if (!t.access_token) throw new Error('google_token: ' + (t.error_description || t.error || 'no token')); return t.access_token;
}
const dayEastern = (offset: number) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

async function gscCheck(site: any) {
  const tok = await googleToken('https://www.googleapis.com/auth/webmasters.readonly');
  const H = { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' };
  const sl = await (await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: H })).json();
  const props: { siteUrl: string; permissionLevel: string }[] = sl.siteEntry ?? [];
  const host = site.site.toLowerCase();
  const prop = props.find((p) => p.siteUrl === `sc-domain:${host}`) ?? props.find((p) => p.siteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') === host);
  if (!prop) return { ok: false, error: 'no_property', reader: JSON.parse((await secret('GSC_SERVICE_ACCOUNT_JSON')) || '{}').client_email ?? null, reader_sees: props.map((p) => p.siteUrl), google_error: sl.error?.message ?? null };
  await db.from('signal_sites').update({ gsc_property: prop.siteUrl }).eq('site', site.site);
  const enc = encodeURIComponent(prop.siteUrl);
  const q = async (body: unknown) => (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
  const startDate = dayEastern(-30), endDate = dayEastern(-3);
  const [tot, queries, pages, maps] = await Promise.all([
    q({ startDate, endDate }),
    q({ startDate, endDate, dimensions: ['query'], rowLimit: 15 }),
    q({ startDate, endDate, dimensions: ['page'], rowLimit: 15 }),
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/sitemaps`, { headers: H }).then((r) => r.json()),
  ]);
  return { ok: true, property: prop.siteUrl, permission: prop.permissionLevel, period: { startDate, endDate },
    totals: tot.rows?.[0] ?? tot.error?.message ?? null, top_queries: queries.rows ?? [], top_pages: pages.rows ?? [],
    sitemaps: (maps.sitemap ?? []).map((m: any) => ({ path: m.path, lastSubmitted: m.lastSubmitted, lastDownloaded: m.lastDownloaded, errors: m.errors, warnings: m.warnings, contents: m.contents })) };
}


async function gscUrls(site: any, days: number) {
  if (!site.gsc_property) return { ok: false, error: 'run gsc_check first' };
  const tok = await googleToken('https://www.googleapis.com/auth/webmasters.readonly');
  const enc = encodeURIComponent(site.gsc_property); const rows: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dayEastern(-days), endDate: dayEastern(-2), dimensions: ['page'], rowLimit: 25000, startRow: start }) })).json();
    if (r.error) return { ok: false, error: r.error.message };
    rows.push(...(r.rows ?? []).map((x: any) => ({ url: x.keys[0], clicks: x.clicks, impressions: x.impressions })));
    if ((r.rows ?? []).length < 25000) break;
  }
  return { ok: true, days, count: rows.length, urls: rows };
}


// Follow an address the way a visitor does (up to 6 hops) and say where it lands: ok (a real page), loading_copy (a page whose
// server title is "Loading...", the old /project copies), not_found (404 or our not-found page), broken (5xx or no answer),
// home (sent to the home page, value lost).
async function follow(url: string) {
  let u = url; const hops: string[] = []; let status = 0; let title = '';
  for (let i = 0; i < 6; i++) {
    let r: Response;
    try { r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'manual', signal: AbortSignal.timeout(15000) }); }
    catch (e) { return { status: 0, location: u, hops, title: '', verdict: 'broken', note: String((e as Error).message || e).slice(0, 120) }; }
    status = r.status;
    if (status >= 300 && status < 400 && r.headers.get('location')) { await r.body?.cancel(); u = new URL(r.headers.get('location')!, u).href; hops.push(String(status)); continue; }
    const html = status < 500 ? (await r.text()).slice(0, 60000) : ''; title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ');
    break;
  }
  const path = (() => { try { return new URL(u).pathname; } catch { return ''; } })();
  const verdict = status >= 500 || status === 0 ? 'broken' : status === 404 || status === 410 || /not found/i.test(title) ? 'not_found'
    : /^loading/i.test(title) ? 'loading_copy' : status === 200 && (path === '/' || path === '') && url.replace(/\/$/, '') !== new URL(u).origin ? 'home'
    : status === 200 ? 'ok' : 'broken';
  return { status, location: u, hops, title, verdict, note: null };
}

// ---- Sitemap and page scan ----
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
async function readSitemap(url: string, depth = 0): Promise<string[]> {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  const x = await r.text();
  const locs = [...x.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(x) && depth < 2) { const all: string[] = []; for (const l of locs) all.push(...(await readSitemap(l, depth + 1))); return all; }
  return locs;
}
function pageType(u: string): string {
  const x = new URL(u); const p = x.pathname;
  if (p.startsWith('/directory/') && p.split('/').filter(Boolean).length === 2) return 'listing';
  if (p.startsWith('/pulse/') && p.split('/').filter(Boolean).length === 2) return 'pulse';
  if (p.startsWith('/events') && x.searchParams.get('event')) return 'event';
  if (p.startsWith('/guides/')) return 'guide';
  if (p.startsWith('/communities/')) return 'chapter';
  if (p.startsWith('/products/')) return 'product';
  return 'page';
}
function attrs(tag: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) o[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
  return o;
}
const norm = (u: string) => { try { const x = new URL(u); x.hash = ''; return (x.origin + x.pathname).replace(/\/$/, '') + (x.search || ''); } catch { return u; } };

async function checkPage(url: string) {
  const t0 = Date.now();
  const out: any = { status_code: null, final_url: null, title: null, description: null, canonical: null, robots: null, h1_count: null, og_image: null, img_total: null, img_no_alt: null, html_bytes: null, ms: null, problems: [] as string[] };
  let r: Response;
  try { r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'manual', signal: AbortSignal.timeout(15000) }); }
  catch (e) { out.problems.push('no_answer'); out.ms = Date.now() - t0; out.final_url = String((e as Error).message || e).slice(0, 200); return out; }
  out.status_code = r.status;
  if (r.status >= 300 && r.status < 400) { out.final_url = r.headers.get('location'); out.problems.push('redirect_in_sitemap'); out.ms = Date.now() - t0; await r.body?.cancel(); return out; }
  const html = await r.text(); out.ms = Date.now() - t0; out.html_bytes = html.length;
  if (r.status >= 400) { out.problems.push('http_error'); return out; }
  const head = html.slice(0, 200000);
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]; out.title = title ? decode(title).replace(/\s+/g, ' ') : null;
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]); const n = (a.name || a.property || '').toLowerCase();
    if (n === 'description' && out.description == null) out.description = a.content ?? '';
    if (n === 'robots') out.robots = a.content ?? '';
    if (n === 'og:image' && !out.og_image) out.og_image = a.content ?? '';
  }
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) { const a = attrs(m[0]); if ((a.rel || '').toLowerCase() === 'canonical') { out.canonical = a.href; break; } }
  out.h1_count = (html.match(/<h1[\s>]/gi) || []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || []; out.img_total = imgs.length; out.img_no_alt = imgs.filter((t) => !/\balt\s*=/i.test(t)).length;
  const P = out.problems as string[];
  if (!out.title) P.push('no_title'); else if (out.title.length > 70) P.push('title_too_long'); else if (out.title.length < 15) P.push('title_too_short');
  if (out.description == null || out.description === '') P.push('no_description');
  else if (out.description.length > 170) P.push('description_too_long'); else if (out.description.length < 50) P.push('description_too_short');
  if (!out.canonical) P.push('no_canonical'); else if (norm(new URL(out.canonical, url).href) !== norm(url)) P.push('canonical_elsewhere');
  if (/noindex/i.test(out.robots || '')) P.push('noindex_in_sitemap');
  if (out.h1_count === 0) P.push('no_h1'); else if (out.h1_count > 1) P.push('many_h1');
  if (!out.og_image) P.push('no_share_image');
  if (out.img_no_alt > 0) P.push('img_missing_alt');
  if (out.ms > 4000) P.push('slow_response');
  return out;
}

// What each problem means, who fixes it, and Logan's first call on it. class: auto (safe, Logan fixes and logs an undo),
// needs_you (a Fix button with a recommendation), watching (no button).
const CODES: Record<string, { title: string; why: string; rec: string; cls: string; sev: string }> = {
  no_answer: { title: 'Pages that did not answer', why: 'Google gave up waiting, so these pages may drop out of search.', rec: 'Find why they hang and fix the page or its function.', cls: 'needs_you', sev: 'high' },
  http_error: { title: 'Pages in the sitemap that are broken (404 or 500)', why: 'We tell Google these pages exist, then they fail. It wastes Google\'s visits and looks careless.', rec: 'Fix the page if it should exist; otherwise take it out of the sitemap and redirect it.', cls: 'needs_you', sev: 'high' },
  redirect_in_sitemap: { title: 'Sitemap lists addresses that redirect', why: 'The sitemap should list only final addresses; a redirect makes Google take an extra step.', rec: 'List the final address in the sitemap instead.', cls: 'auto', sev: 'medium' },
  noindex_in_sitemap: { title: 'Pages in the sitemap marked "do not index"', why: 'The sitemap asks Google to index them, and the page says not to. Google flags the contradiction.', rec: 'Take them out of the sitemap, or remove the noindex if they should be found.', cls: 'needs_you', sev: 'high' },
  no_title: { title: 'Pages with no title', why: 'The title is the blue link in Google results.', rec: 'Write the title on the server from the page\'s own data.', cls: 'auto', sev: 'high' },
  title_too_long: { title: 'Titles too long for Google', why: 'Google cuts titles at about 60 characters, so the end is lost.', rec: 'Shorten the template so the name comes first and the rest trims.', cls: 'auto', sev: 'low' },
  title_too_short: { title: 'Titles too short', why: 'A one- or two-word title tells Google little.', rec: 'Add what the page is and "Vegans Explore".', cls: 'auto', sev: 'low' },
  no_description: { title: 'Pages with no search description', why: 'Without one, Google picks a random line from the page for the snippet.', rec: 'Write it on the server from the page\'s own data.', cls: 'auto', sev: 'medium' },
  description_too_long: { title: 'Search descriptions too long', why: 'Google cuts them at about 155 characters.', rec: 'Trim the template to about 150 characters.', cls: 'auto', sev: 'low' },
  description_too_short: { title: 'Search descriptions too short', why: 'A short snippet gives people little reason to click.', rec: 'Fill it to 120 to 155 characters from the page\'s data.', cls: 'auto', sev: 'low' },
  no_canonical: { title: 'Pages with no canonical address', why: 'Without it, Google may treat the same page under two addresses as duplicates.', rec: 'Add the canonical tag in the template.', cls: 'auto', sev: 'medium' },
  canonical_elsewhere: { title: 'Pages that point Google to a different address', why: 'Google will index the other address, not this one. Right for duplicates, wrong for real pages in the sitemap.', rec: 'Check each pattern; drop duplicates from the sitemap or correct the canonical.', cls: 'needs_you', sev: 'medium' },
  no_h1: { title: 'Pages with no main heading in the HTML', why: 'Google reads the main heading to understand the page. Ours may be drawn later by script, which Google sees later or not at all.', rec: 'Put the heading in the HTML the server sends.', cls: 'auto', sev: 'low' },
  many_h1: { title: 'Pages with more than one main heading', why: 'Several main headings blur what the page is about.', rec: 'Keep one main heading; make the rest subheadings.', cls: 'auto', sev: 'low' },
  no_share_image: { title: 'Pages with no share picture', why: 'Shared on Facebook, iMessage or Slack, the link shows no picture.', rec: 'Use the page\'s own picture, else our default share image.', cls: 'auto', sev: 'low' },
  img_missing_alt: { title: 'Images with no description (alt text)', why: 'Screen readers and Google image search cannot tell what the picture is.', rec: 'Fill alt text from the page\'s data (the listing name, the dish, the Guide).', cls: 'auto', sev: 'low' },
  slow_response: { title: 'Pages slow to answer (over 4 seconds)', why: 'Slow pages rank lower and lose visitors.', rec: 'Find the slow part (database call or function) and cache it.', cls: 'needs_you', sev: 'medium' },
  dup_title: { title: 'Pages sharing the same title', why: 'Google cannot tell which one to show and may hide some.', rec: 'Make each title name the page\'s own subject.', cls: 'auto', sev: 'medium' },
  dup_description: { title: 'Pages sharing the same search description', why: 'Identical snippets look like copies to Google.', rec: 'Write each description from the page\'s own data.', cls: 'auto', sev: 'low' },
};

async function aggregate(site: string) {
  const all: any[] = []; let from = 0;
  while (true) { const { data } = await db.from('signal_pages').select('url,page_type,title,description,problems,status_code').eq('site', site).not('checked_at', 'is', null).range(from, from + 999); if (!data?.length) break; all.push(...data); if (data.length < 1000) break; from += 1000; }
  const ok = all.filter((p) => p.status_code === 200);
  for (const [field, code] of [['title', 'dup_title'], ['description', 'dup_description']] as const) {
    const seen = new Map<string, any[]>(); for (const p of ok) { const v = (p[field] || '').trim().toLowerCase(); if (v) seen.set(v, [...(seen.get(v) || []), p]); }
    for (const g of seen.values()) if (g.length > 1) for (const p of g) p.problems = [...p.problems, code];
  }
  const groups = new Map<string, { code: string; page_type: string; urls: string[] }>();
  for (const p of all) for (const c of new Set<string>(p.problems)) { const k = c + '|' + p.page_type; const g = groups.get(k) || { code: c, page_type: p.page_type, urls: [] }; g.urls.push(p.url); groups.set(k, g); }
  const now = new Date().toISOString(); const seenKeys = new Set<string>();
  for (const g of groups.values()) {
    const d = CODES[g.code] || { title: g.code, why: '', rec: '', cls: 'needs_you', sev: 'medium' }; seenKeys.add(g.code + '|' + g.page_type);
    const { data: ex } = await db.from('signal_issues').select('id,status').eq('site', site).eq('code', g.code).eq('page_type', g.page_type).maybeSingle();
    const row = { site, code: g.code, page_type: g.page_type, source: 'scan', class: d.cls, severity: d.sev, title: d.title, why: d.why, recommendation: d.rec, affected: g.urls.length, samples: g.urls.slice(0, 8), last_seen: now };
    if (ex) await db.from('signal_issues').update({ ...row, ...(ex.status === 'fixed' ? { status: 'open', fixed_at: null } : {}) }).eq('id', ex.id);
    else await db.from('signal_issues').insert({ ...row, first_seen: now });
  }
  const { data: open } = await db.from('signal_issues').select('id,code,page_type').eq('site', site).eq('source', 'scan').eq('status', 'open');
  let closed = 0; for (const o of open || []) if (!seenKeys.has(o.code + '|' + o.page_type)) { await db.from('signal_issues').update({ status: 'fixed', fixed_at: now, affected: 0 }).eq('id', o.id); closed++; }
  return { pages: all.length, issues: groups.size, closed };
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); })); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const cron = req.headers.get('x-cron-secret'); const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    let allowed = !!cron && cron === (await secret('CRON_SECRET'));
    if (!allowed && token) allowed = token === (await secret('LESARUSS_ADMIN_TOKEN'));
    if (!allowed && token) { const sub = await verifyToken(token); if (sub) { const { data: me } = await db.from('members').select('is_superadmin').eq('id', sub).maybeSingle(); allowed = !!me?.is_superadmin; } }
    if (!allowed) return json({ error: 'forbidden' }, 403);
    const { data: site } = await db.from('signal_sites').select('*').eq('site', body.site || 'vegansexplore.com').maybeSingle();
    if (!site) return json({ error: 'unknown_site' }, 404);

    if (body.action === 'gsc_check') return json(await gscCheck(site));
    if (body.action === 'gsc_urls') return json(await gscUrls(site, Math.min(Math.max(Number(body.days) || 480, 7), 480)));
    if (body.action === 'issues') {
      const { data: issues } = await db.from('signal_issues').select('*').eq('site', site.site).order('status').order('affected', { ascending: false });
      const { data: run } = await db.from('signal_scan_runs').select('*').eq('site', site.site).order('started_at', { ascending: false }).limit(1).maybeSingle();
      return json({ site: site.site, run, issues });
    }
    if (body.action === 'aggregate') return json(await aggregate(site.site));
    if (body.action === 'old_check') {
      const limit = Math.min(Math.max(Number(body.limit) || 80, 1), 150);
      const { data: todo } = await db.from('signal_gsc_urls').select('url').eq('site', site.site).is('checked_at', null).order('impressions', { ascending: false }).limit(limit);
      await pool(todo || [], 6, async (p: any) => { const f = await follow(p.url); await db.from('signal_gsc_urls').update({ status_code: f.status, location: f.location, verdict: f.verdict, checked_at: new Date().toISOString() }).eq('site', site.site).eq('url', p.url); });
      const { count } = await db.from('signal_gsc_urls').select('url', { count: 'exact', head: true }).eq('site', site.site).is('checked_at', null);
      return json({ checked: todo?.length ?? 0, left: count });
    }
    if (body.action === 'scan_start') {
      const { data: running } = await db.from('signal_scan_runs').select('id').eq('site', site.site).eq('status', 'running').maybeSingle();
      if (running) return json({ error: 'already_running', run_id: running.id }, 409);
      const urls = [...new Set(await readSitemap(site.sitemap_url))].filter((u) => { try { return new URL(u).host.replace(/^www\./, '') === site.site; } catch { return false; } });
      const { data: run } = await db.from('signal_scan_runs').insert({ site: site.site, urls_total: urls.length }).select().single();
      for (let i = 0; i < urls.length; i += 500) await db.from('signal_pages').upsert(urls.slice(i, i + 500).map((u) => ({ site: site.site, url: u, page_type: pageType(u), run_id: run.id, checked_at: null })), { onConflict: 'site,url' });
      // pages no longer in the sitemap leave the scan
      const keep = new Set(urls); let from = 0; const gone: string[] = [];
      while (true) { const { data } = await db.from('signal_pages').select('url').eq('site', site.site).range(from, from + 999); if (!data?.length) break; for (const p of data) if (!keep.has(p.url)) gone.push(p.url); if (data.length < 1000) break; from += 1000; }
      for (let i = 0; i < gone.length; i += 200) await db.from('signal_pages').delete().eq('site', site.site).in('url', gone.slice(i, i + 200));
      return json({ run_id: run.id, urls: urls.length, removed: gone.length });
    }
    if (body.action === 'scan_batch') {
      const { data: run } = await db.from('signal_scan_runs').select('*').eq('site', site.site).eq('status', 'running').maybeSingle();
      if (!run) return json({ idle: true });
      const limit = Math.min(Math.max(Number(body.limit) || 60, 1), 150);
      const { data: todo } = await db.from('signal_pages').select('url').eq('site', site.site).is('checked_at', null).limit(limit);
      if (todo?.length) {
        await pool(todo, 6, async (p: any) => { const r = await checkPage(p.url); await db.from('signal_pages').update({ ...r, checked_at: new Date().toISOString(), run_id: run.id }).eq('site', site.site).eq('url', p.url); });
      }
      const { count } = await db.from('signal_pages').select('url', { count: 'exact', head: true }).eq('site', site.site).is('checked_at', null);
      await db.from('signal_scan_runs').update({ urls_done: run.urls_total - (count ?? 0) }).eq('id', run.id);
      if (!count) { const agg = await aggregate(site.site); await db.from('signal_scan_runs').update({ status: 'done', finished_at: new Date().toISOString(), note: JSON.stringify(agg) }).eq('id', run.id); return json({ done: true, checked: todo?.length ?? 0, ...agg }); }
      return json({ checked: todo?.length ?? 0, left: count });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) { return json({ error: String((e as Error).message || e) }, 500); }
});
