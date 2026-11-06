-- ve-pre-vegan-business-guide: the Pre-Vegan Business Guide (Sean approved the tabs, survey and Maya's lines 2026-11-06: "Approved, go with
-- your defaults and build it"; draft docs/proposals/pre-vegan-business-guide.md). A door Guide: free with its survey, Maya narrates.
--
-- published = true is needed for the Guide to open at all (ve-guide-unlock answers guide_not_found for an unpublished row). "Not launched"
-- means the page is noindex, out of the sitemap and out of the Guide catalog, as the Events Guide was before its launch.
-- The members-only content (what to add for every business type but the coffee shop) is ve_guides.content_html, written from the session,
-- never in this repo (the Restaurant Guide's rule).

insert into ve_guides (slug, title, description, cost_lesars, published, access_rule, door, survey_slug, sort_order)
values ('pre-vegan-business-guide', 'The Pre-Vegan Business Guide',
        'For businesses that are not Vegan and are adding Vegan: what to add, who to buy it from and how to say it honestly. Free with a short survey.',
        1100, true, 'points', true, 'pre-vegan-business-guide', 10)
on conflict (slug) do update set title = excluded.title, description = excluded.description, door = true,
  survey_slug = excluded.survey_slug, published = true;

insert into ve_surveys (slug, guide_slug, title, intro, admits) values
 ('pre-vegan-business-guide', 'pre-vegan-business-guide', 'The business survey',
  'Tell us about your business. It takes a few minutes, it is free, and it earns 100 points. Finishing it opens the Pre-Vegan Business Guide and your Vegans Explore membership. Either way in before midnight Eastern on January 1, 2027 makes you a Founding Member.', true)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro;

delete from ve_survey_questions where survey_slug = 'pre-vegan-business-guide';
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
 ('pre-vegan-business-guide','pb_kind',1,'choice','What kind of business is it?',null,
  '[{"v":"coffee","label":"Coffee shop"},{"v":"gym","label":"Gym or studio"},{"v":"juice","label":"Juice or smoothie bar"},{"v":"cafe","label":"Cafe or bakery"},{"v":"restaurant","label":"Restaurant"},{"v":"caterer","label":"Caterer or venue"},{"v":"other","label":"Something else"}]',12,true),
 ('pre-vegan-business-guide','pb_role',2,'choice','Are you the owner, a manager, or part of the team?',null,
  '[{"v":"owner","label":"I am the owner"},{"v":"manager","label":"I am a manager"},{"v":"team","label":"I am part of the team"},{"v":"other","label":"Something else"}]',12,true),
 ('pre-vegan-business-guide','pb_now',3,'choice','What Vegan do you serve today?',null,
  '[{"v":"none","label":"Nothing yet"},{"v":"one","label":"One or two items"},{"v":"few","label":"A few items"},{"v":"section","label":"A full Vegan section"}]',12,true),
 ('pre-vegan-business-guide','pb_add',4,'multi','What do you want to add?','Pick all that fit.',
  '[{"v":"milks","label":"Plant milks"},{"v":"food","label":"Food items"},{"v":"baked","label":"Baked goods"},{"v":"desserts","label":"Desserts"},{"v":"protein","label":"Protein (shakes, bars)"},{"v":"grab","label":"Grab-and-go"},{"v":"unsure","label":"Not sure yet"}]',12,true),
 ('pre-vegan-business-guide','pb_worry',5,'long','What is your biggest worry about adding Vegan?',null,null,12,true),
 ('pre-vegan-business-guide','pb_who',6,'multi','Who is asking for it?','Pick all that fit.',
  '[{"v":"regulars","label":"Regulars"},{"v":"new","label":"New customers"},{"v":"staff","label":"Staff"},{"v":"ahead","label":"Nobody yet, I want to get ahead"}]',5,false),
 ('pre-vegan-business-guide','pb_city',7,'text','What city are you in?',null,null,5,false),
 ('pre-vegan-business-guide','pb_size',8,'choice','How many locations do you have?',null,
  '[{"v":"1","label":"1"},{"v":"2-5","label":"2 to 5"},{"v":"6+","label":"6 or more"}]',5,false),
 ('pre-vegan-business-guide','pb_buy',9,'multi','Where do you buy food today?','Pick all that fit.',
  '[{"v":"distributor","label":"A distributor (Sysco, US Foods, Cheney Brothers...)"},{"v":"warehouse","label":"Restaurant Depot or a warehouse club"},{"v":"local","label":"Local suppliers"},{"v":"grocery","label":"Grocery stores"},{"v":"inhouse","label":"We make it in house"}]',5,false),
 ('pre-vegan-business-guide','pb_make',10,'choice','Would you rather buy it ready or make it?',null,
  '[{"v":"buy","label":"Buy it ready"},{"v":"make","label":"Make it"},{"v":"mix","label":"A mix"}]',5,false),
 ('pre-vegan-business-guide','pb_kitchen',11,'choice','Do you have a kitchen?',null,
  '[{"v":"full","label":"A full kitchen"},{"v":"small","label":"A small prep area"},{"v":"none","label":"No kitchen, ready-made only"}]',5,false),
 ('pre-vegan-business-guide','pb_when',12,'choice','When do you want it on the menu?',null,
  '[{"v":"month","label":"This month"},{"v":"3mo","label":"In 3 months"},{"v":"year","label":"This year"},{"v":"looking","label":"Just looking"}]',5,false),
 ('pre-vegan-business-guide','pb_help',13,'multi','What would help most?','Pick all that fit.',
  '[{"v":"suppliers","label":"Suppliers"},{"v":"recipes","label":"Recipes"},{"v":"words","label":"Menu words"},{"v":"found","label":"Getting found"},{"v":"staff","label":"Training staff"},{"v":"done","label":"Someone to do it for me"}]',5,false);
