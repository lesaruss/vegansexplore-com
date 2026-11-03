// ve-listing-posts: the Social tab's data on every listing (Sean, 2026-11-03; migration 20261103_listing_posts.sql).
//
// Featured by us (source 'ours') is built in the database by ve_listing_posts_build (cron, daily). This function does the rest:
//   thumbs   (cron, every 10 min)  copies each post's picture into our storage (Instagram's links expire), 20 posts a run
//   weekly   (cron, daily)         for CLAIMED listings (owner_member_id set) with an Instagram handle: enrol them, then fetch their
//                                  recent posts (Apify instagram-scraper) when their last fetch is older than refresh_days
//   owner_get / owner_post / owner_pause / owner_refresh   the owner's Social step in Edit your page (member token, the listing's owner)
//   admin_list / admin_set / admin_fetch / admin_thumbs     the Depot review (super admin)
//   admin_refresh_quote / admin_refresh_run   re-read the FEATURED posts' pictures (the May 2026 links expired). The quote is free (it asks
//                                  Apify for the account's plan and usage); the run needs listing_social.refresh_ours_on true AND `confirm` equal to
//                                  the quote's post count, so nothing is bought by accident.
// NOTHING IS FETCHED FROM APIFY until ve_site_settings listing_social.scrape_on is true (Sean's go, after the cost quote).
// verify_jwt is off: the VE token (an HMAC session, as ve-mentions) or the cron secret is checked inside.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const UA = 'Mozilla/5.0 (compatible; VegansExplore/1.0; +https://vegansexplore.com)';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
  } catch {
    return null;
  }
}

// The handle, the way ve_ig_handle writes it in the database.
function handleOf(t: unknown): string | null {
  const h = String(t || '').trim().replace(/^@+/, '').replace(/^.*instagram\.com\/+/i, '').replace(/[\/?#@\s].*$/, '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) ? h : null;
}

async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'listing_social').maybeSingle();
  return { scrape_on: false, per_page: 10, refresh_days: 7, max_posts: 40, daily_listing_cap: 20, manual_refresh_hours: 24, ...((data?.value as any) || {}) };
}

