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
  `/partners`), `tour.html` (`/tour` starts the tour on the dashboard),
  `guides/ve-discuss.html`, `onboarding.html`, `apply.html` (`/apply` goes to `/claim?add=1`, Join the Directory).
- **Partner pitch decks**, standalone sales documents with their own footer,
  some marked Confidential: `partners/community-partner.html` and everything
  in `partners/pitches/`. The member nav and its Passport CTA do not belong
  on them.
- **Full-screen app shell**: `app/index.html` (the body does not scroll, so a
  footer would never be seen).
- **Ad creatives**, HTML5 ads that load inside an ad slot's frame, not as pages:
  everything in `ads/` (Sean, 2026-10-04).

Admin tools live in The Depot (`/admin/depot/*`) and do load both scripts. Its Go to menu (`TABS` in `public/depot-tabs.js`) was
trimmed and grouped on 2026-10-27 (Sean: "way too many things in there"): Directory (Directory review, Business outreach, Claims,
Events), Content (Inbox, Sources, Cookbook, Content index, Library), People (Community Managers, Bounties, Dinner guests, Links, Invites),
Site (Onboarding, Preview journeys, Dashboard checklist, Services). Logos, Pulse, Pulse Cities, Passport Partners, Tours, Passport
Challenge and Import narration left the menu and still open by their address. The Depot is the dashboard's last tab, for super
admins only (Sean, 2026-10-27): `/dashboard/depot/<page>` frames `/admin/depot/<page>` (query and #view kept in the address
bar), and a Depot page opened on its own by a super admin moves in there (`/public/depot-tabs.js`);
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

Three-fourths content, one-fourth ads on the right, on: the Daily Pulse (`/pulse`, every tab and post, and so the
dashboard Daily Pulse tab), the dashboard Events tab, `/events`, the Directory (`/directory` and the
dashboard Directory tab) and Media (`/media` and the dashboard Media tab, the chapter's rail like the Directory's). Not on
Communities or Tools (a Directory listing page has its own billboard).

