-- Earn your Passport, part 4: the three challenges (Sean, 2026-11-01, canon canon-ve-earn-your-passport; playbook
-- ve-pricing-points-passport). Support Local, The Connector and The Advocate: pick 1 to 3, Start, 30 days, one restart; every
-- task is proven and approved by the team before it counts; each challenge is worth 1,100 points. The first one finished pays the
-- Passport (the account becomes a member, Founding before the deadline); every one after adds 1,100 points; all three is the
-- Trailblazer badge. Start makes the sign-in account for a Taster whose email is confirmed (ve-challenge). Safe to run twice.
--
-- Logan's defaults, Sean's to change:
--   * Who: anyone who is not a paying member: a Taster (their account is made at Start), an account that never paid, and a member
--     whose membership came from a challenge (to finish the other two). A member who paid the $11 does not take them.
--   * A restart is one more 30 days from the day it is pressed, after the first 30 run out; what was already approved is kept.
--   * Support Local counts a food place (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep, Markets) with
--     How Vegan set (100% Vegan, Vegan, Vegan options, Vegan friendly). A check-in counts once
--     the team approves at least one thing from its check-in menu (Depot > Check-ins), and at least one approved receipt overall.
--     In a month when their chapter has Passport Challenge stops live, only that month's stops count.
--   * The Connector counts friends who signed up with their link and paid to join during the challenge; a friend who earned their
--     membership does not count.
--   * The Advocate: a free event (a photo there, or a guest pass checked in at the door), a sanctuary or rescue (a photo, their
--     phone's distance kept when they share it), and a Fosters or Rescues post shared (the link to where they shared it).
--   * A challenger's check-ins and check-in menu pay no points while they are not a member; the challenge's 1,100 is the reward.

alter table public.ve_tasters add column if not exists account_id uuid references public.members(id) on delete set null;
alter table public.members add column if not exists trailblazer_at timestamptz;

create table if not exists public.ve_challenges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  taster_id uuid references public.ve_tasters(id) on delete set null,
  kind text not null check (kind in ('support_local', 'connector', 'advocate')),
  status text not null default 'active' check (status in ('active', 'done', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '30 days',
  restarts integer not null default 0 check (restarts between 0 and 1),
  restarted_at timestamptz,
  completed_at timestamptz,
  points_paid integer not null default 0,
  made_member boolean not null default false,
  created_at timestamptz not null default now(),
  unique (member_id, kind)
);
create index if not exists ve_challenges_status on public.ve_challenges (status, ends_at);
alter table public.ve_challenges enable row level security;

create table if not exists public.ve_challenge_proofs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.ve_challenges(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  task text not null check (task in ('event', 'animals', 'share')),
  photo_path text,
  url text,
  note text,
  listing_id uuid references public.listings(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  post_id uuid references public.ve_board_posts(id) on delete set null,
  distance_m integer,
  accuracy_m integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_challenge_proofs_status on public.ve_challenge_proofs (status, created_at);
create index if not exists ve_challenge_proofs_challenge on public.ve_challenge_proofs (challenge_id, task, status);
alter table public.ve_challenge_proofs enable row level security;

insert into storage.buckets (id, name, public) values ('challenge-proofs', 'challenge-proofs', false) on conflict (id) do nothing;

insert into public.ve_site_settings (key, value)
values ('challenges', jsonb_build_object('points', 1100, 'days', 30, 'support_local_places', 3, 'connector_friends', 3))
on conflict (key) do nothing;

-- The ledger takes the challenge's points and the Passport they pay for.
alter table points_ledger drop constraint if exists points_ledger_reason_check;
alter table points_ledger add constraint points_ledger_reason_check CHECK ((reason = ANY (ARRAY['signup'::text, 'referral'::text, 'daily_login'::text, 'listing_like'::text, 'listing_create'::text, 'discussion_post'::text, 'discussion_reply'::text, 'discussion_vote'::text, 'event_attend'::text, 'profile_complete'::text, 'profile_field'::text, 'admin_adjust'::text, 'purchase'::text, 'redemption'::text, 'vote_given'::text, 'vote_received'::text, 'vote_refunded'::text, 'featured_purchase'::text, 'transfer_sent'::text, 'transfer_received'::text, 'store_purchase'::text, 'store_refund'::text, 'points_purchase'::text, 'bartering'::text, 'boost_purchase'::text, 'seed_initial'::text, 'Welcome bonus + early activity'::text, 'campaign_back'::text, 'questionnaire'::text, 'wizard_redeem'::text, 've_hunt_complete'::text, 've_hunt_anchor'::text, 'guide_redeem'::text, 'cycle_grant'::text, 'bounty'::text, 'comp_membership'::text, 'recipe_approved'::text, 'guide_chat_spend'::text, 'credit_exchange'::text, 'checkin'::text, 'welcome'::text, 'purchase_thanks'::text, 'points_contribution'::text, 'listing_submit'::text, 'profile_answer'::text, 'partner_optin'::text, 'venue_report'::text, 'nonprofit_survey'::text, 'barcode_add'::text, 'challenge'::text, 'challenge_passport'::text]))) NOT VALID;

-- Is this account a challenger: not a paying member (never paid, or a member only through a challenge)?
create or replace function public.ve_challenger_ok(p_member uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $$
  select exists (select 1 from members m where m.id = p_member and coalesce(m.member_class, 'member') <> 'agent'
    and (m.membership_status is distinct from 'active'
         or exists (select 1 from ve_challenges c where c.member_id = m.id and c.made_member)));
$$;

-- One Advocate task's state: approved, pending, declined (the latest was turned down) or open.
create or replace function public.ve_challenge_task_state(p_challenge uuid, p_task text)
 returns text language sql stable security definer set search_path to 'public'
as $$
  select case
    when exists (select 1 from ve_challenge_proofs where challenge_id = p_challenge and task = p_task and status = 'approved') then 'approved'
    when exists (select 1 from ve_challenge_proofs where challenge_id = p_challenge and task = p_task and status = 'pending') then 'pending'
    when exists (select 1 from ve_challenge_proofs where challenge_id = p_challenge and task = p_task and status = 'declined') then 'declined'
    else 'open' end;
$$;

-- Where a challenge stands. Returns {kind, met, have, need, items[]}.
create or replace function public.ve_challenge_progress(p_id uuid)
 returns jsonb language plpgsql stable security definer set search_path to 'public'
as $function$
declare c ve_challenges; s jsonb; v_chapter text; v_email text; items jsonb; have int; need int; receipt boolean; pend int;
  t_event text; t_animals text; t_share text;
begin
  select * into c from ve_challenges where id = p_id;
  if c.id is null then return null; end if;
  select value into s from ve_site_settings where key = 'challenges';
  select coalesce(m.home_community, (select t.chapter from ve_tasters t where t.account_id = m.id limit 1)), m.email into v_chapter, v_email
  from members m where m.id = c.member_id;

  if c.kind = 'support_local' then
    need := coalesce((s->>'support_local_places')::int, 3);
    with q as (
      select k.id, k.listing_id, k.created_at, l.name, l.slug,
        exists (select 1 from ve_checkin_actions a where a.checkin_id = k.id and a.status = 'approved') ok,
        exists (select 1 from ve_checkin_actions a where a.checkin_id = k.id and a.status = 'pending') waiting,
        exists (select 1 from ve_checkin_actions a where a.checkin_id = k.id and a.kind = 'receipt' and a.status = 'approved') rcpt
      from ve_checkins k join listings l on l.id = k.listing_id
      where k.member_id = c.member_id and k.created_at between c.started_at and c.ends_at and l.vegan_status is not null
        and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Food Trucks & Vendors', 'Catering', 'Meal Prep', 'Markets')
        and (not exists (select 1 from ve_pc_slots p where p.chapter = v_chapter and p.status = 'approved' and p.month = date_trunc('month', k.local_day)::date)
             or exists (select 1 from ve_pc_slots p where p.chapter = v_chapter and p.status = 'approved' and p.month = date_trunc('month', k.local_day)::date and p.listing_id = k.listing_id))
    ), per as (
      select listing_id, max(name) as name, max(slug) as slug, max(created_at) as at, bool_or(ok) ok, bool_or(waiting) waiting, bool_or(rcpt) rcpt from q group by listing_id
    )
    select count(*) filter (where ok), coalesce(bool_or(rcpt), false), count(*) filter (where not ok and waiting),
      coalesce(jsonb_agg(jsonb_build_object('name', name, 'slug', slug, 'at', at, 'state', case when ok then 'approved' when waiting then 'pending' else 'needs_menu' end, 'receipt', rcpt) order by at), '[]'::jsonb)
    into have, receipt, pend, items from per;
    return jsonb_build_object('kind', c.kind, 'have', have, 'need', need, 'receipt', receipt, 'pending', pend, 'items', items,
      'stops_month', exists (select 1 from ve_pc_slots p where p.chapter = v_chapter and p.status = 'approved' and p.month = date_trunc('month', (now() at time zone 'America/New_York'))::date),
      'met', have >= need and receipt);
  end if;

  if c.kind = 'connector' then
    need := coalesce((s->>'connector_friends')::int, 3);
    select count(*), coalesce(jsonb_agg(jsonb_build_object('name', split_part(coalesce(f.name, 'A friend'), ' ', 1), 'at', f.entry_paid_at) order by f.entry_paid_at), '[]'::jsonb)
    into have, items from members f
    where f.referred_by = c.member_id and f.membership_status = 'active' and f.entry_paid_at between c.started_at and c.ends_at
      and not exists (select 1 from ve_challenges x where x.member_id = f.id and x.made_member);
    select count(*) into pend from members f where f.referred_by = c.member_id and f.membership_status is distinct from 'active' and f.created_at >= c.started_at;
    return jsonb_build_object('kind', c.kind, 'have', have, 'need', need, 'pending', pend, 'items', items, 'met', have >= need);
  end if;

  -- advocate
  t_event := ve_challenge_task_state(c.id, 'event');
  if t_event <> 'approved' and exists (select 1 from ve_guest_passes g where lower(g.email) = lower(v_email)
       and g.checked_in_at between c.started_at and c.ends_at) then t_event := 'approved'; end if;
  t_animals := ve_challenge_task_state(c.id, 'animals');
  t_share := ve_challenge_task_state(c.id, 'share');
  have := (t_event = 'approved')::int + (t_animals = 'approved')::int + (t_share = 'approved')::int;
  return jsonb_build_object('kind', c.kind, 'have', have, 'need', 3, 'tasks', jsonb_build_object('event', t_event, 'animals', t_animals, 'share', t_share), 'met', have >= 3);
end $function$;

-- Finish a challenge whose tasks are met, or close one whose 30 days ran out. Once only (ve_points_grant refs).
create or replace function public.ve_challenge_settle(p_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare c ve_challenges; p jsonb; pts int; m members; admitted boolean := false; n_done int;
begin
  select * into c from ve_challenges where id = p_id for update;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if c.status <> 'active' then return jsonb_build_object('status', c.status); end if;
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

create or replace function public.ve_challenge_sweep()
 returns integer language plpgsql security definer set search_path to 'public'
as $$
declare r record; n int := 0;
begin
  for r in select id from ve_challenges where status = 'active' loop
    if (ve_challenge_settle(r.id)->>'status') <> 'active' then n := n + 1; end if;
  end loop;
  return n;
end $$;

revoke all on function public.ve_challenge_progress(uuid) from public, anon, authenticated;
revoke all on function public.ve_challenge_settle(uuid) from public, anon, authenticated;
revoke all on function public.ve_challenge_sweep() from public, anon, authenticated;
revoke all on function public.ve_challenger_ok(uuid) from public, anon, authenticated;
revoke all on function public.ve_challenge_task_state(uuid, text) from public, anon, authenticated;

-- Check-ins for challengers pay nothing (p_pay false); members' check-ins unchanged.
drop function if exists public.ve_checkin_save(uuid, uuid, numeric, numeric, numeric);
create or replace function public.ve_checkin_save(p_member uuid, p_listing uuid, p_lat numeric, p_lng numeric, p_accuracy numeric, p_pay boolean default true)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare l listings%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0); today date := (now() at time zone 'America/New_York')::date;
  paid_today int; pts int; cid uuid; w jsonb; own boolean;
begin
  select * into l from listings where id = p_listing and status = 'approved';
  if not found or coalesce(l.business_status, '') = 'CLOSED_PERMANENTLY' then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if l.latitude is null or l.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - l.latitude) / 2), 2)
       + cos(radians(l.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - l.longitude) / 2), 2)));
  if d > 150 + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  if exists (select 1 from ve_checkins where member_id = p_member and listing_id = l.id and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  own := coalesce(p_member = l.owner_member_id, false) or coalesce(p_member = l.claimed_by_member_id, false);
  select count(*) into paid_today from ve_checkins where member_id = p_member and local_day = today and points > 0;
  pts := case when own or not p_pay then 0 when paid_today < 5 then 10 else 0 end;
  insert into ve_checkins (member_id, listing_id, local_day, lat, lng, accuracy_m, distance_m, points)
  values (p_member, l.id, today, round(p_lat, 5), round(p_lng, 5), round(acc), round(d), pts) returning id into cid;
  if pts > 0 then
    insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, pts, 'checkin', 'checkin:' || cid);
    update members set lesars_balance = coalesce(lesars_balance, 0) + pts where id = p_member;
    select apply_member_points_delta(p_member, pts) into w;
  end if;
  return jsonb_build_object('ok', true, 'checkin_id', cid, 'points', pts, 'own_place', own, 'distance_m', round(d),
    'paid_today', paid_today + (pts > 0)::int, 'daily_paid_cap', 5);
end $function$;
revoke all on function public.ve_checkin_save(uuid, uuid, numeric, numeric, numeric, boolean) from public, anon, authenticated;

-- Every 15 minutes: finish what is met (friends paying, check-in menus approved elsewhere) and close what ran out.
select cron.unschedule('ve-challenge-sweep') where exists (select 1 from cron.job where jobname = 've-challenge-sweep');
select cron.schedule('ve-challenge-sweep', '*/15 * * * *', $$select public.ve_challenge_sweep()$$);
