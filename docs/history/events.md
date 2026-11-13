# History: events

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

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
  banner, on the dashboard or a public page, sits flush under the menu at every width (Sean, 2026-11-01: "I want that banner with the background image to be flushed with the top navigation at all times"; it had a 24px gap above 900 px and none below, so it seemed to come and go: `.vcb` has no top margin in `ve-city-banner.js`, and the dashboard's `main` has no top padding on a tab with a banner).

## The Vegan Events Guide (LOCKED by Sean 2026-11-01, playbook `ve-events-guide`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-events-guide`; migration `20261101_events_guide_canon.sql`).
**Built 2026-11-01, not launched** (below). Sean: "tips on running a successful event... access to resources... where the directory falls into place... address the
elephants in the room... walk people through a journey so that they work with us... apply for a sponsorship from us... what to do when it
rains... interview event hosts... they record their voice... those voice recordings then become part of a podcast."

- **The Guide**, for anyone hosting a Vegan event (potlucks, social clubs, festival promoters, pop-ups, a restaurant's community night, a
  fundraiser), on the Dairy Guide pattern, **River** narrating (Dani keeps the Group Partner Guide), $11 or 1,100 points, included for Group
  Partner leads. Free example: **What to do when it rains** (and heat, no-shows, a vendor who does not show, losing power). It is the top of the
  organizer funnel: Submit an event, Promote your event, Group Partners (tickets at 5%, guest pass, door list), the sponsorship, then the Group
  Partner Guide. Never "Survival Guide" in its title.
- **Tabs**: Overview, Kinds of events, The plan (a 12-week countdown checklist, saved and exportable), Money, Venue, Vendors and food, Gear (the
  shop: every item a tracked `/go/` Amazon link with our tag; partner printers and booth makers later), Getting the word out, Day of, After,
  **The elephants in the room** (no-shows on free RSVPs, the same 40 people, vendors losing money, venues that are not Vegan, sponsors that are
  not Vegan, date clashes, activism vs a good time, insurance and permits, burnout, accessibility), Hosts who've done it, Work with us, My list,
  Get access.
- **Directory**: a new **Services > Event Venues** sub-section and a hosts-events flag on restaurants (change every section list together, see
  Directory filters); the Guide points to Vendors, Food Trucks, Catering, brands that vend, Groups, Nonprofits, Studios, Content Creators, People.
- **Event sponsorship, paid in marketing, never cash**. We give: calendar and chapter Daily Pulse feature, 2 posts and a story, a 2-week chapter
  ad slot, a creator or member covering it, a recap. They give: a 10x10 booth, two comped meals or tickets, our logo, a stage mention, our QR
  cards. A **Represent Vegans Explore** gig on the chapter's Gig Board staffs the booth (points plus the meal, approved like a visit bounty: 3
  photos and a recap). Vegan events qualify; plant-forward events at venues that are not Vegan only for Group Partners; 2 a chapter a month. A
  paginated application to the Inbox, routed to the chapter's Community Manager.
- **Why us** leads with what is true today (13 chapters, 1,000+ listings, the calendar, the Daily Pulse, 5% ticketing, the guest pass); the 2027
  plan is labeled as the plan; no reach we cannot show.
- **Host interviews**: Tell us your story, 6 questions answered by voice in the browser, a release (audio on our shows and site, name credited,
  taken down on request), 100 points once approved. They become clips in the Guide, a **Host Notes** segment on the Vegans Explore Podcast,
  People credits and the content index.
- **Build order**: the shell and the rain tab; the checklist and the gear shop; Event Venues; the sponsorship intake and bounty; the voice
  interviews.
