// ve-pulse-cover: saves a cover picture onto a Daily Post DRAFT (Sean, 2026-09-27: yes to covers made for
// News Desk drafts). The Dispatcher Worker routine makes the picture with Higgsfield, then calls this
// through SQL (net.http_post with x-cron-secret). This copies the image into our own storage
// (vegan-media/library/covers/), because the Daily Post only publishes covers stored there, and sets it
// as the draft's thumbnail. Drafts only: a published piece is never touched.
//
// POST { pulse_id, image_url, license?, credit?, source_page_url?, listing_id? }   x-cron-secret: <CRON_SECRET>
//
// Real photos (Sean, 2026-09-29, BOSS "source reliable photos"): license says what lets us use the
// picture. The writer may only claim what it can show: 'illustration' (the default, a picture we
// made), 'press_kit' (the business's own press or media page says media may use it) or
// 'open_license' (Creative Commons or similar). Those two need the credit line and the https page
// that grants the use. 'permission' and 'owner_upload' are for people in the Depot, never the writer.
// listing_id says which Directory business the piece is about.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MAX = 8 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const { data: s } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
  if (!s?.value || req.headers.get('x-cron-secret') !== s.value) return json({ error: 'unauthorized' }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const id = String(body.pulse_id || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
  const { data: piece } = await db.from('ve_pulse_content').select('id, status').eq('id', id).eq('origin', 'depot').maybeSingle();
  if (!piece) return json({ error: 'not_found' }, 404);
  if (piece.status !== 'draft') return json({ error: 'not_a_draft' }, 409);

  const license = String(body.license || 'illustration');
  if (!['illustration', 'press_kit', 'open_license'].includes(license)) return json({ error: 'bad_license' }, 400);
  const credit = String(body.credit || '').replace(/[<>]/g, '').trim().slice(0, 160) || null;
  const page = String(body.source_page_url || '').trim();
  if (license !== 'illustration' && (!credit || !/^https:\/\/[^\s<>"]+$/i.test(page))) return json({ error: 'needs_credit_and_page' }, 400);
  const listing = /^[0-9a-f-]{36}$/.test(String(body.listing_id || '')) ? String(body.listing_id) : null;

  let u: URL;
  try { u = new URL(String(body.image_url || '')); } catch { return json({ error: 'bad_url' }, 400); }
  if (u.protocol !== 'https:' || /^(localhost|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname)) return json({ error: 'bad_url' }, 400);
  let r: Response;
  try { r = await fetch(u.href, { redirect: 'follow', signal: AbortSignal.timeout(20000) }); } catch { return json({ error: 'fetch_failed' }, 502); }
  if (!r.ok) return json({ error: 'fetch_failed', status: r.status }, 502);
  const mime = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!EXT[mime]) return json({ error: 'not_an_image', mime }, 400);
  const bytes = new Uint8Array(await r.arrayBuffer());
  if (bytes.length > MAX) return json({ error: 'too_large' }, 400);

  const path = `library/covers/${id}-${Date.now()}.${EXT[mime]}`;
  const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: mime, upsert: true });
  if (up.error) return json({ error: 'upload_failed', message: up.error.message }, 500);
  const url = db.storage.from('vegan-media').getPublicUrl(path).data.publicUrl;
  // A real photo goes in the Library first, with where it came from, so it can be used again and
  // the database's cover trigger reads its credit from there.
  if (license !== 'illustration') {
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((b) => b.toString(16).padStart(2, '0')).join('');
    await db.from('ve_media_library').upsert({ sha256: sha, kind: 'image', mime, url, thumb_url: url, bytes: bytes.length, source_name: credit, credit, license, source_page_url: page.slice(0, 500) }, { onConflict: 'sha256', ignoreDuplicates: true });
  }
  // cover_license and cover_credit set here win over the database's default for library/covers/.
  const patch: Record<string, unknown> = { thumbnail_url: url, cover_license: license, cover_credit: license === 'illustration' ? null : credit, updated_at: new Date().toISOString() };
  if (listing) { patch.business_listing_id = listing; patch.names_business = true; }
  const { error } = await db.from('ve_pulse_content').update(patch).eq('id', id).eq('status', 'draft');
  if (error) return json({ error: 'save_failed', message: error.message }, 500);
  return json({ ok: true, thumbnail_url: url, license, credit: patch.cover_credit });
});
