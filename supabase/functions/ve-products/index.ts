// ve-products: scan a barcode, vote for a product within its brand, and pick products in a recipe (Sean, 2026-11-01: "a tab where
// they can scan an item... it should take them to its profile... vote for it within the brand. So you're not going to see the
// rankings anywhere except when you click on the brand itself... If the ingredient calls for coffee creamer... pick and choose which
// coffee creamer they want... save it"; "Could we also list the macros of the item?"). Migrations 20261101_product_barcodes_macros.sql
// and 20261101_recipe_ingredient_types.sql.
//
// POST { action: 'lookup', code }        anyone -> { found, gtin, status, name, nutrition, macros, product, brand }
//   Not ours: { found: false, gtin, off: {name, brand, image, macros, serving, ingredients, vegan}, brand: <our brand listing or null> }
//   from Open Food Facts (CC BY-SA), read live, nothing saved.
// POST { action: 'add', code, product_id?, note? }   active member -> { ok }   a pending ve_product_barcodes row (source member, what Open
//   Food Facts said), 20 a day; the team approves it in Depot > Venues > Barcodes.
// POST { action: 'votes', brand }        anyone -> { counts: {product_id: n}, mine: [product_id] }   brand = its listing id
// POST { action: 'vote', product_id, on } active member -> { ok, count }
// POST { action: 'picks', recipe_id }    member -> { picks: [{line, product_id, gtin}] }
// POST { action: 'pick', recipe_id, line, product_id|null, gtin? }  active member -> { ok }   the line must call for that product's type
// POST { action: 'tracker' }            member -> { scans, added, totals }   their scans and the products they added, newest first;
//   the Supermarket Guide's Tracker joins them with their aisle reports (ve-venues mine). Migration 20261101_product_tracker.sql.
// POST { action: 'barcode_queue' }       super admin -> { rows }
// POST { action: 'barcode_review', gtin, op: approve|reject, product_id? }  super admin -> { ok }
//
// Authorization: Bearer <ve_token> (the VE app token, checked the way ve-cookbook checks it).
// Ops: Bearer <LESARUSS_ADMIN_TOKEN> with as_member acts as that member.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const DAY_MS = 24 * 60 * 60 * 1000;
const ADD_CAP = 20;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
type Viewer = { id: string; active: boolean; admin: boolean } | null;
async function loadViewer(req: Request, body: any): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  let id = token ? await verifyToken(token) : null;
  // Ops: the admin token acting as a member (as ve-bounties does), for the team's checks.
  if (!id && token && /^[0-9a-f-]{36}$/.test(String(body?.as_member || ''))) {
    const { data: adm } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
    if (adm?.value && token === adm.value) id = String(body.as_member);
  }
  if (!id) return null;
  const { data: m } = await db.from('members').select('id, membership_status, is_superadmin').eq('id', id).maybeSingle();
  if (!m) return null;
  const admin = !!m.is_superadmin;
  let active = m.membership_status === 'active' || admin;
  if (!active) { const { data } = await db.rpc('ve_member_entitled', { p_member: m.id }).then((r) => r, () => ({ data: false })); active = !!data; }
  return { id: m.id, active, admin };
}

const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const gtin = (v: unknown) => { const d = String(v || '').replace(/\D/g, ''); return d.length >= 8 && d.length <= 14 ? d.padStart(14, '0') : null; };
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');

