// ve-discover: finding Vegan places for the Directory (Sean, 2026-10-10: "Can the scan also look for new Vegan restaurants
// as well?" then "Go, start with the backlog"). Step one is the hidden backlog: about 2,970 listings quarantined since the
// May and June imports, never reviewed (migration 20261010_ve_backlog_checks.sql, table ve_backlog_checks). Each is checked
// and sorted; nothing is listed until Sean (or a Community Manager) decides in Depot > Business outreach > New places.
//
// POST { action: 'backlog_run', ig?, google? }   cron or ops -> { checked, left }   one Instagram batch and one Google batch
// POST { action: 'backlog_summary' }              super admin or ops -> { counts by verdict and city, left }
// POST { action: 'backlog_list', verdict, city?, q?, offset? }  super admin -> { rows, total }
// POST { action: 'backlog_decide', listing_id, decision: list|hide, category?, vegan_status?, note? }  super admin
//      list: the listing goes public with what Google gave (address, place id, website) and the category and Vegan status
//      picked on purpose (a new listing is never 100% Vegan by default); hide: it is set aside as rejected, never deleted.
//
// Sources: Google Places API (New) text search (GOOGLE_PLACES_API_KEY) and Apify's Instagram profile scraper
// (APIFY_API_TOKEN). Ops is the LESARUSS_ADMIN_TOKEN or the cron's x-cron-secret. verify_jwt is false: the VE app token is
// HMAC-checked here the same way ve-cookbook checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH = { ig: 40, google: 25, parallel: 5 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

// ---- Who is asking ----
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
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}
async function caller(req: Request): Promise<{ ops: boolean; admin: { id: string; name: string } | null }> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); if (cs && cron === cs) return { ops: true, admin: null }; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ops: false, admin: null };
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token === ops) return { ops: true, admin: null };
  const id = await verifyToken(token);
  if (!id) return { ops: false, admin: null };
  const { data: m } = await db.from('members').select('id, name, is_superadmin').eq('id', id).maybeSingle();
  return { ops: false, admin: m?.is_superadmin ? { id: m.id, name: String(m.name || 'Admin').split(/\s+/)[0] } : null };
}

