-- Every Guide's ElevenLabs voice on its HQ roster profile (Sean, 2026-10-31: "include the information you have regarding their
-- voice IDs on 11 Labs. So that way there's never a question as to what we're using... especially if we have the voices mapped
-- on different pages"). The roster profile's Voice module (table gfs_artist_bible, module voice) is where a Guide's voice is kept;
-- character_agents.elevenlabs_voice_id copies it. HQ's voice-sample function reads the Voice module by elevenlabs_voice_id and
-- applies its pronunciations to every take, so "Vegan" is said right without anyone respelling a script.
-- Also: V's Guide record still held the voice Sean replaced on 2026-10-09, and River's roster profile and Guide record still
-- called him the Creator Guide with his look from before the 2026-10-28 refresh. Safe to run twice.

-- 1. The Voice module for the six Vegans Explore Guides that had none.
insert into gfs_artist_bible (artist_slug, module, module_label, data, version, status, updated_by, canon_status)
select v.slug, 'voice', 'Voice (Speaking / Singing)',
  jsonb_strip_nulls(jsonb_build_object(
    'status', 'approved', 'provider', 'ElevenLabs', 'elevenlabs_voice_id', v.id, 'voice_name', v.name,
    'model_id', 'eleven_multilingual_v2', 'approved_by', 'sean', 'approved_at', v.at, 'source', v.src,
    'pronunciations', jsonb_build_object('Vegan', 'Veegan', 'Vegans', 'Veegans'),
    'pronunciation_note', 'Vegan is sent to the voice as Veegan (the page shows Vegan); voice-sample applies it to every take.',
    'recordings', v.rec,
    'note', 'This Voice module is where this Guide''s voice is kept. character_agents.elevenlabs_voice_id copies it; change both together, never pick a new voice without Sean.')),
  1, 'draft', 'logan', 'official_canon'
from (values
  ('liz',   'IUMUPi350HfIhyzUBJB3', 'Liz (Vegans Explore)',  '2026-10-09', 'Voice Design from a brief: late twenties, warm, confident, the friendly explorer. Sean picked sample 3 of 3.', 'vegan-media/media/liz/'),
  ('maya',  'sM8RysETdBj1LIqLd9tl', 'Maya (Vegans Explore)', '2026-10-08', 'Voice Design from Sean''s brief: early twenties, Southern California, sweet but intelligent, mid-range pitch.', 'vegan-media/media/maya/'),
  ('dani',  'b5RPB35vTODb3BEmR3Fc', null, '2026-10-30', 'ElevenLabs Voice Library, picked by Sean (the designed samples were deleted).', 'vegan-media/media/voices/'),
  ('nori',  'rr9oBze1kuNJYeAV7xos', null, '2026-10-30', 'ElevenLabs Voice Library, picked by Sean (the designed samples were deleted).', 'vegan-media/media/voices/'),
  ('river', 'btaSeNTVh1pGx4pjFzub', null, '2026-10-30', 'ElevenLabs Voice Library, picked by Sean (the designed samples were deleted).', 'vegan-media/media/voices/'),
  ('theo',  'aFyw0oiXW7dzKF4o7woX', null, '2026-10-30', 'ElevenLabs Voice Library, picked by Sean (the designed samples were deleted).', 'vegan-media/media/voices/')
) v(slug, id, name, at, src, rec)
where not exists (select 1 from gfs_artist_bible b where b.artist_slug = v.slug and b.module = 'voice');

-- Kai's Voice module gets the same pronunciations and note (added earlier today without them).
update gfs_artist_bible
   set data = data || jsonb_build_object('status', 'approved', 'model_id', 'eleven_multilingual_v2', 'approved_by', 'sean', 'approved_at', '2026-10-31',
       'source', 'ElevenLabs premade voice Jessica.', 'pronunciations', jsonb_build_object('Vegan', 'Veegan', 'Vegans', 'Veegans'),
       'note', 'This Voice module is where this Guide''s voice is kept. character_agents.elevenlabs_voice_id copies it; change both together, never pick a new voice without Sean.'),
       updated_by = 'logan', updated_at = now()
 where artist_slug = 'kai' and module = 'voice' and not (data ? 'pronunciations');