// Open Food Facts: what the package says, for a barcode we do not hold. Macros per serving when it gives a serving, else per 100 g.
async function offLookup(code: string) {
  const d = code.replace(/^0+(?=\d{12,13}$)/, '');
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${d}.json?fields=code,product_name,product_name_en,brands,image_front_small_url,image_front_url,nutriments,serving_size,serving_quantity,ingredients_text_en,ingredients_text,ingredients_analysis_tags,labels_tags`,
      { headers: { 'User-Agent': 'VegansExplore/1.0 (contact@lesaruss.com)' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    const p = j.product, n = p.nutriments || {};
    const perServ = n['energy-kcal_serving'] != null;
    const g = (k: string) => { const v = n[k + (perServ ? '_serving' : '_100g')]; return v == null || v === '' ? undefined : Math.round(Number(v) * 10) / 10; };
    const tags: string[] = p.ingredients_analysis_tags || [], labels: string[] = p.labels_tags || [];
    const vegan = labels.some((t) => /en:vegan/.test(t)) || tags.includes('en:vegan') ? 'yes' : tags.includes('en:non-vegan') ? 'no' : tags.includes('en:maybe-vegan') ? 'maybe' : 'unknown';
    // Sodium comes in grams: read it before rounding.
    const sRaw = n['sodium' + (perServ ? '_serving' : '_100g')], sodium = sRaw == null || sRaw === '' ? undefined : Number(sRaw);
    return {
      name: p.product_name_en || p.product_name || '', brand: String(p.brands || '').split(',')[0].trim(),
      image: p.image_front_url || p.image_front_small_url || null,
      serving: perServ ? (p.serving_size || 'per serving') : 'per 100 g',
      macros: g('energy-kcal') == null ? null : { cal: Math.round(g('energy-kcal')!), protein: g('proteins'), carbs: g('carbohydrates'), fat: g('fat'),
        fiber: g('fiber'), sugar: g('sugars'), sodium: sodium == null ? undefined : Math.round(sodium * 1000), serving: perServ ? (p.serving_size || '') : '100 g' },
      ingredients: p.ingredients_text_en || p.ingredients_text || '', vegan,
    };
  } catch { return null; }
}

// Our brand for a name Open Food Facts gives ("Silk", "OATLY!"): a listing that has products in our Guides.
async function brandFor(name: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!key) return null;
  const { data } = await db.from('ve_products').select('brand_listing_id, listings:brand_listing_id(id, slug, name, logo_url)').limit(500);
  const seen = new Set<string>();
  for (const r of (data || []) as any[]) {
    const l = r.listings; if (!l || seen.has(l.id)) continue; seen.add(l.id);
    const lk = String(l.name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const first = lk.split(' ').slice(0, 2).join(' ');
    if (lk === key || key.startsWith(first) || lk.startsWith(key)) return { id: l.id, slug: l.slug, name: l.name, logo_url: l.logo_url };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const viewer = await loadViewer(req, body);
  const needMember = () => !viewer ? json({ error: 'not_authenticated', message: 'Sign in first.' }, 401)
    : !viewer.active ? json({ error: 'payment_required', message: 'This is for Passport holders: $11, one time.' }, 402) : null;

  if (action === 'lookup') {
    const code = gtin(body.code);
    if (!code) return json({ error: 'bad_code', message: 'That does not look like a barcode.' }, 400);
    const { data } = await db.rpc('ve_barcode_lookup', { p_code: code });
    let out: any;
    if (data && data.found) out = data;
    else {
      const off = await offLookup(code);
      const brand = off?.brand ? await brandFor(off.brand) : null;
      out = { found: false, gtin: code, off, brand };
    }
    // The member's Tracker keeps every scan (the same barcode once every 10 minutes).
    if (viewer) {
      const { count } = await db.from('ve_product_scans').select('id', { count: 'exact', head: true }).eq('member_id', viewer.id).eq('gtin', code)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
      if (!count) await db.from('ve_product_scans').insert({ member_id: viewer.id, gtin: code, found: !!(data && data.found && data.status === 'live'),
        product_id: data?.product?.id || null, name: clean(out.found ? out.name : out.off?.name, 200) || null });
    }
    return json(out);
  }

  if (action === 'add') {
    const deny = needMember(); if (deny) return deny;
    const code = gtin(body.code);
    if (!code) return json({ error: 'bad_code' }, 400);
    const { count } = await db.from('ve_product_barcodes').select('gtin', { count: 'exact', head: true }).eq('added_by', viewer!.id).gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
    if ((count || 0) >= ADD_CAP) return json({ error: 'daily_limit', message: 'That is ' + ADD_CAP + ' for today. Thank you. Try again tomorrow.' }, 429);
    const { data: had } = await db.from('ve_product_barcodes').select('gtin, status').eq('gtin', code).maybeSingle();
    if (had) return json({ ok: true, already: had.status });
    const off = await offLookup(code);
    let productId: string | null = isId(body.product_id) ? body.product_id : null, brandId: string | null = null;
    if (productId) { const { data: p } = await db.from('ve_products').select('id, brand_listing_id').eq('id', productId).maybeSingle(); if (!p) productId = null; else brandId = p.brand_listing_id; }
    if (!brandId && off?.brand) brandId = (await brandFor(off.brand))?.id || null;
    const name = clean(off?.name || body.name, 200) || 'Scanned item ' + code;
    const { error } = await db.from('ve_product_barcodes').insert({
      gtin: code, product_id: productId, brand_listing_id: brandId, name, macros: off?.macros || null, ingredients: off?.ingredients || null,
      image_url: off?.image || null, source: 'member', status: 'pending', added_by: viewer!.id,
      note: [clean(body.note, 400), off ? 'Open Food Facts: ' + (off.brand || '?') + ', Vegan ' + off.vegan : 'Not on Open Food Facts'].filter(Boolean).join(' | '),
    });
    if (error) return json({ error: 'save_failed', message: 'That did not save. Try again.' }, 500);
    return json({ ok: true });
  }

  if (action === 'votes') {
    if (!isId(body.brand)) return json({ error: 'bad_brand' }, 400);
    const { data: prods } = await db.from('ve_products').select('id').eq('brand_listing_id', body.brand);
    const ids = (prods || []).map((p: any) => p.id);
    const counts: Record<string, number> = {}; const mine: string[] = [];
    if (ids.length) {
      const { data: v } = await db.from('ve_product_votes').select('product_id, member_id').in('product_id', ids);
      for (const r of (v || []) as any[]) { counts[r.product_id] = (counts[r.product_id] || 0) + 1; if (viewer && r.member_id === viewer.id) mine.push(r.product_id); }
    }
    return json({ counts, mine });
  }

  if (action === 'vote') {
    const deny = needMember(); if (deny) return deny;
    if (!isId(body.product_id)) return json({ error: 'bad_product' }, 400);
    const { data: p } = await db.from('ve_products').select('id').eq('id', body.product_id).maybeSingle();
    if (!p) return json({ error: 'not_found' }, 404);
    if (body.on === false) await db.from('ve_product_votes').delete().eq('product_id', p.id).eq('member_id', viewer!.id);
    else await db.from('ve_product_votes').upsert({ product_id: p.id, member_id: viewer!.id }, { onConflict: 'product_id,member_id', ignoreDuplicates: true });
    const { count } = await db.from('ve_product_votes').select('member_id', { count: 'exact', head: true }).eq('product_id', p.id);
    return json({ ok: true, count: count || 0, on: body.on !== false });
  }

  if (action === 'picks') {
    if (!viewer) return json({ picks: [] });
    if (!isId(body.recipe_id)) return json({ error: 'bad_recipe' }, 400);
    const { data } = await db.from('ve_recipe_picks').select('line, product_id, gtin').eq('member_id', viewer.id).eq('recipe_id', body.recipe_id);
    return json({ picks: data || [] });
  }

  if (action === 'pick') {
    const deny = needMember(); if (deny) return deny;
    const line = Number(body.line);
    if (!isId(body.recipe_id) || !Number.isInteger(line) || line < 0 || line >= 200) return json({ error: 'bad_input' }, 400);
    if (body.product_id == null) {
      await db.from('ve_recipe_picks').delete().eq('member_id', viewer!.id).eq('recipe_id', body.recipe_id).eq('line', line);
      return json({ ok: true, cleared: true });
    }
    if (!isId(body.product_id)) return json({ error: 'bad_product' }, 400);
    const { data: r } = await db.from('recipes').select('id, status, ingredient_types').eq('id', body.recipe_id).maybeSingle();
    if (!r || !['live', 'retesting'].includes(r.status)) return json({ error: 'not_found' }, 404);
    const want = Array.isArray(r.ingredient_types) ? r.ingredient_types[line] : null;
    const { data: p } = await db.from('ve_products').select('id, product_type').eq('id', body.product_id).maybeSingle();
    if (!p || !want || p.product_type !== want) return json({ error: 'wrong_type', message: 'That product does not fit this ingredient.' }, 400);
    let code = gtin(body.gtin);
    if (code) { const { data: b } = await db.from('ve_product_barcodes').select('gtin').eq('gtin', code).eq('product_id', p.id).eq('status', 'live').maybeSingle(); if (!b) code = null; }
    const { error } = await db.from('ve_recipe_picks').upsert({ member_id: viewer!.id, recipe_id: r.id, line, product_id: p.id, gtin: code, created_at: new Date().toISOString() },
      { onConflict: 'member_id,recipe_id,line' });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true });
  }

  if (action === 'tracker') {
    if (!viewer) return json({ error: 'not_authenticated' }, 401);
    const [sc, ad] = await Promise.all([
      db.from('ve_product_scans').select('gtin, found, name, created_at, product_id, ve_products(slug, name, product_type, listings:brand_listing_id(slug, name))')
        .eq('member_id', viewer.id).order('created_at', { ascending: false }).limit(300),
      db.from('ve_product_barcodes').select('gtin, name, status, points, created_at, reviewed_at, paid_at, product_id, ve_products(slug, name, product_type, listings:brand_listing_id(slug, name))')
        .eq('added_by', viewer.id).order('created_at', { ascending: false }).limit(300),
    ]);
    const prod = (p: any) => p ? { slug: p.slug, name: p.name || ((p.listings?.name || '') + ' ' + (p.product_type || '')).trim(), brand: p.listings?.name || null, brand_slug: p.listings?.slug || null } : null;
    const scans = (sc.data || []).map((r: any) => ({ gtin: r.gtin, found: r.found, name: r.name, at: r.created_at, product: prod(r.ve_products) }));
    const added = (ad.data || []).map((r: any) => ({ gtin: r.gtin, name: r.name, status: r.status, points: r.points || 0, at: r.created_at, reviewed_at: r.reviewed_at, product: prod(r.ve_products) }));
    return json({ scans, added, totals: { scans: scans.length, added: added.length, approved: added.filter((a) => a.status === 'live').length,
      points: added.reduce((n, a) => n + (a.points || 0), 0) } });
  }

  if (action === 'barcode_queue' || action === 'barcode_review') {
    if (!viewer?.admin) return json({ error: 'forbidden' }, 403);
    if (action === 'barcode_queue') {
      const { data } = await db.from('ve_product_barcodes').select('gtin, name, product_id, brand_listing_id, macros, ingredients, image_url, note, created_at, status')
        .eq('status', 'pending').order('created_at', { ascending: false }).limit(200);
      return json({ rows: data || [] });
    }
    const code = gtin(body.gtin);
    if (!code || !['approve', 'reject'].includes(body.op)) return json({ error: 'bad_input' }, 400);
    const patch: any = { status: body.op === 'approve' ? 'live' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: viewer.id };
    if (isId(body.product_id)) {
      const { data: p } = await db.from('ve_products').select('id, brand_listing_id').eq('id', body.product_id).maybeSingle();
      if (p) { patch.product_id = p.id; patch.brand_listing_id = p.brand_listing_id; }
    }
    if (body.op === 'approve' && !patch.product_id) {
      const { data: row } = await db.from('ve_product_barcodes').select('product_id').eq('gtin', code).maybeSingle();
      if (!row?.product_id) return json({ error: 'product_required', message: 'Pick the product it belongs to first.' }, 400);
    }
    const { error } = await db.from('ve_product_barcodes').update(patch).eq('gtin', code);
    if (error) return json({ error: 'save_failed' }, 500);
    // An approved product pays the member who added it, once (ref barcode:<gtin>); it shows on their Tracker.
    let paid = 0;
    if (body.op === 'approve') {
      const { data: row } = await db.from('ve_product_barcodes').select('added_by, paid_at').eq('gtin', code).maybeSingle();
      if (row?.added_by && !row.paid_at) {
        const { data: st } = await db.from('ve_site_settings').select('value').eq('key', 'product_barcode_points').maybeSingle();
        const amount = Math.max(0, Math.min(1000, Number(st?.value?.approved ?? 25)));
        if (amount) {
          const { error: gErr } = await db.rpc('ve_points_grant', { p_member: row.added_by, p_amount: amount, p_reason: 'barcode_add', p_ref: 'barcode:' + code });
          if (!gErr) { paid = amount; await db.from('ve_product_barcodes').update({ points: amount, paid_at: new Date().toISOString() }).eq('gtin', code); }
          else console.error('barcode points failed', gErr);
        }
      }
    }
    return json({ ok: true, points: paid });
  }

  return json({ error: 'unknown_action' }, 400);
});
