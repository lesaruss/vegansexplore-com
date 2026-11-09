// ve-depot: the Depot home (Sean, 2026-11-07, playbook branddesk-production-wing). verify_jwt off; the Vegans Explore member
// token is checked here and only super admins get anything.
// POST { action: 'home' }                          -> { counts, restored }   the numbers on the home's tiles (ve_depot_counts) and
//                                                      the retired tools Sean has put back.
// POST { action: 'trash_set', href, restored }     -> { restored }           restore a retired tool (true) or retire it again (false).
// POST { action: 'pin_set', href, pinned }          -> { pins }               My list (Sean, 2026-11-07): star a tool so it sits in My
//                                                      list on the home. Per account, in ve_site_settings depot_pins {member: [href]}.
// home also returns pins (mine) and thumbs: a one-hour signed link per tool picture in the private bucket depot-thumbs
// (tools/<slug>.jpg, slug = the href with every run of other characters as one dash). They are live admin pages, so never public.
//                                                      href must be one of TRASH (the same list as TRASH in public/depot-tabs.js).
// Depot > Guides, the back end of every tour video (canon-ve-guide-tour-standard v3; tables ve_video_tours, ve_video_chapters,
// ve_video_shots, migration 20261107_tour_backend.sql):
// POST { action: 'tours' }                          -> { tours }   every tour with its chapter and shot counts
// POST { action: 'tour', slug }                     -> { tour, chapters, shots }
// POST { action: 'shot_decide', id, status, note? } -> { shot }    status approved | redo (redo needs a note) | proposed
// POST { action: 'chapter_approve', id, approved }  -> { chapter }
// POST { action: 'ad_assets', days? }               -> { guides }  Depot > Ad assets (playbook ve-guide-banner-audio), below.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// Keep in step with TRASH in public/depot-tabs.js.
const TRASH = new Set([
  '/admin/depot/challenges', '/admin/depot/challenge', '/admin/depot/challenge-card', '/admin/depot/challenge-kit',
  '/admin/depot/pulse', '/admin/depot/pulse-cities', '/admin/depot/verified', '/admin/depot/logos', '/admin/depot/tours',
  '/admin/depot/services', '/admin/depot/dinners', '/admin/depot/narration', '/dashboard/guest-reviews',
  '/admin/depot/social', '/admin/depot/playbooks', '/admin/depot/business-outreach',
  '/admin/depot/analytics', '/dashboard/insights', '/dashboard/health',
]);

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

