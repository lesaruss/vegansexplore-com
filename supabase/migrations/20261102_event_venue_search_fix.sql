-- ve_event_venue_search(): its counter `n` clashed with the seed's `n` column (42702), and it re-fired only seeds whose 429 was
-- still in net._http_response, which pg_net clears after 6 hours, so the 2026-11-02 3:10 AM Eastern run fired nothing.
-- Now: re-fire any seed with no listing and no good (200) answer still held.
create or replace function public.ve_event_venue_search() returns int
language plpgsql security definer set search_path = public as $$
declare v_key text; v_cnt int := 0; s record;
begin
  select value into v_key from lesaruss_secrets where key = 'GOOGLE_PLACES_API_KEY';
  for s in select * from ve_event_venue_seed sd where sd.listing_id is null and (sd.req_id is null or not exists (
      select 1 from net._http_response r where r.id = sd.req_id and r.status_code = 200)) loop
    update ve_event_venue_seed sd set result = null, req_id = net.http_post(url := 'https://places.googleapis.com/v1/places:searchText',
      body := jsonb_build_object('textQuery', s.query, 'pageSize', 3),
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-Goog-Api-Key', v_key, 'X-Goog-FieldMask',
        'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.businessStatus,places.primaryType,places.primaryTypeDisplayName,places.types,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.editorialSummary,places.regularOpeningHours'),
      timeout_milliseconds := 20000) where sd.n = s.n;
    v_cnt := v_cnt + 1;
  end loop;
  if v_cnt > 0 then perform ve_google_count('search', 'once:event-venues', v_cnt); end if;
  return v_cnt;
end $$;
revoke all on function public.ve_event_venue_search() from public, anon, authenticated;
