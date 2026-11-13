-- Next Level Veggie Grill: load every location (Carrie Davis: "We have a total of 21 restaurants across the US so we'd love to
-- showcase all of them"; Sean, 2026-11-13: "Approved, go load all 21 locations").
-- Source: Google Places (once:nlvg-locations, 6 text searches, about $0.24 at list). nextlevelvg.com/hour-and-locations draws its
-- list in hidden panels the web reader strips, so Google was used. Google shows 19 Next Level restaurants (15 Next Level Veggie Grill,
-- 4 Next Level Burger inside Whole Foods); 6 were already listed (Pasadena, Burbank, Long Beach, Sunset, Tustin, UCLA), these 13 are
-- new. Carrie is asked for the other 2. Next Level Clucker (nextlevelburger.com) is a separate brand and left out.
-- Each new location goes through ve_listing_add_location (the Add a location path: copies logo, socials, website, section, how Vegan
-- from the main listing), then takes: the chain's own name, a third-person description in their own words, their ownership (the
-- same member owns every location), its Google place and map pin. Hours fill in from Google overnight.
-- Bug found on the first run: ve_listing_add_location never sets listings.specialty (NOT NULL, no default), so Add a location failed
-- for every listing (23502). The column now defaults to '' (what the main listings hold), which fixes the button everywhere.
alter table listings alter column specialty set default '';

do $$
declare
  v_main uuid := (select id from listings where slug = 'next-level-veggie-grill-long-beach-b4fc');
  v_owner uuid := 'bb861387-f0bd-475f-8e8b-fdbaa2aa4c76';
  r record; res jsonb; v_slug text;
