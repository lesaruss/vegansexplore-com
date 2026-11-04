-- ve-door-guides: the Vegan Restaurant Guide becomes a door Guide (Sean, 2026-11-04, copy locked: docs/proposals/door-guides-enrollment-copy.md).
-- The restaurant survey: 17 questions in four parts, 5 required, 100 points. Rows, not code (see 20261103_guide_surveys.sql).
-- A story answer's "Can be shown on my page" switch and the plus-button list for question 16 are not built yet: until then
-- 16 is one long answer, one recommendation a line.
insert into ve_surveys (slug, guide_slug, title, intro, admits) values
 ('vegan-restaurant-guide', 'vegan-restaurant-guide', 'The restaurant survey',
  'Tell us about your restaurant. It takes about ten minutes, it is free, and it earns 100 points. Your answers make your page, and the whole Directory, better for the people who use it. Finishing it opens the Vegan Restaurant Guide and your Vegans Explore membership. Either way in before midnight Eastern on January 1, 2027 makes you a Founding Member.', true)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro;
update ve_guides set door = true, survey_slug = 'vegan-restaurant-guide' where slug = 'vegan-restaurant-guide';

delete from ve_survey_questions where survey_slug = 'vegan-restaurant-guide';
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
 ('vegan-restaurant-guide','r_role',1,'choice','Are you the founder, an owner, or part of the team?',null,
  '[{"v":"founder","label":"I am the founder"},{"v":"owner","label":"I am an owner"},{"v":"team","label":"I am part of the team"},{"v":"other","label":"Something else"}]',10,true),
 ('vegan-restaurant-guide','r_why',2,'long','Why did you open it? Why are you running a Vegan business?','In your own words. People love to know.',null,10,true),
 ('vegan-restaurant-guide','r_start',3,'long','How did it start?',null,null,4,false),
 ('vegan-restaurant-guide','r_proud',4,'long','What are you proudest of? Brag a little.',null,null,5,false),
 ('vegan-restaurant-guide','r_try',5,'text','What is the one dish, or thing, you want people to try first?',null,null,4,false),
 ('vegan-restaurant-guide','r_fun',6,'text','A fun fact about your place that people would not guess.',null,null,4,false),
 ('vegan-restaurant-guide','r_vegan',7,'choice','How Vegan is your menu?',null,
  '[{"v":"fully_vegan","label":"100% Vegan"},{"v":"vegan_options","label":"Vegan options"},{"v":"vegan_friendly","label":"Vegan friendly"}]',10,true),
 ('vegan-restaurant-guide','r_open',8,'choice','How long have you been open?',null,
  '[{"v":"new","label":"Not yet, or under a year"},{"v":"1-3","label":"1 to 3 years"},{"v":"4-9","label":"4 to 9 years"},{"v":"10+","label":"10 years or more"}]',4,false),
 ('vegan-restaurant-guide','r_who',9,'multi','Who comes in?','Pick all that fit.',
  '[{"v":"locals","label":"Locals"},{"v":"regulars","label":"Regulars"},{"v":"tourists","label":"Tourists"},{"v":"families","label":"Families"},{"v":"vegans","label":"Vegans"},{"v":"prevegans","label":"Pre-Vegans"}]',4,false),
 ('vegan-restaurant-guide','r_found',10,'multi','Where do most new customers find you today?','Pick all that fit.',
  '[{"v":"google","label":"Google"},{"v":"instagram","label":"Instagram"},{"v":"word","label":"Word of mouth"},{"v":"apps","label":"Delivery apps"},{"v":"directories","label":"Vegan directories and apps"},{"v":"events","label":"Events and markets"},{"v":"other","label":"Somewhere else"}]',4,false),
 ('vegan-restaurant-guide','r_site',11,'choice','Are you happy with your website?',null,
  '[{"v":"yes","label":"Yes"},{"v":"ok","label":"It is OK"},{"v":"no","label":"No"},{"v":"none","label":"I do not have one"}]',4,false),
 ('vegan-restaurant-guide','r_support',12,'long','What do you wish you had more support with as a business owner in the Vegan space?',null,null,10,true),
 ('vegan-restaurant-guide','r_help',13,'multi','What would help most right now?','Pick all that fit.',
  '[{"v":"customers","label":"More customers"},{"v":"page","label":"A better page"},{"v":"photos","label":"Photos"},{"v":"events","label":"Events"},{"v":"social","label":"Social media"},{"v":"website","label":"A website"},{"v":"ordering","label":"Ordering"},{"v":"done","label":"Someone to do it for me"}]',4,false),
 ('vegan-restaurant-guide','r_pos',14,'text','Which point of sale or ordering system do you use, and what do you think of it?','For example Square, Toast or Clover, then a line on how it works for you.',null,4,false),
 ('vegan-restaurant-guide','r_events',15,'choice','Do you host events or nights, and would you like to see more events in your community?',null,
  '[{"v":"host_more","label":"I host, and I would like more events in my community"},{"v":"host","label":"I host"},{"v":"want","label":"I do not host yet, but I would like to"},{"v":"no","label":"Not for us"}]',10,true),
 ('vegan-restaurant-guide','r_recommend',16,'long','Do you recommend any other businesses or nonprofit organizations we should work with in your area?','Up to five, one on each line: the name, and a website or Instagram if you have it.',null,5,false),
 ('vegan-restaurant-guide','r_wish',17,'long','One thing you wish people knew about your place.',null,null,4,false);
