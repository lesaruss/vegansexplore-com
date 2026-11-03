-- Abuse watch (Sean, 2026-11-03): detect gaming of points, watch quietly, a human judge decides.
-- Playbook ve-pathways / canon ve-people-campaigns-doors. Log-only for the first week (ve_site_settings abuse_watch).
-- Sean is the judge: suspend freezes points and participation (reversible); ban is permanent but can be undone;
-- voiding points is a ledger reversal that can be restored. The system never changes an account on its own.

-- 1. Account standing on members.
alter table public.members add column if not exists standing text not null default 'good';
alter table public.members add column if not exists standing_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'members_standing_check') then
    alter table public.members add constraint members_standing_check check (standing in ('good','suspended','banned'));
  end if;
end $$;

-- 2. Ledger reasons for a void and its restore (the list is the existing one plus two).
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array[
  'signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote',
  'event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received',
  'vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase',
  'bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem',
  've_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved',
  'guide_chat_spend','credit_exchange','checkin','welcome','purchase_thanks','points_contribution','listing_submit',
  'profile_answer','partner_optin','venue_report','nonprofit_survey','barcode_add','challenge','challenge_passport',
  'host_story','abuse_void','abuse_restore']) ) not valid;

-- 3. Cases, signals, events. RLS on, no policies: everything goes through the functions below.
create table if not exists public.ve_abuse_cases (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  status text not null default 'watching'
    check (status in ('watching','cleared','voided','suspended','banned')),
  score integer not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  opened_by text not null default 'system',        -- system | judge
  watch_until timestamptz,
  decided_by uuid references public.members(id),
  decided_at timestamptz,
  decision_note text,
  void_snapshot jsonb,                              -- what a void took, so it can be restored
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ve_abuse_one_open_case on public.ve_abuse_cases(member_id)
  where status in ('watching','voided','suspended','banned');
create index if not exists ve_abuse_cases_status on public.ve_abuse_cases(status, updated_at desc);

create table if not exists public.ve_abuse_signals (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id),
  kind text not null,
  weight integer not null,
  day date not null default ((now() at time zone 'America/New_York')::date),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (member_id, kind, day)
);
create index if not exists ve_abuse_signals_member on public.ve_abuse_signals(member_id, created_at desc);

