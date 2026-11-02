-- Scan it, find it in your store, ask the search box (LOCKED by Sean 2026-11-02: "lock it and then go"; from his 8:31 AM Fieldy recording in Walmart).
-- Canon canon-ve-store-scan-search, playbook ve-store-scan-search. Build: store answers in universal search (ve_search_store), member sightings
-- ("I see it here", ve_store_sightings, feeds ve_product_stores.confirmed_at = last checked), scan result flags (Vegan, Organic, GMO free).

create table if not exists public.ve_store_search_terms (
  term text primary key,
  product_types text[] not null,
  brand text not null default 'vegans-explore'
);
alter table public.ve_store_search_terms enable row level security;
insert into public.ve_store_search_terms (term, product_types) values
  ('ice cream', '{"Ice Cream"}'), ('icecream', '{"Ice Cream"}'), ('frozen dessert', '{"Ice Cream"}'), ('gelato', '{"Ice Cream"}'),
  ('milk', '{"Milk"}'), ('plant milk', '{"Milk"}'), ('oat milk', '{"Milk"}'), ('almond milk', '{"Milk"}'), ('soy milk', '{"Milk"}'),
  ('coconut milk', '{"Milk"}'), ('non dairy milk', '{"Milk"}'), ('nondairy milk', '{"Milk"}'), ('milk alternative', '{"Milk"}'),
  ('creamer', '{"Coffee Creamer"}'), ('coffee creamer', '{"Coffee Creamer"}'),
  ('yogurt', '{"Yogurt"}'), ('yoghurt', '{"Yogurt"}'),
  ('cream cheese', '{"Cream Cheese"}'), ('sour cream', '{"Sour Cream"}'), ('butter', '{"Butter"}'),
  ('parmesan', '{"Parmesan"}'), ('feta', '{"Feta"}'), ('shredded cheese', '{"Shredded Cheese"}'), ('cheese slices', '{"Cheese Slices"}'),
  ('cheese', '{"Cheese Slices","Shredded Cheese","Cheese Spreads","Parmesan","Feta","Cream Cheese"}')
on conflict (term) do nothing;

create table if not exists public.ve_store_sightings (
  id uuid primary key default gen_random_uuid(),
  store_listing_id uuid not null references public.listings(id),
  gtin text,
  product_id uuid references public.ve_products(id),
  seen boolean not null default true,
  member_id uuid,
  source text not null default 'member',
  created_at timestamptz not null default now()
);
alter table public.ve_store_sightings enable row level security;
create index if not exists ve_store_sightings_store_idx on public.ve_store_sightings (store_listing_id, created_at desc);

