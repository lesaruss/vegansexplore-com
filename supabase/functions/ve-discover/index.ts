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
// Adding by hand (Sean, 2026-10-27: "I want to talk about adding new listings... I'm not sure exactly how I would do that"),
// from Depot > Directory review > Add a listing and Paste a list:
// POST { action: 'add_search', name, where }       super admin -> { places: [place summary + hours + listed {slug, name}] }
// POST { action: 'add_create', name, category, vegan_status, place_id?, street, city, state, zip, country, lat, lng, phone,
//        website, instagram, facebook, tiktok, about, hours {Day: text}, online?, logo? { path } | { url } }   super admin -> { slug, id }   live at once; a backlog copy of
//        the same Google place is listed in its place instead of making a second listing
// POST { action: 'add_site', website }             super admin -> { instagram, facebook, tiktok, logos: [{ url, w, h, from }] }
//        the socials and logo pictures their own home page carries (Sean, 2026-10-27: "you should be able to pull their
//        social media"); a logo is only ever a suggestion the admin picks by eye, then copied into our storage
// POST { action: 'add_logo_url', content_type, bytes }  super admin -> { path, signed_url }   a logo file to upload, staged
//        under media/listings/_new/ until add_create moves it next to the listing
// POST { action: 'paste_list', text }              super admin -> { added, skipped }   one business a line ("Name, City, ST" or
//        an Instagram handle): each becomes a hidden listing and a backlog check, so it waits in New places for a decision
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
// Instagram categories for people and creators, not businesses we would list.
const CREATOR_RE = /^(artist|musician|musician\/band|writer|author|blogger|personal blog|digital creator|video creator|public figure|athlete|community|gamer|comedian|actor|photographer|creator|influencer|entrepreneur|health\/beauty|just for fun|education|coach)$/i;
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
  // A name match needs one name inside the other ("El Patio" in "El Patio Restaurant Latin Fusion"), or most of the real
  // words shared with at least two of them. One shared word is not enough ("Green Bar and Kitchen" is not "Living Green Cafe").
  const nameMatch = (g: string) => {
    const a = norm(name), b = norm(g);
    if (a.length >= 5 && (b.includes(a) || (b.length >= 5 && a.includes(b)))) return true;
    const gw = words(g), o = overlap(want, gw);
    return want.length >= 2 && o >= 2 && o / want.length >= 0.75;
  };
  return places.find((p) => dom && domain(p.websiteUri || '') === dom) || places.find((p) => nameMatch(p.displayName?.text || '')) || null;
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
  let p = placeSummary(await findPlace(name, where, l.website || ig?.link || '', l.address_state || (/south florida|miami|broward|palm beach/i.test(where) ? 'FL' : '')));
  // Right state, wrong part of it ("Third Culture" from South Florida matched one in Titusville): when we know which of our
  // cities it is in, Google's match has to be there too.
  let elsewhere = '';
  const wantComm = /south florida/i.test(where) ? 'south-florida' : (l.address_city || row.city_guess) ? await communityOf(l.address_city || row.city_guess, l.address_state || 'FL') : null;
  if (p && wantComm && (await communityOf(p.city, p.state)) !== wantComm) { elsewhere = `${p.city}, ${p.state}`; p = null; }
  const handle = handleOf(l.ig_handle || l.instagram || '');
  const dup = await duplicateOf(l, p, handle);
  // Vegan only on strong signs: Google's Vegan restaurant category, or the business's own name or Instagram bio. Google's
  // description saying "Vegan options" is a Check, not a listing.
  const isVegan = (p?.types || []).includes('vegan_restaurant') || VEGAN_RE.test(`${l.name} ${p?.name || ''} ${ig?.bio || ''} ${ig?.category || ''}`);
  const mentions = !isVegan && VEGAN_RE.test(p?.summary || '');
  const isFood = (p?.types || []).some((t: string) => FOOD_TYPE_RE.test(t)) || FOOD_WORD_RE.test(`${ig?.category || ''} ${ig?.bio || ''} ${l.category || ''}`);
  let verdict: string, reason: string;
  if (dup) { verdict = 'listed'; reason = 'Already in the Directory'; }
  else if (!p && elsewhere) { verdict = 'check'; reason = `Google's only match is in ${elsewhere}, not ${where}`; }
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
  // Three failed tries: it goes to Check with the reason, so it is seen instead of sitting unsorted.
  const { data: stuck } = await db.from('ve_backlog_checks').select('listing_id, error, track').in('stage', ['pending', 'ig_done']).gte('attempts', 3).limit(200);
  for (const r of (stuck || []) as any[]) {
    await db.from('ve_backlog_checks').update({ stage: 'done', verdict: 'check', reason: `We could not read it on ${r.track === 'ig' ? 'Instagram' : 'Google'} (${r.error || 'no answer'}); look by hand`, checked_at: new Date().toISOString() }).eq('listing_id', r.listing_id);
  }
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
      // Age-restricted accounts (often bars and drink brands) never open to the scraper: a person looks.
      else if (/restricted/i.test(ig.error)) patch = { stage: 'done', ig: { handle: h }, verdict: 'check', reason: `@${h} is an age-restricted Instagram account; look by hand`, checked_at: now };
      else if (ig.error) patch = { attempts: r.attempts + 1, error: ig.error };
      else {
        const dup = await duplicateOf(l, null, h);
        const food = FOOD_WORD_RE.test(`${ig.category || ''} ${ig.bio || ''} ${ig.name || ''}`) || VEGAN_RE.test(ig.category || '');
        // Instagram leaves isBusinessAccount off for many restaurant accounts; a category or food words count as a business.
        const business = !CREATOR_RE.test(ig.category || '') && (ig.business || !!ig.category || food);
        const city = await cityIn(`${ig.bio} ${ig.places.join(' | ')}`);
        const quiet = !ig.latest || Date.parse(ig.latest) < Date.now() - 365 * DAY_MS;
        const igSave = { handle: h, ...ig };
        if (dup) patch = { stage: 'done', ig: igSave, verdict: 'listed', reason: 'Already in the Directory', duplicate_of: dup, checked_at: now };
        else if (!business) patch = { stage: 'done', ig: igSave, verdict: 'person', reason: ig.private ? 'A private personal account' : ig.category ? `A person or creator (${ig.category}), not a business` : 'A personal account, not a business', checked_at: now };
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

// Every Directory kind (CAT_MAP in /public/ve-region-directory.js).
const CATEGORIES = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Food Brands', 'Nutrition & Supplements', 'Markets', 'Catering', 'Meal Prep',
  'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces',
  'Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media', 'Web & Development',
  'AI & Automation', 'Business Operations', 'Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books', 'Media',
  'Community Partner', 'Nonprofits', 'Events'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ---- Adding by hand ----
// Google's matches for a name and place, each with its week of hours and whether we already list it.
async function searchPlaces(q: string) {
  const key = await secret('GOOGLE_PLACES_API_KEY');
  if (!key) throw new Error('no Google key');
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': [...FIELDS, 'regularOpeningHours'].map((f) => 'places.' + f).join(',') },
    body: JSON.stringify({ textQuery: q, maxResultCount: 6 }),
  });
  if (!r.ok) throw new Error(`places ${r.status}`);
  const places = ((await r.json()).places || []) as any[];
  const ids = places.map((p) => p.id).filter(Boolean);
  const { data: had } = ids.length ? await db.from('listings').select('id, slug, name, status, google_place_id').in('google_place_id', ids).eq('status', 'approved') : { data: [] };
  return Promise.all(places.map(async (p) => {
    const s: any = placeSummary(p);
    // "Monday: 11:00 AM – 9:00 PM" becomes { Monday: "11 AM to 9 PM" }, the way the listing editor writes hours.
    const hours: Record<string, string> = {};
    for (const line of (p.regularOpeningHours?.weekdayDescriptions || []) as string[]) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m && DAYS.includes(m[1])) hours[m[1]] = m[2].replace(/\u2009|\u202f/g, ' ').replace(/\s*[\u2013\u2014-]\s*/g, ' to ').replace(/:00/g, '').trim();
    }
    s.hours = hours;
    let hit = (had || []).find((x: any) => x.google_place_id === p.id) as any;
    if (!hit && s.city) {
      const { data } = await db.from('listings').select('id, slug, name').eq('status', 'approved').eq('address_city', s.city).ilike('name', `%${String(s.name || '').replace(/[%_,()]/g, ' ').trim().slice(0, 40)}%`).limit(3);
      hit = (data || []).find((x: any) => norm(x.name) === norm(s.name || ''));
    }
    s.listed = hit ? { slug: hit.slug, name: hit.name, id: hit.id } : null;
    return s;
  }));
}
function slugBase(name: string) { return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'listing'; }
async function freeSlug(name: string) {
  const base = slugBase(name);
  const { data } = await db.from('listings').select('slug').like('slug', base + '%').eq('status', 'approved');
  const taken = new Set((data || []).map((x: any) => x.slug));
  let s = base, n = 2;
  while (taken.has(s)) s = `${base}-${n++}`;
  return s;
}
const initialsOf = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const handleOfText = (v: string) => { const m = String(v || '').trim().match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]{2,30})\/?$/); return m ? m[1] : ''; };
const VEGAN_STATUS = ['fully_vegan', 'vegan_options', 'vegan_friendly'];

