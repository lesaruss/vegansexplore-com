// ve-venues: the Stadium & Arena Guide (Sean, 2026-10-28; playbook ve-venue-guides, migration 20261028_ve_venue_guides.sql) and the
// Airport Guide (Sean, 2026-10-29; migration 20261029_airport_guide.sql). Every call names its Guide (guide: 'stadium-arena-guide' |
// 'airport-guide', the Stadium Guide when left out): list shows that Guide's kinds of venue, and owning, My list and the free
// example go by that Guide. A venue's own Guide follows from its kind (airport, or stadium and arena).
// A venue mapped to the Vegan food inside it, kept accurate by members who report from inside for points.
//
// Anyone:
//   { action: 'list' }                         every live venue: name, kind, city, teams, counts, which one is free; and the viewer
//   { action: 'venue', slug }                  one venue. Its stands and items for the Guide's owners, a super admin, or anyone on
//                                              the free example (Hard Rock Stadium); everyone else gets the outline (locked: true)
//                                              An open venue also carries its map: venue.layout (each level's sections by side) and
//                                              each stand's map_sections and map_level (migration 20261028_venue_maps.sql)
// An active member who owns the venue's Guide (bounties unlock with the Guide, Sean 2026-10-29):
//   { action: 'report_start' }                 -> { path, upload_url }   PUT the photo (JPEG, shrunk in the browser) there
//   { action: 'report', venue, item?, spot?, kind, note?, path?, lat, lng, accuracy }
//                                              kind confirm | wrong | missing | gone | comment; the photo is optional and pays more
//                                              (ve_venue_report_points); checked in ve_venue_report_save (inside the venue's circle,
//                                              60 a day, 40 paid) and left for the team. Accepted comments show on the item.
//   { action: 'bounties', hub? }           open bounties at every venue of both Guides (no item names): how many items wait for
//                                              their first confirmation and the points on them (migration 20261029_venue_bounties.sql)
//   { action: 'mine' }                         their reports, newest first, with what the team decided and the points
// A Guide owner:
//   { action: 'saves' } / { action: 'save', kind: 'venue'|'venue_item', key, on }   My list (ve_guide_saves)
// A super admin (the VE app token) or ops (Bearer LESARUSS_ADMIN_TOKEN):
//   { action: 'queue', status? }               reports by status (pending first), with the venue, item and member
//   { action: 'report_get', id }               one report with its photo (a signed link), the item, the other reports on it
//   { action: 'review', id, decision, note?, first? }   accept | agree (with first, the accepted one) | decline; points paid there
//   { action: 'venue_save', venue }            add or change a venue; { action: 'spot_save', spot }; { action: 'item_save', item }
//   (an airport's layout is { terminals: [{ id, name, concourses: [{ id, name, gates: ['A1', ...], airside: <group> }] }] }, its stands'
//    zone airside | landside, their gates in map_sections and their concourse in map_level; public/ve-airport-map.js reads it)
//   { action: 'locate', slug }                 fills the venue's place, address and pin from Google Places (never typed in)
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const GUIDES: Record<string, string[]> = { 'stadium-arena-guide': ['stadium', 'arena'], 'airport-guide': ['airport'] };
const guideOfKind = (k: string) => (k === 'airport' ? 'airport-guide' : 'stadium-arena-guide');
const BUCKET = 'venue-reports';
const SAVE_CAP = 500;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : null);
const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const shortName = (n: string | null) => { const p = String(n || '').trim().split(/\s+/); return p[0] ? p[0] + (p[1] ? ' ' + p[1][0] + '.' : '') : 'A member'; };

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
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}

