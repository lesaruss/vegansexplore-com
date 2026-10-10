-- Guide credits (Sean, 2026-10-10, canon-ve-guide-pricing v3: "Lock it in with those defaults", "Logan, go ahead and build it").
-- Every paid Guide is $11 or 1 Guide credit; a Guide never shows a points price. Credits:
--   * the Founding Membership comes with 1 (granted the moment a member becomes active, unless they already own a Guide,
--     which was their first Guide; a Passport signup is not a Founding Membership and gets its monthly credit instead);
--   * Passport gives 1 each calendar month (monthly and annual alike), granted by a daily job and when the member opens
--     a Guide, once per month (ref passport:<YYYY-MM>);
--   * about 2,500 points become 1 credit (ve_credit_from_points), so a member who contributes a lot can earn a Guide.
-- Credits roll over up to 3; a grant at the cap is recorded with delta 0 (reason capped) and is gone.
-- Points are for talking to the Guides: Guide chat's 4-point charge (guide_chat_spend) is allowed from now on and the unpaid
-- monthly chat allowance is retired.

alter table public.members add column if not exists guide_credits integer not null default 0;
alter table public.members drop constraint if exists members_guide_credits_check;
alter table public.members add constraint members_guide_credits_check check (guide_credits >= 0);

create table if not exists public.guide_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('founding', 'passport_month', 'points_exchange', 'guide_unlock', 'admin_adjust', 'capped')),
  ref_id text not null,
  balance_after integer not null,
  created_at timestamptz not null default now(),
  unique (member_id, ref_id)
);
alter table public.guide_credit_ledger enable row level security;

alter table public.ve_guide_purchases add column if not exists paid_with text;

alter table public.ve_guides drop constraint if exists ve_guides_access_rule_check;
alter table public.ve_guides add constraint ve_guides_access_rule_check check (access_rule in ('credit', 'points', 'membership', 'free'));

-- Points reasons: Guide chat's charge (never allowed until now, so chat was free) and the points-to-credit exchange.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote','event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received','vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase','bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem','ve_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved','guide_chat_spend','credit_exchange']::text[])) not valid;

-- No separate chat allowance: talking to a Guide spends points.
update public.points_earn_rules set active = false, notes = coalesce(notes, '') || ' Retired 2026-10-10 (canon-ve-guide-pricing v3): Guide chat spends points, no allowance.'
where action_type in ('guide_chat_monthly_free', 'guide_chat_monthly_passport') and active;

