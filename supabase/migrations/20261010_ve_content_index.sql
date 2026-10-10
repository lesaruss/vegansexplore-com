-- The content index (Sean, 2026-10-10: "go ahead and start on the content index"). Step 1: one timestamped transcript per
-- episode or interview (ve_pulse_content). segments: [{s: start seconds, e: end seconds, t: text}]. source: youtube (a
-- person's captions), youtube_auto (YouTube's automatic captions), turboscribe (an SRT export), manual. ve-content-index
-- fills it. Step 2 (moments tagged by topic) and step 3 (search, clips) read from here.
create table if not exists public.ve_content_transcripts (
  content_id uuid primary key references public.ve_pulse_content(id) on delete cascade,
  source text not null check (source in ('youtube', 'youtube_auto', 'turboscribe', 'manual')),
  language text,
  segments jsonb not null default '[]'::jsonb,
  text text,
  words integer,
  duration_seconds integer,
  status text not null default 'ready' check (status in ('ready', 'no_captions', 'failed')),
  note text,
  fetched_at timestamptz not null default now()
);
alter table public.ve_content_transcripts enable row level security;

create or replace function public.ve_content_index_status()
returns table (show text, episodes bigint, on_youtube bigint, timestamped bigint, no_captions bigint, failed bigint, hours numeric)
language sql stable security definer set search_path to 'public' as $fn$
  select c.podcast_show, count(*), count(*) filter (where c.youtube_id is not null),
    count(t.*) filter (where t.status = 'ready'), count(t.*) filter (where t.status = 'no_captions'), count(t.*) filter (where t.status = 'failed'),
    round(sum(t.duration_seconds) filter (where t.status = 'ready') / 3600.0, 1)
  from ve_pulse_content c left join ve_content_transcripts t on t.content_id = c.id
  where c.podcast_show is not null group by 1 order by 2 desc
$fn$;
revoke all on function public.ve_content_index_status() from public, anon, authenticated;
grant execute on function public.ve_content_index_status() to service_role;
