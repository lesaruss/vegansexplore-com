-- Update, Comment and points by what was sent (Sean, 2026-10-29: "when it says wrong... maybe it's update... maybe it's comment...
-- leave a photo, leave a comment. And each thing could have its own amount of points... 5 versus 10 points. Almost like how Google
-- guides... It has to be approved because people could just take nonsense photos"). A report's photo is optional now and pays
-- more; every report still needs the phone inside the venue and waits for the team. Comments the team accepts show on the item.
-- The points are rows in ve_venue_report_points (Logan's defaults, Sean's to change), read by the review and the Guide alike.

alter table public.ve_venue_reports drop constraint if exists ve_venue_reports_kind_check;
alter table public.ve_venue_reports add constraint ve_venue_reports_kind_check check (kind in ('confirm', 'wrong', 'missing', 'gone', 'comment'));
alter table public.ve_venue_reports alter column photo_path drop not null;
alter table public.ve_venues add column if not exists image_url text;

create table if not exists public.ve_venue_report_points (
  kind text primary key check (kind in ('confirm', 'wrong', 'missing', 'gone', 'comment')),
  with_photo integer not null,
  no_photo integer not null,
  agree_with_photo integer not null default 0,     -- a later report that says the same as an accepted one
  agree_no_photo integer not null default 0,
  sort_order integer not null default 0
);
alter table public.ve_venue_report_points enable row level security;
insert into public.ve_venue_report_points (kind, with_photo, no_photo, agree_with_photo, agree_no_photo, sort_order) values
  ('comment', 10, 5, 0, 0, 1),
  ('confirm', 10, 5, 0, 0, 2),
  ('wrong', 100, 50, 25, 15, 3),
  ('gone', 100, 50, 25, 15, 4),
  ('missing', 100, 50, 25, 15, 5)
on conflict (kind) do nothing;

create or replace function public.ve_venue_report_save(p_member uuid, p_venue uuid, p_spot uuid, p_item uuid, p_kind text,
  p_note text, p_photo text, p_lat numeric, p_lng numeric, p_accuracy numeric)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
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
  if n >= 20 then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if p_item is not null and exists (select 1 from ve_venue_reports where member_id = p_member and item_id = p_item
      and kind = p_kind and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_venue_reports (member_id, venue_id, spot_id, item_id, kind, note, photo_path, lat, lng, accuracy_m, distance_m, local_day)
  values (p_member, v.id, coalesce(p_spot, (select spot_id from ve_venue_items where id = p_item)), p_item, p_kind,
          nullif(left(trim(coalesce(p_note, '')), 600), ''), nullif(p_photo, ''), round(p_lat, 5), round(p_lng, 5), round(acc), round(d), today)
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', round(d));
end $$;
revoke all on function public.ve_venue_report_save(uuid, uuid, uuid, uuid, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;

-- The team's decision. accept pays the kind's points (with or without a photo); agree, for an update or a missing item that says
-- the same as an accepted one, pays its agree points and names it; decline 0. At most 5 paid reports a member a day. An accepted
-- Still here confirms the item; an accepted comment shows on the item.
create or replace function public.ve_venue_report_review(p_report uuid, p_decision text, p_reviewer uuid, p_note text, p_first uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r ve_venue_reports%rowtype; pts int := 0; paid int; g jsonb; pr ve_venue_report_points%rowtype; photo boolean;
begin
  select * into r from ve_venue_reports where id = p_report for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'why', 'already_reviewed', 'status', r.status); end if;
  if p_decision not in ('accept', 'agree', 'decline') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  if p_decision = 'agree' and r.kind in ('comment', 'confirm') then return jsonb_build_object('ok', false, 'why', 'no_agree_for_kind'); end if;
  if p_decision = 'agree' and (p_first is null or not exists (select 1 from ve_venue_reports where id = p_first and status = 'accepted' and id <> r.id)) then
    return jsonb_build_object('ok', false, 'why', 'first_required'); end if;
  if p_decision <> 'decline' then
    select * into pr from ve_venue_report_points where kind = r.kind;
    photo := r.photo_path is not null;
    select count(*) into paid from ve_venue_reports where member_id = r.member_id and local_day = r.local_day and points > 0;
    if paid < 5 then
      pts := case when p_decision = 'agree' then (case when photo then pr.agree_with_photo else pr.agree_no_photo end)
                  else (case when photo then pr.with_photo else pr.no_photo end) end;
    end if;
  end if;
  update ve_venue_reports set status = case p_decision when 'accept' then 'accepted' when 'agree' then 'agreed' else 'declined' end,
    points = coalesce(pts, 0), first_report_id = case when p_decision = 'agree' then p_first end,
    review_note = nullif(left(trim(coalesce(p_note, '')), 600), ''), reviewed_by = p_reviewer, reviewed_at = now()
  where id = r.id;
  if p_decision = 'accept' and r.kind = 'confirm' and r.item_id is not null then
    update ve_venue_items set last_confirmed_at = greatest(coalesce(last_confirmed_at, r.created_at), r.created_at),
      confirmed_count = confirmed_count + 1, updated_at = now() where id = r.item_id;
  end if;
  if coalesce(pts, 0) > 0 then g := ve_points_grant(r.member_id, pts, 'venue_report', 'venue_report:' || r.id); end if;
  return jsonb_build_object('ok', true, 'points', coalesce(pts, 0), 'grant', g);
end $$;
revoke all on function public.ve_venue_report_review(uuid, text, uuid, text, uuid) from public, anon, authenticated;
