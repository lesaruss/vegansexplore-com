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

async function build(from: string, to: string, blogId?: number | null, withPodcast = true) {
  const errors: string[] = [];
  const channels: Record<string, any> = {
    instagram: { connected: true }, facebook: { connected: true }, tiktok: { connected: true }, youtube: { connected: true }, podcast: { connected: true },
  };
  let posts: any[] = [];
  const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'metricool').maybeSingle();
  const key = await secret(conn?.config?.api_key_secret || 'VE_METRICOOL_API_KEY');
  const ctx = { key: key || '', q: `userId=${conn?.config?.user_id}&blogId=${blogId || conn?.config?.blog_id}` };
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
    withPodcast ? safe('podcast', () => captivate()) : Promise.resolve([] as any[]),
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
  if (!cap && withPodcast) channels.podcast.error = 'Captivate did not answer';
  if (!withPodcast) delete channels.podcast;
  channels.x = { connected: false, note: 'Not connected in Metricool' };
  return { posts, channels, errors, from, to };
}


// ---- The studio (Sean, 2026-11-01: "see what's slotted for the different brands... you propose things... the community manager goes
// in... They make any adjustments... or leave a note that you will then take care of... you will use your connections to push it out...
// If something needs a manual thing... we know ahead of time... a log... a calendar... track it to its metrics... between different
// brands... clients"). Tables ve_social_brands, ve_social_slots, ve_social_notes, ve_social_edits, ve_social_people (migration
// 20261101_ve_social_studio.sql). Who: ops (the admin token, written as Logan), super admins, and a brand's people (editor or viewer).
//   brands, slots {brand, from, to}, slot_get {id}, slot_save {id?, brand?, fields}, note_add {id, body}, note_done {note_id, reply?},
//   notes_open {brand?}, approve {id}, send_back {id, body}, skip {id}, push {id} (ops), sync (ops or cron), report {from, to, brand?}
// Approving pushes the slot to the brand's Metricool scheduler (autoPublish). A channel the brand has not connected in Metricool, or a
// brand with no Metricool brand yet, makes the slot Manual with the reason, so it is known ahead of time. sync marks Metricool's
// published posts Posted with their links and copies their numbers from the analytics (matched by link).
type Who = { ops: boolean; admin: boolean; id: string | null; name: string };
const EDITABLE = ['slot_at', 'channels', 'kind', 'title', 'caption', 'first_comment', 'links', 'assets', 'manual_steps', 'batch'];
const KINDS = ['post', 'carousel', 'reel', 'story', 'video', 'episode', 'thread'];
const NETS = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin', 'threads', 'pinterest', 'bluesky', 'gmb'];

