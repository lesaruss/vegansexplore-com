-- signal: every address Google showed for a site (Search Console, 16 months), with what it answers today, so no visitor
-- from Google lands on a broken page. Filled by ve-signal gsc_urls (the first load came from that call's response, 2026-11-06).
create table if not exists public.signal_gsc_urls (
  site text not null references public.signal_sites(site), url text not null, clicks int, impressions int,
  status_code int, location text, verdict text, checked_at timestamptz, seen_at timestamptz not null default now(),
  primary key (site, url));
alter table public.signal_gsc_urls enable row level security;
