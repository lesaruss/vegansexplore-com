-- Podcast episodes on our listings (Sean, 2026-10-27: "is it possible to add an RSS of the podcast so that way it actually
-- populates on their listing? ... people can actually just listen to the episodes on our platform... they can save the
-- episodes. But it's all pulling from their RSS feed"). The edge function ve-podcast reads the feed, keeps the latest 300
-- episodes here, and serves them to the listing's Episodes tab; members save episodes to My List.

alter table public.listings add column if not exists rss_url text;
comment on column public.listings.rss_url is 'A podcast''s RSS feed. Found from its Apple Podcasts id by ve-podcast when empty; set by hand in the listing editor.';

create table if not exists public.ve_podcast_feeds (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  rss_url text not null,
  title text,
  image text,
  episodes jsonb not null default '[]'::jsonb,   -- [{guid, title, date, duration, audio, type, image, summary, link, season, episode}], newest first
  episode_count int not null default 0,          -- all items in the feed, before the 300 cap
  fetched_at timestamptz,
  error text,
  error_at timestamptz
);
alter table public.ve_podcast_feeds enable row level security;

create table if not exists public.ve_episode_saves (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  guid text not null,
  title text not null,
  audio_url text not null,
  audio_type text,
  published_at timestamptz,
  duration_s int,
  image text,
  created_at timestamptz not null default now(),
  unique (member_id, listing_id, guid)
);
create index if not exists ve_episode_saves_member on public.ve_episode_saves (member_id, created_at desc);
alter table public.ve_episode_saves enable row level security;
-- No policies: only ve-podcast (service role) reads and writes both tables.
