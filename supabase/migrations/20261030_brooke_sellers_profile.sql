-- Brooke Sellers' People profile, filled out (Sean, 2026-10-30: "update Brooke's profile on Vegans Explore... it's kind of barren...
-- now that she has this book, we should also put her guide, her cookbook on it. She can have a book section. She should have a podcast
-- section because she was co-host of the Vegans Who Lift podcast... she also has this YouTube show... add that the same way we've added
-- the other ones... pull whatever other information you need off of [meatlessmuscle.com]").
--
-- Her linked pages are the family `brooke-sellers` (directory/listing.html loadFamily): her profile, the Vegans Who Lift Podcast, her
-- channel Miss Meatless Muscle (YouTube) and her two books, so her page reads Overview, Podcast, YouTube, Books. John Thomas co-hosts
-- the podcast but is left out of the family on purpose: a family has one person's Books tab, and putting him in would show her books
-- on his page. He is still named as host on the podcast (details.hosts) and credited on every episode.
--
-- Facts come from her own pages: meatlessmuscle.com (home, programs, cookbook), her channel's description (read through ve-youtube
-- resolve, 2026-10-30) and the book's Amazon page and covers Sean sent the same day. Covers and the channel picture start as their
-- source links; ve-logo-keeper copies them into vegan-media on its next sweep. Safe to run twice.

-- 1. Tracked links. The book goes to Amazon (ve-links adds our Associates tag); the cookbook is sold on her own site.
insert into ve_links (code, label, destination, initiative_slug, tags, channel) values
  ('book-b0hn9myty6', 'Buy on Amazon: Heal Your Gut. Balance Your Hormones.', 'https://www.amazon.com/dp/B0HN9MYTY6', 'books',
   array['book', 'amazon', 'brooke-sellers'], 'other'),
  ('book-meatless-muscle-cookbook', 'Get the cookbook: Meatless Muscle Cookbook', 'https://meatlessmuscle.com/cookbook', 'books',
   array['book', 'brooke-sellers'], 'other')
on conflict (code) do nothing;

-- 2. Her books.
insert into listings (name, slug, category, specialty, location, address_country, communities, vegan_status, business_status, status,
  tenant_id, color, initials, website, logo_url, description, details)
select 'Heal Your Gut. Balance Your Hormones. by Brooke Sellers', 'heal-your-gut-balance-your-hormones-by-brooke-sellers', 'Books', 'Books',
  'United States', 'US', array['all'], 'fully_vegan', 'OPERATIONAL', 'approved', '00000000-0000-4000-a000-000000000002', '#1A1A1A', 'HG',
  'https://www.amazon.com/dp/B0HN9MYTY6', 'https://meatlessmuscle.com/assets/img/heal-your-gut-cover.jpg',
  'Brooke Sellers'' science-backed roadmap for women tired of bloating, stubborn weight gain, acne, fatigue and feeling dismissed.',
  jsonb_build_object(
    'isbn', '9798193575221', 'asin', 'B0HN9MYTY6', 'family', 'brooke-sellers', 'creator', 'Brooke Sellers', 'media_type', 'book',
    'book_type', 'health', 'release_year', 2026, 'pages', 82, 'buy_link', '/go/book-b0hn9myty6',
    'added_by', 'logan', 'book_source', 'sean', 'book_facts_from', 'amazon',
    'cover_source', 'Front cover sent by Sean 2026-10-30 (meatlessmuscle.com/assets/img/heal-your-gut-cover.jpg)', 'cover_checked', true,
    'summary', E'You eat healthy. You exercise. You''re doing everything you''ve been told to do, so why don''t you feel good? Brooke Sellers wrote this book for women living with bloating after meals, unpredictable digestion, low energy, acne, hormones that seem off and stubborn weight changes, who have started to wonder if that is just their normal.\n\nAs a Vegan fitness coach who has worked with hundreds of women, Brooke shares her own transformation, from bloated and exhausted to healed and thriving, alongside an approachable, science-backed roadmap to the connection between your gut, hormones, metabolism, nutrition and overall health, so you can stop chasing symptoms and start supporting your body from the inside out.')
where not exists (select 1 from listings where slug = 'heal-your-gut-balance-your-hormones-by-brooke-sellers');

