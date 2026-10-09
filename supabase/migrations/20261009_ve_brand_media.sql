-- Brand Partner media (Sean, 2026-10-09): "We have a media section, media assets, where they can upload their graphics
-- and their video contents that they want us [to use]. Anything that we need, they can upload it directly from this
-- console." A partner uploads into a private bucket through a one-object signed URL from ve-claims (media_upload_url);
-- each file is a row here. Nothing is public: ve-claims hands out short-lived signed links to the partner, the account
-- manager and super admins only. Applied by Logan through the Supabase connector.

insert into storage.buckets (id, name, public, file_size_limit)
values ('brand-partner-media', 'brand-partner-media', false, 524288000)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create table if not exists public.ve_brand_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  path text not null unique,              -- object key in brand-partner-media
  file_name text not null,
  content_type text,
  bytes bigint,
  kind text not null default 'other' check (kind in ('logo', 'product_photo', 'graphic', 'video', 'other')),
  note text check (char_length(note) <= 500),
  status text not null default 'uploading' check (status in ('uploading', 'received', 'in_use', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_brand_media_listing on public.ve_brand_media (listing_id, created_at desc);

-- Only the service role (ve-claims) reads and writes these rows.
alter table public.ve_brand_media enable row level security;
