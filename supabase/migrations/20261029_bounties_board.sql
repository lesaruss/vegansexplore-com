-- The bounties board (Sean, 2026-10-29: "update the bounty section. Right now it's showing some bounties for some old events. I
-- want it to be a little bit more simplified... you can search, it's filterable... evergreen bounties would be checking in at your
-- favorite restaurant... volunteer opportunities, so you'd have to check in with the volunteers, with different nonprofits
-- organizations... checking out restaurants that we're not sure if they're open or not... attend an event on our behalf... those
-- might actually come with a paid stipend, but you might have to be level 2 in order to be eligible").
--
-- 1. Paid jobs: ve_bounties.min_level (1 to 4, null = anyone). ve_bounty_claim refuses a member below it ('level'). The stipend
--    is the existing cash_cents.
-- 2. Two evergreen bounties, one row per visit in ve_field_reports, both location-checked like a check-in and reviewed by the team
--    in Depot > Bounties > Field reports; nothing pays until accepted (ve_points_grant, reason bounty, ref field:<id>):
--    volunteer   at a Nonprofits, Rescues or Sanctuaries listing: the hours, an optional photo. 25 points an hour, up to 8 hours a
--                visit, 10 more with a photo.
--    still_open  at a listing we flagged as maybe closed (the monthly check-up's open flag, or Directory review's strong flags):
--                Open or Closed, with a photo (required). The first accepted answer pays 100, later accepted ones 20. An accepted
--                Open marks the flag still open for 90 days; an accepted Closed holds the listing for Directory review.
--    Amounts are Logan's defaults, Sean's to change in ve_site_settings 'evergreen_bounties'.
-- Photos go to the private ve-bounty-uploads bucket under field/<member>/.

alter table public.ve_bounties add column if not exists min_level int;
alter table public.ve_bounties drop constraint if exists ve_bounties_min_level_check;
alter table public.ve_bounties add constraint ve_bounties_min_level_check check (min_level is null or min_level between 1 and 4);

create or replace function public.ve_bounty_claim(p_bounty uuid, p_member uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare b ve_bounties; s ve_bounty_submissions; taken int; mine int; standing jsonb; lvl int;
begin
  select * into b from ve_bounties where id = p_bounty for update;
  if b.id is null or b.status = 'draft' then return jsonb_build_object('error', 'not_found'); end if;
  if b.status <> 'open' or (b.claims_close_at is not null and now() >= b.claims_close_at) then
    return jsonb_build_object('error', 'claims_closed');
  end if;
  select * into s from ve_bounty_submissions where bounty_id = b.id and member_id = p_member;
  if s.id is not null and s.status <> 'released' then return jsonb_build_object('error', 'already_claimed'); end if;
  -- A paid job can ask for a level (Sean, 2026-10-29: "you might have to be level 2 in order to be eligible").
  if coalesce(b.min_level, 1) > 1 then
    lvl := coalesce((ve_member_level(p_member)->>'level')::int, 1);
    if lvl < b.min_level then return jsonb_build_object('error', 'level', 'min_level', b.min_level, 'level', lvl); end if;
  end if;
  standing := ve_bounty_standing(p_member);
  if not (standing->>'ok')::boolean then return jsonb_build_object('error', 'not_eligible', 'standing', standing); end if;
  if b.slots is not null then
    select count(*) into taken from ve_bounty_submissions where bounty_id = b.id and status <> 'released';
    if taken >= b.slots then return jsonb_build_object('error', 'full'); end if;
  end if;
  select count(*) into mine from ve_bounty_submissions x join ve_bounties y on y.id = x.bounty_id
  where x.member_id = p_member and x.status <> 'released' and y.id <> b.id
    and coalesce(y.event_id::text, y.event_title, y.id::text) = coalesce(b.event_id::text, b.event_title, b.id::text);
  if mine >= 2 then return jsonb_build_object('error', 'event_limit'); end if;
  if s.id is null then
    insert into ve_bounty_submissions (bounty_id, member_id, status, claimed_at) values (b.id, p_member, 'claimed', now()) returning * into s;
  else
    update ve_bounty_submissions set status = 'claimed', claimed_at = now(), released_at = null, files = '[]'::jsonb, links = '{}', note = null, updated_at = now()
    where id = s.id returning * into s;
    delete from ve_bounty_notices where submission_id = s.id;
  end if;
  return jsonb_build_object('ok', true, 'submission_id', s.id);
end $function$;
revoke all on function public.ve_bounty_claim(uuid, uuid) from public, anon, authenticated;

insert into public.ve_site_settings (key, value) values ('evergreen_bounties', '{
  "volunteer_per_hour": 25, "volunteer_max_hours": 8, "volunteer_photo_bonus": 10, "volunteer_radius_m": 300,
  "still_open_first": 100, "still_open_after": 20, "still_open_radius_m": 150, "daily_reports": 10}'::jsonb)
on conflict (key) do nothing;

create or replace function public.ve_evergreen_setting(p_key text, p_default int) returns int
language sql stable security definer set search_path to 'public' as $$
  select coalesce((select (value->>p_key)::int from ve_site_settings where key = 'evergreen_bounties'), p_default)
$$;

create table if not exists public.ve_field_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('volunteer', 'still_open')),
  member_id uuid not null references public.members(id),
  listing_id uuid not null references public.listings(id),
  local_day date not null,
  hours numeric,
  answer text check (answer is null or answer in ('open', 'closed')),
  note text,
  photo_path text,
  lat numeric, lng numeric, accuracy_m int, distance_m int,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  points int not null default 0,
  first boolean not null default false,
  review_note text, reviewed_by uuid references public.members(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_field_reports_status on public.ve_field_reports (status, created_at);
create index if not exists ve_field_reports_member on public.ve_field_reports (member_id, created_at desc);
create index if not exists ve_field_reports_listing on public.ve_field_reports (listing_id, kind, status);
alter table public.ve_field_reports enable row level security;

-- Places we are not sure are open: an open monthly check-up flag, or a strong Directory review flag, with a map pin, still on the
-- Directory, and no accepted answer from a member in the last 90 days.
create or replace function public.ve_still_open_places(p_hub text default null)
returns table (listing_id uuid, slug text, name text, category text, city text, state text, hub text, logo_url text, reasons text[], answered int)
language sql stable security definer set search_path to 'public' as $$
  with f as (
    select o.listing_id, o.closure_signals as reasons from ve_audit_open_flags() o
    union all
    select r.listing_id, r.flags from ve_directory_review_flags() r where r.strong
  ), g as (
    select f.listing_id, array_agg(distinct x) filter (where x is not null) reasons
    from f left join lateral unnest(f.reasons) x on true group by f.listing_id
  )
  select l.id, l.slug, l.name, l.category, l.address_city, l.address_state, ve_chapter_of(l.address_city, l.address_state), l.logo_url,
    coalesce(g.reasons, '{}'), (select count(*)::int from ve_field_reports r where r.listing_id = l.id and r.kind = 'still_open' and r.status = 'pending')
  from g join listings l on l.id = g.listing_id
  where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY' and l.latitude is not null
    and not exists (select 1 from ve_field_reports r where r.listing_id = l.id and r.kind = 'still_open' and r.status = 'accepted'
      and r.reviewed_at > now() - interval '90 days')
    and (p_hub is null or p_hub = 'all' or ve_chapter_of(l.address_city, l.address_state) = p_hub)
  order by l.name
$$;
revoke all on function public.ve_still_open_places(text) from public, anon, authenticated;

create or replace function public.ve_field_report_save(p_member uuid, p_kind text, p_listing uuid, p_lat numeric, p_lng numeric,
  p_accuracy numeric, p_hours numeric, p_answer text, p_note text, p_photo text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare l listings%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0); today date := (now() at time zone 'America/New_York')::date;
  n int; rid uuid; radius int;
begin
  if p_kind not in ('volunteer', 'still_open') then return jsonb_build_object('ok', false, 'why', 'bad_kind'); end if;
  select * into l from listings where id = p_listing and status = 'approved';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'volunteer' then
    if l.category not in ('Nonprofits', 'Rescues', 'Sanctuaries') then return jsonb_build_object('ok', false, 'why', 'not_an_organization'); end if;
    if p_hours is null or p_hours < 0.5 or p_hours > 12 then return jsonb_build_object('ok', false, 'why', 'hours'); end if;
    radius := ve_evergreen_setting('volunteer_radius_m', 300);
  else
    if not exists (select 1 from ve_still_open_places(null) s where s.listing_id = l.id) then return jsonb_build_object('ok', false, 'why', 'not_flagged'); end if;
    if p_answer not in ('open', 'closed') then return jsonb_build_object('ok', false, 'why', 'answer'); end if;
    if coalesce(p_photo, '') = '' then return jsonb_build_object('ok', false, 'why', 'photo_required'); end if;
    if exists (select 1 from ve_field_reports where member_id = p_member and listing_id = l.id and kind = 'still_open'
        and created_at > now() - interval '30 days') then return jsonb_build_object('ok', false, 'why', 'already_reported'); end if;
    radius := ve_evergreen_setting('still_open_radius_m', 150);
  end if;
  if l.latitude is null or l.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - l.latitude) / 2), 2)
       + cos(radians(l.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - l.longitude) / 2), 2)));
  if d > radius + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  select count(*) into n from ve_field_reports where member_id = p_member and local_day = today;
  if n >= ve_evergreen_setting('daily_reports', 10) then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if exists (select 1 from ve_field_reports where member_id = p_member and listing_id = l.id and kind = p_kind and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_field_reports (kind, member_id, listing_id, local_day, hours, answer, note, photo_path, lat, lng, accuracy_m, distance_m)
  values (p_kind, p_member, l.id, today, case when p_kind = 'volunteer' then round(p_hours * 2) / 2 end, case when p_kind = 'still_open' then p_answer end,
    nullif(left(btrim(coalesce(p_note, '')), 1000), ''), nullif(p_photo, ''), round(p_lat, 5), round(p_lng, 5), round(acc), round(d))
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', round(d));
end $$;
revoke all on function public.ve_field_report_save(uuid, text, uuid, numeric, numeric, numeric, numeric, text, text, text) from public, anon, authenticated;

-- The team's decision. p_hours lets the reviewer pay for fewer hours than claimed (with a note).
create or replace function public.ve_field_report_review(p_report uuid, p_decision text, p_reviewer uuid, p_note text, p_hours numeric default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r ve_field_reports%rowtype; pts int := 0; hrs numeric; is_first boolean := false; g jsonb; aid uuid;
begin
  select * into r from ve_field_reports where id = p_report for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'why', 'already_reviewed', 'status', r.status); end if;
  if p_decision not in ('accept', 'decline') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  if p_decision = 'accept' then
    if r.kind = 'volunteer' then
      hrs := least(coalesce(p_hours, r.hours), r.hours, ve_evergreen_setting('volunteer_max_hours', 8));
      if hrs < 0.5 then return jsonb_build_object('ok', false, 'why', 'hours'); end if;
      if hrs < r.hours and length(btrim(coalesce(p_note, ''))) < 3 then return jsonb_build_object('ok', false, 'why', 'note_required'); end if;
      pts := round(hrs * ve_evergreen_setting('volunteer_per_hour', 25))::int
        + case when r.photo_path is not null then ve_evergreen_setting('volunteer_photo_bonus', 10) else 0 end;
    else
      -- First by submission: an earlier answer on this place is decided first.
      if exists (select 1 from ve_field_reports where listing_id = r.listing_id and kind = 'still_open' and status = 'pending'
          and id <> r.id and (created_at, id) < (r.created_at, r.id)) then
        return jsonb_build_object('ok', false, 'why', 'earlier_pending'); end if;
      is_first := not exists (select 1 from ve_field_reports where listing_id = r.listing_id and kind = 'still_open' and status = 'accepted'
        and reviewed_at > now() - interval '90 days');
      pts := case when is_first then ve_evergreen_setting('still_open_first', 100) else ve_evergreen_setting('still_open_after', 20) end;
      if is_first and r.answer = 'open' then
        select o.audit_id into aid from ve_audit_open_flags() o where o.listing_id = r.listing_id limit 1;
        if aid is not null then
          insert into ve_audit_flag_reviews (listing_id, audit_id, decision, note, by_member)
          values (r.listing_id, aid, 'still_open', 'A member visited and found it open (field report ' || r.id || ').', p_reviewer);
        end if;
        update listings set details = coalesce(details, '{}'::jsonb) || jsonb_build_object(
          'review_ok_until', to_char((now() + interval '90 days') at time zone 'utc', 'YYYY-MM-DD'),
          'member_seen_open_at', to_char(r.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')) where id = r.listing_id;
      elsif is_first and r.answer = 'closed' then
        perform ve_listing_set_state(r.listing_id, 'hold', p_reviewer, nullif(btrim(coalesce(p_note, '')), ''),
          array['A member visited and found it closed (field report, with a photo)']);
      end if;
    end if;
  end if;
  update ve_field_reports set status = case p_decision when 'accept' then 'accepted' else 'declined' end, points = pts, first = is_first,
    hours = case when r.kind = 'volunteer' and p_decision = 'accept' then hrs else hours end,
    review_note = nullif(left(btrim(coalesce(p_note, '')), 1000), ''), reviewed_by = p_reviewer, reviewed_at = now()
  where id = r.id;
  if pts > 0 then g := ve_points_grant(r.member_id, pts, 'bounty', 'field:' || r.id); end if;
  return jsonb_build_object('ok', true, 'points', pts, 'first', is_first);
end $$;
revoke all on function public.ve_field_report_review(uuid, text, uuid, text, numeric) from public, anon, authenticated;
