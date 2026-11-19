// ve-vimeo: post our own videos to the Lesaruss Media Vimeo account (Sean, 2026-11-19: "I have a Vimeo account that we should connect so
// you can create links and upload"). Vimeo pulls the file from our public storage, so no video passes through here. The token is read
// server side from lesaruss_secrets (VIMEO_ACCESS_TOKEN, HQ Key Room) and never returned.
// Auth: Bearer LESARUSS_ADMIN_TOKEN. Body:
//   { action: 'upload', link, name, description? }        -> { uri, link } (public, embeddable)
//   { action: 'thumbnail', video_uri, image_url }          -> sets that picture as the video's active thumbnail
//   { action: 'status', video_uri }                        -> upload and transcode status, link, active picture
//   { action: 'update', video_uri, name?, description? }   -> edits the title or description
// link and image_url must be our own files (vegan-media storage or vegansexplore.com).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const API = 'https://api.vimeo.com';
const OURS = ['https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/', 'https://vegansexplore.com/'];
const ours = (u: string) => OURS.some((p) => u.startsWith(p)) && !u.includes('..');
const okUri = (u: string) => /^\/videos\/\d+$/.test(u);

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rows } = await db.from('lesaruss_secrets').select('key,value').in('key', ['LESARUSS_ADMIN_TOKEN', 'VIMEO_ACCESS_TOKEN']);
  const sec: Record<string, string> = {}; (rows || []).forEach((r: any) => { sec[r.key] = r.value; });
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!sec.LESARUSS_ADMIN_TOKEN || supplied !== sec.LESARUSS_ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401);
  if (!sec.VIMEO_ACCESS_TOKEN || sec.VIMEO_ACCESS_TOKEN.startsWith('pending')) return json({ error: 'VIMEO_ACCESS_TOKEN not set' }, 500);
  const hdr = { Authorization: `bearer ${sec.VIMEO_ACCESS_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/vnd.vimeo.*+json;version=3.4' };
  const call = async (method: string, path: string, body?: unknown) => {
    const r = await fetch(path.startsWith('http') ? path : API + path, { method, headers: hdr, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`vimeo ${r.status}: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : {};
  };
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'upload') {
      const link = String(b.link || ''), name = String(b.name || '').slice(0, 128);
      if (!ours(link) || !name) return json({ error: 'need name and a link to our own file' }, 400);
      const v = await call('POST', '/me/videos', {
        upload: { approach: 'pull', link }, name, description: String(b.description || '').slice(0, 5000),
        privacy: { view: 'anybody', embed: 'public', download: false },
      });
      return json({ uri: v.uri, link: v.link, upload_status: v.upload?.status });
    }
    if (b.action === 'thumbnail') {
      const uri = String(b.video_uri || ''), img = String(b.image_url || '');
      if (!okUri(uri) || !ours(img)) return json({ error: 'need video_uri and an image of our own' }, 400);
      const pic = await call('POST', `${uri}/pictures`, {});
      const bytes = new Uint8Array(await (await fetch(img)).arrayBuffer());
      const put = await fetch(pic.link, { method: 'PUT', headers: { 'Content-Type': img.endsWith('.png') ? 'image/png' : 'image/jpeg' }, body: bytes });
      if (!put.ok) return json({ error: `picture upload ${put.status}` }, 502);
      await call('PATCH', pic.uri, { active: true });
      return json({ picture: pic.uri, bytes: bytes.length });
    }
    if (b.action === 'status') {
      const uri = String(b.video_uri || '');
      if (!okUri(uri)) return json({ error: 'need video_uri' }, 400);
      const v = await call('GET', `${uri}?fields=uri,name,link,status,upload.status,transcode.status,duration,width,height,pictures.uri,pictures.active,pictures.base_link,privacy.view`);
      return json(v);
    }
    if (b.action === 'update') {
      const uri = String(b.video_uri || '');
      if (!okUri(uri)) return json({ error: 'need video_uri' }, 400);
      const patch: Record<string, string> = {};
      if (b.name) patch.name = String(b.name).slice(0, 128);
      if (b.description != null) patch.description = String(b.description).slice(0, 5000);
      const v = await call('PATCH', uri, patch);
      return json({ uri: v.uri, link: v.link, name: v.name });
    }
    return json({ error: 'action must be upload, thumbnail, status or update' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 502);
  }
});
