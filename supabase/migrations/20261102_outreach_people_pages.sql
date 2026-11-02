-- People pages for the people Sean is writing to this week (Sean, 2026-11-02: "it might make strategic sense if we can create a page
-- for the person I'm about to send it to... Paige, she's been on our podcast. And Elle... her Vegans of Claremont in the Central
-- Florida section"). Everything below comes from their own Instagram accounts, read through Apify the same day (@paigeparsonsroache,
-- @elle_jimenez, @vegansinclermont). Their tracked outreach links (/go/paige, /go/elle) now open these pages. Idempotent.

-- 1. Paige Parsons Roache: the May Instagram import's quarantined row becomes her profile (handle kept), credited as a Guest on the
--    SoFlo Vegans episode she was on with Sherri Johnson, and linked to the show's own profile.
update public.listings set status = 'approved', name = 'Paige Parsons Roache', slug = 'paige-parsons-roache', category = 'Activists',
  extra_categories = array['Content Creators'], communities = array['all'], location = 'Online', vegan_status = null,
  crawl_source = 'people', initials = 'P', instagram = '@paigeparsonsroache', website = 'https://youtube.com/@plantbasedintheburbz',
  description = 'Paige Parsons Roache directs, hosts and produces Plant Based in the Burbz with Sherri Johnson, and works as a Plant Based Treaty city campaigner in the Los Angeles area. She has a plant-based nutrition certificate from eCornell, appears on UnchainedTV and is part of Vegans of LA. She runs community cooking classes, the Let''s Chat live interview series and events like the Sustainability Summit at the Calabasas Library.',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('person', jsonb_build_object(
    'added', 'outreach, 2026-11-02, from the May import',
    'title', 'Host of Plant Based in the Burbz and Plant Based Treaty campaigner',
    'bio_source', 'instagram', 'speaker_names', jsonb_build_array('Paige Parsons Roache', 'Paige'),
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Plant Based in the Burbz', 'url', 'https://vegansexplore.com/directory/plantbased-in-the-burbs'),
      jsonb_build_object('label', 'Plant Based in the Burbz on YouTube', 'url', 'https://youtube.com/@plantbasedintheburbz'),
      jsonb_build_object('label', 'Plant Based Treaty', 'url', 'https://plantbasedtreaty.org')))),
  updated_at = now()
where slug = 'paigeparsonsroache' and status = 'quarantined';

update public.ve_backlog_checks b set decision = 'listed', decided_at = now()
from public.listings l where b.listing_id = l.id and l.slug = 'paige-parsons-roache' and b.decision is null;

insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select l.id, 'episode', 'Guest', c.id, c.published_at::date
from public.listings l, public.ve_pulse_content c
where l.slug = 'paige-parsons-roache' and c.slug = 'plantbased-in-the-burbs-with-sherri-and-paige-soflo-vegans-podcast'
on conflict do nothing;

-- 2. Vegans in Clermont: a Community > Groups listing in Central Florida (Clermont, Lake County).
insert into public.listings (name, slug, category, specialty, description, status, website, instagram, location, address_city,
  address_state, initials, crawl_source, communities, vegan_status, details)
select 'Vegans in Clermont', 'vegans-in-clermont', 'Groups', '',
  'A Vegan and plant-based community for Clermont, Winter Garden, Groveland, Mount Dora and the rest of Lake County. It shares local Vegan finds and holds gatherings, starting with an Autumn Dinner Party for more than 30 people in Historic Downtown Clermont in October 2026.',
  'approved', 'http://vegansinclermont.com/', '@vegansinclermont', 'Clermont, FL', 'Clermont', 'FL', 'V', 'outreach',
  array['central-florida'], null,
  jsonb_build_object('admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Listed under Community > Groups (2026-11-02) for Sean''s outreach to Elle Jimenez, its co-founder. From its Instagram (1,123 followers): first gathering October 2026, posts weekly.')))
where not exists (select 1 from public.listings where slug = 'vegans-in-clermont');

-- 3. Elle Jimenez: a People profile, Promoters first (she organizes Vegans in Clermont), then Chefs and Content Creators.
insert into public.listings (name, slug, category, extra_categories, specialty, description, status, website, instagram, location,
  initials, crawl_source, communities, vegan_status, details)
select 'Elle Jimenez', 'elle-jimenez', 'Promoters', array['Chefs', 'Content Creators'], '',
  'Elle Jimenez is an actor, Vegan foodie and wellness coach and chef in Central Florida, certified in plant-based nutrition. She co-founded Vegans in Clermont and cooked the fully plant-based meal for its first dinner party, and shares Clermont''s Vegan spots and her own recipes. She is also an author and performer as The Mermaid Elle.',
  'approved', 'https://linktr.ee/elle_jimenez', '@elle_jimenez', 'Online', 'E', 'people', array['all'], null,
  jsonb_build_object('person', jsonb_build_object('added', 'outreach, 2026-11-02', 'title', 'Co-founder of Vegans in Clermont, wellness coach and plant-based chef',
    'bio_source', 'instagram', 'speaker_names', jsonb_build_array('Elle Jimenez', 'Elle'),
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Vegans in Clermont', 'url', 'https://vegansexplore.com/directory/vegans-in-clermont'),
      jsonb_build_object('label', 'Her links', 'url', 'https://linktr.ee/elle_jimenez'))))
where not exists (select 1 from public.listings where slug = 'elle-jimenez');

-- 4. The tracked links open their pages.
update public.ve_links set destination = '/directory/paige-parsons-roache' where code = 'paige';
update public.ve_links set destination = '/directory/elle-jimenez' where code = 'elle';
