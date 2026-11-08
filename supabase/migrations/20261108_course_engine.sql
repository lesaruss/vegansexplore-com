-- ve-pre-vegan-guide: step 1, the brand-neutral course engine (canon canon-ve-pre-vegan-guide v1).
-- Programs, phases, days, challenges, unlocks, the question map, enrollments, progress, proofs, earned unlocks, course answers.
-- First program: Vegans Explore's "111 Days to Going and Staying Vegan" (slug pre-vegan-111, status draft).
-- Built so 111 Day Theory is a second program row (brand_slug lesaruss), never new code.
--
-- Reuse, not copies:
--   * scans    -> ve_product_scans (the Scan log), checked automatically
--   * saves    -> ve_listing_saves / ve_guide_saves / ve_episode_saves (the Saves logs), checked automatically
--   * check-ins-> ve_checkins (the check-in log), checked automatically
--   * a photo at a check-in -> ve_checkin_actions, reviewed in Depot > Check-ins; a trigger mirrors the decision here
--   * photos, voice notes and reflections that belong to no check-in are course_proofs reviewed by the same rules as
--     bounties (a person approves, points only on approval) through course_proof_review; the Depot screen for them is step 3.
--   * points   -> ve_points_grant (frozen accounts, once per ref), ledger reason 'course'
--   * profile questions -> ve_profile_answer (Build your profile, paid per answer as it already is)
-- RLS on, no policies: everything goes through the functions below (service role only).

-- 0. ledger reason --------------------------------------------------------------------------------------------------
alter table points_ledger drop constraint if exists points_ledger_reason_check;
alter table points_ledger add constraint points_ledger_reason_check check (reason = any (array[
  'signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote',
  'event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received',
  'vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase',
  'bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem',
  've_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved',
  'guide_chat_spend','credit_exchange','checkin','welcome','purchase_thanks','points_contribution','listing_submit',
  'profile_answer','partner_optin','venue_report','nonprofit_survey','barcode_add','challenge','challenge_passport',
  'host_story','abuse_void','abuse_restore','survey_answer','dish_slot','course'
]::text[])) not valid;

