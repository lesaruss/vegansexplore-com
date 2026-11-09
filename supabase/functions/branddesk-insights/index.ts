// branddesk-insights: BrandDesk > a brand > Insights and Web (Sean, 2026-11-02: "move the analytics to insights... web analytics, social
// analytics, and let's do SEO as well... analysis will give us a high level overview of how the numbers... ads... the ad results...
// all of the different ad slots... campaigns... all the current campaigns that we're running with clients, with ourselves... drill
// into there to see the reports... web could be more of like a sitemap... Google Console recommendations... the health of the
// website, things that need to be done, almost like the web audit").
//   POST { action, brand, from?, to?, refresh? }   ops (LESARUSS_ADMIN_TOKEN) with as_member a super admin (HQ's BrandDesk), or a
//   super admin's own VE token. Social analytics is ve-social's report (the Depot page, framed); everything else is here.
//   web_analytics {brand, from, to}  Google Analytics 4 for the brand's property: totals against the period before, the trend, pages,
//                                    channels, sources, countries, devices. Likely bots left out, as on Depot > Analytics.
//   seo {brand, from, to}            Google Search Console: clicks, impressions, CTR and position against the period before, queries,
//                                    pages, sitemaps. Not connected until the reader is a user on the property (the answer says so).
//   ads {brand, from, to}            every ad slot on the brand's pages: what fills it, impressions and clicks for the period.
//   campaigns {brand, from, to}      every campaign for the brand: ad campaigns on its slots, its initiatives (campaigns rows), the
//                                    Bounties campaigns and BrandDesk clients' monthly campaigns (Vegans Explore).
//   campaign {brand, kind, id, from, to}  one campaign's report.
//   web_health {brand, refresh?}     the site's health: Google's PageSpeed scores and what failed (mobile), robots.txt, the sitemap
//                                    and a sample of its pages, https, Search Console's sitemaps, the last full audit, and a to-do list.
//   analysis {brand, from, to, refresh?}  Claude reads the numbers above (and ve-social's) and writes the breakdown, only from them.
// Caches in ve_analytics_cache: GA and Search Console 3 hours, site health 12 hours, the analysis 6 hours. verify_jwt is off.
// R (branddesk-production-wing, 2026-11-08): on the 5.x models thinking counts against max_tokens, so every call gets 16000 and a cut-off read is an error, never half an answer.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const H = 3600 * 1000;
// Search Console calls are billed to the LESARUSS Google Cloud project (lesaruss-493806), where the Search Console API is on. The
// reader's own project (studious-optics-499502-m9) is not reachable from Sean's account (2026-11-02); the reader holds Service Usage
// Consumer on lesaruss-493806 so it may use it.
const GSC_PROJECT = 'lesaruss-493806';

// Each brand's site. A brand not listed reads its domain from analytics_connections (config.brand_slug).
const DOMAINS: Record<string, string> = { 'vegans-explore': 'vegansexplore.com', 'sean-a-russell': 'seanarussell.com', 'geekfon-society': 'geekfon.ai' };
// The old Studio audit's slug for a brand (brand_audit_reports).
const AUDIT_SLUG: Record<string, string> = { 'sean-a-russell': 'sar', 'geekfon-society': 'geekfon' };
const BOT_CITIES = ['(not set)', '', 'Frankfurt am Main', 'Singapore', 'Ashburn', 'Boardman', 'Council Bluffs', 'The Dalles', 'Santa Clara', 'Moses Lake', 'Quincy'];
const BOT_FILTER = { notExpression: { orGroup: { expressions: [
  { filter: { fieldName: 'city', inListFilter: { values: BOT_CITIES } } },
  { filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: 'China' } } },
] } } };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isDay = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const day = (t: number) => new Date(t).toISOString().slice(0, 10);
// The period just before: the same number of days, ending the day before `from`.
function prevOf(from: string, to: string) {
  const n = Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1;
  const pt = Date.parse(from) - 864e5;
  return { pf: day(pt - (n - 1) * 864e5), pt: day(pt), days: n };
}

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return (secrets[key] = data?.value ?? null);
}
async function cached<T>(key: string, ttl: number, refresh: boolean, make: () => Promise<T>): Promise<T & { fetched_at?: string; cached?: boolean }> {
  const { data: hit } = await db.from('ve_analytics_cache').select('data, fetched_at').eq('key', key).maybeSingle();
  if (hit && !refresh && (hit.data as any)?.connected !== false && Date.now() - Date.parse(hit.fetched_at) < ttl) return { ...(hit.data as T), fetched_at: hit.fetched_at, cached: true };
  const data = await make();
  const fetched_at = new Date().toISOString();
  // A "not connected" answer is never kept, so connecting a source shows at once (Sean, 2026-11-02: SEO kept saying not connected).
  if (!(data as any)?.error && (data as any)?.connected !== false) await db.from('ve_analytics_cache').upsert({ key, data, fetched_at });
  return { ...data, fetched_at };
}

// ---- Google (the LESARUSS analytics reader: Analytics and Search Console, read only) ----
const b64u = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const gTokens: Record<string, string> = {};
let saEmail = '';
async function gToken(scope: string): Promise<string> {
  if (gTokens[scope]) return gTokens[scope];
  const raw = await secret('GA4_SERVICE_ACCOUNT_JSON');
  if (!raw) throw new Error('no_reader');
  const sa = JSON.parse(raw); saEmail = sa.client_email;
  const now = Math.floor(Date.now() / 1000);
  const input = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const pem = sa.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const jwt = input + '.' + btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const t = await r.json();
  if (!t.access_token) throw new Error('google_token: ' + (t.error_description || t.error || 'no token'));
  return (gTokens[scope] = t.access_token);
}
async function brandSite(brand: string): Promise<{ domain: string | null; property: string | null }> {
  const { data } = await db.from('analytics_connections').select('config, enabled').eq('provider', 'ga4');
  const rows = (data ?? []) as { config: any; enabled: boolean }[];
  const domain = DOMAINS[brand] ?? rows.find((r) => r.config?.brand_slug === brand)?.config?.domain ?? null;
  const row = domain ? rows.find((r) => String(r.config?.domain || '').replace(/^www\./, '') === domain) : null;
  return { domain, property: row?.config?.property_id ?? null };
}

type Row = { d: string[]; m: number[] };
async function gaReport(token: string, property: string, body: Record<string, any>): Promise<Row[]> {
  const f = body.dimensionFilter ? { andGroup: { expressions: [body.dimensionFilter, BOT_FILTER] } } : BOT_FILTER;
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, dimensionFilter: f }),
  });
  const j = await r.json();
  if (j.error) throw new Error('google_report: ' + j.error.message);
  return (j.rows ?? []).map((x: any) => ({ d: (x.dimensionValues ?? []).map((v: any) => v.value), m: (x.metricValues ?? []).map((v: any) => Number(v.value) || 0) }));
}
async function webAnalytics(brand: string, from: string, to: string) {
  const site = await brandSite(brand);
  if (!site.property) return { connected: false, domain: site.domain };
  const token = await gToken('https://www.googleapis.com/auth/analytics.readonly');
  const { pf, pt, days } = prevOf(from, to);
  const both = [{ startDate: from, endDate: to, name: 'cur' }, { startDate: pf, endDate: pt, name: 'prev' }];
  const cur = [{ startDate: from, endDate: to }];
  const grain = days > 120 ? 'yearMonth' : 'date';
  const P = site.property;
  const [totals, trend, pages, channels, sources, countries, devices] = await Promise.all([
    gaReport(token, P, { dateRanges: both, metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration'].map((name) => ({ name })) }),
    gaReport(token, P, { dateRanges: cur, dimensions: [{ name: grain }], metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: grain } }], limit: 400 }),
    gaReport(token, P, { dateRanges: cur, dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'engagementRate' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 50 }),
    gaReport(token, P, { dateRanges: both, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }], limit: 30 }),
    gaReport(token, P, { dateRanges: cur, dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 25 }),
    gaReport(token, P, { dateRanges: cur, dimensions: [{ name: 'country' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: 15 }),
    gaReport(token, P, { dateRanges: cur, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'activeUsers' }] }),
  ]);
  const last = (r: Row) => r.d[r.d.length - 1];
  const T = (r?: Row) => r ? { users: r.m[0], new_users: r.m[1], sessions: r.m[2], views: r.m[3], engagement_rate: r.m[4], avg_session: r.m[5] } : null;
  const zero = { users: 0, new_users: 0, sessions: 0, views: 0, engagement_rate: 0, avg_session: 0 };
  const prevCh = new Map(channels.filter((r) => last(r) === 'prev').map((r) => [r.d[0], r.m[0]]));
  return {
    connected: true, domain: site.domain, property: P, grain, from, to, prev_from: pf, prev_to: pt,
    totals: T(totals.find((r) => last(r) === 'cur')) ?? zero, totals_prev: T(totals.find((r) => last(r) === 'prev')) ?? zero,
    trend: trend.map((r) => ({ t: r.d[0], users: r.m[0], views: r.m[1] })),
    pages: pages.map((r) => ({ path: r.d[0], title: r.d[1], views: r.m[0], users: r.m[1], engagement_rate: r.m[2] })),
    channels: channels.filter((r) => last(r) === 'cur').map((r) => ({ channel: r.d[0], sessions: r.m[0], users: r.m[1], sessions_prev: prevCh.get(r.d[0]) ?? 0 })).sort((a, b) => b.sessions - a.sessions),
    sources: sources.map((r) => ({ source: r.d[0], medium: r.d[1], sessions: r.m[0], users: r.m[1] })),
    countries: countries.map((r) => ({ country: r.d[0], users: r.m[0] })),
    devices: devices.map((r) => ({ device: r.d[0], users: r.m[0] })),
    note: 'Likely bots are left out: visits with no city, from cloud data-center cities, and from China.',
  };
}

