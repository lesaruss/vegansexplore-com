// ve-youtube: a YouTube channel's videos on its listing, watched on our page (Sean, 2026-10-29: "find some popular YouTube vegan
// channels and then populate it the same way... where we had the feed come in. So any new video that pops up will show on their
// page... the video on the left, and then a summary... below it, you will see thumbnails of their latest videos fed right through
// it. So you can just watch everything on this page"). Migration 20261029_ve_youtube_feeds.sql.
//
// YouTube refuses our server its channel pages and its RSS feeds (a blank page and a 404 for every channel, checked 2026-10-29), so
// this reads YouTube's own Data API v3 with the project's Google key (YOUTUBE_API_KEY, else GOOGLE_PLACES_API_KEY; the YouTube Data
// API is on for that key since 2026-10-29). A channel is listings.details.youtube_channel_id (a YouTube listing, or a News Outlet
// such as Plant Based News); its latest 50 videos and 50 Shorts
// are kept in ve_youtube_feeds and read again when older than 6 hours (3 API units a channel a read, of 10,000 a day); a read
// that fails keeps serving what we have. Videos play in YouTube's own player (youtube-nocookie); nothing is copied.
//
// Playlists (Sean, 2026-10-30, Brooke Sellers' series on meatlessmuscle.com: "will it stay up to date?"; migration
// 20261030_ve_youtube_playlists.sql): a playlist row in ve_youtube_playlists is served whole, newest first, with each video's length,
// read again when older than 6 hours, the same way. Only listed playlists are served, so nobody can spend our quota on others.
//
// POST { action: 'videos', listing_id | slug }       anyone: { channel, videos, shorts } (long-form and Shorts apart)
// POST { action: 'playlist', id }                    anyone: { playlist, videos } for a playlist in ve_youtube_playlists
// POST { action: 'resolve', handle | channel_id }     ops (Bearer LESARUSS_ADMIN_TOKEN): the channel's id, title, description,
//                                                     picture, subscribers and uploads, to add a channel
// POST { action: 'refresh' }                          the cron (x-cron-secret) or ops: reads up to 20 channels and 10 playlists
//                                                     older than 6 hours
//
// verify_jwt is false: anyone may read a channel's videos; ops and the cron are checked here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const FRESH_MS = 6 * 3600e3, KEEP = 50, PLAYLIST_MAX = 200;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isChannel = (v: unknown) => typeof v === 'string' && /^UC[\w-]{22}$/.test(v);
const isPlaylist = (v: unknown) => typeof v === 'string' && /^PL[\w-]{10,64}$/.test(v);

async function secret(key: string) {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return (data?.value as string) || '';
}
async function apiKey() { return (await secret('YOUTUBE_API_KEY')) || (await secret('GOOGLE_PLACES_API_KEY')); }

