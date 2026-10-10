# vegansexplore-com — CLAUDE Working Rules

## Stack
Static HTML site. No build pipeline. Vercel serves the repo root directly
(`outputDirectory: "."`). All pages are `.html` files. Styling is inline CSS
in `<style>` blocks. No separate CSS files. No framework.

## Nav and Footer — MANDATORY (LOCKED 2026-05-18)

Every HTML page on this site MUST include both shared component scripts.
No exceptions. No hardcoded nav or footer markup in page files.

### Required script tags

```html
<!-- Top of <body>, before any page content -->
<script src="/public/nav.js"></script>

<!-- Bottom of <body>, just before </body> -->
<script src="/public/footer.js"></script>
```

### Rules

- `nav.js` injects the sticky top nav with Guides dropdown, Communities
  dropdown, Directory, Passport links, and "Get Passport - $11" CTA.
  It also injects its own CSS. Place the script tag as the first element
  inside `<body>` (or inside the `<div class="page-frame">` wrapper if
  the page uses one).

- `footer.js` injects the dark footer with wordmark, nav links
  (ABOUT, PARTNER WITH US, POLICIES, CONTACT), social icons, and
  copyright. It also injects its own CSS. Place the script tag
  immediately before `</body>`.

- NEVER write `<nav class="ve-nav">` or `<footer class="ve-footer">`
  directly in a page file. All nav/footer changes go in the script files.

- To update nav or footer site-wide: edit `/public/nav.js` or
  `/public/footer.js` only. One edit propagates to all pages instantly.

### Exceptions (Sean, 2026-09-27)

These pages load neither nav.js nor footer.js, on purpose. Anything not on
this list follows the rule above. A new exception goes on this list first.

- **Redirect stubs**, pages whose only job is to send the visitor elsewhere
  (a meta refresh or `location.replace`, or a `vercel.json` redirect that
  catches the URL before the file is served): `partner.html` (`/partner` goes to
  `/partners`), `tour.html` (`/tour` goes to the archive site),
  `guides/ve-discuss.html`, `onboarding.html`, `apply.html` (`/apply` goes to `/claim?add=1`, Join the Directory).
- **Partner pitch decks**, standalone sales documents with their own footer,
  some marked Confidential: `partners/community-partner.html` and everything
  in `partners/pitches/`. The member nav and its Passport CTA do not belong
  on them.
- **Full-screen app shell**: `app/index.html` (the body does not scroll, so a
  footer would never be seen).
- **Ad creatives**, HTML5 ads that load inside an ad slot's frame, not as pages:
  everything in `ads/` (Sean, 2026-10-04).

Admin tools live in The Depot (`/admin/depot/*`) and do load both scripts;
each hides them when embedded (`.ve-embedded .ve-nav, .ve-embedded
.ve-footer{display:none}`). The old standalone `/admin/news-review`,
`/admin/pulse-city-tags`, `/admin/opportunity-applications` and
`/admin/partner-applications` pages were retired on 2026-09-27 and redirect
to Depot > Inbox, Depot > Pulse Cities, `/dashboard/applications` and
`/dashboard/partners`. Depot > News Desk and Depot > City News were merged into
Depot > Inbox and Depot > Sources on 2026-09-28; their old URLs redirect to the Inbox.

### Why this rule exists

Before 2026-05-18 the site had 24 HTML pages with 5 different footer
structures and 3 pages missing nav entirely. A batch fix standardized all
of them. This rule prevents that drift from recurring.

### New page template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — Vegans Explore</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* page-specific styles here */
  </style>
</head>
<body>
  <div class="page-frame">

  <script src="/public/nav.js"></script>

  <!-- page content here -->

  <script src="/public/footer.js"></script>
  </div>
