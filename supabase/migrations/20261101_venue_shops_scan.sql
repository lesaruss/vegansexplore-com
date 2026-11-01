-- Venue reports: two photo slots for Something missing, and shops you scan (Sean, 2026-11-01).
--
-- "To add something missing... a slot for the item and a slot for the location, like showing the name, taking a photo of the name of
-- the store or restaurant." Something missing now carries the item's photo (photo_path) and the sign's (place_photo_path), with the
-- item's name and the place's name in their own fields; the full points need both photos.
--
-- "For the airports... the convenience store places, like the gift shops, what items they have in there?... 10 points per item,
-- 5 points for confirming... If they scan something that's already there... let them know that this item has already been logged."
-- A shop is a spot of kind 'shop'. A member scans a Vegan item's barcode there: a new item is a report of kind 'scan' (10 points
-- once the team accepts it; accepting adds the item to the shop, or adds the shop first when it is new); an item already logged at
-- that shop is confirmed with kind 'shop_confirm' (5 points once accepted). Shop items carry their barcode (ve_venue_items.gtin) and
-- never pay the first-to-confirm bounty. Every report still waits for the team, as the locked venue rule says. Safe to run twice.

alter table public.ve_venue_reports add column if not exists place_photo_path text;
alter table public.ve_venue_reports add column if not exists gtin text;
alter table public.ve_venue_reports add column if not exists item_name text;
alter table public.ve_venue_reports add column if not exists place_name text;
alter table public.ve_venue_reports add column if not exists place_zone text;
alter table public.ve_venue_reports add column if not exists place_where text;

alter table public.ve_venue_spots add column if not exists kind text not null default 'food';
alter table public.ve_venue_spots drop constraint if exists ve_venue_spots_kind_check;
alter table public.ve_venue_spots add constraint ve_venue_spots_kind_check check (kind in ('food', 'shop'));

alter table public.ve_venue_items add column if not exists gtin text;
create unique index if not exists ve_venue_items_spot_gtin on public.ve_venue_items (spot_id, gtin) where gtin is not null and status = 'live';

alter table public.ve_venue_reports drop constraint if exists ve_venue_reports_kind_check;
alter table public.ve_venue_reports add constraint ve_venue_reports_kind_check
  check (kind in ('confirm', 'wrong', 'missing', 'gone', 'comment', 'scan', 'shop_confirm'));
alter table public.ve_venue_report_points drop constraint if exists ve_venue_report_points_kind_check;
alter table public.ve_venue_report_points add constraint ve_venue_report_points_kind_check
  check (kind in ('confirm', 'wrong', 'missing', 'gone', 'comment', 'scan', 'shop_confirm'));

-- Sean's amounts: a new item 10, confirming one already logged 5; the scan is the proof, so a photo does not change them.
insert into public.ve_venue_report_points (kind, with_photo, no_photo, agree_with_photo, agree_no_photo, sort_order, std_with_photo, std_no_photo, std_agree_with_photo, std_agree_no_photo)
values ('scan', 10, 10, 0, 0, 6, 10, 10, 0, 0), ('shop_confirm', 5, 5, 0, 0, 7, 5, 5, 0, 0)
on conflict (kind) do nothing;

-- The markets already listed at airports are shops.
update public.ve_venue_spots s set kind = 'shop'
from public.ve_venues v
where v.id = s.venue_id and v.kind = 'airport' and s.kind = 'food'
  and s.name ~* '(hudson|news|market|gift|shop|store|cibo|essentials|wh ?smith|boots)';

-- Shop items never carry the first-to-confirm bounty.
create or replace function public.ve_venue_item_bounty_open(p_item uuid)
 returns boolean language sql stable security definer set search_path to 'public' as $function$
  select i.gtin is null and (i.last_confirmed_at is null
      or i.last_confirmed_at < now() - make_interval(days => ve_venue_setting('fresh_days', 35))
      or (v.season_reset_at is not null and i.last_confirmed_at < v.season_reset_at))
  from ve_venue_items i join ve_venues v on v.id = i.venue_id where i.id = p_item
$function$;

