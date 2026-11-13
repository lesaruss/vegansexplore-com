-- Positions (playbook ve-positions; plan docs/plans/2026-11-13-positions-boss.md; mock /mocks/positions). Sean, 2026-11-13: "start the build".
-- Phase 1: the position, its people and their checklist, the e-signed agreement, payout accounts, the pay calendar and payouts, an audit log.
-- Every table: RLS on with no policies, so only the service role (the ve-positions function) reads or writes. Safe to run twice.

create table if not exists public.ve_positions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null,
  summary text,
  posting text,
  pay_cents int not null default 12500 check (pay_cents > 0),
  period_days int not null default 14 check (period_days in (7, 14)),
  trial_days int not null default 30 check (trial_days between 0 and 120),
  mode text not null default 'assign' check (mode in ('assign', 'apply')),
  status text not null default 'draft' check (status in ('draft', 'open', 'choosing', 'filled', 'closed')),
  apply_by timestamptz,
  application jsonb not null default '[]'::jsonb,
  agreement_version text,
  agreement_text text,
  agreement_sha256 text,
  max_holders int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ve_position_people (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.ve_positions(id),
  member_id uuid references public.members(id),
  email text not null,
  name text,
  path text not null default 'assigned' check (path in ('assigned', 'applied')),
  stage text not null default 'invited' check (stage in ('applied', 'shortlisted', 'invited', 'role_read', 'agreed', 'payouts_ready',
    'awaiting_access', 'trial', 'active', 'paused', 'ended')),
  application jsonb,
  decision text not null default 'pending' check (decision in ('pending', 'selected', 'not_selected', 'redirected')),
  decision_note text,
  redirect_url text,
  decision_notified_at timestamptz,
  invite_note text,
  invited_at timestamptz,
  invite_link_code text,
  role_read_at timestamptz,
  check_passed_at timestamptz,
  agreed_at timestamptz,
  payouts_ready_at timestamptz,
  ig_handle text,
  access_granted_at timestamptz,
  access_removed_at timestamptz,
  link_code text,
  start_on date,
  trial_review_on date,
  review_notice_at timestamptz,
  paused_at timestamptz,
  ended_on date,
  end_reason text,
  offboard_done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ve_position_people_email_uq on public.ve_position_people (position_id, lower(email));
create unique index if not exists ve_position_people_member_uq on public.ve_position_people (position_id, member_id) where stage <> 'ended' and member_id is not null;
create index if not exists ve_position_people_stage_ix on public.ve_position_people (position_id, stage);
create index if not exists ve_position_people_member_ix on public.ve_position_people (member_id);

create table if not exists public.ve_position_agreements (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.ve_position_people(id),
  version text not null,
  doc_sha256 text not null,
  doc_text text not null,
  signed_name text not null,
  ip text,
  user_agent text,
  signed_at timestamptz not null default now(),
  emailed_at timestamptz,
  unique (person_id, version)
);

-- One Stripe connected account per member, whatever pays them (positions now; Ambassadors' door can move here), so one 1099 and one monthly fee.
create table if not exists public.ve_member_payout_accounts (
  member_id uuid primary key references public.members(id),
  stripe_account_id text not null unique,
  livemode boolean not null default true,
  transfers_active boolean not null default false,
  disabled_reason text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
insert into public.ve_member_payout_accounts (member_id, stripe_account_id, livemode, transfers_active, checked_at)
select member_id, stripe_account_id, not coalesce(stripe_test, false), coalesce(payouts_ready, false), payouts_checked_at
from public.ve_ambassador_door where stripe_account_id is not null
on conflict do nothing;

-- One row per person per payday. covers_from..covers_to is the work it pays for; a first stretch shorter than a period rides with the
-- first full period (Sean: "you usually have to wait a cycle to get paid... and then you get the back pay with that").
create table if not exists public.ve_position_payouts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.ve_position_people(id),
  covers_from date not null,
  covers_to date not null,
  pay_on date not null,
  days int not null check (days > 0),
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'notified', 'held', 'sending', 'sent', 'failed', 'skipped')),
  skip_reason text,
  notice_sent_at timestamptz,
  balance_alert_at timestamptz,
  held_by text,
  held_at timestamptz,
  attempts int not null default 0,
  last_error text,
  stripe_transfer_id text unique,
  livemode boolean,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (person_id, covers_from),
  unique (person_id, pay_on)
);
create index if not exists ve_position_payouts_due_ix on public.ve_position_payouts (status, pay_on);

create table if not exists public.ve_position_events (
  id bigserial primary key,
  person_id uuid references public.ve_position_people(id),
  payout_id uuid references public.ve_position_payouts(id),
  actor text not null,
  action text not null,
  detail jsonb,
  source text,
  ip text,
  at timestamptz not null default now()
);
create index if not exists ve_position_events_person_ix on public.ve_position_events (person_id, at desc);

alter table public.ve_positions enable row level security;
alter table public.ve_position_people enable row level security;
alter table public.ve_position_agreements enable row level security;
alter table public.ve_member_payout_accounts enable row level security;
alter table public.ve_position_payouts enable row level security;
alter table public.ve_position_events enable row level security;
revoke all on public.ve_positions, public.ve_position_people, public.ve_position_agreements, public.ve_member_payout_accounts,
  public.ve_position_payouts, public.ve_position_events from anon, authenticated;