create or replace function public.ve_credit_grant(p_member uuid, p_reason text, p_ref text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  select guide_credits into bal from members where id = p_member for update;
  if bal is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if exists (select 1 from guide_credit_ledger where member_id = p_member and ref_id = p_ref) then
    return jsonb_build_object('granted', false, 'already', true, 'credits', bal);
  end if;
  if bal >= 3 then
    insert into guide_credit_ledger (member_id, delta, reason, ref_id, balance_after) values (p_member, 0, 'capped', p_ref, bal);
    return jsonb_build_object('granted', false, 'capped', true, 'credits', bal);
  end if;
  update members set guide_credits = bal + 1 where id = p_member;
  insert into guide_credit_ledger (member_id, delta, reason, ref_id, balance_after) values (p_member, 1, p_reason, p_ref, bal + 1);
  return jsonb_build_object('granted', true, 'credits', bal + 1);
end $$;

create or replace function public.ve_credit_unlock(p_member uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g ve_guides; bal integer;
begin
  select * into g from ve_guides where slug = p_slug and published;
  if g.id is null then return jsonb_build_object('error', 'guide_not_found'); end if;
  if g.access_rule <> 'credit' then return jsonb_build_object('error', 'not_a_credit_guide'); end if;
  select guide_credits into bal from members where id = p_member for update;
  if bal is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if exists (select 1 from ve_guide_purchases where member_id = p_member and guide_id = g.id) then
    return jsonb_build_object('unlocked', true, 'already', true, 'credits', bal);
  end if;
  if bal < 1 then return jsonb_build_object('error', 'no_credit', 'credits', bal); end if;
  update members set guide_credits = bal - 1 where id = p_member;
  insert into guide_credit_ledger (member_id, delta, reason, ref_id, balance_after) values (p_member, -1, 'guide_unlock', 'guide:' || g.id, bal - 1);
  insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with) values (p_member, g.id, 0, 'credit');
  return jsonb_build_object('unlocked', true, 'credits', bal - 1);
end $$;

-- About 2,500 points become 1 credit (Sean's locked default). Moves both point balances, like every points function.
create or replace function public.ve_credit_from_points(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rate constant integer := 2500; m members; ref text := 'credit_exchange:' || gen_random_uuid();
begin
  select * into m from members where id = p_member for update;
  if m.id is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if m.guide_credits >= 3 then return jsonb_build_object('error', 'credit_cap', 'credits', m.guide_credits); end if;
  if coalesce(m.lesars_balance, 0) < rate then
    return jsonb_build_object('error', 'insufficient_points', 'balance', coalesce(m.lesars_balance, 0), 'rate', rate);
  end if;
  update members set lesars_balance = lesars_balance - rate, guide_credits = guide_credits + 1 where id = p_member;
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -rate, 'credit_exchange', ref);
  perform apply_member_points_delta(p_member, -rate);
  insert into guide_credit_ledger (member_id, delta, reason, ref_id, balance_after) values (p_member, 1, 'points_exchange', ref, m.guide_credits + 1);
  return jsonb_build_object('ok', true, 'credits', m.guide_credits + 1, 'balance', m.lesars_balance - rate);
end $$;

-- A Guide bought for $11 (ve-guide-unlock checkout, confirmed by its own ?confirm= or the Stripe webhook's self-confirm).
create or replace function public.ve_guide_purchase_paid(p_member uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g ve_guides;
begin
  select * into g from ve_guides where slug = p_slug;
  if g.id is null then return jsonb_build_object('error', 'guide_not_found'); end if;
  insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with) values (p_member, g.id, 0, 'cash')
  on conflict (member_id, guide_id) do nothing;
  return jsonb_build_object('unlocked', true);
end $$;

-- Passport: 1 credit each calendar month (Eastern), monthly and annual alike.
create or replace function public.ve_passport_credit(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from members where id = p_member and membership_status = 'active' and membership_tier = 'passport') then
    return jsonb_build_object('granted', false, 'passport', false);
  end if;
  return ve_credit_grant(p_member, 'passport_month', 'passport:' || to_char(now() at time zone 'America/New_York', 'YYYY-MM'));
end $$;

create or replace function public.ve_passport_credits_monthly()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select id from members where membership_status = 'active' and membership_tier = 'passport' loop
    if (ve_passport_credit(r.id) ->> 'granted')::boolean then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- The Founding Membership's credit, the moment a member becomes active. Not for a member who already owns a Guide (that
-- was their first Guide) and not for a Passport signup (Passport's monthly credit covers it).
create or replace function public.ve_founding_credit_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.membership_status = 'active'
     and (tg_op = 'INSERT' or old.membership_status is distinct from 'active')
     and new.membership_tier is distinct from 'passport'
     and not exists (select 1 from ve_guide_purchases where member_id = new.id) then
    perform ve_credit_grant(new.id, 'founding', 'founding');
  end if;
  return null;
end $$;
create or replace trigger trg_ve_founding_credit
  after insert or update of membership_status on public.members
  for each row execute function public.ve_founding_credit_trg();

revoke all on function public.ve_credit_grant(uuid, text, text), public.ve_credit_unlock(uuid, text), public.ve_credit_from_points(uuid),
  public.ve_guide_purchase_paid(uuid, text), public.ve_passport_credit(uuid), public.ve_passport_credits_monthly() from public, anon, authenticated;

-- Members already active who own no Guide get their Founding credit now; Passport members get this month's.
select ve_credit_grant(m.id, 'founding', 'founding') from members m
where m.membership_status = 'active' and m.membership_tier is distinct from 'passport'
  and not exists (select 1 from ve_guide_purchases p where p.member_id = m.id);
select ve_passport_credits_monthly();

-- Daily, so a new month's credit lands without the member opening a Guide.
select cron.schedule('ve-passport-credits', '7 9 * * *', $c$select public.ve_passport_credits_monthly()$c$);