// ---- Search Console ----
async function gscSite(domain: string): Promise<{ site: string | null; token: string; sites: string[]; error?: string }> {
  const token = await gToken('https://www.googleapis.com/auth/webmasters.readonly');
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: 'Bearer ' + token, 'x-goog-user-project': GSC_PROJECT } });
  const j = await r.json();
  // Every property the reader was added to, with its level, so a miss says why (Sean added it, the address differs, still unverified).
  const seen: string[] = (j.siteEntry ?? []).map((s: any) => `${s.siteUrl} (${s.permissionLevel})`);
  const sites: string[] = (j.siteEntry ?? []).filter((s: any) => s.permissionLevel !== 'siteUnverifiedUser').map((s: any) => s.siteUrl);
  const want = [`sc-domain:${domain}`, `https://${domain}/`, `https://www.${domain}/`, `http://${domain}/`, `http://www.${domain}/`];
  return { site: want.find((w) => sites.includes(w)) ?? null, token, sites: seen, error: j.error?.message };
}
async function gscQuery(token: string, site: string, body: Record<string, any>) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'x-goog-user-project': GSC_PROJECT }, body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error('search_console: ' + j.error.message);
  return (j.rows ?? []) as { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
}
async function gscSitemaps(token: string, site: string) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`, { headers: { Authorization: 'Bearer ' + token, 'x-goog-user-project': GSC_PROJECT } });
  const j = await r.json();
  return (j.sitemap ?? []).map((s: any) => ({
    path: s.path, last_submitted: s.lastSubmitted ?? null, last_read: s.lastDownloaded ?? null, pending: !!s.isPending,
    errors: Number(s.errors) || 0, warnings: Number(s.warnings) || 0,
    submitted: (s.contents ?? []).reduce((n: number, c: any) => n + (Number(c.submitted) || 0), 0),
  }));
}
async function seo(brand: string, from: string, to: string) {
  const site = await brandSite(brand);
  if (!site.domain) return { connected: false, domain: null };
  const g = await gscSite(site.domain);
  if (!g.site) return { connected: false, domain: site.domain, reader: saEmail, reader_sees: g.sites, google_error: g.error || null };
  const { pf, pt } = prevOf(from, to);
  const tot = (rows: any[]) => rows[0] ? { clicks: rows[0].clicks, impressions: rows[0].impressions, ctr: rows[0].ctr, position: rows[0].position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const [cur, prev, trend, queries, pages, countries, devices, sitemaps] = await Promise.all([
    gscQuery(g.token, g.site, { startDate: from, endDate: to }),
    gscQuery(g.token, g.site, { startDate: pf, endDate: pt }),
    gscQuery(g.token, g.site, { startDate: from, endDate: to, dimensions: ['date'], rowLimit: 400 }),
    gscQuery(g.token, g.site, { startDate: from, endDate: to, dimensions: ['query'], rowLimit: 100 }),
    gscQuery(g.token, g.site, { startDate: from, endDate: to, dimensions: ['page'], rowLimit: 50 }),
    gscQuery(g.token, g.site, { startDate: from, endDate: to, dimensions: ['country'], rowLimit: 10 }),
    gscQuery(g.token, g.site, { startDate: from, endDate: to, dimensions: ['device'], rowLimit: 5 }),
    gscSitemaps(g.token, g.site),
  ]);
  const k = (r: any) => ({ key: r.keys?.[0] ?? '', clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  // Close to page one: shown often, sitting on page two (positions 8 to 20). The quickest wins.
  const nearly = queries.filter((r) => r.position >= 8 && r.position <= 20 && r.impressions >= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 15).map(k);
  return {
    connected: true, domain: site.domain, site: g.site, from, to, prev_from: pf, prev_to: pt,
    totals: tot(cur), totals_prev: tot(prev),
    trend: trend.map((r) => ({ t: r.keys?.[0], clicks: r.clicks, impressions: r.impressions })),
    queries: queries.map(k), pages: pages.map(k), countries: countries.map(k), devices: devices.map(k), nearly, sitemaps,
    note: 'Search Console runs about two days behind.',
  };
}

// ---- Ads ----
async function ads(brand: string, from: string, to: string) {
  const { data: places } = await db.from('ad_placements').select('id, site_name, page_name, page_slug, slot_id, slot_position, dimensions, estimated_monthly_views, status').eq('brand_slug', brand).order('page_slug');
  const ps = (places ?? []) as any[];
  if (!ps.length) return { slots: [], campaigns: [], totals: { impressions: 0, clicks: 0, impressions_prev: 0, clicks_prev: 0 } };
  const ids = ps.map((p) => p.id);
  const { pf, pt } = prevOf(from, to);
  const [{ data: links }, { data: imps }] = await Promise.all([
    db.from('ad_campaign_placements').select('placement_id, campaign_id').in('placement_id', ids),
    db.from('ad_impressions').select('placement_id, campaign_id, log_date, impressions, clicks').in('placement_id', ids).gte('log_date', pf).lte('log_date', to).limit(20000),
  ]);
  const campIds = [...new Set((links ?? []).map((l: any) => l.campaign_id).concat((imps ?? []).map((i: any) => i.campaign_id)).filter(Boolean))];
  const { data: camps } = campIds.length ? await db.from('ad_campaigns').select('id, campaign_name, sponsor_name, creative_url, click_through_url, status, start_date, end_date, created_at, sponsor_campaign_id').in('id', campIds) : { data: [] };
  const C = new Map<string, any>((camps ?? []).map((c: any) => [c.id, c]));
  const spIds = [...new Set((camps ?? []).map((c: any) => c.sponsor_campaign_id).filter(Boolean))];
  const { data: sps } = spIds.length ? await db.from('ad_sponsor_campaigns').select('id, slug, name, sponsor_name, status').in('id', spIds) : { data: [] };
  const S = new Map<string, any>((sps ?? []).map((s: any) => [s.id, s]));
  const live = (c: any) => c && c.status === 'active' && (!c.sponsor_campaign_id || S.get(c.sponsor_campaign_id)?.status === 'active');
  const slots = ps.map((p) => {
    // ad-resolve serves the newest active campaign linked to a slot.
    const linked = (links ?? []).filter((l: any) => l.placement_id === p.id).map((l: any) => C.get(l.campaign_id)).filter(live).sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
    const now = linked[0] ?? null;
    let im = 0, cl = 0, imP = 0, clP = 0;
    for (const i of (imps ?? []) as any[]) if (i.placement_id === p.id) { if (i.log_date >= from) { im += i.impressions; cl += i.clicks; } else if (i.log_date <= pt) { imP += i.impressions; clP += i.clicks; } }
    return {
      id: p.id, page: p.page_name || p.page_slug, page_slug: p.page_slug, slot: p.slot_id, position: p.slot_position, size: p.dimensions, status: p.status,
      est_monthly_views: p.estimated_monthly_views,
      filled_by: now ? { id: now.id, name: now.campaign_name, sponsor: S.get(now.sponsor_campaign_id)?.name ?? now.sponsor_name, creative: now.creative_url } : null,
      impressions: im, clicks: cl, impressions_prev: imP, clicks_prev: clP,
    };
  });
  const byCamp: Record<string, any> = {};
  for (const i of (imps ?? []) as any[]) {
    if (i.log_date < from) continue;
    const c: any = C.get(i.campaign_id); const sp: any = c ? S.get(c.sponsor_campaign_id) : null;
    const k = sp?.id ?? c?.id ?? 'none';
    const v = byCamp[k] ??= { id: sp?.id ?? c?.id ?? null, kind: sp ? 'sponsor' : 'ad', name: sp?.name ?? c?.campaign_name ?? 'Unknown', sponsor: sp?.sponsor_name ?? c?.sponsor_name ?? '', status: sp?.status ?? c?.status ?? '', impressions: 0, clicks: 0 };
    v.impressions += i.impressions; v.clicks += i.clicks;
  }
  // By banner (Sean, 2026-11-08: "running campaigns on specific types of banners so we can track their total impressions and clicks"): one row per
  // banner, every campaign that runs it rolled together. A campaign's banner is its name before the trailing "(...)", so "The Vegan Dairy Guide
  // (ad rails)" and "(house banner)" are one banner, and each page's Humble Cabbage tee is one. Formats are what the parentheses said.
  const bannerOf = (c: any) => String(c?.campaign_name ?? 'Unknown').replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Unknown';
  const fmtOf = (c: any) => { const m = String(c?.campaign_name ?? '').match(/\(([^)]*)\)\s*$/); const f = m ? m[1] : ''; return /^(ad rails|house banner)$/i.test(f) ? f : f ? 'page slots' : ''; };
  const byBan: Record<string, any> = {};
  const ban = (c: any) => {
    const k = bannerOf(c), sp: any = c ? S.get(c.sponsor_campaign_id) : null;
    return byBan[k] ??= { name: k, sponsor: sp?.sponsor_name ?? c?.sponsor_name ?? '', creative: c?.creative_url ?? '', formats: new Set<string>(), slots: new Set<string>(), running: false, campaigns: new Set<string>(), impressions: 0, clicks: 0, impressions_prev: 0, clicks_prev: 0 };
  };
  for (const i of (imps ?? []) as any[]) {
    const c: any = C.get(i.campaign_id); if (!c) continue;
    const v = ban(c); v.campaigns.add(c.id); const f = fmtOf(c); if (f) v.formats.add(f);
    if (i.log_date >= from) { v.impressions += i.impressions; v.clicks += i.clicks; v.slots.add(i.placement_id); }
    else if (i.log_date <= pt) { v.impressions_prev += i.impressions; v.clicks_prev += i.clicks; }
  }
  for (const l of (links ?? []) as any[]) {
    const c: any = C.get(l.campaign_id); if (!live(c)) continue;
    const v = ban(c); v.running = true; v.slots.add(l.placement_id); v.campaigns.add(c.id); const f = fmtOf(c); if (f) v.formats.add(f);
  }
  const banners = Object.values(byBan).map((v: any) => ({ ...v, formats: [...v.formats], slots: v.slots.size, campaigns: v.campaigns.size }))
    .filter((v: any) => v.running || v.impressions || v.clicks).sort((a: any, b: any) => (b.impressions - a.impressions) || a.name.localeCompare(b.name));
  const sum = (k: 'impressions' | 'clicks' | 'impressions_prev' | 'clicks_prev') => slots.reduce((n, s) => n + s[k], 0);
  return {
    from, to, prev_from: pf, prev_to: pt, slots, banners,
    campaigns: Object.values(byCamp).sort((a: any, b: any) => b.impressions - a.impressions),
    totals: { impressions: sum('impressions'), clicks: sum('clicks'), impressions_prev: sum('impressions_prev'), clicks_prev: sum('clicks_prev'), slots: slots.length, filled: slots.filter((s) => s.filled_by).length },
  };
}

// ---- Campaigns ----
const INITIATIVE_PREFIX: Record<string, string> = { 'vegans-explore': 'vegans-explore-initiative-' };
async function campaigns(brand: string, from: string, to: string) {
  const list: any[] = [];
  // Ad campaigns running on the brand's slots.
  const a = await ads(brand, from, to);
  const { data: allSp } = await db.from('ad_sponsor_campaigns').select('id, slug, name, sponsor_name, status, start_date, end_date, goal, paid, link_initiative');
  const seen = new Set(a.campaigns.filter((c: any) => c.kind === 'sponsor').map((c: any) => c.id));
  // A sponsor campaign belongs here when its ads ran on this brand's slots in the period or it is linked to one of them now.
  const { data: slotLinks } = a.slots.length ? await db.from('ad_campaign_placements').select('campaign_id, ad_campaigns!inner(sponsor_campaign_id)').in('placement_id', a.slots.map((s: any) => s.id)) : { data: [] };
  for (const l of (slotLinks ?? []) as any[]) if (l.ad_campaigns?.sponsor_campaign_id) seen.add(l.ad_campaigns.sponsor_campaign_id);
  for (const s of (allSp ?? []) as any[]) {
    if (!seen.has(s.id)) continue;
    const m = a.campaigns.find((c: any) => c.id === s.id);
    list.push({ kind: 'ads', id: s.id, name: s.name, who: s.sponsor_name, status: s.status, starts: s.start_date, ends: s.end_date,
      line: `${(m?.impressions ?? 0).toLocaleString()} impressions, ${(m?.clicks ?? 0).toLocaleString()} clicks in the period`, impressions: m?.impressions ?? 0, clicks: m?.clicks ?? 0 });
  }
  // The brand's initiatives (campaigns rows): its own, and for Vegans Explore every vegans-explore-initiative-*.
  const pre = INITIATIVE_PREFIX[brand];
  let q = db.from('campaigns').select('id, slug, brand_name, tagline, status, lifecycle_stage, region, initiative_slug, prototype_url, launched_at');
  q = pre ? q.or(`slug.eq.${brand},initiative_slug.like.${pre}*`) : q.eq('slug', brand);
  const { data: inits } = await q;
  const slugs = (inits ?? []).map((i: any) => i.initiative_slug).filter(Boolean);
  const [{ data: interest }, { data: clicks }] = await Promise.all([
    slugs.length ? db.from('ve_initiative_interest').select('initiative_slug, created_at').in('initiative_slug', slugs).gte('created_at', from).limit(20000) : Promise.resolve({ data: [] }),
    slugs.length ? db.from('ve_link_clicks').select('initiative_slug, clicked_at').in('initiative_slug', slugs).eq('is_bot', false).gte('clicked_at', from).limit(20000) : Promise.resolve({ data: [] }),
  ]);
  for (const i of (inits ?? []) as any[]) {
    const ii = (interest ?? []).filter((x: any) => x.initiative_slug === i.initiative_slug && x.created_at.slice(0, 10) <= to).length;
    const cc = (clicks ?? []).filter((x: any) => x.initiative_slug === i.initiative_slug && x.clicked_at.slice(0, 10) <= to).length;
    list.push({ kind: 'initiative', id: i.id, name: i.brand_name, who: i.region || '', status: i.status, stage: i.lifecycle_stage, tagline: i.tagline, page: i.prototype_url,
      line: i.initiative_slug ? `${ii} interested, ${cc} link clicks in the period` : 'No tracked links yet', interest: ii, clicks: cc });
  }
  if (brand === 'vegans-explore') {
    const [{ data: bc }, { data: bd }] = await Promise.all([
      db.from('ve_bounty_campaigns').select('id, slug, title, community_slug, kind, status, starts_at, ends_at').in('status', ['open', 'proposed', 'running']),
      db.from('ve_branddesk_campaigns').select('id, kind, month, status, starts_at, listing_id, listings(name)').not('status', 'in', '(skipped)').order('month', { ascending: false }).limit(200),
    ]);
    for (const b of (bc ?? []) as any[]) list.push({ kind: 'bounty', id: b.id, name: b.title, who: b.community_slug, status: b.status, starts: b.starts_at, ends: b.ends_at, line: 'Bounties for members' });
    for (const b of (bd ?? []) as any[]) list.push({ kind: 'client', id: b.id, name: `${String(b.kind).replace(/_/g, ' ')}, ${b.month?.slice(0, 7)}`, who: b.listings?.name || 'Client', status: b.status, starts: b.starts_at, line: 'BrandDesk client campaign' });
  }
  return { from, to, campaigns: list };
}
async function campaign(brand: string, kind: string, id: string, from: string, to: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: 'bad_id' };
  if (kind === 'ads') {
    const { data: sp } = await db.from('ad_sponsor_campaigns').select('*').eq('id', id).maybeSingle();
    if (!sp) return { error: 'not_found' };
    const { data: cs } = await db.from('ad_campaigns').select('id, campaign_name, creative_url, click_through_url, status').eq('sponsor_campaign_id', id);
    const cids = (cs ?? []).map((c: any) => c.id);
    const { data: imps } = cids.length ? await db.from('ad_impressions').select('placement_id, campaign_id, log_date, impressions, clicks').in('campaign_id', cids).gte('log_date', from).lte('log_date', to).limit(20000) : { data: [] };
    const pids = [...new Set((imps ?? []).map((i: any) => i.placement_id))];
    const { data: pl } = pids.length ? await db.from('ad_placements').select('id, brand_slug, page_name, page_slug, slot_id, dimensions').in('id', pids) : { data: [] };
    const P = new Map<string, any>((pl ?? []).map((p: any) => [p.id, p]));
    const days: Record<string, { impressions: number; clicks: number }> = {}, bySlot: Record<string, any> = {}, byAd: Record<string, any> = {};
    for (const i of (imps ?? []) as any[]) {
      const p: any = P.get(i.placement_id); if (!p || p.brand_slug !== brand) continue;
      const d = days[i.log_date] ??= { impressions: 0, clicks: 0 }; d.impressions += i.impressions; d.clicks += i.clicks;
      const s = bySlot[i.placement_id] ??= { page: p.page_name || p.page_slug, slot: p.slot_id, size: p.dimensions, impressions: 0, clicks: 0 }; s.impressions += i.impressions; s.clicks += i.clicks;
      const c: any = (cs ?? []).find((x: any) => x.id === i.campaign_id);
      const a = byAd[i.campaign_id] ??= { name: c?.campaign_name, creative: c?.creative_url, link: c?.click_through_url, impressions: 0, clicks: 0 }; a.impressions += i.impressions; a.clicks += i.clicks;
    }
    let linkClicks: any[] = [];
    if (sp.link_initiative) {
      const { data: lc } = await db.from('ve_link_clicks').select('clicked_at, member_id').eq('initiative_slug', sp.link_initiative).eq('is_bot', false).gte('clicked_at', from).limit(5000);
      linkClicks = (lc ?? []).filter((x: any) => x.clicked_at.slice(0, 10) <= to);
    }
    return { kind, campaign: { id: sp.id, name: sp.name, sponsor: sp.sponsor_name, status: sp.status, starts: sp.start_date, ends: sp.end_date, goal: sp.goal, paid: sp.paid, budget_cents: sp.budget_cents, notes: sp.notes },
      days: Object.entries(days).map(([t, v]) => ({ t, ...v })).sort((a, b) => a.t.localeCompare(b.t)),
      slots: Object.values(bySlot).sort((a: any, b: any) => b.impressions - a.impressions), ads: Object.values(byAd).sort((a: any, b: any) => b.impressions - a.impressions),
      tracked_clicks: linkClicks.length, tracked_members: new Set(linkClicks.map((x) => x.member_id).filter(Boolean)).size };
  }
  if (kind === 'initiative') {
    const { data: c } = await db.from('campaigns').select('*').eq('id', id).maybeSingle();
    if (!c) return { error: 'not_found' };
    const slug = c.initiative_slug;
    const [{ data: interest }, { data: links }, { data: clicks }] = slug ? await Promise.all([
      db.from('ve_initiative_interest').select('action_type, tier_label, created_at, name, tags').eq('initiative_slug', slug).order('created_at', { ascending: false }).limit(500),
      db.from('ve_links').select('code, label, channel, clicks, last_click_at, recipient_name').eq('initiative_slug', slug).order('clicks', { ascending: false }).limit(100),
      db.from('ve_link_clicks').select('clicked_at').eq('initiative_slug', slug).eq('is_bot', false).gte('clicked_at', from).limit(10000),
    ]) : [{ data: [] }, { data: [] }, { data: [] }];
    const actions: Record<string, number> = {};
    for (const i of (interest ?? []) as any[]) actions[i.action_type || 'other'] = (actions[i.action_type || 'other'] ?? 0) + 1;
    const days: Record<string, number> = {};
    for (const x of (clicks ?? []) as any[]) { const d = x.clicked_at.slice(0, 10); if (d <= to) days[d] = (days[d] ?? 0) + 1; }
    return { kind, campaign: { id: c.id, name: c.brand_name, tagline: c.tagline, status: c.status, stage: c.lifecycle_stage, region: c.region, page: c.prototype_url, initiative: slug },
      interest_total: (interest ?? []).length, actions, recent: (interest ?? []).slice(0, 25).map((i: any) => ({ at: i.created_at, what: i.action_type, tier: i.tier_label, name: i.name ? String(i.name).split(' ')[0] : null })),
      links: links ?? [], click_days: Object.entries(days).map(([t, n]) => ({ t, clicks: n })).sort((a, b) => a.t.localeCompare(b.t)) };
  }
  if (kind === 'bounty') {
    const { data: c } = await db.from('ve_bounty_campaigns').select('*').eq('id', id).maybeSingle();
    if (!c) return { error: 'not_found' };
    const { data: jobs } = await db.from('ve_bounties').select('id, title, status, points').eq('campaign_id', id).limit(500);
    const jids = (jobs ?? []).map((j: any) => j.id);
    const { data: subs } = jids.length ? await db.from('ve_bounty_submissions').select('bounty_id, status').in('bounty_id', jids).limit(5000) : { data: [] };
    const st: Record<string, number> = {};
    for (const s of (subs ?? []) as any[]) st[s.status] = (st[s.status] ?? 0) + 1;
    return { kind, campaign: { id: c.id, name: c.title, story: c.story, status: c.status, chapter: c.community_slug, starts: c.starts_at, ends: c.ends_at, slug: c.slug },
      jobs: (jobs ?? []).length, open_jobs: (jobs ?? []).filter((j: any) => j.status === 'open').length, submissions: st };
  }
  if (kind === 'client') {
    const { data: c } = await db.from('ve_branddesk_campaigns').select('*, listings(name, slug)').eq('id', id).maybeSingle();
    if (!c) return { error: 'not_found' };
    return { kind, campaign: { id: c.id, name: String(c.kind).replace(/_/g, ' '), client: c.listings?.name, slug: c.listings?.slug, month: c.month, status: c.status, starts: c.starts_at, ends: c.ends_at, note: c.note }, checks: c.checks, results: c.results };
  }
  return { error: 'bad_kind' };
}

// ---- Site health ----
async function fetchText(url: string, ms = 12000): Promise<{ status: number; text: string; final: string; error?: string }> {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LESARUSS-BrandDesk/1.0; +https://hq.lesaruss.ai)' } });
    return { status: r.status, text: (await r.text()).slice(0, 3_000_000), final: r.url };
  } catch (e) { return { status: 0, text: '', final: url, error: String((e as Error).message || e) }; }
}
async function webHealth(brand: string) {
  const site = await brandSite(brand);
  if (!site.domain) return { error: 'no_site' };
  const home = `https://${site.domain}/`;
  const psKey = await secret('GOOGLE_PAGESPEED_API_KEY');
  const psUrl = (strategy: string) => `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(home)}&strategy=${strategy}` +
    ['performance', 'accessibility', 'best-practices', 'seo'].map((c) => `&category=${c}`).join('') + (psKey ? `&key=${psKey}` : '');
  const [ps, robots, http, homeRes] = await Promise.all([
    fetch(psUrl('mobile'), { signal: AbortSignal.timeout(90000) }).then((r) => r.json()).catch((e) => ({ error: { message: String(e) } })),
    fetchText(`https://${site.domain}/robots.txt`),
    fetch(`http://${site.domain}/`, { redirect: 'manual', signal: AbortSignal.timeout(10000) }).then((r) => ({ status: r.status, to: r.headers.get('location') })).catch(() => ({ status: 0, to: null })),
    fetchText(home),
  ]);
  // The sitemap: robots.txt names it, else /sitemap.xml. An index lists other sitemaps; read up to 5 of them.
  const named = [...robots.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const smUrl = named[0] || `https://${site.domain}/sitemap.xml`;
  const sm = await fetchText(smUrl);
  let urls: string[] = [];
  const locs = (t: string) => [...t.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(sm.text)) {
    for (const child of locs(sm.text).slice(0, 5)) urls = urls.concat(locs((await fetchText(child)).text));
  } else urls = locs(sm.text);
  // A sample: up to 12 pages spread through the sitemap, each read once.
  const step = Math.max(1, Math.floor(urls.length / 12));
  const sample = urls.filter((_, i) => i % step === 0).slice(0, 12);
  const checked = await Promise.all(sample.map(async (u) => {
    const r = await fetchText(u, 10000);
    const t = r.text;
    const title = (/<title[^>]*>([^<]*)<\/title>/i.exec(t)?.[1] || '').trim();
    const desc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i.exec(t)?.[1] ?? null;
    const noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(t);
    const canon = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i.exec(t)?.[1] ?? null;
    return { url: u, status: r.status, title, has_description: !!desc, noindex, canonical: canon };
  }));
  // Google's audits that did not pass, most weight first.
  const lh = ps?.lighthouseResult;
  const cats = lh?.categories ? Object.fromEntries(Object.entries(lh.categories).map(([k, v]: any) => [k, Math.round((v.score ?? 0) * 100)])) : null;
  const failed: any[] = [];
  if (lh) for (const [cat, c] of Object.entries(lh.categories) as any) for (const ref of c.auditRefs ?? []) {
    const a = lh.audits?.[ref.id];
    if (!a || a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'informative' || a.scoreDisplayMode === 'manual' || a.score === null || a.score >= 0.9) continue;
    failed.push({ area: cat, id: ref.id, title: a.title, detail: a.displayValue || '', weight: ref.weight || 0, score: a.score });
  }
  failed.sort((a, b) => b.weight - a.weight || a.score - b.score);
  const vitals = lh ? ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((k) => ({ key: k, title: lh.audits?.[k]?.title, value: lh.audits?.[k]?.displayValue, score: lh.audits?.[k]?.score })) : [];
  // Search Console's view of the sitemaps, when the reader can see the property.
  let gsc: any = null;
  try { const g = await gscSite(site.domain); gsc = g.site ? { connected: true, site: g.site, sitemaps: await gscSitemaps(g.token, g.site) } : { connected: false, reader: saEmail }; } catch (e) { gsc = { connected: false, error: String((e as Error).message || e) }; }
  const { data: audit } = await db.from('brand_audit_reports').select('audited_at, summary, ada_score, wave_score, performance_pct, accessibility_pct, ada_violations, ada_violations_critical, ada_violations_serious, next_steps, domain_ssl_ok')
    .eq('brand_slug', AUDIT_SLUG[brand] ?? brand).order('audited_at', { ascending: false }).limit(1).maybeSingle();

  // The to-do list: the site's own checks first, then Google's failed audits.
  const todo: { level: 'fix' | 'review'; area: string; title: string; detail: string }[] = [];
  if (homeRes.status !== 200) todo.push({ level: 'fix', area: 'Site', title: 'The home page did not open', detail: homeRes.error || `It answered ${homeRes.status}.` });
  if (!(http.status >= 300 && http.status < 400 && String(http.to || '').startsWith('https://'))) todo.push({ level: 'fix', area: 'Security', title: 'http:// does not send people to https://', detail: `http://${site.domain}/ answered ${http.status || 'nothing'}.` });
  if (robots.status !== 200) todo.push({ level: 'review', area: 'Search', title: 'No robots.txt', detail: `robots.txt answered ${robots.status || 'nothing'}. It should name the sitemap.` });
  else if (!named.length) todo.push({ level: 'review', area: 'Search', title: 'robots.txt does not name the sitemap', detail: 'Add a line: Sitemap: https://' + site.domain + '/sitemap.xml' });
  if (!urls.length) todo.push({ level: 'fix', area: 'Search', title: 'No sitemap', detail: `${smUrl} answered ${sm.status || 'nothing'} with no pages in it.` });
  const broken = checked.filter((c) => c.status !== 200);
  if (broken.length) todo.push({ level: 'fix', area: 'Search', title: `${broken.length} sitemap page${broken.length > 1 ? 's' : ''} did not open`, detail: broken.map((b) => `${b.url} (${b.status || 'no answer'})`).join(', ') });
  const noTitle = checked.filter((c) => c.status === 200 && !c.title);
  if (noTitle.length) todo.push({ level: 'fix', area: 'Search', title: 'Pages with no title', detail: noTitle.map((c) => c.url).join(', ') });
  const noDesc = checked.filter((c) => c.status === 200 && !c.has_description);
  if (noDesc.length) todo.push({ level: 'review', area: 'Search', title: 'Pages with no search description', detail: noDesc.map((c) => c.url).join(', ') });
  const hidden = checked.filter((c) => c.noindex);
  if (hidden.length) todo.push({ level: 'fix', area: 'Search', title: 'Sitemap pages marked not to be found (noindex)', detail: hidden.map((c) => c.url).join(', ') });
  for (const s of gsc?.sitemaps ?? []) if (s.errors) todo.push({ level: 'fix', area: 'Search Console', title: `Sitemap errors: ${s.path}`, detail: `${s.errors} errors, ${s.warnings} warnings.` });
  for (const f of failed.slice(0, 20)) todo.push({ level: f.score < 0.5 ? 'fix' : 'review', area: ({ performance: 'Speed', accessibility: 'Accessibility', 'best-practices': 'Best practices', seo: 'Search' } as any)[f.area] || f.area, title: f.title, detail: f.detail });

  return {
    domain: site.domain, home, checked_at: new Date().toISOString(),
    pagespeed: cats ? { strategy: 'mobile', scores: cats, vitals, failed: failed.slice(0, 40) } : { error: ps?.error?.message || 'PageSpeed did not answer' },
    https: { redirects: http.status >= 300 && http.status < 400 && String(http.to || '').startsWith('https://'), status: http.status, to: http.to },
    robots: { status: robots.status, names_sitemap: named },
    sitemap: { url: smUrl, status: sm.status, pages: urls.length, sample: checked },
    search_console: gsc, audit: audit ?? null, todo,
  };
}