async function roleFor(who: Who, brand: string): Promise<'editor' | 'viewer' | null> {
  if (who.ops || who.admin) return 'editor';
  if (!who.id) return null;
  const { data } = await db.from('ve_social_people').select('role').eq('brand_slug', brand).eq('member_id', who.id).maybeSingle();
  return (data?.role as any) || null;
}
async function mcCtx(blog: number) {
  const { data: conn } = await db.from('analytics_connections').select('config').eq('provider', 'metricool').maybeSingle();
  const key = await secret(conn?.config?.api_key_secret || 'VE_METRICOOL_API_KEY');
  if (!key) throw new Error('metricool: no key');
  return { key, q: `userId=${conn?.config?.user_id}&blogId=${blog}` };
}
async function mcSend(method: string, path: string, ctx: { key: string; q: string }, body?: unknown) {
  const r = await fetch(`${MC}${path}${path.includes('?') ? '&' : '?'}${ctx.q}`, { method, headers: { 'X-Mc-Auth': ctx.key, Accept: 'application/json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let o: any = null; try { o = JSON.parse(t); } catch { /* text */ }
  if (!r.ok) throw new Error(`metricool ${r.status}: ${t.slice(0, 200)}`);
  return o;
}
const easternLocal = (iso: string) => {
  const d = new Date(iso); const off = tzOffsetMs(d.getTime(), SHOW_TZ);
  return new Date(d.getTime() + off).toISOString().slice(0, 19);
};
function mcBody(s: any, nets: string[]) {
  // Covers and storyboard frames are for the team's eyes only; they never go out as the post's media.
  const media = (s.assets || []).filter((a: any) => a && a.type !== 'cover' && a.type !== 'storyboard').map((a: any) => a.url).filter((u: any) => typeof u === 'string' && /^https:\/\//.test(u));
  const type = s.kind === 'story' ? 'STORY' : (s.kind === 'reel' || s.kind === 'video' || s.kind === 'episode') ? 'REEL' : 'POST';
  const body: any = {
    publicationDate: { dateTime: easternLocal(s.slot_at), timezone: SHOW_TZ },
    text: s.caption, providers: nets.map((n) => ({ network: n })), autoPublish: true, draft: false, media,
    saveExternalMediaFiles: true, firstCommentText: s.first_comment || '',
  };
  if (nets.includes('instagram')) body.instagramData = { autoPublish: true, type };
  if (nets.includes('facebook')) body.facebookData = { type: type === 'REEL' ? 'REEL' : type };
  if (nets.includes('youtube')) body.youtubeData = { title: (s.title || s.caption || '').slice(0, 100), type: 'SHORT', privacy: 'public' };
  if (nets.includes('tiktok')) body.tiktokData = { privacyOption: 'PUBLIC_TO_EVERYONE' };
  return body;
}
async function logEdit(slot: string, who: Who, field: string, oldV: unknown, newV: unknown) {
  await db.from('ve_social_edits').insert({ slot_id: slot, by_name: who.name, by_id: who.id, field, old_value: oldV ?? null, new_value: newV ?? null });
}
async function push(id: string, who: Who) {
  const { data: s } = await db.from('ve_social_slots').select('*').eq('id', id).maybeSingle();
  if (!s) return { error: 'not_found' };
  const { data: b } = await db.from('ve_social_brands').select('*').eq('slug', s.brand_slug).maybeSingle();
  const set = async (f: Record<string, unknown>) => { await db.from('ve_social_slots').update({ ...f, updated_at: new Date().toISOString() }).eq('id', id); };
  if (Date.parse(s.slot_at) < Date.now() + 2 * 60000) { await set({ status: 'failed', push_error: 'The time has passed. Pick a new time and approve it again.' }); return { error: 'time_passed' }; }
  if (!b?.metricool_blog_id) { await set({ status: 'manual', push_error: `${b?.name || s.brand_slug} is not in Metricool yet, so this one is posted by hand.` }); return { status: 'manual' }; }
  const nets = (s.channels || []).filter((n: string) => NETS.includes(n));
  const auto = nets.filter((n: string) => (b.channels || []).includes(n));
  const handNets = nets.filter((n: string) => !auto.includes(n));
  if (!auto.length) { await set({ status: 'manual', push_error: `None of its channels (${nets.join(', ') || 'none'}) are connected in Metricool for ${b.name}.` }); return { status: 'manual' }; }
  const isVideoKind = ['reel', 'video', 'episode'].includes(s.kind);
  if (isVideoKind && !(s.assets || []).some((a: any) => a?.type === 'video' && a?.url)) { await set({ status: 'changes', push_error: 'No video yet. Add the finished video, then approve it again.' }); return { error: 'no_video' }; }
  if (!s.caption?.trim() && !(s.assets || []).length) { await set({ status: 'failed', push_error: 'Nothing to post: no caption and no picture or video.' }); return { error: 'empty' }; }
  const ctx = await mcCtx(b.metricool_blog_id);
  if (s.metricool_post_id) { try { await mcSend('DELETE', `/v2/scheduler/posts/${s.metricool_post_id}`, ctx); } catch { /* already gone */ } }
  try {
    const o = await mcSend('POST', '/v2/scheduler/posts', ctx, mcBody(s, auto));
    const mid = o?.data?.id;
    await set({ status: handNets.length ? 'manual' : 'scheduled', metricool_post_id: mid || null, metricool_state: o?.data?.providers || null, pushed_at: new Date().toISOString(),
      push_error: handNets.length ? `Scheduled in Metricool for ${auto.join(', ')}. Post it by hand on ${handNets.join(', ')} (not connected in Metricool).` : null });
    await logEdit(id, who, 'pushed', null, { metricool_post_id: mid, channels: auto });
    return { status: handNets.length ? 'manual' : 'scheduled', metricool_post_id: mid };
  } catch (e) {
    await set({ status: 'failed', push_error: String((e as Error).message || e).slice(0, 400) });
    return { error: 'push_failed', detail: String((e as Error).message || e) };
  }
}
const normUrl = (u: string) => String(u || '').split('?')[0].replace(/\/$/, '');
async function sync() {
  const { data: slots } = await db.from('ve_social_slots').select('*').in('status', ['scheduled', 'manual', 'posted']).not('metricool_post_id', 'is', null)
    .gte('slot_at', new Date(Date.now() - 30 * 86400000).toISOString()).lte('slot_at', new Date(Date.now() + 86400000).toISOString());
  const out = { checked: 0, posted: 0, failed: 0, metrics: 0 };
  const byBrand: Record<string, any[]> = {};
  for (const s of slots || []) (byBrand[s.brand_slug] ||= []).push(s);
  for (const [brand, list] of Object.entries(byBrand)) {
    const { data: b } = await db.from('ve_social_brands').select('*').eq('slug', brand).maybeSingle();
    if (!b?.metricool_blog_id) continue;
    const ctx = await mcCtx(b.metricool_blog_id);
    const times = list.map((s) => Date.parse(s.slot_at));
    const from = new Date(Math.min(...times) - 86400000), to = new Date(Math.max(...times) + 86400000);
    const sched = await mcSend('GET', `/v2/scheduler/posts?start=${easternLocal(from.toISOString())}&end=${easternLocal(to.toISOString())}&timezone=America%2FNew_York`, ctx).catch(() => null);
    const byId = new Map(((sched?.data) || []).map((p: any) => [String(p.id), p]));
    let analytics: any = null;
    for (const s of list) {
      out.checked++;
      const p: any = byId.get(String(s.metricool_post_id));
      const f: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (p) {
        f.metricool_state = p.providers || null;
        const provs = (p.providers || []) as any[];
        const urls: Record<string, string> = { ...(s.post_urls || {}) };
        for (const pr of provs) if (pr.publicUrl) urls[String(pr.network).toLowerCase()] = pr.publicUrl;
        f.post_urls = urls;
        const done = provs.length && provs.every((pr) => /PUBLISH|SUCCESS/i.test(String(pr.status)));
        const bad = provs.filter((pr) => /ERROR|FAIL|REJECT/i.test(String(pr.status)));
        if (bad.length) { f.status = 'failed'; f.push_error = bad.map((pr) => `${pr.network}: ${pr.detailedStatus || pr.status}`).join('; '); out.failed++; }
        else if (done && s.status !== 'posted') { f.status = s.status === 'manual' ? 'manual' : 'posted'; f.posted_at = s.posted_at || new Date().toISOString(); out.posted++; }
      }
      if ((s.status === 'posted' || f.status === 'posted') && Object.keys((f.post_urls || s.post_urls) as any || {}).length) {
        if (!analytics) {
          const day = (d: Date) => new Date(d.getTime() + tzOffsetMs(d.getTime(), SHOW_TZ)).toISOString().slice(0, 10);
          analytics = await build(day(new Date(Date.now() - 32 * 86400000)), day(new Date()), b.metricool_blog_id, false).catch(() => null);
        }
        const urls = Object.values((f.post_urls || s.post_urls) as Record<string, string>).map(normUrl);
        const m: Record<string, unknown> = {};
        for (const p2 of (analytics?.posts || [])) if (p2.url && urls.includes(normUrl(p2.url))) m[p2.channel] = p2.metrics;
        if (Object.keys(m).length) { f.metrics = m; f.metrics_at = new Date().toISOString(); out.metrics++; }
      }
      await db.from('ve_social_slots').update(f).eq('id', s.id);
    }
  }
  return out;
}

async function studio(body: any, who: Who) {
  const a = body.action;
  if (a === 'brands') {
    let q = db.from('ve_social_brands').select('slug,name,kind,metricool_blog_id,channels,note,active').eq('active', true).order('kind').order('name');
    const { data } = await q;
    const list = [];
    for (const b of data || []) { const r = await roleFor(who, b.slug); if (r) list.push({ ...b, role: r, in_metricool: !!b.metricool_blog_id }); }
    const { data: open } = await db.from('ve_social_notes').select('id, slot_id, ve_social_slots!inner(brand_slug)').eq('status', 'open');
    const counts: Record<string, number> = {};
    for (const n of (open as any[]) || []) { const s = n.ve_social_slots?.brand_slug; if (s) counts[s] = (counts[s] || 0) + 1; }
    return { brands: list.map((b) => ({ ...b, open_notes: counts[b.slug] || 0 })), me: { name: who.name, admin: who.admin || who.ops } };
  }
  if (a === 'slots') {
    if (!(await roleFor(who, body.brand))) return { error: 'forbidden' };
    const { data } = await db.from('ve_social_slots').select('id,brand_slug,slot_at,channels,kind,title,caption,assets,status,batch,manual_steps,push_error,post_urls,metrics,posted_at')
      .eq('brand_slug', body.brand).gte('slot_at', body.from).lte('slot_at', body.to).order('slot_at');
    const ids = (data || []).map((s) => s.id);
    const { data: notes } = ids.length ? await db.from('ve_social_notes').select('slot_id,status').in('slot_id', ids) : { data: [] as any[] };
    const nc: Record<string, number> = {};
    for (const n of notes || []) if (n.status === 'open') nc[n.slot_id] = (nc[n.slot_id] || 0) + 1;
    return { slots: (data || []).map((s) => ({ ...s, thumb: (s.assets || []).find((x: any) => x?.thumb || x?.url)?.thumb || (s.assets || []).find((x: any) => x?.type !== 'video')?.url || null, open_notes: nc[s.id] || 0, assets: undefined })) };
  }
  if (a === 'slot_get') {
    const { data: s } = await db.from('ve_social_slots').select('*').eq('id', body.id).maybeSingle();
    if (!s) return { error: 'not_found' };
    const role = await roleFor(who, s.brand_slug); if (!role) return { error: 'forbidden' };
    const { data: notes } = await db.from('ve_social_notes').select('*').eq('slot_id', s.id).order('created_at');
    const { data: edits } = await db.from('ve_social_edits').select('by_name,field,old_value,new_value,at').eq('slot_id', s.id).order('at', { ascending: false }).limit(40);
    const { data: b } = await db.from('ve_social_brands').select('slug,name,channels,metricool_blog_id').eq('slug', s.brand_slug).maybeSingle();
    return { slot: s, notes: notes || [], edits: edits || [], brand: b, role };
  }
  if (a === 'slot_save') {
    const f = body.fields || {};
    let s: any = null;
    if (body.id) { const r = await db.from('ve_social_slots').select('*').eq('id', body.id).maybeSingle(); s = r.data; if (!s) return { error: 'not_found' }; }
    const brand = s?.brand_slug || body.brand;
    if ((await roleFor(who, brand)) !== 'editor') return { error: 'forbidden' };
    if (!s && !(who.ops || who.admin)) return { error: 'forbidden' };
    const clean: Record<string, unknown> = {};
    for (const k of EDITABLE) if (k in f) clean[k] = f[k];
    if ('slot_at' in clean && isNaN(Date.parse(String(clean.slot_at)))) return { error: 'bad_time' };
    if ('kind' in clean && !KINDS.includes(String(clean.kind))) return { error: 'bad_kind' };
    if ('channels' in clean) clean.channels = (Array.isArray(clean.channels) ? clean.channels : []).map(String).filter((n: string) => NETS.includes(n));
    if ('links' in clean) clean.links = (Array.isArray(clean.links) ? clean.links : []).map(String).filter((u: string) => /^https?:\/\//.test(u));
    if ('assets' in clean && !Array.isArray(clean.assets)) return { error: 'bad_assets' };
    if ('caption' in clean) clean.caption = String(clean.caption || '').slice(0, 5000);
    if (!s) {
      if (!clean.slot_at) return { error: 'bad_time' };
      const { data: b } = await db.from('ve_social_brands').select('slug').eq('slug', brand).maybeSingle();
      if (!b) return { error: 'no_brand' };
      const { data: ins, error } = await db.from('ve_social_slots').insert({ ...clean, brand_slug: brand, status: f.status === 'approved' && (who.ops || who.admin) ? 'approved' : 'proposed', proposed_by: who.name }).select('id').single();
      if (error) return { error: error.message };
      await logEdit(ins.id, who, 'created', null, clean);
      return { id: ins.id };
    }
    if (s.status === 'posted') return { error: 'already_posted' };
    const changed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(clean)) if (JSON.stringify(s[k]) !== JSON.stringify(v)) { changed[k] = v; await logEdit(s.id, who, k, s[k], v); }
    if (!Object.keys(changed).length) return { ok: true, unchanged: true };
    const upd: Record<string, unknown> = { ...changed, updated_at: new Date().toISOString() };
    await db.from('ve_social_slots').update(upd).eq('id', s.id);
    // A change to something already in Metricool goes back out with the change.
    if (s.status === 'scheduled' || (s.status === 'manual' && s.metricool_post_id)) { const r = await push(s.id, who); return { ok: true, repushed: r }; }
    return { ok: true };
  }
  if (a === 'note_add') {
    const { data: s } = await db.from('ve_social_slots').select('id,brand_slug').eq('id', body.id).maybeSingle();
    if (!s) return { error: 'not_found' };
    if (!(await roleFor(who, s.brand_slug))) return { error: 'forbidden' };
    const text = String(body.body || '').trim().slice(0, 3000);
    if (!text) return { error: 'empty' };
    const { data: n } = await db.from('ve_social_notes').insert({ slot_id: s.id, author_id: who.id, author_name: who.name, body: text, status: who.ops ? 'done' : 'open' }).select('*').single();
    if (body.send_back) await db.from('ve_social_slots').update({ status: 'changes', updated_at: new Date().toISOString() }).eq('id', s.id).in('status', ['proposed', 'approved', 'failed']);
    return { note: n };
  }
  if (a === 'note_done') {
    if (!(who.ops || who.admin)) return { error: 'forbidden' };
    const { data: n } = await db.from('ve_social_notes').update({ status: 'done', reply: body.reply ? String(body.reply).slice(0, 3000) : null, done_by: who.name, done_at: new Date().toISOString() }).eq('id', body.note_id).select('*').maybeSingle();
    return n ? { note: n } : { error: 'not_found' };
  }
  if (a === 'notes_open') {
    if (!(who.ops || who.admin)) return { error: 'forbidden' };
    let q = db.from('ve_social_notes').select('id,slot_id,author_name,body,created_at,ve_social_slots!inner(brand_slug,slot_at,title,caption,status)').eq('status', 'open').order('created_at');
    if (body.brand) q = q.eq('ve_social_slots.brand_slug', body.brand);
    const { data } = await q;
    return { notes: data || [] };
  }
  if (a === 'approve' || a === 'skip' || a === 'send_back') {
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [body.id];
    const res: any[] = [];
    for (const id of ids) {
      const { data: s } = await db.from('ve_social_slots').select('id,brand_slug,status').eq('id', id).maybeSingle();
      if (!s) { res.push({ id, error: 'not_found' }); continue; }
      if ((await roleFor(who, s.brand_slug)) !== 'editor') { res.push({ id, error: 'forbidden' }); continue; }
      if (s.status === 'posted') { res.push({ id, error: 'already_posted' }); continue; }
      if (a === 'skip') {
        const { data: full } = await db.from('ve_social_slots').select('metricool_post_id,brand_slug').eq('id', id).maybeSingle();
        if (full?.metricool_post_id) {
          const { data: b } = await db.from('ve_social_brands').select('metricool_blog_id').eq('slug', full.brand_slug).maybeSingle();
          if (b?.metricool_blog_id) { try { await mcSend('DELETE', `/v2/scheduler/posts/${full.metricool_post_id}`, await mcCtx(b.metricool_blog_id)); } catch { /* gone */ } }
        }
        await db.from('ve_social_slots').update({ status: 'skipped', metricool_post_id: null, updated_at: new Date().toISOString() }).eq('id', id);
        await logEdit(id, who, 'status', s.status, 'skipped'); res.push({ id, status: 'skipped' }); continue;
      }
      if (a === 'send_back') {
        const text = String(body.body || '').trim();
        if (text) await db.from('ve_social_notes').insert({ slot_id: id, author_id: who.id, author_name: who.name, body: text.slice(0, 3000) });
        await db.from('ve_social_slots').update({ status: 'changes', updated_at: new Date().toISOString() }).eq('id', id);
        await logEdit(id, who, 'status', s.status, 'changes'); res.push({ id, status: 'changes' }); continue;
      }
      await db.from('ve_social_slots').update({ status: 'approved', approved_by: who.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
      await logEdit(id, who, 'status', s.status, 'approved');
      res.push({ id, ...(await push(id, who)) });
    }
    return Array.isArray(body.ids) ? { results: res } : res[0];
  }
  if (a === 'push') { if (!who.ops) return { error: 'forbidden' }; return await push(body.id, who); }
  if (a === 'sync') { if (!who.ops) return { error: 'forbidden' }; return await sync(); }
  return { error: 'unknown_action' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    const who: Who = { ops, admin: false, id: null, name: 'Logan' };
    if (!ops) {
      const sub = token ? await verifyToken(token) : null;
      if (!sub) return json({ error: 'not_authenticated' }, 401);
      // members has one name column (no first_name / last_name): "Sean A. Russell" reads as "Sean R." on notes and history.
      const { data: me, error: meErr } = await db.from('members').select('is_superadmin, name').eq('id', sub).maybeSingle();
      if (meErr) console.error('ve-social members:', meErr.message);
      if (!me) return json({ error: 'not_authenticated' }, 401);
      const parts = String(me.name || '').trim().split(/\s+/).filter(Boolean);
      who.admin = !!me.is_superadmin; who.id = sub;
      who.name = parts.length ? parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1][0] + '.' : '') : 'A team member';
    }
    if (body.action !== 'report') {
      const out = await studio(body, who);
      return json(out, out && (out as any).error === 'forbidden' ? 403 : 200);
    }
    if (!(ops || who.admin)) {
      if (!body.brand || !(await roleFor(who, body.brand))) return json({ error: 'forbidden' }, 403);
    }
    const { from, to } = body;
    if (!isDay(from) || !isDay(to) || from > to) return json({ error: 'bad_dates' }, 400);
    let blog: number | null = null, withPodcast = true, bslug = body.brand || 'vegans-explore';
    if (bslug !== 'vegans-explore') {
      const { data: b } = await db.from('ve_social_brands').select('metricool_blog_id').eq('slug', bslug).maybeSingle();
      if (!b?.metricool_blog_id) return json({ posts: [], channels: {}, errors: [], from, to, not_connected: true, fetched_at: new Date().toISOString() });
      blog = b.metricool_blog_id; withPodcast = false;
    }
    const key = `social:${bslug}:${from}:${to}`;
    const { data: hit } = await db.from('ve_analytics_cache').select('data, fetched_at').eq('key', key).maybeSingle();
    if (hit && !body.refresh && Date.now() - Date.parse(hit.fetched_at) < TTL_MS) return json({ ...hit.data, fetched_at: hit.fetched_at, cached: true });
    const out = await build(from, to, blog, withPodcast);
    const fetched_at = new Date().toISOString();
    if (out.errors.length < 4) await db.from('ve_analytics_cache').upsert({ key, data: out, fetched_at });
    return json({ ...out, fetched_at });
  } catch (e) {
    console.error('ve-social:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