// ---- Words ----
const STOP = new Set(['the', 'and', 'cafe', 'restaurant', 'kitchen', 'vegan', 'llc', 'inc', 'co', 'bar', 'grill', 'eatery', 'food', 'foods', 'plant', 'based', 'company']);
const words = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const overlap = (a: string[], b: string[]) => a.filter((w) => b.includes(w)).length;
const norm = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
const domain = (u: string) => { try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const VEGAN_RE = /\b(vegan|plant[- ]?based|100% plant)\b/i;
const FOOD_TYPE_RE = /restaurant|cafe|bakery|food|meal_|juice|grocery|supermarket|ice_cream|dessert|coffee|deli|^bar$|catering|market|bistro|diner|pizza|sandwich|confectioner|tea_house|brunch|breakfast/;
const FOOD_WORD_RE = /restaurant|caf[eé]|bakery|food|juice|grocer|market|kitchen|catering|caterer|chef|meal|dessert|ice cream|donut|pizza|deli|coffee|tea|smoothie|bistro|eatery|taco|burger|vegan (restaurant|bakery|cafe)|food truck|personal chef/i;
const handleOf = (v: string) => {
  let s = String(v || '').trim();
  const m = s.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  s = (m ? m[1] : s).replace(/^@+/, '').split(/[\s,—–\/|]+/)[0].replace(/[^A-Za-z0-9._]+$/g, '').replace(/^[^A-Za-z0-9._]+/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s.toLowerCase() : '';
};

// ---- Cities we serve (ve_outreach_cities) ----
let CITIES: any[] | null = null;
async function cities() {
  if (!CITIES) { const { data } = await db.from('ve_outreach_cities').select('community_slug, name, cities, states').neq('community_slug', 'brands'); CITIES = data || []; }
  return CITIES;
}
async function communityOf(city: string, state: string) {
  return (await cities()).find((c: any) => (!c.cities || c.cities.includes(city)) && (!c.states || c.states.includes(state)))?.community_slug || null;
}
// A city named in an Instagram bio or post locations, from the cities we serve.
async function cityIn(text: string): Promise<string | null> {
  const t = ` ${String(text || '').toLowerCase()} `;
  for (const c of await cities()) for (const n of (c.cities || [])) if (t.includes(` ${String(n).toLowerCase()}`) || t.includes(`${String(n).toLowerCase()},`)) return n;
  if (/\b(miami|south florida|sofl|fort lauderdale|broward|palm beach)\b/.test(t)) return 'South Florida';
  if (/\b(nyc|new york|brooklyn|queens|bronx|harlem)\b/.test(t)) return 'New York';
  if (/\b(atlanta|atl)\b/.test(t)) return 'Atlanta';
  if (/\b(los angeles|\bla\b|hollywood ca)\b/.test(t)) return 'Los Angeles';
  if (/\b(orlando)\b/.test(t)) return 'Orlando';
  return null;
}

// ---- Google Places ----
const FIELDS = ['id', 'displayName', 'formattedAddress', 'addressComponents', 'location', 'businessStatus', 'primaryType', 'primaryTypeDisplayName', 'types',
  'googleMapsUri', 'websiteUri', 'nationalPhoneNumber', 'rating', 'userRatingCount', 'editorialSummary'];
async function findPlace(name: string, where: string, site: string, state = '') {
  const key = await secret('GOOGLE_PLACES_API_KEY');
  if (!key) throw new Error('no Google key');
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS.map((f) => 'places.' + f).join(',') },
    body: JSON.stringify({ textQuery: `${name} ${where}`.replace(/\s+/g, ' ').trim(), maxResultCount: 5 }),
  });
  if (!r.ok) throw new Error(`places ${r.status}`);
  const all = ((await r.json()).places || []) as any[];
  // A name search can land in another state (Inca Chicken in Hollywood, FL matched one in Maryland): keep only our state.
  const st = /^(fl|florida)$/i.test(state) ? 'FL' : state.length === 2 ? state.toUpperCase() : '';
  const places = st ? all.filter((p) => (p.addressComponents || []).some((c: any) => (c.types || []).includes('administrative_area_level_1') && String(c.shortText).toUpperCase() === st)) : all;
  const want = words(name), dom = domain(site);
  // Their own website is the surest match; otherwise a real word of the name in Google's name.
  return places.find((p) => dom && domain(p.websiteUri || '') === dom)
    || places.find((p) => want.length && overlap(want, words(p.displayName?.text || '')) >= Math.min(2, want.length)) || null;
}
const comp = (p: any, t: string, short = false) => (p?.addressComponents || []).find((c: any) => (c.types || []).includes(t))?.[short ? 'shortText' : 'longText'] || '';
const placeSummary = (p: any) => p ? {
  id: p.id, name: p.displayName?.text, address: p.formattedAddress, status: p.businessStatus || 'OPERATIONAL', type: p.primaryType || null,
  type_name: p.primaryTypeDisplayName?.text || null, types: (p.types || []).slice(0, 8), maps: p.googleMapsUri, website: p.websiteUri || null,
  phone: p.nationalPhoneNumber || null, rating: p.rating ?? null, reviews: p.userRatingCount ?? 0, summary: p.editorialSummary?.text || null,
  street: [comp(p, 'street_number'), comp(p, 'route')].filter(Boolean).join(' '), city: comp(p, 'locality') || comp(p, 'sublocality') || comp(p, 'postal_town'),
  state: comp(p, 'administrative_area_level_1', true), zip: comp(p, 'postal_code'), country: comp(p, 'country', true),
  lat: p.location?.latitude ?? null, lng: p.location?.longitude ?? null,
} : null;

