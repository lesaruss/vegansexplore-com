-- BrandDesk: the plan engine (canon canon-branddesk-production-wing, build order item 4; Sean, 2026-11-01: "go with your
-- recommendation, next step"). A 3, 6 or 12 month marketing plan for a brand rolls out dated pieces (a post, a reel, an article, an
-- email, a photo shoot, a podcast episode, an event, a website update), and every piece rolls out its own dated steps backwards from
-- its due date: the questions to answer by, the draft by, the OK by, the photographer to book by (the request already written).
-- Every piece moves the same way: ask, draft, approve or comment, keep working until done, store it. The edge function ve-plan does
-- all of it; HQ's BrandDesk > a brand > Plan is its page. RLS on, no policies: only the service role reads or writes.

create table if not exists ve_plans (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null,
  name text not null,
  months int not null check (months in (3, 6, 12)),
  starts_on date not null,
  ends_on date not null,
  support text not null default 'managed' check (support in ('self', 'supported', 'managed')),
  rhythm jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_plans_brand on ve_plans (brand_slug, status);

create table if not exists ve_plan_pieces (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references ve_plans(id) on delete cascade,
  brand_slug text not null,
  kind text not null,
  title text not null,
  due_on date not null,
  channels text[] not null default '{}',
  status text not null default 'ask' check (status in ('ask', 'draft', 'review', 'changes', 'approved', 'stored', 'skipped')),
  asks jsonb not null default '[]'::jsonb,       -- [{key, q, a}]
  brief text,
  draft text,
  draft_v int not null default 0,
  draft_by text,
  draft_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  stored jsonb,                                   -- {social_slot_id?, url?, note?, at, by}
  stored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_plan_pieces_plan on ve_plan_pieces (plan_id, due_on);
create index if not exists ve_plan_pieces_brand on ve_plan_pieces (brand_slug, status, due_on);

create table if not exists ve_plan_steps (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references ve_plan_pieces(id) on delete cascade,
  plan_id uuid not null references ve_plans(id) on delete cascade,
  key text not null,
  label text not null,
  who text not null default 'team' check (who in ('team', 'owner')),
  off_days int not null,
  do_by date not null,
  request text,                                   -- a request already written (book the photographer, invite the guest)
  position int not null default 0,
  done_at timestamptz,
  done_by_name text
);
create index if not exists ve_plan_steps_plan on ve_plan_steps (plan_id, do_by) where done_at is null;
create index if not exists ve_plan_steps_piece on ve_plan_steps (piece_id, position);

create table if not exists ve_plan_notes (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references ve_plan_pieces(id) on delete cascade,
  member_id uuid,
  author text not null,
  kind text not null default 'comment' check (kind in ('comment', 'changes', 'event')),
  body text not null,
  draft_v int,
  created_at timestamptz not null default now()
);
create index if not exists ve_plan_notes_piece on ve_plan_notes (piece_id, created_at);

alter table ve_plans enable row level security;
alter table ve_plan_pieces enable row level security;
alter table ve_plan_steps enable row level security;
alter table ve_plan_notes enable row level security;
