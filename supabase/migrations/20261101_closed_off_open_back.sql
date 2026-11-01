-- Closed comes off, open comes back (Sean, 2026-11-01: "anything temporarily closed or permanently closed, let's leave it off of.
-- You don't even have to ask me... if anything ever changes in our scan and the status changes, then we can put it back").
-- 1. The nightly hold now also takes off a place Google says is temporarily closed (it already took off permanently closed).
-- 2. Once a week the places taken off because Google said closed (held by the nightly check, or Removed for it) are looked up on
--    Google again by their place (Place Details, businessStatus only); one Google shows open again goes back on the Directory with a
--    note, and its 90-day hold-off stops the old check-up flag holding it the next night. Metered (job closed-recheck) within the
--    background share of the daily cap. Results in ve_closed_rechecks.
create or replace function public.ve_directory_review_flags()
 returns table(listing_id uuid, slug text, name text, category text, city text, state text, community_slug text, logo_url text, website text, instagram text, flags text[], strong boolean, audit_id uuid, google_maps text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
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
      and (ve_audit_local_category(l.category) or l.category in ('Food Trucks', 'Vendors'))
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
           -- Only for the site the check-up read: a website fixed since then (Directory review) is not flagged.
           when b.facts->'website'->>'error' is not null and b.facts->'website'->>'error' !~ '^(status (401|403|406|429|503)|no website)$'
             and coalesce(nullif(b.facts->'website'->>'url', ''), b.website) is not null
             and regexp_replace(lower(coalesce(nullif(b.facts->'website'->>'url', ''), b.website)), '^https?://(www\.)?|/+$', '', 'g')
               = regexp_replace(lower(b.website), '^https?://(www\.)?|/+$', '', 'g') then 'The website did not open' end
    ], null) fl,
    -- Google vouches for it: its place, a street, hours, and Google not saying it is closed.
    (b.google_place_id is not null and coalesce(b.address_street, '') <> ''
      and coalesce(nullif(b.google_hours_json::text, ''), 'null') not in ('null', '{}', '[]', '""')
      and coalesce(b.gstatus, '') not like 'CLOSED%') google_ok
    from base b
  )
  select f.id, f.slug, f.name, f.category, f.address_city, f.address_state, f.hub, f.logo_url, f.website, f.instagram, f.fl,
    (f.gstatus in ('CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY') or (f.closure_level in ('closed', 'quiet') and f.decision is null)
      or ('No socials' = any(f.fl) and 'The website did not open' = any(f.fl))
      or ('No socials' = any(f.fl) and ('No hours' = any(f.fl) or 'No website' = any(f.fl)) and not f.google_ok))
      -- A member checked in within 30 days: it is open, whatever else looks quiet.
      and coalesce(f.last_checkin < now() - interval '30 days', true) strong,
    f.aid, f.facts->'google'->>'maps'
  from f where cardinality(f.fl) > 0
  order by 12 desc, cardinality(f.fl) desc, f.name;
$function$;

create table if not exists public.ve_closed_rechecks (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  req_id bigint,
  sent_at timestamptz,
  checked_at timestamptz,
  google_status text,
  result text
);
alter table public.ve_closed_rechecks enable row level security;

-- Off because Google said closed, with a place to look up.
create or replace function public.ve_closed_recheck_due(p_limit int default 10)
returns setof uuid language sql stable security definer set search_path = public as $$
  select l.id from listings l left join ve_closed_rechecks r on r.listing_id = l.id
  where l.google_place_id is not null
    and ((l.status = 'pending' and coalesce(l.details->'review'->'reasons', '[]'::jsonb)
            ?| array['Google says it is permanently closed', 'Google says it is temporarily closed'])
      or (l.status = 'rejected' and not (l.details ? 'merged_into') and coalesce(l.details->>'removed_reason', '') ilike '%Google says it is%closed%'))
    and (r.sent_at is null or r.sent_at < now() - interval '6 days')
  order by r.sent_at nulls first limit greatest(1, p_limit);
$$;

create or replace function public.ve_closed_recheck_send(p_limit int default 10)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare n int := 0; room int; v_id uuid; v_pid text; v_key text;
begin
  room := least(p_limit, ve_google_room('details', true));
  if room <= 0 then return 0; end if;
  select value into v_key from lesaruss_secrets where key = 'GOOGLE_PLACES_API_KEY';
  for v_id in select * from ve_closed_recheck_due(room) loop
    select google_place_id into v_pid from listings where listings.id = v_id;
    insert into ve_closed_rechecks (listing_id, req_id, sent_at, checked_at, google_status, result)
    values (v_id, net.http_get(url := 'https://places.googleapis.com/v1/places/' || v_pid,
      headers := jsonb_build_object('X-Goog-Api-Key', v_key, 'X-Goog-FieldMask', 'id,businessStatus'), timeout_milliseconds := 20000),
      now(), null, null, null)
    on conflict (listing_id) do update set req_id = excluded.req_id, sent_at = now(), checked_at = null, google_status = null, result = null;
    n := n + 1;
  end loop;
  if n > 0 then perform ve_google_count('details', 'closed-recheck', n); end if;
  return n;
end $$;

create or replace function public.ve_closed_recheck_read()
returns int language plpgsql security definer set search_path = public as $$
declare r record; gs text; n int := 0;
begin
  for r in select c.listing_id, x.status_code, x.content from ve_closed_rechecks c join net._http_response x on x.id = c.req_id
           where c.checked_at is null loop
    gs := case when r.status_code = 200 then (r.content::jsonb)->>'businessStatus' end;
    if gs = 'OPERATIONAL' then
      perform ve_listing_set_state(r.listing_id, 'live', null,
        'Google shows it open again (checked ' || to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD') || ').', null);
      update ve_closed_rechecks set checked_at = now(), google_status = gs, result = 'back' where listing_id = r.listing_id;
      n := n + 1;
    else
      update ve_closed_rechecks set checked_at = now(), google_status = coalesce(gs, 'error ' || r.status_code),
        result = case when gs is null then 'error' else 'still_off' end where listing_id = r.listing_id;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.ve_closed_recheck_due(int) from public, anon, authenticated;
revoke all on function public.ve_closed_recheck_send(int) from public, anon, authenticated;
revoke all on function public.ve_closed_recheck_read() from public, anon, authenticated;

-- Mondays, 9:17 AM Eastern (13:17 UTC in winter); answers read ten minutes later.
select cron.schedule('ve-closed-recheck-send', '17 13 * * 1', $c$ select public.ve_closed_recheck_send(10); $c$);
select cron.schedule('ve-closed-recheck-read', '27 13 * * 1', $c$ select public.ve_closed_recheck_read(); $c$);
