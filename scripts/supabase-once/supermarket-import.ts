// One-time database write (canon ops-supabase-write-once-function; error registry SUPABASE-MCP-APPROVAL-HOLD-USE-ONCE-FUNCTION).
// Use it when the Supabase connector's execute_sql / apply_migration holds a write for an approval box that never shows
// (it times out at 60 s). Copy this file, put the SQL in STEPS, set KEY to a fresh random string, deploy it as
// ve-once-<task> with verify_jwt false, run each step with:
//   curl -X POST "https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-once-<task>?step=<name>" -H "x-run-key: <KEY>"
// check the result with a read-only SELECT, then redeploy the function as the 410 stub at the bottom (verify_jwt true).
// The key lives only in the session's scratchpad, never in the repo. Every step runs in one transaction.
import postgres from 'npm:postgres@3.4.4'

const KEY = 'REPLACE_WITH_A_FRESH_KEY'
const STEPS: Record<string, string> = {
  migrate: `-- The Supermarket Guide (LOCKED by Sean 2026-11-01, canon canon-ve-supermarket-guide, playbook ve-supermarket-guide; "hand it to
-- Logan, build it"). It runs on the venue Guides' engine (ve-venues): a store is a ve_venues row of kind 'supermarket' tied to its
-- chain's one Directory listing (chain_listing_id), its departments are spots and the Vegan sections a shopper looks for are items,
-- each "Aisle not mapped yet" until a member maps it (photo, in-store location check, the team accepts, the first earns the bounty).

alter table public.ve_venues drop constraint if exists ve_venues_kind_check;
alter table public.ve_venues add constraint ve_venues_kind_check check (kind = any (array['stadium','arena','airport','supermarket']));
alter table public.ve_venues add column if not exists chain_listing_id uuid references public.listings(id);
create index if not exists ve_venues_chain_idx on public.ve_venues (chain_listing_id) where chain_listing_id is not null;

-- Sponsors. The Guide is free while at least one supermarket sponsorship is active (Sean: "We get a sponsor, the guide is free, as
-- long as the sponsorship is active"); ve_supermarket_guide_sync flips ve_guides.access_rule between 'free' and 'points', so every
-- path that already reads the rule (ve-guide-unlock, ve-venues) agrees. Tiers and prices are the canon's.
create table if not exists public.ve_supermarket_sponsors (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('title','partner','spotlight')),
  chain_listing_id uuid references public.listings(id),
  brand_listing_id uuid references public.listings(id),
  status text not null default 'pending' check (status in ('pending','active','ended')),
  quarterly_cents integer,
  front_row boolean not null default false,
  founding boolean not null default false,
  starts_on date,
  ends_on date,
  contact_name text,
  contact_email text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((tier = 'spotlight') = (brand_listing_id is not null) and (tier <> 'spotlight') = (chain_listing_id is not null))
);
alter table public.ve_supermarket_sponsors enable row level security;
create unique index if not exists ve_supermarket_one_title on public.ve_supermarket_sponsors ((tier)) where tier = 'title' and status = 'active';

create or replace function public.ve_supermarket_guide_sync() returns text
language plpgsql security definer set search_path = public as $$
declare v_rule text;
begin
  v_rule := case when exists (select 1 from ve_supermarket_sponsors where tier in ('title','partner') and status = 'active'
                                and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date))
            then 'free' else 'points' end;
  update ve_guides set access_rule = v_rule, updated_at = now() where slug = 'supermarket-guide' and access_rule is distinct from v_rule;
  return v_rule;
end $$;
create or replace function public.ve_supermarket_sponsors_changed() returns trigger
language plpgsql security definer set search_path = public as $$ begin perform ve_supermarket_guide_sync(); return null; end $$;
drop trigger if exists trg_ve_supermarket_sponsors on public.ve_supermarket_sponsors;
create trigger trg_ve_supermarket_sponsors after insert or update or delete on public.ve_supermarket_sponsors
  for each statement execute function public.ve_supermarket_sponsors_changed();

-- The store template: every supermarket gets the same departments and Vegan sections, so a shopper sees the same layout in every
-- store and members fill in where each section is in theirs. Idempotent per store.
create or replace function public.ve_supermarket_seed_store(p_venue uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare d record; v_sec text; v_spot uuid; n integer := 0; i integer;
begin
  if exists (select 1 from ve_venue_spots where venue_id = p_venue) then return 0; end if;
  for d in select * from (values
      (1, 'Refrigerated', array['Plant-based milk','Plant-based yogurt','Vegan cheese','Vegan butter and spreads','Tofu and tempeh','Fresh plant-based meat','Hummus and dips']),
      (2, 'Frozen', array['Frozen plant-based meat','Frozen Vegan meals','Non-dairy ice cream']),
      (3, 'Pantry', array['Beans and lentils','Plant-based protein powder','Nut butters']),
      (4, 'Snacks', array['Vegan snacks and chips','Vegan cookies and treats'])) as t(ord, dept, secs)
  loop
    insert into ve_venue_spots (venue_id, name, where_text, sort_order, status)
    values (p_venue, d.dept, 'Aisles not mapped yet', d.ord, 'live') returning id into v_spot;
    i := 0;
    foreach v_sec in array d.secs loop
      i := i + 1;
      insert into ve_venue_items (venue_id, spot_id, name, description, vegan, sort_order, status)
      values (p_venue, v_spot, v_sec, 'Aisle not mapped yet. Be the first to tell us where it is in this store.', 'vegan', i, 'live');
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;

insert into public.ve_guides (title, slug, description, cost_lesars, published, sort_order, access_rule)
select 'The Supermarket Guide', 'supermarket-guide',
  'Find the Vegan items in your supermarket, aisle by aisle, kept current by members. Free while a supermarket sponsors it.',
  1100, false, 9, 'points'
where not exists (select 1 from public.ve_guides where slug = 'supermarket-guide');

select public.ve_supermarket_guide_sync();
`,
  check: `select (select count(*) from ve_supermarket_sponsors) sponsors, (select access_rule from ve_guides where slug='supermarket-guide') rule;`,
}


