# History: guides-standards

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## The Overview is a tour, then the Guide steps back (LOCKED by Sean 2026-11-07, canon `canon-ve-guide-tour-standard`)

"Having the guides take them through all of the different pages and tabs... it's a little disorienting." Supersedes the Start here card and
the Overview standard below (their beats live inside the tour). The Overview is a full tour of the Guide: Play runs a moving slideshow synced
to the Guide's voice (welcome, I'm <Guide>; you've reached the <name> Guide and the transformation; one beat per section, each on a picture of
that tab with the part named lit up; where to start; I'm here, I take what I can't answer to our team, hide me, tap me on any page and I'll
summarize it), chapter dots and Skip the tour, about 90 seconds. Each section's beat is its own recorded chapter: back to back the tour, alone
that page's **Summarize this page**. On every other page the Guide starts hidden as **Ask <Guide>**; tapping opens a chat with suggestions on
top (Summarize this page first and free, Where do I start?, What can I do here?, real saved questions), then the ask box and Ask a person.
Visitors see the whole tour. The summary keeps a voice on every page (`ve-audio-accessibility`). The Dairy Guide stays as it is until Sean says
otherwise. Pilot: the Vegan Restaurant Guide (script `docs/proposals/restaurant-guide-tour-script.md`, waiting on Sean), then the Events Guide.
How to build it: `docs/guides/BUILD-A-GUIDE.md`.
**v2 (Sean, 2026-11-07)**: V narrates the Depot and BrandDesk ("she's the face of that part of it"); the member Guides keep their own characters. One tour,
three uses: the live tour, each chapter as its page's summary, and the same slides and voice rendered as a video for emails (a still with a play button
linking to a watch page through a tracked /go/ link), social and client calls. Animating the Guide on the Overview tours, like the Dairy Guide, comes after
every tour is locked, not before. Build order: the Depot home and its tour (prototype, script `docs/proposals/depot-tour-script.md`, waiting on Sean;
mock `/mocks/depot/`), the BrandDesk Overview tour (client version first), its video, then the Restaurant Guide. One shared tour player for all of them,
built on BrandDesk's existing V tours (`lib/branddeskTours.ts` in lesaruss-hq).
**v3 (Sean, 2026-11-07, decided first on the Nonprofit Guide): the Overview tour is a video, not a live slideshow.** It plays on the Overview, goes on our
YouTube, is downloadable, and is cut into clips for social and the podcast. Pipeline: 1. script approved; 2. each chapter recorded in the roster-profile voice and
checked with stt (unchanged); 3. a **lookbook** of every shot per chapter for Sean to approve before any animation or credits; 4. animation, the Guide on camera
with lip sync (the Dairy Guide standard); 5. the edit, chapters as video chapters, and Summarize this page still plays that chapter. The live slideshow player is
dropped. The Depot's 13 chapters are already recorded (step 2 done).
**Depot > Guides > Guides and tours** (`/admin/depot/guides`, built 2026-11-07; Sean: "it should be something that lives within the guide section we're
creating in the depot, where we can see everything, all the assets, all the recordings"): every tour video's back end, the lookbook living here instead of an
artifact. `#list`; `#t/<slug>/lookbook` (each chapter's line and recording, then its shots: **On camera** with the exact seconds of her words, **Page capture**,
**Illustration** (an idea until approved, then drawn), each **Approve** or **Redo** with a note, or Undo); `#t/<slug>/script` (each recording, its version and the
word-for-word check); `#t/<slug>/video` (the edit, once made). Tables `ve_video_tours`, `ve_video_chapters`, `ve_video_shots` (migration
`20261107_tour_backend.sql`; named ve_video_* because `ve_tours` is the old Tours feature), through `ve-depot` `tours`, `tour`, `shot_decide`, `chapter_approve`.
**On camera is three short moments** (Sean: "first 2.5 seconds, maybe in the middle, and then at the end"): lip sync needs about 3 s, so each is cut at a natural
pause and held to 3 s with the mouth closed. The rest is B-roll of the real pages plus a few illustrations. **The Depot tour** is the first: 13 chapters (1:56), 19
shots; V on camera at chapter 1 (0 to 2.4 s), 9 (0 to 2.5 s) and 13 (6.9 to 9.6 s), from her existing closed-mouth start frames
(`geekfon-media/artists/v/business-tour/join-1-v2.jpg`, `join-5-v2.jpg`, `start-4-v2.jpg`, no new credits); 12 real Depot captures at 1920 x 1080 in
`vegan-media/media/tours/depot/`; two illustration ideas (chapters 7 and 9). Next: Sean approves the lookbook, then the three moments are lip-synced and the video
is edited. The Nonprofit Guide (Dani) is the next tour to load here.
**The lookbook format (LOCKED by Sean 2026-11-07, "let's lock it"; canon `canon-ve-guide-tour-standard` v4 `lookbook_format_v4`; migration
`20261107_lookbook_frames.sql`)**: modelled on the Nonprofit Guide's lookbook artifact, with a white player, Approve and Redo on every card, and readiness
kept apart from the decision. The Lookbook tab (`lookbook()`, `frameCard()` in `admin/depot/guides.html`) is a white player (the frame, its words and time,
Play the tour through the chapter recordings back to back, Back / Next, a tappable progress bar, numbered frame buttons colored by decision), a legend, then
one card per frame in play order (01 to N): picture, global time, readiness (`ve_video_shots.readiness`: Ready, Recapture, Mock, B-roll), decision
(Waiting for you, Approved, Redo), section, the quoted words (`line`), On screen, an orange note when the script names something not built (`flag`), Play
from here, Approve / Redo / Undo (a Redo note can be spoken with the site mic). An illustration is B-roll inside the frame whose window it shares, with its
own decision. `audio_from` / `audio_to` are each frame's window in its chapter; a split inside a chapter is by sentence (approximate) unless stt word
timings are taken. The Depot tour is 17 frames (19 decisions); its orange notes: Logos as its own tool, See every page, Ask V.

## Every Guide opens the same way, and businesses earn the word Vegan (Sean, 2026-11-06)

Canon `canon-ve-guide-overview-standard`: "we need to address the elephant in the room, let them know they're in the right place, give them an
idea of what they can expect, and then clearly lay out the transformation... let them know how to use this guide... educate them... inspire them...
remove any obstacle... feel free to ask our guide... and if I can't answer your questions, we'll escalate it to one of our team members." Every
Guide's Overview, before any doing, in order: the elephant in the room, you're in the right place (who it is for), why it exists, what to expect,
the transformation and what finishing means (a short checklist), how to use the Guide, inspire and remove obstacles, then the Guide in first person:
ask me, and our team if I can't answer. Promise only what exists (Talk to <Guide>). First: the Pre-Vegan Business Guide
(`docs/proposals/pre-vegan-business-guide-overview.md`, waiting on Sean), then each Guide with Sean reading its script.

Canon `canon-ve-pre-vegan-meaning`: Pre-Vegans is a dignified pathway for people who are not Vegan yet, met with education and compassion; a title
for now ("I'm Pre-Vegan, working toward it"). We hold the word Vegan sacred: **a business that is not Vegan offers plant-based (Pre-Vegan) options,
never "Vegan options", in our own copy**; it earns the word Vegan. We use the right words without lecturing about the rule. A **tasting night** is
invited, valued members tasting a business's dishes and sending honest, constructive feedback, anonymous to the business through our app (our team
knows who said what); it ties into certification and stays Coming until one has run. Not yet changed without Sean: the Directory's "Vegan options"
label, the Restaurant Guide and the certification copy.