async function pinsAll(): Promise<Record<string, string[]>> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'depot_pins').maybeSingle();
  const v = data?.value as Record<string, unknown> | null;
  const out: Record<string, string[]> = {};
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (Array.isArray(x)) out[k] = x.filter((h) => typeof h === 'string');
  return out;
}
async function thumbs(): Promise<Record<string, string>> {
  const { data: files } = await db.storage.from('depot-thumbs').list('tools', { limit: 500 });
  const names = (files || []).map((f) => 'tools/' + f.name).filter((n) => n.endsWith('.jpg'));
  if (!names.length) return {};
  const { data } = await db.storage.from('depot-thumbs').createSignedUrls(names, 3600);
  const out: Record<string, string> = {};
  for (const d of data || []) if (d.signedUrl && d.path) out[d.path.replace(/^tools\//, '').replace(/\.jpg$/, '')] = d.signedUrl;
  return out;
}

async function restoredList(): Promise<string[]> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'depot_trash').maybeSingle();
  const r = (data?.value as { restored?: unknown } | null)?.restored;
  return Array.isArray(r) ? r.filter((x) => typeof x === 'string' && TRASH.has(x)) : [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const me = token ? await verifyToken(token) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', me).maybeSingle();
  if (!m?.is_superadmin) return json({ error: 'admins_only' }, 403);

  if (b.action === 'home') {
    const [{ data: counts, error }, restored, pins, th] = await Promise.all([db.rpc('ve_depot_counts'), restoredList(), pinsAll(), thumbs().catch(() => ({}))]);
    if (error) return json({ error: 'counts_failed' }, 500);
    return json({ ok: true, counts, restored, pins: pins[me] || [], thumbs: th });
  }

  if (b.action === 'pin_set') {
    const href = typeof b.href === 'string' ? b.href : '';
    if (!/^(\/|https:\/\/hq\.lesaruss\.ai\/)[a-z0-9\/#?=&_.-]{1,160}$/i.test(href)) return json({ error: 'bad_href' }, 400);
    const all = await pinsAll();
    const mine = (all[me] || []).filter((h) => h !== href);
    if (b.pinned === true) { if (mine.length >= 40) return json({ error: 'too_many' }, 400); mine.push(href); }
    all[me] = mine;
    const { error } = await db.from('ve_site_settings').upsert({ key: 'depot_pins', value: all, updated_at: new Date().toISOString(), updated_by: me });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, pins: mine });
  }

  if (b.action === 'trash_set') {
    const href = typeof b.href === 'string' ? b.href : '';
    if (!TRASH.has(href)) return json({ error: 'not_in_trash_list' }, 400);
    const list = new Set(await restoredList());
    if (b.restored === true) list.add(href); else list.delete(href);
    const restored = [...list];
    const { error } = await db.from('ve_site_settings').upsert({ key: 'depot_trash', value: { restored }, updated_at: new Date().toISOString(), updated_by: me });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, restored });
  }

  if (b.action === 'tours') {
    const [{ data: tours }, { data: ch }, { data: sh }] = await Promise.all([
      db.from('ve_video_tours').select('id, slug, title, kind, narrator, status, page_url, video_url, youtube_url, updated_at').order('created_at'),
      db.from('ve_video_chapters').select('tour_id, approved_at, seconds'),
      db.from('ve_video_shots').select('tour_id, status'),
    ]);
    const out = (tours || []).map((t) => {
      const c = (ch || []).filter((x) => x.tour_id === t.id), s = (sh || []).filter((x) => x.tour_id === t.id);
      return { ...t, chapters: c.length, seconds: c.reduce((a, x) => a + Number(x.seconds || 0), 0),
        shots: s.length, approved: s.filter((x) => x.status === 'approved').length, redo: s.filter((x) => x.status === 'redo').length };
    });
    return json({ ok: true, tours: out });
  }

  if (b.action === 'tour') {
    const slug = typeof b.slug === 'string' ? b.slug : '';
    const { data: tour } = await db.from('ve_video_tours').select('*').eq('slug', slug).maybeSingle();
    if (!tour) return json({ error: 'not_found' }, 404);
    const [{ data: chapters }, { data: shots }] = await Promise.all([
      db.from('ve_video_chapters').select('*').eq('tour_id', tour.id).order('n'),
      db.from('ve_video_shots').select('*').eq('tour_id', tour.id).order('chapter_n').order('ord'),
    ]);
    return json({ ok: true, tour, chapters: chapters || [], shots: shots || [] });
  }

  if (b.action === 'shot_decide') {
    const id = typeof b.id === 'string' ? b.id : '';
    const status = b.status === 'approved' || b.status === 'redo' || b.status === 'proposed' ? b.status : '';
    const note = typeof b.note === 'string' ? b.note.trim().slice(0, 2000) : '';
    if (!id || !status) return json({ error: 'bad_request' }, 400);
    if (status === 'redo' && !note) return json({ error: 'note_needed' }, 400);
    const { data: shot, error } = await db.from('ve_video_shots')
      .update({ status, note: note || null, decided_at: status === 'proposed' ? null : new Date().toISOString(), decided_by: status === 'proposed' ? null : me, updated_at: new Date().toISOString() })
      .eq('id', id).select('*').maybeSingle();
    if (error || !shot) return json({ error: 'not_found' }, 404);
    return json({ ok: true, shot });
  }

  if (b.action === 'chapter_approve') {
    const id = typeof b.id === 'string' ? b.id : '';
    if (!id) return json({ error: 'bad_request' }, 400);
    const { data: chapter, error } = await db.from('ve_video_chapters').update({ approved_at: b.approved === false ? null : new Date().toISOString() }).eq('id', id).select('*').maybeSingle();
    if (error || !chapter) return json({ error: 'not_found' }, 404);
    return json({ ok: true, chapter });
  }

  if (b.action === 'ad_assets') return json(await adAssets(Number(b.days) || 30));

  return json({ error: 'unknown_action' }, 400);
});

