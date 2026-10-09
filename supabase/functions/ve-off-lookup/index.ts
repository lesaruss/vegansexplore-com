// ve-off-lookup: helpers for product pages (/products/<slug>) and store logos, created 2026-10-08 by Logan.
// Auth: Bearer LESARUSS_ADMIN_TOKEN. It never writes to the database; a person checks every picture first.
//   { action: 'img', urls: [...] (at most 25) }   -> { url: {type, b64} } so a picture can be looked at.
//   { action: 'save', items: [{url, path}] (25) } -> copies checked files into the public vegan-media bucket under
//                                                   media/logos/, media/products/, media/communities/ (city art) or
//                                                   media/brand-door/ (the For <Brand> tour: Maya's clips and posters,
//                                                   2026-10-09); pictures, and mp4 video for brand-door; returns URLs.
//   { run, brands: [[key, offBrandTag], ...] }     -> Open Food Facts lookups, one brand at a time (6 at most),
//                                                   saved to vegan-media/media/off/<run>.json.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FIELDS = 'code,product_name,brands,image_front_url,categories_tags,labels_tags,ingredients_analysis_tags,unique_scans_n';
const UA = 'Mozilla/5.0 (compatible; VegansExplore/1.0; +https://vegansexplore.com)';
const PATH = /^(logos|products|communities|brand-door)\/[a-z0-9-]+(\/[a-z0-9-]+)?\.(png|jpg|webp|svg|mp4)$/;

async function lookup(brands: [string, string][], gap: number) {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < brands.length; i++) {
    const [key, tag] = brands[i];
    if (!/^[a-z0-9-]+$/.test(String(tag))) { out[key] = { error: 'bad tag' }; continue; }
    const url = `https://world.openfoodfacts.org/api/v2/search?brands_tags=${tag}&countries_tags_en=united-states&page_size=50&sort_by=unique_scans_n&fields=${FIELDS}`;
    let res: unknown = { error: 'not fetched' };
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'VegansExplore/1.0 (vegansexplore.com)' } });
      res = r.ok ? await r.json() : { error: `off ${r.status}` };
    } catch (e) { res = { error: String((e as Error).message || e) }; }
    out[key] = res;
    if (i < brands.length - 1) await sleep(gap);
  }
  return out;
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: row } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!row?.value || supplied !== row.value) return json({ error: 'unauthorized' }, 401);
  const b = await req.json().catch(() => ({}));
  if (b.action === 'img') {
    const urls: string[] = (Array.isArray(b.urls) ? b.urls : []).slice(0, 25).filter((u: string) => /^https:\/\//.test(String(u)));
    const out: Record<string, unknown> = {};
    await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': UA } });
        const buf = new Uint8Array(await r.arrayBuffer());
        out[u] = r.ok && buf.length < 3_000_000 ? { type: r.headers.get('content-type'), b64: encodeBase64(buf) } : { error: `${r.status} ${buf.length}` };
      } catch (e) { out[u] = { error: String((e as Error).message || e) }; }
    }));
    return json(out);
  }
  if (b.action === 'save') {
    const items: { url: string; path: string }[] = (Array.isArray(b.items) ? b.items : []).slice(0, 25);
    const out: Record<string, unknown> = {};
    await Promise.all(items.map(async ({ url, path }) => {
      if (!/^https:\/\//.test(String(url)) || !PATH.test(String(path))) { out[path] = { error: 'bad url or path' }; return; }
      const video = String(path).endsWith('.mp4');
      if (video && !String(path).startsWith('brand-door/')) { out[path] = { error: 'video only under brand-door/' }; return; }
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA } });
        const type = (r.headers.get('content-type') || '').split(';')[0];
        const buf = new Uint8Array(await r.arrayBuffer());
        if (!r.ok || !(video ? type === 'video/mp4' : /^image\//.test(type)) || buf.length > (video ? 8_000_000 : 5_000_000)) { out[path] = { error: `${r.status} ${type} ${buf.length}` }; return; }
        const key = 'media/' + path;
        const { error } = await db.storage.from('vegan-media').upload(key, buf, { contentType: type, upsert: true, cacheControl: '86400' });
        out[path] = error ? { error: error.message } : { url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/vegan-media/${key}`, bytes: buf.length };
      } catch (e) { out[path] = { error: String((e as Error).message || e) }; }
    }));
    return json(out);
  }
  const run = String(b.run || '');
  if (!/^[a-z0-9-]{1,40}$/.test(run)) return json({ error: 'action img or save, or run must be a short slug' }, 400);
  const brands: [string, string][] = Array.isArray(b.brands) ? b.brands.slice(0, 6) : [];
  const out = await lookup(brands, Math.max(4000, Math.min(15000, Number(b.gap_ms) || 6500)));
  await db.storage.from('vegan-media').upload(`media/off/${run}.json`, new TextEncoder().encode(JSON.stringify(out)), { contentType: 'application/json', upsert: true });
  return json({ done: true });
});
