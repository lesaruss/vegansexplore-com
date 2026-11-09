# vegansexplore-com — CLAUDE Working Rules

## Stack
Static HTML site. No build pipeline. Vercel serves the repo root directly
(`outputDirectory: "."`). All pages are `.html` files. Styling is inline CSS
in `<style>` blocks. No separate CSS files. No framework.

## Sessions and context (LOCKED by Sean 2026-11-09, canon `canon-session-procedure`)

This file loads on every message. Keep it to rules and pointers; never append session history here (it goes to that area's file in `docs/history/`
or the playbook). One chat is one playbook task. When a chat compacts on the same task, keep working: do not wrap and restart. Start a new
chat only when switching playbooks, after two compactions, or when the summary has clearly lost detail. Wrap when the work is finished
(`canon-wrap-up-standard` v3), not at a context percentage. The new-chat prompt is lean: playbook slug and task, checkpoint id, the SQL
to read it, the first task.

**Logan steers the degradation check** (Sean: "if you're leaving it on me, it won't happen"). When Sean complains about performance,
missing or wrong information, forgotten rules or repeated mistakes, first check whether context is the cause (a `docs/history` file not
read, a compaction that dropped it, canon not loaded), say so in the reply, and log the incident in playbook `signal-context-efficiency`.
Two incidents in a week, or Sean saying quality is worse, triggers the rollback written there (restore CLAUDE.md from 88f460e).

### Compact Instructions

When summarizing this conversation, always keep: the playbook slug and task; the one next action; every branch with unmerged work and its
last commit; every decision, approval or rejection Sean gave this session, in his words where possible; anything built but not yet proven
live; and what waits on Sean, with its link.

## The template gate (Sean, 2026-11-02): never build from a blank file

"It's like you just made something up. Not following any templates, not using any previous examples... We need a system. That's why
we have systems, so we don't waste time and usage." Canon `canon-template-gate` (always loaded), error registry
`UI-BUILT-FROM-BLANK-NOT-TEMPLATE`. Before writing any new page or view, and before redoing one:

1. **Name its parent** from this map and copy that file; change only the content.
   | Building | Copy from |
   |---|---|
   | A Guide, a sampler, anything a Guide walks people through | `guides/vegan-dairy-guide.html` (`docs/guides/BUILD-A-GUIDE.md`); the whole cast: `passport.html?guide=welcome` |
   | A walkthrough, pitch, mock or concept page | `/partners` with `/public/ve-guided.js` |
   | A working tool, queue or console | `admin/depot/social.html` and the Depot pages |
   | A sign-up or a form of more than one section | `claim.html` (`?step=`) |
   | A listing or profile | `directory/listing.html` |
   | A browse page with a banner | `/public/ve-city-banner.js`, as the Directory and Events use it |
   | A search box or a results page | `/public/ve-search.js` and `search.html` (universal search, below) |
   | An email | `email-send`, as `ve-nurture` and `ve-people-outreach` call it |
   | A city restaurant carousel for social | Canva `DAHaJ8TQI0I` "5 Vegan Restaurants to Try in Philadelphia" in Vegans Explore > Directory (canon `canon-ve-city-carousel`) |
2. **Nothing fits?** Stop and bring Sean a recommendation (which parent, or a new template) before building.
3. **Before it ships**, screenshot the new page beside its parent at 1440 and 390 px. If they do not read as the same family, it does
   not ship. A new template joins this table and the canon.

First case: `/guides/taste` had been written from a blank file twice; on 2026-11-02 it was rebuilt on the Welcome Guide (see Earn your
Passport, part 3).

## Standing rules (short form; the full record of each is in its history file)

**Writing.** Never use em-dashes anywhere. "Vegan" is always capitalized. No chapter or city counts in copy, lines, recordings or videos ("city by city", "every chapter"; a live count from data is fine). Text, a logo or a card never covers a face; a logo over a picture sits on a solid plate. A business that is not Vegan offers "plant-based (Pre-Vegan) options", never "Vegan options", in our copy. Never write "lives here" in a recorded line. History: `docs/history/interface.md`, `guides-standards.md`.

