-- One-time scans sit outside the daily cap (2026-11-01). CLAUDE.md says a one-time scan Sean approves "runs outside the daily cap but
-- counts toward the month (once:<task>)", but ve_google_room summed every job of the day, so the held-listings vet (78 Place Details,
-- job once:held-vet) used up the day's 40 and stopped the background jobs until midnight Pacific. The room now leaves out once:* jobs;
-- the month's total and Depot > Analytics > Google costs still count them.
create or replace function public.ve_google_room(p_kind text, p_background boolean default true)
returns integer language sql stable security definer set search_path to 'public' as $function$
  with s as (select value v from ve_site_settings where key = 'google_budget'),
  cap as (select coalesce(((select v from s)->'daily'->>p_kind)::numeric, 0)
                 * case when p_background then coalesce(((select v from s)->>'background_share')::numeric, 0.6) else 1 end c),
  used as (select coalesce(sum(calls), 0) u from ve_google_usage where day = ve_google_day() and kind = p_kind
             and coalesce(job, '') not like 'once:%')
  select greatest(0, floor((select c from cap) - (select u from used)))::integer
$function$;
