-- Community is the animals first (Sean, 2026-10-27: "there's a lot of backlash on brands that don't put the animals first... I
-- really want that to be what the community directory is all about... nonprofits... events... rescues... sanctuaries"), and
-- Food Trucks and Vendors are apart ("you might be just looking for a food truck event"). The site's lists changed with it
-- (ve-region-directory.js, ve-listing-admin.js, ve-trust.js, Directory review, listing.html, claim.html, ve-claims, ve-outreach,
-- ve-discover).

-- 1. The database's food-place lists.
create or replace view public.ve_restaurant_essentials as
 SELECT id, slug, name, category, address_city, address_state,
    (length(COALESCE(description, ''::text)) >= 150) AS has_about,
    (COALESCE(NULLIF((google_hours_json)::text, ''::text), 'null'::text) <> ALL (ARRAY['null'::text, '{}'::text, '[]'::text, '""'::text])) AS has_hours,
    ((COALESCE(instagram, ''::text) <> ''::text) OR (COALESCE(facebook, ''::text) <> ''::text) OR (COALESCE(tiktok, ''::text) <> ''::text)) AS has_socials,
    (COALESCE(address_street, ''::text) <> ''::text) AS has_address,
    (EXISTS ( SELECT 1 FROM ve_menu_items m WHERE (m.listing_id = l.id))) AS has_menu,
    (cardinality(cuisines) > 0) AS has_cuisine, website, google_place_id
   FROM listings l
  WHERE ((status = 'approved'::text) AND (category = ANY (ARRAY['Restaurants'::text, 'Bakeries & Cafes'::text, 'Food Trucks'::text, 'Vendors'::text, 'Catering'::text, 'Meal Prep'::text]))
    AND (COALESCE(business_status, 'OPERATIONAL'::text) <> 'CLOSED_PERMANENTLY'::text));

do $$ declare d text; begin
  d := pg_get_functiondef('public.ve_menu_import_queue'::regproc);
  execute replace(d, '''Food Trucks & Vendors''', '''Food Trucks'', ''Vendors''');
  d := pg_get_functiondef('public.ve_directory_review_flags'::regproc);
  execute replace(d, 'l.category = ''Food Trucks & Vendors''', 'l.category in (''Food Trucks'', ''Vendors'')');
end $$;

-- 2. Food Trucks & Vendors rows: a truck is a truck, everything else vends.
update public.listings set extra_categories = array_replace(extra_categories, 'Food Trucks & Vendors', 'Food Trucks') where slug = 'on-the-run-vegan';
update public.listings set extra_categories = array_replace(extra_categories, 'Food Trucks & Vendors', 'Vendors') where 'Food Trucks & Vendors' = any(extra_categories);
update public.listings set category = 'Vendors' where category = 'Food Trucks & Vendors';

-- 3. The Community Partners (a spreadsheet import, 2026-06) into what they are, from Google and their Instagram bios.
update public.listings l set category = v.cat, updated_at = now(),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('admin_notes', coalesce(l.details->'admin_notes', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'by', 'Logan', 'kind', 'note',
      'text', 'Moved from Community Partner to ' || v.cat || ' (' || v.why || ').')))
from (values
  ('amy-s-lil-chunks-of-love', 'Vendors', 'Instagram: Vegan and gluten-free cookies, shipped'),
  ('benevolence-naturals-llc-orlando', 'Beauty and Personal Care', 'Instagram: handmade Vegan soaps'),
  ('bodybuildingvegan-llc-tampa-fl', 'Coaches and Consultants', 'Instagram: Vegan bodybuilding coach'),
  ('funky-love-fort-lauderdale', 'Restaurants', 'Google: Vegan hot dogs, Fort Lauderdale'),
  ('imo-s-bakery-orlando', 'Bakeries & Cafes', 'its name'),
  ('impact-island-cafe', 'Restaurants', 'Google: Caribbean restaurant, Ocala'),
  ('innergcafe-winter-haven', 'Restaurants', 'Google: Vegan restaurant, Winter Haven'),
  ('karelyn-s-vegan-orlando', 'Restaurants', 'Google: Chef Kev''s by Karelyn''s Vegan, Orlando'),
  ('nature-s-wellness-care-ocala', 'Health and Wellness', 'Instagram: natural home health care and a juice bar'),
  ('natuurlik-vegan-restaurant-boynton-beach', 'Restaurants', 'its name and Google'),
  ('tees-from-the-crisper-buffalo', 'Clothing and Fashion', 'its name'),
  ('the-kind-cleaver-orlando', 'Vendors', 'a Vegan butcher that sells at markets'),
  ('the-vegan-halal-cart-tampa', 'Food Trucks', 'Instagram: a Vegan halal cart and truck'),
  ('the-vegan-witch-largo', 'Health and Wellness', 'Instagram: sea moss, Reiki and holistic healing')
) v(slug, cat, why) where l.slug = v.slug and l.status = 'approved';
-- What Google adds where we had nothing.
update public.listings set address_street = '1758 SE 58th Ave', address_city = 'Ocala', address_state = 'FL', address_zip = '34480', website = 'http://www.impactisland.co/'
  where slug = 'impact-island-cafe' and coalesce(address_street, '') = '';
