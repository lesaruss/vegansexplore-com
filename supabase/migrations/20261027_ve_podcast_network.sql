-- The Vegans Explore Podcast Network (Sean, 2026-10-27: "I want people to want to join the network so that way they can be part
-- of our sponsorship conversations... They don't got to post anything on their podcast unless they're involved in a campaign...
-- you just got to become a member"). Applications from /media/network, through ve-podcast network_apply; Sean reviews them.
create table if not exists public.ve_podcast_network_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,   -- the podcast's Directory listing, when we found it
  podcast_name text not null,
  rss_url text,
  apple_url text,
  website text,
  hosts text,
  monthly_downloads text,        -- a range they picked (under_1k ... over_100k, unsure)
  stats_source text,             -- where that number comes from (their host, Apple, Spotify...)
  release_cadence text,
  audience text,                 -- where most listeners are
  socials jsonb not null default '{}'::jsonb,   -- {instagram, tiktok, youtube}
  social_followers text,
  interests text[] not null default '{}',       -- sponsorships, promotion, promos, production, clips
  notes text,
  contact_name text,
  contact_email text,
  member_active boolean not null default false, -- a Founding Member when they applied (membership is how you join)
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined')),
  review_note text,
  created_at timestamptz not null default now()
);
create index if not exists ve_podcast_network_applications_status on public.ve_podcast_network_applications (status, created_at desc);
alter table public.ve_podcast_network_applications enable row level security;
-- No policies: only ve-podcast (service role) reads and writes it.

-- Each day the feeds are read again, so a podcast's status follows its latest episode (ve-podcast refresh, x-cron-secret).
select cron.schedule('ve-podcast-refresh', '17 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-podcast',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"refresh"}'::jsonb, timeout_milliseconds := 150000)
$$);
