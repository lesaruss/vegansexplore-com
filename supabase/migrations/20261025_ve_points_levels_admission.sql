-- Pricing, points and levels (Sean locked 2026-10-25, playbook ve-pricing-points-passport; replaces the credits model of
-- 20261010_ve_guide_credits.sql and 20261025_ve_credit_purchase.sql, canon-ve-guide-pricing v4).
--
--   $11 is the price of admission: any purchase of $11 or more (the Passport, a Guide, a tour ticket) makes the buyer a
--   member (ve_member_admit). Guides are $11 or 1,100 points. The Passport comes with 1,100 welcome points; every other way
--   in gets the membership and the purchase, no welcome points. Every purchase earns a flat 25-point thank-you
--   (ve_purchase_thanks). Points are only given, never bought.
--   Levels run on lifetime points, member_points.total_points, which apply_member_points_delta only ever raises; spending or
--   contributing lowers the spendable balances (members.lesars_balance and member_points.available_points), never the level.
--   Level 1 from 0, Level 2 from 2,500, Level 3 from 10,000 (the playbook's default until Sean sets them).
--   Members contribute spendable points to a listing (a business or nonprofit) as a visible boost, never money.
-- No existing rows change here; the Guides' price rows move in 20261025_ve_guides_points_rule.sql.

alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array[
  'signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote',
  'event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received',
  'vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase',
  'bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem',
  've_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved',
  'guide_chat_spend','credit_exchange','checkin',
  'welcome','purchase_thanks','points_contribution'])) not valid;

-- Give points once per (member, reason, ref). Moves both point balances, like every points function
-- (20261010_points_both_balances.sql), and so raises lifetime points.
create or replace function public.ve_points_grant(p_member uuid, p_amount integer, p_reason text, p_ref text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
  select lesars_balance into bal from members where id = p_member for update;
  if not found then return jsonb_build_object('error', 'member_not_found'); end if;
  if exists (select 1 from points_ledger where member_id = p_member and reason = p_reason and ref_id = p_ref) then
    return jsonb_build_object('granted', false, 'already', true, 'balance', coalesce(bal, 0));
  end if;
  update members set lesars_balance = coalesce(bal, 0) + p_amount where id = p_member;
  perform apply_member_points_delta(p_member, p_amount);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, p_amount, p_reason, p_ref);
  return jsonb_build_object('granted', true, 'balance', coalesce(bal, 0) + p_amount);
end $$;

-- The flat thank-you on every purchase (Sean: "hey, you get 10 points, you make a purchase, thank you for your support";
-- the playbook set 25). Once per purchase reference.
create or replace function public.ve_purchase_thanks(p_member uuid, p_ref text)
returns jsonb language sql security definer set search_path = public as $$
  select ve_points_grant(p_member, 25, 'purchase_thanks', p_ref);
$$;

-- $11 is the price of admission: a qualifying purchase makes a non-member a member. Welcome points are the Passport's
-- alone (ve-stripe-webhook), so this gives none. Returns whether they were admitted just now.
create or replace function public.ve_member_admit(p_member uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), updated_at = now()
  where id = p_member and membership_status is distinct from 'active';
  return found;
end $$;

-- A Guide bought for $11 (ve-guide-unlock checkout): the Guide, the membership if they were not a member yet, and the thank-you.
create or replace function public.ve_guide_purchase_paid(p_member uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g ve_guides; admitted boolean;
begin
  select * into g from ve_guides where slug = p_slug;
  if g.id is null then return jsonb_build_object('error', 'guide_not_found'); end if;
  insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with) values (p_member, g.id, 0, 'cash')
  on conflict (member_id, guide_id) do nothing;
  admitted := ve_member_admit(p_member);
  perform ve_purchase_thanks(p_member, 'guide:' || g.id);
  return jsonb_build_object('unlocked', true, 'admitted', admitted);
end $$;

-- A member's level, from lifetime points.
create or replace function public.ve_member_level(p_member uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with p as (select coalesce((select total_points from member_points where member_id = p_member order by updated_at desc nulls last limit 1), 0) as lifetime)
  select jsonb_build_object(
    'lifetime', lifetime,
    'level', case when lifetime >= 10000 then 3 when lifetime >= 2500 then 2 else 1 end,
    'next_at', case when lifetime >= 10000 then null when lifetime >= 2500 then 10000 else 2500 end)
  from p;
$$;

-- Points members contribute to a business or nonprofit on its listing.
create table if not exists public.ve_listing_point_contributions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  points integer not null check (points > 0),
  created_at timestamptz not null default now()
);
create index if not exists ve_listing_point_contributions_listing_idx on public.ve_listing_point_contributions (listing_id);
alter table public.ve_listing_point_contributions enable row level security;

-- Spend spendable points on a listing: both spendable balances go down, lifetime points (and so the level) do not.
create or replace function public.ve_listing_contribute(p_member uuid, p_listing uuid, p_points integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m members; total integer;
begin
  if p_points is null or p_points < 1 or p_points > 10000 then return jsonb_build_object('error', 'bad_amount'); end if;
  select * into m from members where id = p_member for update;
  if m.id is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if m.membership_status is distinct from 'active' then return jsonb_build_object('error', 'payment_required'); end if;
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return jsonb_build_object('error', 'listing_not_found'); end if;
  if coalesce(m.lesars_balance, 0) < p_points then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0)); end if;
  update members set lesars_balance = lesars_balance - p_points where id = p_member;
  perform apply_member_points_delta(p_member, -p_points);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -p_points, 'points_contribution', 'listing:' || p_listing);
  insert into ve_listing_point_contributions (listing_id, member_id, points) values (p_listing, p_member, p_points);
  select coalesce(sum(points), 0) into total from ve_listing_point_contributions where listing_id = p_listing;
  return jsonb_build_object('ok', true, 'balance', m.lesars_balance - p_points, 'listing_total', total);
end $$;

-- What a listing shows: the community's points on it and how many members gave them. Public.
create or replace function public.ve_listing_points(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('points', coalesce(sum(points), 0), 'members', count(distinct member_id))
  from ve_listing_point_contributions where listing_id = p_listing;
$$;

-- Credits are retired: joining no longer grants one. (No member held a credit on 2026-10-25.)
drop trigger if exists trg_ve_founding_credit on public.members;

revoke all on function public.ve_points_grant(uuid, integer, text, text), public.ve_purchase_thanks(uuid, text),
  public.ve_member_admit(uuid), public.ve_guide_purchase_paid(uuid, text), public.ve_member_level(uuid),
  public.ve_listing_contribute(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.ve_listing_points(uuid) to anon, authenticated;
