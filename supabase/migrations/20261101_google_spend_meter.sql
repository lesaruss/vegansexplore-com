-- Google spend meter and caps (Sean, 2026-11-01: "we need to be monitoring this carefully and setting caps so we don't go over my
-- budget"). Every Google Places request our functions send is counted here, per job per day (the day is Google's: midnight Pacific).
-- A background job (backlog check, essentials, About writer, check-ups) runs only when the day's allowance has room for its batch;
-- something a person starts (Add a listing, the free audit, Find on Google) keeps its own share, so background jobs never use it up.
-- The caps, the people's share, Google's list prices and free monthly amounts, and the monthly budget live in ve_site_settings
-- 'google_budget' (change a row, no code). The cost shown is an estimate at list price; Google's bill (Billing > Reports) is the truth.

create table if not exists public.ve_google_usage (
  day date not null,
  kind text not null check (kind in ('search','details')),
  job text not null,
  calls integer not null default 0,
  primary key (day, kind, job)
);
alter table public.ve_google_usage enable row level security;

insert into public.ve_site_settings (key, value, updated_at)
values ('google_budget', jsonb_build_object(
  'daily', jsonb_build_object('search', 40, 'details', 40),
  'background_share', 0.6,
  'price_per_1000', jsonb_build_object('search', 40, 'details', 25),
  'free_per_month', jsonb_build_object('search', 1000, 'details', 1000),
  'monthly_budget_usd', 15,
  'note', 'Logan''s defaults 2026-11-01, Sean''s to change. Prices and free amounts are Google''s list prices for the field tiers we request; check them against the bill.'
), now())
on conflict (key) do nothing;

create or replace function public.ve_google_day() returns date language sql stable as $$
  select (now() at time zone 'America/Los_Angeles')::date
$$;

-- Count requests already sent (counting never blocks a request; the room check comes before a job starts).
create or replace function public.ve_google_count(p_kind text, p_job text, p_n integer default 1) returns void
language sql security definer set search_path = public as $$
  insert into ve_google_usage (day, kind, job, calls) values (ve_google_day(), p_kind, left(coalesce(p_job, 'unknown'), 80), greatest(p_n, 0))
  on conflict (day, kind, job) do update set calls = ve_google_usage.calls + excluded.calls
$$;

-- How many requests of this kind are left today: background jobs get their share of the cap, people the whole cap.
create or replace function public.ve_google_room(p_kind text, p_background boolean default true) returns integer
language sql stable security definer set search_path = public as $$
  with s as (select value v from ve_site_settings where key = 'google_budget'),
  cap as (select coalesce(((select v from s)->'daily'->>p_kind)::numeric, 0)
                 * case when p_background then coalesce(((select v from s)->>'background_share')::numeric, 0.6) else 1 end c),
  used as (select coalesce(sum(calls), 0) u from ve_google_usage where day = ve_google_day() and kind = p_kind)
  select greatest(0, floor((select c from cap) - (select u from used)))::integer
$$;

-- What the Depot shows: today, this month with the estimated cost against the budget, and each day by job.
create or replace function public.ve_google_report(p_days integer default 31) returns jsonb
language sql stable security definer set search_path = public as $$
  with s as (select value v from ve_site_settings where key = 'google_budget'),
  m as (select kind, sum(calls)::int calls from ve_google_usage where day >= date_trunc('month', ve_google_day())::date group by kind),
  est as (select kind, calls,
            round(greatest(0, calls - coalesce(((select v from s)->'free_per_month'->>kind)::int, 0))
                  * coalesce(((select v from s)->'price_per_1000'->>kind)::numeric, 0) / 1000, 2) usd from m)
  select jsonb_build_object(
    'settings', (select v from s),
    'today', ve_google_day(),
    'today_used', (select coalesce(jsonb_object_agg(kind, n), '{}') from (select kind, sum(calls)::int n from ve_google_usage where day = ve_google_day() group by kind) t),
    'room', jsonb_build_object('search_background', ve_google_room('search', true), 'search_people', ve_google_room('search', false),
                               'details_background', ve_google_room('details', true), 'details_people', ve_google_room('details', false)),
    'month', (select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'calls', calls, 'usd', usd)), '[]') from est),
    'month_usd', (select coalesce(sum(usd), 0) from est),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'kind', kind, 'job', job, 'calls', calls) order by day desc, calls desc), '[]')
             from ve_google_usage where day > ve_google_day() - p_days)
  )
$$;

revoke all on function public.ve_google_count(text, text, integer) from public, anon, authenticated;
revoke all on function public.ve_google_room(text, boolean) from public, anon, authenticated;
revoke all on function public.ve_google_report(integer) from public, anon, authenticated;
grant execute on function public.ve_google_count(text, text, integer) to service_role;
grant execute on function public.ve_google_room(text, boolean) to service_role;
grant execute on function public.ve_google_report(integer) to service_role;