insert into listings (name, slug, category, specialty, location, address_country, communities, vegan_status, business_status, status,
  tenant_id, color, initials, website, logo_url, description, details)
select 'Meatless Muscle Cookbook by Brooke Sellers', 'meatless-muscle-cookbook-by-brooke-sellers', 'Books', 'Books',
  'United States', 'US', array['all'], 'fully_vegan', 'OPERATIONAL', 'approved', '00000000-0000-4000-a000-000000000002', '#1A1A1A', 'MM',
  'https://meatlessmuscle.com/cookbook', 'https://meatlessmuscle.com/assets/img/cookbok-mockup-tab.png',
  'High-Protein Recipes for Every Meal: Brooke Sellers'' plant-based cookbook and nutrition guide, with over 100 recipes.',
  jsonb_build_object(
    'family', 'brooke-sellers', 'creator', 'Brooke Sellers', 'media_type', 'book', 'book_type', 'cookbook',
    'subtitle', 'High-Protein Recipes for Every Meal', 'format', 'Digital download (PDF)',
    'buy_link', '/go/book-meatless-muscle-cookbook', 'buy_label', 'Get the cookbook',
    'added_by', 'logan', 'book_source', 'sean', 'book_facts_from', 'meatlessmuscle.com/cookbook',
    'cover_source', 'The cookbook''s cover image on meatlessmuscle.com/cookbook, 2026-10-30', 'cover_checked', true,
    'summary', E'High-Protein Recipes for Every Meal is Brooke Sellers'' plant-based cookbook and nutrition guide: over 100 easy-to-follow recipes, from hearty breakfasts and quick snacks to satisfying dinners and protein-packed desserts, all macro-friendly.\n\nAlongside the recipes it covers meeting your protein needs with plant foods, the science behind plant-based nutrition, meal prep and time-saving strategies, and tracking your diet for muscle gain, fat loss or simply staying healthy. It is an instant digital download (PDF) from meatlessmuscle.com.')
where not exists (select 1 from listings where slug = 'meatless-muscle-cookbook-by-brooke-sellers');

-- The book list knows both, so the book crawl never builds them again.
insert into ve_books (title, author, title_key, author_key, isbn13, year, cover_url, description, summary, book_type, vegan_related,
  author_listing_id, listing_id, buy_link, source, status, note)
select 'Heal Your Gut. Balance Your Hormones.', 'Brooke Sellers', 'heal your gut balance your hormones', 'sellers', '9798193575221', 2026,
  l.logo_url, l.description, l.details ->> 'summary', 'health', true, (select id from listings where slug = 'brooke-sellers'), l.id,
  '/go/book-b0hn9myty6', 'manual', 'built', 'Added by hand from its Amazon page (979 ISBN, no ISBN-10), 2026-10-30.'
from listings l where l.slug = 'heal-your-gut-balance-your-hormones-by-brooke-sellers'
on conflict (title_key, author_key) do nothing;

insert into ve_books (title, author, title_key, author_key, cover_url, description, summary, book_type, vegan_related,
  author_listing_id, listing_id, buy_link, source, status, note)
select 'Meatless Muscle Cookbook', 'Brooke Sellers', 'meatless muscle cookbook', 'sellers',
  l.logo_url, l.description, l.details ->> 'summary', 'cookbook', true, (select id from listings where slug = 'brooke-sellers'), l.id,
  '/go/book-meatless-muscle-cookbook', 'manual', 'built', 'Sold on meatlessmuscle.com, not Amazon. Added by hand, 2026-10-30.'
from listings l where l.slug = 'meatless-muscle-cookbook-by-brooke-sellers'
on conflict (title_key, author_key) do nothing;

-- 3. Her channel, the way the first twelve were added (20261029_youtube_channels.sql), in her family.
insert into listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities,
  vegan_status, youtube, instagram, logo_url, details)
