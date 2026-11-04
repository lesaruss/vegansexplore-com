-- ve-spend-budget step 1 (canon-ve-spend-budget, Sean 2026-11-04): Google is a hard $50 a month, counted at list price.
-- Before this, monthly_budget_usd was shown and never enforced: ve_google_room checked only the daily caps and once:* jobs skipped even those.
-- Now: ve_google_room also stops at the month's cap (background jobs at 60% of it, so a person's action and an approved scan keep room);
-- every one-time scan is approved with a ceiling (ve_google_approve) and checks ve_google_once_room before each batch; ve_google_ledger
-- says cap, spent, approved-not-yet-run and left. Existing callers already ask ve_google_room first, so no edge function changes.
-- A batch is counted after it is sent, so a job can pass its ceiling by at most the one batch in flight.

update public.ve_site_settings
set value = value || jsonb_build_object(
  'daily', jsonb_build_object('search', 120, 'details', 100),
  'monthly_cap_usd', 50,
  'monthly_budget_usd', 50,
  'count_free_tier', false,
  'background_month_share', 0.6,
  'note', 'Sean 2026-11-04: $50 a month is a hard stop, counted at list price with no free tier (the free amounts are unverified; Google Billing is the truth). Daily caps raised from 40 and 40. Logan''s defaults otherwise, Sean''s to change.'
), updated_at = now()
where key = 'google_budget';

create table if not exists public.ve_google_approvals (
  id uuid primary key default gen_random_uuid(),
  job text not null unique check (job like 'once:%'),
  search_ceiling integer not null default 0 check (search_ceiling >= 0),
  details_ceiling integer not null default 0 check (details_ceiling >= 0),
  cost_usd numeric not null default 0,
  status text not null default 'approved' check (status in ('approved','done','cancelled')),
  note text,
  approved_by text,
  approved_at timestamptz not null default now(),
  closed_at timestamptz
);
alter table public.ve_google_approvals enable row level security;

create or replace function public.ve_google_price(p_kind text) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((value->'price_per_1000'->>p_kind)::numeric, 0) / 1000 from ve_site_settings where key = 'google_budget'
$$;

-- What this month has cost at list price. p_regular_only leaves out approved one-time scans (once:*).
create or replace function public.ve_google_spend(p_regular_only boolean default false) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(calls * ve_google_price(kind)), 0)
  from ve_google_usage
  where day >= date_trunc('month', ve_google_day())::date
    and (not p_regular_only or job not like 'once:%')
$$;

create or replace function public.ve_google_cap_usd() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((value->>'monthly_cap_usd')::numeric, (value->>'monthly_budget_usd')::numeric, 0) from ve_site_settings where key = 'google_budget'
$$;

-- Calls of this kind the month's cap still allows (all jobs, or the share background jobs may use).
create or replace function public.ve_google_month_calls(p_kind text, p_background boolean default false) returns integer
language plpgsql stable security definer set search_path = public as $$
declare cap numeric := ve_google_cap_usd(); price numeric := ve_google_price(p_kind); left_usd numeric; share numeric;
begin
  if price <= 0 then return 0; end if;
  left_usd := greatest(0, cap - ve_google_spend(false));
  if p_background then
    select coalesce((value->>'background_month_share')::numeric, 0.6) into share from ve_site_settings where key = 'google_budget';
    left_usd := least(left_usd, greatest(0, cap * share - ve_google_spend(true)));
  end if;
  return floor(left_usd / price)::integer;
end $$;

-- The room check every caller already makes: the day's cap and now the month's cap, whichever is smaller.
create or replace function public.ve_google_room(p_kind text, p_background boolean default true) returns integer
language plpgsql stable security definer set search_path = public as $$
declare daily integer;
begin
  with s as (select value v from ve_site_settings where key = 'google_budget'),
  cap as (select coalesce(((select v from s)->'daily'->>p_kind)::numeric, 0)
                 * case when p_background then coalesce(((select v from s)->>'background_share')::numeric, 0.6) else 1 end c),
  used as (select coalesce(sum(calls), 0) u from ve_google_usage where day = ve_google_day() and kind = p_kind
             and coalesce(job, '') not like 'once:%')
  select greatest(0, floor((select c from cap) - (select u from used)))::integer into daily;
  return least(daily, ve_google_month_calls(p_kind, p_background));
end $$;

-- A one-time scan's room: what its approval still allows, never past the month's cap. No approval, no room.
create or replace function public.ve_google_once_room(p_job text, p_kind text) returns integer
language plpgsql stable security definer set search_path = public as $$
declare a ve_google_approvals; used integer; ceiling integer;
begin
  select * into a from ve_google_approvals where job = p_job and status = 'approved';
  if not found then return 0; end if;
  ceiling := case p_kind when 'search' then a.search_ceiling else a.details_ceiling end;
  select coalesce(sum(calls), 0) into used from ve_google_usage where job = p_job and kind = p_kind and day >= a.approved_at::date;
  return least(greatest(0, ceiling - used), ve_google_month_calls(p_kind, false));
