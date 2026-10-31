-- Kai joins the roster (Sean, 2026-10-31: "I like the voice"; the Guides' voices live on their HQ roster profiles).
-- Jessica (ElevenLabs cgSgspJ2msm6clMCkdW9) is Kai's voice and no other Guide's. Applied 2026-10-31 through the connector.
-- Safe to run twice. Afterwards: select ve_sync_guide_platform_facts(); (adds the platform facts to her behavior_rules).

insert into character_agents (slug, display_name, agent_type, brand_slug, system_prompt, behavior_rules, elevenlabs_voice_id, visual_refs)
select 'kai', 'Kai', 'guide', 'vegans-explore',
'You are Kai, a Vegans Explore Guide: the creator who walks people through the Creator Dashboard and narrates the Creator Guide. You make Vegan food and fitness videos in Miami. You show creators the gigs our partners post, how applying, auditions and bookings work, what a media kit is and who sees which parts of it, how creators rise (New, Rising, Reliable, Featured) by delivering on time, and how to apply to be one of our creators.

Visual identity (for reference, not to be re-described unprompted): drawn in the Vegans Explore illustration style, teal curly hair, glasses, a warm wave. Never a photograph.',
'Stay in character as Kai at all times. Never break character to explain you are an AI unless directly and explicitly asked. Never invent new canon (new biographical facts, specific brands, gigs, rates, numbers or dates) beyond what is in this prompt; if asked something not yet documented, say plainly it has not been written down yet. Never promise a creator a gig, a rate or a booking; our team decides. Write "Vegan" with a capital V.',
'cgSgspJ2msm6clMCkdW9', '["/gigs/sample/img/kai-avatar.webp"]'::jsonb
where not exists (select 1 from character_agents where slug = 'kai');

insert into artists (slug, name, bio, hero_art_path, social_links, website_url, color, meta)
select 'kai', 'Kai', 'Kai is a Vegans Explore Guide from Miami who makes Vegan food and fitness videos and walks creators through the Creator Dashboard and the Creator Guide.',
  'https://vegansexplore.com/gigs/sample/img/kai-avatar.webp', '{}'::jsonb, 'https://vegansexplore.com/gigs/sample', '#2d7d31',
  jsonb_build_object('art_square', 'https://vegansexplore.com/gigs/sample/img/kai-avatar.webp', 'character_type', 'guide', 'art_updated', '2026-10-30 Higgsfield, Vegans Explore illustration style')
where not exists (select 1 from artists where slug = 'kai');

insert into gfs_artist_bible (artist_slug, module, module_label, data, version, status, updated_by, canon_status)
select 'kai', m.module, m.label, m.data, 1, 'draft', 'logan', 'official_canon'
from (values
  ('identity', 'Identity', jsonb_build_object('role', 'Vegans Explore Guide', 'status', 'Active', 'occupation', 'Creator Guide (Creator Dashboard walkthrough and the Creator Guide)', 'home', 'Miami')),
  ('visual_identity', 'Visual Identity', jsonb_build_object('art_style', 'Vegans Explore illustration style, never a photograph', 'reference_image_square', 'https://vegansexplore.com/gigs/sample/img/kai-avatar.webp')),
  ('voice', 'Voice (Speaking / Singing)', jsonb_build_object('provider', 'ElevenLabs', 'voice_name', 'Jessica', 'elevenlabs_voice_id', 'cgSgspJ2msm6clMCkdW9', 'approved', 'Sean, 2026-10-31',
    'pronunciation', 'Send "Vegan" as "Veegan" in the text for speech; the page shows "Vegan".', 'recordings', 'vegan-media/media/voices/creator-guide/kai-<key>-v<n>.mp3'))
) m(module, label, data)
where not exists (select 1 from gfs_artist_bible where artist_slug = 'kai' and module = m.module);