drop function if exists public.ve_venue_report_save(uuid, uuid, uuid, uuid, text, text, text, numeric, numeric, numeric);
create or replace function public.ve_venue_report_save(p_member uuid, p_venue uuid, p_spot uuid, p_item uuid, p_kind text, p_note text, p_photo text,
  p_lat numeric, p_lng numeric, p_accuracy numeric, p_place_photo text default null, p_gtin text default null, p_item_name text default null,
  p_place_name text default null, p_place_zone text default null, p_place_where text default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v ve_venues%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0);
  today date := (now() at time zone 'America/New_York')::date; n int; rid uuid; code text; hit uuid;
begin
  select * into v from ve_venues where id = p_venue and status = 'live';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind not in ('confirm', 'wrong', 'missing', 'gone', 'comment', 'scan', 'shop_confirm') then return jsonb_build_object('ok', false, 'why', 'bad_kind'); end if;
  if p_kind in ('confirm', 'wrong', 'gone', 'comment', 'shop_confirm') and p_item is null then return jsonb_build_object('ok', false, 'why', 'item_required'); end if;
  if p_item is not null and not exists (select 1 from ve_venue_items where id = p_item and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'shop_confirm' and not exists (select 1 from ve_venue_items where id = p_item and gtin is not null) then
    return jsonb_build_object('ok', false, 'why', 'not_a_shop_item'); end if;
  if p_spot is not null and not exists (select 1 from ve_venue_spots where id = p_spot and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'missing' and length(coalesce(trim(p_item_name), '')) < 2 and length(coalesce(trim(p_note), '')) < 3 then
    return jsonb_build_object('ok', false, 'why', 'note_required'); end if;
  if p_kind in ('wrong', 'comment') and length(coalesce(trim(p_note), '')) < 3 then return jsonb_build_object('ok', false, 'why', 'note_required'); end if;
  if p_kind = 'scan' then
    code := ve_gtin(p_gtin);
    if code is null then return jsonb_build_object('ok', false, 'why', 'bad_code'); end if;
    if length(coalesce(trim(p_item_name), '')) < 2 then return jsonb_build_object('ok', false, 'why', 'name_required'); end if;
    if p_spot is null and length(coalesce(trim(p_place_name), '')) < 2 then return jsonb_build_object('ok', false, 'why', 'shop_required'); end if;
    if p_spot is not null then
      select id into hit from ve_venue_items where spot_id = p_spot and gtin = code and status = 'live' limit 1;
      if hit is not null then return jsonb_build_object('ok', false, 'why', 'already_logged', 'item', hit); end if;
      if exists (select 1 from ve_venue_reports where spot_id = p_spot and gtin = code and kind = 'scan' and status = 'pending') then
        return jsonb_build_object('ok', false, 'why', 'already_pending'); end if;
    end if;
  end if;
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
  insert into ve_venue_reports (member_id, venue_id, spot_id, item_id, kind, note, photo_path, place_photo_path, gtin, item_name, place_name,
    place_zone, place_where, lat, lng, accuracy_m, distance_m, local_day)
  values (p_member, v.id, coalesce(p_spot, (select spot_id from ve_venue_items where id = p_item)), p_item, p_kind,
          nullif(left(trim(coalesce(p_note, '')), 600), ''), nullif(p_photo, ''), nullif(p_place_photo, ''), code,
          nullif(left(trim(coalesce(p_item_name, '')), 160), ''), nullif(left(trim(coalesce(p_place_name, '')), 120), ''),
          case when p_place_zone in ('airside', 'landside') then p_place_zone end, nullif(left(trim(coalesce(p_place_where, '')), 160), ''),
          round(p_lat, 5), round(p_lng, 5), round(acc), round(d), today)
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', round(d),
    'bounty', p_kind = 'confirm' and coalesce(ve_venue_sponsored(v.id), true) and coalesce(ve_venue_item_bounty_open(p_item), false));
end $function$;

create or replace function public.ve_venue_report_review(p_report uuid, p_decision text, p_reviewer uuid, p_note text, p_first uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare r ve_venue_reports%rowtype; pts int := 0; paid int; g jsonb; pr ve_venue_report_points%rowtype; photo boolean; first boolean := false; full_pts boolean;
  pay_kind text; sp uuid; it uuid;
begin
  select * into r from ve_venue_reports where id = p_report for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'why', 'already_reviewed', 'status', r.status); end if;
  if p_decision not in ('accept', 'agree', 'decline') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  if p_decision = 'agree' and r.kind in ('comment', 'confirm', 'scan', 'shop_confirm') then return jsonb_build_object('ok', false, 'why', 'no_agree_for_kind'); end if;
  if p_decision = 'agree' and (p_first is null or not exists (select 1 from ve_venue_reports where id = p_first and status = 'accepted' and id <> r.id)) then
    return jsonb_build_object('ok', false, 'why', 'first_required'); end if;
  if p_decision = 'accept' and r.kind = 'confirm' and exists (select 1 from ve_venue_reports where item_id = r.item_id and kind = 'confirm'
      and status = 'pending' and id <> r.id and (created_at, id) < (r.created_at, r.id)) then
    return jsonb_build_object('ok', false, 'why', 'earlier_pending'); end if;
  pay_kind := r.kind; sp := r.spot_id; it := r.item_id;
  -- A scan the team accepts adds the item to its shop (and the shop first when it is new). If that shop already has the item
  -- (two members scanned it before either was reviewed), it counts as confirming it instead.
  if p_decision = 'accept' and r.kind = 'scan' then
    if sp is null then
      insert into ve_venue_spots (venue_id, name, where_text, zone, kind, sort_order)
      values (r.venue_id, coalesce(r.place_name, 'A shop'), r.place_where, coalesce(r.place_zone, 'airside'), 'shop',
              coalesce((select max(sort_order) from ve_venue_spots where venue_id = r.venue_id), 0) + 1)
      returning id into sp;
    end if;
    select id into it from ve_venue_items where spot_id = sp and gtin = r.gtin and status = 'live' limit 1;
    if it is null then
      insert into ve_venue_items (venue_id, spot_id, name, vegan, gtin, sources, last_confirmed_at, confirmed_count, sort_order)
      values (r.venue_id, sp, coalesce(r.item_name, 'Scanned item'), 'vegan', r.gtin,
              jsonb_build_array(jsonb_build_object('label', 'Scanned by a member', 'date', to_char(r.created_at, 'YYYY-MM-DD'))),
              r.created_at, 1, coalesce((select max(sort_order) from ve_venue_items where spot_id = sp), 0) + 1)
      returning id into it;
    else
      pay_kind := 'shop_confirm';
      update ve_venue_items set last_confirmed_at = greatest(coalesce(last_confirmed_at, r.created_at), r.created_at),
        confirmed_count = confirmed_count + 1, updated_at = now() where id = it;
    end if;
  end if;
  full_pts := coalesce(r.sponsored, true);
  if p_decision <> 'decline' then
    select * into pr from ve_venue_report_points where kind = pay_kind;
    -- Something missing pays its full points only with both photos: the item and the sign (a supermarket is its own sign).
    photo := r.photo_path is not null and (r.kind <> 'missing' or r.place_photo_path is not null
      or (select kind from ve_venues where id = r.venue_id) = 'supermarket');
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
    spot_id = sp, item_id = it,
    review_note = nullif(left(trim(coalesce(p_note, '')), 600), ''), reviewed_by = p_reviewer, reviewed_at = now()
  where id = r.id;
  if p_decision = 'accept' and r.kind in ('confirm', 'shop_confirm') and r.item_id is not null then
    update ve_venue_items set last_confirmed_at = greatest(coalesce(last_confirmed_at, r.created_at), r.created_at),
      confirmed_count = confirmed_count + 1, updated_at = now() where id = r.item_id;
  end if;
  if coalesce(pts, 0) > 0 then g := ve_points_grant(r.member_id, pts, 'venue_report', 'venue_report:' || r.id); end if;
  return jsonb_build_object('ok', true, 'points', coalesce(pts, 0), 'bounty', first, 'full', full_pts, 'grant', g, 'item', it, 'spot', sp);
end $function$;

revoke all on function public.ve_venue_report_save(uuid, uuid, uuid, uuid, text, text, text, numeric, numeric, numeric, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.ve_venue_report_review(uuid, text, uuid, text, uuid) from public, anon, authenticated;