async function yt(path: string, params: Record<string, string>) {
  const key = await apiKey();
  if (!key) throw new Error('no_key');
  const q = new URLSearchParams({ ...params, key });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${q}`);
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message ? `${r.status} ${d.error.message}`.slice(0, 300) : `youtube ${r.status}`);
  return d;
}

const pic = (t: any) => t?.maxres?.url || t?.standard?.url || t?.high?.url || t?.medium?.url || t?.default?.url || '';

async function channelInfo(by: { id?: string; handle?: string }) {
  const params: Record<string, string> = { part: 'snippet,contentDetails,statistics' };
  if (by.id) params.id = by.id; else params.forHandle = String(by.handle || '').replace(/^@?/, '@');
  const d = await yt('channels', params);
  const c = d.items?.[0];
  if (!c) return null;
  return {
    channel_id: c.id, title: c.snippet?.title || '', description: c.snippet?.description || '', handle: c.snippet?.customUrl || '',
    thumb: pic(c.snippet?.thumbnails), country: c.snippet?.country || '',
    subscribers: c.statistics?.hiddenSubscriberCount ? null : Number(c.statistics?.subscriberCount || 0),
    video_count: Number(c.statistics?.videoCount || 0), uploads: c.contentDetails?.relatedPlaylists?.uploads || '',
  };
}

const item = (i: any) => ({
  id: i.contentDetails?.videoId || i.snippet?.resourceId?.videoId || '',
  title: i.snippet?.title || '',
  published: i.contentDetails?.videoPublishedAt || i.snippet?.publishedAt || '',
  thumb: pic(i.snippet?.thumbnails),
  summary: String(i.snippet?.description || '').slice(0, 300),
});
const real = (v: any) => /^[\w-]{11}$/.test(v.id) && v.title !== 'Private video' && v.title !== 'Deleted video';

// The latest uploads, newest first, Shorts included (YouTube's uploads list does not mark them).
async function uploads(playlist: string) {
  const d = await yt('playlistItems', { part: 'snippet,contentDetails', playlistId: playlist, maxResults: String(KEEP) });
  return (d.items || []).map(item).filter(real);
}

async function read(listing: any) {
  const channel = listing.details?.youtube_channel_id;
  if (!isChannel(channel)) return { error: 'no_channel' };
  try {
    const info = await channelInfo({ id: channel });
    if (!info) throw new Error('channel_not_found');
    // Videos and Shorts apart (Sean, 2026-10-29: "sort the shorts from the regular videos... right now it's all buried together"):
    // YouTube keeps each channel's long-form uploads in the list UULF<id> and its Shorts in UUSH<id> (the uploads list UU<id> mixes
    // them). A channel with no Shorts has no UUSH list; if UULF is ever refused, the mixed uploads stand in as videos.
    const base = channel.slice(2);
    let videos: any[] = [], shorts: any[] = [];
    try { videos = await uploads('UULF' + base); }
    catch { videos = info.uploads ? await uploads(info.uploads) : []; }
    try { shorts = await uploads('UUSH' + base); } catch { shorts = []; }
    const row = { listing_id: listing.id, channel_id: channel, title: info.title, handle: info.handle, thumb: info.thumb,
      subscribers: info.subscribers, video_count: info.video_count, videos, shorts, fetched_at: new Date().toISOString(), error: null };
    await db.from('ve_youtube_feeds').upsert(row, { onConflict: 'listing_id' });
    // Active while it uploads, like a podcast: a video in the last six months, else On hiatus (never Ended).
    const latest = Math.max(videos[0]?.published ? Date.parse(videos[0].published) : 0, shorts[0]?.published ? Date.parse(shorts[0].published) : 0);
    const status = latest && Date.now() - latest < 183 * 864e5 ? 'OPERATIONAL' : 'CLOSED_TEMPORARILY';
    if (latest && listing.category === 'YouTube' && listing.business_status !== status) await db.from('listings').update({ business_status: status }).eq('id', listing.id);
    return row;
  } catch (e) {
    const msg = String((e as Error).message || e).slice(0, 300);
    await db.from('ve_youtube_feeds').upsert({ listing_id: listing.id, channel_id: channel, error: msg, fetched_at: new Date().toISOString() }, { onConflict: 'listing_id' });
    return { error: msg };
  }
}

// ISO 8601 (PT1H2M3S) as the clock a video card shows: 1:02:03, 23:17, 0:45.
function clock(iso: string) {
  const m = String(iso || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return '';
  const h = (+m[1] || 0) * 24 + (+m[2] || 0), mi = +m[3] || 0, s = +m[4] || 0;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(mi)}:${p(s)}` : `${mi}:${p(s)}`;
}

