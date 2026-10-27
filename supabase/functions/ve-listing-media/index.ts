// ve-listing-media: what a book or a film is, for its Directory card (Sean, 2026-10-27: "documentary... put the year it came out...
// books... sorting it by the type of book. Is it a cookbook? Is it a biography? Is it educational?"). The listing editor's About the
// work (/public/ve-listing-admin.js) saves listings.details.release_year and details.book_type here, because ve-claims admin_listing
// does not hold details. It also saves a health professional's practice, details.health_type (Sean, 2026-10-27: "doctors,
// dentists, and that could have its own sub menu"). A super admin only; each change is a ve_listing_edits row with the value it replaced.
//
// POST { action: 'save', listing_id, release_year?: '2018' | '', book_type?: cookbook|memoir|educational|health|lifestyle|children|'' }
//      { action: 'save', listing_id, health_type: doctor|dentist|dietitian|chiropractor|therapist|other|'' }  (Health Professionals)
//      -> { ok, release_year, book_type, health_type }
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Keep in step with BOOK_TYPES in /public/ve-region-directory.js and /public/ve-listing-admin.js.
const BOOK_TYPES = ['cookbook', 'memoir', 'educational', 'health', 'lifestyle', 'children'];
const WORKS = ['Books', 'Documentaries & Films'];
// Keep in step with HEALTH_TYPES in /public/ve-region-directory.js and /public/ve-listing-admin.js.
const HEALTH_TYPES = ['doctor', 'dentist', 'dietitian', 'chiropractor', 'therapist', 'other'];

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
async function hmacKey(use: 'sign' | 'verify') {
  const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
}
async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    if (!(await crypto.subtle.verify('HMAC', await hmacKey('verify'), b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const claims = token ? await verifyToken(token) : null;
  if (!claims) return json({ error: 'sign_in' }, 401);
  const { data: admin } = await db.from('members').select('id, name, is_superadmin').eq('id', claims.sub).maybeSingle();
  if (!admin?.is_superadmin) return json({ error: 'forbidden' }, 403);

  if (body.action === 'save') {
    if (!isId(body.listing_id)) return json({ error: 'bad_request' }, 400);
    const { data: l } = await db.from('listings').select('id, category, details').eq('id', body.listing_id).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    const health = l.category === 'Health Professionals';
    if (!WORKS.includes(l.category) && !health) return json({ error: 'not_a_work' }, 400);
    const details = { ...(l.details || {}) } as Record<string, unknown>;
    const edits: { field: string; old_value: unknown; new_value: unknown }[] = [];
    if (body.health_type !== undefined && health) {
      const t = String(body.health_type ?? '');
      if (t && !HEALTH_TYPES.includes(t)) return json({ error: 'bad_health_type' }, 400);
      if ((details.health_type || '') !== t) { edits.push({ field: 'health_type', old_value: details.health_type ?? null, new_value: t || null }); if (t) details.health_type = t; else delete details.health_type; }
    }
    if (body.release_year !== undefined && !health) {
      const y = String(body.release_year ?? '').trim();
      if (y && !(/^(18|19|20)\d{2}$/.test(y) && +y <= new Date().getFullYear() + 1)) return json({ error: 'bad_year' }, 400);
      if (String(details.release_year ?? '') !== y) { edits.push({ field: 'release_year', old_value: details.release_year ?? null, new_value: y || null }); if (y) details.release_year = y; else delete details.release_year; }
    }
    if (body.book_type !== undefined && l.category === 'Books') {
      const t = String(body.book_type ?? '');
      if (t && !BOOK_TYPES.includes(t)) return json({ error: 'bad_book_type' }, 400);
      if ((details.book_type || '') !== t) { edits.push({ field: 'book_type', old_value: details.book_type ?? null, new_value: t || null }); if (t) details.book_type = t; else delete details.book_type; }
    }
    if (edits.length) {
      const { error } = await db.from('listings').update({ details, updated_at: new Date().toISOString() }).eq('id', l.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      await db.from('ve_listing_edits').insert(edits.map((e) => ({ listing_id: l.id, member_id: admin.id, ...e, meta: { by: 'admin', where: 'listing_editor' } })));
    }
    return json({ ok: true, release_year: details.release_year || null, book_type: details.book_type || null, health_type: details.health_type || null });
  }

  return json({ error: 'unknown_action' }, 400);
});