update public.listings set address_street = '745 Bennett Rd', address_zip = '32803', website = 'http://chefkevs.com/', business_status = 'CLOSED_TEMPORARILY'
  where slug = 'karelyn-s-vegan-orlando' and coalesce(address_street, '') = '';
update public.listings set address_street = '1436 N Federal Hwy Ste B', address_zip = '33304', website = 'https://fortlauderdaleveganhotdogs.com/', business_status = 'CLOSED_TEMPORARILY'
  where slug = 'funky-love-fort-lauderdale' and coalesce(address_street, '') = '';
update public.listings set address_city = null where slug = 'amy-s-lil-chunks-of-love' and address_city = 'TBD';
-- Google shows these two closed for good: kept under Closed, for memory.
select public.ve_listing_set_state(id, 'closed', null, 'Google shows it permanently closed (Logan, 2026-10-27).') from public.listings
  where slug in ('natuurlik-vegan-restaurant-boynton-beach', 'innergcafe-winter-haven') and status = 'approved';
-- Nothing to sort these by (no website, address or bio): on hold in Directory review, each with what we know.
select public.ve_listing_set_state(l.id, 'hold', null, null, array['Was a Community Partner with no website, address or bio to sort it by (Logan, 2026-10-27)', v.hint])
from public.listings l join (values
  ('avrora-vegan-fit-honolulu', 'Maybe a fitness coach (Coaches and Consultants)'),
  ('awakened-bean-st-petersburg', 'A coffee roaster (Food Brands); its Instagram is quiet, it may be closed'),
  ('buku-vegan-orlando', 'Nothing found'),
  ('enagic-kangen-water-south-florida', 'Enagic sells water ionizers; not a Vegan business, probably Remove'),
  ('hydrate-heroes-clearwater', 'Nothing found'),
  ('jp-jenn-ontario', 'Nothing found (Ontario, Canada)'),
  ('love-blossoms-essentials-plantation', 'Maybe Beauty and Personal Care'),
  ('my-hungry-vegan-riverview', 'Maybe a food truck or a vendor (Riverview, FL)'),
  ('my-v-spot-jacksonville', 'Nothing found (Jacksonville)'),
  ('overly-kind-denver', 'Has a website, overlykind.com (Wheat Ridge, CO): check what it is'),
  ('oxy-s-way-orlando', 'Nothing found'),
  ('royce', 'A person (Royce Ashcroft) whose accounts are gone; probably Remove'),
  ('the-vegan-restaurants-loxahatchee', 'Its Instagram is gone; probably Remove'),
  ('trypleca-asset-management-orlando', 'Asset management; not a Vegan business, probably Remove'),
  ('tume-orlando', 'Nothing found')
) v(slug, hint) on l.slug = v.slug where l.status = 'approved';

-- 4. The two already in Community, where they belong now.
update public.listings set category = 'Rescues' where slug = 'florida-animal-rescue-alliance' and category = 'Nonprofits';
update public.listings set category = 'Sanctuaries' where slug = 'little-bear-sanctuary' and category = 'Nonprofits';

-- 5. From Sean's Instagram list (ve_businesses import), the ones Google and their own websites confirm, listed the way New places
-- lists one (backlog_decide). No How Vegan: they are organizations, not businesses.
update public.listings l set status = 'approved', slug = v.slug, name = v.name, category = v.cat, vegan_status = null, website = v.site,
  description = v.about, address_street = nullif(v.street, ''), address_city = nullif(v.city, ''), address_state = nullif(v.state, ''), address_zip = nullif(v.zip, ''),
  phone = nullif(v.phone, ''), communities = case when v.everywhere then array['all'] else l.communities end, business_status = 'OPERATIONAL',
  location = coalesce(nullif(concat_ws(', ', nullif(v.city, ''), nullif(v.state, '')), ''), 'Online'), updated_at = now(),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('added_from', 'community-sort-2026-10-27',
    'admin_notes', coalesce(l.details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'by', 'Logan', 'kind', 'note', 'text', 'Listed from Sean''s Instagram list after Google and its website confirmed it (2026-10-27).')))