-- 2. V: her Guide record follows her roster profile (Sean picked Nhs7eitvQWFTQBsf0yiT on 2026-10-09).
update character_agents
   set elevenlabs_voice_id = 'Nhs7eitvQWFTQBsf0yiT',
       voice_config = coalesce(voice_config, '{}'::jsonb) || jsonb_build_object('voice_id', 'Nhs7eitvQWFTQBsf0yiT', 'previous_voice_id', 'wfEelgHGTfFOp1gtSiR9',
         'synced_from_profile_at', '2026-10-31'),
       updated_at = now()
 where slug = 'v' and elevenlabs_voice_id is distinct from 'Nhs7eitvQWFTQBsf0yiT';

-- 3. River: the Stadium & Arena Guide, refreshed 2026-10-28 (still in his 20s, short twists with a fade; Sean picked it).
update artists
   set hero_art_path = 'https://vegansexplore.com/public/guides/art/river-square.webp',
       meta = meta || jsonb_build_object('art_square', 'https://vegansexplore.com/public/guides/art/river-square.webp',
         'art_tall', 'https://vegansexplore.com/public/guides/art/river-tall.webp',
         'art_updated', '2026-10-28 character refresh, short twists with a fade (Sean picked it)',
         'previous_art_square', meta->>'art_square', 'previous_art_tall', meta->>'art_tall')
 where slug = 'river' and hero_art_path is distinct from 'https://vegansexplore.com/public/guides/art/river-square.webp';

update gfs_artist_bible
   set data = data || jsonb_build_object('occupation', 'Stadium & Arena Guide',
         'occupation_note', 'Narrates the Stadium & Arena Guide (2026-10-28). Kai took the Creator Guide on 2026-10-30.'),
       updated_by = 'logan', updated_at = now()
 where artist_slug = 'river' and module = 'identity' and data->>'occupation' is distinct from 'Stadium & Arena Guide';

update gfs_artist_bible
   set data = data || jsonb_build_object(
         'art_style', 'Vegans Explore illustration style, clean outlines, flat fills',
         'description', 'Young man in his 20s, short black twists with a fade, warm brown skin, brown eyes, easy smile. Wears the Vegans Explore tee (cream or black).',
         'reference_image', 'https://vegansexplore.com/public/guides/art/river-tall.webp',
         'reference_image_square', 'https://vegansexplore.com/public/guides/art/river-square.webp',
         'reference_updated', '2026-10-28 character refresh (Sean picked short twists with a fade)',
         'previous_reference_image', data->>'reference_image', 'previous_reference_image_square', data->>'reference_image_square'),
       updated_by = 'logan', updated_at = now()
 where artist_slug = 'river' and module = 'visual_identity' and data->>'reference_updated' not like '2026-10-28%';

update character_agents
   set system_prompt = 'You are River, a Vegans Explore Guide: you narrate the Stadium & Arena Guide, helping fans find the Vegan food inside stadiums and arenas, stand by stand, on game day or concert night. You are from Atlanta: fast-thinking, sincere, and always three steps ahead of where the best plant-based experience lives. Kai walks creators through the Creator Guide now.

Visual identity (for reference, not to be re-described unprompted): young man in his 20s, short black twists with a fade, warm brown skin, easy smile, the Vegans Explore tee. Vegans Explore illustration style, clean outlines, flat fills.',
       visual_refs = '["/public/guides/art/river-square.webp", "/public/guides/art/river-tall.webp"]'::jsonb,
       updated_at = now()
 where slug = 'river' and system_prompt like '%the Creator Guide, Path 5%';

update character_agents
   set behavior_rules = replace(behavior_rules,
         'Your role in conversation is to guide members through the Creator path in your established voice, not to fabricate specific creative projects or recommendations that are not on file.',
         'Your role in conversation is to help members find Vegan food at stadiums and arenas in your established voice, not to fabricate specific stands, items or recommendations that are not on file.'),
       updated_at = now()
 where slug = 'river' and behavior_rules like '%guide members through the Creator path%';
