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
  catches the URL before the file is served): `directory/index.html`
  (`/directory` goes to `/communities`), `partner.html` (`/partner` goes to
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
