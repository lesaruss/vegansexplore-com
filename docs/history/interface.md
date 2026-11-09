# History: interface

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

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
  `guides/ve-discuss.html`, `onboarding.html`, `apply.html` (`/apply` goes to `/claim?add=1`, Join the Directory), `welcome.html` (`/welcome` goes to
  `/passport`, the Welcome Guide, since 2026-11-08).
- **Partner pitch decks**, standalone sales documents with their own footer,
  some marked Confidential: `partners/community-partner.html` and everything
  in `partners/pitches/`. The member nav and its Passport CTA do not belong
  on them.
- **Full-screen app shell**: `app/index.html` (the body does not scroll, so a
  footer would never be seen).
- **Ad creatives**, HTML5 ads that load inside an ad slot's frame, not as pages:
  everything in `ads/` (Sean, 2026-10-04).
- **The podcast frame**, a render target for the show's pictures, not a page: `business/podcast-frame.html` (`?kind=episode|youtube|
  story|carousel`, from the podcast's brand kit; 2026-10-31).
- **Depot > Outreach**, `admin/depot/outreach.html`, removed 2026-11-08: a redirect stub to BrandDesk Outreach campaigns.
- **The offline page**, `offline.html`, shown by the service worker (`/sw.js`) when there is no connection, so it cannot count on
  nav.js or the footer loading; it is self-contained (2026-11-07, playbook `ve-mobile-app`).
- **BrandDesk client websites** (the frame), the client's own site, not a Vegans Explore page: `business/site.html`
  (`/business/sample/site`, Green Leaf Kitchen's; every real client's site, served by `branddesk-sites/`). It carries only a small "Managed by Vegans Explore BrandDesk" line (Sean, 2026-10-31).

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
- `.pulse-link-excerpt` — the "In the Pulse" section on a listing's page (`loadInPulse`
  in `directory/listing.html`), each article's summary (`ve_pulse_content.summary`).

**Directory cards in the Pulse (Sean, 2026-11-02).** Every Pulse article carries **In this story** above **On this episode** (one section, grouped by pills: People, Media,
Places, Organizations; each card keeps its vote and opens the listing): the Directory cards of the people, restaurants, brands and groups it names (`api/pulse-article.js`, loaded from `ve_content_mentions`). A listing's page
shows **In the Pulse** with the articles that name it. Matches are built by `ve_content_mentions_build` (cron
`ve-content-mentions`, every 15 minutes, an article once a day or when it changes): a person credited on the episode (not
as its host), the listing's website or Instagram linked in the text, or its full name as whole words (one-word names only for Documentaries & Films).
Our four shows and their hosts, and a stop list of plain phrases, are left out (`c_skip`, `c_stop`). A wrong match is taken
off in **Depot > In this story** (`ve-mentions`); a removed row is never rebuilt. Not yet: the city Daily Pulse topics.

**The episode page's player and people (Sean, 2026-11-03).** Every episode we can match to its feed plays through the show page's own episode row
(`VEEpisodes.row`, docked player, Save), YouTube-video episodes included; only a moment link (`?t=<seconds>`, from the content index's search)
keeps the YouTube player, since that second is timed on the video. **On this episode** lists Guest then Host (`ve_person_credits`), then
**Discussed**: People profiles the episode's own text names, read from the same `ve_content_mentions` matches In this story uses (People
sections only, `PEOPLE_CATS` in `api/pulse-article.js`; a wrong one comes off in Depot > In this story; Discussed people are left out of the
structured-data `actor` list). As transcripts are added the matcher finds more. Klaper's missing Guest credits on two episodes were added the
same day; an episode with a guest but no Guest credit reads Discussed until it is credited (audit open, see the playbook below). The work is
tracked in the playbook `podcast-network-transcript-upload` (all four shows' transcripts; closes when every episode with audio has one).

The cap applies to the card only. Full article and detail views
(`.article-lede`, `.article-p`) are never clamped.

## The new header (Sean, 2026-11-03)

Option A from `/mocks/header`: the default on every page that loads `nav.js` and on the dashboard; `?header=old` turns it off for the visit
(`sessionStorage` `ve_header`), `?header=new` puts it back. Two rows: the logo, one search box that runs from a 24px gap after the logo to a 24px
gap before the right-hand buttons, then Log In and Join (Apps and the avatar signed in); then the menu. Phones: logo, Join and the hamburger, with
the search box on its own row. The search is `VESearch.mount` (`/public/ve-search.js`); desktop keeps the speak-instead-of-type mic (`dictate: true`),
touch devices do not. On a list page (the Directory's sub-sections) the box carries a scope chip, "in Documentaries & Films x", set through
`window.VEHeaderScope.set({label, cat})` and sent to `/search?cat=`; the list's own box reads **Filter**. A banner (`VECityBanner`) outside a chapter hub
is a **one-line page bar** (`vcb-bar`: the title as the way home, the picker, the page's buttons, Share); on phones the page name sits on its own row
and the Directory's sub-section picker joins the section picker in the bar. Since 2026-11-07 the chapter hubs use the same one-line bar (Sean: "remove that expanded menu at the top for the communities... so it matches the rest of the site"); their Page tour button stays in `communities/hub.html`'s actions, hidden by the bar, in case Sean wants it back. In Edit listing, the logo editor's Save and Cancel sit centered under the logo square. **One header, no copy** (Sean, 2026-11-03: "the font is not the same for the dashboard pages versus the non-dashboard pages... why aren't we using the
same elements?... no drift"): the dashboard (`dashboard/center-console.html`) loads `/public/nav.js` like every page and holds no header markup, CSS or
script of its own; `ve-header-search.js` was deleted. Its Directory, Events, Daily Pulse, Media, Guides and Communities are links to the public pages, and
`/dashboard/<section>` and `/dashboard/directory/<slug>` redirect to them (`vercel.json`). Only Dashboard, My Saves and the Depot are under `/dashboard`:
`initDashTabs` opens those three in place when the shared bar's link is clicked (`NAV_TAB`, `markNav`; the Dashboard tab's address is `/dashboard`), every other
link loads its page. The dashboard tour (`public/ve-tour.js`) points at the bar's menu row (`navLink`). A header change is made once, in `nav.js`. Checked
2026-11-03 against a mocked signed-in super admin at 1440 and 390 px beside `/directory`: the same height, fonts and logo, the menu opens the tabs in place, no
script errors. Not done: the city
picker in the menu row, Apps in the account menu, scoping the dropdown (only Enter is scoped), the Events list box wording.

## Every view is a link, and Share on every page (Sean, 2026-11-01)

"I saw somebody on Facebook asking about vegan spots in DC, and I wanted to grab the link when I wasn't logged in... it was just a
generic directory link. So I missed out on that opportunity... I want to be able to copy any page that I see, any configuration that
I see... a unique URL that I can share... a button somewhere on every page that you can copy... If it's not shareable, it's not gonna
go anywhere... We need everybody to share it, even if they're not signed in."

- **The Directory's address carries the whole view** (`writeState`, `restoreState`, `locFromUrl` in `ve-region-directory.js`, on any
  page that passes `config.url`: `/directory` and the dashboard's Directory tab): the section and sub-section as before, the location
  (`?city=<chapter>`, else `?continent=` and `?country=`), the search (`?q=`), the sort (`?sort=`), the shelf's types that are on
  (`?kinds=dairy,meat`) and each filter set away from where it started, by its name (`?vegan=`, `?sells=`, `?cuisine=`, `?type=`,
  `?chain=`, `?area=` for the chapter's city...; `VRD_FKEYS`, `selName`). Paused pills stay out. It is written in place as things
  change (`replaceState`; a section change clears the old section's filters) and read once the listings are drawn, ahead of the
  visitor's kept location. `/directory?tab=food&city=washington-dc` is Local Food in D.C. for anyone who opens it.
- **Events** writes its location too (above, Directory navigation); its kinds, search, sort and Upcoming / Past already were.
- **Share on every page** (`/public/ve-share.js`, `VEShare`): a Share button in `nav.js`'s bar, signed in or out, before Log In or
  Apps (icon only at 1060 px and under), and in the dashboard's top bar. On a phone it opens the phone's own share sheet; elsewhere it
  copies the link and says so. The link (`VEShare.url()`) is the page as anyone can open it: a dashboard address becomes its public
  page (`/dashboard/directory?...` to `/directory?...`, `/dashboard/directory/<slug>` to `/directory/<slug>`, Events, Media, Guides,
  the Daily Pulse and Communities the same; the dashboard itself, My Saves, the Depot and account pages share the home page), without
  sign-in and tracking bits (`vl`, `t`, `view_as`, `utm_*`, `fbclid`...), and with a **signed-in member's own `?ref=<referral_code>`**,
  so the visit counts on their link and anyone who joins from it is theirs (ve-auth.js keeps any page's `?ref=` for the visit). Any
  element with `data-ve-share` shares the page. Each share is a Google Analytics `share` event.
- **Media and framed pages too** (Sean, 2026-11-01: "Everything needs to be able to use that button you just created"): Media's voted
  list writes its name search, sort and filters on (`?q= &sort= &f=status:active,...`) and the episode search (`?search=`) into the
  address and reads them on the first load (`readUrl`, `writeUrl` in `ve-media.js`; `opts.url: false` turns it off). In the dashboard,
  Share sends **the page in the frame** when one is open (a Guide or tool opened with `openConsoleFrame`, or the Daily Pulse tab:
  `framed()` in `ve-share.js`), so a Guide's tab or the Pulse's chapter and board tab go out as their own public address. Member-only
  pages (`/guide`, `/levels`, `/survey`, `/secret-shopper`) share the home page, and `hub`, `embed` and `preview` are dropped.
  City hubs (`?tab=`, `?dir=`), listings (`?tab=`, `?ep=`, `?book=`), Guides (`#/...`) and the Pulse (`/pulse/<tab>?city=`) already
  kept their view in the address. A new view keeps its state in the address the same way, or Share cannot send it. The phone bar was tightened so Share fits
  at 320 px.

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

