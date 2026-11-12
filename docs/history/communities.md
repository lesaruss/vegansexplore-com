# History: communities

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Nominate Someone and Kai's interview (Sean, 2026-11-09, playbook `ve-nominate-someone`)

"We want them to nominate somebody from their community... Anyone can nominate someone... we review it. And if we agree, we send an
invitation to that person to conduct the interview." Design approved by Sean the same day ("I love it. I absolutely love it. I approved.");
the full design, the questions and every decision are in `docs/proposals/nominate-someone.md`. Mocks: `/mocks/nominate/` (the
nomination) and `/mocks/nominate/interview.html` (the nominee's path: Overview, The Interview, Nominate Someone optional, You're a Member,
Set Up Your Account, then the members' Welcome Guide; `#/featured`). Built on the Explorer Guide, the template for new Guides (canon
`canon-template-gate` v6). Kai hosts in a different outfit on every page (`public/guides/nominate/kai-*.jpg`); her eight interview
questions are recorded and lip-synced (`vegan-media/media/kai/nominee-interview/q1-q8 -v1.mp3/.mp4`, stt checked). The welcome video's
script is approved once and names fill in per nominee (Sean: "approve the welcome video once").

**Step 1, built 2026-11-09**: `/nominate` (`nominate.html`, a copy of the approved mock; `guide-scripts/nominate.js`; indexed, in the
sitemap): Overview, Who (name, email, area from the Explorer survey's chapters `x_chapter`, what they do: Business owner, Content creator,
Works for a nonprofit, Activist, pick any; This is me), Why them (record up to 2:00 with the time left shown, speak with the site's
dictation mic, or write; comment.html's recorder), About you (filled in when signed in; may we say it was you), Send (the release, 18 or
over), Thank you. `?city=<chapter>` picks the area, `?source=hub|pulse|show|listing` records where it came from. Edge function
**`ve-nominations`** (verify_jwt off; public `chapters`, `upload`, `submit`; team `list`, `get`, `set`), table `ve_nominations`
(migration `20261109_nominations.sql`), recordings in the private `community-comments` bucket under `nominations/`. A nomination emails
contact@lesaruss.com ([TEST] names do not). **Depot > Nominations** (`/admin/depot/nominations`, Content; copied from Depot > Comments):
Waiting for review, Approved, Not now, All; search, area and sort; one nomination on its own page (`#n/<id>`) with the recording, the
email, how many other times they were nominated, the nominator (and whether we may name them), a team note, Approve (ready to invite) or
Not now. Approving sends nothing yet. **Live 2026-11-09** (Sean: "merge"; main 3b38054 and 43acf97): proven on vegansexplore.com at 1440 and 390 px (no sideways scroll, no script errors), a full submit with a browser recording proven on the preview against the live function, the team actions proven from the database, the Depot screen with mocked data (not yet under a real super admin sign-in). **The doors now open it**: the SoFlo Vegans Podcast's Nominate someone (`details.show_line.nominate_url`, read by `showLine` in `directory/listing.html`; the old `soflo-nominate` comment code is the fallback) and the Daily Pulse's Monday Who should we interview? (`ve_pulse_house`: `/nominate?city=<chapter>&source=pulse`), migration `20261109_nominate_links.sql`, applied through `ve-once-nominate-links` (now the 410 stub) because the connector held the write; the proof's [TEST] rows and recordings removed. **Kai speaks on every page, live 2026-11-09** (Sean: "lines are good, record them"): the Overview is her video (the section-video recipe, captions, `scripts/tour-video/sections/render-nominate.py`), Who, Why Them, About You and Send are lip-synced clips in that page's outfit (`vegan-media/media/kai/nominate/`, each line stt matched); the template's Play Kai button (`#dgPlay`, beside Talk to Kai; the phone card's button row), nothing on her picture; Play lets the next page play on its own, Pause stops it. Getting started is one paragraph under 250 characters (no inner scroll), and `/nominate?preview=1` walks every page with sample answers and sends nothing. **In the Color Block look, 2026-11-12** (Sean: "apply the new style for the website on this"): `/nominate` is page `nominate` in `/public/ve-look.js` (section Guides, pink) and wears the Welcome Guide's frame from `/public/ve-look.css` (the `/nominate` block, a copy of the `/passport` rules in the section's color: the pink header block with the stripe, the orange header button, ink-outlined cards with the section shadow, outlined pictures and rail, the pink-tint bubble); the page code took the Welcome Guide's two-across rows and the self-hosted font preload. Step 2 followed the same week (below); the featured kit is next.

