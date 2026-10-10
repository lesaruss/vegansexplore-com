-- Partner onboarding (Sean, 2026-10-10: "go ahead and build the onboarding"; the outreach plan: "once they sign up, the
-- welcome runs automatically, and the assigned person gets a task to reach out personally").
--
-- One row per business that claims its page (ve_listing_claims, paid or submitted, never a test). It waits for Sean's
-- approval (Depot > Claims); approving starts it:
--   automatic: three emails from Sean after the "your page is confirmed" email ve-claims already sends
--     Day 2   make the page yours (Edit your page on the Partner Dashboard, or reply and we do it)
--     Day 7   the first week's numbers (views and visitors, from ve_listing_events)
--     Day 21  what's coming in Q1, and what they want to be part of (and, on Front Row Start, when the first charge is)
--   personal: a checklist for the city's Community Manager, or Sean when the city has none, who is emailed the task:
--     welcome them personally within 2 days, confirm the page details, get a clear logo and photos onto the page, ask
--     which Q1 campaigns they want in on. Depot > Business outreach > New partners shows it.
-- ve-outreach `tick` sends the emails (weekdays 9 AM to 5 PM Eastern) and the task emails.

create table if not exists public.ve_partner_onboarding (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  claim_id uuid references public.ve_listing_claims(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  tier text,
  contact_name text,
  contact_email text,
  community_slug text,
  route_to text check (route_to in ('sean', 'community_manager')),
  assigned_member_id uuid references public.members(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'onboarding', 'done', 'closed')),
  submitted_at timestamptz,
  approved_at timestamptz,
  step integer not null default 0,          -- onboarding emails sent
  next_send_at timestamptz,
  notified_at timestamptz,                  -- when the assigned person was emailed the task
  checklist jsonb not null default '{}'::jsonb,   -- {item: {done_at, by}}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_partner_onboarding enable row level security;

create table if not exists public.ve_onboarding_templates (
  step integer primary key check (step between 1 and 3),
  day_after integer not null,
  subject text not null,
  body text not null,       -- {first_name} {business} {in_city} {page_link} {dashboard_link} {numbers_line} {charge_line}
  updated_at timestamptz not null default now()
);
alter table public.ve_onboarding_templates enable row level security;

-- The city a listing belongs to (the outreach city rules, which copy VE_HUBS), or brands for a product brand.
create or replace function public.ve_listing_city(p_listing uuid) returns text
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(
    (select c.community_slug from ve_outreach_contacts c where c.listing_id = p_listing),
    (select case when l.category in ('Food Brands', 'Brands') then 'brands' end from listings l where l.id = p_listing),
    (select oc.community_slug from listings l join ve_outreach_cities oc
       on (oc.cities is not null or oc.states is not null)
      and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states))
     where l.id = p_listing order by (oc.cities is not null) desc limit 1))
$fn$;
revoke all on function public.ve_listing_city(uuid) from public, anon, authenticated;

-- 10 AM Eastern (14:00 UTC; 9 AM in winter) that many days on, moved off the weekend.
create or replace function public.ve_weekday_morning(p_from timestamptz, p_days integer) returns timestamptz
language plpgsql immutable as $fn$
declare d date := (p_from at time zone 'America/New_York')::date + p_days;
begin
  while extract(isodow from d) > 5 loop d := d + 1; end loop;
  return (d::timestamp + time '14:00') at time zone 'UTC';
end $fn$;

-- A claim paid or submitted starts the row; approval starts onboarding; a turned-down claim closes a row still waiting.
create or replace function public.ve_partner_onboarding_from_claim() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare city text; cm uuid;
begin
  if coalesce(new.test, false) then return new; end if;
  if new.status in ('submitted', 'approved') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    city := ve_listing_city(new.listing_id);
    insert into ve_partner_onboarding (listing_id, claim_id, member_id, tier, contact_name, contact_email, community_slug, submitted_at)
    values (new.listing_id, new.id, new.member_id, new.tier, new.contact_name, new.contact_email, city, coalesce(new.paid_at, now()))
    on conflict (listing_id) do update set claim_id = excluded.claim_id, member_id = excluded.member_id, tier = excluded.tier,
      contact_name = excluded.contact_name, contact_email = excluded.contact_email,
      status = case when ve_partner_onboarding.status = 'closed' then 'waiting' else ve_partner_onboarding.status end, updated_at = now();
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    select community_slug into city from ve_partner_onboarding where listing_id = new.listing_id;
    select id into cm from members where ve_role = 'community_manager' and home_community = city order by created_at limit 1;
    update ve_partner_onboarding set status = 'onboarding', approved_at = now(), step = 0,
      next_send_at = ve_weekday_morning(now(), (select day_after from ve_onboarding_templates where step = 1)),
      route_to = case when cm is null then 'sean' else 'community_manager' end, assigned_member_id = cm, updated_at = now()
    where listing_id = new.listing_id and status in ('waiting', 'closed');
  elsif new.status = 'rejected' and tg_op = 'UPDATE' and old.status is distinct from 'rejected' then
    update ve_partner_onboarding set status = 'closed', updated_at = now() where listing_id = new.listing_id and status = 'waiting' and claim_id = new.id;
  end if;
  return new;
