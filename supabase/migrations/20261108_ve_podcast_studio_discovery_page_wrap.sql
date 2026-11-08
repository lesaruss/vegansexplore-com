-- ve-podcast-studio: wrap-up records for the episode discovery page session (2026-11-08).
insert into playbook_records (slug, brand_slug, author, kind, source, body) values
('ve-podcast-studio', 'vegans-explore', 'Logan', 'decision', 'text',
 've-podcast-studio: Episode 145 published 7:00 AM Eastern Nov 8 (episode-final-v4, checked on Captivate); the episode page rebuilt as a discovery engine (approved by Sean after four mock rounds). Built on branch claude/gracious-fermi-i4r1g1 (4432c20), not on main: rich() in public/ve-episodes.js draws episodes with ve_episode_notes (sections with their Guide, stories with Directory cards, chapter cards and a See more line, In this episode, places, Keep listening with Save). Data live: ve_episode_notes and ve_episode_notes_get, ve_place_mentions (Denver, New Zealand, Netherlands), Rich Roll People profile, vegconomist, two held listings (ve-held-place). Ideas approved and queued: chapter rankings (new playbook), podcast subscriptions (podcast-network-transcript-upload), Guide profiles. Next: Sean merges the branch; Captivate episode numbers for 144 and 145 on his go; HQ claude/vibrant-franklin-mibljs merge (new Kai tag); the studio writes notes for Episode 146. Handoff docs/handoff/2026-11-08-ve-podcast-studio-episode-discovery-page.md');

update ve_playbook_index set
  stage = 'Episode 145 published Nov 8 7 AM Eastern. Episode discovery page built on branch claude/gracious-fermi-i4r1g1 (4432c20), waiting on Sean''s merge; Episode 145 notes loaded; Rich Roll and vegconomist in the Directory.',
  next_action = 'Sean: merge claude/gracious-fermi-i4r1g1 (episode page) and HQ claude/vibrant-franklin-mibljs (Kai Founding tag); say go on Captivate episode numbers 144 and 145. Logan: check Ep 145 live, then make the studio write ve_episode_notes for Episode 146 (Sun Nov 15).',
  owner = 'Sean', status = 'building', updated_at = now()
where slug = 've-podcast-studio';

insert into brief_checkpoints (brand_slug, station, account, status, session_label, summary, next_step, handoff_url, files_touched, open_items) values
('vegans-explore', 'cloud', 'logan', 'handed_off', 've-podcast-studio: episode discovery page',
 've-podcast-studio: Ep 145 published and checked on Captivate; episode discovery page built on branch claude/gracious-fermi-i4r1g1 (4432c20), notes, place log and Directory entries live.',
 'Sean merges the branch; Logan checks Ep 145 live and has the studio write notes for Ep 146.',
 'docs/handoff/2026-11-08-ve-podcast-studio-episode-discovery-page.md',
 '["public/ve-episodes.js","supabase/migrations/20261108_episode_notes.sql","CLAUDE.md","docs/handoff/2026-11-08-ve-podcast-studio-episode-discovery-page.md"]'::jsonb,
 '["merge claude/gracious-fermi-i4r1g1","Captivate episode numbers 144 and 145","merge HQ claude/vibrant-franklin-mibljs","studio writes ve_episode_notes","chapter rankings playbook","podcast subscriptions","Guide profiles","confirm Dani and Maya role lines"]'::jsonb);

insert into stream_events (owner, station, summary, keywords, status) values
('Logan', 'vegans-explore', 've-podcast-studio: Ep 145 published; episode discovery page built on a branch, waiting on merge',
 array['ve-podcast-studio','episode-page','directory','chapter-rankings'], 'completed');

insert into knowledge_records (slug, title, category, body, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary)
values ('canon-ve-episode-discovery-page', 'Episode pages are a discovery engine', 'decisions',
 jsonb_build_object(
  'rule', 'Every podcast episode page shows each person, organization, outlet and place it names as the existing Directory card, chapter card or episode row (never new tiles), grouped by segment under its Guide, with In this episode, Places and Keep listening (with Save). Mentions not in the Directory are held (quarantined, tag ve-held-place) and places that are not chapters are logged to ve_place_mentions for the chapter rankings, never posted as listings.',
  'source', 'Sean, 2026-11-08: "anybody mentioned, any organizations... any city that''s brought up here, we put them in a holding pattern... a discovery engine for other things"; mocked four rounds and approved',
  'built', 'public/ve-episodes.js rich(); ve_episode_notes; migration 20261108_episode_notes.sql; branch claude/gracious-fermi-i4r1g1 until merged',
  'also_approved', jsonb_build_array('chapter rankings: places that are not chapters score from news, Pulse, podcast, requests and visitor/listener locations', 'podcast subscriptions: one tile per show in My Saves, N new, opt-in email at most one a day')),
 'active', 'sar', false, 50, array['vegans-explore','podcast','directory','chapter-rankings'], 1, 'Logan', 'Logan', 'Created 2026-11-08')
on conflict (slug) do nothing;
