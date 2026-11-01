// ve-social: Depot > Social (Sean, 2026-11-01: "a social media page in the VE Depot where I can see a grid of scheduled content and
// click in it to see the caption, tags, links, and anything else... share analytics for all of our social feeds and make it so I
// can sort between channels to see scheduled and past content").
//   POST { action: 'report', from, to, refresh? }   super admin (the VE token) or ops (LESARUSS_ADMIN_TOKEN)
//   from/to: YYYY-MM-DD, Eastern days. The schedule always looks from today to 60 days ahead as well.
//   -> { posts: [...], channels: {instagram|facebook|tiktok|youtube|podcast: {connected, followers, followers_start, series, error?}},
//        fetched_at, errors }
// A post: { id, channel, kind, status (scheduled|published|draft|failed), at (ISO, UTC), caption, hashtags, mentions, links,
//   media: [url], thumb, url, metrics: {views, reach, likes, comments, shares, saves, interactions, engagement, ...},
//   first_comment?, source: 'metricool' | 'captivate' }
// Sources: Metricool (analytics_connections 'metricool': user_id, blog_id, api_key_secret -> lesaruss_secrets; header X-Mc-Auth;
// endpoints checked 2026-11-01: /v2/scheduler/posts, /v2/analytics/posts|reels/instagram, /v2/analytics/posts/facebook|tiktok,
// /stats/youtube/videos, /v2/analytics/timelines (subject account)). Metricool returns times in Europe/Madrid; they are turned
// into UTC here. The podcast comes from Captivate (analytics_connections 'captivate'), show 5f0184ac-... (the Vegans Explore
// Podcast), whose dates are in the show's time zone (America/New_York). X has no connection in Metricool (2026-11-01).
// Cached 30 minutes in ve_analytics_cache (key social:<from>:<to>). verify_jwt is off; the token is checked here.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MC = 'https://app.metricool.com/api';
const CAPTIVATE = 'https://api.captivate.fm';
const SHOW_ID = '5f0184ac-771d-41be-9db2-49f08fc0b880';
const SHOW_TZ = 'America/New_York';
const SHOW_ART = 'https://artwork.captivate.fm/7a6dedbb-e4ae-45df-b0a8-26d416116c39/cover-b-v1.jpg'; // cover B, an episode with no art of its own
const TTL_MS = 30 * 60 * 1000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isDay = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

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

// ---- time ----
function tzOffsetMs(utcMs: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs;
}
// "2026-08-02T00:40:55" in tz -> ISO UTC
function zoned(dt: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(dt || '');
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  let t = guess - tzOffsetMs(guess, tz);
  t = guess - tzOffsetMs(t, tz);
  return new Date(t).toISOString();
}
function anyTime(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v === 'object' && v.dateTime) return zoned(v.dateTime, v.timezone || 'UTC');
  if (typeof v === 'string') {
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(v)) { const d = Date.parse(v.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')); return isNaN(d) ? null : new Date(d).toISOString(); }
    return zoned(v, 'UTC');
  }
  return null;
}
// Eastern day boundaries as Metricool wants them (it takes a timezone parameter)
const mcRange = (from: string, to: string) => `from=${from}T00:00:00&to=${to}T23:59:59&timezone=America%2FNew_York`;