create table if not exists public.ve_abuse_events (
  id bigint generated always as identity primary key,
  case_id uuid references public.ve_abuse_cases(id),
  member_id uuid not null references public.members(id),
  actor uuid references public.members(id),         -- null for the system
  action text not null,
  note text,
  snapshot jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ve_abuse_events_case on public.ve_abuse_events(case_id, created_at);

alter table public.ve_abuse_cases enable row level security;
alter table public.ve_abuse_signals enable row level security;
alter table public.ve_abuse_events enable row level security;
revoke all on public.ve_abuse_cases, public.ve_abuse_signals, public.ve_abuse_events from anon, authenticated;

-- 4. Settings: log-only until Sean turns it on (about a week).
insert into public.ve_site_settings(key, value) values
 ('abuse_watch', jsonb_build_object('mode','log_only','open_at',40,'watch_days',30,'log_only_until','2026-11-10T05:00:00Z'))
on conflict (key) do nothing;

-- 5. A frozen account moves no points, whatever function asks. Voids and restores pass a transaction-local flag.
create or replace function public.ve_members_freeze_guard() returns trigger
language plpgsql as $$
begin
  if new.standing in ('suspended','banned')
     and new.lesars_balance is distinct from old.lesars_balance
     and coalesce(current_setting('ve.abuse_bypass', true), '') <> '1' then
    raise exception 'account_frozen' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_members_freeze_guard on public.members;
create trigger trg_ve_members_freeze_guard before update of lesars_balance on public.members
  for each row execute function public.ve_members_freeze_guard();

-- 6. The scan. Records signals every run; opens a case only when mode is 'on' and the score reaches open_at.
create or replace function public.ve_abuse_scan() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  cfg jsonb := coalesce((select value from ve_site_settings where key = 'abuse_watch'), '{}'::jsonb);
  v_mode text := coalesce(cfg->>'mode', 'log_only');
  v_open int := coalesce((cfg->>'open_at')::int, 40);
  v_days int := coalesce((cfg->>'watch_days')::int, 30);
  v_new_signals int := 0; v_opened int := 0; n int;
  disposable text[] := array['mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org','yopmail.com',
    'trashmail.com','sharklasers.com','getnada.com','dispostable.com','throwawaymail.com','maildrop.cc','fakeinbox.com','mintemail.com'];
begin
  -- Only people count: not Guides, the team, test logins, quarantined rows or super admins.
  create temp table _scope on commit drop as
    select id, email, created_at, referred_by, entry_via, survey_door_at, mission_survey_completed_at
    from members where coalesce(member_class,'member') = 'member' and not coalesce(is_superadmin,false);

  -- A. Referral burst: one sharer, five or more sign-ups on their link inside 24 hours.
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select s.referred_by, 'referral_burst', 30,
         jsonb_build_object('count', count(*), 'members', jsonb_agg(s.id), 'first', min(s.created_at), 'last', max(s.created_at))
  from _scope s
  where s.referred_by is not null and s.created_at > now() - interval '7 days'
    and exists (select 1 from _scope x where x.referred_by = s.referred_by and x.id <> s.id
                and abs(extract(epoch from x.created_at - s.created_at)) < 86400)
  group by s.referred_by
  having count(*) >= 5
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- B. A survey finished impossibly fast (under two minutes from start to finish).
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select s.id, 'fast_survey', 40,
         jsonb_build_object('seconds', extract(epoch from s.mission_survey_completed_at - s.survey_door_at)::int)
  from _scope s
  where s.entry_via = 'survey' and s.survey_door_at is not null and s.mission_survey_completed_at is not null
    and s.mission_survey_completed_at - s.survey_door_at < interval '2 minutes'
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- C. A throwaway email address.
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select s.id, 'disposable_email', 20, jsonb_build_object('domain', split_part(lower(s.email),'@',2))
  from _scope s where split_part(lower(s.email),'@',2) = any (disposable)
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- D. Points faster than activity explains: over 3,000 earned in 24 hours, gifts and welcome points left out.
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select l.member_id, 'points_velocity', 25, jsonb_build_object('earned_24h', sum(l.delta))
  from points_ledger l join _scope s on s.id = l.member_id
  where l.delta > 0 and l.created_at > now() - interval '24 hours'
    and l.reason not in ('admin_adjust','comp_membership','welcome','seed_initial','Welcome bonus + early activity','abuse_restore','challenge_passport')
  group by l.member_id having sum(l.delta) > 3000
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- E. Check-in pace: four or more different places inside an hour.
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select c.member_id, 'checkin_pace', 25,
         jsonb_build_object('places', count(distinct c.listing_id), 'from', min(c.created_at), 'to', max(c.created_at))
  from ve_checkins c join _scope s on s.id = c.member_id
  where c.created_at > now() - interval '7 days'
  group by c.member_id, date_trunc('hour', c.created_at)
  having count(distinct c.listing_id) >= 4
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- F. A sharer whose people all came through the free survey door and none through the $11.
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select s.referred_by, 'survey_only_referrals', 15,
         jsonb_build_object('survey_joins', count(*) filter (where s.entry_via = 'survey'),
                            'paid_joins', count(*) filter (where s.entry_via = 'passport'))
  from _scope s where s.referred_by is not null
  group by s.referred_by
  having count(*) filter (where s.entry_via = 'survey') >= 3 and count(*) filter (where s.entry_via = 'passport') = 0
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n = row_count; v_new_signals := v_new_signals + n;

  -- Score: each kind counts once, over the last 14 days.
  create temp table _scores on commit drop as
    select member_id, sum(w) score, jsonb_agg(jsonb_build_object('kind', kind, 'weight', w, 'last', last_at)) reasons
    from (select member_id, kind, max(weight) w, max(created_at) last_at from ve_abuse_signals
          where created_at > now() - interval '14 days' group by member_id, kind) k
    group by member_id;

  if v_mode = 'on' then
    insert into ve_abuse_cases(member_id, score, reasons, watch_until)
    select sc.member_id, sc.score, sc.reasons, now() + make_interval(days => v_days)
    from _scores sc
    where sc.score >= v_open
      and not exists (select 1 from ve_abuse_cases c where c.member_id = sc.member_id
                      and c.status in ('watching','voided','suspended','banned'))
    on conflict do nothing;
    get diagnostics v_opened = row_count;
    insert into ve_abuse_events(case_id, member_id, action, note)
      select id, member_id, 'opened', 'Opened by the scan' from ve_abuse_cases where created_at > now() - interval '1 minute' and opened_by = 'system';
    -- Keep watching cases current.
    update ve_abuse_cases c set score = sc.score, reasons = sc.reasons, updated_at = now()
      from _scores sc where sc.member_id = c.member_id and c.status = 'watching';
  end if;

  return jsonb_build_object('mode', v_mode, 'new_signals', v_new_signals, 'opened', v_opened,
    'would_open', (select coalesce(jsonb_agg(jsonb_build_object('member_id', member_id, 'score', score, 'reasons', reasons)), '[]'::jsonb)
                   from _scores where score >= v_open));
end $$;

-- 7. A judge opens a case by hand (no signal needed).
create or replace function public.ve_abuse_watch(p_member uuid, p_judge uuid, p_note text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare cid uuid; days int := coalesce((select (value->>'watch_days')::int from ve_site_settings where key = 'abuse_watch'), 30);
begin
  if not coalesce((select is_superadmin from members where id = p_judge), false) then return jsonb_build_object('error','judge_only'); end if;
  if length(trim(coalesce(p_note,''))) < 3 then return jsonb_build_object('error','note_required'); end if;
  if exists (select 1 from ve_abuse_cases where member_id = p_member and status in ('watching','voided','suspended','banned')) then
    return jsonb_build_object('error','already_open'); end if;
  insert into ve_abuse_cases(member_id, opened_by, watch_until, decision_note)
    values (p_member, 'judge', now() + make_interval(days => days), p_note) returning id into cid;
  insert into ve_abuse_events(case_id, member_id, actor, action, note) values (cid, p_member, p_judge, 'opened', p_note);
  return jsonb_build_object('case_id', cid);
end $$;

-- 8. The judge decides. Only a super admin, always with a note, always logged.
-- Actions: clear | void | suspend | ban | reinstate (undo suspend or ban) | restore_points (undo a void).
create or replace function public.ve_abuse_decide(p_case uuid, p_judge uuid, p_action text, p_note text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  c ve_abuse_cases; bal int; mp member_points; snap jsonb;
begin
  if not coalesce((select is_superadmin from members where id = p_judge), false) then return jsonb_build_object('error','judge_only'); end if;
  if length(trim(coalesce(p_note,''))) < 3 then return jsonb_build_object('error','note_required'); end if;
  select * into c from ve_abuse_cases where id = p_case for update;
  if not found then return jsonb_build_object('error','case_not_found'); end if;
  perform set_config('ve.abuse_bypass', '1', true);

  if p_action = 'clear' then
    update ve_abuse_cases set status = 'cleared', decided_by = p_judge, decided_at = now(), decision_note = p_note, updated_at = now() where id = p_case;
    update members set standing = 'good', standing_at = now() where id = c.member_id and standing <> 'good';

  elsif p_action = 'void' then
    if c.status = 'voided' or c.void_snapshot is not null then return jsonb_build_object('error','already_voided'); end if;
    select coalesce(lesars_balance,0) into bal from members where id = c.member_id for update;
    select * into mp from member_points where member_id = c.member_id for update;
    snap := jsonb_build_object('lesars_balance', bal, 'available_points', coalesce(mp.available_points,0),
                               'total_points', coalesce(mp.total_points,0), 'spent_points', coalesce(mp.spent_points,0));
    update members set lesars_balance = 0 where id = c.member_id;
    update member_points set available_points = 0, total_points = 0, updated_at = now() where member_id = c.member_id;
    if bal > 0 then insert into points_ledger(member_id, delta, reason, ref_id) values (c.member_id, -bal, 'abuse_void', 'case:'||p_case); end if;
    update ve_abuse_cases set status = case when status = 'watching' then 'voided' else status end, void_snapshot = snap,
      decided_by = p_judge, decided_at = now(), decision_note = p_note, updated_at = now() where id = p_case;
    insert into ve_abuse_events(case_id, member_id, actor, action, note, snapshot) values (p_case, c.member_id, p_judge, 'void', p_note, snap);
    return jsonb_build_object('ok', true, 'voided', snap);

  elsif p_action = 'restore_points' then
    if c.void_snapshot is null then return jsonb_build_object('error','nothing_to_restore'); end if;
    snap := c.void_snapshot;
    update members set lesars_balance = coalesce(lesars_balance,0) + (snap->>'lesars_balance')::int where id = c.member_id;
    update member_points set available_points = available_points + (snap->>'available_points')::int,
      total_points = total_points + (snap->>'total_points')::int, updated_at = now() where member_id = c.member_id;
    if (snap->>'lesars_balance')::int > 0 then
      insert into points_ledger(member_id, delta, reason, ref_id)
      values (c.member_id, (snap->>'lesars_balance')::int, 'abuse_restore', 'case:'||p_case); end if;
    update ve_abuse_cases set void_snapshot = null, decided_by = p_judge, decided_at = now(), decision_note = p_note, updated_at = now() where id = p_case;
    insert into ve_abuse_events(case_id, member_id, actor, action, note, snapshot) values (p_case, c.member_id, p_judge, 'restore_points', p_note, snap);
    return jsonb_build_object('ok', true, 'restored', snap);

  elsif p_action in ('suspend','ban') then
    update members set standing = case p_action when 'suspend' then 'suspended' else 'banned' end, standing_at = now() where id = c.member_id;
    update ve_abuse_cases set status = case p_action when 'suspend' then 'suspended' else 'banned' end,
      decided_by = p_judge, decided_at = now(), decision_note = p_note, updated_at = now() where id = p_case;

  elsif p_action = 'reinstate' then
    update members set standing = 'good', standing_at = now() where id = c.member_id;
    update ve_abuse_cases set status = 'cleared', decided_by = p_judge, decided_at = now(), decision_note = p_note, updated_at = now() where id = p_case;

  else
    return jsonb_build_object('error','bad_action');
  end if;

  insert into ve_abuse_events(case_id, member_id, actor, action, note) values (p_case, c.member_id, p_judge, p_action, p_note);
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;

revoke execute on function public.ve_abuse_scan(), public.ve_abuse_watch(uuid,uuid,text),
  public.ve_abuse_decide(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.ve_abuse_scan(), public.ve_abuse_watch(uuid,uuid,text),
  public.ve_abuse_decide(uuid,uuid,text,text) to service_role;

-- 9. Daily scan at 9:11 UTC (4:11 AM Eastern). Log-only records signals and opens nothing.
select cron.unschedule('ve-abuse-scan') where exists (select 1 from cron.job where jobname = 've-abuse-scan');
select cron.schedule('ve-abuse-scan', '11 9 * * *', $$select public.ve_abuse_scan()$$);
