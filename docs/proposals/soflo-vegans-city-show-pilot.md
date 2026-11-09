# ve-city-shows: SoFlo Vegans returns as South Florida's weekly show (pilot plan)

Sean, 2026-11-09: "We'll start with SoFlo Vegans. We'll do that for a while and we'll see where we go from there."
Playbook `ve-city-shows` (new). The weekly production runs in the podcast studio (`ve-podcast-studio`, BrandDesk > Vegans Explore > Podcast).
No second city until Sean says so after the pilot.

## What the show is

South Florida's week in about 15 minutes, built from the South Florida chapter's own content, voiced by our Guides, with Sean opening and
closing. It publishes to the existing SoFlo Vegans feed on Captivate (show `7769096f-5501-4afc-999a-32dbc14acd64`), so its subscribers
get it with no new show to set up.

## Logan's defaults (Sean's to change)

| | Default |
|---|---|
| Day and time | Wednesdays, 7:00 AM Eastern (the Vegans Explore Podcast keeps Sundays) |
| First episode | Wednesday, November 18, 2026 |
| Length | About 15 minutes |
| Numbering | Continues the SoFlo Vegans feed's numbers on Captivate |
| Intro and closing music | The old SoFlo Vegans intro if we still have it, else the Vegans Explore Podcast's sound |
| Kai's tag | The same Founding Membership tag as the main show (until Jan 1) |

## The run sheet

1. Opening sound
2. Sean's intro (his own recording or his Higgsfield voice, as on the main show)
3. **Top stories in South Florida**, Kai: from the South Florida Daily Pulse of the past week
4. **New in the Directory**, Liz: South Florida's new listings and one 100% Vegan spotlight
5. **Coming up this week**, River: South Florida events from our calendar
6. **Local voice**, a South Florida creator or community member: their answer to a comment request, recorded or written, always
   including their Vegan origin story. Until we have one, an origin story from the SoFlo Vegans archive (checked by ear before it is cut).
7. One commercial
8. Sean's outro
9. Kai's tag
10. Closing sound

Every origin story on the show goes into the Pre-Vegan Guide's collection (`ve-pre-vegan-guide`).

## What has to be built (Logan, in HQ)

1. Turn SoFlo Vegans on in the studio: `SHOWS` live, its Captivate show in `CAPTIVATE_SHOW`, Wednesday air dates.
2. A run sheet per show: SoFlo's template above, beside the main show's.
3. Propose news for SoFlo reads only South Florida: the chapter's Pulse, its new listings, its events.
4. The Local voice ask: a comment request (`/comment/<code>`) with the origin story question, made one per guest.

## How we judge the pilot

Downloads per episode against SoFlo's last year (Insights > Podcast), Local voice guests found per month, and whether it is easy to make each
week. After about a month, Sean decides: keep going, change it, or add a second city.
