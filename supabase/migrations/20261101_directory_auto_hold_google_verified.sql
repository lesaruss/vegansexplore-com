-- The nightly hold spares places Google vouches for (Sean, 2026-11-01: "fix the nightly check"). From 2026-10-28 the
-- restaurant search listed places from Google with their place, street and hours, and the nightly check held 61 of them the
-- next night only for "No socials" with "No website": many small places, in London and New York above all, have only their
-- Google listing. A 2026-11-01 check on Google found 34 of the held ones open with 50 or more reviews and one since May 2026
-- (Uptown Veg 988, Hibiscus Cafe 757), and they went back.
-- Now "No socials" with no website or no hours holds a place only when Google does not vouch for it: a Google place, a street
-- and hours on the listing, and Google not saying it is closed. It is still flagged in Directory review (not strong), and
-- the strong signs still hold it: Google says permanently closed, the monthly check-up's closed or quiet flag (which counts no
-- Google review in a year), or a website that does not open with no socials.
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
    (f.gstatus = 'CLOSED_PERMANENTLY' or (f.closure_level in ('closed', 'quiet') and f.decision is null)
      or ('No socials' = any(f.fl) and 'The website did not open' = any(f.fl))
      or ('No socials' = any(f.fl) and ('No hours' = any(f.fl) or 'No website' = any(f.fl)) and not f.google_ok))
      -- A member checked in within 30 days: it is open, whatever else looks quiet.
      and coalesce(f.last_checkin < now() - interval '30 days', true) strong,
    f.aid, f.facts->'google'->>'maps'
  from f where cardinality(f.fl) > 0
  order by 12 desc, cardinality(f.fl) desc, f.name;
$function$;