- **Built 2026-11-01** (Sean: "Logan, build the Events Guide"; migration `20261101_events_guide.sql`, applied through the one-time
  `ve-once-events-guide`, now the 410 stub; edge function `ve-events-guide`). `guides/vegan-events-guide.html` and
  `guide-scripts/vegan-events-guide.js` (the Nutrition Guide's shell, `noindex`, River on the right, his lines as text drafts, no recordings):
  Overview, Kinds of events, The plan (the 12-week checklist, ticks in `localStorage` `ev_checks`, Copy it and Print it), Money (a break-even
  calculator, `ev_calc`), Venue and Vendors and food (the Directory's card by chapter, `ev_chapter`), Gear (34 tracked Amazon searches,
  `/go/ev-gear-*`, initiative `vegan-events-guide`), Getting the word out, Day of (the free example, rain, heat, no-shows, a vendor no-show,
  power; `#ev-public`), After, The elephants in the room, Hosts who've done it (our host episodes, `PULSE_PICKS`, and the approved stories),
  Work with us (the sponsorship and its 4-step application `#/work/apply/N`, `ev_apply`), My list and Get access. Everything but the free
  parts is `ve_guides.content_html` (`<script id="ev-data">`), never in the repo. The `ve_guides` row `vegan-events-guide` is published ($11
  or 1,100 points, sort 9) so it sells and opens; Sean holds a comp copy; every Group Partner lead owns it (backfill and trigger
  `trg_ve_events_guide_for_lead` on `ve_group_partners`). Its catalog card is Coming soon, members only, banner
  `public/guides/vegan-events-guide.jpg` (River with a clipboard at an evening outdoor Vegan market, Higgsfield, originals in
  `vegan-media/media/communities/guide-banners/vegan-events-guide-a.png|-b.png`). **Sponsorship**: `ve-events-guide` `sponsor_apply` (anyone,
  3 a day per email) into `ve_event_sponsor_applications`, emailed to the chapter's active Community Managers, else the team, confirmed to them,
  in the Inbox (source `event_sponsorship`). **Depot > Event sponsors** (`/admin/depot/event-sponsors`, Directory in the Go to menu): the
  applications (`#apps/<status>`, `#app/<id>`) with Approve (can post the Represent Vegans Explore gig: 150 points, one spot, `GIG_DEFAULTS`;
  2 a chapter a month, `MONTH_CAP`) and Decline with a note they get; the stories (`#stories/<status>`, `#story/<id>`). **Host stories**:
  `#/hosts/tell/1..3`, six questions (`STORY_QS`) recorded in the browser (MediaRecorder) or uploaded, into the private bucket
  `event-host-stories` (25 MB, audio only) through `story_start` / `story_submit` (an HMAC upload key), saved in `ve_event_host_stories` with the
  release; approving pays 100 points once (reason `host_story`), Removed deletes the audio; approved ones play on Hosts who've done it
  (`stories`, signed links). Both new tables RLS on, no policies. **Services > Event Venues** is a sub-section everywhere the lists live
  (`CAT_MAP`, `SECTIONS`, `KINDS`, `CATS`, and `ve-claims`, `ve-outreach`, `ve-discover`, `ve-listing-intake`, redeployed). It has no listings
  yet; filling it per chapter is a Google search (ask Sean with the count and cost first). Not yet: the hosts-events flag on restaurants, the
  Guide tab mapping (Event Venues and Community > Events), River's recordings, launch (noindex off, the sitemap, the catalog card live).
- **Venues from where Vegan events were held** (Sean, 2026-11-01: "do a scan of the past events for the year in each of those cities and
  look where they held the event... that's a good indicator of where vegans hold their events"; migration `20261101_event_venues_from_events.sql`,
  applied through the one-time `ve-once-event-venues`, now the 410 stub). `events.venue_listing_id` is the listing an event was held at
  (`host_listing_id` stays the group that put it on). `ve_event_venues_sync()` (cron `ve-event-venues-sync`, 08:47 UTC) links an approved event
  whose place name is a listing's name (or starts with it, 8+ letters) in the same city, and keeps the tag **`ve-hosts-events`** (the
  hosts-events flag) on every listing with an event held there in the last 400 days or coming up. The first run linked 74 events to 38 listings
  (Pipoca Vegan, Market on South, DC Vegan, the Maryland sanctuaries...). A listing's Events section reads **Vegan events here** when it only
  hosts others' events (`loadHostedEvents` in `directory/listing.html`), and the Guide's Venue tab lists Event Venues plus every tagged listing.
  **The seed**: the 2026 calendar names 325 places across 605 events; neighborhoods (Partiful gives Philadelphia's events only an area), bare
  addresses with fewer than 3 events, parks, stations, landmarks, homes, gyms, stores and places outside our chapters were left out, 95 kept in
  `ve_event_venue_seed` (76 venues, 19 Vegan or vegetarian food places not yet listed). Their Google look-ups were refused on 2026-11-01 (the day's
  500 text searches were already spent; nothing billed), so one-shot crons run them after the quota resets: `ve_event_venue_search()` at 3:10 AM
  Eastern 2026-11-02 and `ve_event_venue_import()` at 3:25 (job `once:event-venues`): a venue becomes a live **Services > Event Venues** listing
  (Not a Vegan business, Google's address, pin, phone, website, hours and summary, `crawl_source` `event-venue-search`, its events linked); a food
  place waits quarantined in Business outreach > New places > Ready to list; one already listed only gets its events linked. Each seed row keeps its
  `result` (listed, ready to list, already listed, no match, no answer). **Ran 2026-11-02** (the 3:10 cron fired nothing: pg_net clears
  responses after 6 hours, so yesterday's 429s were gone, and the function's counter clashed with the seed's `n` column; fixed in
  `20261102_event_venue_search_fix.sql`, which re-fires any seed with no 200 answer, and run by hand at 3:50 AM Eastern, 95 searches): 69 Event
  Venues live, 7 food places in Ready to list (Karamel N22, Siena's, Candle, The Fresh Beet, Philly Vegan Market, GreenFare, Fruitive), 9
  already listed, 10 no match (four street addresses, Larry Bell Recreational Center, The Lifestyle Building, Hip City Veg in D.C., and Urban
  Vegan Roots, Natuurlik and MOOD, which Google calls permanently closed), 255 events linked, 82 listings tagged `ve-hosts-events`. Each match
  checked against its events' addresses; none set aside.
- **Every event feeds the Directory, and is checked every week** (Sean, 2026-11-02: "we put one thing in, put in one event, and we can
  get a whole bunch of things from that"; "run a scan at least once a week just to make sure the event information is still available";
  migrations `20261102_event_intake_feeds.sql`, `20261102_event_leads_noise.sql`; edge function `ve-event-check`). **Who puts it on**:
  `events.organizer_name` / `organizer_url`, kept by `ve_event_intake` and asked of the Background writer's `events_crawl`. **The weekly
  check** (cron `ve-event-check`, hourly at :23, 12 a run, so each upcoming event about once a week): reads the official page (JSON-LD,
  Partiful's `__NEXT_DATA__`, else Claude), and **cancelled** on the page makes the event `cancelled` (off the calendar; its page stays,
  saying so), a **different date or time** moves ours to match (only when no other event of ours shares the link, a weekly series on one
  page), **postponed** is flagged, a page **gone** (404, 410, parked) twice a day apart is flagged, one that turns us away is Could not
  read, and Instagram and Facebook posts are skipped. It fills an empty organizer, place and city from the page. Every read is a
  `ve_event_checks` row and `events.link_status`, `link_checked_at`, `link_note`, `link_fails`; the event page says "Checked against its
  official page on <date>". **Leads** (`ve_event_leads`, `ve_event_leads_refresh()` after every sweep): the places events were held and
  the organizers they name that are not in the Directory, counted across events; an organizer whose name is a listing's is linked on its
  own (a People listing gets the event as a credit, role Promoter, anyone else hosts it); Partiful neighborhoods, "address shared with
  those registered" and stations are set aside with why (`ve_event_leads_tidy`). **Depot > Events > From our events** (`#leads/venue|organizer/
  new|listed|linked|set_aside`): Add it (`ve_event_lead_add`: a live listing from what the events say, no Google: Event Venues, Groups,
  Nonprofits or People > Promoters, its events linked), Already listed (`ve_event_lead_link`, by slug), Set aside. **Depot > Events >
  Weekly check** (`#checks[/<outcome>]`). **People > Promoters** (Sean: "they're automatically an event promoter... Ella Magers does a lot of
  events... a new tag in addition to her other tags"): a People sub-section everywhere the People list lives (`ve-region-directory.js`,
  `listing.html` reads Event promoter, `ve-listing-admin.js`, Directory review, `ve-claims`, `ve-people`, `ve-discover`, `ve-ambassador`); a
  person credited on an event as promoter, host, producer or organizer gets Promoters among their sections, and Ella Magers has it. **On
  the pages**: a listing's Events section adds **Worked with** (the venues a host used, the hosts a venue had, with event counts;
  `workedWith` in `directory/listing.html`, links to `/events?event=<id>`), and an event's page shows **Held at** (the venue's card with
  its address), **Put on by** (an organizer not in the Directory yet), **People at this event** (credits) and when it was last checked.
  First runs 2026-11-02: 183 venue leads from the 2026 calendar before tidying; 12 events checked (11 read from their own data, one Instagram
  skipped), the Crust meetup moved from November 1 to November 22 as its Partiful page says, 8 events with their organizer. Logan's
  defaults, Sean's to change: once a week, the 30-minute rule, a gone page flagged rather than hidden, leads added by a person.

