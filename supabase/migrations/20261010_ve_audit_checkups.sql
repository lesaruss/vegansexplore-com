-- Monthly check-ups (Sean, 2026-10-10: "run this audit on each of the cities once a month and flag any listings that may
-- seem like they are closed due to lack of social activity, out of date web information, and closed message on Google").
--
-- Every local business in a city (the categories below, in a ve_outreach_cities city) is audited once a month by
-- ve-restaurant-audit `sweep`, run by cron at night, city by city. Each audit carries a closure flag:
--   closed  Google itself shows the business as closed (temporarily or for good)
--   quiet   two or more signs it may have closed: the website does not open, no Instagram post in six months or the
--           account is gone, a footer three or more years old, no hours on Google, no Google review in a year,
--           Google has no profile for it
-- Sean (or a Community Manager) reviews each flag in Depot > Business outreach > Check-ups: No longer in business (the
-- existing listing_closed, which moves it to Closed and off the email list) or Still open. Until a `closed` flag is
-- reviewed, the outreach sender does not email that business.

alter table public.ve_audits add column if not exists source text not null default 'request';
alter table public.ve_audits add column if not exists closure_level text check (closure_level in ('closed', 'quiet'));
alter table public.ve_audits add column if not exists closure_signals text[];
create index if not exists ve_audits_closure_idx on public.ve_audits (listing_id, created_at desc) where closure_level is not null;

create table if not exists public.ve_audit_flag_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  audit_id uuid not null references public.ve_audits(id) on delete cascade,
  decision text not null check (decision in ('still_open', 'closed')),
  note text,
  by_member uuid,
  created_at timestamptz not null default now(),
  unique (audit_id)
);
alter table public.ve_audit_flag_reviews enable row level security;

-- The local businesses a check-up covers. Brands, books, films, podcasts and the like have no storefront to close.
create or replace function public.ve_audit_local_category(p text) returns boolean language sql immutable as $$
  select p in ('Restaurants', 'Bakeries & Cafes', 'Markets', 'Meal Prep', 'Catering', 'Fitness and Athletics',
    'Health and Wellness', 'Beauty and Personal Care', 'Clothing and Fashion')
$$;

-- What the sweep audits next: public local businesses in a city with no audit in the last 28 days, a city at a time.
create or replace function public.ve_audit_sweep_due(p_limit integer default 3)
returns table (slug text, community_slug text) language sql stable security definer set search_path = public as $$
  select l.slug, oc.community_slug
  from listings l
  join ve_outreach_cities oc on oc.community_slug <> 'brands'
    and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states))
  where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
    and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
    and ve_audit_local_category(l.category) and l.slug is not null
    and not exists (select 1 from ve_audits a where a.listing_id = l.id and a.created_at > now() - interval '28 days')
  order by oc.community_slug, l.name
  limit greatest(1, least(p_limit, 10))
$$;

-- Open flags: each listing's latest audit, when it is flagged and nobody has reviewed it. A quiet flag stays down for
-- 90 days after someone said Still open; Google saying closed always shows.
create or replace function public.ve_audit_open_flags()
returns table (audit_id uuid, listing_id uuid, closure_level text, closure_signals text[], audited_at timestamptz)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (a.listing_id) a.id, a.listing_id, a.closure_level, a.closure_signals, a.created_at
    from ve_audits a where a.listing_id is not null and a.status = 'done'
    order by a.listing_id, a.created_at desc
  )
  select x.id, x.listing_id, x.closure_level, x.closure_signals, x.created_at
  from latest x join listings l on l.id = x.listing_id
  where x.closure_level is not null and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
    and not exists (select 1 from ve_audit_flag_reviews r where r.audit_id = x.id)
    and not (x.closure_level = 'quiet' and exists (select 1 from ve_audit_flag_reviews r
      where r.listing_id = x.listing_id and r.decision = 'still_open' and r.created_at > now() - interval '90 days'))
$$;
revoke all on function public.ve_audit_sweep_due(integer) from public, anon, authenticated;
revoke all on function public.ve_audit_open_flags() from public, anon, authenticated;
grant execute on function public.ve_audit_sweep_due(integer) to service_role;
grant execute on function public.ve_audit_open_flags() to service_role;

-- The sender skips a business Google shows as closed until someone has reviewed the flag.
create or replace function public.ve_outreach_due(p_limit integer default 100)
returns table (contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path = public as $$
  select c.id, c.community_slug, c.listing_id, c.email, c.step + 1
  from ve_outreach_contacts c
  join ve_outreach_batches b on b.id = c.batch_id and b.status in ('approved', 'sent')
  join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled
  where c.step < 3
    and ((c.status = 'not_sent' and c.step = 0 and b.send_on <= (now() at time zone 'America/New_York')::date)
      or (c.status = 'in_sequence' and c.next_send_at <= now()))
    and not exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email))
    and exists (select 1 from ve_outreach_templates t where t.step = c.step + 1 and t.status = 'ready')
    and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = c.listing_id and f.closure_level = 'closed')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$$;

-- Nightly, 2 to 4 AM Eastern (06:00 to 07:45 UTC), three businesses every 15 minutes: about 24 a night, every city
-- covered within the month.
select cron.unschedule('ve-audit-sweep') where exists (select 1 from cron.job where jobname = 've-audit-sweep');
select cron.schedule('ve-audit-sweep', '*/15 6-7 * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-restaurant-audit',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"sweep","limit":3}'::jsonb, timeout_milliseconds := 120000)
$c$);
