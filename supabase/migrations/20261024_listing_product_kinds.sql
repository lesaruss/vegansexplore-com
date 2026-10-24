-- What a food brand makes (Sean, 2026-10-24: "most food brands are sold nationally to everybody... what I would want to know
-- is like, what are the dairy brands? What are the meat substitutes? What are the supplements?"). The Directory's Food Brands
-- section filters by it instead of by city (/public/ve-region-directory.js KINDS and SUB_FILTERS); set in the listing editor
-- (ve-claims admin_listing). Keep the slugs in step with KINDS there and in /public/ve-listing-admin.js.
alter table public.listings add column if not exists product_kinds text[] not null default '{}';
alter table public.listings add constraint listings_product_kinds_known
  check (product_kinds <@ array['dairy','meat','egg','seafood','snacks','drinks','protein','pantry','baked','frozen']::text[]);

-- The Dairy Guide's brands make dairy alternatives (their ve_products rows).
update public.listings l set product_kinds = array['dairy']
  where l.status = 'approved' and l.category = 'Food Brands' and exists (select 1 from public.ve_products p where p.brand_listing_id = l.id);
-- The other five, from what each one makes.
update public.listings set product_kinds = array['snacks', 'baked'] where status = 'approved' and slug = 'calypso-bites';
update public.listings set product_kinds = array['egg'] where status = 'approved' and slug = 'just-egg';
update public.listings set product_kinds = array['snacks'] where status = 'approved' and slug = 'rhythm-superfoods';
update public.listings set product_kinds = array['frozen', 'meat'] where status = 'approved' and slug = 'sweet-earth-foods';
update public.listings set product_kinds = array['meat'] where status = 'approved' and slug = 'tofurky';
