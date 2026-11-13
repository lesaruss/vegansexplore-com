-- 2026-11-13 (Sean: "I want you to do it in the back end. And then if I need to review the finished listing, I'll review the finished
-- listing. I don't want to go through that process of setting it up"). Graze, Nashville: its Thanksgiving menu was live (Menus We Found
-- batch 2) with no listing. Added the way ve-discover add_create adds one (crawl_source admin, details.added_by_hand), set up like
-- Sunflower Bakehouse (Nashville is not a chapter: communities empty). Facts from its own site and listings: 1888 Eastland Ave,
-- Nashville TN 37206, (615) 686-1060, grazenashville.com, @grazenashville, 100% Vegan. Hours left off (sources disagree); the point is
-- the 37206 ZIP centre until Google fills the exact one. No logo yet (the logo sweep picks it up). Third person. Safe to run twice.
insert into listings (name, slug, category, specialty, description, status, location, website, phone, instagram, address_street,
  address_city, address_state, address_zip, address_country, latitude, longitude, business_status, vegan_status, initials,
  crawl_source, communities, listed_at, details, updated_at)
select 'Graze', 'graze-nashville', 'Restaurants', '',
  'Graze is a 100% Vegan bistro and bar in East Nashville, known for comfort food like the hot tempeh sandwich, chickpea omelette and loaded potatoes, with brunch on the menu.',
  'approved', 'Nashville, TN', 'https://www.grazenashville.com', '(615) 686-1060', 'grazenashville', '1888 Eastland Ave',
  'Nashville', 'TN', '37206', 'US', 36.179319, -86.731083, 'OPERATIONAL', 'fully_vegan', 'G',
  'admin', '{}', now(),
  jsonb_build_object('added_by_hand', jsonb_build_object('by', 'Logan', 'at', now()),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added in the back end for Sean (2026-11-13), from its Thanksgiving menu in the Holiday Guide. Hours and logo still to fill; point is the ZIP centre.'))),
  now()
where not exists (select 1 from listings where slug = 'graze-nashville');

update ve_holiday_menu_tips set listing_id = (select id from listings where slug = 'graze-nashville'), updated_at = now()
where place_name = 'Graze' and holiday_slug = 'thanksliving' and listing_id is null;
