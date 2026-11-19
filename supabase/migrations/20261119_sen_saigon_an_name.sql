-- 2026-11-19: Sen Saigon's owner is An, not Ann (Sean). Fixes the content index moments for Vegans Explore Podcast Ep 62. Safe to run twice.
-- The raw transcript keeps the speech-to-text spelling (editing it would re-queue the episode for tagging).
update ve_content_moments m set speaker = regexp_replace(speaker,'\mAnn\M','An','g'), summary = regexp_replace(summary,'\mAnn\M','An','g')
where content_id in (select distinct content_id from ve_content_moments_live where episode_number = 62 and podcast_show = 'Vegans Explore Podcast')
  and (speaker ~ '\mAnn\M' or summary ~ '\mAnn\M');
update playbook_records set body = replace(body, 'Ann of Sen Saigon', 'An of Sen Saigon (Sean: "It''s An, not Ann")')
where slug = 've-social-schedule' and body like 'Clip calls from Sean 2026-11-19%' and body like '%Ann of Sen Saigon%';
