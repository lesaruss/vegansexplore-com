# Pre-Vegans Podcast relaunch: wrap (2026-11-21)

Playbook `ve-podcast-studio` (the Pre-Vegans Podcast relaunch). Picks up checkpoint 1006. Nothing was built, written, recorded or
deployed in this chat. This file records what was learned and what Sean asked for, so nothing is lost. It replaces no decision: on
2026-11-21 no checkpoint, playbook row or stream event newer than 1006 touched the Pre-Vegans relaunch.

## What Sean asked for (2026-11-13)

- The Pre-Vegans Podcast comes back as an evergreen master class: one topic people just getting started run into, the organizations
  that work on it, several clips on it from our podcast library, our Guides tied in ("by the end you could give a TED talk on it").
  Target for the next new episode was Friday, November 20, 2026. It was not made in this chat.
- First task: the numbers for the old Pre-Vegans episodes (YouTube views and Captivate downloads), then keep, pull or remix each with
  reasons, then the master-class run sheet and the next two or three episodes for Sean's OK before anything is written or recorded.
- **New direction, same day** (Sean): "this is essentially going to be the pre-vegans guide... we have that whole 111-day thing going on.
  So I feel like this is going to help a lot of people go vegan." The relaunch and the Pre-Vegans Guide are one plan, tied to the 111 Day Theory.
  Logan's note: under the template gate the Guide is copied from the Welcome Guide; the 2026-11-08 handoff already floated "The Pre-Vegans
  Guide" as Maya's Guide name, for Sean to confirm.
- **Source material**: Sean's Pre-Vegans folder (old episodes, transcripts, other material) is on his iCloud. He said he would upload it to
  Google Drive and share the link. Not received in this chat. Next session: read the whole folder through the Drive connector and plan from it.

## What was found

- The public feed (`feeds.captivate.fm/pre-vegans/`) has **17 episodes, not 19**: a pilot, "Vegan or Vegetarian: What's the Real
  Difference?" (2024-11-17), then E1 to E16, Monday, Wednesday and Friday from 2025-01-13 to 2025-02-17, 7 to 18 minutes each. Our
  table counted 19 Pre-Vegans rows on 2026-10-10; the two extra need settling (YouTube only, or doubles).
- Topics by title: protein and meat alternatives, Tabitha Brown, B12, objections, dairy, history of Veganism, eggs, activism, energy,
  processed meat, sleep, gut microbiome, plant-based vs Vegan, fruitarian, soy, cruelty-free products. Most are evergreen starter topics.
- Numbers already on record: Pre-Vegans had 42 downloads in the 30 days to 2026-11-03 (8 the 30 days before); Chrome was 71.4% of its
  downloads, a possible bot signal, so weigh download counts with care.
- Not pulled (every connector was down that day and YouTube is blocked by the session's network): per-episode Captivate downloads and
  YouTube views. Pull them through the database (Captivate via `net.http_post`, YouTube Data API with the server key), never by widening
  the session's network list.

## Next

1. Get the Drive link from Sean; read the whole Pre-Vegans folder.
2. Pull per-episode numbers; settle 17 vs 19.
3. Bring Sean one plan: inventory, keep/pull/remix per piece with reasons, the master-class run sheet, the next two or three episodes
   (topic, organizations, library clips from the content index, Guide tie-ins), and how it becomes the Pre-Vegans Guide with the 111 Day Theory.
   Nothing is written or recorded before his OK.
