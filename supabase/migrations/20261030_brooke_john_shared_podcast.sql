-- Brooke Sellers and John Thomas, each their own page, the Vegans Who Lift Podcast shared (Sean, 2026-10-30: "we don't have to
-- mention John. We just could say she was the co-host of the Vegans Who Lift podcast... talk about her working on that new show...
-- the Bikini Diaries... put that more on the forefront since that's her current thing... the podcast and YouTube channels, they should
-- be able to be shared by multiple people... have John have the podcast, and he also has a YouTube channel as well... I want to share
-- this with him so he can see his profile").
--
-- A listing can now belong to more than one family (details.families, read by loadFamily in directory/listing.html). The podcast is
-- its own family plus both of theirs, so it shows on each person's page; on its own page it lists only the two of them. Brooke's
-- books and channel stay in her family alone, John's channel in his.
-- Brooke's bio leads with Vegan Bikini Prep Diaries (her current show, co-hosted with Belinda), and the podcast is past tense (it
-- ended; marked Ended 2026-10-30). Neither bio names the other. Facts: meatlessmuscle.com and her channel; John's channel's own
-- description (read through ve-youtube resolve). John's channel picture is copied in by ve-logo-keeper. Safe to run twice.

-- 1. The podcast: shared by both.
update listings set
  details = details || jsonb_build_object('family', 'vegans-who-lift', 'families', jsonb_build_array('brooke-sellers', 'john-thomas')),
  description = 'John Thomas (The Bodybuilding Vegan) and Brooke Sellers (Miss Meatless Muscle) covered Vegan bodybuilding and fitness: strength training, nutrition, coaching and thriving as a Vegan athlete.',
  updated_at = now()
where slug = 'vegans-who-lift-podcast' and coalesce(details ->> 'family', '') <> 'vegans-who-lift';

-- 2. Brooke: her current show first, the podcast in the past, no co-host named.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'description', to_jsonb(description), to_jsonb('(bio rewritten: Vegan Bikini Prep Diaries first, podcast past tense)'::text),
  jsonb_build_object('by', 'logan', 'why', 'Sean 2026-10-30: lead with her current show; past tense on Vegans Who Lift; no co-host named')
from listings where slug = 'brooke-sellers' and description not like 'Brooke Sellers, known as Miss Meatless Muscle, is a Vegan bodybuilder, fitness coach and author. Her current show%';

update listings set
  details = jsonb_set(details, '{person}', coalesce(details -> 'person', '{}'::jsonb) || jsonb_build_object(
    'title', 'Vegan bodybuilder, fitness coach, author and co-host of Vegan Bikini Prep Diaries',
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Vegan Bikini Prep Diaries', 'url', 'https://meatlessmuscle.com/series-vegan-bikini-prep-diaries'),
      jsonb_build_object('label', 'Heal Your Gut, her book', 'url', 'https://vegansexplore.com/directory/heal-your-gut-balance-your-hormones-by-brooke-sellers'),
      jsonb_build_object('label', 'Meatless Muscle Cookbook', 'url', 'https://vegansexplore.com/directory/meatless-muscle-cookbook-by-brooke-sellers'),
      jsonb_build_object('label', 'Coaching programs', 'url', 'https://meatlessmuscle.com/programs'),
      jsonb_build_object('label', 'Apply for coaching', 'url', 'https://meatlessmuscle.com/apply'),
      jsonb_build_object('label', 'Free guide: 7 high-protein recipes', 'url', 'https://meatlessmuscle.com/seven-recipes')))),
  description = E'Brooke Sellers, known as Miss Meatless Muscle, is a Vegan bodybuilder, fitness coach and author. Her current show is Vegan Bikini Prep Diaries, a weekly YouTube series she co-hosts with Belinda: an inside look at Vegan bodybuilding through the eyes of two NPC competitors chasing the stage, now past 70 episodes. Alongside it she films Road to Stage 2027, a weekly training log of her build toward her 2027 competition.\n\nBorn and raised in Atlanta, Georgia, she went Vegan in 2018, transformed her own health through weightlifting and plant-based eating, and began competing in 2022; she is an NPC bikini overall champion. Through Meatless Muscle, her online coaching business, she coaches women around the world with custom training, custom nutrition and weekly check-ins, and has helped more than 600 people reach their health goals.\n\nHer book Heal Your Gut. Balance Your Hormones. (2026) is a science-backed roadmap for women tired of bloating, stubborn weight gain, acne, fatigue and feeling dismissed, and her Meatless Muscle Cookbook gathers more than 100 high-protein plant-based recipes.\n\nShe was a co-host of the Vegans Who Lift Podcast on the Vegans Explore Network, where she shared her Vegan origin story, answered listener questions and talked openly about training, nutrition, coaching, mental health and leaving a traditional job for entrepreneurship.',
  updated_at = now()
