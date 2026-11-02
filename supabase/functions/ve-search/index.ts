// ve-search: universal search (Sean, 2026-11-02, playbook ve-universal-search). One box that reads a sentence ("vegan restaurants in
// Claremont", "egg substitute", "vegan doctor near me"), finds the place and the kind of thing, and returns what fits, nearest first.
// The engine is the database function ve_search(q, lat, lng, limit, brand); its vocabulary, places and log are rows per brand, so a
// new brand adds rows, never code. Public (no sign-in), verify_jwt off.
//
// POST { q, lat?, lng?, limit?, brand?, log?, visitor? } -> { q, interpretation, nearest_fallback, nearest_km, nearest_city, total, results }
//   log: true on a search the visitor sent (Enter or a pick), never on each keystroke. The log keeps the words, the place read, whether
//   anything came back and how far the nearest was: no names, no emails (visitor is a random id from the browser, or empty).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const BRANDS = ['vegans-explore'];
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const q = String(b.q ?? '').slice(0, 120).trim();
  if (q.length < 2) return json({ q, interpretation: { labels: [] }, results: [], total: 0 });
  const brand = BRANDS.includes(b.brand) ? b.brand : 'vegans-explore';
  const lat = num(b.lat), lng = num(b.lng);
  if ((lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) return json({ error: 'bad_location' }, 400);
  const limit = Math.max(1, Math.min(Number(b.limit) || 20, 50));

  const { data, error } = await db.rpc('ve_search', { p_q: q, p_lat: lat, p_lng: lng, p_limit: limit, p_brand: brand });
  if (error) return json({ error: 'search_failed' }, 500);

  if (b.log === true) {
    const it = data?.interpretation ?? {};
    const labels: string[] = Array.isArray(it.labels) ? it.labels : [];
    // Never wait on the log, and never fail a search over it.
    db.from('ve_search_log').insert({
      brand, q: String(data?.q ?? q).slice(0, 120), place: it.place?.name ?? null, intent: labels.join(', ') || null,
      results: Number(data?.total ?? 0), zero: !Number(data?.total ?? 0), nearest_km: data?.nearest_km ?? null,
      visitor: typeof b.visitor === 'string' ? b.visitor.slice(0, 40) : null,
    }).then(() => {}, () => {});
  }
  return json(data);
});
