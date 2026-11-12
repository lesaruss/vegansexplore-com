-- Directory: places from Sean's screenshots, menus and events that were missing (Sean, 2026-11-10: "add Revolution Philadelphia to the
-- Community Section for Philadelphia... make sure none of them are missing. Remember it's the group and venue that we're adding to each
-- chapter"). Added by the team, live at once (crawl_source 'admin', details.added_by_hand), the way Add a listing does. Facts from their
-- own posts Sean sent and from web search (2026-11-10); what could not be confirmed is left empty. The About lines are ours. A group is
-- tagged with its chapter (communities), which is what puts it in the chapter's Community section. Safe to run twice (skips a slug
-- already used). Left out on purpose: Philadelphia City Hall (the roast giveaway's venue: landmarks and parks stay out of Event Venues),
-- and the pickup spots that are not event venues (Weavers Way Henry Got Crops, Globe Dye Works, Hall's on 5th).
with src(slug, name, category, vegan_status, street, city, state, zip, phone, website, instagram, about, communities, color, note) as (values
  ('revolution-philadelphia', 'Revolution Philadelphia', 'Groups', null, null, 'Philadelphia', 'PA', null, null, 'https://rev-philly.org', 'revolution_philadelphia',
   'A grassroots, women-led animal rights group in Philadelphia that works through street outreach, education and work with lawmakers to build a Vegan city.',
   array['philadelphia'], '#7a1f2b', 'Hosts the free Vegan roast giveaway at City Hall (event 709a498a).'),
  ('food-revolution-network', 'Food Revolution Network', 'Health and Wellness', null, null, 'Santa Cruz', 'CA', null, null, 'https://foodrevolution.org', null,
   'An online food education network founded by John and Ocean Robbins in 2012, teaching how plant-powered eating supports health, people and the planet.',
   array['all'], '#2f6b3a', 'Hosts the free online coaching workshop, Nov 17 to 19 (event 9b224524). A company, not a nonprofit.'),
  ('sunflower-bakehouse', 'Sunflower Bakehouse', 'Bakeries & Cafes', 'fully_vegan', '2414 Lebanon Pike', 'Nashville', 'TN', '37214', '(615) 750-5499', 'https://ilovesunflower.com', 'sunflowernashbakehouse',
   'An all Vegan and gluten-free bakery and cafe in Donelson, sister to Sunflower Cafe, with cupcakes and baked goods, sandwiches, salads, smoothies and coffee.',
   array[]::text[], '#c98a12', 'Holiday menu in Sean''s screenshot IMG_8169.'),
  ('the-baked-vegan', 'The Baked Vegan', 'Vendors', 'fully_vegan', null, 'Gainesville', 'FL', null, null, null, 'bakedvegan_gnv',
   'A home Vegan micro bakery run by Brie-Anne Ezratty, selling cinnamon rolls, conchas, cheesecakes and gluten-free sweets at Gainesville farmers markets.',
   array['north-florida'], '#8a4b2a', 'Sells at the Grove Street Farmers Market (WUFT, 2026-06-03). Sean''s screenshot IMG_8157.'),
  ('planted-soul-atl', 'Planted Soul', 'Catering', 'fully_vegan', null, 'Atlanta', 'GA', null, null, null, 'plantedsoulatl',
   'A 100% Vegan soul food kitchen in the Atlanta area, known for chick''n, mac and cheese, collard greens and candied yams, now taking holiday catering orders.',
   array['atlanta'], '#5b3a1e', 'College Park storefront reported closed; taking 2026 Thanksgiving orders (Sean''s screenshots IMG_8156, IMG_8166).'),
  ('a-broken-angel', 'A Broken Angel', 'Food Trucks', 'fully_vegan', '1124 NW Newport Ave', 'Bend', 'OR', null, '(458) 202-9334', 'https://abrokenangel.com', null,
   'Bend''s original Vegan food cart, known for scratch biscuits and gravy, tofu scramble and breakfast sandwiches, with catering and a holiday feast.',
   array[]::text[], '#3d3d3d', 'Posted a 2026 Thanksgiving Feast for Four (live found menu).'),
  ('vegans-on-the-run', 'Vegans on the Run', 'Restaurants', 'fully_vegan', '1210 Milam St', 'Shreveport', 'LA', null, null, 'https://thevegansontherun.com', null,
   'A family-owned, Black-owned Vegan kitchen in Shreveport founded by Dr. Joslin Pickens, cooking 100% Vegan Louisiana soul food.',
   array[]::text[], '#6b2d1a', 'VegNews: a new location (Sean''s screenshot IMG_8136). Address is their earlier base; check the new one.'),
  ('blondies-vegan-bakery-cafe', 'Blondie''s Vegan Bakery & Cafe', 'Bakeries & Cafes', 'fully_vegan', '870 N Congress Ave, Suite 110', 'Boynton Beach', 'FL', '33426', null, 'https://blondiesvegan.com', null,
   'A Vegan bakery and cafe in Boynton Beach with a gluten-free, nut-free kitchen, baking cakes and sweets and cooking seasonal meals for delivery.',
   array['south-florida'], '#b5651d', 'Fall menu with delivery through Nov 20 (Sean''s screenshots IMG_8138, IMG_8139). Storefront status not confirmed.')
)
insert into listings (slug, name, category, specialty, description, location, website, status, initials, color, vegan_status, address_street, address_city,
  address_state, address_zip, address_country, phone, instagram, ig_handle, communities, crawl_source, listed_at, details)
select s.slug, s.name, s.category, '', s.about, concat_ws(', ', s.city, s.state), coalesce(s.website, ''), 'approved',
  upper(left(regexp_replace(s.name, '^(The|A) ', ''), 1)), s.color, s.vegan_status, s.street, s.city, s.state, s.zip, 'US', s.phone, s.instagram, s.instagram,
  s.communities, 'admin', now(),
  jsonb_build_object('added_by_hand', true, 'team_note', s.note, 'added_from', 'Sean''s screenshots and holiday menus, 2026-11-10')
from src s
where not exists (select 1 from listings l where l.slug = s.slug);

-- A group already listed but in no chapter: the Sarasota Vegan Society belongs to Central Florida (its board area "Sarasota and
-- Southwest Florida").
update listings set communities = array['central-florida'], updated_at = now()
where slug = 'the-sarasota-vegan-society' and communities = '{}';

-- Today's events: hosts and venues.
update events set host_listing_id = (select id from listings where slug = 'revolution-philadelphia')
where id = '709a498a-6735-40c4-846e-bad4f2172afe' and host_listing_id is null;
update events set host_listing_id = (select id from listings where slug = 'food-revolution-network')
where id = '9b224524-2f28-4768-a806-bfc70aa865e6' and host_listing_id is null;
update events set venue_listing_id = (select id from listings where slug = 'dc-vegan' and status = 'approved')
where id = '5e0cab7f-fd90-406e-a444-d6a41e8d92bd' and venue_listing_id is null;
update events set venue_listing_id = (select id from listings where slug = 'dope-vegan' and status = 'approved')
where id = 'd45215cd-eab0-4e02-8cc7-4482c08fa2dd' and venue_listing_id is null;

-- The found menus for places that had no listing now point to them.
update ve_holiday_menu_tips t set listing_id = l.id, updated_at = now() from listings l
where t.listing_id is null and l.status = 'approved' and l.slug = case t.place_name
  when 'Blondies Vegan Bakery & Cafe' then 'blondies-vegan-bakery-cafe' when 'Planted Soul ATL' then 'planted-soul-atl'
  when 'Sunflower Bakehouse' then 'sunflower-bakehouse' when 'A Broken Angel' then 'a-broken-angel' end;