create or replace function public.ve_store_sighting_save(p_member uuid, p_store uuid, p_gtin text, p_product uuid, p_seen boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int; ok boolean;
begin
  select (tags @> array['ve-grocery-store'] and status = 'approved') into ok from listings where id = p_store;
  if not coalesce(ok, false) then return jsonb_build_object('error', 'not_a_store'); end if;
  select count(*) into n from ve_store_sightings where member_id = p_member and created_at > now() - interval '1 day';
  if n >= 30 then return jsonb_build_object('error', 'daily_limit'); end if;
  insert into ve_store_sightings (store_listing_id, gtin, product_id, seen, member_id) values (p_store, p_gtin, p_product, coalesce(p_seen, true), p_member);
  if p_product is not null and coalesce(p_seen, true) then
    update ve_product_stores set confirmed_at = now(), removed_at = null where product_id = p_product and store_listing_id = p_store;
    if not found then
      insert into ve_product_stores (product_id, store_listing_id, source, confirmed_at) values (p_product, p_store, 'member', now());
    end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ve_store_sighting_save(uuid, uuid, text, uuid, boolean) from public, anon, authenticated;

-- A store and a thing in one sentence: "does walmart carry vegan ice cream", "what's vegan at target". Never guesses: a store with nothing mapped says so.
create or replace function public.ve_search_store(p_q text, p_limit int default 12)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  qp text; sid uuid; sname text; sslug text; salias text; term text; types text[]; leftover text; w text; thing text;
  stop text[] := array['does','do','carry','carries','carried','have','has','sell','sells','stock','stocks','offer','offers','vegan','plant','based','dairy','free',
    'at','in','the','a','an','any','what','whats','which','items','item','are','is','there','they','their','find','get','buy','can','i','where','products','product',
    'near','me','nearby','stores','store','options','option','kind','kinds','of','some','for','you','your','and','or','to','sold'];
  verb boolean; mode text; items jsonb; total int; ever int;
begin
  qp := ' ' || regexp_replace(lower(replace(replace(coalesce(p_q, ''), '’', ''), '''', '')), '[^a-z0-9& -]', ' ', 'g') || ' ';
  qp := regexp_replace(qp, '\s+', ' ', 'g');
  select l.id, l.name, l.slug, a.alias into sid, sname, sslug, salias
    from ve_store_aliases a join listings l on l.id = a.store_listing_id
   where l.status = 'approved' and (qp like '% ' || a.alias || ' %' or qp like '% ' || a.alias || 's %')
   order by length(a.alias) desc limit 1;
  if sid is null then return null; end if;
  select t.term, t.product_types into term, types from ve_store_search_terms t
   where qp like '% ' || t.term || ' %' or qp like '% ' || t.term || 's %' order by length(t.term) desc limit 1;
  verb := qp ~ ' (carry|carries|carried|have|has|sell|sells|stock|stocks|offer|offers|sold) ';
  leftover := qp;
  leftover := replace(leftover, ' ' || salias || 's ', ' '); leftover := replace(leftover, ' ' || salias || ' ', ' ');
  if term is not null then leftover := replace(replace(leftover, ' ' || term || 's ', ' '), ' ' || term || ' ', ' '); end if;
  thing := '';
  foreach w in array regexp_split_to_array(trim(leftover), ' ') loop
    if w <> '' and not (w = any(stop)) then thing := trim(thing || ' ' || w); end if;
  end loop;
  if term is not null then mode := 'type';
  elsif thing = '' and qp ~ ' (vegan|plant based|dairy free) ' then mode := 'all';
  elsif thing <> '' and verb then mode := 'unknown_item';
  else return null; end if;
  if mode = 'unknown_item' then
    return jsonb_build_object('store', jsonb_build_object('name', sname, 'slug', sslug), 'mode', mode, 'thing', thing, 'total', 0, 'items', '[]'::jsonb);
  end if;
  select count(*), coalesce(jsonb_agg(x.j order by x.ty, x.bn) filter (where x.rn <= p_limit), '[]'::jsonb) into total, items from (
    select jsonb_build_object('brand', b.name, 'brand_slug', b.slug, 'product_slug', p.slug, 'type', p.product_type, 'logo', b.logo_url, 'checked_at', ps.confirmed_at) j,
           p.product_type ty, b.name bn, row_number() over (order by p.product_type, b.name) rn
      from ve_product_stores ps join ve_products p on p.id = ps.product_id
      join listings b on b.id = p.brand_listing_id and b.status = 'approved' and coalesce(b.business_status, '') <> 'CLOSED_PERMANENTLY'
     where ps.store_listing_id = sid and ps.removed_at is null and (mode = 'all' or p.product_type = any(types))) x;
  select count(*) into ever from ve_product_stores where store_listing_id = sid and removed_at is null;
  return jsonb_build_object('store', jsonb_build_object('name', sname, 'slug', sslug), 'mode', mode, 'term', term, 'types', to_jsonb(types), 'thing', thing,
    'total', total, 'items', items, 'store_mapped', ever);
end $$;
grant execute on function public.ve_search_store(text, int) to service_role;

-- Canon and playbook.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-store-scan-search',
  'Vegans Explore: scan it, find it in your store, ask the search box "does Walmart carry vegan ice cream" (LOCKED by Sean 2026-11-02)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','supermarket','scan','search','products'], 1, 'logan', 'logan',
  'Locked by Sean ("lock it and then go"), from his 8:31 AM Fieldy recording in a Walmart.',
  jsonb_build_object(
    'why', 'Sean, in a supermarket he did not know: "I want to be able to scan an item that looks interesting to see if it''s vegan, organic, GMO free... and I also want to see where all the vegan items are in the store... people can set up bounties so people can scan the stores... businesses can let us know they have the items... when you click on that product in that line, you should see which stores carry it... search your store... see if it''s actually in stock... the last time it was checked... the scan part be the free thing in a Taste guide, and the full package is the supermarket guide."',
    'search', 'The search box answers a store plus a thing ("does Walmart carry vegan ice cream", "what is vegan at Target") from what we hold: ve_search_store over ve_product_stores. A store with nothing mapped for that thing says "Not confirmed yet", never a guess; every answer shows when it was last checked in a store, or that it comes from the Guides and has not been checked in a store.',
    'scan', 'A scan result says Vegan, Organic and GMO free as the package or Open Food Facts states them, and "not stated" when it does not; never inferred. Anyone can scan; it is the free piece of the Taste.',
    'sightings', 'A member at a store taps "I see it here" or "Not here" on a scan; it is recorded (ve_store_sightings) and a yes sets the store link''s last checked date. Business confirmation and points for sightings are not set (Sean''s call).',
    'build_order', '1. store answers in search, sightings and last checked, scan flags (built 2026-11-02); 2. scan as a Taste slide; 3. store-by-store stock (the Supermarket Guide''s store maps); 4. business confirmation; 5. points and bounties for sightings.',
    'honest_limits', 'Only dairy-free product lines are linked to stores today (86). Walmart has none for ice cream or animal crackers, so those answer Not confirmed yet until members and the crawl fill them.',
    'playbook', 've-store-scan-search')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-store-scan-search');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-store-scan-search', 'vegans-explore', 'Logan',
  'Locked by Sean 2026-11-02 ("lock it and then go"), from his 8:31 AM Fieldy recording in a Walmart. Scan an item for Vegan, Organic, GMO free (as stated, never inferred); see which stores carry its line; search a store for a thing ("does Walmart carry vegan ice cream") and get an honest answer with its last-checked date, or Not confirmed yet; members at a store confirm with I see it here / Not here; the scan is the free piece of the Taste, the full store maps stay the Supermarket Guide. Build order: store answers in search, sightings, scan flags (done 2026-11-02); scan as a Taste slide; store-by-store stock; business confirmation; points and bounties for sightings. Limit: only 86 dairy-free product lines are linked to stores; Walmart has no ice cream mapped yet. Canon canon-ve-store-scan-search.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-store-scan-search' and kind = 'decision');
