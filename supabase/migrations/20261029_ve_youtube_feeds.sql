-- YouTube channels on their listings (Sean, 2026-10-29: "any new video that pops up will show on their page... thumbnails of their
-- latest videos fed right through it. So you can just watch everything on this page"). A YouTube listing names its channel in
-- listings.details.youtube_channel_id; the edge function ve-youtube keeps its latest 50 uploads here from YouTube's Data API and reads
-- them again after 6 hours (cron ve-youtube-refresh, hourly). Only ve-youtube reads and writes this table.
create table if not exists public.ve_youtube_feeds (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  channel_id text not null,
  title text,
  handle text,
  thumb text,
  subscribers bigint,
  video_count integer,
  videos jsonb not null default '[]'::jsonb,
  fetched_at timestamptz,
  error text
);
alter table public.ve_youtube_feeds enable row level security;

-- Hourly: ve-youtube reads up to 20 channels whose videos are older than 6 hours.
select cron.schedule('ve-youtube-refresh', '43 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-youtube',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"refresh"}'::jsonb, timeout_milliseconds := 150000)
$$);