end $fn$;
revoke all on function public.ve_partner_onboarding_from_claim() from public, anon, authenticated;
create or replace trigger trg_ve_partner_onboarding after insert or update of status on public.ve_listing_claims
  for each row execute function public.ve_partner_onboarding_from_claim();

-- The email exactly as it goes out.
create or replace function public.ve_onboarding_render(p_listing uuid, p_step integer)
returns table (subject text, body text, to_email text)
language plpgsql stable security definer set search_path to 'public' as $fn$
declare o record; l record; t record; m record; city text; first text; v int; who int; nl text; cl text := '';
begin
  select * into o from ve_partner_onboarding where listing_id = p_listing;
  select * into l from listings where id = p_listing;
  select * into t from ve_onboarding_templates where step = p_step;
  if o is null or l is null or t is null or coalesce(o.contact_email, '') = '' then return; end if;
  city := case when o.community_slug is null or o.community_slug = 'brands' then '' else (select name from ve_outreach_cities where community_slug = o.community_slug) end;
  first := nullif(split_part(trim(coalesce(o.contact_name, '')), ' ', 1), '');
  select count(*) filter (where kind = 'view'), count(distinct visitor) into v, who
    from ve_listing_events where listing_id = p_listing and via is distinct from 'test' and created_at > coalesce(o.approved_at, now()) - interval '7 days';
  nl := case when coalesce(v, 0) = 0 then 'Your page is new, so the numbers are just starting, and every visit from here counts.'
    else 'In the last week your page had ' || v || case when v = 1 then ' view' else ' views' end || ' from ' || greatest(who, 1)
      || case when greatest(who, 1) = 1 then ' person.' else ' people.' end end;
  select * into m from ve_verified_memberships where listing_id = p_listing and tier = 'brand' and status not in ('canceled') order by created_at desc limit 1;
  if m is not null and m.paid_at is null and m.renews_at > now() then
    cl := E'\n\nA reminder: the rest of 2026 is on us, and your first quarter starts on '
      || to_char(m.renews_at at time zone 'America/New_York', 'FMMonth FMDD, YYYY')
      || '. If it isn''t right for you, reply before then and you won''t be charged.';
  end if;
  subject := replace(replace(t.subject, '{business}', l.name), '{in_city}', case when city = '' then '' else ' in ' || city end);
  body := replace(replace(replace(replace(replace(replace(replace(t.body,
    '{first_name}', coalesce(first, 'there')),
    '{business}', l.name),
    '{in_city}', case when city = '' then '' else ' in ' || city end),
    '{page_link}', 'https://vegansexplore.com/directory/' || l.slug),
    '{dashboard_link}', 'https://vegansexplore.com/directory/' || l.slug || '?tab=brand'),
    '{numbers_line}', nl),
    '{charge_line}', cl);
  to_email := lower(o.contact_email);
  return next;
end $fn$;
revoke all on function public.ve_onboarding_render(uuid, integer) from public, anon, authenticated;
grant execute on function public.ve_onboarding_render(uuid, integer), public.ve_listing_city(uuid) to service_role;

insert into public.ve_onboarding_templates (step, day_after, subject, body) values
(1, 2, 'Let''s make {business}''s page yours', $t$Hi {first_name},

Now that your page is confirmed, let's get it looking its best. On your page, open the Partner Dashboard tab and press Edit your page. You can add your logo and photos and update your description, hours and links, and it takes about five minutes: {dashboard_link}

Rather we do it? Reply with your logo, three to five photos you love, and anything that should change, and we'll put it on your page for you.

Sean$t$),
(2, 7, '{business}''s first week on Vegans Explore', $t$Hi {first_name},

Here's your first week. {numbers_line}

Your Partner Dashboard shows your numbers any time: {dashboard_link}

They grow as our members find you and as you join our campaigns. If anything on your page could be better, just reply and tell me.

Sean$t$),
(3, 21, 'What''s coming{in_city} in Q1', $t$Hi {first_name},

We're planning our Q1 2027 campaigns now, and as a partner you see each one before it opens. Reply and tell me what you'd like to be part of:

- Sampling with our members at events
- Being featured in one of our Guides
- Hosting a community night
- Ads on our pages

I'll make sure you're in the first conversations.{charge_line}

Sean$t$)
on conflict (step) do nothing;

-- Found while building this (2026-10-10): ve_listing_claims only allowed tier verified or plus, so a claim on the Partner
-- plan (tier brand, the default on Join the Directory and where the outreach emails lead) failed to save. No claim had
-- been made yet. 20261008_brand_partner_tier.sql widened ve_verified_memberships but not this table.
alter table public.ve_listing_claims drop constraint if exists ve_listing_claims_tier_check;
alter table public.ve_listing_claims add constraint ve_listing_claims_tier_check check (tier = any (array['verified', 'plus', 'brand']));
