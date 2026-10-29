-- The first YouTube channels (Sean, 2026-10-29: "find some popular YouTube vegan channels and then populate it... any new video that
-- pops up will show on their page"). Each was looked up through YouTube's Data API (ve-youtube resolve: its id, title, handle and
-- subscribers came back from YouTube, so the channel is the real one), and its About was written from the channel's own description.
-- Links are only the ones the channel publishes there (a website, Rainbow Plant Life's Instagram); Earthling Ed's Instagram is his
-- People profile's (his channel is "Earthling Ed (YouTube)": one listing a name, and the profile holds "Earthling Ed"). The logo is the channel's own picture, copied into vegan-media/media/logos/youtube-<slug>.jpg and checked by eye.
-- Left out: Avant-Garde Vegan (Gaz Oakley says he is no longer Vegan), Sauce Stache (now Mark Stache, a general health channel), and
-- We Cook Vegan (its uploads list is not public). The Happy Pear was a quarantined row from the May Instagram import and became its
-- page; Plant Based News stays a News Outlet and adds its channel (and YouTube as a second section).
with c(slug, name, channel, handle, website, instagram, about) as (values
  ('pick-up-limes', 'Pick Up Limes', 'UCq2E1mIwUKMWzCA4liA_XGQ', '@pickuplimes', 'https://www.pickuplimes.com', null,
   'Sadia''s channel for making a nourishing plant-based lifestyle accessible to everyone: calm, beautifully made Vegan recipes, meal ideas and mindful living from the Pick Up Limes kitchen.'),
  ('rainbow-plant-life', 'Rainbow Plant Life', 'UCDbZvuDA_tZ6XP5wKKFuemQ', '@rainbowplantlife', 'https://rainbowplantlife.com', '@rainbowplantlife',
   'Nisha teaches Vegan cooking at home, from date-night meals and the Indian dishes she grew up with to meal prep guides for the week, so you become the best plant-based home cook you can be.'),
  ('mic-the-vegan', 'Mic the Vegan', 'UCGJq0eQZoFSwgcqgxIE9MHw', '@micthevegan', null, null,
   'A Vegan science writer with a Master of Public Health, Mic covers the research on Vegan diets, health and the environment, and debunks the myths behind harmful eating habits, with a drop of humor.'),
  ('nutritionfacts-org', 'NutritionFacts.org', 'UCddn8dUxYdgJz3Qr5mjADtA', '@nutritionfactsorg', 'https://nutritionfacts.org', null,
   'Dr. Michael Greger''s science-based nonprofit: short, ad-free videos on the latest nutrition research, new ones three times a week, with no sponsors, brand deals or paid subscriptions.'),
  ('earthling-ed-youtube', 'Earthling Ed (YouTube)', 'UCVRrGAcUc7cblUzOhI1KfFg', '@ed.winters', null, '@earthlinged',
   'Ed Winters, best-selling author, Vegan educator and host of The Disclosure Podcast, on how we treat animals: talks given at universities around the world, conversations and debates.'),
  ('sweet-simple-vegan', 'Sweet Simple Vegan', 'UCDYDFqV45Nqp4V8eaCI_UVQ', '@sweetsimplevegan', null, null,
   'Jasmine and Chris share new videos every week from Portland, Oregon: fresh, fun Vegan recipes, taste tests and vlogs from their kitchen and backyard garden.'),
  ('cheap-lazy-vegan', 'Cheap Lazy Vegan', 'UCEjkioV3LO_OIUaSWRxFZ3A', '@cheaplazyvegan', 'https://www.thecheaplazyvegan.com', null,
   'How to live a cheap, lazy Vegan lifestyle: easy, budget-friendly recipes and everyday tips for Vegans, the Vegan curious and anyone after a more sustainable, ethical way to eat.'),
  ('simnett-nutrition', 'Simnett Nutrition', 'UCpyhJZhJQWKDdJCR07jPY-Q', '@simnettnutrition', null, null,
   'Derek Simnett, a Certified Nutritional Practitioner, helps people around the world thrive on a whole food, plant-based diet, with Vegan nutrition advice, recipes and meal plans.'),
  ('bosh', 'BOSH!', 'UCqmn-vEmYbZ4wqMHt2ndZdQ', '@boshtv', null, null,
   'Henry and Ian''s BOSH! is about feeling great via your plate: easy, big-flavor plant-based recipes from the UK.'),
  ('sarahs-vegan-kitchen', 'Sarah''s Vegan Kitchen', 'UCAbKLYEuTR1riockIgAWBiw', '@sarahsvegankitchen', null, null,
   'Sarah shows how to live a healthy, balanced, plant-based life: trying unusual Vegan foods and creating recipes that fuel an active lifestyle.'),
  ('the-happy-pear', 'The Happy Pear', 'UCr1PC384fLPw5PxyXecQDTw', '@thehappypear', null, null,
   'Twin brothers Dave and Steve share a plant-based recipe video every week from Ireland, where they run The Happy Pear shop, cafe and bakery: whole food cooking made fun, vibrant and easy.')
), promote as (
  update public.listings x set status = 'approved', name = c.name, slug = c.slug, category = 'YouTube', communities = array['all'],
    location = 'Online', vegan_status = null, crawl_source = 'youtube', description = c.about, youtube = 'https://www.youtube.com/' || c.handle,
    website = coalesce(c.website, x.website, ''), logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/youtube-' || c.slug || '.jpg',
    initials = upper(left(c.name, 1)), updated_at = now(),
    details = coalesce(x.details, '{}'::jsonb) || jsonb_build_object('youtube_channel_id', c.channel, 'logo_source', 'admin', 'youtube_added', '2026-10-29, from the May import')
  from c where c.slug = 'the-happy-pear' and x.slug = 'thehappypear' and x.status = 'quarantined'
  returning x.id
), closed as (
  update public.ve_backlog_checks b set decision = 'listed', decided_at = now() from promote where b.listing_id = promote.id and b.decision is null
  returning b.listing_id
)
insert into public.listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities,
  vegan_status, youtube, instagram, logo_url, details)
select c.name, c.slug, 'YouTube', '', c.about, 'approved', coalesce(c.website, ''), 'Online', upper(left(c.name, 1)), 'youtube', array['all'],
  null, 'https://www.youtube.com/' || c.handle, c.instagram,
  'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/youtube-' || c.slug || '.jpg',
  jsonb_build_object('youtube_channel_id', c.channel, 'logo_source', 'admin', 'youtube_added', '2026-10-29')
from c
where c.slug <> 'the-happy-pear' and not exists (select 1 from public.listings x where x.slug = c.slug);

-- Plant Based News: its channel on its News Outlet page, and listed under YouTube too.
update public.listings set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('youtube_channel_id', 'UCJRjK20fHylJyf-HiBtqI2w'),
  youtube = coalesce(youtube, 'https://www.youtube.com/@plantbasednews'),
  extra_categories = (select array_agg(distinct x) from unnest(coalesce(extra_categories, '{}') || array['YouTube']) x), updated_at = now()
where slug = 'plant-based-news' and status = 'approved';