**Nav and footer on every page.** `<script src="/public/nav.js"></script>` first in `<body>` (or inside `.page-frame`), `<script src="/public/footer.js"></script>` just before `</body>`. Never hand-write `ve-nav` or `ve-footer` markup; change `nav.js` / `footer.js` only. Exceptions (a new one goes on the list first): redirect stubs, partner pitch decks (`partners/community-partner.html`, `partners/pitches/`), `app/index.html`, `ads/`, `business/podcast-frame.html`, `offline.html`, `business/site.html` and `branddesk-sites/`. Full list and the new-page template: `docs/history/interface.md`.

**Card summaries clamp to two rows** (`display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;`) on every class that renders a database summary; detail views never clamp. Class list: `docs/history/interface.md`.

**Search and share previews are built in**, server-side: real `<title>` ("Name — Vegans Explore"), meta description, canonical, `og:*` (fallback `/public/og-default.jpg`), `twitter:card`. Database pages get a server function (`api/listing.js`, `api/event.js`, `api/pulse-article.js`); a page to be found goes in `api/sitemap.js`. Samples, Depot and account pages are `noindex`.

**Every view is a link.** A view keeps its state in the address (`?tab= &sub= &city= &q=`, `#/...`) so Share (`/public/ve-share.js`) can send it. Use the shared components, never a copy: `ve-city-banner.js`, `ve-region-directory.js` (the Directory card everywhere), `ve-events.js`, `ve-episodes.js`, `ve-guided.js`, `ve-logo-editor.js`, `ve-video.js`, `ve-explorer-card.js`.

**Pictures.** Pictures from other sites go through `/_vercel/image?url=&w=&q=75` (hosts in `vercel.json` `images`). Repo photos are JPEG, at most 1920 px wide, about 80 quality; banners under about 500 KB. Logos are always copied into `vegan-media` storage, never hot-linked. Generic pictures are our illustration style, never photorealistic; real photos only for real places and people. Our Guides are always drawn, never photographs, and wear the Vegans Explore mark (store clothes; colors and layers may vary).

**Guides.** Every Guide is copied from a parent (template gate above) and walked by its own Guide in that Guide's roster-profile voice (`gfs_artist_bible` voice module; never pick a voice without Sean). Logan writes a line, Sean approves, then it is recorded with el-media tts and checked word for word with `stt`; a line's text matches its recording, a change is a new `-vN`. Nothing plays until pressed. On phones every Guide is the locked mobile card (`/public/ve-guide-corner.js`). Guide voice ids: Liz `IUMUPi350HfIhyzUBJB3`, Maya `sM8RysETdBj1LIqLd9tl`, Dani `b5RPB35vTODb3BEmR3Fc`, Nori `rr9oBze1kuNJYeAV7xos`, River `btaSeNTVh1pGx4pjFzub`, Theo `aFyw0oiXW7dzKF4o7woX`, Kai `cgSgspJ2msm6clMCkdW9`, V `Nhs7eitvQWFTQBsf0yiT`. History: `docs/history/guides-standards.md`.

