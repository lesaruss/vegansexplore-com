-- Where should we go next? (Sean, 2026-11-09, playbook ve-chapter-rankings: "a column that has 10 slots... chapters that are in
-- the works... a voting feature where members can go in there and vote for what's the next chapter that we should open... suggest
-- another location... It's more of a suggestion. It's not a guarantee"). Places we may open, voted once every 24 hours per member
-- like a chapter (ve_chapter_votes); suggestions wait for the team. Everything through ve-votes (next_list, next_today, next_vote,
-- next_suggest). RLS on, no policies.
create table if not exists public.ve_next_chapters (
  slug text primary key,
  name text not null,
  sub text,
  status text not null default 'open' check (status in ('open','opened','hidden')),
  sort int not null default 100,
  opened_hub text,
  created_at timestamptz not null default now()
);
alter table public.ve_next_chapters enable row level security;

create table if not exists public.ve_next_chapter_votes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  place text not null references public.ve_next_chapters(slug) on delete cascade,
  vote_date date not null default ((now() at time zone 'America/New_York')::date),
  created_at timestamptz not null default now()
);
create unique index if not exists ve_next_chapter_votes_once_a_day on public.ve_next_chapter_votes (member_id, place, vote_date);
create index if not exists ve_next_chapter_votes_place on public.ve_next_chapter_votes (place);
alter table public.ve_next_chapter_votes enable row level security;

create table if not exists public.ve_next_chapter_suggestions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  place text not null,
  why text,
  status text not null default 'new' check (status in ('new','added','set_aside')),
  added_slug text references public.ve_next_chapters(slug) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.ve_next_chapter_suggestions enable row level security;

create or replace function public.ve_next_chapter_stats()
returns table (slug text, name text, sub text, sort int, votes bigint, voters bigint)
language sql stable security definer set search_path = public as $$
  select c.slug, c.name, c.sub, c.sort, coalesce(v.votes,0), coalesce(v.voters,0)
  from ve_next_chapters c
  left join (select place, count(*) votes, count(distinct member_id) voters from ve_next_chapter_votes group by place) v on v.place = c.slug
  where c.status = 'open';
$$;
revoke all on function public.ve_next_chapter_stats() from public, anon, authenticated;

-- Sean's list, 2026-11-09. Order only breaks ties while votes are even.
insert into public.ve_next_chapters (slug, name, sub, sort) values
  ('oregon','Oregon','Portland, Eugene and more',10),
  ('las-vegas','Las Vegas','Nevada',20),
  ('phoenix','Phoenix','Arizona',30),
  ('houston','Houston','Texas',40),
  ('north-carolina','North Carolina','Charlotte, Raleigh and more',50),
  ('austin','Austin','Texas',60),
  ('dublin','Dublin','Ireland',70),
  ('caribbean','The Caribbean','Islands across the region',80),
  ('new-zealand','New Zealand','Auckland, Wellington and more',90),
  ('japan','Japan','Tokyo, Osaka and more',100),
  ('seattle','Seattle','Washington',110),
  ('san-francisco','San Francisco','California',120)
on conflict (slug) do nothing;
