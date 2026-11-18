-- The Paris launch post and story on the social schedule (Sean, 2026-11-18: "approve the Paris post and story"). Copied from the Boston
-- pair (4e576d5a post, 6dd97efd story, batch week-2026-11-16). Sunday Nov 22, 2026: post 11:00 AM Eastern (5 PM in Paris), story 11:15 AM
-- Eastern, the story tied to the post. Instagram and Facebook, no collaborators. Pictures copied to vegan-media/media/social/week-2026-11-16/paris/.
-- Inserted as proposed, then approved through ve-social `approve` (as Sean, the way BrandDesk approves), which records Sean as approver
-- and pushes each slot to Metricool. Safe to run twice.
insert into ve_social_slots (brand_slug, slot_at, channels, kind, title, caption, links, assets, status, batch, proposed_by, collaborators)
select 'vegans-explore', '2026-11-22T11:00:00-05:00', array['instagram','facebook'], 'post', 'Vegan Paris is open',
  E'Vegan Paris is open. Dozens of places to eat Vegan across Paris and its inner suburbs, now in one place, including every Land & Monkeys bakery. Save your favorites, vote for the ones you love, and help build the community. Tap the link in bio (vegansexplore.com/go/paris-open).\n\nJoining is free. Join before midnight Eastern on January 1 and Founding Member stays on your profile for good.\n\nWant to lead Vegans Explore in Paris? We''re looking for a community manager. Reach out.\n\n#VeganParis #ParisVegan #VegansExplore',
  array['https://vegansexplore.com/go/paris-open'],
  '[{"h":1350,"w":1080,"url":"https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/paris/post.jpg","type":"image"}]'::jsonb,
  'proposed', 'week-2026-11-16', 'logan', '{}'
where not exists (select 1 from ve_social_slots where batch = 'week-2026-11-16' and title = 'Vegan Paris is open');
insert into ve_social_slots (brand_slug, slot_at, channels, kind, title, caption, links, assets, status, batch, proposed_by, collaborators, story_of)
select 'vegans-explore', '2026-11-22T11:15:00-05:00', array['instagram','facebook'], 'story', 'Vegan Paris is open: story', '',
  array['https://vegansexplore.com/go/paris-open'],
  '[{"h":1920,"w":1080,"url":"https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/paris/story.jpg","type":"image"}]'::jsonb,
  'proposed', 'week-2026-11-16', 'logan', '{}', (select id from ve_social_slots where batch = 'week-2026-11-16' and title = 'Vegan Paris is open')
where not exists (select 1 from ve_social_slots where batch = 'week-2026-11-16' and title = 'Vegan Paris is open: story');