// ---- The analysis ----
// ---- Podcast (Captivate; Sean, 2026-11-04: "we don't have podcast analytics in the BrandDesk, in that Insights section") ----
// Captivate's API (probed 2026-11-04 through a one-time function): GET /insights/<show>/overview?start&end -> {hits} (downloads;
// start included, end excluded, so a day is start=d end=d+1; no dates = all time), GET /insights/<show>/overview/<episode>?start&end
// -> the same for one episode, GET /insights/<show>/monthly -> the last 12 months. No listeners, apps, devices or places endpoint
// exists (every guess was a 404), so those stay in Captivate's own dashboard. A brand's show is added to PODCAST_SHOWS.
const CAPTIVATE = 'https://api.captivate.fm';
// A brand's shows, in the order the picker lists them (ids from Captivate's GET /users/<user>/shows, 2026-11-04). Sean: "we have multiple
// podcasts from this brand". The first is the default. Captivate also holds "Vegans Explore Network Exclusives", not tracked here.
const PODCAST_SHOWS: Record<string, { key: string; id: string; name: string }[]> = {
  'vegans-explore': [
    { key: 'vegans-explore', id: '5f0184ac-771d-41be-9db2-49f08fc0b880', name: 'Vegans Explore Podcast' },
    { key: 'soflo-vegans', id: '7769096f-5501-4afc-999a-32dbc14acd64', name: 'SoFlo Vegans Podcast' },
    { key: 'vegans-who-lift', id: 'aa00615c-803d-49f0-96f3-abefd0aae76d', name: 'Vegans Who Lift Podcast' },
    { key: 'pre-vegans', id: 'a491b80c-1d83-411d-b2b8-e63325194915', name: 'Pre-Vegans Podcast' },
  ],
  // Brooke Sellers co-hosts Vegans Who Lift, so her BrandDesk Insights shows it too (brooke-sellers B3, 2026-11-08). The same Captivate show.
  'meatless-muscle': [
    { key: 'vegans-who-lift', id: 'aa00615c-803d-49f0-96f3-abefd0aae76d', name: 'Vegans Who Lift Podcast' },
  ],
};
const showOf = (brand: string, key?: unknown) => { const l = PODCAST_SHOWS[brand]; return l ? (l.find((x) => x.key === String(key || '')) || (key ? null : l[0])) : null; };
const plusDays = (d: string, n: number) => day(Date.parse(d) + n * 864e5);
async function capToken(): Promise<string> {
  const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'captivate').maybeSingle();
  const userId = conn?.config?.user_id;
  const key = await secret(conn?.config?.api_key_secret || 'VE_CAPTIVATE_API_KEY');
  if (!userId || !key) throw new Error('Captivate is not configured');
  const af = new FormData(); af.append('username', String(userId)); af.append('token', key);
  const ar = await fetch(`${CAPTIVATE}/authenticate/token`, { method: 'POST', body: af });
  const token = (await ar.json().catch(() => ({})))?.user?.token;
  if (!token) throw new Error(`Captivate refused the key (${ar.status})`);
  return token;
}
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
// ---- The podcast, any period (Logan, 2026-11-04: "if we do all time, every time you pull information, we could do a custom... use our sorters... and do it for all of
// the podcasts"). One all-time daily series per show is read from Captivate (POST /insights/<show>/over-time, interval 1d, days at Eastern midnight) and kept 3 hours;
// every period, comparison and custom range is then cut from it with no new calls. What cannot be cut from daily totals is asked for the period: the audience
// (POST /insights/<show>/range, types byLocation, byUserAgentBrowser, byUserAgentOs, byUserAgentDevice, countryCode null) and each episode's downloads
// (POST /insights/<show>/overview/range, unix seconds, one call for every episode). A show's first 7 and 30 days of each episode are counted once, when they are over,
// and kept in ve_podcast_episode_firsts.
const etDay = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
function etStart(d: string): number { // the instant an Eastern day begins
  for (const off of [4, 5]) { const t = Date.parse(d + 'T00:00:00Z') + off * 3600e3; if (etDay(t) === d && etDay(t - 1) !== d) return t; }
  return Date.parse(d + 'T05:00:00Z');
}
const sec = (ms: number) => Math.floor(ms / 1000);
let capTok: { t: string; at: number } | null = null;
async function capReq(path: string, body?: unknown): Promise<any> {
  if (!capTok || Date.now() - capTok.at > 20 * 60e3) capTok = { t: await capToken(), at: Date.now() };
  const r = await fetch(CAPTIVATE + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${capTok.t}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`Captivate ${r.status} on ${path.split('?')[0].replace(/[0-9a-f-]{36}/g, '<id>')}`);
  return r.json();
}
async function podEpisodeList(brand: string, sh: { key: string; id: string }, refresh: boolean) {
  return cached(`ins:podeps:${brand}:${sh.key}`, 1 * H, refresh, async () => {
    const j = await capReq(`/shows/${sh.id}/episodes`);
    const now = Date.now();
    const list = (j?.episodes || []).filter((e: any) => String(e.status || '').toLowerCase() === 'published' && Date.parse(e.published_date) <= now)
      .map((e: any) => ({ id: e.id, title: e.title, published: etDay(Date.parse(e.published_date)), art: e.episode_art || null, number: e.itunes_episode ?? e.episode_number ?? null }))
      .sort((a: any, b: any) => b.published.localeCompare(a.published));
    return { connected: true, list };
  });
}
async function podSeries(brand: string, sh: { key: string; id: string }, refresh: boolean) {
  return cached(`ins:podseries:${brand}:${sh.key}`, 3 * H, refresh, async () => {
    const eps: any = await podEpisodeList(brand, sh, false);
    const first = eps.list.length ? eps.list[eps.list.length - 1].published : '2020-01-01';
    const j = await capReq(`/insights/${sh.id}/over-time`, { gteUnix: sec(etStart(plusDays(first, -1))), lteUnix: sec(Date.now()), interval: '1d' });
    const days = (j?.overTime || []).map((p: any) => ({ d: etDay(Number(p.timestamp)), v: Number(p.total) || 0 }));
    return { connected: true, days, total: Number(j?.total) || 0 };
  });
}
const sliceSum = (days: { d: string; v: number }[], a: string, b: string) => { let n = 0; for (const x of days) if (x.d >= a && x.d <= b) n += x.v; return n; };