## The event host path (LOCKED by Sean 2026-11-02, playbook `ve-event-host-path`)

Locked with Logan's panel answers (Sean: "lock it and then deploy"; canon `canon-ve-event-host-path`; migration
`20261102_event_host_path_canon.sql`; write-up `docs/proposals/event-host-path.md`). **Step 1 is built (below); the rest is not.** Sean: "every time we bring a
new event in, we're building our directory in other places... are you running this event? Click here... do you want to do an event
with us?... it's per event." Separate from Group Partners.

- **Every approved event's page** (server-rendered, `api/event.js`) links its people, venue and group, and offers **Are you running
  this event?** into the Vegan Events Guide and a claim.
- **Paid events: 5% a ticket**, no flat fee, the same for everyone. Card processing is on the buyer, and the host may pass the 5% on.
  Member hosts get no lower rate. A ticket of $11 or more makes the buyer a member.
- **Free events are a Vegans Explore sponsorship**:
  - **They give:** "Sponsored by Vegans Explore" on their flyer and page, RSVPs through our page, a stage mention, our QR cards,
    tags on their posts.
  - **We give:** a featured calendar spot, a Daily Pulse mention, a story, the weekly roundup, door check-in, a recap, sponsor prices.
  - Events of 200 or more apply for the Events Guide's full sponsorship.
