// ve-podcast: a podcast's episodes on its listing, played on our page (Sean, 2026-10-27: "add an RSS of the podcast so that way it
// actually populates on their listing... people can actually just listen to the episodes on our platform... they can save the
// episodes. But it's all pulling from their RSS feed"). Migration 20261027_ve_podcast_feeds.sql.
//
// The feed is listings.rss_url; when it is empty it is found once from the listing's Apple Podcasts id (iTunes lookup, feedUrl)
// and saved. The latest 300 episodes are kept in ve_podcast_feeds and read again when older than 6 hours; a feed that fails keeps
// serving what we have. The audio plays from the podcast's own host; nothing is copied.
//
// POST { action: 'episodes', listing_id | slug, q?, offset?, limit? }  anyone: { show, episodes, total, saved? } (saved: the guids a
//                                                                       signed-in member saved from this show)
// POST { action: 'episode', listing_id | slug, guid }                   anyone: { show, episode, saved? }
// POST { action: 'save', listing_id, guid }                             an active member: toggles the save, { ok, saved }
// POST { action: 'saves' }                                              a signed-in member: their saved episodes, newest first
// POST { action: 'admin_feed', listing_id, rss_url }                    a super admin: sets the feed and reads it; '' turns it off
// POST { action: 'owner_saves', listing_id }                            the listing's owner or a super admin: who saved the show and
//                                                                       its episodes (Sean, 2026-10-27: saves in place of check-ins)
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const KEEP = 300, FRESH_MS = 6 * 3600e3, MAX_BYTES = 25e6;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
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

// ---- reading a feed ----
const txt = (v: any): string => v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v);
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
function plain(html: string, max: number): string {
  const s = html.replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
  return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : s;
}
function seconds(d: string): number | null {
  const s = d.trim(); if (!s) return null;
  if (/^\d+$/.test(s)) return +s;
  const p = s.split(':').map(Number); if (p.some(isNaN)) return null;
  return p.reduce((a, b) => a * 60 + b, 0);
}
const httpUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u) ? u : '';

