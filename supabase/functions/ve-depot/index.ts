// ve-depot: the Depot home (Sean, 2026-11-07, playbook branddesk-production-wing). verify_jwt off; the Vegans Explore member
// token is checked here and only super admins get anything.
// POST { action: 'home' }                          -> { counts, restored }   the numbers on the home's tiles (ve_depot_counts) and
//                                                      the retired tools Sean has put back.
// POST { action: 'trash_set', href, restored }     -> { restored }           restore a retired tool (true) or retire it again (false).
//                                                      href must be one of TRASH (the same list as TRASH in public/depot-tabs.js).
// Depot > Guides, the back end of every tour video (canon-ve-guide-tour-standard v3; tables ve_video_tours, ve_video_chapters,
// ve_video_shots, migration 20261107_tour_backend.sql):
// POST { action: 'tours' }                          -> { tours }   every tour with its chapter and shot counts
// POST { action: 'tour', slug }                     -> { tour, chapters, shots }
// POST { action: 'shot_decide', id, status, note? } -> { shot }    status approved | redo (redo needs a note) | proposed
// POST { action: 'chapter_approve', id, approved }  -> { chapter }
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
    const [{ data: counts, error }, restored] = await Promise.all([db.rpc('ve_depot_counts'), restoredList()]);
    if (error) return json({ error: 'counts_failed' }, 500);
    return json({ ok: true, counts, restored });
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

  return json({ error: 'unknown_action' }, 400);
});
