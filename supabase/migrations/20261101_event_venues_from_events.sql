-- Event Venues from where Vegan events were held (Sean, 2026-11-01: "do a scan of the past events for the year in each of those cities
-- and look where they held the event... build the list based off that, because that's a good indicator of where vegans hold their
-- events"). Playbook ve-events-guide.
--
-- 1. events.venue_listing_id: the Directory listing an event was held at (host_listing_id stays the group that put it on).
-- 2. ve_event_venues_sync(): links an approved Vegans Explore event to a listing whose name is the event's place name (or starts it)
--    in the same city, and keeps the tag ve-hosts-events on every listing with an event held there in the last 400 days or coming up
--    (the "hosts events" flag of canon-ve-events-guide; the Guide's Venue tab lists Event Venues and these). Nightly, cron
--    ve-event-venues-sync, 08:47 UTC.
-- 3. ve_event_venue_seed: the places the 2026 calendar names in our chapters (2026-01-01 to now and coming up), read 2026-11-01:
--    325 place names across 605 events; left out: neighborhoods (Partiful gives Philadelphia's events only an approximate area), bare
--    street addresses with fewer than 3 events, parks, trails, transit stations, museums and landmarks, private homes, "address shared
--    on RSVP", gyms and yoga studios, stores, and places outside our chapters. 95 kept: 76 venues (kind v) and 19 Vegan or
--    vegetarian food places not yet in the Directory (kind f). One Google Places text search each (job once:event-venues).
-- 4. ve_event_venue_import(): reads those searches. A place that is open, in the seed's chapter and named like the seed (an address
--    seed takes the establishment at that address) is: already listed (by Google place or name and city) -> its events are linked;
--    a venue -> a live Services > Event Venues listing, Not a Vegan business (vegan_status null), with Google's address, pin, phone,
--    website, hours and summary, crawl_source event-venue-search; a food place -> quarantined, waiting in Business outreach > New
--    places > Ready to list (How Vegan is picked on purpose). Then the seed's events are linked and the sync runs. Safe to run twice.

alter table public.events add column if not exists venue_listing_id uuid references public.listings(id) on delete set null;
create index if not exists events_venue_listing_idx on public.events (venue_listing_id) where venue_listing_id is not null;

create table if not exists public.ve_event_venue_seed (n int primary key, kind text, hub text, names text, city text, query text,
  req_id bigint, listing_id uuid, result text, created_at timestamptz default now());
alter table public.ve_event_venue_seed enable row level security;
alter table public.ve_event_venue_seed add column if not exists listing_id uuid;
alter table public.ve_event_venue_seed add column if not exists result text;

create or replace function public.ve_norm_name(t text) returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]', '', 'g') $$;

create or replace function public.ve_event_venues_sync() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_linked int; v_on int; v_off int;
begin
  with e as (select id, ve_norm_name(location_name) k, lower(coalesce(city, '')) c from events
      where tenant_id = '00000000-0000-4000-a000-000000000002' and status = 'approved' and venue_listing_id is null
        and location_name is not null and coalesce(event_type, '') <> 'virtual' and length(ve_norm_name(location_name)) >= 5),
    m as (select distinct on (e.id) e.id, l.id lid from e join listings l on l.status = 'approved'
        and (ve_norm_name(l.name) = e.k or (length(ve_norm_name(l.name)) >= 8 and e.k like ve_norm_name(l.name) || '%'))
        and (lower(l.address_city) = e.c or e.c like '%' || lower(l.address_city) || '%')
      order by e.id, length(ve_norm_name(l.name)) desc)
  update events ev set venue_listing_id = m.lid from m where ev.id = m.id;
  get diagnostics v_linked = row_count;

  with h as (select distinct venue_listing_id id from events where venue_listing_id is not null and status = 'approved'
      and tenant_id = '00000000-0000-4000-a000-000000000002' and starts_at > now() - interval '400 days')
  update listings l set tags = array_append(coalesce(l.tags, '{}'), 've-hosts-events'), updated_at = now()
    from h where l.id = h.id and not (coalesce(l.tags, '{}') @> array['ve-hosts-events']);
  get diagnostics v_on = row_count;
  update listings l set tags = array_remove(l.tags, 've-hosts-events'), updated_at = now()
    where l.tags @> array['ve-hosts-events'] and not exists (select 1 from events e where e.venue_listing_id = l.id
      and e.status = 'approved' and e.starts_at > now() - interval '400 days');
  get diagnostics v_off = row_count;
  return jsonb_build_object('linked', v_linked, 'tagged', v_on, 'untagged', v_off);
end $$;
revoke all on function public.ve_event_venues_sync() from public, anon, authenticated;

create or replace function public.ve_event_venue_import() returns jsonb
language plpgsql security definer set search_path = public as $$
declare s record; p jsonb; a record; v_lid uuid; v_slug text; v_base text; v_desc text; v_hours jsonb; n_new int := 0; n_food int := 0;
  n_had int := 0; n_skip int := 0; v_names text[]; v_linked int := 0; v_k int;
begin
  for s in select * from ve_event_venue_seed where listing_id is null order by n loop
    p := null;
    select (r.content::jsonb)->'places'->0 into p from net._http_response r
      where r.id = s.req_id and r.status_code = 200 and r.content like '{%';
    if p is null then update ve_event_venue_seed set result = 'no answer' where n = s.n; n_skip := n_skip + 1; continue; end if;
    select
      (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country,
      (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st0,
      coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1),
               (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'sublocality_level_1' limit 1),
               (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_town' limit 1)) city,
      (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
      (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip,
      trim(left(p->'displayName'->>'text', 140)) nm
    into a;
    v_names := string_to_array(s.names, '|');
    -- The right place: open, in the seed's chapter, named like it (an address seed takes the establishment there, never the address itself).
    if coalesce(p->>'businessStatus', 'OPERATIONAL') <> 'OPERATIONAL'
       or not (coalesce(ve_chapter_of(a.city, case when a.country = 'GB' then null else a.st0 end), '') = s.hub
               or (s.hub = 'london' and a.country = 'GB') or (s.hub = 'new-york' and a.st0 = 'NY'))
       or (s.names ~ '^[0-9]' and ((p->'types') ?| array['street_address','premise','subpremise'] or p->>'primaryType' is null))
       or (s.names !~ '^[0-9]' and similarity(lower(a.nm), lower(v_names[1])) < 0.25
           and position(lower(split_part(regexp_replace(v_names[1], '^(The|the) ', ''), ' ', 1)) in lower(a.nm)) = 0) then
      update ve_event_venue_seed set result = 'no match: ' || coalesce(a.nm, '') || ', ' || coalesce(p->>'businessStatus', '') || ', ' || coalesce(a.city, '') where n = s.n;
      n_skip := n_skip + 1; continue;
    end if;
    select l.id into v_lid from listings l where l.google_place_id = p->>'id'
       or (ve_norm_name(l.name) = ve_norm_name(a.nm) and lower(coalesce(l.address_city, '')) = lower(coalesce(a.city, '')))
      order by (l.status = 'approved') desc limit 1;
    if v_lid is not null then
      update ve_event_venue_seed set listing_id = v_lid, result = 'already listed' where n = s.n; n_had := n_had + 1;
    else
      select case when count(*) = 0 then null
          when bool_or(o.per->'close' is null) then jsonb_build_object('Monday','Open 24 hours','Tuesday','Open 24 hours','Wednesday','Open 24 hours','Thursday','Open 24 hours','Friday','Open 24 hours','Saturday','Open 24 hours','Sunday','Open 24 hours')
          else (select jsonb_object_agg(dn, coalesce((select string_agg(
                replace(to_char(make_time((x->'open'->>'hour')::int, coalesce((x->'open'->>'minute')::int,0), 0), 'FMHH12:MI AM'), ':00 ', ' ') || ' to ' ||
                replace(to_char(make_time((x->'close'->>'hour')::int, coalesce((x->'close'->>'minute')::int,0), 0), 'FMHH12:MI AM'), ':00 ', ' '), ', '
                order by (x->'open'->>'hour')::int, (x->'open'->>'minute')::int)
              from jsonb_array_elements(p->'regularOpeningHours'->'periods') x where (x->'open'->>'day')::int = di), 'Closed'))
            from unnest(array['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']) with ordinality w(dn, di1), lateral (select (di1 - 1)::int di) z) end
        into v_hours from jsonb_array_elements(coalesce(p->'regularOpeningHours'->'periods', '[]'::jsonb)) o(per);
      v_base := trim(both '-' from regexp_replace(lower(a.nm), '[^a-z0-9]+', '-', 'g'));
      v_slug := case when not exists (select 1 from listings where slug = v_base) then v_base
        when not exists (select 1 from listings where slug = v_base || '-' || trim(both '-' from regexp_replace(lower(coalesce(a.city, '')), '[^a-z0-9]+', '-', 'g')))
          then v_base || '-' || trim(both '-' from regexp_replace(lower(coalesce(a.city, '')), '[^a-z0-9]+', '-', 'g'))
        else v_base || '-' || left(md5(p->>'id'), 4) end;
      v_desc := coalesce(nullif(p->'editorialSummary'->>'text', ''),
        coalesce(p->'primaryTypeDisplayName'->>'text', 'A venue') || ' in ' || coalesce(a.city, 'the area') || '.');
      if s.kind = 'v' then v_desc := left(v_desc || ' Vegan events were held here in 2026.', 250); end if;
      insert into listings (name, slug, category, specialty, description, status, website, phone, location, address_street, address_city,
          address_state, address_zip, address_country, latitude, longitude, google_place_id, google_hours_json, business_status, vegan_status,
          initials, crawl_source, communities, details, updated_at)
        values (a.nm, v_slug, case when s.kind = 'v' then 'Event Venues' else 'Uncategorized' end, '', v_desc,
          case when s.kind = 'v' then 'approved' else 'quarantined' end, coalesce(p->>'websiteUri', ''),
          coalesce(p->>'nationalPhoneNumber', p->>'internationalPhoneNumber'),
          coalesce(nullif(concat_ws(', ', a.city, case when a.country = 'GB' then null else a.st0 end), ''), a.city), a.street, a.city,
          case when a.country = 'GB' then null else a.st0 end, a.zip, a.country,
          (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', v_hours, 'OPERATIONAL', null,
          upper(left(regexp_replace(a.nm, '[^A-Za-z]', '', 'g'), 2)), 'event-venue-search', array[s.hub],
          jsonb_build_object('event_venue_search', jsonb_build_object('hub', s.hub, 'at', now(), 'event_names', v_names,
              'google_type', p->>'primaryType', 'place_id', p->>'id', 'rating', p->'rating', 'reviews', p->'userRatingCount'),
            'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
              'text', 'Added from the places Vegan events were held in 2026 (Sean, 2026-11-01). Its events are linked on the page.'))),
          now())
        returning id into v_lid;
      if s.kind = 'f' then
        insert into ve_backlog_checks (listing_id, track, stage, verdict, reason, community_slug, city_guess, place, checked_at)
        values (v_lid, 'google', 'done', 'list',
          'From the places Vegan events were held in 2026 (Sean, 2026-11-01): a Vegan or vegetarian food place that hosted one (' ||
            coalesce(p->'primaryTypeDisplayName'->>'text', 'Google') || '). Pick its kind and How Vegan.',
          s.hub, a.city,
          jsonb_build_object('id', p->>'id', 'name', a.nm, 'address', p->>'formattedAddress', 'street', a.street, 'city', a.city,
            'state', a.st0, 'zip', a.zip, 'country', a.country, 'lat', (p->'location'->>'latitude')::float, 'lng', (p->'location'->>'longitude')::float,
            'status', coalesce(p->>'businessStatus', 'OPERATIONAL'), 'rating', (p->>'rating')::float, 'reviews', (p->>'userRatingCount')::int,
            'website', p->>'websiteUri', 'phone', p->>'nationalPhoneNumber', 'type_name', p->'primaryTypeDisplayName'->>'text', 'types', p->'types'),
          now());
        n_food := n_food + 1;
      else n_new := n_new + 1; end if;
      update ve_event_venue_seed set listing_id = v_lid, result = case when s.kind = 'v' then 'listed' else 'ready to list' end where n = s.n;
    end if;
    update events set venue_listing_id = v_lid
      where tenant_id = '00000000-0000-4000-a000-000000000002' and venue_listing_id is null
        and lower(coalesce(city, '')) = lower(s.city) and ve_norm_name(location_name) = any (select ve_norm_name(x) from unnest(v_names) x);
    get diagnostics v_k = row_count; v_linked := v_linked + v_k;
  end loop;
  return jsonb_build_object('new_venues', n_new, 'ready_to_list', n_food, 'already_listed', n_had, 'skipped', n_skip,
    'events_linked', v_linked, 'sync', ve_event_venues_sync());
end $$;
revoke all on function public.ve_event_venue_import() from public, anon, authenticated;

-- Fire the searches (run once Google's daily quota has room; a refused one costs nothing and is fired again).
create or replace function public.ve_event_venue_search() returns int
language plpgsql security definer set search_path = public as $$
declare v_key text; n int := 0; s record;
begin
  select value into v_key from lesaruss_secrets where key = 'GOOGLE_PLACES_API_KEY';
  for s in select * from ve_event_venue_seed sd where listing_id is null and (req_id is null or exists (select 1 from net._http_response r
      where r.id = sd.req_id and r.status_code = 429)) loop
    update ve_event_venue_seed set result = null, req_id = net.http_post(url := 'https://places.googleapis.com/v1/places:searchText',
      body := jsonb_build_object('textQuery', s.query, 'pageSize', 3),
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-Goog-Api-Key', v_key, 'X-Goog-FieldMask',
        'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.businessStatus,places.primaryType,places.primaryTypeDisplayName,places.types,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.editorialSummary,places.regularOpeningHours'),
      timeout_milliseconds := 20000) where n = s.n;
    n := n + 1;
  end loop;
  if n > 0 then perform ve_google_count('search', 'once:event-venues', n); end if;
  return n;
end $$;
revoke all on function public.ve_event_venue_search() from public, anon, authenticated;

-- The first try (2026-11-01, 5 PM Eastern) found the day's 500 text searches already spent: all 95 were refused (429), never billed.
delete from public.ve_google_usage where job = 'once:event-venues' and day = '2026-11-01';

select cron.unschedule('ve-event-venues-sync') where exists (select 1 from cron.job where jobname = 've-event-venues-sync');
select cron.schedule('ve-event-venues-sync', '47 8 * * *', $$select public.ve_event_venues_sync()$$);

-- Tonight, once Google's quota resets at midnight Pacific (3 AM Eastern): the searches at 3:10 AM Eastern, the import at 3:25.
-- Each job removes itself after it runs.
select cron.unschedule(jobname) from cron.job where jobname in ('ve-event-venues-search-once', 've-event-venues-import-once');
select cron.schedule('ve-event-venues-search-once', '10 8 2 11 *',
  $$select public.ve_event_venue_search(); select cron.unschedule('ve-event-venues-search-once');$$);
select cron.schedule('ve-event-venues-import-once', '25 8 2 11 *',
  $$select public.ve_event_venue_import(); select cron.unschedule('ve-event-venues-import-once');$$);

-- Link the events at places already in the Directory now (no Google needed).
select public.ve_event_venues_sync();
