# ve-podcast-studio: Episode 145 final, ready to schedule (Nov 6 to 7, 2026, Eastern)

Playbook `ve-podcast-studio`. Episode 145 (`ve_pod_episodes` 7d59c856-f226-4055-b5f0-50e43b0ea856), "Ballots, Marathons and Jane
Velez-Mitchell Unchained", airs **Sunday Nov 8, 7:00 AM Eastern** (`publish_at` 2026-11-08 12:00 UTC).

## Where it stands
- **Final file**: `media/podcast/vep-weekly/2026-11-08/episode-final-v2.mp3` (13 min 9 s, 44.1 kHz stereo 192 kbps, -16.2 LUFS, peaks
  -1.4 dB), set as `final_path`. v1 had the Nonprofit Guide spot; Sean took it out ("a front door... we want to do the outreach first").
- **Run sheet**: 17 segments, all `approved` and `locked` as heard (Sean: "I don't want to regress"). Locked refuses voicing, drafting and edits.
- **Show notes**: saved (Sean OK'd; 120 listings, source links).
- **Not done**: Sean presses **Approve and schedule on Captivate**, then confirm with `GET /shows/5f0184ac-771d-41be-9db2-49f08fc0b880/episodes/scheduled`
  that it reads 2026-11-08 07:00 (show-local wall time). If it refuses status Scheduled, find the value; a retry reuses the upload.
  Sean was doing one last listen of v2 first.

## Run order (v2)
Opening sound (9 s, faded) · Sean intro v3 (no music) · Kai Coming up today v3 (news-v2) · Dairy Guide spot v4 · Kai D.C./Denver foie gras
(story-policy) · Kai Plates London (story-dining) · Liz Directory v3 (directory-v2) · Airport Guide spot v4 (no price) · Jane VEP 43 clip
(interview-v2) · Dani Rich Roll (story-triumph) · Dani Vegan Impact Awards (story-awards) · Nori Burger King UK v3 (story-playful) · Nori De Nieuwe
Melkboer (story-pastoral) · Maya Our Guides (guides-v2) · Sean outro v4 + Kai's tag with the closing sound low under them, then a 14 s swell.

## Sean's rules from this session (now in HQ `lib/podcastStudio.ts` and the podcast route)
- **One story per segment, each with its own music** (each story is its own social clip). Propose news makes them; beds handed out in turn from
  six 100-second story beds (`STORY_BEDS`), all leveled to -20 LUFS. A Guide's second story does not greet or hand off to themselves.
- **Stories 60 to 90 seconds** with background (explain terms like foie gras, why a Michelin star matters); the writer reads the article itself.
- **Music under every segment but commercials**; picker, "Hear the music" and "Play with music" on the page. Beds never loop (old 30 to 50 s beds
  dropped out and came back).
- **Pronunciation, picked from samples**: foie gras spelled normally; Velez-Mitchell as "Vellez Mitchell"; Vegan and Vegans as "Veegan(s)"
  (a hand-made spot must respell "Vegans Explore" too); our address as "Vegans Explore dot com"; dates as ordinals ("November twenty-second").
  Takes vary, so every recording is played back before it airs; make short samples before re-recording a whole segment.
- **No prices** in commercials or Guide scripts: let listeners see the value first.
- **Nonprofit Guide spot parked** until the nonprofit outreach is ready.

## How-tos learned
- ElevenLabs puts a short pop in the first ~0.15 s of some takes: trim to just before the first word (stt timing) with a 40 ms fade-in.
- Article text for scripts: `net.http_get` from the database, then pull `<p>` text (Plant Based News bodies come after "Minutes Read").
- Assembly tools (sandbox, not saved): tighten pauses, spot mix with sidechain ducking, two-pass loudnorm, per-segment bed from where its music
  starts. Rebuild the same way next week; the run sheet's `audio_path` and `bed_path` are the source of truth.
- The Supabase connector held writes twice (an approval prompt that never answered); one-time functions (`ve-once-pod145`, `ve-once-pod-upload`,
  `ve-once-qa-pod`) did them and are back to 410 stubs.

## Open for next week
- Directory adds from Ep 145 news: De Nieuwe Melkboer, Vegan Society of Aotearoa New Zealand, Vegconomist, Pro-Animal Future (Rich Roll's own profile is quarantined).
- UnchainedTV's listing says 501(c)(3); not confirmed from a primary source.
- React error 418 on the BrandDesk podcast page (still there; nothing visibly broken).
- Follow-ups: Vegan Impact Awards feature (nominees and next winners); watch the Farm Animal Welfare Awards.
- Music under Sean's intro: he did not ask for it; 144 had none.

## Commits
- HQ main: e2dd73f (music under segments, longer stories), d13d106 (pronunciation, leveled beds), 9af9ab0 (one story per segment), 5ff0596 (dates, no prices).
