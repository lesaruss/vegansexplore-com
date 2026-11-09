# ve-city-shows / ve-podcast-studio / ve-pre-vegan-guide: SoFlo Vegans relaunch (2026-11-09)

Logan, one session. Each line below is named by its playbook.

## Done

- **ve-pre-vegan-guide: origin stories.** The 14 Vegans Explore Podcast origin stories are kept (Sean: "We can keep the 14 stories").
  `docs/proposals/pre-vegan-origin-stories-landscape.md`. SoFlo Vegans stories (Earthling Ed, Klaper, Torre, Barnard, John Lewis, Sadeghi,
  Cheeke, Hargreaves) wait on Sean's transcript uploads.
- **lesaruss-finance: domains.** 50 Namecheap domains in `lr_domains`, a renewal reminder each in `finance_actions` (HQ > Revenue >
  Deadlines, Domain renewals). No page two. veganswholiftpodcast.com lapses (turn off auto-renew before Dec 22); wtfitsp.com kept. HQ main 4e38fb8.
- **ve-city-shows: opened, pilot SoFlo Vegans.** South Florida's weekly show on the existing SoFlo Vegans Captivate feed
  (`7769096f-5501-4afc-999a-32dbc14acd64`), **Wednesdays 7 AM Eastern**, season 10, from episode 112. Plan:
  `docs/proposals/soflo-vegans-city-show-pilot.md`.
- **ve-city-shows: the tip line, live** (VE main 115a1ed). The SoFlo Vegans Podcast page has **Be part of the show**: Leave a message
  (`/comment/soflo-line`) and Nominate someone (`/comment/soflo-nominate`), multi comment requests, voice or written; `details.show_line`,
  `showLine` in `directory/listing.html`. `/comment/v-collective-soflo` (Madai) is made, not sent.
- **ve-city-shows: studio support, HQ main 2f6c175.** `SHOWS` carry day, season, first number, chapter; a city show gets `CITY_TEMPLATE`
  (Kai top stories, Liz new in the Directory, River coming up, a Local voice) and Propose news reads only its chapter (30 days of leads,
  its listings by `ve_chapter_of`, its events in the two weeks after it airs).
- **Episode 112, Wed Nov 11, "The SoFlo Vegans Podcast is back"** (a relaunch, not a preview). Propose news run live; three weak picks
  swapped by hand: Kai = Honest Cuban by VCC + Is it still open? (11 places, 50 points); Liz = Raw Chef Carla, Sunni Speaks Vegan,
  EL Nopalito; River = Rooted In Culture pop-up Nov 21 (never "Friendsgiving" on air), Dolphins game day Nov 29. Kai, Liz, River voiced
  and checked word for word. Sean's intro v2 and outro v4 in his Higgsfield voice, checked word for word, on the run sheet. Local voice:
  Madai Rodriguez (V Collective), clips from VEP 35 listed on the segment, waiting on her Vegan America link.
- **Episode 113, Wed Nov 18**, made with the city run sheet and a Local voice from the tip line.

## On the HQ branch, NOT merged (`claude/exciting-wozniak-5nm6kr`, dc0af29)

- Propose news skips listings with an empty description; city shows lead with 100% Vegan places (a83d77d).
- The voice check compares like with like: vegan not Veegan, numbers and ordinals as words (676c18c). Four good 112 takes had failed on this.
- **The episode as a lookbook** (dc0af29): a white player, one numbered tile per segment; approved tiles open and play from there; Play the
  full episode once every segment is approved. Checked at 1440 and 390 px with 112's run sheet stubbed.

## Sean's Higgsfield voice: the method (seed_audio, element Sean A. Russell `7985695a-f508-49d6-b6e6-508d425b609b`)

The model glitches (a 24 s hole, then a mumbled "dot com, dot com", both before "Go to Vegans Explore dot com"). Make two takes, reword any
line it trips on, keep the clean one, rebuild from its stt word timings (only the words; pauses capped 0.45 s after a sentence, 0.26 s
after a comma, 0.12 s between words), -16 LUFS, check word for word, then send. Upload through a one-time signed-upload function
(`ve-once-pod-upload`, now 410). Never send a take that has not been scanned for gaps and stray words.

## Open

- Sean: merge the HQ branch; approve 112 tile by tile; send Madai's Vegan America link (else she moves to 113); the commercial (default:
  the main show's); talk through the relaunch marketing for Wednesday.
- Logan: run the intro through the same rebuild if Sean wants them to match; cut Madai's clips by ear; assemble 112; Send to Captivate for
  Wed Nov 11, 7 AM Eastern (season 10, episode 112); then step 3 of `ve-pre-vegan-guide` (`ve-course`, the proofs tab, the daily drop).
