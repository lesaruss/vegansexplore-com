-- Grocery stores and the products they carry (Sean, 2026-10-08).
--
-- "I want us to have a market section with the different supermarkets, and track what products are
-- sold in those supermarkets. As we're bringing different products into these guides, it should
-- automatically map to a supermarket that carries them, and that supermarket should then show that
-- product." Each supermarket is a Directory listing (category Markets, tag ve-grocery-store) with its
-- own page; its Vegan aisle lists every Guide product mapped to it.
--
--   ve_products               one row per product a Guide lists (brand listing + product type)
--   ve_product_stores         which store carries which product, and how to buy it there
--   ve_store_aliases          the names a Guide writes ("Kroger family", "HEB") -> the store listing
--   ve_guide_product_sources  which listings.details key holds a Guide's products. A new Guide with
--                             products (Vegan meats, seasonings...) is one row here.
--
-- ve_products_sync(listing) runs whenever a listing's details change (trigger), so a Guide's products
-- and their stores fill in on their own. Buy link, best first: an affiliate deal (a /go/ tracked link,
-- affiliate_link_code), the product's own page at that store (buy_url), the store's search for the
-- product (listings.details.store.search_url, used only when search_checked is results or loads),
-- then the store's website.

create table if not exists public.ve_guide_product_sources (
  details_key text primary key,
  guide_slug text not null
);
insert into public.ve_guide_product_sources (details_key, guide_slug)
values ('dairy_guide', 'vegan-dairy-guide') on conflict do nothing;

create table if not exists public.ve_products (
  id uuid primary key default gen_random_uuid(),
  brand_listing_id uuid not null references public.listings(id) on delete cascade,
  product_type text not null,
  name text not null default '',
  made_from text,
  note text,
  guides text[] not null default '{}',
  source text not null default 'guide',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_listing_id, product_type, name)
);
create index if not exists ve_products_guides_idx on public.ve_products using gin (guides);

create table if not exists public.ve_store_aliases (
  alias text primary key,                       -- lower case, as a Guide writes it
  store_listing_id uuid not null references public.listings(id) on delete cascade
);

create table if not exists public.ve_product_stores (
  product_id uuid not null references public.ve_products(id) on delete cascade,
  store_listing_id uuid not null references public.listings(id) on delete cascade,
  buy_url text,                                 -- the product's own page at this store, once confirmed
  affiliate_link_code text,                     -- a ve_links code: vegansexplore.com/go/<code>
  source text not null default 'guide',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  removed_at timestamptz,                       -- the Guide stopped naming this store (kept, not deleted)
  primary key (product_id, store_listing_id)
);
create index if not exists ve_product_stores_store_idx on public.ve_product_stores (store_listing_id);

alter table public.ve_guide_product_sources enable row level security;
alter table public.ve_products enable row level security;
alter table public.ve_store_aliases enable row level security;
alter table public.ve_product_stores enable row level security;
create policy "public read" on public.ve_guide_product_sources for select using (true);
create policy "public read" on public.ve_products for select using (true);
create policy "public read" on public.ve_store_aliases for select using (true);
create policy "public read" on public.ve_product_stores for select using (true);