from (values
  ('7f526ffe-c091-4720-9303-ea69c9195e9b'::uuid, 'the-muscovy-sanctuary-of-florida', 'The Muscovy Sanctuary of Florida', 'Sanctuaries', 'https://muscovysanctuary.org/',
    'Rescuing and protecting Muscovy ducks across Florida: help for injured ducks, care for ducklings, and education.', '12818 Raysbrook Dr', 'Riverview', 'FL', '33569', '(813) 616-9639', false),
  ('1dac3038-e682-4118-91c2-5f2f37ad219e'::uuid, 'rowdy-girl-sanctuary', 'Rowdy Girl Sanctuary', 'Sanctuaries', 'https://rowdygirlsanctuary.org/',
    'A farm animal sanctuary in cattle ranching country outside Austin, where animals are friends and family, not food.', '634 FM 1296', 'Waelder', 'TX', '78959', '(979) 314-9925', false),
  ('e1f75ac0-11c8-4f9b-abd4-7e110746fa40'::uuid, 'ufar-animals-rescue', 'UFAR Animals Rescue', 'Rescues', 'https://ufarescue.org/',
    'A shelter, rescue and adoption center giving abandoned and neglected dogs and cats food, shelter, medical care and love.', '366-364 S State Rd 7', 'Margate', 'FL', '33068', '(954) 761-6814', false),
  ('bf3b2fd5-f536-4acd-a94b-2ca6248f6973'::uuid, 'mercy-for-animals', 'Mercy For Animals', 'Nonprofits', 'https://mercyforanimals.org/',
    'An international nonprofit working to end the exploitation of animals raised for food.', '8033 Sunset Blvd Ste 864', 'Los Angeles', 'CA', '90046', '(866) 632-6446', true),
  ('b723cca0-f500-4cf2-bd4d-1068ba8186f2'::uuid, 'the-humane-league', 'The Humane League', 'Nonprofits', 'https://thehumaneleague.org/',
    'Working to end the abuse of animals raised for food through company policies, legislation, and people who leave animals off their plates.', '', '', '', '', '', true),
  ('8d016f4c-263d-4791-b735-f0f5883e7ab3'::uuid, 'humane-world-for-animals', 'Humane World for Animals', 'Nonprofits', 'https://www.humaneworld.org/',
    'An animal protection nonprofit working for animals in the US and around the world.', '1255 23rd St NW', 'Washington', 'DC', '20037', '(202) 452-1100', true)
) v(id, slug, name, cat, site, about, street, city, state, zip, phone, everywhere)
where l.id = v.id and l.status = 'quarantined';
update public.ve_backlog_checks set decision = 'listed', decided_at = now() where listing_id in ('7f526ffe-c091-4720-9303-ea69c9195e9b', '1dac3038-e682-4118-91c2-5f2f37ad219e',
  'e1f75ac0-11c8-4f9b-abd4-7e110746fa40', 'bf3b2fd5-f536-4acd-a94b-2ca6248f6973', 'b723cca0-f500-4cf2-bd4d-1068ba8186f2', '8d016f4c-263d-4791-b735-f0f5883e7ab3');

-- 6. The rest of Sean's rescues, sanctuaries and nonprofits are known only on Instagram (no Google profile to confirm where they are):
-- waiting in Business outreach > New places > Ready to list, where Add to the Directory takes Rescues, Sanctuaries or Nonprofits.
update public.ve_backlog_checks set verdict = 'list', decision = null,
  reason = 'A rescue, sanctuary or nonprofit from your Instagram list: confirm where it is, then Add it under Community (Logan, 2026-10-27)'
where listing_id in ('0f529adc-3bdc-45a9-b5d5-32eb4ec76b4b', 'e1784fad-5180-4826-bd37-49ca362096c9', '6c29d245-6479-4c99-819d-a5cea8bab5ac',
  '7c196e6e-0fb2-498b-8777-29d42b14344e', 'd2c1c518-1218-4008-aca0-438edf250e58', '783c2ebd-6fb2-49bf-8aa1-2975e35d599c', '90d4dd3a-e80b-49d0-a4d5-93df39af0b7a',
  '0ec5935a-7f8d-42fb-adb0-506a2e8c9942', '76361b41-a094-4b1e-a499-dbf9506574a3', 'e84e4d7d-62db-405e-a5d8-48ad4cf50bef', '420d61b5-62d4-4c1a-afdf-340da7f7490c',
  '48ff4d51-a332-4f5e-8f4c-4f01c6d56ebc', '1a2503ed-aeff-48dc-91ec-bb19c22b950d', 'be8c1640-26e8-4e85-bd42-35f10e78adfd', '628fe74a-57c0-420c-9e0e-8a08d4e26833');
