-- The owner edits their own page (Sean, 2026-10-10: "go ahead and build the owner page editing"). ve-claims owner_update,
-- owner_photo_done and owner_photo_remove change the listing at once and write one row here per change, with the value it
-- replaced, so Depot > Business outreach > New partners can undo it (ve-outreach listing_edit_undo).
-- field: tagline, description, phone, website, instagram, booking_url, uber_eats_url, doordash_url, address_street,
-- address_zip, hours (google_hours_json), logo (logo_url), photo_add / photo_remove (gallery_urls).
create table if not exists public.ve_listing_edits (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  meta jsonb not null default '{}'::jsonb,
  undone_at timestamptz,
  undone_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ve_listing_edits_listing_idx on public.ve_listing_edits (listing_id, created_at desc);
alter table public.ve_listing_edits enable row level security;
