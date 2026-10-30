-- YouTube playlists we keep fresh for a client site (Sean, 2026-10-30, on Brooke Sellers' meatlessmuscle.com: "are her videos up to
-- date on her Meatless Muscle website? And will it stay up to date?"). Her five series pages were hand-typed lists and two had fallen
-- behind (Vegan Bikini Prep Diaries 67 of 73, Road to Stage 2027 4 of 9). Each series page now asks ve-youtube `playlist` for its list.
--
-- Only playlists listed here are served, so the public action cannot be used to spend our YouTube quota on any playlist. ve-youtube
-- reads a playlist again when it is older than 6 hours (on a visit, or in the hourly refresh cron): every item, newest first, with its
-- length, about 2 to 6 API units a read. RLS on, no policies: only the function reads it. Safe to run twice.

create table if not exists ve_youtube_playlists (
  playlist_id text primary key check (playlist_id ~ '^PL[\w-]{10,64}$'),
  listing_id uuid references listings(id) on delete set null,
  label text,
  site text,
  title text,
  item_count int,
  videos jsonb not null default '[]'::jsonb,
  fetched_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table ve_youtube_playlists enable row level security;

insert into ve_youtube_playlists (playlist_id, listing_id, label, site)
select p.id, (select id from listings where slug = 'miss-meatless-muscle-youtube'), p.label, 'meatlessmuscle.com'
from (values
  ('PL_D-rsI-qWKNGkMRXsTXaDRoaFX3vH92s', 'Vegan Bikini Prep Diaries'),
  ('PL_D-rsI-qWKMDrWw4Z58-bwK-cmLcPgAC', 'Road to Stage 2027'),
  ('PL_D-rsI-qWKN0eToki3B52QbNS_oBtTWe', '2025 Competition Season'),
  ('PL_D-rsI-qWKO0CnUCBQiQW7mi-C_QeA0A', 'Client Success Stories'),
  ('PL_D-rsI-qWKOs7_vA5AM5Ll3Y34kLFSzM', 'Nutrition & Fitness Tips')
) as p(id, label)
on conflict (playlist_id) do nothing;