**Four badges for businesses (LOCKED by Sean 2026-11-06, "lock it"; canon `canon-ve-business-badges`; migration
`20261106_business_badges_canon.sql`).** **100% Vegan** (everything Vegan, run for the animals), **100% Plant-based** (everything plant-based,
the owner does not claim the Vegan motivation; respected, never a lower badge), **Pre-Vegan Certified** (named items we checked to Standard
V1.2; about the items, not the whole business; the badge opens the boxes they passed), **Pre-Vegan** (any business with plant-based options).
The owner's own intake answers set 100% Vegan or 100% Plant-based; we never judge it for them, they see the badge before it shows and can
change their answers, and our team checks before 100% Vegan shows. It is peace of mind for customers and protection for the owner, never a
penalty; a plant-based place that later adds meat broke no promise. 100% Vegan businesses get more from us (first in features and on the
podcast, the most help staying open). Our copy never names a real business or owner as an example of either badge. **Not built**: the badges
on listings, the Directory's Vegan options label (a later step).

**The badge intake, built 2026-11-06** (Sean: "approved", with Logan's defaults; migration `20261106_business_badge_intake.sql`, run through the one-time
`ve-once-badge-intake`, now the 410 stub; handoff `docs/handoff/2026-11-06-ve-pre-vegan-business-guide-badge-intake-built.md`). Four shared questions
replace "How Vegan is what you run?" (`vegan_level`) in the Restaurant, Events and Pre-Vegan Business intakes: `biz_all_plant` (Is everything you sell
plant-based?), `biz_word` (Vegan. We run it for the animals. / Plant-based), `biz_beyond` (beyond the plate: all, mostly, not yet), `biz_help`. `r_vegan`
and `e_vegan` are Question 1 now. **Questions can be skipped**: `ve_survey_questions.show_if {q, in}`, `ve_survey_states` (shown, skipped, waiting); a
skipped question is never required and pays its points as if answered, so every path pays the full total (Restaurant and Events 250, 20 a question;
Pre-Vegan Business 100, 10/5/5/5). `ve-guide-survey.js` skips them, counts only shown ones and shows **Your badge** (Change my answers, Continue) when the
answers set or change it. **The badge** is `ve_business_badges` (one row a member, kept by a trigger on `ve_member_shared_answers`; history
`ve_business_badge_events`): 100% Vegan waits for the team (`checking`, shows 100% Plant-based meanwhile); Vegan + Mostly or Not yet shows 100%
Plant-based (`follow_up`); Plant-based and Pre-Vegan show at once; leaving 100% Vegan clears its approval. **Depot > Business badges**
(`/admin/depot/badges`, Directory; edge function `ve-badges`): Waiting for a check, Team follows up, Showing, All; Approve 100% Vegan, We will follow up
first (note), Save note only (`ve_business_badge_decide`). Event sponsors' Compare scores the new answers. Proven 2026-11-06 in a rolled-back transaction
and at 1440 and 390 px against mocked answers. **Not built**: the badge on listings and cards, an email when approved, an Inbox row for a new claim.

## A Guide speaks on every page (LOCKED standard, Sean, 2026-11-04, corrected 2026-11-05, playbook `ve-audio-accessibility`)

"I just want Liz to speak on each page. So the same voice that we have for Liz... create a script for the first page and any page that doesn't
have audio. I just kind of read what you put." Sean's reason: King Mustafa (water and hydration) has a reading disability, Sean knows people in
the community who cannot read well, and others will not read a page. It is not an accessibility widget or a "Listen" button.