// ---- Their website: socials and logo pictures ----
// Website builders ship their own social links in templates (facebook.com/wix, instagram.com/squarespace); a site that never
// replaced them does not have those accounts. The same rules as ve-restaurant-audit's essentials pass.
const TEMPLATE_HANDLES = new Set(['wix', 'wixcom', 'squarespace', 'godaddy', 'shopify', 'wordpress', 'wordpressdotcom', 'weebly', 'webflow', 'toasttab', 'facebook', 'instagram', 'tiktok', 'meta', 'business', 'yourbusiness', 'username']);
function socialOf(u: string, kind: 'ig' | 'fb' | 'tt') {
  let h = '';
  if (kind === 'ig') { const m = u.match(/instagram\.com\/([A-Za-z0-9._]+)/i); h = m && !['p', 'reel', 'reels', 'explore', 'stories'].includes(m[1].toLowerCase()) ? m[1].toLowerCase() : ''; }
  else if (kind === 'tt') { const m = u.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i); h = m ? m[1].toLowerCase() : ''; }
  else {
    const parts = u.replace(/^https?:\/\/(?:[a-z]+\.)?facebook\.com\//i, '').split(/[/?#]/).filter(Boolean);
    h = !parts.length || /^(profile\.php|people|groups|events|share|sharer|dialog|plugins|tr)/i.test(parts[0]) ? '' : parts[0] === 'pages' ? (parts[1] && parts[2] ? `pages/${parts[1]}/${parts[2]}` : '') : parts[0].toLowerCase();
  }
  return h && !TEMPLATE_HANDLES.has(h.replace(/[._-]/g, '')) ? h : '';
}
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
async function fetchWithin(url: string, ms: number, accept = 'text/html,*/*') {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': BROWSER_UA, Accept: accept } }); }
  finally { clearTimeout(t); }
}
function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1], u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (i: number) => b[i] | (b[i + 1] << 8), le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { w: u32(16), h: u32(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: u16(i + 7), h: u16(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (b.length > 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const f = String.fromCharCode(...b.slice(12, 16));
    if (f === 'VP8 ') return { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    if (f === 'VP8L') { const x = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (f === 'VP8X') return { w: le24(24) + 1, h: le24(27) + 1 };
  }
  return null;
}
const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const LOGO_MIN = 200;
// A picture from the web: its bytes, type and size, or why not.
async function readImage(url: string): Promise<{ bytes: Uint8Array; type: string; w: number; h: number } | { error: string }> {
  try {
    const r = await fetchWithin(url, 8000, 'image/*');
    if (!r.ok) return { error: `the picture did not open (${r.status})` };
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return { error: 'the picture is over 8 MB' };
    const size = imageSize(buf);
    if (!size) return { error: 'not a JPEG, PNG or WebP picture' };
    const type = buf[0] === 0x89 ? 'image/png' : buf[0] === 0xff ? 'image/jpeg' : 'image/webp';
    return { bytes: buf, type, ...size };
  } catch (e) { return { error: String((e as Error).message || e) }; }
}
async function readSite(website: string) {
  const out = { instagram: '', facebook: '', tiktok: '', logos: [] as { url: string; w: number; h: number; from: string }[], error: '' };
  let r: Response;
  try { r = await fetchWithin(website, 10000); } catch (e) { out.error = 'The website did not open'; return out; }
  if (!r.ok) { out.error = `The website answered ${r.status}`; return out; }
  const html = (await r.text()).slice(0, 600000), base = r.url || website;
  const abs = (u: string) => { try { return new URL(u.replace(/&amp;/g, '&').trim(), base).href; } catch { return ''; } };
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, '&').trim());
  const pick = (re: RegExp, kind: 'ig' | 'fb' | 'tt') => { for (const h of hrefs) if (re.test(h)) { const v = socialOf(h, kind); if (v) return v; } return ''; };
  const ig = pick(/instagram\.com\//i, 'ig'), fb = pick(/facebook\.com\//i, 'fb'), tt = pick(/tiktok\.com\/@/i, 'tt');
  if (ig) out.instagram = '@' + ig;
  if (fb) out.facebook = 'https://www.facebook.com/' + fb;
  if (tt) out.tiktok = '@' + tt;
  // Logo pictures, most likely first: an <img> that says logo, the app icon, the share picture, the page icon.
  const cands: { url: string; from: string }[] = [];
  const attr = (tag: string, name: string) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1] || '';
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]; if (!/logo/i.test(tag)) continue;
    const src = attr(tag, 'src') || attr(tag, 'data-src') || (attr(tag, 'srcset').split(',').pop() || '').trim().split(/\s+/)[0];
    if (src && !/^data:/i.test(src)) cands.push({ url: abs(src), from: 'The logo on their website' });
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(m[0], 'rel').toLowerCase(), href = attr(m[0], 'href');
    if (href && /apple-touch-icon/.test(rel)) cands.push({ url: abs(href), from: 'Their app icon' });
  }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (/property=["']og:image["']|name=["']og:image["']/i.test(m[0])) { const c = attr(m[0], 'content'); if (c) cands.push({ url: abs(c), from: 'Their share picture' }); }
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(m[0], 'rel').toLowerCase(), href = attr(m[0], 'href');
    if (href && /(^|\s)icon(\s|$)/.test(rel)) cands.push({ url: abs(href), from: 'Their page icon' });
  }
  const seen = new Set<string>();
  const list = cands.filter((c) => c.url && /^https?:/i.test(c.url) && !/\.svg(\?|$)/i.test(c.url) && !seen.has(c.url) && seen.add(c.url)).slice(0, 8);
  const read = await Promise.all(list.map(async (c) => { const img = await readImage(c.url); return 'error' in img ? null : { url: c.url, w: img.w, h: img.h, from: c.from }; }));
  out.logos = read.filter((x): x is { url: string; w: number; h: number; from: string } => !!x && Math.min(x.w, x.h) >= LOGO_MIN).slice(0, 4);
  return out;
}
// Put the picked logo next to the listing in our storage (never hot-linked) and on the listing.
async function saveLogo(l: { id: string; slug: string; details: any }, logo: any, by: string): Promise<string> {
  const SB = 'vegan-media';
  let bytes: Uint8Array, type: string, w: number, h: number, source: string, staged = '';
  if (logo?.path) {
    staged = String(logo.path);
    if (!/^media\/listings\/_new\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(staged)) return 'The logo upload was not ours';
    const { data: file, error } = await db.storage.from(SB).download(staged);
    if (error || !file) return 'The logo did not finish uploading';
    bytes = new Uint8Array(await file.arrayBuffer());
    const size = imageSize(bytes); if (!size) return 'The logo is not a JPEG, PNG or WebP picture';
    ({ w, h } = size); type = bytes[0] === 0x89 ? 'image/png' : bytes[0] === 0xff ? 'image/jpeg' : 'image/webp'; source = 'admin';
  } else if (logo?.url && /^https?:\/\//i.test(String(logo.url))) {
    const img = await readImage(String(logo.url));
    if ('error' in img) return 'The logo from their website: ' + img.error;
    ({ bytes, type, w, h } = img); source = 'website';
  } else return '';
  if (Math.min(w, h) < LOGO_MIN) return `The logo is ${w} x ${h}; it needs to be at least ${LOGO_MIN} px on the shorter side`;
  const path = `media/listings/${l.slug}/logo-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${IMAGE_EXT[type]}`;
  const { error } = await db.storage.from(SB).upload(path, bytes, { contentType: type, upsert: false });
  if (error) return 'The logo did not save: ' + error.message;
  if (staged) await db.storage.from(SB).remove([staged]);
  const url = `${SUPABASE_URL}/storage/v1/object/public/${SB}/${path}`;
  const details = { ...(l.details || {}) } as Record<string, any>;
  details.logo_source = source; details.logo_checked = { by, at: new Date().toISOString(), w, h, ...(source === 'website' ? { from: String(logo.url).slice(0, 400) } : {}) };
  await db.from('listings').update({ logo_url: url, details }).eq('id', l.id);
  return '';
}

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

  if (action === 'add_search') {
    if (!who.admin) return json({ error: 'admins_only' }, 403);
    const name = clean(body.name, 120), where = clean(body.where, 120);
    if (name.length < 2) return json({ error: 'name' }, 400);
    try { return json({ ok: true, places: await searchPlaces(`${name} ${where}`.trim()) }); }
    catch (e) { return json({ error: String((e as Error).message) }, 502); }
  }

  if (action === 'add_site') {
    if (!who.admin) return json({ error: 'admins_only' }, 403);
    let site = clean(body.website, 400);
    if (!site) return json({ error: 'website' }, 400);
    if (!/^https?:\/\//i.test(site)) site = 'https://' + site;
    try { new URL(site); } catch { return json({ error: 'website' }, 400); }
    return json({ ok: true, ...(await readSite(site)) });
  }

  if (action === 'add_logo_url') {
    if (!who.admin) return json({ error: 'admins_only' }, 403);
    const ext = IMAGE_EXT[String(body.content_type || '')];
    if (!ext) return json({ error: 'file_type', message: 'A logo has to be a JPEG, PNG or WebP picture.' }, 400);
    const bytes = Number(body.bytes) || 0;
    if (bytes <= 0 || bytes > 15728640) return json({ error: 'file_size', message: 'A logo can be up to 15 MB.' }, 400);
    const path = `media/listings/_new/${crypto.randomUUID()}.${ext}`;
    const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_url_failed', message: error?.message }, 500);
    return json({ ok: true, path, signed_url: up.signedUrl });
  }

  if (action === 'add_create') {
    if (!who.admin) return json({ error: 'admins_only' }, 403);
    const name = clean(body.name, 140), category = clean(body.category, 60), online = body.online === true;
    if (name.length < 2) return json({ error: 'name', message: 'Give it a name.' }, 400);
    if (!CATEGORIES.includes(category)) return json({ error: 'category', message: 'Pick what kind of business it is.' }, 400);
    if (body.vegan_status != null && body.vegan_status !== '' && !VEGAN_STATUS.includes(body.vegan_status)) return json({ error: 'vegan_status' }, 400);
    const city = online ? '' : clean(body.city, 80), state = online ? '' : clean(body.state, 40);
    if (!online && !city) return json({ error: 'city', message: 'Give it a city, or tick Online only.' }, 400);
    const placeId = online ? '' : clean(body.place_id, 200);
    if (placeId) {
      const { data: dup } = await db.from('listings').select('slug, name').eq('status', 'approved').eq('google_place_id', placeId).limit(1);
      if (dup?.[0]) return json({ error: 'already_listed', slug: dup[0].slug, name: dup[0].name, message: `${dup[0].name} is already on the Directory.` }, 409);
    }
    const link = (v: unknown) => { const u = clean(v, 400); return !u ? '' : /^https?:\/\//i.test(u) ? u : 'https://' + u.replace(/^\/+/, ''); };
    const hours: Record<string, string> = {};
    if (!online && body.hours && typeof body.hours === 'object') for (const d of DAYS) { const t = clean(body.hours[d], 60); if (t) hours[d] = t; }
    const by = who.admin.name || 'Sean', at = new Date().toISOString();
    const row: Record<string, unknown> = {
      name, category, specialty: '', description: clean(body.about, 1000), status: 'approved',
      location: online ? 'Online' : [city, state].filter(Boolean).join(', '),
      website: link(body.website), phone: online ? null : (clean(body.phone, 40) || null),
      instagram: (() => { const h = handleOfText(clean(body.instagram, 200)); return h ? '@' + h.toLowerCase() : null; })(),
      tiktok: (() => { const h = handleOfText(clean(body.tiktok, 200).replace(/^https?:\/\/(www\.)?tiktok\.com\//i, '')); return h ? '@' + h.toLowerCase() : null; })(),
      facebook: (() => { const u = clean(body.facebook, 300); if (!u) return null; const h = socialOf(/facebook\.com/i.test(u) ? u : 'https://www.facebook.com/' + u.replace(/^@/, ''), 'fb'); return h ? 'https://www.facebook.com/' + h : null; })(),
      address_street: online ? null : (clean(body.street, 160) || null), address_city: city || null, address_state: state || null,
      address_zip: online ? null : (clean(body.zip, 20) || null), address_country: online ? null : (clean(body.country, 4) || null),
      latitude: online || !Number.isFinite(+body.lat) || body.lat === null ? null : +body.lat, longitude: online || !Number.isFinite(+body.lng) || body.lng === null ? null : +body.lng,
      google_place_id: placeId || null, business_status: 'OPERATIONAL', google_hours_json: Object.keys(hours).length ? hours : null,
      vegan_status: body.vegan_status ? body.vegan_status : null, initials: initialsOf(name), updated_at: at,
    };
    if (online) row.communities = ['all'];
    const note = { at, by, kind: 'note', text: 'Added by hand in Directory review' + (placeId ? ', from Google.' : '.') };
    // The same Google place waiting in the backlog is listed in its place, so there is one listing, not two.
    const { data: waiting } = placeId ? await db.from('ve_backlog_checks').select('listing_id').is('decision', null).eq('place->>id', placeId).limit(1) : { data: [] };
    const wid = (waiting || [])[0]?.listing_id;
    if (wid) {
      const { data: old } = await db.from('listings').select('id, details, status').eq('id', wid).maybeSingle();
      if (old && old.status === 'quarantined') {
        const details = { ...(old.details || {}) } as Record<string, any>;
        details.admin_notes = [...(Array.isArray(details.admin_notes) ? details.admin_notes : []), { ...note, text: note.text + ' It was waiting in the backlog.' }];
        details.added_by_hand = { by, at };
        const slug = await freeSlug(name);
        const { error } = await db.from('listings').update({ ...row, slug, details }).eq('id', wid);
        if (error) return json({ error: error.message }, 400);
        await db.from('ve_backlog_checks').update({ decision: 'listed', decided_by: who.admin.id, decided_at: at }).eq('listing_id', wid);
        const logo_error = body.logo ? await saveLogo({ id: wid, slug, details }, body.logo, by) : '';
        return json({ ok: true, id: wid, slug, from_backlog: true, logo_error });
      }
    }
    const slug = await freeSlug(name);
    const details = { added_by_hand: { by, at }, admin_notes: [note] };
    const { data, error } = await db.from('listings').insert({ ...row, slug, crawl_source: 'admin', details }).select('id, slug').single();
    if (error) return json({ error: error.message }, 400);
    const logo_error = body.logo ? await saveLogo({ id: data.id, slug: data.slug, details }, body.logo, by) : '';
    return json({ ok: true, id: data.id, slug: data.slug, logo_error });
  }

  if (action === 'paste_list') {
    if (!who.admin) return json({ error: 'admins_only' }, 403);
    const lines = String(body.text || '').split(/\r?\n/).map((x) => x.replace(/\u0000/g, '').trim()).filter(Boolean).slice(0, 200);
    if (!lines.length) return json({ error: 'empty', message: 'Paste one business a line.' }, 400);
    const at = new Date().toISOString(), by = who.admin.name || 'Sean';
    let added = 0; const skipped: { line: string; why: string }[] = [];
    for (const line of lines) {
      const isIg = /^@|instagram\.com\//i.test(line);
      const handle = isIg ? handleOfText(line.split(/[\s,]+/)[0]) : '';
      const parts = isIg ? [] : line.split(',').map((x) => x.trim()).filter(Boolean);
      const name = isIg ? '@' + handle : (parts[0] || '').slice(0, 140);
      if ((isIg && !handle) || name.length < 2) { skipped.push({ line, why: 'Could not read a name or handle' }); continue; }
      const city = isIg ? '' : (parts[1] || ''), state = isIg ? '' : (parts[2] || '');
      // Already listed (same name in the same city, or the same Instagram handle): left out.
      const { data: dup } = isIg
        ? await db.from('listings').select('id').in('status', ['approved', 'quarantined']).or(`ig_handle.ilike.${handle},instagram.ilike.${handle}`).limit(1)
        : await db.from('listings').select('id, name, address_city, location').in('status', ['approved', 'quarantined']).ilike('name', name.replace(/[%_]/g, ' ')).limit(10);
      const same = isIg ? (dup || [])[0] : (dup || []).find((x: any) => !city || String(x.address_city || x.location || '').toLowerCase().includes(city.toLowerCase()));
      if (same) { skipped.push({ line, why: 'Already on the Directory or waiting in New places' }); continue; }
      const { data: l, error } = await db.from('listings').insert({
        name, category: 'Uncategorized', specialty: '', description: '', status: 'quarantined', website: '',
        location: [city, state].filter(Boolean).join(', '), address_city: city || null, address_state: state.length <= 3 ? (state.toUpperCase() || null) : null,
        ig_handle: handle || null, instagram: handle || null, initials: initialsOf(isIg ? handle : name), crawl_source: 'paste',
        details: { pasted: { by, at, line } },
      }).select('id').single();
      if (error || !l) { skipped.push({ line, why: error?.message || 'Could not save' }); continue; }
      await db.from('ve_backlog_checks').insert({ listing_id: l.id, track: isIg ? 'ig' : 'google', stage: 'pending', city_guess: city || null });
      added++;
    }
    return json({ ok: true, added, skipped });
  }

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
