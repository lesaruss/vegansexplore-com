-- The first groups (Sean, 2026-10-29: "let's do a sweep for those clubs... in South Florida, we have the Vegan Social Club. And
-- I'm sure there's other places like that around the country"). Found through web search and the groups' own Instagram (Apify),
-- each with a post or event in 2025 or 2026. Live ones go on the Directory under Community > Groups in their chapter, and their
-- events page becomes a crawl source tied to them (ve_event_sources.listing_id), so what the Background writer finds there shows
-- on the group's page. Ones we could not confirm are On hold for review in Directory review with why. Nothing here is a business:
-- no How Vegan (vegan_status null), like rescues and nonprofits. Idempotent: a slug already on the Directory is left alone.

create temp table grp (slug text, name text, chapters text[], city text, st text, ctry text, website text, instagram text,
  facebook text, meetup text, events_url text, src_kind text, vegan_only boolean, about text, live boolean, hold_why text) on commit drop;

insert into grp values
 ('vegan-social-club-south-florida','Vegan Social Club',array['south-florida'],null,'FL','US','https://linktr.ee/VeganSocialClubSF','vegansocialclubsoflo',null,null,
  'https://www.instagram.com/vegansocialclubsoflo/','instagram',true,
  'A South Florida Vegan social club that gets together over Vegan food at local restaurants and hosts parties of its own, like a Halloween party in West Palm Beach. Its upcoming events are in its Instagram bio.',true,null),
 ('nyc-vegetarian-vegan-meetup','The New York City Vegetarian & Vegan Meetup',array['new-york'],'New York','NY','US',null,null,null,'https://www.meetup.com/vegetarian-nyc/',
  'https://www.meetup.com/vegetarian-nyc/events/','list',false,
  'A New York City social group for vegetarians and Vegans that meets for dinners at Vegan restaurants and nightlife events, from a Vegan Halloween party to picnics in Central Park.',true,null),
 ('nyc-vegan-spirituality','NYC Vegan Spirituality',array['new-york'],'New York','NY','US',null,null,null,'https://www.meetup.com/nyc-vegan-spirituality/',
  'https://www.meetup.com/nyc-vegan-spirituality/events/','list',true,
  'A New York City Vegan group that holds monthly gatherings with discussion, guided meditation and shared Vegan food, a place to meet others who connect Veganism with a spiritual practice.',true,null),
 ('plant-powered-metro-new-york','Plant Powered Metro New York',array['new-york'],'New York','NY','US','https://ppmny.org',null,null,'https://www.meetup.com/plant-powered-metro-new-york/',
  'https://www.meetup.com/plant-powered-metro-new-york/events/','list',false,
  'A plant-based community network founded in 2019 by volunteers, educators and health professionals. It meets online and around New York City, Long Island, Westchester and New Jersey, with potlucks and house parties.',true,null),
 ('veg-society-of-dc','Veg Society of DC',array['washington-dc','maryland','virginia'],'Washington','DC','US','https://vsdc.org',null,null,'https://www.meetup.com/vegan-dc-md-va/',
  'https://www.meetup.com/vegan-dc-md-va/events/','list',true,
  'The Veg Society of DC brings Vegans together across D.C., Maryland and Virginia with restaurant dinners, a monthly Vegan potluck in Arlington, a book club and a children''s playgroup.',true,null),
 ('baltimore-veg-vegan-meetup','Baltimore Veg/Vegan Meetup',array['maryland'],'Baltimore','MD','US',null,null,null,'https://www.meetup.com/the-baltimore-vegan-meetup-group/',
  'https://www.meetup.com/the-baltimore-vegan-meetup-group/events/','list',false,
  'A Baltimore area group that meets monthly at veg and Vegan restaurants, with conversation about nutrition, food preparation, animal protection, ecology and activism.',true,null),
 ('vegan-club-rva','Vegan Club RVA',array['virginia'],'Richmond','VA','US',null,'veganclubrva',null,null,
  'https://www.instagram.com/veganclubrva/','instagram',true,
  'A Richmond social club all about Vegan food, founded by Lauren Z. Ray. It holds free monthly hangouts and ticketed events, from tastings to a Vegan singles hike, and all are welcome.',true,null),
 ('vegan-social-clubs-atlanta','Vegan Social Clubs',array['atlanta'],'Atlanta','GA','US',null,null,'https://www.facebook.com/VSC.life/','https://www.meetup.com/vsclife/',
  'https://www.meetup.com/vsclife/events/','list',true,
  'An Atlanta Vegan social group started in 2015 by twelve Vegan strangers. It hosts Vegan and Friends, a free weekly Vegan market on Wednesdays, plus documentary nights and restaurant outings.',true,null),
 ('atlanta-veggie-eats','Atlanta Veggie Eats',array['atlanta'],'Atlanta','GA','US',null,null,null,'https://www.meetup.com/atlanta-veggie-eats/',
  'https://www.meetup.com/atlanta-veggie-eats/events/','list',false,
  'An Atlanta Meetup group for veggie and Vegan food lovers that gets together at local Vegan markets and eateries, like the Bien Vegano market in Little Five Points.',true,null),
 ('vegetarians-of-central-florida','Vegetarians of Central Florida',array['central-florida'],'Orlando','FL','US','https://www.cfvegfest.org',null,null,'https://www.meetup.com/vegetarianscf/',
  'https://www.meetup.com/vegetarianscf/events/','list',false,
  'Founded in 2003, Vegetarians of Central Florida hosts regular dinner meetups for veg and Vegan people around Orlando, and organizes Central Florida Veg Fest in the fall and Central Florida Earth Day in the spring.',true,null),
 ('vegan-spirituality-group-philadelphia','Vegan Spirituality Group of Philadelphia',array['philadelphia'],'Philadelphia','PA','US',null,null,null,'https://www.meetup.com/philadelphia-vegan-spirituality-group/',
  'https://www.meetup.com/philadelphia-vegan-spirituality-group/events/','list',true,
  'A Philadelphia Vegan group that meets for Vegan meditation and conversation. Its online sessions run on the first and third Monday of each month, open to Vegans anywhere.',true,null),
 ('los-angeles-vegan-gatherings','Los Angeles Vegan Gatherings',array['los-angeles'],'Los Angeles','CA','US',null,null,null,'https://www.meetup.com/vegangatherings/',
  'https://www.meetup.com/vegangatherings/events/','list',true,
  'A Los Angeles group that runs the roaming No Meat and Mingle Vegan potlucks and other Vegan gatherings around Los Angeles County, from Venice to Vegan spirituality potlucks.',true,null),
 ('vegans-of-los-angeles-meetup','Vegans of Los Angeles',array['los-angeles'],'Los Angeles','CA','US',null,null,null,'https://www.meetup.com/vegans-la/',
  'https://www.meetup.com/vegans-la/events/','list',true,
  'A Los Angeles Vegan Meetup group that hosts potluck picnics and social meetups, like a free music and potluck picnic at LACMA in Hancock Park.',true,null),
 ('london-vegan-meetup','London Vegan Meetup',array['london'],'London',null,'GB',null,null,null,'https://www.meetup.com/londonvegan/',
  'https://www.meetup.com/londonvegan/events/','list',true,
  'A London social group for Vegans and anyone curious, meeting at Vegan restaurants, board game afternoons and park picnics, with a group chat in the London Vegan Network on WhatsApp.',true,null),
 -- On hold: real groups with no dated event we could see, or one we could not tie to Vegan.
 ('philly-social-club','Philly Social Club',array['philadelphia'],'Philadelphia','PA','US','https://www.tickettailor.com/events/phillysocialclub',null,null,null,
  'https://www.tickettailor.com/events/phillysocialclub','list',null,
  'A Philadelphia social club that posts its events on Partiful and Ticket Tailor.',false,
  'Sean named it (2026-10-29). Search found a Philadelphia social club with a White Party for Project HOME and Pints for Pets on Ticket Tailor, but nothing tying it to Vegan; the Instagram @phillysocialclub is an empty account. Confirm it is the one Sean means and add its Instagram or Partiful, then put it back.'),
 ('afro-vegan-social-atlanta','Afro Vegan Social',array['atlanta'],'Atlanta','GA','US',null,null,null,'https://www.meetup.com/black-vegan-life/',
  'https://www.meetup.com/black-vegan-life/events/','list',true,
  'An Atlanta group where people of color and their friends meet other Vegans and aspiring Vegans, with several events a month. Founded as Black Vegan Life by Trish Roberts.',false,
  'Found on Meetup (formerly Black Vegan Life) but no dated event in 2025 or 2026 was visible from search.'),
 ('center-city-philly-vegans','Center City Philly Vegans',array['philadelphia'],'Philadelphia','PA','US',null,null,null,'https://www.meetup.com/centercityphillyvegans/',
  'https://www.meetup.com/centercityphillyvegans/events/','list',true,
  'A Philadelphia Meetup group that explores Vegan friendly bars and restaurants across Center City, with day trips and online events.',false,
  'Found on Meetup but no dated event in 2025 or 2026 was visible from search.'),
 ('lgbtq-vegans-london','LGBTQ+ Vegans London',array['london'],'London',null,'GB',null,null,null,'https://www.meetup.com/lgbt-vegan-london/',
  'https://www.meetup.com/lgbt-vegan-london/events/','list',true,
  'A London group creating fun, inclusive and safe events for people who identify as Vegan and LGBTQ+.',false,
  'Found on Meetup but no dated event in 2025 or 2026 was visible from search.'),
 ('london-vegans','London Vegans',array['london'],'London',null,'GB','https://londonvegans.co.uk/',null,null,'https://www.meetup.com/london-vegans-meetup/',
  'https://londonvegans.co.uk/','website',true,
  'One of the longest running Vegan social groups in London, for Vegans and the Vegan curious, meeting online on the last Wednesday of each month and in person for outings.',false,
  'Its own site describes monthly meetings, but no dated event in 2025 or 2026 was visible from search.'),
 ('vegan-squad-florida','Vegan Squad',array['central-florida'],'Lakeland','FL','US',null,null,null,null,
  'https://www.eventbrite.com/e/vegan-squad-meetup-at-juice-box-cafe-in-lakeland-fl-tickets-1979746544207','list',true,
  'A Florida Vegan meetup crew that turns up together at Vegan community events around the state, including a meetup at Juice Box Cafe in Lakeland in January 2026.',false,
  'Known only from one Eventbrite listing (January 2026) and a Reddit post; no page of its own found.');

-- The Vegan Social Club was already in the June Instagram import, quarantined; it becomes the listing.
update listings l set name = g.name, slug = g.slug, category = 'Groups', status = 'approved', description = g.about, website = coalesce(g.website, g.meetup, ''),
  address_city = g.city, address_state = g.st, address_country = g.ctry, location = concat_ws(', ', g.city, g.st), communities = g.chapters,
  vegan_status = null, business_status = 'OPERATIONAL', updated_at = now(),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('group', jsonb_build_object('events_url', g.events_url, 'vegan_only', g.vegan_only),
    'admin_notes', coalesce(l.details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Listed under Community > Groups (2026-10-29), from the June Instagram import. Its bio and posts (read through Apify) show events in 2026.')))
from grp g where l.slug = 'vegansocialclubsoflo' and g.slug = 'vegan-social-club-south-florida' and l.status = 'quarantined';

insert into listings (name, slug, category, specialty, description, status, website, instagram, ig_handle, facebook, location, address_city,
  address_state, address_country, business_status, vegan_status, initials, communities, crawl_source, details, updated_at)
select g.name, g.slug, 'Groups', '', g.about, case when g.live then 'approved' else 'pending' end, coalesce(g.website, g.meetup, ''), g.instagram, g.instagram, g.facebook,
  concat_ws(', ', g.city, coalesce(g.st, case g.ctry when 'GB' then 'UK' end)), g.city, g.st, g.ctry, 'OPERATIONAL', null,
  upper(left(regexp_replace(g.name, '[^A-Za-z]', '', 'g'), 2)), g.chapters, 'group-search',
  jsonb_build_object('group', jsonb_build_object('meetup', g.meetup, 'events_url', g.events_url, 'vegan_only', g.vegan_only),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Found in the group search (2026-10-29): web search and the group''s own pages; about written from its own description.')))
    || case when g.live then '{}'::jsonb else jsonb_build_object('review', jsonb_build_object('at', now(), 'by', 'Logan', 'auto', false,
      'reasons', jsonb_build_array(g.hold_why), 'status_before', 'approved')) end,
  now()
from grp g where not exists (select 1 from listings x where x.slug = g.slug) and g.slug <> 'vegan-social-club-south-florida';

-- Each group's events page is a crawl source tied to it: every event the Background writer saves from it is the group's.
-- Vegetarians of Central Florida's Meetup was a source already; it gets the group.
update ve_event_sources s set listing_id = l.id, city_slug = coalesce(s.city_slug, 'central-florida')
from listings l where l.slug = 'vegetarians-of-central-florida' and s.url = 'https://www.meetup.com/vegetarianscf/events/' and s.listing_id is null;

insert into ve_event_sources (name, kind, url, city_slug, notes, active, check_status, every_days, listing_id)
select g.name || ' (group)', g.src_kind, g.events_url, g.chapters[1],
  'This is ' || g.name || '''s own page. Save every upcoming event they host (a meetup, dinner, potluck, party or outing), each with its own event page as the link where it has one. They are tied to the group automatically.',
  g.live, 'queued', 3, l.id
from grp g join listings l on l.slug = g.slug
where not exists (select 1 from ve_event_sources s where s.url = g.events_url);

-- Two events the groups announced on Instagram (read 2026-10-29), live now so their pages are not empty while the crawl runs.
select ve_event_intake(jsonb_build_object('title', 'Vegan Social Club Halloween Party', 'starts_at', '2026-10-31T17:00:00-04:00',
  'timezone', 'America/New_York', 'city', 'West Palm Beach', 'state', 'FL', 'country', 'US', 'continent', 'North America', 'category', 'social',
  'description', 'The Vegan Social Club''s Halloween party in West Palm Beach. Details and RSVP through their Instagram.',
  'ticket_url', 'https://www.instagram.com/vegansocialclubsoflo/',
  'host_listing_id', (select id from listings where slug = 'vegan-social-club-south-florida')), 'admin', null,
  (select (value::jsonb->>'member_id')::uuid from lesaruss_dispatch_settings where key = 'pulse_auto'), true);
select ve_event_intake(jsonb_build_object('title', 'Vegan Club RVA x Point 5: NA Spirits Tasting and Vegan Snacks', 'starts_at', '2026-11-01T16:30:00-05:00',
  'ends_at', '2026-11-01T18:00:00-05:00', 'timezone', 'America/New_York', 'location_name', 'Point 5', 'city', 'Richmond', 'state', 'VA', 'country', 'US',
  'continent', 'North America', 'category', 'social',
  'description', 'A Vegan Club RVA hangout at Point 5 with a non-alcoholic spirits tasting and Vegan snacks. RSVP through the link in their Instagram bio.',
  'ticket_url', 'https://www.laurenzray.com/event-details/vegan-club-x-point-5-na-spirits-tasting-vegan-snacks-hangout',
  'host_listing_id', (select id from listings where slug = 'vegan-club-rva')), 'admin', null,
  (select (value::jsonb->>'member_id')::uuid from lesaruss_dispatch_settings where key = 'pulse_auto'), true);