// Is this the same business as a public listing?
async function duplicateOf(l: any, place: any, handle: string): Promise<string | null> {
  if (place?.id) { const { data } = await db.from('listings').select('id').eq('status', 'approved').eq('google_place_id', place.id).limit(1); if (data?.[0]) return data[0].id; }
  if (handle) {
    const { data } = await db.from('listings').select('id').eq('status', 'approved').or(`ig_handle.ilike.${handle},instagram.ilike.${handle},instagram.ilike.%instagram.com/${handle}%`).limit(1);
    if (data?.[0]) return data[0].id;
  }
  const city = place?.city || l.address_city;
  if (city) {
    const { data } = await db.from('listings').select('id, name').eq('status', 'approved').eq('address_city', city).ilike('name', `%${String(l.name || '').replace(/[%_,()]/g, ' ').trim().slice(0, 40)}%`).limit(5);
    const hit = (data || []).find((x: any) => norm(x.name) === norm(l.name) || (place?.name && norm(x.name) === norm(place.name)));
    if (hit) return hit.id;
  }
  // Renamed: Google's name carries a listed business's name ("Meraki Juice Kitchen is NOW Christopher's Kitchen").
  if (place?.name && place?.city && /\bnow\b|formerly|\bfka\b/i.test(place.name)) {
    const { data } = await db.from('listings').select('id, name').eq('status', 'approved').eq('address_city', place.city).limit(400);
    const hit = (data || []).find((x: any) => norm(x.name).length > 5 && norm(place.name).includes(norm(x.name)));
    if (hit) return hit.id;
  }
  return null;
}

