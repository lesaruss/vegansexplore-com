-- Business outreach, city by city (Sean, 2026-10-10: "let's just make sure we're not sending any emails. I just want to
-- get this set up... when I say go... let's go city by city. And not try to hit everybody at once"). Goal: businesses on
-- board for Q1 2027 through Front Row Start (no charge until January 1, cancel before then and owe nothing).
--
-- Every city starts OFF (ve_outreach_cities.enabled). Nothing in this migration sends mail and no sender is wired yet;
-- ve_outreach_due() is what a sender would pick up, and it returns nothing while a city is off.
-- A business gets three emails from Sean (Day 0, 4, 10, ve_outreach_templates). Any click, reply, claim or opt-out stops
-- the sequence. A click, reply or claim makes it Interested, and it is routed to the city's Community Manager, or to Sean
-- when the city has none (ve_outreach_contacts.route_to / assigned_member_id). The interest queue is ve_outreach_queue.

create table if not exists public.ve_outreach_cities (
  community_slug text primary key,
  name text not null,
  states text[],                -- same rule as VE_HUBS[].match in /public/ve-hubs.js: city in cities, state in states
  cities text[],
  enabled boolean not null default false,
  daily_cap integer not null default 30,
  enabled_at timestamptz,
  enabled_by text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ve_outreach_templates (
  step integer primary key check (step between 1 and 3),
  day_offset integer not null,
  subject text not null,
  body text not null,           -- {first_name} {business} {city} {link} {guide}
  status text not null default 'ready' check (status in ('draft', 'ready')),
  updated_at timestamptz not null default now()
);

create table if not exists public.ve_outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  community_slug text not null references public.ve_outreach_cities(community_slug),
  email text not null,
  contact_name text,
  segment text not null default 'business' check (segment in ('brand', 'business')),
  status text not null default 'not_sent' check (status in
    ('not_sent', 'in_sequence', 'finished', 'interested', 'joined', 'not_interested', 'opted_out', 'bounced', 'held')),
  step integer not null default 0,          -- last step sent
  next_send_at timestamptz,
  last_sent_at timestamptz,
  link_code text,                            -- personal ve_links code, made at first send
  stop_reason text,
  route_to text check (route_to in ('sean', 'community_manager')),
  assigned_member_id uuid references public.members(id),
  interested_at timestamptz,
  joined_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_outreach_contacts_city_idx on public.ve_outreach_contacts (community_slug, status, next_send_at);

create table if not exists public.ve_outreach_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.ve_outreach_contacts(id) on delete cascade,
  kind text not null check (kind in ('sent', 'clicked', 'replied', 'claimed', 'opted_out', 'bounced', 'routed', 'note', 'status')),
  step integer,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ve_outreach_events_contact_idx on public.ve_outreach_events (contact_id, created_at desc);

alter table public.ve_outreach_cities enable row level security;
alter table public.ve_outreach_templates enable row level security;
alter table public.ve_outreach_contacts enable row level security;
alter table public.ve_outreach_events enable row level security;
-- No policies: admin tools reach these through service-role functions only.

-- Interested: route it. The city's Community Manager if it has one, else Sean.
create or replace function public.ve_outreach_route() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare cm uuid;
begin
  if new.status = 'interested' and old.status is distinct from 'interested' then
    new.interested_at := coalesce(new.interested_at, now());
    new.next_send_at := null;
    if new.route_to is null then
      select id into cm from members where ve_role = 'community_manager' and home_community = new.community_slug
        order by created_at limit 1;
      new.route_to := case when cm is null then 'sean' else 'community_manager' end;
      new.assigned_member_id := coalesce(new.assigned_member_id, cm);
      insert into ve_outreach_events (contact_id, kind, detail)
        values (new.id, 'routed', jsonb_build_object('route_to', new.route_to, 'member_id', cm));
    end if;
  end if;
  if new.status in ('finished', 'joined', 'not_interested', 'opted_out', 'bounced', 'held') then
    new.next_send_at := null;
  end if;
  new.updated_at := now();
  return new;
end $fn$;
revoke all on function public.ve_outreach_route() from public, anon, authenticated;
create or replace trigger trg_ve_outreach_route before update on public.ve_outreach_contacts
  for each row execute function public.ve_outreach_route();

-- What a sender would send now: only enabled cities, within each city's daily cap, brands first, never a suppressed
-- address. Returns nothing while every city is off.
create or replace function public.ve_outreach_due(p_limit integer default 100)
returns table (contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path to 'public' as $fn$
  with sent_today as (
    select c.community_slug, count(*) n from ve_outreach_events e join ve_outreach_contacts c on c.id = e.contact_id
    where e.kind = 'sent' and e.created_at >= date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York'
    group by 1
  ), ranked as (
    select c.id, c.community_slug, c.listing_id, c.email, c.step + 1 next_step,
      row_number() over (partition by c.community_slug order by (c.segment = 'brand') desc, c.step desc, c.created_at) rn,
      greatest(oc.daily_cap - coalesce(s.n, 0), 0) room
    from ve_outreach_contacts c
    join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled
    left join sent_today s on s.community_slug = c.community_slug
    where c.step < 3
      and ((c.status = 'not_sent' and c.step = 0) or (c.status = 'in_sequence' and c.next_send_at <= now()))
      and not exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email))
      and exists (select 1 from ve_outreach_templates t where t.step = c.step + 1 and t.status = 'ready')
  )
  select id, community_slug, listing_id, email, next_step from ranked where rn <= room limit p_limit
$fn$;
revoke all on function public.ve_outreach_due(integer) from public, anon, authenticated;

-- The interest queue: who to follow up with, newest first.
create or replace view public.ve_outreach_queue with (security_invoker = true) as
select c.id, c.status, c.community_slug, oc.name city, l.name business, l.slug, l.category, c.email, c.contact_name,
  c.segment, c.route_to, c.assigned_member_id, m.name assigned_name, c.interested_at, c.step, c.notes
from ve_outreach_contacts c
join listings l on l.id = c.listing_id
join ve_outreach_cities oc on oc.community_slug = c.community_slug
left join members m on m.id = c.assigned_member_id
where c.status in ('interested', 'joined')
order by c.interested_at desc nulls last;
revoke all on public.ve_outreach_queue from anon, authenticated;

-- Cities, all off. Rules copied from VE_HUBS (change both together).
insert into public.ve_outreach_cities (community_slug, name, states, cities) values
  ('south-florida', 'South Florida', null, array['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade']),
  ('central-florida', 'Central Florida', array['FL'], array['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala']),
  ('atlanta', 'Atlanta', array['GA'], null),
  ('dmv', 'DMV', array['DC','MD','VA'], null),
  ('new-york', 'New York', array['NY'], null),
  ('philadelphia', 'Philadelphia', array['PA'], null),
  ('los-angeles', 'Los Angeles', null, array['Los Angeles','West Hollywood','North Hollywood','Reseda','Canoga Park']),
  ('london', 'London', null, array['London'])
on conflict (community_slug) do nothing;

-- The three emails, from Sean (sender email_brands 'lesaruss': Sean A. Russell, replies to contact@lesaruss.com).
-- No price in the emails: the $111 is on the Partner Dashboard (gift first). Campaigns are described as coming.
insert into public.ve_outreach_templates (step, day_offset, subject, body) values
(1, 0, 'We built a page for {business}', $t$Hi {first_name},

I'm Sean, founder of Vegans Explore, the home for the Vegan community in {city}. We put {business} in our Directory and built you a page, where our members find you, vote for you and save you. It's yours to keep, whatever you decide.

Take a look: {link}

We're lining up our Q1 campaigns in {city} now, and we'd love to have you in the front row. Open the Partner Dashboard tab on your page and {guide} will walk you through it in two minutes.

Sean A. Russell
Founder, Vegans Explore$t$),
(2, 4, 'Your front-row seat in {city}', $t$Hi {first_name},

A quick follow-up. Businesses that join before January 1 get the rest of 2026 on us. No charge today, your page is yours to run, and you're first in line for our Q1 campaigns and promotions in {city}. The sooner you're in, the more of them you're part of. If it isn't right for you, cancel before January and you owe nothing.

Your page: {link}

Sean$t$),
(3, 10, 'Last note from me', $t$Hi {first_name},

I won't keep filling your inbox. Your page stays up either way, and the front-row offer is open until January 1. If you'd like to talk it through, just reply and I'll answer personally.

{link}

Sean$t$)
on conflict (step) do nothing;

-- The June 2026 queue (the old $11 claim offer through beehiiv) was never sent and is replaced by this. Kept, not deleted.
update public.listing_outreach set status = 'skipped',
  notes = coalesce(notes || E'\n', '') || '2026-10-10: retired, never sent (old $11 claim offer); replaced by ve_outreach_contacts.'
where status = 'queued';

-- Load every city's public, unclaimed listings that have an email, as Not sent yet. Brands are segment 'brand' and go
-- first when a city is switched on.
insert into public.ve_outreach_contacts (listing_id, community_slug, email, contact_name, segment)
select distinct on (l.id) l.id, oc.community_slug,
  lower(trim(coalesce(nullif(l.ve_contact_email, ''), nullif(l.email, ''), o.email))),
  coalesce(nullif(l.ve_contact_name, ''), nullif(l.founder_name, ''), o.contact_name),
  case when l.category in ('Food Brands', 'Brands') then 'brand' else 'business' end
from listings l
join ve_outreach_cities oc
  on (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states))
left join listing_outreach o on o.listing_id = l.id and nullif(o.email, '') is not null
where l.status = 'approved' and l.owner_member_id is null and l.claimed_by_member_id is null
  and coalesce(nullif(l.ve_contact_email, ''), nullif(l.email, ''), o.email) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and not exists (select 1 from email_suppressions x where x.active
    and lower(x.email) = lower(trim(coalesce(nullif(l.ve_contact_email, ''), nullif(l.email, ''), o.email))))
order by l.id, oc.community_slug
on conflict (listing_id) do nothing;
