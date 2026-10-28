-- Levels are the affiliate ladder (Sean, 2026-10-28: "I want the levels to be part of the affiliate structure. So level one, with
-- your link, you get points and allows you to level up quicker to level two, where you can start getting commissions... level two...
-- Somebody signs up to the passport, you now get a 20% commission off of that. And then when you go to level three, it goes up to 25%.
-- Then you go to level four... 30%, and we max out at 30%... certain people I might already bump up to level two... when they get level
-- three... the guides now become open... people who aren't motivated by money... route their commissions to a nonprofit of their
-- choosing... we would help facilitate that on the back end. So they get the credit for the donation.")
-- Defaults Logan set, Sean's to change (one row each in ve_affiliate_levels / ve_site_settings): Level 4 from 25,000 lifetime points;
-- a commission is a share of the $11 price (never of anything given on top), on the first Passport and each Guide bought with money by
-- someone who joined through the link, within 12 months of their joining; it waits 30 days (the refund window) before it is ready.

-- 1. The ladder: one row a level. min_lifetime sets the level from lifetime points; rate_pct and products are what the link pays.
create table if not exists public.ve_affiliate_levels (
  level smallint primary key check (level between 1 and 9),
  min_lifetime integer not null,
  rate_pct numeric(5,2) not null default 0 check (rate_pct between 0 and 30),
  products text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.ve_affiliate_levels enable row level security;
drop policy if exists ve_affiliate_levels_read on public.ve_affiliate_levels;
create policy ve_affiliate_levels_read on public.ve_affiliate_levels for select using (true);
insert into public.ve_affiliate_levels (level, min_lifetime, rate_pct, products) values
  (1, 0, 0, '{}'),
  (2, 2500, 20, '{passport}'),
  (3, 10000, 25, '{passport,guide}'),
  (4, 25000, 30, '{passport,guide}')
on conflict (level) do nothing;

-- The program shows to members once Sean launches it; commissions are recorded from today either way, so nobody's are lost.
insert into public.ve_site_settings (key, value, updated_at)
values ('affiliate_program', jsonb_build_object('live', false, 'window_days', 365, 'hold_days', 30, 'sale_cents', 1100, 'min_payout_cents', 2500), now())
on conflict (key) do nothing;

-- 2. Levels 1 to 4. A level the team sets (members.level_override) is still the least they have.
alter table public.members drop constraint if exists members_level_override_check;
alter table public.members add constraint members_level_override_check check (level_override is null or level_override between 1 and 4);
alter table public.universe_invites drop constraint if exists universe_invites_level_check;
alter table public.universe_invites add constraint universe_invites_level_check check (level is null or level between 1 and 4);

create or replace function public.ve_member_level(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with p as (select coalesce((select total_points from member_points where member_id = p_member order by updated_at desc nulls last limit 1), 0) as lifetime,
                    coalesce((select level_override from members where id = p_member), 1) as floor_level),
  e as (select lifetime, floor_level,
          coalesce((select max(level) from ve_affiliate_levels where min_lifetime <= p.lifetime), 1) as earned from p),
  l as (select lifetime, floor_level, earned, greatest(earned, floor_level)::int as level from e)
  select jsonb_build_object(
    'lifetime', lifetime,
    'level', level,
    'earned_level', earned,
    'set_by_team', floor_level > earned,
    'next_at', (select min(min_lifetime) from ve_affiliate_levels where level > l.level),
    'rate_pct', (select rate_pct from ve_affiliate_levels where ve_affiliate_levels.level = l.level),
    'products', (select to_jsonb(products) from ve_affiliate_levels where ve_affiliate_levels.level = l.level))
  from l;
$$;

-- 3. Where a member's commissions go: to them, or to a nonprofit, rescue or sanctuary in the Directory, given in their name.
alter table public.members add column if not exists affiliate_route text not null default 'self';
alter table public.members add column if not exists affiliate_listing_id uuid references public.listings(id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'members_affiliate_route_check') then
    alter table public.members add constraint members_affiliate_route_check check (affiliate_route in ('self', 'nonprofit'));
  end if;
end $$;

-- 4. The commissions: one row a sale, never deleted. pending (in the 30-day hold) -> ready -> paid or given; reversed on a refund.
create table if not exists public.ve_affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.members(id),
  buyer_id uuid not null references public.members(id),
  product text not null check (product in ('passport', 'guide')),
  product_ref text,
  ref text not null unique,
  sale_cents integer not null,
  level smallint not null,
  rate_pct numeric(5,2) not null,
  commission_cents integer not null,
  route text not null default 'self' check (route in ('self', 'nonprofit')),
  route_listing_id uuid references public.listings(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'ready', 'paid', 'given', 'reversed')),
  hold_until timestamptz not null,
  payout_id uuid,
  settled_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table public.ve_affiliate_commissions enable row level security;
create index if not exists ve_affiliate_commissions_aff_idx on public.ve_affiliate_commissions (affiliate_id, created_at desc);

-- A purchase that may pay a commission. Safe to call twice (ref is unique). Returns what happened, for the logs.
create or replace function public.ve_affiliate_earn(p_buyer uuid, p_product text, p_product_ref text, p_ref text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b members; a members; lv jsonb; cfg jsonb; rate numeric; sale int; cents int; id uuid;
begin
  select value into cfg from ve_site_settings where key = 'affiliate_program';
  select * into b from members where id = p_buyer;
  if b.id is null or b.referred_by is null then return jsonb_build_object('skipped', 'not_referred'); end if;
  if b.referred_by = b.id then return jsonb_build_object('skipped', 'self'); end if;
  if b.created_at < now() - make_interval(days => coalesce((cfg->>'window_days')::int, 365)) then return jsonb_build_object('skipped', 'window'); end if;
  select * into a from members where id = b.referred_by;
  if a.id is null or a.membership_status is distinct from 'active' or coalesce(a.member_class, '') = 'agent' or a.merged_into_member_id is not null then
    return jsonb_build_object('skipped', 'affiliate_not_active');
  end if;
  lv := ve_member_level(a.id);
  if not coalesce((lv->'products') ? p_product, false) then return jsonb_build_object('skipped', 'level', 'level', lv->'level'); end if;
  rate := (lv->>'rate_pct')::numeric;
  sale := coalesce((cfg->>'sale_cents')::int, 1100);
  cents := round(sale * rate / 100);
  insert into ve_affiliate_commissions (affiliate_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
    route, route_listing_id, hold_until)
  values (a.id, b.id, p_product, p_product_ref, p_ref, sale, (lv->>'level')::smallint, rate, cents,
    a.affiliate_route, case when a.affiliate_route = 'nonprofit' then a.affiliate_listing_id end,
    now() + make_interval(days => coalesce((cfg->>'hold_days')::int, 30)))
  on conflict (ref) do nothing returning ve_affiliate_commissions.id into id;
  return jsonb_build_object('earned', id is not null, 'commission_cents', cents, 'affiliate', a.id);
end $$;
revoke all on function public.ve_affiliate_earn(uuid, text, text, text) from public, anon, authenticated;

-- After the hold a commission is ready (paid to them, or given in their name). Daily.
create or replace function public.ve_affiliate_release()
returns integer language sql security definer set search_path to 'public' as $$
  with u as (update ve_affiliate_commissions set status = 'ready' where status = 'pending' and hold_until <= now() returning 1)
  select count(*)::int from u;
$$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 've-affiliate-release') then perform cron.unschedule('ve-affiliate-release'); end if;
  perform cron.schedule('ve-affiliate-release', '23 9 * * *', 'select public.ve_affiliate_release()');
end $$;

-- 5. A Guide bought with money pays the link's commission (Level 3 and up); the Passport's is paid from ve-stripe-webhook.
create or replace function public.ve_guide_purchase_paid(p_member uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare g ve_guides; admitted boolean;
begin
  select * into g from ve_guides where slug = p_slug;
  if g.id is null then return jsonb_build_object('error', 'guide_not_found'); end if;
  insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with) values (p_member, g.id, 0, 'cash')
  on conflict (member_id, guide_id) do nothing;
  admitted := ve_member_admit(p_member);
  perform ve_purchase_thanks(p_member, 'guide:' || g.id);
  perform ve_affiliate_earn(p_member, 'guide', g.slug, 'guide:' || p_member || ':' || g.id);
  return jsonb_build_object('unlocked', true, 'admitted', admitted);
end $$;

-- 6. One member's earnings, for their Points and levels page (read by ve-affiliate with the member's token).
create or replace function public.ve_affiliate_me(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'level', ve_member_level(p_member),
    'ladder', (select jsonb_agg(row_to_json(l) order by l.level) from (select level, min_lifetime, rate_pct, products from ve_affiliate_levels) l),
    'program', (select value from ve_site_settings where key = 'affiliate_program'),
    'referral_code', m.referral_code,
    'route', m.affiliate_route,
    'route_listing', (select jsonb_build_object('id', x.id, 'name', x.name, 'slug', x.slug, 'category', x.category) from listings x where x.id = m.affiliate_listing_id),
    'totals', (select jsonb_build_object(
        'pending', coalesce(sum(commission_cents) filter (where status = 'pending'), 0),
        'ready', coalesce(sum(commission_cents) filter (where status = 'ready'), 0),
        'paid', coalesce(sum(commission_cents) filter (where status = 'paid'), 0),
        'given', coalesce(sum(commission_cents) filter (where status = 'given'), 0))
      from ve_affiliate_commissions where affiliate_id = p_member),
    'commissions', (select coalesce(jsonb_agg(jsonb_build_object('product', c.product, 'product_ref', c.product_ref, 'sale_cents', c.sale_cents,
        'rate_pct', c.rate_pct, 'commission_cents', c.commission_cents, 'status', c.status, 'route', c.route, 'hold_until', c.hold_until,
        'created_at', c.created_at, 'buyer', trim(split_part(coalesce(bm.name, ''), ' ', 1) || ' ' || left(split_part(coalesce(bm.name, ''), ' ', 2), 1)))
        order by c.created_at desc), '[]'::jsonb)
      from (select * from ve_affiliate_commissions where affiliate_id = p_member order by created_at desc limit 200) c
      left join members bm on bm.id = c.buyer_id),
    'joined', (select count(*) from members r where r.referred_by = p_member),
    'joined_members', (select count(*) from members r where r.referred_by = p_member and r.membership_status = 'active'),
    'referral_points', (select coalesce(sum(delta), 0) from points_ledger l where l.member_id = p_member and l.reason ilike 'referral%'))
  from members m where m.id = p_member;
$$;
revoke all on function public.ve_affiliate_me(uuid) from public, anon, authenticated;

-- 7. The Ambassadors page shows what each one has earned.
create or replace function public.ve_ambassadors_overview()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(row_to_json(a) order by a.signups desc, a.name), '[]'::jsonb) from (
    select m.id, m.name, m.email, m.avatar_url, m.home_community, m.membership_status, m.created_at, m.last_activity_at,
      m.referral_code, m.level_override, m.affiliate_route,
      (ve_member_level(m.id) ->> 'level')::int as level,
      coalesce(mp.available_points, 0) as points, coalesce(mp.total_points, 0) as lifetime,
      (select count(*) from ve_referral_visits v where v.code = m.referral_code) as visits,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code) as visitors,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code and v.day > current_date - 30) as visitors_30d,
      (select count(*) from members r where r.referred_by = m.id) as signups,
      (select count(*) from members r where r.referred_by = m.id and r.membership_status = 'active') as members,
      (select coalesce(sum(delta), 0) from points_ledger l where l.member_id = m.id and l.reason ilike 'referral%') as referral_points,
      (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions c where c.affiliate_id = m.id and c.status <> 'reversed') as earned_cents,
      (select jsonb_build_object('id', i.id, 'status', i.status, 'joined_at', i.joined_at, 'level', i.level, 'points', i.points)
         from universe_invites i where i.claimed_member_id = m.id and i.points_to = 'ambassador' order by i.joined_at desc nulls last limit 1) as invite
    from members m left join member_points mp on mp.member_id = m.id
    where m.ve_role = 'ambassador' and m.merged_into_member_id is null
  ) a;
$$;
revoke all on function public.ve_ambassadors_overview() from public, anon, authenticated;