// ---------- thumbnails ----------
async function copyThumb(shortcode: string, src: string): Promise<string | null> {
  try {
    const r = await fetch(src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    const type = (r.headers.get('content-type') || '').split(';')[0];
    if (!r.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length < 800 || bytes.length > 6 * 1024 * 1024) return null;
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const path = `media/social-posts/${shortcode}.${ext}`;
    const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: type, upsert: true });
    if (up.error) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`;
  } catch {
    return null;
  }
}
async function thumbsRun(limit = 20) {
  // Posts whose picture is not copied yet; one that failed waits 30 days (an expired link will not come back).
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data } = await db.from('ve_listing_posts').select('shortcode, src_thumb_url')
    .is('thumb_url', null).eq('status', 'shown').not('src_thumb_url', 'is', null)
    .or(`thumb_checked_at.is.null,thumb_checked_at.lt.${cutoff}`)
    .order('thumb_checked_at', { ascending: true, nullsFirst: true }).limit(limit * 4);
  const seen = new Set<string>(); const todo: { shortcode: string; src: string }[] = [];
  for (const r of data || []) { if (!seen.has(r.shortcode) && todo.length < limit) { seen.add(r.shortcode); todo.push({ shortcode: r.shortcode, src: r.src_thumb_url }); } }
  let ok = 0, failed = 0;
  for (const t of todo) {
    const url = await copyThumb(t.shortcode, t.src);
    const patch = url ? { thumb_url: url, thumb_checked_at: new Date().toISOString(), thumb_error: null }
                      : { thumb_checked_at: new Date().toISOString(), thumb_error: 'The picture link had expired or did not answer' };
    await db.from('ve_listing_posts').update(patch).eq('shortcode', t.shortcode).is('thumb_url', null);
    url ? ok++ : failed++;
  }
  return { tried: todo.length, copied: ok, failed };
}

// ---------- their own posts (Apify), claimed listings only ----------
async function apifyToken(): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'APIFY_API_TOKEN').maybeSingle();
  const t = data?.value as string; return t && t !== 'pending' ? t : null;
}
async function fetchTheirs(listingId: string, force = false) {
  const S = await settings();
  if (!S.scrape_on && !force) return { ok: false, error: 'not_switched_on' };
  const { data: l } = await db.from('listings').select('id, instagram, owner_member_id, status').eq('id', listingId).maybeSingle();
  if (!l || l.status !== 'approved') return { ok: false, error: 'not_found' };
  if (!l.owner_member_id) return { ok: false, error: 'not_claimed' };
  const handle = handleOf(l.instagram);
  if (!handle) return { ok: false, error: 'no_handle' };
  const { data: pz } = await db.from('ve_listing_social').select('paused').eq('listing_id', listingId).maybeSingle();
  if (pz?.paused && !force) return { ok: false, error: 'paused' };   // paused means no new public posts either
  const token = await apifyToken(); if (!token) return { ok: false, error: 'no_reader' };
  // A daily cap on listings fetched, so a flood of claims never makes a surprise bill.
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from('ve_listing_social').select('listing_id', { count: 'exact', head: true }).gte('last_fetch_at', since.toISOString());
  if ((count || 0) >= S.daily_listing_cap) return { ok: false, error: 'daily_cap' };
  const now = new Date().toISOString();
  await db.from('ve_listing_social').upsert({ listing_id: listingId, instagram_handle: handle, last_fetch_at: now }, { onConflict: 'listing_id' });
  let items: any[] = [];
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=120`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directUrls: [`https://www.instagram.com/${handle}/`], resultsType: 'posts', resultsLimit: S.max_posts }),
      signal: AbortSignal.timeout(140000),
    });
    if (!r.ok) throw new Error(`Instagram reader answered ${r.status}`);
    items = (await r.json()) as any[];
  } catch (e) {
    const { data: cur } = await db.from('ve_listing_social').select('fetch_fails').eq('listing_id', listingId).maybeSingle();
    await db.from('ve_listing_social').update({ last_fetch_note: String((e as Error).message || e).slice(0, 200), fetch_fails: (cur?.fetch_fails || 0) + 1 }).eq('listing_id', listingId);
    return { ok: false, error: 'read_failed' };
  }
  const posts = (items || []).filter((x) => x && x.shortCode && !x.error && (!x.ownerUsername || String(x.ownerUsername).toLowerCase() === handle)).slice(0, S.max_posts);
  const { data: have } = await db.from('ve_listing_posts').select('id, shortcode, source').eq('listing_id', listingId);
  const bySc = new Map((have || []).map((r: any) => [r.shortcode, r]));
  let added = 0, updated = 0;
  for (const x of posts) {
    const counts = { like_count: Math.max(0, Number(x.likesCount) || 0), comment_count: Math.max(0, Number(x.commentsCount) || 0),
      view_count: x.videoViewCount != null ? Math.max(0, Number(x.videoViewCount) || 0) : null, scraped_at: now, updated_at: now };
    const ex: any = bySc.get(x.shortCode);
    if (ex) { await db.from('ve_listing_posts').update(counts).eq('id', ex.id); updated++; continue; }
    const thumb = await copyThumb(x.shortCode, x.displayUrl || '');
    await db.from('ve_listing_posts').insert({
      listing_id: listingId, shortcode: x.shortCode, post_url: x.url || `https://www.instagram.com/p/${x.shortCode}/`,
      post_type: x.type || null, caption: String(x.caption || '').slice(0, 2200), src_thumb_url: x.displayUrl || null,
      thumb_url: thumb, thumb_checked_at: now, thumb_error: thumb ? null : 'The picture could not be copied',
      posted_at: x.timestamp || null, source: 'theirs', match_reason: 'handle', matched: '@' + handle, ...counts,
    });
    added++;
  }
  await db.from('ve_listing_social').update({ last_fetch_at: now, last_fetch_note: `Read ${posts.length} recent posts: ${added} new, ${updated} updated`, fetch_fails: 0 }).eq('listing_id', listingId);
  return { ok: true, read: posts.length, added, updated };
}
// ---------- the featured posts' pictures (source 'ours'), one batch at a time ----------
async function refreshCandidates(): Promise<{ shortcode: string; url: string }[]> {
  const out: { shortcode: string; url: string }[] = []; const seen = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from('ve_listing_posts').select('shortcode, post_url').eq('source', 'ours').eq('status', 'shown').is('thumb_url', null)
      .order('shortcode').range(from, from + 999);
    for (const r of data || []) if (!seen.has(r.shortcode)) { seen.add(r.shortcode); out.push({ shortcode: r.shortcode, url: r.post_url }); }
    if (!data || data.length < 1000) break;
  }
  return out;
}
async function apifyAccount(token: string) {
  // Free account calls: what plan this token is on and what it has used this cycle. Nothing here starts a run.
  const get = async (path: string) => { try { const r = await fetch(`https://api.apify.com/v2/${path}?token=${token}`, { signal: AbortSignal.timeout(15000) }); return r.ok ? ((await r.json()) as any).data : null; } catch { return null; } };
  const me = await get('users/me'), lim = await get('users/me/limits');
  return {
    plan: me?.plan?.id || me?.plan?.name || null,
    monthly_usage_usd: lim?.current?.monthlyUsageUsd ?? null,
    max_monthly_usage_usd: lim?.limits?.maxMonthlyUsageUsd ?? null,
    cycle_ends: lim?.monthlyUsageCycle?.endAt || null,
    readable: !!(me || lim),
  };
}
async function refreshQuote() {
  const S = await settings();
  const todo = await refreshCandidates();
  const per1000 = Number(S.apify_usd_per_1000_results) || 2.3;   // Apify's list price for the Instagram scraper, a setting so it can be corrected
  const token = await apifyToken();
  const acct = token ? await apifyAccount(token) : null;
  const est = Math.round(todo.length * per1000) / 1000;
  const room = acct && acct.max_monthly_usage_usd != null && acct.monthly_usage_usd != null ? Math.round((acct.max_monthly_usage_usd - acct.monthly_usage_usd) * 100) / 100 : null;
  return { posts: todo.length, batch_size: S.refresh_batch || 25, batches: Math.ceil(todo.length / (S.refresh_batch || 25)), usd_per_1000_results: per1000,
    estimated_usd: est, apify: acct, room_left_usd: room, fits: room == null ? null : est <= room, enabled: !!S.refresh_ours_on, has_token: !!token };
}
async function refreshRun(confirm: number) {
  const S = await settings();
  if (!S.refresh_ours_on) return { ok: false, error: 'not_switched_on' };
  const todo = await refreshCandidates();
  // The first call states the quote's count; the rest of a run carry the same number down as `remaining` goes, so a stale confirm is refused.
  if (!Number.isFinite(confirm) || confirm < todo.length || confirm > todo.length + 200) return { ok: false, error: 'confirm_mismatch', posts: todo.length };
  const token = await apifyToken(); if (!token) return { ok: false, error: 'no_reader' };
  const batch = todo.slice(0, S.refresh_batch || 25);
  if (!batch.length) return { ok: true, done: true, remaining: 0 };
  let items: any[] = [];
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=140`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directUrls: batch.map((b) => b.url), resultsType: 'posts', resultsLimit: batch.length }), signal: AbortSignal.timeout(150000) });
    if (!r.ok) return { ok: false, error: 'read_failed', status: r.status, remaining: todo.length };
    items = (await r.json()) as any[];
  } catch (e) { return { ok: false, error: 'read_failed', message: String((e as Error).message || e).slice(0, 160), remaining: todo.length }; }
  const by = new Map<string, any>(); for (const x of items || []) if (x && x.shortCode && !x.error) by.set(x.shortCode, x);
  const now = new Date().toISOString(); let copied = 0, gone = 0;
  for (const b of batch) {
    const x = by.get(b.shortcode);
    if (!x) { await db.from('ve_listing_posts').update({ thumb_checked_at: now, thumb_error: 'Not returned by the reader (the post may be gone)' }).eq('shortcode', b.shortcode).is('thumb_url', null); gone++; continue; }
    const url = await copyThumb(b.shortcode, x.displayUrl || '');
    const patch: Record<string, unknown> = { like_count: Math.max(0, Number(x.likesCount) || 0), comment_count: Math.max(0, Number(x.commentsCount) || 0),
      view_count: x.videoViewCount != null ? Math.max(0, Number(x.videoViewCount) || 0) : null, src_thumb_url: x.displayUrl || null, scraped_at: now, updated_at: now,
      thumb_checked_at: now, thumb_error: url ? null : 'The picture could not be copied' };
    if (url) { patch.thumb_url = url; copied++; }
    await db.from('ve_listing_posts').update(patch).eq('shortcode', b.shortcode);
  }
  return { ok: true, batch: batch.length, returned: by.size, copied, gone, remaining: Math.max(0, todo.length - batch.length) };
}
async function weeklyRun() {
  const S = await settings();
  // Enrol every claimed listing that has a valid handle (any claim unlocks it; the owner can pause it).
  const { data: claimed } = await db.from('listings').select('id, instagram').eq('status', 'approved').not('owner_member_id', 'is', null).not('instagram', 'is', null);
  const { data: enrolled } = await db.from('ve_listing_social').select('listing_id');
  const have = new Set((enrolled || []).map((r: any) => r.listing_id));
  const fresh = (claimed || []).filter((r: any) => !have.has(r.id) && handleOf(r.instagram)).map((r: any) => ({ listing_id: r.id, instagram_handle: handleOf(r.instagram)! }));
  if (fresh.length) await db.from('ve_listing_social').insert(fresh);
  if (!S.scrape_on) return { enrolled: fresh.length, fetched: 0, scrape_on: false };
  const cutoff = new Date(Date.now() - S.refresh_days * 864e5).toISOString();
  const { data: due } = await db.from('ve_listing_social').select('listing_id').eq('paused', false)
    .or(`last_fetch_at.is.null,last_fetch_at.lt.${cutoff}`).lt('fetch_fails', 3).order('last_fetch_at', { ascending: true, nullsFirst: true }).limit(3);
  let fetched = 0; const out: unknown[] = [];
  for (const d of due || []) { const r = await fetchTheirs(d.listing_id); out.push(r); if (r.ok) fetched++; }
  return { enrolled: fresh.length, fetched, results: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  // The crons.
  const secret = req.headers.get('x-cron-secret');
  if (secret) {
    const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
    if (!data?.value || data.value !== secret) return json({ error: 'forbidden' }, 403);
    if (action === 'thumbs') return json(await thumbsRun());
    if (action === 'weekly') return json(await weeklyRun());
    return json({ error: 'unknown_action' }, 400);
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  // Ops: LESARUSS_ADMIN_TOKEN may run the Depot's admin_* actions (the repo's usual ops path), never the owner's.
  let opsOk = false;
  if (token && action.startsWith('admin_')) {
    const { data: ops } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
    opsOk = !!ops?.value && ops.value === token;
  }
  let member: { id: string | null; is_superadmin: boolean } | null = null;
  if (opsOk) member = { id: null, is_superadmin: true };
  else {
    const memberId = token ? await verifyToken(token) : null;
    if (!memberId) return json({ error: 'not_authenticated' }, 401);
    const { data: m } = await db.from('members').select('id, is_superadmin').eq('id', memberId).maybeSingle();
    if (!m) return json({ error: 'not_authenticated' }, 401);
    member = m;
  }

  // ----- the owner's Social step -----
  if (action.startsWith('owner_')) {
    const listingId = String(body.listing_id || '');
    const { data: l } = await db.from('listings').select('id, name, instagram, owner_member_id, status').eq('id', listingId).maybeSingle();
    if (!l || l.status !== 'approved') return json({ error: 'not_found' }, 404);
    if (l.owner_member_id !== member.id && !member.is_superadmin) return json({ error: 'not_owner' }, 403);
    const S = await settings();
    const handle = handleOf(l.instagram);
    // Their row exists once they are claimed with a handle: any claim unlocks it.
    let { data: soc } = await db.from('ve_listing_social').select('*').eq('listing_id', listingId).maybeSingle();
    if (!soc && handle && l.owner_member_id) {
      await db.from('ve_listing_social').insert({ listing_id: listingId, instagram_handle: handle, set_by: member.id });
      soc = (await db.from('ve_listing_social').select('*').eq('listing_id', listingId).maybeSingle()).data;
    }
    if (soc && handle && soc.instagram_handle !== handle) { await db.from('ve_listing_social').update({ instagram_handle: handle, last_fetch_at: null, fetch_fails: 0 }).eq('listing_id', listingId); soc.instagram_handle = handle; soc.last_fetch_at = null; }

    if (action === 'owner_get') {
      const { data: posts } = await db.from('ve_listing_posts')
        .select('id, shortcode, post_url, post_type, caption, thumb_url, like_count, comment_count, view_count, posted_at, status, pinned')
        .eq('listing_id', listingId).eq('source', 'theirs').neq('status', 'removed').limit(80);
      const sorted = (posts || []).sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
      return json({ ok: true, handle, owner: l.owner_member_id === member.id, paused: !!soc?.paused, last_fetch_at: soc?.last_fetch_at || null,
        note: soc?.last_fetch_note || null, switched_on: !!S.scrape_on, posts: sorted });
    }
    if (action === 'owner_pause') {
      if (!soc) return json({ error: 'no_handle' }, 400);
      await db.from('ve_listing_social').update({ paused: !!body.paused }).eq('listing_id', listingId);
      // Pause sets shown posts to 'paused' (pins kept); Resume puts back only 'paused' ones. 'hidden' stays the owner's own choice.
      if (body.paused) await db.from('ve_listing_posts').update({ status: 'paused', updated_at: new Date().toISOString() }).eq('listing_id', listingId).eq('source', 'theirs').eq('status', 'shown');
      else await db.from('ve_listing_posts').update({ status: 'shown', updated_at: new Date().toISOString() }).eq('listing_id', listingId).eq('source', 'theirs').eq('status', 'paused');
      return json({ ok: true, paused: !!body.paused });
    }
    if (action === 'owner_post') {
      if (soc?.paused) return json({ error: 'paused', message: 'Your Instagram posts are paused. Show them again to change them.' }, 409);
      const op = String(body.op || '');
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (op === 'hide') { patch.status = 'hidden'; patch.pinned = false; } else if (op === 'show') patch.status = 'shown';
      else if (op === 'pin') { patch.pinned = true; patch.status = 'shown'; } else if (op === 'unpin') patch.pinned = false;
      else return json({ error: 'bad_op' }, 400);
      const { data: row } = await db.from('ve_listing_posts').update(patch).eq('id', body.post_id).eq('listing_id', listingId).eq('source', 'theirs').neq('status', 'removed').select('id').maybeSingle();
      return row ? json({ ok: true }) : json({ error: 'not_found' }, 404);
    }
    if (action === 'owner_refresh') {
      if (!soc) return json({ error: 'no_handle' }, 400);
      if (!S.scrape_on) return json({ error: 'not_switched_on', message: 'Your posts will be pulled in once this is switched on, which the team does soon.' }, 409);
      const last = soc.last_manual_refresh_at ? Date.parse(soc.last_manual_refresh_at) : 0;
      if (!member.is_superadmin && Date.now() - last < S.manual_refresh_hours * 36e5) return json({ error: 'too_soon' }, 429);
      await db.from('ve_listing_social').update({ last_manual_refresh_at: new Date().toISOString() }).eq('listing_id', listingId);
      return json(await fetchTheirs(listingId));
    }
    return json({ error: 'unknown_action' }, 400);
  }

  // ----- the Depot review -----
  if (!member.is_superadmin) return json({ error: 'no_access' }, 403);
  if (action === 'admin_list') {
    const status = ['shown', 'hidden', 'removed'].includes(body.status) ? body.status : 'shown';
    let q = db.from('ve_listing_posts')
      .select('id, shortcode, post_url, caption, thumb_url, like_count, comment_count, source, match_reason, matched, status, updated_at, listings(slug, name, category)')
      .eq('status', status);
    if (body.source === 'ours' || body.source === 'theirs') q = q.eq('source', body.source);
    if (['tag', 'owner', 'link', 'name', 'handle'].includes(body.reason)) q = q.eq('match_reason', body.reason);
    const { data, error } = await q.order('updated_at', { ascending: false }).limit(1000);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const S = await settings();
    const { count } = await db.from('ve_listing_social').select('listing_id', { count: 'exact', head: true });
    return json({ items: data || [], switched_on: !!S.scrape_on, enrolled: count || 0 });
  }
  if (action === 'admin_set') {
    const status = ['shown', 'removed'].includes(body.status) ? body.status : null;
    if (!body.id || !status) return json({ error: 'bad_request' }, 400);
    const { error } = await db.from('ve_listing_posts').update({ status, updated_at: new Date().toISOString() }).eq('id', body.id);
    return error ? json({ error: 'save_failed' }, 500) : json({ ok: true });
  }
  if (action === 'admin_refresh_quote') return json(await refreshQuote());
  if (action === 'admin_refresh_run') return json(await refreshRun(Number(body.confirm)));
  if (action === 'admin_thumbs') return json(await thumbsRun(Math.min(40, Number(body.limit) || 20)));
  if (action === 'admin_fetch') return json(await fetchTheirs(String(body.listing_id || '')));
  return json({ error: 'unknown_action' }, 400);
});
