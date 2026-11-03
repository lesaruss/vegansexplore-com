-- The Daily Pulse subscription, the first of the three doors (Sean, 2026-11-03, canon canon-ve-people-campaigns-doors).
-- A subscriber is a ve_tasters row with source 'pulse-subscribe' (email, consent, confirm, unsubscribe are the Taster's), with the Taster
-- sequence off for them (ve-nurture skips that source). Their cities and frequency, the double opt-in and the send log live here.

alter table public.ve_tasters
  add column if not exists pulse_cities text[] not null default '{}',
  add column if not exists pulse_frequency text not null default 'daily',
  add column if not exists pulse_confirmed_at timestamptz,
  add column if not exists pulse_unsubscribed_at timestamptz,
  add column if not exists pulse_last_sent_at timestamptz,
  add column if not exists pulse_issue_count integer not null default 0;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 've_tasters_pulse_frequency_check') then
    alter table public.ve_tasters add constraint ve_tasters_pulse_frequency_check check (pulse_frequency in ('daily', 'weekly'));
  end if;
end $$;

create index if not exists ve_tasters_pulse_idx on public.ve_tasters (pulse_confirmed_at) where pulse_confirmed_at is not null and pulse_unsubscribed_at is null;

-- One row per issue sent, so nothing goes twice.
create table if not exists public.ve_pulse_sends (
  id uuid primary key default gen_random_uuid(),
  taster_id uuid not null references public.ve_tasters(id) on delete cascade,
  issue text not null,                     -- 'd:<Eastern date>' for a daily, 'w:<Eastern date>' for a weekly
  cities text[] not null default '{}',
  result text,                             -- sent | already_sent | suppressed | invalid | failed
  email_send_id text,
  error text,
  sent_at timestamptz not null default now(),
  unique (taster_id, issue)
);
alter table public.ve_pulse_sends enable row level security;

-- Subscribers per city, the number to show sponsors (confirmed, still subscribed).
create or replace function public.ve_pulse_subscriber_counts()
 returns table (city text, daily bigint, weekly bigint, total bigint)
 language sql stable security definer set search_path to 'public'
as $$
  select c as city, count(*) filter (where pulse_frequency = 'daily'), count(*) filter (where pulse_frequency = 'weekly'), count(*)
  from ve_tasters t, unnest(t.pulse_cities) c
  where t.pulse_confirmed_at is not null and t.pulse_unsubscribed_at is null and t.name not ilike '%[TEST]%'
  group by c order by count(*) desc;
$$;
revoke all on function public.ve_pulse_subscriber_counts() from public, anon, authenticated;

-- The issue's content for one city: its latest published Daily Pulse topic (briefing stories, the From Vegans Explore house section).
create or replace function public.ve_pulse_issue_city(p_city text, p_days integer default 1)
 returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'published_at', published_at,
           'stories', coalesce(briefing->'stories', '[]'::jsonb), 'house', briefing->'house') order by published_at desc), '[]'::jsonb)
  from (select id, title, published_at, briefing from ve_board_posts
        where kind = 'topic' and status = 'open' and published_at is not null and community_slug = p_city
          and published_at >= now() - make_interval(days => greatest(p_days, 1))        order by published_at desc limit 7) x;
$$;
revoke all on function public.ve_pulse_issue_city(text, integer) from public, anon, authenticated;

-- Dark until Sean turns it on in Depot > Outreach (or the setting): nothing is shown or sent while 'on' is false.
insert into public.ve_site_settings (key, value)
values ('pulse_subscribe', '{"on": false, "send_hour": 9, "per_tick": 40, "membership_line_every": 5}'::jsonb)
on conflict (key) do nothing;

-- Every 15 minutes; ve-pulse-subscribe sends only inside its hours and only while the switch is on.
select cron.unschedule('ve-pulse-subscribe') where exists (select 1 from cron.job where jobname = 've-pulse-subscribe');
select cron.schedule('ve-pulse-subscribe', '*/15 * * * *', $$select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-pulse-subscribe',
  headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
  body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 60000)$$);
