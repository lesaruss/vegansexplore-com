-- BrandDesk: a brand's own kit (Sean, 2026-10-31: "Vegans Explore has its own branding... we need to have it as part of this as
-- well, because we were creating someone else's brand with the website example"). A client's kit is one per Directory listing
-- (ve_cartridges); a brand that is not a listing (Vegans Explore itself) keeps its kit here, by brand slug, and a listing's kit
-- can name it as its parent (data.meta.parent), as the Vegans Explore Podcast's does. Read and saved only through ve-brand-kit
-- (kit_get / kit_create / kit_save with `brand`), super admins only; RLS on with no policies.
create table if not exists public.ve_brand_cartridges (
  brand_slug text primary key check (brand_slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  data jsonb not null,
  status text not null default 'building' check (status in ('building', 'locked', 'launched', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.ve_brand_cartridges enable row level security;

-- Every save of a brand kit is logged with the client kits' saves, by brand slug instead of listing.
alter table public.ve_cartridge_edits alter column listing_id drop not null;
alter table public.ve_cartridge_edits add column if not exists brand_slug text;
create index if not exists ve_cartridge_edits_brand on public.ve_cartridge_edits (brand_slug, at desc) where brand_slug is not null;