async function readFeed(url: string) {
  const r = await fetch(url, { headers: { 'User-Agent': 'VegansExplore/1.0 (+https://vegansexplore.com)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    redirect: 'follow', signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('The feed answered ' + r.status);
  const len = +(r.headers.get('content-length') || 0); if (len > MAX_BYTES) throw new Error('The feed is too large');
  const xml = await r.text(); if (xml.length > MAX_BYTES) throw new Error('The feed is too large');
  const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', processEntities: true, htmlEntities: true }).parse(xml);
  const ch = doc?.rss?.channel; if (!ch) throw new Error('That is not a podcast RSS feed');
  const showImg = httpUrl(ch['itunes:image']?.['@_href'] || txt(ch.image?.url) || '');
  const items = ([] as any[]).concat(ch.item || []);
  const eps = items.map((it) => {
    const enc = ([] as any[]).concat(it.enclosure || []).find((e) => e?.['@_url']) || {};
    const audio = httpUrl(String(enc['@_url'] || ''));
    const title = plain(txt(it.title) || txt(it['itunes:title']), 300);
    const date = Date.parse(txt(it.pubDate));
    return {
      guid: (txt(it.guid) || audio || title).slice(0, 500), title, audio, type: String(enc['@_type'] || ''),
      date: isNaN(date) ? null : new Date(date).toISOString(), duration: seconds(txt(it['itunes:duration'])),
      image: httpUrl(it['itunes:image']?.['@_href'] || '') || '', link: httpUrl(txt(it.link)),
      summary: plain(txt(it['content:encoded']) || txt(it.description) || txt(it['itunes:summary']), 2000),
      season: +txt(it['itunes:season']) || null, episode: +txt(it['itunes:episode']) || null,
    };
  }).filter((e) => e.audio && e.title).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return { title: plain(txt(ch.title), 200), image: showImg, episodes: eps.slice(0, KEEP), count: eps.length };
}

async function appleFeed(l: any): Promise<string> {
  const m = String(l.apple_podcasts_url || l.details?.platforms?.apple || '').match(/id(\d{5,})/);
  if (!m) return '';
  try {
    const r = await fetch('https://itunes.apple.com/lookup?id=' + m[1] + '&entity=podcast', { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return httpUrl(String(d?.results?.[0]?.feedUrl || ''));
  } catch { return ''; }
}

// The listing's feed, read again when stale. Returns the cached row (possibly with an error) or null when there is no feed.
async function feedFor(l: any, force = false) {
  // An empty string (not null) means the team cleared it: no feed, and no looking it up again.
  if (l.rss_url === '') return null;
  let url = String(l.rss_url || '');
  if (!url) {
    url = await appleFeed(l);
    if (!url) return null;
    await db.from('listings').update({ rss_url: url }).eq('id', l.id).is('rss_url', null);
  }
  const { data: row } = await db.from('ve_podcast_feeds').select('*').eq('listing_id', l.id).maybeSingle();
  const fresh = row && row.rss_url === url && row.fetched_at && Date.now() - Date.parse(row.fetched_at) < FRESH_MS;
  const recentFail = row && row.rss_url === url && row.error_at && Date.now() - Date.parse(row.error_at) < 30 * 60e3;
  if (!force && (fresh || recentFail)) return row;
  try {
    const f = await readFeed(url);
    const next = { listing_id: l.id, rss_url: url, title: f.title, image: f.image, episodes: f.episodes, episode_count: f.count,
      fetched_at: new Date().toISOString(), error: null, error_at: null };
    await db.from('ve_podcast_feeds').upsert(next);
    return next;
  } catch (e) {
    const err = String((e as Error)?.message || e).slice(0, 300);
    const keep = row && row.rss_url === url ? row : { listing_id: l.id, rss_url: url, episodes: [], episode_count: 0 };
    const next = { ...keep, error: err, error_at: new Date().toISOString() };
    await db.from('ve_podcast_feeds').upsert(next);
    return next;
  }
}

const LISTING = 'id, slug, name, category, status, logo_url, rss_url, apple_podcasts_url, details';
async function listingOf(body: any) {
  let q = db.from('listings').select(LISTING).eq('status', 'approved');
  if (isId(body.listing_id)) q = q.eq('id', body.listing_id);
  else if (typeof body.slug === 'string' && body.slug) q = q.eq('slug', body.slug);
  else return null;
  const { data } = await q.limit(1).maybeSingle();
  return data;
}
const show = (l: any, f: any) => ({ title: f?.title || l.name, image: f?.image || '', rss_url: f?.rss_url || l.rss_url || '',
  fetched_at: f?.fetched_at || null, error: f?.episodes?.length ? null : f?.error || null });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;

  const savedFrom = async (listingId: string) => {
    if (!memberId) return undefined;
    const { data } = await db.from('ve_episode_saves').select('guid').eq('member_id', memberId).eq('listing_id', listingId).limit(1000);
    return (data || []).map((r: any) => r.guid);
  };

  if (body.action === 'episodes' || body.action === 'episode') {
    const l = await listingOf(body); if (!l) return json({ error: 'not_found' }, 404);
    const f = await feedFor(l);
    if (!f) return json({ ok: true, show: show(l, null), episodes: [], total: 0 });
    const all = (f.episodes || []) as any[];
    if (body.action === 'episode') {
      const ep = all.find((e) => e.guid === String(body.guid || ''));
      return json({ ok: true, show: show(l, f), episode: ep || null, saved: (await savedFrom(l.id))?.includes(String(body.guid)) });
    }
    const q = String(body.q || '').trim().toLowerCase();
    const list = q ? all.filter((e) => (e.title + ' ' + e.summary).toLowerCase().includes(q)) : all;
    const offset = Math.max(0, +body.offset || 0), limit = Math.min(50, Math.max(1, +body.limit || 20));
    const page = list.slice(offset, offset + limit).map((e) => ({ ...e, summary: e.summary.slice(0, 400) }));
    return json({ ok: true, show: show(l, f), episodes: page, total: list.length, in_feed: f.episode_count || all.length, saved: await savedFrom(l.id) });
  }

  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: m } = await db.from('members').select('id, membership_status, is_superadmin').eq('id', memberId).maybeSingle();
  if (!m) return json({ error: 'not_found' }, 404);

  if (body.action === 'save') {
    // Saving is a member benefit, like saving a listing.
    if (m.membership_status !== 'active' && !m.is_superadmin) return json({ ok: false, why: 'members_only' }, 403);
    const l = await listingOf(body); if (!l) return json({ error: 'not_found' }, 404);
    const guid = String(body.guid || '');
    const { data: had } = await db.from('ve_episode_saves').select('id').eq('member_id', memberId).eq('listing_id', l.id).eq('guid', guid).maybeSingle();
    if (had) { await db.from('ve_episode_saves').delete().eq('id', had.id); return json({ ok: true, saved: false }); }
    const { data: f } = await db.from('ve_podcast_feeds').select('episodes').eq('listing_id', l.id).maybeSingle();
    const ep = ((f?.episodes || []) as any[]).find((e) => e.guid === guid);
    if (!ep) return json({ error: 'episode_not_found' }, 404);
    const { error } = await db.from('ve_episode_saves').insert({ member_id: memberId, listing_id: l.id, guid, title: ep.title, audio_url: ep.audio,
      audio_type: ep.type || null, published_at: ep.date, duration_s: ep.duration, image: ep.image || null });
    if (error && error.code !== '23505') return json({ error: 'save_failed' }, 500);
    return json({ ok: true, saved: true });
  }

  if (body.action === 'saves') {
    const { data } = await db.from('ve_episode_saves').select('guid, title, audio_url, audio_type, published_at, duration_s, image, created_at, listings(id, name, slug, logo_url)')
      .eq('member_id', memberId).order('created_at', { ascending: false }).limit(500);
    return json({ ok: true, episodes: (data || []).map((r: any) => ({ guid: r.guid, title: r.title, audio: r.audio_url, type: r.audio_type, date: r.published_at,
      duration: r.duration_s, image: r.image || r.listings?.logo_url || '', saved_at: r.created_at,
      show: { id: r.listings?.id, name: r.listings?.name, slug: r.listings?.slug, logo: r.listings?.logo_url } })) });
  }

  if (body.action === 'owner_saves') {
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const { data: l } = await db.from('listings').select('id, owner_member_id, claim_status').eq('id', body.listing_id).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    if (l.owner_member_id !== memberId && !m.is_superadmin) return json({ error: 'not_owner' }, 403);
    const short = (n: string) => { const p = String(n || '').trim().split(/\s+/); return p[0] ? p[0] + (p[1] ? ' ' + p[1][0] + '.' : '') : 'A member'; };
    const [{ data: ls }, { data: es }] = await Promise.all([
      db.from('ve_listing_saves').select('member_id, saved_at, members(name)').eq('listing_id', l.id).order('saved_at', { ascending: false }).limit(500),
      db.from('ve_episode_saves').select('member_id, guid, title, created_at, members(name)').eq('listing_id', l.id).order('created_at', { ascending: false }).limit(2000),
    ]);
    const eps: Record<string, { guid: string; title: string; n: number }> = {};
    for (const r of (es || []) as any[]) { (eps[r.guid] ||= { guid: r.guid, title: r.title, n: 0 }).n++; }
    return json({ ok: true, verified: l.claim_status === 'verified' || !!m.is_superadmin,
      listing_saves: (ls || []).length, savers: (ls || []).slice(0, 100).map((r: any) => ({ name: short(r.members?.name), at: r.saved_at })),
      episode_saves: (es || []).length, episode_savers: new Set((es || []).map((r: any) => r.member_id)).size,
      episodes: Object.values(eps).sort((a, b) => b.n - a.n).slice(0, 20),
      recent: (es || []).slice(0, 100).map((r: any) => ({ name: short(r.members?.name), title: r.title, at: r.created_at })) });
  }

  if (body.action === 'admin_feed') {
    if (!m.is_superadmin) return json({ error: 'no_access' }, 403);
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const raw = String(body.rss_url || '').trim();
    if (raw && !httpUrl(raw)) return json({ error: 'bad_url' }, 400);
    const { data: l } = await db.from('listings').select(LISTING).eq('id', body.listing_id).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    await db.from('listings').update({ rss_url: raw }).eq('id', l.id);
    if (!raw) { await db.from('ve_podcast_feeds').delete().eq('listing_id', l.id); return json({ ok: true, rss_url: '', episodes: 0 }); }
    const f = await feedFor({ ...l, rss_url: raw }, true);
    return json({ ok: !f?.error || !!f?.episodes?.length, rss_url: raw, episodes: f?.episodes?.length || 0, title: f?.title || '', error: f?.error || null });
  }

  return json({ error: 'unknown_action' }, 400);
});