**Step 2, built 2026-11-12** (Sean: "yes to both, approved, build step 2"; the outreach pause lifted for this one campaign, the invitation
email approved as drafted): **Approve in Depot > Nominations is the invite.** `ve-nominations` `set approved` makes a private token, Kai's
personal opening (the approved template with the nominee's and nominator's names, and the written why when there is no recording;
`kai/nominee-welcome/<id>-v1.mp3`, checked word for word with stt, `welcome_checked`; bracketed markers such as [TEST] are not read
aloud) and adds the nominee to the BrandDesk people campaign **`nominee-invitations`** (migration `20261112_nominee_invitations.sql`:
step 1 on approval, step 2 on day 4 only if they have not started; each nominee's own filled-in emails in `personal_emails`; sends
weekdays 9 to 5 Eastern through `campaignTick`; every link their own tracked `/go/` link). **The interview** is `/nominate/interview`
(`nominate/interview.html`, a copy of `/nominate`; `guide-scripts/nominee-interview.js`; noindex): Kai's welcome (her opening, the
nominator's own recording, then her closing clips), eight questions, each recorded, spoken or written (Q2 area and years plus a
recording, Q6 up to three favorite spots each with its own recording), Send (release, 18 or over), Nominate someone (optional, Skip),
You're a member, Set up your account (email and password or Google; Apple stays hidden until its Services ID exists), then the Welcome
Guide (`/passport?guide=welcome&from=nominee`). The link works by `?t=` or by the tracked click (`?vl=`). Answers are
`ve_nomination_answers` (migration `20261112_nominee_interview.sql`), recordings in `community-comments` under
`nominations/answers/<id>/`; the first saved answer stops the reminder. **Joining** is `ve_nomination_admit`: the interview counts as
the Explorer survey (survey door, Founding Member and referral through the existing triggers, the Explorer questions' 250 points paid
once under their own refs, the Explorer and Nominee badges). Depot > Nominations gained Invited, Interviewing and Members, Kai's opening
with its check, the interview link and every answer. **Proven 2026-11-12** against the live function (deploy sha256 matched): a [TEST]
nomination approved (opening checked true), the whole interview walked in a browser with real recordings, sent, account created, joined:
active, entry by survey, Founding Member, 250 points (joining twice paid once), both badges. A test address (`test-%`, `@example.com`)
is quarantined at signup by `classify_member_on_insert` and is not admitted, by design. An empty recording is caught on the page (record
again) instead of failing the upload. All proof rows and files removed through `ve-once-nominee-proof` (now the 410 stub). Not built
yet: the featured kit (email, share graphics, the drawn portrait).

**The note to the nominator, built 2026-11-12** (Sean: "yes, build the nominator note next"): Approve also adds the nominator to the
BrandDesk people campaign **`nominator-notes`** (migration `20261112_nominator_notes.sql`, one email): "We invited <name>", thanks, they
will hear why in your words (and, when every one of them was anonymous, that we did not say who), every nominee is considered, and their own
tracked link to nominate someone else. One person who nominated several gets one note naming all of them while it has not gone out
(`ve_nominations.nominator_note_member`). No note for a self-nomination, no nominator email, or the nominee's own address. Depot >
Nominations shows the note and its status. **Held as a draft** (status draft, email not locked): nothing sends until Sean approves the
wording; then the campaign goes active and the queued notes go out in the next window. Proven with two [TEST] nominees from one
nominator (one note naming both, nothing due to send), test rows and recordings removed.

