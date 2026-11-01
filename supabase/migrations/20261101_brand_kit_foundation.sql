-- BrandDesk, the foundation (canon canon-branddesk-production-wing: "Approved by the client means locked... A locked part changes only
-- on a request with a reason, approved by the owner, kept on record." and "No module opens until the kit is locked and the brand
-- launches"). Built 2026-11-01 (Sean: "start the next step in the build order: the brand kit foundation inside BrandDesk").
-- One row per request to change a locked part of a kit, a brand's (brand_slug) or a listing's (listing_id). Read and written only by
-- ve-brand-kit (RLS on, no policies).
create table if not exists public.ve_kit_change_requests (
  id uuid primary key default gen_random_uuid(),
  brand_slug text,
  listing_id uuid references public.listings(id) on delete cascade,
  section text not null,
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  asked_by uuid,
  asked_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  check ((brand_slug is null) <> (listing_id is null))
);
alter table public.ve_kit_change_requests enable row level security;
create index if not exists ve_kit_change_requests_brand on public.ve_kit_change_requests (brand_slug, asked_at desc) where brand_slug is not null;
create index if not exists ve_kit_change_requests_listing on public.ve_kit_change_requests (listing_id, asked_at desc) where listing_id is not null;
-- One open request per part of a kit.
create unique index if not exists ve_kit_change_requests_open on public.ve_kit_change_requests (coalesce(brand_slug, listing_id::text), section) where status = 'pending';
