-- SoFlo Vegans Podcast 114 (airs Wed Nov 25, 2026), the run sheet as Sean laid it out on 2026-11-21 (playbook ve-city-shows / ve-podcast-studio).
-- Sean: no Chaka Khan, no national headlines; "King Tide for sure... a well thought out story"; mention all the new things in South Florida
-- (not Hard Rock Stadium); "we should still have the what's coming up segment from Kai"; the Holiday Guide commercial after the King Tide;
-- Veronica's Love Life Cafe spotlight; River: Friendsgiving recap, ART BASIL, March for Animals at FIU, Community Nights in February, claim
-- your free membership, submit events; in Ron's spot, the call for community managers and content creators; a motivational intro and an outro
-- that closes on what we're gearing up for. Applied by Logan 2026-11-21 (execute_sql); this file is the record. Positions 10, 90, 100 unchanged.
do $$
declare ep uuid := '87c6333a-11b8-4459-8a68-c0ea19831ade';
begin
if exists (select 1 from ve_pod_segments where episode_id = ep and position = 35) then return; end if;   -- already applied

update ve_pod_segments set status='script', bed_path='media/podcast/sound/soflo-intro-v1.mp3', note = note || E'\n2026-11-21: Sean: "my intro should be motivational... what''s going on, call to actions, how we can use your support." Record it on this card.',
 script = $s$Hey South Florida, it's Sean A. Russell, and this is the SoFlo Vegans Podcast. Tomorrow is ThanksLiving, so let me start with thank you. Thank you for listening, for showing up to the events, and for every Vegan spot you've told a friend about.

Here's what's going on. Our Vegan places are working harder than ever to stay open, and today you'll hear from one of them: Veronica, of Love Life Cafe in Wynwood. We're also planning our first South Florida Community Nights for February, with more events all through 2027.

Here's how you can help. Claim your free membership at vegansexplore.com, so you're the first to know. Tell us what's happening in your corner of South Florida. And this week, eat at a Vegan spot you love, and bring somebody with you. That's how we keep this community growing. Kai, what's coming up?$s$
 where episode_id=ep and position=20;

