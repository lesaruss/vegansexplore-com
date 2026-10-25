-- Member check-ins (Sean, 2026-10-25): "making a way that members can verify listings... If they go to a restaurant and can
-- verify it's there, they can check in... every time they check in, they can get like 10 points... We can see a record of how
-- many people are actually visiting, which members are visiting. And that way, if a business wants to run a campaign with us,
-- we can target those people first... we build that into a bounty, an ongoing bounty that stays there that people can claim."
--
-- A member taps Check in on a listing's page while there; the phone's location must put them at the place (within 150 m,
-- plus up to 100 m of the phone's own uncertainty; a fix less sure than 500 m is refused). Once per place per day (Eastern),
-- 10 points each for up to 5 places a day (more are still recorded, at 0 points). Points move both balances (points_ledger
-- reason checkin, members.lesars_balance, apply_member_points_delta). The public sees counts only; the team sees who.
-- A check-in in the last 30 days tells Directory review the place is open: it is never held automatically.
-- Coordinates come from Google (ve-restaurant-audit essentials fills latitude and longitude from the place).

create table if not exists public.ve_checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  listing_id uuid not null references public.listings(id),
  local_day date not null,
  lat numeric, lng numeric, accuracy_m int, distance_m int,
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (member_id, listing_id, local_day)
);
create index if not exists ve_checkins_listing on public.ve_checkins (listing_id, created_at desc);
create index if not exists ve_checkins_member on public.ve_checkins (member_id, created_at desc);
alter table public.ve_checkins enable row level security;

create or replace function public.ve_checkin_save(p_member uuid, p_listing uuid, p_lat numeric, p_lng numeric, p_accuracy numeric)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare l listings%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0); today date := (now() at time zone 'America/New_York')::date;
  paid_today int; pts int; cid uuid; w jsonb;
begin
  select * into l from listings where id = p_listing and status = 'approved';
  if not found or coalesce(l.business_status, '') = 'CLOSED_PERMANENTLY' then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if l.latitude is null or l.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  -- Great-circle distance in meters.
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - l.latitude) / 2), 2)
       + cos(radians(l.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - l.longitude) / 2), 2)));
  if d > 150 + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  if exists (select 1 from ve_checkins where member_id = p_member and listing_id = l.id and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  select count(*) into paid_today from ve_checkins where member_id = p_member and local_day = today and points > 0;
  pts := case when paid_today < 5 then 10 else 0 end;
  insert into ve_checkins (member_id, listing_id, local_day, lat, lng, accuracy_m, distance_m, points)
  values (p_member, l.id, today, round(p_lat, 5), round(p_lng, 5), round(acc), round(d), pts) returning id into cid;
  if pts > 0 then
    insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, pts, 'checkin', 'checkin:' || cid);
    update members set lesars_balance = coalesce(lesars_balance, 0) + pts where id = p_member;
    select apply_member_points_delta(p_member, pts) into w;
  end if;
  return jsonb_build_object('ok', true, 'points', pts, 'distance_m', round(d), 'paid_today', paid_today + (pts > 0)::int, 'daily_paid_cap', 5);
end $$;
revoke all on function public.ve_checkin_save(uuid, uuid, numeric, numeric, numeric) from public, anon, authenticated;

