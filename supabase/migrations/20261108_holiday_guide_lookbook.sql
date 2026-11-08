-- ve-holiday-guide: the Overview video's lookbook in Depot > Guides and tours (canon-ve-guide-tour-standard v3/v4).
-- Sean, 2026-11-08: "my intention is for that section to be an actual video... we need a lookbook... let's start locking in this video."
-- Chapters are Theo's eight recorded lines (theo-tour-<n>-v1.mp3, stt-checked 2026-11-08). Frame windows are cut at the pauses in each
-- recording (ffmpeg silencedetect), so they are by sentence and approximate; take stt word timings before the lip-sync cuts.
-- Captures: 1920 x 1080 of the Guide on 2026-11-08, in vegan-media/media/tours/holiday-guide/.
do $$
declare t uuid; b text := 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/holiday-guide/';
  v text := 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/voices/holiday-guide/theo-tour-';
  s text := 'https://vegansexplore.com/public/guides/holiday/';
begin
  insert into ve_video_tours (slug, title, kind, page_url, narrator, voice_id, script_doc, status)
  values ('holiday-guide', 'The Holiday Guide', 'guide', '/guides/holiday-guide', 'theo', 'aFyw0oiXW7dzKF4o7woX',
          'docs/proposals/holiday-guide-tour-script.md', 'lookbook')
  on conflict (slug) do update set status = 'lookbook', updated_at = now()
  returning id into t;
  delete from ve_video_shots where tour_id = t and status = 'proposed';
  insert into ve_video_chapters (tour_id, n, title, line, audio_url, audio_ver, stt_ok, seconds) values
  (t,1,'Welcome, I''m Theo','Welcome to the Holiday Guide. I''m Theo. You''re the one setting the table this year, and I''m here to help you do it your way.',v||'1-v1.mp3',1,true,6.69),
  (t,2,'Why this Guide','Vegans Explore has been bringing the Vegan community together since 2016, city by city. We know the places cooking near you and the groups doing good. This Guide puts all of it in one spot for the holidays, free.',v||'2-v1.mp3',1,true,14.21),
  (t,3,'ThanksLiving','ThanksLiving is Thanksgiving with a fully plant-based table. Same family, same gratitude, nobody harmed. On this page you''ll find a few easy ideas to make it yours, whether you host or bring one dish.',v||'3-v1.mp3',1,true,12.56),
  (t,4,'Holiday menus near you','Don''t want to cook it all? Pick your chapter and see which Vegan places are cooking for the holiday, what they''re offering, and when to order by. Our team checks every menu before it shows. Save one to find it again. Know a place we missed? Tell us, and we''ll check it.',v||'4-v1.mp3',1,true,15.54),
  (t,5,'Events','Rather be at someone else''s table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar. Hosting one? Add it, so people can find you.',v||'5-v1.mp3',1,true,8.80),
  (t,6,'Give back','Giving is part of the season. Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.',v||'6-v1.mp3',1,true,9.38),
  (t,7,'For businesses','Run a Vegan business? Send us your holiday menu and we''ll feature it here, free for members. ThanksLiving menus close at the end of November eighteenth.',v||'7-v1.mp3',1,true,9.43),
  (t,8,'A living Guide, share it','This Guide keeps growing. Each holiday opens here as it gets close, so be on the lookout for the next one. Come back often, and share it with whoever''s at your table this year. Happy holidays.',v||'8-v1.mp3',1,true,10.89)
  on conflict (tour_id, n) do update set title = excluded.title, line = excluded.line, audio_url = excluded.audio_url, stt_ok = true, seconds = excluded.seconds;
  insert into ve_video_shots (tour_id, chapter_n, ord, kind, brief, image_url, audio_from, audio_to, line, readiness, flag) values
  (t,1,1,'on_camera','Theo on camera in his ThanksLiving apron with the roast: "Welcome to the Holiday Guide. I''m Theo." About 2.6 s, held to 3 s with his mouth closed.',s||'theo-thanksliving.jpg',0,2.6,'Welcome to the Holiday Guide. I''m Theo.','ready',null),
  (t,1,2,'screen','The Holiday Guide''s Overview, the video section at the top.',b||'ch01-overview.jpg',2.6,6.69,'You''re the one setting the table this year, and I''m here to help you do it your way.','ready',null),
  (t,2,1,'illustration','Idea: our chapters'' city art one after another, South Florida to London, as he says city by city.',null,0,5.9,'Vegans Explore has been bringing the Vegan community together since 2016, city by city.','broll',null),
  (t,2,2,'screen','The Directory, Local Food: the places near you, with their votes.',b||'ch02-directory.jpg',5.9,9.4,'We know the places cooking near you and the groups doing good.','ready',null),
  (t,2,3,'screen','The Guide''s Start here and its sections, the one spot for the holidays.',b||'ch02-start.jpg',9.4,14.21,'This Guide puts all of it in one spot for the holidays, free.','ready',null),
  (t,3,1,'screen','The ThanksLiving tab.',b||'ch03-thanksliving.jpg',0,3.5,'ThanksLiving is Thanksgiving with a fully plant-based table.','ready',null),
  (t,3,2,'illustration','A full plant-based table, the ThanksLiving picture from the Guide.',s||'p-thanks.jpg',3.5,7.1,'Same family, same gratitude, nobody harmed.','broll',null),
  (t,3,3,'screen','The five easy ideas on the ThanksLiving tab, each lit as the camera moves across.',b||'ch03-thanksliving.jpg',7.1,12.56,'On this page you''ll find a few easy ideas to make it yours, whether you host or bring one dish.','ready',null),
  (t,4,1,'on_camera','Theo on camera, the waving portrait: "Don''t want to cook it all?" About 1.4 s, held to 3 s with his mouth closed.','https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20261005_024302_f6297bbc-32d0-4a4c-8adc-2821b8253f7a_min.webp',0,1.42,'Don''t want to cook it all?','ready',null),
  (t,4,2,'screen','Holiday menus: the chapter picker, search and Filters.',b||'ch04-menus.jpg',1.42,7.7,'Pick your chapter and see which Vegan places are cooking for the holiday, what they''re offering, and when to order by.','recapture','No menus are live yet, so the list is empty. Recapture once the first menus are approved (after the Nov 10 emails).'),
  (t,4,3,'illustration','A holiday menu card with its Save, from the Guide''s menus picture until a real card can be shown.',s||'p-menus.jpg',7.7,12.3,'Our team checks every menu before it shows. Save one to find it again.','broll','Swap for a real approved menu card and its Save button once one is live.'),
  (t,4,4,'screen','Tell us about a menu: send a place and its link.',b||'ch04-tell.jpg',12.3,15.54,'Know a place we missed? Tell us, and we''ll check it.','ready',null),
  (t,5,1,'screen','The Events tab: sanctuary dinners, potlucks and Thanksgiving events.',b||'ch05-events.jpg',0,6.7,'Rather be at someone else''s table? Find sanctuary dinners, potlucks and Thanksgiving events on our calendar.','ready',null),
  (t,5,2,'screen','Submit an event on our calendar, step 1.',b||'ch05-add.jpg',6.7,8.8,'Hosting one? Add it, so people can find you.','ready',null),
  (t,6,1,'illustration','Giving, the Guide''s Give back picture.',s||'p-giveback.jpg',0,1.7,'Giving is part of the season.','broll',null),
  (t,6,2,'screen','The Give back tab: Nonprofit Partners first, then the Directory''s nonprofits, rescues and sanctuaries.',b||'ch06-giveback.jpg',1.7,9.38,'Here are the nonprofits, rescues and sanctuaries doing the work, in your city and beyond. Giving Tuesday is December first.','ready','Donation links to each organization''s own page are not built yet (due by Dec 1); the shot shows the Directory cards.'),
  (t,7,1,'screen','For businesses: the three steps and every holiday''s close date.',b||'ch07-business.jpg',0,5.4,'Run a Vegan business? Send us your holiday menu and we''ll feature it here, free for members.','ready',null),
  (t,7,2,'screen','The holiday menu form with its countdown.',b||'ch07-form.jpg',5.4,9.43,'ThanksLiving menus close at the end of November eighteenth.','ready',null),
  (t,8,1,'screen','The Overview, the Guide as it grows.',b||'ch01-overview.jpg',0,5.8,'This Guide keeps growing. Each holiday opens here as it gets close, so be on the lookout for the next one.','ready','Hanukkah, Christmas and Kwanzaa are not built yet; said as a plan, the shot shows ThanksLiving only.'),
  (t,8,2,'screen','The Share button in the top bar, lit.',b||'ch08-share.jpg',5.8,7.6,'Come back often, and share it','ready',null),
  (t,8,3,'on_camera','Theo on camera in his apron: "...with whoever''s at your table this year. Happy holidays." About 3 s, ending on a closed-mouth smile.',s||'theo-thanksliving.jpg',7.6,10.57,'with whoever''s at your table this year. Happy holidays.','ready','The cut point is by sentence; take stt word timings before the lip-sync cut.');
end $$;
