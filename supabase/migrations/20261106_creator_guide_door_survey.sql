-- brooke-sellers / ve-pathways: the Creator Guide is free with its survey (Sean, 2026-11-06: "the creator guide is free with the survey...
-- update the creator, like her page, so it doesn't say $11"). The membership rule v6 (canon-ve-door-guides): a business Guide opens by
-- finishing its intake. The creator survey: 16 questions from the creator application (public/ve-gigs.js FORM), 6 required, 250 points.
-- Rows, not code (see 20261103_guide_surveys.sql). Logan's questions and points, Sean's to change.
insert into ve_surveys (slug, guide_slug, title, intro, admits) values
 ('creator-guide', 'creator-guide', 'The creator survey',
  'Tell us about you and what you make. It takes about ten minutes, it is free, and it earns 250 points. Your answers are how we match you to campaigns, collabs and events. Finishing it opens the Creator Guide and your Vegans Explore membership. Either way in before midnight Eastern on January 1, 2027 makes you a Founding Member.', true)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, admits = excluded.admits;
update ve_guides set door = true, survey_slug = 'creator-guide' where slug = 'creator-guide';

delete from ve_survey_questions where survey_slug = 'creator-guide';
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
 ('creator-guide','c_city',1,'text','What city are you based in?','We match gigs city by city.',null,20,true),
 ('creator-guide','c_plats',2,'multi','Where do you post?','Pick all that fit.',
  '[{"v":"instagram","label":"Instagram"},{"v":"tiktok","label":"TikTok"},{"v":"youtube","label":"YouTube"},{"v":"facebook","label":"Facebook"},{"v":"podcast","label":"A podcast"},{"v":"blog","label":"A blog or newsletter"},{"v":"other","label":"Somewhere else"}]',20,true),
 ('creator-guide','c_handles',3,'long','Your handles and followers today','One a line: the platform, your @handle and how many follow you. Be honest: your results show where you stand either way.',null,25,true),
 ('creator-guide','c_main',4,'choice','Your main platform',null,
  '[{"v":"instagram","label":"Instagram"},{"v":"tiktok","label":"TikTok"},{"v":"youtube","label":"YouTube"},{"v":"facebook","label":"Facebook"},{"v":"podcast","label":"A podcast"},{"v":"other","label":"Somewhere else"}]',10,false),
 ('creator-guide','c_topics',5,'multi','What do you post about?','Pick all that fit.',
  '[{"v":"recipes","label":"Recipes and cooking"},{"v":"restaurants","label":"Restaurants and food spots"},{"v":"fitness","label":"Fitness and sport"},{"v":"health","label":"Health and nutrition"},{"v":"fashion","label":"Fashion and beauty"},{"v":"travel","label":"Travel"},{"v":"animals","label":"Animals and advocacy"},{"v":"family","label":"Family and parenting"},{"v":"comedy","label":"Comedy and entertainment"},{"v":"lifestyle","label":"Lifestyle"},{"v":"business","label":"Business and money"},{"v":"art","label":"Music and art"}]',20,true),
 ('creator-guide','c_formats',6,'multi','What do you make?','Pick all that fit.',
  '[{"v":"short","label":"Short videos"},{"v":"photos","label":"Photos and carousels"},{"v":"long","label":"Long video"},{"v":"live","label":"Livestreams"},{"v":"podcast","label":"Podcast"},{"v":"writing","label":"Writing and blogs"},{"v":"ugc","label":"Content for a brand''s own page"},{"v":"hosting","label":"Hosting and on camera"},{"v":"events","label":"Event coverage"}]',15,false),
 ('creator-guide','c_best',7,'long','Links to your best work','Two or three posts you are proud of, one link a line.',null,25,true),
 ('creator-guide','c_vegan',8,'choice','How long have you been Vegan?',null,
  '[{"v":"lt1","label":"Less than a year"},{"v":"1-3","label":"1 to 3 years"},{"v":"3-10","label":"3 to 10 years"},{"v":"10+","label":"More than 10 years"},{"v":"plant","label":"Plant-based, not fully Vegan yet"}]',10,false),
 ('creator-guide','c_audience',9,'long','Who is your audience?','Where they are, their ages, what they come to you for. Whatever you know.',null,15,false),
 ('creator-guide','c_gigs',10,'multi','The kinds of gigs you want','Pick all that fit.',
  '[{"v":"paid","label":"Paid campaigns"},{"v":"collabs","label":"Product collaborations"},{"v":"hosting","label":"Hosting and events"},{"v":"ugc","label":"Content for brands'' own pages"},{"v":"points","label":"Points gigs, to build a record"},{"v":"speaking","label":"Speaking and panels"}]',15,false),
 ('creator-guide','c_brands',11,'long','Brands or events you have worked with','Paid or not.',null,10,false),
 ('creator-guide','c_rates',12,'long','Your rates, if you have them','A post, a Reel or TikTok, hosting for half a day. Only our team sees them.',null,10,false),
 ('creator-guide','c_skills',13,'multi','Other things you do well','Pick all that fit.',
  '[{"v":"editing","label":"Video editing"},{"v":"photo","label":"Photography"},{"v":"design","label":"Design"},{"v":"writing","label":"Writing"},{"v":"social","label":"Social media management"},{"v":"recipes","label":"Recipe development"},{"v":"outreach","label":"Outreach"}]',10,false),
 ('creator-guide','c_bio',14,'long','Tell us about you and what you make','In your own words.',null,25,true),
 ('creator-guide','c_why',15,'long','What would make this worth it for you?',null,null,10,false),
 ('creator-guide','c_heard',16,'text','How did you hear about us?','A friend, Instagram, an event...',null,10,false);
