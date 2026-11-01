-- Supermarket reports: full points and the first-to-confirm bounty only on sponsored chains (Sean, 2026-11-01: "go with your defaults
-- on the incentives"; canon canon-ve-supermarket-guide v3: without a sponsorship updates are organic and earn smaller incentives).
--
-- * ve_venue_report_points gains the standard amounts (std_*): what a report pays at a supermarket whose chain has no active
--   Title or Partner sponsorship. About 40% of the full amounts; Still here pays its plain amount there, never the bounty.
-- * A report keeps whether its store was sponsored when it was sent (ve_venue_reports.sponsored, set by trigger), so a sponsorship
--   that ends while a report waits for review never lowers what it pays. Stadiums and airports are always "sponsored" (full points).
-- * ve_venue_report_review pays the std_* amounts and no bounty when sponsored is false.

alter table ve_venue_report_points
  add column if not exists std_with_photo int,
  add column if not exists std_no_photo int,
  add column if not exists std_agree_with_photo int,
  add column if not exists std_agree_no_photo int;

update ve_venue_report_points set std_with_photo = 40, std_no_photo = 20, std_agree_with_photo = 10, std_agree_no_photo = 5 where kind in ('wrong', 'gone', 'missing');
update ve_venue_report_points set std_with_photo = 5, std_no_photo = 2, std_agree_with_photo = 0, std_agree_no_photo = 0 where kind in ('confirm', 'comment');

-- Is this venue's chain sponsored today? Any venue that is not a supermarket counts as sponsored (it pays the full amounts).
create or replace function ve_venue_sponsored(p_venue uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select case when v.kind <> 'supermarket' then true
    else exists (select 1 from ve_supermarket_sponsors s
      where s.chain_listing_id = v.chain_listing_id and s.tier in ('title', 'partner') and s.status = 'active'
        and (s.starts_on is null or s.starts_on <= (now() at time zone 'America/New_York')::date)
        and (s.ends_on is null or s.ends_on >= (now() at time zone 'America/New_York')::date)) end
  from ve_venues v where v.id = p_venue
$$;

alter table ve_venue_reports add column if not exists sponsored boolean;

create or replace function ve_venue_report_set_sponsored() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  new.sponsored := coalesce(ve_venue_sponsored(new.venue_id), true);
  return new;
end $$;

drop trigger if exists trg_ve_venue_report_sponsored on ve_venue_reports;
create trigger trg_ve_venue_report_sponsored before insert on ve_venue_reports
  for each row execute function ve_venue_report_set_sponsored();

-- Reports already sent keep the full amounts (none were from a supermarket on 2026-11-01).
update ve_venue_reports set sponsored = true where sponsored is null;

create or replace function public.ve_venue_report_save(p_member uuid, p_venue uuid, p_spot uuid, p_item uuid, p_kind text, p_note text, p_photo text, p_lat numeric, p_lng numeric, p_accuracy numeric)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v ve_venues%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0);
  today date := (now() at time zone 'America/New_York')::date; n int; rid uuid;
begin
  select * into v from ve_venues where id = p_venue and status = 'live';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind not in ('confirm', 'wrong', 'missing', 'gone', 'comment') then return jsonb_build_object('ok', false, 'why', 'bad_kind'); end if;
  if p_kind in ('confirm', 'wrong', 'gone', 'comment') and p_item is null then return jsonb_build_object('ok', false, 'why', 'item_required'); end if;
  if p_item is not null and not exists (select 1 from ve_venue_items where id = p_item and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind in ('missing', 'wrong', 'comment') and length(coalesce(trim(p_note), '')) < 3 then return jsonb_build_object('ok', false, 'why', 'note_required'); end if;
  if v.latitude is null or v.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - v.latitude) / 2), 2)
       + cos(radians(v.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v.longitude) / 2), 2)));
  if d > v.radius_m + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  select count(*) into n from ve_venue_reports where member_id = p_member and local_day = today;
  if n >= ve_venue_setting('daily_reports', 60) then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if p_item is not null and exists (select 1 from ve_venue_reports where member_id = p_member and item_id = p_item
      and kind = p_kind and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_venue_reports (member_id, venue_id, spot_id, item_id, kind, note, photo_path, lat, lng, accuracy_m, distance_m, local_day)
  values (p_member, v.id, coalesce(p_spot, (select spot_id from ve_venue_items where id = p_item)), p_item, p_kind,
          nullif(left(trim(coalesce(p_note, '')), 600), ''), nullif(p_photo, ''), round(p_lat, 5), round(p_lng, 5), round(acc), round(d), today)
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', round(d),
    'bounty', p_kind = 'confirm' and coalesce(ve_venue_sponsored(v.id), true) and coalesce(ve_venue_item_bounty_open(p_item), false));