**Membership** (canon `canon-ve-door-guides` v12). Membership is free; a survey is the only way in (the Explorer survey or a business Guide's survey, 250 points). The $11 is an optional give; topic Guides are $11 or 1,100 points; claiming a listing is free for members; the $111 Partner plan stays. Founding Member closes midnight Eastern 2027-01-01; no comps. Never promise anything not built (say Coming). History: `docs/history/membership.md`.

**Email and outreach.** Every email to people goes through a BrandDesk Outreach campaign in HQ, never Depot > Outreach (removed) and never Sean's name for team emails. Nothing sends until Sean approves. Every link we send is a tracked `/go/` link. Emails through `email-send` must contain `{{unsubscribe_url}}` and `{{postal_address}}`. Depot pages that moved to BrandDesk are never used or restored. History: `docs/history/outreach.md`.

**Claude calls.** On 5.x models give `max_tokens` 16000 and treat any `stop_reason` but `end_turn` as an error; never save half an answer.

**Edge functions.** Before deploying a function from `main`, check that no unmerged branch deployed a newer version (diff live source against the file), and check `ve-outreach` still has `campaignTick`. Large functions deploy through `ve-function-deploy` `{slug, sha}`; confirm the returned source sha256. Type-check (`tsc --noEmit`) before deploying.

**Google spend** (canon `canon-ve-spend-budget`): a hard $50 a month at list price. A one-time scan is approved with `ve_google_approve('once:<task>', searches, details, note)` and runs only if it fits; report weekly. History: `docs/history/ops.md`.

**Proof.** Confirm every deploy or fix live, signed in where it matters, at 1440 and 390 px beside its parent. Test rows are named [TEST] and removed after. A one-time function for a held write or a proof goes back to the 410 stub after.

## Where everything is (read the history file before working on its area)

Each file holds the full, dated record of decisions, tables, functions and proofs for its area, moved verbatim from this file on 2026-11-09.

| File | Covers |
|---|---|
| `docs/history/directory.md` | Explore and the Directory (vetting, logos, chapters, locations, menus, check-ins, review), Directory navigation, Local Food and Products, the Guide tab on listings, signature dishes, finding new places, grocery stores and brand pages, the business dashboard, social links, what connects to a listing, comment requests, campaigns on a listing |
| `docs/history/people.md` | People directory, People pages and their podcasts |
| `docs/history/podcast-media.md` | Media, podcast episodes on listings, content index, podcast analytics, episode pages, city shows |
| `docs/history/social.md` | Depot > Social studio, the Social tab on listings |
| `docs/history/events.md` | Events and the city banner, the Vegan Events Guide, the event host path |
| `docs/history/daily-pulse.md` | The Daily Pulse, the Community Board, featured items, autopilot |
| `docs/history/communities.md` | City hubs, chapter cards, Where should we go next |
| `docs/history/search.md` | Universal search, the search question queue |
| `docs/history/guides-standards.md` | Guides are mini apps, Overview tour standard, Guide openings, a Guide on every page, Your Guide, Guide answers, Guide voices |
| `docs/history/guides-restaurant.md` | The restaurant audit, the Vegan Restaurant Guide, door Guides, sourcing |
| `docs/history/guides-venues.md` | Stadium & Arena, Airport, Supermarket and Theme Park Guides |
| `docs/history/guides-holiday.md` | The Holiday Guide, ThanksLiving, Give back |
| `docs/history/guides-topic.md` | The Nutrition Guide |
| `docs/history/certification.md` | Pre-Vegan Certification, all parts |
| `docs/history/membership.md` | Registration, points and levels, Earn your Passport, three doors, the Explorer path and badges, the survey door, the Welcome Guide, invites, referrals, abuse watch, the homepage |
| `docs/history/partner-programs.md` | Ambassadors, Founding Member invitations, Nonprofit and Group Partners, pathways, the talent shop, member profiles and partner windows |
| `docs/history/branddesk.md` | BrandDesk (production wing and managed marketing), the sample business and demo showroom, Brooke Sellers, client billing |
| `docs/history/outreach.md` | Business outreach, Depot > Outreach (removed), moving to BrandDesk, people campaigns, orientation, media drafts |
| `docs/history/depot-ideas-feedback.md` | The Depot home, Ideas, Blueprint, feedback, Talk to Liz, playbooks index, analytics, Signal |
| `docs/history/dashboard.md` | Dashboard versions, revenue, money-in emails, Sign In As |
| `docs/history/lesaruss-ai.md` | One framework with LESARUSS.ai, Continue with LESARUSS |
| `docs/history/interface.md` | Nav and footer, two-row cap, the header, every view is a link, footer and policies, search previews, pictures, no chapter counts, hero legibility |
| `docs/history/ads.md` | The ad rail and house banners |
| `docs/history/app.md` | The Vegans Explore app |
| `docs/history/ops.md` | Google costs, domains |

## Full width (LOCKED 2026-10-04)

Sean, 2026-10-04: "everything full width. Just remember everything full width. We don't do fixed
width." Page containers never get a fixed `max-width` (`main{max-width:none;margin:0;padding:44px
40px 80px}`, 16px side padding on phones). Lists and cards fill the width with a grid
(`repeat(auto-fill,minmax(min(360px,100%),1fr))`) instead of one narrow column. When something
would read badly that wide (a long text column, a form), give the page the ad rail (see Ad rail:
three-fourths content, one-fourth ads) rather than narrowing it. A line of body copy can keep its
own reading width (`.sub{max-width:860px}`); the page around it cannot.

## Interface defaults (Sean, 2026-10-04)

Sean: "I feel like I keep asking for the same thing over." The full checklist is canon
`canon-sean-interface-defaults` (always loaded, every brand). Build these in on the first pass:

- One thing per view: a list, then one item on its own, with breadcrumbs back (List > Item > Sub-item).
  Edit, New and sub-items get their own view. The address bar carries the view so back works.
  No page that stacks every item, its editor and its children.
- Every row in a list has the same fields and the same single action button in the same place. Status
  is a colored tag in plain words (Live, Waiting for approval, Not live yet), never an action word.
- Full width (above). Cards four across, most urgent first. Short lists cap and scroll inside the box.
  Summaries clamp to two rows. Queues filter, sort and search. New is a button to its own view.
- **No window and no bottom bar** (Sean, 2026-11-01: "I don't like having everything wrapped together... no more universal frame,
  no more universal selector, just that apps button"). The dashboard is a plain page under a sticky top nav (no backdrop, title bar
  or traffic lights; the page scrolls), a listing opened from it is its own `/directory/<slug>` page on every screen, and HQ's
  `universal-bar.js` draws no bottom row, only the **Apps** launcher: Vegans Explore, GeekFon Society and Sean A. Russell, the same
  three everywhere (`LAUNCHER` there). Apps is in the dashboard's bar and, signed in, in `nav.js` on every page (it loads HQ's file
  on the first tap). The city hubs' section headers carry an **In this community** dropdown of the hub's sections (one-fourth,
  beside the title and line; `placePick` in `communities/hub.html`).
- Member features live in the dashboard: `/dashboard/<feature>` opens
  the page under "Dashboard / Feature". Opened on its own while signed in, the page moves into the
  dashboard; signed out, it shows a sign-in gate and none of the content, and the server refuses the
  data. Example: `/bounties` -> `/dashboard/bounties` (`openBounties` in center-console).
- Example: Depot > Bounties (`/admin/depot/bounties`): Campaigns > campaign > job, with `#new`,
  `#campaign/<id>/edit`, `#review` and `#strikes` as their own views.
