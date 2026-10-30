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
// POST { action: 'owner_saves', listing_id }                            the listing's owner or a super admin: how many saved the show
//                                                                       and its episodes (Sean, 2026-10-27: saves in place of check-ins;
//                                                                       counts, never names, since 2026-10-28)
// POST { action: 'network_apply', application }                         a signed-in member: applies to the Vegans Explore Podcast
//                                                                       Network (/media/network); Sean is emailed
// POST { action: 'network_mine' }                                       a signed-in member: what they applied with
// POST { action: 'refresh' }                                            the cron (x-cron-secret): reads up to 8 feeds older than 20
//                                                                       hours, and sets every podcast's status from its latest episode
//
// A podcast's status follows its feed (Sean, 2026-10-27: "if an episode has been posted within the last 6 months, we can consider it
// active. Anything longer than 6 months... we'll say on hiatus"). Never Ended (Sean, same day: "it could come back 3 years later...
// I would take offense if somebody typed my podcast ended"): listings.business_status OPERATIONAL or CLOSED_TEMPORARILY, set each
// time a feed is read and by the hourly refresh, so a new episode puts it back to Active on its own. Ended (CLOSED_PERMANENTLY) only
// when Sean confirms it (2026-10-30, Vegans Who Lift: "I can confirm they've ended"); it holds until an episode newer than
// details.ended_at comes out (none set: newer than 30 days ago), which makes it Active again.
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const KEEP = 300, FRESH_MS = 6 * 3600e3, MAX_BYTES = 25e6, DAY = 864e5;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SEAN_EMAIL = 'contact@lesaruss.com';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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

function statusOf(latest: string | null | undefined): string | null {
  const t = latest ? Date.parse(latest) : NaN;
  if (isNaN(t)) return null;
  const age = Date.now() - t;
  return age < 183 * DAY ? 'OPERATIONAL' : 'CLOSED_TEMPORARILY';
}
// Only a podcast, and only when it changes. The episodes are newest first, so the first one is the latest.
async function syncStatus(l: any, latest: string | null | undefined) {
  const s = statusOf(latest);
  if (!s || l.category !== 'Podcasts' || l.business_status === s) return;
  if (l.business_status === 'CLOSED_PERMANENTLY') {
    const since = Date.parse(l.details?.ended_at || '') || Date.now() - 30 * DAY;
    if (!latest || !(Date.parse(latest) > since)) return;
  }
  await db.from('listings').update({ business_status: s }).eq('id', l.id);
  l.business_status = s;
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
    await syncStatus(l, f.episodes[0]?.date);
    return next;
  } catch (e) {
    const err = String((e as Error)?.message || e).slice(0, 300);
    const keep = row && row.rss_url === url ? row : { listing_id: l.id, rss_url: url, episodes: [], episode_count: 0 };
    const next = { ...keep, error: err, error_at: new Date().toISOString() };
    await db.from('ve_podcast_feeds').upsert(next);
    return next;
  }
}

