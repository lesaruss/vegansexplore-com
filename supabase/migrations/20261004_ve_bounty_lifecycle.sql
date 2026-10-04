-- Bounty lifecycle (Sean, 2026-10-04; playbook ve-bounties-lifecycle). A bounty now has spots and a
-- clock: a Passport holder claims a spot (up to 2 per event), claims lock 48 hours before the event,
-- work is due 7 days after it. Claiming unlocks the rundown, the event details and a claimers-only
-- Q&A thread per event. Releasing before the lock is free; after the lock it is half a strike; a
-- claim with nothing submitted by the deadline is a no-show (a strike). Strikes in the last 180 days
-- set a cooldown: 1 = 30 days, 2 = 90 days, 3 (or a violation) = paused until a CM clears them.
-- Review pays full or reduced points, allows 2 rounds of changes (72 hours each) and keeps a
-- coaching note. Every read and write still goes through the ve-bounties edge function.

alter table public.ve_bounties
  add column if not exists slots integer check (slots is null or slots > 0),
  add column if not exists event_starts_at timestamptz,
  add column if not exists event_ends_at timestamptz,
  add column if not exists claims_close_at timestamptz,
  add column if not exists event_details text check (char_length(event_details) <= 6000);
alter table public.ve_bounties drop constraint if exists ve_bounties_status_check;
alter table public.ve_bounties add constraint ve_bounties_status_check check (status in ('draft', 'open', 'closed', 'canceled'));

alter table public.ve_bounty_submissions
  add column if not exists claimed_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists license_at timestamptz,
  add column if not exists revisions integer not null default 0,
  add column if not exists changes_due_at timestamptz,
  add column if not exists coaching_note text check (char_length(coaching_note) <= 2000),
  add column if not exists auto_submitted boolean not null default false;
alter table public.ve_bounty_submissions drop constraint if exists ve_bounty_submissions_status_check;
alter table public.ve_bounty_submissions add constraint ve_bounty_submissions_status_check
  check (status in ('claimed', 'released', 'no_show', 'in_progress', 'submitted', 'changes', 'approved', 'rejected'));
alter table public.ve_bounty_submissions alter column status set default 'claimed';

-- Strikes. weight 1 = no-show, 0.5 = released after claims closed, 3 = violation (pauses access).
create table if not exists public.ve_bounty_strikes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  submission_id uuid references public.ve_bounty_submissions(id) on delete set null,
  bounty_id uuid references public.ve_bounties(id) on delete set null,
  reason text not null check (reason in ('no_show', 'late_release', 'violation')),
  weight numeric(3,1) not null check (weight > 0),
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  cleared_by uuid references public.members(id) on delete set null,
  cleared_note text check (char_length(cleared_note) <= 1000)
);
create index if not exists ve_bounty_strikes_member_idx on public.ve_bounty_strikes (member_id, created_at desc);