end $$;

-- Approved but not yet run, in dollars at list price.
create or replace function public.ve_google_committed_usd() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(greatest(0,
    a.search_ceiling * ve_google_price('search') + a.details_ceiling * ve_google_price('details')
    - coalesce((select sum(u.calls * ve_google_price(u.kind)) from ve_google_usage u where u.job = a.job and u.day >= a.approved_at::date), 0))), 0)
  from ve_google_approvals a where a.status = 'approved'
$$;

create or replace function public.ve_google_ledger() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'month', to_char(ve_google_day(), 'YYYY-MM'),
    'basis', 'list price, no free tier',
    'cap_usd', ve_google_cap_usd(),
    'spent_usd', round(ve_google_spend(false), 2),
    'regular_usd', round(ve_google_spend(true), 2),
    'committed_usd', round(ve_google_committed_usd(), 2),
    'left_usd', round(greatest(0, ve_google_cap_usd() - ve_google_spend(false) - ve_google_committed_usd()), 2),
    'approvals', (select coalesce(jsonb_agg(jsonb_build_object('job', job, 'status', status, 'search', search_ceiling, 'details', details_ceiling,
                    'cost_usd', cost_usd, 'approved_at', approved_at, 'note', note) order by approved_at desc), '[]') from ve_google_approvals))
$$;

-- Approve a one-time scan with a ceiling. Refuses when its list cost is more than what is left (that is the stop-and-ask).
create or replace function public.ve_google_approve(p_job text, p_search integer, p_details integer, p_note text default null, p_by text default 'logan') returns jsonb
language plpgsql security definer set search_path = public as $$
declare cost numeric; left_usd numeric;
begin
  if p_job is null or p_job not like 'once:%' then return jsonb_build_object('ok', false, 'reason', 'job_must_start_once'); end if;
  if coalesce(p_search, 0) < 0 or coalesce(p_details, 0) < 0 then return jsonb_build_object('ok', false, 'reason', 'bad_ceiling'); end if;
  if exists (select 1 from ve_google_approvals where job = p_job) then return jsonb_build_object('ok', false, 'reason', 'already_approved'); end if;
  cost := coalesce(p_search, 0) * ve_google_price('search') + coalesce(p_details, 0) * ve_google_price('details');
  left_usd := greatest(0, ve_google_cap_usd() - ve_google_spend(false) - ve_google_committed_usd());
  if cost > left_usd then
    return jsonb_build_object('ok', false, 'reason', 'over_cap', 'cost_usd', round(cost, 2), 'left_usd', round(left_usd, 2));
  end if;
  insert into ve_google_approvals (job, search_ceiling, details_ceiling, cost_usd, note, approved_by)
  values (p_job, coalesce(p_search, 0), coalesce(p_details, 0), round(cost, 2), p_note, p_by);
  return jsonb_build_object('ok', true, 'job', p_job, 'cost_usd', round(cost, 2), 'left_usd', round(left_usd - cost, 2));
end $$;

create or replace function public.ve_google_close(p_job text, p_status text default 'done') returns void
language sql security definer set search_path = public as $$
  update ve_google_approvals set status = case when p_status = 'cancelled' then 'cancelled' else 'done' end, closed_at = now()
  where job = p_job and status = 'approved'
$$;

-- The Depot's Google costs view keeps its old shape and gains the ledger and the list-price month.
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
    'month_list_usd', round(ve_google_spend(false), 2),
    'ledger', ve_google_ledger(),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'kind', kind, 'job', job, 'calls', calls) order by day desc, calls desc), '[]')
             from ve_google_usage where day > ve_google_day() - p_days)
  )
$$;

revoke all on function public.ve_google_price(text), public.ve_google_spend(boolean), public.ve_google_cap_usd(),
  public.ve_google_month_calls(text, boolean), public.ve_google_once_room(text, text), public.ve_google_committed_usd(),
  public.ve_google_ledger(), public.ve_google_approve(text, integer, integer, text, text), public.ve_google_close(text, text)
  from public, anon, authenticated;
grant execute on function public.ve_google_price(text), public.ve_google_spend(boolean), public.ve_google_cap_usd(),
  public.ve_google_month_calls(text, boolean), public.ve_google_once_room(text, text), public.ve_google_committed_usd(),
  public.ve_google_ledger(), public.ve_google_approve(text, integer, integer, text, text), public.ve_google_close(text, text)
  to service_role;