- **Extras** (the sponsor price is 30% off):

  | Extra | Price |
  |---|---|
  | Pulse feature | $50 |
  | Pinned on the calendar, 2 weeks | $50 |
  | Social push | $75 |
  | Share bounty | $75 |
  | Chapter ad slots, 2 weeks | $100 |
  | A creator at the event | $150 |
  | Recap reel | $150 |
  | Press release | $500 |

  Packages: Spotlight $149, Boost $279, Front Row $499. Each is checked against delivery cost before it opens.
- **$50 in ad credit**, once per host, on claiming their event: our slots only, 90 days, no cash value. It comes with **creative
  support**: we make the ad from what they send, they approve it, one round of changes. Every ad on our pages is made or approved by
  our team, paid ones too.
- **The heads-up email**:
  - **From:** the team, signed by the chapter's Community Manager, never Sean's name.
  - **How often:** at most one every 14 days per host, events grouped.
  - **To whom:** published emails only; in London, business addresses only.
  - **What it says:** no prices.
  - Sean approves the template once; after that it goes out on its own through the outreach people-list engine.
- **Step 1, the event claim, built and live 2026-11-02** (Sean: "start step 1"; migration `20261102_event_claims.sql`, applied
  through the one-time `ve-once-event-claims`, now the 410 stub; `ve-events` from commit 4ec511b, source sha256 matched). Every live
  event's page has **Are you running this event?** under the RSVP box (Your claim is in / approved once they have sent one), opening
  `#claim/<id>` (`drawClaim` in `public/ve-events.js`): their part (I'm hosting it, I'm promoting it, It's at my venue), name, email,
  their group or venue (the name guests see), phone, a link that shows it is theirs (else a note), Send my claim; then a thank-you
  with the Vegan Events Guide. Open to anyone (a host is often not a member). `ve-events` `claim` (public): `ve_event_claims` (RLS on,
  no policies), 3 a day per email, one open claim per event and email, the signed-in account kept only when the claim is in its own
  email; an email to the chapter's active Community Managers (else the team) and a confirmation to them from the team; a [TEST] name
  sends nothing. It is in the Inbox (source `event_claim`). **Depot > Events > Claims** (`#claims/new|approved|declined`,
  `#claim/<id>`): who, their part, their link, whether an account has their email; **Approve** or **Decline** (a note needed, which they
  get). Approving makes them the event's organizer (`ve_event_organizers`, the name guests see, Guests and messages) through
  `ve_event_claim_link`, at once when an account has their email, else when one is made (`trg_ve_event_claim_link` on `members`), and
  emails them their page, Promote your event, and tickets and the sponsorship as coming soon. Proven 2026-11-02 against the live
  function: bad email, role and proof refused, a repeat recognized, a visitor refused the admin actions, a decline without a note
  refused, an approval linking the internal test account, a second approval refused, an approval with no account linking once the
  account appeared (in a rolled-back transaction), the page at 1366 and 390 px with no errors; every test row removed. Not yet: a host
  with no account cannot make one without the $11 (sign-up is the Passport), so the email asks them to reply and the team helps; the
  $50 ad credit on claim waits for step 5.
- **Step 2, the heads-up email, built 2026-11-02, waiting for Sean's approval** (Sean: "Build the list and template on the outreach
  people-list engine... Nothing sends until I approve it once"; migration `20261102_event_heads_up.sql`; edge function `ve-event-headsup`
  from commit 91d3db4, sha256 matched). **On the engine**: the list is `ve_outreach_cities` `event-hosts` (kind people, program
  `event-heads-up`, off, daily cap 30) and the email is `ve_outreach_templates` `event-heads-up` step 1 (draft until approved; any change
  to its words puts it back to draft and switches it off). `ve-outreach` never sends it (it has no contacts there); a host is told again as
  new events come, which the engine's three-step sequence cannot do, so the sending is `ve-event-headsup`. **Hosts**:
  `ve_event_host_contacts`, one per Directory listing that hosts upcoming approved events (`events.host_listing_id`), rebuilt by
  `ve_event_hosts_refresh()` on every tick and overview: the email it publishes (`details.group.contact_email` from `ve-groups`
  `find_contact`, their own site then their Instagram bio, else the listing's `email`) with where it was found; status active, no_email,
  held (London: business addresses only, `ve_is_free_mail`), has_account (an owned listing or a Group Partner, who run it themselves) or
  stopped. **What goes**: `ve_event_heads_up_due()`: an active host, not suppressed, not emailed in 14 days, with new events
  (`ve_event_host_new_events`: approved, ours, 2 to 120 days out, no organizer or open claim, never named to them; up to 8 in one email).
  Weekdays 10 AM to 5 PM Eastern, cron `ve-event-headsup` every 15 minutes, through `email-send` brand vegans-explore (its one-click
  unsubscribe is the brand's permanent suppression), signed by the chapter's active Community Manager else "The Vegans Explore team",
  never Sean's name, no prices (`template_save` refuses both). Each event is its own tracked link (`/go/eh-...`, initiative
  `event-heads-up`, to `/events?event=<id>`, where Are you running this event? is); every send a `ve_event_headsups` row; campaign
  `ve-event-headsup-<date>` in HQ > Email. Replies go to contact@lesaruss.com (email-send has no per-email reply-to). **Depot > Events >
  Heads-up** (`#headsup[/<status>]`, `#headsup/email[/<host>]`, `#headsup/edit`, `#headsup/host/<id>`): the switch, the email as a host
  gets it, Send me a test, **Approve this email** (switches it on), Change the words, each host with Find their email, an email typed
  with where it is published, and Never email them. Proven live 2026-11-02 (unauthenticated calls refused, the tick held while
  unapproved, Find email found three published emails: Plant Powered Metro New York, Vegetarians of Central Florida, Philly Vegan Social
  Club; tests of London Vegan Meetup's 8 events and Philly's to contact@lesaruss.com with nothing recorded; a price refused; switching on
  before approval refused). On 2026-11-02, 15 hosts, 3 with an email; the Meetup-only groups publish none.
- **Build order:**
  1. The event claim (built 2026-11-02).
  2. The heads-up (built 2026-11-02; approved and on 2026-11-03; first send 10:07 AM Eastern 2026-11-03: 3 hosts, none claimed yet; a host with no account is pointed at the free event survey from the claim email and thank-you).
  3. Per-event ticketing.
  4. The sponsorship and extras checkout.
  5. The ad console's credit, booking and creative support.

## The event gates and many at once (Sean, 2026-11-11)

Sean, on 122 events waiting: "I am not going through all 122 of these... why can't we just approve them? Can we put in some
gates?"; "If they are still active, if they have a link to register, it hasn't been canceled, it's not duplicated, I would say we
can roll with it"; "We should automatically defer to the official organization's listing and not put up the meetup group... if
they are two duplicate events, you can flag those and I can choose"; "select multiple and then have an action".

- **The gates** (migration `20261111_event_gates.sql`, `ve-event-check` `gate`, cron `ve-event-gate` at :04, :19, :34, :49, 10 a
  run). Every waiting event the crawl, a flyer or the team brought in (members' own still wait for a person: Logan's default,
  Sean's to change) goes through: (1) duplicates (`ve_event_gate_dupes` over `ve_event_match`: the same local day, and the same link,
  or a near-same name (`ve_event_title_key`, trigram 0.5) in the same city or by the same organizer). The same organizer twice
  (`ve_event_same_org`: the same name, or one starting with the other; with no organizer named, the same link or the same own
  website) is folded into the one we keep (the live one, else the organizer's own page over Eventbrite, Meetup and the like) and
  turned down as "Duplicate of <id>". Two organizations listing one event wait for Sean (`gate_status` duplicate, `dupe_of`), the
  official one recommended. (2) Its official page (the weekly check's `checkOne`): still this event -> live (`gate_status` passed,
  `gate_note`); cancelled -> off; gone (404 or 410 on two checks) -> turned down; a page that loads without the event on it, a 404 once,
  postponed or unreadable -> held, asked again the next day (first run: a Plant Powered Metro New York neoncrm portal page, built in
  the browser, read as "not this event" and was turned down; fixed the same hour, the event put back to waiting).
  Live duplicates are swept the same way each run (`ve_event_live_dupes`: same organizer folded, RSVPs moved to the one kept;
  two organizations flagged, both stay live until Sean picks).
- **The intake** refuses a near-same event by the same organizer on the same day (`ve_event_intake_dupe`), not only the exact name.
- **A series on one link**: the weekly check no longer moves a waiting event's date to the page's next date when another waiting or
  live event shares the link (the Vegan Toastmasters Meetup had three dates on one link).
- **Depot > Events**: every queue has a checkbox per row, Select all shown, and Approve / Turn down for the selection (one reason
  for all; it calls `ve-events` `review` per event, so members still get their email). **Duplicates** (`#dupes`): each pair side
  by side, Keep this one (it goes live, the other is turned down as its duplicate) or Not the same event (`not_dupes`, never matched
  again; the waiting one goes back through the gates). **Held** (`#held`): what the gates could not confirm, with why.
- **Georgia VegFest**: the Atlanta Veggie Eats Meetup copy came down as a duplicate of the official listing (Farm of the Free), on
  Sean's word. The one-time write ran through `ve-once-event-gates` (`scripts/supabase-once/event-gates.ts`), the connector having
  held the second migration.

### Supporting organizations (Sean, 2026-11-11, same day)

Sean, on the pick-one pairs: "If we have an organization that is also hosting their meetup, let's put it underneath that listing.
You know, we don't have to lose it completely, but we can show that these are the organizations that are supporting this event.
And then they can see, click on it and see their listing. So somebody might want to register through DC Meetup... going is going,
right? And it's almost like a referral." "Unless Polar Springs is a sponsor, then it's like, okay, maybe we don't have DC Meetup on
there... But we're not there yet" (not built: a paid promotion hiding supporters).

- Two organizations listing one event no longer wait for Sean (migration `20261111_event_supporters.sql`). The official one (its
  own page over a ticketing or group site, then one tied to a Directory listing, then the live one) stays the event; the other
  becomes a supporter under it: `status` 'supporting', `dupe_of` the event (`ve_event_attach_supporter`, RSVPs move to the event).
  A supporter is off the calendar but readable by anyone (policy "Public can view supporting events").
- **Which one is official** (`ve_event_official_pick`, after the first live run put Poplar Spring Animal Sanctuary's own event under
  the Veg Society of DC Meetup post "VSDC Joins Poplar Spring Animal Sanctuary for Thanksgiving..."): (1) the one whose organizer the
  other's title names; (2) the organizer's own site, then a ticketing page (Eventbrite and the like), then a group post (Meetup,
  Partiful, Facebook, Instagram); (3) one tied to a Directory listing; (4) the live one, then the first in. Poplar Spring was put back
  through the gate the same morning.
- **The event's page** (`ve-events` `event` returns `supporters`; `public/ve-events.js`): under Hosted by and Held at, **Supporting
  organizations**, "Going with one of them? Register through them.": each one's logo and name link to its Directory page, and
  **Register with them** opens its own link.
- **The supporter's own Directory page** (`directory/listing.html`) keeps the event with its own link; the name opens the main event.
- The gate (`ve-event-check`): a waiting event whose official twin is already here goes under it; an official one that passes its
  page check takes the other under it; an event turned down or cancelled releases its supporters back through the gates.
- **Depot > Events > Supporting** (`#supporting`, replacing Duplicates): each event and its supporter, **Make this the main one**
  (`support_swap`) and **Not the same event** (`ve_event_support_release`: back through the gates, never matched again).

## Near me on Events, United States by default (playbook `ve-near-me`, 2026-11-12)

Sean: "Same thing with the events. They can just hit near me and they don't have to do the whole choose the continent". `opts.nearMe` on
`/events` (which now loads `ve-region-directory.js`) and the dashboard mount, menu layout only, through the shared `VERegionDirectory.near`.
Events have no coordinates, so `places()` puts each one at its venue listing, else the ZIP in its address, else its host listing, else its
city (the median of our listings there, shown as "About N mi" so it never reads as exact). Closest first, then Online, then "Location not on
the map yet"; a typed city keeps only what is within 50 miles. `?near=me|<zip>|<city>`; picking a location sets Near me aside. The `load()`
select adds `address, venue_listing_id, host_listing_id`. **United States by default**: `events/index.html` starts on North America > US
when `ve_ev_loc` is empty; any saved pick wins. Of 254 upcoming events on 2026-11-12: 53 had a listing point, 66 an address ZIP, 79 a city
only, 32 no city.
