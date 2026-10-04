-- Bounties (Sean, 2026-10-04): paid-in-points content jobs, first for the two Oct 24 South Florida
-- events (Vegan Creole Festival, Vegan Day Party Miami). A member opens a bounty, uploads files
-- or pastes links, and submits; Sean or that city's Community Manager reviews in Depot > Bounties,
-- and approving pays the points (points_ledger + apply_member_points_delta, the same path
-- award_points_bounty uses). Every read and write goes through the ve-bounties edge function
-- (service role): RLS on, no policies.

create table if not exists public.ve_bounties (
  id uuid primary key default gen_random_uuid(),
  community_slug text not null,
  event_id uuid references public.events(id) on delete set null,
  event_title text,
  kind text not null check (kind in ('recap_video', 'vlog', 'interviews', 'writeup', 'clips', 'other')),
  title text not null check (char_length(title) between 3 and 140),
  brief text not null check (char_length(brief) between 1 and 4000),
  deliverable text not null check (char_length(deliverable) between 1 and 300),
  example_url text,
  points integer not null check (points > 0 and points <= 100000),
  -- null = every approved submission is paid; a number caps how many are paid.
  max_awards integer check (max_awards is null or max_awards > 0),
  due_at timestamptz,
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  sort integer not null default 0,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_bounties_open_idx on public.ve_bounties (community_slug, status, sort);

create table if not exists public.ve_bounty_submissions (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.ve_bounties(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'submitted' check (status in ('in_progress', 'submitted', 'changes', 'approved', 'rejected')),
  note text check (char_length(note) <= 10000),
  links text[] not null default '{}',
  files jsonb not null default '[]'::jsonb,
  review_note text check (char_length(review_note) <= 2000),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  points_awarded integer,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bounty_id, member_id)
);
create index if not exists ve_bounty_submissions_review_idx on public.ve_bounty_submissions (status, submitted_at desc);

alter table public.ve_bounties enable row level security;
alter table public.ve_bounty_submissions enable row level security;
revoke all on public.ve_bounties, public.ve_bounty_submissions from anon, authenticated;

-- Files members upload for a bounty: private, read through signed links in the review page.
insert into storage.buckets (id, name, public, file_size_limit)
values ('ve-bounty-uploads', 've-bounty-uploads', false, 2147483648)
on conflict (id) do nothing;

-- Pay an approved submission once. ref_id makes it idempotent.
create or replace function public.ve_bounty_pay(p_submission uuid, p_reviewer uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s ve_bounty_submissions; b ve_bounties; paid int; w jsonb;
begin
  select * into s from ve_bounty_submissions where id = p_submission for update;
  if s is null then return jsonb_build_object('error', 'not_found'); end if;
  select * into b from ve_bounties where id = s.bounty_id;
  if exists (select 1 from points_ledger where ref_id = 'bounty:' || s.id) then
    return jsonb_build_object('awarded', false, 'already', true);
  end if;
  if b.max_awards is not null then
    select count(*) into paid from ve_bounty_submissions where bounty_id = b.id and status = 'approved' and id <> s.id;
    if paid >= b.max_awards then return jsonb_build_object('error', 'cap_reached'); end if;
  end if;
  insert into points_ledger (member_id, delta, reason, ref_id) values (s.member_id, b.points, 'bounty', 'bounty:' || s.id);
  select apply_member_points_delta(s.member_id, b.points) into w;
  update ve_bounty_submissions set status = 'approved', points_awarded = b.points, reviewed_by = p_reviewer, reviewed_at = now(), updated_at = now() where id = s.id;
  return jsonb_build_object('awarded', true, 'points', b.points, 'wallet', w);
end $$;
revoke all on function public.ve_bounty_pay(uuid, uuid) from public, anon, authenticated;
