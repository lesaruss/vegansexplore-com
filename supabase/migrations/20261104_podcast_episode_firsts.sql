-- BrandDesk > Insights > Podcast: each episode's first 7 and first 30 days of downloads (the feedback-loop numbers), counted once when those
-- days are over and kept. Playbook podcast-network-transcript-upload (VE Podcast Network).
create table if not exists public.ve_podcast_episode_firsts (
  brand_slug text not null,
  show_key text not null,
  episode_id text not null,
  published date not null,
  d7 integer,
  d30 integer,
  updated_at timestamptz not null default now(),
  primary key (brand_slug, show_key, episode_id)
);
alter table public.ve_podcast_episode_firsts enable row level security;
