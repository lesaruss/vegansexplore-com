-- ve-community-directory: the logo hunt (Sean, 2026-11-07: "if they have a logo, it's either on their website, it's on Google,
-- or I use Facebook... Instagram... In a pinch"). One row a listing a run; edge function ve-logo-hunt fills it. Nothing here
-- changes a listing. Applied 2026-11-07 through the Supabase connector.
create table if not exists ve_logo_hunts (
  id bigint generated always as identity primary key,
  run_id text not null,
  listing_id uuid not null references listings(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','working','done','failed')),
  site jsonb,
  socials jsonb,
  candidates jsonb,
  pick int,
  same_logo_in int[],
  sources_agree text[],
  confidence text,
  background text,
  verdict text check (verdict in ('auto','review','none')),
  why text,
  error text,
  cost_usd numeric,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  unique (run_id, listing_id)
);
alter table ve_logo_hunts enable row level security;
create index if not exists ve_logo_hunts_run on ve_logo_hunts(run_id);
