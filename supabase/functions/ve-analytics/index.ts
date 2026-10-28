// ve-analytics: Depot > Analytics (Sean, 2026-10-28: "use the same exact structure as the analytics section in BCPS Marcom...
// see what's popular, what's working, which communities are growing the most... break it down by our communities... a ranking
// based off certain metrics"). The BCPS page reads monthly GA4 snapshots; this reads GA4 live for any period, cached 3 hours.
//   POST { action: 'report', from, to, prev_from, prev_to, refresh?, bots? }   super admin (the VE token) or ops (LESARUSS_ADMIN_TOKEN)
//   bots: 'hide' (the default) leaves out likely crawlers, 'show' counts everything Google counted.
//   -> { ga: {...} | null, ga_error?, internal: ve_analytics_internal(...), chapters: [...], fetched_at }
// Traffic: Google Analytics 4, property 432623792 (vegansexplore.com), read with the LESARUSS analytics reader
// (lesaruss_secrets GA4_SERVICE_ACCOUNT_JSON, which has Viewer on it). Our own numbers: ve_analytics_internal (migration
// 20261028_ve_analytics.sql). Chapters are ve_outreach_cities (kind city): a visitor counts in a chapter by Google's city,
// or by Google's region for a chapter that is a whole state. verify_jwt is off; the token is checked here.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const PROPERTY = '432623792';
const TTL_MS = 3 * 60 * 60 * 1000;
// Likely bots (found 2026-10-28: about 6,400 of October's 7,000 "visitors" were a Frankfurt data center with no city, hitting
// /join about 200 times a day, plus crawlers in China and Singapore): visits with no city, from cloud data-center cities, or
// from China. A real visitor whose city Google could not place is left out too; the page says so.
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

const STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
// A chapter with a city list and no state: the state Google's region must be, so a Jacksonville in another state is not counted.
const CITY_CHAPTER_REGION: Record<string, string> = {
  'south-florida': 'Florida', 'central-florida': 'Florida', 'north-florida': 'Florida', 'los-angeles': 'California', london: 'England',
};

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

// ---- Google Analytics ----
const b64u = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
async function gaToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const input = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now,
  }));
  const pem = sa.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const jwt = input + '.' + btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error('google_token: ' + (t.error_description || t.error || 'no token'));
  return t.access_token;
}
type Row = { d: string[]; m: number[] };
async function report(token: string, body: Record<string, unknown>): Promise<Row[]> {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error('google_report: ' + j.error.message);
  return (j.rows ?? []).map((x: any) => ({
    d: (x.dimensionValues ?? []).map((v: any) => v.value),
    m: (x.metricValues ?? []).map((v: any) => Number(v.value) || 0),
  }));
}