async function podOverview(brand: string, sh: any, from: string, to: string, refresh: boolean) {
  const [ser, eps]: any[] = await Promise.all([podSeries(brand, sh, refresh), podEpisodeList(brand, sh, refresh)]);
  const days: { d: string; v: number }[] = ser.days;
  const firstDay = (days.find((x) => x.v > 0) || days[0] || { d: from }).d;
  const f = from < firstDay ? firstDay : from;
  if (f > to) return { error: 'no_data_in_period' };
  const { pf, pt, days: n } = prevOf(f, to);
  const hasPrev = pt >= firstDay;
  const step = Math.max(1, Math.ceil(n / 30));
  const series: { t: string; v: number }[] = [];
  for (let s = f; s <= to; s = plusDays(s, step)) { const e = plusDays(s, step - 1); series.push({ t: s, v: sliceSum(days, s, e > to ? to : e) }); }
  const mon = new Map<string, number>(); const lab = new Map<string, string>();
  for (const x of days) { const k = x.d.slice(0, 4) + x.d.slice(5, 7); mon.set(k, (mon.get(k) || 0) + x.v); lab.set(k, new Date(x.d.slice(0, 7) + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })); }
  const months = [...mon.entries()].sort().slice(-24).map(([t, v]) => ({ t, v, label: lab.get(t) }));
  const today = etDay(Date.now()), yest = plusDays(today, -1);
  const cur = sliceSum(days, f, to);
  return {
    connected: true, show: sh.key, show_name: sh.name, shows: PODCAST_SHOWS[brand].map((x) => ({ key: x.key, name: x.name })), part: 'overview',
    from: f, to, prev_from: hasPrev ? pf : null, prev_to: hasPrev ? pt : null, days: n, step, first_day: firstDay,
    totals: { downloads: cur, prev: hasPrev ? sliceSum(days, pf, pt) : null, per_day: Math.round((cur / n) * 10) / 10,
      this_month: sliceSum(days, today.slice(0, 8) + '01', yest), past_12_months: sliceSum(days, plusDays(yest, -364), yest), all_time: ser.total || sliceSum(days, '2000-01-01', yest),
      episodes_out: eps.list.filter((e: any) => e.published >= f && e.published <= to).length, episodes_total: eps.list.length },
    series, months, errors: [],
    note: 'Downloads are what Captivate counts: an episode file fetched by an app or a browser, with its own bot filtering. Every period is cut from one daily record of the show.',
  };
}

// Country names from Captivate to the ISO codes its range call needs to give provinces and cities (probed 2026-11-04: countryCode "US" works, "us" and "United States" return nothing).
let _cc: Map<string, string> | null = null;
function ccMap() {
  if (_cc) return _cc;
  _cc = new Map();
  const dn = new Intl.DisplayNames(['en'], { type: 'region' });
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const a of A) for (const b of A) { const c = a + b; let n: string | undefined; try { n = dn.of(c); } catch { continue; } if (n && n !== c && !/^unknown/i.test(n)) _cc.set(n.toLowerCase(), c); }
  for (const [n, c] of Object.entries({ turkey: 'TR', 'czech republic': 'CZ', russia: 'RU', 'south korea': 'KR', vietnam: 'VN', 'hong kong': 'HK', taiwan: 'TW', macau: 'MO', palestine: 'PS', myanmar: 'MM', 'ivory coast': 'CI', 'united states': 'US', 'united kingdom': 'GB', 'north macedonia': 'MK', 'republic of korea': 'KR' })) _cc.set(n, c);
  return _cc;
}
const topN = (a: any[], k: string, n: number) => (a || []).map((x) => ({ name: String(x[k] ?? 'Unknown'), total: Number(x.total) || 0 })).sort((p, q) => q.total - p.total).slice(0, n);

// Every country, with every province and city inside it, for one show over a period (one range call for the whole picture, then one for each country). Sean, 2026-11-04:
// "the places are really important... both the country and the cities and provinces", to set beside Google's places to decide the next community.
async function podAudience(brand: string, sh: any, from: string, to: string, refresh: boolean) {
  return cached(`ins:podaud2:${brand}:${sh.key}:${from}:${to}`, 3 * H, refresh, async () => {
    const win = { start: new Date(etStart(from)).toISOString(), end: new Date(etStart(plusDays(to, 1))).toISOString(), timezone: 'America/New_York', interval: null };
    const j = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: null, types: ['byLocation', 'byUserAgentBrowser', 'byUserAgentOs', 'byUserAgentDevice'] });
    const base = (j?.byLocation?.byCountry || []).map((x: any) => ({ name: String(x.country), total: Number(x.total) || 0 })).filter((x: any) => x.total > 0).sort((a: any, b: any) => b.total - a.total);
    const map = ccMap();
    const errors: string[] = [];
    const countries = await pool(base, 8, async (c: any) => {
      const code = map.get(c.name.toLowerCase()) || null;
      const row: any = { name: c.name, code, total: c.total, provinces: [], cities: [] };
      if (!code) return row;
      try {
        const d = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: code, types: ['byLocation'] });
        row.provinces = (d?.byLocation?.byProvince || []).map((p: any) => ({ name: String(p.province ?? 'Unknown'), total: Number(p.total) || 0 })).sort((a: any, b: any) => b.total - a.total);
        row.cities = (d?.byLocation?.byCity || []).map((p: any) => ({ name: String(p.city ?? 'Unknown'), province: p.province ?? null, total: Number(p.total) || 0 })).sort((a: any, b: any) => b.total - a.total);
      } catch (e) { errors.push(`${c.name}: ${(e as Error).message}`); }
      return row;
    });
    return { connected: true, show: sh.key, show_name: sh.name, part: 'audience', from, to, total: Number(j?.total) || 0, countries,
      apps: topN(j?.byUserAgentBrowser, 'browser', 40), systems: topN(j?.byUserAgentOs, 'os', 20), devices: topN(j?.byUserAgentDevice, 'device', 20), errors: errors.slice(0, 5),
      note: 'Captivate\'s own range report for the period, so its total can differ a little from the daily downloads on Overview, which are cut from its day by day record. A province or city is only known where the listener\'s network gives one; many downloads have a country and nothing more.' };
  });
}
// All of our podcasts together: the four shows' places, apps and devices added up by name.
async function podAudienceAll(brand: string, from: string, to: string, refresh: boolean) {
  const parts: any[] = await Promise.all(PODCAST_SHOWS[brand].map((s) => podAudience(brand, s, from, to, refresh)));
  const add = (m: Map<string, any>, k: string, v: any, n: number) => { const o = m.get(k); if (o) o.total += n; else m.set(k, { ...v, total: n }); };
  const cm = new Map<string, any>(), ap = new Map<string, any>(), sy = new Map<string, any>(), dv = new Map<string, any>();
  for (const p of parts) {
    for (const c of p.countries) {
      if (!cm.has(c.name)) cm.set(c.name, { name: c.name, code: c.code, total: 0, provinces: new Map(), cities: new Map() });
      const o = cm.get(c.name); o.total += c.total;
      for (const x of c.provinces) add(o.provinces, x.name, { name: x.name }, x.total);
      for (const x of c.cities) add(o.cities, x.name + '|' + (x.province || ''), { name: x.name, province: x.province }, x.total);
    }
    for (const x of p.apps) add(ap, x.name, { name: x.name }, x.total);
    for (const x of p.systems) add(sy, x.name, { name: x.name }, x.total);
    for (const x of p.devices) add(dv, x.name, { name: x.name }, x.total);
  }
  const arr = (m: Map<string, any>) => [...m.values()].sort((a, b) => b.total - a.total);
  return { connected: true, show: 'all', show_name: 'All podcasts', part: 'audience', from, to, total: parts.reduce((n, p) => n + p.total, 0),
    countries: arr(cm).map((c) => ({ name: c.name, code: c.code, total: c.total, provinces: arr(c.provinces), cities: arr(c.cities) })),
    apps: arr(ap).slice(0, 40), systems: arr(sy).slice(0, 20), devices: arr(dv).slice(0, 20), errors: parts.flatMap((p) => p.errors || []).slice(0, 5),
    note: 'The four shows added up by name. A listener who hears more than one show is counted once for each.' };
}

