# ve-podcast-studio: Episode 145 out, and the episode page as a discovery engine (2026-11-08)

Playbook `ve-podcast-studio`. Related: `podcast-network-transcript-upload` (subscriptions queued there), a new chapter-rankings playbook (to open).

## Episode 145: out
- Published on Captivate at 7:00 AM Eastern, Sun Nov 8 (checked against Captivate's own API). The live file is `episode-final-v4`
  (Kai's Founding Member tag) plus Captivate's ~6 s network pre-roll. 10 downloads by 4 PM. It shows on the Vegans Explore Podcast
  listing. `ve_pod_episodes.captivate_status` set to Published (it still said Scheduled).
- Episodes 144 and 145 have **no episode number on Captivate** (143 and earlier do). Logan recommends setting them; waits on Sean's go
  (live episodes).
- HQ main still gives new episodes Kai's **old** tag ($11, 1,100 points). HQ branch `claude/vibrant-franklin-mibljs` (d1ea7f8) fixes
  `TEMPLATE` in `lib/podcastStudio.ts`; waits on Sean's merge. Episode 146 (Sun Nov 15) is not started.

## The episode page (Sean: "a discovery engine for other things"; mocked four rounds, approved)
Built on branch `claude/gracious-fermi-i4r1g1`, commit 4432c20, **not on main** (waits on Sean's "merge").
- `public/ve-episodes.js` `rich()` / `drawRich()`: when an episode has notes in `ve_episode_notes`, the episode view becomes: art beside
  a short title, date, episode number, summary, Play / Save / Share (`data-ve-share`) and section jump links; each segment with its Guide
  (`VEGuideArt` square, name, role) and its stories (Read it on <source>, the Directory's own cards via `VERegionDirectory.card`, chapter
  cards via `VEChapters.mount({only})`, a See more in the Directory line, "<place> is logged for our chapter rankings"); In this episode
  (every card, pills All / People / Organizations / Places / Media); Places on this episode (chapter cards + held places); Keep listening
  (`row()` with Play and Save). Phone: 180 px art with Play / Save / Share stacked to its height, then title, summary, links.
  Episodes without notes keep the plain view. Referenced books now sit after the new body.
- Checked by running the branch file on the live page (Playwright route swap) at 1440 and 390 px: 21 Directory cards, 4 held, 7 chapter
  cards, 2 Keep listening rows, no script errors, no sideways scroll. Not yet checked after deploy, nor Play / Save / Vote clicked.

## Data (migration `20261108_episode_notes.sql`, applied)
- `ve_episode_notes` (listing_id + guid, `notes` jsonb, status draft|live; RLS on, no policies) read by `ve_episode_notes_get(listing, guid)`
  (security definer, anon may call). Notes shape: `number, summary, sections[{key,title,guide,role,body?,listings?,chapters?,more?,button?,
  stories[{title,source,url,listings,chapters,held}]}], mentions[], chapters[], held[], held_listings{slug:{name,category,line,place}},
  listen[{show,listing_id,guid,why}]`. Episode 145's notes were written by hand.
- `ve_place_mentions` (place, country, kind news|podcast|pulse|request|analytics|other, source, ref, note): Denver, New Zealand,
  Netherlands logged from Ep 145. The first rows of the chapter rankings.
- Directory: **Rich Roll** People profile (`rich-roll`, the May import's set-aside row promoted; Athletes + Content Creators; family
  `rich-roll` with The Rich Roll Podcast; Instagram photo via `ve-people` `photo_instagram`, checked by eye). **vegconomist** (News
  Outlets, `vegconomist`, letter logo until a logo is set). **Held, quarantined, tag `ve-held-place`**: The Vegan Society of Aotearoa New
  Zealand, De Nieuwe Melkboer (`details.held.place`).

## Decisions and ideas from Sean this session
- Every person, organization, outlet and place named on an episode becomes a tile; places not in our chapters are logged, not posted.
- **Chapter rankings** (new playbook to open): a leaderboard of places that are not chapters, a point per mention in news, the Pulse,
  the podcast, requests, and visitor/listener locations (Google Analytics, Captivate places, YouTube); a Depot page to pick next chapters.
- **Podcast subscriptions** (approved shape, queued in `podcast-network-transcript-upload` after the page): My Saves > Podcasts is one tile
  per show (saved an episode or subscribed); a tile opens New since your last visit, your saved episodes, See every episode, Subscribe;
  "N new" on the tile and a dot on My Saves; an opt-in "Email me new episodes" (unticked), at most one email a day.
- Guide profiles ("Meet Kai") are their own piece; the page shows no link until they exist. Two Guide role lines were Logan's
  ("The Community Guide" for Dani, "The Pre-Vegans Guide" for Maya): Sean to confirm.

## Next, in order
1. Sean: merge `claude/gracious-fermi-i4r1g1` to main; Logan checks Episode 145 live at 1440 and 390 and clicks Play, Save, Vote.
2. Sean: go on Captivate episode numbers 144 and 145; merge HQ `claude/vibrant-franklin-mibljs`.
3. Logan: the studio writes `ve_episode_notes` for each new episode (from the run sheet: segments, stories, links, mentions matched
   to Directory slugs, places checked against chapters and logged to `ve_place_mentions`), so Episode 146 gets the page without hand work.
4. Open the chapter-rankings playbook; then subscriptions; then Guide profiles.
