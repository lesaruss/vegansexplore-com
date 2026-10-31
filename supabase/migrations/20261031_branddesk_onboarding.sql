-- BrandDesk onboarding (canon canon-ve-front-of-house, the build order's step after the contract and Stripe; 2026-10-31).
-- After a client pays: the welcome checklist, their original website archived at onboarding, their Library (every file we make
-- for them, full size once the setup is paid in full) and their asset sheet (drawn from their Cartridge, ve_cartridges).
-- "They rent the service, they own the assets" (Sean, 2026-10-31, canon v2).

alter table public.ve_branddesk_accounts
  add column if not exists onboarding jsonb not null default '{}'::jsonb,   -- {step: {done_at, by, note}}
  add column if not exists setup_paid_at timestamptz,                         -- full-size downloads open from here
  add column if not exists website_url text;                                  -- the site we archive at onboarding

-- The Library: one row per file. Files live in the private bucket branddesk-library at <listing slug>/<kind>/<file>.
create table if not exists public.ve_branddesk_files (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  kind text not null check (kind in ('photo', 'video', 'logo', 'brand', 'graphic', 'menu_board', 'document', 'archive')),
  title text not null,
  path text not null,
  bytes bigint,
  mime text,
  width int,
  height int,
  note text,
  added_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references public.members(id)
);
create index if not exists ve_branddesk_files_account on public.ve_branddesk_files(account_id) where removed_at is null;
alter table public.ve_branddesk_files enable row level security;

-- Website archives: a copy of every page's HTML and the pictures, styles and fonts it uses, as one ZIP in the Library.
create table if not exists public.ve_branddesk_archives (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  url text not null,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  platform text,           -- wix, squarespace, wordpress, shopify, godaddy, weebly, other
  pages int not null default 0,
  assets int not null default 0,
  bytes bigint not null default 0,
  file_id uuid references public.ve_branddesk_files(id),
  note text,
  started_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists ve_branddesk_archives_account on public.ve_branddesk_archives(account_id);
alter table public.ve_branddesk_archives enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('branddesk-library', 'branddesk-library', false, 524288000)
on conflict (id) do nothing;