- **Corrected 2026-11-05 (Sean): not Liz everywhere. A Guide on every page.** "Liz doesn't need to be on every page. A guide needs to be on every page. So if
  River is the guide for the events, then it should be him that's reading it... the experience on each page with the guide should be one of our guide guiding them
  through it." Each page is voiced by **its own Guide** (who leads which Guide: the Guide banners note under Guides are mini apps; Liz on the Restaurant Guide, River on
  the Events Guide), in the Guide's own words, guiding, never a reader of the screen. This version: a **still picture** of the Guide beside the line (no animation; B-roll
  and animation come later), and the picture may change from tab to tab, **outfits mixed up to fit what is going on** (Sean: "They don't have to be wearing the same
  outfit every single time").
- **The Events Guide is the first (2026-11-05, Sean approved V1):** River speaks every tab in his roster-profile voice (`btaSeNTVh1pGx4pjFzub`), 29 recordings in
  `vegan-media/media/voices/events-guide/river-<tab>-v1.mp3` and `river-<tab>-member-v1.mp3` (Gear is one line for everyone), each checked word for word with `stt`, over a
  still of him for each tab in an outfit that fits it (`public/guides/events-guide/still-<tab>.jpg`, Higgsfield, My list reuses Overview). Each tab's `say` and `sayMember`
  equal its recording (`TABS` in `guide-scripts/vegan-events-guide.js`; change a line, record `-v2`). Play is right under his name; nothing plays until pressed, then each
  tab plays until Pause. **Every Guide is also an intake** (Sean: "Every time somebody suggests something, that builds our directory"): Venue and Vendors ask for one we're
  missing (Join the Directory's Add it), and Gear has **Missing something?**, a suggestion sent to `ve-feedback` as kind missing (Depot > Feedback and the Inbox).
  The Events Guide's tabs are **one dropdown at every width** (numbered, locks kept; `drawMenu`, `setDD`), its join button reads **Take survey**, and on phones the
  bubble beside River is as tall as his picture and scrolls (`.ev-bub-in`). **On branch `claude/funny-cori-thdm61`, not yet on `main`** (2026-11-05). **Merged to `main` 2026-11-05** (cefdadf). **The 15 tabs are 6 groups** (Sean, 2026-11-05:
  "15 is way too many... I approve"; `GROUPS` in the Guide script): Start here (the Overview); Plan it (Kinds, The plan, Money); Line it up (Venue,
  Vendors, Gear); Run it (The word, Day of, After); Learn from hosts (Elephants, Hosts); Work with us (Claim, Sponsorship, Get access or My list).
  The dropdown lists the 6 (each with its sections in small type), a group opens as a page of tiles (`#/g/<group>`), a section's crumb and the
  dropdown name its group (Plan it > Money), old `#/<section>` links still work, and Back / Next walks Start here, each group page, then its
  sections. River's lines for the 5 group pages (`GROUPS[].say`, approved by Sean 2026-11-05) are recorded as `river-g-<group>-v1.mp3`
  (planit, lineup, runit, learn, together; each checked with `stt`), so Play shows on group pages (Start here keeps the Overview recording).
  The tab once called Work with us is Sponsorship. **Live on `main`** (merge 37695b5, recordings wired 279ac81, checked at 1440 and 390 px).
  **The Resources tab on Event Venues and Community > Events listings opens the Events Guide** (2026-11-05, main 29eb511; `vegan-events-guide` in `GUIDES`
  and `MAP` of `public/ve-guide-tab.js`, a `door` Guide: "Free with a short survey", ownership from `ve-guide-unlock` status), checked live at 1440 and 390 px.
  **The membership rule, LOCKED by Sean 2026-11-06** ("lock it"; canon `canon-ve-door-guides` v6 `membership_rule_v6`, `canon-ve-people-campaigns-doors` v5;
  migration `20261106_membership_rule_v6.sql`): in by any Guide survey (250 points) or the $11 one time (then a prompt, not required, to take a survey); topic Guides
  (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket) are $11 or 1,100 points for members, no survey route (Supermarket free while sponsored); business
  Guides (Restaurant, Creator, Events, Nonprofit) open by finishing their intake, for anyone, members included (replacing "open to any active member"); one survey system
  for every Guide; shared answers fill in on later intakes, newest wins; a Registered badge per intake; 250 per intake, stacking; the general survey becomes the short
  Explorer survey on the Welcome, checked by a person. Done 2026-11-06: canon, the Events and Restaurant intakes pay 250, and step 3's mechanism
  (`ve_shared_questions`, `ve_member_shared_answers`, `ve_survey_questions.shared_key`, `carried` in `ve_survey_get`, skip and Change in `public/ve-guide-survey.js`;
  migration `20261106_shared_intake_answers.sql`) with no question tagged yet: the wording waits on Sean (`docs/proposals/shared-intake-questions.md`). Not built:
  steps 4 to 9 (handoff `docs/handoff/2026-11-06-ve-events-guide-membership-rule-locked-shared-answers.md`).
  The free organizer account is dropped: a host with no account takes the event survey.
  **Steps 3 to 9 live 2026-11-06** (Sean approved `docs/proposals/membership-rule-wording-steps-3-9.md`, then "Merge and go live"; main 68083a3; handoff
  `docs/handoff/2026-11-06-ve-events-guide-membership-rule-steps-3-9-live.md`): shared questions tagged (chapter, org_name, org_link, vegan_level, "Plant-based options"
  never "Vegan options"); the Nonprofit Guide is a door Guide with its 11-question intake; **a door Guide opens only with its own intake** (`ve-guide-unlock`, `ve_owns_guide`;
  `unlock`/`checkout` answer 409 `survey_only`; purchases and comps still count); Registered badges (`ve_member_badges`: Registered restaurant, event host, creator, nonprofit,
  role under each) on the dashboard, member card and linked People profile; the **Explorer survey** (`/survey?s=explorer`, 8 questions, 250, `ve_surveys.reviewed`: points held
  and the account in Depot > Profiles > Waiting for review until a person approves) is the Welcome's and the $11 window's survey; the after-$11 prompt on the dashboard; the claim
  email links the event survey; policies, facts and saved answers updated.
  **After the retirement (Sean, 2026-11-06, main 687b0c2; `docs/proposals/events-guide-after-survey-door.md`)**: River's Get access line is `river-join-v2.mp3` (survey only, no $11; checked with `stt`), and the Get access tile and the Overview footer say free with the event survey. The Vegan Restaurant Guide's Get in shows an active member who has not taken the restaurant survey its own screen ("You're a member. One short survey opens this Guide.", `joinActive`, `sayActive`; no Founding line); Liz speaks it (`door-join-member-v1.mp3`, recorded 2026-11-07, stt 24 of 24; `AUDIO_ACTIVE` in the Guide script). Proven live through `ve-once-survey-proof` (now the 410 stub): a signed-in event survey admitted its [TEST] account and opened the Guide; an Explorer finish waited for review and Sean's `review_decide` approved it; test rows removed. **Checked signed in, 2026-11-07** (main de2738f; `ve-once-guide-run`, now 410, script `scripts/supabase-once/guide-run.ts`; [TEST] member-class accounts, since `ve_survey_answer` refuses the internal Logan test account): Liz's member Get in plays at 1440 and 390 px; Restaurant Get in > survey > the Guide on What's next; Events Get access > survey > the member menu; Creator > survey > the Guide opens (a capture right after the redirect can show the visitor header before `open` returns; a fresh load is the member view). **The Explorer review email is dormant by design**: `ve_surveys` explorer is `reviewed` false (Explorer path v7, straight in), so a real finish made the account active, Founding, 220 points, with no review and no email; `notifyTeam` fires only on `review: 'pending'`. Found: `nav.js` labels every active member Founding Member (queued in `ve-feedback`), and the creator survey's finish screen showed the restaurant badge line, because the test account had taken the restaurant survey first; fixed 2026-11-07 (Sean asked for Logan's call): the badge shows on a finish screen only when that survey asks the badge questions (`asksBadge` in `public/ve-guide-survey.js`).
  **The old 31-question survey door is retired** (Sean, 2026-11-06, "retire it"; main 494e161, `ve-mission-survey` v11): `/survey?door=1` opens the Explorer
  survey, `door_start` and `finalize` answer 410, the send-back email links the Explorer survey; the 31 questions stay as Build your profile.
- **Every page a person can land on has a script for its Guide** and, once Sean approves it, the recording in that Guide's roster-profile voice (Guide voices
  section; never a voice picked without Sean). A new page does not ship without its script. Redirect stubs, ad creatives and render frames are the exceptions.
- **Logan writes the script, Sean reads and approves it, then it is recorded** (el-media tts, checked word for word with `stt`, `-v1.mp3`; a
  line's text must match its recording, and a change is a new `-v2`). Scripts live in `docs/proposals/liz-audio-scripts.md` until recorded.
- **No browser voice and no Listen button** (Sean rejected that route). A page with no recording yet says nothing rather than speak in another voice.
- Nothing plays on its own; the visitor presses Liz's Play, as on the Guides.
- The Restaurant Guide's tabs are all recorded (2026-11-04, below under Door Guides). Order from here: the other Guides' silent tabs, then the main pages (script drafted for Sean first each time). el-media is called from the database with pg_net, never with another engine.

## Guides are mini apps (Sean, 2026-10-08)

"This is how all of our guides should be... mini apps bringing all these components together." A
Vegans Explore Guide is never a PDF or a slide deck: it is a small website that spotlights the bigger
tools we already run (the Directory, votes, the Cookbook and its recipes and chefs, the Daily Pulse,
the ad rail) and combines them into something new. The reference is the Vegan Dairy Guide
(`guides/vegan-dairy-guide.html`, `guide-scripts/vegan-dairy-guide.js`): a menu, search for members,
brands as approved Directory listings with votes, a Cookbook, and Maya as the Guide.

**Building a new Guide: follow `docs/guides/BUILD-A-GUIDE.md`** (canon `canon-ve-guide-build-playbook`; Sean, 2026-10-10:
"This is the prototype"). It lists every step that made the Dairy Guide, in order: decide, content, the page, pictures, the
two scripts, recording, test, launch. Copy the Dairy Guide's files; never start a Guide from a blank page.

- **Every Guide opens with Start here (LOCKED by Sean 2026-11-06, canon `canon-ve-guide-start-here`)**: why they are here, why we do what we
  do, why this Guide was made, what changes for them, how to use it, and that it is built with them (tell the Guide or send feedback; the
  team sees it). Shared component `/public/ve-guide-intro.js`; the rule is in `docs/guides/BUILD-A-GUIDE.md`. First on the Restaurant Guide.
  The other Guides get it one by one; a new Guide never launches without it.

- Signed out: the header holds the $11 Founding Membership box (members get search there). Each locked tab shows the
  real section blurred with a membership note on top (since 2026-10-09; the slideshow previews are gone), see The layout.
- The Cookbook is the recipe and chef tool (Phase 1 live 2026-10-10): recipes are rows in `recipes` (status `live` or
  `retesting` are shown, only through the `ve-cookbook` function: members get them, everyone else only the titles; no public
  read), Maya's with a Guide badge (her two recipes and the pantry swaps, copied from the members-only `ve_guides` row),
  members' with their first name and last initial. A member votes (one per recipe, can take it back), says "didn't work for
  me" (a note; three different members pull it to Being retested, trigger `trg_recipe_reports_count`, Sean emailed), and
  shares a recipe (`#/cookbook/new/<step>`, three steps: About it, What you need, How to make it; five a day), which waits
  in **Depot > Cookbook** (`/admin/depot/cookbook`). Approving pays 50 points once (`ve_recipe_review`, `points_ledger`
  reason `recipe_approved`, ref `recipe:<id>`) and emails them; Send it back needs a note and emails it; a retest is settled
  with Put it back or Take it down. My recipes (`#/cookbook/mine`) shows each with Waiting for approval, Live, Being
  retested, Needs a change (Send again) or Not live. Migration `20261010_ve_cookbook.sql`; the 45 "Make Your Own by Javant"
  recipes in the same table stay `private` until he says yes (Phase 2: christened chefs; Phase 3: ambassador links and
  co-created Guides). Not built yet: chef profiles, comments on recipes.
- **Dairy Guide v2** (Sean, 2026-10-10: "ready because we can literally push this out to get people to log in"). Members of a
  Guide are the people who own it (`ve_owns_guide(member, guide)`: a `ve_guide_purchases` row; admins always), and the Cookbook
  inside it is for them (`ve-cookbook` with `guide`). Everything is votable by them: recipes (their own votes), swaps and episodes
  (`ve_guide_votes`, kind `swap`|`episode`, `ve-cookbook` `gvotes`/`gvote`), brands and cookbooks (the Directory's votes); each list
  sorts by votes. A picture sits left of every item, a square with rounded corners (`thumb()`): recipes from `recipes.photo_url`,
  swaps from `SWAP_IMG` (`s-<swap>.jpg`, the swap in use: milk in coffee, butter in a skillet), cookbooks from their Directory listing's
  `logo_url` (the cover, copied into `vegan-media/media/logos/books/`, so the Directory and the Guide show the same square).
  Photorealistic pictures made in Higgsfield are marked `recipes.photo_illustrative` and captioned "Illustrative photo" until real
  ones replace them; a missing one shows a leaf tile. Every recipe, swap and cookbook has its picture (2026-10-10; covers in
  `20261010_dairy_guide_book_covers.sql`, each the publisher's or the retailer's cover, `details.cover_source`). No Guide badge on Maya's recipes (she is the only Guide in it). A recipe
  shows its words on the left and its picture on the right, a **shopping list** (tick what you have, kept in the browser; dairy
  items go to the Guide's brands, the rest to an Amazon search until affiliate links are set up; water, salt, sugar and oil have no
  link), and **Made it?**: members upload photos only, no written reviews (Sean: "they might be negative"). Photos are shrunk in the
  browser (1600 px JPEG, which drops location data), go to `vegan-media/media/guides/dairy/made/` through a signed upload
  (`photo_start`, `photo_done`, five a day, 15 MB cap), wait in **Depot > Cookbook > Made it photos** (`#photos`, `photo_queue`,
  `photo_review`), and show with the member's first name once approved (`recipe_photos`, migration `20261010_dairy_guide_v2.sql`).
  The truth (named See for yourself until 2026-10-10; Sean: "that's just the harsh reality that people don't want to see")
  is one fact at a time (`#/look/<n>`) with its number and an icon (`LOOK_STATS`, from the cited facts). Maya's line on it was
  re-recorded the same day with Sean's approval ("The truth is how milk is really made...", `dg-look.mp4?v=3`, take 1 of 2,
  cut at 6.6 s on a closed-lip smile).
- **The Pulse's episodes are podcast rows** (Sean, 2026-10-31: "the new style of just having the podcast clip that you can play...
  you just see the logo of the podcast... pull in other podcasts as well too, from the RSS that match... that topic"). Podcasts and
  interviews is the Restaurant Guide's way: `PULSE_PICKS` rows are [Pulse slug, show's Directory slug, feed guid], each read through
  `ve-podcast` `episode` and drawn with `VEEpisodes.row` (the show's logo, Play in the player docked above, our vote and Save), two
  across. Under them, **From other shows**: the newest dairy episodes from the other podcasts in our Directory,
  `ve_topic_episodes('dairy')` (migration `20261031_ve_topic_episodes.sql`: titles matched on dairy words, our four shows and
  LESARUSS.ai's left out, at most 3 a show, 24 in all), each with Play and The show. A new topic for another Guide is a `when` line
  in that function. An old `#/pulse/watch/<slug>` link opens the list and plays the episode.
- **Two experiences, two scripts** (Sean, 2026-10-10: "The first one is letting you know why you should get it. And then the
  other one is walking you through what you have"). Each tab's `say` is for visitors and `sayMember` for members who own the
  Guide; `clip()` plays `CLIPS_M[tab]` (`dg-m-<tab>.mp4`) to members and `CLIPS[tab]` to visitors, and switches the moment a
  visitor unlocks. Cookbook names everything in it (recipes, What can I make?, cookbooks, chefs coming, share your own). Every
  tab has its own pose (Sean: "each one you click on should look different"); the first page's picture is arms folded with an
  open smile (`dg-poster-overview.jpg`). Lines approved by Sean 2026-10-10; My list has its member clip too. Clips are made
  as one take each (Sean, 2026-10-10, on credit spend), re-done only if the ending or the lip sync fails.
- **Maya never fades out, and phones get her full width** (Sean, 2026-10-10). Her welcome (`maya-dairy-welcome.mp4?v=3`)
  was repaired: a stray one-frame flash at 29.47 s removed, the fade from and to black replaced by her first and last clear
  frames (she stays on screen, frozen), a crackle at 17.3 s and four clicks smoothed, and its level raised to match the tab
  clips (about -15 LUFS). On phones (900 px and under) she is full width on top with her words under her and a **Hide Maya /
  Show Maya** switch (`#dgFold`, kept for the visit), and Back / N of M / Next sit under the content (`#dgTourM`); Next goes
  back up to her.
- **Guides on phones: one card that never grows (LOCKED by Sean 2026-11-07, canon `canon-guide-mobile-card`).** Sean: "I want the screen with V on mobile to always look like the first one... if there's more text... I don't want the screen to get longer... it becomes a scroll in that window where the text is... lock that in as the standard for guides appearing on mobile... you can still hide them." At 900 px and under (980 in HQ BrandDesk) every Guide, member Guides and V alike, is one card above the content: the picture a third of the card's width on the left; on the right the words in a fixed box (116 px) that scrolls, then one row of buttons (Play or Summary, then Ask a question or Talk to <Guide>), the picture's bottom level with the buttons' bottom (166 px); the card never grows with longer words. Hide stays (a small Hide me tag on the picture's corner on Vegans Explore, Hide me beside the name in BrandDesk). Vegans Explore: `/public/ve-guide-corner.js` (every Guide page loads it; a page never overrides it, the Events Guide's own phone rules were removed). HQ: the `@media (max-width:980px)` block in `components/branddesk/VDesk.tsx`. Not yet in the standard: the Passport's Enter the room button still sits under the card.
- **The Guide in the corner** (Sean, 2026-10-30, from the J9 proposal page: "V is in the top left-hand corner... that could be
  something we could do for our other guides, because sometimes it's too much when they're on the page"; live on the Dairy Guide
  2026-10-31, rolled out to every Guide the same day: "Roll it out to the rest"). `/public/ve-guide-corner.js`, loaded in `<head>` of
  every page with the Guide layout (`#dgRail`), injects the rules: at 900 px and under the rail is a row above the content, the
  Guide's picture (`.dg-maya` or `.dg-guide`) a 110 px rounded square top left, the bubble beside it with its tail pointing at
  the Guide, the play button and Hide me under the bubble (side by side, stacked under 560 px), the name line hidden, Back / N of M
  / Next at the bottom (`#dgTourM`). Desktop is untouched, and it never forces the rail to show, so Hide me (`ve-guide-min.js`) and a
  page that hides its rail (the Creator Guide's overview, `cg-wide`) still work. A new Guide page loads it. On the Dairy Guide the
  captions are too small to read on the square, so at that width they show in her bubble (`capMode`, `onCue`); the Ambassador
  Guide's picture player shrinks to a play button and its progress line there. **Get access on desktop** (Dairy Guide, Sean,
  2026-10-31): above 1180 px the title, its line and the list sit on the left and the price box on the right, its top level with
  the line under the title and its bottom with the list (`.dg-join`); stacked at 1180 px and under.
- **Minimize the Guide** (Sean, 2026-10-28: "if I'm using this tool, I don't want to see River on the right-hand side"; then "let's
  make him actually overlap at the bottom of the page and not create a whole column... a square... with rounded corners... show
  me, hide me... if the name's long, it's going to throw it off... the hide me... below the pagination, like a rectangular button").
  Every Guide page loads `/public/ve-guide-min.js` after its script: it moves the page's `#dgFold` under Back / N of M / Next as one
  full-width **Hide me** button; folded, the rail is gone and the content takes the whole width, and the Guide floats as a rounded
  square in the bottom right corner of the screen, **Show me** (`.dg-mini`, the rail's `data-guide` through `VEGuideArt`), on desktop
  and phones alike. A new Guide page sets `data-guide` on `#dgRail` and loads the script (and `ve-guide-corner.js` in its `<head>`).
- **One tile** (Sean, 2026-10-10: "I want the tile to be the same on both... I like the top right hand corner look"): swaps,
  recipes, What can I make? and episodes share `row()` in the Guide script: the square picture left, the words, vote and Save
  stacked at the top right (`.dg-acts`, one above the other so the words keep their room on a phone; Sean, 2026-10-10). A recipe tile shows its time, its counts and what you need (two rows). Brands and cookbooks
  stay the Directory's own card, with Save added under + Vote. Picture style and placement follow the Directory card.
- **My list** (Sean, 2026-10-10: "a tab or a drop down that says my list"): a Guide owner taps Save on any swap, recipe, brand,
  cookbook or episode, and it shows in the My list tab (members only, after The truth), one kind per view
  (`#/mylist/swaps|recipes|brands|cookbooks|episodes|shared`), newest first, in the same tiles. Recipes you shared is the same
  list as Cookbook > My recipes (`drawMine`). Data: `ve_guide_saves` (migration `20261010_ve_guide_saves.sql`), through
  `ve-cookbook` `saves` / `save` (500 per member per Guide). Chefs, when they come, get the same tile with a square of their face.
- **Guide banners: the Guide in a scene** (Sean, 2026-11-01: "The images for the guides are old... they're still using the old
  black white background images"; this replaces the white-background look locked 2026-10-10). Every Guide's card on `/guides`
  opens with a banner (`.gc-banner`, linking into the Guide): 8:5, rounded corners, the Guide **inside a scene that is the Guide's
  subject**, mid shot, doing the thing (Maya making almond milk in a sunny kitchen, Liz at a table with a restaurant owner and a
  tablet, River cheering in the stands with a plant-based hot dog, Nori picking a VEGAN snack box at an airport shop, Dani in her
  wheelchair petting a rescued cow at a sanctuary, the creator filming a plate on a phone tripod, Theo in a kitchen with a Vegan plate
  and a plain supplement bottle), every finger in frame, no words or logos but the Vegans Explore tee and a word the scene needs
  (VEGAN on a box). Made in Higgsfield (nano_banana_2, 16:9, from the Guide's current art), center-cropped to 8:5 and saved at 1200 x
  750, JPEG quality 82, as `public/guides/<guide-slug>.jpg` (the six of 2026-10-31 came across through `ve-off-lookup` `save` into
  `vegan-media/media/communities/guide-banners/<slug>.png`, the originals). One file per Guide, used everywhere: the catalog, the
  listing Guide tab, the house banners (`VEPromo` `GUIDE_ADS`), the HTML5 ad card's first scene (`ads/guides/guide.html`), the pitch
  page, the business dashboard and the Guide page's `og:image`. A new banner bumps `?v=` on those references. The old white ones stay in
  `vegan-media/media/guides/banners/` for outside links only. On 2026-11-01 every other card got its scene too (originals in the same
  `guide-banners/` folder): the Partner Guides (`partner-<slug>.jpg`), the Coming soon Guides, and a new Stadium & Arena banner with River
  as a fan in the stands. A Coming soon card shows its banner (not a link) and **With <Guide>**; with no banner it keeps its flat icon.
  **Who leads which Guide** (Sean, 2026-11-01: "keep Maya as the guide for Pre-Vegans"): Liz Restaurant, Entrepreneur, Ambassador,
  Dating; Maya Dairy, Pre-Vegan, Baking; River Stadium & Arena, Community Manager, Eating Out, Athlete; Nori Airport, Budget, Abroad;
  Dani Nonprofit, Group Partner, Nonprofit Partner, Kids and Family; Theo Nutrition, Seasoned Vegan, Holidays, Pets; Kai Creator, Official
  Creator, Beauty and Fashion; Pascal Meat Alternatives, Meal Prep.
  **Only clothes from our store** (Sean, 2026-11-01: "we don't put any clothing that's not in the store", the GeekFon Society rule):
  a Guide in a banner or scene wears the Vegans Explore Tee (black, the green suitcase mark over VEGANS EXPLORE on the chest, as on the
  Nutrition banner) or another item in the store; an apron may go over it. Pascal's Supermarket, Meal Prep and Meat Alternatives banners
  were redone that day (his cream shirt and a made-up green tee were off brand). The model garbles the small EXPLORE: check the print
  close up, and when it is wrong paste the real mark from `nutrition-guide.jpg` rather than generating again. The eleven added as Coming soon on 2026-11-01 (members only, like the
  rest; their Notify me sign-ups tell us which to build first): Vegan on a Budget, Meal Prep, Eating Out Without Stress, Vegan Kids and
  Family, Vegan Athlete, Vegan Baking, Vegan Holidays, Vegan Pets, Vegan Beauty and Fashion, Vegan Dating, Vegan Abroad.
- **The Welcome Guide is the whole cast** (Sean, 2026-11-01: "an ensemble Guide. It can introduce all of the Guides throughout"). Its
  banner is all eight Guides at an outdoor Vegan market (`welcome-guide.jpg`), and the Passport Guide (`passport.html`, `TABS`) opens on
  the ensemble (`g: 'all'`, `welcome-ensemble.jpg`, "Your Guides · all eight of us"); each tab after is a different Guide who says who
  they are and which Guide they lead, every one of the eight once: Pascal, River, Maya, Theo, Dani, Kai, Liz, Nori. Lines are text, no
  recordings. `/business`'s tabs are unchanged.
- **The Guide list is one file** (Sean, 2026-10-26: the dashboard should mimic "what we currently have on the main guides
  page"): `/public/ve-guide-catalog.js` (`VEGuideCatalog.render(el, {member, source, open})`) draws the cards on `/guides` and
  the dashboard's Guides tab. In order: the **Welcome Guide** (free, opens the Passport Guide at `/passport`; its banner is Dani's
  waving mid shot on white, seated in her chair, `/public/guides/welcome-guide.jpg`, made from her square art with no new
  Higgsfield credits; Sean, 2026-10-26: not Liz, who is already on the Restaurant Guide), the
  Vegan Dairy Guide, the Vegan Restaurant Survival Guide, then the Guides still being made: the **Vegan Meat Alternatives
  Guide** (added 2026-10-26), Entrepreneur, Creator, Nonprofit, Pre-Vegan and Seasoned Vegan. Live Guides wear their banner;
  the ones being made wear a flat line icon, say Coming soon with Notify me (`member_interest`, `guide-waitlist-<slug>`), and
  show to signed-in members only. Choose Your Topics (mini-guides) was taken off. Add or change a Guide card there. On the
  dashboard's Guides tab a Guide opens in the console frame (`openConsoleFrame`, labelled by the card's `data-frame-label`);
  until 2026-10-28 it opened in the Tools panel, hidden on that tab, so Guides seemed not to open (Sean). A Guide laid out to
  fill the window (`html.dg-fit`) never sizes its frame (`nav.js`): sizing it to its own height made the Ambassador Guide bounce. Under the
  cards, `/guides` ends with the Directory's Passport box ("Your first Guide is on us", hidden for active members); its old
  Passport, Vision and Ready sections are gone (Sean, 2026-10-26).
- **The Guides menu and who sees what** (Sean, 2026-10-30: "the same heading as the non-logged in version... we're getting enough
  guides now where we can create a menu... even the onboarding guides... some that I want the community to see, and then there's some
  that I just want the team to see"). `/guides` and the dashboard's Guides tab wear the same banner, **Vegan Guides**, whose dropdown is
  the Guides menu (`VEGuideCatalog.bannerOptions`). **Since 2026-11-01 it is one catalog sorted by interest** (Sean: "a pretty deep
  catalog that may feel overwhelming at first, but when they know they can sort through their interests, they'll see them... This is
  basically the way people are going to become members"): every Guide in one grid, ready ones first and Coming soon after, with an
  interest bar over it (`INTERESTS` and each Guide's `interests` in `ve-guide-catalog.js`: Getting started, Food and cooking, Health and
  nutrition, Eating out, Travel, Game day and events, Animals and causes, Business, Creating content, Partner Guides; an interest no
  visible Guide carries does not show). The chips pick any number of interests (with counts), then search and All / Ready now / Coming
  soon (shown only to a viewer who can see a Guide being made); the banner's dropdown (Your interest, `?interest=`) picks one and the
  chips follow it, and an old `?shelf=` link lands on its interest. On phones (768 px and under) the chips hide and the banner's picker is
  the menu. A new Guide needs only its `interests`. The shelves stay for another brand's list (`render` with `guides`, LESARUSS.ai).
  **Partner Guides** are the onboarding Guides (the Official Creator Guide, the Ambassador Guide, Community Manager Onboarding, the Group
  Partner Guide, the Nonprofit Partner Guide; each opens as its own page). Each Guide's `see` in
  `ve-guide-catalog.js` says who finds it in the menu: `all`, `members`, a list of `ve_role` values, or `team`; super admins see every
  Guide, the restricted ones marked with who else does. A menu is not a lock: a Guide page guards itself where it must.
- Guide pages carry ad slots businesses can buy from the ad console, which shows each slot's traffic
  and a preview of their ad in place (not built yet).
- Pictures of the Guides are made in Higgsfield from their current art, in our illustration style.
- Every Guide is walked through by its Guide on camera (Sean, 2026-10-09, after the For Oatly tour: "This is how all
  of our guides need to be from now on... the guides walking you through and being animated like that"). One slide or
  section at a time, the Guide talking on each (a lip-synced clip under 10 seconds, the way the For <Brand> tour does it:
  el-media voice, Wan 2.7, `scripts/brand-door/assemble_r5.py`), Start the tour first, then every Next plays.

- The layout (Sean, 2026-10-09, after the Oatly page: "Maya stayed present throughout the whole guide on the right
  hand side and the content was on the left"): the tabs are the tour. Overview (what the Guide is and what each tab
  holds, the Guide's welcome), then one tab per section, then Get access for visitors (the $11 Founding Membership,
  already a member: sign in and it opens). The Guide sits in the same spot on the right of every tab, with her words
  in a bubble, one play button and Back / N of M / Next; the content is on the left on a clean white page. Everything
  above the fold: the nav, the Guide and the footer share one screen on desktop, a section with parts gets toggles
  (Pulse: The research / Podcasts and interviews; the research is one fact at a time), and a long list scrolls inside
  its own box. A locked tab shows the real section blurred with a membership note on top while the Guide explains it;
  one example stays free (the Buttermilk swap). Each Guide's research and media tab is the **Pulse** for its topic
  ("it's literally the pulse but just on dairy free food"): sourced facts plus our published episodes and interviews
  (`ve_pulse_content` slugs in `PULSE_PICKS`), played inside the Guide. Why it matters (Sean): each Guide is content
  for the site that fills the Directory with brands and is the top of the funnel for new members; the next one is
  nutritional supplements. No counts in a Guide's words or in what the Guide says (Sean, 2026-10-10: "if I add a resource
  tomorrow, we are now 77... let's just not say numbers at all. They can see from a glance how many items are there"):
  never "76 products" or "16 swaps"; a live count of a filtered list is fine. The Dairy Guide's tab clips (2026-10-10, lines approved by Sean) are
  `vegan-media/media/maya/dairy-guide/dg-<tab>.mp4` and `dg-poster-<tab>.jpg` (`CLIPS` in the script; a tab's `say` must
  match its recording): el-media tts in Maya's voice, Wan 2.7 from her round 5 Oatly start pictures (one pose per tab), cut
  with `assemble_r5.py` in Higgsfield's sandbox. Its mouth reading misfired on most takes, so every ending was checked by eye
  and two were cut by hand (look 7.5 s, join 7.85 s, just before a wink).
- A Guide shows Directory listings with the Directory's own card (`VERegionDirectory.card` / `wire` /
  `css` in `/public/ve-region-directory.js`) and the Directory's pills, search and Sort by, never a look of
  its own. Opening one stays in the Guide (`#/listing/<slug>`): the Guide's breadcrumb, what the Guide says
  about it, and the real `/directory/<slug>` page framed and sized to fit (Sean, 2026-10-08).

## Your Guide (Sean, 2026-10-04)

Your Guide is for registered members, inside the dashboard window: `/dashboard/guide` opens `/guide`
under "Dashboard / Your Guide" (`openGuide` in center-console; `/guide` opened on its own moves there
when signed in and shows a sign-in gate when signed out). Opened from the **Set up your Guide** action
item (first in Action items until done), the dock's Guide icon, and the Choose Your Guide tile.

- Setup: 1. meet your Guide (Passport members choose from six; everyone else has Liz, and choosing is a
  Passport benefit, enforced in `ve-guide`), 2. the Guide asks the Mission Survey if they have not taken
  it (`/public/ve-mission-survey.js`, the only copy of the questions; 250 points via ve-mission-survey),
  3. how the Guide helps (restaurants, things to do in their city, finding something, anything Vegan),
  each idea a question they can send. Then the dock icon opens the conversation.
- Survey screen (Sean, 2026-10-05): one question at a time with one button. A tap only marks an answer,
  Next moves on and skips an optional question left blank (no auto-advance, no Skip). "Vegan" is always
  capitalized in the questions. Question 7 is Month and Year lists, sent as YYYY-MM. The last screen puts
  the four ideas two by two on the left and the Guide's portrait (mid shot) on the right.
- Data: `ve-guide` edge function (`status`, `setup`), `members.guide_slug` and `members.guide_setup_at`.
  The dock icon wears the Guide from `ve_guide_flow_state` (`/public/footer.js`), kept in step from
  `ve-guide` status.
- Quick answers first (Sean, 2026-10-06, see Guide answers below): a question goes to `ve-auth`
  `guide_ask` (free, no AI). With no saved answer the member chooses "Ask <Guide> directly (4 points)".
- Chat: `ve-auth` `guide_chat_send`, members only, 4 points a message from a monthly allowance (60
  points, 300 with Passport). "Send us a message" in the conversation opens the old question box (a
  person answers by email) through the dashboard (`ve-open-help`).
- Not yet: the Guide's replies do not read the member's survey answers. That needs the shared reply
  engine (`character-respond`, used across LESARUSS) to take member context.
- Depot > Preview journeys > Your Guide walks every screen (`/guide?preview=<step>`, `PREVIEWS` in
  `guide.html`); a new screen gets a preview there and a line in `JOURNEYS.guide`.

## Guide answers: a free knowledge base in front of the Guides (Sean, 2026-10-06)

"Make it more like a chat bot where it's essentially a knowledge base... once it has it, it should
immediately pick up and pull into a database of potential questions and answers... not paying out of
pocket for anything." Most questions repeat, so most answers cost nothing.

- `guide_kb_answers`: saved answers (`live` are served, `draft` wait for a check, `needs_sean` are
  questions only Sean can answer, saved for a session with him, `retired`). One row per question, with
  `also_asked` paraphrases, one link, a topic, and `featured` for the chips under the chat.
- `guide_kb_questions`: every question, what it matched, and what happened (`answered` free,
  `no_match`, `sent_to_guide` with the AI reply, `guide_failed`). View `guide_kb_gaps` is the to-do
  list: unanswered questions, most asked first, with the latest AI reply as a starting point.
- `guide_kb_match()`: Postgres text search plus trigram similarity, zero tokens. `ve-auth` `guide_ask`
  answers at a score of 0.42 or more and offers related questions at 0.22 or more; `guide_topics`
  gives the featured chips. Anyone can ask (free); the AI Guide is members only.
- Growing it: an AI Guide reply is saved as a `draft` answer automatically. Logan writes answers he can
  source from the site and canon; anything else goes to `needs_sean` for a question session with Sean.
  A draft goes live only after a check, so a wrong AI answer is never served as fact.
- Facts must agree with `ve-guide-platform-facts` (what the AI Guides know). Change both together.
- Ask a person (Sean, 2026-10-06): "if we aren't getting the answers, they can reach out to either the
  CM or myself." Next to every answer and every miss, Ask a person (`ve-auth` `guide_ask_person`,
  members, five a day) emails the question to contact@lesaruss.com and to the member's city Community
  Manager (`members.ve_role = 'community_manager'`, same `home_community`), Reply-To the member. Logged
  as `sent_to_person`, so it stays on `guide_kb_gaps` until it has a saved answer. Members only ever
  see "the team", never Sean's name or the Community Manager (Sean, 2026-10-06).
- Conversation memory (Sean, 2026-10-06: warn them near the limit and prompt a new one): the Guide
  remembers the latest 20 messages of a conversation. `guide_chat_send` returns `memory {used, max}`;
  from 16 the chat warns and offers Start a new conversation (a new `conversation` id, its own room).
  Under 3 messages of allowance left, it says so; quick answers and Ask a person stay free.
- Low on points (Sean, 2026-10-25, replacing the 2026-10-06 Add points top-up): money no longer buys points, so
  when points run low the chat offers See the Bounties and the Board (`topUpBox` in `guide.html`), opened in the
  whole window. Points are never bought (Sean locked 2026-10-25); Guides are $11 or 1,100 points.
- Migration `20261006_guide_kb.sql`. Brand-ready (`brand_slug`), so other brands can reuse it.

## Guide voices: one place, the roster profile (Sean, 2026-10-31)

"So that way there's never a question as to what we're using, because that's happened a few times where we had to pick new
voices." Every Guide's ElevenLabs voice is kept on its **HQ roster profile**, in the Voice module (table `gfs_artist_bible`, module
`voice`, `data.elevenlabs_voice_id`, with the voice's name, model, who approved it and when, and its `pronunciations`).
`character_agents.elevenlabs_voice_id` copies it; change both together, and never pick a new voice without Sean. Before recording a
line, read the voice from the profile, never from a page, a comment or memory. HQ's `voice-sample` applies the profile's
`pronunciations` to every take (each Vegans Explore Guide: Vegan as Veegan). Say "profile", never "bible" (canon
`canon-terminology`); the table name is the only place the old word stays. Migration `20261031_guide_voice_profiles.sql`.

| Guide | Voice id | Approved |
|---|---|---|
| Liz | `IUMUPi350HfIhyzUBJB3` (Liz (Vegans Explore), Voice Design) | 2026-10-09 |
| Maya | `sM8RysETdBj1LIqLd9tl` (Maya (Vegans Explore), Voice Design) | 2026-10-08 |
| Dani | `b5RPB35vTODb3BEmR3Fc` (Voice Library) | 2026-10-30 |
| Nori | `rr9oBze1kuNJYeAV7xos` (Voice Library) | 2026-10-30 |
| River | `btaSeNTVh1pGx4pjFzub` (Voice Library) | 2026-10-30 |
| Theo | `aFyw0oiXW7dzKF4o7woX` (Voice Library) | 2026-10-30 |
| Kai | `cgSgspJ2msm6clMCkdW9` (Jessica, premade) | 2026-10-31 |
| V | `Nhs7eitvQWFTQBsf0yiT` (Voice Library; replaced `wfEelgHGTfFOp1gtSiR9`) | 2026-10-09 |

On 2026-10-31 V's Guide record still held her old voice and River's profile still called him the Creator Guide with his look from
before the 2026-10-28 refresh; both were brought in line.
