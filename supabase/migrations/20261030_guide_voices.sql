-- The Guides' voices (Sean, 2026-10-30: picked in the ElevenLabs Voice Library after the designed samples were "horrible").
-- Liz and Maya already had theirs; these four were empty. Applied through the connector the same day.
update public.character_agents set elevenlabs_voice_id = v.id, updated_at = now()
from (values ('dani', 'b5RPB35vTODb3BEmR3Fc'), ('nori', 'rr9oBze1kuNJYeAV7xos'), ('river', 'btaSeNTVh1pGx4pjFzub'), ('theo', 'aFyw0oiXW7dzKF4o7woX')) v(slug, id)
where character_agents.slug = v.slug and character_agents.elevenlabs_voice_id is null;