// Publix stores in our Florida chapters from Google Places, each a ve_venues row of kind 'supermarket' with the standard layout.
const FL: Record<string, string[]> = {"south-florida": ["Miami", "Miami Beach", "North Miami", "North Miami Beach", "Aventura", "Bal Harbour", "Sunny Isles Beach", "Surfside", "Doral", "Hialeah", "Miami Gardens", "Miami Lakes", "Miami Springs", "Coral Gables", "South Miami", "Key Biscayne", "Pinecrest", "Palmetto Bay", "Cutler Bay", "Homestead", "Florida City", "Naranja", "North Bay Village", "Opa-locka", "Fort Lauderdale", "Hollywood", "Sunrise", "Pompano Beach", "Coral Springs", "Margate", "Miramar", "Pembroke Pines", "Weston", "Davie", "Cooper City", "Plantation", "Lauderhill", "Lauderdale Lakes", "North Lauderdale", "Tamarac", "Oakland Park", "Wilton Manors", "Dania Beach", "Hallandale", "Hallandale Beach", "Deerfield Beach", "Lighthouse Point", "Coconut Creek", "Parkland", "Lauderdale-by-the-Sea", "Southwest Ranches", "West Palm Beach", "Boca Raton", "Delray Beach", "Boynton Beach", "Palm Beach Gardens", "Jupiter", "Lake Worth", "Lake Worth Beach", "Tequesta", "Loxahatchee", "Riviera Beach", "Royal Palm Beach", "Wellington", "North Palm Beach", "Palm Beach", "Greenacres", "Lantana", "Lake Park", "Juno Beach", "Palm Springs", "Highland Beach", "Belle Glade", "Port St. Lucie", "Port Saint Lucie", "Stuart", "Palm City", "Jensen Beach", "Hobe Sound", "Fort Pierce", "Vero Beach", "Sebastian", "Loxahatchee Groves", "South Florida", "Key West", "Key Largo", "Marathon", "Islamorada", "Tavernier", "Stock Island"], "central-florida": ["Orlando", "Altamonte Springs", "Apopka", "Lakeland", "The Villages", "Winter Haven", "Ocala", "Sanford", "Oviedo", "Winter Park", "Winter Garden", "Kissimmee", "Celebration", "Clermont", "Maitland", "Longwood", "Casselberry", "Lake Mary", "Windermere", "Ocoee", "Leesburg", "Mount Dora", "Eustis", "Haines City", "Bartow", "Davenport", "Sebring", "Tampa", "St. Petersburg", "Saint Petersburg", "Clearwater", "Clearwater Beach", "Largo", "Dunedin", "Palm Harbor", "Tarpon Springs", "Brandon", "Riverview", "Wesley Chapel", "Land O' Lakes", "Lutz", "Plant City", "Temple Terrace", "New Port Richey", "Bradenton", "Sarasota", "Venice", "North Port", "Myakka City", "Duette", "Punta Gorda", "Port Charlotte", "Fort Myers", "Cape Coral", "Naples", "Bonita Springs", "Estero", "Daytona Beach", "Ormond Beach", "Port Orange", "New Smyrna Beach", "DeLand", "Deltona", "Melbourne", "Titusville", "Cocoa", "Cocoa Beach", "Palm Bay", "Cape Canaveral", "Lake Buena Vista", "Nokomis", "Gulfport", "Pinellas Park", "Poinciana", "Sand Lake", "Indialantic", "Rockledge", "Indian Harbour Beach", "Belleair Bluffs", "Daytona Beach Shores", "South Daytona"], "north-florida": ["Jacksonville", "Jacksonville Beach", "Atlantic Beach", "Neptune Beach", "Ponte Vedra", "Ponte Vedra Beach", "St. Augustine", "Saint Augustine", "St. Augustine Beach", "Fernandina Beach", "Amelia Island", "Yulee", "Orange Park", "Fleming Island", "Middleburg", "Palm Coast", "Flagler Beach", "Gainesville", "Alachua", "Newberry", "High Springs", "Micanopy", "Lake City", "Live Oak", "Tallahassee", "Quincy", "Pensacola", "Pensacola Beach", "Gulf Breeze", "Navarre", "Milton", "Pace", "Fort Walton Beach", "Destin", "Niceville", "Crestview", "Santa Rosa Beach", "Miramar Beach", "Panama City", "Panama City Beach", "Lynn Haven", "Port St. Joe", "Apalachicola"]};
async function importPublix(sql: any, onlyHub: string | null, part = 0, of = 1) {
  const [{ value: key }] = await sql`select value from lesaruss_secrets where key = 'GOOGLE_PLACES_API_KEY'`;
  const [{ id: chain }] = await sql`select id from listings where slug = 'publix-super-markets' and status = 'approved'`;
  const hubOf = (c: string) => Object.keys(FL).find((h) => FL[h].map((x) => x.toLowerCase()).includes(String(c || '').toLowerCase())) || null;
  // One chapter a run (?hub=), so a run stays under the function's time limit and Google's rate limit (2026-11-01: the first run
  // searched every city with 8 workers at once and was cut short).
  const pool = onlyHub ? (FL[onlyHub] || []) : Object.values(FL).flat();
  // A big chapter splits across runs (?part=0&of=3), each under the gateway's 150 s (Central Florida timed out whole).
  const cities = [...new Set(pool)].filter((c) => !/^south florida$/i.test(c)).filter((_, k) => k % of === part);
  const found = new Map<string, any>(); let calls = 0, errors = 0, retries = 0, i = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function search(body: any) {
    for (let attempt = 0; attempt < 4; attempt++) {
      calls++;
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.businessStatus,nextPageToken' },
        body: JSON.stringify(body) });
      if (r.ok) return await r.json();
      if (r.status === 429 || r.status >= 500) { retries++; await sleep(1500 * (attempt + 1)); continue; }
      return null;
    }
    return null;
  }
  async function worker() {
    while (i < cities.length) {
      const city = cities[i++];
      try {
        // Up to three pages of 20, so a big city (Tampa, Orlando, Jacksonville) is not cut at 20 stores.
        let token: string | undefined; let page = 0;
        do {
          const j = await search(token ? { textQuery: 'Publix Super Market in ' + city + ', FL', pageSize: 20, pageToken: token }
                                       : { textQuery: 'Publix Super Market in ' + city + ', FL', pageSize: 20 });
          if (!j) { errors++; break; }
          for (const p of (j.places || [])) {
            const name = p.displayName?.text || '';
            if (!/^publix/i.test(name) || /pharmacy|liquor|sushi|catering|warehouse|distribution|corporate|office|aprons|cooking school/i.test(name)) continue;
            if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') continue;
            const comp = (t: string) => (p.addressComponents || []).find((a: any) => (a.types || []).includes(t));
            if (comp('administrative_area_level_1')?.shortText !== 'FL') continue;
            const c = comp('locality')?.longText || comp('sublocality')?.longText || '';
            const hub = hubOf(c); if (!hub || !p.location) continue;
            if (onlyHub && hub !== onlyHub) continue;
            found.set(p.id, { id: p.id, name, city: c, hub, address: p.formattedAddress, lat: p.location.latitude, lng: p.location.longitude });
          }
          token = j.nextPageToken; page++;
          if (token) await sleep(300);
        } while (token && page < 3);
      } catch { errors++; }
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  let added = 0;
  for (const s of found.values()) {
    const slug = ('publix-' + s.city + '-' + s.id.slice(-6)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const r = await sql`insert into ve_venues (slug, name, kind, city, state, country, hub, address, google_place_id, latitude, longitude, radius_m, sort_order, status, chain_listing_id)
      select ${slug}, ${s.name}, 'supermarket', ${s.city}, 'FL', 'US', ${s.hub}, ${s.address}, ${s.id}, ${s.lat}, ${s.lng}, 150, 1000, 'live', ${chain}
      where not exists (select 1 from ve_venues where google_place_id = ${s.id}) returning id`;
    if (r.length) { added++; await sql`select ve_supermarket_seed_store(${r[0].id})`; }
  }
  const byHub: Record<string, number> = {}; for (const s of found.values()) byHub[s.hub] = (byHub[s.hub] || 0) + 1;
  const total = await sql`select hub, count(*)::int n from ve_venues where kind = 'supermarket' and chain_listing_id = ${chain} group by hub order by hub`;
  return { hub: onlyHub, part, of, cities: cities.length, calls, retries, errors, found: found.size, added, byHub, total };
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (step === 'import_publix') {
    const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
    try { return Response.json(await importPublix(sql, new URL(req.url).searchParams.get('hub'), Number(new URL(req.url).searchParams.get('part') || 0), Number(new URL(req.url).searchParams.get('of') || 1))) } catch (e) { return Response.json({ step, error: String(e) }, { status: 500 }) } finally { await sql.end() }
  }
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => {
      const r: any = await tx.unsafe(STEPS[step])
      // One count per statement, so a multi-statement step shows what each one touched.
      const counts = Array.isArray(r) && Array.isArray(r[0]) ? r.map((x: any) => x.count) : [r.count]
      return { step, counts }
    })
    return Response.json(out)
  } catch (e) {
    return Response.json({ step, error: String(e) }, { status: 500 })
  } finally {
    await sql.end()
  }
})

// The stub, once every step has run:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