- Forms with more than one section are paginated (Sean, 2026-10-09, "I've said this multiple times"; canon rule 14, error
  registry `UI-FORM-LONG-SCROLL-NOT-PAGINATED`): one step per view, the step names on top, Back / Step N of M / Next at the
  bottom, Next checks the step, the last step holds the choice and the submit, `?step=` in the address bar. Example: `/claim`.
- Dropdowns never show the browser's arrow (Sean, 2026-10-09, "always too close to the edge"; canon rule 15, error registry
  `UI-SELECT-ARROW-TOO-CLOSE-TO-EDGE`): `appearance:none`, an SVG chevron at `background-position:right 16px center`,
  `padding-right` 44px or more. Copy the `select` rule in `claim.html`.
- Buttons, tabs and inputs use a 6px corner radius, not pills (canon rule 13, Sean 2026-10-09).
- **Speak instead of typing on every field** (Sean, 2026-10-31: "make sure we have the record the dictation feature on all things
  where people are going to type in information"). `/public/ve-dictate.js`, loaded by `nav.js` on every page and by the dashboard
  itself: in any textarea or text field, a small mic floats at the field's right edge while it has focus (no page's layout changes);
  tapped, the browser's own speech recognition writes what is said at the cursor until Stop, Escape or silence (the native value setter
  and an input event, so every page's own handlers see it). Nothing is recorded by us. Left out: email, password, number, phone, web
  address and date fields, fields under 12 characters, autocomplete or inputmode for email, phone, codes or cards, a placeholder
  starting https:// or @, read-only and disabled fields, and anything marked `data-dictate="off"` (the Ambassadors, Founding Members
  and Group Partners consoles keep their own Speak buttons that way). No mic where the browser has no speech recognition (Firefox). A
  new form needs nothing: it gets the mic.

