-- signal: version 1 foundation (Sean, 2026-11-06, playbook signal: "a list of all of the issues that our site is experiencing
-- through Search Console, through whatever... then I just want it to be fixed"). Read-only for now: the sites Signal watches,
-- each scan run, what every page looked like to Google, and the issue list grouped by cause (a template problem across 1,000
-- listings is one issue). Brand-ready: a new brand or client is a signal_sites row. RLS on, no policies: the server reads them.

create table if not exists public.signal_sites (
  site text primary key,                 -- 'vegansexplore.com'
  brand_slug text not null,
  base_url text not null,                -- 'https://vegansexplore.com'
  sitemap_url text not null,
  gsc_property text,                     -- 'sc-domain:vegansexplore.com' or 'https://vegansexplore.com/'
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.signal_scan_runs (
  id uuid primary key default gen_random_uuid(),
  site text not null references public.signal_sites(site),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  urls_total int not null default 0,
  urls_done int not null default 0,
  status text not null default 'running' check (status in ('running','done','failed')),
  note text
);

create table if not exists public.signal_pages (
  site text not null references public.signal_sites(site),
  url text not null,
  page_type text not null,
  run_id uuid references public.signal_scan_runs(id),
  status_code int,
  final_url text,
  title text,
  description text,
  canonical text,
  robots text,
  h1_count int,
  og_image text,
  img_total int,
  img_no_alt int,
  html_bytes int,
  ms int,
  problems text[] not null default '{}',
  checked_at timestamptz,
  primary key (site, url)
);
create index if not exists signal_pages_run on public.signal_pages(run_id);
create index if not exists signal_pages_todo on public.signal_pages(site, checked_at nulls first);

create table if not exists public.signal_issues (
  id uuid primary key default gen_random_uuid(),
  site text not null references public.signal_sites(site),
  code text not null,                    -- 'missing_description'
  page_type text not null,               -- 'listing', 'pulse', 'all'...
  source text not null default 'scan' check (source in ('scan','gsc','sentinel')),
  class text not null default 'needs_you' check (class in ('auto','needs_you','watching')),
  severity text not null default 'medium' check (severity in ('high','medium','low')),
  title text not null,
  why text,
  recommendation text,
  affected int not null default 0,
  samples text[] not null default '{}',
  status text not null default 'open' check (status in ('open','fixed','watching','dismissed')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  fixed_at timestamptz,
  details jsonb not null default '{}',
  unique (site, code, page_type)
);

alter table public.signal_sites enable row level security;
alter table public.signal_scan_runs enable row level security;
alter table public.signal_pages enable row level security;
alter table public.signal_issues enable row level security;

insert into public.signal_sites (site, brand_slug, base_url, sitemap_url)
values ('vegansexplore.com', 'vegans-explore', 'https://vegansexplore.com', 'https://vegansexplore.com/sitemap.xml')
on conflict (site) do nothing;
