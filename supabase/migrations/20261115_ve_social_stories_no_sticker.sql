-- Stories never depend on a link sticker (Sean, 2026-11-15: "I don't want to post anything because then it'll never get done"; then "go").
-- Metricool posts every story itself and cannot add stickers, and Instagram allows none after a story is up, so the sticker to-dos are cleared
-- and the rule joins canon-ve-design-team. The ThanksLiving story (Sun Nov 22) says "Holiday Guide · link in bio" (story-v3.jpg). Safe to run twice.
update ve_social_slots set assets = '[{"h":1920,"w":1080,"type":"image","url":"https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/holiday-story/story-v3.jpg"}]'::jsonb, updated_at = now()
 where id = 'db063bda-c612-4131-8195-f51c77127a3b';
update ve_social_slots set manual_steps = null, updated_at = now()
 where brand_slug = 'vegans-explore' and kind = 'story' and status = 'scheduled' and manual_steps::text ilike '%link sticker%';
update knowledge_records set body = jsonb_set(body, '{standing_rules}', to_jsonb((body->>'standing_rules') || ' Stories never depend on a link sticker: everything we schedule posts itself through Metricool, which cannot add stickers, and Instagram does not allow adding one after a story is up, so a story points to the link in bio and never says "tap the link" (Sean, 2026-11-15: "I don''t want to post anything because then it''ll never get done"; then "go"). Hiring a social media person is for conversation (comments, DMs, featured businesses, collabs), not posting.')), updated_at = now()
 where slug = 'canon-ve-design-team' and body->>'standing_rules' not like '%never depend on a link sticker%';
