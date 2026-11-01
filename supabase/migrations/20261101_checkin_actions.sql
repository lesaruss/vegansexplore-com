-- Earn your Passport, part 1: the new check-in (Sean, 2026-11-01, canon canon-ve-earn-your-passport). After I'm here, a member
-- picks what they are doing there: What I ordered (a photo), I bought something (a receipt), Post it (a link), a shout-out (a
-- positive line, read first). Each waits for the team; approving pays its points. Owners earn nothing at their own place.
-- Safe to run twice.

create table if not exists public.ve_checkin_actions (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.ve_checkins(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null check (kind in ('meal', 'receipt', 'post', 'shoutout')),
  photo_path text,
  post_url text,
  body text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  points integer not null default 0,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (checkin_id, kind)
);
create index if not exists ve_checkin_actions_status on public.ve_checkin_actions (status, created_at desc);
create index if not exists ve_checkin_actions_listing on public.ve_checkin_actions (listing_id, kind, status);
alter table public.ve_checkin_actions enable row level security;

insert into public.ve_site_settings (key, value)
values ('checkin_actions', jsonb_build_object('meal', 15, 'receipt', 25, 'post', 25, 'shoutout', 10, 'window_hours', 3))
on conflict (key) do nothing;

insert into storage.buckets (id, name, public) values ('checkin-photos', 'checkin-photos', false) on conflict (id) do nothing;

-- Owners earn nothing at their own place (the check-in still counts, at 0 points).
create or replace function public.ve_checkin_save(p_member uuid, p_listing uuid, p_lat numeric, p_lng numeric, p_accuracy numeric)
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
  pts := case when own then 0 when paid_today < 5 then 10 else 0 end;
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
