-- Logo sweep (Sean, 2026-10-27: "Is there any way that you can do a sweep and see which ones you can do similarly? So that way
-- I'm not going through all 200 of these and just the ones that you couldn't find the logos for... the clean logo, no food in
-- the background, just the actual logo").
-- ve-discover logo_sweep reads each open listing with no logo: the logo pictures on its website and its Instagram profile
-- picture, shown to Claude with the business's name, which picks the business's own clean logo (or none) and the background to
-- square it on. Nothing is saved to a listing here: the suggestion waits in Depot > Directory review > Logos > Suggested, where
-- the team ticks the ones that look right and saves them (logo_set), or sends one back to the hand list (Not this).
create table if not exists public.ve_logo_suggestions (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  status text not null default 'found' check (status in ('found', 'none', 'used', 'rejected')),
  url text,                 -- the picked picture (their site or Instagram), loaded through logo_fetch when reviewed
  source text,              -- where it came from: "The logo on their website", "Their Instagram picture"...
  background text,          -- white | black | match | #rrggbb
  why text,                 -- one line from the check
  candidates jsonb not null default '[]',  -- every picture looked at: [{url, from, w, h}]
  checked_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz
);
alter table public.ve_logo_suggestions enable row level security;  -- service role only (ve-discover)

-- Every 5 minutes, a few listings at a time, until each has been looked at once. With nothing left it costs nothing.
select cron.unschedule('ve-logo-sweep') where exists (select 1 from cron.job where jobname = 've-logo-sweep');
select cron.schedule('ve-logo-sweep', '*/5 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-discover',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"logo_sweep"}'::jsonb, timeout_milliseconds := 150000);
$$);