// ---- Instagram (one Apify run for a batch) ----
async function readInstagram(handles: string[]) {
  const token = await secret('APIFY_API_TOKEN');
  if (!token) throw new Error('no Apify key');
  const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=110`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: handles }),
  });
  if (!r.ok) throw new Error(`apify ${r.status}`);
  const out: Record<string, any> = {};
  for (const p of (await r.json()) as any[]) {
    const u = String(p.username || '').toLowerCase();
    if (!u) continue;
    if (p.error) { out[u] = { missing: p.error === 'not_found', error: p.error }; continue; }
    const posts = (p.latestPosts || []) as any[];
    const times = posts.map((x) => Date.parse(x.timestamp)).filter((n) => n > 0).sort((a, b) => b - a);
    out[u] = {
      name: p.fullName || '', bio: String(p.biography || '').slice(0, 400), business: !!p.isBusinessAccount, category: p.businessCategoryName && p.businessCategoryName !== 'None' ? p.businessCategoryName : null,
      link: p.externalUrl || '', followers: p.followersCount ?? null, private: !!p.private, latest: times[0] ? new Date(times[0]).toISOString() : null,
      places: [...new Set(posts.map((x) => x.locationName).filter(Boolean))].slice(0, 6),
    };
  }
  return out;
}

async function decideGoogle(row: any, l: any, ig: any) {
  const where = row.city_guess || l.address_city || l.location || (l.address_state === 'FL' ? 'Florida' : '') || '';
  const name = l.name && !/^@/.test(l.name) ? l.name : (ig?.name || l.name);
  const p = placeSummary(await findPlace(name, where, l.website || ig?.link || '', l.address_state || (/south florida|miami|broward|palm beach/i.test(where) ? 'FL' : '')));
  const handle = handleOf(l.ig_handle || l.instagram || '');
  const dup = await duplicateOf(l, p, handle);
  // Vegan only on strong signs: Google's Vegan restaurant category, or the business's own name or Instagram bio. Google's
  // description saying "Vegan options" is a Check, not a listing.
  const isVegan = (p?.types || []).includes('vegan_restaurant') || VEGAN_RE.test(`${l.name} ${p?.name || ''} ${ig?.bio || ''} ${ig?.category || ''}`);
  const mentions = !isVegan && VEGAN_RE.test(p?.summary || '');
  const isFood = (p?.types || []).some((t: string) => FOOD_TYPE_RE.test(t)) || FOOD_WORD_RE.test(`${ig?.category || ''} ${ig?.bio || ''} ${l.category || ''}`);
  let verdict: string, reason: string;
  if (dup) { verdict = 'listed'; reason = 'Already in the Directory'; }
  else if (!p) { verdict = ig ? 'check' : 'gone'; reason = ig ? 'On Instagram, but we could not find it on Google' : `Google has no match for "${name}"${where ? ' in ' + where : ''}`; }
  else if (p.status === 'CLOSED_PERMANENTLY') { verdict = 'closed'; reason = 'Google shows it as permanently closed'; }
  else if (p.status === 'CLOSED_TEMPORARILY') { verdict = 'closed'; reason = 'Google shows it as temporarily closed'; }
  else if (isVegan && isFood) { verdict = 'list'; reason = (p.types || []).includes('vegan_restaurant') ? `Open; Google lists it as a Vegan restaurant` : `Open (${p.type_name || 'food'}); its name or Instagram says Vegan`; }
  else if (isFood) { verdict = 'check'; reason = `Open; Google lists it as ${p.type_name || 'a food business'}` + (mentions ? '; Google mentions Vegan options' : ', Vegan not confirmed'); }
  else { verdict = 'other'; reason = `Open; Google lists it as ${p.type_name || p.type || 'another kind of business'}`; }
  const community = p ? await communityOf(p.city, p.state) : null;
  return { place: p, verdict, reason, duplicate_of: dup, community_slug: community };
}

async function backlogRun(igN: number, gN: number) {
  let checked = 0;
  // 1. Instagram: one batch of accounts.
  const { data: igRows } = await db.from('ve_backlog_checks').select('listing_id, attempts').eq('track', 'ig').eq('stage', 'pending').lt('attempts', 3).limit(igN);
  if (igRows?.length) {
    const ids = igRows.map((r: any) => r.listing_id);
    const { data: ls } = await db.from('listings').select('id, name, instagram, ig_handle, website, category').in('id', ids);
    const byId = new Map((ls || []).map((l: any) => [l.id, l]));
    const handles = [...new Set(ids.map((id: string) => handleOf((byId.get(id) as any)?.ig_handle || (byId.get(id) as any)?.instagram || '')).filter(Boolean))];
    let got: Record<string, any> = {};
    try { got = handles.length ? await readInstagram(handles) : {}; }
    catch (e) {
      await Promise.all(igRows.map((r: any) => db.from('ve_backlog_checks').update({ attempts: r.attempts + 1, error: String((e as Error).message).slice(0, 200) }).eq('listing_id', r.listing_id)));
      return { checked, error: String((e as Error).message) };
    }
    for (const r of igRows as any[]) {
      const l: any = byId.get(r.listing_id) || {};
      const h = handleOf(l.ig_handle || l.instagram || '');
      const ig = h ? got[h] : null;
      const now = new Date().toISOString();
      let patch: Record<string, unknown>;
      if (!h) patch = { stage: 'done', verdict: 'thin', reason: 'The Instagram handle we have is not a real handle', checked_at: now };
      else if (!ig) patch = { attempts: r.attempts + 1, error: 'no answer from Instagram' };
      else if (ig.missing) patch = { stage: 'done', ig: { handle: h, missing: true }, verdict: 'gone', reason: `@${h} does not exist on Instagram`, checked_at: now };
      else if (ig.error) patch = { attempts: r.attempts + 1, error: ig.error };
      else {
        const dup = await duplicateOf(l, null, h);
        const food = FOOD_WORD_RE.test(`${ig.category || ''} ${ig.bio || ''} ${ig.name || ''}`) || VEGAN_RE.test(ig.category || '');
        // Instagram leaves isBusinessAccount off for many restaurant accounts; a category or food words count as a business.
        const business = ig.business || !!ig.category || food;
        const city = await cityIn(`${ig.bio} ${ig.places.join(' | ')}`);
        const quiet = !ig.latest || Date.parse(ig.latest) < Date.now() - 365 * DAY_MS;
        const igSave = { handle: h, ...ig };
        if (dup) patch = { stage: 'done', ig: igSave, verdict: 'listed', reason: 'Already in the Directory', duplicate_of: dup, checked_at: now };
        else if (!business) patch = { stage: 'done', ig: igSave, verdict: 'person', reason: ig.private ? 'A private personal account' : 'A personal account, not a business', checked_at: now };
        else if (!food) patch = { stage: 'done', ig: igSave, verdict: 'other', reason: `A business on Instagram${ig.category ? ': ' + ig.category : ''}`, city_guess: city, checked_at: now };
        else if (city) patch = { stage: 'ig_done', ig: igSave, city_guess: city };
        else patch = { stage: 'done', ig: igSave, verdict: quiet ? 'closed' : 'check',
          reason: quiet ? (ig.latest ? `No Instagram post since ${new Date(ig.latest).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'No Instagram posts') : `A food business on Instagram${ig.category ? ' (' + ig.category + ')' : ''}; no city to find it on Google`,
          checked_at: now };
      }
      await db.from('ve_backlog_checks').update(patch).eq('listing_id', r.listing_id);
      checked++;
    }
  }
  // 2. Google: rows with a place, and Instagram food businesses that named a city.
  const { data: gRows } = await db.from('ve_backlog_checks').select('listing_id, attempts, ig, city_guess, track, stage')
    .or('and(track.eq.google,stage.eq.pending),stage.eq.ig_done').lt('attempts', 3).limit(gN);
  const rows = (gRows || []) as any[];
  if (rows.length) {
    const { data: ls } = await db.from('listings').select('id, name, location, address_city, address_state, address_street, website, instagram, ig_handle, category').in('id', rows.map((r) => r.listing_id));
    const byId = new Map((ls || []).map((l: any) => [l.id, l]));
    for (let i = 0; i < rows.length; i += BATCH.parallel) {
      await Promise.all(rows.slice(i, i + BATCH.parallel).map(async (r) => {
        try {
          const d = await decideGoogle(r, byId.get(r.listing_id) || {}, r.ig);
          await db.from('ve_backlog_checks').update({ stage: 'done', ...d, checked_at: new Date().toISOString(), error: null }).eq('listing_id', r.listing_id);
        } catch (e) {
          await db.from('ve_backlog_checks').update({ attempts: r.attempts + 1, error: String((e as Error).message).slice(0, 200), ...(r.attempts + 1 >= 3 ? { stage: 'error' } : {}) }).eq('listing_id', r.listing_id);
        }
        checked++;
      }));
    }
  }
  const { count } = await db.from('ve_backlog_checks').select('listing_id', { count: 'exact', head: true }).in('stage', ['pending', 'ig_done']).lt('attempts', 3);
  return { checked, left: count || 0 };
}