// A whole playlist (up to 200), newest first, each with its length (one videos call per 50).
async function readPlaylist(row: any) {
  const id = row.playlist_id;
  try {
    const meta = await yt('playlists', { part: 'snippet,contentDetails', id });
    const p = meta.items?.[0];
    if (!p) throw new Error('playlist_not_found');
    let items: any[] = [], page = '';
    do {
      const d = await yt('playlistItems', { part: 'snippet,contentDetails', playlistId: id, maxResults: '50', ...(page ? { pageToken: page } : {}) });
      items = items.concat((d.items || []).map(item).filter(real));
      page = d.nextPageToken || '';
    } while (page && items.length < PLAYLIST_MAX);
    for (let i = 0; i < items.length; i += 50) {
      const chunk = items.slice(i, i + 50);
      const d = await yt('videos', { part: 'contentDetails', id: chunk.map((v) => v.id).join(',') });
      const len: Record<string, string> = {};
      (d.items || []).forEach((v: any) => { len[v.id] = clock(v.contentDetails?.duration); });
      chunk.forEach((v) => { v.duration = len[v.id] || ''; delete v.summary; });
    }
    items.sort((a, b) => (b.published || '').localeCompare(a.published || ''));
    const next = { playlist_id: id, title: p.snippet?.title || row.title || '', item_count: items.length, videos: items,
      fetched_at: new Date().toISOString(), error: null };
    await db.from('ve_youtube_playlists').update(next).eq('playlist_id', id);
    return { ...row, ...next };
  } catch (e) {
    const msg = String((e as Error).message || e).slice(0, 300);
    await db.from('ve_youtube_playlists').update({ error: msg, fetched_at: new Date().toISOString() }).eq('playlist_id', id);
    return { ...row, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const body: any = await req.json().catch(() => ({}));
  const action = String(body.action || '');
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ops = async () => { const t = await secret('LESARUSS_ADMIN_TOKEN'); return !!t && bearer === t; };

  if (action === 'videos') {
    // A YouTube listing, or another media listing with a channel (Plant Based News, a News Outlet).
    let q = db.from('listings').select('id, slug, name, category, business_status, details').eq('status', 'approved').not('details->>youtube_channel_id', 'is', null);
    q = isId(body.listing_id) ? q.eq('id', body.listing_id) : q.eq('slug', String(body.slug || ''));
    const { data: l } = await q.maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    const { data: f } = await db.from('ve_youtube_feeds').select('*').eq('listing_id', l.id).maybeSingle();
    let feed: any = f;
    if (!f || !f.fetched_at || Date.now() - Date.parse(f.fetched_at) > FRESH_MS) {
      const r: any = await read(l);
      if (!r.error) feed = r;
      else if (!f?.videos?.length) return json({ ok: true, channel: { title: l.name }, videos: [], error: r.error });
    }
    return json({ ok: true, channel: { id: feed.channel_id, title: feed.title, handle: feed.handle, thumb: feed.thumb,
      subscribers: feed.subscribers, video_count: feed.video_count, fetched_at: feed.fetched_at }, videos: feed.videos || [], shorts: feed.shorts || [] });
  }

  if (action === 'playlist') {
    if (!isPlaylist(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: row } = await db.from('ve_youtube_playlists').select('*').eq('playlist_id', body.id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    let p: any = row;
    if (!row.fetched_at || Date.now() - Date.parse(row.fetched_at) > FRESH_MS) {
      const r: any = await readPlaylist(row);
      if (!r.error) p = r;
      else if (!row.videos?.length) return json({ ok: false, error: r.error, videos: [] });
    }
    return json({ ok: true, playlist: { id: p.playlist_id, title: p.title, count: p.item_count, fetched_at: p.fetched_at }, videos: p.videos || [] });
  }

  if (action === 'resolve') {
    if (!(await ops())) return json({ error: 'unauthorized' }, 401);
    try {
      const info = await channelInfo(isChannel(body.channel_id) ? { id: body.channel_id } : { handle: body.handle });
      if (!info) return json({ error: 'not_found' }, 404);
      const latest = info.uploads ? (await uploads(info.uploads)).slice(0, 3) : [];
      return json({ ok: true, ...info, latest });
    } catch (e) { return json({ error: String((e as Error).message || e) }, 502); }
  }

  if (action === 'refresh') {
    const cron = req.headers.get('x-cron-secret');
    const cs = await secret('CRON_SECRET');
    if (!((cron && cs && cron === cs) || (await ops()))) return json({ error: 'unauthorized' }, 401);
    const { data: ls } = await db.from('listings').select('id, slug, category, business_status, details').eq('status', 'approved').not('details->>youtube_channel_id', 'is', null);
    const { data: fs } = await db.from('ve_youtube_feeds').select('listing_id, fetched_at');
    const at: Record<string, number> = {};
    (fs || []).forEach((f: any) => { at[f.listing_id] = f.fetched_at ? Date.parse(f.fetched_at) : 0; });
    const due = (ls || []).filter((l: any) => isChannel(l.details?.youtube_channel_id) && Date.now() - (at[l.id] || 0) > FRESH_MS)
      .sort((a: any, b: any) => (at[a.id] || 0) - (at[b.id] || 0)).slice(0, 20);
    const out: any[] = [];
    for (const l of due) { const r: any = await read(l); out.push({ slug: l.slug, videos: r.videos?.length ?? 0, error: r.error || null }); }
    const { data: ps } = await db.from('ve_youtube_playlists').select('playlist_id, title, fetched_at')
      .or(`fetched_at.is.null,fetched_at.lt.${new Date(Date.now() - FRESH_MS).toISOString()}`).order('fetched_at', { ascending: true, nullsFirst: true }).limit(10);
    const lists: any[] = [];
    for (const p of ps || []) { const r: any = await readPlaylist(p); lists.push({ id: p.playlist_id, videos: r.item_count ?? 0, error: r.error || null }); }
    return json({ ok: true, read: out, playlists: lists });
  }

  return json({ error: 'unknown_action' }, 400);
});