async function readGA(token: string, from: string, to: string, pf: string, pt: string, hideBots: boolean) {
  const run = (body: Record<string, any>) => {
    if (!hideBots) return report(token, body);
    const f = body.dimensionFilter ? { andGroup: { expressions: [body.dimensionFilter, BOT_FILTER] } } : BOT_FILTER;
    return report(token, { ...body, dimensionFilter: f });
  };
  const both = [{ startDate: from, endDate: to, name: 'cur' }, { startDate: pf, endDate: pt, name: 'prev' }];
  const cur = [{ startDate: from, endDate: to }];
  const days = (Date.parse(to) - Date.parse(from)) / 864e5 + 1;
  const grain = days > 120 ? 'yearMonth' : 'date';
  const [totals, trend, pages, pulse, channels, sources, geo, devices] = await Promise.all([
    run({ dateRanges: both, metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'engagementRate', 'averageSessionDuration'].map((name) => ({ name })) }),
    run({ dateRanges: cur, dimensions: [{ name: grain }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: grain } }], limit: 400 }),
    run({ dateRanges: cur, dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }], metrics: ['screenPageViews', 'activeUsers', 'userEngagementDuration', 'engagementRate'].map((name) => ({ name })), orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 1000 }),
    run({ dateRanges: cur, dimensions: [{ name: 'pagePathPlusQueryString' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      dimensionFilter: { filter: { fieldName: 'pagePathPlusQueryString', stringFilter: { matchType: 'CONTAINS', value: 'post=' } } }, limit: 1000 }),
    run({ dateRanges: both, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }], limit: 50 }),
    run({ dateRanges: cur, dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 100 }),
    run({ dateRanges: both, dimensions: [{ name: 'country' }, { name: 'region' }, { name: 'city' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'newUsers' }], limit: 5000 }),
    run({ dateRanges: cur, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }] }),
  ]);
  // With two date ranges Google adds a dateRange dimension as the last one ('cur' or 'prev').
  const split = (rows: Row[]) => ({ cur: rows.filter((r) => r.d[r.d.length - 1] === 'cur'), prev: rows.filter((r) => r.d[r.d.length - 1] === 'prev') });
  const tot = split(totals);
  const T = (r?: Row) => r ? { sessions: r.m[0], users: r.m[1], new_users: r.m[2], views: r.m[3], engagement_rate: r.m[4], avg_session: r.m[5] } : null;
  const ch = split(channels);
  const prevCh = new Map(ch.prev.map((r) => [r.d[0], r.m[0]]));
  const g = split(geo);
  return {
    property: PROPERTY,
    grain,
    totals: T(tot.cur[0]) ?? { sessions: 0, users: 0, new_users: 0, views: 0, engagement_rate: 0, avg_session: 0 },
    totals_prev: T(tot.prev[0]),
    trend: trend.map((r) => ({ t: r.d[0], sessions: r.m[0], users: r.m[1], views: r.m[2] })),
    pages: pages.map((r) => ({ path: r.d[0], title: r.d[1], views: r.m[0], users: r.m[1], avg_time: r.m[1] ? r.m[2] / r.m[1] : 0, engagement_rate: r.m[3] })),
    pulse_posts: pulse.map((r) => {
      const m = /[?&]post=([0-9a-f-]{36})/i.exec(r.d[0]);
      return m ? { id: m[1].toLowerCase(), views: r.m[0], users: r.m[1] } : null;
    }).filter(Boolean),
    channels: ch.cur.map((r) => ({ channel: r.d[0], sessions: r.m[0], users: r.m[1], engagement_rate: r.m[2], sessions_prev: prevCh.get(r.d[0]) ?? 0 }))
      .sort((a, b) => b.sessions - a.sessions),
    sources: sources.map((r) => ({ source: r.d[0], medium: r.d[1], sessions: r.m[0], users: r.m[1], engagement_rate: r.m[2] })),
    geo_cur: g.cur.map((r) => ({ country: r.d[0], region: r.d[1], city: r.d[2], users: r.m[0], sessions: r.m[1], new_users: r.m[2] })),
    geo_prev: g.prev.map((r) => ({ country: r.d[0], region: r.d[1], city: r.d[2], users: r.m[0], sessions: r.m[1], new_users: r.m[2] })),
    devices: devices.map((r) => ({ device: r.d[0], sessions: r.m[0], users: r.m[1] })),
  };
}