</body>
</html>
```

## Summary two-row cap (LOCKED 2026-09-14)

Every card summary / excerpt / blurb on a member-facing surface is capped at
two rows. Sean set this rule on 2026-09-13 after a Pulse entry rendered four
rows on the live site. Summaries come from Supabase (`ve_pulse_content.summary`,
`ve_community_news.summary`, `opportunities.description`,
`store_products.description`, `campaigns.summary`, `ve_board_posts.body`) and
are unbounded in length,
so the cap has to live in CSS, not in the copy.

Any class that renders one of those fields must carry:

```css
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
```

Classes currently under the rule:

- `.pulse-card-excerpt` — `/pulse.html`
- `.news-excerpt` — the city hub page, `/communities/hub.html` (shared by
  `hub-news.js`, `hub-community.js` opportunity and reward cards)
- `.camp-card-desc` — `/dashboard/campaigns.html`
- `.camp-tile-desc` — `/campaigns/index.html`
- `.dash-tile-desc` — `/dashboard/center-console.html`
- `.vep-intro` — Daily Pulse topic cards, `/public/ve-pulse-topics.js` (dashboard
  Pulse tab and preview, city hubs), and `.post-body` on `/board.html`. The Daily
  Pulse became discussion topics on the Community Board on 2026-10-04; the topic
  intro (`ve_board_posts.body`) is the summary there.

The cap applies to the card only. Full article and detail views
(`.article-lede`, `.article-p`) are never clamped.

## Ad rail (Sean, 2026-10-04)

Three-fourths content, one-fourth ads on the right, on: the Daily Pulse (`/board` Pulse list and
Pulse posts, the dashboard Daily Pulse tab) and the dashboard Events tab. Not on Communities,
Tools, Shows or the Directory (the Directory listing has its own billboard).

Use `/public/ve-ad-rail.js`: wrap the content in `<div class="vear-layout"><div class="vear-main">`
and add `<aside class="vear-rail" data-ad-page="pulse|/events">`. Slots come from `ad_placements`
(page_slug + slot_id) through the `ad-resolve` function; a rail fills, and counts an impression,
only once it is on screen. A new page needs its slots added to `ad_placements` and to `PAGES` in
the script.

### Ad creatives (Sean, 2026-10-04)

An ad's `creative_url` is an image or an HTML5 ad (a `.html` file in `ads/<brand>/`). Every slot
renders through `/public/ve-ad-creative.js` (`VEAdCreative.markup(ad)`), which frames an HTML5 ad
in a sandbox and passes the tracked link as `?clickTag=`; the ad opens that link itself and posts
`{veAd:'click'}` so the click counts. GeekFon artist pages do the same in
`components/AdCreative.tsx` (lesaruss/geekfon-society). Every ad link is a tracked `/go/` link.
Our guides (River, Maya, Nori and the rest) are always drawn in the GeekFon illustration style,
never photographs, in ads and everywhere else. Example: `/ads/humble-cabbage/ve-tee.html`, River
in the tee, then Shop now plays the tee, Maya and Nori in Black, the $5 donation, and Shop now.

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
- Member features live in the universal frame (the dashboard window): `/dashboard/<feature>` opens
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

## Guided view for mocks and walkthroughs (LOCKED 2026-10-04)

Sean: "I say this every time... I don't like the scroll... put it in that view so we're
navigating through and seeing everything." Canon `canon-sean-interface-defaults` rule 0.

Any mock, demo, pitch walkthrough, illustrative report or concept page is built as the guided
view on the first pass, never a long scroll: one full-height slide at a time on a dark stage,
Back / "N of M" / Next at the bottom, nothing to scroll on desktop (nav, stage and footer share
one screen), every slide fitting at 1440x900 and 1366x768, and on phones the slide stacks with
the controls after it. The format is the `/partners` page; the shared shell is
`/public/ve-guided.js` (see its header for the markup). Wrap the page in
`<div class="page-frame">`, put slides in `<main class="vg-stage">` as
`<section class="vg-slide" id="..." data-title="...">`, and load the script after the footer.
Different audiences branch from a `data-vg-choose` slide into `data-path` slides. Example:
`/campaign-engine`, `/campaign-engine/fieldhouse-protein/report` and `/dashboard`. Working tools and data pages
(queues, lists, forms) are not mocks and follow Interface defaults.

## Campaigns on a listing (Sean, 2026-10-04)

A brand's campaign runs on its Directory listing: `directory/listing.html` shows a campaign banner,
a Campaign tab (tasks with points, your progress, a city leaderboard, the creators), an Events tab
and a sidebar card whenever the listing carries a campaign (`l._campaign`), and Food Brands get
their Menu tab labeled Products. The demo, `/campaign-engine/fieldhouse-protein` (rewrite in
`vercel.json`), is that real page in demo mode: `?demo=<slug>` or `/campaign-engine/<slug>` loads
`/campaign-engine/<slug>/listing-demo.js` instead of the database, labels it Illustrative, turns
off votes, saves and claims, adds a member / brand view switch and a week stepper (the demo's
`campaignAt(week)` returns the campaign as it stood that week, 1 to 10, then Final), and starts a
`ve-tour.js` spotlight tour of the campaign. `/campaign-engine/fieldhouse-protein/social` shows the
campaign in our Instagram, TikTok, Community Board, Daily Pulse and member feeds. Campaign rules:
everyone starts at zero, a capped points total, joining Vegans Explore is how you enter, a grand
prize for the most points, prizes for each city's top 10, and digital rewards (coupons) at set totals. Live campaigns are not wired yet: `ve_bounty_campaigns.host_listing_id`
links a campaign to a listing, but the table has no public read, so it needs to come through the
`ve-bounties` function first.

## Business outreach, city by city (Sean, 2026-10-10)

"Let's just make sure we're not sending any emails... when I say go... let's go city by city. And not try to hit everybody
at once." Then: "see who is on the queue, approve who the emails are going to be going out to... on Monday, we're sending
it to these 60... see what the draft is... and we commit to it for like maybe 15 days before we make any drastic changes."
The goal is businesses on board for Q1 2027 through Front Row Start. Migrations `20261010_ve_outreach.sql` and
`20261010_ve_outreach_batches.sql`; edge function `ve-outreach`; console **Depot > Business outreach**
(`/admin/depot/business-outreach`).

- **The console** (one thing per view): Upcoming sends (each send day is a batch: Waiting for approval, Approved, Sent) and
  the cities. A send day lists its businesses (who they are, where the email goes and where we found it, the Guides they
  are in) with Preview; a business opens its three emails exactly as they go out beside its real page (framed,
  `?preview=1`), where Sean can fix the name or email, take it out of the day or mark it Never email. **Approve this send**
  approves all three emails for that day's businesses. Plan sends proposes days: first send day and businesses per weekday
  (`ve_outreach_plan`, brands first). The first approval in a city sets its 15-day commitment
  (`ve_outreach_cities.committed_until`, shown on the city card): no big changes to the emails or the plan before then.
- **Two gates before anything sends**: the batch is approved, and the city is on (`ve_outreach_cities.enabled`, every city
  off). `ve_outreach_due()` is what a sender would send: approved batches whose day has come, then follow-ups when due,
  never a suppressed address. **No sender is wired yet.**
- **The emails** (`ve_outreach_templates`): three from Sean (sender `email_brands` `lesaruss`, replies to
  contact@lesaruss.com), Day 0 "We built a page for {business}", Day 4 "Your front-row seat{in_city}", Day 10 "Last note
  from me". `ve_outreach_render(contact, step)` fills them; the console and the sender both use it. `{in_city}` is " in
  South Florida" (nothing for a national brand), `{guide}` is Liz (Maya for a Dairy Guide brand), and `{guide_line}` names a
  Guide the business is in, as a brand or as a store carrying its products (`ve_outreach_guides`), with a link to it in the
  Guide (`/guides/<guide>#/listing/<slug>`). No price in the emails: the $111 is on the Partner Dashboard.
- **Contacts** (`ve_outreach_contacts`): one per public, unclaimed listing with an email, by city; national brands are
  their own row, `brands`. A click, reply or claim makes it `interested`; `trg_ve_outreach_route` stops its emails and
  routes it to the city's Community Manager, or Sean. `ve_outreach_queue` is the interest queue.
- **Find emails** (city card, `ve-outreach` `find_emails`, 20 websites a press): reads the business's own home, contact
  and about pages, server side, and takes only an email published there (mailto, plain text, Cloudflare-protected), with
  the page as `email_source`. Never guessed. Each listing is tried once (`ve_outreach_lookups`).
- Ops: `ve-outreach` also takes `LESARUSS_ADMIN_TOKEN` for overview, preview, plan and find_emails; approving, changing a
  row and the city switch need a signed-in super admin.
- The June 2026 `listing_outreach` queue (the old $11 claim offer, never sent) was retired on 2026-10-10 (`skipped`, note).
- Not built yet: the sender (Resend through the warmup, a personal `/go/` link each), click/reply/claim hooks, onboarding
  after sign-up, and the interest queue's own view.

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

