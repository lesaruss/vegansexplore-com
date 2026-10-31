-- BrandDesk: each client's Cartridge, stored (canon canon-ve-front-of-house v5 to v7). The brand kit page (/business/brand?listing=<slug>)
-- reads and saves it through the ve-brand-kit edge function; RLS on with no policies, so nothing reads it any other way.
--   ve_cartridges         one per listing: the whole Cartridge (data), its overall status, who made it and last changed it
--   ve_cartridge_people   who may work on it besides the listing's owner and super admins: an editor (every section) or a
--                         photographer (photos and menu photos only); added by the owner or a super admin
--   ve_cartridge_edits    every save: the section, the state it was saved in, what it replaced and what it became
create table if not exists public.ve_cartridges (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  data jsonb not null,
  status text not null default 'building' check (status in ('building', 'locked', 'launched', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create table if not exists public.ve_cartridge_people (
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null check (role in ('editor', 'photographer')),
  added_by uuid,
  added_at timestamptz not null default now(),
  primary key (listing_id, member_id)
);
create table if not exists public.ve_cartridge_edits (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid,
  section text not null,
  state text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);
create index if not exists ve_cartridge_edits_listing on public.ve_cartridge_edits (listing_id, at desc);
create index if not exists ve_cartridge_people_member on public.ve_cartridge_people (member_id);
alter table public.ve_cartridges enable row level security;
alter table public.ve_cartridge_people enable row level security;
alter table public.ve_cartridge_edits enable row level security;
