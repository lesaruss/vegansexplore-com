-- Universe invites (Sean, 2026-10-04, playbook records 499aaebc and 296409be). Sean invites people
-- from HQ > People (super admins only) to a brand, and decides per person whether the membership is
-- on us ("in recognition of their work and contributions to the community"). One invite per person
-- and brand; each carries a personal tracked link (/go/<code>, Depot > Links) and can point at a
-- dinner seat or the Community Manager role. Created 'ready' (nothing sent), then sent by email or
-- copied; from then it expires after 30 days and works once.
--
-- Claimed two ways, both through universe_invite_claim():
--   1. the person creates their account with the invited email (members insert triggers below), or
--   2. they accept through their link while signed in (ve-invites accept, ve-dinner-seats hold).
-- A free membership claims exactly what an $11 Founding Membership gives: membership active, and
-- 1,100 points (the $1 = 100 points rate), recorded in points_ledger as 'comp_membership'.
-- Brands that can claim today: vegans-explore. A new brand is added here once it has a membership.

create table if not exists public.universe_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  brand text not null default 'vegans-explore' check (brand in ('vegans-explore')),
  person_id uuid references public.people(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  comp boolean not null default true,
  reason text check (reason is null or char_length(reason) <= 600),
  points_to text not null default 'none' check (points_to in ('none', 'dinner', 'community_manager')),
  dinner_slug text references public.ve_dinners(slug) on delete set null,
  dinner_invite_id uuid references public.ve_dinner_invites(id) on delete set null,
  city_slug text,
  link_id uuid,
  link_code text,
  batch_id uuid,
  status text not null default 'ready' check (status in ('ready', 'sent', 'opened', 'joined', 'expired', 'canceled')),
  sent_via text check (sent_via is null or sent_via in ('email', 'copied')),
  sent_at timestamptz,
  opened_at timestamptz,
  expires_at timestamptz,
  joined_at timestamptz,
  claimed_member_id uuid,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists universe_invites_email_idx on public.universe_invites (lower(email));
create index if not exists universe_invites_person_idx on public.universe_invites (person_id);
create index if not exists universe_invites_dinner_invite_idx on public.universe_invites (dinner_invite_id);
-- One open invite per person and brand.
create unique index if not exists universe_invites_one_open
  on public.universe_invites (brand, lower(email)) where status in ('ready', 'sent', 'opened');
alter table public.universe_invites enable row level security; -- service role only (HQ, ve-invites, ve-dinner-seats)

-- The guest list knows which account held each seat (a seat now needs a free account).
alter table public.ve_dinner_invites add column if not exists member_id uuid;

-- The points a free membership brings are logged as 'comp_membership'.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral',
  'daily_login', 'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend',
  'profile_complete', 'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded',
  'featured_purchase', 'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering',
  'boost_purchase', 'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem',
  've_hunt_complete', 've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership'])) not valid;

-- Claims one invite for one member. Idempotent; returns what happened.
create or replace function public.universe_invite_claim(p_invite uuid, p_member uuid)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.universe_invites; bal integer;
begin
  select * into inv from universe_invites where id = p_invite for update;
  if not found then return 'not_found'; end if;
  if inv.status = 'joined' then return case when inv.claimed_member_id = p_member then 'already' else 'used' end; end if;
  if inv.status = 'canceled' then return 'canceled'; end if;
  if inv.status = 'expired' or (inv.expires_at is not null and inv.expires_at < now()) then
    update universe_invites set status = 'expired', updated_at = now() where id = inv.id;
    return 'expired';
  end if;
  update universe_invites set status = 'joined', joined_at = now(), claimed_member_id = p_member, updated_at = now() where id = inv.id;
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), updated_at = now()
      where id = p_member;
    if not exists (select 1 from points_ledger where reason = 'comp_membership' and ref_id = 'invite:' || inv.id) then
      select lesars_balance into bal from members where id = p_member for update;
      update members set lesars_balance = coalesce(bal, 0) + 1100 where id = p_member;
      perform apply_member_points_delta(p_member, 1100);
      insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, 1100, 'comp_membership', 'invite:' || inv.id);
    end if;
  end if;
  return 'joined';
end $$;
revoke all on function public.universe_invite_claim(uuid, uuid) from public, anon, authenticated;