begin
  for r in select * from (values
    ('Next Level Veggie Grill', 'Downtown Seattle', '1427 4th Avenue', 'Seattle', 'WA', '98101', '(206) 934-1144', 'ChIJuY2aeLNqkFQR8MLeoGy0BI8', 47.6098817, -122.3366367),
    ('Next Level Veggie Grill', 'Ballard', '1401 Northwest 46th Street, Suite 126', 'Seattle', 'WA', '98107', '(206) 800-6090', 'ChIJ7yN0xlMVkFQRoST-J7aeXfg', 47.6619067, -122.3744557),
    ('Next Level Veggie Grill', 'Downtown Portland', '508 Southwest Taylor Street', 'Portland', 'OR', '97204', '(503) 746-8787', 'ChIJk2XwQgUKlVQR-xL00Fo3Ssk', 45.5174162, -122.6786503),
    ('Next Level Veggie Grill', 'Hawthorne', '4121 Southeast Hawthorne Boulevard', 'Portland', 'OR', '97214', '(503) 486-4400', 'ChIJCWLA0vKglVQR8IVL1-T6Fyk', 45.5123265, -122.6197369),
    ('Next Level Veggie Grill', 'Denver', '1605 East Evans Avenue', 'Denver', 'CO', '80210', '(720) 640-6900', 'ChIJz2I6vx1_bIcRrPoM8N8vK_0', 39.6787564, -104.9684732),
    ('Next Level Veggie Grill', 'Cambridge', '57 John F. Kennedy Street', 'Cambridge', 'MA', '02138', '(617) 275-8909', 'ChIJ_19Zfdx344kRNIpiVeu_CuA', 42.3720005, -71.1208147),
    ('Next Level Veggie Grill', 'San Jose', '3055 Olin Avenue, #1030', 'San Jose', 'CA', '95128', '(408) 493-0777', 'ChIJmTv13N_Kj4AR2_USa1ribf8', 37.3210308, -121.949022),
    ('Next Level Veggie Grill', 'El Segundo', '720 South Allied Way', 'El Segundo', 'CA', '90245', '(310) 945-2000', 'ChIJeVigSwC0woARXkfQrh6qeKw', 33.9068699, -118.3900282),
    ('Next Level Veggie Grill', 'Carlsbad', '965 Palomar Airport Road, #100', 'Carlsbad', 'CA', '92011', '(858) 609-6066', 'ChIJHyPyDx5z3IARdwSxZQ6koR8', 33.1214638, -117.3139399),
    ('Next Level Burger', 'Potrero Hill', '450 Rhode Island Street', 'San Francisco', 'CA', '94107', '(415) 358-1100', 'ChIJs43YeTB_j4ARRDNj_MtSPoU', 37.7646573, -122.4027714),
    ('Next Level Burger', 'Concord', '2085 Diamond Boulevard, Suite 150', 'Concord', 'CA', '94520', '(925) 515-2900', 'ChIJhTKd3sBmhYARWkrnnBvEStg', 37.9741929, -122.0584441),
    ('Next Level Burger', 'Austin', '525 North Lamar Boulevard', 'Austin', 'TX', '78703', '(737) 250-8200', 'ChIJKRaaWoy1RIYRYYzpPCibAXA', 30.2706057, -97.7531289),
    ('Next Level Burger', 'Brooklyn', '292 Ashland Place', 'Brooklyn', 'NY', '11217', '(347) 686-8070', 'ChIJNewOPrJbwokRMnBNEBUWveA', 40.686175, -73.9787059)
  ) t(nm, lbl, st, city, state, zip, ph, pid, lat, lng)
  loop
    continue when exists (select 1 from listings where google_place_id = r.pid);
    res := ve_listing_add_location(v_main, r.lbl, r.st, r.city, r.state, r.zip, r.ph, v_owner);
    if not (res->>'ok')::boolean then raise exception 'add % failed: %', r.lbl, res; end if;
    v_slug := case when r.nm = 'Next Level Burger' then
      (select s from (select regexp_replace(lower('next-level-burger-' || r.lbl), '[^a-z0-9]+', '-', 'g') s) x) else res->>'slug' end;
    update listings set
      -- Two places with one name in one city keep the neighborhood after a dash (Seattle, Portland), as ve_listing_add_location names them.
      name = case when r.city in ('Seattle', 'Portland') then r.nm || ' - ' || r.lbl else r.nm end, slug = v_slug, google_place_id = r.pid, latitude = r.lat, longitude = r.lng,
      description = r.nm || ' in ' || r.lbl || ' serves a 100% Vegan menu made with fresh organic vegetables and responsibly sourced, non-GMO ingredients, good for people, animals and the planet.'
        || case when r.nm = 'Next Level Burger' then ' It is part of the Next Level Veggie Grill family.' else '' end,
      owner_member_id = v_owner, claimed_by_member_id = v_owner, claim_status = 'verified',
      website = 'https://www.nextlevelvg.com/', instagram = 'nextlevelvg', updated_at = now()
    where id = (res->>'id')::uuid;
  end loop;
  -- UCLA had no Google place or pin.
  update listings set google_place_id = 'ChIJX8rw75C9woARleqQms_EFHY', latitude = 34.0703779, longitude = -118.4442056,
    phone = coalesce(phone, '(310) 694-5799'), updated_at = now()
  where slug = 'veggie-grill' and google_place_id is null;
end $$;

-- UCLA's state stays "CALIFORNIA": as CA it collides with Sunset on listings_name_city_state_unique_live (same name, Los Angeles).
-- Fix later by naming one with its neighborhood (Carrie is asked about Toluca Lake and Hollywood Dome).

-- The Holiday Feast menu copied to every new location (Carrie: "The menu and ordering details are the same across all locations";
-- Sean approved the reply that promises it). Source: the Long Beach (main) menu, already approved. UCLA waits for Carrie's answer.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range,
  holiday_hours, contact_note, team_note, reviewed_at, submitted_at)
select src.holiday_slug, l.id, src.member_id, 'live', src.summary, src.items, src.order_url, src.order_by, src.pickup, src.price_range,
  src.holiday_hours, src.contact_note, 'Copied from Long Beach 2026-11-13 by Logan (same menu at every location, per Carrie Davis).', now(), now()
from ve_holiday_menus src
join listings main on main.id = src.listing_id and main.slug = 'next-level-veggie-grill-long-beach-b4fc'
join listings l on l.parent_id = main.id and l.slug <> 'veggie-grill'
where src.holiday_slug = 'thanksliving'
  and not exists (select 1 from ve_holiday_menus x where x.listing_id = l.id and x.holiday_slug = src.holiday_slug);