## Invites and free memberships (Sean, 2026-10-04)

Sean invites people who aren't confirmed yet (no account anywhere in the universe) from HQ > People
(super admins only): select people, Invite, pick the brand, what it points to (membership, a dinner
seat, the Community Manager role) and, per person, whether the membership is on us ("in recognition
of their work and contributions to the community"). Invites are made "Not sent yet"; HQ > People >
Invites sends them from Sean (or copies the link). From then they work once, for 30 days.

- Data: `universe_invites` (migration `20261004_universe_invites.sql`); `ve-invites` edge function
  (view and accept for `/invite?c=<code>`, and the admin actions HQ calls with
  `lesaruss_secrets.INVITES_KEY`). Each invite gets a personal tracked link (`ve_links`).
- Claiming: `universe_invite_claim()`, run when the invited email signs up (members insert triggers
  `trg_zz_universe_invite_*`), when they accept on `/invite`, or when they hold their dinner seat. A
  free membership opens everything an $11 Founding Membership does, with no points (Sean,
  2026-10-04: points come from contributing, which is how a free member is encouraged to give).
- Dinners: a dinner seat needs a free account (Hold my seat opens the account window). Depot > Dinner
  guests sets each guest's membership (on us by default) and holds the dinner's budget ($500 cap).
- Contribute any time: active members have a Contribute button on the dashboard (ve-entry-checkout,
  $11 or more). "Member since" (`entry_paid_at`) never moves for an active member. Always a
  contribution, never a tax-deductible donation.

## Explore and the Directory (Sean, 2026-10-04)

The homepage hero offers two ways in: Start Your Journey (the guided tour, `/welcome`) and Explore
Now (`/explore`), a one-screen overview for visitors who want to look around first: Guides,
Directory, Communities and Community Board cards, the $11 Founding Membership, and a link to the tour.
Log In stays in the nav. Explore cards use our illustrations, never photos.

`/directory` is open to everyone again (it was locked to super admins and redirected to
`/communities`). Anyone can browse, search and see vote counts; voting asks a signed-out visitor to
sign in and then offers the $11 Founding Membership (`/public/ve-votes.js`).

The Directory runs on `/public/ve-region-directory.js`, the same component as the city hubs (rebuilt
2026-10-04 after an audit; the old page had its own out-of-date sections, region list and copy). One
component means the sections, badges, vegan filters, search, the public vetting rule
(`/public/ve-trust.js`) and the hidden `lesaruss-ai-directory-candidate` listings match everywhere:
change the Directory there, not in the page. The page adds a city picker from `VE_HUBS`
(`/public/ve-hubs.js`), a hero with that city's art (New York for all cities), `?city=<hub slug>` and
`?tab=<section>` in the address bar, and the Founding Membership box for non-members.

Logos (Sean, 2026-10-10: "I would prefer it just to have the thumbnail with the letter if it's not the official
logo"): a listing shows a logo only when we hold it in our own storage (`vegan-media`: logos checked by eye, the curated
`directory/logos/` files, or one an admin picked in the media library) or it is a podcast's own Apple Podcasts cover.
Logos linked from elsewhere (Instagram pictures, whose links expire; website share images) were set aside on 2026-10-10
into `listings.details.logo_unverified` (143 listings) and show the letter. Restore one after checking it with the line in
`20261010_listing_logos_letter_unless_ours.sql`; a new logo is copied into our storage, never hot-linked.

Duplicates (Sean, 2026-10-10: "merge the duplicates"): a listing is never deleted. A duplicate gets status `rejected` with
`details.merged_into` (the listing that stays), `merged_at` and `status_before_merge`, and what pointed at it (outreach,
votes, saves) moves to the listing that stays; a second queued outreach for the same business is `skipped`. 168 were
merged on 2026-10-10 (`20261010_listing_duplicates_merged.sql`): three public pairs (BunnieCakes, The Rabbit Hole and
Soulicious Vegan Kitchen, whose "Community Partner" copies became an extra category) and 165 hidden import copies of a
listed business. Branches in different cities are not duplicates. Hidden import copies can share a slug with the public
listing, so look a listing up by slug and `status = 'approved'`. An old link to a merged copy forwards to the listing that
stays: `directory/listing.html` asks `ve_listing_merged_to(slug)` (migration `20261010_listing_merged_redirect.sql`)
when a slug has no approved listing, keeping the address's tab and hash.

## City hubs: one page for every city (Sean, 2026-10-05)

"South Florida is the prototype." Every city hub is one file, `/communities/hub.html`, served at
`/communities/<slug>` by a rewrite in `vercel.json` (the eight per-city copies drifted apart and were
removed). A city's details (title, regions, hero art, the "across ___" area, event cities, billboard
slot ids, South Florida's counties and pinned event) live in `VE_HUBS[].page` in `/public/ve-hubs.js`;
its Directory rule is `VE_HUBS[].match`. A new city is a `VE_HUBS` entry, its art in
`/communities/<slug>/`, its slug in the rewrite, and its three `ad_placements` rows. Change a hub in
`hub.html` once and every city gets it.

- Menu: one dropdown at every width (no scrolling tab row), sections Daily Pulse, Events, Directory,
  Opportunities, Bounties, Community Board, Members and Rewards (the last two for members). The
  address bar carries the section (`?tab=`). Newsletter is gone (the Daily Pulse does that job);
  Community Partners is hidden but kept in the page; Chat was removed (it showed sample threads).
- The Board and Bounties open inside the hub, under the community, in a frame
  (`/board?community=<slug>&hub=1`, `/bounties?...&hub=1`, which hide their own city picker). The
  framed page sizes the frame; `nav.js` treats a hub parent like the dashboard window.
- The billboard sits beside every section except Members, Bounties and the Board (full width).
  Opportunities are two across beside it and list every open role: the city's and the ones open in
  every city (members through ve-rewards with their application status, anyone else by public read).
- Members shows real members ranked by points (the leaderboard) to members; signed out, a plain
  outline behind the Passport gate. Never sample people.

## No city news: the Daily Pulse (Sean, 2026-10-05)

"We're not really doing news like that anymore. We're doing the Daily Pulse." Big local items go in
that city's Daily Pulse topic and national ones in the daily national topic (`ve_board_posts`, kind
`topic`, through `ve-board`). We don't write news articles: too many loopholes, and finding the right
image isn't worth the time. The one exception is a sponsor, because a sponsor gives us the graphics.

