-- Sherri Johnson's People page (Sean, 2026-11-02: "I want you to create a page for Sherry Johnson as well"). She co-hosts Plant Based in the
-- Burbz with Paige Parsons Roache (the show's own Instagram, @plantbasedintheburbz, names @sherrisheree and @paigeparsonsroache). The May
-- import's quarantined @sherrisheree row becomes her profile, from her own Instagram bio (read through Apify the same day), credited as a
-- Guest on the SoFlo Vegans episode with Paige, in the family plantbased-in-the-burbs, with Plantbased in the Burbs and UnchainedTV under
-- Affiliations. The show's page names both under Hosts. Idempotent.
update public.listings set status = 'approved', name = 'Sherri Johnson', slug = 'sherri-johnson', category = 'Content Creators',
  extra_categories = array['Health Experts'], communities = array['all'], location = 'Online', vegan_status = null,
  crawl_source = 'people', initials = 'S', instagram = '@sherrisheree',
  website = 'https://watch.unchainedtv.com/plant-based-in-the-burbs',
  description = 'Sherri Johnson co-hosts Plant Based in the Burbz with Paige Parsons Roache, a plant-based cooking show and the Let''s Chat interview series on UnchainedTV and YouTube. She is a certified personal trainer and plant-based nutritionist, the creator of W29 Activewear, and a wife and mom who leads group fitness for people just getting started.',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object(
    'family', 'plantbased-in-the-burbs',
    'person', jsonb_build_object('added', 'Sean, 2026-11-02, from the May import', 'title', 'Co-host of Plant Based in the Burbz, trainer and plant-based nutritionist',
      'bio_source', 'instagram', 'speaker_names', jsonb_build_array('Sherri Johnson', 'Sherri'),
      'links', jsonb_build_array(jsonb_build_object('label', 'Plant Based in the Burbz on UnchainedTV', 'url', 'https://watch.unchainedtv.com/plant-based-in-the-burbs'))),
    'linked', jsonb_build_array(jsonb_build_object('title', 'Affiliations', 'items', jsonb_build_array(
      jsonb_build_object('slug', 'plantbased-in-the-burbs'), jsonb_build_object('slug', 'unchained_tv'))))),
  updated_at = now()
where slug = 'sherrisheree' and status = 'quarantined' and not exists (select 1 from listings where slug = 'sherri-johnson');

update public.ve_backlog_checks b set decision = 'listed', decided_at = now()
from public.listings l where b.listing_id = l.id and l.slug = 'sherri-johnson' and b.decision is null;
-- The other import copy of the same account stays out of sight.
update public.listings set status = 'rejected', details = coalesce(details, '{}'::jsonb) || jsonb_build_object('merged_into', 'sherri-johnson', 'merged_at', now())
where slug = 'sherrisheree.' and status = 'quarantined';

insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select l.id, 'episode', 'Guest', c.id, c.published_at::date
from public.listings l, public.ve_pulse_content c
where l.slug = 'sherri-johnson' and c.slug = 'plantbased-in-the-burbs-with-sherri-and-paige-soflo-vegans-podcast'
on conflict do nothing;

-- The show's page: its two hosts.
update public.listings set details = jsonb_set(details, '{linked}', '[{"title": "Hosts", "items": [{"slug": "paige-parsons-roache"}, {"slug": "sherri-johnson"}]}]'::jsonb), updated_at = now()
where slug = 'plantbased-in-the-burbs';
