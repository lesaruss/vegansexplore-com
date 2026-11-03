-- The Founding commission branch (Sean, 2026-11-03: Founding Members "can earn up to 50%. They still have to go up the level... anyone after the
-- founding member period can only earn a maximum of 30%... that 30% number turns, there would be another branch after that... equate it to the
-- levels based off the sequencing we have"). Canon canon-ve-people-campaigns-doors v3.
-- Levels 5 to 8 sit above Level 4 (30%) and count only for a Founding Member (members.founding_member). Rates follow the Group Partner ladder's
-- 5-point steps; thresholds are Logan's defaults, Sean's to change: one row each in ve_affiliate_levels. Nobody is near them (Level 4 is 25,000).
alter table public.ve_affiliate_levels add column if not exists founding_only boolean not null default false;
alter table public.ve_affiliate_levels drop constraint if exists ve_affiliate_levels_rate_pct_check;
alter table public.ve_affiliate_levels add constraint ve_affiliate_levels_rate_pct_check check (rate_pct >= 0 and rate_pct <= 50);

insert into public.ve_affiliate_levels (level, min_lifetime, rate_pct, products, founding_only) values
  (5,  50000, 35, array['passport', 'guide'], true),
  (6, 100000, 40, array['passport', 'guide'], true),
  (7, 200000, 45, array['passport', 'guide'], true),
  (8, 400000, 50, array['passport', 'guide'], true)
on conflict (level) do nothing;

-- A level counts for a member only if it is not Founding-only, or they are a Founding Member. Level 4 stays the most for everyone else.
create or replace function public.ve_member_level(p_member uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with p as (select coalesce((select total_points from member_points where member_id = p_member order by updated_at desc nulls last limit 1), 0) as lifetime,
                    coalesce((select level_override from members where id = p_member), 1) as floor_level,
                    coalesce((select founding_member from members where id = p_member), false) as founding),
  v as (select * from ve_affiliate_levels where not founding_only or (select founding from p)),
  e as (select lifetime, floor_level, founding,
          coalesce((select max(level) from v where min_lifetime <= p.lifetime), 1) as earned from p),
  l as (select lifetime, floor_level, founding, earned, greatest(earned, floor_level)::int as level from e)
  select jsonb_build_object(
    'lifetime', lifetime,
    'level', level,
    'earned_level', earned,
    'founding', founding,
    'set_by_team', floor_level > earned,
    'next_at', (select min(min_lifetime) from v where v.level > l.level),
    'rate_pct', (select rate_pct from ve_affiliate_levels where ve_affiliate_levels.level = l.level),
    'products', (select to_jsonb(products) from ve_affiliate_levels where ve_affiliate_levels.level = l.level))
  from l;
$function$;

-- The ladder a member sees: Levels 1 to 4 for everyone, and the Founding branch (5 to 8) for a Founding Member.
create or replace function public.ve_affiliate_me(p_member uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
    'level', ve_member_level(p_member),
    'ladder', (select jsonb_agg(row_to_json(l) order by l.level) from (select level, min_lifetime, rate_pct, products, founding_only from ve_affiliate_levels
                where not founding_only or coalesce(m.founding_member, false)) l),
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
$function$;
