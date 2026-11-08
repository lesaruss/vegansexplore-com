-- ve-community-directory T1: Juices For Life (Styles P and Adjua Styles), Sean's find (Blueprint idea f8adc4c3, 2026-11-06).
-- Google (once:juices-for-life-2026-11-08, 3 text searches) shows three open shops: Juices For Life at 1026 Castle Hill Ave and at
-- 3463 E Tremont Ave in the Bronx, and Juice 2 Heal at 180 Grand St, White Plains (the 2024 rebrand; Black Enterprise, News 12).
-- No Yonkers shop came back from Google, so none is listed. How Vegan: no source confirms an all-Vegan menu (HappyCow files it as a
-- juice bar, shakes on the menu), so Vegan options; vetted by us because it is Sean's own find. juicesforlife.shop is a third-party
-- menu site, not theirs, so the Bronx shops carry no website. Castle Hill is the main listing; the others are its locations.
with main as (
  insert into listings (name, slug, category, specialty, description, status, location, website, phone, address_street, address_city,
    address_state, address_zip, address_country, latitude, longitude, google_place_id, google_rating, google_reviews_count, business_status,
    google_hours_json, vegan_status, initials, crawl_source, communities, is_black_owned, founder_name, year_founded, vetted_at, cuisines,
    location_label, details, tenant_id)
  values ('Juices For Life', 'juices-for-life', 'Restaurants', '',
    'The Bronx juice bar Styles P and Adjua Styles opened in 2011 after going plant-based themselves: fresh juices, smoothies and wellness shots made to order. The brand is being renamed Juice 2 Heal.',
    'approved', 'Bronx, NY', '', '(347) 281-9844', '1026 Castle Hill Ave', 'Bronx', 'NY', '10472', 'US', 40.8282592, -73.8498464,
    'ChIJ3Y2r5c70wokRgOILBVRT9CE', 4.7, 804, 'OPERATIONAL',
    '{"Monday":"7 AM to 9 PM","Tuesday":"7 AM to 9 PM","Wednesday":"7 AM to 9 PM","Thursday":"7 AM to 9 PM","Friday":"7 AM to 9 PM","Saturday":"9 AM to 9 PM","Sunday":"12 to 7 PM"}'::jsonb,
    'vegan_options', 'JF', 'admin', array['new-york'], true, 'Styles P and Adjua Styles', 2011, now(), '{}'::text[], 'Castle Hill',
    jsonb_build_object('added_by_hand', jsonb_build_object('by','Logan','at',now()), 'listing_request', jsonb_build_object('idea','f8adc4c3-257a-4b95-be60-423a0a872632','from','sean'),
      'admin_notes', jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note','text','Sean''s find (8 At The Table post). From Google, 2026-11-08. How Vegan is Vegan options until their menu confirms more; vetted by us as Sean''s find.'))),
    '00000000-0000-4000-a000-000000000002'::uuid)
  returning id, tenant_id)
insert into listings (name, slug, category, specialty, description, status, location, website, instagram, ig_handle, phone, address_street, address_city,
    address_state, address_zip, address_country, latitude, longitude, google_place_id, google_rating, google_reviews_count, business_status,
    google_hours_json, vegan_status, initials, crawl_source, communities, is_black_owned, founder_name, vetted_at, parent_id, location_label, details, tenant_id)
select v.name, v.slug, 'Restaurants', '', v.descr, 'approved', v.loc, v.site, v.ig, v.igh, v.phone, v.street, v.city, 'NY', v.zip, 'US', v.lat, v.lng, v.pid, v.rating, v.cnt,
  'OPERATIONAL', v.hours::jsonb, 'vegan_options', 'JF', 'admin', array['new-york'], true, 'Styles P and Adjua Styles', now(), main.id, v.label,
  jsonb_build_object('added_by_hand', jsonb_build_object('by','Logan','at',now()), 'listing_request', jsonb_build_object('idea','f8adc4c3-257a-4b95-be60-423a0a872632','from','sean'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note','text','Location of Juices For Life (Sean''s find). From Google, 2026-11-08.'))),
  main.tenant_id
from main, (values
  ('Juices For Life - Throggs Neck','juices-for-life-throggs-neck','A second Bronx shop of Juices For Life, the juice bar Styles P and Adjua Styles opened after going plant-based: fresh juices and smoothies made to order.',
   'Bronx, NY','',null,null,'(347) 293-7005','3463 E Tremont Ave','Bronx','10465',40.83198,-73.827121,'ChIJ1R_8eEeLwokROHrHRMfeoXo',4.8,240,
   '{"Monday":"7 AM to 9 PM","Tuesday":"7 AM to 9 PM","Wednesday":"7 AM to 9 PM","Thursday":"7 AM to 9 PM","Friday":"7 AM to 9 PM","Saturday":"9 AM to 9 PM","Sunday":"11 AM to 6 PM"}','Throggs Neck'),
  ('Juice 2 Heal - White Plains','juice-2-heal-white-plains','Juice 2 Heal is the new name for Juices For Life, the juice bar Styles P and Adjua Styles started after going plant-based. The White Plains shop opened in 2024 with fresh juices, smoothies and wellness shots.',
   'White Plains, NY','https://juice2heal.com/','@juice2heal','juice2heal','(914) 355-7550','180 Grand St','White Plains','10601',41.0280453,-73.7675211,'ChIJYSpIJSaVwokRk_QsV9CS-oA',4.8,30,
   '{"Monday":"8 AM to 6 PM","Tuesday":"8 AM to 6 PM","Wednesday":"8 AM to 6 PM","Thursday":"8 AM to 6 PM","Friday":"8 AM to 6 PM","Saturday":"10 AM to 6 PM"}','White Plains')
) v(name, slug, descr, loc, site, ig, igh, phone, street, city, zip, lat, lng, pid, rating, cnt, hours, label);