- A city hub opens on the Daily Pulse (`?tab=news` and `?tab=pulse` both land there): the city's
  topics and the national one (`VEHubNews.render` in `/public/hub-news.js` draws them with `VEPulse`).
  "Featured stories" under it shows only when an approved `ve_community_news` row or a published Pulse
  piece is tagged to the city. The "Submit news" form is gone.
- `ve-news-desk` (cron `ve-news-desk-6h`) keeps running: its leads feed the Pulse briefings.
- Depot > Inbox (2026-10-05): stories left alone feed the Pulse briefings; **Lead a Pulse topic** starts a
  topic from one story (`ve-board` `topic_draft` with `lead_id`). **Sponsor story** is the only way to
  write one up or share it to a hub: `ve-news-desk` `lead_write` and `lead_share` refuse without a
  sponsor name (`sponsor_only`) and save it in `ve_news_leads.sponsor_name`. A story a topic used
  (`topic_post_id`) counts as done (migration `20261005_ve_news_leads_sponsor_only.sql`). HQ's Depot calls
  the same function, so its write-up needs a sponsor too.

## Community Board sections (Sean, 2026-10-10)

"In each city, let's set the sections... a jobs board... a classified... a Fosters Board, and then a
Rescues Board... so as people start going into these cities, they actually see stuff." Every city's
`/board` has six toggles: Daily Pulse, Requests & Offers, Jobs, Classifieds, Fosters, Rescues
(`?lane=pulse|jobs|classifieds|fosters|rescues`, Requests & Offers is the default). A row of tabs on
desktop, three by two on a phone.

- Each section is a `ve_board_posts.kind` (`job`, `classified`, `foster`, `rescue`; Requests & Offers is
  `request`/`offer`). In the new four the category is the post's type: Hiring / Looking for work; For
  sale / Free / Wanted / Trade; Needs a foster / Can foster; Urgent / Needs a rescue / Update. The
  lists live in `LANES` in both `ve-board` and `board.html`; change both together. Rescue and fostering
  left Requests & Offers for their own boards (the old categories are still accepted).
- Every section in every city opens on a pinned "How it works" post (`pinned`, category `guide`),
  shown as from Vegans Explore, held by the `pulse_auto` account. A new city needs its five (migration
  `20261010_ve_board_sections.sql` is idempotent: re-run its insert with the city added).
- "Done" reads per section: Mark resolved, filled, gone, placed, rescued.
- The local Daily Pulse runs for every city (`pulse_auto.communities`, same migration).
- **Suggest a Topic** (Sean, 2026-10-10), the seventh section (`?lane=suggest`, kind `suggestion`): For the Daily Pulse
  (`pulse_idea`), Something to talk about (`talk_idea`), An idea for the board (`board_idea`); done reads Covered. The Pulse
  writer reads the city's open `pulse_idea` posts, most replied first, uses one only with a real source, and sets
  `briefing.suggestion_id`; when that briefing goes live, trigger `trg_ve_board_suggestion_covered` marks the suggestion
  Covered and replies with the link (migration `20261010_ve_board_suggest_topic.sql`). On a phone the toggles are three
  across with Suggest a Topic across the bottom.
- **Areas** (Sean, 2026-10-10: "they can pick specific cities, they can choose all cities, and then people can further
  drill down"): a post is for one area of its city or the whole city (`ve_board_posts.area`, empty = whole city), and an
  area filter beside search shows that area's posts plus the whole-city ones (`ve-board` list `area`, `?area=` in the address
  bar). The areas are `VE_HUBS[].page.boardAreas` in `/public/ve-hubs.js`: South Florida by county, DMV as DC / Maryland /
  Virginia, New York by borough, London by compass point. Change a city's areas there.