const LISTING = 'id, slug, name, category, status, business_status, logo_url, rss_url, apple_podcasts_url, details';
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function mailTo(to: string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [...new Set(to)], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return r.ok;
  } catch (e) { console.error('network email failed', e); return false; }
}
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

  if (body.action === 'refresh') {
    const cron = req.headers.get('x-cron-secret');
    const { data: cs } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
    if (!cron || !cs?.value || cron !== cs.value) return json({ error: 'no_access' }, 403);
    // Feeds not read in 20 hours, oldest first, eight a run.
    const { data: stale } = await db.from('ve_podcast_feeds').select('listing_id').lt('fetched_at', new Date(Date.now() - 20 * 3600e3).toISOString())
      .order('fetched_at', { ascending: true }).limit(8);
    let read = 0;
    for (const r of (stale || []) as any[]) {
      const { data: l } = await db.from('listings').select(LISTING).eq('id', r.listing_id).maybeSingle();
      if (l && l.status === 'approved') { await feedFor(l, true); read++; }
    }
    // Time passes without a new episode too: every podcast's status from what we hold.
    const { data: all } = await db.from('ve_podcast_feeds').select('listing_id, latest:episodes->0->>date, listings(id, category, business_status, details)');
    let changed = 0;
    for (const r of (all || []) as any[]) {
      if (!r.listings) continue;
      const before = r.listings.business_status;
      await syncStatus(r.listings, r.latest);
      if (r.listings.business_status !== before) changed++;
    }
    return json({ ok: true, read, changed });
  }

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
  const { data: m } = await db.from('members').select('id, name, email, membership_status, is_superadmin').eq('id', memberId).maybeSingle();
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
    const [{ data: ls }, { data: es }] = await Promise.all([
      db.from('ve_listing_saves').select('member_id, saved_at').eq('listing_id', l.id).order('saved_at', { ascending: false }).limit(500),
      db.from('ve_episode_saves').select('member_id, guid, title, created_at').eq('listing_id', l.id).order('created_at', { ascending: false }).limit(2000),
    ]);
    const eps: Record<string, { guid: string; title: string; n: number }> = {};
    for (const r of (es || []) as any[]) { (eps[r.guid] ||= { guid: r.guid, title: r.title, n: 0 }).n++; }
    return json({ ok: true, verified: l.claim_status === 'verified' || !!m.is_superadmin,
      // Counts, never names (Sean locked 2026-10-28, playbook ve-member-profiles-partner-windows: a save is a bookmark, never
      // consent). The members who said the owner may message them are on the dashboard's Your audience, during a campaign.
      listing_saves: (ls || []).length, savers: (ls || []).slice(0, 100).map((r: any) => ({ at: r.saved_at })),
      episode_saves: (es || []).length, episode_savers: new Set((es || []).map((r: any) => r.member_id)).size,
      episodes: Object.values(eps).sort((a, b) => b.n - a.n).slice(0, 20),
      recent: (es || []).slice(0, 100).map((r: any) => ({ title: r.title, at: r.created_at })) });
  }

  if (body.action === 'network_apply') {
    const a = body.application || {};
    const name = clean(a.podcast_name, 160);
    const rss = httpUrl(clean(a.rss_url, 500)), apple = httpUrl(clean(a.apple_url, 500));
    if (!name) return json({ error: 'name' }, 400);
    if (!rss && !apple) return json({ error: 'feed' }, 400);
    const since = new Date(Date.now() - DAY).toISOString();
    const { count } = await db.from('ve_podcast_network_applications').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gte('created_at', since);
    if ((count || 0) >= 5) return json({ error: 'too_many' }, 429);
    // Their Directory listing, when we have it: by the feed, the Apple id, then the name.
    let listing: any = null;
    if (rss) listing = (await db.from('listings').select('id, slug, name').eq('rss_url', rss).eq('status', 'approved').limit(1).maybeSingle()).data;
    const appleId = (apple.match(/id(\d{5,})/) || [])[1];
    if (!listing && appleId) listing = (await db.from('listings').select('id, slug, name').ilike('apple_podcasts_url', '%id' + appleId + '%').eq('status', 'approved').limit(1).maybeSingle()).data;
    if (!listing) listing = (await db.from('listings').select('id, slug, name').ilike('name', name).eq('category', 'Podcasts').eq('status', 'approved').limit(1).maybeSingle()).data;
    const LEVELS = ['under_1k', '1k_5k', '5k_25k', '25k_100k', 'over_100k', 'unsure'];
    const INTERESTS = ['sponsorships', 'promotion', 'promos', 'production', 'clips'];
    const row = {
      member_id: memberId, listing_id: listing?.id || null, podcast_name: name, rss_url: rss || null, apple_url: apple || null,
      website: httpUrl(clean(a.website, 500)) || null, hosts: clean(a.hosts, 200) || null,
      monthly_downloads: LEVELS.includes(a.monthly_downloads) ? a.monthly_downloads : null, stats_source: clean(a.stats_source, 80) || null,
      release_cadence: clean(a.release_cadence, 60) || null, audience: clean(a.audience, 300) || null,
      socials: { instagram: clean(a.socials?.instagram, 120), tiktok: clean(a.socials?.tiktok, 120), youtube: clean(a.socials?.youtube, 200) },
      social_followers: LEVELS.includes(a.social_followers) ? a.social_followers : null,
      interests: (Array.isArray(a.interests) ? a.interests : []).filter((x: string) => INTERESTS.includes(x)),
      notes: clean(a.notes, 2000) || null, contact_name: clean(a.contact_name, 120) || m.name || null, contact_email: clean(a.contact_email, 200) || m.email || null,
      member_active: m.membership_status === 'active',
    };
    const { data: saved, error } = await db.from('ve_podcast_network_applications').insert(row).select('id').single();
    if (error) return json({ error: 'save_failed' }, 500);
    const L: Record<string, string> = { under_1k: 'Under 1,000', '1k_5k': '1,000 to 5,000', '5k_25k': '5,000 to 25,000', '25k_100k': '25,000 to 100,000', over_100k: 'Over 100,000', unsure: 'Not sure' };
    await mailTo([SEAN_EMAIL], `Podcast network application: ${name}`,
      `<p><b>${esc(name)}</b> applied to the Vegans Explore Podcast Network${row.member_active ? '' : ' (not a Founding Member yet)'}.</p>` +
      `<p>${esc(row.contact_name)} &middot; ${esc(row.contact_email)}${row.hosts ? ' &middot; hosts: ' + esc(row.hosts) : ''}</p>` +
      `<p>Monthly downloads: ${esc(L[row.monthly_downloads || ''] || 'not given')}${row.stats_source ? ' (from ' + esc(row.stats_source) + ')' : ''}<br>` +
      `Releases: ${esc(row.release_cadence || 'not given')}<br>Listeners: ${esc(row.audience || 'not given')}<br>Social followers: ${esc(L[row.social_followers || ''] || 'not given')}<br>` +
      `Wants: ${esc(row.interests.join(', ') || 'not given')}</p>` +
      `<p>Feed: ${esc(rss || 'none')}<br>Apple: ${esc(apple || 'none')}<br>Website: ${esc(row.website || 'none')}</p>` +
      (listing ? `<p>Their listing: <a href="https://vegansexplore.com/directory/${esc(listing.slug)}">${esc(listing.name)}</a></p>` : '<p>Not in the Directory yet.</p>') +
      (row.notes ? `<p>${esc(row.notes)}</p>` : '') + `<p>Application ${saved.id}</p>`, row.contact_email || undefined);
    return json({ ok: true, id: saved.id, member_active: row.member_active, listing: listing ? { slug: listing.slug, name: listing.name } : null });
  }

  if (body.action === 'network_mine') {
    const { data } = await db.from('ve_podcast_network_applications').select('id, podcast_name, status, created_at').eq('member_id', memberId).order('created_at', { ascending: false }).limit(20);
    return json({ ok: true, applications: data || [], member_active: m.membership_status === 'active' });
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
