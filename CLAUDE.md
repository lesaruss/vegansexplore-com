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
Events, Brand campaigns), Content (Inbox, Sources, Cookbook, Content index, Library), People (Community Managers, Ambassadors, Founding Members, Profiles, Bounties, Dinner guests, Links, Invites),
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

## One framework for every brand: LESARUSS.ai (Sean, 2026-10-29)

"If we make an update in Vegans Explore and the look and feel and the functionality, it needs to match LESARUSS.ai. So we're
using one framework throughout all of them. What changes is just maybe the color and the look and feel of it." The LESARUSS.ai
Directory is this site's Directory: lesaruss.ai (lesaruss/lesaruss-ai-site `next.config.ts`) proxies `/public/*`,
`/directory/<slug>`, `/claim`, `/communities/*` and `/directory/logos/*` here, and its `/directory` page mounts
`ve-region-directory.js` and `ve-city-banner.js`. A change to those files, `directory/listing.html` or `claim.html` shows on
both sites, so check a change on both (`?brand=lesaruss` turns brand mode on here for the visit, `?brand=ve` off).

- **`/public/ve-brand.js`** is the brand, loaded first in `<head>` of the listing page and `claim.html`. On lesaruss.ai (and
  `lesaruss-ai-site*.vercel.app` previews) it sets `window.VE_BRAND`: its sections (`sections`, `sectionOf`), which listings are
  its own (`ownsListing`: tags `lesaruss-ai-directory`, `-candidate`, `-business-member`, and category Studios), its Passport and
  sign-in links, its vote window words (`gates`), its claim settings (`claimApi`, HQ's `/api/claim`; `applyUrl`, `claimTicks`,
  `claimNext`) and its colors. On vegansexplore.com it does nothing.
- **Colors** are CSS variables with our values as the fallback: `--ve-green*` on the pages and `--vb-*` in the shared components
  and the listing page (`--vb-accent`, `--vb-accent-ink`, `--vb-go`, `--vb-go-hover`, `--vb-soft`, `--vb-line`, `--vb-deep`...).
  A new green in these files goes through a variable, never a bare hex, or LESARUSS.ai wears it.
- **Header and footer**: `nav.js` and `footer.js` hand over to `VE_BRAND.drawNav()` / `drawFooter()`; `analytics.js` skips
  lesaruss.ai.
- **The listing page** (`VB` in `directory/listing.html`): a listing that is not the brand's opens on vegansexplore.com; the
  breadcrumb uses the brand's sections; no How Vegan, check-ins, points or billboard; the claim link and vote box are the brand's.
- **`claim.html`** (`VB`): Claim your listing, the same steps and cards, the brand's listings only, no How Vegan or Vegans Explore
  account, one way to join (the $11 LESARUSS Passport through HQ `/api/claim`, which records the claim for Depot > Claims), and
  Add your business goes to HQ's business application.
- **The Directory component** takes `config.brand` (`sections`, `catMap`, `include`, `trust: false`, `vegan: false`,
  `listingBase`); `ve-votes.js` sends a signed-out vote to the brand's window.
- **Votes on lesaruss.ai** (Sean, 2026-10-29: "Go ahead with the voting next"; migration `20261029_lesaruss_ai_votes.sql`). A
  signed-out Vote opens Voting is for LESARUSS members (`VE_BRAND.gates.vote`): **Become a Diplomat** (`/join`) and **Sign in with
  LESARUSS** (`VE_BRAND.signIn` 'lesaruss': `data-ve-lesaruss`, so `ve-auth.js` starts Continue with LESARUSS as the client
  `VE_BRAND.ssoClient` 'lesaruss-ai', a `lesaruss_sso_clients` row HQ's `/connect` names). It lands on `/auth/lesaruss` (this
  page, proxied, branded), and `ve-lesaruss-sso` with `client: 'lesaruss-ai'` lets in only a LESARUSS member (`lr_member_entitled`:
  a Diplomat, a `brand_memberships` 'lesaruss-ai' passport, which HQ records when a claim's $11 is paid, or a super admin), makes
  no account, refuses anyone else with `membership_needed`, and signs a token with `brand: 'lesaruss-ai'`. `ve-votes` takes such a
  token only for a listing in the LESARUSS.ai Directory (`lr_listing_in_directory`) and only while `lr_member_entitled`, counts it
  in the same pool (`listing_daily_votes`, once a day per listing), and refuses its `contribute` (points are ours). A Vegans Explore
  Passport alone does not vote there (each community is its own $11); a Diplomat votes on both. **The $11 LESARUSS Passport on its own** (Sean, 2026-10-29: "Build the $11 LESARUSS Passport checkout"): the members window's
  button (`VE_BRAND.passportUrl` `/passport`, with `?from=` and `?back=`) opens lesaruss.ai/passport (lesaruss-ai-site `app/passport`),
  which pays through HQ `/api/passport` (`lib/passportCheckout.ts`, table `lr_passport_checkouts`, migration 060) and, once Stripe says
  paid, records `brand_memberships` 'lesaruss-ai' passport (source `passport_checkout`) on the email's one members row, makes its HQ
  sign-in (no password: the 6-digit code on /login sets one), emails the steps, and offers Sign in with LESARUSS back to the listing.
  It is confirmed on the return from Stripe and by HQ's Stripe webhook (`/api/stripe/lesaruss-ai`, endpoint `we_1UW0D0JqP8HzdnUnp89MSa8n`
  on the LESARUSS account, 2026-10-29: `checkout.session.completed`, `async_payment_succeeded` and `expired` run the same confirm for the
  Passport, listing claims and Guide orders, so paying and closing the tab still records it; its signing secret is
  `lesaruss_secrets.LESARUSS_AI_STRIPE_WEBHOOK_SECRET`). Proven 2026-10-29: a free LESARUSS
  account refused, an internal Diplomat signed in and voted once, a second vote and a Vegans Explore listing refused, then removed.

- **The front door** (LOCKED by Sean 2026-10-29, playbook `lesaruss-ai-front-door`, canon `canon-lesaruss-ai-front-door`): LESARUSS.ai
  runs this engine with business topics in place of cities. Build order: Media podcasts and the Pulse, Funding (a tab on the events
  engine) and Events, the Guides page and the Join Guide, the dashboard on lesaruss.ai, Labs and Advertising; LESARUSS 360 in the footer
  and dashboard. **Podcasts** (migration `20261029_lesaruss_ai_podcasts.sql`): 23 marketing, leadership and development shows found on
  Apple Podcasts, About from each feed's own description, tag `lesaruss-ai-directory-candidate` (so Vegans Explore's Directory and Media,
  `rank` in `ve-media.js`, leave them out), `crawl_source` `lesaruss-ai-podcasts`, `specialty` the topic, no How Vegan.
- **The Pulse by topic** (built 2026-10-30, migration `20261030_lesaruss_ai_topic_pulse.sql`; Sean: "it's really not going to be
  focused on regional stuff"). lesaruss.ai/pulse is this site's `pulse.html` (proxied) in brand mode (`VE_BRAND.pulse`): the banner
  picks a business topic (AI, Funding, Marketing, Leadership, Creators, Business operations, Events, or All topics; `?topic=`), never a
  city, and only the Pulse tab shows (no city boards, Suggest a Topic or ads). A topic is `ve_board_posts.community_slug` `lr-<topic>`
  (`ve-board` `LR_TOPICS`, `lr-all` lists them all); anyone reads, commenting and reporting need a LESARUSS member
  (`lr_member_entitled`), and a LESARUSS sign-in takes part only there. Its stories are 21 business feeds (`ve_news_feeds` scope `topic`,
  brand `lesaruss-ai`, `city_slug` the topic; TechCrunch, Crunchbase, Marketing Dive, Fast Company, Tubefilter, BizBash...), every story
  kept with status `national` so it stays out of the Depot Inbox. The seven topics are in `pulse_auto` (queued 6 PM Eastern, out at 7 AM),
  and the writer's `pulse_topic_write` instructions carry a LESARUSS.ai section (business voice, no cities or Vegan framing).
  The Inc. feed is off (its pages refuse the writer, 403); the first morning's other six briefings were written on schedule.
- **Events and Funding** (built 2026-10-30, migration `20261030_lesaruss_ai_events_funding.sql`, run through the one-time
  `ve-once-lr-events`, now the 410 stub). One events engine: LESARUSS.ai's rows are `events` with `tenant_id` LESARUSS
  (`...0001`), Vegans Explore's `...0002`, and **every Vegans Explore reader filters to its tenant** (`ve-events.js` load,
  `hub-news.js`; the others read by id or host listing). `events.listing_kind` is `event` or `funding`; a funding row's `starts_at` is
  its **deadline** (Upcoming = open, Soonest = closing soon), `ticket_url` its official apply page, `category` its kind (grant, loan,
  accelerator, competition, fellowship) and `events.funding` `{offered_by, amount, amount_usd, eligibility, rolling}`. Business events
  use conference, summit, pitch, tour, networking, webinar, workshop, meetup. `ve_event_intake` takes `"tenant": "lesaruss"` (or the
  source's tenant), `listing_kind`, `deadline` and the funding fields, refuses a closed one (`closed`) and one with no deadline.
  lesaruss.ai/events and /funding are this site's `events/index.html` (proxied) in brand mode (`VE_BRAND.calendar`): the banner picks
  Events or Funding, `VEEvents.mount(..., {tenant: VEEvents.LR_TENANT, kind})`, a funding tile (what it offers, who can apply in two
  rows, Closes with days left in red under 15, Apply), Sort Closing soon / Biggest first, Open / Closed; no Submit, event view or ads
  yet (the name opens the official page). The tile colors go through `--vb-*`. `ve_event_sources.tenant_id` and `listing_kind` (event,
  funding, both): 16 LESARUSS.ai sources (Hello Alice, IFundWomen, Amber Grant, SBA, Y Combinator, Techstars, Google for Startups,
  searches for grants, pitch competitions, creator funds and business, AI, marketing and creator conferences, Eventbrite business
  online); the writer's `events_crawl` instructions have a LESARUSS.ai section, and nothing goes live until approved in **Depot >
  Events > LESARUSS.ai** (`?brand=lesaruss`; every call carries `brand`, the queue, sources and Add are that brand's, and an item's
  funding fields are editable). The Pulse writer's city events are Vegans Explore's only; a LESARUSS.ai topic may use LESARUSS.ai's.

## Analytics (Sean, 2026-10-28)

"Use the same exact structure as the analytics section in BCPS Marcom... put it in our depot... see what's popular, what's
working, which communities are growing the most... break it down by our communities... a ranking based off certain metrics."
**Depot > Analytics** (`/admin/depot/analytics`, first in the Go to menu, group Insights; super admins only), laid out like
bcpsmarcomm's `AnalyticsPage.tsx`: the period (Last 7 / 30 / 90 days, This year, Custom; always against the period just before),
four tiles two by two beside the traffic graph (Visitors, Page views, New members, Top source), then tabs (a dropdown on phones),
each a searchable, sortable, ranked and paged table: Top pages, **Communities**, Daily Pulse, Directory, Traffic sources, Places,
Campaigns, Ads, Members. The address carries it (`?range=90&bots=show#communities`).

- **Communities** ranks every chapter by any column (Rank by, or a column head): Visitors (Google places them in the chapter: by
  city for a chapter with a city list, by state for a whole-state chapter; `chapterOf` in `ve-analytics`), Visitor growth, Hub page
  views, Members, New members, Listings, New listings, Listing views and actions, Check-ins, Pulse posts and comments, Upcoming
  events, and **Overall** (each shown column scored against the best chapter in it, best = 100, averaged). The columns are picked on
  the page and kept in the browser (`localStorage` `ve_an_chapter_cols`, `ve_an_chapter_rank`).
- **Traffic is Google Analytics**, property 432623792 (vegansexplore.com, tag G-2B6SKSQZLX in `/analytics.js`; history from March
  2024). Every public page carries it: `nav.js` loads `/analytics.js` on any page that does not, and `analytics.js` runs once a page
  (`window.__veGA`); never on `/admin/` pages or the board consent, so the team's Depot work is not traffic (Sean, 2026-10-28).
  **The team's visits count like anyone's** (Sean, 2026-10-28: "it's still traffic to the page... include my traffic as well";
  Google counts each browser once as a visitor). A few hours' exclusion of super admins' browsers the same day was undone, and
  `analytics.js` clears its old mark (`localStorage` `ve_ga_off`). Google's numbers are read live by the edge function `ve-analytics`
  with the LESARUSS analytics reader
  (`lesaruss_secrets` `GA4_SERVICE_ACCOUNT_JSON`, `lesaruss-analytics-reader@...`, which can read every LESARUSS property), cached
  3 hours in `ve_analytics_cache` (Refresh now skips it). Our own numbers are `ve_analytics_internal(from, to, prev_from, prev_to)`
  and `ve_chapter_of(city, state)` (migration `20261028_ve_analytics.sql`).
- **Likely bots are left out by default** (the box on the page; `bots: 'show'` counts everything): visits with no city, from cloud
  data-center cities (`BOT_CITIES`) and from China. Found 2026-10-28: about 6,400 of October's 7,000 Google "visitors" were a
  Frankfurt data center with no city hitting `/join` about 200 times a day (it stopped when `/join` began forwarding to
  `/passport`), plus crawlers in China and Singapore. Real visitors, Sep 29 to Oct 28: 221.
- **Members** count `member_class` 'member' only (9 active on 2026-10-28): not the Guides (`agent`), the team and its test logins
  (`internal`), or seed and spam sign-ups (`quarantined`). 43 rows are `active` in all. Most members have no home chapter, so
  Communities leans on visitors and activity more than members.
- Pulse topic views are Google's views of the post's own address (`?post=<id>`); comments leave out the opening reply.

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
  the site's words call it gig work, paid as the community grows, never an amount (the Passport's What your $11 supports, the Ambassador
  Guide, the brand tour's slide 6, and since 2026-10-28 the role pages: `/lead`, the account page's Opportunities, the handbook, the
  Community Manager onboarding, the city hub's Opportunities, the recruiting deck, the role rows in `opportunities`, the Guides' facts and
  four saved answers; migration `20261028_cm_gig_work_and_affiliate_canon.sql`, which also took out the account page's "$4,000 a
  month" promise). **Every Passport holder is a Vegan Explorer** (Sean, 2026-10-28: "Vegan Explorers can be the name for our community members in
  general. So everyone is a Vegan Explorer that has a passport"): no longer a role anyone applies for (its city openings are closed);
  `/lead`'s one application is for Community Manager, the account page tells a member they already are one, the Passport Guide
  names it, and the Guides' facts and saved answers say so (migration `20261028_vegan_explorer_is_every_member.sql`). Maya's line on that slide was re-recorded voice only on 2026-10-28 (below).
- **Voices, not animation, for tours** (Sean, 2026-10-28: "we could still have the voices, but the animation I don't think is
  necessary... save the animation for the guides"; a lip-synced clip is about 20 to 25 Higgsfield credits, a voice line none). A brand
  tour slide can be `{audio, poster}`: her voice over the slide's still picture, beside clips on the other slides (`voiceAt` in
  `loadBrandSite`). Oatly's slide 6 is `brand-door/oatly/v6-slide-6.mp3` (el-media `tts`, Maya's voice, levelled to the clips, about
  -13.5 LUFS, a 0.25 s lead-in; checked word for word with `stt`), the old clip kept in `replaced`. New tour lines are voice only;
  a Guide gets at most one animated welcome.
- **The short link and ready-to-send messages** (Sean, 2026-10-28: "make this URL a little bit shorter and easier to read... at the
  very least separate it from the text... So they don't have to make any adjustments on their end"). Every member's link reads
  `vegansexplore.com/r/<referral_code>` (a redirect in `vercel.json` to `/passport?ref=<code>`, where the visit is counted): the
  Ambassador Guide (`link()`), Points and levels (`ve-affiliate` `me`) and the Depot's Ambassador page (`ve-invites` `ambassador`).
  What to share shows each message's words, then **Your link** in its own box, with **Copy message** (the words, a blank line, the
  link) and **Copy link** (`messages()` returns `{title, text, link}`, `messageText`).
