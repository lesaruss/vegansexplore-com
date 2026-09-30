-- Community Board (Sean, 2026-09-30). One board per city community: members post a request
-- ("who can take six chickens in Broward?") or an offer, anyone can read and search it, and
-- members reply, mark their own post resolved, and report a post, a reply or a person.
-- Open to see, join to interact: signed-out visitors read posts, but a poster's contact line
-- is only returned to active members. Every read and write goes through the ve-board edge
-- function (service role), so RLS is on with no policies: the anon key reaches nothing here.
-- The old discussion_* tables are shared with another tenant and gated on auth.uid(), which
-- the Vegans Explore app token does not set, so the Board does not reuse them.

create table if not exists public.ve_board_posts (
  id uuid primary key default gen_random_uuid(),
  community_slug text not null,
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null check (kind in ('request', 'offer')),
  category text not null check (category in ('rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other')),
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  area text check (char_length(area) <= 120),
  contact text check (char_length(contact) <= 200),
  status text not null default 'open' check (status in ('open', 'resolved', 'hidden')),
  hidden_reason text,
  resolved_at timestamptz,
  reply_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(area, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) stored
);
create index if not exists ve_board_posts_community_idx on public.ve_board_posts (community_slug, status, created_at desc);
create index if not exists ve_board_posts_member_idx on public.ve_board_posts (member_id, created_at desc);
create index if not exists ve_board_posts_search_idx on public.ve_board_posts using gin (search);

create table if not exists public.ve_board_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ve_board_posts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ve_board_replies_post_idx on public.ve_board_replies (post_id, created_at);

create table if not exists public.ve_board_reports (
  id uuid primary key default gen_random_uuid(),
  community_slug text not null,
  reporter_member_id uuid not null references public.members(id) on delete cascade,
  post_id uuid references public.ve_board_posts(id) on delete cascade,
  reply_id uuid references public.ve_board_replies(id) on delete cascade,
  reported_member_id uuid references public.members(id) on delete set null,
  reason text not null check (reason in ('not_who_they_say', 'unsafe', 'scam', 'spam', 'harassment', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (post_id is not null or reply_id is not null or reported_member_id is not null)
);
-- One report per reporter per thing, so one person cannot hide a post by reporting it three times.
create unique index if not exists ve_board_reports_once_post on public.ve_board_reports (reporter_member_id, post_id) where post_id is not null and reply_id is null;
create unique index if not exists ve_board_reports_once_reply on public.ve_board_reports (reporter_member_id, reply_id) where reply_id is not null;
create index if not exists ve_board_reports_open_idx on public.ve_board_reports (community_slug, status, created_at desc);

alter table public.ve_board_posts enable row level security;
alter table public.ve_board_replies enable row level security;
alter table public.ve_board_reports enable row level security;
revoke all on public.ve_board_posts, public.ve_board_replies, public.ve_board_reports from anon, authenticated;
