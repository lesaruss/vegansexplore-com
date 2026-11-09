# History: guides-venues

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

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
  the West balcony and its 300s the bridges and East balcony; Barclays' lower bowl 1 to 31). Yankee Stadium and UBS Arena got theirs
  2026-11-01 from Sean's chart screenshots (migration `20261101_venue_maps_ubs_yankee.sql`: UBS drawn for hockey, 100s, 200s with 201A/B
  and 226A/B, 300s; Yankee Stadium home plate at the bottom, the field level, the 200 ring with the Bleachers on its outfield side, the
  Terrace and the Grandstand, the 011 to 029 seats behind home left off), and left the map-the-venues bounty, now five airport maps. **Choose your city**: the Overview and Venues tabs have a City dropdown (the chapters with venues, then All
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
  **A Bounties tab, highest first** (Sean, 2026-11-01: "depending on which stadium they're in, they click the bounties, it should clearly
  list what we want them to do... highest bounty to lowest bounty. So people could literally be Pokemon going to this world"). Both venue
  Guides have **Bounties** after Venues / Airports (`#/bounties`): every venue with open bounties in the picked city, the most points
  first, the top three marked #1 to #3 (owners; anyone else sees the points waiting and the free venue's jobs), and each venue's own list
  (`#/venue/<slug>/bounties`, `#/airport/<slug>/bounties`, also **Bounties** on the venue page): its jobs grouped by what they pay, highest
  first: Find a Vegan item we don't have (Something missing), Be first to confirm <item> (the bounty), then Check <item> is still there,
  each with its stand number (the map's), where it is, what to photograph, the points with and without a photo, and **Do it** opening that
  report form (which keeps the sign-in, Passport and Guide gates). Drawn by `/public/ve-venue-bounties.js` (`VEVenueBounties.board`,
  `venue`, `jobs`) from what `ve-venues` `bounties` and `venue` already return, the amounts from `ve_venue_report_points`; no server
  change. The Overview's Bounties card opens the tab. River's and Nori's lines on it are text drafts.
  **Each job has its own page** (Sean, 2026-11-01: "when they click into it, it should have an image of where it is on the right hand side.
  And it should show the accompanying map... something similar for what we did for the stadium for the airport... where they can find
  directions"): `#/venue/<slug>/bounties/<item>` and `#/airport/<slug>/bounties/<item>` (a job's **Find it**). Left: the points, the job,
  its stand number and where it is, what to photograph, **Do it** (the report form), **Something changed?** (the item's Update), and **Get
  me there** from **Your section** or **Your gate** (the same one the venue page keeps, `seatKey`). Right: the item's photo, else the
  venue's illustration, then the map with only that stand's pin and the walk to it (`VEVenueMap` / `VEAirportMap` `route` to that one
  stand; at an airport it says when the spot is before security). A stand with no section or gate yet says to ask a worker and add it in
  the report. `VEVenueBounties.job` and `wireJob`. Find a Vegan item we don't have has no one stand, so it opens its form directly. Not
  GPS: inside a stadium or terminal a phone is off by several sections.
  **Two photos for Something missing, and shops you scan** (Sean, 2026-11-01: "a slot for the item and a slot for the location... taking a
  photo of the name of the store or restaurant"; "the convenience store places, like the gift shops... 10 points per item... 5 points for
  confirming... it'll just let them know that this item has already been logged"; migration `20261101_venue_shops_scan.sql`, run through
  the one-time `ve-once-venue-shops`, now the 410 stub). **Something missing** in both venue Guides asks for the item and the place's name
  (and, at an airport, before or after security and the gate; at a stadium, the section) in their own fields (`ve_venue_reports.item_name`,
  `place_name`, `place_zone`, `place_where`), with two photo slots, the item (`photo_path`) and the sign (`place_photo_path`); the note is
  optional. It pays its with-photo points only with both photos (`ve_venue_report_review`; a supermarket is its own sign, so the
  Supermarket Guide's one photo still counts). **Scan a Vegan item** (`#/airport/<slug>/report/scan`, `#/venue/<slug>/report/scan`, a
  button on every venue page and a job on its Bounties): pick the shop (`ve_venue_spots.kind` `shop`, the airports' markets and newsstands
  marked so) or a shop not in the Guide yet (its name, where, and a photo of its sign), scan the barcode (`VEScan`, then `ve-products`
  `lookup`, then `ve-venues` `scan_check`). **New there**: Log it, kind `scan`, 10 points once the team accepts it, a photo of the item
  required when the barcode is not one of our products; accepting adds the item to that shop as Vegan with its barcode
  (`ve_venue_items.gtin`, one per shop) and makes the shop first when it is new. **Already logged**: it says so and offers **Still on the
  shelf**, kind `shop_confirm`, 5 points once accepted (a shop item's Update menu offers it in place of Still here). **Waiting**: someone
  scanned it there already. Shop items never pay the first-to-confirm bounty. Amounts are `ve_venue_report_points` rows `scan` and
  `shop_confirm` (Sean's numbers); every report still waits for the team in Depot > Venues, which shows both photos, the barcode with its
  Open Food Facts link and the new shop.
  **Every stand on the map, and Where is it** (Sean, 2026-11-01: "place them on the map and then let them know that we're looking for
  them, so that way we can have it as a bounty"; "all the locations had one... only one of the listings has a number and the rest don't";
  migration `20261101_venue_locate_bounty.sql`, run through the one-time `ve-once-venue-locate`, now the 410 stub). Most stands had no
  section or gate, so only one stand per venue had a pin and Get me there only ever named it (Hard Rock: stand 1 pinned, 2 to 4 not). Now
  every stand in an open venue has its own numbered pin: a stadium stand with no section sits, dashed, in a row under the bowl
  (`loose` in `VEVenueMap.svg`); an airport spot with no gate sits dashed mid-concourse (`q` in `VEAirportMap`). Its card says **Where is
  it? N points** and the directions list it under **Not pinned yet. Help us find them** (`lostTag`, `lostList` in both Guide scripts),
  and it is a job on the venue's Bounties (**Find where <stand> is**). The form (`#/venue|airport/<slug>/report/locate/<spot>`,
  `viewLocate`) asks the section (stadium) or the gate and before or after security (airport), a photo of the stand and its sign, kind
  `locate` (25 points with a photo, 10 without, a `ve_venue_report_points` row; one waiting per stand, one a day per member per stand).
  Accepting it in Depot > Venues pins the stand there (`map_sections`, only while it is still unpinned). `ve-venues` `bounties` and
  `list` count each unpinned stand as one more bounty.
  **The Overview** (Sean, 2026-10-29: "lay out a little bit more of what this is... the four most recent... stress the idea that
  they can save the listings... the members help keep it accurate... make them excited about getting into it"): both venue Guides
  open on the same layout (`viewOverview`, its words in `OV` in each script): the promise and Get the Guide or Choose your venue,
  **Try it** (a working Get me there on the free venue from a set start, D7 at FLL, section 120 at Hard Rock), How to use it (pick,
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
- **Report from anywhere** (Sean, 2026-11-09, playbook `ve-feedback`; Brion Hurley was refused at FLL after his trip): Something missing and
  Comment ask "Where are you?" in all four venue Guides; "I am not there now" sends with no location (`off_site`, `ve_venue_reports.on_site` false),
  held for the team, half the points when accepted, 10 a day (`ve_venue_setting('daily_off_site')`). Every other kind stays on-site only. Depot >
  Venues reads "Not checked on site". Migration `20261109_venue_reports_off_site.sql`, `ve-venues` v15. Handoff
  `docs/handoff/2026-11-09-ve-feedback-report-from-anywhere.md`.
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

## The Supermarket Guide and its sponsorship (LOCKED by Sean 2026-11-01, playbook `ve-supermarket-guide`)

Concept session with V, locked by Sean: "lock it, go with your defaults" (canon `canon-ve-supermarket-guide`; migration
`20261101_supermarket_guide_canon.sql`). **Built 2026-11-01; prelaunch, members only** (below). Sean: "a doorway where the community will always know where to find these
vegan items on the shelves... We get a sponsor, the guide is free, as long as the sponsorship is active... this is a CPG play as well...
they're buying their spot in this massive campaign that starts in Q1."

- **The Guide** (the Dairy Guide's pattern): pick your store and find its Vegan items aisle by aisle; custom shopping lists; the produce
  section (what to buy and why); snack breakdowns; CPG products spotlighted with where to find them; each sponsor's weekly Vegan specials
  (also in the Daily Pulse). **Free while at least one supermarket sponsorship is active**, else $11 or 1,100 points.
- **Stores and the locator**: each chain keeps its one Directory listing (Grocery stores and Vegan aisles, below); each store is a row under
  it (address, pin, chapter), never its own listing; the chain's page gets **Find a store near you**, and its chapters
  (`listings.communities`) come from its real store addresses. Each store carries its own aisle map, started from what the store gives us.
- **Members index the shelves** the way the venue Guides do: confirm or update an item with a photo and an in-store location check, points
  only once approved, first to confirm earns the bounty, later ones a little less.
- **Sponsorship, quarterly from Q1 2027**: **Title Sponsor** $7,500 (one at a time; "brought to you by" on the Guide, every ad, festival
  card and booth and the Daily Pulse; their stores first; their Partner package included; first right to renew); **Supermarket Partner**
  $1,500 a chain ($750 for 3 chapters or fewer: store locator, member-indexed aisle maps, weekly specials in their chapters, ads on their
  store pages, a monthly report); **Product Spotlight** $500 a CPG product line (in the Guide and its shopping lists, where to find it in
  partner stores, one ad rail spot; stacks on the $111 Brand Partner plan); ad slots on the Guide's pages included, sold alone later.
  **Front Row Start**: sign before January 1, 2027, the rest of 2026 is promotion at no charge, first charge in January; the first three
  Supermarket Partners keep their price through 2027.
- **What they buy is the campaign and the 2027 story** (Sean: "it's an opportunity to let them know what we are gearing up to do in
  2027... Simply by appearing on our website they will be able to benefit from all of our promotion"): the Q1 2027 campaign (paid ads,
  festivals and local events with QR cards, social, the Daily Pulse) plus 2027: new markets, a growing social presence, event partnerships,
  the growing Directory, the content creator network and a campaign every quarter. Stated as plans; real numbers reported (221 real
  visitors in October 2026); every sponsored spot labeled Sponsored.
- **First**: Publix for Title Sponsor (five of our chapters, Florida first), then Whole Foods and Sprouts as Supermarket Partners.
- **Built 2026-11-01, not launched** (Sean: "hand it to Logan, build it"; migration `20261101_supermarket_guide.sql`, run through the
  one-time `ve-once-supermarket`). It runs on the venue Guides' engine, `ve-venues` (`GUIDES` `supermarket-guide`: kind `supermarket`): a
  store is a `ve_venues` row of kind `supermarket` with `chain_listing_id` (its chain's one listing), its departments are spots
  (Refrigerated, Frozen, Pantry, Snacks) and its 15 Vegan sections items, each "Aisle not mapped yet" until a member maps it with the same
  reports, photo and in-store location check, review, points and first-to-confirm bounties as the venue Guides
  (`ve_supermarket_seed_store(venue)` gives a new store the template). **Free while sponsored**: `ve_supermarket_sponsors` (tier title |
  partner | spotlight, status pending | active | ended, dates; RLS on, no policies) and its trigger run `ve_supermarket_guide_sync()`, which
  sets `ve_guides.access_rule` of `supermarket-guide` to `free` while a Title or Partner sponsorship is active, else `points`; `ve-venues`
  opens everything (reports too) when the rule is free. Stores came from Google Places: 248 Publix in South Florida (245) and Central
  Florida (3) on 2026-11-01, the import cut short by Google's rate limit. North Florida's 121 went in 2026-11-01 (`import_publix&hub=<chapter>&part=N&of=M` in `scripts/supabase-once/supermarket-import.ts`: one chapter a run, three workers, a retry on 429, three pages a city, a big chapter split into parts to stay under the gateway's 150 s; safe to run again). **Google allows 500 text searches a day for the whole project** (`SearchTextRequest per day`, resets midnight Pacific), shared with the essentials pass, audits, the backlog check and Add a listing; a run cut off by the gateway keeps searching and still spends it. Central Florida's went in 2026-11-02 in three parts (84 searches, metered as `once:publix-import`), so the preview holds **731 Publix stores**: South Florida 245, Central Florida 365, North Florida 121; `ve-once-supermarket` is the 410 stub again. **Publix is the example, nothing more** (Sean, 2026-11-01: "Let's just do Publix as an example and do the rest once a supermarket sponsors. Part of the sponsorship will cover the crawl"; canon v2): Publix in South, North and Central Florida only, to show supermarkets what the Guide looks like; no other chain and no more Publix areas are imported until a sponsorship pays for the crawl. Publix is the first sponsor we approach. **The preview, and stores stay** (Sean, 2026-11-01; canon v3): Publix in a few Florida chapters is the free preview, the way each Guide
features one item free, so every chain sees how it will look. A chain that sponsors keeps its stores in the Guide after the sponsorship ends;
the sponsorship pays for adding its stores (the crawl) and for the bounties we run on them (specials hunts, in-store content, aisle mapping, bigger
rewards). Without a sponsorship updates are organic and earn smaller incentives (not built yet: supermarket report points by sponsorship). The pitch
page says it: slides The preview and With a sponsor (`business/supermarkets.html`).
  The free example is Publix at Brickell Village (`publix-miami-cjalb8`). Page `guides/supermarket-guide.html` and
  `guide-scripts/supermarket-guide.js` (the Airport Guide's layout, `noindex`, Pascal on the right, his lines as text): Overview, **Stores**
  (supermarket, chapter and search, **Near me** by distance, 24 at a time), one store per view (`#/store/<slug>`: its departments and
  sections, Update, Add to my list; each department wears a flat line icon in a rounded square, `DEPT_ICON`, and each section a square photo, `SEC_IMG`, `public/guides/supermarket/<key>.jpg`, illustrative product shots made in Higgsfield 2026-11-01 with no labels, one surface and light, replaced by a member's accepted photo, `photo_url`; Sean: "icons... square rounded corners... thumbnails with photos of those items"). **The store page is three-fourths and one-fourth** (Sean, 2026-11-01: "3/4 with two section next to each other and then for
  the 1/4... advertising reserved for our sponsors... Humble Cabbage and a complimentary Guide"): the departments two across (one under
  1100 px) beside the ad rail (`ve-ad-rail.js` page `/guides/supermarket-guide`, slots `ve-supermarket-guide-1`, the Dairy Guide's house
  campaign, and `-2`, Humble Cabbage's still image; migration `20261101_supermarket_guide_ad_rail.sql`; a sponsor takes a slot by linking
  its campaign). **Each section has its own page** (`#/store/<slug>/s/<item>`; Sean: "How do we see the actual products?"): its photo,
  the aisle as members found it, Tell us the aisle, and **Products to look for**: the Guides' products by type (`SEC_PRODUCTS`: milk,
  yogurt, cheese, butter, ice cream from the Dairy Guide's `ve_products`), marked **Seen at <chain>** when the Guides place them at that
  chain (`ve_product_stores`) and listed first, then **Brands that make it**, the Directory's Food Brands by `product_kinds` (meat,
  meals, frozen, snacks, baked, pantry). A section with neither says so and asks members to add it. Each section row says See N products
  to look for, **My list** (members; ticks in `localStorage` `sg_ticks`), **Produce**, Help keep it right and Get
  access. **Find a store** on every grocery chain's listing (`loadStores` in `directory/listing.html`, `ve-venues` `stores`, `?tab=stores`),
  shown only when we hold its stores, each opening the store in the Guide. Its catalog card is Coming soon (members, Pascal, banner
  `public/guides/supermarket-guide.jpg`). **The pitch** is `/business/supermarkets` (`business/supermarkets.html`, guided view,
  `noindex`): the Guide with a live store, the three tiers, the Q1 2027 campaign, the 2027 story (as plans), Front Row Start, and Email our
  team. **Prelaunch, members only** (Sean, 2026-11-01, after a launch earlier the same day: "The Supermarket Guide is prelaunch. Only
  members can see it... I'm really shopping into supermarkets to launch later on"; migration `20261101_supermarket_guide_prelaunch.sql`):
  the `ve_guides` row unpublished (not sold, the page reads Coming soon), `noindex`, out of the sitemap, and its catalog card Coming soon
  for signed-in members only; Brickell Village stays open by link for the pitch. **The plan**: every supermarket on as a sponsor before Q1
  2027, so their stores are mapped across the country; at launch members flood the stores to catalog what is there and know it is there,
  and a sponsorship unlocks specials pushed to the community, content creation, campaigns that reach further, our events and support for
  nonprofits: the more they sponsor, the further we both go. Not yet: weekly specials, CPG spotlights in
  the lists, sponsor checkout (sponsors are added by hand), other chains' stores.
- **By what it is** (Sean, 2026-11-01: "put dairy, meat... when you click on that, we have all the products together... sort it by the
  type... almond, oat... even banana... then you go into the brand"; migration `20261101_supermarket_categories.sql`). A store's spots are
  six categories (Dairy-free, Plant-based meat and protein, Ready meals, Pantry, Snacks and sweets, Produce) and its items 22 types inside
  them (Milk, Coffee creamer, Yogurt... Fruit), each the thing members map, its aisle at that store in the item's description
  (`ve_supermarket_seed_store`; every store reseeded the same day, before any report existed). `CATS` and `TYPES` in
  `guide-scripts/supermarket-guide.js` give each type where it usually sits (refrigerated, frozen, aisles and shelves, produce), its
  picture and what fills it: the Guides' products by `product_type` (the Dairy Guide's, one table for both Guides) or Food Brands by
  `product_kinds`. The store page has **By what it is** (six category tiles) and **By where it is** (`#/store/<slug>/where`, the types by
  zone). A category (`#/store/<slug>/c/<key>`, tabs, a dropdown on phones) shows every product together with a search, Type chips (Cheese
  adds Shreds, Slices, Blocks, Spreads, Parmesan, Feta), Made from (`BASES`, read from `made_from`; Banana appears once a banana product
  exists), Brand and Where in the store, all in the address (`?t= &s= &m= &b= &w= &q=`); choices come from what the other filters leave.
  Products and Brands each show three rows of 94 px tiles and scroll inside; each type's aisle line follows them (above them when one type
  is picked). **Links back**: a product opens `/products/<slug>` and its brand; a Food Brand's Guide tab adds the Supermarket Guide card
  opening its category filtered to the brand (`shelfHref` in `public/ve-guide-tab.js`), a chain's opens Stores; a product page's Where to
  find it links to its type and brand (`shelfLink` in `public/ve-product-view.js`). `#/c/<key>?...` opens the shopper's last store
  (`localStorage` `sg_store`), else Brickell Village. Today only Dairy-free has individual products; the rest show their brands.
- **Smaller incentives without a sponsorship** (Sean, 2026-11-01: "go with your defaults"; migration
  `20261101_supermarket_standard_points.sql`). A store whose chain has an active Title or Partner sponsorship (`ve_venue_sponsored`,
  `sponsoredChains` in `ve-venues`) pays the full `ve_venue_report_points` and the first-to-confirm bounty; every other store pays the
  standard amounts (`std_*`: a correction or missing item 40 / 20, agreeing 10 / 5, Still here and comments 5 / 2) and has no bounty
  (no Bounty tags, not on `/bounties`). A report keeps whether its store was sponsored when it was sent (`ve_venue_reports.sponsored`,
  trigger `trg_ve_venue_report_sponsored`), so a sponsorship ending while it waits never lowers it. Stadiums and airports always pay in
  full. The Guide's Help keep it right table shows both columns; Depot > Venues pays and labels the right amounts. Proven 2026-11-01 in a
  rolled-back transaction (unsponsored correction 40, Still here 2 with no bounty; with a Publix Title sponsorship the first confirm 50
  and the bounty).
- **Scan, macros, votes within the brand and picks in recipes** (Sean, 2026-11-01: "a tab where they can scan an item... it should
  take them to its profile... each brand to have all of their products listed... see the nutrition value, which supermarkets carry it...
  vote for it within the brand. So you're not going to see the rankings anywhere except when you click on the brand itself... If the
  ingredient calls for coffee creamer... pick and choose which coffee creamer they want... save it"; then "Could we also list the macros
  of the item?"; migrations `20261101_product_barcodes_macros.sql`, `20261101_recipe_ingredient_types.sql`; edge function `ve-products`).
  **Barcodes**: `ve_product_barcodes` (GTIN padded to 14 digits, `ve_gtin`), one row per item, tied to its product line, with its Nutrition
  Facts and macros; 1,044 filled 2026-11-01 from USDA FoodData Central's Branded Foods (every record of each brand, matched by kind,
  nothing whose ingredients start with milk or cream or list whey, casein, lactose, egg or honey; "almond milk (water, almonds)" is fine;
  `ve_usda_label` builds the label per serving with FDA rounding) and, for lines USDA lacks or holds only broken records for, Open Food
  Facts (`ve_off_label`, CC BY-SA; no serving on record means the FDA reference amount: butter 1 Tbsp, cream cheese 2 Tbsp, cheese 30g,
  grated parmesan 2 tsp). An item whose record is impossible (Natural Bliss Hazelnut, 4g protein a tablespoon) never stands for its line.
  **Macros**: `ve_products.macros` `{serving, cal, protein, carbs, fat, fiber, sugar, sodium, item}` from the line's plain or original item
  (84 of 86 lines; 3 before), shown by `/public/ve-macros.js` (`VEMacros.strip`, `line`, `per100`, `amount`): a strip on every product page
  (`.pv-mac` in `ve-product-view.js`, the chosen version's own), protein and calories on the Supermarket Guide's tiles and the brand's
  Products tab, and Sort products (Most protein, Most protein per calorie, Fewest calories, `o` in the address). **Scan** is a Supermarket
  Guide tab (`#/scan`, `#/scan/<barcode>`, open to everyone): `/public/ve-scan.js` (the browser's BarcodeDetector, else ZXing 0.21.3 from
  jsDelivr for iPhone, or type the number; nothing recorded); ours opens with the line's name, the item, macros, Open its page, Every <type>
  like it and Carried at; anything else shows what Open Food Facts says (CC BY-SA, read live, its Vegan status, macros per serving or 100 g)
  and **Add it** (`ve-products` `add`, members, 20 a day: a pending row the team approves to its product line in **Depot > Venues >
  Barcodes**, `#barcodes`). **Votes within the brand**: `ve_product_votes`, one per member per product (`ve-products` `votes`, `vote`); a
  brand's Products tab and Overview list its products most voted first with **#N at <brand>** and a Vote button, and nowhere else shows the
  rank. **Picks in recipes**: `recipes.ingredient_types` (set by trigger from each line, `ve_ingredient_type`), so a Cookbook recipe line
  that calls for milk, creamer, yogurt, butter or a cheese has **Pick your <type>** (the Dairy Guide's recipe view): a window of every
  product of that type with its macros (sort by protein or calories), saved per member (`ve_recipe_picks`, `ve-products` `pick`, refused
  for a product of another type), shown in their recipe with its picture, macros, its page and **Buy it online** (an Amazon search with our
  tag), and the recipe adds up the picked products' macros at the amounts it calls for, per serving. `ve-products` also takes the ops token
  with `as_member`. Proven 2026-11-01 as the Logan test account (vote counted once and taken back, a pick saved, a wrong type and an
  untagged line refused, then cleared). Three came from the brands' own pages (20261101_product_brand_site_labels.sql): 365 Non-Dairy
  Cheddar Slices and 365 Nondairy Almondmilk Yogurt from wholefoodsmarket.com (365's nondairy yogurt is almond milk, not coconut; the
  Dairy Guide entry was corrected) and Panacheeza from panacheeza.com (fat and carbs from its % Daily Value). Om Sweet Home (no website found)
  and Vlendedful (vlendedful.com no longer resolves) have no label; both listings are Permanently closed (Sean, 2026-11-01). **A closed brand's products leave the Guides** (Sean, the
  same day: "check and take them out"): the Supermarket Guide, the Dairy Guide's brands and recipe picks and a store's Vegan aisle leave
  out any brand whose `business_status` is CLOSED_PERMANENTLY (the product page still opens by link). That took out Om Sweet Home,
  Vlendedful, Parma! (eatparma.com no longer resolves) and NadaMoo! (nadamoo.com reads Opening Soon, no shop); Lavva, marked closed on
  2026-10-25 with no note, was selling on lovvelavva.com and is open again (migration `20261101_lavva_open_again.sql`). **Every closed brand
  checked the same day** (Sean: "check the other brands marked closed too"; migration `20261101_closed_brands_review.sql`): Calypso
  Bites' store was live, so it is open again; Rhythm Superfoods' domain now serves an unrelated site, so it stays closed and its
  website link was cleared; Sweet Earth Foods stays closed (Nestle's site refuses us, and VegNews finds it nowhere); Immaculate Vegan
  (Sean) and NadaMoo! (Sean: "leave NadaMoo closed") stay closed. Not yet: the
  other Guides' recipe views.
- **The Tracker** (Sean, 2026-11-01: "it should put it... as a pending item, so that way they can track it... show on their tracking list
  that it was approved and if they got any points for it... a history of it over time... maybe the tracker"; "show bounties as well...
  search by location"; migration `20261101_product_tracker.sql`). The Supermarket Guide's Help keep it right tab is now **Tracker**
  (`#/tracker`, `#/report` forwards): **Your activity** (points earned, scans, products added and approved, aisle reports accepted; filter
  Everything / Scans / Products you added / Aisle reports; every row by month with its date, status and points), **Open bounties**
  (`#/tracker/bounties`: search, a chapter, Near me by distance; each venue opens in its Guide, a Guide they do not own shows locked;
  `ve-venues` `bounties` returns each venue's `lat`/`lng`) and **How points work** (the old table). Every scan by a signed-in member is a
  `ve_product_scans` row (once per barcode every 10 minutes); a product added from Scan shows Waiting for the team until Depot > Venues >
  Barcodes approves it, which pays the adder **25 points** once (`ve_site_settings` `product_barcode_points`, reason `barcode_add`, ref
  `barcode:<gtin>`, `ve_product_barcodes.points` and `paid_at`; Logan's default, Sean's to change). `ve-products` `tracker`. Supermarket
  bounties exist only at sponsored chains, so today Open bounties shows the stadiums and airports. Proven 2026-11-01 as the Logan test
  account (two scans logged, an add approved for 25 points and shown on the Tracker).

## The Vegan Theme Park Guide (LOCKED by Sean 2026-11-04, playbook `ve-theme-park-guide`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-theme-park-guide`; migration `20261104_theme_park_guide_spend_budget_canon.sql`; handoff
`docs/handoff/2026-11-04-ve-theme-park-guide.md`). **Magic Kingdom is built and launched (below); nothing else is built.** Sean: "Theme park guide. A growing number of different theme parks, starting with the
most popular... put pins where the restaurants are... whatever restaurant they're in, they can do the location thing, put where they are on the map and see
the distance. It will be a paid guide, but they get one theme park on it."

- **One Guide for every park, on the venue Guides' engine** (`ve-venues`, see Venue Guides): a park is a venue (new kind `theme_park`; the `ve_venues` kind
  check allows only stadium, arena, airport and supermarket today), each restaurant a spot with a pin, each dish an item labelled Vegan, Vegan on request or
  Ask before you order, with a source and a last-confirmed date. Reports, first-to-confirm bounties and the 35-day stale rule are reused. Copy
  `guides/stadium-arena-guide.html` and `guide-scripts/stadium-arena-guide.js` (template gate), never a blank file.
- **$11 or 1,100 points, Magic Kingdom free.** Wave 1 (Central Florida, Tampa Bay is inside the chapter): Magic Kingdom, EPCOT, Animal Kingdom, Hollywood
  Studios, Universal Studios Florida, Islands of Adventure; later SeaWorld, Busch Gardens Tampa, LEGOLAND Florida, then other chapters. Pilot first.
  River narrates (lines are text drafts; Dani is the alternative). Name: The Vegan Theme Park Guide; park names are plain text with a not-affiliated line.
- **The map**: our own schematic, never the park's map art. Parks are outdoors, so GPS works: a you-are-here dot with an accuracy ring and a distance to each
  restaurant in feet and miles, straight line times about 1.3 and labelled "about N on foot", never turn-by-turn. The location-check radius is set per park
  from the farthest pin plus 100 m (`radius_m` accepts 50 to 5000; guesses: Magic Kingdom about 700 m, EPCOT about 1,000 m).
- **Votes** are on spots and dishes inside the Guide (`ve_guide_votes`, new kinds), not Directory listings. **Menus**: Vegan and Vegan-on-request items only,
  with a link to the park's own menu. **Sources**: no crawler on park sites until their terms are read; read published menus one by one, keep item names and
  the park's own plant-based marker with a source link and date, never copy descriptions or photos, never infer. **Pictures**: from approved member reports;
  no generated pictures of named park dishes; no park logos or characters; our Guides only, in the Vegans Explore Tee or store clothing.
- **Google** runs under the $50 cap (Google costs): the pilot is about 25 searches plus 70 details (about $2.75 at list), wave 1 about 570 calls (about $16),
  both estimates. Approve each scan with `ve_google_approve('once:<task>', ...)`. Risk: Google may snap in-park pins to the park centre; OpenStreetMap (free,
  ODbL attribution) is untested. **No sponsors now** (the Supermarket rule).
- **Build order**: the `theme_park` migration, the Magic Kingdom pilot import with pins checked by eye, the page and GPS park map (`VEParkMap`), menu
  sourcing, reports and bounties and votes, waves 2 and 3, launch per `docs/guides/BUILD-A-GUIDE.md`.
- **Built 2026-11-04** (Sean saw the pilot's pins and said "Pins are good, go ahead with the page"; branch `claude/peaceful-gauss-yf6idf`, not on `main`):
  migrations `20261104_theme_park_guide_kind.sql` (the `theme_park` kind, `ve_venues.resort`, the unpublished `ve_guides` row `theme-park-guide`, Magic Kingdom as the
  `free_example` venue) and `20261104_theme_park_guide_magic_kingdom_pins.sql` (`ve_venue_spots.latitude`, `longitude`, `google_place_id`, `pin_source`, `land`,
  `ve_venues.menu_url`; 24 restaurants, 23 pinned from Google, radius 410 m = farthest pin 309 m plus 100 m). The pilot (`once:theme-park-magic-kingdom`, 25 searches,
  0 details, $2.75 approved; script `scripts/supabase-once/theme-park-pilot.ts`, function now the 410 stub) saved nothing; the pins came from its output. **Aloha Isle**
  matched a place 5.9 km away, so it is a spot with no pin ("Not pinned yet"); the stadium's Where is it flow is not reused here, so it waits for a hand pin.
  `ve-venues` (v13 from 48a939f4, source sha256 matched) has `GUIDES['theme-park-guide']`, `guideOfKind`, and returns each spot's `lat`, `lng`, `land` and the venue's
  `resort`, `menu_url`; every call from the page sends `guide: 'theme-park-guide'`. **The page** `guides/theme-park-guide.html` and `guide-scripts/theme-park-guide.js`
  (copied from the stadium Guide, `noindex`, River on the right, lines are text drafts, no recordings; tabs Overview, Parks, Help keep it right, My list, Get access)
  with `/public/ve-park-map.js` (`VEParkMap`: our own to-scale drawing of the pins, a you-are-here dot with an accuracy ring, a land chip filter, distance in feet
  under a tenth of a mile else miles, straight line times 1.3 as "about N on foot"; the location stays in the page). Left out of the copy because they are stadium
  sections: Bounties, Scan, Where is it. Reports (Still here, Update, Comment, Something missing) reuse the venue engine and its location check against the park's
  radius. **Items, 2026-11-04**: the park's terms were read (Disney's Terms of Use bar robots, scripts and scraping and copying its products, so nothing is ever crawled; items are hand-made, names only, each with its source link and date; the same rules are now in `/policies#terms`). Sean pasted Disney's own plant-based list for Magic Kingdom (disneyworld.disney.go.com/dining/plant-based); its items are Vegan with that page as first source, draft items it does not carry are `gone`, and The Diamond Horseshoe was added as a spot (one Google search, $0.04). 25 restaurants (24 pinned), 44 live items, menu link set; the source list and draft are `docs/theme-park/`. **Not built / not proven**: Liberty Square Market is on Disney's list but has no spot, the Disney list changes (check it again before launch), no report sent from inside the park, no signed-in owner run, not in the catalog or sitemap, `ve_guide_votes` kinds for parks, the other five Wave 1 parks.
  Checked in a browser at 1440 and 390 px against the live function with a simulated phone location on Main Street.
  **Launched 2026-11-04** (Sean: "go, launch Magic Kingdom with River"; migration `20261104_theme_park_magic_kingdom_launch.sql`, applied through the connector; branch `claude/busy-heisenberg-8u7ia0`, playbook `ve-theme-park-guide`). Disney's plant-based list was re-checked against Sean's paste the same day: all 44 live items matched. Changes: Liberty Square Market added as a spot (no pin) with "Various snack options"; two items took Disney's wording (Curried Vegetable Crew Stew, Panna-Connie's Congo Lime Delight); spots with no live item (not on Disney's list) set to `gone`, kept not deleted (16 live spots, 45 live items); the `ve_guides` row `theme-park-guide` is published ($11 or 1,100 points, Magic Kingdom the free example); `noindex` off, in the sitemap (`GUIDES`), and a catalog card on Everyday (Theme Parks, River, Magic Kingdom free) that wears a flat icon, since no banner picture exists yet (a banner is Higgsfield credits, Sean's call; a live card with no `banner` falls back to its `icon` in `ve-guide-catalog.js`). Aloha Isle and Liberty Square Market have no pin ("Not pinned yet"). **On `main` at 357d43c9 and confirmed live 2026-11-04** (sitemap lists it, `noindex` gone, catalog card served). Open: a banner picture (Higgsfield credits, Sean's call), the two pins, the other five Wave 1 parks (Sean pastes Universal's terms and each park's own list), `ve_guide_votes` kinds for parks, and unproven: a report from inside the park, real phone GPS, a signed-in owner run, the $11 buy path.
  **Hand pins and the map polish, 2026-11-05** (Sean: "Save both as proposed", "Do the map polish", "Merge it to main"; playbook `ve-theme-park-guide`; migration `20261104_theme_park_magic_kingdom_hand_pins.sql`, applied through the connector; main 52e0e8b). Aloha Isle (28.41838, -81.58246) and Liberty Square Market (28.41955, -81.58250) are pinned by hand, `pin_source` `hand`: **estimates** from the park's layout and the neighbouring Google pins (within about 30 m of a verified pin), not checked against the park; Sean to confirm or send long-press coordinates. All 16 live spots are pinned. `public/ve-park-map.js`: pins that would overlap are spread apart (at most 70 px from their true spot; a displaced pin keeps a small dot and a thin line at its true place, `.vpm-lead`, `.vpm-true`), each land's name takes the first free spot (above, below, left, right) with no pin or other name on it, and the frame has more room (`PAD` 90). Checked live at 1440 and 390 px: no script errors, 16 pins, none outside the frame, 5 spread. The "Show me" corner button covering the phone's land chips is the Guide corner, not a bug. **Not done**: the template-gate screenshot of this Guide beside its parent (the Stadium & Arena Guide) at 1440 and 390 px, so Sean has not yet locked the look; the banner; the commit author on these commits is Claude, not Sean A. Russell (Sean has not said which to keep). Link: https://vegansexplore.com/guides/theme-park-guide#/venue/magic-kingdom.
  **The illustrated park map, 2026-11-05** (Sean: "it's just dots on a grid... I want a visual... uniquely ours but true to the map", then "Go with 1, build the OpenStreetMap map"; playbook `ve-theme-park-guide`). Disney's map art is never copied or traced (their terms, our rule); the map is **our own drawing of OpenStreetMap** (ODbL): each land as its own colored area with an outline (OSM `place=locality` areas), gardens and woods, rockwork, water (Rivers of America, the castle moat, the lagoon), plazas, every walkway, the railroad, every building and the castle, with the pins and the you-are-here dot on top, at true scale. It is `ve_venues.layout.base` (`ve-venues` already returns `layout` for an open venue): decimetres east and north of `base.o` as flat lists, made by `scripts/theme-park/osm_layout.py` from the main OSM API (`/api/0.6/map.json` in four tiles; Overpass refused the database server with 406 and timed out, and the build session cannot reach OpenStreetMap), read and saved through the one-time `ve-once-osm-park` (now the 410 stub); the data is `docs/theme-park/magic-kingdom-osm-base.json` (149 KB, 58 KB compressed), migration note `20261105_theme_park_magic_kingdom_osm_base.sql`. `VEParkMap.svg(pins, {base})` frames the lands plus 35 m, swaps the grid for a 100 m scale bar, credits "Map data © OpenStreetMap contributors" on the map (and `/policies#terms`), keeps each land's name inside its land, and gives a land with no room (Liberty Square) a tag in its color with a line into it. The line under the map says it is our own drawing from OpenStreetMap, not an official park map. A park with no base keeps the grid. A new park: four tiles over it, the script with `--park "<OSM tourism=theme_park name>"`, save the same way. Checked at 1440 and 390 px against the live API with the local scripts (no errors, no sideways scroll). **Merged to `main` 2026-11-05 (2dbf1e3, Sean: "merge it to main and confirm live") and confirmed live**: the live script carries the base, the map draws the park (1,158 shapes) with the OSM credit on it, the caption reads "Our own drawing of the park from OpenStreetMap... Not an official park map", `/policies#terms` has the credit, no sideways scroll and no page errors at 1440 and 390 px. The template-gate screenshots beside the Stadium & Arena Guide were taken the same pass and sent to Sean (same family: header, tabs, $11 box, two-column venue view, map on the right).
  **The restaurant list folds, with votes, 2026-11-05** (Sean: "everything is collapsed. With the voting, so you see them clearly. And it's not the super long scroll... when you click it... it brings it to the top... as you click the other one, it just replaces the one that's at the top... a clear button... that puts it back to one, two, three, four, five"; migration `20261105_park_spot_votes.sql`). Every restaurant beside the map is a card collapsed to its number, name, land, distance, its votes (a heart and the count) and a **+**; opening one (the **+**, its header, or its pin on the map) draws it first and open, the one opened before goes back to its place closed, and **&minus;** closes it. Over the list: **Sort** (Map order, Most votes, Nearest to you once the location is on; turning the location on switches Map order to Nearest) and **Clear** (everything closed, Map order, every land). State is `OPEN`, `SORT` in `guide-scripts/theme-park-guide.js`, kept per park; styles `.sa-fold`, `.sa-tog`, `.sa-listbar` in `guides/theme-park-guide.html`. **Votes** are `ve_guide_votes` kind `park_spot` (the spot's id) through `ve-cookbook` `gvotes` (counts for everyone) and `gvote` (the Guide's owners and super admins, as canon-ve-theme-park-guide says); signed out a vote opens the sign-in window, a signed-in non-owner is told voting comes with the Guide. Checked at 1440 and 390 px against the live data: 16 cards closed on load, the fifth moved to the top open, a second replaced it, a pin opened its card, Clear reset, no sideways scroll. The same pass fixed a source date that read "Invalid Date" (`monthOf`). Not proven yet: a real owner's vote end to end.
