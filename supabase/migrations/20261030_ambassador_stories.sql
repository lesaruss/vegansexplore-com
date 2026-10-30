-- Ambassadors represent the movement anywhere, and bring us the stories (Sean, 2026-10-30: "why would we want to limit them to any
-- particular area?... introducing us to business owners and to podcasters and to people who are on the streets who have a story to be
-- told... we want to interview you and put you on our podcast... different people hosting... be the voice of your city, report on
-- what's happening in your community"). The Ambassador Guide's Tell the stories tab sends one of these through ve-ambassador `story`;
-- the team works them in Depot > Ambassadors > Stories (`story_status`). RLS on, no policies: only the function reads or writes.
create table if not exists public.ve_ambassador_stories (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null check (kind in ('intro', 'interview', 'host', 'report')),
  name text,                 -- who they are introducing (intro), else empty
  about text not null,       -- who they are / the story / what is happening
  place text,                -- where, in their words (any city, anywhere)
  contact text,              -- a handle, an email or a link, as they give it
  status text not null default 'new' check (status in ('new', 'contacted', 'done')),
  status_at timestamptz,
  status_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ve_ambassador_stories_created on public.ve_ambassador_stories (created_at desc);
alter table public.ve_ambassador_stories enable row level security;
