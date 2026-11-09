-- Report from anywhere (Sean, 2026-11-09, playbook ve-feedback; Brion Hurley was refused at FLL about 21 km away, after his trip).
-- Something missing and a comment can now be sent from away from the venue ("I'm not there now"): saved with on_site false,
-- held for the team like every report, and paid half the points when accepted (rounded up). Still here, Update, Not there
-- anymore, Where is it, scans and shop confirmations stay on-site only. At most 10 off-site reports a member a day
-- (ve_venue_setting 'daily_off_site').

alter table ve_venue_reports add column if not exists on_site boolean not null default true;
alter table ve_venue_reports alter column lat drop not null, alter column lng drop not null,
  alter column accuracy_m drop not null, alter column distance_m drop not null;

drop function if exists ve_venue_report_save(uuid,uuid,uuid,uuid,text,text,text,numeric,numeric,numeric,text,text,text,text,text,text);

create or replace function ve_venue_report_save(p_member uuid, p_venue uuid, p_spot uuid, p_item uuid, p_kind text, p_note text, p_photo text,
  p_lat numeric, p_lng numeric, p_accuracy numeric, p_place_photo text default null, p_gtin text default null, p_item_name text default null,
  p_place_name text default null, p_place_zone text default null, p_place_where text default null, p_off_site boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v ve_venues%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0);
  today date := (now() at time zone 'America/New_York')::date; n int; rid uuid; code text; hit uuid; off boolean := coalesce(p_off_site, false);
begin
  select * into v from ve_venues where id = p_venue and status = 'live';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind not in ('confirm', 'wrong', 'missing', 'gone', 'comment', 'scan', 'shop_confirm', 'locate') then return jsonb_build_object('ok', false, 'why', 'bad_kind'); end if;
  if off and p_kind not in ('missing', 'comment') then return jsonb_build_object('ok', false, 'why', 'on_site_only'); end if;
  if p_kind in ('confirm', 'wrong', 'gone', 'comment', 'shop_confirm') and p_item is null then return jsonb_build_object('ok', false, 'why', 'item_required'); end if;
  if p_item is not null and not exists (select 1 from ve_venue_items where id = p_item and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'shop_confirm' and not exists (select 1 from ve_venue_items where id = p_item and gtin is not null) then
    return jsonb_build_object('ok', false, 'why', 'not_a_shop_item'); end if;
  if p_spot is not null and not exists (select 1 from ve_venue_spots where id = p_spot and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'locate' then
    if p_spot is null then return jsonb_build_object('ok', false, 'why', 'spot_required'); end if;
    if length(coalesce(trim(p_place_where), '')) < 1 then return jsonb_build_object('ok', false, 'why', 'where_required'); end if;
    if exists (select 1 from ve_venue_reports where spot_id = p_spot and kind = 'locate' and status = 'pending') then
      return jsonb_build_object('ok', false, 'why', 'already_pending'); end if;
  end if;
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
  if not off then
    if v.latitude is null or v.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
    if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
    if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
    d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - v.latitude) / 2), 2)
         + cos(radians(v.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v.longitude) / 2), 2)));
    if d > v.radius_m + least(acc, 100) then
      return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d), 'off_site_ok', p_kind in ('missing', 'comment')); end if;
  end if;
  select count(*) into n from ve_venue_reports where member_id = p_member and local_day = today;
  if n >= ve_venue_setting('daily_reports', 60) then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if off and (select count(*) from ve_venue_reports where member_id = p_member and local_day = today and not on_site) >= ve_venue_setting('daily_off_site', 10) then
    return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if p_item is not null and exists (select 1 from ve_venue_reports where member_id = p_member and item_id = p_item
      and kind = p_kind and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  if p_kind = 'locate' and exists (select 1 from ve_venue_reports where member_id = p_member and spot_id = p_spot
      and kind = 'locate' and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_venue_reports (member_id, venue_id, spot_id, item_id, kind, note, photo_path, place_photo_path, gtin, item_name, place_name,
    place_zone, place_where, lat, lng, accuracy_m, distance_m, local_day, on_site)
  values (p_member, v.id, coalesce(p_spot, (select spot_id from ve_venue_items where id = p_item)), p_item, p_kind,
          nullif(left(trim(coalesce(p_note, '')), 600), ''), nullif(p_photo, ''), nullif(p_place_photo, ''), code,
          nullif(left(trim(coalesce(p_item_name, '')), 160), ''), nullif(left(trim(coalesce(p_place_name, '')), 120), ''),
          case when p_place_zone in ('airside', 'landside') then p_place_zone end, nullif(left(trim(coalesce(p_place_where, '')), 160), ''),
          case when off then null else round(p_lat, 5) end, case when off then null else round(p_lng, 5) end,
          case when off then null else round(acc) end, case when off then null else round(d) end, today, not off)
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', case when off then null else round(d) end, 'on_site', not off,
    'bounty', not off and p_kind = 'confirm' and coalesce(ve_venue_sponsored(v.id), true) and coalesce(ve_venue_item_bounty_open(p_item), false));
end $function$;
revoke all on function ve_venue_report_save(uuid,uuid,uuid,uuid,text,text,text,numeric,numeric,numeric,text,text,text,text,text,text,boolean) from public, anon, authenticated;

-- Review: a report sent from away pays half its points, rounded up (100 to 50, 5 to 3). Patched in place so the rest of
-- ve_venue_report_review stays exactly as it was.
do $$
declare src text;
begin
  src := pg_get_functiondef('ve_venue_report_review(uuid,text,uuid,text,uuid)'::regprocedure);
  if position('r.on_site' in src) = 0 then
    src := replace(src, '  update ve_venue_reports set status = case p_decision',
      '  if not coalesce(r.on_site, true) and coalesce(pts, 0) > 0 then pts := ceil(pts / 2.0)::int; end if;' || chr(10) ||
      '  update ve_venue_reports set status = case p_decision');
    if position('r.on_site' in src) = 0 then raise exception 'review patch did not apply'; end if;
    execute src;
  end if;
end $$;
