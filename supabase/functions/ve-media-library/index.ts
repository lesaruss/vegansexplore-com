// ve-media-library: the Vegans Explore media library (Sean, 2026-09-27: "select and
// choose the ones we've already created" instead of scrolling Higgsfield, for
// images, audio and video alike).
//
// Images are resized in the browser (a web-size WebP, or JPEG where the browser
// cannot encode WebP, plus a thumbnail) and posted here. Audio and video go
// straight to storage through a one-time signed upload URL, then are registered.
// Files live in vegan-media/library/, named by the SHA-256 of the original file
// so the same file never lands twice. The onboarding image picker lists the
// library and saves a pick through ve-onboarding-audio set_panel. Superadmins only.
//
// POST { action: 'list' }                                                Authorization: Bearer <ve_token>
// POST { action: 'upload', sha256, source_name, width, height, full_b64, thumb_b64 }  images (WebP or JPEG)
// POST { action: 'upload_url', sha256, kind, ext }                        audio / video: returns a signed upload URL
// POST { action: 'register', sha256, kind, ext, mime, bytes, duration?, width?, height?, source_name }
// POST { action: 'update', id, uses?, place?, labels?, archived? }
// POST { action: 'skip', refs }       older pictures Sean chose not to keep (never offered again)
// POST { action: 'delete', ids }      removes the files and the rows; refuses anything a live page or Pulse piece uses
// POST { action: 'pulse_list' }       pieces the Depot has published to the Pulse
// POST { action: 'pulse_save', id?, content_type, title, summary, body_text, category, city_slug?,
//        cover_url, video_url?, youtube?, audio_url?, author? }
//   The Depot's Pulse pipeline (Sean, 2026-09-27: "it can go straight out"). A new piece is
//   published the moment it is saved; an id edits one. The body is plain text: blank lines
//   make paragraphs, and it is escaped here, so nothing typed can inject markup.
// POST { action: 'pulse_status', id, status }   'published' or 'archived' (take down / put back)
//
// Sean, 2026-09-27: the older Higgsfield set is reviewed once on /admin/onboarding-images.
// The ones he keeps are uploaded here with source_ref (e.g. 'higgsfield:<id>'), the rest
// are skipped, and from then on pages pick only from this library.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const USES = ['bg_desktop', 'bg_mobile', 'slide', 'narration', 'music', 'video'];
// Audio and video file types the library keeps, by extension.
const MEDIA_EXT: Record<string, { kind: 'audio' | 'video'; mime: string }> = {
  mp3: { kind: 'audio', mime: 'audio/mpeg' }, wav: { kind: 'audio', mime: 'audio/wav' }, m4a: { kind: 'audio', mime: 'audio/mp4' },
  aac: { kind: 'audio', mime: 'audio/aac' }, ogg: { kind: 'audio', mime: 'audio/ogg' },
  mp4: { kind: 'video', mime: 'video/mp4' }, mov: { kind: 'video', mime: 'video/quicktime' }, webm: { kind: 'video', mime: 'video/webm' },
};
const COLS = 'id, kind, url, thumb_url, mime, width, height, orientation, duration, bytes, source_name, uses, place, labels, archived, source_ref, created_at';
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/`;
const REF_RE = /^[a-z0-9:/._-]{1,200}$/i;
const PLACES = ['miami', 'broward', 'palm-beach'];
// The Pulse: what a piece can be, and the city hubs that show city pieces (/communities/*).
const PULSE_TYPES = ['article', 'video', 'interview', 'podcast'];
const PULSE_CITIES = ['south-florida', 'central-florida', 'new-york', 'philadelphia', 'los-angeles', 'atlanta', 'dmv', 'london'];
const PULSE_COLS = 'id, slug, title, content_type, category, summary, body, city_slug, thumbnail_url, video_url, audio_url, youtube_id, author, status, published_at, updated_at';
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paragraphs = (t: string) => t.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  .map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('\n');
const slugify = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'piece';
function youtubeId(v: unknown): string | null {
  const t = String(v || '').trim(); if (!t) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
const MAX_FULL = 8 * 1024 * 1024;
const MAX_THUMB = 1024 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  } catch { return null; }
}

function b64ToBytes(s: string): Uint8Array | null {
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return null; }
}
// A WebP starts with RIFF....WEBP, a JPEG with FF D8 FF.
function kind(b: Uint8Array): 'webp' | 'jpg' | null {
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'webp';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  return null;
}
const TYPE = { webp: 'image/webp', jpg: 'image/jpeg' };
const cleanLabels = (v: unknown) => (Array.isArray(v) ? v : []).map((x) => String(x).trim().toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 12);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member?.is_superadmin) return json({ error: 'no_access' }, 403);

  if (body.action === 'list') {
    const { data, error } = await db.from('ve_media_library')
      .select(COLS)
      .order('created_at', { ascending: false }).limit(1000);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const { data: skips } = await db.from('ve_media_import_skips').select('source_ref');
    return json({ items: data || [], skipped: (skips || []).map((r: any) => r.source_ref) });
  }

  if (body.action === 'upload') {
    const sha = String(body.sha256 || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sha)) return json({ error: 'bad_sha256' }, 400);
    const ref = REF_RE.test(String(body.source_ref || '')) ? String(body.source_ref) : null;
    const { data: existing } = await db.from('ve_media_library').select(COLS).eq('sha256', sha).maybeSingle();
    if (existing) {
      // Same file already here: remember where it came from so the review counts it as kept.
      if (ref && !existing.source_ref) await db.from('ve_media_library').update({ source_ref: ref }).eq('id', existing.id);
      return json({ ok: true, duplicate: true, item: { ...existing, source_ref: existing.source_ref || ref } });
    }

    const full = b64ToBytes(String(body.full_b64 || '')), thumb = b64ToBytes(String(body.thumb_b64 || ''));
    const fk = full && kind(full), tk = thumb && kind(thumb);
    if (!full || !thumb || !fk || !tk) return json({ error: 'not_webp_or_jpeg' }, 400);
    if (full.length > MAX_FULL || thumb.length > MAX_THUMB) return json({ error: 'too_large' }, 400);
    const width = Math.round(Number(body.width)), height = Math.round(Number(body.height));
    if (!(width > 0 && height > 0 && width <= 8000 && height <= 8000)) return json({ error: 'bad_size' }, 400);
    const ratio = width / height;
    const orientation = ratio > 1.08 ? 'landscape' : ratio < 0.93 ? 'portrait' : 'square';

    const name = sha.slice(0, 20);
    const fp = `library/${name}.${fk}`, tp = `library/thumbs/${name}.${tk}`;
    const up1 = await db.storage.from('vegan-media').upload(fp, full, { contentType: TYPE[fk], upsert: true });
    if (up1.error) return json({ error: 'upload_failed', message: up1.error.message }, 500);
    const up2 = await db.storage.from('vegan-media').upload(tp, thumb, { contentType: TYPE[tk], upsert: true });
    if (up2.error) return json({ error: 'upload_failed', message: up2.error.message }, 500);
    const url = db.storage.from('vegan-media').getPublicUrl(fp).data.publicUrl;
    const thumb_url = db.storage.from('vegan-media').getPublicUrl(tp).data.publicUrl;

    const { data: item, error } = await db.from('ve_media_library').insert({
      sha256: sha, kind: 'image', mime: TYPE[fk], url, thumb_url, width, height, orientation, bytes: full.length,
      source_name: String(body.source_name || '').slice(0, 200) || null, source_ref: ref, uploaded_by: memberId,
    }).select(COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, item });
  }

  if (body.action === 'pulse_list') {
    const { data, error } = await db.from('ve_pulse_content').select(PULSE_COLS).eq('origin', 'depot').order('published_at', { ascending: false }).limit(200);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    return json({ pieces: data || [] });
  }

  if (body.action === 'pulse_save') {
    const own = (u: unknown, ext: RegExp) => typeof u === 'string' && u.startsWith(PUBLIC_PREFIX) && /^[a-z0-9/_.-]+$/i.test(u.slice(PUBLIC_PREFIX.length)) && ext.test(u);
    const type = String(body.content_type || '');
    // The feed cards put these straight into the page, so no angle brackets.
    const plain = (v: unknown, n: number) => String(v || '').replace(/[<>]/g, '').trim().slice(0, n);
    const title = plain(body.title, 160), summary = plain(body.summary, 400), category = plain(body.category, 60);
    const text = String(body.body_text || '').trim().slice(0, 60000);
    const city = body.city_slug ? String(body.city_slug) : null;
    if (!PULSE_TYPES.includes(type)) return json({ error: 'bad_type' }, 400);
    if (!title || !summary || !category) return json({ error: 'missing_fields' }, 400);
    if (city && !PULSE_CITIES.includes(city)) return json({ error: 'bad_city' }, 400);
    if (!own(body.cover_url, /\.(webp|jpe?g|png)$/i)) return json({ error: 'bad_cover' }, 400);
    const video = body.video_url ? String(body.video_url) : null, audio = body.audio_url ? String(body.audio_url) : null;
    if (video && !own(video, /\.(mp4|mov|webm)$/i)) return json({ error: 'bad_video' }, 400);
    if (audio && !own(audio, /\.(mp3|wav|m4a|aac|ogg)$/i)) return json({ error: 'bad_audio' }, 400);
    const yt = youtubeId(body.youtube);
    if (body.youtube && !yt) return json({ error: 'bad_youtube' }, 400);
    const row: Record<string, unknown> = {
      content_type: type, title, summary, body: paragraphs(text), category, city_slug: city, thumbnail_url: body.cover_url,
      video_url: video, audio_url: audio, youtube_id: yt, author: plain(body.author, 80) || null,
      updated_at: new Date().toISOString(),
    };
    let saved: any;
    if (body.id) {
      const id = String(body.id);
      if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
      const { data, error } = await db.from('ve_pulse_content').update(row).eq('id', id).eq('origin', 'depot').select(PULSE_COLS).single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      saved = data;
    } else {
      // A slug nobody has used, so the piece gets its own /pulse/<slug> page, which is also
      // its source_url (the table requires one; for Depot pieces the Pulse page is the source).
      const base = slugify(title);
      const { data: taken } = await db.from('ve_pulse_content').select('slug').like('slug', base + '%');
      const used = new Set((taken || []).map((r: any) => r.slug));
      let slug = base; for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      const now = new Date().toISOString();
      const { data, error } = await db.from('ve_pulse_content').insert({ ...row, slug, source_url: `https://vegansexplore.com/pulse/${slug}`, status: 'published', published_at: now, created_at: now, origin: 'depot', brand_slug: 'vegans-explore', created_by: memberId })
        .select(PULSE_COLS).single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      saved = data;
    }
    // A city piece also shows on that city's hub (/communities/<city>).
    await db.from('ve_pulse_city_tags').delete().eq('pulse_id', saved.id);
    if (city) await db.from('ve_pulse_city_tags').insert({ pulse_id: saved.id, city_slug: city, is_pinned: false });
    return json({ ok: true, piece: saved });
  }

  if (body.action === 'pulse_status') {
    const id = String(body.id || ''), status = String(body.status || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !['published', 'archived'].includes(status)) return json({ error: 'bad_request' }, 400);
    const { data, error } = await db.from('ve_pulse_content').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('origin', 'depot').select(PULSE_COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, piece: data });
  }

  if (body.action === 'skip') {
    const refs = (Array.isArray(body.refs) ? body.refs : []).map(String).filter((r: string) => REF_RE.test(r)).slice(0, 500);
    if (!refs.length) return json({ error: 'no_refs' }, 400);
    const { error } = await db.from('ve_media_import_skips').upsert(refs.map((r: string) => ({ source_ref: r, skipped_by: memberId })), { onConflict: 'source_ref' });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, skipped: refs.length });
  }

  if (body.action === 'delete') {
    const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((i: string) => /^[0-9a-f-]{36}$/.test(i)).slice(0, 500);
    if (!ids.length) return json({ error: 'no_ids' }, 400);
    const { data: rows } = await db.from('ve_media_library').select('id, url, thumb_url, source_ref').in('id', ids);
    const urls = (rows || []).map((r: any) => r.url);
    // Anything a live page uses (picture, narration, music or video) is kept.
    const inList = urls.length ? urls : ['-'];
    const [pan, aud, mus, vid, pc, pv, pa] = await Promise.all([
      db.from('ve_onboarding_panels').select('url').in('url', inList),
      db.from('ve_onboarding_audio').select('url').in('url', inList),
      db.from('ve_onboarding_slides').select('url:music_url').in('music_url', inList),
      db.from('ve_onboarding_slides').select('url:video_url').in('video_url', inList),
      // ...and anything on a Pulse piece that is still up.
      db.from('ve_pulse_content').select('url:thumbnail_url').eq('status', 'published').in('thumbnail_url', inList),
      db.from('ve_pulse_content').select('url:video_url').eq('status', 'published').in('video_url', inList),
      db.from('ve_pulse_content').select('url:audio_url').eq('status', 'published').in('audio_url', inList),
    ]);
    const liveSet = new Set([pan, aud, mus, vid, pc, pv, pa].flatMap((q: any) => (q.data || []).map((r: any) => r.url)));
    const deleted: string[] = [], in_use: string[] = [];
    for (const r of rows || []) {
      if (liveSet.has(r.url)) { in_use.push(r.id); continue; }
      const paths = [r.url, r.thumb_url].filter((u: string) => u && u.startsWith(PUBLIC_PREFIX + 'library/')).map((u: string) => u.slice(PUBLIC_PREFIX.length));
      if (paths.length) {
        const rm = await db.storage.from('vegan-media').remove(paths);
        if (rm.error) return json({ error: 'delete_failed', message: rm.error.message, deleted, in_use }, 500);
      }
      const { error } = await db.from('ve_media_library').delete().eq('id', r.id);
      if (error) return json({ error: 'delete_failed', message: error.message, deleted, in_use }, 500);
      if (r.source_ref) await db.from('ve_media_import_skips').upsert({ source_ref: r.source_ref, skipped_by: memberId }, { onConflict: 'source_ref' });
      deleted.push(r.id);
    }
    return json({ ok: true, deleted, in_use });
  }

  if (body.action === 'upload_url' || body.action === 'register') {
    const sha = String(body.sha256 || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sha)) return json({ error: 'bad_sha256' }, 400);
    const ext = String(body.ext || '').toLowerCase(), t = MEDIA_EXT[ext];
    if (!t) return json({ error: 'unsupported_type' }, 400);
    const { data: existing } = await db.from('ve_media_library').select(COLS).eq('sha256', sha).maybeSingle();
    if (existing) return json({ ok: true, duplicate: true, item: existing });
    const name = sha.slice(0, 20), path = `library/media/${name}.${ext}`;

    if (body.action === 'upload_url') {
      const { data, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path, { upsert: true });
      if (error || !data) return json({ error: 'sign_failed', message: error?.message }, 500);
      return json({ ok: true, signed_url: data.signedUrl, path });
    }

    // register: only after the file is really in storage.
    const { data: found } = await db.storage.from('vegan-media').list('library/media', { search: `${name}.${ext}`, limit: 1 });
    const obj = (found || []).find((o: any) => o.name === `${name}.${ext}`);
    if (!obj) return json({ error: 'file_not_uploaded' }, 400);
    const width = Math.round(Number(body.width)) || null, height = Math.round(Number(body.height)) || null;
    const orientation = width && height ? (width / height > 1.08 ? 'landscape' : width / height < 0.93 ? 'portrait' : 'square') : null;
    const duration = Math.round(Number(body.duration || 0) * 10) / 10 || null;
    const url = db.storage.from('vegan-media').getPublicUrl(path).data.publicUrl;
    const { data: item, error } = await db.from('ve_media_library').insert({
      sha256: sha, kind: t.kind, url, thumb_url: null, mime: t.mime, width, height, orientation, duration,
      bytes: Number(obj.metadata?.size) || Number(body.bytes) || null,
      source_name: String(body.source_name || '').slice(0, 200) || null, uploaded_by: memberId,
    }).select(COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, item });
  }

  if (body.action === 'update') {
    const id = String(body.id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.uses !== undefined) patch.uses = (Array.isArray(body.uses) ? body.uses : []).map(String).filter((u: string) => USES.includes(u));
    if (body.place !== undefined) patch.place = PLACES.includes(String(body.place)) ? String(body.place) : null;
    if (body.labels !== undefined) patch.labels = cleanLabels(body.labels);
    if (body.archived !== undefined) patch.archived = !!body.archived;
    const { data: item, error } = await db.from('ve_media_library').update(patch).eq('id', id)
      .select(COLS).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, item });
  }

  return json({ error: 'unknown_action' }, 400);
});
