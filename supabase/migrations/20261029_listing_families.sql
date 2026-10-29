-- Linked pages: one person's profile, podcast and YouTube channel as tabs (Sean, 2026-10-29: "what if we had his overview page and then
-- have a tab for his podcast and then have a tab for his other thing... it just goes to those pages... you see the URL change as well.
-- All that is cross discovery, and it doesn't bog down his page"). Listings that belong together share listings.details.family; each
-- page's tab row shows the others as links to their own pages (loadFamily in directory/listing.html): Overview (the person), Podcast,
-- YouTube, Book. A family with no person (Nutrition Facts) is Podcast and YouTube; a show two people host names each person.

-- Two more channels, found through YouTube's Data API and confirmed by their own descriptions (John Lewis's BadAssVegan, Torre
-- Washington's own channel; neither hosts a podcast of his own, Sean asked, 2026-10-29). One listing a name: their People profiles hold
-- "John Lewis" and "Torre Washington", so the channels are "BadAssVegan" (its own title; the slug badassvegan is an old import row
-- of his Instagram, left quarantined) and "Torre Washington (YouTube)". John's book Badass Vegan joins his family as Book.
insert into public.listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities,
  vegan_status, youtube, instagram, logo_url, details)
select c.name, c.slug, 'YouTube', '', c.about, 'approved', '', 'Online', upper(left(c.name, 1)), 'youtube', array['all'], null,
  'https://www.youtube.com/' || c.handle, c.instagram,
  'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/youtube-' || c.logo || '.jpg',
  jsonb_build_object('youtube_channel_id', c.channel, 'logo_source', 'admin', 'youtube_added', '2026-10-29')
from (values
  ('BadAssVegan', 'badassvegan-youtube', 'UCZ8q4eak2b7AhmlAedxGXJQ', '@badassvegan', '@badassvegan', 'badassvegan',
   'John Lewis, the Badass Vegan, shares what took him from an overweight kid to a plant-based health educator: Vegan nutrition, fitness and food justice through the lens of hip hop.'),
  ('Torre Washington (YouTube)', 'torre-washington-youtube', 'UCu8n7P2JWZDZw0Z3_LBAQ8g', '@TorreWashingtonOfficial', 'torre.washington', 'torre-washington',
   'Torre Washington, an IFBB Pro and natural Vegan bodybuilder (Vegan since 1998), on training, nutrition and competing, as a NASM certified coach who prepares athletes for shows around the world.')
) c(name, slug, channel, handle, instagram, logo, about)
where not exists (select 1 from public.listings x where x.slug = c.slug);

-- The families: a person and the shows they host (details.person.shows), and the channels and podcasts of one brand.
update public.listings l set details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('family', f.family), updated_at = now()
from (values
  ('earthling-ed', 'earthling-ed'), ('the-disclosure-podcast', 'earthling-ed'), ('earthling-ed-youtube', 'earthling-ed'),
  ('john-lewis', 'john-lewis'), ('badassvegan-youtube', 'john-lewis'), ('badass-vegan-by-john-lewis', 'john-lewis'),
  ('torre-washington', 'torre-washington'), ('torre-washington-youtube', 'torre-washington'),
  ('neal-barnard', 'neal-barnard'), ('the-exam-room', 'neal-barnard'),
  ('dotsie-bausch', 'dotsie-bausch'), ('switch4good-podcast', 'dotsie-bausch'),
  ('jason-kartalian', 'jason-kartalian'), ('vegan-hacks', 'jason-kartalian'),
  ('brighde-reed', 'brighde-reed'), ('the-world-vegan-travel-podcast', 'brighde-reed'),
  ('maxime-sigouin', 'maxime-sigouin'), ('the-maxime-sigouin-podcast', 'maxime-sigouin'),
  ('giacomo-marchese', 'muscles-by-brussels'), ('dani-taylor', 'muscles-by-brussels'), ('muscles-by-brussels-radio', 'muscles-by-brussels'),
  ('nutrition-facts-with-dr-greger', 'nutritionfacts'), ('nutritionfacts-org', 'nutritionfacts'),
  ('plant-based-news', 'plant-based-news'), ('the-plant-based-news-podcast', 'plant-based-news')
) f(slug, family)
where l.slug = f.slug and l.status = 'approved';

-- Earthling Ed hosts The Disclosure Podcast (his channel's own description says so): his profile's Their podcast shows it too.
update public.listings set details = jsonb_set(details, '{person,shows}', '["the-disclosure-podcast"]'::jsonb), updated_at = now()
where slug = 'earthling-ed' and status = 'approved' and not (details->'person' ? 'shows');
