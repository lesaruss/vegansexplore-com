-- National and international animal organizations in every chapter (Sean, 2026-10-28: "PETA... I haven't seen it on the
-- website at all... we need to look for those national organizations to make sure that they're listed, because that's a
-- glaring omission"). PETA, the Physicians Committee, Sea Shepherd, Vegan Outreach, The Vegan Society, DxE and Anonymous for
-- the Voiceless were in the June Instagram import, but the backlog check filed them as "A person" (Instagram leaves the
-- business flag off) or "Not a restaurant", lists that only offer Set aside, so they never went live. They are listed here
-- (their quarantined rows, new slugs), and fifteen more that were missing are added. Headquarters from Google Places where
-- Google has the organization; the rest are online (no address). Every one serves every chapter except Animal Place, a
-- sanctuary you visit in Grass Valley, California. Websites checked to load on 2026-10-28.
create temp table nat (old_slug text, slug text, name text, category text, website text, instagram text, about text,
  place_id text, phone text, street text, city text, st text, zip text, ctry text, lat float8, lng float8, every boolean) on commit drop;
insert into nat values
 ('peta','peta','PETA','Nonprofits','https://www.peta.org/','peta',
  'PETA, People for the Ethical Treatment of Animals, works for the rights of all animals through public education, cruelty investigations, research, rescue and campaigns. Its headquarters are in Norfolk, Virginia.',
  'ChIJGxGM3m2YuokRyHPmE2NeZUQ','(757) 622-7382','501 Front St','Norfolk','VA','23510','US',36.853878,-76.299441,true),
 ('physicianscommittee','physicians-committee-for-responsible-medicine','Physicians Committee for Responsible Medicine','Nonprofits','https://www.pcrm.org/','physicianscommittee',
  'The Physicians Committee for Responsible Medicine is a nonprofit of doctors and members promoting plant-based nutrition, preventive medicine and research without animal testing. Based in Washington, D.C.',
  'ChIJxfO-cZTJt4kRMS_buj1zSFs','(202) 686-2210','5100 Wisconsin Ave #400','Washington','DC','20016','US',38.9563403,-77.0838713,true),
 ('theoriginalvegansociety','the-vegan-society','The Vegan Society','Nonprofits','https://www.vegansociety.com/','theoriginalvegansociety',
  'The Vegan Society, founded in the UK in 1944, is the charity that coined the word Vegan. It shares resources on Vegan living and runs the Vegan Trademark found on products around the world.',
  'ChIJObggWem8cEgReiGvEwBcCD4','0121 523 1730','21 Hylton St','Birmingham',null,'B18 6HJ','GB',52.4907409,-1.9130204,true),
 (null,'animal-legal-defense-fund','Animal Legal Defense Fund','Nonprofits','https://aldf.org/',null,
  'The Animal Legal Defense Fund uses the law to protect the lives and advance the interests of animals, through lawsuits, legislation and support for animal law programs. Based in Cotati, California.',
  'ChIJ9Q81polKhIARfaPArR8jxpc','(707) 795-2533','525 E Cotati Ave','Cotati','CA','94931','US',38.3291572,-122.6991382,true),
 (null,'best-friends-animal-society','Best Friends Animal Society','Nonprofits','https://bestfriends.org/',null,
  'Best Friends Animal Society works to end the killing of dogs and cats in America''s shelters, with lifesaving centers around the country and its animal sanctuary in Kanab, Utah.',
  'ChIJgXy5hxMqNYcRRbbleO5pc1M','(435) 688-2327','5001 Angel Canyon Rd','Kanab','UT','84741','US',37.1257949,-112.5437937,true),
 (null,'in-defense-of-animals','In Defense of Animals','Nonprofits','https://www.idausa.org/',null,
  'In Defense of Animals is an international animal protection organization based in San Rafael, California, campaigning for the rights, welfare and habitats of animals through education and hands-on rescue.',
  'ChIJz7pa9EmahYARc2GipvX7BDw','(415) 448-0048','1020 B St','San Rafael','CA','94901','US',37.9738412,-122.5292899,true),
 (null,'compassion-in-world-farming','Compassion in World Farming','Nonprofits','https://www.ciwf.org/',null,
  'Compassion in World Farming is an international charity campaigning to end factory farming, founded in 1967 by a British dairy farmer. Its headquarters are in Godalming, England.',
  'ChIJ--8ZftrRdUgRB96lbRg9TBo','01483 521953','River Court, Mill Ln','Godalming',null,'GU7 1EZ','GB',51.1854905,-0.618786,true),
 (null,'united-poultry-concerns','United Poultry Concerns','Nonprofits','https://www.upc-online.org/',null,
  'United Poultry Concerns is a nonprofit promoting the compassionate and respectful treatment of chickens, turkeys, ducks and other domestic fowl, with a sanctuary in Machipongo, Virginia.',
  'ChIJ6-48x5NIuokRcoob_98tL-s','(757) 678-7875','12325 Seaside Rd','Machipongo','VA','23405','US',37.4089272,-75.8810973,true),
 (null,'born-free','Born Free','Nonprofits','https://www.bornfree.org.uk/',null,
  'Born Free is an international wildlife charity working to keep wild animals in the wild, end the suffering of wild animals in captivity and protect species in their natural homes.',
  'ChIJl9JgK7frdUgRE-H4DiK2Pv4','01403 240170','Frazer House, 14 Carfax','Horsham',null,'RH12 1ER','GB',51.0634975,-0.3279863,true),
 (null,'sentient-media','Sentient Media','News Outlets','https://sentient.media/',null,
  'Sentient Media is a nonprofit newsroom reporting on animal agriculture and how it affects animals, people and the planet, with news, investigations and explainers.',
  null,null,null,null,null,null,'US',null,null,true),
 (null,'animal-place','Animal Place','Sanctuaries','https://animalplace.org/',null,
  'Animal Place is a sanctuary for farmed animals in Grass Valley, California, giving rescued cows, pigs, goats, chickens and more a home for life, and finding adoptive homes for rescued hens.',
  'ChIJwWEXWplum4AR2qojGarKKUs',null,'17314 McCourtney Rd','Grass Valley','CA','95949','US',39.147806,-121.144454,false),
 ('seashepherd','sea-shepherd','Sea Shepherd','Nonprofits','https://www.seashepherd.org/','seashepherd',
  'Sea Shepherd is a marine conservation organization that defends ocean wildlife and habitats through direct action campaigns against illegal fishing, whaling and poaching around the world.',
  null,null,null,null,null,null,null,null,null,true),
 ('veganoutreach','vegan-outreach','Vegan Outreach','Nonprofits','https://veganoutreach.org/','veganoutreach',
  'Vegan Outreach works to end violence toward animals by helping people move toward a Vegan lifestyle, through outreach, online mentoring and its free 10 Weeks to Vegan program.',
  null,null,null,null,null,null,'US',null,null,true),
 ('directactioneverywhere','direct-action-everywhere','Direct Action Everywhere','Nonprofits','https://www.directactioneverywhere.com/','directactioneverywhere',
  'Direct Action Everywhere is a grassroots animal rights network of activists working through protests, open rescues and investigations toward a world where every animal is free.',
  null,null,null,null,null,null,null,null,null,true),
 ('anonymousforthevoiceless','anonymous-for-the-voiceless','Anonymous for the Voiceless','Nonprofits','https://www.anonymousforthevoiceless.org/','anonymousforthevoiceless',
  'Anonymous for the Voiceless is an animal rights organization known for its Cube of Truth street outreach, where volunteers show footage of animal farming and talk with people about going Vegan.',
  null,null,null,null,null,null,null,null,null,true),
 (null,'animal-outlook','Animal Outlook','Nonprofits','https://animaloutlook.org/',null,
  'Animal Outlook is a national nonprofit that exposes cruelty to farmed animals through undercover investigations and legal advocacy, and helps people choose Vegan food.',
  null,null,null,null,null,null,'US',null,null,true),
 (null,'last-chance-for-animals','Last Chance for Animals','Nonprofits','https://www.lcanimal.org/',null,
  'Last Chance for Animals is a nonprofit based in Los Angeles working to end animal exploitation through investigations, education, legislation and media campaigns.',
  null,null,null,null,null,null,'US',null,null,true),
 (null,'food-empowerment-project','Food Empowerment Project','Nonprofits','https://foodispower.org/',null,
  'Food Empowerment Project works for a more just and compassionate world through Vegan food choices, protection for animals and farm workers, and access to healthy food in every community.',
  null,null,null,null,null,null,'US',null,null,true),
 (null,'the-good-food-institute','The Good Food Institute','Nonprofits','https://gfi.org/',null,
  'The Good Food Institute is a nonprofit building a global food system of plant-based, fermented and cultivated proteins, supporting scientists, companies and policymakers.',
  null,null,null,null,null,null,null,null,null,true),
 (null,'veganuary','Veganuary','Nonprofits','https://veganuary.com/',null,
  'Veganuary is a nonprofit that encourages people around the world to try Vegan in January and beyond, with a free 31 day challenge full of recipes, meal plans and tips.',
  null,null,null,null,null,null,null,null,null,true),
 (null,'faunalytics','Faunalytics','Nonprofits','https://faunalytics.org/',null,
  'Faunalytics is a nonprofit research organization that gives animal advocates the data they need, through original studies and a free library of research summaries.',
  null,null,null,null,null,null,'US',null,null,true),
 (null,'nonhuman-rights-project','Nonhuman Rights Project','Nonprofits','https://www.nonhumanrights.org/',null,
  'The Nonhuman Rights Project is a civil rights organization working through the courts and legislation to secure rights for nonhuman animals, beginning with elephants and great apes.',
  null,null,null,null,null,null,'US',null,null,true);

-- The ones already in the table (quarantined from the June import): list them.
update listings l set
  name = n.name, slug = n.slug, category = n.category, status = 'approved', website = n.website, description = n.about,
  instagram = coalesce(l.instagram, n.instagram), phone = coalesce(n.phone, l.phone),
  location = coalesce(nullif(concat_ws(', ', n.city, coalesce(n.st, case n.ctry when 'GB' then 'UK' end)), ''), 'Online'),
  address_street = n.street, address_city = n.city, address_state = n.st, address_zip = n.zip, address_country = n.ctry,
  latitude = n.lat, longitude = n.lng, google_place_id = n.place_id, vegan_status = null, business_status = 'OPERATIONAL',
  communities = case when n.every then array['all'] else '{}' end, updated_at = now(),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('national_org', jsonb_build_object('at', now(), 'by', 'Logan', 'old_slug', n.old_slug),
    'admin_notes', coalesce(l.details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Listed with the national organizations (2026-10-28). It sat quarantined since the June Instagram import, filed by the backlog check as not a business.')))
from nat n where n.old_slug is not null and l.slug = n.old_slug and l.status = 'quarantined';
update ve_backlog_checks b set decision = 'listed', decided_at = now()
from listings l join nat n on n.slug = l.slug and n.old_slug is not null where b.listing_id = l.id;

-- The two broken copies of PETA's handle (@peta, and @peta.) are set aside as copies of PETA's listing.
update listings l set status = 'rejected', updated_at = now(),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('merged_into', (select id from listings where slug = 'peta' and status = 'approved'),
    'merged_at', now(), 'status_before_merge', l.status)
where l.slug in ('peta,', 'peta.') and l.status = 'quarantined';
update ve_backlog_checks b set decision = 'hidden', decided_at = now()
from listings l where b.listing_id = l.id and l.slug in ('peta,', 'peta.');

-- The ones that were missing.
insert into listings (name, slug, category, specialty, description, status, website, phone, instagram, location, address_street, address_city,
  address_state, address_zip, address_country, latitude, longitude, google_place_id, business_status, vegan_status, initials, communities,
  crawl_source, details, updated_at)
select n.name, n.slug, n.category, '', n.about, 'approved', n.website, n.phone, n.instagram,
  coalesce(nullif(concat_ws(', ', n.city, coalesce(n.st, case n.ctry when 'GB' then 'UK' end)), ''), 'Online'),
  n.street, n.city, n.st, n.zip, n.ctry, n.lat, n.lng, n.place_id, 'OPERATIONAL', null,
  upper(left(regexp_replace(n.name, '[^A-Za-z]', '', 'g'), 2)), case when n.every then array['all'] else '{}' end, 'national-orgs',
  jsonb_build_object('national_org', jsonb_build_object('at', now(), 'by', 'Logan'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added with the national organizations (2026-10-28): headquarters from Google Places where Google has it, website checked, about written from its own description.'))),
  now()
from nat n where n.old_slug is null and not exists (select 1 from listings x where x.slug = n.slug);

-- The same backlog check buried ten smaller animal organizations as "A person" or "Not a restaurant". Google cannot confirm
-- them, so they go to Business outreach > New places > Ready to list for Sean to confirm, not live.
with pick(slug, guess) as (values ('fish_defender,','Nonprofits'),('unchained_tv','News Outlets'),('ourplanettheirstoo','Nonprofits'),('karmafarmsanctuary','Sanctuaries'),
 ('operation__liberation','Rescues'),('hogskisses','Sanctuaries'),('emptythecages','Nonprofits'),('compassionatefarming','Nonprofits'),('arkrescuefl','Sanctuaries'),('climatehealers','Nonprofits'))
update ve_backlog_checks b set verdict = 'list',
  reason = 'An animal organization the Instagram check had filed as not a business (Logan, 2026-10-28). Looks like ' || p.guess || '; confirm it before adding.'
from listings l join pick p on p.slug = l.slug where b.listing_id = l.id and l.status = 'quarantined' and b.decision is null;

-- Their duplicate import copies (a stray comma or ! in the handle) are set aside as copies of the one that stays.
with dup(slug, keep) as (values ('mercyforanimals,','mercy-for-animals'),('rowdygirlsanctuary,',null),('directactioneverywhere,','direct-action-everywhere'),
 ('karmafarmsanctuary,','karmafarmsanctuary'),('karmafarmsanctuary!','karmafarmsanctuary'),('operation__liberation,','operation__liberation'))
update listings l set status = 'rejected', updated_at = now(),
  details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('merged_into',
     coalesce((select id from listings k where k.slug = d.keep order by (k.status='approved') desc limit 1),
              (select id from listings k where k.name ilike 'Rowdy Girl%' and k.status='approved' limit 1)),
     'merged_at', now(), 'status_before_merge', l.status)
from dup d where l.slug = d.slug and l.status = 'quarantined';