## Search and share previews, built in (Sean, 2026-10-30)

"When we're building stuff, we're doing it for search and discoverability... not doing it after." Every page that should be found
ships with them on the first pass, never as a later fix:

- **In the HTML the server sends**, not only set by JavaScript: a real `<title>` ("Name — Vegans Explore"), a `meta description`
  (about 150 characters, what the page is), `<link rel="canonical">`, `og:title`, `og:description`, `og:image` (1200 x 630; the
  fallback is `/public/og-default.jpg`, never a file that does not exist) and `twitter:card`. Link previews (Facebook, iMessage,
  Slack) never run JavaScript.
- **A page built from the database** gets a server function that writes them in, like `api/event.js` (every
  `/events?event=<id>`, sent there by `middleware.js` since the static page wins over a `vercel.json` rewrite: the event's title, schema.org Event with status, place, organizer and
  offer, and the event itself as plain HTML inside `#ev-cal`, which `ve-events.js` replaces; 2026-11-02), `api/listing.js` (every
  `/directory/<slug>`, with schema.org data: Restaurant, LocalBusiness, Organization, Person, PodcastSeries, Book, Movie) and
  `api/pulse-article.js` (`/pulse/<slug>`). Change `api/listing.js` with the SEO block in `directory/listing.html` (search "SEO:
  title, OG tags"): both use the same title, the city only for a local business.
- **The sitemap is live**: `/sitemap.xml` is `api/sitemap.js` (the main pages, every chapter, every live Guide, every approved
  listing, every published Pulse article, every live event from the last year on). A new page to be found goes in its `PAGES` or `GUIDES`, a new chapter in `CHAPTERS`.
  Never link a redirect from it.
- Pages that should not be found (samples, Depot, account, welcome Guides for invitees) carry `noindex` and stay out of the sitemap.

## Pictures and page weight (Sean, 2026-10-31)

"The site overall just feels very sluggish." The Rich Roll page flickered on phones and drew only its first episode: every
episode thumbnail was the show's own art at full size (up to 3000 x 3000, 0.1 to 3.9 MB each, 20 a page), and iPhone Safari ran out
of picture memory. The homepage was 8.2 MB, mostly city banners. Rules from that day:

- **Pictures from other sites go through Vercel's resizer**: `/_vercel/image?url=<encoded>&w=<width>&q=75` (`images` in
  `vercel.json`: `sizes` lists the allowed widths, `remotePatterns` the allowed hosts, cached 31 days). An `<img>` with
  `loading="lazy"`, `decoding="async"`, width and height, and an `onerror` that falls back to the original link (`small` and `img` in
  `public/ve-episodes.js`). Ask for about twice the size shown. A new podcast host is a `remotePatterns` row; until then its art falls
  back to full size. Never open the resizer to every host (anyone could run their pictures through our bill).