## Guided view for mocks and walkthroughs (LOCKED 2026-10-04)

Sean: "I say this every time... I don't like the scroll... put it in that view so we're
navigating through and seeing everything." Canon `canon-sean-interface-defaults` rule 0.

Any mock, demo, pitch walkthrough, illustrative report or concept page is built as the guided
view on the first pass, never a long scroll: one full-height slide at a time on a **clean white stage** (Sean, 2026-11-07:
"Why is it a green background? You should know me by now. I like the clean white background look"; `<main class="vg-stage vg-light">`,
the dark stage only for pages already built on it: /partners and the pitch decks),
Back / "N of M" / Next at the bottom, nothing to scroll on desktop (nav, stage and footer share
one screen), every slide fitting at 1440x900 and 1366x768, and on phones the slide stacks with
the controls after it. The format is the `/partners` page; the shared shell is
`/public/ve-guided.js` (see its header for the markup). Wrap the page in
`<div class="page-frame">`, put slides in `<main class="vg-stage">` as
`<section class="vg-slide" id="..." data-title="...">`, and load the script after the footer.
Different audiences branch from a `data-vg-choose` slide into `data-path` slides. Example:
`/campaign-engine`, `/campaign-engine/fieldhouse-protein/report` and `/dashboard`. Working tools and data pages
(queues, lists, forms) are not mocks and follow Interface defaults.

## Wrap up (Sean, 2026-11-03, canon `canon-wrap-up-standard`)

"When we leave this room, I don't want anything on the floor." On Sean's cue ("wrap up", when the work is finished, not at a context percentage; v3) Logan sweeps the session into the
playbook (`playbook_records`, the brand's slug, one decision row per topic), canon (`knowledge_records`), the repo (CLAUDE.md, a migration file for
every DB change, `docs/handoff/<date>-<topic>.md`, pushed to main), a `brief_checkpoints` row (handed_off) and a `stream_events` row; checks each
landed; then gives Sean one self-contained paste prompt for a new chat (no "continue" needed, no skills needed). Never call it done before the check.

## Tracked links (Sean, 2026-10-04)

Every link we send for a campaign (a one-on-one message, an email, a post, a flyer) is a tracked
link made in Depot > Links (`/admin/depot/links`): `vegansexplore.com/go/<code>`, with its campaign
(`initiative_slug`) and tags. Make one personal link per person for one-on-one messages, so the click
names them. A real click becomes initiative interest (`ve_initiative_interest`, `action_type`
`link_click`, with the tags), shown on `/dashboard/leads`, where a campaign and tag can be filtered
and exported for the next announcement or offer. How it works: `api/go.js` (rewrite in
`vercel.json`) calls the `ve-links` edge function, which logs the click (link previews and
scanners are logged as bots and never count) and redirects with `?vl=<click id>`; `nav.js` credits
that click to the visitor's account once they are signed in (30 days). Email-system clicks on our
links are synced every 15 minutes (`ve-links-email-sync` cron) and named by recipient. Never paste a
bare campaign URL into outreach.

## Guide art: mid shot in squares, full body only at 9:16 (Sean, 2026-10-05)

