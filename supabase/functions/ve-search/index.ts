// ve-search: universal search (Sean, 2026-11-02, playbook ve-universal-search). One box that reads a sentence ("vegan restaurants in
// Claremont", "egg substitute", "vegan doctor near me"), finds the place and the kind of thing, and returns what fits, nearest first.
// The engine is the database function ve_search(q, lat, lng, limit, brand); its vocabulary, places and log are rows per brand, so a
// new brand adds rows, never code. Public (no sign-in), verify_jwt off.
//
// POST { q, lat?, lng?, limit?, content?, content_limit?, brand?, log?, visitor? } -> { q, interpretation, nearest_fallback, nearest_km, nearest_city, total, results }
//   store: present when the sentence names a store (data.store: {store:{name,slug}, mode: type|all|unknown_item, term, thing, total, items, store_mapped}).
//   log: true on a search the visitor sent (Enter or a pick), never on each keystroke. The log keeps the words, the place read, whether
//   anything came back and how far the nearest was: no names, no emails (visitor is a random id from the browser, or empty).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { handleAdmin } from './admin.ts';

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
  // Depot > Search questions (super admin token): the queue a person works, and the answer email.
  if (['q_list', 'q_get', 'q_set', 'q_notify', 'q_setting'].includes(String(b.action || ''))) {
    return handleAdmin(b, req, db, json, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, async (k: string) => { const e = Deno.env.get(k); if (e) return e; const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle(); return data?.value && data.value !== 'pending' ? String(data.value) : null; });
  }
  // Ask (Sean, 2026-11-03): a question we could not answer goes in the queue; an email is optional and used only to write back the answer.
  if (b.action === 'ask') {
    const r = await db.rpc('ve_search_ask', { p_q: q, p_email: typeof b.email === 'string' ? b.email.slice(0, 200) : null, p_visitor: typeof b.visitor === 'string' ? b.visitor.slice(0, 40) : null, p_brand: BRANDS.includes(b.brand) ? b.brand : 'vegans-explore' });
    if (r.error) return json({ error: 'ask_failed' }, 500);
    if (r.data?.error === 'rate_limited') return json(r.data, 429);
    return json(r.data);
  }
  if (q.length < 2) return json({ q, interpretation: { labels: [] }, results: [], total: 0 });
  const brand = BRANDS.includes(b.brand) ? b.brand : 'vegans-explore';
  const lat = num(b.lat), lng = num(b.lng);
  if ((lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) return json({ error: 'bad_location' }, 400);
  const limit = Math.max(1, Math.min(Number(b.limit) || 20, 50));

  // Listings and content are asked together: places and things from the Directory, then moments, episodes and other shows.
  const wantContent = b.content !== false && q.length >= 3;
  const climit = Math.max(1, Math.min(Number(b.content_limit) || 6, 12));
  const [listing, content, store] = await Promise.all([
    db.rpc('ve_search', { p_q: q, p_lat: lat, p_lng: lng, p_limit: limit, p_brand: brand }),
    wantContent ? db.rpc('ve_search_content', { p_q: q, p_limit: climit, p_brand: brand }) : Promise.resolve({ data: null, error: null }),
    // A store and a thing in one sentence ("does Walmart carry vegan ice cream"): what we hold for that store, or Not confirmed yet.
    brand === 'vegans-explore' ? db.rpc('ve_search_store', { p_q: q, p_limit: 12 }) : Promise.resolve({ data: null, error: null }),
  ]);
  if (listing.error) return json({ error: 'search_failed' }, 500);
  const data = listing.data;
  if (store.data && !store.error) { data.store = store.data; }
  else if (content.data && !content.error) data.content = content.data;
  const cn = !data.store && content.data ? ['moments', 'episodes', 'shows'].reduce((n, k) => n + (Array.isArray(content.data[k]) ? content.data[k].length : 0), 0) : 0;

  if (b.log === true) {
    const it = data?.interpretation ?? {};
    const labels: string[] = Array.isArray(it.labels) ? it.labels : [];
    const cl: string[] = Array.isArray(content.data?.intent?.labels) ? content.data.intent.labels : [];
    // Never wait on the log, and never fail a search over it.
    db.from('ve_search_log').insert({
      brand, q: String(data?.q ?? q).slice(0, 120), place: it.place?.name ?? null, intent: [...labels, ...(data.store ? ['store: ' + data.store.store?.name + ' / ' + (data.store.term || data.store.thing || 'all')] : cl.map((x) => 'topic: ' + x))].join(', ') || null,
      results: Number(data?.total ?? 0) + cn + (data.store ? Number(data.store.total ?? 0) : 0), zero: (Number(data?.total ?? 0) + cn + (data.store ? Number(data.store.total ?? 0) : 0)) === 0, nearest_km: data?.nearest_km ?? null,
      visitor: typeof b.visitor === 'string' ? b.visitor.slice(0, 40) : null,
    }).then(() => {}, () => {});
    // A search with nothing back is a question for our team: queue it once, whoever asks.
    if (Number(data?.total ?? 0) + cn + (data.store ? Number(data.store.total ?? 0) : 0) === 0) {
      db.rpc('ve_search_ask', { p_q: q, p_email: null, p_visitor: typeof b.visitor === 'string' ? b.visitor.slice(0, 40) : null, p_brand: brand }).then(() => {}, () => {});
    }
  }
  return json(data);
});
