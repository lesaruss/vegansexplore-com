# ve-podcast-studio: discovery page live, Captivate numbers, the studio builds episode pages (2026-11-08)

Playbook `ve-podcast-studio`. Follows `2026-11-08-ve-podcast-studio-episode-discovery-page.md`.

## Done (Sean's go on all three, 2026-11-08)
- **Discovery page merged** to vegansexplore-com `main` (91eb394) and checked live on Episode 145 at 1440 and 390 px: no script errors, no
  sideways scroll; signed out, Save, a Directory card's Vote and the D.C. chapter card's Vote and Save each open the members prompt. Play builds the
  docked player on `episodes.captivate.fm/episode/902d9d96...mp3`; that host is blocked from the build session, so playback was not heard here.
  Signed-in Save and Vote not clicked.
- **Captivate numbers**: Episode 144 (`73510abf`) and 145 (`902d9d96`) are episode 144 and 145, season 1, through a one-time function
  (`ve-once-captivate-number`, now the 410 stub; pg_net has no PUT). Each PUT resent the episode's own title, date, show notes, art and status;
  read back unchanged.
- **Kai's Founding Member tag**: HQ `claude/vibrant-franklin-mibljs` merged to HQ main (73232d6). New episodes start with `kai-founding-v1.mp3`.

## Built, waiting on Sean's merge (HQ branch `claude/charming-rubin-2qi0si`, 22b726c)
- `lib/episodeNotes.ts` (pure, 5 tests in `lib/__tests__/episodeNotes.test.ts`): sections from the run sheet (the "Coming up" trailer, sounds,
  commercials and the tag are not sections), stories per source, outlets, chapters, held places, held names, `placeMentions`, and `notesPrompt`.
- `/api/branddesk/podcast`: GET `v=notes&id=`; POST `notes_build` (draft; `preview: true` returns it unsaved; refuses `notes_live`), `notes_publish`
  (live; places not in a chapter to `ve_place_mentions` kind podcast, ref `vep:<guid>`; each proposed name made a quarantined listing, tag
  `ve-held-place`, `details.held`), `notes_unpublish`. `captivate_schedule` now sends `episode_number` and `episode_season` 1.
- PodcastRoom: an **Episode page** panel under Send to Captivate (Build the page, Publish, Take it down, Open the episode page, and a readable
  draft with held names, places and what was left off).
- Proven on Episode 145's run sheet through a one-time harness (`ve-once-notes-proof`, now 410) running the same prompt and assembly: 76 s, about
  9,000 output tokens; matched Sentient Media, Plates, VegNews, Rich Roll, UnchainedTV, De Nieuwe Melkboer, vegconomist; proposed only Pro-Animal
  Future and Kirk Haworth as new held names; places Denver, New Zealand, United Kingdom, Enschede, Brussels logged, D.C., Shoreditch (London) and New
  York as chapters. Not proven: the route itself signed in on HQ (needs the merge or a preview session).
- HQ test suite: `staffRoutes.test.ts` fails on HQ main already, unrelated.

## Next
1. Sean merges HQ `claude/charming-rubin-2qi0si`; then Episode 146 (Sun Nov 15): once it is on Captivate, Build the page, read it, Publish.
2. Recommendations to bring Sean: chapter-rankings playbook, podcast subscriptions, Guide profiles ("Meet Kai").
3. Open: Dani's and Maya's role lines; vegconomist's logo is still a letter.
