-- The handshake, step 3's gate (canon canon-ve-front-of-house v8, LOCKED by Sean 2026-10-31; built the same day: "then the handshakes").
-- The BrandDesk pitch page goes only to a business that has shown a sign, or to Sean's warm list; never a cold $500 ask. The pitch list
-- (Depot > BrandDesk > Pitch list) gets a Signs filter and each row shows its signs.
--
-- ve_free_check_events: every free restaurant check asked for a listed business (kind ran; a check that reuses a recent run of the same
-- business wrote nothing before, and the monthly check-ups make that common) and every time someone outside the team opens a business's
-- check (kind opened: the link in business outreach's first email goes there). Written by ve-restaurant-audit. RLS on, no policies.
--
-- ve_branddesk_signs(): per listing, each sign once with its latest time, from what actually happened:
--   clicked  their outreach link clicked or a reply (ve_outreach_contacts interested or joined, which ve_outreach_sync sets from real clicks)
--   claimed  they claimed their listing (a claim paid, submitted or approved, not a test) or own it
--   checked  they ran the free check on their business
--   opened   they opened their free check (from the email)
--   guide    the Vegan Restaurant Guide bought by the owner, or by the email we write to or that claimed it
--   asked    a Have us do it / Talk to our team request for the business (ve_initiative_interest branddesk with its slug, or from its email)
--   talked   on a pitch page: I'm ready, Let me think about it, or Talk to someone
create table if not exists public.ve_free_check_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  audit_id uuid references public.ve_audits(id) on delete set null,
  kind text not null check (kind in ('ran', 'opened')),
  member_id uuid,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists ve_free_check_events_listing on public.ve_free_check_events(listing_id, created_at desc);
alter table public.ve_free_check_events enable row level security;

create or replace function public.ve_branddesk_signs()
returns table(listing_id uuid, signs jsonb)
language sql stable security definer set search_path to 'public'
as $$
  with emails as (
    select o.listing_id, lower(o.email) as email from ve_outreach_contacts o where o.listing_id is not null and o.email is not null
    union select c.listing_id, lower(c.contact_email) from ve_listing_claims c where c.contact_email is not null and not c.test
  ), s as (
    select o.listing_id, 'clicked' as kind, coalesce(o.interested_at, o.updated_at) as at from ve_outreach_contacts o
     where o.listing_id is not null and (o.interested_at is not null or o.status in ('interested', 'joined'))
    union all
    select c.listing_id, 'claimed', coalesce(c.paid_at, c.created_at) from ve_listing_claims c where not c.test and c.status in ('paid', 'submitted', 'approved')
    union all
    select l.id, 'claimed', l.updated_at from listings l where l.owner_member_id is not null and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep', 'Markets')
    union all
    select e.listing_id, case e.kind when 'ran' then 'checked' else 'opened' end, e.created_at from ve_free_check_events e
    union all
    select a.listing_id, 'checked', a.created_at from ve_audits a where a.tier = 'free' and a.listing_id is not null
    union all
    select l.id, 'guide', gp.purchased_at from ve_guide_purchases gp
      join ve_guides g on g.id = gp.guide_id and g.slug = 'vegan-restaurant-guide'
      join members m on m.id = gp.member_id
      join listings l on l.owner_member_id = m.id
    union all
    select e.listing_id, 'guide', gp.purchased_at from ve_guide_purchases gp
      join ve_guides g on g.id = gp.guide_id and g.slug = 'vegan-restaurant-guide'
      join members m on m.id = gp.member_id
      join emails e on e.email = lower(m.email)
    union all
    select l.id, 'asked', i.created_at from ve_initiative_interest i join listings l on l.slug = any(i.tags)
     where i.initiative_slug = 'branddesk' and coalesce(i.tier_label, '') not like '[TEST]%'
    union all
    select e.listing_id, 'asked', i.created_at from ve_initiative_interest i join emails e on e.email = lower(i.email)
     where i.initiative_slug = 'branddesk' and coalesce(i.tier_label, '') not like '[TEST]%'
    union all
    select p.listing_id, 'talked', p.choice_at from ve_branddesk_pitches p where p.choice in ('ready', 'think', 'talk')
  )
  select s.listing_id, jsonb_agg(jsonb_build_object('kind', s.kind, 'at', s.at) order by s.at desc)
    from (select s.listing_id, s.kind, max(s.at) as at from s group by 1, 2) s
   group by s.listing_id
$$;
revoke all on function public.ve_branddesk_signs() from public, anon, authenticated;
grant execute on function public.ve_branddesk_signs() to service_role;
