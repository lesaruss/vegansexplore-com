-- The Ambassador door (Sean, 2026-10-29: "Build the ambassador door"; canon canon-ve-ambassadors-talent-shop). Paid work needs
-- activation, a self-updating checklist: 1. profile (their own People listing, claimed and approved, with a photo and a bio),
-- 2. platforms (their accounts and audience; YouTube read from YouTube, the rest self-reported), 3. rates (team only), 4. get paid
-- (Stripe Connect Express: bank, identity and tax details on Stripe's own pages). Not active yet until all four; reminders Day 2,
-- Day 7, then weekly; Active with an email to them and Sean when done. Everything goes through the edge function ve-ambassador.

create table if not exists public.ve_ambassador_door (
  member_id uuid primary key references public.members(id) on delete cascade,
  started_at timestamptz not null default now(),
  platforms jsonb not null default '[]'::jsonb,          -- [{kind, handle, url, followers, verified, checked_at}]
  rates jsonb not null default '{}'::jsonb,              -- {post, reel, story, appearance, hosting, social_day} in whole dollars, notes
  rates_at timestamptz,
  skills text[] not null default '{}',                   -- what they do (recipes, fitness, hosting, speaking, ugc, photo, edit, design, social)
  chapters text[] not null default '{}',                 -- hub slugs they can work in
  stripe_account_id text,
  stripe_test boolean not null default false,
  payouts_ready boolean not null default false,
  payouts_checked_at timestamptz,
  active_at timestamptz,
  reminders int not null default 0,
  last_reminder_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.ve_ambassador_door enable row level security;

-- An Ambassador asks for their People listing (or for one to be made); the team approves it in Depot > Ambassadors > Paid work.
create table if not exists public.ve_profile_claims (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  new_profile jsonb,                                     -- {name, title, bio} when no listing exists yet
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  decided_at timestamptz,
  decided_by uuid,
  decision_note text,
  created_at timestamptz not null default now()
);
create unique index if not exists ve_profile_claims_one_pending on public.ve_profile_claims (member_id) where status = 'pending';
alter table public.ve_profile_claims enable row level security;

-- Reminders: once a day at 10:17 AM Eastern (14:17 UTC); ve-ambassador decides who is due (Day 2, Day 7, then every 7 days).
select cron.unschedule(j.jobid) from cron.job j where j.jobname = 've-ambassador-remind';
select cron.schedule('ve-ambassador-remind', '17 14 * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ambassador',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"remind"}'::jsonb, timeout_milliseconds := 30000);
$c$);
