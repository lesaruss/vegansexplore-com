-- ve-holiday-guide: dish photos and menu scans on the holiday menu form (Sean, 2026-11-07: "they should be able to upload an image...
-- like we did with the logos... let's also have it where they can scan their menu. Drop an image of their menu or a PDF").
-- Dish photos go to the public bucket vegan-media (media/holiday-menus/<slug>/), squared in the browser by the logo editor.
-- Menu scans go to the private bucket holiday-menu-scans and are read by ve-holiday scan_read (Claude); every read is a row here,
-- for the daily limit. RLS on, no policies. Safe to run twice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('holiday-menu-scans', 'holiday-menu-scans', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create table if not exists ve_holiday_menu_reads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  listing_id uuid references listings(id) on delete set null,
  paths text[] not null default '{}',
  items_found int,
  error text,
  created_at timestamptz not null default now()
);
alter table ve_holiday_menu_reads enable row level security;
create index if not exists ve_holiday_menu_reads_member on ve_holiday_menu_reads (member_id, created_at desc);