"I don't want to see a full body shot in a square image. The long shot should only be used when
we're doing more of a vertical nine by sixteen image." Every Guide has two pictures in one map,
`VE_GUIDE_ART` in `/public/footer.js`: `square`, a mid shot (head to waist) for every square or
near-square spot (the dock icon, avatars, the Guide picker, tiles, Choose Your Guide, phones), and
`tall`, a 9:16 full body for true 9:16 spots only (none on the site today: the survey card switched to
the mid shot filling the card, words under it, on 2026-10-05, after Sean found the full body "slapped on"). Ask for
them with `VEGuideArt(slug, 'square'|'tall')` or `VEGuideImage(shape)` for the member's own Guide;
never point a page at a Guide file directly. Square spots use `background-size:cover` (or
`object-fit:cover`), never `contain`. The Guides wear the Vegans Explore Tee (from 2026-10-05) and
are drawn in our illustration style; new art is made in Higgsfield from the Guide's current picture
and a tee reference, both shapes for each Guide. Dani uses a manual wheelchair and is always drawn seated in it
(say so in every prompt; a reference picture alone is not enough). The square mid shots follow Liz's:
a warm wave, head to waist, white background. Pascal (the Cultural Bridge) is in the map too, though
not in the member Guide picker.

## Guide scenes: the locked image recipe (Sean, 2026-11-08)

Sean on the Welcome Guide tour's Liz scenes ("36 is fire... lock that in for the styles... it might have drifted in the last couple of weeks"):
every new Guide scene uses this recipe.
- **Model**: request `nano_banana_pro` in Higgsfield. The jobs come back labeled `nano_banana_2`; that is the run Sean approved. Aspect 4:5 for
  vertical video and scene cards (1856 x 2304 out), saved at 1080 x 1350 JPEG quality about 84.
- **Two references**: the Guide's own picture first (Liz: Higgsfield media `85023ca7-491a-4d75-ac6d-f99b72245ed8`), then the style scene
  (the Theo store scene, media `6c80cc2c-765e-4739-a93b-b9643ce543b8`). For a group, the first reference is the group shot Sean approved
  (frame 10, `vegan-media/media/tours/welcome-guide/v45/b10-market-walk.jpg`).
- **Prompt shape**: "<Guide>, the same character as the first reference (same face, hair, skin tone), drawn in the illustrated style of the second
  reference scene, mid shot, <the scene>. She wears <store clothes, the Vegans Explore suitcase mark clearly visible>. Hands fully drawn. No other
  logos, no readable words." For groups add: realistic adult proportions, about seven and a half heads tall, never short, squat or chibi, everyone
  head to shoes in frame (the old ensemble reference made the Guides look short).
- **Never stretch or outpaint a character scene** to change its shape; draw it new in the target shape. Outpainting is only for city art.
- Liz's pink Vegans Explore tee is a favorite: use it often.

## Show the site with our demos, stamped Sample (Sean, 2026-11-08)

"Anytime you want to do an illustration of our site and show what it can do, maybe we intentionally use our demos so they can see something
that doesn't look half-baked... put like a stamp on there that says sample... so that we're not pretending it's a real listing." When a video,
Guide picture, tour shot, pitch or social graphic shows what the site does, capture the demos, never a live page that is empty or thin: the
sample business Green Leaf Kitchen (`/business/sample`, its dashboard, brand kit, site and shot list), the sample group (`/groups/sample`), the
sample Gig Board (`/gigs/sample`, Kai Monroe) and the sample pitch (`/business/pitch?c=sample`). Every demo shot carries a visible **Sample**
stamp (a corner tag on the frame), never cropped out, so no demo reads as a real listing or a real result. A real business appears only as
itself, with what it really has. First: the Holiday Guide's Holiday Menus video (`theo-menus-v3`) shows Green Leaf Kitchen's holiday menu,
stamped Sample, instead of waiting for real menus.

## Video pace: a new shot every 3 seconds (Sean, 2026-11-08, canon `canon-video-shot-pace`)