- **Hot tips** (Sean, 2026-10-10: "a way for people to leave news, hot tips, letting us know what's going on in their
  cities"): the first Suggest a Topic type (`hot_tip`). The Pulse writer reads open hot tips with the Daily Pulse ideas
  (migration `20261010_ve_board_areas_hot_tips.sql`).

## Daily Pulse on autopilot (Sean, 2026-10-05)

"Have it set up the day before. And then if I look at it, I look at it. If I don't, it goes out."
At 6 PM Eastern (cron `ve-pulse-auto-queue`, 22:00 UTC) `ve_pulse_auto_queue()` queues tomorrow's draft
for each community in the `pulse_auto` row of `lesaruss_dispatch_settings` (`national` and all eight
cities since 2026-10-10; a city joins by adding its slug). The Background writer (dispatcher source
`pulse_topic_write`, Station 2) builds the briefing and its first reply (`ve_board_posts.first_reply`,
also `briefing.first_reply` so the desk shows it). Every 15 minutes `ve_pulse_auto_publish()` (cron
`ve-pulse-auto-publish`) publishes what is due at 7:00 AM local (`auto_publish_at`) the way `ve-board`
`topic_publish` does, under the account in `pulse_auto.member_id` (Sean's). A draft still being written,
failed, missing a part, or more than 12 hours late does not go out on its own. To stop one: Discard in
the Pulse desk (Depot > Inbox). Migration `20261005_ve_pulse_auto.sql`.

## Guides are mini apps (Sean, 2026-10-08)

"This is how all of our guides should be... mini apps bringing all these components together." A
Vegans Explore Guide is never a PDF or a slide deck: it is a small website that spotlights the bigger
tools we already run (the Directory, votes, the Cookbook and its recipes and chefs, the Daily Pulse,
the ad rail) and combines them into something new. The reference is the Vegan Dairy Guide
(`guides/vegan-dairy-guide.html`, `guide-scripts/vegan-dairy-guide.js`): a menu, search for members,
brands as approved Directory listings with votes, a Cookbook, and Maya as the Guide.

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
  See for yourself is one fact at a time (`#/look/<n>`) with its number and an icon (`LOOK_STATS`, from the cited facts).
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

## Guide pricing (LOCKED by Sean 2026-10-10, canon `canon-ve-guide-pricing` v3)

"Instead of you buying guides with points, because it does feel weird... almost like Audible... you have credits to
unlock guides... if you want the guide now, you just pay the 11 bucks... with the points, they can also speak to the
guides." Every paid Guide is **$11 or 1 Guide credit**, never a points price, and a Guide a member unlocks is theirs to
keep. The **$11 Founding Membership** comes with 1 credit. **Passport** ($11 a month or $111 a year) gives 1 credit a month
(annual too, one a month) and still 1,100 points a month (13,200 for a year) until the voice cost per minute is known.
Credits roll over up to **3**. **Points** are for talking to the Guides (text chat 4 points a message; voice by the minute
once voice exists) and about **2,500 points become 1 credit**. **Free Guides** (the Welcome Guide, the Partner Guide) are
open to everyone: they are the enrollment tool.

- Data (migration `20261010_ve_guide_credits.sql`): `members.guide_credits` and `guide_credit_ledger` (one row per
  grant or spend, `unique (member_id, ref_id)` so nothing is granted twice). `ve_credit_grant` (cap 3; a grant at the cap
  is recorded as `capped`, delta 0), `ve_credit_unlock`, `ve_credit_from_points` (2,500, both point balances),
  `ve_guide_purchase_paid` (the $11 checkout; `ve_guide_purchases.paid_with` credit, cash, points). The Founding credit
  comes from trigger `trg_ve_founding_credit` the moment a member becomes active (not for a member who already owns a
  Guide, which was their first, and not for a Passport signup); Passport's monthly credit from `ve_passport_credit`
  (ref `passport:<YYYY-MM>`, Eastern), run daily by cron `ve-passport-credits` and whenever the member opens a Guide.
- `ve_guides.access_rule`: `credit`, `free`, or the older `points` and `membership`. `ve-guide-unlock`: `status`/`open`
  (credits, balance, `credit_cap`, `points_per_credit`), `unlock` (a credit), `exchange` (points to a credit), `checkout`
  (Stripe, $11 for that Guide, metadata type `ve_guide_purchase`, `confirm_fn` `ve-guide-unlock`; `GET ?confirm=` marks it
  bought and returns with `?guide=bought`; test accounts use the test key).
- The Dairy Guide page (`ST` in `guide-scripts/vegan-dairy-guide.js`) reads `access_rule`: signed out, Join for $11 (your
  first credit comes with it); not a Founding Member yet, Become a Founding Member; a credit, **Unlock with 1 credit**; none,
  **Get it now for $11**, Use 2,500 points for a credit (when they have them) and Passport. Maya's Get access line on credits
  is `sayCredit`, played from `CLIPS.join_credit` (`dg-join-c.mp4`, Sean approved the line 2026-10-10; the voice's two long
  pauses were shortened so it fits one take, `dg-join-c2.mp3`). The Restaurant Survival
  Guide's button (`vegan-restaurant-survival-guide-gate.js`) does the same. The catalog (`/guides`), `/passport`,
  `/welcome`, `/explore`, the homepage and the dashboard's Guide cards say $11 or 1 credit.
- Guide chat spends points (`spend_points_for_chat`, reason `guide_chat_spend`); the monthly allowance rules are off.
- Members active when the Dairy Guide left membership (2026-10-10) own it (`ve_guide_purchases`, 0 points).
- Points live in two places: `members.lesars_balance` (what a reward, a campaign or the credit exchange spends) and
  `member_points.available_points` (the wallet, moved by `apply_member_points_delta`). Every function that moves points
  moves both by the same amount (migration `20261010_points_both_balances.sql`). A new points function does the same.
- What the Guides say about prices lives in `ve-guide-platform-facts` and `guide_kb_answers`; change them with this.

## Grocery stores and Vegan aisles (Sean, 2026-10-08)

"As we're bringing different products into these guides, it should automatically map to a supermarket
that carries them, and that supermarket should then show that product." Each supermarket is a Directory
listing (category Markets, tag `ve-grocery-store`, "Grocery store" on its card) whose page opens on a
**Vegan aisle**: every Guide product mapped to it, grouped by type, `?product=<id>` picks one out.

- Data (migration `20261008_ve_grocery_stores.sql`): `ve_products` (brand listing + product type),
  `ve_product_stores` (store carries product; `removed_at` when a Guide stops naming it, never deleted),
  `ve_store_aliases` (how a Guide writes the store: "Kroger family", "HEB"), `ve_guide_product_sources`
  (which `listings.details` key holds a Guide's products; Dairy is `dairy_guide`).
- It fills itself: a trigger on `listings.details` runs `ve_products_sync()`, and a new alias re-maps
  everything. A new Guide with products is one `ve_guide_product_sources` row; a new store is a listing plus
  its aliases. In a Guide, a store named in a product's "where" text links to its aisle inside the Guide.
- Buy link, best first: an affiliate deal (`affiliate_link_code`, a `/go/` tracked link), the product's own
  page at that store (`buy_url`), the store's search (`details.store.search_url`, used only when
  `search_checked` is `results` or `loads`; most chains block automated checks and say `blocked` until
  someone confirms the search in a browser), then the store's website.
- The Vegan aisle is one category at a time: department and category dropdowns, search, Sort by (most
  voted brand first), 12 cards then Show all. Each card opens the product's page.
- Brand pages (Sean, 2026-10-08: "so we don't have like a thousand different pages let's just make it a little mini
  web experience for Oatly"): a brand with products in our Guides (a `listings.details` key in `VEProducts.SOURCES`,
  the same keys as `ve_guide_product_sources`) is one page, its Directory listing, with tabs Overview (about the brand
  from `details.about`, its products, where to find them), Products (the list, then one product: Products > Oatly
  Milk, `?tab=products&product=<slug>&v=<version>`; Products again goes back to the list), and For <Brand> for the
  brand alone (below). No Gallery tab (Sean, 2026-10-09: "all we have for products is a main page, products, and
  then... a for Oatly page that only Oatly sees"; `details.videos` stays in the data). The Campaign, Video and Pulse
  tabs appear only once the brand partners with us. The right column holds the open product's Nutrition Facts on top (Sean, 2026-10-08: "put the barcode back on
  the right-hand side and push the billboard down") and the billboard under them, pinned while the page scrolls. It
  wears our city art (South Florida for now). Code: `loadBrandSite` in `directory/listing.html`.
- Brand Partner (Sean, 2026-10-08): "build these out for brands that we're actively pursuing... $111 a quarter just to
  have a seat at the table." Every product brand gets a basic page (Overview, Products). A **featured** page adds our city
  art: a brand we are pursuing is granted it (`listings.details.brand_featured`, Oatly first), and a Brand
  Partner keeps it. Brand Partner is `ve-claims` tier `brand`, $111 a quarter, the same quarterly Stripe subscription and
  claim path as Passport Stop and Anchor (no founding spots, no Passport results sheet). `/claim?listing=<slug>&plan=brand`
  offers it, and a Food Brands or Brands listing is offered only that plan. The tier checks were widened by
  `supabase/migrations/20261008_brand_partner_tier.sql` (applied 2026-10-09 through the Supabase connector). Schema
  changes are applied by Logan through the connector and checked in the database, never handed to Sean to paste.
- **For <Brand>** tab (`?tab=brand`): the brand's door. It shows to the owner, a super admin, and anyone arriving on the
  link we send (it then stays for the visit). The offer is a narrated tour, seven slides since round 5 (Sean, 2026-10-09,
  run past a panel each round; consensus: never show planned things as live, being early is the asset, the brand's own
  numbers are the proof, the gift comes before the price, no dollar budgets on the tour): 1. we built your page, yours to
  keep whatever you decide; 2. from the guide to the shelf (live scaled previews of the Guide, the product and a store's
  Vegan aisle, `?preview=1` so they are not counted); 3. your numbers, counting from day one (the page is brand new,
  `brand_door.made`; `ve_listing_totals()` for anyone on the link, the breakdown behind `brand_stats`; they grow by joining
  campaigns: Guides, events, social and creators, podcasts, ads and videos, our animated programming, all Coming);
  4. the sample ad, unpublished, nothing runs without the brand's approval; 5. campaigns, every card marked Coming
  (`CAMPAIGNS` in `loadBrandSite`, checked in canon: the Plant-Based Showcase on Miami Dolphins game day at Hard Rock
  Stadium, Sunday, November 29, 2026; community nights from November; the World Vegan Expo, city and date not set; our
  Q1 2027 campaigns; a dated card drops off once it passes) and what a partner picks in each (products, a featured Guide
  spot, ad slots on chosen pages, their own ads or ours, a spend to their budget, an assigned campaign manager);
  6. where the membership goes (events, volunteer Community Managers, the apps) and how they see it (live dashboard, a
  report within 7 days of every event they join), Live now beside Brand Partners only; 7. **Front Row Start** (the early
  offer, named by the panel): join before January 1, 2027 and the rest of 2026 is on us, no charge today, the first $111 in
  January for Q1 2027 with a front-row seat on its campaigns. The button goes to `/claim?...&plan=brand&offer=front-row`;
  `ve-claims` turns that into a Stripe trial ending January 1, 2027 (brand tier only, only before the deadline). After
  January 1 slide 7 is the plain offer (Be our first Brand Partner, $111 a quarter, `brand_door.first`) and plays
  `brand_door.tour_plain_last`. Buttons: the offer, Ask Sean a question, Not yet, send me the numbers. Nothing plays until the
  visitor presses Start the tour (Sean, 2026-10-09); after that every Next or Back plays the slide. Slide 3 is a snapshot of
  the real dashboard (totals live, the rest in outline, locked) that opens it. Maya says "Vegan" right only when the text
  is spelled "Veegan" (el-media, her voice); every clip gets a 0.25 s lead-in and a fade-in so it never starts with a pop.
  The clips are `brand_door.tour` (round 5: `r5-slide-<n>.mp4` for 1, 3, 5, 6, 7; `t-slide-2` and `-4` kept; round 4's six in
  `tour_r4`). Round 5 clips are cut with `scripts/brand-door/assemble_r5.py`, which ends each clip where her mouth is
  closed; check the last second and the lip sync by eye (face close-ups against the voice level) before uploading. A start
  picture with a toothy grin gives a frozen grin, so start from a closed-lip smile. The email that carries the link is the gift (no price), and the
  follow-up brings the brand's real numbers. The brand's Guide narrates in the right column (the billboard steps aside): Maya for the Dairy Guide
  (`VEProducts.GUIDES[..][2]`), her words on each slide (the slide's `say` in `loadBrandSite`, which must match the
  recording) and a clip per slide (`listings.details.brand_door.clips`, `[{video, poster}]`, in
  `vegan-media/media/brand-door/<slug>/`; `brand_door.audio` is the voice-only fallback). Round 2 (Sean, 2026-10-09):
  no b-roll for now ("strip the B-roll for now so we can be strategic with it... less than 10 second clip of her talking,
  I'm okay with that"), so each slide is Maya alone on camera, under 10 seconds, each from a different pose (her start
  pictures are made in Higgsfield from her square art, mid shot, hands drawn right), and the poster is the clip's first
  frame, with a small shift as the slide changes so she reads as moving. She just starts talking: opening the tab and
  every Next or Back plays the slide unless the visitor paused her (a browser that blocks sound waits for a tap). Nothing
  in the tour links away (Sean: "let's keep it just here"). The dark panels wear our city at night, faintly
  (`vegan-media/media/communities/south-florida-night.jpg`). Lines 2 to 8 are shared by every brand
  (`vegan-media/media/maya/brand-door/s-<n>.mp3`); slides 1 and 9 name the brand (`<slug>-s-1`, `<slug>-s-9`), so a new
  brand needs those two recorded and lip-synced. Making a clip: el-media tts, Wan 2.7 (720p, 1:1, `start_image` and
  `audio_references`) in Higgsfield, trim at the end of speech with `scripts/brand-door/assemble_door.py` in Higgsfield's
  sandbox, upload, then ve-off-lookup `save` (it now takes `brand-door/` video and `communities/` art). A lip-sync line
  needs about 3 seconds or more (shorter ones failed). `brand_door.sample_ad` is the sample ad (Sean, 2026-10-08: "show our characters
  consuming their products in the ads just for their pages"); it shows only in the tour, never as a live ad. On a brand
  page's other tabs the billboard carries our own ad for its Guide (`houseAd`, `/go/ve-dairy-guide`): the Guide's
  ad picture (`VEProducts.GUIDES[..][5]`, Maya in a store's dairy-free aisle, no words in the picture), words on top. The Dashboard (`?door=dashboard`): views, visitors, products
  opened and store aisles opened, by day and by source, from `ve-claims` `brand_stats` for the owner or a super
  admin; everyone else sees the outline and Claim. Counts come from `ve_listing_events` through `ve_listing_track()`
  (migration `20261008_ve_listing_events.sql`): every listing logs views, and brand pages log products, store aisles,
  videos and the gallery; one count per visitor and item every 30 minutes; automated browsers are not counted.
- **Partner Dashboard on every listing** (Sean, 2026-10-09: "instead of getting started, it should be a dashboard...
  partner dashboard. And then underneath it is a sub menu"). One tab, `data-tab="brand"`, after Products on a brand page and
  last elsewhere. Locked for visitors (`partnerLocked`): claim this page (a brand's claim carries Front Row Start before
  January 1), or, for a business that is not listed, **Apply to be listed** (Join the Directory, below: `ve-claims` `listing_apply`, any
  Vegan business, anywhere; it makes an unlisted (quarantined) listing tagged `ve-application` and a claim in Depot > Claims, labelled
  Application to be listed; approving lists it and makes the applicant its owner). A non-brand owner sees their numbers
  (`loadPartnerHome`). A brand's partner gets the sub-menu (`.pd-subnav`, `PD_SUBS`): Getting started, **Insights** (the
  numbers from `brand_stats` once the claim is approved, and Campaigns: clicks and each report within 7 days of an event,
  empty until the first campaign), **Your products** (swap a product's or a version's photo and its description in their own
  words; photos under 1000 px on the shorter side are refused in the page and again in `ve-claims` `product_update`, which
  reads the size from the file; name, ingredients and the cited Nutrition Facts stay ours; every change is a row in
  `ve_product_edits` with the value it replaced, migration `20261009_ve_product_edits.sql`), Opportunities, Media, Ask Maya,
  Ad console (Coming). On a brand page, the For <Brand> offer still shows under Partner Dashboard to anyone on the brand's link.
- **Liz walks the locked Partner Dashboard and /apply** (Sean, 2026-10-09: every Guide is walked through on camera; Liz
  is the general Guide, Maya stays with the Dairy Guide brands). The shared component is `/public/ve-guide-tour.js`
  (`VEGuideTour.mount(el, {guide, title, narr, slides:[{t, h, body, pic, say, clip}]})`), laid out like the For <Brand> tour
  (Sean, 2026-10-09: "set up just like how Oatly set up"): the words and a picture of what she is talking about in a dark
  panel, the Guide in the page's right column (`narr`; on a listing she takes the sidebar's place while the tab is open,
  `pdRail`), on top of the slide on a phone. Back / N of M / Next; nothing plays until Start the tour. `mountPartnerLocked` in `directory/listing.html` runs it on every listing's
  locked Partner Dashboard (5 slides, clips pt-1 to pt-5); `/apply` runs pt-4, pt-3, pt-6. Clips in
  `vegan-media/media/liz/partner-tour/` (`pt-<n>.mp4`, `pt-poster-<n>.jpg`); Liz's voice is
  `character_agents.elevenlabs_voice_id` for liz (Sean picked it, sample 3). A slide's `say` must match the recording.
  Liz's face sits higher in frame than Maya's, so `assemble_r5.py`'s mouth search misses on her: check each ending by eye.
- **Join the Directory** (`/claim`, Sean, 2026-10-09: "it should be one form... already have a business listed? Search to see if
  it's there... if they don't see their business... that's when they add their information"). One page, Liz on the right
  (`VEGuideTour.narrator`, clips `j-1` to `j-5` with `pt-6`), paginated: Find it (search and pick, or **Add it**, `?add=1`;
  `/apply` forwards here), Your business (new businesses only: name, kind, city), The details (how Vegan, one line, about),
  About you (and the website, Instagram and phone), **How to join**; then "You're in" with what comes next. Sign-in comes last,
  at the button, with no sign-in window: signed out, About you asks for a password and the button makes the account from the
  name and email already typed (`VEAuth.signup`), then goes on to checkout; an email that already has an account gets
  Sign in instead with the email filled in (Sean, 2026-10-09: "what's the easiest, simplest way to do that handoff").
  A cancelled checkout comes back to How to join with what they typed (`sessionStorage`). On a phone the step change scrolls
  to just under the sticky menu bar (measured, it is taller there), so Liz is never cut off.
  Depot > Preview journeys > **Join the Directory** walks every screen (Sean, 2026-10-09: "so I don't have to fill out the
  form"): `/claim?preview=<picked|details|you|join|join-member|add|add-details|add-join>` opens that step signed out with a
  sample owner (Alex) and Cinnaholic or a sample new business (Green Leaf Kitchen), and the button says nothing is charged;
  `/directory/<slug>?tab=brand&preview=member-owner` shows a member owner's Partner Dashboard. A new screen gets a preview
  and a line in `JOURNEYS.join` (`admin/depot/preview.html`).
- **How to join, Partner or member** (Sean, 2026-10-09: "we got to figure out what would be the difference... without it
  sounding like you don't get anything"). Two cards side by side. **Partner** ("The full experience", Front Row Start before
  January 1): the page claimed and theirs to update, the Partner Dashboard numbers, a front-row seat on every campaign, their
  Guide on the dashboard (Coming for businesses that are not brands), ads (Coming), Founding Member. **Become a member** ("Start
  with the basics", from $11 one time): the page claimed and theirs to update, Founding Member, and add the Partner side any
  time. The numbers are Partner-only in the code too: `ve-claims` `brand_stats` answers `partner_only` to an owner without a live
  plan (Partner, its Front Row Start trial, or Passport), and the page shows `partnerUpsell` (what they can add, never what
  they lack).
- **The Partner plan for every business** (Sean, 2026-10-09: "I would rather give everybody the Oatly style offer... the way in...
  they can get access and take control knowing that it's going to activate come January... invested in the platform because of
  the platform, not because of 11 bucks"). `ve-claims` tier `brand` is the $111 quarterly Partner plan for any listing: **Brand
  Partner** for a product brand, **Partner** (Vegans Explore Partner on Stripe and in email) for everyone else (`tierName`). Front
  Row Start applies to all: no charge today, first quarter in January 2027. It is the default on Join the Directory, for a claim
  and for a new business (`listing_apply` with `tier: 'brand'` runs the same subscription checkout); "Just claim it for now"
  (a contribution from $11, Founding Member) is the second choice, and Passport Stop and Anchor show only when the link asks
  (`?plan=verified|plus`). A brand returns to its page (Maya's Getting Started); any other Partner and every new business to
  `/claim?...&claim=submitted&joined=partner`. The $11 is the member offer; members join through the Guides.
  Not built yet: the partner's home (Getting started, Opportunities, Media, Ask, Ad console) for businesses that are not brands;
  today they get their numbers on the Partner Dashboard once approved.
- **The partner's home** (Sean, 2026-10-09: "once they're in... their dashboard is essentially their page"). When the
  signed-in visitor holds the listing's Brand Partner membership (Front Row Start's trial counts) or owns it (`ve-claims`
  `partner_status`), For <Brand> becomes **Getting Started**: Maya's onboarding tour, six slides with clips in
  `brand_door.start_tour` (welcome to the front row and where things stand; this page is your home; game days, the Dolphins
  model: five or six brands sampling with fans, coupons, content before, the community watch party and tailgate, packaged
  for the next one; the Plant-Based Showcase at events that are not Vegan, college games, festivals, tours like Warped Tour
  being explored; why we do it, Sean's words; next steps), with a Dashboard pill (full once Sean approves the claim). New
  tabs: **Opportunities** (`OPPS` in `loadBrandSite`, every card Coming; I'm interested writes `ve_initiative_interest`,
  `sponsor_tier`, tags `brand-partner` and the slug, emails the account manager; shows on `/dashboard/leads`), **Media**
  (uploads to the private `brand-partner-media` bucket through one-object signed URLs, rows in `ve_brand_media`, migration
  `20261009_ve_brand_media.sql`; the account manager is emailed each file), **Ask Maya** (free saved answers from
  `ve-auth` `guide_ask`; with none, `ve-claims` `partner_ask` emails the question to the account manager,
  `listings.details.brand_door.account_manager_email`, else Sean, Reply-To the brand, logged as `sent_to_person`), and
  **Ad console** (Coming). `?partner=preview` shows the partner's home to anyone, labelled; its buttons work only for a real
  partner or a super admin. A super admin sees the offer by default. Checkout for a brand returns to
  `/directory/<slug>?tab=brand&welcome=1`; approving a brand's claim emails them that the dashboard is open; the claim form
  skips the restaurant questions for a brand.
- A product (`/public/ve-product-view.js`): the photo with its versions (`ve_products.variants`) as round thumbnails
  under it, the chosen version's name, the brand's own description and ingredients, certifications, its Nutrition
  Facts (each version's own, cited; `ve_products.nutrition` only from a cited source such as USDA FoodData Central),
  the USDA record in full, also per version (`variants[].fdc`, else `ve_products.fdc` for the first; from
  `fdc.nal.usda.gov/portal-data/external/<id>`, found with a POST to `/portal-data/external/search`, both of which work
  when the api.nal.usda.gov DEMO_KEY is rate limited; a version with no record says so), Where to find it (each store a button, logo and name, to its Vegan aisle
  on Vegans Explore; never the store's own site: "we want to keep them in our environment"), and more from the brand.
  `/products/<slug>` (`directory/product.html`, rewrite in `vercel.json`) is the shareable link and forwards to the
  brand page with that product open. In a Guide it opens as `#/product/<slug>`. Shared helpers: `/public/ve-products.js`.
- Pictures: product photos are copied into `vegan-media/media/products/<slug>/` from the brand's own product page and
  Open Food Facts (credit CC BY-SA); Sean, 2026-10-08: brand photos are fine to use, and we reach out to the brand.
  Store and brand logos are copied into `vegan-media/media/logos/` (`listings.logo_url`), each checked by eye. Videos
  are the brand's own uploads, checked through YouTube oEmbed (`author_url`). The edge function `ve-off-lookup` (admin
  token) looks at and copies pictures; it writes no rows.
- A new listing gets `vegan_status = 'fully_vegan'` by default. Set it on purpose (null for a store, which is
  not a Vegan business), or the Directory calls it 100% Vegan.
- Next: the sponsorship offer to a store (its page with deals for our members) and affiliate links once
  Amazon Associates is settled.

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
- Add points in the chat (Sean, 2026-10-06): when the allowance is low or used up, the chat offers
  $11 / $25 / $50 (every dollar becomes 100 points) through `ve-entry-checkout`, the same contribution as
  the dashboard's Contribute. Checkout opens in the whole window (Stripe cannot run in a frame) and comes
  back to `/dashboard/guide?topup=success`, where the Guide says thank you.
- Migration `20261006_guide_kb.sql`. Brand-ready (`brand_slug`), so other brands can reuse it.

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

## Image conventions

- Mobile hero images: stored in the same folder as the page's desktop banner.
  Named `ve-[page]-mobile.png`.
- Desktop hero images: referenced in the page's `.hero` CSS via `background-image`.

## Hero legibility pattern (LOCKED 2026-05-18)

Desktop (Option A): strong left-to-right gradient overlay.
```css
.hero::before {
  background: linear-gradient(to right,
    rgba(0,0,0,0.99) 0%, rgba(0,0,0,0.95) 28%,
    rgba(0,0,0,0.72) 52%, rgba(0,0,0,0.28) 68%,
    transparent 84%);
}
.hero::after {
  background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 32%);
}
```

Mobile (Option B): flat scrim + frosted glass card.
```css
@media (max-width: [breakpoint]px) {
  .hero { background-image: url('/path/to/ve-[page]-mobile.png'); background-position: center center; align-items: flex-end; }
  .hero::before { background: rgba(0,0,0,0.32); }
  .hero::after { display: none; }
  .hero-inner { background: rgba(0,0,0,0.58); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 8px; margin: 0 24px 32px; padding: 32px 28px; max-width: calc(100% - 48px); border: 1px solid rgba(255,255,255,0.09); }
}
@media (max-width: 480px) {
  .hero::before { background: rgba(0,0,0,0.32); }
  .hero::after { display: none; }
  .hero-inner { background: rgba(0,0,0,0.62); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 8px; margin: 0 16px 24px; padding: 28px 24px; max-width: calc(100% - 32px); border: 1px solid rgba(255,255,255,0.10); }
}
```

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

## Deploy

Push to `main` on `lesaruss/vegansexplore-com`. Vercel auto-deploys.
Commit author must be `Sean A. Russell <contact@lesaruss.com>`.
Vercel project: `vegansexplore-com`, team: `team_G2qO2cUYl8ZmeOMaamFvY8C6`.
