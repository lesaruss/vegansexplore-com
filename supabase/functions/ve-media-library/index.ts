// ve-media-library: the Vegans Explore image library (Sean, 2026-09-27: "select and
// choose the ones we've already created" instead of scrolling Higgsfield).
//
// /admin/media-library resizes each image in the browser (a web-size WebP, or JPEG
// where the browser cannot encode WebP, plus a thumbnail) and posts it here one at a time. Files live in vegan-media/library/,
// named by the SHA-256 of the original file so the same file never lands twice.
// The onboarding image picker lists the library and saves a pick through
// ve-onboarding-audio set_panel. Superadmins only.
//
// POST { action: 'list' }                                                Authorization: Bearer <ve_token>
// POST { action: 'upload', sha256, source_name, width, height, full_b64, thumb_b64 }  (WebP or JPEG)
// POST { action: 'update', id, uses?, place?, labels?, archived? }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const USES = ['bg_desktop', 'bg_mobile', 'slide'];
const PLACES = ['miami', 'broward', 'palm-beach'];
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
      .select('id, url, thumb_url, width, height, orientation, source_name, uses, place, labels, archived, created_at')
      .order('created_at', { ascending: false }).limit(1000);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    return json({ items: data || [] });
  }

  if (body.action === 'upload') {
    const sha = String(body.sha256 || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sha)) return json({ error: 'bad_sha256' }, 400);
    const { data: existing } = await db.from('ve_media_library').select('id, url, thumb_url').eq('sha256', sha).maybeSingle();
    if (existing) return json({ ok: true, duplicate: true, item: existing });

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
      sha256: sha, url, thumb_url, width, height, orientation, bytes: full.length,
      source_name: String(body.source_name || '').slice(0, 200) || null, uploaded_by: memberId,
    }).select('id, url, thumb_url, width, height, orientation, source_name, uses, place, labels, archived, created_at').single();
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
      .select('id, url, thumb_url, width, height, orientation, source_name, uses, place, labels, archived, created_at').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, item });
  }

  return json({ error: 'unknown_action' }, 400);
});
