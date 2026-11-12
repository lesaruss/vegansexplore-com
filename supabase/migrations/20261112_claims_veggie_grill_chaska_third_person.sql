-- 2026-11-12 (Sean): Veggie Grill (Next Level Veggie Grill) and Chaska claims, prepared for approval.
-- Rule (Sean, 2026-11-12): every text we publish is in the third person, even when a business writes in the first.
-- ve-claims admin_review copies claim.proposed (tagline, description, website, phone, instagram, vegan_status) onto the
-- listing, so the rewritten text goes into each claim's proposed as well as the listing. Claims stay 'submitted':
-- approval waits for the post-claim experience (email + Liz's Getting Started + restyled dashboard).
-- Data fix, safe to run twice.

-- Chaska (Marietta, GA): one restaurant. The live listing keeps its Google data and gets the owner's words in the third
-- person; the application they made a minute before claiming is closed as the same place. Not Vegan: Pre-Vegan copy.
update listings set
  description = 'Chaska serves authentic Indian vegetarian cuisine in Marietta, Georgia, with plenty of plant-based (Pre-Vegan) options and flavors from Punjab, Rajasthan, Gujarat, South India and India''s popular street food. Its dishes are made fresh in-house with quality ingredients, bringing traditional recipes and distinctive flavors to every plate. The team''s goal is to share the richness of Indian food and culture and give every guest a memorable meal.',
  tagline = 'Authentic Indian vegetarian cuisine, fresh, traditional and made with love.',
  instagram = coalesce(nullif(instagram, ''), 'chaskaatl'),
  updated_at = now()
where slug = 'chaska';

update ve_listing_claims set proposed = proposed || jsonb_build_object(
  'description', (select description from listings where slug = 'chaska'),
  'tagline', (select tagline from listings where slug = 'chaska'),
  'instagram', 'chaskaatl', 'vegan_status', 'vegan_options'), updated_at = now()
where id = 'dcb7391e-05b4-4a1d-a7e9-21c066b4dfd0';

update ve_listing_claims set status = 'rejected', review_note = 'Same restaurant as /directory/chaska, merged into it; that claim stands.', reviewed_at = now(), updated_at = now()
where id = '7ca61a0e-e7ea-4ab9-b6ae-84c5ecd53116' and status = 'submitted';
update listings set status = 'rejected', claim_status = 'unclaimed', updated_at = now() where slug = 'chaska-indian-vegetarian-restaurant';

-- Next Level Veggie Grill: their own descriptions, third person, Vegan capitalized.
update ve_listing_claims c set proposed = c.proposed || jsonb_build_object('description',
  'Next Level Veggie Grill in ' || x.city || ' serves a 100% Vegan menu made with fresh organic vegetables and responsibly sourced, non-GMO ingredients, good for people, animals and the planet.'), updated_at = now()
from (values ('a0277b88-8b84-441b-a792-12896f5e7a35'::uuid, 'Pasadena'), ('b548fc85-0662-4d84-ac43-39dbf0a44933'::uuid, 'Burbank'),
             ('af52da4c-22bf-4e32-b749-a62b191e4ed7'::uuid, 'Long Beach'), ('682b050a-053c-4abe-a51a-fc781c3b746c'::uuid, 'Tustin')) x(id, city)
where c.id = x.id;

-- UCLA (Ackerman Student Union), still open per veggiegrill.com/locations/ucla.
update listings set
  description = 'Veggie Grill is now Next Level Veggie Grill, a 100% Vegan chain serving an All American menu that blends Veggie Grill and Next Level Burger favorites, made with wholesome ingredients. This location is in UCLA''s Ackerman Student Union.',
  tagline = 'A 100% Vegan fast-casual chain founded in Los Angeles', location_label = 'UCLA', updated_at = now()
where slug = 'veggie-grill';
update ve_listing_claims set proposed = proposed || jsonb_build_object(
  'description', (select description from listings where slug = 'veggie-grill'),
  'tagline', (select tagline from listings where slug = 'veggie-grill')), updated_at = now()
where id = '3464c282-78b8-4be8-a0a4-273a95020f45';

-- Toluca Lake: same phone and place as the 4300 Riverside Drive listing they also claimed (Burbank). Closed as a duplicate.
update ve_listing_claims set status = 'rejected', review_note = 'Same location as /directory/next-level-veggie-grill-burbank-d55b (4300 Riverside Dr), which they also claimed.', reviewed_at = now(), updated_at = now()
where id = 'a6acbad6-f80a-413e-a020-0ee88c2f220a' and status = 'submitted';
update listings set status = 'rejected', claim_status = 'unclaimed', updated_at = now() where slug = 'next-level-veggie-grill-toluca-lake';

-- Tustin: a real location we did not have (The Market Place, Irvine Company Retail). Address filled, placed with the
-- chain's other locations; it goes live when the claim is approved (an application goes live on approval).
update listings set name = 'Next Level Veggie Grill', address_street = '2955 El Camino Real', address_city = 'Tustin', address_state = 'CA',
  address_zip = '92782', address_country = coalesce(address_country, 'US'), location_label = 'Tustin',
  parent_id = (select id from listings where slug = 'next-level-veggie-grill-long-beach-b4fc'),
  description = 'Next Level Veggie Grill in Tustin serves a 100% Vegan menu made with fresh organic vegetables and responsibly sourced, non-GMO ingredients, good for people, animals and the planet.',
  updated_at = now()
where slug = 'next-level-veggie-grill-tustin';