-- One rundown per kind of job; the CM adds only the event details on the bounty.
-- sections: [{ "heading": text, "items": [text] }], links: [{ "label": text, "url": text }]
create table if not exists public.ve_bounty_rundowns (
  kind text primary key check (kind in ('recap_video', 'vlog', 'interviews', 'writeup', 'clips', 'other')),
  title text not null,
  intro text,
  sections jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Q&A: one thread per event, visible to that event's claimers and the city's reviewers.
create table if not exists public.ve_bounty_messages (
  id uuid primary key default gen_random_uuid(),
  community_slug text not null,
  event_key text not null, -- the event id, or the event title when a bounty has no event row
  member_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  staff boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ve_bounty_messages_thread_idx on public.ve_bounty_messages (event_key, created_at);

-- Every reminder or notice goes out once per claim.
create table if not exists public.ve_bounty_notices (
  submission_id uuid not null references public.ve_bounty_submissions(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (submission_id, kind)
);

alter table public.ve_bounty_strikes enable row level security;
alter table public.ve_bounty_rundowns enable row level security;
alter table public.ve_bounty_messages enable row level security;
alter table public.ve_bounty_notices enable row level security;
revoke all on public.ve_bounty_strikes, public.ve_bounty_rundowns, public.ve_bounty_messages, public.ve_bounty_notices from anon, authenticated;

-- Can this member claim right now? Cooldown from uncleared strikes in the last 180 days.
create or replace function public.ve_bounty_standing(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare total numeric; latest timestamptz; violation boolean; until timestamptz;
begin
  select coalesce(sum(weight), 0), max(created_at), bool_or(reason = 'violation') into total, latest, violation
  from ve_bounty_strikes where member_id = p_member and cleared_at is null and created_at > now() - interval '180 days';
  if coalesce(violation, false) or total >= 3 then
    return jsonb_build_object('ok', false, 'paused', true, 'strikes', total);
  end if;
  if total >= 2 then until := latest + interval '90 days';
  elsif total >= 1 then until := latest + interval '30 days';
  end if;
  if until is not null and until > now() then
    return jsonb_build_object('ok', false, 'paused', false, 'until', until, 'strikes', total);
  end if;
  return jsonb_build_object('ok', true, 'strikes', total);
end $$;

-- Claim a spot. Locks the bounty row so two people can't take the last spot at once.
create or replace function public.ve_bounty_claim(p_bounty uuid, p_member uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b ve_bounties; s ve_bounty_submissions; taken int; mine int; standing jsonb;
begin
  select * into b from ve_bounties where id = p_bounty for update;
  if b.id is null or b.status = 'draft' then return jsonb_build_object('error', 'not_found'); end if;
  if b.status <> 'open' or (b.claims_close_at is not null and now() >= b.claims_close_at) then
    return jsonb_build_object('error', 'claims_closed');
  end if;
  select * into s from ve_bounty_submissions where bounty_id = b.id and member_id = p_member;
  if s.id is not null and s.status <> 'released' then return jsonb_build_object('error', 'already_claimed'); end if;
  standing := ve_bounty_standing(p_member);
  if not (standing->>'ok')::boolean then return jsonb_build_object('error', 'not_eligible', 'standing', standing); end if;
  if b.slots is not null then
    select count(*) into taken from ve_bounty_submissions where bounty_id = b.id and status <> 'released';
    if taken >= b.slots then return jsonb_build_object('error', 'full'); end if;
  end if;
  select count(*) into mine from ve_bounty_submissions x join ve_bounties y on y.id = x.bounty_id
  where x.member_id = p_member and x.status <> 'released' and y.id <> b.id
    and coalesce(y.event_id::text, y.event_title, y.id::text) = coalesce(b.event_id::text, b.event_title, b.id::text);
  if mine >= 2 then return jsonb_build_object('error', 'event_limit'); end if;
  if s.id is null then
    insert into ve_bounty_submissions (bounty_id, member_id, status, claimed_at) values (b.id, p_member, 'claimed', now()) returning * into s;
  else
    update ve_bounty_submissions set status = 'claimed', claimed_at = now(), released_at = null, files = '[]'::jsonb, links = '{}', note = null, updated_at = now()
    where id = s.id returning * into s;
    delete from ve_bounty_notices where submission_id = s.id;
  end if;
  return jsonb_build_object('ok', true, 'submission_id', s.id);
end $$;

-- Pay an approved submission once, at full points or a reduced amount the reviewer sets.
drop function if exists public.ve_bounty_pay(uuid, uuid);
create or replace function public.ve_bounty_pay(p_submission uuid, p_reviewer uuid, p_points integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s ve_bounty_submissions; b ve_bounties; paid int; amount int; w jsonb;
begin
  select * into s from ve_bounty_submissions where id = p_submission for update;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select * into b from ve_bounties where id = s.bounty_id;
  if exists (select 1 from points_ledger where ref_id = 'bounty:' || s.id) then
    return jsonb_build_object('awarded', false, 'already', true);
  end if;
  amount := coalesce(p_points, b.points);
  if amount < 1 or amount > b.points then return jsonb_build_object('error', 'bad_points'); end if;
  if b.max_awards is not null then
    select count(*) into paid from ve_bounty_submissions where bounty_id = b.id and status = 'approved' and id <> s.id;
    if paid >= b.max_awards then return jsonb_build_object('error', 'cap_reached'); end if;
  end if;
  insert into points_ledger (member_id, delta, reason, ref_id) values (s.member_id, amount, 'bounty', 'bounty:' || s.id);
  select apply_member_points_delta(s.member_id, amount) into w;
  update ve_bounty_submissions set status = 'approved', points_awarded = amount, reviewed_by = p_reviewer, reviewed_at = now(), updated_at = now() where id = s.id;
  return jsonb_build_object('awarded', true, 'points', amount, 'wallet', w);
end $$;
revoke all on function public.ve_bounty_pay(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.ve_bounty_claim(uuid, uuid) from public, anon, authenticated;
revoke all on function public.ve_bounty_standing(uuid) from public, anon, authenticated;

-- points_ledger did not allow reason 'bounty', so the first approval would have failed (found in
-- the rollback test on 2026-10-04). Same list as before, plus 'bounty'.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote','event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received','vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase','bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem','ve_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty']::text[]));

-- Hourly: reminders, no-shows and strikes, auto-submit at the deadline, lapsed change requests.
select cron.schedule('ve-bounties-hourly', '13 * * * *', $c$
  select net.http_post(
    url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-bounties',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"cron"}'::jsonb
  );
$c$);
