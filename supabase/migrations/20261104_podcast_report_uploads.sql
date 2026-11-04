-- BrandDesk > Insights > Podcast: pages from Captivate's own dashboard (where people listen, devices, apps, quarterly reports),
-- uploaded as screenshots or PDFs for what its API does not give. Playbook podcast-network-transcript-upload (VE Podcast Network).
insert into storage.buckets (id, name, public, file_size_limit)
values ('podcast-reports', 'podcast-reports', false, 26214400)
on conflict (id) do nothing;

create table if not exists public.ve_podcast_uploads (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null,
  kind text not null check (kind in ('places','devices','apps','overview','other')),
  period_from date not null,
  period_to date not null,
  note text,
  file_name text not null,
  content_type text not null,
  size_bytes bigint,
  storage_path text not null unique,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid,
  check (period_from <= period_to)
);
alter table public.ve_podcast_uploads enable row level security;
create index if not exists ve_podcast_uploads_brand_idx on public.ve_podcast_uploads (brand_slug, period_to desc) where removed_at is null;
