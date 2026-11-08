-- ve-community-directory T3: the listing-request queue (Sean, 2026-11-06, Blueprint idea f8adc4c3: "the Directory Playbook is always
-- processing new listing requests... Just me [straight in]. Everyone else goes into a queue that shows on my dashboard... Work first so
-- I can decide if it goes on the directory or in the vetting section or removed").
-- One row a request. Sean's own (a super admin's token) go straight to work: drafted by the worker and finished by Logan, never on For you.
-- Everyone else's are researched and drafted first (ve-listing-requests research, which reads the link or name through ve-listing-intake),
-- then show on Sean's dashboard For you with Publish, Send to vetting, Remove. A draft is a quarantined listing (crawl_source listing-request).
create table if not exists public.ve_listing_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('sean','member','visitor','feedback')),
  member_id uuid references public.members(id) on delete set null,
  contact_name text,
  contact_email text,
  visitor text,
  name text,
  where_text text,
  link text,
  note text,
  page_url text,
  idea_id uuid,
  feedback_id uuid,
  status text not null default 'new' check (status in ('new','drafted','published','vetting','removed','failed')),
  attempts int not null default 0,
  researched_at timestamptz,
  found jsonb,
  read jsonb,
  duplicate_of uuid references public.listings(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  error text,
  decided_at timestamptz,
  decided_by uuid references public.members(id) on delete set null,
  decision_note text
);
create index if not exists ve_listing_requests_status on public.ve_listing_requests (status, created_at);
alter table public.ve_listing_requests enable row level security;

insert into public.ve_site_settings (key, value)
values ('listing_requests', '{"daily_reads": 20, "per_sender_day": 5, "per_day": 100}'::jsonb)
on conflict (key) do nothing;

-- The worker: every 15 minutes, three drafts a run (only when something is new).
select cron.schedule('ve-listing-requests', '*/15 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-requests',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from lesaruss_secrets where key='CRON_SECRET')),
    body := '{"action":"research"}'::jsonb, timeout_milliseconds := 140000)
  where exists (select 1 from public.ve_listing_requests where status = 'new' and attempts < 3);
$$);

-- The first request: Juices For Life (worked by hand on 2026-11-08, migration 20261108_juices_for_life.sql).
insert into public.ve_listing_requests (source, name, where_text, note, idea_id, status, listing_id, researched_at, decided_at, decision_note)
select 'sean', 'Juices For Life (Styles P and Adjua Styles)', 'Bronx and White Plains, NY', 'From an 8 At The Table post on Facebook.',
  'f8adc4c3-257a-4b95-be60-423a0a872632', 'published', (select id from listings where slug='juices-for-life' and status='approved' limit 1), now(), now(),
  'Worked by Logan: three shops listed (Castle Hill, Throggs Neck, Juice 2 Heal White Plains).'
where not exists (select 1 from public.ve_listing_requests where idea_id = 'f8adc4c3-257a-4b95-be60-423a0a872632');