insert into ve_pod_segments (episode_id, position, kind, title, status, speaker, bed_path, sources, note, script, audio_path) values
(ep, 30, 'spot', 'Coming up today', 'script', 'kai', 'media/podcast/beds/news-breaking-v1.mp3', '[]'::jsonb, '2026-11-21: Sean: "we should still have the what''s coming up segment from Kai."',
 $s$Thanks, Sean. Here's what's coming up today. The king tides peak in South Florida this week, so we'll tell you what to expect and how to get around them. Liz has what's new in the Directory, plus a spotlight on Veronica Menon of Love Life Cafe in Wynwood. And River has a ThanksLiving recap, a free Miami Art Week party, a march at FIU, and something we're building for February. Stay with us.$s$, null),
(ep, 35, 'news', 'Top story: the king tides peak this week', 'script', 'kai', 'media/podcast/beds/news-measured-v1.mp3',
 jsonb_build_array(
   jsonb_build_object('url','https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8723214','title','NOAA tide predictions, Virginia Key, FL (8723214), Nov 22 to Dec 12, 2026','source','NOAA Tides and Currents','city','south-florida'),
   jsonb_build_object('url','https://oceanservice.noaa.gov/facts/kingtide.html','title','What is a King Tide?','source','NOAA National Ocean Service'),
   jsonb_build_object('url','https://oceanservice.noaa.gov/facts/nuisance-flooding.html','title','What is high tide flooding?','source','NOAA National Ocean Service')),
 '2026-11-21: Sean: "King Tide for sure... focus most of our energy on that and make it more of a well thought out story." Facts read 2026-11-21 through ve-web-reader: NOAA predictions at Virginia Key (MLLW): Tue 11/24 8:23 AM 2.78 ft, Wed 11/25 9:13 AM 2.80 ft (highest Nov 22 to Dec 12), Thu 10:04 AM 2.77 ft, Fri 10:55 AM 2.70 ft. King tide definition and high tide flooding from NOAA''s pages. No flooding forecast for any street is claimed.',
 $s$I'm Kai, with the big story in South Florida this week: the king tides.

A king tide isn't a scientific term. It's what people call the exceptionally high tides of the year, when the pull of the moon and the sun line up.

NOAA's tide predictions for Virginia Key, just off Miami, show the highest tides of the next three weeks happening right now: Tuesday, today, Thursday and Friday mornings, cresting between about 8 and 11 AM, at nearly two point eight feet above the low-water mark. Today's, at about 9:15, is the highest.

In low-lying neighborhoods, that can mean saltwater in the street on a perfectly sunny day. NOAA calls it high tide flooding, and says it's becoming more common along the coast as sea levels rise.

So, for this week: don't drive or walk through standing water. It's saltwater, and it's hard on your car and on you. If you walk your dog near the water, rinse their paws when you get home. And give yourself a little extra time on the morning commute.

And the bigger picture: what we put on our plates is one of the everyday choices we each have over our footprint on this planet. It's part of why a lot of us eat the way we do.$s$, null),
(ep, 38, 'commercial', 'The Holiday Guide commercial', 'approved', 'theo', null, '[]'::jsonb, '2026-11-21: Sean: put the Holiday Guide after the King Tide segment.', '', 'media/podcast/commercials/holiday-guide-v3.mp3'),
(ep, 40, 'directory', 'What''s new in the Directory (South Florida)', 'script', 'liz', 'media/podcast/beds/directory-v3.mp3',
 jsonb_build_array(
   jsonb_build_object('url','https://vegansexplore.com/directory/holistic-holiday-at-sea-miami','title','Holistic Holiday at Sea','source','Vegans Explore Directory','city','Miami'),
   jsonb_build_object('url','https://vegansexplore.com/directory/aplantbaseddiet-org','title','aPlantBasedDiet.org','source','Vegans Explore Directory','city','Miami'),
   jsonb_build_object('url','https://vegansexplore.com/directory/poderosa-minded','title','Poderosa Minded','source','Vegans Explore Directory','city','Fort Lauderdale'),
   jsonb_build_object('url','https://vegansexplore.com/directory/animal-rights-foundation-of-florida','title','Animal Rights Foundation of Florida','source','Vegans Explore Directory','city','Fort Lauderdale')),
 '2026-11-21: Sean: "we can mention all the new things in South Florida... leave out Hard Rock Stadium."',
 $s$Thanks, Kai. Hi everyone, it's Liz, with what's new in the Vegans Explore Directory here in South Florida.

If a Vegan getaway is on your list, Holistic Holiday at Sea just joined. It calls itself the original Vegan cruise: a Vegan wellness cruise out of Miami, with a 100% whole-foods, plant-based menu and more than 100 classes on board, from cooking to yoga.

Two event makers joined too: aPlantBasedDiet.org, which puts on Vegan events in Miami, and Poderosa Minded in Fort Lauderdale, the team behind the Vegan Friendsgiving River will tell you about later.

And the Animal Rights Foundation of Florida, working for animals across the state since 1989, through humane education and campaigns, and encouraging a Vegan diet.

You'll find them all at vegansexplore.com, under South Florida.$s$, null),
(ep, 42, 'spot', 'Spotlight: introducing Veronica of Love Life Cafe', 'script', 'liz', 'media/podcast/beds/guides-v3.mp3',
 jsonb_build_array(jsonb_build_object('url','https://vegansexplore.com/directory/love-life-cafe','title','Love Life Cafe','source','Vegans Explore Directory','city','Miami')),
 '2026-11-21: Veronica''s spotlight (reel v7 locked). Facts from her interview (Drive "Love Life Cafe v2.mp4", transcribed): she and Diego bought the business back this year and returned to their original space; opened 2015; and the listing (100% Vegan, whole food, certified kosher, Wynwood).',
 $s$Now for this week's spotlight. Love Life Cafe has been part of Wynwood since 2015: a 100% Vegan, whole-food, kosher cafe, with bowls, pizzas, sushi, burgers and all-day breakfast. This year, Veronica Menon and Diego bought the business back and returned to their original space. Sean sat down with Veronica to ask how the Vegan community feels from behind the counter right now. Here's Veronica.$s$, null),
(ep, 44, 'dropin', 'Veronica Menon, Love Life Cafe', 'approved', null, 'media/podcast/beds/interview-v3.mp3', '[]'::jsonb,
 '2026-11-21: from Drive "Love Life Cafe v2.mp4", 17:56.1 to 19:58.5 (2:02), "I think the community..." to "People wanna be a part of it." Leveled -17.1 LUFS.', '', 'media/podcast/soflo-vegans-podcast/2026-11-25/veronica-clip-v1.mp3'),
(ep, 46, 'spot', 'After Veronica: go see them', 'script', 'liz', 'media/podcast/beds/guides-v3.mp3', '[]'::jsonb,
 '2026-11-21: facts from her interview: never a fryer, never refined sugar, only olive and coconut oil since 2015; catering, kids'' birthday parties and school lunches.',
 $s$That's Veronica Menon of Love Life Cafe. Since 2015, the cafe has cooked only with olive and coconut oil, with no fryer and no refined sugar. If you're in Miami this holiday week, stop by, try something new and say hi. And if you have a birthday, a school lunch or an event coming up, ask Love Life about catering. You'll find them in the Vegans Explore Directory.$s$, null);

update ve_pod_segments set title='What''s on: Friendsgiving recap, ART BASIL, March for Animals at FIU, Community Nights', status='script', speaker='river', bed_path='media/podcast/beds/community-v3.mp3',
 sources = jsonb_build_array(
   jsonb_build_object('url','https://vegansexplore.com/events?event=b6d87aaf-9d36-445d-841c-567f2352df2d','title','2nd Annual Vegan Friendsgiving: Rooted In Culture Pop-Up','source','Vegans Explore Events','city','Fort Lauderdale'),
   jsonb_build_object('url','https://vegansexplore.com/events?event=439abd0a-4e07-4a63-9bae-59c0fa8b7a10','title','ART BASIL at Aguacate Garden of Love','source','Vegans Explore Events','city','Miami'),
   jsonb_build_object('url','https://vegansexplore.com/events?event=1c58413e-03fa-4231-bc51-be02d27a2048','title','March for Animals at FIU: Cruelty Free Campus','source','Vegans Explore Events','city','Miami')),
 note = note || E'\n2026-11-21: Sean: "Friendsgiving, we can talk about... Art Basel... March for Animals at FIU... little stories... plant the seed for February... the best way to stay in the loop is to claim your free membership... start putting out the voices and try to get people to submit." The Friendsgiving is Sun Nov 22, after this was written: on Monday add one line on how it went (photos, turnout) if Poderosa Minded posts it; nothing is claimed about it before then. The Dolphins night is off (Sean).',
 script = $s$Thanks, Liz. I'm River, and I find the events worth leaving the house for. Here's what's on in South Florida.

First, a thank you. Poderosa Minded's second annual Vegan Friendsgiving, part of their Rooted In Culture pop-up series, finally happened on Sunday at Uncommon Path Brewing in Fort Lauderdale's Thrive Art District, after the weather pushed it back. Thank you, Poderosa Minded, for bringing everyone around one table.

Next Wednesday, December 2nd, during Miami Art Week, Aguacate Garden of Love hosts ART BASIL. That's basil, the herb. It's a free party from 4 PM, with local artists, live music, DJ sets and basil-inspired Vegan recipes. It's an independent community event, not part of Art Basel.

The next day, Thursday, December 3rd, there's a March for Animals at FIU, part of a nationwide day of action calling on universities to end animal testing and invest in research without animals. Meet on the field behind the Graham Center at 11 AM. The march runs from 12:30 to 1:30, and it's open to everyone, not just students.

And something we're building: Vegans Explore Community Nights are coming to South Florida in February, with more events planned all through 2027. The best way to stay in the loop is to claim your free membership at vegansexplore.com.

One more thing: we want to hear from you. Hosting something, or went to something great? Tap Submit an event at vegansexplore.com, under Events, and it could end up on a future episode.$s$
 where episode_id=ep and position=50;

update ve_pod_segments set title='Your call-out: community managers and content creators', kind='dropin', status='script', speaker=null, bed_path='media/podcast/beds/local-voice-v1.mp3',
 note = note || E'\n2026-11-21: Sean: "in that spot where we''re going to talk about Ron, let him know that we''re looking for community managers and content creators who want to be considered for future opportunities... sign up. It''s free, and it lets us know." The free sign-up is the Explorer survey (it asks what they would like to run). If Ron signs up before Monday, Logan adds Sean''s announcement line here (check set for Mon 9:50 AM). Record it on this card.',
 script = $s$Before we go: we're looking for community managers and content creators across South Florida. People who want to be boots on the ground as we keep growing, and who want to be considered for future opportunities with us. If that's you, sign up free at vegansexplore.com. The short survey asks what you'd love to do, and that's how we find you.$s$
 where episode_id=ep and position=60;

update ve_pod_segments set status='script', bed_path='media/podcast/sound/soflo-outro-v1.mp3',
 note = note || E'\n2026-11-21: Sean: "the outro is reiterating that and closing them out. Let them know about what we''re gearing up for." Record it on this card.',
 script = $s$That's our show. Thank you to Veronica and everyone at Love Life Cafe for sharing their story.

Here's what we're gearing up for: our first South Florida Community Nights in February, more events all through 2027, and new chapters on the way. And if you join before January 1st, you're a Founding Member for good.

So claim your free membership at vegansexplore.com, tell us what's happening near you, and this ThanksLiving, go eat at a Vegan spot you love and bring somebody with you. Happy ThanksLiving, South Florida. We'll see you next Wednesday.$s$
 where episode_id=ep and position=80;

update ve_pod_episodes set title = 'King Tides, Love Life Cafe and Community Nights Coming in February' where id=ep and title ilike '%lineup in progress%';
end $$;

-- Later 2026-11-21, Sean: "leave off Poderosa Minded... maybe we put in a thing for bounties... start collecting them now" and "we want to take a
-- look back at the year in South Florida... favorite moments... restaurants that we might have lost... our year end episode". Poderosa Minded
-- out of Liz's list and the Friendsgiving recap out of River's; bounties in Liz's segment; the year-end call in Sean's card 60; Kai's coming-up
-- line to match. Applied by Logan 2026-11-21.
do $$
declare ep uuid := '87c6333a-11b8-4459-8a68-c0ea19831ade';
begin
update ve_pod_segments set sources = (select jsonb_agg(x) from jsonb_array_elements(sources) x where x->>'title' <> 'Poderosa Minded'),
 script = $s$Thanks, Kai. Hi everyone, it's Liz, with what's new in the Vegans Explore Directory here in South Florida.

If a Vegan getaway is on your list, Holistic Holiday at Sea just joined. It calls itself the original Vegan cruise: a Vegan wellness cruise out of Miami, with a 100% whole-foods, plant-based menu and more than 100 classes on board, from cooking to yoga.

aPlantBasedDiet.org, which puts on Vegan events in Miami, joined too. And so did the Animal Rights Foundation of Florida, working for animals across the state since 1989, through humane education and campaigns, and encouraging a Vegan diet.

And while we wind down the year, here's something you can do right now. Members can take on bounties: check in at a Vegan spot, share your food photos, or film a recap at an event. Each one earns you points, every check-in and photo helps a local Vegan business get seen, and some bounties even open up paid work. In 2027, we're launching lots of new features and new ways to use those points, so start collecting them now. You'll find your bounties in your dashboard at vegansexplore.com.$s$
 where episode_id=ep and position=40 and script like '%Poderosa%';
update ve_pod_segments set title='What''s on: ART BASIL, March for Animals at FIU, Community Nights',
 sources = (select jsonb_agg(x) from jsonb_array_elements(sources) x where x->>'title' not ilike '%Friendsgiving%'),
 script = $s$Thanks, Liz. I'm River, and I find the events worth leaving the house for. Here's what's on in South Florida.

Next Wednesday, December 2nd, during Miami Art Week, Aguacate Garden of Love hosts ART BASIL. That's basil, the herb. It's a free party from 4 PM, with local artists, live music, DJ sets and basil-inspired Vegan recipes. It's an independent community event, not part of Art Basel.

The next day, Thursday, December 3rd, there's a March for Animals at FIU, part of a nationwide day of action calling on universities to end animal testing and invest in research without animals. Meet on the field behind the Graham Center at 11 AM. The march runs from 12:30 to 1:30, and it's open to everyone, not just students.

And something we're building: Vegans Explore Community Nights are coming to South Florida in February, with more events planned all through 2027. The best way to stay in the loop is to claim your free membership at vegansexplore.com.

One more thing: we want to hear from you. Hosting something, or went to something great? Tap Submit an event at vegansexplore.com, under Events, and it could end up on a future episode.$s$
 where episode_id=ep and position=50 and script like '%Friendsgiving%';
update ve_pod_segments set script = $s$Thanks, Sean. Here's what's coming up today. The king tides peak in South Florida this week, so we'll tell you what to expect and how to get around them. Liz has what's new in the Directory, a way to start earning points right now, and a spotlight on Veronica Menon of Love Life Cafe in Wynwood. And River has a free Miami Art Week party, a march at FIU, and something we're building for February. Stay with us.$s$
 where episode_id=ep and position=30;
update ve_pod_segments set title='Your call-out: community managers, content creators and the year in South Florida',
 script = $s$Before we go: we're looking for community managers and content creators across South Florida. People who want to be boots on the ground as we keep growing, and who want to be considered for future opportunities with us. If that's you, sign up free at vegansexplore.com. The short survey asks what you'd love to do, and that's how we find you.

And one more thing. Our year-end episode is all about you. We want to look back at the year in South Florida together. What were your favorite moments? What stood out? Is there a restaurant we lost this year that you want to give a shout-out to? This is your chance. Send us a voice memo or a note at hello@vegansexplore.com, and you might hear yourself on the show.$s$
 where episode_id=ep and position=60;
end $$;