## Where should we go next? (Sean, 2026-11-09, playbook `ve-chapter-rankings`)

"A column that has 10 slots... chapters that are in the works... members can go in there and vote for what's the next chapter that we should
open... suggest another location... It's more of a suggestion. It's not a guarantee." `/public/ve-next-chapters.js` (`VENextChapters.beside(listEl)`)
puts the board beside the chapter cards on `/communities` and the dashboard's Communities tab: three-fourths chapters, one-fourth board on desktop;
first on phones with the top 3 and **See all**. Top 10 numbered, then **Rising**; **Suggest another place** (members). Places are `ve_next_chapters`
rows (a new place is a row; `status` open, opened, hidden), Sean's 12 seeded: Oregon, Las Vegas, Phoenix, Houston, North Carolina, Austin, Dublin,
the Caribbean, New Zealand, Japan, Seattle, San Francisco. Votes `ve_next_chapter_votes`, once every 24 hours per member per place (like a chapter);
suggestions `ve_next_chapter_suggestions` (3 a day, emailed to contact@lesaruss.com, added by hand). `ve-votes` actions `next_list` (public),
`next_today`, `next_vote`, `next_suggest` (standing checked); v9 from a2b4b98 (sha256 06e16784 matched). Migration `20261109_next_chapters.sql`.
Proven live 2026-11-09 through the one-time `ve-once-next-proof` (now 410); test rows removed. **Art for every place, made 2026-11-09** (Sean: "create them so
that we're ready for when we do launch... one vertical, one horizontal, and... the square one from the vertical"; 54 Higgsfield credits, nano_banana_pro
with the South Florida banner as the style reference): `communities/next/<slug>/vertical.jpg` (1440 x 1920), `wide.jpg` (1920 x 1080), `square.jpg`
(1200 x 1200, cut from the vertical), `thumb.jpg` (176 px, shown on the board since 2026-11-09), full-size originals in `vegan-media/media/communities/next-<slug>/`; each place's paths in `ve_next_chapters.art`
(migration `20261109_next_chapters_art.sql`). The Wynn logo was taken off both Las Vegas pictures. Not built: Show me (a sample hub per place), the podcast listener places on each card. Mock `/mocks/next-chapters/`. **Depot > Next chapter suggestions** (`/admin/depot/next-chapters`, Ideas in the Go to menu, copied from Depot > Feedback; built 2026-11-09): New / Added / Set aside / All and search (`#list/<status>`), one suggestion per view (`#s/<id>`: who, their chapter, why, **Add to the board** with the name and line under it, which makes an open `ve_next_chapters` row with a slug from the name, or links to the place already on the board; **Set aside** needs a note; Back to New), and **The board** (`#board`: each place with its art and votes, Hide, Mark opened with the chapter it became, Back on the board). `ve-votes` v10 (from 4e3b141, sha256 3b116cb6 matched) actions `next_admin_list`, `next_admin_decide`, `next_admin_place_save`, super admins in good standing only. A New suggestion is an Inbox row (source `next_chapter`, migration `20261109_next_chapter_suggestions_inbox.sql`, which patches `ve_inbox_items` in place) until decided; the member's email still goes to contact@lesaruss.com. Proven live 23 of 23 through `ve-once-next-chapters-proof` (now 410; script `scripts/supabase-once/next-chapters-proof.ts`), test rows removed. **Podcast listeners on every card, live 2026-11-09** (playbook `ve-chapter-rankings`): each place shows its all-time downloads of our four shows from there and, when our episodes named it, "on N episodes" (`ve_place_mentions`); with equal votes more downloads ranks higher. `ve_next_chapters.listen_match` ({places: [{country, province?, cities?}], mentions: ["place" or "place|country"]}, a row per place; a new place needs one) says which Captivate places count; `branddesk-insights` v18 (from d14487a, sha256 bb32b626 matched) `next_places` (cron secret, admin token or super admin) reads Captivate range calls (one per show for every country, one per show for US and Ireland, about 12 a run, no paid calls) and writes `ve_next_chapters.listens`; cron `ve-next-places` 08:41 UTC daily; `ve_next_chapter_stats` returns downloads, listen_top, mentions (migration `20261109_next_chapters_listens.sql`). Palo Alto, Redwood City, Cupertino and San Jose are left out of San Francisco (data-center-heavy and not the city). The sample member dashboard now passes `next_list` through. Checked signed in at 1440 and 390 px beside the Directory card.

