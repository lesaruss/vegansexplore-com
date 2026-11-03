-- Abuse watch, freeze safety (Logan, 2026-11-03; playbook ve-abuse-watch, canon canon-ve-abuse-watch).
-- trg_ve_members_freeze_guard makes any lesars_balance change on a suspended or banned account raise account_frozen.
-- These callers did not expect it: one frozen member must never stop a cron run, fail a payment webhook or roll back an
-- admin approval. Nothing here changes who is frozen; it only makes the callers handle it.
-- Safe to run twice (create or replace; the one patch is guarded).

create or replace function public.ve_member_frozen(p_member uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select standing from members where id = p_member), 'good') in ('suspended', 'banned')
$$;

-- 1. ve_points_grant: a frozen member is not granted, and nothing raises.
create or replace function public.ve_points_grant(p_member uuid, p_amount integer, p_reason text, p_ref text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare bal integer; st text;
begin
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
  select lesars_balance, standing into bal, st from members where id = p_member for update;
  if not found then return jsonb_build_object('error', 'member_not_found'); end if;
  if coalesce(st, 'good') in ('suspended', 'banned') then
    return jsonb_build_object('granted', false, 'frozen', true, 'balance', coalesce(bal, 0));
  end if;
  if exists (select 1 from points_ledger where member_id = p_member and reason = p_reason and ref_id = p_ref) then
    return jsonb_build_object('granted', false, 'already', true, 'balance', coalesce(bal, 0));
  end if;
  update members set lesars_balance = coalesce(bal, 0) + p_amount where id = p_member;
  perform apply_member_points_delta(p_member, p_amount);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, p_amount, p_reason, p_ref);
  return jsonb_build_object('granted', true, 'balance', coalesce(bal, 0) + p_amount);
end $function$;

-- 2. ve_vault_settle: only members in good standing can win; each card settles in its own block.
create or replace function public.ve_vault_settle()
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c record; b record; cfg jsonb; won int := 0; extended int := 0; opened int; expired int; v_code text; mstart timestamptz;
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  select value into cfg from ve_site_settings where key = 'passport_challenge';
  update ve_vault_cards set status = 'available' where status = 'scheduled' and opens_at <= now();
  get diagnostics opened = row_count;
  update ve_vault_cards set status = 'expired' where status = 'won' and expires_at < now();
  get diagnostics expired = row_count;
  mstart := (date_trunc('month', now() at time zone 'America/New_York') at time zone 'America/New_York');
  for c in select * from ve_vault_cards where status = 'available' and auction_ends_at <= now() order by auction_ends_at for update skip locked loop
    begin
      select vb.member_id, vb.points into b from ve_vault_bids vb join members m on m.id = vb.member_id
      where vb.card_id = c.id and m.membership_status = 'active' and coalesce(m.standing, 'good') = 'good'
        and coalesce(m.lesars_balance, 0) >= vb.points
        and not exists (select 1 from ve_vault_cards w where w.winner_member_id = vb.member_id and w.won_at >= mstart)
      order by vb.points desc, vb.created_at limit 1;
      if b.member_id is null then
        update ve_vault_cards set auction_ends_at = now() + make_interval(days => coalesce((cfg->>'auction_days')::int, 7)) where id = c.id;
        extended := extended + 1;
        continue;
      end if;
      loop
        v_code := '';
        for i in 1..8 loop v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
        exit when not exists (select 1 from ve_vault_cards vc where vc.code = v_code);
      end loop;
      update members set lesars_balance = lesars_balance - b.points where id = b.member_id;
      perform apply_member_points_delta(b.member_id, -b.points);
      insert into points_ledger (member_id, delta, reason, ref_id) values (b.member_id, -b.points, 'redemption', 'vault:' || c.id);
      update ve_vault_cards set status = 'won', winner_member_id = b.member_id, winning_points = b.points, code = v_code, won_at = now(),
        expires_at = now() + make_interval(months => coalesce((cfg->>'card_months')::int, 12)) where id = c.id;
      won := won + 1;
    exception when others then
      -- The card's own changes roll back. A freeze that landed after the bid was picked just extends the card; anything
      -- else is logged and the card is left for the next run. Either way the rest of the run goes on.
      if sqlerrm = 'account_frozen' then
        update ve_vault_cards set auction_ends_at = now() + make_interval(days => coalesce((cfg->>'auction_days')::int, 7)) where id = c.id;
        extended := extended + 1;
      else
        raise warning 've_vault_settle card % skipped: %', c.id, sqlerrm;
      end if;
    end;
  end loop;
  return jsonb_build_object('opened', opened, 'won', won, 'extended', extended, 'expired', expired);
end $function$;

