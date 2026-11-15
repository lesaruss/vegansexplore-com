-- Sean, 2026-11-15: "I don't know why you're asking me to approve them. I gave them to you. And why aren't you just creating the
-- listings like you've created all the other listings?" What Sean hands over goes live: no approval sent back to him.
-- 1) The places from Ideas 111526 with no listing get one (approved, added by hand, third person). 2) Each menu tip is tied to its
-- listing and goes live, reviewed by Sean. Safe to run twice.
insert into listings (name, slug, category, specialty, description, status, location, website, instagram, address_street, address_city,
  address_state, business_status, vegan_status, initials, crawl_source, communities, details, updated_at)
select x.name, x.slug, x.cat, '', x.about, 'approved', x.city || ', ' || x.st, x.web, x.ig, x.street, x.city, x.st, 'OPERATIONAL', 'fully_vegan',
  x.ini, 'admin', array[x.ch],
  jsonb_build_object('added_by_hand', jsonb_build_object('by', 'Sean', 'at', now()),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Sean', 'kind', 'note', 'text', 'Added from Sean''s screenshots (Ideas 111526) with its holiday menu.'))),
  now()
from (values
  ('Wong Way Veg', 'wong-way-veg', 'Catering', 'Wong Way Veg is a 100% Vegan kitchen in Denver making Asian-inspired comfort food, with holiday dinners to order for pickup.', 'https://wongwayveg.com', '@wongwayveg', null, 'Denver', 'CO', 'denver', 'WV'),
  ('Loving Hut Glendora', 'loving-hut-glendora', 'Restaurants', 'Loving Hut Glendora is a 100% Vegan restaurant in Glendora, California, with a homemade Vegan turkey and a Thanksgiving menu each November.', '', '@lovinghutglendora', null, 'Glendora', 'CA', 'los-angeles', 'LH'),
  ('Vegan Airyy', 'vegan-airyy', 'Catering', 'Vegan Airyy is a Vegan caterer serving Jacksonville and St. Johns, Florida, with trays that feed up to 10.', '', '@veganairyy', null, 'Jacksonville', 'FL', 'north-florida', 'VA'),
  ('Follow Your Heart Market & Cafe', 'follow-your-heart-market-cafe', 'Restaurants', 'Follow Your Heart Market & Cafe in Canoga Park is the Vegan market and cafe behind the Follow Your Heart brand, serving breakfast, lunch and dinner.', '', '@fyhmarketcafe', null, 'Canoga Park', 'CA', 'los-angeles', 'FY'),
  ('Nana''s Rooted', 'nanas-rooted', 'Vendors', 'Nana''s Rooted serves a Vegan brunch menu at the Trinidad Farmers Market in Washington, D.C., every Sunday, 9 AM to 1 PM.', '', '@nanas.rooted', '1299 Neal St NE', 'Washington', 'DC', 'washington-dc', 'NR')
) as x(name, slug, cat, about, web, ig, street, city, st, ch, ini)
where not exists (select 1 from listings l where l.slug = x.slug or (l.name = x.name and l.status = 'approved'));

update ve_holiday_menu_tips t set listing_id = (select id from listings where slug = m.slug)
from (values ('Wong Way Veg', 'wong-way-veg'), ('Loving Hut Glendora', 'loving-hut-glendora'), ('Vegan Airyy', 'vegan-airyy'),
             ('Follow Your Heart Market & Cafe', 'follow-your-heart-market-cafe'), ('Nana''s Rooted', 'nanas-rooted')) as m(place, slug)
where t.place_name = m.place and t.listing_id is null;

update ve_holiday_menu_tips set status = 'live', reviewed_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', reviewed_at = now(), updated_at = now()
where status = 'pending' and by_team and team_note like '%ideas 111526%';
