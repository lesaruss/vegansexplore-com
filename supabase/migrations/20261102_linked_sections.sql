-- Founder, Communities and Affiliations (Sean, 2026-11-02: "put Elle as the founder in Vegans in Clermont... for Elle, we could put
-- communities... for Paige, let's include affiliations... UnchainedTV... Plant Based in the Burbs... Plant Based Treaty... two columns").
-- details.linked [{title, sub?, items: [{slug, role?}]}] is drawn by linkedSections in directory/listing.html with the Directory's card.
-- Plant Based Treaty was not in the Directory: added as Community > Nonprofits, every chapter (a global campaign, no How Vegan). Idempotent.

insert into public.listings (name, slug, category, specialty, description, status, website, instagram, location, initials, crawl_source,
  communities, vegan_status, details)
select 'Plant Based Treaty', 'plant-based-treaty', 'Nonprofits', '',
  'Plant Based Treaty is a grassroots campaign for a global treaty to stop the expansion of animal agriculture and move the world to plant-based food systems, for the climate. Cities, organizations and people around the world endorse it, and its campaigners bring it to councils, festivals and colleges.',
  'approved', 'https://plantbasedtreaty.org', '@plantbasedtreaty', 'Online', 'P', 'outreach', array['all'], null,
  jsonb_build_object('admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-02 as one of Paige Parsons Roache''s affiliations (she is a Plant Based Treaty city campaigner).')))
where not exists (select 1 from public.listings where slug = 'plant-based-treaty');

update public.listings set details = jsonb_set(coalesce(details, '{}'::jsonb), '{linked}',
  '[{"title": "Founder", "items": [{"slug": "elle-jimenez", "role": "Founder"}]}]'::jsonb), updated_at = now()
where slug = 'vegans-in-clermont';

update public.listings set details = jsonb_set(jsonb_set(details, '{linked}',
  '[{"title": "Communities", "items": [{"slug": "vegans-in-clermont", "role": "Founder"}]}]'::jsonb),
  '{person,links}', '[{"label": "Her links", "url": "https://linktr.ee/elle_jimenez"}]'::jsonb), updated_at = now()
where slug = 'elle-jimenez';

update public.listings set details = jsonb_set(jsonb_set(details, '{linked}',
  '[{"title": "Affiliations", "items": [{"slug": "unchained_tv"}, {"slug": "plantbased-in-the-burbs"}, {"slug": "plant-based-treaty"}]}]'::jsonb),
  '{person,links}', '[{"label": "Plant Based in the Burbz on YouTube", "url": "https://youtube.com/@plantbasedintheburbz"}]'::jsonb), updated_at = now()
where slug = 'paige-parsons-roache';