-- The audit log only grows.
revoke update, delete on public.ve_position_events from service_role;

-- The pay calendar (Sean, 2026-11-13): Monday to Sunday, 14-day periods from Mon 2026-11-16; payday the Friday after a period ends.
create or replace function public.ve_pay_period_start(d date) returns date language sql immutable as $$
  select date '2026-11-16' + 14 * floor((d - date '2026-11-16') / 14.0)::int
$$;
create or replace function public.ve_pay_day(period_start date) returns date language sql immutable as $$
  select period_start + 18
$$;

-- The kill switch for real money: transfers go out only when live is true (Logan sets it after the test-mode proof).
insert into public.ve_site_settings (key, value, updated_at)
values ('positions_pay', '{"live": false, "notice_days": 2}'::jsonb, now())
on conflict (key) do nothing;

-- The first position (Sean, 2026-11-13). Assign only; KJ is the first holder.
insert into public.ve_positions (slug, title, summary, posting, pay_cents, period_days, trial_days, mode, status, agreement_version, max_holders)
values ('social-media-manager-instagram', 'Social Media Manager (Instagram)',
  'Start real conversations for Vegans Explore on Instagram, and answer the people who reply.',
  'Vegans Explore is inviting the Vegan world onto one platform, and Instagram is where most of it lives. As Social Media Manager (Instagram), '
  || 'you work through a simple queue: one profile at a time, you follow them, note whether they follow us and when they last posted, and start '
  || 'a friendly conversation with their own link to join. When people reply, you answer them, with suggested replies you can make your own. '
  || 'No posting and no content to make. Your own hours, your own phone, and you are free to take other work. $125 for each 2-week period of '
  || 'work, paid through Stripe, with a one-month trial.',
  12500, 14, 30, 'assign', 'open', 'v1', 3)
on conflict (slug) do nothing;

-- The agreement, v1 (Social Media Manager, Instagram). Plain words; an independent contractor's terms (IRS and DOL factors: outcomes, own hours,
-- own tools, free to work for others, a fee per period's work). Have a lawyer read it before a California contractor (BOSS research).
update public.ve_positions set agreement_text = $agr$Independent Contractor Agreement: Social Media Manager (Instagram), version 1

This agreement is between LESARUSS Inc., doing business as Vegans Explore ("Vegans Explore"), and you, the person signing below ("you").

1. You are an independent contractor. You are not an employee, partner or agent of Vegans Explore. You choose your own hours, your own place of work and your own phone or computer, and you are free to work for others. You receive no employee benefits, and you are responsible for your own taxes.

2. The work. Through the queue Vegans Explore gives you, you: follow the accounts listed and note what each card asks (whether they follow us back, when they last posted, anything we should know); start friendly, personal conversations on Instagram with the people listed, using their own link; answer the people who reply, using the suggested replies or your own words; and mark each card when it is done. Comments on our posts are answered within a day. Each conversation is written to the person; no copied mass messages.

3. Limits that protect the account. You stay within the daily limits the queue shows for follows and new messages, and you stop for at least 48 hours if Instagram warns about activity. You never post, edit or delete posts, stories or highlights; never change the profile, username, password, email, phone, settings or security; never invite anyone else to the account; and never use automation, bots or third-party tools on it.

4. The fee. Vegans Explore pays you $125 for each 2-week period of work, through Stripe, on the payday the queue shows. Periods run Monday to Sunday; payday is the Friday after a period ends. Your first days before a full period are paid at the same daily rate ($125 divided by 14) with your first full period, and your last period is paid the same way to your end date. A period's fee is paid for that period's work done through the queue. You set up payouts with Stripe, including your W-9, before your first payday; Stripe holds your bank and tax details, not Vegans Explore.

5. Trial and ending. The first month is a trial. Either of us may end this agreement at any time with 7 days' written notice (an email is enough), or right away for a breach of sections 3, 6 or 7. You are paid through your end date.

6. Access. You use Instagram's Shared Access, with your own login; no password is shared. Vegans Explore may see an activity log and may remove your access at any time. You keep your own account secure (two-factor authentication on), and you tell us within 24 hours if you think someone else has used your access.

7. Confidentiality and conduct. You keep private what you learn about Vegans Explore, its members, the businesses and people you contact, and its plans. You speak for Vegans Explore warmly, honestly and in its voice: "Vegan" with a capital V, never pushy, never promising anything Vegans Explore has not built, and a business that is not Vegan is described as offering plant-based (Pre-Vegan) options. You do not promote yourself or anyone else from the account.

8. Ownership. The conversations, notes and records you make for Vegans Explore belong to Vegans Explore. You assign to Vegans Explore any rights you have in them.

9. When it ends. Your access is removed, and you return or delete anything of Vegans Explore's you hold. Sections 7 and 8 continue after the agreement ends.

10. General. Florida law governs this agreement. It is the whole agreement about this work; if a part cannot be enforced, the rest still applies. Signing electronically (your typed name and the checkbox) is the same as signing on paper, and a copy is emailed to you.$agr$,
  agreement_sha256 = null, updated_at = now()
where slug = 'social-media-manager-instagram' and (agreement_text is null or agreement_version = 'v1' and agreement_sha256 is null);
update public.ve_positions set agreement_sha256 = encode(sha256(convert_to(agreement_text, 'UTF8')), 'hex')
where slug = 'social-media-manager-instagram' and agreement_text is not null and agreement_sha256 is null;