// ---- text ----
const tagsOf = (s: string) => Array.from(new Set((s.match(/#[\p{L}\p{N}_]+/gu) || [])));
const mentionsOf = (s: string) => Array.from(new Set((s.match(/(^|[^\w.])@([A-Za-z0-9_.]{2,30})/g) || []).map((x) => '@' + x.split('@')[1].replace(/\.$/, ''))));
const linksOf = (s: string) => Array.from(new Set((s.match(/https?:\/\/[^\s<>"')\]]+/g) || []).map((u) => u.replace(/[.,;:!?]+$/, ''))));
const strip = (h: string) => String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim();
const num = (v: any) => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));

function post(o: any) {
  const caption = String(o.caption || '');
  return {
    id: o.id, channel: o.channel, kind: o.kind || 'post', status: o.status, at: o.at, caption,
    hashtags: tagsOf(caption), mentions: mentionsOf(caption), links: Array.from(new Set([...(o.links || []), ...linksOf(caption)])),
    media: (o.media || []).filter(Boolean), thumb: o.thumb || (o.media || [])[0] || null, url: o.url || null,
    metrics: o.metrics || {}, first_comment: o.first_comment || null, source: o.source, extra: o.extra || undefined,
  };
}

// ---- Metricool ----
async function mc(path: string, ctx: { key: string; q: string }) {
  const r = await fetch(`${MC}${path}${path.includes('?') ? '&' : '?'}${ctx.q}`, { headers: { 'X-Mc-Auth': ctx.key, Accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(`metricool ${r.status} ${path.split('?')[0]}: ${t.slice(0, 160)}`);
  try { return JSON.parse(t); } catch { throw new Error(`metricool ${path.split('?')[0]}: not JSON`); }
}
const NET: Record<string, string> = { instagram: 'instagram', facebook: 'facebook', tiktok: 'tiktok', youtube: 'youtube', twitter: 'x', x: 'x', linkedin: 'linkedin', pinterest: 'pinterest', threads: 'threads', bluesky: 'bluesky', gmb: 'google' };
function schedStatus(s: string, draft: boolean): string {
  const v = String(s || '').toUpperCase();
  if (draft) return 'draft';
  if (/PUBLISH|SUCCESS|DONE/.test(v)) return 'published';
  if (/ERROR|FAIL|REJECT/.test(v)) return 'failed';
  return 'scheduled';
}
// One scheduler post can go to several networks: one card per network, so each channel shows what it will get.
function fromScheduler(p: any): any[] {
  const caption = String(p.text ?? p.message ?? '');
  const at = anyTime(p.publicationDate) || anyTime(p.date);
  const media = (p.media || []).map((m: any) => (typeof m === 'string' ? m : m?.url || m?.mediaUrl)).filter(Boolean);
  const provs = Array.isArray(p.providers) && p.providers.length ? p.providers : [{ network: p.network || 'unknown', status: p.status }];
  return provs.map((pr: any) => {
    const ch = NET[String(pr.network || '').toLowerCase()] || String(pr.network || 'unknown').toLowerCase();
    const extra: Record<string, unknown> = {};
    const nd = p[`${pr.network}Data`] || p[`${String(pr.network).toLowerCase()}Data`];
    if (nd && typeof nd === 'object') extra.settings = nd;
    if (pr.detail) extra.detail = pr.detail;
    return post({
      id: `mc-${p.id}-${ch}`, channel: ch, kind: nd?.type ? String(nd.type).toLowerCase() : (media.length > 1 ? 'carousel' : 'post'),
      status: schedStatus(pr.status || p.status, !!p.draft), at, caption, media, url: pr.publicUrl || null,
      first_comment: p.firstCommentText || null, source: 'metricool', extra: { ...extra, scheduler_id: p.id, auto_publish: p.autoPublish ?? null },
    });
  });
}
function igPost(p: any, reel: boolean) {
  return post({
    id: `ig-${p.postId || p.reelId}`, channel: 'instagram', kind: reel ? 'reel' : String(p.type || 'post').toLowerCase().replace('feed_', ''),
    status: 'published', at: anyTime(p.publishedAt), caption: p.content, media: [p.imageUrl], url: p.url, source: 'metricool',
    metrics: { views: num(p.views ?? p.impressionsTotal), reach: num(p.reach), likes: num(p.likes), comments: num(p.comments), shares: num(p.shares), saves: num(p.saved), interactions: num(p.interactions), engagement: num(p.engagement), follows: num(p.follows), avg_watch_s: num(p.averageWatchTime), skip_rate: num(p.reelsSkipRate) },
  });
}
function fbPost(p: any) {
  return post({
    id: `fb-${p.postId}`, channel: 'facebook', kind: String(p.type || 'post').toLowerCase(), status: 'published',
    at: anyTime(p.timestamp ?? p.created), caption: p.text, media: [p.picture || p.imageUrl], url: p.link, source: 'metricool',
    metrics: { views: num(p.impressions), reach: num(p.impressionsUnique), likes: num(p.reactions ?? p.like), comments: num(p.comments), shares: num(p.shares), clicks: num(p.clicks), link_clicks: num(p.linkclicks), video_views: num(p.videoViews), engagement: num(p.engagement) },
  });
}
function ttPost(p: any) {
  return post({
    id: `tt-${p.videoId}`, channel: 'tiktok', kind: 'video', status: 'published', at: anyTime(p.createTime),
    caption: p.videoDescription, media: [p.coverImageUrl], url: p.shareUrl ? String(p.shareUrl).split('?')[0] : null, source: 'metricool',
    metrics: { views: num(p.viewCount), reach: num(p.reach), likes: num(p.likeCount), comments: num(p.commentCount), shares: num(p.shareCount), engagement: num(p.engagement), avg_watch_s: num(p.averageTimeWatched), full_watch_rate: p.fullVideoWatchedRate != null ? Math.round(Number(p.fullVideoWatchedRate) * 1000) / 10 : null },
  });
}
function ytPost(p: any) {
  const thumb = p.thumbnailUrl ? String(p.thumbnailUrl).replace('/default.jpg', '/hqdefault.jpg') : null;
  return post({
    id: `yt-${p.videoId}`, channel: 'youtube', kind: Number(p.duration) <= 60 ? 'short' : 'video', status: 'published',
    at: anyTime(p.publishedAt), caption: [p.title, p.description].filter(Boolean).join('\n\n'), media: [thumb], url: p.watchUrl || `https://www.youtube.com/watch?v=${p.videoId}`,
    source: 'metricool', extra: { title: p.title },
    metrics: { views: num(p.views), likes: num(p.likes), comments: num(p.comments), shares: num(p.shares), watch_minutes: num(p.watchMinutes), avg_watch_s: num(p.averageViewDuration) },
  });
}
const FOLLOW: Record<string, string> = { instagram: 'followers', facebook: 'pageFollows', tiktok: 'followers_count', youtube: 'totalSubscribers' };
async function followers(net: string, from: string, to: string, ctx: any) {
  const o = await mc(`/v2/analytics/timelines?${mcRange(from, to)}&metric=${FOLLOW[net]}&network=${net}&subject=account`, ctx);
  const vals = ((o?.data || [])[0]?.values || []).map((v: any) => ({ day: (anyTime(v.dateTime) || '').slice(0, 10), value: num(v.value) }))
    .filter((v: any) => v.day && v.value != null).sort((a: any, b: any) => a.day.localeCompare(b.day));
  return { followers: vals.length ? vals[vals.length - 1].value : null, followers_start: vals.length ? vals[0].value : null, series: vals };
}

// ---- Captivate ----
async function captivate(): Promise<any[]> {
  const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'captivate').maybeSingle();
  const userId = conn?.config?.user_id;
  const key = await secret(conn?.config?.api_key_secret || 'VE_CAPTIVATE_API_KEY');
  if (!userId || !key) throw new Error('captivate not configured');
  const af = new FormData(); af.append('username', String(userId)); af.append('token', key);
  const ar = await fetch(`${CAPTIVATE}/authenticate/token`, { method: 'POST', body: af });
  const token = (await ar.json().catch(() => ({})))?.user?.token;
  if (!token) throw new Error(`captivate auth ${ar.status}`);
  const r = await fetch(`${CAPTIVATE}/shows/${SHOW_ID}/episodes`, { headers: { Authorization: `Bearer ${token}` } });
  const o = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`captivate ${r.status}`);
  return (o.episodes || o.records || []).map((e: any) => {
    const st = String(e.status || '').toLowerCase();
    const raw = String(e.published_date || e.date || '').replace(/\.\d+Z$|Z$/, '');
    const notes = strip(e.shownotes || '');
    return post({
      id: `cap-${e.id}`, channel: 'podcast', kind: 'episode',
      status: st === 'published' ? 'published' : st === 'scheduled' ? 'scheduled' : st === 'draft' ? 'draft' : st || 'draft',
      at: zoned(raw, SHOW_TZ), caption: [e.title, notes].filter(Boolean).join('\n\n'), media: [e.episode_art || SHOW_ART],
      url: st === 'published' ? 'https://vegans-explore.captivate.fm/' : null, source: 'captivate',
      extra: { title: e.title, episode_number: e.itunes_episode ?? e.episode_number ?? null, media_id: e.media_id, audio: e.media_url || null },
      links: linksOf(e.shownotes || ''),
    });
  });
}

async function build(from: string, to: string) {
  const errors: string[] = [];
  const channels: Record<string, any> = {
    instagram: { connected: true }, facebook: { connected: true }, tiktok: { connected: true }, youtube: { connected: true }, podcast: { connected: true },
  };
  let posts: any[] = [];
  const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'metricool').maybeSingle();
  const key = await secret(conn?.config?.api_key_secret || 'VE_METRICOOL_API_KEY');
  const ctx = { key: key || '', q: `userId=${conn?.config?.user_id}&blogId=${conn?.config?.blog_id}` };
  const today = new Date(Date.now() + tzOffsetMs(Date.now(), SHOW_TZ)).toISOString().slice(0, 10);
  const ahead = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const sFrom = from < today ? from : today;
  const sTo = to > ahead ? to : ahead;
  const safe = async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => { try { return await fn(); } catch (e) { errors.push(`${label}: ${String((e as Error).message || e)}`); return null; } };

  if (!key) errors.push('metricool: no key');
  const [sched, ig, reels, fb, tt, yt, cap, fIg, fFb, fTt, fYt] = await Promise.all([
    key ? safe('schedule', () => mc(`/v2/scheduler/posts?start=${sFrom}T00:00:00&end=${sTo}T23:59:59&timezone=America%2FNew_York`, ctx)) : null,
    key ? safe('instagram', () => mc(`/v2/analytics/posts/instagram?${mcRange(from, to)}`, ctx)) : null,
    key ? safe('instagram reels', () => mc(`/v2/analytics/reels/instagram?${mcRange(from, to)}`, ctx)) : null,
    key ? safe('facebook', () => mc(`/v2/analytics/posts/facebook?${mcRange(from, to)}`, ctx)) : null,
    key ? safe('tiktok', () => mc(`/v2/analytics/posts/tiktok?${mcRange(from, to)}`, ctx)) : null,
    key ? safe('youtube', () => mc(`/stats/youtube/videos?start=${from.replace(/-/g, '')}&end=${to.replace(/-/g, '')}`, ctx)) : null,
    safe('podcast', () => captivate()),
    key ? safe('instagram followers', () => followers('instagram', from, to, ctx)) : null,
    key ? safe('facebook followers', () => followers('facebook', from, to, ctx)) : null,
    key ? safe('tiktok followers', () => followers('tiktok', from, to, ctx)) : null,
    key ? safe('youtube subscribers', () => followers('youtube', from, to, ctx)) : null,
  ]);

  const published: any[] = [];
  for (const p of (ig as any)?.data || []) published.push(igPost(p, false));
  for (const p of (reels as any)?.data || []) published.push(igPost(p, true));
  for (const p of (fb as any)?.data || []) published.push(fbPost(p));
  for (const p of (tt as any)?.data || []) published.push(ttPost(p));
  for (const p of (Array.isArray(yt) ? yt : (yt as any)?.data || [])) published.push(ytPost(p));
  const scheduled: any[] = [];
  for (const p of (sched as any)?.data || []) scheduled.push(...fromScheduler(p));
  // A scheduled post that went out also shows in the analytics: keep one card, with the scheduler's details and the numbers.
  const byUrl = new Map(published.filter((p) => p.url).map((p) => [p.url.split('?')[0].replace(/\/$/, ''), p]));
  for (const s of scheduled) {
    const hit = s.url && byUrl.get(s.url.split('?')[0].replace(/\/$/, ''));
    if (hit) { s.metrics = hit.metrics; s.thumb = s.thumb || hit.thumb; s.status = 'published'; published.splice(published.indexOf(hit), 1); }
  }
  posts = [...scheduled, ...published];
  // Podcast: every scheduled or draft episode, and the published ones in the period.
  for (const e of (cap as any[]) || []) {
    const day = (e.at || '').slice(0, 10);
    if (e.status !== 'published' || (day >= from && day <= to)) posts.push(e);
  }
  // Published content outside the period is left out (the schedule's window is wider).
  posts = posts.filter((p) => p.status !== 'published' || ((p.at || '').slice(0, 10) >= from && (p.at || '').slice(0, 10) <= to) || p.channel === 'podcast');
  posts.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

  const fol: Record<string, any> = { instagram: fIg, facebook: fFb, tiktok: fTt, youtube: fYt };
  for (const [ch, f] of Object.entries(fol)) if (f) Object.assign(channels[ch], f);
  if (key && errors.some((e) => /metricool 401|metricool 403/.test(e))) for (const ch of ['instagram', 'facebook', 'tiktok', 'youtube']) channels[ch].error = 'Metricool refused the key';
  if (!cap) channels.podcast.error = 'Captivate did not answer';
  channels.x = { connected: false, note: 'Not connected in Metricool' };
  return { posts, channels, errors, from, to };
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
    const { from, to } = body;
    if (!isDay(from) || !isDay(to) || from > to) return json({ error: 'bad_dates' }, 400);
    const key = `social:${from}:${to}`;
    const { data: hit } = await db.from('ve_analytics_cache').select('data, fetched_at').eq('key', key).maybeSingle();
    if (hit && !body.refresh && Date.now() - Date.parse(hit.fetched_at) < TTL_MS) return json({ ...hit.data, fetched_at: hit.fetched_at, cached: true });
    const out = await build(from, to);
    const fetched_at = new Date().toISOString();
    if (out.errors.length < 4) await db.from('ve_analytics_cache').upsert({ key, data: out, fetched_at });
    return json({ ...out, fetched_at });
  } catch (e) {
    console.error('ve-social:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
