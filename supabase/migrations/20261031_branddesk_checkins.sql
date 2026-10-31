-- The monthly check-in and report for BrandDesk clients (canon-ve-front-of-house: "a monthly Community Manager check-in on a fixed
-- question set... live results on the business dashboard"; build order after visit bounties, Sean's "continue" 2026-10-31).
-- One row per client a month. The daily ve-branddesk checkin_sweep opens this month's for every active client and emails whoever does it
-- (the chapter's Community Manager, else the team); a reminder goes on the 10th if it is not sent. The Community Manager answers the
-- fixed questions with the owner, writes what the month meant and what we do next, and sends it: the numbers are frozen then and the
-- report opens on the client's dashboard (Managed by us > Monthly reports).
create table if not exists public.ve_branddesk_checkins (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  month date not null check (extract(day from month) = 1),
  status text not null default 'due' check (status in ('due', 'in_progress', 'sent')),
  assigned_to uuid references public.members(id),
  answers jsonb not null default '{}'::jsonb,
  summary text check (char_length(summary) <= 4000),
  next_month text check (char_length(next_month) <= 4000),
  numbers jsonb,
  reminded_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members(id),
  unique (account_id, month)
);
alter table public.ve_branddesk_checkins enable row level security;
create index if not exists ve_branddesk_checkins_assigned_idx on public.ve_branddesk_checkins (assigned_to, status);

-- A month's numbers for one listing: page views and visitors, what visitors did next, member check-ins, approved member visits (visit
-- bounties) and the files added to their Library. p_from inclusive, p_to exclusive.
create or replace function public.ve_branddesk_month_numbers(p_listing uuid, p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'views', (select count(*) from ve_listing_events where listing_id = p_listing and kind = 'view' and created_at >= p_from and created_at < p_to),
    'visitors', (select count(distinct visitor) from ve_listing_events where listing_id = p_listing and kind = 'view' and created_at >= p_from and created_at < p_to),
    'actions', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from ve_listing_events
        where listing_id = p_listing and kind <> 'view' and created_at >= p_from and created_at < p_to group by kind) x), '{}'::jsonb),
    'checkins', (select count(*) from ve_checkins where listing_id = p_listing and created_at >= p_from and created_at < p_to),
    'visits', (select count(*) from ve_bounty_submissions s join ve_bounties b on b.id = s.bounty_id
        where b.visit_listing_id = p_listing and s.status = 'approved' and coalesce(s.reviewed_at, s.updated_at) >= p_from and coalesce(s.reviewed_at, s.updated_at) < p_to),
    'files', (select count(*) from ve_branddesk_files where listing_id = p_listing and removed_at is null and kind <> 'archive' and created_at >= p_from and created_at < p_to)
  );
$$;
revoke all on function public.ve_branddesk_month_numbers(uuid, date, date) from public, anon, authenticated;

select cron.schedule('ve-branddesk-checkins', '7 13 * * *', $c$
  select net.http_post('https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-branddesk', '{"action":"checkin_sweep"}'::jsonb, '{}'::jsonb,
    jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from lesaruss_secrets where key='CRON_SECRET')), 60000);
$c$);