- **Pictures in the repo are sized before they are committed**: a photo is a JPEG (never a PNG unless it needs transparency), at most
  1920 px wide for a landscape hero, 1440 px for a portrait one, about 900 x 1200 for a Guide portrait, quality about 80. A city banner
  should be under about 500 KB. On 2026-10-31 the Guide portraits (5 MB PNGs) became 100-165 KB JPEGs and the Philadelphia and D.C.
  banners JPEGs; the old PNGs stay for outside links.
- **A listing opened from the dashboard on a phone is its own page** (Sean, 2026-10-31: "it keeps restarting... it locks the whole
  thing, so I can't even click the menu"). `/dashboard/directory/<slug>` frames the listing on desktop only; at 760 px and under,
  `openDashboardListing` (and a script at the top of `center-console.html`, before the dashboard loads) goes to `/directory/<slug>`.
  Framed on a phone, the listing was a fixed 1800 px box that took every swipe (the listing marks itself `ve-embedded`, so `nav.js`
  never sizes its frame) and the phone held the dashboard and the listing page at once, so Safari dropped the frame and reloaded it.
- Not done yet: the homepage loads every chapter's banner at once; `directory/listing.html` loads ten scripts in order before the page
  shows, the admin editor and business dashboard scripts included for visitors.

## No chapter counts in copy or videos (Sean, 2026-11-02)

**The homepage video is `launch-v5.mp4`** (2026-11-08, Sean: "it still says the way to become a member is paying $11"; captions `public/home/launch-v4.vtt`). Only the membership beat changed: Liz's line 15 is now "Becoming a Founding Member is free. Take a short survey, and you get 250 points." (el-media tts in her profile voice, `media/home/launch-line15-v4.mp3`, checked with stt), with that stretch's audio rebuilt from the clean music bed (`launch-bed-v1.mp3` at 0.183) plus only the new line (v4 subtracted the old line from the mix and left an audible garbled copy under it, Sean 2026-11-08; never subtract a line from a compressed mix, rebuild from the stems), and the Richmond card reads **Free / with a short survey** and **250 / points** in place of $11 and 1,100 (Montserrat ExtraBold 56 and Bold 26, #64C368, the same frosted boxes). The old text was taken out frame by frame (inpaint at full strength; on the fades a background rebuilt from the clean frames before and after, warped to the camera move). Every other frame and word is v3's. v3 stays in storage.

"Why are we saying 13? I might decide to have North Carolina be a chapter tomorrow, and then we got to do all these videos over again."
Never write how many chapters or cities we have ("13 chapters", "thirteen") in page copy, a Guide's lines, a recording or a video.
Say "city by city", "every chapter" or "from South Florida to London". A live count drawn from the data is fine. The homepage video
is `launch-v3.mp4` (its city card reads From South Florida to London; the logo sits on a white plate in the official light colors,
since the inverted logo's thin green EXPLORE could not be read over the pictures). Any logo over a picture in a video or graphic
goes on a solid plate.

**The "what's next" video** (Sean approved 2026-11-02: "Very clean and to the point... I approve"): 40 seconds, Liz, what you can do
today for free and what the Passport adds, cut from live-site screenshots with a "Free" and a "With your Passport" label; no jobs board or
classifieds. `vegan-media/media/home/next-v1.mp4` (captions `public/home/next-v1.vtt`) sits on the Passport's Get your Passport page above
the price box for anyone not a member; `next-taste-v1.mp4` (its last line "You've had a taste. Get the rest with your Passport...", captions
`next-taste-v1.vtt`) is the right side of the Taste's last slide (Picked for you). Both use `/public/ve-video.js` (`VEVideo.markup`: nothing
plays until Watch the video, captions on, GA `video_start` / `video_complete` with `passport_next_v1` / `taste_next_v1`); use it for any
other narrated video. Poster `public/home/next-poster.jpg`.

**Never cover a face** (Sean, 2026-11-02: "the covering up Kai's face. It's kind of disrespectful to her"). In a video, graphic or
banner, text, a logo or a card never sits over a person's or Guide's face, and a picture whose crop cuts off faces is not used. A card
over a picture goes on a cityscape or an empty part of the frame; check each card's frame by eye before showing it. The homepage video
opens on Jacksonville, puts the Founding card on Richmond and closes on London at dusk, so no Guide is behind a card.

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
