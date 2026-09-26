// ve-onboarding-audio: stores Sean's recorded narration for the onboarding pages
// (Sean, 2026-09-26: "drag a folder in there and it took all the files").
//
// /admin/onboarding-audio levels and encodes each clip in the browser, then posts
// it here one at a time. This stores the WAV in vegan-media and records it in
// ve_onboarding_audio, which the onboarding page reads to replace its placeholder
// clip for that slide. Superadmins only.
//
// POST { action: 'list', page?, city }                                   Authorization: Bearer <ve_token>
// POST { action: 'upload', page?, city, key, audio_b64, dur, source_name }
// POST { action: 'panels', page?, city }
// POST { action: 'set_panel', page?, city, key, source, source_id }
//   The image in a slide's panel (Sean, 2026-09-26: pick from a grid at
//   /admin/onboarding-images). A Higgsfield image is copied into vegan-media so
//   the page never depends on the CDN; a site path (/public/...) is used as is.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const PAGES: Record<string, string[]> = {
  cm: ['welcome', 'have', 'lead', 'role', 'month', 'pulse', 'season', 'grow', 'join', 'apply'],
};
const CITIES = ['south-florida', 'orlando-north-central-florida', 'philadelphia', 'new-york', 'los-angeles'];
const MAX_BYTES = 12 * 1024 * 1024;

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

  const page = String(body.page || 'cm');
  const city = String(body.city || '');
  if (!PAGES[page] || !CITIES.includes(city)) return json({ error: 'bad_page_or_city' }, 400);

  if (body.action === 'list') {
    const { data } = await db.from('ve_onboarding_audio').select('clip_key, url, dur, source_name, updated_at').eq('page', page).eq('city_slug', city);
    return json({ clips: data || [] });
  }

  if (body.action === 'panels') {
    const { data } = await db.from('ve_onboarding_panels').select('clip_key, url, source_id, updated_at').eq('page', page).eq('city_slug', city);
    return json({ panels: data || [] });
  }

  if (body.action === 'set_panel') {
    const key = String(body.key || '');
    if (!PAGES[page].includes(key)) return json({ error: 'bad_key' }, 400);
    const source = String(body.source || '');
    let url = '';
    if (/^\/public\/[a-z0-9/_.-]+\.(png|jpe?g|webp)$/i.test(source)) {
      url = source;
    } else {
      let src: URL;
      try { src = new URL(source); } catch { return json({ error: 'bad_source' }, 400); }
      if (src.protocol !== 'https:' || !/\.cloudfront\.net$/.test(src.hostname)) return json({ error: 'bad_source' }, 400);
      const res = await fetch(src.toString());
      const type = (res.headers.get('content-type') || '').split(';')[0];
      if (!res.ok || !/^image\//.test(type)) return json({ error: 'fetch_failed' }, 502);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length > 8 * 1024 * 1024) return json({ error: 'too_large' }, 400);
      const ext = type.includes('webp') ? 'webp' : type.includes('png') ? 'png' : 'jpg';
      const path = `onboarding-audio/panels/${page}/${city}/${key}-${Date.now()}.${ext}`;
      const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: type, upsert: false });
      if (up.error) return json({ error: 'upload_failed', message: up.error.message }, 500);
      url = db.storage.from('vegan-media').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await db.from('ve_onboarding_panels').upsert({
      page, city_slug: city, clip_key: key, url, source_id: String(body.source_id || '').slice(0, 80) || null,
      updated_by: memberId, updated_at: new Date().toISOString(),
    }, { onConflict: 'page,city_slug,clip_key' });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, key, url });
  }

  if (body.action === 'upload') {
    const key = String(body.key || '');
    if (!PAGES[page].includes(key)) return json({ error: 'bad_key' }, 400);
    let bytes: Uint8Array;
    try {
      const bin = atob(String(body.audio_b64 || ''));
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch { return json({ error: 'bad_audio' }, 400); }
    if (bytes.length < 1000 || bytes.length > MAX_BYTES) return json({ error: 'bad_size' }, 400);
    if (String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WAVE') return json({ error: 'not_wav' }, 400);
    // A new name per upload so browsers and the CDN never serve an old take.
    const path = `onboarding-audio/${page}/${city}/sean/${key}-${Date.now()}.wav`;
    const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: 'audio/wav', upsert: false });
    if (up.error) return json({ error: 'upload_failed', message: up.error.message }, 500);
    const url = db.storage.from('vegan-media').getPublicUrl(path).data.publicUrl;
    const dur = Math.round(Number(body.dur || 0) * 10) / 10 || null;
    const { error } = await db.from('ve_onboarding_audio').upsert({
      page, city_slug: city, clip_key: key, url, dur, source_name: String(body.source_name || '').slice(0, 200) || null,
      uploaded_by: memberId, updated_at: new Date().toISOString(),
    }, { onConflict: 'page,city_slug,clip_key' });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, key, url, dur });
  }

  return json({ error: 'unknown_action' }, 400);
});
