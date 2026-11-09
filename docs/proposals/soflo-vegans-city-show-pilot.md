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

## Episode 1 (Sean, 2026-11-09)

"Spotlight the founder of V Collective. She just made an announcement that she's on Vegan America... take some of her story and put
together a feature... let people know the point of the podcast is to tell the story... nominate them... answer your questions... shout out
your favorite Vegan restaurant, a nonprofit, leave a message... really stress the tip line."

### The tip line (live 2026-11-09)

The SoFlo Vegans Podcast's page (`/directory/soflo-vegans-podcast`) has **Be part of the show** under Listen on, with two buttons
(`details.show_line`, `showLine` in `directory/listing.html`):
- **Leave a message** opens `/comment/soflo-line`: a shout-out (restaurant, nonprofit), a tip, or a question, by voice (up to 2 minutes)
  or written; anyone, many answers.
- **Nominate someone** opens `/comment/soflo-nominate`: who, how to reach them, why their story matters; self-nominations welcome.

Every answer emails contact@lesaruss.com and is in Depot > Comments. Said on air in Sean's intro and outro: "Go to vegansexplore.com,
search SoFlo Vegans, and tap Leave a message."

### Feature: Madai Rodriguez and V Collective

From her Vegans Explore Podcast interview (VEP 35, "How V Collective Is Redefining Cruelty-Free Shopping"). Times are from the YouTube
transcript; each clip is checked by ear against the podcast audio before it is cut.
- 4:27 to 5:53, her origin story: a book recommended in Thailand, The Food Revolution by John Robbins.
- 6:15 to 6:33, why: animal welfare and health.
- 1:38 to 2:30, what started V Collective: she went Vegan with food and overlooked skincare and home products.
- 2:50 to 3:38, community is everything.
- 7:45 to 8:28, everyone's welcome, you don't have to be 100% Vegan.
- 15:48 to 16:33, learn the story behind the brands you support.

The news: V Collective is now on Vegan America (the US Vegan marketplace; both are in our Directory under Products > Marketplaces). **Not
confirmed by Logan**: the announcement was not found on the web, so its link or post is needed before the script says what it is. A
comment request for a fresh clip from her is ready, not sent: `/comment/v-collective-soflo`.

### South Florida news from the Pulse (Oct 4 to Nov 8), the ones worth a segment

- Vegan Cuban Cuisine is now **Honest Cuban by VCC** (Miami, Sunset). Their own comment is requested (`/comment/honest-cuban`).
- **MOOD**, a Vegan food truck in Hobe Sound.
- Miyoko's plant butter recall reached Florida (one lot, 07871, best by Nov 5, 2026). By Nov 18 it is past its date, so a short mention only.
- **Is it still open?**: the bounty, 50 points a stop, checking South Florida places on hold.
- Coming up: Rooted In Culture pop-up, Fort Lauderdale, Sat Nov 21 (say the organizer's name, never our own holiday word for it); the
  Plant-Based Game Night with the Miami Dolphins, Sun Nov 29 (tickets for members); ThanksLiving menus in the Holiday Guide (Thu Nov 26).