-- The Guide's products for one listing -> ve_products and ve_product_stores. Products and store rows
-- that came from a Guide and are no longer in it are marked, never deleted (a store link gets removed_at,
-- a product loses that Guide's slug); anything added by hand (source <> 'guide') is left alone.
-- (Applied 2026-10-08 statement by statement: the Supabase connector holds any DELETE or DROP for a
-- confirmation, so this file has neither.)
create or replace function public.ve_products_sync(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  d jsonb; src record; item jsonb; pid uuid; w text; store uuid;
  keep_products uuid[] := '{}'; keep_stores uuid[];
begin
  select details into d from listings where id = p_listing;
  for src in select details_key, guide_slug from ve_guide_product_sources loop
    if d is not null and jsonb_typeof(d -> src.details_key) = 'array' then
      for item in select * from jsonb_array_elements(d -> src.details_key) loop
        continue when coalesce(item ->> 'cat', '') = '';
        insert into ve_products (brand_listing_id, product_type, name, made_from, note, guides)
        values (p_listing, item ->> 'cat', coalesce(item ->> 'name', ''), item ->> 'base', item ->> 'note', array[src.guide_slug])
        on conflict (brand_listing_id, product_type, name) do update
          set made_from = excluded.made_from, note = excluded.note, updated_at = now(),
              guides = (select array_agg(distinct g) from unnest(ve_products.guides || excluded.guides) g)
        returning id into pid;
        keep_products := keep_products || pid;
        keep_stores := '{}';
        for w in select lower(trim(x)) from regexp_split_to_table(coalesce(item ->> 'where', ''), '[[:space:]]*,[[:space:]]*|[[:space:]]+and[[:space:]]+|;') x loop
          select store_listing_id into store from ve_store_aliases where alias = w;
          if store is not null then
            insert into ve_product_stores (product_id, store_listing_id) values (pid, store)
              on conflict (product_id, store_listing_id) do update set removed_at = null;
            keep_stores := keep_stores || store;
          end if;
        end loop;
        update ve_product_stores set removed_at = now()
          where product_id = pid and source = 'guide' and removed_at is null and not (store_listing_id = any (keep_stores));
      end loop;
    end if;
    -- This Guide no longer lists a product: take the Guide off it (a product with no Guide is not shown).
    update ve_products set guides = array_remove(guides, src.guide_slug), updated_at = now()
      where brand_listing_id = p_listing and src.guide_slug = any (guides) and not (id = any (keep_products));
  end loop;
end $$;

create or replace function public.ve_products_sync_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from ve_guide_product_sources s where new.details ? s.details_key or (tg_op = 'UPDATE' and old.details ? s.details_key)) then
    perform ve_products_sync(new.id);
  end if;
  return new;
end $$;
create trigger trg_ve_products_sync after insert or update of details on public.listings
  for each row execute function public.ve_products_sync_trigger();

-- A store added later picks up every product that already names it.
create or replace function public.ve_store_alias_resync()
returns trigger language plpgsql security definer set search_path = public as $$
declare l uuid;
begin
  for l in select distinct id from listings where exists (select 1 from ve_guide_product_sources s where details ? s.details_key) loop
    perform ve_products_sync(l);
  end loop;
  return null;
end $$;
create trigger trg_ve_store_alias_resync after insert or update on public.ve_store_aliases
  for each statement execute function public.ve_store_alias_resync();

-- Target already had an empty, quarantined placeholder row (slug target, from an Instagram crawl);
-- it was turned into the Target store listing rather than adding a duplicate name.
update public.listings set category = 'Markets', specialty = 'Grocery store', status = 'approved', website = 'https://www.target.com'
  where slug = 'target' and status = 'quarantined' and category = 'Uncategorized';

-- The stores the Dairy Guide names. search_checked: results = the search page returned the product
-- (checked 2026-10-08), loads = the search page answers, blocked = the store blocks automated checks
-- (search not used until someone confirms it in a browser), wrong = that address does not search.
with s(slug, name, website, search_url, checked, aliases) as (values
  ('whole-foods-market', 'Whole Foods Market', 'https://www.wholefoodsmarket.com', 'https://www.wholefoodsmarket.com/search?text={q}', 'loads', array['whole foods', 'select whole foods', 'whole foods market']),
  ('kroger', 'Kroger', 'https://www.kroger.com', 'https://www.kroger.com/search?query={q}', 'blocked', array['kroger', 'kroger family']),
  ('walmart', 'Walmart', 'https://www.walmart.com', 'https://www.walmart.com/search?q={q}', 'blocked', array['walmart']),
  ('target', 'Target', 'https://www.target.com', 'https://www.target.com/s?searchTerm={q}', 'results', array['target']),
  ('sprouts-farmers-market', 'Sprouts Farmers Market', 'https://www.sprouts.com', 'https://shop.sprouts.com/search?search_term={q}', 'loads', array['sprouts']),
  ('shoprite', 'ShopRite', 'https://www.shoprite.com', null, 'blocked', array['shoprite']),
  ('stop-and-shop', 'Stop & Shop', 'https://stopandshop.com', null, 'blocked', array['stop & shop', 'stop and shop']),
  ('albertsons', 'Albertsons', 'https://www.albertsons.com', 'https://www.albertsons.com/shop/search-results.html?q={q}', 'blocked', array['albertsons']),
  ('heb', 'H-E-B', 'https://www.heb.com', null, 'blocked', array['heb', 'h-e-b']),
  ('wegmans', 'Wegmans', 'https://www.wegmans.com', null, 'wrong', array['wegmans']),
  ('giant-food', 'Giant', 'https://giantfood.com', null, 'blocked', array['giant']),
  ('hannaford', 'Hannaford', 'https://www.hannaford.com', null, 'blocked', array['hannaford']),
  ('food-lion', 'Food Lion', 'https://www.foodlion.com', null, 'blocked', array['food lion']),
  ('publix-super-markets', 'Publix', 'https://www.publix.com', 'https://www.publix.com/search?searchTerm={q}', 'results', array['publix']),
  ('safeway', 'Safeway', 'https://www.safeway.com', 'https://www.safeway.com/shop/search-results.html?q={q}', 'blocked', array['safeway']),
  ('qfc', 'QFC', 'https://www.qfc.com', 'https://www.qfc.com/search?query={q}', 'blocked', array['qfc']),
  ('jewel-osco', 'Jewel-Osco', 'https://www.jewelosco.com', 'https://www.jewelosco.com/shop/search-results.html?q={q}', 'blocked', array['jewel-osco', 'jewel osco']),
  ('costco', 'Costco', 'https://www.costco.com', 'https://www.costco.com/s?keyword={q}', 'loads', array['costco']),
  ('amazon-com', 'Amazon', 'https://www.amazon.com', 'https://www.amazon.com/s?k={q}', 'blocked', array['amazon']),
  ('instacart', 'Instacart', 'https://www.instacart.com', 'https://www.instacart.com/store/s?k={q}', 'results', array['instacart'])
), ins as (
  insert into public.listings (name, slug, category, specialty, description, location, website, status, initials, color, tags, details)
  select name, slug, 'Markets', 'Grocery store',
    'A grocery store that carries Vegan products. Its Vegan aisle lists the products our Guides have found here.',
    '', website, 'approved', upper(left(name, 1)), '#2E6B8A', array['ve-grocery-store'],
    jsonb_build_object('store', jsonb_build_object('search_url', search_url, 'search_checked', checked))
  from s where not exists (select 1 from public.listings l where l.slug = s.slug)
  returning id, slug
)
insert into public.ve_store_aliases (alias, store_listing_id)
select a, coalesce(ins.id, l.id) from s
  left join ins on ins.slug = s.slug
  left join public.listings l on l.slug = s.slug
  cross join lateral unnest(s.aliases) a
on conflict (alias) do update set store_listing_id = excluded.store_listing_id;