-- 1. tables ---------------------------------------------------------------------------------------------------------
create table if not exists course_programs (
  slug text primary key,
  brand_slug text not null,
  title text not null,
  days int not null check (days between 1 and 1000),
  status text not null default 'draft' check (status in ('draft','live','retired')),
  guide_slug text,
  survey_slug text,
  narrator text,
  unlock_hour int not null default 5 check (unlock_hour between 0 and 23),
  proof_window_days int not null default 7,
  pause_max_days int not null default 14,
  quiet_note_days int not null default 3,
  phase_gate text not null default 'capstone_sent' check (phase_gate in ('none','capstone_sent','capstone_approved')),
  points_currency text not null default 've_points' check (points_currency in ('ve_points','none')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_phases (
  program_slug text not null references course_programs(slug) on delete cascade,
  n int not null,
  title text not null,
  first_day int not null,
  last_day int not null,
  primary key (program_slug, n),
  check (first_day <= last_day)
);

create table if not exists course_days (
  program_slug text not null references course_programs(slug) on delete cascade,
  day int not null check (day >= 1),
  phase_n int not null,
  title text not null,
  body jsonb not null default '{}'::jsonb,      -- {guide_line, learn, do, links:[...]}
  free boolean not null default false,          -- shown to visitors (Day 1)
  capstone boolean not null default false,
  ready boolean not null default false,         -- a day not ready is never unlocked (Days 8+ arrive in batches)
  line_status text not null default 'draft' check (line_status in ('draft','approved','recorded')),
  audio_path text,
  updated_at timestamptz not null default now(),
  primary key (program_slug, day)
);

create table if not exists course_challenges (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null references course_programs(slug) on delete cascade,
  day int not null,
  key text not null,
  label text not null,
  kind text not null check (kind in ('open','tick','scan','save','checkin','photo','voice','reflection','capstone')),
  review text not null check (review in ('auto','person')),
  source text not null default 'course' check (source in (
    'course','product_scans','listing_saves','guide_saves','episode_saves','checkins','checkin_action')),
  target int not null default 1,
  points int not null default 0 check (points >= 0),
  optional boolean not null default false,
  accepts text[] not null default '{}'::text[],  -- for a person-reviewed proof: any of photo, voice, text, link
  pos int not null default 0,
  unique (program_slug, day, key)
);

create table if not exists course_unlocks (
  program_slug text not null references course_programs(slug) on delete cascade,
  day int not null,
  key text not null,
  label text not null,
  kind text not null check (kind in ('badge','phase','feature')),
  earn_on text not null check (earn_on in ('open','approved','finish')),
  primary key (program_slug, key)
);

create table if not exists course_questions (
  program_slug text not null references course_programs(slug) on delete cascade,
  day int not null,
  question_key text not null,
  source text not null check (source in ('profile','course')),
  prompt text,                                  -- course-only questions carry their own words
  options jsonb,
  primary key (program_slug, day, question_key)
);

create table if not exists course_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null references course_programs(slug),
  member_id uuid not null references members(id) on delete cascade,
  tz text not null default 'America/New_York',
  status text not null default 'active' check (status in ('active','paused','finished','stopped')),
  started_at timestamptz not null default now(),
  current_day int not null default 1,
  next_unlock_at timestamptz,
  paused_until timestamptz,
  pause_phases int[] not null default '{}'::int[],
  last_seen_at timestamptz,
  quiet_noted_at timestamptz,
  finished_at timestamptz,
  final_choice text check (final_choice in ('vegan','prevegan')),
  daily_email boolean not null default false,
  unique (program_slug, member_id)
);

create table if not exists course_progress (
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  day int not null,
  unlocked_at timestamptz not null default now(),
  opened_at timestamptz,
  primary key (enrollment_id, day)
);

create table if not exists course_proofs (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  challenge_id uuid not null references course_challenges(id),
  day int not null,
  kind text not null,
  status text not null check (status in ('pending','approved','declined')),
  review_via text not null check (review_via in ('auto','course','checkin_action')),
  body text,
  file_path text,
  link text,
  source_id uuid,                               -- the ve_checkin_actions row, when review_via = checkin_action
  points int not null default 0,
  paid_note text,
  local_day date not null,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists course_proofs_one_live
  on course_proofs (enrollment_id, challenge_id) where status <> 'declined';
create index if not exists course_proofs_queue on course_proofs (status, review_via, created_at);

create table if not exists course_member_unlocks (
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  program_slug text not null,
  key text not null,
  earned_at timestamptz not null default now(),
  primary key (enrollment_id, key)
);

create table if not exists course_answers (
  enrollment_id uuid not null references course_enrollments(id) on delete cascade,
  question_key text not null,
  day int not null,
  value jsonb not null,
  shown boolean not null default false,         -- Can be shown / Just for Vegans Explore; course answers start private
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, question_key)
);

alter table course_programs enable row level security;
alter table course_phases enable row level security;
alter table course_days enable row level security;
alter table course_challenges enable row level security;
alter table course_unlocks enable row level security;
alter table course_questions enable row level security;
alter table course_enrollments enable row level security;
alter table course_progress enable row level security;
alter table course_proofs enable row level security;
alter table course_member_unlocks enable row level security;
alter table course_answers enable row level security;

-- 2. helpers --------------------------------------------------------------------------------------------------------
-- The next unlock time for the day after the one opened: 5 AM local on the calendar day after the opened day unlocked,
-- and never earlier than the first 5 AM after it was opened. One day at a time: no backlog, no bingeing ahead.
create or replace function course_next_unlock(p_tz text, p_hour int, p_unlocked timestamptz, p_opened timestamptz)
returns timestamptz language sql immutable as $$
  select greatest(
    ((((p_unlocked at time zone p_tz)::date + 1)::timestamp + make_interval(hours => p_hour)) at time zone p_tz),
    case when (p_opened at time zone p_tz)::time < make_time(p_hour, 0, 0)
         then ((((p_opened at time zone p_tz)::date)::timestamp + make_interval(hours => p_hour)) at time zone p_tz)
         else ((((p_opened at time zone p_tz)::date + 1)::timestamp + make_interval(hours => p_hour)) at time zone p_tz) end);
$$;

-- Pay a course point, once per ref, at most one paid action of a kind per local calendar day (canon). Returns points paid.
create or replace function course_pay(p_proof uuid) returns int
language plpgsql security definer set search_path = public as $$
declare pr course_proofs; ch course_challenges; pg course_programs; e course_enrollments; r jsonb; today date;
begin
  select * into pr from course_proofs where id = p_proof for update;
  if pr.status <> 'approved' or pr.points > 0 then return coalesce(pr.points, 0); end if;
  select * into ch from course_challenges where id = pr.challenge_id;
  select * into e from course_enrollments where id = pr.enrollment_id;
  select * into pg from course_programs where slug = e.program_slug;
  if ch.points <= 0 or pg.points_currency = 'none' then return 0; end if;
  today := (now() at time zone e.tz)::date;
  if exists (select 1 from course_proofs x where x.enrollment_id = pr.enrollment_id and x.kind = pr.kind
             and x.id <> pr.id and x.points > 0 and (x.reviewed_at at time zone e.tz)::date = today) then
    update course_proofs set paid_note = 'one paid ' || pr.kind || ' a day' where id = p_proof;
    return 0;
  end if;
  r := ve_points_grant(pr.member_id, ch.points, 'course', 'course:' || pr.enrollment_id || ':' || pr.day || ':' || ch.key);
  if coalesce((r ->> 'granted')::boolean, false) then
    update course_proofs set points = ch.points, paid_note = null where id = p_proof;
    return ch.points;
  end if;
  update course_proofs set paid_note = case when r ? 'frozen' then 'account on hold'
                                             when r ? 'already' then 'already paid' else r ->> 'error' end where id = p_proof;
  return 0;
end $$;

-- Earn the unlocks of a day for a trigger (open, approved, finish).
create or replace function course_earn(p_enrollment uuid, p_day int, p_on text) returns int
language plpgsql security definer set search_path = public as $$
declare e course_enrollments; n int;
begin
  select * into e from course_enrollments where id = p_enrollment;
  insert into course_member_unlocks (enrollment_id, member_id, program_slug, key)
  select e.id, e.member_id, e.program_slug, u.key from course_unlocks u
  where u.program_slug = e.program_slug and u.day = p_day and u.earn_on = p_on
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- 3. the day clock (lazy: run on every read and by cron) ------------------------------------------------------------
create or replace function course_refresh(p_enrollment uuid) returns course_enrollments
language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs; cur course_progress; nd course_days; cap course_days; gate_ok boolean;
begin
  select * into e from course_enrollments where id = p_enrollment for update;
  if not found then return null; end if;
  select * into pg from course_programs where slug = e.program_slug;
  if e.status = 'paused' and e.paused_until is not null and e.paused_until <= now() then
    update course_enrollments set status = 'active', paused_until = null where id = e.id returning * into e;
  end if;
  if e.status <> 'active' then return e; end if;
  select * into cur from course_progress where enrollment_id = e.id and day = e.current_day;
  if cur.opened_at is null or e.current_day >= pg.days then return e; end if;
  if e.next_unlock_at is null then
    update course_enrollments set next_unlock_at = course_next_unlock(e.tz, pg.unlock_hour, cur.unlocked_at, cur.opened_at)
      where id = e.id returning * into e;
  end if;
  if now() < e.next_unlock_at then return e; end if;
  select * into nd from course_days where program_slug = e.program_slug and day = e.current_day + 1;
  if not found or not nd.ready then return e; end if;
  -- a capstone ends a phase; the next phase waits for it (phase_gate)
  select * into cap from course_days where program_slug = e.program_slug and day = e.current_day;
  if cap.capstone and pg.phase_gate <> 'none' then
    select exists (select 1 from course_proofs p join course_challenges c on c.id = p.challenge_id
                   where p.enrollment_id = e.id and p.day = e.current_day and c.kind = 'capstone'
                     and (p.status = 'approved' or (pg.phase_gate = 'capstone_sent' and p.status = 'pending')))
      into gate_ok;
    if not gate_ok then return e; end if;
  end if;
  insert into course_progress (enrollment_id, day) values (e.id, e.current_day + 1) on conflict do nothing;
  update course_enrollments set current_day = e.current_day + 1, next_unlock_at = null where id = e.id returning * into e;
  return e;
end $$;

-- 4. enroll, open, pause, finish ------------------------------------------------------------------------------------
create or replace function course_enroll(p_member uuid, p_program text, p_tz text default 'America/New_York')
returns jsonb language plpgsql security definer set search_path = public as $$
declare pg course_programs; m record; e course_enrollments; tz text;
begin
  select * into pg from course_programs where slug = p_program;
  if not found then return jsonb_build_object('error','program_not_found'); end if;
  select id, membership_status, standing, member_class, coalesce(is_superadmin,false) sa into m from members where id = p_member;
  if not found then return jsonb_build_object('error','member_not_found'); end if;
  if coalesce(m.standing,'good') <> 'good' then return jsonb_build_object('error','account_not_in_good_standing'); end if;
  if m.membership_status <> 'active' then return jsonb_build_object('error','members_only'); end if;
  if pg.status <> 'live' and not (m.sa or m.member_class = 'internal') then return jsonb_build_object('error','not_open'); end if;
  tz := case when p_tz is not null and exists (select 1 from pg_timezone_names where name = p_tz) then p_tz else 'America/New_York' end;
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member;
  if found then return jsonb_build_object('ok', true, 'already', true, 'enrollment', e.id); end if;
  insert into course_enrollments (program_slug, member_id, tz) values (p_program, p_member, tz) returning * into e;
  insert into course_progress (enrollment_id, day) values (e.id, 1);
  return jsonb_build_object('ok', true, 'enrollment', e.id, 'current_day', 1);
end $$;

create or replace function course_open_day(p_member uuid, p_program text, p_day int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pr course_progress; ch course_challenges; pid uuid; first boolean := false;
begin
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member;
  if not found then return jsonb_build_object('error','not_enrolled'); end if;
  e := course_refresh(e.id);
  select * into pr from course_progress where enrollment_id = e.id and day = p_day;
  if not found then return jsonb_build_object('error','not_unlocked', 'current_day', e.current_day, 'next_unlock_at', e.next_unlock_at); end if;
  if pr.opened_at is null then
    first := true;
    update course_progress set opened_at = now() where enrollment_id = e.id and day = p_day;
    perform course_earn(e.id, p_day, 'open');
    -- the open challenge pays only for the newest day, the day it unlocks for (re-reading pays nothing)
    select * into ch from course_challenges where program_slug = p_program and day = p_day and kind = 'open';
    if found and p_day = e.current_day then
      insert into course_proofs (enrollment_id, member_id, challenge_id, day, kind, status, review_via, local_day, reviewed_at)
      values (e.id, p_member, ch.id, p_day, 'open', 'approved', 'auto', (now() at time zone e.tz)::date, now())
      on conflict do nothing returning id into pid;
      if pid is not null then perform course_pay(pid); end if;
    end if;
  end if;
  update course_enrollments set last_seen_at = now(), quiet_noted_at = null where id = e.id;
  e := course_refresh(e.id);
  return jsonb_build_object('ok', true, 'first_open', first, 'current_day', e.current_day, 'next_unlock_at', e.next_unlock_at);
end $$;

create or replace function course_pause(p_member uuid, p_program text, p_days int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs; ph int;
begin
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member for update;
  if not found then return jsonb_build_object('error','not_enrolled'); end if;
  select * into pg from course_programs where slug = p_program;
  if p_days = 0 then  -- resume early
    if e.status <> 'paused' then return jsonb_build_object('error','not_paused'); end if;
    update course_enrollments set status = 'active', paused_until = null where id = e.id;
    return jsonb_build_object('ok', true, 'resumed', true);
  end if;
  if e.status <> 'active' then return jsonb_build_object('error','not_active'); end if;
  if p_days < 1 or p_days > pg.pause_max_days then return jsonb_build_object('error','bad_days', 'max', pg.pause_max_days); end if;
  select d.phase_n into ph from course_days d where d.program_slug = p_program and d.day = e.current_day;
  if ph = any (e.pause_phases) then return jsonb_build_object('error','already_paused_this_phase'); end if;
  update course_enrollments set status = 'paused', paused_until = now() + make_interval(days => p_days),
         pause_phases = pause_phases || ph,
         next_unlock_at = case when next_unlock_at is not null then greatest(next_unlock_at, now() + make_interval(days => p_days)) end
   where id = e.id;
  return jsonb_build_object('ok', true, 'paused_until', now() + make_interval(days => p_days));
end $$;

-- 5. proofs ---------------------------------------------------------------------------------------------------------
-- Automatic challenges (scan, save, check-in) read the logs they already live in, from the day's unlock to the end of
-- its proof window. Run on every read; pays what is met.
create or replace function course_auto_check(p_enrollment uuid) returns int
language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs; c record; got int; pid uuid; paid int := 0;
begin
  select * into e from course_enrollments where id = p_enrollment;
  select * into pg from course_programs where slug = e.program_slug;
  for c in
    select ch.*, p.unlocked_at, least(now(), p.unlocked_at + make_interval(days => pg.proof_window_days)) as until_at
    from course_challenges ch join course_progress p on p.enrollment_id = e.id and p.day = ch.day
    where ch.program_slug = e.program_slug and ch.review = 'auto' and ch.kind in ('scan','save','checkin')
      and now() <= p.unlocked_at + make_interval(days => pg.proof_window_days)
      and not exists (select 1 from course_proofs x where x.enrollment_id = e.id and x.challenge_id = ch.id and x.status <> 'declined')
  loop
    got := case c.source
      when 'product_scans' then (select count(distinct gtin) from ve_product_scans s where s.member_id = e.member_id and s.created_at between c.unlocked_at and c.until_at)
      when 'listing_saves' then (select count(*) from ve_listing_saves s where s.member_id = e.member_id and s.saved_at between c.unlocked_at and c.until_at)
      when 'guide_saves'   then (select count(*) from ve_guide_saves s where s.member_id = e.member_id and s.created_at between c.unlocked_at and c.until_at)
      when 'episode_saves' then (select count(*) from ve_episode_saves s where s.member_id = e.member_id and s.created_at between c.unlocked_at and c.until_at)
      when 'checkins'      then (select count(*) from ve_checkins s where s.member_id = e.member_id and s.created_at between c.unlocked_at and c.until_at)
      else 0 end;
    if got >= c.target then
      insert into course_proofs (enrollment_id, member_id, challenge_id, day, kind, status, review_via, body, local_day, reviewed_at)
      values (e.id, e.member_id, c.id, c.day, c.kind, 'approved', 'auto', got || ' from the ' || c.source || ' log',
              (now() at time zone e.tz)::date, now())
      on conflict do nothing returning id into pid;
      if pid is not null then paid := paid + course_pay(pid); end if;
    end if;
  end loop;
  return paid;
end $$;

-- A member sends a proof: tick (auto, paid at once), or photo / voice / reflection / capstone (waits for a person), or a
-- photo already sent at a check-in (checkin_action_id; Depot > Check-ins decides it).
-- p_payload: {body, file_path, link, checkin_action_id}
create or replace function course_proof_submit(p_member uuid, p_program text, p_day int, p_key text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs; ch course_challenges; pr course_progress; act ve_checkin_actions; pid uuid;
        via text := 'course'; st text := 'pending'; paid int := 0; body text; fp text; lk text; src uuid;
begin
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member;
  if not found then return jsonb_build_object('error','not_enrolled'); end if;
  if e.status not in ('active','paused') then return jsonb_build_object('error','not_active'); end if;
  if ve_member_frozen(p_member) then return jsonb_build_object('error','account_not_in_good_standing'); end if;
  select * into pg from course_programs where slug = p_program;
  select * into ch from course_challenges where program_slug = p_program and day = p_day and key = p_key;
  if not found then return jsonb_build_object('error','no_such_challenge'); end if;
  if ch.kind in ('open','scan','save','checkin') then return jsonb_build_object('error','automatic'); end if;
  select * into pr from course_progress where enrollment_id = e.id and day = p_day;
  if not found then return jsonb_build_object('error','not_unlocked'); end if;
  if now() > pr.unlocked_at + make_interval(days => pg.proof_window_days) then return jsonb_build_object('error','window_closed'); end if;
  if exists (select 1 from course_proofs where enrollment_id = e.id and challenge_id = ch.id and status <> 'declined') then
    return jsonb_build_object('error','already_sent');
  end if;
  body := nullif(btrim(left(p_payload ->> 'body', 2000)), '');
  fp := nullif(p_payload ->> 'file_path', '');
  lk := nullif(p_payload ->> 'link', '');
  if ch.source = 'checkin_action' then
    select * into act from ve_checkin_actions where id = nullif(p_payload ->> 'checkin_action_id','')::uuid;
    if not found or act.member_id <> p_member or act.created_at < pr.unlocked_at then
      return jsonb_build_object('error','checkin_action_needed');
    end if;
    via := 'checkin_action'; src := act.id; fp := act.photo_path;
    st := case act.status when 'approved' then 'approved' when 'declined' then 'declined' else 'pending' end;
  elsif ch.kind = 'tick' then
    via := 'auto'; st := 'approved';
  else
    if body is null and fp is null and lk is null then return jsonb_build_object('error','proof_needed'); end if;
    if fp is not null and fp !~ ('^course-proofs/' || p_member || '/') then return jsonb_build_object('error','upload_first'); end if;
  end if;
  insert into course_proofs (enrollment_id, member_id, challenge_id, day, kind, status, review_via, body, file_path, link,
                             source_id, local_day, reviewed_at)
  values (e.id, p_member, ch.id, p_day, ch.kind, st, via, body, fp, lk, src, (now() at time zone e.tz)::date,
          case when st <> 'pending' then now() end)
  returning id into pid;
  if st = 'approved' then
    paid := course_pay(pid);
    if ch.kind = 'capstone' then perform course_earn(e.id, p_day, 'approved'); end if;
  end if;
  update course_enrollments set last_seen_at = now() where id = e.id;
  perform course_refresh(e.id);
  return jsonb_build_object('ok', true, 'proof', pid, 'status', st, 'points', paid);
end $$;

-- A person decides a proof (the bounty rule: points only on approval). p_decision approve | decline.
create or replace function course_proof_review(p_proof uuid, p_reviewer uuid, p_decision text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr course_proofs; ok boolean; paid int := 0;
begin
  select coalesce(is_superadmin,false) into ok from members where id = p_reviewer;
  if not coalesce(ok,false) then return jsonb_build_object('error','forbidden'); end if;
  select * into pr from course_proofs where id = p_proof for update;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if pr.review_via <> 'course' then return jsonb_build_object('error','decided_elsewhere', 'via', pr.review_via); end if;
  if pr.status <> 'pending' then return jsonb_build_object('error','already_decided', 'status', pr.status); end if;
  if p_decision = 'decline' and nullif(btrim(coalesce(p_note,'')),'') is null then return jsonb_build_object('error','note_needed'); end if;
  if p_decision not in ('approve','decline') then return jsonb_build_object('error','bad_decision'); end if;
  update course_proofs set status = case p_decision when 'approve' then 'approved' else 'declined' end,
         review_note = nullif(btrim(coalesce(p_note,'')),''), reviewed_by = p_reviewer, reviewed_at = now()
   where id = p_proof;
  if p_decision = 'approve' then
    paid := course_pay(p_proof);
    if pr.kind = 'capstone' then perform course_earn(pr.enrollment_id, pr.day, 'approved'); end if;
  end if;
  perform course_refresh(pr.enrollment_id);
  return jsonb_build_object('ok', true, 'points', paid);
end $$;

-- Mirror a Depot > Check-ins decision onto the course proof that points at it.
create or replace function course_checkin_action_trg() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.status is distinct from old.status and new.status in ('approved','declined') then
    for p in select id, enrollment_id from course_proofs where review_via = 'checkin_action' and source_id = new.id and status = 'pending' loop
      update course_proofs set status = new.status, reviewed_by = new.reviewed_by, reviewed_at = coalesce(new.reviewed_at, now()),
             review_note = new.review_note where id = p.id;
      if new.status = 'approved' then perform course_pay(p.id); end if;
      perform course_refresh(p.enrollment_id);
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists trg_course_checkin_action on ve_checkin_actions;
create trigger trg_course_checkin_action after update of status on ve_checkin_actions
  for each row execute function course_checkin_action_trg();

-- 6. the question map -----------------------------------------------------------------------------------------------
-- A profile question goes to Build your profile (ve_profile_answer: saved, paid per answer as it is). A course question
-- (their why, what is hardest, the Day 111 choice) is kept in course_answers, private by default.
create or replace function course_answer(p_member uuid, p_program text, p_day int, p_key text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e course_enrollments; q course_questions;
begin
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member;
  if not found then return jsonb_build_object('error','not_enrolled'); end if;
  select * into q from course_questions where program_slug = p_program and day = p_day and question_key = p_key;
  if not found then return jsonb_build_object('error','no_such_question'); end if;
  if not exists (select 1 from course_progress where enrollment_id = e.id and day = p_day) then return jsonb_build_object('error','not_unlocked'); end if;
  if q.source = 'profile' then return ve_profile_answer(p_member, p_key, p_value); end if;
  if p_value is null or p_value = 'null'::jsonb or btrim(p_value #>> '{}') = '' then return jsonb_build_object('error','empty'); end if;
  insert into course_answers (enrollment_id, question_key, day, value) values (e.id, p_key, p_day, p_value)
  on conflict (enrollment_id, question_key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- Day 111: they choose. Never a Vegan badge from us; "I'm Vegan" updates their own journey answer.
create or replace function course_finish(p_member uuid, p_program text, p_choice text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs;
begin
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member for update;
  if not found then return jsonb_build_object('error','not_enrolled'); end if;
  select * into pg from course_programs where slug = p_program;
  if p_choice not in ('vegan','prevegan') then return jsonb_build_object('error','bad_choice'); end if;
  if e.current_day < pg.days or not exists (select 1 from course_progress where enrollment_id = e.id and day = pg.days and opened_at is not null) then
    return jsonb_build_object('error','not_at_the_end');
  end if;
  update course_enrollments set status = 'finished', finished_at = coalesce(finished_at, now()), final_choice = p_choice where id = e.id;
  insert into course_answers (enrollment_id, question_key, day, value) values (e.id, 'final_choice', pg.days, to_jsonb(p_choice))
  on conflict (enrollment_id, question_key) do update set value = excluded.value, updated_at = now();
  if p_choice = 'vegan' then
    insert into ve_member_shared_answers (member_id, key, value, survey_slug, updated_at)
    values (p_member, 'journey', '"vegan"'::jsonb, 'course:' || p_program, now())
    on conflict (member_id, key) do update set value = excluded.value, survey_slug = excluded.survey_slug, updated_at = now();
  end if;
  perform course_earn(e.id, pg.days, 'finish');
  return jsonb_build_object('ok', true, 'choice', p_choice);
end $$;

-- 7. what the page reads --------------------------------------------------------------------------------------------
create or replace function course_state(p_member uuid, p_program text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e course_enrollments; pg course_programs;
begin
  select * into pg from course_programs where slug = p_program;
  if not found then return jsonb_build_object('error','program_not_found'); end if;
  select * into e from course_enrollments where program_slug = p_program and member_id = p_member;
  if not found then return jsonb_build_object('program', p_program, 'enrolled', false, 'status', pg.status); end if;
  e := course_refresh(e.id);
  perform course_auto_check(e.id);
  return jsonb_build_object(
    'program', p_program, 'enrolled', true, 'enrollment', e.id, 'status', e.status, 'current_day', e.current_day,
    'next_unlock_at', e.next_unlock_at, 'paused_until', e.paused_until, 'final_choice', e.final_choice,
    'days_shown_up', (select count(*) from course_progress where enrollment_id = e.id and opened_at is not null),
    'points', (select coalesce(sum(points),0) from course_proofs where enrollment_id = e.id),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', p.day, 'unlocked_at', p.unlocked_at, 'opened_at', p.opened_at) order by p.day), '[]') from course_progress p where p.enrollment_id = e.id),
    'proofs', (select coalesce(jsonb_agg(jsonb_build_object('day', x.day, 'key', c.key, 'kind', x.kind, 'status', x.status, 'points', x.points, 'note', x.review_note) order by x.day, c.pos), '[]')
               from course_proofs x join course_challenges c on c.id = x.challenge_id where x.enrollment_id = e.id),
    'unlocks', (select coalesce(jsonb_agg(jsonb_build_object('key', u.key, 'label', cu.label, 'kind', cu.kind, 'at', u.earned_at) order by u.earned_at), '[]')
                from course_member_unlocks u join course_unlocks cu on cu.program_slug = u.program_slug and cu.key = u.key where u.enrollment_id = e.id));
end $$;

-- Badges: the course's badge unlocks join the member's badges (same shape as the Registered badges).
create or replace function ve_member_badges(p_member uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with b(survey, key, badge, q, fmt) as (values
    ('vegan-restaurant-guide', 'restaurant', 'Registered restaurant', 'r_role', '%s'),
    ('vegan-events-guide', 'event_host', 'Registered event host', 'e_role', '%s'),
    ('creator-guide', 'creator', 'Registered creator', 'c_main', 'Creator on %s'),
    ('nonprofit-guide', 'nonprofit', 'Registered nonprofit', 'n_role', '%s')),
  rows as (
    select b.key, b.badge, r.role, c.completed_at as at
    from b
    join ve_survey_completions c on c.member_id = p_member and c.survey_slug = b.survey
    left join lateral (
      select format(b.fmt, o ->> 'label') as role
      from ve_survey_answers a join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
      cross join lateral jsonb_array_elements(q.options) o
      where a.member_id = p_member and a.survey_slug = b.survey and a.question_id = b.q and o ->> 'v' = a.value #>> '{}'
      limit 1) r on true
    union all
    select cu.key, cu.label, null::text, u.earned_at
    from course_member_unlocks u join course_unlocks cu on cu.program_slug = u.program_slug and cu.key = u.key
    join course_programs pg on pg.slug = u.program_slug
    where u.member_id = p_member and cu.kind = 'badge' and pg.brand_slug = 'vegans-explore')
  select coalesce(jsonb_agg(jsonb_build_object('key', key, 'badge', badge, 'role', role, 'at', at) order by at desc), '[]'::jsonb) from rows;
$$;

do $$ declare f text; begin
  foreach f in array array['course_next_unlock(text,int,timestamptz,timestamptz)','course_pay(uuid)','course_earn(uuid,int,text)',
    'course_refresh(uuid)','course_enroll(uuid,text,text)','course_open_day(uuid,text,int)','course_pause(uuid,text,int)',
    'course_auto_check(uuid)','course_proof_submit(uuid,text,int,text,jsonb)','course_proof_review(uuid,uuid,text,text)',
    'course_answer(uuid,text,int,text,jsonb)','course_finish(uuid,text,text)','course_state(uuid,text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- 8. the first program: 111 Days to Going and Staying Vegan ---------------------------------------------------------
insert into course_programs (slug, brand_slug, title, days, status, guide_slug, survey_slug, narrator, settings)
values ('pre-vegan-111', 'vegans-explore', '111 Days to Going and Staying Vegan', 111, 'draft', 'pre-vegan-guide', 'pre-vegan', 'maya',
        '{"points":{"open":5,"tick":5,"scan":10,"save":10,"checkin":15,"photo":25,"voice":25,"reflection":25,"capstone":50},
          "canon":"canon-ve-pre-vegan-guide v1"}'::jsonb)
on conflict (slug) do nothing;

insert into course_phases (program_slug, n, title, first_day, last_day) values
  ('pre-vegan-111',1,'Start here',1,7), ('pre-vegan-111',2,'Breakfast and dairy',8,21), ('pre-vegan-111',3,'Your plate',22,35),
  ('pre-vegan-111',4,'Shopping and the pantry',36,49), ('pre-vegan-111',5,'Eating out and people',50,63),
  ('pre-vegan-111',6,'Cooking confidence',64,77), ('pre-vegan-111',7,'The deeper why',78,91),
  ('pre-vegan-111',8,'Your community',92,104), ('pre-vegan-111',9,'Staying Vegan',105,111)
on conflict do nothing;

-- Days 1 to 7 (the canon's words; Maya's lines are drafts until Sean approves them). Days 8+ arrive in batches.
insert into course_days (program_slug, day, phase_n, title, body, free, capstone, ready) values
  ('pre-vegan-111',1,1,'Why you''re here', jsonb_build_object('guide_line','You don''t have to be perfect to start. You just have to start. For the next 111 days I''ll bring you one thing a day. Today''s is the easiest: tell me why.','do','Write your why in one sentence. It stays private, and I''ll show it back to you on Day 111.'), true, false, true),
  ('pre-vegan-111',2,1,'One swap, your milk', jsonb_build_object('guide_line','Most people''s first win is in their coffee. Pick a plant milk today, just one, and live with it for a week.','learn','Oat, soy, almond and pea compared (the Dairy Guide).','do','A photo of your new milk in your fridge or your cup.'), false, false, true),
  ('pre-vegan-111',3,1,'Find your places', jsonb_build_object('guide_line','Vegan food is closer than you think. Let''s find yours.','learn','Near me, the Directory, and what 100% Vegan, Plant-based and Pre-Vegan options mean.','do','Save 3 places near you.'), false, false, true),
  ('pre-vegan-111',4,1,'Read the label', jsonb_build_object('guide_line','Five words do most of the hiding: whey, casein, gelatin, carmine and honey. Learn those and the aisle opens up.','do','Scan 3 things. Bonus: a photo of yourself at the supermarket.'), false, false, true),
  ('pre-vegan-111',5,1,'Your first meal out', jsonb_build_object('guide_line','Today, let someone else cook. Pick a 100% Vegan place you saved and go.','do','Check in there. A photo of your meal is optional.'), false, false, true),
  ('pre-vegan-111',6,1,'Hear it from someone who''s been there', jsonb_build_object('guide_line','Five minutes, one story. This is someone who sat where you''re sitting.','learn','One moment from our shows about starting out.','do','Listen, then write one line on what stuck.'), false, false, true),
  ('pre-vegan-111',7,1,'Say it out loud', jsonb_build_object('guide_line','Week one, done. The hardest part of going Vegan is often the first time you tell someone. Tell one person you''re Pre-Vegan.','learn','Three ways to say it without a lecture.','do','A 20-second voice note on how it went, or a photo with them.'), false, true, true)
on conflict do nothing;
-- every phase's last day is a capstone (rows for Days 8+ are written with the batches; the flag is set there)

insert into course_challenges (program_slug, day, key, label, kind, review, source, target, points, optional, accepts, pos) values
  ('pre-vegan-111',1,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',1,'why','Write your why','tick','auto','course',1,5,false,'{text}',1),
  ('pre-vegan-111',2,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',2,'milk_photo','Your new milk','photo','person','course',1,25,false,'{photo}',1),
  ('pre-vegan-111',3,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',3,'save3','Save 3 places','save','auto','listing_saves',3,10,false,'{}',1),
  ('pre-vegan-111',4,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',4,'scan3','Scan 3 things','scan','auto','product_scans',3,10,false,'{}',1),
  ('pre-vegan-111',4,'aisle_photo','You at the supermarket','photo','person','course',1,25,true,'{photo}',2),
  ('pre-vegan-111',5,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',5,'checkin','Check in','checkin','auto','checkins',1,15,false,'{}',1),
  ('pre-vegan-111',5,'meal_photo','Your meal (sent from the check-in)','photo','person','checkin_action',1,10,true,'{photo}',2),
  ('pre-vegan-111',6,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',6,'what_stuck','One line on what stuck','reflection','person','course',1,25,false,'{text}',1),
  ('pre-vegan-111',7,'open','Open today','open','auto','course',1,5,false,'{}',0),
  ('pre-vegan-111',7,'say_it','Tell one person','capstone','person','course',1,50,false,'{voice,photo}',1)
on conflict do nothing;

insert into course_unlocks (program_slug, day, key, label, kind, earn_on) values
  ('pre-vegan-111',7,'pre-vegan-badge','Pre-Vegan','badge','approved'),
  ('pre-vegan-111',7,'phase-2','Phase 2: Breakfast and dairy','phase','approved'),
  ('pre-vegan-111',14,'swap-library','The full Swap Library','feature','open'),
  ('pre-vegan-111',21,'starter-shelf','Maya''s Starter Shelf','feature','open'),
  ('pre-vegan-111',35,'plate-builder','The plate builder','feature','open'),
  ('pre-vegan-111',49,'shopping-lists','Shopping list templates','feature','open'),
  ('pre-vegan-111',63,'eating-out-kit','The Eating Out kit','feature','open'),
  ('pre-vegan-111',77,'meal-plans','Five meal plans','feature','open'),
  ('pre-vegan-111',104,'path-card','Your chapter''s Founder or Ambassador path','feature','open'),
  ('pre-vegan-111',111,'library','The Library of all 111','feature','open'),
  ('pre-vegan-111',111,'111-days-badge','111 Days','badge','finish')
on conflict do nothing;

-- The question map (course data, not code): one Build your profile question about every 5 days, on the day it fits,
-- plus their why (Day 1), what is hardest (each capstone) and the Day 111 choice. Logan's draft map, Sean's to change.
insert into course_questions (program_slug, day, question_key, source, prompt, options) values
  ('pre-vegan-111',1,'why','course','In one sentence: why are you here?',null),
  ('pre-vegan-111',5,'q13_eatout_freq','profile',null,null),
  ('pre-vegan-111',10,'q24_diet','profile',null,null),
  ('pre-vegan-111',15,'p_meal','profile',null,null),
  ('pre-vegan-111',20,'q9_challenges','profile',null,null),
  ('pre-vegan-111',25,'q10_options_rating','profile',null,null),
  ('pre-vegan-111',30,'q22_goal','profile',null,null),
  ('pre-vegan-111',35,'q25_household','profile',null,null),
  ('pre-vegan-111',40,'q14_spend','profile',null,null),
  ('pre-vegan-111',45,'q11_missing','profile',null,null),
  ('pre-vegan-111',50,'q15_local_spots','profile',null,null),
  ('pre-vegan-111',55,'q12_business_types','profile',null,null),
  ('pre-vegan-111',60,'q17_connect','profile',null,null),
  ('pre-vegan-111',65,'p_day','profile',null,null),
  ('pre-vegan-111',70,'q16_wants','profile',null,null),
  ('pre-vegan-111',75,'p_fact','profile',null,null),
  ('pre-vegan-111',80,'q8_drivers','profile',null,null),
  ('pre-vegan-111',85,'q23_matters','profile',null,null),
  ('pre-vegan-111',90,'p_why','profile',null,null),
  ('pre-vegan-111',95,'q18_events','profile',null,null),
  ('pre-vegan-111',100,'q20_contribute','profile',null,null),
  ('pre-vegan-111',105,'p_meet','profile',null,null),
  ('pre-vegan-111',110,'q21_open','profile',null,null),
  ('pre-vegan-111',7,'hardest_p1','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',21,'hardest_p2','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',35,'hardest_p3','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',49,'hardest_p4','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',63,'hardest_p5','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',77,'hardest_p6','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',91,'hardest_p7','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',104,'hardest_p8','course','What is the hardest part for you right now?',null),
  ('pre-vegan-111',111,'final_choice','course','Where are you today?','[{"v":"vegan","label":"I''m Vegan"},{"v":"prevegan","label":"Still Pre-Vegan, still going"}]'::jsonb)
on conflict do nothing;