"People's attention spans are way too short to be sitting there watching a page scroll choppily for 6 seconds." In every narrated video we
make (tours, Guide and page videos, social, ads, the podcast's video), the shot changes about every 3 seconds (never more than about 3.5), each
shot a still with a slow, smooth zoom or gentle pan, never a scrolling page. Capture pages as viewport-sized stills, cut on the words with stt
timings, render the zoom smoothly (no stair-stepping), and send Sean a short sample before the full render.

## Time is Sean's: Eastern (Sean, 2026-11-01)

"Whatever time you have, it should be in sync with mine, so there's no confusion." Every time said to Sean is Eastern (America/New_York,
EST or EDT, minding the November and March clock changes). The build session's clock is UTC: check `TZ=America/New_York date` before
saying anything is due, late or has passed. On 2026-11-01 Logan called the 7 AM Eastern episode slot missed at 5:38 AM Eastern.

**The podcast's pre-roll is the network tag** (Sean, 2026-11-01): the default pre-roll on the Captivate show (the Vegans Explore
Podcast) stays on for every episode.

## Image conventions

- Mobile hero images: stored in the same folder as the page's desktop banner.
  Named `ve-[page]-mobile.png`.
- Desktop hero images: referenced in the page's `.hero` CSS via `background-image`.

## Repo structure

```
/                     root — Vercel serves from here
/public/nav.js        global nav (edit here to change nav site-wide)
/public/footer.js     global footer (edit here to change footer site-wide)
/public/events/       homepage + events hero images
/public/founder/      founder section images
/public/guides/       guides section images
/public/partner/      partner page images
/index.html           homepage
/partner.html         partner page
/passport.html        passport page
/directory/           directory section
/communities/         community pages
/guides/              guide pages
/news/                news articles
/passport/            passport sub-pages
```

## Database writes the connector holds (Sean, 2026-10-25)

"We've been through this before, and you did something that allowed it to work... build into our instructions so we do
it moving forward." Canon `ops-supabase-write-once-function`, error registry `SUPABASE-MCP-APPROVAL-HOLD-USE-ONCE-FUNCTION`.
When the Supabase connector's `execute_sql` or `apply_migration` holds a write for an approval box that never shows (it
times out at 60 s, "the server asked the user a question"), do not retry it and do not hand Sean SQL to paste. Run it through
a one-time edge function instead: copy `scripts/supabase-once/once.template.ts`, put the SQL in named steps (each one safe to
run twice), give it a fresh random key kept only in the session scratchpad, deploy it as `ve-once-<task>` with verify_jwt
off, run each step with `curl -X POST .../functions/v1/ve-once-<task>?step=<name> -H "x-run-key: <key>"`, check the result
with a plain SELECT (reads and deploys never prompt), then redeploy it as the 410 stub. The SQL still goes in a migration
file in the repo. A step runs in one transaction, so a failed step changes nothing.

## pg_net stalls (2026-10-28)

Every cron that calls an edge function, and `ve-function-deploy` called from SQL, goes through pg_net's one worker. On 2026-10-28
it sat on one batch for 12 minutes (`net.http_request_queue` growing, `max(id)` in `net._http_response` not moving, the worker's
`state_change` in `pg_stat_activity` old). `net.worker_restart()` did not free it; `pg_terminate_backend` on the `pg_net%` worker
did, a minute later a new worker drained the queue (requests waiting in the queue are kept). Check that first when a cron's work
stops landing.

## Deploy

Push to `main` on `lesaruss/vegansexplore-com`. Vercel auto-deploys.
Commit author must be `Sean A. Russell <contact@lesaruss.com>`. Sean confirmed it on 2026-11-05 (sessions had been committing as Claude): author Sean A. Russell, Claude in the `Co-Authored-By` line; if a push is refused for the author, use Claude for that push only and say so.
Vercel project: `vegansexplore-com`, team: `team_G2qO2cUYl8ZmeOMaamFvY8C6`.