// First 7 and first 30 days of each episode: counted when those days are over, kept for good. 40 are counted a visit; the rest on the next.
async function podFirsts(brand: string, sh: any, list: any[], today: string) {
  const { data: rows } = await db.from('ve_podcast_episode_firsts').select('episode_id, d7, d30').eq('brand_slug', brand).eq('show_key', sh.key);
  const have = new Map<string, { d7: number | null; d30: number | null }>((rows || []).map((r: any) => [r.episode_id, { d7: r.d7, d30: r.d30 }]));
  const yest = plusDays(today, -1);
  const need = list.filter((e) => { const h = have.get(e.id); return (plusDays(e.published, 6) <= yest && h?.d7 == null) || (plusDays(e.published, 29) <= yest && h?.d30 == null); });
  const batch = need.slice(0, 40);
  await pool(batch, 6, async (e: any) => {
    try {
      const j = await capReq(`/insights/${sh.id}/over-time/${e.id}`, { gteUnix: sec(etStart(e.published)), lteUnix: sec(etStart(plusDays(e.published, 30))), interval: '1d' });
      const ds = (j?.overTime || []).map((p: any) => ({ d: etDay(Number(p.timestamp)), v: Number(p.total) || 0 }));
      const d7 = plusDays(e.published, 6) <= yest ? sliceSum(ds, e.published, plusDays(e.published, 6)) : null;
      const d30 = plusDays(e.published, 29) <= yest ? sliceSum(ds, e.published, plusDays(e.published, 29)) : null;
      await db.from('ve_podcast_episode_firsts').upsert({ brand_slug: brand, show_key: sh.key, episode_id: e.id, published: e.published, d7, d30, updated_at: new Date().toISOString() }, { onConflict: 'brand_slug,show_key,episode_id' });
      have.set(e.id, { d7, d30 });
    } catch (_) { /* tried again on the next visit */ }
  });
  return { have, pending: Math.max(0, need.length - batch.length) + batch.filter((e) => { const h = have.get(e.id); return (plusDays(e.published, 6) <= yest && h?.d7 == null) || (plusDays(e.published, 29) <= yest && h?.d30 == null); }).length };
}
async function podEpisodes(brand: string, sh: any, from: string, to: string, refresh: boolean) {
  const eps: any = await podEpisodeList(brand, sh, refresh);
  const today = etDay(Date.now());
  const range: any = await cached(`ins:podrange:${brand}:${sh.key}:${from}:${to}`, 3 * H, refresh, async () => {
    const j = await capReq(`/insights/${sh.id}/overview/range`, { startTimestamp: sec(etStart(from)), endTimestamp: sec(etStart(plusDays(to, 1))) });
    return { connected: true, by: Object.fromEntries((j?.byEpisode || []).map((x: any) => [x.episodeId, Number(x.total) || 0])) };
  });
  const { have, pending } = await podFirsts(brand, sh, eps.list, today);
  const episodes = eps.list.map((e: any) => ({ id: e.id, title: e.title, published: e.published, art: e.art, number: e.number, downloads: range.by[e.id] || 0, counted: e.published <= to,
    first7: have.get(e.id)?.d7 ?? null, first30: have.get(e.id)?.d30 ?? null, days_out: Math.max(0, Math.round((Date.parse(today) - Date.parse(e.published)) / 864e5)) }));
  return { connected: true, show: sh.key, show_name: sh.name, part: 'episodes', from, to, episodes, pending_firsts: pending, partial: false, errors: [],
    note: 'First 7 and first 30 days are counted from the day an episode came out, once those days are over. Downloads are Captivate\'s, with its own bot filtering.' };
}