select 'Miss Meatless Muscle (YouTube)', 'miss-meatless-muscle-youtube', 'YouTube', '',
  'Brooke Sellers, an NPC bikini overall champion, Vegan bodybuilder and fitness coach, on Vegan nutrition and fitness: training, what she eats, coaching tips, client stories and her competition prep series Vegan Bikini Prep Diaries, co-hosted with Belinda.',
  'approved', 'https://meatlessmuscle.com/', 'Online', 'M', 'youtube', array['all'], null,
  'https://www.youtube.com/@missmeatlessmuscle', '@miss_meatless_muscle',
  'https://yt3.ggpht.com/gyboalA5D0Ij7gXjnQZ4YzOcGVuVnH_og8Sq-OXRXH3O7jxYyTYeWuv3YLFf1b3FtHqWwfpVP3E=s800-c-k-c0x00ffffff-no-rj',
  jsonb_build_object('youtube_channel_id', 'UCP1DdTXuU9TUnJz4UmnCBIg', 'logo_source', 'admin', 'youtube_added', '2026-10-30',
    'family', 'brooke-sellers')
where not exists (select 1 from listings where slug = 'miss-meatless-muscle-youtube');

-- 4. The podcast joins her family.
update listings set details = details || '{"family": "brooke-sellers"}'::jsonb, updated_at = now()
where slug = 'vegans-who-lift-podcast' and status = 'approved' and coalesce(details ->> 'family', '') = '';

-- 5. Her profile: the family, what she does, her work, her YouTube and Facebook, and a bio that covers more than the podcast.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'description', to_jsonb(description), to_jsonb('(bio rewritten from meatlessmuscle.com and her podcast, 2026-10-30)'::text),
  jsonb_build_object('by', 'logan', 'why', 'Sean: fill out Brooke''s profile with her books, podcast and YouTube')
from listings where slug = 'brooke-sellers' and coalesce(details ->> 'family', '') <> 'brooke-sellers';

update listings set
  details = jsonb_set(details || '{"family": "brooke-sellers"}'::jsonb, '{person}', coalesce(details -> 'person', '{}'::jsonb) || jsonb_build_object(
    'title', 'Vegan bodybuilder, fitness coach, author and podcast co-host',
    'bio_source', 'site_and_transcript',
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Heal Your Gut, her book', 'url', 'https://vegansexplore.com/directory/heal-your-gut-balance-your-hormones-by-brooke-sellers'),
      jsonb_build_object('label', 'Meatless Muscle Cookbook', 'url', 'https://vegansexplore.com/directory/meatless-muscle-cookbook-by-brooke-sellers'),
      jsonb_build_object('label', 'Coaching programs', 'url', 'https://meatlessmuscle.com/programs'),
      jsonb_build_object('label', 'Apply for coaching', 'url', 'https://meatlessmuscle.com/apply'),
      jsonb_build_object('label', 'Free guide: 7 high-protein recipes', 'url', 'https://meatlessmuscle.com/seven-recipes')))),
  youtube = 'https://www.youtube.com/@missmeatlessmuscle',
  facebook = coalesce(facebook, 'https://www.facebook.com/profile.php?id=100080355283790'),
  description = E'Brooke Sellers, known as Miss Meatless Muscle, is a Vegan bodybuilder, fitness coach and author. Born and raised in Atlanta, Georgia, she went Vegan in 2018, transformed her own health through weightlifting and plant-based eating, and began competing in 2022; she is an NPC bikini overall champion. Through Meatless Muscle, her online coaching business, she coaches women around the world with custom training, custom nutrition and weekly check-ins, and has helped more than 600 people reach their health goals.\n\nHer book Heal Your Gut. Balance Your Hormones. (2026) is a science-backed roadmap for women tired of bloating, stubborn weight gain, acne, fatigue and feeling dismissed, and her Meatless Muscle Cookbook gathers more than 100 high-protein plant-based recipes. On YouTube she shares training, nutrition and client stories, and documents her competition prep in Vegan Bikini Prep Diaries, co-hosted with Belinda.\n\nShe co-hosts the Vegans Who Lift Podcast on the Vegans Explore Network with John Thomas, the Bodybuilding Vegan, where the two talk openly about training, nutrition, coaching, business and life as plant-based athletes. On the show she has shared her Vegan origin story, debunked fitness myths, answered listener questions and spoken candidly about relationships, mental health, leaving a traditional job for entrepreneurship, and balancing bodybuilding with activism. Together they have welcomed guests such as Robert Cheeke, Dani Taylor, Giacomo Marchese, Korin Sutton and Ella Magers.',
  updated_at = now()
where slug = 'brooke-sellers' and coalesce(details ->> 'family', '') <> 'brooke-sellers';