- **The Ambassador Guide is in Guides** (Sean, 2026-10-28: "this should show up on their guides, under their guide section. Only
  available to them"): first in the catalog for Ambassadors (and super admins), a green megaphone banner, Ambassadors only, opening
  `/ambassadors/welcome` as its own page (`AMBASSADOR` in `ve-guide-catalog.js`, `render` option `ambassador`), on `/guides` and the
  dashboard's Guides tab, besides its tile in Your tools.
- **Referrals pay when the friend becomes a member** (111 points, `points_earn_rules` `referral_signup`): trigger
  `trg_zz_referral_on_admit` on `members` (insert or `membership_status` turning active) through `award_points_bounty`, once per
  friend; `ve-auth` no longer pays at sign-up, since an unpaid account is not a member. Continue with Google now keeps the `?ref=`
  too (`loginWithGoogle` sends it; `ve-auth` `google` sets `referred_by`).
- **Joshua Mattey** (joshmatteymgl@gmail.com, signed up 2026-10-27 with Google) was made an active Founding Member and Ambassador
  with 1,100 points directly (ledger `comp_membership`, ref `sean-2026-10-27`); Sean tells him on a call. He signs in with Google.
- **The platform comes before the ask** (Sean, 2026-10-28, on Jordi Casamitjana: "their response to me sharing the website is
  going to be how I determine if they're going to be ambassadors"). For someone Sean is weighing as an Ambassador: first we do
  something for them and send the platform on a personal tracked link (`ve_links`, one per person); a plain thank-you means move
  on; real interest means Sean asks them himself, "would you like to be an Ambassador?"; only a yes gets the invitation in Depot >
  Ambassadors. Never make the invitation ahead of that. First case: Jordi, the Huge Vegan Survey as the lead national Daily Pulse
  (2026-10-28), his link `/go/jordi-hvs`, the survey's `/go/huge-vegan-survey` (initiative `huge-vegan-survey`).
- Not decided yet (Sean's call): what an Ambassador earns beyond the referral, and any Ambassador-only perks or levels.
- **Depot > People > Ambassadors** (`/admin/depot/ambassadors`, after Community Managers in the Go to menu; Sean, 2026-10-28: "the
  ambassador program really is invite only... see my current ambassadors... how many people have visited their link... signed up
  underneath them, what level they're on... adjust... invite at level two... see the draft... voice dictate it... see when they've
  read it... accepted it... declined it... copying the link, but it would only be assigned to their email address"; migration
  `20261028_ambassadors_console.sql`). One view at a time: **Ambassadors** (`#list`: totals, then each one's level, points, link
  visitors, signed up, became members; `ve_ambassadors_overview()`), one Ambassador (`#a/<member>`: the numbers, their link, **Their
  level** (By their points, Level 2, Level 3) and **Give points** (spendable, `ve_points_grant` reason `admin_adjust`, ref
  `ambassador:<uuid>:<note>`), visitors by day for 30 days, who signed up with their link, their points), **Invitations**
  (`#invites/<status>`: Not sent yet, Sent, Read, Opened the link, Accepted, Declined, Expired, Canceled), **Invite an Ambassador**
  (`#new`: name, email, the level they start at, points, and a note typed or spoken, Speak using the browser's speech recognition)
  and one invitation (`#invite/<id>`: Made, Sent, Read, Opened the link, Accepted or Declined with their note; the draft is editable
  until accepted, `ve-invites` `update`; the email as it goes; Send it from me, Copy the link, Cancel it). All through `ve-invites`
  (`ambassadors`, `ambassador`, `ambassador_save`), super admin only.
  - **Levels set by the team**: `members.level_override` (1 to 4) is the least they have; `ve_member_level` returns the higher of it
    and what lifetime points earn (`set_by_team`, `earned_level`), and the dashboard's `veLevelFor(lifetime, member.level_override)`
    agrees (`ve-auth` `me` returns it). An invitation's `level` sets it at the claim.
  - **Read** is the email opened: `send` keeps the email's provider id (`universe_invites.resend_email_id`) and `list` / `ambassadors`
    copy its first `email.opened` from `email_events` into `email_opened_at`. A copied link has no Read; Opened the link is `/invite` seen.
  - **One email only**: `universe_invite_claim` returns `wrong_email` unless the account's email is the invitation's, so a copied link
    works for that person alone; the email names the address and `/invite` shows it masked (`email_hint`) and signs a different
    account out. **No thanks** on `/invite` (`ve-invites` `decline`, with an optional note) closes it as Declined (status `declined`,
    `declined_at`, `decline_note`; the Invites page has the tab too).
  - **Link visits**: `/passport?ref=<code>` (any page with `?ref=`) calls `ve_referral_visit(code, visitor)` once a visit
    (`refVisit` in `public/ve-auth.js`; the visitor is a random id in the browser, `localStorage` `ve_visitor`), one row per visitor a
    day in `ve_referral_visits`. Counting started 2026-10-28.
  - **Profiles** (Sean, 2026-10-28: "I should be able to check the type of person they are... she might not be as moved about the
    animal side of things... lean more on the building community, helping local businesses, supporting nonprofits that support the vegan
    mission, and... an extra income opportunity... create different profiles"; migration `20261028_ambassador_profiles.sql`): Balanced (none),
    **Animals first** (`animals`), **Community builder** (`community`), **Creator** (`creator`), **Health and fitness** (`fitness`), picked on
    the invitation (`universe_invites.profile`, the claim copies it to `members.ambassador_profile`) and changeable on the Ambassador's page
    (`ambassador_save` `profile`). It words the email's "why you" paragraph (`ambassadorWhy` in `ve-invites`), the `/invite` page's opening
    (`WHY`), the Ambassador Guide's Overview reason, Why it matters (`PROFILES` and `BLOCKS` in `ambassadors/welcome.html`: each profile's blocks
    in its order: animals, community, business, nonprofits, income, creator, fitness), Liz's and Dani's lines there, the first ready-to-share
    message, and the dashboard tile's line (`AMB_LINE`). The facts and terms are the same in every profile. A super admin previews one with
    `/ambassadors/welcome?profile=<key>` (See their Guide). From Level 2 every ready-to-share message says "I earn a little when you join with
    my link" (the FTC rule). The invitation email spaces every paragraph inline and bolds the Ambassador ask, the membership on us, the
    points and the level (Sean, 2026-10-28).
  - **Depot > Preview journeys > Ambassador** (Sean, 2026-10-28: "I would like to see every step from top to bottom for ambassadors... without
    me having to sign up and register"), with a Profile picker: You invite them (`#new`), The email they get (`#sample/<profile>`, `ve-invites`
    `sample`: `emailFor` on a sample person, never saved), their invitation page, another email, No thanks and You're in (`/invite?preview=
    open|wrong|declined|done&profile=`, a sample invitation, Accept turned off), the Ambassador Guide's ten tabs (`?profile=`, as your own
    account), Points and levels, the dashboard and the Depot's Ambassadors list. A new screen gets a step in `JOURNEYS.amb`.
  - A member can be invited to be an Ambassador (only Already an Ambassador is left out); other invitation kinds still leave paid
    members out. A personal note is up to 2,000 characters, a blank line a new paragraph.

## Founding Member invitations (Sean, 2026-10-28)

"Reference the people that we have listed, for me to maybe eyeball a few people that will be good candidates to be the first members
of our community... watch if they click it, if they don't, if they decline, if they don't respond... instead of it just being a bulk
email blast"; then "go ahead with the $11 founding member invites" (migration `20261028_founding_member_invites.sql`). **Depot > People >
Founding Members** (`/admin/depot/founding`, after Ambassadors in the Go to menu; super admins), the Ambassadors console's layout, one
view at a time: **Invitations** (`#list/<status>`: totals Invited, Read it, Opened the link, Said yes, Joined, Declined; tabs Ready for a
follow-up, Not sent yet, Sent, **No reply yet** (sent by email 7 days ago, never read), Read, Opened the link, **Said yes, not paid**,
Joined, Declined, Expired, Canceled), **Pick people** (`#pick`, `ve_founding_candidates(q, pool, limit, offset)`: HQ > People with an email
and accounts that never paid, leaving out members, anyone with an invitation already (but canceled or expired), the do-not-contact list,
the unsubscribed, quarantined, archived and merged; each tagged where we know them from: Suggested for Vegans Explore
(`people.recommended_brand`), On our shows (their name is a People listing), Signed up never paid, Emailed with you, SoFlo Vegans,
Mailing list, Other lists; suggested and guests first, then most emails with Sean; search, tick, kept for the visit in `sessionStorage`
`ve_founding_picked`), **Write to them** (`#new`: one card per person picked, with what HQ already knows about them, **On us** (free, 1,100 points) and
**What you know about them**, typed or spoken; Sean, 2026-10-28: "I don't want to focus on the structuring of the sentence. I can let you
know a little bit about that person... something positive that only I would know"; no note shared by everyone. **Write their invitations**
makes the drafts, then `ve-invites` `draft_note` writes each one's personal opening (`reason`) in Sean's voice from his notes
(`universe_invites.context`, migration `20261028_founding_invite_context.sql`) and the person's HQ > People record, one at a time with
progress: Claude Opus 5.5, effort medium, 2 to 4 sentences, his notes first, nothing invented (no feelings, favorites or superlatives he did
not say), nothing private from the summary, no description of Vegans Explore since the email says that next; about 7 s a person. Nothing
sent) and one invitation (`#invite/<id>`: Made, Sent, Read, Opened the link, Said yes, Paid the $11 and joined, or Declined with their
note; the draft: What you told me about them (Speak), **Write it again**, and **Their opening**, any word changeable; the email as it goes, Send it from me, Copy the link, Cancel it; **Follow up**: one short note from Sean worded for where they
stopped, at most 2, 5 days apart, each keeping the link open 14 more days, `ve-invites` `nudge` / `nudge_preview`). An invitation is
`universe_invites.points_to` `founding` (`pool` records where they came from): the email asks them to be one of the first Founding Members at
$11, one time, with 1,100 points; accepting on `/invite` is **Said yes** (`status` `accepted`, `accepted_at`; `universe_invite_claim` returns
`accepted`) and the page goes straight to the $11 checkout (`ve-entry-checkout`, back to `/invite?c=<code>&paid=1`, which waits for the payment
and says Welcome, Founding Member); a return visit says One step left with Finish joining. Paying any way (trigger
`trg_ve_founding_invite_paid` on `members`, the account turning active) makes it **Joined** and sets `founding_member`. One on us claims like
any comped invitation. `ve-invites` `founding`, `founding_candidates`, `nudge`, `nudge_preview`; `create` takes `points_to: 'founding'`
(comp only when ticked) and `pool`. Proven 2026-10-28 with an internal unpaid account (draft, copied link, opened, said yes, the test-mode
checkout opened, a payment inside a rolled-back transaction turned it Joined), then removed.

## Nonprofit Partners (LOCKED by Sean 2026-10-29, playbook `ve-nonprofit-partners`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-nonprofit-partners`). **The organization is the
partner** (its Directory listing: Nonprofits, Rescues or Sanctuaries), never a person: its own link (separate from the lead's), a
flat 20% of the $11 Passport and Guides bought through it (the opportunity's rate, not a member level), points it holds for our
services (Sean sets the amount on the invitation; members can give it more), a marketing kit (ready-to-post messages, a website button
and banner, an email blurb), a Nonprofit Partner badge and its own Guide on the Ambassador Guide's pattern. If the lead changes,
everything stays with the organization. Paid to the organization after its W-9 at $25 (the affiliate defaults), worded as referral
earnings, never a donation or tax-deductible. **The lead on the account** (Sean, 2026-10-29: "it doesn't impact the person's
individual status. They just happen to be the person assigned as the lead") gets a complimentary Founding Membership when the
organization says yes and keeps their own standing (Level 1, their own link and points). Invitation only, from Depot > People >
Founding Members (Founding Member, Ambassador or Nonprofit Partner). First: Susan Hargreaves, Animal Hero Kids (`be-an-animal-hero`), at animalherokidsrock@gmail.com (Sean, 2026-10-29: the address he uses, the
most reliable; HQ holds three others for her).

**Built 2026-10-29** (Sean: "go"; migrations `20261029_nonprofit_partners.sql`, `20261029_nonprofit_partner_code_words.sql`; edge function
`ve-nonprofit`). `ve_nonprofit_partners` (one row per organization: `listing_id`, `lead_member_id`, `code`, `rate_pct` 20, `products`
passport and guide, `points`, `status` active | paused | ended) and `ve_nonprofit_partner_points` (the organization's points, through
`ve_partner_points_grant`). Its link is `/r/<code>` (`ve_partner_code`: the name in capitals, whole words, BE-AN-ANIMAL-HERO); `ve-auth`
sets `members.referred_by_partner` when a sign-up's `?ref=` is an organization's (`partnerFromCode`), `ve_referral_visit` counts its
visits, and `ve_affiliate_earn` writes its commissions (`ve_affiliate_commissions.partner_id`, route `partner`, no `affiliate_id`, the
partnership's rate), shown in Depot > Ambassadors > Commissions under the organization's name and marked paid there. The invitation is
`universe_invites.points_to` `nonprofit` with `listing_id` (a Nonprofits, Rescues or Sanctuaries listing, not already a partner; members
can be invited): **Founding Members > Write to them** has **Invite as** for each person (Founding Member, Ambassador, Their organization as a
Nonprofit Partner, with the organization picked from the Directory and its points; Ambassadors get a level and points), and the
Founding Members list shows all three kinds (`founding` returns Nonprofit Partner invitations and Ambassadors picked there, `pool` set).
The email, `/invite`, the opening writer and the follow-up are worded for an organization. Accepting (`universe_invite_claim`) joins the
invitation, comps the lead (a Founding Membership and 1,100 points, only if they were not a member) and runs
`ve_nonprofit_partner_start` (the partner, its code, the invitation's points as the organization's, the listing tag
`ve-nonprofit-partner`, which draws the **Nonprofit Partner** badge on the listing page and the Directory card, `partnerTag`). The lead's
**Nonprofit Partner Guide** is `/nonprofits/welcome` (the Ambassador Guide's layout; Overview, Why it matters, Your link, Your kit (four
messages, a website button and a banner as HTML to copy), Your numbers, Where the money goes, Your points (Ask to use our points:
`ve-nonprofit` `use_points`, a `ve_initiative_interest` row, initiative `nonprofit-partners`, and an email to Sean), Your account; super
admins preview one with `?partner=<id>`). **Depot > People > Nonprofit Partners** (`/admin/depot/nonprofit-partners`, after Founding
Members): every partner with its numbers and the open invitations, and one partner (`#p/<id>`): its link, status (Paused or Ended takes the
badge off and stops its link earning), rate, code, a new lead by account email, team note, Give points, who joined and its earnings.
`/policies#membership` has Nonprofit Partners; the Guides' facts and a saved answer (Can my nonprofit partner with Vegans Explore?) say
it. Proven 2026-10-29 end to end with a [TEST] organization and the internal QA account (the invitation and its email and opening, the
accept, the partnership with its points and badge, a visit and a sign-up through its link, a Passport paying $2.20 to the organization
once, the lead's own earnings and Level 1 untouched, pause and resume, points, the Guide, the badge, the picker), then removed. The same
day `ve-affiliate` `orgs` was fixed: it asked for `city` and `state`, which listings does not have, so the organization search (also
Points and levels' Where it goes picker) had always come back empty.

**The Nonprofit Guide** (LOCKED by Sean 2026-10-29, playbook `ve-nonprofit-guide`, canon `canon-ve-nonprofit-guide`; launched
2026-10-29, below). The Dairy Guide's layout for people who run Vegan nonprofits, rescues and sanctuaries, built from Sean's Canva **Vegan Nonprofit
Survival Guide** (design `DAGx8V9AvKE`): the 10 tips one per view (Tip 1 free), the Pulse (Vegans Explore Podcast 111 and 123 to 127,
the nonprofit leaders on our shows, played in place), the Directory's Nonprofits, Rescues and Sanctuaries, Get found, Business
partners, Events, a peer-to-peer kit, burnout and support, My list, and **Become a Nonprofit Partner** at the end. $11 or 1,100
points, included for Nonprofit Partner leads; Dani narrates; it replaces the Coming soon card. Susan Hargreaves is invited only
once it is live.
**Built 2026-10-29, not launched** (Sean: "hand it to Logan"; migration `20261029_nonprofit_guide.sql`). `guides/nonprofit-guide.html`
and `guide-scripts/nonprofit-guide.js`, the Restaurant Guide's shell (`noindex`, Dani on the right, her lines as text drafts for Sean,
no clips), ten tabs (`#/<tab>`): Overview, **The 10 tips** (`#/tips/<id>`: the Canva lesson word for word where it holds, its case or
pro tip, a This week checklist kept in the browser (`ng_checks`), On Vegans Explore, and the episode behind it; story is free), **Pulse**
(Our nonprofit series: Vegans Explore Podcast 111 and 123 to 127; Nonprofit leaders: Susan Hargreaves, Ingrid Newkirk, Rachel Black,
Rowdy Girl, the Florida sanctuaries, Kudo, Jordan David, Jane Velez-Mitchell, Compassion in Action, Liz Jones, Honey LaBronx; `PULSE_PICKS`
with each feed guid, played in a docked player), **Directory** (Nonprofits, Rescues and Sanctuaries with the Directory's card, a chapter
picker, `localStorage` `ng_chapter`; a listing opens framed in the Guide), **Get found**, **Businesses** (Food Brands and the chapter's
100% Vegan restaurants, and the pitch to copy), **Events** (our calendar, Promote your event, vendors; and the Peer-to-peer kit: World
Vegan Day, Giving Tuesday, Earth Day), **Support** (the three weaknesses from episode 123, Share the load from 126, where to find help),
**Become a Partner** (the partnership, and **Tell us about your organization**: `ve-nonprofit` `survey` / `survey_get`, one row per
member in `ve_nonprofit_surveys`, 100 points once, reason `nonprofit_survey`, ref `np-survey:<member>`, emailed to Sean, active members
only; `SURVEY_POINTS` is Logan's default), My list (saves through `ve-cookbook`: tips as kind `fix`, `episode`, `listing`) and Get
access. Tips 2 to 10, the kit, the pitch and the support plan are `ve_guides.content_html` (`<script id="ng-data">`, no public read),
written from the session, never in the repo; the page holds the intro, the titles and tip 1 (`#ng-public`). The `ve_guides` row
`nonprofit-guide` is published ($11 or 1,100 points) so it sells and opens; `ve_nonprofit_partner_start` gives the lead the Guide
(`ve_guide_purchases` `paid_with` `nonprofit_partner`) and Sean holds a comp copy to review it. Banner `public/guides/nonprofit-guide.jpg`
(Dani seated in her chair holding a rescued rabbit, the locked banner style). Two of the Canva doc's claims were corrected against their
sources: Facebook's birthday fundraisers had raised more than $1 billion by 2019 (not "billions"), and the Mercy For Animals and VegFund
examples say only what their own pages show. **Launched 2026-10-29** (Sean: "good as a V1... launch it"; migration
`20261029_nonprofit_guide_launch.sql`): indexed, its card sixth in the Guide catalog (label Nonprofits, replacing the Coming soon
card; `ve-guide-catalog.js`), in the sitemap. Susan Hargreaves' invitation can go out now. Dani's lines are still text drafts.

## Group Partners (LOCKED by Sean 2026-10-29, playbook `ve-group-partners`)

Concept session with V, locked by Sean: "lock it, go with your defaults" (canon `canon-ve-group-partners`; migration
`20261029_group_partners_canon.sql`). **Not built yet.** A community group (Community > Groups) hosts its community and events on
Vegans Explore and brings us members; the group is the partner, its organizer the lead, comped a Founding Membership with their own
standing unchanged. The group gets a community page (members, events, board), its events and history on its page and the calendar, our
ads, featured status, preferential bounties, and anyone anywhere can join it. **Commission** on Passports and Guides bought through its
link, by lifetime members brought in: 20%, then 25% at 25, 30% at 75, 35% at 150, 40% at 300, 45% at 600, 50% at 1,000 (the cap), from
the day reached, never back-paid. **Tickets**: our fee 5% of a paid ticket (free events free, card processing passed to the buyer, the
group may pass our fee on too), the rest to the group (2026 market: Eventbrite 3.7% + $1.79 plus processing, Luma 5%, Posh 10% + $0.99,
Partiful reportedly about 10% + $2). **Guest pass**: a non-member comes to one free event; from the second they join with the $11
Passport; paid-ticket events need the Passport from the start. **Exclusivity is earned into**: hosting exclusively here and sharing the
link unlocks the ladder, featured status, our ads and bounties; every group stays listed regardless. Payouts after a W-9 (the
organizer's when the group has no entity) at $25, 30-day hold, worded as referral earnings. Named Group Partners, never Community
Partner. Prototype: the Vegan Social Club (South Florida), then Philly Vegan Social Club; our own communities use the same structure
later. To build: Stripe Connect for ticket money, the group community page, the policy text and the Guides' facts. Not decided: whether
counts reset, what featured placement and ad support include. The dashboard's Host your group on Vegans Explore card collects interest until then.

**Tickets, guest passes and check-in, live 2026-10-29** (Sean: "Move forward"; migration `20261029_group_tickets.sql`, applied through
the one-time `ve-once-group-tickets`, now off; `ve-group`; `public/ve-events.js` `drawSale`; the dashboard's Events views in
`ve-partner-dashboard.js`). Only on an approved event hosted by a Groups listing whose Group Partnership is onboarding or active
(`saleOf`). **Ticket types** (`ve_ticket_types`, up to six an event, $1 to $1,000, an optional limit, `pass_fee`; a type's price is
fixed once one sells), set by the lead, the owner or a super admin (`ticket_type_save`). **Buying** is for active Passport holders only
(`ticket_checkout`, up to 10 an order, `ticket_max_per_order`): the buyer pays the tickets, our 5% only when the group passes it on, and
card processing (2.9% + 30 cents, grossed up so it is covered: a $20 ticket is $20.91, or $21.94 with the fee passed on); the money
lands on the Vegans Explore Stripe account (no Connect yet). The return trip and ve-stripe-webhook (`metadata.type` `ve_ticket`,
`confirm_fn` `ve-group`) run `ve_ticket_order_paid` once: an 8-character door code per ticket (`ve_tickets`, no 0, O, 1, I or L),
emailed, the buyer going and in the group (`via` event), and the group's share as a commission row (product `ticket`, route `group`,
held 30 days like every commission; `ve_ticket_orders.group_cents`). **Guest pass** (`guest_pass`, `ve_guest_passes`): a free event
(no ticket types) and someone without a Passport, one pass a person ever at any group (unique on the email), its code emailed;
someone who came on one and later joins counts toward the group's rate (`trg_ve_guest_pass_ref` sets `referred_by_group`).
**The door** (`checkin`, `undo`): a ticket or guest pass by its code, once; a refunded code says so. **Refunds** (Sean, 2026-10-29):
the group writes its own policy (`events.refund_policy`, shown at checkout and in the ticket email); a refund (`ticket_refund`, the
organizer) gives back what the tickets cost, our 5% included, never card processing, through Stripe first, then
`ve_ticket_order_refunded` voids the codes, puts the count back, cancels the RSVP and reverses the group's commission (a negative row
if it was already paid out). `ve_group_dash` shows each event's price, tickets sold, going and guest passes, ticket earnings and our fee.
Proven 2026-10-29 on a [TEST] group with internal accounts: guards (non-organizer, unpaid account, 11 tickets, a guest pass at a paid event
or for a Passport holder's email, a second pass at another group event), a test-mode checkout ($41.51 for two $20 tickets) and its
unpaid return refused, paid twice in a rolled-back transaction (once only, wrong session refused), then a real Stripe test payment
marked paid, the door, the dashboard, and a Stripe test refund of $40.00 with $1.51 kept; then removed. The Stripe card form itself
was not paid (checkout.stripe.com and api.stripe.com are blocked from the build session; the test payment went through pg_net).
**Seats are held at checkout** (migration `20261029_group_tickets_holds_policy.sql`): an open checkout counts against a type's limit
for 35 minutes (Stripe expires it at 30); `ve_ticket_order_open` locks the type's row, counts what is left and writes the order in one
step, and `ve_ticket_left` gives the page the same count. A stale pending order is never canceled, so a late payment still confirms.
The same migration put tickets, the guest pass and Group Partners in the Guides' facts and three saved answers, and `/policies` has
**Group Partners** and **Event tickets** under Membership and the guest pass and door list under Privacy.
**No invitations yet** (Sean, 2026-10-29: "we're not going to send to anybody just yet... I just need to make sure I get my hands on
everything once it's locked in. I'm selectively sending it out"): no Group Partner invitation goes out until Sean has reviewed the
program and picks who gets one; keep building so every piece is ready.

**The sample group, the Guide and the console** (Sean, 2026-10-29: "Let's not bank on Vegan Social Club... I want us to create our
own mock club so people can go through it... the same way we did the business... a general username and password... in the depot...
a groups one, where I could... personalize the message, select people... do a crawl for all these community groups... send them
messages one by one... it lays out pretty much as a guide... they can click on what it would be like from a user perspective... from
the owner's perspective").
- **`/groups/sample`** is Sprout Social Society, an invented group (never a database row, marked Sample, `noindex`): the real listing page
  (`directory/listing.html`, rewrite in `vercel.json`) in demo mode (`demoSrc`), fed `/groups/sample/listing-demo.js` (`VE_DEMO.group`).
  Its bar switches **A member** / **The organizer**. Its logo (Sean picked option A from a look book, 2026-10-29) and photos are in
  `groups/sample/img/`, the photos realistic, as a real group would post them (never our illustrated Guides). Tabs (Sean, 2026-10-29):
  Overview, **Board** (the Message Board: posts with replies, the organizer's pinned welcome, `VE_DEMO.board`) and **Media** (the Photo
  Gallery: one album per past event, Halloween Costume Potluck and Sunday Brunch in the Park, five photos each, `VE_DEMO.galleries`;
  `?tab=media&album=<id>`, Media > event, each photo in the page's lightbox; `groupDemoTabs` in `directory/listing.html`). The brunch
  is at George English Park, on the Intracoastal, to match its photos. **Announcements** (Sean, 2026-10-29: "send messages to their members and have it appear
  on the overview page below About"): the organizer's dashboard has an Announcements view (`drawAnnounce` in `ve-partner-dashboard.js`,
  `?tab=brand&pd=announce`, New announcement: title, message up to 1,000 characters, Also email it to your members, Pin it to the top),
  sent through `group_announce`; the Overview shows the newest three under About, one pinned first (`gdAnnRender`). The sample answers
  `group_announce` itself and keeps what is sent for the visit (`sessionStorage` `ve_group_ann`); a live group's version (a table, the
  email through us, the page section for real listings) is part of the Group Partners build.
- **Groups, live** (Sean, 2026-10-29: "build the live announcements for real groups"; migration `20261029_group_live.sql`, run through the
  one-time `ve-once-group-live`; edge function `ve-group`, verify_jwt off, the member token checked inside, ops by the admin token with
  `as_member`). **Joining**: every Groups listing's sidebar has a Join card (`loadGroupLive` in `directory/listing.html`): Passport holders
  join (`ve_group_members`), with an **unticked** "Email me <group>'s announcements" (`email_ok`), and leave or change it there; signed out it
  is the members-only window (`VEVotes.memberPrompt('group')`). **Announcements** (`ve_group_announcements`): the listing's owner, the
  Group Partner lead or a super admin writes them on the dashboard's Announcements (any group's dashboard, `drawAnnounce`); the newest three
  show under About, a pinned one first; ticked, they go by email from Vegans Explore with the group's name to the members who said yes
  (`ve_group_announcement_deliveries`, replies to us), at most 2 emails in 7 days and 5 posts a day (`ve_site_settings`
  `group_partner_program`). The email's link is `/messages#g/<token>`: Stop these emails, Leave the group, Report this (a report pauses the
  group's emails, `ve_group_mail_holds`, and emails Sean; delete its row to resume). **Group Partner earnings**: a partnership gets its code at
  onboarding (`ve_group_partners.code`, `/r/<code>`, `trg_ve_group_partner_code`); `ve-auth` sets `members.referred_by_group` for a sign-up
  through it; `ve_affiliate_earn` pays the group the ladder's rate on the day (`ve_group_rate`: lifetime members brought in, 20% to 50%),
  rows with `group_partner_id`, route `group`, held 30 days like every commission. The dashboard's Group Partner views read the real numbers
  (`ve_group_dash`). **Gift a membership** (Sean, same day: "It would cost whatever our half of the $11 would be based on where they are in
  the commission split... deducted from their payout... an invite link to a specific address"): the lead's dashboard view `gift`
  (`drawGift`): our share of the $11 at the group's rate today ($8.80 at 20%, $5.50 at 50%), taken from the group's earnings at once as a
  negative commission row (product `gift`, ref `gift:<invite>`). **Only cleared earnings count** (Sean, same day: "that balance will only
  count after the 30-day period... If they're in a negative, they should get a prompt to purchase the membership"; migration
  `20261029_group_gift_cleared_balance.sql`): `ve_group_balance` is commissions past their 30-day hold (`ready`), not paid out, less gifts,
  so a gift never takes it below zero (`gift_credit_cents` 0). Short of it, the dashboard says what is on hold and when the next of it
  clears, and offers **Pay $X by card**, the same price (`ve-group` `gift_checkout`, Stripe; `GET ?confirm=` from the return trip and
  ve-stripe-webhook makes the gift once, `universe_invites.paid_session` and `paid_cents`; no commission row). A card gift that expires, is
  canceled or declined goes to the group's balance (a `ready` row, ref `gift-back:<invite>`) for its next gift, never a card refund (Sean,
  2026-10-29: "keep it going to the balance, no refund"). Gift rows are settled with the group's payout in Depot > Ambassadors > Commissions (mark them paid with it). A `universe_invites` row (`points_to` `gift`, the group's `listing_id`, 1,100 points, 30 days, one email), emailed from
  Vegans Explore with the organizer's name or a link they copy; `/invite` words it as their gift. Accepting makes them a Founding Member, one
  the group brought in (it counts toward the rate) and a member of the group (`trg_ve_group_gift_status`); expired (nightly
  `ve-group-gift-sweep`), canceled or declined gives the cost back (the row turns `reversed`). Not for a member who already has a Passport.
  Proven 2026-10-29 on a [TEST] group with internal accounts (join, the organizer-only post, a real email, the email link, gift pricing,
  balance, cancel giving back, the claim, a commission at 20%), then removed. The cleared rule the same way: held money refused with the card
offer, a test-mode checkout opened, an unpaid return sent back, a gift from cleared money, a card gift's cancel crediting the balance and a
second confirm of one session refused (the card form itself was not paid: checkout.stripe.com is blocked from the build session). The real dashboard's views were checked in the sample, which
  draws the same code. A member's side: About, the Events tabs from the demo file (6 upcoming, 16 past), a **Group Partner** card with its members and **Join the group**, and every RSVP, ticket and join as a simulation
  window (`demoEvent`, `demoJoinGroup`; See it as Someone new or A Passport holder: the guest pass on a first free event, the $11
  Passport after it or for a paid event, the ticket with card processing on the buyer). The organizer's side opens with the **demo
  sign-in** (`VE_DEMO.login`: demo@vegansexplore.com / explore11, `groupDemoLogin`, kept for the visit in `sessionStorage`
  `ve_group_demo`; it is not an account, so nothing it does can touch live data) and is the real business dashboard with the Group
  Partner views (`ve-partner-dashboard.js`, shown when the server sends `D.group`): **Your members** (members, joined through you, guest
  passes and how many joined after, the rate ladder with progress, the group's link, the member list), **Events** (coming up and past,
  New event, one event with guests, guest passes or ticket money after our 5%, Write to your guests, the guest list, Copy the event
  link), **Earnings** (earned this year, ready, held 30 days, paid; Passports and tickets apart; payouts), plus Home's group tiles,
  Insights, Your page, Opportunities and Guides; hours, menu, audit, check-ins, ads and the Partner plan are hidden for a Group Partner.
  Every number in the demo follows `canon-ve-group-partners`; every button that would save says so in a toast (`demo_only`).
- **`/groups/welcome`** is the **Group Partner Guide** (`groups/welcome.html`, the Nonprofit Partner Guide's layout, Dani narrating in
  text, `noindex`, public). Seven tabs since 2026-10-30 (Sean: "a little drab... Do we need it to be that much?... lead with the community
  itself"): **The community** (a short pitch, three chips, then real groups from the Directory with the Directory's card, most upcoming
  events first, and their next events, at most two a group; read live with the anon key), **Try the demo** (slim As a member / As the
  organizer tiles and the demo sign-in on the left, a live scaled preview of `/groups/sample` on the right sized to fit without scrolling;
  the organizer preview sets `ve_group_demo` so it skips the sign-in), What you get (Why it matters and What your group gets merged), The
  numbers (the ladder as bars, tickets, and the guest pass), **Your part** (slim cards and a preview of the organizer's Your members),
  Questions, Say yes (`?c=<code>` goes to `/invite?c=<code>`; without one, mail links to contact@lesaruss.com). Old `#/why` and `#/guest`
  land on What you get and The numbers (`ALIAS`). A preview, a group card, an event or See every group opens full screen in the page
  (`openView`, with Open in a new tab and Close or Escape). **Dani steps aside** when someone clicks around on their own: following her
  tour (Back / Next, a page's Next button, Take the tour with Dani, her picture) keeps her; any other move folds her into the corner, and
  brought back by hand she stays for the visit (`gp_dani_pinned`).
- A listing's sidebar shows Follow only when it has a social link (it was an empty card on listings with none).
- **Depot > People > Group Partners** (`/admin/depot/group-partners`, after Nonprofit Partners; migration `20261029_group_partners.sql`,
  run through the one-time `ve-once-group-partners`, now the 410 stub; edge function `ve-groups`, super admin or the admin token). One view
  at a time: **#list/<tab>** (every Groups listing: chapter, contact email or No email yet, events past and upcoming, invitation and
  partner status; tabs All, No email yet, Ready to invite, Not sent yet, Sent, Opened the link, Said yes, Declined; search and chapter),
  **#g/<listing>** (the organizer's name and email, **Find their email** (`find_contact`: their own site's home, contact and about pages,
  then the Instagram bio through Apify; only an email they publish, with where it was found), the partnership's status and note, and the
  invitation: What you know about them, typed or spoken, Write their opening (`ve-invites` `draft_note`), the email as it goes, Send it
  from me, Copy the link, Cancel, Follow up), **#pick** then **#new** (tick several groups, one card each), and **#discover** (`discover`:
  Meetup's public group search around each chapter's centers for Vegan or plant-based groups active since 2025, not ours or already held;
  each saved quarantined, `crawl_source` `group-discover`, until **Add to the Directory** (approves it, makes its Meetup events page its
  crawl source and brings in this year's past events and the next 180 days) or **Set aside**). A group invitation is
  `universe_invites.points_to` `group` with `listing_id` (an approved Groups listing not already onboarding, active or paused); the email
  and `/invite` are worded for a group and link the Guide (`/groups/welcome?c=<code>`) and the demo (`/groups/sample`). Sending it makes the
  group `invited` (`trg_ve_group_invite_sent`); accepting (`universe_invite_claim`) comps the organizer a Founding Membership and 1,100
  points if they were not a member, makes them the lead and the group `onboarding` in `ve_group_partners` (an active or paused group keeps
  its status), and emails Sean. Proven 2026-10-29 in a rolled-back transaction (wrong email refused, the comp and the lead, an existing
  member gets no points). The first discover (South Florida) found six for review, a yoga group among them: discover's filter is a first
  pass, so read each before adding it.

## Pathways (LOCKED by Sean 2026-10-29, playbook `ve-pathways`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-pathways`; migration `20261029_pathways_canon.sql`). **Not built
yet.** Sean: "let's find these email addresses, the social media handles... send them the email, but then also follow up with the
Instagram, and then automatically be cued on when to do follow-ups... nurturing each of these people until they become members...
see what they're going to see... a report of how many people have opened it... track that over time." Every way into the community
is a **pathway**, worked by one engine in **Depot > Pathways**, a tab each: Founding Members, Ambassadors, Community Managers, Nonprofit
Partners, Group Partners, **Content Creators** (new) and Coaches (later). A new category is a new pathway, never its own console; the
existing consoles become each pathway's detail view.
- **Four views per pathway**: the people (a board by stage: Found, Ready to invite, Invited, Followed up on Instagram, Read it, Opened
  the link, Said yes, Joined, Next step; beside them Declined, No reply, Resting with a date; each person's page with email, handles,
  where we found them, every touch and what is due); **Today** (the daily work list); **the journey** (every screen they see in order,
  See what they see on each, like Preview journeys, Not built where a step is missing, ending in **Introduce LESARUSS.AI**, a short note
  from Sean); **the report** (found, invited, read, opened the link, replied, said yes, joined, declined, no reply, week by week, by
  source, pathways side by side).
- **Leads**: a finder per pathway into Found for Sean to look over (Meetup discover for groups, the community search for nonprofits,
  YouTube, Instagram and our podcasts and People for creators, the Coaches section and Instagram for coaches); published emails only.
- **Pace and sequence**: 5 new a day per pathway, weekdays. Day 0 email, Day 2 Instagram, Day 5 follow-up email, Day 12 last note, then
  No reply, resting 6 months before one more try; Declined is final unless they come back. Every email from Sean, its opening drafted
  per person (like Founding Members), the day's batch approved by Sean (like Business outreach send days). **Instagram is never
  automated** (its rules forbid automated first messages; the account is at risk): a task in Today with the message written, Copy and
  open Instagram, Mark sent.
- **Content Creators is not its own program** (Sean, 2026-10-29; see Ambassadors for everyone, below): it is a lead finder feeding the
  Ambassador pathway with the Creator profile set. Coaches wait. Each pathway's LESARUSS.AI step is shaped later. Mailing list
  reactivation is a separate project.
- **Build order**: 1. the hub and journey view for the five that exist (shows every gap); 2. the board, Today, Instagram tasks and the
  report on those five; 3. a lead finder per pathway; 4. Content Creators; 5. Coaches. Reuse `ve-outreach` (lists, sender, sync,
  warm-up), `universe_invites` and its consoles, `ve-invites` `draft_note` and Preview journeys.

## Ambassadors for everyone, the talent bench and the shop (LOCKED by Sean 2026-10-29, playbook `ve-ambassadors-talent-shop`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-ambassadors-talent-shop`; migration
`20261029_ambassadors_talent_shop_canon.sql`). **The door is built (below); the rest is not built yet.** Sean: "the ambassador program being for everyone and you fitting in
based off of your results"; "these prices will be coming from LESARUSS.ai... any discount will come from them using points"; "a shop...
if they choose this, this is what happens"; "turn into a marketing agency for the 21st century."
- **One Ambassador program, never a separate Creators program.** The team sets each Ambassador's profile (Balanced, Animals first,
  Community builder, Creator, Health and fitness) and can change it in the background. People climb by results (levels, jobs, campaigns).
- **One Opportunities board**: points jobs (every Ambassador), perk jobs (a dinner, a ticket, a cause, plus points), paid jobs (invited,
  active Ambassadors with a rate card). From Level 2, bounties include professional work (social, editing, design, outreach), skill
  tagged, vetted with a small paid trial job. The Community Manager is the client's one contact.
- **Activation for paid work**, a self-updating checklist: profile, platforms (numbers read where we can), rates (team only), get paid
  (Stripe Connect hosted onboarding; W-9 and 1099s through Stripe's W-8/W-9 product, in preview and to be requested, else its manual
  W-9 request). Not active yet until all four; reminders Day 2, Day 7, then weekly; Active with a notification when done.
- **Scouting**: our own campaigns, dinners, events and tours; HARO (Featured.com's free reporter requests) matched by topic; other
  marketplaces only as heads-ups from public posts, never scraping logged-in platforms.
- **We produce campaigns**: we pick the talent (a brand may hand-pick for 10% more), creators get their full rate, 50% on yes and 50% when
  their posts are live, the brand pays creator fees up front (held until delivered), our fee 25% on top; FTC disclosure on sponsored posts;
  rates and numbers stay with the team, names go to a brand only after a creator says yes.
- **The shop** is the LESARUSS.ai service list, one price list for every brand: each item a workflow (intake, deposit, assignment, a
  Community Manager, delivery, sign-off), offered **AI-led** or **people-led** (vetted Vegan professionals, about 1.5 times). AI-led
  rate card: press release written and pitched $500; PR outreach $750 a month; social media, one platform, $400 a month; brand or product
  launch quoted from $1,500; custom agency work quoted per project. Members (Partners, Diplomats, Ambassadors Level 2 and up) save 20%;
  points (1 point = 1 cent, earned by promoting us) cover up to half. Prices may be tuned to delivery cost before each service opens.
- The Partner plan is on us for Creator-profile Ambassadors at Level 2 and up while active; they earn 20% commission from day one.
- **We make it right**: a professional who fails to deliver is replaced and we finish it; refunds stay deposit only. Contractors are judged
  on deliverables and deadlines, never hours or methods (a labor attorney reviews the agreement once).
- **Reveal bit by bit**: now the door (the Guide, the account, the profile, the checklist); then one service at a time with its case study
  and a Daily Pulse announcement: books (Bob Leonard, then Brooke), courses (Dr. Klaper), event promotion, PR, social, brand launch.
- **First**: Torre Washington; Gabriela Reyes once the platform comes first (confirm her name and handle); then Philly's creators ahead
  of a dinner. **Build**: the Creator Guide from Sean's Canva Vegan Content Creator Survival Guide (`DAGx86FyHyw`), profile claim and
  the checklist, the Opportunities board, Stripe Connect and campaign production, the shop, the lead finder by city.
- **The Creator Guide** (built 2026-10-29, the Ambassador door; migration `20261029_creator_guide.sql`). `guides/creator-guide.html` and
  `guide-scripts/creator-guide.js`, the Nonprofit Guide's shell, River narrating in text (no clips), indexed, seventh in the
  Guide catalog (label Creators, banner `public/guides/creator-guide.jpg`), in the sitemap. Tabs: Overview, **The 10 tips** (`#/tips/<id>`:
  the Canva's principle, In Action and three action items word for word, the action items as This week, kept in the browser
  `cg_checks`; On Vegans Explore; an episode; tip 1, purpose, free), **People doing it** (People > Content Creators and the Directory's
  YouTube channels, the Directory's card, a listing framed in the Guide), **Pulse** (`PULSE_PICKS`: our episodes with creators, Building a
  platform and The craft, each matched to its show's feed and played in place), **Your next step** (become an Ambassador: invitation only,
  one program by results, points, perk and paid jobs, the paid-work checklist (Live, `/ambassadors/door`) and services one at a time, each marked Live or Coming, no
  prices; Tell us about you mails contact@lesaruss.com; Already an Ambassador opens `/ambassadors/welcome`), My list (`ve-cookbook` kinds
  fix, episode, listing) and Get access. Tips 2 to 10 are `ve_guides.content_html` (`<script id="cg-data">`), never in the repo. $11 or
  1,100 points; **an active Ambassador has it included** (`ve-guide-unlock` and `ve-cookbook`: `members.ve_role` `ambassador` and active,
  `via` `ambassador`, no purchase row). From the Canva: tip 3's example is Pick Up Limes (Gaz Oakley is no longer Vegan), and its closing
  survey and one-week free trial are left out.

**The Ambassador door, built 2026-10-29** (Sean: "Build the ambassador door"; migration `20261029_ambassador_door.sql`, edge function
`ve-ambassador`, verify_jwt off, the member token checked inside, ops by the admin token with `as_member`). `/ambassadors/door`
(`ambassadors/door.html`, `noindex`): **Paid work: your checklist**, Not active yet or Active in the header, the checklist first, then one
step per view (`?step=profile|platforms|rates|paid`, Back / Step N of M / Next, Next saves the step): **Your profile** (their People
listing: search and **This is me**, or **I'm not in the Directory yet** with their name, what they do and a bio; either waits as a
`ve_profile_claims` row for the team; once theirs, what they do, website, Instagram and a bio of 80 characters or more, each change a
`ve_listing_edits` row, and a photo through `ve-claims` `owner_photo_url` / `owner_photo_done`, 400 px or more), **Your platforms**
(Instagram, TikTok, YouTube, Facebook, podcast; YouTube subscribers read from YouTube's Data API, the rest as they type them), **Your
rates** (post, reel, story, appearance, hosting, a day of social work, notes; what they do and the chapters they can show up in; the team
only) and **Get paid** (Stripe Connect Express onboarding on Stripe's pages, back to `?step=paid&stripe=return`, which asks Stripe whether
payouts are on). A step is done when: a photo, what they do and the bio; one platform with followers; one rate; payouts on. All four make
them Active (`ve_ambassador_door.active_at`) with an email to them and Sean. Reminders (cron `ve-ambassador-remind`, 14:17 UTC): Day 2,
Day 7, then every 7 days, at most 10, naming what is missing, counted from the day they first open the door. Linked from the dashboard's
Your tools (after The Ambassador Guide) and the Guide's Your role (Paid work). **Depot > Ambassadors > Paid work** (`#door`, `admin_list`,
`claim_decide`): totals, the profile requests to **Approve** (an existing People listing becomes theirs, `owner_member_id`, or a new
Content Creators listing is made, every chapter, `crawl_source` `ambassador`) or **Decline** with a note they get by email, and every
Ambassador's checklist with their platforms, rates and skills. **Stripe Connect is not switched on** on the LESARUSS account (Stripe:
"signed up for Connect"); until Sean turns it on (dashboard.stripe.com/connect, Express accounts), Get paid answers "Payouts are not
switched on yet". Proven 2026-10-29 with the internal QA account as an Ambassador (search, a new-profile request, approval making the
listing, the profile, platforms with YouTube read live, rates, Next saving, Stripe refused, the Depot view, reminders due none), then
removed.

## Member profiles and partner windows (LOCKED by Sean 2026-10-28, playbook `ve-member-profiles-partner-windows`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-member-profiles-partner-windows`). **We choose when a profile is
seen; the member chooses what is in it.** The team sees every profile answer, used only to improve the member's experience, never
sold or handed over. Each answer is **Can be shown** or **Just for Vegans Explore** (the In your words prompts, city and journey
shareable by default; the `team` market research questions never, with no switch). No open browsing: a profile shows, only its
shareable parts, inside a window we open: an event's guest list, a campaign, a sponsor invite. **Partner windows**: an event
organizer messages the members who RSVP and opted in, from the RSVP until 7 days after the event; a brand messages members who opted
in to hear from it, for its campaign's run dates; a one-time message to past guests is phase 4. Every message goes through us
(partners never see an email, phone or handle), logged, capped per window, with Mute and Report (reports pause the partner). Consent is
an explicit, rewarded opt-in at RSVP and at save ("Let <organizer or brand> message me about this"); a save alone is never consent,
and the UK (London) needs an unticked opt-in. Without consent partners get counts and segments, never names. The Policies page says
it before any of it goes live. Build order: 1. the switches and the team view in the Depot, 2. the event window, 3. the campaign
window, 4. past guests. **Phase 1 is built** (Sean, 2026-10-28: "go ahead with phase 1"; migration `20261028_profile_visibility.sql`):
every answer about the member has **Who can see this answer** in Your profile (Can be shown / Just for Vegans Explore, saved at once,
`ve-mission-survey` `shown`, `members.profile_shown`) and a tag on its card; the rule is the database's (`ve_profile_switchable()`: the
prompts, city, journey and Vegan since start shown; roles, what drew them, what matters and how they eat start private; the `team`
questions and the Instagram handle have no switch and are never shown), and `ve_profile_public(member)` (first name, last initial and
the shown answers) is the only way a profile may leave the team, for the windows of the next phases. **Depot > People > Profiles**
(`/admin/depot/profiles`, `ve-mission-survey` `admin_list` / `admin_get`, super admins): everyone who has answered (search, city,
answered of 31, points of 250), and one member (`#m/<id>`): every answer with Can be shown, Just for Vegans Explore or Team only, and
What anyone outside the team could see. The Policies page's Privacy says all of it (profile answers, who sees what, partners only
through us in a window they said yes to).

**Phase 2, the event window, is built** (Sean, 2026-10-28: "go ahead with phase 2"; migration `20261028_event_window.sql`, `ve-events`,
`public/ve-events.js`). Every live event has its own view (`/events#event/<id>`, the tile's name; the dashboard's Events tab too):
the details and, for a Passport holder, **I'm going** (`event_rsvps`, which had never been used: every RSVP linked out). When the
event has an organizer (`ve_event_organizers`: the member who sent it as its host or promoter, made on approval, or anyone added in
Depot > Events by account email, with the name guests see), the RSVP offers an **unticked** "Let <organizer> message me about this
event", 25 points once per event (`ve_points_grant` reason `partner_optin`, ref `optin:<event>`; `ve_event_rsvp`). The organizer's
**Guests and messages** (`#guests/<id>`, linked from My events and the event): going, said yes, the shown profile parts of those who
said yes (`ve_event_guests`, `ve_profile_public` only), and messages through us (`message_send`): by email from Vegans Explore with
their name, plain text up to 1,000 characters, 3 per event at least 24 hours apart, until 7 days after the event
(`ve_event_window_open`), never an email address either way (replies come to contact@lesaruss.com), each one logged
(`ve_event_messages`, `ve_event_message_deliveries`). Only the organizer sends; the team reads. A guest's email links to
`/events#message/<token>` (no sign-in): **Stop messages from <organizer>** (`ve_partner_mutes`, every event of theirs) and **Report
this message**, which pauses that organizer on every event (`paused_at`), stops them for the reporter and emails Sean; Depot > Events
shows each live event's **Organizers and guests** with the messages, reports, **Resume** and **Remove**. My events lists the events they
organize, the ones they are going to (with Stop <organizer>'s messages) and the organizers they stopped (Let them message me again).
Defaults set by Logan, Sean's to change: the box unticked everywhere (the law asks it only in London), 25 points, 3 messages a day
apart, 1,000 characters (`MSG` in `ve-events`). Proven end to end 2026-10-28 on a [TEST] event with two internal accounts (RSVP and
points once, the organizer's view, a real send, the second send refused, the guest's link, report, pause, Resume), then removed.

**Phase 3, the campaign window, is built** (Sean, 2026-10-28: "go ahead with phase 3"; migration `20261028_campaign_window.sql`, edge
function `ve-campaign-window`). A save is a bookmark, never consent. Saving a listing a business has claimed (`listings.owner_member_id`)
opens a small window (`askOptin` in `directory/listing.html`) with an **unticked** "Let <name> message me during their campaigns", 25
points once per listing (`partner_optin`, ref `optin:listing:<id>`; `ve_listing_optins`, `ve_listing_optin_set`); unsaving takes it back
(trigger `trg_ve_listing_save_removed`), and **My Saves** has the switch on every saved listing a business claimed (`mine`). A campaign
is a run of Eastern dates the team sets in **Depot > Brand campaigns** (`/admin/depot/brand-campaigns`, Directory in the Go to menu:
Running / Coming / Ended, New campaign, one campaign with its counts, messages, reports, Resume and End it now; `ve_listing_campaigns`).
The business dashboard's **Your audience** (`?tab=brand&pd=audience`, `drawAudience` in `ve-partner-dashboard.js`) shows how many saved
them and said yes, by chapter (`ve_listing_segments`), never names; only while a campaign is live (`ve_listing_campaign_live`) does it
show the members who said yes as `ve_profile_public` shows them, and a message box (the owner only, claim approved): by email from
Vegans Explore with the listing's name, 1 a week, 4 a campaign, 1,000 characters (`MSG` in `ve-campaign-window`), replies to
contact@lesaruss.com, logged (`ve_campaign_messages`, `ve_campaign_message_deliveries`). A member's email links to `/messages#c/<token>`
(`messages.html`, no sign-in): **Stop messages from <name>** (withdraws the yes) and **Report this message** (pauses the campaign, withdraws
the yes, emails Sean). The dashboard's **Saves** view no longer names who saved (it did since 2026-10-27; `ve-podcast` `owner_saves` sends
dates and counts only). Check-ins are counts only for the owner too (Sean, 2026-10-28: "treat check-ins the same way"). Defaults set by Logan, Sean's to
change: unticked, 25 points, 1 a week and 4 a campaign. Proven end to end 2026-10-28 on the Vegans Explore Podcast listing with an
internal test account (no yes before saving, the yes and its points once, unsaving withdraws it, counts by chapter, a real send, the
second send refused, the member's link, report, pause, Resume), then removed. Phase 4, one message to an organizer's past guests,
waits until the first windows have run.

**Members-only tickets** (Sean, 2026-10-28: "Let's do a campaign for the Dolphins event, and I want to open up tickets... link that to
this campaign as well as to the event listing so that it takes them directly there when they log in"; migration
`20261028_dolphins_member_tickets.sql`). Some ticket links are ours alone, a group link with our markup, and must never be public (the
Dolphins playbook: gated to signed-in members, after the public link leaked last time). Such a link lives in `ve_event_member_tickets`
(event, url, initiative; RLS on, no policies, so only the server reads it), and the event's `ticket_url` is our own
`/events#event/<id>/tickets`. The event view shows **Get tickets** ("Through our Vegans Explore group link, for Passport holders") in place
of the official link (`ve-events` `event` returns `member_tickets`, never the url); `ve-events` `tickets` gives the url only to an active
Passport holder or a super admin (else `not_eligible`), logs a `ve_initiative_interest` row (tags `event-tickets`, `event:<id>`), and the
page goes there. Signed out (Sean, 2026-10-28: "this is a member-only event. You must be a member in order to access the tickets"), Get tickets, the tile, a city hub's RSVP and `#event/<id>/tickets` open the Directory's members-only window (`VEVotes.memberPrompt('tickets')`, loaded on first need): This is a members-only event, Explore the Passport (`/passport?from=tickets`, with its own note) or Sign in, both coming back to `#event/<id>/tickets`, which takes a member on to the tickets. First: the Plant-Based
Showcase, Miami Dolphins game day (event `3f6a7e2e-efff-4b0e-80ce-580428d3cb52`, Fevo `Vegansexplore2`, $15 a ticket to LESARUSS Inc.,
organizer Vegans Explore); its campaign page's attend step is **Get Tickets** on the same link (`campaigns/plant-based-showcase-dolphins.html`).

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
**PETA and the national organizations** (Sean, 2026-10-28: "PETA. I haven't seen it on the website at all... that's a glaring
omission"; migration `20261028_national_organizations.sql`). PETA, the Physicians Committee, Sea Shepherd, Vegan Outreach, The Vegan
Society, DxE and Anonymous for the Voiceless had sat quarantined since the June Instagram import: the backlog check filed them as
"A person" (Instagram leaves the business flag off big accounts) or "Not a restaurant", lists that only offer Set aside. They were listed
and fifteen missing ones added (Animal Legal Defense Fund, Best Friends, In Defense of Animals, Compassion in World Farming, United
Poultry Concerns, Born Free, Sentient Media, Animal Outlook, Last Chance for Animals, Food Empowerment Project, The Good Food Institute,
Veganuary, Faunalytics, Nonhuman Rights Project, and Animal Place, a sanctuary in Grass Valley): headquarters from Google Places where
Google has them, the rest online, every chapter (Animal Place by address only), each with an About from its own description. Ten smaller
animal groups the same check buried (Fish Defender, UnchainedTV, Karma Farm Sanctuary, Hogs & Kisses...) went to New places > Ready to
list for Sean to confirm. Before trusting "A person" or "Not a restaurant" on an Instagram row, read its bio: an organization's
account often has no business flag.

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
`ve-checkin` `privacy`); the owner of a claimed listing (claim approved, member or plan) sees **counts only, never who**
(Sean, 2026-10-28: "treat check-ins the same way" as saves, the locked rule of `ve-member-profiles-partner-windows`) on the
business dashboard's **Check-ins** view (`ve-claims` `owner_dashboard` `checkins`: last 30 days, members, members who came back,
12 months, by week and by the members' home chapter; no names or member ids leave the function); a business reaches members only
through the yes at save, during a campaign (Your audience). The team sees who in Depot > Directory review (`review_get` `checkins`). A check-in in the last 30 days keeps a place from
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
**London and Philadelphia, a wider pass** the same day (Sean: "run the community search for London and Philadelphia too"; migration
`20261028_community_search_london_philadelphia.sql`): 60 searches, London borough by borough and Pennsylvania city by city, 123
quarantined in Ready to list (London 12, Philadelphia 111; London's big rescues, Battersea, Mayhew, Celia Hammond, Dogs Trust, were
listed already). RSPCA is left out. Google gives many Greater London places their postal town (Croydon, Bromley), so they count as
London and carry `communities` ['london']; the London chapter itself matches only the city London.
Philadelphia's ticked Ready to list (Sean: "add the ticked ones from Ready to list for Philadelphia") went live the same day, all 136
through `backlog_decide` as Add the ticked does (88 Rescues, 25 Sanctuaries, 23 Nonprofits, no How Vegan). Sent all at once from SQL,
31 of the calls failed to boot the function (503 BOOT_ERROR) and nothing saved; re-sent, all landed. Six had no town from Google
and got it from Google's address.

**Studios** (Sean, 2026-10-29, playbook `ve-business-hub-ad-console`: a studio directory for production, podcast and photo
studios, prompted by Trisha, each claimable with the $11 Passport). Services > Studios, after Animal Care (`CAT_MAP`, `CAT_CONFIG`,
`SECTIONS`, `KINDS`, `CATS` and the functions' category lists). A studio is usually Not a Vegan business. The first South Florida
search (`20261029_studio_search.sql`) put 129 in Business outreach > New places > Ready to list (91 video and production, 25 podcast,
13 photo). **123 went live the same day after a preliminary check** (Sean: "I'm not going to click through 129 studios... is it open?
Is it active?... If it fits that... Add them. We can always remove them later on"; migration `20261029_studios_live.sql`, run through
the one-time `ve-once-studios-live`, now the 410 stub): all 129 were open on Google; a studio went live with a phone or website and
either a Google review in the last two years or a website that loads, and the six that did not are set aside with why (two dead
websites, four with no website and no recent review). The Directory's **Is your business in here?** strip (under the vote box, shown to everyone, members
included) and the listing's claim box say the claim takes the $11 Passport, whose 1,100 points cover it.

**Diplomats open every Guide** (Sean, 2026-10-29, canon `canon-lesaruss-ai-subscription-guide-wizard-model`
UPDATE_2026_10_29_ONE_MEMBERSHIP_UNLIMITED_GUIDES and _DIPLOMAT_NAME_LOCKED): the one $111 LESARUSS.ai membership, named Diplomat,
includes every Guide from every LESARUSS community. `ve-guide-unlock` `access()` opens a paid Guide (`via` `diplomat`) for an
account whose email has a LESARUSS-tenant `members` row active on premium or advanced, or cancelled and paid through
(`isDiplomat`, the rule in lesaruss-hq `lib/memberAccess.ts`). A Diplomat still needs a Vegans Explore account to sign in here;
signing in with the LESARUSS account everywhere is the next build.

**Groups** (Sean, 2026-10-29: "I want to add groups... the same way we have nonprofit rescue sanctuaries... when you click on it,
it's all of their events will be tied to their profile, and their profile will be tied to all their events... eventually get them to
have their community exclusively on Vegans Explore"; migrations `20261029_community_groups.sql`, `20261029_community_groups_seed.sql`).
Community's sub-sections are All, Nonprofits, Rescues, Sanctuaries, **Groups**, Events: social clubs, meetup groups, potluck and dinner
clubs. A group is an organization like a rescue (no How Vegan), votable and savable like any listing, in its chapter by `communities`
(a group known only by its chapter gets its state as well). **Events belong to the group that hosts them**: `events.host_listing_id`
(any approved listing can host; Groups, Nonprofits, Rescues, Sanctuaries and Events come first in the picker). A listing's Overview shows
**Upcoming events** (soonest first, each opening `/events#event/<id>`, with Tickets & info) and the last six **Past events**
(`loadHostedEvents` in `directory/listing.html`; always shown for a group, else only once it has hosted something), and an event's page
says **Hosted by <group>** linking to its page (`event.host` from `ve-events` `event`). **A group's events page is a crawl source tied to
it** (`ve_event_sources.listing_id`): every event `ve_event_intake` saves from that source is the group's, and a duplicate found again
there gets the group as its host. Depot > Events has **Hosted by** on each event (`ve-events` `hosts`, `host_listing_id` on `update`,
`review` and `save`) and **The group whose events these are** on each crawl source. Groups often post only on Instagram, Meetup,
Partiful or Linktree, which this build session cannot reach; the Background writer reads them. **The first sweep** (2026-10-29): 14 live
(Vegan Social Club in South Florida, from the June Instagram import; NYC Vegetarian & Vegan Meetup, NYC Vegan Spirituality, Plant Powered
Metro New York; Veg Society of DC, serving D.C., Maryland and Virginia; Baltimore Veg/Vegan Meetup; Vegan Club RVA; Vegan Social Clubs and
Atlanta Veggie Eats; Vegetarians of Central Florida; Vegan Spirituality Group of Philadelphia; Los Angeles Vegan Gatherings, Vegans of
Los Angeles; London Vegan Meetup), each with a dated 2025 or 2026 event, and 5 On hold for review in Directory review with why (Afro
Vegan Social, Center City Philly Vegans, LGBTQ+ Vegans London, London Vegans, Vegan Squad: no dated event seen). **Philly Vegan Social
Club** (Sean gave its Partiful, `partiful.com/u/VrM8jI2gyGMs9BJWvXNi`; migration `20261029_philly_vegan_social_club.sql`) went live the
same day with its 32 upcoming Partiful events. Partiful is readable from the database server (pg_net) though not from the build
session: a host page's `__NEXT_DATA__` lists `initialPublishedEvents`, and each `partiful.com/e/<id>` has the description and an
approximate place (`locationInfo.mapsInfo.approximateLocation`, the neighborhood; the address only after an RSVP). North Florida, Delaware and West Virginia had none confirmed.
**A group's history counts** (Sean, 2026-10-29: "show past, because it's a good indicator to people that it's a good group to join
if they have a lot of past events... by default, it shows upcoming, and then they would have to click past"; migration
`20261029_group_past_events.sql`). The page's Events has two tabs, **Upcoming (N)** first and **Past (N)**, newest first, each scrolling in
its box; a past row's button is **Event page**, their own page, kept even if it no longer opens. `ve_event_intake` saves an event that is
over only with `past: true`, a host listing and a start on or after 2020-01-01; anything else over is still `already_over`. The 2026
history went in the same day: 709 Meetup events for the 16 Meetup groups (2026 to date and the next 180 days; Vegan Social Clubs' weekly
market is scheduled years out), read from Meetup's GraphQL (`https://api.meetup.com/gql-ext`, no sign-in: `groupByUrlname(urlname)
{ timezone events(filter:{status: PAST|ACTIVE, afterDateTime, beforeDateTime}, first: 100) }`, no more than 100 a call, so split a busy year
by date range); Philly Vegan Social Club's 36 from Partiful; and from Instagram (Apify `instagram-scraper`, posts since 2026-01-01) 16 for
the Vegan Social Club (its Partiful host is a personal account with no public list) and 9 for Vegan Club RVA, each linking to its post,
a recap with no announced date dated the day it was posted with Time to be announced. Afro Vegan Social, Center City Philly Vegans,
LGBTQ+ Vegans London and London Vegans went live then (Meetup shows 2026 events); Vegan Squad stays on hold.
The goal, not built yet: a group runs its community on Vegans Explore (its members, its events, its board).

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
- **How to add it, and Promote your event** (Sean, 2026-10-28: "I would just like to be able to choose how I want to input the
  event... once you pull the information, you can ask clarifying questions... members... need to make clear if they are the owners
  of the event, if they're the promoters... or... attending"; playbook `ve-events-platform`). Step 1 is **How do you want to add
  it?**: Drop in a flyer, Paste a link, or Type it in. A link goes to `ve-events` `link_read` (the page's structured data and text,
  its share picture; an Instagram post through Apify's `instagram-scraper`, its picture read like a flyer; the pasted page becomes
  the official link unless it is Instagram; counts with the five reads a day). A flyer or link that reads goes straight to step 4,
  **What we found** (typed in, **Check and send**): the event with Change links, a question for anything missing (the name, the
  start, the city), the official link and **You and this event** (I'm hosting or organizing it / I'm promoting it / I'm going,
  required; `events.submitter_role`, migration `20261028_events_submitter_role.sql`; Depot > Events shows it). A host or promoter
  then lands on **Promote your event** (`#promote/<id>`, also Promote it in My events): three packages (Spotlight, Boost, Front
  Row) and six options (Feature it, Run ads, Meetup feature for South Florida events only, Social push, Coverage, Co-produce),
  no prices, **I'm interested** (`promote_interest`: a `ve_initiative_interest` row, initiative `event-promotion`, tags the
  package, options and `event:<id>`, on `/dashboard/leads`, and an email to Sean). The Meetup group's numbers show once Sean
  gives them. The Vegan Foodie Fest case study waits on its material.
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
  Ambassador, Community Manager; `ve_view_as`; or one page only with `?view_as=member|ambassador|cm`, plus `&profile=` for an
  Ambassador, read once as the page loads, `urlViewAs` in `ve-auth.js`, which Preview journeys > Ambassador > Their dashboard uses) and **Sign in as** (`ve-switch-account`). While a preview or a switch is on, a pill at the
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
  than the buttons. **Desktop does the same since 2026-10-28** (Sean: "I want it to look exactly like how it looks on mobile in relation to
  the title and subtitle and the dropdown"): folded, the title and the line under it grow until they and the picker fill the buttons'
  height, 8px apart like the buttons (Vegan Directory 31px, Food 24px at 1366 and 1440); the title stays one line there. Button labels stay one row on a phone (Submit listing, not Submit your listing). The line under the title is
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

**The Directory's Media picker lists the kinds of media** (Sean, 2026-10-29: "the drop down shows the cities, and instead it should
show the different types... podcasts, YouTube, news outlets, documentary films, books, and any new thing"). On the Directory's Media
section (`/directory` and the dashboard's Directory tab) the banner's picker is Podcasts, YouTube, News Outlets, Documentaries & Films,
Books and All media, the section's own pills (`tellSection` in `ve-region-directory.js` passes them to `onSection(key, label, subs)`), so a
new sub-section joins it; a pick opens that pill, a pill updates the picker, and any other section has the cities back
(`VECityBanner` `setChoices(list, value, pick)`, `setChoices(null)`; `mediaPick` in `directory/index.html`, `dashDirSection` in center-console).

**YouTube channels** (Sean, 2026-10-29: "find some popular YouTube vegan channels... any new video that pops up will show on their page...
the video on the left, and then a summary, like a 250 character summary... all their Instagrams... below it, you will see thumbnails of
their latest videos... watch everything on this page"; migration `20261029_ve_youtube_feeds.sql`, edge function `ve-youtube`). A YouTube
listing names its channel in `details.youtube_channel_id`; its Overview (`renderYouTubeOverview`, `loadYouTube` in `directory/listing.html`)
plays the latest video on the left (`youtube-nocookie`), About (the listing's description, up to 250 characters), subscribers and videos,
and **Find them on** (YouTube, Instagram, TikTok, Facebook, website; marks in `/public/icons/platforms/`) on the right, then **Latest videos**,
thumbnails 12 at a time (Show more), each playing in that player. `ve-youtube` `videos` serves the latest 50 uploads from
`ve_youtube_feeds`, read again after 6 hours (cron `ve-youtube-refresh`, hourly, 20 a run), which sets Active / On hiatus like a podcast;
`resolve` (ops) looks a channel up by handle or id. YouTube refuses our server its channel pages (a blank page) and its RSS feeds (404
for every channel, Google's own included; checked 2026-10-29), so it reads YouTube's Data API v3 with `YOUTUBE_API_KEY`, else
`GOOGLE_PLACES_API_KEY` (Sean turned the YouTube Data API on for it the same day). A News Outlet with a channel gets the same page
(`isYouTubeL`: Plant Based News, which also shows under YouTube). **The first 12** (migration `20261029_youtube_channels.sql`, each found
through `resolve`, its About written from the channel's own description, links only the ones the channel publishes, its own picture as the
logo): Pick Up Limes, Rainbow Plant Life, Mic the Vegan, NutritionFacts.org, Earthling Ed (YouTube) (one listing a name: his People profile is
Earthling Ed), Sweet Simple Vegan, Cheap Lazy Vegan, Simnett Nutrition, BOSH!, Sarah's Vegan Kitchen, The Happy Pear (from the May import)
and Plant Based News. Left out: Avant-Garde Vegan (Gaz Oakley is no longer Vegan), Sauce Stache (now Mark Stache, a general health
channel), We Cook Vegan (uploads not public); then BadAssVegan (John Lewis) and Torre Washington (YouTube) with the linked pages.

**Linked pages** (Sean, 2026-10-29: "his overview page and then have a tab for his podcast and then have a tab for his other thing... it
just goes to those pages... you see the URL change as well. All that is cross discovery, and it doesn't bog down his page"; migration
`20261029_listing_families.sql`). Listings that belong together share `listings.details.family`; every page in it shows the others in its
tab row as links to their own pages (`loadFamily` in `directory/listing.html`): **Overview** (the person), **Podcast**, **YouTube**, **Book**,
in that order, the page you are on active in its place. A show two people host names each person (Muscles by Brussels Radio: Dani Taylor,
Giacomo Marchese, Podcast); with no person it is Podcast and YouTube (Nutrition Facts, Plant Based News). Families set 2026-10-29: Earthling
Ed (profile, The Disclosure Podcast, his channel), John Lewis (profile, BadAssVegan, the book Badass Vegan), Torre Washington (profile,
Torre Washington (YouTube)), and each host and their show (Neal Barnard, Dotsie Bausch, Jason Kartalian, Brighde Reed, Maxime Sigouin,
Muscles by Brussels). Neither John Lewis nor Torre Washington hosts a podcast of his own (checked, Sean asked); their channels were added
(`badassvegan-youtube`, `torre-washington-youtube`). A new family is the same `details.family` value on each listing; two of the same
kind run A to Z unless `details.family_order` puts one first (lower first; the Vegans Explore Podcast is 1 in Sean's family).
**The tab order and Books** (Sean, 2026-10-29: "The order should be overview, podcast, YouTube, and then the dashboard... I also want to add
in books... after YouTube and before partner dashboard"). The family's tabs go right after the page's own tab, so the row is always
Overview (the person's profile), Podcast, YouTube, Books, then the page's other tabs and Partner Dashboard last (shown only to the owner and
super admins, `loadPartnerHome`). With a person in the family, all its books are one **Books** tab on the person's page (`?tab=books`; from
the podcast, YouTube or a book's own page it links there): the covers, newest first, then **About the author** (their description cut to 150
characters, Read their profile); a cover opens that book in the same space (`?book=<slug>`, pushed so back works): a breadcrumb in the page
(Books > title), the cover, by, year, type and publisher, the synopsis (`details.summary`, else the description), **Buy on Amazon** (the
book's tracked link, `details.buy_link`, `/go/book-<ISBN-10>`) and The book's page (`drawBooks` in `directory/listing.html`). On 2026-10-29
(migration `20261029_author_books.sql`): Earthling Ed's three books, eight of Dr. Barnard's (The Cheese Trap joined his family) and Badass
Vegan, each cover copied from Amazon's image for its ISBN into `vegan-media/media/logos/books/` and checked by eye (Badass Vegan's stored
ISBN was wrong; Reversing Diabetes uses the revised edition in print). Open Library and Google Books refuse our server after a few calls, so
book facts came from Open Library's search before it closed. **Amazon Associates**: every `/go/` link to an Amazon store leaves with our
tracking ID (`withAffiliate` in `ve-links`, `ve_site_settings` `amazon_associates` `{tag, tags: {'amazon.co.uk': ...}}`, read with a 5-minute
cache). Our US tag is `vegansexplore-20` (Sean, 2026-10-29); other Amazon stores (amazon.co.uk for London) go untagged until a tag for
that store is added under `tags`.
**Referenced books and the book crawl** (Sean, 2026-10-29: "any books that are mentioned in the podcast, we put on... a background list to be
built out and put into the page. And any books from any of the people... we do a crawl"; migrations `20261029_ve_books_crawl.sql`,
`20261029_book_covers_buy_links.sql`; edge function `ve-books`). `ve_books` is the list: every book we know of (source `listing`, the 33
already listed; `transcript`; `author_crawl`), one row per title and author's last name (`ve_book_key`, `ve_book_author_key`,
`ve_book_upsert`, so a caption's "Bolshevitz" still finds Bulsiewicz's book). Three crons call `ve-books`: **scan** (`ve-books-scan`, two
transcripts every 5 minutes, `ve_content_transcripts.books_status`, requeued when a transcript is replaced) has Claude name the books said
in a transcript, keeps a mention only when its quote is really in the transcript within two minutes of its second, and saves it in
`ve_book_mentions` with the show's feed guid (`ve_content_feed_episode`); **crawl** (`ve-books-crawl`, two People every 10 minutes, again
after 180 days, `ve_book_author_checks`) looks a person up by name and keeps the books Claude confirms are theirs (`author_listing_id`);
**build** (`ve-books-build`, three every 5 minutes, three tries) matches a found book, takes an English edition whose cover Amazon has,
copies the cover into `media/logos/books/`, has Claude write the card line and synopsis only from the publisher's description, and makes its
tracked Amazon link. A book about Vegan or plant-based living, food, health or animals becomes a Books listing (one of our People's books too,
but only when it is about Vegan living: Sean, 2026-10-29, "Only the books relevant to Veganism"; six were taken off that day, migration
`20261029_books_vegan_only.sql`, among them Jane Velez-Mitchell's true crime books and the What the Health book), unless we talked about it with its author on our podcast
(Sean, the same day: "We spoke to that author about the book"; `talkedAbout` in `ve-books`: named in a transcript, or the author's
episode is titled with it; The Penis Book and iWant stay, migration `20261029_books_kept_talked_about.sql`)
(`built`, in its author's family, so it is on their Books tab; a person with no family gets their slug as one); any other book is
`referenced`, shown only on the episodes that name it. An existing listing of the same title is linked, never copied. A podcast episode's
view (`?ep=<guid>`) shows **Referenced books** under it (`books` in `public/ve-episodes.js`, `ve-books` `episode`, public): the cover,
title, author and Recommended / Their book / Talked about / Mentioned, opening the book's page, or Amazon for a referenced one. `ve-books`
`status` counts the list, `probe` says whether the sources answer. **Sources**: Google Books first, read with our Google key (`GOOGLE_PLACES_API_KEY`; Sean added the Books API to the key 2026-10-29),
English results only (`langRestrict=en`, an edition counted only when Google says its language is English, and the match itself judged English or not; a book found only in another language is Not found, since a Spanish La Promesa Del Meñique got through on 2026-10-29), retried when it answers 503, and searched looser until something comes back (its operators miss
some books a plain search finds); then Open Library, which refused our server's connections that day. A crawl that finds nothing under the
listing's name asks Claude what name they publish under (Earthling Ed writes as Ed Winters) and saves the book under the name on its cover.
A source that does not answer does not use up a book's tries. A book whose English editions have no cover on Amazon is `not_found` (Klaper's
1987 Pregnancy, Children, and the Vegan Diet). Proven 2026-10-29 on two episodes: the cookbook
countdown named its ten books, all matched to their listings, and John Lewis's named Badass Vegan, A New Earth and The Art of War (the last
two queued; once Google answered, A New Earth and The Art of War became referenced books and Dr. Klaper's Moving Medicine Forward, named in
his episode, a listing on his new Books tab). **Building each other** (Sean, 2026-10-29: "we're mining for content to put into our
directory and then cross-referencing that content with what we have in our directory"): every book's page and the Books tab's book view
show **Talked about on our podcasts** (`loadBookTalks` in `directory/listing.html`, `ve-books` `book`, public): the episodes that named it,
with who and how (Their own book, Recommended, Talked about, Mentioned), each opening the episode on its show's page. Books not about Vegan
living stay out of the Directory (Logan's default, Sean's to change) and show only as Referenced books; **Depot > Content > Books**
(`/admin/depot/books`, after Content index in the Go to menu; `ve-books` `admin_list`, `admin_get`, `admin_set`) lists the book list by
status (Waiting, In the Directory, Referenced only, Not found, Set aside) with the scan and crawl progress, and one book (`#b/<id>`) with
why it stands where it does, the episodes that named it, and **Make it a listing** (a referenced book becomes a listing at once from what
the builder found; any other is built as Vegan related on its next run, `vegan_related` true), **Try again** and **Set aside**. When Amazon
has no cover for any English edition, the builder takes Google's own cover picture of one (`googleCover`, `books.google.com/books/content`,
800 px wide); a book with no ISBN-10 gets an Amazon search as its tracked link (`buyLink`). The same day five older books got their Amazon covers and every book with an ISBN its Amazon link; Sweet Potato Soul's picture
(its author's logo) was set aside for the letter. **Pre-Vegans** (Sean's book, 2026-10-29; migration `20261029_pre_vegans_book_spitz_fix.sql`) has a
979 ISBN, so no ISBN-10 and no Amazon cover by ISBN, and the builder could not find it: it was added by hand from its Amazon page
(`pre-vegans-by-sean-russell`, `/go/book-b0b1cd57rw`), in the family `pre-vegans` with the Pre-Vegans Podcast, Featured in Media > Books
(`SHOWS` in `ve-media.js`), and its eight People in it show as its **Featured people** (`details.film_people` on a book too, `bookPeople` in
`directory/listing.html`). A book with a 979 ISBN goes the same way. Google Books had Dr. Aaron Spitz as "Splitz"; his book's listing was
corrected the same day. The China Study was built twice the same day (two author lines; the key took "II"): the author key is now the
first author's last name without II, Jr, MD and the like, `buildOne` links to a Books listing with the same ISBN instead of making
another, and the copy was merged (migration `20261029_books_dedupe_author_key.sql`). Sean got his own People profile the same day (`sean-russell`, Founders, migration
`20261029_people_sean_russell.sql`): the May import's quarantined @seanarussell82 row promoted, Host of every Vegans Explore, SoFlo
Vegans and Pre-Vegans episode (221 credits), in the family `sean-russell` with the Vegans Explore, SoFlo Vegans and Pre-Vegans podcasts and the book (migration
`20261029_sean_russell_family.sql`; no YouTube page joins it until Sean has video he wants to promote); his website is seanarussell.com,
first in Their work.

**Film pages** (Sean, 2026-10-29: "a trailer from like YouTube of the documentaries on the page, add a little bit more of a summary...
where it can be viewed, like if it's Netflix, if it's YouTube, almost like how you have it with the podcast... the video on the left and the
text on the right"; migration `20261029_film_pages.sql`). A Documentaries & Films listing's Overview (`renderFilmOverview` in
`directory/listing.html`) is **Where to watch** (square icons like a podcast's Listen on, each with Free, Rent or buy or Stream under it;
`details.watch` `[{kind: website|youtube|netflix|apple_tv, url, note}]`, `WATCH` in the page; marks in `/public/icons/platforms/`), then the
video on the left (`details.video` `{id, kind: trailer|film, channel}`, a `youtube-nocookie` embed that goes full screen, captioned Official
trailer or The full film, shared free by its makers) and **About** on the right (`details.summary`, longer than the card's description, then
Directed by, Released, Runtime); stacked on phones. Every video is a YouTube upload from the filmmakers, their distributor or Netflix,
checked with `ve-off-lookup` `yt` (YouTube oEmbed: title and channel), and every link opened with `ve-off-lookup` `page`, never taken from
the import's `details.streaming_platforms` (names only, never checked, not shown). Netflix is listed only for its originals (Seaspiracy):
its pages do not say what streams in the US. On 2026-10-29: 13 of 18 have a video (Earthlings, Forks Over Knives, Dominion, Meet Your Meat and
PlantPure Nation the full film, free from their makers), 15 have where-to-watch links; They're Trying to Kill Us, Vegucated, Christspiracy,
Live and Let Live and The End of Meat have no upload from their makers yet. The same check found four film websites gone (letlivefilm.com
and theendofmeat.com now serve gambling sites; gamechangersmovie.com and aprayerforcompassion.com no longer exist), cleared with a
`ve_listing_edits` row each. Not yet: Amazon (Prime Video links not checked) and fields for these in the listing editor.
**On our podcast** (Sean, 2026-10-29: "include the podcasts that I did with the directors on the films... a few doctors that appeared in
these films as well... anyone else that's been in a documentary"; migration `20261029_film_podcasts.sql`): under About, a film lists our
episodes with the people who made it or are in it (`details.film_podcasts` `[{show, guid, with, person?}]`: the show's Directory slug, the
feed guid, "Keegan Kuhn, co-director" or "Dr. Michael Klaper, in the film", and their People slug), read through `ve-podcast` `episode`
(`loadFilmPods` in `directory/listing.html`), two across on desktop, the directors first, Play in a player docked above, with their People tiles above it. The directors panel (Vegans Explore Podcast 57: Shaun Monson, Louie Psihoyos, Marc Pierschel,
Keegan Kuhn) is on Earthlings, The Game Changers, Live and Let Live, The End of Meat, Cowspiracy, What the Health and They're Trying to Kill
Us; John Lewis on They're Trying to Kill Us; Klaper on Cowspiracy and What the Health; Barnard on What the Health, Forks Over Knives, Eating
You Alive and They're Trying to Kill Us; Dotsie Bausch on The Game Changers. Who is in which film is checked against its cast before a row
goes in (Klaper is not in Forks Over Knives or Eating You Alive). The four directors got People profiles the same day (Sean: "Can you
create people profiles for those directors?"; migration `20261029_people_directors.sql`): Shaun Monson, Louie Psihoyos and Marc Pierschel
were quarantined rows from the May Instagram import and became the profiles (handles kept), Keegan Kuhn is new; Content Creators, credited
as Panelist on episode 57, their films as Their work (our own pages open in place), bios from the panel's transcript (recorded in spring
2020, so read for dated lines), moments by the content index's speaker labels. Photos: Shaun and Louie from their Instagram; Marc's
account is his studio's rabbit logo (removed) and Keegan's was not found, so both show their letter.
**Featured people** (named People in this film until Sean's "people featured people" the same day; Sean, 2026-10-29: "their same tile that we have in their directory featured on their page. So they could even vote
for them"; migration `20261029_film_people.sql`): above On our podcast, the People listings who made the film or are in it
(`details.film_people` `[{person, role}]`) as the Directory's own card with Votes (`loadFilmPeople`, which loads
`/public/ve-region-directory.js` on first need), two columns (Sean, 2026-10-29: three squished the words), one on phones. What the Health: Joel Kahn, Klaper, Barnard;
Cowspiracy: Klaper; Forks Over Knives and Eating You Alive: Barnard; They're Trying to Kill Us: John Lewis, Barnard; The Game Changers: Dotsie
Bausch; and since the same day the four directors as Director or Co-director, sorted first. IMDb and Wikipedia do not resolve from the build session, so casts were checked through published cast listings; Torre Washington
was not found in The Game Changers' cast and is left out until it is confirmed.

## People (Sean, 2026-10-28)

"A people directory... people that we've actually interacted with... the incentive for organizations to want to work with us... we're
not just going to randomly add people to it... an IMDb of all the stuff that they've done with Vegans Explore... that will be our
doorway into making them an ambassador." **Launched to everyone 2026-10-28** (Sean: "launch the people directory"; the `people` entry of
`CAT_CONFIG` in `ve-region-directory.js` lost its `adminOnly`), on `/directory` and the dashboard's Directory tab.

- **A person is a listing** in the Directory's **People** section, so votes, saves, the card and the page are everyone's: sub-sections
  **Activists, Content Creators, Athletes, Physicians, Health Experts, Chefs, Founders** (All first), a second one in `extra_categories`.
  No place: every chapter (`communities` `['all']`), no address, phone, hours, How Vegan, claim box, check-in or Partner Dashboard. The card's
  line is what they do (`details.person.title`); Physicians filter by **Specialty** (`details.person.specialty`, `SPECIALTIES`). Change the
  section list together: `CAT_MAP`/`CAT_CONFIG`/`PEOPLE_CATS` in `ve-region-directory.js`, `PEOPLE` in `directory/listing.html`, `SECTIONS` in
  `ve-listing-admin.js`, `PEOPLE_CATS` in `ve-people` and `ve-discover`, `CATEGORIES` in `ve-claims`.
- **The profile** (`isPersonL`, `renderPersonOverview`, `loadPerson` in `directory/listing.html`): their photo square with rounded corners
  (`logo_url`), the roles, the one line, **About** (the bio, "Written from their conversations with Vegans Explore" when it was), **Their work**
  (`details.person.links`: a sign-up page, a program, a product, a book), **With Vegans Explore** (IMDb style: Podcast episodes, Events,
  Articles, newest first), **In their words** (moments of theirs from the content index,
  `ve_person_moments(listing)`: their credited episodes where the speaker is them, `details.person.speaker_names`, three an episode, Play from
  the second), Photos (`gallery_urls`), and the sidebar's Website and Follow (Instagram,
  Facebook, TikTok, YouTube).
- **Credits** are `ve_person_credits` (migration `20261028_people_directory.sql`, public read): kind episode (`content_id`, a
  `ve_pulse_content` row), event (`event_id`, or a title and date), article or video (title and link), with their role (Guest, Host,
  Speaker...).
- **`ve-people`** (super admin, or ops through `LESARUSS_ADMIN_TOKEN`): `save` (what they do, specialty, links, bio, website and socials;
  each change a `ve_listing_edits` row), `credits`, `credit_add`, `credit_remove`, `episodes` (search ours to credit), `bio_draft` (Claude Opus
  5.5 writes the bio from their credited episodes' transcripts and summaries, only what they say; `save` and `recategorize` apply it, its
  section and a physician's specialty), `photo_instagram` (their Instagram picture copied into `vegan-media/media/people/<slug>/`, refused as
  `not_them` unless a word of their name is on the account) and `photo_url`. The listing editor's **About them** (shown for People) does all of
  it: Write it from their interviews, the links, the socials, add an episode or an event, remove a credit; the logo control reads Photo.
  The logo sweep and chain logos leave people out (`notPerson` in `ve-discover`).
- **The first 79** (migrations `20261028_people_seed.sql`, `_seed_2.sql`, `_fixes.sql`): every guest named on our four shows, each credited
  with those episodes; John Thomas and Brooke Sellers as Host of every Vegans Who Lift episode; John (co-producer and host) and Ella Magers
  (meet and greet) at Vegan Foodie Fest Miami. 14 the May Instagram import already held became their profiles (their handle kept, the backlog
  row closed). Every bio was written from the transcripts the same day, 28 moved to the section their interview puts them in (the seed's
  section kept as their second), 29 have their Instagram photo, checked by eye (Sailesh Rao's, Feldi's, James Wildman's and Tim James's
  were not them and were removed). Not added: people only talked about (Tabitha Brown) and businesses (Love Life Cafe, Maizly...).
- Not built yet: people from events and articles beyond the Foodie Fest, the Ambassador path from a profile, and a "Is this you?" for the person.

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

## People pages: podcasts played in place (Sean, 2026-10-28)

"Use the squared with the rounded corners logo thumbnails for the podcast... I don't want it to be like a long scroll... 10 episodes and
then you can scroll within... if they click listen, it's going to open up a player. And if they click watch, it could open up a light
box... I want to keep people in this environment." On a person's page (People section, `renderPersonOverview` and `loadPerson` in
`directory/listing.html`), every podcast episode is the podcast listing's own row (`VEEpisodes.row` through `ppEpRow`: the show's square
artwork, **Play** and **Save**; no search, the lists are short). **Audio only** (Sean, 2026-10-28: "let's just keep it simple and only
have the audio... All our videos is just still images with music playing over it... I'll let you know which videos I feel are worth
sharing"): no Watch, no Videos tab, no video lightbox, and video credits are not listed. Play opens the player **docked above the
podcast sections** (`.vep-dock[data-vep-always]`, before Their podcast and With Vegans Explore; Sean, 2026-10-28: "it puts it at the very
bottom and you don't see it right away"), each Play changes it, and it scrolls into view when off screen (`inView` in `ve-episodes.js`,
which a podcast listing in the dashboard's frame gets too). An In their words moment plays its episode's audio from its second
(`VEEpisodes.play(ep, show, {start})`), only when the moment's episode is matched to the feed and the audio runs within 15 s of the
YouTube transcript it was timed on (`ve_person_moments` returns `transcript_end`, migration `20261028_person_moments_transcript_end.sql`);
otherwise the quote shows with no Play (Dr. Klaper's "Moving Medicine Forward" audio is 47 s shorter than its video). **Save** saves the
episode like a show page's, and every list shows about ten rows and
scrolls inside its box (`.pp-scroll`). Nothing on it links away to listen. The sections: **Their podcasts** (the shows they host, each
the Directory's own card with votes, opening the show's page where every episode is; `ppShowTiles`: `details.person.shows` and our shows
they hold Host credits on, most episodes first; Sean, 2026-10-29: "we should just have their podcast listing little tile... it's just going
to be this long, long page"), **With Vegans Explore** (their guest episodes on our four shows, never the ones they host, then events,
articles, videos; hidden when empty), **On other podcasts** (other Directory shows that had them on), In their words.
The data is `ve_person_episodes(listing)` (migration `20261028_person_podcasts.sql`): our episodes matched to each show's feed
(`ve_podcast_feeds`: the feed episode names them and came out within 60 days, or the titles are close), other shows' episodes with their
name in the title or named as the guest in the description ("with", "joined by", "<name> joins us"; a passing mention does not count),
and their shows. Built ahead (`ve_person_episodes_build`, about 3.5 s, past a visitor's 3 s limit) into `ve_person_episodes_cache`,
rebuilt every 6 hours by cron `ve-person-episodes`. Hosts set 2026-10-28 from each show's own description: Maxime Sigouin, Giacomo
Marchese and Dani Taylor (Muscles by Brussels Radio), Dotsie Bausch (Switch4Good), Jason Kartalian (Vegan Hacks), Brighde Reed (World
Vegan Travel), Neal Barnard (The Exam Room); John Thomas and Brooke Sellers host Vegans Who Lift, one of ours, so theirs are under With
Vegans Explore. A person with another name on other shows gets it in `details.person.aka`.

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
- **Minimize the Guide** (Sean, 2026-10-28: "if I'm using this tool, I don't want to see River on the right-hand side"; then "let's
  make him actually overlap at the bottom of the page and not create a whole column... a square... with rounded corners... show
  me, hide me... if the name's long, it's going to throw it off... the hide me... below the pagination, like a rectangular button").
  Every Guide page loads `/public/ve-guide-min.js` after its script: it moves the page's `#dgFold` under Back / N of M / Next as one
  full-width **Hide me** button; folded, the rail is gone and the content takes the whole width, and the Guide floats as a rounded
  square in the bottom right corner of the screen, **Show me** (`.dg-mini`, the rail's `data-guide` through `VEGuideArt`), on desktop
  and phones alike. A new Guide page sets `data-guide` on `#dgRail` and loads the script.
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
  show to signed-in members only. Choose Your Topics (mini-guides) was taken off. Add or change a Guide card there. On the
  dashboard's Guides tab a Guide opens in the console frame (`openConsoleFrame`, labelled by the card's `data-frame-label`);
  until 2026-10-28 it opened in the Tools panel, hidden on that tab, so Guides seemed not to open (Sean). A Guide laid out to
  fill the window (`html.dg-fit`) never sizes its frame (`nav.js`): sizing it to its own height made the Ambassador Guide bounce. Under the
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
(our interviews with business owners, and sourced research facts; since 2026-10-29 each interview is its podcast episode, not the
video (Sean: "the way we're doing it in the people directory listings"): `PULSE_PICKS` pins each to its show and its feed guid, read
through `ve-podcast` `episode`, drawn with `VEEpisodes.row` two across, Play in the player docked above the list, plus our vote and Save), **Get featured** (listed, claimed, votes, the
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
  **London and Philadelphia, a second pass** the same day (Sean: "run the restaurant search for London and Philadelphia again... make
  sure that there's something in each listing"; migration `20261028_restaurant_search_london_philadelphia_2.sql`): 88 searches by
  neighborhood (and Pennsylvania's other cities, since the chapter is the whole state), 102 live, London 62 and Philadelphia 40. The
  field mask now asks for `regularOpeningHours`, so hours are saved at insert from Google's opening periods (never from its display
  text, which writes "12:00 to 11:00 PM" for noon), and a name we set aside never comes back. **Every new listing has something in
  it** (Sean: "when people click in it, that they're actually getting something... hours... basic information, and a menu"): hours
  and phone from Google at insert, the About line and kinds of food from **`ve-listing-about`** (below), and a Menu tab: their menu
  link when the link finder found one, else their own website (a food place with no menu link; `menuLinkOut` in
  `directory/listing.html`, "opens their website, where they post their menu").
- **The About reader** (Sean, 2026-10-28; edge function `ve-listing-about`, migration `20261028_ve_listing_about.sql`). The Background
  writer's `listing_essentials` pass had fallen 850 behind, so new listings showed no About. This does that job on the server: it reads
  the business's home and about pages, asks Google Places for the place's own summary and what it serves, and Claude (Opus 5.5,
  structured output) writes one or two plain sentences (130 to 240 characters, Vegan capitalized, no dashes, never upgrading how Vegan
  our listing says it is) and one to four cuisines, saved through `ve_listing_essentials_save` (only empty fields, never over an owner's
  words, a `ve_listing_edits` row each). A site that cannot be read gets a line from Google and our listing only, said so in its note.
  Queue: `ve_listing_about_due()` (ve_listing_essentials rows still queued, restaurant-search listings first); cron `ve-listing-about`,
  12 every 2 minutes. `one` (`slug`, `save: false` to preview) for a single listing. Its notes flag a How Vegan that disagrees with
  their own site (Sweet Love: "many Vegan options", listed 100% Vegan).

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
- **Levels 1 to 4 on lifetime points** (`member_points.total_points`, which never goes down): Level 2 from 2,500, Level 3 from
  10,000, Level 4 from 25,000 (`ve_affiliate_levels.min_lifetime`, read by `ve_member_level`; the dashboard's `VE_LEVEL_AT`; change
  both together). Spending or giving points never lowers a level. Sean confirmed 2,500 and 10,000 on 2026-10-25; Level 4 came with
  the affiliate ladder (below), its 25,000 a default Logan set. A level the team sets (`members.level_override`) is the least they have.
- **Levels are the affiliate ladder** (Sean, 2026-10-28: "level one, with your link, you get points and allows you to level up
  quicker to level two, where you can start getting commissions... 20%... level three... 25%... level four... 30%, and we max out at
  30%... when they get level three... the guides now become open... route their commissions to a nonprofit of their choosing... So they
  get the credit for the donation"; migration `20261028_affiliate_levels.sql`, run through `ve-once-affiliate`, now the 410 stub). Every
  member's link is `/passport?ref=<referral_code>`. Level 1: 111 points when a friend becomes a member. Level 2: 20% of the Passport
  bought through the link; Level 3: 25%, and Guides bought with money too; Level 4: 30%, the top (`ve_affiliate_levels`: `rate_pct`,
  `products`, one row a level; change a rate or what a level opens there). Defaults Logan set, Sean's to change: the commission is a
  share of the $11 price (`sale_cents`), never of anything given on top; it counts for purchases by someone who joined with the link
  within 12 months of joining (`window_days`), at the referrer's level on the day; it waits 30 days for refunds (`hold_days`), then
  turns Ready (cron `ve-affiliate-release`, daily); it is paid once $25 is ready (`min_payout_cents`) and after a W-9 (the finance
  module's `finance_payees`, `finance_request_payout`, `finance_1099_list`); never on your own purchases or for a Guide account (all in
  `ve_site_settings` `affiliate_program`). `ve_affiliate_earn(buyer, product, product_ref, ref)` writes `ve_affiliate_commissions` (one
  row a sale, once per ref): the Passport from `ve-stripe-webhook` `entry_contribution` (first join only, ref `passport:<member>`), a
  Guide from `ve_guide_purchase_paid` (ref `guide:<member>:<guide>`). Statuses: pending, ready, paid, given, reversed (a refund, marked
  by hand for now). **Where it goes** (`members.affiliate_route` self | nonprofit, `affiliate_listing_id`): a member can send everything
  their link earns to a Nonprofit, Rescue or Sanctuary in the Directory, given in their name (we never call it tax-deductible to them).
  **Points and levels** (`/dashboard/levels`, `levels.html`, a Your tools tile and the Dashboard banner's Level; `ve-affiliate` `me`,
  `route`, `orgs`): Your level (the ladder, their progress, their link), How points come, What your link earned, Where it goes.
  **Depot > Ambassadors > Commissions** (`#commissions/<status>`; `ve-affiliate` `admin_list`, `admin_settle`, `admin_launch`): every
  commission, Mark paid / Mark given / Refunded, and **Launch it for members**. Until launched (`affiliate_program.live` false) members
  see only Your level and How points come, with no rates; super admins see it all marked Preview. Commissions are recorded either way.
  **Launched 2026-10-28** (Sean: "launch the affiliate program"; migration `20261028_affiliate_launch.sql`): `affiliate_program.live`
  true, the terms in `/policies#membership` (Your link and commissions, with the FTC rule that sharers say they earn, no spam or bidding on
  our name, rates may change going forward), the Guides' facts and a saved answer (Can I earn money from my link?), and a line in the Passport
  Guide's Bring people in and the Ambassador Guide's Your link.
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

## Venue Guides: Stadium & Arena and Airport (LOCKED by Sean 2026-10-28, playbook `ve-venue-guides`)

Concept session with V, locked by Sean: "lock it, go with your defaults" (canon `canon-ve-venue-guides`). The Stadium & Arena
Guide launched 2026-10-29 (below); the Airport Guide is not built. Two
Guides on the Dairy Guide pattern, a venue mapped to the Vegan food inside it:

- **The Stadium & Arena Guide**: one Guide for both, with a Stadiums / Arenas filter (same fan, same concessionaires, and two
  would each launch thin; not "Game Day", since venues host concerts too; amphitheaters and concert venues can join later). The
  venue, its home teams, each stand with its Vegan items and where it is (section or gate). Our chapters' venues first, Hard Rock
  Stadium first (the Plant-Based Showcase). Narrator: River, after a character refresh (Sean, 2026-10-28: still in his 20s, a
  new hairstyle; of three options Sean picked short twists with a fade). His art is in the repo, `public/guides/art/river-square.webp`
  and `river-tall.webp` (`VE_GUIDE_ART`), and `public/guides/river.jpg` (old pages) is the new mid shot.
- **The Airport Guide**: the same layout by terminal and by before or after security. Our chapters' airports first, then the
  world. Narrator: Nori, who becomes the traveler (Sean, 2026-10-28: Liz has become the business Guide; Pascal is culinary and
  belongs on the food Guides, such as the Vegan Meat Alternatives Guide). Nori's AI Guide record (`character_agents`) is the Traveler
  Guide since 2026-10-28 (migration `20261028_nori_traveler.sql`), and so are the Guide picker and the dashboard tiles; Liz took the
  Entrepreneur path page (`guides/ve-path-entrepreneur.html`). Liz is the Business Guide (Sean, 2026-10-28: "move forward"; record and
  picker, migration `20261028_liz_business.sql`) and stays the default Guide every new member meets first.
- $11 or 1,100 points each, one venue free as the example.
- **Members keep them accurate**: confirm an item, or report one missing, wrong or gone, with a photo and a venue-wide location
  check; each submission waits in a Depot review queue and pays only when accepted (`ve_points_grant`): the first accepted
  correction 100 points, later ones that agree 25 (told who was first), "Still accurate" 10, at most 5 paid a day. Every item
  shows when it was last confirmed and ages out at 35 days; a new season marks a stadium's items stale until confirmed.
- **The Stadium & Arena Guide, built 2026-10-28** (Sean: "go"; migrations `20261028_ve_venue_guides.sql`,
  `20261028_venue_report_points_reason.sql`; edge function `ve-venues`). Page `guides/stadium-arena-guide.html` and
  `guide-scripts/stadium-arena-guide.js` (the Dairy Guide's layout, River on the right, `noindex`): Overview, **Venues**
  (`#/venues[/stadiums|arenas]`, one venue per view `#/venue/<slug>`: each stand, where it is, its items with Vegan / Vegan on
  request / Ask before you order, where we read it, and Checked <date> / Not checked this season / Not checked by a member yet),
  **Help keep it right** (`#/venue/<slug>/report/confirm|wrong|gone|missing[/<item>]`: a photo shrunk to 1600 px into the private
  bucket `venue-reports`, the phone's location, then `ve_venue_report_save`, which refuses a phone outside the venue's
  `radius_m` plus up to 100 m of its accuracy, a fix worse than 500 m, 20 a day, the same item and kind twice a day), My list
  (`ve_guide_saves` kinds `venue`, `venue_item`) and Get access. Data: `ve_venues` (kind stadium | arena | airport, `free_example`,
  `radius_m`, `season_reset_at`, Google place and pin), `ve_venue_spots` (stands, `zone`), `ve_venue_items` (`sources`,
  `last_confirmed_at`), `ve_venue_reports`; RLS on with no policies, everything through `ve-venues`. Seeded from published
  sources (Upfront, The Leftovers Miami, the suite catering menu, Axios, Veggl): Hard Rock Stadium (the free one), Kaseya Center,
  loanDepot park, Amerant Bank Arena (no items yet). **Depot > Venues** (`/admin/depot/venues`, Directory in the Go to menu):
  the reports (`#list/pending|accepted|agreed|declined`), one report (`#r/<id>`: the photo, how far away, the item, the other
  reports on it, **Accept**, **Agrees with the first**, **Decline** with a note; `ve_venue_report_review`, grant reason
  `venue_report`), and the venues, stands and items to edit, with Find it on Google and Start a new season. Accepting a
  correction pays; the team changes the item itself. Proven 2026-10-28 in a rolled-back transaction with two internal accounts
  (too far refused; 100, 25, 10 and 0 paid; Still accurate marked the item checked); it found the ledger refusing
  `venue_report`, fixed the same day. **Launched 2026-10-29** (Sean: "launch"; migration `20261029_stadium_guide_launch.sql`): the
  `ve_guides` row `stadium-arena-guide` is published ($11 or 1,100 points, Hard Rock Stadium free), the page is indexed, and its card
  is fourth in the Guide catalog (`ve-guide-catalog.js`, label Game Day, banner `public/guides/stadium-arena-guide.jpg`: River in the
  black tee holding a plant-based hot dog and nachos, the locked banner style). River's lines show as text; `CLIPS` is still empty.
- **The map and Get me there** (Sean, 2026-10-28: "show a map of the stadium and where these things are with a locator icon...
  be anywhere in the stadium and... show me where exactly to go"; migration `20261028_venue_maps.sql`). `/public/ve-venue-map.js`
  (`VEVenueMap.svg`, `find`, `route`) draws our own map of the bowl from `ve_venues.layout` (each level's sections in clockwise order
  by side: top, tr, right, br, bottom, bl, left, tl; innermost level first), never the venue's seating chart, with a numbered pin for
  each stand's `ve_venue_spots.map_sections` ("122A" sits behind 122; `map_level` for a stand we only know the level of). On an open
  venue, **Your section** + **Get me there** routes from the section on the ticket (kept in `localStorage` `ve_sa_seat_<slug>`):
  the nearest spot of each stand, up or down a level, then "walk with the field on your right/left, past ..." and minutes (60 m a
  minute around `layout.ring_m`, 3 a level), drawn on the map. Not GPS: inside a stadium it is off by several sections and worse
  under a roof; a moving blue dot needs the venue's own beacons (a partnership, the Dolphins first). Hard Rock Stadium's layout was
  read from its seating chart (Sean's screenshot, 2026-10-28); the others wait on theirs (Depot > Venues > a venue > The map, JSON;
  a stand's Sections on the map).
  **Desktop is half and half** (Sean, 2026-10-28: "put the image to the right and the information to the left... a half situation"):
  the map sticks on the right while the left holds Get me there, the directions and the stands (`mapPanel`, `.sa-vgrid2` grid areas),
  so a pin's stand comes up beside the map, outlined; phones keep one column (Your section, the map, the directions, the stands).
- **Update, Comment and points by photo** (Sean, 2026-10-29: "when it says wrong... maybe it's update... maybe it's comment... leave
  a photo, leave a comment. And each thing could have its own amount of points... It has to be approved"; migration
  `20261029_venue_comments_points.sql`). Every item has **Still here**, **Update** (Something changed, kind `wrong`, or Not there
  anymore, `gone`) and **Comment** (`comment`); a photo is optional on all of them and pays more. The amounts are rows in
  `ve_venue_report_points` (with_photo / no_photo, and agree_* for an update that agrees with the first), read by the review, the
  Guide's Help keep it right table and Depot > Venues, so changing one is a row: Update and Something missing 100 / 50 (agrees
  25 / 15), Still here 10 / 5, Comment 10 / 5 (Logan's defaults replacing the locked 100 / 25 / 10, Sean's to change). Still the
  phone inside the venue for every kind, 5 paid a day, nothing paid until accepted; a comment the team accepts shows under the item
  with the member's first name, last initial and photo (`comments` in `ve-venues` `venue`, signed links).
- **Venue pictures and Choose your stadium** (Sean, 2026-10-29: "an image of that arena in our GeekFon style... They need to see that
  visual of these are the different stadiums"). Each venue has its own illustration in the community art's style (Higgsfield
  nano_banana_pro with the South Florida banner as the style reference, no text or logos; `public/guides/venues/<slug>.webp`,
  `ve_venues.image_url`), and the Overview is **Choose your stadium**: one line on what it is for, the venue picture cards, then Help
  keep it right (River photographing a bowl at a stand, `river-report.webp`) and Get every venue. The cards are two across beside
  River and fill the width once he is hidden.
- **Kaseya Center, Amerant Bank Arena and loanDepot park have maps too** (2026-10-29, from Sean's seating chart screenshots;
  migration `20261029_venue_maps_three.sql`): Kaseya 100, 300 and 400 levels; Amerant 100, the club's C sections (typed as on the
  ticket, C27) and 300; loanDepot drawn with home plate at the bottom (Promenade 1 to 40, Legends 200s, Vista 300s and the Home Run
  Porch on top). The middle is a court, a rink or a diamond (`fieldSvg`), and directions say the court or the rink. Their stands are
  pinned by section (Kaseya 105 and 117; loanDepot 19, 205 and 40); two stands at one section sit side by side.
- **Up the East Coast** (Sean, 2026-10-29: "Central Florida... Atlanta... Philly... New York... then we can launch the guide";
  migration `20261029_venues_east_coast.sql`, run through the one-time `ve-once-venues-east`, now the 410 stub, since it was too
  long to paste). 18 more venues, each with its illustration and Google place: Central Florida (Camping World Stadium, Kia
  Center, Inter&Co Stadium, Raymond James Stadium, Benchmark International Arena), Atlanta (Mercedes-Benz Stadium, State Farm
  Arena, Truist Park), Philadelphia (Lincoln Financial Field, Citizens Bank Park, Xfinity Mobile Arena, Subaru Park) and New York
  (MetLife Stadium, Yankee Stadium, Citi Field, Madison Square Garden, Barclays Center, UBS Arena). Items come from 2024 to 2026
  sources (venue pages, team sites, PETA, VegNews, Veggl, local news) read through search, since those sites are not reachable
  from the build session; anything known only from before 2024 was left out and anything unclear is Ask before you order.
  Camping World Stadium, Inter&Co Stadium, Subaru Park and Barclays Center have no confirmed Vegan stand yet. Central Florida's five have
  maps (2026-10-29, from Sean's screenshots; migration `20261029_venue_maps_central_florida.sql`: Camping World's 100s, Plaza P and C
  sections and 200s; Kia Center's 100s, lettered club sections and 200s; Inter&Co a soccer pitch, `field` `soccer`, lower 2 to 36 and
  upper 100s; Raymond James 100s to 300s; Benchmark 100s, club C1 to C9, 200s and 300s). Atlanta's three and Lincoln Financial Field the same day (migration
  `20261029_venue_maps_atlanta_lincoln.sql`; Truist Park with home plate at the bottom, its infield boxes 10 to 42 on the 100 level;
  The Mac Shac's club pin is C238). The map's frame fits its outermost ring (a fourth level used to run off the edge). Philadelphia's
  other three the same day (migration `20261029_venue_maps_philadelphia.sql`: Xfinity Mobile Arena as a court, its loge boxes 1 to 82
  and A to R left off; Citizens Bank Park with home plate at the bottom and its lettered sections B to F on the 100 level; Subaru Park a
  soccer pitch). MetLife Stadium the same day
  (migration `20261029_venue_maps_metlife.sql`, from the stadium's own level charts; the 200 level's b sections are their own ring).
  Citi Field, Madison Square Garden and Barclays Center the same day (migration `20261029_venue_maps_new_york.sql`: Citi Field with
  home plate at the bottom, its lettered and 14 to 16 sections on the field level; the Garden's floor sections 1 to 12, its 400s on
  the West balcony and its 300s the bridges and East balcony; Barclays' lower bowl 1 to 31). Yankee Stadium and UBS Arena wait on
  seating charts. **Choose your city**: the Overview and Venues tabs have a City dropdown (the chapters with venues, then All
  cities; `sessionStorage` `sa_city`, South Florida first). **River steps aside once a visit**: shown on arrival, folded the first
  time they open Venues or a venue (`sa_river_auto`); shown again by hand, he stays. A pin's stand outline is drawn inside the card
  (`inset` box-shadow), so the scrolling column never clips it.
- **Numbered stands, one Update button** (Sean, 2026-10-29: "all of the location items say 1, and there are no numbers next to the
  other locations"; "just save and update... when they click update, it takes them to... that page"). Every stand carries its
  number; a pinned stand's pins wear it once per spot it sells from ("5 spots on the map"), one we only know the level of says Not
  on the map yet, and a tapped pin lights alone. An item shows only Save and **Update**, which opens `#/venue/<slug>/report/choose/
  <item>` (`viewChoose`): Still here, Something changed, Not there anymore and Comment, each with its points, then its form. A stand
  can carry a warning (`ve_venue_spots.note`, shown on the card): Full Bloom at Kaseya Center, whose Miami Beach restaurant closed in
  2025, says check it is still open and its items are Ask before you order (migration `20261029_full_bloom_kaseya_note.sql`).
- **Bounties: first to confirm** (Sean, 2026-10-29: "a higher bounty for the first time somebody... confirms the information, and
  then afterwards the price goes down... you want to be first to action... somebody can go around an airport in one afternoon and
  probably get 1,000 points"; migration `20261029_venue_bounties.sql`). Both venue Guides. Still here on an item no member has
  confirmed in 35 days (or ever, or since the new season; `ve_venue_item_bounty_open`) pays the bounty
  (`ve_venue_report_points.first_with_photo` / `first_no_photo`, 50 / 25), then its usual 10 / 5 until it goes stale again; the
  paid report is `bounty` true. First is by submission: `ve_venue_report_review` refuses a confirmation while an earlier one on the
  same item waits (`earlier_pending`). Limits in `ve_site_settings` `venue_bounties` (fresh_days 35, daily_paid_cap 40, daily_reports
  60; were 5 paid and 20 sent). The Guides tag each open item **Bounty: first to confirm** and each venue card **N bounties open**;
  `/bounties` has the always-open card **Be first at the stadiums** (`?campaign=venues`, `ve-venues` `bounties`: by city, each venue's
  open items and points, no item names, only Guides that are published). Defaults Logan set, Sean's to change.
  **Bounties unlock with the Guide** (Sean, 2026-10-29: "once you purchase a guide, you have a new set of bounties that unlock"):
  only a Guide's owners (and super admins) send reports, the free venue included (`ve-venues` `report` answers `guide_required`);
  the Bounty tags show to owners only, and `bounties` lists a Guide's venues to its owners and only `locked` (venues and points
  waiting, with Get the Guide) to everyone else. Every Guide's Get access lists Bounties.
  **The Overview** (Sean, 2026-10-29: "lay out a little bit more of what this is... the four most recent... stress the idea that
  they can save the listings... the members help keep it accurate... make them excited about getting into it"): both venue Guides
  open on the same layout (`viewOverview`, its words in `OV` in each script): the promise and Get the Guide or Choose your venue,
  **Try it** (a working Get me there on the free venue from a set start, D7 at FLL, section 124 at Hard Rock), How to use it (pick,
  type your gate or section, save), Built with you (we started with what we could find; members keep it right) beside the
  Bounties card (live points from `bounties`), Newly added (the four latest, `list` `added`), and Get every venue.
  Reworked the same day (Sean: "a little jumbled... have the image... to the right... six different airports... all the way across... if
  Nori's visible... four, but full width"): Try it is its words and result beside the free venue's picture (both open it, starting
  from the demo gate or section), then How to use it, Get every venue, Built with you and Bounties, and Newly added: six across with
  the Guide hidden (`.dg-min`), four with it showing, two on phones. The full list
  with the city filter is the Airports / Venues tab only. Nori's and River's Overview lines are text drafts for Sean.
  **Queued by Sean, not built** (2026-10-29: "let's not steer too far away from the airport guide... we can always cue this for
  later"): `/bounties` as one two-column list (like a person's podcast rows) with search, a type and Guide filter and sort;
  evergreen bounties (check in where you go, volunteer with a nonprofit, is this place still open?); paid jobs such as attending an
  event for us, Level 2 and up, with a stipend; and past event jobs leaving the list once claims close.
- **The Airport Guide, launched 2026-10-29** (Sean: "I love it. Let's lock it and let's launch the airport guide"; migration
  `20261029_airport_guide_launch.sql`; the Overview locked the same day, canon `canon-ve-venue-guides` v3): published, indexed, its
  card fifth in the Guide catalog (label Travel, banner `public/guides/airport-guide.jpg`: Nori in the black tee with a boarding pass
  and a coffee, the locked banner style), its airports in the venue bounties. Nori's lines show as text; `CLIPS` is still empty.
  Built (Sean: "Let's look at the airport guide now"; migrations
  `20261029_airport_guide.sql`, `20261029_airports_seed.sql`, run through the one-time `ve-once-airports`, now the 410 stub). The same
  engine: `ve-venues` serves both Guides (`GUIDES`, the body's `guide`; a venue's kind picks its Guide), the same reports, points, saves
  and Depot > Venues. Page `guides/airport-guide.html` and `guide-scripts/airport-guide.js` (`noindex`, Nori on the right, her lines
  text drafts for Sean): Choose your airport (City dropdown, `ag_city`), one airport per view (`#/airport/<slug>`), FLL free. Stands are
  `zone` `landside` (before security) or `airside`, `map_level` the concourse (or the terminal before security), `map_sections` the
  gates. The map is `/public/ve-airport-map.js` (`VEAirportMap`): `layout.terminals[].concourses[]` with `gates` ('A1-A14') and an
  `airside` group (concourses that share a group connect without screening again); **Your gate** + Get me there sorts the spots it can
  reach after security first, a spot with no known gate sits mid-concourse. Sixteen airports seeded from 2024 to 2026 sources (FLL, MIA,
  PBI, MCO, TPA, JAX, ATL, DCA, IAD, BWI, PHL, JFK, LGA, EWR, LAX, LHR; 114 spots, 153 items), each pinned from Google (`locate`) with
  its illustration (`public/guides/airports/<slug>.webp`). Gate ranges no source confirmed are left empty (EWR Terminal B, LAX, LHR,
  JFK Terminal 5, LGA Terminal C, TPA Airside E). Launch = the `ve_guides` row `airport-guide` published, `noindex` off, a catalog card.
  **Tampa's gates** came from its own gate map (Sean's upload, May 2024; migration `20261029_tpa_gates.sql`): A 1 to 18, C 20 to 45,
  E 62 to 75, F 78 to 90; Panda Express pinned at E69. **The rest as a research bounty** (Sean, 2026-10-29: "let's experiment with
  getting the rest of these items as one bounty that a person can complete for like 150 points"; migration
  `20261029_bounty_map_the_venues.sql`): the Bounties campaign `map-the-venues` (ongoing, South Florida, until 2026-11-12), one bundle
  job, 150 points, one person, seven parts (EWR Terminal B, LAX, JFK Terminal 5, LGA Terminal C, Heathrow, Yankee Stadium, UBS Arena):
  each an official map dated 2024 or later with its link, checked against the official site in Depot > Bounties before paying.

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
  6. where the membership goes (events, Community Managers doing gig work, the apps) and how they see it (live dashboard, a
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
  live between `starts_at` and `ends_at`): a new tool reaches every dashboard as a row, no code. **By kind of listing** (Sean, 2026-10-29: the
  Vegan Social Club's dashboard offered "Check your restaurant for free"; migration `20261029_dashboard_cards_by_kind.sql`): a business
  card's `listing_kinds` names who it is for (null: every listing): food, group, organization (Nonprofits, Rescues, Sanctuaries, Events),
  show, work, brand, person, service (`dashKind` in `ve-claims`; the dashboard's `kindOf` calls groups and organizations `org`: no hours,
  their own Get your page ready words and Opportunities, `ORG_OPPS`). Groups see Host your group on Vegans Explore (the group program,
  interest only until its terms are set), Your events on your page, the Nonprofit Guide, bounties and the Daily Pulse. Every listing counts what a
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
- Next: the sponsorship offer to a store (its page with deals for our members). Amazon Associates is set (`vegansexplore-20`,
  2026-10-29): a product's Amazon link made as a `/go/` link carries it.

## Dashboard versions (Sean, 2026-10-24; built 2026-10-25)

"The dashboard could actually be the main dashboard, and then we have different versions of it. So if they're a coach...
if they're a pre-vegan, the dashboard set up a certain way." One `/dashboard` with four versions: **Business**, **Just
starting** (`pre_vegan`), **Coach or pro** (`coach`) and **Member**. **The survey picks it, not a dropdown** (Sean, 2026-10-28: "I
don't get the drop down... we should know who they are... using a survey to figure out how to tailor this experience for them...
a detailed survey where they can get 250 points... They could save it and come back to it"; migration
`20261028_member_survey_drafts.sql`): the version switch is gone and `members.dashboard_version` is no longer read (`ve-dashboard`
`home` returns `ve_dashboard_version()` and `survey {completed, at, active}`). **Your survey** is the Mission Survey on its own page,
`/dashboard/survey` (`survey.html`, `openSurvey`), the first For you tile until it is done. **It is the member's profile, built like a
dating profile** (Sean, the same day: "treat it like a dating profile where it asks different questions about themselves that will be
added to their profile... a combined 250 points for every question they answer with some questions being worth more than others";
migration `20261028_member_profile_points.sql`): **Your profile** (`VEMissionSurvey.profile`) shows every question as a card, answered
in any order, one question per view (`#q/<id>`, Save and next, Save, Back to your profile), with points earned out of 250 and Answer
the next one. 31 questions: **In your words** (`p_meal`, `p_why`, `p_day`, `p_meet`, `p_fact`, 300 characters, 15 points each) and
the old survey's, now none required; the ones marked `team` (market research) sit under **Help us build your city**, "for the team,
not your profile". The points live in `ve_profile_questions()` (`PTS` in the script only draws them); `ve_profile_answer` saves each
answer the moment it is given (`members.mission_survey_answers` and the columns it maps to) and pays it once (`ve_points_grant`,
reason `profile_answer`, ref `profile:<question>`), never again on a change; complete (`mission_survey_completed_at`) means all 250
earned. `ve-mission-survey` `profile`, `answer`, `save` (`draft`, `draft_save` and `submit` still work). The Guide's setup asks the
same questions one after another (`VEMissionSurvey.mount`, each Next saves and pays that answer, Save and finish later moves the setup
on). The For you tile reads Build your profile / Keep building your profile with the points left (`ve-dashboard` `survey {earned,
total}`). The old survey's 250 had never paid anyone (`award_points_bounty` had no `mission_survey_completed` rule); its two finishers
were paid for their answers by the migration. No other member sees a profile yet. **What matters to you** (q23 to q26) counts Health or
medicine and Coaching or fitness as Coach or pro. `ve-mission-survey` is in the repo since 2026-10-28.
**Your numbers** (Sean, 2026-10-28: "under your role, it says platform health... For the members... what are the three things that
they're going to want to see... their points and their level. And if they're an ambassador, their... commissions"): every member but a
super admin gets three tiles on the Dashboard tab, Your points, Your level (points to the next) and, for an Ambassador, **Earned in
<year>** (this year's commissions but refunds, from `ve-affiliate` `me`), else Joined with your link (`renderMyNumbers`; each opens
Points and levels). Your Role (Platform Health) stays for super admins, Today's Pulse for Community Managers. A version decides only which cards join For you
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

## Continue with LESARUSS (Sean, 2026-10-29)

"A LESARUSS button... like how you do Google... log in here and you immediately get access to any of our communities... at the
passport rate, your passport works... you still got to pay the $11 to get into the other communities." One LESARUSS account signs in
on every brand (migration `20261029_lesaruss_sign_in.sql`, edge function `ve-lesaruss-sso`, HQ `app/connect` and `lib/sso.ts` in
lesaruss/lesaruss-hq).

- **The button is off** (Sean, 2026-10-29: "it just took me to another place where I would have to choose Apple or Google... why
  don't I just use the Google to log in?... let's not push it out to anywhere else... log in the same way and we will pick up on your
  membership"). In its place the sign-in window and `/login` say "Already a LESARUSS member? Sign in with the same Google account or
  email, and we pick up your membership" (`LESARUSS_NOTE` in `public/ve-auth.js`): one email is one account, so Google or a password
  signs in the same account, and a Diplomat comes in through `ve_member_entitled`. The privacy paragraph says the same (2026-10-29).
- **The quiet check** (Sean, 2026-10-29: "If they have an active login session on... their browser... it should pick up on that";
  "build the session pickup"). When someone goes to sign in (`/login`, or the sign-in window opened with no follow-up waiting,
  `showAuthModal` without a callback), `quietPickup` in `public/ve-auth.js` hops the browser once to HQ's `/connect/silent` (lesaruss-hq
  `app/connect/silent/route.ts`): signed in on hq.lesaruss.ai, it comes straight back with a one-time code and `/auth/lesaruss` signs
  them in here (the same code, `ve-lesaruss-sso` and Passport rule as below); signed out, it comes straight back with
  `error=login_required` and the page shows its usual sign-in (`?ve_signin=login|signup` reopens the window, then leaves the address).
  Nothing to see or click either way. Once a tab session (`sessionStorage` `ve_lesaruss_quiet`), vegansexplore.com and its previews
  only, never in a frame, on a brand page (`VE_BRAND`) or for anyone holding a token. HQ answers only return addresses on
  `lesaruss_sso_clients`, anything else a plain 400.
- **The button** sat under Continue with Google in the sign-in window and on `/login` (`LESARUSS_BTN`, `loginWithLesaruss` in
  `public/ve-auth.js`; any element with `data-ve-lesaruss="<path to come back to>"` starts it). It keeps a random state in the tab and
  opens `hq.lesaruss.ai/connect?client=vegans-explore&redirect_uri=<origin>/auth/lesaruss&state=` (a preview of this site uses the
  HQ branch preview, `LESARUSS_HQ`). HQ signs them in, shows who they are and what they get, and on Continue sends back a one-time
  code (kept only as its sha256 in `lesaruss_sso_codes`, two minutes, once; the return address must be on `lesaruss_sso_clients`
  exactly or match its preview pattern).
- **`/auth/lesaruss`** (`auth/lesaruss.html`, `noindex`) checks the state and trades the code (`VEAuth.finishLesaruss`,
  `ve-lesaruss-sso`): a session like ve-auth's. **One email is one `members` row across every brand**
  (`idx_members_email_unique_global`), so the row may be their LESARUSS.ai one: a **Diplomat** (`lesaruss_is_diplomat`, the $111
  membership) is let in as they are; **another brand's account that is not a Diplomat is refused** (`passport_needed`: Get your
  Passport or Become a Diplomat), since its status is that brand's (17 free LESARUSS.ai accounts read as active); a Vegans Explore
  account signs in as it is (waiting for its Passport, the $11 window opens); an email with no account gets one waiting for its
  Passport. Super admins pass.
- **Brand memberships** (Sean, 2026-10-29: "GO"; migration `20261029_brand_memberships.sql`). `brand_memberships` records who holds
  what on which brand: `vegans-explore` passport (paid) or comp (on us), `lesaruss-ai` diplomat. `ve_member_entitled(member)` is
  whether a row's status counts here: a Vegans Explore account (its status is ours, unchanged), a Vegans Explore Passport or comp on
  record, a Diplomat, or a super admin. Every sign-in (`ve-auth` login and both Google paths, `ve-lesaruss-sso`) refuses another
  brand's account that is not entitled with `passport_needed` and an $11 checkout the server makes (`passportNeeded`; no session
  token reaches the browser); the $11 window's button goes there (`_passportNeeded` in `public/ve-auth.js`), and payment returns to
  `/login?passport=paid` to sign in again. `ve-auth` `me` reads such an account as `pending_payment`, so an older session drops to
  the $11 window. Vegans Explore accounts are recorded by trigger (`trg_ve_brand_membership_sync`); another brand's account gets its
  Passport through `ve_brand_membership_grant` (the webhook's `entry_contribution`, the test checkout, `ve_member_admit`, which now
  returns true when it made them a member here), and the webhook's welcome points go to it as a first join. The Diplomat rows follow
  `ve_diplomat_sync`. On 2026-10-29 all 24 active Vegans Explore accounts, the switch accounts, Sean and the two Diplomats stayed in;
  the 16 free LESARUSS accounts (seed, test and internal ones) are refused here.
- `members.diplomat_since` and `ve_diplomat_sync()` (cron `ve-diplomat-sync`, daily) are ready for an account ever made active here
  for being a Diplomat; nothing sets it today.
- `/policies#privacy` says it (One LESARUSS account). Children's brands are never clients.

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
