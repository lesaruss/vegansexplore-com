-- Directory "Near me" (Sean, 2026-11-11): US ZIP center points from the Census Gazetteer (ZCTA 2024),
-- for a visitor's ZIP and for listings that only have a ZIP. Public read; no personal data.
create table if not exists public.ve_zip_centroids (
  zip text primary key,
  lat double precision not null,
  lng double precision not null,
  source text not null default 'census-gazetteer-zcta-2024'
);
alter table public.ve_zip_centroids enable row level security;
drop policy if exists "zip centroids are public" on public.ve_zip_centroids;
create policy "zip centroids are public" on public.ve_zip_centroids for select to anon, authenticated using (true);
comment on table public.ve_zip_centroids is 'US ZIP (ZCTA) center points from the Census Gazetteer, for the Directory Near me button: a visitor''s ZIP and listings that only have a ZIP. Public read; no personal data.';