-- Signup with the invited email: the membership is active from the first response (before insert),
-- then the invite is claimed and the points land (after insert). Vegans Explore accounts only. Named
-- trg_zz_ so they run after the tenant stamp, like the staff and partner invite triggers.
create or replace function public.apply_universe_invite_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.email is null or NEW.tenant_id is distinct from '00000000-0000-4000-a000-000000000002'::uuid then return NEW; end if;
  if exists (select 1 from universe_invites where brand = 'vegans-explore' and lower(email) = lower(NEW.email)
             and comp and status in ('sent', 'opened') and (expires_at is null or expires_at > now())) then
    NEW.membership_status := 'active';
    NEW.entry_paid_at := coalesce(NEW.entry_paid_at, now());
  end if;
  return NEW;
end $$;

create or replace function public.apply_universe_invite_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  if NEW.email is null or NEW.tenant_id is distinct from '00000000-0000-4000-a000-000000000002'::uuid then return NEW; end if;
  for inv in select id from universe_invites where brand = 'vegans-explore' and lower(email) = lower(NEW.email)
             and status in ('sent', 'opened') and (expires_at is null or expires_at > now()) loop
    -- A claim that fails never blocks the signup; the invite stays open to accept by link.
    begin
      perform universe_invite_claim(inv.id, NEW.id);
    exception when others then
      raise warning 'universe invite % not claimed for member %: %', inv.id, NEW.id, sqlerrm;
    end;
  end loop;
  return NEW;
end $$;

drop trigger if exists trg_zz_universe_invite_before on public.members;
create trigger trg_zz_universe_invite_before before insert on public.members
  for each row execute function public.apply_universe_invite_before_insert();
drop trigger if exists trg_zz_universe_invite_after on public.members;
create trigger trg_zz_universe_invite_after after insert on public.members
  for each row execute function public.apply_universe_invite_after_insert();

-- "Member since" stays the first time. A member who is already active and contributes again (the
-- dashboard's Contribute, Sean 2026-10-04) keeps their original entry_paid_at; a lapsed member who
-- comes back still gets a new one, as the Passport webhook expects.
create or replace function public.keep_member_since()
returns trigger language plpgsql as $$
begin
  if OLD.membership_status = 'active' and OLD.entry_paid_at is not null and NEW.entry_paid_at is distinct from OLD.entry_paid_at then
    NEW.entry_paid_at := OLD.entry_paid_at;
  end if;
  return NEW;
end $$;
drop trigger if exists members_keep_member_since on public.members;
create trigger members_keep_member_since before update of entry_paid_at on public.members
  for each row execute function public.keep_member_since();

-- Dinner budget (record 97a1bcbe item 5): a cap per dinner ($500) and its cost lines.
alter table public.ve_dinners add column if not exists budget_cap_cents integer not null default 50000 check (budget_cap_cents >= 0);
create table if not exists public.ve_dinner_costs (
  id uuid primary key default gen_random_uuid(),
  dinner_slug text not null references public.ve_dinners(slug) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  amount_cents integer not null check (amount_cents >= 0 and amount_cents <= 10000000),
  status text not null default 'planned' check (status in ('planned', 'paid')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_dinner_costs_dinner_idx on public.ve_dinner_costs (dinner_slug);
alter table public.ve_dinner_costs enable row level security; -- service role only, through ve-dinner-seats

insert into public.ve_dinner_costs (dinner_slug, label, amount_cents, note)
select 'palm-beach-2026-10-23', x.label, x.amount, x.note
from (values
  ('Staff tip', 20000, 'Estimate: 20% of the food''s menu value, about $160 to $240 for 20 guests. Update when the venue quotes.'),
  ('Community Manager bounty (Run the city dinner)', 15000, 'Paid after the dinner.')
) as x(label, amount, note)
where exists (select 1 from public.ve_dinners where slug = 'palm-beach-2026-10-23')
  and not exists (select 1 from public.ve_dinner_costs where dinner_slug = 'palm-beach-2026-10-23');

-- Bounties that pay cash as well as points, and that are held for one person first
-- (Run the city dinner: $150 + points, first dibs to the city's Community Manager).
alter table public.ve_bounties add column if not exists cash_cents integer check (cash_cents is null or (cash_cents > 0 and cash_cents <= 1000000));
alter table public.ve_bounties add column if not exists reserved_email text;
alter table public.ve_bounties add column if not exists reserved_until timestamptz;