const CATEGORIES = ['Restaurants', 'Bakeries & Cafes', 'Markets', 'Meal Prep', 'Catering', 'Food Brands', 'Brands', 'Fitness and Athletics', 'Health and Wellness',
  'Beauty and Personal Care', 'Clothing and Fashion', 'Coaches and Consultants', 'Nonprofits', 'Events', 'E-Commerce & Marketplaces', 'Media', 'Podcasts'];
const VEGAN_STATUS = ['fully_vegan', 'vegan_options', 'vegan_friendly'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const who = await caller(req);

  if (action === 'backlog_run') {
    if (!who.ops) return json({ error: 'ops_only' }, 403);
    return json(await backlogRun(Math.max(0, Math.min(+body.ig || BATCH.ig, 60)), Math.max(0, Math.min(+body.google || BATCH.google, 40))));
  }
  if (!who.ops && !who.admin) return json({ error: 'admins_only' }, 403);

  if (action === 'backlog_summary') {
    const { data } = await db.from('ve_backlog_checks').select('verdict, decision, community_slug, stage');
    const rows = (data || []) as any[];
    const counts: Record<string, number> = {}, open: Record<string, number> = {}, byCity: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      if (r.verdict) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
      if (r.verdict && !r.decision) {
        open[r.verdict] = (open[r.verdict] || 0) + 1;
        const c = r.community_slug || 'none';
        (byCity[c] ||= {})[r.verdict] = (byCity[c][r.verdict] || 0) + 1;
      }
    }
    return json({ ok: true, total: rows.length, left: rows.filter((r) => r.stage === 'pending' || r.stage === 'ig_done').length, errors: rows.filter((r) => r.stage === 'error').length,
      counts, open, by_city: byCity, cities: await cities() });
  }

  if (action === 'backlog_list') {
    const verdict = clean(body.verdict, 20);
    let q = db.from('ve_backlog_checks').select('listing_id, track, ig, place, verdict, reason, city_guess, community_slug, duplicate_of, checked_at', { count: 'exact' })
      .eq('verdict', verdict).is('decision', null);
    if (body.city === 'none') q = q.is('community_slug', null); else if (body.city) q = q.eq('community_slug', clean(body.city, 40));
    const { data, count } = await q.order('checked_at', { ascending: true }).range(+body.offset || 0, (+body.offset || 0) + 49);
    const ids = (data || []).map((r: any) => r.listing_id);
    const { data: ls } = ids.length ? await db.from('listings').select('id, name, location, address_city, website, instagram, ig_handle, crawl_source').in('id', ids) : { data: [] };
    const byId = new Map((ls || []).map((l: any) => [l.id, l]));
    let rows = (data || []).map((r: any) => ({ ...r, listing: byId.get(r.listing_id) || {} }));
    const qq = clean(body.q, 60).toLowerCase();
    if (qq) rows = rows.filter((r: any) => `${r.listing.name} ${r.place?.name || ''} ${r.place?.address || ''} ${r.ig?.handle || ''}`.toLowerCase().includes(qq));
    return json({ ok: true, rows, total: count || 0, categories: CATEGORIES });
  }

  if (action === 'backlog_decide') {
    if (!isId(body.listing_id) || !['list', 'hide'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
    const { data: r } = await db.from('ve_backlog_checks').select('*').eq('listing_id', body.listing_id).maybeSingle();
    const { data: l } = await db.from('listings').select('id, name, status, website, instagram, ig_handle, details').eq('id', body.listing_id).maybeSingle();
    if (!r || !l) return json({ error: 'not_found' }, 404);
    if (l.status !== 'quarantined') return json({ error: 'already_decided' }, 409);
    const by = who.admin?.name || 'Logan', at = new Date().toISOString(), note = clean(body.note, 500);
    const details = { ...(l.details || {}) } as Record<string, unknown>;
    const notes = Array.isArray(details.admin_notes) ? [...details.admin_notes as unknown[]] : [];
    details.backlog = { verdict: r.verdict, reason: r.reason, checked_at: r.checked_at, decided: body.decision, by, at };
    const patch: Record<string, unknown> = { updated_at: at };
    if (body.decision === 'list') {
      if (!CATEGORIES.includes(body.category)) return json({ error: 'category' }, 400);
      if (body.vegan_status != null && !VEGAN_STATUS.includes(body.vegan_status)) return json({ error: 'vegan_status' }, 400);
      const p = r.place || {};
      Object.assign(patch, { status: 'approved', category: body.category, vegan_status: body.vegan_status ?? null });
      if (p.id) Object.assign(patch, { google_place_id: p.id, address_street: p.street || null, address_city: p.city || null, address_state: p.state || null,
        address_zip: p.zip || null, address_country: p.country || null, latitude: p.lat, longitude: p.lng, business_status: p.status || 'OPERATIONAL',
        google_rating: p.rating, google_reviews_count: p.reviews || 0, google_category: p.type_name || null, location: [p.city, p.state].filter(Boolean).join(', ') || undefined });
      if (!l.website && (p.website || r.ig?.link)) patch.website = p.website || r.ig?.link;
      if (p.phone) patch.phone = p.phone;
      if (r.ig?.handle && !l.ig_handle) patch.ig_handle = r.ig.handle;
      notes.push({ at, by, kind: 'note', text: `Listed from the backlog check (${r.reason}).` + (note ? ' ' + note : '') });
    } else {
      Object.assign(patch, { status: 'rejected' });
      details.status_before_hidden = 'quarantined';
      notes.push({ at, by, kind: 'note', text: `Set aside after the backlog check (${r.reason}).` + (note ? ' ' + note : '') });
    }
    details.admin_notes = notes;
    patch.details = details;
    const { error } = await db.from('listings').update(patch).eq('id', l.id);
    if (error) return json({ error: error.message }, 400);
    await db.from('ve_backlog_checks').update({ decision: body.decision === 'list' ? 'listed' : 'hidden', decided_by: who.admin?.id || null, decided_at: at }).eq('listing_id', l.id);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