// ---- Chapters: visitors by Google's place, joined to our own numbers ----
type Chap = { community_slug: string; name: string; states: string[] | null; cities: string[] | null };
function chapterOf(chaps: Chap[], g: { country: string; region: string; city: string }): string | null {
  const city = (g.city || '').toLowerCase();
  for (const c of chaps) {
    if (!c.cities?.length) continue;
    const region = CITY_CHAPTER_REGION[c.community_slug] ?? (c.states?.length ? STATES[c.states[0]] : null);
    if (region && g.region !== region) continue;
    if (c.cities.some((x) => x.toLowerCase() === city)) return c.community_slug;
  }
  for (const c of chaps) {
    if (c.cities?.length || !c.states?.length) continue;
    if (g.country === 'United States' && c.states.some((s) => STATES[s] === g.region)) return c.community_slug;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    if (!ops) {
      const sub = token ? await verifyToken(token) : null;
      if (!sub) return json({ error: 'not_authenticated' }, 401);
      const { data: me } = await db.from('members').select('is_superadmin').eq('id', sub).maybeSingle();
      if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
    }
    if (body.action !== 'report') return json({ error: 'unknown_action' }, 400);
    const { from, to, prev_from, prev_to } = body;
    if (![from, to, prev_from, prev_to].every(isDay) || from > to || prev_from > prev_to) return json({ error: 'bad_dates' }, 400);

    const hideBots = body.bots !== 'show';
    const key = `ga:${hideBots ? 'real' : 'all'}:${from}:${to}:${prev_from}:${prev_to}`;
    let ga: any = null, gaError: string | null = null, fetchedAt = new Date().toISOString();
    const { data: hit } = await db.from('ve_analytics_cache').select('data, fetched_at').eq('key', key).maybeSingle();
    if (hit && !body.refresh && Date.now() - Date.parse(hit.fetched_at) < TTL_MS) {
      ga = hit.data; fetchedAt = hit.fetched_at;
    } else {
      try {
        const sa = await secret('GA4_SERVICE_ACCOUNT_JSON');
        if (!sa) throw new Error('no_reader');
        ga = await readGA(await gaToken(sa), from, to, prev_from, prev_to, hideBots);
        await db.from('ve_analytics_cache').upsert({ key, data: ga, fetched_at: fetchedAt });
      } catch (e) {
        gaError = String((e as Error).message || e);
        console.error('ve-analytics ga:', gaError);
        if (hit) { ga = hit.data; fetchedAt = hit.fetched_at; }
      }
    }

    const [{ data: internal, error: ie }, { data: chaps }] = await Promise.all([
      db.rpc('ve_analytics_internal', { p_from: from, p_to: to, p_prev_from: prev_from, p_prev_to: prev_to }),
      db.from('ve_outreach_cities').select('community_slug, name, states, cities').eq('kind', 'city').neq('community_slug', 'brands'),
    ]);
    if (ie) { console.error('ve-analytics internal:', ie); return json({ error: 'load_failed' }, 500); }

    // One row per chapter: Google's visitors from there, now and before, its hub's page views, and our own numbers.
    const visit: Record<string, { users: number; sessions: number; new_users: number; users_prev: number; sessions_prev: number }> = {};
    const add = (slug: string | null, k: 'cur' | 'prev', r: any) => {
      if (!slug) return;
      const v = visit[slug] ??= { users: 0, sessions: 0, new_users: 0, users_prev: 0, sessions_prev: 0 };
      if (k === 'cur') { v.users += r.users; v.sessions += r.sessions; v.new_users += r.new_users; } else { v.users_prev += r.users; v.sessions_prev += r.sessions; }
    };
    const C = (chaps ?? []) as Chap[];
    for (const r of ga?.geo_cur ?? []) add(chapterOf(C, r), 'cur', r);
    for (const r of ga?.geo_prev ?? []) add(chapterOf(C, r), 'prev', r);
    const hubViews: Record<string, number> = {};
    for (const p of ga?.pages ?? []) {
      const m = /^\/communities\/([a-z-]+)\/?$/.exec(p.path);
      if (m) hubViews[m[1]] = (hubViews[m[1]] ?? 0) + p.views;
    }
    const chapters = (internal?.chapters ?? []).map((c: any) => ({
      ...c, ...(visit[c.slug] ?? { users: 0, sessions: 0, new_users: 0, users_prev: 0, sessions_prev: 0 }), hub_views: hubViews[c.slug] ?? 0,
    }));

    // Topic views from Google, by the post id in the address.
    const postViews = new Map<string, number>();
    for (const p of ga?.pulse_posts ?? []) postViews.set(p.id, (postViews.get(p.id) ?? 0) + p.views);
    const content = (internal?.content ?? []).map((t: any) => ({ ...t, views: postViews.get(String(t.id)) ?? 0 }));

    const out = { ...(ga ?? {}) };
    delete out.geo_cur; delete out.geo_prev; delete out.pulse_posts;
    const countries: Record<string, number> = {};
    for (const r of ga?.geo_cur ?? []) countries[r.country] = (countries[r.country] ?? 0) + r.users;
    out.countries = Object.entries(countries).map(([country, users]) => ({ country, users })).sort((a, b) => b.users - a.users).slice(0, 50);
    const cities: Record<string, { city: string; region: string; country: string; users: number; chapter: string | null }> = {};
    for (const r of ga?.geo_cur ?? []) {
      const k = `${r.city}|${r.region}|${r.country}`;
      (cities[k] ??= { city: r.city, region: r.region, country: r.country, users: 0, chapter: chapterOf(C, r) }).users += r.users;
    }
    out.cities = Object.values(cities).sort((a, b) => b.users - a.users).slice(0, 200);

    return json({ ok: true, bots: hideBots ? 'hide' : 'show', ga: ga ? out : null, ga_error: gaError, fetched_at: fetchedAt, internal: { ...internal, chapters: undefined, content: undefined }, chapters, content });
  } catch (e) {
    console.error('ve-analytics:', e);
    return json({ error: 'server_error' }, 500);
  }
});