**Ranks, not numbers, and chapter insights (Sean, 2026-11-09)**: "I don't necessarily want to show the downloads on there. I just want these to be ranked based off of the algorithm." The board shows no downloads; `ve_next_chapter_stats` returns `traffic` (a rank by downloads, then mentions) in place of the numbers, and the board ranks votes, voters, then traffic. `/communities` sorts by **Traffic** too (`ve_chapter_stats.traffic`, a rank from `ve_chapter_traffic`: podcast downloads from the chapter over 365 days plus Google visitors over 90, written daily by `branddesk-insights` `chapter_traffic`, cron `ve-chapter-traffic` 08:51 UTC; migration `20261109_chapter_traffic_ranks.sql`). Ashburn and Sterling are counted out of Virginia (data centers, `DC_TOWNS`). On desktop the board ends at the bottom of the last chapter card and scrolls inside. Super admins get **Insights** on every chapter card and every board row, opening **BrandDesk > Vegans Explore > Insights > Chapters** for that place (HQ `?place=chapter:<slug>` or `next:<slug>`; `Place` in `components/branddesk/InsightsPlatform.tsx`): Podcasts (each show with its thumbnail, downloads from there against the period before, its share, and the cities), Web (Google visitors from there), Social (Instagram and Facebook followers there today from Metricool `/stats/city`; no history, no places for TikTok or YouTube), News (the chapter's `ve_news_leads` and our episodes that named it). `branddesk-insights` `places` and `place` (super admins; v21). The old Run a Community block at the foot of `/communities` is gone. Handoff `docs/handoff/2026-11-09-ve-chapter-rankings-chapter-insights.md`. **Later the same day, all on HQ main and live**: the place view gained **YouTube** (Sean connected the Vegans Explore channel read only through HQ `/api/branddesk/google/connect?kind=youtube`, the same Google app as the calendar; refresh token `YOUTUBE_ANALYTICS_REFRESH_TOKEN`; the YouTube Data API and YouTube Analytics API had to be enabled on project 554053879127). YouTube hides places with few views in a short period, so the tab shows the period, the whole state and all time (South Florida all time: 69 views, Miami; Florida 1,621; channel 63,903). **News for coming-next places** is a Google News search on the place's names (`googleNews`, kept 6 hours, headlines about Vegan, plant-based or vegetarian food only, headlines naming the place first, the rest tagged "named in the story"; Insights only, never the Pulse). The Insights head puts the title and line on the left and the period on the right (the dropdown as wide as its dates), and the Insights sections are one **Section** dropdown (Sean: "make the Insights buttons a dropdown"). `branddesk-insights` v26 (sha256 307dfad4, equals main).

## Communities are cards, and a chapter is its own page (Sean, 2026-11-01)

"The community should be set up like they're in a directory listing... you can vote for them, you could save them. You see the little
icon on the left-hand side of the city... the landing page for the community is weak. It takes you to the pulse... When I click on
community, it looked like it was put into a frame. I don't like that. And then when I go backwards, it sends me back to the directory."

- **The cards**: `/communities` and the dashboard's Communities tab draw every chapter with `/public/ve-chapters.js`
  (`VEChapters.mount(el, opts)`): the chapter's art as a rounded square on the left, its name, where it is, its places, events coming up
  and members, the votes over **Votes**, and **Save**; a search and Sort by (Most votes, Most places, A to Z; `?q=` and `?sort=` on
  `/communities`). The whole card opens `/communities/<slug>`. **Vote** is once every 24 hours per member (`ve_chapter_votes`, migration
  `20261101_chapter_votes.sql`; `ve-votes` `chapter_vote`, `chapter_today`, and the public `chapter_stats` from `ve_chapter_stats()`).
  **Save is joining the chapter** (`ve-auth` `join_community` / `leave_community`), so a saved chapter is one of the member's communities.
  Signed out, Vote and Save open the Passport window (`VEVotes`). The old flip cards are gone.
- **Never framed**: from the dashboard (a card, the Communities banner, or View community in any framed page, `VEOpenCommunity`) a
  chapter opens as its own page in the same window (`openCommunity` in center-console, which still makes it the dashboard's city), so Back
  returns to the dashboard and the hub's own Dashboard button is the way in. The dashboard's link catcher leaves `/communities/*` alone.
- **The hub opens on Overview** (`?tab=` empty; `#tab-overview` in `communities/hub.html`, `renderOverview`): Welcome to Vegan <city>,
  its own card (vote and save, `VEChapters.mount` with `only`, `bar: false`, `here: true`), four numbers (places, events coming up,
  members, community votes; each opens its section or votes), Explore <city> (a tile into the Directory, Events, Daily Pulse, Community
  Board, Bounties and Opportunities), and Most voted in <city> (the top six 100% Vegan places with votes, the Directory's card). The Daily
  Pulse is `?tab=news`, second in In this community. Proven live 2026-11-01 on iPhone and desktop (signed out: cards, search, the
  Passport window on Vote, a card into D.C., the Overview, a tile into Events and Back) and the vote path as the Logan test account
  through the one-time `ve-once-chapter-proof`, now the 410 stub (a bad chapter refused, a vote counted, a second refused with its time,
  the vote then removed). `ve-votes` deployed from commit 2f41877 (source sha256 matched).

## City hubs: one page for every city (Sean, 2026-10-05)

"South Florida is the prototype." Every city hub is one file, `/communities/hub.html`, served at
`/communities/<slug>` by a rewrite in `vercel.json` (the eight per-city copies drifted apart and were
removed). A city's details (title, regions, hero art, the "across ___" area, event cities, billboard
slot ids, South Florida's counties and pinned event) live in `VE_HUBS[].page` in `/public/ve-hubs.js`;
its Directory rule is `VE_HUBS[].match`. A new city is a `VE_HUBS` entry, its art in
`/communities/<slug>/`, its slug in the rewrite, and its three `ad_placements` rows. Change a hub in
`hub.html` once and every city gets it.

- **Thirteen chapters** (Sean, 2026-10-27: "separate the DMV to be the individual major hubs... set up just like Philadelphia... and
  then we could do North Florida... closing out the state of Florida"; then "We can keep Delaware... And Virginia, of course, West
  Virginia"): South Florida, Central Florida, **North Florida**, Atlanta, **Washington, D.C.**, **Delaware**, **Maryland**, **Virginia**,
  **West Virginia**, New York, Philadelphia, Los Angeles, London. Delaware and West Virginia came the same day
  (`20261027_chapters_delaware_west_virginia.sql`, the same parts as Maryland's; in `ve-auth`, Wilmington, Dover, Newark, Charleston and
  Huntington match only with the state, since other states have them too). The DMV is gone: `/communities/dmv`
  forwards to D.C., and migration `20261027_chapters_split_dmv_north_florida.sql` moved its board, feeds, sources, roles, outreach list
  and ad slots to D.C., gave each new chapter its pinned board guides, local Daily Pulse, outreach list (off) and three Humble Cabbage
  slots, and widened `members_home_community_check` and `member_communities_community_slug_check`. Florida is covered city by city:
  South Florida adds the Treasure Coast and the Keys, Central Florida Greater Orlando, Tampa Bay, the Space Coast, Volusia and the
  southwest Gulf, North Florida Jacksonville to the Panhandle (`SF`, `CF`, `NF` in `ve-hubs.js`; `ve-claims` `HUBS` and
  `ve_outreach_cities` hold the same lists). A chapter's art is `VE_HUBS[].page.banner` (the banner, the guide and the listing header
  read it): Maryland's is Baltimore's Inner Harbor (`vegan-media/media/communities/maryland/banner.jpg`); North Florida (Jacksonville and
  the Main Street Bridge), Virginia (Richmond and the James River rapids), West Virginia (the Capitol in Charleston) and Delaware
  (the Wilmington riverfront) got their own on 2026-10-28 (`communities/<slug>/banner.jpg`, made in Higgsfield in the Maryland
  banner's style; Virginia and Delaware were made from words alone, since with the Maryland picture as a reference they came back
  as Baltimore's skyline (a hub's header crops to the skyline, so check that part against the reference); the dashboards' `VE_CITY_BANNER` maps in `center-console.html` and `cm-legacy.html` hold the same paths). VE_HUBS[].state groups chapters by
  state. The chapter list also lives in `ve-auth` (`VALID_COMMUNITIES`, names, city aliases), `ve-board`, `ve-bounties`, `ve-claims`,
  `ve-hunt`, `ve-invites`, `ve-media-library`, `ve-news-desk`, `ve-tours` and the name maps in the dashboard, join, lead and Depot
  pages; the dashboard's city rules are built from VE_HUBS. A new chapter changes all of them. Large functions deploy from a commit
  through `ve-function-deploy` (admin token, `{slug, sha}`, returns the source sha256).

- **The banner is the shared one** (Sean, 2026-10-27: "the same look and feel as everywhere else"): `VECityBanner` (`hubBanner`),
  **Vegan Community** over the city, its picker (another city opens its hub on the same section; All cities opens `/communities`,
  or `/directory` from the Directory section), the rotating cities and the Preview / Member badge (`meta`), **Get your Passport**
  (`/passport?community=<slug>#/join`; **Dashboard** signed in) and Page tour (open only). Folded it is the Directory's bar: the
  picker, Get your Passport and Expand. The old black bar is gone.
- **No Section menu** (Sean, 2026-10-27: "the navigation's at the top"): the dropdown under the banner is gone. Sections still
  open by `?tab=` (news, events, directory, opportunities, bounties, board, members, rewards) and the hub's Page tour walks them.
  The address bar carries the section (`?tab=`). Newsletter is gone (the Daily Pulse does that job);
  Community Partners is hidden but kept in the page; Chat was removed (it showed sample threads).
- **The hub's Events** (`VEHubNews.renderEvents(listId, hubSlug)` in `hub-news.js`) keep an event by the calendar's own chapter
  rule, `VECityBanner.matches` (Sean, 2026-11-01: "fix the hub events filter"): it had read the 200 oldest events and matched exact
  city names, so once the calendar held more past events than that nothing upcoming was left (South Florida showed none), and the
  232 events with no place showed on every hub. Now the next 1,000 coming up (an event still running counts) and the last 1,000,
  none without a city. **An online event with no city** (`event_type` virtual) is in its host group's chapters (`listings.communities`
  of `host_listing_id`, `all` for every chapter), on the hubs and on `/events` alike (`VECityBanner.matches` takes `online` and `hubs`).
  The 232 events with no city were filled the same day from their own sources (migration `20261101_ve_event_place_fill.sql`, every
  change logged with what it replaced): 99 got a city, 129 are online, 4 have no published place. Checked against the calendar's data
  after: South Florida 6 upcoming and 20 past, Atlanta 62 and 142, New York 25 and 144, D.C. 4 and 41, London 13 and 104, Los Angeles
  2 and 17, Philadelphia 30 and 44.
- The Board and Bounties open inside the hub, under the community, in a frame
  (`/board?community=<slug>&hub=1`, `/bounties?...&hub=1`, which hide their own city picker). The
  framed page sizes the frame; `nav.js` treats a hub parent like the dashboard window.
- The billboard sits beside every section except Members, Bounties and the Board (full width).
  Opportunities are two across beside it and list every open role: the city's and the ones open in
  every city (members through ve-rewards with their application status, anyone else by public read).
- Members shows real members ranked by points (the leaderboard) to members; signed out, a plain
  outline behind the Passport gate. Never sample people.
