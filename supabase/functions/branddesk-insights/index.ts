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
  const sum = (k: 'impressions' | 'clicks' | 'impressions_prev' | 'clicks_prev') => slots.reduce((n, s) => n + s[k], 0);
  return {
    from, to, prev_from: pf, prev_to: pt, slots,
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
async function analysis(brand: string, name: string, from: string, to: string) {
  const errs: string[] = [];
  const safe = async <T,>(label: string, f: () => Promise<T>) => { try { return await f(); } catch (e) { errs.push(`${label}: ${(e as Error).message}`); return null; } };
  const today = new Date().toISOString();
  const [web, search, ad, camp, soc, plan] = await Promise.all([
    safe('web', () => cached(`ins:web:${brand}:${from}:${to}`, 3 * H, false, () => webAnalytics(brand, from, to))),
    safe('seo', () => cached(`ins:seo:${brand}:${from}:${to}`, 3 * H, false, () => seo(brand, from, to))),
    safe('ads', () => ads(brand, from, to)),
    safe('campaigns', () => campaigns(brand, from, to)),
    safe('social', () => socialReport(brand, from, to)),
    safe('plan', async () => { const { data } = await db.from('ve_social_slots').select('status').eq('brand_slug', brand).gte('slot_at', today).limit(2000); const c: Record<string, number> = {}; for (const r of (data ?? []) as any[]) c[r.status] = (c[r.status] ?? 0) + 1; return c; }),
  ]);
  const facts = {
    brand: name, period: { from, to, compared_with: web && (web as any).prev_from ? { from: (web as any).prev_from, to: (web as any).prev_to } : null },
    web: web && (web as any).connected ? { totals: (web as any).totals, before: (web as any).totals_prev, top_pages: (web as any).pages.slice(0, 8).map((p: any) => ({ path: p.path, views: p.views })), channels: (web as any).channels.slice(0, 6), sources: (web as any).sources.slice(0, 6), countries: (web as any).countries.slice(0, 5), devices: (web as any).devices } : { connected: false },
    search: search && (search as any).connected ? { totals: (search as any).totals, before: (search as any).totals_prev, top_queries: (search as any).queries.slice(0, 10), near_page_one: (search as any).nearly.slice(0, 8) } : { connected: false },
    social: { ...socialSummary(soc), social_plan_coming_up_by_status: plan ?? {}, plan_status_words: { proposed: 'waiting for approval in the Social plan', approved: 'approved', scheduled: 'scheduled in Metricool', manual: 'to post by hand', held: 'held' } },
    ads: ad ? { totals: (ad as any).totals, campaigns: (ad as any).campaigns.slice(0, 6), empty_slots: (ad as any).slots.filter((s: any) => !s.filled_by).length } : null,
    campaigns: camp ? (camp as any).campaigns.map((c: any) => ({ kind: c.kind, name: c.name, status: c.status, line: c.line })).slice(0, 30) : null,
  };
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'no_model_key', facts };
  const schema = {
    type: 'object', additionalProperties: false, required: ['headline', 'summary', 'sections', 'next_steps'],
    properties: {
      headline: { type: 'string' }, summary: { type: 'string' },
      sections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['area', 'verdict', 'points'], properties: {
        area: { type: 'string', enum: ['Web', 'Search', 'Social', 'Ads', 'Campaigns'] }, verdict: { type: 'string', enum: ['up', 'down', 'flat', 'not_connected', 'mixed'] },
        points: { type: 'array', items: { type: 'string' } } } } },
      next_steps: { type: 'array', items: { type: 'string' } },
    },
  };
  const system = `You write the Insights analysis for ${name}'s team in BrandDesk. Read only the numbers given. Never invent a number, a cause or a trend the numbers do not show; when something is not connected, say so in one line. Plain words, short sentences, no jargon (say "visitors" not "active users", "shown in Google" not "impressions" the first time, then either). Compare with the period before wherever both are given, with the change as a number and a percent. Capitalize Vegan. Never use dashes as punctuation (no em or en dashes, no hyphens between clauses). The headline is one sentence. The summary is two to four sentences. Each section has two to five points. next_steps are three to six concrete things to do this week, each tied to a number above. Posts with no numbers yet are not zero views: say their numbers have not come in. Referral visits from hq.lesaruss.ai are the team's own dashboard framing the site, not outside traffic; say so if they show up.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, system, messages: [{ role: 'user', content: 'The numbers, as JSON:\n' + JSON.stringify(facts) }],
      output_config: { format: { type: 'json_schema', schema } } }),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  if (j.error) return { error: 'model: ' + (j.error.message || j.error.type), facts };
  const text = (j.content ?? []).find((c: any) => c.type === 'text')?.text ?? '';
  let out: any; try { out = JSON.parse(text); } catch { return { error: 'model_output', facts }; }
  const fix = (v: any): any => typeof v === 'string' ? v.replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\bvegan\b/g, 'Vegan') : Array.isArray(v) ? v.map(fix) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  return { ...fix(out), facts, errors: errs, model: MODEL };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    let member: string | null = null;
    if (ops) member = typeof body.as_member === 'string' && /^[0-9a-f-]{36}$/.test(body.as_member) ? body.as_member : null;
    else member = token ? await verifyToken(token) : null;
    if (!ops && !member) return json({ error: 'not_authenticated' }, 401);
    if (member) {
      const { data: me } = await db.from('members').select('is_superadmin').eq('id', member).maybeSingle();
      if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
    }
    const brand = String(body.brand || '');
    if (!/^[a-z0-9-]{2,60}$/.test(brand)) return json({ error: 'bad_brand' }, 400);
    const { data: b } = await db.from('ve_social_brands').select('name').eq('slug', brand).maybeSingle();
    const name = b?.name || brand;
    const refresh = !!body.refresh;
    const act = String(body.action || '');
    if (act === 'web_health') return json(await cached(`ins:health:${brand}`, 12 * H, refresh, () => webHealth(brand)));
    const { from, to } = body;
    if (!isDay(from) || !isDay(to) || from > to) return json({ error: 'bad_dates' }, 400);
    switch (act) {
      case 'web_analytics': return json(await cached(`ins:web:${brand}:${from}:${to}`, 3 * H, refresh, () => webAnalytics(brand, from, to)));
      case 'seo': return json(await cached(`ins:seo:${brand}:${from}:${to}`, 3 * H, refresh, () => seo(brand, from, to)));
      case 'ads': return json(await ads(brand, from, to));
      case 'campaigns': return json(await campaigns(brand, from, to));
      case 'campaign': return json(await campaign(brand, String(body.kind || ''), String(body.id || ''), from, to));
      case 'analysis': return json(await cached(`ins:analysis:${brand}:${from}:${to}`, 6 * H, refresh, () => analysis(brand, name, from, to)));
      default: return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error('branddesk-insights:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