// ---- Podcast pages uploaded by hand (Sean, 2026-11-04: "whatever can't be pulled by API, we can upload manually with a screenshot... the ability
// to upload multiple... where people are listening from, what devices"). Private bucket podcast-reports, rows in ve_podcast_uploads. A file goes up
// straight from the browser on a signed link (`podcast_upload_start`), then `podcast_upload_done` saves its row; nothing is deleted, `podcast_file_remove`
// only hides it. Super admins only (the handler's own check), like every Insights action.
const UP_BUCKET = 'podcast-reports';
const UP_KINDS = ['places', 'devices', 'apps', 'overview', 'other'];
const UP_TYPES = /^(image\/(jpeg|png|webp)|application\/pdf)$/;
const UP_MAX = 25 * 1024 * 1024;
async function podcastFiles(act: string, brand: string, body: any, member: string | null) {
  if (!PODCAST_SHOWS[brand]) return { error: 'no_podcast' };
  const sh = showOf(brand, body.show);
  if (!sh) return { error: 'bad_show' };
  if (act === 'podcast_files') {
    const { data: rows, error } = await db.from('ve_podcast_uploads').select('*').eq('brand_slug', brand).eq('show_key', sh.key).is('removed_at', null)
      .order('period_to', { ascending: false }).order('created_at', { ascending: false }).limit(300);
    if (error) return { error: error.message };
    const paths = (rows || []).map((r: any) => r.storage_path);
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await db.storage.from(UP_BUCKET).createSignedUrls(paths, 3600);
      for (const s of signed || []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    return { files: (rows || []).map((r: any) => ({ id: r.id, kind: r.kind, from: r.period_from, to: r.period_to, note: r.note, name: r.file_name, type: r.content_type, size: r.size_bytes, at: r.created_at, url: urls.get(r.storage_path) || null })) };
  }
  if (act === 'podcast_upload_start') {
    const type = String(body.type || '');
    if (!UP_TYPES.test(type)) return { error: 'bad_type' };
    if (!(Number(body.size) > 0) || Number(body.size) > UP_MAX) return { error: 'too_big' };
    const safe = String(body.name || 'file').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'file';
    const path = `${brand}/${sh.key}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
    const { data, error } = await db.storage.from(UP_BUCKET).createSignedUploadUrl(path);
    if (error) return { error: error.message };
    return { upload_url: data.signedUrl, path };
  }
  if (act === 'podcast_upload_done') {
    const path = String(body.path || '');
    const kind = String(body.kind || '');
    const type = String(body.type || '');
    if (!path.startsWith(`${brand}/${sh.key}/`) || path.includes('..')) return { error: 'bad_path' };
    if (!UP_KINDS.includes(kind)) return { error: 'bad_kind' };
    if (!UP_TYPES.test(type)) return { error: 'bad_type' };
    if (!isDay(body.from) || !isDay(body.to) || body.from > body.to) return { error: 'bad_dates' };
    const { error: ex } = await db.storage.from(UP_BUCKET).createSignedUrl(path, 60);
    if (ex) return { error: 'not_uploaded' };
    const { data, error } = await db.from('ve_podcast_uploads').insert({
      brand_slug: brand, show_key: sh.key, kind, period_from: body.from, period_to: body.to, note: String(body.note || '').trim().slice(0, 500) || null,
      file_name: String(body.name || 'file').slice(0, 200), content_type: type, size_bytes: Number(body.size) || null, storage_path: path, uploaded_by: member,
    }).select('id').single();
    if (error) return { error: error.message };
    return { id: data.id };
  }
  if (act === 'podcast_file_remove') {
    const { data, error } = await db.from('ve_podcast_uploads').update({ removed_at: new Date().toISOString(), removed_by: member }).eq('id', String(body.id || '')).eq('brand_slug', brand).eq('show_key', sh.key).is('removed_at', null).select('id');
    if (error) return { error: error.message };
    return data?.length ? { ok: true } : { error: 'not_found' };
  }
  return { error: 'unknown_action' };
}

async function socialReport(brand: string, from: string, to: string) {
  const key = await secret('LESARUSS_ADMIN_TOKEN');
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ve-social`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ action: 'report', brand, from, to }), signal: AbortSignal.timeout(60000) });
    return await r.json();
  } catch (e) { return { error: String(e) }; }
}
function socialSummary(s: any) {
  if (!s || s.error || s.not_connected) return { connected: false };
  const channels = Object.entries(s.channels ?? {}).filter(([, c]: any) => c?.connected).map(([k, c]: any) => ({ channel: k, followers: c.followers ?? null, followers_start: c.followers_start ?? null }));
  const all = (s.posts ?? []).filter((p: any) => p.status === 'published');
  // A post Metricool has not reported numbers for yet has no metrics at all: it is "not reported yet", never zero.
  const posts = all.filter((p: any) => p.metrics && Object.keys(p.metrics).length);
  const sum = (k: string) => posts.reduce((n: number, p: any) => n + (Number(p.metrics?.[k]) || 0), 0);
  const top = [...posts].sort((a: any, b: any) => (b.metrics?.views || 0) - (a.metrics?.views || 0)).slice(0, 5).map((p: any) => ({ channel: p.channel, kind: p.kind, at: p.at, caption: String(p.caption || '').slice(0, 120), views: p.metrics?.views ?? 0, likes: p.metrics?.likes ?? 0, comments: p.metrics?.comments ?? 0 }));
  const byChannel: Record<string, number> = {};
  for (const p of all) byChannel[p.channel] = (byChannel[p.channel] ?? 0) + 1;
  return { connected: true, channels, posts_published: all.length, posts_with_numbers: posts.length, posts_without_numbers_yet: all.length - posts.length, posts_by_channel: byChannel, views: sum('views'), likes: sum('likes'), comments: sum('comments'), shares: sum('shares'), top, scheduled_in_metricool: (s.posts ?? []).filter((p: any) => p.status === 'scheduled').length,
    note: 'views, likes, comments and shares count only posts Metricool has reported numbers for' };
}
// ---- The podcast, for the analysis (Logan, 2026-11-04: the podcast belongs in Insights beside web and social, so the written analysis reads it too) ----
// Only reads what the Podcast tab already caches (the daily record, the per-episode range, first 7 and 30 days from the table) plus one light audience call
// (countries, apps, systems, devices; no per-country province or city calls). A brand with no PODCAST_SHOWS row gets null, and the analysis leaves the section out.
async function podAudienceTop(brand: string, sh: any, from: string, to: string) {
  return cached(`ins:podaudtop:${brand}:${sh.key}:${from}:${to}`, 3 * H, false, async () => {
    const win = { start: new Date(etStart(from)).toISOString(), end: new Date(etStart(plusDays(to, 1))).toISOString(), timezone: 'America/New_York', interval: null };
    const j = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: null, types: ['byLocation', 'byUserAgentBrowser', 'byUserAgentOs', 'byUserAgentDevice'] });
    const countries = (j?.byLocation?.byCountry || []).map((x: any) => ({ name: String(x.country), total: Number(x.total) || 0 })).filter((x: any) => x.total > 0).sort((a: any, b: any) => b.total - a.total);
    return { connected: true, total: Number(j?.total) || 0, countries, apps: topN(j?.byUserAgentBrowser, 'browser', 5), systems: topN(j?.byUserAgentOs, 'os', 4), devices: topN(j?.byUserAgentDevice, 'device', 4) };
  });
}
async function podcastFacts(brand: string, from: string, to: string) {
  const shows = PODCAST_SHOWS[brand];
  if (!shows) return null;
  const pc = (n: number, t: number) => (t > 0 ? Math.round((n / t) * 1000) / 10 : null);
  const out = await Promise.all(shows.map(async (sh) => {
    try {
      const ov: any = await podOverview(brand, sh, from, to, false);
      if (ov.error) return { show: sh.name, downloads: 0, note: 'No downloads on record for this show in the period.' };
      const [eps, range, aud, firstRows]: any[] = await Promise.all([
        podEpisodeList(brand, sh, false),
        cached(`ins:podrange:${brand}:${sh.key}:${from}:${to}`, 3 * H, false, async () => {
          const j = await capReq(`/insights/${sh.id}/overview/range`, { startTimestamp: sec(etStart(from)), endTimestamp: sec(etStart(plusDays(to, 1))) });
          return { connected: true, by: Object.fromEntries((j?.byEpisode || []).map((x: any) => [x.episodeId, Number(x.total) || 0])) };
        }),
        podAudienceTop(brand, sh, from, to),
        db.from('ve_podcast_episode_firsts').select('episode_id, d7, d30').eq('brand_slug', brand).eq('show_key', sh.key).then((r: any) => r.data || []),
      ]);
      const fm = new Map<string, any>(firstRows.map((r: any) => [r.episode_id, r]));
      const t = ov.totals;
      const top = eps.list.filter((e: any) => e.published <= to).map((e: any) => ({ title: e.title, published: e.published, downloads: range.by[e.id] || 0 }))
        .filter((e: any) => e.downloads > 0).sort((a: any, b: any) => b.downloads - a.downloads).slice(0, 5);
      const recent = eps.list.slice(0, 8).map((e: any) => ({ title: e.title, published: e.published, first_7_days: fm.get(e.id)?.d7 ?? null, first_30_days: fm.get(e.id)?.d30 ?? null })).filter((e: any) => e.first_7_days != null || e.first_30_days != null);
      return {
        show: sh.name, downloads: t.downloads, before: t.prev, per_day: t.per_day, new_episodes_in_period: t.episodes_out, episodes_total: t.episodes_total, all_time_downloads: t.all_time,
        top_episodes_in_period: top, latest_episodes_first_days: recent,
        top_countries: aud.countries.slice(0, 5).map((c: any) => ({ country: c.name, downloads: c.total, share_pct: pc(c.total, aud.total) })), countries_heard_in: aud.countries.length,
        top_apps: aud.apps.map((a: any) => ({ app: a.name, share_pct: pc(a.total, aud.total) })), top_systems: aud.systems.map((a: any) => ({ system: a.name, share_pct: pc(a.total, aud.total) })), top_devices: aud.devices.map((a: any) => ({ device: a.name, share_pct: pc(a.total, aud.total) })),
      };
    } catch (e) { return { show: sh.name, error: (e as Error).message }; }
  }));
  return { shows: out, note: 'Downloads are what Captivate counts: an episode file fetched by an app or browser, with its own bot filtering. They are not listeners. Audience figures are Captivate\'s range report and can differ slightly from the daily downloads. A first 7 or 30 days figure appears only after those days are over and once that episode has been counted.' };
}
async function analysis(brand: string, name: string, from: string, to: string) {
  const errs: string[] = [];
  const safe = async <T,>(label: string, f: () => Promise<T>) => { try { return await f(); } catch (e) { errs.push(`${label}: ${(e as Error).message}`); return null; } };
  const today = new Date().toISOString();
  const [web, search, ad, camp, soc, pod, plan] = await Promise.all([
    safe('web', () => cached(`ins:web:${brand}:${from}:${to}`, 3 * H, false, () => webAnalytics(brand, from, to))),
    safe('seo', () => cached(`ins:seo:${brand}:${from}:${to}`, 3 * H, false, () => seo(brand, from, to))),
    safe('ads', () => ads(brand, from, to)),
    safe('campaigns', () => campaigns(brand, from, to)),
    safe('social', () => socialReport(brand, from, to)),
    safe('podcast', () => podcastFacts(brand, from, to)),
    safe('plan', async () => { const { data } = await db.from('ve_social_slots').select('status').eq('brand_slug', brand).gte('slot_at', today).limit(2000); const c: Record<string, number> = {}; for (const r of (data ?? []) as any[]) c[r.status] = (c[r.status] ?? 0) + 1; return c; }),
  ]);
  const facts = {
    brand: name, period: { from, to, compared_with: web && (web as any).prev_from ? { from: (web as any).prev_from, to: (web as any).prev_to } : null },
    web: web && (web as any).connected ? { totals: (web as any).totals, before: (web as any).totals_prev, top_pages: (web as any).pages.slice(0, 8).map((p: any) => ({ path: p.path, views: p.views })), channels: (web as any).channels.slice(0, 6), sources: (web as any).sources.slice(0, 6), countries: (web as any).countries.slice(0, 5), devices: (web as any).devices } : { connected: false },
    search: search && (search as any).connected ? { totals: (search as any).totals, before: (search as any).totals_prev, top_queries: (search as any).queries.slice(0, 10), near_page_one: (search as any).nearly.slice(0, 8) } : { connected: false },
    social: { ...socialSummary(soc), social_plan_coming_up_by_status: plan ?? {}, plan_status_words: { proposed: 'waiting for approval in the Social plan', approved: 'approved', scheduled: 'scheduled in Metricool', manual: 'to post by hand', held: 'held' } },
    ads: ad ? { totals: (ad as any).totals, campaigns: (ad as any).campaigns.slice(0, 6), empty_slots: (ad as any).slots.filter((s: any) => !s.filled_by).length } : null,
    podcast: pod ?? null,
    campaigns: camp ? (camp as any).campaigns.map((c: any) => ({ kind: c.kind, name: c.name, status: c.status, line: c.line })).slice(0, 30) : null,
  };
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'no_model_key', facts };
  const schema = {
    type: 'object', additionalProperties: false, required: ['headline', 'summary', 'sections', 'next_steps'],
    properties: {
      headline: { type: 'string' }, summary: { type: 'string' },
      sections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['area', 'verdict', 'points'], properties: {
        area: { type: 'string', enum: ['Web', 'Search', 'Social', 'Podcast', 'Ads', 'Campaigns'] }, verdict: { type: 'string', enum: ['up', 'down', 'flat', 'not_connected', 'mixed'] },
        points: { type: 'array', items: { type: 'string' } } } } },
      next_steps: { type: 'array', items: { type: 'string' } },
    },
  };
  const system = `You write the Insights analysis for ${name}'s team in BrandDesk. Read only the numbers given. Never invent a number, a cause or a trend the numbers do not show; when something is not connected, say so in one line. Plain words, short sentences, no jargon (say "visitors" not "active users", "shown in Google" not "impressions" the first time, then either). Compare with the period before wherever both are given, with the change as a number and a percent. Capitalize Vegan. Never use dashes as punctuation (no em or en dashes, no hyphens between clauses). The headline is one sentence. The summary is two to four sentences. Each section has two to five points. next_steps are three to six concrete things to do this week, each tied to a number above. Posts with no numbers yet are not zero views: say their numbers have not come in. The podcast section, when the numbers include one, reads downloads (never call them listeners), names the show, compares each show with the period before, points to the top episodes and to how the latest episodes did in their first 7 and 30 days where those numbers exist, and says where it is heard and on what in a sentence or two; a country called AA is not a real country, so call it not placed and do not guess what it means; do not say any country looks like bots or data centers. When the podcast number is null the brand has no podcast, so leave the Podcast section out entirely. Referral visits from hq.lesaruss.ai are the team's own dashboard framing the site, not outside traffic; say so if they show up.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 16000, system, messages: [{ role: 'user', content: 'The numbers, as JSON:\n' + JSON.stringify(facts) }],
      output_config: { format: { type: 'json_schema', schema } } }),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  if (j.error) return { error: 'model: ' + (j.error.message || j.error.type), facts };
  const text = (j.content ?? []).find((c: any) => c.type === 'text')?.text ?? '';
  if (j.stop_reason && j.stop_reason !== 'end_turn') return { error: j.stop_reason === 'max_tokens' ? 'cut_off' : `stopped_${j.stop_reason}`, facts };
  let out: any; try { out = JSON.parse(text); } catch { return { error: 'model_output' + (j.stop_reason ? ` (${j.stop_reason})` : ''), facts }; }
  const fix = (v: any): any => typeof v === 'string' ? v.replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\bvegan\b/g, 'Vegan') : Array.isArray(v) ? v.map(fix) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  return { ...fix(out), facts, errors: errs, model: MODEL };
}


// ---- Where should we go next? Podcast listener places on each board card (ve-chapter-rankings, Sean, 2026-11-09: "Portland: 14 votes, 312 downloads").
// All-time downloads across our four shows, added up for the Captivate places each open ve_next_chapters row names (listen_match.places:
// {country, province?, cities?}). One range call per show for every country, then one per show for each country that needs provinces or
// cities (US, Ireland): about 12 Captivate calls a run, no paid calls. Written to ve_next_chapters.listens; a show that fails keeps the old numbers.
async function nextPlaces() {
  const { data: places, error } = await db.from('ve_next_chapters').select('slug, listen_match').eq('status', 'open');
  if (error) return { error: error.message };
  const shows = PODCAST_SHOWS['vegans-explore'];
  const from = '2015-01-01', to = plusDays(etDay(Date.now()), -1);
  const win = { start: new Date(etStart(from)).toISOString(), end: new Date(etStart(plusDays(to, 1))).toISOString(), timezone: 'America/New_York', interval: null };
  const need = new Set<string>();
  for (const p of places || []) for (const m of (p.listen_match?.places || [])) if (m.province || m.cities) need.add(String(m.country));
  const map = ccMap();
  const lc = (x: unknown) => String(x ?? '').trim().toLowerCase();
  const errors: string[] = [];
  // per show: { country code -> total }, { code -> provinces[] }, { code -> cities[] }
  const data = await Promise.all(shows.map(async (sh) => {
    try {
      const j = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: null, types: ['byLocation'] });
      const country: Record<string, number> = {};
      for (const x of (j?.byLocation?.byCountry || [])) { const c = map.get(lc(x.country)); if (c) country[c] = (country[c] || 0) + (Number(x.total) || 0); }
      const prov: Record<string, any[]> = {}, city: Record<string, any[]> = {};
      for (const code of need) {
        if (!country[code]) { prov[code] = []; city[code] = []; continue; }
        const d = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: code, types: ['byLocation'] });
        prov[code] = (d?.byLocation?.byProvince || []).map((p: any) => ({ name: String(p.province ?? ''), total: Number(p.total) || 0 }));
        city[code] = (d?.byLocation?.byCity || []).map((p: any) => ({ name: String(p.city ?? ''), province: p.province ?? null, total: Number(p.total) || 0 }));
      }
      return { key: sh.key, ok: true, country, prov, city };
    } catch (e) { errors.push(`${sh.key}: ${(e as Error).message}`); return { key: sh.key, ok: false } as any; }
  }));
  if (!data.some((d: any) => d.ok)) return { error: 'captivate_failed', errors };
  const at = new Date().toISOString();
  const out: any[] = [];
  for (const p of places || []) {
    const ms = p.listen_match?.places || [];
    if (!ms.length) continue;
    let total = 0; const byShow: Record<string, number> = {}; const top = new Map<string, number>();
    for (const d of data as any[]) {
      if (!d.ok) continue;
      let n = 0;
      for (const m of ms) {
        const code = String(m.country);
        if (m.cities) {
          const want = new Set((m.cities as string[]).map(lc));
          for (const c of d.city[code] || []) if (want.has(lc(c.name)) && (!m.province || lc(c.province) === lc(m.province))) { n += c.total; top.set(c.name, (top.get(c.name) || 0) + c.total); }
        } else if (m.province) {
          for (const c of d.prov[code] || []) if (lc(c.name) === lc(m.province)) n += c.total;
          for (const c of d.city[code] || []) if (lc(c.province) === lc(m.province)) top.set(c.name, (top.get(c.name) || 0) + c.total);
        } else {
          const v = d.country[code] || 0; n += v;
          if (v) { const nm = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; } })(); top.set(nm, (top.get(nm) || 0) + v); }
        }
      }
      byShow[d.key] = n; total += n;
    }
    const prev = (await db.from('ve_next_chapters').select('listens').eq('slug', p.slug).maybeSingle()).data?.listens || null;
    // A show that failed this run keeps its numbers from the last good run.
    for (const d of data as any[]) if (!d.ok && prev?.by_show?.[d.key] != null) { byShow[d.key] = prev.by_show[d.key]; total += prev.by_show[d.key]; }
    const listens = { downloads: total, by_show: byShow, top: [...top.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, n]) => ({ name, n })), from, to, at };
    const { error: ue } = await db.from('ve_next_chapters').update({ listens }).eq('slug', p.slug);
    if (ue) errors.push(`${p.slug}: ${ue.message}`);
    out.push({ slug: p.slug, downloads: total, by_show: byShow });
  }
  return { ok: true, from, to, places: out, errors };
}

// ---- Chapter insights: one place's audience (Sean, 2026-11-09, ve-chapter-rankings: "a breakdown of our audience... podcasts... using their
// thumbnails... sort it by periods... how many people are coming from [the place] on web, YouTube, and social media... we can collect the news";
// "it lives in the brand desk insight section under chapters"; super admins only). A place is a chapter (ve_outreach_cities kind city) or a
// coming-next place (ve_next_chapters, its listen_match). Each is turned into the places Captivate, Google and Metricool know:
// [{country ISO, province?, cities?}].
//   places {brand}                         every chapter and open coming-next place, for the picker
//   place {brand, kind, slug, from, to}    podcast downloads from there by show (and the period before), Google visitors from there (totals,
//                                          days, cities, pages, channels), Instagram and Facebook followers there (Metricool, today's count),
//                                          and the news we hold for it (feed stories for a chapter, our episodes that named it).
// Read only: Captivate range calls, Google Analytics, Metricool's follower maps. Cached 3 hours (followers 12).
const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
const ABBR_OF: Record<string, string> = Object.fromEntries(Object.entries(US_STATES).map(([a, n]) => [n.toLowerCase(), a]));
// A chapter that is a city list: the state (or country part) its cities are in, as ve-analytics counts it.
const CHAPTER_REGION: Record<string, string> = { 'south-florida': 'Florida', 'central-florida': 'Florida', 'north-florida': 'Florida', 'los-angeles': 'California' };
// Each show's Directory listing, for its picture.
const SHOW_LISTING: Record<string, string> = { 'vegans-explore': 'vegans-explore-podcast', 'soflo-vegans': 'soflo-vegans-podcast', 'vegans-who-lift': 'vegans-who-lift-podcast', 'pre-vegans': 'pre-vegans-podcast' };
type PMatch = { country: string; province?: string; cities?: string[] };
// Data-center towns counted out of a whole-state total (2026-11-09: Ashburn and Sterling were 764 of Virginia's 1,015 podcast downloads in a
// year; Google's visitors already leave Ashburn out). Like Palo Alto for San Francisco. Oregon's are kept on Sean's word.
const DC_TOWNS: Record<string, string[]> = { virginia: ['ashburn', 'sterling'] };
const lcs = (x: unknown) => String(x ?? '').trim().toLowerCase();
const regionName = (code: string) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; } };

async function placeList() {
  const [{ data: ch }, { data: nx }] = await Promise.all([
    db.from('ve_outreach_cities').select('community_slug, name').eq('kind', 'city').neq('community_slug', 'brands').order('name'),
    db.from('ve_next_chapters').select('slug, name, sort').eq('status', 'open').order('sort'),
  ]);
  return { ok: true, chapters: (ch ?? []).map((c: any) => ({ slug: c.community_slug, name: c.name })), next: (nx ?? []).map((n: any) => ({ slug: n.slug, name: n.name })) };
}

async function placeOf(kind: string, slug: string): Promise<{ name: string; matches: PMatch[]; mentions: string[] } | null> {
  if (kind === 'chapter') {
    const { data: c } = await db.from('ve_outreach_cities').select('community_slug, name, states, cities').eq('kind', 'city').eq('community_slug', slug).maybeSingle();
    if (!c) return null;
    let matches: PMatch[];
    if (c.cities?.length) {
      if (slug === 'london') matches = [{ country: 'GB', cities: c.cities }];
      else matches = [{ country: 'US', province: CHAPTER_REGION[slug] ?? (c.states?.length ? US_STATES[c.states[0]] : undefined), cities: c.cities }];
    } else matches = (c.states ?? []).map((s: string) => ({ country: 'US', province: US_STATES[s] }));
    return { name: c.name, matches, mentions: [c.name.toLowerCase()] };
  }
  const { data: n } = await db.from('ve_next_chapters').select('slug, name, listen_match').eq('slug', slug).maybeSingle();
  if (!n) return null;
  return { name: n.name, matches: (n.listen_match?.places || []) as PMatch[], mentions: ((n.listen_match?.mentions || []) as string[]).map((m) => m.split('|')[0]) };
}

// One show, one period: every country, and provinces and cities for the countries the place needs.
async function placeCap(sh: { key: string; id: string }, from: string, to: string, codes: string[]) {
  return cached(`ins:placecap:${sh.key}:${from}:${to}:${codes.join(',')}`, 3 * H, false, async () => {
    const win = { start: new Date(etStart(from)).toISOString(), end: new Date(etStart(plusDays(to, 1))).toISOString(), timezone: 'America/New_York', interval: null };
    const map = ccMap();
    const j = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: null, types: ['byLocation'] });
    const country: Record<string, number> = {};
    for (const x of (j?.byLocation?.byCountry || [])) { const c = map.get(lcs(x.country)); if (c) country[c] = (country[c] || 0) + (Number(x.total) || 0); }
    const prov: Record<string, any[]> = {}, city: Record<string, any[]> = {};
    for (const code of codes) {
      if (!country[code]) { prov[code] = []; city[code] = []; continue; }
      const d = await capReq(`/insights/${sh.id}/range/`, { ...win, countryCode: code, types: ['byLocation'] });
      prov[code] = (d?.byLocation?.byProvince || []).map((p: any) => ({ name: String(p.province ?? ''), total: Number(p.total) || 0 }));
      city[code] = (d?.byLocation?.byCity || []).map((p: any) => ({ name: String(p.city ?? ''), province: p.province ?? null, total: Number(p.total) || 0 }));
    }
    return { connected: true, total: Number(j?.total) || 0, country, prov, city };
  });
}
function capSum(raw: any, ms: PMatch[]) {
  let n = 0; const cities = new Map<string, number>();
  for (const m of ms) {
    const code = String(m.country);
    if (m.cities?.length) {
      const want = new Set(m.cities.map(lcs));
      for (const c of raw.city?.[code] || []) if (want.has(lcs(c.name)) && (!m.province || lcs(c.province) === lcs(m.province))) { n += c.total; cities.set(c.name, (cities.get(c.name) || 0) + c.total); }
    } else if (m.province) {
      const skip = DC_TOWNS[lcs(m.province)] || [];
      for (const c of raw.prov?.[code] || []) if (lcs(c.name) === lcs(m.province)) n += c.total;
      for (const c of raw.city?.[code] || []) if (lcs(c.province) === lcs(m.province)) {
        if (skip.includes(lcs(c.name))) { n -= c.total; continue; }
        cities.set(c.name, (cities.get(c.name) || 0) + c.total);
      }
    } else { const v = raw.country?.[code] || 0; n += v; if (v) cities.set(regionName(code), (cities.get(regionName(code)) || 0) + v); }
  }
  n = Math.max(0, n);
  return { n, cities: [...cities.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, total]) => ({ name, total })) };
}
async function placePodcast(ms: PMatch[], from: string, to: string) {
  const shows = PODCAST_SHOWS['vegans-explore'];
  const codes = [...new Set(ms.filter((m) => m.province || m.cities?.length).map((m) => String(m.country)))].sort();
  const { pf, pt } = prevOf(from, to);
  const { data: ls } = await db.from('listings').select('slug, logo_url').in('slug', Object.values(SHOW_LISTING));
  const art = new Map((ls ?? []).map((l: any) => [l.slug, l.logo_url]));
  const errors: string[] = [];
  const rows = await pool(shows, 2, async (sh) => {
    const listing = SHOW_LISTING[sh.key];
    try {
      const [cur, prev] = await Promise.all([placeCap(sh, from, to, codes), placeCap(sh, pf, pt, codes)]);
      const c = capSum(cur, ms), p = capSum(prev, ms);
      return { key: sh.key, name: sh.name, listing, art: art.get(listing) ?? null, downloads: c.n, prev: p.n, all_places: (cur as any).total, share: (cur as any).total ? c.n / (cur as any).total : 0, cities: c.cities };
    } catch (e) { errors.push(`${sh.name}: ${(e as Error).message}`); return { key: sh.key, name: sh.name, listing, art: art.get(listing) ?? null, downloads: null, prev: null, cities: [], error: true }; }
  });
  const total = rows.reduce((s, r: any) => s + (r.downloads || 0), 0), prevTotal = rows.reduce((s, r: any) => s + (r.prev || 0), 0);
  const cities = new Map<string, number>();
  for (const r of rows as any[]) for (const c of r.cities) cities.set(c.name, (cities.get(c.name) || 0) + c.total);
  return { from, to, prev_from: pf, prev_to: pt, total, prev: prevTotal, shows: rows, cities: [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, total]) => ({ name, total })), errors };
}

// Google: the visitors whose place is the place (country, region, city), against the period before.
function gaPlaceFilter(ms: PMatch[]) {
  const ex = ms.map((m) => {
    const parts: any[] = [{ filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: regionName(String(m.country)) } } }];
    if (m.province) parts.push({ filter: { fieldName: 'region', stringFilter: { matchType: 'EXACT', value: m.province } } });
    if (m.cities?.length) parts.push({ filter: { fieldName: 'city', inListFilter: { values: m.cities } } });
    return parts.length === 1 ? parts[0] : { andGroup: { expressions: parts } };
  });
  return ex.length === 1 ? ex[0] : { orGroup: { expressions: ex } };
}
async function placeWeb(ms: PMatch[], from: string, to: string) {
  const site = await brandSite('vegans-explore');
  if (!site.property) return { connected: false };
  const token = await gToken('https://www.googleapis.com/auth/analytics.readonly');
  const { pf, pt, days } = prevOf(from, to);
  const both = [{ startDate: from, endDate: to, name: 'cur' }, { startDate: pf, endDate: pt, name: 'prev' }];
  const cur = [{ startDate: from, endDate: to }];
  const grain = days > 120 ? 'yearMonth' : 'date';
  const P = site.property, F = gaPlaceFilter(ms);
  const [totals, trend, cities, pages, channels] = await Promise.all([
    gaReport(token, P, { dateRanges: both, dimensionFilter: F, metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate'].map((name) => ({ name })) }),
    gaReport(token, P, { dateRanges: cur, dimensionFilter: F, dimensions: [{ name: grain }], metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: grain } }], limit: 400 }),
    gaReport(token, P, { dateRanges: cur, dimensionFilter: F, dimensions: [{ name: 'city' }, { name: 'region' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: 50 }),
    gaReport(token, P, { dateRanges: cur, dimensionFilter: F, dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 25 }),
    gaReport(token, P, { dateRanges: both, dimensionFilter: F, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }], limit: 30 }),
  ]);
  const last = (r: Row) => r.d[r.d.length - 1];
  const T = (r?: Row) => r ? { users: r.m[0], new_users: r.m[1], sessions: r.m[2], views: r.m[3], engagement_rate: r.m[4] } : { users: 0, new_users: 0, sessions: 0, views: 0, engagement_rate: 0 };
  const prevCh = new Map(channels.filter((r) => last(r) === 'prev').map((r) => [r.d[0], r.m[0]]));
  return {
    connected: true, grain, from, to, prev_from: pf, prev_to: pt,
    totals: T(totals.find((r) => last(r) === 'cur')), totals_prev: T(totals.find((r) => last(r) === 'prev')),
    trend: trend.map((r) => ({ t: r.d[0], users: r.m[0], views: r.m[1] })),
    cities: cities.map((r) => ({ city: r.d[0], region: r.d[1], users: r.m[0], sessions: r.m[1] })),
    pages: pages.map((r) => ({ path: r.d[0], title: r.d[1], views: r.m[0], users: r.m[1] })),
    channels: channels.filter((r) => last(r) === 'cur').map((r) => ({ channel: r.d[0], sessions: r.m[0], users: r.m[1], sessions_prev: prevCh.get(r.d[0]) ?? 0 })).sort((a, b) => b.sessions - a.sessions),
  };
}

// Metricool: followers by city and country on each network, today (it keeps no history of these maps). TikTok and YouTube return none.
async function socialMaps() {
  return cached('ins:placesoc:vegans-explore', 12 * H, false, async () => {
    const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'metricool').maybeSingle();
    const key = await secret(conn?.config?.api_key_secret || 'METRICOOL_API_KEY');
    if (!key || !conn?.config?.user_id) return { connected: false };
    const q = `userId=${conn.config.user_id}&blogId=${conn.config.blog_id || 3707345}`;
    const get = async (p: string) => { const r = await fetch(`https://app.metricool.com/api${p}?${q}`, { headers: { 'X-Mc-Auth': key, Accept: 'application/json' } }); return r.ok ? r.json() : {}; };
    const out: Record<string, any> = {};
    for (const n of ['instagram', 'facebook', 'tiktok', 'youtube']) { const [city, country] = await Promise.all([get(`/stats/city/${n}`), get(`/stats/country/${n}`)]); out[n] = { city, country }; }
    return { connected: true, networks: out };
  });
}
function socialIn(maps: any, ms: PMatch[]) {
  const nets: any[] = [];
  for (const n of ['instagram', 'facebook', 'tiktok', 'youtube']) {
    const m = maps?.networks?.[n] || {};
    const cityMap = (m.city || {}) as Record<string, number>, countryMap = (m.country || {}) as Record<string, number>;
    const known = Object.values(cityMap).reduce((s, v) => s + (Number(v) || 0), 0);
    if (!known && !Object.keys(countryMap).length) { nets.push({ network: n, available: false }); continue; }
    let inPlace = 0; const top: { name: string; n: number }[] = [];
    for (const [k, v] of Object.entries(cityMap)) {
      const i = k.lastIndexOf(','), c = lcs(i > 0 ? k.slice(0, i) : k), r = lcs(i > 0 ? k.slice(i + 1) : '');
      const hit = ms.some((x) => {
        if (!x.province && !x.cities?.length) return false;
        if (x.country === 'GB' && r && r !== 'england' && r !== 'gb' && r !== 'united kingdom') return false;
        if (x.province && r && r !== lcs(x.province) && r !== lcs(ABBR_OF[lcs(x.province)] || '')) return false;
        return x.cities?.length ? x.cities.some((y) => lcs(y) === c) : true;
      });
      if (hit) { inPlace += Number(v) || 0; top.push({ name: k, n: Number(v) || 0 }); }
    }
    // A place that is a whole country counts that country's followers.
    for (const x of ms) if (!x.province && !x.cities?.length) for (const [k, v] of Object.entries(countryMap)) if (lcs(k) === lcs(x.country) || lcs(k) === lcs(regionName(x.country))) { inPlace += Number(v) || 0; top.push({ name: regionName(x.country), n: Number(v) || 0 }); }
    const countryKnown = Object.values(countryMap).reduce((s, v) => s + (Number(v) || 0), 0);
    nets.push({ network: n, available: true, in_place: inPlace, known_city: known, known_country: countryKnown, top: top.sort((a, b) => b.n - a.n).slice(0, 15) });
  }
  return nets;
}

