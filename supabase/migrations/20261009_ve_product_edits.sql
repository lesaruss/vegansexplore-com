-- Brand Partner product edits (Sean, 2026-10-09: "once they've claimed their listing I want them to be able to update
-- their own products... change the photos... but not mess up the format... switch out the assets... if it's low
-- quality it can give them a warning"). A partner can replace a product's or a version's photo and its description in
-- the brand's own words (ve-claims product_photo_url / product_update; photos are checked for size server side). Name,
-- ingredients and the cited Nutrition Facts stay ours. Every change is a row here with the value it replaced, so the
-- team can see and undo it. Applied by Logan through the Supabase connector.
create table if not exists public.ve_product_edits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ve_products(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  variant_key text,                       -- null: the product itself
  field text not null check (field in ('image', 'description')),
  old_value text,
  new_value text,
  meta jsonb not null default '{}'::jsonb,   -- photo width and height
  created_at timestamptz not null default now()
);
create index if not exists ve_product_edits_product on public.ve_product_edits (product_id, created_at desc);
alter table public.ve_product_edits enable row level security;
