-- ve-holiday-guide / ve-feedback: never the word Friendsgiving in our own Pulse copy (Sean, 2026-11-08).
-- Applied live through the connector 2026-11-08.
-- 1. Today's South Florida Pulse (ve_board_posts fc4d32fe-f425-4bf9-828a-2e5668f96cfc) reworded:
--    title "A Vegan holiday pop up, and a Miyoko's butter recall", body, question, first_reply,
--    briefing.action {title "Find your holiday table", text names the organizer's event "Rooted In Culture"},
--    and its first reply (ve_board_replies 8dbddcdc-b6aa-4e88-be50-14c040723c62).
-- 2. The Pulse writer's instructions gain the rule:
update lesaruss_dispatch_sources set instructions = instructions || E'\n\nWORDS WE NEVER USE (Sean, 2026-11-08): never write the word Friendsgiving in our own headline, intro, question, take, action or first reply. Say a holiday meal, a holiday pop up, a holiday potluck or ThanksLiving. An event may be named by its organizer''s own title only when quoted as that event''s name, never as our heading.', updated_at=now()
where key='pulse_topic_write' and instructions not ilike '%never write the word Friendsgiving%';
