-- Record of the database writes made 2026-11-15 for the week of Nov 16 that were run through one-time functions (ve-once-social-week, now the
-- 410 stub) or ve-social itself rather than an earlier migration file. Kept so the repo holds every change; each statement is safe to run twice
-- and only reasserts the state that was confirmed live. Metricool post ids change on every re-push and are not reasserted here.
--
-- 1. Approvals: Sean approved the week ("approved them all in Depot"; the Depot click did not land then, since fixed in HQ e106855). ve-social
--    approve was called as Sean (as_member) for the 19 slots of batches week-2026-11-16 and founding-series; all became scheduled in Metricool.
-- 2. The fuller mix (20261115_social_week_mix.sql) loaded 16 proposed slots; a Saturday post was added for grid spacing:
insert into ve_social_slots (brand_slug,slot_at,channels,kind,title,caption,links,assets,status,manual_steps,batch,proposed_by)
select 'vegans-explore','2026-11-21 09:00 America/New_York'::timestamptz,array['instagram','facebook'],'post','ThanksLiving is Thursday (post)',
 E'ThanksLiving is Thursday, November 26. Recipes for the whole table, holiday menus from Vegan kitchens to order, and Vegan events near you: it''s all in the free Holiday Guide.\n\nLink in bio.\n\n#ThanksLiving #VeganThanksgiving #VegansExplore',
 array['https://vegansexplore.com/go/bio-nov16','https://vegansexplore.com/go/pin-holiday-fb'],
 '[{"url":"https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/thanksliving/slide-01.jpg","type":"image","w":1080,"h":1350}]'::jsonb,
 'proposed','Facebook: add vegansexplore.com/go/pin-holiday-fb to the Facebook copy.','week-2026-11-16-mix','logan'
where not exists (select 1 from ve_social_slots where batch='week-2026-11-16-mix' and title='ThanksLiving is Thursday (post)');
-- 3. Grid spacing (Sean: never two cityscapes back to back): times moved through ve-social slot_save.
update ve_social_slots s set slot_at = (v.at||' America/New_York')::timestamptz from (values
 ('Ep 146: the Vegans Explore Podcast','2026-11-16 15:00'),('Ep 146: story','2026-11-16 15:15'),
 ('Vegan Seattle is open','2026-11-16 18:00'),('Vegan Seattle is open: story','2026-11-16 18:15'),
 ('The Vegan Restaurant Guide','2026-11-17 15:00'),('The Vegan Restaurant Guide: story','2026-11-17 15:15'),
 ('Vegan Portland is open','2026-11-17 18:00'),('Vegan Portland is open: story','2026-11-17 18:15'),
 ('The Vegan Events Guide','2026-11-18 18:00'),('The Vegan Events Guide: story','2026-11-18 18:15'),
 ('SoFlo Vegans 112: the Holiday Guide','2026-11-19 13:00'),('SoFlo Vegans 112: Holiday Guide story','2026-11-19 13:15'),
 ('Vegan Austin is open','2026-11-19 18:00'),('Vegan Austin is open: story','2026-11-19 18:15')) v(title,at)
where s.brand_slug='vegans-explore' and s.title=v.title and s.slot_at >= '2026-11-16 05:00+00' and s.slot_at < '2026-11-23 05:00+00' and s.status<>'skipped';
-- 4. The design team's once-over: the six city captions now say "Tap the link in bio" and carry the Founding Member line; the Philadelphia caption
--    says joining stays free; the city stories' By hand step relabels the sticker Join free. Pictures were replaced in storage under the same names.
update ve_social_slots set caption = replace(caption, 'Join free by January 1 to be a Founding Member.', 'Joining is free. Join before January 1 to be a Founding Member.')
 where title='5 Vegan spots in Philadelphia' and caption like '%Join free by January 1 to be a Founding Member.%';
-- (City captions were rewritten in full through ve-social slot_save; see docs/history/social.md, 2026-11-15, for the text pattern.)
-- 5. Canon and playbook rows written this day: knowledge_records canon-ve-design-team (v1); playbook_records ve-social-schedule decision rows;
--    playbook_records signal-context-efficiency (the Theo and Maya complexion request that had been lost between chats).
