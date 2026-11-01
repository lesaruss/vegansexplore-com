-- The Supermarket Guide (LOCKED by Sean 2026-11-01, canon canon-ve-supermarket-guide, playbook ve-supermarket-guide; "hand it to
-- Logan, build it"). It runs on the venue Guides' engine (ve-venues): a store is a ve_venues row of kind 'supermarket' tied to its
-- chain's one Directory listing (chain_listing_id), its departments are spots and the Vegan sections a shopper looks for are items,
-- each "Aisle not mapped yet" until a member maps it (photo, in-store location check, the team accepts, the first earns the bounty).

alter table public.ve_venues drop constraint if exists ve_venues_kind_check;
alter table public.ve_venues add constraint ve_venues_kind_check check (kind = any (array['stadium','arena','airport','supermarket']));
alter table public.ve_venues add column if not exists chain_listing_id uuid references public.listings(id);
create index if not exists ve_venues_chain_idx on public.ve_venues (chain_listing_id) where chain_listing_id is not null;

-- Sponsors. The Guide is free while at least one supermarket sponsorship is active (Sean: "We get a sponsor, the guide is free, as
-- long as the sponsorship is active"); ve_supermarket_guide_sync flips ve_guides.access_rule between 'free' and 'points', so every
-- path that already reads the rule (ve-guide-unlock, ve-venues) agrees. Tiers and prices are the canon's.
create table if not exists public.ve_supermarket_sponsors (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('title','partner','spotlight')),
  chain_listing_id uuid references public.listings(id),
  brand_listing_id uuid references public.listings(id),
  status text not null default 'pending' check (status in ('pending','active','ended')),
  quarterly_cents integer,
  front_row boolean not null default false,
  founding boolean not null default false,
  starts_on date,
  ends_on date,
  contact_name text,
  contact_email text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((tier = 'spotlight') = (brand_listing_id is not null) and (tier <> 'spotlight') = (chain_listing_id is not null))
);
alter table public.ve_supermarket_sponsors enable row level security;
create unique index if not exists ve_supermarket_one_title on public.ve_supermarket_sponsors ((tier)) where tier = 'title' and status = 'active';

create or replace function public.ve_supermarket_guide_sync() returns text
language plpgsql security definer set search_path = public as $$
declare v_rule text;
begin
  v_rule := case when exists (select 1 from ve_supermarket_sponsors where tier in ('title','partner') and status = 'active'
                                and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date))
            then 'free' else 'points' end;
  update ve_guides set access_rule = v_rule, updated_at = now() where slug = 'supermarket-guide' and access_rule is distinct from v_rule;
  return v_rule;
end $$;
create or replace function public.ve_supermarket_sponsors_changed() returns trigger
language plpgsql security definer set search_path = public as $$ begin perform ve_supermarket_guide_sync(); return null; end $$;
drop trigger if exists trg_ve_supermarket_sponsors on public.ve_supermarket_sponsors;
create trigger trg_ve_supermarket_sponsors after insert or update or delete on public.ve_supermarket_sponsors
  for each statement execute function public.ve_supermarket_sponsors_changed();

-- The store template: every supermarket gets the same departments and Vegan sections, so a shopper sees the same layout in every
-- store and members fill in where each section is in theirs. Idempotent per store.
create or replace function public.ve_supermarket_seed_store(p_venue uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare d record; v_sec text; v_spot uuid; n integer := 0; i integer;
begin
  if exists (select 1 from ve_venue_spots where venue_id = p_venue) then return 0; end if;
  for d in select * from (values
      (1, 'Refrigerated', array['Plant-based milk','Plant-based yogurt','Vegan cheese','Vegan butter and spreads','Tofu and tempeh','Fresh plant-based meat','Hummus and dips']),
      (2, 'Frozen', array['Frozen plant-based meat','Frozen Vegan meals','Non-dairy ice cream']),
      (3, 'Pantry', array['Beans and lentils','Plant-based protein powder','Nut butters']),
      (4, 'Snacks', array['Vegan snacks and chips','Vegan cookies and treats'])) as t(ord, dept, secs)
  loop
    insert into ve_venue_spots (venue_id, name, where_text, sort_order, status)
    values (p_venue, d.dept, 'Aisles not mapped yet', d.ord, 'live') returning id into v_spot;
    i := 0;
    foreach v_sec in array d.secs loop
      i := i + 1;
      insert into ve_venue_items (venue_id, spot_id, name, description, vegan, sort_order, status)
      values (p_venue, v_spot, v_sec, 'Aisle not mapped yet. Be the first to tell us where it is in this store.', 'vegan', i, 'live');
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;

insert into public.ve_guides (title, slug, description, cost_lesars, published, sort_order, access_rule)
select 'The Supermarket Guide', 'supermarket-guide',
  'Find the Vegan items in your supermarket, aisle by aisle, kept current by members. Free while a supermarket sponsors it.',
  1100, false, 9, 'points'
where not exists (select 1 from public.ve_guides where slug = 'supermarket-guide');

select public.ve_supermarket_guide_sync();
