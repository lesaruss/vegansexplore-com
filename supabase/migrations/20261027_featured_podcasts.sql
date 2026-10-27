-- Featured podcasts open their Directory listing like every other podcast (Sean, 2026-10-27: "the same as the page... include
-- YouTube and Amazon Music on there as options for our featured ones... the episodes pulled from the RSS feed... go off the RSS
-- feed"). The Amazon Music and YouTube links are the ones our old /podcast/<slug>/ pages carried; each YouTube playlist was
-- checked by YouTube oEmbed (owned by @VegansExplore, SoFlo's by @SofloVegans) and each Amazon page answered 200, 2026-10-27.
-- Listen on reads details.platforms (youtube there is the show's playlist; the youtube column stays the channel for socials).
-- Status stays the feed's (ve-podcast sets business_status from the latest episode).

-- Our four shows: Spotify, Apple, Amazon Music and the YouTube playlist.
update public.listings l set
  amazon_music_url = v.amazon,
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('platforms',
    coalesce(l.details->'platforms', '{}'::jsonb) || jsonb_build_object('spotify', v.spotify, 'apple', v.apple, 'amazon', v.amazon, 'youtube', v.yt)),
  updated_at = now()
from (values
  ('vegans-explore-podcast', 'https://open.spotify.com/show/19GDaPV2SIwybt3HpMurHu', 'https://podcasts.apple.com/us/podcast/vegans-explore-podcast/id1818708745',
   'https://music.amazon.com/podcasts/810d06e3-3676-40c9-9d3c-2b0ae5c30ff1/vegans-explore-podcast', 'https://www.youtube.com/playlist?list=PLpfk6e8BPu-xgyomQzXdkA_InnpCVHHC3'),
  ('soflo-vegans-podcast', 'https://open.spotify.com/show/0AjEvjgjAWPWr8GsuyCkcz', 'https://podcasts.apple.com/us/podcast/soflo-vegans-podcast/id1368665222',
   'https://music.amazon.com/podcasts/36a26496-7ed5-455e-94d3-00ed1c14b5b5/soflo-vegans-podcast', 'https://www.youtube.com/playlist?list=PL-UI3zSy3hJk0g1fs_SMO-Nwgu9WTzBu_'),
  ('vegans-who-lift-podcast', 'https://open.spotify.com/show/5Pr82Chfg3dYfoHHFizyAQ', 'https://podcasts.apple.com/us/podcast/vegans-who-lift-podcast/id1727178761',
   'https://music.amazon.com/podcasts/00369107-b712-4428-8b2f-11eae52ecd5c/vegans-who-lift-podcast', 'https://www.youtube.com/playlist?list=PLpfk6e8BPu-yGPRsXO_dkasruqeYbNQQt')
) as v(slug, spotify, apple, amazon, yt)
where l.slug = v.slug and l.status = 'approved';

-- Pre-Vegans had no Directory listing. Its feed is Apple's feedUrl for id 1780250627 (iTunes lookup, 2026-10-27).
insert into public.listings (tenant_id, name, slug, category, specialty, status, tagline, description, website, location, address_country,
  rss_url, apple_podcasts_url, amazon_music_url, logo_url, initials, color, vegan_status, details)
select '00000000-0000-4000-a000-000000000002', 'Pre-Vegans Podcast', 'pre-vegans-podcast', 'Podcasts', 'Podcasts', 'approved',
  'For anyone curious, before they go Vegan.',
  'A beginner-friendly series from Vegans Explore, hosted by Sean A. Russell: honest, judgment-free conversations answering the questions people ask before they go Vegan.',
  'https://vegansexplore.com/media', 'United States', 'US',
  'https://feeds.captivate.fm/pre-vegans/', 'https://podcasts.apple.com/us/podcast/pre-vegans-podcast/id1780250627',
  'https://music.amazon.com/podcasts/8d1a230b-31f2-4b78-807a-d6f8d5bd7d74/pre-vegans-podcast',
  'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/53/d9/56/53d95636-6d45-1b44-6274-201548f57873/mza_1682445160343010984.jpg/600x600bb.jpg',
  'PV', '#1B5E20', 'fully_vegan',
  jsonb_build_object('media_type', 'podcast', 'hosts', jsonb_build_array('Sean A. Russell'), 'platforms', jsonb_build_object(
    'spotify', 'https://open.spotify.com/show/1lttNCqQ6zBrilhrKLogs7', 'apple', 'https://podcasts.apple.com/us/podcast/pre-vegans-podcast/id1780250627',
    'amazon', 'https://music.amazon.com/podcasts/8d1a230b-31f2-4b78-807a-d6f8d5bd7d74/pre-vegans-podcast',
    'youtube', 'https://www.youtube.com/playlist?list=PLpfk6e8BPu-w7ZD29pIckUldp_XC1AIOr'))
where not exists (select 1 from public.listings where slug = 'pre-vegans-podcast' and status = 'approved');

-- Aguacate Sanctuary & Rescue is in Miami (Sean, 2026-10-27: "Mokate is in Miami"). A sanctuary that rescues, a nonprofit.
update public.listings set
  name = 'Aguacate Sanctuary & Rescue', slug = 'aguacate-sanctuary-and-rescue', status = 'approved',
  category = 'Sanctuaries', extra_categories = array['Rescues', 'Nonprofits'], vegan_status = null,
  address_city = 'Miami', address_state = 'FL', address_country = 'US', location = 'Miami, FL', communities = array['south-florida'],
  instagram = 'https://instagram.com/aguacatesanctuaryandrescue',
  description = case when coalesce(description, '') = '' then 'A Miami sanctuary caring for rescued farm animals: ducks, cows, turkeys, rabbits, chickens, swans, pigs and goats.' else description end,
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Listed from Sean''s Instagram list: Sean confirmed it is in Miami (2026-10-27).'))),
  updated_at = now()
where id = '76361b41-a094-4b1e-a499-dbf9506574a3' and status = 'quarantined';
update public.ve_backlog_checks set decision = 'listed', decided_at = now()
where listing_id = '76361b41-a094-4b1e-a499-dbf9506574a3' and decision is null;
