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
  `guides/ve-discuss.html`, `onboarding.html`.
- **Partner pitch decks**, standalone sales documents with their own footer,
  some marked Confidential: `partners/community-partner.html` and everything
  in `partners/pitches/`. The member nav and its Passport CTA do not belong
  on them.
- **Full-screen app shell**: `app/index.html` (the body does not scroll, so a
  footer would never be seen).

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
- `.news-excerpt` — all 8 `/communities/*/index.html` pages (shared by
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
- Data: `ve-guide` edge function (`status`, `setup`), `members.guide_slug` and `members.guide_setup_at`.
  The dock icon wears the Guide from `ve_guide_flow_state` (`/public/footer.js`), kept in step from
  `ve-guide` status.
- Chat: `ve-auth` `guide_chat_send`, 4 points a message from a monthly allowance (60 points, 300 with
  Passport). "Send us a message" in the conversation opens the old question box (a person answers by
  email) through the dashboard (`ve-open-help`).
- Not yet: the Guide's replies do not read the member's survey answers. That needs the shared reply
  engine (`character-respond`, used across LESARUSS) to take member context.
- Depot > Preview journeys > Your Guide walks every screen (`/guide?preview=<step>`, `PREVIEWS` in
  `guide.html`); a new screen gets a preview there and a line in `JOURNEYS.guide`.

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