where slug = 'brooke-sellers';

-- 3. John: his family, his channel, his YouTube link, and a bio from his own words.
insert into listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities,
  vegan_status, youtube, instagram, logo_url, details)
select 'The Bodybuilding Vegan (YouTube)', 'thebodybuildingvegan-youtube', 'YouTube', '',
  'John Thomas, The Bodybuilding Vegan, a Vegan bodybuilder and coach with more than 15 years in fitness, on training, custom diet and training programs, and his goal of becoming the first plant-based IFBB Pro in Men''s Open Bodybuilding.',
  'approved', 'https://linktr.ee/thebodybuildingvegan', 'Online', 'T', 'youtube', array['all'], null,
  'https://www.youtube.com/@thebodybuildingvegan', '@thebodybuildingvegan',
  'https://yt3.ggpht.com/ytc/AIdro_mx6cCVxAYWULet5ttyKDyfSVLpbdcT7AzvuLSpN7u_kbOF=s800-c-k-c0x00ffffff-no-rj',
  jsonb_build_object('youtube_channel_id', 'UCR9viLaxA8B0iKVxjonE-7w', 'logo_source', 'admin', 'youtube_added', '2026-10-30', 'family', 'john-thomas')
where not exists (select 1 from listings where slug = 'thebodybuildingvegan-youtube');

insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'description', to_jsonb(description), to_jsonb('(bio rewritten from his channel and our shows, 2026-10-30)'::text),
  jsonb_build_object('by', 'logan', 'why', 'Sean 2026-10-30: set John up to share his profile; podcast past tense, no co-host named')
from listings where slug = 'john-thomas' and coalesce(details ->> 'family', '') <> 'john-thomas';

update listings set
  details = jsonb_set(details || '{"family": "john-thomas"}'::jsonb, '{person}', coalesce(details -> 'person', '{}'::jsonb) || jsonb_build_object(
    'title', 'Vegan bodybuilder and fitness coach', 'bio_source', 'site_and_transcript')),
  youtube = 'https://www.youtube.com/@thebodybuildingvegan',
  description = E'John Thomas, known as The Bodybuilding Vegan, is a Vegan bodybuilder and fitness coach with more than 15 years in fitness. He has coached more than 250 people with custom diet and training programs, from powerlifters and bodybuilders to soccer moms and endurance athletes, and works especially with Vegan and vegetarian clients. Vegetarian from the age of 10 and Vegan for more than 18 years, he is working to become the first plant-based IFBB Pro in Men''s Open Bodybuilding.\n\nHe was a co-host of the Vegans Who Lift Podcast on the Vegans Explore Network, where he shared his Vegan origin story, debunked fitness myths and answered listener questions on training and hydration, and talked through injury prevention, bulking, meal prep, supplements and self-coaching, along with leaving a 9-to-5 job for entrepreneurship, growing on social media and the balance between bodybuilding and activism.\n\nJohn also works with Vegans Explore off the mic. He co-produced Vegan Foodie Fest Miami with Vegans Explore and Florida Marketplace Group, hosting the day and holding a meet and greet at his tent.',
  updated_at = now()
where slug = 'john-thomas';