end $function$;

create or replace function public.ve_venue_report_review(p_report uuid, p_decision text, p_reviewer uuid, p_note text, p_first uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare r ve_venue_reports%rowtype; pts int := 0; paid int; g jsonb; pr ve_venue_report_points%rowtype; photo boolean; first boolean := false; full_pts boolean;
begin
  select * into r from ve_venue_reports where id = p_report for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'why', 'already_reviewed', 'status', r.status); end if;
  if p_decision not in ('accept', 'agree', 'decline') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  if p_decision = 'agree' and r.kind in ('comment', 'confirm') then return jsonb_build_object('ok', false, 'why', 'no_agree_for_kind'); end if;
  if p_decision = 'agree' and (p_first is null or not exists (select 1 from ve_venue_reports where id = p_first and status = 'accepted' and id <> r.id)) then
    return jsonb_build_object('ok', false, 'why', 'first_required'); end if;
  if p_decision = 'accept' and r.kind = 'confirm' and exists (select 1 from ve_venue_reports where item_id = r.item_id and kind = 'confirm'
      and status = 'pending' and id <> r.id and (created_at, id) < (r.created_at, r.id)) then
    return jsonb_build_object('ok', false, 'why', 'earlier_pending'); end if;
  full_pts := coalesce(r.sponsored, true);
  if p_decision <> 'decline' then
    select * into pr from ve_venue_report_points where kind = r.kind;
    photo := r.photo_path is not null;
    first := full_pts and p_decision = 'accept' and r.kind = 'confirm' and pr.first_with_photo is not null and coalesce(ve_venue_item_bounty_open(r.item_id), false);
    select count(*) into paid from ve_venue_reports where member_id = r.member_id and local_day = r.local_day and points > 0;
    if paid < ve_venue_setting('daily_paid_cap', 40) then
      if full_pts then
        pts := case when p_decision = 'agree' then (case when photo then pr.agree_with_photo else pr.agree_no_photo end)
                    when first then (case when photo then pr.first_with_photo else pr.first_no_photo end)
                    else (case when photo then pr.with_photo else pr.no_photo end) end;
      else
        pts := case when p_decision = 'agree' then (case when photo then pr.std_agree_with_photo else pr.std_agree_no_photo end)
                    else (case when photo then pr.std_with_photo else pr.std_no_photo end) end;
      end if;
    end if;
  end if;
  update ve_venue_reports set status = case p_decision when 'accept' then 'accepted' when 'agree' then 'agreed' else 'declined' end,
    points = coalesce(pts, 0), bounty = first, first_report_id = case when p_decision = 'agree' then p_first end,
    review_note = nullif(left(trim(coalesce(p_note, '')), 600), ''), reviewed_by = p_reviewer, reviewed_at = now()
  where id = r.id;
  if p_decision = 'accept' and r.kind = 'confirm' and r.item_id is not null then
    update ve_venue_items set last_confirmed_at = greatest(coalesce(last_confirmed_at, r.created_at), r.created_at),
      confirmed_count = confirmed_count + 1, updated_at = now() where id = r.item_id;
  end if;
  if coalesce(pts, 0) > 0 then g := ve_points_grant(r.member_id, pts, 'venue_report', 'venue_report:' || r.id); end if;
  return jsonb_build_object('ok', true, 'points', coalesce(pts, 0), 'bounty', first, 'full', full_pts, 'grant', g);
end $function$;