// News for a coming-next place (Sean, 2026-11-09: "do the news feeds"): a Google News search for Vegan stories naming the place (its
// listen_match mentions), read live and kept 6 hours. Free and read only; the stories go to Insights only, never the Pulse or the Inbox.
const decodeXml = (t: string) => t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
async function googleNews(slug: string, names: string[]) {
  return cached(`ins:placenews3:${slug}`, 6 * H, false, async () => {
    const terms = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 6).map((n) => /\s/.test(n) ? `"${n}"` : n);
    if (!terms.length) return { connected: true, stories: [] };
    const q = `vegan (${terms.join(' OR ')}) when:180d`;
    const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VegansExploreInsights/1.0)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error('Google News ' + r.status);
    const xml = await r.text();
    const stories = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40).map((m, i) => {
      const it = m[1], tag = (t: string) => decodeXml((new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`).exec(it) || [])[1] || '');
      const source = tag('source');
      let title = tag('title'); if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      const pub = tag('pubDate');
      return { id: `gn-${i}`, title, url: tag('link'), source_name: source || null, image_url: null, published_at: pub ? new Date(pub).toISOString() : null };
    // Only stories whose headline is about it (Japan's search also found missing-person stories and BrooklynVegan, a music site), newest first.
    }).filter((x) => x.title && x.url && /\b(vegan|vegans|veganism|plant[- ]based|vegetarian)\b/i.test(x.title) && !/brooklynvegan/i.test(x.source_name || ''))
      .map((x) => ({ ...x, in_headline: names.some((n) => n && x.title.toLowerCase().includes(n.trim().toLowerCase())) }))
      // Headlines that name the place first; the rest only name it in the story (Google matched the article text).
      .sort((a, b) => Number(b.in_headline) - Number(a.in_headline) || String(b.published_at || '').localeCompare(String(a.published_at || '')));
    return { connected: true, query: q, stories };
  });
}

async function placeNews(kind: string, slug: string, names: string[]) {
  let feed: any = null;
  const leads = kind === 'chapter'
    ? (await db.from('ve_news_leads').select('id, title, url, source_name, summary, image_url, published_at, status').eq('city_slug', slug).order('published_at', { ascending: false, nullsFirst: false }).limit(40)).data ?? []
    : ((feed = await googleNews(slug, names)).stories || []);
  const want = new Set(names.map(lcs));
  const pm = ((await db.from('ve_place_mentions').select('place, country, kind, source, ref, note, created_at').order('created_at', { ascending: false }).limit(2000)).data ?? []).filter((r: any) => want.has(lcs(r.place))).slice(0, 40);
  return { stories: leads, mentions: pm, source: kind === 'chapter' ? 'feeds' : 'google_news', query: feed?.query ?? null };
}

// YouTube Analytics for a place (2026-11-09): the channel's views and watch time from there, now and the period before. Read only; the channel
// owner connected it once in BrandDesk (HQ /api/branddesk/google/connect?kind=youtube), which keeps YOUTUBE_ANALYTICS_REFRESH_TOKEN.
// US states read by province (US-XX); a city list reads the top cities in its state or country (YouTube gives at most 250).
async function ytToken(): Promise<string | null> {
  const [id, sec, refresh] = await Promise.all([secret('GOOGLE_OAUTH_CLIENT_ID'), secret('GOOGLE_OAUTH_CLIENT_SECRET'), secret('YOUTUBE_ANALYTICS_REFRESH_TOKEN')]);
  if (!id || !sec || !refresh) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: id, client_secret: sec, refresh_token: refresh, grant_type: 'refresh_token' }) });
  const t = await r.json().catch(() => ({}));
  if (!t.access_token) throw new Error('YouTube connection refused (' + (t.error_description || t.error || r.status) + '). Connect YouTube again.');
  return t.access_token;
}
async function ytReport(tok: string, q: Record<string, string>) {
  const u = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  for (const [k, v] of Object.entries({ ids: 'channel==MINE', ...q })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { Authorization: 'Bearer ' + tok } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('YouTube Analytics: ' + (j?.error?.message || r.status));
  const cols = (j.columnHeaders || []).map((c: any) => c.name);
  return (j.rows || []).map((row: any[]) => Object.fromEntries(cols.map((c: string, i: number) => [c, row[i]])));
}
async function ytPeriod(tok: string, ms: PMatch[], from: string, to: string) {
  const met = 'views,estimatedMinutesWatched';
  const all = await ytReport(tok, { startDate: from, endDate: to, metrics: met });
  let views = 0, minutes = 0, region = 0; const cities = new Map<string, number>(), regionNames: string[] = [];
  for (const m of ms) {
    const code = String(m.country);
    const abbr = m.province ? ABBR_OF[lcs(m.province)] : null;
    // A city list inside a US state: the whole state too, since YouTube names few cities (2026-11-09: all time, Florida 1,621 views, Miami 69).
    if (m.cities?.length && code === 'US' && abbr) {
      const pr = await ytReport(tok, { startDate: from, endDate: to, metrics: 'views', dimensions: 'province', filters: 'country==US' });
      for (const r of pr) if (r.province === 'US-' + abbr) region += Number(r.views) || 0;
      regionNames.push(m.province!);
    }
    if (m.cities?.length) {
      const filters = code === 'US' && abbr ? `country==US;province==US-${abbr}` : `country==${code}`;
      const rows = await ytReport(tok, { startDate: from, endDate: to, metrics: met, dimensions: 'city', filters, sort: '-views', maxResults: '250' });
      const want = new Set(m.cities.map(lcs));
      for (const r of rows) if (want.has(lcs(r.city))) { views += Number(r.views) || 0; minutes += Number(r.estimatedMinutesWatched) || 0; cities.set(String(r.city), (cities.get(String(r.city)) || 0) + (Number(r.views) || 0)); }
    } else if (code === 'US' && abbr) {
      const rows = await ytReport(tok, { startDate: from, endDate: to, metrics: met, dimensions: 'province', filters: 'country==US' });
      for (const r of rows) if (r.province === 'US-' + abbr) { views += Number(r.views) || 0; minutes += Number(r.estimatedMinutesWatched) || 0; }
      const cr = await ytReport(tok, { startDate: from, endDate: to, metrics: 'views', dimensions: 'city', filters: `country==US;province==US-${abbr}`, sort: '-views', maxResults: '25' }).catch(() => []);
      for (const r of cr) cities.set(String(r.city), (cities.get(String(r.city)) || 0) + (Number(r.views) || 0));
    } else {
      const rows = await ytReport(tok, { startDate: from, endDate: to, metrics: met, dimensions: 'country' });
      for (const r of rows) if (r.country === code) { views += Number(r.views) || 0; minutes += Number(r.estimatedMinutesWatched) || 0; cities.set(regionName(code), (cities.get(regionName(code)) || 0) + (Number(r.views) || 0)); }
    }
  }
  return { views, minutes, region_views: regionNames.length ? region : null, region_name: regionNames.join(', ') || null, channel_views: Number(all[0]?.views) || 0, cities: [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, views]) => ({ name, views })) };
}
async function placeYouTube(ms: PMatch[], from: string, to: string) {
  const tok = await ytToken();
  if (!tok) return { connected: false };
  const { pf, pt } = prevOf(from, to);
  const yest = plusDays(etDay(Date.now()), -1);
  const [cur, prev, ever] = await Promise.all([ytPeriod(tok, ms, from, to), ytPeriod(tok, ms, pf, pt), ytPeriod(tok, ms, '2015-01-01', yest)]);
  const { data: s } = await db.from('lesaruss_secrets').select('description').eq('key', 'YOUTUBE_ANALYTICS_REFRESH_TOKEN').maybeSingle();
  return { connected: true, channel: /for (.+?) \(/.exec(s?.description || '')?.[1] || null, from, to, prev_from: pf, prev_to: pt, ...cur, prev_views: prev.views, prev_minutes: prev.minutes, prev_region_views: prev.region_views,
    all_time: { views: ever.views, minutes: ever.minutes, region_views: ever.region_views, channel_views: ever.channel_views, cities: ever.cities },
    note: 'YouTube places a view by the viewer\'s location, a day or two late. It hides places with few views, so a short period can read 0 while all time shows them, and it names only a few cities.' };
}

async function placeInsights(kind: string, slug: string, from: string, to: string, refresh: boolean) {
  const p = await placeOf(kind, slug);
  if (!p) return { error: 'no_place' };
  return cached(`ins:place:${kind}:${slug}:${from}:${to}`, 3 * H, refresh, async () => {
    const errors: string[] = [];
    const [podcast, web, maps, news, youtube] = await Promise.all([
      placePodcast(p.matches, from, to).catch((e) => { errors.push('podcast: ' + (e as Error).message); return null; }),
      placeWeb(p.matches, from, to).catch((e) => { errors.push('web: ' + (e as Error).message); return null; }),
      socialMaps().catch((e) => { errors.push('social: ' + (e as Error).message); return null; }),
      placeNews(kind, slug, p.mentions).catch((e) => { errors.push('news: ' + (e as Error).message); return null; }),
      placeYouTube(p.matches, from, to).catch((e) => { errors.push('youtube: ' + (e as Error).message); return null; }),
    ]);
    return { connected: true, place: { kind, slug, name: p.name, matches: p.matches }, from, to, podcast, web, youtube, social: maps && (maps as any).connected ? { networks: socialIn(maps, p.matches), fetched_at: (maps as any).fetched_at ?? null } : null, news, errors };
  });
}

// Each chapter's traffic for the public Traffic sort (only the rank leaves the database): podcast downloads from the chapter over the last
// 365 days plus Google visitors from it over the last 90. Daily cron ve-chapter-traffic; writes ve_chapter_traffic.
async function chapterTraffic() {
  const { data: chs } = await db.from('ve_outreach_cities').select('community_slug').eq('kind', 'city').neq('community_slug', 'brands');
  const yest = plusDays(etDay(Date.now()), -1);
  const podFrom = plusDays(yest, -364), webFrom = plusDays(yest, -89);
  const site = await brandSite('vegans-explore');
  const token = site.property ? await gToken('https://www.googleapis.com/auth/analytics.readonly') : null;
  const shows = PODCAST_SHOWS['vegans-explore'];
  const errors: string[] = [], out: any[] = [];
  await pool((chs ?? []) as any[], 4, async (c: any) => {
    const p = await placeOf('chapter', c.community_slug);
    if (!p) return;
    const codes = [...new Set(p.matches.filter((m) => m.province || m.cities?.length).map((m) => String(m.country)))].sort();
    let downloads = 0; const byShow: Record<string, number> = {};
    await Promise.all(shows.map(async (sh) => {
      try { const raw = await placeCap(sh, podFrom, yest, codes); const n = capSum(raw, p.matches).n; byShow[sh.key] = n; downloads += n; }
      catch (e) { errors.push(`${c.community_slug} ${sh.key}: ${(e as Error).message}`); }
    }));
    let web = 0;
    if (token && site.property) {
      try {
        const r = await gaReport(token, site.property, { dateRanges: [{ startDate: webFrom, endDate: yest }], dimensionFilter: gaPlaceFilter(p.matches), metrics: [{ name: 'activeUsers' }] });
        web = r[0]?.m[0] || 0;
      } catch (e) { errors.push(`${c.community_slug} web: ${(e as Error).message}`); }
    }
    const row = { chapter: c.community_slug, downloads, web_users: web, score: downloads + web, by_show: byShow, at: new Date().toISOString() };
    const { error } = await db.from('ve_chapter_traffic').upsert(row);
    if (error) errors.push(`${c.community_slug}: ${error.message}`);
    out.push(row);
  });
  return { ok: true, pod_from: podFrom, web_from: webFrom, to: yest, chapters: out, errors };
}

// Every Insights action that only reads (writes are the podcast upload, upload done and file remove).
const READ_ONLY_OK = new Set(['web_analytics', 'podcast', 'podcast_files', 'seo', 'ads', 'campaigns', 'campaign', 'web_health', 'analysis', 'places', 'place']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    // The board's listener places: the daily cron (x-cron-secret), the admin token or a super admin. It reads Captivate and writes only ve_next_chapters.listens.
    if (body.action === 'next_places' || body.action === 'chapter_traffic') {
      const cron = req.headers.get('x-cron-secret');
      let okCaller = (!!cron && cron === (await secret('CRON_SECRET'))) || (!!token && token === (await secret('LESARUSS_ADMIN_TOKEN')));
      if (!okCaller && token) { const m = await verifyToken(token); if (m) { const { data: me } = await db.from('members').select('is_superadmin').eq('id', m).maybeSingle(); okCaller = !!me?.is_superadmin; } }
      if (!okCaller) return json({ error: 'forbidden' }, 403);
      return json(body.action === 'chapter_traffic' ? await chapterTraffic() : await nextPlaces());
    }
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    let member: string | null = null;
    if (ops) member = typeof body.as_member === 'string' && /^[0-9a-f-]{36}$/.test(body.as_member) ? body.as_member : null;
    else member = token ? await verifyToken(token) : null;
    if (!ops && !member) return json({ error: 'not_authenticated' }, 401);
    if (member) {
      const { data: me } = await db.from('members').select('is_superadmin, member_class').eq('id', member).maybeSingle();
      if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
      // View only for our Guide and agent accounts (Logan, 2026-11-04: vegan@lesaruss.com is the standing QA login; it reads Insights, it never changes it).
      if (me.member_class === 'agent' && !READ_ONLY_OK.has(String(body.action || ''))) return json({ error: 'view_only' }, 403);
    }
    const brand = String(body.brand || '');
    if (!/^[a-z0-9-]{2,60}$/.test(brand)) return json({ error: 'bad_brand' }, 400);
    const { data: b } = await db.from('ve_social_brands').select('name').eq('slug', brand).maybeSingle();
    const name = b?.name || brand;
    const refresh = !!body.refresh;
    const act = String(body.action || '');
    if (act === 'web_health') return json(await cached(`ins:health:${brand}`, 12 * H, refresh, () => webHealth(brand)));
    if (act.startsWith('podcast_file') || act.startsWith('podcast_upload')) return json(await podcastFiles(act, brand, body, member));
    if (act === 'places') return json(brand === 'vegans-explore' ? await placeList() : { error: 'not_this_brand' });
    const { from, to } = body;
    if (!isDay(from) || !isDay(to) || from > to) return json({ error: 'bad_dates' }, 400);
    switch (act) {
      case 'web_analytics': return json(await cached(`ins:web:${brand}:${from}:${to}`, 3 * H, refresh, () => webAnalytics(brand, from, to)));
      case 'seo': return json(await cached(`ins:seo:${brand}:${from}:${to}`, 3 * H, refresh, () => seo(brand, from, to)));
      case 'podcast': {
        if (!PODCAST_SHOWS[brand]) return json({ connected: false });
        if (body.show === 'all' && body.part === 'audience') return json(await podAudienceAll(brand, from, to, refresh));
        const sh = showOf(brand, body.show);
        if (!sh) return json({ error: 'bad_show' }, 400);
        const part = body.part === 'episodes' ? 'episodes' : body.part === 'audience' ? 'audience' : 'overview';
        const r = part === 'episodes' ? await podEpisodes(brand, sh, from, to, refresh) : part === 'audience' ? await podAudience(brand, sh, from, to, refresh) : await podOverview(brand, sh, from, to, refresh);
        return json(r);
      }
      case 'place': {
        if (brand !== 'vegans-explore') return json({ error: 'not_this_brand' }, 400);
        const kind = body.kind === 'next' ? 'next' : 'chapter', slug = String(body.slug || '');
        if (!/^[a-z0-9-]{2,60}$/.test(slug)) return json({ error: 'bad_place' }, 400);
        const r: any = await placeInsights(kind, slug, from, to, refresh);
        return json(r, r?.error === 'no_place' ? 404 : 200);
      }
      case 'ads': return json(await ads(brand, from, to));
      case 'campaigns': return json(await campaigns(brand, from, to));
      case 'campaign': return json(await campaign(brand, String(body.kind || ''), String(body.id || ''), from, to));
      case 'analysis': return json(await cached(`ins:analysis2:${brand}:${from}:${to}`, 6 * H, refresh, () => analysis(brand, name, from, to)));
      default: return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error('branddesk-insights:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
