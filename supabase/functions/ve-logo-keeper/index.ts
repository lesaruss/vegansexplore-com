// ve-logo-keeper: every logo lives in our storage (Sean, 2026-10-27: "any logo that we pull, let's not use it from where it was
// hosted from. Let's make a copy of it immediately as part of the process once we've accepted it. That way nothing disappears").
// Every way a logo is saved already copies it (ve-discover logo_set, ve-claims owner photos, ve-media-library); this is the net
// under them: any listing whose logo_url is not in vegan-media (an import, a podcast's Apple cover, a hand edit) is copied to
// media/listings/<slug>/logo-copied-<date>-<id>.<ext>, the listing points at the copy, details.logo_copied_from keeps the old
// link, and a ve_listing_edits row (field logo) records it. A link that fails is left as it is, noted in details.logo_copy_error,
// and tried again after a day; nothing is ever cleared.
//
// POST { action: 'sweep', limit? }  the cron (x-cron-secret, hourly): up to 25 listings a run. Returns { copied, failed, left }.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SB = 'vegan-media';
const OURS = `${SUPABASE_URL}/storage/v1/object/public/${SB}/`;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const MAX = 8e6, DAY = 864e5;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

// The picture's type from its first bytes, not the server's word for it.
function sniff(b: Uint8Array): string {
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
  if (b[0] === 0x47 && b[1] === 0x49) return 'image/gif';
  const head = new TextDecoder().decode(b.subarray(0, 400)).toLowerCase();
  return head.includes('<svg') ? 'image/svg+xml' : '';
}

async function copyOne(l: any): Promise<string> {
  const from = String(l.logo_url);
  let bytes: Uint8Array;
  try {
    const r = await fetch(from, { headers: { 'User-Agent': UA, Accept: 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!r.ok) return 'answered ' + r.status;
    bytes = new Uint8Array(await r.arrayBuffer());
  } catch (e) { return String((e as Error)?.message || e).slice(0, 200); }
  if (!bytes.length || bytes.length > MAX) return 'empty or too large';
  const type = sniff(bytes); if (!type) return 'not a picture';
  const path = `media/listings/${l.slug}/logo-copied-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${EXT[type]}`;
  const { error } = await db.storage.from(SB).upload(path, bytes, { contentType: type, upsert: false });
  if (error) return 'upload: ' + error.message;
  const url = OURS + path, at = new Date().toISOString();
  const details = { ...(l.details || {}) } as Record<string, any>;
  details.logo_copied_from = { url: from.slice(0, 500), at };
  delete details.logo_copy_error;
  // Only if nobody changed the logo while we copied it.
  const { data: upd, error: e2 } = await db.from('listings').update({ logo_url: url, details, updated_at: at }).eq('id', l.id).eq('logo_url', from).select('id');
  if (e2 || !upd?.length) { await db.storage.from(SB).remove([path]); return e2 ? 'save: ' + e2.message : ''; }
  await db.from('ve_listing_edits').insert({ listing_id: l.id, field: 'logo', old_value: from, new_value: url, meta: { by: 've-logo-keeper', why: 'copied into our storage' } });
  return '';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const { data: cs } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
  const secret = req.headers.get('x-cron-secret');
  if (!secret || !cs?.value || secret !== cs.value) return json({ error: 'no_access' }, 403);
  let body: any = {}; try { body = await req.json(); } catch { /* empty */ }
  if (body.action !== 'sweep') return json({ error: 'unknown_action' }, 400);
  const limit = Math.max(1, Math.min(+body.limit || 25, 60));
  const { data: rows, error } = await db.from('listings').select('id, slug, logo_url, details')
    .not('logo_url', 'is', null).neq('logo_url', '').not('logo_url', 'like', OURS + '%').not('logo_url', 'like', '/%').limit(500);
  if (error) return json({ error: error.message }, 500);
  const due = (rows || []).filter((l: any) => /^https?:\/\//i.test(l.logo_url) && !(l.details?.logo_copy_error && Date.now() - Date.parse(l.details.logo_copy_error.at) < DAY));
  let copied = 0; const failed: { slug: string; why: string }[] = [];
  for (const l of due.slice(0, limit)) {
    const why = await copyOne(l);
    if (!why) { copied++; continue; }
    failed.push({ slug: l.slug, why });
    await db.from('listings').update({ details: { ...(l.details || {}), logo_copy_error: { why, at: new Date().toISOString() } } }).eq('id', l.id);
  }
  return json({ ok: true, copied, failed, left: Math.max(0, due.length - limit) });
});
