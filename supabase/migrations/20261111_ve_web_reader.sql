-- ve-web-reader (Sean, 2026-11-11: "what can we do so you can easily access these websites I'm feeding you without me having to add it
-- every single time... I don't want to put us at risk. Can we put a safety net in"; BOSS docs/proposals/2026-11-11-web-reader-boss.md).
-- ve_web_sources: the links Sean sends (the reader's scope). ve_web_reads: every attempt, allowed or refused, with the links a page held
-- (a page's links are in scope one hop from a source Sean sent). Service role only: RLS on, no policies.
create table if not exists ve_web_sources (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  host text not null,
  note text,
  added_by text not null default 'Logan',
  created_at timestamptz not null default now()
);
create table if not exists ve_web_reads (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  final_url text,
  scope text,            -- source | linked_from_source | listing_website | refused
  via_source uuid references ve_web_sources(id) on delete set null,
  allowed boolean not null,
  refused_why text,
  status int,
  bytes int,
  title text,
  links jsonb,           -- the page's links, absolute, as found (one hop of scope when the page is a source)
  browser boolean not null default false,
  requested_by text,
  created_at timestamptz not null default now()
);
create index if not exists ve_web_reads_created_idx on ve_web_reads (created_at desc);
create index if not exists ve_web_reads_source_idx on ve_web_reads (via_source) where scope = 'source';
alter table ve_web_sources enable row level security;
alter table ve_web_reads enable row level security;