-- 3. ve_challenge_settle: a frozen member's challenge is held (not paid, not expired).
create or replace function public.ve_challenge_settle(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c ve_challenges; p jsonb; pts int; m members; admitted boolean := false; n_done int;
begin
  select * into c from ve_challenges where id = p_id for update;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if c.status <> 'active' then return jsonb_build_object('status', c.status); end if;
  if ve_member_frozen(c.member_id) then return jsonb_build_object('status', 'held'); end if;
  p := ve_challenge_progress(c.id);
  if not coalesce((p->>'met')::boolean, false) then
    if now() > c.ends_at then update ve_challenges set status = 'expired' where id = c.id; return jsonb_build_object('status', 'expired'); end if;
    return jsonb_build_object('status', 'active');
  end if;
  pts := coalesce((select (value->>'points')::int from ve_site_settings where key = 'challenges'), 1100);
  perform ve_points_grant(c.member_id, pts, 'challenge', 'challenge:' || c.id);
  select * into m from members where id = c.member_id for update;
  if m.membership_status is distinct from 'active' then
    -- The first challenge finished pays the Passport: its points are spent on it (lifetime points keep them).
    if not exists (select 1 from points_ledger where member_id = c.member_id and reason = 'challenge_passport') then
      update members set lesars_balance = coalesce(lesars_balance, 0) - pts where id = c.member_id;
      perform apply_member_points_delta(c.member_id, -pts);
      insert into points_ledger (member_id, delta, reason, ref_id) values (c.member_id, -pts, 'challenge_passport', 'passport:' || c.member_id);
    end if;
    admitted := ve_member_admit(c.member_id);
    update members set membership_tier = 'passport', ve_tier = 'passport' where id = c.member_id;
  end if;
  update ve_challenges set status = 'done', completed_at = now(), points_paid = pts, made_member = admitted or made_member where id = c.id;
  select count(*) into n_done from ve_challenges where member_id = c.member_id and status = 'done';
  if n_done >= 3 then update members set trailblazer_at = coalesce(trailblazer_at, now()) where id = c.member_id; end if;
  return jsonb_build_object('status', 'done', 'points', pts, 'admitted', admitted, 'trailblazer', n_done >= 3);
end $function$;

-- 3b. ve_challenge_sweep: each challenge in its own block; held and failed ones do not count and do not stop the rest.
create or replace function public.ve_challenge_sweep()
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare r record; n int := 0; s text;
begin
  for r in select id from ve_challenges where status = 'active' loop
    begin
      s := ve_challenge_settle(r.id)->>'status';
      if s not in ('active', 'held') then n := n + 1; end if;
    exception when others then
      raise warning 've_challenge_sweep challenge % skipped: %', r.id, sqlerrm;
    end;
  end loop;
  return n;
end $function$;

-- 4. Admin approvals: refuse before anything changes.
create or replace function public.ve_bounty_pay(p_submission uuid, p_reviewer uuid, p_points integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare s ve_bounty_submissions; b ve_bounties; paid int; amount int; w jsonb;
begin
  select * into s from ve_bounty_submissions where id = p_submission for update;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if ve_member_frozen(s.member_id) then return jsonb_build_object('error', 'account_frozen'); end if;
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

create or replace function public.ve_recipe_review(p_recipe uuid, p_op text, p_reviewer uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare r recipes; w jsonb; paid boolean := false;
begin
  select * into r from recipes where id = p_recipe for update;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if p_op = 'approve' then
    if r.status not in ('pending', 'rejected') then return jsonb_build_object('error', 'not_pending'); end if;
    if r.author_kind = 'member' and r.author_member_id is not null and ve_member_frozen(r.author_member_id) then
      return jsonb_build_object('error', 'account_frozen');
    end if;
    update recipes set status = 'live', live_at = coalesce(live_at, now()), reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    if r.author_kind = 'member' and r.author_member_id is not null
       and not exists (select 1 from points_ledger where ref_id = 'recipe:' || r.id) then
      insert into points_ledger (member_id, delta, reason, ref_id) values (r.author_member_id, 50, 'recipe_approved', 'recipe:' || r.id);
      update members set lesars_balance = coalesce(lesars_balance, 0) + 50 where id = r.author_member_id;
      select apply_member_points_delta(r.author_member_id, 50) into w;
      paid := true;
    end if;
    return jsonb_build_object('ok', true, 'status', 'live', 'points_paid', paid);
  elsif p_op = 'reject' then
    if r.status <> 'pending' then return jsonb_build_object('error', 'not_pending'); end if;
    update recipes set status = 'rejected', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'rejected');
  elsif p_op = 'restore' then
    if r.status not in ('retesting', 'retired') then return jsonb_build_object('error', 'not_retesting'); end if;
    update recipe_reports set status = 'cleared' where recipe_id = r.id and status = 'open';
    update recipes set status = 'live', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'live');
  elsif p_op = 'retire' then
    update recipes set status = 'retired', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'retired');
  end if;
  return jsonb_build_object('error', 'bad_op');
end $function$;

-- 5. ve_hunt_award: a frozen member is simply not awarded.
create or replace function public.ve_hunt_award(p_member uuid, p_points integer, p_ref text, p_reason text)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
begin
  if p_points <= 0 then return false; end if;
  if ve_member_frozen(p_member) then return false; end if;
  if exists (select 1 from points_ledger where member_id = p_member and reason = p_reason and ref_id = p_ref) then return false; end if;
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, p_points, p_reason, p_ref);
  update members set lesars_balance = coalesce(lesars_balance, 0) + p_points where id = p_member;
  perform apply_member_points_delta(p_member, p_points);
  return true;
end $function$;

-- 6. universe_join_from_purchase (a LESARUSS store order): a frozen buyer's order still goes through with 0 points.
-- Patched in place from the live definition so the long email markup is not retyped; guarded so a second run changes nothing.
do $patch$
declare def text; needle text := E'  if v_points > 0 then\n    update members set lesars_balance';
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'universe_join_from_purchase';
  if def like '%ve_member_frozen%' then return; end if;
  if position(needle in def) = 0 then raise exception 'universe_join_from_purchase changed: patch point not found'; end if;
  def := replace(def, needle, E'  if v_points > 0 and ve_member_frozen(v_prov.member_id) then v_points := 0; end if;\n' || needle);
  execute def;
end $patch$;