// ---- Depot > Ad assets (Sean, 2026-11-09, playbook ve-guide-banner-audio: "I don't want these things to get lost... a summary page or
// like a hub where it has all these assets"). Every Guide banner: its art, its campaigns (sponsor ve-house-banners) and the slots they run
// in, its tracked /go/ link, its commercials (podcast and banner cuts, ve_guide_commercials) and its views, clicks and listens.
// POST { action: 'ad_assets', days? }  -> { guides, from, to, days }   days 7 | 30 | 90 | 0 (all time)
const HOUSE_SPONSOR = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001';
const SITE = 'https://vegansexplore.com';
const MEDIA = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/`;
async function adAssets(days: number) {
  const d = [0, 7, 30, 90].includes(days) ? days : 30;
  const to = new Date().toISOString().slice(0, 10);
  const from = d ? new Date(Date.now() - (d - 1) * 864e5).toISOString().slice(0, 10) : '2026-01-01';
  const [{ data: camps }, { data: comms }] = await Promise.all([
    db.from('ad_campaigns').select('id, campaign_name, creative_url, click_through_url, status, notes, start_date, end_date').eq('sponsor_campaign_id', HOUSE_SPONSOR),
    db.from('ve_guide_commercials').select('*').order('cut').order('version', { ascending: false }),
  ]);
  const cids = (camps || []).map((c) => c.id);
  const [{ data: cps }, { data: imps }] = await Promise.all([
    cids.length ? db.from('ad_campaign_placements').select('campaign_id, placement_id').in('campaign_id', cids) : Promise.resolve({ data: [] as any[] }),
    cids.length ? db.from('ad_impressions').select('placement_id, campaign_id, impressions, clicks, listens').in('campaign_id', cids).gte('log_date', from).lte('log_date', to).limit(50000) : Promise.resolve({ data: [] as any[] }),
  ]);
  const pids = [...new Set((cps || []).map((x: any) => x.placement_id))];
  const { data: places } = pids.length ? await db.from('ad_placements').select('id, page_slug, slot_id, dimensions, status').in('id', pids) : { data: [] as any[] };
  const P = new Map((places || []).map((p: any) => [p.id, p]));
  // A Guide's slug: the rail ad names it (?g=), the house banner by its /go/ code (ve-guide-<x>, matched to the rail's).
  const goOf = (c: any) => (String(c.click_through_url || '').match(/\/go\/([a-z0-9-]+)/i) || [])[1] || '';
  const slugByGo: Record<string, string> = {};
  for (const c of camps || []) { const g = (String(c.creative_url || '').match(/[?&]g=([a-z0-9-]+)/) || [])[1]; if (g) slugByGo[goOf(c)] = g; }
  const codes = [...new Set((camps || []).map(goOf).filter(Boolean))];
  const { data: links } = codes.length ? await db.from('ve_links').select('code, destination, clicks, last_click_at, active').in('code', codes) : { data: [] as any[] };
  const L = new Map((links || []).map((l: any) => [l.code, l]));
  const guides: Record<string, any> = {};
  const guide = (slug: string, name: string) => guides[slug] ||= { slug, name, art: `${SITE}/public/guides/${slug}.jpg`, page: `${SITE}/guides/${slug}`,
    campaigns: [], commercials: [], go: null, totals: { views: 0, clicks: 0, listens: 0 }, promo: null };
  for (const c of camps || []) {
    const go = goOf(c);
    const slug = (String(c.creative_url || '').match(/[?&]g=([a-z0-9-]+)/) || [])[1] || slugByGo[go] || '';
    if (!slug) continue; // the creator ad and any non-Guide banner
    const name = String(c.campaign_name || '').replace(/^Vegans Explore - /, '').replace(/\s*\([^)]*\)\s*$/, '');
    const g = guide(slug, name);
    const format = (String(c.campaign_name).match(/\(([^)]*)\)\s*$/) || [])[1] || '';
    const slots = (cps || []).filter((x: any) => x.campaign_id === c.id).map((x: any) => {
      const p: any = P.get(x.placement_id) || {};
      const rows = (imps || []).filter((i: any) => i.campaign_id === c.id && i.placement_id === x.placement_id);
      const s = { page: p.page_slug || '', slot: p.slot_id || '', size: p.dimensions || '', status: p.status || '',
        views: rows.reduce((a: number, r: any) => a + (r.impressions || 0), 0), clicks: rows.reduce((a: number, r: any) => a + (r.clicks || 0), 0),
        listens: rows.reduce((a: number, r: any) => a + (r.listens || 0), 0) };
      if (c.status === 'active' || s.views) { g.totals.views += s.views; g.totals.clicks += s.clicks; g.totals.listens += s.listens; }
      return s;
    }).sort((a: any, b: any) => b.views - a.views);
    g.campaigns.push({ id: c.id, name: c.campaign_name, format, status: c.status, creative: c.creative_url, link: c.click_through_url, notes: c.notes, slots });
    if (go && !g.go) { const l: any = L.get(go); g.go = { code: go, url: `${SITE}/go/${go}`, clicks: l?.clicks ?? null, last_click_at: l?.last_click_at ?? null, destination: l?.destination ?? null, active: l?.active ?? null }; }
  }
  for (const m of comms || []) {
    const g = guides[m.guide_slug] || guide(m.guide_slug, m.guide_name);
    g.speaker ||= m.speaker;
    g.commercials.push({ cut: m.cut, version: m.version, url: MEDIA + m.audio_path, path: m.audio_path, script: m.script, script_source: m.script_source,
      seconds: m.seconds, checked: m.checked, note: m.note, made_at: m.made_at });
  }
  // The listing pages' house banner and the rail's listens by page, from ve_promo_events (promo guide-<slug>; bots are never sent).
  const promos = Object.keys(guides).map((s) => 'guide-' + s);
  const { data: ev } = await db.from('ve_promo_events').select('promo, step, page').in('promo', promos).gte('created_at', from + 'T00:00:00Z').limit(50000);
  for (const s of Object.keys(guides)) {
    const rows = (ev || []).filter((e: any) => e.promo === 'guide-' + s);
    const count = (st: string) => rows.filter((e: any) => e.step === st).length;
    const byPage: Record<string, any> = {};
    for (const e of rows) { const k = e.page || '(none)'; byPage[k] ||= { page: k, view: 0, click: 0, listen: 0, heard: 0 }; if (e.step in byPage[k]) byPage[k][e.step]++; }
    guides[s].promo = { view: count('view'), click: count('click'), listen: count('listen'), heard: count('heard'),
      by_page: Object.values(byPage).sort((a: any, b: any) => (b.listen + b.view) - (a.listen + a.view)).slice(0, 40) };
  }
  const list = Object.values(guides).sort((a: any, b: any) =>
    (b.campaigns.some((c: any) => c.status === 'active') ? 1 : 0) - (a.campaigns.some((c: any) => c.status === 'active') ? 1 : 0) || b.totals.views - a.totals.views);
  return { ok: true, guides: list, from, to, days: d };
}
