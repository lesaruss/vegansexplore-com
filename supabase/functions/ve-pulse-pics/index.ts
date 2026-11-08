// ve-pulse-pics: a picture for each story in a Daily Pulse briefing (Sean, 2026-11-08: "It's just a bunch of text for the pulse.
// People need to feel like this is an actual newsletter... Yeah, let's definitely add pictures. Let me see how it looks before we
// push it out everywhere"). Playbook ve-daily-pulse.
// For each story with no picture yet it reads the story's own page, takes the picture the page names for link previews
// (og:image, else twitter:image), copies it into vegan-media/media/pulse/stories/ (never hot-linked) and saves its address on the
// story as `image` (briefing.stories[n].image). A page with no preview picture, or one that turns us away, is left with none.
// Auth: Bearer LESARUSS_ADMIN_TOKEN (ops). { action: 'post', id: <ve_board_posts id>, redo?: true }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX = 8_000_000;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

async function sha(s: string) {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
}
function metaImage(html: string, base: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const pick = (names: string[]) => {
    for (const t of tags) {
      const key = (t.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1]?.toLowerCase();
      if (!key || !names.includes(key)) continue;
      const c = (t.match(/\bcontent\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (c) return c.replace(/&amp;/g, '&');
    }
    return '';
  };
  const u = pick(['og:image:secure_url', 'og:image', 'og:image:url']) || pick(['twitter:image', 'twitter:image:src']);
  if (!u) return '';
  try { return new URL(u, base).toString(); } catch { return ''; }
}
async function timed(url: string, init: RequestInit = {}, ms = 12000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...init, signal: ac.signal, redirect: 'follow' }); } finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: row } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!row?.value || supplied !== row.value) return json({ error: 'unauthorized' }, 401);
  const b = await req.json().catch(() => ({}));
  if (b.action !== 'post' || !/^[0-9a-f-]{36}$/.test(String(b.id || ''))) return json({ error: 'bad_request' }, 400);
  const { data: post } = await db.from('ve_board_posts').select('id, briefing').eq('id', b.id).maybeSingle();
  if (!post?.briefing) return json({ error: 'not_found' }, 404);
  const br = post.briefing as any;
  const stories: any[] = Array.isArray(br.stories) ? br.stories : [];
  const results: any[] = [];
  for (const s of stories) {
    if (s.image && !b.redo) { results.push({ title: s.title, kept: s.image }); continue; }
    const url = String(s.url || '');
    if (!/^https?:\/\//.test(url)) { results.push({ title: s.title, none: 'no link' }); continue; }
    try {
      const r = await timed(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (!r.ok) { results.push({ title: s.title, none: `page ${r.status}` }); continue; }
      const html = (await r.text()).slice(0, 600_000);
      const img = metaImage(html, r.url || url);
      if (!img) { results.push({ title: s.title, none: 'no preview picture' }); continue; }
      const ir = await timed(img, { headers: { 'User-Agent': UA, Referer: url } });
      const type = (ir.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const buf = new Uint8Array(await ir.arrayBuffer());
      if (!ir.ok || !EXT[type] || buf.length < 2000 || buf.length > MAX) { results.push({ title: s.title, none: `picture ${ir.status} ${type} ${buf.length}` }); continue; }
      const path = `media/pulse/stories/${await sha(img)}.${EXT[type]}`;
      const up = await db.storage.from('vegan-media').upload(path, buf, { contentType: type, upsert: true, cacheControl: '31536000' });
      if (up.error) { results.push({ title: s.title, none: 'upload ' + up.error.message }); continue; }
      s.image = db.storage.from('vegan-media').getPublicUrl(path).data.publicUrl;
      s.image_from = img;
      results.push({ title: s.title, image: s.image });
    } catch (e) { results.push({ title: s.title, none: String((e as Error).message || e).slice(0, 120) }); }
  }
  br.stories = stories;
  const { error } = await db.from('ve_board_posts').update({ briefing: br }).eq('id', post.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, results });
});
