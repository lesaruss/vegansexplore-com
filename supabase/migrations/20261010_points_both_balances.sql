-- Points move both balances (Sean, 2026-10-10: "go ahead and fix the points gap").
-- A member's points live in two places: members.lesars_balance (what a Guide unlock, a reward or a campaign spends) and
-- member_points.available_points (the wallet shown on the dashboard, moved by apply_member_points_delta). Nine functions
-- already move both. These four moved only member_points, so points earned through an earn rule (profile complete,
-- referrals), a bounty or the hunt could not be spent on a Guide, and a Guide chat spend never left lesars_balance.
-- Each now moves lesars_balance by the same amount, the way spend_points_for_guide does. Then the two members it had
-- already caught (100 profile_complete points each, 2026-08) get their lesars_balance set to match.

create or replace function public.award_points_bounty(p_member_id uuid, p_brand text, p_action_type text, p_ref_id text default null::text, p_reason text default 'referral'::text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_rule points_earn_rules;
  v_wallet jsonb;
begin
  select * into v_rule
  from points_earn_rules
  where brand = p_brand and action_type = p_action_type and active = true;

  if v_rule is null then
    return jsonb_build_object('error', 'no_active_rule', 'brand', p_brand, 'action_type', p_action_type);
  end if;

  -- idempotency: for non-repeatable actions, or whenever a ref_id is supplied,
  -- refuse to double-award the same (member, action_type, ref_id) combination.
  if p_ref_id is not null and exists (
    select 1 from points_ledger
    where member_id = p_member_id and reason = p_reason and ref_id = p_ref_id
  ) then
    return jsonb_build_object('awarded', false, 'already', true);
  end if;

  if v_rule.repeatable = false and p_ref_id is null and exists (
    select 1 from points_ledger
    where member_id = p_member_id and reason = p_reason
      and ref_id like (p_action_type || ':%')
  ) then
    return jsonb_build_object('awarded', false, 'already', true);
  end if;

  insert into points_ledger (member_id, delta, reason, ref_id)
  values (p_member_id, v_rule.points_awarded, p_reason, coalesce(p_ref_id, p_action_type || ':' || p_member_id::text));

  update members set lesars_balance = coalesce(lesars_balance, 0) + v_rule.points_awarded where id = p_member_id;
  select apply_member_points_delta(p_member_id, v_rule.points_awarded) into v_wallet;

  return jsonb_build_object('awarded', true, 'points', v_rule.points_awarded, 'wallet', v_wallet);
end;
$function$;

create or replace function public.spend_points_for_chat(p_member_id uuid, p_cost integer, p_agent_slug text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_available integer;
  v_wallet jsonb;
begin
  select available_points into v_available
  from member_points
  where member_id = p_member_id
  for update;

  if v_available is null then
    return jsonb_build_object('error', 'member_not_found');
  end if;

  if v_available < p_cost then
    return jsonb_build_object('error', 'insufficient_points', 'balance', v_available, 'cost', p_cost);
  end if;

  insert into points_ledger (member_id, delta, reason, ref_id)
  values (p_member_id, -p_cost, 'guide_chat_spend', p_agent_slug);

  update members set lesars_balance = coalesce(lesars_balance, 0) - p_cost where id = p_member_id;
  select apply_member_points_delta(p_member_id, -p_cost) into v_wallet;

  return jsonb_build_object('ok', true, 'balance', (v_wallet->>'available_points')::integer, 'cost', p_cost);
end;
$function$;

create or replace function public.ve_bounty_pay(p_submission uuid, p_reviewer uuid, p_points integer default null::integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare s ve_bounty_submissions; b ve_bounties; paid int; amount int; w jsonb;
begin
  select * into s from ve_bounty_submissions where id = p_submission for update;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select * into b from ve_bounties where id = s.bounty_id;
  if exists (select 1 from points_ledger where ref_id = 'bounty:' || s.id) then
    return jsonb_build_object('awarded', false, 'already', true);
  end if;
  amount := coalesce(p_points, b.points);
  if amount < 1 or amount > b.points then return jsonb_build_object('error', 'bad_points'); end if;
  if b.max_awards is not null then
    select count(*) into paid from ve_bounty_submissions where bounty_id = b.id and status = 'approved' and id <> s.id;
    if paid >= b.max_awards then return jsonb_build_object('error', 'cap_reached'); end if;
  end if;
  insert into points_ledger (member_id, delta, reason, ref_id) values (s.member_id, amount, 'bounty', 'bounty:' || s.id);
  update members set lesars_balance = coalesce(lesars_balance, 0) + amount where id = s.member_id;
  select apply_member_points_delta(s.member_id, amount) into w;
  update ve_bounty_submissions set status = 'approved', points_awarded = amount, reviewed_by = p_reviewer, reviewed_at = now(), updated_at = now() where id = s.id;
  return jsonb_build_object('awarded', true, 'points', amount, 'wallet', w);
end $function$;

create or replace function public.ve_hunt_award(p_member uuid, p_points integer, p_ref text, p_reason text)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
BEGIN
  IF p_points <= 0 THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM points_ledger WHERE member_id = p_member AND reason = p_reason AND ref_id = p_ref) THEN RETURN false; END IF;
  INSERT INTO points_ledger (member_id, delta, reason, ref_id) VALUES (p_member, p_points, p_reason, p_ref);
  UPDATE members SET lesars_balance = coalesce(lesars_balance, 0) + p_points WHERE id = p_member;
  PERFORM apply_member_points_delta(p_member, p_points);
  RETURN true;
END $function$;

-- The two members already caught: their lesars_balance never got the 100 profile_complete points (member_points and the
-- ledger both have them). Set it from member_points only where lesars_balance is behind it.
update public.members m set lesars_balance = mp.available_points
from public.member_points mp
where mp.member_id = m.id and coalesce(m.lesars_balance, 0) < mp.available_points;
