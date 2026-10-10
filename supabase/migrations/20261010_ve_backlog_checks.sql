-- The hidden backlog (Sean, 2026-10-10: "Go, start with the backlog"). About 2,970 listings sat quarantined since the May
-- and June imports (our ve_businesses list, the spreadsheet, the SoFlo Vegans Facebook group), never reviewed. ve-discover
-- `backlog_run` checks each one and sorts it; Sean decides in Depot > Business outreach > New places.
--
-- Tracks, by what a row has:
--   google  it has a place (a city, an address or "South Florida"): looked up on Google Places by name and place
--   ig      only an Instagram handle: read on Instagram (Apify) first; a food business with a city in its bio or posts then
--           goes to Google too
--   thin    a name and nothing else: nothing reliable to check against
-- Verdicts (plain words in the console):
--   list    Ready to list: open on Google and Vegan by Google's category, its name or its bio
--   check   Check: an open food business, Vegan not confirmed, or a food business we could not place on Google
--   other   Not a restaurant: a business of another kind (a brand, a coach, a shop, an event)
--   closed  Closed: Google says closed, or an Instagram with no post in over a year and no Google profile
--   listed  Already listed: the same Google place, Instagram or name and city as a public listing
--   person  A person, not a business (a personal Instagram account)
--   gone    Not found: no Google match and the Instagram does not exist
--   thin    Not enough to check

create table if not exists public.ve_backlog_checks (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  track text not null check (track in ('google', 'ig', 'thin')),
  stage text not null default 'pending' check (stage in ('pending', 'ig_done', 'done', 'error')),
  ig jsonb,
  place jsonb,
  verdict text check (verdict in ('list', 'check', 'other', 'closed', 'listed', 'person', 'gone', 'thin')),
  reason text,
  city_guess text,
  community_slug text,
  duplicate_of uuid,
  decision text check (decision in ('listed', 'hidden')),
  decided_by uuid,
  decided_at timestamptz,
  attempts int not null default 0,
  error text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_backlog_checks_stage_idx on public.ve_backlog_checks (stage, track);
create index if not exists ve_backlog_checks_verdict_idx on public.ve_backlog_checks (verdict, decision);
alter table public.ve_backlog_checks enable row level security;

insert into public.ve_backlog_checks (listing_id, track, stage, verdict, reason, checked_at)
select l.id,
  case when coalesce(l.address_city, '') <> '' or coalesce(l.location, '') <> '' or coalesce(l.address_street, '') <> '' then 'google'
       when coalesce(l.instagram, l.ig_handle, '') <> '' then 'ig'
       else 'thin' end,
  case when coalesce(l.address_city, '') = '' and coalesce(l.location, '') = '' and coalesce(l.address_street, '') = ''
        and coalesce(l.instagram, l.ig_handle, '') = '' then 'done' else 'pending' end,
  case when coalesce(l.address_city, '') = '' and coalesce(l.location, '') = '' and coalesce(l.address_street, '') = ''
        and coalesce(l.instagram, l.ig_handle, '') = '' then 'thin' end,
  case when coalesce(l.address_city, '') = '' and coalesce(l.location, '') = '' and coalesce(l.address_street, '') = ''
        and coalesce(l.instagram, l.ig_handle, '') = '' then 'Only a name: nothing to check it against' end,
  case when coalesce(l.address_city, '') = '' and coalesce(l.location, '') = '' and coalesce(l.address_street, '') = ''
        and coalesce(l.instagram, l.ig_handle, '') = '' then now() end
from listings l
where l.status = 'quarantined'
on conflict (listing_id) do nothing;

-- Every 2 minutes until nothing is left; the function answers "done" once the backlog is empty and costs nothing then.
select cron.unschedule('ve-discover-backlog') where exists (select 1 from cron.job where jobname = 've-discover-backlog');
select cron.schedule('ve-discover-backlog', '*/2 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-discover',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"backlog_run"}'::jsonb, timeout_milliseconds := 150000)
$c$);