The Directory's rail is the **chapter's** (Sean, 2026-10-26: "those banners will appear throughout the entire chapter...
Central Florida will have its own... all that's real estate that people can purchase ads on"): two 300 x 250 banners stacked,
the same two landscape slots as that city hub's billboard (`<adPrefix>-landscape-1/-2`, page `/communities/<slug>`), so one
buy runs on every page of the chapter; All cities uses `/directory`'s pair (`ve-directory-landscape-1/-2`). The rail is
`data-ad-page="chapter"` and follows the city picker (`VEAdRail.chapter(rail, slug)`). Beside it the Directory is three cards
across (two under 1280 px, one on phones), and a card's name shows whole, up to four rows, never cut with an ellipsis. The card's right side is the count over **Votes** (the word is the button) and, for super admins, **More** (a dropdown with Edit and Review, room for more; `adminBtn` in `ve-region-directory.js`; Sean, 2026-10-27).

**One ad per page** (Sean, 2026-10-27: "it's either going to be the long one or two short ones, not both"): the Pulse
(and its post pages, `api/pulse-article.js`), Events and the city hubs show one tall 300 x 600; the Directory and Media show
the chapter's two 300 x 250s; a Directory listing keeps its one 300 x 250 in the info column (Sean, 2026-09-27). A city hub's
rail is its tall slot (`data-ad-page="hub"`, `data-ad-chapter` the hub slug; the rotating Billboard is gone), at the Pulse's
width (three-fourths and one-fourth, the slot a full 300 px). Under every ad, filled or not, **Your ad here / Advertise with
Vegans Explore** links to `/business#/found`, the business page's Get found (`CTA` in the script; Sean, 2026-10-27). The rail sticks 16px under
the site's menu (`--ve-nav-h`, set by `nav.js`).

**Every slot filled** (Sean, 2026-10-27: "imagine Humble Cabbage wasn't one of our brands... a test campaign pre-launch... and
we can slowly systematically update the real estate later on"; migration `20261027_humble_cabbage_test_campaign.sql`). Every
slot the site draws carries a Humble Cabbage ad under its one sponsor campaign (`ad_sponsor_campaigns` `humble-cabbage`), its
characters spread across pages (never the paused "$5 to the LESARUSS Foundation" art), each page with its own tracked link
(`/go/hc-ve-events`, `hc-ve-all-cities`, `hc-ve-<city>`, besides `hc-ve-pulse`, `hc-ve-sofl`, `hc-ve-directory`), so impressions
(`ad_impressions`) and clicks read by page. A real advertiser takes a slot by replacing that slot's Humble Cabbage campaign.

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
The goal is businesses on board for Q1 2027 through Front Row Start. Migrations `20261010_ve_outreach.sql`,
`20261010_ve_outreach_batches.sql`, `20261010_ve_outreach_sender.sql`, `20261010_ve_outreach_listing_cleanup.sql` and `20261010_ve_partner_onboarding.sql`; edge function `ve-outreach`; console **Depot > Business outreach**
(`/admin/depot/business-outreach`).

- **The console** (one thing per view): Upcoming sends (each send day is a batch: Waiting for approval, Approved, Sent) and
  the cities. A send day lists its businesses (who they are, where the email goes and where we found it, the Guides they
  are in) with Preview; a business opens its three emails exactly as they go out beside its real page (framed,
  `?preview=1`), where Sean can fix the name or email, take it out of the day or mark it Never email. **Approve this send**
  approves all three emails for that day's businesses. Plan sends proposes days: first send day and businesses per weekday
  (`ve_outreach_plan`, brands first). The first approval in a city sets its 15-day commitment
  (`ve_outreach_cities.committed_until`, shown on the city card): no big changes to the emails or the plan before then.
  An upgrade to what we offer (Sean, 2026-10-10: the free restaurant audit "still falls in the plan, it's just an upgrade
  to the offer") is not a change to the plan and can go into the emails at any time; the commitment guards the plan itself.
- **Two gates before anything sends**: the batch is approved, and the city is on (Turn on sending / Pause sending on the city
  card, `ve_outreach_cities.enabled`, every city off until Sean turns it on). `ve_outreach_due()` is what goes next: approved
  send days whose day has come, then follow-ups when due, never a suppressed address.
- **The sender** (migration `20261010_ve_outreach_sender.sql`, `ve-outreach` `tick`, cron `ve-outreach-send` every 10
  minutes): weekdays 9 AM to 5 PM Eastern only, 6 a tick (a day of 30 goes out over about an hour), within the city's
  `daily_cap` (30) and the domain's warm-up allowance (`email_warmup_allowance`). Each email goes through `email-send`
  (brand `lesaruss`: from Sean A. Russell <sean@mail.lesaruss.ai>, replies to contact@lesaruss.com, one-click unsubscribe,
  the postal address, `campaign_ref` `ve-outreach-<contact>-<step>` so nothing is sent twice) as a plain personal email with
  a small footer. The page link is the business's own tracked link (`ve_links`, `bo-<code>`, campaign `business-outreach`,
  made at its first email). Day 4 and Day 10 are set for 10 AM Eastern on a weekday. Before every tick `ve_outreach_sync()`
  reads what they did: a real click on their link or a reply (not an auto-reply) makes them Interested, a claim makes them
  Joined, an unsubscribe or block makes them Unsubscribed, a bounce Bounced, and a send day turns Sent once everyone in it
  has had their first email. Three failed sends hold a business. Heartbeat: `email_heartbeats` `ve-outreach`.
- **Send me this as a test** (a business's preview, `ve-outreach` `test`): its real email to the signed-in admin with
  [Test] in the subject and the plain page link, so the test click never counts (the ops token can only dry-run it:
  `dry_run: true` renders it and passes email-send's checks without sending). **Interested** (`#interested`, `ve-outreach`
  `interested`): who clicked, replied or claimed, what they did, and who it is routed to.
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
- **People lists: one engine for every brand** (Sean, 2026-10-10: "This should use the same engine we just created for
  Vegans Explore to do outreach. We can select people in our system and add them to the distribution"; migration
  `20261010_ve_outreach_lists.sql`). A `ve_outreach_cities` row is a list: `kind` `city` (businesses, everything above) or
  `people` (people added from HQ > People). A people list has its own `program` (its three emails are
  `ve_outreach_templates` rows with that program; business outreach is program `business-outreach`), `link_url` (where
  `{link}` goes, made into the person's tracked /go/ link at the first email), `footer_reason` ("You are getting this because
  ...") and `brand` (the HQ label), and the same switch, daily cap, send days, approval and sender. A person contact has no
  listing (`segment` `person`, `person_id`, once per list by email); `ve_outreach_render` gives them `{first_name}` and `{link}`;
  `ve_outreach_sync` marks them Joined when they become a paying LESARUSS AI member or start a 111 Day Theory journey after
  their first email. The Depot here shows cities only (`overview` defaults to kind `city`; `interested` to businesses). HQ >
  Distributions works the people lists through `ve-outreach` with the admin token and `as_member` (the owner's super admin
  member id), which is honored only for people lists; `add_people`, `templates` and `template_save` are the people-list
  actions. A people list's emails start as drafts and send only once marked ready in HQ. First list:
  `111-day-theory-founding` (program `111-day-theory`, link `https://lesaruss.com/entry/join?program=111-day-theory`).
  Before and after the migration, `ve_outreach_render` over every business contact and step rendered the same text (md5
  d0864f6f38450faca8768a7f3eb13c86, 234 emails), and the Depot's overview returned the same 9 cities, 3 emails and 2 send days.
- The June 2026 `listing_outreach` queue (the old $11 claim offer, never sent) was retired on 2026-10-10 (`skipped`, note).
- **Cleaning up the Directory from here** (Sean, 2026-10-10: "remove people from the distribution list... move them to the
  closed and move them off the main list... leave a note"). Each business's preview has **The Directory listing**: team notes
  (`listings.details.admin_notes`, `[{at, by, kind: note|closed|logo, text}]`), **No longer in business** (`listing_closed`:
  `business_status = 'CLOSED_PERMANENTLY'`, which the Directory shows only under Type > Closed, never in All, plus
  `details.closed_at`/`closed_by`/`status_before_closed`) and **Use the letter, not this logo** (`listing_logo_letter`: the
  logo is set aside in `details.logo_unverified`, the same way as the Logos rule). However a listing gets closed (here or
  the listing page's admin editor), trigger `trg_ve_outreach_listing_closed` takes it off the email list, and planning and
  Find emails skip closed businesses (migration `20261010_ve_outreach_listing_cleanup.sql`). Send days list brands first,
  then A to Z, so the order never shifts. On 2026-10-10 five businesses the Directory already marked closed came off the list
  before anything was sent, and Darbster's blurry logo was set aside for the letter (Sean).
- **Owners edit their own page** (Sean, 2026-10-10: "go ahead and build the owner page editing"). Any owner of a listing (the
  approved claim makes them `owner_member_id`), with or without a plan, gets **Edit your page** on the Partner Dashboard tab
  (`mountOwnerEditor` in `directory/listing.html`): four steps, one per view (`?tab=brand&edit=about|hours|contact|photos`),
  Back / Step N of M / Save and next: About (the one line and the description), Hours (each day in their own words, empty
  hides it, saved as `google_hours_json` {Day: text}), Contact and links (phone, website, Instagram, booking, Uber Eats,
  DoorDash, street and ZIP), Logo and photos (logo at least 400 px on the shorter side, up to 12 photos at least 1000 px,
  into `vegan-media/media/listings/<slug>/owner-*`, checked in the page and again in the function; an owner's logo replaces a
  set-aside one, `details.logo_source = 'owner'`; photos go to `gallery_urls`, which the page shows). Their name, city,
  category and how Vegan they are stay ours. Changes go live at once (`ve-claims` `owner_page`, `owner_update`,
  `owner_photo_url`, `owner_photo_done`, `owner_photo_remove`), each one a row in `ve_listing_edits` with the value it
  replaced (migration `20261010_ve_listing_edits.sql`), and the account manager (else Sean) is emailed what changed. A new
  partner's page in the Depot lists **Their changes** with **Undo** (`ve-outreach` `listing_edits`, `listing_edit_undo`, which
  refuses when the same thing was changed again since).
- **New partners: onboarding** (Sean, 2026-10-10: "go ahead and build the onboarding"; migration
  `20261010_ve_partner_onboarding.sql`). Every business that claims its page (`ve_listing_claims` paid or submitted, never a
  test) gets a `ve_partner_onboarding` row through trigger `trg_ve_partner_onboarding`: Waiting for your approval, then, when
  Sean approves the claim in Depot > Claims, Welcoming. Approval starts two things. **Automatic**: three emails from Sean after
  ve-claims' own "your page is confirmed" (`ve_onboarding_templates`, rendered by `ve_onboarding_render`): Day 2 make the page
  yours (Edit your page on the Partner Dashboard, or reply with a logo, photos and changes and we do it),
  Day 7 the first week's numbers (views and visitors from `ve_listing_events`), Day 21 what's coming in Q1 and what they want
  to be part of, plus, on Front Row Start, the date of their first charge. **Personal**: the city's Community Manager, or Sean
  when the city has none, is emailed the task (welcome them within 2 days, with their contact details and the checklist), and
  the checklist lives in **Depot > Business outreach > New partners** (`#partners`, `#partner/<listing>`): welcome them
  personally, confirm the page details, get a clear logo and photos on, ask which Q1 campaigns they want in on. A partner is
  Welcomed when it is all ticked; a welcome more than 2 days late shows Late. The same page shows their three emails (sent,
  opened, next) and the listing notes. `ve-outreach` `tick` sends the task emails (any hour) and the onboarding emails
  (weekdays 9 to 5 Eastern). While building it, `ve_listing_claims_tier_check` turned out to refuse tier `brand` (the Partner
  plan), so every Partner claim would have failed to save; widened the same day, before any claim was made.

## For businesses and the sample business (Sean, 2026-10-27)

"Let's remove the VE Verify from Love Life Cafe... it has served its purpose of using it as a template... that also means
removing the partner dashboard... create a fictitious listing that shows like the full soup to nuts page... so that way members
can see what it looks like to have the dashboard without it actually being a real person... Or maybe we have a page specifically
for businesses that is a squeeze page for them."

- **Love Life Cafe is a plain listing again**: its comped VE Verified year is canceled (`ve_verified_memberships` status
  canceled, with a note) and Sean's account no longer owns or claims it, so it is unclaimed like any other place: its Menu links
  to its own menu, and its 51 hand-entered menu items, 4 videos and Pulse post stay in their tables for when the business claims
  it (migration `20261027_love_life_cafe_plain_listing.sql`, run through `ve-once-love-life-plain`, now the 410 stub). No listing
  holds VE Verified now; the badge code stays, dormant, in case it returns with our services.
- **`/business`** is the business page: the Passport Guide (`passport.html`, rewrite in `vercel.json`) with its own tabs when
  the address is `/business` (`BIZ` in the page): Overview, Your page, Your dashboard, Get found (each item Live or Coming),
  Partner plan (Front Row Start), Get started (the Passport, $11 with 1,100 points, which cover a claim; then Find your business,
  `/claim`; with `?listing=<slug>`, from a listing's claim box, it claims that listing). Send a business here whenever we ask
  it to join or do something. The Passport's For businesses tab and the ad
  rail's Your ad here link to it. The old Passport Stop / Anchor page ($250 a quarter, the one-thing services) moved to
  `/business/stops` (`business/stops.html`; `/claim` and Depot > Services and Verified link there).
- **`/business/sample`** is the sample business: the real listing page (`directory/listing.html`, rewrite in `vercel.json`) in
  demo mode (`demoSrc`), fed `/business/sample/listing-demo.js`. Green Leaf Kitchen is invented (the same sample business as
  `/claim`'s previews), never a database row, marked Sample with `noindex`. Its bar switches **A visitor** / **The owner**
  (`sampleView`); The owner, Claim Listing, or `?tab=brand` open **Your dashboard**, the real business dashboard
  (`VEPartnerDash.mount` with `call`, answered by the demo file's `dashboard()` on seeded sample numbers, and `onJoin`); anything
  that would save says so in a toast, and joining goes to `/business#/start`. Its logo and four photos (`business/sample/img/`,
  made in Higgsfield 2026-10-28, illustrative like the restaurant) are on the page and its Photos tab, so its dashboard's Get your
  page ready shows them done. A listing's photos (`gallery_urls`) may be full https links or paths on this site.

## Content index (Sean, 2026-10-10: "go ahead and start on the content index")

Ten years of our episodes and interviews searchable by topic with timestamps, so a Guide can play the exact moment: "dairy"
returns every moment across every show, who said it, a quote, and a play button that starts at that second. Three steps:
1. timestamped transcripts, 2. moments tagged by topic (the Background writer, like the Daily Pulse), 3. search and clips.

- The episodes are `ve_pulse_content` rows with `podcast_show`: 278 on 2026-10-10 (Vegans Explore Podcast 169, SoFlo Vegans
  59, Vegans Who Lift 31, Pre-Vegans 19); 223 have a `youtube_id`. 30 SoFlo episodes have an untimed `transcript`.
- Step 1 (built 2026-10-10): `ve_content_transcripts` (one per episode: `segments` `[{s, e, t}]` in seconds, `text`, `source`
  youtube | youtube_auto | turboscribe | manual; migration `20261010_ve_content_index.sql`) and the edge function
  `ve-content-index` (admin token): `youtube` / `youtube_batch` read an episode's YouTube captions, `srt` saves an SRT file
  (TurboScribe's timestamped export), `status` counts by show (`ve_content_index_status()`), `probe` shows what YouTube
  returns to the server.
- YouTube refuses our server: the watch page answers with Google's "unusual traffic" page (429) and the player API with
  "Precondition check failed" (probed 2026-10-10). So server-side caption reading does not work; the transcripts come from
  TurboScribe (Sean's account, $20 a month, takes YouTube links) as SRT files, or from YouTube's own API once the channel
  owner authorizes it (needs the YouTube Data API on the Google Cloud project and a sign-in per channel; nothing is set up).
- **Depot > Content index** (`/admin/depot/content-index`, built 2026-10-10 when Sean subscribed to TurboScribe): each show's
  progress (timestamped of all, hours) with **Copy the YouTube links** still waiting (for TurboScribe), a drop box for SRT files
  or a ZIP of them (JSZip, `__MACOSX` skipped), and the episode list (search, show, Waiting or Timestamped). Dropped files are
  matched to an episode by `ve-content-index` `match` (Sean, 2026-10-10: "look at the transcript to figure out the title"): the
  show initials and episode number in the file name (SFV 012, VWL S5E7, PV E16, VEP 45; `codeOf`), then the title's words heard
  in the opening (a guest's name counts far more than common words), line-for-line overlap with an untimed transcript we already
  hold, and "episode 12" said early (Good match, Check this, Skip). The review view (`#review`) lists the ones to check first,
  each with its opening lines, the top three suggestions and a search box (a guest, a topic, "SFV 12"), and Save sends each through
  `ve-content-index` `srt` (source `turboscribe`, and the file's name in `ve_content_transcripts.file_name`). Nothing is dropped
  silently (Sean, 2026-10-10: 50 files dropped, 34 saved): a file whose transcript is already saved says so (`match`
  `saved_as`, from the transcript's opening, `head`) and stays out, two files set to one episode block Save, and files left on
  Skip stay on the screen after Save with a note. Drop the whole folder again any time; only the missing ones need a look. The episode list runs in each show's number order (Sean,
  2026-10-22: "sort the podcast episodes for the shows by number. This way I know what didn't upload"), each row with its code
  (VEP 41, SFV 12, PV 5, VWL S5E7) from `ve_pulse_content.episode_number`. Vegans Explore episodes are numbered by release from
  2025-11-01, leaving out the two "South Florida Vegans" cross-posts; Sean's TurboScribe files VEP 0041 to 0070 matched those
  numbers one for one. Two exceptions found 2026-10-23 when VEP 0078 to 0090 landed one episode off: "Moving Medicine Forward:
  Why Nutrition Belongs at the Center" (2026-01-16) is the same YouTube video as #77 and has no number, and Sean's 93 (2026-02-01)
  is not in our list, so 78 to 92 run by release and 94 onward line up again (#100 is "100 Episodes"). On the review screen,
  picking an episode another file holds takes it and sends that file back to Skip with a note, and episode search takes a
  number (VEP 88). Same day, after two files were both named VEP 0095 (Juicy Marbles and Jason Kartalian) and two Klaper files were
  named "03": a number in a file's name counts in full (0.75) only when the opening agrees with that episode's title or
  summary, else 0.4, so the opening wins a disagreement; a bare number with no show code counts for nothing. When two files
  still land on one episode, the stronger match keeps it and the other moves to its next best free episode (0.35 or more),
  marked Check this with why, and a file whose name says another code than its episode says so. Replacing a saved
  transcript is never a guess ("Dr. Klaper Podcast 02" had replaced #27's transcript): below 0.75, a file whose best match
  already has one goes to its next best free episode, or waits on Skip, with a note; picking it by hand still replaces. The 26 Brooke & John episodes from May 2024 to January 2025 are Vegans Who Lift, not Vegans Explore
  (relabeled 2026-10-22). The function takes a signed-in super admin for `status`, `episodes` and
  `srt`, and the admin token for everything.
- Step 2, moments by topic (started 2026-10-23, Sean: "you can start step two now, and I'll continue uploading"; migration
  `20261023_ve_content_moments.sql`, playbook `ve-content-index` in HQ). The Background writer (dispatcher source
  `content_moments_tag`, Station 2, batch 3, on the subscription) reads each transcript (`ve_content_transcript_lines`) and saves
  its moments through `ve_content_moments_save(content_id, moments)`: start and end second, speaker, the quote word for word,
  a one-line summary, one to three topics from `ve_content_topics` (42 slugs; add a row to add a topic). The save checks every
  moment (topics on the list, times inside the episode, 15 seconds to 10 minutes long so a clip plays as a whole thought, Sean
  2026-10-23; the quote really said within 30 seconds of the start) and returns the
  rejected ones with why. A transcript is queued (`tag_status`) whenever it is saved, replaced or set ready, so Sean's drops are
  tagged on the next run. Nothing is deleted: each save is a run (`run_id`), the transcript points at its latest (`moments_run`),
  and `ve_content_moments_live` is what counts (ready transcripts, latest run, with the episode's title, show, number and
  YouTube id). Proven 2026-10-23 on Vegans Explore episode 1 (7 moments; a made-up quote and an off-list topic were refused).
- Step 3, search and clips (started 2026-10-23, Sean: "start step 3"; migration `20261023_ve_content_search.sql`). In
  **Depot > Content index** first, so Sean can judge it before members get it: **Search** (`#search?q=&topic=&show=`, a card
  on the home view with the moment count) finds moments by words and topic, best match first (`ve_content_moments_search`,
  Postgres text search over the summary and topics, then the quote, then the speaker and title; `websearch` syntax), each
  card with its episode code, summary, speaker, quote, topics and Play; a **moment** (`#moment/<id>`, `ve_content_moment_get`)
  plays that stretch in the YouTube player (`youtube-nocookie` embed with `start` and `end`) with Keep watching on YouTube and
  the rest of the episode's moments beside it. Topic counts and tagging progress: `ve_content_topic_counts()`. `ve-content-index`
  actions `topics`, `search`, `moment` (super admin or the admin token). Not yet: members' search and the Guides' Pulse tabs
  playing moments; episodes not on YouTube cannot play.

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

## Registration is the Passport (Sean, 2026-10-27)

"People can view everything without logging in. He probably wanted to become a Passport member and was just given a free
membership. Let's fix that so they can only register through the Passport program." (Joshua Mattey had made an account with
Continue with Google, closed the $11 window and kept a free account.) There is no free account any more:

- An account that has not paid (`membership_status` `pending_payment`) is only the checkout's account. `VEAuth.isLoggedIn()` is
  false for it (`isPending` in `/public/ve-auth.js`), so every page treats it as signed out; its token is kept only to pay.
  Making an account (email or Google) or signing in to an unpaid one goes straight to the $11 Passport window ("One step left:
  your Passport..."), and closing that window signs them out (`hideActivateModal`). The sign-up tab reads **Get your Passport**
  and its button **Continue to checkout**, except on a page that finishes the join itself (`VE_ACTIVATE_HANDLER`: an invitation,
  a dinner seat, a Guide's own $11), where they read Create Account. `/login` does the same for both sign-in paths.
- The server agrees: `ve-auth` sends the welcome email only to an account that is active at sign-up (an invited one); the
  webhook's "Your Passport is active" is everyone else's welcome. Guide chat refuses an unpaid account (`payment_required`, no
  monthly allowance). Participation was already gated (`requireActiveMembership`).
- Still working as before: Join the Directory makes the account and goes to its own $11 or Partner checkout; a Guide's $11 makes
  the buyer a member; any $11 purchase admits (`ve_member_admit`). 12 unpaid accounts existed on 2026-10-27; they meet the
  Passport window at their next sign-in. "Free Passport" and "free account" left the site's words the same day.
- **The one other way in is an invitation on us** (Sean, same day: "I do want the ability to invite people to give a
  complimentary account with points of my choosing"): **Depot > Invites** (`/admin/depot/invites`; People in the Go to menu),
  one view at a time: the list by status (`#list/<status>`: Not sent yet, Sent, Opened, Joined, Expired, Canceled), **New invite**
  (`#new`: one person a line, "Name, email" with an optional number for that person's points; Points for everyone, 0 to
  100,000, quick picks None, 1,100, 2,500, 5,000, 10,000; a line from Sean that opens the email), and one invite (`#invite/<id>`:
  the email exactly as it goes, **Send it from me**, **Copy the link**, **Cancel it**). Nothing is sent until Send. The points are
  `universe_invites.points`, granted once at the claim through `ve_points_grant` (`comp_membership`, ref `invite:<id>`; migration
  `20261027_invite_points.sql`); the email and `/invite` say "on us, with N points to start". An email whose account never paid
  can be invited (they sign in on `/invite` to accept); a paid member is left out ("Already a member"). `ve-invites` `list` feeds
  the page; HQ > People makes the same invitations with `points`.

## Ambassadors (Sean, 2026-10-27)

"I want him to be an early ambassador and share it with other people. Let's actually give him an Ambassador account. Once I use
the invite option, it should create an onboarding for Ambassadors. The points amount will be set by me during the invite
process." (Migration `20261027_ambassadors.sql`, run through `ve-once-ambassadors`, now the 410 stub.)

- An **Ambassador** is a Founding Member whose job is to bring people in: `members.ve_role` `ambassador` (the check widened), with
  `founding_member` true. The dashboard calls them Ambassador and puts **Your Ambassador link** first in Your tools.
- **Invite one**: Depot > Invites > New invite, What it is: **An Ambassador** (the default) or **A membership on us**, with the points
  Sean sets (`universe_invites.points_to` `ambassador`). The email asks them to be one of the first Ambassadors; accepting makes
  them an active Founding Member and an Ambassador (never over a staff role) with their points, and opens the onboarding.
  Every comped claim is a Founding Member (`universe_invite_claim`).
- **The Ambassador Guide**, `/ambassadors/welcome` (`ambassadors/welcome.html`; Sean, 2026-10-27: "everything should really be like
  a guide... Create it like the Passport but tailored to someone who has been hand selected to join the community because of their
  contributions to the movement"): the Passport Guide's layout (tabs are the tour, a Guide's picture and words on the right, Back / N
  of M / Next, their points and Copy your link in the header), ten tabs (`#/<tab>`): Overview (You were hand selected), **Why it matters** (Sean, 2026-10-27: "Did it really explain to him why being
  an ambassador matters?... he doesn't need money... He probably just wants to support the community": local places get found
  through member votes and vetting, the city comes alive, the $11 keeps the community running, their voice carries, and points as
  support they can give away; the points are a footnote everywhere, never the pitch; then, the same day, "balance the conversation
  between what we're doing in a lifestyle side of things and what we're doing to provide support for the animals": two halves,
  For the animals (rescues and sanctuaries found in the Community section, the Fosters and Rescues boards, points given to
  organizations, and campaigns behind the cause marked Growing) and For the community; Your role and Who to invite carry the
  animals' people too), Your
  membership (on us, points, level, what points do), Your role, Your city (home chapter, `set_home_community`, its hub, Pulse and
  Events), Your link (`/passport?ref=<referral_code>`, the four steps to the 111 points), Who to invite, What to share (four messages
  with their link), Answering questions (straight answers, do and don't), Your progress (`ve-auth` `referrals`: members and waiting
  accounts who signed up with their link, first name and last initial, and the referral points paid). Old `?step=1..4` links land on
  the matching tab. For Ambassadors and super admins only; the dashboard's tile is The Ambassador Guide. No Higgsfield art or clips. The Overview's tiles wear flat line icons (`ICONS`), never Guide pictures (Sean, 2026-10-27: "I don't like the guide icons... Liz in the
  corner... works well").
- **Community Managers are never volunteers** (Sean, 2026-10-27: "we're for profit and we intend to pay them. More like gig work"):
  the site's words call it gig work, paid as the community grows (the Passport's What your $11 supports, the Ambassador Guide, the
  brand tour's slide 6). Maya's line on that slide was re-recorded voice only on 2026-10-28 (below).
- **Voices, not animation, for tours** (Sean, 2026-10-28: "we could still have the voices, but the animation I don't think is
  necessary... save the animation for the guides"; a lip-synced clip is about 20 to 25 Higgsfield credits, a voice line none). A brand
  tour slide can be `{audio, poster}`: her voice over the slide's still picture, beside clips on the other slides (`voiceAt` in
  `loadBrandSite`). Oatly's slide 6 is `brand-door/oatly/v6-slide-6.mp3` (el-media `tts`, Maya's voice, levelled to the clips, about
  -13.5 LUFS, a 0.25 s lead-in; checked word for word with `stt`), the old clip kept in `replaced`. New tour lines are voice only;
  a Guide gets at most one animated welcome.
- **Referrals pay when the friend becomes a member** (111 points, `points_earn_rules` `referral_signup`): trigger
  `trg_zz_referral_on_admit` on `members` (insert or `membership_status` turning active) through `award_points_bounty`, once per
  friend; `ve-auth` no longer pays at sign-up, since an unpaid account is not a member. Continue with Google now keeps the `?ref=`
  too (`loginWithGoogle` sends it; `ve-auth` `google` sets `referred_by`).
- **Joshua Mattey** (joshmatteymgl@gmail.com, signed up 2026-10-27 with Google) was made an active Founding Member and Ambassador
  with 1,100 points directly (ledger `comp_membership`, ref `sean-2026-10-27`); Sean tells him on a call. He signs in with Google.
- Not decided yet (Sean's call): what an Ambassador earns beyond the referral, and any Ambassador-only perks or levels.

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
- Contribute any time: active members have a Contribute tile in the dashboard's Your tools and a Contribute link in the
  nav's account menu, both opening the same window (`/dashboard?contribute=1`; ve-entry-checkout, $11 or more). It left
  the dashboard header on 2026-10-26 (Sean: "we don't need it to be in that top part"). "Member since" (`entry_paid_at`) never moves for an active member. Always a
  contribution, never a tax-deductible donation.

## Explore and the Directory (Sean, 2026-10-04)

The homepage hero offers two ways in: Start Your Journey (the Passport Guide, `/passport`, since Sean 2026-10-26;
the guided tour stays at `/welcome`, which the footer's About opens) and Explore Now (`/explore`), a one-screen overview for visitors who want to look around first: Guides,
Directory, Communities and Community Board cards, the $11 Founding Membership, and a link to the tour.
Log In stays in the nav. Explore cards use our illustrations, never photos.

`/directory` is open to everyone again (it was locked to super admins and redirected to
`/communities`). Anyone can browse, search and see vote counts. A signed-out Vote first opens a small window (Sean, 2026-10-26: "a prompt
that explains why they're going to the passport page"): Members only, Voting is for Passport holders, why it matters, **Explore
the Passport** (`/passport?from=vote&back=...`), Not now, and Sign in for members (`/login?next=...`). Voting again too soon opens
the same window: You've voted for this one today, with when the next vote opens in the visitor's time zone, and Got it. A
signed-out Save gets the same window for saving (Sean, 2026-10-26: "do the same for the save button"; Saving is for Passport
holders, `/passport?from=save`, where the Passport Guide shows a Saving is for members note), and so does a signed-out Check in
(Check-ins are for Passport holders, 10 points a visit, `/passport?from=checkin`); checking in again the same day opens
You've checked in here today, with when the next one opens (midnight Eastern, in the visitor's time zone); a signed-out Give
(the Give points box) opens Giving points is for Passport holders (`/passport?from=give`). They are
`VEVotes.passportPrompt()`, `VEVotes.savePrompt()`, `VEVotes.checkinPrompt()`, `VEVotes.checkedInPrompt()`, `VEVotes.givePrompt()` and `VEVotes.votedPrompt(next)` in `/public/ve-votes.js`, styled like the $11 window in `ve-auth.js`;
the Directory cards, the listing page and `nav.js`'s members-only gate (for `.vote-hero-btn` and the phone's sticky vote) all
use them (Save: the listing's Save and the phone's sticky save). The Guides' Save buttons show only to the Guide's owners. Since 2026-10-25 `/passport` is the Passport Guide, no longer a redirect to `/welcome`.

The Directory runs on `/public/ve-region-directory.js`, the same component as the city hubs (rebuilt
2026-10-04 after an audit; the old page had its own out-of-date sections, region list and copy). One
component means the sections, badges, vegan filters, search, the public vetting rule
(`/public/ve-trust.js`) and the hidden `lesaruss-ai-directory-candidate` listings match everywhere:
change the Directory there, not in the page. The page adds a city picker from `VE_HUBS`
(`/public/ve-hubs.js`), a hero with that city's art (New York for all cities), `?city=<hub slug>` and
`?tab=<section>` in the address bar, and the Founding Membership box for non-members.

Chapters a listing serves (Sean, 2026-10-24: Florida Animal Rescue Alliance "covers the entirety of Florida... PETA, that
would be a global organization. It could have its headquarters notated, but it should show up in all the community
sections"). The address puts a listing in its home chapter; `listings.communities` adds more (hub slugs from `VE_HUBS`, or
`all` for every chapter, new ones included; migration `20261024_listing_communities.sql`). `ve-region-directory.js` shows a
listing in a chapter when either says so (callers pass `hub: <slug>`), the card reads like a brand, by its reach, never its headquarters' city (Sean, 2026-10-27, Be An Animal Hero "still says Jupiter"):
Every chapter, All of Florida (every chapter of a state with more than one), the two chapters by name, or N chapters (`reachOf` in
`ve-region-directory.js`). Statewide and national organizations were set the same day: Florida Animal Rescue Alliance and the
Muscovy Sanctuary of Florida all of Florida, sixteen national advocacy groups (Animal Welfare Institute, IFAW, Farm Animal Rights
Movement...) every chapter, and the listing page adds "Serves every chapter" or "Also serves Central Florida". Set it in the listing
editor's Chapters section (`ve-listing-admin.js`, saved by `ve-claims` `admin_listing`). Passport Challenge and Tours stops
still go by address.

Vetting (Sean, 2026-10-25: "they're not all vetted... it requires 10 different people, not one person 10 times... Otherwise,
it's just... in its own section that only shows up for members... I can overrule that"). A Vegan-friendly or Vegan-options food
place (Restaurants, Bakeries & Cafes, Food Trucks & Vendors, Catering, Meal Prep; brands and markets never) is public only once
10 different members vote for it (`listings.voter_count`), its business claims it, or a super admin ticks **Vetted by us** in
the listing editor (`listings.vetted_at`, `ve-claims` `admin_listing` `vetted`). Until then it sits in the members-only **Being
vetted** section of the Directory and every hub (`vetting` in `CAT_CONFIG`, closest to 10 first, each card with "N of 10 member votes" on its own line under the details) and its page asks visitors to
join. The rule is `/public/ve-trust.js`, switched on and its number set in `ve_site_settings` `directory_trust` (Depot > Claims);
migration `20261025_directory_vetting.sql`.

Directory review (Sean, 2026-10-25: "have these businesses quarantined in a place where I can go through them manually... I
just wanted to remove and not even mark as permanently closed... the idea of permanently closed is I would like people to be
able to look at those from a nostalgic point of view"; migration `20261025_directory_review.sql`). Every listing has four
outcomes, all through `ve_listing_set_state` (Depot > **Directory review**, `/admin/depot/directory-review`, `ve-outreach`
`listing_state`; the listing editor's Hold for review and Remove buttons): **on the Directory** (status approved), **On hold for
review** (status `pending`, `details.review` with the reasons), **Removed** (status `rejected` with `details.removed_*`: off
everywhere, not under Closed, never deleted, put back from the Removed list) and **Permanently closed** (kept under Type > Closed,
for memory). Never use Permanently closed just to take a listing down. Red flags (`ve_directory_review_flags()`): Google says it
is closed, the monthly check-up's closed or quiet flag, no socials, no hours, no street, no website, a website that does not
open (a site that only blocks our scanner does not count). The strong ones (Google says permanently closed, the check-up flag, or
no socials with no hours or no working website) are held every night by `ve_directory_auto_hold()` (cron
`ve-directory-auto-hold`, 08:30 UTC), never a claimed or owned listing; one Sean puts back stays off the list for 90 days
(`details.review_ok_until`). Off the Directory also takes it off the email list (`trg_ve_outreach_listing_hidden`).
Fix it there too (Sean, 2026-10-25: "right now it's allowing me to review but not fix... I want to be able to input it here so it
updates the listing and unflags it"): a listing's **What it shows** is a form (about, website, Instagram, Facebook, TikTok, phone,
street, ZIP, menu link, each day's hours; missing ones marked), saved by `ve-outreach` `listing_fix` (only what changed, each a
`ve_listing_edits` row, `details.fixed`), with **Save and put it back on the Directory** for a held one. A new website clears "The
website did not open" (the flag counts only for the site the check-up read); a menu link goes to `listings.menu_crawl_url` and
queues `ve_menu_imports` with that `menu_url`, where the Background writer starts (migration `20261025_directory_review_fix.sql`).
The form also sets the **Kind** (any Directory sub-section) and **Online only, no storefront** (Sean, 2026-10-25, Axiology: "an
online beauty and personal care brand... they wouldn't necessarily be a listing with hours of operation"): the street, city, state,
ZIP and map pin come off (`location` Online, the same as the listing editor's Online only), it shows in every chapter, and with no
city it is never flagged or held again; a held one drops No hours and No street address. The menu link shows for food places only.
**Being vetted** is a list there too (the food places waiting on member votes) with **Vetted by us** (`listing_vetted`). The
Directory and every hub also have a **Review** tab for super admins (Sean, 2026-10-25: "could we have a review tab that has all of
those features in there, just so I'm doing it from one place? Because I rarely go into the depot"): `review` in `CAT_CONFIG`
(`adminOnly`, `frame`), which frames Directory review without its nav, footer or Depot header (the page hides them when its
parent is `/directory` or a hub) and grows to fit (depot-tabs.js `ve-frame-height`). Every card shows admins **Edit** and
**Review**; Review opens that listing in the Review tab (in Being vetted when it is waiting on votes), and the listing editor has
Open in Directory review.
Adding listings (Sean, 2026-10-27: "I'm not sure exactly how I would do that"). Directory review's home has **Add a listing**
(`#add/1` to `#add/5`, one step per view): Find it on Google (name and where, `ve-discover` `add_search`: up to six Google places
with address, phone, website, hours and pin, each marked if already listed), or fill it in by hand. **Find it also takes a link and
screenshots** (Sean, 2026-10-27: "I typically find a lot on Instagram... add a field for the URL... upload an image, like a
screenshot"): the link (an Instagram profile, read through Apify, or any page, read as text with its structured data and social
links, plus the site an Instagram bio links to) and up to three screenshots (dropped, pasted or chosen, shrunk to 1600 px in the
browser) go to the edge function `ve-listing-intake` (`read`, super admin; Claude Opus 5.5, structured output, only what the sources
show), which returns **What we found** (name, kind, how Vegan, address, phone, website, socials, hours, about, a note on where each
came from) and the Google search to run. Pick its Google listing (what Google leaves empty is filled from what we found) or **use what
we found**; its Instagram picture joins the logo choices, and What it is offers the suggested kind and How Vegan with Use it, never
picked for you. Nothing is saved until Add it. Proven 2026-10-27 on an Instagram link (14 s), an Instagram screenshot (4 s) and a
website (9 s); The details (all of it
editable, Online only, and their Instagram, Facebook and TikTok, filled from the links on their own home page, `add_site`, Sean
2026-10-27: "you should be able to pull their social media"; builder template links like facebook.com/wix are skipped); **Logo**
(the logo editor below, with up to four pictures from their website to load into it, an `<img>` that says logo, the app icon,
the share picture or the page icon, SVGs included; left empty, the first letter); What it is (the kind and how Vegan, both picked on purpose, "Not a Vegan business" for a store or service;
an optional about); Add it (`add_create`: live at once, refused as `already_listed` with the slug when the same Google place or name
and city is on the Directory; a business waiting in the backlog with the same place goes live instead of a second copy;
`crawl_source` `admin`, `details.added_by_hand`, a team note). The nightly essentials pass fills what is still empty. **Paste a
list** (`#paste`, `paste_list`, up to 200 lines): one business a line, "Name, City, State" or an Instagram handle; each becomes a
quarantined listing (`crawl_source` `paste`, `details.pasted`) and a `ve_backlog_checks` row, checked by the backlog cron like the
import backlog and waiting in Business outreach > New places to add or set aside. Nothing pasted goes live on its own; a line
already on the Directory or in New places is left out and listed.
**Logos** (Sean, 2026-10-27: "a review of any business that doesn't have a logo... I could just drop whatever image that I find
and then you do that for me... crop it and size it so it looks good, maybe drop a background in it if it's a transparent image";
266 of 490 open listings had none that day). Directory review's home has **Logos** (`#logos`, `ve-discover` `logo_queue`: every
open listing with no logo, most voted first, search and city) and one listing per view (`#logo/<id>`): links to look on (their
website, Instagram, Facebook, Google Images, and the logo we set aside on 2026-10-10 when there was one), then the **logo editor**,
`/public/ve-logo-editor.js` (`VELogoEditor.mount(el, {fetchUrl, onChange})`): drop a picture, choose a file, paste one (Copy image,
then Ctrl+V), drag one from another tab, or paste its link (fetched server side by `logo_fetch`, JPEG, PNG, WebP, GIF or SVG, so the
canvas is never tainted); an 800 x 800 square to drag, zoom (slider or wheel), Fit, Fill, Trim edges and Center; the background
fills what the picture does not (Match its edges by default for a solid picture, white for a transparent one, black, our green or
any color); a preview at card and listing size. **Save and next** uploads the square as a JPEG (`add_logo_url`, staged in
`vegan-media/media/listings/_new/`) and `logo_set` copies it to `media/listings/<slug>/logo-*` (never hot-linked; under 200 px on
the shorter side is refused), sets `details.logo_source` admin and `details.logo_checked`, moves a set-aside logo to
`details.logo_replaced`, and logs a `ve_listing_edits` row (field `logo`). **The letter is fine** (`logo_skip`,
`details.logo_letter_ok`) takes one off the list; Skip for now leaves it.
The listing editor's **Upload a logo / Replace the logo** (`ve-listing-admin.js`, every Edit listing button; Sean, 2026-10-27: "Can
we implement that into the replace logo button?") opens the same logo editor under the logo, with the logo as it is loaded in, and
links to look on (their website, Instagram, Facebook, Google Images); **Save logo** saves it the Logos way (`add_logo_url`,
`logo_set`), so it shows in Logos > Done. Copy it into our storage and Remove stay as they were.
**The listing editor follows what it is** (Sean, 2026-10-27: "the main section... should come after the logo... based off what you
choose, the next part populates"). Name, Logo, then **What it is** (main section, sub-section, Also show it under); nothing more
shows until a main section is picked, and Save asks for one. Media (Podcasts, YouTube, News Outlets, Other media, Documentaries &
Films, Books) hides Location, Locations, Chapters and How Vegan, is saved as every chapter (`communities` `['all']`), its address
left as it is; a brand hides Locations. Only the parts shown are sent to `admin_listing`. `business_status` keeps its three values,
in the kind's words (`kindOf` and `STATUS` in `ve-listing-admin.js`, `STATUS_WORDS` in `ve-region-directory.js`, `statusWords` in
`directory/listing.html`; change all three): a place Open / Temporarily closed / Permanently closed, a show Active / On hiatus (never
Ended), a book or film Available / No longer available, a brand In business / Paused / Out of business.
**The logo sweep** (Sean, 2026-10-27: "do a sweep and see which ones you can do similarly... so I'm not going through all 200...
the clean logo, no food in the background, just the actual logo"; migration `20261027_ve_logo_suggestions.sql`). Cron
`ve-logo-sweep` (every 5 minutes, `ve-discover` `logo_sweep`, five listings a run, each looked at once) gathers each listing's
logo pictures from its website (`readSite`) and its Instagram profile picture (Apify), and shows up to five to Claude (Opus 5.5,
structured output) with the business's name: it picks the business's own clean logo (never food, a storefront, people, a logo
inside a photo, a builder's or a platform's icon, or another business's logo) or none, and the background to square it on
(`match`, `white`, `black` or a color). The pick is a `ve_logo_suggestions` row (found, none, used, rejected), never saved to the
listing by itself. One it found nothing for is looked at again 30 days later (a check that did not run, a day later; `relookDue`),
never-looked-at ones first; a used or turned-down pick never comes back. **Chains share one logo** (Sean, 2026-10-28: honeygrow's
14 locations got 14 different picks, the faint ones "broken"; "same business, different location. It should have the same logo"):
before every sweep and after every logo saved, `chainFill` gives a listing with no logo the logo we hold for the same business (its
main listing or another of its locations, or a listing with the same website or Instagram and the same name, `siteKey` and
`chainName`), in Suggested as "The logo on <name>, <city>", with no new pick. The pick itself never takes a faint, low-contrast or
tiny logo, and prefers a clean Instagram picture over a website's share picture. **Look now** (Sean, 2026-10-28: "is it possible... for me to
trigger the push?") on every Logos tab runs the sweep on the next ten at once (`logo_sweep` takes a super admin too), and the head says
how many are waiting or when the next look again is due (`logo_queue` `sweep.relook`, `sweep.next_relook`). Logos has two tabs: **Suggested** (`#logos/suggested`): every pick squared in the browser by
`VELogoEditor.auto` (the editor's own trim, fit and background), ticked by default, **Save the N ticked** saves them all through
`logo_set` (`from_suggestion`, the row turns `used`), **Adjust** opens it in the editor already trimmed and on its background
(`#logo/<id>/s`), **Not this** (`logo_suggest_reject`) sends it to To find; and **To find** (`#logos`): the rest, each with what the
sweep said and the pictures it looked at (SVGs included, which Claude does not read) to load into the editor.
**Done** (`#logos/done`, Sean, 2026-10-27: "Is there a way that I can see what logos have been created... I want to do some quality
control"; `ve-discover` `logo_done`): every logo made here (`details.logo_checked`), newest first, each at full size and at card
size, with who saved it and when, From the sweep when it was a sweep pick, and **Redo** (`#logo/<id>/redo`: the logo as it is,
loaded into the editor; saving replaces it) and **Remove** (`logo_clear`: the letter again and back on To find, the old logo kept in
`details.logo_removed`, a `ve_listing_edits` row, a sweep pick marked rejected so it does not come back to Suggested).

Member check-ins (Sean, 2026-10-25: "making a way that members can verify listings... every time they check in, they can get
like 10 points... We can see a record of how many people are actually visiting, which members are visiting... if a business
wants to run a campaign with us, we can target those people first... an ongoing bounty that stays there"; migration
`20261025_ve_checkins.sql`, edge function `ve-checkin`). A member taps **Check in** on a listing's page while there
(`directory/listing.html`, shown where the listing has `latitude`/`longitude`, which `ve-restaurant-audit` `essentials` fills from
the Google place): the phone's location must be within 150 m (plus up to 100 m of its own uncertainty; a fix worse than 500 m
is refused), once per place a day (Eastern), 10 points for up to 5 places a day, more recorded at 0 (`ve_checkin_save`, rows in
`ve_checkins`; points move both balances, `points_ledger` reason `checkin`). Who sees what (Sean, 2026-10-25: "Only registered member
businesses who've claimed their listings can see that information... You can choose... in your settings, whether you want
people to see where you've checked in. So we can leave it on by default"): the public sees counts only ("Member check-in N
days ago · N members this month", `ve_listing_checkins`); members also see "Recently here: Sam R., Maria L. and 3 more", only
members who leave **Show my check-ins to other members** on (My Account > Privacy, `members.show_checkins`, on by default,
`ve-checkin` `privacy`); the owner of a claimed listing (claim approved, member or plan) sees everyone, whatever the setting,
on the business dashboard's **Check-ins** view (`ve-claims` `owner_dashboard` `checkins`: last 30 days, members, who comes
back, every check-in); the team sees who in Depot > Directory review (`review_get` `checkins`). The rows are the list for
targeting a business's promotions. A check-in in the last 30 days keeps a place from
being held automatically. On `/bounties` it is the always-open first card in every city (**Check in where you go**,
`?campaign=check-ins`): how it works, Open the Directory, and the member's own check-ins (`ve-checkin` `mine`).

On a city hub the banner bar's crumb is a community picker (All cities, then each `VE_HUBS` city; Sean, 2026-10-25): a city
keeps the section you are on, All cities opens `/directory` from the Directory section, else `/communities`. No "Communities /"
before it, so it fits a phone (Sean, 2026-10-25). The hub's hero buttons (Sean, 2026-10-25: "anybody can be a part of any
community"): signed out, **Get Passport** (`/passport?community=<slug>#/join`) and **Page tour** (the hub's spotlight tour,
`ve-tour.js` `hub`), with a Preview badge; signed in, **Dashboard** (`/dashboard`, the green button) and **Page tour**, the badge
Member for an active member. The bar under the hero (Sean, 2026-10-26) is the city picker on the left and Collapse on the right,
one row at every width, nothing else in it (no Get Passport, no Dashboard, no Page tour). Under the title, the hero rotates the cities that have open Directory listings at an address in the hub,
three at a time, most listings first, fading every 4 seconds and looping (Sean, 2026-10-25: "as new ones are added, it will update
that automatically"; `heroCities` in `hub.html`); three or fewer cities keep the hub's written areas (`VE_HUBS[].page.regions`,
South Florida's are its counties). The hub passes an axe-core WCAG 2 AA check at phone and desktop width (2026-10-25): muted text
`--ve-text-50` is 0.68 black, `.btn-join` is the dark green, the hero's words carry a soft shadow over the photo, and the
nav's Join button has dark text on its bright green (`public/nav.js`).

Listing pages (Sean, 2026-10-25: "every listing needs to have a background... we need to make sure that their contrast is ADA"):
every listing's header wears city art (`heroArt` in `directory/listing.html`): the city its address is in by `VE_HUBS[].match`
(`page.banner`), else South Florida's art, under a dark overlay never lighter than 0.8, so every header line holds WCAG AA on the
brightest pixel of any picture (checked 2026-10-25 on South Florida, New York, Atlanta, DMV and a listing with no city; the
tagline is the tightest at 4.7:1). A new city's banner must pass the same check. Anyone who is not a member also sees the
Directory's **Your votes rank them** box at the foot of the page (`.lv-vote`), opening the Passport Guide
(`/passport?from=vote&back=...#/join`). Signed out, `nav.js`'s members-only gate sends a gated click to `/passport` (back here
after sign-in), never the old sign-in pop-up, and lets any link that already goes to `/passport` through.

Directory filters (Sean, 2026-10-24: "the sort menu should be custom to each one"). `/directory` opens on the full banner
and folds it to one bar (city picker, Directory home, Submit listing, Expand) after the first click into a section; Collapse/Expand is
kept for the visit (`sessionStorage` `ve_dir_hero`). Every city filters by region (`VE_HUBS`), then that region's cities; a
listing counts in a region by its address or the chapters it serves (`data-hubs`). **Every section opens on its first
sub-section and All comes last** (Sean, 2026-10-26: "all now goes to the back of the line"), which let **Food Brands come back
to Food**: Restaurants, Bakeries & Cafes, **Food Trucks**, **Vendors** (apart since 2026-10-27, Sean: "you might be just looking for a food truck"), Food Brands, **Nutrition & Supplements** (new: supplement and
nutrition brands, sold everywhere, so no location filter; Brand Partner like a Food Brand), Markets, Catering, Meal Prep.
Products is Fitness and Athletics, Clothing and Fashion, Beauty and Personal Care, E-Commerce & Marketplaces; **Services** is Health and Wellness, **Health Professionals** (doctors, dentists, dietitians and nutritionists, chiropractors, therapists and counselors, other practices: `details.health_type`, a **Practice** filter, `HEALTH_TYPES` in `ve-region-directory.js`, `ve-listing-admin.js` (the editor's Kind of practice) and `ve-listing-media`, which saves it), Coaches and Consultants, **Animal Care** and Marketing & Growth, the catch-all for agency work (Sean, 2026-10-27: "we have too many things"; AI & Automation, Web & Development, Content Creation & Media, Branding & Creative Assets and Business Operations left the menu, their two Vegan businesses moved to Marketing & Growth, the supplement brands in Health and Wellness to Nutrition & Supplements, migration `20261027_services_trim.sql`; the SaaS tools still filed under the old names are the LESARUSS AI directory's and never show here); **Brands is
retired** (its three listings were re-filed the same day; an old `Brands` row still shows under Products > All). Change these
together: `CAT_MAP` and `CAT_CONFIG` in `ve-region-directory.js`, `SECTIONS` in `ve-listing-admin.js`, `KINDS` in Directory
review, `CATEGORIES` in `ve-claims`, `LISTING_CATEGORIES` in `ve-outreach`, `CATEGORIES` in `ve-discover`, `FOOD_CATS` in
`directory/listing.html` and `CATS` in `claim.html`. **Brands that vend** (Sean, 2026-10-26: many sell nationally online "but
they still show up at... farmers markets and special events, festivals... a tool for promoters who are looking to find vendors"):
a Food Brands or Nutrition & Supplements listing with Vendors in its extra categories (the listing editor's Also show
it under, with a note saying so) stays in its brand section, also shows under Vendors with the location filter, and
its card reads **Markets & events** (`vendsAt` in `ve-region-directory.js`). In the brand sections, **Sells at**
(Anywhere, Markets & events, Online & stores) filters them, and Markets & events brings the location filter back. Vetting goes by the main category only, so a vending brand never lands in Being vetted. A sub-section can have its own filters
(`SUB_FILTERS` in `ve-region-directory.js`): **Food Brands** by what they make (**Makes**), never by city (`listings.product_kinds`:
dairy, meat, egg, seafood, snacks, drinks, protein, pantry, baked, frozen; set in the listing editor; migration
`20261024_listing_product_kinds.sql`), **Markets** by national chain (tag `ve-grocery-store`) or local market.
**Every section and sub-section has its own address** (Sean, 2026-10-27: "if I wanted to send somebody to the markets section of
our food directory, I couldn't... when I'm going back, it's taking me to the main page"): `?tab=<section>&sub=<sub-section>`
(`/directory?tab=food&sub=markets`, `bakeries-and-cafes`; the first sub-section leaves `sub` out), pushed on every click so back and
forward move through them, on `/directory` and the dashboard's Directory tab (`/dashboard/directory?tab=...`; `url` in
`VERegionDirectory.init`, `pushSection` and `applySection` in `ve-region-directory.js`; a city hub, whose `?tab=` is its own
section, leaves it off). **The city is not in the address**: the same link opens in whichever chapter the visitor picked (kept for
the visit, `sessionStorage` `ve_dir_city`), and an old `?city=` link opens on that city before the address drops it. A listing's
breadcrumb links back to its sub-section. **Submit listing** (the banner's green button, Sean 2026-10-27; one row on a phone) opens Join the
Directory's Add it (`/claim?add=1`): $11 or 1,100 points a listing (Guide pricing, below).
Layout (Sean, 2026-10-27: "hide the filter options... as an icon to the right of the search... When they click the icon again it
closes. The search and the icon should be below the tabs"): the section tabs, then one row with the search and a **filter icon** at
its right (`.vrd-tools`, `[data-vrd-filter]`). The icon opens a dropdown under it (`.vrd-filter-pop`): first the section's
sub-sections (Restaurants, Bakeries & Cafes, Food Trucks...; Sean, 2026-10-27: "It should also have the Restaurant, Bakeries, Food
Truck options in the icon as well"), then Sort by and every filter (Area, the sub-section's own, Vegan, Type) as 40 px dropdowns with
our chevron, three across on desktop and two on phones, then **Reset filters** and **Done**. The icon again, Done or Escape closes
it; the icon shows how many filters are set (`countFilters`), and the search names the sub-section showing ("Search Markets..."). Under the cards, the page
numbers (first, last and two either side of the current one) sit in the middle and Show 24 / 48 / 111 at the far right (shown
only when there is more than a page of 24).

**Community is the animals first** (Sean, 2026-10-27: "there's a lot of backlash on brands that don't put the animals first...
I really want that to be what the community directory is all about... nonprofits... events... rescues... sanctuaries"). Community's
sub-sections are **All** (first here, the one exception: Sean, 2026-10-27, "I don't mind people seeing all of the community listings
in one slot"; `allFirst` in `CAT_CONFIG`), **Nonprofits, Rescues, Sanctuaries, Events** (the same lists as Food's, above; migration
`20261027_community_resort.sql`). Community Partner was never a kind of listing: its 29 rows (a June spreadsheet import) were
re-filed from Google and their Instagram bios the same day (14 into Vendors, Food Trucks, Restaurants, Bakeries, Health and
Wellness, Coaches, Beauty, Clothing; two closed for good), and the 15 with nothing to go by are On hold in Directory review, each
with what we know. Rescues, sanctuaries and nonprofits are organizations: no How Vegan (`vegan_status` null). From Sean's Instagram
list (the `ve_businesses` import) the ones Google and their own website confirm were listed (Muscovy Sanctuary of Florida, Rowdy
Girl Sanctuary, UFAR Animals Rescue; Mercy For Animals, The Humane League and Humane World for Animals in every chapter); the 15
known only on Instagram wait in Business outreach > New places > Ready to list for Sean to confirm and add. **The community
search** (Sean, 2026-10-27: "go"; migration `20261027_community_search.sql`): Google searches for farm animal sanctuaries, animal
rescues and Vegan or animal rights nonprofits in all eight cities, filtered (open only; no zoos, petting or city farms, wildlife
parks, county animal services, clinics or unrelated charities; nothing already listed or waiting), made 215 quarantined listings
(`crawl_source` `community-search`, `details.community_search` with the hub and a guess of Rescues, Sanctuaries or Nonprofits),
each waiting in Business outreach > New places > Ready to list with the guess in its note and its category picked from it
(Rescues, Sanctuaries, Nonprofits and Events hide How Vegan there and list with none). Nothing went live. Six from South
Florida's search are national organizations elsewhere, and their note says so. Run it again by city with new searches the same way.
**The newer chapters** got the same search on 2026-10-28 (Sean: "run the community search for the newer chapters"; migration
`20261028_community_search_new_chapters.sql`): 24 searches in North Florida, D.C., Maryland, Virginia, Delaware and West Virginia,
each place in the chapter of its own state, 146 quarantined in Ready to list (North Florida 45, Virginia 34, Maryland 27, West
Virginia 21, Delaware 14, D.C. 5). The filter also leaves out working and petting farms, wildlife rehab, pet stores, boarding,
breeders, thrift stores and charities for people. Nothing went live. **The other seven chapters** got a wider second pass the same day (Sean: "run the community
search for the other chapters"; migration `20261028_community_search_other_chapters.sql`): 40 searches, 157 quarantined (Central
Florida 36, South Florida 28, Los Angeles 26, New York 26, Philadelphia 25, Atlanta 15, London 1). City and county shelters are left
out too, and a name that matches any listing, set-aside ones included, never comes back.

Logos (Sean, 2026-10-10: "I would prefer it just to have the thumbnail with the letter if it's not the official
logo"): a listing shows a logo only when we hold it in our own storage (`vegan-media`: logos checked by eye, the curated
`directory/logos/` files, or one an admin picked in the media library). **Every logo is our own copy** (Sean, 2026-10-27: "any
logo that we pull, let's not use it from where it was hosted from. Let's make a copy of it immediately as part of the process
once we've accepted it. That way nothing disappears"): every way a logo is saved copies it (`ve-discover` `logo_set`, `ve-claims`
owner photos, `ve-media-library`), and the edge function `ve-logo-keeper` (cron `ve-logo-keeper`, hourly, x-cron-secret) copies any
`logo_url` outside `vegan-media` into `media/listings/<slug>/logo-copied-*`, keeps the old link in `details.logo_copied_from` and logs
a `ve_listing_edits` row; a link that fails stays, noted in `details.logo_copy_error`, and is tried again after a day. On 2026-10-27
it copied the 55 podcasts' Apple covers, the last logos hosted elsewhere.
Logos linked from elsewhere (Instagram pictures, whose links expire; website share images) were set aside on 2026-10-10
into `listings.details.logo_unverified` (143 listings) and show the letter. Restore one after checking it with the line in
`20261010_listing_logos_letter_unless_ours.sql`; a new logo is copied into our storage, never hot-linked.

Locations (Sean, 2026-10-25: "how are we accounting for restaurants that have multiple locations. Should they extend from the
same listing and show a section for additional locations so they are all tied together. Also creating additional locations can
be done from within the listing so it copies the majority of the content"; migration `20261025_listing_locations.sql`). A group
is one main listing (`parent_id` null) and its locations (`listings.parent_id` = the main one, `location_label` "West Village").
Each location stays its own listing (street, city, hours, phone, Google place, map pin, votes, check-ins, review state, its own
city hub); the main listing holds what they share. A location page fills what it leaves empty (about, logo, socials, website,
order links, cuisines, menu) from the main listing (`withMain`, `SHARED_FIELDS` in `directory/listing.html`), and every page in a
group shows **More locations** in the sidebar (`loadLocations`; closed ones last, tagged Closed). In the listing editor's
**Locations** section: Part of (the main listing's address), this location's name, and **Add a location** (`ve-claims`
`admin_location_add`, `ve_listing_add_location()`: copies the shared content into a new live listing named "<Business> -
<Location>"; the nightly essentials pass fills its hours, Google place and pin). One level only. Branches are locations, never
duplicates to merge. The restaurant search of 2026-10-27 added chains unlinked; on 2026-10-28 179 listings were linked under 77
main listings (same website and same name, food places and animal organizations only; migration `20261028_chain_locations.sql`,
each a `ve_listing_edits` row, field `parent_id`). Left unlinked on purpose: sister restaurants (Doomie's, Kitchen Mouse, Essential
Vegan), Tofutti, Viva!, Whole Foods and Loving Hut's listing with no street. The Directory card does not read the main listing, so a
location keeps its own `logo_url` (chainFill fills it).

Duplicates (Sean, 2026-10-10: "merge the duplicates"): a listing is never deleted. A duplicate gets status `rejected` with
`details.merged_into` (the listing that stays), `merged_at` and `status_before_merge`, and what pointed at it (outreach,
votes, saves) moves to the listing that stays; a second queued outreach for the same business is `skipped`. 168 were
merged on 2026-10-10 (`20261010_listing_duplicates_merged.sql`): three public pairs (BunnieCakes, The Rabbit Hole and
Soulicious Vegan Kitchen, whose "Community Partner" copies became an extra category) and 165 hidden import copies of a
listed business. Branches in different cities are not duplicates. Hidden import copies can share a slug with the public
listing, so look a listing up by slug and `status = 'approved'`. An old link to a merged copy forwards to the listing that
stays: `directory/listing.html` asks `ve_listing_merged_to(slug)` (migration `20261010_listing_merged_redirect.sql`)
when a slug has no approved listing, keeping the address's tab and hash.

## Events, the menu and the city banner (Sean, 2026-10-26)

"When you're not logged in... the events page needs to be there... select by city... search... It operates almost like our
directory, but for events... the goal is to have every event in the world that's happening in this tool. And then that could
feed into the cities." `/events` (`events/index.html`) is open to everyone and wears the dashboard's event tile (Sean, same
day: "I want the events to look more like how it looks on the dashboard with just that tile, that horizontal tile... I don't
like the logos and the treatment"; no pictures on the tiles). The calendar is one component, `/public/ve-events.js`
(`VEEvents.mount`), on `/events` and the dashboard's Events tab: approved `events` rows, a city from the banner (an event counts
in a city by `VE_HUBS[].page.eventCities` or the hub's Directory rule, `VECityBanner.matches`), search, Where (each country
an event is in, grouped by continent, `events.continent`), Sort by (Soonest, or City A to Z with a heading per city),
Upcoming / Past, kinds of event; `/events` keeps `?city= ?q= ?where= ?cat= ?sort=city ?when=past` in the address bar.
`is_free` defaults to true in the table, so it is never shown.

- **Submit an event** (Sean: "members to be able to submit events for consideration... We just require there to be a link to
  where you can purchase tickets or find more information, the official pages"): four steps, one per view (`#submit/1` to
  `#submit/4`): A flyer (optional: drop it and Claude reads it), The event, When and where (in the event's own time zone),
  The official link (required), then sign-in at the button. It waits for approval; `#mine` lists what they sent (Waiting for
  approval, Live, Not approved) and they are emailed when it goes live. The city hubs' Submit an event opens the same steps
  (`/events?city=<slug>#submit/1`); the hub's old popup is gone. The one Submit an event button is the city banner's green one
  (the orange one in the calendar's toolbar was removed, Sean 2026-10-27).
- **Reading flyers** (Sean: "sometimes all they have is a banner on Instagram... you could automatically tell from the banner
  of where city to put in, what state, what continent"): `ve-events` `flyer_start` (a signed upload into the private bucket
  `event-flyers`; pictures shrunk to 1600 px first) and `flyer_read` (Claude Opus 5.5, structured output: name, times with
  offset, venue, city, state, country, continent, time zone, kind, a printed full link only, other links, a note on what it
  worked out). Members read five a day (`ve_event_flyer_reads`); the team any. Proven 2026-10-26 on a test flyer in 10 s.
- **Depot > Events** (`/admin/depot/events`, replacing `/admin/events.html`, which redirects): Waiting for approval, Live,
  Turned down (`#queue/<status>`), one event per view with its flyer and where it came from (`#event/<id>`: edit, Approve,
  Turn down with a reason the member sees), **Add from a flyer** (`#add`: Put it live or Save to Waiting), and **Crawl
  sources** (`#sources`, `#source/<id>|new`). Server: edge function `ve-events` (`submit`, `mine`, `flyer_start`,
  `flyer_read`, `queue`, `review`, `update`, `save`, `sources`, `source_save`, `source_check`).
- **The crawl** (Sean: "crawl the web, look for different sources... keep this constantly populated"): the Background writer
  (dispatcher source `events_crawl`, batch 3) reads each `ve_event_sources` row (a website, an Instagram, a calendar, or a
  search; ten searches seeded, one per city and two for the world) and saves each upcoming Vegan event with an official page
  through `ve_event_intake(event, 'crawl', source)`, which refuses no link, no date, an event that is over, or one already on
  the calendar that day, and saves it pending. Sources come back every 7 days (cron `ve-event-sources-requeue`). Nothing the
  crawl finds goes live until approved. Migration `20261026_ve_events_intake.sql` (`events.source` member | crawl | flyer |
  admin | import, `source_url`, `source_id`, `flyer_path`, `continent`).
- **Every Vegan event in the world** (Sean, same day: "I want every event, possible vegan event, to be in this event
  directory... it doesn't even matter if they're in regions where we are"). The first pass searched "Vegan events <city>" and
  saved nothing (past events, undated listings), so the crawl reads **lists** first (`kind` `list`; migration
  `20261026_ve_event_sources_lists.sql`): the American Vegan Society VegFest directory, HappyCow's events calendar, Eventbrite
  searches for Vegan and plant-based (US, UK, Canada, Australia), Meetup's Vegan groups, vegconomist, Vegan Events UK,
  VegfestUK, Veggies Abroad and the SoFlo Vegans calendar. It opens each listed event's own page and takes the date, place
  and link from there, keeps only events that are Vegan by their own description, and saves a weekly series as its next
  three dates. Each source has its own cadence (`every_days`: Eventbrite and HappyCow every 3 days). Add a source in Depot >
  Events > Crawl sources. This session cannot reach outside sites; the Background writer does the reading.
- **Time to be announced** (`events.time_set` false): an event with a date and no published time is saved at noon local
  and every tile (the calendar, the city hubs) shows the date with "Time to be announced", never a made-up time; the Depot's
  event view has the checkbox. `events.description` is required in the table, so an event saved without one gets an empty
  one (`ve_event_intake`, migration `20261026_ve_events_sean_list.sql`). Sean's list of 2026-10-26 went in the same day: 27 live
  (San Francisco VegFest and 26 Vegan Events UK festivals), the two Holistic Holiday at Sea cruises waiting for their port,
  and his sources (Connect For Animals, VeganFests, VegCF's Meetup, VegFest Expos) added to the crawl.
- **Vetting, in order**: `ve_event_intake` refuses no official link, no date, an event that is over, and a duplicate (same
  name, same day); the writer keeps only Vegan events confirmed on their official page; the team approves each one in Depot >
  Events. Nothing goes live on its own.
- **Signed out, the nav is the dashboard's top bar** (Sean, 2026-10-27: "I much would prefer using the same sort of navigation
  that we're using on the logged in version"): the logo, then the menu in the dashboard's tab style on desktop (the section
  you are in underlined in green, `/directory/<slug>` counts as Directory), on phones a **hamburger** in the right corner (Sean,
  2026-10-27: "To save space at the top, can we make the menu on mobile the hamburger menu in the right corner"; `#ve-burger`,
  `#ve-burger-menu`, a panel of the sections under the bar, the open one marked; 960 px signed in, 860 px signed out), and Log In
  and Join (`/passport`) on the right. The dashboard's own bar does the same on phones (`#ve-burger` in center-console, built from
  `#dash-tabs-mobile`), with Apps as its icon only. No announcement pill signed out (a super
  admin viewing as the public gets the Viewing as pill instead). **Signed in it is the same bar** (Sean, 2026-10-27), in the
  dashboard's order: Dashboard, Directory, Events, Daily Pulse, Media, Guides, Communities, My Saves, and **Depot** for super
  admins (`/dashboard/depot`), then the avatar and badge. No announcement pill, no hamburger. **The avatar opens the account
  menu** (`/public/ve-account-menu.js`, `VEAccountMenu.attach`, the same menu on the dashboard's avatar): name, email and
  membership, My Account, My Saves, Contribute, Sign out; a super admin also gets **View as** (My account, The public, Member,
  Community Manager; `ve_view_as`) and **Sign in as** (`ve-switch-account`). While a preview or a switch is on, a pill at the
  bottom left says so, with Back to my account.
- The menu (`public/nav.js`, Sean, 2026-10-27): signed out, Directory, Events, Daily Pulse, Media, Guides, Communities, the signed-in
  order without Dashboard, My Saves and the Depot ("My Saves and Depot are logged in versions only"). The Community Board left it ("the
  community board is in the pulse"): `/pulse` is the Board (see The Daily Pulse is the Community Board). Lead Your City left it too (`/lead` still exists).
- **The city banner is one component** (Sean: "the header to be similar to the directory where they can immediately select
  and collapse as well. That should be a feature for all the banners"): `/public/ve-city-banner.js`
  (`VECityBanner.mount(el, {key, title, sub, onChange, action})`, after `ve-hubs.js`): the city's art, the city picker, and
  buttons (Sean, 2026-10-26: "my goal was to have it be a button"). **The first button is the page's own home** (Sean, 2026-10-27:
  "the same as if they were to click that top navigation button"; option `home`, `setHome`): **Directory home** (`/directory`, and
  on the dashboard the Directory tab's first section), **Events home** (the calendar with no search or filter, `VEEvents` `home()` on
  the dashboard), **Pulse home** (today's Daily Pulse in the city picked), **Media home** (Podcasts; See in the Directory follows it while the
  banner is open) and **Depot home**; the dashboard's Dashboard, Guides and My Saves banners have none. It replaced **View community** (the picked city's hub, or View
  communities for All cities, still the default for a banner with no `home`; Sean, 2026-10-27: it opens them the way the menu's Communities does, so in the dashboard, or a page the
  dashboard frames such as the Daily Pulse, the dashboard opens the chapter (`VEOpenCommunity` in center-console), and any other frame
  sends the whole window), the page's own `action` (Events: **Submit an event**, `VEEvents` `submit()`, on `/events` and
  the dashboard), and Collapse / Expand (folds on the first click into the page unless the visitor chose; kept for the visit). **Phones have no
  Expand** (Sean, 2026-10-27: "on mobile, we lose the expand... seeing it big on desktop is cool"): at 900 px and under the banner
  is always folded, the title, the line under it and the picker on the left and the page's two buttons on the right at their own
  size; a banner with no buttons (My Saves, Guides) gives the title the whole width (`vcb-no-acts`). A button can carry a shorter phone label (`short`: Media's Join our network reads Join network).
  Folded, it is three rows and two columns, the right one about a quarter, at every width: the title, the chapter under it,
  then the picker on the left; the buttons on the right, each its own height, stacked and centered (Sean, 2026-10-27: one
  button "should just be the same size as normally"). **Collapse or Expand is one choice for the whole site** (Sean,
  2026-10-27: "let it stay collapsed when they navigate through to the different pages"; `sessionStorage` `ve_banner_hero`).
  On the dashboard every banner runs edge to edge, square, like the public pages (`.dash-hero-banner`, and the Daily Pulse's
  frame, `.ve-in-dash` in `pulse.html`). On phones the banner sits flush under the menu and its card runs the full width (Sean, 2026-10-27: "make the section with the
  title and city drop down full width so it flushes with the top navigation"; the dashboard's `main` loses its top padding there).
  No City label shows beside the picker (it
  pushed it out on phones; screen readers still hear it), so the picker sits flush left under the title, and on phones a 22px
  gap keeps it clear of the buttons (Sean, 2026-10-26). Folded, the title (Vegan Directory, Vegan Events) is always one line: it
  shrinks to fit its column (down to 12px) rather than wrap, since a second line made the buttons taller (Sean, 2026-10-26). On a
  phone (900 px and under) the stacked buttons are taller than the title, so the title and the line under it grow to fill that
  height (Sean, 2026-10-27: "make the title big enough where it's filling in that gap, but not adjusting anything else"; `fitTitle`):
  the biggest size at which every word fits the column, the line under it stays one line, and title, line and picker are no taller
  than the buttons. Button labels stay one row on a phone (Submit listing, not Submit your listing). The line under the title is
  the city unless the page names something else (`setLabel`): **the Directory names its section** there (Food, Services, Media,
  Community, Being vetted, Review; Sean, 2026-10-27: "is it redundant for us to have the title as well as the dropdown?"), the city
  being in the picker (`onSection` in `VERegionDirectory.init`). The
  Directory, Events and Communities wear it; on `/communities` and the dashboard's Communities tab a pick goes straight to that chapter (Sean,
  2026-10-27: "you go directly to the Atlanta community"; `param: false`, no View community button, the picker back on All
  cities when you come back; an old `/communities?city=<slug>` forwards to the chapter); the cards below stay for browsing. A new browse page
  with a banner uses it, never its own copy. The dashboard's Directory and Events tabs wear it too (Sean: "I want a similar
  look and feel for both"; `param: false`, `initial`): a city picked there is the dashboard's active city, All
  cities widens only that tab (`DASH_ALL` in center-console). The banner is the dashboard's city picker: the city pill and
  Contribute left the welcome row (Sean, 2026-10-26), the welcome row (with View As) shows only on the Dashboard tab, and every
  banner, on the dashboard or a public page, sits 24px under the menu (`.vcb` margin in `ve-city-banner.js`).

## Media (Sean, 2026-10-27)

"Let's do media instead of shows... what we're showing on media is our featured media plus the top 12 listings voted by you
guys. So they get a little bit more prominence." `/media` (`media/index.html`; `/podcast`, `/podcasts`, `/shows` and
`/podcast-network` forward to it) and the dashboard's **Media** tab (`/dashboard/media`, which was Shows; `/dashboard/shows`
forwards) are one component, `/public/ve-media.js` (`VEMedia.mount`, after `ve-region-directory.js`). It is what we put
there, never something members add or follow (the Follow Shows tiles and modal are gone).

- **Not about a city** (Sean, same day: "no one's trying to make media just for one location"). The banner is the shared one
  (`VECityBanner` with `VEMedia.bannerOptions`: `choices` instead of cities, one picture) and reads **Vegan Media** over the kind
  of media; its picker is the kind (`TYPES`: Podcasts, Documentaries (`Documentaries & Films`), Books; `?type=` on `/media`), and
  its button is **See in the Directory**, that kind's section (`/directory?tab=media&sub=<sub-section>`; the Directory opens the
  pill named in `&sub=`). The ad rail is the All cities pair.
- **One kind fills the page**: picking Documentaries shows only documentaries. Its **Featured** first, in its own section,
  when we have put something there (`SHOWS`, each with its `type`: our four shows and the episode search are Podcasts'; Books
  and Documentaries have none yet, so their 12 lead; a featured book, such as the Pre-Vegans one Sean mentioned, is a `SHOWS`
  row with `type: 'books'`). Then its **top 12** as voted in the Directory, read fresh on every visit: most votes, then most
  voters, then a logo over a letter, then A to Z. Our own shows are Directory listings too and never count in the 12. The
  cards are the Directory's card, with + Vote.
- **Featured shows are their listings** (Sean, 2026-10-27: "the same as the page... include YouTube and Amazon Music on there as
  options for our featured ones... the episodes pulled from the RSS feed... go off the RSS feed"). A Featured card opens
  `/directory/<slug>` (in the dashboard, under the Directory tab), wears the feed's Active or On hiatus and has **Listen
  here** plus Spotify, Apple Podcasts, Amazon Music and YouTube (`LISTEN` in `ve-media.js`, read from the listing's
  `details.platforms`; on the listing's Listen on, `details.platforms.youtube` is the show's playlist, the `youtube` column stays
  the channel for socials). Since 2026-10-27 (Sean: "show the featured podcasts in the same format as the other, just in their own
  section") the Featured section shows them with the Directory's own card, like the 12 (votes and all), in `SHOWS` order; the
  listing holds Listen here and the platforms. The old `/podcast/<slug>/` pages are gone and forward to the listings (`vercel.json`). Pre-Vegans got
  its listing the same day (`20261027_featured_podcasts.sql`); its feed's last episode is February 2025, so it reads On hiatus.

## Podcast episodes on a listing (Sean, 2026-10-27)

"Is it possible to add an RSS of the podcast so that way it actually populates on their listing? ... people can actually just
listen to the episodes on our platform... they can save the episodes. But it's all pulling from their RSS feed." Then, the same
day: "put the episodes on the overview page... their website, Apple Podcasts... Spotify, all the usual suspects... little square
icons... and then below it... the podcasts listed... with some pagination." A podcast's listing (category Podcasts) opens on its
Overview: About, **Listen on** (square icons: Website, Spotify, Apple Podcasts, YouTube, Amazon Music, the RSS feed, whichever it
has; `renderPodcastOverview` and `platformList` in `directory/listing.html`), then **Episodes**, shown only once its feed has
some: search, 20 a page with page numbers (first, last and two either side, `?epage=`), and an episode on its own view
(`?ep=<guid>`, Episodes / title back; an old `?tab=episodes` link lands here too). **Play** plays it in the player bar at the
foot of the window (one at a time, it keeps playing across tabs; inside the dashboard's frame the bar sits above the list);
**Save** is for members (anyone else gets the Passport window). The audio streams from the show's own host; nothing is copied.

**My Saves** (Sean, same day: "my favorites, or my saves... a section on the navigation just for members") is a dashboard tab
(`/dashboard/saves`, after Guides; `renderSavesTab` in center-console, read each time it opens): Podcast episodes (the little
picture, the title, the show, Play and remove, played in the same player bar; the show opens under the Directory tab) and Places
and brands (saved listings). The nav's account menu and Your tools' My Saves open it; it replaced My List
(`/account/my-list` still works and has Listings and Episodes).

**The page speaks to what it is** (Sean, same day: "it still has coding for restaurants... is this your podcast?"). `listingKind`
and `listingNoun` in `directory/listing.html` (place, show, work, brand; podcast, channel, book, film, brand, organization,
business) word the claim lines, the vote line and the locked Partner Dashboard; a podcast's Liz tour is three slides (her general
clips 1, 2 and 5) with podcast words and what is coming for podcasts. Her recorded line still says "your business" (new clips
would need recording). The owner's dashboard (`ve-partner-dashboard.js`, `kindOf`, the same lists) shows **Saves** in place of
Check-ins for anything but a place (who saved it; for a podcast, its saved episodes too, `ve-podcast` `owner_saves`, after the
claim is approved), counts what fits (a podcast: Episodes played, Listen on clicks, website, social), asks only for the logo and
the story, and a podcast's **Opportunities** are `PODCAST_OPPS`, all Coming: the Vegans Explore Podcast Network, promos on our
shows, production, network sponsorships, ad spots, clips and social promotion (interest through `ve-claims` `partner_interest`).
Plays (`play`, the episode's guid) and Listen on clicks (`listen`) are `ve_listing_events` kinds (migration
`20261027_ve_listing_events_actions.sql`, which also fixed the table refusing every visitor action from 2026-10-24 to 2026-10-27).

**Status from the feed** (Sean, same day: "if an episode has been posted within the last 6 months, we can consider it active.
Anything longer than 6 months... we'll say on hiatus... if a new episode gets posted... that can update the tag automatically").
**Never Ended** (Sean, same day: "We can't confirm it's ended because it could come back 3 years later... I would take offense if
somebody typed my podcast ended"): a show is Active or On hiatus, however old its last episode (migration
`20261027_shows_never_ended.sql` moved the five the feed had marked Ended). `ve-podcast` sets a podcast's `business_status` from its latest
episode each time it reads the feed, and cron `ve-podcast-refresh` (hourly, `refresh`, x-cron-secret) re-reads feeds older than 20
hours, eight a run, and re-checks every status from what we hold. A save in the listing editor holds only until then. Media (show
and work) wears its status where other listings say how Vegan they are: the listing header's tag (Active, On hiatus;
Available for books and films) and the Directory card's tag (`mediaTag` in `ve-region-directory.js`), and media on hiatus stays in its
section and in Media's top 12 instead of moving to Closed. **Media is not a place** (Sean, 2026-10-27: VegNews showed San Francisco; "I don't think we need to have online there...
Available doesn't tell me anything"): a media card's line under the name says what it is, never a city or Online: Podcast or
YouTube channel or News outlet with its Active / On hiatus, Documentary film and its year, a book's type and its year
(`mediaMeta` in `ve-region-directory.js`; a book or film shows a status only when it is no longer available). The listing page
does the same (the header badge, no address chip, no address in Contact, the Directory breadcrumb, never a chapter's). The Media
section has no Area, How Vegan or Online / Closed filters, and every media listing counts in every chapter. **Books sort by type**
(`details.book_type`: Cookbook, Biography & memoir, Educational, Health & nutrition, Lifestyle, Children's; `BOOK_TYPES` in
`ve-region-directory.js`, `ve-listing-admin.js` and `ve-listing-media`, change all three), the year is `details.release_year`, both
read by the Directory as `release_year:details->>release_year` and set in the listing editor's **About the work** (books and films),
saved by the edge function `ve-listing-media` (super admin, a `ve_listing_edits` row each; `admin_listing` does not hold details).
**Sorting and status** (Sean, 2026-10-27): no sort by the day a listing was added anywhere ("I don't think people care
when I added the listing"; the old Most Recent and First Added only flipped the vote order); Sort by is Most Votes and A to Z, and
books and films add **Newest first** and **Oldest first** by the year they came out (no year goes last). A show's Active / On hiatus
is a **Status** filter on Podcasts, YouTube and News Outlets, not a sort (best practice: people want only the shows still going).
The 22 books were filed from their own descriptions (migration `20261027_media_book_types.sql`; Badass Vegan and Breaking Up with
Dairy as Lifestyle, The Cheese Trap as Health & nutrition, the rest Cookbooks); every documentary already had its year. **Other
media** (category `Media`) is hidden for now (Sean: "I don't know what media is"): not a pill, not in the editor's picker unless a
listing is still filed there, and its one listing, Zara Osei Media, was re-filed under Services > Content Creation & Media the same day, and Viva! (a UK Vegan
charity) moved from News Outlets to Community > Nonprofits, serving the London chapter (Sean: "move Zara and Viva"). On 2026-10-27: 47 Active and the rest On hiatus (among them SoFlo Vegans, Vegans Explore
Podcast, Vegans Who Lift, Pre-Vegans, Moby Pod, Keep On Cookin', The Ordinary Vegan and The Keto
Vegan). Listen on uses the platforms' own marks (`/public/icons/platforms/`, Simple Icons, CC0 shapes).

**The Vegans Explore Podcast Network** (Sean, same day: "I want people to want to join the network so that way they can be part
of our sponsorship conversations... They don't got to post anything on their podcast unless they're involved in a campaign...
they're going to be promoted on our platform regardless... you just got to become a member"). Media's banner has **Join our
network** (green, between See in the Directory and Expand), opening `/media/network` (`media/network.html`): four steps, one per
view (`?step=`): Your podcast (name, RSS or Apple link, website, hosts), Your audience (downloads a month, where that number comes
from, how often, where listeners are), Your social, What you want (sponsorships, promotion, promos, clips, production) and who to
reply to; sign-in at the button. Saved by `ve-podcast` `network_apply` into `ve_podcast_network_applications` (migration
`20261027_ve_podcast_network.sql`, matched to its Directory listing by feed, Apple id or name, `member_active` recorded) and emailed
to Sean. A non-member is asked to become a Founding Member ($11) on the thank-you screen. The offer itself (what a network show
commits to, its share of a sponsorship) is not set yet; the review of applications is Sean's for now.

- The feed is `listings.rss_url`. Left empty, `ve-podcast` finds it once from the listing's Apple Podcasts id (iTunes lookup,
  `feedUrl`) and saves it; an empty string means the team turned it off. Set it in the listing editor's **Episodes** field (shown
  for Podcasts), which reads the feed at once and says if it fails. On 2026-10-27, 54 of the 56 podcasts were found this way;
  The Ellen Fisher Podcast and Vegetarian Zen have no Apple feed.
- Edge function `ve-podcast` (`episodes`, `episode`, `save`, `saves`, `admin_feed`; verify_jwt off, the member token checked
  inside): the latest 300 episodes are kept in `ve_podcast_feeds` and read again after 6 hours (a failing feed keeps what we
  have); saves are `ve_episode_saves` (migration `20261027_ve_podcast_feeds.sql`). The page side is `/public/ve-episodes.js`
  (`VEEpisodes.mount`, `play`, `save`, `row`).

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

## The Daily Pulse is the Community Board (Sean, 2026-10-26)

"I would like to see the pulse to really be the community board... the same kind of header that the other pages have... navigate
between the different chapters... like traveling to these different locations." `/pulse` (`pulse.html`, which was `board.html`;
`/board` forwards here, query kept; the old article feed is gone, its pages still open at `/pulse/<slug>` and the shows on
`/media`) wears the city banner (`VECityBanner`, key `pulse`): `?city=<hub>` (an old `?community=` still works), else the
member's home city, else the last pick, else All cities, which lists every chapter (`ve-board` `list` with community `all`; topics
from every city and the national one, posts from every city with their city tag, no How it works posts). Six tabs, the Daily
Pulse first: Daily Pulse, Jobs, Classifieds, Fosters, Rescues, Suggest a Topic. **Requests & Offers left** (Sean: "doing similar
stuff to jobs classified"; it had no member posts); an old request still opens. **Every tab has its own address** (Sean,
2026-10-27): `/pulse`, `/pulse/jobs`, `/pulse/classifieds`, `/pulse/fosters`, `/pulse/rescues`, `/pulse/suggest` (a rewrite in
`vercel.json` before `/pulse/:slug`, so none of these can be an article slug; an old `?lane=` link moves to its address; back and
forward move between tabs). Each tab has its line and its button (Post a job, Post a listing...; on the Daily Pulse, Suggest a
topic), and **the button sits in the banner between View community and Expand** (the banner's `action`, relabelled by
`setAction` as the tab changes), like Submit an event on `/events`; the one under the tabs shows only in a city hub's frame,
which hides the banner. Two cards across beside the ad rail on every tab and post. A post's
conversation is its **Comments** (Add a comment, Post comment); topic cards say Join the conversation. Anyone reads; posting,
commenting, contact details and reports are for members, and anyone else gets the Passport window (`VEVotes.memberPrompt(kind)`:
post, comment, contact, report, job; `/passport?from=board`), never a sign-in box. **Hiring is a perk of a business in the
Directory** (the viewer owns a listing, `listings.owner_member_id`; `ve-board` returns `viewer.business` and refuses a Hiring post
otherwise with `business_only`); any member posts Looking for work. The composer picks the chapter. The dashboard's Daily Pulse
tab frames this page on the member's active city (`#dash-pulse-host`, loaded the first time the tab shows, sized by
`ve-frame-height`); a city hub frames it with `?community=<slug>&hub=1` and hides the banner.

## Community Board sections (Sean, 2026-10-10)

"In each city, let's set the sections... a jobs board... a classified... a Fosters Board, and then a
Rescues Board... so as people start going into these cities, they actually see stuff." Every city's
board (now `/pulse`, above) has the toggles Daily Pulse, Jobs, Classifieds, Fosters, Rescues and Suggest a Topic
(`/pulse/jobs|classifieds|fosters|rescues|suggest`, the Daily Pulse is `/pulse`; Requests & Offers left on 2026-10-26). A row of tabs on
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

**Building a new Guide: follow `docs/guides/BUILD-A-GUIDE.md`** (canon `canon-ve-guide-build-playbook`; Sean, 2026-10-10:
"This is the prototype"). It lists every step that made the Dairy Guide, in order: decide, content, the page, pictures, the
two scripts, recording, test, launch. Copy the Dairy Guide's files; never start a Guide from a blank page.

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
- **One tile** (Sean, 2026-10-10: "I want the tile to be the same on both... I like the top right hand corner look"): swaps,
  recipes, What can I make? and episodes share `row()` in the Guide script: the square picture left, the words, vote and Save
  stacked at the top right (`.dg-acts`, one above the other so the words keep their room on a phone; Sean, 2026-10-10). A recipe tile shows its time, its counts and what you need (two rows). Brands and cookbooks
  stay the Directory's own card, with Save added under + Vote. Picture style and placement follow the Directory card.
- **My list** (Sean, 2026-10-10: "a tab or a drop down that says my list"): a Guide owner taps Save on any swap, recipe, brand,
  cookbook or episode, and it shows in the My list tab (members only, after The truth), one kind per view
  (`#/mylist/swaps|recipes|brands|cookbooks|episodes|shared`), newest first, in the same tiles. Recipes you shared is the same
  list as Cookbook > My recipes (`drawMine`). Data: `ve_guide_saves` (migration `20261010_ve_guide_saves.sql`), through
  `ve-cookbook` `saves` / `save` (500 per member per Guide). Chefs, when they come, get the same tile with a square of their face.
- **Guide banners** (LOCKED by Sean 2026-10-10 on the Dairy Guide: "lock it, go with B"). Every Guide's card on `/guides`
  opens with a banner (`.gc-banner`, linking into the Guide): 800 x 500, rounded corners, a plain white background, the
  Guide alone, centered, waist up, in the Vegans Explore tee (black or cream; Maya wears black), smiling and holding what the
  Guide is about (Maya: a glass of oat milk and a carton reading only OAT), every finger in frame, no other words. Made in
  Higgsfield (nano_banana_pro, 16:9, cropped to 16:10) from the Guide's current art, stored as
  `vegan-media/media/guides/banners/<guide-slug>.jpg`. The other Guides follow this look, each with its own Guide.
- **The Guide list is one file** (Sean, 2026-10-26: the dashboard should mimic "what we currently have on the main guides
  page"): `/public/ve-guide-catalog.js` (`VEGuideCatalog.render(el, {member, source, open})`) draws the cards on `/guides` and
  the dashboard's Guides tab. In order: the **Welcome Guide** (free, opens the Passport Guide at `/passport`; its banner is Dani's
  waving mid shot on white, seated in her chair, `/public/guides/welcome-guide.jpg`, made from her square art with no new
  Higgsfield credits; Sean, 2026-10-26: not Liz, who is already on the Restaurant Guide), the
  Vegan Dairy Guide, the Vegan Restaurant Survival Guide, then the Guides still being made: the **Vegan Meat Alternatives
  Guide** (added 2026-10-26), Entrepreneur, Creator, Nonprofit, Pre-Vegan and Seasoned Vegan. Live Guides wear their banner;
  the ones being made wear a flat line icon, say Coming soon with Notify me (`member_interest`, `guide-waitlist-<slug>`), and
  show to signed-in members only. Choose Your Topics (mini-guides) was taken off. Add or change a Guide card there. Under the
  cards, `/guides` ends with the Directory's Passport box ("Your first Guide is on us", hidden for active members); its old
  Passport, Vision and Ready sections are gone (Sean, 2026-10-26).
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

## The restaurant audit (Sean, 2026-10-10; criteria approved the same day)

"We could give them a simple audit for free and then in the actual guide, we go a bit deeper... just like BCPSMarcomm...
scans their page for a set of defined criteria. Look at Google Local, SEO, Web and social." It is the heart of the Restaurant
Guide (`guides/vegan-restaurant-survival-guide.html`, see The Restaurant Guide below) and a hook for business outreach.

- Criteria (`ve_audit_criteria`, migration `20261010_ve_restaurant_audit.sql`): 40 weighted checks in four areas (Google Local,
  SEO, Web, Social), each with a label, why, how to fix, the Guide chapter it links to (`chapter`, the step ids in the Guide)
  and the a la carte service that does it (`service`, `ve-services` keys: `photo_shoot`, `reel`, `social_post`). `in_free`
  marks the free check's ten. Change a criterion with a row update; the function reads them live.
- Scoring, BCPS style: every item is Good, Fix, Review (double-check) or Skip (could not be checked, e.g. no website); the
  score is Good weight over Good plus Fix weight (the distance from a perfect score). Review and Skip count for neither side.
- **Free check, no score** (Sean, 2026-10-10: "let's not give them a score with the free audit, just a list of things they
  can work on right away"): of the ten free checks, the ones to fix, each with what we found, most important first (`todo`),
  and how many more the full audit flags (`more_fix`). Never a score, the why or the how.
- **The full audit is its own add-on** (Sean, 2026-10-10: "the full audit will have more items and cost more. I'm not settled
  on that cost. I don't want to just go with $111 or offer it as part of the LESARUSS.AI membership. It should be an add on.
  It could also include a secret shopper experience"). Not part of the $11 Guide, the Partner plan or LESARUSS.AI. **Priced
  the same day** (Sean: "Go with $49 and $149"): **$49** the full audit, with a re-check 90 days later; **$149** the same plus a
  **Secret Shopper** visit (our cities only: the city's Community Manager, else Sean, is emailed the visit to arrange; meal
  covered up to $40; the owner never knows the day). Either one counts toward managed services if they sign up within 30 days.
  It costs us about 3 to 7 cents a run in data (Google Places at list price, PageSpeed free, Instagram about a quarter cent).
  Bought in the Guide's Your audit tab by anyone signed in, Guide or not: `ve-restaurant-audit` `checkout` (Stripe; test
  accounts on the test key) -> GET `?confirm=` (also called by ve-stripe-webhook: metadata type `ve_audit_purchase`,
  `confirm_fn` `ve-restaurant-audit`) marks the `ve_audit_orders` row paid, starts the full audit (`ve_audits.order_id`),
  emails the owner and the team, and returns to the Guide on the audit (`?audit=paid#/audit/r/<id>`). The 90-day re-check runs
  in `sweep` (three a night) and emails the owner. Migration `20261010_ve_audit_orders.sql`. Proven end to end on 2026-10-10
  with the test card (an order for Sobe Vegan by the QA account, `test` true). The team's free `full` stays for prospects.
- `ve-restaurant-audit` (verify_jwt off, VE token checked inside): `find` (Directory search), `criteria`, `free` (anyone;
  5 a day per visitor; a business checked in the last 7 days reuses that run, any tier), `full` (a super admin or ops), `get`
  (the full detail only for the audit's member, a super admin or ops; anyone else gets the free list), `sweep`, `flags`,
  `flag_review` (below). Runs in the background (`EdgeRuntime.waitUntil`, 15 to 35 s); ops can pass `wait: true`. Ops is the
  `LESARUSS_ADMIN_TOKEN` or the cron's `x-cron-secret`. Rows in `ve_audits` (`source` request or checkup).
- Sources: Google Places API (New) (`GOOGLE_PLACES_API_KEY`; the listing's `google_place_id`, else a text search with the
  name, street and city), PageSpeed Insights mobile (`GOOGLE_PAGESPEED_API_KEY`), our own read of the home page, robots.txt,
  sitemap, menu page and up to 8 internal links, and Apify's Instagram profile scraper (`APIFY_API_TOKEN`, Starter plan, $29 a
  month of usage; the Meta tokens in `lesaruss_secrets` are still `pending`). Facebook and TikTok are only looked for as links
  on their site or listing.
- Lessons from the first five (Blue Tree, Darbster, Rootz Soul, Vegan Cuban Cuisine, Sobe Vegan; 2026-10-10): many sites
  turn away a scanner but not a browser, so a refused page is retried once as a browser, and a site that still refuses, while
  Google's own speed test loads it, is a Review, not a Fix; builder template links (facebook.com/wix) are not the
  restaurant's accounts; Google reads an address in the restaurant markup even when a visitor cannot see it (counts for the
  Google match, not for "on your home page"); Google's city wins over ours; and when Google's match sits at a different
  street than our listing, the audit says so (a chain branch or a move) instead of quietly checking another location.
- **Monthly check-ups** (Sean, 2026-10-10: "run this audit on each of the cities once a month and flag any listings that may
  seem like they are closed due to lack of social activity, out of date web information, and closed message on Google";
  migration `20261010_ve_audit_checkups.sql`). Cron `ve-audit-sweep` (every 15 minutes, 06:00 to 07:45 UTC, 2 to 4 AM
  Eastern) runs `sweep`: three local businesses at a time (`ve_audit_local_category`: Restaurants, Bakeries & Cafes, Markets,
  Meal Prep, Catering, Fitness, Health and Wellness, Beauty, Clothing) in a `ve_outreach_cities` city with no audit in 28 days,
  city by city (`ve_audit_sweep_due`). 263 on 2026-10-10 (South Florida 137, New York 52, Atlanta 30, Los Angeles 28, Central
  Florida 14, London 2; DMV and Philadelphia have none listed yet), so every city is covered in about 11 nights. Each audit gets
  a closure flag (`closure_level`, `closure_signals`): **closed** when Google shows the business closed, **quiet** with two or
  more of: the website does not open (a site that only blocks scanners does not count), the Instagram is gone or has not
  posted in six months, a footer three or more years old, no hours on Google, no Google review in a year, no Google profile.
  One sign alone is recorded but not flagged. **Depot > Business outreach > Check-ups** (`#checkups`, `#checkup/<audit>`, a
  card on the console's home) lists open flags (`ve_audit_open_flags()`), Google-closed first, by city; each opens with its
  signs, Google Maps, website, Instagram and their page, and what the check found, then **No longer in business** (ve-outreach
  `listing_closed`, the note on the listing) or **Still open** (`flag_review`, `ve_audit_flag_reviews`; a quiet flag stays
  down 90 days, a Google-closed one returns next month if Google still says so). Until a Google-closed flag is reviewed,
  `ve_outreach_due()` does not email that business.
- Why it matters (Sean, 2026-10-10): "We are ultimately offering these businesses managed marketing services at a fraction of
  the price because we leverage AI to build and maintain their presence... when they see the results, they will opt in
  quickly, especially with it tied to our network and promotions. This will allow us to pay for multiple Community Managers in
  each city with their fee coming directly from our clients." The audit is the front door to that service.
- **The Secret Shopper report** (Sean, 2026-10-10: "Build the Secret Shopper report form next"; migration
  `20261010_ve_audit_shopper.sql`). `/dashboard/secret-shopper` (`secret-shopper.html` in the dashboard window, `openShopper` in
  center-console; a tile for super admins and Community Managers) lists the $149 visits in the Community Manager's city
  (`ve_audit_orders.community_slug`, set at payment; super admins see every city), most to-do first, each tagged To arrange,
  Visit set, Report started or Report sent. A visit (`#visit/<order>`) shows where to go (Google's address, hours, Maps) and how to
  do it (a normal guest, never say it is a visit, one Vegan question, photos, keep the receipt, meal covered up to $40), and Set
  the day. The report is eight steps, one per view (`#visit/<order>/report/<n>`), Back / Step N of M / Save and next, Next
  checks the step: The visit, Welcome and wait, Menu and Vegan labels, The food, Cleanliness, The staff, Photos (shrunk in the
  browser, private bucket `audit-shopper`, signed links only, up to 12, at least two besides the receipt), Summary and send.
  Send checks it is complete, emails the owner the link and Sean the meal to reimburse. The owner reads it in the Restaurant
  Guide (`#/audit/shopper/<order>`, linked from Your audits): the seven scores, what went well, what to fix first, each part and
  the photos. Actions `shopper_list`, `shopper_get`, `shopper_schedule`, `shopper_save`, `shopper_photo`, `shopper_photo_done`,
  `shopper_photo_remove`, `shopper_send` in `ve-restaurant-audit`; every change goes through `ve_audit_shopper_patch()`, which
  merges in one locked step (the first live test sent eight saves together and only two survived a read-then-write; after the
  fix all nine and both photos did). A sent report never changes. Proven end to end on 2026-10-10 with a $149 test order on the
  test card (Sobe Vegan, QA account, `test` true, entries marked [TEST]).
- Next: "Have us do it" on every Fix (a quote request to the city's Community Manager until Sean sets service prices), and the
  free check in the outreach emails (an upgrade to the offer, not a change to the plan).

## The Restaurant Guide (rebuilt 2026-10-10 on the Dairy Guide playbook)

`guides/vegan-restaurant-survival-guide.html` and `guide-scripts/vegan-restaurant-survival-guide.js` (the old 10-step page and
its gate script are gone). Liz is the Guide, on the right of every tab, one lip-synced clip per tab for visitors (`CLIPS`,
`rg-<tab>.mp4`) and members (`CLIPS_M`, `rg-m-<tab>.mp4`) in `vegan-media/media/liz/restaurant-guide/`, lines approved by Sean;
the first page shows her arms folded with an open smile (`rg-poster-first.jpg`). Liz's mouth sits higher in frame than Maya's,
so her clips were cut by hand (the audit, member overview and member quiz clips end on a closed-teeth smile: she never closed
her lips after the last word). Tabs: Overview, **Your audit** (the free check, open to everyone; the result, then the $49 and
$149 offer; members see their audits and orders), **The fixes** (one per view, `#/fixes/<id>`; a member's in the order their
latest audit puts them, using each check's `chapter`; Outdated or hard-to-find information is the free example), **Pulse**
(our interviews with business owners, `PULSE_PICKS`, and sourced research facts), **Get featured** (listed, claimed, votes, the
Partner plan; find your page; top-voted Vegan restaurants), **Promotions** (each Live or Coming; never a planned thing shown as
live), **Test yourself** (ten questions, one per view, 80% earns the Entrepreneur Track badge, kept in the browser), My list
(fixes, interviews, promotions through `ve-cookbook` saves; `ve_guide_saves` and `ve_guide_votes` take `fix` and `promo`),
Get access. Slug `vegan-restaurant-survival-guide` (owners from before keep it); the members-only fixes, quiz and two facts are
that row's `content_html`. Banner: Liz in the cream tee holding a chalkboard reading OPEN
(`vegan-media/media/guides/banners/vegan-restaurant-survival-guide.jpg`).

## Finding new places: the backlog check (Sean, 2026-10-10)

"Can the scan also look for new Vegan restaurants as well?" then "Go, start with the backlog". About 2,970 listings sat
quarantined since the May and June imports, never reviewed: 2,386 from our `ve_businesses` list (Instagram handles, no
address, many of them people and creators), 441 from the spreadsheet (244 with a city or "South Florida", 174 a name only),
129 from the SoFlo Vegans Facebook group (city and website), and a few others. `ve-discover` sorts them; nothing is listed
until someone decides (migration `20261010_ve_backlog_checks.sql`, table `ve_backlog_checks`, one row per listing).

- Tracks: **google** (a place: looked up on Google Places by name, kept only in the same state and, when we know which of our
  cities it is in, the same city area), **ig** (only a handle: read with Apify's Instagram profile scraper; a food business
  with one of our cities in its bio or post locations then goes to Google too), **thin** (a name only: nothing to check).
- Matching rules learned on the first batches: one name inside the other, or most real words shared with at least two of them
  (one shared word matched "Green Bar and Kitchen" to "Living Green Cafe"); our state only (Inca Chicken, Hollywood FL, matched
  Maryland); our city area only (South Florida's "Third Culture" matched Titusville); a renamed place ("Meraki Juice Kitchen is
  NOW Christopher's Kitchen") is a duplicate of the listing it became. Instagram leaves the business flag off for many
  restaurants, so a category or food words count as a business; creator categories (artist, writer, musician...) are people.
- Verdicts: **Ready to list** (open, and Vegan by Google's Vegan restaurant category or the business's own name or Instagram
  bio; Google's description saying "Vegan options" is only a Check), **Check**, **Not a restaurant**, **Closed** (Google, or an
  Instagram quiet for over a year with no Google profile), **Already listed**, **Not found**, **A person**, **Not enough to check**.
- Runs by cron `ve-discover-backlog` (every 2 minutes, 40 Instagram accounts and 25 Google lookups a run); with nothing
  pending it costs nothing. Keep it on: Directory review's Paste a list feeds it (the import backlog finished 2026-10-27).
- **Depot > Business outreach > New places** (`#places/<verdict>[/<city>]`, `#place/<listing>`, a card on the home): each
  verdict a tab with its count, by city; one business opens with what Google and Instagram said, links, and its website framed.
  **Add to the Directory** needs a category and how Vegan it is (100% Vegan, Vegan options, Vegan friendly), picked on purpose,
  and fills Google's address, place id, phone and website (`backlog_decide`). Since 2026-10-27 (Sean: "they're a rescue and they're
  a nonprofit... I should be able to add multiple categories... and to manipulate the logo with the new logo feature") the screen
  has the **logo editor** (`VELogoEditor`, with up to four pictures from their website, `add_site`; saved after the listing through
  `add_logo_url` and `logo_set`, so it shows in Logos > Done) and **Main category** plus **Also show it under** (any others,
  saved as `extra_categories` through `ve-claims` `admin_listing`); How Vegan hides only when every section ticked is Rescues,
  Sanctuaries, Nonprofits or Events; **Add the ticked** (Sean, 2026-10-27: "Build the Add all ticked button"): Ready to list has a tick box on every row
  and its own Add as (the category from the guess, `guessCatOf`; How Vegan for anything but an organization), and one button that
  adds every ticked row through `backlog_decide`, on whichever city tab is open. Organizations start ticked; a food place starts
  unticked until its How Vegan is picked (never guessed), and the button waits until every ticked row is complete. The logo and
  other sections are left to the place's own page (the logo sweep suggests a logo afterwards); a place's own page and Directory review's What it
  shows both have a **Name** field (Sean, 2026-10-27: "I wanted to change the title and I couldn't"), saved through `ve-claims`
  `admin_listing` like the listing editor; **Set aside** makes it `rejected` with a note,
  never deleted. Closed, Not found, A person, Not enough to check and Already listed have **Set these aside** for the page. A
  newly listed business joins its city's outreach through Find emails on the city card.
- **Ready to list, sorted by Logan** (Sean, 2026-10-27: "take a good estimated guess... populate it... once I see it up and running, I
  can go ahead and make adjustments"; migration `20261027_ready_to_list_bulk.sql`, run through a one-time function because the
  connector held it): 242 listed with a best-guess category and How Vegan and a note saying so, 19 set aside with why (duplicates,
  one closed, MorningStar Farms as vegetarian, American Humane and RSPCA for their farm labels), 11 left for Sean (no location to
  go by, or Google matched the wrong business). A listing with no address reads as online and shows in every chapter, so a local
  group known only by its chapter gets its state as well as `communities`.
- Next (approved by Sean the same day): the monthly search for new places in each city, after the check-ups.
- **The restaurant search for the newer chapters** (Sean, 2026-10-28: "Philadelphia doesn't have any restaurants, and neither does
  London... West Virginia, Maryland, Delaware, Washington, D.C., and North Florida... do a scan of those areas and start populating
  them"; Virginia had none either; migration `20261028_restaurant_search_new_chapters.sql`). 59 Google Places text searches ("vegan
  restaurant / cafe / bakery in <city or neighborhood>") listed 359 places live (`crawl_source` `restaurant-search`, Google place, address
  and map pin, a team note): **100% Vegan** when Google's main type is Vegan restaurant or the name says Vegan (not Vegetarian or -ish),
  public at once; **Vegan options** when Google tags it Vegan or Vegetarian as a second type, so it waits in Being vetted for 10 member
  votes. Bakeries and cafes by Google's type, caterers to Catering, the rest Restaurants; stores and places with no Vegan label left out;
  two branches with one name in one city get their neighborhood (or street) after a dash. By chapter: London 97, Virginia 64,
  Philadelphia 61, Maryland 54, Florida (the North Florida searches) 43, Washington, D.C. 18, Delaware 16, West Virginia 6. The logo
  sweep, the menu link finder and reader, and the essentials pass fill them in; the essentials cron was widened the same day to every 10
  minutes, 6 to 10 AM UTC, 30 a run (it costs nothing once nothing is due). A listing outside the US shows no empty state in its address
  (`directory/listing.html`). Run it again for a new chapter the same way: searches, then the same rules. **Atlanta and Los Angeles** got the same search the same day (Sean: "run the restaurant search for Atlanta and Los
  Angeles"; migration `20261028_restaurant_search_atlanta_los_angeles.sql`): 194 live, Atlanta 64 and Los Angeles 130. The Los Angeles
  chapter matched only five city names, so its list was widened to the cities found (Pasadena, Long Beach, Santa Monica, Burbank,
  Glendale, Culver City...; `LA` in `ve-hubs.js`, `LA_CITIES` in `directory/listing.html`, `HUBS` in `ve-claims`, `ve_outreach_cities`). **New York and Central
  Florida** the same day (migration `20261028_restaurant_search_new_york_central_florida.sql`): 191 live, New York 105 (a borough with no
  city of its own takes the borough, Brooklyn, Queens, Bronx, Staten Island) and Central Florida 86 (13 nearby cities joined `CF`, and
  `CFL_CITIES` in `directory/listing.html` is now the whole list). **South Florida** the same day (migration
  `20261028_restaurant_search_south_florida.sql`): 101 live (18 100% Vegan, 83 Vegan options; most of its Vegan places were listed
  already), and Naranja, North Bay Village, Opa-locka, Tavernier and Stock Island joined `SF` (the county slices in `SF_COUNTIES` moved
  with them; `SF_CITIES` in `directory/listing.html` is now the whole list). It took the Directory past 1,000 approved listings, which
  showed that `fetchAll` in `ve-region-directory.js` had never paged: its second request asked for the first page again, forever, and
  every Directory view stayed empty for about 30 minutes until it was fixed (`(offset || 0) + 1000`, `order=id`). The Directory reads
  1,000 listings a request and pages until a short page.

## Guide pricing, points and levels (LOCKED by Sean 2026-10-25, playbook `ve-pricing-points-passport`)

Concept session with V, locked by Sean: "lock it". This replaces Guide credits (canon `canon-ve-guide-pricing` v3, 2026-10-10).

- **$11 is the price of admission.** Any purchase of $11 or more makes the buyer a member: the Passport, a Guide, an event
  ticket or merchandise (`ve_member_admit`: `active`, `entry_paid_at`). After joining, members buy only what they want.
- **The Passport is $11 one time** (the Founding Membership, `ve-entry-checkout`) and comes with **1,100 welcome points**
  (`ve-stripe-webhook` `entry_contribution`, `ve_points_grant(member, 1100, 'welcome', 'welcome')`, once per member). Other ways
  in (a Guide, a ticket) give membership and the purchase, no welcome points. No monthly Passport is offered.
- **Every Guide is $11 or 1,100 points**, yours to keep (`ve_guides.access_rule = 'points'`, `cost_lesars` 1100;
  `ve-guide-unlock` `checkout` for $11, `unlock` for points; `ve_guide_purchase_paid` admits the buyer). Free Guides (the Welcome
  Guide, the Partner Guide) stay open to everyone.
- **Submitting or claiming a listing is $11 or 1,100 points, each one** (Sean, 2026-10-27, on claims: "it's like a guide or any
  other thing... If they come in as a business wanting to claim their listing, that's what their 1100 points is used for... they
  can ultimately decide not to use it for that thing and use it for something else"; `ve-claims` `start` takes `pay: 'points'` the
  same way, and Join the Directory shows Use your points on a claim too. However someone comes in, the $11 is what the 1,100
  points are for: the thing they came for, or anything else points buy. Sean, 2026-10-27, on listings: "you get 1100 points when you register. So you
  could use that for submitting your listing... if you want to submit multiple listings... 1100 points each time... or you can just
  pay for the listing"). Join the Directory's How to join, when adding a business, has **Use your points** beside the Partner plan and
  the $11 (the live balance from `ve-auth` `me`); `ve-claims` `listing_apply` `pay: 'points'` saves the application, then
  `ve_listing_submit_points(member, claim)` takes 1,100 from both balances once per application (`points_ledger` reason
  `listing_submit`, ref `claim:<id>`; migration `20261027_ve_listing_submit_points.sql`), and it waits in Depot > Claims like any
  application. The policy (`/policies#membership`), the Guides' facts and a saved answer say the same.
- **Every purchase earns a flat 25-point thank-you** (`ve_purchase_thanks(member, ref)`, reason `purchase_thanks`, once per
  ref: `stripe:<session>`, `guide:<id>`, `tour:<order>`).
- **Points are given, never bought.** They come from taking part: Bounties, competitions and campaigns, the Daily Pulse, the
  Community Board, referrals. They unlock Guides, pay for Guide chat (4 a message) and can be **given to a business or
  nonprofit as a boost, never money** (`ve-votes` `contribute`, `ve_listing_contribute`, 1 to 10,000; the listing's total is
  `ve-votes` `points`, `ve_listing_points`; the Give box on every listing page).
- **Levels 1 to 3 on lifetime points** (`member_points.total_points`, which never goes down): Level 2 from 2,500, Level 3 from
  10,000 (`ve_member_level`; the dashboard's `VE_LEVEL_AT`; change both together). Spending or giving points never lowers a level.
  Sean confirmed the thresholds on 2026-10-25: "go with 2,500 and 10,000 for the levels." The perks of each level come later.
- **Credits are retired.** `trg_ve_founding_credit` is dropped, `ve-guide-unlock` `buy_credits` answers 410, the dashboard's Buy
  Guide credits is gone. The credit tables and functions stay so history reads; no member held a credit on 2026-10-25.
- Points live in two places (`members.lesars_balance` and `member_points.available_points`); every points function moves both
  (`ve_points_grant` does). A new points function does the same.
- **A signed-out Vote goes to `/passport`** (`public/ve-votes.js`, the listing page), the **Passport Guide**: the Dairy Guide's
  layout, nine tabs (Overview, Find your places, Your community, Guides, Points and levels, What your $11 supports, Bring people
  in, For businesses, Get your Passport), a Guide's picture on each tab (`VEGuideArt` square), no clips, sign-up at the end.
  `?from=vote&back=<path>` shows the voting note and returns there after sign-in.
- **`/passport` is the one Passport** (Sean, 2026-10-25: "make sure that that version is the default version for passport... it does
  a better job than what we had before"). The nav's Join button, every Get your Passport button, the city hubs' Get Passport
  (`/passport?community=<slug>#/join`), the Directory, Explore, the path pages, login and the Guide gate all go there; `/join` (the
  old Get Your Passport page) and `/passport/join` forward to it. An invite code (`?ref=`) or a city (`?community=`) in the link is
  kept for the visit (`sessionStorage` `ve_join_ref`, `ve_join_community`) and sent with the sign-up window's signup
  (`public/ve-auth.js`), as `/join` used to. `/welcome` stays the guided tour (Start Your Journey); its last slide, Take your
  founding seat, now opens the Passport Guide instead of its own open contribution (Sean, 2026-10-25), members give more from the
  dashboard's Contribute, and the nav's announcement (`ve_nav_announcements`) reads "Your Passport: $11 one time, with 1,100 welcome
  points" and links to `/passport`.
- Migration `20261025_ve_points_levels_admission.sql` (functions, contributions table) and `20261025_ve_guides_points_rule.sql`
  (Guides to points, the Guides' facts, saved answers, canon). What the Guides say about prices lives in
  `ve-guide-platform-facts` and `guide_kb_answers`; change them with this.

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
  partner dashboard. And then underneath it is a sub menu"). **Its tab is hidden from the tab row** (Sean, 2026-10-27: "remove the partner
  dashboard and then just whenever somebody clicks own this business, our claim listing, that's where it goes"); since
  2026-10-27 (Sean: "link the claim boxes to /business too") the two claim spots, At a Glance's **Own this business? Add
  details** and the sidebar's black **Claim Listing** box, open `/business?listing=<slug>` (`claimHref`, `data-claim-open`),
  whose Get started claims that listing (`/claim?listing=<slug>`); the tab still opens by `?tab=brand` (`pdHref`); the header's "Is this your business? Claim it" and the Build Out This
  Profile card are gone. The tab shows for the owner, super admins and a brand's partner or link. The claim box and the claim
  page say "Before anything is approved, our team carefully reviews each claim to make sure it is accurate." (`CLAIM_REVIEW`). One tab, `data-tab="brand"`, after Products on a brand page and
  last elsewhere. Locked for visitors (`partnerLocked`): claim this page (a brand's claim carries Front Row Start before
  January 1), or, for a business that is not listed, **Apply to be listed** (Join the Directory, below: `ve-claims` `listing_apply`, any
  Vegan business, anywhere; it makes an unlisted (quarantined) listing tagged `ve-application` and a claim in Depot > Claims, labelled
  Application to be listed; approving lists it and makes the applicant its owner). A non-brand owner and super admins get
  the business dashboard (`loadPartnerHome`, see **The business dashboard** below). A brand's partner gets the sub-menu (`.pd-subnav`, `PD_SUBS`): Getting started, **Insights** (the
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
  time. Since 2026-10-24 the $11 opens the dashboard and its numbers (canon `canon-ve-business-dashboard`, replacing the
  Partner-only rule): the member card lists the dashboard, the Partner card the front-row seat, ads placed for them and a
  campaign manager. `brand_stats` answers `partner_only` only to an owner with neither the membership nor a plan, and the
  page shows `partnerUpsell` (what they can add, never what they lack).
- **The Partner plan for every business** (Sean, 2026-10-09: "I would rather give everybody the Oatly style offer... the way in...
  they can get access and take control knowing that it's going to activate come January... invested in the platform because of
  the platform, not because of 11 bucks"). `ve-claims` tier `brand` is the $111 quarterly Partner plan for any listing: **Brand
  Partner** for a product brand, **Partner** (Vegans Explore Partner on Stripe and in email) for everyone else (`tierName`). Front
  Row Start applies to all: no charge today, first quarter in January 2027. It is the default on Join the Directory, for a claim
  and for a new business (`listing_apply` with `tier: 'brand'` runs the same subscription checkout); "Just claim it for now"
  (a contribution from $11, Founding Member) is the second choice, and Passport Stop and Anchor show only when the link asks
  (`?plan=verified|plus`). A brand returns to its page (Maya's Getting Started); any other Partner and every new business to
  `/claim?...&claim=submitted&joined=partner`. The $11 is the member offer; members join through the Guides.
- **The business dashboard** (Sean, 2026-10-24, Love Life Cafe as the prototype: "there should be two versions of the partner
  dashboard. One is the preview with Liz explaining, and then the other is the actual dashboard"; canon
  `canon-ve-business-dashboard`). Visitors get Liz's tour (`mountPartnerLocked`; on a claimed listing it says whose dashboard
  it is). The owner and super admins (labelled Viewing as admin; `?as=visitor` shows them the tour) get `/public/ve-partner-dashboard.js`,
  one view at a time (`?tab=brand&pd=<view>`): **Home** (30 days against the period before, Get your page ready with what is
  left as cards and what is done on one line, What's new), **Insights** (7, 30, 90 days or a year, a chart, what people did,
  where they came from, a day-by-day table that sorts by any column), **Your page** (the four-step editor), **Menu** (by section,
  one item per view, `&item=<id|new>`), **Ads** (their campaigns: `ad_businesses.listing_id` -> `ad_sponsor_campaigns` ->
  `ad_campaigns` -> `ad_impressions`; each ad spot with its monthly views; Ask about this spot emails Sean and the account
  manager and logs `ve_initiative_interest` `ad-placement`), **Opportunities** (our campaigns, the same slugs as the brand
  `OPPS`, and open roles), **Audit** (restaurants and food places; our monthly check-up reads as ours, never a score they bought),
  **Guides**, **Your plan**. The $11 Founding Membership (or a live plan) opens it; an owner who is not a member edits the page
  and menu and is offered the $11. Server: `ve-claims` `owner_dashboard` (everything in one call), `menu_list` / `menu_save` /
  `menu_delete` (each a `ve_listing_edits` row, field `menu_item`, undone from the Depot by `ve-outreach`), `ad_request`.
  **What's new** is `ve_dashboard_cards` (audience business, member, coach, pre_vegan or all; kind new, wizard, offer, tip;
  live between `starts_at` and `ends_at`): a new tool reaches every dashboard as a row, no code. Every listing counts what a
  visitor does next (`trackActions` in `directory/listing.html`: call, directions, website, order, social, menu, photos;
  `ve_listing_track`), and `ve_listing_stats` returns each day's views, visitors and actions plus the period before
  (migration `20261024_partner_dashboard.sql`). A super admin's **Edit listing** on a listing page is a green pencil on the name's row on phones (`.vla-edit-ico`, `has-vla`;
  Sean, 2026-10-27: it "pushes the other buttons to the left"), the text button under Vote and Save on desktop. A listing's Photos, Video and Pulse tabs show only once they have something
  in them (Sean, 2026-10-24: "I'm not a big fan of the coming soon sections").
- **Menus are linked, not copied** (Sean, 2026-10-27, replacing the copying below: "how do we know if they're updated?... if
  she changes just one of them, we're presenting wrong information... a tab that says menu, and... when they click it, it takes
  them out to wherever their menu is listed... not until they claim it"; migration `20261027_menu_links_not_copies.sql`, run
  through `ve-once-menu-links`). A food place (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep;
  `PLACE_MENU_CATS` in `directory/listing.html`) that is not claimed has a **Menu** tab that links out (`#tab-btn-menu-link`,
  `listings.menu_crawl_url`, counted as a `menu` action; a location uses its main listing's); a claimed one shows the menu its
  owner keeps on the Partner Dashboard (and any the team entered), never a copied one. Brands keep their Products list. **Then,
  the same day** (Sean: "if we can get an accurate menu, we can use that... only if we can keep the menu up to date with our
  processes"; migration `20261027_menu_monthly_recheck.sql`, run through `ve-once-menu-check`): an unclaimed place shows the menu
  we copied while it is current, each item's `ve_menu_items.checked_at` under 35 days old ("From their website, checked <date>. We
  check it every month."); older, the Menu tab links out instead. The copying runs again (crons `ve-menu-reader`,
  `ve-menu-import-queue`, dispatcher `menu_import`), and with nothing new to read the reader's sweep re-reads the stalest copied
  menu from the page it came from (`ve_menu_refresh_due`: unclaimed, oldest over 28 days, a failed re-read retried after a week): a
  good read replaces the copied items, a failed one changes nothing, so the menu ages out to a link. The **link finder** (`ve-menu-reader` `link` / `link_sweep`, cron `ve-menu-links`, 15 every
  10 minutes, no AI) reads their home page and takes their menu PDF, else their menu page, else their own ordering page (Toast,
  Square `/s/order`, Clover...; through their own Order page when that only points there), never a marketplace; it fills only an
  empty `menu_crawl_url` (a `ve_listing_edits` row) and notes what it found (`ve_menu_imports.link_checked_at`, `link_note`). The
  75 places whose menu had been copied took that page as their link. Directory review's list is **No menu link** (`#menu`,
  `ve_menu_missing()`): Not found, No website, Not checked yet; Menu link + Save, **Find the link again** (`menu_retry`) and
  **No menu online** (`menu_none`). Connecting a point of sale for claimed owners is researched, not built (2026-10-27): Square's
  Catalog API by self-serve OAuth with a catalog webhook is the one any owner can connect; Clover needs an approved app; Toast
  needs its partner program (an owner's own Standard API credentials may not be shared with a third party under its terms).
- **Menus on every listing** (Sean, 2026-10-24: "I would love to see the menus on all the listings"; migration
  `20261024_ve_menu_import.sql`). `ve_menu_items.source` is `manual` (the team), `owner` (their dashboard) or `import`. The
  Background writer (dispatcher source `menu_import`, Station 2, batch 5) works through `ve_menu_imports` (food places with a
  website and no menu; `ve_menu_import_queue()` adds new ones) and copies the menu each business publishes on its own site,
  never a third-party listing and never guessed, through `ve_menu_import_save`, which saves once and refuses a listing that
  already has a menu. Cron `ve-menu-import-queue` (07:17 UTC) queues new food places every night
  (none did after 2026-10-24); on 2026-10-27 274 bare-domain websites (guanabanas.com) were made https:// links (logged in
  `ve_listing_edits`), which let 98 more places queue (migration `20261027_menu_queue_nightly.sql`). **The menu reader** (Sean, 2026-10-27: "build the menu
  reader"; edge function `ve-menu-reader`, migration `20261027_ve_menu_reader.sql`) takes what the writer left at `none` (a picture,
  a PDF, an ordering page that loads only in a browser): it reads their home and menu pages, follows their own ordering links
  (Toast, Square `/s/order`, Clover, ChowNow, order.online...; never DoorDash, Uber Eats, Grubhub or Yelp), opens script-only pages
  in a real browser (Apify `rag-web-browser`, three a listing), takes the menu's PDFs and pictures (Wix and Squarespace originals,
  18 MB a read) and any menu data on the page, and Claude (Opus 5.5, structured output) copies the menu word for word. A Vegan
  place keeps its whole menu; any other keeps only what its menu marks Vegan. Saved through `ve_menu_import_save`; each listing is
  tried once (`reader_at`, `reader_note`, `reader_read`). Cron `ve-menu-reader`, one every 5 minutes in the background; `read`
  with `save: false` keeps a test in `reader_preview`. Proven 2026-10-27: Cafe Gratitude 144 items from its PDF, Under the Mango
  Tree 28 and Blue Tree 19 from their Square pages. Toast's own ordering pages return nothing to an automated browser, so a menu
  that is only on Toast is still missing. An Instagram pass was built and switched off the same day before it read anything (Sean: "I don't think it's probably the best route"); `ve_menu_imports.ig_at` stays unused. **No menu yet** (Sean, 2026-10-27: "Go with the No menu yet list in Directory review";
  migration `20261027_ve_menu_missing.sql`) is a Directory review tab (`#menu`, `ve_menu_missing()` through `ve-outreach`
  `review_list` `menu`): every open food place with no menu (locations left out, they show their main listing's), Not found first,
  then No website, then Being read, most voted first. A listing's **Menu** card says what the reader found and opened, and offers
  **Add it by hand** (the business dashboard's Menu, `?tab=brand&pd=menu`), **Read it again** (`menu_retry`: the writer, then the
  reader) and **No menu online** (`menu_none`: `details.menu_none_ok` and a team note; it leaves the list). A Menu link saved there
  re-queues both readers, and the reader starts from it. The Menu tab says "From their website, checked <month>" for an imported menu. 168 queued on 2026-10-24.
- **Restaurant essentials** (Sean, 2026-10-25: "just because it's vegan doesn't tell the whole story... all the restaurant listings
  have, 250 character about us... the hours... the socials... the address that you can click and go to Google Maps... and then
  the menus... media... can come later once they become members"; migration `20261025_restaurant_essentials.sql`). Food places
  carry **what kind of food** (`listings.cuisines`, up to four: American & comfort food, Soul food, Caribbean... Global mix for a
  place that is not one thing; the list is `CUISINES` in `ve-listing-admin.js`, `ve-region-directory.js`, `ve-claims` and the
  table check, change all four), set in the listing editor, shown as badges beside how Vegan it is, and a Food filter on
  Restaurants, Food Trucks and Catering in the Directory. The address on every listing opens Google Maps (`mapsUrl`: their
  Google place when we hold `google_place_id`). `ve_restaurant_essentials` lists every open food place and what it lacks (about
  of 150 characters or more, hours, socials, street, menu, cuisine). Filled from what the business publishes, never invented,
  only into empty fields and never over an owner's own words, each change a `ve_listing_edits` row the Depot can undo:
  `ve-restaurant-audit` `essentials` (cron `ve-listing-essentials`, 8 AM UTC) takes hours, street, place and website from Google
  and the socials their home page links to; the Background writer (dispatcher source `listing_essentials`) writes the about (up
  to 250 characters) and the cuisines from their own site through `ve_listing_essentials_save`; menus come from `menu_import`.
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

## Dashboard versions (Sean, 2026-10-24; built 2026-10-25)

"The dashboard could actually be the main dashboard, and then we have different versions of it. So if they're a coach...
if they're a pre-vegan, the dashboard set up a certain way." One `/dashboard` with four versions: **Business**, **Just
starting** (`pre_vegan`), **Coach or pro** (`coach`) and **Member**. A version decides only which cards join For you
(`renderVersion` in `dashboard/center-console.html`) and the order of Your tools (`DASH_TOOLS_FIRST`); everything else is
shared.

**Every tab wears the city banner** (Sean, 2026-10-27: "the dashboard and the depot and my saves... and even guides... should have
the same header as events directory... when you expand it to see something there, even if we still use just the city that's
selected"): the Dashboard (Welcome back, <name>; it replaced the welcome row), Guides, My Saves and the Depot join Directory, Events,
Communities and Media (`mountTabBanners` in center-console). The picker is the dashboard's active city on every one; open, each
shows its own numbers (`setTabStats`: points, lifetime and level; your points and the Guides they unlock; episodes and places
saved; Events waiting and New places ready to list, which open them). The Depot's Go to is the site's dropdown (white, 6px corner,
our chevron; `depot-tabs.js`), and Take the tour (`ve-tour.js` `.ve-tour-launch`) has a 6px corner, not a pill.

The menu (Sean, 2026-10-27): Dashboard, Directory, Events, Daily Pulse, Media, Guides, Communities, My Saves, then Depot for
super admins (`data-tab-order` on each section; `data-tab-superadmin` hides one from everyone else and from a View As preview).
View As moved from the welcome row to the avatar's account menu.

The Dashboard tab (Sean, 2026-10-26): **For you** (it was Action items) is one list of tiles, the checklist tiles (Set up
your Guide, New here?, the Community Manager ones) and then the version's cards (`ve_dashboard_cards`) as the same tile, each
with a flat line icon (`FICON`; Sean: "make sure the icons are flat. I don't like the colorful ones"). Five show, the rest
scroll inside; the version switch sits beside the title. The **Leaderboard** beside it is one board for everyone (no This City
/ Global: "people aren't really locked to any particular community anymore") and on desktop is exactly as tall as For you,
scrolling inside (`syncHome`). **Your tools** holds every tool, with flat icons (`memberTools`; the Community Manager ones for
staff, Contribute for active members, the admin cards first for super admins). The Tools tab left the menu: its section stays
only as the place a tool opens (Bounties, Campaigns, My List...), with "Dashboard" as the way back, and `/dashboard/tools`
lands on the Dashboard tab. **Guides** is a tab in the top menu, after Dashboard (`/dashboard/guides`; "one of the big things
that we're selling"), and a tile in Your tools.

- Which one: the member's choice (`members.dashboard_version`, the switch on the block; picking the suggested one clears it),
  else `ve_dashboard_version()`: owns a listing or Business owner in the Mission Survey (q3), business; q6 Curious / pre-Vegan,
  Flexitarian or Vegetarian, pre_vegan; Service provider, coach; else member (migration `20261025_dashboard_versions.sql`).
- Its cards: Business shows each listing they own, opening its business dashboard (`/directory/<slug>?tab=brand`), or Join the
  Directory; Just starting shows its `wizard` cards as numbered first steps; every version shows its What's new. Cards are
  `ve_dashboard_cards` rows by `audience` (business, pre_vegan, coach, member, all): change what a version shows with a row,
  no code. A business card's link that starts with `?` opens on their first listing's dashboard.
- Edge function `ve-dashboard` (`home`, `set_version`; verify_jwt off, the member token checked inside).
- **A listing opened in the dashboard has its own address** (Sean, 2026-10-27: "if somebody just wanted to share a link to their
  page"): `/dashboard/directory/<slug>` (rewrite in `vercel.json`; back and forward move between the Directory and the listing),
  **Copy link** beside the breadcrumb copies the public `/directory/<slug>`, and the address opened signed out goes straight to
  the public listing (`listingSlugFromPath` in center-console). The public Directory already opens `/directory/<slug>`.

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

## Sign In As: switch into another account (Sean, 2026-10-26)

"The same way I do view as, I want to have that option to choose from the super admin... so I can log in and see that
experience." View As only paints the page over the super admin's own session; **Sign In As** (the avatar's account menu,
under View As, `public/ve-account-menu.js`) is a real sign-in, so every call the page makes runs as that member. Only accounts in `ve_switch_accounts` can
be switched into (Logan Russell, Sean's founding-member walkthrough account, and the six Guides), only by a super admin signed in
as themselves, through `ve-switch-account` (`list`, `switch`; an 8-hour token carrying `switched_by`, refused for another switch;
each switch logged to `stream_events`). The super admin's own session waits in `localStorage` `ve_switch_from`; the
**Back to my account** pill (bottom left) or the account menu puts it back, and Sign out clears it. Add an account with a
`ve_switch_accounts` row. The Guide accounts (`<guide>.guide@vegansexplore.com`, `member_class` agent, no password, playbook
`ve-guide-accounts`) cannot vote, check in or give points (`ve_refuse_agent_actions` triggers on `listing_daily_votes`,
`ve_checkins`, `ve_listing_point_contributions`). Anything posted while signed in as a Guide is live and, until the Guide
badge is built, reads like any member's post. Migration `20261026_ve_switch_accounts.sql`.

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

## Footer, Policies and Contact (Sean, 2026-10-26)

The footer (`public/footer.js`) reads ABOUT (`/welcome`), JOIN US (`/passport`), POLICIES (`/policies`), CONTACT (`/contact`),
our socials and "A LESARUSS brand" (lesaruss.com). Socials, checked 2026-10-26: Instagram and TikTok `@vegansexplore`, YouTube
`@VegansExplore` (the channel our episodes are on, by YouTube oEmbed), Facebook `facebook.com/vegansexplore` (Sean gave it,
2026-10-26). Never link a social we have not checked.

- `/policies` (`policies.html`): one policy per view (`#overview`, `#privacy`, `#ai`, `#terms`, `#membership`, `#community`,
  `#business`, `#cookies`, `#accessibility`, `#contact`), menu on the left, a dropdown on phones. **How we use AI** says the
  Guides are AI characters, AI replies can be wrong and are not advice, and where else AI runs (the Pulse, listing text and
  menus, illustrative photos, audits and check-ups, transcripts). The operator is LESARUSS Inc., 300 SW 1st Ave, Suite 155,
  Fort Lauderdale, FL 33301 (Vegans Explore is its brand since the 2026-10-08 board consent). When a feature changes what we
  collect, what AI does, or the price and points rules, change the policy with it and its Last updated date.
- `/privacy-policy`, `/privacy`, `/terms-of-use` and `/terms` redirect to `/policies?p=privacy|terms`; `/about` to `/welcome`.
  They, and `/contact`, used to proxy to archive.vegansexplore.com, which no longer exists (no DNS, checked 2026-10-26).
- **The old WordPress addresses** (Sean, 2026-10-26): 327 more paths used to proxy to archive.vegansexplore.com. They are
  redirects now. Old episodes and articles whose slug a published `ve_pulse_content` row has go to `/pulse/<slug>` (74), and
  showcase and article posts about a listed business go to its listing (43); these are permanent. Old sections go to what does
  their job today (club, register and premium-access to `/passport`, `/dashboard` or `/login`; partners pages to `/partners` or
  `/claim?add=1`; directory pages to the matching `/directory?tab=`; events and festivals to `/communities`; other showcases to
  `/directory`; other articles to `/pulse`); these are not permanent, so they can be pointed somewhere better later. Never add
  a rewrite to an outside host for an old path; redirect it to a page we serve.
- `/contact` (`contact.html`): one mail link per reason to contact@lesaruss.com with the subject filled in (no form yet), the
  address, the socials and the LESARUSS card.

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
Commit author must be `Sean A. Russell <contact@lesaruss.com>`.
Vercel project: `vegansexplore-com`, team: `team_G2qO2cUYl8ZmeOMaamFvY8C6`.
