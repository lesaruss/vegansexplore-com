-- Film pages (Sean, 2026-10-29: "a trailer from like YouTube of the documentaries on the page, add a little bit more of a summary...
-- where it can be viewed, like if it's Netflix, if it's YouTube... the video on the left and the text on the right").
-- Each Documentaries & Films listing gets, in listings.details (drawn by renderFilmOverview in directory/listing.html):
--   video   {id, kind: trailer | film, channel}  a YouTube upload from the filmmakers, their distributor or Netflix; every id was
--           checked through YouTube oEmbed (ve-off-lookup yt: the title and channel) on 2026-10-29. Five are the full film, shared
--           free by its makers. Left without one: They're Trying to Kill Us, Vegucated, Christspiracy, Live and Let Live, The End of
--           Meat (no upload from their makers found).
--   watch   [{kind, url, note}]  website, youtube, netflix, apple_tv; each opened and checked (ve-off-lookup page) the same day.
--           Netflix only for Seaspiracy, a Netflix original: Netflix pages do not say what is streaming in the US.
--   summary a longer About than the card's description, written from what is published about each film.
-- Four websites the films no longer hold were cleared (a ve_listing_edits row each): letlivefilm.com and theendofmeat.com now serve
-- gambling sites, gamechangersmovie.com and aprayerforcompassion.com no longer exist.

with v(slug, video, watch, summary) as (values
  ('earthlings', '{"id":"3XrY2TP0ZyU","kind":"film","channel":"NATIONEARTH"}',
   '[{"kind":"youtube","url":"https://www.youtube.com/watch?v=3XrY2TP0ZyU","note":"Free"},{"kind":"website","url":"https://www.nationearth.com/"}]',
   'Earthlings looks at how people use animals in five ways: as pets, for food, for clothing, for entertainment and for scientific research. Written and directed by Shaun Monson, narrated by Joaquin Phoenix and scored by Moby, it is made largely from hidden camera footage. Its makers share the full film free.'),
  ('cowspiracy', '{"id":"2SRPk6gB3g0","kind":"trailer","channel":"COWSPIRACY: the sustainability secret"}',
   '[{"kind":"apple_tv","url":"https://tv.apple.com/us/movie/cowspiracy-the-sustainability-secret/umc.cmc.4djzn08tzumlqjogm21u8dfqd","note":"Rent or buy"},{"kind":"website","url":"https://www.cowspiracy.com/"}]',
   'Cowspiracy follows filmmaker Kip Andersen as he looks into the environmental cost of animal agriculture, from greenhouse gases and water use to deforestation and ocean dead zones, and asks why the largest environmental groups say so little about it. Leonardo DiCaprio was an executive producer of its updated release.'),
  ('forks-over-knives', '{"id":"mZGs0XsS_lI","kind":"film","channel":"Forks Over Knives"}',
   '[{"kind":"youtube","url":"https://www.youtube.com/watch?v=mZGs0XsS_lI","note":"Free"},{"kind":"apple_tv","url":"https://tv.apple.com/us/movie/forks-over-knives/umc.cmc.4l1o71mo30dhvmd2xrqecnox4","note":"Rent or buy"},{"kind":"website","url":"https://www.forksoverknives.com/the-film/"}]',
   'Forks Over Knives follows Dr. T. Colin Campbell, a nutritional biochemist, and Dr. Caldwell Esselstyn, a surgeon, whose research points to a whole-food, plant-based diet as a way to prevent, and in some cases reverse, heart disease, type 2 diabetes and other chronic illnesses. Its makers now share the full film free.'),
  ('dominion', '{"id":"TY3qkr1XIMo","kind":"film","channel":"Farm Exposure"}',
   '[{"kind":"website","url":"https://www.dominionmovement.com/watch","note":"Free"},{"kind":"youtube","url":"https://www.youtube.com/watch?v=TY3qkr1XIMo","note":"Free"}]',
   'Dominion uses drones and hidden cameras inside Australian farms and slaughterhouses to question how society treats the animals it uses. Narrated by Joaquin Phoenix, Rooney Mara and Sia, among others, it contains graphic footage. Its makers share the full film free.'),
  ('theyre-trying-to-kill-us', null,
   '[{"kind":"apple_tv","url":"https://tv.apple.com/us/movie/theyre-trying-to-kill-us/umc.cmc.4a54o6w6f2q19rr54okckrpax","note":"Rent or buy"},{"kind":"youtube","url":"https://www.youtube.com/watch?v=qgqmGUdifwA","note":"Rent or buy"},{"kind":"website","url":"https://www.theyretryingtokillus.com/"}]',
   'They''re Trying to Kill Us follows John Lewis, a Vegan hip hop artist, as he looks at why Black and Latino Americans face higher rates of diet-related disease, from food deserts and poverty to how food is marketed. Chris Paul and Billie Eilish are executive producers, with voices from hip hop, sports and medicine.'),
  ('what-the-health', '{"id":"Jf44vLndiRM","kind":"trailer","channel":"What The Health"}',
   '[{"kind":"apple_tv","url":"https://tv.apple.com/us/movie/what-the-health/umc.cmc.46mxbqyc9gz1plowmy3klg4o4","note":"Rent or buy"},{"kind":"website","url":"https://www.whatthehealthfilm.com/"}]',
   'What the Health follows Kip Andersen as he looks at the links between diet and chronic disease, and at the ties between health organizations and the food and drug industries. From the makers of Cowspiracy, with Joaquin Phoenix as an executive producer.'),
  ('the-game-changers', '{"id":"iSpglxHTJVM","kind":"trailer","channel":"The Game Changers"}', '[]',
   'The Game Changers follows James Wilks, a UFC fighter and combat trainer, as he meets elite athletes, soldiers and scientists to learn what plant-based eating does for strength, endurance and recovery. Its executive producers include Arnold Schwarzenegger, James Cameron and Jackie Chan.'),
  ('meet-your-meat', '{"id":"ykTH_b-cXyE","kind":"film","channel":"PETA"}',
   '[{"kind":"youtube","url":"https://www.youtube.com/watch?v=ykTH_b-cXyE","note":"Free"},{"kind":"website","url":"https://www.peta.org/videos/meet-your-meat/","note":"Free"}]',
   'Meet Your Meat is a short film from PETA, narrated by Alec Baldwin, that follows chickens, pigs and cattle through factory farms, hatcheries and slaughterhouses. It contains graphic footage.'),
  ('vegucated', null,
   '[{"kind":"apple_tv","url":"https://tv.apple.com/us/movie/vegucated/umc.cmc.4qazlnnjw2qh2jr7edurxrwfp","note":"Rent or buy"},{"kind":"website","url":"https://getvegucated.com/"}]',
   'Vegucated follows three meat and cheese loving New Yorkers who agree to eat Vegan for six weeks. Along the way they learn where their food comes from and how eating Vegan fits into everyday life, with humor and some hard truths.'),
  ('christspiracy', null,
   '[{"kind":"website","url":"https://christspiracy.com/"}]',
   'Christspiracy follows filmmakers Kip Andersen and Kameron Waters as they ask what Jesus and Christianity teach about killing animals, meeting religious leaders, scholars and communities along the way. From a co-director of Cowspiracy.'),
  ('live-and-let-live', null, '[]',
   'Live and Let Live looks at how we relate to animals, the history of Veganism, and the ethical, environmental and health reasons people go Vegan, through the stories of six people who changed how they live.'),
  ('plantpure-nation', '{"id":"yBKnG9Y0owQ","kind":"film","channel":"PlantPure TV"}',
   '[{"kind":"youtube","url":"https://www.youtube.com/watch?v=yBKnG9Y0owQ","note":"Free"}]',
   'PlantPure Nation follows Nelson Campbell, son of Forks Over Knives researcher Dr. T. Colin Campbell, as he works to get a plant-based nutrition study funded in Kentucky and shows a small town what ten days of plant-based eating can do for people''s health. Its makers share the full film free.'),
  ('the-end-of-meat', null,
   '[{"kind":"youtube","url":"https://www.youtube.com/watch?v=BJPRFtjEM-s","note":"Rent or buy"}]',
   'The End of Meat asks what a world without meat could look like and what it would mean for the planet, the animals and ourselves. Director Marc Pierschel meets activists, scientists and food makers, from animal sanctuaries to companies growing meat from cells.'),
  ('hope-what-you-eat-matters', '{"id":"wLjkbVusxGk","kind":"trailer","channel":"H.O.P.E. The Project"}',
   '[{"kind":"website","url":"https://hope-theproject.com/"}]',
   'H.O.P.E. What You Eat Matters looks at how the typical Western diet affects our health, the animals and the planet, with doctors, scientists and athletes on the evidence for plant-based eating.'),
  ('peaceable-kingdom-the-journey-home', '{"id":"qbamdBF4L1Y","kind":"trailer","channel":"Tribe of Heart"}',
   '[{"kind":"website","url":"https://www.peaceablekingdomfilm.org/"}]',
   'Peaceable Kingdom: The Journey Home tells the stories of farmers raised in traditional animal farming who came to question it, and of the rescued animals and sanctuaries that changed them. From the filmmakers of Tribe of Heart.'),
  ('eating-you-alive', '{"id":"hJmIJd-qS50","kind":"trailer","channel":"Eating You Alive"}',
   '[{"kind":"website","url":"https://www.eatingyoualive.com/"}]',
   'Eating You Alive looks at why heart disease, diabetes and cancer are so common, and at the evidence that a whole-food, plant-based diet can help prevent and reverse them, with doctors, researchers and patients sharing what they have seen.'),
  ('seaspiracy', '{"id":"1Q5CXN7soQg","kind":"trailer","channel":"Netflix"}',
   '[{"kind":"netflix","url":"https://www.netflix.com/title/81014008","note":"Stream"}]',
   'Seaspiracy follows filmmaker Ali Tabrizi as he sets out to document the harm people do to the ocean and uncovers the scale of the global fishing industry, from bycatch and lost fishing gear to labels that promise sustainable seafood. A Netflix original from the makers of Cowspiracy.'),
  ('a-prayer-for-compassion', '{"id":"aTSgHSuQtZ4","kind":"trailer","channel":"The Compassion Project"}', '[]',
   'A Prayer for Compassion follows filmmaker Thomas Jackson across America and abroad as he asks people of many faiths how their beliefs speak to compassion for animals, and why so many people of faith still eat them. Jerome Flynn is an executive producer.')
)
update listings l set
  details = coalesce(l.details, '{}'::jsonb)
    || jsonb_build_object('watch', v.watch::jsonb, 'summary', v.summary)
    || case when v.video is null then '{}'::jsonb else jsonb_build_object('video', v.video::jsonb) end,
  updated_at = now()
from v
where l.slug = v.slug and l.status = 'approved' and l.category = 'Documentaries & Films';

-- The websites the films no longer hold: logged first, then cleared.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select l.id, 'website', to_jsonb(l.website), to_jsonb(''::text),
  jsonb_build_object('by', 'logan', 'where', 'migration 20261029_film_pages', 'why',
    case when l.slug in ('live-and-let-live', 'the-end-of-meat') then 'the address now serves a gambling site' else 'the address no longer exists' end)
from listings l
where l.slug in ('live-and-let-live', 'the-end-of-meat', 'the-game-changers', 'a-prayer-for-compassion')
  and l.status = 'approved' and l.category = 'Documentaries & Films' and coalesce(l.website, '') <> '';

update listings set website = '', updated_at = now()
where slug in ('live-and-let-live', 'the-end-of-meat', 'the-game-changers', 'a-prayer-for-compassion')
  and status = 'approved' and category = 'Documentaries & Films' and coalesce(website, '') <> '';