// Where an item stands: confirmed by a member in the last 35 days (and since the season began), confirmed earlier, or only
// from the sources.
// What each report pays (with a photo, without; and for agreeing with the first), Sean's to change in ve_venue_report_points.
async function reportPoints() {
  const { data } = await db.from('ve_venue_report_points').select('kind, with_photo, no_photo, agree_with_photo, agree_no_photo, first_with_photo, first_no_photo').order('sort_order');
  return data || [];
}
async function bountyLimits() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'venue_bounties').maybeSingle();
  return data?.value || { fresh_days: 35, daily_paid_cap: 40, daily_reports: 60 };
}
const FRESH_DAYS = 35;
function freshness(it: any, v: any) {
  const at = it.last_confirmed_at ? new Date(it.last_confirmed_at).getTime() : 0;
  const season = v.season_reset_at ? new Date(v.season_reset_at).getTime() : 0;
  if (!at) return 'unconfirmed';
  if (at < season || Date.now() - at > FRESH_DAYS * 864e5) return 'stale';
  return 'fresh';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ops = !!token && token.split('.').length !== 3 && token === (await secret('LESARUSS_ADMIN_TOKEN'));
  let viewer: { id: string; name: string | null; active: boolean; admin: boolean } | null = null;
  if (!ops && token) {
    const sub = await verifyToken(token);
    if (sub) {
      const { data: m } = await db.from('members').select('id, name, membership_status, is_superadmin').eq('id', sub).maybeSingle();
      if (m) viewer = { id: m.id, name: m.name, active: m.membership_status === 'active', admin: !!m.is_superadmin };
    }
  }
  const admin = ops || !!viewer?.admin;
  let GUIDE = GUIDES[String(body.guide || '')] ? String(body.guide) : 'stadium-arena-guide';
  // The venue's own Guide decides who it is open to, whatever page asked.
  if (action === 'venue') {
    const { data: vk } = await db.from('ve_venues').select('kind').eq('slug', str(body.slug, 80)).maybeSingle();
    if (vk?.kind) GUIDE = guideOfKind(vk.kind);
  }
  let owns = admin;
  if (!owns && viewer) { const { data } = await db.rpc('ve_owns_guide', { p_member: viewer.id, p_guide: GUIDE }); owns = !!data; }
  const me = viewer ? { signed_in: true, active: viewer.active, owns, admin, guide: GUIDE } : { signed_in: false, active: false, owns: admin, admin, guide: GUIDE };

  // ---------- anyone ----------
  if (action === 'list') {
    const { data: vs, error } = await db.from('ve_venues').select('id, slug, name, kind, city, state, hub, teams, free_example, latitude, sort_order, image_url, season_reset_at')
      .eq('status', 'live').in('kind', GUIDES[GUIDE]).order('sort_order');
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const ids = (vs || []).map((v) => v.id);
    const { data: its } = ids.length ? await db.from('ve_venue_items').select('venue_id, last_confirmed_at').in('venue_id', ids).eq('status', 'live') : { data: [] as any[] };
    const counts: Record<string, { items: number; confirmed: number; last: string | null; bounties: number }> = {};
    const byId: Record<string, any> = {}; for (const v of vs || []) byId[v.id] = v;
    for (const it of its || []) {
      const c = counts[it.venue_id] ||= { items: 0, confirmed: 0, last: null, bounties: 0 };
      c.items++;
      if (freshness(it, byId[it.venue_id]) !== 'fresh') c.bounties++;
      if (it.last_confirmed_at) { c.confirmed++; if (!c.last || it.last_confirmed_at > c.last) c.last = it.last_confirmed_at; }
    }
    return json({ me, venues: (vs || []).map((v) => ({ slug: v.slug, name: v.name, kind: v.kind, city: v.city, state: v.state, hub: v.hub,
      teams: v.teams, free: v.free_example, can_report: v.latitude != null, image: v.image_url, ...(counts[v.id] || { items: 0, confirmed: 0, last: null, bounties: 0 }) })),
      points: await reportPoints(), limits: await bountyLimits() });
  }

  // Bounties around the city (Sean, 2026-10-29: "you want to be first to action... constantly looking at the bounties"): every
  // venue of both Guides with items waiting for their first confirmation, and what they pay. No item names: those are the Guide's.
  if (action === 'bounties') {
    const hub = str(body.hub, 40);
    let q = db.from('ve_venues').select('id, slug, name, kind, city, state, hub, free_example, latitude, sort_order, image_url, season_reset_at').eq('status', 'live');
    if (hub && hub !== 'all') q = q.eq('hub', hub);
    const { data: vs } = await q.order('sort_order');
    const ids = (vs || []).map((v) => v.id);
    const { data: its } = ids.length ? await db.from('ve_venue_items').select('venue_id, last_confirmed_at').in('venue_id', ids).eq('status', 'live') : { data: [] as any[] };
    const P: Record<string, any> = {}; for (const p of await reportPoints()) P[p.kind] = p;
    const first = P.confirm?.first_with_photo ?? P.confirm?.with_photo ?? 0, missing = P.missing?.with_photo ?? 0;
    // Only the Guides that are out (an unpublished Guide's venues wait for its launch), unless a super admin asks.
    const { data: gs } = await db.from('ve_guides').select('slug, published').in('slug', Object.keys(GUIDES));
    const live = new Set((gs || []).filter((g) => g.published || admin).map((g) => g.slug));
    // Each Guide's bounties are for its owners; everyone else gets the count and what it would pay, as a reason to get it.
    const ownsG: Record<string, boolean> = {};
    for (const g of live) ownsG[g] = admin || (!!viewer && !!(await db.rpc('ve_owns_guide', { p_member: viewer.id, p_guide: g })).data);
    const out = (vs || []).filter((v) => v.latitude != null && live.has(guideOfKind(v.kind))).map((v) => {
      const mine = (its || []).filter((i) => i.venue_id === v.id);
      const open = mine.filter((i) => freshness(i, v) !== 'fresh').length;
      // A venue with nothing listed yet has one bounty: be the first to add what is there.
      const points = mine.length ? open * first : missing;
      return { slug: v.slug, name: v.name, kind: v.kind, city: v.city, state: v.state, hub: v.hub, image: v.image_url, free: v.free_example,
        guide: guideOfKind(v.kind), items: mine.length, open: mine.length ? open : 1, empty: !mine.length, points };
    }).filter((v) => v.open > 0).sort((a, b) => b.points - a.points);
    const locked = [...live].filter((g) => !ownsG[g]).map((g) => {
      const vs2 = out.filter((v) => v.guide === g);
      return { guide: g, venues: vs2.length, points: vs2.reduce((n, v) => n + v.points, 0) };
    }).filter((x) => x.venues);
    const mine = out.filter((v) => ownsG[v.guide]);
    return json({ venues: mine, locked, total: mine.reduce((n, v) => n + v.points, 0), points: await reportPoints(), limits: await bountyLimits() });
  }

  if (action === 'venue') {
    const slug = str(body.slug, 80);
    const { data: v } = await db.from('ve_venues').select('*').eq('slug', slug).eq('status', 'live').maybeSingle();
    if (!v) return json({ error: 'not_found' }, 404);
    const open = owns || v.free_example;
    const [{ data: spots }, { data: items }] = await Promise.all([
      db.from('ve_venue_spots').select('id, name, where_text, zone, listing_id, note, sort_order, map_sections, map_level').eq('venue_id', v.id).eq('status', 'live').order('sort_order'),
      db.from('ve_venue_items').select('id, spot_id, name, description, vegan, sources, last_confirmed_at, confirmed_count, photo_url, photo_illustrative, sort_order')
        .eq('venue_id', v.id).eq('status', 'live').order('sort_order'),
    ]);
    const lids = [...new Set((spots || []).map((s) => s.listing_id).filter(Boolean))];
    const listings: Record<string, any> = {};
    if (lids.length) { const { data: ls } = await db.from('listings').select('id, slug, name, logo_url').in('id', lids); for (const l of ls || []) listings[l.id] = l; }
    // What members said about each item: accepted comments, newest first, with their photo (a signed link) when they sent one.
    const comments: Record<string, any[]> = {};
    if (open) {
      const { data: cs } = await db.from('ve_venue_reports').select('id, item_id, note, photo_path, created_at, members(name)')
        .eq('venue_id', v.id).eq('kind', 'comment').eq('status', 'accepted').order('created_at', { ascending: false }).limit(60);
      for (const c of cs || []) {
        let photo: string | null = null;
        if (c.photo_path) { const { data: su } = await db.storage.from(BUCKET).createSignedUrl(c.photo_path, 3600); photo = su?.signedUrl || null; }
        (comments[c.item_id] ||= []).push({ id: c.id, note: c.note, photo, at: c.created_at, member: shortName((c as any).members?.name) });
      }
    }
    let saved: string[] = [];
    if (viewer && owns) {
      const { data: sv } = await db.from('ve_guide_saves').select('kind, item_key').eq('guide_slug', GUIDE).eq('member_id', viewer.id).in('kind', ['venue', 'venue_item']);
      saved = (sv || []).map((x) => x.kind + ':' + x.item_key);
    }
    const venue = { slug: v.slug, name: v.name, kind: v.kind, city: v.city, state: v.state, hub: v.hub, teams: v.teams, address: v.address,
      maps: v.google_place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name)}&query_place_id=${v.google_place_id}` : null,
      note: v.note, note_source_url: v.note_source_url, free: v.free_example, can_report: v.latitude != null, radius_m: v.radius_m,
      season_reset_at: v.season_reset_at, layout: open ? v.layout : null, image: v.image_url };
    const outSpots = (spots || []).map((s) => {
      const its = (items || []).filter((i) => i.spot_id === s.id);
      return {
        id: s.id, name: s.name, where: s.where_text, zone: s.zone, note: s.note,
        // The map's pins and level only for an open venue, like its items.
        map_sections: open ? (s.map_sections || []) : [], map_level: open ? s.map_level : null,
        listing: s.listing_id && listings[s.listing_id] ? { slug: listings[s.listing_id].slug, name: listings[s.listing_id].name, logo_url: listings[s.listing_id].logo_url } : null,
        item_count: its.length,
        items: open ? its.map((i) => ({ id: i.id, name: i.name, description: i.description, vegan: i.vegan, sources: i.sources,
          last_confirmed_at: i.last_confirmed_at, confirmed_count: i.confirmed_count, freshness: freshness(i, v), bounty: freshness(i, v) !== 'fresh',
          photo_url: i.photo_url, photo_illustrative: i.photo_illustrative, saved: saved.includes('venue_item:' + i.id),
          comments: (comments[i.id] || []).slice(0, 5) })) : [],
      };
    });
    return json({ me, open, locked: !open, saved: saved.includes('venue:' + v.slug), venue, spots: outSpots, points: await reportPoints() });
  }

  // ---------- members ----------
  const needActive = () => !viewer ? json({ error: 'not_authenticated', message: 'Sign in to send a report.' }, 401)
    : !viewer.active ? json({ error: 'members_only', message: 'Reports are for Passport holders.' }, 403) : null;

  if (action === 'report_start') {
    const gate = needActive(); if (gate) return gate;
    const path = `${viewer!.id}/${crypto.randomUUID()}.jpg`;
    const { data: up, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_failed', message: error?.message }, 500);
    return json({ path, upload_url: up.signedUrl });
  }

  if (action === 'report') {
    const gate = needActive(); if (gate) return gate;
    // A photo is optional (it pays more); when one is named, it must be theirs and uploaded.
    const path = str(body.path, 200);
    if (path) {
      if (!path.startsWith(viewer!.id + '/') || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(path)) return json({ error: 'bad_photo' }, 400);
      const { data: listed } = await db.storage.from(BUCKET).list(viewer!.id, { search: path.split('/')[1] });
      if (!(listed || []).some((f) => f.name === path.split('/')[1])) return json({ error: 'bad_photo', message: 'The photo did not finish uploading. Try again.' }, 400);
    }
    const { data: v } = await db.from('ve_venues').select('id, kind').eq('slug', str(body.venue, 80)).maybeSingle();
    if (!v) return json({ error: 'not_found' }, 404);
    // Bounties unlock with the Guide (Sean, 2026-10-29): only its owners (and super admins) report, the free venue included.
    if (!admin) {
      const { data: has } = await db.rpc('ve_owns_guide', { p_member: viewer!.id, p_guide: guideOfKind(v.kind) });
      if (!has) return json({ error: 'guide_required', message: 'Bounties unlock with the Guide.' }, 403);
    }
    const { data, error } = await db.rpc('ve_venue_report_save', {
      p_member: viewer!.id, p_venue: v.id, p_spot: isId(body.spot) ? body.spot : null, p_item: isId(body.item) ? body.item : null,
      p_kind: str(body.kind, 20), p_note: str(body.note, 600), p_photo: path || null,
      p_lat: num(body.lat), p_lng: num(body.lng), p_accuracy: num(body.accuracy),
    });
    if (error) return json({ error: 'report_failed', message: error.message }, 500);
    return json(data);
  }

  if (action === 'mine') {
    if (!viewer) return json({ error: 'not_authenticated' }, 401);
    const { data } = await db.from('ve_venue_reports')
      .select('id, kind, note, status, points, created_at, reviewed_at, review_note, ve_venues(slug, name), ve_venue_items(name), ve_venue_spots(name)')
      .eq('member_id', viewer.id).order('created_at', { ascending: false }).limit(100);
    return json({ reports: (data || []).map((r: any) => ({ id: r.id, kind: r.kind, note: r.note, status: r.status, points: r.points,
      at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note,
      venue: r.ve_venues?.name, venue_slug: r.ve_venues?.slug, item: r.ve_venue_items?.name || null, spot: r.ve_venue_spots?.name || null })) });
  }

  if (action === 'saves' || action === 'save') {
    if (!viewer) return json({ error: 'not_authenticated' }, 401);
    if (!owns) return json({ error: 'guide_required', message: 'My list is for members who own the Guide.' }, 403);
    if (action === 'saves') {
      const { data } = await db.from('ve_guide_saves').select('kind, item_key, created_at').eq('guide_slug', GUIDE).eq('member_id', viewer.id)
        .in('kind', ['venue', 'venue_item']).order('created_at', { ascending: false }).limit(SAVE_CAP);
      const itemIds = (data || []).filter((x) => x.kind === 'venue_item').map((x) => x.item_key);
      const venueSlugs = (data || []).filter((x) => x.kind === 'venue').map((x) => x.item_key);
      const [{ data: its }, { data: vs }] = await Promise.all([
        itemIds.length ? db.from('ve_venue_items').select('id, name, vegan, last_confirmed_at, ve_venue_spots(name, where_text), ve_venues!inner(slug, name, kind)').in('id', itemIds).in('ve_venues.kind', GUIDES[GUIDE]) : Promise.resolve({ data: [] as any[] }),
        venueSlugs.length ? db.from('ve_venues').select('slug, name, kind, city, state, teams, image_url').in('slug', venueSlugs).in('kind', GUIDES[GUIDE]) : Promise.resolve({ data: [] as any[] }),
      ]);
      return json({ venues: venueSlugs.map((s) => (vs || []).find((v: any) => v.slug === s)).filter(Boolean),
        items: itemIds.map((id) => (its || []).find((i: any) => i.id === id)).filter(Boolean).map((i: any) => ({ id: i.id, name: i.name,
          vegan: i.vegan, last_confirmed_at: i.last_confirmed_at, spot: i.ve_venue_spots?.name, where: i.ve_venue_spots?.where_text,
          venue: i.ve_venues?.name, venue_slug: i.ve_venues?.slug })) });
    }
    const kind = str(body.kind, 20), key = str(body.key, 160);
    if (!['venue', 'venue_item'].includes(kind) || !/^[a-z0-9_-]{2,160}$/.test(key)) return json({ error: 'bad_request' }, 400);
    const row = { guide_slug: GUIDE, kind, item_key: key, member_id: viewer.id };
    if (body.on === false) { await db.from('ve_guide_saves').delete().match(row); return json({ ok: true, saved: false }); }
    const { count } = await db.from('ve_guide_saves').select('item_key', { count: 'exact', head: true }).eq('guide_slug', GUIDE).eq('member_id', viewer.id);
    if ((count || 0) >= SAVE_CAP) return json({ error: 'full', message: 'Your list is full. Take something off to save this.' }, 400);
    const { error } = await db.from('ve_guide_saves').insert(row);
    if (error && error.code !== '23505') return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, saved: true });
  }

  // ---------- the team ----------
  if (!admin) return json({ error: viewer ? 'forbidden' : 'not_authenticated' }, viewer ? 403 : 401);
  const by = viewer?.id || null;

  if (action === 'queue') {
    const status = ['pending', 'accepted', 'agreed', 'declined'].includes(body.status) ? body.status : 'pending';
    const { data, error } = await db.from('ve_venue_reports')
      .select('id, kind, note, status, points, distance_m, accuracy_m, created_at, reviewed_at, member_id, item_id, photo_path, members(name), ve_venues(slug, name), ve_venue_items(name), ve_venue_spots(name)')
      .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(300);
    if (error) return json({ error: 'queue_failed', message: error.message }, 500);
    const { data: counts } = await db.from('ve_venue_reports').select('status');
    const tally: Record<string, number> = { pending: 0, accepted: 0, agreed: 0, declined: 0 };
    for (const c of counts || []) tally[c.status] = (tally[c.status] || 0) + 1;
    return json({ counts: tally, reports: (data || []).map((r: any) => ({ id: r.id, kind: r.kind, note: r.note, status: r.status, points: r.points,
      distance_m: r.distance_m, accuracy_m: r.accuracy_m, at: r.created_at, reviewed_at: r.reviewed_at, member: shortName(r.members?.name), photo: !!r.photo_path,
      venue: r.ve_venues?.name, venue_slug: r.ve_venues?.slug, item: r.ve_venue_items?.name || null, spot: r.ve_venue_spots?.name || null })) });
  }

  if (action === 'report_get') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: r } = await db.from('ve_venue_reports')
      .select('*, members(name, email), ve_venues(slug, name), ve_venue_items(id, name, description, vegan, last_confirmed_at), ve_venue_spots(id, name, where_text)')
      .eq('id', body.id).maybeSingle();
    if (!r) return json({ error: 'not_found' }, 404);
    const { data: signed } = r.photo_path ? await db.storage.from(BUCKET).createSignedUrl(r.photo_path, 3600) : { data: null as any };
    let others: any[] = [];
    const q = db.from('ve_venue_reports').select('id, kind, note, status, points, created_at, members(name)').eq('venue_id', r.venue_id).neq('id', r.id)
      .order('created_at').limit(50);
    const { data: o } = r.item_id ? await q.eq('item_id', r.item_id) : await q.is('item_id', null).eq('kind', r.kind);
    others = (o || []).map((x: any) => ({ id: x.id, kind: x.kind, note: x.note, status: x.status, points: x.points, at: x.created_at, member: shortName(x.members?.name) }));
    const { data: paid } = await db.from('ve_venue_reports').select('id').eq('member_id', r.member_id).eq('local_day', r.local_day).gt('points', 0);
    return json({ report: { id: r.id, kind: r.kind, note: r.note, status: r.status, points: r.points, distance_m: r.distance_m, accuracy_m: r.accuracy_m,
      at: r.created_at, local_day: r.local_day, review_note: r.review_note, first_report_id: r.first_report_id,
      member: { name: r.members?.name, email: r.members?.email }, photo: signed?.signedUrl || null, paid_that_day: (paid || []).length,
      venue: r.ve_venues, item: r.ve_venue_items, spot: r.ve_venue_spots }, others, points: await reportPoints() });
  }

  if (action === 'review') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.rpc('ve_venue_report_review', { p_report: body.id, p_decision: str(body.decision, 10),
      p_reviewer: by, p_note: str(body.note, 600), p_first: isId(body.first) ? body.first : null });
    if (error) return json({ error: 'review_failed', message: error.message }, 500);
    return json(data);
  }

  if (action === 'venue_save') {
    const v = body.venue || {};
    const row: Record<string, unknown> = {};
    for (const k of ['name', 'city', 'state', 'hub', 'note', 'note_source_url', 'address', 'image_url']) if (k in v) row[k] = str(v[k], 400) || null;
    if ('kind' in v) { if (!['stadium', 'arena', 'airport'].includes(v.kind)) return json({ error: 'bad_kind' }, 400); row.kind = v.kind; }
    if ('teams' in v) row.teams = (Array.isArray(v.teams) ? v.teams : String(v.teams || '').split(',')).map((t: any) => str(t, 80)).filter(Boolean).slice(0, 12);
    if ('radius_m' in v) { const r = num(v.radius_m); if (r == null || r < 50 || r > 5000) return json({ error: 'bad_radius' }, 400); row.radius_m = Math.round(r); }
    if ('status' in v) row.status = v.status === 'hidden' ? 'hidden' : 'live';
    if ('layout' in v) { if (v.layout !== null && (typeof v.layout !== 'object' || !(Array.isArray(v.layout.levels) || Array.isArray(v.layout.terminals)))) return json({ error: 'bad_layout' }, 400); row.layout = v.layout; }
    if ('new_season' in v && v.new_season === true) row.season_reset_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    if (v.slug && (await db.from('ve_venues').select('id').eq('slug', v.slug).maybeSingle()).data) {
      const { error } = await db.from('ve_venues').update(row).eq('slug', v.slug);
      return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, slug: v.slug });
    }
    if (!row.name || !row.kind) return json({ error: 'name_kind_required' }, 400);
    const slug = String(row.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const { error } = await db.from('ve_venues').insert({ ...row, slug });
    return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, slug });
  }

  if (action === 'spot_save') {
    const s = body.spot || {};
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['name', 'where_text', 'note']) if (k in s) row[k] = str(s[k], 300) || null;
    if ('zone' in s) { if (!['concourse', 'club', 'suites', 'outside', 'airside', 'landside'].includes(s.zone)) return json({ error: 'bad_zone' }, 400); row.zone = s.zone; }
    if ('status' in s) row.status = s.status === 'gone' ? 'gone' : 'live';
    if ('sort_order' in s) row.sort_order = Math.round(num(s.sort_order) || 0);
    if ('map_sections' in s) row.map_sections = (Array.isArray(s.map_sections) ? s.map_sections : String(s.map_sections || '').split(',')).map((x: any) => str(x, 20)).filter(Boolean).slice(0, 30);
    if ('map_level' in s) row.map_level = str(s.map_level, 20) || null;
    if (isId(s.id)) { const { error } = await db.from('ve_venue_spots').update(row).eq('id', s.id); return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, id: s.id }); }
    const { data: v } = await db.from('ve_venues').select('id').eq('slug', str(s.venue, 80)).maybeSingle();
    if (!v || !row.name) return json({ error: 'venue_name_required' }, 400);
    const { data, error } = await db.from('ve_venue_spots').insert({ ...row, venue_id: v.id }).select('id').single();
    return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, id: data.id });
  }

  if (action === 'item_save') {
    const i = body.item || {};
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['name', 'description']) if (k in i) row[k] = str(i[k], 500) || null;
    if ('vegan' in i) { if (!['vegan', 'on_request', 'ask'].includes(i.vegan)) return json({ error: 'bad_vegan' }, 400); row.vegan = i.vegan; }
    if ('status' in i) row.status = i.status === 'gone' ? 'gone' : 'live';
    if ('sources' in i && Array.isArray(i.sources)) row.sources = i.sources.slice(0, 6).map((x: any) => ({ label: str(x.label, 120), url: str(x.url, 500), date: str(x.date, 20) || undefined })).filter((x: any) => x.label);
    if (i.confirm_now === true) row.last_confirmed_at = new Date().toISOString();
    if (isId(i.id)) { const { error } = await db.from('ve_venue_items').update(row).eq('id', i.id); return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, id: i.id }); }
    if (!isId(i.spot) || !row.name) return json({ error: 'spot_name_required' }, 400);
    const { data: sp } = await db.from('ve_venue_spots').select('id, venue_id').eq('id', i.spot).maybeSingle();
    if (!sp) return json({ error: 'not_found' }, 404);
    const { data, error } = await db.from('ve_venue_items').insert({ ...row, spot_id: sp.id, venue_id: sp.venue_id }).select('id').single();
    return error ? json({ error: 'save_failed', message: error.message }, 500) : json({ ok: true, id: data.id });
  }

  if (action === 'locate') {
    const { data: v } = await db.from('ve_venues').select('id, name, city, state, google_place_id').eq('slug', str(body.slug, 80)).maybeSingle();
    if (!v) return json({ error: 'not_found' }, 404);
    const key = await secret('GOOGLE_PLACES_API_KEY');
    if (!key) return json({ error: 'no_key' }, 500);
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types' },
      body: JSON.stringify({ textQuery: `${v.name}, ${v.city || ''} ${v.state || ''}`.trim(), maxResultCount: 3 }),
    });
    const d = await r.json().catch(() => ({}));
    const p = (d.places || [])[0];
    if (!p?.location) return json({ error: 'not_found_on_google', google: d }, 404);
    const { error } = await db.from('ve_venues').update({ google_place_id: p.id, address: p.formattedAddress, latitude: p.location.latitude,
      longitude: p.location.longitude, updated_at: new Date().toISOString() }).eq('id', v.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, name: p.displayName?.text, address: p.formattedAddress, lat: p.location.latitude, lng: p.location.longitude, types: p.types });
  }

  return json({ error: 'unknown_action' }, 400);
});