-- What anyone may see about a place: how many check-ins and when the latest was (never who).
create or replace function public.ve_listing_checkins(p_listing uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('total', count(*), 'last_30_days', count(*) filter (where created_at > now() - interval '30 days'),
    'people_30_days', count(distinct member_id) filter (where created_at > now() - interval '30 days'), 'last_at', max(created_at))
  from ve_checkins where listing_id = p_listing;
$$;
revoke all on function public.ve_listing_checkins(uuid) from public, anon, authenticated;

-- Coordinates: the essentials pass now also fills latitude and longitude from the Google place, so places without them are due.
create or replace function public.ve_listing_essentials_due(p_limit int default 15)
returns table (id uuid, slug text, name text, address_street text, address_city text, address_state text, google_place_id text,
  website text, need_hours boolean, need_street boolean, need_socials boolean)
language sql stable security definer set search_path to 'public' as $$
  select e.id, e.slug, e.name, l.address_street, e.address_city, e.address_state, e.google_place_id, e.website,
    not e.has_hours, not e.has_address, not e.has_socials
  from ve_restaurant_essentials e
  join listings l on l.id = e.id
  left join ve_listing_essentials q on q.listing_id = e.id
  where (not e.has_hours or not e.has_address or not e.has_socials or e.google_place_id is null or l.latitude is null)
    and (q.google_checked_at is null or q.google_checked_at < now() - interval '30 days')
  order by q.google_checked_at nulls first, l.vote_count desc nulls last
  limit greatest(1, least(p_limit, 40));
$$;
update public.ve_listing_essentials q set google_checked_at = null
  from public.listings l where l.id = q.listing_id and l.latitude is null and l.google_place_id is not null;

-- Directory review: a member's check-in in the last 30 days means the place is open, so it is never held automatically.
create or replace function public.ve_directory_review_flags()
returns table (listing_id uuid, slug text, name text, category text, city text, state text, community_slug text, logo_url text,
  website text, instagram text, flags text[], strong boolean, audit_id uuid, google_maps text)
language sql stable security definer set search_path to 'public' as $$
  with base as (
    select l.*, a.id aid, a.closure_level, a.facts, fr.decision,
      (select max(c.created_at) from ve_checkins c where c.listing_id = l.id) last_checkin,
      coalesce(a.facts->'google'->>'status', case when q.google_note like 'Google says CLOSED_PERMANENTLY%' then 'CLOSED_PERMANENTLY' end) gstatus,
      (select oc.community_slug from ve_outreach_cities oc where oc.kind = 'city' and oc.community_slug <> 'brands'
         and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states)) limit 1) hub
    from listings l
    left join lateral (select * from ve_audits a where a.listing_id = l.id and a.status = 'done' order by a.created_at desc limit 1) a on true
    left join ve_audit_flag_reviews fr on fr.audit_id = a.id
    left join ve_listing_essentials q on q.listing_id = l.id
    where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
      and (ve_audit_local_category(l.category) or l.category = 'Food Trucks & Vendors')
      and coalesce(l.address_city, '') <> '' and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
      and coalesce((l.details->>'review_ok_until')::date, '2000-01-01') < current_date
  ), f as (
    select b.*, array_remove(array[
      case when b.gstatus = 'CLOSED_PERMANENTLY' then 'Google says it is permanently closed'
           when b.gstatus = 'CLOSED_TEMPORARILY' then 'Google says it is temporarily closed' end,
      case when b.closure_level in ('closed', 'quiet') and b.decision is null then 'The monthly check-up flagged it as ' || case b.closure_level when 'closed' then 'closed' else 'gone quiet' end end,
      case when coalesce(b.instagram, '') = '' and coalesce(b.facebook, '') = '' and coalesce(b.tiktok, '') = '' then 'No socials' end,
      case when coalesce(nullif(b.google_hours_json::text, ''), 'null') in ('null', '{}', '[]', '""') then 'No hours' end,
      case when coalesce(b.address_street, '') = '' then 'No street address' end,
      case when coalesce(b.website, '') = '' then 'No website'
           -- A site that only turns away our scanner (401, 403, 406, 429, 503) is not down (the audit's lesson, 2026-10-10).
           when b.facts->'website'->>'error' is not null and b.facts->'website'->>'error' !~ '^(status (401|403|406|429|503)|no website)$' then 'The website did not open' end
    ], null) fl
    from base b
  )
  select f.id, f.slug, f.name, f.category, f.address_city, f.address_state, f.hub, f.logo_url, f.website, f.instagram, f.fl,
    (f.gstatus = 'CLOSED_PERMANENTLY' or (f.closure_level in ('closed', 'quiet') and f.decision is null)
      or ('No socials' = any(f.fl) and ('No hours' = any(f.fl) or 'The website did not open' = any(f.fl) or 'No website' = any(f.fl))))
      -- A member checked in within 30 days: it is open, whatever else looks quiet.
      and coalesce(f.last_checkin < now() - interval '30 days', true) strong,
    f.aid, f.facts->'google'->>'maps'
  from f where cardinality(f.fl) > 0
  order by 12 desc, cardinality(f.fl) desc, f.name;
$$;
revoke all on function public.ve_directory_review_flags() from public, anon, authenticated;

-- The points ledger takes a fixed list of reasons; check-ins are one now (found by a rolled-back test of ve_checkin_save).
alter table public.points_ledger drop constraint points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral', 'daily_login', 'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend', 'profile_complete', 'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded', 'featured_purchase', 'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering', 'boost_purchase', 'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem', 've_hunt_complete', 've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved', 'guide_chat_spend', 'credit_exchange', 'checkin']::text[])) not valid;

-- Who sees a check-in (Sean, 2026-10-25: "Only registered member businesses who've claimed their listings can see that
-- information... You can choose whether or not in your settings, whether you want people to see where you've checked in. So
-- we can leave it on by default"). The public sees counts only; members see the names of members who leave this on; the
-- owner of a claimed listing (ve-claims owner_dashboard checkins) and the team see everyone.
alter table public.members add column if not exists show_checkins boolean not null default true;
